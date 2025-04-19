#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
// #include <filesystem> // <-- 移除
#include <atomic>
#include <cstring> // <-- 用于 strlen, strerror
#include <ctime>
#include <csignal>
#include <memory>
#include <optional>

// 使用命名空间简化代码
// Add these includes at the top
#include <sys/stat.h> // <-- 用于 stat, mkdir, chmod
#include <dirent.h>   // <-- 用于 opendir, readdir, closedir
#include <unistd.h>   // <-- 用于 access, remove, rename, rmdir, umask
#include <cerrno>     // <-- 用于 errno

// Remove or modify the filesystem namespace
// namespace fs = std::filesystem;  // Remove this line

// 日志级别定义
enum LogLevel {
    LOG_ERROR = 1,
    LOG_WARN = 2,
    LOG_INFO = 3,
    LOG_DEBUG = 4
};

// 高性能、低功耗的日志系统
class Logger {
private:
    // 使用原子变量减少锁竞争
    std::atomic<bool> running{true};
    std::atomic<bool> low_power_mode{false};
    std::atomic<unsigned int> max_idle_time{30000}; // ms
    std::atomic<size_t> buffer_max_size{8192};      // bytes
    std::atomic<size_t> log_size_limit{102400};     // bytes
    std::atomic<int> log_level{LOG_INFO};           // default level

    // 使用共享指针管理资源 (log_dir 不需要共享指针)
    std::string log_dir;

    // 互斥锁和条件变量
    std::mutex log_mutex;
    std::condition_variable cv;

    // 文件缓存
    struct LogFile {
        std::ofstream stream;
        std::chrono::steady_clock::time_point last_access;
        size_t current_size{0};
    };
    std::map<std::string, std::unique_ptr<LogFile>> log_files;

    // 优化的缓冲区 - 使用预分配内存
    struct LogBuffer {
        std::string content;
        size_t size{0};
        std::chrono::steady_clock::time_point last_write;

        LogBuffer() {
            // 预分配内存减少重新分配
            content.reserve(16384); // 初始预分配 16KB
        }
    };
    std::map<std::string, std::unique_ptr<LogBuffer>> log_buffers;

    // 线程控制
    std::unique_ptr<std::thread> flush_thread;

    // 时间格式化缓存 - 减少时间格式化开销
    char time_buffer[32];
    std::chrono::system_clock::time_point last_time_format;
    std::mutex time_mutex;

public:
    Logger(const std::string& dir, int level = LOG_INFO, size_t size_limit = 102400)
        : log_size_limit(size_limit)
        , log_level(level)
        , log_dir(dir) {

        // 创建日志目录
        create_log_directory();

        // 初始化时间缓存 (确保在多线程访问前完成)
        {
            std::lock_guard<std::mutex> lock(time_mutex);
            last_time_format = std::chrono::system_clock::now(); // 初始化为当前时间
            update_time_cache();
        }


        // 启动刷新线程 (使用 make_unique)
        flush_thread = std::make_unique<std::thread>(&Logger::flush_thread_func, this);
    }

    ~Logger() {
        stop(); // 确保停止并刷新

        if (flush_thread && flush_thread->joinable()) {
            flush_thread->join(); // 等待刷新线程结束
        }
    }

    // 停止日志系统
    void stop() {
        bool expected = true;
        // 使用 compare_exchange_strong 确保只停止一次
        if (running.compare_exchange_strong(expected, false, std::memory_order_relaxed)) {
            cv.notify_all(); // 唤醒可能在等待的刷新线程

            // 等待刷新线程结束前先刷新所有缓冲区
            // 注意：这里获取锁可能与析构函数中的 join 冲突，更好的做法是在析构函数 join 前调用 stop
            // 或者在 stop 内部 join 线程 (但要小心死锁)
            // 简化处理：假设 stop() 会在析构函数之前被调用，或者析构函数会处理 join
            {
                std::lock_guard<std::mutex> lock(log_mutex);
                for (auto& buffer_pair : log_buffers) {
                    if (buffer_pair.second && buffer_pair.second->size > 0) {
                        flush_buffer_internal(buffer_pair.first);
                    }
                }
                // 关闭所有文件流
                log_files.clear(); // unique_ptr 会自动管理关闭
            }
        }
    }

    // 设置最大空闲时间（毫秒）
    void set_max_idle_time(unsigned int ms) {
        max_idle_time.store(ms, std::memory_order_relaxed);
    }

    // 设置缓冲区大小
    void set_buffer_size(size_t size) {
        buffer_max_size.store(size, std::memory_order_relaxed);
    }

    // 设置日志级别
    void set_log_level(int level) {
        log_level.store(level, std::memory_order_relaxed);
    }

    // 设置日志文件大小限制
    void set_log_size_limit(size_t limit) {
        log_size_limit.store(limit, std::memory_order_relaxed);
    }

    // 设置低功耗模式
    void set_low_power_mode(bool enabled) {
        low_power_mode.store(enabled, std::memory_order_relaxed);

        // 在低功耗模式下，增加刷新间隔和缓冲区大小
        if (enabled) {
            max_idle_time.store(60000, std::memory_order_relaxed); // 1分钟
            buffer_max_size.store(32768, std::memory_order_relaxed); // 32KB
        } else {
            // 恢复默认值或之前的设置值，这里简化为恢复硬编码的默认值
            max_idle_time.store(30000, std::memory_order_relaxed); // 30秒
            buffer_max_size.store(8192, std::memory_order_relaxed); // 8KB
        }
        // 可以在这里 notify_one() 来让刷新线程立即应用新设置
        cv.notify_one();
    }

    // 写入日志 - 优化版本
    void write_log(const std::string& log_name, LogLevel level, const std::string& message) {
        // 检查日志级别
        if (static_cast<int>(level) > log_level.load(std::memory_order_relaxed)) {
            return;
        }
        if (!running.load(std::memory_order_relaxed)) { // 如果已停止，则不写入
             return;
        }

        // 获取级别字符串
        const char* level_str = get_level_string(level);

        // 获取格式化时间
        const char* time_str = get_formatted_time();

        // 优化日志条目构建 - 减少中间字符串创建
        std::string log_entry;
        // 预估大小，减少重新分配
        log_entry.reserve(strlen(time_str) + strlen(level_str) + message.size() + 10); // +10 for " [] \n" etc.

        log_entry += time_str;
        log_entry += " [";
        log_entry += level_str;
        log_entry += "] ";
        log_entry += message;
        log_entry += "\n";

        // 添加到缓冲区
        add_to_buffer(log_name, std::move(log_entry), level);
    }

    // 批量写入日志 - 高效版本
    void batch_write(const std::string& log_name, const std::vector<std::pair<LogLevel, std::string>>& entries) {
        if (entries.empty() || !running.load(std::memory_order_relaxed)) return;

        // 过滤有效条目并计算总大小
        std::vector<std::pair<LogLevel, const std::string*>> valid_entries;
        valid_entries.reserve(entries.size());

        size_t total_size = 0;
        bool has_error = false; // 用于判断是否需要立即刷新（如果策略如此）
        int current_log_level = log_level.load(std::memory_order_relaxed);

        for (const auto& entry : entries) {
            if (static_cast<int>(entry.first) <= current_log_level) {
                valid_entries.emplace_back(entry.first, &entry.second);
                // 预估大小，包括时间戳、级别、空格、换行符等
                total_size += entry.second.size() + 50; // 50 是一个粗略估计
                if (entry.first == LOG_ERROR) has_error = true;
            }
        }

        if (valid_entries.empty()) return;

        // 获取格式化时间 (批量操作开始时获取一次)
        const char* time_str = get_formatted_time();

        // 构建批量日志内容
        std::string batch_content;
        batch_content.reserve(total_size);

        for (const auto& entry : valid_entries) {
            const char* level_str = get_level_string(entry.first);
            batch_content += time_str;
            batch_content += " [";
            batch_content += level_str;
            batch_content += "] ";
            batch_content += *entry.second;
            batch_content += "\n";
        }

        // 添加到缓冲区
        // 对于批量写入，可以将最高级别（例如错误）传递给 add_to_buffer
        add_to_buffer(log_name, std::move(batch_content), has_error ? LOG_ERROR : LOG_INFO);
    }

    // 刷新指定日志缓冲区
    void flush_buffer(const std::string& log_name) {
        std::lock_guard<std::mutex> lock(log_mutex);
        flush_buffer_internal(log_name);
    }

    // 刷新所有日志缓冲区
    void flush_all() {
        std::lock_guard<std::mutex> lock(log_mutex);
        for (auto it = log_buffers.begin(); it != log_buffers.end(); ++it) {
             if (it->second && it->second->size > 0) {
                 flush_buffer_internal(it->first);
             }
        }
        // 也可以考虑在这里刷新所有打开的文件流
        for (auto& file_pair : log_files) {
            if (file_pair.second && file_pair.second->stream.is_open()) {
                file_pair.second->stream.flush();
            }
        }
    }

    // 清理所有日志
    void clean_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);

        // 关闭并清理所有文件和缓冲区
        log_files.clear(); // unique_ptr 会处理流的关闭
        log_buffers.clear();

        // 删除日志文件 - 使用 POSIX API
        DIR *dir = opendir(log_dir.c_str());
        if (!dir) {
            std::cerr << "无法打开日志目录进行清理: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
            // 尝试使用 system 命令作为后备
            std::string cmd = "rm -f \"" + log_dir + "\"/*.log \"" + log_dir + "\"/*.log.old";
            system(cmd.c_str());
            return;
        }

        struct dirent *entry;
        while ((entry = readdir(dir)) != nullptr) {
            std::string filename = entry->d_name;
            if (filename == "." || filename == "..") {
                continue;
            }

            // 检查是否为 .log 或 .log.old 文件
            bool is_log_file = false;
            size_t len = filename.length();
            if (len > 4 && filename.substr(len - 4) == ".log") {
                is_log_file = true;
            } else if (len > 7 && filename.substr(len - 7) == ".log.old") {
                 is_log_file = true;
            }

            if (is_log_file) {
                std::string full_path = log_dir + "/" + filename;
                if (remove(full_path.c_str()) != 0) {
                    std::cerr << "无法删除日志文件: " << full_path << " (" << strerror(errno) << ")" << std::endl;
                } else {
                    // 可选：打印已删除的文件信息
                    // std::cout << "已删除日志文件: " << full_path << std::endl;
                }
            }
        }
        closedir(dir);
    }

    // 辅助函数，用于 main 循环检查
    bool is_running() const {
        return running.load(std::memory_order_relaxed);
    }


private:
    // 创建日志目录 - 使用 POSIX API
    void create_log_directory() {
        struct stat st;
        // 检查目录是否存在
        if (stat(log_dir.c_str(), &st) == 0) {
            if (S_ISDIR(st.st_mode)) {
                // 目录已存在，检查权限 (可选)
                if (access(log_dir.c_str(), W_OK | X_OK) != 0) {
                     std::cerr << "警告: 日志目录权限不足: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
                     // 尝试修复权限
                     chmod(log_dir.c_str(), 0755);
                }
                return;
            } else {
                std::cerr << "错误: 日志路径存在但不是目录: " << log_dir << std::endl;
                // 尝试使用备用路径或退出
                log_dir = "./logs"; // 切换到当前目录下的 logs
                std::cerr << "尝试使用备用日志目录: " << log_dir << std::endl;
                // 再次尝试创建备用目录 (避免无限递归，这里只尝试一次)
                if (stat(log_dir.c_str(), &st) != 0) {
                     // 备用目录也不存在，继续创建逻辑
                } else if (!S_ISDIR(st.st_mode)) {
                     std::cerr << "错误: 备用日志路径也存在但不是目录: " << log_dir << std::endl;
                     // 无法继续，可以抛出异常或设置错误状态
                     throw std::runtime_error("无法初始化日志目录");
                } else {
                     // 备用目录存在且是目录
                     return;
                }
            }
        }

        // 尝试创建目录 (包括父目录) - 使用 system("mkdir -p")
        std::string cmd = "mkdir -p \"" + log_dir + "\"";
        int ret = system(cmd.c_str());
        if (ret != 0) {
             std::cerr << "无法创建日志目录 (使用 system): " << log_dir << std::endl;
             // 检查是否真的创建失败
             if (stat(log_dir.c_str(), &st) != 0 || !S_ISDIR(st.st_mode)) {
                 std::cerr << "错误: 创建日志目录失败，请检查权限或路径。" << std::endl;
                 // 抛出异常或设置错误状态
                 throw std::runtime_error("无法创建日志目录");
             }
        }
         // 确保目录权限 (例如: rwxr-xr-x)
        if (chmod(log_dir.c_str(), 0755) != 0) {
            std::cerr << "警告: 无法设置日志目录权限: " << log_dir << " (" << strerror(errno) << ")" << std::endl;
        }
    }

    // 获取日志级别字符串 - 使用常量指针避免字符串复制
    const char* get_level_string(LogLevel level) {
        switch (level) {
            case LOG_ERROR: return "ERROR";
            case LOG_WARN:  return "WARN";
            case LOG_INFO:  return "INFO";
            case LOG_DEBUG: return "DEBUG";
            default:        return "UNKNOWN"; // 处理无效级别
        }
    }

    // 获取格式化的时间字符串 - 缓存最近的时间减少格式化开销
    const char* get_formatted_time() {
        // 使用细粒度锁保护时间缓存
        std::lock_guard<std::mutex> lock(time_mutex);

        auto now = std::chrono::system_clock::now();
        // 如果时间变化不大 (例如在同一秒内)，重用缓存的时间字符串
        if (now - last_time_format < std::chrono::seconds(1)) {
            return time_buffer;
        }

        // 更新时间缓存
        last_time_format = now;
        update_time_cache(); // 这个函数内部不需要锁，因为它只被 get_formatted_time 调用
        return time_buffer;
    }

    // 更新时间缓存 (假定 time_mutex 已被持有)
    void update_time_cache() {
        auto now_time = std::chrono::system_clock::to_time_t(last_time_format);
        // 使用 localtime_r 或等效的线程安全版本（如果可用且必要）
        // std::tm now_tm;
        // localtime_r(&now_time, &now_tm);
        // std::strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", &now_tm);
        // 在许多现代 C++ 实现中，std::localtime 可能已经是线程安全的，或者内部有锁
        std::strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", std::localtime(&now_time));
    }

    // 添加内容到缓冲区
    void add_to_buffer(const std::string& log_name, std::string&& content, LogLevel level) {
        std::lock_guard<std::mutex> lock(log_mutex); // 保护 log_buffers

        // 确保缓冲区存在
        auto buffer_it = log_buffers.find(log_name);
        if (buffer_it == log_buffers.end()) {
            // 使用 make_unique 创建 LogBuffer
            buffer_it = log_buffers.emplace(log_name, std::make_unique<LogBuffer>()).first;
        }

        auto& buffer = buffer_it->second;
        buffer->content.append(std::move(content)); // 使用移动语义
        buffer->size = buffer->content.size(); // 直接获取大小
        buffer->last_write = std::chrono::steady_clock::now();

        // 如果是错误日志或缓冲区达到阈值，考虑立即刷新
        bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
        size_t current_max_size = buffer_max_size.load(std::memory_order_relaxed);

        // 立即刷新的条件：错误日志，或者非低功耗模式下缓冲区满
        if ((level == LOG_ERROR) || (!is_low_power && buffer->size >= current_max_size)) {
            flush_buffer_internal(log_name); // 内部方法，已持有锁
        }

        // 通知刷新线程可能有工作要做 (即使没有立即刷新)
        cv.notify_one();
    }

    // 内部刷新缓冲区方法 - 无锁版本 (调用者必须持有 log_mutex)
    void flush_buffer_internal(const std::string& log_name) {
        auto buffer_it = log_buffers.find(log_name);
        if (buffer_it == log_buffers.end() || !buffer_it->second || buffer_it->second->size == 0) {
            return; // 缓冲区不存在或为空
        }

        auto& buffer = buffer_it->second;

        // 构建日志文件路径
        std::string log_path = log_dir + "/" + log_name + ".log";

        // 获取或创建日志文件对象
        auto file_it = log_files.find(log_name);
        if (file_it == log_files.end()) {
            file_it = log_files.emplace(log_name, std::make_unique<LogFile>()).first;
        }
        auto& log_file = file_it->second;

        // 检查文件大小并处理轮转
        size_t current_log_size_limit = log_size_limit.load(std::memory_order_relaxed);
        if (log_file->stream.is_open() && log_file->current_size > current_log_size_limit) {
            log_file->stream.close(); // 关闭当前文件

            // 轮转日志文件 - 使用 POSIX API
            std::string old_log_path = log_path + ".old";

            // 检查旧文件是否存在，如果存在则删除
            if (access(old_log_path.c_str(), F_OK) == 0) {
                if (remove(old_log_path.c_str()) != 0) {
                     std::cerr << "轮转日志时无法删除旧文件: " << old_log_path << " (" << strerror(errno) << ")" << std::endl;
                     // 可以选择继续尝试重命名，或者记录错误后继续
                }
            }

            // 重命名当前日志文件为旧文件
            if (access(log_path.c_str(), F_OK) == 0) { // 确保当前日志文件存在
                if (rename(log_path.c_str(), old_log_path.c_str()) != 0) {
                    std::cerr << "轮转日志时无法重命名文件: " << log_path << " -> " << old_log_path << " (" << strerror(errno) << ")" << std::endl;
                    // 尝试使用 system 命令作为后备
                    std::string cmd = "mv -f \"" + log_path + "\" \"" + old_log_path + "\"";
                    system(cmd.c_str());
                }
            }

            log_file->current_size = 0; // 重置大小计数器
            // 文件已关闭，将在下次写入时重新打开
        }

        // 确保文件已打开 (如果未打开或轮转后关闭了)
        if (!log_file->stream.is_open()) {
            // 尝试以追加模式打开文件
            log_file->stream.open(log_path, std::ios::app | std::ios::binary);
            if (!log_file->stream.is_open()) {
                std::cerr << "无法打开日志文件进行写入: " << log_path << " (" << strerror(errno) << ")" << std::endl;
                // 清理缓冲区，防止内存不断增长
                buffer->content.clear();
                buffer->size = 0;
                // 可以考虑移除对应的 buffer 和 file entry，防止反复失败
                // log_buffers.erase(buffer_it); // 小心迭代器失效
                // log_files.erase(file_it);
                return; // 无法写入，直接返回
            }

            // 获取当前文件大小 (打开后)
            log_file->stream.seekp(0, std::ios::end);
            std::streampos pos = log_file->stream.tellp();
            if (pos == static_cast<std::streampos>(-1)) { // 检查 tellp 错误
                 log_file->current_size = 0; // 如果出错，假设为空文件
                 std::cerr << "警告: 无法获取日志文件大小: " << log_path << std::endl;
            } else {
                 log_file->current_size = static_cast<size_t>(pos);
            }
        }

        // 写入缓冲区内容
        log_file->stream.write(buffer->content.c_str(), buffer->content.size());
        if (log_file->stream.fail()) {
             std::cerr << "写入日志文件失败: " << log_path << std::endl;
             // 考虑关闭文件并重试，或者记录错误
             log_file->stream.close(); // 关闭可能有问题的文件流
             log_file->current_size = 0; // 大小未知
             // 清空缓冲区避免重复写入错误数据
             buffer->content.clear();
             buffer->size = 0;
        } else {
            log_file->stream.flush(); // 确保数据写入磁盘
            // 更新文件大小和最后访问时间
            log_file->current_size += buffer->size;
            log_file->last_access = std::chrono::steady_clock::now();

            // 清空缓冲区
            buffer->content.clear();
            // 优化：如果预分配的容量远大于当前需要，可以缩小以节省内存
            // if (buffer->content.capacity() > buffer_max_size.load(std::memory_order_relaxed) * 4) { // 例如超过4倍
            //     buffer->content.shrink_to_fit();
            // }
            buffer->size = 0;
        }
    }

    // 优化的刷新线程函数
    void flush_thread_func() {
        while (running.load(std::memory_order_relaxed)) {
            std::unique_lock<std::mutex> lock(log_mutex); // 获取锁以访问共享资源

            // 低功耗模式下增加等待时间
            bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
            auto wait_time = is_low_power ? std::chrono::seconds(60) : std::chrono::seconds(15);

            // 等待指定时间或被唤醒 (例如有新日志写入、模式改变或停止信号)
            // 使用 running 标志作为退出条件
            cv.wait_for(lock, wait_time, [this] {
                return !running.load(std::memory_order_relaxed);
            });

            // 再次检查 running 状态，因为可能是被 stop() 唤醒的
            if (!running.load(std::memory_order_relaxed)) {
                break; // 退出循环
            }

            // 获取当前配置 (在锁保护下)
            unsigned int current_idle_ms = max_idle_time.load(std::memory_order_relaxed);
            size_t current_max_buffer_size = buffer_max_size.load(std::memory_order_relaxed);
            auto now = std::chrono::steady_clock::now();

            // 检查每个缓冲区，刷新满足条件的
            // 使用迭代器遍历 map，注意在循环中删除元素可能导致迭代器失效
            for (auto it = log_buffers.begin(); it != log_buffers.end(); /* no increment here */) {
                // 预先递增迭代器，防止删除当前元素时失效
                auto current_it = it++;
                if (!current_it->second) continue; // 无效指针

                auto& buffer = current_it->second;
                if (buffer->size == 0) continue; // 空缓冲区

                auto idle_duration = std::chrono::duration_cast<std::chrono::milliseconds>(
                    now - buffer->last_write);

                // 刷新条件：超过最大空闲时间，或者缓冲区大小超过一半（避免频繁的小块写入）
                if (idle_duration.count() > current_idle_ms || buffer->size > current_max_buffer_size / 2) {
                    flush_buffer_internal(current_it->first); // 刷新
                }
            }

            // 关闭长时间未使用的文件句柄
            unsigned int file_idle_ms = current_idle_ms * 3; // 例如，3倍的缓冲区空闲时间
            for (auto it = log_files.begin(); it != log_files.end(); /* no increment here */) {
                 auto current_it = it++;
                 if (!current_it->second) {
                     // log_files.erase(current_it); // 无效指针，可以移除
                     continue;
                 }

                 if (!current_it->second->stream.is_open()) {
                     // 文件未打开，无需检查空闲时间，但可以考虑移除 map 条目
                     // auto buffer_check_it = log_buffers.find(current_it->first);
                     // if (buffer_check_it == log_buffers.end() || buffer_check_it->second->size == 0) {
                     //      log_files.erase(current_it); // 如果对应缓冲区也空了，移除文件条目
                     // }
                     continue;
                 }

                 auto file_idle_duration = std::chrono::duration_cast<std::chrono::milliseconds>(
                     now - current_it->second->last_access);

                 if (file_idle_duration.count() > file_idle_ms) {
                     current_it->second->stream.close(); // 关闭文件流
                     // 可以选择是否从 map 中移除，如果希望下次写入时重新打开
                     // log_files.erase(current_it);
                 }
            }
            // 锁将在 unique_lock 析构时自动释放
        }
         // 线程退出前最后一次刷新 (可选，取决于 stop() 的逻辑)
         // flush_all(); // 可能需要重新获取锁
    }
};

// 全局日志实例 (使用智能指针管理生命周期)
static std::unique_ptr<Logger> g_logger;

// 信号处理函数
void signal_handler(int sig) {
    // 信号处理函数应尽可能快，避免复杂操作和分配内存
    // 标记需要退出或刷新，让主线程或日志线程处理
    // 这里简化处理：尝试刷新，然后退出 (可能不安全)
    if (g_logger) {
        // 不要在信号处理器中调用 std::cerr 或其他可能分配内存/加锁的操作
        // g_logger->flush_all(); // 可能不安全
        // 更好的方法是设置一个原子标志，让主循环或日志线程检查
    }

    // 对于终止信号，直接退出
    if (sig == SIGTERM || sig == SIGINT) {
        // 调用 _exit 而不是 exit，避免调用 atexit 注册的函数和全局对象析构
        _exit(0); // 或者使用 quick_exit (C++11)
    }
    // 其他信号 (如 SIGUSR1) 可以用于触发特定操作，例如刷新
    if (sig == SIGUSR1 && g_logger) {
         // g_logger->flush_all(); // 同样可能不安全
         // 可以 notify 条件变量让日志线程刷新
         // g_logger->cv.notify_all(); // 需要访问 Logger 内部成员，不推荐
    }
}


// 主函数
int main(int argc, char* argv[]) {
    // 修改默认路径为模块路径
    std::string log_dir = "/data/adb/modules/AMMF2/logs"; // 在 Android 上这通常是正确的
    int log_level_int = LOG_INFO; // 使用 int 存储解析结果
    std::string command;
    std::string log_name = "system";
    std::string message;
    std::string batch_file;
    bool low_power = false;

    // 解析命令行参数
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            try {
                log_level_int = std::stoi(argv[++i]);
                if (log_level_int < LOG_ERROR || log_level_int > LOG_DEBUG) {
                    std::cerr << "警告: 日志级别必须在 " << LOG_ERROR << "-" << LOG_DEBUG
                              << " 之间，使用默认值 " << LOG_INFO << std::endl;
                    log_level_int = LOG_INFO;
                }
            } catch (const std::invalid_argument& e) {
                std::cerr << "错误: 无效的日志级别参数: " << argv[i] << std::endl;
                return 1; // 参数错误，退出
            } catch (const std::out_of_range& e) {
                 std::cerr << "错误: 日志级别参数超出范围: " << argv[i] << std::endl;
                 return 1; // 参数错误，退出
            }
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
        } else if (arg == "-b" && i + 1 < argc) {
            batch_file = argv[++i];
        } else if (arg == "-p") {
            low_power = true;
        } else if (arg == "-h" || arg == "--help") {
            std::cout << "用法: " << argv[0] << " [选项]" << std::endl;
            std::cout << "选项:" << std::endl;
            std::cout << "  -d DIR    指定日志目录 (默认: /data/adb/modules/AMMF2/logs)" << std::endl;
            std::cout << "  -l LEVEL  设置日志级别 (1=错误, 2=警告, 3=信息, 4=调试, 默认: 3)" << std::endl;
            std::cout << "  -c CMD    执行命令 (daemon, write, batch, flush, clean)" << std::endl;
            std::cout << "  -n NAME   指定日志名称 (用于write/batch命令, 默认: system)" << std::endl;
            std::cout << "  -m MSG    日志消息内容 (用于write命令)" << std::endl;
            std::cout << "  -b FILE   批量输入文件，格式: 级别|消息 (每行一条, 用于batch命令)" << std::endl;
            std::cout << "  -p        启用低功耗模式 (减少写入频率)" << std::endl;
            std::cout << "  -h        显示帮助信息" << std::endl;
            std::cout << "示例:" << std::endl;
            std::cout << "  启动守护进程: " << argv[0] << " -c daemon -d /path/to/logs -l 4 -p" << std::endl;
            std::cout << "  写入日志: " << argv[0] << " -c write -n main -m \"测试消息\" -l 3" << std::endl;
            std::cout << "  批量写入: " << argv[0] << " -c batch -n errors -b batch_logs.txt" << std::endl;
            std::cout << "  刷新日志: " << argv[0] << " -c flush -d /path/to/logs" << std::endl;
            std::cout << "  清理日志: " << argv[0] << " -c clean -d /path/to/logs" << std::endl;
            return 0;
        } else {
             std::cerr << "错误: 未知或无效的参数: " << arg << std::endl;
             return 1;
        }
    }

    // 如果未指定命令，默认启动守护进程
    if (command.empty()) {
        command = "daemon";
    }

    // 创建日志器 (使用 try-catch 捕获构造函数中的异常)
    try {
        if (!g_logger) {
            g_logger = std::make_unique<Logger>(log_dir, log_level_int);
            if (low_power) {
                g_logger->set_low_power_mode(true);
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "初始化日志系统失败: " << e.what() << std::endl;
        return 1;
    }


    // 执行命令
    if (command == "daemon") {
        // 设置文件权限掩码 (确保日志文件权限正确)
        umask(0022); // rwxr-xr-x for files created by daemon

        // 设置信号处理
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        // signal(SIGUSR1, signal_handler); // SIGUSR1 通常用于用户自定义信号，这里可能用于刷新
        signal(SIGPIPE, SIG_IGN);  // 忽略管道错误，防止写入已关闭的管道导致程序退出

        // 写入启动日志到文件
        std::string startup_msg = "日志系统守护进程已启动";
        if (low_power) {
            startup_msg += " (低功耗模式)";
        }
        g_logger->write_log("system", LOG_INFO, startup_msg);

        // 确保日志目录权限正确 (已在 create_log_directory 中处理，这里是双重检查)
        // chmod(log_dir.c_str(), 0755);

        // 优化的主循环 - 使用条件变量等待
        std::mutex main_mutex;
        std::condition_variable main_cv;
        std::unique_lock<std::mutex> lock(main_mutex);

        // 守护进程主循环
        while (g_logger && g_logger->is_running()) {
            // 使用条件变量无限期等待，直到被信号处理函数或其他机制唤醒并停止 logger
            // 或者可以设置一个非常长的超时时间进行定期检查（例如健康检查）
            // cv.wait(lock, [&]{ return !g_logger || !g_logger->is_running(); });
            // 这里改为使用 wait_for 实现定期唤醒，即使没有外部信号
            // 这样可以添加一些定期的维护任务（如果需要）
            auto wait_duration = std::chrono::hours(1); // 例如每小时唤醒一次
            main_cv.wait_for(lock, wait_duration);

            // 如果被唤醒，检查是否需要退出
            if (!g_logger || !g_logger->is_running()) {
                break;
            }
            // 可以在这里添加守护进程的定期任务
            // 例如: 检查磁盘空间、重新加载配置等
        }
         // 守护进程退出前的清理
        if (g_logger) {
            g_logger->write_log("system", LOG_INFO, "日志系统守护进程正在停止...");
            g_logger->stop(); // 确保停止并刷新
        }
        return 0; // 守护进程正常退出

    } else if (command == "write") {
        // 写入日志
        if (message.empty()) {
            std::cerr << "错误: 写入日志需要消息内容 (-m)" << std::endl;
            if (g_logger) g_logger->stop(); // 确保资源释放
            return 1;
        }

        LogLevel level = static_cast<LogLevel>(log_level_int);
        g_logger->write_log(log_name, level, message);

        // 对于单次写入命令，通常希望立即看到结果，所以执行刷新
        g_logger->flush_buffer(log_name); // 只刷新相关的日志文件
        g_logger->stop(); // 停止并释放资源
        return 0;

    } else if (command == "batch") {
        // 批量写入日志
        if (batch_file.empty()) {
            std::cerr << "错误: 批量写入需要输入文件 (-b)" << std::endl;
             if (g_logger) g_logger->stop();
            return 1;
        }

        // 读取批量文件
        std::ifstream batch_in(batch_file);
        if (!batch_in.is_open()) {
            std::cerr << "错误: 无法打开批量文件: " << batch_file << " (" << strerror(errno) << ")" << std::endl;
             if (g_logger) g_logger->stop();
            return 1;
        }

        std::vector<std::pair<LogLevel, std::string>> entries;
        std::string line;
        int line_num = 0;

        // 从文件读取日志条目
        while (std::getline(batch_in, line)) {
            line_num++;
            // 跳过空行和注释
            if (line.empty() || line[0] == '#') continue;

            // 查找分隔符 '|'
            size_t pos = line.find('|');
            if (pos == std::string::npos) {
                 std::cerr << "警告: 批量文件第 " << line_num << " 行格式错误 (缺少 '|'): " << line << std::endl;
                 continue; // 跳过格式错误的行
            }

            // 解析日志级别
            std::string level_str = line.substr(0, pos);
            // 去除可能的空格
            level_str.erase(0, level_str.find_first_not_of(" \t"));
            level_str.erase(level_str.find_last_not_of(" \t") + 1);

            LogLevel level = LOG_INFO; // 默认级别
            try {
                int lvl_int = std::stoi(level_str);
                 if (lvl_int >= LOG_ERROR && lvl_int <= LOG_DEBUG) {
                     level = static_cast<LogLevel>(lvl_int);
                 } else {
                      std::cerr << "警告: 批量文件第 " << line_num << " 行级别无效 (" << level_str << ")，使用 INFO" << std::endl;
                 }
            } catch (const std::invalid_argument&) {
                // 如果不是数字，尝试匹配字符串
                if (level_str == "ERROR") level = LOG_ERROR;
                else if (level_str == "WARN") level = LOG_WARN;
                else if (level_str == "INFO") level = LOG_INFO;
                else if (level_str == "DEBUG") level = LOG_DEBUG;
                else {
                     std::cerr << "警告: 批量文件第 " << line_num << " 行级别无法识别 (" << level_str << ")，使用 INFO" << std::endl;
                }
            } catch (const std::out_of_range&) {
                 std::cerr << "警告: 批量文件第 " << line_num << " 行级别超出范围 (" << level_str << ")，使用 INFO" << std::endl;
            }


            // 获取消息内容
            std::string msg = line.substr(pos + 1);
            // 去除消息前导空格
            msg.erase(0, msg.find_first_not_of(" \t"));

            // 添加到条目列表
            entries.emplace_back(level, std::move(msg)); // 使用移动语义
        }

        batch_in.close();

        // 批量写入日志
        if (!entries.empty()) {
            g_logger->batch_write(log_name, entries);
            // 批量写入后也立即刷新
            g_logger->flush_buffer(log_name);
        }
        g_logger->stop(); // 停止并释放资源
        return 0;

    } else if (command == "flush") {
        // 刷新日志
        g_logger->flush_all();
        g_logger->stop(); // 刷新后也停止并清理资源
        return 0;

    } else if (command == "clean") {
        // 清理日志
        g_logger->clean_logs();
        g_logger->stop(); // 清理后也停止
        return 0;

    } else {
        std::cerr << "错误: 未知命令 '" << command << "'" << std::endl;
        std::cerr << "使用 -h 查看帮助。" << std::endl;
         if (g_logger) g_logger->stop();
        return 1;
    }

    // 对于非 daemon 命令，执行到这里表示命令已完成
    // g_logger 会在 main 结束时自动析构并调用 stop()
    // 但显式调用 stop() 可以更早地释放资源
    // if (command != "daemon" && g_logger) {
    //     g_logger->stop();
    // }

    return 0; // 正常退出
}
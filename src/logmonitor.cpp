#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <filesystem>
#include <atomic>
#include <cstring>
#include <ctime>
#include <csignal>
#include <memory>
#include <optional>

#ifdef _WIN32
#include <direct.h>
#include <windows.h>
#define mkdir(path, mode) _mkdir(path)
#else
#include <unistd.h>
#include <sys/stat.h>
#include <fcntl.h>
#endif

// 使用命名空间简化代码
namespace fs = std::filesystem;

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
    std::atomic<unsigned int> max_idle_time{30000};
    std::atomic<size_t> buffer_max_size{8192};
    std::atomic<size_t> log_size_limit{102400};
    std::atomic<int> log_level{3};
    
    // 使用共享指针管理资源
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
            content.reserve(16384);
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
    Logger(const std::string& dir, int level = 3, size_t size_limit = 102400)
        : log_dir(dir), log_level(level), log_size_limit(size_limit) {
        
        // 创建日志目录
        create_log_directory();
        
        // 初始化时间缓存
        update_time_cache();
        
        // 启动刷新线程
        flush_thread = std::make_unique<std::thread>(&Logger::flush_thread_func, this);
    }
    
    ~Logger() {
        stop();
        
        if (flush_thread && flush_thread->joinable()) {
            flush_thread->join();
        }
    }
    
    // 停止日志系统
    void stop() {
        bool expected = true;
        if (running.compare_exchange_strong(expected, false)) {
            cv.notify_all();
            
            // 刷新所有缓冲区
            std::lock_guard<std::mutex> lock(log_mutex);
            for (auto& buffer_pair : log_buffers) {
                if (buffer_pair.second && buffer_pair.second->size > 0) {
                    flush_buffer_internal(buffer_pair.first);
                }
            }
            
            // 关闭所有文件
            log_files.clear();
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
            max_idle_time.store(30000, std::memory_order_relaxed); // 30秒
            buffer_max_size.store(8192, std::memory_order_relaxed); // 8KB
        }
    }
    
    // 写入日志 - 优化版本
    void write_log(const std::string& log_name, LogLevel level, const std::string& message) {
        // 检查日志级别
        if (static_cast<int>(level) > log_level.load(std::memory_order_relaxed)) {
            return;
        }
        
        // 获取级别字符串
        const char* level_str = get_level_string(level);
        
        // 获取格式化时间
        const char* time_str = get_formatted_time();
        
        // 计算所需空间并预分配
        size_t total_size = strlen(time_str) + strlen(level_str) + message.size() + 10;
        std::string log_entry;
        log_entry.reserve(total_size);
        
        // 构建日志条目
        log_entry.append(time_str)
                .append(" [")
                .append(level_str)
                .append("] ")
                .append(message)
                .append("\n");
        
        // 添加到缓冲区
        add_to_buffer(log_name, std::move(log_entry), level);
    }
    
    // 批量写入日志 - 高效版本
    void batch_write(const std::string& log_name, const std::vector<std::pair<LogLevel, std::string>>& entries) {
        if (entries.empty()) return;
        
        // 过滤有效条目并计算总大小
        std::vector<std::pair<LogLevel, const std::string*>> valid_entries;
        valid_entries.reserve(entries.size());
        
        size_t total_size = 0;
        bool has_error = false;
        int current_log_level = log_level.load(std::memory_order_relaxed);
        
        for (const auto& entry : entries) {
            if (static_cast<int>(entry.first) <= current_log_level) {
                valid_entries.emplace_back(entry.first, &entry.second);
                total_size += entry.second.size() + 50;
                if (entry.first == LOG_ERROR) has_error = true;
            }
        }
        
        if (valid_entries.empty()) return;
        
        // 获取格式化时间
        const char* time_str = get_formatted_time();
        
        // 构建批量日志内容
        std::string batch_content;
        batch_content.reserve(total_size);
        
        for (const auto& entry : valid_entries) {
            const char* level_str = get_level_string(entry.first);
            batch_content.append(time_str)
                        .append(" [")
                        .append(level_str)
                        .append("] ")
                        .append(*entry.second)
                        .append("\n");
        }
        
        // 添加到缓冲区
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
        for (auto& buffer_pair : log_buffers) {
            if (buffer_pair.second && buffer_pair.second->size > 0) {
                flush_buffer_internal(buffer_pair.first);
            }
        }
    }
    
    // 清理所有日志
    void clean_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);
        
        // 关闭并清理所有文件
        log_files.clear();
        log_buffers.clear();
        
        // 删除日志文件
        try {
            for (const auto& entry : fs::directory_iterator(log_dir)) {
                if (entry.path().extension() == ".log" || 
                    (entry.path().extension() == ".old" && 
                     entry.path().stem().extension() == ".log")) {
                    fs::remove(entry.path());
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "清理日志文件时出错: " << e.what() << std::endl;
            
            // 回退到系统命令
            #ifdef _WIN32
            std::string cmd = "del /Q \"" + log_dir + "\\*.log\" \"" + log_dir + "\\*.log.old\"";
            #else
            std::string cmd = "rm -f \"" + log_dir + "\"/*.log \"" + log_dir + "\"/*.log.old";
            #endif
            system(cmd.c_str());
        }
    }

private:
    // 创建日志目录
    void create_log_directory() {
        try {
            if (!fs::exists(log_dir)) {
                fs::create_directories(log_dir);
            }
        } catch (const std::exception& e) {
            std::cerr << "无法创建日志目录: " << e.what() << std::endl;
            
            // 回退到系统命令
            #ifdef _WIN32
            std::string cmd = "mkdir \"" + log_dir + "\"";
            #else
            std::string cmd = "mkdir -p \"" + log_dir + "\"";
            #endif
            system(cmd.c_str());
            
            // 检查目录是否创建成功
            if (!fs::exists(log_dir)) {
                std::cerr << "无法创建日志目录，使用当前目录" << std::endl;
                log_dir = "./logs";
                
                #ifdef _WIN32
                cmd = "mkdir \"" + log_dir + "\"";
                #else
                cmd = "mkdir -p \"" + log_dir + "\"";
                #endif
                system(cmd.c_str());
            }
        }
    }
    
    // 获取日志级别字符串 - 使用常量指针避免字符串复制
    const char* get_level_string(LogLevel level) {
        switch (level) {
            case LOG_ERROR: return "ERROR";
            case LOG_WARN:  return "WARN";
            case LOG_INFO:  return "INFO";
            case LOG_DEBUG: return "DEBUG";
            default:        return "INFO";
        }
    }
    
    // 获取格式化的时间字符串 - 缓存最近的时间减少格式化开销
    const char* get_formatted_time() {
        std::lock_guard<std::mutex> lock(time_mutex);
        
        auto now = std::chrono::system_clock::now();
        // 如果时间变化不大，重用缓存的时间字符串
        if (now - last_time_format < std::chrono::seconds(1)) {
            return time_buffer;
        }
        
        // 更新时间缓存
        last_time_format = now;
        update_time_cache();
        return time_buffer;
    }
    
    // 更新时间缓存
    void update_time_cache() {
        auto now_time = std::chrono::system_clock::to_time_t(last_time_format);
        std::strftime(time_buffer, sizeof(time_buffer), "%Y-%m-%d %H:%M:%S", std::localtime(&now_time));
    }
    
    // 添加内容到缓冲区
    void add_to_buffer(const std::string& log_name, std::string&& content, LogLevel level) {
        std::lock_guard<std::mutex> lock(log_mutex);
        
        // 确保缓冲区存在
        if (log_buffers.find(log_name) == log_buffers.end()) {
            log_buffers[log_name] = std::make_unique<LogBuffer>();
        }
        
        auto& buffer = log_buffers[log_name];
        buffer->content.append(content);
        buffer->size += content.size();
        buffer->last_write = std::chrono::steady_clock::now();
        
        // 如果是错误日志或缓冲区达到阈值，立即刷新
        bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
        size_t current_max_size = buffer_max_size.load(std::memory_order_relaxed);
        
        if ((level == LOG_ERROR) || (!is_low_power && buffer->size >= current_max_size)) {
            flush_buffer_internal(log_name);
        }
        
        // 通知刷新线程可能需要处理
        cv.notify_one();
    }
    
    // 内部刷新缓冲区方法 - 无锁版本
    void flush_buffer_internal(const std::string& log_name) {
        auto buffer_it = log_buffers.find(log_name);
        if (buffer_it == log_buffers.end() || !buffer_it->second || buffer_it->second->size == 0) {
            return;
        }
        
        auto& buffer = buffer_it->second;
        
        // 构建日志文件路径
        std::string log_path = log_dir + "/" + log_name + ".log";
        
        // 获取或创建日志文件
        auto file_it = log_files.find(log_name);
        if (file_it == log_files.end()) {
            log_files[log_name] = std::make_unique<LogFile>();
            file_it = log_files.find(log_name);
        }
        
        auto& log_file = file_it->second;
        
        // 检查文件大小并处理轮转
        if (log_file->stream.is_open()) {
            if (log_file->current_size > log_size_limit.load(std::memory_order_relaxed)) {
                log_file->stream.close();
                
                // 轮转日志文件
                std::string old_log = log_path + ".old";
                try {
                    if (fs::exists(old_log)) {
                        fs::remove(old_log);
                    }
                    if (fs::exists(log_path)) {
                        fs::rename(log_path, old_log);
                    }
                } catch (const std::exception& e) {
                    std::cerr << "轮转日志文件时出错: " << e.what() << std::endl;
                    // 回退到系统命令
                    #ifdef _WIN32
                    std::string cmd = "move /Y \"" + log_path + "\" \"" + old_log + "\"";
                    #else
                    std::string cmd = "mv -f \"" + log_path + "\" \"" + old_log + "\"";
                    #endif
                    system(cmd.c_str());
                }
                
                log_file->current_size = 0;
            }
        }
        
        // 确保文件已打开
        if (!log_file->stream.is_open()) {
            log_file->stream.open(log_path, std::ios::app | std::ios::binary);
            if (!log_file->stream.is_open()) {
                std::cerr << "无法打开日志文件: " << log_path << std::endl;
                return;
            }
            
            // 获取当前文件大小
            log_file->stream.seekp(0, std::ios::end);
            log_file->current_size = log_file->stream.tellp();
        }
        
        // 写入缓冲区内容
        log_file->stream.write(buffer->content.c_str(), buffer->content.size());
        log_file->stream.flush();
        
        // 更新文件大小和访问时间
        log_file->current_size += buffer->size;
        log_file->last_access = std::chrono::steady_clock::now();
        
        // 清空缓冲区
        buffer->content.clear();
        buffer->size = 0;
    }
    
    // 优化的刷新线程函数
    void flush_thread_func() {
        while (running.load(std::memory_order_relaxed)) {
            // 使用条件变量等待，可以被提前唤醒
            {
                std::unique_lock<std::mutex> lock(log_mutex);
                
                // 低功耗模式下增加等待时间
                bool is_low_power = low_power_mode.load(std::memory_order_relaxed);
                auto wait_time = is_low_power ? std::chrono::seconds(60) : std::chrono::seconds(15);
                
                cv.wait_for(lock, wait_time, [this] { 
                    return !running.load(std::memory_order_relaxed); 
                });
                
                if (!running.load(std::memory_order_relaxed)) break;
                
                // 获取当前配置
                unsigned int idle_ms = max_idle_time.load(std::memory_order_relaxed);
                size_t max_size = buffer_max_size.load(std::memory_order_relaxed);
                
                // 检查每个缓冲区，只刷新需要刷新的
                auto now = std::chrono::steady_clock::now();
                
                for (auto it = log_buffers.begin(); it != log_buffers.end(); ++it) {
                    if (!it->second) continue;
                    
                    auto& buffer = it->second;
                    if (buffer->size == 0) continue;
                    
                    auto idle_time = std::chrono::duration_cast<std::chrono::milliseconds>(
                        now - buffer->last_write).count();
                    
                    // 如果缓冲区有内容且超过最大空闲时间或达到一定大小，则刷新
                    if (idle_time > idle_ms || buffer->size > max_size / 2) {
                        flush_buffer_internal(it->first);
                    }
                }
                
                // 关闭长时间未使用的文件句柄
                for (auto it = log_files.begin(); it != log_files.end();) {
                    if (!it->second) {
                        it = log_files.erase(it);
                        continue;
                    }
                    
                    auto idle_time = std::chrono::duration_cast<std::chrono::milliseconds>(
                        now - it->second->last_access).count();
                    
                    if (idle_time > idle_ms * 3) {
                        if (it->second->stream.is_open()) {
                            it->second->stream.close();
                        }
                        it = log_files.erase(it);
                    } else {
                        ++it;
                    }
                }
            }
        }
    }
};

// 全局日志实例
static std::unique_ptr<Logger> g_logger;

// 信号处理函数
void signal_handler(int sig) {
    if (g_logger) {
        g_logger->flush_all();
    }
    
    if (sig == SIGTERM || sig == SIGINT) {
        exit(0);
    }
}

// 主函数
int main(int argc, char* argv[]) {
    std::string log_dir = "d:\\AuroraData\\shell\\AMMF2\\logs";
    int log_level = 3;
    std::string command;
    std::string log_name = "system";
    std::string message;
    std::string batch_file;
    bool low_power = false;
    
    // 解析命令行参数
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            try {
                log_level = std::stoi(argv[++i]);
                if (log_level < 1 || log_level > 4) {
                    std::cerr << "日志级别必须在1-4之间，使用默认值3" << std::endl;
                    log_level = 3;
                }
            } catch (const std::exception& e) {
                std::cerr << "无效的日志级别: " << argv[i] << std::endl;
                log_level = 3; // 使用默认值
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
            std::cout << "  -d DIR    指定日志目录 (默认: d:\\AuroraData\\shell\\AMMF2\\logs)" << std::endl;
            std::cout << "  -l LEVEL  设置日志级别 (1=错误, 2=警告, 3=信息, 4=调试, 默认: 3)" << std::endl;
            std::cout << "  -c CMD    执行命令 (daemon, write, batch, flush, clean)" << std::endl;
            std::cout << "  -n NAME   指定日志名称 (用于write命令, 默认: system)" << std::endl;
            std::cout << "  -m MSG    日志消息内容 (用于write命令)" << std::endl;
            std::cout << "  -b FILE   批量输入文件，格式: 级别|消息 (每行一条)" << std::endl;
            std::cout << "  -p        启用低功耗模式 (减少写入频率)" << std::endl;
            std::cout << "  -h        显示帮助信息" << std::endl;
            std::cout << "示例:" << std::endl;
            std::cout << "  启动守护进程: " << argv[0] << " -c daemon" << std::endl;
            std::cout << "  写入日志: " << argv[0] << " -c write -n main -m \"测试消息\" -l 3" << std::endl;
            std::cout << "  批量写入: " << argv[0] << " -c batch -n main -b batch_logs.txt" << std::endl;
            std::cout << "  刷新日志: " << argv[0] << " -c flush" << std::endl;
            std::cout << "  清理日志: " << argv[0] << " -c clean" << std::endl;
            return 0;
        }
    }
    
    // 如果未指定命令，默认启动守护进程
    if (command.empty()) {
        command = "daemon";
    }
    
    // 创建日志器
    if (!g_logger) {
        g_logger = std::make_unique<Logger>(log_dir, log_level);
        if (low_power) {
            g_logger->set_low_power_mode(true);
        }
    }
    
    // 执行命令
    if (command == "daemon") {
        // 设置信号处理
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        #ifndef _WIN32
        signal(SIGUSR1, signal_handler);  // 可用于触发日志刷新
        #endif
        
        // 写入启动日志
        std::string startup_msg = "日志系统已启动";
        if (low_power) {
            startup_msg += " (低功耗模式)";
        }
        g_logger->write_log("system", LOG_INFO, startup_msg);
        
        // 优化的主循环 - 使用条件变量等待
        std::mutex main_mutex;
        std::condition_variable main_cv;
        std::unique_lock<std::mutex> lock(main_mutex);
        
        while (true) {
            // 低功耗模式下减少唤醒频率
            auto wait_time = low_power ? std::chrono::minutes(30) : std::chrono::minutes(10);
            main_cv.wait_for(lock, wait_time);
            
            // 定期刷新所有日志
            g_logger->flush_all();
        }
    } else if (command == "write") {
        // 写入日志
        if (message.empty()) {
            std::cerr << "错误: 写入日志需要消息内容 (-m)" << std::endl;
            return 1;
        }
        
        LogLevel level = static_cast<LogLevel>(log_level);
        g_logger->write_log(log_name, level, message);
        
        // 在非低功耗模式下立即刷新
        if (!low_power) {
            g_logger->flush_all();
        }
        return 0;
    } else if (command == "batch") {
        // 批量写入日志
        if (batch_file.empty()) {
            std::cerr << "错误: 批量写入需要输入文件 (-b)" << std::endl;
            return 1;
        }
        
        // 读取批量文件
        std::ifstream batch_in(batch_file);
        if (!batch_in.is_open()) {
            std::cerr << "错误: 无法打开批量文件: " << batch_file << std::endl;
            return 1;
        }
        
        std::vector<std::pair<LogLevel, std::string>> entries;
        std::string line;
        
        // 从文件读取日志条目
        while (std::getline(batch_in, line)) {
            // 跳过空行和注释
            if (line.empty() || line[0] == '#') continue;
            
            // 查找分隔符
            size_t pos = line.find('|');
            if (pos == std::string::npos) continue;
            
            // 解析日志级别
            std::string level_str = line.substr(0, pos);
            LogLevel level;
            
            if (level_str == "ERROR" || level_str == "1") {
                level = LOG_ERROR;
            } else if (level_str == "WARN" || level_str == "2") {
                level = LOG_WARN;
            } else if (level_str == "INFO" || level_str == "3") {
                level = LOG_INFO;
            } else if (level_str == "DEBUG" || level_str == "4") {
                level = LOG_DEBUG;
            } else {
                level = LOG_INFO;
            }
            
            // 获取消息内容
            std::string message = line.substr(pos + 1);
            
            // 添加到条目列表
            entries.emplace_back(level, message);
        }
        
        batch_in.close();
        
        // 批量写入日志
        if (!entries.empty()) {
            g_logger->batch_write(log_name, entries);
            
            // 在非低功耗模式下立即刷新
            if (!low_power) {
                g_logger->flush_all();
            }
        }
        
        return 0;
    } else if (command == "flush") {
        // 刷新日志
        g_logger->flush_all();
        return 0;
    } else if (command == "clean") {
        // 清理日志
        g_logger->clean_logs();
        return 0;
    } else {
        std::cerr << "错误: 未知命令 '" << command << "'" << std::endl;
        return 1;
    }
    
    return 0;
}
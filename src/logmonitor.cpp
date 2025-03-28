#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <sys/inotify.h>
#include <unistd.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <cstring>
#include <ctime>
#include <csignal>

// 日志级别定义
enum LogLevel {
    LOG_ERROR = 1,
    LOG_WARN = 2,
    LOG_INFO = 3,
    LOG_DEBUG = 4
};

// 日志监控器类
class LogMonitor {
private:
    int inotify_fd;
    std::map<int, std::string> watch_descriptors;
    std::mutex log_mutex;
    std::condition_variable cv;
    bool running;
    std::string log_dir;
    int log_level;
    size_t log_size_limit;
    std::map<std::string, std::ofstream> log_files;
    
    // 缓冲区管理
    struct LogBuffer {
        std::string content;
        size_t size;
    };
    std::map<std::string, LogBuffer> log_buffers;
    size_t buffer_max_size;

public:
    LogMonitor(const std::string& dir, int level = 3, size_t size_limit = 102400)
        : log_dir(dir), log_level(level), log_size_limit(size_limit), buffer_max_size(4096), running(true) {
        
        // 创建日志目录
        mkdir(log_dir.c_str(), 0755);
        
        // 初始化inotify
        inotify_fd = inotify_init();
        if (inotify_fd == -1) {
            std::cerr << "无法初始化inotify: " << strerror(errno) << std::endl;
            exit(1);
        }
    }
    
    ~LogMonitor() {
        stop();
        close(inotify_fd);
        
        // 关闭所有日志文件
        for (auto& file : log_files) {
            if (file.second.is_open()) {
                file.second.close();
            }
        }
    }
    
    // 启动监控
    void start() {
        std::thread monitor_thread(&LogMonitor::monitor_loop, this);
        monitor_thread.detach();
    }
    
    // 停止监控
    void stop() {
        running = false;
        cv.notify_all();
        
        // 刷新所有缓冲区
        for (const auto& buffer_pair : log_buffers) {
            flush_buffer(buffer_pair.first);
        }
    }
    
    // 添加监控文件
    bool add_watch(const std::string& path) {
        int wd = inotify_add_watch(inotify_fd, path.c_str(), IN_MODIFY | IN_CREATE);
        if (wd == -1) {
            std::cerr << "无法添加监控: " << path << " - " << strerror(errno) << std::endl;
            return false;
        }
        watch_descriptors[wd] = path;
        return true;
    }
    
    // 写入日志
    void write_log(const std::string& log_name, LogLevel level, const std::string& message) {
        if (level > log_level) return;
        
        std::string level_str;
        switch (level) {
            case LOG_ERROR: level_str = "ERROR"; break;
            case LOG_WARN:  level_str = "WARN";  break;
            case LOG_INFO:  level_str = "INFO";  break;
            case LOG_DEBUG: level_str = "DEBUG"; break;
            default:        level_str = "INFO";  break;
        }
        
        // 获取当前时间
        auto now = std::chrono::system_clock::now();
        std::time_t now_time = std::chrono::system_clock::to_time_t(now);
        char time_str[64];
        std::strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", std::localtime(&now_time));
        
        // 格式化日志消息
        std::string log_entry = std::string(time_str) + " [" + level_str + "] " + message + "\n";
        
        std::lock_guard<std::mutex> lock(log_mutex);
        
        // 添加到缓冲区
        if (log_buffers.find(log_name) == log_buffers.end()) {
            log_buffers[log_name] = {"", 0};
        }
        
        log_buffers[log_name].content += log_entry;
        log_buffers[log_name].size += log_entry.size();
        
        // 如果缓冲区达到阈值，刷新到文件
        if (log_buffers[log_name].size >= buffer_max_size) {
            flush_buffer(log_name);
        }
    }
    
    // 刷新指定日志的缓冲区
    void flush_buffer(const std::string& log_name) {
        if (log_buffers.find(log_name) == log_buffers.end() || log_buffers[log_name].size == 0) {
            return;
        }
        
        std::string log_path = log_dir + "/" + log_name + ".log";
        
        // 检查日志文件大小
        struct stat st;
        if (stat(log_path.c_str(), &st) == 0) {
            if (st.st_size > log_size_limit) {
                // 轮换日志文件
                std::string old_log = log_path + ".old";
                rename(log_path.c_str(), old_log.c_str());
                
                // 关闭并重新打开日志文件
                if (log_files.find(log_name) != log_files.end() && log_files[log_name].is_open()) {
                    log_files[log_name].close();
                }
            }
        }
        
        // 确保日志文件已打开
        if (log_files.find(log_name) == log_files.end() || !log_files[log_name].is_open()) {
            log_files[log_name].open(log_path, std::ios::app);
            if (!log_files[log_name].is_open()) {
                std::cerr << "无法打开日志文件: " << log_path << std::endl;
                return;
            }
        }
        
        // 写入缓冲区内容
        log_files[log_name] << log_buffers[log_name].content;
        log_files[log_name].flush();
        
        // 清空缓冲区
        log_buffers[log_name].content.clear();
        log_buffers[log_name].size = 0;
    }
    
    // 刷新所有日志缓冲区
    void flush_all() {
        std::lock_guard<std::mutex> lock(log_mutex);
        for (const auto& buffer_pair : log_buffers) {
            flush_buffer(buffer_pair.first);
        }
    }
    
    // 清理所有日志
    void clean_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);
        
        // 关闭所有日志文件
        for (auto& file : log_files) {
            if (file.second.is_open()) {
                file.second.close();
            }
        }
        log_files.clear();
        
        // 清空所有缓冲区
        log_buffers.clear();
        
        // 删除日志文件
        std::string cmd = "rm -f " + log_dir + "/*.log " + log_dir + "/*.log.old";
        system(cmd.c_str());
    }
    
private:
    // 监控循环
    void monitor_loop() {
        const size_t event_size = sizeof(struct inotify_event);
        const size_t buffer_size = (event_size + 16) * 1024;
        char buffer[buffer_size];
        
        while (running) {
            // 定期刷新缓冲区
            flush_all();
            
            // 等待事件
            fd_set read_fds;
            FD_ZERO(&read_fds);
            FD_SET(inotify_fd, &read_fds);
            
            struct timeval timeout;
            timeout.tv_sec = 5;  // 5秒超时
            timeout.tv_usec = 0;
            
            int ret = select(inotify_fd + 1, &read_fds, NULL, NULL, &timeout);
            if (ret == -1) {
                if (errno == EINTR) continue;  // 被信号中断
                std::cerr << "select错误: " << strerror(errno) << std::endl;
                break;
            } else if (ret == 0) {
                // 超时，继续循环
                continue;
            }
            
            // 读取事件
            int length = read(inotify_fd, buffer, buffer_size);
            if (length <= 0) continue;
            
            int i = 0;
            while (i < length) {
                struct inotify_event* event = (struct inotify_event*)&buffer[i];
                
                if (watch_descriptors.find(event->wd) != watch_descriptors.end()) {
                    std::string path = watch_descriptors[event->wd];
                    // 处理文件变更事件
                    // 这里可以添加特定的处理逻辑
                }
                
                i += event_size + event->len;
            }
        }
    }
};

// 全局日志监控器实例
static LogMonitor* g_log_monitor = nullptr;

// 信号处理函数
void signal_handler(int sig) {
    if (g_log_monitor) {
        g_log_monitor->flush_all();
    }
    
    if (sig == SIGTERM || sig == SIGINT) {
        exit(0);
    }
}

// 主函数
int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    int log_level = 3;
    std::string command;
    std::string log_name = "system";
    std::string message;
    
    // 解析命令行参数
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            log_level = std::stoi(argv[++i]);
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
        } else if (arg == "-h" || arg == "--help") {
            std::cout << "用法: " << argv[0] << " [选项]" << std::endl;
            std::cout << "选项:" << std::endl;
            std::cout << "  -d DIR    指定日志目录 (默认: /data/adb/modules/AMMF2/logs)" << std::endl;
            std::cout << "  -l LEVEL  设置日志级别 (1=错误, 2=警告, 3=信息, 4=调试, 默认: 3)" << std::endl;
            std::cout << "  -c CMD    执行命令 (start, stop, write, flush, clean)" << std::endl;
            std::cout << "  -n NAME   指定日志名称 (用于write命令, 默认: system)" << std::endl;
            std::cout << "  -m MSG    日志消息内容 (用于write命令)" << std::endl;
            std::cout << "  -h        显示帮助信息" << std::endl;
            std::cout << "示例:" << std::endl;
            std::cout << "  启动监控: " << argv[0] << " -c start" << std::endl;
            std::cout << "  写入日志: " << argv[0] << " -c write -n main -m \"测试消息\" -l 3" << std::endl;
            std::cout << "  刷新日志: " << argv[0] << " -c flush" << std::endl;
            return 0;
        }
    }
    
    // 如果没有指定命令，默认启动监控服务
    if (command.empty()) {
        command = "daemon";
    }
    
    // 创建日志监控器
    if (!g_log_monitor) {
        g_log_monitor = new LogMonitor(log_dir, log_level);
    }
    
    // 执行命令
    if (command == "daemon") {
        // 设置信号处理
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        signal(SIGUSR1, signal_handler);  // 可以用于触发日志刷新
        
        // 启动监控
        g_log_monitor->start();
        
        // 添加监控目录
        g_log_monitor->add_watch(log_dir);
        
        // 写入启动日志
        g_log_monitor->write_log("system", LOG_INFO, "日志监控系统已启动");
        
        // 主循环
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(60));
            g_log_monitor->flush_all();
        }
    } else if (command == "start") {
        // 启动监控
        g_log_monitor->start();
        g_log_monitor->add_watch(log_dir);
        g_log_monitor->write_log("system", LOG_INFO, "日志监控已启动");
        return 0;
    } else if (command == "stop") {
        // 停止监控
        g_log_monitor->write_log("system", LOG_INFO, "日志监控已停止");
        g_log_monitor->stop();
        return 0;
    } else if (command == "write") {
        // 写入日志
        if (message.empty()) {
            std::cerr << "错误: 写入日志需要指定消息内容 (-m)" << std::endl;
            return 1;
        }
        
        LogLevel level = static_cast<LogLevel>(log_level);
        g_log_monitor->write_log(log_name, level, message);
        return 0;
    } else if (command == "flush") {
        // 刷新日志
        g_log_monitor->flush_all();
        return 0;
    } else if (command == "clean") {
        // 清理日志
        g_log_monitor->clean_logs();
        return 0;
    } else {
        std::cerr << "错误: 未知命令 '" << command << "'" << std::endl;
        return 1;
    }
    
    delete g_log_monitor;
    return 0;
}
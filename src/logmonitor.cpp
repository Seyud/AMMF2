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

// Log level definitions
enum LogLevel {
    LOG_ERROR = 1,
    LOG_WARN = 2,
    LOG_INFO = 3,
    LOG_DEBUG = 4
};

// Log Monitor class
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
    
    // Buffer management
    struct LogBuffer {
        std::string content;
        size_t size;
    };
    std::map<std::string, LogBuffer> log_buffers;
    size_t buffer_max_size;

public:
    LogMonitor(const std::string& dir, int level = 3, size_t size_limit = 102400)
        : log_dir(dir), log_level(level), log_size_limit(size_limit), buffer_max_size(4096), running(true) {
        
        // 创建日志目录 - 使用递归创建
        std::string cmd = "mkdir -p " + log_dir;
        system(cmd.c_str());
        
        // 确认目录是否存在
        struct stat st;
        if (stat(log_dir.c_str(), &st) != 0 || !S_ISDIR(st.st_mode)) {
            std::cerr << "无法创建或访问日志目录: " << log_dir << std::endl;
            // 尝试使用当前目录
            log_dir = "./logs";
            system(("mkdir -p " + log_dir).c_str());
        }
        
        // 初始化 inotify
        inotify_fd = inotify_init();
        if (inotify_fd == -1) {
            std::cerr << "Failed to initialize inotify: " << strerror(errno) << std::endl;
            exit(1);
        }
    }
    
    ~LogMonitor() {
        stop();
        close(inotify_fd);
        
        // Close all log files
        for (auto& file : log_files) {
            if (file.second.is_open()) {
                file.second.close();
            }
        }
    }
    
    // Start monitoring
    void start() {
        std::thread monitor_thread(&LogMonitor::monitor_loop, this);
        monitor_thread.detach();
    }
    
    // Stop monitoring
    void stop() {
        running = false;
        cv.notify_all();
        
        // Flush all buffers
        for (const auto& buffer_pair : log_buffers) {
            flush_buffer(buffer_pair.first);
        }
    }
    
    // Add watch for a file or directory
    bool add_watch(const std::string& path) {
        int wd = inotify_add_watch(inotify_fd, path.c_str(), IN_MODIFY | IN_CREATE);
        if (wd == -1) {
            std::cerr << "Failed to add watch: " << path << " - " << strerror(errno) << std::endl;
            return false;
        }
        watch_descriptors[wd] = path;
        return true;
    }
    
    // Write log entry
    // 修复 write_log 函数
    void write_log(const std::string& log_name, LogLevel level, const std::string& message) {
        // 修改判断逻辑，确保日志级别正确处理
        if (static_cast<int>(level) > log_level) return;
        
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
        
        // Add to buffer
        if (log_buffers.find(log_name) == log_buffers.end()) {
            log_buffers[log_name] = {"", 0};
        }
        
        log_buffers[log_name].content += log_entry;
        log_buffers[log_name].size += log_entry.size();
        
        // If buffer reaches threshold, flush to file
        if (log_buffers[log_name].size >= buffer_max_size) {
            flush_buffer(log_name);
        }
    }
    
    // Flush specific log buffer
    void flush_buffer(const std::string& log_name) {
        if (log_buffers.find(log_name) == log_buffers.end() || log_buffers[log_name].size == 0) {
            return;
        }
        
        std::string log_path = log_dir + "/" + log_name + ".log";
        
        // Check log file size
        struct stat st;
        if (stat(log_path.c_str(), &st) == 0) {
            if (st.st_size > log_size_limit) {
                // Rotate log file
                std::string old_log = log_path + ".old";
                rename(log_path.c_str(), old_log.c_str());
                
                // Close and reopen log file
                if (log_files.find(log_name) != log_files.end() && log_files[log_name].is_open()) {
                    log_files[log_name].close();
                }
            }
        }
        
        // Ensure log file is open
        if (log_files.find(log_name) == log_files.end() || !log_files[log_name].is_open()) {
            log_files[log_name].open(log_path, std::ios::app);
            if (!log_files[log_name].is_open()) {
                std::cerr << "Failed to open log file: " << log_path << std::endl;
                return;
            }
        }
        
        // Write buffer content
        log_files[log_name] << log_buffers[log_name].content;
        log_files[log_name].flush();
        
        // Clear buffer
        log_buffers[log_name].content.clear();
        log_buffers[log_name].size = 0;
    }
    
    // Flush all log buffers
    void flush_all() {
        std::lock_guard<std::mutex> lock(log_mutex);
        for (const auto& buffer_pair : log_buffers) {
            flush_buffer(buffer_pair.first);
        }
    }
    
    // Clean all logs
    void clean_logs() {
        std::lock_guard<std::mutex> lock(log_mutex);
        
        // Close all log files
        for (auto& file : log_files) {
            if (file.second.is_open()) {
                file.second.close();
            }
        }
        log_files.clear();
        
        // Clear all buffers
        log_buffers.clear();
        
        // Delete log files
        std::string cmd = "rm -f " + log_dir + "/*.log " + log_dir + "/*.log.old";
        system(cmd.c_str());
    }
    
private:
    // Monitor loop
    void monitor_loop() {
        const size_t event_size = sizeof(struct inotify_event);
        const size_t buffer_size = (event_size + 16) * 1024;
        char buffer[buffer_size];
        
        while (running) {
            // Periodically flush buffers
            flush_all();
            
            // Wait for events
            fd_set read_fds;
            FD_ZERO(&read_fds);
            FD_SET(inotify_fd, &read_fds);
            
            struct timeval timeout;
            timeout.tv_sec = 5;  // 5 second timeout
            timeout.tv_usec = 0;
            
            int ret = select(inotify_fd + 1, &read_fds, NULL, NULL, &timeout);
            if (ret == -1) {
                if (errno == EINTR) continue;  // Interrupted by signal
                std::cerr << "Select error: " << strerror(errno) << std::endl;
                break;
            } else if (ret == 0) {
                // Timeout, continue loop
                continue;
            }
            
            // Read events
            int length = read(inotify_fd, buffer, buffer_size);
            if (length <= 0) continue;
            
            int i = 0;
            while (i < length) {
                struct inotify_event* event = (struct inotify_event*)&buffer[i];
                
                if (watch_descriptors.find(event->wd) != watch_descriptors.end()) {
                    std::string path = watch_descriptors[event->wd];
                    // Handle file change events
                    // Specific handling logic can be added here
                }
                
                i += event_size + event->len;
            }
        }
    }
};

// Global log monitor instance
static LogMonitor* g_log_monitor = nullptr;

// Signal handler
void signal_handler(int sig) {
    if (g_log_monitor) {
        g_log_monitor->flush_all();
    }
    
    if (sig == SIGTERM || sig == SIGINT) {
        exit(0);
    }
}

// Main function
// 修复 main 函数中的命令行参数处理
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
            try {
                log_level = std::stoi(argv[++i]);
            } catch (const std::exception& e) {
                std::cerr << "Invalid log level: " << argv[i] << std::endl;
                log_level = 3; // 使用默认值
            }
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
        } else if (arg == "-h" || arg == "--help") {
            std::cout << "Usage: " << argv[0] << " [options]" << std::endl;
            std::cout << "Options:" << std::endl;
            std::cout << "  -d DIR    Specify log directory (default: /data/adb/modules/AMMF2/logs)" << std::endl;
            std::cout << "  -l LEVEL  Set log level (1=error, 2=warning, 3=info, 4=debug, default: 3)" << std::endl;
            std::cout << "  -c CMD    Execute command (start, stop, write, flush, clean)" << std::endl;
            std::cout << "  -n NAME   Specify log name (for write command, default: system)" << std::endl;
            std::cout << "  -m MSG    Log message content (for write command)" << std::endl;
            std::cout << "  -h        Show help information" << std::endl;
            std::cout << "Examples:" << std::endl;
            std::cout << "  Start monitoring: " << argv[0] << " -c start" << std::endl;
            std::cout << "  Write log: " << argv[0] << " -c write -n main -m \"Test message\" -l 3" << std::endl;
            std::cout << "  Flush logs: " << argv[0] << " -c flush" << std::endl;
            return 0;
        }
    }
    
    // If no command specified, start daemon by default
    if (command.empty()) {
        command = "daemon";
    }
    
    // Create log monitor
    if (!g_log_monitor) {
        g_log_monitor = new LogMonitor(log_dir, log_level);
    }
    
    // Execute command
    if (command == "daemon") {
        // Set signal handlers
        signal(SIGTERM, signal_handler);
        signal(SIGINT, signal_handler);
        signal(SIGUSR1, signal_handler);  // Can be used to trigger log flush
        
        // Start monitoring
        g_log_monitor->start();
        
        // Add watch directory
        g_log_monitor->add_watch(log_dir);
        
        // Write startup log
        g_log_monitor->write_log("system", LOG_INFO, "Log monitoring system started");
        
        // Main loop
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(60));
            g_log_monitor->flush_all();
        }
    } else if (command == "start") {
        // Start monitoring
        g_log_monitor->start();
        g_log_monitor->add_watch(log_dir);
        g_log_monitor->write_log("system", LOG_INFO, "Log monitoring started");
        return 0;
    } else if (command == "stop") {
        // Stop monitoring
        g_log_monitor->write_log("system", LOG_INFO, "Log monitoring stopped");
        g_log_monitor->stop();
        return 0;
    } else if (command == "write") {
        // Write log
        if (message.empty()) {
            std::cerr << "Error: Writing log requires message content (-m)" << std::endl;
            return 1;
        }
        
        LogLevel level = static_cast<LogLevel>(log_level);
        g_log_monitor->write_log(log_name, level, message);
        g_log_monitor->flush_all(); // 立即刷新，确保写入
        return 0;
    } else if (command == "flush") {
        // Flush logs
        g_log_monitor->flush_all();
        return 0;
    } else if (command == "clean") {
        // Clean logs
        g_log_monitor->clean_logs();
        return 0;
    } else {
        std::cerr << "Error: Unknown command '" << command << "'" << std::endl;
        return 1;
    }
    
    delete g_log_monitor;
    return 0;
}
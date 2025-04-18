#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <chrono>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <filesystem>
#include <memory>

namespace fs = std::filesystem;

// 版本信息
constexpr const char* VERSION = "2.1.0";

// 日志级别
enum class LogLevel : uint8_t {
    ERROR = 1,
    WARN  = 2,
    INFO  = 3,
    DEBUG = 4
};

// 日志条目
struct LogEntry {
    std::string name;
    LogLevel level;
    std::string message;
    std::chrono::system_clock::time_point timestamp;
    
    LogEntry(std::string n, LogLevel l, std::string m)
        : name(std::move(n)), level(l), message(std::move(m)),
          timestamp(std::chrono::system_clock::now()) {}
};

// 日志管理器
class Logger {
private:
    std::mutex mtx;
    std::condition_variable cv;
    std::atomic<bool> running;
    std::string log_dir;
    int log_level;
    
    // 文件缓存
    std::map<std::string, std::ofstream> files;
    
    // 日志队列
    std::vector<LogEntry> queue;
    
    // 配置参数（默认省电模式）
    const size_t MAX_QUEUE_SIZE = 16384;  // 16KB
    const size_t MAX_FILE_SIZE = 1048576; // 1MB
    const auto FLUSH_INTERVAL = std::chrono::minutes(1);
    const auto WRITE_DELAY = std::chrono::milliseconds(500);
    
    // 工作线程
    std::thread worker;
    
    // 统计
    std::atomic<uint64_t> logs_count{0};
    std::atomic<uint64_t> bytes_written{0};
    std::chrono::system_clock::time_point start_time;

public:
    Logger(std::string dir, int level = 3)
        : running(true), log_dir(std::move(dir)), log_level(level),
          start_time(std::chrono::system_clock::now()) {
        try {
            fs::create_directories(log_dir);
        } catch (const fs::filesystem_error& e) {
            std::cerr << "创建日志目录失败: " << e.what() << std::endl;
            log_dir = ".";
        }
        
        worker = std::thread(&Logger::process_queue, this);
    }
    
    ~Logger() {
        stop();
    }
    
    void write_log(const std::string& name, LogLevel level, const std::string& message) {
        if (static_cast<int>(level) > log_level) return;
        
        std::lock_guard<std::mutex> lock(mtx);
        queue.emplace_back(name, level, message);
        
        if (level == LogLevel::ERROR || queue.size() >= MAX_QUEUE_SIZE) {
            cv.notify_one();
        }
    }
    
    void flush() {
        std::lock_guard<std::mutex> lock(mtx);
        flush_queue();
    }
    
    void stop() {
        if (running.exchange(false)) {
            cv.notify_all();
            if (worker.joinable()) {
                worker.join();
            }
            flush();
            close_files();
        }
    }
    
    void clean() {
        std::lock_guard<std::mutex> lock(mtx);
        close_files();
        queue.clear();
        
        try {
            for (const auto& entry : fs::directory_iterator(log_dir)) {
                if (entry.path().extension() == ".log") {
                    fs::remove(entry.path());
                }
            }
        } catch (const fs::filesystem_error&) {}
    }
    
    std::string get_stats() const {
        auto uptime = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now() - start_time).count();
        
        return "日志统计:\n"
               "- 运行时间: " + std::to_string(uptime) + "秒\n"
               "- 处理日志: " + std::to_string(logs_count) + "条\n"
               "- 写入大小: " + std::to_string(bytes_written) + "字节\n"
               "- 当前队列: " + std::to_string(queue.size()) + "条\n";
    }

private:
    void process_queue() {
        while (running) {
            std::unique_lock<std::mutex> lock(mtx);
            cv.wait_for(lock, FLUSH_INTERVAL, [this] {
                return !running || !queue.empty();
            });
            
            if (!running && queue.empty()) break;
            flush_queue();
        }
    }
    
    void flush_queue() {
        if (queue.empty()) return;
        
        std::map<std::string, std::string> contents;
        
        for (const auto& entry : queue) {
            auto& content = contents[entry.name];
            
            char time_str[32];
            auto time = std::chrono::system_clock::to_time_t(entry.timestamp);
            std::strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", std::localtime(&time));
            
            std::string level_str;
            switch (entry.level) {
                case LogLevel::ERROR: level_str = "ERROR"; break;
                case LogLevel::WARN:  level_str = "WARN";  break;
                case LogLevel::INFO:  level_str = "INFO";  break;
                case LogLevel::DEBUG: level_str = "DEBUG"; break;
            }
            
            content += std::string(time_str) + " [" + level_str + "] " + entry.message + "\n";
        }
        
        logs_count += queue.size();
        queue.clear();
        
        for (const auto& [name, content] : contents) {
            write_to_file(name, content);
            bytes_written += content.size();
        }
    }
    
    void write_to_file(const std::string& name, const std::string& content) {
        std::string path = log_dir + "/" + name + ".log";
        
        if (files.find(name) == files.end()) {
            files[name].open(path, std::ios::app);
        }
        
        auto& file = files[name];
        if (file.is_open()) {
            file << content;
            file.flush();
        }
    }
    
    void close_files() {
        for (auto& [_, file] : files) {
            if (file.is_open()) {
                file.close();
            }
        }
        files.clear();
    }
};

// 全局实例
static std::unique_ptr<Logger> g_logger;

int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    int log_level = 3;
    std::string command = "daemon";
    std::string log_name = "system";
    std::string message;
    
    // 解析参数
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            log_level = std::clamp(std::stoi(argv[++i]), 1, 4);
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
        } else if (arg == "-v") {
            std::cout << "logmonitor 版本 " << VERSION << std::endl;
            return 0;
        }
    }
    
    // 创建日志实例
    if (!g_logger) {
        g_logger = std::make_unique<Logger>(log_dir, log_level);
    }
    
    // 执行命令
    if (command == "daemon") {
        g_logger->write_log("system", LogLevel::INFO, 
            "日志系统启动 (版本 " + std::string(VERSION) + ")");
        
        std::mutex mtx;
        std::condition_variable cv;
        std::unique_lock<std::mutex> lock(mtx);
        cv.wait(lock);
    } else if (command == "write" && !message.empty()) {
        g_logger->write_log(log_name, static_cast<LogLevel>(log_level), message);
    } else if (command == "flush") {
        g_logger->flush();
    } else if (command == "clean") {
        g_logger->clean();
    } else if (command == "stats") {
        std::cout << g_logger->get_stats();
    }
    
    return 0;
}
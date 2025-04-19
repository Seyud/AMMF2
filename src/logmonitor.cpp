#include <android/log.h>
#include <string>
#include <vector>
#include <queue>
#include <map>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <atomic>
#include <chrono>
#include <fcntl.h>
#include <unistd.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/system_properties.h>
#include <linux/fs.h>
#include <signal.h>
#include <algorithm>
#include <memory>
#include <iostream>

constexpr const char* VERSION = "3.0.0";

// 日志级别
enum class LogLevel : uint8_t {
    ERROR = 1,
    WARN  = 2,
    INFO  = 3,
    DEBUG = 4
};

// 内存池管理器
class MemoryPool {
private:
    static constexpr size_t CHUNK_SIZE = 4096;
    struct Chunk {
        std::unique_ptr<char[]> data;
        size_t used = 0;
        std::unique_ptr<Chunk> next;
        
        Chunk() : data(std::make_unique<char[]>(CHUNK_SIZE)) {}
    };
    
    std::unique_ptr<Chunk> head;
    std::mutex mtx;

public:
    MemoryPool() : head(std::make_unique<Chunk>()) {}
    
    char* allocate(size_t size) {
        std::lock_guard<std::mutex> lock(mtx);
        if (size > CHUNK_SIZE) return nullptr;
        
        auto* chunk = head.get();
        while (chunk->used + size > CHUNK_SIZE) {
            if (!chunk->next) {
                chunk->next = std::make_unique<Chunk>();
            }
            chunk = chunk->next.get();
        }
        
        char* ptr = chunk->data.get() + chunk->used;
        chunk->used += size;
        return ptr;
    }
    
    void reset() {
        std::lock_guard<std::mutex> lock(mtx);
        auto* chunk = head.get();
        while (chunk) {
            chunk->used = 0;
            chunk = chunk->next.get();
        }
    }
};

// 环形缓冲区
class CircularBuffer {
private:
    struct Buffer {
        std::unique_ptr<char[]> data;
        size_t capacity;
        std::atomic<size_t> read_pos{0};
        std::atomic<size_t> write_pos{0};
        
        explicit Buffer(size_t size) 
            : data(std::make_unique<char[]>(size)), capacity(size) {}
    };
    
    std::shared_ptr<Buffer> buffer;
    std::mutex write_mtx;
    static constexpr size_t DEFAULT_SIZE = 64 * 1024;

public:
    CircularBuffer() : buffer(std::make_shared<Buffer>(DEFAULT_SIZE)) {}
    
    bool write(const char* data, size_t len) {
        std::lock_guard<std::mutex> lock(write_mtx);
        auto* buf = buffer.get();
        size_t write_pos = buf->write_pos.load(std::memory_order_relaxed);
        size_t read_pos = buf->read_pos.load(std::memory_order_acquire);
        
        if (available_space(write_pos, read_pos, buf->capacity) < len) {
            return false;
        }
        
        size_t first_part = std::min(buf->capacity - write_pos, len);
        memcpy(buf->data.get() + write_pos, data, first_part);
        
        if (first_part < len) {
            memcpy(buf->data.get(), data + first_part, len - first_part);
        }
        
        buf->write_pos.store((write_pos + len) % buf->capacity, 
            std::memory_order_release);
        return true;
    }
    
    size_t read(char* out, size_t max_len) {
        auto* buf = buffer.get();
        size_t read_pos = buf->read_pos.load(std::memory_order_relaxed);
        size_t write_pos = buf->write_pos.load(std::memory_order_acquire);
        
        size_t available = (write_pos + buf->capacity - read_pos) % buf->capacity;
        if (available == 0) return 0;
        
        size_t to_read = std::min(available, max_len);
        size_t first_part = std::min(buf->capacity - read_pos, to_read);
        
        memcpy(out, buf->data.get() + read_pos, first_part);
        if (first_part < to_read) {
            memcpy(out + first_part, buf->data.get(), to_read - first_part);
        }
        
        buf->read_pos.store((read_pos + to_read) % buf->capacity, 
            std::memory_order_release);
        return to_read;
    }

private:
    static size_t available_space(size_t write_pos, size_t read_pos, size_t capacity) {
        if (write_pos >= read_pos) {
            return capacity - (write_pos - read_pos) - 1;
        }
        return read_pos - write_pos - 1;
    }
};

// 日志文件管理器
class LogFile {
private:
    static constexpr size_t MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
    static constexpr size_t ROTATE_COUNT = 3;
    static constexpr size_t BUFFER_SIZE = 64 * 1024;  // 64KB
    
    std::string path;
    int fd;
    size_t current_size;
    std::unique_ptr<char[]> buffer;
    size_t buffer_used;
    std::mutex write_mutex;

public:
    explicit LogFile(const std::string& p) 
        : path(p), fd(-1), current_size(0), 
          buffer(new char[BUFFER_SIZE]), buffer_used(0) {
        rotate_files();
        fd = open(path.c_str(), O_WRONLY | O_CREAT | O_APPEND, 0644);
        if (fd != -1) {
            struct stat st;
            if (fstat(fd, &st) == 0) {
                current_size = st.st_size;
            }
        }
    }

    ~LogFile() {
        flush();
        if (fd != -1) {
            close(fd);
        }
    }

    bool write(const char* data, size_t len) {
        std::lock_guard<std::mutex> lock(write_mutex);
        
        if (fd == -1) return false;
        
        if (current_size + len > MAX_FILE_SIZE) {
            flush();
            rotate_files();
        }
        
        if (buffer_used + len > BUFFER_SIZE) {
            flush();
        }
        
        memcpy(buffer.get() + buffer_used, data, len);
        buffer_used += len;
        current_size += len;
        
        if (buffer_used >= BUFFER_SIZE / 2) {
            flush();
        }
        
        return true;
    }
    
    void flush() {
        if (buffer_used > 0 && fd != -1) {
            if (::write(fd, buffer.get(), buffer_used) == -1) {
                __android_log_print(ANDROID_LOG_ERROR, "LogFile", 
                    "Failed to write to log file");
            }
            fsync(fd);
            buffer_used = 0;
        }
    }

private:
    void rotate_files() {
        if (fd != -1) {
            close(fd);
            fd = -1;
        }

        for (int i = ROTATE_COUNT - 1; i > 0; --i) {
            std::string old_name = path + "." + std::to_string(i);
            std::string new_name = path + "." + std::to_string(i + 1);
            rename(old_name.c_str(), new_name.c_str());
        }

        rename(path.c_str(), (path + ".1").c_str());
        fd = open(path.c_str(), O_WRONLY | O_CREAT | O_APPEND, 0644);
        current_size = 0;
    }
};

// 日志管理器
class Logger {
private:
    std::string log_dir;
    int log_level;
    std::map<std::string, std::unique_ptr<LogFile>> log_files;
    std::mutex files_mutex;
    std::atomic<bool> running{true};
    std::thread worker;
    std::shared_ptr<CircularBuffer> buffer;
    std::shared_ptr<MemoryPool> memory_pool;
    std::chrono::steady_clock::time_point start_time;

public:
    Logger(const std::string& dir, int level)
        : log_dir(dir), log_level(level),
          buffer(std::make_shared<CircularBuffer>()),
          memory_pool(std::make_shared<MemoryPool>()),
          start_time(std::chrono::steady_clock::now()) {
        mkdir(log_dir.c_str(), 0755);
        worker = std::thread(&Logger::process_logs, this);
    }

    ~Logger() {
        stop();
    }

    void stop() {
        running = false;
        if (worker.joinable()) {
            worker.join();
        }
    }

    void write_log(const std::string& name, LogLevel level, const std::string& message) {
        if (static_cast<int>(level) > log_level) return;

        auto now = std::chrono::system_clock::now();
        auto now_c = std::chrono::system_clock::to_time_t(now);
        
        char timestamp[32];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", localtime(&now_c));
        
        std::string formatted = std::string(timestamp) + " [" + 
            level_to_string(level) + "] " + message + "\n";
        
        buffer->write(formatted.c_str(), formatted.length());
    }

    std::string get_stats() const {
        auto uptime = std::chrono::duration_cast<std::chrono::hours>(
            std::chrono::steady_clock::now() - start_time).count();
        return "Uptime: " + std::to_string(uptime) + " hours";
    }

private:
    static const char* level_to_string(LogLevel level) {
        switch (level) {
            case LogLevel::ERROR: return "ERROR";
            case LogLevel::WARN:  return "WARN";
            case LogLevel::INFO:  return "INFO";
            case LogLevel::DEBUG: return "DEBUG";
            default: return "UNKNOWN";
        }
    }

    void process_logs() {
        char read_buffer[4096];
        while (running) {
            size_t bytes_read = buffer->read(read_buffer, sizeof(read_buffer) - 1);
            if (bytes_read > 0) {
                read_buffer[bytes_read] = '\0';
                write_to_file("system", read_buffer, bytes_read);
            } else {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
            }
        }
    }

    void write_to_file(const std::string& name, const char* data, size_t len) {
        std::lock_guard<std::mutex> lock(files_mutex);
        auto& file = log_files[name];
        if (!file) {
            std::string path = log_dir + "/" + name + ".log";
            file = std::make_unique<LogFile>(path);
        }
        file->write(data, len);
    }
};

std::unique_ptr<Logger> g_logger;

int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    int log_level = 3;
    std::string command = "daemon";
    std::string log_name = "system";
    std::string message;
    
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
            while (i + 1 < argc && argv[i + 1][0] != '-') {
                message += " " + std::string(argv[++i]);
            }
        } else if (arg == "-v") {
            std::cout << "logmonitor version " << VERSION << std::endl;
            return 0;
        }
    }
    
    if (!g_logger) {
        g_logger = std::make_unique<Logger>(log_dir, log_level);
    }
    
    if (command == "daemon") {
        g_logger->write_log("system", LogLevel::INFO, 
            "Log system started (version " + std::string(VERSION) + ")");
        
        sigset_t mask;
        sigemptyset(&mask);
        sigaddset(&mask, SIGTERM);
        sigaddset(&mask, SIGINT);
        
        int sig;
        sigwait(&mask, &sig);
        
        g_logger->stop();
    } else if (command == "write" && !message.empty()) {
        g_logger->write_log(log_name, static_cast<LogLevel>(log_level), message);
    }
    
    return 0;
}
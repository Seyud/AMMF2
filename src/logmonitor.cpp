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
#include <filesystem>

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

// 改进的环形缓冲区
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
        
        write_to_buffer(data, len, write_pos);
        buf->write_pos.store((write_pos + len) % buf->capacity, 
            std::memory_order_release);
        return true;
    }
    
    size_t read(char* out, size_t max_len) {
        auto* buf = buffer.get();
        size_t read_pos = buf->read_pos.load(std::memory_order_relaxed);
        size_t write_pos = buf->write_pos.load(std::memory_order_acquire);
        
        size_t available = used_space(write_pos, read_pos, buf->capacity);
        if (available == 0) return 0;
        
        size_t to_read = std::min(available, max_len);
        read_from_buffer(out, to_read, read_pos);
        buf->read_pos.store((read_pos + to_read) % buf->capacity, 
            std::memory_order_release);
        return to_read;
    }

private:
    void write_to_buffer(const char* data, size_t len, size_t pos) {
        auto* buf = buffer.get();
        size_t first_part = std::min(buf->capacity - pos, len);
        memcpy(buf->data.get() + pos, data, first_part);
        
        if (first_part < len) {
            memcpy(buf->data.get(), data + first_part, len - first_part);
        }
    }
    
    void read_from_buffer(char* out, size_t len, size_t pos) {
        auto* buf = buffer.get();
        size_t first_part = std::min(buf->capacity - pos, len);
        memcpy(out, buf->data.get() + pos, first_part);
        
        if (first_part < len) {
            memcpy(out + first_part, buf->data.get(), len - first_part);
        }
    }
    
    static size_t available_space(size_t write_pos, size_t read_pos, size_t capacity) {
        return (read_pos + capacity - write_pos - 1) % capacity;
    }
    
    static size_t used_space(size_t write_pos, size_t read_pos, size_t capacity) {
        return (write_pos + capacity - read_pos) % capacity;
    }
};

// 日志文件管理器
class LogFile {
private:
    static constexpr size_t MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
    static constexpr size_t ROTATE_COUNT = 3;
    static constexpr size_t WRITE_BUFFER_SIZE = 64 * 1024;  // 64KB写缓冲
    
    std::string path;
    int fd = -1;
    size_t current_size = 0;
    std::unique_ptr<char[]> write_buffer;
    size_t buffer_used = 0;

public:
    explicit LogFile(std::string p) : path(std::move(p)), 
        write_buffer(std::make_unique<char[]>(WRITE_BUFFER_SIZE)) {
        rotate_if_needed();
        fd = open(path.c_str(), O_WRONLY | O_CREAT | O_APPEND, 0644);
        if (fd != -1) {
            struct stat st;
            if (fstat(fd, &st) == 0) {
                current_size = st.st_size;
            }
            // 设置文件缓冲区
            setvbuf(fdopen(fd, "a"), nullptr, _IOFBF, WRITE_BUFFER_SIZE);
        }
    }

    ~LogFile() {
        flush();
        if (fd != -1) close(fd);
    }

    bool write(const char* data, size_t len) {
        if (fd == -1) return false;
        
        if (current_size + len > MAX_FILE_SIZE) {
            flush();
            rotate_if_needed();
        }
        
        if (buffer_used + len > WRITE_BUFFER_SIZE) {
            flush();
        }
        
        memcpy(write_buffer.get() + buffer_used, data, len);
        buffer_used += len;
        current_size += len;
        
        if (buffer_used >= WRITE_BUFFER_SIZE / 2) {
            flush();
        }
        
        return true;
    }
    
    void flush() {
        if (buffer_used > 0 && fd != -1) {
            ::write(fd, write_buffer.get(), buffer_used);
            fsync(fd);
            buffer_used = 0;
        }
    }

// In LogFile class, modify rotate_if_needed()
private:
    void rotate_if_needed() {
        // Replace std::filesystem with traditional file operations
        for (int i = ROTATE_COUNT - 1; i > 0; --i) {
            std::string old_path = path + "." + std::to_string(i);
            std::string new_path = path + "." + std::to_string(i + 1);
            struct stat st;
            if (stat(old_path.c_str(), &st) == 0) {
                rename(old_path.c_str(), new_path.c_str());
            }
        }
        
        struct stat st;
        if (stat(path.c_str(), &st) == 0) {
            rename(path.c_str(), (path + ".1").c_str());
        }
        
        if (fd != -1) {
            flush();
            close(fd);
            fd = open(path.c_str(), O_WRONLY | O_CREAT | O_APPEND, 0644);
            current_size = 0;
            buffer_used = 0;
        }
    }

// In Logger class constructor
Logger(std::string dir, int level)
    : log_dir(std::move(dir)), 
      log_level(level),
      buffer(std::make_shared<CircularBuffer>()),
      memory_pool(std::make_shared<MemoryPool>()),
      start_time(std::chrono::steady_clock::now()) {
    // Replace std::filesystem with mkdir
    mkdir(log_dir.c_str(), 0755);
    worker = std::thread(&Logger::process_logs, this);
    
    // Define Android priority
    constexpr int ANDROID_PRIORITY_BACKGROUND = 10;
    setpriority(PRIO_PROCESS, gettid(), ANDROID_PRIORITY_BACKGROUND);
}

// In main function, remove filesystem namespace
int main(int argc, char* argv[]) {
    std::string log_dir = "/data/adb/modules/AMMF2/logs";
    int log_level = 3;
    std::string command = "daemon";
    std::string log_name = "system";
    std::string message;
    
    // 处理命令行参数
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "-d" && i + 1 < argc) {
            log_dir = argv[++i];
        } else if (arg == "-l" && i + 1 < argc) {
            try {
                int level = std::stoi(argv[++i]);
                log_level = std::clamp(level, 1, 4);
            } catch (...) {
                __android_log_print(ANDROID_LOG_WARN, "logmonitor",
                    "Invalid log level, using default (3)");
            }
        } else if (arg == "-c" && i + 1 < argc) {
            command = argv[++i];
        } else if (arg == "-n" && i + 1 < argc) {
            log_name = argv[++i];
        } else if (arg == "-m" && i + 1 < argc) {
            message = argv[++i];
            while (i + 1 < argc && argv[i + 1][0] != '-') {
                message += " ";
                message += argv[++i];
            }
        } else if (arg == "-v") {
            std::cout << "logmonitor 版本 " << VERSION << std::endl;
            return 0;
        } else if (arg == "-s") {
            if (g_logger) {
                std::cout << g_logger->get_stats() << std::endl;
            }
            return 0;
        }
    }
    
    if (!g_logger) {
        g_logger = std::make_unique<Logger>(log_dir, log_level);
    }
    
    if (command == "daemon") {
        g_logger->write_log("system", LogLevel::INFO,
            "日志系统启动 (版本 " + std::string(VERSION) + ")");
        
        sigset_t mask;
        sigemptyset(&mask);
        sigaddset(&mask, SIGTERM);
        sigaddset(&mask, SIGINT);
        
        int sig;
        sigwait(&mask, &sig);
        
        g_logger->stop();
    } else if (command == "write" && !message.empty()) {
        g_logger->write_log(log_name, 
            static_cast<LogLevel>(log_level), message);
    }
    
    return 0;
}
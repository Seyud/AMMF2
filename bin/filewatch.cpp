#include <iostream>
#include <string>
#include <cstdlib>
#include <unistd.h>
#include <cstring>
#include <cerrno>
#include <csignal>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/inotify.h>
#include <fcntl.h>
#include <ctime>
#include <syslog.h>

#define EVENT_SIZE (sizeof(struct inotify_event))
#define BUF_LEN (1024 * (EVENT_SIZE + 16))

// Global variables
static int fd, wd;
static int running = 1;
static std::string target_file;
static std::string script_path;
static std::string shell_command;  // Added: store shell command to execute
static std::string status_file;
static int daemon_mode = 0;
static int verbose = 0;
static int check_interval = 1; // Default check interval is 1 second

// Signal handler
void handle_signal(int sig) {
    (void)sig;  // Silence unused parameter warning
    running = 0;
}

// Daemon initialization
void daemonize() {
    pid_t pid;
    
    // Create child process
    pid = fork();
    if (pid < 0) {
        exit(EXIT_FAILURE);
    }
    
    // Parent process exits
    if (pid > 0) {
        exit(EXIT_SUCCESS);
    }
    
    // Create new session
    if (setsid() < 0) {
        exit(EXIT_FAILURE);
    }
    
    // Ignore SIGHUP signal
    signal(SIGHUP, SIG_IGN);
    
    // Fork again to ensure process is not session leader
    pid = fork();
    if (pid < 0) {
        exit(EXIT_FAILURE);
    }
    
    if (pid > 0) {
        exit(EXIT_SUCCESS);
    }
    
    // Change working directory
    chdir("/");
    
    // Close all file descriptors
    for (int i = 0; i < 1024; i++) {
        close(i);
    }
    
    // Redirect standard I/O to /dev/null
    open("/dev/null", O_RDWR);
    dup(0);
    dup(0);
    
    // Initialize syslog
    openlog("filewatch", LOG_PID, LOG_DAEMON);
}

// Execute script
void execute_script() {
    if (verbose) {
        if (!shell_command.empty()) {
            syslog(LOG_INFO, "File %s changed, executing shell command", target_file.c_str());
        } else {
            syslog(LOG_INFO, "File %s changed, executing script %s", target_file.c_str(), script_path.c_str());
        }
    }
    
    // If status file is provided, update status to RUNNING
    if (!status_file.empty()) {
        FILE *fp = fopen(status_file.c_str(), "w");
        if (fp != NULL) {
            fprintf(fp, "RUNNING");
            fclose(fp);
            if (verbose) {
                syslog(LOG_INFO, "Status updated to RUNNING");
            }
        }
    }
    
    // Use system to execute script or shell command
    int ret;
    if (!shell_command.empty()) {
        ret = system(shell_command.c_str());
    } else {
        ret = system(script_path.c_str());
    }
    
    if (ret != 0) {
        syslog(LOG_ERR, "Script execution failed, return code: %d", ret);
        // If status file is provided, update status to ERROR
        if (!status_file.empty()) {
            FILE *fp = fopen(status_file.c_str(), "w");
            if (fp != NULL) {
                fprintf(fp, "ERROR");
                fclose(fp);
                if (verbose) {
                    syslog(LOG_INFO, "Status updated to ERROR");
                }
            }
        }
    } else {
        if (verbose) {
            syslog(LOG_INFO, "Script executed successfully");
        }
        // If status file is provided, update status to PAUSED
        if (!status_file.empty()) {
            FILE *fp = fopen(status_file.c_str(), "w");
            if (fp != NULL) {
                fprintf(fp, "PAUSED");
                fclose(fp);
                if (verbose) {
                    syslog(LOG_INFO, "Status updated to PAUSED");
                }
            }
        }
    }
}

// Print usage help
void print_usage(const char *prog_name) {
    std::cout << "Usage: " << prog_name << " [options] <file_to_monitor> <script_to_execute>" << std::endl;
    std::cout << "Options:" << std::endl;
    std::cout << "  -d            Run in daemon mode" << std::endl;
    std::cout << "  -v            Enable verbose logging" << std::endl;
    std::cout << "  -i <seconds>  Set check interval (default 1 second)" << std::endl;
    std::cout << "  -s <file>     Specify status file path" << std::endl;
    std::cout << "  -c <command>  Execute shell command instead of script file" << std::endl;
    std::cout << "  -h            Display this help information" << std::endl;
    std::cout << "\nExamples:" << std::endl;
    std::cout << "  " << prog_name << " -d -v /data/adb/modules/mymodule/config.txt /data/adb/modules/mymodule/update.sh" << std::endl;
    std::cout << "  " << prog_name << " -s /data/status.txt -c \"echo 'File changed' >> /data/log.txt\" /data/config.txt" << std::endl;
}

// Main function with new option parsing
int main(int argc, char *argv[]) {
    int opt;
    
    // Parse command line arguments
    while ((opt = getopt(argc, argv, "dvi:s:c:h")) != -1) {
        switch (opt) {
            case 'd':
                daemon_mode = 1;
                break;
            case 'v':
                verbose = 1;
                break;
            case 'i':
                check_interval = atoi(optarg);
                if (check_interval < 1) check_interval = 1;
                break;
            case 's':
                status_file = optarg;
                break;
            case 'c':
                shell_command = optarg;
                break;
            case 'h':
                print_usage(argv[0]);
                return EXIT_SUCCESS;
            default:
                print_usage(argv[0]);
                return EXIT_FAILURE;
        }
    }
    
    // Check required parameters
    if (optind >= argc) {
        std::cerr << "Error: Missing file path to monitor" << std::endl;
        print_usage(argv[0]);
        return EXIT_FAILURE;
    }
    
    target_file = argv[optind];
    
    // If no shell command is provided, script path is required
    if (shell_command.empty() && optind + 1 >= argc) {
        std::cerr << "Error: No shell command (-c) or script path provided" << std::endl;
        print_usage(argv[0]);
        return EXIT_FAILURE;
    }
    
    // If no shell command is provided, use script path
    if (shell_command.empty()) {
        script_path = argv[optind + 1];
    }
    
    // Check if file exists
    struct stat st;
    if (stat(target_file.c_str(), &st) == -1) {
        std::cerr << "Error: Cannot access monitored file " << target_file << ": " << strerror(errno) << std::endl;
        return EXIT_FAILURE;
    }
    
    // Set signal handlers
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    
    // If needed, convert to daemon
    if (daemon_mode) {
        daemonize();
    }
    
    // Initialize inotify
    fd = inotify_init();
    if (fd < 0) {
        syslog(LOG_ERR, "inotify initialization failed: %s", strerror(errno));
        return EXIT_FAILURE;
    }
    
    // Add watch
    wd = inotify_add_watch(fd, target_file.c_str(), IN_MODIFY | IN_ATTRIB);
    if (wd < 0) {
        syslog(LOG_ERR, "Cannot monitor file %s: %s", target_file.c_str(), strerror(errno));
        close(fd);
        return EXIT_FAILURE;
    }
    
    if (verbose) {
        syslog(LOG_INFO, "Started monitoring file %s", target_file.c_str());
    }
    
    // Main loop
    char buffer[BUF_LEN];
    while (running) {
        // Use select for timeout, avoid blocking on read
        fd_set fds;
        struct timeval tv;
        int ret;
        
        FD_ZERO(&fds);
        FD_SET(fd, &fds);
        
        tv.tv_sec = check_interval;
        tv.tv_usec = 0;
        
        ret = select(fd + 1, &fds, NULL, NULL, &tv);
        
        if (ret < 0) {
            if (errno == EINTR) continue;
            syslog(LOG_ERR, "select error: %s", strerror(errno));
            break;
        }
        
        if (ret == 0) {
            // Timeout, continue loop
            continue;
        }
        
        // Read events
        int length = read(fd, buffer, BUF_LEN);
        if (length < 0) {
            if (errno == EINTR) continue;
            syslog(LOG_ERR, "Error reading events: %s", strerror(errno));
            break;
        }
        
        // Process events
        int i = 0;
        while (i < length) {
            struct inotify_event *event = (struct inotify_event*)&buffer[i];
            
            if (event->mask & (IN_MODIFY | IN_ATTRIB)) {
                execute_script();
            }
            
            i += EVENT_SIZE + event->len;
        }
    }
    
    // Cleanup
    inotify_rm_watch(fd, wd);
    close(fd);
    
    // If status file is provided, update status to NORMAL_EXIT
    if (!status_file.empty()) {
        FILE *fp = fopen(status_file.c_str(), "w");
        if (fp != NULL) {
            fprintf(fp, "NORMAL_EXIT");
            fclose(fp);
            if (verbose) {
                syslog(LOG_INFO, "Status updated to NORMAL_EXIT");
            }
        }
    }
    
    if (verbose) {
        syslog(LOG_INFO, "Stopped monitoring file %s", target_file.c_str());
    }
    
    closelog();
    return EXIT_SUCCESS;
}
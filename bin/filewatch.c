#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <errno.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/inotify.h>
#include <fcntl.h>
#include <time.h>
#include <syslog.h>

#define EVENT_SIZE (sizeof(struct inotify_event))
#define BUF_LEN (1024 * (EVENT_SIZE + 16))

// 全局变量
static int fd, wd;
static int running = 1;
static char *target_file = NULL;
static char *script_path = NULL;
static char *status_file = NULL;  // Moved this declaration up here
static int daemon_mode = 0;
static int verbose = 0;
static int check_interval = 1; // 默认检查间隔为1秒

// 信号处理函数
void handle_signal(int sig) {
    (void)sig;  // Silence unused parameter warning
    running = 0;
}

// 守护进程初始化
void daemonize() {
    pid_t pid;
    
    // 创建子进程
    pid = fork();
    if (pid < 0) {
        exit(EXIT_FAILURE);
    }
    
    // 父进程退出
    if (pid > 0) {
        exit(EXIT_SUCCESS);
    }
    
    // 创建新会话
    if (setsid() < 0) {
        exit(EXIT_FAILURE);
    }
    
    // 忽略SIGHUP信号
    signal(SIGHUP, SIG_IGN);
    
    // 再次fork，确保进程不是会话首进程
    pid = fork();
    if (pid < 0) {
        exit(EXIT_FAILURE);
    }
    
    if (pid > 0) {
        exit(EXIT_SUCCESS);
    }
    
    // 更改工作目录
    chdir("/");
    
    // 关闭所有文件描述符
    for (int i = 0; i < 1024; i++) {
        close(i);
    }
    
    // 重定向标准输入输出到/dev/null
    open("/dev/null", O_RDWR);
    dup(0);
    dup(0);
    
    // 初始化syslog
    openlog("filewatch", LOG_PID, LOG_DAEMON);
}

// 执行脚本
void execute_script() {
    if (verbose) {
        syslog(LOG_INFO, "文件 %s 已更改，执行脚本 %s", target_file, script_path);
    }
    
    // 如果提供了状态文件，更新状态为RUNNING
    if (status_file != NULL) {
        FILE *fp = fopen(status_file, "w");
        if (fp != NULL) {
            fprintf(fp, "RUNNING");
            fclose(fp);
            if (verbose) {
                syslog(LOG_INFO, "状态已更新为RUNNING");
            }
        }
    }
    
    // 使用system执行脚本
    int ret = system(script_path);
    if (ret != 0) {
        syslog(LOG_ERR, "脚本执行失败，返回码: %d", ret);
        // 如果提供了状态文件，更新状态为ERROR
        if (status_file != NULL) {
            FILE *fp = fopen(status_file, "w");
            if (fp != NULL) {
                fprintf(fp, "ERROR");
                fclose(fp);
                if (verbose) {
                    syslog(LOG_INFO, "状态已更新为ERROR");
                }
            }
        }
    } else {
        if (verbose) {
            syslog(LOG_INFO, "脚本执行成功");
        }
        // 如果提供了状态文件，更新状态为PAUSED
        if (status_file != NULL) {
            FILE *fp = fopen(status_file, "w");
            if (fp != NULL) {
                fprintf(fp, "PAUSED");
                fclose(fp);
                if (verbose) {
                    syslog(LOG_INFO, "状态已更新为PAUSED");
                }
            }
        }
    }
}

// 打印使用帮助
void print_usage(const char *prog_name) {
    printf("用法: %s [选项] <监控文件路径> <执行脚本路径>\n", prog_name);
    printf("选项:\n");
    printf("  -d            以守护进程模式运行\n");
    printf("  -v            启用详细日志\n");
    printf("  -i <秒数>     设置检查间隔（默认1秒）\n");
    printf("  -h            显示此帮助信息\n");
    printf("\n示例:\n");
    printf("  %s -d -v /data/adb/modules/mymodule/config.txt /data/adb/modules/mymodule/update.sh\n", prog_name);
}

// 在main函数的参数解析部分添加新选项
int main(int argc, char *argv[]) {
    int opt;
    
    // 解析命令行参数
    while ((opt = getopt(argc, argv, "dvi:s:h")) != -1) {
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
            case 'h':
                print_usage(argv[0]);
                return EXIT_SUCCESS;
            default:
                print_usage(argv[0]);
                return EXIT_FAILURE;
        }
    }
    
    // 检查必要参数
    if (optind + 1 >= argc) {
        fprintf(stderr, "错误: 缺少必要参数\n");
        print_usage(argv[0]);
        return EXIT_FAILURE;
    }
    
    target_file = argv[optind];
    script_path = argv[optind + 1];
    
    // 检查文件是否存在
    struct stat st;
    if (stat(target_file, &st) == -1) {
        fprintf(stderr, "错误: 无法访问监控文件 %s: %s\n", target_file, strerror(errno));
        return EXIT_FAILURE;
    }
    
    // 设置信号处理
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);
    
    // 如果需要，转为守护进程
    if (daemon_mode) {
        daemonize();
    }
    
    // 初始化inotify
    fd = inotify_init();
    if (fd < 0) {
        syslog(LOG_ERR, "inotify初始化失败: %s", strerror(errno));
        return EXIT_FAILURE;
    }
    
    // 添加监控
    wd = inotify_add_watch(fd, target_file, IN_MODIFY | IN_ATTRIB);
    if (wd < 0) {
        syslog(LOG_ERR, "无法监控文件 %s: %s", target_file, strerror(errno));
        close(fd);
        return EXIT_FAILURE;
    }
    
    if (verbose) {
        syslog(LOG_INFO, "开始监控文件 %s", target_file);
    }
    
    // 主循环
    char buffer[BUF_LEN];
    while (running) {
        // 使用select实现超时，避免一直阻塞在read上
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
            syslog(LOG_ERR, "select错误: %s", strerror(errno));
            break;
        }
        
        if (ret == 0) {
            // 超时，继续循环
            continue;
        }
        
        // 读取事件
        int length = read(fd, buffer, BUF_LEN);
        if (length < 0) {
            if (errno == EINTR) continue;
            syslog(LOG_ERR, "读取事件错误: %s", strerror(errno));
            break;
        }
        
        // 处理事件
        int i = 0;
        while (i < length) {
            struct inotify_event *event = (struct inotify_event*)&buffer[i];
            
            if (event->mask & (IN_MODIFY | IN_ATTRIB)) {
                execute_script();
            }
            
            i += EVENT_SIZE + event->len;
        }
    }
    
    // 清理
    inotify_rm_watch(fd, wd);
    close(fd);
    
    // 如果提供了状态文件，更新状态为NORMAL_EXIT
    if (status_file != NULL) {
        FILE *fp = fopen(status_file, "w");
        if (fp != NULL) {
            fprintf(fp, "NORMAL_EXIT");
            fclose(fp);
            if (verbose) {
                syslog(LOG_INFO, "状态已更新为NORMAL_EXIT");
            }
        }
    }
    
    if (verbose) {
        syslog(LOG_INFO, "停止监控文件 %s", target_file);
    }
    
    closelog();
    return EXIT_SUCCESS;
}
#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"
# 定义状态文件路径
STATUS_FILE="$MODPATH/status.txt"
# 定义日志文件路径
LOG_FILE="$MODPATH/logs/service.log"
LOG_DIR="$MODPATH/logs"
# 日志级别: 0=关闭 1=错误 2=警告 3=信息 4=调试
LOG_LEVEL=2
# 日志缓冲区，减少写入次数
LOG_BUFFER=""
# 缓冲区大小限制（字符数）
BUFFER_LIMIT=1024
# 日志文件大小限制（字节）
LOG_SIZE_LIMIT=102400 # 100KB

# 创建日志目录
[ ! -d "$LOG_DIR" ] && mkdir -p "$LOG_DIR"

# 设置初始状态为"运行中"
echo "RUNNING" >"$STATUS_FILE"

# 定义状态更新函数
update_status() {
    echo "$1" >"$STATUS_FILE"
}

# 日志系统函数
# 写入缓冲区
log_buffer() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    LOG_BUFFER="${LOG_BUFFER}${timestamp} [${level}] ${message}\n"
    
    # 当缓冲区达到限制时写入文件
    if [ ${#LOG_BUFFER} -gt $BUFFER_LIMIT ]; then
        echo -e "$LOG_BUFFER" >> "$LOG_FILE"
        LOG_BUFFER=""
        
        # 检查日志文件大小并在必要时轮换
        check_log_size
    fi
}

# 检查日志文件大小并轮换
check_log_size() {
    if [ -f "$LOG_FILE" ]; then
        local size=$(stat -c %s "$LOG_FILE" 2>/dev/null || stat -f %z "$LOG_FILE" 2>/dev/null)
        if [ "$size" -gt "$LOG_SIZE_LIMIT" ]; then
            # 保留最近的日志
            mv "$LOG_FILE" "${LOG_FILE}.old"
            # 清空当前日志文件
            echo "--- 日志已轮换 $(date) ---" > "$LOG_FILE"
        fi
    fi
}

# 强制写入日志缓冲区
flush_log() {
    if [ -n "$LOG_BUFFER" ]; then
        echo -e "$LOG_BUFFER" >> "$LOG_FILE"
        LOG_BUFFER=""
    fi
}

# 日志函数
log_error() {
    [ "$LOG_LEVEL" -ge 1 ] && log_buffer "ERROR" "$1"
}

log_warn() {
    [ "$LOG_LEVEL" -ge 2 ] && log_buffer "WARN" "$1"
}

log_info() {
    [ "$LOG_LEVEL" -ge 3 ] && log_buffer "INFO" "$1"
}

log_debug() {
    [ "$LOG_LEVEL" -ge 4 ] && log_buffer "DEBUG" "$1"
}

# 在脚本退出时刷新日志缓冲区
trap flush_log EXIT

# 记录启动信息
log_info "服务启动"

if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
    update_status "ERROR"
    log_error "未找到文件: $MODPATH/files/scripts/default_scripts/main.sh"
    abort "Notfound File!!!($MODPATH/files/scripts/default_scripts/main.sh)"
else
    log_info "加载 main.sh"
    . "$MODPATH/files/scripts/default_scripts/main.sh"
fi
# Custom Script
# -----------------
# This script extends the functionality of the default and setup scripts, allowing direct use of their variables and functions.
# SCRIPT_EN.md

# 进入暂停模式的函数
enter_pause_mode() {
    update_status "PAUSED"
    log_info "进入暂停模式，监控文件: $1"
    # 在进入暂停模式前刷新日志，确保所有日志都已写入
    flush_log
    # 使用filewatch监控文件变化
    # 参数1: 要监控的文件
    # 参数2: 文件变化时要执行的脚本
    "$MODPATH/bin/filewatch" -s "$STATUS_FILE" "$1" "$2"
}

# 使用示例:
# 要进入暂停模式并监控配置文件，可以这样调用:
# enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/on_config_change.sh"
    if [ ! -f "$MODPATH/files/scripts/service_script.sh" ]; then
        log_error "未找到文件: $MODPATH/files/scripts/service_script.sh"
        abort "Notfound File!!!($MODPATH/files/scripts/service_script.sh)"
    else
        log_info "加载 service_script.sh"
        . "$MODPATH/files/scripts/service_script.sh"
    fi

# 记录正常退出信息
log_info "服务正常退出"
# 确保所有日志都已写入
flush_log
# 脚本结束前更新状态为正常退出
update_status "NORMAL_EXIT"

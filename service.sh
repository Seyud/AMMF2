#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"
# 定义状态文件路径
STATUS_FILE="$MODPATH/status.txt"
# 定义日志文件路径
LOG_FILE="$MODPATH/logs/service.log"
LOG_DIR="$MODPATH/logs"
# 日志级别: 0=关闭 1=错误 2=警告 3=信息 4=调试
LOG_LEVEL=3
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
    log_info "${SERVICE_STATUS_UPDATE:-Status updated}: $1"
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
            echo "--- ${SERVICE_LOG_ROTATED:-Log rotated} $(date) ---" > "$LOG_FILE"
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
log_info "${SERVICE_STARTED:-Service started}"

# 定义abort函数，与main.sh中的Aurora_abort保持一致
abort() {
    log_error "$1"
    update_status "ERROR"
    exit 1
}

if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
    update_status "ERROR"
    log_error "${SERVICE_FILE_NOT_FOUND:-File not found}: $MODPATH/files/scripts/default_scripts/main.sh"
    abort "Notfound File!!!($MODPATH/files/scripts/default_scripts/main.sh)"
else
    log_info "${SERVICE_LOADING_MAIN:-Loading main.sh}"
    . "$MODPATH/files/scripts/default_scripts/main.sh"
    
    # 重定义main.sh中的日志函数，使其使用service.sh的日志系统
    log_to_file() {
        local level="$1"
        local message="$2"
        
        case "$level" in
            "ERROR") log_error "$message" ;;
            "WARN") log_warn "$message" ;;
            "INFO") log_info "$message" ;;
            "DEBUG") log_debug "$message" ;;
            *) log_info "$message" ;;
        esac
    }
fi
# Custom Script
# -----------------
# This script extends the functionality of the default and setup scripts, allowing direct use of their variables and functions.
# SCRIPT_EN.md

# 进入暂停模式的函数
enter_pause_mode() {
    update_status "PAUSED"
    log_info "${SERVICE_PAUSED:-Entered pause mode, monitoring file}: $1"
    # 在进入暂停模式前刷新日志，确保所有日志都已写入
    flush_log
    
    # 检查参数数量
    if [ "$#" -eq 2 ]; then
        # 如果是两个参数，第二个参数是脚本路径
        log_debug "Using script file: $2"
        "$MODPATH/bin/filewatch" -s "$STATUS_FILE" "$1" "$2"
    elif [ "$#" -eq 3 ] && [ "$2" = "-c" ]; then
        # 如果是三个参数且第二个是-c，第三个参数是shell命令
        log_debug "Using shell command: $3"
        "$MODPATH/bin/filewatch" -s "$STATUS_FILE" -c "$3" "$1"
    else
        log_error "Invalid parameters for enter_pause_mode"
        update_status "ERROR"
    fi
}

# 使用示例:
# 使用脚本文件:
# enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/on_config_change.sh"
# 使用shell命令:
# enter_pause_mode "$MODPATH/module_settings/config.sh" -c "echo 'Config changed' >> $MODPATH/logs/changes.log"
    if [ ! -f "$MODPATH/files/scripts/service_script.sh" ]; then
        log_error "${SERVICE_FILE_NOT_FOUND:-File not found}: $MODPATH/files/scripts/service_script.sh"
        abort "Notfound File!!!($MODPATH/files/scripts/service_script.sh)"
    else
        log_info "${SERVICE_LOADING_SERVICE_SCRIPT:-Loading service_script.sh}"
        . "$MODPATH/files/scripts/service_script.sh"
    fi

# 记录正常退出信息
log_info "${SERVICE_NORMAL_EXIT:-Service exited normally}"
# 确保所有日志都已写入
flush_log
# 脚本结束前更新状态为正常退出
update_status "NORMAL_EXIT"

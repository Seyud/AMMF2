#!/system/bin/sh
# 统一的日志系统实现

# 日志目录
LOG_DIR="${MODPATH:-${0%/*}}/logs"

# 日志级别: 0=关闭 1=错误 2=警告 3=信息 4=调试
LOG_LEVEL=3

# 日志缓冲区，减少写入次数
LOG_BUFFER=""
# 缓冲区大小限制（字符数）
BUFFER_LIMIT=1024
# 日志文件大小限制（字节）
LOG_SIZE_LIMIT=102400 # 100KB

# 确保日志目录存在
[ ! -d "$LOG_DIR" ] && mkdir -p "$LOG_DIR"

# 设置默认日志文件
if [ -z "$LOG_FILE" ]; then
    # 从调用脚本名称确定日志文件
    CALLER_SCRIPT=$(basename "${BASH_SOURCE[1]:-$0}" .sh)
    case "$CALLER_SCRIPT" in
        "main") LOG_FILE="$LOG_DIR/main.log" ;;
        "service") LOG_FILE="$LOG_DIR/service.log" ;;
        "customize") LOG_FILE="$LOG_DIR/install.log" ;;
        "action") LOG_FILE="$LOG_DIR/action.log" ;;
        *) LOG_FILE="$LOG_DIR/module.log" ;;
    esac
fi

# 设置日志文件函数
set_log_file() {
    LOG_FILE="$LOG_DIR/$1.log"
    # 确保日志文件存在
    touch "$LOG_FILE"
}

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

# 统一的日志接口，兼容旧的log_to_file函数
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

# 获取所有日志文件列表
get_log_files() {
    find "$LOG_DIR" -name "*.log" -o -name "*.log.old" | sort
}

# 在脚本退出时刷新日志缓冲区
trap flush_log EXIT
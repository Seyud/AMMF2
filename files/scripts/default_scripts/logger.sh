#!/system/bin/sh
# 简化的日志系统 - 调用 logmonitor 可执行文件

# 全局变量
LOGGER_INITIALIZED=0
LOG_FILE_NAME=""

# 初始化日志系统
init_logger() {
    # 如果已经初始化，则跳过
    if [ "$LOGGER_INITIALIZED" = "1" ]; then
        return 0
    fi

    # 日志目录
    if [ -z "$LOG_DIR" ]; then
        LOG_DIR="${MODPATH:-${0%/*}}/logs"
    fi

    # 确保日志目录存在
    mkdir -p "$LOG_DIR" 2>/dev/null || {
        echo "无法创建日志目录: $LOG_DIR" >&2
        return 1
    }

    # 日志级别: 0=关闭 1=错误 2=警告 3=信息 4=调试
    if [ -z "$LOG_LEVEL" ]; then
        LOG_LEVEL=3
    fi
    
    # 检查 logmonitor 可执行文件是否存在
    LOGMONITOR_BIN="${MODPATH:-${0%/*}}/bin/logmonitor"
    if [ ! -f "$LOGMONITOR_BIN" ]; then
        echo "警告: logmonitor 可执行文件未找到: $LOGMONITOR_BIN" >&2
        echo "将使用简化的日志功能" >&2
    else
        # 启动 logmonitor 守护进程
        "$LOGMONITOR_BIN" -c start -d "$LOG_DIR" -l "$LOG_LEVEL" >/dev/null 2>&1 &
    fi
    
    # 标记为已初始化
    LOGGER_INITIALIZED=1
    return 0
}

# 设置日志文件函数
set_log_file() {
    if [ -z "$1" ]; then
        echo "错误: 未指定日志文件名" >&2
        return 1
    fi

    # 确保日志系统已初始化
    if [ "$LOGGER_INITIALIZED" != "1" ]; then
        init_logger || return 1
    fi

    LOG_FILE_NAME="$1"
    return 0
}

# 刷新日志缓冲区
flush_log() {
    if [ -f "$LOGMONITOR_BIN" ]; then
        "$LOGMONITOR_BIN" -c flush -d "$LOG_DIR" >/dev/null 2>&1
    fi
    return 0
}

# 日志函数
log_error() {
    [ "$LOG_LEVEL" -ge 1 ] && _write_log "${ERROR_TEXT:-ERROR}" "$1"
}

log_warn() {
    [ "$LOG_LEVEL" -ge 2 ] && _write_log "${WARN_TEXT:-WARN}" "$1"
}

log_info() {
    [ "$LOG_LEVEL" -ge 3 ] && _write_log "${INFO_TEXT:-INFO}" "$1"
}

log_debug() {
    [ "$LOG_LEVEL" -ge 4 ] && _write_log "${DEBUG_TEXT:-DEBUG}" "$1"
}

# 内部写日志函数
_write_log() {
    local level="$1"
    local message="$2"
    local level_num=3
    
    case "$level" in
        "${ERROR_TEXT:-ERROR}") level_num=1 ;;
        "${WARN_TEXT:-WARN}") level_num=2 ;;
        "${INFO_TEXT:-INFO}") level_num=3 ;;
        "${DEBUG_TEXT:-DEBUG}") level_num=4 ;;
    esac
    
    if [ -f "$LOGMONITOR_BIN" ]; then
        # 使用 logmonitor 写日志
        "$LOGMONITOR_BIN" -c write -d "$LOG_DIR" -l "$level_num" -n "${LOG_FILE_NAME:-system}" -m "$message" >/dev/null 2>&1
    else
        # 简化的日志写入（备用方案）
        local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
        echo "${timestamp} [${level}] ${message}" >> "$LOG_DIR/${LOG_FILE_NAME:-system}.log"
    fi
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

# 清理所有日志
clean_logs() {
    if [ -f "$LOGMONITOR_BIN" ]; then
        "$LOGMONITOR_BIN" -c clean -d "$LOG_DIR" >/dev/null 2>&1
    else
        if [ -d "$LOG_DIR" ]; then
            rm -f "$LOG_DIR"/*.log "$LOG_DIR"/*.log.old 2>/dev/null
        fi
    fi
    return 0
}

# 自动初始化日志系统
init_logger
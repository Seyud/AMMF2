#!/system/bin/sh
# 统一的日志系统实现 - 符合POSIX sh规范

# 初始化日志系统
init_logger() {
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

    # 日志文件大小限制（字节）
    if [ -z "$LOG_SIZE_LIMIT" ]; then
        LOG_SIZE_LIMIT=102400 # 100KB
    fi

    # 初始化成功
    return 0
}

# 设置日志文件函数
set_log_file() {
    if [ -z "$1" ]; then
        echo "错误: 未指定日志文件名" >&2
        return 1
    fi

    # 确保日志目录已初始化
    if [ -z "$LOG_DIR" ]; then
        init_logger || return 1
    fi

    LOG_FILE="$LOG_DIR/$1.log"
    
    # 确保日志文件存在且可写
    touch "$LOG_FILE" 2>/dev/null || {
        echo "无法创建日志文件: $LOG_FILE" >&2
        return 1
    }
    
    return 0
}

# 检查日志文件大小并轮换
check_log_size() {
    if [ -z "$LOG_FILE" ]; then
        return 1
    fi

    if [ -f "$LOG_FILE" ]; then
        # 兼容不同系统的文件大小获取方式
        local size
        size=$(stat -c %s "$LOG_FILE" 2>/dev/null || stat -f %z "$LOG_FILE" 2>/dev/null || wc -c < "$LOG_FILE" 2>/dev/null)
        
        if [ -n "$size" ] && [ "$size" -gt "$LOG_SIZE_LIMIT" ]; then
            # 保留最近的日志
            mv "$LOG_FILE" "${LOG_FILE}.old" 2>/dev/null
            # 清空当前日志文件
            echo "--- 日志已轮换 $(date "+%Y-%m-%d %H:%M:%S") ---" > "$LOG_FILE"
            return 0
        fi
    fi
    
    return 1
}

# 写入日志
write_log() {
    if [ -z "$LOG_FILE" ]; then
        echo "错误: 未设置日志文件，请先调用 set_log_file" >&2
        return 1
    fi

    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # 直接写入文件，避免缓冲区问题
    echo "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
    
    # 检查日志文件大小
    check_log_size
    
    return 0
}

# 日志函数
log_error() {
    [ "$LOG_LEVEL" -ge 1 ] && write_log "ERROR" "$1"
}

log_warn() {
    [ "$LOG_LEVEL" -ge 2 ] && write_log "WARN" "$1"
}

log_info() {
    [ "$LOG_LEVEL" -ge 3 ] && write_log "INFO" "$1"
}

log_debug() {
    [ "$LOG_LEVEL" -ge 4 ] && write_log "DEBUG" "$1"
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
    find "$LOG_DIR" -name "*.log" -o -name "*.log.old" 2>/dev/null | sort
}

# 清理所有日志
clean_logs() {
    if [ -d "$LOG_DIR" ]; then
        rm -f "$LOG_DIR"/*.log "$LOG_DIR"/*.log.old 2>/dev/null
        log_info "所有日志已清理"
        return 0
    fi
    return 1
}

# 初始化日志系统
init_logger
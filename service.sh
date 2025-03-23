#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"
# 定义状态文件路径
STATUS_FILE="$MODPATH/status.txt"

# 设置初始状态为"运行中"
echo "RUNNING" >"$STATUS_FILE"

# 初始化日志目录
LOG_DIR="$MODPATH/logs"
mkdir -p "$LOG_DIR"

# 加载主脚本和日志系统
if [ ! -f "$MODPATH/files/scripts/default_scripts/logger.sh" ]; then
    echo "ERROR: Logger not found" > "$LOG_DIR/error.log"
    exit 1
else
    . "$MODPATH/files/scripts/default_scripts/logger.sh"
    # 设置service脚本的日志文件
    set_log_file "service"
fi

# 加载主脚本
if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
    log_error "File not found: $MODPATH/files/scripts/default_scripts/main.sh"
    echo "ERROR: File not found: $MODPATH/files/scripts/default_scripts/main.sh" > "$LOG_DIR/error.log"
    exit 1
else
    . "$MODPATH/files/scripts/default_scripts/main.sh"
fi

# 定义状态更新函数
update_status() {
    echo "$1" >"$STATUS_FILE"
    log_info "${SERVICE_STATUS_UPDATE:-Status updated}: $1"
}

# 定义abort函数，与main.sh中的Aurora_abort保持一致
abort() {
    log_error "$1"
    update_status "ERROR"
    exit 1
}

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

# 记录启动信息
log_info "${SERVICE_STARTED:-Service started}"
start_script
# 加载服务脚本
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

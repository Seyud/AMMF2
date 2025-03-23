#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"

# 初始化日志目录
LOG_DIR="$MODPATH/logs"
mkdir -p "$LOG_DIR"

# 加载日志系统
if [ -f "$MODPATH/files/scripts/default_scripts/logger.sh" ]; then
    . "$MODPATH/files/scripts/default_scripts/logger.sh"
    # 设置action脚本的日志文件
    set_log_file "action"
else
    echo "ERROR: Logger not found" > "$LOG_DIR/error.log"
    exit 1
fi

if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
    log_error "File not found: $MODPATH/files/scripts/default_scripts/main.sh"
    exit 1
else
    . "$MODPATH/files/scripts/default_scripts/main.sh"
    # 记录action.sh被调用
    log_info "action.sh was called with parameters: $*"
fi

# 在这里添加您的自定义脚本逻辑
# -----------------
# This script extends the functionality of the default and setup scripts, allowing direct use of their variables and functions.
# SCRIPT_EN.md

# 确保日志被刷新
flush_log
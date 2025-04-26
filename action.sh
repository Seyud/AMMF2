#!/system/bin/sh
# ============================
# 天玑GPU混合调速器控制脚本
# ============================
# 此脚本用于控制天玑GPU混合调速器的开关状态

MODDIR=${0%/*}
MODPATH="$MODDIR"

# 初始化日志目录
LOG_DIR="$MODPATH/logs"
mkdir -p "$LOG_DIR"

# 设置日志文件名为action
set_log_file "action"
log_info "action.sh 被调用，参数: $*"

# ============================
# GPU调速器控制函数
# ============================

# 更新状态文件
update_status() {
    local status_file="$MODPATH/status.txt"
    echo "$1" > "$status_file"
    log_info "状态已更新: $1"
}

# 切换GPU调速器状态
dimensity_hybrid_switch() {
    local gpu_scheduler="$MODPATH/gpu-scheduler"
    local disable_file="$MODPATH/disable"

    if [[ $(pidof gpu-scheduler) != '' ]]; then
        log_info "正在停止GPU调速器"
        echo '' > "$disable_file"
        killall gpu-scheduler 2>/dev/null
        update_status "STOPPED"
        Aurora_ui_print "天玑GPU混合调速器已关闭"
    else
        log_info "正在启动GPU调速器"
        nohup "$gpu_scheduler" > /dev/null 2>&1 &
        rm -f "$disable_file" 2>/dev/null
        update_status "RUNNING"
        Aurora_ui_print "天玑GPU混合调速器已启动"
    fi
}

# 直接切换GPU调速器状态
dimensity_hybrid_switch

# 刷新并停止日志系统
stop_logger
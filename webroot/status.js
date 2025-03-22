// 状态管理
class StatusManager {
    constructor() {
        this.statusValue = document.getElementById('module-status');
        this.uptimeValue = document.getElementById('module-uptime');
        this.refreshButton = document.getElementById('refresh-status');
        this.restartButton = document.getElementById('restart-module');
        
        // 状态颜色映射
        this.statusColors = {
            'RUNNING': 'var(--md-sys-color-primary)',
            'PAUSED': 'var(--md-sys-color-tertiary)',
            'ERROR': 'var(--md-sys-color-error)',
            'NORMAL_EXIT': 'var(--md-sys-color-secondary)',
            'STOPPED': 'var(--md-sys-color-error)'
        };
        
        // 状态翻译键
        this.statusTranslationKeys = {
            'RUNNING': 'STATUS_RUNNING',
            'PAUSED': 'STATUS_PAUSED',
            'ERROR': 'STATUS_ERROR',
            'NORMAL_EXIT': 'STATUS_NORMAL_EXIT',
            'STOPPED': 'STATUS_STOPPED'
        };
        
        // 初始化
        this.init();
    }
    
    async init() {
        // 刷新按钮点击事件
        this.refreshButton.addEventListener('click', () => {
            this.refreshStatus();
        });
        
        // 重启按钮点击事件
        this.restartButton.addEventListener('click', () => {
            this.confirmRestartModule();
        });
        
        // 初始加载状态
        await this.refreshStatus();
        
        // 设置定时刷新（每30秒）
        setInterval(() => this.refreshStatus(true), 30000);
    }
    
    async refreshStatus(silent = false) {
        try {
            if (!silent) {
                this.statusValue.textContent = window.i18n.translate('WEBUI_LOADING');
                this.uptimeValue.textContent = window.i18n.translate('WEBUI_LOADING');
            }
            
            // 获取模块状态
            const status = await this.getModuleStatus();
            
            // 获取运行时间
            const uptime = await this.getModuleUptime();
            
            // 更新UI
            this.updateStatusUI(status, uptime);
        } catch (error) {
            console.error('刷新状态失败:', error);
            if (!silent) {
                this.statusValue.textContent = window.i18n.translate('WEBUI_STATUS_ERROR');
                this.statusValue.style.color = 'var(--md-sys-color-error)';
            }
        }
    }
    
    async getModuleStatus() {
        try {
            // 读取状态文件
            const command = 'cat /data/adb/modules/AMMF/status.txt 2>/dev/null || echo "UNKNOWN"';
            const status = await execCommand(command);
            return status.trim();
        } catch (error) {
            console.error('获取模块状态失败:', error);
            return 'ERROR';
        }
    }
    
    async getModuleUptime() {
        try {
            // 检查模块是否运行
            const status = await this.getModuleStatus();
            if (status !== 'RUNNING') {
                return 0;
            }
            
            // 获取模块启动时间
            const command = 'stat -c %Y /data/adb/modules/AMMF/logs/service.log 2>/dev/null || echo 0';
            const result = await execCommand(command);
            const startTime = parseInt(result.trim());
            
            if (startTime === 0) {
                return 0;
            }
            
            // 计算运行时间（秒）
            const currentTime = Math.floor(Date.now() / 1000);
            return currentTime - startTime;
        } catch (error) {
            console.error('获取模块运行时间失败:', error);
            return 0;
        }
    }
    
    updateStatusUI(status, uptime) {
        // 更新状态文本
        const translationKey = this.statusTranslationKeys[status] || 'STATUS_UNKNOWN';
        this.statusValue.textContent = window.i18n.translate(translationKey) || status;
        
        // 更新状态颜色
        this.statusValue.style.color = this.statusColors[status] || 'var(--md-sys-color-on-surface)';
        
        // 更新运行时间
        if (status === 'RUNNING' && uptime > 0) {
            this.uptimeValue.textContent = formatDuration(uptime);
        } else {
            this.uptimeValue.textContent = window.i18n.translate('STATUS_NOT_RUNNING');
        }
        
        // 更新重启按钮状态
        this.restartButton.disabled = status !== 'RUNNING' && status !== 'PAUSED';
    }
    
    confirmRestartModule() {
        showConfirmDialog(
            window.i18n.translate('WEBUI_CONFIRM'),
            window.i18n.translate('WEBUI_CONFIRM_RESTART'),
            () => {
                this.restartModule();
            }
        );
    }
    
    async restartModule() {
        try {
            this.statusValue.textContent = window.i18n.translate('WEBUI_RESTARTING');
            this.statusValue.style.color = 'var(--md-sys-color-tertiary)';
            
            // 执行重启命令
            await execCommand('sh /data/adb/modules/AMMF/service.sh restart');
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_MODULE_RESTARTED'));
            
            // 等待一段时间后刷新状态
            setTimeout(() => this.refreshStatus(), 3000);
        } catch (error) {
            console.error('重启模块失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_MODULE_RESTART_FAILED'));
            this.refreshStatus();
        }
    }
}

// 当DOM加载完成后初始化状态管理器
document.addEventListener('DOMContentLoaded', () => {
    window.statusManager = new StatusManager();
});
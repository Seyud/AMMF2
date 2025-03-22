// 模块状态管理
class StatusManager {
    constructor() {
        this.moduleStatus = document.getElementById('module-status');
        this.moduleUptime = document.getElementById('module-uptime');
        this.refreshButton = document.getElementById('refresh-status');
        this.restartButton = document.getElementById('restart-module');
        
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
                this.moduleStatus.textContent = i18n.translate('WEBUI_LOADING');
                this.moduleUptime.textContent = i18n.translate('WEBUI_LOADING');
            }
            
            // 检查模块状态
            const isRunning = await this.checkModuleRunning();
            
            // 更新状态显示
            if (isRunning) {
                this.moduleStatus.textContent = i18n.translate('WEBUI_STATUS_RUNNING');
                this.moduleStatus.className = 'status-value status-running';
                
                // 获取运行时间
                const uptime = await this.getModuleUptime();
                this.moduleUptime.textContent = uptime;
            } else {
                this.moduleStatus.textContent = i18n.translate('WEBUI_STATUS_STOPPED');
                this.moduleStatus.className = 'status-value status-stopped';
                this.moduleUptime.textContent = '-';
            }
        } catch (error) {
            console.error('刷新状态失败:', error);
            
            if (!silent) {
                this.moduleStatus.textContent = i18n.translate('WEBUI_STATUS_UNKNOWN');
                this.moduleStatus.className = 'status-value status-unknown';
                this.moduleUptime.textContent = '-';
                
                showSnackbar(i18n.translate('WEBUI_STATUS_REFRESH_FAILED'), 'error');
            }
        }
    }
    
    async checkModuleRunning() {
        try {
            // 检查模块服务是否运行
            const result = await execCommand('pgrep -f "ammf_service" || echo ""');
            return result.trim() !== '';
        } catch (error) {
            console.error('检查模块运行状态失败:', error);
            return false;
        }
    }
    
    async getModuleUptime() {
        try {
            // 获取模块启动时间
            const pid = await execCommand('pgrep -f "ammf_service" || echo ""');
            
            if (!pid || pid.trim() === '') {
                return '-';
            }
            
            // 获取进程启动时间
            const startTime = await execCommand(`ps -p ${pid.trim()} -o lstart= 2>/dev/null || echo ""`);
            
            if (!startTime || startTime.trim() === '') {
                return i18n.translate('WEBUI_UNKNOWN');
            }
            
            // 计算运行时间
            const startDate = new Date(startTime);
            const now = new Date();
            const diffMs = now - startDate;
            
            // 格式化运行时间
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            let uptimeStr = '';
            if (days > 0) {
                uptimeStr += `${days}${i18n.translate('WEBUI_DAYS')} `;
            }
            if (hours > 0 || days > 0) {
                uptimeStr += `${hours}${i18n.translate('WEBUI_HOURS')} `;
            }
            uptimeStr += `${minutes}${i18n.translate('WEBUI_MINUTES')}`;
            
            return uptimeStr;
        } catch (error) {
            console.error('获取模块运行时间失败:', error);
            return i18n.translate('WEBUI_UNKNOWN');
        }
    }
    
    confirmRestartModule() {
        // 显示确认对话框
        showConfirmDialog(
            i18n.translate('WEBUI_RESTART_MODULE_TITLE'),
            i18n.translate('WEBUI_RESTART_MODULE_CONFIRM'),
            () => this.restartModule()
        );
    }
    
    async restartModule() {
        try {
            // 禁用重启按钮
            this.restartButton.disabled = true;
            this.restartButton.innerHTML = '<span class="spinner-small"></span> ' + i18n.translate('WEBUI_RESTARTING');
            
            // 重启模块
            await execCommand('/data/adb/modules/AMMF/service.sh restart');
            
            // 等待模块重启
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 刷新状态
            await this.refreshStatus();
            
            // 恢复按钮状态
            this.restartButton.disabled = false;
            this.restartButton.textContent = i18n.translate('WEBUI_RESTART_MODULE');
            
            showSnackbar(i18n.translate('WEBUI_MODULE_RESTARTED'), 'success');
        } catch (error) {
            console.error('重启模块失败:', error);
            
            // 恢复按钮状态
            this.restartButton.disabled = false;
            this.restartButton.textContent = i18n.translate('WEBUI_RESTART_MODULE');
            
            showSnackbar(i18n.translate('WEBUI_MODULE_RESTART_FAILED'), 'error');
        }
    }
}

// 当DOM加载完成后初始化状态管理器
document.addEventListener('DOMContentLoaded', () => {
    window.statusManager = new StatusManager();
});
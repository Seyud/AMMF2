// 日志管理
class LogsManager {
    constructor() {
        this.logsDisplay = document.getElementById('logs-display');
        this.logsLoading = document.getElementById('logs-loading');
        this.noLogs = document.getElementById('no-logs');
        this.refreshButton = document.getElementById('refresh-logs');
        this.clearButton = document.getElementById('clear-logs');
        this.filterInput = document.getElementById('log-filter');
        this.rawLogs = '';
        
        this.init();
    }
    
    async init() {
        // 初始化按钮事件
        this.refreshButton.addEventListener('click', () => {
            this.loadLogs();
        });
        
        this.clearButton.addEventListener('click', () => {
            this.confirmClearLogs();
        });
        
        // 初始化过滤器
        this.filterInput.addEventListener('input', debounce(() => {
            this.filterLogs();
        }, 300));
        
        // 加载日志
        await this.loadLogs();
    }
    
    async loadLogs() {
        try {
            this.logsLoading.style.display = 'flex';
            this.logsDisplay.classList.add('hidden');
            this.noLogs.classList.add('hidden');
            
            // 读取日志文件
            const command = 'cat /data/adb/modules/AMMF/logs/ammf.log 2>/dev/null || echo ""';
            this.rawLogs = await execCommand(command);
            
            // 显示日志
            this.displayLogs(this.rawLogs);
            
            this.logsLoading.style.display = 'none';
        } catch (error) {
            console.error('加载日志失败:', error);
            this.logsLoading.style.display = 'none';
            this.noLogs.classList.remove('hidden');
            this.logsDisplay.classList.add('hidden');
            
            showSnackbar(i18n.translate('WEBUI_LOGS_LOAD_FAILED'), 'error');
        }
    }
    
    displayLogs(logs) {
        if (!logs || logs.trim() === '') {
            this.noLogs.classList.remove('hidden');
            this.logsDisplay.classList.add('hidden');
            return;
        }
        
        this.logsDisplay.textContent = logs;
        this.logsDisplay.classList.remove('hidden');
        this.noLogs.classList.add('hidden');
        
        // 滚动到底部
        this.logsDisplay.scrollTop = this.logsDisplay.scrollHeight;
    }
    
    filterLogs() {
        const filterText = this.filterInput.value.toLowerCase();
        
        if (!filterText) {
            // 如果过滤文本为空，显示所有日志
            this.displayLogs(this.rawLogs);
            return;
        }
        
        // 过滤日志
        const lines = this.rawLogs.split('\n');
        const filteredLines = lines.filter(line => 
            line.toLowerCase().includes(filterText)
        );
        
        // 显示过滤后的日志
        if (filteredLines.length === 0) {
            this.noLogs.classList.remove('hidden');
            this.logsDisplay.classList.add('hidden');
        } else {
            this.displayLogs(filteredLines.join('\n'));
        }
    }
    
    confirmClearLogs() {
        // 显示确认对话框
        showConfirmDialog(
            i18n.translate('WEBUI_CLEAR_LOGS_TITLE'),
            i18n.translate('WEBUI_CLEAR_LOGS_CONFIRM'),
            () => this.clearLogs()
        );
    }
    
    async clearLogs() {
        try {
            // 清空日志文件
            const command = 'echo "" > /data/adb/modules/AMMF/logs/ammf.log';
            await execCommand(command);
            
            // 重新加载日志
            await this.loadLogs();
            
            showSnackbar(i18n.translate('WEBUI_LOGS_CLEARED'), 'success');
        } catch (error) {
            console.error('清空日志失败:', error);
            showSnackbar(i18n.translate('WEBUI_LOGS_CLEAR_FAILED'), 'error');
        }
    }
}

// 当DOM加载完成后初始化日志管理器
document.addEventListener('DOMContentLoaded', () => {
    window.logsManager = new LogsManager();
});
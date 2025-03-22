// 日志管理
class LogsManager {
    constructor() {
        this.logsDisplay = document.getElementById('logs-display');
        this.refreshButton = document.getElementById('refresh-logs');
        this.clearButton = document.getElementById('clear-logs');
        this.filterInput = document.getElementById('filter-logs');
        this.emptyState = document.getElementById('no-logs');
        this.logsLoading = document.getElementById('logs-loading');
        this.logsContent = document.getElementById('logs-content');
        
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
            // 显示加载状态
            this.logsLoading.style.display = 'flex';
            this.logsContent.style.display = 'none';
            
            // 读取日志文件
            const command = 'cat /data/adb/modules/AMMF/logs/service.log 2>/dev/null || echo ""';
            const logs = await execCommand(command);
            
            // 隐藏加载状态
            this.logsLoading.style.display = 'none';
            this.logsContent.style.display = 'block';
            
            if (!logs || logs.trim() === '') {
                this.showEmptyState();
                return;
            }
            
            // 显示日志
            this.logsDisplay.textContent = logs;
            this.logsDisplay.classList.remove('hidden');
            this.emptyState.classList.add('hidden');
            
            // 滚动到底部
            this.logsDisplay.scrollTop = this.logsDisplay.scrollHeight;
            
            // 应用过滤器
            this.filterLogs();
        } catch (error) {
            console.error('加载日志失败:', error);
            this.logsLoading.style.display = 'none';
            this.logsContent.style.display = 'block';
            this.logsDisplay.innerHTML = `<div class="error-message">${error.message || '加载日志失败'}</div>`;
            this.logsDisplay.classList.remove('hidden');
            this.emptyState.classList.add('hidden');
        }
    }
    
    filterLogs() {
        const filterText = this.filterInput.value.toLowerCase();
        
        if (!filterText) {
            // 如果没有过滤文本，显示所有日志
            this.logsDisplay.classList.remove('hidden');
            this.emptyState.classList.add('hidden');
            return;
        }
        
        const logText = this.logsDisplay.textContent;
        const lines = logText.split('\n');
        const filteredLines = lines.filter(line => 
            line.toLowerCase().includes(filterText)
        );
        
        if (filteredLines.length === 0) {
            this.showEmptyState(true);
        } else {
            this.emptyState.classList.add('hidden');
            this.logsDisplay.classList.remove('hidden');
            this.logsDisplay.textContent = filteredLines.join('\n');
        }
    }
    
    showEmptyState(isFiltered = false) {
        this.logsDisplay.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
        
        if (isFiltered) {
            this.emptyState.querySelector('p').textContent = '没有匹配的日志记录';
        } else {
            this.emptyState.querySelector('p').textContent = window.i18n.translate('WEBUI_NO_LOGS');
        }
    }
    
    confirmClearLogs() {
        showConfirmDialog(
            window.i18n.translate('WEBUI_CONFIRM'),
            window.i18n.translate('WEBUI_CONFIRM_CLEAR_LOGS'),
            () => {
                this.clearLogs();
            }
        );
    }
    
    async clearLogs() {
        try {
            // 清空日志文件
            const command = '> /data/adb/modules/AMMF/logs/service.log';
            await execCommand(command);
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_LOGS_CLEARED'));
            
            // 重新加载日志
            await this.loadLogs();
        } catch (error) {
            console.error('清空日志失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_LOGS_CLEAR_FAILED'));
        }
    }
}

// 当DOM加载完成后初始化日志管理器
document.addEventListener('DOMContentLoaded', () => {
    window.logsManager = new LogsManager();
});
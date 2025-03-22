// 日志管理模块
const logsManager = {
    // 日志文件路径
    logFiles: {
        'service': `${utils.MODULE_PATH}logs/service.log`,
        'service_old': `${utils.MODULE_PATH}logs/service.log.old`
    },
    
    // 当前选中的日志文件
    currentLogFile: 'service',
    
    // 日志内容
    logContent: '',
    
    // 自动刷新设置
    autoRefresh: false,
    refreshInterval: 5000,
    refreshTimer: null,
    
    // 渲染日志页面
    render: async function() {
        // 获取日志内容
        await this.loadLogContent();
        
        return `
            <div class="page-container logs-page">
                <div class="logs-header card">
                    <div class="logs-selector">
                        <label for="log-file-select">${languageManager.translate('SELECT_LOG_FILE', 'Select Log File')}:</label>
                        <select id="log-file-select">
                            <option value="service" ${this.currentLogFile === 'service' ? 'selected' : ''}>
                                ${languageManager.translate('SERVICE_LOG', 'Service Log')}
                            </option>
                            <option value="service_old" ${this.currentLogFile === 'service_old' ? 'selected' : ''}>
                                ${languageManager.translate('SERVICE_LOG_OLD', 'Service Log (Old)')}
                            </option>
                        </select>
                    </div>
                    <div class="logs-actions">
                        <button id="refresh-logs" class="md-button">
                            <i class="material-icons">refresh</i>
                            ${languageManager.translate('REFRESH_LOGS', 'Refresh')}
                        </button>
                        <div class="auto-refresh-toggle">
                            <label for="auto-refresh-checkbox">
                                ${languageManager.translate('AUTO_REFRESH', 'Auto Refresh')}
                            </label>
                            <label class="switch">
                                <input type="checkbox" id="auto-refresh-checkbox" ${this.autoRefresh ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="logs-content card">
                    <pre id="logs-display">${this.escapeHtml(this.logContent) || languageManager.translate('NO_LOGS', 'No logs available')}</pre>
                </div>
                
                <div class="logs-actions-bottom">
                    <button id="clear-logs" class="md-button warning">
                        <i class="material-icons">delete</i>
                        ${languageManager.translate('CLEAR_LOGS', 'Clear Logs')}
                    </button>
                    <button id="export-logs" class="md-button secondary">
                        <i class="material-icons">download</i>
                        ${languageManager.translate('EXPORT_LOGS', 'Export Logs')}
                    </button>
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender: function() {
        // 添加日志文件选择事件
        document.getElementById('log-file-select')?.addEventListener('change', (e) => {
            this.currentLogFile = e.target.value;
            this.loadLogContent(true);
        });
        
        // 添加刷新按钮事件
        document.getElementById('refresh-logs')?.addEventListener('click', () => {
            this.loadLogContent(true);
        });
        
        // 添加自动刷新切换事件
        document.getElementById('auto-refresh-checkbox')?.addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            if (this.autoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
        
        // 添加清除日志按钮事件
        document.getElementById('clear-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });
        
        // 添加导出日志按钮事件
        document.getElementById('export-logs')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        // 如果设置了自动刷新，启动定时器
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    },
    
    // 加载日志内容
    loadLogContent: async function(showToast = false) {
        try {
            const logPath = this.logFiles[this.currentLogFile];
            const content = await utils.readFile(logPath);
            
            this.logContent = content || '';
            
            // 更新UI
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = this.escapeHtml(this.logContent) || languageManager.translate('NO_LOGS', 'No logs available');
                
                // 滚动到底部
                logsDisplay.scrollTop = logsDisplay.scrollHeight;
            }
            
            if (showToast) {
                statusManager.showToast(languageManager.translate('LOGS_REFRESHED', 'Logs refreshed'));
            }
        } catch (error) {
            console.error('Error loading log content:', error);
            this.logContent = '';
            
            // 更新UI
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = languageManager.translate('LOGS_ERROR', 'Error loading logs');
            }
            
            if (showToast) {
                statusManager.showToast(languageManager.translate('LOGS_REFRESH_ERROR', 'Error refreshing logs'), 'error');
            }
        }
    },
    
    // 清除日志
    clearLogs: async function() {
        try {
            const logPath = this.logFiles[this.currentLogFile];
            
            // 确认对话框
            if (!confirm(languageManager.translate('CONFIRM_CLEAR_LOGS', 'Are you sure you want to clear this log file?'))) {
                return;
            }
            
            // 清空日志文件
            await utils.writeFile(logPath, '--- Log cleared on ' + new Date().toLocaleString() + ' ---\n');
            
            // 重新加载日志
            await this.loadLogContent();
            
            statusManager.showToast(languageManager.translate('LOGS_CLEARED', 'Logs cleared'));
        } catch (error) {
            console.error('Error clearing logs:', error);
            statusManager.showToast(languageManager.translate('LOGS_CLEAR_ERROR', 'Error clearing logs'), 'error');
        }
    },
    
    // 导出日志
    exportLogs: function() {
        try {
            // 创建Blob对象
            const blob = new Blob([this.logContent], {
                type: 'text/plain'
            });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentLogFile}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            statusManager.showToast(languageManager.translate('LOGS_EXPORTED', 'Logs exported'));
        } catch (error) {
            console.error('Error exporting logs:', error);
            statusManager.showToast(languageManager.translate('LOGS_EXPORT_ERROR', 'Error exporting logs'), 'error');
        }
    },
    
    // 启动自动刷新
    startAutoRefresh: function() {
        // 清除现有定时器
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // 设置新定时器
        this.refreshTimer = setInterval(() => {
            this.loadLogContent();
        }, this.refreshInterval);
    },
    
    // 停止自动刷新
    stopAutoRefresh: function() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },
    
    // HTML转义
    escapeHtml: function(text) {
        if (!text) return '';
        
        // 高亮不同日志级别
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/^(.*?\[ERROR\].*?)$/gm, '<span class="log-error">$1</span>')
            .replace(/^(.*?\[WARN\].*?)$/gm, '<span class="log-warn">$1</span>')
            .replace(/^(.*?\[INFO\].*?)$/gm, '<span class="log-info">$1</span>')
            .replace(/^(.*?\[DEBUG\].*?)$/gm, '<span class="log-debug">$1</span>');
    }
};

// 导出
window.logsManager = logsManager;

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    logsManager.stopAutoRefresh();
});
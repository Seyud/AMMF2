/**
 * AMMF WebUI 日志页面模块
 * 查看和管理模块日志
 */

const LogsPage = {
    // 日志文件路径
    logFiles: {
        'service': `${Core.MODULE_PATH}logs/service.log`,
        'service_old': `${Core.MODULE_PATH}logs/service.log.old`
    },
    
    // 当前选中的日志文件
    currentLogFile: 'service',
    
    // 日志内容
    logContent: '',
    
    // 自动刷新设置
    autoRefresh: false,
    refreshInterval: 5000,
    refreshTimer: null,
    
    // 初始化
    async init() {
        try {
            // 加载日志内容
            await this.loadLogContent();
            return true;
        } catch (error) {
            console.error('初始化日志页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container logs-page">
                <div class="logs-header card">
                    <div class="logs-selector">
                        <label for="log-file-select" data-i18n="SELECT_LOG_FILE">选择日志文件</label>
                        <select id="log-file-select">
                            <option value="service" ${this.currentLogFile === 'service' ? 'selected' : ''} data-i18n="SERVICE_LOG">
                                服务日志
                            </option>
                            <option value="service_old" ${this.currentLogFile === 'service_old' ? 'selected' : ''} data-i18n="SERVICE_LOG_OLD">
                                服务日志(旧)
                            </option>
                        </select>
                    </div>
                    <div class="logs-actions">
                        <button id="refresh-logs" class="md-button">
                            <span class="material-symbols-rounded">refresh</span>
                            <span data-i18n="REFRESH_LOGS">刷新日志</span>
                        </button>
                        <div class="auto-refresh-toggle">
                            <label for="auto-refresh-checkbox" data-i18n="AUTO_REFRESH">
                                自动刷新
                            </label>
                            <label class="switch">
                                <input type="checkbox" id="auto-refresh-checkbox" ${this.autoRefresh ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="logs-content card">
                    <pre id="logs-display">${this.escapeHtml(this.logContent) || I18n.translate('NO_LOGS', '没有可用的日志')}</pre>
                </div>
                
                <div class="logs-actions-bottom">
                    <button id="clear-logs" class="md-button warning">
                        <span class="material-symbols-rounded">delete</span>
                        <span data-i18n="CLEAR_LOGS">清除日志</span>
                    </button>
                    <button id="export-logs" class="md-button secondary">
                        <span class="material-symbols-rounded">download</span>
                        <span data-i18n="EXPORT_LOGS">导出日志</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender() {
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
    async loadLogContent(showToast = false) {
        try {
            const logPath = this.logFiles[this.currentLogFile];
            const content = await Core.readFile(logPath);
            
            this.logContent = content || '';
            
            // 更新UI
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = this.escapeHtml(this.logContent) || I18n.translate('NO_LOGS', '没有可用的日志');
                
                // 滚动到底部
                logsDisplay.scrollTop = logsDisplay.scrollHeight;
            }
            
            if (showToast) {
                Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
            }
        } catch (error) {
            console.error('加载日志内容失败:', error);
            this.logContent = '';
            
            // 更新UI
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = I18n.translate('LOGS_ERROR', '加载日志失败');
            }
            
            if (showToast) {
                Core.showToast(I18n.translate('LOGS_LOAD_ERROR', '加载日志失败'), 'error');
            }
        }
    },
    
    // 清除日志
    async clearLogs() {
        try {
            // 确认对话框
            if (!confirm(I18n.translate('CONFIRM_CLEAR_LOGS', '确定要清除此日志文件吗？'))) {
                return;
            }
            
            const logPath = this.logFiles[this.currentLogFile];
            
            // 清空日志文件
            await Core.writeFile(logPath, '');
            
            // 刷新日志显示
            this.logContent = '';
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = I18n.translate('NO_LOGS', '没有可用的日志');
            }
            
            Core.showToast(I18n.translate('LOGS_CLEARED', '日志已清除'));
        } catch (error) {
            console.error('清除日志失败:', error);
            Core.showToast(I18n.translate('LOGS_CLEAR_ERROR', '清除日志失败'), 'error');
        }
    },
    
    // 导出日志
    exportLogs() {
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
            
            Core.showToast(I18n.translate('LOGS_EXPORTED', '日志已导出'));
        } catch (error) {
            console.error('导出日志失败:', error);
            Core.showToast(I18n.translate('LOGS_EXPORT_ERROR', '导出日志失败'), 'error');
        }
    },
    
    // 启动自动刷新
    startAutoRefresh() {
        this.stopAutoRefresh(); // 先停止现有的定时器
        
        this.refreshTimer = setInterval(() => {
            this.loadLogContent();
        }, this.refreshInterval);
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },
    
    // HTML转义
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};

// 导出日志页面模块
window.LogsPage = LogsPage;
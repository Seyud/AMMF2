/**
 * AMMF WebUI 日志页面模块
 * 查看和管理模块日志
 */

const LogsPage = {
    // 日志文件路径
    logFiles: {},
    
    // 当前选中的日志文件
    currentLogFile: '',
    
    // 日志内容
    logContent: '',
    
    // 自动刷新设置
    autoRefresh: false,
    refreshInterval: 5000,
    refreshTimer: null,
    
    // 初始化
    async init() {
        try {
            // 扫描可用的日志文件
            await this.scanLogFiles();
            
            // 设置默认日志文件
            if (Object.keys(this.logFiles).length > 0) {
                this.currentLogFile = Object.keys(this.logFiles)[0];
            }
            
            // 加载日志内容
            await this.loadLogContent();
            return true;
        } catch (error) {
            console.error('初始化日志页面失败:', error);
            return false;
        }
    },
    
    // 扫描可用的日志文件
    async scanLogFiles() {
        try {
            // 获取logs目录下的所有日志文件
            const result = await Core.execCommand(`find "${Core.MODULE_PATH}logs/" -name "*.log" -o -name "*.log.old" | sort`);
            
            if (result) {
                const files = result.split('\n').filter(file => file.trim() !== '');
                
                // 清空现有日志文件列表
                this.logFiles = {};
                
                // 添加找到的日志文件
                files.forEach(file => {
                    const fileName = file.split('/').pop();
                    const displayName = this.getDisplayName(fileName);
                    this.logFiles[fileName] = file;
                });
                
                console.log('可用日志文件:', this.logFiles);
            }
            
            // 如果没有找到日志文件，添加默认的service.log
            if (Object.keys(this.logFiles).length === 0) {
                this.logFiles['service.log'] = `${Core.MODULE_PATH}logs/service.log`;
            }
        } catch (error) {
            console.error('扫描日志文件失败:', error);
            // 添加默认日志
            this.logFiles['service.log'] = `${Core.MODULE_PATH}logs/service.log`;
        }
    },
    
    // 获取日志文件的显示名称
    getDisplayName(fileName) {
        // 移除.log和.old后缀
        let name = fileName.replace(/\.log(\.old)?$/, '');
        
        // 首字母大写
        name = name.charAt(0).toUpperCase() + name.slice(1);
        
        // 添加后缀说明
        if (fileName.endsWith('.old')) {
            name += ' (旧)';
        }
        
        return name;
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container logs-page">
                <div class="logs-header card">
                    <div class="logs-selector">
                        <label for="log-file-select" data-i18n="SELECT_LOG_FILE">选择日志文件</label>
                        <select id="log-file-select">
                            ${this.renderLogFileOptions()}
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
    
    // 渲染日志文件选项
    renderLogFileOptions() {
        let options = '';
        
        Object.keys(this.logFiles).forEach(fileName => {
            const displayName = this.getDisplayName(fileName);
            options += `<option value="${fileName}" ${this.currentLogFile === fileName ? 'selected' : ''}>${displayName}</option>`;
        });
        
        return options;
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
    
    // 开始自动刷新
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
    },
    
    // 添加事件监听器
    addEventListeners() {
        // 日志文件选择
        const logFileSelect = document.getElementById('log-file-select');
        if (logFileSelect) {
            logFileSelect.addEventListener('change', () => {
                this.currentLogFile = logFileSelect.value;
                this.loadLogContent(true);
            });
        }
        
        // 刷新按钮
        const refreshButton = document.getElementById('refresh-logs');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadLogContent(true);
            });
        }
        
        // 自动刷新开关
        const autoRefreshCheckbox = document.getElementById('auto-refresh-checkbox');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', () => {
                this.autoRefresh = autoRefreshCheckbox.checked;
                if (this.autoRefresh) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }
        
        // 清除日志按钮
        const clearButton = document.getElementById('clear-logs');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearLogs();
            });
        }
        
        // 导出日志按钮
        const exportButton = document.getElementById('export-logs');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportLogs();
            });
        }
    },
    
    // 页面激活时调用
    onActivate() {
        // 如果启用了自动刷新，开始刷新
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    },
    
    // 页面停用时调用
    onDeactivate() {
        // 停止自动刷新
        this.stopAutoRefresh();
    }
};
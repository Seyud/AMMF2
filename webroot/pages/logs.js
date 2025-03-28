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
            // 检查日志目录是否存在
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const dirExists = await this.checkLogsDirectoryExists(logsDir);
            
            if (!dirExists) {
                console.warn('日志目录不存在');
            }
            
            // 扫描可用的日志文件
            await this.scanLogFiles();
            
            // 设置默认日志文件
            if (Object.keys(this.logFiles).length > 0) {
                this.currentLogFile = Object.keys(this.logFiles)[0];
                await this.loadLogContent();
            } else {
                this.logContent = I18n.translate('NO_LOGS_FILES', '没有找到日志文件');
            }
            
            return true;
        } catch (error) {
            console.error('初始化日志页面失败:', error);
            return false;
        }
    },
    
    // 检查日志目录是否存在
    async checkLogsDirectoryExists(logsDir) {
        try {
            const result = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error('检查日志目录失败:', error);
            return false;
        }
    },
    
    // 扫描日志文件
    async scanLogFiles() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;
            
            // 检查目录是否存在
            const dirExists = await this.checkLogsDirectoryExists(logsDir);
            if (!dirExists) {
                console.warn('日志目录不存在');
                this.logFiles = {};
                return;
            }
            
            // 获取logs目录下的所有日志文件
            const result = await Core.execCommand(`find "${logsDir}" -type f -name "*.log" -o -name "*.log.old" 2>/dev/null | sort`);
            
            // 清空现有日志文件列表
            this.logFiles = {};
            
            if (!result || result.trim() === '') {
                console.warn('没有找到日志文件');
                return;
            }
            
            // 解析日志文件列表
            const files = result.split('\n').filter(file => file.trim() !== '');
            
            files.forEach(file => {
                const fileName = file.split('/').pop();
                this.logFiles[fileName] = file;
            });
            
            console.log(`找到 ${Object.keys(this.logFiles).length} 个日志文件`);
        } catch (error) {
            console.error('扫描日志文件失败:', error);
            this.logFiles = {};
        }
    },
    
    // 加载日志内容
    async loadLogContent(showToast = false) {
        try {
            const logPath = this.logFiles[this.currentLogFile];
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                this.logContent = '';
                const logsDisplay = document.getElementById('logs-display');
                if (logsDisplay) {
                    logsDisplay.innerHTML = I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在');
                }
                
                if (showToast) {
                    Core.showToast(I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在'), 'warning');
                }
                return;
            }
            
            // 读取日志文件内容
            const content = await Core.execCommand(`cat "${logPath}"`);
            this.logContent = content || '';
            
            // 更新显示
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = this.escapeHtml(this.logContent) || I18n.translate('NO_LOGS', '没有可用的日志');
            }
            
            if (showToast) {
                Core.showToast(I18n.translate('LOGS_REFRESHED', '日志已刷新'));
            }
        } catch (error) {
            console.error('加载日志内容失败:', error);
            this.logContent = '';
            
            const logsDisplay = document.getElementById('logs-display');
            if (logsDisplay) {
                logsDisplay.innerHTML = I18n.translate('LOGS_LOAD_ERROR', '加载日志失败');
            }
            
            if (showToast) {
                Core.showToast(I18n.translate('LOGS_LOAD_ERROR', '加载日志失败'), 'error');
            }
        }
    },
    
    // 清除日志
    async clearLog() {
        try {
            const logPath = this.logFiles[this.currentLogFile];
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                Core.showToast(I18n.translate('LOG_FILE_NOT_FOUND', '日志文件不存在'), 'warning');
                return;
            }
            
            // 确认对话框
            if (!confirm(I18n.translate('CONFIRM_CLEAR_LOG', '确定要清除此日志文件吗？此操作不可撤销。'))) {
                return;
            }
            
            // 清空日志文件 - 使用更可靠的方式
            try {
                // 先尝试直接清空
                await Core.execCommand(`echo "" > "${logPath}"`);
                
                // 检查是否成功清空
                const fileSize = await Core.execCommand(`stat -c %s "${logPath}"`);
                
                // 如果文件大小不为0或接近0，尝试使用cat /dev/null方式
                if (parseInt(fileSize.trim()) > 10) {
                    await Core.execCommand(`cat /dev/null > "${logPath}"`);
                    console.log('使用cat /dev/null方式清空日志');
                }
                
                // 确保文件权限正确
                await Core.execCommand(`chmod 666 "${logPath}"`);
            } catch (clearError) {
                console.error('清空日志文件失败，尝试备用方法:', clearError);
                // 备用方法：删除并重新创建
                await Core.execCommand(`rm "${logPath}" && touch "${logPath}" && chmod 666 "${logPath}"`);
            }
            
            // 重新加载日志内容
            await this.loadLogContent();
            
            Core.showToast(I18n.translate('LOG_CLEARED', '日志已清除'));
        } catch (error) {
            console.error('清除日志失败:', error);
            Core.showToast(I18n.translate('LOG_CLEAR_ERROR', '清除日志失败'), 'error');
        }
    },
    
    // 导出日志
    exportLog() {
        try {
            if (!this.logContent) {
                Core.showToast(I18n.translate('NO_LOGS_TO_EXPORT', '没有可导出的日志'), 'warning');
                return;
            }
            
            // 获取日志文件路径
            const logPath = this.logFiles[this.currentLogFile];
            
            // 使用cp命令复制到下载文件夹
            const downloadDir = '/sdcard/Download/';
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `${this.currentLogFile}_${timestamp}`;
            
            // 确保下载目录存在
            Core.execCommand(`mkdir -p "${downloadDir}"`).then(() => {
                // 复制文件到下载目录
                Core.execCommand(`cp "${logPath}" "${downloadDir}${exportFileName}"`).then(() => {
                    Core.showToast(I18n.translate('LOG_EXPORTED', `日志已导出到: ${downloadDir}${exportFileName}`));
                }).catch(err => {
                    console.error('复制日志文件失败:', err);
                    Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败'), 'error');
                });
            }).catch(err => {
                console.error('创建下载目录失败:', err);
                Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '创建下载目录失败'), 'error');
            });
        } catch (error) {
            console.error('导出日志失败:', error);
            Core.showToast(I18n.translate('LOG_EXPORT_ERROR', '导出日志失败'), 'error');
        }
    },
    
    // 开始自动刷新
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.autoRefresh = true;
        this.refreshTimer = setInterval(() => {
            this.loadLogContent();
        }, this.refreshInterval);
        
        console.log(`已启动自动刷新，间隔: ${this.refreshInterval}ms`);
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
        
        this.autoRefresh = false;
        console.log('已停止自动刷新');
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
    
    // 渲染日志文件选项
    renderLogFileOptions() {
        if (Object.keys(this.logFiles).length === 0) {
            return '<option value="" disabled>没有可用的日志文件</option>';
        }
        
        let options = '';
        for (const fileName in this.logFiles) {
            options += `<option value="${fileName}" ${this.currentLogFile === fileName ? 'selected' : ''}>${fileName}</option>`;
        }
        
        return options;
    },
    
    // 渲染页面
    render() {
        // 检查是否有日志文件
        const hasLogFiles = Object.keys(this.logFiles).length > 0;
        
        return `
            <div class="page-container logs-page">
                <div class="logs-header card">
                    <div class="logs-selector">
                        <label for="log-file-select" data-i18n="SELECT_LOG_FILE">选择日志文件</label>
                        <select id="log-file-select" ${!hasLogFiles ? 'disabled' : ''}>
                            ${this.renderLogFileOptions()}
                        </select>
                    </div>
                    <div class="logs-actions">
                        <button id="refresh-logs" class="md-button" ${!hasLogFiles ? 'disabled' : ''}>
                            <span class="material-symbols-rounded">refresh</span>
                            <span data-i18n="REFRESH_LOGS">刷新日志</span>
                        </button>
                        <div class="auto-refresh-toggle">
                            <label for="auto-refresh-checkbox" data-i18n="AUTO_REFRESH">
                                自动刷新
                            </label>
                            <label class="switch">
                                <input type="checkbox" id="auto-refresh-checkbox" ${this.autoRefresh ? 'checked' : ''} ${!hasLogFiles ? 'disabled' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="logs-note card">
                    <p><small data-i18n="LOGS_READ_ONLY_NOTE">注意：日志查看功能默认为只读模式，不会自动修改日志文件。</small></p>
                </div>
                
                <div class="webui-logging-control card">
                    <div class="logging-status">
                        <span data-i18n="WEBUI_LOGGING_STATUS">WebUI日志记录状态:</span>
                        <span id="logging-status-indicator" class="${Logger.loggingEnabled ? 'enabled' : 'disabled'}">
                            ${Logger.loggingEnabled ? I18n.translate('LOGGING_ENABLED', '已启用') : I18n.translate('LOGGING_DISABLED', '已禁用')}
                        </span>
                    </div>
                    <button id="toggle-logging" class="md-button ${Logger.loggingEnabled ? 'warning' : 'primary'}">
                        <span class="material-symbols-rounded">${Logger.loggingEnabled ? 'stop_circle' : 'fiber_manual_record'}</span>
                        <span data-i18n="${Logger.loggingEnabled ? 'STOP_LOGGING' : 'START_LOGGING'}">
                            ${Logger.loggingEnabled ? '停止记录' : '开始记录'}
                        </span>
                    </button>
                </div>
                
                <div class="logs-content card">
                    <pre id="logs-display">${hasLogFiles ? this.escapeHtml(this.logContent) || I18n.translate('NO_LOGS', '没有可用的日志') : I18n.translate('NO_LOGS_FILES', '没有找到日志文件')}</pre>
                </div>
                
                <div class="logs-actions-bottom">
                    <button id="clear-logs" class="md-button warning" ${!hasLogFiles ? 'disabled' : ''}>
                        <span class="material-symbols-rounded">delete</span>
                        <span data-i18n="CLEAR_LOGS">清除日志</span>
                    </button>
                    <button id="export-logs" class="md-button secondary" ${!hasLogFiles || !this.logContent ? 'disabled' : ''}>
                        <span class="material-symbols-rounded">download</span>
                        <span data-i18n="EXPORT_LOGS">导出日志</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender() {
        // 添加日志文件选择器事件
        const logSelector = document.getElementById('log-file-select');
        if (logSelector) {
            logSelector.addEventListener('change', (e) => {
                this.currentLogFile = e.target.value;
                this.loadLogContent(true);
            });
        }
        
        // 添加刷新按钮事件
        const refreshButton = document.getElementById('refresh-logs');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadLogContent(true);
            });
        }
        
        // 添加自动刷新切换事件
        const autoRefreshCheckbox = document.getElementById('auto-refresh-checkbox');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }
        
        // 添加清除日志按钮事件
        const clearButton = document.getElementById('clear-logs');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearLog();
            });
        }
        
        // 添加导出日志按钮事件
        const exportButton = document.getElementById('export-logs');
        if (exportButton) {
            exportButton.addEventListener('click', () => {
                this.exportLog();
            });
        }
        
        // 添加日志记录开关按钮事件
        const toggleLoggingButton = document.getElementById('toggle-logging');
        if (toggleLoggingButton) {
            toggleLoggingButton.addEventListener('click', () => {
                if (Logger.loggingEnabled) {
                    Logger.stopLogging();
                } else {
                    Logger.startLogging();
                }
                
                // 更新按钮状态
                Logger.updateLoggingUI();
            });
        }
        
        // 如果设置了自动刷新，启动自动刷新
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
    },
    
    // 页面激活时的回调
    onActivate() {
        // 如果设置了自动刷新，启动自动刷新
        if (this.autoRefresh) {
            this.startAutoRefresh();
        }
        
        // 更新日志记录UI状态
        Logger.updateLoggingUI();
    },
    
    // 页面停用时的回调
    onDeactivate() {
        // 停止自动刷新
        this.stopAutoRefresh();
    }
};

// 导出日志页面模块
window.LogsPage = LogsPage;
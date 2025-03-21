// 日志管理
const logsManager = {
    // 日志文件路径
    logFilePath: '/data/adb/modules/AMMF/logs/service.log',
    
    // 当前日志内容
    currentLogs: '',
    
    // 当前过滤级别
    currentFilter: 'all',
    
    // 初始化
    init: function() {
        // 添加事件监听器前检查元素是否存在
        const logsCard = document.getElementById('logs-card');
        if (logsCard) {
            logsCard.addEventListener('click', () => {
                this.loadLogs();
            });
        }
        
        // 刷新日志按钮
        const refreshLogs = document.getElementById('refresh-logs');
        if (refreshLogs) {
            refreshLogs.addEventListener('click', () => {
                this.loadLogs();
                // 添加按钮点击动画
                navigation.addButtonClickAnimation('refresh-logs');
            });
        }
        
        // 清空日志按钮
        const clearLogs = document.getElementById('clear-logs');
        if (clearLogs) {
            clearLogs.addEventListener('click', () => {
                this.clearLogs();
                // 添加按钮点击动画
                navigation.addButtonClickAnimation('clear-logs');
            });
        }
        
        // 日志过滤器
        const logFilter = document.getElementById('log-filter');
        if (logFilter) {
            logFilter.addEventListener('change', (e) => {
                this.filterLogs(e.target.value);
            });
        }
    },
    
    // 加载日志
    loadLogs: async function() {
        try {
            // 显示加载指示器
            document.getElementById('logs-loading').style.display = 'flex';
            document.getElementById('logs-display').style.display = 'none';
            document.getElementById('no-logs-message').style.display = 'none';
            
            // 检查模块是否安装
            const moduleInstalled = await this.checkModuleInstalled();
            if (!moduleInstalled) {
                document.getElementById('logs-loading').style.display = 'none';
                document.getElementById('no-logs-message').style.display = 'flex';
                document.getElementById('no-logs-text').textContent = translations[state.language].moduleNotInstalled || '模块未安装';
                return;
            }
            
            // 检查日志文件是否存在
            const logFileExists = await this.checkFileExists(this.logFilePath);
            if (!logFileExists) {
                document.getElementById('logs-loading').style.display = 'none';
                document.getElementById('no-logs-message').style.display = 'flex';
                document.getElementById('no-logs-text').textContent = translations[state.language].noLogsFile || '日志文件不存在（模块可能未运行或刚刚启动）';
                return;
            }
            
            // 获取日志文件内容
            const logs = await this.getLogContent();
            this.currentLogs = logs;
            
            // 显示日志
            this.displayLogs(logs);
            
        } catch (error) {
            console.error('加载日志失败:', error);
            showSnackbar(translations[state.language].logsLoadError || '加载日志失败');
            
            // 隐藏加载指示器
            document.getElementById('logs-loading').style.display = 'none';
            document.getElementById('logs-display').style.display = 'none';
            document.getElementById('no-logs-message').style.display = 'flex';
            document.getElementById('no-logs-text').textContent = translations[state.language].logsLoadError || '加载日志失败';
        }
    },
    
    // 检查模块是否安装
    checkModuleInstalled: async function() {
        try {
            const result = await execCommand('ls /data/adb/modules/AMMF');
            return result.trim() !== '';
        } catch (error) {
            console.error('检查模块安装状态失败:', error);
            return false;
        }
    },
    
    // 检查文件是否存在
    checkFileExists: async function(filePath) {
        try {
            await execCommand(`ls ${filePath}`);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    // 获取日志内容
    getLogContent: async function() {
        try {
            // 检查日志文件是否存在
            const fileExists = await this.checkFileExists(this.logFilePath);
            if (!fileExists) {
                return '';
            }
            
            // 获取日志内容
            const content = await execCommand(`cat ${this.logFilePath}`);
            return content;
        } catch (error) {
            console.error('获取日志内容失败:', error);
            throw error;
        }
    },
    
    // 显示日志
    displayLogs: function(logs) {
        // 隐藏加载指示器
        document.getElementById('logs-loading').style.display = 'none';
        
        // 获取日志显示容器
        const logsDisplay = document.getElementById('logs-display');
        
        // 如果没有日志，显示提示信息
        if (!logs || logs.trim() === '') {
            logsDisplay.style.display = 'none';
            document.getElementById('no-logs-message').style.display = 'flex';
            document.getElementById('no-logs-text').textContent = translations[state.language].noLogs || '暂无日志';
            return;
        }
        
        // 显示日志容器
        logsDisplay.style.display = 'block';
        document.getElementById('no-logs-message').style.display = 'none';
        
        // 清空现有日志
        logsDisplay.innerHTML = '';
        
        // 按行分割日志
        const logLines = logs.split('\n');
        
        // 应用过滤器
        const filteredLines = this.filterLogLines(logLines);
        
        // 如果过滤后没有日志，显示提示信息
        if (filteredLines.length === 0) {
            logsDisplay.style.display = 'none';
            document.getElementById('no-logs-message').style.display = 'flex';
            document.getElementById('no-logs-text').textContent = translations[state.language].noMatchingLogs || '没有匹配的日志';
            return;
        }
        
        // 添加日志条目
        filteredLines.forEach(line => {
            if (line.trim() === '') return;
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // 根据日志级别添加类
            if (line.includes('[ERROR]')) {
                logEntry.classList.add('log-error');
            } else if (line.includes('[WARN]')) {
                logEntry.classList.add('log-warn');
            } else if (line.includes('[INFO]')) {
                logEntry.classList.add('log-info');
            } else if (line.includes('[DEBUG]')) {
                logEntry.classList.add('log-debug');
            }
            
            logEntry.textContent = line;
            logsDisplay.appendChild(logEntry);
        });
        
        // 滚动到底部
        logsDisplay.scrollTop = logsDisplay.scrollHeight;
    },
    
    // 过滤日志行
    filterLogLines: function(lines) {
        // 如果过滤级别是全部，返回所有行
        if (this.currentFilter === 'all') {
            return lines;
        }
        
        // 根据过滤级别过滤日志行
        return lines.filter(line => {
            switch (this.currentFilter) {
                case 'ERROR':
                    return line.includes('[ERROR]');
                case 'WARN':
                    return line.includes('[WARN]');
                case 'INFO':
                    return line.includes('[INFO]');
                case 'DEBUG':
                    return line.includes('[DEBUG]');
                default:
                    return true;
            }
        });
    },
    
    // 过滤日志
    filterLogs: function(level) {
        this.currentFilter = level;
        this.displayLogs(this.currentLogs);
    },
    
    // 解析日志条目
    parseLogEntries: function(logs) {
        const lines = logs.split('\n');
        const entries = [];
        
        lines.forEach(line => {
            if (line.trim() === '') return;
            
            // 尝试提取日志级别
            let level = 'INFO'; // 默认级别
            if (line.includes('[ERROR]')) level = 'ERROR';
            else if (line.includes('[WARN]')) level = 'WARN';
            else if (line.includes('[INFO]')) level = 'INFO';
            else if (line.includes('[DEBUG]')) level = 'DEBUG';
            
            entries.push({
                text: line,
                level: level
            });
        });
        
        return entries;
    },
    
    // 清除日志
    clearLogs: async function() {
        try {
            // 确认对话框
            if (!confirm(translations[state.language].confirmClearLogs || '确定要清除所有日志吗？')) {
                return;
            }
            
            // 清空日志文件
            await execCommand(`su -c "echo '--- 日志已清除 $(date) ---' > ${this.logFilePath}"`);
            
            // 重新加载日志
            this.loadLogs();
            
            showSnackbar(translations[state.language].logsClearedSuccess || '日志已清除');
        } catch (error) {
            console.error('清除日志失败:', error);
            showSnackbar(translations[state.language].logsClearError || '清除日志失败');
        }
    },
    
    // 更新UI文本
    updateUIText: function() {
        document.getElementById('logs-title').textContent = translations[state.language].logs_title || '运行日志';
        document.getElementById('logs-description').textContent = translations[state.language].logs_description || '查看模块运行日志';
        document.getElementById('logs-page-title').textContent = translations[state.language].logs_page_title || '模块日志';
        document.getElementById('back-text-logs').textContent = translations[state.language].back || '返回';
        document.getElementById('logs-loading-text').textContent = translations[state.language].loading || '加载日志中...';
        document.getElementById('refresh-logs-text').textContent = translations[state.language].refresh || '刷新';
        document.getElementById('clear-logs-text').textContent = translations[state.language].clear || '清空';
        document.getElementById('filter-label').textContent = translations[state.language].filterLevel || '过滤级别:';
        document.getElementById('no-logs-text').textContent = translations[state.language].noLogs || '暂无日志';
        
        // 更新过滤器选项
        const filterSelect = document.getElementById('log-level-filter');
        if (filterSelect) {
            filterSelect.options[0].text = translations[state.language].allLevels || '所有级别';
            filterSelect.options[1].text = translations[state.language].errorLevel || '错误';
            filterSelect.options[2].text = translations[state.language].warnLevel || '警告';
            filterSelect.options[3].text = translations[state.language].infoLevel || '信息';
            filterSelect.options[4].text = translations[state.language].debugLevel || '调试';
        }
    }
};
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
                navigation.navigateTo('logs');
                this.loadLogs();
                navigation.addButtonClickAnimation('logs-card');
            });
        }
        
        const backButton = document.getElementById('back-to-home-logs');
        if (backButton) {
            backButton.addEventListener('click', () => {
                navigation.navigateTo('home');
                navigation.addButtonClickAnimation('back-to-home-logs');
            });
        }
        
        document.getElementById('refresh-logs').addEventListener('click', () => {
            this.loadLogs();
            navigation.addButtonClickAnimation('refresh-logs');
        });
        
        document.getElementById('clear-logs').addEventListener('click', () => {
            this.clearLogs();
            navigation.addButtonClickAnimation('clear-logs');
        });
        
        // 日志级别过滤器
        document.getElementById('log-level-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.displayLogs(this.currentLogs);
        });
    },
    
    // 加载日志
    loadLogs: async function() {
        try {
            // 显示加载指示器
            document.getElementById('logs-loading').style.display = 'flex';
            document.getElementById('logs-display').style.display = 'none';
            document.getElementById('no-logs-message').style.display = 'none';
            
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
    
    // 获取日志内容
    getLogContent: async function() {
        try {
            // 检查日志文件是否存在
            const fileExists = await this.checkFileExists(this.logFilePath);
            if (!fileExists) {
                return '';
            }
            
            // 读取日志文件
            const logs = await execCommand(`cat ${this.logFilePath}`);
            return logs;
        } catch (error) {
            console.error('读取日志文件失败:', error);
            throw error;
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
        
        // 解析日志
        const logEntries = this.parseLogEntries(logs);
        
        // 清空日志显示容器
        logsDisplay.innerHTML = '';
        
        // 添加日志条目
        logEntries.forEach(entry => {
            // 如果设置了过滤器且不是"all"，则只显示匹配的日志级别
            if (this.currentFilter !== 'all' && !entry.level.includes(this.currentFilter)) {
                return;
            }
            
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${entry.level}`;
            logEntry.textContent = entry.text;
            logsDisplay.appendChild(logEntry);
        });
        
        // 如果过滤后没有日志，显示提示信息
        if (logsDisplay.children.length === 0) {
            document.getElementById('no-logs-message').style.display = 'flex';
            document.getElementById('no-logs-text').textContent = translations[state.language].noMatchingLogs || '没有匹配的日志';
        }
        
        // 滚动到底部
        logsDisplay.scrollTop = logsDisplay.scrollHeight;
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
        
        // 更新过滤器选项
        const filterSelect = document.getElementById('log-level-filter');
        filterSelect.options[0].text = translations[state.language].allLevels || '所有级别';
        filterSelect.options[1].text = translations[state.language].errorLevel || '错误';
        filterSelect.options[2].text = translations[state.language].warnLevel || '警告';
        filterSelect.options[3].text = translations[state.language].infoLevel || '信息';
        filterSelect.options[4].text = translations[state.language].debugLevel || '调试';
    }
};
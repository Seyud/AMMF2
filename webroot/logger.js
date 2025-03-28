/**
 * WebUI 日志系统
 * 提供日志记录、管理和导出功能
 */
class Logger {
    constructor() {
        // 日志记录状态
        this.loggingEnabled = false;
        
        // 日志级别
        this.LOG_LEVELS = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        // 当前日志级别
        this.currentLevel = this.LOG_LEVELS.INFO;
        
        // 日志缓冲区
        this.logBuffer = [];
        
        // 日志文件路径
        this.logFilePath = `${Core.MODULE_PATH}logs/webui.log`;
        
        // 最大缓冲区大小，超过此大小将自动写入文件
        this.maxBufferSize = 100;
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化日志系统
     */
    init() {
        // 覆盖原生控制台方法
        this.overrideConsoleMethods();
        
        // 绑定日志控制按钮事件
        document.addEventListener('DOMContentLoaded', () => {
            this.bindLogControlEvents();
        });
        
        console.info('Logger 系统已初始化');
    }
    
    /**
     * 绑定日志控制按钮事件
     */
    bindLogControlEvents() {
        const toggleButton = document.getElementById('toggle-logging');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                if (this.loggingEnabled) {
                    this.stopLogging();
                } else {
                    this.startLogging();
                }
                
                // 更新按钮状态
                this.updateLoggingUI();
            });
        }
    }
    
    /**
     * 更新日志记录UI状态
     */
    updateLoggingUI() {
        const statusIndicator = document.getElementById('logging-status-indicator');
        const toggleButton = document.getElementById('toggle-logging');
        
        if (statusIndicator) {
            statusIndicator.className = this.loggingEnabled ? 'enabled' : 'disabled';
            statusIndicator.textContent = this.loggingEnabled ? 
                I18n.translate('LOGGING_ENABLED', '已启用') : 
                I18n.translate('LOGGING_DISABLED', '已禁用');
        }
        
        if (toggleButton) {
            toggleButton.className = `md-button ${this.loggingEnabled ? 'warning' : 'primary'}`;
            
            const iconSpan = toggleButton.querySelector('.material-symbols-rounded');
            if (iconSpan) {
                iconSpan.textContent = this.loggingEnabled ? 'stop_circle' : 'fiber_manual_record';
            }
            
            const textSpan = toggleButton.querySelector('span:not(.material-symbols-rounded)');
            if (textSpan) {
                textSpan.setAttribute('data-i18n', this.loggingEnabled ? 'STOP_LOGGING' : 'START_LOGGING');
                textSpan.textContent = this.loggingEnabled ? 
                    I18n.translate('STOP_LOGGING', '停止记录') : 
                    I18n.translate('START_LOGGING', '开始记录');
            }
        }
    }
    
    /**
     * 开始记录日志
     */
    async startLogging() {
        if (this.loggingEnabled) return;
        
        try {
            // 确保日志目录存在
            await this.ensureLogDirectory();
            
            // 启用日志记录
            this.loggingEnabled = true;
            
            // 记录启动信息
            const timestamp = new Date().toISOString();
            this.log('INFO', `===== WebUI 日志记录开始于 ${timestamp} =====`);
            
            console.info('WebUI 日志记录已启动');
            Core.showToast(I18n.translate('LOGGING_STARTED', 'WebUI 日志记录已启动'));
        } catch (error) {
            console.error('启动日志记录失败:', error);
            Core.showToast(I18n.translate('LOGGING_START_ERROR', '启动日志记录失败'), 'error');
        }
    }
    
    /**
     * 停止记录日志
     */
    async stopLogging() {
        if (!this.loggingEnabled) return;
        
        try {
            // 记录停止信息
            const timestamp = new Date().toISOString();
            this.log('INFO', `===== WebUI 日志记录停止于 ${timestamp} =====`);
            
            // 确保所有缓冲区日志都写入文件
            await this.flushBuffer();
            
            // 禁用日志记录
            this.loggingEnabled = false;
            
            console.info('WebUI 日志记录已停止');
            Core.showToast(I18n.translate('LOGGING_STOPPED', 'WebUI 日志记录已停止'));
        } catch (error) {
            console.error('停止日志记录失败:', error);
            Core.showToast(I18n.translate('LOGGING_STOP_ERROR', '停止日志记录失败'), 'error');
        }
    }
    
    /**
     * 确保日志目录存在
     */
    async ensureLogDirectory() {
        const logsDir = `${Core.MODULE_PATH}logs/`;
        try {
            const result = await Core.execCommand(`mkdir -p "${logsDir}"`);
            return true;
        } catch (error) {
            console.error('创建日志目录失败:', error);
            throw error;
        }
    }
    
    /**
     * 记录日志
     * @param {string} level 日志级别
     * @param {string} message 日志消息
     * @param {Object} data 附加数据
     */
    log(level, message, data = null) {
        if (!this.loggingEnabled) return;
        
        const timestamp = new Date().toISOString();
        let logEntry = `[${timestamp}] [${level}] ${message}`;
        
        if (data) {
            try {
                const dataStr = typeof data === 'object' ? JSON.stringify(data) : data.toString();
                logEntry += ` | ${dataStr}`;
            } catch (e) {
                logEntry += ` | [无法序列化的数据]`;
            }
        }
        
        // 添加到缓冲区
        this.logBuffer.push(logEntry);
        
        // 如果缓冲区达到最大大小，则写入文件
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flushBuffer();
        }
    }
    
    /**
     * 将缓冲区内容写入日志文件
     */
    async flushBuffer() {
        if (this.logBuffer.length === 0) return;
        
        try {
            const content = this.logBuffer.join('\n') + '\n';
            
            // 使用追加模式写入文件
            await Core.execCommand(`echo '${content.replace(/'/g, "'\\''")}' >> "${this.logFilePath}"`);
            
            // 清空缓冲区
            this.logBuffer = [];
        } catch (error) {
            console.error('写入日志文件失败:', error);
        }
    }
    
    /**
     * 覆盖原生控制台方法
     */
    overrideConsoleMethods() {
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        // 覆盖 console.log
        console.log = (...args) => {
            originalConsole.log.apply(console, args);
            if (this.loggingEnabled && this.currentLevel <= this.LOG_LEVELS.DEBUG) {
                this.log('LOG', args.map(arg => this.formatArg(arg)).join(' '));
            }
        };
        
        // 覆盖 console.info
        console.info = (...args) => {
            originalConsole.info.apply(console, args);
            if (this.loggingEnabled && this.currentLevel <= this.LOG_LEVELS.INFO) {
                this.log('INFO', args.map(arg => this.formatArg(arg)).join(' '));
            }
        };
        
        // 覆盖 console.warn
        console.warn = (...args) => {
            originalConsole.warn.apply(console, args);
            if (this.loggingEnabled && this.currentLevel <= this.LOG_LEVELS.WARN) {
                this.log('WARN', args.map(arg => this.formatArg(arg)).join(' '));
            }
        };
        
        // 覆盖 console.error
        console.error = (...args) => {
            originalConsole.error.apply(console, args);
            if (this.loggingEnabled && this.currentLevel <= this.LOG_LEVELS.ERROR) {
                this.log('ERROR', args.map(arg => this.formatArg(arg)).join(' '));
            }
        };
        
        // 覆盖 console.debug
        console.debug = (...args) => {
            originalConsole.debug.apply(console, args);
            if (this.loggingEnabled && this.currentLevel <= this.LOG_LEVELS.DEBUG) {
                this.log('DEBUG', args.map(arg => this.formatArg(arg)).join(' '));
            }
        };
        
        // 添加全局错误处理
        window.addEventListener('error', (event) => {
            if (this.loggingEnabled) {
                this.log('ERROR', `未捕获的错误: ${event.message}`, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error ? event.error.stack : null
                });
            }
        });
        
        // 添加未处理的Promise拒绝处理
        window.addEventListener('unhandledrejection', (event) => {
            if (this.loggingEnabled) {
                this.log('ERROR', `未处理的Promise拒绝`, {
                    reason: this.formatArg(event.reason)
                });
            }
        });
    }
    
    /**
     * 格式化参数为字符串
     * @param {any} arg 参数
     * @returns {string} 格式化后的字符串
     */
    formatArg(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg);
            } catch (e) {
                return '[无法序列化的对象]';
            }
        }
        
        return String(arg);
    }
    
    /**
     * 设置日志级别
     * @param {string} level 日志级别 (DEBUG, INFO, WARN, ERROR)
     */
    setLogLevel(level) {
        if (this.LOG_LEVELS[level] !== undefined) {
            this.currentLevel = this.LOG_LEVELS[level];
            console.info(`日志级别已设置为: ${level}`);
        } else {
            console.warn(`无效的日志级别: ${level}`);
        }
    }
}

// 创建全局Logger实例
window.Logger = new Logger();
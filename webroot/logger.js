/**
 * AMMF WebUI 日志系统
 * 用于记录WebUI的日志信息
 */

const Logger = {
    // 日志级别
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },
    
    // 当前日志级别
    currentLevel: 1, // 默认INFO级别
    
    // 日志文件路径
    logFile: 'logs/webui.log',
    
    // 是否同时输出到控制台
    consoleOutput: true,
    
    // 初始化日志系统
    async init() {
        try {
            // 确保日志目录存在
            const logsDir = `${Core.MODULE_PATH}logs/`;
            
            // 检查目录是否存在，如果不存在则创建
            const dirExistsResult = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            if (dirExistsResult.trim() !== "true") {
                console.warn('日志目录不存在，尝试创建');
                // 使用-p参数确保创建完整路径
                await Core.execCommand(`mkdir -p "${logsDir}"`);
                // 设置目录权限
                await Core.execCommand(`chmod 755 "${logsDir}"`);
            }
            
            // 设置完整的日志文件路径
            this.logFile = `${Core.MODULE_PATH}logs/webui.log`;
            
            // 检查日志文件是否存在，如果不存在则创建
            const fileExistsResult = await Core.execCommand(`[ -f "${this.logFile}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                await Core.execCommand(`touch "${this.logFile}"`);
                await Core.execCommand(`chmod 644 "${this.logFile}"`);
            }
            
            // 写入启动日志
            this.info('WebUI 日志系统初始化完成');
            this.info(`WebUI 启动于 ${new Date().toISOString()}`);
            
            // 替换全局console方法
            this.overrideConsole();
            
            // 添加全局错误处理
            this.setupGlobalErrorHandlers();
            
            return true;
        } catch (error) {
            console.error('初始化日志系统失败:', error);
            return false;
        }
    },
    
    // 检查目录是否存在
    async checkDirectoryExists(path) {
        try {
            const result = await Core.execCommand(`[ -d "${path}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error(`检查目录存在性失败: ${path}`, error);
            return false;
        }
    },
    
   // 检查日志系统状态
    async checkStatus() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;
            
            // 检查目录是否存在
            const dirExists = await this.checkDirectoryExists(logsDir);
            if (!dirExists) {
                this._originalConsole.warn('日志目录不存在');
                return {
                    status: 'error',
                    message: '日志目录不存在',
                    directory: logsDir
                };
            }
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${this.logFile}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                this._originalConsole.warn('日志文件不存在');
                return {
                    status: 'error',
                    message: '日志文件不存在',
                    file: this.logFile
                };
            }
            
            // 检查文件权限
            const permResult = await Core.execCommand(`ls -l "${this.logFile}" | awk '{print $1}'`);
            
            return {
                status: 'ok',
                directory: logsDir,
                file: this.logFile,
                permissions: permResult.trim(),
                level: Object.keys(this.LEVELS).find(key => this.LEVELS[key] === this.currentLevel)
            };
        } catch (error) {
            this._originalConsole.error('检查日志系统状态失败:', error);
            return {
                status: 'error',
                message: '检查日志系统状态失败',
                error: String(error)
            };
        }
    },
    
    // 写入日志
    async log(level, message, data) {
        // 检查日志级别
        if (level < this.currentLevel) return;
        
        try {
            // 格式化日志消息
            const timestamp = new Date().toISOString();
            const levelName = Object.keys(this.LEVELS).find(key => this.LEVELS[key] === level) || 'INFO';
            
            let logMessage = `[${timestamp}] [${levelName}] ${message}`;
            
            // 如果有附加数据，添加到日志中
            if (data !== undefined) {
                let dataStr;
                try {
                    if (typeof data === 'object') {
                        dataStr = JSON.stringify(data);
                    } else {
                        dataStr = String(data);
                    }
                    logMessage += ` - ${dataStr}`;
                } catch (e) {
                    logMessage += ` - [无法序列化的数据]`;
                }
            }
            
            // 添加换行符
            logMessage += '\n';
            
            // 写入日志文件
            await this.appendToLogFile(logMessage);
            
            // 如果启用了控制台输出，同时输出到控制台
            if (this.consoleOutput) {
                // 使用原始的console方法，避免递归调用
                this._originalConsole[levelName.toLowerCase()] && 
                this._originalConsole[levelName.toLowerCase()](message, data);
            }
        } catch (error) {
            // 使用原始console避免递归
            this._originalConsole.error('写入日志失败:', error);
        }
    },
    
    // 追加内容到日志文件
    async appendToLogFile(content) {
        try {
            // 确保日志目录存在
            const logsDir = `${Core.MODULE_PATH}logs/`;
            await Core.execCommand(`mkdir -p "${logsDir}"`);
            
            // 使用追加模式写入文件
            // 修改命令以确保在安卓环境下正确执行
            await Core.execCommand(`echo '${content.replace(/'/g, "'\\''")}' >> "${this.logFile}"`);
            
            // 添加同步命令，确保内容立即写入磁盘
            await Core.execCommand(`sync`);
            
            // 确保文件权限正确
            await Core.execCommand(`chmod 644 "${this.logFile}"`);
            return true;
        } catch (error) {
            // 记录错误但不再尝试备用方法，因为备用方法也使用了已移除的API
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error(`追加日志失败: ${this.logFile}`, error);
            }
            return false;
        }
    },
    
    // 修改getLogContent方法
    async getLogContent() {
        try {
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${this.logFile}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                return '';
            }
            
            // 读取日志文件内容
            return await Core.execCommand(`cat "${this.logFile}"`);
        } catch (error) {
            this._originalConsole.error('读取日志内容失败:', error);
            return '';
        }
    },
    
    // 设置日志级别
    setLevel(level) {
        if (this.LEVELS[level] !== undefined) {
            this.currentLevel = this.LEVELS[level];
        } else if (typeof level === 'number' && level >= 0 && level <= 3) {
            this.currentLevel = level;
        }
    },
    
    // 启用/禁用控制台输出
    setConsoleOutput(enabled) {
        this.consoleOutput = !!enabled;
    },
    
    // 替换全局console方法
    overrideConsole() {
        // 保存原始console方法
        this._originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
        
        // 替换console方法
        console.log = (...args) => this.info(...args);
        console.info = (...args) => this.info(...args);
        console.warn = (...args) => this.warn(...args);
        console.error = (...args) => this.error(...args);
        console.debug = (...args) => this.debug(...args);
    },
    
    // 恢复原始console方法
    restoreConsole() {
        if (this._originalConsole) {
            console.log = this._originalConsole.log;
            console.info = this._originalConsole.info;
            console.warn = this._originalConsole.warn;
            console.error = this._originalConsole.error;
            console.debug = this._originalConsole.debug;
        }
    },
    
    // 便捷方法：调试日志
    debug(message, data) {
        return this.log(this.LEVELS.DEBUG, message, data);
    },
    
    // 便捷方法：信息日志
    info(message, data) {
        return this.log(this.LEVELS.INFO, message, data);
    },
    
    // 便捷方法：警告日志
    warn(message, data) {
        return this.log(this.LEVELS.WARN, message, data);
    },
    
    // 便捷方法：错误日志
    error(message, data) {
        return this.log(this.LEVELS.ERROR, message, data);
    },
    
    // 设置全局错误处理
    setupGlobalErrorHandlers() {
        // 捕获未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.error('未处理的Promise错误', {
                reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : '未知原因'
            });
        });
        
        // 捕获全局JavaScript错误
        window.addEventListener('error', (event) => {
            this.error('JavaScript错误', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null
            });
        });
        
        // 捕获资源加载错误
        document.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                this.error('资源加载错误', {
                    element: event.target.tagName,
                    src: event.target.src || event.target.href
                });
            }
        }, true);
    },
    
    // 清空日志
    async clearLog() {
        try {
            // 清空日志文件
            await Core.execCommand(`echo "" > "${this.logFile}"`);
            this.info('日志已清空');
            return true;
        } catch (error) {
            this._originalConsole.error('清空日志失败:', error);
            return false;
        }
    },
    
};

// 导出Logger模块
window.Logger = Logger;
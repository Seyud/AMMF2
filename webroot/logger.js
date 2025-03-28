/**
 * AMMF WebUI 日志系统
 * 用于记录WebUI的日志信息，与C++日志监控器集成
 */

const Logger = {
    // 日志级别
    LEVELS: {
        DEBUG: 4,  // 调整为与C++端一致
        INFO: 3,
        WARN: 2,
        ERROR: 1
    },
    
    // 当前日志级别
    currentLevel: 3, // 默认INFO级别
    
    // 日志文件名称（不含路径和扩展名）
    logName: 'webui',
    
    // 是否同时输出到控制台
    consoleOutput: true,
    
    // 初始化日志系统
    async init() {
        try {
            // 保存原始console方法
            this._originalConsole = {
                log: console.log,
                info: console.info,
                warn: console.warn,
                error: console.error,
                debug: console.debug
            };
            
            // 确保日志目录存在
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const dirExistsResult = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            if (dirExistsResult.trim() !== "true") {
                console.warn('日志目录不存在，正在创建...');
                await Core.execCommand(`mkdir -p "${logsDir}" && chmod 755 "${logsDir}"`);
            }
            
            // 写入启动日志
            await this.info('WebUI 日志系统初始化完成');
            await this.info(`WebUI 启动于 ${new Date().toISOString()}`);
            
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
    
    // 写入日志 - 使用logmonitor的write命令
    async log(level, message, data) {
        // 检查日志级别
        if (level > this.currentLevel) return;
        
        try {
            // 确保日志目录和文件存在
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const logPath = `${logsDir}${this.logName}.log`;
            
            // 检查目录是否存在，不存在则创建
            const dirExistsResult = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            if (dirExistsResult.trim() !== "true") {
                await Core.execCommand(`mkdir -p "${logsDir}" && chmod 755 "${logsDir}"`);
            }
            
            // 检查文件是否存在，不存在则创建
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                await Core.execCommand(`touch "${logPath}" && chmod 666 "${logPath}"`);
            }
            
            // 格式化日志消息
            let logMessage = message;
            
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
            
            // 使用logmonitor写入日志
            const logmonitorPath = `${Core.MODULE_PATH}bin/logmonitor`;
            const cmd = `${logmonitorPath} -c write -n ${this.logName} -l ${level} -m "${logMessage.replace(/"/g, '\\"')}"`;
            
            await Core.execCommand(cmd);
            
            // 如果启用了控制台输出，同时输出到控制台
            if (this.consoleOutput && this._originalConsole) {
                const levelName = Object.keys(this.LEVELS).find(key => this.LEVELS[key] === level) || 'INFO';
                this._originalConsole[levelName.toLowerCase()] && 
                this._originalConsole[levelName.toLowerCase()](message, data);
            }
            
            return true;
        } catch (error) {
            // 使用原始console避免递归
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error('写入日志失败:', error);
            }
            return false;
        }
    },
    
    // 获取日志内容
    async getLogContent() {
        try {
            const logPath = `${Core.MODULE_PATH}logs/${this.logName}.log`;
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                return '';
            }
            
            // 读取日志文件内容
            return await Core.execCommand(`cat "${logPath}"`);
        } catch (error) {
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error('读取日志内容失败:', error);
            }
            return '';
        }
    },
    
    // 设置日志级别
    setLevel(level) {
        if (this.LEVELS[level] !== undefined) {
            this.currentLevel = this.LEVELS[level];
        } else if (typeof level === 'number' && level >= 1 && level <= 4) {
            this.currentLevel = level;
        }
    },
    
    // 启用/禁用控制台输出
    setConsoleOutput(enabled) {
        this.consoleOutput = !!enabled;
    },
    
    // 替换全局console方法
    overrideConsole() {
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
    async debug(message, data) {
        return this.log(this.LEVELS.DEBUG, message, data);
    },
    
    // 便捷方法：信息日志
    async info(message, data) {
        return this.log(this.LEVELS.INFO, message, data);
    },
    
    // 便捷方法：警告日志
    async warn(message, data) {
        return this.log(this.LEVELS.WARN, message, data);
    },
    
    // 便捷方法：错误日志
    async error(message, data) {
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
            const logmonitorPath = `${Core.MODULE_PATH}bin/logmonitor`;
            await Core.execCommand(`${logmonitorPath} -c clean -n ${this.logName}`);
            await this.info('日志已清空');
            return true;
        } catch (error) {
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error('清空日志失败:', error);
            }
            return false;
        }
    },
    
    // 刷新日志
    async flushLog() {
        try {
            const logmonitorPath = `${Core.MODULE_PATH}bin/logmonitor`;
            await Core.execCommand(`${logmonitorPath} -c flush`);
            return true;
        } catch (error) {
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error('刷新日志失败:', error);
            }
            return false;
        }
    },
    
    // 检查日志系统状态
    async checkStatus() {
        try {
            const logsDir = `${Core.MODULE_PATH}logs/`;
            const logPath = `${logsDir}${this.logName}.log`;
            
            // 检查目录是否存在
            const dirExistsResult = await Core.execCommand(`[ -d "${logsDir}" ] && echo "true" || echo "false"`);
            const dirExists = dirExistsResult.trim() === "true";
            
            if (!dirExists) {
                if (this._originalConsole && this._originalConsole.warn) {
                    this._originalConsole.warn('日志目录不存在');
                }
                return {
                    status: 'error',
                    message: '日志目录不存在',
                    directory: logsDir
                };
            }
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${logPath}" ] && echo "true" || echo "false"`);
            const fileExists = fileExistsResult.trim() === "true";
            
            if (!fileExists) {
                if (this._originalConsole && this._originalConsole.warn) {
                    this._originalConsole.warn('日志文件不存在');
                }
                return {
                    status: 'error',
                    message: '日志文件不存在',
                    file: logPath
                };
            }
            
            // 检查文件权限
            const permResult = await Core.execCommand(`ls -l "${logPath}" | awk '{print $1}'`);
            
            // 检查logmonitor是否可用
            const logmonitorPath = `${Core.MODULE_PATH}bin/logmonitor`;
            const logmonitorExistsResult = await Core.execCommand(`[ -f "${logmonitorPath}" ] && echo "true" || echo "false"`);
            const logmonitorExists = logmonitorExistsResult.trim() === "true";
            
            return {
                status: 'ok',
                directory: logsDir,
                file: logPath,
                permissions: permResult.trim(),
                level: Object.keys(this.LEVELS).find(key => this.LEVELS[key] === this.currentLevel),
                logmonitorAvailable: logmonitorExists
            };
        } catch (error) {
            if (this._originalConsole && this._originalConsole.error) {
                this._originalConsole.error('检查日志系统状态失败:', error);
            }
            return {
                status: 'error',
                message: '检查日志系统状态失败',
                error: String(error)
            };
        }
    }
};

// 导出Logger模块
window.Logger = Logger;
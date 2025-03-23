/**
 * AMMF WebUI 核心功能模块
 * 提供基础工具函数和Shell命令执行能力
 */

const Core = {
    // 模块路径
    MODULE_PATH: '/data/adb/modules/AMMF/',

    // 执行Shell命令
    async execCommand(command) {
        const callbackName = `exec_callback_${Date.now()}`;
        return new Promise((resolve, reject) => {
            window[callbackName] = (errno, stdout, stderr) => {
                delete window[callbackName];
                errno === 0 ? resolve(stdout) : reject(stderr);
            };
            ksu.exec(command, "{}", callbackName);
        });
    },

    // 读取文件内容
    async readFile(path) {
        try {
            console.log(`读取文件: ${path}`);
            const result = await this.execCommand(`cat "${path}"`);
            return result || null;
        } catch (error) {
            console.error(`读取文件失败: ${path}`, error);
            // 尝试备用方法
            try {
                return await this.execCommand(`sh -c "cat '${path}'"`);
            } catch (backupError) {
                console.error(`备用读取方法失败: ${path}`, backupError);
                return null;
            }
        }
    },

    // 写入文件内容
    async writeFile(path, content, append = false) {
        try {
            // 首先确保目录存在
            const dirPath = path.substring(0, path.lastIndexOf('/'));
            if (dirPath) {
                await this.createDirectory(dirPath);
            }
            
            // 使用更兼容的方式写入文件
            if (append) {
                // 追加模式
                await this.execCommand(`echo '${content.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' >> "${path}"`);
            } else {
                // 覆盖模式
                await this.execCommand(`echo '${content.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' > "${path}"`);
            }
            
            return true;
        } catch (error) {
            console.error(`写入文件失败: ${path}`, error);
            
            // 尝试备用方法
            try {
                // 对于较大的内容，可以尝试分块写入
                if (content.length > 1000) {
                    // 创建临时文件
                    const tempFile = `${path}.tmp`;
                    await this.execCommand(`touch "${tempFile}"`);
                    
                    // 分块写入
                    const chunkSize = 500;
                    for (let i = 0; i < content.length; i += chunkSize) {
                        const chunk = content.substr(i, chunkSize);
                        await this.execCommand(`echo '${chunk.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' >> "${tempFile}"`);
                    }
                    
                    // 移动到目标位置
                    if (append) {
                        await this.execCommand(`cat "${tempFile}" >> "${path}" && rm "${tempFile}"`);
                    } else {
                        await this.execCommand(`mv "${tempFile}" "${path}"`);
                    }
                    return true;
                }
                return false;
            } catch (backupError) {
                console.error(`备用写入方法也失败: ${path}`, backupError);
                return false;
            }
        }
    },

    // 检查文件是否存在
    async fileExists(path) {
        try {
            const result = await this.execCommand(`[ -f "${path}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error(`检查文件存在性失败: ${path}`, error);
            return false;
        }
    },

    // 检查目录是否存在
    async directoryExists(path) {
        try {
            const result = await this.execCommand(`[ -d "${path}" ] && echo "true" || echo "false"`);
            return result.trim() === "true";
        } catch (error) {
            console.error(`检查目录存在性失败: ${path}`, error);
            return false;
        }
    },

    // 创建目录
    async createDirectory(path) {
        try {
            await this.execCommand(`mkdir -p "${path}"`);
            return true;
        } catch (error) {
            console.error(`创建目录失败: ${path}`, error);
            return false;
        }
    },

    // 获取模块状态
    async getModuleStatus() {
        try {
            // 先检查status.txt文件是否存在
            const statusPath = `${this.MODULE_PATH}status.txt`;
            const exists = await this.fileExists(statusPath);
            if (!exists) {
                console.error(`状态文件不存在: ${statusPath}`);
                return 'UNKNOWN';
            }

            // 读取状态文件
            const status = await this.readFile(statusPath);
            if (!status) {
                console.error(`无法读取状态文件: ${statusPath}`);
                return 'UNKNOWN';
            }

            // 检查服务进程是否运行
            const isRunning = await this.isServiceRunning();

            // 如果状态文件显示运行中，但进程检查显示没有运行，则返回STOPPED
            if (status.trim() === 'RUNNING' && !isRunning) {
                console.warn('状态文件显示运行中，但服务进程未检测到');
                return 'STOPPED';
            }

            return status.trim() || 'UNKNOWN';
        } catch (error) {
            console.error('获取模块状态失败:', error);
            return 'ERROR';
        }
    },

    // 检查服务是否正在运行
    async isServiceRunning() {
        try {
            // 使用ps命令检查service.sh进程
            const result = await this.execCommand(`ps -ef | grep "${this.MODULE_PATH}service.sh" | grep -v grep | wc -l`);
            return parseInt(result.trim()) > 0;
        } catch (error) {
            console.error('检查服务运行状态失败:', error);
            return false;
        }
    },

    // 解析配置文件
    parseConfigFile(content) {
        if (!content) return {};

        const config = {};
        const lines = content.split('\n');

        for (let line of lines) {
            line = line.trim();

            // 跳过空行和注释行
            if (!line || line.startsWith('#')) continue;

            // 处理可能的注释
            const commentIndex = line.indexOf('#');
            if (commentIndex > 0) {
                line = line.substring(0, commentIndex).trim();
            }

            // 解析变量赋值
            const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();

                // 处理引号
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }

                config[key] = value;
            }
        }

        return config;
    },

    // 生成配置文件内容
    generateConfigContent(config, originalContent) {
        if (!config) return '';

        if (originalContent) {
            // 保留原始格式和注释
            const lines = originalContent.split('\n');
            const result = [];
            const processedKeys = new Set();

            for (const line of lines) {
                // 保留注释和空行
                if (!line.trim() || line.trim().startsWith('#')) {
                    result.push(line);
                    continue;
                }

                // 查找变量赋值
                const match = line.match(/^([A-Za-z0-9_]+)=(.*?)(\s*#.*)?$/);
                if (match) {
                    const [, key, , comment = ''] = match;

                    if (config.hasOwnProperty(key)) {
                        // 使用新值
                        let newValue = config[key];
                        const needsQuotes = newValue.includes(' ') ||
                            newValue.includes('\t') ||
                            newValue.includes('#') ||
                            newValue === '';

                        let newLine = `${key}=`;
                        if (needsQuotes) {
                            newLine += `"${newValue}"`;
                        } else {
                            newLine += newValue;
                        }

                        if (comment) {
                            newLine += comment;
                        }

                        result.push(newLine);
                        processedKeys.add(key);
                    } else {
                        // 保留原行
                        result.push(line);
                    }
                } else {
                    // 不是变量赋值，保留原行
                    result.push(line);
                }
            }

            // 添加新键
            for (const [key, value] of Object.entries(config)) {
                if (!processedKeys.has(key)) {
                    const needsQuotes = value.includes(' ') ||
                        value.includes('\t') ||
                        value.includes('#') ||
                        value === '';

                    if (needsQuotes) {
                        result.push(`${key}="${value}"`);
                    } else {
                        result.push(`${key}=${value}`);
                    }
                }
            }

            return result.join('\n');
        } else {
            // 生成新配置
            const result = ['#!/system/bin/sh', ''];

            for (const [key, value] of Object.entries(config)) {
                const needsQuotes = value.includes(' ') ||
                    value.includes('\t') ||
                    value.includes('#') ||
                    value === '';

                if (needsQuotes) {
                    result.push(`${key}="${value}"`);
                } else {
                    result.push(`${key}=${value}`);
                }
            }

            return result.join('\n');
        }
    },

    // 获取配置
    async getConfig() {
        try {
            const configPath = `${this.MODULE_PATH}module_settings/config.sh`;

            // 检查文件是否存在
            const exists = await this.fileExists(configPath);
            if (!exists) {
                console.error(`配置文件不存在: ${configPath}`);
                return this.getDefaultConfig();
            }

            // 读取配置文件
            const configContent = await this.readFile(configPath);
            if (!configContent) {
                console.error(`无法读取配置文件: ${configPath}`);
                return this.getDefaultConfig();
            }

            // 解析配置文件
            const config = this.parseConfigFile(configContent);
            console.log('成功读取配置:', config);
            return config;
        } catch (error) {
            console.error('获取配置出错:', error);
            return this.getDefaultConfig();
        }
    },
    async getDirectoryFiles(path, pattern = '') {
        try {
            let command = `ls -1 "${path}"`;
            if (pattern) {
                command += ` | grep "${pattern}"`;
            }
            const result = await this.execCommand(command);
            if (result) {
                return result.split('\n').filter(file => file.trim() !== '');
            }
            return [];
        } catch (error) {
            console.error(`获取目录文件列表失败: ${path}`, error);
            return [];
        }
    },

    // 执行脚本
    async executeScript(scriptPath, args = '') {
        try {
            console.log(`执行脚本: ${scriptPath} ${args}`);
            const result = await this.execCommand(`sh "${scriptPath}" ${args}`);
            return result;
        } catch (error) {
            console.error(`执行脚本失败: ${scriptPath}`, error);
            throw error;
        }
    },

    // 获取默认配置
    getDefaultConfig() {
        console.log('使用默认配置');
        return {
            action_id: "Module_ID",
            action_name: "Module Name",
            action_author: "Module Author",
            action_description: "Module Description",
            print_languages: "en",
            magisk_min_version: "25400",
            ksu_min_version: "11300",
            ksu_min_kernel_version: "11300",
            apatch_min_version: "10657",
            ANDROID_API: "26"
        };
    },

    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // 自动关闭
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, duration);
    },

    // DOM 就绪检查
    onDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
};

// 导出核心模块
window.Core = Core;

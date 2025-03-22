// webui for android
// 模块路径
const MODULE_PATH = '/data/adb/modules/AMMF/';

// 执行Shell命令
async function execCommand(command) {
    const callbackName = `exec_callback_${Date.now()}`;
    return new Promise((resolve, reject) => {
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            errno === 0 ? resolve(stdout) : reject(stderr);
        };
        ksu.exec(command, "{}", callbackName);
    });
}

// 增强readFile函数，添加更多调试信息
async function readFile(path) {
    try {
        console.log(`尝试读取文件: ${path}`);
        const result = await execCommand(`cat "${path}"`);
        if (result) {
            console.log(`文件读取成功: ${path}`);
            return result;
        } else {
            console.error(`文件读取失败，内容为空: ${path}`);
            return null;
        }
    } catch (error) {
        console.error(`读取文件错误 ${path}:`, error);
        // 尝试使用备用方法读取
        try {
            console.log(`尝试使用备用方法读取: ${path}`);
            return await execCommand(`sh -c "cat '${path}'"`);
        } catch (backupError) {
            console.error(`备用方法读取失败: ${path}`, backupError);
            return null;
        }
    }
}

// 检查文件是否存在
async function fileExists(path) {
    try {
        const result = await execCommand(`[ -f "${path}" ] && echo "true" || echo "false"`);
        return result.trim() === "true";
    } catch (error) {
        console.error(`检查文件存在性出错 ${path}:`, error);
        return false;
    }
}

// 写入文件内容
async function writeFile(path, content) {
    try {
        console.log(`尝试写入文件: ${path}`);
        // 使用echo和重定向写入文件
        await execCommand(`echo '${content.replace(/'/g, "'\\''")}' > "${path}"`);
        console.log(`文件写入成功: ${path}`);
        return true;
    } catch (error) {
        console.error(`写入文件错误 ${path}:`, error);
        return false;
    }
}

// 获取模块状态
async function getModuleStatus() {
    try {
        const status = await readFile(`${MODULE_PATH}status.txt`);
        return status ? status.trim() : 'UNKNOWN';
    } catch (error) {
        console.error('Error getting module status:', error);
        return 'ERROR';
    }
}

// 解析配置文件 - 改进版本
function parseConfigFile(content) {
    const config = {};
    const lines = content.split('\n');
    
    for (let line of lines) {
        // 去除行首尾空格
        line = line.trim();
        
        // 跳过空行和纯注释行
        if (!line || line.startsWith('#')) continue;
        
        // 分离注释部分
        let commentPart = '';
        let contentPart = line;
        
        // 查找注释位置（确保不在引号内）
        let inQuotes = false;
        let commentPos = -1;
        
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"' && (i === 0 || line[i-1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (line[i] === '#' && !inQuotes) {
                commentPos = i;
                break;
            }
        }
        
        // 如果找到注释，分离内容和注释
        if (commentPos !== -1) {
            contentPart = line.substring(0, commentPos).trim();
            commentPart = line.substring(commentPos);
        }
        
        // 解析变量赋值
        const match = contentPart.match(/^([A-Za-z0-9_]+)=(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2].trim();
            
            // 处理引号包裹的值
            if (value.startsWith('"') && value.endsWith('"')) {
                // 移除首尾引号
                value = value.substring(1, value.length - 1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
                // 移除首尾单引号
                value = value.substring(1, value.length - 1);
            }
            
            config[key] = value;
        }
    }
    
    return config;
}

// 生成配置文件内容 - 改进版本
function generateConfigContent(config, originalContent) {
    // 如果有原始内容，保留注释和格式
    if (originalContent) {
        const lines = originalContent.split('\n');
        const result = [];
        const processedKeys = new Set();
        
        for (const line of lines) {
            // 保留注释和空行
            if (!line.trim() || line.trim().startsWith('#')) {
                result.push(line);
                continue;
            }
            
            // 查找变量赋值，使用更精确的正则表达式
            const match = line.match(/^([A-Za-z0-9_]+)=(.*?)(\s*#.*)?$/);
            if (match) {
                const [, key, valueWithQuotes, comment = ''] = match;
                
                // 如果配置中有这个键，使用新值
                if (config.hasOwnProperty(key)) {
                    let newValue = config[key];
                    let newLine = `${key}=`;
                    
                    // 确定是否需要引号以及使用什么类型的引号
                    const needsQuotes = newValue.includes(' ') || 
                                       newValue.includes('\t') || 
                                       newValue.includes('#') ||
                                       newValue === '';
                    
                    // 检查原始值的引号类型
                    const originalValue = valueWithQuotes.trim();
                    const hasDoubleQuotes = originalValue.startsWith('"') && originalValue.endsWith('"');
                    const hasSingleQuotes = originalValue.startsWith("'") && originalValue.endsWith("'");
                    
                    if (needsQuotes) {
                        // 优先使用原始的引号类型
                        if (hasDoubleQuotes) {
                            newLine += `"${newValue}"`;
                        } else if (hasSingleQuotes) {
                            newLine += `'${newValue}'`;
                        } else {
                            // 默认使用双引号
                            newLine += `"${newValue}"`;
                        }
                    } else {
                        // 如果原始值有引号但新值不需要，仍保持原有的引号风格
                        if (hasDoubleQuotes) {
                            newLine += `"${newValue}"`;
                        } else if (hasSingleQuotes) {
                            newLine += `'${newValue}'`;
                        } else {
                            newLine += newValue;
                        }
                    }
                    
                    // 保留原有的注释
                    if (comment) {
                        newLine += comment;
                    }
                    
                    result.push(newLine);
                    processedKeys.add(key);
                } else {
                    // 否则保留原行
                    result.push(line);
                }
            } else {
                // 不是变量赋值，保留原行
                result.push(line);
            }
        }
        
        // 添加配置中存在但原始内容中不存在的键
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
        // 没有原始内容，生成新的配置文件
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
}

// 获取系统主题模式
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 设置主题
function setTheme(theme) {
    try {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.updateColors(prefersDark ? 'dark' : 'light');
        } else {
            this.updateColors(theme);
        }
        return true;
    } catch (error) {
        console.error('设置主题时出错:', error);
        return false;
    }
}

function updateColors(theme) {
    this.applyColors(this.colors[theme] || this.colors['light']);
}

// Material You 颜色系统
const materialYou = {
    colors: {
        light: {
            primary: '#006874',
            onPrimary: '#ffffff',
            primaryContainer: '#a2eeff',
            onPrimaryContainer: '#001f24',
            secondary: '#4a6267',
            onSecondary: '#ffffff',
            secondaryContainer: '#cde7ec',
            onSecondaryContainer: '#051f23',
            tertiary: '#525e7d',
            onTertiary: '#ffffff',
            tertiaryContainer: '#dae2ff',
            onTertiaryContainer: '#0e1b37',
            error: '#ba1a1a',
            onError: '#ffffff',
            errorContainer: '#ffdad6',
            onErrorContainer: '#410002',
            background: '#fafdfd',
            onBackground: '#191c1d',
            surface: '#fafdfd',
            onSurface: '#191c1d',
            surfaceVariant: '#dbe4e6',
            onSurfaceVariant: '#3f484a',
            outline: '#6f797a'
        },
        dark: {
            primary: '#4fd8eb',
            onPrimary: '#00363d',
            primaryContainer: '#004f58',
            onPrimaryContainer: '#a2eeff',
            secondary: '#b1cbd0',
            onSecondary: '#1c3438',
            secondaryContainer: '#334b4f',
            onSecondaryContainer: '#cde7ec',
            tertiary: '#bbc6ea',
            onTertiary: '#24304d',
            tertiaryContainer: '#3b4664',
            onTertiaryContainer: '#dae2ff',
            error: '#ffb4ab',
            onError: '#690005',
            errorContainer: '#93000a',
            onErrorContainer: '#ffdad6',
            background: '#191c1d',
            onBackground: '#e1e3e3',
            surface: '#191c1d',
            onSurface: '#e1e3e3',
            surfaceVariant: '#3f484a',
            onSurfaceVariant: '#bfc8ca',
            outline: '#899294'
        }
    },
    
    // 应用颜色到CSS变量
    applyColors(colors) {
        for (const [key, value] of Object.entries(colors)) {
            document.documentElement.style.setProperty(`--md-${key}`, value);
        }
    },
    
    // 更新颜色
    updateColors(theme) {
        this.applyColors(this.colors[theme]);
    },
    
    // 初始化
    init() {
        // 监听系统主题变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (document.documentElement.getAttribute('data-theme') === 'auto') {
                    setTheme('auto');
                }
            });
        }
        
        // 初始应用主题
        setTheme('auto');
    }
};

// 添加一个函数来获取配置，如果无法从文件读取则使用默认值
// 获取配置
async function getConfig() {
    try {
        const configPath = `${MODULE_PATH}module_settings/config.sh`;
        
        // 检查文件是否存在
        const exists = await fileExists(configPath);
        if (!exists) {
            console.error(`配置文件不存在: ${configPath}`);
            return getDefaultConfig();
        }
        
        // 尝试读取配置文件
        const configContent = await readFile(configPath);
        if (!configContent) {
            console.error(`无法读取配置文件: ${configPath}`);
            return getDefaultConfig();
        }
        
        // 解析配置文件
        const config = parseConfigFile(configContent);
        console.log('成功读取配置:', config);
        return config;
    } catch (error) {
        console.error('获取配置出错:', error);
        return getDefaultConfig();
    }
}

// 默认配置
function getDefaultConfig() {
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
}

// 导出函数
window.utils = {
    MODULE_PATH,
    execCommand,
    readFile,
    writeFile,
    parseConfigFile,
    generateConfigContent,
    getSystemTheme,
    setTheme,
    getModuleStatus,
    fileExists,
    getConfig,
    getDefaultConfig
};

window.materialYou = materialYou;

// 初始化Material You
document.addEventListener('DOMContentLoaded', () => {
    materialYou.init();
});

// 检查目录是否存在
async function directoryExists(path) {
    try {
        const result = await execCommand(`[ -d "${path}" ] && echo "true" || echo "false"`);
        return result.trim() === "true";
    } catch (error) {
        console.error(`检查目录存在性出错 ${path}:`, error);
        return false;
    }
}

// 创建目录
async function createDirectory(path) {
    try {
        await execCommand(`mkdir -p "${path}"`);
        return true;
    } catch (error) {
        console.error(`创建目录出错 ${path}:`, error);
        return false;
    }
}

// 比较配置文件内容，检查是否有变化
function configHasChanged(newConfig, originalConfig) {
    if (!originalConfig || !newConfig) return true;
    
    // 比较两个配置对象的键值对
    for (const key in newConfig) {
        if (!originalConfig.hasOwnProperty(key) || originalConfig[key] !== newConfig[key]) {
            return true;
        }
    }
    
    // 检查是否有键被删除
    for (const key in originalConfig) {
        if (!newConfig.hasOwnProperty(key)) {
            return true;
        }
    }
    
    return false;
}

// 扩展导出函数，添加新增的工具函数
window.utils = {
    MODULE_PATH,
    execCommand,
    readFile,
    writeFile,
    parseConfigFile,
    generateConfigContent,
    getSystemTheme,
    setTheme,
    getModuleStatus,
    fileExists,
    getConfig,
    getDefaultConfig,
    directoryExists,
    createDirectory,
    configHasChanged,
    updateColors
};
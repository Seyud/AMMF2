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

// 写入文件内容 - 删除重复的函数定义
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

// 解析配置文件
function parseConfigFile(content) {
    const config = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
        // 跳过注释和空行
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        // 查找变量赋值
        const match = line.match(/^([A-Za-z0-9_]+)=["']?([^"']*)["']?$/);
        if (match) {
            const [, key, value] = match;
            config[key] = value;
        }
    }
    
    return config;
}

// 生成配置文件内容
function generateConfigContent(config, originalContent) {
    // 如果有原始内容，保留注释和格式
    if (originalContent) {
        const lines = originalContent.split('\n');
        let result = '';
        
        for (const line of lines) {
            // 保留注释和空行
            if (line.trim().startsWith('#') || line.trim() === '') {
                result += line + '\n';
                continue;
            }
            
            // 查找变量赋值
            const match = line.match(/^([A-Za-z0-9_]+)=["']?([^"']*)["']?$/);
            if (match) {
                const [, key] = match;
                // 如果配置中有这个键，使用新值
                if (config.hasOwnProperty(key)) {
                    // 保持原有的引号风格
                    if (line.includes('"')) {
                        result += `${key}="${config[key]}"\n`;
                    } else if (line.includes("'")) {
                        result += `${key}='${config[key]}'\n`;
                    } else {
                        result += `${key}=${config[key]}\n`;
                    }
                } else {
                    // 否则保留原行
                    result += line + '\n';
                }
            } else {
                // 不是变量赋值，保留原行
                result += line + '\n';
            }
        }
        
        return result;
    } else {
        // 没有原始内容，生成新的配置文件
        let result = '#!/system/bin/sh\n\n';
        
        for (const [key, value] of Object.entries(config)) {
            result += `${key}="${value}"\n`;
        }
        
        return result;
    }
}

// 获取系统主题模式
function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 设置主题
function setTheme(theme = 'auto') {
    const actualTheme = theme === 'auto' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // 更新Material You颜色
    if (window.materialYou) {
        window.materialYou.updateColors(actualTheme);
    }
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

// 导出
window.utils = {
    execCommand,
    readFile,
    writeFile,
    getModuleStatus,
    parseConfigFile,
    generateConfigContent,
    setTheme,
    MODULE_PATH
};

window.materialYou = materialYou;

// 初始化Material You
document.addEventListener('DOMContentLoaded', () => {
    materialYou.init();
});

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

// 写入文件
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

// 添加一个函数来获取配置，如果无法从文件读取则使用默认值
async function getConfig() {
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

// 导出新增的函数
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
    getConfig
};
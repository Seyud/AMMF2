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

// 读取文件内容
async function readFile(path) {
    try {
        return await execCommand(`cat "${path}"`);
    } catch (error) {
        console.error(`Error reading file ${path}:`, error);
        return null;
    }
}

// 写入文件内容
async function writeFile(path, content) {
    try {
        // 使用echo和重定向写入文件
        return await execCommand(`echo '${content.replace(/'/g, "'\\''")}' > "${path}"`);
    } catch (error) {
        console.error(`Error writing to file ${path}:`, error);
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
    
    for (let line of lines) {
        // 跳过注释和空行
        if (line.trim().startsWith('#') || !line.trim()) continue;
        
        // 处理键值对
        const match = line.match(/^([a-zA-Z0-9_]+)=["']?(.*?)["']?$/);
        if (match) {
            const [, key, value] = match;
            config[key] = value;
        }
    }
    
    return config;
}

// 生成配置文件内容
function generateConfigContent(config, originalContent) {
    const lines = originalContent.split('\n');
    const result = [];
    
    for (let line of lines) {
        // 保留注释和空行
        if (line.trim().startsWith('#') || !line.trim()) {
            result.push(line);
            continue;
        }
        
        // 更新键值对
        const match = line.match(/^([a-zA-Z0-9_]+)=/);
        if (match) {
            const key = match[1];
            if (config.hasOwnProperty(key)) {
                // 检查原始行是否使用引号
                const useQuotes = line.includes('"') || line.includes("'");
                const quoteChar = line.includes('"') ? '"' : "'";
                
                if (useQuotes) {
                    result.push(`${key}=${quoteChar}${config[key]}${quoteChar}`);
                } else {
                    result.push(`${key}=${config[key]}`);
                }
            } else {
                result.push(line);
            }
        } else {
            result.push(line);
        }
    }
    
    return result.join('\n');
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
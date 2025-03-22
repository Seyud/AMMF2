// 主题管理模块
const themeManager = {
    // 主题颜色配置
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
            outline: '#6f797a',
            outlineVariant: '#bfc8ca',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#2e3132',
            inverseOnSurface: '#eff1f1',
            inversePrimary: '#4fd8eb'
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
            outline: '#899294',
            outlineVariant: '#3f484a',
            shadow: '#000000',
            scrim: '#000000',
            inverseSurface: '#e1e3e3',
            inverseOnSurface: '#2e3132',
            inversePrimary: '#006874'
        }
    },

    init() {
        // 获取主题切换按钮
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (!themeToggleBtn) return;
        
        const themeIcon = themeToggleBtn.querySelector('i');
        
        // 获取当前主题
        const getCurrentTheme = () => {
            return document.documentElement.getAttribute('data-theme') || 'auto';
        };
        
        // 更新主题图标
        const updateThemeIcon = (theme) => {
            if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                themeIcon.textContent = 'light_mode';
            } else {
                themeIcon.textContent = 'dark_mode';
            }
        };
        
        // 应用主题颜色
        const applyThemeColors = (theme) => {
            const colorSet = theme === 'dark' ? this.colors.dark : this.colors.light;
            const root = document.documentElement;
            
            // 设置CSS变量
            for (const [key, value] of Object.entries(colorSet)) {
                root.style.setProperty(`--md-${key}`, value);
                
                // 为需要RGB值的属性设置RGB变量
                if (['primary', 'onPrimary', 'secondary', 'onSecondary', 'tertiary', 
                     'onTertiary', 'error', 'onError', 'surfaceVariant', 'onSurfaceVariant'].includes(key)) {
                    const rgb = this.hexToRgb(value);
                    if (rgb) {
                        root.style.setProperty(`--md-${key}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                    }
                }
            }
            
            // 设置状态栏颜色（仅限移动设备）
            this.updateStatusBarColor(theme);
        };
        
        // 初始化图标
        updateThemeIcon(getCurrentTheme());
        
        // 应用保存的主题或系统主题
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            applyThemeColors(savedTheme);
        } else {
            // 应用系统主题
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyThemeColors(systemTheme);
        }
        
        // 切换主题
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = getCurrentTheme();
            let newTheme;
            
            if (currentTheme === 'auto') {
                newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
            } else if (currentTheme === 'dark') {
                newTheme = 'light';
            } else {
                newTheme = 'dark';
            }
            
            // 使用平滑过渡
            this.smoothThemeTransition(newTheme, updateThemeIcon);
            
            // 如果utils模块存在，也通知它
            if (window.utils && typeof window.utils.setTheme === 'function') {
                window.utils.setTheme(newTheme);
            }
        });
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (getCurrentTheme() === 'auto') {
                const systemTheme = e.matches ? 'dark' : 'light';
                applyThemeColors(systemTheme);
                updateThemeIcon('auto');
                
                if (window.utils && typeof window.utils.setTheme === 'function') {
                    window.utils.setTheme('auto');
                }
            }
        });
    },
    
    // 平滑主题切换
    smoothThemeTransition(newTheme, updateIconCallback) {
        // 添加过渡类
        document.body.classList.add('theme-transition');
        
        // 应用新主题
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // 获取当前颜色集
        const colorSet = newTheme === 'dark' ? this.colors.dark : this.colors.light;
        const root = document.documentElement;
        
        // 设置CSS变量
        for (const [key, value] of Object.entries(colorSet)) {
            root.style.setProperty(`--md-${key}`, value);
            
            // 为需要RGB值的属性设置RGB变量
            if (['primary', 'onPrimary', 'secondary', 'onSecondary', 'tertiary', 
                 'onTertiary', 'error', 'onError', 'surfaceVariant', 'onSurfaceVariant'].includes(key)) {
                const rgb = this.hexToRgb(value);
                if (rgb) {
                    root.style.setProperty(`--md-${key}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
                }
            }
        }
        
        // 更新状态栏颜色
        this.updateStatusBarColor(newTheme);
        
        // 更新图标
        if (typeof updateIconCallback === 'function') {
            updateIconCallback(newTheme);
        }
        
        // 保存主题设置到本地存储
        localStorage.setItem('theme', newTheme);
        
        // 移除过渡类
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 1000);
    },
    
    // 更新状态栏颜色（移动设备）
    updateStatusBarColor(theme) {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = theme === 'dark' ? this.colors.dark.surface : this.colors.light.surface;
            document.head.appendChild(meta);
        } else {
            metaThemeColor.content = theme === 'dark' ? this.colors.dark.surface : this.colors.light.surface;
        }
    },
    
    // 将十六进制颜色转换为RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    // 设置主题（供外部调用）
    setTheme(theme) {
        if (theme === 'auto') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            this.smoothThemeTransition(systemTheme);
        } else {
            this.smoothThemeTransition(theme);
        }
    }
};

// 导出主题管理器
window.themeManager = themeManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
});
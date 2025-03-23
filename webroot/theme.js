/**
 * AMMF WebUI 主题管理模块
 * 提供深色/浅色主题切换功能
 */

// 立即执行函数，在页面渲染前预先设置主题
(function() {
    // 从本地存储获取主题设置
    const savedTheme = localStorage.getItem('theme') || 'auto';
    
    // 预先应用主题类名到 HTML 元素
    if (savedTheme === 'auto') {
        // 检测系统主题
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.add('light-theme');
        }
    } else {
        document.documentElement.classList.add(savedTheme + '-theme');
    }
})();

const ThemeManager = {
    // 当前主题
    currentTheme: 'auto',
    
    // 初始化
    init() {
        // 从本地存储获取主题设置
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setTheme(savedTheme, false);
        
        // 监听系统主题变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
        
        // 绑定主题切换按钮
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // 更新按钮图标
            this.updateThemeToggleIcon();
        }
    },
    
    // 设置主题
    setTheme(theme, save = true) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.error(`不支持的主题: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        
        // 应用主题
        this.applyTheme(theme);
        
        // 保存到本地存储
        if (save) {
            localStorage.setItem('theme', theme);
        }
        
        // 更新主题切换按钮图标
        this.updateThemeToggleIcon();
    },
    
    // 应用主题
    applyTheme(theme) {
        // 移除所有主题类
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        
        if (theme === 'auto') {
            // 根据系统主题设置
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('dark-theme');
            } else {
                document.documentElement.classList.add('light-theme');
            }
        } else {
            // 直接设置指定主题
            document.documentElement.classList.add(`${theme}-theme`);
        }
    },
    
    // 更新主题切换按钮图标
    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const iconElement = themeToggle.querySelector('.material-symbols-rounded');
        if (!iconElement) return;
        
        // 根据当前主题设置图标
        switch (this.currentTheme) {
            case 'light':
                iconElement.textContent = 'light_mode';
                themeToggle.setAttribute('title', '浅色主题');
                break;
            case 'dark':
                iconElement.textContent = 'dark_mode';
                themeToggle.setAttribute('title', '深色主题');
                break;
            case 'auto':
                iconElement.textContent = 'brightness_auto';
                themeToggle.setAttribute('title', '自动主题');
                break;
        }
    },
    
    // 切换主题
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }
};

// 导出主题管理模块
window.ThemeManager = ThemeManager;
/**
 * AMMF WebUI 主题管理模块
 * 提供深色/浅色主题切换功能
 */

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
            
            // 更新图标
            this.updateThemeIcon();
        }
        
        console.log('主题管理模块初始化完成');
    },
    
    // 设置主题
    setTheme(theme, save = true) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            theme = 'auto';
        }
        
        this.currentTheme = theme;
        this.applyTheme(theme);
        
        if (save) {
            localStorage.setItem('theme', theme);
        }
        
        this.updateThemeIcon();
    },
    
    // 应用主题
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            // 自动跟随系统
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            // 手动设置
            root.setAttribute('data-theme', theme);
        }
    },
    
    // 切换主题
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    },
    
    // 更新主题图标
    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const iconSpan = themeToggle.querySelector('.material-symbols-rounded');
        if (!iconSpan) return;
        
        switch (this.currentTheme) {
            case 'light':
                iconSpan.textContent = 'light_mode';
                themeToggle.setAttribute('title', '浅色模式');
                break;
            case 'dark':
                iconSpan.textContent = 'dark_mode';
                themeToggle.setAttribute('title', '深色模式');
                break;
            case 'auto':
                iconSpan.textContent = 'brightness_auto';
                themeToggle.setAttribute('title', '自动模式');
                break;
        }
    }
};

// 导出主题管理模块
window.ThemeManager = ThemeManager;
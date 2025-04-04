/**
 * AMMF WebUI 主题管理模块
 * 提供深色/浅色主题切换功能
 */

// 立即执行函数，在页面渲染前预先设置主题
(function() {
    // 优先检测系统主题偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // 如果有本地存储的主题设置，则覆盖系统偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
})();

// 检查 ThemeManager 是否已存在，如果不存在则创建
window.ThemeManager = window.ThemeManager || {
    // 当前主题
    currentTheme: 'light',
    
    // 初始化
    init() {
        // 优先使用系统主题
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
        } else {
            this.currentTheme = 'light';
        }
        
        // 如果有本地存储的主题设置，则覆盖系统偏好
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        }
        
        // 应用当前主题
        this.applyTheme(this.currentTheme);
        
        // 监听系统主题变化，自动切换主题
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                // 只有在没有用户手动设置主题时才自动切换
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        }
        
        // 绑定主题切换按钮 - 确保在DOM加载完成后执行
        document.addEventListener('DOMContentLoaded', () => {
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
                
                // 更新按钮图标
                this.updateThemeToggleIcon();
            }
        });
    },
    
    // 应用主题
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // 更新主题颜色元标签
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
            metaThemeColor.setAttribute('content', primaryColor);
        }
        
        // 更新主题切换按钮图标
        this.updateThemeToggleIcon();
        
        // 触发主题变更事件
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme }
        }));
    },
    
    // 设置主题
    setTheme(theme, savePreference = true) {
        // 应用主题
        this.applyTheme(theme);
        
        // 保存用户偏好
        if (savePreference) {
            localStorage.setItem('theme', theme);
        } else if (localStorage.getItem('theme')) {
            // 如果不保存偏好但之前有保存过，则清除保存的偏好
            localStorage.removeItem('theme');
        }
    },
    
    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme, true);
    },
    
    // 更新主题切换按钮图标
    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const iconElement = themeToggle.querySelector('.material-symbols-rounded');
            if (iconElement) {
                iconElement.textContent = this.currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
            }
        }
    },
    
    // 获取当前主题
    getTheme() {
        return this.currentTheme;
    },
    
    // 检查是否为深色主题
    isDarkTheme() {
        return this.currentTheme === 'dark';
    },
    
    // 检查是否为浅色主题
    isLightTheme() {
        return this.currentTheme === 'light';
    }
};
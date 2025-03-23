/**
 * AMMF WebUI 主题管理模块
 * 提供深色/浅色主题切换功能
 */

// 立即执行函数，在页面渲染前预先设置主题
(function() {
    // 从本地存储获取主题设置，如果没有则根据系统主题自动设置
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // 如果有保存的主题设置，直接应用
        document.documentElement.classList.add(savedTheme + '-theme');
    } else {
        // 根据系统主题自动设置
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.add('light-theme');
        }
    }
})();

const ThemeManager = {
    // 当前主题
    currentTheme: 'light',
    
    // 初始化
    init() {
        // 从本地存储获取主题设置
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            // 如果有保存的主题设置，直接应用
            this.setTheme(savedTheme, false);
        } else {
            // 根据系统主题自动设置
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark', false);
            } else {
                this.setTheme('light', false);
            }
        }
        
        // 监听系统主题变化，自动切换主题
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                // 只有在没有用户手动设置主题时才自动切换
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light', false);
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
        if (!['light', 'dark'].includes(theme)) {
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
        
        // 触发主题变更事件
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },
    
    // 应用主题
    applyTheme(theme) {
        // 移除所有主题类
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        
        // 直接设置指定主题
        document.documentElement.classList.add(`${theme}-theme`);
        
        // 更新浏览器主题色
        if (theme === 'dark') {
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#191c1e');
        } else {
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0288d1');
        }
    },
    
    // 更新主题切换按钮图标
    updateThemeToggleIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const iconElement = themeToggle.querySelector('.material-symbols-rounded');
        if (!iconElement) return;
        
        // 根据当前主题设置图标
        if (this.currentTheme === 'light') {
            iconElement.textContent = 'light_mode';
            themeToggle.setAttribute('title', '浅色主题 (点击切换)');
        } else {
            iconElement.textContent = 'dark_mode';
            themeToggle.setAttribute('title', '深色主题 (点击切换)');
        }
    },
    
    // 切换主题
    toggleTheme() {
        // 创建涟漪元素
        const ripple = document.createElement('div');
        ripple.className = 'theme-ripple';
        document.body.appendChild(ripple);
        
        // 获取主题切换按钮位置
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const rect = themeToggle.getBoundingClientRect();
            ripple.style.top = `${rect.top + rect.height/2 - 50}px`;
            ripple.style.right = `${document.documentElement.clientWidth - rect.right + rect.width/2 - 50}px`;
        }
        
        // 触发涟漪动画
        setTimeout(() => {
            ripple.classList.add('active');
        }, 10);
        
        // 只在 light 和 dark 之间切换
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // 添加切换动画效果
        document.body.classList.add('theme-transition');
        
        // 延迟应用主题，等待涟漪动画开始
        setTimeout(() => {
            this.setTheme(newTheme);
            
            // 移除涟漪元素
            setTimeout(() => {
                ripple.remove();
                document.body.classList.remove('theme-transition');
            }, 800);
        }, 300);
    },
    
    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme;
    },
    
    // 获取实际应用的主题
    getAppliedTheme() {
        return this.currentTheme;
    }
};

// 导出主题管理模块
window.ThemeManager = ThemeManager;
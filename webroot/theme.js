// 主题管理模块
const themeManager = {
    // 初始化主题
    init() {
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
        
        // 初始化图标
        updateThemeIcon(getCurrentTheme());
        
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
            
            document.documentElement.setAttribute('data-theme', newTheme);
            utils.setTheme(newTheme);
            updateThemeIcon(newTheme);
            
            // 保存主题设置到本地存储
            localStorage.setItem('theme', newTheme);
        });
        
        // 从本地存储加载主题设置
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            utils.setTheme(savedTheme);
            updateThemeIcon(savedTheme);
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (getCurrentTheme() === 'auto') {
                updateThemeIcon('auto');
            }
        });
    }
};

// 在DOM加载完成后初始化主题
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
});
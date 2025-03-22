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
    },
    
    // 应用主题颜色到CSS变量
    applyThemeColors(isDark) {
        const root = document.documentElement;
        
        if (isDark) {
            // 深色主题颜色
            root.style.setProperty('--md-primary', '#4fd8eb');
            root.style.setProperty('--md-onPrimary', '#00363d');
            root.style.setProperty('--md-primaryContainer', '#004f58');
            root.style.setProperty('--md-onPrimaryContainer', '#a2eeff');
            root.style.setProperty('--md-secondary', '#b1cbd0');
            root.style.setProperty('--md-onSecondary', '#1c3438');
            root.style.setProperty('--md-secondaryContainer', '#334b4f');
            root.style.setProperty('--md-onSecondaryContainer', '#cde7ec');
            root.style.setProperty('--md-tertiary', '#bbc6ea');
            root.style.setProperty('--md-onTertiary', '#24304d');
            root.style.setProperty('--md-tertiaryContainer', '#3b4664');
            root.style.setProperty('--md-onTertiaryContainer', '#dae2ff');
            root.style.setProperty('--md-error', '#ffb4ab');
            root.style.setProperty('--md-onError', '#690005');
            root.style.setProperty('--md-errorContainer', '#93000a');
            root.style.setProperty('--md-onErrorContainer', '#ffdad6');
            root.style.setProperty('--md-background', '#191c1d');
            root.style.setProperty('--md-onBackground', '#e1e3e3');
            root.style.setProperty('--md-surface', '#191c1d');
            root.style.setProperty('--md-onSurface', '#e1e3e3');
            root.style.setProperty('--md-surfaceVariant', '#3f484a');
            root.style.setProperty('--md-onSurfaceVariant', '#bfc8ca');
            root.style.setProperty('--md-outline', '#899294');
            root.style.setProperty('--md-outlineVariant', '#3f484a');
            
            // RGB变量 - 用于透明度计算
            root.style.setProperty('--md-primary-rgb', '79, 216, 235');
            root.style.setProperty('--md-secondary-rgb', '177, 203, 208');
            root.style.setProperty('--md-tertiary-rgb', '187, 198, 234');
            root.style.setProperty('--md-error-rgb', '255, 180, 171');
            root.style.setProperty('--md-surfaceVariant-rgb', '63, 72, 74');
        } else {
            // 浅色主题颜色
            root.style.setProperty('--md-primary', '#006874');
            root.style.setProperty('--md-onPrimary', '#ffffff');
            root.style.setProperty('--md-primaryContainer', '#a2eeff');
            root.style.setProperty('--md-onPrimaryContainer', '#001f24');
            root.style.setProperty('--md-secondary', '#4a6267');
            root.style.setProperty('--md-onSecondary', '#ffffff');
            root.style.setProperty('--md-secondaryContainer', '#cde7ec');
            root.style.setProperty('--md-onSecondaryContainer', '#051f23');
            root.style.setProperty('--md-tertiary', '#525e7d');
            root.style.setProperty('--md-onTertiary', '#ffffff');
            root.style.setProperty('--md-tertiaryContainer', '#dae2ff');
            root.style.setProperty('--md-onTertiaryContainer', '#0e1b37');
            root.style.setProperty('--md-error', '#ba1a1a');
            root.style.setProperty('--md-onError', '#ffffff');
            root.style.setProperty('--md-errorContainer', '#ffdad6');
            root.style.setProperty('--md-onErrorContainer', '#410002');
            root.style.setProperty('--md-background', '#fafdfd');
            root.style.setProperty('--md-onBackground', '#191c1d');
            root.style.setProperty('--md-surface', '#fafdfd');
            root.style.setProperty('--md-onSurface', '#191c1d');
            root.style.setProperty('--md-surfaceVariant', '#dbe4e6');
            root.style.setProperty('--md-onSurfaceVariant', '#3f484a');
            root.style.setProperty('--md-outline', '#6f797a');
            root.style.setProperty('--md-outlineVariant', '#bfc8ca');
            
            // RGB变量 - 用于透明度计算
            root.style.setProperty('--md-primary-rgb', '0, 104, 116');
            root.style.setProperty('--md-secondary-rgb', '74, 98, 103');
            root.style.setProperty('--md-tertiary-rgb', '82, 94, 125');
            root.style.setProperty('--md-error-rgb', '186, 26, 26');
            root.style.setProperty('--md-surfaceVariant-rgb', '219, 228, 230');
        }
    }
};

// 在DOM加载完成后初始化主题
document.addEventListener('DOMContentLoaded', () => {
    themeManager.init();
    
    // 应用当前主题颜色
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                  (document.documentElement.getAttribute('data-theme') === 'auto' && 
                   window.matchMedia('(prefers-color-scheme: dark)').matches);
    themeManager.applyThemeColors(isDark);
});
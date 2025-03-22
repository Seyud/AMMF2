// 主题管理和莫奈取色系统
class ThemeManager {
    constructor() {
        this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.themeButton = document.getElementById('theme-button');
        this.themeIcon = this.themeButton.querySelector('.material-symbols-outlined');
        this.monetColors = null;
        
        this.init();
    }
    
    async init() {
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            this.isDarkMode = e.matches;
            this.updateThemeIcon();
            this.applyMonetColors();
        });
        
        // 主题切换按钮点击事件
        this.themeButton.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 初始化主题图标
        this.updateThemeIcon();
        
        // 获取莫奈取色
        await this.fetchMonetColors();
    }
    
    updateThemeIcon() {
        this.themeIcon.textContent = this.isDarkMode ? 'light_mode' : 'dark_mode';
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.classList.toggle('force-dark', this.isDarkMode);
        document.documentElement.classList.toggle('force-light', !this.isDarkMode);
        this.updateThemeIcon();
        this.applyMonetColors();
    }
    
    async fetchMonetColors() {
        try {
            // 从Android系统获取莫奈取色
            const command = 'cat /data/system/theme/monet_colors.json 2>/dev/null || echo "{}"';
            const result = await execCommand(command);
            
            if (result && result !== '{}') {
                this.monetColors = JSON.parse(result);
                this.applyMonetColors();
            } else {
                console.log('莫奈取色数据不可用，使用默认颜色');
            }
        } catch (error) {
            console.error('获取莫奈取色失败:', error);
        }
    }
    
    applyMonetColors() {
        if (!this.monetColors) return;
        
        const colors = this.isDarkMode ? this.monetColors.dark : this.monetColors.light;
        
        if (!colors) return;
        
        const root = document.documentElement;
        
        // 应用主色调
        if (colors.accent1) {
            root.style.setProperty('--md-sys-color-primary', colors.accent1[500]);
            root.style.setProperty('--md-sys-color-on-primary', colors.accent1[0]);
            root.style.setProperty('--md-sys-color-primary-container', colors.accent1[100]);
            root.style.setProperty('--md-sys-color-on-primary-container', colors.accent1[900]);
        }
        
        // 应用次要色调
        if (colors.accent2) {
            root.style.setProperty('--md-sys-color-secondary', colors.accent2[500]);
            root.style.setProperty('--md-sys-color-on-secondary', colors.accent2[0]);
            root.style.setProperty('--md-sys-color-secondary-container', colors.accent2[100]);
            root.style.setProperty('--md-sys-color-on-secondary-container', colors.accent2[900]);
        }
        
        // 应用第三色调
        if (colors.accent3) {
            root.style.setProperty('--md-sys-color-tertiary', colors.accent3[500]);
            root.style.setProperty('--md-sys-color-on-tertiary', colors.accent3[0]);
            root.style.setProperty('--md-sys-color-tertiary-container', colors.accent3[100]);
            root.style.setProperty('--md-sys-color-on-tertiary-container', colors.accent3[900]);
        }
        
        // 应用背景色
        if (colors.neutral1) {
            root.style.setProperty('--md-sys-color-background', colors.neutral1[10]);
            root.style.setProperty('--md-sys-color-on-background', colors.neutral1[900]);
            root.style.setProperty('--md-sys-color-surface', colors.neutral1[10]);
            root.style.setProperty('--md-sys-color-on-surface', colors.neutral1[900]);
        }
        
        // 应用表面变体色
        if (colors.neutral2) {
            root.style.setProperty('--md-sys-color-surface-variant', colors.neutral2[100]);
            root.style.setProperty('--md-sys-color-on-surface-variant', colors.neutral2[700]);
            root.style.setProperty('--md-sys-color-outline', colors.neutral2[500]);
            root.style.setProperty('--md-sys-color-outline-variant', colors.neutral2[200]);
        }
    }
}

// 当DOM加载完成后初始化主题管理器
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
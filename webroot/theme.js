// 主题控制 - 立即执行以防止闪烁
(function() {
    // 立即检测系统暗色模式并应用
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.style.backgroundColor = '#1c1b1f'; // 深色背景色
        document.documentElement.style.color = '#e6e1e5'; // 深色文本色
        document.body.setAttribute('data-theme', 'dark');
    }
    
    // 存储主题状态供后续脚本使用
    window.initialThemeIsDark = window.matchMedia && 
                               window.matchMedia('(prefers-color-scheme: dark)').matches;
})();

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
});

// 确保DOM加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    // 获取主题切换按钮
    const themeToggle = document.getElementById('theme-toggle');
    
    // 检查按钮是否存在
    if (themeToggle) {
        // 绑定点击事件
        themeToggle.addEventListener('click', function() {
            // 获取当前主题
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            
            // 切换主题
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 应用新主题
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // 更新状态
            state.isDarkMode = newTheme === 'dark';
            
            // 更新图标
            const themeIcon = this.querySelector('.material-symbols-outlined');
            if (themeIcon) {
                themeIcon.textContent = state.isDarkMode ? 'light_mode' : 'dark_mode';
            }
            
            // 保存主题设置到本地存储
            localStorage.setItem('theme', newTheme);
            
            console.log('主题已切换为:', newTheme);
        });
        
        console.log('主题切换按钮事件已绑定');
    } else {
        console.error('未找到主题切换按钮元素');
    }
});

// 初始化主题
function initTheme() {
    // 从本地存储获取主题设置
    const savedTheme = localStorage.getItem('theme');
    
    // 如果有保存的主题设置，应用它
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        state.isDarkMode = savedTheme === 'dark';
    } else {
        // 否则检查系统偏好
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            state.isDarkMode = true;
        }
    }
    
    // 更新主题图标
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('.material-symbols-outlined');
        if (themeIcon) {
            themeIcon.textContent = state.isDarkMode ? 'light_mode' : 'dark_mode';
        }
    }
}

// 页面加载时初始化主题
document.addEventListener('DOMContentLoaded', initTheme);
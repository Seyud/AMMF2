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
    // 绑定主题切换按钮事件
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// 主题切换函数
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // 更新图标
    const themeIcon = document.querySelector('#theme-toggle .material-symbols-outlined');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'light' ? 'dark_mode' : 'light_mode';
    }
    
    // 保存主题设置到本地存储
    localStorage.setItem('theme', newTheme);
    
    // 更新状态
    if (typeof state !== 'undefined') {
        state.isDarkMode = newTheme === 'dark';
    }
}
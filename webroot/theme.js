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
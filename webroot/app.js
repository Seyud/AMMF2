// 应用程序入口点
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 初始化状态
        window.state = {
            settings: {},
            excludedSettings: [],
            settingsDescriptions: {},
            settingsOptions: {},
            language: 'zh', // 默认语言
            isDarkMode: window.initialThemeIsDark || false,
            availableLanguages: ['en', 'zh'] // 默认可用语言
        };
        
        // 添加页面加载动画
        document.body.classList.add('fade-in');
        
        // 初始化各个模块
        await Promise.all([
            // 加载设置配置（整合了排除设置、设置描述和设置选项）
            loadSettingsConfig(),
            // 检测系统暗色模式
            checkDarkMode()
        ]);
        
        // 初始化UI组件
        navigation.init();
        moduleStatus.init();
        
        // 确保 logsManager 已定义再初始化
        if (typeof logsManager !== 'undefined') {
            logsManager.init();
        } else {
            console.error('logsManager 未定义，无法初始化日志管理器');
        }
        
        // 添加事件监听器 - 避免重复添加
        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        
        // 优化输入框焦点事件，使用事件委托
        document.addEventListener('focus', function(e) {
            const target = e.target;
            if (target.classList.contains('text-input') || 
                target.classList.contains('number-input') || 
                target.classList.contains('select-input')) {
                // 移除之前可能存在的类，避免动画冲突
                target.classList.remove('input-focus');
                // 使用 requestAnimationFrame 确保平滑过渡
                requestAnimationFrame(() => {
                    target.classList.add('input-focus');
                });
            }
        }, true);
        
        document.addEventListener('blur', function(e) {
            const target = e.target;
            if (target.classList.contains('text-input') || 
                target.classList.contains('number-input') || 
                target.classList.contains('select-input')) {
                target.classList.remove('input-focus');
            }
        }, true);
        
        // 添加设置项变更监听
        document.addEventListener('change', function(e) {
            if (e.target.id && e.target.id.startsWith('setting-')) {
                const settingItem = e.target.closest('.setting-item');
                if (settingItem) {
                    addSettingChangeAnimation(settingItem);
                }
            }
        });
        
    } catch (error) {
        console.error('初始化应用程序时出错:', error);
        showSnackbar('初始化应用程序时出错，请刷新页面重试');
    }
});
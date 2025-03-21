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
            availableLanguages: ['en', 'zh'], // 默认可用语言
            initRetryCount: 0 // 添加初始化重试计数
        };
        
        // 添加页面加载动画
        document.body.classList.add('fade-in');
        
        // 初始化各个模块
        await initializeApp();
        
    } catch (error) {
        console.error('Application initialization error:', error);
        // 显示全局错误
        if (typeof showLoadingError === 'function') {
            showLoadingError('初始化应用程序出错，请刷新界面后重试', () => {
                // 重试初始化
                window.location.reload();
            });
        } else {
            alert('初始化应用程序出错，请刷新界面后重试');
        }
    }
});

// 将初始化逻辑提取到单独的函数中，便于重试
async function initializeApp() {
    try {
        // 初始化各个模块
        await Promise.all([
            // 加载设置配置（整合了排除设置、设置描述和设置选项）
            loadSettingsConfig(),
            // 检测系统暗色模式
            checkDarkMode()
        ]);
        
        // 加载可用语言
        await loadLanguages();
        
        // 初始化UI组件
        initUI();
        
        // 初始化导航
        navigation.init();
        
        // 初始化状态监控
        moduleStatus.init();
        
        // 初始化日志管理
        logsManager.init();
        
        // 修复返回按钮事件绑定
        initBackButtons();
        
        // 移除页面加载动画
        setTimeout(() => {
            document.body.classList.remove('fade-in');
        }, 500);
        
        // 显示主页
        navigation.navigateTo('home');
        
        // 添加主页卡片动画
        navigation.animateHomeCards();
        
    } catch (error) {
        console.error('Module initialization error:', error);
        
        // 增加重试计数
        state.initRetryCount++;
        
        // 如果重试次数小于3次，自动重试
        if (state.initRetryCount < 3) {
            console.log(`Auto retrying initialization (${state.initRetryCount}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initializeApp();
        }
        
        // 超过重试次数，显示错误
        throw new Error('初始化失败，已重试' + state.initRetryCount + '次');
    }
}

// 初始化返回按钮
function initBackButtons() {
    // 设置页面返回按钮
    const backToHomeSettings = document.getElementById('back-to-home-settings');
    if (backToHomeSettings) {
        backToHomeSettings.addEventListener('click', () => {
            navigation.navigateTo('home');
            navigation.addButtonClickAnimation('back-to-home-settings');
        });
    }
    
    // 日志页面返回按钮
    const backToHomeLogs = document.getElementById('back-to-home-logs');
    if (backToHomeLogs) {
        backToHomeLogs.addEventListener('click', () => {
            navigation.navigateTo('home');
            navigation.addButtonClickAnimation('back-to-home-logs');
        });
    }
    
    // 兼容旧版返回按钮
    const backToHome = document.getElementById('back-to-home');
    if (backToHome) {
        backToHome.addEventListener('click', () => {
            navigation.navigateTo('home');
            navigation.addButtonClickAnimation('back-to-home');
        });
    }
    
    console.log('返回按钮初始化完成');
}

// 移除重复的初始化代码
// 以下代码已被上面的初始化逻辑替代，删除以避免冲突
// document.addEventListener('DOMContentLoaded', function() {
//     // 初始化页面导航
//     initNavigation();
//     
//     // 默认显示首页
//     if (window.navigation && typeof window.navigation.showPage === 'function') {
//         window.navigation.showPage('home-page');
//     }
// });

// 移除旧的导航初始化函数，使用navigation.js中的方法
// function initNavigation() {
//     // 设置卡片点击事件
//     const settingsCard = document.getElementById('settings-card');
//     if (settingsCard) {
//         settingsCard.addEventListener('click', function() {
//             if (window.navigation && typeof window.navigation.showPage === 'function') {
//                 window.navigation.showPage('settings-page');
//             }
//         });
//     }
//     
//     // 日志卡片点击事件
//     const logsCard = document.getElementById('logs-card');
//     if (logsCard) {
//         logsCard.addEventListener('click', function() {
//             if (window.navigation && typeof window.navigation.showPage === 'function') {
//                 window.navigation.showPage('logs-page');
//             }
//         });
//     }
// }
// 调试辅助函数
const debug = {
    init: function() {
        console.log('调试模式已初始化');
        this.checkElements();
        this.monitorEvents();
    },
    
    checkElements: function() {
        // 检查关键元素是否存在
        const elements = [
            'language-toggle',
            'theme-toggle',
            'save-button',
            'refresh-status',
            'restart-module'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`元素 #${id} ${element ? '存在' : '不存在'}`);
        });
    },
    
    monitorEvents: function() {
        // 监听所有点击事件
        document.addEventListener('click', function(e) {
            console.log('点击事件:', e.target);
        }, true);
        
        // 监听DOM变化
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    console.log('DOM变化:', mutation);
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    testLanguageMenu: function() {
        console.log('测试语言菜单');
        console.log('可用语言:', state.availableLanguages);
        console.log('当前语言:', state.language);
        showLanguageMenu();
    }
};

// 页面加载完成后初始化调试
document.addEventListener('DOMContentLoaded', function() {
    // 添加一个调试按钮
    const debugButton = document.createElement('button');
    debugButton.id = 'debug-button';
    debugButton.className = 'icon-button';
    debugButton.innerHTML = '<span class="material-symbols-outlined">bug_report</span>';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '20px';
    debugButton.style.right = '20px';
    debugButton.style.zIndex = '9999';
    
    debugButton.addEventListener('click', function() {
        debug.testLanguageMenu();
    });
    
    document.body.appendChild(debugButton);
    
    // 初始化调试
    debug.init();
});
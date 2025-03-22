// 应用主类
class App {
    constructor() {
        // 初始化状态
        this.initialized = false;
        
        // 初始化应用
        this.init();
    }
    
    // 初始化应用
    async init() {
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initApp());
            } else {
                this.initApp();
            }
        } catch (error) {
            console.error('初始化应用失败:', error);
        }
    }
    
    // 初始化应用
    async initApp() {
        try {
            // 显示加载指示器
            this.showLoading();
            
            // 初始化工具模块
            if (!window.utils) {
                this.showError(languageManager.translate('UTILS_INIT_ERROR', 'Failed to initialize utils module'));
                return;
            }
            
            // 初始化语言模块
            if (window.languageManager) {
                await window.languageManager.init();
            } else {
                this.showError(languageManager.translate('LANGUAGE_INIT_ERROR', 'Failed to initialize language module'));
                return;
            }
            
            // 初始化状态管理模块
            if (window.statusManager) {
                await window.statusManager.init();
            } else {
                this.showError(languageManager.translate('STATUS_INIT_ERROR', 'Failed to initialize status module'));
                return;
            }
            
            // 初始化导航模块
            if (window.navigationManager) {
                await window.navigationManager.init();
            } else {
                this.showError(languageManager.translate('NAVIGATION_INIT_ERROR', 'Failed to initialize navigation module'));
                return;
            }
            
            // 隐藏加载指示器
            this.hideLoading();
            
            // 标记初始化完成
            this.initialized = true;
            console.log('应用初始化完成');
            
            // 触发应用初始化完成事件
            document.dispatchEvent(new CustomEvent('appInitialized'));
        } catch (error) {
            console.error('初始化应用失败:', error);
            this.showError(languageManager.translate('APP_INIT_ERROR', 'Failed to initialize application'));
        }
    }
    
    // 显示加载指示器
    showLoading() {
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>${languageManager.translate('LOADING', 'Loading...')}</p>
                </div>
            `;
        }
    }
    
    // 隐藏加载指示器
    hideLoading() {
        // 加载指示器会被页面内容替换，不需要特别处理
    }
    
    // 显示错误信息
    showError(message) {
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="material-icons">error</i>
                    </div>
                    <h2>${message}</h2>
                    <button class="md-button primary" onclick="location.reload()">
                        <i class="material-icons">refresh</i>
                        <span>${languageManager.translate('REFRESH_PAGE', 'Refresh Page')}</span>
                    </button>
                </div>
            `;
        }
    }
}

// 创建应用实例
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
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
    
    // 确保配置文件可访问
    async ensureConfigAccess() {
        const sourceConfigPath = `${utils.MODULE_PATH}module_settings/config.sh`;
        const webConfigPath = 'config.sh';  // 相对于webroot的路径
        
        try {
            // 检查源配置文件是否存在
            const sourceExists = await utils.fileExists(sourceConfigPath);
            if (!sourceExists) {
                console.error(`源配置文件不存在: ${sourceConfigPath}`);
                return false;
            }
            
            // 复制配置文件到webroot
            await utils.execCommand(`cp "${sourceConfigPath}" "${webConfigPath}"`);
            console.log(`配置文件已复制到: ${webConfigPath}`);
            
            // 设置权限
            await utils.execCommand(`chmod 644 "${webConfigPath}"`);
            console.log('已设置配置文件权限');
            
            return true;
        } catch (error) {
            console.error('确保配置文件访问时出错:', error);
            return false;
        }
    }
    
    // 初始化应用
    async initApp() {
        try {
            // 显示加载指示器
            this.showLoading();
            
            // 确保配置文件可访问
            const configAccessible = await this.ensureConfigAccess();
            if (configAccessible) {
                console.log('配置文件现在可以访问');
            } else {
                console.warn('无法确保配置文件可访问，将使用默认配置');
            }
            
            // 初始化工具模块
            if (!window.utils) {
                console.error('工具模块未加载');
                this.showError('工具模块初始化失败');
                return;
            }
            
            // 确保utils模块初始化
            if (typeof window.utils.init === 'function') {
                await window.utils.init();
            }
            
            // 初始化主题模块
            if (window.themeManager && typeof window.themeManager.init === 'function') {
                window.themeManager.init();
            }
            
            // 初始化语言模块
            if (window.languageManager) {
                await window.languageManager.init();
            } else {
                console.error('语言模块未加载');
                this.showError('语言模块初始化失败');
                return;
            }
            
            // 初始化状态管理模块
            if (window.statusManager) {
                await window.statusManager.init();
            } else {
                console.error('状态模块未加载');
                this.showError(languageManager.translate('STATUS_INIT_ERROR', '状态模块初始化失败'));
                return;
            }
            
            // 初始化导航模块
            if (window.navigationManager) {
                await window.navigationManager.init();
            } else {
                console.error('导航模块未加载');
                this.showError(languageManager.translate('NAVIGATION_INIT_ERROR', '导航模块初始化失败'));
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
            console.error('应用初始化出错:', error);
            this.showError('初始化应用时出错: ' + error.message);
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
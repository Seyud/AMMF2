/**
 * AMMF WebUI 主应用模块
 * 负责初始化和协调各个模块
 */

class App {
    constructor() {
        // 初始化状态
        this.initialized = false;
        this.currentPage = 'status';

        // 页面模块
        this.pageModules = {
            status: window.StatusPage,
            logs: window.LogsPage,
            settings: window.SettingsPage,
            about: window.AboutPage
        };

        // 页面缓存
        this.pageCache = {};
        
        // 页面加载状态
        this.pageLoading = false;

        // 初始化应用
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 等待DOM加载完成
            Core.onDOMReady(() => this.initApp());
        } catch (error) {
            console.error('初始化应用失败:', error);
        }
    }

    // 初始化应用
    async initApp() {
        try {
            // 显示加载指示器
            this.showLoading();

            // 初始化语言模块
            await I18n.init();
            
            // 设置加载超时
            const loadingTimeout = setTimeout(() => {
                this.hideLoading();
                console.warn('加载超时，强制显示内容');
                Core.showToast(I18n.translate('LOADING_TIMEOUT', '加载时间过长，部分功能可能不可用'), 'warning');
                this.initialized = true;
                document.dispatchEvent(new CustomEvent('appInitialized'));
                this.bindEvents();
            }, 5000);

            // 确保配置文件可访问
            const configAccessible = await this.ensureConfigAccess();
            if (configAccessible) {
                console.log('配置文件现在可以访问');
            } else {
                console.warn('无法确保配置文件可访问，将使用默认配置');
            }

            // 初始化主题模块
            ThemeManager.init();

            // 初始化导航
            this.initNavigation();

            // 渲染初始页面
            await this.navigateTo(this.currentPage);

            // 隐藏加载指示器
            clearTimeout(loadingTimeout);
            this.hideLoading();

            // 标记初始化完成
            this.initialized = true;
            document.dispatchEvent(new CustomEvent('appInitialized'));

            document.body.classList.add('app-loaded');
            
            console.log('应用初始化完成');
            
            // 预加载其他页面
            this.preloadPages();
        } catch (error) {
            console.error('初始化应用出错:', error);
            this.hideLoading();
            this.showError('初始化应用失败');
        }
    }

    // 确保配置文件可访问
    async ensureConfigAccess() {
        try {
            const sourceConfigPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            const webConfigPath = 'config.sh';
            
            // 检查源配置文件是否存在
            const sourceExists = await Core.execCommand(`[ -f "${sourceConfigPath}" ] && echo "true" || echo "false"`);
            if (sourceExists.trim() !== "true") {
                console.warn('源配置文件不存在');
                return false;
            }
            
            // 复制配置文件到WebUI目录
            await Core.execCommand(`cp "${sourceConfigPath}" "${webConfigPath}"`);
            
            // 验证复制是否成功
            const webConfigExists = await Core.execCommand(`[ -f "${webConfigPath}" ] && echo "true" || echo "false"`);
            return webConfigExists.trim() === "true";
        } catch (error) {
            console.error('确保配置文件可访问失败:', error);
            return false;
        }
    }

    // 初始化导航
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const pageName = item.getAttribute('data-page');
            
            item.addEventListener('click', () => {
                if (this.currentPage === pageName) return;
                
                // 更新导航项的活动状态
                navItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
                
                // 导航到选定的页面
                this.navigateTo(pageName);
            });
        });
    }

    // 导航到指定页面
    async navigateTo(pageName) {
        if (!this.pageModules[pageName]) {
            console.error(`页面不存在: ${pageName}`);
            return;
        }
        
        // 如果当前有页面，调用其onDeactivate方法
        if (this.currentPage && this.pageModules[this.currentPage] && 
            typeof this.pageModules[this.currentPage].onDeactivate === 'function') {
            this.pageModules[this.currentPage].onDeactivate();
        }
        
        // 更新当前页面
        this.currentPage = pageName;
        
        // 加载页面内容
        await this.loadPage(pageName);
        
        // 调用新页面的onActivate方法
        if (this.pageModules[pageName] && typeof this.pageModules[pageName].onActivate === 'function') {
            this.pageModules[pageName].onActivate();
        }
    }

    // 加载页面
    async loadPage(pageName) {
        try {
            this.showPageLoading();
            
            // 检查页面模块是否存在
            if (!this.pageModules[pageName]) {
                throw new Error(`页面模块不存在: ${pageName}`);
            }
            
            // 检查页面是否已缓存
            if (this.pageCache[pageName]) {
                document.getElementById('main-content').innerHTML = this.pageCache[pageName];
                this.hidePageLoading();
                
                // 调用afterRender方法
                if (typeof this.pageModules[pageName].afterRender === 'function') {
                    this.pageModules[pageName].afterRender();
                }
                
                // 应用翻译
                I18n.applyTranslations();
                
                return;
            }
            
            // 初始化页面模块（如果尚未初始化）
            if (typeof this.pageModules[pageName].init === 'function' && !this.pageModules[pageName].initialized) {
                await this.pageModules[pageName].init();
                this.pageModules[pageName].initialized = true;
            }
            
            // 渲染页面
            if (typeof this.pageModules[pageName].render === 'function') {
                const pageContent = this.pageModules[pageName].render();
                document.getElementById('main-content').innerHTML = pageContent;
                
                // 缓存页面内容
                this.pageCache[pageName] = pageContent;
                
                // 调用afterRender方法
                if (typeof this.pageModules[pageName].afterRender === 'function') {
                    this.pageModules[pageName].afterRender();
                }
                
                // 应用翻译
                I18n.applyTranslations();
            } else {
                throw new Error(`页面模块没有render方法: ${pageName}`);
            }
            
            this.hidePageLoading();
        } catch (error) {
            console.error(`加载页面失败: ${pageName}`, error);
            document.getElementById('main-content').innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <span class="material-symbols-rounded">error</span>
                    </div>
                    <h2 data-i18n="PAGE_LOAD_ERROR">页面加载失败</h2>
                    <p>${error.message}</p>
                    <button id="retry-load" class="md-button primary">
                        <span class="material-symbols-rounded">refresh</span>
                        <span data-i18n="RETRY">重试</span>
                    </button>
                </div>
            `;
            
            // 添加重试按钮事件
            document.getElementById('retry-load').addEventListener('click', () => {
                this.loadPage(pageName);
            });
            
            this.hidePageLoading();
        }
    }

    // 预加载其他页面
    async preloadPages() {
        try {
            // 获取所有页面名称
            const pageNames = Object.keys(this.pageModules);
            
            // 过滤掉当前页面
            const pagesToPreload = pageNames.filter(page => page !== this.currentPage);
            
            // 预加载其他页面
            for (const pageName of pagesToPreload) {
                // 初始化页面模块（如果尚未初始化）
                if (typeof this.pageModules[pageName].init === 'function' && !this.pageModules[pageName].initialized) {
                    await this.pageModules[pageName].init();
                    this.pageModules[pageName].initialized = true;
                }
                
                // 预渲染页面并缓存
                if (typeof this.pageModules[pageName].render === 'function') {
                    this.pageCache[pageName] = this.pageModules[pageName].render();
                }
            }
            
            console.log('预加载页面完成');
        } catch (error) {
            console.error('预加载页面失败:', error);
        }
    }

    // 显示加载指示器
    showLoading() {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
    }

    // 隐藏加载指示器
    hideLoading() {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    // 显示页面加载指示器
    showPageLoading() {
        this.pageLoading = true;
        const mainContent = document.getElementById('main-content');
        
        // 添加加载类
        mainContent.classList.add('loading');
        
        // 如果没有加载指示器，添加一个
        if (!document.querySelector('.page-loading-indicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'page-loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div>';
            mainContent.appendChild(loadingIndicator);
        }
    }

    // 隐藏页面加载指示器
    hidePageLoading() {
        this.pageLoading = false;
        const mainContent = document.getElementById('main-content');
        
        // 移除加载类
        mainContent.classList.remove('loading');
        
        // 移除加载指示器
        const loadingIndicator = document.querySelector('.page-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // 显示错误信息
    showError(message) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="error-container">
                <div class="error-icon">
                    <span class="material-symbols-rounded">error</span>
                </div>
                <h2 data-i18n="ERROR_OCCURRED">发生错误</h2>
                <p>${message}</p>
                <button id="reload-app" class="md-button primary">
                    <span class="material-symbols-rounded">refresh</span>
                    <span data-i18n="RELOAD_APP">重新加载</span>
                </button>
            </div>
        `;
        
        // 添加重新加载按钮事件
        document.getElementById('reload-app').addEventListener('click', () => {
            window.location.reload();
        });
        
        // 应用翻译
        I18n.applyTranslations();
    }

    // 绑定全局事件
    bindEvents() {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            console.log('网络连接已恢复');
            Core.showToast(I18n.translate('NETWORK_RESTORED', '网络连接已恢复'), 'success');
        });
        
        window.addEventListener('offline', () => {
            console.warn('网络连接已断开');
            Core.showToast(I18n.translate('NETWORK_LOST', '网络连接已断开'), 'warning');
        });
        
        // 监听错误事件
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
        });
    }

    // 检测ROOT实现方式
    async detectRootImplementation() {
        try {
            // 检查 Magisk
            const magiskExists = await Core.execCommand(`[ -d "/data/adb/magisk" ] && echo "true" || echo "false"`);
            if (magiskExists.trim() === "true") {
                // 尝试获取 Magisk 版本
                try {
                    const magiskVersion = await Core.execCommand('magisk -v');
                    if (magiskVersion && !magiskVersion.includes('not found')) {
                        return `Magisk (${magiskVersion.trim().split(':')[0]})`;
                    }
                    return 'Magisk';
                } catch (e) {
                    return 'Magisk';
                }
            }
            
            // 检查 KernelSU
            const ksuExists = await Core.execCommand(`[ -d "/data/adb/ksu" ] && echo "true" || echo "false"`);
            if (ksuExists.trim() === "true") {
                // 尝试获取 KernelSU 版本
                try {
                    const ksuVersion = await Core.execCommand('ksud -V');
                    if (ksuVersion && !ksuVersion.includes('not found')) {
                        return `KernelSU (${ksuVersion.trim()})`;
                    }
                    return 'KernelSU';
                } catch (e) {
                    return 'KernelSU';
                }
            }
            
            // 检查 APatch
            const apatchExists = await Core.execCommand(`[ -d "/data/adb/apd" ] && echo "true" || echo "false"`);
            if (apatchExists.trim() === "true") {
                return 'APatch';
            }
            
            return 'Unknown';
        } catch (error) {
            console.error('检测 ROOT 实现方式失败:', error);
            return 'Unknown';
        }
    }
}

// 创建应用实例
window.app = new App();

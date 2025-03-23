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
                // 如果5秒后仍在加载，强制隐藏加载指示器并显示内容
                this.hideLoading();
                console.warn('加载超时，强制显示内容');

                // 显示可能的错误提示
                Core.showToast(I18n.translate('LOADING_TIMEOUT', '加载时间过长，部分功能可能不可用'), 'warning');

                // 标记初始化完成
                this.initialized = true;
                document.dispatchEvent(new CustomEvent('appInitialized'));

                // 确保事件绑定
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
        const sourceConfigPath = `${Core.MODULE_PATH}module_settings/config.sh`;
        const webConfigPath = 'config.sh';  // 相对于webroot的路径
    
        try {
            // 检查源配置文件是否存在
            const sourceExists = await Core.fileExists(sourceConfigPath);
            if (!sourceExists) {
                console.error(`源配置文件不存在: ${sourceConfigPath}`);
                return false;
            }
    
            // 检查目标文件是否存在及其修改时间
            const targetExists = await Core.fileExists(webConfigPath);
            let needsCopy = true;
            
            if (targetExists) {
                // 比较源文件和目标文件的修改时间
                try {
                    const sourceTime = await Core.execCommand(`stat -c %Y "${sourceConfigPath}"`);
                    const targetTime = await Core.execCommand(`stat -c %Y "${webConfigPath}"`);
                    
                    // 只有当源文件比目标文件新时才复制
                    needsCopy = parseInt(sourceTime.trim()) > parseInt(targetTime.trim());
                    
                    if (!needsCopy) {
                        console.log(`配置文件已是最新: ${webConfigPath}`);
                    }
                } catch (error) {
                    console.warn('比较文件时间失败，将强制复制:', error);
                    needsCopy = true;
                }
            }
    
            // 复制配置文件到webroot
            if (needsCopy) {
                await Core.execCommand(`cp "${sourceConfigPath}" "${webConfigPath}"`);
                console.log(`配置文件已复制到: ${webConfigPath}`);
    
                // 设置权限
                await Core.execCommand(`chmod 644 "${webConfigPath}"`);
                console.log('已设置配置文件权限');
            }
            
            // 复制其他配置文件
            try {
                const result = await Core.execCommand(`ls -1 "${Core.MODULE_PATH}module_settings/" | grep "\.sh$" | grep -v "^save-"`);
                if (result) {
                    const files = result.split('\n').filter(file => file.trim() !== '' && file !== 'config.sh');
                    
                    for (const file of files) {
                        const targetFile = file;
                        const sourceFile = `${Core.MODULE_PATH}module_settings/${file}`;
                        
                        // 检查目标文件是否需要更新
                        let fileNeedsCopy = true;
                        if (await Core.fileExists(targetFile)) {
                            try {
                                const sourceTime = await Core.execCommand(`stat -c %Y "${sourceFile}"`);
                                const targetTime = await Core.execCommand(`stat -c %Y "${targetFile}"`);
                                fileNeedsCopy = parseInt(sourceTime.trim()) > parseInt(targetTime.trim());
                            } catch (error) {
                                console.warn(`比较文件时间失败 ${file}，将强制复制:`, error);
                            }
                        }
                        
                        if (fileNeedsCopy) {
                            await Core.execCommand(`cp "${sourceFile}" "${targetFile}"`);
                            await Core.execCommand(`chmod 644 "${targetFile}"`);
                            console.log(`已复制并设置权限: ${file}`);
                        } else {
                            console.log(`文件已是最新: ${file}`);
                        }
                    }
                }
            } catch (error) {
                console.warn('复制其他配置文件失败:', error);
            }
            
            return true;
        } catch (error) {
            console.error('确保配置文件可访问失败:', error);
            return false;
        }
    }

    // 初始化导航
    initNavigation() {
        // 移除可能存在的旧事件监听器
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            // 克隆并替换元素以移除所有事件监听器
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // 添加新的事件监听器
            newItem.addEventListener('click', () => {
                const pageName = newItem.getAttribute('data-page');
                if (pageName) {
                    this.navigateTo(pageName);
                }
            });
        });
        
        console.log('导航初始化完成');
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

    // 加载页面内容
    async loadPage(pageName) {
        console.log(`loadPage: 开始加载 ${pageName} 页面`);
        const mainContent = document.getElementById('main-content');
        
        // 获取当前页面元素
        const currentPage = mainContent.querySelector('.page-container');
        
        // 如果有当前页面，添加退出动画
        if (currentPage) {
            currentPage.classList.add('page-exit');
            
            // 等待动画完成
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 清空主内容区域
        mainContent.innerHTML = '';
        
        // 显示加载指示器
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="spinner"></div>
            <p data-i18n="LOADING">${I18n.translate('LOADING', '加载中...')}</p>
        `;
        mainContent.appendChild(loadingContainer);
        
        try {
            // 获取页面模块
            const pageModule = this.pageModules[pageName];
            
            if (!pageModule) {
                throw new Error(`页面模块未找到: ${pageName}`);
            }
            
            console.log(`loadPage: 获取到页面模块 ${pageName}`);
            
            // 检查缓存
            let pageContent;
            let needsInit = true;
            
            if (this.pageCache[pageName] && !this.shouldRefreshPage(pageName)) {
                // 使用缓存的内容
                console.log(`使用缓存的页面内容: ${pageName}`);
                pageContent = this.pageCache[pageName];
                needsInit = false;
            } else {
                // 初始化页面模块
                if (typeof pageModule.init === 'function') {
                    console.log(`初始化页面模块: ${pageName}`);
                    try {
                        await pageModule.init();
                    } catch (initError) {
                        console.error(`初始化页面模块失败: ${pageName}`, initError);
                        throw new Error(`初始化页面失败: ${initError.message}`);
                    }
                }
                
                // 渲染页面内容
                console.log(`渲染页面内容: ${pageName}`);
                pageContent = pageModule.render();
                
                // 缓存页面内容
                this.pageCache[pageName] = pageContent;
                
                // 记录刷新时间
                if (!this.pageLastRefresh) {
                    this.pageLastRefresh = {};
                }
                this.pageLastRefresh[pageName] = Date.now();
            }
            
            // 移除加载指示器
            mainContent.removeChild(loadingContainer);
            
            // 添加页面内容
            console.log(`添加页面内容到DOM: ${pageName}`);
            mainContent.innerHTML = pageContent;
            
            // 获取新添加的页面容器
            const newPage = mainContent.querySelector('.page-container');
            if (newPage) {
                // 添加进入动画类
                newPage.classList.add('page-enter');
                
                // 强制重绘
                void newPage.offsetWidth;
                
                // 添加活动类触发动画
                newPage.classList.add('page-active');
            }
            
            // 应用国际化
            I18n.applyTranslations();
            
            // 执行页面的afterRender回调
            if (typeof pageModule.afterRender === 'function') {
                console.log(`执行页面的afterRender回调: ${pageName}`);
                pageModule.afterRender();
            }
            
            // 如果页面有addEventListeners方法，调用它
            if (typeof pageModule.addEventListeners === 'function') {
                console.log(`执行页面的addEventListeners方法: ${pageName}`);
                pageModule.addEventListeners();
            }
            
            // 更新活动导航项
            this.updateActiveNavItem(pageName);
            
        } catch (error) {
            console.error(`加载页面失败: ${pageName}`, error);
            
            // 显示错误信息
            mainContent.innerHTML = `
                <div class="error-container page-enter">
                    <span class="material-symbols-rounded">error</span>
                    <h3>${I18n.translate('PAGE_LOAD_ERROR', '页面加载失败')}</h3>
                    <p>${error.message}</p>
                    <button class="md-button" onclick="app.navigateTo('status')">
                        <span class="material-symbols-rounded">home</span>
                        ${I18n.translate('BACK_TO_HOME', '返回首页')}
                    </button>
                </div>
            `;
            
            // 添加动画
            const errorContainer = mainContent.querySelector('.error-container');
            if (errorContainer) {
                // 强制重绘
                void errorContainer.offsetWidth;
                
                // 添加活动类触发动画
                errorContainer.classList.add('page-active');
            }
        }
    }

    // 判断是否需要刷新页面
    shouldRefreshPage(pageName) {
        // 日志页面总是刷新
        if (pageName === 'logs') {
            return true;
        }
        
        // 状态页面每30秒刷新一次（改为更频繁的刷新）
        if (pageName === 'status') {
            if (!this.pageLastRefresh) {
                this.pageLastRefresh = {};
            }
            const lastRefresh = this.pageLastRefresh[pageName] || 0;
            return (Date.now() - lastRefresh) > 30000;
        }
        
        // 设置页面每5分钟刷新一次
        if (pageName === 'settings') {
            if (!this.pageLastRefresh) {
                this.pageLastRefresh = {};
            }
            const lastRefresh = this.pageLastRefresh[pageName] || 0;
            return (Date.now() - lastRefresh) > 300000;
        }
        
        return false;
    }
    
    // 强制刷新当前页面
    refreshCurrentPage() {
        // 清除当前页面的缓存
        if (this.currentPage) {
            delete this.pageCache[this.currentPage];
            if (this.pageLastRefresh) {
                this.pageLastRefresh[this.currentPage] = 0;
            }
            this.navigateTo(this.currentPage);
        }
    }

    // 更新活动导航项
    updateActiveNavItem(pageName) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === pageName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 绑定事件
    bindEvents() {
        // 语言切换按钮
        const languageButton = document.getElementById('language-button');
        const languageSelector = document.getElementById('language-selector');
        const cancelLanguage = document.getElementById('cancel-language');
        
        if (languageButton && languageSelector) {
            languageButton.addEventListener('click', () => {
                // 添加显示类
                languageSelector.classList.add('show');
                
                // 渲染语言选项
                this.renderLanguageOptions();
                
                // 阻止页面滚动
                document.body.style.overflow = 'hidden';
            });
            
            if (cancelLanguage) {
                cancelLanguage.addEventListener('click', () => {
                    // 关闭语言选择器
                    this.closeLanguageSelector();
                });
            }
            
            // 点击外部关闭语言选择器
            languageSelector.addEventListener('click', (e) => {
                if (e.target === languageSelector) {
                    this.closeLanguageSelector();
                }
            });
            
            // 添加ESC键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && languageSelector.classList.contains('show')) {
                    this.closeLanguageSelector();
                }
            });
        }
        
        // 添加底栏日志按钮事件监听
        const logsButton = document.querySelector('.nav-item[data-page="logs"]');
        if (logsButton) {
            logsButton.addEventListener('click', () => {
                this.navigateTo('logs');
            });
        }
    }
    
    // 关闭语言选择器
    closeLanguageSelector() {
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.classList.remove('show');
            // 恢复页面滚动
            document.body.style.overflow = '';
        }
    }

    // 渲染语言选项
    renderLanguageOptions() {
        const languageOptions = document.getElementById('language-options');
        if (!languageOptions) return;
        
        // 清空现有选项
        languageOptions.innerHTML = '';
        
        // 获取可用语言
        const languages = I18n.getAvailableLanguages();
        const currentLang = I18n.getCurrentLanguage();
        
        // 添加语言选项
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = `language-option ${lang.code === currentLang ? 'active' : ''}`;
            option.setAttribute('data-lang', lang.code);
            option.textContent = lang.name;
            
            option.addEventListener('click', () => {
                I18n.setLanguage(lang.code);
                document.getElementById('language-selector').classList.remove('show');
                
                // 清除所有页面缓存，以便应用新语言
                this.pageCache = {};
                
                // 重新加载当前页面以应用新语言
                this.loadPage(this.currentPage);
            });
            
            languageOptions.appendChild(option);
        });
    }

    // 显示加载指示器
    showLoading() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p data-i18n="LOADING">加载中...</p>
                </div>
            `;
        }
    }

    // 隐藏加载指示器
    hideLoading() {
        // 不需要特别处理，因为loadPage会清空内容
    }

    // 显示错误信息
    showError(message) {
        Logger.error('应用错误', message);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-container">
                    <span class="material-symbols-rounded">error</span>
                    <p>${message}</p>
                    <button class="md-button" onclick="location.reload()">重试</button>
                </div>
            `;
        }
    }

    // 获取系统信息
    async getSystemInfo() {
        try {
            const systemInfo = {};
            
            // 获取 ABI
            const abiResult = await Core.execCommand('getprop ro.product.cpu.abi');
            systemInfo.abi = abiResult.trim() || 'Unknown';
            
            // 获取安卓版本
            const androidVersionResult = await Core.execCommand('getprop ro.build.version.release');
            const androidApiResult = await Core.execCommand('getprop ro.build.version.sdk');
            systemInfo.androidVersion = `${androidVersionResult.trim()} (API ${androidApiResult.trim()})` || 'Unknown';
            
            // 获取内核版本
            const kernelVersionResult = await Core.execCommand('uname -r');
            systemInfo.kernelVersion = kernelVersionResult.trim() || 'Unknown';
            
            // 获取模块路径
            systemInfo.modulePath = Core.MODULE_PATH;
            
            // 检测 ROOT 实现方式
            const rootImplementation = await this.detectRootImplementation();
            systemInfo.rootImplementation = rootImplementation;
            
            return systemInfo;
        } catch (error) {
            console.error('获取系统信息失败:', error);
            return {
                abi: 'Unknown',
                androidVersion: 'Unknown',
                kernelVersion: 'Unknown',
                modulePath: Core.MODULE_PATH,
                rootImplementation: 'Unknown'
            };
        }
    }

    // 检测 ROOT 实现方式
    async detectRootImplementation() {
        try {
            // 检查 Magisk
            const magiskExists = await Core.directoryExists('/data/adb/magisk');
            if (magiskExists) {
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
            const ksuExists = await Core.directoryExists('/data/adb/ksu');
            if (ksuExists) {
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
            const apatchExists = await Core.directoryExists('/data/adb/apd');
            if (apatchExists) {
                return 'APatch';
            }
            
            return 'Unknown';
        } catch (error) {
            console.error('检测 ROOT 实现方式失败:', error);
            return 'Unknown';
        }
    }
    
    // 预加载页面
    preloadPages() {
        // 创建一个隐藏的容器用于预渲染
        const preloadContainer = document.createElement('div');
        preloadContainer.style.display = 'none';
        document.body.appendChild(preloadContainer);
        
        // 预加载所有页面
        Object.keys(this.pageModules).forEach(pageName => {
            if (pageName !== this.currentPage) {
                setTimeout(() => {
                    try {
                        const pageModule = this.pageModules[pageName];
                        
                        // 如果页面模块有预加载方法，则调用它
                        if (typeof pageModule.preload === 'function') {
                            pageModule.preload();
                            return;
                        }
                        
                        // 否则尝试渲染页面内容
                        const pageContent = pageModule.render();
                        this.pageCache[pageName] = pageContent;
                        
                        // 记录预加载时间
                        this.pageLastRefresh = this.pageLastRefresh || {};
                        this.pageLastRefresh[pageName] = Date.now();
                        
                        console.log(`预加载页面完成: ${pageName}`);
                    } catch (error) {
                        console.warn(`预加载页面失败: ${pageName}`, error);
                    }
                }, 1000 + Math.random() * 1000); // 随机延迟1-2秒，避免同时加载
            }
        });
    }
    
    // 清除页面缓存
    clearPageCache() {
        this.pageCache = {};
        console.log('已清除所有页面缓存');
    }
}

// 创建应用实例
const app = new App();

// 导出应用实例
window.app = app;

// 添加页面预加载功能
document.addEventListener('DOMContentLoaded', () => {
    // 在初始页面加载完成后预加载其他页面
    window.addEventListener('load', () => {
        // 预加载由App类中的preloadPages方法处理
    });
});

// 在文件末尾添加全局错误处理

// 添加全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    Logger.error('未捕获的错误', {
        message: event.error?.message || '未知错误',
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno
    });
    
    // 显示友好的错误消息
    Core.showToast(I18n.translate('UNEXPECTED_ERROR', '发生意外错误，请刷新页面'), 'error');
    
    // 防止错误传播
    event.preventDefault();
});

// 处理未捕获的Promise异常
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    Logger.error('未处理的Promise拒绝', {
        message: event.reason?.message || '未知原因',
        stack: event.reason?.stack
    });
    
    // 显示友好的错误消息
    Core.showToast(I18n.translate('ASYNC_ERROR', '异步操作失败，请重试'), 'error');
    
    // 防止错误传播
    event.preventDefault();
});
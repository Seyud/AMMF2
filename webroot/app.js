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
    
            // 复制配置文件到webroot
            await Core.execCommand(`cp "${sourceConfigPath}" "${webConfigPath}"`);
            console.log(`配置文件已复制到: ${webConfigPath}`);
    
            // 设置权限
            await Core.execCommand(`chmod 644 "${webConfigPath}"`);
            console.log('已设置配置文件权限');
            
            // 复制其他配置文件
            try {
                const result = await Core.execCommand(`ls -1 "${Core.MODULE_PATH}module_settings/" | grep "\.sh$" | grep -v "^save-"`);
                if (result) {
                    const files = result.split('\n').filter(file => file.trim() !== '' && file !== 'config.sh');
                    
                    // 复制每个配置文件到webroot
                    for (const file of files) {
                        const sourcePath = `${Core.MODULE_PATH}module_settings/${file}`;
                        await Core.execCommand(`cp "${sourcePath}" "${file}"`);
                        await Core.execCommand(`chmod 644 "${file}"`);
                        console.log(`额外配置文件已复制: ${file}`);
                    }
                }
            } catch (error) {
                console.warn('复制额外配置文件时出错:', error);
                // 继续执行，不影响主要功能
            }
    
            return true;
        } catch (error) {
            console.error('确保配置文件访问时出错:', error);
            return false;
        }
    }

    // 初始化导航
    initNavigation() {
        // 获取所有导航项
        const navItems = document.querySelectorAll('.nav-item');

        // 添加点击事件
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page) {
                item.addEventListener('click', () => {
                    this.navigateTo(page);
                });
            }
        });
    }

    // 导航到指定页面
    async navigateTo(page) {
        if (!this.pageModules[page]) {
            console.error(`页面模块不存在: ${page}`);
            return;
        }

        try {
            // 更新当前页面
            this.currentPage = page;

            // 更新导航项状态
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                if (item.getAttribute('data-page') === page) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // 显示加载指示器
            this.showLoading();

            // 初始化页面模块
            await this.pageModules[page].init();

            // 渲染页面内容
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = this.pageModules[page].render();

                // 调用渲染后的回调
                if (typeof this.pageModules[page].afterRender === 'function') {
                    this.pageModules[page].afterRender();
                }
            }

            // 应用翻译
            I18n.applyTranslations();

            // 隐藏加载指示器
            this.hideLoading();
        } catch (error) {
            console.error(`导航到页面出错: ${page}`, error);
            this.hideLoading();
            this.showError(`加载页面 ${page} 失败`);
        }
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
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('fade-out');
            setTimeout(() => {
                if (loadingContainer.parentNode === document.getElementById('main-content')) {
                    document.getElementById('main-content').removeChild(loadingContainer);
                }
            }, 300);
        }
    }

    // 显示错误
    showError(message) {
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

    // 绑定事件
    bindEvents() {
        // 监听语言变更事件
        document.addEventListener('languageChanged', () => {
            // 重新渲染当前页面
            if (this.initialized && this.pageModules[this.currentPage]) {
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.innerHTML = this.pageModules[this.currentPage].render();

                    // 调用渲染后的回调
                    if (typeof this.pageModules[this.currentPage].afterRender === 'function') {
                        this.pageModules[this.currentPage].afterRender();
                    }

                    // 应用翻译
                    I18n.applyTranslations();
                }
            }
        });
    }
}

// 创建应用实例
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
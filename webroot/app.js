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
                    
                    for (const file of files) {
                        await Core.execCommand(`cp "${Core.MODULE_PATH}module_settings/${file}" "${file}"`);
                        await Core.execCommand(`chmod 644 "${file}"`);
                        console.log(`已复制并设置权限: ${file}`);
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
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                if (page) {
                    this.navigateTo(page);
                }
            });
        });
    }

    // 导航到指定页面
    async navigateTo(pageName) {
        if (!this.pageModules[pageName]) {
            console.error(`页面模块不存在: ${pageName}`);
            return;
        }

        // 保存当前页面
        this.currentPage = pageName;

        // 加载页面内容
        await this.loadPage(pageName);
    }

    // 加载页面内容
    async loadPage(pageName) {
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
            
            // 初始化页面模块
            if (typeof pageModule.init === 'function') {
                await pageModule.init();
            }
            
            // 渲染页面内容
            const pageContent = pageModule.render();
            
            // 移除加载指示器
            mainContent.removeChild(loadingContainer);
            
            // 添加页面内容
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
                pageModule.afterRender();
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
                languageSelector.classList.add('show');
                this.renderLanguageOptions();
            });
            
            if (cancelLanguage) {
                cancelLanguage.addEventListener('click', () => {
                    languageSelector.classList.remove('show');
                });
            }
            
            // 点击外部关闭语言选择器
            languageSelector.addEventListener('click', (e) => {
                if (e.target === languageSelector) {
                    languageSelector.classList.remove('show');
                }
            });
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
}

// 创建应用实例
const app = new App();

// 导出应用实例
window.app = app;
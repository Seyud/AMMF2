/**
 * AMMF WebUI 主应用脚本
 * 处理页面加载、路由和全局事件
 */

class AppState {
    constructor() {
        this.currentPage = null;
        this.pageInstance = null;
        this.isLoading = true;
        this.themeChanging = false;
        this.pageChanging = false;
    }
}

class PageManager {
    static modules = {
        status: 'StatusPage',
        logs: 'LogsPage',
        settings: 'SettingsPage',
        about: 'AboutPage'
    };

    static cache = new Map();

    static async loadPage(pageName) {
        const module = this.cache.get(pageName) || window[this.modules[pageName]];
        if (!module) throw new Error(`页面模块 ${pageName} 未找到`);
        return module;
    }

    static preloadPages() {
        requestIdleCallback(() => {
            Object.entries(this.modules).forEach(([name, module]) => {
                if (!this.cache.has(name)) {
                    const pageModule = window[module];
                    if (pageModule) this.cache.set(name, pageModule);
                }
            });
        });
    }
}

class UI {
    static elements = {
        app: document.getElementById('app'),
        mainContent: document.getElementById('main-content'),
        pageTitle: document.getElementById('page-title'),
        pageActions: document.getElementById('page-actions'),
        themeToggle: document.getElementById('theme-toggle'),
        languageButton: document.getElementById('language-button'),
        navItems: document.querySelectorAll('.nav-item'),
        header: document.querySelector('.app-header'),
        navContent: document.querySelector('.nav-content')
    };

    static transitions = {
        duration: {
            page: 300,
            theme: 400,
            nav: 200
        },
        timing: {
            standard: 'ease',
            emphasized: 'cubic-bezier(0.2, 0, 0, 1)'
        }
    };

    static updatePageTitle(pageName) {
        const titles = {
            status: I18n.translate('NAV_STATUS', '状态'),
            logs: I18n.translate('NAV_LOGS', '日志'),
            settings: I18n.translate('NAV_SETTINGS', '设置'),
            about: I18n.translate('NAV_ABOUT', '关于')
        };

        this.elements.pageTitle.textContent = titles[pageName] || 'AMMF WebUI';
    }

    static updateNavigation(pageName) {
        this.elements.navItems.forEach(item => {
            const isActive = item.getAttribute('data-page') === pageName;
            item.classList.toggle('active', isActive);
        });
    }

    static showError(title, message) {
        this.elements.mainContent.innerHTML = `
            <div class="page-container">
                <div class="error-container">
                    <h2>${title}</h2>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }
    static updateLayout() {
        const isLandscape = window.innerWidth >= 768;
        const header = this.elements.header;
        const mainContent = document.getElementById('main-content');
        const navContent = this.elements.navContent;
        const pageActions = this.elements.pageActions;
        const pageTitle = this.elements.pageTitle;
        const themeToggle = this.elements.themeToggle;
        const languageButton = this.elements.languageButton;
    
        if (isLandscape) {
            // 横屏模式：隐藏顶栏，将标题和操作按钮移至页面顶部
            header.style.display = 'none';
            
            // 创建或获取页面头部容器
            let pageHeader = mainContent.querySelector('.page-header');
            if (!pageHeader) {
                pageHeader = document.createElement('div');
                pageHeader.className = 'page-header';
                const pageHeaderContent = document.createElement('div');
                pageHeaderContent.className = 'page-header-content';
                pageHeader.appendChild(pageHeaderContent);
                mainContent.insertBefore(pageHeader, mainContent.firstChild);
            }
    
            // 移动标题和操作按钮到页面头部内容容器中
            const pageHeaderContent = pageHeader.querySelector('.page-header-content');
            if (pageTitle && !pageHeaderContent.contains(pageTitle)) {
                // 修复标题截断问题
                pageTitle.style.display = 'block';
                pageTitle.style.overflow = 'visible'; // 确保内容不被截断
                pageTitle.style.textOverflow = 'clip'; // 移除省略号
                pageTitle.style.maxWidth = 'none'; // 移除最大宽度限制
                pageHeaderContent.appendChild(pageTitle);
            }
            if (pageActions && !pageHeaderContent.contains(pageActions)) {
                pageActions.style.margin = '0';
                pageHeaderContent.appendChild(pageActions);
            }
    
            // 移动主题和语言按钮到侧边栏底部
            let bottomActions = navContent.querySelector('.nav-bottom-actions');
            if (!bottomActions) {
                bottomActions = document.createElement('div');
                bottomActions.className = 'nav-bottom-actions';
                navContent.appendChild(bottomActions);
            }
            if (!bottomActions.contains(languageButton)) {
                bottomActions.appendChild(languageButton);
            }
            if (!bottomActions.contains(themeToggle)) {
                bottomActions.appendChild(themeToggle);
            }
        } else {
            // 竖屏模式：恢复原始布局
            header.style.display = 'flex';
            const headerContent = header.querySelector('.header-content');
            if (headerContent) {
                // 恢复标题显示
                if (pageTitle) {
                    pageTitle.style.display = 'block';
                    // 重置标题样式
                    pageTitle.style.whiteSpace = '';
                    pageTitle.style.overflow = '';
                    pageTitle.style.textOverflow = '';
                    pageTitle.style.maxWidth = '';
                    
                    if (!headerContent.contains(pageTitle)) {
                        headerContent.insertBefore(pageTitle, headerContent.firstChild);
                    }
                }
                // 恢复操作按钮
                const headerActions = headerContent.querySelector('.header-actions');
                if (headerActions) {
                    if (!headerActions.contains(pageActions)) {
                        pageActions.style.margin = '';
                        headerActions.insertBefore(pageActions, headerActions.firstChild);
                    }
                    if (!headerActions.contains(languageButton)) {
                        headerActions.appendChild(languageButton);
                    }
                    if (!headerActions.contains(themeToggle)) {
                        headerActions.appendChild(themeToggle);
                    }
                }
            }
        }
    }
}

class ThemeManager {
    static toggle(event) {
        if (app.state.themeChanging) return;
        app.state.themeChanging = true;

        const isDark = document.documentElement.classList.contains('dark-theme');
        const newTheme = isDark ? 'light' : 'dark';

        document.documentElement.classList.toggle('dark-theme');
        document.documentElement.classList.toggle('light-theme');

        localStorage.setItem('theme', newTheme);
        
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1C1B1E' : '#6750A4');
        }

        const iconElement = UI.elements.themeToggle.querySelector('.material-symbols-rounded');
        if (iconElement) {
            iconElement.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
        }

        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme }
        }));

        setTimeout(() => {
            app.state.themeChanging = false;
        }, UI.transitions.duration.theme);
    }
}

class Router {
    static async navigate(pageName, pushState = true) {
        if (app.state.pageChanging || pageName === app.state.currentPage) return;
        app.state.pageChanging = true;

        try {
            UI.updateNavigation(pageName);
            await this.renderPage(pageName);
            
            if (pushState) {
                history.pushState({ page: pageName }, '', `?page=${pageName}`);
            }

            app.state.currentPage = pageName;
        } catch (error) {
            console.error('页面导航失败:', error);
            UI.showError(I18n.translate('PAGE_LOAD_ERROR', '页面加载失败'), error.message);
        } finally {
            app.state.pageChanging = false;
        }
    }

    static async renderPage(pageName) {
        const headerHeight = UI.elements.header.offsetHeight;
        // 修改最小高度计算，确保内容区域足够长
        UI.elements.mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        
        const pageModule = await PageManager.loadPage(pageName);
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container page-enter';
        pageContainer.id = `page-${pageName}`;
        pageContainer.innerHTML = pageModule.render();

        const oldContainer = UI.elements.mainContent.querySelector('.page-container');
        if (oldContainer) {
            oldContainer.classList.add('page-exit');
        }

        await this.performPageTransition(pageContainer, oldContainer);
        
        if (app.state.pageInstance) {
            await Promise.all([
                app.state.pageInstance.onDeactivate?.(),
                app.state.pageInstance.destroy?.()
            ].filter(Boolean));
        }

        app.state.pageInstance = pageModule;
        
        await Promise.all([
            pageModule.init?.(),
            pageModule.afterRender?.(),
            pageModule.onActivate?.()
        ].filter(Boolean));

        UI.updatePageTitle(pageName);
        PageManager.preloadPages();

        requestIdleCallback(() => {
            document.dispatchEvent(new CustomEvent('pageChanged', { 
                detail: { page: pageName }
            }));
        });
    }

    static async performPageTransition(newContainer, oldContainer) {
        return new Promise(resolve => {
            UI.elements.mainContent.appendChild(newContainer);
            requestAnimationFrame(() => {
                newContainer.classList.add('page-active');
                
                const onTransitionEnd = () => {
                    if (oldContainer) oldContainer.remove();
                    newContainer.removeEventListener('transitionend', onTransitionEnd);
                    resolve();
                };
                
                newContainer.addEventListener('transitionend', onTransitionEnd);
            });
        });
    }

    static getCurrentPage() {
        return new URLSearchParams(window.location.search).get('page') || 'status';
    }
}

class App {
    constructor() {
        this.state = new AppState();
        this.setupEventListeners();
    }

    setupEventListeners() {
        UI.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = item.getAttribute('data-page');
                Router.navigate(pageName);
            });
        });

        UI.elements.themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            ThemeManager.toggle(e);
        });
        window.addEventListener('resize', () => {
            UI.updateLayout();
        });

        // 添加页面加载完成后的布局初始化
        document.addEventListener('DOMContentLoaded', () => {
            UI.updateLayout();
        });
        window.addEventListener('popstate', (e) => {
            const pageName = e.state?.page || 'status';
            Router.navigate(pageName, false);
        });

        document.addEventListener('languageChanged', () => {
            UI.updatePageTitle(this.state.currentPage);
        });
    }

    async init() {
        await I18n.init();
        
        requestAnimationFrame(() => {
            document.body.classList.add('app-loaded');
        });

        if (window.I18n?.initLanguageSelector) {
            I18n.initLanguageSelector();
        } else {
            document.addEventListener('i18nReady', () => {
                I18n.initLanguageSelector();
            });
        }

        const initialPage = Router.getCurrentPage();
        await Router.navigate(initialPage, false);
        
        this.state.isLoading = false;

        const loadingContainer = document.querySelector('#main-content .loading-container');
        if (loadingContainer) {
            loadingContainer.style.opacity = '0';
            setTimeout(() => loadingContainer.remove(), UI.transitions.duration.page);
        }
    }

    async execCommand(command) {
        try {
            return await Core.execCommand(command);
        } catch (error) {
            console.error('执行终端命令失败:', error);
            return false;
        }
    }
}

// 创建应用实例并导出公共API
const app = new App();

window.App = {
    loadPage: (pageName) => Router.navigate(pageName),
    updateActiveNavItem: (pageName) => UI.updateNavigation(pageName),
    o: (command) => app.execCommand(command)
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => app.init());
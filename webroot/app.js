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
        header: document.querySelector('.app-header')
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
        UI.elements.mainContent.style.minHeight = `calc(100vh - ${headerHeight}px - var(--nav-height))`;

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
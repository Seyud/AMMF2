/**
 * AMMF WebUI 主应用脚本
 * 处理页面加载、路由和全局事件
 */

// 应用状态
const appState = {
    currentPage: null,
    pageInstance: null,
    isLoading: true,
    themeChanging: false,
    pageChanging: false
};

// 页面模块映射
const pageModules = {
    status: 'StatusPage',
    logs: 'LogsPage',
    settings: 'SettingsPage',
    about: 'AboutPage'
};

// 动画配置
const animations = {
    duration: {
        navItem: 200,
        ripple: 400,
        page: 400,
        theme: 400
    },
    easing: {
        standard: 'var(--md-sys-motion-easing-standard)',
        emphasized: 'var(--md-sys-motion-easing-emphasized)',
        emphasizedDecelerate: 'var(--md-sys-motion-easing-emphasized-decelerate)'
    }
};

// DOM 元素缓存
const elements = {
    app: document.getElementById('app'),
    mainContent: document.getElementById('main-content'),
    pageTitle: document.getElementById('page-title'),
    pageActions: document.getElementById('page-actions'),
    themeToggle: document.getElementById('theme-toggle'),
    languageButton: document.getElementById('language-button'),
    navItems: document.querySelectorAll('.nav-item')
};

/**
 * 初始化应用
 */
async function initApp() {
    try {
        // 添加 app-loaded 类以触发淡入动画
        requestAnimationFrame(() => {
            document.body.classList.add('app-loaded');
        });

        // 设置导航事件监听
        setupNavigation();
        
        // 设置主题切换
        setupThemeToggle();
        
        // 设置语言切换
        setupLanguageToggle();
        
        // 添加语言切换事件监听
        document.addEventListener('languageChanged', () => {
            updatePageTitle(appState.currentPage);
        });
        
        // 加载初始页面
        const initialPage = getCurrentPageFromUrl() || 'status';
        updateActiveNavItem(initialPage);
        await loadPage(initialPage);
        
        // 标记应用加载完成
        appState.isLoading = false;
        
        // 移除初始加载容器
        const loadingContainer = document.querySelector('#main-content .loading-container');
        if (loadingContainer) {
            loadingContainer.style.opacity = '0';
            setTimeout(() => {
                loadingContainer.remove();
            }, animations.duration.page);
        }
    } catch (error) {
        console.error('应用初始化失败:', error);
        showErrorMessage('应用初始化失败', error.message);
    }
}

/**
 * 设置导航事件
 */
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            
            if (pageName === appState.currentPage || appState.pageChanging) return;
            
            updateActiveNavItem(pageName);
            await loadPage(pageName);
            history.pushState({ page: pageName }, '', `?page=${pageName}`);
        });
        
        // 删除这行：item.addEventListener('pointerdown', createRippleEffect);
    });
    
    window.addEventListener('popstate', async (e) => {
        const pageName = e.state?.page || 'status';
        updateActiveNavItem(pageName);
        await loadPage(pageName);
    });
}

/**
 * 创建涟漪效果
 */
function createRippleEffect(e) {
    const button = e.currentTarget;
    const isNavItem = button.classList.contains('nav-item');
    const rect = button.getBoundingClientRect();
    
    // 创建涟漪元素
    const ripple = document.createElement('span');
    ripple.className = isNavItem ? 'nav-ripple' : 'ripple';
    
    if (isNavItem) {
        // 导航项的涟漪效果
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            background-color: var(--md-ripple-color);
            opacity: 0.12;
        `;
        
        // 如果是激活状态，添加强调涟漪
        if (button.classList.contains('active')) {
            const emphasisRipple = document.createElement('span');
            emphasisRipple.className = 'nav-ripple emphasis';
            emphasisRipple.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: 20px;
                height: 20px;
                background-color: var(--md-primary);
                opacity: 0.08;
            `;
            button.appendChild(emphasisRipple);
            
            setTimeout(() => {
                emphasisRipple.remove();
            }, animations.duration.ripple);
        }
    } else {
        // 普通按钮的涟漪效果
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
        `;
    }
    
    button.appendChild(ripple);
    
    // 强制重排以确保动画正确触发
    void ripple.offsetWidth;
    ripple.classList.add('active');
    
    // 动画结束后移除涟漪
    setTimeout(() => {
        ripple.remove();
    }, animations.duration.ripple);
    
    // 清理事件监听
    const cleanup = () => {
        button.removeEventListener('pointerup', cleanup);
        button.removeEventListener('pointercancel', cleanup);
    };
    
    button.addEventListener('pointerup', cleanup);
    button.addEventListener('pointercancel', cleanup);
}

/**
 * 更新活动导航项
 */
function updateActiveNavItem(pageName) {
    elements.navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName) {
            if (!item.classList.contains('active')) {
                // 移除所有导航项的激活状态
                elements.navItems.forEach(navItem => {
                    navItem.classList.remove('active', 'animate');
                });
                
                // 添加新的激活状态
                item.classList.add('active');
                requestAnimationFrame(() => {
                    item.classList.add('animate');
                    setTimeout(() => {
                        item.classList.remove('animate');
                    }, animations.duration.navItem);
                });
            }
        } else {
            item.classList.remove('active', 'animate');
        }
    });
}

/**
 * 从 URL 获取当前页面
 */
function getCurrentPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('page');
}

/**
 * 加载页面
 */
// 添加页面预加载缓存
const pageCache = new Map();

// 添加防抖函数
function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 优化页面加载函数
async function loadPage(pageName) {
    if (appState.pageChanging) return;
    appState.pageChanging = true;
    
    try {
        // 添加固定高度过渡
        const headerHeight = document.querySelector('.app-header').offsetHeight;
        elements.mainContent.style.minHeight = `calc(100vh - ${headerHeight}px - var(--nav-height))`;
        
        // 预加载下一个可能的页面
        requestIdleCallback(() => {
            Object.keys(pageModules).forEach(page => {
                if (page !== pageName && !pageCache.has(page)) {
                    const module = window[pageModules[page]];
                    if (module) pageCache.set(page, module);
                }
            });
        });

        // 使用 transform 代替 opacity 并固定高度
        elements.pageTitle.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        elements.pageTitle.style.opacity = '0';
        elements.pageTitle.style.transform = 'translateY(-10px)';
        
        elements.pageActions.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        elements.pageActions.style.opacity = '0';
        elements.pageActions.style.transform = 'translateY(-10px)';
        
        // 获取页面实例
        const pageModuleName = pageModules[pageName];
        const newPageInstance = pageCache.get(pageName) || window[pageModuleName];
        
        if (!newPageInstance) {
            throw new Error(`页面模块 ${pageName} 未找到`);
        }
        
        // 创建新页面容器
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container page-enter';
        pageContainer.id = `page-${pageName}`;
        
        // 使用 DocumentFragment 优化 DOM 操作
        const fragment = document.createDocumentFragment();
        fragment.appendChild(pageContainer);
        pageContainer.innerHTML = newPageInstance.render();
        
        // 优化页面切换动画
        const oldPageContainer = elements.mainContent.querySelector('.page-container');
        if (oldPageContainer) {
            oldPageContainer.style.willChange = 'transform, opacity';
            oldPageContainer.classList.add('page-exit');
        }
        
        // 使用 RAF 优化动画帧
        requestAnimationFrame(() => {
            elements.mainContent.appendChild(fragment);
            
            // 强制重排
            void pageContainer.offsetWidth;
            
            requestAnimationFrame(() => {
                pageContainer.classList.add('page-active');
                if (oldPageContainer) {
                    oldPageContainer.classList.add('page-active');
                }
                
                // 恢复标题和按钮的显示
                elements.pageTitle.style.opacity = '1';
                elements.pageTitle.style.transform = 'translateY(0)';
                elements.pageActions.style.opacity = '1';
                elements.pageActions.style.transform = 'translateY(0)';
                
                // 更新页面标题
                updatePageTitle(pageName);
                updatePageActions(pageName);
            });
        });

        // 等待动画完成
        await new Promise(resolve => {
            const onTransitionEnd = () => {
                pageContainer.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };
            pageContainer.addEventListener('transitionend', onTransitionEnd);
        });
        
        // 清理旧页面
        if (oldPageContainer) {
            oldPageContainer.remove();
        }
        
        // 更新应用状态
        appState.currentPage = pageName;
        
        // 优化生命周期调用
        if (appState.pageInstance) {
            Promise.resolve()
                .then(() => appState.pageInstance.onDeactivate?.())
                .then(() => appState.pageInstance.destroy?.())
                .catch(console.error);
        }
        
        appState.pageInstance = newPageInstance;
        
        // 并行执行生命周期方法
        await Promise.all([
            newPageInstance.init?.(),
            newPageInstance.afterRender?.(),
            newPageInstance.onActivate?.()
        ].filter(Boolean));
        
        // 触发页面切换事件
        window.requestIdleCallback(() => {
            document.dispatchEvent(new CustomEvent('pageChanged', { 
                detail: { page: pageName }
            }));
        });
        
    } catch (error) {
        console.error('加载页面失败:', error);
        showErrorMessage(I18n.translate('PAGE_LOAD_ERROR', '页面加载失败'), error.message);
    } finally {
        requestAnimationFrame(() => {
            appState.pageChanging = false;
        });
    }
}

// 优化导航事件处理
function setupNavigation() {
    const navHandler = debounce(async (e, item) => {
        e.preventDefault();
        const pageName = item.getAttribute('data-page');
        
        if (pageName === appState.currentPage || appState.pageChanging) return;
        
        updateActiveNavItem(pageName);
        await loadPage(pageName);
        history.pushState({ page: pageName }, '', `?page=${pageName}`);
    }, 100);

    elements.navItems.forEach(item => {
        item.addEventListener('click', e => navHandler(e, item));
        item.addEventListener('pointerdown', createRippleEffect, { passive: true });
    });
    
    // 优化 popstate 处理
    window.addEventListener('popstate', debounce(async (e) => {
        const pageName = e.state?.page || 'status';
        updateActiveNavItem(pageName);
        await loadPage(pageName);
    }, 100));
}

/**
 * 显示错误消息
 */
function showErrorMessage(title, message) {
    elements.mainContent.innerHTML = `
        <div class="page-container">
            <div class="error-container">
                <h2>${title}</h2>
                <p>${message}</p>
            </div>
        </div>
    `;
}

/**
 * 设置主题切换
 */
function setupThemeToggle() {
    elements.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme(e);
    });
    
    updateThemeIcon();
}

/**
 * 设置语言切换
 */
function setupLanguageToggle() {
    if (window.I18n?.initLanguageSelector) {
        I18n.initLanguageSelector();
    } else {
        document.addEventListener('i18nReady', () => {
            I18n.initLanguageSelector();
        });
    }
}

/**
 * 更新主题图标
 */
function updateThemeIcon() {
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    const iconElement = elements.themeToggle.querySelector('.material-symbols-rounded');
    if (iconElement) {
        iconElement.textContent = isDarkTheme ? 'dark_mode' : 'light_mode';
    }
}

/**
 * 切换主题
 */
function toggleTheme(event) {
    if (appState.themeChanging) return;
    appState.themeChanging = true;
    
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    ripple.style.setProperty('--ripple-color', isDarkTheme ? '#FFFBFF' : '#1C1B1E');
    
    ripple.style.cssText = `
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        transition: transform ${animations.duration.theme}ms ${animations.easing.emphasized};
    `;
    
    document.body.appendChild(ripple);
    
    requestAnimationFrame(() => {
        ripple.classList.add('active');
        
        setTimeout(() => {
            document.documentElement.classList.toggle('dark-theme');
            document.documentElement.classList.toggle('light-theme');
            
            updateThemeIcon();
            
            const newTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1C1B1E' : '#6750A4');
            }
            
            document.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { theme: newTheme }
            }));
        }, animations.duration.theme / 2);
        
        setTimeout(() => {
            ripple.remove();
            appState.themeChanging = false;
        }, animations.duration.theme);
    });
}

/**
 * 打开终端并执行命令
 */
async function openTerminal(command) {
    try {
        return await Core.execCommand(command);
    } catch (error) {
        console.error('执行终端命令失败:', error);
        return false;
    }
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    await I18n.init();
    initApp();
});

// 导出公共方法
window.App = {
    loadPage,
    updateActiveNavItem,
    openTerminal,
    createRippleEffect
};


function updatePageTitle(pageName) {
    const titles = {
        status: I18n.translate('NAV_STATUS', '状态'),
        logs: I18n.translate('NAV_LOGS', '日志'),
        settings: I18n.translate('NAV_SETTINGS', '设置'),
        about: I18n.translate('NAV_ABOUT', '关于')
    };
    
    // 强制重绘以确保文本更新
    elements.pageTitle.style.display = 'none';
    elements.pageTitle.offsetHeight; // 触发重排
    elements.pageTitle.style.display = '';
    
    elements.pageTitle.textContent = titles[pageName] || 'AMMF WebUI';
}

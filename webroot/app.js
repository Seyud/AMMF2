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
    status: './pages/status.js',
    logs: './pages/logs.js',
    settings: './pages/settings.js',
    about: './pages/about.js'
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

// 初始化应用
async function initApp() {
    // 添加 app-loaded 类以触发淡入动画
    setTimeout(() => {
        document.body.classList.add('app-loaded');
    }, 100);

    // 设置导航事件监听
    setupNavigation();
    
    // 设置主题切换
    setupThemeToggle();
    
    // 设置语言切换
    setupLanguageToggle();
    
    // 加载初始页面
    const initialPage = getCurrentPageFromUrl() || 'status';
    await loadPage(initialPage);
    
    // 标记应用加载完成
    appState.isLoading = false;
}

// 设置导航事件
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            
            // 如果已经是当前页面，不做任何操作
            if (pageName === appState.currentPage) return;
            
            // 更新导航项状态
            updateActiveNavItem(pageName);
            
            // 加载新页面
            await loadPage(pageName);
            
            // 更新 URL
            history.pushState({ page: pageName }, '', `?page=${pageName}`);
        });
        
        // 添加涟漪效果
        item.addEventListener('mousedown', createRippleEffect);
    });
    
    // 处理浏览器后退/前进
    window.addEventListener('popstate', async (e) => {
        const pageName = e.state?.page || 'status';
        updateActiveNavItem(pageName);
        await loadPage(pageName);
    });
}

// 创建涟漪效果
function createRippleEffect(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 更新活动导航项
function updateActiveNavItem(pageName) {
    elements.navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === pageName) {
            item.classList.add('active');
            // 添加动画类
            item.classList.add('animate');
            setTimeout(() => {
                item.classList.remove('animate');
            }, 300);
        } else {
            item.classList.remove('active');
        }
    });
}

// 从 URL 获取当前页面
function getCurrentPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('page');
}

// 加载页面
async function loadPage(pageName) {
    if (appState.pageChanging) return;
    appState.pageChanging = true;
    
    try {
        // 1. 淡出页面标题和操作按钮
        elements.pageTitle.classList.add('changing');
        elements.pageActions.classList.add('changing');
        
        // 2. 等待短暂延迟以确保动画开始
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 3. 加载新页面模块
        const pageModule = await import(pageModules[pageName]);
        const newPageInstance = new pageModule.default();
        
        // 4. 准备新页面内容
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container page-enter';
        pageContainer.id = `page-${pageName}`;
        
        // 5. 渲染新页面内容
        await newPageInstance.render(pageContainer);
        
        // 6. 如果存在旧页面，准备淡出
        const oldPageContainer = elements.mainContent.querySelector('.page-container');
        if (oldPageContainer) {
            oldPageContainer.classList.add('page-exit');
        }
        
        // 7. 添加新页面到 DOM
        elements.mainContent.appendChild(pageContainer);
        
        // 8. 更新页面标题和操作按钮
        elements.pageTitle.textContent = await newPageInstance.getTitle();
        
        // 清空并添加新的页面操作按钮
        elements.pageActions.innerHTML = '';
        const actions = await newPageInstance.getActions();
        if (actions) {
            elements.pageActions.innerHTML = actions;
            // 为新添加的按钮绑定事件
            const actionButtons = elements.pageActions.querySelectorAll('button');
            actionButtons.forEach(button => {
                button.addEventListener('mousedown', createRippleEffect);
            });
        }
        
        // 9. 触发动画
        await new Promise(resolve => setTimeout(resolve, 50));
        pageContainer.classList.add('page-active');
        
        if (oldPageContainer) {
            oldPageContainer.classList.add('page-active');
            
            // 10. 等待动画完成后移除旧页面
            setTimeout(() => {
                oldPageContainer.remove();
            }, 300);
        }
        
        // 11. 淡入页面标题和操作按钮
        setTimeout(() => {
            elements.pageTitle.classList.remove('changing');
            elements.pageActions.classList.remove('changing');
        }, 150);
        
        // 12. 更新应用状态
        appState.currentPage = pageName;
        
        // 13. 如果页面有初始化方法，调用它
        if (newPageInstance.init) {
            await newPageInstance.init();
        }
        
        // 14. 保存页面实例以便后续使用
        if (appState.pageInstance && appState.pageInstance.destroy) {
            appState.pageInstance.destroy();
        }
        appState.pageInstance = newPageInstance;
        
    } catch (error) {
        console.error('加载页面失败:', error);
        elements.mainContent.innerHTML = `
            <div class="page-container">
                <div class="error-container">
                    <h2>页面加载失败</h2>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    } finally {
        appState.pageChanging = false;
    }
}

// 设置主题切换
function setupThemeToggle() {
    elements.themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme(e);
    });
    
    // 更新主题图标
    updateThemeIcon();
}

// 设置语言切换
function setupLanguageToggle() {
    elements.languageButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleLanguage();
    });
}

// 更新主题图标
function updateThemeIcon() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    elements.themeToggle.querySelector('.material-symbols-rounded').textContent = 
        isDarkTheme ? 'dark_mode' : 'light_mode';
}

// 切换主题
function toggleTheme(event) {
    if (appState.themeChanging) return;
    appState.themeChanging = true;
    
    // 创建涟漪效果
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    
    // 设置涟漪颜色
    const isDarkTheme = document.body.classList.contains('dark-theme');
    ripple.style.setProperty('--ripple-color', isDarkTheme ? '#FFFBFF' : '#1C1B1E');
    
    // 设置涟漪位置
    const x = event.clientX;
    const y = event.clientY;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // 添加到 DOM
    document.body.appendChild(ripple);
    
    // 触发动画
    setTimeout(() => {
        ripple.classList.add('active');
    }, 10);
    
    // 等待动画开始后切换主题
    setTimeout(() => {
        // 切换主题类
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        
        // 更新主题图标
        updateThemeIcon();
        
        // 保存主题设置
        const newTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        // 更新 meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1C1B1E' : '#FFFBFF');
        }
    }, 400);
    
    // 动画结束后移除涟漪元素
    setTimeout(() => {
        ripple.remove();
        appState.themeChanging = false;
    }, 1000);
}

// 切换语言
function toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'zh';
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    
    // 保存新语言设置
    localStorage.setItem('language', newLang);
    
    // 重新加载页面以应用新语言
    window.location.reload();
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
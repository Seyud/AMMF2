// 应用主控制器
class AppController {
    constructor() {
        this.menuButton = document.getElementById('menu-button');
        this.navDrawer = document.getElementById('nav-drawer');
        this.overlay = document.getElementById('overlay');
        this.navItems = document.querySelectorAll('.nav-item');
        this.pages = document.querySelectorAll('.page');
        this.currentPage = 'home';
        
        this.init();
    }
    
    init() {
        // 初始化导航抽屉
        this.initNavDrawer();
        
        // 初始化页面导航
        this.initPageNavigation();
        
        // 初始化页面加载动画
        this.initPageTransitions();
        
        // 检查URL参数
        this.checkUrlParams();
    }
    
    initNavDrawer() {
        // 菜单按钮点击事件
        this.menuButton.addEventListener('click', () => {
            this.toggleNavDrawer();
        });
        
        // 点击遮罩层关闭导航抽屉
        this.overlay.addEventListener('click', () => {
            this.closeNavDrawer();
        });
        
        // 导航项点击事件
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = item.getAttribute('data-page');
                if (targetPage) {
                    this.navigateTo(targetPage);
                    this.closeNavDrawer();
                }
            });
        });
    }
    
    toggleNavDrawer() {
        this.navDrawer.classList.toggle('open');
        this.overlay.classList.toggle('visible');
    }
    
    closeNavDrawer() {
        this.navDrawer.classList.remove('open');
        this.overlay.classList.remove('visible');
    }
    
    initPageNavigation() {
        // 获取所有页面链接
        const pageLinks = document.querySelectorAll('[data-page]');
        
        // 为每个链接添加点击事件
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetPage = link.getAttribute('data-page');
                if (targetPage) {
                    e.preventDefault();
                    this.navigateTo(targetPage);
                }
            });
        });
    }
    
    navigateTo(pageId) {
        // 如果是当前页面，不做任何操作
        if (pageId === this.currentPage) {
            return;
        }
        
        // 更新当前页面
        this.currentPage = pageId;
        
        // 更新URL
        history.pushState({ page: pageId }, '', `?page=${pageId}`);
        
        // 隐藏所有页面
        this.pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 更新导航项的活动状态
        this.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
        
        // 如果是在移动设备上，关闭导航抽屉
        if (window.innerWidth < 1024) {
            this.closeNavDrawer();
        }
    }
    
    initPageTransitions() {
        // 为页面添加过渡动画
        this.pages.forEach(page => {
            page.addEventListener('animationend', () => {
                if (page.classList.contains('page-exit')) {
                    page.classList.remove('page-exit');
                    page.classList.remove('active');
                }
            });
        });
    }
    
    checkUrlParams() {
        // 检查URL参数中是否有页面指定
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        
        if (pageParam) {
            // 检查页面是否存在
            const targetPage = document.getElementById(`${pageParam}-page`);
            if (targetPage) {
                this.navigateTo(pageParam);
            }
        }
    }
}

// 当DOM加载完成后初始化应用控制器
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    
    // 处理浏览器后退/前进按钮
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            window.app.navigateTo(event.state.page);
        } else {
            window.app.navigateTo('home');
        }
    });
});
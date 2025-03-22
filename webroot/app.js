// 应用主控制器
class AppController {
    constructor() {
        this.menuButton = document.getElementById('menu-button');
        this.navDrawer = document.getElementById('nav-drawer');
        this.overlay = document.getElementById('overlay');
        this.navItems = document.querySelectorAll('.nav-item');
        this.pages = document.querySelectorAll('.page');
        this.pageTitle = document.getElementById('page-title');
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
        
        // 遮罩层点击事件
        this.overlay.addEventListener('click', () => {
            this.closeNavDrawer();
        });
        
        // 窗口大小变化事件
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024) {
                // 在大屏幕上，始终显示导航抽屉
                this.navDrawer.classList.remove('open');
                this.overlay.classList.remove('visible');
                document.body.classList.remove('drawer-open');
            }
        });
    }
    
    toggleNavDrawer() {
        this.navDrawer.classList.toggle('open');
        this.overlay.classList.toggle('visible');
        document.body.classList.toggle('drawer-open');
    }
    
    closeNavDrawer() {
        this.navDrawer.classList.remove('open');
        this.overlay.classList.remove('visible');
        document.body.classList.remove('drawer-open');
    }
    
    initPageNavigation() {
        // 导航项点击事件
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                const pageId = href.substring(1); // 移除#前缀
                
                this.navigateTo(pageId);
                this.closeNavDrawer();
            });
        });
        
        // 监听浏览器历史记录变化
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigateTo(e.state.page, false);
            }
        });
    }
    
    navigateTo(pageId, pushState = true) {
        // 如果是当前页面，不做任何操作
        if (pageId === this.currentPage) {
            return;
        }
        
        // 更新当前页面
        this.currentPage = pageId;
        
        // 更新URL
        if (pushState) {
            history.pushState({ page: pageId }, '', `#${pageId}`);
        }
        
        // 隐藏所有页面
        this.pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // 更新页面标题
            const pageTitle = targetPage.querySelector('.page-header h2');
            if (pageTitle) {
                this.pageTitle.textContent = pageTitle.textContent;
            } else {
                this.pageTitle.textContent = 'AMMF';
            }
        }
        
        // 更新导航项的活动状态
        this.navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href && href.substring(1) === pageId) {
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
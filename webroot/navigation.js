// 导航系统
const navigationManager = {
    // 页面模块
    pageModules: {
        home: null,
        logs: null,
        settings: null
    },
    
    // 当前页面
    currentPage: 'home',
    
    // 导航项配置
    navItems: [
        {
            id: 'home',
            icon: 'home',
            label: 'HOME',
            defaultLabel: 'Home'
        },
        {
            id: 'logs',
            icon: 'article',
            label: 'LOGS',
            defaultLabel: 'Logs'
        },
        {
            id: 'settings',
            icon: 'settings',
            label: 'SETTINGS',
            defaultLabel: 'Settings'
        }
    ],
    
    // 初始化导航系统
    async init() {
        try {
            // 动态导入页面模块
            this.pageModules.home = window.statusManager;
            this.pageModules.settings = window.settingsManager;
            this.pageModules.logs = window.logsManager;
            
            // 渲染导航栏
            this.renderNavigation();
            
            // 渲染初始页面
            await this.navigateTo(this.currentPage);
            
            console.log('Navigation system initialized');
        } catch (error) {
            console.error('Error initializing navigation system:', error);
        }
    },
    
    // 渲染导航栏
    renderNavigation() {
        const navContainer = document.getElementById('nav-container');
        if (!navContainer) return;
        
        let navHTML = `
            <nav class="bottom-nav">
        `;
        
        for (const item of this.navItems) {
            const isActive = this.currentPage === item.id;
            navHTML += `
                <button class="nav-item ${isActive ? 'active' : ''}" data-page="${item.id}">
                    <i class="material-icons">${item.icon}</i>
                    <span>${languageManager.translate(item.label, item.defaultLabel)}</span>
                </button>
            `;
        }
        
        navHTML += `
            </nav>
        `;
        
        navContainer.innerHTML = navHTML;
        
        // 添加导航事件监听
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const pageId = e.currentTarget.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });
    },
    
    // 导航到指定页面
    async navigateTo(pageId) {
        if (!this.pageModules[pageId]) {
            console.error(`Page module not found: ${pageId}`);
            return;
        }
        
        // 更新当前页面
        this.currentPage = pageId;
        
        // 更新导航栏高亮
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 获取内容容器
        const contentContainer = document.getElementById('content-container');
        if (!contentContainer) return;
        
        // 添加过渡动画
        contentContainer.classList.add('page-transition-out');
        
        // 等待动画完成
        setTimeout(async () => {
            try {
                // 渲染页面内容
                const pageContent = await this.pageModules[pageId].render();
                contentContainer.innerHTML = pageContent;
                
                // 调用页面的afterRender方法（如果存在）
                if (typeof this.pageModules[pageId].afterRender === 'function') {
                    this.pageModules[pageId].afterRender();
                }
                
                // 添加进入动画
                contentContainer.classList.remove('page-transition-out');
                contentContainer.classList.add('page-transition-in');
                
                // 清除动画类
                setTimeout(() => {
                    contentContainer.classList.remove('page-transition-in');
                }, 300);
            } catch (error) {
                console.error(`Error rendering page ${pageId}:`, error);
                contentContainer.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">
                            <i class="material-icons">error</i>
                        </div>
                        <p>${languageManager.translate('PAGE_RENDER_ERROR', 'Error rendering page')}</p>
                    </div>
                `;
                contentContainer.classList.remove('page-transition-out');
            }
        }, 150);
    }
};

// 导出
window.navigationManager = navigationManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待其他模块加载完成后初始化导航
    setTimeout(() => {
        navigationManager.init();
    }, 100);
});
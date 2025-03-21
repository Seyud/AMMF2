// 导航控制
const navigation = {
    // 当前页面
    currentPage: 'home',
    
    // 当前配置文件
    currentConfigFile: 'config.sh',
    
    // 配置文件路径映射
    configFilePaths: {
        'config.sh': '/data/adb/modules/AMMF/module_settings/config.sh',
        'system.prop': '/data/adb/modules/AMMF/system.prop'
    },
    
    // 初始化导航
    init: function() {
        // 设置卡片点击事件
        document.getElementById('settings-card').addEventListener('click', () => {
            this.navigateTo('settings');
            this.loadConfigFile('config.sh');
            this.addButtonClickAnimation('settings-card');
        });
        
        // 系统属性卡片点击事件
        document.getElementById('system-prop-card').addEventListener('click', () => {
            this.navigateTo('settings');
            this.loadConfigFile('system.prop');
            this.addButtonClickAnimation('system-prop-card');
        });
        
        // 日志卡片点击事件
        document.getElementById('logs-card').addEventListener('click', () => {
            this.navigateTo('logs');
            this.addButtonClickAnimation('logs-card');
        });
        
        // 关于卡片点击事件
        document.getElementById('about-card').addEventListener('click', () => {
            // 暂时只显示提示信息
            showSnackbar(translations[state.language].aboutInfo || 'AMMF模块');
            this.addButtonClickAnimation('about-card');
        });
        
        // 返回按钮点击事件
        document.getElementById('back-to-home').addEventListener('click', () => {
            this.navigateTo('home');
            this.addButtonClickAnimation('back-to-home');
        });
        
        // 配置文件选择器变更事件
        document.getElementById('config-file-selector').addEventListener('change', (e) => {
            this.loadConfigFile(e.target.value);
        });
        
        // 保存按钮点击事件
        document.getElementById('save-button').addEventListener('click', () => {
            this.addButtonClickAnimation('save-button');
        });
        
        // 更新UI文本
        this.updateUIText();
        
        // 初始化时添加主页卡片动画
        this.animateHomeCards();
    },
    
    // 页面导航
    navigateTo: function(page) {
        // 如果已经在当前页面，不做任何操作
        if (this.currentPage === page) {
            return;
        }
        
        // 获取所有页面元素
        const pages = document.querySelectorAll('[id$="-page"]');
        
        // 先将所有页面隐藏
        pages.forEach(pageEl => {
            pageEl.style.display = 'none';
        });
        
        // 显示选定的页面
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            // 使用 requestAnimationFrame 确保平滑过渡
            requestAnimationFrame(() => {
                targetPage.style.display = 'block';
                
                // 重新触发动画
                targetPage.classList.remove('page-transition');
                void targetPage.offsetWidth; // 触发重排
                targetPage.classList.add('page-transition');
            });
        }
        
        // 更新当前页面
        this.currentPage = page;
        
        // 如果是日志页面，加载日志
        if (page === 'logs' && typeof logsManager !== 'undefined' && logsManager.loadLogs) {
            logsManager.loadLogs();
        }
    },
    
    // 加载配置文件
    loadConfigFile: function(filename) {
        // 更新当前配置文件
        this.currentConfigFile = filename;
        
        // 更新选择器值
        document.getElementById('config-file-selector').value = filename;
        
        // 显示加载指示器
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('settings-form').style.display = 'none';
        
        // 清空当前设置
        state.settings = {};
        
        // 根据文件类型加载不同的设置
        if (filename === 'config.sh') {
            // 加载模块设置
            loadSettings(this.configFilePaths[filename]);
        } else if (filename === 'system.prop') {
            // 加载系统属性
            loadSystemProp(this.configFilePaths[filename]);
        }
        
        // 更新标题
        const configName = filename.replace('.', '_');
        document.getElementById('title').textContent = translations[state.language][`${configName}_title`] || filename;
    },
    
    // 更新UI文本
    updateUIText: function() {
        // 首页文本
        document.getElementById('settings-title').textContent = translations[state.language].settings_title || '模块设置';
        document.getElementById('settings-description').textContent = translations[state.language].settings_description || '配置AMMF模块的各项参数';
        
        document.getElementById('system-prop-title').textContent = translations[state.language].system_prop_title || '系统属性';
        document.getElementById('system-prop-description').textContent = translations[state.language].system_prop_description || '编辑system.prop文件中的系统属性';
        
        document.getElementById('logs-title').textContent = translations[state.language].logs_title || '运行日志';
        document.getElementById('logs-description').textContent = translations[state.language].logs_description || '查看模块运行日志';
        
        document.getElementById('about-title').textContent = translations[state.language].about_title || '关于';
        document.getElementById('about-description').textContent = translations[state.language].about_description || '查看模块信息和版本';
        
        // 设置页面文本
        document.getElementById('back-text').textContent = translations[state.language].back || '返回';
        document.getElementById('file-selector-label').textContent = translations[state.language].config_file || '配置文件:';
        document.getElementById('loading-text').textContent = translations[state.language].loading || '加载设置中...';
        
        // 日志页面文本
        logsManager.updateUIText();
    },
    
    // 添加按钮点击动画
    addButtonClickAnimation: function(elementId) {
        const element = document.getElementById(elementId);
        element.classList.remove('button-click');
        void element.offsetWidth; // 触发重排以应用新的动画
        element.classList.add('button-click');
    },
    
    // 为主页卡片添加动画
    animateHomeCards: function() {
        const cards = document.querySelectorAll('.home-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.opacity = '1';
                card.classList.add('slide-in-up');
                // 移除动画类，以便下次可以重新应用
                setTimeout(() => {
                    card.classList.remove('slide-in-up');
                }, 500);
            }, index * 100); // 每张卡片延迟100ms
        });
    }
};
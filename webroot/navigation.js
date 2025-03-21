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
        // 绑定卡片点击事件
        this.bindCardEvents();
        
        // 绑定返回按钮事件
        this.bindBackButtons();
        
        // 配置文件选择器变更事件
        document.getElementById('config-file-selector').addEventListener('change', (e) => {
            this.loadConfigFile(e.target.value);
        });
        
        // 保存按钮点击事件
        document.getElementById('save-button').addEventListener('click', () => {
            this.addButtonClickAnimation('save-button');
            saveSettings();
        });
        
        // 更新UI文本
        this.updateUIText();
        
        // 添加首页卡片动画
        this.animateHomeCards();
    },
    
    // 导航到指定页面
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
        
        // 确保路径存在
        if (!this.configFilePaths[filename]) {
            console.error('Config file path not found for:', filename);
            showSnackbar('配置文件路径错误');
            document.getElementById('loading').style.display = 'none';
            return;
        }
        
        // 根据文件类型加载不同的设置
        if (filename === 'config.sh') {
            // 加载模块设置前先检查文件是否存在
            this.checkFileExists(this.configFilePaths[filename])
                .then(exists => {
                    if (exists) {
                        loadSettings(this.configFilePaths[filename]);
                    } else {
                        showSnackbar(translations[state.language].configFileNotFound || 'config.sh文件不存在');
                        document.getElementById('loading').style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error checking config.sh:', error);
                    showSnackbar('检查配置文件失败');
                    document.getElementById('loading').style.display = 'none';
                });
        } else if (filename === 'system.prop') {
            // 加载系统属性前先检查文件是否存在
            this.checkFileExists(this.configFilePaths[filename])
                .then(exists => {
                    if (exists) {
                        loadSystemProp(this.configFilePaths[filename]);
                    } else {
                        // 处理system.prop不存在的情况
                        showSnackbar(translations[state.language].systemPropNotFound || 'system.prop文件不存在');
                        // 创建一个空的表单，显示创建system.prop的提示
                        this.createEmptySystemPropForm();
                        document.getElementById('loading').style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('Error checking system.prop:', error);
                    showSnackbar('检查system.prop文件失败');
                    document.getElementById('loading').style.display = 'none';
                });
        }
        
        // 更新标题
        const configName = filename.replace('.', '_');
        document.getElementById('title').textContent = translations[state.language][`${configName}_title`] || filename;
    },
    
    // 检查文件是否存在
    checkFileExists: async function(filePath) {
        try {
            await execCommand(`ls ${filePath}`);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    // 创建空的system.prop表单
    createEmptySystemPropForm: function() {
        const settingsForm = document.getElementById('settings-form');
        settingsForm.innerHTML = '';
        
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-file-message';
        emptyMessage.innerHTML = `
            <div class="empty-file-icon">
                <span class="material-symbols-outlined">description</span>
            </div>
            <h3>${translations[state.language].systemPropNotFound || 'system.prop文件不存在'}</h3>
            <p>${translations[state.language].createSystemPropHint || '您可以创建一个新的system.prop文件来添加系统属性'}</p>
            <button id="create-system-prop" class="primary-button">
                <span class="material-symbols-outlined">add</span>
                ${translations[state.language].createSystemProp || '创建system.prop'}
            </button>
        `;
        
        settingsForm.appendChild(emptyMessage);
        settingsForm.style.display = 'block';
        
        // 添加创建system.prop的事件监听器
        document.getElementById('create-system-prop').addEventListener('click', () => {
            this.createSystemPropFile();
        });
    },
    
    // 创建system.prop文件
    createSystemPropFile: async function() {
        try {
            showSnackbar(translations[state.language].creatingSystemProp || '正在创建system.prop文件...');
            
            // 创建空的system.prop文件
            await execCommand('su -c "touch /data/adb/modules/AMMF/system.prop"');
            
            // 添加默认注释
            const defaultContent = '# AMMF系统属性配置文件\n# 在此处添加系统属性，格式为：属性名=属性值\n\n';
            await execCommand(`su -c "echo '${defaultContent}' > /data/adb/modules/AMMF/system.prop"`);
            
            // 重新加载system.prop
            loadSystemProp(this.configFilePaths['system.prop']);
            
            showSnackbar(translations[state.language].systemPropCreated || 'system.prop文件已创建');
        } catch (error) {
            console.error('创建system.prop文件失败:', error);
            showSnackbar(translations[state.language].createSystemPropFailed || '创建system.prop文件失败');
        }
    },
    
    // 添加按钮点击动画
    addButtonClickAnimation: function(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // 移除可能存在的动画类
        element.classList.remove('button-click');
        
        // 触发重排
        void element.offsetWidth;
        
        // 添加动画类
        element.classList.add('button-click');
        
        // 监听动画结束事件
        const handleAnimationEnd = () => {
            element.classList.remove('button-click');
            element.removeEventListener('animationend', handleAnimationEnd);
        };
        
        element.addEventListener('animationend', handleAnimationEnd);
        
        // 备份超时移除
        setTimeout(() => {
            element.classList.remove('button-click');
        }, 300);
    },
    
    // 更新UI文本
    updateUIText: function() {
        // 首页文本
        const backTextSettings = document.getElementById('back-text-settings');
        if (backTextSettings) {
            backTextSettings.textContent = translations[state.language].back || '返回';
        }
        
        const backTextLogs = document.getElementById('back-text-logs');
        if (backTextLogs) {
            backTextLogs.textContent = translations[state.language].back || '返回';
        }
        
        // 更新配置文件选择器标签
        const fileSelectorLabel = document.getElementById('file-selector-label');
        if (fileSelectorLabel) {
            fileSelectorLabel.textContent = translations[state.language].config_file || '配置文件:';
        }
        
        // 更新主页卡片文本
        const settingsTitle = document.getElementById('settings-title');
        if (settingsTitle) {
            settingsTitle.textContent = translations[state.language].settings_title || '模块设置';
        }
        
        const settingsDescription = document.getElementById('settings-description');
        if (settingsDescription) {
            settingsDescription.textContent = translations[state.language].settings_description || '配置AMMF模块的各项参数';
        }
        
        const systemPropTitle = document.getElementById('system-prop-title');
        if (systemPropTitle) {
            systemPropTitle.textContent = translations[state.language].system_prop_title || '系统属性';
        }
        
        const systemPropDescription = document.getElementById('system-prop-description');
        if (systemPropDescription) {
            systemPropDescription.textContent = translations[state.language].system_prop_description || '编辑system.prop文件中的系统属性';
        }
        
        const logsTitle = document.getElementById('logs-title');
        if (logsTitle) {
            logsTitle.textContent = translations[state.language].logs_title || '运行日志';
        }
        
        const logsDescription = document.getElementById('logs-description');
        if (logsDescription) {
            logsDescription.textContent = translations[state.language].logs_description || '查看模块运行日志';
        }
        
        const aboutTitle = document.getElementById('about-title');
        if (aboutTitle) {
            aboutTitle.textContent = translations[state.language].about_title || '关于';
        }
        
        const aboutDescription = document.getElementById('about-description');
        if (aboutDescription) {
            aboutDescription.textContent = translations[state.language].about_description || '查看模块信息和版本';
        }
    },
    
    // 首页卡片动画
    animateHomeCards: function() {
        const cards = document.querySelectorAll('.home-card');
        cards.forEach((card, index) => {
            // 重置卡片状态
            card.style.opacity = '0';
            card.classList.remove('slide-in-up');
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.classList.add('slide-in-up');
                
                // 使用动画结束事件移除类
                const handleAnimationEnd = () => {
                    card.classList.remove('slide-in-up');
                    card.removeEventListener('animationend', handleAnimationEnd);
                };
                
                card.addEventListener('animationend', handleAnimationEnd);
                
                // 备份超时移除
                setTimeout(() => {
                    card.classList.remove('slide-in-up');
                }, 500);
            }, index * 100);
        });
    }
};

// 显示指定页面
function showPage(pageId) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('main[id$="-page"]');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    
    // 显示指定页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
}

// 导出navigation对象供其他模块使用
window.navigation = navigation;

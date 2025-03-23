/**
 * AMMF WebUI 国际化模块
 * 提供多语言支持功能
 */

const I18n = {
    // 当前语言
    currentLang: 'zh',
    
    // 支持的语言列表
    supportedLangs: ['zh', 'en'],
    
    // 语言数据
    translations: {
        zh: {},
        en: {}
    },
    
    // 初始化
    async init() {
        try {
            console.log('开始初始化语言模块...');
            
            // 先加载默认翻译，确保基本功能可用
            this.loadDefaultTranslations();
            
            // 应用默认语言翻译
            this.applyTranslations();
            
            // 读取语言文件
            await this.loadLanguageFile();
            
            // 确定初始语言
            await this.determineInitialLanguage();
            
            // 再次应用语言（使用确定的语言）
            this.applyTranslations();
            
            // 初始化语言选择器
            this.initLanguageSelector();
            
            // 添加DOM变化监听，确保动态加载的元素也能被翻译
            this.observeDOMChanges();
            
            console.log(`语言模块初始化完成: ${this.currentLang}`);
            return true;
        } catch (error) {
            console.error('初始化语言模块失败:', error);
            // 使用默认语言
            this.currentLang = 'zh';
            return false;
        }
    },
    
    // 加载语言文件
    async loadLanguageFile() {
        try {
            console.log('尝试加载语言文件...');
            const languagesContent = await Core.readFile(`${Core.MODULE_PATH}files/languages.sh`);
            if (languagesContent) {
                this.parseLanguagesFile(languagesContent);
                console.log('成功加载语言文件');
            } else {
                console.log('语言文件不存在，使用内置默认翻译');
            }
        } catch (error) {
            console.error('加载语言文件失败:', error);
        }
    },
    
    // 解析语言文件
    parseLanguagesFile(content) {
        if (!content) return;
        
        console.log('开始解析语言文件...');
        
        // 提取语言块
        const langBlocks = content.match(/lang_([a-z]{2})\(\)\s*\{([\s\S]*?)\}/g);
        
        if (!langBlocks || langBlocks.length === 0) {
            console.warn('未找到有效的语言块');
            return;
        }
        
        // 清空现有支持的语言列表
        this.supportedLangs = [];
        
        // 解析每个语言块
        langBlocks.forEach(block => {
            const langMatch = block.match(/lang_([a-z]{2})\(\)/);
            if (!langMatch) return;
            
            const lang = langMatch[1];
            this.supportedLangs.push(lang);
            
            // 初始化语言对象
            if (!this.translations[lang]) {
                this.translations[lang] = {};
            }
            
            // 提取键值对
            const lines = block.split('\n');
            for (let line of lines) {
                line = line.trim();
                
                // 跳过空行、注释和函数定义行
                if (!line || line.startsWith('#') || line.includes('lang_') || line === '{' || line === '}') {
                    continue;
                }
                
                // 解析键值对
                const match = line.match(/([A-Za-z0-9_]+)="(.+)"/);
                if (match) {
                    const key = match[1];
                    const value = match[2];
                    this.translations[lang][key] = value;
                    
                    // 特殊处理 WebUI 前缀的键
                    if (key.startsWith('WEBUI_')) {
                        const webUIKey = key.replace('WEBUI_', '');
                        this.translations[lang][webUIKey] = value;
                    }
                }
            }
        });
        
        // 确保至少有中英文
        if (!this.supportedLangs.includes('zh')) this.supportedLangs.push('zh');
        if (!this.supportedLangs.includes('en')) this.supportedLangs.push('en');
        
        // 去重
        this.supportedLangs = [...new Set(this.supportedLangs)];
        
        console.log(`解析完成，支持的语言: ${this.supportedLangs.join(', ')}`);
    },
    
    // 加载默认翻译
    loadDefaultTranslations() {
        // 中文翻译
        this.translations.zh = {
            // 导航
            NAV_STATUS: '状态',
            NAV_LOGS: '日志',
            NAV_SETTINGS: '设置',
            NAV_ABOUT: '关于',
            
            // 通用
            LOADING: '加载中...',
            REFRESH: '刷新',
            SAVE: '保存',
            CANCEL: '取消',
            CONFIRM: '确认',
            SUCCESS: '成功',
            ERROR: '错误',
            WARNING: '警告',
            
            // 状态页
            MODULE_STATUS: '模块状态',
            RUNNING: '运行中',
            STOPPED: '已停止',
            UNKNOWN: '未知',
            START_SERVICE: '启动服务',
            STOP_SERVICE: '停止服务',
            RESTART_SERVICE: '重启服务',
            STATUS_REFRESHED: '状态已刷新',
            
            // 日志页
            SELECT_LOG_FILE: '选择日志文件',
            SERVICE_LOG: '服务日志',
            SERVICE_LOG_OLD: '服务日志(旧)',
            REFRESH_LOGS: '刷新日志',
            AUTO_REFRESH: '自动刷新',
            CLEAR_LOGS: '清除日志',
            EXPORT_LOGS: '导出日志',
            NO_LOGS: '没有可用的日志',
            CONFIRM_CLEAR_LOGS: '确定要清除此日志文件吗？',
            
            // 设置页
            MODULE_SETTINGS: '模块设置',
            REFRESH_SETTINGS: '刷新设置',
            SAVE_SETTINGS: '保存设置',
            GENERAL_SETTINGS: '常规设置',
            NO_SETTINGS: '没有可用的设置',
            SETTINGS_SAVED: '设置已保存',
            SETTINGS_REFRESHED: '设置已刷新',
            SETTINGS_REFRESH_ERROR: '刷新设置时出错',
            NO_CONFIG_DATA: '没有可保存的配置数据',
            CONFIG_FILE_NOT_FOUND: '找不到配置文件',
            CONFIG_READ_ERROR: '读取配置文件失败',
            
            // 语言
            SELECT_LANGUAGE: '选择语言',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            
            // 关于页
            ABOUT_MODULE: '关于模块',
            ABOUT_WEBUI: '关于 WebUI',
            
            // 加载超时
            LOADING_TIMEOUT: '加载时间过长，部分功能可能不可用'
        };
        
        // 英文翻译
        this.translations.en = {
            // Navigation
            NAV_STATUS: 'Status',
            NAV_LOGS: 'Logs',
            NAV_SETTINGS: 'Settings',
            NAV_ABOUT: 'About',
            
            // Common
            LOADING: 'Loading...',
            REFRESH: 'Refresh',
            SAVE: 'Save',
            CANCEL: 'Cancel',
            CONFIRM: 'Confirm',
            SUCCESS: 'Success',
            ERROR: 'Error',
            WARNING: 'Warning',
            
            // Status page
            MODULE_STATUS: 'Module Status',
            RUNNING: 'Running',
            STOPPED: 'Stopped',
            UNKNOWN: 'Unknown',
            START_SERVICE: 'Start Service',
            STOP_SERVICE: 'Stop Service',
            RESTART_SERVICE: 'Restart Service',
            STATUS_REFRESHED: 'Status refreshed',
            
            // Logs page
            SELECT_LOG_FILE: 'Select Log File',
            SERVICE_LOG: 'Service Log',
            SERVICE_LOG_OLD: 'Service Log (Old)',
            REFRESH_LOGS: 'Refresh Logs',
            AUTO_REFRESH: 'Auto Refresh',
            CLEAR_LOGS: 'Clear Logs',
            EXPORT_LOGS: 'Export Logs',
            NO_LOGS: 'No logs available',
            CONFIRM_CLEAR_LOGS: 'Are you sure you want to clear this log file?',
            
            // Settings page
            MODULE_SETTINGS: 'Module Settings',
            REFRESH_SETTINGS: 'Refresh Settings',
            SAVE_SETTINGS: 'Save Settings',
            GENERAL_SETTINGS: 'General Settings',
            NO_SETTINGS: 'No settings available',
            SETTINGS_SAVED: 'Settings saved',
            SETTINGS_REFRESHED: 'Settings refreshed',
            SETTINGS_REFRESH_ERROR: 'Error refreshing settings',
            NO_CONFIG_DATA: 'No configuration data to save',
            CONFIG_FILE_NOT_FOUND: 'Configuration file not found',
            CONFIG_READ_ERROR: 'Failed to read configuration file',
            
            // Language
            SELECT_LANGUAGE: 'Select Language',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            
            // About page
            ABOUT_MODULE: 'About Module',
            ABOUT_WEBUI: 'About WebUI',
            
            // Loading timeout
            LOADING_TIMEOUT: 'Loading is taking longer than expected, some features may not be available'
        };
        
        console.log('默认翻译已加载');
    },
    
    // 确定初始语言
    async determineInitialLanguage() {
        try {
            console.log('确定初始语言...');
            
            // 优先使用本地存储中的语言设置
            const savedLang = localStorage.getItem('currentLanguage');
            if (savedLang && this.supportedLangs.includes(savedLang)) {
                this.currentLang = savedLang;
                console.log(`使用本地存储的语言设置: ${this.currentLang}`);
                return;
            }
            
            // 其次使用配置文件中的语言设置
            const config = await Core.getConfig();
            if (config && config.print_languages && this.supportedLangs.includes(config.print_languages)) {
                this.currentLang = config.print_languages;
                console.log(`从配置中读取语言设置: ${this.currentLang}`);
                
                // 保存到本地存储
                localStorage.setItem('currentLanguage', this.currentLang);
                return;
            }
            
            // 再次使用浏览器语言
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLangs.includes(browserLang)) {
                this.currentLang = browserLang;
                console.log(`使用浏览器语言: ${this.currentLang}`);
                
                // 保存到本地存储
                localStorage.setItem('currentLanguage', this.currentLang);
                
                // 更新配置文件
                await this.updateConfigLanguage(browserLang);
                return;
            }
            
            // 默认使用中文
            this.currentLang = 'zh';
            console.log(`使用默认语言: ${this.currentLang}`);
            
            // 保存到本地存储
            localStorage.setItem('currentLanguage', this.currentLang);
            
            // 更新配置文件
            await this.updateConfigLanguage('zh');
        } catch (error) {
            console.error('确定初始语言失败:', error);
            this.currentLang = 'zh'; // 默认中文
            localStorage.setItem('currentLanguage', 'zh');
        }
    },
    
    // 更新配置文件中的语言设置
    async updateConfigLanguage(lang) {
        try {
            console.log(`尝试更新配置文件语言为: ${lang}`);
            const config = await Core.getConfig();
            if (config) {
                config.print_languages = lang;
                
                // 更新配置文件
                const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
                const originalContent = await Core.readFile(configPath);
                const newContent = Core.generateConfigContent(config, originalContent);
                
                await Core.writeFile(configPath, newContent);
                console.log(`配置文件语言已更新为: ${lang}`);
            }
        } catch (error) {
            console.error('更新配置文件语言设置失败:', error);
        }
    },
    
    // 设置语言
    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error(`不支持的语言: ${lang}`);
            return false;
        }
        
        console.log(`设置语言为: ${lang}`);
        this.currentLang = lang;
        
        // 保存到本地存储
        localStorage.setItem('currentLanguage', lang);
        
        // 更新配置文件
        await this.updateConfigLanguage(lang);
        
        // 应用翻译
        this.applyTranslations();
        
        // 更新语言选择器
        this.updateLanguageSelector();
        
        return true;
    },
    
    // 获取翻译
    translate(key, defaultText = '') {
        // 如果没有提供键，返回默认文本或空字符串
        if (!key) return defaultText || '';
        
        // 尝试从当前语言获取翻译
        if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
            return this.translations[this.currentLang][key];
        }
        
        // 如果当前语言没有该翻译，尝试从英文获取
        if (this.translations.en && this.translations.en[key]) {
            return this.translations.en[key];
        }
        
        // 如果英文也没有，返回键名或默认文本
        return defaultText || key;
    },
    
    // 应用翻译到页面
    applyTranslations() {
        // 使用性能更好的选择器
        const container = document.querySelector('.page-container.active') || document;
        const elements = container.querySelectorAll('[data-i18n]');
        
        // 使用requestAnimationFrame优化DOM操作
        requestAnimationFrame(() => {
            // 批量处理DOM更新
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const key = el.getAttribute('data-i18n');
                const translation = this.translate(key);
                
                if (translation) {
                    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
                        if (el.placeholder !== translation) {
                            el.placeholder = translation;
                        }
                    } else {
                        if (el.textContent !== translation) {
                            el.textContent = translation;
                        }
                    }
                }
            }
            
            // 更新语言按钮标题
            const langButton = document.getElementById('language-button');
            if (langButton) {
                const displayName = this.getLanguageDisplayName(this.currentLang);
                if (langButton.getAttribute('title') !== displayName) {
                    langButton.setAttribute('title', displayName);
                }
            }
        });
    },
    
    // 获取语言显示名称
    getLanguageDisplayName(lang) {
        switch (lang) {
            case 'zh': return this.translate('LANGUAGE_CHINESE', '中文');
            case 'en': return this.translate('LANGUAGE_ENGLISH', 'English');
            default: return lang.toUpperCase();
        }
    },
    
    // 初始化语言选择器
    initLanguageSelector() {
        console.log('初始化语言选择器...');
        
        // 获取DOM元素
        const languageButton = document.getElementById('language-button');
        const languageSelector = document.getElementById('language-selector');
        const languageOptions = document.getElementById('language-options');
        const cancelButton = document.getElementById('cancel-language');
        
        if (!languageButton || !languageSelector || !languageOptions) {
            console.error('找不到语言选择器必要的DOM元素');
            return;
        }
        
        // 清空并重新生成语言选项
        this.updateLanguageSelector();
        
        // 添加语言按钮点击事件
        languageButton.addEventListener('click', (e) => {
            e.stopPropagation();
            languageSelector.classList.add('show');
        });
        
        // 添加取消按钮点击事件
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                languageSelector.classList.remove('show');
            });
        }
        
        // 点击外部关闭选择器
        document.addEventListener('click', (e) => {
            if (languageSelector.classList.contains('show') && 
                !languageSelector.contains(e.target) && 
                e.target !== languageButton) {
                languageSelector.classList.remove('show');
            }
        });
    },
    
    // 更新语言选择器
    updateLanguageSelector() {
        console.log('更新语言选择器...');
        
        const languageOptions = document.getElementById('language-options');
        if (!languageOptions) return;
        
        // 清空现有选项
        languageOptions.innerHTML = '';
        
        // 添加语言选项
        this.supportedLangs.forEach(lang => {
            const option = document.createElement('div');
            option.className = `language-option ${lang === this.currentLang ? 'active' : ''}`;
            option.setAttribute('data-lang', lang);
            option.textContent = this.getLanguageDisplayName(lang);
            
            option.addEventListener('click', async () => {
                if (lang !== this.currentLang) {
                    await this.setLanguage(lang);
                }
                document.getElementById('language-selector')?.classList.remove('show');
            });
            
            languageOptions.appendChild(option);
        });
    },
    
    // 观察DOM变化，自动翻译新添加的元素
    observeDOMChanges() {
        console.log('设置DOM变化监听...');
        
        // 创建MutationObserver实例
        const observer = new MutationObserver((mutations) => {
            let needsTranslation = false;
            
            // 检查是否有新增的需要翻译的元素
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查元素本身是否需要翻译
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                needsTranslation = true;
                            }
                            
                            // 检查子元素是否需要翻译
                            const i18nElements = node.querySelectorAll('[data-i18n]');
                            if (i18nElements.length > 0) {
                                needsTranslation = true;
                            }
                        }
                    });
                }
            });
            
            // 如果有需要翻译的元素，应用翻译
            if (needsTranslation) {
                this.applyTranslations();
            }
        });
        
        // 配置观察选项
        const config = { 
            childList: true,    // 观察子节点的添加或删除
            subtree: true       // 观察所有后代节点
        };
        
        // 开始观察
        observer.observe(document.body, config);
    }
};
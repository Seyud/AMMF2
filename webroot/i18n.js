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
            // 读取语言文件
            await this.loadLanguageFile();
            
            // 确定初始语言
            await this.determineInitialLanguage();
            
            // 应用语言
            this.applyTranslations();
            
            // 初始化语言选择器
            this.initLanguageSelector();
            
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
            const languagesContent = await Core.readFile(`${Core.MODULE_PATH}files/languages.sh`);
            if (languagesContent) {
                this.parseLanguagesFile(languagesContent);
            } else {
                // 使用内置默认翻译
                this.loadDefaultTranslations();
            }
        } catch (error) {
            console.error('加载语言文件失败:', error);
            // 使用内置默认翻译
            this.loadDefaultTranslations();
        }
    },
    
    // 解析语言文件
    parseLanguagesFile(content) {
        if (!content) return;
        
        const lines = content.split('\n');
        let currentLang = null;
        
        for (let line of lines) {
            line = line.trim();
            
            // 跳过空行和注释
            if (!line || line.startsWith('#')) continue;
            
            // 检查语言定义行
            if (line.startsWith('LANG_')) {
                const langMatch = line.match(/^LANG_([A-Za-z]+)=/);
                if (langMatch) {
                    currentLang = langMatch[1].toLowerCase();
                    if (!this.translations[currentLang]) {
                        this.translations[currentLang] = {};
                        this.supportedLangs.push(currentLang);
                    }
                }
                continue;
            }
            
            // 解析翻译键值对
            if (currentLang) {
                const match = line.match(/^([A-Za-z0-9_]+)="(.+)"$/);
                if (match) {
                    const key = match[1];
                    const value = match[2];
                    this.translations[currentLang][key] = value;
                }
            }
        }
        
        // 确保至少有中英文
        if (!this.supportedLangs.includes('zh')) this.supportedLangs.push('zh');
        if (!this.supportedLangs.includes('en')) this.supportedLangs.push('en');
        
        // 去重
        this.supportedLangs = [...new Set(this.supportedLangs)];
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
            
            // 语言
            SELECT_LANGUAGE: '选择语言',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English'
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
            
            // Language
            SELECT_LANGUAGE: 'Select Language',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English'
        };
    },
    
    // 确定初始语言
    async determineInitialLanguage() {
        try {
            // 优先使用配置文件中的语言设置
            const config = await Core.getConfig();
            if (config && config.print_languages && this.supportedLangs.includes(config.print_languages)) {
                this.currentLang = config.print_languages;
                console.log(`从配置中读取语言设置: ${this.currentLang}`);
                return;
            }
            
            // 其次使用浏览器语言
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLangs.includes(browserLang)) {
                this.currentLang = browserLang;
                console.log(`使用浏览器语言: ${this.currentLang}`);
                
                // 更新配置文件
                await this.updateConfigLanguage(browserLang);
                return;
            }
            
            // 默认使用中文
            this.currentLang = 'zh';
            console.log(`使用默认语言: ${this.currentLang}`);
            
            // 更新配置文件
            await this.updateConfigLanguage('zh');
        } catch (error) {
            console.error('确定初始语言失败:', error);
            this.currentLang = 'zh'; // 默认中文
        }
    },
    
    // 更新配置文件中的语言设置
    async updateConfigLanguage(lang) {
        try {
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
    
    // 应用翻译到页面
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translate(key);
            if (translation) {
                if (el.tagName === 'INPUT' && el.type === 'placeholder') {
                    el.placeholder = translation;
                } else {
                    el.textContent = translation;
                }
            }
        });
        
        // 更新语言按钮标题
        const langButton = document.getElementById('language-button');
        if (langButton) {
            langButton.setAttribute('title', this.getLanguageDisplayName(this.currentLang));
        }
    },
    
    // 初始化语言选择器
    initLanguageSelector() {
        const languageButton = document.getElementById('language-button');
        const languageSelector = document.getElementById('language-selector');
        const languageOptions = document.getElementById('language-options');
        const cancelButton = document.getElementById('cancel-language');
        
        if (languageButton && languageSelector && languageOptions) {
            // 生成语言选项
            languageOptions.innerHTML = '';
            this.supportedLangs.forEach(lang => {
                const option = document.createElement('div');
                option.className = `language-option ${lang === this.currentLang ? 'active' : ''}`;
                option.setAttribute('data-lang', lang);
                option.textContent = this.getLanguageDisplayName(lang);
                
                option.addEventListener('click', () => {
                    this.setLanguage(lang);
                    languageSelector.classList.remove('show');
                });
                
                languageOptions.appendChild(option);
            });
            
            // 语言按钮点击事件
            languageButton.addEventListener('click', () => {
                languageSelector.classList.add('show');
            });
            
            // 取消按钮点击事件
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    languageSelector.classList.remove('show');
                });
            }
            
            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (languageSelector.classList.contains('show') && 
                    !languageSelector.contains(e.target) && 
                    e.target !== languageButton) {
                    languageSelector.classList.remove('show');
                }
            });
        }
    },
    
    // 设置语言
    async setLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error(`不支持的语言: ${lang}`);
            return false;
        }
        
        try {
            this.currentLang = lang;
            
            // 更新配置文件
            await this.updateConfigLanguage(lang);
            
            // 应用翻译
            this.applyTranslations();
            
            // 触发语言变更事件
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
            
            return true;
        } catch (error) {
            console.error('设置语言失败:', error);
            return false;
        }
    },
    
    // 获取翻译
    translate(key, fallback = '') {
        // 优先使用当前语言
        if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
            return this.translations[this.currentLang][key];
        }
        
        // 回退到英文
        if (this.translations.en && this.translations.en[key]) {
            return this.translations.en[key];
        }
        
        // 回退到中文
        if (this.translations.zh && this.translations.zh[key]) {
            return this.translations.zh[key];
        }
        
        // 使用提供的回退值或键名
        return fallback || key;
    },
    
    // 获取语言显示名称
    getLanguageDisplayName(lang) {
        switch (lang) {
            case 'zh': return '中文';
            case 'en': return 'English';
            default: return lang;
        }
    }
};

// 导出国际化模块
window.I18n = I18n;
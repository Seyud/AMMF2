// 国际化支持
class I18nManager {
    constructor() {
        this.currentLanguage = 'zh'; // 默认语言
        this.languages = {}; // 存储所有语言数据
        this.availableLanguages = []; // 可用语言列表
        this.languageButton = document.getElementById('language-button');
        this.languageDialog = document.getElementById('language-dialog');
        this.languageList = document.getElementById('language-list');
        
        this.init();
    }
    
    async init() {
        // 初始化语言对话框
        this.initLanguageDialog();
        
        // 获取系统默认语言
        await this.detectSystemLanguage();
        
        // 加载语言文件
        await this.loadLanguages();
        
        // 应用当前语言
        this.applyLanguage(this.currentLanguage);
    }
    
    initLanguageDialog() {
        // 语言按钮点击事件
        this.languageButton.addEventListener('click', () => {
            this.openLanguageDialog();
        });
        
        // 关闭对话框按钮
        const closeButtons = this.languageDialog.querySelectorAll('.dialog-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeLanguageDialog();
            });
        });
        
        // 点击遮罩层关闭对话框
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeLanguageDialog();
        });
    }
    
    openLanguageDialog() {
        this.languageDialog.classList.add('open');
        document.getElementById('overlay').classList.add('visible');
    }
    
    closeLanguageDialog() {
        this.languageDialog.classList.remove('open');
        document.getElementById('overlay').classList.remove('visible');
    }
    
    async detectSystemLanguage() {
        try {
            // 获取系统语言设置
            const command = 'getprop persist.sys.locale || getprop ro.product.locale || echo "zh-CN"';
            const locale = await execCommand(command);
            
            // 提取语言代码
            const langCode = locale.trim().split('-')[0].toLowerCase();
            
            // 检查是否是支持的语言
            if (['en', 'zh', 'jp', 'ru', 'fr'].includes(langCode)) {
                this.currentLanguage = langCode;
            }
            
            console.log('检测到系统语言:', this.currentLanguage);
        } catch (error) {
            console.error('获取系统语言失败:', error);
        }
    }
    
    async loadLanguages() {
        try {
            // 读取languages.sh文件
            const command = 'cat /data/adb/modules/AMMF/files/languages.sh';
            const content = await execCommand(command);
            
            // 解析语言函数
            this.parseLanguageFile(content);
            
            // 创建语言选择列表
            this.createLanguageList();
        } catch (error) {
            console.error('加载语言文件失败:', error);
            // 加载失败时使用内置的默认语言
            this.loadDefaultLanguages();
        }
    }
    
    parseLanguageFile(content) {
        // 正则表达式匹配语言函数
        const langFuncRegex = /lang_(\w+)\(\)\s*\{([\s\S]*?)(?=lang_\w+\(\)|$)/g;
        let match;
        
        while ((match = langFuncRegex.exec(content)) !== null) {
            const langCode = match[1];
            const langContent = match[2];
            
            // 添加到可用语言列表
            this.availableLanguages.push(langCode);
            
            // 解析语言内容
            const langData = {};
            const lineRegex = /(\w+)="([^"]*)"/g;
            let lineMatch;
            
            while ((lineMatch = lineRegex.exec(langContent)) !== null) {
                const key = lineMatch[1];
                const value = lineMatch[2];
                langData[key] = value;
            }
            
            // 存储语言数据
            this.languages[langCode] = langData;
        }
        
        // 添加WebUI特定的翻译
        this.addWebUITranslations();
        
        console.log('已加载语言:', this.availableLanguages);
    }
    
    addWebUITranslations() {
        // 英文
        if (this.languages.en) {
            Object.assign(this.languages.en, {
                WEBUI_SETTINGS_TITLE: 'Settings',
                WEBUI_SYSTEM_PROP_TITLE: 'System Properties',
                WEBUI_LOGS_TITLE: 'Logs',
                WEBUI_ABOUT_TITLE: 'About',
                WEBUI_STATUS_TITLE: 'Module Status',
                WEBUI_REFRESH_STATUS: 'Refresh',
                WEBUI_STATUS_LABEL: 'Status:',
                WEBUI_UPTIME_LABEL: 'Uptime:',
                WEBUI_RESTART_MODULE: 'Restart Module',
                WEBUI_SETTINGS_DESCRIPTION: 'Configure AMMF module parameters',
                WEBUI_SYSTEM_PROP_DESCRIPTION: 'Edit system properties in system.prop',
                WEBUI_LOGS_DESCRIPTION: 'View module logs',
                WEBUI_ABOUT_DESCRIPTION: 'View module information and version',
                WEBUI_CONFIG_SH_TITLE: 'Module Config',
                WEBUI_SETTINGS_SH_TITLE: 'Module Settings',
                WEBUI_LOADING: 'Loading...',
                WEBUI_SAVE: 'Save',
                WEBUI_SYSTEM_PROP_NOT_FOUND: 'system.prop file not found',
                WEBUI_CREATE_SYSTEM_PROP_HINT: 'You can create a new system.prop file to add system properties',
                WEBUI_CREATE_SYSTEM_PROP: 'Create system.prop',
                WEBUI_NO_PROPERTIES: 'No system properties',
                WEBUI_ADD_PROPERTY_HINT: 'Click the "Add Property" button below to add a new system property',
                WEBUI_ADD_PROPERTY: 'Add Property',
                WEBUI_FILTER_LOGS: 'Filter logs',
                WEBUI_REFRESH_LOGS: 'Refresh',
                WEBUI_CLEAR_LOGS: 'Clear',
                WEBUI_NO_LOGS: 'No logs available',
                WEBUI_ABOUT_INFO: 'AMMF Module - A Magisk/KernelSU Module Framework',
                WEBUI_LANGUAGE_TITLE: 'Available Languages',
                WEBUI_SETTINGS_SAVED: 'Settings saved successfully',
                WEBUI_SETTINGS_SAVE_FAILED: 'Failed to save settings',
                WEBUI_CONFIRM_RESTART: 'Are you sure you want to restart the module?',
                WEBUI_CONFIRM_CLEAR_LOGS: 'Are you sure you want to clear all logs?',
                WEBUI_YES: 'Yes',
                WEBUI_NO: 'No',
                WEBUI_CANCEL: 'Cancel',
                WEBUI_OK: 'OK',
                WEBUI_CONFIRM: 'Confirm',
                WEBUI_MODULE_RESTARTED: 'Module restarted successfully',
                WEBUI_MODULE_RESTART_FAILED: 'Failed to restart module',
                WEBUI_LOGS_CLEARED: 'Logs cleared successfully',
                WEBUI_LOGS_CLEAR_FAILED: 'Failed to clear logs',
                WEBUI_SYSTEM_PROP_SAVED: 'System properties saved successfully',
                WEBUI_SYSTEM_PROP_SAVE_FAILED: 'Failed to save system properties',
                WEBUI_SYSTEM_PROP_CREATED: 'system.prop file created successfully'
            });
        }
        
        // 中文
        if (this.languages.zh) {
            Object.assign(this.languages.zh, {
                WEBUI_SETTINGS_TITLE: '设置',
                WEBUI_SYSTEM_PROP_TITLE: '系统属性',
                WEBUI_LOGS_TITLE: '日志',
                WEBUI_ABOUT_TITLE: '关于',
                WEBUI_STATUS_TITLE: '模块状态',
                WEBUI_REFRESH_STATUS: '刷新',
                WEBUI_STATUS_LABEL: '当前状态:',
                WEBUI_UPTIME_LABEL: '运行时间:',
                WEBUI_RESTART_MODULE: '重启模块',
                WEBUI_SETTINGS_DESCRIPTION: '配置AMMF模块的各项参数',
                WEBUI_SYSTEM_PROP_DESCRIPTION: '编辑system.prop文件中的系统属性',
                WEBUI_LOGS_DESCRIPTION: '查看模块运行日志',
                WEBUI_ABOUT_DESCRIPTION: '查看模块信息和版本',
                WEBUI_CONFIG_SH_TITLE: '模块配置',
                WEBUI_SETTINGS_SH_TITLE: '模块设置',
                WEBUI_LOADING: '加载中...',
                WEBUI_SAVE: '保存',
                WEBUI_SYSTEM_PROP_NOT_FOUND: 'system.prop文件不存在',
                WEBUI_CREATE_SYSTEM_PROP_HINT: '您可以创建一个新的system.prop文件来添加系统属性',
                WEBUI_CREATE_SYSTEM_PROP: '创建system.prop',
                WEBUI_NO_PROPERTIES: '暂无系统属性',
                WEBUI_ADD_PROPERTY_HINT: '点击下方的"添加属性"按钮添加新的系统属性',
                WEBUI_ADD_PROPERTY: '添加属性',
                WEBUI_FILTER_LOGS: '筛选日志',
                WEBUI_REFRESH_LOGS: '刷新日志',
                WEBUI_CLEAR_LOGS: '清空日志',
                WEBUI_NO_LOGS: '暂无日志',
                WEBUI_ABOUT_INFO: 'AMMF模块 - 一个Magisk/KernelSU模块框架',
                WEBUI_LANGUAGE_TITLE: '可用语言',
                WEBUI_SETTINGS_SAVED: '设置保存成功',
                WEBUI_SETTINGS_SAVE_FAILED: '设置保存失败',
                WEBUI_CONFIRM_RESTART: '确定要重启模块吗？',
                WEBUI_CONFIRM_CLEAR_LOGS: '确定要清空所有日志吗？',
                WEBUI_YES: '是',
                WEBUI_NO: '否',
                WEBUI_CANCEL: '取消',
                WEBUI_OK: '确定',
                WEBUI_CONFIRM: '确认',
                WEBUI_MODULE_RESTARTED: '模块重启成功',
                WEBUI_MODULE_RESTART_FAILED: '模块重启失败',
                WEBUI_LOGS_CLEARED: '日志清空成功',
                WEBUI_LOGS_CLEAR_FAILED: '日志清空失败',
                WEBUI_SYSTEM_PROP_SAVED: '系统属性保存成功',
                WEBUI_SYSTEM_PROP_SAVE_FAILED: '系统属性保存失败',
                WEBUI_SYSTEM_PROP_CREATED: 'system.prop文件创建成功'
            });
        }
    }
    
    loadDefaultLanguages() {
        // 默认语言数据（简化版）
        this.availableLanguages = ['en', 'zh'];
        
        // 英文
        this.languages.en = {
            ERROR_TEXT: 'Error',
            ERROR_CODE_TEXT: 'Error code',
            // 添加WebUI翻译
            WEBUI_SETTINGS_TITLE: 'Settings',
            WEBUI_SYSTEM_PROP_TITLE: 'System Properties',
            WEBUI_LOGS_TITLE: 'Logs',
            WEBUI_ABOUT_TITLE: 'About',
            // ... 其他翻译
        };
        
        // 中文
        this.languages.zh = {
            ERROR_TEXT: '错误',
            ERROR_CODE_TEXT: '错误代码',
            // 添加WebUI翻译
            WEBUI_SETTINGS_TITLE: '设置',
            WEBUI_SYSTEM_PROP_TITLE: '系统属性',
            WEBUI_LOGS_TITLE: '日志',
            WEBUI_ABOUT_TITLE: '关于',
            // ... 其他翻译
        };
    }
    
    createLanguageList() {
        // 清空语言列表
        this.languageList.innerHTML = '';
        
        // 语言名称映射
        const languageNames = {
            en: { en: 'English', zh: '英语' },
            zh: { en: 'Chinese', zh: '中文' },
            jp: { en: 'Japanese', zh: '日语' },
            ru: { en: 'Russian', zh: '俄语' },
            fr: { en: 'French', zh: '法语' }
        };
        
        // 为每种语言创建选项
        this.availableLanguages.forEach(langCode => {
            const langItem = document.createElement('div');
            langItem.className = 'language-item';
            if (langCode === this.currentLanguage) {
                langItem.classList.add('active');
            }
            
            // 语言名称
            const langName = languageNames[langCode] ? 
                (languageNames[langCode][this.currentLanguage] || languageNames[langCode].en) : 
                langCode;
            
            langItem.innerHTML = `
                <span class="material-symbols-outlined language-check">check</span>
                <span>${langName}</span>
            `;
            
            // 点击切换语言
            langItem.addEventListener('click', () => {
                this.applyLanguage(langCode);
                this.closeLanguageDialog();
            });
            
            this.languageList.appendChild(langItem);
        });
    }
    
    applyLanguage(langCode) {
        if (!this.languages[langCode]) {
            console.error('语言不可用:', langCode);
            return;
        }
        
        this.currentLanguage = langCode;
        
        // 更新语言列表中的活动项
        const langItems = this.languageList.querySelectorAll('.language-item');
        langItems.forEach(item => {
            item.classList.remove('active');
            if (item.querySelector('span:last-child').textContent === this.getLanguageName(langCode)) {
                item.classList.add('active');
            }
        });
        
        // 翻译所有带有data-i18n属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });
        
        // 翻译所有带有data-i18n-placeholder属性的元素
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                el.setAttribute('placeholder', translation);
            }
        });
        
        // 更新语言列表
        this.createLanguageList();
        
        console.log('已应用语言:', langCode);
    }
    
    getTranslation(key) {
        if (!key) return '';
        
        const langData = this.languages[this.currentLanguage];
        if (!langData) return key;
        
        return langData[key] || key;
    }
    
    getLanguageName(langCode) {
        const languageNames = {
            en: { en: 'English', zh: '英语' },
            zh: { en: 'Chinese', zh: '中文' },
            jp: { en: 'Japanese', zh: '日语' },
            ru: { en: 'Russian', zh: '俄语' },
            fr: { en: 'French', zh: '法语' }
        };
        
        if (languageNames[langCode] && languageNames[langCode][this.currentLanguage]) {
            return languageNames[langCode][this.currentLanguage];
        }
        
        return languageNames[langCode]?.en || langCode;
    }
    
    // 翻译函数，可以在其他地方调用
    translate(key) {
        return this.getTranslation(key);
    }
}

// 当DOM加载完成后初始化国际化管理器
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nManager();
});
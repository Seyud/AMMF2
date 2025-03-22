// 语言管理模块
const languageManager = {
    currentLang: 'en',
    supportedLangs: ['en', 'zh'],
    translations: {
        en: {},
        zh: {}
    },
    
    // 初始化语言系统
    async init() {
        try {
            // 读取languages.sh文件
            const languagesContent = await utils.readFile(`${utils.MODULE_PATH}files/languages.sh`);
            if (languagesContent) {
                this.parseLanguagesFile(languagesContent);
            }
            
            // 读取配置文件中的默认语言
            const configContent = await utils.readFile(`${utils.MODULE_PATH}module_settings/config.sh`);
            if (configContent) {
                const config = utils.parseConfigFile(configContent);
                if (config.print_languages && this.supportedLangs.includes(config.print_languages)) {
                    this.currentLang = config.print_languages;
                }
            }
            
            // 如果没有设置语言或语言不支持，尝试使用系统语言
            if (!this.currentLang || !this.supportedLangs.includes(this.currentLang)) {
                const systemLang = navigator.language.split('-')[0];
                this.currentLang = this.supportedLangs.includes(systemLang) ? systemLang : 'en';
            }
            
            // 应用语言
            this.applyLanguage();
            
            console.log(`Language initialized: ${this.currentLang}`);
        } catch (error) {
            console.error('Error initializing language system:', error);
            // 默认使用英语
            this.currentLang = 'en';
            this.applyLanguage();
        }
    },
    
    // 解析languages.sh文件
    parseLanguagesFile(content) {
        const lines = content.split('\n');
        let currentLang = null;
        
        for (let line of lines) {
            // 检测语言部分开始
            const langMatch = line.match(/^# Language: ([a-z]{2})$/);
            if (langMatch) {
                currentLang = langMatch[1];
                if (!this.translations[currentLang]) {
                    this.translations[currentLang] = {};
                    this.supportedLangs.push(currentLang);
                }
                continue;
            }
            
            // 如果当前有活跃的语言，解析键值对
            if (currentLang) {
                const keyValueMatch = line.match(/^([A-Z_]+)="(.+)"$/);
                if (keyValueMatch) {
                    const [, key, value] = keyValueMatch;
                    this.translations[currentLang][key] = value;
                }
            }
        }
        
        // 确保支持的语言列表是唯一的
        this.supportedLangs = [...new Set(this.supportedLangs)];
    },
    
    // 切换语言
    setLanguage(lang) {
        if (this.supportedLangs.includes(lang)) {
            this.currentLang = lang;
            this.applyLanguage();
            return true;
        }
        return false;
    },
    
    // 应用语言到UI
    applyLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });
        
        // 触发语言变更事件
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: this.currentLang }
        }));
    },
    
    // 翻译文本
    translate(key, defaultText = key) {
        // 首先尝试从languages.sh获取翻译
        if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
            return this.translations[this.currentLang][key];
        }
        
        // 如果没有找到，使用默认文本
        return defaultText;
    },
    
    // 获取语言选择器HTML
    getLanguageSelectorHTML() {
        let html = `<div class="language-selector">
            <label for="language-select">${this.translate('LANGUAGE_SELECT', 'Language')}</label>
            <select id="language-select">`;
        
        for (const lang of this.supportedLangs) {
            const selected = lang === this.currentLang ? 'selected' : '';
            const langName = lang === 'en' ? 'English' : lang === 'zh' ? '中文' : lang;
            html += `<option value="${lang}" ${selected}>${langName}</option>`;
        }
        
        html += `</select></div>`;
        return html;
    }
};

// 导出
window.languageManager = languageManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    languageManager.init();
    
    // 监听语言选择器变化
    document.body.addEventListener('change', event => {
        if (event.target.id === 'language-select') {
            languageManager.setLanguage(event.target.value);
        }
    });
});
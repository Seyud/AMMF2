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
            
            // 使用新的getConfig函数获取配置
            const config = await utils.getConfig();
            if (config && config.print_languages && this.supportedLangs.includes(config.print_languages)) {
                this.currentLang = config.print_languages;
                console.log(`从配置中读取语言设置: ${this.currentLang}`);
            } else {
                console.log('配置中没有有效的语言设置');
            }
            
            // 如果没有设置语言或语言不支持，尝试使用系统语言
            if (!this.currentLang || !this.supportedLangs.includes(this.currentLang)) {
                const systemLang = navigator.language.split('-')[0];
                this.currentLang = this.supportedLangs.includes(systemLang) ? systemLang : 'en';
                console.log(`使用系统语言或默认语言: ${this.currentLang}`);
            }
            
            // 从本地存储加载语言设置
            const savedLanguage = localStorage.getItem('selectedLanguage');
            if (savedLanguage && this.supportedLangs.includes(savedLanguage)) {
                this.currentLang = savedLanguage;
                console.log(`从本地存储加载语言设置: ${this.currentLang}`);
            }
            
            // 应用语言
            this.applyLanguage();
            
            console.log(`语言初始化完成: ${this.currentLang}`);
            
            // 添加语言选择按钮
            this.addLanguageButton();
        } catch (error) {
            console.error('初始化语言系统出错:', error);
            // 默认使用英语
            this.currentLang = 'en';
            this.applyLanguage();
        }
    },
    
    // 添加语言选择按钮
    addLanguageButton() {
        const container = document.getElementById('language-selector-container');
        if (container) {
            container.innerHTML = `
                <button id="language-button" class="md-button">
                    <i class="material-icons">language</i>
                    ${this.getLanguageDisplayName(this.currentLang)}
                </button>
            `;
            
            // 添加按钮点击事件
            document.getElementById('language-button')?.addEventListener('click', () => {
                this.showLanguageDialog();
            });
        }
    },
    
    // 显示语言选择对话框
    showLanguageDialog() {
        // 创建对话框
        const dialogHTML = `
            <div class="dialog language-dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>${this.translate('WEBUI_LANGUAGE_TITLE', '选择语言')}</h3>
                        <button class="icon-button close-dialog">
                            <i class="material-icons">close</i>
                        </button>
                    </div>
                    <div class="dialog-body">
                        <div class="language-options">
                            ${this.generateLanguageOptionsHTML()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到DOM
        const dialogContainer = document.createElement('div');
        dialogContainer.innerHTML = dialogHTML;
        document.body.appendChild(dialogContainer.firstElementChild);
        
        // 获取对话框元素
        const dialog = document.querySelector('.language-dialog');
        
        // 添加关闭按钮事件
        dialog.querySelector('.close-dialog')?.addEventListener('click', () => {
            this.closeLanguageDialog();
        });
        
        // 添加语言选项点击事件
        dialog.querySelectorAll('.language-option')?.forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.getAttribute('data-lang');
                if (lang) {
                    this.setLanguage(lang);
                    this.closeLanguageDialog();
                }
            });
        });
        
        // 显示对话框
        setTimeout(() => {
            dialog.classList.add('visible');
        }, 10);
    },
    
    // 关闭语言选择对话框
    closeLanguageDialog() {
        const dialog = document.querySelector('.language-dialog');
        if (dialog) {
            dialog.classList.remove('visible');
            setTimeout(() => {
                dialog.remove();
            }, 300);
        }
    },
    
    // 生成语言选项HTML
    generateLanguageOptionsHTML() {
        let html = '';
        
        for (const lang of this.supportedLangs) {
            const selected = lang === this.currentLang ? 'selected' : '';
            const langName = this.getLanguageDisplayName(lang);
            html += `
                <div class="language-option ${selected}" data-lang="${lang}">
                    ${langName}
                </div>
            `;
        }
        
        return html;
    },
    
    // 获取语言显示名称
    getLanguageDisplayName(lang) {
        // 尝试从翻译中获取语言名称
        if (this.translations[lang] && this.translations[lang]['WEBUI_LANGUAGE_NAME']) {
            return this.translations[lang]['WEBUI_LANGUAGE_NAME'];
        }
        
        // 默认名称
        switch (lang) {
            case 'en': return 'English';
            case 'zh': return '中文';
            case 'jp': return '日本語';
            case 'ru': return 'Русский';
            case 'fr': return 'Français';
            default: return lang;
        }
    },
    
    // 解析languages.sh文件
    parseLanguagesFile(content) {
        const lines = content.split('\n');
        let currentLang = null;
        
        for (let line of lines) {
            // 检测语言部分开始
            const langMatch = line.match(/^# Language: ([a-z]{2})$/) || line.match(/^lang_([a-z]{2})\(\) \{$/);
            if (langMatch) {
                currentLang = langMatch[1];
                if (!this.translations[currentLang]) {
                    this.translations[currentLang] = {};
                    if (!this.supportedLangs.includes(currentLang)) {
                        this.supportedLangs.push(currentLang);
                    }
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
            
            // 更新语言按钮文本
            const langButton = document.getElementById('language-button');
            if (langButton) {
                langButton.innerHTML = `
                    <i class="material-icons">language</i>
                    ${this.getLanguageDisplayName(lang)}
                `;
            }
            
            // 保存语言设置到本地存储
            localStorage.setItem('selectedLanguage', lang);
            
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
        
        // 更新模块标题
        const moduleTitle = document.getElementById('module-title');
        if (moduleTitle) {
            moduleTitle.textContent = this.translate('MODULE_MANAGER_TITLE', 'AMMF Module Manager');
        }
        
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
    }
};

// 导出
window.languageManager = languageManager;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    languageManager.init();
});
/**
 * AMMF WebUI 国际化模块
 * 提供多语言支持功能
 */

const I18n = {
    // 当前语言
    currentLang: 'zh',

    // 支持的语言列表
    supportedLangs: ['zh', 'en', 'ru'],

    // 语言数据
    translations: {
        zh: {},
        en: {},
        ru: {}
    },

    // 初始化
    async init() {
        try {
            console.log('开始初始化语言模块...');

            // 加载默认翻译，确保基本功能可用
            this.loadDefaultTranslations();

            // 应用默认语言翻译
            this.applyTranslations();

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
            PAUSED: '已暂停',
            NORMAL_EXIT: '正常退出',
            START_SERVICE: '启动服务',
            STOP_SERVICE: '停止服务',
            RESTART_SERVICE: '重启服务',
            STATUS_REFRESHED: '状态已刷新',
            STATUS_REFRESH_ERROR: '刷新状态失败',
            REFRESH_STATUS: '刷新状态',
            RUN_ACTION: '运行Action',
            DEVICE_INFO: '设备信息',
            NO_DEVICE_INFO: '无设备信息',
            DEVICE_MODEL: '设备型号',
            ANDROID_VERSION: 'Android版本',
            CPU_INFO: 'CPU信息',
            KERNEL_VERSION: '内核版本',
            ROOT_METHOD: 'Root方式',
            ROOT_VERSION: 'Root版本',

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
            LANGUAGE_RUSSIAN: 'Русский',

            // 关于页
            ABOUT_MODULE: '关于模块',
            ABOUT_WEBUI: '关于 WebUI',
            MODULE_INFO: '模块信息',
            MODULE_ID: '模块ID',
            MODULE_VERSION: '模块版本',
            MAGISK_MIN_VERSION: 'Magisk最低版本',
            KSU_MIN_VERSION: 'KernelSU最低版本',
            APATCH_MIN_VERSION: 'APatch最低版本',
            ANDROID_API: 'Android API',
            DEVELOPER_INFO: '开发者信息',
            DEVELOPER: '开发者',
            VERSION: '版本',
            NO_INFO: '无可用信息',
            UNKNOWN_DEVELOPER: '未知',
            MODULE_DESCRIPTION_DEFAULT: '模块描述未提供',
            WEBUI_DESCRIPTION: 'AMMF WebUI 是一个用于管理和配置 AMMF 模块的网页界面。',
            COPYRIGHT_INFO: '© 2025 Aurora星空. All rights reserved.',

            // 加载超时
            LOADING_TIMEOUT: '加载时间过长，部分功能可能不可用',
            
            // Shell脚本使用的翻译
            ERROR_TEXT: "错误",
            ERROR_CODE_TEXT: "错误代码",
            ERROR_UNSUPPORTED_VERSION: "不支持的版本",
            ERROR_VERSION_NUMBER: "版本号",
            ERROR_UPGRADE_ROOT_SCHEME: "请升级ROOT方案或更换ROOT方案",
            ERROR_INVALID_LOCAL_VALUE: "值无效，必须为true或false。",
            KEY_VOLUME: "音量键",
            CUSTOM_SCRIPT_DISABLED: "CustomScript已禁用。自定义脚本将不会被执行。",
            CUSTOM_SCRIPT_ENABLED: "CustomScript已启用。正在执行自定义脚本。",
            INTERNET_CONNET: "网络可用",
            DOWNLOAD_SUCCEEDED: "文件已下载",
            DOWNLOAD_FAILED: "下载失败",
            RETRY_DOWNLOAD: "重试",
            SKIP_DOWNLOAD: "跳过",
            CHECK_NETWORK: "无网络连接 请检查网络连接",
            PRESS_VOLUME_RETRY: "继续重试",
            PRESS_VOLUME_SKIP: "跳过",
            DOWNLOADING: "正在下载",
            FAILED_TO_GET_FILE_SIZE: "获取文件大小失败",
            COMMAND_FAILED: "命令执行失败"
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
            PAUSED: 'Paused',
            NORMAL_EXIT: 'Normal Exit',
            START_SERVICE: 'Start Service',
            STOP_SERVICE: 'Stop Service',
            RESTART_SERVICE: 'Restart Service',
            STATUS_REFRESHED: 'Status refreshed',
            STATUS_REFRESH_ERROR: 'Error refreshing status',
            REFRESH_STATUS: 'Refresh Status',
            RUN_ACTION: 'Run Action',
            DEVICE_INFO: 'Device Info',
            NO_DEVICE_INFO: 'No device information',
            DEVICE_MODEL: 'Device Model',
            ANDROID_VERSION: 'Android Version',
            CPU_INFO: 'CPU Info',
            KERNEL_VERSION: 'Kernel Version',
            ROOT_METHOD: 'Root Method',
            ROOT_VERSION: 'Root Version',

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
            LANGUAGE_RUSSIAN: 'Русский',

            // About page
            ABOUT_MODULE: 'About Module',
            ABOUT_WEBUI: 'About WebUI',
            MODULE_INFO: 'Module Info',
            MODULE_ID: 'Module ID',
            MODULE_VERSION: 'Module Version',
            MAGISK_MIN_VERSION: 'Magisk Min Version',
            KSU_MIN_VERSION: 'KernelSU Min Version',
            APATCH_MIN_VERSION: 'APatch Min Version',
            ANDROID_API: 'Android API',
            DEVELOPER_INFO: 'Developer Info',
            DEVELOPER: 'Developer',
            VERSION: 'Version',
            NO_INFO: 'No information available',
            UNKNOWN_DEVELOPER: 'Unknown',
            MODULE_DESCRIPTION_DEFAULT: 'No module description provided',
            WEBUI_DESCRIPTION: 'AMMF WebUI is a web interface for managing and configuring AMMF modules.',
            COPYRIGHT_INFO: '© 2025 Aurora Sky. All rights reserved.',

            // Loading timeout
            LOADING_TIMEOUT: 'Loading is taking longer than expected, some features may not be available',
            
            // Shell script translations
            ERROR_TEXT: "Error",
            ERROR_CODE_TEXT: "Error code",
            ERROR_UNSUPPORTED_VERSION: "Unsupported version",
            ERROR_VERSION_NUMBER: "Version number",
            ERROR_UPGRADE_ROOT_SCHEME: "Please upgrade the root scheme or change the root scheme",
            ERROR_INVALID_LOCAL_VALUE: "The value is invalid, must be true or false.",
            KEY_VOLUME: "Volume key",
            CUSTOM_SCRIPT_DISABLED: "CustomScript is disabled. Custom scripts will not be executed.",
            CUSTOM_SCRIPT_ENABLED: "CustomScript is enabled. Executing custom scripts.",
            INTERNET_CONNET: "Network available",
            DOWNLOAD_SUCCEEDED: "File downloaded",
            DOWNLOAD_FAILED: "Download failed",
            RETRY_DOWNLOAD: "Retry",
            SKIP_DOWNLOAD: "Skip",
            CHECK_NETWORK: "No network connection Please check the network connection",
            PRESS_VOLUME_RETRY: "Continue retry",
            PRESS_VOLUME_SKIP: "Skip",
            DOWNLOADING: "Downloading",
            FAILED_TO_GET_FILE_SIZE: "Failed to get file size",
            COMMAND_FAILED: "Command failed"
        };
        
        // 俄语翻译
        this.translations.ru = {
            // 导航
            NAV_STATUS: 'Статус',
            NAV_LOGS: 'Журналы',
            NAV_SETTINGS: 'Настройки',
            NAV_ABOUT: 'О модуле',

            // 通用
            LOADING: 'Загрузка...',
            REFRESH: 'Обновить',
            SAVE: 'Сохранить',
            CANCEL: 'Отмена',
            CONFIRM: 'Подтвердить',
            SUCCESS: 'Успех',
            ERROR: 'Ошибка',
            WARNING: 'Предупреждение',

            // 状态页
            MODULE_STATUS: 'Статус модуля',
            RUNNING: 'Работает',
            STOPPED: 'Остановлен',
            UNKNOWN: 'Неизвестно',
            PAUSED: 'Приостановлен',
            NORMAL_EXIT: 'Нормальное завершение',
            START_SERVICE: 'Запустить службу',
            STOP_SERVICE: 'Остановить службу',
            RESTART_SERVICE: 'Перезапустить службу',
            STATUS_REFRESHED: 'Статус обновлен',
            STATUS_REFRESH_ERROR: 'Ошибка обновления статуса',
            REFRESH_STATUS: 'Обновить статус',
            RUN_ACTION: 'Выполнить Action',
            DEVICE_INFO: 'Информация об устройстве',
            NO_DEVICE_INFO: 'Нет информации об устройстве',
            DEVICE_MODEL: 'Модель устройства',
            ANDROID_VERSION: 'Версия Android',
            CPU_INFO: 'Информация о CPU',
            KERNEL_VERSION: 'Версия ядра',
            ROOT_METHOD: 'Метод рутирования',
            ROOT_VERSION: 'Версия рута',

            // 日志页
            SELECT_LOG_FILE: 'Выбрать файл журнала',
            SERVICE_LOG: 'Журнал службы',
            SERVICE_LOG_OLD: 'Журнал службы (старый)',
            REFRESH_LOGS: 'Обновить журналы',
            AUTO_REFRESH: 'Автообновление',
            CLEAR_LOGS: 'Очистить журналы',
            EXPORT_LOGS: 'Экспорт журналов',
            NO_LOGS: 'Нет доступных журналов',
            CONFIRM_CLEAR_LOGS: 'Вы уверены, что хотите очистить этот файл журнала?',

            // 设置页
            MODULE_SETTINGS: 'Настройки модуля',
            REFRESH_SETTINGS: 'Обновить настройки',
            SAVE_SETTINGS: 'Сохранить настройки',
            GENERAL_SETTINGS: 'Общие настройки',
            NO_SETTINGS: 'Нет доступных настроек',
            SETTINGS_SAVED: 'Настройки сохранены',
            SETTINGS_REFRESHED: 'Настройки обновлены',
            SETTINGS_REFRESH_ERROR: 'Ошибка обновления настроек',
            NO_CONFIG_DATA: 'Нет данных конфигурации для сохранения',
            CONFIG_FILE_NOT_FOUND: 'Файл конфигурации не найден',
            CONFIG_READ_ERROR: 'Ошибка чтения файла конфигурации',

            // 语言
            SELECT_LANGUAGE: 'Выбрать язык',
            LANGUAGE_CHINESE: '中文',
            LANGUAGE_ENGLISH: 'English',
            LANGUAGE_RUSSIAN: 'Русский',

            // 关于页
            ABOUT_MODULE: 'О модуле',
            ABOUT_WEBUI: 'О WebUI',
            MODULE_INFO: 'Информация о модуле',
            MODULE_ID: 'ID модуля',
            MODULE_VERSION: 'Версия модуля',
            MAGISK_MIN_VERSION: 'Мин. версия Magisk',
            KSU_MIN_VERSION: 'Мин. версия KernelSU',
            APATCH_MIN_VERSION: 'Мин. версия APatch',
            ANDROID_API: 'Android API',
            DEVELOPER_INFO: 'Информация о разработчике',
            DEVELOPER: 'Разработчик',
            VERSION: 'Версия',
            NO_INFO: 'Нет доступной информации',
            UNKNOWN_DEVELOPER: 'Неизвестно',
            MODULE_DESCRIPTION_DEFAULT: 'Описание модуля не предоставлено',
            WEBUI_DESCRIPTION: 'AMMF WebUI - это веб-интерфейс для управления и настройки модулей AMMF.',
            COPYRIGHT_INFO: '© 2025 Aurora Sky. Все права защищены.',

            // 加载超时
            LOADING_TIMEOUT: 'Загрузка занимает больше времени, чем ожидалось, некоторые функции могут быть недоступны',
            
            // Shell脚本翻译
            ERROR_TEXT: "Ошибка",
            ERROR_CODE_TEXT: "Код ошибки",
            ERROR_UNSUPPORTED_VERSION: "Неподдерживаемая версия",
            ERROR_VERSION_NUMBER: "Номер версии",
            ERROR_UPGRADE_ROOT_SCHEME: "Пожалуйста, обновите схему рута или измените схему рута",
            ERROR_INVALID_LOCAL_VALUE: "Значение недействительно, должно быть true или false.",
            KEY_VOLUME: "Клавиша громкости",
            CUSTOM_SCRIPT_DISABLED: "CustomScript отключен. Пользовательские скрипты не будут выполняться.",
            CUSTOM_SCRIPT_ENABLED: "CustomScript включен. Выполнение пользовательских скриптов.",
            INTERNET_CONNET: "Сеть доступна",
            DOWNLOAD_SUCCEEDED: "Файл загружен",
            DOWNLOAD_FAILED: "Ошибка загрузки",
            RETRY_DOWNLOAD: "Повторить",
            SKIP_DOWNLOAD: "Пропустить",
            CHECK_NETWORK: "Нет подключения к сети. Пожалуйста, проверьте подключение к сети",
            PRESS_VOLUME_RETRY: "Продолжить повторение",
            PRESS_VOLUME_SKIP: "Пропустить",
            DOWNLOADING: "Загрузка",
            FAILED_TO_GET_FILE_SIZE: "Не удалось получить размер файла",
            COMMAND_FAILED: "Сбой выполнения команды"
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
            try {
                const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
                const fileExists = await Core.execCommand(`[ -f "${configPath}" ] && echo "true" || echo "false"`);

                if (fileExists.trim() === "true") {
                    const configContent = await Core.execCommand(`cat "${configPath}"`);
                    const printLangMatch = configContent.match(/print_languages=["']?([a-z]{2})["']?/);

                    if (printLangMatch && this.supportedLangs.includes(printLangMatch[1])) {
                        this.currentLang = printLangMatch[1];
                        console.log(`从配置中读取语言设置: ${this.currentLang}`);

                        // 保存到本地存储
                        localStorage.setItem('currentLanguage', this.currentLang);
                        return;
                    }
                }
            } catch (error) {
                console.error('读取配置文件语言设置失败:', error);
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

            // 最后使用默认语言
            console.log(`使用默认语言: ${this.currentLang}`);
        } catch (error) {
            console.error('确定初始语言失败:', error);
        }
    },

    // 更新配置文件中的语言设置
    async updateConfigLanguage(lang) {
        try {
            console.log(`尝试更新配置文件语言为: ${lang}`);
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;

            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${configPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.error('配置文件不存在');
                return false;
            }

            // 读取配置文件内容
            const configContent = await Core.execCommand(`cat "${configPath}"`);
            if (!configContent) {
                console.error('配置文件为空');
                return false;
            }

            // 更新语言设置 - 处理带引号和不带引号的情况
            let updatedContent;
            if (configContent.match(/print_languages=["']/)) {
                // 带引号的情况
                updatedContent = configContent.replace(/print_languages=["'].*?["']/g, `print_languages="${lang}"`);
            } else {
                // 不带引号的情况
                updatedContent = configContent.replace(/print_languages=\S+/g, `print_languages="${lang}"`);
            }

            // 如果没有找到print_languages，则添加它
            if (updatedContent === configContent) {
                // 在文件末尾添加
                updatedContent = configContent.trim() + `\n\nprint_languages="${lang}"                   # Default language for printing\n`;
            }

            // 写入更新后的内容
            await Core.execCommand(`cat > "${configPath}" << 'EOF'\n${updatedContent}\nEOF`);

            console.log('配置文件语言设置已更新');
            return true;
        } catch (error) {
            console.error('更新配置文件语言设置失败:', error);
            return false;
        }
    },

    // 设置语言
    async setLanguage(lang) {
        try {
            if (!this.supportedLangs.includes(lang)) {
                console.warn(`不支持的语言: ${lang}`);
                return false;
            }

            if (this.currentLang === lang) {
                console.log(`已经是当前语言: ${lang}`);
                return true;
            }

            // 设置新语言
            this.currentLang = lang;
            localStorage.setItem('currentLanguage', lang);

            // 应用翻译
            this.applyTranslations();

            // 更新配置文件中的语言设置
            await this.updateConfigLanguage(lang);

            // 触发语言变更事件
            document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

            console.log(`语言已切换为: ${lang}`);
            return true;
        } catch (error) {
            console.error('设置语言失败:', error);
            return false;
        }
    },

    // 翻译文本
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

    // 应用翻译到DOM
    applyTranslations() {
        // 使用性能更好的选择器
        const container = document.querySelector('.page-container.active') || document;
        const elements = container.querySelectorAll('[data-i18n]');
        
        // 记录当前滚动位置
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
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
            case 'ru': return this.translate('LANGUAGE_RUSSIAN', 'Русский');
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

            // 在显示前更新语言选择器
            this.updateLanguageSelector();

            // 添加显示类，触发动画
            languageSelector.classList.add('show');

            // 防止滚动
            document.body.style.overflow = 'hidden';
        });

        // 添加取消按钮点击事件
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                // 移除显示类，触发关闭动画
                languageSelector.classList.remove('show');

                // 恢复滚动
                document.body.style.overflow = '';
            });
        }

        // 点击其他区域关闭选择器
        document.addEventListener('click', (e) => {
            if (languageSelector.classList.contains('show') && 
                !languageSelector.contains(e.target) && 
                e.target !== languageButton) {
                languageSelector.classList.remove('show');
                document.body.style.overflow = '';
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
            // 记录当前滚动位置
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
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
                
                // 检查属性变化，如果data-i18n属性被添加或修改
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-i18n') {
                    needsTranslation = true;
                }
            });
    
            // 如果有需要翻译的元素，应用翻译
            if (needsTranslation) {
                this.applyTranslations();
                // 恢复滚动位置
                window.scrollTo(0, scrollTop);
            }
        });
    
        // 配置观察选项
        const config = {
            childList: true,    // 观察子节点的添加或删除
            subtree: true,      // 观察所有后代节点
            attributes: true,   // 观察属性变化
            attributeFilter: ['data-i18n'] // 只观察data-i18n属性
        };
    
        // 开始观察
        observer.observe(document.body, config);
        
        // 监听页面切换事件，确保新页面内容被翻译
        document.addEventListener('pageChanged', () => {
            setTimeout(() => this.applyTranslations(), 100);
        });
        
        // 监听语言变更事件
        document.addEventListener('languageChanged', () => {
            this.applyTranslations();
        });
        
        console.log('DOM变化监听已设置');
    }
};

// 导出模块
window.I18n = I18n;
// 语言配置
const translations = {
    // 基础翻译，后续会从languages.ini动态加载更多
    en: {
        title: 'AMMF Settings',
        save: 'Save',
        loading: 'Loading settings...',
        saveSuccess: 'Settings saved successfully!',
        saveError: 'Error saving settings',
        booleanTrue: 'Enabled',
        booleanFalse: 'Disabled',
        loadingDescriptions: 'Loading descriptions...',
        loadingExclusions: 'Loading exclusions...',
        loadingOptions: 'Loading options...',
        select: 'Select',
        languageSelect: 'Select Language',
        // 添加config.sh相关翻译
        config_sh_title: 'Module Configuration',
        settings_sh_title: 'Module Settings',
        system_prop_title: 'System Properties',
        settings_title: 'Module Settings',
        settings_description: 'Configure AMMF module parameters',
        system_prop_description: 'Edit system properties in system.prop file',
        logs_title: 'Logs',
        logs_description: 'View module logs',
        about_title: 'About',
        about_description: 'View module information and version',
        back: 'Back',
        config_file: 'Config File:',
        aboutInfo: 'AMMF Module - A Magisk/KernelSU Module Framework',
        // system.prop相关翻译
        noProperties: 'No system properties',
        addPropertyHint: 'Click the "Add Property" button below to add new system properties',
        propertyName: 'Property Name',
        propertyValue: 'Property Value',
        addProperty: 'Add Property',
        // 状态相关翻译
        statusTitle: 'Module Status',
        statusLabel: 'Current Status:',
        uptimeLabel: 'Uptime:',
        refreshStatus: 'Refresh',
        restartModule: 'Restart Module',
        // 日志相关翻译
        refreshLogs: 'Refresh Logs',
        clearLogs: 'Clear Logs',
        filterLogs: 'Filter Logs',
        noLogs: 'No logs available',
        confirmClearLogs: 'Are you sure you want to clear all logs?',
        logsCleared: 'Logs cleared successfully',
        // 系统属性相关翻译
        systemPropNotFound: 'system.prop file not found',
        createSystemPropHint: 'You can create a new system.prop file to add system properties',
        createSystemProp: 'Create system.prop',
        creatingSystemProp: 'Creating system.prop file...',
        systemPropCreated: 'system.prop file created',
        createSystemPropFailed: 'Failed to create system.prop file',
        // 其他翻译
        confirmRestart: 'Settings saved successfully. Do you want to restart the module to apply changes?',
        languageTitle: 'Available Languages'
    },
    zh: {
        title: 'AMMF设置',
        save: '保存',
        loading: '加载设置中...',
        saveSuccess: '设置保存成功！',
        saveError: '保存设置时出错',
        booleanTrue: '已启用',
        booleanFalse: '已禁用',
        loadingDescriptions: '加载描述中...',
        loadingExclusions: '加载排除项中...',
        loadingOptions: '加载选项中...',
        select: '选择',
        languageSelect: '选择语言',
        // 添加config.sh相关翻译
        config_sh_title: '模块配置',
        settings_sh_title: '模块设置',
        system_prop_title: '系统属性',
        settings_title: '模块设置',
        settings_description: '配置AMMF模块的各项参数',
        system_prop_description: '编辑system.prop文件中的系统属性',
        logs_title: '运行日志',
        logs_description: '查看模块运行日志',
        about_title: '关于',
        about_description: '查看模块信息和版本',
        back: '返回',
        config_file: '配置文件:',
        aboutInfo: 'AMMF模块 - 一个Magisk/KernelSU模块框架',
        // system.prop相关翻译
        noProperties: '暂无系统属性',
        addPropertyHint: '点击下方的"添加属性"按钮添加新的系统属性',
        propertyName: '属性名',
        propertyValue: '属性值',
        addProperty: '添加属性',
        // 状态相关翻译
        statusTitle: '模块状态',
        statusLabel: '当前状态:',
        uptimeLabel: '运行时间:',
        refreshStatus: '刷新',
        restartModule: '重启模块',
        // 日志相关翻译
        logs_title: '运行日志',
        logs_description: '查看模块运行日志',
        refreshLogs: '刷新日志',
        clearLogs: '清空日志',
        filterLogs: '筛选日志',
        noLogs: '暂无日志',
        confirmClearLogs: '确定要清空所有日志吗？',
        logsCleared: '日志已清空',
        // 系统属性相关翻译
        systemPropNotFound: 'system.prop文件不存在',
        createSystemPropHint: '您可以创建一个新的system.prop文件来添加系统属性',
        createSystemProp: '创建system.prop',
        creatingSystemProp: '正在创建system.prop文件...',
        systemPropCreated: 'system.prop文件已创建',
        createSystemPropFailed: '创建system.prop文件失败',
        // 其他翻译
        confirmRestart: '保存成功，是否立即重启模块以应用更改？',
        languageTitle: '可用语言'
    }
};

// 语言相关函数
function updateLanguage() {
    // 更新页面标题
    document.title = translations[state.language].title;
    
    // 更新UI元素
    document.getElementById('title').textContent = translations[state.language].title;
    document.getElementById('loading-text').textContent = translations[state.language].loading;
    
    // 更新保存按钮的提示文本
    if (document.getElementById('save-button')) {
        (document.getElementById('save-button')).title = translations[state.language].save;
    }
    
    // 更新所有已生成的设置项的语言
    const settingLabels = document.querySelectorAll('.setting-label');
    settingLabels.forEach(label => {
        const key = label.getAttribute('data-key');
        if (key) {
            // 如果有描述，使用描述，否则使用键名
            if (state.settingsDescriptions[key] && state.settingsDescriptions[key][state.language]) {
                label.textContent = key + ' - ' + state.settingsDescriptions[key][state.language];
            } else {
                label.textContent = key;
            }
        }
    });
    
    // 更新布尔值显示
    const booleanValues = document.querySelectorAll('.boolean-value');
    booleanValues.forEach(element => {
        const isChecked = element.previousElementSibling.querySelector('input').checked;
        element.textContent = isChecked ? 
            translations[state.language].booleanTrue : 
            translations[state.language].booleanFalse;
    });
    
    // 更新选择框选项
    const selects = document.querySelectorAll('.select-input');
    selects.forEach(select => {
        const key = select.id.replace('setting-', '');
        if (state.settingsOptions[key] && state.settingsOptions[key].options) {
            Array.from(select.options).forEach((option, index) => {
                const optionData = state.settingsOptions[key].options[index];
                if (optionData && optionData.label) {
                    option.textContent = optionData.label[state.language] || optionData.value;
                }
            });
        }
    });
    
    // 更新保存按钮
    const saveButton = document.getElementById('save-button');
    if (document.getElementById('save-button')) {
        const saveSpan = (document.getElementById('save-button')).querySelector('span');
        if (saveSpan) {
            saveSpan.title = translations[state.language].save;
        }
    }
    
    // 更新语言切换按钮
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.title = translations[state.language].languageSelect;
    }
    
    // 更新主题切换按钮
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.title = state.isDarkMode ? '切换到亮色模式' : '切换到暗色模式';
    }
    
    // 更新导航文本
    if (navigation && typeof navigation.updateUIText === 'function') {
        navigation.updateUIText();
    }
    
    // 更新状态文本
    if (moduleStatus && typeof moduleStatus.updateUIText === 'function') {
        moduleStatus.updateUIText();
    }
    
    // 更新日志文本
    if (logsManager && typeof logsManager.updateUIText === 'function') {
        logsManager.updateUIText();
    }
}

// 显示语言选择菜单
function showLanguageMenu() {
    // 移除已存在的菜单
    const existingMenu = document.getElementById('language-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    // 创建菜单容器
    const menuContainer = document.createElement('div');
    menuContainer.id = 'language-menu';
    menuContainer.className = 'language-menu';
    
    // 创建菜单标题
    const menuTitle = document.createElement('div');
    menuTitle.className = 'language-menu-title';
    menuTitle.textContent = translations[state.language].languageTitle || 'Available Languages';
    menuContainer.appendChild(menuTitle);
    
    // 创建语言列表
    const languageList = document.createElement('div');
    languageList.className = 'language-list';
    
    // 添加语言选项
    state.availableLanguages.forEach(langCode => {
        const langOption = document.createElement('div');
        langOption.className = 'language-option';
        if (langCode === state.language) {
            langOption.classList.add('selected');
        }
        
        // 使用从languages.ini加载的语言名称
        let langName = langCode.toUpperCase();
        if (translations[langCode] && translations[langCode].languageName) {
            langName = translations[langCode].languageName;
        }
        
        langOption.textContent = langName;
        
        // 点击事件
        langOption.addEventListener('click', () => {
            state.language = langCode;
            updateLanguage();
            menuContainer.remove();
        });
        
        languageList.appendChild(langOption);
    });
    
    menuContainer.appendChild(languageList);
    
    // 添加到页面
    document.body.appendChild(menuContainer);
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menuContainer.contains(e.target) && e.target.id !== 'language-toggle') {
                menuContainer.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
}

// 切换语言菜单
function toggleLanguageMenu() {
    showLanguageMenu();
}

// 加载可用语言
async function loadLanguages() {
    try {
        // 尝试从languages.ini加载语言配置
        const languagesContent = await execCommand('cat /data/adb/modules/AMMF/settings/languages.sh');
        
        // 解析languages.ini文件
        const languageFunctions = languagesContent.match(/lang_([a-z]{2,})\(\)/g);
        
        if (languageFunctions && languageFunctions.length > 0) {
            // 提取语言代码
            state.availableLanguages = languageFunctions.map(func => {
                const match = func.match(/lang_([a-z]{2,})\(\)/);
                return match ? match[1] : null;
            }).filter(lang => lang !== null);
            
            // 为每种语言加载翻译
            for (const langCode of state.availableLanguages) {
                // 如果translations中没有该语言，则初始化
                if (!translations[langCode]) {
                    translations[langCode] = {
                        ...translations.en, // 使用英语作为基础
                    };
                }
                
                // 提取该语言的翻译内容
                const langSection = languagesContent.match(new RegExp(`lang_${langCode}\\(\\)[\\s\\S]*?\\}`, 'm'));
                
                if (langSection && langSection[0]) {
                    // 解析翻译键值对
                    const translationPairs = langSection[0].match(/([A-Z_]+)="([^"]*)"/g);
                    
                    if (translationPairs) {
                        translationPairs.forEach(pair => {
                            const match = pair.match(/([A-Z_]+)="([^"]*)"/);
                            if (match && match.length === 3) {
                                const key = match[1];
                                const value = match[2];
                                
                                // 将WebUI相关的键映射到translations对象
                                if (key.startsWith('WEBUI_')) {
                                    // 移除WEBUI_前缀并转换为小写
                                    const translationKey = key.replace('WEBUI_', '').toLowerCase();
                                    translations[langCode][translationKey] = value;
                                } else if (key === 'ERROR_TEXT') {
                                    translations[langCode].saveError = value;
                                } else {
                                    // 添加其他常用翻译映射
                                    switch(key) {
                                        case 'ERROR_UNSUPPORTED_VERSION':
                                            translations[langCode].unsupportedVersion = value;
                                            break;
                                        case 'CUSTOM_SCRIPT_ENABLED':
                                            translations[langCode].customScriptEnabled = value;
                                            break;
                                        case 'CUSTOM_SCRIPT_DISABLED':
                                            translations[langCode].customScriptDisabled = value;
                                            break;
                                    }
                                }
                                
                                // 添加语言名称
                                if (key === 'WEBUI_LANGUAGE_NAME') {
                                    translations[langCode].languageName = value;
                                }
                            }
                        });
                    }
                }
            }
            
            console.log('Available languages:', state.availableLanguages);
        }
    } catch (error) {
        console.error('Error loading available languages:', error);
        // 如果加载失败，至少确保有英语和中文
        state.availableLanguages = ['en', 'zh'];
    }
}

// 确保DOM加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    // 绑定语言切换按钮事件
    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', toggleLanguageMenu);
    }
});
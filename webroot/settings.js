// 加载排除设置
async function loadExcludedSettings() {
    try {
        // 尝试从文件加载排除设置
        const excludedContent = await execCommand('cat /data/adb/modules/AMMF/webroot/settings/excluded_settings.json');
        const excludedData = JSON.parse(excludedContent);
        state.excludedSettings = excludedData.excluded || [];
        
        // 确保MODULE_ID被排除
        if (!state.excludedSettings.includes('MODULE_ID')) {
            state.excludedSettings.push('MODULE_ID');
        }
    } catch (error) {
        console.error('Error loading excluded settings:', error);
        // 如果加载失败，使用默认排除列表
        state.excludedSettings = ['MODULE_ID'];
    }
}

// 加载设置描述
async function loadSettingsDescriptions() {
    try {
        // 尝试从文件加载设置描述
        const descriptionsContent = await execCommand('cat /data/adb/modules/AMMF/webroot/settings/settings_descriptions.json');
        state.settingsDescriptions = JSON.parse(descriptionsContent);
    } catch (error) {
        console.error('Error loading settings descriptions:', error);
        // 如果加载失败，使用空对象
        state.settingsDescriptions = {};
    }
}

// 加载设置选项
async function loadSettingsOptions() {
    try {
        // 尝试从文件加载设置选项
        const optionsContent = await execCommand('cat /data/adb/modules/AMMF/webroot/settings/settings_options.json');
        state.settingsOptions = JSON.parse(optionsContent);
        
        // 动态更新print_languages选项，使其包含所有可用语言
        if (state.settingsOptions.print_languages && state.availableLanguages.length > 0) {
            state.settingsOptions.print_languages.options = state.availableLanguages.map(langCode => {
                // 使用从languages.ini加载的语言名称
                let langName = {};
                
                // 为每种UI语言提供当前语言的名称
                state.availableLanguages.forEach(uiLang => {
                    if (translations[langCode] && translations[langCode].languageName) {
                        // 如果有该语言的本地化名称，优先使用
                        langName[uiLang] = translations[langCode].languageName;
                    } else {
                        // 否则使用默认名称
                        langName[uiLang] = langCode.toUpperCase();
                    }
                });
                
                return {
                    value: langCode,
                    label: langName
                };
            });
        }
    } catch (error) {
        console.error('Error loading settings options:', error);
        // 如果加载失败，使用空对象
        state.settingsOptions = {};
    }
}

// 加载设置配置
async function loadSettingsConfig() {
    try {
        // 从整合文件加载所有设置配置
        const configContent = await execCommand('cat /data/adb/modules/AMMF/module_settings/settings.json');
        const configData = JSON.parse(configContent);
        
        // 设置排除项
        state.excludedSettings = configData.excluded || [];
        
        // 设置描述
        state.settingsDescriptions = configData.descriptions || {};
        
        // 设置选项
        state.settingsOptions = configData.options || {};
        
        // 动态更新print_languages选项，使其包含所有可用语言
        if (state.settingsOptions.print_languages && state.availableLanguages.length > 0) {
            state.settingsOptions.print_languages.options = state.availableLanguages.map(langCode => {
                // 使用从languages.ini加载的语言名称
                let langName = {};
                
                // 为每种UI语言提供当前语言的名称
                state.availableLanguages.forEach(uiLang => {
                    if (translations[langCode] && translations[langCode].languageName) {
                        // 如果有该语言的本地化名称，优先使用
                        langName[uiLang] = translations[langCode].languageName;
                    } else {
                        // 否则使用默认名称
                        langName[uiLang] = langCode.toUpperCase();
                    }
                });
                
                return {
                    value: langCode,
                    label: langName
                };
            });
        }
    } catch (error) {
        console.error('Error loading settings config:', error);
        // 如果加载失败，使用默认值
        state.excludedSettings = ['MODULE_ID', 'action_id', 'action_name', 'action_author', 'action_description'];
        state.settingsDescriptions = {};
        state.settingsOptions = {};
    }
}

// 加载设置 - 修改为接受文件路径参数
async function loadSettings(filePath) {
    try {
        // 使用KSU执行命令获取设置文件内容
        const settingsContent = await execCommand(`cat ${filePath}`);
        
        // 解析设置文件
        parseSettings(settingsContent);
        
        // 获取默认语言设置 (仅当加载config.sh时)
        if (filePath.endsWith('config.sh') && state.settings.print_languages && state.settings.print_languages.value) {
            state.language = state.settings.print_languages.value.replace(/"/g, '') === 'zh' ? 'zh' : 'en';
        }
        
        // 生成设置表单
        generateSettingsForm();
        
        // 隐藏加载指示器，显示设置表单
        document.getElementById('loading').style.display = 'none';
        document.getElementById('settings-form').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showSnackbar(translations[state.language].loadError || '加载设置失败');
    }
}

// 加载system.prop文件
async function loadSystemProp(filePath) {
    try {
        // 使用KSU执行命令获取system.prop内容
        const propContent = await execCommand(`cat ${filePath}`);
        
        // 解析system.prop文件
        parseSystemProp(propContent);
        
        // 生成设置表单
        generateSettingsForm();
        
        // 隐藏加载指示器，显示设置表单
        document.getElementById('loading').style.display = 'none';
        document.getElementById('settings-form').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading system.prop:', error);
        showSnackbar(translations[state.language].loadError || '加载系统属性失败');
    }
}

// 解析system.prop文件
function parseSystemProp(content) {
    const lines = content.split('\n');
    
    for (const line of lines) {
        // 跳过注释和空行
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        // 使用正则表达式匹配属性赋值，处理行尾注释
        const match = line.match(/^([^=]+)=([^#]*)(#.*)?$/);
        if (match) {
            const key = match[1].trim();
            // 去除值两端的空格
            let value = match[2].trim();
            let originalFormat = value; // 保存原始格式
            
            // 存储设置
            state.settings[key] = {
                value: value,
                type: 'text', // system.prop中的值都视为文本
                originalFormat: originalFormat
            };
        }
    }
}

// 解析设置文件
function parseSettings(content) {
    const lines = content.split('\n');
    
    for (const line of lines) {
        // 跳过注释和空行
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        
        // 使用更精确的正则表达式匹配变量赋值，处理行尾注释
        const match = line.match(/^([A-Za-z0-9_]+)=([^#]*)(#.*)?$/);
        if (match) {
            const key = match[1];
            // 去除值两端的空格
            let value = match[2].trim();
            let originalFormat = value; // 保存原始格式用于保存时恢复引号和格式
            
            // 检查是否为带引号的字符串，并提取实际值用于类型判断
            let valueForTypeCheck = value;
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                // 保存原始值（带引号）用于保存时恢复格式
                originalFormat = value;
                // 移除引号用于显示和类型判断
                valueForTypeCheck = value.substring(1, value.length - 1);
                value = valueForTypeCheck;
            }
            
            // 确定变量类型
            let type = 'text';
            
            // 检查是否为布尔值
            if (valueForTypeCheck === 'true' || valueForTypeCheck === 'false') {
                type = 'boolean';
            } 
            // 检查是否为数字
            else if (!isNaN(valueForTypeCheck) && valueForTypeCheck.trim() !== '') {
                type = 'number';
            }
            
            // 存储设置
            state.settings[key] = {
                value: value,
                type: type,
                originalFormat: originalFormat // 保存原始格式信息
            };
        }
    }
}
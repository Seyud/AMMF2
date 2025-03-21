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
                // 使用从languages.sh加载的语言名称（修正文件名）
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
        
        // 显示错误提示并提供重试选项
        showLoadingError('加载设置配置失败', () => loadSettingsConfig());
    }
}

// 加载设置 - 修改为接受文件路径参数
async function loadSettings(filePath) {
    try {
        console.log('Loading settings from:', filePath);
        
        // 检查文件路径是否有效
        if (!filePath || typeof filePath !== 'string') {
            throw new Error('Invalid file path');
        }
        
        // 使用KSU执行命令获取设置文件内容
        const settingsContent = await execCommand(`cat ${filePath}`);
        
        if (!settingsContent || settingsContent.trim() === '') {
            throw new Error('Empty settings file');
        }
        
        // 解析设置文件
        parseSettings(settingsContent);
        
        // 获取默认语言设置 (仅当加载config.sh时)
        if (filePath.endsWith('config.sh') && state.settings.print_languages && state.settings.print_languages.value) {
            state.language = state.settings.print_languages.value.replace(/"/g, '') === 'zh' ? 'zh' : 'en';
            updateLanguage(); // 更新UI语言
        }
        
        // 生成设置表单
        generateSettingsForm();
        
        // 隐藏加载指示器，显示设置表单
        document.getElementById('loading').style.display = 'none';
        document.getElementById('settings-form').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading settings:', error);
        
        // 显示错误提示并提供重试选项
        showLoadingError(
            translations[state.language]?.loadError || '加载设置失败，请重试', 
            () => loadSettings(filePath)
        );
    }
}

// 加载system.prop文件
async function loadSystemProp(filePath) {
    try {
        console.log('Loading system.prop from:', filePath);
        
        // 显示加载指示器
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('settings-form').style.display = 'none';
        
        // 获取文件内容
        const content = await execCommand(`cat ${filePath}`);
        
        // 解析system.prop文件
        const properties = parseSystemProp(content);
        
        // 创建设置表单
        createSystemPropForm(properties);
        
        // 隐藏加载指示器
        document.getElementById('loading').style.display = 'none';
        document.getElementById('settings-form').style.display = 'block';
        
    } catch (error) {
        console.error('加载system.prop失败:', error);
        showSnackbar(translations[state.language].settingsLoadError || '加载设置失败');
        
        // 隐藏加载指示器
        document.getElementById('loading').style.display = 'none';
    }
}

// 解析system.prop文件
function parseSystemProp(content) {
    const properties = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
        // 跳过空行和注释行
        if (line.trim() === '' || line.trim().startsWith('#')) {
            return;
        }
        
        // 解析属性行
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            
            properties.push({
                key: key,
                value: value
            });
        }
    });
    
    return properties;
}

// 创建system.prop表单
function createSystemPropForm(properties) {
    const settingsForm = document.getElementById('settings-form');
    settingsForm.innerHTML = '';
    
    // 如果没有属性，显示添加属性的提示
    if (properties.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-properties-message';
        emptyMessage.innerHTML = `
            <p>${translations[state.language].noProperties || '暂无系统属性'}</p>
            <p>${translations[state.language].addPropertyHint || '点击下方的"添加属性"按钮添加新的系统属性'}</p>
        `;
        settingsForm.appendChild(emptyMessage);
    }
    
    // 添加现有属性
    properties.forEach((prop, index) => {
        const propItem = document.createElement('div');
        propItem.className = 'setting-item property-item';
        propItem.innerHTML = `
            <div class="setting-label-container">
                <input type="text" class="text-input property-key" value="${prop.key}" placeholder="${translations[state.language].propertyName || '属性名'}" data-original="${prop.key}">
            </div>
            <div class="setting-control">
                <input type="text" class="text-input property-value" value="${prop.value}" placeholder="${translations[state.language].propertyValue || '属性值'}" data-original="${prop.value}">
                <button class="icon-button remove-property" data-index="${index}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        settingsForm.appendChild(propItem);
        
        // 添加删除属性的事件监听器
        propItem.querySelector('.remove-property').addEventListener('click', function() {
            propItem.remove();
            // 标记为已修改
            document.getElementById('save-button').classList.add('modified');
        });
        
        // 添加属性修改的事件监听器
        const keyInput = propItem.querySelector('.property-key');
        const valueInput = propItem.querySelector('.property-value');
        
        keyInput.addEventListener('input', function() {
            if (this.value !== this.getAttribute('data-original')) {
                document.getElementById('save-button').classList.add('modified');
            }
        });
        
        valueInput.addEventListener('input', function() {
            if (this.value !== this.getAttribute('data-original')) {
                document.getElementById('save-button').classList.add('modified');
            }
        });
    });
    
    // 添加"添加属性"按钮
    const addButton = document.createElement('button');
    addButton.className = 'add-property-button';
    addButton.innerHTML = `
        <span class="material-symbols-outlined">add</span>
        ${translations[state.language].addProperty || '添加属性'}
    `;
    settingsForm.appendChild(addButton);
    
    // 添加"添加属性"按钮的事件监听器
    addButton.addEventListener('click', function() {
        const propItem = document.createElement('div');
        propItem.className = 'setting-item property-item new-property';
        propItem.innerHTML = `
            <div class="setting-label-container">
                <input type="text" class="text-input property-key" placeholder="${translations[state.language].propertyName || '属性名'}" data-original="">
            </div>
            <div class="setting-control">
                <input type="text" class="text-input property-value" placeholder="${translations[state.language].propertyValue || '属性值'}" data-original="">
                <button class="icon-button remove-property">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        
        // 插入到"添加属性"按钮之前
        settingsForm.insertBefore(propItem, addButton);
        
        // 添加删除属性的事件监听器
        propItem.querySelector('.remove-property').addEventListener('click', function() {
            propItem.remove();
        });
        
        // 添加属性修改的事件监听器
        const keyInput = propItem.querySelector('.property-key');
        const valueInput = propItem.querySelector('.property-value');
        
        keyInput.addEventListener('input', function() {
            document.getElementById('save-button').classList.add('modified');
        });
        
        valueInput.addEventListener('input', function() {
            document.getElementById('save-button').classList.add('modified');
        });
        
        // 标记为已修改
        document.getElementById('save-button').classList.add('modified');
        
        // 聚焦到新添加的属性名输入框
        keyInput.focus();
    });
}

// 保存system.prop文件
async function saveSystemProp() {
    try {
        // 获取当前配置文件路径
        const filePath = navigation.configFilePaths['system.prop'];
        
        // 收集所有属性
        const properties = [];
        const propertyItems = document.querySelectorAll('.property-item');
        
        propertyItems.forEach(item => {
            const keyInput = item.querySelector('.property-key');
            const valueInput = item.querySelector('.property-value');
            
            if (keyInput && valueInput && keyInput.value.trim() !== '') {
                properties.push({
                    key: keyInput.value.trim(),
                    value: valueInput.value.trim()
                });
            }
        });
        
        // 构建文件内容
        let content = '# AMMF系统属性配置文件\n# 在此处添加系统属性，格式为：属性名=属性值\n\n';
        
        properties.forEach(prop => {
            content += `${prop.key}=${prop.value}\n`;
        });
        
        // 保存文件
        await execCommand(`su -c "echo '${content}' > ${filePath}"`);
        
        // 显示成功消息
        showSnackbar(translations[state.language].saveSuccess || '保存成功');
        
        // 移除已修改标记
        document.getElementById('save-button').classList.remove('modified');
        
        // 询问是否重启模块
        if (confirm(translations[state.language].confirmRestart || '保存成功，是否立即重启模块以应用更改？')) {
            moduleStatus.restartModule();
        }
        
    } catch (error) {
        console.error('保存system.prop失败:', error);
        showSnackbar(translations[state.language].saveError || '保存失败');
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
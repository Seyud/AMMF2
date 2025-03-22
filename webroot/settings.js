// 设置管理
class SettingsManager {
    constructor() {
        this.configForm = document.getElementById('config-form');
        this.settingsForm = document.getElementById('settings-form');
        this.configLoading = document.getElementById('config-loading');
        this.settingsLoading = document.getElementById('settings-loading');
        this.saveConfigButton = document.getElementById('save-config');
        this.saveSettingsButton = document.getElementById('save-settings');
        this.tabButtons = document.querySelectorAll('.tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 排除的设置项
        this.excludedSettings = [];
        // 设置项描述
        this.settingsDescriptions = {};
        // 设置项选项
        this.settingsOptions = {};
        
        this.init();
    }
    
    async init() {
        // 初始化标签页切换
        this.initTabs();
        
        // 加载settings.json
        await this.loadSettingsJson();
        
        // 加载配置文件
        await this.loadConfig();
        
        // 加载设置文件
        await this.loadSettings();
        
        // 保存按钮事件
        this.saveConfigButton.addEventListener('click', () => {
            this.saveConfig();
        });
        
        this.saveSettingsButton.addEventListener('click', () => {
            this.saveSettings();
        });
    }
    
    initTabs() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有标签页的active类
                this.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.tabContents.forEach(content => content.classList.remove('active'));
                
                // 添加当前标签页的active类
                button.classList.add('active');
                const targetId = button.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }
    
    async loadSettingsJson() {
        try {
            // 读取settings.json文件
            const command = 'cat /data/adb/modules/AMMF/module_settings/settings.json';
            const content = await execCommand(command);
            
            if (content) {
                const settingsJson = JSON.parse(content);
                
                // 设置排除项
                if (settingsJson.excluded && Array.isArray(settingsJson.excluded)) {
                    this.excludedSettings = settingsJson.excluded;
                }
                
                // 设置描述
                if (settingsJson.descriptions && typeof settingsJson.descriptions === 'object') {
                    this.settingsDescriptions = settingsJson.descriptions;
                }
                
                // 设置选项
                if (settingsJson.options && typeof settingsJson.options === 'object') {
                    this.settingsOptions = settingsJson.options;
                }
                
                console.log('已加载settings.json');
            }
        } catch (error) {
            console.error('加载settings.json失败:', error);
        }
    }
    
    async loadConfig() {
        try {
            this.configLoading.style.display = 'flex';
            this.configForm.style.display = 'none';
            
            // 读取config.sh文件
            const command = 'cat /data/adb/modules/AMMF/config.sh';
            const content = await execCommand(command);
            
            if (content) {
                // 解析配置文件
                const config = this.parseConfigFile(content);
                
                // 创建表单
                this.createConfigForm(config);
            }
            
            this.configLoading.style.display = 'none';
            this.configForm.style.display = 'block';
        } catch (error) {
            console.error('加载config.sh失败:', error);
            this.configLoading.style.display = 'none';
            this.configForm.innerHTML = `<p class="error-message">${error.message || '加载配置文件失败'}</p>`;
            this.configForm.style.display = 'block';
        }
    }
    
    parseConfigFile(content) {
        const config = {};
        const lines = content.split('\n');
        
        // 当前注释
        let currentComment = '';
        
        for (let line of lines) {
            line = line.trim();
            
            // 收集注释
            if (line.startsWith('#')) {
                currentComment += line.substring(1).trim() + ' ';
                continue;
            }
            
            // 解析变量赋值
            const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2];
                
                // 如果是排除项，则跳过
                if (this.excludedSettings.includes(key)) {
                    currentComment = '';
                    continue;
                }
                
                // 处理引号
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                
                // 处理布尔值
                if (value === 'true' || value === 'false') {
                    config[key] = {
                        type: 'boolean',
                        value: value === 'true',
                        comment: currentComment.trim()
                    };
                }
                // 处理数字
                else if (!isNaN(value) && value !== '') {
                    config[key] = {
                        type: 'number',
                        value: parseFloat(value),
                        comment: currentComment.trim()
                    };
                }
                // 处理字符串
                else {
                    // 检查是否有预定义选项
                    if (this.settingsOptions[key]) {
                        config[key] = {
                            type: 'select',
                            value: value,
                            comment: currentComment.trim(),
                            options: this.settingsOptions[key].options
                        };
                    } else {
                        config[key] = {
                            type: 'text',
                            value: value,
                            comment: currentComment.trim()
                        };
                    }
                }
                
                // 重置注释
                currentComment = '';
            }
        }
        
        return config;
    }
    
    createConfigForm(config) {
        this.configForm.innerHTML = '';
        
        for (const [key, setting] of Object.entries(config)) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            // 标签
            const label = document.createElement('label');
            label.textContent = key;
            formGroup.appendChild(label);
            
            // 描述（来自注释或settings.json）
            let description = '';
            if (this.settingsDescriptions[key] && this.settingsDescriptions[key][window.i18n.currentLanguage]) {
                description = this.settingsDescriptions[key][window.i18n.currentLanguage];
            } else if (setting.comment) {
                description = setting.comment;
            }
            
            if (description) {
                const descElement = document.createElement('div');
                descElement.className = 'description';
                descElement.textContent = description;
                formGroup.appendChild(descElement);
            }
            
            // 根据类型创建不同的输入控件
            switch (setting.type) {
                case 'boolean':
                    const switchContainer = document.createElement('div');
                    switchContainer.className = 'switch-container';
                    
                    const switchLabel = document.createElement('label');
                    switchLabel.className = 'switch';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = key;
                    checkbox.checked = setting.value;
                    
                    const slider = document.createElement('span');
                    slider.className = 'slider';
                    
                    switchLabel.appendChild(checkbox);
                    switchLabel.appendChild(slider);
                    switchContainer.appendChild(switchLabel);
                    
                    const valueLabel = document.createElement('span');
                    valueLabel.textContent = setting.value ? '开启' : '关闭';
                    switchContainer.appendChild(valueLabel);
                    
                    // 更新值标签
                    checkbox.addEventListener('change', () => {
                        valueLabel.textContent = checkbox.checked ? '开启' : '关闭';
                    });
                    
                    formGroup.appendChild(switchContainer);
                    break;
                    
                case 'number':
                    const numberContainer = document.createElement('div');
                    numberContainer.className = 'number-input';
                    
                    const numberInput = document.createElement('input');
                    numberInput.type = 'number';
                    numberInput.className = 'form-control';
                    numberInput.name = key;
                    numberInput.value = setting.value;
                    
                    numberContainer.appendChild(numberInput);
                    
                    // 添加滑块（如果适用）
                    if (setting.value >= 0 && setting.value <= 100) {
                        const sliderContainer = document.createElement('div');
                        sliderContainer.className = 'slider-container';
                        
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.min = 0;
                        slider.max = 100;
                        slider.value = setting.value;
                        
                        const sliderValue = document.createElement('div');
                        sliderValue.className = 'slider-value';
                        sliderValue.textContent = setting.value;
                        
                        // 同步滑块和数字输入
                        slider.addEventListener('input', () => {
                            numberInput.value = slider.value;
                            sliderValue.textContent = slider.value;
                        });
                        
                        numberInput.addEventListener('input', () => {
                            slider.value = numberInput.value;
                            sliderValue.textContent = numberInput.value;
                        });
                        
                        sliderContainer.appendChild(slider);
                        sliderContainer.appendChild(sliderValue);
                        formGroup.appendChild(sliderContainer);
                    }
                    
                    formGroup.appendChild(numberContainer);
                    break;
                    
                case 'select':
                    const selectContainer = document.createElement('div');
                    selectContainer.className = 'select-container';
                    
                    const select = document.createElement('select');
                    select.className = 'form-control';
                    select.name = key;
                    
                    // 添加选项
                    if (setting.options && Array.isArray(setting.options)) {
                        setting.options.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.value;
                            
                            // 获取当前语言的标签
                            if (option.label && option.label[window.i18n.currentLanguage]) {
                                optionElement.textContent = option.label[window.i18n.currentLanguage];
                            } else if (option.label && option.label.en) {
                                optionElement.textContent = option.label.en;
                            } else {
                                optionElement.textContent = option.value;
                            }
                            
                            if (option.value === setting.value) {
                                optionElement.selected = true;
                            }
                            
                            select.appendChild(optionElement);
                        });
                    }
                    
                    selectContainer.appendChild(select);
                    formGroup.appendChild(selectContainer);
                    break;
                    
                case 'text':
                default:
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'form-control';
                    input.name = key;
                    input.value = setting.value;
                    formGroup.appendChild(input);
                    break;
            }
            
            this.configForm.appendChild(formGroup);
        }
    }
    
    async saveConfig() {
        try {
            // 收集表单数据
            const formData = new FormData(this.configForm);
            const config = {};
            
            for (const [key, value] of formData.entries()) {
                config[key] = value;
            }
            
            // 处理复选框（未选中的不会出现在formData中）
            const checkboxes = this.configForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!formData.has(checkbox.name)) {
                    config[checkbox.name] = 'false';
                } else {
                    config[checkbox.name] = 'true';
                }
            });
            
            // 构建config.sh内容
            const originalCommand = 'cat /data/adb/modules/AMMF/config.sh';
            const originalContent = await execCommand(originalCommand);
            
            if (!originalContent) {
                throw new Error('无法读取原始配置文件');
            }
            
            // 保留原始文件的注释和结构，只更新变量值
            let newContent = '';
            const lines = originalContent.split('\n');
            
            for (let line of lines) {
                const trimmedLine = line.trim();
                
                // 保留注释和空行
                if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                    newContent += line + '\n';
                    continue;
                }
                
                // 更新变量值
                const match = trimmedLine.match(/^([A-Za-z0-9_]+)=(.*)$/);
                if (match) {
                    const key = match[1];
                    
                    // 如果是排除项，保持原样
                    if (this.excludedSettings.includes(key)) {
                        newContent += line + '\n';
                        continue;
                    }
                    
                    // 如果表单中有该变量，则更新值
                    if (config.hasOwnProperty(key)) {
                        let value = config[key];
                        
                        // 处理字符串值的引号
                        if (typeof value === 'string' && !['true', 'false'].includes(value) && isNaN(value)) {
                            value = `"${value}"`;
                        }
                        
                        newContent += `${key}=${value}\n`;
                    } else {
                        // 否则保持原样
                        newContent += line + '\n';
                    }
                } else {
                    // 其他行保持原样
                    newContent += line + '\n';
                }
            }
            
            // 保存配置文件
            const saveCommand = `echo '${newContent}' > /data/adb/modules/AMMF/config.sh`;
            await execCommand(saveCommand);
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_SETTINGS_SAVED'));
            
            // 重新加载配置
            await this.loadConfig();
        } catch (error) {
            console.error('保存配置失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_SETTINGS_SAVE_FAILED'));
        }
    }
    
    async loadSettings() {
        try {
            this.settingsLoading.style.display = 'flex';
            this.settingsForm.style.display = 'none';
            
            // 读取settings.sh文件
            const command = 'cat /data/adb/modules/AMMF/settings.sh';
            const content = await execCommand(command);
            
            if (content) {
                // 解析设置文件
                const settings = this.parseConfigFile(content);
                
                // 创建表单
                this.createSettingsForm(settings);
            }
            
            this.settingsLoading.style.display = 'none';
            this.settingsForm.style.display = 'block';
        } catch (error) {
            console.error('加载settings.sh失败:', error);
            this.settingsLoading.style.display = 'none';
            this.settingsForm.innerHTML = `<p class="error-message">${error.message || '加载设置文件失败'}</p>`;
            this.settingsForm.style.display = 'block';
        }
    }
    
    createSettingsForm(settings) {
        // 使用与createConfigForm相同的逻辑
        this.settingsForm.innerHTML = '';
        
        for (const [key, setting] of Object.entries(settings)) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            // 标签
            const label = document.createElement('label');
            label.textContent = key;
            formGroup.appendChild(label);
            
            // 描述（来自注释或settings.json）
            let description = '';
            if (this.settingsDescriptions[key] && this.settingsDescriptions[key][window.i18n.currentLanguage]) {
                description = this.settingsDescriptions[key][window.i18n.currentLanguage];
            } else if (setting.comment) {
                description = setting.comment;
            }
            
            if (description) {
                const descElement = document.createElement('div');
                descElement.className = 'description';
                descElement.textContent = description;
                formGroup.appendChild(descElement);
            }
            
            // 根据类型创建不同的输入控件
            switch (setting.type) {
                case 'boolean':
                    const switchContainer = document.createElement('div');
                    switchContainer.className = 'switch-container';
                    
                    const switchLabel = document.createElement('label');
                    switchLabel.className = 'switch';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = key;
                    checkbox.checked = setting.value;
                    
                    const slider = document.createElement('span');
                    slider.className = 'slider';
                    
                    switchLabel.appendChild(checkbox);
                    switchLabel.appendChild(slider);
                    switchContainer.appendChild(switchLabel);
                    
                    const valueLabel = document.createElement('span');
                    valueLabel.textContent = setting.value ? '开启' : '关闭';
                    switchContainer.appendChild(valueLabel);
                    
                    // 更新值标签
                    checkbox.addEventListener('change', () => {
                        valueLabel.textContent = checkbox.checked ? '开启' : '关闭';
                    });
                    
                    formGroup.appendChild(switchContainer);
                    break;
                    
                case 'number':
                    const numberContainer = document.createElement('div');
                    numberContainer.className = 'number-input';
                    
                    const numberInput = document.createElement('input');
                    numberInput.type = 'number';
                    numberInput.className = 'form-control';
                    numberInput.name = key;
                    numberInput.value = setting.value;
                    
                    numberContainer.appendChild(numberInput);
                    
                    // 添加滑块（如果适用）
                    if (setting.value >= 0 && setting.value <= 100) {
                        const sliderContainer = document.createElement('div');
                        sliderContainer.className = 'slider-container';
                        
                        const slider = document.createElement('input');
                        slider.type = 'range';
                        slider.min = 0;
                        slider.max = 100;
                        slider.value = setting.value;
                        
                        const sliderValue = document.createElement('div');
                        sliderValue.className = 'slider-value';
                        sliderValue.textContent = setting.value;
                        
                        // 同步滑块和数字输入
                        slider.addEventListener('input', () => {
                            numberInput.value = slider.value;
                            sliderValue.textContent = slider.value;
                        });
                        
                        numberInput.addEventListener('input', () => {
                            slider.value = numberInput.value;
                            sliderValue.textContent = numberInput.value;
                        });
                        
                        sliderContainer.appendChild(slider);
                        sliderContainer.appendChild(sliderValue);
                        formGroup.appendChild(sliderContainer);
                    }
                    
                    formGroup.appendChild(numberContainer);
                    break;
                    
                case 'select':
                    const selectContainer = document.createElement('div');
                    selectContainer.className = 'select-container';
                    
                    const select = document.createElement('select');
                    select.className = 'form-control';
                    select.name = key;
                    
                    // 添加选项
                    if (setting.options && Array.isArray(setting.options)) {
                        setting.options.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.value;
                            
                            // 获取当前语言的标签
                            if (option.label && option.label[window.i18n.currentLanguage]) {
                                optionElement.textContent = option.label[window.i18n.currentLanguage];
                            } else if (option.label && option.label.en) {
                                optionElement.textContent = option.label.en;
                            } else {
                                optionElement.textContent = option.value;
                            }
                            
                            if (option.value === setting.value) {
                                optionElement.selected = true;
                            }
                            
                            select.appendChild(optionElement);
                        });
                    }
                    
                    selectContainer.appendChild(select);
                    formGroup.appendChild(selectContainer);
                    break;
                    
                case 'text':
                default:
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'form-control';
                    input.name = key;
                    input.value = setting.value;
                    formGroup.appendChild(input);
                    break;
            }
            
            this.settingsForm.appendChild(formGroup);
        }
    }
    
    async saveSettings() {
        try {
            // 收集表单数据
            const formData = new FormData(this.settingsForm);
            const settings = {};
            
            for (const [key, value] of formData.entries()) {
                settings[key] = value;
            }
            
            // 处理复选框（未选中的不会出现在formData中）
            const checkboxes = this.settingsForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!formData.has(checkbox.name)) {
                    settings[checkbox.name] = 'false';
                } else {
                    settings[checkbox.name] = 'true';
                }
            });
            
            // 构建settings.sh内容
            const originalCommand = 'cat /data/adb/modules/AMMF/settings.sh';
            const originalContent = await execCommand(originalCommand);
            
            if (!originalContent) {
                throw new Error('无法读取原始设置文件');
            }
            
            // 保留原始文件的注释和结构，只更新变量值
            let newContent = '';
            const lines = originalContent.split('\n');
            
            for (let line of lines) {
                const trimmedLine = line.trim();
                
                // 保留注释和空行
                if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                    newContent += line + '\n';
                    continue;
                }
                
                // 更新变量值
                const match = trimmedLine.match(/^([A-Za-z0-9_]+)=(.*)$/);
                if (match) {
                    const key = match[1];
                    
                    // 如果是排除项，保持原样
                    if (this.excludedSettings.includes(key)) {
                        newContent += line + '\n';
                        continue;
                    }
                    
                    // 如果表单中有该变量，则更新值
                    if (settings.hasOwnProperty(key)) {
                        let value = settings[key];
                        
                        // 处理字符串值的引号
                        if (typeof value === 'string' && !['true', 'false'].includes(value) && isNaN(value)) {
                            value = `"${value}"`;
                        }
                        
                        newContent += `${key}=${value}\n`;
                    } else {
                        // 否则保持原样
                        newContent += line + '\n';
                    }
                } else {
                    // 其他行保持原样
                    newContent += line + '\n';
                }
            }
            
            // 保存设置文件
            const saveCommand = `echo '${newContent}' > /data/adb/modules/AMMF/settings.sh`;
            await execCommand(saveCommand);
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_SETTINGS_SAVED'));
            
            // 重新加载设置
            await this.loadSettings();
        } catch (error) {
            console.error('保存设置失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_SETTINGS_SAVE_FAILED'));
        }
    }
}

// 当DOM加载完成后初始化设置管理器
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
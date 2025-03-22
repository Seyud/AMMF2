/**
 * 设置页面管理
 * 处理config.sh和settings.json的读取和保存
 */
class SettingsManager {
    constructor() {
        this.configData = null;
        this.settingsData = null;
        this.configForm = document.getElementById('config-form');
        this.settingsForm = document.getElementById('settings-form');
        this.configLoading = document.getElementById('config-loading');
        this.settingsLoading = document.getElementById('settings-loading');
        this.saveConfigBtn = document.getElementById('save-config');
        this.saveSettingsBtn = document.getElementById('save-settings');
        
        this.init();
    }
    
    async init() {
        // 初始化标签页切换
        this.initTabs();
        
        // 加载配置和设置
        await this.loadConfig();
        await this.loadSettings();
        
        // 绑定保存按钮事件
        this.saveConfigBtn.addEventListener('click', () => this.saveConfig());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }
    
    initTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 移除所有标签页的active类
                tabs.forEach(t => t.classList.remove('active'));
                // 添加当前标签页的active类
                tab.classList.add('active');
                
                // 隐藏所有内容
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.remove('active'));
                
                // 显示当前标签页对应的内容
                const targetId = tab.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }
    
    async loadConfig() {
        try {
            this.configLoading.style.display = 'flex';
            
            // 读取config.sh文件
            const command = 'cat /data/adb/modules/AMMF/config.sh';
            const content = await execCommand(command);
            
            // 解析配置项
            this.configData = this.parseConfigFile(content);
            
            // 生成表单
            this.generateConfigForm();
            
            this.configLoading.style.display = 'none';
        } catch (error) {
            console.error('加载配置文件失败:', error);
            this.configLoading.style.display = 'none';
            showSnackbar(i18n.translate('WEBUI_SETTINGS_LOAD_FAILED'), 'error');
        }
    }
    
    parseConfigFile(content) {
        const configItems = [];
        let currentComment = '';
        
        // 按行分割
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 跳过空行
            if (!line) continue;
            
            // 收集注释
            if (line.startsWith('#')) {
                currentComment += line.substring(1).trim() + ' ';
                continue;
            }
            
            // 解析配置项
            const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2];
                
                // 处理引号
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                
                // 确定类型
                let type = 'text';
                if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                    type = 'boolean';
                    value = value.toLowerCase() === 'true';
                } else if (!isNaN(value) && value.trim() !== '') {
                    type = 'number';
                    value = parseFloat(value);
                }
                
                // 添加到配置项列表
                configItems.push({
                    key,
                    value,
                    type,
                    description: currentComment.trim()
                });
                
                // 重置注释
                currentComment = '';
            }
        }
        
        return configItems;
    }
    
    generateConfigForm() {
        this.configForm.innerHTML = '';
        
        if (!this.configData || this.configData.length === 0) {
            this.configForm.innerHTML = `<div class="empty-state">
                <span class="material-symbols-outlined">settings</span>
                <p>${i18n.translate('WEBUI_NO_CONFIG')}</p>
            </div>`;
            return;
        }
        
        // 为每个配置项创建表单元素
        this.configData.forEach(item => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            // 标签
            const label = document.createElement('label');
            label.textContent = item.key;
            formGroup.appendChild(label);
            
            // 描述
            if (item.description) {
                const description = document.createElement('div');
                description.className = 'description';
                description.textContent = item.description;
                formGroup.appendChild(description);
            }
            
            // 根据类型创建不同的输入控件
            let input;
            
            if (item.type === 'boolean') {
                // 开关
                const switchContainer = document.createElement('div');
                switchContainer.className = 'switch-container';
                
                const switchLabel = document.createElement('label');
                switchLabel.className = 'switch';
                
                input = document.createElement('input');
                input.type = 'checkbox';
                input.name = item.key;
                input.checked = item.value;
                
                const slider = document.createElement('span');
                slider.className = 'slider';
                
                switchLabel.appendChild(input);
                switchLabel.appendChild(slider);
                switchContainer.appendChild(switchLabel);
                
                formGroup.appendChild(switchContainer);
            } else if (item.type === 'number') {
                // 数字输入
                const numberInput = document.createElement('div');
                numberInput.className = 'number-input';
                
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'form-control';
                input.name = item.key;
                input.value = item.value;
                
                const controls = document.createElement('div');
                controls.className = 'number-controls';
                
                const upBtn = document.createElement('button');
                upBtn.type = 'button';
                upBtn.className = 'number-control';
                upBtn.innerHTML = '<span class="material-symbols-outlined">keyboard_arrow_up</span>';
                upBtn.addEventListener('click', () => {
                    input.value = parseFloat(input.value) + 1;
                });
                
                const downBtn = document.createElement('button');
                downBtn.type = 'button';
                downBtn.className = 'number-control';
                downBtn.innerHTML = '<span class="material-symbols-outlined">keyboard_arrow_down</span>';
                downBtn.addEventListener('click', () => {
                    input.value = Math.max(0, parseFloat(input.value) - 1);
                });
                
                controls.appendChild(upBtn);
                controls.appendChild(downBtn);
                
                numberInput.appendChild(input);
                numberInput.appendChild(controls);
                
                formGroup.appendChild(numberInput);
            } else {
                // 文本输入
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.name = item.key;
                input.value = item.value;
                
                formGroup.appendChild(input);
            }
            
            this.configForm.appendChild(formGroup);
        });
    }
    
    async saveConfig() {
        try {
            // 显示加载状态
            this.saveConfigBtn.disabled = true;
            this.saveConfigBtn.innerHTML = '<span class="spinner-small"></span> ' + i18n.translate('WEBUI_SAVING');
            
            // 收集表单数据
            const formData = new FormData(this.configForm);
            const config = {};
            
            for (const [key, value] of formData.entries()) {
                config[key] = value;
            }
            
            // 处理复选框（未选中的不会出现在formData中）
            this.configForm.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                config[checkbox.name] = checkbox.checked ? 'true' : 'false';
            });
            
            // 构建config.sh内容
            const originalContent = await execCommand('cat /data/adb/modules/AMMF/config.sh');
            
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
                    
                    // 如果表单中有该变量，则更新值
                    if (config.hasOwnProperty(key)) {
                        let value = config[key];
                        
                        // 处理字符串值的引号
                        const originalValue = match[2];
                        const hasQuotes = (originalValue.startsWith('"') && originalValue.endsWith('"')) || 
                                         (originalValue.startsWith("'") && originalValue.endsWith("'"));
                        
                        if (hasQuotes) {
                            // 保持原有的引号风格
                            const quoteChar = originalValue.charAt(0);
                            value = `${quoteChar}${value}${quoteChar}`;
                        } else if (typeof value === 'string' && !['true', 'false'].includes(value.toLowerCase()) && isNaN(value)) {
                            // 如果是字符串且不是布尔值或数字，添加双引号
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
            await execCommand(`echo '${newContent.replace(/'/g, "'\\''")}' > /data/adb/modules/AMMF/config.sh`);
            
            // 显示成功消息
            showSnackbar(i18n.translate('WEBUI_SETTINGS_SAVED'), 'success');
            
            // 恢复按钮状态
            this.saveConfigBtn.disabled = false;
            this.saveConfigBtn.textContent = i18n.translate('WEBUI_SAVE');
            
            // 重新加载配置
            await this.loadConfig();
        } catch (error) {
            console.error('保存配置失败:', error);
            showSnackbar(i18n.translate('WEBUI_SETTINGS_SAVE_FAILED'), 'error');
            
            // 恢复按钮状态
            this.saveConfigBtn.disabled = false;
            this.saveConfigBtn.textContent = i18n.translate('WEBUI_SAVE');
        }
    }
    
    async loadSettings() {
        try {
            this.settingsLoading.style.display = 'flex';
            
            // 读取settings.json文件
            const content = await execCommand('cat /data/adb/modules/AMMF/settings.json');
            
            if (!content || content.trim() === '') {
                this.settingsForm.innerHTML = `<div class="empty-state">
                    <span class="material-symbols-outlined">settings</span>
                    <p>${i18n.translate('WEBUI_NO_SETTINGS')}</p>
                </div>`;
                this.settingsLoading.style.display = 'none';
                return;
            }
            
            // 解析JSON
            this.settingsData = JSON.parse(content);
            
            // 生成表单
            this.generateSettingsForm();
            
            this.settingsLoading.style.display = 'none';
        } catch (error) {
            console.error('加载设置文件失败:', error);
            this.settingsLoading.style.display = 'none';
            showSnackbar(i18n.translate('WEBUI_SETTINGS_LOAD_FAILED'), 'error');
            
            this.settingsForm.innerHTML = `<div class="empty-state">
                <span class="material-symbols-outlined">error</span>
                <p>${error.message || i18n.translate('WEBUI_SETTINGS_LOAD_FAILED')}</p>
            </div>`;
        }
    }
    
    generateSettingsForm() {
        this.settingsForm.innerHTML = '';
        
        if (!this.settingsData || !this.settingsData.settings || Object.keys(this.settingsData.settings).length === 0) {
            this.settingsForm.innerHTML = `<div class="empty-state">
                <span class="material-symbols-outlined">settings</span>
                <p>${i18n.translate('WEBUI_NO_SETTINGS')}</p>
            </div>`;
            return;
        }
        
        // 为每个设置项创建表单元素
        for (const [key, setting] of Object.entries(this.settingsData.settings)) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            // 标签 - 使用翻译或原始键名
            const label = document.createElement('label');
            if (setting.label && setting.label[i18n.currentLanguage]) {
                label.textContent = setting.label[i18n.currentLanguage];
            } else if (setting.label && setting.label.en) {
                label.textContent = setting.label.en;
            } else {
                label.textContent = key;
            }
            formGroup.appendChild(label);
            
            // 描述
            if (setting.description && (setting.description[i18n.currentLanguage] || setting.description.en)) {
                const description = document.createElement('div');
                description.className = 'description';
                description.textContent = setting.description[i18n.currentLanguage] || setting.description.en;
                formGroup.appendChild(description);
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
                    checkbox.checked = setting.value === true || setting.value === 'true';
                    
                    const slider = document.createElement('span');
                    slider.className = 'slider';
                    
                    switchLabel.appendChild(checkbox);
                    switchLabel.appendChild(slider);
                    switchContainer.appendChild(switchLabel);
                    
                    formGroup.appendChild(switchContainer);
                    break;
                    
                case 'number':
                    const numberInput = document.createElement('div');
                    numberInput.className = 'number-input';
                    
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'form-control';
                    input.name = key;
                    input.value = setting.value;
                    
                    if (setting.min !== undefined) input.min = setting.min;
                    if (setting.max !== undefined) input.max = setting.max;
                    if (setting.step !== undefined) input.step = setting.step;
                    
                    numberInput.appendChild(input);
                    
                    // 如果有范围限制，添加滑块
                    if (setting.min !== undefined && setting.max !== undefined) {
                        const sliderContainer = document.createElement('div');
                        sliderContainer.className = 'slider-container';
                        
                        const rangeSlider = document.createElement('input');
                        rangeSlider.type = 'range';
                        rangeSlider.min = setting.min;
                        rangeSlider.max = setting.max;
                        rangeSlider.step = setting.step || 1;
                        rangeSlider.value = setting.value;
                        
                        // 同步滑块和输入框
                        rangeSlider.addEventListener('input', () => {
                            input.value = rangeSlider.value;
                        });
                        
                        input.addEventListener('input', () => {
                            rangeSlider.value = input.value;
                        });
                        
                        sliderContainer.appendChild(rangeSlider);
                        numberInput.appendChild(sliderContainer);
                    }
                    
                    formGroup.appendChild(numberInput);
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
                            if (option.label && option.label[i18n.currentLanguage]) {
                                optionElement.textContent = option.label[i18n.currentLanguage];
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
                    const textInput = document.createElement('input');
                    textInput.type = 'text';
                    textInput.className = 'form-control';
                    textInput.name = key;
                    textInput.value = setting.value;
                    formGroup.appendChild(textInput);
                    break;
            }
            
            this.settingsForm.appendChild(formGroup);
        }
    }
    
    async saveSettings() {
        try {
            // 显示加载状态
            this.saveSettingsBtn.disabled = true;
            this.saveSettingsBtn.innerHTML = '<span class="spinner-small"></span> ' + i18n.translate('WEBUI_SAVING');
            
            // 收集表单数据
            const formData = new FormData(this.settingsForm);
            const updatedSettings = JSON.parse(JSON.stringify(this.settingsData));
            
            // 更新设置值
            for (const [key, value] of formData.entries()) {
                if (updatedSettings.settings[key]) {
                    // 根据类型转换值
                    switch (updatedSettings.settings[key].type) {
                        case 'boolean':
                            updatedSettings.settings[key].value = value === 'on';
                            break;
                        case 'number':
                            updatedSettings.settings[key].value = parseFloat(value);
                            break;
                        default:
                            updatedSettings.settings[key].value = value;
                    }
                }
            }
            
            // 处理复选框（未选中的不会出现在formData中）
            this.settingsForm.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                if (updatedSettings.settings[checkbox.name]) {
                    updatedSettings.settings[checkbox.name].value = checkbox.checked;
                }
            });
            
            // 保存设置文件
            const jsonString = JSON.stringify(updatedSettings, null, 4);
            await execCommand(`echo '${jsonString.replace(/'/g, "'\\''")}' > /data/adb/modules/AMMF/settings.json`);
            
            // 显示成功消息
            showSnackbar(i18n.translate('WEBUI_SETTINGS_SAVED'), 'success');
            
            // 恢复按钮状态
            this.saveSettingsBtn.disabled = false;
            this.saveSettingsBtn.textContent = i18n.translate('WEBUI_SAVE');
            
            // 重新加载设置
            await this.loadSettings();
        } catch (error) {
            console.error('保存设置失败:', error);
            showSnackbar(i18n.translate('WEBUI_SETTINGS_SAVE_FAILED'), 'error');
            
            // 恢复按钮状态
            this.saveSettingsBtn.disabled = false;
            this.saveSettingsBtn.textContent = i18n.translate('WEBUI_SAVE');
        }
    }
}

// 当DOM加载完成后初始化设置管理器
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});
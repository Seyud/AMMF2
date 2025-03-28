class SettingsPage {
    constructor() {
        this.settings = {};
        this.settingsDescriptions = {};
        this.settingsOptions = {};
        this.excludedSettings = [];
        this.availableLanguages = [];
        this.moduleInfo = {};
    }
    
    async init() {
        try {
            // 显示加载中状态
            this.showLoading(true);
            
            // 加载设置配置
            const configResult = await this.loadSettingsConfig();
            if (!configResult) {
                console.warn('加载设置配置失败');
            }
            
            // 加载可用语言
            const langResult = await this.loadAvailableLanguages();
            if (!langResult) {
                console.warn('加载可用语言失败');
            }
            
            // 加载设置
            const settingsResult = await this.loadSettings();
            if (!settingsResult) {
                console.warn('加载设置失败');
            }
            
            // 隐藏加载状态
            this.showLoading(false);
            
            // 确保事件绑定
            this.bindEvents();
            
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            // 确保在出错时也关闭加载状态
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '加载设置失败'), 'error');
            return false;
        }
    }
    
    onActivate() {
        console.log('设置页面被激活');
        // 确保所有事件都已绑定
        setTimeout(() => {
            this.bindEvents();
            // 确保加载状态已关闭
            this.showLoading(false);
        }, 100);
    }
    
    render() {
        return `
            <div class="page-container settings-page">
                <div class="settings-loading-overlay" id="settings-loading">
                    <div class="loading-spinner"></div>
                    <p data-i18n="LOADING_SETTINGS">加载设置中...</p>
                </div>
                
                <div class="settings-header card">
                    <h2 data-i18n="MODULE_SETTINGS">模块设置</h2>
                    <div class="settings-actions">
                        <button id="refresh-settings" class="md-button">
                            <span class="material-symbols-rounded">refresh</span>
                            <span data-i18n="REFRESH_SETTINGS">刷新设置</span>
                        </button>
                        <button id="save-settings" class="md-button primary">
                            <span class="material-symbols-rounded">save</span>
                            <span data-i18n="SAVE_SETTINGS">保存设置</span>
                        </button>
                    </div>
                </div>
                
                <div class="settings-content card">
                    <div id="settings-form">
                        ${this.renderSettingsForm()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSettingsForm() {
        if (Object.keys(this.settings).length === 0) {
            return `<p data-i18n="NO_SETTINGS">没有可用的设置</p>`;
        }
        
        let html = '';
        
        // 按类别分组设置
        const generalSettings = [];
        const languageSettings = [];
        const compatibilitySettings = [];
        
        // 分类设置
        for (const key in this.settings) {
            // 跳过排除的设置
            if (this.excludedSettings.includes(key)) {
                continue;
            }
            
            // 语言相关设置
            if (key === 'print_languages') {
                languageSettings.push(key);
            }
            // 兼容性相关设置
            else if (['magisk_min_version', 'ksu_min_version', 'ksu_min_kernel_version', 'apatch_min_version', 'ANDROID_API'].includes(key)) {
                compatibilitySettings.push(key);
            }
            // 其他一般设置
            else {
                generalSettings.push(key);
            }
        }
        
        // 渲染语言设置
        if (languageSettings.length > 0) {
            html += this.renderSettingsSection('LANGUAGE_SETTINGS', '语言设置', 'language', languageSettings);
        }
        
        // 渲染一般设置
        if (generalSettings.length > 0) {
            html += this.renderSettingsSection('GENERAL_SETTINGS', '一般设置', 'settings', generalSettings);
        }
        
        // 渲染兼容性设置
        if (compatibilitySettings.length > 0) {
            html += this.renderSettingsSection('COMPATIBILITY_SETTINGS', '兼容性设置', 'build', compatibilitySettings);
        }
        
        return html;
    }
    
    renderSettingsSection(i18nKey, defaultTitle, icon, settingKeys) {
        let html = `
            <div class="settings-section" id="section-${i18nKey.toLowerCase()}">
                <div class="section-title" onclick="SettingsPage.toggleSection('${i18nKey.toLowerCase()}')">
                    <h3>
                        <span class="material-symbols-rounded">${icon}</span>
                        <span data-i18n="${i18nKey}">${defaultTitle}</span>
                    </h3>
                    <span class="material-symbols-rounded toggle-icon">expand_more</span>
                </div>
                <div class="settings-group">
        `;
        
        // 渲染该分区的所有设置项
        for (const key of settingKeys) {
            html += this.renderSettingItem(key);
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    renderSettingItem(key) {
        const setting = this.settings[key];
        if (!setting) return '';
        
        // 获取设置描述
        const description = this.settingsDescriptions[key] ? 
            (this.settingsDescriptions[key][I18n.currentLang] || this.settingsDescriptions[key].en) : '';
        
        let html = `
            <div class="setting-item" data-key="${key}">
                <div class="setting-info">
                    <div class="setting-key">${key}</div>
                    ${description ? `<div class="setting-description">${description}</div>` : ''}
                </div>
                <div class="setting-control">
        `;
        
        // 根据设置类型渲染不同的控件
        if (this.settingsOptions[key] && this.settingsOptions[key].options) {
            // 选择框
            html += this.renderSelectControl(key, setting.value);
        } else if (setting.type === 'boolean') {
            // 开关
            html += this.renderBooleanControl(key, setting.value === 'true');
        } else if (setting.type === 'number') {
            // 数字输入
            html += this.renderNumberControl(key, setting.value);
        } else {
            // 文本输入
            html += this.renderTextControl(key, setting.value);
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    renderTextControl(key, value) {
        return `<input type="text" id="setting-${key}" class="setting-text" value="${value}">`;
    }
    
    renderNumberControl(key, value) {
        // 如果有选项配置，使用滑块
        if (this.settingsOptions[key] && this.settingsOptions[key].range) {
            const range = this.settingsOptions[key].range;
            const min = range.min || 0;
            const max = range.max || 100;
            const step = range.step || 1;
            
            return `
                <div class="number-control">
                    <input type="range" id="setting-${key}-range" class="setting-slider" 
                           min="${min}" max="${max}" step="${step}" value="${value}">
                    <span id="setting-${key}-value" class="setting-value">${value}</span>
                </div>
            `;
        } else {
            // 否则使用数字输入框
            return `<input type="number" id="setting-${key}" class="setting-number" value="${value}">`;
        }
    }
    
    renderSelectControl(key, value) {
        const options = this.settingsOptions[key].options;
        
        let html = `<select id="setting-${key}" class="setting-select">`;
        
        options.forEach(option => {
            const label = option.label ? 
                (option.label[I18n.currentLang] || option.label.en || option.value) : 
                option.value;
                
            html += `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>${label}</option>`;
        });
        
        html += `</select>`;
        return html;
    }
    
    renderBooleanControl(key, isChecked) {
        return `
            <label class="switch">
                <input type="checkbox" id="setting-${key}" ${isChecked ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
            <span class="boolean-value">${isChecked ? 
                I18n.translate('ENABLED', '已启用') : 
                I18n.translate('DISABLED', '已禁用')}</span>
        `;
    }
    
    updateRangeValue(key, value) {
        const rangeInput = document.getElementById(`setting-${key}-range`);
        const valueDisplay = document.getElementById(`setting-${key}-value`);
        
        if (rangeInput) rangeInput.value = value;
        if (valueDisplay) valueDisplay.textContent = value;
    }
    
    showLoading(show) {
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
            console.log(`设置加载状态: ${show ? '显示' : '隐藏'}`);
        } else {
            console.error('找不到settings-loading元素');
        }
    }
    
    static toggleSection(sectionId) {
        const section = document.getElementById(`section-${sectionId}`);
        if (section) {
            section.classList.toggle('collapsed');
        }
    }
    
    async loadSettingsConfig() {
        try {
            console.log('加载设置配置...');
            
            // 从整合的JSON文件加载设置配置
            const configPath = `${Core.MODULE_PATH}module_settings/settings.json`;
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${configPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.error('设置配置文件不存在:', configPath);
                return false;
            }
            
            // 读取配置文件内容
            const configContent = await Core.execCommand(`cat "${configPath}"`);
            if (!configContent) {
                console.error('设置配置文件为空');
                return false;
            }
            
            // 解析JSON
            const config = JSON.parse(configContent);
            
            // 设置排除项
            this.excludedSettings = config.excluded || [];
            
            // 设置描述
            this.settingsDescriptions = config.descriptions || {};
            
            // 设置选项
            this.settingsOptions = config.options || {};
            
            console.log('设置配置加载完成');
            return true;
        } catch (error) {
            console.error('加载设置配置失败:', error);
            return false;
        }
    }
    
    async loadAvailableLanguages() {
        try {
            console.log('加载可用语言...');
            
            // 获取当前可用的语言列表
            this.availableLanguages = I18n.supportedLangs;
            
            // 如果有print_languages选项，更新其选项列表
            if (this.settingsOptions.print_languages) {
                this.settingsOptions.print_languages.options = this.availableLanguages.map(langCode => {
                    return {
                        value: langCode,
                        label: {
                            en: I18n.getLanguageName(langCode, 'en'),
                            zh: I18n.getLanguageName(langCode, 'zh')
                        }
                    };
                });
            }
            
            console.log('可用语言加载完成:', this.availableLanguages);
            return true;
        } catch (error) {
            console.error('加载可用语言失败:', error);
            return false;
        }
    }
    
    async loadSettings() {
        try {
            console.log('加载设置...');
            
            // 读取config.sh文件
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${configPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.error('配置文件不存在:', configPath);
                Core.showToast(I18n.translate('CONFIG_FILE_NOT_FOUND', '配置文件不存在'), 'error');
                return false;
            }
            
            // 读取配置文件内容
            const configContent = await Core.execCommand(`cat "${configPath}"`);
            if (!configContent) {
                console.error('配置文件为空');
                Core.showToast(I18n.translate('CONFIG_READ_ERROR', '配置文件为空'), 'error');
                return false;
            }
            
            // 解析设置
            this.parseSettings(configContent);
            
            console.log('设置加载完成, 共加载', Object.keys(this.settings).length, '个设置项');
            return true;
        } catch (error) {
            console.error('加载设置失败:', error);
            Core.showToast(I18n.translate('CONFIG_READ_ERROR', '加载设置失败'), 'error');
            return false;
        }
    }
    
    parseSettings(content) {
        const lines = content.split('\n');
        this.settings = {};
        
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
                this.settings[key] = {
                    value: value,
                    type: type,
                    originalFormat: originalFormat // 保存原始格式信息
                };
            }
        }
    }
    
    async refreshSettings() {
        try {
            this.showLoading(true);
            
            // 重新加载设置配置
            await this.loadSettingsConfig();
            
            // 重新加载可用语言
            await this.loadAvailableLanguages();
            
            // 重新加载设置
            await this.loadSettings();
            
            // 重新渲染设置表单
            const settingsForm = document.getElementById('settings-form');
            if (settingsForm) {
                settingsForm.innerHTML = this.renderSettingsForm();
                
                // 重新绑定事件
                this.bindSettingControls();
            }
            
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
        } catch (error) {
            console.error('刷新设置失败:', error);
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置失败'), 'error');
        }
    }
    
    async saveSettings() {
        try {
            this.showLoading(true);
            
            // 检查是否有设置数据
            if (Object.keys(this.settings).length === 0) {
                Core.showToast(I18n.translate('NO_CONFIG_DATA', '没有可保存的配置数据'), 'error');
                this.showLoading(false);
                return;
            }
            
            // 构建配置文件内容
            let configContent = '#!/system/bin/sh\n';
            
            // 遍历所有设置
            for (const key in this.settings) {
                const setting = this.settings[key];
                
                // 根据原始格式恢复值的格式（如引号等）
                let valueToSave = setting.value;
                
                // 如果原始格式带引号，恢复引号
                if (setting.originalFormat.startsWith('"') && setting.originalFormat.endsWith('"')) {
                    valueToSave = `"${valueToSave}"`;
                } else if (setting.originalFormat.startsWith("'") && setting.originalFormat.endsWith("'")) {
                    valueToSave = `'${valueToSave}'`;
                }
                
                // 添加到配置内容
                configContent += `${key}=${valueToSave}\n`;
            }
            
            // 保存到文件
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            const saveResult = await Core.execCommand(`echo '${configContent}' > "${configPath}"`);
            
            // 设置文件权限
            await Core.execCommand(`chmod 755 "${configPath}"`);
            
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showLoading(false);
            Core.showToast(I18n.translate('SAVE_SETTINGS_ERROR', '保存设置失败'), 'error');
        }
    }
    
    bindEvents() {
        console.log('绑定设置页面事件...');
        
        // 绑定刷新按钮
        const refreshButton = document.getElementById('refresh-settings');
        if (refreshButton) {
            refreshButton.onclick = () => this.refreshSettings();
        }
        
        // 绑定保存按钮
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.onclick = () => this.saveSettings();
        }
        
        // 绑定所有设置项的事件
        this.bindSettingControls();
    }
    
    bindSettingControls() {
        // 绑定选择框事件
        document.querySelectorAll('.setting-select').forEach(select => {
            select.onchange = (e) => {
                const key = e.target.id.replace('setting-', '');
                if (this.settings[key]) {
                    this.settings[key].value = e.target.value;
                }
            };
        });
        
        // 绑定复选框事件
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id.startsWith('setting-')) {
                checkbox.onchange = (e) => {
                    const key = e.target.id.replace('setting-', '');
                    if (this.settings[key]) {
                        this.settings[key].value = e.target.checked ? 'true' : 'false';
                        // 更新显示文本
                        const valueDisplay = checkbox.parentElement.nextElementSibling;
                        if (valueDisplay && valueDisplay.classList.contains('boolean-value')) {
                            valueDisplay.textContent = e.target.checked ? 
                                I18n.translate('ENABLED', '已启用') : 
                                I18n.translate('DISABLED', '已禁用');
                        }
                    }
                };
            }
        });
        
        // 绑定文本输入事件
        document.querySelectorAll('input[type="text"]').forEach(input => {
            if (input.id.startsWith('setting-')) {
                input.onchange = (e) => {
                    const key = e.target.id.replace('setting-', '');
                    if (this.settings[key]) {
                        this.settings[key].value = e.target.value;
                    }
                };
            }
        });
        
        // 绑定数字输入和滑块事件
        document.querySelectorAll('input[type="number"], input[type="range"]').forEach(input => {
            if (input.id.startsWith('setting-') || input.id.includes('-range')) {
                input.onchange = (e) => {
                    const key = e.target.id.replace('setting-', '').replace('-range', '');
                    if (this.settings[key]) {
                        const value = e.target.value;
                        this.settings[key].value = value;
                        this.updateRangeValue(key, value);
                    }
                };
            }
        });
        
        console.log('设置控件事件绑定完成');
    }
}

// 创建设置页面实例
const settingsPage = new SettingsPage();
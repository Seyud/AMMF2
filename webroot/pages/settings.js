/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置和设置
 */

const SettingsPage = {
    // 设置状态
    settings: {},
    settingsDescriptions: {},
    settingsOptions: {},
    excludedSettings: [],
    availableLanguages: [],
    
    // 初始化
    async init() {
        try {
            // 显示加载中状态
            this.showLoading(true);
            
            // 加载设置配置
            await this.loadSettingsConfig();
            
            // 加载可用语言
            await this.loadAvailableLanguages();
            
            // 加载设置
            await this.loadSettings();
            
            // 隐藏加载状态
            this.showLoading(false);
            
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            this.showLoading(false);
            return false;
        }
    },
    
    // 渲染页面
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
    },
    
    // 渲染设置表单
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
    },
    
    // 渲染设置分区
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
    },
    
    // 渲染单个设置项
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
    },
    
    // 渲染选择控件
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
    },
    
    // 渲染布尔控件
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
    },
    
    // 渲染数字控件
    renderNumberControl(key, value) {
        const numValue = parseInt(value);
        const useInputBox = numValue > 100;
        
        return `
            <div class="number-control">
                <input type="range" id="setting-${key}-range" class="setting-slider" 
                    min="0" max="${Math.max(100, numValue * 2)}" value="${numValue}" 
                    style="display: ${useInputBox ? 'none' : 'block'}"
                    oninput="SettingsPage.updateNumberValue('${key}', this.value)">
                <input type="number" id="setting-${key}" class="setting-number" value="${numValue}" 
                    style="display: ${useInputBox ? 'block' : 'none'}"
                    oninput="SettingsPage.updateRangeValue('${key}', this.value)">
                <span class="range-value" id="setting-${key}-value" 
                    style="display: ${useInputBox ? 'none' : 'inline-block'}">${numValue}</span>
                <button class="icon-button" onclick="SettingsPage.toggleNumberInput('${key}')">
                    <span class="material-symbols-rounded">${useInputBox ? 'tune' : 'edit'}</span>
                </button>
            </div>
        `;
    },
    
    // 渲染文本控件
    renderTextControl(key, value) {
        return `<input type="text" id="setting-${key}" class="setting-text" value="${value}">`;
    },
    
    // 渲染后的回调
    afterRender() {
        // 绑定刷新按钮
        document.getElementById('refresh-settings')?.addEventListener('click', () => {
            this.refreshSettings();
        });
        
        // 绑定保存按钮
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveSettings();
        });
    },
    
    // 显示/隐藏加载状态
    showLoading(show) {
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    },
    
    // 切换设置分区的展开/折叠状态
    toggleSection(sectionId) {
        const section = document.getElementById(`section-${sectionId}`);
        if (section) {
            section.classList.toggle('collapsed');
        }
    },
    
    // 更新数字输入值
    updateNumberValue(key, value) {
        const numberInput = document.getElementById(`setting-${key}`);
        const valueDisplay = document.getElementById(`setting-${key}-value`);
        
        if (numberInput) numberInput.value = value;
        if (valueDisplay) valueDisplay.textContent = value;
    },
    
    // 更新范围滑块值
    updateRangeValue(key, value) {
        const rangeInput = document.getElementById(`setting-${key}-range`);
        const valueDisplay = document.getElementById(`setting-${key}-value`);
        
        if (rangeInput) rangeInput.value = value;
        if (valueDisplay) valueDisplay.textContent = value;
    },
    
    // 切换数字输入方式
    toggleNumberInput(key) {
        const rangeInput = document.getElementById(`setting-${key}-range`);
        const numberInput = document.getElementById(`setting-${key}`);
        const valueDisplay = document.getElementById(`setting-${key}-value`);
        const toggleButton = document.querySelector(`[onclick="SettingsPage.toggleNumberInput('${key}')"] .material-symbols-rounded`);
        
        const isRangeVisible = rangeInput.style.display !== 'none';
        
        rangeInput.style.display = isRangeVisible ? 'none' : 'block';
        numberInput.style.display = isRangeVisible ? 'block' : 'none';
        valueDisplay.style.display = isRangeVisible ? 'none' : 'inline-block';
        
        if (toggleButton) {
            toggleButton.textContent = isRangeVisible ? 'tune' : 'edit';
        }
    },
    
    // 加载设置配置
    async loadSettingsConfig() {
        try {
            console.log('加载设置配置...');
            
            // 从整合的JSON文件加载设置配置
            const configPath = `${Core.MODULE_PATH}module_settings/settings.json`;
            
            // 检查文件是否存在
            const fileExistsResult = await Core.execCommand(`[ -f "${configPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.error('设置配置文件不存在');
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
    },
    
    // 加载可用语言
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
    },
    
    // 加载设置
    async loadSettings() {
        try {
            console.log('加载设置...');
            
            // 读取config.sh文件
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
            
            // 解析设置
            this.parseSettings(configContent);
            
            console.log('设置加载完成');
            return true;
        } catch (error) {
            console.error('加载设置失败:', error);
            return false;
        }
    },
    
    // 解析设置文件
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
    },
    
    // 刷新设置
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
            }
            
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
        } catch (error) {
            console.error('刷新设置失败:', error);
            this.showLoading(false);
            Core.showToast(I18n.translate('REFRESH_SETTINGS_ERROR', '刷新设置失败'), 'error');
        }
    },
    
    // 保存设置
    async saveSettings() {
        try {
            this.showLoading(true);
            
            // 收集所有设置的当前值
            const updatedSettings = {};
            
            for (const key in this.settings) {
                const setting = this.settings[key];
                
                // 对于排除的设置项，保持原值和原始格式
                if (this.excludedSettings.includes(key)) {
                    updatedSettings[key] = setting.originalFormat || setting.value;
                    continue;
                }
                
                const input = document.getElementById(`setting-${key}`);
                
                // 如果找不到输入元素，跳过
                if (!input) continue;
                
                if (setting.type === 'boolean') {
                    updatedSettings[key] = input.checked ? 'true' : 'false';
                } else if (setting.type === 'number') {
                    // 确保数字值有效
                    let numValue = parseInt(input.value);
                    if (isNaN(numValue)) numValue = 0;
                    updatedSettings[key] = numValue.toString();
                } else {
                    // 文本类型，检查原始格式以保持一致性
                    let value = input.value;
                    
                    // 如果原始值有引号格式，恢复相同的引号格式
                    if (setting.originalFormat && 
                       ((setting.originalFormat.startsWith('"') && setting.originalFormat.endsWith('"')) || 
                        (setting.originalFormat.startsWith("'") && setting.originalFormat.endsWith("'")))) {
                        // 确定使用的是单引号还是双引号
                        const quoteChar = setting.originalFormat.startsWith('"') ? '"' : "'";
                        value = `${quoteChar}${value}${quoteChar}`;
                    }
                    
                    updatedSettings[key] = value;
                }
            }
            
            // 生成新的 config.sh 内容
            let newContent = '';
            
            // 获取原始文件内容以保留注释
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            const originalContent = await Core.execCommand(`cat "${configPath}"`);
            const lines = originalContent.split('\n');
            
            for (const line of lines) {
                // 保留注释和空行
                if (line.trim().startsWith('#') || line.trim() === '') {
                    newContent += line + '\n';
                    continue;
                }
                
                // 查找变量赋值
                const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
                if (match) {
                    const key = match[1];
                    if (updatedSettings[key] !== undefined) {
                        // 提取行尾注释
                        const commentMatch = line.match(/#.*$/);
                        const comment = commentMatch ? commentMatch[0] : '';
                        
                        // 添加变量赋值和注释
                        newContent += `${key}=${updatedSettings[key]} ${comment}\n`;
                    } else {
                        newContent += line + '\n';
                    }
                } else {
                    newContent += line + '\n';
                }
            }
            
            // 写入新的设置文件
            await Core.execCommand(`cat > "${configPath}" << 'EOF'\n${newContent}\nEOF`);
            
            // 如果更改了语言设置，更新UI语言
            const langInput = document.getElementById('setting-print_languages');
            if (langInput && langInput.value !== I18n.currentLang) {
                await I18n.setLanguage(langInput.value);
            }
            
            this.showLoading(false);
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'), 'success');
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showLoading(false);
            Core.showToast(I18n.translate('SAVE_SETTINGS_ERROR', '保存设置失败'), 'error');
        }
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
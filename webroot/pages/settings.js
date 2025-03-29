/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置设置
 */

const SettingsPage = {
    // 设置数据
    settings: {},
    
    // 排除的设置项
    excludedSettings: [],
    
    // 设置描述
    settingsDescriptions: {},
    
    // 设置选项
    settingsOptions: {},
    
    // 是否正在加载
    isLoading: false,
    
    // 初始化
    async init() {
        try {
            // 加载设置数据
            await this.loadSettingsData();
            
            // 加载设置元数据（排除项、描述、选项）
            await this.loadSettingsMetadata();
            
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_SETTINGS', '设置');
        
        // 添加刷新按钮到页面操作区
        const pageActions = document.getElementById('page-actions');
        pageActions.innerHTML = `
            <button id="refresh-settings" class="md-button icon-only" title="${I18n.translate('REFRESH_SETTINGS', '刷新设置')}">
                <span class="material-symbols-rounded">refresh</span>
            </button>
        `;
        
        return `
            <div class="settings-page">
                <div class="settings-content shadow-sm">
                    <div id="settings-container">
                        ${this.renderSettings()}
                    </div>
                </div>
                
                <div class="settings-footer">
                    <button id="save-settings" class="md-button filled">
                        <span class="material-symbols-rounded">save</span>
                        <span data-i18n="SAVE_SETTINGS">保存设置</span>
                    </button>
                </div>
                
                <!-- 加载覆盖层 -->
                <div id="settings-loading" class="settings-loading-overlay" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p data-i18n="LOADING_SETTINGS">加载设置中...</p>
                </div>
            </div>
        `;
    },
    
    // 渲染设置项
    renderSettings() {
        if (Object.keys(this.settings).length === 0) {
            return `<div class="no-settings" data-i18n="NO_SETTINGS">没有可用的设置</div>`;
        }
        
        let html = '<div class="settings-list">';
        
        // 按字母顺序排序设置项
        const sortedSettings = Object.keys(this.settings).sort();
        
        for (const key of sortedSettings) {
            // 跳过被排除的设置项
            if (this.excludedSettings.includes(key)) {
                continue;
            }
            
            const value = this.settings[key];
            const description = this.getSettingDescription(key);
            
            html += `
                <div class="setting-item" data-key="${key}">
                    <div class="setting-info">
                        <div class="setting-key">${key}</div>
                        <div class="setting-description">${description}</div>
                    </div>
                    <div class="setting-control">
                        ${this.renderSettingControl(key, value)}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    // 渲染设置控件
    renderSettingControl(key, value) {
        // 检查是否有预定义选项
        if (this.settingsOptions[key]) {
            return this.renderSelectControl(key, value);
        }
        
        // 根据值类型渲染不同控件
        if (typeof value === 'boolean') {
            return this.renderBooleanControl(key, value);
        } else if (typeof value === 'number') {
            return this.renderNumberControl(key, value);
        } else {
            return this.renderTextControl(key, value);
        }
    },
    
    // 渲染布尔值控件
    renderBooleanControl(key, value) {
        return `
            <label class="switch">
                <input type="checkbox" id="setting-${key}" ${value ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
        `;
    },
    
    // 渲染数字控件
    renderNumberControl(key, value) {
        return `
            <input type="number" id="setting-${key}" value="${value}" class="setting-input">
        `;
    },
    
    // 渲染文本控件
    renderTextControl(key, value) {
        return `
            <input type="text" id="setting-${key}" value="${value}" class="setting-input">
        `;
    },
    
    // 渲染选择控件
    renderSelectControl(key, value) {
        const options = this.settingsOptions[key].options;
        if (!options || options.length === 0) {
            return this.renderTextControl(key, value);
        }
        
        let html = `<select id="setting-${key}" class="setting-select">`;
        
        for (const option of options) {
            const optionValue = option.value;
            // 获取当前语言的标签，如果没有则使用值本身
            const label = option.label ? (option.label[I18n.currentLang] || option.label.en || optionValue) : optionValue;
            
            html += `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${label}</option>`;
        }
        
        html += '</select>';
        return html;
    },
    
    // 获取设置描述
    getSettingDescription(key) {
        if (this.settingsDescriptions[key]) {
            // 获取当前语言的描述，如果没有则使用英文描述
            return this.settingsDescriptions[key][I18n.currentLang] || 
                   this.settingsDescriptions[key].en || 
                   '';
        }
        return '';
    },
    
    // 加载设置数据
    async loadSettingsData() {
        try {
            this.showLoading();
            
            // 从配置文件加载设置
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            const configContent = await Core.execCommand(`cat "${configPath}"`);
            
            if (!configContent) {
                console.warn('配置文件为空或不存在');
                this.settings = {};
                return;
            }
            
            // 解析配置文件
            this.settings = this.parseConfigFile(configContent);
            console.log('设置加载完成:', this.settings);
        } catch (error) {
            console.error('加载设置数据失败:', error);
            this.settings = {};
        } finally {
            this.hideLoading();
        }
    },
    
    // 解析配置文件
    parseConfigFile(content) {
        const settings = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            // 跳过注释和空行
            if (line.trim().startsWith('#') || line.trim() === '') {
                continue;
            }
            
            // 匹配变量赋值
            const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2];
                
                // 处理引号
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                
                // 转换布尔值
                if (value === 'true' || value === 'false') {
                    settings[key] = value === 'true';
                }
                // 转换数字
                else if (!isNaN(value) && value.trim() !== '') {
                    settings[key] = Number(value);
                }
                // 保留字符串
                else {
                    settings[key] = value;
                }
            }
        }
        
        return settings;
    },
    
    // 加载设置元数据
    async loadSettingsMetadata() {
        try {
            // 加载设置元数据
            const metadataPath = `${Core.MODULE_PATH}module_settings/settings.json`;
            const metadataContent = await Core.execCommand(`cat "${metadataPath}"`);
            
            if (!metadataContent) {
                console.warn('设置元数据文件为空或不存在');
                return;
            }
            
            const metadata = JSON.parse(metadataContent);
            
            // 设置排除项
            this.excludedSettings = metadata.excluded || [];
            
            // 设置描述
            this.settingsDescriptions = metadata.descriptions || {};
            
            // 设置选项
            this.settingsOptions = metadata.options || {};
            
            console.log('设置元数据加载完成');
        } catch (error) {
            console.error('加载设置元数据失败:', error);
        }
    },
    
    // 保存设置
    async saveSettings() {
        try {
            this.showLoading();
            
            // 收集表单数据
            const updatedSettings = { ...this.settings };
            
            for (const key in this.settings) {
                if (this.excludedSettings.includes(key)) {
                    continue;
                }
                
                const element = document.getElementById(`setting-${key}`);
                if (!element) continue;
                
                if (element.type === 'checkbox') {
                    updatedSettings[key] = element.checked;
                } else if (element.type === 'number') {
                    updatedSettings[key] = Number(element.value);
                } else {
                    updatedSettings[key] = element.value;
                }
            }
            
            // 生成新的配置文件内容
            let configContent = '';
            for (const key in updatedSettings) {
                let value = updatedSettings[key];
                
                // 格式化值
                if (typeof value === 'boolean') {
                    value = value ? 'true' : 'false';
                } else if (typeof value === 'string' && (value.includes(' ') || value === '')) {
                    value = `"${value}"`;
                }
                
                configContent += `${key}=${value}\n`;
            }
            
            // 写入配置文件
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            await Core.execCommand(`echo '${configContent.replace(/'/g, "'\\''")}' > "${configPath}"`);
            
            // 更新本地设置
            this.settings = updatedSettings;
            
            // 显示成功消息
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
            
            // 重新加载设置显示
            const settingsContainer = document.getElementById('settings-container');
            if (settingsContainer) {
                settingsContainer.innerHTML = this.renderSettings();
            }
            
            // 重新绑定事件
            this.bindSettingEvents();
        } catch (error) {
            console.error('保存设置失败:', error);
            Core.showToast(I18n.translate('SETTINGS_SAVE_ERROR', '保存设置失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },
    
    // 刷新设置
    async refreshSettings() {
        try {
            await this.loadSettingsData();
            await this.loadSettingsMetadata();
            
            // 更新设置显示
            const settingsContainer = document.getElementById('settings-container');
            if (settingsContainer) {
                settingsContainer.innerHTML = this.renderSettings();
            }
            
            // 重新绑定事件
            this.bindSettingEvents();
            
            Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
        } catch (error) {
            console.error('刷新设置失败:', error);
            Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置失败'), 'error');
        }
    },
    
    // 显示加载中
    showLoading() {
        this.isLoading = true;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    },
    
    // 隐藏加载中
    hideLoading() {
        this.isLoading = false;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    },
    
    // 渲染后的回调
    afterRender() {
        // 绑定设置项事件
        this.bindSettingEvents();
        
        // 绑定刷新按钮事件
        const refreshButton = document.getElementById('refresh-settings');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshSettings();
            });
        }
        
        // 绑定保存按钮事件
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    },
    
    // 绑定设置项事件
    bindSettingEvents() {
        // 为每个设置项绑定事件
        for (const key in this.settings) {
            if (this.excludedSettings.includes(key)) {
                continue;
            }
            
            const element = document.getElementById(`setting-${key}`);
            if (!element) continue;
            
            // 为选择框添加变更事件
            if (element.tagName === 'SELECT') {
                element.addEventListener('change', () => {
                    console.log(`设置 ${key} 已更改为: ${element.value}`);
                });
            }
        }
    },
    
    // 页面激活时的回调
    onActivate() {
        console.log('设置页面已激活');
    },
    
    // 页面停用时的回调
    onDeactivate() {
        console.log('设置页面已停用');
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
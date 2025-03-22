// 设置管理模块
const settingsManager = {
    // 配置文件路径 - 使用相对路径和备用路径
    configPath: 'config.sh',  // 相对于webroot的路径
    originalConfigPath: `${utils.MODULE_PATH}module_settings/config.sh`,
    settingsJsonPath: `${utils.MODULE_PATH}module_settings/settings.json`,
    
    // 配置数据
    configData: {},
    originalConfigContent: '',
    settingsJson: null,
    
    // 渲染设置页面
    render: async function() {
        // 加载配置
        await this.loadConfig();
        
        return `
            <div class="page-container settings-page">
                <div class="settings-header card">
                    <h2>${languageManager.translate('MODULE_SETTINGS', 'Module Settings')}</h2>
                    <div class="settings-actions">
                        <button id="refresh-settings" class="md-button">
                            <i class="material-icons">refresh</i>
                            ${languageManager.translate('REFRESH_SETTINGS', 'Refresh')}
                        </button>
                        <button id="save-settings" class="md-button primary">
                            <i class="material-icons">save</i>
                            ${languageManager.translate('SAVE_SETTINGS', 'Save')}
                        </button>
                    </div>
                </div>
                
                <div class="settings-content">
                    ${this.generateSettingsHTML()}
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender: function() {
        // 添加刷新按钮事件
        document.getElementById('refresh-settings')?.addEventListener('click', () => {
            this.loadConfig(true);
        });
        
        // 添加保存按钮事件
        document.getElementById('save-settings')?.addEventListener('click', () => {
            this.saveConfig();
        });
        
        // 添加设置项事件
        this.addSettingEventListeners();
    },
    
    // 加载配置
    loadConfig: async function(showToast = false) {
        try {
            console.log(`尝试加载配置文件: ${this.configPath}`);
            
            // 检查文件是否存在
            const exists = await utils.fileExists(this.configPath);
            if (!exists) {
                console.error(`配置文件不存在: ${this.configPath}`);
                if (showToast) {
                    statusManager.showToast(languageManager.translate('CONFIG_FILE_NOT_FOUND', '找不到配置文件'), 'error');
                }
                return;
            }
            
            // 读取配置文件
            const configContent = await utils.readFile(this.configPath);
            if (!configContent) {
                console.error(`无法读取配置文件内容: ${this.configPath}`);
                if (showToast) {
                    statusManager.showToast(languageManager.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                }
                return;
            }
            
            this.originalConfigContent = configContent;
            this.configData = utils.parseConfigFile(configContent);
            console.log('成功解析配置数据:', this.configData);
            
            // 读取settings.json
            const settingsJsonContent = await utils.readFile(this.settingsJsonPath);
            if (settingsJsonContent) {
                try {
                    this.settingsJson = JSON.parse(settingsJsonContent);
                    console.log('成功解析settings.json');
                } catch (e) {
                    console.error('解析settings.json出错:', e);
                    this.settingsJson = { excluded: [], descriptions: {}, options: {} };
                }
            } else {
                console.log('settings.json不存在或为空，使用默认值');
                this.settingsJson = { excluded: [], descriptions: {}, options: {} };
            }
            
            // 更新UI
            const settingsContent = document.querySelector('.settings-content');
            if (settingsContent) {
                settingsContent.innerHTML = this.generateSettingsHTML();
                this.addSettingEventListeners();
            }
            
            if (showToast) {
                statusManager.showToast(languageManager.translate('SETTINGS_REFRESHED', '设置已刷新'));
            }
        } catch (error) {
            console.error('加载配置出错:', error);
            
            if (showToast) {
                statusManager.showToast(languageManager.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
        }
    },
    
    // 保存配置
    saveConfig: async function() {
        try {
            // 生成新的配置文件内容
            const newConfigContent = utils.generateConfigContent(this.configData, this.originalConfigContent);
            
            // 写入webroot中的配置文件
            await utils.writeFile(this.configPath, newConfigContent);
            
            // 尝试写入原始配置文件
            try {
                await utils.writeFile(this.originalConfigPath, newConfigContent);
                console.log('已更新原始配置文件');
            } catch (originalError) {
                console.warn('无法更新原始配置文件，但已更新webroot中的副本', originalError);
            }
            
            // 更新原始内容
            this.originalConfigContent = newConfigContent;
            
            statusManager.showToast(languageManager.translate('SETTINGS_SAVED', '设置已保存'));
        } catch (error) {
            console.error('保存配置时出错:', error);
            statusManager.showToast(languageManager.translate('SETTINGS_SAVE_ERROR', '保存设置时出错'), 'error');
        }
    },
    
    // 生成设置HTML
    generateSettingsHTML: function() {
        if (!this.configData || Object.keys(this.configData).length === 0) {
            return `<div class="empty-state">${languageManager.translate('NO_SETTINGS', 'No settings available')}</div>`;
        }
        
        let html = '';
        
        // 获取排除项
        const excluded = this.settingsJson?.excluded || [];
        
        // 按类别分组设置项
        const generalSettings = [];
        
        // 遍历配置项
        for (const [key, value] of Object.entries(this.configData)) {
            // 跳过排除项
            if (excluded.includes(key)) continue;
            
            generalSettings.push({ key, value });
        }
        
        // 生成通用设置卡片
        if (generalSettings.length > 0) {
            html += `
                <div class="settings-card card">
                    <h3>${languageManager.translate('GENERAL_SETTINGS', 'General Settings')}</h3>
                    <div class="settings-list">
            `;
            
            for (const setting of generalSettings) {
                html += this.generateSettingItemHTML(setting.key, setting.value);
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    // 生成单个设置项HTML
    generateSettingItemHTML: function(key, value) {
        // 获取描述
        const description = this.getSettingDescription(key);
        
        // 检查是否有预定义选项
        const options = this.getSettingOptions(key);
        
        // 根据值类型生成不同的控件
        let controlHtml = '';
        
        if (options && options.length > 0) {
            // 下拉选择框
            controlHtml = `
                <select id="setting-${key}" data-key="${key}" class="setting-control">
            `;
            
            for (const option of options) {
                const selected = option.value === value ? 'selected' : '';
                const label = option.label[languageManager.currentLang] || option.label.en || option.value;
                controlHtml += `<option value="${option.value}" ${selected}>${label}</option>`;
            }
            
            controlHtml += `</select>`;
        } else if (value === 'true' || value === 'false') {
            // 布尔值 - 开关
            const checked = value === 'true' ? 'checked' : '';
            controlHtml = `
                <label class="switch">
                    <input type="checkbox" id="setting-${key}" data-key="${key}" ${checked} class="setting-control">
                    <span class="slider round"></span>
                </label>
            `;
        } else if (!isNaN(Number(value))) {
            // 数字 - 滑动条或输入框
            controlHtml = `
                <div class="number-input-container">
                    <input type="range" id="setting-range-${key}" data-key="${key}" min="0" max="${Math.max(100, Number(value) * 2)}" value="${value}" class="setting-range">
                    <input type="number" id="setting-${key}" data-key="${key}" value="${value}" class="setting-control number-input">
                </div>
            `;
        } else {
            // 文本 - 输入框
            controlHtml = `<input type="text" id="setting-${key}" data-key="${key}" value="${value}" class="setting-control">`;
        }
        
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <label for="setting-${key}" class="setting-label">${key}</label>
                    <p class="setting-description">${description}</p>
                </div>
                <div class="setting-control-container">
                    ${controlHtml}
                </div>
            </div>
        `;
    },
    
    // 获取设置描述
    getSettingDescription: function(key) {
        if (this.settingsJson?.descriptions?.[key]) {
            const desc = this.settingsJson.descriptions[key];
            return desc[languageManager.currentLang] || desc.en || key;
        }
        return key;
    },
    
    // 获取设置选项
    getSettingOptions: function(key) {
        if (this.settingsJson?.options?.[key]?.options) {
            return this.settingsJson.options[key].options;
        }
        return null;
    },
    
    // 添加设置项事件监听
    addSettingEventListeners: function() {
        // 文本和选择框变更
        document.querySelectorAll('.setting-control').forEach(control => {
            control.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-key');
                let value;
                
                if (e.target.type === 'checkbox') {
                    value = e.target.checked ? 'true' : 'false';
                } else {
                    value = e.target.value;
                }
                
                this.configData[key] = value;
            });
        });
        
        // 数字滑动条联动
        document.querySelectorAll('.setting-range').forEach(range => {
            range.addEventListener('input', (e) => {
                const key = e.target.getAttribute('data-key');
                const value = e.target.value;
                const numberInput = document.getElementById(`setting-${key}`);
                
                if (numberInput) {
                    numberInput.value = value;
                    this.configData[key] = value;
                }
            });
        });
        
        // 数字输入框联动
        document.querySelectorAll('.number-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.getAttribute('data-key');
                const value = e.target.value;
                const rangeInput = document.getElementById(`setting-range-${key}`);
                
                if (rangeInput) {
                    // 调整范围
                    if (Number(value) > rangeInput.max) {
                        rangeInput.max = Number(value) * 2;
                    }
                    
                    rangeInput.value = value;
                    this.configData[key] = value;
                }
            });
        });
    }
};

// 导出
window.settingsManager = settingsManager;
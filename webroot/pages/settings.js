/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置
 */

const SettingsPage = {
    // 配置文件路径
    configPath: `${Core.MODULE_PATH}module_settings/config.sh`,
    webConfigPath: 'config.sh',  // 相对于webroot的路径
    settingsJsonPath: `${Core.MODULE_PATH}module_settings/settings.json`,
    
    // 配置数据
    configData: {},
    originalConfigContent: '',
    settingsJson: null,
    
    // 初始化
    async init() {
        try {
            // 加载配置
            await this.loadConfig();
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container settings-page">
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
                
                <div class="settings-content">
                    ${this.generateSettingsHTML()}
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender() {
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
    async loadConfig(showToast = false) {
        try {
            console.log(`尝试加载配置文件: ${this.configPath}`);
            
            // 检查文件是否存在
            const exists = await Core.fileExists(this.configPath);
            if (!exists) {
                console.error(`配置文件不存在: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_FILE_NOT_FOUND', '找不到配置文件'), 'error');
                }
                return;
            }
            
            // 读取配置文件
            const configContent = await Core.readFile(this.configPath);
            if (!configContent) {
                console.error(`无法读取配置文件内容: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                }
                return;
            }
            
            this.originalConfigContent = configContent;
            this.configData = Core.parseConfigFile(configContent);
            console.log('成功解析配置数据:', this.configData);
            
            // 读取settings.json
            const settingsJsonContent = await Core.readFile(this.settingsJsonPath);
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
                Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
            }
        } catch (error) {
            console.error('加载配置出错:', error);
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
        }
    },
    
    // 保存配置
    async saveConfig() {
        try {
            // 检查是否有配置数据
            if (!this.configData) {
                console.error('没有可保存的配置数据');
                Core.showToast(I18n.translate('NO_CONFIG_DATA', '没有可保存的配置数据'), 'error');
                return false;
            }
            
            // 收集表单数据
            this.collectFormData();
            
            // 检查是否真的有变化
            const newConfigContent = Core.generateConfigContent(this.configData, this.originalConfigContent);
            if (newConfigContent === this.originalConfigContent) {
                console.log('配置没有变化，无需保存');
                Core.showToast(I18n.translate('NO_CHANGES', '没有变更需要保存'));
                return true;
            }
            
            // 保存到配置文件
            console.log(`尝试保存配置到: ${this.configPath}`);
            const saveResult = await Core.writeFile(this.configPath, newConfigContent);
            
            if (!saveResult) {
                console.error('保存配置文件失败');
                Core.showToast(I18n.translate('SAVE_CONFIG_ERROR', '保存配置失败'), 'error');
                return false;
            }
            
            // 同时保存到webroot下的配置文件
            await Core.writeFile(this.webConfigPath, newConfigContent);
            
            // 更新原始内容
            this.originalConfigContent = newConfigContent;
            
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
            return true;
        } catch (error) {
            console.error('保存配置出错:', error);
            Core.showToast(I18n.translate('SAVE_CONFIG_ERROR', '保存配置失败'), 'error');
            return false;
        }
    },
    
    // 收集表单数据
    collectFormData() {
        const settingInputs = document.querySelectorAll('.setting-input');
        
        settingInputs.forEach(input => {
            const key = input.getAttribute('data-key');
            if (!key) return;
            
            let value;
            
            if (input.type === 'checkbox') {
                value = input.checked ? '1' : '0';
            } else if (input.type === 'select-one') {
                value = input.value;
            } else {
                value = input.value;
            }
            
            this.configData[key] = value;
        });
    },
    
    // 生成设置HTML
    generateSettingsHTML() {
        if (!this.configData || Object.keys(this.configData).length === 0) {
            return `<div class="no-settings card">${I18n.translate('NO_SETTINGS', '没有可用的设置')}</div>`;
        }
        
        // 排除的键
        const excludedKeys = [
            ...(this.settingsJson?.excluded || []),
            'action_id',
            'action_name',
            'action_author',
            'action_description',
            'magisk_min_version',
            'ksu_min_version',
            'ksu_min_kernel_version',
            'apatch_min_version'
        ];
        
        // 分组设置
        const generalSettings = [];
        const otherSettings = [];
        
        for (const [key, value] of Object.entries(this.configData)) {
            // 跳过排除的键
            if (excludedKeys.includes(key)) continue;
            
            // 创建设置项
            const settingItem = this.createSettingItem(key, value);
            
            // 分组
            if (key === 'print_languages' || key === 'ANDROID_API') {
                generalSettings.push(settingItem);
            } else {
                otherSettings.push(settingItem);
            }
        }
        
        // 构建HTML
        let html = '';
        
        // 常规设置
        if (generalSettings.length > 0) {
            html += `
                <div class="settings-section card">
                    <h3 data-i18n="GENERAL_SETTINGS">常规设置</h3>
                    <div class="settings-list">
                        ${generalSettings.join('')}
                    </div>
                </div>
            `;
        }
        
        // 其他设置
        if (otherSettings.length > 0) {
            html += `
                <div class="settings-section card">
                    <h3 data-i18n="MODULE_SPECIFIC_SETTINGS">模块特定设置</h3>
                    <div class="settings-list">
                        ${otherSettings.join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    // 创建设置项
    createSettingItem(key, value) {
        // 获取描述
        const description = this.settingsJson?.descriptions?.[key] || this.getDefaultDescription(key);
        
        // 获取选项
        const options = this.settingsJson?.options?.[key] || [];
        
        // 确定输入类型
        let inputHtml;
        
        if (value === '0' || value === '1') {
            // 布尔值 - 使用开关
            inputHtml = `
                <label class="switch">
                    <input type="checkbox" class="setting-input" data-key="${key}" ${value === '1' ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            `;
        } else if (options.length > 0) {
            // 有预定义选项 - 使用下拉菜单
            const optionsHtml = options.map(option => {
                return `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
            }).join('');
            
            inputHtml = `
                <select class="setting-input" data-key="${key}">
                    ${optionsHtml}
                </select>
            `;
        } else {
            // 默认 - 使用文本输入
            inputHtml = `
                <input type="text" class="setting-input" data-key="${key}" value="${value}">
            `;
        }
        
        // 构建设置项
        return `
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-key">${key}</div>
                    <div class="setting-description">${description}</div>
                </div>
                <div class="setting-control">
                    ${inputHtml}
                </div>
            </div>
        `;
    },
    
    // 获取默认描述
    getDefaultDescription(key) {
        switch (key) {
            case 'print_languages': return '界面语言';
            case 'ANDROID_API': return 'Android API 级别';
            default: return key;
        }
    },
    
    // 添加设置项事件监听器
    addSettingEventListeners() {
        const settingInputs = document.querySelectorAll('.setting-input');
        
        settingInputs.forEach(input => {
            // 对于文本输入，添加防抖
            if (input.type === 'text') {
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        // 可以在这里添加验证逻辑
                    }, 300);
                });
            }
        });
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
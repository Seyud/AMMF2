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
    
    // 可用的配置文件列表
    availableConfigs: [],
    currentConfigName: 'config',
    
    // 初始化
    async init() {
        try {
            // 扫描可用的配置文件
            await this.scanAvailableConfigs();
            
            // 加载配置
            await this.loadConfig();
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            // 使用默认配置
            this.configData = Core.getDefaultConfig();
            return false;
        }
    },
    
    // 扫描可用的配置文件
    async scanAvailableConfigs() {
        try {
            // 获取module_settings目录下的所有.sh文件
            const result = await Core.execCommand(`ls -1 "${Core.MODULE_PATH}module_settings/" | grep "\.sh$"`);
            if (result) {
                const files = result.split('\n').filter(file => file.trim() !== '');
                
                // 过滤出配置文件（排除save-开头的脚本）
                this.availableConfigs = files
                    .filter(file => !file.startsWith('save-') && file.endsWith('.sh'))
                    .map(file => ({
                        name: file.replace('.sh', ''),
                        path: `${Core.MODULE_PATH}module_settings/${file}`
                    }));
                
                console.log('可用配置文件:', this.availableConfigs);
            }
            
            // 如果没有找到配置文件，添加默认的config.sh
            if (this.availableConfigs.length === 0) {
                this.availableConfigs.push({
                    name: 'config',
                    path: this.configPath
                });
            }
        } catch (error) {
            console.error('扫描配置文件失败:', error);
            // 添加默认配置
            this.availableConfigs = [{
                name: 'config',
                path: this.configPath
            }];
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container settings-page">
                <div class="settings-header card">
                    <h2 data-i18n="MODULE_SETTINGS">模块设置</h2>
                    <div class="settings-actions">
                        ${this.renderConfigSelector()}
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
    
    // 渲染配置文件选择器
    renderConfigSelector() {
        if (this.availableConfigs.length <= 1) {
            return '';
        }
        
        let options = '';
        this.availableConfigs.forEach(config => {
            options += `<option value="${config.name}" ${this.currentConfigName === config.name ? 'selected' : ''}>${config.name}</option>`;
        });
        
        return `
            <div class="config-selector">
                <label for="config-file-select" class="config-selector-label" data-i18n="CONFIG_SELECTOR">配置文件</label>
                <select id="config-file-select">
                    ${options}
                </select>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender() {
        // 添加配置文件选择器事件
        const configSelector = document.getElementById('config-file-select');
        if (configSelector) {
            configSelector.addEventListener('change', (e) => {
                this.switchConfig(e.target.value);
            });
        }
        
        // 添加刷新按钮事件
        const refreshButton = document.getElementById('refresh-settings');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadConfig(true);
            });
        }
        
        // 添加保存按钮事件
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveConfig();
            });
        }
        
        // 添加设置项事件
        this.addSettingEventListeners();
    },
    
    // 切换配置文件
    async switchConfig(configName) {
        if (configName === this.currentConfigName) {
            return;
        }
        
        // 查找配置文件
        const configFile = this.availableConfigs.find(config => config.name === configName);
        if (!configFile) {
            console.error(`找不到配置文件: ${configName}`);
            Core.showToast(I18n.translate('CONFIG_NOT_FOUND', '找不到配置文件'), 'error');
            return;
        }
        
        // 更新当前配置
        this.currentConfigName = configName;
        this.configPath = configFile.path;
        this.webConfigPath = `${configName}.sh`;  // 相对于webroot的路径
        
        // 重新加载配置
        await this.loadConfig(true);
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
                // 使用默认配置
                this.configData = Core.getDefaultConfig();
                this.originalConfigContent = '';
                
                // 读取settings.json
                await this.loadSettingsJson();
                
                // 更新UI
                this.updateSettingsUI();
                return;
            }
            
            // 读取配置文件
            const configContent = await Core.readFile(this.configPath);
            if (!configContent) {
                console.error(`无法读取配置文件内容: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                }
                // 使用默认配置
                this.configData = Core.getDefaultConfig();
                this.originalConfigContent = '';
            } else {
                this.originalConfigContent = configContent;
                this.configData = Core.parseConfigFile(configContent);
                console.log('成功解析配置数据:', this.configData);
            }
            
            // 读取settings.json
            await this.loadSettingsJson();
            
            // 更新UI
            this.updateSettingsUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
            }
        } catch (error) {
            console.error('加载配置出错:', error);
            
            // 使用默认配置
            this.configData = Core.getDefaultConfig();
            this.originalConfigContent = '';
            
            // 更新UI
            this.updateSettingsUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
        }
    },
    
    // 新增方法：加载settings.json
    async loadSettingsJson() {
        try {
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
        } catch (error) {
            console.error('加载settings.json出错:', error);
            this.settingsJson = { excluded: [], descriptions: {}, options: {} };
        }
    },
    
    // 新增方法：更新设置UI
    updateSettingsUI() {
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = this.generateSettingsHTML();
            this.addSettingEventListeners();
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
            
            // 检查是否存在对应的save脚本并执行
            await this.runSaveScript();
            
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
            return true;
        } catch (error) {
            console.error('保存配置出错:', error);
            Core.showToast(I18n.translate('SAVE_CONFIG_ERROR', '保存配置失败'), 'error');
            return false;
        }
    },
    
    // 执行保存脚本
    async runSaveScript() {
        try {
            const saveScriptPath = `${Core.MODULE_PATH}module_settings/save-${this.currentConfigName}.sh`;
            
            // 检查保存脚本是否存在
            const exists = await Core.fileExists(saveScriptPath);
            if (!exists) {
                console.log(`没有找到保存脚本: ${saveScriptPath}`);
                return;
            }
            
            // 执行保存脚本
            console.log(`执行保存脚本: ${saveScriptPath}`);
            await Core.execCommand(`sh "${saveScriptPath}"`);
            console.log('保存脚本执行完成');
            
            Core.showToast(I18n.translate('SAVE_SCRIPT_EXECUTED', '已执行保存脚本'));
        } catch (error) {
            console.error('执行保存脚本出错:', error);
            Core.showToast(I18n.translate('SAVE_SCRIPT_ERROR', '执行保存脚本失败'), 'warning');
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
                // 获取原始值格式
                const originalValue = input.getAttribute('data-original-value');
                
                if (originalValue) {
                    // 保持原始格式
                    if (originalValue.includes('"')) {
                        // 带双引号的格式
                        value = input.checked ? '"true"' : '"false"';
                    } else if (originalValue.includes("'")) {
                        // 带单引号的格式
                        value = input.checked ? "'true'" : "'false'";
                    } else if (originalValue === '0' || originalValue === '1') {
                        // 数字格式
                        value = input.checked ? '1' : '0';
                    } else if (originalValue.toLowerCase() === 'yes' || originalValue.toLowerCase() === 'no') {
                        // yes/no 格式
                        value = input.checked ? 'yes' : 'no';
                    } else {
                        // 默认格式
                        value = input.checked ? 'true' : 'false';
                    }
                } else {
                    // 没有原始值信息，使用默认格式
                    value = input.checked ? 'true' : 'false';
                }
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
        let description = this.getDefaultDescription(key);
        
        // 从settings.json获取描述，优先使用当前语言的描述
        if (this.settingsJson?.descriptions?.[key]) {
            const currentLang = I18n.getCurrentLanguage();
            description = this.settingsJson.descriptions[key][currentLang] || 
                          this.settingsJson.descriptions[key].en || 
                          this.settingsJson.descriptions[key].zh || 
                          description;
        }
        
        // 获取选项
        let options = [];
        
        // 从settings.json获取选项
        if (this.settingsJson?.options?.[key]?.options) {
            options = this.settingsJson.options[key].options;
        }
        
        // 清理值中的引号，用于显示和类型判断
        const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
        
        // 确定输入类型
        let inputHtml;
        
        // 处理布尔值 - 检查更多布尔值的形式
        const normalizedValue = value.replace(/"/g, '').replace(/'/g, '').toLowerCase();
        const isBooleanValue = normalizedValue === '0' || normalizedValue === '1' || 
                              normalizedValue === 'true' || normalizedValue === 'false' ||
                              normalizedValue === 'yes' || normalizedValue === 'no';
        
        // 检查是否为数字
        const isNumericValue = !isNaN(normalizedValue) && 
                              !isBooleanValue && 
                              this.settingsJson?.options?.[key]?.type === 'number';
        
        if (isBooleanValue) {
            // 布尔值 - 使用开关
            const isChecked = normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes';
            inputHtml = `
                <label class="switch">
                    <input type="checkbox" class="setting-input" data-key="${key}" data-original-value="${value}" ${isChecked ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            `;
        } else if (isNumericValue) {
            // 数字值 - 使用滑动条或数字输入框
            const numValue = parseFloat(normalizedValue);
            const min = this.settingsJson?.options?.[key]?.min || 0;
            const max = this.settingsJson?.options?.[key]?.max || 100;
            const step = this.settingsJson?.options?.[key]?.step || 1;
            
            inputHtml = `
                <div class="number-input-container">
                    <input type="range" class="setting-input setting-slider" data-key="${key}" 
                           value="${numValue}" min="${min}" max="${max}" step="${step}">
                    <input type="number" class="setting-input setting-number" data-key="${key}" 
                           value="${numValue}" min="${min}" max="${max}" step="${step}">
                </div>
            `;
        } else if (options.length > 0) {
            // 有预定义选项 - 使用下拉菜单
            const currentLang = I18n.getCurrentLanguage();
            const optionsHtml = options.map(option => {
                // 获取选项标签，优先使用当前语言
                let label = option.value;
                if (option.label) {
                    label = option.label[currentLang] || option.label.en || option.label.zh || option.value;
                }
                // 比较时去除引号
                const optionValue = option.value.replace(/^["'](.*)["']$/, '$1');
                const isSelected = cleanValue === optionValue;
                return `<option value="${option.value}" ${isSelected ? 'selected' : ''}>${label}</option>`;
            }).join('');
            
            inputHtml = `
                <select class="setting-input" data-key="${key}">
                    ${optionsHtml}
                </select>
            `;
        } else {
            // 默认 - 使用文本输入，显示时去除引号
            inputHtml = `
                <input type="text" class="setting-input" data-key="${key}" value="${cleanValue}" data-original-value="${value}">
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
            
            // 对于滑动条，同步更新数字输入框
            if (input.type === 'range') {
                input.addEventListener('input', (e) => {
                    const key = e.target.getAttribute('data-key');
                    const numberInput = document.querySelector(`.setting-number[data-key="${key}"]`);
                    if (numberInput) {
                        numberInput.value = e.target.value;
                    }
                });
            }
            
            // 对于数字输入框，同步更新滑动条
            if (input.type === 'number') {
                input.addEventListener('input', (e) => {
                    const key = e.target.getAttribute('data-key');
                    const rangeInput = document.querySelector(`.setting-slider[data-key="${key}"]`);
                    if (rangeInput) {
                        rangeInput.value = e.target.value;
                    }
                });
            }
        });
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
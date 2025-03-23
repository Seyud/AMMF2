/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置
 */

const SettingsPage = {
    // 配置文件路径
    configPath: `${Core.MODULE_PATH}module_settings/config.sh`,
    webConfigPath: 'config.sh',
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
            await this.scanAvailableConfigs();
            await this.loadConfig();
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            this.configData = this.getDefaultConfig();
            return false;
        }
    },
    
    // 扫描可用的配置文件
    async scanAvailableConfigs() {
        try {
            const configsDir = `${Core.MODULE_PATH}module_settings/`;
            
            // 首先检查是否有开发者指定的配置文件
            const mainConfigPath = `${configsDir}config.sh`;
            const mainConfigExists = await Core.execCommand(`[ -f "${mainConfigPath}" ] && echo "true" || echo "false"`);
            
            if (mainConfigExists.trim() === "true") {
                // 读取主配置文件以获取 Module_Config_DEVELOPER 值
                const configContent = await Core.execCommand(`cat "${mainConfigPath}"`);
                const match = configContent.match(/Module_Config_DEVELOPER=["']?(.*?)["']?/);
                
                if (match && match[1] && match[1] !== "None") {
                    const devConfigPath = match[1].startsWith('/') ? match[1] : `${configsDir}${match[1]}`;
                    const devConfigExists = await Core.execCommand(`[ -f "${devConfigPath}" ] && echo "true" || echo "false"`);
                    
                    if (devConfigExists.trim() === "true") {
                        console.log(`找到开发者指定的配置文件: ${devConfigPath}`);
                        // 将开发者配置设为首选
                        const devConfigName = devConfigPath.split('/').pop().replace('.sh', '');
                        this.availableConfigs = [{
                            name: devConfigName,
                            path: devConfigPath
                        }];
                        this.currentConfigName = devConfigName;
                        this.configPath = devConfigPath;
                        this.webConfigPath = `${devConfigName}.sh`;
                        return; // 找到开发者配置后直接返回
                    } else {
                        console.warn(`开发者指定的配置文件不存在: ${devConfigPath}`);
                    }
                }
            }
            
            // 如果没有开发者配置或无法加载，则扫描所有配置文件
            const result = await Core.execCommand(`ls -1 "${configsDir}" | grep "\\.sh$" | grep -v "^save-"`);
            
            this.availableConfigs = [];
            if (!result) {
                console.warn('没有找到配置文件');
                return;
            }
            
            const files = result.split('\n').filter(file => file.trim() !== '');
            this.availableConfigs = files.map(file => ({
                name: file.replace('.sh', ''),
                path: `${configsDir}${file}`
            }));
            
            if (this.availableConfigs.length > 0) {
                const defaultConfig = this.availableConfigs.find(config => config.name === 'config') || this.availableConfigs[0];
                this.currentConfigName = defaultConfig.name;
                this.configPath = defaultConfig.path;
                this.webConfigPath = `${defaultConfig.name}.sh`;
            }
            
            console.log(`找到 ${this.availableConfigs.length} 个配置文件`);
        } catch (error) {
            console.error('扫描配置文件失败:', error);
            this.availableConfigs = [];
        }
    },
    
    // 加载配置
    async loadConfig(showToast = false) {
        try {
            if (!this.configPath) {
                console.error('未设置配置文件路径');
                return false;
            }
            
            const fileExistsResult = await Core.execCommand(`[ -f "${this.configPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.error(`配置文件不存在: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_FILE_NOT_FOUND', '找不到配置文件'), 'error');
                }
                this.configData = this.getDefaultConfig();
                this.originalConfigContent = '';
                await this.loadSettingsJson();
                this.updateSettingsUI();
                return false;
            }
            
            const configContent = await Core.execCommand(`cat "${this.configPath}"`);
            if (!configContent) {
                console.error(`无法读取配置文件: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                }
                this.configData = this.getDefaultConfig();
                this.originalConfigContent = '';
            } else {
                this.originalConfigContent = configContent;
                this.configData = this.parseConfigFile(configContent);
                console.log('配置加载成功:', this.configData);
            }
            
            await this.loadSettingsJson();
            this.updateSettingsUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
            }
            
            return true;
        } catch (error) {
            console.error('加载配置失败:', error);
            this.configData = this.getDefaultConfig();
            this.originalConfigContent = '';
            this.updateSettingsUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
            
            return false;
        }
    },
    
    // 加载settings.json
    async loadSettingsJson() {
        try {
            const fileExistsResult = await Core.execCommand(`[ -f "${this.settingsJsonPath}" ] && echo "true" || echo "false"`);
            if (fileExistsResult.trim() !== "true") {
                console.warn(`设置JSON文件不存在: ${this.settingsJsonPath}`);
                this.settingsJson = null;
                return;
            }
            
            const jsonContent = await Core.execCommand(`cat "${this.settingsJsonPath}"`);
            if (!jsonContent) {
                console.warn('设置JSON文件为空');
                this.settingsJson = null;
                return;
            }
            
            this.settingsJson = JSON.parse(jsonContent);
            
            // 预处理翻译描述，提前准备好当前语言的描述
            if (this.settingsJson.descriptions) {
                const currentLang = I18n.currentLang || 'zh';
                this.processedDescriptions = {};
                
                for (const key in this.settingsJson.descriptions) {
                    const description = this.settingsJson.descriptions[key];
                    this.processedDescriptions[key] = description[currentLang] || description.en || '';
                }
            }
            
            console.log('成功加载设置JSON:', this.settingsJson);
        } catch (error) {
            console.error('加载设置JSON失败:', error);
            this.settingsJson = null;
            this.processedDescriptions = {};
        }
    },
    
    // 保存配置
    async saveConfig() {
        try {
            if (!this.configData) {
                console.error('没有可保存的配置数据');
                Core.showToast(I18n.translate('NO_CONFIG_DATA', '没有可保存的配置数据'), 'error');
                return false;
            }
            
            this.collectFormData();
            const newConfigContent = this.generateConfigContent(this.configData, this.originalConfigContent);
            
            if (newConfigContent === this.originalConfigContent) {
                console.log('配置没有变化，无需保存');
                Core.showToast(I18n.translate('NO_CHANGES', '没有变更需要保存'));
                return true;
            }
            
            // 确保目录存在
            const dirPath = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
            await Core.execCommand(`mkdir -p "${dirPath}"`);
            
            // 使用临时文件方式写入，避免权限问题
            const tempFile = `${dirPath}/temp_config_${Date.now()}.sh`;
            await Core.execCommand(`echo '${newConfigContent.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' > "${tempFile}"`);
            await Core.execCommand(`mv "${tempFile}" "${this.configPath}"`);
            
            // 如果webConfigPath是相对路径，确保它在正确的位置
            if (!this.webConfigPath.startsWith('/')) {
                this.webConfigPath = `${Core.MODULE_PATH}${this.webConfigPath}`;
            }
            await Core.execCommand(`echo '${newConfigContent.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' > "${this.webConfigPath}"`);
            
            this.originalConfigContent = newConfigContent;
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
            
            const scriptExistsResult = await Core.execCommand(`[ -f "${saveScriptPath}" ] && echo "true" || echo "false"`);
            if (scriptExistsResult.trim() !== "true") {
                console.log(`没有找到保存脚本: ${saveScriptPath}`);
                return;
            }
            
            console.log(`执行保存脚本: ${saveScriptPath}`);
            await Core.execCommand(`sh "${saveScriptPath}"`);
            Core.showToast(I18n.translate('SAVE_SCRIPT_EXECUTED', '已执行保存脚本'));
        } catch (error) {
            console.error('执行保存脚本出错:', error);
            Core.showToast(I18n.translate('SAVE_SCRIPT_ERROR', '执行保存脚本失败'), 'warning');
        }
    },
    
    // 切换配置文件
    async switchConfig(configName) {
        if (configName === this.currentConfigName) return;
        
        const configFile = this.availableConfigs.find(config => config.name === configName);
        if (!configFile) {
            console.error(`找不到配置文件: ${configName}`);
            Core.showToast(I18n.translate('CONFIG_NOT_FOUND', '找不到配置文件'), 'error');
            return;
        }
        
        this.currentConfigName = configName;
        this.configPath = configFile.path;
        this.webConfigPath = `${configName}.sh`;
        
        await this.loadConfig(true);
    },
    
    // 获取默认配置
    getDefaultConfig() {
        return {
            ENABLED: "true",
            DEBUG: "false"
        };
    },
    
    // 解析配置文件
    parseConfigFile(content) {
        const config = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            // 修改正则表达式，更好地处理引号内的值
            const match = line.match(/^([A-Za-z0-9_]+)=["']?(.*?)["']?$/);
            if (match) {
                const [, key, value] = match;
                // 去除可能的注释
                const valueWithoutComment = value.split('#')[0].trim();
                config[key] = valueWithoutComment;
            }
        }
        
        return config;
    },
    
    // 生成配置文件内容
    generateConfigContent(config, originalContent) {
        if (originalContent) {
            const lines = originalContent.split('\n');
            let result = '';
            
            for (const line of lines) {
                if (line.trim().startsWith('#') || line.trim() === '') {
                    result += line + '\n';
                    continue;
                }
                
                const match = line.match(/^([A-Za-z0-9_]+)=["']?([^"']*)["']?$/);
                if (match) {
                    const [, key] = match;
                    if (config[key] !== undefined) {
                        const hasQuotes = line.includes('"') || line.includes("'");
                        const quoteChar = line.includes('"') ? '"' : (line.includes("'") ? "'" : '');
                        result += `${key}=${quoteChar}${config[key]}${quoteChar}\n`;
                    } else {
                        result += line + '\n';
                    }
                } else {
                    result += line + '\n';
                }
            }
            
            return result.trim();
        }
        
        let result = '#!/bin/sh\n# AMMF 模块配置文件\n# 由 WebUI 生成\n\n';
        for (const [key, value] of Object.entries(config)) {
            result += `${key}="${value}"\n`;
        }
        
        return result.trim();
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
        if (this.availableConfigs.length <= 1) return '';
        
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
    
    // 生成设置HTML
    generateSettingsHTML() {
        if (!this.configData || Object.keys(this.configData).length === 0) {
            return '<div class="settings-placeholder" data-i18n="NO_SETTINGS">没有可用的设置</div>';
        }
        
        let html = '<div class="settings-list">';
        
        // 如果有settings.json，使用它来生成更丰富的设置界面
        if (this.settingsJson && this.settingsJson.settings) {
            html += this.generateStructuredSettingsHTML();
        } else {
            // 否则使用简单的键值对列表
            html += this.generateSimpleSettingsHTML();
        }
        
        html += '</div>';
        return html;
    },
    
    // 生成结构化的设置HTML（基于settings.json）
    generateStructuredSettingsHTML() {
        let html = '';
        
        // 按照sections分组显示设置
        if (this.settingsJson.sections && Array.isArray(this.settingsJson.sections)) {
            this.settingsJson.sections.forEach(section => {
                html += `
                    <div class="settings-section">
                        <h3>${section.title || '设置'}</h3>
                        ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                        <div class="settings-list">
                    `;
                    
                    // 处理该section下的设置项
                    if (section.settings && Array.isArray(section.settings)) {
                        section.settings.forEach(setting => {
                            if (setting.key && this.configData[setting.key] !== undefined) {
                                html += this.generateSettingItemHTML(setting);
                            }
                        });
                    }
                    
                    html += `
                            </div>
                        </div>
                    `;
                });
            } else if (this.settingsJson.settings && Array.isArray(this.settingsJson.settings)) {
                // 如果没有sections，直接显示settings
                this.settingsJson.settings.forEach(setting => {
                    if (setting.key && this.configData[setting.key] !== undefined) {
                        html += this.generateSettingItemHTML(setting);
                    }
                });
            }
            
            return html;
        },
    
    // 生成简单的设置HTML（基于configData）
    generateSimpleSettingsHTML() {
        let html = '';
        
        // 按字母顺序排序键
        const sortedKeys = Object.keys(this.configData).sort();
        
        // 获取排除列表
        const excludedKeys = this.settingsJson && this.settingsJson.excluded ? this.settingsJson.excluded : [];
        
        sortedKeys.forEach(key => {
            // 跳过排除列表中的键
            if (excludedKeys.includes(key)) return;
            
            const value = this.configData[key];
            
            html += `
                <div class="setting-item">
                    <div class="setting-info">
                        <div class="setting-key">${key}</div>
                        ${this.getSettingDescription(key)}
                    </div>
                    <div class="setting-control">
                        ${this.generateControlHTML(key, value)}
                    </div>
                </div>
            `;
        });
        
        return html;
    },
    
    // 获取设置描述
    getSettingDescription(key) {
        // 使用预处理的描述
        if (this.processedDescriptions && this.processedDescriptions[key]) {
            return `<div class="setting-description">${this.processedDescriptions[key]}</div>`;
        }
        
        // 回退到原始方法
        if (this.settingsJson && this.settingsJson.descriptions && this.settingsJson.descriptions[key]) {
            const description = this.settingsJson.descriptions[key];
            const lang = I18n.currentLang || 'zh';
            const text = description[lang] || description.en || '';
            if (text) {
                return `<div class="setting-description">${text}</div>`;
            }
        }
        return '';
    },
    
    // 生成设置项HTML
    generateSettingItemHTML(setting) {
        const { key, title, description, type } = setting;
        const value = this.configData[key];
        
        return `
            <div class="setting-item" data-key="${key}">
                <div class="setting-info">
                    <div class="setting-key">${title || key}</div>
                    ${description ? `<div class="setting-description">${description}</div>` : ''}
                </div>
                <div class="setting-control">
                    ${this.generateControlHTML(key, value, type)}
                </div>
            </div>
        `;
    },
    
    // 生成控件HTML
    generateControlHTML(key, value, type = 'auto') {
        // 获取当前语言
        const currentLang = I18n ? I18n.currentLang || 'zh' : 'zh';
        
        // 如果类型是auto，根据值自动判断类型
        if (type === 'auto') {
            if (value === 'true' || value === 'false') {
                type = 'boolean';
            } else if (!isNaN(value) && value.trim() !== '') {
                type = 'number';
            } else {
                type = 'text';
            }
        }
        
        // 检查settings.json中是否有该键的选项配置
        let options = null;
        if (this.settingsJson && this.settingsJson.options && this.settingsJson.options[key]) {
            options = this.settingsJson.options[key].options;
        }
        
        switch (type) {
            case 'boolean':
                return `
                    <label class="switch">
                        <input type="checkbox" class="setting-input" data-key="${key}" ${value === 'true' ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                `;
            case 'number':
                return `<input type="number" class="setting-input" data-key="${key}" value="${value}">`;
            case 'select':
                if (options) {
                    let optionsHtml = '';
                    options.forEach(option => {
                        const label = option.label && option.label[currentLang] ? 
                                     option.label[currentLang] : 
                                     (option.label && option.label.en ? option.label.en : option.value);
                        optionsHtml += `<option value="${option.value}" ${value === option.value ? 'selected' : ''}>${label}</option>`;
                    });
                    return `<select class="setting-input" data-key="${key}">${optionsHtml}</select>`;
                }
                // 如果没有选项，回退到文本输入
                return `<input type="text" class="setting-input" data-key="${key}" value="${value}">`;
            case 'textarea':
                return `<textarea class="setting-input" data-key="${key}" rows="3">${value}</textarea>`;
            case 'text':
            default:
                return `<input type="text" class="setting-input" data-key="${key}" value="${value}">`;
        }
    },
    
    // 更新设置UI
    updateSettingsUI() {
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = this.generateSettingsHTML();
        }
        
        // 移除旧的事件监听器（通过替换元素）
        const refreshButton = document.getElementById('refresh-settings');
        if (refreshButton) {
            const newRefreshButton = refreshButton.cloneNode(true);
            refreshButton.parentNode.replaceChild(newRefreshButton, refreshButton);
            newRefreshButton.addEventListener('click', () => {
                this.loadConfig(true);
            });
        }
        
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            const newSaveButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);
            newSaveButton.addEventListener('click', () => {
                this.saveConfig();
            });
        }
        
        // 添加配置选择器事件
        const configSelector = document.getElementById('config-file-select');
        if (configSelector) {
            const newConfigSelector = configSelector.cloneNode(true);
            configSelector.parentNode.replaceChild(newConfigSelector, configSelector);
            newConfigSelector.addEventListener('change', (e) => {
                this.switchConfig(e.target.value);
            });
        }
        
        // 添加设置事件监听器
        this.addSettingEventListeners();
    },
    
    // 收集表单数据
    collectFormData() {
        const settingInputs = document.querySelectorAll('.setting-input');
        settingInputs.forEach(input => {
            const key = input.getAttribute('data-key');
            if (key) {
                if (input.type === 'checkbox') {
                    this.configData[key] = input.checked ? 'true' : 'false';
                } else {
                    this.configData[key] = input.value;
                }
            }
        });
    },
    
    // 添加设置事件监听器
    addSettingEventListeners() {
        const settingInputs = document.querySelectorAll('.setting-input');
        settingInputs.forEach(input => {
            // 为不同类型的输入添加适当的事件监听器
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => {
                    const key = input.getAttribute('data-key');
                    if (key) {
                        this.configData[key] = input.checked ? 'true' : 'false';
                    }
                });
            } else if (input.tagName === 'SELECT') {
                input.addEventListener('change', () => {
                    const key = input.getAttribute('data-key');
                    if (key) {
                        this.configData[key] = input.value;
                    }
                });
            } else {
                // 文本、数字和文本区域输入
                input.addEventListener('input', () => {
                    const key = input.getAttribute('data-key');
                    if (key) {
                        this.configData[key] = input.value;
                    }
                });
            }
        });
    },
    
    // 渲染后的回调
    afterRender() {
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
        
        // 添加配置选择器事件
        const configSelector = document.getElementById('config-file-select');
        if (configSelector) {
            configSelector.addEventListener('change', (e) => {
                this.switchConfig(e.target.value);
            });
        }
        
        // 监听语言变更事件
        document.addEventListener('languageChanged', () => {
            // 重新处理描述
            if (this.settingsJson && this.settingsJson.descriptions) {
                const currentLang = I18n.currentLang || 'zh';
                this.processedDescriptions = {};
                
                for (const key in this.settingsJson.descriptions) {
                    const description = this.settingsJson.descriptions[key];
                    this.processedDescriptions[key] = description[currentLang] || description.en || '';
                }
                
                // 更新UI
                this.updateSettingsUI();
            }
        });
    },
    
    // 导入配置
    async importConfig() {
        try {
            // 创建文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.sh,.conf,.txt';
            
            // 监听文件选择
            fileInput.addEventListener('change', async (e) => {
                if (e.target.files.length === 0) return;
                
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = async (event) => {
                    try {
                        const content = event.target.result;
                        
                        // 解析导入的配置
                        const importedConfig = this.parseConfigFile(content);
                        
                        // 合并配置
                        this.configData = { ...this.configData, ...importedConfig };
                        this.originalConfigContent = content;
                        
                        // 更新UI
                        this.updateSettingsUI();
                        
                        Core.showToast(I18n.translate('CONFIG_IMPORTED', '配置已导入，请保存以应用更改'));
                    } catch (error) {
                        console.error('解析导入的配置失败:', error);
                        Core.showToast(I18n.translate('CONFIG_IMPORT_PARSE_ERROR', '解析导入的配置失败'), 'error');
                    }
                };
                
                reader.onerror = () => {
                    Core.showToast(I18n.translate('CONFIG_IMPORT_READ_ERROR', '读取导入的配置失败'), 'error');
                };
                
                reader.readAsText(file);
            });
            
            // 触发文件选择对话框
            fileInput.click();
        } catch (error) {
            console.error('导入配置失败:', error);
            Core.showToast(I18n.translate('CONFIG_IMPORT_ERROR', '导入配置失败'), 'error');
        }
    },
    
    // 导出配置
    exportConfig() {
        try {
            if (!this.originalConfigContent) {
                Core.showToast(I18n.translate('NO_CONFIG_TO_EXPORT', '没有可导出的配置'), 'warning');
                return;
            }
            
            // 收集当前表单数据
            this.collectFormData();
            
            // 生成配置内容
            const configContent = this.generateConfigContent(this.configData, this.originalConfigContent);
            
            // 创建Blob对象
            const blob = new Blob([configContent], { type: 'text/plain' });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentConfigName + '.sh';
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            Core.showToast(I18n.translate('CONFIG_EXPORTED', '配置已导出'));
        } catch (error) {
            console.error('导出配置失败:', error);
            Core.showToast(I18n.translate('CONFIG_EXPORT_ERROR', '导出配置失败'), 'error');
        }
    },
    
    // 重置配置
    async resetConfig() {
        try {
            // 确认对话框
            if (!confirm(I18n.translate('CONFIRM_RESET_CONFIG', '确定要重置配置吗？此操作不可撤销。'))) {
                return;
            }
            
            // 重置为默认配置
            this.configData = this.getDefaultConfig();
            
            // 更新UI
            this.updateSettingsUI();
            
            Core.showToast(I18n.translate('CONFIG_RESET', '配置已重置为默认值，请保存以应用更改'));
        } catch (error) {
            console.error('重置配置失败:', error);
            Core.showToast(I18n.translate('CONFIG_RESET_ERROR', '重置配置失败'), 'error');
        }
    },
    
    // 页面激活时的回调
    onActivate() {
        // 刷新配置
        this.loadConfig();
    },
    
    // 页面停用时的回调
    onDeactivate() {
        // 检查是否有未保存的更改
        if (this.hasUnsavedChanges()) {
            const confirmed = confirm(I18n.translate('UNSAVED_CHANGES', '有未保存的更改，确定要离开吗？'));
            if (!confirmed) {
                // 如果用户取消，阻止页面切换
                return false;
            }
        }
        return true;
    },
    
    // 检查是否有未保存的更改
    hasUnsavedChanges() {
        // 收集当前表单数据
        this.collectFormData();
        
        // 生成新的配置内容
        const newConfigContent = this.generateConfigContent(this.configData, this.originalConfigContent);
        
        // 比较新旧配置内容
        return newConfigContent !== this.originalConfigContent;
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
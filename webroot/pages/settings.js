/**
 * AMMF WebUI 设置页面模块
 * 简化版 - 专注于配置文件管理
 */

const SettingsPage = {
    // 基础配置
    configPath: `${Core.MODULE_PATH}module_settings/config.sh`,
    settingsJsonPath: `${Core.MODULE_PATH}module_settings/settings.json`,
    configData: {},
    settingsJson: null,
    availableConfigs: [],
    currentConfigName: 'config',
    
    // 初始化
    async init() {
        try {
            await this.scanConfigs();
            await this.loadConfig();
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            this.configData = { ENABLED: "true", DEBUG: "false" };
            return false;
        }
    },
    
    // 扫描可用配置文件
    async scanConfigs() {
        try {
            const configsDir = `${Core.MODULE_PATH}module_settings/`;
            const mainConfigPath = `${configsDir}config.sh`;
            
            // 检查主配置文件是否存在
            if (await this.fileExists(mainConfigPath)) {
                // 检查开发者配置
                const configContent = await Core.execCommand(`cat "${mainConfigPath}"`);
                const match = configContent.match(/Module_Config_DEVELOPER=["']?(.*?)["']?/);
                
                if (match && match[1] && match[1] !== "None") {
                    const devConfigPath = match[1].startsWith('/') ? match[1] : `${configsDir}${match[1]}`;
                    
                    if (await this.fileExists(devConfigPath)) {
                        console.log(`找到开发者配置: ${devConfigPath}`);
                        const devConfigName = devConfigPath.split('/').pop().replace('.sh', '');
                        this.availableConfigs = [{ name: devConfigName, path: devConfigPath }];
                        this.currentConfigName = devConfigName;
                        this.configPath = devConfigPath;
                        return;
                    }
                }
            }
            
            // 扫描所有配置文件
            const result = await Core.execCommand(`ls -1 "${configsDir}" | grep "\\.sh$" | grep -v "^save-"`);
            
            if (!result) {
                console.warn('没有找到配置文件');
                this.availableConfigs = [];
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
            }
        } catch (error) {
            console.error('扫描配置文件失败:', error);
            this.availableConfigs = [];
        }
    },
    
    // 检查文件是否存在
    async fileExists(path) {
        const result = await Core.execCommand(`[ -f "${path}" ] && echo "true" || echo "false"`);
        return result.trim() === "true";
    },
    
    // 加载配置
    async loadConfig(showToast = false) {
        try {
            if (!this.configPath) {
                console.error('未设置配置文件路径');
                return false;
            }
            
            if (!await this.fileExists(this.configPath)) {
                console.error(`配置文件不存在: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_FILE_NOT_FOUND', '找不到配置文件'), 'error');
                }
                this.configData = { ENABLED: "true", DEBUG: "false" };
                await this.loadSettingsJson();
                this.updateUI();
                return false;
            }
            
            const configContent = await Core.execCommand(`cat "${this.configPath}"`);
            if (!configContent) {
                console.error(`无法读取配置文件: ${this.configPath}`);
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                }
                this.configData = { ENABLED: "true", DEBUG: "false" };
            } else {
                this.configData = this.parseConfig(configContent);
                this.originalContent = configContent;
            }
            
            await this.loadSettingsJson();
            this.updateUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
            }
            
            return true;
        } catch (error) {
            console.error('加载配置失败:', error);
            this.configData = { ENABLED: "true", DEBUG: "false" };
            this.updateUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
            
            return false;
        }
    },
    
    // 加载settings.json
    async loadSettingsJson() {
        try {
            if (!await this.fileExists(this.settingsJsonPath)) {
                this.settingsJson = null;
                return;
            }
            
            const jsonContent = await Core.execCommand(`cat "${this.settingsJsonPath}"`);
            if (!jsonContent) {
                this.settingsJson = null;
                return;
            }
            
            this.settingsJson = JSON.parse(jsonContent);
            
            // 预处理描述
            if (this.settingsJson.descriptions) {
                const currentLang = I18n.currentLang || 'zh';
                this.descriptions = {};
                
                for (const key in this.settingsJson.descriptions) {
                    const description = this.settingsJson.descriptions[key];
                    this.descriptions[key] = description[currentLang] || description.en || '';
                }
            }
        } catch (error) {
            console.error('加载设置JSON失败:', error);
            this.settingsJson = null;
            this.descriptions = {};
        }
    },
    
    // 解析配置文件
    parseConfig(content) {
        const config = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim().startsWith('#') || line.trim() === '') continue;
            
            const match = line.match(/^([A-Za-z0-9_]+)=["']?(.*?)["']?(\s*#.*)?$/);
            if (match) {
                const [, key, value] = match;
                config[key] = value.trim();
            }
        }
        
        return config;
    },
    
    // 生成配置文件内容
    generateConfigContent() {
        if (this.originalContent) {
            const lines = this.originalContent.split('\n');
            let result = '';
            let processedKeys = new Set();
            
            for (const line of lines) {
                if (line.trim().startsWith('#') || line.trim() === '') {
                    result += line + '\n';
                    continue;
                }
                
                const match = line.match(/^([A-Za-z0-9_]+)=["']?(.*?)["']?(\s*#.*)?$/);
                if (match) {
                    const [, key, , comment] = match;
                    if (this.configData[key] !== undefined) {
                        const hasQuotes = line.includes('"') || line.includes("'");
                        const quoteChar = line.includes("'") ? "'" : '"';
                        const commentStr = comment || '';
                        const needQuotes = this.configData[key].includes(' ') || hasQuotes;
                        
                        if (needQuotes) {
                            result += `${key}=${quoteChar}${this.configData[key]}${quoteChar}${commentStr}\n`;
                        } else {
                            result += `${key}=${this.configData[key]}${commentStr}\n`;
                        }
                        
                        processedKeys.add(key);
                    } else {
                        result += line + '\n';
                    }
                } else {
                    result += line + '\n';
                }
            }
            
            // 添加新的配置项
            for (const key in this.configData) {
                if (!processedKeys.has(key)) {
                    const needQuotes = this.configData[key].includes(' ');
                    if (needQuotes) {
                        result += `${key}="${this.configData[key]}"\n`;
                    } else {
                        result += `${key}=${this.configData[key]}\n`;
                    }
                }
            }
            
            return result.trim();
        }
        
        // 创建新配置文件
        let result = '#!/bin/sh\n# AMMF 模块配置文件\n# 由 WebUI 生成\n\n';
        for (const [key, value] of Object.entries(this.configData)) {
            const needQuotes = value.includes(' ');
            if (needQuotes) {
                result += `${key}="${value}"\n`;
            } else {
                result += `${key}=${value}\n`;
            }
        }
        
        return result.trim();
    },
    
    // 保存配置
    async saveConfig() {
        try {
            if (!this.configData || Object.keys(this.configData).length === 0) {
                Core.showToast(I18n.translate('NO_CONFIG_DATA', '没有可保存的配置数据'), 'error');
                return false;
            }
            
            // 收集表单数据
            this.collectFormData();
            
            const newContent = this.generateConfigContent();
            
            // 确保目录存在
            const dirPath = this.configPath.substring(0, this.configPath.lastIndexOf('/'));
            await Core.execCommand(`mkdir -p "${dirPath}"`);
            
            // 写入配置
            const tempFile = `${dirPath}/temp_config_${Date.now()}.sh`;
            await Core.execCommand(`echo '${newContent.replace(/'/g, "'\\''").replace(/\n/g, "\\n")}' > "${tempFile}"`);
            await Core.execCommand(`mv "${tempFile}" "${this.configPath}"`);
            
            this.originalContent = newContent;
            
            // 执行保存脚本
            const saveScriptPath = `${Core.MODULE_PATH}module_settings/save-${this.currentConfigName}.sh`;
            if (await this.fileExists(saveScriptPath)) {
                await Core.execCommand(`sh "${saveScriptPath}"`);
            }
            
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
            return true;
        } catch (error) {
            console.error('保存配置出错:', error);
            Core.showToast(I18n.translate('SAVE_CONFIG_ERROR', '保存配置失败'), 'error');
            return false;
        }
    },
    
    // 切换配置文件
    async switchConfig(configName) {
        if (configName === this.currentConfigName) return;
        
        const configFile = this.availableConfigs.find(config => config.name === configName);
        if (!configFile) {
            Core.showToast(I18n.translate('CONFIG_NOT_FOUND', '找不到配置文件'), 'error');
            return;
        }
        
        this.currentConfigName = configName;
        this.configPath = configFile.path;
        
        await this.loadConfig(true);
    },
    
    // 收集表单数据
    collectFormData() {
        document.querySelectorAll('.setting-input').forEach(input => {
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
    
    // 更新UI
    updateUI() {
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = this.generateHTML();
        }
        
        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-settings');
        if (refreshBtn) {
            const newBtn = refreshBtn.cloneNode(true);
            refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
            newBtn.addEventListener('click', () => this.loadConfig(true));
        }
        
        // 保存按钮
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            const newBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newBtn, saveBtn);
            newBtn.addEventListener('click', () => this.saveConfig());
        }
        
        // 配置选择器
        const configSelector = document.getElementById('config-selector');
        if (configSelector) {
            const newSelector = configSelector.cloneNode(true);
            configSelector.parentNode.replaceChild(newSelector, configSelector);
            newSelector.addEventListener('change', (e) => this.switchConfig(e.target.value));
        }
        
        // 添加设置事件监听器
        this.addSettingListeners();
    },
    
    // 添加设置事件监听器
    addSettingListeners() {
        document.querySelectorAll('.setting-input').forEach(input => {
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => {
                    const key = input.getAttribute('data-key');
                    if (key) this.configData[key] = input.checked ? 'true' : 'false';
                });
            } else {
                input.addEventListener('input', () => {
                    const key = input.getAttribute('data-key');
                    if (key) this.configData[key] = input.value;
                });
            }
        });
    },
    
    // 生成设置HTML
    generateHTML() {
        if (!this.configData || Object.keys(this.configData).length === 0) {
            return '<div class="settings-placeholder" data-i18n="NO_SETTINGS">没有可用的设置</div>';
        }
        
        let html = '<div class="settings-list">';
        
        // 使用settings.json生成结构化设置
        if (this.settingsJson && this.settingsJson.settings) {
            html += this.generateSimpleHTML();
        }
        
        html += '</div>';
        return html;
    },
    
    // 生成结构化设置HTML
    generateStructuredHTML() {
        let html = '';
        
        // 按照sections分组显示设置
        if (this.settingsJson.sections && Array.isArray(this.settingsJson.sections)) {
            this.settingsJson.sections.forEach(section => {
                html += `
                    <div class="settings-section">
                        <h3>${section.title || '设置'}</h3>
                        ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                        <div class="settings-group">
                `;
                
                if (section.settings && Array.isArray(section.settings)) {
                    section.settings.forEach(setting => {
                        if (setting.key && this.configData[setting.key] !== undefined) {
                            html += this.generateSettingItem(setting);
                        }
                    });
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
        } else if (this.settingsJson.settings && Array.isArray(this.settingsJson.settings)) {
            html += '<div class="settings-group">';
            this.settingsJson.settings.forEach(setting => {
                if (setting.key && this.configData[setting.key] !== undefined) {
                    html += this.generateSettingItem(setting);
                }
            });
            html += '</div>';
        }
        
        return html;
    },
    
    // 生成简单设置HTML
    generateSimpleHTML() {
        let html = '<div class="settings-group">';
        
        // 按字母顺序排序键
        const sortedKeys = Object.keys(this.configData).sort();
        const excludedKeys = this.settingsJson && this.settingsJson.excluded ? this.settingsJson.excluded : [];
        
        sortedKeys.forEach(key => {
            if (excludedKeys.includes(key)) return;
            
            const value = this.configData[key];
            html += `
                <div class="setting-item" data-key="${key}">
                    <div class="setting-info">
                        <div class="setting-key">${key}</div>
                        ${this.getDescription(key)}
                    </div>
                    <div class="setting-control">
                        ${this.generateControl(key, value)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    // 生成设置项
    generateSettingItem(setting) {
        const { key, title, type } = setting;
        const value = this.configData[key];
        
        return `
            <div class="setting-item" data-key="${key}">
                <div class="setting-info">
                    <div class="setting-key">${title || key}</div>
                    ${this.getDescription(key)}
                </div>
                <div class="setting-control">
                    ${this.generateControl(key, value, type)}
                </div>
            </div>
        `;
    },
    
    // 获取设置描述
    getDescription(key) {
        if (this.descriptions && this.descriptions[key]) {
            return `<div class="setting-description">${this.descriptions[key]}</div>`;
        }
        return '';
    },
    
    // 生成控件HTML
    generateControl(key, value, type = 'auto') {
        // 自动判断类型
        if (type === 'auto') {
            if (value === 'true' || value === 'false') {
                type = 'boolean';
            } else if (!isNaN(value) && value.trim() !== '') {
                type = 'number';
            } else {
                type = 'text';
            }
        }
        
        // 检查是否有选项配置
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
                const min = options && options.min !== undefined ? options.min : '';
                const max = options && options.max !== undefined ? options.max : '';
                const step = options && options.step !== undefined ? options.step : '1';
                
                if (min !== '' && max !== '') {
                    return `
                        <div class="number-control">
                            <input type="range" class="setting-slider setting-input" data-key="${key}" 
                                min="${min}" max="${max}" step="${step}" value="${value}">
                            <input type="number" class="setting-input setting-number" 
                                data-key="${key}" value="${value}" min="${min}" max="${max}" step="${step}">
                        </div>
                    `;
                }
                
                return `<input type="number" class="setting-input" data-key="${key}" value="${value}" ${min ? `min="${min}"` : ''} ${max ? `max="${max}"` : ''} ${step ? `step="${step}"` : ''}>`;
            case 'select':
                if (options && Array.isArray(options)) {
                    let optionsHtml = '';
                    const currentLang = I18n.currentLang || 'zh';
                    
                    options.forEach(option => {
                        const label = option.label && option.label[currentLang] ? 
                                     option.label[currentLang] : 
                                     (option.label && option.label.en ? option.label.en : option.value);
                        optionsHtml += `<option value="${option.value}" ${value === option.value ? 'selected' : ''}>${label}</option>`;
                    });
                    return `<select class="setting-input" data-key="${key}">${optionsHtml}</select>`;
                }
                return `<input type="text" class="setting-input" data-key="${key}" value="${value}">`;
            case 'textarea':
                return `<textarea class="setting-input" data-key="${key}" rows="3">${value}</textarea>`;
            case 'text':
            default:
                return `<input type="text" class="setting-input" data-key="${key}" value="${value}">`;
        }
    },
    
    // 渲染页面
    render() {
        // 配置选择器
        let configSelector = '';
        if (this.availableConfigs.length > 1) {
            let options = '';
            this.availableConfigs.forEach(config => {
                options += `<option value="${config.name}" ${this.currentConfigName === config.name ? 'selected' : ''}>${config.name}</option>`;
            });
            
            configSelector = `
                <div class="config-selector-container">
                    <select id="config-selector">${options}</select>
                </div>
            `;
        }
        
        return `
            <div class="page-container settings-page">
                <div class="settings-header card">
                    <h2 data-i18n="MODULE_SETTINGS">模块设置</h2>
                    <div class="settings-actions">
                        ${configSelector}
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
                    ${this.generateHTML()}
                </div>
            </div>
        `;
    }
};

// 导出模块
window.SettingsPage = SettingsPage;
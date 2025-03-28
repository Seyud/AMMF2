/**
 * AMMF WebUI 设置页面模块
 * 简化版 - 优化界面和配置文件管理
 */

const SettingsPage = {
    // 基础配置
    configPath: `${Core.MODULE_PATH}module_settings/config.sh`,
    settingsJsonPath: `${Core.MODULE_PATH}module_settings/settings.json`,
    configData: {},
    settingsJson: null,
    availableConfigs: [],
    currentConfigName: 'config',
    isLoading: false,
    
    // 初始化
    async init() {
        try {
            this.isLoading = true;
            await this.scanConfigs();
            await this.loadConfig();
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            this.configData = { ENABLED: "true", DEBUG: "false" };
            this.isLoading = false;
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
                const match = configContent.match(/Module_Config_DEVELOPER=["']?(.*?)["']?(\s*#.*)?$/m);
                
                if (match && match[1] && match[1] !== "None" && match[1].trim() !== "") {
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
            this.configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            this.currentConfigName = 'config';
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
            this.isLoading = true;
            this.updateLoadingState(true);
            
            if (!this.configPath || !await this.fileExists(this.configPath)) {
                if (showToast) {
                    Core.showToast(I18n.translate('CONFIG_FILE_NOT_FOUND', '找不到配置文件'), 'error');
                }
                this.configData = { ENABLED: "true", DEBUG: "false" };
            } else {
                const configContent = await Core.execCommand(`cat "${this.configPath}"`);
                if (!configContent) {
                    this.configData = { ENABLED: "true", DEBUG: "false" };
                    if (showToast) {
                        Core.showToast(I18n.translate('CONFIG_READ_ERROR', '读取配置文件失败'), 'error');
                    }
                } else {
                    this.configData = this.parseConfig(configContent);
                    this.originalContent = configContent;
                    if (showToast) {
                        Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
                    }
                }
            }
            
            await this.loadSettingsJson();
            this.updateUI();
            
            this.isLoading = false;
            this.updateLoadingState(false);
            return true;
        } catch (error) {
            console.error('加载配置失败:', error);
            this.configData = { ENABLED: "true", DEBUG: "false" };
            this.updateUI();
            
            if (showToast) {
                Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置时出错'), 'error');
            }
            
            this.isLoading = false;
            this.updateLoadingState(false);
            return false;
        }
    },
    
    // 更新加载状态
    updateLoadingState(isLoading) {
        const settingsContent = document.querySelector('.settings-content');
        const loadingOverlay = document.querySelector('.settings-loading-overlay');
        
        if (isLoading) {
            if (!loadingOverlay && settingsContent) {
                const overlay = document.createElement('div');
                overlay.className = 'settings-loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${I18n.translate('LOADING_SETTINGS', '加载设置中...')}</div>
                `;
                settingsContent.appendChild(overlay);
            }
        } else {
            if (loadingOverlay) {
                loadingOverlay.remove();
            }
        }
        
        // 更新按钮状态
        const refreshBtn = document.getElementById('refresh-settings');
        const saveBtn = document.getElementById('save-settings');
        const configSelector = document.getElementById('config-selector');
        
        if (refreshBtn) refreshBtn.disabled = isLoading;
        if (saveBtn) saveBtn.disabled = isLoading;
        if (configSelector) configSelector.disabled = isLoading;
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
            const trimmedLine = line.trim();
            if (trimmedLine === '' || trimmedLine.startsWith('#')) continue;
            
            const regex = /^([A-Za-z0-9_]+)=(?:["']([^"']*)["']|([^#\s][^#]*?))(?:\s*#.*)?$/;
            const match = trimmedLine.match(regex);
            
            if (match) {
                const key = match[1];
                const value = (match[2] !== undefined) ? match[2] : match[3];
                
                if (value !== undefined) {
                    config[key] = value.trim();
                }
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
                const trimmedLine = line.trim();
                if (trimmedLine === '' || trimmedLine.startsWith('#')) {
                    result += line + '\n';
                    continue;
                }
                
                const regex = /^([A-Za-z0-9_]+)=(?:["']([^"']*)["']|([^#\s][^#]*?))(?:\s*#.*)?$/;
                const match = trimmedLine.match(regex);
                
                if (match) {
                    const key = match[1];
                    const commentMatch = line.match(/#.*$/);
                    const comment = commentMatch ? commentMatch[0] : '';
                    
                    if (this.configData[key] !== undefined) {
                        const hasQuotes = line.includes('"') || line.includes("'");
                        const quoteChar = line.includes("'") ? "'" : '"';
                        
                        const needQuotes = this.configData[key].includes(' ') || 
                                          this.configData[key].includes('#') || 
                                          hasQuotes;
                        
                        if (needQuotes) {
                            result += `${key}=${quoteChar}${this.configData[key]}${quoteChar}${comment ? ' ' + comment : ''}\n`;
                        } else {
                            result += `${key}=${this.configData[key]}${comment ? ' ' + comment : ''}\n`;
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
                    const needQuotes = this.configData[key].includes(' ') || 
                                      this.configData[key].includes('#');
                    
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
            const needQuotes = value.includes(' ') || value.includes('#');
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
        if (this.isLoading) return false;
        
        try {
            this.isLoading = true;
            this.updateLoadingState(true);
            
            if (!this.configData || Object.keys(this.configData).length === 0) {
                Core.showToast(I18n.translate('NO_CONFIG_DATA', '没有可保存的配置数据'), 'error');
                this.isLoading = false;
                this.updateLoadingState(false);
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
            this.isLoading = false;
            this.updateLoadingState(false);
            return true;
        } catch (error) {
            console.error('保存配置出错:', error);
            Core.showToast(I18n.translate('SAVE_CONFIG_ERROR', '保存配置失败'), 'error');
            this.isLoading = false;
            this.updateLoadingState(false);
            return false;
        }
    },
    
    // 切换配置文件
    async switchConfig(configName) {
        if (this.isLoading || configName === this.currentConfigName) return;
        
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
                } else if (input.type === 'number' || input.type === 'range') {
                    this.configData[key] = input.value.toString();
                } else {
                    this.configData[key] = input.value;
                }
            }
        });
    },
    
    // 生成设置HTML
    generateHTML() {
        if (!this.configData || Object.keys(this.configData).length === 0) {
            return '<div class="settings-placeholder">没有可用的设置</div>';
        }
        
        let html = `
            <div class="settings-search-container">
                <div class="search-input-wrapper">
                    <span class="material-symbols-rounded">search</span>
                    <input type="text" id="settings-search" placeholder="${I18n.translate('SEARCH_SETTINGS', '搜索设置...')}">
                    <button id="clear-search" class="clear-search">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>
            </div>
            <div class="no-search-results" style="display:none;">
                <span class="material-symbols-rounded">search_off</span>
                <p>没有找到匹配的设置</p>
            </div>
            <div class="settings-list">
        `;
        
        // 使用settings.json生成结构化设置
        if (this.settingsJson && this.settingsJson.settings) {
            html += this.generateStructuredHTML();
        } else {
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
                        <div class="section-title">
                            <h3>${section.title || '设置'}</h3>
                            <span class="material-symbols-rounded toggle-icon">expand_more</span>
                        </div>
                        ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                        <div class="settings-group">
                `;
                
                if (section.settings && Array.isArray(section.settings)) {
                    section.settings.forEach(settingKey => {
                        if (this.configData.hasOwnProperty(settingKey)) {
                            html += this.generateSettingItem(settingKey);
                        }
                    });
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
        }
        
        // 处理未分组的设置
        const ungroupedSettings = Object.keys(this.configData).filter(key => {
            if (!this.settingsJson.sections) return true;
            
            return !this.settingsJson.sections.some(section => 
                section.settings && section.settings.includes(key)
            );
        });
        
        if (ungroupedSettings.length > 0) {
            html += `
                <div class="settings-section">
                    <div class="section-title">
                        <h3>其他设置</h3>
                        <span class="material-symbols-rounded toggle-icon">expand_more</span>
                    </div>
                    <div class="settings-group">
            `;
            
            ungroupedSettings.forEach(key => {
                html += this.generateSettingItem(key);
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    // 生成简单设置HTML
    generateSimpleHTML() {
        let html = `
            <div class="settings-section">
                <div class="section-title">
                    <h3>常规设置</h3>
                    <span class="material-symbols-rounded toggle-icon">expand_more</span>
                </div>
                <div class="settings-group">
        `;
        
        // 先处理ENABLED和DEBUG
        const priorityKeys = ['ENABLED', 'DEBUG'];
        priorityKeys.forEach(key => {
            if (this.configData.hasOwnProperty(key)) {
                html += this.generateSettingItem(key);
            }
        });
        
        // 处理其他设置
        Object.keys(this.configData)
            .filter(key => !priorityKeys.includes(key))
            .forEach(key => {
                html += this.generateSettingItem(key);
            });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    // 生成单个设置项
    generateSettingItem(key) {
        const value = this.configData[key];
        const description = this.descriptions && this.descriptions[key] ? this.descriptions[key] : '';
        
        // 根据设置类型生成不同的控件
        let controlHtml = '';
        
        if (key === 'ENABLED' || key === 'DEBUG' || value === 'true' || value === 'false') {
            // 布尔值使用开关
            controlHtml = `
                <label class="switch">
                    <input type="checkbox" class="setting-input" data-key="${key}" ${value === 'true' ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            `;
        } else if (!isNaN(Number(value)) && value.trim() !== '') {
            // 数字使用滑块+输入框
            const min = 0;
            const max = value > 100 ? value * 2 : 100;
            controlHtml = `
                <div class="number-control">
                    <input type="range" class="setting-slider" min="${min}" max="${max}" value="${value}">
                    <input type="number" class="setting-number setting-input" data-key="${key}" value="${value}">
                </div>
            `;
        } else if (this.settingsJson && this.settingsJson.options && this.settingsJson.options[key]) {
            // 如果有预定义选项，使用下拉菜单
            const options = this.settingsJson.options[key];
            let optionsHtml = '';
            
            options.forEach(option => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                optionsHtml += `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${optionLabel}</option>`;
            });
            
            controlHtml = `
                <select class="setting-input" data-key="${key}">
                    ${optionsHtml}
                </select>
            `;
        } else {
            // 默认使用文本输入框
            controlHtml = `<input type="text" class="setting-input" data-key="${key}" value="${value}">`;
        }
        
        return `
            <div class="setting-item" data-key="${key}">
                <div class="setting-info">
                    <div class="setting-key">${key}</div>
                    ${description ? `<div class="setting-description">${description}</div>` : ''}
                </div>
                <div class="setting-control">
                    ${controlHtml}
                </div>
            </div>
        `;
    },
    
    // 更新UI
    updateUI() {
        const settingsContent = document.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = this.generateHTML();
        }
        
        // 添加事件监听器
        this.setupEventListeners();
    },
    
    // 设置事件监听器
    setupEventListeners() {
        // 刷新按钮
        document.getElementById('refresh-settings')?.addEventListener('click', () => this.loadConfig(true));
        
        // 保存按钮
        document.getElementById('save-settings')?.addEventListener('click', () => this.saveConfig());
        
        // 配置选择器
        const configSelector = document.getElementById('config-selector');
        if (configSelector) {
            configSelector.addEventListener('change', (e) => this.switchConfig(e.target.value));
        }
        
        // 重置按钮
        document.getElementById('reset-settings')?.addEventListener('click', () => this.confirmResetSettings());
        
        // 添加设置事件监听器
        this.addSettingListeners();
        
        // 处理数字输入和滑块同步
        this.setupNumberControls();
        
        // 添加搜索功能
        this.setupSearch();
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
        
        // 添加分类折叠功能
        document.querySelectorAll('.section-title').forEach(title => {
            title.addEventListener('click', (e) => {
                const section = e.currentTarget.closest('.settings-section');
                section.classList.toggle('collapsed');
            });
        });
    },
    
    // 设置数字控件的同步
    setupNumberControls() {
        document.querySelectorAll('.number-control').forEach(control => {
            const slider = control.querySelector('.setting-slider');
            const numberInput = control.querySelector('.setting-number');
            
            if (slider && numberInput) {
                // 滑块变化时更新数字输入框
                slider.addEventListener('input', () => {
                    numberInput.value = slider.value;
                    // 触发数字输入框的input事件以更新configData
                    numberInput.dispatchEvent(new Event('input'));
                });
                
                // 数字输入框变化时更新滑块
                numberInput.addEventListener('input', () => {
                    slider.value = numberInput.value;
                });
            }
        });
    },
    
    // 设置搜索功能
    setupSearch() {
        const searchInput = document.getElementById('settings-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterSettings(searchTerm);
            });
            
            // 清除搜索按钮
            const clearSearchBtn = document.getElementById('clear-search');
            if (clearSearchBtn) {
                clearSearchBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.filterSettings('');
                });
            }
        }
    },
    
    // 过滤设置项
    filterSettings(searchTerm) {
        const settingItems = document.querySelectorAll('.setting-item');
        const sections = document.querySelectorAll('.settings-section');
        let hasVisibleItems = false;
        
        settingItems.forEach(item => {
            const key = item.getAttribute('data-key');
            const keyText = item.querySelector('.setting-key').textContent.toLowerCase();
            const description = item.querySelector('.setting-description');
            const descText = description ? description.textContent.toLowerCase() : '';
            
            if (keyText.includes(searchTerm) || descText.includes(searchTerm) || key.toLowerCase().includes(searchTerm)) {
                item.style.display = '';
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        // 处理分组显示/隐藏
        sections.forEach(section => {
            const visibleItems = Array.from(section.querySelectorAll('.setting-item')).filter(item => item.style.display !== 'none');
            section.style.display = visibleItems.length === 0 ? 'none' : '';
        });
        
        // 显示无结果提示
        const noResults = document.querySelector('.no-search-results');
        if (noResults) {
            noResults.style.display = hasVisibleItems ? 'none' : '';
        }
    },
    
    // 重置设置
    async resetSettings() {
        try {
            this.isLoading = true;
            this.updateLoadingState(true);
            
            // 备份当前配置
            const backupPath = `${this.configPath}.bak.${Date.now()}`;
            await Core.execCommand(`cp "${this.configPath}" "${backupPath}"`);
            
            // 重置为默认配置
            const defaultConfigPath = `${Core.MODULE_PATH}module_settings/default.sh`;
            if (await this.fileExists(defaultConfigPath)) {
                await Core.execCommand(`cp "${defaultConfigPath}" "${this.configPath}"`);
            } else {
                // 如果没有默认配置，创建一个基本配置
                const basicConfig = '#!/bin/sh\n# AMMF 模块配置文件\n# 由 WebUI 生成\n\nENABLED="true"\nDEBUG="false"\n';
                await Core.execCommand(`echo '${basicConfig}' > "${this.configPath}"`);
            }
            
            // 重新加载配置
            await this.loadConfig();
            
            Core.showToast(I18n.translate('SETTINGS_RESET', '设置已重置'));
            this.isLoading = false;
            this.updateLoadingState(false);
        } catch (error) {
            console.error('重置设置失败:', error);
            Core.showToast(I18n.translate('SETTINGS_RESET_ERROR', '重置设置失败'), 'error');
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    },
    
    // 确认重置设置
    confirmResetSettings() {
        if (confirm(I18n.translate('CONFIRM_RESET_SETTINGS', '确定要重置所有设置吗？此操作不可撤销。'))) {
            this.resetSettings();
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
                    <h2>模块设置</h2>
                    <div class="settings-actions">
                        ${configSelector}
                        <button id="refresh-settings" class="md-button" ${this.isLoading ? 'disabled' : ''}>
                            <span class="material-symbols-rounded">refresh</span>
                            <span>刷新设置</span>
                        </button>
                        <button id="save-settings" class="md-button primary" ${this.isLoading ? 'disabled' : ''}>
                            <span class="material-symbols-rounded">save</span>
                            <span>保存设置</span>
                        </button>
                    </div>
                </div>
                
                <div class="settings-content">
                    ${this.generateHTML()}
                </div>
                
                <div class="settings-footer">
                    <button id="reset-settings" class="md-button danger">
                        <span class="material-symbols-rounded">restart_alt</span>
                        <span>重置设置</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // 页面挂载
    async mount() {
        await this.init();
        this.setupEventListeners();
    },
    
    // 页面卸载
    unmount() {
        // 清理事件监听器
        document.getElementById('refresh-settings')?.removeEventListener('click', this.loadConfig);
        document.getElementById('save-settings')?.removeEventListener('click', this.saveConfig);
        document.getElementById('reset-settings')?.removeEventListener('click', this.confirmResetSettings);
    }
};

// 导出模块
export default SettingsPage;
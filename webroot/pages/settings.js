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
            this.isCancelled = false;
            await this.loadSettingsData();
            await this.loadSettingsMetadata();
            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="settings-content">
                <div id="settings-container">
                    <div class="loading-placeholder">
                        ${I18n.translate('LOADING_SETTINGS', '正在加载设置...')}
                    </div>
                </div>
                <div id="settings-loading" class="loading-overlay">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    },
    
    // 渲染设置项
    renderSettings() {
        if (!this.settings || Object.keys(this.settings).length === 0) {
            // 如果没有可用设置，提供测试数据
            this.settings = this.getTestSettings();
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
    
    // 获取测试设置数据
    getTestSettings() {
        return {
            ENABLE_FEATURE_A: true,
            ENABLE_FEATURE_B: false,
            SERVER_PORT: 8080,
            MAX_CONNECTIONS: 100,
            API_KEY: "test_api_key_12345",
            LOG_LEVEL: "info",
            TIMEOUT_SECONDS: 30,
            DATA_PATH: "/data/storage",
            THEME_COLOR: "#6750A4",
            LANGUAGE: "zh_CN"
        };
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
        // 设置滑动条的最小值、最大值和步长
        const min = 0;
        const max = value * 2 || 100; // 如果值为0，则最大值为100
        const step = value >= 100 ? 10 : 1; // 如果值大于等于100，则步长为10，否则为1
        
        return `
            <div class="number-control-container">
                <input type="number" id="setting-${key}" value="${value}" class="setting-input" min="${min}" max="${max}" step="${step}">
                <div class="slider-container">
                    <input type="range" id="slider-${key}" class="setting-slider" min="${min}" max="${max}" step="${step}" value="${value}">
                </div>
            </div>
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
        const options = this.settingsOptions[key]?.options || [];
        if (options.length === 0) {
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
        // 如果没有描述数据，提供一些测试描述
        if (Object.keys(this.settingsDescriptions).length === 0) {
            this.settingsDescriptions = {
                ENABLE_FEATURE_A: { zh_CN: "启用功能A", en: "Enable Feature A" },
                ENABLE_FEATURE_B: { zh_CN: "启用功能B", en: "Enable Feature B" },
                SERVER_PORT: { zh_CN: "服务器端口", en: "Server Port" },
                MAX_CONNECTIONS: { zh_CN: "最大连接数", en: "Maximum Connections" },
                API_KEY: { zh_CN: "API密钥", en: "API Key" },
                LOG_LEVEL: { zh_CN: "日志级别", en: "Log Level" },
                TIMEOUT_SECONDS: { zh_CN: "超时时间(秒)", en: "Timeout in Seconds" },
                DATA_PATH: { zh_CN: "数据存储路径", en: "Data Storage Path" },
                THEME_COLOR: { zh_CN: "主题颜色", en: "Theme Color" },
                LANGUAGE: { zh_CN: "界面语言", en: "Interface Language" }
            };
        }
        
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
            
            // 如果已经有缓存的设置数据,直接使用
            if (this.settings && Object.keys(this.settings).length > 0) {
                return;
            }
            
            const configPath = `${Core.MODULE_PATH}module_settings/config.sh`;
            
            // 检查是否已取消
            if (this.isCancelled) {
                console.log('设置数据加载已取消');
                return;
            }
            
            // 添加超时控制
            const configContent = await Promise.race([
                Core.execCommand(`cat "${configPath}"`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('加载超时')), 10000))
            ]);
            
            // 再次检查是否已取消
            if (this.isCancelled) {
                console.log('设置数据加载已取消');
                return;
            }
            
            if (!configContent) {
                console.warn('配置文件为空或不存在');
                return;
            }
            
            this.settings = this.parseConfigFile(configContent);
        } catch (error) {
            console.error('加载设置数据失败:', error);
            // 显示错误提示
            Core.showToast(I18n.translate('SETTINGS_LOAD_ERROR', '加载设置失败'), 'error');
        } finally {
            // 确保一定会隐藏加载状态
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
            
            // 检查是否已取消
            if (this.isCancelled) {
                console.log('设置元数据加载已取消');
                return;
            }
            
            const metadataContent = await Core.execCommand(`cat "${metadataPath}"`);
            
            // 再次检查是否已取消
            if (this.isCancelled) {
                console.log('设置元数据加载已取消');
                return;
            }
            
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
            
            // 检查是否已取消
            if (this.isCancelled) {
                console.log('保存设置已取消');
                return;
            }
            
            await Core.execCommand(`echo '${configContent.replace(/'/g, "'\\''")}' > "${configPath}"`);
            
            // 再次检查是否已取消
            if (this.isCancelled) {
                console.log('保存设置已取消');
                return;
            }
            
            // 更新本地设置
            this.settings = updatedSettings;
            
            // 显示成功消息
            Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'));
        } catch (error) {
            console.error('保存设置失败:', error);
            if (!this.isCancelled) {
                Core.showToast(I18n.translate('SETTINGS_SAVE_ERROR', '保存设置失败'), 'error');
            }
        } finally {
            if (!this.isCancelled) {
                this.hideLoading();
            }
        }
    },
    
    // 刷新设置
    async refreshSettings() {
        try {
            // 清空设置数据，强制重新加载
            this.settings = {};
            
            await this.loadSettingsData();
            await this.loadSettingsMetadata();
            
            // 更新设置显示
            this.updateSettingsDisplay();
            
            Core.showToast(I18n.translate('SETTINGS_REFRESHED', '设置已刷新'));
        } catch (error) {
            console.error('刷新设置失败:', error);
            Core.showToast(I18n.translate('SETTINGS_REFRESH_ERROR', '刷新设置失败'), 'error');
        }
    },
    
    // 更新设置显示
    updateSettingsDisplay() {
        const settingsContainer = document.getElementById('settings-container');
        if (settingsContainer) {
            settingsContainer.innerHTML = this.renderSettings();
            // 重新绑定事件
            this.bindSettingEvents();
        }
    },
    
    // 显示加载中
    showLoading() {
        if (this.isLoading) return; // 防止重复显示
        
        this.isLoading = true;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            loadingElement.style.visibility = 'visible';
            loadingElement.style.opacity = '1';
        }
    },

    // 隐藏加载中
    hideLoading() {
        if (!this.isLoading) return; // 防止重复隐藏
        
        this.isLoading = false;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            loadingElement.style.visibility = 'hidden';
            
            // 使用 Promise 确保动画完成后再完全隐藏
            setTimeout(() => {
                if (!this.isLoading) { // 再次检查状态
                    loadingElement.style.display = 'none';
                }
            }, 300);
        }
    },
    
    // 渲染后的回调
    async afterRender() {
        // 添加页面操作按钮
        this.setupPageActions();
        
        try {
            // 显示加载状态
            this.showLoading();
            
            // 等待设置数据加载完成
            await this.init();
            
            // 更新设置显示
            this.updateSettingsDisplay();
            
            // 绑定设置项事件
            this.bindSettingEvents();
        } catch (error) {
            console.error('设置页面初始化失败:', error);
            Core.showToast(I18n.translate('SETTINGS_INIT_ERROR', '设置页面初始化失败'), 'error');
        } finally {
            this.hideLoading();
        }
    },
    
    // 设置页面操作按钮
    setupPageActions() {
        const pageActions = document.getElementById('page-actions');
        if (pageActions) {
            pageActions.innerHTML = `
                <button id="refresh-settings" class="md-icon-button" title="${I18n.translate('REFRESH', '刷新')}">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
                <button id="save-settings" class="md-icon-button" title="${I18n.translate('SAVE', '保存')}">
                    <span class="material-symbols-rounded">save</span>
                </button>
            `;
            
            // 绑定刷新按钮事件
            const refreshButton = document.getElementById('refresh-settings');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    refreshButton.classList.add('spinning');
                    this.refreshSettings().finally(() => {
                        setTimeout(() => {
                            refreshButton.classList.remove('spinning');
                        }, 800);
                    });
                });
            }
            
            // 绑定保存按钮事件
            const saveButton = document.getElementById('save-settings');
            if (saveButton) {
                saveButton.addEventListener('click', () => {
                    this.saveSettings();
                });
            }
        }
    },
    
    // 绑定设置项事件
    bindSettingEvents() {
        // 使用事件委托替代单独绑定
        const container = document.getElementById('settings-container');
        if (container) {
            // 监听输入变化
            container.addEventListener('change', (e) => {
                const target = e.target;
                if (target.tagName === 'SELECT' || target.tagName === 'INPUT') {
                    const key = target.id.replace('setting-', '').replace('slider-', '');
                    console.log(`设置 ${key} 已更改`);
                    
                    // 如果是滑动条，同步更新对应的数字输入框
                    if (target.type === 'range') {
                        const numberInput = document.getElementById(`setting-${key}`);
                        if (numberInput) {
                            numberInput.value = target.value;
                        }
                    }
                    
                    // 如果是数字输入框，同步更新对应的滑动条
                    if (target.type === 'number') {
                        const slider = document.getElementById(`slider-${key}`);
                        if (slider) {
                            slider.value = target.value;
                        }
                    }
                }
            });
            
            // 监听输入事件，实时更新滑动条和数字输入框
            container.addEventListener('input', (e) => {
                const target = e.target;
                if (target.type === 'range' || target.type === 'number') {
                    const key = target.id.replace('setting-', '').replace('slider-', '');
                    
                    // 如果是滑动条，同步更新对应的数字输入框
                    if (target.type === 'range') {
                        const numberInput = document.getElementById(`setting-${key}`);
                        if (numberInput) {
                            numberInput.value = target.value;
                        }
                    }
                    
                    // 如果是数字输入框，同步更新对应的滑动条
                    if (target.type === 'number') {
                        const slider = document.getElementById(`slider-${key}`);
                        if (slider) {
                            slider.value = target.value;
                        }
                    }
                }
            });
        }
    },
    
    // 页面激活时的回调
    onActivate() {
        console.log('设置页面已激活');
        // 重置取消标志
        this.isCancelled = false;
    },
    
    // 页面停用时的回调
    onDeactivate() {
        console.log('设置页面已停用');
        // 设置取消标志，用于中断正在进行的异步操作
        this.isCancelled = true;
        // 清理资源
        this.cleanupResources();
    },
    
    // 清理资源
    cleanupResources() {
        // 移除可能存在的事件监听器
        const container = document.getElementById('settings-container');
        if (container) {
            // 使用克隆节点的方式移除所有事件监听器
            const newContainer = container.cloneNode(true);
            container.parentNode.replaceChild(newContainer, container);
        }
        
        // 确保加载覆盖层被隐藏
        this.hideLoading();
    }
};

// 导出设置页面模块
window.SettingsPage = SettingsPage;
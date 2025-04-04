/**
 * AMMF WebUI 设置页面模块
 * 管理模块配置设置
 */

const SettingsPage = {
    // 核心数据
    settings: {},
    settingsBackup: {},
    hasUnsavedChanges: false,
    tempFormState: {},

    // 元数据
    excludedSettings: [],
    settingsDescriptions: {},
    settingsOptions: {},

    // 状态标志
    isLoading: false,
    isCancelled: false,

    // 初始化
    async init() {
        try {
            this.isCancelled = false;

            // 如果有临时表单状态且有未保存的更改，优先使用临时状态
            if (this.tempFormState && Object.keys(this.tempFormState).length > 0 && this.hasUnsavedChanges) {
                console.log('恢复未保存的设置更改');
                await this.loadSettingsMetadata();
                this.settings = { ...this.tempFormState };
                return true;
            }

            this.hasUnsavedChanges = false;
            await this.loadSettingsData();
            await this.loadSettingsMetadata();

            // 创建设置备份
            this.createSettingsBackup();

            return true;
        } catch (error) {
            console.error('初始化设置页面失败:', error);
            return false;
        }
    },

    // 创建设置备份
    createSettingsBackup() {
        this.settingsBackup = JSON.parse(JSON.stringify(this.settings));
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
            this.createSettingsBackup();
        }

        let html = '';

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
                    ${this.renderSettingControl(key, value, description)}
                </div>
            `;
        }

        return html;
    },

    // 获取测试设置数据 - 简化版
    getTestSettings() {
        return {
            // 布尔值设置
            ENABLE_FEATURE_A: true,
            ENABLE_FEATURE_B: false,

            // 数字设置
            SERVER_PORT: 8080,

            // 文本设置
            API_KEY: "test_api_key_12345",

            // 选择项设置
            LOG_LEVEL: "info",
            THEME: "auto",

            // 数字滑条设置
            VOLUME: 75,
            BRIGHTNESS: 80
        };
    },

    // 渲染设置控件
    renderSettingControl(key, value, description) {
        // 检查是否有预定义选项
        if (this.settingsOptions[key]) {
            return this.renderSelectControl(key, value, description);
        }

        // 根据值类型渲染不同控件
        if (typeof value === 'boolean') {
            return this.renderBooleanControl(key, value, description);
        } else if (typeof value === 'number') {
            return this.renderNumberControl(key, value, description);
        } else {
            return this.renderTextControl(key, value, description);
        }
    },

    // 渲染布尔值控件
    renderBooleanControl(key, value, description) {
        return `
            <div class="switches">
                <label>
                    ${description}
                    <input type="checkbox" id="setting-${key}" ${value ? 'checked' : ''}>
                </label>
            </div>
        `;
    },

    // 渲染数字控件
    renderNumberControl(key, value, description) {
        // 使用 MD3 数字输入框
        return `
            <label>
                <span>${description}</span>
                <input type="number" id="setting-${key}" value="${value}" class="md3-input">
            </label>
        `;
    },

    // 渲染文本控件
    renderTextControl(key, value, description) {
        return `
            <label>
                <span>${description}</span>
                <input type="text" id="setting-${key}" value="${value}">
            </label>
        `;
    },

    // 渲染选择控件
    renderSelectControl(key, value, description) {
        const options = this.settingsOptions[key]?.options || [];
        if (options.length === 0) {
            return this.renderTextControl(key, value, description);
        }

        let html = `
            <label>
                <span>${description}</span>
                <select id="setting-${key}">`;

        for (const option of options) {
            const optionValue = option.value;
            // 获取当前语言的标签，如果没有则使用值本身
            const label = option.label ? (option.label[I18n.currentLang] || option.label.en || optionValue) : optionValue;

            html += `<option value="${optionValue}" ${optionValue === value ? 'selected' : ''}>${label}</option>`;
        }

        html += `
                </select>
            </label>
        `;
        return html;
    },

    // 获取设置描述
    getSettingDescription(key) {
        if (this.settingsDescriptions[key]) {
            // 获取当前语言的描述，如果没有则使用英文描述
            return this.settingsDescriptions[key][I18n.currentLang] ||
                this.settingsDescriptions[key].en ||
                key;
        }
        return key;
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
            if (this.isCancelled) return;

            // 添加超时控制
            const configContent = await Promise.race([
                Core.execCommand(`cat "${configPath}"`),
                new Promise((_, reject) => setTimeout(() => reject(new Error('加载超时')), 5000))
            ]);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            if (!configContent) {
                console.warn('配置文件为空或不存在');
                return;
            }

            this.settings = this.parseConfigFile(configContent);
        } catch (error) {
            console.error('加载设置数据失败:', error);
            Core.showToast(I18n.translate('SETTINGS_LOAD_ERROR', '加载设置失败'), 'error');
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
            if (line.trim().startsWith('#') || line.trim() === '') continue;

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
            const metadataPath = `${Core.MODULE_PATH}module_settings/settings.json`;

            // 检查是否已取消
            if (this.isCancelled) return;

            const metadataContent = await Core.execCommand(`cat "${metadataPath}"`);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            if (!metadataContent) {
                console.warn('设置元数据文件为空或不存在');
                this.setupTestMetadata();
                return;
            }

            const metadata = JSON.parse(metadataContent);

            // 设置排除项
            this.excludedSettings = metadata.excluded || [];

            // 设置描述
            this.settingsDescriptions = metadata.descriptions || {};

            // 设置选项
            this.settingsOptions = metadata.options || {};
        } catch (error) {
            console.error('加载设置元数据失败:', error);
            this.setupTestMetadata();
        }
    },

    // 设置测试元数据
    setupTestMetadata() {
        // 设置描述
        this.settingsDescriptions = {
            ENABLE_FEATURE_A: { zh_CN: "启用功能A", en: "Enable Feature A" },
            ENABLE_FEATURE_B: { zh_CN: "启用功能B", en: "Enable Feature B" },
            SERVER_PORT: { zh_CN: "服务器端口", en: "Server Port" },
            API_KEY: { zh_CN: "API密钥", en: "API Key" },
            LOG_LEVEL: { zh_CN: "日志级别", en: "Log Level" },
            THEME: { zh_CN: "主题", en: "Theme" },
            VOLUME: { zh_CN: "音量", en: "Volume" },
            BRIGHTNESS: { zh_CN: "亮度", en: "Brightness" }
        };

        // 设置选项配置
        this.settingsOptions = {
            // 下拉选择框示例
            LOG_LEVEL: {
                options: [
                    { value: "debug", label: { zh_CN: "调试", en: "Debug" } },
                    { value: "info", label: { zh_CN: "信息", en: "Info" } },
                    { value: "warn", label: { zh_CN: "警告", en: "Warning" } },
                    { value: "error", label: { zh_CN: "错误", en: "Error" } }
                ]
            },
            THEME: {
                options: [
                    { value: "auto", label: { zh_CN: "自动", en: "Auto" } },
                    { value: "light", label: { zh_CN: "浅色", en: "Light" } },
                    { value: "dark", label: { zh_CN: "深色", en: "Dark" } }
                ]
            }
        };
    },

    // 保存设置
    async saveSettings() {
        try {
            this.showLoading();

            // 收集表单数据
            const updatedSettings = { ...this.settings };

            for (const key in this.settings) {
                if (this.excludedSettings.includes(key)) continue;

                const element = document.getElementById(`setting-${key}`);
                if (!element) continue;

                if (element.type === 'checkbox') {
                    updatedSettings[key] = element.checked;
                } else if (element.type === 'number' || element.type === 'range') {
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
            if (this.isCancelled) return;

            await Core.execCommand(`echo '${configContent.replace(/'/g, "'\\''")}' > "${configPath}"`);

            // 再次检查是否已取消
            if (this.isCancelled) return;

            // 更新本地设置
            this.settings = updatedSettings;

            // 更新备份
            this.createSettingsBackup();

            // 重置未保存更改标志
            this.hasUnsavedChanges = false;

            // 清除临时表单状态
            this.tempFormState = {};

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

    // 还原设置
    restoreSettings() {
        if (!this.settingsBackup || Object.keys(this.settingsBackup).length === 0) {
            Core.showToast(I18n.translate('NO_SETTINGS_BACKUP', '没有可用的设置备份'), 'error');
            return;
        }

        // 恢复设置
        this.settings = JSON.parse(JSON.stringify(this.settingsBackup));

        // 更新设置显示
        this.updateSettingsDisplay();

        // 重置未保存更改标志
        this.hasUnsavedChanges = false;

        // 清除临时表单状态
        this.tempFormState = {};

        // 显示成功消息
        Core.showToast(I18n.translate('SETTINGS_RESTORED', '设置已还原'));
    },

    // 检查是否有未保存的更改
    checkForUnsavedChanges() {
        if (!this.settings || !this.settingsBackup) return false;

        // 收集当前表单数据
        const currentSettings = { ...this.settings };

        for (const key in this.settings) {
            if (this.excludedSettings.includes(key)) continue;

            const element = document.getElementById(`setting-${key}`);
            if (!element) continue;

            if (element.type === 'checkbox') {
                currentSettings[key] = element.checked;
            } else if (element.type === 'number' || element.type === 'range') {
                currentSettings[key] = Number(element.value);
            } else {
                currentSettings[key] = element.value;
            }
        }

        // 比较当前设置和备份
        for (const key in currentSettings) {
            if (this.excludedSettings.includes(key)) continue;

            // 检查类型和值是否相同
            const currentValue = currentSettings[key];
            const backupValue = this.settingsBackup[key];

            if (typeof currentValue !== typeof backupValue) {
                return true;
            }

            if (typeof currentValue === 'object') {
                if (JSON.stringify(currentValue) !== JSON.stringify(backupValue)) {
                    return true;
                }
            } else if (currentValue !== backupValue) {
                return true;
            }
        }

        return false;
    },

    // 刷新设置
    async refreshSettings() {
        try {
            // 检查是否有未保存的更改
            if (this.checkForUnsavedChanges()) {
                const confirmRefresh = confirm(I18n.translate('CONFIRM_REFRESH_UNSAVED', '有未保存的更改，确定要刷新吗？'));
                if (!confirmRefresh) return;
            }

            // 清空设置数据，强制重新加载
            this.settings = {};

            await this.loadSettingsData();
            await this.loadSettingsMetadata();

            // 更新设置显示
            this.updateSettingsDisplay();

            // 创建新的备份
            this.createSettingsBackup();

            // 重置未保存更改标志
            this.hasUnsavedChanges = false;

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
        if (this.isLoading) return;

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
        if (!this.isLoading) return;

        this.isLoading = false;
        const loadingElement = document.getElementById('settings-loading');
        if (loadingElement) {
            loadingElement.style.opacity = '0';
            loadingElement.style.visibility = 'hidden';

            setTimeout(() => {
                if (!this.isLoading) {
                    loadingElement.style.display = 'none';
                }
            }, 300);
        }
    },

    // 保存临时表单状态
    saveTemporaryFormState() {
        if (!this.hasUnsavedChanges) return;

        // 收集当前表单数据
        const tempSettings = { ...this.settings };

        for (const key in this.settings) {
            if (this.excludedSettings.includes(key)) continue;

            const element = document.getElementById(`setting-${key}`);
            if (!element) continue;

            if (element.type === 'checkbox') {
                tempSettings[key] = element.checked;
            } else if (element.type === 'number' || element.type === 'range') {
                tempSettings[key] = Number(element.value);
            } else {
                tempSettings[key] = element.value;
            }
        }

        // 保存临时状态
        this.tempFormState = tempSettings;
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
                <button id="restore-settings" class="icon-button" title="${I18n.translate('RESTORE', '还原')}">
                    <span class="material-symbols-rounded">restore</span>
                </button>
                <button id="refresh-settings" class="icon-button" title="${I18n.translate('REFRESH', '刷新')}">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
                <button id="save-settings" class="icon-button" title="${I18n.translate('SAVE', '保存')}">
                    <span class="material-symbols-rounded">save</span>
                </button>
            `;
            
            // 绑定还原按钮事件
            const restoreButton = document.getElementById('restore-settings');
            if (restoreButton) {
                restoreButton.addEventListener('click', () => this.restoreSettings());
            }
            
            // 绑定刷新按钮事件
            const refreshButton = document.getElementById('refresh-settings');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.refreshSettings().finally
                });
            }
            
            // 绑定保存按钮事件
            const saveButton = document.getElementById('save-settings');
            if (saveButton) {
                saveButton.addEventListener('click', () => this.saveSettings());
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
                    // 标记有未保存的更改
                    this.hasUnsavedChanges = this.checkForUnsavedChanges();

                    // 保存临时表单状态
                    this.saveTemporaryFormState();
                }
            });

            // 监听输入事件，实时更新滑动条值显示
            container.addEventListener('input', (e) => {
                const target = e.target;
                if (target.type === 'range') {
                    const output = target.nextElementSibling;
                    if (output && output.tagName === 'OUTPUT') {
                        output.textContent = target.value;
                    }

                    // 标记有未保存的更改
                    this.hasUnsavedChanges = this.checkForUnsavedChanges();

                    // 保存临时表单状态
                    this.saveTemporaryFormState();
                }
            });
        }
    },

    // 页面激活时的回调
    onActivate() {
        // 重置取消标志
        this.isCancelled = false;
    },

    // 页面停用时的回调
    onDeactivate() {
        // 检查是否有未保存的更改
        if (this.hasUnsavedChanges || this.checkForUnsavedChanges()) {
            Core.showToast(I18n.translate('UNSAVED_SETTINGS', '设置有未保存的更改'), 'warning');
        }

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
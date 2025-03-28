/**
 * AMMF WebUI 关于页面模块
 * 显示模块信息和版本
 */

const AboutPage = {
    // 模块信息
    moduleInfo: {},
    
    // 初始化
    async init() {
        try {
            // 加载模块信息
            await this.loadModuleInfo();
            return true;
        } catch (error) {
            console.error('初始化关于页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container about-page">
                <div class="about-header">
                    <div class="module-logo">
                        <span class="material-symbols-rounded">extension</span>
                    </div>
                    <h2>${this.moduleInfo.action_name || 'AMMF 模块'}</h2>
                    <p class="module-description">${this.moduleInfo.description || this.moduleInfo.action_description || I18n.translate('MODULE_DESCRIPTION_DEFAULT', '模块描述未提供')}</p>
                </div>
                
                <div class="about-content">
                    <div class="about-card module-info-card">
                        <h3 data-i18n="MODULE_INFO">模块信息</h3>
                        <div class="info-grid">
                            ${this.renderModuleInfo()}
                        </div>
                    </div>
                    
                    <div class="about-card webui-info-card">
                        <h3 data-i18n="ABOUT_WEBUI">关于 WebUI</h3>
                        <div class="webui-content">
                            <div class="webui-logo">
                                <span class="material-symbols-rounded">web</span>
                            </div>
                            <p data-i18n="WEBUI_DESCRIPTION">AMMF WebUI 是一个用于管理和配置 AMMF 模块的网页界面。</p>
                            <div class="version-info">
                                <span data-i18n="VERSION">版本</span>: <span class="version-number">4.1.2</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="about-card developer-card">
                        <h3 data-i18n="DEVELOPER_INFO">开发者信息</h3>
                        <div class="developer-content">
                            <p><span data-i18n="DEVELOPER">开发者</span>: ${this.moduleInfo.action_author || I18n.translate('UNKNOWN_DEVELOPER', '未知')}</p>
                            <div class="social-links">
                                <a href="#" class="social-link" id="github-link">
                                    <span class="material-symbols-rounded">code</span>
                                    <span>GitHub</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="about-footer">
                    <p data-i18n="COPYRIGHT_INFO">© 2025 Aurora星空. All rights reserved.</p>
                </div>
            </div>
        `;
    },

    // 修改模块信息渲染方法，只保留模块ID和版本信息
    renderModuleInfo() {
        const infoItems = [
            { key: 'action_id', label: 'MODULE_ID', icon: 'tag' },
            { key: 'action_version', label: 'MODULE_VERSION', icon: 'new_releases' },
            { key: 'version', label: 'VERSION', icon: 'update' }
        ];
        
        let html = '';
        
        infoItems.forEach(item => {
            if (this.moduleInfo[item.key]) {
                html += `
                    <div class="info-item">
                        <div class="info-icon">
                            <span class="material-symbols-rounded">${item.icon}</span>
                        </div>
                        <div class="info-content">
                            <div class="info-label" data-i18n="${item.label}">${I18n.translate(item.label, item.key)}</div>
                            <div class="info-value">${this.moduleInfo[item.key]}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        // 添加从module.prop读取的版本信息
        if (this.moduleInfo.version) {
            html += `
                <div class="info-item">
                    <div class="info-icon">
                        <span class="material-symbols-rounded">update</span>
                    </div>
                    <div class="info-content">
                        <div class="info-label" data-i18n="VERSION">版本</div>
                        <div class="info-value">${this.moduleInfo.version}</div>
                    </div>
                </div>
            `;
        }
        
        return html || `<div class="no-info" data-i18n="NO_INFO">无可用信息</div>`;
    },
    
    // 加载模块信息
    async loadModuleInfo() {
        try {
            // 尝试从配置文件获取模块信息
            const configOutput = await Core.execCommand(`cat "${Core.MODULE_PATH}module.prop"`);
            
            if (configOutput) {
                // 解析配置文件
                const lines = configOutput.split('\n');
                const config = {};
                
                lines.forEach(line => {
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join('=').trim();
                        config[key] = value;
                    }
                });
                
                this.moduleInfo = config;
                console.log('模块信息加载成功:', this.moduleInfo);
            } else {
                console.warn('无法读取模块配置文件');
                this.moduleInfo = {};
            }
        } catch (error) {
            console.error('加载模块信息失败:', error);
            this.moduleInfo = {};
        }
    },
    
    // 渲染后的回调
    afterRender() {
        // 添加GitHub链接点击事件
        const githubLink = document.getElementById('github-link');
        if (githubLink) {
            githubLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openGitHubLink();
            });
        }
    },
    
    // 打开GitHub链接
    async openGitHubLink() {
        try {
            // 获取GitHub链接
            let githubUrl = "https://github.com/AuroraNasa/AMMF2";
            
            // 如果模块信息中有GitHub链接，则使用模块信息中的链接
            if (this.moduleInfo.github) {
                githubUrl = this.moduleInfo.github;
            }
            
            // 使用安卓浏览器打开链接
            await Core.execCommand(`am start -a android.intent.action.VIEW -d "${githubUrl}"`);
            console.log('已打开GitHub链接:', githubUrl);
        } catch (error) {
            console.error('打开GitHub链接失败:', error);
            Core.showToast('打开GitHub链接失败', 'error');
        }
    }
};

// 导出关于页面模块
window.AboutPage = AboutPage;
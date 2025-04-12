/**
 * AMMF WebUI 关于页面模块
 * 显示模块信息和版本
 */

const AboutPage = {
    // 模块信息
    moduleInfo: {},
    version: '7.1.0',
    // 配置项
    config: {
        showThemeToggle: false  // 控制是否显示主题切换按钮
    },
    
    // 初始化
    async init() {
        try {
            // 加载模块信息
            await this.loadModuleInfo();
            
            // 添加语言变化事件监听
            document.addEventListener('languageChanged', () => {
                // 重新渲染页面内容
                const aboutContent = document.querySelector('.about-container');
                if (aboutContent) {
                    aboutContent.outerHTML = this.render().trim();
                    this.afterRender();
                }
            });
            
            return true;
        } catch (error) {
            console.error('初始化关于页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        // 设置页面标题
        document.getElementById('page-title').textContent = I18n.translate('NAV_ABOUT', '关于');
        
        // 添加刷新按钮和切换CSS样式按钮到页面操作区
        const buttons = [`
            <button id="refresh-about" class="icon-button" title="${I18n.translate('REFRESH', '刷新')}">
                <span class="material-symbols-rounded">refresh</span>
            </button>
        `];
        
        // 根据配置决定是否显示主题切换按钮
        if (this.config.showThemeToggle) {
            buttons.push(`
                <button id="toggle-css" class="icon-button" title="${I18n.translate('TOGGLE_CSS', '切换样式')}">
                    <span class="material-symbols-rounded">palette</span>
                </button>
            `);
        }
        
        document.getElementById('page-actions').innerHTML = buttons.join('');
        
        return `
        <div class="about-container">
            <div class="about-header">
                <div class="app-logo">
                    <span class="material-symbols-rounded">dashboard_customize</span>
                </div>
                <h2>AMMF WebUI</h2>
                <div class="version-badge">
                    <span>${I18n.translate('VERSION', '版本')} ${this.version}</span>
                </div>
                <p class="about-description">${I18n.translate('ABOUT_DESCRIPTION', 'AMMF模块管理界面')}</p>
            </div>
            
            <div class="about-card">
                <div class="about-section">
                    <h3 class="section-title">
                        <span class="material-symbols-rounded">info</span>
                        ${I18n.translate('MODULE_INFO', '模块信息')}
                    </h3>
                    <div class="info-list">
                        ${this.renderModuleInfo()}
                    </div>
                </div>
                
                <div class="about-section">
                    <h3 class="section-title">
                        <span class="material-symbols-rounded">person</span>
                        ${I18n.translate('MODULE_DEVELOPER', '模块开发者')}
                    </h3>
                    <div class="developer-info">
                        <div class="developer-name">
                            <span>${this.moduleInfo.author || I18n.translate('UNKNOWN', '未知')}</span>
                        </div>
                        ${this.moduleInfo.github ? `
                        <a href="#" class="social-link" id="module-github-link">
                            <span class="material-symbols-rounded">code</span>
                            <span>GitHub</span>
                        </a>
                        ` : ''}
                    </div>
                </div>
                
                <div class="about-section">
                    <h3 class="section-title">
                        <span class="material-symbols-rounded">person</span>
                        ${I18n.translate('FRAMEWORK_DEVELOPER', '框架开发者')}
                    </h3>
                    <div class="developer-info">
                        <div class="developer-name">
                            <span>Aurora星空</span>
                        </div>
                        <a href="#" class="social-link" id="github-link">
                            <span class="material-symbols-rounded">code</span>
                            <span>GitHub</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="about-footer">
                <p>${I18n.translate('COPYRIGHT_INFO', `© ${new Date().getFullYear()} Aurora星空. All rights reserved.`)}</p>
            </div>
        </div>
    `;
    },
    
    // 修改模块信息渲染方法，只保留模块名称和版本信息
    renderModuleInfo() {
        const infoItems = [
            { key: 'module_name', label: 'MODULE_NAME', icon: 'tag' },
            { key: 'version', label: 'MODULE_VERSION', icon: 'new_releases' },
            { key: 'versionCode', label: 'VERSION_DATE', icon: 'update' }
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
        
        return html || `<div class="empty-state" data-i18n="NO_INFO">${I18n.translate('NO_INFO', '无可用信息')}</div>`;
    },
    
    // 加载模块信息
    async loadModuleInfo() {
        try {
            // 检查是否有缓存的模块信息
            const cachedInfo = sessionStorage.getItem('moduleInfo');
            if (cachedInfo) {
                this.moduleInfo = JSON.parse(cachedInfo);
                console.log('从缓存加载模块信息:', this.moduleInfo);
                return;
            }
            
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
                // 缓存模块信息
                sessionStorage.setItem('moduleInfo', JSON.stringify(config));
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
    
    // 刷新模块信息
    async refreshModuleInfo() {
        try {
            // 清除缓存
            sessionStorage.removeItem('moduleInfo');
            
            // 重新加载模块信息
            await this.loadModuleInfo();
            
            const aboutContent = document.querySelector('.about-container');
            if (aboutContent) {
                // 只更新关于容器的内容，而不是整个main-content
                aboutContent.outerHTML = this.render().trim();
                
                // 重新绑定事件
                this.afterRender();
                
                // 显示成功提示
                Core.showToast(I18n.translate('MODULE_INFO_REFRESHED', '模块信息已刷新'));
            } else {
                // 如果找不到关于容器，则使用更安全的方式更新
                App.loadPage('about');
            }
        } catch (error) {
            console.error('刷新模块信息失败:', error);
            Core.showToast(I18n.translate('MODULE_INFO_REFRESH_ERROR', '刷新模块信息失败'), 'error');
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
        
        // 添加模块GitHub链接点击事件
        const moduleGithubLink = document.getElementById('module-github-link');
        if (moduleGithubLink) {
            moduleGithubLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModuleGitHubLink();
            });
        }
        
        // 添加刷新按钮点击事件
        const refreshButton = document.getElementById('refresh-about');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshModuleInfo();
            });
        }
        
        // 添加切换CSS样式按钮点击事件
        const toggleCssButton = document.getElementById('toggle-css');
        if (toggleCssButton) {
            // 更新按钮标题显示当前样式
            this.updateCssButtonStatus(toggleCssButton);
            
            toggleCssButton.addEventListener('click', () => {
                // 调用CSS加载器切换样式
                if (window.CSSLoader && typeof window.CSSLoader.toggleCSS === 'function') {
                    window.CSSLoader.toggleCSS();
                    // 更新按钮状态
                    this.updateCssButtonStatus(toggleCssButton);
                    // 显示提示
                    const cssType = window.CSSLoader.getCurrentCSSType();
                    const message = cssType === 'custom' ? '已切换到自定义样式' : '已切换到默认样式';
                    Core.showToast(I18n.translate('CSS_SWITCHED', message));
                } else {
                    console.error('CSS加载器不可用');
                    Core.showToast(I18n.translate('CSS_LOADER_ERROR', 'CSS加载器不可用'), 'error');
                }
            });
        }
    },
    
    // 打开GitHub链接
    async openGitHubLink() {
        try {
            // 获取GitHub链接
            let githubUrl = "https://github.com/Aurora-Nasa-1/AM" + "MF2";
            
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
    },
    
    // 打开模块GitHub链接
    async openModuleGitHubLink() {
        try {
            if (!this.moduleInfo.github) {
                Core.showToast('模块未提供GitHub链接', 'warning');
                return;
            }
            
            // 使用安卓浏览器打开链接
            await Core.execCommand(`am start -a android.intent.action.VIEW -d "${this.moduleInfo.github}"`);
            console.log('已打开模块GitHub链接:', this.moduleInfo.github);
        } catch (error) {
            console.error('打开模块GitHub链接失败:', error);
            Core.showToast('打开模块GitHub链接失败', 'error');
        }
    },
    
    // 更新CSS切换按钮状态
    updateCssButtonStatus(button) {
        if (!button || !window.CSSLoader) return;
        
        // 获取当前CSS类型
        const cssType = window.CSSLoader.getCurrentCSSType();
        
        // 更新按钮标题
        const title = cssType === 'custom' ? 
            I18n.translate('TOGGLE_CSS_DEFAULT', '切换到默认样式') : 
            I18n.translate('TOGGLE_CSS_CUSTOM', '切换到自定义样式');
        
        button.setAttribute('title', title);
    }
};

// 导出关于页面模块
window.AboutPage = AboutPage;
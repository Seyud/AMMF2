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
                    <p class="module-description">${this.moduleInfo.action_description || '模块描述未提供'}</p>
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
                            <p>AMMF WebUI 是一个用于管理和配置 AMMF 模块的网页界面。</p>
                            <div class="version-info">
                                <span data-i18n="VERSION">版本</span>: <span class="version-number">2.0.0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="about-card developer-card">
                        <h3 data-i18n="DEVELOPER_INFO">开发者信息</h3>
                        <div class="developer-content">
                            <p><span data-i18n="DEVELOPER">开发者</span>: ${this.moduleInfo.action_author || 'Unknown'}</p>
                            <div class="social-links">
                                <a href="#" class="social-link">
                                    <span class="material-symbols-rounded">link</span>
                                    <span>GitHub</span>
                                </a>
                                <a href="#" class="social-link">
                                    <span class="material-symbols-rounded">forum</span>
                                    <span>社区</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="about-footer">
                    <p>© 2023-2024 AMMF Team. All rights reserved.</p>
                </div>
            </div>
        `;
    },
    
    // 加载模块信息
    async loadModuleInfo() {
        try {
            const config = await Core.getConfig();
            this.moduleInfo = config || {};
        } catch (error) {
            console.error('加载模块信息失败:', error);
            this.moduleInfo = {};
        }
    },
    
    // 渲染模块信息
    renderModuleInfo() {
        const infoItems = [
            { key: 'action_id', label: '模块ID', icon: 'tag' },
            { key: 'action_version', label: '模块版本', icon: 'new_releases' },
            { key: 'magisk_min_version', label: 'Magisk最低版本', icon: 'system_update' },
            { key: 'ksu_min_version', label: 'KernelSU最低版本', icon: 'terminal' },
            { key: 'apatch_min_version', label: 'APatch最低版本', icon: 'build' },
            { key: 'ANDROID_API', label: 'Android API', icon: 'android' }
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
                            <div class="info-label">${item.label}</div>
                            <div class="info-value">${this.moduleInfo[item.key]}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        return html || '<div class="no-info">无可用信息</div>';
    },
    
    // 渲染后的回调
    afterRender() {
        // 可以在这里添加事件监听器或其他DOM操作
        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // 这里可以添加社交链接的点击处理
            });
        });
    }
};

// 导出关于页面模块
window.AboutPage = AboutPage;
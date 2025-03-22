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
                <div class="about-header card">
                    <h2 data-i18n="ABOUT_MODULE">关于模块</h2>
                </div>
                
                <div class="about-content">
                    <div class="module-info card">
                        <div class="module-logo">
                            <span class="material-symbols-rounded">extension</span>
                        </div>
                        <h3>${this.moduleInfo.action_name || 'AMMF 模块'}</h3>
                        <p class="module-description">${this.moduleInfo.action_description || '模块描述未提供'}</p>
                        
                        <div class="info-grid">
                            ${this.renderModuleInfo()}
                        </div>
                    </div>
                    
                    <div class="about-webui card">
                        <h3 data-i18n="ABOUT_WEBUI">关于 WebUI</h3>
                        <p>AMMF WebUI 是一个用于管理和配置 AMMF 模块的网页界面。</p>
                        <p>版本: 2.0.0</p>
                    </div>
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
            { key: 'action_id', label: '模块ID' },
            { key: 'action_author', label: '作者' },
            { key: 'magisk_min_version', label: 'Magisk最低版本' },
            { key: 'ksu_min_version', label: 'KernelSU最低版本' },
            { key: 'apatch_min_version', label: 'APatch最低版本' },
            { key: 'ANDROID_API', label: 'Android API' }
        ];
        
        let html = '';
        
        infoItems.forEach(item => {
            if (this.moduleInfo[item.key]) {
                html += `
                    <div class="info-item">
                        <div class="info-label">${item.label}</div>
                        <div class="info-value">${this.moduleInfo[item.key]}</div>
                    </div>
                `;
            }
        });
        
        return html || '<div class="no-info">无可用信息</div>';
    }
};

// 导出关于页面模块
window.AboutPage = AboutPage;
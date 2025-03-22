// 关于页面管理
class AboutManager {
    constructor() {
        this.moduleName = document.getElementById('module-name');
        this.moduleVersion = document.getElementById('module-version');
        this.moduleAuthor = document.getElementById('module-author');
        this.deviceInfo = document.getElementById('device-info');
        this.githubButton = document.getElementById('github-button');
        
        this.init();
    }
    
    async init() {
        // 加载模块信息
        await this.loadModuleInfo();
        
        // 加载设备信息
        await this.loadDeviceInfo();
        
        // GitHub按钮点击事件
        if (this.githubButton) {
            this.githubButton.addEventListener('click', () => {
                this.openGitHub();
            });
        }
    }
    
    async loadModuleInfo() {
        try {
            // 读取module.prop文件
            const command = 'cat /data/adb/modules/AMMF/module.prop';
            const content = await execCommand(command);
            
            if (content) {
                // 解析module.prop
                const lines = content.split('\n');
                const props = {};
                
                lines.forEach(line => {
                    const [key, value] = line.split('=');
                    if (key && value) {
                        props[key.trim()] = value.trim();
                    }
                });
                
                // 更新UI
                if (props.name) {
                    this.moduleName.textContent = props.name;
                }
                
                if (props.version) {
                    this.moduleVersion.textContent = `${window.i18n.translate('WEBUI_VERSION')}: ${props.version}`;
                }
                
                if (props.author) {
                    this.moduleAuthor.textContent = `${window.i18n.translate('WEBUI_AUTHOR')}: ${props.author}`;
                }
            }
        } catch (error) {
            console.error('加载模块信息失败:', error);
        }
    }
    
    async loadDeviceInfo() {
        try {
            // 获取设备信息
            const deviceInfo = await getDeviceInfo();
            
            // 更新UI
            if (this.deviceInfo) {
                this.deviceInfo.textContent = `${deviceInfo.model} | Android ${deviceInfo.android} (SDK ${deviceInfo.sdk})`;
            }
        } catch (error) {
            console.error('加载设备信息失败:', error);
        }
    }
    
    openGitHub() {
        // 打开GitHub页面
        window.open('https://github.com/AMMF-Team/AMMF', '_blank');
    }
}

// 当DOM加载完成后初始化关于页面管理器
document.addEventListener('DOMContentLoaded', () => {
    window.aboutManager = new AboutManager();
});
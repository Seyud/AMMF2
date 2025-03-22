// 应用主类
class App {
    constructor() {
        // 初始化状态
        this.initialized = false;
        
        // 初始化应用
        this.init();
    }
    
    // 初始化应用
    async init() {
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initApp());
            } else {
                this.initApp();
            }
        } catch (error) {
            console.error('初始化应用失败:', error);
        }
    }
    
    // 确保配置文件可访问
    async ensureConfigAccess() {
        const sourceConfigPath = `${utils.MODULE_PATH}module_settings/config.sh`;
        const webConfigPath = 'config.sh';  // 相对于webroot的路径
        
        try {
            // 检查源配置文件是否存在
            const sourceExists = await utils.fileExists(sourceConfigPath);
            if (!sourceExists) {
                console.error(`源配置文件不存在: ${sourceConfigPath}`);
                return false;
            }
            
            // 复制配置文件到webroot
            await utils.execCommand(`cp "${sourceConfigPath}" "${webConfigPath}"`);
            console.log(`配置文件已复制到: ${webConfigPath}`);
            
            // 设置权限
            await utils.execCommand(`chmod 644 "${webConfigPath}"`);
            console.log('已设置配置文件权限');
            
            return true;
        } catch (error) {
            console.error('确保配置文件访问时出错:', error);
            return false;
        }
    }
    
    // 初始化应用
    async initApp() {
        try {
            // 显示加载指示器
            this.showLoading();
            
            // 设置加载超时
            const loadingTimeout = setTimeout(() => {
                // 如果5秒后仍在加载，强制隐藏加载指示器并显示内容
                this.hideLoading();
                console.warn('加载超时，强制显示内容');
                
                // 显示可能的错误提示
                if (window.statusManager) {
                    statusManager.showToast('加载时间过长，部分功能可能不可用', 'warning');
                }
                
                // 标记初始化完成
                this.initialized = true;
                document.dispatchEvent(new CustomEvent('appInitialized'));
                
                // 确保事件绑定
                this.bindEvents();
            }, 5000);
            
            // 确保配置文件可访问
            const configAccessible = await this.ensureConfigAccess();
            if (configAccessible) {
                console.log('配置文件现在可以访问');
            } else {
                console.warn('无法确保配置文件可访问，将使用默认配置');
            }
            
            // 初始化主题模块
            if (window.themeManager) {
                // 主题模块已在HTML中通过script标签加载
                console.log('主题模块已加载');
            } else {
                console.warn('主题模块未加载，将使用默认主题');
            }
            
            // 初始化工具模块
            if (!window.utils) {
                this.showError('无法初始化工具模块');
                clearTimeout(loadingTimeout);
                return;
            }
            
            // 初始化语言模块
            if (window.languageManager) {
                await window.languageManager.init().catch(err => {
                    console.error('语言模块初始化出错:', err);
                    // 继续执行，使用默认语言
                });
            } else {
                console.warn('语言模块未加载，将使用默认语言');
            }
            
            // 初始化状态管理模块
            if (window.statusManager) {
                await window.statusManager.init().catch(err => {
                    console.error('状态模块初始化出错:', err);
                    // 继续执行
                });
            } else {
                console.warn('状态模块未加载');
            }
            
            // 初始化导航模块
            if (window.navigationManager) {
                await window.navigationManager.init().catch(err => {
                    console.error('导航模块初始化出错:', err);
                    // 继续执行
                });
            } else {
                console.warn('导航模块未加载');
            }
            
            // 清除超时
            clearTimeout(loadingTimeout);
            
            // 隐藏加载指示器
            this.hideLoading();
            
            // 标记初始化完成
            this.initialized = true;
            console.log('应用初始化完成');
            
            // 绑定事件监听器
            this.bindEvents();
            
            // 触发应用初始化完成事件
            document.dispatchEvent(new CustomEvent('appInitialized'));
        } catch (error) {
            console.error('应用初始化出错:', error);
            this.hideLoading();
            this.showError('初始化应用时出错');
        }
    }
    
    // 绑定全局事件监听器
    bindEvents() {
        // 确保只绑定一次
        if (this._eventsBound) return;
        this._eventsBound = true;
        
        console.log('绑定全局事件监听器');
        
        // 绑定主题切换按钮
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.themeManager) {
                    themeManager.toggleTheme();
                }
                console.log('主题切换按钮被点击');
            });
        }
        
        // 绑定语言按钮
        const languageButton = document.getElementById('language-button');
        if (languageButton) {
            languageButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.languageManager) {
                    languageManager.showLanguageSelector();
                }
                console.log('语言按钮被点击');
            });
        }
        
        // 为所有按钮添加点击效果
        this.addClickEffectToButtons();
        
        // 监听导航变化，重新绑定新页面的事件
        document.addEventListener('navigationChanged', () => {
            setTimeout(() => {
                this.addClickEffectToButtons();
                this.bindPageSpecificEvents();
            }, 100);
        });
        
        // 绑定当前页面特定事件
        this.bindPageSpecificEvents();
    }
    
    // 为所有按钮添加点击效果
    addClickEffectToButtons() {
        const buttons = document.querySelectorAll('.md-button, button, .nav-item, .language-option, .setting-item, .touchable');
        buttons.forEach(button => {
            // 避免重复绑定
            if (button.dataset.clickBound) return;
            
            button.dataset.clickBound = 'true';
            
            // 添加点击效果
            button.addEventListener('mousedown', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            button.addEventListener('mouseup', function() {
                this.style.transform = '';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
            
            // 确保点击事件能够正常触发
            button.addEventListener('click', function(e) {
                console.log('按钮被点击:', this.textContent || this.innerText);
                // 阻止事件冒泡，避免被其他元素拦截
                e.stopPropagation();
            });
        });
    }
    
    // 绑定页面特定事件
    bindPageSpecificEvents() {
        // 日志页面
        if (window.logsManager) {
            const refreshLogsBtn = document.getElementById('refresh-logs');
            if (refreshLogsBtn) {
                refreshLogsBtn.addEventListener('click', () => {
                    console.log('刷新日志按钮被点击');
                    logsManager.loadLogContent();
                });
            }
            
            const autoRefreshCheckbox = document.getElementById('auto-refresh-checkbox');
            if (autoRefreshCheckbox) {
                autoRefreshCheckbox.addEventListener('change', () => {
                    console.log('自动刷新复选框状态改变:', autoRefreshCheckbox.checked);
                    if (autoRefreshCheckbox.checked) {
                        logsManager.startAutoRefresh();
                    } else {
                        logsManager.stopAutoRefresh();
                    }
                });
            }
            
            const clearLogsBtn = document.getElementById('clear-logs');
            if (clearLogsBtn) {
                clearLogsBtn.addEventListener('click', () => {
                    console.log('清除日志按钮被点击');
                    logsManager.clearLogs();
                });
            }
            
            const exportLogsBtn = document.getElementById('export-logs');
            if (exportLogsBtn) {
                exportLogsBtn.addEventListener('click', () => {
                    console.log('导出日志按钮被点击');
                    logsManager.exportLogs();
                });
            }
            
            const logFileSelect = document.getElementById('log-file-select');
            if (logFileSelect) {
                logFileSelect.addEventListener('change', () => {
                    console.log('日志文件选择改变:', logFileSelect.value);
                    logsManager.setCurrentLogFile(logFileSelect.value);
                    logsManager.loadLogContent();
                });
            }
        }
        
        // 设置页面
        // 这里可以添加设置页面的特定事件绑定
    }
    
    // 显示加载指示器
    showLoading() {
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>${window.languageManager ? languageManager.translate('LOADING', 'Loading...') : '加载中...'}</p>
                </div>
            `;
        }
    }
    
    // 隐藏加载指示器
    hideLoading() {
        // 加载指示器会被页面内容替换，不需要特别处理
    }
    
    // 显示错误信息
    showError(message) {
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">
                        <i class="material-icons">error</i>
                    </div>
                    <h2>${message}</h2>
                    <button class="md-button primary" onclick="location.reload()">
                        <i class="material-icons">refresh</i>
                        <span>${window.languageManager ? languageManager.translate('REFRESH_PAGE', 'Refresh Page') : '刷新页面'}</span>
                    </button>
                </div>
            `;
        }
    }
}

// 创建应用实例
document.addEventListener('DOMContentLoaded', () => {
    // 防止重复初始化
    if (!window.app) {
        window.app = new App();
        
        // 添加全局点击事件监听器，用于调试
        document.addEventListener('click', (e) => {
            console.log('点击事件触发于元素:', e.target);
        }, true);
    }
});
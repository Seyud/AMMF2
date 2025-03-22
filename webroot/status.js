// 状态管理模块
const statusManager = {
    // 状态刷新间隔（毫秒）
    refreshInterval: 5000,
    // 状态刷新定时器
    refreshTimer: null,
    // 当前状态
    currentStatus: 'UNKNOWN',
    
    // 状态映射表
    statusMap: {
        'RUNNING': {
            label: 'STATUS_RUNNING',
            defaultLabel: 'Running',
            icon: 'play_circle',
            color: 'var(--md-primary)'
        },
        'PAUSED': {
            label: 'STATUS_PAUSED',
            defaultLabel: 'Paused',
            icon: 'pause_circle',
            color: 'var(--md-tertiary)'
        },
        'ERROR': {
            label: 'STATUS_ERROR',
            defaultLabel: 'Error',
            icon: 'error',
            color: 'var(--md-error)'
        },
        'NORMAL_EXIT': {
            label: 'STATUS_NORMAL_EXIT',
            defaultLabel: 'Stopped',
            icon: 'stop_circle',
            color: 'var(--md-secondary)'
        },
        'UNKNOWN': {
            label: 'STATUS_UNKNOWN',
            defaultLabel: 'Unknown',
            icon: 'help',
            color: 'var(--md-outline)'
        }
    },
    
    // 渲染状态页面
    render: async function() {
        // 获取最新状态
        await this.refreshStatus();
        
        // 获取状态信息
        const statusInfo = this.statusMap[this.currentStatus] || this.statusMap['UNKNOWN'];
        
        return `
            <div class="page-container home-page">
                <div class="status-card card">
                    <div class="status-icon">
                        <i class="material-icons" style="color: ${statusInfo.color}">${statusInfo.icon}</i>
                    </div>
                    <div class="status-info">
                        <h2>${languageManager.translate('MODULE_STATUS', 'Module Status')}</h2>
                        <p class="status-text">${languageManager.translate(statusInfo.label, statusInfo.defaultLabel)}</p>
                    </div>
                </div>
                
                <div class="actions-card card">
                    <h2>${languageManager.translate('MODULE_ACTIONS', 'Module Actions')}</h2>
                    <div class="button-group">
                        <button id="refresh-status" class="md-button">
                            <i class="material-icons">refresh</i>
                            ${languageManager.translate('REFRESH_STATUS', 'Refresh Status')}
                        </button>
                        <button id="restart-service" class="md-button primary">
                            <i class="material-icons">restart_alt</i>
                            ${languageManager.translate('RESTART_SERVICE', 'Restart Service')}
                        </button>
                    </div>
                </div>
                
                <div class="settings-shortcut-card card">
                    <h2>${languageManager.translate('MODULE_SETTINGS', 'Module Settings')}</h2>
                    <p>${languageManager.translate('SETTINGS_DESC', 'Configure module behavior and preferences')}</p>
                    <button id="go-to-settings" class="md-button secondary">
                        <i class="material-icons">settings</i>
                        ${languageManager.translate('GO_TO_SETTINGS', 'Go to Settings')}
                    </button>
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender: function() {
        // 添加刷新状态按钮事件
        document.getElementById('refresh-status')?.addEventListener('click', () => {
            this.refreshStatus(true);
        });
        
        // 添加重启服务按钮事件
        document.getElementById('restart-service')?.addEventListener('click', () => {
            this.restartService();
        });
        
        // 添加设置按钮事件
        document.getElementById('go-to-settings')?.addEventListener('click', () => {
            navigationManager.navigateTo('settings');
        });
        
        // 启动自动刷新
        this.startAutoRefresh();
    },
    
    // 刷新状态
    refreshStatus: async function(showToast = false) {
        try {
            const status = await utils.getModuleStatus();
            this.currentStatus = status.trim() || 'UNKNOWN';
            
            // 更新UI
            this.updateStatusUI();
            
            if (showToast) {
                this.showToast(languageManager.translate('STATUS_REFRESHED', 'Status refreshed'));
            }
            
            return this.currentStatus;
        } catch (error) {
            console.error('Error refreshing status:', error);
            this.currentStatus = 'ERROR';
            
            if (showToast) {
                this.showToast(languageManager.translate('STATUS_REFRESH_ERROR', 'Error refreshing status'), 'error');
            }
            
            return 'ERROR';
        }
    },
    
    // 更新状态UI
    updateStatusUI: function() {
        const statusInfo = this.statusMap[this.currentStatus] || this.statusMap['UNKNOWN'];
        const statusIcon = document.querySelector('.status-icon i');
        const statusText = document.querySelector('.status-text');
        
        if (statusIcon) {
            statusIcon.textContent = statusInfo.icon;
            statusIcon.style.color = statusInfo.color;
        }
        
        if (statusText) {
            statusText.textContent = languageManager.translate(statusInfo.label, statusInfo.defaultLabel);
        }
    },
    
    // 重启服务
    restartService: async function() {
        try {
            this.showToast(languageManager.translate('RESTARTING_SERVICE', 'Restarting service...'));
            
            // 执行重启命令
            await utils.execCommand(`sh -c "killall -TERM sh ${utils.MODULE_PATH}service.sh; sh ${utils.MODULE_PATH}service.sh &"`);
            
            // 等待一段时间后刷新状态
            setTimeout(() => {
                this.refreshStatus(true);
            }, 2000);
        } catch (error) {
            console.error('Error restarting service:', error);
            this.showToast(languageManager.translate('RESTART_ERROR', 'Error restarting service'), 'error');
        }
    },
    
    // 显示Toast消息
    showToast: function(message, type = 'info') {
        // 创建Toast元素
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // 添加到页面
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 自动关闭
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    },
    
    // 启动自动刷新
    startAutoRefresh: function() {
        // 清除现有定时器
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // 设置新定时器
        this.refreshTimer = setInterval(() => {
            this.refreshStatus();
        }, this.refreshInterval);
    },
    
    // 停止自动刷新
    stopAutoRefresh: function() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
};

// 导出
window.statusManager = statusManager;

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    statusManager.stopAutoRefresh();
});
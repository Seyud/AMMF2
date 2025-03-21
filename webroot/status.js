// 模块状态管理
const moduleStatus = {
    // 状态常量
    STATUS_RUNNING: 'RUNNING',
    STATUS_PAUSED: 'PAUSED',
    STATUS_ERROR: 'ERROR',
    STATUS_NORMAL_EXIT: 'NORMAL_EXIT',
    
    // 当前状态
    currentStatus: null,
    
    // 状态文件路径
    statusFilePath: '/data/adb/modules/AMMF/status.txt',
    
    // 状态启动时间
    startTime: null,
    
    // 最后更新时间
    lastUpdate: null,
    
    // 初始化
    init: async function() {
        // 添加事件监听器
        document.getElementById('refresh-status').addEventListener('click', () => {
            this.refreshStatus();
            // 添加按钮点击动画
            navigation.addButtonClickAnimation('refresh-status');
        });
        
        document.getElementById('restart-module').addEventListener('click', () => {
            this.restartModule();
            navigation.addButtonClickAnimation('restart-module');
        });
        
        // 首次加载状态
        await this.refreshStatus();
        
        // 设置定时刷新（每30秒）
        setInterval(() => this.refreshStatus(), 30000);
    },
    
    // 刷新状态
    refreshStatus: async function() {
        try {
            // 显示加载状态
            this.updateStatusUI('检查中...', null);
            
            // 获取状态文件内容
            const status = await this.getModuleStatus();
            
            // 更新UI
            this.updateStatusUI(status);
            
            // 更新最后检查时间
            this.lastUpdate = new Date();
            document.getElementById('status-last-update').textContent = this.formatTime(this.lastUpdate);
            
            // 如果状态发生变化，记录开始时间
            if (this.currentStatus !== status) {
                this.startTime = new Date();
                this.currentStatus = status;
            }
            
            // 更新运行时间
            this.updateUptime();
            
            // 设置定时更新运行时间（每秒）
            if (!this._uptimeInterval) {
                this._uptimeInterval = setInterval(() => this.updateUptime(), 1000);
            }
            
        } catch (error) {
            console.error('获取模块状态失败:', error);
            this.updateStatusUI('ERROR', '无法获取状态');
        }
    },
    
    // 获取模块状态
    getModuleStatus: async function() {
        try {
            const result = await execCommand(`cat ${this.statusFilePath}`);
            return result.trim();
        } catch (error) {
            console.error('读取状态文件失败:', error);
            return 'ERROR';
        }
    },
    
    // 更新状态UI
    updateStatusUI: function(status, statusText) {
        const statusBadge = document.getElementById('status-badge');
        const statusValue = document.getElementById('status-value');
        
        // 清除所有状态类
        statusBadge.classList.remove('running', 'paused', 'error', 'normal-exit');
        
        // 设置状态文本
        if (statusText === null) {
            // 根据状态设置文本和样式
            switch(status) {
                case this.STATUS_RUNNING:
                    statusBadge.textContent = translations[state.language].statusRunning || '运行中';
                    statusBadge.classList.add('running');
                    statusValue.textContent = translations[state.language].statusRunningDesc || '模块正常运行中';
                    break;
                case this.STATUS_PAUSED:
                    statusBadge.textContent = translations[state.language].statusPaused || '已暂停';
                    statusBadge.classList.add('paused');
                    statusValue.textContent = translations[state.language].statusPausedDesc || '模块已暂停，等待触发';
                    break;
                case this.STATUS_ERROR:
                    statusBadge.textContent = translations[state.language].statusError || '异常';
                    statusBadge.classList.add('error');
                    statusValue.textContent = translations[state.language].statusErrorDesc || '模块运行异常';
                    break;
                case this.STATUS_NORMAL_EXIT:
                    statusBadge.textContent = translations[state.language].statusNormalExit || '已退出';
                    statusBadge.classList.add('normal-exit');
                    statusValue.textContent = translations[state.language].statusNormalExitDesc || '模块已正常退出';
                    break;
                default:
                    statusBadge.textContent = status;
                    statusValue.textContent = '未知状态';
            }
        } else {
            statusBadge.textContent = status;
            statusValue.textContent = statusText;
        }
    },
    
    // 更新运行时间
    updateUptime: function() {
        if (!this.startTime) return;
        
        const now = new Date();
        const diff = now - this.startTime;
        
        // 计算时间差
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // 格式化时间
        let uptimeText = '';
        if (days > 0) uptimeText += `${days}天 `;
        uptimeText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('status-uptime').textContent = uptimeText;
    },
    
    // 重启模块
    restartModule: async function() {
        try {
            showSnackbar(translations[state.language].restartingModule || '正在重启模块...');
            
            // 执行重启命令
            await execCommand('su -c "/data/adb/modules/AMMF/service.sh"');
            
            // 延迟后刷新状态
            setTimeout(() => this.refreshStatus(), 2000);
            
        } catch (error) {
            console.error('重启模块失败:', error);
            showSnackbar(translations[state.language].restartFailed || '重启模块失败');
        }
    },
    
    // 格式化时间
    formatTime: function(date) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
};
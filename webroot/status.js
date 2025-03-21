// 模块状态管理
const moduleStatus = {
    // 状态常量
    STATUS_RUNNING: 'RUNNING',
    STATUS_PAUSED: 'PAUSED',
    STATUS_ERROR: 'ERROR',
    STATUS_NORMAL_EXIT: 'NORMAL_EXIT',
    STATUS_NOT_RUNNING: 'NOT_RUNNING',  // 添加未运行状态
    
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
            // 添加按钮点击动画
            navigation.addButtonClickAnimation('restart-module');
        });
        
        // 初始刷新状态
        await this.refreshStatus();
        
        // 设置定时刷新
        setInterval(() => this.updateUptime(), 1000);
    },
    
    // 刷新状态
    refreshStatus: async function() {
        try {
            // 显示加载状态
            this.updateStatusUI('检查中...', null);
            
            // 检查模块是否安装
            const moduleInstalled = await this.checkModuleInstalled();
            if (!moduleInstalled) {
                this.updateStatusUI(translations[state.language].moduleNotInstalled || '模块未安装', 'ERROR');
                return;
            }
            
            // 检查状态文件是否存在
            const statusFileExists = await this.checkFileExists(this.statusFilePath);
            if (!statusFileExists) {
                this.updateStatusUI(translations[state.language].statusNotRunning || '未运行', 'not-running');
                return;
            }
            
            // 获取模块状态
            const status = await this.getModuleStatus();
            this.currentStatus = status;
            
            // 更新最后更新时间
            this.lastUpdate = new Date();
            
            // 根据状态更新UI
            switch (status) {
                case this.STATUS_RUNNING:
                    this.updateStatusUI(translations[state.language].statusRunning || '正在运行', 'running');
                    // 如果是首次检测到运行状态，设置启动时间
                    if (!this.startTime) {
                        this.startTime = new Date();
                    }
                    break;
                case this.STATUS_PAUSED:
                    this.updateStatusUI(translations[state.language].statusPaused || '已暂停', 'paused');
                    break;
                case this.STATUS_ERROR:
                    this.updateStatusUI(translations[state.language].statusError || '出错', 'error');
                    break;
                case this.STATUS_NORMAL_EXIT:
                    this.updateStatusUI(translations[state.language].statusNormalExit || '正常退出', 'normal');
                    break;
                default:
                    // 处理模块未运行或状态未知的情况
                    if (status === '' || status === 'NOT_RUNNING' || !status) {
                        this.updateStatusUI(translations[state.language].statusNotRunning || '未运行', 'not-running');
                    } else {
                        this.updateStatusUI(status, 'unknown');
                    }
            }
            
            // 更新运行时间
            this.updateUptime();
            
            // 更新最后更新时间显示
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('刷新状态失败:', error);
            this.updateStatusUI(translations[state.language].statusCheckError || '检查状态失败', 'error');
        }
    },
    
    // 检查模块是否安装
    checkModuleInstalled: async function() {
        try {
            const result = await execCommand('ls /data/adb/modules/AMMF');
            return result.trim() !== '';
        } catch (error) {
            console.error('检查模块安装状态失败:', error);
            return false;
        }
    },
    
    // 检查文件是否存在
    checkFileExists: async function(filePath) {
        try {
            await execCommand(`ls ${filePath}`);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    // 获取模块状态
    getModuleStatus: async function() {
        try {
            const result = await execCommand(`cat ${this.statusFilePath}`);
            return result.trim();
        } catch (error) {
            console.error('读取状态文件失败:', error);
            return this.STATUS_NOT_RUNNING;
        }
    },
    
    // 更新状态UI
    updateStatusUI: function(statusText, statusClass) {
        const statusValue = document.getElementById('status-value');
        const statusBadge = document.querySelector('.status-badge');
        
        // 添加更新动画
        statusValue.classList.add('updating');
        
        // 更新状态文本
        statusValue.textContent = statusText;
        
        // 更新状态徽章
        if (statusBadge) {
            // 移除所有状态类
            statusBadge.classList.remove('running', 'paused', 'error', 'not-running', 'normal', 'unknown');
            
            // 添加新状态类
            if (statusClass) {
                statusBadge.classList.add(statusClass);
                
                // 更新徽章文本
                switch (statusClass) {
                    case 'running':
                        statusBadge.textContent = translations[state.language].statusBadgeRunning || '运行中';
                        break;
                    case 'paused':
                        statusBadge.textContent = translations[state.language].statusBadgePaused || '已暂停';
                        break;
                    case 'error':
                        statusBadge.textContent = translations[state.language].statusBadgeError || '错误';
                        break;
                    case 'not-running':
                        statusBadge.textContent = translations[state.language].statusBadgeNotRunning || '未运行';
                        break;
                    case 'normal':
                        statusBadge.textContent = translations[state.language].statusBadgeNormal || '正常';
                        break;
                    default:
                        statusBadge.textContent = translations[state.language].statusBadgeUnknown || '未知';
                }
            }
        }
        
        // 移除更新动画
        setTimeout(() => {
            statusValue.classList.remove('updating');
        }, 500);
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
        if (days > 0) {
            uptimeText += `${days}${translations[state.language].days || '天'} `;
        }
        
        uptimeText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新UI
        document.getElementById('status-uptime').textContent = uptimeText;
    },
    
    // 更新最后更新时间
    updateLastUpdateTime: function() {
        if (!this.lastUpdate) return;
        
        // 格式化时间
        const hours = this.lastUpdate.getHours().toString().padStart(2, '0');
        const minutes = this.lastUpdate.getMinutes().toString().padStart(2, '0');
        const seconds = this.lastUpdate.getSeconds().toString().padStart(2, '0');
        
        const timeText = `${hours}:${minutes}:${seconds}`;
        
        // 更新UI
        document.getElementById('status-last-update').textContent = timeText;
    },
    
    // 重启模块
    restartModule: async function() {
        try {
            // 显示提示
            showSnackbar(translations[state.language].restartingModule || '正在重启模块...');
            
            // 添加状态卡片加载动画
            const statusCard = document.querySelector('.status-card');
            if (statusCard) {
                statusCard.classList.add('loading');
            }
            
            // 执行重启命令
            await execCommand('su -c "/data/adb/modules/AMMF/service.sh restart"');
            
            // 重置启动时间
            this.startTime = new Date();
            
            // 延迟后刷新状态
            setTimeout(() => {
                this.refreshStatus();
                
                // 移除加载动画
                if (statusCard) {
                    statusCard.classList.remove('loading');
                }
                
                showSnackbar(translations[state.language].restartSuccess || '模块已重启');
            }, 2000);
            
        } catch (error) {
            console.error('重启模块失败:', error);
            showSnackbar(translations[state.language].restartFailed || '重启模块失败');
            
            // 移除加载动画
            const statusCard = document.querySelector('.status-card');
            if (statusCard) {
                statusCard.classList.remove('loading');
            }
        }
    },
    
    // 更新UI文本
    updateUIText: function() {
        // 更新状态相关文本
        document.getElementById('status-label').textContent = translations[state.language].statusLabel || '当前状态:';
        document.getElementById('refresh-text').textContent = translations[state.language].refresh || '刷新';
        document.getElementById('restart-text').textContent = translations[state.language].restart || '重启';
        
        // 刷新状态以更新徽章文本
        if (this.currentStatus) {
            this.refreshStatus();
        }
    }
};
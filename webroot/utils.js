// 执行shell命令
async function execCommand(command) {
    const callbackName = `exec_callback_${Date.now()}`;
    return new Promise((resolve, reject) => {
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            errno === 0 ? resolve(stdout) : reject(stderr);
        };
        ksu.exec(command, "{}", callbackName);
    });
}

// 显示提示条
function showSnackbar(message, duration = 3000) {
    const snackbar = document.getElementById('snackbar');
    const snackbarMessage = document.getElementById('snackbar-message');
    const snackbarAction = document.getElementById('snackbar-action');
    
    snackbarMessage.textContent = message;
    snackbar.classList.add('show');
    
    // 设置自动关闭
    const timeout = setTimeout(() => {
        snackbar.classList.remove('show');
    }, duration);
    
    // 点击确定按钮关闭
    snackbarAction.onclick = () => {
        clearTimeout(timeout);
        snackbar.classList.remove('show');
    };
}

// 显示确认对话框
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const dialog = document.getElementById('confirm-dialog');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOk = document.getElementById('confirm-ok');
    const confirmCancel = document.getElementById('confirm-cancel');
    const overlay = document.getElementById('overlay');
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    // 显示对话框和遮罩
    dialog.classList.add('open');
    overlay.classList.add('visible');
    
    // 确认按钮事件
    confirmOk.onclick = () => {
        dialog.classList.remove('open');
        overlay.classList.remove('visible');
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    };
    
    // 取消按钮事件
    confirmCancel.onclick = () => {
        dialog.classList.remove('open');
        overlay.classList.remove('visible');
        if (typeof onCancel === 'function') {
            onCancel();
        }
    };
    
    // 关闭按钮事件
    const closeButtons = dialog.querySelectorAll('.dialog-close');
    closeButtons.forEach(button => {
        button.onclick = () => {
            dialog.classList.remove('open');
            overlay.classList.remove('visible');
            if (typeof onCancel === 'function') {
                onCancel();
            }
        };
    });
    
    // 点击遮罩层关闭
    overlay.onclick = () => {
        dialog.classList.remove('open');
        overlay.classList.remove('visible');
        if (typeof onCancel === 'function') {
            onCancel();
        }
    };
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 格式化持续时间
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}秒`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}小时${minutes}分`;
    } else {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}天${hours}小时`;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 检查模块状态
async function checkModuleStatus() {
    try {
        // 检查模块是否运行
        const result = await execCommand('pgrep -f "AMMF/service.sh" || echo ""');
        return result.trim() !== '';
    } catch (error) {
        console.error('检查模块状态失败:', error);
        return false;
    }
}

// 获取模块运行时间
async function getModuleUptime() {
    try {
        // 获取模块启动时间
        const result = await execCommand('stat -c %Y /data/adb/modules/AMMF/run/pid 2>/dev/null || echo 0');
        const startTime = parseInt(result.trim());
        
        if (startTime === 0) {
            return 0;
        }
        
        // 计算运行时间（秒）
        const currentTime = Math.floor(Date.now() / 1000);
        return currentTime - startTime;
    } catch (error) {
        console.error('获取模块运行时间失败:', error);
        return 0;
    }
}

// 重启模块
async function restartModule() {
    try {
        await execCommand('sh /data/adb/modules/AMMF/service.sh restart');
        return true;
    } catch (error) {
        console.error('重启模块失败:', error);
        return false;
    }
}

// 获取模块版本
async function getModuleVersion() {
    try {
        const result = await execCommand('cat /data/adb/modules/AMMF/module.prop | grep version= | cut -d= -f2');
        return result.trim();
    } catch (error) {
        console.error('获取模块版本失败:', error);
        return 'Unknown';
    }
}

// 获取设备信息
async function getDeviceInfo() {
    try {
        const model = await execCommand('getprop ro.product.model');
        const android = await execCommand('getprop ro.build.version.release');
        const sdk = await execCommand('getprop ro.build.version.sdk');
        
        return {
            model: model.trim(),
            android: android.trim(),
            sdk: sdk.trim()
        };
    } catch (error) {
        console.error('获取设备信息失败:', error);
        return {
            model: 'Unknown',
            android: 'Unknown',
            sdk: 'Unknown'
        };
    }
}
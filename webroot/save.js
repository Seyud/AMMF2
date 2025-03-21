// 保存设置
async function saveSettings() {
    try {
        // 获取当前配置文件路径
        const filePath = navigation.configFilePaths[navigation.currentConfigFile];
        
        // 根据文件类型调用不同的保存函数
        if (navigation.currentConfigFile === 'config.sh') {
            await saveConfigSh(filePath);
        } else if (navigation.currentConfigFile === 'system.prop') {
            await saveSystemProp();
        }
        
    } catch (error) {
        console.error('保存设置失败:', error);
        showSnackbar(translations[state.language].saveError || '保存失败');
    }
}

// 保存config.sh文件
async function saveConfigSh(filePath) {
    // 收集所有设置的当前值
    const updatedSettings = {};
    
    for (const key in state.settings) {
        const setting = state.settings[key];
        
        // 对于排除的设置项，保持原值和原始格式
        if (state.excludedSettings.includes(key)) {
            updatedSettings[key] = setting.originalValue;
            continue;
        }
        
        // 根据设置类型获取值
        let value;
        
        if (setting.type === 'boolean') {
            // 布尔值转换为0或1
            value = setting.value ? '1' : '0';
        } else if (setting.type === 'select') {
            // 选择框直接使用选中的值
            value = setting.value;
        } else {
            // 其他类型直接使用值
            value = setting.value;
        }
        
        // 更新设置
        updatedSettings[key] = value;
    }
    
    // 构建新的配置文件内容
    let newContent = '';
    
    // 使用原始内容的行进行更新
    const lines = state.originalContent.split('\n');
    
    for (const line of lines) {
        // 跳过空行和注释行
        if (line.trim() === '' || line.trim().startsWith('#')) {
            newContent += line + '\n';
            continue;
        }
        
        // 匹配设置行
        const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
        if (match) {
            const key = match[1];
            
            // 如果是我们要更新的设置
            if (key in updatedSettings) {
                // 使用新值
                newContent += `${key}=${updatedSettings[key]}\n`;
                // 从更新列表中删除，表示已处理
                delete updatedSettings[key];
            } else {
                // 保持原样
                newContent += line + '\n';
            }
        } else {
            // 非设置行保持原样
            newContent += line + '\n';
        }
    }
    
    // 添加任何未处理的新设置
    for (const key in updatedSettings) {
        newContent += `${key}=${updatedSettings[key]}\n`;
    }
    
    // 保存文件
    await execCommand(`su -c "echo '${newContent}' > ${filePath}"`);
    
    // 显示成功消息
    showSnackbar(translations[state.language].saveSuccess || '保存成功');
    
    // 移除已修改标记
    document.getElementById('save-button').classList.remove('modified');
    
    // 询问是否重启模块
    if (confirm(translations[state.language].confirmRestart || '保存成功，是否立即重启模块以应用更改？')) {
        moduleStatus.restartModule();
    }
}
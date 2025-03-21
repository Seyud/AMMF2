// 保存设置
async function saveSettings() {
    try {
        // 获取当前配置文件路径
        const filePath = navigation.configFilePaths[navigation.currentConfigFile];
        
        // 收集所有设置的当前值
        const updatedSettings = {};
        
        for (const key in state.settings) {
            const setting = state.settings[key];
            
            // 对于排除的设置项，保持原值和原始格式
            if (state.excludedSettings.includes(key)) {
                // 使用原始格式而不仅仅是值，这样可以保留引号
                updatedSettings[key] = setting.originalFormat || setting.value;
                continue;
            }
            
            const input = document.getElementById(`setting-${key}`);
            
            // 如果找不到输入元素（可能是排除的设置），跳过
            if (!input) continue;
            
            if (setting.type === 'boolean') {
                updatedSettings[key] = input.checked ? 'true' : 'false';
            } else if (setting.type === 'number') {
                // 确保数字值有效
                let numValue = parseInt(input.value);
                if (isNaN(numValue)) numValue = 0;
                updatedSettings[key] = numValue.toString();
            } else {
                // 文本类型，检查原始格式以保持一致性
                let value = input.value;
                
                // 如果原始值有引号格式，恢复相同的引号格式
                if (setting.originalFormat && 
                   ((setting.originalFormat.startsWith('"') && setting.originalFormat.endsWith('"')) || 
                    (setting.originalFormat.startsWith("'") && setting.originalFormat.endsWith("'")))) {
                    // 确定使用的是单引号还是双引号
                    const quoteChar = setting.originalFormat.startsWith('"') ? '"' : "'";
                    value = `${quoteChar}${value}${quoteChar}`;
                }
                
                updatedSettings[key] = value;
            }
        }
        
        // 根据文件类型生成新内容
        let newContent = '';
        
        if (navigation.currentConfigFile === 'settings.sh') {
            // 获取原始文件内容以保留注释
            const originalContent = await execCommand(`cat ${filePath}`);
            const lines = originalContent.split('\n');
            
            for (const line of lines) {
                // 保留注释和空行
                if (line.trim().startsWith('#') || line.trim() === '') {
                    newContent += line + '\n';
                    continue;
                }
                
                // 查找变量赋值
                const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
                if (match) {
                    const key = match[1];
                    if (updatedSettings[key] !== undefined) {
                        newContent += `${key}=${updatedSettings[key]}\n`;
                    } else {
                        newContent += line + '\n';
                    }
                } else {
                    newContent += line + '\n';
                }
            }
        } else if (navigation.currentConfigFile === 'system.prop') {
            // 获取原始文件内容以保留注释
            const originalContent = await execCommand(`cat ${filePath}`);
            const lines = originalContent.split('\n');
            
            for (const line of lines) {
                // 保留注释和空行
                if (line.trim().startsWith('#') || line.trim() === '') {
                    newContent += line + '\n';
                    continue;
                }
                
                // 查找属性赋值
                const match = line.match(/^([^=]+)=([^#]*)(#.*)?$/);
                if (match) {
                    const key = match[1].trim();
                    const comment = match[3] || '';
                    
                    if (updatedSettings[key] !== undefined) {
                        newContent += `${key}=${updatedSettings[key]}${comment ? ' ' + comment : ''}\n`;
                    } else {
                        newContent += line + '\n';
                    }
                } else {
                    newContent += line + '\n';
                }
            }
        }
        
        // 写入新的设置文件
        await execCommand(`echo '${newContent}' > ${filePath}`);
        
        // 显示成功消息
        // 保存成功后添加动画
        if (typeof addSaveButtonAnimation === 'function') {
            addSaveButtonAnimation(true);
        }
        
        showSnackbar(translations[state.language].saveSuccess || '设置保存成功！');
        return true;
    } catch (error) {
        console.error('保存设置时出错:', error);
        
        // 保存失败后添加动画
        if (typeof addSaveButtonAnimation === 'function') {
            addSaveButtonAnimation(false);
        }
        
        showSnackbar(translations[state.language].saveError || '保存设置时出错');
        return false;
    }
}
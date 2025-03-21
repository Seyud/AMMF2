// 切换主题
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    document.body.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    document.getElementById('theme-toggle').querySelector('span').textContent = state.isDarkMode ? 'light_mode' : 'dark_mode';
    
    // 添加主题切换动画
    document.body.classList.add('theme-transition');
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// 检测系统暗色模式
function checkDarkMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.isDarkMode = true;
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-toggle').querySelector('span').textContent = 'light_mode';
    }
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        state.isDarkMode = e.matches;
        document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        document.getElementById('theme-toggle').querySelector('span').textContent = e.matches ? 'light_mode' : 'dark_mode';
    });
}

// 生成设置表单
function generateSettingsForm() {
    const formContainer = document.getElementById('settings-form');
    formContainer.innerHTML = '';
    
    let itemDelay = 0;
    
    for (const key in state.settings) {
        // 跳过排除的设置项
        if (state.excludedSettings.includes(key)) {
            continue;
        }
        
        const setting = state.settings[key];
        const settingItem = document.createElement('div');
        settingItem.className = 'setting-item';
        settingItem.style.animationDelay = `${itemDelay}s`;
        itemDelay += 0.05; // 每个设置项增加50ms延迟
        
        // 创建标签
        const label = document.createElement('label');
        label.className = 'setting-label';
        label.setAttribute('data-key', key);
        
        // 如果有描述，使用描述，否则使用键名
        if (state.settingsDescriptions[key] && state.settingsDescriptions[key][state.language]) {
            label.textContent = key + ' - ' + state.settingsDescriptions[key][state.language];
        } else {
            label.textContent = key;
        }
        
        settingItem.appendChild(label);
        
        // 检查是否有预定义的选项
        if (state.settingsOptions[key] && state.settingsOptions[key].options) {
            // 创建选择框
            const selectContainer = document.createElement('div');
            selectContainer.className = 'select-container';
            
            const select = document.createElement('select');
            select.className = 'select-input';
            select.id = `setting-${key}`;
            
            // 添加选项
            state.settingsOptions[key].options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label[state.language] || option.value;
                
                // 设置当前选中的选项
                if (setting.value === option.value) {
                    optionElement.selected = true;
                }
                
                select.appendChild(optionElement);
            });
            
            // 监听选择变化
            select.addEventListener('change', function() {
                state.settings[key].value = this.value;
            });
            
            selectContainer.appendChild(select);
            settingItem.appendChild(selectContainer);
        } else if (setting.type === 'boolean') {
            // 创建开关
            const switchContainer = document.createElement('div');
            switchContainer.style.display = 'flex';
            switchContainer.style.alignItems = 'center';
            
            const switchLabel = document.createElement('label');
            switchLabel.className = 'switch';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = setting.value === 'true';
            input.id = `setting-${key}`;
            input.addEventListener('change', function() {
                // 修复布尔值实时更新的bug
                const booleanValue = switchContainer.querySelector('.boolean-value');
                booleanValue.textContent = this.checked ? 
                    translations[state.language].booleanTrue : 
                    translations[state.language].booleanFalse;
                
                // 更新状态中的值
                state.settings[key].value = this.checked ? 'true' : 'false';
            });
            
            const slider = document.createElement('span');
            slider.className = 'slider';
            
            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);
            
            const booleanValue = document.createElement('span');
            booleanValue.className = 'boolean-value';
            booleanValue.style.marginLeft = '12px';
            booleanValue.textContent = input.checked ? 
                translations[state.language].booleanTrue : 
                translations[state.language].booleanFalse;
            
            switchContainer.appendChild(switchLabel);
            switchContainer.appendChild(booleanValue);
            settingItem.appendChild(switchContainer);
            
        } else if (setting.type === 'number') {
            // 创建数字输入控件
            const numContainer = document.createElement('div');
            numContainer.className = 'range-container';
            
            // 数字值
            const numValue = parseInt(setting.value);
            
            // 如果数字大于100，直接使用输入框
            const useInputBox = numValue > 100;
            
            // 创建输入框
            const textInput = document.createElement('input');
            textInput.type = 'number';
            textInput.className = 'text-input';
            textInput.style.width = '80px';
            textInput.style.marginRight = '10px';
            textInput.value = numValue;
            textInput.id = `setting-${key}`;
            textInput.style.display = useInputBox ? 'inline-block' : 'none';
            
            // 创建滑动条
            const rangeInput = document.createElement('input');
            rangeInput.type = 'range';
            rangeInput.className = 'range-input';
            rangeInput.min = 0;
            rangeInput.max = Math.max(100, numValue * 2);
            rangeInput.value = numValue;
            rangeInput.style.display = useInputBox ? 'none' : 'block';
            
            // 显示当前值
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'range-value';
            valueDisplay.textContent = numValue;
            valueDisplay.style.display = useInputBox ? 'none' : 'inline-block';
            
            // 切换按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'icon-button';
            toggleBtn.innerHTML = '<span class="material-symbols-outlined">' + 
                                 (useInputBox ? 'tune' : 'edit') + '</span>';
            toggleBtn.title = useInputBox ? '使用滑动条' : '使用输入框';
            
            // 滑动条事件
            rangeInput.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
                textInput.value = this.value;
                state.settings[key].value = this.value;
            });
            
            // 输入框事件
            textInput.addEventListener('input', function() {
                rangeInput.value = this.value;
                valueDisplay.textContent = this.value;
                state.settings[key].value = this.value;
            });
            
            // 切换按钮事件
            toggleBtn.addEventListener('click', function() {
                const isInputVisible = textInput.style.display !== 'none';
                textInput.style.display = isInputVisible ? 'none' : 'inline-block';
                rangeInput.style.display = isInputVisible ? 'block' : 'none';
                valueDisplay.style.display = isInputVisible ? 'inline-block' : 'none';
                this.innerHTML = '<span class="material-symbols-outlined">' + 
                               (isInputVisible ? 'edit' : 'tune') + '</span>';
                this.title = isInputVisible ? '使用输入框' : '使用滑动条';
            });
            
            numContainer.appendChild(rangeInput);
            numContainer.appendChild(textInput);
            numContainer.appendChild(valueDisplay);
            numContainer.appendChild(toggleBtn);
            settingItem.appendChild(numContainer);
        } else {
            // 创建文本输入框
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'text-input';
            textInput.value = setting.value;
            textInput.id = `setting-${key}`;
            
            settingItem.appendChild(textInput);
        }
        
        formContainer.appendChild(settingItem);
    }
    
    // 添加表单出现动画
    formContainer.classList.add('form-appear');
    setTimeout(() => {
        formContainer.classList.remove('form-appear');
    }, 1000);
}

// 添加设置项变更动画
function addSettingChangeAnimation(element) {
    // 先移除可能存在的动画类
    element.classList.remove('setting-changed');
    
    // 触发重排以应用新的动画
    void element.offsetWidth;
    
    // 添加动画类
    element.classList.add('setting-changed');
    
    // 确保动画结束后移除类
    element.addEventListener('animationend', function onAnimationEnd() {
        element.classList.remove('setting-changed');
        element.removeEventListener('animationend', onAnimationEnd);
    });
    
    // 作为备份，设置超时移除类（以防animationend事件未触发）
    setTimeout(() => {
        element.classList.remove('setting-changed');
    }, 500);
}

// 修复保存按钮动画
function addSaveButtonAnimation(success) {
    const saveButton = document.getElementById('save-button');
    const animClass = success ? 'save-success' : 'save-error';
    
    // 移除可能存在的动画类
    saveButton.classList.remove('save-success', 'save-error');
    
    // 触发重排
    void saveButton.offsetWidth;
    
    // 添加新动画类
    saveButton.classList.add(animClass);
    
    // 监听动画结束事件
    saveButton.addEventListener('animationend', function onAnimationEnd() {
        saveButton.classList.remove(animClass);
        saveButton.removeEventListener('animationend', onAnimationEnd);
    });
    
    // 备份超时
    setTimeout(() => {
        saveButton.classList.remove(animClass);
    }, 1000);
}

// 为Snackbar添加动画
function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.classList.remove('show');
    void snackbar.offsetWidth; // 触发重排以应用新的动画
    snackbar.classList.add('show');
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000);
}
// 系统属性管理
class SystemPropManager {
    constructor() {
        this.propContainer = document.getElementById('system-prop-container');
        this.propLoading = document.getElementById('system-prop-loading');
        this.propForm = document.getElementById('system-prop-form');
        this.saveButton = document.getElementById('save-system-prop');
        this.addButton = document.getElementById('add-property');
        this.emptyState = document.getElementById('no-properties');
        this.createButton = document.getElementById('create-system-prop');
        
        this.init();
    }
    
    async init() {
        // 保存按钮点击事件
        this.saveButton.addEventListener('click', () => {
            this.saveSystemProp();
        });
        
        // 添加属性按钮点击事件
        this.addButton.addEventListener('click', () => {
            this.addProperty();
        });
        
        // 创建system.prop按钮点击事件
        if (this.createButton) {
            this.createButton.addEventListener('click', () => {
                this.createSystemProp();
            });
        }
        
        // 加载系统属性
        await this.loadSystemProp();
    }
    
    async loadSystemProp() {
        try {
            // 显示加载状态
            this.propLoading.style.display = 'flex';
            this.propContainer.style.display = 'none';
            
            // 检查system.prop文件是否存在
            const checkCommand = 'test -f /data/adb/modules/AMMF/system.prop && echo "exists" || echo "not_exists"';
            const checkResult = await execCommand(checkCommand);
            
            if (checkResult.trim() === 'not_exists') {
                // 文件不存在，显示创建按钮
                this.propLoading.style.display = 'none';
                document.getElementById('create-prop-container').style.display = 'flex';
                return;
            }
            
            // 读取system.prop文件
            const command = 'cat /data/adb/modules/AMMF/system.prop';
            const content = await execCommand(command);
            
            // 隐藏加载状态
            this.propLoading.style.display = 'none';
            this.propContainer.style.display = 'block';
            
            // 解析系统属性
            const properties = this.parseSystemProp(content);
            
            // 创建表单
            this.createPropForm(properties);
        } catch (error) {
            console.error('加载系统属性失败:', error);
            this.propLoading.style.display = 'none';
            this.propContainer.style.display = 'block';
            this.propForm.innerHTML = `<p class="error-message">${error.message || '加载系统属性失败'}</p>`;
        }
    }
    
    parseSystemProp(content) {
        const properties = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            
            // 跳过空行和注释
            if (line === '' || line.startsWith('#')) {
                return;
            }
            
            // 解析属性
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                
                properties.push({ key, value });
            }
        });
        
        return properties;
    }
    
    createPropForm(properties) {
        // 清空表单
        this.propForm.innerHTML = '';
        
        if (properties.length === 0) {
            // 没有属性，显示空状态
            this.emptyState.style.display = 'flex';
            this.saveButton.style.display = 'none';
            return;
        }
        
        // 隐藏空状态
        this.emptyState.style.display = 'none';
        this.saveButton.style.display = 'block';
        
        // 创建属性表单
        properties.forEach((prop, index) => {
            const propGroup = document.createElement('div');
            propGroup.className = 'property-group';
            propGroup.setAttribute('data-index', index);
            
            // 键输入框
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.className = 'form-control property-key';
            keyInput.name = `property_key_${index}`;
            keyInput.value = prop.key;
            keyInput.placeholder = window.i18n.translate('WEBUI_PROPERTY_KEY');
            
            // 值输入框
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.className = 'form-control property-value';
            valueInput.name = `property_value_${index}`;
            valueInput.value = prop.value;
            valueInput.placeholder = window.i18n.translate('WEBUI_PROPERTY_VALUE');
            
            // 删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'icon-button delete-property';
            deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            deleteButton.addEventListener('click', () => {
                this.deleteProperty(index);
            });
            
            // 添加到属性组
            propGroup.appendChild(keyInput);
            propGroup.appendChild(valueInput);
            propGroup.appendChild(deleteButton);
            
            // 添加到表单
            this.propForm.appendChild(propGroup);
        });
    }
    
    addProperty() {
        // 隐藏空状态
        this.emptyState.style.display = 'none';
        this.saveButton.style.display = 'block';
        
        // 获取当前属性数量
        const propertyGroups = this.propForm.querySelectorAll('.property-group');
        const index = propertyGroups.length;
        
        // 创建新属性组
        const propGroup = document.createElement('div');
        propGroup.className = 'property-group';
        propGroup.setAttribute('data-index', index);
        
        // 键输入框
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'form-control property-key';
        keyInput.name = `property_key_${index}`;
        keyInput.placeholder = window.i18n.translate('WEBUI_PROPERTY_KEY');
        
        // 值输入框
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'form-control property-value';
        valueInput.name = `property_value_${index}`;
        valueInput.placeholder = window.i18n.translate('WEBUI_PROPERTY_VALUE');
        
        // 删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-button delete-property';
        deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteButton.addEventListener('click', () => {
            this.deleteProperty(index);
        });
        
        // 添加到属性组
        propGroup.appendChild(keyInput);
        propGroup.appendChild(valueInput);
        propGroup.appendChild(deleteButton);
        
        // 添加到表单
        this.propForm.appendChild(propGroup);
        
        // 聚焦到新添加的键输入框
        keyInput.focus();
    }
    
    deleteProperty(index) {
        // 获取要删除的属性组
        const propGroup = this.propForm.querySelector(`.property-group[data-index="${index}"]`);
        if (propGroup) {
            propGroup.remove();
        }
        
        // 重新排序索引
        const propertyGroups = this.propForm.querySelectorAll('.property-group');
        propertyGroups.forEach((group, i) => {
            group.setAttribute('data-index', i);
            
            const keyInput = group.querySelector('.property-key');
            const valueInput = group.querySelector('.property-value');
            const deleteButton = group.querySelector('.delete-property');
            
            keyInput.name = `property_key_${i}`;
            valueInput.name = `property_value_${i}`;
            
            // 更新删除按钮事件
            deleteButton.onclick = () => {
                this.deleteProperty(i);
            };
        });
        
        // 如果没有属性，显示空状态
        if (propertyGroups.length === 0) {
            this.emptyState.style.display = 'flex';
            this.saveButton.style.display = 'none';
        }
    }
    
    async saveSystemProp() {
        try {
            // 收集属性
            const properties = [];
            const propertyGroups = this.propForm.querySelectorAll('.property-group');
            
            propertyGroups.forEach(group => {
                const keyInput = group.querySelector('.property-key');
                const valueInput = group.querySelector('.property-value');
                
                if (keyInput.value.trim() !== '') {
                    properties.push({
                        key: keyInput.value.trim(),
                        value: valueInput.value.trim()
                    });
                }
            });
            
            // 构建system.prop内容
            let content = '';
            properties.forEach(prop => {
                content += `${prop.key}=${prop.value}\n`;
            });
            
            // 保存system.prop文件
            const command = `echo '${content}' > /data/adb/modules/AMMF/system.prop`;
            await execCommand(command);
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_SYSTEM_PROP_SAVED'));
            
            // 重新加载系统属性
            await this.loadSystemProp();
        } catch (error) {
            console.error('保存系统属性失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_SYSTEM_PROP_SAVE_FAILED'));
        }
    }
    
    async createSystemProp() {
        try {
            // 创建空的system.prop文件
            const command = 'touch /data/adb/modules/AMMF/system.prop';
            await execCommand(command);
            
            // 显示成功消息
            showSnackbar(window.i18n.translate('WEBUI_SYSTEM_PROP_CREATED'));
            
            // 重新加载系统属性
            await this.loadSystemProp();
        } catch (error) {
            console.error('创建system.prop失败:', error);
            showSnackbar(window.i18n.translate('WEBUI_SYSTEM_PROP_CREATE_FAILED'));
        }
    }
}

// 当DOM加载完成后初始化系统属性管理器
document.addEventListener('DOMContentLoaded', () => {
    window.systemPropManager = new SystemPropManager();
});
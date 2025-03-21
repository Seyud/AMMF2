# AMMF WebUI 开发指南

[简体中文](WEBUI_GUIDE.md) | [English](WEBUI_GUIDE_EN.md)

## 📋 概述

本文档提供了AMMF框架WebUI部分的开发和自定义指南。WebUI是一个基于浏览器的配置界面，允许用户通过图形化界面配置模块设置，查看状态信息，以及执行常用操作。

## 🚀 快速开始

## 🎨 自定义WebUI

### 文件结构

WebUI相关文件位于 `webroot/` 目录下：

```
webroot/
├── index.html         # 主页面
├── app.js             # 主应用逻辑
├── styles.css         # 样式表
├── animations.css     # 动画样式
├── language.js        # 多语言支持
├── navigation.js      # 导航逻辑
├── settings.js        # 设置处理
├── status.js          # 状态处理
├── theme.js           # 主题处理
├── ui.js              # 界面组件
└── utils.js           # 工具函数
```

### 修改界面布局

要修改WebUI的界面布局，编辑 `webroot/index.html` 文件。该文件包含了WebUI的基本HTML结构。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AMMF WebUI</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="animations.css">
</head>
<body>
    <!-- 导航栏 -->
    <nav id="main-nav">
        <!-- 导航项目 -->
    </nav>
    
    <!-- 主内容区 -->
    <main id="content">
        <!-- 内容将通过JavaScript动态加载 -->
    </main>
    
    <!-- 脚本引用 -->
    <script src="language.js"></script>
    <script src="utils.js"></script>
    <script src="ui.js"></script>
    <script src="theme.js"></script>
    <script src="navigation.js"></script>
    <script src="settings.js"></script>
    <script src="status.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

### 自定义样式

要修改WebUI的样式，编辑 `webroot/styles.css` 文件。该文件包含了WebUI的CSS样式定义。

```css
/* 示例：修改主题颜色 */
:root {
    --primary-color: #4285f4;
    --secondary-color: #34a853;
    --background-color: #ffffff;
    --text-color: #202124;
    /* 添加更多颜色变量 */
}

/* 示例：修改按钮样式 */
button.primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
}
```

### 添加新页面

要添加新页面，需要修改以下文件：

1. 在 `navigation.js` 中添加新的导航项：

```javascript
// 添加新页面到导航菜单
function setupNavigation() {
    const navItems = [
        { id: 'dashboard', label: getTranslation('nav_dashboard'), icon: 'dashboard' },
        { id: 'settings', label: getTranslation('nav_settings'), icon: 'settings' },
        { id: 'status', label: getTranslation('nav_status'), icon: 'info' },
        // 添加新页面
        { id: 'new-page', label: getTranslation('nav_new_page'), icon: 'extension' }
    ];
    
    // 创建导航项
    createNavItems(navItems);
}
```

2. 在 `app.js` 中添加新页面的内容渲染函数：

```javascript
// 渲染新页面内容
function renderNewPage() {
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    // 创建页面标题
    const title = document.createElement('h1');
    title.textContent = getTranslation('new_page_title');
    content.appendChild(title);
    
    // 添加页面内容
    const pageContent = document.createElement('div');
    pageContent.innerHTML = `
        <p>${getTranslation('new_page_description')}</p>
        <!-- 添加更多内容 -->
    `;
    content.appendChild(pageContent);
}
```

3. 在 `language.js` 中添加新页面的翻译字符串：

```javascript
const translations = {
    'en': {
        // 现有翻译
        'nav_new_page': 'New Page',
        'new_page_title': 'New Page Title',
        'new_page_description': 'This is a new page description.'
    },
    'zh': {
        // 现有翻译
        'nav_new_page': '新页面',
        'new_page_title': '新页面标题',
        'new_page_description': '这是新页面的描述。'
    }
    // 其他语言
};
```

## 📊 数据处理

### 设置处理

WebUI通过 `settings.js` 文件处理模块设置。该文件负责从服务器获取设置，显示设置表单，以及保存用户修改的设置。

```javascript
// 获取设置
async function fetchSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return {};
    }
}

// 保存设置
async function saveSettings(settings) {
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving settings:', error);
        return { success: false, error: error.message };
    }
}
```

### 状态监控

WebUI通过 `status.js` 文件处理模块状态信息。该文件负责从服务器获取状态信息并显示在界面上。

```javascript
// 获取状态信息
async function fetchStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching status:', error);
        return {};
    }
}

// 更新状态显示
function updateStatusDisplay(status) {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) return;
    
    // 清空容器
    statusContainer.innerHTML = '';
    
    // 添加状态信息
    for (const [key, value] of Object.entries(status)) {
        const statusItem = document.createElement('div');
        statusItem.className = 'status-item';
        statusItem.innerHTML = `
            <span class="status-label">${getTranslation('status_' + key)}:</span>
            <span class="status-value ${value ? 'active' : 'inactive'}">${value ? getTranslation('status_active') : getTranslation('status_inactive')}</span>
        `;
        statusContainer.appendChild(statusItem);
    }
}
```

## 🔄 API 接口

WebUI通过以下API接口与后端通信：

### 设置API

- **获取设置**：`GET /api/settings`
- **保存设置**：`POST /api/settings`

### 状态API

- **获取状态**：`GET /api/status`
- **执行操作**：`POST /api/action`

## 🌐 多语言支持

WebUI支持多语言，通过 `language.js` 文件实现。该文件包含了各种语言的翻译字符串，以及语言切换功能。

```javascript
// 获取当前语言
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

// 设置语言
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    updateUILanguage();
}

// 获取翻译字符串
function getTranslation(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations['en'][key] || key;
}

// 更新UI语言
function updateUILanguage() {
    // 更新所有带有data-i18n属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = getTranslation(key);
    });
}
```

## 🎭 主题支持

WebUI支持明暗主题切换，通过 `theme.js` 文件实现。该文件包含了主题切换功能和主题相关的样式处理。

```javascript
// 获取当前主题
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

// 设置主题
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
}

// 切换主题
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}
```

## 📱 响应式设计

WebUI采用响应式设计，适应不同屏幕尺寸的设备。响应式设计主要通过CSS媒体查询实现。

```css
/* 桌面设备 */
@media (min-width: 1024px) {
    /* 桌面样式 */
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
    /* 平板样式 */
}

/* 移动设备 */
@media (max-width: 767px) {
    /* 移动设备样式 */
}
```

## 🔧 调试技巧

1. **使用浏览器开发者工具**：按F12打开开发者工具，查看控制台输出和网络请求。

2. **添加调试日志**：在JavaScript代码中添加`console.log()`语句输出调试信息。

3. **检查网络请求**：在开发者工具的Network标签页中查看API请求和响应。


## 🔄 版本兼容性

在升级AMMF框架时，请注意以下文件的变化：

1. `webroot/app.js` - 主应用逻辑可能会改变
2. `webroot/settings.js` - 设置处理逻辑可能会更新
3. `webroot/language.js` - 语言字符串可能会更新

建议在升级前备份自定义的WebUI文件，然后仔细合并任何更改。
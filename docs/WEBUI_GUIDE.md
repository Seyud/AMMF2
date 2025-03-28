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
├── core.js            # 核心功能模块
├── i18n.js            # 多语言支持
├── logger.js          # 日志记录
├── style.css          # 主样式表
├── animations.css     # 动画样式
├── layout.css         # 布局样式
├── theme.css          # 主题样式
├── theme.js           # 主题处理
└── pages/             # 页面模块
    ├── status.js      # 状态页面
    ├── logs.js        # 日志页面
    ├── settings.js    # 设置页面
    └── about.js       # 关于页面
```

### 修改界面布局

要修改WebUI的界面布局，编辑 `webroot/index.html` 文件。该文件包含了WebUI的基本HTML结构。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>AMMF WebUI</title>
    
    <!-- 样式表 -->
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="animations.css">
    <link rel="stylesheet" href="theme.css">
    <link rel="stylesheet" href="layout.css">
</head>
<body>
    <div id="app">
        <!-- 头部 -->
        <header class="app-header">...</header>
        
        <!-- 主内容区域 -->
        <main id="main-content">...</main>
        
        <!-- 底部导航 -->
        <nav class="app-nav">...</nav>
    </div>
    
    <!-- 脚本引用 -->
    <script src="theme.js"></script>
    <script src="i18n.js"></script>
    <script src="core.js"></script>
    <script src="logger.js"></script>
    <script src="pages/status.js"></script>
    <script src="pages/logs.js"></script>
    <script src="pages/settings.js"></script>
    <script src="pages/about.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

### 自定义样式

要修改WebUI的样式，编辑 `webroot/style.css` 文件。该文件包含了WebUI的CSS样式定义。

```css
/* 示例：修改主题颜色 */
:root {
    --md-primary: #006495; /* 主色调 */
    --md-onPrimary: #ffffff;
    --md-primaryContainer: #cde5ff;
    --md-onPrimaryContainer: #001d31;
    --md-secondary: #50606e;
    --md-onSecondary: #ffffff;
    --md-secondaryContainer: #d3e5f5;
    --md-onSecondaryContainer: #0c1d29;
    /* 更多颜色变量 */
}

/* 深色主题 */
.dark-theme {
    --md-primary: #91cbff;
    --md-onPrimary: #003355;
    --md-primaryContainer: #004a78;
    --md-onPrimaryContainer: #cde5ff;
    /* 更多深色主题变量 */
}
```

### 添加新页面

要添加新页面，需要执行以下步骤：

1. 在 `webroot/pages/` 目录下创建新的页面JS文件，例如 `newpage.js`：

```javascript
/**
 * AMMF WebUI 新页面模块
 * 描述新页面的功能
 */

const NewPage = {
    // 初始化
    async init() {
        try {
            // 初始化代码
            return true;
        } catch (error) {
            console.error('初始化新页面失败:', error);
            return false;
        }
    },
    
    // 渲染页面
    render() {
        return `
            <div class="page-container new-page">
                <h2 data-i18n="NEW_PAGE_TITLE">新页面</h2>
                <div class="card">
                    <p data-i18n="NEW_PAGE_CONTENT">这是新页面的内容</p>
                </div>
            </div>
        `;
    },
    
    // 渲染后的回调
    afterRender() {
        // 绑定事件等操作
    }
};

// 导出页面模块
window.NewPage = NewPage;
```

2. 在 `webroot/index.html` 中引入新页面的脚本：

```html
<!-- 在其他页面脚本之后添加 -->
<script src="pages/newpage.js"></script>
```

3. 在 `webroot/app.js` 中注册新页面：

```javascript
// 页面模块
this.pageModules = {
    status: window.StatusPage,
    logs: window.LogsPage,
    settings: window.SettingsPage,
    about: window.AboutPage,
    newpage: window.NewPage  // 添加新页面
};
```

4. 在导航栏中添加新页面的入口：

```html
<!-- 在app-nav中添加 -->
<div class="nav-item" data-page="newpage">
    <span class="material-symbols-rounded">extension</span>
    <span class="nav-label" data-i18n="NAV_NEW_PAGE">新页面</span>
</div>
```

5. 在 `webroot/i18n.js` 中添加新页面的翻译字符串：

```javascript
// 中文翻译
this.translations.zh = {
    // 现有翻译
    NAV_NEW_PAGE: '新页面',
    NEW_PAGE_TITLE: '新页面标题',
    NEW_PAGE_CONTENT: '这是新页面的内容'
};

// 英文翻译
this.translations.en = {
    // 现有翻译
    NAV_NEW_PAGE: 'New Page',
    NEW_PAGE_TITLE: 'New Page Title',
    NEW_PAGE_CONTENT: 'This is the content of the new page'
};
```

## 📊 数据处理

### 设置处理

WebUI通过 `pages/settings.js` 文件处理模块设置。该文件负责从服务器获取设置，显示设置表单，以及保存用户修改的设置。

```javascript
// 加载设置数据
async loadSettingsData() {
    try {
        this.showLoading();
        
        // 执行Shell命令获取设置
        const settingsData = await Core.execCommand(`cat "${Core.MODULE_PATH}module_settings/settings.json"`);
        this.settings = JSON.parse(settingsData);
        
        this.hideLoading();
        return this.settings;
    } catch (error) {
        console.error('加载设置数据失败:', error);
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_LOAD_ERROR', '加载设置失败'), 'error');
        return {};
    }
},

// 保存设置
async saveSettings() {
    try {
        this.showLoading();
        
        // 将设置转换为JSON字符串
        const settingsJson = JSON.stringify(this.settings, null, 4);
        
        // 执行Shell命令保存设置
        await Core.execCommand(`echo '${settingsJson}' > "${Core.MODULE_PATH}module_settings/settings.json"`);
        
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_SAVED', '设置已保存'), 'success');
        return true;
    } catch (error) {
        console.error('保存设置失败:', error);
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_SAVE_ERROR', '保存设置失败'), 'error');
        return false;
    }
}
```

### 状态监控

WebUI通过 `pages/status.js` 文件处理模块状态信息。该文件负责从服务器获取状态信息并显示在界面上。

```javascript
// 加载模块状态
async loadModuleStatus() {
    try {
        // 执行Shell命令获取状态
        const statusOutput = await Core.execCommand(`cd "${Core.MODULE_PATH}" && busybox sh service.sh status`);
        
        // 解析状态输出
        if (statusOutput.includes('running')) {
            this.moduleStatus = 'RUNNING';
        } else if (statusOutput.includes('stopped')) {
            this.moduleStatus = 'STOPPED';
        } else if (statusOutput.includes('paused')) {
            this.moduleStatus = 'PAUSED';
        } else {
            this.moduleStatus = 'UNKNOWN';
        }
        
        return this.moduleStatus;
    } catch (error) {
        console.error('加载模块状态失败:', error);
        this.moduleStatus = 'UNKNOWN';
        return this.moduleStatus;
    }
}
```

## 🔄 API 接口

WebUI通过Core模块提供的API与后端通信：

### Core API

`core.js` 提供了与Shell交互的核心功能：

```javascript
// 执行Shell命令
async execCommand(command) {
    const callbackName = `exec_callback_${Date.now()}`;
    return new Promise((resolve, reject) => {
        window[callbackName] = (errno, stdout, stderr) => {
            delete window[callbackName];
            errno === 0 ? resolve(stdout) : reject(stderr);
        };
        ksu.exec(command, "{}", callbackName);
    });
}
```

## 🌐 多语言支持

WebUI支持多语言，通过 `i18n.js` 文件实现。该文件包含了各种语言的翻译字符串，以及语言切换功能。

```javascript
// 初始化语言模块
async init() {
    try {
        // 加载默认翻译
        this.loadDefaultTranslations();

        // 应用默认语言翻译
        this.applyTranslations();

        // 确定初始语言
        await this.determineInitialLanguage();

        // 再次应用语言（使用确定的语言）
        this.applyTranslations();

        // 初始化语言选择器
        this.initLanguageSelector();

        return true;
    } catch (error) {
        console.error('初始化语言模块失败:', error);
        // 使用默认语言
        this.currentLang = 'zh';
        return false;
    }
},

// 获取翻译字符串
translate(key, fallback = '') {
    const translation = this.translations[this.currentLang]?.[key] || 
                       this.translations['zh']?.[key] || 
                       fallback || 
                       key;
    return translation;
},

// 应用翻译到DOM元素
applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = this.translate(key, element.textContent);
    });
}
```

## 🎭 主题支持

WebUI支持明暗主题切换，通过 `theme.js` 文件实现。该文件包含了主题切换功能和主题相关的样式处理。

```javascript
// 初始化主题
init() {
    // 获取存储的主题或系统主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        this.setTheme(savedTheme);
    } else {
        // 使用系统主题
        this.useSystemTheme();
    }
    
    // 绑定主题切换按钮
    this.bindThemeToggle();
    
    // 监听系统主题变化
    this.watchSystemTheme();
},

// 设置主题
setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // 更新主题图标
    const themeIcon = document.querySelector('#theme-toggle .material-symbols-rounded');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
}
```

## 📱 响应式设计

WebUI采用响应式设计，适应不同屏幕尺寸的设备。响应式设计主要通过CSS媒体查询实现。

```css
/* 桌面设备 */
@media (min-width: 1024px) {
    .app-nav {
        width: 80px;
        height: 100%;
        flex-direction: column;
        top: 60px;
        left: 0;
    }
    
    #main-content {
        margin-left: 80px;
        margin-bottom: 0;
    }
}

/* 平板设备 */
@media (min-width: 768px) and (max-width: 1023px) {
    .app-nav {
        height: 60px;
        bottom: 0;
    }
    
    #main-content {
        margin-bottom: 60px;
    }
}

/* 移动设备 */
@media (max-width: 767px) {
    .app-nav {
        height: 56px;
        bottom: 0;
    }
    
    #main-content {
        margin-bottom: 56px;
    }
}
```

## 🔧 调试技巧

1. **使用浏览器开发者工具**：按F12打开开发者工具，查看控制台输出和网络请求。

2. **添加调试日志**：在JavaScript代码中添加`console.log()`语句输出调试信息。

3. **使用logger.js模块**：使用内置的日志模块记录信息。

```javascript
// 记录日志
Logger.log('信息', 'info');
Logger.log('警告', 'warning');
Logger.log('错误', 'error');
```

## 🔄 版本兼容性

在升级AMMF框架时，请注意以下文件的变化：

1. `webroot/app.js` - 主应用逻辑可能会改变
2. `webroot/core.js` - 核心功能可能会更新
3. `webroot/i18n.js` - 语言字符串可能会更新

建议在升级前备份自定义的WebUI文件，然后仔细合并任何更改。
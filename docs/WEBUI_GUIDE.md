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
├── style.css          # 主样式表（导入其他CSS模块）
├── theme.js           # 主题处理
└── css/               # 样式模块目录
    ├── base.css       # 基础样式和变量
    ├── animations.css # 动画效果
    ├── layout.css     # 布局样式
    ├── components-base.css # 基础组件样式
    ├── components-page.css # 页面组件样式
    └── utilities.css  # 工具类样式
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
    <meta name="theme-color" content="#006495">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="AMMF WebUI - 模块管理界面">
    <meta name="color-scheme" content="light dark">
    <title>AMMF WebUI</title>
    
    <!-- 字体和图标 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <!-- 主题脚本 - 在样式表之前加载，防止闪烁 -->
    <script src="theme.js"></script>
    
    <!-- 样式表 -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <!-- 头部 -->
        <header class="app-header">
            <div class="header-content">
                <div class="header-title">
                    <h1 id="page-title">AMMF WebUI</h1>
                </div>
                <div class="header-actions">
                    <!-- 页面特定操作按钮容器 -->
                    <div id="page-actions" class="page-actions"></div>
                    
                    <!-- 语言切换按钮 -->
                    <button id="language-button" class="icon-button" title="语言">
                        <span class="material-symbols-rounded">translate</span>
                    </button>
                    
                    <!-- 主题切换按钮 -->
                    <button id="theme-toggle" class="icon-button" title="主题">
                        <span class="material-symbols-rounded">light_mode</span>
                    </button>
                </div>
            </div>
        </header>
        
        <!-- 主内容区域 -->
        <main id="main-content">
            <!-- 内容将由JavaScript动态加载 -->
        </main>
        
        <!-- 底部导航 -->
        <nav class="app-nav">
            <div class="nav-content">
                <div class="nav-item active" data-page="status">
                    <span class="material-symbols-rounded">dashboard</span>
                    <span class="nav-label" data-i18n="NAV_STATUS">状态</span>
                </div>
                <div class="nav-item" data-page="logs">
                    <span class="material-symbols-rounded">article</span>
                    <span class="nav-label" data-i18n="NAV_LOGS">日志</span>
                </div>
                <div class="nav-item" data-page="settings">
                    <span class="material-symbols-rounded">settings</span>
                    <span class="nav-label" data-i18n="NAV_SETTINGS">设置</span>
                </div>
                <div class="nav-item" data-page="about">
                    <span class="material-symbols-rounded">info</span>
                    <span class="nav-label" data-i18n="NAV_ABOUT">关于</span>
                </div>
            </div>
        </nav>
    </div>
    
    <!-- 核心脚本 -->
    <script src="core.js"></script>
    <script src="i18n.js"></script>
    
    <!-- 页面模块 -->
    <script src="pages/status.js"></script>
    <script src="pages/logs.js"></script>
    <script src="pages/settings.js"></script>
    <script src="pages/about.js"></script>
    
    <!-- 主应用脚本 -->
    <script src="app.js"></script>
</body>
</html>
```

### 自定义样式

WebUI的样式现在采用模块化结构，主样式文件 `webroot/style.css` 通过导入其他CSS模块来组织样式：

```css
/**
 * AMMF WebUI 主样式文件
 * 导入所有模块化的CSS文件
 */

/* 导入基础样式和变量 */
@import url('css/base.css');

/* 导入布局样式 */
@import url('css/layout.css');

/* 导入组件样式 - 拆分为基础组件和页面组件 */
@import url('css/components-base.css');
@import url('css/components-page.css');

/* 导入动画效果 */
@import url('css/animations.css');

/* 导入工具类样式 */
@import url('css/utilities.css');
```

要修改样式，可以编辑相应的CSS模块文件：

- `css/base.css` - 包含基础变量和样式定义
- `css/layout.css` - 包含页面布局相关样式
- `css/components-base.css` - 包含通用UI组件样式
- `css/components-page.css` - 包含页面特定组件样式
- `css/animations.css` - 包含动画和过渡效果
- `css/utilities.css` - 包含工具类样式

基础变量定义示例（`css/base.css`）：

```css
/* 基础变量 */
:root {
  /* 卡片和元素圆角 */
  --card-border-radius: 16px;
  --button-border-radius: 20px;

  /* 阴影 */
  --md-sys-elevation-level1: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level2: 0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level3: 0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);

  /* 状态层不透明度 */
  --md-sys-state-hover-opacity: 0.08;
  --md-sys-state-focus-opacity: 0.12;
  --md-sys-state-pressed-opacity: 0.12;
  --md-sys-state-dragged-opacity: 0.16;

  /* 间距变量 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* 颜色变量 */
  --md-primary: #006495;
  --md-onPrimary: #ffffff;
  --md-primaryContainer: #cde5ff;
  --md-onPrimaryContainer: #001d31;
  /* 更多颜色变量 */
}

/* 深色主题 */
[data-theme="dark"] {
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
<!-- 在nav-content中添加 -->
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

WebUI采用响应式设计，适应不同屏幕尺寸的设备。响应式设计主要通过CSS媒体查询实现，位于 `css/layout.css` 文件中。

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

3. **使用Core.showToast方法**：使用内置的提示功能显示调试信息。

```javascript
// 显示提示信息
Core.showToast('调试信息', 'info');
Core.showToast('警告信息', 'warning');
Core.showToast('错误信息', 'error');
Core.showToast('成功信息', 'success');
```

## 🔄 版本兼容性

在升级AMMF框架时，请注意以下文件的变化：

1. `webroot/app.js` - 主应用逻辑可能会改变
2. `webroot/core.js` - 核心功能可能会更新
3. `webroot/i18n.js` - 语言字符串可能会更新
4. `webroot/css/` - 样式文件可能会更新

建议在升级前备份自定义的WebUI文件，然后仔细合并任何更改。
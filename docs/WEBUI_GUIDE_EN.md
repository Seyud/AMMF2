# AMMF WebUI Development Guide

[简体中文](WEBUI_GUIDE.md) | [English](WEBUI_GUIDE_EN.md)

## 📋 Overview

This document provides development and customization guidelines for the WebUI part of the AMMF framework. WebUI is a browser-based configuration interface that allows users to configure module settings, view status information, and perform common operations through a graphical interface.

## 🚀 Quick Start

## 🎨 Customizing WebUI

### File Structure

WebUI-related files are located in the `webroot/` directory:

```
webroot/
├── index.html         # Main page
├── app.js             # Main application logic
├── core.js            # Core functionality module
├── i18n.js            # Multi-language support
├── style.css          # Main stylesheet (imports other CSS modules)
├── theme.js           # Theme handling
└── css/               # Style modules directory
    ├── base.css       # Base styles and variables
    ├── animations.css # Animation effects
    ├── layout.css     # Layout styles
    ├── components-base.css # Base component styles
    ├── components-page.css # Page component styles
    └── utilities.css  # Utility styles
└── pages/             # Page modules
    ├── status.js      # Status page
    ├── logs.js        # Logs page
    ├── settings.js    # Settings page
    └── about.js       # About page
```

### Modifying the Interface Layout

To modify the WebUI interface layout, edit the `webroot/index.html` file. This file contains the basic HTML structure of WebUI.

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#006495">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="AMMF WebUI - Module Management Interface">
    <meta name="color-scheme" content="light dark">
    <title>AMMF WebUI</title>
    
    <!-- Fonts and icons -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <!-- Theme script - loaded before stylesheets to prevent flashing -->
    <script src="theme.js"></script>
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <!-- Header -->
        <header class="app-header">
            <div class="header-content">
                <div class="header-title">
                    <h1 id="page-title">AMMF WebUI</h1>
                </div>
                <div class="header-actions">
                    <!-- Page-specific action buttons container -->
                    <div id="page-actions" class="page-actions"></div>
                    
                    <!-- Language switch button -->
                    <button id="language-button" class="icon-button" title="Language">
                        <span class="material-symbols-rounded">translate</span>
                    </button>
                    
                    <!-- Theme toggle button -->
                    <button id="theme-toggle" class="icon-button" title="Theme">
                        <span class="material-symbols-rounded">light_mode</span>
                    </button>
                </div>
            </div>
        </header>
        
        <!-- Main content area -->
        <main id="main-content">
            <!-- Content will be dynamically loaded by JavaScript -->
        </main>
        
        <!-- Bottom navigation -->
        <nav class="app-nav">
            <div class="nav-content">
                <div class="nav-item active" data-page="status">
                    <span class="material-symbols-rounded">dashboard</span>
                    <span class="nav-label" data-i18n="NAV_STATUS">Status</span>
                </div>
                <div class="nav-item" data-page="logs">
                    <span class="material-symbols-rounded">article</span>
                    <span class="nav-label" data-i18n="NAV_LOGS">Logs</span>
                </div>
                <div class="nav-item" data-page="settings">
                    <span class="material-symbols-rounded">settings</span>
                    <span class="nav-label" data-i18n="NAV_SETTINGS">Settings</span>
                </div>
                <div class="nav-item" data-page="about">
                    <span class="material-symbols-rounded">info</span>
                    <span class="nav-label" data-i18n="NAV_ABOUT">About</span>
                </div>
            </div>
        </nav>
    </div>
    
    <!-- Core scripts -->
    <script src="core.js"></script>
    <script src="i18n.js"></script>
    
    <!-- Page modules -->
    <script src="pages/status.js"></script>
    <script src="pages/logs.js"></script>
    <script src="pages/settings.js"></script>
    <script src="pages/about.js"></script>
    
    <!-- Main application script -->
    <script src="app.js"></script>
</body>
</html>
```

### Customizing Styles

WebUI styles now use a modular structure, with the main stylesheet `webroot/style.css` organizing styles by importing other CSS modules:

```css
/**
 * AMMF WebUI Main Stylesheet
 * Imports all modular CSS files
 */

/* Import base styles and variables */
@import url('css/base.css');

/* Import layout styles */
@import url('css/layout.css');

/* Import component styles - split into base components and page components */
@import url('css/components-base.css');
@import url('css/components-page.css');

/* Import animation effects */
@import url('css/animations.css');

/* Import utility styles */
@import url('css/utilities.css');
```

To modify styles, you can edit the corresponding CSS module files:

- `css/base.css` - Contains base variables and style definitions
- `css/layout.css` - Contains page layout related styles
- `css/components-base.css` - Contains common UI component styles
- `css/components-page.css` - Contains page-specific component styles
- `css/animations.css` - Contains animations and transition effects
- `css/utilities.css` - Contains utility class styles

Base variable definition example (`css/base.css`):

```css
/* Base variables */
:root {
  /* Card and element border radius */
  --card-border-radius: 16px;
  --button-border-radius: 20px;

  /* Shadows */
  --md-sys-elevation-level1: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level2: 0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level3: 0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);

  /* State layer opacity */
  --md-sys-state-hover-opacity: 0.08;
  --md-sys-state-focus-opacity: 0.12;
  --md-sys-state-pressed-opacity: 0.12;
  --md-sys-state-dragged-opacity: 0.16;

  /* Spacing variables */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Color variables */
  --md-primary: #006495;
  --md-onPrimary: #ffffff;
  --md-primaryContainer: #cde5ff;
  --md-onPrimaryContainer: #001d31;
  /* More color variables */
}

/* Dark theme */
[data-theme="dark"] {
  --md-primary: #91cbff;
  --md-onPrimary: #003355;
  --md-primaryContainer: #004a78;
  --md-onPrimaryContainer: #cde5ff;
  /* More dark theme variables */
}
```

### Adding New Pages

To add new pages, follow these steps:

1. Create a new page JS file in the `webroot/pages/` directory, for example `newpage.js`:

```javascript
/**
 * AMMF WebUI New Page Module
 * Description of the new page functionality
 */

const NewPage = {
    // Initialization
    async init() {
        try {
            // Initialization code
            return true;
        } catch (error) {
            console.error('Failed to initialize new page:', error);
            return false;
        }
    },
    
    // Render page
    render() {
        return `
            <div class="page-container new-page">
                <h2 data-i18n="NEW_PAGE_TITLE">New Page</h2>
                <div class="card">
                    <p data-i18n="NEW_PAGE_CONTENT">This is the content of the new page</p>
                </div>
            </div>
        `;
    },
    
    // After render callback
    afterRender() {
        // Bind events and other operations
    }
};

// Export page module
window.NewPage = NewPage;
```

2. Include the new page script in `webroot/index.html`:

```html
<!-- Add after other page scripts -->
<script src="pages/newpage.js"></script>
```

3. Register the new page in `webroot/app.js`:

```javascript
// Page modules
this.pageModules = {
    status: window.StatusPage,
    logs: window.LogsPage,
    settings: window.SettingsPage,
    about: window.AboutPage,
    newpage: window.NewPage  // Add new page
};
```

4. Add an entry for the new page in the navigation bar:

```html
<!-- Add in nav-content -->
<div class="nav-item" data-page="newpage">
    <span class="material-symbols-rounded">extension</span>
    <span class="nav-label" data-i18n="NAV_NEW_PAGE">New Page</span>
</div>
```

5. Add translation strings for the new page in `webroot/i18n.js`:

```javascript
// Chinese translation
this.translations.zh = {
    // Existing translations
    NAV_NEW_PAGE: '新页面',
    NEW_PAGE_TITLE: '新页面标题',
    NEW_PAGE_CONTENT: '这是新页面的内容'
};

// English translation
this.translations.en = {
    // Existing translations
    NAV_NEW_PAGE: 'New Page',
    NEW_PAGE_TITLE: 'New Page Title',
    NEW_PAGE_CONTENT: 'This is the content of the new page'
};
```

## 📊 Data Processing

### Settings Handling

WebUI handles module settings through the `pages/settings.js` file. This file is responsible for retrieving settings from the server, displaying the settings form, and saving user-modified settings.

```javascript
// Load settings data
async loadSettingsData() {
    try {
        this.showLoading();
        
        // Execute Shell command to get settings
        const settingsData = await Core.execCommand(`cat "${Core.MODULE_PATH}module_settings/settings.json"`);
        this.settings = JSON.parse(settingsData);
        
        this.hideLoading();
        return this.settings;
    } catch (error) {
        console.error('Failed to load settings data:', error);
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_LOAD_ERROR', 'Failed to load settings'), 'error');
        return {};
    }
},

// Save settings
async saveSettings() {
    try {
        this.showLoading();
        
        // Convert settings to JSON string
        const settingsJson = JSON.stringify(this.settings, null, 4);
        
        // Execute Shell command to save settings
        await Core.execCommand(`echo '${settingsJson}' > "${Core.MODULE_PATH}module_settings/settings.json"`);
        
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_SAVED', 'Settings saved'), 'success');
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        this.hideLoading();
        Core.showToast(I18n.translate('SETTINGS_SAVE_ERROR', 'Failed to save settings'), 'error');
        return false;
    }
}
```

### Status Monitoring

WebUI handles module status information through the `pages/status.js` file. This file is responsible for retrieving status information from the server and displaying it on the interface.

```javascript
// Load module status
async loadModuleStatus() {
    try {
        // Execute Shell command to get status
        const statusOutput = await Core.execCommand(`cd "${Core.MODULE_PATH}" && busybox sh service.sh status`);
        
        // Parse status output
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
        console.error('Failed to load module status:', error);
        this.moduleStatus = 'UNKNOWN';
        return this.moduleStatus;
    }
}
```

## 🔄 API Interface

WebUI communicates with the backend through the API provided by the Core module:

### Core API

`core.js` provides core functionality for interacting with Shell:

```javascript
// Execute Shell command
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

## 🌐 Multi-language Support

WebUI supports multiple languages through the `i18n.js` file. This file contains translation strings for various languages and language switching functionality.

```javascript
// Initialize language module
async init() {
    try {
        // Load default translations
        this.loadDefaultTranslations();

        // Apply default language translations
        this.applyTranslations();

        // Determine initial language
        await this.determineInitialLanguage();

        // Apply language again (using determined language)
        this.applyTranslations();

        // Initialize language selector
        this.initLanguageSelector();

        return true;
    } catch (error) {
        console.error('Failed to initialize language module:', error);
        // Use default language
        this.currentLang = 'zh';
        return false;
    }
},

// Get translation string
translate(key, fallback = '') {
    const translation = this.translations[this.currentLang]?.[key] || 
                       this.translations['zh']?.[key] || 
                       fallback || 
                       key;
    return translation;
},

// Apply translations to DOM elements
applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = this.translate(key, element.textContent);
    });
}
```

## 🎭 Theme Support

WebUI supports light and dark theme switching through the `theme.js` file. This file contains theme switching functionality and theme-related style handling.

```javascript
// Initialize theme
init() {
    // Get stored theme or system theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        this.setTheme(savedTheme);
    } else {
        // Use system theme
        this.useSystemTheme();
    }
    
    // Bind theme toggle button
    this.bindThemeToggle();
    
    // Watch for system theme changes
    this.watchSystemTheme();
},

// Set theme
setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme icon
    const themeIcon = document.querySelector('#theme-toggle .material-symbols-rounded');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
}
```

## 📱 Responsive Design

WebUI uses responsive design to adapt to different screen sizes. Responsive design is mainly implemented through CSS media queries in the `css/layout.css` file.

```css
/* Desktop devices */
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

/* Tablet devices */
@media (min-width: 768px) and (max-width: 1023px) {
    .app-nav {
        height: 60px;
        bottom: 0;
    }
    
    #main-content {
        margin-bottom: 60px;
    }
}

/* Mobile devices */
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

## 🔧 Debugging Tips

1. **Use browser developer tools**: Press F12 to open developer tools, view console output and network requests.

2. **Add debug logs**: Add `console.log()` statements in JavaScript code to output debug information.

3. **Use Core.showToast method**: Use the built-in toast functionality to display debug information.

```javascript
// Show toast messages
Core.showToast('Debug information', 'info');
Core.showToast('Warning information', 'warning');
Core.showToast('Error information', 'error');
Core.showToast('Success information', 'success');
```

## 🔄 Version Compatibility

When upgrading the AMMF framework, pay attention to changes in the following files:

1. `webroot/app.js` - Main application logic may change
2. `webroot/core.js` - Core functionality may be updated
3. `webroot/i18n.js` - Language strings may be updated
4. `webroot/css/` - Style files may be updated

It is recommended to back up customized WebUI files before upgrading, then carefully merge any changes.
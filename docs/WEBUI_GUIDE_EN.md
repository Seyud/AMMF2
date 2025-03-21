# AMMF WebUI Development Guide

[简体中文](WEBUI_GUIDE.md) | [English](WEBUI_GUIDE_EN.md)

## 📋 Overview

This document provides development and customization guidelines for the WebUI component of the AMMF framework. The WebUI is a browser-based configuration interface that allows users to configure module settings, view status information, and perform common operations through a graphical interface.

## 🚀 Quick Start

## 🎨 Customizing the WebUI

### File Structure

WebUI-related files are located in the `webroot/` directory:

```
webroot/
├── index.html         # Main page
├── app.js             # Main application logic
├── styles.css         # Stylesheet
├── animations.css     # Animation styles
├── language.js        # Multi-language support
├── navigation.js      # Navigation logic
├── settings.js        # Settings handling
├── status.js          # Status handling
├── theme.js           # Theme handling
├── ui.js              # UI components
└── utils.js           # Utility functions
```

### Modifying the Interface Layout

To modify the WebUI interface layout, edit the `webroot/index.html` file. This file contains the basic HTML structure of the WebUI.

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
    <!-- Navigation bar -->
    <nav id="main-nav">
        <!-- Navigation items -->
    </nav>
    
    <!-- Main content area -->
    <main id="content">
        <!-- Content will be dynamically loaded through JavaScript -->
    </main>
    
    <!-- Script references -->
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

### Customizing Styles

To modify the WebUI styles, edit the `webroot/styles.css` file. This file contains the CSS style definitions for the WebUI.

```css
/* Example: Modify theme colors */
:root {
    --primary-color: #4285f4;
    --secondary-color: #34a853;
    --background-color: #ffffff;
    --text-color: #202124;
    /* Add more color variables */
}

/* Example: Modify button styles */
button.primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
}
```

### Adding New Pages

To add new pages, you need to modify the following files:

1. Add a new navigation item in `navigation.js`:

```javascript
// Add new page to navigation menu
function setupNavigation() {
    const navItems = [
        { id: 'dashboard', label: getTranslation('nav_dashboard'), icon: 'dashboard' },
        { id: 'settings', label: getTranslation('nav_settings'), icon: 'settings' },
        { id: 'status', label: getTranslation('nav_status'), icon: 'info' },
        // Add new page
        { id: 'new-page', label: getTranslation('nav_new_page'), icon: 'extension' }
    ];
    
    // Create navigation items
    createNavItems(navItems);
}
```

2. Add a content rendering function for the new page in `app.js`:

```javascript
// Render new page content
function renderNewPage() {
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    // Create page title
    const title = document.createElement('h1');
    title.textContent = getTranslation('new_page_title');
    content.appendChild(title);
    
    // Add page content
    const pageContent = document.createElement('div');
    pageContent.innerHTML = `
        <p>${getTranslation('new_page_description')}</p>
        <!-- Add more content -->
    `;
    content.appendChild(pageContent);
}
```

3. Add translation strings for the new page in `language.js`:

```javascript
const translations = {
    'en': {
        // Existing translations
        'nav_new_page': 'New Page',
        'new_page_title': 'New Page Title',
        'new_page_description': 'This is a new page description.'
    },
    'zh': {
        // Existing translations
        'nav_new_page': '新页面',
        'new_page_title': '新页面标题',
        'new_page_description': '这是新页面的描述。'
    }
    // Other languages
};
```

## 📊 Data Handling

### Settings Handling

The WebUI handles module settings through the `settings.js` file. This file is responsible for fetching settings from the server, displaying settings forms, and saving user-modified settings.

```javascript
// Fetch settings
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

// Save settings
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

### Status Monitoring

The WebUI handles module status information through the `status.js` file. This file is responsible for fetching status information from the server and displaying it in the interface.

```javascript
// Fetch status information
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

// Update status display
function updateStatusDisplay(status) {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) return;
    
    // Clear container
    statusContainer.innerHTML = '';
    
    // Add status information
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

## 🔄 API Interfaces

The WebUI communicates with the backend through the following API interfaces:

### Settings API

- **Get Settings**: `GET /api/settings`
- **Save Settings**: `POST /api/settings`

### Status API

- **Get Status**: `GET /api/status`
- **Execute Action**: `POST /api/action`

## 🌐 Multi-language Support

The WebUI supports multiple languages through the `language.js` file. This file contains translation strings for various languages and language switching functionality.

```javascript
// Get current language
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

// Set language
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    updateUILanguage();
}

// Get translation string
function getTranslation(key) {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || translations['en'][key] || key;
}

// Update UI language
function updateUILanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = getTranslation(key);
    });
}
```

## 🎭 Theme Support

The WebUI supports light and dark themes through the `theme.js` file. This file contains theme switching functionality and theme-related style handling.

```javascript
// Get current theme
function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

// Set theme
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}
```

## 📱 Responsive Design

The WebUI uses responsive design to adapt to different screen sizes. Responsive design is primarily implemented through CSS media queries.

```css
/* Desktop devices */
@media (min-width: 1024px) {
    /* Desktop styles */
}

/* Tablet devices */
@media (min-width: 768px) and (max-width: 1023px) {
    /* Tablet styles */
}

/* Mobile devices */
@media (max-width: 767px) {
    /* Mobile device styles */
}
```

## 🔧 Debugging Tips

1. **Use browser developer tools**: Press F12 to open developer tools, check console output and network requests.

2. **Add debug logs**: Add `console.log()` statements in JavaScript code to output debug information.

3. **Check network requests**: View API requests and responses in the Network tab of developer tools.


## 🔄 Version Compatibility

When upgrading the AMMF framework, pay attention to changes in the following files:

1. `webroot/app.js` - Main application logic may change
2. `webroot/settings.js` - Settings handling logic may be updated
3. `webroot/language.js` - Language strings may be updated

It's recommended to back up customized WebUI files before upgrading, then carefully merge any changes.
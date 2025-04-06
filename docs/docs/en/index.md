# AMMF2 - Aurora Modular Magisk Framework

[简体中文](../zh/index.md) | [English](../en/index.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 Project Overview

AMMF2 (Aurora Modular Magisk Framework 2) is a powerful Magisk module development framework designed to simplify the module development process by providing standardized structures and rich functional components. The framework supports multiple languages, WebUI configuration interface, custom scripts, and other features, making it suitable for various types of Magisk module development.

## ✨ Key Features

- **Multi-language Support**: Built-in support for Chinese, English, Japanese, Russian, and other languages
- **WebUI Configuration Interface**: Beautiful Material Design-style web configuration interface
- **Custom Script System**: Flexible script system supporting installation-time and runtime scripts
- **File Monitoring Service**: Built-in filewatch tool supporting file change-triggered operations
- **Logging Tools**: Complete logging system with log recording and error handling
- **User Interaction Features**: Various user interaction methods such as menu selection and key detection
- **GitHub Action Support**: Built-in GitHub Action workflows supporting automatic building and publishing
- **Comprehensive Error Handling**: Provides complete error handling and logging mechanisms

## 🚀 Quick Start

### Getting the Framework

```bash
# Method 1: Clone the repository using Git
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# Method 2: Download ZIP archive
# Visit https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip

# Other methods...
```

### Basic Configuration

**Note: This framework requires GitHub Action for module building**

1. **Edit Module Information (for building module.prop)**:
   Modify basic information in `module_settings/config.sh`:

   ```bash
   action_id="your_module_id"           # Module ID
   action_name="Your Module Name"       # Module Name
   action_author="Your Name"            # Author Name
   ```
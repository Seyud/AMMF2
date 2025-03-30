# AMMF2 - Aurora Modular Magisk Framework

[简体中文](README.md) | [English](README_EN.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 Project Overview

AMMF2 (Aurora Modular Magisk Framework 2) is a powerful Magisk module development framework designed to simplify the module development process, providing a standardized structure and rich functional components. The framework supports features such as multi-language, WebUI configuration interface, custom scripts, and more, suitable for various types of Magisk module development.

## ✨ Key Features

- **Multi-language Support**: Built-in support for Chinese, English, Japanese, Russian, and more
- **WebUI Configuration Interface**: Beautiful Material Design style web configuration interface
- **Custom Script System**: Flexible script system supporting installation-time and runtime scripts
- **File Monitoring Service**: Built-in filewatch tool, supporting file change triggered operations
- **Logging Tools**: Complete logging system supporting log recording and error handling
- **User Interaction Functions**: Various user interaction methods such as menu selection and key detection
- **GitHub Action Support**: Built-in GitHub Action workflows for automatic building and publishing
- **Comprehensive Error Handling**: Provides comprehensive error handling and logging mechanisms

## 🚀 Quick Start

### Get the Framework

```bash
# Method 1: Clone the repository using Git
git clone https://github.com/Aurora-Nasa-1/AMMF2.git

# Method 2: Download ZIP archive directly
# Visit https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip
```

### Basic Configuration

1. **Edit Module Information**:
   Modify the basic information in the `module_settings/config.sh` file:
   ```bash
   action_id="your_module_id"            # Module ID
   action_name="Your Module Name"       # Module name
   action_author="Your Name"            # Author name
   action_description="Description"     # Module description
   ```

2. **Configure Environment Requirements**:
   Set the module's environment requirements in `module_settings/config.sh`:
   ```bash
   magisk_min_version="25400"          # Minimum Magisk version
   ksu_min_version="11300"             # Minimum KernelSU version
   ANDROID_API="26"                    # Minimum Android API level
   ```

3. **Multi-language Configuration**:
   Edit the `files/languages.sh` file to add or modify multi-language support.

### Custom Script Development

1. **Installation Script**:
   Write custom scripts to be executed during module installation in `files/scripts/install_custom_script.sh`.

2. **Service Script**:
   Write service scripts for module runtime in `files/scripts/service_script.sh`.

## 📚 More Documentation

- [Directory Structure](DIRECTORY_STRUCTURE_EN.md) - Detailed project directory structure description
- [Script Development Guide](SCRIPT_EN.md) - Script development and function usage instructions
- [WebUI Development Guide](WEBUI_GUIDE_EN.md) - WebUI development and customization instructions

## 🤝 Contribution

PRs and Issues are welcome to improve this framework! If you find this project useful, please give it a Star ⭐

## 📄 License

This project is licensed under the [MIT LICENSE](../LICENSE).
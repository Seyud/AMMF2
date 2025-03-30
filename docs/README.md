# AMMF2 - Aurora Modular Magisk Framework

[简体中文](README.md) | [English](README_EN.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 项目概述

AMMF2 (Aurora Modular Magisk Framework 2) 是一个功能强大的Magisk模块开发框架，旨在简化模块开发流程，提供标准化的结构和丰富的功能组件。该框架支持多语言、WebUI配置界面、自定义脚本等特性，适用于各种类型的Magisk模块开发。

## ✨ 主要特性

- **多语言支持**：内置中文、英文、日语、俄语等多种语言支持
- **WebUI配置界面**：提供美观的Material Design风格Web配置界面
- **自定义脚本系统**：灵活的脚本系统，支持安装时和运行时脚本
- **文件监控服务**：内置filewatch工具，支持文件变化触发操作
- **日志操作工具**：完整的日志系统，支持日志记录和错误处理
- **用户交互功能**：提供多种用户交互方式，如菜单选择、按键检测等
- **GitHub Action支持**：内置GitHub Action工作流，支持自动构建和发布
- **完善的错误处理**：提供全面的错误处理和日志记录机制

## 🚀 快速开始

### 获取框架

```bash
# 方法1：使用Git克隆仓库
git clone https://github.com/Aurora-Nasa-1/AMMF2.git

# 方法2：直接下载ZIP压缩包
# 访问 https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip
```

### 基本配置

1. **编辑模块信息**：
   修改 `module_settings/config.sh` 文件中的基本信息：
   ```bash
   action_id="your_module_id"            # 模块ID
   action_name="Your Module Name"       # 模块名称
   action_author="Your Name"            # 作者名称
   action_description="Description"     # 模块描述
   ```

2. **配置环境要求**：
   在 `module_settings/config.sh` 中设置模块的环境要求：
   ```bash
   magisk_min_version="25400"          # 最低Magisk版本
   ksu_min_version="11300"             # 最低KernelSU版本
   ANDROID_API="26"                    # 最低Android API级别
   ```

3. **多语言配置**：
   编辑 `files/languages.sh` 文件，添加或修改多语言支持。

### 自定义脚本开发

1. **安装脚本**：
   在 `files/scripts/install_custom_script.sh` 中编写模块安装时执行的自定义脚本。

2. **服务脚本**：
   在 `files/scripts/service_script.sh` 中编写模块运行时的服务脚本。

## 📚 更多文档

- [目录结构说明](DIRECTORY_STRUCTURE.md) - 详细的项目目录结构说明
- [脚本开发指南](SCRIPT.md) - 脚本开发和函数使用说明
- [WebUI开发指南](WEBUI_GUIDE.md) - WebUI开发和自定义说明

## 🤝 贡献

欢迎提交PR或Issue来改进这个框架！如果您觉得这个项目有用，请给它一个Star ⭐

## 📄 许可证

本项目采用 [MIT LICENSE](../LICENSE) 许可证。
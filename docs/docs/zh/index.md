# AMMF2 - Aurora Modular Magisk Framework

[简体中文](../zh/index.md) | [English](../en/index.md)

<div align="center">
    <img src="https://img.shields.io/github/commit-activity/w/Aurora-Nasa-1/AMMF2" alt="GitHub Commit Activity">
    <img src="https://img.shields.io/github/license/Aurora-Nasa-1/AMMF2" alt="GitHub License">
</div>

## 📋 项目概述

AMMF2 (Aurora Modular Magisk Framework 2) 是一个功能强大的 Magisk 模块开发框架，旨在简化模块开发流程，提供标准化的结构和丰富的功能组件。该框架支持多语言、WebUI 配置界面、自定义脚本等特性，适用于各种类型的 Magisk 模块开发。

## ✨ 主要特性

- **多语言支持**：内置中文、英文、日语、俄语等多种语言支持
- **WebUI 配置界面**：提供美观的 Material Design 风格 Web 配置界面
- **自定义脚本系统**：灵活的脚本系统，支持安装时和运行时脚本
- **文件监控服务**：内置 filewatch 工具，支持文件变化触发操作
- **日志操作工具**：完整的日志系统，支持日志记录和错误处理
- **用户交互功能**：提供多种用户交互方式，如菜单选择、按键检测等
- **GitHub Action 支持**：内置 GitHub Action 工作流，支持自动构建和发布
- **完善的错误处理**：提供全面的错误处理和日志记录机制

## 🚀 快速开始

### 获取框架

```bash
# 方法1：使用Git克隆仓库
git clone https://github.com/Aurora-Nasa-1/AMMF2.git
cd AMMF2

# 方法2：直接下载ZIP压缩包
# 访问 https://github.com/Aurora-Nasa-1/AMMF2/archive/refs/heads/main.zip

# 其他方法...
```

### 基本配置

**注意: 本框架构建模块必须使用 Github Action**

1. **编辑模块信息(为构建 module.prop 使用)**：
   修改 `module_settings/config.sh` 文件中的基本信息：

   ```bash
   action_id="your_module_id"           # 模块ID
   action_name="Your Module Name"       # 模块名称
   action_author="Your Name"            # 作者名称
   ```
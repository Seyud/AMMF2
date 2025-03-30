# AMMF 目录结构详解

[简体中文](DIRECTORY_STRUCTURE.md) | [English](DIRECTORY_STRUCTURE_EN.md)

## 📂 概述

本文档详细描述了AMMF (Aurora Magisk Module Framework) 的目录结构，帮助开发者了解每个文件和目录的用途，便于进行模块开发和定制。

## 🗂️ 根目录结构

```
/
├── .github/                # GitHub相关配置
│   ├── ISSUE_TEMPLATE/    # Issue模板
│   └── workflows/         # GitHub Action工作流
├── bin/                   # 二进制工具
├── docs/                  # 文档目录
├── files/                 # 模块文件
│   ├── languages.sh       # 多语言支持
│   └── scripts/           # 脚本目录
├── module_settings/       # 模块设置
├── src/                   # 源代码目录
├── webroot/               # WebUI文件
├── action.sh              # 用户操作脚本
├── customize.sh           # 安装自定义脚本
├── LICENSE                # 许可证文件
└── service.sh             # 服务脚本
```

## 📁 详细目录说明

### .github/

包含GitHub相关配置，用于自动化构建和Issue管理。

- **ISSUE_TEMPLATE/**
  - `bug_report.yml` - Bug报告模板
  - `feature_request.yml` - 功能请求模板

- **workflows/**
  - `build_module_commit.yml` - 提交时构建模块的工作流
  - `build_module_release_tag.yml` - 发布标签时构建模块的工作流

### bin/

包含二进制工具，用于模块的特殊功能。

- `filewatch` - 文件监控工具，用于监控文件变化并触发操作
- `logmonitor` - 日志监控工具，用于管理模块日志

### docs/

包含项目文档，提供使用指南和开发说明。

- `README.md` - 中文项目说明
- `README_EN.md` - 英文项目说明
- `SCRIPT.md` - 中文脚本使用说明
- `SCRIPT_EN.md` - 英文脚本使用说明
- `WEBUI_GUIDE.md` - 中文WebUI开发指南
- `WEBUI_GUIDE_EN.md` - 英文WebUI开发指南
- `DIRECTORY_STRUCTURE.md` - 中文目录结构说明
- `DIRECTORY_STRUCTURE_EN.md` - 英文目录结构说明

### files/

包含模块的核心文件和脚本。

- `languages.sh` - 多语言支持配置文件，定义了各种语言的文本字符串

- **scripts/**
  - `default_scripts/` - 默认脚本目录
    - `main.sh` - 主要功能脚本，提供核心函数和变量
  - `install_custom_script.sh` - 安装时执行的自定义脚本
  - `service_script.sh` - 服务运行时执行的脚本

### module_settings/

包含模块的配置文件。

- `config.sh` - 模块基本配置，如模块ID、名称、作者、描述等
- `settings.json` - WebUI使用的设置JSON文件

### src/

包含模块的源代码文件，用于编译生成二进制工具。

- `filewatch.cpp` - 文件监控工具源码
- `logmonitor.cpp` - 日志监控工具源码

### webroot/

包含WebUI相关文件，用于提供图形化配置界面。

- `index.html` - WebUI主页面
- `app.js` - WebUI主应用逻辑
- `core.js` - WebUI核心功能
- `i18n.js` - WebUI国际化支持
- `style.css` - WebUI样式表
- `theme.js` - WebUI主题处理
- **css/** - CSS样式文件目录
  - `animations.css` - 动画效果样式
  - `base.css` - 基础样式
  - `components-base.css` - 组件基础样式
  - `components-page.css` - 页面组件样式
  - `layout.css` - 布局样式
  - `utilities.css` - 实用工具样式
- **pages/** - 页面组件目录
  - `about.js` - 关于页面
  - `logs.js` - 日志页面
  - `settings.js` - 设置页面
  - `status.js` - 状态页面

## 📄 核心文件说明

### action.sh

用户操作脚本，用于在模块安装后执行特定操作。此脚本可以被用户手动执行，用于触发模块的特定功能。

```bash
#!/system/bin/sh
MODDIR=${0%/*}
MODPATH="$MODDIR"
    if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
        abort "Notfound File!!!($MODPATH/files/scripts/default_scripts/main.sh)"
    else
        . "$MODPATH/files/scripts/default_scripts/main.sh"
    fi
# Custom Script
# -----------------
# This script extends the functionality of the default and setup scripts, allowing direct use of their variables and functions.
```

### customize.sh

安装自定义脚本，在Magisk模块安装过程中执行。负责初始化模块、检查版本兼容性、替换模块ID等操作。
不建议修改，自定义脚本请使用`install_custom_script.sh`

### service.sh

服务脚本，在系统启动后由Magisk执行。负责启动模块的后台服务和监控功能。
不建议修改，自定义脚本请使用`service_script.sh`

## 🔧 特殊工具说明

### filewatch

`bin/filewatch.c` 是一个文件监控工具，用于监控指定文件的变化并在变化时执行指定脚本。

**编译**：
在GitHub Action中自动编译。

**使用方法**：
```bash
./filewatch [选项] <监控文件> <执行脚本>
```

**选项**：
- `-d` - 以守护进程模式运行
- `-v` - 启用详细输出
- `-i <秒>` - 设置检查间隔（默认1秒）
- `-s <状态文件>` - 指定状态文件路径

**示例**：
```bash
# 监控配置文件变化，变化时执行重载脚本
./filewatch -s /path/to/status.txt /path/to/config.sh /path/to/reload.sh

# 以守护进程模式运行，每5秒检查一次
./filewatch -d -i 5 /path/to/watch.txt /path/to/script.sh
```

## 📝 文件模板

### 自定义安装脚本模板 (install_custom_script.sh)

```bash
#!/system/bin/sh

# 自定义安装脚本
# 在模块安装过程中执行

# 示例：创建必要的目录
mkdir -p "$MODPATH/data"

# 示例：下载额外文件
download_file "https://example.com/extra_file.zip"

# 示例：用户交互选择
select_on_magisk "$MODPATH/options.txt"
echo "用户选择了: $SELECT_OUTPUT"
```

### 服务脚本模板 (service_script.sh)

```bash
#!/system/bin/sh

# 服务脚本
# 在模块服务启动时执行

# 示例：启动后台服务
start_my_service() {
    # 服务启动逻辑
    echo "服务已启动"
}

# 示例：监控配置文件变化
enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"

# 执行函数
start_my_service
```

## 🔄 版本兼容性

在升级AMMF框架版本时，需要注意以下文件的变化：

1. `files/languages.sh` - 多语言支持可能有更新
2. `files/scripts/default_scripts/main.sh` - 核心函数可能有变化
3. `module_settings/config.sh` - 配置选项可能有增减
4. `webroot/` 目录 - WebUI相关文件可能有更新

升级时建议先备份自定义内容，然后再进行合并。
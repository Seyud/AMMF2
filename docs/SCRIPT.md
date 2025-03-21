# AMMF 脚本开发指南

[简体中文](SCRIPT.md) | [English](SCRIPT_EN.md)

## 📋 概述

本文档提供了在AMMF框架内开发自定义脚本的详细说明。它涵盖了可用的函数、变量以及创建安装脚本、服务脚本和用户脚本的最佳实践。

## 🛠️ 脚本类型

AMMF支持二种主要类型的脚本（可以自行添加）：

1. **安装脚本** (`files/scripts/install_custom_script.sh`)
   - 在模块安装过程中执行
   - 用于设置任务、文件提取和初始配置

2. **服务脚本** (`files/scripts/service_script.sh`)
   - 在设备启动时执行
   - 用于后台服务、监控和运行时操作

## 📚 可用函数

AMMF框架提供了几个有用的函数，可以在您的脚本中使用：

### 用户交互函数

#### `select_on_magisk [input_path]`

使用音量键导航向用户呈现选择菜单。

**参数：**
- `input_path`：包含选项的文本文件路径（每行一个）

**返回：**
- 在`$SELECT_OUTPUT`变量中返回所选选项

**兼容性：**
- 可以在安装脚本和用户脚本中使用（在用户脚本中谨慎使用）
- 不支持特殊字符或中文（兼容`/][{};:><?!()_-+=.`）

**示例：**
```bash
# 创建一个包含选项的文件
echo "选项1\n选项2\n选项3" > "$MODPATH/options.txt"

# 调用函数
select_on_magisk "$MODPATH/options.txt"

# 使用所选选项
echo "用户选择了: $SELECT_OUTPUT"
```

#### `number_select [input_path]`

向用户呈现编号选择菜单。

**参数：**
- `input_path`：包含选项的文本文件路径（每行一个）

**返回：**
- 在`$SELECT_OUTPUT`变量中返回所选编号

**兼容性：**
- 仅支持在用户脚本中使用

**示例：**
```bash
# 创建一个包含选项的文件
echo "选项1\n选项2\n选项3" > "$MODPATH/options.txt"

# 调用函数
number_select "$MODPATH/options.txt"

# 使用所选编号
echo "用户选择了选项编号: $SELECT_OUTPUT"
```

#### `key_select`

等待用户按下音量键（上/下）。

**返回：**
- 在`$key_pressed`变量中返回按下的键（`KEY_VOLUMEUP`或`KEY_VOLUMEDOWN`）

**兼容性：**
- 可以在安装脚本和用户脚本中使用（在用户脚本中谨慎使用）

**示例：**
```bash
echo "按音量上键继续或音量下键取消"
key_select

if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
    echo "继续..."
else
    echo "已取消"
    exit 1
fi
```

### 文件操作

#### `download_file [url]`

从指定URL下载文件。

**参数：**
- `url`：要下载的文件的URL

**行为：**
- 将文件下载到`settings.sh`中`$download_destination`指定的目录
- 如果目录不存在，则创建目录

**兼容性：**
- 可以在安装脚本和用户脚本中使用

**示例：**
```bash
# 设置下载目的地
download_destination="/storage/emulated/0/Download/AMMF"

# 下载文件
download_file "https://example.com/file.zip"
```

### 服务管理 （service.sh/service_script.sh）

#### `enter_pause_mode [monitored_file] [execution_script]`

进入暂停模式并使用`filewatch`工具监控文件变化。

**参数：**
- `monitored_file`：要监控的文件路径
- `execution_script`：文件变化时要执行的脚本路径

**行为：**
- 将状态更新为"PAUSED"
- 监控指定文件的变化
- 检测到变化时执行指定脚本

**兼容性：**
- 主要用于服务脚本

**示例：**
```bash
# 监控配置文件变化
enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
```

### 实用函数

#### `Aurora_ui_print [message]`

向控制台打印格式化消息。

**参数：**
- `message`：要打印的消息

**示例：**
```bash
Aurora_ui_print "开始安装..."
```

#### `Aurora_abort [message] [error_code]`

使用错误消息和代码中止脚本。

**参数：**
- `message`：错误消息
- `error_code`：错误代码

**示例：**
```bash
Aurora_abort "安装失败" 1
```

#### `replace_module_id [file_path] [file_description]`

替换指定文件中的模块ID占位符。

**参数：**
- `file_path`：文件路径
- `file_description`：文件描述（用于日志记录）

**示例：**
```bash
replace_module_id "$MODPATH/files/languages.sh" "languages.sh"
```

## 🌐 可用变量

以下变量可在您的脚本中使用：

### 路径变量

- `$MODPATH`：模块目录路径
- `$MODDIR`：与`$MODPATH`相同
- `$TMP_FOLDER`：临时文件夹路径（`$MODPATH/TEMP`）
- `$SDCARD`：内部存储路径（`/storage/emulated/0`）

### 模块信息

- `$action_id`：模块ID
- `$action_name`：模块名称
- `$action_author`：模块作者
- `$action_description`：模块描述

### 状态变量

- `$STATUS_FILE`：状态文件路径
- `$SH_ON_MAGISK`：指示脚本是否在Magisk上运行的标志

## 📝 脚本模板

### 安装脚本模板

```bash
#!/system/bin/sh

# 自定义安装脚本
# 在模块安装过程中执行

# 示例：创建必要的目录
mkdir -p "$MODPATH/data"

# 示例：下载额外文件
download_file "https://example.com/extra_file.zip"

# 示例：用户交互
echo "是否启用高级功能？"
echo "按音量上键选择是，音量下键选择否"
key_select

if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
    # 启用高级功能
    echo "advanced_features=true" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "已启用高级功能"
else
    # 禁用高级功能
    echo "advanced_features=false" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "已禁用高级功能"
fi
```

### 服务脚本模板

```bash
#!/system/bin/sh

# 服务脚本
# 在设备启动时执行

# 启动后台服务
start_background_service() {
    # 服务实现
    nohup some_command > /dev/null 2>&1 &
    Aurora_ui_print "后台服务已启动"
}

# 监控配置文件变化
monitor_config() {
    enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
}

# 执行函数
start_background_service
monitor_config
```


## 🔧 最佳实践

1. **错误处理**
   - 始终检查错误并提供有意义的错误消息
   - 对关键错误使用`Aurora_abort`

2. **文件路径**
   - 使用带有变量的绝对路径，如`$MODPATH`
   - 在`$TMP_FOLDER`中创建临时文件

3. **用户交互**
   - 在请求用户输入时提供清晰的指示
   - 根据脚本类型使用适当的函数

4. **日志记录**
   - 使用`Aurora_ui_print`记录重要消息
   - 记录重要事件和错误

5. **清理**
   - 不再需要时删除临时文件
   - 正确处理服务终止

6. **兼容性**
   - 检查所需的工具和依赖项
   - 根据Android版本或root解决方案使用条件逻辑

## 📋 调试技巧

1. **日志输出**
   - 使用`echo "DEBUG: $variable_name=$variable_value" >> "$MODPATH/debug.log"`添加调试消息

2. **检查状态**
   - 监控状态文件：`cat "$STATUS_FILE"`

3. **测试函数**
   - 使用示例输入测试单个函数

4. **检查权限**
   - 确保脚本具有适当的执行权限：`chmod +x script.sh`

5. **验证路径**
   - 在访问文件路径之前验证其是否存在

## 🔄 版本兼容性

在升级AMMF框架时，请注意以下文件的变化：

1. `files/scripts/default_scripts/main.sh` - 核心函数可能会改变
2. `files/languages.sh` - 语言字符串可能会更新

建议在升级前备份自定义脚本，然后仔细合并任何更改。
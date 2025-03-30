# AMMF Script Development Guide

[简体中文](SCRIPT.md) | [English](SCRIPT_EN.md)

## 📋 Overview

This document provides detailed instructions for developing custom scripts within the AMMF framework. It covers the available functions, variables, and best practices for creating installation scripts, service scripts, and user scripts. The AMMF2 version has completely updated the scripting system, enhancing the logging system and file monitoring capabilities.

## 🛠️ Script Types

AMMF supports two main types of scripts (you can add more as needed):

1. **Installation Scripts** (`files/scripts/install_custom_script.sh`)
   - Executed during module installation
   - Used for setup tasks, file extraction, and initial configuration
   - Can access all AMMF core functions

2. **Service Scripts** (`files/scripts/service_script.sh`)
   - Executed when the device boots
   - Used for background services, monitoring, and runtime operations
   - Supports file monitoring and status management

## 📚 Available Functions

The AMMF framework provides several useful functions that can be used in your scripts:

### User Interaction Functions

#### `select_on_magisk [input_path]`

Presents a selection menu to the user using volume keys for navigation.

**Parameters:**
- `input_path`: Path to a text file containing options (one per line)

**Returns:**
- Selected option in the `$SELECT_OUTPUT` variable

**Compatibility:**
- Can be used in installation scripts and user scripts (use with caution in user scripts)
- Does not support special characters or Chinese (compatible with `/][{};:><?!()_-+=.`)

**Example:**
```bash
# Create a file with options
echo "Option 1\nOption 2\nOption 3" > "$MODPATH/options.txt"

# Call the function
select_on_magisk "$MODPATH/options.txt"

# Use the selected option
echo "User selected: $SELECT_OUTPUT"
```

#### `number_select [input_path]`

Presents a numbered selection menu to the user.

**Parameters:**
- `input_path`: Path to a text file containing options (one per line)

**Returns:**
- Selected number in the `$SELECT_OUTPUT` variable

**Compatibility:**
- Only supported in user scripts

**Example:**
```bash
# Create a file with options
echo "Option 1\nOption 2\nOption 3" > "$MODPATH/options.txt"

# Call the function
number_select "$MODPATH/options.txt"

# Use the selected number
echo "User selected option number: $SELECT_OUTPUT"
```

#### `key_select`

Waits for the user to press a volume key (up/down).

**Returns:**
- Pressed key in the `$key_pressed` variable (`KEY_VOLUMEUP` or `KEY_VOLUMEDOWN`)

**Compatibility:**
- Can be used in installation scripts and user scripts (use with caution in user scripts)

**Example:**
```bash
echo "Press Volume Up to continue or Volume Down to cancel"
key_select

if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
    echo "Continuing..."
else
    echo "Cancelled"
    exit 1
fi
```

### File Operations

#### `download_file [url]`

Downloads a file from the specified URL.

**Parameters:**
- `url`: URL of the file to download

**Behavior:**
- Downloads the file to the directory specified by `$download_destination` in `settings.sh`
- Creates the directory if it doesn't exist
- Supports download retry and user interaction on failure

**Compatibility:**
- Can be used in installation scripts and user scripts

**Example:**
```bash
# Set download destination
download_destination="/storage/emulated/0/Download/AMMF"

# Download a file
download_file "https://example.com/file.zip"
```

### Service Management

#### `enter_pause_mode [monitored_file] [execution_script]`

Enters pause mode and monitors a file for changes using the `filewatch` tool.

**Parameters:**
- `monitored_file`: Path to the file to monitor
- `execution_script`: Path to the script to execute when the file changes

**Behavior:**
- Updates status to "PAUSED"
- Uses efficient inotify mechanism to monitor the specified file for changes
- Executes the specified script when changes are detected

**Compatibility:**
- Primarily used in service scripts

**Example:**
```bash
# Monitor configuration file for changes
enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
```

### Logging System

#### `set_log_file [log_name]`

Sets the log file name for the current script.

**Parameters:**
- `log_name`: Log file name (without extension)

**Behavior:**
- Sets the target file for subsequent log entries

**Example:**
```bash
# Set log file
set_log_file "custom_script"
```

#### `log_info [message]`

Logs an info-level message.

**Parameters:**
- `message`: Message to log

**Example:**
```bash
log_info "Starting custom operation"
```

#### `log_error [message]`

Logs an error-level message.

**Parameters:**
- `message`: Error message to log

**Example:**
```bash
log_error "Operation failed: Cannot access file"
```

#### `log_warn [message]`

Logs a warning-level message.

**Parameters:**
- `message`: Warning message to log

**Example:**
```bash
log_warn "Configuration file format may be incorrect"
```

#### `log_debug [message]`

Logs a debug-level message.

**Parameters:**
- `message`: Debug message to log

**Example:**
```bash
log_debug "Variable value: $variable"
```

#### `flush_log`

Forces the log buffer to be written to disk.

**Example:**
```bash
# Flush log after critical operation
flush_log
```

### Utility Functions

#### `Aurora_ui_print [message]`

Prints a formatted message to the console and logs it.

**Parameters:**
- `message`: The message to print

**Example:**
```bash
Aurora_ui_print "Starting installation..."
```

#### `Aurora_abort [message] [error_code]`

Aborts the script with an error message and code, and logs it.

**Parameters:**
- `message`: Error message
- `error_code`: Error code

**Example:**
```bash
Aurora_abort "Installation failed" 1
```

#### `check_network`

Checks network connectivity status.

**Returns:**
- Network status in the `$Internet_CONN` variable (0=no connection, 1=China-only network, 2=GitHub accessible, 3=Google accessible)

**Example:**
```bash
check_network
if [ -z "$Internet_CONN" ]; then
    Aurora_ui_print "No network connection, skipping download"
fi
```

#### `replace_module_id [file_path] [file_description]`

Replaces module ID placeholders in the specified file.

**Parameters:**
- `file_path`: Path to the file
- `file_description`: Description of the file (for logging)

**Example:**
```bash
replace_module_id "$MODPATH/files/languages.sh" "languages.sh"
```

## 🌐 Available Variables

The following variables are available for use in your scripts:

### Path Variables

- `$MODPATH`: Path to the module directory
- `$MODDIR`: Same as `$MODPATH`
- `$NOW_PATH`: Current script execution path
- `$TMP_FOLDER`: Temporary folder path (`$MODPATH/TEMP`)
- `$SDCARD`: Path to the internal storage (`/storage/emulated/0`)
- `$download_destination`: Default directory for downloaded files
- `$LOG_DIR`: Log directory path

### Module Information

- `$action_id`: Module ID
- `$action_name`: Module name
- `$action_author`: Module author
- `$action_description`: Module description

### Status Variables

- `$STATUS_FILE`: Status file path
- `$SH_ON_MAGISK`: Flag indicating if script is running on Magisk
- `$LOG_LEVEL`: Current log level (0=off, 1=error, 2=warning, 3=info, 4=debug)
- `$Internet_CONN`: Network connection status

## 📝 Script Templates

### Installation Script Template

```bash
#!/system/bin/sh

# Custom Installation Script
# Executed during module installation

# Set log file
set_log_file "install_custom"
log_info "Starting custom installation script"

# Example: Create necessary directories
mkdir -p "$MODPATH/data"

# Example: Check network and download extra files
check_network
if [ -n "$Internet_CONN" ]; then
    download_file "https://example.com/extra_file.zip"
else
    log_warn "No network connection, skipping download"
fi

# Example: User interaction
echo "Enable advanced features?"
echo "Press Volume Up for Yes, Volume Down for No"
key_select

if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
    # Enable advanced features
    echo "advanced_features=true" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "Advanced features enabled"
    log_info "User chose to enable advanced features"
else
    # Disable advanced features
    echo "advanced_features=false" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "Advanced features disabled"
    log_info "User chose to disable advanced features"
fi

# Ensure log is written
flush_log
```

### Service Script Template

```bash
#!/system/bin/sh

# Service Script
# Executed when the device boots

# Set log file
set_log_file "service_custom"
log_info "Starting custom service script"

# Start background service
start_background_service() {
    # Service implementation
    nohup some_command > /dev/null 2>&1 &
    log_info "Background service started"
    Aurora_ui_print "Background service started"
}

# Monitor config file changes
monitor_config() {
    log_info "Starting config file monitoring"
    enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
}

# Execute functions
start_background_service
monitor_config

# Ensure log is written
flush_log
```

## 🔧 Best Practices

1. **Error Handling**
   - Always check for errors and provide meaningful error messages
   - Use `Aurora_abort` for critical errors
   - Use the logging system to record error details

2. **File Paths**
   - Use absolute paths with variables like `$MODPATH`
   - Create temporary files in `$TMP_FOLDER`
   - Check if files exist before accessing them

3. **User Interaction**
   - Provide clear instructions when requesting user input
   - Use appropriate functions based on script type
   - Log user choices to the log file

4. **Logging**
   - Set a unique log file name for each script
   - Use appropriate log levels (error, warn, info, debug)
   - Use `flush_log` after critical operations to ensure logs are written

5. **Cleanup**
   - Delete temporary files when no longer needed
   - Handle service termination properly
   - Avoid leaving unused resources

6. **Compatibility**
   - Check for required tools and dependencies
   - Use conditional logic based on Android version or root solution
   - Test behavior on different devices

## 📋 Debugging Tips

1. **Use the Logging System**
   - Use `log_debug` to record variable values and execution flow
   - Set `LOG_LEVEL=4` to enable verbose debug logging
   - Check log files in the `$LOG_DIR` directory

2. **Check Status**
   - Monitor status file: `cat "$STATUS_FILE"`
   - Use `Aurora_ui_print` to output key status information

3. **Test Functions**
   - Test individual functions with sample inputs
   - Add log markers before and after testing

4. **Check Permissions**
   - Ensure scripts have proper execution permissions: `chmod +x script.sh`
   - Check file access permissions

5. **Verify Paths**
   - Verify file paths exist before accessing them
   - Use `ls -la` to check file attributes

## 🔄 Version Compatibility

When upgrading the AMMF framework, pay attention to changes in these files:

1. `files/scripts/default_scripts/main.sh` - Core functions may change
2. `files/scripts/default_scripts/logger.sh` - Logging system may be updated
3. `files/languages.sh` - Language strings may be updated

After upgrading, check if your custom scripts are compatible with the new version, especially for scripts that use internal framework functions.

## 🔍 Advanced Features

### File Monitoring System

AMMF2 introduces an efficient inotify-based file monitoring system through the `filewatch` tool. This tool supports:

- Real-time file change monitoring
- Low power mode option
- Daemon mode
- Custom execution scripts or commands

**Advanced Usage Example:**

```bash
# Monitor config file in low power mode
"$MODPATH/bin/filewatch" -d -l -i 5 "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
```

### Enhanced Logging System

AMMF2 includes a powerful logging system implemented through the `logmonitor` tool. This system provides:

- Multi-level logging (ERROR, WARN, INFO, DEBUG)
- Automatic log rotation
- Buffered writing for performance
- Separate log files per module

**Advanced Usage Example:**

```bash
# Manually control the logging system
"$MODPATH/bin/logmonitor" -c write -n "custom_module" -l 3 -m "Custom log message"
```

## 📚 Reference Resources

- [AMMF GitHub Repository](https://github.com/AuroraProject/AMMF)
- [Magisk Module Development Documentation](https://topjohnwu.github.io/Magisk/guides.html)
- [Shell Scripting Guide](https://www.gnu.org/software/bash/manual/bash.html)

---

For any questions or suggestions, please submit an issue on the GitHub repository or contact the module author.
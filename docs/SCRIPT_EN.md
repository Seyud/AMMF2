# AMMF Script Development Guide

[简体中文](SCRIPT.md) | [English](SCRIPT_EN.md)

## 📋 Overview

This document provides detailed instructions for developing custom scripts within the AMMF framework. It covers the available functions, variables, and best practices for creating installation scripts, service scripts, and user scripts.

## 🛠️ Script Types

AMMF supports two main types of scripts (you can add more as needed):

1. **Installation Scripts** (`files/scripts/install_custom_script.sh`)
   - Executed during module installation
   - Used for setup tasks, file extraction, and initial configuration

2. **Service Scripts** (`files/scripts/service_script.sh`)
   - Executed when the device boots
   - Used for background services, monitoring, and runtime operations

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
- Monitors the specified file for changes
- Executes the specified script when changes are detected

**Compatibility:**
- Primarily used in service scripts

**Example:**
```bash
# Monitor configuration file for changes
enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
```

### Utility Functions

#### `Aurora_ui_print [message]`

Prints a formatted message to the console.

**Parameters:**
- `message`: The message to print

**Example:**
```bash
Aurora_ui_print "Starting installation..."
```

#### `Aurora_abort [message] [error_code]`

Aborts the script with an error message and code.

**Parameters:**
- `message`: Error message
- `error_code`: Error code

**Example:**
```bash
Aurora_abort "Installation failed" 1
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
- `$TMP_FOLDER`: Temporary folder path (`$MODPATH/TEMP`)
- `$SDCARD`: Path to the internal storage (`/storage/emulated/0`)
- `$download_destination`: Path for downloaded files (defined in `settings.sh`)

### Module Information

- `$action_id`: Module ID
- `$action_name`: Module name
- `$action_author`: Module author
- `$action_description`: Module description

### System Information

- `$MAGISK_VER_CODE`: Magisk version code
- `$KSU_VER_CODE`: KernelSU version code
- `$KSU_KERNEL_VER_CODE`: KernelSU kernel version code
- `$APATCH`: APatch flag

### Status Variables

- `$STATUS_FILE`: Path to the status file
- `$SH_ON_MAGISK`: Flag indicating if the script is running on Magisk

## 📝 Script Templates

### Installation Script Template

```bash
#!/system/bin/sh

# Custom installation script
# Executed during module installation

# Example: Create necessary directories
mkdir -p "$MODPATH/data"

# Example: Download additional files
download_file "https://example.com/extra_file.zip"

# Example: User interaction
echo "Do you want to enable advanced features?"
echo "Press Volume Up for Yes, Volume Down for No"
key_select

if [ "$key_pressed" = "KEY_VOLUMEUP" ]; then
    # Enable advanced features
    echo "advanced_features=true" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "Advanced features enabled"
else
    # Disable advanced features
    echo "advanced_features=false" >> "$MODPATH/module_settings/settings.json"
    Aurora_ui_print "Advanced features disabled"
fi
```

### Service Script Template

```bash
#!/system/bin/sh

# Service script
# Executed when the device boots

# Start a background service
start_background_service() {
    # Service implementation
    nohup some_command > /dev/null 2>&1 &
    Aurora_ui_print "Background service started"
}

# Monitor configuration file for changes
monitor_config() {
    enter_pause_mode "$MODPATH/module_settings/config.sh" "$MODPATH/scripts/reload_config.sh"
}

# Execute functions
start_background_service
monitor_config
```



## 🔧 Best Practices

1. **Error Handling**
   - Always check for errors and provide meaningful error messages
   - Use `Aurora_abort` for critical errors

2. **File Paths**
   - Use absolute paths with variables like `$MODPATH`
   - Create temporary files in `$TMP_FOLDER`

3. **User Interaction**
   - Provide clear instructions when asking for user input
   - Use appropriate functions based on the script type

4. **Logging**
   - Use `Aurora_ui_print` for important messages
   - Log significant events and errors

5. **Cleanup**
   - Remove temporary files when they're no longer needed
   - Handle service termination properly

6. **Compatibility**
   - Check for required tools and dependencies
   - Use conditional logic based on Android version or root solution

## 📋 Debugging Tips

1. **Log Output**
   - Add debug messages using `echo "DEBUG: $variable_name=$variable_value" >> "$MODPATH/debug.log"`

2. **Check Status**
   - Monitor the status file: `cat "$STATUS_FILE"`

3. **Test Functions**
   - Test individual functions with sample inputs

4. **Check Permissions**
   - Ensure scripts have proper execution permissions: `chmod +x script.sh`

5. **Validate Paths**
   - Verify file paths exist before accessing them

## 🔄 Version Compatibility

When upgrading the AMMF framework, pay attention to changes in the following files:

1. `files/scripts/default_scripts/main.sh` - Core functions may change
2. `files/languages.sh` - Language strings may be updated

It's recommended to back up your custom scripts before upgrading and then merge any changes carefully.
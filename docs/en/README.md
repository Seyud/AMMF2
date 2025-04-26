
# Dimensity-1000+ GPU Governor

[![Magisk](https://img.shields.io/badge/Magisk-20.4%2B-brightgreen)](https://github.com/topjohnwu/Magisk)
![Platform](https://img.shields.io/badge/Platform-Android%2010.0%2B-blue)
![SOC](https://img.shields.io/badge/SOC-MediaTek_Dimensity_1000%2B-red)
![Version](https://img.shields.io/badge/Version-1.4.7-orange)

A GPU dynamic frequency governor for MediaTek Dimensity 1000+, optimizing power and performance balance in high-load scenarios

## 📌 Features
- 🚀 Dynamic GPU frequency adjustment algorithm
- 🔋 Smart power management (15-30% power saving in high-frequency scenarios)
- 🎮 Game-specific optimizations
- 📊 Customizable frequency/voltage table
- ⚡ Automatic memory frequency adjustment (DDR_OPP)
- 📈 Real-time performance margin control (percentage/MHz dual mode)
- 📝 Comprehensive log management system (automatic rotation, compression, and level control)
- 🛠️ Command-line log management tools
- 🖥️ Interactive control panel
- 🔄 One-click GPU scheduler toggle function

## ⚠️ Important Warning
**Please be aware before using:**
- ❗ May cause system crashes/screen flickering/stuttering (due to improper configuration)
- ❗ Modifying voltage/frequency requires hardware knowledge
- ❗ Memory downclocking significantly affects GPU performance
- ❗ First-time users should maintain default configuration

## 📥 Installation Instructions
1. Flash the module through root manager
2. Restart the device
3. Wait 60 seconds for service auto-start
4. View logs: `sh /data/adb/modules/dimensity_hybrid_governor/log_manager.sh view`

## ⚙️ Configuration Guide
Configuration file path: `/data/gpu_freq_table.conf`

### Configuration Example
Freq Volt DDR_OPP
218000 43750 999
280000 46875 999
...
847000 60625 0

### Tuning Recommendations
1. Screen flickering issues: Lower the frequency at the current voltage level
2. Regular system crashes: Set DDR_OPP=999
3. Insufficient performance: Increase margin value (adjust gradually by 5-10%)
4. Power optimization: Reduce high-frequency band voltage (decrease by 625uv each time)

## 🛠️ Technical Principles
A[System Startup] --> B[Load Frequency Table]
B --> C[Monitor GPU Load]
C --> D{Load Assessment}
D -->|High Load| E[Increase Frequency Level]
D -->|Low Load| F[Decrease Frequency Level]
E --> G[Synchronize DDR Frequency Adjustment]
F --> G
G --> H[Apply New Voltage]

## 🖥️ Control Panel
An interactive control panel has been added, providing a more user-friendly interface:

### Launch Control Panel
```
sh /data/adb/modules/dimensity_hybrid_governor/action.sh
```

### Control Panel Features
- Display current GPU scheduler status (running/stopped)
- One-click GPU scheduler toggle
- Quick view of recent logs
- Integrated log management functions

### Command Line Options
In addition to the interactive interface, you can also operate directly through the command line:
```
sh /data/adb/modules/dimensity_hybrid_governor/action.sh [option]
```

Available options:
- `switch` - Toggle GPU scheduler status
- `status` - Display GPU scheduler status
- `log [option]` - Log management (same options as log_manager.sh)
- `help` - Display help information

## 📝 Log Management System
Comprehensive log management system providing the following functions:

### Log File Location
Main log file location: `/data/adb/modules/dimensity_hybrid_governor/gpu_governor.log`

Historical log files:
- `/data/adb/modules/dimensity_hybrid_governor/gpu_governor.log.old` - Most recently rotated log
- `/data/adb/modules/dimensity_hybrid_governor/gpu_governor.log.1` - Earlier log
- `/data/adb/modules/dimensity_hybrid_governor/gpu_governor.log.2` - Even earlier log
- `/data/adb/modules/dimensity_hybrid_governor/gpu_governor.log.3` - Earliest log

Compressed log files are saved with the `.gz` suffix, such as `gpu_governor.log.old.gz`

### Log Management Tool Usage
```
sh /data/adb/modules/dimensity_hybrid_governor/log_manager.sh [option]
```
Or through the control panel:
```
sh /data/adb/modules/dimensity_hybrid_governor/action.sh log [option]
```

### Available Options
- `view` - View current log
- `tail [n]` - Real-time view of log updates (displays last 10 lines by default)
- `clear` - Clear logs
- `rotate` - Manually rotate logs
- `compress` - Compress old logs
- `level [debug|info|warn|error]` - Set log level
- `status` - Display GPU scheduler status
- `sysinfo` - Record system information to log
- `help` - Display help information

### Log Levels
- `debug` - Debug level, records all information
- `info` - Information level, records general information (default)
- `warn` - Warning level, only records warnings and errors
- `error` - Error level, only records errors

## 📚 FAQ
**Q: What if the module doesn't work?**
A: Use the control panel to check status: `sh /data/adb/modules/dimensity_hybrid_governor/action.sh`, or view logs: `sh /data/adb/modules/dimensity_hybrid_governor/action.sh log view`

**Q: How to temporarily disable the scheduler?**
A: Use the control panel or directly execute: `sh /data/adb/modules/dimensity_hybrid_governor/action.sh switch`

**Q: How to restore default configuration?**
A: Delete `/data/gpu_freq_table.conf` and restart

**Q: Does it support other SOCs?**
A: Limited to Dimensity 1000+ (mt6885/mt6889) only

**Q: Why do games stutter instead?**
A: Try increasing the margin value or check DDR_OPP settings

**Q: What if the log file is too large?**
A: Use the log management tool to rotate or compress logs: `sh /data/adb/modules/dimensity_hybrid_governor/action.sh log rotate`

**Q: What if the control panel won't start?**
A: Check file permissions: `chmod 755 /data/adb/modules/dimensity_hybrid_governor/action.sh`

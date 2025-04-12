#!/bin/bash
echo "Home: $HOME"
echo "Current directory: $(pwd)"
OLDPWD=$(pwd)
echo "OS Type: $OSTYPE"
echo "Current shell: $SHELL"

# Check and fix 7z alias
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    if [ -f ~/.bashrc ] && grep -q "alias 7z=" ~/.bashrc; then
        # Check if existing alias points to valid path
        if ! 7z &>/dev/null; then
            echo "Detected invalid 7z alias, fixing..."
            # Remove incorrect alias
            sed -i '/alias 7z=/d' ~/.bashrc

            echo "Please rerun the script"
            exit 1
        fi
    fi
fi

# Add tool check function at script beginning
check_tools() {
    local missing=()
    local tools=(unzip git 7z cp find sed)
    local required_commands=() # Add required commands check

    # Add special handling for Windows environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows must check PowerShell download capability
        if ! powershell.exe -Command "Get-Command Invoke-WebRequest" &>/dev/null; then
            required_commands+=("PowerShell download capability")
        fi
    else
        tools+=(wget) # Non-Windows environments still need wget
    fi

    for tool in "${tools[@]}"; do
        if ! command -v $tool &>/dev/null; then
            missing+=("$tool")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo "Missing required tools: ${missing[*]}"

        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            echo "Detected Windows environment, attempting auto-fix..."
            echo "Detected Windows environment, automatically enabling PowerShell download solution..."
            USE_POWERSHELL_DOWNLOAD=1
            # Check if running in Git Bash
            if [ -f "/git-bash.exe" ]; then
                # Attempt PowerShell installation (requires admin rights)
                if ! powershell.exe -Command "Get-Command ${missing[*]}" &>/dev/null; then
                    echo "Attempting to install missing tools via PowerShell..."
                    for t in "${missing[@]}"; do
                        case $t in
                        wget)
                            echo "Using PowerShell to download files..."
                            if ! powershell.exe -Command "Invoke-WebRequest -UseBasicParsing" &>/dev/null; then
                                echo "Please manually install Git for Windows (includes Unix tools)"
                                sleep 12
                                exit 1
                            fi
                            ;;
                        unzip | git | cp | find | sed)
                            # First try using winget to install
                            if command -v winget &>/dev/null; then
                                echo "Attempting to install $t using winget..."
                                case $t in
                                unzip)
                                    winget install -e --id GnuWin32.UnZip && continue || echo "winget unzip installation failed"
                                    ;;
                                git)
                                    winget install -e --id Git.Git && continue || echo "winget git installation failed"
                                    ;;
                                cp | find | sed)
                                    winget install -e --id GnuWin32.CoreUtils && continue || echo "winget coreutils installation failed"
                                    ;;
                                esac
                            fi
                            
                            # Ensure temp directory exists
                            TEMP_DIR=$(mktemp -d)
                            # Convert path to Windows format
                            TEMP_DIR_WIN=$(cygpath -w "$TEMP_DIR" | sed 's/\\/\\\\/g')
                            
                            # If winget unavailable or installation failed, try PowerShell installation
                            echo "Attempting to install $t via PowerShell..."
                            case $t in
                            unzip)
                                powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://downloads.sourceforge.net/gnuwin32/unzip-5.51-1-bin.zip' -OutFile '${TEMP_DIR_WIN}\\\\unzip.zip'; Expand-Archive -Path '${TEMP_DIR_WIN}\\\\unzip.zip' -DestinationPath '${TEMP_DIR_WIN}\\\\unzip'; \$env:PATH += ';${TEMP_DIR_WIN}\\\\unzip\\\\bin'" && continue
                                ;;
                            git)
                                powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile '${TEMP_DIR_WIN}\\\\git.exe'; Start-Process -Wait -FilePath '${TEMP_DIR_WIN}\\\\git.exe' -ArgumentList '/VERYSILENT', '/NORESTART', '/NOCANCEL', '/SP-', '/CLOSEAPPLICATIONS', '/RESTARTAPPLICATIONS'" && continue
                                ;;
                            cp | find | sed)
                                powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://downloads.sourceforge.net/gnuwin32/coreutils-5.3.0-bin.zip' -OutFile '${TEMP_DIR_WIN}\\\\coreutils.zip'; Expand-Archive -Path '${TEMP_DIR_WIN}\\\\coreutils.zip' -DestinationPath '${TEMP_DIR_WIN}\\\\coreutils'; \$env:PATH += ';${TEMP_DIR_WIN}\\\\coreutils\\\\bin'" && continue
                                ;;
                            esac
                            
                            echo "Unable to automatically install $t, please manually install Git for Windows and ensure it includes $t component"
                            sleep 12
                            exit 1
                            ;;
                        7z)
                            echo "Attempting to install 7-Zip..."
                            # Create temp directory and ensure correct path
                            TEMP_DIR=$(mktemp -d)

                            # Handle path based on system type
                            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
                                # Windows path handling
                                TEMP_INSTALLER=$(cygpath -w "$TEMP_DIR/7zsetup.exe")
                                DOWNLOAD_URL="https://www.7-zip.org/a/7z2301-x64.exe"

                                # Download installer
                                if ! powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '$DOWNLOAD_URL' -OutFile '$TEMP_INSTALLER' -UseBasicParsing"; then
                                    echo "Failed to download 7-Zip installer, please download manually: https://www.7-zip.org/"
                                    rm -rf "$TEMP_DIR"
                                    sleep 12
                                    exit 1
                                fi

                                # Install 7-Zip and check if successful
                                echo "Installing 7-Zip..."
                                if ! powershell.exe -Command "Start-Process -Wait -FilePath '$TEMP_INSTALLER' -ArgumentList '/S'"; then
                                    echo "7-Zip installation failed"
                                    rm -rf "$TEMP_DIR"
                                    sleep 12
                                    exit 1
                                fi

                                # Set 7z environment variables and alias
                                echo "Setting 7z environment variables..."
                                SEVEN_ZIP_PATH="/c/Program Files/7-Zip"
                                export PATH="$SEVEN_ZIP_PATH:$PATH"

                                if ! command -v 7z &>/dev/null; then
                                    alias 7z="\"$SEVEN_ZIP_PATH/7z.exe\""
                                    echo "alias 7z='\"$SEVEN_ZIP_PATH/7z.exe\"'" >>~/.bashrc
                                    echo "Please rerun the script"
                                    exit 1
                                fi

                                # Verify 7z is available
                                if ! 7z &>/dev/null; then
                                    echo "7z setup failed, please configure manually"
                                    sleep 12
                                    rm -rf "$TEMP_DIR"
                                    exit 1
                                fi

                                echo "7-Zip installed and configured successfully"
                                rm -rf "$TEMP_DIR"
                            fi
                            ;;
                        esac
                    done
                fi
            else
                echo "Please install Git for Windows and rerun the script"
                sleep 12
                exit 1
            fi
        else
            # Linux/Mac handling
            echo "Attempting auto-install..."
            if command -v apt-get &>/dev/null; then
                sudo apt-get install -y "${missing[@]}" || {
                    echo "Auto-install failed, please install manually: ${missing[*]}"
                    exit 1
                }
            elif command -v brew &>/dev/null; then
                brew install "${missing[@]}" || {
                    echo "Auto-install failed, please install manually: ${missing[*]}"
                    exit 1
                }
            elif command -v yum &>/dev/null; then
                sudo yum install -y "${missing[@]}" || {
                    echo "Auto-install failed, please install manually: ${missing[*]}"
                    exit 1
                }
            else
                echo "Please manually install the following tools: ${missing[*]}"
                sleep 12
                exit 1
            fi
        fi
    fi
}
# Call tool check before existing NDK check
check_tools # Added tool check
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    if [ -z "$USE_POWERSHELL_DOWNLOAD" ]; then
        echo "Detected Windows environment, attempting auto-fix..."
        echo "Detected Windows environment, automatically enabling PowerShell download solution..."
        USE_POWERSHELL_DOWNLOAD=1
    fi
fi
# Original NDK check remains unchanged
check_ndk() {
    if [ -z "$ANDROID_NDK_HOME" ]; then
        return 1
    fi
    if [ ! -d "$ANDROID_NDK_HOME" ]; then
        return 1
    fi
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        TEST_TOOL="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/windows-x86_64/bin/aarch64-linux-android21-clang++"
    else
        TEST_TOOL="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang++"
    fi

    if [ ! -f "$TEST_TOOL" ]; then
        return 1
    fi

    return 0
}

if ! check_ndk; then
    echo "Android NDK not found or not usable. Please set ANDROID_NDK_HOME environment variable."
    echo "Android NDK not found. Install temporarily? [Y/n]"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]] || [[ -z "$answer" ]]; then
        echo "Downloading NDK to temp directory..."
        TEMP_NDK_DIR=$(mktemp -d)

        # Modified NDK download section
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            echo "Windows system detected, downloading Windows NDK..."
            NDK_URL="https://dl.google.com/android/repository/android-ndk-r27c-windows.zip"

            if [ -n "$USE_POWERSHELL_DOWNLOAD" ]; then
                # Ensure temp directory exists
                mkdir -p "$TEMP_NDK_DIR"
                # Use PowerShell for download
                echo "Using PowerShell alternative download..."
                TEMP_NDK_WINPATH=$(cygpath -w "$TEMP_NDK_DIR" | sed 's/\\/\\\\/g')
                powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${NDK_URL}' -OutFile (\"${TEMP_NDK_WINPATH}\" + '\\\\ndk.zip') -UseBasicParsing"
            else
                wget -q "$NDK_URL" -O "$TEMP_NDK_DIR/ndk.zip"
            fi
            echo "Unzipping NDK..."
            if command -v bsdtar &>/dev/null; then
                bsdtar -xf "$TEMP_NDK_DIR/ndk.zip" -C "$TEMP_NDK_DIR"
            elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
                7z x "$TEMP_NDK_DIR/ndk.zip" -o"$TEMP_NDK_DIR" -y -bsp0 >/dev/null
            else
                unzip -q -o "$TEMP_NDK_DIR/ndk.zip" -d "$TEMP_NDK_DIR"
            fi

            # Added permanent installation option
            echo "Permanently install NDK and set environment variables? [Y/n]"
            read -r permanent_install
            if [[ "$permanent_install" =~ ^[Yy]$ ]] || [[ -z "$permanent_install" ]]; then
                # Set permanent installation path
                NDK_INSTALL_DIR="$HOME/android-ndk-r27c"
                mv "$TEMP_NDK_DIR/android-ndk-r27c" "$NDK_INSTALL_DIR"
                rm -rf "$TEMP_NDK_DIR"

                # Set environment variables
                echo "Setting environment variables..."
                export ANDROID_NDK_HOME="$NDK_INSTALL_DIR"
                echo "export ANDROID_NDK_HOME=\"$NDK_INSTALL_DIR\"" >>~/.bashrc
                echo "export PATH=\"\$ANDROID_NDK_HOME:\$PATH\"" >>~/.bashrc

                echo "NDK permanently installed at: $NDK_INSTALL_DIR"
                echo "Environment variables added to ~/.bashrc"
            else
                # Temporary installation handling
                export ANDROID_NDK_HOME="$TEMP_NDK_DIR/android-ndk-r27c"
                echo "Temporarily using NDK at $ANDROID_NDK_HOME"
            fi

            # Verify downloaded NDK is usable
            if ! check_ndk; then
                echo "Downloaded NDK is not usable. Please install manually."
                [ -n "$TEMP_NDK_DIR" ] && rm -rf "$TEMP_NDK_DIR"
                sleep 12
                exit 1
            fi
        else
            echo "Build terminated: Android NDK required"
            sleep 12
            exit 1
        fi
    fi
fi
TEMP_BUILD_DIR=$(mktemp -d)
echo "Using temporary build directory: $TEMP_BUILD_DIR"
cp -r . "$TEMP_BUILD_DIR" || {
    echo "Failed to copy files to temp directory"
    exit 1
}
cd "$TEMP_BUILD_DIR" || {
    echo "Failed to enter temp directory"
    exit 1
}
CURRENT_TIME="$(date +'%Y%m%d')"
LATEST_TAG="$(git describe --tags $(git rev-list --tags --max-count=1))"
if [[ "$LATEST_TAG" == "v"* ]]; then
    echo "latest tag is ${LATEST_TAG}"
else
    echo "please input version:"
    read -r LATEST_TAG
fi
. ./module_settings/config.sh
echo "id=${action_id}" >module.prop
echo "name=${action_name}" >>module.prop
echo "version=${LATEST_TAG}" >>module.prop
echo "versionCode=${CURRENT_TIME}" >>module.prop
echo "author=${action_author}" >>module.prop
echo "description=${action_description}" >>module.prop
find files -name "*.sh" -exec sed -i "s/AMMF/${action_id}/g" {} \;
find webroot -name "*.js" -exec sed -i "s/AMMF/${action_id}/g" {} \;
find src -name "*.cpp" -exec sed -i "s/AMMF2/${action_id}/g" {} \;
sed -i "s/AMMF/${action_id}/g" webroot/index.html
echo "Built module.prop successfully"
# Create binaries directory
mkdir -p bin
# Modified compile and strip commands section
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows environment uses windows-x86_64 path
    PREBUILT_PATH="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/windows-x86_64/bin"
else
    # Linux/Mac environment uses linux-x86_64 path
    PREBUILT_PATH="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin"
fi
echo "Using PREBUILT_PATH: $PREBUILT_PATH"
# Unified compile commands using PREBUILT_PATH
$PREBUILT_PATH/aarch64-linux-android21-clang++ \
    -O2 -Wall -Wextra -static-libstdc++ -o bin/filewatch-aarch64 src/filewatch.cpp
echo "Compiled aarch64 binary"
$PREBUILT_PATH/x86_64-linux-android21-clang++ \
    -O2 -Wall -Wextra -static-libstdc++ -o bin/filewatch-x86_64 src/filewatch.cpp
echo "Compiled x86_64 binary"
$PREBUILT_PATH/aarch64-linux-android21-clang++ \
    -O2 -Wall -Wextra -std=c++11 -static-libstdc++ -o bin/logmonitor-aarch64 src/logmonitor.cpp
echo "Compiled logmonitor aarch64 binary"
$PREBUILT_PATH/x86_64-linux-android21-clang++ \
    -O2 -Wall -Wextra -std=c++11 -static-libstdc++ -o bin/logmonitor-x86_64 src/logmonitor.cpp
echo "Compiled logmonitor x86_64 binary"
# Strip commands also use PREBUILT_PATH
$PREBUILT_PATH/llvm-strip bin/filewatch-aarch64 || echo "Failed to strip aarch64 binary"
$PREBUILT_PATH/llvm-strip bin/filewatch-x86_64 || echo "Failed to strip x86_64 binary"
$PREBUILT_PATH/llvm-strip bin/logmonitor-aarch64 || echo "Failed to strip logmonitor aarch64 binary"
$PREBUILT_PATH/llvm-strip bin/logmonitor-x86_64 || echo "Failed to strip logmonitor x86_64 binary"
echo "Stripped binaries"
if [ -n "$TEMP_NDK_DIR" ]; then
    echo "Cleaning up temporary NDK installation..."
    rm -rf "$TEMP_NDK_DIR"
fi
echo "Build completed"
rm -rf src
# Modified compression commands, different for Windows and Linux
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows uses full path to 7z.exe
    if command -v 7z &>/dev/null; then
        echo "Using Windows 7z..."
        "$(command -v 7z)" a -r -mx9 "${action_name}_${LATEST_TAG}.zip" * -x!*.git* || {
            echo "7z failed, trying PowerShell fallback..."
            powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Compress-Archive -Path (Get-ChildItem -Exclude '*.git*') -DestinationPath '${action_name}_${LATEST_TAG}.zip' -CompressionLevel Optimal"
        }
    else
        echo "7z not found, using PowerShell fallback..."
        powershell.exe -Command "\$ProgressPreference='SilentlyContinue'; Compress-Archive -Path (Get-ChildItem -Exclude '*.git*') -DestinationPath '${action_name}_${LATEST_TAG}.zip' -CompressionLevel Optimal"
    fi
else
    # Linux/Mac uses standard 7z command
    echo "Using Linux 7z..."
    7z a -r -mx9 "${action_name}_${LATEST_TAG}.zip" * -x!*.git* || {
        echo "7z failed, trying zip fallback..."
        zip -r -9 "${action_name}_${LATEST_TAG}.zip" . -x "*.git*"
    }
fi
# Get original working directory path
ORIGINAL_DIR="$OLDPWD"
echo "Original directory: $ORIGINAL_DIR"
# Move packaged file to original directory

    # Add zip file existence check
    if [ ! -f "${action_name}_${LATEST_TAG}.zip" ]; then
        echo "Error: Zip file ${action_name}_${LATEST_TAG}.zip does not exist"
        exit 1
    fi
    
    cp "${action_name}_${LATEST_TAG}.zip" "$ORIGINAL_DIR/"

# Clean up temporary directory
echo "Cleaning up temporary build directory..."
rm -rf "$TEMP_BUILD_DIR"
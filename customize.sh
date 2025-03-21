#!/system/bin/sh
# shellcheck disable=SC2034
# shellcheck disable=SC2154
# shellcheck disable=SC3043
# shellcheck disable=SC2155
# shellcheck disable=SC2046
# shellcheck disable=SC3045
main() {
    if [ ! -f "$MODPATH/files/scripts/default_scripts/main.sh" ]; then
        abort "Notfound File!!!($MODPATH/files/scripts/default_scripts/main.sh)"
    else
        . "$MODPATH/files/scripts/default_scripts/main.sh"
    fi
    start_script
    replace_module_id "$MODPATH/files/languages.sh" "languages.sh"
    replace_module_id "$MODPATH/webroot/language.js" "WEBUI/language.js"
    replace_module_id "$MODPATH/webroot/index.html" "WEBUI/index.html"
    replace_module_id "$MODPATH/webroot/navigation.js" "WEBUI/navigation.js"
    replace_module_id "$MODPATH/webroot/logs.js" "WEBUI/logs.js"
    replace_module_id "$MODPATH/webroot/status.js" "WEBUI/status.js"
    replace_module_id "$MODPATH/webroot/settings.js" "WEBUI/settings.js"
    version_check
    if [ "$ARCH" = "arm64" ]; then
    rm -f "$MODPATH/bin/filewatch-x86_64"
    mv "$MODPATH/bin/filewatch-aarch64" "$MODPATH/bin/filewatch"
    fi
    if [ "$ARCH" = "x64" ]; then
    rm -f "$MODPATH/bin/filewatch-aarch64"
    mv "$MODPATH/bin/filewatch-x86_64" "$MODPATH/bin/filewatch"
    fi
        
    if [ ! -f "$MODPATH/files/scripts/install_custom_script.sh" ]; then
        abort "Notfound File!!!($MODPATH/files/scripts/install_custom_script.sh)"
    else
        . "$MODPATH/files/scripts/install_custom_script.sh"
    fi
}
#######################################################
version_check() {
    if [ -n "$KSU_VER_CODE" ] && [ "$KSU_VER_CODE" -lt "$ksu_min_version" ] || [ "$KSU_KERNEL_VER_CODE" -lt "$ksu_min_kernel_version" ]; then
        Aurora_abort "KernelSU: $ERROR_UNSUPPORTED_VERSION $KSU_VER_CODE ($ERROR_VERSION_NUMBER >= $ksu_min_version or kernelVersionCode >= $ksu_min_kernel_version)" 1
    elif [ -z "$APATCH" ] && [ -z "$KSU" ] && [ -n "$MAGISK_VER_CODE" ] && [ "$MAGISK_VER_CODE" -le "$magisk_min_version" ]; then
        Aurora_abort "Magisk: $ERROR_UNSUPPORTED_VERSION $MAGISK_VER_CODE ($ERROR_VERSION_NUMBER > $magisk_min_version)" 1
    elif [ -n "$APATCH_VER_CODE" ] && [ "$APATCH_VER_CODE" -lt "$apatch_min_version" ]; then
        Aurora_abort "APatch: $ERROR_UNSUPPORTED_VERSION $APATCH_VER_CODE ($ERROR_VERSION_NUMBER >= $apatch_min_version)" 1
    elif [ "$API" -lt "$ANDROID_API" ]; then
        Aurora_abort "Android API: $ERROR_UNSUPPORTED_VERSION $API ($ERROR_VERSION_NUMBER >= $ANDROID_API)" 2
    fi
}
replace_module_id() {
    if [ -f "$1" ] && [ -n "$MODID" ]; then
        Aurora_ui_print "Setting $2 ..."
        sed -i "s/AMMF/$MODID/g" "$1"
    fi
}
###############
##########################################################
if [ -n "$MODID" ]; then
    main
fi
Aurora_ui_print "$END"

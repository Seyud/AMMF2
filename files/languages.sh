# AMMF多语言配置文件
# 格式: lang_[语言代码]() { ... }
# 支持的语言代码: en(英语), zh(中文), jp(日语), ru(俄语), fr(法语)
# 添加新语言时，只需按照相同格式添加新的语言函数

# 英语
lang_en() {
    # 系统消息
    ERROR_TEXT="Error"
    ERROR_CODE_TEXT="Error code"
    ERROR_UNSUPPORTED_VERSION="Unsupported version"
    ERROR_VERSION_NUMBER="Version number"
    ERROR_UPGRADE_ROOT_SCHEME="Please upgrade the root scheme or change the root scheme"
    ERROR_INVALID_LOCAL_VALUE="The value is invalid, must be true or false."
    KEY_VOLUME="Volume key"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScript is disabled. Custom scripts will not be executed."
    CUSTOM_SCRIPT_ENABLED="CustomScript is enabled. Executing custom scripts."
    
    # 网络相关
    INTERNET_CONNET="Network available"
    DOWNLOAD_SUCCEEDED="File downloaded"
    DOWNLOAD_FAILED="Download failed"
    RETRY_DOWNLOAD="Retry"
    SKIP_DOWNLOAD="Skip"
    CHECK_NETWORK="No network connection Please check the network connection"
    PRESS_VOLUME_RETRY="Continue retry"
    PRESS_VOLUME_SKIP="Skip"
    DOWNLOADING="Downloading"
    FAILED_TO_GET_FILE_SIZE="Failed to get file size"
    
    # 命令相关
    COMMAND_FAILED="Command failed"
    NOTFOUND_URL="No matching download URL found"
    OUTPUT="Output"
    END="Installation end"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== Group selection ========"
    MENU_TITLE_CHAR="======== Character selection ========"
    MENU_CURRENT_CANDIDATES="Current candidate characters:"
    MENU_CURRENT_GROUP="Current group:"
    MENU_INSTRUCTIONS="VOL+ select | VOL- switch"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="Please enter a number"
    ERROR_INVALID_INPUT="Invalid input!"
    ERROR_OUT_OF_RANGE="Out of range!"
    RESULT_TITLE="Selection result:"

    # Service脚本相关
    SERVICE_STARTED="Service started"
    SERVICE_PAUSED="Entered pause mode, monitoring file"
    SERVICE_NORMAL_EXIT="Service exited normally"
    SERVICE_STATUS_UPDATE="Status updated"
    SERVICE_LOADING_MAIN="Loading main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Loading service_script.sh"
    SERVICE_FILE_NOT_FOUND="File not found"
    SERVICE_LOG_ROTATED="Log rotated"
    
    # WebUI核心翻译
    WEBUI_TITLE="AMMF Settings"
    WEBUI_LANGUAGE_NAME="English"
    
    # WebUI导航
    WEBUI_NAV_STATUS="Status"
    WEBUI_NAV_LOGS="Logs"
    WEBUI_NAV_SETTINGS="Settings"
    WEBUI_NAV_ABOUT="About"
    
    # WebUI状态页
    WEBUI_STATUS_TITLE="Module Status"
    WEBUI_STATUS_LABEL="Current status:"
    WEBUI_UPTIME_LABEL="Uptime:"
    WEBUI_RUNNING="Running"
    WEBUI_STOPPED="Stopped"
    WEBUI_UNKNOWN="Unknown"
    WEBUI_REFRESH_STATUS="Refresh Status"
    WEBUI_STATUS_REFRESHED="Status refreshed"
    WEBUI_STATUS_REFRESH_ERROR="Error refreshing status"
    WEBUI_RUN_ACTION="Run Action"
    WEBUI_DEVICE_INFO="Device Info"
    
    
    # WebUI日志页
    WEBUI_LOGS_TITLE="Logs"
    WEBUI_NO_LOGS="No logs available"
    
    # WebUI设置页
    WEBUI_SETTINGS_TITLE="Module Settings"
    WEBUI_CONFIG_FILE="Config file:"
    WEBUI_SAVE="Save"
    WEBUI_SAVE_SUCCESS="Settings saved successfully!"
    
    # WebUI关于页
    WEBUI_ABOUT_TITLE="About"
    WEBUI_ABOUT_INFO="AMMF Module - A Magisk/KernelSU Module Framework"
    WEBUI_MODULE_INFO="Module Info"
    WEBUI_MODULE_ID="Module ID"
    WEBUI_MODULE_VERSION="Module Version"
    WEBUI_MAGISK_MIN_VERSION="Magisk Min Version"
    WEBUI_KSU_MIN_VERSION="KernelSU Min Version"
    WEBUI_APATCH_MIN_VERSION="APatch Min Version"
    WEBUI_ANDROID_API="Android API"
    WEBUI_ABOUT_WEBUI="About WebUI"
    WEBUI_VERSION="Version"
    WEBUI_DEVELOPER_INFO="Developer Info"
    WEBUI_DEVELOPER="Developer"
    WEBUI_NO_INFO="No information available"
    
    # WebUI通用元素
    WEBUI_LOADING="Loading..."
    WEBUI_REFRESH="Refresh"
    WEBUI_CANCEL="Cancel"
    WEBUI_CONFIRM="Confirm"
    WEBUI_SUCCESS="Success"
    WEBUI_ERROR="Error"
    WEBUI_WARNING="Warning"
    WEBUI_SELECT_LANGUAGE="Select Language"
    WEBUI_LANGUAGE_CHANGED="Language changed to English"
    
    # WebUI Action相关
    WEBUI_RUN_ACTION="Run Action"
    WEBUI_RUNNING_ACTION="Running Action..."
    WEBUI_ACTION_COMPLETE="Action completed"
    WEBUI_ACTION_ERROR="Action execution failed"
}

# 中文
lang_zh() {
    # 系统消息
    ERROR_TEXT="错误"
    ERROR_CODE_TEXT="错误代码"
    ERROR_UNSUPPORTED_VERSION="不支持的版本"
    ERROR_VERSION_NUMBER="版本号"
    ERROR_UPGRADE_ROOT_SCHEME="请升级root方案或更换root方案"
    ERROR_INVALID_LOCAL_VALUE="的值无效，必须为true或false。"
    KEY_VOLUME="音量键"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="已禁用CustomScript。将不执行自定义脚本。"
    CUSTOM_SCRIPT_ENABLED="已启用CustomScript。正在执行自定义脚本。"
    
    # 网络相关
    INTERNET_CONNET="网络可用"
    DOWNLOAD_SUCCEEDED="已下载文件"
    DOWNLOAD_FAILED="下载失败"
    RETRY_DOWNLOAD="重试"
    SKIP_DOWNLOAD="跳过"
    CHECK_NETWORK="没有网络连接 请检查网络连接"
    PRESS_VOLUME_RETRY="继续重试"
    PRESS_VOLUME_SKIP="跳过"
    DOWNLOADING="下载中"
    FAILED_TO_GET_FILE_SIZE="无法获取文件大小"
    
    # 命令相关
    COMMAND_FAILED="命令失败"
    NOTFOUND_URL="找不到匹配的下载URL"
    OUTPUT="输出"
    END="安装结束"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== 组选择 ========"
    MENU_TITLE_CHAR="======== 字符选择 ========"
    MENU_CURRENT_CANDIDATES="当前候选字符："
    MENU_CURRENT_GROUP="当前组："
    MENU_INSTRUCTIONS="音量+选择 | 音量-切换"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="请输入一个数字"
    ERROR_INVALID_INPUT="输入无效！"
    ERROR_OUT_OF_RANGE="超出范围！"
    RESULT_TITLE="选择结果："
    
    # Service脚本相关
    SERVICE_STARTED="服务启动"
    SERVICE_PAUSED="进入暂停模式，监控文件"
    SERVICE_NORMAL_EXIT="服务正常退出"
    SERVICE_STATUS_UPDATE="状态更新"
    SERVICE_LOADING_MAIN="加载 main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="加载 service_script.sh"
    SERVICE_FILE_NOT_FOUND="未找到文件"
    SERVICE_LOG_ROTATED="日志已轮换"
    
    # WebUI核心翻译
    WEBUI_TITLE="AMMF设置"
    WEBUI_LANGUAGE_NAME="简体中文"
    
    # WebUI导航
    WEBUI_NAV_STATUS="状态"
    WEBUI_NAV_LOGS="日志"
    WEBUI_NAV_SETTINGS="设置"
    WEBUI_NAV_ABOUT="关于"
    
    # WebUI状态页
    WEBUI_STATUS_TITLE="模块状态"
    WEBUI_STATUS_LABEL="当前状态:"
    WEBUI_UPTIME_LABEL="运行时间:"
    WEBUI_RUNNING="运行中"
    WEBUI_STOPPED="已停止"
    WEBUI_UNKNOWN="未知"
    WEBUI_REFRESH_STATUS="刷新状态"
    WEBUI_STATUS_REFRESHED="状态已刷新"
    WEBUI_STATUS_REFRESH_ERROR="刷新状态失败"
    WEBUI_RUN_ACTION="运行Action"
    WEBUI_DEVICE_INFO="设备信息"
    
    # WebUI日志页
    WEBUI_LOGS_TITLE="运行日志"
    WEBUI_NO_LOGS="暂无日志"
    
    # WebUI设置页
    WEBUI_SETTINGS_TITLE="模块设置"
    WEBUI_CONFIG_FILE="配置文件:"
    WEBUI_SAVE="保存"
    WEBUI_SAVE_SUCCESS="设置保存成功！"
    
    # WebUI关于页
    WEBUI_ABOUT_TITLE="关于"
    WEBUI_ABOUT_INFO="AMMF模块 - 一个Magisk/KernelSU模块框架"
    WEBUI_MODULE_INFO="模块信息"
    WEBUI_MODULE_ID="模块ID"
    WEBUI_MODULE_VERSION="模块版本"
    WEBUI_MAGISK_MIN_VERSION="Magisk最低版本"
    WEBUI_KSU_MIN_VERSION="KernelSU最低版本"
    WEBUI_APATCH_MIN_VERSION="APatch最低版本"
    WEBUI_ANDROID_API="Android API"
    WEBUI_ABOUT_WEBUI="关于WebUI"
    WEBUI_VERSION="版本"
    WEBUI_DEVELOPER_INFO="开发者信息"
    WEBUI_DEVELOPER="开发者"
    WEBUI_NO_INFO="无可用信息"
    
    # WebUI通用元素
    WEBUI_LOADING="加载中..."
    WEBUI_REFRESH="刷新"
    WEBUI_CANCEL="取消"
    WEBUI_CONFIRM="确认"
    WEBUI_SUCCESS="成功"
    WEBUI_ERROR="错误"
    WEBUI_WARNING="警告"
    WEBUI_SELECT_LANGUAGE="选择语言"
    WEBUI_LANGUAGE_CHANGED="已切换到中文"
    
    # WebUI Action相关
    WEBUI_RUN_ACTION="执行Action"
    WEBUI_RUNNING_ACTION="正在运行Action..."
    WEBUI_ACTION_COMPLETE="Action执行完成"
    WEBUI_ACTION_ERROR="运行Action失败"
}

# 俄语
lang_ru() {
    # 系统消息
    ERROR_TEXT="Ошибка"
    ERROR_CODE_TEXT="Код ошибки"
    ERROR_UNSUPPORTED_VERSION="Неподдерживаемая версия"
    ERROR_VERSION_NUMBER="Номер версии"
    ERROR_UPGRADE_ROOT_SCHEME="Пожалуйста, обновите схему root или измените схему root"
    ERROR_INVALID_LOCAL_VALUE="Значение недействительно, должно быть true или false."
    KEY_VOLUME="Клавиша громкости"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScript отключен. Пользовательские скрипты не будут выполняться."
    CUSTOM_SCRIPT_ENABLED="CustomScript включен. Выполнение пользовательских скриптов."
    
    # 网络相关
    INTERNET_CONNET="Сеть доступна"
    DOWNLOAD_SUCCEEDED="Файл загружен"
    DOWNLOAD_FAILED="Ошибка загрузки"
    RETRY_DOWNLOAD="Повторить"
    SKIP_DOWNLOAD="Пропустить"
    CHECK_NETWORK="Нет подключения к сети. Пожалуйста, проверьте подключение к сети"
    PRESS_VOLUME_RETRY="Продолжить повторные попытки"
    PRESS_VOLUME_SKIP="Пропустить"
    DOWNLOADING="Загрузка"
    FAILED_TO_GET_FILE_SIZE="Не удалось получить размер файла"
    
    # 命令相关
    COMMAND_FAILED="Команда не выполнена"
    NOTFOUND_URL="Соответствующий URL для загрузки не найден"
    OUTPUT="Вывод"
    END="Конец установки"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== Выбор группы ========"
    MENU_TITLE_CHAR="======== Выбор символа ========"
    MENU_CURRENT_CANDIDATES="Текущие символы-кандидаты:"
    MENU_CURRENT_GROUP="Текущая группа:"
    MENU_INSTRUCTIONS="VOL+ выбрать | VOL- переключить"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="Пожалуйста, введите число"
    ERROR_INVALID_INPUT="Неверный ввод!"
    ERROR_OUT_OF_RANGE="Вне диапазона!"
    RESULT_TITLE="Результат выбора:"
    
    # Service脚本相关
    SERVICE_STARTED="Служба запущена"
    SERVICE_PAUSED="Вход в режим паузы, мониторинг файла"
    SERVICE_NORMAL_EXIT="Служба завершена нормально"
    SERVICE_STATUS_UPDATE="Статус обновлен"
    SERVICE_LOADING_MAIN="Загрузка main.sh"
    SERVICE_LOADING_SERVICE_SCRIPT="Загрузка service_script.sh"
    SERVICE_FILE_NOT_FOUND="Файл не найден"
    SERVICE_LOG_ROTATED="Журнал ротирован"
    
    # WebUI核心翻译
    WEBUI_TITLE="Настройки AMMF"
    WEBUI_LANGUAGE_NAME="Русский"
    
    # WebUI导航
    WEBUI_NAV_STATUS="Статус"
    WEBUI_NAV_LOGS="Журналы"
    WEBUI_NAV_SETTINGS="Настройки"
    WEBUI_NAV_ABOUT="О модуле"
    
    # WebUI状态页
    WEBUI_STATUS_TITLE="Статус модуля"
    WEBUI_STATUS_LABEL="Текущий статус:"
    WEBUI_UPTIME_LABEL="Время работы:"
    WEBUI_RUNNING="Работает"
    WEBUI_STOPPED="Остановлен"
    WEBUI_UNKNOWN="Неизвестно"
    WEBUI_REFRESH_STATUS="Обновить статус"
    WEBUI_STATUS_REFRESHED="Статус обновлен"
    WEBUI_STATUS_REFRESH_ERROR="Ошибка обновления статуса"
    WEBUI_RUN_ACTION="Выполнить Action"
    WEBUI_DEVICE_INFO="Информация об устройстве"
    
    # WebUI日志页
    WEBUI_LOGS_TITLE="Журналы"
    WEBUI_NO_LOGS="Нет доступных журналов"
    
    # WebUI设置页
    WEBUI_SETTINGS_TITLE="Настройки модуля"
    WEBUI_CONFIG_FILE="Файл конфигурации:"
    WEBUI_SAVE="Сохранить"
    WEBUI_SAVE_SUCCESS="Настройки успешно сохранены!"
    
        # WebUI关于页
    WEBUI_ABOUT_TITLE="О модуле"
    WEBUI_ABOUT_INFO="Модуль AMMF - Фреймворк модуля Magisk/KernelSU"
    WEBUI_MODULE_INFO="Информация о модуле"
    WEBUI_MODULE_ID="ID модуля"
    WEBUI_MODULE_VERSION="Версия модуля"
    WEBUI_MAGISK_MIN_VERSION="Мин. версия Magisk"
    WEBUI_KSU_MIN_VERSION="Мин. версия KernelSU"
    WEBUI_APATCH_MIN_VERSION="Мин. версия APatch"
    WEBUI_ANDROID_API="Android API"
    WEBUI_ABOUT_WEBUI="О WebUI"
    WEBUI_VERSION="Версия"
    WEBUI_DEVELOPER_INFO="Информация о разработчике"
    WEBUI_DEVELOPER="Разработчик"
    WEBUI_NO_INFO="Нет доступной информации"
    
    # WebUI通用元素
    WEBUI_LOADING="Загрузка..."
    WEBUI_REFRESH="Обновить"
    WEBUI_CANCEL="Отмена"
    WEBUI_CONFIRM="Подтвердить"
    WEBUI_SUCCESS="Успех"
    WEBUI_ERROR="Ошибка"
    WEBUI_WARNING="Предупреждение"
    WEBUI_SELECT_LANGUAGE="Выбрать язык"
    WEBUI_LANGUAGE_CHANGED="Язык изменен на русский"
    
    # WebUI Action相关
    WEBUI_RUN_ACTION="Выполнить Action"
    WEBUI_RUNNING_ACTION="Выполнение Action..."
    WEBUI_ACTION_COMPLETE="Action выполнен успешно"
    WEBUI_ACTION_ERROR="Ошибка выполнения Action"
}
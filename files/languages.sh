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
    
    # WebUI相关
    WEBUI_TITLE="AMMF Settings"
    WEBUI_SAVE="Save"
    WEBUI_LOADING="Loading settings..."
    WEBUI_SAVE_SUCCESS="Settings saved successfully!"
    WEBUI_SAVE_ERROR="Error saving settings"
    WEBUI_BOOLEAN_TRUE="Enabled"
    WEBUI_BOOLEAN_FALSE="Disabled"
    WEBUI_LOADING_DESCRIPTIONS="Loading descriptions..."
    WEBUI_LOADING_EXCLUSIONS="Loading exclusions..."
    WEBUI_LOADING_OPTIONS="Loading options..."
    WEBUI_SELECT="Select"
    WEBUI_LANGUAGE_SELECT="Select Language"
    WEBUI_LANGUAGE_TITLE="Available Languages"
    WEBUI_LANGUAGE_NAME="English"
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
    
    # WebUI相关
    WEBUI_TITLE="模块设置"
    WEBUI_SAVE="保存"
    WEBUI_LOADING="加载设置中..."
    WEBUI_SAVE_SUCCESS="设置保存成功！"
    WEBUI_SAVE_ERROR="保存设置时出错"
    WEBUI_BOOLEAN_TRUE="已启用"
    WEBUI_BOOLEAN_FALSE="已禁用"
    WEBUI_LOADING_DESCRIPTIONS="加载描述中..."
    WEBUI_LOADING_EXCLUSIONS="加载排除项中..."
    WEBUI_LOADING_OPTIONS="加载选项中..."
    WEBUI_SELECT="选择"
    WEBUI_LANGUAGE_SELECT="选择语言"
    WEBUI_LANGUAGE_TITLE="可用语言"
    WEBUI_LANGUAGE_NAME="中文"
}

# 日语
lang_jp() {
    # 系统消息
    ERROR_TEXT="エラー"
    ERROR_CODE_TEXT="エラーコード"
    ERROR_UNSUPPORTED_VERSION="サポートされていないバージョン"
    ERROR_VERSION_NUMBER="バージョン番号"
    ERROR_UPGRADE_ROOT_SCHEME="ルートスキームをアップグレードするか、ルートスキームを変更してください"
    ERROR_INVALID_LOCAL_VALUE="値が無効です。trueまたはfalseである必要があります。"
    KEY_VOLUME="音量キー"
    
    # 自定义脚本相关
    CUSTOM_SCRIPT_DISABLED="CustomScriptは無効になっています。カスタムスクリプトは実行されません。"
    CUSTOM_SCRIPT_ENABLED="CustomScriptが有効になっています。カスタムスクリプトを実行しています。"
    
    # 网络相关
    INTERNET_CONNET="ネットワークが利用可能"
    DOWNLOAD_SUCCEEDED="ファイルがダウンロードされました"
    DOWNLOAD_FAILED="ダウンロードに失敗しました"
    RETRY_DOWNLOAD="再試行"
    SKIP_DOWNLOAD="スキップ"
    CHECK_NETWORK="ネットワーク接続がありません ネットワーク接続を確認してください"
    PRESS_VOLUME_RETRY="再試行を続ける"
    PRESS_VOLUME_SKIP="スキップ"
    DOWNLOADING="ダウンロード中"
    FAILED_TO_GET_FILE_SIZE="ファイルサイズの取得に失敗しました"
    
    # 命令相关
    COMMAND_FAILED="コマンドが失敗しました"
    NOTFOUND_URL="一致するダウンロードURLが見つかりません"
    OUTPUT="出力"
    END="インストール終了"
    
    # 菜单相关
    MENU_TITLE_GROUP="======== グループ選択 ========"
    MENU_TITLE_CHAR="======== 文字選択 ========"
    MENU_CURRENT_CANDIDATES="現在の候補文字："
    MENU_CURRENT_GROUP="現在のグループ："
    MENU_INSTRUCTIONS="VOL+選択 | VOL-切り替え"
    
    # 输入相关
    PROMPT_ENTER_NUMBER="数字を入力してください"
    ERROR_INVALID_INPUT="無効な入力です！"
    ERROR_OUT_OF_RANGE="範囲外です！"
    RESULT_TITLE="選択結果："
    
    # WebUI相关
    WEBUI_TITLE="AMMFの設定"
    WEBUI_SAVE="保存"
    WEBUI_LOADING="設定を読み込んでいます..."
    WEBUI_SAVE_SUCCESS="設定が正常に保存されました！"
    WEBUI_SAVE_ERROR="設定の保存中にエラーが発生しました"
    WEBUI_BOOLEAN_TRUE="有効"
    WEBUI_BOOLEAN_FALSE="無効"
    WEBUI_LOADING_DESCRIPTIONS="説明を読み込んでいます..."
    WEBUI_LOADING_EXCLUSIONS="除外項目を読み込んでいます..."
    WEBUI_LOADING_OPTIONS="オプションを読み込んでいます..."
    WEBUI_SELECT="選択"
    WEBUI_LANGUAGE_SELECT="言語を選択"
    WEBUI_LANGUAGE_TITLE="利用可能な言語"
    WEBUI_LANGUAGE_NAME="日本語"
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
    
    # WebUI相关
    WEBUI_TITLE="Настройки AMMF"
    WEBUI_SAVE="Сохранить"
    WEBUI_LOADING="Загрузка настроек..."
    WEBUI_SAVE_SUCCESS="Настройки успешно сохранены!"
    WEBUI_SAVE_ERROR="Ошибка сохранения настроек"
    WEBUI_BOOLEAN_TRUE="Включено"
    WEBUI_BOOLEAN_FALSE="Отключено"
    WEBUI_LOADING_DESCRIPTIONS="Загрузка описаний..."
    WEBUI_LOADING_EXCLUSIONS="Загрузка исключений..."
    WEBUI_LOADING_OPTIONS="Загрузка опций..."
    WEBUI_SELECT="Выбрать"
    WEBUI_LANGUAGE_SELECT="Выбрать язык"
    WEBUI_LANGUAGE_TITLE="Доступные языки"
    WEBUI_LANGUAGE_NAME="Русский"
}


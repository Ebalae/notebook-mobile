import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Localization from 'expo-localization';
import * as MediaLibrary from 'expo-media-library';
import { Asset as MediaAsset } from 'expo-media-library';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Appearance,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';

import {
  ACCENT_KEY,
  ACCENT_PRESETS,
  DEFAULT_FOLDER_ID,
  LANGUAGE_KEY,
  NOTE_HIGHLIGHT_COLORS,
  ROOT_MOVE_TARGET_ID,
  STORAGE_KEY,
  THEME_KEY,
  formatDate,
  getAccentBorderColor,
  getAccentTextColor,
  getThemeName,
  isHexColor,
  makeFolder,
  makeNote,
  restoreAttachment,
  serializeAttachment,
  starterFolders,
  themes,
} from './src/notebookData';
import {
  BellIcon,
  FolderIcon,
  HighlightIcon,
  MoveIcon,
  PaperclipIcon,
  PencilIcon,
  PinIcon,
  ShareIcon,
  TrashIcon,
} from './src/NotebookIcons';

const supportsNotifications = Platform.OS === 'ios' || Platform.OS === 'android';
const LANGUAGE_KEYS = ['ru', 'en', 'es', 'de', 'zh'];
const THEME_KEYS = ['auto', 'light', 'dark'];
const LANGUAGE_NAMES = {
  ru: { ru: 'Русский', en: 'English', es: 'Испанский', de: 'Немецкий', zh: 'Китайский' },
  en: { ru: 'Russian', en: 'English', es: 'Spanish', de: 'German', zh: 'Chinese' },
  es: { ru: 'Ruso', en: 'Inglés', es: 'Español', de: 'Alemán', zh: 'Chino' },
  de: { ru: 'Russisch', en: 'Englisch', es: 'Spanisch', de: 'Deutsch', zh: 'Chinesisch' },
  zh: { ru: '俄语', en: '英语', es: '西班牙语', de: '德语', zh: '中文' },
};

function getSystemLanguage() {
  const languageCode = Localization.getLocales?.()[0]?.languageCode?.toLowerCase();
  return LANGUAGE_KEYS.includes(languageCode) ? languageCode : 'en';
}

if (supportsNotifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const baseUiText = {
  ru: {
    notebook: 'Блокнот', menu: 'Меню', settings: 'Настройки', about: 'О программе', help: 'Помощь',
    close: 'Закрыть', back: '‹ Назад', language: 'Язык', theme: 'Тема', russian: 'Русский', english: 'English', attachPhoto: 'Добавить фото', removePhoto: 'Удалить фото', downloadPhoto: 'Скачать фото', hideKeyboard: 'Скрыть клавиатуру',
    search: 'Поиск', folders: 'ПАПКИ', empty: 'Здесь пока пусто', create: 'Создать', folder: 'Папку', note: 'Запись',
    createNew: 'Создать папку или запись', openSearch: 'Открыть поиск', openMenu: 'Открыть меню', version: 'Версия', attachPhotoError: 'Не удалось добавить фото.', confirmImportMessage: 'Импорт заменит все текущие папки и записи резервной копией. Продолжить?',
    newFolder: 'Новая папка', folderName: 'Название папки', move: 'Переместить', pin: 'Закрепить', unpin: 'Открепить', delete: 'Удалить', undo: 'Отменить', deleted: 'Удалено',
    moveToFolder: 'Переместить в папку', root: 'Корень', noFolders: 'Нет доступных папок', emptyNote: 'Пустая запись', untitled: 'Без названия',
    elements: 'элементов', accentColor: 'Акцентный цвет', highlight: 'Выделить', removeHighlight: 'Убрать подсветку', nothingFound: 'Ничего не найдено', titlePlaceholder: 'Название', startWriting: 'Начните писать...', changed: 'ИЗМЕНЕНО', share: 'Поделиться', confirmDelete: 'Вы хотите удалить эту заметку?', cancel: 'Отмена', reminder: 'Напоминание', setReminder: 'Установить напоминание', date: 'Дата', time: 'Время', alarm: 'Будильник', notification: 'Уведомление', save: 'Сохранить', removeReminder: 'Убрать напоминание', invalidReminderDate: 'Выберите будущее время.', permissionRequired: 'Разрешите уведомления в настройках устройства.', photoPermissionRequired: 'Разрешите приложению сохранять фотографии в галерею.', photoSaved: 'Фото сохранено в галерею.',
    aboutText: 'Блокнот — простое приложение для заметок, личных записей и быстрых идей. Создавайте папки и записи, объединяйте материалы по темам и возвращайтесь к ним в удобный момент.\n\nПриложение поддерживает вложенные папки, поиск по названию и тексту, закрепление важных записей, цветовые выделения, фотографии и напоминания. Интерфейс можно настроить под себя: выбрать язык, светлую или тёмную тему и акцентный цвет.\n\nЗаписи и настройки сохраняются на устройстве автоматически. Фотографии хранятся вместе с заметками в памяти приложения. Для переноса данных на другой телефон используйте экспорт и импорт в разделе «Настройки»: резервная копия включает папки, записи и прикреплённые фотографии.\n\nПриложение не требует регистрации и не отправляет ваши записи на сторонние серверы.', aboutAuthor: 'Разработал: Мирошниченко Максим Александрович', aboutWebsite: 'miroshnichenko.net', supportAuthor: 'Поддержать автора', exportData: 'Экспортировать данные', importData: 'Импортировать данные', invalidBackup: 'Не удалось прочитать файл резервной копии.', dataExported: 'Данные готовы к отправке.', helpText: 'НАЧАЛО РАБОТЫ\nНажмите «+», чтобы создать папку или запись. Папки помогают организовать записи по темам и могут быть вложенными. Откройте папку нажатием на неё, а для возврата используйте кнопку «Назад».\n\nЗАПИСИ\nВведите название и текст записи. Изменения сохраняются автоматически. Пустая черновая запись не останется в списке, пока в ней ничего не заполнено.\n\nДЕЙСТВИЯ С ЭЛЕМЕНТАМИ\nУдерживайте папку или запись, чтобы открыть действия. Запись можно закрепить, выделить цветом, переместить в другую папку или удалить. Для отмены удаления используйте кнопку «Отменить», пока сообщение находится на экране.\n\nФОТОГРАФИИ\nНажмите на скрепку в редакторе, чтобы добавить одну или несколько фотографий. Нажмите на фото для просмотра, удерживайте его для удаления или сохранения в галерею.\n\nПОИСК\nИспользуйте поиск в верхней части списка, чтобы найти записи по названию или тексту. Поиск работает и внутри текущей папки, и по доступным элементам.\n\nНАПОМИНАНИЯ\nОткройте запись и нажмите на колокольчик, чтобы установить дату и время уведомления. Напоминание можно изменить или удалить в любой момент.\n\nРЕЗЕРВНАЯ КОПИЯ\nВ разделе «Настройки» доступны экспорт и импорт данных. Экспорт включает записи, папки и фотографии. Для переноса на другой телефон импортируйте новый JSON-файл, созданный после обновления приложения.\n\nТЕМА И ЯЗЫК\nВ настройках можно выбрать светлую или тёмную тему, акцентный цвет и язык интерфейса. Выбранные параметры сохраняются автоматически.',
  },
  en: {
    notebook: 'Notebook', menu: 'Menu', settings: 'Settings', about: 'About', help: 'Help',
    close: 'Close', back: '‹ Back', language: 'Language', theme: 'Theme', russian: 'Russian', english: 'English', attachPhoto: 'Add photo', removePhoto: 'Remove photo', downloadPhoto: 'Download photo', hideKeyboard: 'Hide keyboard',
    search: 'Search', folders: 'FOLDERS', empty: 'Nothing here yet', create: 'Create', folder: 'Folder', note: 'Note',
    createNew: 'Create folder or note', openSearch: 'Open search', openMenu: 'Open menu', version: 'Version', attachPhotoError: 'Could not add the photo.', confirmImportMessage: 'Import will replace all current folders and notes with the backup. Continue?',
    newFolder: 'New folder', folderName: 'Folder name', move: 'Move', pin: 'Pin', unpin: 'Unpin', delete: 'Delete', undo: 'Undo', deleted: 'Deleted',
    moveToFolder: 'Move to folder', root: 'Root', noFolders: 'No available folders', emptyNote: 'Empty note', untitled: 'Untitled',
    elements: 'items', accentColor: 'Accent color', highlight: 'Highlight', removeHighlight: 'Remove highlight', nothingFound: 'Nothing found', titlePlaceholder: 'Title', startWriting: 'Start writing...', changed: 'CHANGED', share: 'Share', confirmDelete: 'Do you want to delete this note?', cancel: 'Cancel', reminder: 'Reminder', setReminder: 'Set reminder', date: 'Date', time: 'Time', alarm: 'Alarm', notification: 'Notification', save: 'Save', removeReminder: 'Remove reminder', invalidReminderDate: 'Choose a future time.', permissionRequired: 'Allow notifications in device settings.', photoPermissionRequired: 'Allow the app to save photos to your gallery.', photoSaved: 'Photo saved to your gallery.',
    aboutText: 'Notebook is a simple app for notes, personal records, and quick ideas. Create folders and notes, organize material by topic, and return to it whenever you need it.\n\nThe app supports nested folders, search by title and text, pinned notes, color highlights, photos, and reminders. You can personalize the interface by choosing the language, a light or dark theme, and an accent color.\n\nNotes and settings are saved automatically on the device. Photos are stored together with their notes in the app storage. To move your data to another phone, use Export and Import in Settings: the backup includes folders, notes, and attached photos.\n\nThe app does not require an account and does not send your notes to third-party servers.', aboutAuthor: 'Created by: Miroshnichenko Maksim Aleksandrovich', aboutWebsite: 'miroshnichenko.net', supportAuthor: 'Support the author', exportData: 'Export data', importData: 'Import data', invalidBackup: 'Could not read the backup file.', dataExported: 'Data is ready to share.', helpText: 'GETTING STARTED\nTap "+" to create a folder or note. Folders help organize notes by topic and can be nested. Open a folder by tapping it and use the Back button to return.\n\nNOTES\nEnter a title and text. Changes are saved automatically. An empty draft will not remain in the list until something is added.\n\nITEM ACTIONS\nHold a folder or note to open its actions. A note can be pinned, highlighted, moved to another folder, or deleted. Use Undo while the deletion message is visible to restore it.\n\nPHOTOS\nTap the paperclip in the editor to add one or more photos. Tap a photo to view it, or hold it to remove it or save it to the gallery.\n\nSEARCH\nUse the search field at the top of the list to find notes by title or text. Search works across the available items.\n\nREMINDERS\nOpen a note and tap the bell to set a notification date and time. You can edit or remove a reminder at any time.\n\nBACKUP\nExport and import are available in Settings. An export includes notes, folders, and photos. To move data to another phone, import the new JSON file created after updating the app.\n\nTHEME AND LANGUAGE\nSettings let you choose a light or dark theme, an accent color, and the interface language. Your choices are saved automatically.',
  },
};

const uiText = {
  ...baseUiText,
  es: {
    ...baseUiText.en,
    notebook: 'Notas', menu: 'Menú', settings: 'Ajustes', about: 'Acerca de', help: 'Ayuda', close: 'Cerrar', back: '‹ Atrás', language: 'Idioma', theme: 'Tema', search: 'Buscar', folders: 'CARPETAS', empty: 'Todavía no hay nada', create: 'Crear', folder: 'Carpeta', note: 'Nota', newFolder: 'Nueva carpeta', folderName: 'Nombre de la carpeta', move: 'Mover', pin: 'Fijar', unpin: 'Desfijar', delete: 'Eliminar', undo: 'Deshacer', deleted: 'Eliminado', accentColor: 'Color de acento', highlight: 'Resaltar', removeHighlight: 'Quitar resaltado', nothingFound: 'No se encontró nada', titlePlaceholder: 'Título', startWriting: 'Empieza a escribir...', changed: 'CAMBIADO', share: 'Compartir', cancel: 'Cancelar', reminder: 'Recordatorio', date: 'Fecha', time: 'Hora', notification: 'Notificación', save: 'Guardar', removeReminder: 'Quitar recordatorio', untitled: 'Sin título', emptyNote: 'Nota vacía', elements: 'elementos', russian: 'Ruso', english: 'Inglés', attachPhoto: 'Añadir foto', downloadPhoto: 'Descargar foto', supportAuthor: 'Apoyar al autor', exportData: 'Exportar datos', importData: 'Importar datos', version: 'Versión', nothingFound: 'No se encontró nada', language: 'Idioma', theme: 'Tema', root: 'Raíz', noFolders: 'No hay carpetas disponibles', confirmDelete: '¿Quieres eliminar esta nota?', invalidReminderDate: 'Elige una hora futura.', permissionRequired: 'Permite las notificaciones en los ajustes del dispositivo.', photoSaved: 'Foto guardada en la galería.', photoPermissionRequired: 'Permite guardar fotos en la galería.', removePhoto: 'Eliminar foto', hideKeyboard: 'Ocultar teclado', openSearch: 'Abrir búsqueda', openMenu: 'Abrir menú', createNew: 'Crear carpeta o nota', help: 'Ayuda', about: 'Acerca de', settings: 'Ajustes', menu: 'Menú', folder: 'Carpeta', note: 'Nota', newFolder: 'Nueva carpeta', moveToFolder: 'Mover a carpeta', removeHighlight: 'Quitar resaltado', setReminder: 'Establecer recordatorio', alarm: 'Alarma', dataExported: 'Datos listos para compartir', invalidBackup: 'No se pudo leer la copia de seguridad.', attachPhotoError: 'No se pudo añadir la foto.', confirmImportMessage: 'La importación reemplazará las carpetas y notas actuales. ¿Continuar?', photoSaved: 'Foto guardada en la galería.', photoPermissionRequired: 'Permite guardar fotos en la galería.', aboutWebsite: 'miroshnichenko.net', supportAuthor: 'Apoyar al autor', changed: 'CAMBIADO', delete: 'Eliminar', undo: 'Deshacer', deleted: 'Eliminado', highlight: 'Resaltar', pin: 'Fijar', unpin: 'Desfijar', share: 'Compartir', search: 'Buscar', folders: 'CARPETAS', empty: 'Todavía no hay nada', create: 'Crear', elements: 'elementos', titlePlaceholder: 'Título', startWriting: 'Empieza a escribir...', save: 'Guardar', cancel: 'Cancelar', close: 'Cerrar', back: '‹ Atrás', russian: 'Ruso', english: 'Inglés', root: 'Raíz', noFolders: 'No hay carpetas disponibles', date: 'Fecha', time: 'Hora', notification: 'Notificación', removeReminder: 'Quitar recordatorio', invalidReminderDate: 'Elige una hora futura.', permissionRequired: 'Permite las notificaciones en los ajustes del dispositivo.', photoSaved: 'Foto guardada en la galería.', photoPermissionRequired: 'Permite guardar fotos en la galería.', supportAuthor: 'Apoyar al autor', exportData: 'Exportar datos', importData: 'Importar datos', version: 'Versión', about: 'Acerca de', help: 'Ayuda', menu: 'Menú', settings: 'Ajustes', language: 'Idioma', theme: 'Tema', notebook: 'Notas', folderName: 'Nombre de la carpeta', move: 'Mover', pin: 'Fijar', unpin: 'Desfijar', newFolder: 'Nueva carpeta', moveToFolder: 'Mover a carpeta', emptyNote: 'Nota vacía', untitled: 'Sin título', accentColor: 'Color de acento', removePhoto: 'Eliminar foto', downloadPhoto: 'Descargar foto', hideKeyboard: 'Ocultar teclado', openSearch: 'Abrir búsqueda', openMenu: 'Abrir menú', createNew: 'Crear carpeta o nota', attachPhoto: 'Añadir foto', setReminder: 'Establecer recordatorio', alarm: 'Alarma', reminder: 'Recordatorio', confirmDelete: '¿Quieres eliminar esta nota?', aboutAuthor: 'Creado por: Maksim Miroshnichenko', helpText: baseUiText.en.helpText, aboutText: baseUiText.en.aboutText,
  },
  de: {
    ...baseUiText.en,
    notebook: 'Notizbuch', menu: 'Menü', settings: 'Einstellungen', about: 'Über die App', help: 'Hilfe', close: 'Schließen', back: '‹ Zurück', language: 'Sprache', theme: 'Design', search: 'Suche', folders: 'ORDNER', empty: 'Noch nichts vorhanden', create: 'Erstellen', folder: 'Ordner', note: 'Notiz', newFolder: 'Neuer Ordner', folderName: 'Ordnername', move: 'Verschieben', pin: 'Anheften', unpin: 'Lösen', delete: 'Löschen', undo: 'Rückgängig', deleted: 'Gelöscht', accentColor: 'Akzentfarbe', highlight: 'Hervorheben', removeHighlight: 'Hervorhebung entfernen', nothingFound: 'Nichts gefunden', titlePlaceholder: 'Titel', startWriting: 'Schreibe etwas...', changed: 'GEÄNDERT', share: 'Teilen', cancel: 'Abbrechen', reminder: 'Erinnerung', date: 'Datum', time: 'Uhrzeit', notification: 'Benachrichtigung', save: 'Speichern', removeReminder: 'Erinnerung entfernen', untitled: 'Ohne Titel', emptyNote: 'Leere Notiz', elements: 'Elemente', russian: 'Russisch', english: 'Englisch', attachPhoto: 'Foto hinzufügen', downloadPhoto: 'Foto herunterladen', supportAuthor: 'Autor unterstützen', exportData: 'Daten exportieren', importData: 'Daten importieren', version: 'Version', root: 'Stamm', noFolders: 'Keine Ordner verfügbar', confirmDelete: 'Diese Notiz löschen?', invalidReminderDate: 'Wähle eine zukünftige Zeit.', permissionRequired: 'Erlaube Benachrichtigungen in den Geräteeinstellungen.', photoSaved: 'Foto in der Galerie gespeichert.', photoPermissionRequired: 'Erlaube das Speichern von Fotos in der Galerie.', aboutAuthor: 'Erstellt von: Maksim Miroshnichenko', helpText: baseUiText.en.helpText, aboutText: baseUiText.en.aboutText,
  },
  zh: {
    ...baseUiText.en,
    notebook: '笔记本', menu: '菜单', settings: '设置', about: '关于', help: '帮助', close: '关闭', back: '‹ 返回', language: '语言', theme: '主题', search: '搜索', folders: '文件夹', empty: '这里还没有内容', create: '创建', folder: '文件夹', note: '笔记', newFolder: '新建文件夹', folderName: '文件夹名称', move: '移动', pin: '置顶', unpin: '取消置顶', delete: '删除', undo: '撤销', deleted: '已删除', accentColor: '强调色', highlight: '高亮', removeHighlight: '取消高亮', nothingFound: '未找到内容', titlePlaceholder: '标题', startWriting: '开始输入...', changed: '已修改', share: '分享', cancel: '取消', reminder: '提醒', date: '日期', time: '时间', notification: '通知', save: '保存', removeReminder: '取消提醒', untitled: '无标题', emptyNote: '空笔记', elements: '项', russian: '俄语', english: '英语', attachPhoto: '添加照片', downloadPhoto: '下载照片', supportAuthor: '支持作者', exportData: '导出数据', importData: '导入数据', version: '版本', root: '根目录', noFolders: '没有可用文件夹', confirmDelete: '要删除这条笔记吗？', invalidReminderDate: '请选择未来时间。', permissionRequired: '请在设备设置中允许通知。', photoSaved: '照片已保存到图库。', photoPermissionRequired: '请允许应用保存照片到图库。', aboutAuthor: '作者：Maksim Miroshnichenko', helpText: baseUiText.en.helpText, aboutText: baseUiText.en.aboutText,
  },
};

Object.assign(uiText.ru, {
  setupTitle: 'Базовая настройка', setupLanguage: 'Язык', setupTheme: 'Тема', continue: 'Продолжить',
});
Object.assign(uiText.en, {
  setupTitle: 'Basic setup', setupLanguage: 'Language', setupTheme: 'Theme', continue: 'Continue',
});
Object.assign(uiText.es, {
  setupTitle: 'Configuración inicial', setupLanguage: 'Idioma', setupTheme: 'Tema', continue: 'Continuar',
  aboutText: 'Notas es una aplicación sencilla para notas, registros personales e ideas rápidas. Crea carpetas y notas, organiza el contenido por temas y vuelve a él cuando lo necesites.\n\nLa aplicación admite carpetas anidadas, búsqueda, notas fijadas, resaltados de color, fotos y recordatorios. Los datos se guardan automáticamente en el dispositivo y no se envían a servidores externos.',
  helpText: 'PRIMEROS PASOS\nPulsa «+» para crear una carpeta o una nota. Las carpetas pueden estar anidadas.\n\nNOTAS\nEscribe un título y un texto. Los cambios se guardan automáticamente.\n\nACCIONES\nMantén pulsada una carpeta o nota para fijarla, resaltarla, moverla o eliminarla.\n\nFOTOS\nUsa el clip en el editor para añadir fotos.\n\nBÚSQUEDA Y COPIAS\nBusca por título o texto. Exporta e importa tus datos desde Ajustes.',
});
Object.assign(uiText.de, {
  setupTitle: 'Grundeinrichtung', setupLanguage: 'Sprache', setupTheme: 'Design', continue: 'Weiter',
  aboutText: 'Notizbuch ist eine einfache App für Notizen, persönliche Einträge und schnelle Ideen. Erstelle Ordner und Notizen und organisiere deine Inhalte nach Themen.\n\nDie App unterstützt verschachtelte Ordner, Suche, angeheftete Notizen, farbliche Hervorhebungen, Fotos und Erinnerungen. Deine Daten werden automatisch auf dem Gerät gespeichert und nicht an externe Server gesendet.',
  helpText: 'ERSTE SCHRITTE\nTippe auf «+», um einen Ordner oder eine Notiz zu erstellen. Ordner können verschachtelt werden.\n\nNOTIZEN\nGib einen Titel und Text ein. Änderungen werden automatisch gespeichert.\n\nAKTIONEN\nHalte einen Ordner oder eine Notiz gedrückt, um sie anzuheften, hervorzuheben, zu verschieben oder zu löschen.\n\nFOTOS\nVerwende die Büroklammer im Editor, um Fotos hinzuzufügen.\n\nSUCHE UND BACKUPS\nSuche nach Titel oder Text. Export und Import findest du in den Einstellungen.',
});
Object.assign(uiText.zh, {
  setupTitle: '基础设置', setupLanguage: '语言', setupTheme: '主题', continue: '继续',
  aboutText: '笔记本是一款用于记录笔记、个人内容和快速想法的简单应用。你可以创建文件夹和笔记，并按主题整理内容。\n\n应用支持嵌套文件夹、搜索、置顶笔记、颜色高亮、照片和提醒。数据会自动保存在设备上，不会发送到第三方服务器。',
  helpText: '开始使用\n点击“+”创建文件夹或笔记，文件夹可以嵌套。\n\n笔记\n输入标题和正文，修改会自动保存。\n\n操作\n长按文件夹或笔记，可以置顶、高亮、移动或删除。\n\n照片\n在编辑器中点击回形针添加照片。\n\n搜索和备份\n可以按标题或正文搜索，并在设置中导入或导出数据。',
});
Object.assign(uiText.ru, {
  privacyPolicy: 'Конфиденциальность',
  privacyPolicyText: 'Последнее обновление: 26 сентября 2026 года.\n\n1. Оператор\nОператором обработки данных является разработчик приложения: Мирошниченко Максим Александрович. Сайт и контакт для обращений: miroshnichenko.net.\n\n2. Какие данные обрабатываются\nПриложение хранит на устройстве созданные вами папки, записи, настройки, идентификаторы локальных уведомлений и прикреплённые фотографии. Регистрация не требуется. Приложение не запрашивает имя, телефон, адрес электронной почты и не передаёт содержимое записей на сервер разработчика.\n\n3. Цели и основание обработки\nДанные обрабатываются для работы блокнота, поиска, сохранения настроек, прикрепления фотографий, создания напоминаний и выполнения экспорта или импорта резервной копии. Основание обработки — предоставление функций приложения по инициативе пользователя и его согласие с этой политикой.\n\n4. Доступ к функциям устройства\nДоступ к фотографиям используется только после разрешения пользователя для добавления изображений в записи или сохранения их в галерею. Разрешение на уведомления используется для локальных напоминаний. Отказ не препятствует использованию остальных функций.\n\n5. Передача данных\nЗаписи и настройки не отправляются сторонним серверам автоматически. При экспорте, импорте, использовании системного меню «Поделиться», сохранении фотографии в галерею или переходе к поддержке автора данные могут быть переданы выбранному пользователем приложению или сервису. Условия обработки у таких сервисов определяются их операторами.\n\n6. Хранение и удаление\nДанные хранятся на устройстве до удаления пользователем, удаления приложения или очистки его данных. Записи и фотографии можно удалить в приложении. Резервные копии, сохранённые отдельно или переданные другим сервисам, удаляются пользователем самостоятельно.\n\n7. Права пользователя\nПользователь вправе запросить сведения об обработке своих данных, потребовать их уточнения или удаления, а также отозвать согласие, направив обращение оператору через miroshnichenko.net. Отзыв согласия может сделать недоступными связанные функции приложения.\n\n8. Изменение политики\nАктуальная редакция размещается в приложении. При изменении политики дата обновления изменяется.\n\nПо вопросам обработки данных обратитесь к оператору: miroshnichenko.net.'
});
Object.assign(uiText.en, {
  privacyPolicy: 'Privacy',
  privacyPolicyText: 'Last updated: September 26, 2026.\n\n1. Operator\nThe operator is the app developer, Maksim Miroshnichenko. Website and contact: miroshnichenko.net.\n\n2. Data processed\nThe app stores the folders, notes, settings, local notification identifiers, and attached photos you create on your device. No account is required. The app does not request your name, phone number, or email address and does not send note content to the developer’s server.\n\n3. Purposes and legal basis\nData is processed to provide notebook features, search, settings storage, photo attachments, reminders, and backup export or import. The basis is providing the app features requested by the user and consent to this policy.\n\n4. Device permissions\nPhoto access is used only after your permission to add images to notes or save them to the gallery. Notification access is used for local reminders. Refusing permission does not prevent use of other features.\n\n5. Sharing\nNotes and settings are not automatically sent to third-party servers. When you export, import, use the system Share menu, save a photo to the gallery, or open author support, data may be transferred to the app or service you choose. Those services are governed by their own operators’ policies.\n\n6. Storage and deletion\nData is stored on your device until you delete it, uninstall the app, or clear its data. Notes and photos can be deleted in the app. Backups saved separately or shared with other services must be deleted by you.\n\n7. Your rights\nYou may request information about processing, correction or deletion of your data, or withdraw consent by contacting the operator through miroshnichenko.net. Withdrawal may make related app features unavailable.\n\n8. Policy changes\nThe current version is available in the app. The update date changes when this policy is amended.\n\nFor privacy questions, contact the operator at miroshnichenko.net.'
});
Object.assign(uiText.es, {
  privacyPolicy: 'Privacidad',
  privacyPolicyText: 'Última actualización: 26 de septiembre de 2026.\n\n1. Responsable\nEl responsable del tratamiento es el desarrollador de la aplicación: Maksim Miroshnichenko. Sitio web y contacto: miroshnichenko.net.\n\n2. Datos tratados\nLa aplicación guarda en tu dispositivo las carpetas, notas, ajustes, identificadores de notificaciones locales y fotografías adjuntas que creas. No se necesita una cuenta. La aplicación no solicita tu nombre, teléfono ni correo electrónico y no envía el contenido de las notas al servidor del desarrollador.\n\n3. Finalidades y base jurídica\nLos datos se tratan para ofrecer las funciones del bloc de notas, búsqueda, almacenamiento de ajustes, fotografías, recordatorios y exportación o importación de copias de seguridad. La base es ofrecer las funciones solicitadas por el usuario y su consentimiento a esta política.\n\n4. Permisos del dispositivo\nEl acceso a las fotos se utiliza solo después de tu permiso para añadir imágenes a las notas o guardarlas en la galería. El acceso a las notificaciones se utiliza para recordatorios locales. Rechazar un permiso no impide utilizar las demás funciones.\n\n5. Compartición\nLas notas y los ajustes no se envían automáticamente a servidores externos. Al exportar, importar, usar el menú Compartir, guardar una foto en la galería o abrir la página de apoyo al autor, los datos pueden transferirse a la aplicación o servicio que elijas. Esos servicios se rigen por sus propias políticas.\n\n6. Conservación y eliminación\nLos datos se guardan en tu dispositivo hasta que los elimines, desinstales la aplicación o borres sus datos. Puedes eliminar notas y fotos en la aplicación. Las copias guardadas aparte o compartidas con otros servicios debes eliminarlas tú.\n\n7. Tus derechos\nPuedes solicitar información sobre el tratamiento, la rectificación o eliminación de tus datos, o retirar tu consentimiento, contactando con el responsable a través de miroshnichenko.net. Retirar el consentimiento puede impedir el uso de funciones relacionadas.\n\n8. Cambios\nLa versión vigente está disponible en la aplicación. La fecha de actualización cambia cuando se modifica esta política.\n\nPara preguntas sobre privacidad, contacta con el responsable en miroshnichenko.net.'
});
Object.assign(uiText.de, {
  privacyPolicy: 'Datenschutz',
  privacyPolicyText: 'Letzte Aktualisierung: 26. September 2026.\n\n1. Verantwortlicher\nVerantwortlicher ist der Entwickler der App: Maksim Miroshnichenko. Website und Kontakt: miroshnichenko.net.\n\n2. Verarbeitete Daten\nDie App speichert die von dir erstellten Ordner, Notizen, Einstellungen, lokalen Benachrichtigungskennungen und angehängten Fotos auf deinem Gerät. Ein Konto ist nicht erforderlich. Die App fragt weder deinen Namen, deine Telefonnummer noch deine E-Mail-Adresse ab und sendet den Inhalt deiner Notizen nicht an den Server des Entwicklers.\n\n3. Zwecke und Rechtsgrundlage\nDie Daten werden verarbeitet, um Notizbuchfunktionen, Suche, Speicherung der Einstellungen, Fotos, Erinnerungen sowie den Export und Import von Sicherungskopien bereitzustellen. Grundlage sind die von dir angeforderten App-Funktionen und deine Zustimmung zu dieser Erklärung.\n\n4. Geräteberechtigungen\nDer Zugriff auf Fotos wird nur nach deiner Erlaubnis verwendet, um Bilder zu Notizen hinzuzufügen oder in der Galerie zu speichern. Der Benachrichtigungszugriff wird für lokale Erinnerungen verwendet. Die Ablehnung einer Berechtigung verhindert nicht die Nutzung der übrigen Funktionen.\n\n5. Weitergabe\nNotizen und Einstellungen werden nicht automatisch an externe Server gesendet. Beim Export, Import, bei der Nutzung des Teilen-Menüs, beim Speichern eines Fotos in der Galerie oder beim Öffnen der Unterstützung des Autors können Daten an die von dir gewählte App oder den gewählten Dienst übertragen werden. Für diese Dienste gelten deren eigene Richtlinien.\n\n6. Speicherung und Löschung\nDie Daten werden auf deinem Gerät gespeichert, bis du sie löschst, die App deinstallierst oder ihre Daten löschst. Notizen und Fotos können in der App gelöscht werden. Separat gespeicherte oder mit anderen Diensten geteilte Sicherungskopien musst du selbst löschen.\n\n7. Deine Rechte\nDu kannst Auskunft über die Verarbeitung sowie die Berichtigung oder Löschung deiner Daten verlangen oder deine Einwilligung widerrufen. Wende dich dazu über miroshnichenko.net an den Verantwortlichen. Ein Widerruf kann verbundene App-Funktionen unbrauchbar machen.\n\n8. Änderungen\nDie aktuelle Fassung ist in der App verfügbar. Bei Änderungen wird das Aktualisierungsdatum geändert.\n\nBei Fragen zum Datenschutz kontaktiere den Verantwortlichen über miroshnichenko.net.'
});
Object.assign(uiText.zh, {
  privacyPolicy: '隐私',
  privacyPolicyText: '最后更新：2026年9月26日。\n\n1. 处理者\n应用开发者 Maksim Miroshnichenko 是数据处理者。网站和联系方式：miroshnichenko.net。\n\n2. 处理的数据\n应用会将你创建的文件夹、笔记、设置、本地通知标识符和附件照片保存在设备上。应用无需注册账户，不会要求你的姓名、电话号码或电子邮箱，也不会将笔记内容发送到开发者的服务器。\n\n3. 处理目的和依据\n数据用于提供笔记、搜索、设置保存、照片附件、提醒以及备份导出和导入功能。处理依据是提供用户主动请求的应用功能以及用户同意本政策。\n\n4. 设备权限\n应用仅在获得你的许可后访问照片，用于将图片添加到笔记或保存到相册。通知权限用于本地提醒。拒绝某项权限不会影响其他功能的使用。\n\n5. 数据共享\n笔记和设置不会自动发送到第三方服务器。当你导出、导入、使用系统分享菜单、将照片保存到相册或打开作者支持页面时，数据可能会传输给你选择的应用或服务。这些服务由其各自的运营方按照自己的政策处理数据。\n\n6. 保存和删除\n数据会保存在你的设备上，直到你删除数据、卸载应用或清除应用数据。你可以在应用中删除笔记和照片。单独保存或分享给其他服务的备份需要由你自行删除。\n\n7. 用户权利\n你可以通过 miroshnichenko.net 联系处理者，要求了解数据处理情况、修改或删除数据，或撤回同意。撤回同意可能导致相关应用功能无法使用。\n\n8. 政策变更\n当前版本可在应用中查看。政策修改后，更新日期也会相应变更。\n\n如有隐私问题，请通过 miroshnichenko.net 联系处理者。'
});


function NoteImage({ attachment, dismissSignal, onDownload, onRemove, text, theme }) {
  const [showActions, setShowActions] = useState(false);
  const [isViewerOpen, setViewerOpen] = useState(false);
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(new Animated.Value(-10)).current;

  const animateImage = (pressed) => {
    Animated.parallel([
      Animated.spring(imageScale, { friction: 7, tension: 180, toValue: pressed ? 0.98 : 1, useNativeDriver: true }),
      Animated.timing(imageOpacity, { duration: 120, isInteraction: false, toValue: pressed ? 0.78 : 1, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    actionsOpacity.stopAnimation();
    actionsTranslateY.stopAnimation();
    Animated.parallel([
      Animated.timing(actionsOpacity, { duration: showActions ? 160 : 120, isInteraction: false, toValue: showActions ? 1 : 0, useNativeDriver: true }),
      Animated.timing(actionsTranslateY, { duration: showActions ? 160 : 120, isInteraction: false, toValue: showActions ? 0 : -10, useNativeDriver: true }),
    ]).start();
    return () => {
      actionsOpacity.stopAnimation();
      actionsTranslateY.stopAnimation();
    };
  }, [actionsOpacity, actionsTranslateY, showActions]);

  useEffect(() => {
    if (dismissSignal > 0) setShowActions(false);
  }, [dismissSignal]);

  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(35);
    }
    setShowActions(true);
  };

  return (
    <View style={styles.attachmentFrame}>
      <Pressable delayLongPress={300} onLongPress={handleLongPress} onPress={() => setViewerOpen(true)} onPressIn={() => animateImage(true)} onPressOut={() => animateImage(false)}>
        <Animated.View style={{ opacity: imageOpacity, transform: [{ scale: imageScale }] }}>
          <Image source={{ uri: attachment.uri }} style={[styles.attachmentImage, { height: attachment.height, width: attachment.width }]} />
        </Animated.View>
      </Pressable>
      <Animated.View pointerEvents={showActions ? 'auto' : 'none'} onTouchStart={(event) => event.stopPropagation?.()} style={[styles.attachmentActions, { backgroundColor: theme.surface, borderColor: theme.border, opacity: actionsOpacity, transform: [{ translateY: actionsTranslateY }] }]}> 
          <Pressable accessibilityLabel={text.removePhoto} onPress={() => { setShowActions(false); onRemove(attachment); }} style={styles.attachmentActionButton}>
            <Text style={[styles.attachmentActionText, { color: theme.danger }]}>{text.delete}</Text>
          </Pressable>
          <Pressable accessibilityLabel={text.downloadPhoto} onPress={() => { setShowActions(false); onDownload(attachment); }} style={styles.attachmentActionButton}>
            <Text style={[styles.attachmentActionText, { color: theme.text }]}>{text.downloadPhoto}</Text>
          </Pressable>
      </Animated.View>
      <Modal animationType="fade" onRequestClose={() => setViewerOpen(false)} transparent visible={isViewerOpen}>
        <Pressable onPress={() => setViewerOpen(false)} style={styles.photoViewer}>
          <Image accessibilityLabel={text.attachPhoto} source={{ uri: attachment.uri }} style={styles.photoViewerImage} />
        </Pressable>
      </Modal>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedNotificationButton({ accessibilityLabel, accessibilityRole, children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue) => Animated.spring(scale, { friction: 7, tension: 180, toValue, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => animate(0.84)}
      onPressOut={() => animate(1)}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

function AnimatedListCard({ children, deleting, index }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (deleting) {
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();
      Animated.parallel([
        Animated.timing(opacity, { duration: 220, isInteraction: false, toValue: 0, useNativeDriver: true }),
        Animated.timing(translateY, { duration: 220, isInteraction: false, toValue: 24, useNativeDriver: true }),
        Animated.timing(scale, { duration: 220, isInteraction: false, toValue: 0.92, useNativeDriver: true }),
      ]).start();
      return undefined;
    }
    if (hasMountedRef.current) {
      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return undefined;
    }

    opacity.setValue(0);
    translateY.setValue(12);
    scale.setValue(1);
    const animation = Animated.parallel([
      Animated.timing(opacity, { delay: Math.min(index, 6) * 35, duration: 220, isInteraction: false, toValue: 1, useNativeDriver: true }),
      Animated.timing(translateY, { delay: Math.min(index, 6) * 35, duration: 220, isInteraction: false, toValue: 0, useNativeDriver: true }),
    ]);
    animation.start(() => {
      hasMountedRef.current = true;
    });
    return () => animation.stop();
  }, [deleting, index, opacity, scale, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>{children}</Animated.View>;
}

function UndoToast({ closing, itemName, onDismiss, onUndo, secondsLeft, text, theme }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { duration: closing ? 180 : 220, isInteraction: false, toValue: closing ? 0 : 1, useNativeDriver: true }),
      Animated.timing(translateY, { duration: closing ? 180 : 220, isInteraction: false, toValue: closing ? 32 : 0, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished && closing) onDismiss();
    });
    return () => {
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [closing, opacity, translateY]);

  return (
    <Animated.View style={[styles.undoToast, { backgroundColor: theme.mutedSurface, borderColor: theme.border, opacity, transform: [{ translateY }] }]}> 
      <View style={styles.undoToastInfo}>
        <Text numberOfLines={1} style={[styles.undoToastTitle, { color: theme.text }]}>{itemName}</Text>
        <Text style={[styles.undoToastText, { color: theme.secondaryText }]}>{text.deleted} · {secondsLeft}с</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onUndo} style={styles.undoButton}>
        <Text style={[styles.undoButtonText, { color: theme.accent }]}>{text.undo}</Text>
      </Pressable>
    </Animated.View>
  );
}

function SlideModal({ children, onClose, theme, visible }) {
  if (!visible) return null;
  return <Modal animationType="slide" onRequestClose={onClose} transparent visible><SafeAreaProvider style={styles.slideModalRoot}><View style={[styles.slideModal, { backgroundColor: theme.background }]}>{children}</View></SafeAreaProvider></Modal>;
}

function CenterModal({ children, onClose, theme, visible }) {
  if (!visible) return null;
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.centerModalBackdrop}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.centerModalShade]} />
        <Pressable onPress={onClose} style={styles.centerModalPressable}>
        <View onStartShouldSetResponder={() => true} style={[styles.centerModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          {children}
        </View>
        </Pressable>
      </View>
    </Modal>
  );
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingNotificationNoteId, setPendingNotificationNoteId] = useState(null);
  const [query, setQuery] = useState('');
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [menuPage, setMenuPage] = useState(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isReminderOpen, setReminderOpen] = useState(false);
  const [isSavingReminder, setSavingReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [reminderPickerMode, setReminderPickerMode] = useState('date');
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
  const [photoActionsDismissSignal, setPhotoActionsDismissSignal] = useState(0);
  const [actionItem, setActionItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [highlightItem, setHighlightItem] = useState(null);
  const [undoState, setUndoState] = useState(null);
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [folderName, setFolderName] = useState('');
  const [themeKey, setThemeKey] = useState('auto');
  const [systemThemeKey, setSystemThemeKey] = useState(() => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'));
  const [accentColor, setAccentColor] = useState(themes.light.accent);
  const [accentDraft, setAccentDraft] = useState(themes.light.accent);
  const [languageKey, setLanguageKey] = useState(getSystemLanguage);
  const [isInitialSetupOpen, setInitialSetupOpen] = useState(false);
  const [isLoaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isSwitchingFromSearch, setSwitchingFromSearch] = useState(false);
  const storageWriteRef = useRef(Promise.resolve());
  const undoTimerRef = useRef(null);
  const deletionTimerRef = useRef(null);
  const pressStateRef = useRef(new Map());
  const titleInputRef = useRef(null);
  const bodyInputRef = useRef(null);
  const folderOpacity = useRef(new Animated.Value(1)).current;
  const folderTranslateX = useRef(new Animated.Value(0)).current;
  const actionReveal = useRef(new Animated.Value(0)).current;
  const reminderOverlayOpacity = useRef(new Animated.Value(0)).current;
  const reminderCardScale = useRef(new Animated.Value(0.94)).current;
  const reminderCardTranslateY = useRef(new Animated.Value(12)).current;
  const reminderClosingRef = useRef(false);
  const menuPageOpacity = useRef(new Animated.Value(1)).current;
  const menuPageTranslateX = useRef(new Animated.Value(0)).current;
  const accentSelectionScale = useRef(new Animated.Value(1)).current;
  const resolvedThemeKey = themeKey === 'auto' ? systemThemeKey : themeKey;
  const theme = { ...themes[resolvedThemeKey], accent: accentColor, accentText: getAccentTextColor(accentColor) };
  const text = uiText[languageKey];
  const supportUrl = languageKey === 'ru' ? 'https://sveteng.com/ru/donate/qr/' : 'https://sveteng.com/ru/donate/usdt/';

  const selectAccentColor = (color) => {
    setAccentColor(color);
    setAccentDraft(color);
    accentSelectionScale.stopAnimation();
    accentSelectionScale.setValue(0.78);
    Animated.spring(accentSelectionScale, { friction: 7, tension: 180, toValue: 1, useNativeDriver: true }).start();
  };

  useEffect(() => {
    Appearance.setColorScheme(themeKey === 'auto' ? null : themeKey);
  }, [themeKey]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemThemeKey(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
  }, []);

  const offerUndo = (snapshot) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoState({ ...snapshot, closing: false, expiresAt: Date.now() + 5000, secondsLeft: 5 });
    undoTimerRef.current = setTimeout(() => {
      undoTimerRef.current = null;
      setUndoState((current) => current ? { ...current, closing: true } : null);
    }, 5000);
  };

  const undoDelete = () => {
    if (!undoState) return;
    setFolders(undoState.folders);
    setNotes(undoState.notes);
    setSelectedId(undoState.selectedId);
    setCurrentFolderId(undoState.currentFolderId);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
    undoTimerRef.current = null;
    deletionTimerRef.current = null;
    setDeletingIds(new Set());
    setUndoState((current) => current ? { ...current, closing: true } : null);
  };

  useEffect(() => {
    if (!undoState) return undefined;
    const interval = setInterval(() => {
      setUndoState((current) => {
        if (!current) return null;
        const secondsLeft = Math.max(0, Math.ceil((current.expiresAt - Date.now()) / 1000));
        return secondsLeft === current.secondsLeft ? current : { ...current, secondsLeft };
      });
    }, 250);
    return () => clearInterval(interval);
  }, [undoState?.expiresAt]);

  useEffect(() => {
    actionReveal.stopAnimation();
    if (!actionItem) return undefined;
    actionReveal.setValue(0);
    Animated.parallel([
      Animated.timing(actionReveal, { duration: 160, isInteraction: false, toValue: 1, useNativeDriver: true }),
    ]).start();
    return () => actionReveal.stopAnimation();
  }, [actionItem, actionReveal]);

  useEffect(() => {
    reminderOverlayOpacity.stopAnimation();
    reminderCardScale.stopAnimation();
    reminderCardTranslateY.stopAnimation();
    if (!isReminderOpen) return undefined;
    reminderClosingRef.current = false;
    reminderOverlayOpacity.setValue(0);
    reminderCardScale.setValue(0.94);
    reminderCardTranslateY.setValue(12);
    Animated.parallel([
      Animated.timing(reminderOverlayOpacity, { duration: 180, isInteraction: false, toValue: 1, useNativeDriver: true }),
      Animated.timing(reminderCardScale, { duration: 180, isInteraction: false, toValue: 1, useNativeDriver: true }),
      Animated.timing(reminderCardTranslateY, { duration: 180, isInteraction: false, toValue: 0, useNativeDriver: true }),
    ]).start();
    return () => {
      reminderOverlayOpacity.stopAnimation();
      reminderCardScale.stopAnimation();
      reminderCardTranslateY.stopAnimation();
    };
  }, [isReminderOpen, reminderCardScale, reminderCardTranslateY, reminderOverlayOpacity]);

  useEffect(() => {
    if (!isMenuOpen || !menuPage) return undefined;
    menuPageOpacity.stopAnimation();
    menuPageTranslateX.stopAnimation();
    menuPageOpacity.setValue(0);
    menuPageTranslateX.setValue(14);
    Animated.parallel([
      Animated.timing(menuPageOpacity, { duration: 180, isInteraction: false, toValue: 1, useNativeDriver: true }),
      Animated.timing(menuPageTranslateX, { duration: 180, isInteraction: false, toValue: 0, useNativeDriver: true }),
    ]).start();
    return () => {
      menuPageOpacity.stopAnimation();
      menuPageTranslateX.stopAnimation();
    };
  }, [isMenuOpen, menuPage, menuPageOpacity, menuPageTranslateX]);
  const selectTheme = (nextThemeKey) => {
    if (nextThemeKey === themeKey || !THEME_KEYS.includes(nextThemeKey)) return;
    setThemeKey(nextThemeKey);
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    Notifications.setNotificationChannelAsync('note-notifications', {
      name: 'Уведомления заметок',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    }).catch(() => {});
    Notifications.setNotificationChannelAsync('note-alarms', {
      name: 'Будильники заметок',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
      audioAttributes: {
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        usage: Notifications.AndroidAudioUsage.ALARM,
      },
    }).catch(() => {});
    return undefined;
  }, []);

  useEffect(() => {
    if (!supportsNotifications) return undefined;
    const clearTriggeredReminder = (notificationId) => {
      setNotes((currentNotes) => currentNotes.map((note) => (
        note.notificationId === notificationId
          ? { ...note, reminderAt: null, reminderMode: null, notificationId: null }
          : note
      )));
    };
    const handleNotificationResponse = (response) => {
      const noteId = response?.notification?.request?.content?.data?.noteId;
      if (typeof noteId === 'string') setPendingNotificationNoteId(noteId);
    };
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      clearTriggeredReminder(notification.request.identifier);
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      clearTriggeredReminder(response.notification.request.identifier);
      handleNotificationResponse(response);
    });
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleNotificationResponse(response);
      })
      .catch(() => {});
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !supportsNotifications) return undefined;
    let isActive = true;
    Notifications.getAllScheduledNotificationsAsync()
      .then((scheduledNotifications) => {
        if (!isActive) return;
        const scheduledIds = new Set(scheduledNotifications.map((notification) => notification.identifier));
        const now = Date.now();
        setNotes((currentNotes) => currentNotes.map((note) => (
          note.notificationId && note.reminderAt && (new Date(note.reminderAt).getTime() <= now || !scheduledIds.has(note.notificationId))
            ? { ...note, reminderAt: null, reminderMode: null, notificationId: null }
            : note
        )));
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !pendingNotificationNoteId) return undefined;
    const note = notes.find((item) => item.id === pendingNotificationNoteId);
    if (!note) return undefined;
    setSelectedId(note.id);
    setEditingField(null);
    setEditorOpen(true);
    setPendingNotificationNoteId(null);
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
    return undefined;
  }, [isLoaded, notes, pendingNotificationNoteId]);

  useEffect(() => {
    let isActive = true;

    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(ACCENT_KEY),
      AsyncStorage.getItem(LANGUAGE_KEY),
    ])
      .then(([storedData, storedTheme, storedAccent, storedLanguage]) => {
        if (!isActive) return;
        setInitialSetupOpen(!THEME_KEYS.includes(storedTheme) || !LANGUAGE_KEYS.includes(storedLanguage));
        if (THEME_KEYS.includes(storedTheme)) setThemeKey(storedTheme);
        if (storedAccent && isHexColor(storedAccent)) {
          const normalizedAccent = storedAccent.toUpperCase();
          setAccentColor(normalizedAccent);
          setAccentDraft(normalizedAccent);
        }
        if (LANGUAGE_KEYS.includes(storedLanguage)) setLanguageKey(storedLanguage);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const savedNotes = Array.isArray(parsedData) ? parsedData : parsedData?.notes;
          const savedFolders = Array.isArray(parsedData) ? starterFolders : parsedData?.folders;
          if (!Array.isArray(savedNotes) || !Array.isArray(savedFolders)) {
            throw new Error('Invalid saved notebook structure');
          }
          const normalizedFolders = savedFolders.map((folder) => ({ ...folder, parentId: folder.parentId ?? null }));
          const folderIds = new Set(normalizedFolders.map((folder) => folder.id));
          if (Array.isArray(savedNotes) && savedNotes.length > 0) {
            const migratedNotes = savedNotes
              .map((note) => ({
                ...note,
                folderId: note.folderId === undefined ? DEFAULT_FOLDER_ID : note.folderId,
                imageAttachments: Array.isArray(note.imageAttachments)
                  ? note.imageAttachments
                  : note.imageAttachment ? [note.imageAttachment] : [],
                imageAttachment: undefined,
              }))
              .filter((note) => note.folderId === null || folderIds.has(note.folderId));
            setNotes(migratedNotes);
            setSelectedId(migratedNotes[0]?.id || null);
          }
          if (normalizedFolders.length > 0) {
            setFolders(normalizedFolders);
          }
        }
      })
      .catch(() => {
        if (isActive) setLoadFailed(true);
      })
      .finally(() => {
        if (isActive) setLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || loadFailed || isInitialSetupOpen) return undefined;
    const debounceId = setTimeout(() => {
      const snapshot = [
        [STORAGE_KEY, JSON.stringify({ folders, notes })],
        [THEME_KEY, themeKey],
        [ACCENT_KEY, accentColor],
        [LANGUAGE_KEY, languageKey],
      ];
      storageWriteRef.current = storageWriteRef.current
        .catch(() => {})
        .then(() => AsyncStorage.multiSet(snapshot))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(debounceId);
  }, [accentColor, folders, isInitialSetupOpen, isLoaded, languageKey, loadFailed, notes, storageWriteRef, themeKey]);

  const selectedNote = notes.find((note) => note.id === selectedId) || notes[0];
  const currentFolder = folders.find((folder) => folder.id === currentFolderId);
  const currentFolderNotes = notes.filter((note) => note.folderId === currentFolderId);
  const currentSubfolders = folders.filter((folder) => folder.parentId === currentFolderId);
  const pinnedNotes = currentFolderNotes.filter((note) => note.isPinned);
  const unpinnedNotes = currentFolderNotes.filter((note) => !note.isPinned);
  const currentItems = [
    ...pinnedNotes.map((note) => ({ ...note, itemType: 'note' })),
    ...currentSubfolders.map((folder) => ({ ...folder, itemType: 'folder' })),
    ...unpinnedNotes.map((note) => ({ ...note, itemType: 'note' })),
  ];
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchingNotes = normalizedQuery
      ? notes.filter((note) => !deletingIds.has(note.id) && `${note.title} ${note.body}`.toLowerCase().includes(normalizedQuery))
      : notes.filter((note) => !deletingIds.has(note.id));
    return [...matchingNotes].sort((left, right) => Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned)));
  }, [deletingIds, notes, query]);

  const updateSelectedNote = (field, value) => {
    setNotes((currentNotes) => currentNotes.map((note) => (
      note.id === selectedId ? { ...note, [field]: value, isDraft: false, updatedAt: formatDate(new Date()) } : note
    )));
  };

  const createNote = () => {
    const note = makeNote(currentFolderId);
    setNotes((currentNotes) => [note, ...currentNotes]);
    setSelectedId(note.id);
    setEditingField(null);
    setEditorOpen(true);
  };

  const createFolder = () => {
    const cleanName = folderName.trim();
    if (!cleanName) return;
    const folder = makeFolder(cleanName, currentFolderId);
    setFolders((currentFolders) => [...currentFolders, folder]);
    setFolderName('');
    setFolderModalOpen(false);
  };

  const deleteItem = (item) => {
    if (deletingIds.size > 0) return;
    closeActionMenu(() => {
      const deletedIds = new Set([item.id]);
      if (item.itemType === 'folder') {
        let foundChild = true;
        while (foundChild) {
          foundChild = false;
          folders.forEach((folder) => {
            if (deletedIds.has(folder.parentId) && !deletedIds.has(folder.id)) {
              deletedIds.add(folder.id);
              foundChild = true;
            }
          });
        }
      }
      setDeletingIds(deletedIds);
      offerUndo({ notes, folders, selectedId, currentFolderId, deletedTitle: item.itemType === 'note' ? item.title || text.untitled : item.name });
      if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
      if (item.itemType === 'note') {
        setNotes((currentNotes) => currentNotes.filter((note) => note.id !== item.id));
      } else {
        setFolders((currentFolders) => currentFolders.filter((folder) => !deletedIds.has(folder.id)));
        setNotes((currentNotes) => currentNotes.filter((note) => !deletedIds.has(note.folderId)));
        if (currentFolderId && deletedIds.has(currentFolderId)) setCurrentFolderId(null);
      }
      setDeletingIds(new Set());
      deletionTimerRef.current = null;
      return;
    });
  };

  const closeActionMenu = (afterClose) => {
    const callback = typeof afterClose === 'function' ? afterClose : null;
    if (!actionItem) {
      callback?.();
      return;
    }
    actionReveal.stopAnimation();
    Animated.timing(actionReveal, { duration: 120, isInteraction: false, toValue: 0, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      setActionItem(null);
      callback?.();
    });
  };

  const openMovePicker = (item) => {
    closeActionMenu(() => setMoveItem(item));
  };

  const openHighlightPicker = (item) => {
    closeActionMenu(() => setHighlightItem(item));
  };

  const togglePinItem = (item) => {
    if (item.itemType !== 'note') return;
    closeActionMenu(() => {
      setNotes((currentNotes) => currentNotes.map((note) => (
        note.id === item.id ? { ...note, isPinned: !note.isPinned } : note
      )));
    });
  };

  const setNoteHighlight = (color) => {
    if (!highlightItem) return;
    setNotes((currentNotes) => currentNotes.map((note) => (
      note.id === highlightItem.id ? { ...note, highlightColor: color } : note
    )));
    setHighlightItem(null);
  };

  const moveItemToFolder = (folderId) => {
    if (!moveItem) return;
    const targetFolderId = folderId === ROOT_MOVE_TARGET_ID ? null : folderId;
    if (moveItem.itemType === 'note') {
      setNotes((currentNotes) => currentNotes.map((note) => (
        note.id === moveItem.id ? { ...note, folderId: targetFolderId } : note
      )));
    } else {
      setFolders((currentFolders) => currentFolders.map((folder) => (
        folder.id === moveItem.id ? { ...folder, parentId: targetFolderId } : folder
      )));
    }
    setMoveItem(null);
  };

  const moveTargets = useMemo(() => {
    if (!moveItem) return [];
    if (moveItem.itemType === 'note') return [{ id: ROOT_MOVE_TARGET_ID, name: text.root, itemType: 'root' }, ...folders];
    const excludedIds = new Set([moveItem.id]);
    let foundChild = true;
    while (foundChild) {
      foundChild = false;
      folders.forEach((folder) => {
        if (excludedIds.has(folder.parentId) && !excludedIds.has(folder.id)) {
          excludedIds.add(folder.id);
          foundChild = true;
        }
      });
    }
    return [{ id: ROOT_MOVE_TARGET_ID, name: text.root, itemType: 'root' }, ...folders.filter((folder) => !excludedIds.has(folder.id))];
  }, [folders, moveItem, text.root]);

  const openCreateMenu = () => {
    setCreateMenuOpen(true);
  };

  const openMainMenu = () => {
    setMenuOpen(true);
    setMenuPage('menu');
  };

  const openSettingsFromMenu = () => setMenuPage('settings');
  const openAboutFromMenu = () => setMenuPage('about');
  const openHelpFromMenu = () => setMenuPage('help');
  const openPrivacyFromMenu = () => setMenuPage('privacy');

  const goBackInMenu = () => {
    if (menuPage === 'language' || menuPage === 'theme') setMenuPage('settings');
    else if (menuPage === 'settings' || menuPage === 'about' || menuPage === 'help' || menuPage === 'privacy') setMenuPage('menu');
    else setMenuOpen(false);
  };

  const scheduleCreateAction = (action) => {
    action();
  };

  const chooseCreateFolder = () => {
    setCreateMenuOpen(false);
    scheduleCreateAction(() => setFolderModalOpen(true));
  };

  const chooseCreateNote = () => {
    setCreateMenuOpen(false);
    scheduleCreateAction(createNote);
  };

  const openFolder = (folderId) => {
    closeActionMenu(() => {
      folderOpacity.stopAnimation();
      folderTranslateX.stopAnimation();
      Animated.parallel([
        Animated.timing(folderOpacity, { duration: 120, isInteraction: false, toValue: 0, useNativeDriver: true }),
        Animated.timing(folderTranslateX, { duration: 120, isInteraction: false, toValue: -8, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setCurrentFolderId(folderId);
        folderTranslateX.setValue(12);
        Animated.parallel([
          Animated.timing(folderOpacity, { duration: 180, isInteraction: false, toValue: 1, useNativeDriver: true }),
          Animated.timing(folderTranslateX, { duration: 180, isInteraction: false, toValue: 0, useNativeDriver: true }),
        ]).start();
      });
    });
  };

  const closeFolder = () => {
    const parentFolderId = currentFolder?.parentId ?? null;
    folderOpacity.stopAnimation();
    folderTranslateX.stopAnimation();
    Animated.parallel([
      Animated.timing(folderOpacity, { duration: 120, isInteraction: false, toValue: 0, useNativeDriver: true }),
      Animated.timing(folderTranslateX, { duration: 120, isInteraction: false, toValue: 8, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setCurrentFolderId(parentFolderId);
      folderTranslateX.setValue(-12);
      Animated.parallel([
        Animated.timing(folderOpacity, { duration: 180, isInteraction: false, toValue: 1, useNativeDriver: true }),
        Animated.timing(folderTranslateX, { duration: 180, isInteraction: false, toValue: 0, useNativeDriver: true }),
      ]).start();
    });
  };

  const openNote = (noteId) => {
    const open = () => {
      setSelectedId(noteId);
      setEditingField(null);
      setEditorOpen(true);
    };
    closeActionMenu(open);
  };

  const openReminder = () => {
    if (!selectedNote) return;
    setReminderDate(selectedNote.reminderAt ? new Date(selectedNote.reminderAt) : new Date(Date.now() + 60 * 60 * 1000));
    setReminderOpen(true);
  };

  const onReminderDateChange = (event, value) => {
    if (Platform.OS !== 'ios') setShowReminderPicker(false);
    if (event.type !== 'dismissed' && value) setReminderDate(value);
  };

  const saveReminder = async () => {
    if (!supportsNotifications) return;
    if (isSavingReminder) return;
    if (!selectedNote || reminderDate.getTime() <= Date.now()) {
      Alert.alert(text.reminder, text.invalidReminderDate);
      return;
    }
    setSavingReminder(true);
    let permission;
    try {
      permission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });
    } catch {
      setSavingReminder(false);
      Alert.alert(text.reminder, text.permissionRequired);
      return;
    }
    const allowed = permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!allowed) {
      setSavingReminder(false);
      Alert.alert(text.reminder, text.permissionRequired);
      return;
    }
    if (selectedNote.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(selectedNote.notificationId).catch(() => {});
    }
    const channelId = 'note-notifications';
    let notificationId;
    try {
      const notificationContent = {
        title: selectedNote.title || text.untitled,
        body: selectedNote.body || text.emptyNote,
        data: { noteId: selectedNote.id },
        sound: 'default',
        ...(Platform.OS === 'ios' ? {
          interruptionLevel: 'active',
        } : {
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        }),
      };
      const notificationTrigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        ...(Platform.OS === 'android' ? { channelId } : {}),
      };
      notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: notificationTrigger,
      });
    } catch {
      setSavingReminder(false);
      Alert.alert(text.reminder, text.permissionRequired);
      return;
    }
    setNotes((currentNotes) => currentNotes.map((note) => (
      note.id === selectedNote.id
        ? { ...note, reminderAt: reminderDate.toISOString(), reminderMode: 'notification', notificationId }
        : note
    )));
    setSavingReminder(false);
    closeReminder();
  };

  const removeReminder = async () => {
    if (!supportsNotifications) return;
    if (!selectedNote) return;
    if (selectedNote.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(selectedNote.notificationId).catch(() => {});
    }
    setNotes((currentNotes) => currentNotes.map((note) => (
      note.id === selectedNote.id
        ? { ...note, reminderAt: null, reminderMode: null, notificationId: null }
        : note
    )));
    closeReminder();
  };

  const closeEditor = () => {
    if (selectedNote?.isDraft && !selectedNote.title.trim() && !selectedNote.body.trim() && !(selectedNote.imageAttachments?.length || selectedNote.imageAttachment)) {
      if (selectedNote.notificationId && supportsNotifications) {
        Notifications.cancelScheduledNotificationAsync(selectedNote.notificationId).catch(() => {});
      }
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== selectedNote.id));
      setSelectedId(null);
    }
    setEditingField(null);
    setSwitchingFromSearch(false);
    setShowReminderPicker(false);
    setReminderOpen(false);
    setEditorOpen(false);
  };

  const closeReminder = () => {
    if (!isReminderOpen || reminderClosingRef.current) return;
    reminderClosingRef.current = true;
    setShowReminderPicker(false);
    Animated.parallel([
      Animated.timing(reminderOverlayOpacity, { duration: 150, isInteraction: false, toValue: 0, useNativeDriver: true }),
      Animated.timing(reminderCardScale, { duration: 150, isInteraction: false, toValue: 0.94, useNativeDriver: true }),
      Animated.timing(reminderCardTranslateY, { duration: 150, isInteraction: false, toValue: 12, useNativeDriver: true }),
    ]).start(({ finished }) => {
      reminderClosingRef.current = false;
      if (finished) setReminderOpen(false);
    });
  };

  const openNoteFromSearch = (noteId) => {
    setSearchOpen(false);
    openNote(noteId);
  };

  const enableEditing = (field, inputRef) => {
    setEditingField(field);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const pickNotePhoto = async () => {
    if (!selectedNote) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: true,
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      const attachments = await Promise.all(result.assets.map(async (asset, index) => {
        const extension = asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';
        const destination = `${FileSystem.documentDirectory}note-${selectedNote.id}-${Date.now()}-${index}.${extension}`;
        await FileSystem.copyAsync({ from: asset.uri, to: destination });
        const sourceWidth = asset.width || 320;
        const sourceHeight = asset.height || 240;
        const scale = Math.min(1, 320 / sourceWidth, 420 / sourceHeight);
        return { height: Math.round(sourceHeight * scale), uri: destination, width: Math.round(sourceWidth * scale) };
      }));
      const existingAttachments = selectedNote.imageAttachments || (selectedNote.imageAttachment ? [selectedNote.imageAttachment] : []);
      updateSelectedNote('imageAttachments', [...existingAttachments, ...attachments]);
    } catch {
      Alert.alert(text.attachPhoto, text.attachPhotoError);
    }
  };

  const removeNotePhoto = (attachment) => {
    if (!attachment) return;
    const uri = attachment.uri;
    if (uri?.startsWith(FileSystem.documentDirectory || '__')) {
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
    const remainingAttachments = (selectedNote.imageAttachments || []).filter((item) => item.uri !== uri);
    updateSelectedNote('imageAttachments', remainingAttachments);
  };

  const downloadNotePhoto = async (attachment) => {
    const uri = attachment?.uri;
    if (!uri || Platform.OS === 'web') return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (!permission.granted && permission.status !== 'granted') {
        Alert.alert(text.downloadPhoto, text.photoPermissionRequired);
        return;
      }
      await MediaAsset.create(uri);
      Alert.alert(text.downloadPhoto, text.photoSaved);
    } catch {
      Alert.alert(text.downloadPhoto, text.invalidBackup);
    }
  };

  const deleteSelectedNote = () => {
    if (!selectedNote || deletingIds.size > 0) return;
    if (selectedNote.notificationId) {
      Notifications.cancelScheduledNotificationAsync(selectedNote.notificationId).catch(() => {});
    }
    const remainingNotes = notes.filter((note) => note.id !== selectedNote.id);
    const nextNote = remainingNotes[0];
    offerUndo({ notes, folders, selectedId, currentFolderId, deletedTitle: selectedNote.title || text.untitled });
    setDeletingIds(new Set([selectedNote.id]));
    setSelectedId(nextNote?.id || null);
    closeEditor();
    if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== selectedNote.id));
    setDeletingIds(new Set());
    deletionTimerRef.current = null;
  };

  const confirmDeleteSelectedNote = () => {
    if (!selectedNote) return;
    Alert.alert(text.delete, text.confirmDelete, [
      { text: text.cancel, style: 'cancel' },
      { text: text.delete, onPress: deleteSelectedNote, style: 'destructive' },
    ]);
  };

  const shareSelectedNote = async () => {
    if (!selectedNote) return;
    await Share.share({
      message: `${selectedNote.title || text.untitled}\n\n${selectedNote.body || text.emptyNote}`,
      title: selectedNote.title || text.untitled,
    });
  };

  const exportData = async () => {
    try {
      const notesWithImages = await Promise.all(notes.map(async (note) => ({
        ...note,
        imageAttachments: await Promise.all((note.imageAttachments || (note.imageAttachment ? [note.imageAttachment] : [])).map(serializeAttachment)),
        imageAttachment: undefined,
      })));
      const backup = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), folders, notes: notesWithImages }, null, 2);
      const uri = `${FileSystem.cacheDirectory}notebook-backup.json`;
      await FileSystem.writeAsStringAsync(uri, backup, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: text.exportData, UTI: 'public.json' });
      } else {
        await Share.share({ message: backup, title: text.exportData });
      }
    } catch {
      Alert.alert(text.exportData, text.invalidBackup);
    }
  };

  const applyImportedBackup = async (parsedBackup) => {
    try {
      const importedFolders = parsedBackup.folders.map((folder) => ({ ...folder, parentId: folder.parentId ?? null }));
      const importedNotes = await Promise.all(parsedBackup.notes.map(async (note) => {
        const attachments = Array.isArray(note.imageAttachments)
          ? note.imageAttachments
          : note.imageAttachment ? [note.imageAttachment] : [];
        return {
          ...note,
          folderId: note.folderId === undefined ? DEFAULT_FOLDER_ID : note.folderId,
          imageAttachments: await Promise.all(attachments.map((attachment, index) => restoreAttachment(attachment, note.id, index))),
          imageAttachment: undefined,
        };
      }));
      setFolders(importedFolders.length > 0 ? importedFolders : starterFolders);
      setNotes(importedNotes);
      setSelectedId(importedNotes[0]?.id || null);
      setCurrentFolderId(null);
    } catch {
      Alert.alert(text.importData, text.invalidBackup);
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'application/json' });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const rawBackup = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const parsedBackup = JSON.parse(rawBackup);
      if (!Array.isArray(parsedBackup?.notes) || !Array.isArray(parsedBackup?.folders)) throw new Error('Invalid backup');
      Alert.alert(text.importData, text.confirmImportMessage, [
        { text: text.cancel, style: 'cancel' },
        { text: text.importData, onPress: () => applyImportedBackup(parsedBackup), style: 'destructive' },
      ]);
    } catch {
      Alert.alert(text.importData, text.invalidBackup);
    }
  };

  const renderItemActions = (item) => actionItem?.id === item.id ? (
    <Animated.View style={[styles.itemActions, { backgroundColor: theme.mutedSurface, borderColor: theme.border, opacity: actionReveal, transform: [{ translateY: actionReveal.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}> 
      {item.itemType === 'note' ? (
        <Pressable accessibilityLabel={text.highlight} accessibilityRole="button" onPress={() => openHighlightPicker(item)} style={styles.itemActionButton}>
          <HighlightIcon color={theme.text} />
        </Pressable>
      ) : null}
      {item.itemType === 'note' ? (
        <Pressable accessibilityLabel={item.isPinned ? text.unpin : text.pin} accessibilityRole="button" onPress={() => togglePinItem(item)} style={styles.itemActionButton}>
          <PinIcon color={theme.text} size={23} />
        </Pressable>
      ) : null}
      <Pressable accessibilityLabel={text.move} accessibilityRole="button" onPress={() => openMovePicker(item)} style={styles.itemActionButton}>
        <MoveIcon color={theme.text} />
      </Pressable>
      <Pressable accessibilityLabel={text.delete} accessibilityRole="button" onPress={() => deleteItem(item)} style={[styles.itemActionButton, styles.itemDeleteAction]}>
        <TrashIcon color={theme.danger} size={26} />
      </Pressable>
    </Animated.View>
  ) : null;

  const handlePressIn = (item, event) => {
    const { locationX, locationY } = event.nativeEvent;
    pressStateRef.current.set(item.id, { locationX, locationY, cancelled: false });
  };

  const handlePressMove = (item, event) => {
    const start = pressStateRef.current.get(item.id);
    if (!start || start.cancelled) return;
    const { locationX, locationY } = event.nativeEvent;
    if (Math.abs(locationX - start.locationX) > 12 || Math.abs(locationY - start.locationY) > 12) {
      start.cancelled = true;
      if (actionItem?.id === item.id) closeActionMenu();
    }
  };

  const handlePressOut = (item) => {
    pressStateRef.current.delete(item.id);
  };

  const handleLongPress = (item) => {
    if (deletingIds.size > 0) return;
    const state = pressStateRef.current.get(item.id);
    if (state?.cancelled) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(35);
    }
    const showActionMenu = () => {
      setActionItem(item);
    };
    if (actionItem && actionItem.id !== item.id) closeActionMenu(showActionMenu);
    else showActionMenu();
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar style={resolvedThemeKey === 'dark' ? 'light' : 'dark'} />
      <Animated.View style={[styles.mainContent, { opacity: isSwitchingFromSearch ? 0 : folderOpacity, transform: [{ translateX: folderTranslateX }] }]}> 
        <View style={styles.header}>
          <View>
            {currentFolderId ? (
              <Pressable onPress={closeFolder} style={styles.backButton}>
                <Text style={[styles.backButtonText, { color: theme.secondaryText }]}>{text.back}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel={text.createNew} onPress={openCreateMenu} style={[styles.addButton, { backgroundColor: theme.accent }]}>
              <Text style={[styles.addButtonText, { color: theme.accentText }]}>+</Text>
            </Pressable>
            <Pressable accessibilityLabel={text.openSearch} onPress={() => setSearchOpen(true)} style={[styles.iconButton, { backgroundColor: theme.mutedSurface }]}> 
              <Text style={[styles.searchButtonText, { color: theme.text }]}>⌕</Text>
            </Pressable>
            <Pressable accessibilityLabel={text.openMenu} onPress={openMainMenu} style={[styles.iconButton, { backgroundColor: theme.mutedSurface }]}> 
              <Text style={[styles.iconButtonText, { color: theme.text }]}>☰</Text>
            </Pressable>
          </View>
        </View>

        {currentFolderId ? (
          <View style={[styles.listHeader, styles.folderListHeader]}>
            <Text style={[styles.sectionLabel, { color: theme.secondaryText }]}>{currentFolder.name}</Text>
            <Text style={[styles.countLabel, { backgroundColor: theme.mutedSurface, color: theme.secondaryText }]}>{currentItems.length}</Text>
          </View>
        ) : null}

        <Pressable onPress={() => closeActionMenu()} style={styles.listViewport}>
          <FlatList
            contentContainerStyle={[styles.listContent, currentFolderId && styles.folderListContent]}
            data={currentItems}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.secondaryText }]}>{text.empty}</Text>}
            renderItem={({ item, index }) => (
              <AnimatedListCard
                deleting={deletingIds.has(item.id)}
                index={index}
              >
              <View style={styles.itemWithActions}>
                {item.itemType === 'note' ? (
                  <Pressable
                    accessibilityLabel={`${item.title || text.untitled}. ${item.isPinned ? text.pin : ''} ${item.reminderAt ? text.reminder : ''}`.trim()}
                    accessibilityRole="button"
                    delayLongPress={400}
                    onLongPress={() => handleLongPress(item)}
                    onPress={() => openNote(item.id)}
                    onPressIn={(event) => handlePressIn(item, event)}
                    onPressMove={(event) => handlePressMove(item, event)}
                    onPressOut={() => handlePressOut(item)}
                    style={({ pressed }) => [styles.noteCard, { backgroundColor: item.highlightColor || theme.surface, borderColor: item.id === selectedId ? theme.accent : theme.border, borderWidth: item.id === selectedId ? 2 : 1, padding: item.id === selectedId ? 11 : 12 }, pressed && styles.longPressCard]}
                  >
                    <View style={styles.noteCardTopline}>
                      <View style={styles.noteCardMain}>
                        <Text numberOfLines={1} style={[styles.noteTitle, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.text }]}>{item.title || text.untitled}</Text>
                        <Text numberOfLines={1} style={[styles.notePreview, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.secondaryText }]}>{item.body || text.emptyNote}</Text>
                      </View>
                      <View style={styles.noteMeta}>
                        <View style={styles.noteMetaLine}>
                          <View style={styles.noteStatusRow}>
                            {item.isPinned ? <PinIcon color={item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.accent} /> : null}
                            {item.reminderAt ? <BellIcon color={item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.accent} size={15} /> : null}
                          </View>
                          <Text style={[styles.noteDate, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.secondaryText }]}>{item.updatedAt}</Text>
                        </View>
                        {(item.imageAttachments?.[0] || item.imageAttachment) ? <Image source={{ uri: (item.imageAttachments?.[0] || item.imageAttachment).uri }} style={styles.noteCardThumbnail} /> : null}
                      </View>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={item.name}
                    accessibilityRole="button"
                    delayLongPress={400}
                    onLongPress={() => handleLongPress(item)}
                    onPress={() => openFolder(item.id)}
                    onPressIn={(event) => handlePressIn(item, event)}
                    onPressMove={(event) => handlePressMove(item, event)}
                    onPressOut={() => handlePressOut(item)}
                    style={({ pressed }) => [styles.folderCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.longPressCard]}
                  >
                    <View style={styles.folderIcon}>
                      <FolderIcon color={theme.accent} />
                    </View>
                    <View style={styles.folderInfo}>
                      <Text style={[styles.folderName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[styles.folderCount, { color: theme.secondaryText }]}>{folders.filter((folder) => folder.parentId === item.id).length + notes.filter((note) => note.folderId === item.id).length} {text.elements}</Text>
                    </View>
                    <Text style={[styles.folderArrow, { color: theme.secondaryText }]}>›</Text>
                  </Pressable>
                )}
                {renderItemActions(item)}
              </View>
              </AnimatedListCard>
            )}
            showsVerticalScrollIndicator={false}
          />
          <LinearGradient
            colors={[theme.fade, theme.fadeTransparent]}
            pointerEvents="none"
            style={styles.topFade}
          />
          <LinearGradient
            colors={[theme.fadeTransparent, theme.fade]}
            pointerEvents="none"
            style={styles.bottomFade}
          />
        </Pressable>
      </Animated.View>

      {undoState ? (
        <UndoToast closing={undoState.closing} itemName={undoState.deletedTitle} onDismiss={() => setUndoState(null)} onUndo={undoDelete} secondsLeft={undoState.secondsLeft} text={text} theme={theme} />
      ) : null}

      {menuPage ? (
        <Modal
          animationType="slide"
          onDismiss={() => setMenuPage(null)}
          onRequestClose={() => setMenuOpen(false)}
          visible={isMenuOpen}
        >
        <View style={[styles.menuPageOverlay, { backgroundColor: theme.background }]}> 
          <Animated.View style={[styles.menuPageAnimated, { opacity: menuPageOpacity, transform: [{ translateX: menuPageTranslateX }] }]}> 
          <View style={styles.settingsHeader}>
            <Pressable onPress={goBackInMenu} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.text }]}>{text.back}</Text>
            </Pressable>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>
              {menuPage === 'settings' ? text.settings : menuPage === 'about' ? text.about : menuPage === 'help' ? text.help : menuPage === 'privacy' ? text.privacyPolicy : menuPage === 'language' ? text.language : menuPage === 'theme' ? text.theme : text.menu}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          {menuPage === 'settings' ? (
            <View style={styles.settingsContent}>
              <AnimatedNotificationButton onPress={() => setMenuPage('language')} style={[styles.settingsOption, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{text.language}</Text>
                  <Text style={[styles.settingsOptionValue, { color: theme.secondaryText }]}>{LANGUAGE_NAMES[languageKey][languageKey]}</Text>
                </View>
                <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
              </AnimatedNotificationButton>
              <AnimatedNotificationButton onPress={() => setMenuPage('theme')} style={[styles.settingsOption, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <View>
                  <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{text.theme}</Text>
                  <Text style={[styles.settingsOptionValue, { color: theme.secondaryText }]}>{getThemeName(themeKey, languageKey)}</Text>
                </View>
                <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
              </AnimatedNotificationButton>
              <AnimatedNotificationButton accessibilityRole="button" onPress={exportData} style={[styles.settingsOption, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{text.exportData}</Text>
              </AnimatedNotificationButton>
              <AnimatedNotificationButton accessibilityRole="button" onPress={importData} style={[styles.settingsOption, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{text.importData}</Text>
              </AnimatedNotificationButton>
            </View>
          ) : menuPage === 'language' ? (
            <View style={styles.settingsContent}>
              {LANGUAGE_KEYS.map((key) => (
                <Pressable key={key} onPress={() => setLanguageKey(key)} style={[styles.settingsOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                  <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{LANGUAGE_NAMES[languageKey][key]}</Text>
                  <Text style={[styles.checkmark, { color: theme.text }]}>{languageKey === key ? '✓' : ''}</Text>
                </Pressable>
              ))}
            </View>
          ) : menuPage === 'theme' ? (
            <View style={styles.settingsContent}>
              {THEME_KEYS.map((key) => {
                const item = themes[key === 'auto' ? resolvedThemeKey : key];
                return (
                <Pressable key={key} onPress={() => selectTheme(key)} style={[styles.settingsOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                  <View style={[styles.themeSwatch, { backgroundColor: item.background, borderColor: item.border }]} />
                  <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{getThemeName(key, languageKey)}</Text>
                  <Text style={[styles.checkmark, { color: theme.text }]}>{themeKey === key ? '✓' : ''}</Text>
                </Pressable>
                );
              })}
              <Text style={[styles.settingsOptionValue, { color: theme.secondaryText }]}>{text.accentColor}</Text>
              <View style={styles.accentPicker}>
                {ACCENT_PRESETS[resolvedThemeKey].map((color) => (
                  <Animated.View key={color} style={{ transform: [{ scale: accentColor === color ? accentSelectionScale : 1 }] }}>
                    <Pressable
                      accessibilityLabel={`${text.accentColor} ${color}`}
                      onPress={() => selectAccentColor(color)}
                      style={[styles.accentSwatch, { backgroundColor: color, borderColor: accentColor === color ? getAccentBorderColor(color, resolvedThemeKey) : theme.border }]}
                    />
                  </Animated.View>
                ))}
              </View>
              <TextInput
                autoCapitalize="characters"
                keyboardAppearance={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
                maxLength={7}
                onChangeText={(value) => {
                  const normalizedValue = value.startsWith('#') ? value.toUpperCase() : `#${value.toUpperCase()}`;
                  setAccentDraft(normalizedValue);
                  if (isHexColor(normalizedValue)) setAccentColor(normalizedValue);
                }}
                placeholder="#RRGGBB"
                placeholderTextColor={theme.secondaryText}
                style={[styles.accentInput, { backgroundColor: theme.mutedSurface, color: theme.text }]}
                value={accentDraft}
              />
            </View>
          ) : menuPage === 'about' ? (
            <ScrollView contentContainerStyle={styles.infoPageContent} showsVerticalScrollIndicator={false} style={styles.menuPageScroll}>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>{text.aboutText}</Text>
              <Text style={[styles.infoVersion, { color: theme.secondaryText }]}>{languageKey === 'ru' ? 'Первая версия программы выпущена 19 сентября 2026 года.' : 'The first version of the app was released on September 19, 2026.'}</Text>
              <Text style={[styles.infoAuthor, { color: theme.text }]}>{text.aboutAuthor}</Text>
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://miroshnichenko.net/')}>
                <Text style={[styles.infoWebsite, { color: theme.accent }]}>{text.aboutWebsite}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => Linking.openURL(supportUrl)} style={[styles.supportButton, { backgroundColor: theme.accent }]}> 
                <Text style={[styles.supportButtonText, { color: theme.accentText }]}>{text.supportAuthor}</Text>
              </Pressable>
              <Text style={[styles.infoVersion, { color: theme.secondaryText }]}>{text.version} 1.0.0</Text>
            </ScrollView>
          ) : menuPage === 'help' ? (
            <ScrollView contentContainerStyle={styles.infoPageContent} showsVerticalScrollIndicator={false} style={styles.helpPageScroll}>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>{text.helpText}</Text>
            </ScrollView>
          ) : menuPage === 'privacy' ? (
            <ScrollView contentContainerStyle={styles.infoPageContent} showsVerticalScrollIndicator={false} style={styles.helpPageScroll}>
              <Text style={[styles.infoText, { color: theme.secondaryText }]}>{text.privacyPolicyText}</Text>
            </ScrollView>
          ) : (
          <View style={styles.menuPageContent}>
                <AnimatedNotificationButton onPress={openSettingsFromMenu} style={[styles.menuOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Text style={[styles.menuOptionText, { color: theme.text }]}>{text.settings}</Text>
              <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
                </AnimatedNotificationButton>
                <AnimatedNotificationButton onPress={openAboutFromMenu} style={[styles.menuOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Text style={[styles.menuOptionText, { color: theme.text }]}>{text.about}</Text>
              <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
                </AnimatedNotificationButton>
                <AnimatedNotificationButton onPress={openHelpFromMenu} style={[styles.menuOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Text style={[styles.menuOptionText, { color: theme.text }]}>{text.help}</Text>
              <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
                </AnimatedNotificationButton>
                <AnimatedNotificationButton onPress={openPrivacyFromMenu} style={[styles.menuOption, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Text style={[styles.menuOptionText, { color: theme.text }]}>{text.privacyPolicy}</Text>
              <Text style={[styles.menuOptionArrow, { color: theme.secondaryText }]}>›</Text>
                </AnimatedNotificationButton>
          </View>
          )}
          </Animated.View>
        </View>
        </Modal>
      ) : null}

      <CenterModal onClose={() => setCreateMenuOpen(false)} theme={theme} visible={isCreateMenuOpen}>
            <Text style={[styles.folderModalTitle, { color: theme.text }]}>{text.create}</Text>
            <Pressable onPress={chooseCreateFolder} style={[styles.createChoice, { borderColor: theme.border }]}>
              <FolderIcon color={theme.accent} />
              <Text style={[styles.createChoiceText, { color: theme.text }]}>{text.folder}</Text>
            </Pressable>
            <Pressable onPress={chooseCreateNote} style={[styles.createChoice, { borderColor: theme.border }]}>
              <PencilIcon color={theme.accent} />
              <Text style={[styles.createChoiceText, { color: theme.text }]}>{text.note}</Text>
            </Pressable>
      </CenterModal>

      <CenterModal onClose={() => setFolderModalOpen(false)} theme={theme} visible={isFolderModalOpen}>
            <Text style={[styles.folderModalTitle, { color: theme.text }]}>{text.newFolder}</Text>
            <TextInput
              autoFocus
              keyboardAppearance={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
              onChangeText={setFolderName}
              onSubmitEditing={createFolder}
              placeholder={text.folderName}
              placeholderTextColor={theme.secondaryText}
              style={[styles.folderInput, { backgroundColor: theme.mutedSurface, color: theme.text }]}
              value={folderName}
            />
            <Pressable onPress={createFolder} style={[styles.folderModalButton, { backgroundColor: theme.accent, borderRadius: 10, marginTop: 18 }]}>
              <Text style={[styles.closeButtonText, { color: theme.accentText }]}>{text.create}</Text>
            </Pressable>
      </CenterModal>

      <CenterModal onClose={() => setMoveItem(null)} theme={theme} visible={Boolean(moveItem)}>
        <Text style={[styles.folderModalTitle, { color: theme.text }]}>{text.moveToFolder}</Text>
        {moveTargets.length > 0 ? moveTargets.map((folder) => (
          <Pressable key={folder.id} onPress={() => moveItemToFolder(folder.id)} style={[styles.moveFolderChoice, { borderColor: theme.border }]}>
            <FolderIcon color={theme.accent} />
            <Text style={[styles.createChoiceText, { color: theme.text }]}>{folder.name}</Text>
          </Pressable>
        )) : (
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{text.noFolders}</Text>
        )}
      </CenterModal>

      <CenterModal onClose={() => setHighlightItem(null)} theme={theme} visible={Boolean(highlightItem)}>
        <Text style={[styles.folderModalTitle, { color: theme.text }]}>{text.highlight}</Text>
        <View style={styles.noteHighlightPicker}>
          {NOTE_HIGHLIGHT_COLORS.map((color) => (
            <Pressable
              key={color}
              accessibilityLabel={`${text.highlight} ${color}`}
              onPress={() => setNoteHighlight(color)}
              style={[styles.noteHighlightSwatch, { backgroundColor: color, borderColor: highlightItem?.highlightColor === color ? theme.text : theme.border }]}
            />
          ))}
        </View>
        <Pressable onPress={() => setNoteHighlight(null)} style={[styles.clearHighlightButton, { borderColor: theme.border }]}> 
          <Text style={[styles.createChoiceText, { color: theme.text }]}>{text.removeHighlight}</Text>
        </Pressable>
      </CenterModal>

      <SlideModal onClose={() => setSearchOpen(false)} theme={theme} visible={isSearchOpen}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.searchPageHeader}>
            <Pressable onPress={() => setSearchOpen(false)} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: theme.text }]}>{text.close}</Text>
            </Pressable>
            <Text style={[styles.settingsTitle, { color: theme.text }]}>{text.search}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.searchPageContent}>
            <View style={[styles.searchBox, { backgroundColor: theme.mutedSurface }]}>
              <Text style={[styles.searchIcon, { color: theme.secondaryText }]}>⌕</Text>
              <TextInput
                autoFocus
                keyboardAppearance={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
                onChangeText={setQuery}
                placeholder={text.search}
                placeholderTextColor={theme.secondaryText}
                style={[styles.searchInput, { color: theme.text }]}
                value={query}
              />
            </View>
            <FlatList
              contentContainerStyle={styles.searchResults}
              data={filteredNotes}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.secondaryText }]}>{text.nothingFound}</Text>}
              renderItem={({ item }) => (
                <Pressable
                    accessibilityLabel={`${item.title || text.untitled}. ${item.isPinned ? text.pin : ''} ${item.reminderAt ? text.reminder : ''}`.trim()}
                    accessibilityRole="button"
                  onPress={() => openNoteFromSearch(item.id)}
                  style={[styles.noteCard, { backgroundColor: item.highlightColor || theme.surface, borderColor: theme.border }]}
                >
                  <View style={styles.noteCardTopline}>
                    <View style={styles.noteCardMain}>
                      <Text numberOfLines={1} style={[styles.noteTitle, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.text }]}>{item.title || text.untitled}</Text>
                      <Text numberOfLines={1} style={[styles.notePreview, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.secondaryText }]}>{item.body || text.emptyNote}</Text>
                    </View>
                    <View style={styles.noteMeta}>
                      <View style={styles.noteMetaLine}>
                        <View style={styles.noteStatusRow}>
                          {item.isPinned ? <PinIcon color={item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.accent} /> : null}
                          {item.reminderAt ? <BellIcon color={item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.accent} size={15} /> : null}
                        </View>
                        <Text style={[styles.noteDate, { color: item.highlightColor ? getAccentTextColor(item.highlightColor) : theme.secondaryText }]}>{item.updatedAt}</Text>
                      </View>
                      {(item.imageAttachments?.[0] || item.imageAttachment) ? <Image source={{ uri: (item.imageAttachments?.[0] || item.imageAttachment).uri }} style={styles.noteCardThumbnail} /> : null}
                    </View>
                  </View>
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </SlideModal>

      <SlideModal onClose={closeEditor} theme={theme} visible={isEditorOpen}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editor}>
            <View style={styles.editorHeader}>
              <Pressable onPress={closeEditor} style={styles.backButton}>
                <Text style={[styles.backButtonText, { color: theme.secondaryText }]}>{text.back}</Text>
              </Pressable>
              <View style={styles.editorHeaderActions}>
                <AnimatedNotificationButton accessibilityLabel={text.reminder} onPress={openReminder} style={styles.reminderButton}>
                  <BellIcon color={selectedNote?.reminderAt ? theme.accent : theme.text} />
                </AnimatedNotificationButton>
                <AnimatedNotificationButton accessibilityLabel={text.attachPhoto} onPress={pickNotePhoto} style={styles.reminderButton}>
                  <PaperclipIcon color={theme.text} />
                </AnimatedNotificationButton>
                <AnimatedNotificationButton accessibilityLabel={text.share} onPress={shareSelectedNote} style={styles.deleteButton}>
                  <ShareIcon color={theme.text} />
                </AnimatedNotificationButton>
                <AnimatedNotificationButton accessibilityLabel={text.delete} onPress={confirmDeleteSelectedNote} style={styles.deleteButton}>
                  <TrashIcon color={theme.danger} />
                </AnimatedNotificationButton>
              </View>
            </View>
            {selectedNote ? (
              <ScrollView
                contentContainerStyle={styles.editorScrollContent}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => { Keyboard.dismiss(); setPhotoActionsDismissSignal((value) => value + 1); }}
                onTouchStart={() => setPhotoActionsDismissSignal((value) => value + 1)}
                showsVerticalScrollIndicator={false}
                style={styles.editorScroll}
              >
              <View style={styles.editorContent}>
                {editingField === 'title' ? (
                  <TextInput
                    autoFocus
                    keyboardAppearance={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
                    ref={titleInputRef}
                    onChangeText={(value) => updateSelectedNote('title', value)}
                    placeholder={text.titlePlaceholder}
                    placeholderTextColor={theme.secondaryText}
                    style={[styles.editorTitle, { color: theme.text }]}
                    value={selectedNote.title}
                  />
                ) : (
                  <Pressable onPress={() => enableEditing('title', titleInputRef)} style={styles.editorTitleTapTarget}>
                    <Text style={[styles.editorTitle, { color: theme.text }]}>{selectedNote.title || text.titlePlaceholder}</Text>
                  </Pressable>
                )}
                <Text style={[styles.editorDate, { color: theme.secondaryText }]}>{text.changed} {selectedNote.updatedAt.toUpperCase()}</Text>
                {(selectedNote.imageAttachments || (selectedNote.imageAttachment ? [selectedNote.imageAttachment] : [])).map((attachment, index) => (
                  <View key={attachment.uri} style={[styles.attachmentStage, { height: attachment.height, marginBottom: index === (selectedNote.imageAttachments?.length || 1) - 1 ? 0 : 16 }]}> 
                    <NoteImage
                      attachment={attachment}
                      dismissSignal={photoActionsDismissSignal}
                      onDownload={downloadNotePhoto}
                      onRemove={removeNotePhoto}
                      text={text}
                      theme={theme}
                    />
                  </View>
                ))}
                {editingField === 'body' ? (
                  <TextInput
                    autoFocus
                    keyboardAppearance={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
                    ref={bodyInputRef}
                    multiline
                    onChangeText={(value) => updateSelectedNote('body', value)}
                    placeholder={text.startWriting}
                    placeholderTextColor={theme.secondaryText}
                    scrollEnabled={false}
                    style={[styles.editorBody, { color: theme.text }]}
                    value={selectedNote.body}
                  />
                ) : (
                  <Pressable onPress={() => enableEditing('body', bodyInputRef)} style={styles.editorBodyTapTarget}>
                    <Text style={[styles.editorBody, { color: theme.text }]}>{selectedNote.body || text.startWriting}</Text>
                  </Pressable>
                )}
              </View>
              </ScrollView>
            ) : null}
          </KeyboardAvoidingView>
          {isReminderOpen ? (
            <Animated.View style={[styles.reminderOverlay, { opacity: reminderOverlayOpacity }]}> 
              <Pressable onPress={closeReminder} style={styles.reminderOverlayPressable}>
              <Animated.View onStartShouldSetResponder={() => true} style={[styles.reminderCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY: reminderCardTranslateY }, { scale: reminderCardScale }] }] }>
                <Text style={[styles.folderModalTitle, { color: theme.text }]}>{text.reminder}</Text>
                <View style={styles.reminderDateRow}>
                  <Pressable accessibilityLabel={text.date} accessibilityRole="button" onPress={() => { setReminderPickerMode('date'); setShowReminderPicker(true); }} style={[styles.reminderDateButton, { backgroundColor: theme.mutedSurface, borderColor: theme.border }]}> 
                    <Text style={[styles.reminderDateLabel, { color: theme.secondaryText }]}>{text.date}</Text>
                    <Text style={[styles.reminderDateValue, { color: theme.text }]}>{reminderDate.toLocaleDateString()}</Text>
                  </Pressable>
                  <Pressable accessibilityLabel={text.time} accessibilityRole="button" onPress={() => { setReminderPickerMode('time'); setShowReminderPicker(true); }} style={[styles.reminderDateButton, { backgroundColor: theme.mutedSurface, borderColor: theme.border }]}> 
                    <Text style={[styles.reminderDateLabel, { color: theme.secondaryText }]}>{text.time}</Text>
                    <Text style={[styles.reminderDateValue, { color: theme.text }]}>{reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                  </Pressable>
                </View>
                {showReminderPicker ? (
                  <DateTimePicker
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    is24Hour
                    mode={reminderPickerMode}
                    onChange={onReminderDateChange}
                    themeVariant={resolvedThemeKey === 'dark' ? 'dark' : 'light'}
                    value={reminderDate}
                  />
                ) : null}
                <Pressable disabled={isSavingReminder} onPress={saveReminder} style={[styles.folderModalButton, styles.reminderSaveButton, { backgroundColor: theme.accent, opacity: isSavingReminder ? 0.6 : 1 }]}> 
                  <Text style={[styles.closeButtonText, { color: theme.accentText }]}>{text.save}</Text>
                </Pressable>
                {selectedNote?.reminderAt ? (
                  <Pressable onPress={removeReminder} style={styles.removeReminderButton}>
                    <Text style={[styles.closeButtonText, { color: theme.danger }]}>{text.removeReminder}</Text>
                  </Pressable>
                ) : null}
              </Animated.View>
              </Pressable>
            </Animated.View>
          ) : null}
        </SafeAreaView>
      </SlideModal>

      <CenterModal
        onClose={() => setInitialSetupOpen(false)}
        theme={theme}
        visible={isInitialSetupOpen}
      >
        <ScrollView
          contentContainerStyle={styles.initialSetupContent}
          showsVerticalScrollIndicator={false}
          style={styles.initialSetupScroll}
        >
          <Text style={[styles.folderModalTitle, styles.initialSetupTitle, { color: theme.text }]}>{text.setupTitle}</Text>
          <Text style={[styles.settingsLabel, styles.initialSetupLabel, { color: theme.secondaryText }]}>{text.setupLanguage}</Text>
          {LANGUAGE_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setLanguageKey(key)}
              style={[styles.initialSetupOption, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.initialSetupOptionTitle, { color: theme.text }]}>{LANGUAGE_NAMES[languageKey][key]}</Text>
              <Text style={[styles.checkmark, styles.initialSetupCheckmark, { color: theme.text }]}>{languageKey === key ? '✓' : ''}</Text>
            </Pressable>
          ))}
          <Text style={[styles.settingsLabel, styles.initialSetupLabel, { color: theme.secondaryText }]}>{text.setupTheme}</Text>
          {THEME_KEYS.map((key) => {
            const themeOption = themes[key === 'auto' ? resolvedThemeKey : key];
            return (
              <Pressable
                key={key}
                onPress={() => selectTheme(key)}
                style={[styles.initialSetupOption, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.initialSetupThemeSwatch, { backgroundColor: themeOption.background, borderColor: themeOption.border }]} />
                <Text style={[styles.initialSetupOptionTitle, { color: theme.text }]}>{getThemeName(key, languageKey)}</Text>
                <Text style={[styles.checkmark, styles.initialSetupCheckmark, { color: theme.text }]}>{themeKey === key ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setInitialSetupOpen(false)} style={[styles.folderModalButton, styles.initialSetupContinue, { backgroundColor: theme.accent }]}> 
            <Text style={[styles.closeButtonText, { color: theme.accentText }]}>{text.continue}</Text>
          </Pressable>
        </ScrollView>
      </CenterModal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 13,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 24,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
  },
  backButton: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  iconButtonText: {
    fontSize: 19,
  },
  searchButtonText: {
    fontSize: 27,
    lineHeight: 28,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#D7E36D',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  addButtonText: {
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
  },
  searchBox: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 15,
  },
  searchPageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  searchPageContent: {
    flex: 1,
    paddingHorizontal: 13,
    paddingTop: 18,
  },
  searchResults: {
    gap: 12,
    paddingBottom: 40,
    paddingTop: 18,
  },
  searchIcon: {
    color: '#6E7068',
    fontSize: 27,
    marginRight: 9,
    marginTop: -4,
  },
  searchInput: {
    color: '#2D2E2A',
    flex: 1,
    fontSize: 15,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    paddingTop: 28,
  },
  folderListHeader: {
    marginTop: -18,
    paddingBottom: 4,
    paddingTop: 0,
  },
  sectionLabel: {
    color: '#787A71',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  countLabel: {
    backgroundColor: '#DDE0D3',
    borderRadius: 10,
    color: '#5D6152',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 23,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
    paddingBottom: 52,
    paddingTop: 8,
  },
  folderListContent: {
    paddingTop: 10,
  },
  listViewport: {
    flex: 1,
    position: 'relative',
  },
  topFade: {
    height: 24,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bottomFade: {
    bottom: 0,
    height: 24,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    height: 104,
    overflow: 'hidden',
    padding: 12,
  },
  noteCardThumbnail: {
    backgroundColor: '#ECEBE6',
    borderRadius: 7,
    height: 48,
    marginTop: 2,
    resizeMode: 'cover',
    width: 48,
  },
  longPressCard: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  folderCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  itemWithActions: {
    gap: 6,
  },
  itemActions: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6,
  },
  itemActionButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  itemDeleteAction: {
    backgroundColor: 'rgba(176, 78, 67, 0.12)',
  },
  itemActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  undoToast: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    bottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 20,
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: 'absolute',
    right: 20,
    zIndex: 40,
  },
  undoToastText: {
    fontSize: 15,
    fontWeight: '600',
  },
  undoToastInfo: {
    flex: 1,
    marginRight: 12,
  },
  undoToastTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  undoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  undoButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  moveFolderChoice: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  folderIcon: {
    fontSize: 23,
    marginRight: 14,
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 17,
    fontWeight: '700',
  },
  folderCount: {
    fontSize: 13,
    marginTop: 4,
  },
  folderArrow: {
    fontSize: 28,
    fontWeight: '300',
  },
  centerModalBackdrop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerModalShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  centerModalPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  centerModalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  initialSetupScroll: {
    maxHeight: 560,
  },
  initialSetupContent: {
    paddingBottom: 2,
  },
  initialSetupTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  initialSetupLabel: {
    marginBottom: 6,
    marginTop: 8,
  },
  initialSetupOption: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  initialSetupOptionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  initialSetupCheckmark: {
    fontSize: 18,
  },
  initialSetupThemeSwatch: {
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    marginRight: 10,
    width: 22,
  },
  initialSetupContinue: {
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
  },
  createChoice: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  createChoiceText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 14,
  },
  createCancelButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  folderModal: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  folderModalTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 16,
  },
  folderInput: {
    borderRadius: 10,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 14,
  },
  folderModalActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  folderModalButton: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteCardActive: {
    borderWidth: 2,
    padding: 16,
  },
  noteCardTopline: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteCardMain: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 72,
    paddingBottom: 4,
    paddingRight: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 10,
  },
  noteDate: {
    fontSize: 11,
  },
  noteMeta: {
    alignItems: 'flex-end',
    gap: 2,
    width: 78,
  },
  noteMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  noteStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    minHeight: 15,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    minHeight: 21,
  },
  emptyText: {
    fontSize: 15,
    paddingTop: 20,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  slideModal: {
    flex: 1,
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
    paddingHorizontal: 13,
  },
  editorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 22,
    paddingTop: 24,
  },
  editorHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  reminderOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 24,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  reminderOverlayPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  reminderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
  },
  reminderDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderDateButton: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  reminderDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reminderDateValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  reminderModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  reminderModeButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  reminderModeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reminderSaveButton: {
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 18,
  },
  removeReminderButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
    paddingVertical: 8,
  },
  reminderButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
    paddingVertical: 8,
    zIndex: 2,
  },
  editorContent: {
    paddingBottom: 80,
  },
  attachmentStage: {
    marginTop: 20,
    position: 'relative',
  },
  attachmentFrame: {
    position: 'relative',
  },
  attachmentImage: {
    borderRadius: 12,
    resizeMode: 'contain',
  },
  attachmentActions: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
    left: 10,
    position: 'absolute',
    right: 10,
    elevation: 20,
    zIndex: 20,
  },
  attachmentActionButton: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  attachmentActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoViewer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    flex: 1,
    justifyContent: 'center',
  },
  photoViewerImage: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
  attachmentRemove: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
  },
  attachmentRemoveText: {
    fontSize: 20,
    lineHeight: 22,
  },
  editorScroll: {
    flex: 1,
  },
  editorScrollContent: {
    paddingBottom: 24,
  },
  editorTitle: {
    fontSize: 31,
    fontWeight: '800',
    paddingVertical: 0,
  },
  editorTitleTapTarget: {
    minHeight: 42,
    justifyContent: 'center',
  },
  editorDate: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
  },
  editorBody: {
    fontSize: 17,
    lineHeight: 27,
    minHeight: 520,
    marginTop: 28,
    textAlignVertical: 'top',
  },
  editorBodyTapTarget: {
    minHeight: 520,
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingTop: 20,
    paddingHorizontal: 13,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 52,
  },
  settingsContent: {
    paddingHorizontal: 13,
    paddingTop: 10,
  },
  menuPageAnimated: {
    flex: 1,
  },
  menuOption: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  menuPageContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  menuPageOverlay: {
    bottom: 0,
    left: 0,
    paddingTop: 28,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  themeTransition: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
  infoPageContent: {
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 28,
  },
  menuPageScroll: {
    flex: 1,
  },
  helpPageScroll: {
    flex: 1,
  },
  aboutModalContent: {
    paddingBottom: 24,
  },
  aboutModalScroll: {
    maxHeight: 520,
  },
  helpModalContent: {
    paddingBottom: 4,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  menuOptionArrow: {
    fontSize: 26,
    fontWeight: '300',
  },
  settingsOption: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 64,
    paddingHorizontal: 16,
  },
  settingsOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  settingsOptionValue: {
    fontSize: 13,
    marginTop: 4,
  },
  accentPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  accentSwatch: {
    borderRadius: 14,
    borderWidth: 3,
    height: 34,
    width: 34,
  },
  accentInput: {
    borderRadius: 10,
    fontSize: 16,
    height: 48,
    paddingHorizontal: 14,
  },
  noteHighlightPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  noteHighlightSwatch: {
    borderRadius: 14,
    borderWidth: 3,
    height: 40,
    width: 40,
  },
  clearHighlightButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoAuthor: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
  },
  infoWebsite: {
    fontSize: 15,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  supportButton: {
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoVersion: {
    fontSize: 13,
    marginTop: 16,
  },
  settingsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  themeGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeOption: {
    alignItems: 'center',
    borderBottomColor: '#E2E1DB',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: 16,
  },
  themeSwatch: {
    borderRadius: 9,
    borderWidth: 1,
    height: 28,
    marginRight: 12,
    width: 28,
  },
  themeName: {
    flex: 1,
    fontSize: 16,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '800',
  },
});

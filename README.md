<div align="center">
  <img src="assets/notebook-icon-light.png" alt="Notebook app icon" width="104" />
  <h1>Notebook</h1>
  <p>A calm, simple place for your notes and ideas.</p>
  <p>
    <img src="https://img.shields.io/badge/Expo-SDK%2057-4630EB?logo=expo" alt="Expo SDK 57" />
    <img src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react" alt="React Native 0.86" />
    <img src="https://img.shields.io/badge/Languages-5-7B8A44" alt="Five interface languages" />
  </p>
  <p><a href="#english">English</a> · <a href="#русский">Русский</a></p>
</div>

## English

**Notebook** is a mobile notes app for organizing thoughts, photos, and reminders. The interface is available in English, Russian, Spanish, German, and Chinese.

### Features

- 🗂️ Create folders and nested folders to organize your notes
- 🔎 Search your notes
- 📌 Pin important notes, highlight them with color, and move them between folders
- 🖼️ Attach photos, save images, and share notes
- 🔔 Set reminders for your notes
- 🎨 Choose a light, dark, or system theme and customize the accent color
- 💾 Notes are saved automatically; export and import backups to move your data

### Data and privacy

No account is required. Notes, settings, and attached photos are stored on your device. The app does not sync data to a server. You can manually export a backup and import it on another device.

### Getting started

You will need Node.js and npm.

```bash
npm install
npx expo start
```

Run on a specific platform:

```bash
npm run android
npm run ios   # Requires macOS and Xcode
npm run web
```

The Android configuration in [app.json](./app.json) references `google-services.json`, which is not included in this repository. If your Android build requires it, provide your own local Firebase configuration and **do not commit it to Git**.

This project uses [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

### Project structure

```text
App.js                 Main app screen and logic
src/notebookData.js    Note data models, themes, and helpers
src/NotebookIcons.js   Vector interface icons
plugins/               Expo configuration plugins
assets/                App icons and other visual assets
```

### Before publishing

- Make sure the author name, website, and support links in the app are intended to be public, and that you have the rights to publish the source code and visual assets.
- This project is distributed under the [MIT License](./LICENSE).
- `private: true` in [package.json](./package.json) prevents publishing the package to npm; it does not prevent making the GitHub repository public.

## Русский

**Блокнот** — мобильное приложение для заметок, фотографий и напоминаний. Интерфейс доступен на русском, английском, испанском, немецком и китайском языках.

### Возможности

- 🗂️ Создание папок и вложенных папок для организации записей
- 🔎 Поиск по заметкам
- 📌 Закрепление важных записей, цветовая подсветка и перемещение между папками
- 🖼️ Фотографии во вложениях, сохранение изображений и обмен заметками
- 🔔 Напоминания о записях
- 🎨 Светлая, тёмная и системная темы, настройка акцентного цвета
- 💾 Автоматическое сохранение и перенос данных через резервную копию

### Данные и конфиденциальность

Регистрация не требуется: заметки, настройки и фотографии сохраняются на устройстве. Приложение не синхронизирует данные с сервером. Резервную копию можно вручную экспортировать и импортировать на другом устройстве.

### Запуск

Понадобятся Node.js и npm.

```bash
npm install
npx expo start
```

Для запуска на конкретной платформе:

```bash
npm run android
npm run ios   # Требуются macOS и Xcode
npm run web
```

Конфигурация Android в [app.json](./app.json) ссылается на `google-services.json`, которого нет в репозитории. Если он нужен для сборки Android, настройте собственный Firebase-конфиг локально и **не добавляйте его в Git**.

Проект использует [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

### Структура проекта

```text
App.js                 Основной экран и логика приложения
src/notebookData.js    Модели данных, темы и вспомогательные функции
src/NotebookIcons.js   Векторные иконки интерфейса
plugins/               Плагины конфигурации Expo
assets/                Иконки и графические ресурсы
```

### Перед публикацией

- Убедитесь, что имя автора, сайт и ссылки поддержки в приложении можно публиковать, а у вас есть права на исходный код и графические ресурсы.
- Проект распространяется по лицензии [MIT](./LICENSE).
- `private: true` в [package.json](./package.json) запрещает публикацию пакета в npm, но не мешает сделать репозиторий GitHub публичным.

import * as FileSystem from 'expo-file-system/legacy';

export const STORAGE_KEY = '@notebook/notes';
export const THEME_KEY = '@notebook/theme';
export const ACCENT_KEY = '@notebook/accent';
export const LANGUAGE_KEY = '@notebook/language';
export const DEFAULT_FOLDER_ID = 'default-folder';
export const ROOT_MOVE_TARGET_ID = '__root__';

export const ACCENT_PRESETS = {
  light: ['#C7D657', '#62B36F', '#62A8D8', '#D58A5C', '#C779A8', '#9B8BD4', '#000000'],
  dark: ['#C7D657', '#62B36F', '#62A8D8', '#D58A5C', '#C779A8', '#9B8BD4', '#FFFFFF'],
};

export const NOTE_HIGHLIGHT_COLORS = ['#FFF3A3', '#FFD6A5', '#BDE0FE', '#CDECCF', '#E7D6FF', '#F8C8DC'];

export const themes = {
  light: {
    name: 'Светлая',
    background: '#F7F6F2',
    fade: '#F7F6F2',
    fadeTransparent: 'rgba(247, 246, 242, 0)',
    surface: '#FFFFFF',
    mutedSurface: '#ECEBE6',
    text: '#252622',
    secondaryText: '#777970',
    border: '#E2E1DB',
    accent: '#C7D657',
    accentText: '#273000',
    danger: '#B04E43',
  },
  dark: {
    name: 'Тёмная',
    background: '#000000',
    fade: '#000000',
    fadeTransparent: 'rgba(0, 0, 0, 0)',
    surface: '#000000',
    mutedSurface: '#0D0D0D',
    text: '#FFFFFF',
    secondaryText: '#D9D9D9',
    border: '#FFFFFF',
    accent: '#FFFFFF',
    accentText: '#000000',
    danger: '#FFFFFF',
  },
};

export const starterFolders = [{
  id: DEFAULT_FOLDER_ID,
  name: 'Мои записи',
  parentId: null,
}];

export function isHexColor(value) {
  return /^#[0-9A-F]{6}$/i.test(value);
}

export function getAccentTextColor(value) {
  const red = parseInt(value.slice(1, 3), 16);
  const green = parseInt(value.slice(3, 5), 16);
  const blue = parseInt(value.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) > 150000 ? '#273000' : '#FFFFFF';
}

export function getThemeName(themeKey, languageKey) {
  const names = {
    ru: { auto: 'Авто', dark: 'Тёмная', light: 'Светлая' },
    en: { auto: 'System', dark: 'Dark', light: 'Light' },
    es: { auto: 'Sistema', dark: 'Oscuro', light: 'Claro' },
    de: { auto: 'System', dark: 'Dunkel', light: 'Hell' },
    zh: { auto: '跟随系统', dark: '深色', light: '浅色' },
  };
  return names[languageKey]?.[themeKey] || names.en[themeKey];
}

export function getAccentBorderColor(color, themeKey) {
  const themeTextColor = themes[themeKey].text;
  return color.toUpperCase() === themeTextColor.toUpperCase() ? getAccentTextColor(color) : themeTextColor;
}

export function makeNote(folderId) {
  return {
    id: String(Date.now()),
    folderId,
    title: '',
    body: '',
    imageAttachments: [],
    updatedAt: formatDate(new Date()),
    isDraft: true,
  };
}

export function makeFolder(name, parentId) {
  return {
    id: `folder-${Date.now()}`,
    name: name.trim(),
    parentId,
  };
}

export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

function getImageMimeType(uri, attachment = {}) {
  if (attachment.mimeType) return attachment.mimeType;
  const extension = uri?.split('?')[0].split('.').pop()?.toLowerCase();
  const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
  return mimeTypes[extension] || 'image/jpeg';
}

function getImageExtension(mimeType) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }[mimeType] || 'jpg';
}

export async function serializeAttachment(attachment) {
  if (!attachment?.uri || attachment.uri.startsWith('data:')) return attachment;
  const mimeType = getImageMimeType(attachment.uri, attachment);
  const base64 = await FileSystem.readAsStringAsync(attachment.uri, { encoding: FileSystem.EncodingType.Base64 });
  return { ...attachment, mimeType, uri: `data:${mimeType};base64,${base64}` };
}

export async function restoreAttachment(attachment, noteId, index) {
  if (!attachment?.uri?.startsWith('data:')) return attachment;
  const match = attachment.uri.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error('Invalid image attachment');
  const [, mimeType, base64] = match;
  const extension = getImageExtension(mimeType);
  const destination = `${FileSystem.documentDirectory}note-${noteId}-imported-${Date.now()}-${index}.${extension}`;
  await FileSystem.writeAsStringAsync(destination, base64, { encoding: FileSystem.EncodingType.Base64 });
  return { ...attachment, mimeType, uri: destination };
}

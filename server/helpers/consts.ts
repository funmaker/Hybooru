// https://github.com/hydrusnetwork/hydrus/blob/master/hydrus/core/HydrusConstants.py

import { Post, PostSummary } from "../routes/apiTypes";

export enum ServiceID {
  TAG_REPOSITORY = 0,
  FILE_REPOSITORY = 1,
  LOCAL_FILE_DOMAIN = 2,
  MESSAGE_DEPOT = 3,
  LOCAL_TAG = 5,
  LOCAL_RATING_NUMERICAL = 6,
  LOCAL_RATING_LIKE = 7,
  RATING_NUMERICAL_REPOSITORY = 8,
  RATING_LIKE_REPOSITORY = 9,
  COMBINED_TAG = 10,
  COMBINED_FILE = 11,
  LOCAL_BOORU = 12,
  IPFS = 13,
  LOCAL_FILE_TRASH_DOMAIN = 14,
  COMBINED_LOCAL_FILE = 15,
  TEST_SERVICE = 16,
  LOCAL_NOTES = 17,
  CLIENT_API_SERVICE = 18,
  SERVER_ADMIN = 99,
  NULL_SERVICE = 100,
}

export enum Mime {
  APPLICATION_HYDRUS_CLIENT_COLLECTION = 0,
  IMAGE_JPEG = 1,
  IMAGE_PNG = 2,
  IMAGE_GIF = 3,
  IMAGE_BMP = 4,
  APPLICATION_FLASH = 5,
  APPLICATION_YAML = 6,
  IMAGE_ICON = 7,
  TEXT_HTML = 8,
  VIDEO_FLV = 9,
  APPLICATION_PDF = 10,
  APPLICATION_ZIP = 11,
  APPLICATION_HYDRUS_ENCRYPTED_ZIP = 12,
  AUDIO_MP3 = 13,
  VIDEO_MP4 = 14,
  AUDIO_OGG = 15,
  AUDIO_FLAC = 16,
  AUDIO_WMA = 17,
  VIDEO_WMV = 18,
  UNDETERMINED_WM = 19,
  VIDEO_MKV = 20,
  VIDEO_WEBM = 21,
  APPLICATION_JSON = 22,
  IMAGE_APNG = 23,
  UNDETERMINED_PNG = 24,
  VIDEO_MPEG = 25,
  VIDEO_MOV = 26,
  VIDEO_AVI = 27,
  APPLICATION_HYDRUS_UPDATE_DEFINITIONS = 28,
  APPLICATION_HYDRUS_UPDATE_CONTENT = 29,
  TEXT_PLAIN = 30,
  APPLICATION_RAR = 31,
  APPLICATION_7Z = 32,
  IMAGE_WEBP = 33,
  IMAGE_TIFF = 34,
  APPLICATION_PSD = 35,
  AUDIO_M4A = 36,
  VIDEO_REALMEDIA = 37,
  AUDIO_REALMEDIA = 38,
  AUDIO_TRUEAUDIO = 39,
  GENERAL_AUDIO = 40,
  GENERAL_IMAGE = 41,
  GENERAL_VIDEO = 42,
  GENERAL_APPLICATION = 43,
  GENERAL_ANIMATION = 44,
  APPLICATION_CLIP = 45,
  APPLICATION_OCTET_STREAM = 100,
  APPLICATION_UNKNOWN = 101,
}

export const MIME_EXT: Partial<Record<Mime, string>> = {
  [Mime.APPLICATION_HYDRUS_CLIENT_COLLECTION]: '.collection',
  [Mime.IMAGE_JPEG]: '.jpg',
  [Mime.IMAGE_PNG]: '.png',
  [Mime.IMAGE_APNG]: '.png',
  [Mime.IMAGE_GIF]: '.gif',
  [Mime.IMAGE_BMP]: '.bmp',
  [Mime.IMAGE_WEBP]: '.webp',
  [Mime.IMAGE_TIFF]: '.tiff',
  [Mime.IMAGE_ICON]: '.ico',
  [Mime.APPLICATION_FLASH]: '.swf',
  [Mime.APPLICATION_OCTET_STREAM]: '.bin',
  [Mime.APPLICATION_YAML]: '.yaml',
  [Mime.APPLICATION_JSON]: '.json',
  [Mime.APPLICATION_PDF]: '.pdf',
  [Mime.APPLICATION_PSD]: '.psd',
  [Mime.APPLICATION_CLIP]: '.clip',
  [Mime.APPLICATION_ZIP]: '.zip',
  [Mime.APPLICATION_RAR]: '.rar',
  [Mime.APPLICATION_7Z]: '.7z',
  [Mime.APPLICATION_HYDRUS_ENCRYPTED_ZIP]: '.zip.encrypted',
  [Mime.APPLICATION_HYDRUS_UPDATE_CONTENT]: '',
  [Mime.APPLICATION_HYDRUS_UPDATE_DEFINITIONS]: '',
  [Mime.AUDIO_M4A]: '.m4a',
  [Mime.AUDIO_MP3]: '.mp3',
  [Mime.AUDIO_OGG]: '.ogg',
  [Mime.AUDIO_REALMEDIA]: '.ra',
  [Mime.AUDIO_FLAC]: '.flac',
  [Mime.AUDIO_TRUEAUDIO]: '.tta',
  [Mime.AUDIO_WMA]: '.wma',
  [Mime.TEXT_HTML]: '.html',
  [Mime.TEXT_PLAIN]: '.txt',
  [Mime.VIDEO_AVI]: '.avi',
  [Mime.VIDEO_FLV]: '.flv',
  [Mime.VIDEO_MOV]: '.mov',
  [Mime.VIDEO_MP4]: '.mp4',
  [Mime.VIDEO_MPEG]: '.mpeg',
  [Mime.VIDEO_WMV]: '.wmv',
  [Mime.VIDEO_MKV]: '.mkv',
  [Mime.VIDEO_REALMEDIA]: '.rm',
  [Mime.VIDEO_WEBM]: '.webm',
  [Mime.APPLICATION_UNKNOWN]: '',
};

export const MIME_STRING: Partial<Record<Mime, string>> = {
  [Mime.APPLICATION_HYDRUS_CLIENT_COLLECTION]: 'collection',
  [Mime.IMAGE_JPEG]: 'image/jpeg',
  [Mime.IMAGE_PNG]: 'image/png',
  [Mime.IMAGE_APNG]: 'image/apng',
  [Mime.IMAGE_GIF]: 'image/gif',
  [Mime.IMAGE_BMP]: 'image/bmp',
  [Mime.IMAGE_WEBP]: 'image/webp',
  [Mime.IMAGE_TIFF]: 'image/tiff',
  [Mime.IMAGE_ICON]: 'image/x-icon',
  [Mime.APPLICATION_FLASH]: 'application/x-shockwave-flash',
  [Mime.APPLICATION_OCTET_STREAM]: 'application/octet-stream',
  [Mime.APPLICATION_YAML]: 'application/x-yaml',
  [Mime.APPLICATION_JSON]: 'application/json',
  [Mime.APPLICATION_PDF]: 'application/pdf',
  [Mime.APPLICATION_PSD]: 'application/x-photoshop',
  [Mime.APPLICATION_CLIP]: 'application/clip',
  [Mime.APPLICATION_ZIP]: 'application/zip',
  [Mime.APPLICATION_RAR]: 'application/vnd.rar',
  [Mime.APPLICATION_7Z]: 'application/x-7z-compressed',
  [Mime.APPLICATION_HYDRUS_ENCRYPTED_ZIP]: 'application/hydrus-encrypted-zip',
  [Mime.APPLICATION_HYDRUS_UPDATE_CONTENT]: 'application/hydrus-update-content',
  [Mime.APPLICATION_HYDRUS_UPDATE_DEFINITIONS]: 'application/hydrus-update-definitions',
  [Mime.AUDIO_M4A]: 'audio/mp4',
  [Mime.AUDIO_MP3]: 'audio/mp3',
  [Mime.AUDIO_OGG]: 'audio/ogg',
  [Mime.AUDIO_FLAC]: 'audio/flac',
  [Mime.AUDIO_REALMEDIA]: 'audio/vnd.rn-realaudio',
  [Mime.AUDIO_TRUEAUDIO]: 'audio/x-tta',
  [Mime.AUDIO_WMA]: 'audio/x-ms-wma',
  [Mime.TEXT_HTML]: 'text/html',
  [Mime.TEXT_PLAIN]: 'text/plain',
  [Mime.VIDEO_AVI]: 'video/x-msvideo',
  [Mime.VIDEO_FLV]: 'video/x-flv',
  [Mime.VIDEO_MOV]: 'video/quicktime',
  [Mime.VIDEO_MP4]: 'video/mp4',
  [Mime.VIDEO_MPEG]: 'video/mpeg',
  [Mime.VIDEO_WMV]: 'video/x-ms-wmv',
  [Mime.VIDEO_MKV]: 'video/x-matroska',
  [Mime.VIDEO_REALMEDIA]: 'video/vnd.rn-realvideo',
  [Mime.VIDEO_WEBM]: 'video/webm',
  [Mime.UNDETERMINED_WM]: 'video/x-ms-wmv',
  [Mime.APPLICATION_UNKNOWN]: 'unknown filetype',
  [Mime.GENERAL_APPLICATION]: 'application',
  [Mime.GENERAL_AUDIO]: 'audio',
  [Mime.GENERAL_IMAGE]: 'image',
  [Mime.GENERAL_VIDEO]: 'video',
  [Mime.GENERAL_ANIMATION]: 'animation',
};

export const namespaceRegex = /(.+?):(.+)/;
export const underscoreRegex = /_/g;
export const rangeRatingRegex = /^rating:(\d+)(?:-(\d+))?$/;
export const anyRatingRegex = /^rating:(\d+(?:-\d+)?|none)$/;

export const fileUrl = (post: Post | PostSummary) => `/files/f${post.hash}${post.extension}`;
export const thumbnailUrl = (post: Post | PostSummary) =>  `/files/t${post.hash}.thumbnail`;

export function prettifyTag(tag: string) {
  const match = tag.match(namespaceRegex);
  
  if(match) return match[2].replace(underscoreRegex, " ");
  else return tag.replace(underscoreRegex, " ");
}

const toTitleCase = (str: string) => str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

export function postTitle(post: Post) {
  const tags = Object.keys(post.tags);
  
  const title = tags.filter(tag => tag.startsWith("title:")).map(prettifyTag).join(" - ");
  const creator = tags.filter(tag => tag.startsWith("creator:")).map(prettifyTag).join(" & ");
  const character = tags.filter(tag => tag.startsWith("character:")).map(prettifyTag).join(", ");
  
  let ret = "";
  
  if(title) ret += toTitleCase(title);
  else if(character) ret += toTitleCase(character);
  else ret += `Post ${post.id}`;
  
  if(creator) ret += ` by ${toTitleCase(creator)}`;
  
  return ret;
}

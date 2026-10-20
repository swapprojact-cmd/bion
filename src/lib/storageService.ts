import { deleteObject, getDownloadURL, ref, uploadBytes, type UploadMetadata } from 'firebase/storage';
import { storage } from './firebase';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const AVATAR_LIMIT = 5 * 1024 * 1024;
const POST_MEDIA_LIMIT = 10 * 1024 * 1024;
const POST_VIDEO_LIMIT = 50 * 1024 * 1024;

function validateImage(file: File, maxBytes: number) {
  if (!IMAGE_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error('Image must be smaller than ' + Math.floor(maxBytes / (1024 * 1024)) + ' MB.');
  }
}

function safeFileName(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'img';
  const safeExtension = /^[a-z0-9]{1,8}$/.test(extension) ? extension : 'img';
  return crypto.randomUUID() + '.' + safeExtension;
}

async function uploadFile(path: string, file: File) {
  const metadata: UploadMetadata = { contentType: file.type };
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, metadata);
  return { path, url: await getDownloadURL(objectRef) };
}

async function uploadImage(path: string, file: File, maxBytes: number) {
  validateImage(file, maxBytes);
  return uploadFile(path, file);
}

export function uploadAvatar(uid: string, file: File) {
  return uploadImage('users/' + uid + '/avatars/' + safeFileName(file), file, AVATAR_LIMIT);
}

export function uploadPostImage(uid: string, file: File) {
  return uploadImage('users/' + uid + '/posts/' + safeFileName(file), file, POST_MEDIA_LIMIT);
}

export async function uploadPostVideo(uid: string, file: File) {
  if (!VIDEO_TYPES.has(file.type)) throw new Error('Choose an MP4, WebM, or MOV video.');
  if (file.size <= 0 || file.size > POST_VIDEO_LIMIT) throw new Error('Video must be smaller than 50 MB.');
  return uploadFile('users/' + uid + '/posts/' + safeFileName(file), file);
}

export async function deleteUploadedFile(path: string) {
  await deleteObject(ref(storage, path));
}

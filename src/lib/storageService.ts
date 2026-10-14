import { deleteObject, getDownloadURL, ref, uploadBytes, type UploadMetadata } from 'firebase/storage';
import { storage } from './firebase';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AVATAR_LIMIT = 5 * 1024 * 1024;
const POST_MEDIA_LIMIT = 10 * 1024 * 1024;

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
async function uploadImage(path: string, file: File, maxBytes: number) {
  validateImage(file, maxBytes);
  const metadata: UploadMetadata = { contentType: file.type };
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, metadata);
  return { path, url: await getDownloadURL(objectRef) };
}
export function uploadAvatar(uid: string, file: File) {
  return uploadImage('users/' + uid + '/avatars/' + safeFileName(file), file, AVATAR_LIMIT);
}
export function uploadPostImage(uid: string, file: File) {
  return uploadImage('users/' + uid + '/posts/' + safeFileName(file), file, POST_MEDIA_LIMIT);
}
export async function deleteUploadedFile(path: string) {
  await deleteObject(ref(storage, path));
}

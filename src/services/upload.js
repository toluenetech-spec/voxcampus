import { isLocalBackend } from './store';

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD ?? 'dngm8iodz';
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET ?? 'voxcampus_audio';

/**
 * Uploads a file and resolves to its public URL.
 *
 * With the real backend this goes to Cloudinary. In demo mode (or whenever the
 * network is unavailable) it falls back to a local object URL so the rest of
 * the flow — create podcast, attach submission, change avatar — still works
 * and stays inspectable.
 */
export async function uploadFile(file) {
  if (!file) throw new Error('No file selected.');

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

  if (!isLocalBackend()) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    let response;
    try {
      response = await fetch(endpoint, { method: 'POST', body: formData });
    } catch (error) {
      throw new Error('Could not reach the upload service. Check your connection and try again.', { cause: error });
    }

    const data = await response.json().catch(() => ({}));
    if (data.error) throw new Error(data.error.message ?? 'Upload was rejected.');
    if (!response.ok || !data.secure_url) throw new Error('Upload failed. Please try again.');
    return data.secure_url;
  }

  // Demo / offline path.
  try {
    return URL.createObjectURL(file);
  } catch {
    throw new Error('This browser could not read the selected file.');
  }
}

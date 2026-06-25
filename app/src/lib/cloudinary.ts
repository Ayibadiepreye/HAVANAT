// Cloudinary unsigned upload helper.
// Uses VITE_CLOUDINARY_CLOUD_NAME + VITE_CLOUDINARY_UPLOAD_PRESET from .env.
//
// Usage:
//   const url = await uploadToCloudinary(file, 'products');
//   // returns the secure_url — store this on the product record

const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string) ?? '';
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string) ?? '';

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
  configured: Boolean(CLOUD_NAME && UPLOAD_PRESET),
};

/**
 * Upload a file to Cloudinary via unsigned upload preset.
 * Returns the secure_url of the uploaded image.
 *
 * @param file      File or Blob to upload
 * @param folder    Cloudinary folder (e.g. 'products', 'banners', 'homepage')
 */
export async function uploadToCloudinary(file: File | Blob, folder = 'havanat'): Promise<string> {
  if (!cloudinaryConfig.configured) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in app/.env'
    );
  }
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', folder);

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}

/**
 * Build a Cloudinary delivery URL with optional transforms.
 * Use this for inline `<img src={cloudinaryUrl(...)}>` in components.
 *
 * @example
 *   <img src={cloudinaryUrl('products/abc', { w: 800, h: 1000, crop: 'fill' })} />
 */
export function cloudinaryUrl(publicId: string, transforms?: { w?: number; h?: number; crop?: string; quality?: string | number; format?: string }): string {
  if (!CLOUD_NAME) return publicId;
  const parts: string[] = [];
  if (transforms?.w) parts.push(`w_${transforms.w}`);
  if (transforms?.h) parts.push(`h_${transforms.h}`);
  if (transforms?.crop) parts.push(`c_${transforms.crop}`);
  if (transforms?.quality) parts.push(`q_${transforms.quality}`);
  if (transforms?.format) parts.push(`f_${transforms.format}`);
  parts.push('fl_progressive');
  const t = parts.join(',');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${publicId}`;
}

/**
 * Derive the Cloudinary public_id from a full Cloudinary URL.
 * Used when admins want to swap out an image — we just need to store the public_id.
 */
export function publicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname; // /<cloud>/image/upload/v123/folder/file.jpg
    const m = path.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (!m) return null;
    return m[1].replace(/\.[a-z]+$/i, ''); // strip extension
  } catch {
    return null;
  }
}

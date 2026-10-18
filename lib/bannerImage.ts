'use client';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;

// Reads an uploaded banner as a data URL, downscaling anything bigger than
// 1920×1080 (the stream's output size) or heavier than 1.5 MB to a JPEG so
// phone photos fit under the 2 MB upload limit without the advertiser having
// to resize it themselves.
export async function readBannerFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG or PNG)');

  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the image'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('This image could not be opened. Try a JPG or PNG.'));
    el.src = original;
  });

  const fits = img.naturalWidth <= MAX_WIDTH && img.naturalHeight <= MAX_HEIGHT;
  if (fits && file.size <= KEEP_AS_IS_BYTES) return original;

  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth, MAX_HEIGHT / img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.9, 0.8, 0.7, 0.6]) {
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length * 0.75 <= 2 * 1024 * 1024) return out;
  }
  throw new Error('Image is too large. Please use a smaller banner (under 2 MB).');
}

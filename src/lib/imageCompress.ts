// src/lib/imageCompress.ts
// Client-side image compression helper.
//
// Firebase Storage is unavailable in this project (CORS preflight error /
// no Blaze plan), so images are no longer uploaded to Storage. Instead they
// are resized on an HTMLCanvasElement and emitted as base64 data URLs that
// are stored directly in Firestore (users/{uid} / users/{uid}/posts/{postId}).
//
// - Avatar:   max side 256px, hard cap 300KB.
// - Post img: max side 800px, hard cap 800KB (post doc must stay < 900KB).
// - Wallpaper: max side 1280px, hard cap 900KB (user doc must stay < 1MB).

export interface CompressImageOptions {
  maxSize: number; // max side length, in px
  maxBytes: number; // hard cap on the resulting data URL size, in bytes
  quality?: number; // JPEG quality 0-1 (default 0.7)
}

export interface CompressImageResult {
  dataUrl: string;
  sizeBytes: number;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions
): Promise<CompressImageResult> {
  const { maxSize, maxBytes, quality = 0.7 } = options;

  // GIFs cannot be re-encoded through canvas without losing animation, so they
  // pass through as-is. They are still subject to the byte cap below.
  if (file.type === 'image/gif') {
    const dataUrl = await fileToDataUrl(file);
    const sizeBytes = byteSize(dataUrl);
    if (sizeBytes > maxBytes) {
      throw tooBig(maxBytes);
    }
    return { dataUrl, sizeBytes };
  }

  const image = await loadImage(file);
  const { width, height } = scaleDimensions(image.width, image.height, maxSize);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Trình duyệt không hỗ trợ canvas để nén ảnh.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, width, height);

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let sizeBytes = byteSize(dataUrl);

  // If still over the cap, progressively drop quality before giving up.
  let q = quality;
  while (sizeBytes > maxBytes && q > 0.2) {
    q -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', q);
    sizeBytes = byteSize(dataUrl);
  }

  if (sizeBytes > maxBytes) {
    throw tooBig(maxBytes);
  }

  return { dataUrl, sizeBytes };
}

/** Byte size of a string (UTF-8), accurate for Firestore's 1MB doc limit. */
export function byteSize(str: string): number {
  return new Blob([str]).size;
}

function scaleDimensions(w: number, h: number, max: number) {
  if (!w || !h || (w <= max && h <= max)) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể tải ảnh để nén (file corrupt?).'));
    };
    img.src = url;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

function tooBig(maxBytes: number): Error {
  const err: any = new Error(
    `Ảnh sau khi nén vẫn vượt quá giới hạn ${formatBytes(maxBytes)}. Vui lòng chọn ảnh nhỏ hơn.`
  );
  err.code = 'invalid-argument';
  return err;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
export const MAX_SHEET_BASE64_LENGTH = 25_000;

export interface CompressedImageResult {
  dataUrl: string;
  length: number;
  width: number;
  height: number;
  quality: number;
  mimeType: 'image/webp' | 'image/jpeg';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพที่รองรับ'));
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function detectPreferredMime(canvas: HTMLCanvasElement): 'image/webp' | 'image/jpeg' {
  try {
    const testUrl = canvas.toDataURL('image/webp', 0.8);
    if (testUrl.startsWith('data:image/webp')) {
      return 'image/webp';
    }
  } catch {
    // Fallback to JPEG
  }
  return 'image/jpeg';
}

/**
 * Compresses an uploaded image file via HTML5 Canvas for direct storage
 * inside a Google Sheets cell (strictly < 25,000 characters).
 * Loops quality down in steps of 0.1 (from 0.9 to 0.1) and further scales
 * dimensions if needed so the Base64 output is ALWAYS under 25,000 chars.
 */
export async function compressImageForSheet(
  file: File,
  maxWidth: number
): Promise<CompressedImageResult> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('เบราว์เซอร์ไม่รองรับ HTML5 Canvas');
  }

  let targetWidth = Math.min(img.naturalWidth || img.width, maxWidth);
  let targetHeight = Math.max(
    1,
    Math.round(((img.naturalHeight || img.height) * targetWidth) / Math.max(1, img.naturalWidth || img.width))
  );

  const mimeType = detectPreferredMime(canvas);

  const drawAtSize = (w: number, h: number) => {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
  };

  let bestDataUrl = '';
  let bestQuality = 0.9;

  // Try quality 0.9 -> 0.1 in 0.1 steps; if still >= 25,000 chars, scale down 80% and repeat
  for (let scaleAttempt = 0; scaleAttempt < 5; scaleAttempt++) {
    drawAtSize(targetWidth, targetHeight);

    for (let qStep = 9; qStep >= 1; qStep--) {
      const quality = Number((qStep / 10).toFixed(1));
      const candidate = canvas.toDataURL(mimeType, quality);
      bestDataUrl = candidate;
      bestQuality = quality;
      if (candidate.length < MAX_SHEET_BASE64_LENGTH) {
        return {
          dataUrl: candidate,
          length: candidate.length,
          width: targetWidth,
          height: targetHeight,
          quality,
          mimeType,
        };
      }
    }

    targetWidth = Math.max(80, Math.round(targetWidth * 0.78));
    targetHeight = Math.max(
      80,
      Math.round(((img.naturalHeight || img.height) * targetWidth) / Math.max(1, img.naturalWidth || img.width))
    );
  }

  if (bestDataUrl.length >= MAX_SHEET_BASE64_LENGTH) {
    throw new Error('รูปภาพมีรายละเอียดสูงเกินไป ไม่สามารถบีบอัดให้ต่ำกว่า 25,000 ตัวอักษรได้');
  }

  return {
    dataUrl: bestDataUrl,
    length: bestDataUrl.length,
    width: targetWidth,
    height: targetHeight,
    quality: bestQuality,
    mimeType,
  };
}

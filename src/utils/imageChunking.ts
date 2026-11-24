export const IMAGE_CHUNK_SIZE = 40_000;
export const MAX_GIF_FILE_BYTES = 500 * 1024;
export const MAX_GIF_BASE64_LENGTH = 700_000;
export const GIF_TOO_LARGE_MESSAGE =
  'ไฟล์ GIF ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 500 KB';

/**
 * Splits a Base64 Data URL into <= 40,000-character chunks for PortalSettings rows.
 * - If empty: clears main key and sets `<baseKey>_count: 0`.
 * - If <= 40,000 chars: writes directly to `<baseKey>` and sets `<baseKey>_count: 0`.
 * - If > 40,000 chars: clears `<baseKey>` (`""`), writes `<baseKey>_count`, and
 *   writes `<baseKey>_part_0`, `<baseKey>_part_1`, ...
 */
export function buildChunkedImageSettingsPayload(
  baseKey: string,
  dataUrl: string,
  chunkSize: number = IMAGE_CHUNK_SIZE
): Record<string, string | number> {
  const safeChunkSize = Math.max(1, Math.floor(chunkSize));
  const value = (dataUrl || '').trim();

  if (!value) {
    return {
      [baseKey]: '',
      [`${baseKey}_count`]: 0,
    };
  }

  if (value.length <= safeChunkSize) {
    return {
      [baseKey]: value,
      [`${baseKey}_count`]: 0,
    };
  }

  const totalChunks = Math.ceil(value.length / safeChunkSize);
  const payload: Record<string, string | number> = {
    [baseKey]: '',
    [`${baseKey}_count`]: totalChunks,
  };

  for (let i = 0; i < totalChunks; i += 1) {
    const start = i * safeChunkSize;
    payload[`${baseKey}_part_${i}`] = value.slice(start, start + safeChunkSize);
  }

  return payload;
}

/**
 * Reassembles an image Data URL from Google Sheets `settings`.
 * - If `settings[baseKey + '_count'] > 0`, concatenates `<baseKey>_part_0..part_(count-1)`.
 * - Otherwise returns `settings[baseKey]` as usual.
 */
export function resolveImageFromSettings(
  settings: Record<string, unknown>,
  baseKey: string
): string {
  if (!settings || typeof settings !== 'object') return '';

  const rawCount = settings[`${baseKey}_count`];
  const count = Number(rawCount);

  if (Number.isFinite(count) && count > 0) {
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = settings[`${baseKey}_part_${i}`];
      if (typeof part === 'string') {
        parts.push(part);
      } else if (part !== null && part !== undefined) {
        parts.push(String(part));
      }
    }
    const joined = parts.join('').trim();
    if (joined.length > 0) {
      return joined;
    }
  }

  const direct = settings[baseKey];
  return typeof direct === 'string' ? direct.trim() : '';
}

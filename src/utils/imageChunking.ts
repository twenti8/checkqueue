export const IMAGE_CHUNK_SIZE = 40_000;
export const MAX_GIF_FILE_BYTES = 500 * 1024;
export const MAX_GIF_BASE64_LENGTH = 700_000;
export const GIF_TOO_LARGE_MESSAGE =
  'ไฟล์ GIF ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 500 KB';

const SHEETS_FORMULA_LEADING_CHAR = /^[=+\-@]/;

/**
 * Splits a Base64 Data URL into <= 40,000-character chunks for PortalSettings rows.
 * - If empty: clears main key and sets `<baseKey>_count: 0`.
 * - If <= 40,000 chars: writes directly to `<baseKey>` and sets `<baseKey>_count: 0`.
 * - If > 40,000 chars: clears `<baseKey>` (`""`), writes `<baseKey>_count`, and
 *   writes `<baseKey>_part_0`, `<baseKey>_part_1`, ...
 * - Adjusts split boundaries backward by a few chars if needed so no chunk begins
 *   with `=`, `+`, `-`, or `@` (preventing Google Sheets from parsing a Base64 chunk as a formula).
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

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    let end = Math.min(cursor + safeChunkSize, value.length);
    if (end < value.length && safeChunkSize > 1) {
      let adjustedEnd = end;
      while (
        adjustedEnd > cursor + 1 &&
        SHEETS_FORMULA_LEADING_CHAR.test(value[adjustedEnd])
      ) {
        adjustedEnd -= 1;
      }
      if (!SHEETS_FORMULA_LEADING_CHAR.test(value[adjustedEnd])) {
        end = adjustedEnd;
      }
    }
    chunks.push(value.slice(cursor, end));
    cursor = end;
  }

  const payload: Record<string, string | number> = {
    [baseKey]: '',
    [`${baseKey}_count`]: chunks.length,
  };

  for (let i = 0; i < chunks.length; i += 1) {
    payload[`${baseKey}_part_${i}`] = chunks[i];
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

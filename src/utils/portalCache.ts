import type { CustomThemeColors, PortalData } from '../types/portal';
import {
  GIF_TOO_LARGE_MESSAGE,
  MAX_GIF_BASE64_LENGTH,
  MAX_GIF_FILE_BYTES,
} from './imageChunking';
import { normalizePortalResponse, resolveActiveThemeColors } from './queueLogic';

export const PORTAL_CACHE_KEY = 'kawaii_portal_cache';
export const THEME_VARS_KEY = 'kawaii_theme_vars';
export { GIF_TOO_LARGE_MESSAGE, MAX_GIF_BASE64_LENGTH, MAX_GIF_FILE_BYTES };

export function buildThemeVarsMap(colors: CustomThemeColors): Record<string, string> {
  return {
    '--portal-bg': colors.bg,
    '--portal-surface': colors.surface,
    '--portal-surface-alt': colors.surfaceAlt,
    '--portal-border': colors.border,
    '--portal-primary': colors.primary,
    '--portal-secondary': colors.secondary,
    '--portal-ink': colors.ink,
    '--portal-muted': colors.muted,
    '--bg-color': colors.bg,
    '--primary-color': colors.primary,
    '--accent-color': colors.secondary,
    '--text-color': colors.ink,
  };
}

export function applyThemeVarsToRoot(colors: CustomThemeColors): void {
  if (typeof document === 'undefined') return;
  const vars = buildThemeVarsMap(colors);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function writeThemeVarsCache(colors: CustomThemeColors): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(THEME_VARS_KEY, JSON.stringify(buildThemeVarsMap(colors)));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function serializePortalForCache(data: PortalData): {
  settings: Record<string, unknown>;
  queues: PortalData['queues'];
  reviews: PortalData['reviews'];
} {
  return {
    settings: {
      profile: data.profile,
      activeThemeId: data.activeThemeId,
      customThemeColors: data.customThemeColors,
      backgroundEffect: data.backgroundEffect,
      ...data.images,
    },
    queues: data.queues,
    reviews: data.reviews,
  };
}

export function writePortalCache(data: PortalData): void {
  const colors = resolveActiveThemeColors(data.activeThemeId, data.customThemeColors);
  writeThemeVarsCache(colors);
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify(serializePortalForCache(data)));
  } catch {
    // Fallback when multiple large chunked GIFs exceed localStorage quota (~5MB):
    // still persist theme, profile, queues, reviews, and lightweight images for 0ms hydration.
    try {
      const compactImages: PortalData['images'] = {};
      for (const [k, v] of Object.entries(data.images)) {
        if (typeof v === 'string' && v.length <= 120_000) {
          compactImages[k as keyof PortalData['images']] = v;
        }
      }
      localStorage.setItem(
        PORTAL_CACHE_KEY,
        JSON.stringify(serializePortalForCache({ ...data, images: compactImages }))
      );
    } catch {
      // Ignore private browsing or hard quota restrictions
    }
  }
}

export function readPortalCache(): PortalData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(PORTAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizePortalResponse(parsed);
  } catch {
    return null;
  }
}

export function validateGifDataUrl(
  dataUrl: string
): { valid: true } | { valid: false; error: string } {
  if (!dataUrl.startsWith('data:image/gif;base64,')) {
    return { valid: false, error: 'ไฟล์ที่เลือกไม่ใช่ไฟล์ GIF ที่ถูกต้อง' };
  }
  if (dataUrl.length > MAX_GIF_BASE64_LENGTH) {
    return { valid: false, error: GIF_TOO_LARGE_MESSAGE };
  }
  return { valid: true };
}

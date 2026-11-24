import test from 'node:test';
import assert from 'node:assert/strict';
import { PASTEL_THEMES } from '../constants/themes';
import {
  buildThemeVarsMap,
  GIF_TOO_LARGE_MESSAGE,
  MAX_GIF_BASE64_LENGTH,
  serializePortalForCache,
  validateGifDataUrl,
} from './portalCache';
import {
  buildChunkedImageSettingsPayload,
  IMAGE_CHUNK_SIZE,
  resolveImageFromSettings,
} from './imageChunking';
import { normalizePortalResponse } from './queueLogic';

test('buildThemeVarsMap exports both portal tokens and generic CSS variable aliases', () => {
  const sky = PASTEL_THEMES.find((t) => t.id === 'baby-sky')!;
  const vars = buildThemeVarsMap(sky.colors);
  assert.equal(vars['--portal-bg'], sky.colors.bg);
  assert.equal(vars['--bg-color'], sky.colors.bg);
  assert.equal(vars['--primary-color'], sky.colors.primary);
  assert.equal(vars['--accent-color'], sky.colors.secondary);
  assert.equal(vars['--text-color'], sky.colors.ink);
});

test('serializePortalForCache round-trips through normalizePortalResponse preserving settings, GIFs, queues, and reviews', () => {
  const sampleGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const initial = normalizePortalResponse({
    settings: {
      activeThemeId: 'baby-sky',
      backgroundEffect: 'stars',
      img_avatar: sampleGif,
      img_portfolio_1: sampleGif,
      profile: { studioName: 'MOOGROB', adminPassword: '9999' },
    },
    queues: [{ id: 'q1', queueNo: 'Q-001', clientName: 'Mint', fullPrice: 500, paidAmount: 250 }],
    reviews: [{ id: 'r1', clientName: 'Mint', rating: 5, points: 2, comment: 'Cute!' }],
  });

  const serialized = serializePortalForCache(initial);
  const restored = normalizePortalResponse(serialized);

  assert.equal(restored.profile.studioName, 'MOOGROB');
  assert.equal(restored.activeThemeId, 'baby-sky');
  assert.equal(restored.backgroundEffect, 'stars');
  assert.equal(restored.images.img_avatar, sampleGif);
  assert.equal(restored.images.img_portfolio_1, sampleGif);
  assert.equal(restored.queues.length, 1);
  assert.equal(restored.reviews.length, 1);
});

test('validateGifDataUrl accepts GIFs up to 700,000 chars (500 KB) and rejects oversized GIFs with exact Thai message', () => {
  const mediumGif = 'data:image/gif;base64,' + 'A'.repeat(250_000);
  assert.deepEqual(validateGifDataUrl(mediumGif), { valid: true });

  const exactLimitGif =
    'data:image/gif;base64,' +
    'A'.repeat(MAX_GIF_BASE64_LENGTH - 'data:image/gif;base64,'.length);
  assert.equal(exactLimitGif.length, MAX_GIF_BASE64_LENGTH);
  assert.deepEqual(validateGifDataUrl(exactLimitGif), { valid: true });

  const tooLargeGif = 'data:image/gif;base64,' + 'A'.repeat(MAX_GIF_BASE64_LENGTH);
  const res = validateGifDataUrl(tooLargeGif);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.error, 'ไฟล์ GIF ใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 500 KB');
    assert.equal(res.error, GIF_TOO_LARGE_MESSAGE);
  }
});

test('buildChunkedImageSettingsPayload keeps <= 40,000 chars in main key with _count: 0 and chunks > 40,000 chars cleanly', () => {
  // Empty / clear
  assert.deepEqual(buildChunkedImageSettingsPayload('img_avatar', ''), {
    img_avatar: '',
    img_avatar_count: 0,
  });

  // Small / <= 40,000 chars
  const smallData = 'data:image/webp;base64,' + 'B'.repeat(12_000);
  const smallPayload = buildChunkedImageSettingsPayload('img_cover', smallData);
  assert.deepEqual(smallPayload, {
    img_cover: smallData,
    img_cover_count: 0,
  });

  // Large GIF > 40,000 chars (150,000 chars -> 4 chunks of 40k, 40k, 40k, 30k)
  const prefix = 'data:image/gif;base64,';
  const largeData = prefix + 'C'.repeat(150_000 - prefix.length);
  const chunked = buildChunkedImageSettingsPayload('img_avatar', largeData);

  assert.equal(chunked.img_avatar, '');
  assert.equal(chunked.img_avatar_count, 4);
  assert.equal(String(chunked.img_avatar_part_0).length, IMAGE_CHUNK_SIZE);
  assert.equal(String(chunked.img_avatar_part_1).length, IMAGE_CHUNK_SIZE);
  assert.equal(String(chunked.img_avatar_part_2).length, IMAGE_CHUNK_SIZE);
  assert.equal(String(chunked.img_avatar_part_3).length, 30_000);
  assert.equal(chunked.img_avatar_part_4, undefined);

  // Reassembles identically
  assert.equal(resolveImageFromSettings(chunked, 'img_avatar'), largeData);
});

test('resolveImageFromSettings & normalizePortalResponse reassemble chunked images (including stringified _count from Sheets)', () => {
  const prefix = 'data:image/gif;base64,';
  const gifA = prefix + 'X'.repeat(85_000 - prefix.length); // 3 parts
  const gifB = prefix + 'Y'.repeat(50_000 - prefix.length); // 2 parts
  const smallBanner = 'data:image/webp;base64,SMALLBANNER';

  const avatarChunks = buildChunkedImageSettingsPayload('img_avatar', gifA);
  const portfolioChunks = buildChunkedImageSettingsPayload('img_portfolio_3', gifB);

  // Simulate Google Sheets returning numeric counts as strings
  const sheetSettings: Record<string, unknown> = {
    ...avatarChunks,
    img_avatar_count: String(avatarChunks.img_avatar_count),
    ...portfolioChunks,
    img_banner: smallBanner,
    img_banner_count: '0',
  };

  assert.equal(resolveImageFromSettings(sheetSettings, 'img_avatar'), gifA);
  assert.equal(resolveImageFromSettings(sheetSettings, 'img_portfolio_3'), gifB);
  assert.equal(resolveImageFromSettings(sheetSettings, 'img_banner'), smallBanner);
  assert.equal(resolveImageFromSettings(sheetSettings, 'img_icon'), '');

  const normalized = normalizePortalResponse({
    settings: sheetSettings,
    queues: [],
    reviews: [],
  });
  assert.equal(normalized.images.img_avatar, gifA);
  assert.equal(normalized.images.img_portfolio_3, gifB);
  assert.equal(normalized.images.img_banner, smallBanner);
  assert.equal(normalized.images.img_icon, undefined);
});

test('buildChunkedImageSettingsPayload shifts split boundary away from Sheets formula chars (+, =, -, @)', () => {
  const prefix = 'data:image/gif;base64,';
  // Place "+" right at the 40,000-character boundary
  const bodyBefore = 'A'.repeat(IMAGE_CHUNK_SIZE - prefix.length);
  const trickyGif = prefix + bodyBefore + '++' + 'B'.repeat(10_000);

  const chunked = buildChunkedImageSettingsPayload('img_avatar', trickyGif);
  assert.equal(chunked.img_avatar, '');
  assert.equal(chunked.img_avatar_count, 2);

  const part0 = String(chunked.img_avatar_part_0);
  const part1 = String(chunked.img_avatar_part_1);
  assert.ok(part0.length <= IMAGE_CHUNK_SIZE);
  assert.ok(part1.length <= IMAGE_CHUNK_SIZE);
  assert.equal(/^[=+\-@]/.test(part1), false);
  assert.equal(resolveImageFromSettings(chunked, 'img_avatar'), trickyGif);
});

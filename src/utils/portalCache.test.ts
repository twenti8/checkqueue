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

test('validateGifDataUrl accepts GIFs <= 48,000 chars and rejects oversized GIFs with exact Thai message', () => {
  const smallGif = 'data:image/gif;base64,' + 'A'.repeat(1000);
  assert.deepEqual(validateGifDataUrl(smallGif), { valid: true });

  const exactLimitGif = 'data:image/gif;base64,' + 'A'.repeat(MAX_GIF_BASE64_LENGTH - 'data:image/gif;base64,'.length);
  assert.equal(exactLimitGif.length, MAX_GIF_BASE64_LENGTH);
  assert.deepEqual(validateGifDataUrl(exactLimitGif), { valid: true });

  const tooLargeGif = 'data:image/gif;base64,' + 'A'.repeat(MAX_GIF_BASE64_LENGTH);
  const res = validateGifDataUrl(tooLargeGif);
  assert.equal(res.valid, false);
  if (!res.valid) {
    assert.equal(res.error, GIF_TOO_LARGE_MESSAGE);
  }
});

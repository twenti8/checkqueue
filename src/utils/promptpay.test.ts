import test from 'node:test';
import assert from 'node:assert/strict';
import {
  crc16CcittFalse,
  formatPromptPayDisplay,
  generatePromptPayPayload,
} from './promptpay';

test('crc16CcittFalse matches standard check vector 123456789 -> 29B1', () => {
  assert.equal(crc16CcittFalse('123456789'), '29B1');
});

test('generates static PromptPay payload for 10-digit Thai mobile number', () => {
  const res = generatePromptPayPayload('089-123-4567');
  assert.equal(res.valid, true);
  assert.equal(res.targetType, 'mobile');
  assert.equal(res.amount, null);
  assert.equal(res.formattedTarget, '089-123-4567');
  assert.ok(res.payload.startsWith('000201010211'));
  assert.ok(res.payload.includes('A00000067701011101130066891234567'));
  assert.ok(res.payload.includes('5802TH5303764'));
  assert.ok(!res.payload.includes('540'));
  // Verify trailing CRC matches recomputed CRC
  const body = res.payload.slice(0, -4);
  const crc = res.payload.slice(-4);
  assert.equal(crc, crc16CcittFalse(body));
});

test('generates dynamic PromptPay payload when amount is specified', () => {
  const res = generatePromptPayPayload('0891234567', 450.5);
  assert.equal(res.valid, true);
  assert.equal(res.amount, 450.5);
  assert.ok(res.payload.startsWith('000201010212'));
  assert.ok(res.payload.includes('5406450.50'));
  const body = res.payload.slice(0, -4);
  assert.equal(res.payload.slice(-4), crc16CcittFalse(body));
});

test('generates PromptPay payload for 13-digit Thai National ID', () => {
  const res = generatePromptPayPayload('1-2345-67890-12-3', '1200');
  assert.equal(res.valid, true);
  assert.equal(res.targetType, 'national_id');
  assert.equal(res.amount, 1200);
  assert.ok(res.payload.includes('A00000067701011102131234567890123'));
  assert.ok(res.payload.includes('54071200.00'));
  assert.equal(formatPromptPayDisplay('1234567890123'), '1-2345-67890-12-3');
});

test('returns invalid result for malformed PromptPay target', () => {
  const res = generatePromptPayPayload('12345');
  assert.equal(res.valid, false);
  assert.equal(res.payload, '');
  assert.ok(Boolean(res.error));
});

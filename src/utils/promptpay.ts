/**
 * Thai PromptPay EMVCo Merchant-Presented QR Code Payload Builder.
 * Implements Bank of Thailand PromptPay specification with CRC-16/CCITT-FALSE.
 */

export interface PromptPayResult {
  valid: boolean;
  payload: string;
  targetType: 'mobile' | 'national_id' | 'ewallet' | 'invalid';
  formattedTarget: string;
  amount: number | null;
  error?: string;
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF, no reflection, no final XOR)
 */
export function crc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= (input.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function sanitizePromptPayTarget(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatPromptPayDisplay(raw: string): string {
  const digits = sanitizePromptPayTarget(raw);
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 13) {
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
  }
  return raw.trim();
}

export function generatePromptPayPayload(
  rawTarget: string,
  rawAmount?: number | string | null
): PromptPayResult {
  const digits = sanitizePromptPayTarget(rawTarget || '');

  let subTag = '';
  let targetValue = '';
  let targetType: PromptPayResult['targetType'] = 'invalid';

  if (digits.length === 10 && digits.startsWith('0')) {
    // Thai mobile phone: strip leading 0 and prefix 0066
    subTag = '01';
    targetValue = `0066${digits.slice(1)}`;
    targetType = 'mobile';
  } else if (digits.length === 11 && digits.startsWith('66')) {
    subTag = '01';
    targetValue = `00${digits}`;
    targetType = 'mobile';
  } else if (digits.length === 13) {
    // Thai National ID / Tax ID
    subTag = '02';
    targetValue = digits;
    targetType = 'national_id';
  } else if (digits.length === 15) {
    // e-Wallet ID
    subTag = '03';
    targetValue = digits;
    targetType = 'ewallet';
  } else {
    return {
      valid: false,
      payload: '',
      targetType: 'invalid',
      formattedTarget: rawTarget,
      amount: null,
      error: 'กรุณากรอกเบอร์พร้อมเพย์ 10 หลัก หรือเลขบัตรประชาชน 13 หลักให้ถูกต้อง',
    };
  }

  let parsedAmount: number | null = null;
  if (rawAmount !== undefined && rawAmount !== null && `${rawAmount}`.trim() !== '') {
    const num = typeof rawAmount === 'number' ? rawAmount : Number(`${rawAmount}`.replace(/,/g, ''));
    if (Number.isFinite(num) && num > 0) {
      parsedAmount = Math.round(num * 100) / 100;
    }
  }

  const merchantAccountInfo =
    tlv('00', 'A000000677010111') + tlv(subTag, targetValue);

  const fields = [
    tlv('00', '01'), // Payload Format Indicator
    tlv('01', parsedAmount !== null ? '12' : '11'), // 12 = Dynamic (with amount), 11 = Static
    tlv('29', merchantAccountInfo), // Merchant Account Information (PromptPay)
    tlv('58', 'TH'), // Country Code
    tlv('53', '764'), // Transaction Currency (THB = 764)
  ];

  if (parsedAmount !== null) {
    fields.push(tlv('54', parsedAmount.toFixed(2)));
  }

  const payloadWithoutCrc = `${fields.join('')}6304`;
  const crc = crc16CcittFalse(payloadWithoutCrc);

  return {
    valid: true,
    payload: `${payloadWithoutCrc}${crc}`,
    targetType,
    formattedTarget: formatPromptPayDisplay(digits),
    amount: parsedAmount,
  };
}

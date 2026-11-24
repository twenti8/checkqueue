import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';
import type { BankInfo } from '../types/portal';
import { formatBaht } from '../utils/queueLogic';
import { generatePromptPayPayload } from '../utils/promptpay';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  bankInfo: BankInfo;
  studioName: string;
  onNotify?: (message: string) => void;
}

const PRESET_AMOUNTS = [350, 500, 850, 1200];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  bankInfo,
  studioName,
  onNotify,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'account' | 'promptpay' | null>(null);

  const promptPayResult = useMemo(
    () => generatePromptPayPayload(bankInfo.promptPayId, amountInput),
    [bankInfo.promptPayId, amountInput]
  );

  useEffect(() => {
    if (!open || !promptPayResult.valid || !promptPayResult.payload) {
      setQrDataUrl('');
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(promptPayResult.payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#231620',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [open, promptPayResult]);

  if (!open) return null;

  const handleCopy = async (text: string, field: 'account' | 'promptpay') => {
    const label =
      field === 'account'
        ? `คัดลอกเลขที่บัญชี ${text} เรียบร้อยแล้ว`
        : `คัดลอกหมายเลขพร้อมเพย์ ${text} เรียบร้อยแล้ว`;
    try {
      await navigator.clipboard.writeText(text.replace(/\s+/g, ''));
      setCopiedField(field);
      onNotify?.(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for restricted clipboard environments
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      onNotify?.(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const suffix = promptPayResult.amount ? `_${promptPayResult.amount}THB` : '';
    link.href = qrDataUrl;
    link.download = `promptpay_${studioName.replace(/\s+/g, '_').toLowerCase()}${suffix}.png`;
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--portal-border)] px-6 py-4">
          <div>
            <h2
              id="payment-modal-title"
              className="font-display text-lg font-semibold text-[var(--portal-ink)]"
            >
              ช่องทางการโอนเงิน
            </h2>
            <p className="text-xs text-[var(--portal-muted)]">
              {studioName} · รองรับสแกน QR พร้อมเพย์ทุกธนาคาร
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างช่องทางการโอนเงิน"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--portal-border)] text-[var(--portal-ink)] transition-colors hover:bg-[var(--portal-surface-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Bank Account Details */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="border-b border-[var(--portal-border)] pb-3">
                <p className="text-xs text-[var(--portal-muted)]">ธนาคาร</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--portal-ink)]">
                  {bankInfo.bankName || 'ยังไม่ได้ระบุธนาคาร'}
                </p>
              </div>

              <div className="border-b border-[var(--portal-border)] pb-3">
                <p className="text-xs text-[var(--portal-muted)]">ชื่อบัญชี</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--portal-ink)]">
                  {bankInfo.accountName || 'ยังไม่ได้ระบุชื่อบัญชี'}
                </p>
              </div>

              <div className="border-b border-[var(--portal-border)] pb-3">
                <p className="text-xs text-[var(--portal-muted)]">เลขที่บัญชี</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono-num text-base font-semibold tracking-wide text-[var(--portal-ink)]">
                    {bankInfo.accountNumber || '-'}
                  </span>
                  {bankInfo.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.accountNumber, 'account')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
                    >
                      {copiedField === 'account' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                          คัดลอกแล้ว
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          คัดลอก
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-[var(--portal-muted)]">พร้อมเพย์ (PromptPay)</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono-num text-sm font-medium text-[var(--portal-ink)]">
                    {promptPayResult.formattedTarget || bankInfo.promptPayId || '-'}
                  </span>
                  {bankInfo.promptPayId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.promptPayId, 'promptpay')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] whitespace-nowrap shrink-0"
                    >
                      {copiedField === 'promptpay' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                          คัดลอกแล้ว
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          คัดลอก
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Amount Input */}
            <div className="rounded-xl bg-[var(--portal-surface-alt)] p-4">
              <label
                htmlFor="promptpay-amount-input"
                className="block text-xs font-semibold text-[var(--portal-ink)]"
              >
                ระบุยอดเงิน (บาท)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="promptpay-amount-input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="เช่น 450 หรือเว้นว่างเพื่อกรอกเอง"
                  className="font-mono-num w-full rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] px-3 py-2 text-sm text-[var(--portal-ink)] placeholder:font-sans placeholder:text-[var(--portal-muted)]/70"
                />
                {amountInput && (
                  <button
                    type="button"
                    onClick={() => setAmountInput('')}
                    className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface)] px-2.5 py-2 text-xs text-[var(--portal-muted)] hover:text-[var(--portal-ink)] whitespace-nowrap shrink-0"
                  >
                    ล้าง
                  </button>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountInput(String(val))}
                    className="font-mono-num rounded-md border border-[var(--portal-border)] bg-[var(--portal-surface)] px-2.5 py-1 text-xs font-medium text-[var(--portal-ink)] transition-colors hover:border-[var(--portal-primary)] hover:text-[var(--portal-primary)]"
                  >
                    ฿{formatBaht(val)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time EMVCo PromptPay QR Display */}
          <div className="flex flex-col items-center justify-between rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] p-5 text-center">
            <div className="w-full">
              <p className="font-display text-sm font-semibold text-[var(--portal-ink)]">
                Thai QR Payment · PromptPay
              </p>
              <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                มาตรฐาน EMVCo อัปเดตยอดอัตโนมัติ
              </p>
            </div>

            <div className="my-4 flex min-h-[212px] w-full items-center justify-center rounded-xl bg-white p-3 shadow-xs">
              {promptPayResult.valid && qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code พร้อมเพย์ ${promptPayResult.formattedTarget}${
                    promptPayResult.amount ? ` จำนวน ${promptPayResult.amount} บาท` : ''
                  }`}
                  className="h-[196px] w-[196px] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center px-3 text-center text-[var(--portal-muted)]">
                  <QrCode className="h-10 w-10 opacity-40" />
                  <p className="mt-2 text-xs">
                    {promptPayResult.error || 'ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ในระบบแอดมิน'}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full space-y-2.5">
              <div className="text-sm font-semibold text-[var(--portal-ink)]">
                {promptPayResult.amount !== null ? (
                  <span>
                    ยอดชำระ:{' '}
                    <span className="font-mono-num text-[var(--portal-primary)]">
                      {promptPayResult.amount.toLocaleString('th-TH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      บาท
                    </span>
                  </span>
                ) : (
                  <span className="text-xs font-normal text-[var(--portal-muted)]">
                    สแกนแล้วระบุยอดเงินได้เอง หรือพิมพ์ยอดด้านซ้าย
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={!qrDataUrl}
                onClick={handleDownloadQr}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                style={{ backgroundColor: 'var(--portal-primary)' }}
              >
                <Download className="h-4 w-4" />
                บันทึกรูป QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

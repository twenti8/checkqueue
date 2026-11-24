import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  expectedPassword: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  open,
  onClose,
  expectedPassword,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = (expectedPassword || '1234').trim();
    if (password.trim() === target) {
      setError('');
      setPassword('');
      onSuccess();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: 'var(--portal-primary)' }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="admin-login-title"
                className="font-display text-lg font-semibold text-[var(--portal-ink)]"
              >
                เข้าสู่ระบบแอดมิน
              </h2>
              <p className="text-xs text-[var(--portal-muted)]">
                จัดการคิวงาน ธีมสี รูปภาพ และบัญชีธนาคาร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบแอดมิน"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--portal-muted)] hover:bg-[var(--portal-surface-alt)] hover:text-[var(--portal-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-medium text-[var(--portal-ink)]"
            >
              รหัสผ่านแอดมิน
            </label>
            <input
              id="admin-password-input"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="กรอกรหัสผ่าน"
              className="mt-1.5 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--portal-ink)]"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--portal-border)] px-4 py-2 text-xs font-medium text-[var(--portal-ink)] hover:bg-[var(--portal-surface-alt)]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--portal-primary)' }}
            >
              เข้าสู่หลังบ้าน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

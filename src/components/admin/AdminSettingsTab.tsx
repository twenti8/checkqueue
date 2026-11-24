import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, KeyRound, Plus, Save, Store, Trash2 } from 'lucide-react';
import type {
  BankInfo,
  ProfileSettings,
  SocialLink,
  WorkStatusOption,
} from '../../types/portal';
import { generatePromptPayPayload } from '../../utils/promptpay';
import {
  AdminWorkflowOptionsCard,
  type WorkflowOptionsPayload,
} from './AdminWorkflowOptionsCard';

interface AdminSettingsTabProps {
  profile: ProfileSettings;
  customWorkTypes: string[];
  customWorkStatuses: WorkStatusOption[];
  customChannels: string[];
  onSaveProfile: (nextProfile: ProfileSettings, successLabel: string) => Promise<void>;
  onSaveWorkflowOptions: (payload: WorkflowOptionsPayload) => Promise<void>;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  profile,
  customWorkTypes,
  customWorkStatuses,
  customChannels,
  onSaveProfile,
  onSaveWorkflowOptions,
}) => {
  const [bankForm, setBankForm] = useState<BankInfo>(profile.bankInfo);
  const [storeForm, setStoreForm] = useState<ProfileSettings>(profile);
  const [newPassword, setNewPassword] = useState(profile.adminPassword || '1234');
  const [savingBank, setSavingBank] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    setBankForm(profile.bankInfo);
    setStoreForm(profile);
    setNewPassword(profile.adminPassword || '1234');
  }, [profile]);

  const promptPayCheck = useMemo(
    () => generatePromptPayPayload(bankForm.promptPayId),
    [bankForm.promptPayId]
  );

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const mergedProfile: ProfileSettings = {
        ...profile,
        bankInfo: {
          bankName: bankForm.bankName.trim(),
          accountName: bankForm.accountName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          promptPayId: bankForm.promptPayId.trim(),
        },
      };
      await onSaveProfile(mergedProfile, 'บันทึกข้อมูลบัญชีธนาคารและพร้อมเพย์เรียบร้อยแล้ว');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const mergedProfile: ProfileSettings = {
        ...storeForm,
        bankInfo: {
          bankName: bankForm.bankName.trim(),
          accountName: bankForm.accountName.trim(),
          accountNumber: bankForm.accountNumber.trim(),
          promptPayId: bankForm.promptPayId.trim(),
        },
        adminPassword: newPassword.trim() || '1234',
        socialLinks: storeForm.socialLinks.filter((s) => s.label.trim() && s.url.trim()),
      };
      await onSaveProfile(mergedProfile, 'บันทึกข้อมูลร้านค้า ลิงก์ และรหัสผ่านแอดมินเรียบร้อยแล้ว');
    } finally {
      setSavingStore(false);
    }
  };

  const handleAddSocialLink = () => {
    setStoreForm((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        {
          id: `soc-${Date.now()}`,
          label: 'ลิงก์ใหม่',
          url: 'https://',
          platform: 'web',
        },
      ],
    }));
  };

  const handleUpdateSocialLink = (
    id: string,
    field: keyof SocialLink,
    value: string
  ) => {
    setStoreForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemoveSocialLink = (id: string) => {
    setStoreForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((item) => item.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Work Types, Ordered Work Statuses & Order Channels */}
      <AdminWorkflowOptionsCard
        customWorkTypes={customWorkTypes}
        customWorkStatuses={customWorkStatuses}
        customChannels={customChannels}
        onSaveWorkflowOptions={onSaveWorkflowOptions}
      />

      {/* Bank Account & Automatic PromptPay QR Settings (NO QR Image Upload) */}
      <form
        onSubmit={handleSaveBankInfo}
        className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--portal-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-[var(--portal-primary)]" />
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
                ข้อมูลบัญชีธนาคารและพร้อมเพย์อัตโนมัติ
              </h3>
              <p className="text-xs text-[var(--portal-muted)]">
                ระบบจะสร้าง QR Code พร้อมเพย์จากเบอร์โทรหรือเลขบัตรประชาชนให้อัตโนมัติ ไม่ต้องอัปโหลดรูป QR
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingBank}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--portal-primary)' }}
          >
            <Save className="h-4 w-4" />
            {savingBank ? 'กำลังบันทึก...' : 'บันทึกข้อมูลบัญชี'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bank-name" className="block text-xs font-medium text-[var(--portal-ink)]">
              ชื่อธนาคาร
            </label>
            <input
              id="bank-name"
              type="text"
              value={bankForm.bankName}
              onChange={(e) => setBankForm((p) => ({ ...p, bankName: e.target.value }))}
              placeholder="เช่น ธนาคารกสิกรไทย (KBank)"
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="bank-acc-name" className="block text-xs font-medium text-[var(--portal-ink)]">
              ชื่อบัญชี
            </label>
            <input
              id="bank-acc-name"
              type="text"
              value={bankForm.accountName}
              onChange={(e) => setBankForm((p) => ({ ...p, accountName: e.target.value }))}
              placeholder="เช่น นางสาว โมโม่ พาสเทล"
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="bank-acc-num" className="block text-xs font-medium text-[var(--portal-ink)]">
              เลขที่บัญชี
            </label>
            <input
              id="bank-acc-num"
              type="text"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm((p) => ({ ...p, accountNumber: e.target.value }))}
              placeholder="เช่น 098-1-23456-7"
              className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="bank-promptpay" className="block text-xs font-medium text-[var(--portal-ink)]">
              เบอร์โทรศัพท์พร้อมเพย์ / เลขบัตรประชาชน (สำหรับสร้าง QR อัตโนมัติ)
            </label>
            <input
              id="bank-promptpay"
              type="text"
              value={bankForm.promptPayId}
              onChange={(e) => setBankForm((p) => ({ ...p, promptPayId: e.target.value }))}
              placeholder="เบอร์ 10 หลัก (08x...) หรือบัตรประชาชน 13 หลัก"
              className="font-mono-num mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2.5 text-sm text-[var(--portal-ink)]"
            />
            <p
              className="mt-1 text-xs"
              style={{ color: promptPayCheck.valid ? '#287D52' : '#B9384F' }}
            >
              {promptPayCheck.valid
                ? `พร้อมสร้าง QR พร้อมเพย์อัตโนมัติ (${promptPayCheck.formattedTarget})`
                : promptPayCheck.error}
            </p>
          </div>
        </div>
      </form>

      {/* Store Profile, Bio-Links & Admin Password */}
      <form
        onSubmit={handleSaveStoreInfo}
        className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-6"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--portal-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Store className="h-5 w-5 text-[var(--portal-primary)]" />
            <div>
              <h3 className="font-display text-lg font-semibold text-[var(--portal-ink)]">
                ข้อมูลร้านค้า ลิงก์ Bio-Link และรหัสผ่านแอดมิน
              </h3>
              <p className="text-xs text-[var(--portal-muted)]">
                ปรับแต่งชื่อร้าน คำแนะนำตัว ลิงก์ช่องทางติดต่อ และรหัสผ่านสำหรับเข้าสู่ระบบ
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingStore}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--portal-primary)' }}
          >
            <Save className="h-4 w-4" />
            {savingStore ? 'กำลังบันทึก...' : 'บันทึกข้อมูลร้านค้า'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="store-name" className="block text-xs font-medium text-[var(--portal-ink)]">
              ชื่อร้าน / สตูดิโอ
            </label>
            <input
              id="store-name"
              type="text"
              value={storeForm.studioName}
              onChange={(e) => setStoreForm((p) => ({ ...p, studioName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="store-handle" className="block text-xs font-medium text-[var(--portal-ink)]">
              ชื่อแอคเคาท์ (@handle)
            </label>
            <input
              id="store-handle"
              type="text"
              value={storeForm.handle}
              onChange={(e) => setStoreForm((p) => ({ ...p, handle: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="store-tagline" className="block text-xs font-medium text-[var(--portal-ink)]">
              คำโปรยสั้นๆ (Tagline)
            </label>
            <input
              id="store-tagline"
              type="text"
              value={storeForm.tagline}
              onChange={(e) => setStoreForm((p) => ({ ...p, tagline: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="store-bio" className="block text-xs font-medium text-[var(--portal-ink)]">
              คำแนะนำตัวสตูดิโอ (Bio)
            </label>
            <textarea
              id="store-bio"
              rows={2}
              value={storeForm.bio}
              onChange={(e) => setStoreForm((p) => ({ ...p, bio: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="store-note" className="block text-xs font-medium text-[var(--portal-ink)]">
              ประกาศรอบคิวงาน
            </label>
            <input
              id="store-note"
              type="text"
              value={storeForm.commissionNote}
              onChange={(e) => setStoreForm((p) => ({ ...p, commissionNote: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div>
            <label htmlFor="store-price" className="block text-xs font-medium text-[var(--portal-ink)]">
              ราคาเริ่มต้น
            </label>
            <input
              id="store-price"
              type="text"
              value={storeForm.priceStarting}
              onChange={(e) => setStoreForm((p) => ({ ...p, priceStarting: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="store-tos" className="block text-xs font-medium text-[var(--portal-ink)]">
              สรุปข้อตกลงคอมมิชชัน (TOS)
            </label>
            <textarea
              id="store-tos"
              rows={2}
              value={storeForm.tosSummary}
              onChange={(e) => setStoreForm((p) => ({ ...p, tosSummary: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              checked={storeForm.commissionOpen}
              onChange={(e) =>
                setStoreForm((p) => ({ ...p, commissionOpen: e.target.checked }))
              }
              className="h-4 w-4 rounded accent-[var(--portal-primary)]"
            />
            <span className="text-sm font-medium text-[var(--portal-ink)]">
              เปิดรับคิวคอมมิชชันอยู่ (แสดงสถานะเปิดรับคิวบนหน้าแรก)
            </span>
          </label>
        </div>

        {/* Bio Links Editor */}
        <div className="mt-6 border-t border-[var(--portal-border)] pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--portal-ink)]">
              รายการลิงก์ Bio-Link
            </h4>
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-1.5 text-xs font-semibold text-[var(--portal-ink)] hover:border-[var(--portal-primary)]"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มลิงก์
            </button>
          </div>

          <div className="space-y-2.5">
            {storeForm.socialLinks.map((link) => (
              <div key={link.id} className="grid gap-2 sm:grid-cols-12">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleUpdateSocialLink(link.id, 'label', e.target.value)}
                  aria-label="ชื่อปุ่มลิงก์"
                  placeholder="ชื่อช่องทาง เช่น X (Twitter)"
                  className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)] sm:col-span-4"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleUpdateSocialLink(link.id, 'url', e.target.value)}
                  aria-label="URL ลิงก์"
                  placeholder="https://..."
                  className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3 py-2 text-sm text-[var(--portal-ink)] sm:col-span-7"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(link.id)}
                  aria-label={`ลบลิงก์ ${link.label}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 sm:col-span-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Password Section */}
        <div className="mt-6 border-t border-[var(--portal-border)] pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--portal-ink)]">
            <KeyRound className="h-4 w-4 text-[var(--portal-primary)]" />
            <span>รหัสผ่านเข้าสู่ระบบแอดมิน</span>
          </div>
          <div className="mt-2.5 max-w-xs">
            <label htmlFor="admin-new-pass" className="sr-only">
              รหัสผ่านแอดมินใหม่
            </label>
            <input
              id="admin-new-pass"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่"
              className="font-mono-num w-full rounded-xl border border-[var(--portal-border)] bg-[var(--portal-surface-alt)] px-3.5 py-2 text-sm text-[var(--portal-ink)]"
            />
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              เปลี่ยนรหัสผ่านแล้วกดปุ่ม “บันทึกข้อมูลร้านค้า” ด้านบนเพื่ออัปเดต
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export type WorkStatus = string;

export type StatusColorId =
  | 'gray'
  | 'yellow'
  | 'sky'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'green';

export interface WorkStatusOption {
  id: string;
  label: string;
  color: StatusColorId;
}

export type PaymentStatus = 'unpaid' | 'deposit' | 'paid';

export interface BankInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'line' | 'tiktok' | 'web';
}

export interface ProfileSettings {
  studioName: string;
  handle: string;
  tagline: string;
  bio: string;
  commissionOpen: boolean;
  commissionNote: string;
  tosSummary: string;
  priceStarting: string;
  adminPassword: string;
  bankInfo: BankInfo;
  socialLinks: SocialLink[];
}

export interface CustomThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  secondary: string;
  ink: string;
  muted: string;
}

export interface PastelThemePreset {
  id: string;
  name: string;
  nameTh: string;
  colors: CustomThemeColors;
}

export type BackgroundEffectId =
  | 'none'
  | 'sakura'
  | 'stars'
  | 'hearts'
  | 'bubbles'
  | 'clouds'
  | 'sparkles'
  | 'confetti'
  | 'snow'
  | 'butterflies'
  | 'ribbons'
  | 'polka'
  | 'grid-glow';

export type ImageSlotKey =
  | 'img_avatar'
  | 'img_cover'
  | 'img_icon'
  | 'img_banner'
  | 'img_portfolio_1'
  | 'img_portfolio_2'
  | 'img_portfolio_3'
  | 'img_portfolio_4'
  | 'img_portfolio_5'
  | 'img_portfolio_6';

export type PortalImages = Partial<Record<ImageSlotKey, string>>;

export interface QueueItem {
  id: string;
  queueNo: string;
  clientName: string;
  workType: string;
  channel: string;
  details: string;
  fullPrice: number;
  paidAmount: number;
  month: number;
  year: number;
  deadline: string;
  paymentStatus: PaymentStatus;
  workStatus: WorkStatus;
  isRush: boolean;
  sortOrder: number;
}

export interface ReviewItem {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  points: number;
  date: string;
  workType?: string;
}

export interface PortalData {
  profile: ProfileSettings;
  activeThemeId: string;
  customThemeColors: CustomThemeColors;
  backgroundEffect: BackgroundEffectId;
  images: PortalImages;
  queues: QueueItem[];
  reviews: ReviewItem[];
  customWorkTypes: string[];
  customWorkStatuses: WorkStatusOption[];
  customChannels: string[];
}

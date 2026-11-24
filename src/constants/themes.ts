import type {
  BackgroundEffectId,
  CustomThemeColors,
  ImageSlotKey,
  PastelThemePreset,
  ProfileSettings,
  QueueItem,
  ReviewItem,
} from '../types/portal';

export const DEFAULT_ASSETS = {
  avatar: '/src/assets/images/kawaii_studio_avatar_1795485705770.jpg',
  cover: '/src/assets/images/kawaii_studio_cover_1795485706462.jpg',
  portfolio: [
    {
      key: 'img_portfolio_1' as ImageSlotKey,
      src: '/src/assets/images/portfolio_pastel_portrait_1795485705431.jpg',
      title: 'Pastel Portrait Bust-Up',
      category: 'Bust-Up Full Color',
    },
    {
      key: 'img_portfolio_2' as ImageSlotKey,
      src: '/src/assets/images/portfolio_chibi_cafe_1795485705016.jpg',
      title: 'Bunny Barista Chibi',
      category: 'Chibi Character',
    },
    {
      key: 'img_portfolio_3' as ImageSlotKey,
      src: '/src/assets/images/portfolio_dreamy_fantasy_1795485704772.jpg',
      title: 'Crescent Moon Witch',
      category: 'Full Illustration',
    },
    {
      key: 'img_portfolio_4' as ImageSlotKey,
      src: '/src/assets/images/kawaii_studio_cover_1795485706462.jpg',
      title: 'Sakura Window Studio',
      category: 'Background Scene',
    },
    {
      key: 'img_portfolio_5' as ImageSlotKey,
      src: '/src/assets/images/portfolio_chibi_cafe_1795485705016.jpg',
      title: 'Sweet Cafe Mascot',
      category: 'Chibi Package',
    },
    {
      key: 'img_portfolio_6' as ImageSlotKey,
      src: '/src/assets/images/kawaii_studio_avatar_1795485705770.jpg',
      title: 'Strawberry Atelier Icon',
      category: 'Icon & Avatar',
    },
  ],
};

export const PASTEL_THEMES: PastelThemePreset[] = [
  {
    id: 'strawberry-milk',
    name: 'Strawberry Milk',
    nameTh: 'นมสตรอว์เบอร์รี',
    colors: {
      bg: '#FFF7FA',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF0F5',
      border: '#F7D8E5',
      primary: '#E86A92',
      secondary: '#F7B2C8',
      ink: '#3C2330',
      muted: '#7B5A6B',
    },
  },
  {
    id: 'sakura-blossom',
    name: 'Sakura Blossom',
    nameTh: 'ซากุระบาน',
    colors: {
      bg: '#FFF8FA',
      surface: '#FFFFFF',
      surfaceAlt: '#FCEEF3',
      border: '#F3D1DF',
      primary: '#D95D89',
      secondary: '#F2A9C2',
      ink: '#3A222E',
      muted: '#745666',
    },
  },
  {
    id: 'peach-soda',
    name: 'Peach Soda',
    nameTh: 'พีชโซดา',
    colors: {
      bg: '#FFF9F5',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF1E8',
      border: '#F7D9C6',
      primary: '#E07452',
      secondary: '#F9B89E',
      ink: '#3E271E',
      muted: '#7E5E52',
    },
  },
  {
    id: 'lavender-mist',
    name: 'Lavender Mist',
    nameTh: 'ลาเวนเดอร์มิสต์',
    colors: {
      bg: '#FAF8FF',
      surface: '#FFFFFF',
      surfaceAlt: '#F2ECFF',
      border: '#E1D4F7',
      primary: '#8A67D6',
      secondary: '#C5B1F5',
      ink: '#2C2342',
      muted: '#655A82',
    },
  },
  {
    id: 'baby-sky',
    name: 'Baby Sky',
    nameTh: 'ท้องฟ้าพาสเทล',
    colors: {
      bg: '#F6FAFF',
      surface: '#FFFFFF',
      surfaceAlt: '#EAF3FF',
      border: '#CFE2FA',
      primary: '#4E8CD9',
      secondary: '#A1C7F5',
      ink: '#1E2E45',
      muted: '#556B87',
    },
  },
  {
    id: 'matcha-cream',
    name: 'Matcha Cream',
    nameTh: 'มัทฉะครีม',
    colors: {
      bg: '#F8FBF6',
      surface: '#FFFFFF',
      surfaceAlt: '#EDF6E8',
      border: '#D3E6C8',
      primary: '#5F9A5B',
      secondary: '#ACD3A8',
      ink: '#223522',
      muted: '#576E56',
    },
  },
  {
    id: 'mint-macaron',
    name: 'Mint Macaron',
    nameTh: 'มินต์มาการอง',
    colors: {
      bg: '#F5FCFA',
      surface: '#FFFFFF',
      surfaceAlt: '#E6F7F2',
      border: '#C5E9DF',
      primary: '#3B9E88',
      secondary: '#94D9C9',
      ink: '#1C3630',
      muted: '#4E7068',
    },
  },
  {
    id: 'buttercup-honey',
    name: 'Buttercup Honey',
    nameTh: 'น้ำผึ้งบัตเตอร์คัพ',
    colors: {
      bg: '#FFFDF4',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF7DC',
      border: '#F2E1A8',
      primary: '#C98A1F',
      secondary: '#F5CF74',
      ink: '#3C2F16',
      muted: '#7A6845',
    },
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    nameTh: 'สายไหมพาสเทล',
    colors: {
      bg: '#FCF8FF',
      surface: '#FFFFFF',
      surfaceAlt: '#F8EEFF',
      border: '#E9D2F7',
      primary: '#C864B6',
      secondary: '#9AC8F7',
      ink: '#36213C',
      muted: '#72567A',
    },
  },
  {
    id: 'taro-latte',
    name: 'Taro Latte',
    nameTh: 'ทาโร่ลาเต้',
    colors: {
      bg: '#FAF7FC',
      surface: '#FFFFFF',
      surfaceAlt: '#F1EAF6',
      border: '#DFD2EA',
      primary: '#8E6FA8',
      secondary: '#C7B0DB',
      ink: '#2F243A',
      muted: '#695C78',
    },
  },
  {
    id: 'lemon-sorbet',
    name: 'Lemon Sorbet',
    nameTh: 'เลมอนซอร์เบต์',
    colors: {
      bg: '#FEFFF5',
      surface: '#FFFFFF',
      surfaceAlt: '#F7F9DE',
      border: '#E4E8B5',
      primary: '#979E28',
      secondary: '#DCE085',
      ink: '#323516',
      muted: '#6B6E47',
    },
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    nameTh: 'โรสควอตซ์',
    colors: {
      bg: '#FDF8F9',
      surface: '#FFFFFF',
      surfaceAlt: '#F8ECEF',
      border: '#EAD3D9',
      primary: '#C4687F',
      secondary: '#E5ABB9',
      ink: '#3A2329',
      muted: '#765961',
    },
  },
  {
    id: 'blueberry-yogurt',
    name: 'Blueberry Yogurt',
    nameTh: 'บลูเบอร์รีโยเกิร์ต',
    colors: {
      bg: '#F7F8FF',
      surface: '#FFFFFF',
      surfaceAlt: '#ECEFFF',
      border: '#D3D9FA',
      primary: '#5D6FD4',
      secondary: '#A6B2F5',
      ink: '#222745',
      muted: '#5A6185',
    },
  },
  {
    id: 'apricot-jam',
    name: 'Apricot Jam',
    nameTh: 'แยมแอปริคอต',
    colors: {
      bg: '#FFFAF4',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF0DF',
      border: '#F5D6B5',
      primary: '#D97B38',
      secondary: '#F5BA8C',
      ink: '#3D2818',
      muted: '#7A5E49',
    },
  },
  {
    id: 'vanilla-cloud',
    name: 'Vanilla Cloud',
    nameTh: 'วานิลลาคลาวด์',
    colors: {
      bg: '#FCFBF8',
      surface: '#FFFFFF',
      surfaceAlt: '#F5F1E9',
      border: '#E6DFD1',
      primary: '#A37A5E',
      secondary: '#D9C0AC',
      ink: '#332922',
      muted: '#6E6158',
    },
  },
];

export const BACKGROUND_EFFECTS: Array<{
  id: BackgroundEffectId;
  name: string;
  nameTh: string;
  description: string;
}> = [
  { id: 'none', name: 'None', nameTh: 'ปิดเอฟเฟกต์', description: 'พื้นหลังเรียบสะอาดตา' },
  { id: 'sakura', name: 'Sakura Petals', nameTh: 'กลีบซากุระปลิว', description: 'กลีบดอกไม้สีพาสเทลลอยช้าๆ' },
  { id: 'stars', name: 'Twinkle Stars', nameTh: 'ดาวระยิบระยับ', description: 'หมู่ดาวจิ๋วส่องประกายเบาๆ' },
  { id: 'hearts', name: 'Floating Hearts', nameTh: 'หัวใจลอยฟุ้ง', description: 'หัวใจพาสเทลลอยขึ้นอย่างนุ่มนวล' },
  { id: 'bubbles', name: 'Pastel Bubbles', nameTh: 'ฟองสบู่พาสเทล', description: 'ฟองอากาศใสโปร่งลอยทั่วหน้าจอ' },
  { id: 'clouds', name: 'Soft Clouds', nameTh: 'ก้อนเมฆลอย', description: 'ปุยเมฆนุ่มละมุนเคลื่อนไหวช้าๆ' },
  { id: 'sparkles', name: 'Dream Sparkles', nameTh: 'ประกายวิบวับ', description: 'จุดประกายแสงแฟร์รี่ขนาดเล็ก' },
  { id: 'confetti', name: 'Pastel Confetti', nameTh: 'คอนเฟตติพาสเทล', description: 'กระดาษสีพาสเทลโปรยปราย' },
  { id: 'snow', name: 'Soft Snowfall', nameTh: 'หิมะโปรยเบา', description: 'เกล็ดหิมะนุ่มๆ ตกอย่างสงบ' },
  { id: 'butterflies', name: 'Paper Butterflies', nameTh: 'ผีเสื้อพาสเทล', description: 'ผีเสื้อจิ๋วโบยบินข้ามฉาก' },
  { id: 'ribbons', name: 'Floating Ribbons', nameTh: 'ริบบิ้นพลิ้วไหว', description: 'โบว์และเส้นริบบิ้นพาสเทล' },
  { id: 'polka', name: 'Kawaii Polka Dots', nameTh: 'ลายจุดพอลก้าดอท', description: 'แพตเทิร์นจุดพาสเทลน่ารัก' },
  { id: 'grid-glow', name: 'Sketchbook Grid', nameTh: 'กริดสมุดวาดภาพ', description: 'เส้นตารางสมุดสเก็ตช์อ่อนๆ' },
];

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = PASTEL_THEMES[0].colors;

export const DEFAULT_PROFILE: ProfileSettings = {
  studioName: 'Momo Pastel Studio',
  handle: '@momopastel.art',
  tagline: 'รับวาดคอมมิชชันสไตล์พาสเทลคาวาอี้ · จิบิ · โปรไฟล์ · ภาพประกอบ',
  bio: 'สตูดิโอวาดภาพดิจิทัลโทนพาสเทลละมุน ดูแลทุกคิวด้วยความใส่ใจ สามารถตรวจสอบสถานะงานแบบเรียลไทม์ สะสมแต้มลูกค้าประจำ และชำระเงินผ่านพร้อมเพย์ได้ในหน้าเดียว',
  commissionOpen: true,
  commissionNote: 'เปิดรับคิวรอบเดือนนี้ 8 คิว · ระยะเวลาทำงาน 5–10 วัน',
  tosSummary:
    'ชำระมัดจำ 50% ก่อนเริ่มร่างภาพ แก้ไขงานได้ฟรี 2 ครั้งในขั้นตอนร่าง และส่งไฟล์ PNG ความละเอียดสูงทาง Google Drive / Email',
  priceStarting: 'เริ่มต้น 350 บาท',
  adminPassword: '1234',
  bankInfo: {
    bankName: 'ธนาคารกสิกรไทย (KBank)',
    accountName: 'นางสาว โมโม่ พาสเทล',
    accountNumber: '098-1-23456-7',
    promptPayId: '0891234567',
  },
  socialLinks: [
    { id: 'soc-1', label: 'X (Twitter)', url: 'https://x.com', platform: 'twitter' },
    { id: 'soc-2', label: 'Facebook Page', url: 'https://facebook.com', platform: 'facebook' },
    { id: 'soc-3', label: 'Instagram', url: 'https://instagram.com', platform: 'instagram' },
    { id: 'soc-4', label: 'LINE Official', url: 'https://line.me', platform: 'line' },
  ],
};

export const WORK_STATUS_META: Record<
  QueueItem['workStatus'],
  { label: string; color: string; bg: string; step: number }
> = {
  waiting: { label: 'รอคิว', color: '#7B5A6B', bg: '#F7EEF3', step: 1 },
  sketch: { label: 'ร่างภาพ', color: '#B4690E', bg: '#FEF4E6', step: 2 },
  lineart: { label: 'ตัดเส้น', color: '#5D56B8', bg: '#EFEFFE', step: 3 },
  coloring: { label: 'ลงสี', color: '#C94E7A', bg: '#FDECF2', step: 4 },
  done: { label: 'เสร็จสิ้น', color: '#287D52', bg: '#E7F6EE', step: 5 },
};

export const PAYMENT_STATUS_META: Record<
  QueueItem['paymentStatus'],
  { label: string; color: string }
> = {
  unpaid: { label: 'ยังไม่ชำระ', color: '#B9384F' },
  deposit: { label: 'มัดจำแล้ว', color: '#B4690E' },
  paid: { label: 'ชำระครบแล้ว', color: '#287D52' },
};

export const IMAGE_SLOT_CONFIG: Array<{
  key: ImageSlotKey;
  label: string;
  description: string;
  maxWidth: number;
  group: 'brand' | 'portfolio';
}> = [
  {
    key: 'img_avatar',
    label: 'รูปโปรไฟล์สตูดิโอ (Avatar)',
    description: 'ย่อขนาดอัตโนมัติสูงสุด 250px · เก็บลงคีย์ img_avatar',
    maxWidth: 250,
    group: 'brand',
  },
  {
    key: 'img_icon',
    label: 'ไอคอนเว็บไซต์ (Favicon / Icon)',
    description: 'ย่อขนาดอัตโนมัติสูงสุด 250px · เก็บลงคีย์ img_icon',
    maxWidth: 250,
    group: 'brand',
  },
  {
    key: 'img_cover',
    label: 'รูปปกด้านบน (Cover)',
    description: 'ย่อขนาดอัตโนมัติสูงสุด 600px · เก็บลงคีย์ img_cover',
    maxWidth: 600,
    group: 'brand',
  },
  {
    key: 'img_banner',
    label: 'แบนเนอร์ประกาศ/โปรโมชัน (Banner)',
    description: 'ย่อขนาดอัตโนมัติสูงสุด 600px · เก็บลงคีย์ img_banner',
    maxWidth: 600,
    group: 'brand',
  },
  {
    key: 'img_portfolio_1',
    label: 'ผลงานสไลด์ที่ 1',
    description: '3D Carousel ช่องที่ 1 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
  {
    key: 'img_portfolio_2',
    label: 'ผลงานสไลด์ที่ 2',
    description: '3D Carousel ช่องที่ 2 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
  {
    key: 'img_portfolio_3',
    label: 'ผลงานสไลด์ที่ 3',
    description: '3D Carousel ช่องที่ 3 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
  {
    key: 'img_portfolio_4',
    label: 'ผลงานสไลด์ที่ 4',
    description: '3D Carousel ช่องที่ 4 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
  {
    key: 'img_portfolio_5',
    label: 'ผลงานสไลด์ที่ 5',
    description: '3D Carousel ช่องที่ 5 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
  {
    key: 'img_portfolio_6',
    label: 'ผลงานสไลด์ที่ 6',
    description: '3D Carousel ช่องที่ 6 · maxWidth 600px',
    maxWidth: 600,
    group: 'portfolio',
  },
];

export const THAI_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

// Optional preview samples shown ONLY when the live sheet has not been populated yet,
// never written to Google Sheets unless the admin creates real rows.
export const EMPTY_STATE_HINTS: {
  sampleQueues: QueueItem[];
  sampleReviews: ReviewItem[];
} = {
  sampleQueues: [],
  sampleReviews: [],
};

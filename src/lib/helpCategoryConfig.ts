import { HelpCategoryConfig } from '@/types/helpCenter';

// Static category metadata for icons and display names
// The article counts come from the database via hooks
// 6-category Airalo-style structure
export const HELP_CATEGORY_CONFIG: Record<string, HelpCategoryConfig> = {
  'about-mobile11': {
    id: '1',
    slug: 'about-mobile11',
    name: 'About Mobile11',
    nameTh: 'เกี่ยวกับ Mobile11',
    nameJa: 'Mobile11について',
    description: 'Learn about Mobile11 and eSIM technology',
    descriptionTh: 'เรียนรู้เกี่ยวกับ Mobile11 และเทคโนโลยี eSIM',
    icon: 'info'
  },
  'getting-started': {
    id: '2',
    slug: 'getting-started',
    name: 'Getting Started',
    nameTh: 'เริ่มต้นใช้งาน',
    nameJa: 'はじめに',
    description: 'How to purchase, install, and activate your eSIM',
    descriptionTh: 'วิธีซื้อ ติดตั้ง และเปิดใช้งาน eSIM',
    icon: 'rocket'
  },
  'using-esim': {
    id: '3',
    slug: 'using-esim',
    name: 'Using & Managing eSIMs',
    nameTh: 'การใช้งานและจัดการ eSIM',
    nameJa: 'eSIMの使い方と管理',
    description: 'Data usage, hotspot, top-ups, and eSIM management',
    descriptionTh: 'การใช้ข้อมูล ฮอตสปอต เติมเงิน และการจัดการ eSIM',
    icon: 'smartphone'
  },
  'account': {
    id: '4',
    slug: 'account',
    name: 'My Account & Mobile11 Money',
    nameTh: 'บัญชีของฉันและ Mobile11 Money',
    nameJa: 'マイアカウント & Mobile11マネー',
    description: 'Manage your account, orders, payments, and rewards',
    descriptionTh: 'จัดการบัญชี คำสั่งซื้อ การชำระเงิน และรางวัล',
    icon: 'user'
  },
  'troubleshoot': {
    id: '5',
    slug: 'troubleshoot',
    name: 'Troubleshooting',
    nameTh: 'การแก้ไขปัญหา',
    nameJa: 'トラブルシューティング',
    description: "Solutions when your eSIM isn't working",
    descriptionTh: 'วิธีแก้ปัญหาเมื่อ eSIM ไม่ทำงาน',
    icon: 'wrench'
  },
  'affiliate': {
    id: '6',
    slug: 'affiliate',
    name: 'Affiliates & Partnerships',
    nameTh: 'พันธมิตรและพาร์ทเนอร์',
    nameJa: 'アフィリエイト＆パートナーシップ',
    description: 'Join our affiliate and partnership programs',
    descriptionTh: 'เข้าร่วมโปรแกรมพันธมิตรและพาร์ทเนอร์',
    icon: 'gift'
  }
};

// Get all categories as an array (in display order)
export function getHelpCategories(): HelpCategoryConfig[] {
  return Object.values(HELP_CATEGORY_CONFIG);
}

// Get category by slug
export function getHelpCategoryBySlug(slug: string): HelpCategoryConfig | undefined {
  return HELP_CATEGORY_CONFIG[slug];
}

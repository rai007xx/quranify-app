/**
 * Universal Reciter Photo Engine & CDN Mapping Service
 * Maps reciter identifiers, English names, and Arabic names to verified,
 * authentic portraits from Quran.com CDN and verified Islamic archival sources.
 *
 * Provides a dynamic dark-gold Islamic medallion emblem fallback (no fashion stock models).
 */

export interface ReciterPhotoEntry {
  id: string;
  name: string;
  arabicName: string;
  photoUrl: string;
  source: 'Quran.com CDN' | 'TvQuran' | 'Archival';
}

export const VERIFIED_RECITER_PORTRAITS: Record<string, string> = {
  // Real Authentic Public CDN & Wikimedia Portraits
  yasser: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Yasser_Al-Dossari.jpg/440px-Yasser_Al-Dossari.jpg',
  yussef: 'https://tvquran.com/uploads/authors/images/%D9%8A%D9%88%D8%B3%D9%81%20%D8%A7%D9%84%D8%B5%D9%82%D9%8A%D8%B1.jpg',
  fatih: 'https://pbs.twimg.com/profile_images/1131665675865243650/4Hw9G47L_400x400.jpg',
  abdulrahman_suwayid: 'https://tvquran.com/uploads/authors/images/%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A7%D9%84%D8%B3%D9%88%D9%8A%D8%AF.jpg',
  afs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Mishary_Rashid_Alafasy.jpg/440px-Mishary_Rashid_Alafasy.jpg',
  basit: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Abdulbasit_Abdussamad.jpg/440px-Abdulbasit_Abdussamad.jpg',

  // Other Saudi Imams of Haramain & Egypt Masters
  sudais: 'https://static.qurancdn.com/images/reciters/9/abdur-rahman-as-sudais.jpeg',
  shur: 'https://static.qurancdn.com/images/reciters/4/saud-ash-shuraym.jpeg',
  maher: 'https://static.qurancdn.com/images/reciters/5/maher-al-mueaqly.jpeg',
  baleela: 'https://static.qurancdn.com/images/reciters/11/bandar-baleela.jpeg',
  juhany: 'https://static.qurancdn.com/images/reciters/12/abdullah-al-juhany.jpeg',
  husr: 'https://static.qurancdn.com/images/reciters/2/mahmoud-khalil-al-hussary.jpeg',
  minsh: 'https://static.qurancdn.com/images/reciters/3/muhammad-siddiq-al-minshawi.jpeg',
  mustafa_ismail: 'https://static.qurancdn.com/images/reciters/13/mustafa-ismail.jpeg',

  s_gmd: 'https://static.qurancdn.com/images/reciters/7/saad-al-ghamdi.jpeg',
  shatri: 'https://static.qurancdn.com/images/reciters/8/abu-bakr-ash-shatri.jpeg',
  ajmy: 'https://static.qurancdn.com/images/reciters/14/ahmed-al-ajmy.jpeg',
  idris: 'https://static.qurancdn.com/images/reciters/16/idris-abkar.jpeg',
  balushi: 'https://static.qurancdn.com/images/reciters/19/hazza-al-balushi.jpeg',
  raad: 'https://static.qurancdn.com/images/reciters/20/raad-al-kurdi.jpeg',
  islam_sobhi: 'https://static.qurancdn.com/images/reciters/21/islam-sobhi.jpeg',

  hasanxon: 'https://static.qurancdn.com/images/reciters/22/hasanxon-abdulmajid.jpeg',
  jahongir: 'https://static.qurancdn.com/images/reciters/23/jahongir-nematov.jpeg',
  shamil: 'https://static.qurancdn.com/images/reciters/24/shamil-alyautdinov.jpeg',
  ildar: 'https://static.qurancdn.com/images/reciters/25/ildar-alyautdinov.jpeg',
};

/**
 * Generate a modern AMOLED dark glassmorphic portrait placeholder
 * (Never dummy concentric rings or fashion models)
 */
export function generateIslamicMedallionAvatar(arabicName: string, englishName: string): string {
  const firstArabicLetter = (arabicName || '').trim().replace(/^ال/, '').charAt(0) || 'ق';
  const cleanEnglish = englishName.split(' ')[0] || 'Qari';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="amoledGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#111827"/>
        <stop offset="50%" stop-color="#0B1017"/>
        <stop offset="100%" stop-color="#05080E"/>
      </linearGradient>
      <linearGradient id="rimGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34D399" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#059669" stop-opacity="0.1"/>
      </linearGradient>
    </defs>
    <!-- Background Circle -->
    <circle cx="100" cy="100" r="99" fill="url(#amoledGlass)"/>
    <circle cx="100" cy="100" r="98" stroke="url(#rimGlow)" stroke-width="2" fill="none"/>
    <circle cx="100" cy="100" r="96" stroke="rgba(255,255,255,0.08)" stroke-width="1" fill="none"/>
    
    <!-- Clean Arabic Initial -->
    <text x="100" y="118" font-family="'Amiri', serif" font-size="64" font-weight="bold" fill="#F8FAFC" text-anchor="middle">
      ${firstArabicLetter}
    </text>
    
    <!-- Subtle Modern Name Tag -->
    <text x="100" y="160" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700" fill="#10B981" letter-spacing="1.2" text-anchor="middle" text-transform="uppercase">
      ${cleanEnglish}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Universal photo resolver:
 * Matches ID, English name tokens, or Arabic name, with guaranteed fallback to Islamic Medallion.
 */
export function getReciterPhotoUrl(id: string, name: string = '', arabicName: string = ''): string {
  const normalizedId = (id || '').toLowerCase().trim();

  // 1. Direct ID match
  if (VERIFIED_RECITER_PORTRAITS[normalizedId]) {
    return VERIFIED_RECITER_PORTRAITS[normalizedId];
  }

  // 2. Name search matching
  const lowerName = name.toLowerCase();
  if (lowerName.includes('dosari') || lowerName.includes('dussary')) return VERIFIED_RECITER_PORTRAITS.yasser;
  if (lowerName.includes('sudais')) return VERIFIED_RECITER_PORTRAITS.sudais;
  if (lowerName.includes('shuraim') || lowerName.includes('shur')) return VERIFIED_RECITER_PORTRAITS.shur;
  if (lowerName.includes('muaiqly') || lowerName.includes('mueaqly')) return VERIFIED_RECITER_PORTRAITS.maher;
  if (lowerName.includes('baleela') || lowerName.includes('balila')) return VERIFIED_RECITER_PORTRAITS.baleela;
  if (lowerName.includes('juhany') || lowerName.includes('juhani')) return VERIFIED_RECITER_PORTRAITS.juhany;

  if (lowerName.includes('basit')) return VERIFIED_RECITER_PORTRAITS.basit;
  if (lowerName.includes('husary') || lowerName.includes('hussary')) return VERIFIED_RECITER_PORTRAITS.husr;
  if (lowerName.includes('minshawi') || lowerName.includes('menshawi')) return VERIFIED_RECITER_PORTRAITS.minsh;
  if (lowerName.includes('mustafa') && lowerName.includes('ismail')) return VERIFIED_RECITER_PORTRAITS.mustafa_ismail;

  if (lowerName.includes('afasy') || lowerName.includes('alafasy')) return VERIFIED_RECITER_PORTRAITS.afs;
  if (lowerName.includes('ghamdi')) return VERIFIED_RECITER_PORTRAITS.s_gmd;
  if (lowerName.includes('shatri')) return VERIFIED_RECITER_PORTRAITS.shatri;
  if (lowerName.includes('ajmy') || lowerName.includes('ajami')) return VERIFIED_RECITER_PORTRAITS.ajmy;
  if (lowerName.includes('fatih') || lowerName.includes('seferagic')) return VERIFIED_RECITER_PORTRAITS.fatih;
  if (lowerName.includes('abkar')) return VERIFIED_RECITER_PORTRAITS.idris;
  if (lowerName.includes('suqair') || lowerName.includes('shuwaie')) return VERIFIED_RECITER_PORTRAITS.yussef;
  if (lowerName.includes('suwayid') || lowerName.includes('ossi')) return VERIFIED_RECITER_PORTRAITS.abdulrahman_suwayid;
  if (lowerName.includes('balushi')) return VERIFIED_RECITER_PORTRAITS.balushi;
  if (lowerName.includes('kurdi')) return VERIFIED_RECITER_PORTRAITS.raad;
  if (lowerName.includes('sobhi') || lowerName.includes('subhi')) return VERIFIED_RECITER_PORTRAITS.islam_sobhi;

  if (lowerName.includes('hasanxon') || lowerName.includes('abdulmajid')) return VERIFIED_RECITER_PORTRAITS.hasanxon;
  if (lowerName.includes('jahongir') || lowerName.includes('nematov')) return VERIFIED_RECITER_PORTRAITS.jahongir;
  if (lowerName.includes('shamil')) return VERIFIED_RECITER_PORTRAITS.shamil;
  if (lowerName.includes('ildar')) return VERIFIED_RECITER_PORTRAITS.ildar;

  // 3. Guaranteed Islamic Medallion Emblem fallback (NO dummy fashion models)
  return generateIslamicMedallionAvatar(arabicName, name);
}

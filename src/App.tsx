import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  X,
  Check,
  Eye,
  Lock,
  UserCheck,
  Star,
  Camera,
  Lightbulb,
  Trash2,
  Crown,
  SlidersHorizontal,
  Search,
  MessageCircle,
  Phone,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  IdCard,
  UserPlus,
  Timer,
  Ticket,
  Upload,
  SwitchCamera,
  KeyRound,
  LayoutGrid,
  Inbox
} from 'lucide-react';

declare global {
  interface Window {
    __app_id?: string;
    __firebase_config?: any;
    __initial_auth_token?: string;
  }
}

// ============================================================================
// 1. PERSISTENT STORAGE & CLOUD SYNC CONFIGURATION (NEVER LOSES DATA ON RELOAD)
// ============================================================================
const LOCAL_STORAGE_KEY = 'useatify_ulis_permanent_store_v6';
const LEGACY_V5_KEY = 'useatify_ulis_permanent_store_v5';
const IDB_NAME = 'useatify_ulis_permanent_idb';
const IDB_STORE = 'app_state_store';
const IDB_KEY = 'main_state_v6';

// Lifecycle Constants: 4 Years for Student Accounts & 2 Hours for 6-Digit Entry Codes
const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000; // 4 năm (1,460 ngày)
const TEMP_CODE_TTL_MS = 2 * 60 * 60 * 1000; // 2 tiếng (7,200,000 ms)

// Clean up older legacy keys to keep browser 5MB localStorage quota free
try {
  const oldKeys = [
    'useatify_ulis_prod_v2',
    'useatify_ulis_permanent_store_v1',
    'useatify_ulis_permanent_store_v2',
    'useatify_ulis_permanent_store_v3',
    'useatify_ulis_permanent_store_v4'
  ];
  oldKeys.forEach((k) => localStorage.removeItem(k));
} catch (e) {}

// Firebase Realtime Database REST Endpoints (Project: huyhoathihackathon)
const RTDB_BASE_URLS = [
  'https://huyhoathihackathon-default-rtdb.asia-southeast1.firebasedatabase.app/useatify_v5',
  'https://huyhoathihackathon-default-rtdb.firebaseio.com/useatify_v5'
];
const RTDB_ENDPOINTS = RTDB_BASE_URLS.map((base) => `${base}.json`);

let app: any = null;
let auth: any = null;
let db: any = null;
const appId =
  typeof window !== 'undefined' && typeof window.__app_id !== 'undefined'
    ? window.__app_id
    : 'useatify-ulis-homies-v5';

try {
  if (typeof window !== 'undefined' && window.__firebase_config) {
    const firebaseConfig =
      typeof window.__firebase_config === 'string'
        ? JSON.parse(window.__firebase_config)
        : window.__firebase_config;
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// ============================================================================
// 2. INITIAL REAL-WORLD ULIS DATA (4 HOMIES BRANCHES + 5 ACCOUNTS)
// ============================================================================
const INITIAL_SITE_CONFIG = {
  brandName: 'USEATIFY',
  slogan: 'Find your space, embrace your pace',
  updatedAtMs: 0
};

const INITIAL_BRANCHES = [
  {
    id: 'homies_danang',
    code: 'ĐN',
    name: 'HOMIES Đa năng',
    subtitle: 'Không gian học tập & làm việc nhóm năng động',
    address: 'Khu Liên hợp Thể thao – ULIS',
    operatingHours: '8h00 – 20h00 tất cả các ngày trong tuần (trừ ngày lễ và kỳ nghỉ hè)',
    total: 100,
    used: 52,
    updatedAt: '09:30',
    updatedAtMs: 0,
    coverImg: null as string | null
  },
  {
    id: 'thu_vien_a2',
    code: 'A2',
    name: 'Thư viện A2',
    subtitle: 'Không gian đọc sách & tự học yên tĩnh tuyệt đối',
    address: 'Tầng 1 tòa A2 – ULIS',
    operatingHours: '7h30 – 16h30 từ Thứ 2 đến Thứ 6',
    total: 31,
    used: 28,
    updatedAt: '09:30',
    updatedAtMs: 0,
    coverImg: null as string | null
  },
  {
    id: 'homies_b2',
    code: 'B2',
    name: 'HOMIES B2',
    subtitle: 'Tổ hợp tự học hiện đại trung tâm giảng đường',
    address: 'Tầng 1 giảng đường B2 – ULIS',
    operatingHours: '6h30 – 18h00 từ Thứ 2 đến Thứ 6',
    total: 108,
    used: 76,
    updatedAt: '09:30',
    updatedAtMs: 0,
    coverImg: null as string | null
  },
  {
    id: 'homies_c3',
    code: 'C3',
    name: 'HOMIES C3',
    subtitle: 'Không gian học tập mở xuyên suốt cả tuần',
    address: 'Khu công trình khoa Pháp – ULIS',
    operatingHours: '6h30 – 21h00 tất cả các ngày trong tuần',
    total: 108,
    used: 45,
    updatedAt: '09:30',
    updatedAtMs: 0,
    coverImg: null as string | null
  }
];

const INITIAL_ACCOUNTS: Record<string, any> = {
  homies_admin: {
    id: 'homies_admin',
    username: 'homies_admin',
    password: 'admin123456',
    displayName: 'Quản lý Tổng USEATIFY',
    role: 'master',
    roleBadge: 'Tài khoản Tổng (4 Cơ sở)',
    primaryBranch: 'ALL',
    allowedBranches: ['homies_danang', 'thu_vien_a2', 'homies_b2', 'homies_c3'],
    contactName: 'Ban Quản Trị USEATIFY – ULIS',
    contactPhone: '0988.123.456',
    contactEmail: 'useatify.ulis@vnu.edu.vn',
    contactNote: 'Hỗ trợ kỹ thuật & vận hành toàn hệ thống Homies ULIS',
    updatedAtMs: 0
  },
  staff_danang: {
    id: 'staff_danang',
    username: 'staff_danang',
    password: '123456',
    displayName: 'Quản lý HOMIES Đa năng',
    role: 'branch',
    roleBadge: 'Staff • HOMIES Đa năng',
    primaryBranch: 'homies_danang',
    allowedBranches: ['homies_danang'],
    contactName: 'Quản lý HOMIES Đa năng',
    contactPhone: '0912.345.101',
    contactEmail: 'homies.danang@ulis.vnu.edu.vn',
    contactNote: 'Trực tại Khu Liên hợp Thể thao (8h00 – 20h00)',
    updatedAtMs: 0
  },
  staff_a2: {
    id: 'staff_a2',
    username: 'staff_a2',
    password: '123456',
    displayName: 'Quản lý Thư viện A2',
    role: 'branch',
    roleBadge: 'Staff • Thư viện A2',
    primaryBranch: 'thu_vien_a2',
    allowedBranches: ['thu_vien_a2'],
    contactName: 'Quản lý Thư viện A2',
    contactPhone: '0912.345.102',
    contactEmail: 'thuvien.a2@ulis.vnu.edu.vn',
    contactNote: 'Trực tại Tầng 1 tòa A2 (7h30 – 16h30, T2 – T6)',
    updatedAtMs: 0
  },
  staff_b2: {
    id: 'staff_b2',
    username: 'staff_b2',
    password: '123456',
    displayName: 'Quản lý HOMIES B2',
    role: 'branch',
    roleBadge: 'Staff • HOMIES B2',
    primaryBranch: 'homies_b2',
    allowedBranches: ['homies_b2'],
    contactName: 'Quản lý HOMIES B2',
    contactPhone: '0912.345.103',
    contactEmail: 'homies.b2@ulis.vnu.edu.vn',
    contactNote: 'Trực tại Tầng 1 giảng đường B2 (6h30 – 18h00, T2 – T6)',
    updatedAtMs: 0
  },
  staff_c3: {
    id: 'staff_c3',
    username: 'staff_c3',
    password: '123456',
    displayName: 'Quản lý HOMIES C3',
    role: 'branch',
    roleBadge: 'Staff • HOMIES C3',
    primaryBranch: 'homies_c3',
    allowedBranches: ['homies_c3'],
    contactName: 'Quản lý HOMIES C3',
    contactPhone: '0912.345.104',
    contactEmail: 'homies.c3@ulis.vnu.edu.vn',
    contactNote: 'Trực tại Khu công trình khoa Pháp (6h30 – 21h00 cả tuần)',
    updatedAtMs: 0
  }
};

const SUGGESTION_CATEGORIES = [
  'Cơ sở vật chất (Bàn ghế, Ổ cắm, Đèn)',
  'Điều hòa & Không gian thoáng mát',
  'Mạng Wi-Fi & Thiết bị hỗ trợ',
  'Vệ sinh & Mức độ yên tĩnh',
  'Thời gian mở cửa & Quy định',
  'Đề xuất cải thiện khác'
];

const WHY_CHOOSE_ITEMS = [
  {
    num: '01',
    icon: Search,
    title: 'Tra cứu, so sánh và cập nhật chỗ ngồi',
    shortDesc: 'Theo dõi và đồng bộ số lượng chỗ ngồi tại các cơ sở Homies theo thời điểm cập nhật gần nhất.',
    detailDesc:
      'Nhanh chóng theo dõi tổng số chỗ, số chỗ đang sử dụng, số chỗ còn trống và mức độ đông đúc tại các cơ sở Homies trên cùng một giao diện, được nhân viên trực cơ sở cập nhật và đồng bộ trực tiếp theo thời điểm gần nhất.'
  },
  {
    num: '02',
    icon: Clock,
    title: 'Chủ động lựa chọn – Tiết kiệm thời gian',
    shortDesc: 'Lựa chọn địa điểm phù hợp trước khi di chuyển.',
    detailDesc:
      'Giúp sinh viên lựa chọn cơ sở Homies phù hợp trước khi di chuyển, hạn chế tình trạng đến cơ sở đã hết chỗ và phải tiếp tục tìm kiếm địa điểm khác.'
  },
  {
    num: '03',
    icon: IdCard,
    title: 'STUDENT PASS – Thẻ sinh viên số',
    shortDesc: 'Đăng ký thẻ số tại quầy và xin cấp mã số ra vào trực tiếp trên website.',
    detailDesc:
      'Đăng ký lần đầu bằng thẻ sinh viên gốc tại quầy ra vào Homies; từ các lần sau sinh viên chỉ cần xin cấp mã số ra vào trực tiếp trên website.'
  },
  {
    num: '04',
    icon: MessageCircle,
    title: 'Đánh giá và góp ý',
    shortDesc: 'Đóng góp ý kiến về cơ sở vật chất và tình trạng Homies.',
    detailDesc:
      'Cho phép sinh viên đánh giá 5 sao kèm ảnh thực tế và gửi góp ý ẩn danh về cơ sở vật chất, tình trạng tại Homies, góp phần cải thiện trải nghiệm sử dụng không gian học tập.'
  }
];

// ============================================================================
// 3. HELPER FUNCTIONS (TRAFFIC LIGHT, STORAGE, BARCODE & 6-DIGIT GENERATOR)
// ============================================================================
function getCurrentTimeHHMM() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCurrentDateTimeStr() {
  const now = new Date();
  const hhmm = getCurrentTimeHHMM();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${hhmm} • ${dd}/${mm}/${yyyy}`;
}


function formatCountdownMMSS(expiresAtMs?: number | null, nowMs = Date.now()) {
  if (!expiresAtMs) return '00:00:00';
  const remainingSec = Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
  const hrs = String(Math.floor(remainingSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, '0');
  const secs = String(remainingSec % 60).padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

function loadPersistedState() {
  try {
    const rawV6 = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (rawV6) return JSON.parse(rawV6);
    const rawV5 = localStorage.getItem(LEGACY_V5_KEY);
    if (rawV5) return JSON.parse(rawV5);
    return null;
  } catch (e) {
    return null;
  }
}

function openPermanentIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const dbInstance = req.result;
      if (!dbInstance.objectStoreNames.contains(IDB_STORE)) {
        dbInstance.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIndexedDB(stateObj: any) {
  try {
    const dbInstance = await openPermanentIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = dbInstance.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(stateObj, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {}
}

async function loadFromIndexedDB(): Promise<any> {
  try {
    const dbInstance = await openPermanentIDB();
    return await new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

function savePersistedState(stateObj: any) {
  saveToIndexedDB(stateObj);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
  } catch (e) {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k !== LOCAL_STORAGE_KEY) localStorage.removeItem(k);
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
    } catch (err) {
      console.warn('LocalStorage quota reached; state is safely stored in IndexedDB & Cloud.');
    }
  }
}

function normalizeArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((item) => item && typeof item === 'object');
  if (typeof val === 'object') {
    return Object.values(val).filter((item) => item && typeof item === 'object');
  }
  return [];
}

function mergeArrayById(localArr: any = [], cloudArr: any = [], deletedIdsList: any = []) {
  const safeDeleted = Array.isArray(deletedIdsList)
    ? deletedIdsList.filter(Boolean)
    : typeof deletedIdsList === 'object' && deletedIdsList
      ? Object.values(deletedIdsList).filter(Boolean)
      : [];
  const deletedSet = new Set(safeDeleted);
  const map = new Map<string, any>();
  [...normalizeArray(localArr), ...normalizeArray(cloudArr)].forEach((item) => {
    if (!item || !item.id || deletedSet.has(item.id)) return;
    const existing = map.get(item.id);
    if (!existing || (item.updatedAtMs || 0) >= (existing.updatedAtMs || 0)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

// Generate a strictly unique 6-digit temporary code not used by any currently active request
function generateUniqueSixDigitCode(activeRequests: any[] = [], nowMs = Date.now()) {
  const activeCodes = new Set(
    (activeRequests || [])
      .filter((r) => r && r.status === 'approved' && r.code && (r.expiresAt || r.codeExpiresAtMs || 0) > nowMs)
      .map((r) => String(r.code))
  );
  let candidate = '';
  let attempts = 0;
  do {
    candidate = String(Math.floor(100000 + Math.random() * 900000));
    attempts += 1;
  } while (activeCodes.has(candidate) && attempts < 1000);
  return candidate;
}

// Compress an image (from File or DataURL/Canvas) strictly under < 60KB JPEG
function compressDataUrlUnder60KB(
  sourceImg: HTMLImageElement | HTMLVideoElement,
  maxWidth = 480,
  maxHeight = 300
): string {
  const canvas = document.createElement('canvas');
  const srcW =
    (sourceImg as HTMLVideoElement).videoWidth ||
    (sourceImg as HTMLImageElement).naturalWidth ||
    sourceImg.width ||
    maxWidth;
  const srcH =
    (sourceImg as HTMLVideoElement).videoHeight ||
    (sourceImg as HTMLImageElement).naturalHeight ||
    sourceImg.height ||
    maxHeight;

  canvas.width = maxWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, maxWidth, maxHeight);
  const scale = Math.max(maxWidth / srcW, maxHeight / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  ctx.drawImage(sourceImg, (maxWidth - w) / 2, (maxHeight - h) / 2, w, h);

  // Target < 60KB binary (~78,000 base64 chars, we aim for < 58,000 chars to be strictly < 60KB even as raw string)
  let quality = 0.68;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 58000 && quality > 0.28) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

function resizeImageToDataURL(
  file: File,
  maxWidth = 480,
  maxHeight = 300,
  mode: 'cover' | 'contain' = 'cover'
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Không tìm thấy tệp ảnh.'));
      return;
    }

    const fileName = (file.name || '').toLowerCase();
    const hasImageExt = /\.(jpg|jpeg|png|webp|jfif|gif|bmp|svg|avif|heic|heif)$/i.test(fileName);
    const hasImageMime = !file.type || file.type.startsWith('image/');

    if (!hasImageMime && !hasImageExt) {
      reject(new Error('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP, JFIF...).'));
      return;
    }

    const renderToCanvas = (imgSource: HTMLImageElement) => {
      try {
        if (mode === 'contain') {
          const canvas = document.createElement('canvas');
          const srcW = imgSource.naturalWidth || imgSource.width || maxWidth;
          const srcH = imgSource.naturalHeight || imgSource.height || maxHeight;
          const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
          canvas.width = Math.max(1, Math.round(srcW * scale));
          canvas.height = Math.max(1, Math.round(srcH * scale));
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
          let q = 0.68;
          let out = canvas.toDataURL('image/jpeg', q);
          while (out.length > 58000 && q > 0.28) {
            q -= 0.08;
            out = canvas.toDataURL('image/jpeg', q);
          }
          resolve(out);
        } else {
          resolve(compressDataUrlUnder60KB(imgSource, maxWidth, maxHeight));
        }
      } catch (err) {
        reject(new Error('Không thể xử lý ảnh này. Vui lòng thử ảnh JPG hoặc PNG khác.'));
      }
    };

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh từ thiết bị.'));
    reader.onload = () => {
      const dataUrlResult = reader.result as string;
      const img = new Image();
      img.onload = () => renderToCanvas(img);
      img.onerror = () => {
        reject(new Error('Định dạng ảnh không được trình duyệt hỗ trợ. Vui lòng chọn ảnh JPG/PNG.'));
      };
      img.src = dataUrlResult;
    };
    reader.readAsDataURL(file);
  });
}

// Extract student ID digits from a 2X04...@vnu.edu.vn email address (e.g. 23040123@vnu.edu.vn -> 23040123)
function extractStudentCodeFromEmail(email: string): string {
  const prefix = (email || '').trim().split('@')[0] || '';
  const match = prefix.match(/^2\d04\d{2,6}/) || prefix.match(/\d{6,10}/);
  return match ? match[0] : '';
}

// Validate ULIS student email: must start with 4 digits "2X04" (X = enrollment year digit 0-9) and end with @vnu.edu.vn
function isValidUlisStudentEmail(email: string): boolean {
  const clean = (email || '').trim().toLowerCase();
  return /^2\d04[0-9a-z._%+-]*@vnu\.edu\.vn$/i.test(clean);
}

function getSeatStatusInfo(used: number, total: number) {
  const safeTotal = Math.max(1, Number(total) || 1);
  const safeUsed = Math.min(safeTotal, Math.max(0, Number(used) || 0));
  const available = safeTotal - safeUsed;
  const ratio = (safeUsed / safeTotal) * 100;
  const occupancyRate = Math.round(ratio);

  if (safeUsed >= safeTotal) {
    return {
      level: 'rose',
      label: 'Hết chỗ',
      subLabel: 'Đã kín 100% công suất chỗ ngồi',
      occupancyRate,
      available,
      used: safeUsed,
      total: safeTotal,
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      barTrack: 'bg-rose-100/80',
      cardAccentBorder: 'border-rose-200',
      softBg: 'bg-rose-50/70',
      textAccent: 'text-rose-600',
      icon: AlertCircle
    };
  }

  if (ratio > 85) {
    return {
      level: 'rose',
      label: 'Gần kín chỗ',
      subLabel: 'Tỷ lệ lấp đầy > 85% • Khá ít chỗ trống',
      occupancyRate,
      available,
      used: safeUsed,
      total: safeTotal,
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-500',
      barTrack: 'bg-rose-100/80',
      cardAccentBorder: 'border-rose-200',
      softBg: 'bg-rose-50/70',
      textAccent: 'text-rose-600',
      icon: AlertCircle
    };
  }

  if (ratio > 60) {
    return {
      level: 'amber',
      label: 'Tương đối đông',
      subLabel: 'Tỷ lệ lấp đầy 61% – 85% • Vẫn còn chỗ ngồi',
      occupancyRate,
      available,
      used: safeUsed,
      total: safeTotal,
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
      barTrack: 'bg-amber-100/80',
      cardAccentBorder: 'border-amber-200',
      softBg: 'bg-amber-50/70',
      textAccent: 'text-amber-600',
      icon: AlertTriangle
    };
  }

  return {
    level: 'emerald',
    label: 'Còn nhiều chỗ',
    subLabel: 'Tỷ lệ lấp đầy ≤ 60% • Không gian thoáng đãng',
    occupancyRate,
    available,
    used: safeUsed,
    total: safeTotal,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    barColor: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    barTrack: 'bg-emerald-100/80',
    cardAccentBorder: 'border-emerald-200',
    softBg: 'bg-emerald-50/70',
    textAccent: 'text-emerald-600',
    icon: CheckCircle2
  };
}

// ============================================================================
// 4. SUB-COMPONENTS (LOGO, LIVE CAMERA MODAL, BANNER & STAR RATING)
// ============================================================================
const USEATIFY_LOGO_DATA_URL = 'data:image/png;base64,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';

function UseatifyBrandLogo({ className = 'h-12 sm:h-14 w-auto' }: { className?: string }) {
  return (
    <img
      src={USEATIFY_LOGO_DATA_URL}
      alt="USEATIFY"
      width={443}
      height={128}
      draggable={false}
      className={`${className} select-none shrink-0 block object-contain`}
    />
  );
}

// Live WebRTC Camera Capture Modal (For Student Portrait Photo)
function LiveCameraModal({
  onClose,
  onCapture
}: {
  onClose: () => void;
  onCapture: (compressedDataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError(null);
    setIsReady(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Trình duyệt hiện tại không hỗ trợ mở Camera trực tiếp. Vui lòng sử dụng nút "Tải ảnh từ thiết bị".'
      );
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (e: any) {
        setCameraError(
          'Không thể truy cập Camera (Có thể bạn chưa cấp quyền Camera cho trình duyệt). Bạn có thể đóng cửa sổ này và chọn "Tải ảnh lên".'
        );
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  const handleSnap = () => {
    if (!videoRef.current || !isReady) return;
    const compressedJpeg = compressDataUrlUnder60KB(videoRef.current, 320, 400);
    if (compressedJpeg) {
      onCapture(compressedJpeg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Chụp ảnh chân dung đối chiếu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {cameraError ? (
            <div className="bg-rose-950/70 border border-rose-800 text-rose-200 rounded-xl p-4 text-xs leading-relaxed">
              <p className="font-bold mb-1">Không thể khởi động Camera trực tiếp</p>
              <p>{cameraError}</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Visual framing guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-44 h-56 border-2 border-dashed border-emerald-400/80 rounded-full flex items-end justify-center pb-3 bg-slate-950/15">
                  <span className="text-[10px] text-emerald-200 font-semibold bg-slate-950/60 rounded px-2 py-0.5">
                    Canh rõ khuôn mặt
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <SwitchCamera className="w-4 h-4 text-emerald-400" />
              <span>Đổi Camera Trước/Sau</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              {!cameraError && (
                <button
                  type="button"
                  disabled={!isReady}
                  onClick={handleSnap}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Chụp & Nén &lt;60KB</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchVisualBanner({
  branch,
  isBestChoice,
  avgRating,
  reviewCount
}: {
  branch: any;
  isBestChoice: boolean;
  avgRating: string | null;
  reviewCount: number;
}) {
  return (
    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#144d36] select-none">
      {branch.coverImg ? (
        <img
          src={branch.coverImg}
          alt={branch.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background:
              'linear-gradient(135deg, #165b40 0%, #11422f 55%, #0f2922 100%)'
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-15"
            viewBox="0 0 400 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 40H400M0 80H400M0 120H400M80 0V160M160 0V160M240 0V160M320 0V160"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-slate-950/20" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5 p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-black/45 text-white backdrop-blur-xs border border-white/15 whitespace-nowrap">
            Khu {branch.code}
          </span>
          {reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-400 text-slate-950 whitespace-nowrap">
              <Star className="w-3 h-3 fill-slate-950 shrink-0" />
              <span className="font-mono">{avgRating}</span>
              <span className="text-[10px] font-medium opacity-80">({reviewCount})</span>
            </span>
          )}
        </div>

        {isBestChoice && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600/95 text-white border border-emerald-400/30 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Nhiều chỗ trống nhất</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 flex items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            <span className="truncate">{branch.name}</span>
            <span className="text-[11px] font-mono font-semibold text-emerald-200 bg-white/15 px-2 py-0.5 rounded whitespace-nowrap shrink-0">
              {branch.total} chỗ
            </span>
          </h3>
          <p className="text-[11px] text-slate-200/90 line-clamp-1 mt-0.5">{branch.subtitle}</p>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200 bg-black/40 px-2 py-0.5 rounded border border-white/10 shrink-0 whitespace-nowrap">
          <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
          <span>{branch.updatedAt}</span>
        </div>
      </div>
    </div>
  );
}

function StarRatingDisplay({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// 5. MAIN APPLICATION COMPONENT & ERROR BOUNDARY
// ============================================================================
function UseatifyMainApp() {
  const persistedOnBoot = useMemo(() => loadPersistedState(), []);

  // Main Navigation Tab: 'guest' | 'student_pass' | 'staff' (Default on entry: 'guest')
  const [activeTab, setActiveTab] = useState<'guest' | 'student_pass' | 'staff'>('guest');
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const navDropdownRef = useRef<HTMLDivElement | null>(null);

  const [guestCommunityTab, setGuestCommunityTab] = useState<'reviews' | 'suggestions'>('reviews');

  // Staff Vertical Sidebar Pin / Auto-Collapse State
  const [isStaffSidebarPinned, setIsStaffSidebarPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('useatify_staff_sidebar_pinned') !== 'false';
    } catch {
      return true;
    }
  });
  const [isStaffSidebarHovered, setIsStaffSidebarHovered] = useState(false);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(ev.target as Node)) {
        setNavDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('useatify_staff_sidebar_pinned', String(isStaffSidebarPinned));
    } catch {}
  }, [isStaffSidebarPinned]);

  // 1-Second Live Clock for 2-Hour Code Countdown & Lifecycle Checks
  const [nowTick, setNowTick] = useState(() => Date.now());

  // 1. Branches State (4 ULIS Homies)
  const [branchesMap, setBranchesMap] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    INITIAL_BRANCHES.forEach((b) => {
      const savedBranch = persistedOnBoot?.branchesMap?.[b.id];
      initial[b.id] = savedBranch
        ? {
            ...b,
            used: Math.min(b.total, Math.max(0, Number(savedBranch.used ?? b.used))),
            updatedAt: savedBranch.updatedAt || b.updatedAt,
            coverImg: savedBranch.coverImg ?? b.coverImg,
            updatedAtMs: savedBranch.updatedAtMs || 0
          }
        : { ...b };
    });
    return initial;
  });

  // 2. Staff Accounts State (4 Branch Staff + 1 Master Account)
  const [accountsMap, setAccountsMap] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = { ...INITIAL_ACCOUNTS };
    if (persistedOnBoot?.accountsMap) {
      Object.keys(initial).forEach((k) => {
        if (persistedOnBoot.accountsMap[k]) {
          initial[k] = {
            ...initial[k],
            ...persistedOnBoot.accountsMap[k],
            id: INITIAL_ACCOUNTS[k].id,
            role: INITIAL_ACCOUNTS[k].role,
            roleBadge: INITIAL_ACCOUNTS[k].roleBadge,
            primaryBranch: INITIAL_ACCOUNTS[k].primaryBranch,
            allowedBranches: [...INITIAL_ACCOUNTS[k].allowedBranches]
          };
        }
      });
    }
    return initial;
  });

  // 3. Site Config State
  const [siteConfig, setSiteConfig] = useState(() => {
    if (persistedOnBoot?.siteConfig) {
      return { ...INITIAL_SITE_CONFIG, ...persistedOnBoot.siteConfig };
    }
    return { ...INITIAL_SITE_CONFIG };
  });

  // 4. Reviews, Suggestions, Student Accounts, Entry Requests (2-Hour Code TTL)
  const [reviews, setReviews] = useState<any[]>(() => normalizeArray(persistedOnBoot?.reviews));
  const [suggestions, setSuggestions] = useState<any[]>(() =>
    normalizeArray(persistedOnBoot?.suggestions)
  );
  const [studentAccounts, setStudentAccounts] = useState<any[]>(() => {
    const list = normalizeArray(persistedOnBoot?.studentAccounts);
    try {
      const savedProfileRaw = localStorage.getItem('useatify_active_student_profile_v6');
      if (savedProfileRaw) {
        const savedProfile = JSON.parse(savedProfileRaw);
        if (savedProfile && savedProfile.id && !list.some((s) => s.id === savedProfile.id)) {
          return [savedProfile, ...list];
        }
      }
    } catch {}
    return list;
  });
  const [entryRequests, setEntryRequests] = useState<any[]>(() =>
    normalizeArray(persistedOnBoot?.entryRequests)
  );
  const [deletedIds, setDeletedIds] = useState<string[]>(() =>
    Array.isArray(persistedOnBoot?.deletedIds) ? persistedOnBoot.deletedIds.filter(Boolean) : []
  );

  // Cloud Sync State
  const [activeAuth] = useState(auth);
  const [activeDb] = useState(db);
  const [user, setUser] = useState<any>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState(getCurrentTimeHHMM());

  const [contactWidgetOpen, setContactWidgetOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ src: string; caption: string } | null>(null);
  const [liveCameraTarget, setLiveCameraTarget] = useState<'portrait' | null>(null);
  const [studentSearchCode, setStudentSearchCode] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [confirmDeleteSelfStudent, setConfirmDeleteSelfStudent] = useState(false);

  // 5-Star Review Form State
  const [revBranchId, setRevBranchId] = useState('homies_danang');
  const [revAuthor, setRevAuthor] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revHoverRating, setRevHoverRating] = useState(0);
  const [revContent, setRevContent] = useState('');
  const [revPhoto, setRevPhoto] = useState<string | null>(null);
  const [revFilterBranch, setRevFilterBranch] = useState('ALL');
  const [revNotice, setRevNotice] = useState<{ type: string; text: string } | null>(null);

  // Homies Suggestion Form State
  const [sugBranchId, setSugBranchId] = useState('homies_danang');
  const [sugCategory, setSugCategory] = useState(SUGGESTION_CATEGORIES[0]);
  const [sugSender, setSugSender] = useState('');
  const [sugContent, setSugContent] = useState('');
  const [sugPhoto, setSugPhoto] = useState<string | null>(null);
  const [sugNotice, setSugNotice] = useState<{ type: string; text: string } | null>(null);

  // ==========================================================================
  // STUDENT DIGITAL HOMIES PASS STATE (PERSISTENT SESSION - ONLY LOGOUT ON CLICK)
  // ==========================================================================
  // Student Main Auth Tab: 'login' | 'register' | 'forgot_password'
  const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [loggedInStudentId, setLoggedInStudentId] = useState<string | null>(() => {
    try {
      const id = localStorage.getItem('useatify_active_student_id');
      if (id) return id;
      const savedProfileRaw = localStorage.getItem('useatify_active_student_profile_v6');
      if (savedProfileRaw) {
        const parsed = JSON.parse(savedProfileRaw);
        return parsed?.id || null;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [persistedStudentBackup, setPersistedStudentBackup] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('useatify_active_student_profile_v6');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Student Login Form
  const [stuLoginEmail, setStuLoginEmail] = useState('');
  const [stuLoginPassword, setStuLoginPassword] = useState('');
  const [stuLoginError, setStuLoginError] = useState('');

  // Student Registration Form (With Confirm Password)
  const [stuRegEmail, setStuRegEmail] = useState('');
  const [stuRegPassword, setStuRegPassword] = useState('');
  const [stuRegConfirmPassword, setStuRegConfirmPassword] = useState('');
  const [stuRegFullName, setStuRegFullName] = useState('');
  const [stuRegCode, setStuRegCode] = useState('');
  const [stuRegBranchId, setStuRegBranchId] = useState('homies_danang');
  const [stuRegPortraitPhoto, setStuRegPortraitPhoto] = useState<string | null>(null);
  const [stuRegNotice, setStuRegNotice] = useState<{ type: string; text: string } | null>(null);

  // Inline Forgot Password Flow (Request Staff/Admin Approval -> Smooth Transition to New Password)
  const [forgotPassQuery, setForgotPassQuery] = useState<string>(() => {
    try {
      return localStorage.getItem('useatify_forgot_pass_query') || '';
    } catch {
      return '';
    }
  });
  const [forgotPassNewPassword, setForgotPassNewPassword] = useState('');
  const [forgotPassConfirmPassword, setForgotPassConfirmPassword] = useState('');
  const [forgotPassNotice, setForgotPassNotice] = useState<{ type: string; text: string } | null>(
    null
  );

  // Inline Student Change Password (Old Password, New Password, Confirm New Password)
  const [changePassOldInput, setChangePassOldInput] = useState('');
  const [changePassNewInput, setChangePassNewInput] = useState('');
  const [changePassConfirmInput, setChangePassConfirmInput] = useState('');
  const [changePassModalNotice, setChangePassModalNotice] = useState<{
    type: string;
    text: string;
  } | null>(null);
  const [desktopSecurityOpen, setDesktopSecurityOpen] = useState(false);

  // Student Temporary Entry Request Selection
  const [stuSelectedBranchForEntry, setStuSelectedBranchForEntry] = useState('homies_danang');

  // Staff / Master Authentication State
  const [loggedInAccountId, setLoggedInAccountId] = useState<string | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Staff Dashboard Sub-Tab:
  // 'seats' | 'entry_codes' | 'student_approvals' | 'moderation' | 'suggestions' | 'branding_contact' | 'account'
  const [staffSubTab, setStaffSubTab] = useState<string>('seats');
  const [masterSelectedBranch, setMasterSelectedBranch] = useState('ALL');

  // Pending Drafts for Branch Cover Photos
  const [branchCoverDrafts, setBranchCoverDrafts] = useState<Record<string, string>>({});
  const branchFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Staff Contact Form State
  const [contactFormName, setContactFormName] = useState('');
  const [contactFormPhone, setContactFormPhone] = useState('');
  const [contactFormEmail, setContactFormEmail] = useState('');
  const [contactFormNote, setContactFormNote] = useState('');
  const [contactSaveNotice, setContactSaveNotice] = useState<string | null>(null);

  // Self-Service Account Security Form State
  const [accCurrentPassword, setAccCurrentPassword] = useState('');
  const [accNewUsername, setAccNewUsername] = useState('');
  const [accNewDisplayName, setAccNewDisplayName] = useState('');
  const [accNewPassword, setAccNewPassword] = useState('');
  const [accConfirmPassword, setAccConfirmPassword] = useState('');
  const [accFeedback, setAccFeedback] = useState<{ type: string; text: string } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    msg: string;
    type: string;
    id: number;
  } | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastLocalWriteMsRef = useRef(0);
  const latestStateRef = useRef({
    branchesMap,
    accountsMap,
    siteConfig,
    reviews,
    suggestions,
    studentAccounts,
    entryRequests,
    deletedIds
  });

  useEffect(() => {
    latestStateRef.current = {
      branchesMap,
      accountsMap,
      siteConfig,
      reviews,
      suggestions,
      studentAccounts,
      entryRequests,
      deletedIds
    };
  }, [
    branchesMap,
    accountsMap,
    siteConfig,
    reviews,
    suggestions,
    studentAccounts,
    entryRequests,
    deletedIds
  ]);

  // Persist active student login session permanently until explicit logout button is clicked
  useEffect(() => {
    try {
      if (loggedInStudentId) {
        localStorage.setItem('useatify_active_student_id', loggedInStudentId);
        const found = studentAccounts.find((s) => s && s.id === loggedInStudentId);
        if (found) {
          setPersistedStudentBackup(found);
          localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(found));
        }
      }
    } catch {}
  }, [loggedInStudentId, studentAccounts]);

  const handleStudentExplicitLogout = () => {
    setLoggedInStudentId(null);
    setPersistedStudentBackup(null);
    try {
      localStorage.removeItem('useatify_active_student_id');
      localStorage.removeItem('useatify_active_student_profile_v6');
    } catch {}
    showToast('Đã đăng xuất khỏi tài khoản Sinh viên.');
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ msg, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Restore from IndexedDB on boot if needed
  useEffect(() => {
    let mounted = true;
    loadFromIndexedDB().then((idbState) => {
      if (!mounted || !idbState) return;
      const curDel = idbState.deletedIds || deletedIds;
      if (idbState.branchesMap) {
        setBranchesMap((prev) => {
          let changed = false;
          const next = { ...prev };
          INITIAL_BRANCHES.forEach((meta) => {
            const idbB = idbState.branchesMap[meta.id];
            const curB = prev[meta.id];
            if (idbB && curB && (idbB.updatedAtMs || 0) > (curB.updatedAtMs || 0)) {
              next[meta.id] = {
                ...curB,
                used: Math.min(meta.total, Math.max(0, Number(idbB.used ?? curB.used))),
                updatedAt: idbB.updatedAt || curB.updatedAt,
                coverImg: idbB.coverImg ?? curB.coverImg,
                updatedAtMs: idbB.updatedAtMs
              };
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
      if (Array.isArray(idbState.reviews) && idbState.reviews.length > 0) {
        setReviews((prev) => mergeArrayById(prev, idbState.reviews, curDel));
      }
      if (Array.isArray(idbState.suggestions) && idbState.suggestions.length > 0) {
        setSuggestions((prev) => mergeArrayById(prev, idbState.suggestions, curDel));
      }
      if (Array.isArray(idbState.studentAccounts) && idbState.studentAccounts.length > 0) {
        setStudentAccounts((prev) => mergeArrayById(prev, idbState.studentAccounts, curDel));
      }
      if (Array.isArray(idbState.entryRequests) && idbState.entryRequests.length > 0) {
        setEntryRequests((prev) => mergeArrayById(prev, idbState.entryRequests, curDel));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save every state change to LocalStorage & IndexedDB
  useEffect(() => {
    savePersistedState({
      branchesMap,
      accountsMap,
      siteConfig,
      reviews,
      suggestions,
      studentAccounts,
      entryRequests,
      deletedIds,
      savedAtMs: Date.now()
    });
  }, [
    branchesMap,
    accountsMap,
    siteConfig,
    reviews,
    suggestions,
    studentAccounts,
    entryRequests,
    deletedIds
  ]);

  // --------------------------------------------------------------------------
  // CLOUD SYNC ENGINE: FIREBASE REALTIME DB REST + FIRESTORE + BROADCAST
  // --------------------------------------------------------------------------
  const pushToRealtimeDatabase = useCallback(
    async (patchPayload: any, specificBranchId: string | null = null) => {
      for (let i = 0; i < RTDB_ENDPOINTS.length; i++) {
        const url = RTDB_ENDPOINTS[i];
        const baseUrl = RTDB_BASE_URLS[i];
        try {
          if (specificBranchId && patchPayload.branchesMap?.[specificBranchId]) {
            await fetch(`${baseUrl}/branchesMap/${specificBranchId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(patchPayload.branchesMap[specificBranchId])
            });
          }
          const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
          });
          if (res.ok) {
            setLastSyncedTime(getCurrentTimeHHMM());
            break;
          }
        } catch (e) {}
      }
    },
    []
  );

  // --------------------------------------------------------------------------
  // CLEANUP EXPIRED DATA FUNCTION (BACKGROUND LIFECYCLE & 2-MINUTE ENTRY CODES)
  // Never auto-logs out the active student on reload
  // --------------------------------------------------------------------------
  const cleanupExpiredData = useCallback(() => {
    const now = Date.now();
    setNowTick(now);

    const cur = latestStateRef.current;
    let newlyDeletedIds: string[] = [];

    // 1. Check for expired 2-minute temporary entry codes (Date.now() > passExpiresAt / codeExpiresAtMs)
    const expiredRequests = (cur.entryRequests || []).filter((req) => {
      if (!req) return false;
      const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
      if (req.status === 'approved' && exp && now >= exp) {
        return true;
      }
      return false;
    });

    // 2. Background lifecycle check (silent 3-day auto-delete for unapproved accounts & 4-year lifecycle)
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const expiredAccounts = (cur.studentAccounts || []).filter((acc) => {
      if (!acc) return false;
      const createdMs =
        typeof acc.createdAtMs === 'number' && acc.createdAtMs > 0
          ? acc.createdAtMs
          : typeof acc.createdAt === 'number' && acc.createdAt > 0
          ? acc.createdAt
          : now;

      if (acc.status === 'pending' && now - createdMs >= THREE_DAYS_MS) {
        return true;
      }

      if (acc.id === loggedInStudentId) return false;
      const expiry = acc.accountExpiresAt || acc.expiresAtMs || createdMs + FOUR_YEARS_MS;
      return now >= expiry;
    });

    // 3. Silent background cleanup for completed suggestions after 2 days
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const expiredCompletedSuggestions = (cur.suggestions || []).filter((sug) => {
      if (!sug || sug.status !== 'completed') return false;
      const completedTime = sug.completedAtMs || sug.updatedAtMs || sug.createdAtMs || now;
      return now - completedTime >= TWO_DAYS_MS;
    });

    if (
      expiredRequests.length > 0 ||
      expiredAccounts.length > 0 ||
      expiredCompletedSuggestions.length > 0
    ) {
      newlyDeletedIds = [
        ...expiredRequests.map((r) => r.id),
        ...expiredAccounts.map((a) => a.id),
        ...expiredCompletedSuggestions.map((s) => s.id)
      ];
      const nextDeleted = Array.from(new Set([...(cur.deletedIds || []), ...newlyDeletedIds]));
      const nextEntryRequests = (cur.entryRequests || []).filter(
        (r) => !newlyDeletedIds.includes(r.id)
      );
      const nextStudentAccounts = (cur.studentAccounts || []).filter(
        (a) => !newlyDeletedIds.includes(a.id)
      );
      const nextSuggestions = (cur.suggestions || []).filter(
        (s) => !newlyDeletedIds.includes(s.id)
      );

      setDeletedIds(nextDeleted);
      if (expiredRequests.length > 0) setEntryRequests(nextEntryRequests);
      if (expiredAccounts.length > 0) {
        setStudentAccounts(nextStudentAccounts);
        if (loggedInStudentId && newlyDeletedIds.includes(loggedInStudentId)) {
          setLoggedInStudentId(null);
          setPersistedStudentBackup(null);
          try {
            localStorage.removeItem('useatify_active_student_id');
            localStorage.removeItem('useatify_active_student_profile_v6');
          } catch {}
        }
      }
      if (expiredCompletedSuggestions.length > 0) {
        setSuggestions(nextSuggestions);
      }

      pushToRealtimeDatabase({
        entryRequests: nextEntryRequests,
        studentAccounts: nextStudentAccounts,
        suggestions: nextSuggestions,
        deletedIds: nextDeleted,
        updatedAtMs: now
      });
    }
  }, [loggedInStudentId, pushToRealtimeDatabase]);

  // Run cleanup on initialization, every 1s for responsive UI countdown & 60s background sweep
  useEffect(() => {
    cleanupExpiredData();
    const oneSecInterval = setInterval(cleanupExpiredData, 1000);
    const sixtySecInterval = setInterval(cleanupExpiredData, 60000);
    return () => {
      clearInterval(oneSecInterval);
      clearInterval(sixtySecInterval);
    };
  }, [cleanupExpiredData]);

  const pullFromRealtimeDatabase = useCallback(async () => {
    if (Date.now() - lastLocalWriteMsRef.current < 3200) return;

    for (const url of RTDB_ENDPOINTS) {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!res.ok) continue;
        const cloud = await res.json();
        if (!cloud || typeof cloud !== 'object' || cloud.error) continue;

        if (Date.now() - lastLocalWriteMsRef.current < 3200) return;

        setLastSyncedTime(getCurrentTimeHHMM());
        const now = Date.now();

        const currentDeleted = latestStateRef.current.deletedIds || [];
        const mergedDeleted = Array.from(
          new Set([...currentDeleted, ...(cloud.deletedIds || [])])
        );
        if (mergedDeleted.length !== currentDeleted.length) {
          setDeletedIds(mergedDeleted);
        }

        // 1. Merge Branches
        if (cloud.branchesMap && typeof cloud.branchesMap === 'object') {
          setBranchesMap((prev) => {
            let changed = false;
            const next = { ...prev };
            INITIAL_BRANCHES.forEach((meta) => {
              const cBranch = cloud.branchesMap[meta.id];
              const lBranch = prev[meta.id];
              if (cBranch && lBranch && (cBranch.updatedAtMs || 0) > (lBranch.updatedAtMs || 0)) {
                next[meta.id] = {
                  ...lBranch,
                  used: Math.min(meta.total, Math.max(0, Number(cBranch.used ?? lBranch.used))),
                  updatedAt: cBranch.updatedAt || lBranch.updatedAt,
                  coverImg: cBranch.coverImg !== undefined ? cBranch.coverImg : lBranch.coverImg,
                  updatedAtMs: cBranch.updatedAtMs
                };
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        }

        // 2. Merge Staff Accounts
        if (cloud.accountsMap && typeof cloud.accountsMap === 'object') {
          setAccountsMap((prev) => {
            let changed = false;
            const next = { ...prev };
            Object.keys(INITIAL_ACCOUNTS).forEach((accId) => {
              const cAcc = cloud.accountsMap[accId];
              const lAcc = prev[accId];
              if (cAcc && lAcc && (cAcc.updatedAtMs || 0) > (lAcc.updatedAtMs || 0)) {
                next[accId] = {
                  ...lAcc,
                  ...cAcc,
                  id: INITIAL_ACCOUNTS[accId].id,
                  role: INITIAL_ACCOUNTS[accId].role,
                  roleBadge: INITIAL_ACCOUNTS[accId].roleBadge,
                  primaryBranch: INITIAL_ACCOUNTS[accId].primaryBranch,
                  allowedBranches: [...INITIAL_ACCOUNTS[accId].allowedBranches]
                };
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        }

        // 2b. Merge SiteConfig
        if (cloud.siteConfig && typeof cloud.siteConfig === 'object') {
          setSiteConfig((prev: any) => {
            const pMs = prev?.updatedAtMs || 0;
            const cMs = cloud.siteConfig?.updatedAtMs || 0;
            if (cMs > pMs) {
              return { ...INITIAL_SITE_CONFIG, ...prev, ...cloud.siteConfig };
            }
            return prev;
          });
        }

        // 3. Merge Reviews & Suggestions
        if (cloud.reviews) {
          setReviews((prev) => {
            const merged = mergeArrayById(prev, cloud.reviews, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        if (cloud.suggestions) {
          setSuggestions((prev) => {
            const merged = mergeArrayById(prev, cloud.suggestions, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }

        // 4. Merge Student Accounts
        if (cloud.studentAccounts) {
          setStudentAccounts((prev) => {
            const merged = mergeArrayById(prev, cloud.studentAccounts, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }

        // 5. Merge Temporary Entry Requests (filtering out expired 2-min codes)
        if (cloud.entryRequests) {
          setEntryRequests((prev) => {
            const merged = mergeArrayById(prev, cloud.entryRequests, mergedDeleted).filter(
              (req) => {
                if (!req) return false;
                const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
                return !(req.status === 'approved' && exp && now >= exp);
              }
            );
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        break;
      } catch (e) {}
    }
  }, []);

  // Poll every 2.5 seconds so 6-digit temporary entry codes sync rapidly across devices
  useEffect(() => {
    pullFromRealtimeDatabase();
    const interval = setInterval(pullFromRealtimeDatabase, 2500);
    const onFocus = () => pullFromRealtimeDatabase();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [pullFromRealtimeDatabase]);

  // Firebase Auth & Firestore Listeners
  useEffect(() => {
    if (!activeAuth) return;
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          try {
            await signInWithCustomToken(activeAuth, window.__initial_auth_token);
          } catch {
            await signInAnonymously(activeAuth);
          }
        } else {
          await signInAnonymously(activeAuth);
        }
      } catch (e) {}
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(activeAuth, (u) => {
      if (isMounted && u) setUser(u);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeAuth]);

  useEffect(() => {
    if (!user || !activeDb) return;
    const stateDocRef = doc(activeDb, 'artifacts', appId, 'public', 'data', 'sync_store', 'main');
    const unsub = onSnapshot(
      stateDocRef,
      (snap) => {
        if (!snap.exists()) return;
        if (Date.now() - lastLocalWriteMsRef.current < 3000) return;
        const cloud = snap.data();
        if (!cloud) return;
        const now = Date.now();
        setLastSyncedTime(getCurrentTimeHHMM());
        const currentDeleted = latestStateRef.current.deletedIds || [];
        const mergedDeleted = Array.from(
          new Set([...currentDeleted, ...(cloud.deletedIds || [])])
        );
        if (mergedDeleted.length !== currentDeleted.length) {
          setDeletedIds(mergedDeleted);
        }
        if (cloud.branchesMap) {
          setBranchesMap((prev) => {
            let changed = false;
            const next = { ...prev };
            INITIAL_BRANCHES.forEach((meta) => {
              const cB = cloud.branchesMap[meta.id];
              const lB = prev[meta.id];
              if (cB && lB && (cB.updatedAtMs || 0) > (lB.updatedAtMs || 0)) {
                next[meta.id] = {
                  ...lB,
                  ...cB,
                  coverImg: cB.coverImg !== undefined ? cB.coverImg : lB.coverImg
                };
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        }
        if (Array.isArray(cloud.studentAccounts)) {
          setStudentAccounts((prev) => {
            const merged = mergeArrayById(prev, cloud.studentAccounts, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        if (Array.isArray(cloud.entryRequests)) {
          setEntryRequests((prev) => {
            const merged = mergeArrayById(prev, cloud.entryRequests, mergedDeleted).filter(
              (req) => {
                const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
                return !(req.status === 'approved' && exp && now >= exp);
              }
            );
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
      },
      () => {}
    );
    return () => unsub();
  }, [user, activeDb]);

  useEffect(() => {
    if (!user || !activeDb) return;
    const colRef = collection(activeDb, 'artifacts', appId, 'public', 'data', 'branches_v5');
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        if (Date.now() - lastLocalWriteMsRef.current < 3000) return;
        setBranchesMap((prev) => {
          let changed = false;
          const next = { ...prev };
          snap.forEach((docSnap) => {
            const cB = docSnap.data();
            const lB = prev[docSnap.id];
            if (cB && lB && (cB.updatedAtMs || 0) > (lB.updatedAtMs || 0)) {
              next[docSnap.id] = {
                ...lB,
                used: Math.min(lB.total, Math.max(0, Number(cB.used ?? lB.used))),
                updatedAt: cB.updatedAt || lB.updatedAt,
                coverImg: cB.coverImg !== undefined ? cB.coverImg : lB.coverImg,
                updatedAtMs: cB.updatedAtMs
              };
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      },
      () => {}
    );
    return () => unsub();
  }, [user, activeDb]);

  // Same-browser tab BroadcastChannel sync
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('useatify_v6_channel');
      broadcastChannelRef.current = channel;
      channel.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || msg.type !== 'FULL_SYNC' || !msg.payload) return;
        const p = msg.payload;
        if (p.branchesMap) setBranchesMap(p.branchesMap);
        if (p.accountsMap) setAccountsMap(p.accountsMap);
        if (p.siteConfig) setSiteConfig(p.siteConfig);
        if (Array.isArray(p.reviews)) setReviews(p.reviews);
        if (Array.isArray(p.suggestions)) setSuggestions(p.suggestions);
        if (Array.isArray(p.studentAccounts)) setStudentAccounts(p.studentAccounts);
        if (Array.isArray(p.entryRequests)) setEntryRequests(p.entryRequests);
        if (Array.isArray(p.deletedIds)) setDeletedIds(p.deletedIds);
      };
      return () => channel.close();
    }
  }, []);

  const syncAllChannels = async (overrides: Record<string, any> = {}, specificBranchId: string | null = null) => {
    lastLocalWriteMsRef.current = Date.now();
    const cur = latestStateRef.current;

    const payload = {
      branchesMap: overrides.branchesMap || cur.branchesMap,
      accountsMap: overrides.accountsMap || cur.accountsMap,
      siteConfig: overrides.siteConfig || cur.siteConfig,
      reviews: overrides.reviews || cur.reviews,
      suggestions: overrides.suggestions || cur.suggestions,
      studentAccounts: overrides.studentAccounts || cur.studentAccounts,
      entryRequests: overrides.entryRequests || cur.entryRequests,
      deletedIds: overrides.deletedIds || cur.deletedIds,
      updatedAtMs: Date.now()
    };

    savePersistedState(payload);

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'FULL_SYNC', payload });
      } catch (e) {}
    }

    await pushToRealtimeDatabase(payload, specificBranchId);

    if (user && activeDb) {
      try {
        if (specificBranchId && payload.branchesMap?.[specificBranchId]) {
          const branchDocRef = doc(
            activeDb,
            'artifacts',
            appId,
            'public',
            'data',
            'branches_v5',
            specificBranchId
          );
          await setDoc(branchDocRef, payload.branchesMap[specificBranchId], { merge: true });
        }
        const stateDocRef = doc(
          activeDb,
          'artifacts',
          appId,
          'public',
          'data',
          'sync_store',
          'main'
        );
        await setDoc(stateDocRef, payload, { merge: true });
      } catch (e) {}
    }
  };

  // --------------------------------------------------------------------------
  // DERIVED STATE & PERMISSIONS
  // --------------------------------------------------------------------------
  const currentAccount = useMemo(() => {
    if (!loggedInAccountId) return null;
    return accountsMap[loggedInAccountId] || null;
  }, [loggedInAccountId, accountsMap]);

  const isMaster = currentAccount?.role === 'master';

  // Active Student Account: never auto-logs out on reload unless explicitly deleted by Admin or logged out by Student
  const currentStudent = useMemo(() => {
    if (!loggedInStudentId) return null;
    if (deletedIds.includes(loggedInStudentId)) return null;
    return (
      studentAccounts.find((s) => s && s.id === loggedInStudentId) ||
      (persistedStudentBackup?.id === loggedInStudentId ? persistedStudentBackup : null)
    );
  }, [loggedInStudentId, studentAccounts, persistedStudentBackup, deletedIds]);

  const branchesList = useMemo(() => {
    return INITIAL_BRANCHES.map((meta) => branchesMap[meta.id] || meta);
  }, [branchesMap]);

  const approvedReviews = useMemo(() => {
    return reviews.filter((r) => r && r.status === 'approved');
  }, [reviews]);

  const branchRatingsMap = useMemo(() => {
    const map: Record<string, { count: number; avg: string | null }> = {};
    INITIAL_BRANCHES.forEach((b) => {
      const list = approvedReviews.filter((r) => r && r.branchId === b.id);
      const count = list.length;
      const avg =
        count > 0 ? (list.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / count).toFixed(1) : null;
      map[b.id] = { count, avg };
    });
    return map;
  }, [approvedReviews]);

  const filteredGuestReviews = useMemo(() => {
    if (revFilterBranch === 'ALL') return approvedReviews;
    return approvedReviews.filter((r) => r && r.branchId === revFilterBranch);
  }, [approvedReviews, revFilterBranch]);

  const accessibleBranchIds = useMemo(() => {
    if (!currentAccount) return [];
    return currentAccount.allowedBranches || [];
  }, [currentAccount]);

  const activeManagedBranchIds = useMemo(() => {
    if (!currentAccount) return [];
    if (isMaster) {
      return masterSelectedBranch === 'ALL'
        ? INITIAL_BRANCHES.map((b) => b.id)
        : [masterSelectedBranch];
    }
    return [currentAccount.primaryBranch];
  }, [currentAccount, isMaster, masterSelectedBranch]);

  const scopedModerationReviews = useMemo(() => {
    if (!currentAccount) return [];
    return reviews.filter((r) => r && activeManagedBranchIds.includes(r.branchId));
  }, [reviews, currentAccount, activeManagedBranchIds]);

  const pendingReviewsCountForCurrentRole = useMemo(() => {
    if (!currentAccount) return 0;
    return reviews.filter(
      (r) => r && r.status === 'pending' && accessibleBranchIds.includes(r.branchId)
    ).length;
  }, [reviews, currentAccount, accessibleBranchIds]);

  const scopedSuggestions = useMemo(() => {
    if (!currentAccount) return [];
    return suggestions.filter((s) => s && activeManagedBranchIds.includes(s.branchId));
  }, [suggestions, currentAccount, activeManagedBranchIds]);

  const unreadSuggestionsCountForCurrentRole = useMemo(() => {
    if (!currentAccount) return 0;
    return suggestions.filter(
      (s) => s && s.status === 'unread' && accessibleBranchIds.includes(s.branchId)
    ).length;
  }, [suggestions, currentAccount, accessibleBranchIds]);

  // Student Accounts sorted by registration date (available to all Homies branch staff and Master Admin)
  const scopedStudentAccounts = useMemo(() => {
    if (!currentAccount) return [];
    const baseList =
      isMaster && masterSelectedBranch !== 'ALL'
        ? studentAccounts.filter(
            (s) => s && (s.registeredBranchId || 'homies_danang') === masterSelectedBranch
          )
        : studentAccounts.filter(Boolean);

    // Sort by registration date (createdAtMs descending)
    const sorted = [...baseList].sort(
      (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
    );

    const query = studentSearchCode.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter((s) =>
      String(s.studentCode || '')
        .toLowerCase()
        .includes(query)
    );
  }, [studentAccounts, currentAccount, isMaster, masterSelectedBranch, studentSearchCode]);

  const pendingStudentAccountsCount = useMemo(() => {
    return studentAccounts.filter((s) => s && s.status === 'pending').length;
  }, [studentAccounts]);

  // Password Reset Requests visible to Staff cơ sở and Master Admin
  const pendingPasswordResetStudents = useMemo(() => {
    if (!currentAccount) return [];
    return studentAccounts.filter(
      (s) => s && s.passwordResetStatus === 'pending'
    );
  }, [studentAccounts, currentAccount]);

  // Matched student account for the centered Forgot Password pop-up modal
  const forgotPassTargetStudent = useMemo(() => {
    const q = forgotPassQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      studentAccounts.find(
        (s) =>
          s &&
          (s.email?.toLowerCase() === q || String(s.studentCode || '').toLowerCase() === q)
      ) || null
    );
  }, [studentAccounts, forgotPassQuery]);

  // Scoped Entry Requests for current Staff's branch(es)
  const scopedEntryRequests = useMemo(() => {
    if (!currentAccount) return [];
    return entryRequests.filter((req) => {
      if (!req) return false;
      const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
      return (
        activeManagedBranchIds.includes(req.branchId) &&
        !(req.status === 'approved' && exp && nowTick >= exp)
      );
    });
  }, [entryRequests, currentAccount, activeManagedBranchIds, nowTick]);

  const pendingEntryRequestsCountForRole = useMemo(() => {
    if (!currentAccount) return 0;
    return entryRequests.filter(
      (req) => req && req.status === 'pending' && accessibleBranchIds.includes(req.branchId)
    ).length;
  }, [entryRequests, currentAccount, accessibleBranchIds]);

  const bestAvailableCount = useMemo(() => {
    if (branchesList.length === 0) return -1;
    return Math.max(...branchesList.map((b) => Math.max(0, b.total - b.used)));
  }, [branchesList]);

  const campusTotals = useMemo(() => {
    let totalSeats = 0;
    let totalUsed = 0;
    branchesList.forEach((b) => {
      totalSeats += b.total;
      totalUsed += b.used;
    });
    return {
      totalSeats,
      totalUsed,
      totalAvailable: totalSeats - totalUsed
    };
  }, [branchesList]);

  useEffect(() => {
    if (currentAccount) {
      setAccNewUsername(currentAccount.username);
      setAccNewDisplayName(currentAccount.displayName);
      setAccCurrentPassword('');
      setAccNewPassword('');
      setAccConfirmPassword('');
      setAccFeedback(null);

      setContactFormName(currentAccount.contactName || currentAccount.displayName || '');
      setContactFormPhone(currentAccount.contactPhone || '');
      setContactFormEmail(currentAccount.contactEmail || '');
      setContactFormNote(currentAccount.contactNote || '');
      setContactSaveNotice(null);
    }
  }, [currentAccount?.id]);

  // --------------------------------------------------------------------------
  // HANDLERS: STUDENT DIGITAL HOMIES CARD REGISTRATION & LOGIN
  // --------------------------------------------------------------------------
  const handleStudentPortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const portraitDataUrl = await resizeImageToDataURL(file, 320, 400, 'cover');
      setStuRegPortraitPhoto(portraitDataUrl);
      setStuRegNotice(null);
      showToast('Đã tải & nén ảnh thẻ chân dung (< 60KB) thành công!');
    } catch (err: any) {
      setStuRegNotice({
        type: 'error',
        text: err.message || 'Không thể xử lý ảnh chân dung.'
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleRegisterStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = stuRegEmail.trim().toLowerCase();
    const cleanName = stuRegFullName.trim();
    const cleanCode = stuRegCode.trim() || extractStudentCodeFromEmail(cleanEmail);

    if (!isValidUlisStudentEmail(cleanEmail)) {
      setStuRegNotice({
        type: 'error',
        text: 'Hệ thống chỉ nhận Email sinh viên ULIS có 4 số đầu là 2X04 (trong đó X là số năm đăng ký) và đuôi @vnu.edu.vn.'
      });
      return;
    }

    if (!/^2\d04\d{2,6}$/.test(cleanCode)) {
      setStuRegNotice({
        type: 'error',
        text: 'Mã số sinh viên phải bắt đầu bằng 4 số 2X04 (trong đó X là số năm đăng ký).'
      });
      return;
    }

    // Automatic cross-check between Student ID in 2X04...@vnu.edu.vn email and entered Student ID
    const emailExtractedCode = extractStudentCodeFromEmail(cleanEmail);
    if (emailExtractedCode && cleanCode && emailExtractedCode !== cleanCode) {
      setStuRegNotice({
        type: 'error',
        text: `Mã sinh viên (${cleanCode}) KHÔNG KHỚP với Mã sinh viên trong Email (${emailExtractedCode}@vnu.edu.vn). Vui lòng kiểm tra lại!`
      });
      return;
    }

    if (stuRegPassword.length < 6) {
      setStuRegNotice({
        type: 'error',
        text: 'Mật khẩu tài khoản phải có tối thiểu 6 ký tự.'
      });
      return;
    }

    if (stuRegPassword !== stuRegConfirmPassword) {
      setStuRegNotice({
        type: 'error',
        text: 'Xác nhận mật khẩu KHÔNG KHỚP với mật khẩu đã nhập! Vui lòng nhập đúng mật khẩu xác nhận.'
      });
      return;
    }

    if (!cleanName || !cleanCode) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ Họ tên và Mã số sinh viên.'
      });
      return;
    }

    if (!stuRegBranchId || !branchesMap[stuRegBranchId]) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng chọn cơ sở Homies bạn đang đứng để nhân viên tại quầy phê duyệt!'
      });
      return;
    }

    if (!stuRegPortraitPhoto) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng chụp hoặc tải lên Ảnh cá nhân của sinh viên.'
      });
      return;
    }

    const existing = studentAccounts.find((s) => s && s.email?.toLowerCase() === cleanEmail);
    if (existing && existing.status !== 'rejected') {
      setStuRegNotice({
        type: 'error',
        text: 'Email sinh viên @vnu.edu.vn này đã được đăng ký! Vui lòng chuyển sang mục Đăng nhập.'
      });
      return;
    }

    const nowMs = Date.now();
    const accountExpiresAt = nowMs + FOUR_YEARS_MS;
    const newStuId = existing
      ? existing.id
      : `stu_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;

    const newStudentAccount = {
      id: newStuId,
      email: cleanEmail,
      password: stuRegPassword,
      fullName: cleanName,
      studentCode: cleanCode,
      registeredBranchId: stuRegBranchId,
      registeredBranchName: branchesMap[stuRegBranchId]?.name || 'HOMIES Đa năng',
      portraitPhoto: stuRegPortraitPhoto,
      status: 'pending',
      passwordResetStatus: 'none',
      createdAt: getCurrentDateTimeStr(),
      createdAtMs: nowMs,
      accountExpiresAt,
      expiresAtMs: accountExpiresAt,
      updatedAtMs: nowMs
    };

    const nextStudentAccounts = [
      newStudentAccount,
      ...studentAccounts.filter((s) => s && s.id !== newStuId)
    ];

    setStudentAccounts(nextStudentAccounts);
    setPersistedStudentBackup(newStudentAccount);
    setLoggedInStudentId(newStuId);
    setStuRegConfirmPassword('');
    try {
      localStorage.setItem('useatify_active_student_id', newStuId);
      localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(newStudentAccount));
    } catch {}
    await syncAllChannels({ studentAccounts: nextStudentAccounts });

    showToast(
      `Đã gửi hồ sơ đăng ký Thẻ sinh viên số tới ${branchesMap[stuRegBranchId]?.name} để phê duyệt!`
    );
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = stuLoginEmail.trim().toLowerCase();
    const found = studentAccounts.find((s) => s && s.email?.toLowerCase() === cleanEmail);

    if (!found || found.password !== stuLoginPassword) {
      setStuLoginError('Email sinh viên (@vnu.edu.vn) hoặc mật khẩu không chính xác!');
      return;
    }

    setPersistedStudentBackup(found);
    setLoggedInStudentId(found.id);
    try {
      localStorage.setItem('useatify_active_student_id', found.id);
      localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(found));
    } catch {}
    setStuLoginEmail('');
    setStuLoginPassword('');
    setStuLoginError('');
    showToast(`Xin chào sinh viên ${found.fullName}!`);
  };

  // Switch to Inline Forgot Password View
  const openForgotPasswordModal = () => {
    const initialQ = stuLoginEmail.trim() || stuRegEmail.trim() || forgotPassQuery.trim();
    if (initialQ) {
      setForgotPassQuery(initialQ);
      try {
        localStorage.setItem('useatify_forgot_pass_query', initialQ);
      } catch {}
    }
    setForgotPassNewPassword('');
    setForgotPassConfirmPassword('');
    setForgotPassNotice(null);
    setStudentAuthMode('forgot_password');
  };

  // Step 1 in Forgot Password: Student clicks "Xin cấp lại mật khẩu" -> Notify Staff & Admin
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = forgotPassQuery.trim().toLowerCase();
    if (!q) {
      setForgotPassNotice({
        type: 'error',
        text: 'Vui lòng nhập Email sinh viên (@vnu.edu.vn) hoặc Mã số sinh viên của bạn!'
      });
      return;
    }

    const found = studentAccounts.find(
      (s) =>
        s &&
        (s.email?.toLowerCase() === q || String(s.studentCode || '').toLowerCase() === q)
    );

    if (!found) {
      setForgotPassNotice({
        type: 'error',
        text: 'Không tìm thấy tài khoản Thẻ Sinh Viên Số nào khớp với thông tin đã nhập!'
      });
      return;
    }

    try {
      localStorage.setItem('useatify_forgot_pass_query', q);
    } catch {}

    const nowMs = Date.now();
    const updatedStu = {
      ...found,
      passwordResetStatus: 'pending',
      passwordResetRequestedAt: getCurrentDateTimeStr(),
      passwordResetRequestedAtMs: nowMs,
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) => (s && s.id === found.id ? updatedStu : s));
    setStudentAccounts(nextAccounts);
    await syncAllChannels({ studentAccounts: nextAccounts });

    setForgotPassNotice({
      type: 'success',
      text: 'Đã gửi yêu cầu xin cấp lại mật khẩu! Vui lòng đợi nhân viên tại quầy hoặc Admin chấp thuận.'
    });
    showToast('Đã gửi yêu cầu xin cấp lại mật khẩu tới Nhân viên & Admin!');
  };

  // Step 2 in Forgot Password: After Staff/Admin approves -> Student enters "Mật khẩu mới" & "Xác thực lại mật khẩu" -> clicks "Ghi nhận"
  const handleConfirmApprovedPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPassTargetStudent || forgotPassTargetStudent.passwordResetStatus !== 'approved') {
      setForgotPassNotice({
        type: 'error',
        text: 'Yêu cầu của bạn chưa được phê duyệt. Vui lòng chờ nhân viên tại quầy chấp thuận!'
      });
      return;
    }

    if (forgotPassNewPassword.length < 6) {
      setForgotPassNotice({
        type: 'error',
        text: 'Mật khẩu mới phải có tối thiểu 6 ký tự!'
      });
      return;
    }

    if (forgotPassNewPassword !== forgotPassConfirmPassword) {
      setForgotPassNotice({
        type: 'error',
        text: 'Xác thực lại mật khẩu không khớp với mật khẩu mới!'
      });
      return;
    }

    const nowMs = Date.now();
    const updatedStu = {
      ...forgotPassTargetStudent,
      password: forgotPassNewPassword,
      passwordResetStatus: 'none',
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) =>
      s && s.id === forgotPassTargetStudent.id ? updatedStu : s
    );

    setStudentAccounts(nextAccounts);
    if (loggedInStudentId === updatedStu.id) {
      setPersistedStudentBackup(updatedStu);
      try {
        localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(updatedStu));
      } catch {}
    }
    await syncAllChannels({ studentAccounts: nextAccounts });

    setStuLoginEmail(updatedStu.email);
    setForgotPassNewPassword('');
    setForgotPassConfirmPassword('');
    setForgotPassNotice(null);
    setStudentAuthMode('login');
    try {
      localStorage.removeItem('useatify_forgot_pass_query');
    } catch {}
    showToast('Đã thay đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
  };

  // Staff / Admin approves or rejects student's password reset request
  const handleStaffApprovePasswordReset = async (
    studentId: string,
    decision: 'approve' | 'reject'
  ) => {
    const target = studentAccounts.find((s) => s && s.id === studentId);
    if (!target || !currentAccount) return;

    const nowMs = Date.now();
    const updatedStu = {
      ...target,
      passwordResetStatus: decision === 'approve' ? 'approved' : 'none',
      passwordResetApprovedBy: currentAccount.displayName,
      passwordResetApprovedAt: getCurrentDateTimeStr(),
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) => (s && s.id === studentId ? updatedStu : s));
    setStudentAccounts(nextAccounts);
    await syncAllChannels({ studentAccounts: nextAccounts });

    if (decision === 'approve') {
      showToast(
        `Đã chấp thuận cấp lại mật khẩu cho SV ${target.fullName} (${target.studentCode})!`
      );
    } else {
      showToast(`Đã hủy yêu cầu cấp lại mật khẩu của SV ${target.fullName}.`);
    }
  };

  // Submit Inline Change Password Form (Old Password, New Password, Confirm Password)
  const handlePopupChangeStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (changePassOldInput !== currentStudent.password) {
      setChangePassModalNotice({
        type: 'error',
        text: 'Mật khẩu cũ không chính xác! Vui lòng kiểm tra lại.'
      });
      return;
    }

    if (changePassNewInput.length < 6) {
      setChangePassModalNotice({
        type: 'error',
        text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.'
      });
      return;
    }

    if (changePassNewInput !== changePassConfirmInput) {
      setChangePassModalNotice({
        type: 'error',
        text: 'Nhập lại mật khẩu mới không khớp! Vui lòng kiểm tra lại.'
      });
      return;
    }

    const nowMs = Date.now();
    const updatedStu = {
      ...currentStudent,
      password: changePassNewInput,
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) =>
      s && s.id === currentStudent.id ? updatedStu : s
    );

    setStudentAccounts(nextAccounts);
    setPersistedStudentBackup(updatedStu);
    try {
      localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(updatedStu));
    } catch {}
    await syncAllChannels({ studentAccounts: nextAccounts });

    setChangePassOldInput('');
    setChangePassNewInput('');
    setChangePassConfirmInput('');
    setChangePassModalNotice({
      type: 'success',
      text: 'Đã đổi mật khẩu Thẻ Sinh Viên Số thành công!'
    });
    showToast('Đã đổi mật khẩu Thẻ Sinh Viên Số thành công!');
  };

  // Student requests temporary entry pass for a specific Homies branch (2-Hour TTL & Cross-Branch Warning)
  const handleRequestTemporaryEntry = async (branchId: string) => {
    if (!currentStudent || currentStudent.status !== 'approved') {
      showToast('Tài khoản của bạn cần được Staff tại quầy phê duyệt trước khi xin cấp mã.', 'error');
      return;
    }

    const nowMs = Date.now();
    // 1. Check if student already has a pending request or active 2-hour code at this SAME branch
    const existingSameBranch = entryRequests.find((r) => {
      if (!r) return false;
      const exp = r.passExpiresAt || r.expiresAt || r.codeExpiresAtMs || 0;
      return (
        r.studentId === currentStudent.id &&
        r.branchId === branchId &&
        (r.status === 'pending' || (r.status === 'approved' && exp > nowMs))
      );
    });

    if (existingSameBranch) {
      const exp =
        existingSameBranch.passExpiresAt ||
        existingSameBranch.expiresAt ||
        existingSameBranch.codeExpiresAtMs ||
        0;
      if (existingSameBranch.status === 'approved' && exp > nowMs) {
        showToast(
          `Mỗi mã số chỉ xin cấp lại được sau 2 tiếng tại cùng cơ sở! Thời gian còn lại ở ${branchesMap[branchId]?.name}: ${formatCountdownMMSS(exp, nowMs)}`,
          'error'
        );
      } else {
        showToast(
          `Bạn đang có yêu cầu chờ Staff ${branchesMap[branchId]?.name} phê duyệt!`,
          'error'
        );
      }
      return;
    }

    // 2. Check if student already received an active 2-hour code at ANOTHER branch within the last 2 hours
    // find the earliest active approved code within the 2-hour window ("lần đầu mã số được cấp")
    const activeOtherBranchPasses = entryRequests
      .filter((r) => {
        if (!r) return false;
        const exp = r.passExpiresAt || r.expiresAt || r.codeExpiresAtMs || 0;
        return (
          r.studentId === currentStudent.id &&
          r.branchId !== branchId &&
          r.status === 'approved' &&
          exp > nowMs
        );
      })
      .sort((a, b) => (a.approvedAtMs || a.createdAtMs || 0) - (b.approvedAtMs || b.createdAtMs || 0));

    const firstIssuedPass = activeOtherBranchPasses.length > 0 ? activeOtherBranchPasses[0] : null;
    const priorActivePassWarning = firstIssuedPass
      ? {
          firstBranchId: firstIssuedPass.branchId,
          firstBranchName:
            branchesMap[firstIssuedPass.branchId]?.name || firstIssuedPass.branchId,
          firstCode: firstIssuedPass.code,
          firstApprovedAt: firstIssuedPass.approvedAt || firstIssuedPass.requestedAt,
          firstApprovedAtMs: firstIssuedPass.approvedAtMs || firstIssuedPass.createdAtMs,
          firstExpiresAt:
            firstIssuedPass.passExpiresAt ||
            firstIssuedPass.expiresAt ||
            firstIssuedPass.codeExpiresAtMs
        }
      : null;

    const reqId = `req_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
    const newReq = {
      id: reqId,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      studentCode: currentStudent.studentCode,
      studentEmail: currentStudent.email,
      portraitPhoto: currentStudent.portraitPhoto,
      branchId,
      status: 'pending',
      code: null,
      requestedAt: getCurrentTimeHHMM(),
      createdAtMs: nowMs,
      approvedAtMs: null,
      expiresAt: null,
      passExpiresAt: null,
      codeExpiresAtMs: null,
      priorActivePassWarning,
      updatedAtMs: nowMs
    };

    const nextRequests = [newReq, ...entryRequests];
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests });

    if (priorActivePassWarning) {
      showToast(
        `Đã gửi yêu cầu tới Staff ${branchesMap[branchId]?.name} (Kèm thông báo về mã đã cấp lần đầu tại ${priorActivePassWarning.firstBranchName} lúc ${priorActivePassWarning.firstApprovedAt}).`
      );
    } else {
      showToast(`Đã gửi yêu cầu cấp mã số ra vào (2 tiếng) tới Staff ${branchesMap[branchId]?.name}!`);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF APPROVAL & PERMANENT DATABASE DELETION OF STUDENT ACCOUNTS
  // --------------------------------------------------------------------------
  const handleDeleteStudentAccountFromDatabase = async (studentId: string) => {
    const target = studentAccounts.find((s) => s && s.id === studentId);
    const nextDeleted = Array.from(new Set([...deletedIds, studentId]));
    const nextAccounts = studentAccounts.filter((s) => s && s.id !== studentId);
    const nextEntryRequests = entryRequests.filter((r) => r && r.studentId !== studentId);

    setDeletedIds(nextDeleted);
    setStudentAccounts(nextAccounts);
    setEntryRequests(nextEntryRequests);
    setConfirmDeleteSelfStudent(false);
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
    }

    if (loggedInStudentId === studentId) {
      setLoggedInStudentId(null);
      setPersistedStudentBackup(null);
      try {
        localStorage.removeItem('useatify_active_student_id');
        localStorage.removeItem('useatify_active_student_profile_v6');
      } catch {}
    }

    await syncAllChannels({
      studentAccounts: nextAccounts,
      entryRequests: nextEntryRequests,
      deletedIds: nextDeleted
    });

    showToast(
      `Đã xóa vĩnh viễn tài khoản sinh viên ${target?.fullName || ''} (${target?.studentCode || ''}) khỏi cơ sở dữ liệu.`
    );
  };

  const handleMasterApproveStudentAccount = async (
    studentId: string,
    decision: 'approve' | 'delete'
  ) => {
    const target = studentAccounts.find((s) => s && s.id === studentId);
    if (!target) return;

    if (!currentAccount) {
      showToast('Vui lòng đăng nhập tài khoản Staff hoặc Admin để thực hiện!', 'error');
      return;
    }

    const nowMs = Date.now();

    if (decision === 'delete') {
      await handleDeleteStudentAccountFromDatabase(studentId);
      return;
    }

    const accountExpiresAt =
      target.accountExpiresAt || target.expiresAtMs || (target.createdAtMs || nowMs) + FOUR_YEARS_MS;

    const updatedStu = {
      ...target,
      status: 'approved',
      approvedBy: currentAccount?.displayName || 'Staff Homies',
      approvedAt: getCurrentDateTimeStr(),
      approvedAtMs: nowMs,
      accountExpiresAt,
      expiresAtMs: accountExpiresAt,
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) => (s && s.id === studentId ? updatedStu : s));
    setStudentAccounts(nextAccounts);
    if (loggedInStudentId === studentId) {
      setPersistedStudentBackup(updatedStu);
      try {
        localStorage.setItem('useatify_active_student_profile_v6', JSON.stringify(updatedStu));
      } catch {}
    }
    await syncAllChannels({ studentAccounts: nextAccounts });

    showToast(`Đã phê duyệt và kích hoạt Thẻ sinh viên số cho SV ${target.fullName}!`);
  };

  // Branch Staff accepts student's temporary entry request -> generates unique 6-digit code for 2 hours
  const handleStaffApproveEntryRequest = async (requestId: string) => {
    const target = entryRequests.find((r) => r.id === requestId);
    if (!target) return;

    if (!canManageBranch(target.branchId)) {
      showToast('Bạn chỉ có quyền cấp mã cho cơ sở mình phụ trách!', 'error');
      return;
    }

    const nowMs = Date.now();
    const uniqueSixDigitCode = generateUniqueSixDigitCode(entryRequests, nowMs);
    const expiresAtMs = nowMs + TEMP_CODE_TTL_MS; // Date.now() + 7,200,000 (2 tiếng)

    const updatedReq = {
      ...target,
      status: 'approved',
      code: uniqueSixDigitCode,
      approvedBy: currentAccount?.displayName || 'Staff',
      approvedAt: getCurrentTimeHHMM(),
      approvedAtMs: nowMs,
      expiresAt: expiresAtMs,
      passExpiresAt: expiresAtMs,
      codeExpiresAtMs: expiresAtMs,
      updatedAtMs: nowMs
    };

    const nextRequests = entryRequests.map((r) => (r.id === requestId ? updatedReq : r));
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests });

    showToast(
      `Đã phát mã 6 số [${uniqueSixDigitCode}] cho SV ${target.studentName} (Hiệu lực 2 tiếng)!`
    );
  };

  const handleStaffRejectOrClearEntryRequest = async (requestId: string) => {
    const target = entryRequests.find((r) => r.id === requestId);
    if (!target || !canManageBranch(target.branchId)) return;

    const nextDeleted = Array.from(new Set([...deletedIds, requestId]));
    const nextRequests = entryRequests.filter((r) => r.id !== requestId);
    setDeletedIds(nextDeleted);
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests, deletedIds: nextDeleted });
    showToast('Đã xóa yêu cầu cấp mã tạm thời.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: GUEST REVIEWS, SUGGESTIONS & WEBSITE FEEDBACK
  // --------------------------------------------------------------------------
  const handleReviewPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataURL(file, 540, 310);
      setRevPhoto(resized);
      setRevNotice(null);
    } catch (err: any) {
      setRevNotice({ type: 'error', text: err.message || 'Không thể xử lý ảnh.' });
    }
  };

  const handleSubmitGuestReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revContent.trim()) {
      setRevNotice({
        type: 'error',
        text: 'Vui lòng nhập nội dung đánh giá thực tế về tình trạng cơ sở Homies.'
      });
      return;
    }

    const nowMs = Date.now();
    const reviewId = `rev_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
    const newReview = {
      id: reviewId,
      branchId: revBranchId,
      author: revAuthor.trim() || 'Sinh viên ULIS ẩn danh',
      rating: revRating,
      content: revContent.trim(),
      photo: revPhoto || null,
      status: 'pending',
      createdAt: getCurrentDateTimeStr(),
      createdAtMs: nowMs,
      updatedAtMs: nowMs
    };

    const nextReviews = [newReview, ...reviews];
    setReviews(nextReviews);
    await syncAllChannels({ reviews: nextReviews });

    setRevContent('');
    setRevPhoto(null);
    setRevNotice({
      type: 'success',
      text: `Đã lưu đánh giá ${revRating} sao cho ${branchesMap[revBranchId]?.name}! Đánh giá đã được lưu trữ vĩnh viễn và chờ Staff phê duyệt để hiển thị công khai.`
    });
    showToast('Đã lưu đánh giá & hình ảnh! Đang chờ Staff phê duyệt.');
  };

  const handleSuggestionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataURL(file, 540, 310);
      setSugPhoto(resized);
      setSugNotice(null);
    } catch (err: any) {
      setSugNotice({ type: 'error', text: err.message || 'Không thể xử lý ảnh đính kèm.' });
    }
  };

  const handleSubmitGuestSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugContent.trim()) {
      setSugNotice({
        type: 'error',
        text: 'Vui lòng nhập nội dung góp ý hoặc đề xuất cải thiện cho Homies.'
      });
      return;
    }

    const nowMs = Date.now();
    const suggestionId = `sug_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
    const newSuggestion = {
      id: suggestionId,
      branchId: sugBranchId,
      category: sugCategory,
      sender: sugSender.trim() || 'Sinh viên ULIS ẩn danh',
      content: sugContent.trim(),
      photo: sugPhoto || null,
      status: 'unread',
      createdAt: getCurrentDateTimeStr(),
      createdAtMs: nowMs,
      updatedAtMs: nowMs
    };

    const nextSuggestions = [newSuggestion, ...suggestions];
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions });

    setSugContent('');
    setSugPhoto(null);
    setSugNotice({
      type: 'success',
      text: `Cảm ơn bạn! Góp ý cải thiện đã được lưu vĩnh viễn vào Hòm thư của ${branchesMap[sugBranchId]?.name}.`
    });
    showToast(`Đã gửi góp ý tới Staff ${branchesMap[sugBranchId]?.name}!`);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF LOGIN & SEAT COUNTER (+1 / -1)
  // --------------------------------------------------------------------------
  const handleStaffLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();

    const matchedAccount = Object.values(accountsMap).find(
      (acc: any) => acc.username.toLowerCase() === cleanUser
    );

    if (!matchedAccount || matchedAccount.password !== loginPassword) {
      setLoginError('Sai tên đăng nhập hoặc mật khẩu. Vui lòng kiểm tra lại!');
      return;
    }

    setLoggedInAccountId(matchedAccount.id);
    setMasterSelectedBranch('ALL');
    setStaffSubTab('seats');
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    showToast(`Đăng nhập thành công: ${matchedAccount.displayName}`);
  };

  const handleStaffLogout = () => {
    setLoggedInAccountId(null);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
    setAccFeedback(null);
    showToast('Đã đăng xuất khỏi phiên làm việc.');
  };

  const canManageBranch = (branchId: string) => {
    if (!currentAccount) return false;
    return (
      currentAccount.role === 'master' ||
      currentAccount.primaryBranch === branchId ||
      (Array.isArray(currentAccount.allowedBranches) &&
        currentAccount.allowedBranches.includes(branchId))
    );
  };

  const handleAdjustSeatCount = async (branchId: string, delta: number) => {
    if (!canManageBranch(branchId)) return;

    const currentBranch = branchesMap[branchId];
    if (!currentBranch) return;

    const nextUsed = currentBranch.used + delta;
    if (nextUsed < 0 || nextUsed > currentBranch.total) return;

    const updatedBranchObj = {
      ...currentBranch,
      used: nextUsed,
      updatedAt: getCurrentTimeHHMM(),
      updatedAtMs: Date.now()
    };

    const nextBranches = {
      ...branchesMap,
      [branchId]: updatedBranchObj
    };

    setBranchesMap(nextBranches);
    await syncAllChannels({ branchesMap: nextBranches }, branchId);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: BRANCH COVER PHOTO (SELECT -> SAVE PERMANENTLY / EDIT / DELETE)
  // --------------------------------------------------------------------------
  const handleSelectBranchCoverDraft = async (
    branchId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputEl = e.target;
    const file = inputEl?.files?.[0];
    if (!file) return;

    if (!canManageBranch(branchId)) {
      showToast('Tài khoản hiện tại không có quyền chỉnh sửa cơ sở này.', 'error');
      return;
    }

    try {
      const resizedDataUrl = await resizeImageToDataURL(file, 540, 310, 'cover');
      setBranchCoverDrafts((prev) => ({ ...prev, [branchId]: resizedDataUrl }));
      showToast(
        `Đã tải ảnh lên cho ${branchesMap[branchId]?.name}! Hãy bấm "Lưu ảnh vĩnh viễn" để hoàn tất.`
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi đọc tệp ảnh.', 'error');
    } finally {
      if (inputEl) inputEl.value = '';
    }
  };

  const handleSaveBranchCoverPermanent = async (branchId: string) => {
    if (!canManageBranch(branchId)) {
      showToast('Bạn không có quyền lưu ảnh cho cơ sở này.', 'error');
      return;
    }

    const draftImg = branchCoverDrafts[branchId];
    const existingImg = branchesMap[branchId]?.coverImg;
    const finalImg = draftImg || existingImg;

    if (!finalImg) {
      if (branchFileInputRefs.current[branchId]) {
        branchFileInputRefs.current[branchId]?.click();
      }
      showToast('Vui lòng chọn tệp ảnh từ thiết bị trước khi bấm Lưu.', 'error');
      return;
    }

    const updatedBranchObj = {
      ...branchesMap[branchId],
      coverImg: finalImg,
      updatedAtMs: Date.now()
    };
    const nextBranches = {
      ...branchesMap,
      [branchId]: updatedBranchObj
    };

    setBranchesMap(nextBranches);
    setBranchCoverDrafts((prev) => {
      const copy = { ...prev };
      delete copy[branchId];
      return copy;
    });

    await syncAllChannels({ branchesMap: nextBranches }, branchId);
    showToast(`Đã lưu vĩnh viễn ảnh mô tả cho ${branchesMap[branchId]?.name}!`);
  };

  const handleDeleteBranchCoverPermanent = async (branchId: string) => {
    if (!canManageBranch(branchId)) return;
    const updatedBranchObj = {
      ...branchesMap[branchId],
      coverImg: null,
      updatedAtMs: Date.now()
    };
    const nextBranches = {
      ...branchesMap,
      [branchId]: updatedBranchObj
    };

    setBranchesMap(nextBranches);
    setBranchCoverDrafts((prev) => {
      const copy = { ...prev };
      delete copy[branchId];
      return copy;
    });

    await syncAllChannels({ branchesMap: nextBranches }, branchId);
    showToast(`Đã xóa ảnh mô tả của ${branchesMap[branchId]?.name}.`);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF CONTACT INFO SAVE
  // --------------------------------------------------------------------------
  const handleSaveStaffContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    const updatedAcc = {
      ...currentAccount,
      contactName: contactFormName.trim() || currentAccount.displayName,
      contactPhone: contactFormPhone.trim(),
      contactEmail: contactFormEmail.trim(),
      contactNote: contactFormNote.trim(),
      updatedAtMs: Date.now()
    };

    const nextAccounts = {
      ...accountsMap,
      [currentAccount.id]: updatedAcc
    };

    setAccountsMap(nextAccounts);
    await syncAllChannels({ accountsMap: nextAccounts });

    setContactSaveNotice(
      'Đã lưu vĩnh viễn! Thông tin liên hệ của bạn đã được hiển thị ở góc dưới bên phải trang web và tại mục Liên hệ.'
    );
    showToast('Đã lưu thông tin liên hệ hiển thị ở góc dưới bên phải web!');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: MODERATION & SUGGESTION INBOX
  // --------------------------------------------------------------------------
  const handleModerateReview = async (reviewId: string, action: 'approve' | 'delete') => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    if (action === 'delete') {
      const nextDeleted = Array.from(new Set([...deletedIds, reviewId]));
      const nextReviews = reviews.filter((r) => r.id !== reviewId);
      setDeletedIds(nextDeleted);
      setReviews(nextReviews);
      await syncAllChannels({ reviews: nextReviews, deletedIds: nextDeleted });
      showToast('Đã xóa đánh giá vĩnh viễn.');
    } else {
      const updatedRev = {
        ...target,
        status: 'approved',
        moderatedAt: getCurrentTimeHHMM(),
        updatedAtMs: Date.now()
      };
      const nextReviews = reviews.map((r) => (r.id === reviewId ? updatedRev : r));
      setReviews(nextReviews);
      await syncAllChannels({ reviews: nextReviews });
      showToast('Đã phê duyệt! Đánh giá đã được lưu vĩnh viễn và hiển thị công khai.');
    }
  };

  const handleApproveSuggestionToAcknowledged = async (suggestionId: string) => {
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    const nowMs = Date.now();
    const updatedSug = {
      ...target,
      status: 'acknowledged',
      acknowledgedAt: getCurrentDateTimeStr(),
      acknowledgedAtMs: nowMs,
      updatedAtMs: nowMs
    };
    const nextSuggestions = suggestions.map((s) => (s.id === suggestionId ? updatedSug : s));
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions });
    showToast('Đã phê duyệt! Góp ý đã chuyển sang mục "Góp ý được ghi nhận".');
  };

  const handleMarkSuggestionCompleted = async (suggestionId: string) => {
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    const nowMs = Date.now();
    const updatedSug = {
      ...target,
      status: 'completed',
      completedAt: getCurrentDateTimeStr(),
      completedAtMs: nowMs,
      updatedAtMs: nowMs
    };
    const nextSuggestions = suggestions.map((s) => (s.id === suggestionId ? updatedSug : s));
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions });
    showToast('Đã chuyển góp ý vào mục "Đã thực hiện"!');
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    const nextDeleted = Array.from(new Set([...deletedIds, suggestionId]));
    const nextSuggestions = suggestions.filter((s) => s.id !== suggestionId);
    setDeletedIds(nextDeleted);
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions, deletedIds: nextDeleted });
    showToast('Đã xóa góp ý Homies.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: SELF-SERVICE ACCOUNT SECURITY
  // --------------------------------------------------------------------------
  const handleSaveSelfAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    if (!accCurrentPassword) {
      setAccFeedback({
        type: 'error',
        text: 'Vui lòng nhập MẬT KHẨU HIỆN TẠI của bạn để xác thực trước khi lưu thay đổi.'
      });
      return;
    }

    if (accCurrentPassword !== currentAccount.password) {
      setAccFeedback({
        type: 'error',
        text: 'Mật khẩu hiện tại KHÔNG ĐÚNG! Hệ thống từ chối thay đổi thông tin tài khoản.'
      });
      return;
    }

    const cleanNewUser = accNewUsername.trim().toLowerCase();
    const cleanDisplayName = accNewDisplayName.trim();

    if (cleanNewUser.length < 3) {
      setAccFeedback({ type: 'error', text: 'Tên đăng nhập phải có ít nhất 3 ký tự.' });
      return;
    }

    if (!cleanDisplayName) {
      setAccFeedback({ type: 'error', text: 'Tên gọi hiển thị không được để trống.' });
      return;
    }

    const duplicateUser = Object.values(accountsMap).some(
      (acc: any) => acc.id !== currentAccount.id && acc.username.toLowerCase() === cleanNewUser
    );
    if (duplicateUser) {
      setAccFeedback({
        type: 'error',
        text: 'Tên đăng nhập này đã tồn tại ở tài khoản khác. Vui lòng chọn tên khác.'
      });
      return;
    }

    let finalPassword = currentAccount.password;
    if (accNewPassword.trim() !== '') {
      if (accNewPassword.length < 6) {
        setAccFeedback({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
        return;
      }
      if (accNewPassword !== accConfirmPassword) {
        setAccFeedback({ type: 'error', text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });
        return;
      }
      finalPassword = accNewPassword;
    }

    const updatedAccount = {
      ...currentAccount,
      username: cleanNewUser,
      displayName: cleanDisplayName,
      password: finalPassword,
      updatedAtMs: Date.now()
    };

    const nextAccounts = {
      ...accountsMap,
      [currentAccount.id]: updatedAccount
    };

    setAccountsMap(nextAccounts);
    await syncAllChannels({ accountsMap: nextAccounts });

    setAccCurrentPassword('');
    setAccNewPassword('');
    setAccConfirmPassword('');
    setAccFeedback({
      type: 'success',
      text: 'Xác thực mật khẩu hiện tại thành công! Đã lưu vĩnh viễn thông tin tài khoản và mật khẩu mới.'
    });
    showToast('Đã lưu thông tin bảo mật tài khoản cá nhân!');
  };

  const contactCardsList = useMemo(() => {
    const order = ['homies_admin', 'staff_danang', 'staff_a2', 'staff_b2', 'staff_c3'];
    return order
      .map((id) => accountsMap[id])
      .filter((acc) => acc && (acc.contactPhone || acc.contactEmail || acc.contactNote));
  }, [accountsMap]);

  // Active entry requests belonging to the currently logged-in student
  const currentStudentEntryRequests = useMemo(() => {
    if (!currentStudent) return [];
    return entryRequests.filter((req) => {
      const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
      return (
        req.studentId === currentStudent.id &&
        !(req.status === 'approved' && exp && nowTick >= exp)
      );
    });
  }, [currentStudent, entryRequests, nowTick]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ====================================================================
          LIVE WEBRTC CAMERA MODAL FOR STUDENT PASS REGISTRATION
      ==================================================================== */}
      {liveCameraTarget && (
        <LiveCameraModal
          onClose={() => setLiveCameraTarget(null)}
          onCapture={(compressedJpeg) => {
            setStuRegPortraitPhoto(compressedJpeg);
            setStuRegNotice(null);
            showToast('Đã chụp & nén ảnh chân dung (< 60KB) thành công!');
          }}
        />
      )}

      {/* ====================================================================
          LIGHTBOX MODAL FOR FULL-SIZE PHOTO (STRICTLY CENTERED ON SCREEN)
      ==================================================================== */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 text-white">
              <div className="text-xs sm:text-sm font-semibold flex items-center gap-2 min-w-0">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{lightboxPhoto.caption}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-slate-950/90 flex items-center justify-center min-h-[260px] max-h-[80vh]">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.caption}
                referrerPolicy="no-referrer"
                className="block mx-auto max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FLOATING TOAST NOTIFICATION
      ==================================================================== */}
      {toastMessage && (
        <div className="fixed top-20 right-3 left-3 sm:left-auto sm:right-5 z-50 sm:max-w-sm">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-medium ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          TOP HEADER: USEATIFY LOGO + SLOGAN BAR & TOP-RIGHT DROPDOWN SELECTOR
      ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#fbf6f0] border-b border-[#e8dfd1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 sm:py-3 gap-2.5 md:gap-4">
            {/* Brand Identity (Official Logo + Balanced Slogan on Mobile & Laptop) */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 min-w-0">
              <div
                onClick={() => {
                  setActiveTab('guest');
                  setNavDropdownOpen(false);
                }}
                className="flex items-center justify-center cursor-pointer shrink-0"
                title="USEATIFY – Find your space, embrace your pace"
              >
                <UseatifyBrandLogo className="h-10 sm:h-12 w-auto" />
              </div>

              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 w-full sm:w-auto min-w-0">
                <span className="w-4 sm:w-8 h-[2px] bg-[#e07b18]/85 rounded-full shrink-0" />
                <span className="text-[#d96b0c] text-[9px] sm:text-[11px] leading-none select-none shrink-0">
                  ◆
                </span>
                <span className="font-heading italic font-bold text-[12.5px] sm:text-[15px] lg:text-[16px] text-[#2b3748] tracking-tight whitespace-nowrap">
                  {siteConfig.slogan}
                </span>
                <span className="text-[#d96b0c] text-[9px] sm:text-[11px] leading-none select-none shrink-0">
                  ◆
                </span>
                <span className="w-4 sm:w-8 h-[2px] bg-[#e07b18]/85 rounded-full shrink-0" />
              </div>
            </div>

            {/* Category Button + Downward Arrow Dropdown */}
            <div ref={navDropdownRef} className="relative w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setNavDropdownOpen((prev) => !prev)}
                className="w-full md:w-auto inline-flex items-center justify-between md:justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#165b40] hover:bg-[#124b35] text-white text-xs sm:text-sm font-heading font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {activeTab === 'guest' && (
                    <>
                      <Eye className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span className="truncate font-heading">Tra cứu chỗ ngồi Homies</span>
                    </>
                  )}
                  {activeTab === 'student_pass' && (
                    <>
                      <IdCard className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="truncate font-heading">Thẻ Sinh Viên Số (Student Pass)</span>
                    </>
                  )}
                  {activeTab === 'staff' && (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
                      <span className="truncate font-heading">Quản trị viên (Staff)</span>
                      {(pendingEntryRequestsCountForRole > 0 || pendingStudentAccountsCount > 0) && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500 text-white shrink-0">
                          {pendingEntryRequestsCountForRole + pendingStudentAccountsCount}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-emerald-100 transition-transform duration-200 shrink-0 ${
                    navDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 3-Item Dropdown Menu */}
              {navDropdownOpen && (
                <div className="absolute left-0 right-0 md:left-auto md:right-0 mt-1.5 w-full md:w-80 bg-white rounded-xl shadow-xl border border-[#e8dfd1] p-1.5 z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('guest');
                      setNavDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer ${
                      activeTab === 'guest'
                        ? 'bg-emerald-50 text-[#165b40]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Eye className="w-4 h-4 text-[#165b40] shrink-0" />
                      <span className="font-heading">Tra cứu chỗ ngồi Homies</span>
                    </div>
                    {activeTab === 'guest' && <Check className="w-4 h-4 text-[#165b40]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('student_pass');
                      setNavDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer ${
                      activeTab === 'student_pass'
                        ? 'bg-emerald-50 text-[#165b40]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IdCard className="w-4 h-4 text-[#165b40] shrink-0" />
                      <span className="font-heading">Thẻ Sinh Viên Số (Student Pass)</span>
                    </div>
                    {activeTab === 'student_pass' && <Check className="w-4 h-4 text-[#165b40]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('staff');
                      setNavDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left text-xs sm:text-sm font-heading font-semibold transition-colors cursor-pointer ${
                      activeTab === 'staff'
                        ? 'bg-emerald-50 text-[#165b40]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#165b40] shrink-0" />
                      <span className="font-heading">Quản trị viên (Staff)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(pendingEntryRequestsCountForRole > 0 || pendingStudentAccountsCount > 0) && (
                        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500 text-white">
                          {pendingEntryRequestsCountForRole + pendingStudentAccountsCount}
                        </span>
                      )}
                      {activeTab === 'staff' && <Check className="w-4 h-4 text-[#165b40]" />}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT VIEWPORT
      ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ==================================================================
            TAB 1: GUEST MODE (REAL-TIME SEAT LOOKUP, WHY CHOOSE, 5-STAR REVIEWS & SUGGESTION BOX)
        ================================================================== */}
        {activeTab === 'guest' && (
          <div className="space-y-8 sm:space-y-10">
            {/* Hero & Campus Summary Bar */}
            <section className="bg-[#165b40] rounded-2xl p-5 sm:p-7 text-white shadow-xs border border-emerald-900/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="max-w-2xl space-y-2">
                  <div className="text-xs font-medium text-emerald-200">
                    Trường Đại học Ngoại ngữ – ĐHQGHN (ULIS) · Cập nhật lúc {lastSyncedTime}
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-snug">
                    Tra cứu chỗ ngồi Homies &amp; Thẻ Sinh Viên Số
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed">
                    Theo dõi số lượng chỗ trống theo thời gian thực tại 4 không gian tự học ULIS.
                    Cần đăng ký Thẻ sinh viên số hoặc xin cấp mã số ra vào? Truy cập ngay{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('student_pass')}
                      className="underline font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
                    >
                      Thẻ sinh viên số (Student Pass)
                    </button>
                    .
                  </p>
                </div>

                {/* Campus Total KPI Strip */}
                <div className="grid grid-cols-3 gap-1 sm:gap-3 bg-white/10 p-3 sm:p-4 rounded-xl border border-white/15 shrink-0">
                  <div className="text-center px-2 sm:px-4 min-w-0">
                    <div className="text-[11px] sm:text-xs text-emerald-100 font-semibold leading-snug">
                      Tổng sức chứa
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">
                      {campusTotals.totalSeats}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-200/85 leading-snug mt-0.5">
                      4 cơ sở ULIS
                    </div>
                  </div>
                  <div className="text-center px-2 sm:px-4 border-x border-white/15 min-w-0">
                    <div className="text-[11px] sm:text-xs text-amber-200 font-semibold leading-snug">
                      Đang sử dụng
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-amber-300 mt-0.5">
                      {campusTotals.totalUsed}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-200/85 leading-snug mt-0.5">
                      chỗ đang ngồi
                    </div>
                  </div>
                  <div className="text-center px-2 sm:px-4 min-w-0">
                    <div className="text-[11px] sm:text-xs text-emerald-200 font-semibold leading-snug">
                      Còn trống
                    </div>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-300 mt-0.5">
                      {campusTotals.totalAvailable}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-200/85 leading-snug mt-0.5">
                      chỗ trống hiện tại
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4 Real-World ULIS Homies Branch Cards */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Tình trạng chỗ ngồi tại 4 cơ sở Homies – ULIS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Số liệu được nhân viên trực tại từng cơ sở cập nhật trực tiếp và đồng bộ tức thời
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>≤60%: Còn nhiều chỗ</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>61–85%: Tương đối đông</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>&gt;85%: Gần kín / Hết chỗ</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branchesList.map((branch) => {
                  const status = getSeatStatusInfo(branch.used, branch.total);
                  const StatusIcon = status.icon;
                  const isBestChoice =
                    status.available === bestAvailableCount && bestAvailableCount > 0;
                  const ratingObj = branchRatingsMap[branch.id] || { count: 0, avg: null };

                  return (
                    <div
                      key={branch.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
                    >
                      <div>
                        <BranchVisualBanner
                          branch={branch}
                          isBestChoice={isBestChoice}
                          avgRating={ratingObj.avg}
                          reviewCount={ratingObj.count}
                        />

                        <div className="p-4 sm:p-5 space-y-4">
                          {/* Status Row (Never overlaps on mobile) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 min-w-0">
                                <StatusIcon className={`w-4 h-4 shrink-0 ${status.textAccent}`} />
                                <span className={`${status.textAccent} whitespace-nowrap`}>
                                  {status.label}
                                </span>
                                <span className="hidden sm:inline text-slate-400">·</span>
                                <span className="hidden sm:inline text-slate-600 font-medium truncate">
                                  {status.subLabel}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap shrink-0">
                                {status.occupancyRate}% lấp đầy
                              </span>
                            </div>
                            <div className="sm:hidden text-[11px] text-slate-500 font-medium">
                              {status.subLabel}
                            </div>
                          </div>

                          {/* Occupancy Bar */}
                          <div className={`w-full h-3 rounded-full overflow-hidden ${status.barTrack}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${status.barColor}`}
                              style={{ width: `${Math.min(100, status.occupancyRate)}%` }}
                            />
                          </div>

                          {/* 3-Column Seat Numbers */}
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                            <div className="bg-slate-50 rounded-xl px-2 py-2.5 sm:p-3 border border-slate-200/70 text-center min-w-0">
                              <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug">
                                Tổng số chỗ
                              </div>
                              <div className="text-lg sm:text-xl font-mono font-extrabold text-slate-900 mt-0.5">
                                {status.total}
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl px-2 py-2.5 sm:p-3 border border-slate-200/70 text-center min-w-0">
                              <div className="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug">
                                Đang sử dụng
                              </div>
                              <div className="text-lg sm:text-xl font-mono font-extrabold text-slate-800 mt-0.5">
                                {status.used}
                              </div>
                            </div>
                            <div className={`${status.softBg} rounded-xl px-2 py-2.5 sm:p-3 border ${status.cardAccentBorder} text-center min-w-0`}>
                              <div className={`text-[11px] sm:text-xs font-bold leading-snug ${status.textAccent}`}>
                                Chỗ còn trống
                              </div>
                              <div className={`text-lg sm:text-xl font-mono font-extrabold ${status.textAccent} mt-0.5`}>
                                {status.available}
                              </div>
                            </div>
                          </div>

                          {/* Address & Operating Hours */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-slate-800">Địa chỉ:</strong> {branch.address}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-slate-800">Giờ mở cửa:</strong>{' '}
                                {branch.operatingHours}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Quick Actions */}
                      <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStuSelectedBranchForEntry(branch.id);
                            setActiveTab('student_pass');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#165b40] hover:text-emerald-800 cursor-pointer whitespace-nowrap"
                        >
                          <Ticket className="w-3.5 h-3.5 shrink-0" />
                          <span>Xin mã số ra vào (2 tiếng)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRevFilterBranch(branch.id);
                            setGuestCommunityTab('reviews');
                            const el = document.getElementById('community-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Đánh giá &amp; Góp ý cơ sở</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* WHY CHOOSE USEATIFY SECTION */}
            <section className="space-y-5">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-[#165b40]">
                  Tiện ích hệ thống
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                  Vì sao sinh viên ULIS sử dụng USEATIFY?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Giải pháp đồng bộ thời gian thực giúp sinh viên ULIS chủ động tra cứu chỗ ngồi,
                  sử dụng Thẻ sinh viên số và kết nối trực tiếp cùng hệ thống Homies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {WHY_CHOOSE_ITEMS.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={item.num}
                      className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#165b40]">
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {item.num}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                            {item.shortDesc}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {item.detailDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5-STAR REVIEWS (WITH PHOTO) & GÓP Ý HOMIES */}
            <section
              id="community-section"
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="max-w-2xl space-y-1">
                  <div className="text-xs font-semibold text-[#165b40]">
                    Cộng đồng sinh viên ULIS
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Đánh Giá 5 Sao &amp; Góp Ý Homies
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Chia sẻ trải nghiệm thực tế kèm hình ảnh tại 4 cơ sở Homies hoặc gửi góp ý ẩn danh
                    trực tiếp tới Ban Quản lý từng cơ sở.
                  </p>
                </div>

                <div className="flex flex-wrap sm:inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start lg:self-center w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setGuestCommunityTab('reviews')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      guestCommunityTab === 'reviews'
                        ? 'bg-[#165b40] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 shrink-0" />
                    <span>Đánh giá 5 Sao ({approvedReviews.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestCommunityTab('suggestions')}
                    className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      guestCommunityTab === 'suggestions'
                        ? 'bg-[#165b40] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>Góp ý Homies</span>
                  </button>
                </div>
              </div>

              {/* SUB-TAB 1: 5-STAR REVIEW FORM + PUBLIC APPROVED REVIEWS */}
              {guestCommunityTab === 'reviews' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Submit 5-Star Review Form */}
                  <form
                    onSubmit={handleSubmitGuestReview}
                    className="lg:col-span-5 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4"
                  >
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>Gửi đánh giá 5 sao kèm ảnh thực tế</span>
                    </h3>

                    {revNotice && (
                      <div
                        className={`p-3 rounded-xl text-xs font-medium border ${
                          revNotice.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {revNotice.text}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Chọn cơ sở Homies
                      </label>
                      <select
                        value={revBranchId}
                        onChange={(e) => setRevBranchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                      >
                        {branchesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Tên hiển thị (Để trống nếu muốn Ẩn danh)
                      </label>
                      <input
                        type="text"
                        value={revAuthor}
                        onChange={(e) => setRevAuthor(e.target.value)}
                        placeholder="Mặc định: Sinh viên ULIS ẩn danh"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Mức độ hài lòng ({revRating}/5 sao)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setRevHoverRating(star)}
                            onMouseLeave={() => setRevHoverRating(0)}
                            onClick={() => setRevRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 transition-transform hover:scale-110 ${
                                star <= (revHoverRating || revRating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 fill-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Nội dung trải nghiệm thực tế <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={revContent}
                        onChange={(e) => setRevContent(e.target.value)}
                        placeholder="Chia sẻ về không gian, ổ cắm, điều hòa, độ yên tĩnh tại cơ sở..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Đính kèm ảnh chụp thực tế (Tùy chọn)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReviewPhotoUpload}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {revPhoto && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32">
                          <img
                            src={revPhoto}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setRevPhoto(null)}
                            className="absolute top-2 right-2 p-1 rounded-lg bg-slate-900/80 text-white text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Gửi đánh giá 5 sao (Kiểm duyệt trước khi hiển thị)
                    </button>
                  </form>

                  {/* Right: Approved Public Reviews Feed */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-600">
                        Lọc đánh giá theo cơ sở ({filteredGuestReviews.length}):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRevFilterBranch('ALL')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            revFilterBranch === 'ALL'
                              ? 'bg-[#165b40] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Tất cả ({approvedReviews.length})
                        </button>
                        {branchesList.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setRevFilterBranch(b.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              revFilterBranch === b.id
                                ? 'bg-[#165b40] text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {filteredGuestReviews.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-sm text-slate-500">
                        Chưa có đánh giá công khai nào cho cơ sở này. Hãy là người đầu tiên gửi đánh
                        giá 5 sao ở biểu mẫu bên cạnh!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                        {filteredGuestReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {rev.author}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-xs font-bold text-[#165b40]">
                                  {branchesMap[rev.branchId]?.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <StarRatingDisplay rating={rev.rating} size="w-3.5 h-3.5" />
                                <span className="text-[11px] font-mono text-slate-500">
                                  {rev.createdAt}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                              {rev.content}
                            </p>
                            {rev.photo && (
                              <img
                                src={rev.photo}
                                alt={rev.author}
                                onClick={() =>
                                  setLightboxPhoto({
                                    src: rev.photo,
                                    caption: `${rev.author} • ${branchesMap[rev.branchId]?.name}`
                                  })
                                }
                                className="h-36 w-full rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-90 mt-2"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: GÓP Ý HOMIES */}
              {guestCommunityTab === 'suggestions' && (
                <form
                  onSubmit={handleSubmitGuestSuggestion}
                  className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Góp ý Homies gửi trực tiếp tới Quản lý Cơ sở</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Góp ý của bạn được chuyển thẳng vào Hòm thư của Staff phụ trách cơ sở Homies bạn
                      chọn để phê duyệt ghi nhận và thực hiện.
                    </p>
                  </div>

                  {sugNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border ${
                        sugNotice.type === 'error'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {sugNotice.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Cơ sở nhận góp ý
                      </label>
                      <select
                        value={sugBranchId}
                        onChange={(e) => setSugBranchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                      >
                        {branchesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Hạng mục góp ý
                      </label>
                      <select
                        value={sugCategory}
                        onChange={(e) => setSugCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                      >
                        {SUGGESTION_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Thông tin người gửi (Để trống nếu muốn hoàn toàn ẩn danh)
                    </label>
                    <input
                      type="text"
                      value={sugSender}
                      onChange={(e) => setSugSender(e.target.value)}
                      placeholder="Mặc định: Sinh viên ULIS ẩn danh"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nội dung góp ý chi tiết <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={sugContent}
                      onChange={(e) => setSugContent(e.target.value)}
                      placeholder="Mô tả vị trí bàn, ổ điện hỏng hoặc đề xuất cải thiện không gian..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Ảnh minh họa hiện trạng (Tùy chọn)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSuggestionPhotoUpload}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    Gửi Góp ý Homies tới Quản lý Cơ sở
                  </button>
                </form>
              )}
            </section>
          </div>
        )}

        {/* ==================================================================
            TAB 2: STUDENT PASS - THẺ SINH VIÊN SỐ
        ================================================================== */}
        {activeTab === 'student_pass' && (
          <div className="space-y-8">
            {/* Banner Header */}
            <div className="bg-[#165b40] rounded-2xl p-5 sm:p-7 text-white shadow-xs border border-emerald-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200">
                  <IdCard className="w-4 h-4" />
                  <span>Thẻ sinh viên điện tử ULIS</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                  Thẻ Sinh Viên Số ULIS &amp; Cấp Mã Số Ra Vào
                </h1>
              </div>

              {currentStudent && (
                <div className="flex flex-wrap items-center gap-2.5 bg-white/10 px-3.5 py-2.5 rounded-xl border border-white/15 shrink-0">
                  <img
                    src={currentStudent.portraitPhoto}
                    alt={currentStudent.fullName}
                    onClick={() =>
                      setLightboxPhoto({
                        src: currentStudent.portraitPhoto,
                        caption: `Ảnh cá nhân SV ${currentStudent.fullName}`
                      })
                    }
                    className="w-10 h-10 rounded-lg object-cover border border-white/30 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">{currentStudent.fullName}</div>
                    <div className="text-[11px] font-mono text-emerald-200">
                      Mã SV: {currentStudent.studentCode}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-1">
                    <button
                      type="button"
                      onClick={handleStudentExplicitLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
                      title="Đăng xuất tài khoản sinh viên"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>

                    {!confirmDeleteSelfStudent ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSelfStudent(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                        title="Xóa tài khoản sinh viên khỏi cơ sở dữ liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa tài khoản</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-rose-950/90 p-1 rounded-lg border border-rose-400/50">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudentAccountFromDatabase(currentStudent.id)}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSelfStudent(false)}
                          className="px-2 py-1 rounded-md bg-slate-800 text-slate-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MANDATORY OFFICIAL REGULATION NOTICE BOX */}
            <div className="bg-amber-50/95 border border-amber-300/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Quy định đăng ký Thẻ sinh viên số &amp; Cấp mã số ra vào Homies
                </div>
                <p className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-relaxed">
                  &ldquo;Trong lần đăng kí đầu tiên, thẻ sinh viên số cần được đăng kí bằng thẻ sinh
                  viên gốc tại quầy ra vào homies. Từ các lần sau sinh viên chỉ cần yêu cầu xin cấp
                  mã số ra vào trực tiếp trên website, mỗi mã số chỉ ra vào được 1 cơ sở và chỉ xin
                  cấp lại được sau 2 tiếng&rdquo;
                </p>
              </div>
            </div>

            {/* IF STUDENT NOT LOGGED IN: SHOW LOGIN / REGISTER / FORGOT PASSWORD FORMS */}
            {!currentStudent ? (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {/* Switch Login / Register */}
                <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('login')}
                    className={`px-2.5 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold leading-snug text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors ${
                      studentAuthMode === 'login' || studentAuthMode === 'forgot_password'
                        ? 'bg-white text-[#165b40] border-b-2 border-[#165b40]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Đăng nhập Thẻ Sinh Viên Số</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('register')}
                    className={`px-2.5 sm:px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-bold leading-snug text-center flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition-colors ${
                      studentAuthMode === 'register'
                        ? 'bg-white text-[#165b40] border-b-2 border-[#165b40]'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Đăng ký Thẻ Sinh Viên Số Mới</span>
                  </button>
                </div>

                {/* 1. STUDENT LOGIN FORM */}
                {studentAuthMode === 'login' && (
                  <form onSubmit={handleStudentLogin} className="p-5 sm:p-8 space-y-5 max-w-md mx-auto">
                    <div className="text-center space-y-1">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Đăng nhập Tài khoản Sinh viên ULIS
                      </h2>
                      <p className="text-xs text-slate-500">
                        Tài khoản được duy trì đăng nhập lâu dài trên thiết bị cho đến khi bạn bấm
                        Đăng xuất
                      </p>
                    </div>

                    {stuLoginError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                        {stuLoginError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Email Sinh viên (@vnu.edu.vn) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={stuLoginEmail}
                        onChange={(e) => setStuLoginEmail(e.target.value)}
                        placeholder="Nhập email sinh viên"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Mật khẩu <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={stuLoginPassword}
                        onChange={(e) => setStuLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs cursor-pointer"
                    >
                      Mở Thẻ Sinh Viên Số
                    </button>

                    <div className="text-center pt-2 space-y-2.5 border-t border-slate-100">
                      <div>
                        <button
                          type="button"
                          onClick={() => setStudentAuthMode('register')}
                          className="text-xs font-bold text-[#165b40] hover:underline cursor-pointer"
                        >
                          Chưa có Thẻ Sinh Viên Số? Đăng ký tài khoản mới tại quầy Homies →
                        </button>
                      </div>

                      {/* FORGOT PASSWORD LINK SWITCHES INLINE TO FORGOT PASSWORD VIEW */}
                      <div>
                        <button
                          type="button"
                          onClick={openForgotPasswordModal}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 shrink-0" />
                          <span>Quên mật khẩu? Xin cấp lại mật khẩu →</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* 2. INLINE FORGOT PASSWORD FLOW (REQUEST STAFF/ADMIN APPROVAL -> SMOOTH TRANSITION TO NEW PASSWORD) */}
                {studentAuthMode === 'forgot_password' && (
                  <div className="p-5 sm:p-8 max-w-md mx-auto space-y-5 transition-all duration-300">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 mb-1">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        {forgotPassTargetStudent?.passwordResetStatus === 'approved'
                          ? 'Thiết lập Mật khẩu mới'
                          : 'Quên mật khẩu Thẻ Sinh Viên Số'}
                      </h2>
                    </div>

                    {forgotPassTargetStudent?.passwordResetStatus === 'approved' ? (
                      <form
                        onSubmit={handleConfirmApprovedPasswordReset}
                        className="space-y-4 transition-all duration-300"
                      >
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <div className="font-extrabold flex items-center gap-1.5 text-[#165b40]">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Yêu cầu cấp lại mật khẩu đã được chấp thuận!</span>
                          </div>
                          <p className="leading-relaxed">
                            Sinh viên: <strong>{forgotPassTargetStudent.fullName}</strong> (Mã SV:{' '}
                            <span className="font-mono font-bold">
                              {forgotPassTargetStudent.studentCode}
                            </span>
                            ). Vui lòng nhập mật khẩu mới bên dưới.
                          </p>
                        </div>

                        {forgotPassNotice && (
                          <div
                            className={`p-3 rounded-xl text-xs font-semibold border ${
                              forgotPassNotice.type === 'error'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {forgotPassNotice.text}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Mật khẩu mới <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            value={forgotPassNewPassword}
                            onChange={(e) => setForgotPassNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Xác thực lại mật khẩu <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            value={forgotPassConfirmPassword}
                            onChange={(e) => setForgotPassConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs cursor-pointer"
                        >
                          Ghi nhận
                        </button>

                        <div className="text-center pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setStudentAuthMode('login')}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                          >
                            ← Quay lại màn hình Đăng nhập
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleRequestPasswordReset}
                        className="space-y-4 transition-all duration-300"
                      >
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <p>
                            Khi cần cấp lại mật khẩu, vui lòng mang thẻ sinh viên đến gặp nhân viên
                            tại quầy để được hướng dẫn thêm
                          </p>
                        </div>

                        {forgotPassNotice && (
                          <div
                            className={`p-3 rounded-xl text-xs font-semibold border ${
                              forgotPassNotice.type === 'error'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {forgotPassNotice.text}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Email sinh viên (@vnu.edu.vn) hoặc Mã số sinh viên{' '}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={forgotPassQuery}
                            onChange={(e) => {
                              setForgotPassQuery(e.target.value);
                              try {
                                localStorage.setItem('useatify_forgot_pass_query', e.target.value);
                              } catch {}
                            }}
                            placeholder="Nhập email sinh viên hoặc mã số sinh viên"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                          />
                        </div>

                        {forgotPassTargetStudent?.passwordResetStatus === 'pending' && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2.5">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#165b40] shrink-0" />
                            <span className="font-semibold leading-relaxed">
                              Đã gửi yêu cầu cho SV{' '}
                              <strong>{forgotPassTargetStudent.fullName}</strong> (
                              {forgotPassTargetStudent.studentCode}). Đang chờ Nhân viên tại quầy
                              hoặc Admin chấp thuận...
                            </span>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-xs cursor-pointer"
                        >
                          Xin cấp lại mật khẩu
                        </button>

                        <div className="text-center pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setStudentAuthMode('login')}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                          >
                            ← Quay lại màn hình Đăng nhập
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* 3. STUDENT REGISTRATION FORM: CONFIRM PASSWORD + 4-DIGIT EMAIL OTP + HOMIES BRANCH + PORTRAIT */}
                {studentAuthMode === 'register' && (
                  <form onSubmit={handleRegisterStudentAccount} className="p-5 sm:p-8 space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        Đăng ký Thẻ Sinh Viên Số ULIS – ĐHQGHN (Tại quầy ra vào Homies)
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Chỉ nhận Email sinh viên ULIS, chọn cơ sở Homies bạn đang đứng và tải lên ảnh
                        cá nhân để nhân viên tại quầy đối chiếu và phê duyệt.
                      </p>
                    </div>

                    {stuRegNotice && (
                      <div
                        className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold border ${
                          stuRegNotice.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {stuRegNotice.text}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Họ và tên Sinh viên <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={stuRegFullName}
                          onChange={(e) => setStuRegFullName(e.target.value)}
                          placeholder="Nhập họ và tên sinh viên"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Email Sinh viên (@vnu.edu.vn) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={stuRegEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStuRegEmail(val);
                            const codeFromMail = extractStudentCodeFromEmail(val);
                            if (codeFromMail) {
                              setStuRegCode(codeFromMail);
                            }
                          }}
                          placeholder="Nhập email sinh viên"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Mã số sinh viên <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={stuRegCode}
                          onChange={(e) => setStuRegCode(e.target.value)}
                          placeholder="Nhập mã số sinh viên"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Mật khẩu tài khoản (Tối thiểu 6 ký tự){' '}
                          <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={stuRegPassword}
                          onChange={(e) => setStuRegPassword(e.target.value)}
                          placeholder="Nhập mật khẩu bảo mật"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium"
                        />
                      </div>

                      {/* CONFIRM PASSWORD */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Xác nhận mật khẩu <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={stuRegConfirmPassword}
                          onChange={(e) => setStuRegConfirmPassword(e.target.value)}
                          placeholder="Nhập lại đúng mật khẩu vừa tạo"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium ${
                            stuRegConfirmPassword && stuRegConfirmPassword !== stuRegPassword
                              ? 'border-rose-400 bg-rose-50/40'
                              : stuRegConfirmPassword && stuRegConfirmPassword === stuRegPassword
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-slate-300'
                          }`}
                        />
                        {stuRegConfirmPassword && (
                          <div
                            className={`text-[11px] font-semibold ${
                              stuRegConfirmPassword === stuRegPassword
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {stuRegConfirmPassword === stuRegPassword
                              ? '✓ Mật khẩu xác nhận đã khớp'
                              : '✗ Mật khẩu xác nhận chưa khớp'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SELECT WHICH HOMIES BRANCH THE STUDENT IS CURRENTLY AT */}
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs sm:text-sm font-extrabold text-slate-800">
                        Bạn đang ở Homies nào? (Chọn cơ sở đang đứng để nhân viên tại quầy duyệt tài khoản){' '}
                        <span className="text-rose-600">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {branchesList.map((b) => {
                          const isSelected = stuRegBranchId === b.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setStuRegBranchId(b.id)}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-emerald-50 border-[#165b40] ring-2 ring-[#165b40]/20'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {b.name}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {b.address}
                                </div>
                              </div>
                              {isSelected && (
                                <span className="px-2.5 py-1 rounded-full bg-[#165b40] text-white text-[10px] font-bold whitespace-nowrap shrink-0">
                                  Đang chọn ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ONLY PORTRAIT PHOTO REQUIRED */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Ảnh cá nhân sinh viên <span className="text-rose-600">*</span>
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                          Chỉ cần ảnh cá nhân • JPEG &lt; 60KB
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cung cấp ảnh cá nhân rõ mặt để hiển thị trên Thẻ sinh viên số và để nhân
                        viên tại quầy <strong>{branchesMap[stuRegBranchId]?.name}</strong> đối chiếu
                        với thẻ sinh viên gốc trong lần đăng ký đầu tiên.
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setLiveCameraTarget('portrait')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>Mở Camera chụp ảnh</span>
                        </button>

                        <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer">
                          <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Tải ảnh cá nhân lên</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStudentPortraitUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {stuRegPortraitPhoto && (
                        <div className="pt-2 flex items-center gap-4">
                          <img
                            src={stuRegPortraitPhoto}
                            alt="Chân dung sinh viên"
                            className="w-24 sm:w-28 h-32 sm:h-36 object-cover rounded-xl border-2 border-[#165b40] shadow-xs shrink-0"
                          />
                          <div className="text-xs text-emerald-800 font-semibold space-y-1">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Đã tải ảnh cá nhân hợp lệ</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal">
                              Đã tự động tối ưu dung lượng chuẩn JPEG &lt; 60KB để đồng bộ tức thời.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
                    >
                      Hoàn tất Đăng ký &amp; Gửi tới {branchesMap[stuRegBranchId]?.name} phê duyệt
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* IF STUDENT IS LOGGED IN: SHOW PENDING STATUS OR APPROVED DIGITAL CARD + 2-HOUR PASS */
              <div className="space-y-8">
                {currentStudent.status === 'pending' ? (
                  <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-amber-300 p-5 sm:p-8 shadow-xs space-y-5">
                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          Hồ sơ Thẻ Sinh Viên Số đang chờ phê duyệt tại quầy
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          Yêu cầu đăng ký của bạn đã được chuyển tới{' '}
                          <strong className="text-[#165b40]">
                            {branchesMap[currentStudent.registeredBranchId || 'homies_danang']
                              ?.name ||
                              currentStudent.registeredBranchName ||
                              'Homies'}
                          </strong>
                          . Vui lòng xuất trình{' '}
                          <strong>thẻ sinh viên gốc tại quầy ra vào Homies</strong> để nhân viên xác
                          nhận kích hoạt lần đầu.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <img
                        src={currentStudent.portraitPhoto}
                        alt="Portrait"
                        className="w-28 h-36 object-cover rounded-xl border-2 border-[#165b40] shrink-0"
                      />
                      <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 w-full min-w-0">
                        <div>
                          Họ và tên:{' '}
                          <strong className="text-slate-900">{currentStudent.fullName}</strong>
                        </div>
                        <div>
                          Mã số sinh viên:{' '}
                          <strong className="font-mono text-[#165b40]">
                            {currentStudent.studentCode}
                          </strong>
                        </div>
                        <div className="break-all">
                          Email sinh viên:{' '}
                          <strong className="font-mono text-slate-900">{currentStudent.email}</strong>
                        </div>
                        <div>
                          Cơ sở đăng ký phê duyệt:{' '}
                          <strong className="text-emerald-800">
                            {branchesMap[currentStudent.registeredBranchId || 'homies_danang']
                              ?.name ||
                              currentStudent.registeredBranchName ||
                              'HOMIES Đa năng'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* INLINE CHANGE PASSWORD FORM FOR PENDING STUDENT (OLD, NEW, CONFIRM PASSWORD) */}
                    <form
                      onSubmit={handlePopupChangeStudentPassword}
                      className="pt-4 border-t border-slate-200 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                        <KeyRound className="w-4 h-4 text-[#165b40] shrink-0" />
                        <span>Đổi mật khẩu Thẻ Sinh Viên Số</span>
                      </div>
                      {changePassModalNotice && (
                        <div
                          className={`p-2.5 rounded-xl text-xs font-semibold border ${
                            changePassModalNotice.type === 'error'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {changePassModalNotice.text}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="password"
                          required
                          value={changePassOldInput}
                          onChange={(e) => setChangePassOldInput(e.target.value)}
                          placeholder="Mật khẩu cũ"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                        />
                        <input
                          type="password"
                          required
                          value={changePassNewInput}
                          onChange={(e) => setChangePassNewInput(e.target.value)}
                          placeholder="Mật khẩu mới (≥ 6 ký tự)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                        />
                        <input
                          type="password"
                          required
                          value={changePassConfirmInput}
                          onChange={(e) => setChangePassConfirmInput(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer"
                      >
                        Đổi mật khẩu
                      </button>
                    </form>
                  </div>
                ) : (
                  /* APPROVED STUDENT VIEW: DIGITAL STUDENT CARD + TEMPORARY 6-DIGIT 2-HOUR PASS SERVICE */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* LEFT COLUMN: DIGITAL HOMIES STUDENT CARD */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                      {/* REDESIGNED CLEAN HEADER BAR FOR BOTH LAPTOP & PHONE (NO WRAPPED BADGE OR BROKEN WORDS) */}
                      <div className="bg-gradient-to-r from-[#165b40] to-[#1f7a56] px-4 sm:px-5 py-4 text-white space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-200 uppercase truncate">
                            ĐHQGHN – TRƯỜNG ĐH NGOẠI NGỮ
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/55 border border-emerald-400/35 text-[11px] font-bold text-emerald-100 whitespace-nowrap shrink-0">
                            ✓ Đã xác thực
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
                          THẺ SINH VIÊN SỐ ULIS
                        </h2>
                      </div>

                      <div className="p-5 sm:p-6 space-y-5">
                        <div className="flex items-start gap-3.5 sm:gap-4">
                          <img
                            src={currentStudent.portraitPhoto}
                            alt={currentStudent.fullName}
                            onClick={() =>
                              setLightboxPhoto({
                                src: currentStudent.portraitPhoto,
                                caption: `Ảnh cá nhân SV ${currentStudent.fullName}`
                              })
                            }
                            className="w-22 sm:w-24 h-30 sm:h-32 rounded-xl object-cover border-2 border-[#165b40] shadow-xs shrink-0 cursor-pointer"
                          />
                          <div className="space-y-2 text-xs min-w-0 flex-1">
                            <div>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                HỌ VÀ TÊN SINH VIÊN
                              </div>
                              <div className="text-sm sm:text-base font-extrabold text-slate-900 break-words">
                                {currentStudent.fullName}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                MÃ SỐ SINH VIÊN
                              </div>
                              <div className="text-sm font-mono font-bold text-[#165b40]">
                                {currentStudent.studentCode}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                EMAIL SINH VIÊN ULIS
                              </div>
                              <div className="text-xs font-medium text-slate-700 break-all">
                                {currentStudent.email}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                CƠ SỞ ĐĂNG KÝ KÍCH HOẠT
                              </div>
                              <div className="text-xs font-bold text-emerald-700">
                                {branchesMap[currentStudent.registeredBranchId || 'homies_danang']
                                  ?.name ||
                                  currentStudent.registeredBranchName ||
                                  'Homies ULIS'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* LAPTOP ONLY: COLLAPSIBLE "BẢO MẬT" SECTION PLACED RIGHT BELOW "CƠ SỞ ĐĂNG KÝ KÍCH HOẠT" */}
                        <div className="hidden lg:block pt-4 border-t border-slate-200/90">
                          <button
                            type="button"
                            onClick={() => setDesktopSecurityOpen((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-800 hover:text-[#165b40] transition-colors cursor-pointer select-none"
                          >
                            <span>Bảo mật</span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                                desktopSecurityOpen ? 'rotate-180 text-[#165b40]' : ''
                              }`}
                            />
                          </button>

                          {desktopSecurityOpen && (
                            <form
                              onSubmit={handlePopupChangeStudentPassword}
                              className="mt-3 space-y-2.5"
                            >
                              {changePassModalNotice && (
                                <div
                                  className={`p-2.5 rounded-xl text-xs font-semibold border ${
                                    changePassModalNotice.type === 'error'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {changePassModalNotice.text}
                                </div>
                              )}

                              <div className="space-y-2">
                                <input
                                  type="password"
                                  required
                                  value={changePassOldInput}
                                  onChange={(e) => setChangePassOldInput(e.target.value)}
                                  placeholder="Mật khẩu cũ"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                                />
                                <input
                                  type="password"
                                  required
                                  value={changePassNewInput}
                                  onChange={(e) => setChangePassNewInput(e.target.value)}
                                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                                />
                                <input
                                  type="password"
                                  required
                                  value={changePassConfirmInput}
                                  onChange={(e) => setChangePassConfirmInput(e.target.value)}
                                  placeholder="Nhập lại mật khẩu"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                                />
                                <button
                                  type="submit"
                                  className="w-full py-2.5 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer transition-colors"
                                >
                                  Đổi mật khẩu
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: REQUEST 2-HOUR ENTRY CODE (+ MOBILE CHANGE PASSWORD AT BOTTOM) */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
                      <div className="space-y-1.5 border-b border-slate-200 pb-4">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#165b40]">
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span>CẤP MÃ SỐ RA VÀO TRỰC TIẾP TRÊN WEBSITE (HIỆU LỰC 2 TIẾNG)</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          Xin cấp mã số ra vào tại Cơ sở Homies
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          Mỗi mã số 6 chữ số có hiệu lực trong <strong>2 tiếng (02:00:00)</strong>,
                          chỉ ra vào được <strong>1 cơ sở</strong> và chỉ xin cấp lại tại cơ sở đó sau{' '}
                          <strong>2 tiếng</strong>. Nếu đang trong 2 tiếng mà bạn xin cấp mã tại cơ sở
                          khác, hệ thống sẽ gửi thông báo cho nhân viên đang phê duyệt về lần đầu mã
                          số được cấp.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs sm:text-sm font-bold text-slate-700">
                          Chọn cơ sở Homies bạn muốn xin cấp mã ra vào:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {branchesList.map((b) => {
                            const selected = stuSelectedBranchForEntry === b.id;
                            const st = getSeatStatusInfo(b.used, b.total);
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setStuSelectedBranchForEntry(b.id)}
                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  selected
                                    ? 'bg-emerald-50/90 border-[#165b40] ring-2 ring-[#165b40]/20'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {b.name}
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-emerald-700 whitespace-nowrap shrink-0">
                                    Trống {st.available}/{st.total}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 truncate">
                                  {b.address}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRequestTemporaryEntry(stuSelectedBranchForEntry)}
                          className="w-full py-3.5 px-4 sm:px-5 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 text-center"
                        >
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span>
                            Yêu cầu xin cấp mã số ra vào (2 tiếng) tại{' '}
                            {branchesMap[stuSelectedBranchForEntry]?.name}
                          </span>
                        </button>
                      </div>

                      {/* Real-time Active / Pending Requests & 2-Hour Countdown Display */}
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                          Trạng thái Yêu cầu &amp; Mã số ra vào (hiệu lực 2 tiếng) của bạn:
                        </h4>

                        {currentStudentEntryRequests.length === 0 ? (
                          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs sm:text-sm text-slate-500">
                            Chưa có mã số ra vào nào đang trong thời hạn 2 tiếng.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {currentStudentEntryRequests.map((req) => {
                              const exp =
                                req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
                              const isApproved = req.status === 'approved' && req.code;
                              return (
                                <div
                                  key={req.id}
                                  className={`p-4 sm:p-5 rounded-2xl border ${
                                    isApproved
                                      ? 'bg-slate-900 text-white border-emerald-500 shadow-lg'
                                      : 'bg-amber-50/80 border-amber-300 text-slate-900'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-xs sm:text-sm font-bold">
                                      Cơ sở:{' '}
                                      <span className={isApproved ? 'text-emerald-400' : 'text-amber-900'}>
                                        {branchesMap[req.branchId]?.name}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono opacity-80">
                                      Yêu cầu lúc {req.requestedAt}
                                    </span>
                                  </div>

                                  {req.priorActivePassWarning && (
                                    <div
                                      className={`mt-2.5 p-2.5 rounded-xl border text-[11px] font-semibold ${
                                        isApproved
                                          ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                                          : 'bg-amber-100/90 border-amber-300 text-amber-900'
                                      }`}
                                    >
                                      ⚠️ Đã đính kèm thông báo: Bạn đã được cấp mã lần đầu tại{' '}
                                      <strong>{req.priorActivePassWarning.firstBranchName}</strong> (Mã:{' '}
                                      <span className="font-mono font-bold">
                                        {req.priorActivePassWarning.firstCode}
                                      </span>{' '}
                                      lúc {req.priorActivePassWarning.firstApprovedAt}) trong 2 tiếng qua.
                                    </div>
                                  )}

                                  {isApproved ? (
                                    <div className="mt-4 text-center space-y-2">
                                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-300 tracking-wider">
                                        MÃ SỐ RA VÀO 6 CHỮ SỐ (HIỆU LỰC 2 TIẾNG TẠI 1 CƠ SỞ)
                                      </div>
                                      <div className="text-3xl sm:text-5xl font-mono font-extrabold tracking-[0.2em] sm:tracking-[0.28em] text-amber-300 bg-slate-950 py-3.5 sm:py-4 px-3 sm:px-6 rounded-xl border border-emerald-500/40 select-all">
                                        {req.code}
                                      </div>
                                      <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-rose-300 pt-1">
                                        <Timer className="w-4 h-4 animate-spin shrink-0" />
                                        <span>
                                          Hiệu lực còn lại: {formatCountdownMMSS(exp, nowTick)}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
                                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                                      <span>
                                        Đang chờ {branchesMap[req.branchId]?.name} xác nhận &amp;
                                        phát mã số (hiệu lực 2 tiếng)...
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* MOBILE ONLY: INLINE CHANGE PASSWORD PLACED BELOW ENTRY REQUEST STATUS & 6-DIGIT CODE SECTION */}
                      <form
                        onSubmit={handlePopupChangeStudentPassword}
                        className="lg:hidden pt-5 border-t border-slate-200 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                          <KeyRound className="w-4 h-4 text-[#165b40] shrink-0" />
                          <span>Đổi mật khẩu Thẻ Sinh Viên Số</span>
                        </div>

                        {changePassModalNotice && (
                          <div
                            className={`p-3 rounded-xl text-xs font-semibold border ${
                              changePassModalNotice.type === 'error'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {changePassModalNotice.text}
                          </div>
                        )}

                        <div className="space-y-2.5">
                          <input
                            type="password"
                            required
                            value={changePassOldInput}
                            onChange={(e) => setChangePassOldInput(e.target.value)}
                            placeholder="Mật khẩu cũ"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                          />
                          <input
                            type="password"
                            required
                            value={changePassNewInput}
                            onChange={(e) => setChangePassNewInput(e.target.value)}
                            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                          />
                          <input
                            type="password"
                            required
                            value={changePassConfirmInput}
                            onChange={(e) => setChangePassConfirmInput(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:bg-white"
                          />
                          <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                          >
                            Đổi mật khẩu
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================
            TAB 3: STAFF MANAGEMENT (5 ACCOUNTS, SEAT ±1, 6-DIGIT PASSES, MASTER STUDENT APPROVAL)
        ================================================================== */}
        {activeTab === 'staff' && (
          <div className="space-y-8">
            {!currentAccount ? (
              <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white mb-1">
                    <Lock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Đăng nhập Quản trị viên (STAFF)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dành cho Ban Quản lý và Nhân sự trực tại các cơ sở Homies ULIS
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleStaffLogin} className="space-y-4" autoComplete="off">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Tên đăng nhập</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Đăng nhập Hệ thống Quản trị
                  </button>
                </form>
              </div>
            ) : (
              /* LOGGED-IN STAFF DASHBOARD */
              <div className="space-y-6">
                {/* Staff Top Status Bar */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                      {isMaster ? <Crown className="w-4 h-4 text-amber-400" /> : <UserCheck className="w-4 h-4" />}
                      <span>{currentAccount.roleBadge}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold">
                      {currentAccount.displayName}
                    </h2>
                    <p className="text-xs text-slate-300">
                      Tài khoản: <span className="font-mono font-bold">{currentAccount.username}</span>{' '}
                      · Đồng bộ thời gian thực cùng Firebase &amp; IndexedDB
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {isMaster && (
                      <select
                        value={masterSelectedBranch}
                        onChange={(e) => setMasterSelectedBranch(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                      >
                        <option value="ALL">Quản lý tất cả 4 cơ sở Homies</option>
                        {branchesList.map((b) => (
                          <option key={b.id} value={b.id}>
                            Chỉ xem: {b.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={handleStaffLogout}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* STAFF WORKSPACE: VERTICAL COLLAPSIBLE/PINNABLE SIDEBAR + MAIN PANEL */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Vertical Navigation Sidebar (Supports Pinning or Auto-Collapsing on Mouse Leave) */}
                  <aside
                    onMouseEnter={() => setIsStaffSidebarHovered(true)}
                    onMouseLeave={() => setIsStaffSidebarHovered(false)}
                    className={`w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs transition-all duration-200 shrink-0 overflow-hidden ${
                      isStaffSidebarPinned || isStaffSidebarHovered ? 'lg:w-72' : 'lg:w-20'
                    }`}
                  >
                    {/* Sidebar Header with Pin / Auto-Collapse Toggle Button */}
                    <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
                      <span
                        className={`text-[11px] font-extrabold text-slate-500 uppercase tracking-wider truncate ${
                          isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                        }`}
                      >
                        Danh mục Quản trị
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsStaffSidebarPinned((prev) => !prev)}
                        title={
                          isStaffSidebarPinned
                            ? 'Đang ghim thanh dọc (Bấm để tự động thu nhỏ khi không dùng)'
                            : 'Đang tự thu nhỏ (Bấm để ghim cố định thanh dọc)'
                        }
                        className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          isStaffSidebarPinned
                            ? 'bg-emerald-50 text-[#165b40] border border-emerald-200'
                            : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80 mx-auto'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        {(isStaffSidebarPinned || isStaffSidebarHovered) && (
                          <span>{isStaffSidebarPinned ? 'Đã ghim' : 'Tự thu nhỏ'}</span>
                        )}
                      </button>
                    </div>

                    {/* Vertical Navigation Items (2-col grid on mobile so labels never squish, vertical sidebar on laptop) */}
                    <nav className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStaffSubTab('seats')}
                        title="Cập nhật chỗ ngồi (+1/-1) & Ảnh cơ sở"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'seats'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <LayoutGrid className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Đếm chỗ (+1/-1) &amp; Ảnh cơ sở
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('entry_codes')}
                        title="Cấp mã vào cửa tạm thời (6 số • Hiệu lực 2 tiếng)"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'entry_codes'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <Ticket className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Cấp mã vào tạm thời
                          </span>
                        </div>
                        {pendingEntryRequestsCountForRole > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded-full bg-rose-500 text-white shrink-0">
                            {pendingEntryRequestsCountForRole}
                          </span>
                        )}
                      </button>

                      {/* AVAILABLE TO BOTH BRANCH STAFF AND MASTER ADMIN */}
                      <button
                        type="button"
                        onClick={() => setStaffSubTab('student_approvals')}
                        title="Duyệt Tài khoản Thẻ Sinh viên số"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'student_approvals'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <IdCard className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Duyệt Tài khoản Sinh viên
                          </span>
                        </div>
                        {(pendingStudentAccountsCount + pendingPasswordResetStudents.length) > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded-full bg-amber-500 text-slate-950 shrink-0">
                            {pendingStudentAccountsCount + pendingPasswordResetStudents.length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('moderation')}
                        title="Duyệt Đánh giá 5 sao"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'moderation'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <Star className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Duyệt Đánh giá 5 sao
                          </span>
                        </div>
                        {pendingReviewsCountForCurrentRole > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded-full bg-amber-500 text-slate-950 shrink-0">
                            {pendingReviewsCountForCurrentRole}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('suggestions')}
                        title="Hòm thư Góp ý nội bộ"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'suggestions'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <Inbox className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Hòm thư Góp ý
                          </span>
                        </div>
                        {unreadSuggestionsCountForCurrentRole > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-extrabold rounded-full bg-rose-500 text-white shrink-0">
                            {unreadSuggestionsCountForCurrentRole}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('branding_contact')}
                        title="Thông tin Liên hệ"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'branding_contact'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <Phone className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Thông tin Liên hệ
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('account')}
                        title="Đổi mật khẩu cá nhân"
                        className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          staffSubTab === 'account'
                            ? 'bg-[#165b40] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <KeyRound className="w-4 h-4 shrink-0" />
                          <span
                            className={`truncate ${
                              isStaffSidebarPinned || isStaffSidebarHovered ? '' : 'lg:hidden'
                            }`}
                          >
                            Đổi mật khẩu cá nhân
                          </span>
                        </div>
                      </button>
                    </nav>
                  </aside>

                  {/* Right Main Content Area */}
                  <div className="flex-1 w-full min-w-0">
                    {/* STAFF SUB-TAB 1: SEAT COUNTER (+1 / -1) & BRANCH COVER PHOTOS */}
                    {staffSubTab === 'seats' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {branchesList
                          .filter((b) => activeManagedBranchIds.includes(b.id))
                          .map((branch) => {
                            const st = getSeatStatusInfo(branch.used, branch.total);
                            const draftCover = branchCoverDrafts[branch.id];
                            return (
                              <div
                                key={branch.id}
                                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-5"
                              >
                                {/* Card Header */}
                                <div className="space-y-2.5 pb-3.5 border-b border-slate-100">
                                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight min-w-0">
                                      <span className="truncate">{branch.name}</span>
                                    </h3>

                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 whitespace-nowrap ${st.softBg} ${st.textAccent} ${st.cardAccentBorder}`}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${st.barColor}`} />
                                      <span>{st.label}</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 flex-nowrap text-[11px] sm:text-xs text-slate-600">
                                    <span
                                      className="inline-flex items-center gap-1 font-medium text-slate-600 tracking-tight min-w-0"
                                      title={branch.address}
                                    >
                                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                      <span className="truncate">{branch.address}</span>
                                    </span>

                                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0">
                                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
                                      <span>
                                        Cập nhật:{' '}
                                        <strong className="text-slate-800 font-mono font-bold">
                                          {branch.updatedAt}
                                        </strong>
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {/* Center Large Seat Display Box */}
                                <div className="bg-slate-50 rounded-xl py-5 px-4 text-center border border-slate-200/70 space-y-1">
                                  <div className="flex items-baseline justify-center gap-1.5 font-mono">
                                    <span className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                                      {branch.used}
                                    </span>
                                    <span className="text-xl sm:text-2xl font-semibold text-slate-400">
                                      / {branch.total}
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm font-medium text-slate-600">
                                    Đang sử dụng · Còn trống{' '}
                                    <strong className={`font-bold ${st.textAccent}`}>
                                      {st.available} chỗ
                                    </strong>
                                  </div>
                                </div>

                                {/* Occupancy Rate Bar */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-500">Công suất lấp đầy</span>
                                    <span className={st.textAccent}>{st.occupancyRate}%</span>
                                  </div>
                                  <div
                                    className={`w-full h-3 rounded-full overflow-hidden ${st.barTrack}`}
                                  >
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${st.barColor}`}
                                      style={{ width: `${Math.min(100, st.occupancyRate)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Side-by-Side Large -1 (Khách rời đi) and +1 (Khách mới đến) Buttons */}
                                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSeatCount(branch.id, -1)}
                                    disabled={branch.used <= 0}
                                    className="py-4 px-3 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white flex flex-col items-center justify-center shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                                  >
                                    <span className="text-2xl sm:text-3xl font-mono font-bold leading-none">
                                      −1
                                    </span>
                                    <span className="text-xs font-semibold text-rose-50 mt-1.5">
                                      Khách rời đi
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSeatCount(branch.id, 1)}
                                    disabled={branch.used >= branch.total}
                                    className="py-4 px-3 sm:px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 active:scale-[0.99] text-white flex flex-col items-center justify-center shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                                  >
                                    <span className="text-2xl sm:text-3xl font-mono font-bold leading-none">
                                      +1
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-50 mt-1.5">
                                      Khách mới đến
                                    </span>
                                  </button>
                                </div>

                                {/* Branch Cover Image Management (Lưu vĩnh viễn) */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                      <ImageIcon className="w-4 h-4 text-[#165b40] shrink-0" />
                                      <span>Ảnh mô tả {branch.name}</span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-[#165b40]">
                                      Đã đồng bộ
                                    </span>
                                  </div>

                                  {(draftCover || branch.coverImg) && (
                                    <img
                                      src={draftCover || branch.coverImg}
                                      alt={branch.name}
                                      onClick={() =>
                                        setLightboxPhoto({
                                          src: draftCover || branch.coverImg,
                                          caption: `Ảnh mô tả ${branch.name}`
                                        })
                                      }
                                      className="w-full h-44 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-95"
                                    />
                                  )}

                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        ref={(el) => {
                                          branchFileInputRefs.current[branch.id] = el;
                                        }}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleSelectBranchCoverDraft(branch.id, e)}
                                        className="hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          branchFileInputRefs.current[branch.id]?.click()
                                        }
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
                                      >
                                        Chọn ảnh mới từ thiết bị
                                      </button>
                                      {draftCover && (
                                        <button
                                          type="button"
                                          onClick={() => handleSaveBranchCoverPermanent(branch.id)}
                                          className="px-4 py-2 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-xs font-bold text-white cursor-pointer"
                                        >
                                          ✓ Lưu ảnh vĩnh viễn
                                        </button>
                                      )}
                                    </div>

                                    {(draftCover || branch.coverImg) && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBranchCoverPermanent(branch.id)}
                                        className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                                      >
                                        Xóa ảnh
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* STAFF SUB-TAB 2: TEMPORARY ENTRY PASS REQUESTS & 6-DIGIT CODE GENERATOR (2 HOURS) */}
                    {staffSubTab === 'entry_codes' && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="border-b border-slate-200 pb-4">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                            Cấp mã số ra vào trực tiếp (6 chữ số · Hiệu lực 2 tiếng)
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Khi bấm <strong>✓ Chấp nhận &amp; Phát mã 6 chữ số</strong>, hệ thống sinh
                            một mã 6 chữ số hiệu lực trong <strong>2 tiếng (02:00:00)</strong> tại cơ sở đó.
                            Nếu sinh viên đang có mã hiệu lực ở cơ sở khác mà tiếp tục xin cấp mã tại cơ sở
                            này, hệ thống sẽ hiển thị <strong>Cảnh báo lần cấp đầu</strong> để Staff kiểm tra.
                          </p>
                        </div>

                        {scopedEntryRequests.length === 0 ? (
                          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                            Hiện không có yêu cầu xin cấp mã số ra vào nào tại cơ sở của bạn.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {scopedEntryRequests.map((req) => {
                              const exp = req.passExpiresAt || req.expiresAt || req.codeExpiresAtMs;
                              const isApproved = req.status === 'approved' && req.code;
                              return (
                                <div
                                  key={req.id}
                                  className={`p-5 rounded-2xl border space-y-4 ${
                                    isApproved
                                      ? 'bg-slate-900 text-white border-emerald-500 shadow-md'
                                      : req.priorActivePassWarning
                                      ? 'bg-amber-50/70 border-amber-400 text-slate-900 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-900'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={req.portraitPhoto}
                                        alt={req.studentName}
                                        onClick={() =>
                                          setLightboxPhoto({
                                            src: req.portraitPhoto,
                                            caption: `Ảnh thẻ chân dung SV ${req.studentName}`
                                          })
                                        }
                                        className="w-14 h-16 rounded-xl object-cover border border-emerald-400 cursor-pointer shrink-0"
                                      />
                                      <div>
                                        <div className="text-sm font-bold">
                                          {req.studentName}
                                        </div>
                                        <div className="text-xs font-mono font-bold text-emerald-500">
                                          MÃ SV: {req.studentCode}
                                        </div>
                                        <div className="text-[11px] opacity-80">
                                          Xin vào: <strong>{branchesMap[req.branchId]?.name}</strong>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleStaffRejectOrClearEntryRequest(req.id)}
                                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs cursor-pointer"
                                      title="Xóa / Đóng yêu cầu"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* CROSS-BRANCH ACTIVE 2-HOUR PASS WARNING FOR APPROVING STAFF */}
                                  {req.priorActivePassWarning && (
                                    <div className="p-3.5 rounded-xl bg-amber-100/95 border border-amber-400 text-amber-950 text-xs space-y-1">
                                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                                        <span>Cảnh báo: Đã được cấp mã tại cơ sở khác trong 2 tiếng qua</span>
                                      </div>
                                      <p className="leading-relaxed">
                                        Sinh viên này đã được cấp mã số lần đầu tại{' '}
                                        <strong>{req.priorActivePassWarning.firstBranchName}</strong>{' '}
                                        (Mã: <span className="font-mono font-bold">{req.priorActivePassWarning.firstCode}</span>)
                                        lúc <strong>{req.priorActivePassWarning.firstApprovedAt || req.priorActivePassWarning.firstIssuedAtText}</strong> và mã đó
                                        hiện vẫn đang trong thời hạn 2 tiếng.
                                      </p>
                                    </div>
                                  )}

                                  {isApproved ? (
                                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 text-center space-y-1.5">
                                      <div className="text-[10px] font-bold text-emerald-300 tracking-wider">
                                        MÃ 6 SỐ ĐANG HIỂN THỊ ĐỒNG THỜI TRÊN MÀN HÌNH SINH VIÊN (HIỆU LỰC 2 TIẾNG)
                                      </div>
                                      <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-[0.26em] text-amber-300">
                                        {req.code}
                                      </div>
                                      <div className="text-xs font-mono font-bold text-rose-300 flex items-center justify-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5 animate-spin" />
                                        <span>Còn hiệu lực: {formatCountdownMMSS(exp, nowTick)}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStaffApproveEntryRequest(req.id)}
                                      className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                                    >
                                      ✓ Chấp nhận &amp; Phát mã 6 chữ số (Hiệu lực 2 tiếng)
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STAFF SUB-TAB 3: STUDENT ACCOUNT APPROVAL & LOOKUP (ALL HOMIES STAFF & ADMIN) */}
                    {staffSubTab === 'student_approvals' && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="border-b border-slate-200 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                              Quản lý &amp; Duyệt Tài khoản Thẻ sinh viên số
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Danh sách tự động sắp xếp theo ngày đăng ký ({scopedStudentAccounts.length} tài khoản
                              · Chờ duyệt: <strong>{pendingStudentAccountsCount}</strong>). Bấm vào từng sinh viên để
                              xem chi tiết cơ sở ULIS đăng ký, ngày đăng ký và phê duyệt / xóa tài khoản.
                            </p>
                          </div>

                          {/* Top-Right Student Code Lookup Bar */}
                          <div className="relative w-full sm:w-80 shrink-0">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={studentSearchCode}
                              onChange={(e) => setStudentSearchCode(e.target.value)}
                              placeholder="Nhập mã sinh viên để tra cứu..."
                              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-[#165b40] outline-none"
                            />
                            {studentSearchCode && (
                              <button
                                type="button"
                                onClick={() => setStudentSearchCode('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* NOTIFICATION BANNER FOR PASSWORD RESET REQUESTS FROM STUDENTS */}
                        {pendingPasswordResetStudents.length > 0 && (
                          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3.5 shadow-xs">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
                                <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                                <span>
                                  Yêu cầu xin cấp lại mật khẩu Thẻ Sinh Viên Số (
                                  {pendingPasswordResetStudents.length})
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {pendingPasswordResetStudents.map((stu) => (
                                <div
                                  key={`pw_reset_${stu.id}`}
                                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    {stu.portraitPhoto && (
                                      <img
                                        src={stu.portraitPhoto}
                                        alt={stu.fullName}
                                        onClick={() =>
                                          setLightboxPhoto({
                                            src: stu.portraitPhoto,
                                            caption: `Ảnh thẻ chân dung SV ${stu.fullName} (${stu.studentCode})`
                                          })
                                        }
                                        className="w-12 h-14 rounded-lg object-cover border border-amber-300 cursor-pointer shrink-0"
                                      />
                                    )}
                                    <div className="space-y-0.5 text-xs min-w-0">
                                      <div className="font-bold text-slate-900 text-sm truncate">
                                        {stu.fullName}
                                      </div>
                                      <div className="font-mono font-bold text-[#165b40]">
                                        MÃ SV: {stu.studentCode} · {stu.email}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        Yêu cầu lúc: {stu.passwordResetRequestedAt || 'Vừa xong'} · Cơ sở:{' '}
                                        <strong>
                                          {branchesMap[stu.registeredBranchId || 'homies_danang']
                                            ?.name ||
                                            stu.registeredBranchName ||
                                            'Homies'}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStaffApprovePasswordReset(stu.id, 'approve')
                                      }
                                      className="px-4 py-2 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                    >
                                      ✓ Chấp thuận cấp lại mật khẩu
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStaffApprovePasswordReset(stu.id, 'reject')
                                      }
                                      className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer"
                                    >
                                      Từ chối
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {scopedStudentAccounts.length === 0 ? (
                          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs text-slate-500">
                            {studentSearchCode.trim()
                              ? `Không tìm thấy sinh viên nào có mã sinh viên chứa "${studentSearchCode.trim()}".`
                              : 'Chưa có sinh viên nào đăng ký Thẻ sinh viên số.'}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {scopedStudentAccounts.map((stu) => {
                              const isPending = stu.status === 'pending';
                              const isPendingPwReset = stu.passwordResetStatus === 'pending';
                              const isExpanded = expandedStudentId === stu.id;
                              const regBranch = branchesMap[stu.registeredBranchId || 'homies_danang'];
                              return (
                                <div
                                  key={stu.id}
                                  className={`rounded-2xl border transition-all overflow-hidden ${
                                    isPending || isPendingPwReset
                                      ? 'bg-amber-50/40 border-amber-300'
                                      : 'bg-slate-50/80 border-slate-200'
                                  }`}
                                >
                                  {/* COMPACT EXTERIOR: ONLY NAME & STUDENT CODE */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedStudentId((prev) => (prev === stu.id ? null : stu.id))
                                    }
                                    className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
                                  >
                                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                                      <span className="text-base font-bold text-slate-900">
                                        {stu.fullName}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-[#165b40]">
                                        MÃ SV: {stu.studentCode}
                                      </span>
                                      <span
                                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                          isPending
                                            ? 'bg-amber-200 text-amber-950'
                                            : 'bg-emerald-100 text-emerald-900'
                                        }`}
                                      >
                                        {isPending ? 'Chờ duyệt' : 'Đã kích hoạt'}
                                      </span>
                                      {isPendingPwReset && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                                          Xin cấp lại mật khẩu
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                                      <span className="hidden sm:inline">
                                        {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-slate-700" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-700" />
                                      )}
                                    </div>
                                  </button>

                                  {/* EXPANDED INTERIOR: REGISTERED HOMIES BRANCH, REGISTRATION DATE, PHOTO & ACTIONS */}
                                  {isExpanded && (
                                    <div className="px-5 pb-5 pt-3 border-t border-slate-200/80 bg-white space-y-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                          <div className="text-[11px] font-semibold text-slate-500">
                                            Đăng ký tại cơ sở ULIS:
                                          </div>
                                          <div className="font-bold text-[#165b40] mt-0.5">
                                            {regBranch
                                              ? regBranch.name
                                              : stu.registeredBranchName || 'HOMIES Đa năng'}
                                          </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                          <div className="text-[11px] font-semibold text-slate-500">
                                            Ngày đăng ký:
                                          </div>
                                          <div className="font-mono font-bold text-slate-900 mt-0.5">
                                            {stu.createdAt}
                                          </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                          <div className="text-[11px] font-semibold text-slate-500">
                                            Email sinh viên:
                                          </div>
                                          <div className="font-mono font-semibold text-slate-800 mt-0.5 break-all">
                                            {stu.email}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Portrait Photo Verification */}
                                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                                        <img
                                          src={stu.portraitPhoto}
                                          alt="Ảnh thẻ chân dung"
                                          onClick={() =>
                                            setLightboxPhoto({
                                              src: stu.portraitPhoto,
                                              caption: `Ảnh thẻ chân dung • ${stu.fullName} (${stu.studentCode})`
                                            })
                                          }
                                          className="w-24 h-28 object-cover rounded-xl border border-slate-300 cursor-pointer hover:opacity-90 shrink-0"
                                        />
                                        <div className="space-y-1.5 text-xs text-slate-600">
                                          <div className="font-bold text-slate-800">
                                            Ảnh thẻ chân dung sinh viên (Bấm vào ảnh để phóng to)
                                          </div>
                                          <p className="leading-relaxed">
                                            Đối chiếu trực tiếp với <strong>Thẻ sinh viên gốc</strong> do sinh
                                            viên xuất trình tại quầy ra vào Homies trong lần đăng ký đầu tiên.
                                          </p>
                                        </div>
                                      </div>

                                      {/* Action Buttons: Approve Account, Approve Password Reset & Permanent Database Delete */}
                                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                        {isPending && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleMasterApproveStudentAccount(stu.id, 'approve')
                                            }
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                          >
                                            ✓ Phê duyệt &amp; Kích hoạt Thẻ sinh viên số
                                          </button>
                                        )}
                                        {isPendingPwReset && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleStaffApprovePasswordReset(stu.id, 'approve')
                                            }
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                                          >
                                            ✓ Chấp thuận cấp lại mật khẩu
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMasterApproveStudentAccount(stu.id, 'delete')
                                          }
                                          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Xóa tài khoản khỏi CSDL</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STAFF SUB-TAB 4: 5-STAR REVIEW MODERATION */}
                    {staffSubTab === 'moderation' && (
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                        <h3 className="text-lg font-bold text-slate-900">
                          Kiểm duyệt Đánh giá 5 sao kèm ảnh thực tế ({scopedModerationReviews.length})
                        </h3>
                        {scopedModerationReviews.length === 0 ? (
                          <div className="p-8 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                            Chưa có đánh giá nào cho khu vực này.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {scopedModerationReviews.map((rev) => (
                              <div
                                key={rev.id}
                                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {rev.author}
                                    </span>
                                    <span className="text-xs font-semibold text-emerald-800">
                                      ({branchesMap[rev.branchId]?.name})
                                    </span>
                                    <StarRatingDisplay rating={rev.rating} size="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-mono text-slate-500">
                                      {rev.status === 'pending' ? '· Chờ duyệt' : '· Đã công khai'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-700">{rev.content}</p>
                                  {rev.photo && (
                                    <img
                                      src={rev.photo}
                                      alt="Review"
                                      onClick={() =>
                                        setLightboxPhoto({
                                          src: rev.photo,
                                          caption: `Ảnh đánh giá • ${rev.author}`
                                        })
                                      }
                                      className="h-24 rounded-lg object-cover border border-slate-300 cursor-pointer"
                                    />
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {rev.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleModerateReview(rev.id, 'approve')}
                                      className="px-3.5 py-2 rounded-lg bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                    >
                                      ✓ Duyệt hiển thị
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleModerateReview(rev.id, 'delete')}
                                    className="px-3 py-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STAFF SUB-TAB 5: GÓP Ý HOMIES WORKFLOW (CHỜ DUYỆT -> ĐƯỢC GHI NHẬN -> ĐÃ THỰC HIỆN) */}
                    {staffSubTab === 'suggestions' && (
                      <div className="space-y-6">
                        {/* SECTION 1: GÓP Ý MỚI CHỜ DUYỆT */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-900">
                              Góp ý Homies chờ duyệt (
                              {
                                scopedSuggestions.filter(
                                  (s) => !s.status || s.status === 'unread' || s.status === 'pending'
                                ).length
                              }
                              )
                            </h3>
                          </div>

                          {scopedSuggestions.filter(
                            (s) => !s.status || s.status === 'unread' || s.status === 'pending'
                          ).length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                              Hiện không có góp ý mới nào đang chờ duyệt.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {scopedSuggestions
                                .filter(
                                  (s) => !s.status || s.status === 'unread' || s.status === 'pending'
                                )
                                .map((sug) => (
                                  <div
                                    key={sug.id}
                                    className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-bold text-slate-900">{sug.sender}</span>
                                        <span>·</span>
                                        <span className="font-semibold text-emerald-800">
                                          {branchesMap[sug.branchId]?.name}
                                        </span>
                                        <span>·</span>
                                        <span className="text-slate-600">{sug.category}</span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                          ({sug.createdAt})
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-800">{sug.content}</p>
                                      {sug.photo && (
                                        <img
                                          src={sug.photo}
                                          alt="Ảnh góp ý"
                                          onClick={() =>
                                            setLightboxPhoto({
                                              src: sug.photo,
                                              caption: `Ảnh góp ý • ${branchesMap[sug.branchId]?.name}`
                                            })
                                          }
                                          className="h-24 rounded-lg object-cover border border-slate-300 cursor-pointer mt-1"
                                        />
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveSuggestionToAcknowledged(sug.id)}
                                        className="px-3.5 py-2 rounded-lg bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                      >
                                        ✓ Phê duyệt
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSuggestion(sug.id)}
                                        className="p-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                                        title="Xóa góp ý"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* SECTION 2: GÓP Ý ĐƯỢC GHI NHẬN */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-[#165b40]">
                              Góp ý được ghi nhận (
                              {
                                scopedSuggestions.filter(
                                  (s) => s.status === 'acknowledged' || s.status === 'resolved'
                                ).length
                              }
                              )
                            </h3>
                          </div>

                          {scopedSuggestions.filter(
                            (s) => s.status === 'acknowledged' || s.status === 'resolved'
                          ).length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                              Chưa có góp ý nào trong danh sách được ghi nhận.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {scopedSuggestions
                                .filter((s) => s.status === 'acknowledged' || s.status === 'resolved')
                                .map((sug) => (
                                  <div
                                    key={sug.id}
                                    className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-bold text-slate-900">{sug.sender}</span>
                                        <span>·</span>
                                        <span className="font-semibold text-emerald-800">
                                          {branchesMap[sug.branchId]?.name}
                                        </span>
                                        <span>·</span>
                                        <span className="text-slate-600">{sug.category}</span>
                                      </div>
                                      <p className="text-xs text-slate-800">{sug.content}</p>
                                      {sug.photo && (
                                        <img
                                          src={sug.photo}
                                          alt="Ảnh góp ý"
                                          onClick={() =>
                                            setLightboxPhoto({
                                              src: sug.photo,
                                              caption: `Ảnh góp ý • ${branchesMap[sug.branchId]?.name}`
                                            })
                                          }
                                          className="h-24 rounded-lg object-cover border border-slate-300 cursor-pointer mt-1"
                                        />
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleMarkSuggestionCompleted(sug.id)}
                                        className="px-3 py-1.5 rounded-lg bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                      >
                                        ✓ Đã thực hiện
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSuggestion(sug.id)}
                                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                                        title="Xóa góp ý"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* SECTION 3: ĐÃ THỰC HIỆN */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-800">
                              Đã thực hiện (
                              {scopedSuggestions.filter((s) => s.status === 'completed').length})
                            </h3>
                          </div>

                          {scopedSuggestions.filter((s) => s.status === 'completed').length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                              Chưa có góp ý nào trong mục Đã thực hiện.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {scopedSuggestions
                                .filter((s) => s.status === 'completed')
                                .map((sug) => (
                                  <div
                                    key={sug.id}
                                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-bold text-slate-900">{sug.sender}</span>
                                        <span>·</span>
                                        <span className="font-semibold text-emerald-800">
                                          {branchesMap[sug.branchId]?.name}
                                        </span>
                                        <span>·</span>
                                        <span className="text-slate-600">{sug.category}</span>
                                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                                          Đã thực hiện ✓
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-700">{sug.content}</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSuggestion(sug.id)}
                                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                                        title="Xóa góp ý"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* STAFF SUB-TAB 6: CONTACT INFO MANAGEMENT */}
                    {staffSubTab === 'branding_contact' && (
                      <form
                        onSubmit={handleSaveStaffContactInfo}
                        className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4"
                      >
                        <h3 className="text-lg font-bold text-slate-900">
                          Cập nhật Thông tin Liên hệ ({currentAccount.displayName})
                        </h3>
                        {contactSaveNotice && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                            {contactSaveNotice}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Tên đầu mối liên hệ
                          </label>
                          <input
                            type="text"
                            value={contactFormName}
                            onChange={(e) => setContactFormName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            value={contactFormPhone}
                            onChange={(e) => setContactFormPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Email</label>
                          <input
                            type="email"
                            value={contactFormEmail}
                            onChange={(e) => setContactFormEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Ghi chú ca trực / Hỗ trợ
                          </label>
                          <input
                            type="text"
                            value={contactFormNote}
                            onChange={(e) => setContactFormNote(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu thông tin liên hệ
                        </button>
                      </form>
                    )}

                    {/* STAFF SUB-TAB 7: SELF-SERVICE PASSWORD CHANGE */}
                    {staffSubTab === 'account' && (
                      <form
                        onSubmit={handleSaveSelfAccount}
                        className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4"
                      >
                        <h3 className="text-lg font-bold text-slate-900">
                          Đổi mật khẩu &amp; Bảo mật tài khoản cá nhân
                        </h3>
                        {accFeedback && (
                          <div
                            className={`p-3 rounded-xl text-xs font-semibold border ${
                              accFeedback.type === 'error'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {accFeedback.text}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Mật khẩu hiện tại (Bắt buộc để xác thực){' '}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="password"
                            required
                            value={accCurrentPassword}
                            onChange={(e) => setAccCurrentPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Tên đăng nhập
                          </label>
                          <input
                            type="text"
                            value={accNewUsername}
                            onChange={(e) => setAccNewUsername(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Tên hiển thị
                          </label>
                          <input
                            type="text"
                            value={accNewDisplayName}
                            onChange={(e) => setAccNewDisplayName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Mật khẩu mới (Nếu muốn đổi)
                            </label>
                            <input
                              type="password"
                              value={accNewPassword}
                              onChange={(e) => setAccNewPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">
                              Xác nhận mật khẩu mới
                            </label>
                            <input
                              type="password"
                              value={accConfirmPassword}
                              onChange={(e) => setAccConfirmPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu bảo mật tài khoản
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ====================================================================
          FOOTER WITH OFFICIAL USEATIFY LOGO & SLOGAN
      ==================================================================== */}
      <footer className="bg-[#fbf6f0] border-t border-[#e8dfd1] mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UseatifyBrandLogo className="h-10 w-auto" />
            <div className="text-xs text-slate-600">
              <div className="font-heading italic font-semibold text-slate-800">
                {siteConfig.slogan}
              </div>
              <div>Hệ thống không gian học tập Homies – Trường Đại học Ngoại ngữ, ĐHQGHN (ULIS)</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} USEATIFY – ULIS Homies &amp; Student Pass
          </div>
        </div>
      </footer>

      {/* ====================================================================
          BOTTOM-RIGHT FLOATING CONTACT WIDGET (PRESERVED 100%)
      ==================================================================== */}
      <div className="fixed bottom-4 right-4 z-40">
        {contactWidgetOpen ? (
          <div className="w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#165b40] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <Phone className="w-4 h-4 text-amber-300" />
                <span>Danh bạ Liên hệ Quản lý Homies ULIS</span>
              </div>
              <button
                type="button"
                onClick={() => setContactWidgetOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 max-h-80 overflow-y-auto space-y-2.5">
              {contactCardsList.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                >
                  <div className="font-extrabold text-slate-900">{c.contactName}</div>
                  <div className="text-[11px] text-slate-500">{c.contactNote}</div>
                  <div className="flex flex-wrap items-center gap-3 pt-1 font-mono text-[11px] text-emerald-800 font-semibold">
                    {c.contactPhone && <span>📞 {c.contactPhone}</span>}
                    {c.contactEmail && <span>✉️ {c.contactEmail}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setContactWidgetOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold shadow-lg border border-white/20 cursor-pointer transition-all"
          >
            <Phone className="w-4 h-4 text-amber-300" />
            <span>Liên hệ Quản lý Homies</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      errorMsg: error?.message || 'Lỗi dữ liệu bộ nhớ đệm trình duyệt.'
    };
  }

  handleResetAndReload = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LEGACY_V5_KEY);
      localStorage.removeItem('useatify_active_student_id');
    } catch {}
    this.setState({ hasError: false, errorMsg: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fbf8f3] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-lg text-center space-y-4">
            <div className="flex justify-center">
              <UseatifyBrandLogo className="h-12 w-auto" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Đang đồng bộ lại dữ liệu USEATIFY
            </h2>
            <p className="text-xs text-slate-600">
              Hệ thống phát hiện dữ liệu bộ nhớ đệm cũ không tương thích ({this.state.errorMsg}).
              Bấm nút bên dưới để làm mới và kết nối lại ngay lập tức.
            </p>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="w-full py-3 px-4 rounded-xl bg-[#165b40] hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer"
            >
              Làm mới &amp; Mở lại USEATIFY ngay
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <UseatifyMainApp />
    </AppErrorBoundary>
  );
}


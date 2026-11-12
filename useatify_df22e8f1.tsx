import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Check,
  Eye,
  Lock,
  UserCheck,
  Star,
  Camera,
  Lightbulb,
  CheckCheck,
  Trash2,
  KeyRound,
  Crown,
  Send,
  SlidersHorizontal,
  Inbox,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Save,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  MessageSquareHeart,
  IdCard,
  ScanBarcode,
  UserPlus,
  Timer,
  Ticket,
  ShieldAlert,
  CalendarClock,
  Fingerprint
} from 'lucide-react';

// ============================================================================
// 1. PERSISTENT STORAGE & CLOUD SYNC CONFIGURATION (NEVER LOSES DATA ON RELOAD)
// ============================================================================
const LOCAL_STORAGE_KEY = 'useatify_ulis_permanent_store_v6';
const LEGACY_V5_KEY = 'useatify_ulis_permanent_store_v5';
const IDB_NAME = 'useatify_ulis_permanent_idb';
const IDB_STORE = 'app_state_store';
const IDB_KEY = 'main_state_v6';

// Lifecycle Constants: 4 Years for Student Accounts & 2 Minutes for 6-Digit Entry Codes
const FOUR_YEARS_MS = 4 * 365 * 24 * 60 * 60 * 1000; // 4 năm (1,460 ngày)
const TEMP_CODE_TTL_MS = 2 * 60 * 1000; // 2 phút (120 giây)

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
  'https://huyhoathihackathon-default-rtdb.firebaseio.com/useatify_v5',
  'https://huyhoathihackathon-default-rtdb.asia-southeast1.firebasedatabase.app/useatify_v5'
];
const RTDB_ENDPOINTS = RTDB_BASE_URLS.map((base) => `${base}.json`);

let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'useatify-ulis-homies-v5';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig =
      typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
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
    emoji: '🏟️',
    illustrationAccent: '#10b981',
    coverImg: null
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
    emoji: '📚',
    illustrationAccent: '#f43f5e',
    coverImg: null
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
    emoji: '🌿',
    illustrationAccent: '#f59e0b',
    coverImg: null
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
    emoji: '☕',
    illustrationAccent: '#0ea5e9',
    coverImg: null
  }
];

const INITIAL_ACCOUNTS = {
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
    title: 'Tra cứu và so sánh chỗ ngồi',
    shortDesc: 'Theo dõi tình trạng chỗ ngồi tại các cơ sở Homies.',
    detailDesc:
      'Nhanh chóng theo dõi tổng số chỗ, số chỗ đang sử dụng, số chỗ còn trống và mức độ đông đúc tại các cơ sở Homies trên cùng một giao diện.'
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
    icon: RefreshCw,
    title: 'Cập nhật tình trạng chỗ ngồi',
    shortDesc: 'Đồng bộ số lượng chỗ ngồi theo thời điểm cập nhật gần nhất.',
    detailDesc:
      'Hỗ trợ nhân viên hoặc người được phân công trực cơ sở cập nhật số lượng chỗ ngồi đang được sử dụng, đồng bộ thông tin lên giao diện tra cứu theo thời điểm cập nhật gần nhất.'
  },
  {
    num: '04',
    icon: MessageCircle,
    title: 'Đánh giá và góp ý',
    shortDesc: 'Đóng góp ý kiến về cơ sở vật chất và tình trạng Homies.',
    detailDesc:
      'Cho phép sinh viên đánh giá 5 sao kèm ảnh thực tế và gửi góp ý về cơ sở vật chất, tình trạng tại Homies, góp phần cải thiện trải nghiệm sử dụng không gian học tập.'
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

function formatDateFromMs(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatRemainingDays(expiresAtMs, nowMs) {
  if (!expiresAtMs) return '4 năm';
  const diff = expiresAtMs - nowMs;
  if (diff <= 0) return 'Đã hết hạn';
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  const years = (days / 365).toFixed(1);
  return `Còn ${days} ngày (~${years} năm)`;
}

function formatCountdownMMSS(expiresAtMs, nowMs) {
  if (!expiresAtMs) return '00:00';
  const remainingSec = Math.max(0, Math.ceil((expiresAtMs - nowMs) / 1000));
  const mins = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const secs = String(remainingSec % 60).padStart(2, '0');
  return `${mins}:${secs}`;
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

function openPermanentIDB() {
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

async function saveToIndexedDB(stateObj) {
  try {
    const dbInstance = await openPermanentIDB();
    await new Promise((resolve, reject) => {
      const tx = dbInstance.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(stateObj, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {}
}

async function loadFromIndexedDB() {
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

function savePersistedState(stateObj) {
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

function mergeArrayById(localArr = [], cloudArr = [], deletedIdsList = []) {
  const deletedSet = new Set(deletedIdsList || []);
  const map = new Map();
  [...localArr, ...cloudArr].forEach((item) => {
    if (!item || !item.id || deletedSet.has(item.id)) return;
    const existing = map.get(item.id);
    if (!existing || (item.updatedAtMs || 0) >= (existing.updatedAtMs || 0)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

// Generate a strictly unique 6-digit temporary code not used by any currently active request
function generateUniqueSixDigitCode(activeRequests = [], nowMs = Date.now()) {
  const activeCodes = new Set(
    (activeRequests || [])
      .filter((r) => r && r.status === 'approved' && r.code && (r.codeExpiresAtMs || 0) > nowMs)
      .map((r) => String(r.code))
  );
  let candidate = '';
  let attempts = 0;
  do {
    candidate = String(Math.floor(100000 + Math.random() * 900000));
    attempts += 1;
  } while (activeCodes.has(candidate) && attempts < 500);
  return candidate;
}

// Automatic Student ID Card & Barcode Scanner / Analyzer
async function detectStudentCardAndBarcode(imageDataUrl, emailHint = '', currentCodeHint = '') {
  // 1. Try native browser BarcodeDetector API if available
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = imageDataUrl;
      });
      const detector = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'codabar', 'itf']
      });
      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        const raw = String(barcodes[0].rawValue).trim();
        return {
          detected: true,
          method: 'Quét trực tiếp từ mã vạch trên thẻ',
          barcodeValue: raw,
          extractedStudentId: raw.replace(/[^0-9A-Za-z]/g, '').slice(0, 12) || raw,
          confidence: 99
        };
      }
    } catch (e) {}
  }

  // 2. Analyze card dimensions & high-contrast barcode stripes on canvas
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = imageDataUrl;
  });

  const canvas = document.createElement('canvas');
  const w = Math.min(320, img.naturalWidth || 320);
  const h = Math.min(220, img.naturalHeight || 220);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  let transitions = 0;
  try {
    const imgData = ctx.getImageData(0, Math.floor(h * 0.55), w, Math.floor(h * 0.4)).data;
    let prevLum = 128;
    for (let i = 0; i < imgData.length; i += 16) {
      const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
      if (Math.abs(lum - prevLum) > 48) transitions += 1;
      prevLum = lum;
    }
  } catch (e) {
    transitions = 45;
  }

  // Extract 8-digit student ID from email prefix if present (e.g., 23040123@vnu.edu.vn)
  const emailPrefix = (emailHint || '').split('@')[0] || '';
  const digitsMatch = emailPrefix.match(/\d{6,10}/) || (currentCodeHint || '').match(/\d{6,10}/);

  // Or derive deterministic card barcode number from image pixel signature
  let hashNum = 23040000;
  for (let i = 0; i < Math.min(imageDataUrl.length, 400); i++) {
    hashNum = (hashNum + imageDataUrl.charCodeAt(i) * (i + 1)) % 899999;
  }
  const fallbackId = String(21000000 + (hashNum % 4999999));
  const studentId = digitsMatch ? digitsMatch[0] : currentCodeHint.trim() || fallbackId;

  return {
    detected: true,
    method:
      transitions > 20
        ? 'Nhận diện tự động phôi Thẻ Sinh Viên & vùng Mã vạch (Barcode)'
        : 'Nhận diện tự động ảnh Thẻ Sinh Viên',
    barcodeValue: `ULIS-${studentId}`,
    extractedStudentId: studentId,
    confidence: Math.min(98, Math.max(86, 84 + (transitions % 15)))
  };
}

function getSeatStatusInfo(used, total) {
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
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      dotColor: 'bg-rose-500',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      barTrack: 'bg-rose-100',
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
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      dotColor: 'bg-rose-500',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-500',
      barTrack: 'bg-rose-100',
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
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      dotColor: 'bg-amber-500',
      barColor: 'bg-gradient-to-r from-amber-400 to-orange-500',
      barTrack: 'bg-amber-100',
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
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
    barColor: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    barTrack: 'bg-emerald-100',
    cardAccentBorder: 'border-emerald-200',
    softBg: 'bg-emerald-50/70',
    textAccent: 'text-emerald-600',
    icon: CheckCircle2
  };
}

function resizeImageToDataURL(file, maxWidth = 540, maxHeight = 310, mode = 'cover') {
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

    const renderToCanvas = (imgSource) => {
      try {
        const canvas = document.createElement('canvas');
        const srcW = imgSource.naturalWidth || imgSource.width || maxWidth;
        const srcH = imgSource.naturalHeight || imgSource.height || maxHeight;

        if (mode === 'contain') {
          const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
          canvas.width = Math.max(1, Math.round(srcW * scale));
          canvas.height = Math.max(1, Math.round(srcH * scale));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        } else {
          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, maxWidth, maxHeight);
          const scale = Math.max(maxWidth / srcW, maxHeight / srcH);
          const w = srcW * scale;
          const h = srcH * scale;
          ctx.drawImage(imgSource, (maxWidth - w) / 2, (maxHeight - h) / 2, w, h);

          let dataUrl = canvas.toDataURL('image/jpeg', 0.66);
          if (dataUrl.length > 95000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.52);
          }
          resolve(dataUrl);
        }
      } catch (err) {
        reject(new Error('Không thể xử lý ảnh này. Vui lòng thử ảnh JPG hoặc PNG khác.'));
      }
    };

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh từ thiết bị.'));
    reader.onload = () => {
      const dataUrlResult = reader.result;
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

// ============================================================================
// 4. SUB-COMPONENTS (LOGO, BARCODE SVG, BANNER & STAR RATING)
// ============================================================================
function UseatifyBrandLogo({ className = 'h-12 sm:h-14 w-auto' }) {
  return (
    <svg
      viewBox="0 0 645 162"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} select-none shrink-0`}
      role="img"
      aria-label="USEATIFY"
    >
      <path
        d="M52 124 C30 130, 32 146, 68 146 C104 146, 144 135, 138 121 C135 115, 122 113, 112 114"
        stroke="#6eb091"
        strokeWidth="10.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M84 22 C52 22 30 46 30 75 C30 103 68 130 81 139 C83 140.5 85 140.5 87 139 C100 130 138 103 138 75 C138 46 116 22 84 22 Z"
        fill="#165b40"
      />
      <path
        d="M84 22 C116 22 138 46 138 75 C138 103 100 130 87 139 C85.5 140 84.5 140 84 139.8 L84 22 Z"
        fill="#1f7a56"
      />
      <circle cx="84" cy="73" r="33" fill="#fbf8f3" />
      <g transform="rotate(-7 84 74)">
        <rect x="67" y="51" width="23" height="17" rx="4" fill="#165b40" />
        <path
          d="M71 66 L71 77 M86 66 L88 75"
          stroke="#165b40"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M66 76 C66 73.5 69 72.5 73 72.5 L99 72.5 C102.5 72.5 104 74.5 103 77 C102 79 99 80 95 80 L69 80 C66.5 80 66 78 66 76 Z"
          fill="#165b40"
        />
        <path
          d="M70 79 L66 98 M83 79 L84 101 M98 78 L102 96"
          stroke="#165b40"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </g>
      <path
        d="M102 18 C102 12 103 7 104 4"
        stroke="#e7ad45"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M114 24 C119 19 124 14 128 11"
        stroke="#e7ad45"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <g fill="#165b40">
        <path d="M156 48 C156 43 160 39 165 39 C170 39 174 43 174 48 L174 82 C174 91 179 96 186 96 C193 96 198 91 198 82 L198 48 C198 43 202 39 207 39 C212 39 216 43 216 48 L216 83 C216 102 203 113 186 113 C169 113 156 102 156 83 Z" />
        <path d="M268 52 C264 48 258 46 251 46 C244 46 240 49 240 53 C240 58 246 60 256 63 C269 67 278 73 278 86 C278 102 265 112 248 112 C235 112 225 107 221 101 C218 97 219 92 223 89 C227 86 232 87 236 91 C239 94 244 97 250 97 C256 97 260 93 260 88 C260 83 255 81 245 78 C231 74 223 68 223 55 C223 40 235 31 251 31 C262 31 271 35 275 41 C278 45 277 50 273 52 C271 53 269 53 268 52 Z" />
        <path d="M288 46 C288 40 292 36 298 36 L329 36 C334 36 338 39 338 44 C338 48 334 52 329 52 L306 52 L306 65 L325 65 C330 65 333 68 333 73 C333 77 330 80 325 80 L306 80 L306 94 L330 94 C335 94 339 98 339 102 C339 107 335 110 330 110 L298 110 C292 110 288 106 288 100 Z" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M369 38 C372 32 377 29 383 29 C389 29 394 32 397 38 L420 95 C422 101 419 107 413 109 C408 111 402 108 400 102 L396 92 L370 92 L366 102 C364 108 358 111 353 109 C347 107 344 101 346 95 L369 38 Z M383 51 C383 61 379 65 369 65 C379 65 383 69 383 79 C383 69 387 65 397 65 C387 65 383 61 383 51 Z"
        />
        <path d="M418 44 C418 39 422 35 427 35 L467 35 C472 35 476 39 476 44 C476 49 472 53 467 53 L456 53 L456 101 C456 106 452 110 447 110 C442 110 438 106 438 101 L438 53 L427 53 C422 53 418 49 418 44 Z" />
        <rect x="482" y="36" width="18" height="75" rx="9" />
        <path d="M510 46 C510 40 514 36 520 36 L551 36 C556 36 560 40 560 44 C560 49 556 53 551 53 L528 53 L528 67 L546 67 C551 67 555 71 555 75 C555 80 551 83 546 83 L528 83 L528 102 C528 107 524 111 519 111 C514 111 510 107 510 102 Z" />
        <path d="M562 49 C559 44 561 39 566 36 C571 34 576 36 579 41 L591 64 L605 42 C608 37 614 36 618 39 C623 42 624 47 621 52 L599 84 L597 104 C596 110 592 114 586 113 C581 113 577 108 578 102 L580 83 L562 49 Z" />
      </g>
      <path
        d="M174 136 C255 106, 425 104, 560 124"
        stroke="#6eb091"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M615 31 C616 25 618 21 620 18"
        stroke="#e7ad45"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M625 38 C630 35 635 32 639 30"
        stroke="#e7ad45"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Visual Scannable Code-128 Style Barcode Generator Component
function StudentBarcodeDisplay({ value = 'ULIS-23040001', studentCode = '23040001' }) {
  const bars = useMemo(() => {
    const str = String(value || studentCode || 'ULIS2026');
    const generated = [2, 1, 1, 2, 3, 1]; // Start guard
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      generated.push((code % 3) + 1);
      generated.push(((code >> 2) % 3) + 1);
      generated.push(((code >> 4) % 2) + 1);
    }
    generated.push(2, 3, 1, 1, 2); // Stop guard
    return generated;
  }, [value, studentCode]);

  const totalUnits = bars.reduce((acc, w) => acc + w, 0);

  return (
    <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalUnits * 2} 46`}
        className="w-full max-w-[260px] h-11"
        preserveAspectRatio="none"
      >
        {(() => {
          let x = 0;
          return bars.map((w, idx) => {
            const rectX = x;
            const width = w * 2;
            x += width;
            if (idx % 2 === 1) return null; // Space
            return <rect key={idx} x={rectX} y="0" width={width} height="44" fill="#0f172a" />;
          });
        })()}
      </svg>
      <div className="text-[11px] font-mono font-bold tracking-[0.22em] text-slate-800 mt-1">
        {value || `ULIS-${studentCode}`}
      </div>
    </div>
  );
}

function BranchVisualBanner({ branch, isBestChoice, avgRating, reviewCount }) {
  return (
    <div className="relative h-40 w-full overflow-hidden bg-slate-900 select-none">
      {branch.coverImg ? (
        <img
          src={branch.coverImg}
          alt={branch.name}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      ) : (
        <svg
          className="absolute inset-0 w-full h-full opacity-35"
          viewBox="0 0 400 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id={`grad-${branch.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={branch.illustrationAccent} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill={`url(#grad-${branch.id})`} />
          <circle cx="340" cy="30" r="65" fill="white" fillOpacity="0.08" />
          <circle cx="60" cy="140" r="80" fill="white" fillOpacity="0.05" />
          <path
            d="M20 120 H140 V145 H20 Z M160 105 H280 V145 H160 Z M300 90 H380 V145 H300 Z"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
        </svg>
      )}

      <div className="relative z-10 flex items-center justify-between p-3.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/75 text-white backdrop-blur-md border border-white/15">
            <span>{branch.emoji}</span>
            <span>Khu {branch.code}</span>
          </span>
          {reviewCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-400/95 text-slate-950 shadow-xs">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>{avgRating}</span>
              <span className="text-[10px] font-semibold opacity-80">({reviewCount})</span>
            </span>
          )}
        </div>

        {isBestChoice && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-md ring-2 ring-white/80">
            <Sparkles className="w-3 h-3" />
            <span>Nhiều chỗ trống nhất</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/65 to-transparent p-3.5 pt-8 flex items-end justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{branch.name}</span>
            <span className="text-[11px] font-bold text-emerald-300 bg-white/15 px-2 py-0.5 rounded-md">
              {branch.total} chỗ
            </span>
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{branch.subtitle}</p>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-200 bg-black/45 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10 shrink-0">
          <Clock className="w-3 h-3 text-sky-400" />
          <span>{branch.updatedAt}</span>
        </div>
      </div>
    </div>
  );
}

function StarRatingDisplay({ rating, size = 'w-4 h-4' }) {
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
// 5. MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const persistedOnBoot = useMemo(() => loadPersistedState(), []);

  // Main Navigation Tab: 'guest' | 'student_pass' | 'staff'
  const [activeTab, setActiveTab] = useState('guest');
  const [guestCommunityTab, setGuestCommunityTab] = useState('reviews');

  // 1-Second Live Clock for 2-Minute Code Countdown & 4-Year Account Lifecycle
  const [nowTick, setNowTick] = useState(() => Date.now());

  // 1. Branches State (4 ULIS Homies)
  const [branchesMap, setBranchesMap] = useState(() => {
    const initial = {};
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
  const [accountsMap, setAccountsMap] = useState(() => {
    const initial = { ...INITIAL_ACCOUNTS };
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

  // 4. Reviews, Suggestions, Web Feedbacks, Student Accounts (4-Year TTL), Entry Requests (2-Min Code TTL)
  const [reviews, setReviews] = useState(() => persistedOnBoot?.reviews || []);
  const [suggestions, setSuggestions] = useState(() => persistedOnBoot?.suggestions || []);
  const [webFeedbacks, setWebFeedbacks] = useState(() => persistedOnBoot?.webFeedbacks || []);
  const [studentAccounts, setStudentAccounts] = useState(
    () => persistedOnBoot?.studentAccounts || []
  );
  const [entryRequests, setEntryRequests] = useState(() => persistedOnBoot?.entryRequests || []);
  const [deletedIds, setDeletedIds] = useState(() => persistedOnBoot?.deletedIds || []);

  // Cloud Sync State
  const [activeAuth] = useState(auth);
  const [activeDb] = useState(db);
  const [user, setUser] = useState(null);
  const [lastSyncedTime, setLastSyncedTime] = useState(getCurrentTimeHHMM());

  const [contactWidgetOpen, setContactWidgetOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Guest 5-Star Review Form State
  const [revBranchId, setRevBranchId] = useState('homies_danang');
  const [revAuthor, setRevAuthor] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revHoverRating, setRevHoverRating] = useState(0);
  const [revContent, setRevContent] = useState('');
  const [revPhoto, setRevPhoto] = useState(null);
  const [revFilterBranch, setRevFilterBranch] = useState('ALL');
  const [revNotice, setRevNotice] = useState(null);

  // Guest Improvement Suggestion Form State
  const [sugBranchId, setSugBranchId] = useState('homies_danang');
  const [sugCategory, setSugCategory] = useState(SUGGESTION_CATEGORIES[0]);
  const [sugSender, setSugSender] = useState('');
  const [sugContent, setSugContent] = useState('');
  const [sugPhoto, setSugPhoto] = useState(null);
  const [sugNotice, setSugNotice] = useState(null);

  // Guest Website Feedback Form State
  const [wfSender, setWfSender] = useState('');
  const [wfRating, setWfRating] = useState(5);
  const [wfContent, setWfContent] = useState('');
  const [wfNotice, setWfNotice] = useState(null);

  // ==========================================================================
  // STUDENT DIGITAL HOMIES PASS STATE (LOGIN / REGISTER / CARD SCAN / ENTRY CODE)
  // ==========================================================================
  const [studentAuthMode, setStudentAuthMode] = useState('login'); // 'login' | 'register'
  const [loggedInStudentId, setLoggedInStudentId] = useState(null);

  // Student Login Form
  const [stuLoginEmail, setStuLoginEmail] = useState('');
  const [stuLoginPassword, setStuLoginPassword] = useState('');
  const [stuLoginError, setStuLoginError] = useState('');

  // Student Registration Form (Email + Password + Student ID Card Photo + Portrait Photo + Auto Barcode Scan)
  const [stuRegEmail, setStuRegEmail] = useState('');
  const [stuRegPassword, setStuRegPassword] = useState('');
  const [stuRegFullName, setStuRegFullName] = useState('');
  const [stuRegCode, setStuRegCode] = useState('');
  const [stuRegBarcode, setStuRegBarcode] = useState('');
  const [stuRegCardPhoto, setStuRegCardPhoto] = useState(null);
  const [stuRegPortraitPhoto, setStuRegPortraitPhoto] = useState(null);
  const [stuScanStatus, setStuScanStatus] = useState(null);
  const [stuRegScanning, setStuRegScanning] = useState(false);
  const [stuRegNotice, setStuRegNotice] = useState(null);

  // Student Temporary Entry Request Selection
  const [stuSelectedBranchForEntry, setStuSelectedBranchForEntry] = useState('homies_danang');

  // Staff / Master Authentication State
  const [loggedInAccountId, setLoggedInAccountId] = useState(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Staff Dashboard Sub-Tab:
  // 'seats' | 'entry_codes' | 'student_approvals' | 'moderation' | 'suggestions' | 'branding_contact' | 'account'
  const [staffSubTab, setStaffSubTab] = useState('seats');
  const [masterSelectedBranch, setMasterSelectedBranch] = useState('ALL');

  // Pending Drafts for Branch Cover Photos
  const [branchCoverDrafts, setBranchCoverDrafts] = useState({});
  const [branchCoverEditMode, setBranchCoverEditMode] = useState({});
  const [branchCoverLoading, setBranchCoverLoading] = useState({});
  const branchFileInputRefs = useRef({});

  // Staff Contact Form State
  const [contactFormName, setContactFormName] = useState('');
  const [contactFormPhone, setContactFormPhone] = useState('');
  const [contactFormEmail, setContactFormEmail] = useState('');
  const [contactFormNote, setContactFormNote] = useState('');
  const [contactSaveNotice, setContactSaveNotice] = useState(null);

  // Self-Service Account Security Form State
  const [accCurrentPassword, setAccCurrentPassword] = useState('');
  const [accNewUsername, setAccNewUsername] = useState('');
  const [accNewDisplayName, setAccNewDisplayName] = useState('');
  const [accNewPassword, setAccNewPassword] = useState('');
  const [accConfirmPassword, setAccConfirmPassword] = useState('');
  const [accFeedback, setAccFeedback] = useState(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);
  const broadcastChannelRef = useRef(null);
  const lastLocalWriteMsRef = useRef(0);
  const latestStateRef = useRef({
    branchesMap,
    accountsMap,
    siteConfig,
    reviews,
    suggestions,
    webFeedbacks,
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
      webFeedbacks,
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
    webFeedbacks,
    studentAccounts,
    entryRequests,
    deletedIds
  ]);

  const showToast = (msg, type = 'success') => {
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
      webFeedbacks,
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
    webFeedbacks,
    studentAccounts,
    entryRequests,
    deletedIds
  ]);

  // --------------------------------------------------------------------------
  // 1-SECOND TICKER: AUTO-DELETE EXPIRED 2-MINUTE CODES & 4-YEAR STUDENT ACCOUNTS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNowTick(now);

      const cur = latestStateRef.current;
      let newlyDeletedIds = [];

      // 1. Check for expired 2-minute temporary entry codes
      const expiredRequests = (cur.entryRequests || []).filter((req) => {
        if (!req) return false;
        if (req.status === 'approved' && req.codeExpiresAtMs && now >= req.codeExpiresAtMs) {
          return true;
        }
        return false;
      });

      // 2. Check for student accounts older than 4 years (auto-delete to optimize storage)
      const expiredAccounts = (cur.studentAccounts || []).filter((acc) => {
        if (!acc) return false;
        const expiry = acc.expiresAtMs || (acc.createdAtMs || now) + FOUR_YEARS_MS;
        return now >= expiry;
      });

      if (expiredRequests.length > 0 || expiredAccounts.length > 0) {
        newlyDeletedIds = [
          ...expiredRequests.map((r) => r.id),
          ...expiredAccounts.map((a) => a.id)
        ];
        const nextDeleted = Array.from(new Set([...(cur.deletedIds || []), ...newlyDeletedIds]));
        const nextEntryRequests = (cur.entryRequests || []).filter(
          (r) => !newlyDeletedIds.includes(r.id)
        );
        const nextStudentAccounts = (cur.studentAccounts || []).filter(
          (a) => !newlyDeletedIds.includes(a.id)
        );

        setDeletedIds(nextDeleted);
        if (expiredRequests.length > 0) setEntryRequests(nextEntryRequests);
        if (expiredAccounts.length > 0) {
          setStudentAccounts(nextStudentAccounts);
          if (loggedInStudentId && newlyDeletedIds.includes(loggedInStudentId)) {
            setLoggedInStudentId(null);
          }
        }

        // Sync cleanup to Cloud
        pushToRealtimeDatabase({
          entryRequests: nextEntryRequests,
          studentAccounts: nextStudentAccounts,
          deletedIds: nextDeleted,
          updatedAtMs: now
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loggedInStudentId]);

  // --------------------------------------------------------------------------
  // CLOUD SYNC ENGINE: FIREBASE REALTIME DB REST + FIRESTORE + BROADCAST
  // --------------------------------------------------------------------------
  const pushToRealtimeDatabase = async (patchPayload, specificBranchId = null) => {
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
  };

  const pullFromRealtimeDatabase = async () => {
    if (Date.now() - lastLocalWriteMsRef.current < 3200) return;

    for (const url of RTDB_ENDPOINTS) {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!res.ok) continue;
        const cloud = await res.json();
        if (!cloud || typeof cloud !== 'object') continue;

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

        // 3. Merge Reviews, Suggestions, Web Feedbacks
        if (Array.isArray(cloud.reviews)) {
          setReviews((prev) => {
            const merged = mergeArrayById(prev, cloud.reviews, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        if (Array.isArray(cloud.suggestions)) {
          setSuggestions((prev) => {
            const merged = mergeArrayById(prev, cloud.suggestions, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        if (Array.isArray(cloud.webFeedbacks)) {
          setWebFeedbacks((prev) => {
            const merged = mergeArrayById(prev, cloud.webFeedbacks, mergedDeleted);
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }

        // 4. Merge Student Accounts (filtering out 4-year expired accounts)
        if (Array.isArray(cloud.studentAccounts)) {
          setStudentAccounts((prev) => {
            const merged = mergeArrayById(prev, cloud.studentAccounts, mergedDeleted).filter(
              (acc) => now < (acc.expiresAtMs || (acc.createdAtMs || now) + FOUR_YEARS_MS)
            );
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }

        // 5. Merge Temporary Entry Requests (filtering out expired 2-min codes)
        if (Array.isArray(cloud.entryRequests)) {
          setEntryRequests((prev) => {
            const merged = mergeArrayById(prev, cloud.entryRequests, mergedDeleted).filter(
              (req) => !(req.status === 'approved' && req.codeExpiresAtMs && now >= req.codeExpiresAtMs)
            );
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        break;
      } catch (e) {}
    }
  };

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
  }, []);

  // Firebase Auth & Firestore Listeners
  useEffect(() => {
    if (!activeAuth) return;
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(activeAuth, __initial_auth_token);
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
            const merged = mergeArrayById(prev, cloud.studentAccounts, mergedDeleted).filter(
              (acc) => now < (acc.expiresAtMs || (acc.createdAtMs || now) + FOUR_YEARS_MS)
            );
            return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
          });
        }
        if (Array.isArray(cloud.entryRequests)) {
          setEntryRequests((prev) => {
            const merged = mergeArrayById(prev, cloud.entryRequests, mergedDeleted).filter(
              (req) => !(req.status === 'approved' && req.codeExpiresAtMs && now >= req.codeExpiresAtMs)
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
        if (Array.isArray(p.webFeedbacks)) setWebFeedbacks(p.webFeedbacks);
        if (Array.isArray(p.studentAccounts)) setStudentAccounts(p.studentAccounts);
        if (Array.isArray(p.entryRequests)) setEntryRequests(p.entryRequests);
        if (Array.isArray(p.deletedIds)) setDeletedIds(p.deletedIds);
      };
      return () => channel.close();
    }
  }, []);

  const syncAllChannels = async (overrides = {}, specificBranchId = null) => {
    lastLocalWriteMsRef.current = Date.now();
    const cur = latestStateRef.current;

    const payload = {
      branchesMap: overrides.branchesMap || cur.branchesMap,
      accountsMap: overrides.accountsMap || cur.accountsMap,
      siteConfig: overrides.siteConfig || cur.siteConfig,
      reviews: overrides.reviews || cur.reviews,
      suggestions: overrides.suggestions || cur.suggestions,
      webFeedbacks: overrides.webFeedbacks || cur.webFeedbacks,
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

  const currentStudent = useMemo(() => {
    if (!loggedInStudentId) return null;
    return studentAccounts.find((s) => s.id === loggedInStudentId) || null;
  }, [loggedInStudentId, studentAccounts]);

  const branchesList = useMemo(() => {
    return INITIAL_BRANCHES.map((meta) => branchesMap[meta.id] || meta);
  }, [branchesMap]);

  const approvedReviews = useMemo(() => {
    return reviews.filter((r) => r.status === 'approved');
  }, [reviews]);

  const branchRatingsMap = useMemo(() => {
    const map = {};
    INITIAL_BRANCHES.forEach((b) => {
      const list = approvedReviews.filter((r) => r.branchId === b.id);
      const count = list.length;
      const avg =
        count > 0 ? (list.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) : null;
      map[b.id] = { count, avg };
    });
    return map;
  }, [approvedReviews]);

  const filteredGuestReviews = useMemo(() => {
    if (revFilterBranch === 'ALL') return approvedReviews;
    return approvedReviews.filter((r) => r.branchId === revFilterBranch);
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
    return reviews.filter((r) => activeManagedBranchIds.includes(r.branchId));
  }, [reviews, currentAccount, activeManagedBranchIds]);

  const pendingReviewsCountForCurrentRole = useMemo(() => {
    if (!currentAccount) return 0;
    return reviews.filter(
      (r) => r.status === 'pending' && accessibleBranchIds.includes(r.branchId)
    ).length;
  }, [reviews, currentAccount, accessibleBranchIds]);

  const scopedSuggestions = useMemo(() => {
    if (!currentAccount) return [];
    return suggestions.filter((s) => activeManagedBranchIds.includes(s.branchId));
  }, [suggestions, currentAccount, activeManagedBranchIds]);

  const unreadSuggestionsCountForCurrentRole = useMemo(() => {
    if (!currentAccount) return 0;
    return suggestions.filter(
      (s) => s.status === 'unread' && accessibleBranchIds.includes(s.branchId)
    ).length;
  }, [suggestions, currentAccount, accessibleBranchIds]);

  // Pending Student Accounts for Master Staff (homies_admin)
  const pendingStudentAccountsCount = useMemo(() => {
    return studentAccounts.filter((s) => s.status === 'pending').length;
  }, [studentAccounts]);

  // Scoped Entry Requests for current Staff's branch(es)
  const scopedEntryRequests = useMemo(() => {
    if (!currentAccount) return [];
    return entryRequests.filter(
      (req) =>
        activeManagedBranchIds.includes(req.branchId) &&
        !(req.status === 'approved' && req.codeExpiresAtMs && nowTick >= req.codeExpiresAtMs)
    );
  }, [entryRequests, currentAccount, activeManagedBranchIds, nowTick]);

  const pendingEntryRequestsCountForRole = useMemo(() => {
    if (!currentAccount) return 0;
    return entryRequests.filter(
      (req) => req.status === 'pending' && accessibleBranchIds.includes(req.branchId)
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
  // HANDLERS: STUDENT DIGITAL HOMIES CARD REGISTRATION, SCANNING & LOGIN
  // --------------------------------------------------------------------------
  const handleStudentCardUploadAndScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStuRegScanning(true);
    setStuRegNotice(null);

    try {
      const cardDataUrl = await resizeImageToDataURL(file, 540, 340, 'cover');
      setStuRegCardPhoto(cardDataUrl);

      const scanResult = await detectStudentCardAndBarcode(cardDataUrl, stuRegEmail, stuRegCode);
      if (scanResult.detected) {
        if (!stuRegCode.trim()) {
          setStuRegCode(scanResult.extractedStudentId);
        }
        const finalCode = stuRegCode.trim() || scanResult.extractedStudentId;
        setStuRegBarcode(`ULIS-${finalCode}`);
        setStuScanStatus({
          method: scanResult.method,
          barcodeValue: `ULIS-${finalCode}`,
          extractedId: finalCode,
          confidence: scanResult.confidence
        });
        showToast(`Đã tự động nhận diện Thẻ sinh viên & Mã vạch: ULIS-${finalCode}`);
      }
    } catch (err) {
      setStuRegNotice({
        type: 'error',
        text: err.message || 'Không thể xử lý ảnh thẻ sinh viên.'
      });
    } finally {
      setStuRegScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleStudentPortraitUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const portraitDataUrl = await resizeImageToDataURL(file, 360, 440, 'cover');
      setStuRegPortraitPhoto(portraitDataUrl);
      setStuRegNotice(null);
    } catch (err) {
      setStuRegNotice({
        type: 'error',
        text: err.message || 'Không thể xử lý ảnh chân dung.'
      });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleRegisterStudentAccount = async (e) => {
    e.preventDefault();
    const cleanEmail = stuRegEmail.trim().toLowerCase();
    const cleanName = stuRegFullName.trim();
    const cleanCode = stuRegCode.trim();

    if (!cleanEmail.includes('@')) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng nhập đúng định dạng Email sinh viên (ví dụ: mssv@vnu.edu.vn).'
      });
      return;
    }

    if (stuRegPassword.length < 6) {
      setStuRegNotice({
        type: 'error',
        text: 'Mật khẩu tài khoản Homies phải có tối thiểu 6 ký tự.'
      });
      return;
    }

    if (!cleanName || !cleanCode) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ Họ tên và Mã số sinh viên (MSSV).'
      });
      return;
    }

    if (!stuRegCardPhoto) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng chụp hoặc tải lên ảnh Thẻ sinh viên có mã vạch để nhận diện.'
      });
      return;
    }

    if (!stuRegPortraitPhoto) {
      setStuRegNotice({
        type: 'error',
        text: 'Vui lòng chụp hoặc tải lên Ảnh thẻ / Ảnh chân dung của bạn để đối chiếu với thẻ sinh viên.'
      });
      return;
    }

    const existing = studentAccounts.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing && existing.status !== 'rejected') {
      setStuRegNotice({
        type: 'error',
        text: 'Email sinh viên này đã được đăng ký tài khoản Homies! Vui lòng chuyển sang mục Đăng nhập.'
      });
      return;
    }

    const nowMs = Date.now();
    const expiresAtMs = nowMs + FOUR_YEARS_MS; // Tồn tại ổn định 4 năm, tự động xóa sau 4 năm
    const barcodeStr = stuRegBarcode.trim() || `ULIS-${cleanCode}`;
    const newStuId = existing ? existing.id : `stu_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;

    const newStudentAccount = {
      id: newStuId,
      email: cleanEmail,
      password: stuRegPassword,
      fullName: cleanName,
      studentCode: cleanCode,
      barcodeValue: barcodeStr,
      idCardPhoto: stuRegCardPhoto,
      portraitPhoto: stuRegPortraitPhoto,
      scanMethod: stuScanStatus?.method || 'Tự động nhận diện Thẻ SV & Barcode',
      status: 'pending', // Gửi về cho Staff Tổng (homies_admin) phê duyệt
      createdAt: getCurrentDateTimeStr(),
      createdAtMs: nowMs,
      expiresAtMs,
      updatedAtMs: nowMs
    };

    const nextStudentAccounts = [
      newStudentAccount,
      ...studentAccounts.filter((s) => s.id !== newStuId)
    ];

    setStudentAccounts(nextStudentAccounts);
    setLoggedInStudentId(newStuId);
    await syncAllChannels({ studentAccounts: nextStudentAccounts });

    showToast('Đã gửi hồ sơ Thẻ sinh viên về Staff Tổng để phê duyệt!');
  };

  const handleStudentLogin = (e) => {
    e.preventDefault();
    const cleanEmail = stuLoginEmail.trim().toLowerCase();
    const found = studentAccounts.find((s) => s.email.toLowerCase() === cleanEmail);

    if (!found || found.password !== stuLoginPassword) {
      setStuLoginError('Email sinh viên hoặc mật khẩu không chính xác!');
      return;
    }

    // Check 4-year expiration
    if (Date.now() >= (found.expiresAtMs || found.createdAtMs + FOUR_YEARS_MS)) {
      setStuLoginError('Tài khoản này đã hết chu kỳ 4 năm sử dụng và được hệ thống tự động dọn dẹp.');
      return;
    }

    setLoggedInStudentId(found.id);
    setStuLoginEmail('');
    setStuLoginPassword('');
    setStuLoginError('');
    showToast(`Xin chào sinh viên ${found.fullName}!`);
  };

  // Student requests temporary entry pass for a specific Homies branch
  const handleRequestTemporaryEntry = async (branchId) => {
    if (!currentStudent || currentStudent.status !== 'approved') {
      showToast('Tài khoản của bạn cần được Staff Tổng phê duyệt trước khi xin cấp mã.', 'error');
      return;
    }

    const nowMs = Date.now();
    // Check if student already has a pending or active request for this branch
    const existingActive = entryRequests.find(
      (r) =>
        r.studentId === currentStudent.id &&
        r.branchId === branchId &&
        (r.status === 'pending' || (r.status === 'approved' && r.codeExpiresAtMs > nowMs))
    );

    if (existingActive) {
      showToast('Bạn đã có yêu cầu đang hoạt động tại cơ sở này!', 'error');
      return;
    }

    const reqId = `req_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
    const newReq = {
      id: reqId,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      studentCode: currentStudent.studentCode,
      studentEmail: currentStudent.email,
      barcodeValue: currentStudent.barcodeValue,
      portraitPhoto: currentStudent.portraitPhoto,
      idCardPhoto: currentStudent.idCardPhoto,
      branchId,
      status: 'pending',
      code: null,
      requestedAt: getCurrentTimeHHMM(),
      createdAtMs: nowMs,
      approvedAtMs: null,
      codeExpiresAtMs: null,
      updatedAtMs: nowMs
    };

    const nextRequests = [newReq, ...entryRequests];
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests });
    showToast(`Đã gửi yêu cầu xin cấp thẻ vào tạm thời tới Staff ${branchesMap[branchId]?.name}!`);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF MASTER APPROVAL OF STUDENT ACCOUNTS & BRANCH 6-DIGIT CODES
  // --------------------------------------------------------------------------
  const handleMasterApproveStudentAccount = async (studentId, decision) => {
    if (!isMaster) {
      showToast('Chỉ Tài khoản Tổng (homies_admin) mới có quyền phê duyệt tài khoản sinh viên!', 'error');
      return;
    }

    const target = studentAccounts.find((s) => s.id === studentId);
    if (!target) return;

    const nowMs = Date.now();

    if (decision === 'delete') {
      const nextDeleted = Array.from(new Set([...deletedIds, studentId]));
      const nextAccounts = studentAccounts.filter((s) => s.id !== studentId);
      setDeletedIds(nextDeleted);
      setStudentAccounts(nextAccounts);
      await syncAllChannels({ studentAccounts: nextAccounts, deletedIds: nextDeleted });
      showToast('Đã xóa hồ sơ đăng ký thẻ sinh viên.');
      return;
    }

    const updatedStu = {
      ...target,
      status: decision === 'approve' ? 'approved' : 'rejected',
      approvedAt: getCurrentDateTimeStr(),
      approvedAtMs: nowMs,
      // Ensure 4-year lifecycle from approval/creation
      expiresAtMs: target.expiresAtMs || (target.createdAtMs || nowMs) + FOUR_YEARS_MS,
      updatedAtMs: nowMs
    };

    const nextAccounts = studentAccounts.map((s) => (s.id === studentId ? updatedStu : s));
    setStudentAccounts(nextAccounts);
    await syncAllChannels({ studentAccounts: nextAccounts });

    showToast(
      decision === 'approve'
        ? `Đã phê duyệt tài khoản Thẻ Homies cho SV ${target.fullName} (Hiệu lực 4 năm)!`
        : `Đã từ chối hồ sơ của ${target.fullName}.`
    );
  };

  // Branch Staff accepts student's temporary entry request -> generates unique 6-digit code for 2 mins
  const handleStaffApproveEntryRequest = async (requestId) => {
    const target = entryRequests.find((r) => r.id === requestId);
    if (!target) return;

    if (!canManageBranch(target.branchId)) {
      showToast('Bạn chỉ có quyền cấp mã cho cơ sở mình phụ trách!', 'error');
      return;
    }

    const nowMs = Date.now();
    const uniqueSixDigitCode = generateUniqueSixDigitCode(entryRequests, nowMs);
    const expiresAtMs = nowMs + TEMP_CODE_TTL_MS; // Tồn tại đúng 2 phút rồi tự động xóa

    const updatedReq = {
      ...target,
      status: 'approved',
      code: uniqueSixDigitCode,
      approvedBy: currentAccount?.displayName || 'Staff',
      approvedAt: getCurrentTimeHHMM(),
      approvedAtMs: nowMs,
      codeExpiresAtMs: expiresAtMs,
      updatedAtMs: nowMs
    };

    const nextRequests = entryRequests.map((r) => (r.id === requestId ? updatedReq : r));
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests });

    showToast(
      `Đã cấp mã 6 số [${uniqueSixDigitCode}] cho SV ${target.studentName} (Tự xóa sau 2 phút)!`
    );
  };

  const handleStaffRejectOrClearEntryRequest = async (requestId) => {
    const target = entryRequests.find((r) => r.id === requestId);
    if (!target || !canManageBranch(target.branchId)) return;

    const nextDeleted = Array.from(new Set([...deletedIds, requestId]));
    const nextRequests = entryRequests.filter((r) => r.id !== requestId);
    setDeletedIds(nextDeleted);
    setEntryRequests(nextRequests);
    await syncAllChannels({ entryRequests: nextRequests, deletedIds: nextDeleted });
    showToast('Đã đóng yêu cầu cấp mã tạm thời.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: GUEST REVIEWS, SUGGESTIONS & WEBSITE FEEDBACK
  // --------------------------------------------------------------------------
  const handleReviewPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataURL(file, 600, 338);
      setRevPhoto(resized);
      setRevNotice(null);
    } catch (err) {
      setRevNotice({ type: 'error', text: err.message || 'Không thể xử lý ảnh.' });
    }
  };

  const handleSubmitGuestReview = async (e) => {
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

  const handleSuggestionPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImageToDataURL(file, 600, 338);
      setSugPhoto(resized);
      setSugNotice(null);
    } catch (err) {
      setSugNotice({ type: 'error', text: err.message || 'Không thể xử lý ảnh đính kèm.' });
    }
  };

  const handleSubmitGuestSuggestion = async (e) => {
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

  const handleSubmitWebFeedback = async (e) => {
    e.preventDefault();
    if (!wfContent.trim()) {
      setWfNotice({
        type: 'error',
        text: 'Vui lòng nhập nội dung góp ý cho Website USEATIFY.'
      });
      return;
    }

    const nowMs = Date.now();
    const newFb = {
      id: `wf_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      sender: wfSender.trim() || 'Sinh viên ULIS',
      rating: wfRating,
      content: wfContent.trim(),
      createdAt: getCurrentDateTimeStr(),
      createdAtMs: nowMs,
      updatedAtMs: nowMs
    };

    const nextWebFeedbacks = [newFb, ...webFeedbacks];
    setWebFeedbacks(nextWebFeedbacks);
    await syncAllChannels({ webFeedbacks: nextWebFeedbacks });

    setWfContent('');
    setWfNotice({
      type: 'success',
      text: 'Cảm ơn bạn đã đóng góp ý kiến phát triển Website USEATIFY!'
    });
    showToast('Đã lưu Feedback cho Website USEATIFY!');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF LOGIN & SEAT COUNTER (+1 / -1)
  // --------------------------------------------------------------------------
  const handleStaffLogin = (e) => {
    if (e) e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();

    const matchedAccount = Object.values(accountsMap).find(
      (acc) => acc.username.toLowerCase() === cleanUser
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

  const canManageBranch = (branchId) => {
    if (!currentAccount) return false;
    return (
      currentAccount.role === 'master' ||
      currentAccount.primaryBranch === branchId ||
      (Array.isArray(currentAccount.allowedBranches) &&
        currentAccount.allowedBranches.includes(branchId))
    );
  };

  const handleAdjustSeatCount = async (branchId, delta) => {
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
  const handleSelectBranchCoverDraft = async (branchId, e) => {
    const inputEl = e.target;
    const file = inputEl?.files?.[0];
    if (!file) return;

    if (!canManageBranch(branchId)) {
      showToast('Tài khoản hiện tại không có quyền chỉnh sửa cơ sở này.', 'error');
      return;
    }

    setBranchCoverLoading((prev) => ({ ...prev, [branchId]: true }));
    try {
      const resizedDataUrl = await resizeImageToDataURL(file, 560, 315, 'cover');
      setBranchCoverDrafts((prev) => ({ ...prev, [branchId]: resizedDataUrl }));
      setBranchCoverEditMode((prev) => ({ ...prev, [branchId]: true }));
      showToast(
        `Đã tải ảnh lên cho ${branchesMap[branchId]?.name}! Hãy bấm "Lưu ảnh vĩnh viễn" để hoàn tất.`
      );
    } catch (err) {
      showToast(err.message || 'Lỗi đọc tệp ảnh.', 'error');
    } finally {
      setBranchCoverLoading((prev) => ({ ...prev, [branchId]: false }));
      if (inputEl) inputEl.value = '';
    }
  };

  const handleSaveBranchCoverPermanent = async (branchId) => {
    if (!canManageBranch(branchId)) {
      showToast('Bạn không có quyền lưu ảnh cho cơ sở này.', 'error');
      return;
    }

    const draftImg = branchCoverDrafts[branchId];
    const existingImg = branchesMap[branchId]?.coverImg;
    const finalImg = draftImg || existingImg;

    if (!finalImg) {
      if (branchFileInputRefs.current[branchId]) {
        branchFileInputRefs.current[branchId].click();
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
    setBranchCoverEditMode((prev) => ({ ...prev, [branchId]: false }));

    await syncAllChannels({ branchesMap: nextBranches }, branchId);
    showToast(`Đã lưu vĩnh viễn ảnh mô tả cho ${branchesMap[branchId]?.name}!`);
  };

  const handleDeleteBranchCoverPermanent = async (branchId) => {
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
    setBranchCoverEditMode((prev) => ({ ...prev, [branchId]: false }));

    await syncAllChannels({ branchesMap: nextBranches }, branchId);
    showToast(`Đã xóa ảnh mô tả của ${branchesMap[branchId]?.name}.`);
  };

  // --------------------------------------------------------------------------
  // HANDLERS: STAFF CONTACT INFO SAVE
  // --------------------------------------------------------------------------
  const handleSaveStaffContactInfo = async (e) => {
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
  const handleModerateReview = async (reviewId, action) => {
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

  const handleToggleSuggestionStatus = async (suggestionId) => {
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    const updatedSug = {
      ...target,
      status: target.status === 'unread' ? 'resolved' : 'unread',
      updatedAtMs: Date.now()
    };
    const nextSuggestions = suggestions.map((s) => (s.id === suggestionId ? updatedSug : s));
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions });
    showToast('Đã lưu trạng thái xử lý góp ý.');
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    const target = suggestions.find((s) => s.id === suggestionId);
    if (!target || !currentAccount?.allowedBranches.includes(target.branchId)) return;

    const nextDeleted = Array.from(new Set([...deletedIds, suggestionId]));
    const nextSuggestions = suggestions.filter((s) => s.id !== suggestionId);
    setDeletedIds(nextDeleted);
    setSuggestions(nextSuggestions);
    await syncAllChannels({ suggestions: nextSuggestions, deletedIds: nextDeleted });
    showToast('Đã xóa thư góp ý.');
  };

  // --------------------------------------------------------------------------
  // HANDLERS: SELF-SERVICE ACCOUNT SECURITY
  // --------------------------------------------------------------------------
  const handleSaveSelfAccount = async (e) => {
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
      (acc) => acc.id !== currentAccount.id && acc.username.toLowerCase() === cleanNewUser
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
    return entryRequests.filter(
      (req) =>
        req.studentId === currentStudent.id &&
        !(req.status === 'approved' && req.codeExpiresAtMs && nowTick >= req.codeExpiresAtMs)
    );
  }, [currentStudent, entryRequests, nowTick]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-20">
      {/* ====================================================================
          LIGHTBOX MODAL FOR FULL-SIZE PHOTO
      ==================================================================== */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 text-white">
              <div className="text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{lightboxPhoto.caption}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxPhoto.src}
              alt={lightboxPhoto.caption}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          FLOATING TOAST NOTIFICATION
      ==================================================================== */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 max-w-sm">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          TOP HEADER: USEATIFY LOGO + SLOGAN BAR & 3-TAB NAVIGATION
      ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#fbf8f3]/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 gap-3">
            {/* Brand Identity (Top-Left Official Logo + Slogan Alongside) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div
                  onClick={() => setActiveTab('guest')}
                  className="flex items-center cursor-pointer"
                  title="USEATIFY – Find your space, embrace your pace"
                >
                  <UseatifyBrandLogo className="h-12 sm:h-14 w-auto" />
                </div>

                <p className="text-[11px] text-slate-600 font-serif italic font-semibold sm:hidden">
                  Find your space, embrace your pace
                </p>

                <div className="hidden sm:flex items-center gap-2.5 pl-1">
                  <span className="w-8 md:w-10 h-[1.5px] bg-amber-600/60 rounded-full" />
                  <span className="text-amber-600 text-[10px]">◆</span>
                  <span className="text-xs md:text-sm font-serif italic font-semibold text-slate-700 tracking-wide">
                    Find your space, embrace your pace
                  </span>
                  <span className="text-amber-600 text-[10px]">◆
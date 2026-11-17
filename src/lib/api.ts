import type {
  AdminDashboardStats,
  ApiErrorResponse,
  AuthUser,
  ExecutiveSummaryResult,
  Fasilitas,
  Laporan,
  Notifikasi,
  PrioritizedTicketResult,
  StatusTiket,
  TechnicalAction,
  TicketStatus,
  TindakanPenanganan,
  UserRole,
} from '../types';

const TOKEN_STORAGE_KEY = 'sifaskampus_token';
let inMemoryTokenFallback: string | null = null;

export class ApiClientError extends Error {
  status: number;
  code: string;
  details: Array<{ field: string; message: string }>;

  constructor(
    status: number,
    payload: ApiErrorResponse | { message?: string; error?: string }
  ) {
    super(payload.message || 'Terjadi kesalahan saat menghubungi server.');
    this.status = status;
    this.code = payload.error || 'UNKNOWN_ERROR';
    this.details = 'details' in payload && Array.isArray(payload.details) ? payload.details : [];
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || inMemoryTokenFallback;
  } catch {
    return inMemoryTokenFallback;
  }
}

export function setStoredToken(token: string | null): void {
  inMemoryTokenFallback = token;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Fallback to in-memory token if storage is restricted in private/in-app browser
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers,
    });
  } catch {
    throw new ApiClientError(0, {
      error: 'NETWORK_ERROR',
      message:
        'Tidak dapat terhubung ke server. Periksa koneksi internet atau buka URL langsung di Chrome / Safari.',
    });
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/json')) {
    const data = (await response.json()) as ApiErrorResponse | T;
    if (!response.ok) {
      throw new ApiClientError(response.status, data as ApiErrorResponse);
    }
    return data as T;
  }

  const textBody = await response.text();
  const trimmed = textBody.trim().toLowerCase();
  if (
    contentType.includes('text/html') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html')
  ) {
    throw new ApiClientError(response.status || 401, {
      error: 'PROXY_AUTH_REQUIRED',
      message:
        'Sesi browser belum terverifikasi oleh server. Jika dibuka dari aplikasi lain (WhatsApp/Telegram), buka tautan di Chrome/Safari lalu muat ulang halaman.',
    });
  }

  if (!response.ok) {
    throw new ApiClientError(response.status, {
      error: 'HTTP_ERROR',
      message: textBody || `Terjadi kesalahan server (${response.status}).`,
    });
  }

  return { message: textBody } as T;
}

export async function registerUser(payload: {
  nama: string;
  email: string;
  password: string;
  role: UserRole;
  nomor_induk: string;
  fakultas: string;
  unit_kerja: string;
  no_hp: string;
}): Promise<{ access_token: string; user: AuthUser }> {
  return request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  identifier?: string;
  nim?: string;
  email?: string;
  password: string;
}): Promise<{ access_token: string; user: AuthUser }> {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(payload: {
  nama?: string;
  fakultas?: string;
  unit_kerja?: string;
  no_hp?: string;
  password_lama?: string;
  password_baru?: string;
}): Promise<{ message: string; user: AuthUser }> {
  return request('/api/v1/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  return request('/api/v1/auth/me');
}

export async function fetchAllFacilities(): Promise<{ data: Fasilitas[] }> {
  return request('/api/v1/fasilitas');
}

export async function lookupFacilityByQr(kodeQr: string): Promise<{ data: Fasilitas }> {
  return request(`/api/v1/fasilitas/qr/${encodeURIComponent(kodeQr.trim())}`);
}

export async function submitDamageReport(formData: FormData): Promise<{
  message: string;
  data: Laporan;
}> {
  return request('/api/v1/laporan', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchUserReports(idUser: string): Promise<{ data: Laporan[] }> {
  return request(`/api/v1/laporan/user/${encodeURIComponent(idUser)}`);
}

export async function fetchReportHistory(idLaporan: string): Promise<{
  laporan: Laporan;
  history: StatusTiket[];
  tindakan: TindakanPenanganan | null;
}> {
  return request(`/api/v1/laporan/${encodeURIComponent(idLaporan)}/history`);
}

export async function fetchAdminReports(): Promise<{
  stats: AdminDashboardStats;
  data: Laporan[];
  tindakan: TindakanPenanganan[];
  cached_prioritizations: PrioritizedTicketResult[];
  latest_summary: ExecutiveSummaryResult | null;
}> {
  return request('/api/v1/admin/laporan');
}

export async function updateReportStatusByAdmin(
  idLaporan: string,
  payload: {
    keputusan?: 'Layak' | 'Ditolak';
    jenis_tindakan?: TechnicalAction;
    alasan_penolakan?: string;
    status_baru?: TicketStatus;
    catatan_petugas?: string;
    estimasi_selesai?: string;
  }
): Promise<{
  message: string;
  laporan: Laporan;
  status_record: StatusTiket;
  fcm_notification: Notifikasi;
}> {
  return request(`/api/v1/admin/laporan/${encodeURIComponent(idLaporan)}/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function generateAiExecutiveSummary(filters: {
  periode: string;
  gedung: string;
  kategori: string;
}): Promise<{ data: ExecutiveSummaryResult }> {
  return request('/api/v1/analytics/summary', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
}

export async function runAiPrioritization(): Promise<{
  message: string;
  data: PrioritizedTicketResult[];
}> {
  return request('/api/v1/ai/prioritize-tickets', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchUserNotifications(
  idUser: string
): Promise<{ data: Notifikasi[] }> {
  return request(`/api/v1/notifikasi/${encodeURIComponent(idUser)}`);
}

export async function markNotificationsRead(idUser: string): Promise<void> {
  await request(`/api/v1/notifikasi/${encodeURIComponent(idUser)}/read`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
}

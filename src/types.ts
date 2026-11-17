export type UserRole = 'Mahasiswa' | 'Dosen' | 'Admin';

export type SeverityLevel = 'Ringan' | 'Sedang' | 'Berat';

export type TicketStatus =
  | 'Diajukan'
  | 'Ditinjau Admin'
  | 'Diproses'
  | 'Selesai'
  | 'Ditolak';

export type TechnicalAction = 'Perbaiki' | 'Ganti Baru';

export type UrgencyCategory = 'Tinggi' | 'Sedang' | 'Rendah';

export interface Pengguna {
  id_user: string;
  nama: string;
  email: string;
  password?: string;
  role: UserRole;
  nomor_induk: string;
}

export interface DetailAkun {
  id_detail: string;
  id_user: string;
  fakultas: string;
  unit_kerja: string;
  no_hp: string;
  created_at: string;
}

export interface AuthUser extends Omit<Pengguna, 'password'> {
  detail?: DetailAkun;
}

export interface Fasilitas {
  id_fasilitas: string;
  kode_qr: string;
  nama_fasilitas: string;
  lokasi_gedung: string;
  ruangan: string;
  kategori: string;
  deskripsi_aset: string;
}

export interface Laporan {
  id_laporan: string;
  id_user: string;
  pelapor_nama: string;
  pelapor_role: UserRole;
  id_fasilitas: string;
  kode_qr: string;
  nama_fasilitas: string;
  lokasi_gedung: string;
  kategori: string;
  keparahan: SeverityLevel;
  deskripsi: string;
  foto_url: string;
  status_terkini: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface StatusTiket {
  id_status: string;
  id_laporan: string;
  status: TicketStatus;
  catatan_petugas: string;
  updated_by: string;
  timestamp: string;
}

export interface TindakanPenanganan {
  id_tindakan: string;
  id_laporan: string;
  id_admin: string;
  admin_nama: string;
  keputusan: 'Layak' | 'Ditolak';
  jenis_tindakan: TechnicalAction | null;
  alasan_penolakan: string | null;
  estimasi_selesai: string | null;
  created_at: string;
}

export interface BuildingTrendItem {
  gedung: string;
  jumlah_laporan: number;
  persentase_kenaikan: number;
  ringkasan_tren: string;
}

export interface ExecutiveSummaryResult {
  id_analisis: string;
  filter_periode: string;
  filter_gedung: string;
  filter_kategori: string;
  total_dianalisis: number;
  ringkasan_eksekutif: string;
  pola_dominan: string[];
  peningkatan_gedung: BuildingTrendItem[];
  rekomendasi_tindakan: string[];
  generated_at: string;
}

export interface PrioritizedTicketResult {
  id_analisis: string;
  id_laporan: string;
  kode_qr: string;
  nama_fasilitas: string;
  lokasi_gedung: string;
  kategori: string;
  keparahan: SeverityLevel;
  status_terkini: TicketStatus;
  skor_keparahan: number;
  skor_frekuensi: number;
  skor_dampak: number;
  skor_prioritas: number;
  kategori_urgensi: UrgencyCategory;
  alasan_urgensi: string;
  rekomendasi_teknis: string;
  generated_at: string;
}

export interface Notifikasi {
  id_notif: string;
  id_user: string;
  id_laporan: string;
  judul: string;
  pesan: string;
  channel: 'FCM';
  dibaca: boolean;
  timestamp: string;
}

export interface ValidationFieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationFieldError[];
}

export interface AdminDashboardStats {
  total: number;
  diajukan: number;
  ditinjau: number;
  diproses: number;
  selesai: number;
  ditolak: number;
  by_category: Array<{ kategori: string; count: number }>;
  by_building: Array<{ gedung: string; count: number }>;
}

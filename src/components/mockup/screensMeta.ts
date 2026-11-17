export type ScreenId =
  | 'map'
  | 'login'
  | 'login-error'
  | 'register'
  | 'register-error'
  | 'home'
  | 'report-photo'
  | 'report-scan-qr'
  | 'report-qr-valid'
  | 'report-qr-invalid'
  | 'report-form'
  | 'report-review'
  | 'report-success'
  | 'my-reports'
  | 'my-reports-empty'
  | 'report-detail'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-reports'
  | 'admin-detail'
  | 'admin-action'
  | 'admin-reject'
  | 'admin-updated'
  | 'admin-ai-summary-filter'
  | 'admin-ai-summary-result'
  | 'admin-ai-summary-empty'
  | 'admin-ai-priority-intro'
  | 'admin-ai-priority-result'
  | 'admin-ai-priority-empty';

export interface ScreenMeta {
  id: ScreenId;
  slide: number;
  diagramLabel: string;
  badgeColor: string;
  title: string;
  actor: string;
  activity: string;
}

export const SCREEN_META: Record<ScreenId, ScreenMeta> = {
  map: {
    id: 'map',
    slide: 1,
    diagramLabel: 'MOCKUP APLIKASI',
    badgeColor: '#2563EB',
    title: 'Pelaporan Fasilitas Kampus',
    actor: 'Semua Aktor (Mahasiswa, Dosen, Admin, AI)',
    activity: 'Peta navigasi utama untuk seluruh alur pada 6 diagram aktivitas.',
  },
  login: {
    id: 'login',
    slide: 2,
    diagramLabel: 'DIAGRAM 1 · AUTENTIKASI & REGISTRASI',
    badgeColor: '#2563EB',
    title: 'Login',
    actor: 'Pengguna (Mahasiswa / Dosen / Admin)',
    activity: 'Pilih Login / Buat Akun? → Input NIM & Password',
  },
  'login-error': {
    id: 'login-error',
    slide: 3,
    diagramLabel: 'DIAGRAM 1 · AUTENTIKASI & REGISTRASI',
    badgeColor: '#2563EB',
    title: 'Login Gagal',
    actor: 'Pengguna & Sistem Aplikasi Kampus',
    activity: 'Verifikasi Kredensial → Login Valid? (Tidak) → kembali ke Form Login',
  },
  register: {
    id: 'register',
    slide: 4,
    diagramLabel: 'DIAGRAM 1 · AUTENTIKASI & REGISTRASI',
    badgeColor: '#2563EB',
    title: 'Registrasi Akun',
    actor: 'Pengguna (Mahasiswa / Dosen / Admin)',
    activity: 'Isi Form Registrasi (NIM/NIP 8 digit, @kampus.ac.id, min. 8 karakter)',
  },
  'register-error': {
    id: 'register-error',
    slide: 5,
    diagramLabel: 'DIAGRAM 1 · AUTENTIKASI & REGISTRASI',
    badgeColor: '#2563EB',
    title: 'Registrasi – Data Tidak Valid',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Validasi Data Registrasi → Data Valid? (Tidak) → kembali ke Isi Form',
  },
  home: {
    id: 'home',
    slide: 6,
    diagramLabel: 'DIAGRAM 1 · AUTENTIKASI & REGISTRASI',
    badgeColor: '#2563EB',
    title: 'Home Mahasiswa',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Tampilkan Dashboard Utama (<<include>> Lihat Dashboard)',
  },
  'report-photo': {
    id: 'report-photo',
    slide: 7,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'Buat Laporan – Ambil Foto',
    actor: 'Mahasiswa & Dosen (Pelapor)',
    activity: 'Buka Menu Buat Laporan → Ambil Foto atau Pilih Scan QR',
  },
  'report-scan-qr': {
    id: 'report-scan-qr',
    slide: 8,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'Scan QR Fasilitas (Fitur Tambahan)',
    actor: 'Pelapor & Sistem Aplikasi Kampus',
    activity: 'Scan QR Code pada fasilitas → Sistem membaca kode aset → Lokasi & kategori terisi otomatis',
  },
  'report-qr-valid': {
    id: 'report-qr-valid',
    slide: 9,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'QR Terbaca',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Sistem membaca kode aset → Isi otomatis Lokasi & Kategori',
  },
  'report-qr-invalid': {
    id: 'report-qr-invalid',
    slide: 10,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'QR Tidak Dikenali',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Kode aset tidak valid → tampilkan pesan, scan ulang atau isi lokasi manual',
  },
  'report-form': {
    id: 'report-form',
    slide: 11,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'Lokasi & Deskripsi',
    actor: 'Mahasiswa & Dosen (Pelapor)',
    activity: 'Input Lokasi, Kategori, Keparahan, Deskripsi & Unggah Foto Kerusakan',
  },
  'report-review': {
    id: 'report-review',
    slide: 12,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'Tinjau Laporan',
    actor: 'Pelapor (Mahasiswa & Dosen)',
    activity: 'Tinjau Laporan → Konfirmasi Kirim? (Revisi / Edit atau Kirim)',
  },
  'report-success': {
    id: 'report-success',
    slide: 13,
    diagramLabel: 'DIAGRAM 2 · PELAPORAN KERUSAKAN',
    badgeColor: '#8B5CF6',
    title: 'Laporan Diajukan',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Simpan Tiket Laporan Baru (Status: Diajukan)',
  },
  'my-reports': {
    id: 'my-reports',
    slide: 14,
    diagramLabel: 'DIAGRAM 3 · TRACKING & MONITORING STATUS',
    badgeColor: '#14B8A6',
    title: 'Laporan Saya',
    actor: 'Pengguna (Pelapor) & Sistem',
    activity: 'Pilih Menu Monitor Status Laporan → Tampilkan Daftar Tiket & Status',
  },
  'my-reports-empty': {
    id: 'my-reports-empty',
    slide: 15,
    diagramLabel: 'DIAGRAM 3 · TRACKING & MONITORING STATUS',
    badgeColor: '#14B8A6',
    title: 'Laporan Saya – Kosong',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Ada Laporan? (Tidak) → Tampilkan Pesan "Belum Ada Laporan"',
  },
  'report-detail': {
    id: 'report-detail',
    slide: 16,
    diagramLabel: 'DIAGRAM 3 · TRACKING & MONITORING STATUS',
    badgeColor: '#14B8A6',
    title: 'Detail Laporan',
    actor: 'Pengguna & Sistem Aplikasi Kampus',
    activity: 'Pilih Tiket Laporan Tertentu → Query Detail & Histori → Timeline & Catatan Petugas',
  },
  profile: {
    id: 'profile',
    slide: 17,
    diagramLabel: 'MENU PENDUKUNG · PROFIL',
    badgeColor: '#64748B',
    title: 'Profil Saya',
    actor: 'Pengguna',
    activity: 'Menu Profil (akses dari navigasi bawah) · Edit Profil, Pengaturan, Bantuan, Logout',
  },
  'admin-dashboard': {
    id: 'admin-dashboard',
    slide: 18,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Dashboard Admin',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Dashboard Admin → pintu masuk ke Kelola Laporan, Rangkuman AI & Prioritas',
  },
  'admin-reports': {
    id: 'admin-reports',
    slide: 19,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Kelola Laporan',
    actor: 'Admin & Sistem Aplikasi Kampus',
    activity: 'Akses Menu Kelola Semua Laporan → Ambil Seluruh Laporan Aktif',
  },
  'admin-detail': {
    id: 'admin-detail',
    slide: 20,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Detail Laporan (Admin)',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Pilih Laporan Masuk → Evaluasi Detail & Foto Kerusakan → Layak Diproses?',
  },
  'admin-action': {
    id: 'admin-action',
    slide: 21,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Tentukan Tindakan',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Laporan Layak? (Ya) → Tentukan Tindakan Perbaikan / Penggantian → Update Status',
  },
  'admin-reject': {
    id: 'admin-reject',
    slide: 22,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Tolak Laporan',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Laporan Layak? (Tidak) → Tolak Laporan & Beri Catatan',
  },
  'admin-updated': {
    id: 'admin-updated',
    slide: 23,
    diagramLabel: 'DIAGRAM 4 · PENINJAUAN & UPDATE STATUS (ADMIN)',
    badgeColor: '#F59E0B',
    title: 'Status Diperbarui',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Simpan Perubahan Status ke Database → Kirim Notifikasi Update ke Pelapor',
  },
  'admin-ai-summary-filter': {
    id: 'admin-ai-summary-filter',
    slide: 24,
    diagramLabel: 'DIAGRAM 5 · RANGKUMAN EKSEKUTIF AI',
    badgeColor: '#D946EF',
    title: 'Rangkuman AI – Filter',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Akses Menu Rangkuman Laporan (AI) → Atur Filter → Klik Generate Rangkuman AI',
  },
  'admin-ai-summary-result': {
    id: 'admin-ai-summary-result',
    slide: 25,
    diagramLabel: 'DIAGRAM 5 · RANGKUMAN EKSEKUTIF AI',
    badgeColor: '#D946EF',
    title: 'Rangkuman Eksekutif',
    actor: 'Subsistem AI & Admin',
    activity: 'Ekstraksi Pola Kerusakan & Sintesis Ringkasan Eksekutif → Tinjau Tren',
  },
  'admin-ai-summary-empty': {
    id: 'admin-ai-summary-empty',
    slide: 26,
    diagramLabel: 'DIAGRAM 5 · RANGKUMAN EKSEKUTIF AI',
    badgeColor: '#D946EF',
    title: 'Data Tidak Ditemukan',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Data Ditemukan? (Tidak) → Tampilkan Pesan "Data Tidak Ditemukan"',
  },
  'admin-ai-priority-intro': {
    id: 'admin-ai-priority-intro',
    slide: 27,
    diagramLabel: 'DIAGRAM 6 · PRIORITASI PENANGANAN AI',
    badgeColor: '#F97316',
    title: 'Prioritas Penanganan',
    actor: 'Admin / Petugas Fasilitas',
    activity: 'Akses Menu Prioritas Fasilitas → Klik Hitung Prioritas Penanganan',
  },
  'admin-ai-priority-result': {
    id: 'admin-ai-priority-result',
    slide: 28,
    diagramLabel: 'DIAGRAM 6 · PRIORITASI PENANGANAN AI',
    badgeColor: '#F97316',
    title: 'Urutan Prioritas',
    actor: 'Subsistem AI & Admin',
    activity: 'Kalkulasi Skor Urgensi → Tampilkan Tiket Terurut (Tinggi / Sedang / Rendah)',
  },
  'admin-ai-priority-empty': {
    id: 'admin-ai-priority-empty',
    slide: 29,
    diagramLabel: 'DIAGRAM 6 · PRIORITASI PENANGANAN AI',
    badgeColor: '#F97316',
    title: 'Tidak Ada Tiket Aktif',
    actor: 'Sistem Aplikasi Kampus',
    activity: 'Ada Tiket Aktif? (Tidak) → Tampilkan Pesan "Tidak Ada Tiket Aktif"',
  },
};

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type {
  DetailAkun,
  ExecutiveSummaryResult,
  Fasilitas,
  Laporan,
  Notifikasi,
  Pengguna,
  PrioritizedTicketResult,
  StatusTiket,
  TindakanPenanganan,
} from '../src/types.ts';

export interface DatabaseSchema {
  PENGGUNA: Array<Pengguna & { password: string }>;
  DETAIL_AKUN: DetailAkun[];
  FASILITAS: Fasilitas[];
  LAPORAN: Laporan[];
  STATUS_TIKET: StatusTiket[];
  TINDAKAN_PENANGANAN: TindakanPenanganan[];
  ANALISIS_AI: {
    summaries: ExecutiveSummaryResult[];
    prioritizations: PrioritizedTicketResult[];
  };
  NOTIFIKASI: Notifikasi[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

function createInitialDatabase(): DatabaseSchema {
  const mahasiswaHash = bcrypt.hashSync('Mahasiswa123', 10);
  const dosenHash = bcrypt.hashSync('Dosen1234', 10);
  const adminHash = bcrypt.hashSync('Admin1234', 10);

  return {
    PENGGUNA: [
      {
        id_user: 'USR-001',
        nama: 'Budi Santoso',
        email: 'budi.santoso@kampus.ac.id',
        password: mahasiswaHash,
        role: 'Mahasiswa',
        nomor_induk: '21041101',
      },
      {
        id_user: 'USR-002',
        nama: 'Dr. Ratna Wijaya, M.T.',
        email: 'ratna.wijaya@kampus.ac.id',
        password: dosenHash,
        role: 'Dosen',
        nomor_induk: '19850412',
      },
      {
        id_user: 'USR-003',
        nama: 'Hendra Kusuma (Admin Sarpras)',
        email: 'admin.sarpras@kampus.ac.id',
        password: adminHash,
        role: 'Admin',
        nomor_induk: '19790101',
      },
    ],
    DETAIL_AKUN: [
      {
        id_detail: 'DTL-001',
        id_user: 'USR-001',
        fakultas: 'Fakultas Teknik',
        unit_kerja: 'Program Studi Teknik Informatika',
        no_hp: '081234567890',
        created_at: daysAgo(45),
      },
      {
        id_detail: 'DTL-002',
        id_user: 'USR-002',
        fakultas: 'Fakultas Teknik',
        unit_kerja: 'Departemen Teknik Elektro',
        no_hp: '081398765432',
        created_at: daysAgo(60),
      },
      {
        id_detail: 'DTL-003',
        id_user: 'USR-003',
        fakultas: 'Rektorat',
        unit_kerja: 'Direktorat Sarana & Prasarana',
        no_hp: '081122334455',
        created_at: daysAgo(120),
      },
    ],
    FASILITAS: [
      {
        id_fasilitas: 'FAS-001',
        kode_qr: 'KR-A002-07',
        nama_fasilitas: 'Kursi - Ruang A002',
        lokasi_gedung: 'Ruang A002 – Gedung A',
        ruangan: 'Ruang Kuliah A002',
        kategori: 'Kursi',
        deskripsi_aset: 'Kursi kuliah mahasiswa baris tengah Ruang A002.',
      },
      {
        id_fasilitas: 'FAS-002',
        kode_qr: 'PRJ-B104-02',
        nama_fasilitas: 'Proyektor - Ruang B101',
        lokasi_gedung: 'Ruang B101 – Gedung B',
        ruangan: 'Ruang B101',
        kategori: 'Proyektor',
        deskripsi_aset: 'Proyektor utama ruang kuliah bersama untuk perkuliahan dan seminar.',
      },
      {
        id_fasilitas: 'FAS-003',
        kode_qr: 'LMP-C001-11',
        nama_fasilitas: 'Lampu - Koridor B',
        lokasi_gedung: 'Koridor Lantai 2 – Gedung B',
        ruangan: 'Koridor Lantai 2',
        kategori: 'Lampu / AC',
        deskripsi_aset: 'Penerangan koridor akses utama menuju ruang kuliah dan lab.',
      },
      {
        id_fasilitas: 'FAS-004',
        kode_qr: 'AC-LAB3-04',
        nama_fasilitas: 'AC - Lab 3',
        lokasi_gedung: 'Lab 3 – Gedung C',
        ruangan: 'Laboratorium 3',
        kategori: 'Lampu / AC',
        deskripsi_aset: 'Unit pendingin ruangan laboratorium komputasi.',
      },
      {
        id_fasilitas: 'FAS-005',
        kode_qr: 'PMP-D002-09',
        nama_fasilitas: 'Stop Kontak - Lab 2',
        lokasi_gedung: 'Lab 2 – Gedung C',
        ruangan: 'Laboratorium 2',
        kategori: 'Lainnya',
        deskripsi_aset: 'Instalasi stop kontak meja praktikum mahasiswa.',
      },
      {
        id_fasilitas: 'FAS-006',
        kode_qr: 'MJ-A204-03',
        nama_fasilitas: 'Meja Dosen - Ruang A204',
        lokasi_gedung: 'Ruang A204 – Gedung A',
        ruangan: 'Ruang Kuliah A204',
        kategori: 'Meja',
        deskripsi_aset: 'Meja pengajar utama di depan kelas A204.',
      },
    ],
    LAPORAN: [
      {
        id_laporan: 'TK-0012',
        id_user: 'USR-001',
        pelapor_nama: 'Budi Santoso',
        pelapor_role: 'Mahasiswa',
        id_fasilitas: 'FAS-001',
        kode_qr: 'KR-A002-07',
        nama_fasilitas: 'Kursi - Ruang A002',
        lokasi_gedung: 'Ruang A002 – Gedung A',
        kategori: 'Kursi',
        keparahan: 'Sedang',
        deskripsi:
          'Sandaran kursi patah saat dipakai, berbahaya untuk mahasiswa.',
        foto_url: '/src/assets/images/campus_engineering_building_1794892131733.jpg',
        status_terkini: 'Diajukan',
        created_at: hoursAgo(3),
        updated_at: hoursAgo(3),
      },
      {
        id_laporan: 'TK-0011',
        id_user: 'USR-001',
        pelapor_nama: 'Budi Santoso',
        pelapor_role: 'Mahasiswa',
        id_fasilitas: 'FAS-002',
        kode_qr: 'PRJ-B104-02',
        nama_fasilitas: 'Proyektor - Ruang B101',
        lokasi_gedung: 'Ruang B101 – Gedung B',
        kategori: 'Proyektor',
        keparahan: 'Berat',
        deskripsi:
          'Braket gantung plafon proyektor miring dan kabel HDMI terlepas sehingga kuliah umum terhambat.',
        foto_url: '/src/assets/images/damage_projector_lab_1794892131899.jpg',
        status_terkini: 'Diproses',
        created_at: daysAgo(2),
        updated_at: hoursAgo(12),
      },
      {
        id_laporan: 'TK-0010',
        id_user: 'USR-001',
        pelapor_nama: 'Budi Santoso',
        pelapor_role: 'Mahasiswa',
        id_fasilitas: 'FAS-005',
        kode_qr: 'PMP-D002-09',
        nama_fasilitas: 'Stop Kontak - Lab 2',
        lokasi_gedung: 'Lab 2 – Gedung C',
        kategori: 'Lainnya',
        keparahan: 'Sedang',
        deskripsi:
          'Stop kontak meja praktikum baris tengah longgar dan tidak mengalirkan daya listrik.',
        foto_url: '/src/assets/images/damage_electrical_corridor_1794892132270.jpg',
        status_terkini: 'Selesai',
        created_at: daysAgo(6),
        updated_at: daysAgo(3),
      },
      {
        id_laporan: 'TK-0009',
        id_user: 'USR-002',
        pelapor_nama: 'Dr. Ratna Wijaya, M.T.',
        pelapor_role: 'Dosen',
        id_fasilitas: 'FAS-004',
        kode_qr: 'AC-LAB3-04',
        nama_fasilitas: 'AC - Lab 3',
        lokasi_gedung: 'Lab 3 – Gedung C',
        kategori: 'Lampu / AC',
        keparahan: 'Berat',
        deskripsi:
          'Air kondensasi menetes deras dari unit indoor AC membasahi dinding dan lantai dekat stopkontak selama perkuliahan.',
        foto_url: '/src/assets/images/damage_ac_leak_1794892131712.jpg',
        status_terkini: 'Ditinjau Admin',
        created_at: hoursAgo(8),
        updated_at: hoursAgo(4),
      },
      {
        id_laporan: 'TK-0008',
        id_user: 'USR-002',
        pelapor_nama: 'Dr. Ratna Wijaya, M.T.',
        pelapor_role: 'Dosen',
        id_fasilitas: 'FAS-003',
        kode_qr: 'LMP-C001-11',
        nama_fasilitas: 'Lampu - Koridor B',
        lokasi_gedung: 'Koridor Lantai 2 – Gedung B',
        kategori: 'Lampu / AC',
        keparahan: 'Ringan',
        deskripsi:
          'Penutup akrilik panel lampu plafon lepas dan berkedip di koridor lantai 2.',
        foto_url: '/src/assets/images/damage_electrical_corridor_1794892132270.jpg',
        status_terkini: 'Diajukan',
        created_at: hoursAgo(14),
        updated_at: hoursAgo(14),
      },
      {
        id_laporan: 'TK-0007',
        id_user: 'USR-001',
        pelapor_nama: 'Budi Santoso',
        pelapor_role: 'Mahasiswa',
        id_fasilitas: 'FAS-006',
        kode_qr: 'MJ-A204-03',
        nama_fasilitas: 'Meja Dosen - Ruang A204',
        lokasi_gedung: 'Ruang A204 – Gedung A',
        kategori: 'Meja',
        keparahan: 'Ringan',
        deskripsi:
          'Laci meja dosen macet dan kaki meja sedikit goyang.',
        foto_url: '/src/assets/images/campus_engineering_building_1794892131733.jpg',
        status_terkini: 'Selesai',
        created_at: daysAgo(9),
        updated_at: daysAgo(7),
      },
    ],
    STATUS_TIKET: [
      {
        id_status: 'STS-001',
        id_laporan: 'TK-0012',
        status: 'Diajukan',
        catatan_petugas: 'Laporan kerusakan diterima sistem melalui pemindaian QR aset KR-A002-07.',
        updated_by: 'Sistem Pelaporan',
        timestamp: hoursAgo(3),
      },
      {
        id_status: 'STS-002',
        id_laporan: 'TK-0011',
        status: 'Diajukan',
        catatan_petugas: 'Laporan kerusakan Proyektor Ruang B101 diterima.',
        updated_by: 'Sistem Pelaporan',
        timestamp: daysAgo(2),
      },
      {
        id_status: 'STS-003',
        id_laporan: 'TK-0011',
        status: 'Ditinjau Admin',
        catatan_petugas: 'Laporan diverifikasi oleh Admin Sarpras.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: daysAgo(1),
      },
      {
        id_status: 'STS-004',
        id_laporan: 'TK-0011',
        status: 'Diproses',
        catatan_petugas: 'Tindakan teknis: Perbaiki. Teknisi AV dijadwalkan pengencangan braket dan penggantian kabel HDMI.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: hoursAgo(12),
      },
      {
        id_status: 'STS-005',
        id_laporan: 'TK-0010',
        status: 'Diajukan',
        catatan_petugas: 'Laporan kerusakan Stop Kontak Lab 2 diterima.',
        updated_by: 'Sistem Pelaporan',
        timestamp: daysAgo(6),
      },
      {
        id_status: 'STS-006',
        id_laporan: 'TK-0010',
        status: 'Diproses',
        catatan_petugas: 'Tim kelistrikan melakukan penggantian modul stop kontak.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: daysAgo(5),
      },
      {
        id_status: 'STS-007',
        id_laporan: 'TK-0010',
        status: 'Selesai',
        catatan_petugas: 'Stop kontak meja praktikum telah diganti dan diuji normal.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: daysAgo(3),
      },
      {
        id_status: 'STS-008',
        id_laporan: 'TK-0009',
        status: 'Diajukan',
        catatan_petugas: 'Laporan kebocoran AC Lab 3 diterima.',
        updated_by: 'Sistem Pelaporan',
        timestamp: hoursAgo(8),
      },
      {
        id_status: 'STS-009',
        id_laporan: 'TK-0009',
        status: 'Ditinjau Admin',
        catatan_petugas: 'Sedang ditinjau tim HVAC dan keselamatan ruang lab.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: hoursAgo(4),
      },
      {
        id_status: 'STS-010',
        id_laporan: 'TK-0008',
        status: 'Diajukan',
        catatan_petugas: 'Laporan lampu koridor Gedung B diterima.',
        updated_by: 'Sistem Pelaporan',
        timestamp: hoursAgo(14),
      },
      {
        id_status: 'STS-011',
        id_laporan: 'TK-0007',
        status: 'Diajukan',
        catatan_petugas: 'Laporan meja dosen Ruang A204 diterima.',
        updated_by: 'Sistem Pelaporan',
        timestamp: daysAgo(9),
      },
      {
        id_status: 'STS-012',
        id_laporan: 'TK-0007',
        status: 'Diproses',
        catatan_petugas: 'Perbaikan rel laci dan pengencangan baut kaki meja.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: daysAgo(8),
      },
      {
        id_status: 'STS-013',
        id_laporan: 'TK-0007',
        status: 'Selesai',
        catatan_petugas: 'Meja dosen telah selesai diperbaiki.',
        updated_by: 'Hendra Kusuma (Admin Sarpras)',
        timestamp: daysAgo(7),
      },
    ],
    TINDAKAN_PENANGANAN: [
      {
        id_tindakan: 'TDK-001',
        id_laporan: 'TK-0011',
        id_admin: 'USR-003',
        admin_nama: 'Hendra Kusuma (Admin Sarpras)',
        keputusan: 'Layak',
        jenis_tindakan: 'Perbaiki',
        alasan_penolakan: null,
        estimasi_selesai: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
        created_at: hoursAgo(12),
      },
      {
        id_tindakan: 'TDK-002',
        id_laporan: 'TK-0010',
        id_admin: 'USR-003',
        admin_nama: 'Hendra Kusuma (Admin Sarpras)',
        keputusan: 'Layak',
        jenis_tindakan: 'Ganti Baru',
        alasan_penolakan: null,
        estimasi_selesai: daysAgo(3).slice(0, 10),
        created_at: daysAgo(5),
      },
      {
        id_tindakan: 'TDK-003',
        id_laporan: 'TK-0007',
        id_admin: 'USR-003',
        admin_nama: 'Hendra Kusuma (Admin Sarpras)',
        keputusan: 'Layak',
        jenis_tindakan: 'Perbaiki',
        alasan_penolakan: null,
        estimasi_selesai: daysAgo(7).slice(0, 10),
        created_at: daysAgo(8),
      },
    ],
    ANALISIS_AI: {
      summaries: [],
      prioritizations: [],
    },
    NOTIFIKASI: [
      {
        id_notif: 'NTF-001',
        id_user: 'USR-001',
        id_laporan: 'TK-0011',
        judul: 'Status Tiket TK-0011: Diproses',
        pesan: 'Admin Sarpras menyetujui laporan Proyektor Ruang B101 dengan tindakan Perbaiki.',
        channel: 'FCM',
        dibaca: false,
        timestamp: hoursAgo(12),
      },
      {
        id_notif: 'NTF-002',
        id_user: 'USR-001',
        id_laporan: 'TK-0010',
        judul: 'Status Tiket TK-0010: Selesai',
        pesan: 'Stop kontak Lab 2 telah selesai diganti baru dan diuji normal.',
        channel: 'FCM',
        dibaca: false,
        timestamp: daysAgo(3),
      },
    ],
  };
}

export function ensureStorageInitialized(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

export function readDb(): DatabaseSchema {
  ensureStorageInitialized();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw) as DatabaseSchema;
}

export function writeDb(db: DatabaseSchema): void {
  ensureStorageInitialized();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

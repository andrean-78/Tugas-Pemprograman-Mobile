import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { ensureStorageInitialized, readDb, UPLOADS_DIR, writeDb } from './server/db.ts';
import { generateExecutiveSummary, prioritizeTicketsWithAI } from './server/ai.ts';
import type {
  AdminDashboardStats,
  AuthUser,
  Laporan,
  SeverityLevel,
  TechnicalAction,
  TicketStatus,
  UserRole,
  ValidationFieldError,
} from './src/types.ts';

ensureStorageInitialized();

const JWT_SECRET = process.env.JWT_SECRET || 'sifaskampus-jwt-secret-2026';
const PORT = Number(process.env.PORT) || 3000;

interface JwtPayload {
  id_user: string;
  email: string;
  role: UserRole;
  nama: string;
}

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureStorageInitialized();
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeName = `damage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function sanitizeUser(
  user: {
    id_user: string;
    nama: string;
    email: string;
    role: UserRole;
    nomor_induk: string;
  },
  detail?: AuthUser['detail']
): AuthUser {
  return {
    id_user: user.id_user,
    nama: user.nama,
    email: user.email,
    role: user.role,
    nomor_induk: user.nomor_induk,
    detail,
  };
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token autentikasi tidak ditemukan. Silakan masuk terlebih dahulu.',
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Sesi login telah berakhir atau token tidak valid.',
    });
  }
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Akses ditolak. Fitur ini khusus untuk Admin Sarana & Prasarana.',
    });
    return;
  }
  next();
}

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// ============================================================================
// MOD-01: AUTHENTICATION & REGISTRATION
// ============================================================================

app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      nama = '',
      email = '',
      password = '',
      role = 'Mahasiswa',
      nomor_induk = '',
      fakultas = 'Fakultas Teknik',
      unit_kerja = 'Program Studi Umum',
      no_hp = '',
    } = req.body as Record<string, string>;

    const details: ValidationFieldError[] = [];
    const trimmedNama = String(nama).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const rawNomorInduk = String(nomor_induk).trim();
    const rawPassword = String(password);

    if (trimmedNama.length < 3) {
      details.push({
        field: 'nama',
        message: 'Nama lengkap wajib diisi minimal 3 karakter.',
      });
    }

    if (!/^[a-zA-Z0-9._%+-]+@kampus\.ac\.id$/i.test(normalizedEmail)) {
      details.push({
        field: 'email',
        message: 'Email harus menggunakan domain resmi kampus (@kampus.ac.id).',
      });
    }

    if (!/^\d{8}$/.test(rawNomorInduk)) {
      details.push({
        field: 'nomor_induk',
        message: 'NIM / NIP wajib berupa 8 digit angka numerik.',
      });
    }

    if (rawPassword.length < 8) {
      details.push({
        field: 'password',
        message: 'Password minimal harus terdiri dari 8 karakter.',
      });
    }

    const validRoles: UserRole[] = ['Mahasiswa', 'Dosen', 'Admin'];
    if (!validRoles.includes(role as UserRole)) {
      details.push({
        field: 'role',
        message: 'Role harus salah satu dari: Mahasiswa, Dosen, atau Admin.',
      });
    }

    if (details.length > 0) {
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: 'Data registrasi tidak memenuhi ketentuan validasi.',
        details,
      });
      return;
    }

    const db = readDb();
    const duplicateEmail = db.PENGGUNA.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (duplicateEmail) {
      res.status(400).json({
        error: 'DUPLICATE_EMAIL',
        message: 'Email kampus sudah terdaftar pada sistem.',
        details: [{ field: 'email', message: 'Email sudah digunakan oleh akun lain.' }],
      });
      return;
    }

    const duplicateNomor = db.PENGGUNA.find((u) => u.nomor_induk === rawNomorInduk);
    if (duplicateNomor) {
      res.status(400).json({
        error: 'DUPLICATE_NOMOR_INDUK',
        message: 'NIM / NIP sudah terdaftar pada sistem.',
        details: [
          {
            field: 'nomor_induk',
            message: 'NIM / NIP 8 digit ini sudah terdaftar.',
          },
        ],
      });
      return;
    }

    const id_user = `USR-${String(db.PENGGUNA.length + 1).padStart(3, '0')}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newUser = {
      id_user,
      nama: trimmedNama,
      email: normalizedEmail,
      password: passwordHash,
      role: role as UserRole,
      nomor_induk: rawNomorInduk,
    };

    const newDetail = {
      id_detail: `DTL-${String(db.DETAIL_AKUN.length + 1).padStart(3, '0')}`,
      id_user,
      fakultas: String(fakultas).trim() || 'Fakultas Teknik',
      unit_kerja: String(unit_kerja).trim() || 'Sivitas Akademika',
      no_hp: String(no_hp).trim() || '-',
      created_at: new Date().toISOString(),
    };

    db.PENGGUNA.push(newUser);
    db.DETAIL_AKUN.push(newDetail);
    writeDb(db);

    const token = signToken({
      id_user: newUser.id_user,
      email: newUser.email,
      role: newUser.role,
      nama: newUser.nama,
    });

    res.status(201).json({
      message: 'Registrasi akun berhasil.',
      access_token: token,
      token_type: 'Bearer',
      user: sanitizeUser(newUser, newDetail),
    });
  } catch (err) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Terjadi kesalahan server.',
    });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const {
      email = '',
      nim = '',
      identifier = '',
      password = '',
    } = req.body as Record<string, string>;
    const rawIdentifier = String(identifier || nim || email).trim();
    const rawPassword = String(password);

    const details: ValidationFieldError[] = [];
    const isNim = /^\d{8}$/.test(rawIdentifier);
    const isCampusEmail = /^[a-zA-Z0-9._%+-]+@kampus\.ac\.id$/i.test(rawIdentifier);

    if (!rawIdentifier || (!isNim && !isCampusEmail)) {
      details.push({
        field: 'nim',
        message: 'Masukkan NIM/NIP 8 digit atau email @kampus.ac.id yang valid.',
      });
    }
    if (rawPassword.length < 4) {
      details.push({
        field: 'password',
        message: 'Password tidak boleh kosong.',
      });
    }

    if (details.length > 0) {
      res.status(422).json({
        error: 'VALIDATION_ERROR',
        message: details[0].message,
        details,
      });
      return;
    }

    const db = readDb();
    const user = db.PENGGUNA.find((u) =>
      isNim
        ? u.nomor_induk === rawIdentifier
        : u.email.toLowerCase() === rawIdentifier.toLowerCase()
    );
    if (!user) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'NIM atau password salah. Silakan coba lagi.',
        details: [{ field: 'password', message: 'Password tidak cocok' }],
      });
      return;
    }

    const isMatch = await bcrypt.compare(rawPassword, user.password);
    if (!isMatch) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'NIM atau password salah. Silakan coba lagi.',
        details: [{ field: 'password', message: 'Password tidak cocok' }],
      });
      return;
    }

    const detail = db.DETAIL_AKUN.find((d) => d.id_user === user.id_user);
    const token = signToken({
      id_user: user.id_user,
      email: user.email,
      role: user.role,
      nama: user.nama,
    });

    res.json({
      message: 'Login berhasil.',
      access_token: token,
      token_type: 'Bearer',
      user: sanitizeUser(user, detail),
    });
  } catch (err) {
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: err instanceof Error ? err.message : 'Terjadi kesalahan server.',
    });
  }
});

app.put('/api/v1/auth/profile', requireAuth, (req: AuthedRequest, res: Response) => {
  const { nama, fakultas, unit_kerja, no_hp, password_lama, password_baru } =
    req.body as Record<string, unknown>;
  const db = readDb();
  const userIdx = db.PENGGUNA.findIndex((u) => u.id_user === req.user?.id_user);
  if (userIdx === -1) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' });
    return;
  }

  const errors: ValidationFieldError[] = [];

  if (nama !== undefined) {
    const cleanNama = String(nama).trim();
    if (cleanNama.length < 3) {
      errors.push({
        field: 'nama',
        message: 'Nama lengkap minimal 3 karakter.',
      });
    }
  }

  if (fakultas !== undefined && String(fakultas).trim().length < 2) {
    errors.push({
      field: 'fakultas',
      message: 'Fakultas / Unit utama wajib diisi (min. 2 karakter).',
    });
  }

  if (unit_kerja !== undefined && String(unit_kerja).trim().length < 2) {
    errors.push({
      field: 'unit_kerja',
      message: 'Program Studi / Unit kerja wajib diisi (min. 2 karakter).',
    });
  }

  if (no_hp !== undefined) {
    const cleanHp = String(no_hp).trim();
    if (cleanHp !== '' && cleanHp !== '-' && !/^[0-9+\-\s]{8,16}$/.test(cleanHp)) {
      errors.push({
        field: 'no_hp',
        message: 'Nomor HP harus terdiri dari 8–16 digit angka (contoh: 081234567890).',
      });
    }
  }

  const newPass = password_baru !== undefined ? String(password_baru) : '';
  const oldPass = password_lama !== undefined ? String(password_lama) : '';
  if (newPass.length > 0) {
    if (!oldPass) {
      errors.push({
        field: 'password_lama',
        message: 'Masukkan password saat ini untuk mengganti password.',
      });
    } else if (!bcrypt.compareSync(oldPass, db.PENGGUNA[userIdx].password)) {
      errors.push({
        field: 'password_lama',
        message: 'Password saat ini tidak cocok.',
      });
    }
    if (newPass.length < 8) {
      errors.push({
        field: 'password_baru',
        message: 'Password baru minimal 8 karakter.',
      });
    }
  }

  if (errors.length > 0) {
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: errors[0].message,
      details: errors,
    });
    return;
  }

  if (nama !== undefined) {
    const updatedNama = String(nama).trim();
    db.PENGGUNA[userIdx].nama = updatedNama;
    // Sync pelapor_nama in existing reports owned by this user
    db.LAPORAN.forEach((lap) => {
      if (lap.id_user === db.PENGGUNA[userIdx].id_user) {
        lap.pelapor_nama = updatedNama;
      }
    });
  }

  if (newPass.length >= 8) {
    db.PENGGUNA[userIdx].password = bcrypt.hashSync(newPass, 10);
  }

  let detailIdx = db.DETAIL_AKUN.findIndex((d) => d.id_user === req.user?.id_user);
  if (detailIdx === -1) {
    const createdDetail = {
      id_detail: `DTL-${String(db.DETAIL_AKUN.length + 1).padStart(3, '0')}`,
      id_user: db.PENGGUNA[userIdx].id_user,
      fakultas: fakultas !== undefined ? String(fakultas).trim() || 'Fakultas Teknik' : 'Fakultas Teknik',
      unit_kerja: unit_kerja !== undefined ? String(unit_kerja).trim() || 'Sivitas Akademika' : 'Sivitas Akademika',
      no_hp: no_hp !== undefined ? String(no_hp).trim() || '-' : '-',
      created_at: new Date().toISOString(),
    };
    db.DETAIL_AKUN.push(createdDetail);
    detailIdx = db.DETAIL_AKUN.length - 1;
  } else {
    if (fakultas !== undefined) db.DETAIL_AKUN[detailIdx].fakultas = String(fakultas).trim();
    if (unit_kerja !== undefined) db.DETAIL_AKUN[detailIdx].unit_kerja = String(unit_kerja).trim();
    if (no_hp !== undefined) db.DETAIL_AKUN[detailIdx].no_hp = String(no_hp).trim() || '-';
  }

  writeDb(db);
  res.json({
    message: 'Profil berhasil diperbarui.',
    user: sanitizeUser(db.PENGGUNA[userIdx], db.DETAIL_AKUN[detailIdx]),
  });
});

app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const db = readDb();
  const user = db.PENGGUNA.find((u) => u.id_user === req.user?.id_user);
  if (!user) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' });
    return;
  }
  const detail = db.DETAIL_AKUN.find((d) => d.id_user === user.id_user);
  res.json({ user: sanitizeUser(user, detail) });
});

// ============================================================================
// MOD-02: FACILITIES QR LOOKUP & DAMAGE REPORTING
// ============================================================================

app.get('/api/v1/fasilitas', (_req: Request, res: Response) => {
  const db = readDb();
  res.json({ data: db.FASILITAS });
});

app.get('/api/v1/fasilitas/qr/:kode_qr', (req: Request, res: Response) => {
  const kode = String(req.params.kode_qr || '').trim().toUpperCase();
  const db = readDb();
  const asset = db.FASILITAS.find((f) => f.kode_qr.toUpperCase() === kode);

  if (!asset) {
    res.status(404).json({
      error: 'ASSET_NOT_FOUND',
      message: `Kode QR "${kode}" tidak terdaftar dalam database aset kampus. Gunakan mode Input Manual untuk melanjutkan.`,
    });
    return;
  }

  res.json({ data: asset });
});

app.get('/api/v1/fasilitas/qr/:kode_qr/svg', async (req: Request, res: Response) => {
  const kode = String(req.params.kode_qr || '').trim().toUpperCase();
  try {
    const svg = await QRCode.toString(kode, {
      type: 'svg',
      margin: 1,
      width: 180,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch {
    res.status(500).json({ error: 'QR_ERROR', message: 'Gagal membuat QR SVG.' });
  }
});

app.post(
  '/api/v1/laporan',
  requireAuth,
  upload.single('foto'),
  (req: AuthedRequest, res: Response) => {
    try {
      const {
        kode_qr = '',
        nama_fasilitas = '',
        lokasi_gedung = '',
        kategori = '',
        keparahan = '',
        deskripsi = '',
        fallback_foto_url = '',
      } = req.body as Record<string, string>;

      const resolvedNamaFasilitas =
        String(nama_fasilitas).trim() ||
        (String(kategori).trim() && String(lokasi_gedung).trim()
          ? `${String(kategori).trim()} - ${String(lokasi_gedung).trim().split('–')[0].trim()}`
          : '');

      const details: ValidationFieldError[] = [];
      if (!resolvedNamaFasilitas) {
        details.push({ field: 'nama_fasilitas', message: 'Nama fasilitas wajib diisi.' });
      }
      if (!String(lokasi_gedung).trim()) {
        details.push({ field: 'lokasi_gedung', message: 'Lokasi gedung wajib dipilih.' });
      }
      if (!String(kategori).trim()) {
        details.push({ field: 'kategori', message: 'Kategori kerusakan wajib dipilih.' });
      }
      const validSeverity: SeverityLevel[] = ['Ringan', 'Sedang', 'Berat'];
      if (!validSeverity.includes(keparahan as SeverityLevel)) {
        details.push({
          field: 'keparahan',
          message: 'Tingkat keparahan harus Ringan, Sedang, atau Berat.',
        });
      }
      if (String(deskripsi).trim().length < 5) {
        details.push({
          field: 'deskripsi',
          message: 'Deskripsi kerusakan wajib diisi minimal 5 karakter.',
        });
      }

      if (details.length > 0) {
        res.status(422).json({
          error: 'VALIDATION_ERROR',
          message: 'Data laporan kerusakan belum lengkap.',
          details,
        });
        return;
      }

      const db = readDb();
      const normalizedQr = String(kode_qr).trim().toUpperCase() || 'MANUAL-INPUT';
      const existingAsset = db.FASILITAS.find(
        (f) => f.kode_qr.toUpperCase() === normalizedQr
      );

      const fotoUrl = req.file
        ? `/uploads/${req.file.filename}`
        : String(fallback_foto_url).trim() ||
          '/src/assets/images/campus_engineering_building_1794892131733.jpg';

      const nowIso = new Date().toISOString();
      const id_laporan = `TK-${String(7 + db.LAPORAN.length).padStart(4, '0')}`;

      const newReport: Laporan = {
        id_laporan,
        id_user: req.user!.id_user,
        pelapor_nama: req.user!.nama,
        pelapor_role: req.user!.role,
        id_fasilitas: existingAsset ? existingAsset.id_fasilitas : 'FAS-MANUAL',
        kode_qr: normalizedQr,
        nama_fasilitas: resolvedNamaFasilitas,
        lokasi_gedung: String(lokasi_gedung).trim(),
        kategori: String(kategori).trim(),
        keparahan: keparahan as SeverityLevel,
        deskripsi: String(deskripsi).trim(),
        foto_url: fotoUrl,
        status_terkini: 'Diajukan',
        created_at: nowIso,
        updated_at: nowIso,
      };

      db.LAPORAN.unshift(newReport);
      db.STATUS_TIKET.push({
        id_status: `STS-${String(db.STATUS_TIKET.length + 1).padStart(3, '0')}`,
        id_laporan,
        status: 'Diajukan',
        catatan_petugas:
          normalizedQr === 'MANUAL-INPUT'
            ? 'Laporan dikirim menggunakan input manual fasilitas.'
            : `Laporan dikirim melalui pemindaian QR aset ${normalizedQr}.`,
        updated_by: 'Sistem Pelaporan',
        timestamp: nowIso,
      });

      // Notify Admins
      const admins = db.PENGGUNA.filter((u) => u.role === 'Admin');
      for (const admin of admins) {
        db.NOTIFIKASI.unshift({
          id_notif: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          id_user: admin.id_user,
          id_laporan,
          judul: `Laporan Baru (${keparahan}): ${newReport.nama_fasilitas}`,
          pesan: `${req.user!.nama} melaporkan kerusakan di ${newReport.lokasi_gedung}.`,
          channel: 'FCM',
          dibaca: false,
          timestamp: nowIso,
        });
      }

      writeDb(db);

      res.status(201).json({
        message: 'Laporan kerusakan berhasil dikirim.',
        data: newReport,
      });
    } catch (err) {
      res.status(500).json({
        error: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Gagal menyimpan laporan.',
      });
    }
  }
);

// ============================================================================
// MOD-03: REPORTER TRACKING & TICKET HISTORY TIMELINE
// ============================================================================

app.get('/api/v1/laporan/user/:id_user', requireAuth, (req: AuthedRequest, res: Response) => {
  const targetUserId = String(req.params.id_user);
  if (req.user?.role !== 'Admin' && req.user?.id_user !== targetUserId) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Anda hanya dapat melihat daftar laporan milik Anda sendiri.',
    });
    return;
  }

  const db = readDb();
  const reports = db.LAPORAN.filter((l) => l.id_user === targetUserId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ data: reports });
});

app.get('/api/v1/laporan/:id_laporan/history', requireAuth, (req: AuthedRequest, res: Response) => {
  const id_laporan = String(req.params.id_laporan);
  const db = readDb();
  const laporan = db.LAPORAN.find((l) => l.id_laporan === id_laporan);

  if (!laporan) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Tiket laporan tidak ditemukan.' });
    return;
  }

  if (req.user?.role !== 'Admin' && req.user?.id_user !== laporan.id_user) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Akses tiket ditolak.' });
    return;
  }

  const history = db.STATUS_TIKET.filter((s) => s.id_laporan === id_laporan).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const tindakan = db.TINDAKAN_PENANGANAN.find((t) => t.id_laporan === id_laporan) ?? null;

  res.json({
    laporan,
    history,
    tindakan,
  });
});

// ============================================================================
// MOD-04: ADMIN DASHBOARD & TICKET VERIFICATION WORKFLOW
// ============================================================================

app.get(
  '/api/v1/admin/laporan',
  requireAuth,
  requireAdmin,
  (_req: AuthedRequest, res: Response) => {
    const db = readDb();
    const reports = [...db.LAPORAN].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const catMap: Record<string, number> = {};
    const bldMap: Record<string, number> = {};
    for (const r of reports) {
      catMap[r.kategori] = (catMap[r.kategori] || 0) + 1;
      bldMap[r.lokasi_gedung] = (bldMap[r.lokasi_gedung] || 0) + 1;
    }

    const stats: AdminDashboardStats = {
      total: reports.length,
      diajukan: reports.filter((r) => r.status_terkini === 'Diajukan').length,
      ditinjau: reports.filter((r) => r.status_terkini === 'Ditinjau Admin').length,
      diproses: reports.filter((r) => r.status_terkini === 'Diproses').length,
      selesai: reports.filter((r) => r.status_terkini === 'Selesai').length,
      ditolak: reports.filter((r) => r.status_terkini === 'Ditolak').length,
      by_category: Object.entries(catMap)
        .map(([kategori, count]) => ({ kategori, count }))
        .sort((a, b) => b.count - a.count),
      by_building: Object.entries(bldMap)
        .map(([gedung, count]) => ({ gedung, count }))
        .sort((a, b) => b.count - a.count),
    };

    res.json({
      stats,
      data: reports,
      tindakan: db.TINDAKAN_PENANGANAN,
      cached_prioritizations: db.ANALISIS_AI.prioritizations,
      latest_summary: db.ANALISIS_AI.summaries[0] ?? null,
    });
  }
);

app.put(
  '/api/v1/admin/laporan/:id_laporan/status',
  requireAuth,
  requireAdmin,
  (req: AuthedRequest, res: Response) => {
    try {
      const id_laporan = String(req.params.id_laporan);
      const {
        keputusan,
        jenis_tindakan,
        alasan_penolakan,
        status_baru,
        catatan_petugas = '',
        estimasi_selesai = null,
      } = req.body as {
        keputusan?: 'Layak' | 'Ditolak';
        jenis_tindakan?: TechnicalAction;
        alasan_penolakan?: string;
        status_baru?: TicketStatus;
        catatan_petugas?: string;
        estimasi_selesai?: string | null;
      };

      const db = readDb();
      const idx = db.LAPORAN.findIndex((l) => l.id_laporan === id_laporan);
      if (idx === -1) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Laporan tidak ditemukan.' });
        return;
      }

      const laporan = db.LAPORAN[idx];
      const nowIso = new Date().toISOString();
      let nextStatus: TicketStatus = status_baru || laporan.status_terkini;
      let timelineNote = String(catatan_petugas).trim();

      if (keputusan === 'Layak') {
        if (jenis_tindakan !== 'Perbaiki' && jenis_tindakan !== 'Ganti Baru') {
          res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Pilih tindakan teknis (Perbaiki atau Ganti Baru) untuk laporan layak.',
          });
          return;
        }
        nextStatus = 'Diproses';
        timelineNote =
          timelineNote ||
          `Laporan diverifikasi layak. Tindakan teknis: ${jenis_tindakan}.`;

        db.TINDAKAN_PENANGANAN = db.TINDAKAN_PENANGANAN.filter(
          (t) => t.id_laporan !== id_laporan
        );
        db.TINDAKAN_PENANGANAN.push({
          id_tindakan: `TDK-${String(db.TINDAKAN_PENANGANAN.length + 1).padStart(3, '0')}`,
          id_laporan,
          id_admin: req.user!.id_user,
          admin_nama: req.user!.nama,
          keputusan: 'Layak',
          jenis_tindakan,
          alasan_penolakan: null,
          estimasi_selesai: estimasi_selesai || null,
          created_at: nowIso,
        });
      } else if (keputusan === 'Ditolak') {
        const reason = String(alasan_penolakan || '').trim();
        if (reason.length < 5) {
          res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Alasan penolakan wajib diisi minimal 5 karakter.',
          });
          return;
        }
        nextStatus = 'Ditolak';
        timelineNote = `Ditolak oleh Admin: ${reason}`;

        db.TINDAKAN_PENANGANAN = db.TINDAKAN_PENANGANAN.filter(
          (t) => t.id_laporan !== id_laporan
        );
        db.TINDAKAN_PENANGANAN.push({
          id_tindakan: `TDK-${String(db.TINDAKAN_PENANGANAN.length + 1).padStart(3, '0')}`,
          id_laporan,
          id_admin: req.user!.id_user,
          admin_nama: req.user!.nama,
          keputusan: 'Ditolak',
          jenis_tindakan: null,
          alasan_penolakan: reason,
          estimasi_selesai: null,
          created_at: nowIso,
        });
      } else if (status_baru) {
        const allowed: TicketStatus[] = [
          'Diajukan',
          'Ditinjau Admin',
          'Diproses',
          'Selesai',
          'Ditolak',
        ];
        if (!allowed.includes(status_baru)) {
          res.status(422).json({
            error: 'VALIDATION_ERROR',
            message: 'Status tiket tidak valid.',
          });
          return;
        }
        nextStatus = status_baru;
        timelineNote = timelineNote || `Status diperbarui menjadi ${status_baru}.`;
      }

      db.LAPORAN[idx] = {
        ...laporan,
        status_terkini: nextStatus,
        updated_at: nowIso,
      };

      const statusRecord = {
        id_status: `STS-${String(db.STATUS_TIKET.length + 1).padStart(3, '0')}`,
        id_laporan,
        status: nextStatus,
        catatan_petugas: timelineNote,
        updated_by: req.user!.nama,
        timestamp: nowIso,
      };
      db.STATUS_TIKET.push(statusRecord);

      const fcmNotification = {
        id_notif: `NTF-${Date.now()}`,
        id_user: laporan.id_user,
        id_laporan,
        judul: `Tiket ${id_laporan}: ${nextStatus}`,
        pesan: timelineNote,
        channel: 'FCM' as const,
        dibaca: false,
        timestamp: nowIso,
      };
      db.NOTIFIKASI.unshift(fcmNotification);

      writeDb(db);

      res.json({
        message: 'Status tiket berhasil diperbarui dan notifikasi FCM dikirim ke pelapor.',
        laporan: db.LAPORAN[idx],
        status_record: statusRecord,
        fcm_notification: fcmNotification,
      });
    } catch (err) {
      res.status(500).json({
        error: 'SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Gagal memperbarui status tiket.',
      });
    }
  }
);

// ============================================================================
// NOTIFICATIONS (FCM SIMULATION LOGS)
// ============================================================================

app.get('/api/v1/notifikasi/:id_user', requireAuth, (req: AuthedRequest, res: Response) => {
  const id_user = String(req.params.id_user);
  if (req.user?.role !== 'Admin' && req.user?.id_user !== id_user) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'Akses ditolak.' });
    return;
  }
  const db = readDb();
  const list = db.NOTIFIKASI.filter((n) => n.id_user === id_user).slice(0, 25);
  res.json({ data: list });
});

app.put('/api/v1/notifikasi/:id_user/read', requireAuth, (req: AuthedRequest, res: Response) => {
  const id_user = String(req.params.id_user);
  const db = readDb();
  db.NOTIFIKASI = db.NOTIFIKASI.map((n) =>
    n.id_user === id_user ? { ...n, dibaca: true } : n
  );
  writeDb(db);
  res.json({ message: 'Notifikasi ditandai sudah dibaca.' });
});

// ============================================================================
// MOD-05: AI EXECUTIVE SUMMARY SUBSYSTEM (GOOGLE GEMINI API)
// ============================================================================

app.post(
  '/api/v1/analytics/summary',
  requireAuth,
  requireAdmin,
  async (req: AuthedRequest, res: Response) => {
    try {
      const {
        periode = 'semua',
        gedung = 'Semua Gedung',
        kategori = 'Semua Kategori',
      } = req.body as {
        periode?: string;
        gedung?: string;
        kategori?: string;
      };

      const db = readDb();
      let filtered = [...db.LAPORAN];

      const now = Date.now();
      if (periode === '7d') {
        filtered = filtered.filter(
          (r) => now - new Date(r.created_at).getTime() <= 7 * 24 * 3600 * 1000
        );
      } else if (periode === '30d') {
        filtered = filtered.filter(
          (r) => now - new Date(r.created_at).getTime() <= 30 * 24 * 3600 * 1000
        );
      }

      if (gedung && gedung !== 'Semua Gedung') {
        filtered = filtered.filter((r) => r.lokasi_gedung === gedung);
      }
      if (kategori && kategori !== 'Semua Kategori') {
        filtered = filtered.filter((r) => r.kategori === kategori);
      }

      if (filtered.length === 0) {
        res.status(400).json({
          error: 'EMPTY_DATASET',
          message:
            'Tidak ada data laporan yang cocok dengan filter periode, gedung, dan kategori tersebut.',
        });
        return;
      }

      const summary = await generateExecutiveSummary(filtered, db.LAPORAN, {
        periode,
        gedung,
        kategori,
      });

      db.ANALISIS_AI.summaries.unshift(summary);
      db.ANALISIS_AI.summaries = db.ANALISIS_AI.summaries.slice(0, 10);
      writeDb(db);

      res.json({ data: summary });
    } catch (err) {
      res.status(502).json({
        error: 'AI_SUMMARY_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menghasilkan ringkasan eksekutif AI.',
      });
    }
  }
);

// ============================================================================
// MOD-06: AI PRIORITIZATION ENGINE (GOOGLE GEMINI API)
// ============================================================================

app.post(
  '/api/v1/ai/prioritize-tickets',
  requireAuth,
  requireAdmin,
  async (_req: AuthedRequest, res: Response) => {
    try {
      const db = readDb();
      const activeReports = db.LAPORAN.filter(
        (r) => r.status_terkini !== 'Selesai' && r.status_terkini !== 'Ditolak'
      );

      if (activeReports.length === 0) {
        res.json({
          data: [],
          message: 'Tidak ada tiket aktif yang memerlukan perhitungan prioritas.',
        });
        return;
      }

      const prioritized = await prioritizeTicketsWithAI(activeReports, db.LAPORAN);
      db.ANALISIS_AI.prioritizations = prioritized;
      writeDb(db);

      res.json({
        message: `Berhasil memprioritaskan ${prioritized.length} tiket aktif.`,
        data: prioritized,
      });
    } catch (err) {
      res.status(502).json({
        error: 'AI_PRIORITIZATION_ERROR',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal menjalankan engine prioritas penanganan AI.',
      });
    }
  }
);

// ============================================================================
// VITE DEV MIDDLEWARE / PRODUCTION STATIC SERVING
// ============================================================================

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SiFasKampus server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

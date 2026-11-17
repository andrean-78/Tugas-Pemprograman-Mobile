import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { ApiClientError, loginUser, registerUser } from '../lib/api';
import type { AuthUser, UserRole, ValidationFieldError } from '../types';

interface AuthScreenProps {
  onAuthenticated: (token: string, user: AuthUser) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Mahasiswa',
    nama: 'Budi Santoso',
    email: 'budi.santoso@kampus.ac.id',
    password: 'Mahasiswa123',
    nomor: '21041101',
  },
  {
    label: 'Dosen',
    nama: 'Dr. Ratna Wijaya',
    email: 'ratna.wijaya@kampus.ac.id',
    password: 'Dosen1234',
    nomor: '19850412',
  },
  {
    label: 'Admin Sarpras',
    nama: 'Hendra Kusuma',
    email: 'admin.sarpras@kampus.ac.id',
    password: 'Admin1234',
    nomor: '19790101',
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('budi.santoso@kampus.ac.id');
  const [loginPassword, setLoginPassword] = useState('Mahasiswa123');

  // Register state
  const [regNama, setRegNama] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNomorInduk, setRegNomorInduk] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Mahasiswa');
  const [regFakultas, setRegFakultas] = useState('Fakultas Teknik');
  const [regUnitKerja, setRegUnitKerja] = useState('Teknik Informatika');
  const [regNoHp, setRegNoHp] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Error Validation Dialog state
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    status?: number;
    title: string;
    message: string;
    details: ValidationFieldError[];
  }>({
    open: false,
    title: '',
    message: '',
    details: [],
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({
        email: loginEmail,
        password: loginPassword,
      });
      onAuthenticated(res.access_token, res.user);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setValidationDialog({
          open: true,
          status: err.status,
          title: 'Gagal Masuk ke Akun',
          message: err.message,
          details: err.details,
        });
      } else {
        setValidationDialog({
          open: true,
          title: 'Kesalahan Jaringan',
          message: 'Tidak dapat terhubung ke server autentikasi.',
          details: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser({
        nama: regNama,
        email: regEmail,
        password: regPassword,
        role: regRole,
        nomor_induk: regNomorInduk,
        fakultas: regFakultas,
        unit_kerja: regUnitKerja,
        no_hp: regNoHp,
      });
      onAuthenticated(res.access_token, res.user);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setValidationDialog({
          open: true,
          status: err.status,
          title: `Validasi Registrasi Ditolak (HTTP ${err.status})`,
          message: err.message,
          details: err.details,
        });
      } else {
        setValidationDialog({
          open: true,
          title: 'Kesalahan Jaringan',
          message: 'Tidak dapat memproses pendaftaran akun saat ini.',
          details: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setMode('login');
    setLoginEmail(acc.email);
    setLoginPassword(acc.password);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left column: Editorial campus overview + demo switcher */}
        <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white lg:col-span-6">
          <div className="relative h-64 w-full overflow-hidden bg-slate-900 sm:h-72 lg:h-80">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/campus_engineering_building_1794892131733.jpg"
                alt="Gedung Fakultas Teknik Kampus"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-300">
                <Building2 className="h-12 w-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-medium text-blue-200">
                Direktorat Sarana & Prasarana · Sistem Terintegrasi
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
                Pelaporan Fasilitas Kampus Cepat, Terukur, dan Transparan
              </h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-6">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-600">
                Pindai kode QR pada aset ruangan, unggah bukti kerusakan, pantau linimasa
                perbaikan secara langsung, dan kelola prioritas teknis dengan bantuan
                analisis Google Gemini AI.
              </p>

              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    8 Digit
                  </p>
                  <p className="text-xs text-slate-500">Validasi NIM / NIP</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    QR Aset
                  </p>
                  <p className="text-xs text-slate-500">Isi Form Otomatis</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    0–100
                  </p>
                  <p className="text-xs text-slate-500">Skor Prioritas AI</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold text-slate-700">
                Akses Cepat Akun Uji Coba
              </p>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = mode === 'login' && loginEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{acc.label}</span>
                      <span className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                        {acc.nomor}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login / Register Form */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-6">
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {mode === 'login' ? 'Masuk ke SiFasKampus' : 'Registrasi Akun Kampus'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {mode === 'login'
                    ? 'Gunakan email resmi @kampus.ac.id Anda.'
                    : 'Wajib NIM/NIP 8 digit numerik & domain @kampus.ac.id.'}
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daftar
                </button>
              </div>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email Kampus
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nama@kampus.ac.id"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="mt-5 space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Contoh: Andi Pratama"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      NIM / NIP (8 Digit Numerik)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={regNomorInduk}
                      onChange={(e) => setRegNomorInduk(e.target.value)}
                      placeholder="21041199"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Email Resmi (@kampus.ac.id)
                    </label>
                    <input
                      type="text"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="andi.pratama@kampus.ac.id"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Role Akun
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    >
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Dosen">Dosen</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Fakultas / Direktorat
                    </label>
                    <input
                      type="text"
                      value={regFakultas}
                      onChange={(e) => setRegFakultas(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Prodi / Unit Kerja
                    </label>
                    <input
                      type="text"
                      value={regUnitKerja}
                      onChange={(e) => setRegUnitKerja(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={regNoHp}
                      onChange={(e) => setRegNoHp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Password (Min. 8 Karakter)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{loading ? 'Mendaftarkan Akun...' : 'Daftarkan Akun Kampus'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              Autentikasi dilindungi JWT Bearer Token dan hashing Bcrypt di backend.
            </span>
          </div>
        </div>
      </div>

      {/* Error Validation Dialog (Module 1 Requirement) */}
      {validationDialog.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {validationDialog.title}
                  </h3>
                  {validationDialog.status && (
                    <p className="font-mono text-xs text-slate-500 tabular-nums">
                      Kode Respons: HTTP {validationDialog.status}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setValidationDialog((prev) => ({ ...prev, open: false }))
                }
                aria-label="Tutup dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-700">{validationDialog.message}</p>

            {validationDialog.details.length > 0 && (
              <ul className="mt-3 space-y-2 rounded-lg border border-red-200 bg-red-50/60 p-3.5 text-xs text-red-800">
                {validationDialog.details.map((item, idx) => (
                  <li key={`${item.field}-${idx}`} className="flex items-start gap-2">
                    <span className="font-mono font-semibold uppercase text-red-700">
                      {item.field}:
                    </span>
                    <span>{item.message}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setValidationDialog((prev) => ({ ...prev, open: false }))
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Perbaiki Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

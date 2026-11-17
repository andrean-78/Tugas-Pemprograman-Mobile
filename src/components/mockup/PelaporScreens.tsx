import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  ImageOff,
  LogOut,
  QrCode,
  X,
} from 'lucide-react';
import { ApiClientError } from '../../lib/api';
import type { ScreenId } from './screensMeta';
import type {
  AuthUser,
  Fasilitas,
  Laporan,
  Notifikasi,
  SeverityLevel,
  StatusTiket,
  TindakanPenanganan,
  UserRole,
  ValidationFieldError,
} from '../../types';

interface PelaporScreensProps {
  screen: ScreenId;
  user: AuthUser | null;
  reports: Laporan[];
  notifications: Notifikasi[];
  selectedReportDetail: {
    laporan: Laporan;
    history: StatusTiket[];
    tindakan: TindakanPenanganan | null;
  } | null;
  // Login & Register state
  loginNim: string;
  loginPassword: string;
  loginError: string | null;
  loginFieldError: string | null;
  authLoading: boolean;
  onChangeLoginNim: (v: string) => void;
  onChangeLoginPassword: (v: string) => void;
  onSubmitLogin: (e: React.FormEvent) => void;
  onSimulateLoginFailed: () => void;
  onQuickAdminLogin: () => void;
  regValues: {
    nama: string;
    nomor_induk: string;
    email: string;
    password: string;
    role: UserRole;
    fakultas: string;
    unit_kerja: string;
    no_hp: string;
  };
  regErrors: ValidationFieldError[];
  onChangeRegValues: (patch: Partial<PelaporScreensProps['regValues']>) => void;
  onSubmitRegister: (e: React.FormEvent) => void;
  onSimulateInvalidRegister: () => void;
  // Reporting Draft state
  draftPhotoUrl: string | null;
  draftAsset: Fasilitas | null;
  draftLocation: string;
  draftCategory: string;
  draftSeverity: SeverityLevel;
  draftDescription: string;
  reportSubmitting: boolean;
  reportError: string | null;
  submittedTicket: Laporan | null;
  onSelectPhotoFile: (file: File) => void;
  onSelectSamplePhoto: (url: string) => void;
  onScanQrCode: (kode: string) => void;
  onClearDraftAsset: () => void;
  onChangeDraftLocation: (v: string) => void;
  onChangeDraftCategory: (v: string) => void;
  onChangeDraftSeverity: (v: SeverityLevel) => void;
  onChangeDraftDescription: (v: string) => void;
  onSubmitReport: () => void;
  // Navigation & actions
  onNavigate: (target: ScreenId) => void;
  onOpenReportDetail: (idLaporan: string) => void;
  onLogout: () => void;
  onUpdateProfile: (payload: {
    nama: string;
    fakultas: string;
    unit_kerja: string;
    no_hp: string;
    password_lama?: string;
    password_baru?: string;
  }) => Promise<void>;
}

const KATEGORI_CHIPS = ['Kursi', 'Meja', 'Proyektor', 'Lampu / AC', 'Lainnya'];
const SEVERITY_CHIPS: SeverityLevel[] = ['Ringan', 'Sedang', 'Berat'];

function formatIndoDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

function formatShortTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getStatusPillClasses(status: Laporan['status_terkini']): string {
  switch (status) {
    case 'Diajukan':
      return 'bg-[#F59E0B] text-white';
    case 'Ditinjau Admin':
      return 'bg-[#2563EB] text-white';
    case 'Diproses':
      return 'bg-[#1D5CE5] text-white';
    case 'Selesai':
      return 'bg-[#16A34A] text-white';
    case 'Ditolak':
      return 'bg-[#DC2626] text-white';
    default:
      return 'bg-slate-600 text-white';
  }
}

export const PelaporScreens: React.FC<PelaporScreensProps> = (props) => {
  const { screen, user, reports } = props;
  const [myReportsTab, setMyReportsTab] = useState<'Semua' | 'Diproses' | 'Selesai' | 'Ditolak'>('Semua');
  const [manualQrInput, setManualQrInput] = useState('KR-A002-07');
  const [reportFormLocalError, setReportFormLocalError] = useState<string | null>(null);
  const [profileSubModal, setProfileSubModal] = useState<'edit' | 'settings' | 'help' | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [editNama, setEditNama] = useState(user?.nama || '');
  const [editFakultas, setEditFakultas] = useState(
    user?.detail?.fakultas || 'Fakultas Teknik'
  );
  const [editUnitKerja, setEditUnitKerja] = useState(user?.detail?.unit_kerja || '');
  const [editNoHp, setEditNoHp] = useState(user?.detail?.no_hp || '');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<ValidationFieldError[]>([]);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setEditNama(user.nama || '');
      setEditFakultas(user.detail?.fakultas || 'Fakultas Teknik');
      setEditUnitKerja(user.detail?.unit_kerja || '');
      setEditNoHp(user.detail?.no_hp || '');
    }
  }, [user]);

  const renderBottomNav = (active: 'home' | 'laporan' | 'profil') => (
    <div className="grid grid-cols-3 border-t border-slate-200 bg-white py-2 shrink-0">
      <button
        type="button"
        onClick={() => props.onNavigate('home')}
        className="flex flex-col items-center justify-center gap-1 py-1"
      >
        <span
          className={`h-6 w-6 rounded-md ${
            active === 'home' ? 'bg-[#1D5CE5]' : 'bg-slate-300'
          }`}
        />
        <span
          className={`text-[11px] font-semibold ${
            active === 'home' ? 'text-[#1D5CE5]' : 'text-slate-500'
          }`}
        >
          Home
        </span>
      </button>
      <button
        type="button"
        onClick={() => props.onNavigate('my-reports')}
        className="flex flex-col items-center justify-center gap-1 py-1"
      >
        <span
          className={`h-6 w-6 rounded-md ${
            active === 'laporan' ? 'bg-[#1D5CE5]' : 'bg-slate-300'
          }`}
        />
        <span
          className={`text-[11px] font-semibold ${
            active === 'laporan' ? 'text-[#1D5CE5]' : 'text-slate-500'
          }`}
        >
          Laporan
        </span>
      </button>
      <button
        type="button"
        onClick={() => props.onNavigate('profile')}
        className="flex flex-col items-center justify-center gap-1 py-1"
      >
        <span
          className={`h-6 w-6 rounded-md ${
            active === 'profil' ? 'bg-[#1D5CE5]' : 'bg-slate-300'
          }`}
        />
        <span
          className={`text-[11px] font-semibold ${
            active === 'profil' ? 'text-[#1D5CE5]' : 'text-slate-500'
          }`}
        >
          Profil
        </span>
      </button>
    </div>
  );

  const renderAppBar = (title: string, backTo?: ScreenId) => (
    <div className="flex items-center gap-3 bg-[#1E3A8A] px-4 py-3.5 text-white shrink-0">
      {backTo && (
        <button
          type="button"
          onClick={() => props.onNavigate(backTo)}
          aria-label="Kembali"
          className="rounded-lg p-1 text-white/90 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
    </div>
  );

  // SLIDE 2 & 3: LOGIN & LOGIN GAGAL
  if (screen === 'login' || screen === 'login-error') {
    const isError = screen === 'login-error' || Boolean(props.loginError);
    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
        <div className="flex min-h-full flex-col">
          <div className="my-auto py-1">
            <div className="mx-auto mb-4 h-11 w-11 shrink-0 rotate-45 rounded-lg bg-[#1D5CE5]" />
            <h2 className="text-center text-xl font-bold text-slate-900">Selamat Datang</h2>
            {!isError && (
              <p className="mt-1 text-center text-xs text-slate-500">
                Pelaporan Fasilitas Kampus
              </p>
            )}

            {isError && (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-center text-xs font-medium text-red-700">
                {props.loginError || 'NIM atau password salah. Silakan coba lagi.'}
              </div>
            )}

            <form onSubmit={props.onSubmitLogin} className="mt-5 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  NIM / Email Kampus
                </label>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  enterKeyHint="next"
                  value={props.loginNim}
                  onChange={(e) => props.onChangeLoginNim(e.target.value)}
                  placeholder="NIM 8 digit atau nama@kampus.ac.id"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D5CE5] focus:outline-none"
                />
              </div>

              <div>
                <label
                  className={`mb-1 block text-xs font-semibold ${
                    isError ? 'text-red-600' : 'text-slate-600'
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    value={props.loginPassword}
                    onChange={(e) => props.onChangeLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-base sm:text-sm text-slate-900 focus:outline-none ${
                      isError
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-300 focus:border-[#1D5CE5]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {isError && props.loginFieldError && (
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    {props.loginFieldError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={props.authLoading}
                className="mt-2 w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {props.authLoading ? 'Memverifikasi...' : 'Login'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => props.onNavigate('register')}
              className="mt-4 block w-full text-center text-xs font-semibold text-[#1D5CE5] hover:underline"
            >
              Belum punya akun? Daftar
            </button>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              <p className="font-bold text-slate-700">Akun Demo Siap Pakai (ketuk untuk isi):</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    props.onChangeLoginNim('21041101');
                    props.onChangeLoginPassword('Mahasiswa123');
                  }}
                  className="rounded-md border border-blue-200 bg-white px-2 py-1 font-semibold text-[#1D5CE5] hover:bg-blue-50"
                >
                  Mahasiswa (21041101)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.onChangeLoginNim('19850412');
                    props.onChangeLoginPassword('Dosen1234');
                  }}
                  className="rounded-md border border-teal-200 bg-white px-2 py-1 font-semibold text-teal-700 hover:bg-teal-50"
                >
                  Dosen (19850412)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.onChangeLoginNim('19790101');
                    props.onChangeLoginPassword('Admin1234');
                  }}
                  className="rounded-md border border-amber-200 bg-white px-2 py-1 font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Admin (19790101)
                </button>
              </div>
            </div>

            {screen === 'login' ? (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5 text-center">
                <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                  SIMULASI
                </p>
                <button
                  type="button"
                  onClick={props.onQuickAdminLogin}
                  disabled={props.authLoading}
                  className="block w-full text-xs font-semibold text-[#1D5CE5] hover:underline disabled:opacity-60"
                >
                  Masuk sebagai Admin
                </button>
                <button
                  type="button"
                  onClick={props.onSimulateLoginFailed}
                  disabled={props.authLoading}
                  className="block w-full text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  Kredensial salah (uji skenario gagal)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => props.onNavigate('login')}
                className="mt-4 block w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                ← Kembali ke form login awal
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 4 & 5: REGISTRASI AKUN & DATA TIDAK VALID
  if (screen === 'register' || screen === 'register-error') {
    const findErr = (field: string) =>
      props.regErrors.find((e) => e.field === field)?.message;
    const nimErr = findErr('nomor_induk');
    const emailErr = findErr('email');
    const passErr = findErr('password');
    const namaErr = findErr('nama');
    const generalErr = props.regErrors.find(
      (e) => !['nomor_induk', 'email', 'password', 'nama'].includes(e.field)
    )?.message;

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Registrasi Akun', 'login')}
        <form
          onSubmit={props.onSubmitRegister}
          className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain px-5 py-4"
        >
          {generalErr && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{generalErr}</span>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={props.regValues.nama}
              onChange={(e) => props.onChangeRegValues({ nama: e.target.value })}
              placeholder="Nama sesuai KTM"
              className={`w-full rounded-lg border px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none ${
                namaErr ? 'border-red-500' : 'border-slate-300 focus:border-[#1D5CE5]'
              }`}
            />
            {namaErr && <p className="mt-1 text-[11px] font-medium text-red-600">{namaErr}</p>}
          </div>

          <div>
            <label
              className={`mb-1 block text-xs font-semibold ${
                nimErr ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              NIM / NIP
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={props.regValues.nomor_induk}
              onChange={(e) => props.onChangeRegValues({ nomor_induk: e.target.value })}
              placeholder="Masukkan NIM (8 digit angka)"
              className={`w-full rounded-lg border px-3 py-2 font-mono text-base sm:text-sm text-slate-900 tabular-nums focus:outline-none ${
                nimErr ? 'border-red-500' : 'border-slate-300 focus:border-[#1D5CE5]'
              }`}
            />
            {nimErr && <p className="mt-1 text-[11px] font-medium text-red-600">{nimErr}</p>}
          </div>

          <div>
            <label
              className={`mb-1 block text-xs font-semibold ${
                emailErr ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              Email Kampus
            </label>
            <input
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={props.regValues.email}
              onChange={(e) => props.onChangeRegValues({ email: e.target.value })}
              placeholder="nama@kampus.ac.id"
              className={`w-full rounded-lg border px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none ${
                emailErr ? 'border-red-500' : 'border-slate-300 focus:border-[#1D5CE5]'
              }`}
            />
            {emailErr && (
              <p className="mt-1 text-[11px] font-medium text-red-600">{emailErr}</p>
            )}
          </div>

          <div>
            <label
              className={`mb-1 block text-xs font-semibold ${
                passErr ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              Password
            </label>
            <input
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={props.regValues.password}
              onChange={(e) => props.onChangeRegValues({ password: e.target.value })}
              placeholder="Minimal 8 karakter"
              className={`w-full rounded-lg border px-3 py-2 text-base sm:text-sm text-slate-900 focus:outline-none ${
                passErr ? 'border-red-500' : 'border-slate-300 focus:border-[#1D5CE5]'
              }`}
            />
            {passErr && (
              <p className="mt-1 text-[11px] font-medium text-red-600">{passErr}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Peran
            </label>
            <select
              value={props.regValues.role}
              onChange={(e) =>
                props.onChangeRegValues({ role: e.target.value as UserRole })
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
            >
              <option value="Mahasiswa">Mahasiswa</option>
              <option value="Dosen">Dosen</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Fakultas
              </label>
              <input
                type="text"
                value={props.regValues.fakultas}
                onChange={(e) => props.onChangeRegValues({ fakultas: e.target.value })}
                placeholder="Fakultas Teknik"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                No. HP
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={props.regValues.no_hp}
                onChange={(e) => props.onChangeRegValues({ no_hp: e.target.value })}
                placeholder="0812xxxxxxxx"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Program Studi / Unit Kerja
            </label>
            <input
              type="text"
              value={props.regValues.unit_kerja}
              onChange={(e) => props.onChangeRegValues({ unit_kerja: e.target.value })}
              placeholder="Teknik Informatika"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={props.authLoading}
            className="mt-2 w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {props.authLoading
              ? 'Mendaftarkan...'
              : screen === 'register-error'
              ? 'Perbaiki & Daftar'
              : 'Daftar'}
          </button>

          {screen === 'register' && (
            <button
              type="button"
              onClick={props.onSimulateInvalidRegister}
              className="block w-full pt-1 text-center text-xs font-semibold text-red-600 hover:underline"
            >
              Uji skenario: data tidak valid
            </button>
          )}
        </form>
      </div>
    );
  }

  // SLIDE 6: HOME MAHASISWA
  if (screen === 'home') {
    const latest = reports[0];
    const notifCount = props.notifications.length;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-sm font-bold text-slate-700">
                {user?.nama?.slice(0, 2).toUpperCase() || 'MH'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-slate-900">
                  Hallo {user?.nama?.split(' ')[0] || 'Mahasiswa'}
                </h2>
                <p className="text-xs text-slate-500">Apa yang ingin kamu laporkan?</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileSubModal('settings');
                  props.onNavigate('profile');
                }}
                title="Notifikasi"
                aria-label="Notifikasi"
                className="relative flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Bell className="h-4 w-4" />
                {notifCount > 0 && (
                  <span className="ml-1 rounded-full bg-[#1D5CE5] px-1.5 py-0.2 font-mono text-[10px] font-bold text-white tabular-nums">
                    {notifCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={props.onLogout}
                title="Logout"
                aria-label="Logout"
                className="whitespace-nowrap shrink-0 flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => props.onNavigate('report-photo')}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-blue-400"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1D5CE5] text-white">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Buat Laporan</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Foto kerusakan atau scan QR fasilitas
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => props.onNavigate('my-reports')}
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-emerald-400"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#16A34A] text-white">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Laporan Saya</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pantau status tiket laporanmu
                </p>
              </div>
            </button>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-slate-700">Laporan Terakhir</p>
            {latest ? (
              <button
                type="button"
                onClick={() => props.onOpenReportDetail(latest.id_laporan)}
                className="mt-2.5 flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-slate-300"
              >
                <img
                  src={latest.foto_url}
                  alt={latest.nama_fasilitas}
                  referrerPolicy="no-referrer"
                  className="h-14 w-16 shrink-0 rounded-lg bg-slate-200 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {latest.nama_fasilitas}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatIndoDate(latest.created_at)}
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold ${getStatusPillClasses(
                      latest.status_terkini
                    )}`}
                  >
                    {latest.status_terkini}
                  </span>
                </div>
              </button>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Belum ada laporan yang dibuat.
              </p>
            )}
          </div>
        </div>
        {renderBottomNav('home')}
      </div>
    );
  }

  // SLIDE 7: BUAT LAPORAN – AMBIL FOTO
  if (screen === 'report-photo') {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Buat Laporan', 'home')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full bg-[#1E3A8A] py-2 text-xs font-bold text-white"
              >
                Foto
              </button>
              <button
                type="button"
                onClick={() => props.onNavigate('report-scan-qr')}
                className="rounded-full border border-[#1E3A8A] bg-white py-2 text-xs font-bold text-[#1E3A8A]"
              >
                Scan QR
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) props.onSelectPhotoFile(file);
              }}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex h-48 w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-[#0F172A] text-white transition-opacity hover:opacity-95"
            >
              {props.draftPhotoUrl ? (
                <img
                  src={props.draftPhotoUrl}
                  alt="Foto kerusakan terpilih"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="h-7 w-7 text-slate-300" />
                  <span className="text-base font-bold">Ambil Gambar</span>
                </div>
              )}
            </button>

            <div className="mt-4">
              <p className="text-xs font-bold text-slate-700">Contoh Foto</p>
              <div className="mt-2 flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    props.onSelectSamplePhoto(
                      '/src/assets/images/damage_ac_leak_1794892131712.jpg'
                    )
                  }
                  className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200"
                  title="Klik untuk pakai foto contoh"
                >
                  <img
                    src="/src/assets/images/damage_ac_leak_1794892131712.jpg"
                    alt="Contoh foto kerusakan"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>
                <p className="text-xs leading-relaxed text-slate-500">
                  Pastikan kerusakan terlihat jelas, cahaya cukup, dan seluruh objek masuk
                  dalam frame. Ada QR di fasilitas? Pilih tab Scan QR.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => props.onNavigate('report-form')}
            className="mt-6 w-full rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  // SLIDE 8: SCAN QR FASILITAS
  if (screen === 'report-scan-qr') {
    const presetQrs = ['KR-A002-07', 'PR-B101-01', 'AC-A203-02', 'EL-C001-05'];
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Scan QR Fasilitas', 'report-photo')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => props.onNavigate('report-photo')}
                className="rounded-full border border-[#1E3A8A] bg-white py-2 text-xs font-bold text-[#1E3A8A]"
              >
                Foto
              </button>
              <button
                type="button"
                className="rounded-full bg-[#1E3A8A] py-2 text-xs font-bold text-white"
              >
                Scan QR
              </button>
            </div>

            {/* Dark Viewfinder with Cyan Corner Brackets & Red Laser Line */}
            <div className="relative mt-4 flex h-48 items-center justify-center rounded-xl bg-[#0F172A] p-5">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <span className="absolute left-0 top-0 h-5 w-5 border-l-4 border-t-4 border-cyan-400" />
                <span className="absolute right-0 top-0 h-5 w-5 border-r-4 border-t-4 border-cyan-400" />
                <span className="absolute bottom-0 left-0 h-5 w-5 border-b-4 border-l-4 border-cyan-400" />
                <span className="absolute bottom-0 right-0 h-5 w-5 border-b-4 border-r-4 border-cyan-400" />
                <QrCode className="h-20 w-20 text-white" />
                <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              Arahkan kamera ke QR Code atau pilih kode aset terdaftar
            </p>

            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={manualQrInput}
                onChange={(e) => setManualQrInput(e.target.value)}
                placeholder="Kode QR (cth: KR-A002-07)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs uppercase text-slate-900"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {presetQrs.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setManualQrInput(code)}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                    manualQrInput.toUpperCase() === code
                      ? 'border-[#1D5CE5] bg-blue-50 text-[#1D5CE5]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2.5 text-center">
            <button
              type="button"
              onClick={() => props.onScanQrCode(manualQrInput || 'KR-A002-07')}
              className="w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Simulasi: QR terbaca
            </button>
            <button
              type="button"
              onClick={() => props.onScanQrCode('QR-RUSAK-999')}
              className="block w-full text-xs font-semibold text-red-600 hover:underline"
            >
              QR tidak terbaca (uji skenario)
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('report-photo')}
              className="block w-full text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Lewati, ambil foto saja
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 9: QR TERBACA
  if (screen === 'report-qr-valid') {
    const asset = props.draftAsset;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('QR Terbaca', 'report-scan-qr')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-5">
          <div>
            <span className="inline-block rounded-full bg-[#16A34A] px-4 py-1 text-xs font-bold text-white">
              QR valid · terdaftar
            </span>

            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="text-[11px] text-slate-500">Aset</p>
                <p className="text-sm font-bold text-slate-900">
                  {asset ? `${asset.kategori} (${asset.kode_qr})` : 'Kursi (KR-A002-07)'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Lokasi</p>
                <p className="text-sm font-bold text-slate-900">
                  {asset?.lokasi_gedung || 'Ruang A002 – Gedung A'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Kategori</p>
                <p className="text-sm font-bold text-slate-900">
                  {asset?.kategori || 'Kursi'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Riwayat laporan</p>
                <p className="text-sm font-bold text-slate-900">
                  {asset?.deskripsi_aset || 'Belum ada laporan aktif'}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Lokasi dan kategori akan terisi otomatis pada formulir laporan.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => props.onNavigate('report-form')}
              className="w-full rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Gunakan Data & Lanjut
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('report-scan-qr')}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Scan Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 10: QR TIDAK DIKENALI
  if (screen === 'report-qr-invalid') {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Scan QR Fasilitas', 'report-scan-qr')}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8">
          <div className="flex min-h-full flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-red-50 text-3xl font-bold text-red-600">
              !
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900">QR Tidak Dikenali</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Kode bukan milik fasilitas kampus atau rusak. Coba scan ulang atau isi lokasi
              secara manual.
            </p>

            <div className="mt-8 w-full space-y-2.5">
              <button
                type="button"
                onClick={() => props.onNavigate('report-scan-qr')}
                className="w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Scan Ulang
              </button>
              <button
                type="button"
                onClick={() => {
                  props.onClearDraftAsset();
                  props.onNavigate('report-form');
                }}
                className="w-full rounded-xl border border-[#1D5CE5] bg-white py-3 text-sm font-bold text-[#1D5CE5] hover:bg-blue-50"
              >
                Isi Lokasi Manual
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 11: LOKASI & DESKRIPSI
  if (screen === 'report-form') {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Lokasi & Deskripsi', 'report-photo')}
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="relative h-24 w-full overflow-hidden rounded-lg bg-slate-400">
            <img
              src={
                props.draftPhotoUrl ||
                '/src/assets/images/campus_engineering_building_1794892131733.jpg'
              }
              alt="Foto kerusakan"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35">
              <span className="text-xs font-bold text-white">Foto kerusakan</span>
            </div>
          </div>

          {props.draftAsset && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              <span className="truncate font-semibold">
                QR Terhubung: <span className="font-mono">{props.draftAsset.kode_qr}</span>
              </span>
              <button
                type="button"
                onClick={props.onClearDraftAsset}
                className="whitespace-nowrap shrink-0 font-bold text-emerald-700 hover:underline"
              >
                Reset QR
              </button>
            </div>
          )}

          {(reportFormLocalError || props.reportError) && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{reportFormLocalError || props.reportError}</span>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Tambah Lokasi
              </label>
              <button
                type="button"
                onClick={() => props.onNavigate('report-scan-qr')}
                className="rounded-full bg-[#7C3AED] px-3 py-0.5 text-[11px] font-bold text-white hover:bg-purple-700"
              >
                Scan QR
              </button>
            </div>
            <input
              type="text"
              value={props.draftLocation}
              onChange={(e) => {
                props.onChangeDraftLocation(e.target.value);
                if (reportFormLocalError) setReportFormLocalError(null);
              }}
              placeholder="Ruang A002 – Gedung A"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {KATEGORI_CHIPS.map((k) => {
                const active = props.draftCategory === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => props.onChangeDraftCategory(k)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#1E3A8A] bg-white text-[#1E3A8A]'
                    }`}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Tingkat Keparahan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_CHIPS.map((s) => {
                const active = props.draftSeverity === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => props.onChangeDraftSeverity(s)}
                    className={`rounded-full border py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                        : 'border-[#1E3A8A] bg-white text-[#1E3A8A]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Deskripsi
            </label>
            <textarea
              rows={3}
              value={props.draftDescription}
              onChange={(e) => {
                props.onChangeDraftDescription(e.target.value);
                if (reportFormLocalError) setReportFormLocalError(null);
              }}
              placeholder="Sandaran kursi patah saat dipakai, berbahaya untuk mahasiswa."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-900 focus:border-[#1E3A8A] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (props.draftLocation.trim().length < 3) {
                setReportFormLocalError('Lokasi fasilitas wajib diisi (minimal 3 karakter).');
                return;
              }
              if (props.draftDescription.trim().length < 5) {
                setReportFormLocalError('Deskripsi kerusakan wajib diisi (minimal 5 karakter).');
                return;
              }
              setReportFormLocalError(null);
              props.onNavigate('report-review');
            }}
            className="w-full rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  // SLIDE 12: TINJAU LAPORAN
  if (screen === 'report-review') {
    const severityClass =
      props.draftSeverity === 'Berat'
        ? 'bg-red-600'
        : props.draftSeverity === 'Sedang'
        ? 'bg-[#F59E0B]'
        : 'bg-emerald-600';

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Tinjau Laporan', 'report-form')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div className="space-y-4">
            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-slate-400">
              <img
                src={
                  props.draftPhotoUrl ||
                  '/src/assets/images/campus_engineering_building_1794892131733.jpg'
                }
                alt="Foto kerusakan"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                <span className="text-xs font-bold text-white">Foto kerusakan</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">Lokasi</p>
              <p className="text-sm font-bold text-slate-900">{props.draftLocation}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-slate-500">Kategori</p>
                <p className="text-sm font-bold text-slate-900">{props.draftCategory}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Tingkat Keparahan</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3.5 py-0.5 text-xs font-bold text-white ${severityClass}`}
                >
                  {props.draftSeverity}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-500">Deskripsi</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-700">
                {props.draftDescription}
              </p>
            </div>

            {props.reportError && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                {props.reportError}
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-xs text-slate-700">
              Periksa kembali data laporan sebelum dikirim.
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => props.onNavigate('report-form')}
              className="rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Revisi / Edit
            </button>
            <button
              type="button"
              disabled={props.reportSubmitting}
              onClick={props.onSubmitReport}
              className="rounded-xl bg-[#16A34A] py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {props.reportSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 13: LAPORAN DIAJUKAN
  if (screen === 'report-success') {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8">
        <div className="flex min-h-full flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Laporan Diajukan</h2>
          <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
            Tiket #{props.submittedTicket?.id_laporan || 'TK-0013'}
          </p>
          <span className="mt-2.5 inline-block rounded-full bg-[#F59E0B] px-4 py-1 text-xs font-bold text-white">
            Diajukan
          </span>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Laporan tersimpan dan menunggu peninjauan admin fasilitas.
          </p>

          <div className="mt-8 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => props.onNavigate('my-reports')}
              className="w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Lihat Laporan Saya
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('home')}
              className="w-full rounded-xl border border-[#1D5CE5] bg-white py-3 text-sm font-bold text-[#1D5CE5] hover:bg-blue-50"
            >
              Kembali ke Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 14 & 15: LAPORAN SAYA & KOSONG
  if (screen === 'my-reports' || screen === 'my-reports-empty') {
    const filtered =
      screen === 'my-reports-empty'
        ? []
        : reports.filter((r) => {
            if (myReportsTab === 'Semua') return true;
            if (myReportsTab === 'Diproses') {
              return (
                r.status_terkini === 'Diajukan' ||
                r.status_terkini === 'Ditinjau Admin' ||
                r.status_terkini === 'Diproses'
              );
            }
            return r.status_terkini === myReportsTab;
          });

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Laporan Saya')}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['Semua', 'Diproses', 'Selesai', 'Ditolak'] as const).map((tab) => {
              const active = myReportsTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setMyReportsTab(tab);
                    if (screen === 'my-reports-empty') {
                      props.onNavigate('my-reports');
                    }
                  }}
                  className={`whitespace-nowrap shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                      : 'border-[#1E3A8A] bg-white text-[#1E3A8A]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-400">
                <HelpCircle className="h-9 w-9" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">
                {reports.length > 0 && screen !== 'my-reports-empty'
                  ? `Belum Ada Laporan ${myReportsTab}`
                  : 'Belum Ada Laporan'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {reports.length > 0 && screen !== 'my-reports-empty'
                  ? 'Coba pilih tab filter lainnya atau buat laporan baru.'
                  : 'Laporan yang kamu buat akan tampil di sini.'}
              </p>
              <button
                type="button"
                onClick={() => props.onNavigate('report-photo')}
                className="mt-6 w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Buat Laporan
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((item) => (
                <button
                  key={item.id_laporan}
                  type="button"
                  onClick={() => props.onOpenReportDetail(item.id_laporan)}
                  className="flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-400"
                >
                  <img
                    src={item.foto_url}
                    alt={item.nama_fasilitas}
                    referrerPolicy="no-referrer"
                    className="h-14 w-16 shrink-0 rounded-lg bg-slate-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {item.nama_fasilitas}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatIndoDate(item.created_at)}
                    </p>
                    <div className="mt-1.5 flex justify-end">
                      <span
                        className={`rounded-full px-3.5 py-0.5 text-[11px] font-bold ${getStatusPillClasses(
                          item.status_terkini
                        )}`}
                      >
                        {item.status_terkini}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => props.onNavigate('my-reports-empty')}
                className="block w-full pt-2 text-center text-xs font-semibold text-red-600 hover:underline"
              >
                Uji skenario: belum ada laporan
              </button>
            </div>
          )}
        </div>
        {renderBottomNav('laporan')}
      </div>
    );
  }

  // SLIDE 16: DETAIL LAPORAN & TIMELINE
  if (screen === 'report-detail') {
    const detail = props.selectedReportDetail;
    const laporan = detail?.laporan;
    const history = detail?.history ?? [];
    const steps: Array<{
      label: 'Diajukan' | 'Ditinjau Admin' | 'Diproses' | 'Selesai' | 'Ditolak';
      dotClass: string;
    }> = [
      { label: 'Diajukan', dotClass: 'bg-[#16A34A]' },
      { label: 'Ditinjau Admin', dotClass: 'bg-[#1D5CE5]' },
      { label: 'Diproses', dotClass: 'bg-amber-500' },
      { label: 'Selesai', dotClass: 'bg-[#16A34A]' },
    ];
    const latestNote =
      history[history.length - 1]?.catatan_petugas ||
      'Belum ada catatan. Admin akan meninjau laporanmu.';

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Detail Laporan', 'my-reports')}
        {!laporan ? (
          <div className="flex flex-1 items-center justify-center p-6 text-xs text-slate-500">
            Memuat detail laporan...
          </div>
        ) : (
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-slate-300">
              <img
                src={laporan.foto_url}
                alt={laporan.nama_fasilitas}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="h-full w-full object-cover"
              />
              <div className="flex h-full w-full items-center justify-center text-slate-500">
                <ImageOff className="h-5 w-5" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {laporan.nama_fasilitas}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                Dilaporkan {formatIndoDate(laporan.created_at)} · Tiket #
                {laporan.id_laporan}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-3.5 py-0.5 text-xs font-bold ${getStatusPillClasses(
                  laporan.status_terkini
                )}`}
              >
                {laporan.status_terkini}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">Timeline Status</p>
              <div className="mt-3 space-y-3.5">
                {steps.map((s) => {
                  const matched = history.find((h) => h.status === s.label);
                  const rejectedEntry =
                    s.label === 'Diproses'
                      ? history.find((h) => h.status === 'Ditolak')
                      : undefined;
                  const activeEntry = matched || rejectedEntry;
                  return (
                    <div key={s.label} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-4 w-4 shrink-0 rounded-full ${
                          rejectedEntry
                            ? 'bg-red-600'
                            : matched
                            ? s.dotClass
                            : 'bg-slate-200'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {rejectedEntry ? 'Ditolak' : s.label}
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {activeEntry
                            ? formatShortTime(activeEntry.timestamp)
                            : s.label === 'Ditinjau Admin' &&
                              laporan.status_terkini === 'Diajukan'
                            ? 'Menunggu peninjauan'
                            : '–'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">Catatan Petugas</p>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600">
                {detail?.tindakan?.alasan_penolakan
                  ? `Alasan Penolakan: ${detail.tindakan.alasan_penolakan}`
                  : latestNote}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // SLIDE 17: PROFIL SAYA
  const isAdminUser = user?.role === 'Admin';
  const getProfileFieldErr = (field: string) =>
    profileFieldErrors.find((e) => e.field === field)?.message;

  const openEditProfile = () => {
    setEditNama(user?.nama || '');
    setEditFakultas(user?.detail?.fakultas || 'Fakultas Teknik');
    setEditUnitKerja(user?.detail?.unit_kerja || '');
    setEditNoHp(user?.detail?.no_hp === '-' ? '' : user?.detail?.no_hp || '');
    setPasswordLama('');
    setPasswordBaru('');
    setShowPasswordFields(false);
    setProfileError(null);
    setProfileFieldErrors([]);
    setProfileSuccess(null);
    setProfileSubModal('edit');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileFieldErrors([]);
    setProfileSuccess(null);
    try {
      await props.onUpdateProfile({
        nama: editNama.trim(),
        fakultas: editFakultas.trim(),
        unit_kerja: editUnitKerja.trim(),
        no_hp: editNoHp.trim() || '-',
        ...(showPasswordFields && passwordBaru.trim().length > 0
          ? {
              password_lama: passwordLama,
              password_baru: passwordBaru,
            }
          : {}),
      });
      setPasswordLama('');
      setPasswordBaru('');
      setShowPasswordFields(false);
      setProfileSubModal(null);
      setProfileSuccess('Profil berhasil diperbarui.');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setProfileError(err.message);
        setProfileFieldErrors(err.details || []);
      } else {
        setProfileError('Gagal memperbarui profil. Silakan coba lagi.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden">
      {renderAppBar('Profil Saya', isAdminUser ? 'admin-dashboard' : undefined)}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-base font-bold text-slate-700">
            {user?.nama?.slice(0, 2).toUpperCase() || 'PG'}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">
              {user?.nama || 'Pengguna'}
            </h3>
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              {user?.nomor_induk || '12345678'} · {user?.role}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {user?.email || 'pengguna@kampus.ac.id'}
            </p>
          </div>
        </div>

        {/* Detail Akun Ringkas */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Fakultas</span>
            <span className="text-right font-semibold text-slate-800">
              {user?.detail?.fakultas || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Prodi / Unit</span>
            <span className="text-right font-semibold text-slate-800">
              {user?.detail?.unit_kerja || '-'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">No. HP</span>
            <span className="text-right font-mono font-semibold text-slate-800 tabular-nums">
              {user?.detail?.no_hp || '-'}
            </span>
          </div>
        </div>

        {profileSuccess && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setProfileSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {profileSubModal ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">
                {profileSubModal === 'edit'
                  ? 'Edit Profil Akun'
                  : profileSubModal === 'settings'
                  ? 'Riwayat Notifikasi Push (FCM)'
                  : 'Pusat Bantuan Pelaporan'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setProfileSubModal(null);
                  setProfileError(null);
                  setProfileFieldErrors([]);
                }}
                aria-label="Tutup panel"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {profileSubModal === 'edit' && (
              <form onSubmit={handleSaveProfile} className="mt-3 space-y-3">
                {profileError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[11px] font-medium text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    placeholder="Minimal 3 karakter"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none ${
                      getProfileFieldErr('nama')
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-[#1D5CE5]'
                    }`}
                  />
                  {getProfileFieldErr('nama') && (
                    <p className="mt-1 text-[10px] text-red-600">
                      {getProfileFieldErr('nama')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Fakultas / Unit Utama
                  </label>
                  <input
                    type="text"
                    value={editFakultas}
                    onChange={(e) => setEditFakultas(e.target.value)}
                    placeholder="Contoh: Fakultas Teknik"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none ${
                      getProfileFieldErr('fakultas')
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-[#1D5CE5]'
                    }`}
                  />
                  {getProfileFieldErr('fakultas') && (
                    <p className="mt-1 text-[10px] text-red-600">
                      {getProfileFieldErr('fakultas')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Program Studi / Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={editUnitKerja}
                    onChange={(e) => setEditUnitKerja(e.target.value)}
                    placeholder="Contoh: Teknik Informatika"
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none ${
                      getProfileFieldErr('unit_kerja')
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-[#1D5CE5]'
                    }`}
                  />
                  {getProfileFieldErr('unit_kerja') && (
                    <p className="mt-1 text-[10px] text-red-600">
                      {getProfileFieldErr('unit_kerja')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={editNoHp}
                    onChange={(e) => setEditNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none ${
                      getProfileFieldErr('no_hp')
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-[#1D5CE5]'
                    }`}
                  />
                  {getProfileFieldErr('no_hp') && (
                    <p className="mt-1 text-[10px] text-red-600">
                      {getProfileFieldErr('no_hp')}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Keamanan Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields((v) => !v)}
                      className="text-[11px] font-bold text-[#1D5CE5] hover:underline"
                    >
                      {showPasswordFields ? 'Tutup' : 'Ubah Password'}
                    </button>
                  </div>
                  {showPasswordFields && (
                    <div className="mt-2.5 space-y-2">
                      <div>
                        <input
                          type="password"
                          value={passwordLama}
                          onChange={(e) => setPasswordLama(e.target.value)}
                          placeholder="Password saat ini"
                          className={`w-full rounded-lg border bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none ${
                            getProfileFieldErr('password_lama')
                              ? 'border-red-500'
                              : 'border-slate-300 focus:border-[#1D5CE5]'
                          }`}
                        />
                        {getProfileFieldErr('password_lama') && (
                          <p className="mt-0.5 text-[10px] text-red-600">
                            {getProfileFieldErr('password_lama')}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          type="password"
                          value={passwordBaru}
                          onChange={(e) => setPasswordBaru(e.target.value)}
                          placeholder="Password baru (min. 8 karakter)"
                          className={`w-full rounded-lg border bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none ${
                            getProfileFieldErr('password_baru')
                              ? 'border-red-500'
                              : 'border-slate-300 focus:border-[#1D5CE5]'
                          }`}
                        />
                        {getProfileFieldErr('password_baru') && (
                          <p className="mt-0.5 text-[10px] text-red-600">
                            {getProfileFieldErr('password_baru')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setProfileSubModal(null)}
                    className="rounded-lg border border-slate-300 bg-white py-2 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-[#1D5CE5] py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}

            {profileSubModal === 'settings' && (
              <div className="mt-2.5 space-y-2 max-h-52 overflow-y-auto">
                {props.notifications.length === 0 ? (
                  <p className="text-slate-500">Belum ada notifikasi FCM masuk.</p>
                ) : (
                  props.notifications.map((n) => (
                    <div
                      key={n.id_notif}
                      className="rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      <p className="font-semibold text-slate-900">{n.judul}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600">{n.pesan}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileSubModal === 'help' && (
              <p className="mt-2.5 leading-relaxed text-slate-600">
                Hubungi Direktorat Sarana & Prasarana di Gedung Rektorat Lt. 1 atau
                gunakan kode QR pada aset ruangan (contoh: KR-A002-07) untuk pelaporan
                otomatis.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={openEditProfile}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Edit Profil
            </button>
            <button
              type="button"
              onClick={() => setProfileSubModal('settings')}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Pengaturan & Notifikasi ({props.notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setProfileSubModal('help')}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-center text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              Bantuan
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={props.onLogout}
          className="mt-5 w-full rounded-xl border border-red-400 bg-white py-3 text-center text-xs font-bold text-red-600 hover:bg-red-50"
        >
          Logout
        </button>
      </div>
      {isAdminUser ? (
        <div className="border-t border-slate-200 bg-white p-3 shrink-0">
          <button
            type="button"
            onClick={() => props.onNavigate('admin-dashboard')}
            className="w-full rounded-xl bg-[#1E3A8A] py-2.5 text-xs font-bold text-white hover:bg-blue-900"
          >
            Kembali ke Dashboard Admin
          </button>
        </div>
      ) : (
        renderBottomNav('profil')
      )}
    </div>
  );
};

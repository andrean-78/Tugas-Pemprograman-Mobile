import React, { useEffect, useState } from 'react';
import { Home, LogOut } from 'lucide-react';
import {
  ApiClientError,
  fetchAdminReports,
  fetchCurrentUser,
  fetchReportHistory,
  fetchUserNotifications,
  fetchUserReports,
  generateAiExecutiveSummary,
  getStoredToken,
  loginUser,
  lookupFacilityByQr,
  registerUser,
  runAiPrioritization,
  setStoredToken,
  submitDamageReport,
  updateProfile,
  updateReportStatusByAdmin,
} from './lib/api';
import { NavigationMapView } from './components/mockup/NavigationMapView';
import { PelaporScreens } from './components/mockup/PelaporScreens';
import { AdminScreens } from './components/mockup/AdminScreens';
import { DeviceFrame, type DeviceOs } from './components/mockup/DeviceFrame';
import { SCREEN_META, type ScreenId } from './components/mockup/screensMeta';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import type {
  AdminDashboardStats,
  AuthUser,
  ExecutiveSummaryResult,
  Fasilitas,
  Laporan,
  Notifikasi,
  PrioritizedTicketResult,
  SeverityLevel,
  StatusTiket,
  TechnicalAction,
  TicketStatus,
  TindakanPenanganan,
  UserRole,
  ValidationFieldError,
} from './types';

const ADMIN_SCREENS = new Set<ScreenId>([
  'admin-dashboard',
  'admin-reports',
  'admin-detail',
  'admin-action',
  'admin-reject',
  'admin-updated',
  'admin-ai-summary-filter',
  'admin-ai-summary-result',
  'admin-ai-summary-empty',
  'admin-ai-priority-intro',
  'admin-ai-priority-result',
  'admin-ai-priority-empty',
]);

export default function App() {
  const [navState, setNavState] = useState<{
    screen: ScreenId;
    history: ScreenId[];
  }>({ screen: 'login', history: [] });
  const screen = navState.screen;
  const setScreen = (next: ScreenId) => {
    setNavState((prev) => {
      if (prev.screen === next) return prev;
      const nextHistory =
        prev.screen === 'map'
          ? prev.history
          : [...prev.history.slice(-19), prev.screen];
      return { screen: next, history: nextHistory };
    });
  };

  const [deviceOs, setDeviceOs] = useState<DeviceOs>('ios');
  const [forceFullScreen, setForceFullScreen] = useState(false);
  const { isInstalled: isStandalonePwa } = usePWAInstall();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Auth form states
  const [loginNim, setLoginNim] = useState('21041101');
  const [loginPassword, setLoginPassword] = useState('Mahasiswa123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginFieldError, setLoginFieldError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [regValues, setRegValues] = useState<{
    nama: string;
    nomor_induk: string;
    email: string;
    password: string;
    role: UserRole;
    fakultas: string;
    unit_kerja: string;
    no_hp: string;
  }>({
    nama: '',
    nomor_induk: '',
    email: '',
    password: '',
    role: 'Mahasiswa',
    fakultas: 'Fakultas Teknik',
    unit_kerja: 'Teknik Informatika',
    no_hp: '',
  });
  const [regErrors, setRegErrors] = useState<ValidationFieldError[]>([]);

  // Pelapor data & reporting draft
  const [userReports, setUserReports] = useState<Laporan[]>([]);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  const [selectedReportDetail, setSelectedReportDetail] = useState<{
    laporan: Laporan;
    history: StatusTiket[];
    tindakan: TindakanPenanganan | null;
  } | null>(null);

  const [draftPhotoFile, setDraftPhotoFile] = useState<File | null>(null);
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string | null>(null);
  const [draftSampleUrl, setDraftSampleUrl] = useState<string>('');
  const [draftAsset, setDraftAsset] = useState<Fasilitas | null>(null);
  const [draftLocation, setDraftLocation] = useState('Ruang A002 – Gedung A');
  const [draftCategory, setDraftCategory] = useState('Kursi');
  const [draftSeverity, setDraftSeverity] = useState<SeverityLevel>('Sedang');
  const [draftDescription, setDraftDescription] = useState(
    'Sandaran kursi patah saat dipakai, berbahaya untuk mahasiswa.'
  );
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<Laporan | null>(null);

  // Admin data & AI state
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [adminReports, setAdminReports] = useState<Laporan[]>([]);
  const [selectedAdminReport, setSelectedAdminReport] = useState<Laporan | null>(
    null
  );
  const [lastUpdatedTicket, setLastUpdatedTicket] = useState<{
    id: string;
    status: TicketStatus;
  } | null>(null);
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<ExecutiveSummaryResult | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  const [aiPriorities, setAiPriorities] = useState<PrioritizedTicketResult[]>([]);
  const [aiPriorityLoading, setAiPriorityLoading] = useState(false);
  const [aiPriorityError, setAiPriorityError] = useState<string | null>(null);

  const loadRoleData = async (authedUser: AuthUser) => {
    try {
      const [notifRes, myRes] = await Promise.all([
        fetchUserNotifications(authedUser.id_user),
        fetchUserReports(authedUser.id_user),
      ]);
      setNotifications(notifRes.data);
      setUserReports(myRes.data);

      if (authedUser.role === 'Admin') {
        const adm = await fetchAdminReports();
        setAdminStats(adm.stats);
        setAdminReports(adm.data);
        if (adm.latest_summary) setAiSummary(adm.latest_summary);
        if (adm.cached_prioritizations.length > 0) {
          setAiPriorities(adm.cached_prioritizations);
        }
      }
    } catch {
      // Ignore transient fetch errors on initial load
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    fetchCurrentUser()
      .then(async (res) => {
        setUser(res.user);
        await loadRoleData(res.user);
        setScreen(res.user.role === 'Admin' ? 'admin-dashboard' : 'home');
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setLoginError(null);
    setLoginFieldError(null);
    try {
      const res = await loginUser({
        identifier: loginNim.trim(),
        password: loginPassword,
      });
      setStoredToken(res.access_token);
      setUser(res.user);
      await loadRoleData(res.user);
      setScreen(res.user.role === 'Admin' ? 'admin-dashboard' : 'home');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoginError(err.message);
        setLoginFieldError(
          err.details[0]?.message ||
            (err.code === 'NETWORK_ERROR' || err.code === 'PROXY_AUTH_REQUIRED'
              ? null
              : 'Periksa kembali NIM/Email dan password Anda.')
        );
      } else {
        setLoginError(
          err instanceof Error && err.message
            ? err.message
            : 'Gagal melakukan login. Silakan coba lagi.'
        );
        setLoginFieldError(null);
      }
      setScreen('login-error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimulateLoginFailed = async () => {
    setLoginNim('12345678');
    setLoginPassword('0000');
    setAuthLoading(true);
    try {
      await loginUser({ identifier: '12345678', password: '0000' });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoginError(err.message);
        setLoginFieldError(err.details[0]?.message || 'Password tidak cocok');
      }
      setScreen('login-error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLoginRole = async (
    targetRole: 'Mahasiswa' | 'Admin',
    targetScreen: ScreenId
  ) => {
    setAuthLoading(true);
    setLoginError(null);
    setLoginFieldError(null);
    try {
      const creds =
        targetRole === 'Admin'
          ? { identifier: '19790101', password: 'Admin1234' }
          : { identifier: '21041101', password: 'Mahasiswa123' };
      const res = await loginUser(creds);
      setStoredToken(res.access_token);
      setUser(res.user);
      await loadRoleData(res.user);
      setScreen(targetScreen);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoginError(err.message);
      } else {
        setLoginError('Gagal masuk otomatis. Periksa koneksi server dan muat ulang.');
      }
      setScreen('login-error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setRegErrors([]);
    try {
      const res = await registerUser({
        ...regValues,
        fakultas: regValues.fakultas.trim() || 'Fakultas Teknik',
        unit_kerja: regValues.unit_kerja.trim() || 'Program Studi',
        no_hp: regValues.no_hp.trim() || '-',
      });
      setStoredToken(res.access_token);
      setUser(res.user);
      await loadRoleData(res.user);
      setScreen(res.user.role === 'Admin' ? 'admin-dashboard' : 'home');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setRegErrors(
          err.details.length > 0
            ? err.details
            : [{ field: 'email', message: err.message }]
        );
      } else {
        setRegErrors([
          {
            field: 'general',
            message:
              'Tidak dapat menghubungi server saat registrasi. Periksa koneksi Anda.',
          },
        ]);
      }
      setScreen('register-error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimulateInvalidRegister = async () => {
    const invalidPayload = {
      nama: 'Andrean',
      nomor_induk: '1234',
      email: 'andrean@kampus.ac.id',
      password: '123',
      role: 'Mahasiswa' as UserRole,
      fakultas: 'Fakultas Teknik',
      unit_kerja: 'Teknik Informatika',
      no_hp: '-',
    };
    setRegValues(invalidPayload);
    setAuthLoading(true);
    try {
      await registerUser(invalidPayload);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setRegErrors(err.details);
        setScreen('register-error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleScanQrCode = async (kode: string) => {
    try {
      const res = await lookupFacilityByQr(kode);
      setDraftAsset(res.data);
      setDraftLocation(res.data.lokasi_gedung);
      setDraftCategory(res.data.kategori);
      setScreen('report-qr-valid');
    } catch {
      setDraftAsset(null);
      setScreen('report-qr-invalid');
    }
  };

  const handleSubmitReport = async () => {
    setReportSubmitting(true);
    setReportError(null);
    try {
      const fd = new FormData();
      fd.append('kode_qr', draftAsset?.kode_qr || 'MANUAL-INPUT');
      fd.append(
        'nama_fasilitas',
        draftAsset?.nama_fasilitas ||
          `${draftCategory} - ${draftLocation.split('–')[0].trim()}`
      );
      fd.append('lokasi_gedung', draftLocation);
      fd.append('kategori', draftCategory);
      fd.append('keparahan', draftSeverity);
      fd.append('deskripsi', draftDescription);
      if (draftPhotoFile) {
        fd.append('foto', draftPhotoFile);
      } else if (draftSampleUrl) {
        fd.append('fallback_foto_url', draftSampleUrl);
      }

      const res = await submitDamageReport(fd);
      setSubmittedTicket(res.data);
      setDraftPhotoFile(null);
      setDraftSampleUrl('');
      setDraftPhotoUrl(null);
      setDraftAsset(null);
      if (user) {
        await loadRoleData(user);
      }
      setScreen('report-success');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setReportError(err.details[0]?.message || err.message);
      } else {
        setReportError('Gagal mengirim laporan kerusakan.');
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenReportDetail = async (idLaporan: string) => {
    setSelectedReportDetail(null);
    setScreen('report-detail');
    try {
      const res = await fetchReportHistory(idLaporan);
      setSelectedReportDetail(res);
    } catch {
      // Keep loading fallback
    }
  };

  const handleApproveReport = async (payload: {
    id_laporan: string;
    jenis_tindakan: TechnicalAction;
    status_baru: TicketStatus;
    catatan_petugas: string;
  }) => {
    setAdminSubmitting(true);
    setAdminActionError(null);
    try {
      const res = await updateReportStatusByAdmin(payload.id_laporan, {
        keputusan: 'Layak',
        jenis_tindakan: payload.jenis_tindakan,
        status_baru: payload.status_baru,
        catatan_petugas: payload.catatan_petugas,
      });
      setLastUpdatedTicket({
        id: res.laporan.id_laporan,
        status: res.laporan.status_terkini,
      });
      if (user) await loadRoleData(user);
      setScreen('admin-updated');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setAdminActionError(err.message);
      }
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleRejectReport = async (payload: {
    id_laporan: string;
    alasan_penolakan: string;
  }) => {
    setAdminSubmitting(true);
    setAdminActionError(null);
    try {
      const res = await updateReportStatusByAdmin(payload.id_laporan, {
        keputusan: 'Ditolak',
        alasan_penolakan: payload.alasan_penolakan,
      });
      setLastUpdatedTicket({
        id: res.laporan.id_laporan,
        status: res.laporan.status_terkini,
      });
      if (user) await loadRoleData(user);
      setScreen('admin-updated');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setAdminActionError(err.message);
      }
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleGenerateAiSummary = async (filters: {
    periode: string;
    gedung: string;
    kategori: string;
  }) => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const res = await generateAiExecutiveSummary(filters);
      setAiSummary(res.data);
      setScreen('admin-ai-summary-result');
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'EMPTY_DATASET') {
          setScreen('admin-ai-summary-empty');
        } else {
          setAiSummaryError(err.message);
        }
      } else {
        setAiSummaryError('Gagal menghubungi layanan Google Gemini AI.');
      }
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleRunAiPrioritization = async () => {
    setAiPriorityLoading(true);
    setAiPriorityError(null);
    try {
      const res = await runAiPrioritization();
      if (res.data.length === 0) {
        setScreen('admin-ai-priority-empty');
      } else {
        setAiPriorities(res.data);
        setScreen('admin-ai-priority-result');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setAiPriorityError(err.message);
      } else {
        setAiPriorityError('Gagal menjalankan Engine Prioritasi AI.');
      }
    } finally {
      setAiPriorityLoading(false);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setLoginError(null);
    setLoginFieldError(null);
    setNavState({ screen: 'login', history: [] });
  };

  const handleSystemBack = () => {
    setNavState((prev) => {
      if (prev.history.length > 0) {
        const previousScreen = prev.history[prev.history.length - 1];
        return {
          screen: previousScreen,
          history: prev.history.slice(0, -1),
        };
      }
      const fallback: ScreenId = !user
        ? 'login'
        : user.role === 'Admin'
          ? 'admin-dashboard'
          : 'home';
      return { screen: fallback, history: [] };
    });
  };

  const handleSystemHome = () => {
    const target: ScreenId = !user
      ? 'login'
      : user.role === 'Admin'
        ? 'admin-dashboard'
        : 'home';
    setNavState({ screen: target, history: [] });
  };

  const handleSelectFlowFromMap = async (
    targetScreen: ScreenId,
    preferredRole?: 'Mahasiswa' | 'Admin'
  ) => {
    if (targetScreen === 'login') {
      setScreen('login');
      return;
    }
    if (preferredRole === 'Admin' && user?.role !== 'Admin') {
      await handleQuickLoginRole('Admin', targetScreen);
      return;
    }
    if (preferredRole === 'Mahasiswa' && !user) {
      await handleQuickLoginRole('Mahasiswa', targetScreen);
      return;
    }
    if (!user && ADMIN_SCREENS.has(targetScreen)) {
      await handleQuickLoginRole('Admin', targetScreen);
      return;
    }
    if (!user) {
      await handleQuickLoginRole('Mahasiswa', targetScreen);
      return;
    }
    setScreen(targetScreen);
  };

  const navigateWithRoleGuard = (target: ScreenId) => {
    if (target === 'login') {
      setLoginError(null);
      setLoginFieldError(null);
    }
    if (target === 'register') {
      setRegErrors([]);
    }
    setScreen(target);
  };

  if (screen === 'map') {
    return (
      <div className="min-h-screen bg-[#0A1628] text-white">
        <OfflineIndicator />
        <NavigationMapView onSelectFlow={handleSelectFlowFromMap} />
      </div>
    );
  }

  const meta = SCREEN_META[screen];
  const isAdminScreen = ADMIN_SCREENS.has(screen);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white px-4 py-4 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
        {/* Left Presentation Context Panel (Desktop, Matches Slides 2-29) */}
        <div className="hidden lg:flex lg:col-span-6 lg:flex-col lg:justify-between lg:min-h-[680px]">
          <div>
            <span
              className="inline-block rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-white"
              style={{ backgroundColor: meta.badgeColor }}
            >
              {meta.diagramLabel}
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              {meta.title}
            </h1>
            <p className="mt-2 text-sm text-slate-300">Aktor: {meta.actor}</p>

            <div className="mt-6">
              <p className="text-[11px] font-bold tracking-[0.16em] text-blue-400">
                AKTIVITAS PADA DIAGRAM
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                {meta.activity}
              </p>
            </div>

            <div className="my-7 border-t border-slate-700/80" />

            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-blue-400">
                AKSES CEPAT ALUR & SIMULASI
              </p>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLoginRole('Mahasiswa', 'home')}
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-blue-300 hover:border-blue-500"
                  >
                    Home Mahasiswa
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLoginRole('Mahasiswa', 'report-photo')
                    }
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-purple-300 hover:border-purple-500"
                  >
                    Buat Laporan & QR
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLoginRole('Mahasiswa', 'my-reports')
                    }
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-teal-300 hover:border-teal-500"
                  >
                    Laporan Saya
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLoginRole('Admin', 'admin-dashboard')
                    }
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-amber-300 hover:border-amber-500"
                  >
                    Dashboard Admin
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLoginRole('Admin', 'admin-ai-summary-filter')
                    }
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-fuchsia-300 hover:border-fuchsia-500"
                  >
                    Rangkuman AI
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickLoginRole('Admin', 'admin-ai-priority-intro')
                    }
                    className="rounded-lg border border-slate-700 bg-[#10203A] px-3 py-1.5 font-semibold text-orange-300 hover:border-orange-500"
                  >
                    Prioritas AI
                  </button>
                </div>
              </div>

              {user && (
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Sesi aktif:{' '}
                    <span className="font-semibold text-white">{user.nama}</span> (
                    {user.role} · <span className="font-mono">{user.nomor_induk}</span>)
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2.5 py-1 font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setScreen('map')}
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-[#10203A] px-5 py-2.5 text-xs font-semibold text-blue-400 transition-colors hover:border-blue-500 hover:text-blue-300"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Peta Navigasi</span>
              </button>
              <PWAInstallButton />
            </div>

            <span className="font-mono text-xs text-slate-400 tabular-nums">
              Slide {meta.slide} / 29
            </span>
          </div>
        </div>

        {/* Right Smartphone Frame (Realistic iPhone iOS / Android OS Device Preview) */}
        <div className="flex w-full flex-col items-center lg:col-span-6">
          <OfflineIndicator />
          {/* Compact top helper bar on < lg to reach Peta Navigasi & Install */}
          <div className="mb-2 flex w-full max-w-[375px] items-center justify-between gap-2 text-xs text-slate-300 lg:hidden">
            <span className="truncate font-semibold text-white">SiFasKampus</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <PWAInstallButton compact />
              <button
                type="button"
                onClick={() => setScreen('map')}
                className="whitespace-nowrap shrink-0 rounded-full border border-slate-700 bg-[#10203A] px-3 py-1 font-semibold text-blue-400 hover:border-blue-500"
              >
                Peta Navigasi
              </button>
            </div>
          </div>

          <DeviceFrame
            os={deviceOs}
            onChangeOs={setDeviceOs}
            isFullScreen={forceFullScreen}
            isStandalone={isStandalonePwa}
            onToggleFullScreen={() => setForceFullScreen((v) => !v)}
            onSystemBack={handleSystemBack}
            onSystemHome={handleSystemHome}
            onSystemOverview={() => setScreen('map')}
          >
            {authChecking ? (
              <div className="flex flex-1 items-center justify-center p-8 text-xs text-slate-500">
                Memuat sesi aplikasi...
              </div>
            ) : isAdminScreen ? (
              <AdminScreens
                screen={screen}
                stats={adminStats}
                reports={adminReports}
                selectedReport={selectedAdminReport}
                lastUpdatedTicket={lastUpdatedTicket}
                aiSummary={aiSummary}
                aiSummaryLoading={aiSummaryLoading}
                aiSummaryError={aiSummaryError}
                aiPriorities={aiPriorities}
                aiPriorityLoading={aiPriorityLoading}
                aiPriorityError={aiPriorityError}
                adminSubmitting={adminSubmitting}
                adminActionError={adminActionError}
                onNavigate={navigateWithRoleGuard}
                onSelectAdminReport={(r) => {
                  setSelectedAdminReport(r);
                  setScreen('admin-detail');
                }}
                onApproveReport={handleApproveReport}
                onRejectReport={handleRejectReport}
                onGenerateAiSummary={handleGenerateAiSummary}
                onRunAiPrioritization={handleRunAiPrioritization}
                onLogout={handleLogout}
              />
            ) : (
              <PelaporScreens
                screen={screen}
                user={user}
                reports={userReports}
                notifications={notifications}
                selectedReportDetail={selectedReportDetail}
                loginNim={loginNim}
                loginPassword={loginPassword}
                loginError={loginError}
                loginFieldError={loginFieldError}
                authLoading={authLoading}
                onChangeLoginNim={setLoginNim}
                onChangeLoginPassword={setLoginPassword}
                onSubmitLogin={handleLoginSubmit}
                onSimulateLoginFailed={handleSimulateLoginFailed}
                onQuickAdminLogin={() =>
                  handleQuickLoginRole('Admin', 'admin-dashboard')
                }
                regValues={regValues}
                regErrors={regErrors}
                onChangeRegValues={(patch) =>
                  setRegValues((prev) => ({ ...prev, ...patch }))
                }
                onSubmitRegister={handleRegisterSubmit}
                onSimulateInvalidRegister={handleSimulateInvalidRegister}
                draftPhotoUrl={draftPhotoUrl}
                draftAsset={draftAsset}
                draftLocation={draftLocation}
                draftCategory={draftCategory}
                draftSeverity={draftSeverity}
                draftDescription={draftDescription}
                reportSubmitting={reportSubmitting}
                reportError={reportError}
                submittedTicket={submittedTicket}
                onSelectPhotoFile={(file) => {
                  setDraftPhotoFile(file);
                  setDraftSampleUrl('');
                  setDraftPhotoUrl(URL.createObjectURL(file));
                }}
                onSelectSamplePhoto={(url) => {
                  setDraftPhotoFile(null);
                  setDraftSampleUrl(url);
                  setDraftPhotoUrl(url);
                }}
                onScanQrCode={handleScanQrCode}
                onClearDraftAsset={() => setDraftAsset(null)}
                onChangeDraftLocation={setDraftLocation}
                onChangeDraftCategory={setDraftCategory}
                onChangeDraftSeverity={setDraftSeverity}
                onChangeDraftDescription={setDraftDescription}
                onSubmitReport={handleSubmitReport}
                onNavigate={navigateWithRoleGuard}
                onOpenReportDetail={handleOpenReportDetail}
                onLogout={handleLogout}
                onUpdateProfile={async (payload) => {
                  const res = await updateProfile(payload);
                  setUser(res.user);
                  await loadRoleData(res.user);
                }}
              />
            )}
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

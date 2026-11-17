import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  HelpCircle,
  ImageOff,
  LogOut,
  User,
} from 'lucide-react';
import type { ScreenId } from './screensMeta';
import type {
  AdminDashboardStats,
  ExecutiveSummaryResult,
  Laporan,
  PrioritizedTicketResult,
  TechnicalAction,
  TicketStatus,
} from '../../types';

interface AdminScreensProps {
  screen: ScreenId;
  stats: AdminDashboardStats | null;
  reports: Laporan[];
  selectedReport: Laporan | null;
  lastUpdatedTicket: { id: string; status: TicketStatus } | null;
  aiSummary: ExecutiveSummaryResult | null;
  aiSummaryLoading: boolean;
  aiSummaryError: string | null;
  aiPriorities: PrioritizedTicketResult[];
  aiPriorityLoading: boolean;
  aiPriorityError: string | null;
  adminSubmitting: boolean;
  adminActionError: string | null;
  onNavigate: (target: ScreenId) => void;
  onSelectAdminReport: (report: Laporan) => void;
  onApproveReport: (payload: {
    id_laporan: string;
    jenis_tindakan: TechnicalAction;
    status_baru: TicketStatus;
    catatan_petugas: string;
  }) => void;
  onRejectReport: (payload: {
    id_laporan: string;
    alasan_penolakan: string;
  }) => void;
  onGenerateAiSummary: (filters: {
    periode: string;
    gedung: string;
    kategori: string;
  }) => void;
  onRunAiPrioritization: () => void;
  onLogout: () => void;
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function getStatusPillClass(status: TicketStatus): string {
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

export const AdminScreens: React.FC<AdminScreensProps> = (props) => {
  const { screen, stats, reports, selectedReport } = props;
  const [adminListFilter, setAdminListFilter] = useState<
    'Semua' | 'Diajukan' | 'Diproses' | 'Selesai' | 'Ditolak'
  >('Semua');
  const [aksiTeknis, setAksiTeknis] = useState<TechnicalAction>('Perbaiki');
  const [statusTiket, setStatusTiket] = useState<TicketStatus>('Diproses');
  const [catatanTeknis, setCatatanTeknis] = useState('');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [rejectLocalError, setRejectLocalError] = useState<string | null>(null);

  // Slide 24 Filter states
  const [periode, setPeriode] = useState('semua');
  const [gedung, setGedung] = useState('Semua Gedung');
  const [kategori, setKategori] = useState('Semua Kategori');

  const renderAppBar = (title: string, backTo?: ScreenId) => (
    <div className="flex items-center justify-between gap-2 bg-[#1E3A8A] px-4 py-3.5 text-white shrink-0">
      <div className="flex items-center gap-3 min-w-0">
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
        <h2 className="truncate text-base font-bold tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => props.onNavigate('profile')}
          title="Profil Admin"
          aria-label="Profil Admin"
          className="whitespace-nowrap shrink-0 flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
        >
          <User className="h-3.5 w-3.5" />
          <span>Profil</span>
        </button>
        <button
          type="button"
          onClick={props.onLogout}
          title="Logout"
          aria-label="Logout"
          className="whitespace-nowrap shrink-0 flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-white/20"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const renderAdminBottomNav = (
    active: 'dashboard' | 'laporan' | 'rangkum' | 'prioritas'
  ) => (
    <div className="grid grid-cols-4 border-t border-slate-200 bg-white py-2 shrink-0">
      {[
        { id: 'dashboard', label: 'Dashboard', target: 'admin-dashboard' as ScreenId },
        { id: 'laporan', label: 'Laporan', target: 'admin-reports' as ScreenId },
        {
          id: 'rangkum',
          label: 'Rangkum',
          target: 'admin-ai-summary-filter' as ScreenId,
        },
        {
          id: 'prioritas',
          label: 'Prioritas',
          target: 'admin-ai-priority-intro' as ScreenId,
        },
      ].map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => props.onNavigate(tab.target)}
            className="flex flex-col items-center justify-center gap-1 py-1"
          >
            <span
              className={`h-5 w-5 rounded-md ${
                isActive ? 'bg-[#1D5CE5]' : 'bg-slate-300'
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                isActive ? 'text-[#1D5CE5]' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // SLIDE 18: DASHBOARD ADMIN
  if (screen === 'admin-dashboard') {
    const categories = stats?.by_category ?? [];
    const maxCat = Math.max(1, ...categories.map((c) => c.count));

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Dashboard Admin')}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#1D5CE5] px-2 py-3.5 text-center text-white">
              <p className="font-mono text-2xl font-bold tabular-nums">
                {stats?.diproses ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-blue-100">Diproses</p>
            </div>
            <div className="rounded-xl bg-[#16A34A] px-2 py-3.5 text-center text-white">
              <p className="font-mono text-2xl font-bold tabular-nums">
                {stats?.selesai ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-emerald-100">Selesai</p>
            </div>
            <div className="rounded-xl bg-[#1E3A8A] px-2 py-3.5 text-center text-white">
              <p className="font-mono text-2xl font-bold tabular-nums">
                {stats?.total ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-medium text-blue-100">Total</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-bold text-slate-700">Kategori Kerusakan</p>
            <div className="mt-3 space-y-2.5">
              {categories.slice(0, 4).map((cat) => {
                const widthPct = Math.max(18, Math.round((cat.count / maxCat) * 100));
                return (
                  <div key={cat.kategori} className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 truncate font-medium text-slate-700">
                      {cat.kategori}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-3.5 rounded-full bg-[#1D5CE5]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => props.onNavigate('admin-reports')}
              className="w-full rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-bold text-white hover:bg-blue-900"
            >
              Kelola Laporan
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-ai-summary-filter')}
              className="w-full rounded-xl bg-[#7C3AED] py-3.5 text-sm font-bold text-white hover:bg-purple-700"
            >
              Rangkuman AI
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-ai-priority-intro')}
              className="w-full rounded-xl bg-[#EA580C] py-3.5 text-sm font-bold text-white hover:bg-orange-700"
            >
              Prioritas Penanganan
            </button>
          </div>
        </div>
        {renderAdminBottomNav('dashboard')}
      </div>
    );
  }

  // SLIDE 19: KELOLA LAPORAN
  if (screen === 'admin-reports') {
    const filtered = reports.filter((r) => {
      if (adminListFilter === 'Semua') return true;
      if (adminListFilter === 'Diajukan') {
        return r.status_terkini === 'Diajukan' || r.status_terkini === 'Ditinjau Admin';
      }
      return r.status_terkini === adminListFilter;
    });
    const pendingCount = (stats?.diajukan ?? 0) + (stats?.ditinjau ?? 0);

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Kelola Laporan')}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['Semua', 'Diajukan', 'Diproses', 'Selesai', 'Ditolak'] as const).map((tab) => {
              const active = adminListFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAdminListFilter(tab)}
                  className={`whitespace-nowrap shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
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

          <p className="mt-3 text-[11px] text-slate-500 tabular-nums">
            {filtered.length} tampil dari {reports.length} laporan · {pendingCount} menunggu peninjauan
          </p>

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <p className="text-xs font-bold text-slate-700">
                Tidak ada laporan berstatus {adminListFilter}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Pilih filter lain untuk melihat daftar tiket laporan kampus.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {filtered.map((item) => (
                <button
                  key={item.id_laporan}
                  type="button"
                  onClick={() => props.onSelectAdminReport(item)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-400"
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
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {item.pelapor_nama.split(' ')[0]} · {formatShortDate(item.created_at)}
                    </p>
                    <div className="mt-1.5 flex justify-end">
                      <span
                        className={`rounded-full px-3.5 py-0.5 text-[10px] font-bold ${getStatusPillClass(
                          item.status_terkini
                        )}`}
                      >
                        {item.status_terkini}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {renderAdminBottomNav('laporan')}
      </div>
    );
  }

  // SLIDE 20: DETAIL LAPORAN (ADMIN)
  if (screen === 'admin-detail') {
    const item = selectedReport || reports[0];
    if (!item) return null;
    const sevClass =
      item.keparahan === 'Berat'
        ? 'bg-red-600'
        : item.keparahan === 'Sedang'
        ? 'bg-[#F59E0B]'
        : 'bg-emerald-600';

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Detail Laporan', 'admin-reports')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div className="space-y-4">
            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-slate-300">
              <img
                src={item.foto_url}
                alt={item.nama_fasilitas}
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

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  {item.nama_fasilitas}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pelapor: {item.pelapor_nama} · {formatShortDate(item.created_at)}
                </p>
              </div>
              <span
                className={`whitespace-nowrap shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getStatusPillClass(
                  item.status_terkini
                )}`}
              >
                {item.status_terkini}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <p className="text-[11px] text-slate-500">Data Laporan</p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Kategori: {item.kategori}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${sevClass}`}
                >
                  Keparahan: {item.keparahan}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-700">{item.lokasi_gedung}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Kode QR: {item.kode_qr}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800">Deskripsi</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {item.deskripsi}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2.5 text-xs font-bold text-slate-800">
              Laporan layak diproses?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAlasanPenolakan('');
                  setRejectLocalError(null);
                  props.onNavigate('admin-reject');
                }}
                className="rounded-xl border border-red-400 bg-white py-3 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                Tolak
              </button>
              <button
                type="button"
                onClick={() => {
                  setAksiTeknis('Perbaiki');
                  setStatusTiket('Diproses');
                  setCatatanTeknis('');
                  props.onNavigate('admin-action');
                }}
                className="rounded-xl bg-[#16A34A] py-3 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Terima
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 21: TENTUKAN TINDAKAN
  if (screen === 'admin-action') {
    const item = selectedReport || reports[0];
    if (!item) return null;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Tentukan Tindakan', 'admin-detail')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500 tabular-nums">
              {item.nama_fasilitas} · #{item.id_laporan}
            </p>

            {props.adminActionError && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                {props.adminActionError}
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold text-slate-700">Aksi Teknis</p>
              <div className="space-y-2.5">
                {(['Perbaiki', 'Ganti Baru'] as TechnicalAction[]).map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-900"
                  >
                    <input
                      type="radio"
                      name="aksi_teknis"
                      checked={aksiTeknis === opt}
                      onChange={() => setAksiTeknis(opt)}
                      className="h-4 w-4 accent-[#1D5CE5]"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Status Tiket
              </label>
              <select
                value={statusTiket}
                onChange={(e) => setStatusTiket(e.target.value as TicketStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
              >
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditinjau Admin">Ditinjau Admin</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Catatan
              </label>
              <textarea
                rows={4}
                value={catatanTeknis}
                onChange={(e) => setCatatanTeknis(e.target.value)}
                placeholder="Sandaran akan diperbaiki teknisi pada hari Senin."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-900 focus:border-[#1D5CE5] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={props.adminSubmitting}
            onClick={() =>
              props.onApproveReport({
                id_laporan: item.id_laporan,
                jenis_tindakan: aksiTeknis,
                status_baru: statusTiket,
                catatan_petugas: catatanTeknis,
              })
            }
            className="mt-6 w-full rounded-xl bg-[#16A34A] py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {props.adminSubmitting ? 'Menyimpan...' : 'Update'}
          </button>
        </div>
      </div>
    );
  }

  // SLIDE 22: TOLAK LAPORAN
  if (screen === 'admin-reject') {
    const item = selectedReport || reports[0];
    if (!item) return null;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Tolak Laporan', 'admin-detail')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-4">
          <div className="space-y-4">
            <p className="text-xs font-medium text-slate-500 tabular-nums">
              {item.nama_fasilitas} · #{item.id_laporan}
            </p>

            {(rejectLocalError || props.adminActionError) && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                {rejectLocalError || props.adminActionError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Alasan Penolakan (wajib)
              </label>
              <textarea
                rows={5}
                value={alasanPenolakan}
                onChange={(e) => {
                  setAlasanPenolakan(e.target.value);
                  if (rejectLocalError) setRejectLocalError(null);
                }}
                placeholder="Laporan duplikat — kerusakan yang sama sudah dilaporkan pada tiket #TK-0009."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed text-slate-900 focus:border-red-600 focus:outline-none"
              />
              <p className="mt-2 text-[11px] text-slate-500">
                Pelapor akan menerima notifikasi beserta alasan ini.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={props.adminSubmitting}
              onClick={() => {
                if (alasanPenolakan.trim().length < 5) {
                  setRejectLocalError('Alasan penolakan wajib diisi minimal 5 karakter.');
                  return;
                }
                setRejectLocalError(null);
                props.onRejectReport({
                  id_laporan: item.id_laporan,
                  alasan_penolakan: alasanPenolakan.trim(),
                });
              }}
              className="w-full rounded-xl bg-[#DC2626] py-3.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {props.adminSubmitting ? 'Mengirim...' : 'Tolak & Kirim Catatan'}
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-detail')}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 23: STATUS DIPERBARUI
  if (screen === 'admin-updated') {
    const info = props.lastUpdatedTicket;
    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8">
        <div className="flex min-h-full flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
            <Check className="h-10 w-10 stroke-[3]" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900">Status Diperbarui</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Perubahan tersimpan di database dan notifikasi terkirim ke pelapor.
          </p>

          <div className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs font-bold text-slate-900 tabular-nums">
            Tiket #{info?.id || 'TK-0012'} → {info?.status || 'Diproses'}
          </div>

          <div className="mt-6 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => props.onNavigate('admin-reports')}
              className="w-full rounded-xl bg-[#1D5CE5] py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Kembali ke Kelola Laporan
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-dashboard')}
              className="w-full rounded-xl border border-[#1D5CE5] bg-white py-3 text-sm font-bold text-[#1D5CE5] hover:bg-blue-50"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SLIDE 24: RANGKUMAN AI – FILTER
  if (screen === 'admin-ai-summary-filter') {
    const buildings = Array.from(new Set(reports.map((r) => r.lokasi_gedung)));
    const categories = Array.from(new Set(reports.map((r) => r.kategori)));

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Rangkuman AI')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-5">
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Atur filter laporan yang ingin dirangkum.
            </p>

            {props.aiSummaryError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{props.aiSummaryError}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Periode
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="semua">Oktober – November 2026 (Semua)</option>
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Gedung
              </label>
              <select
                value={gedung}
                onChange={(e) => setGedung(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="Semua Gedung">Semua Gedung</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="Semua Kategori">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-center">
            <button
              type="button"
              disabled={props.aiSummaryLoading}
              onClick={() =>
                props.onGenerateAiSummary({ periode, gedung, kategori })
              }
              className="w-full rounded-xl bg-[#7C3AED] py-3.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {props.aiSummaryLoading
                ? 'Menghasilkan Rangkuman AI...'
                : 'Generate Rangkuman AI'}
            </button>

            <button
              type="button"
              onClick={() => props.onNavigate('admin-ai-summary-empty')}
              className="block w-full text-xs font-semibold text-red-600 hover:underline"
            >
              Uji skenario: data tidak ditemukan
            </button>
          </div>
        </div>
        {renderAdminBottomNav('rangkum')}
      </div>
    );
  }

  // SLIDE 25: RANGKUMAN EKSEKUTIF
  if (screen === 'admin-ai-summary-result') {
    const summary = props.aiSummary;
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Rangkuman AI')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-4 py-4">
          <div>
            <p className="text-[11px] text-slate-500">
              {summary?.filter_periode === '7d'
                ? '7 Hari Terakhir'
                : summary?.filter_periode === '30d'
                ? '30 Hari Terakhir'
                : 'Semua Periode'}{' '}
              · {summary?.filter_gedung || 'Semua Gedung'} ·{' '}
              {summary?.filter_kategori || 'Semua Kategori'}
            </p>

            <div className="mt-3 rounded-xl border border-purple-300 bg-purple-50/40 p-4">
              <h3 className="text-sm font-bold text-[#7C3AED]">
                Rangkuman Eksekutif
              </h3>
              {summary ? (
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-800">
                  <li className="flex gap-2">
                    <span className="font-bold text-slate-900">•</span>
                    <span>{summary.ringkasan_eksekutif}</span>
                  </li>
                  {summary.pola_dominan.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-slate-900">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                  {summary.peningkatan_gedung.map((g, i) => (
                    <li key={`g-${i}`} className="flex gap-2">
                      <span className="font-bold text-slate-900">•</span>
                      <span>
                        {g.gedung}: {g.jumlah_laporan} laporan (
                        {g.persentase_kenaikan > 0 ? '+' : ''}
                        {g.persentase_kenaikan}%). {g.ringkasan_tren}
                      </span>
                    </li>
                  ))}
                  {summary.rekomendasi_tindakan.map((r, i) => (
                    <li key={`r-${i}`} className="flex gap-2">
                      <span className="font-bold text-purple-700">•</span>
                      <span>
                        <span className="font-semibold text-purple-900">Rekomendasi:</span>{' '}
                        {r}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-600">
                  Menyiapkan ringkasan eksekutif...
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => props.onNavigate('admin-ai-summary-filter')}
            className="mt-5 w-full rounded-xl border border-[#7C3AED] bg-white py-3 text-sm font-bold text-[#7C3AED] hover:bg-purple-50"
          >
            Atur Ulang Filter
          </button>
        </div>
        {renderAdminBottomNav('rangkum')}
      </div>
    );
  }

  // SLIDE 26: DATA TIDAK DITEMUKAN
  if (screen === 'admin-ai-summary-empty') {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Rangkuman AI')}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8">
          <div className="flex min-h-full flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-400">
              <HelpCircle className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">
              Data Tidak Ditemukan
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Tidak ada laporan yang sesuai dengan filter yang dipilih.
            </p>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-ai-summary-filter')}
              className="mt-6 w-full rounded-xl bg-[#7C3AED] py-3 text-sm font-bold text-white hover:bg-purple-700"
            >
              Ubah Filter
            </button>
          </div>
        </div>
        {renderAdminBottomNav('rangkum')}
      </div>
    );
  }

  // SLIDE 27: PRIORITAS PENANGANAN (INTRO)
  if (screen === 'admin-ai-priority-intro') {
    const activeCount = reports.filter(
      (r) => r.status_terkini !== 'Selesai' && r.status_terkini !== 'Ditolak'
    ).length;

    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Prioritas Penanganan')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-5 py-5">
          <div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <p className="font-mono text-base font-bold text-slate-900 tabular-nums">
                {activeCount} tiket belum selesai
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Status: Diajukan & Diproses
              </p>
            </div>

            {props.aiPriorityError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{props.aiPriorityError}</span>
              </div>
            )}

            <div className="mt-5">
              <p className="text-xs font-bold text-slate-800">
                Skor urgensi dihitung dari
              </p>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2.5">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#EA580C]" />
                  <span>Tingkat keparahan (dari laporan) · 40%</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#EA580C]" />
                  <span>Frekuensi pelaporan · 30%</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#EA580C]" />
                  <span>Dampak fasilitas (Google Gemini AI) · 30%</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-center">
            <button
              type="button"
              disabled={props.aiPriorityLoading}
              onClick={props.onRunAiPrioritization}
              className="w-full rounded-xl bg-[#EA580C] py-3.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {props.aiPriorityLoading
                ? 'Menghitung Skor Urgensi...'
                : 'Hitung Prioritas Penanganan'}
            </button>
            <button
              type="button"
              onClick={() => props.onNavigate('admin-ai-priority-empty')}
              className="block w-full text-xs font-semibold text-red-600 hover:underline"
            >
              Uji skenario: tidak ada tiket aktif
            </button>
          </div>
        </div>
        {renderAdminBottomNav('prioritas')}
      </div>
    );
  }

  // SLIDE 28: URUTAN PRIORITAS
  if (screen === 'admin-ai-priority-result') {
    return (
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        {renderAppBar('Urutan Prioritas')}
        <div className="flex flex-1 min-h-0 flex-col justify-between overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-2.5">
            {props.aiPriorities.map((item, idx) => {
              const badgeColor =
                item.kategori_urgensi === 'Tinggi'
                  ? 'bg-[#DC2626]'
                  : item.kategori_urgensi === 'Sedang'
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#16A34A]';
              const targetReport = reports.find(
                (r) => r.id_laporan === item.id_laporan
              );

              return (
                <button
                  key={item.id_laporan}
                  type="button"
                  onClick={() => {
                    if (targetReport) props.onSelectAdminReport(targetReport);
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-orange-400"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] font-mono text-sm font-bold text-white tabular-nums">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {item.nama_fasilitas}
                      </p>
                      <span
                        className={`whitespace-nowrap shrink-0 rounded-full px-3 py-0.5 text-[10px] font-bold text-white ${badgeColor}`}
                      >
                        {item.kategori_urgensi}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-slate-700 tabular-nums">
                      Skor urgensi {item.skor_prioritas} · K:{item.skor_keparahan} F:{item.skor_frekuensi} D:{item.skor_dampak}
                    </p>
                    {item.alasan_urgensi && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                        {item.alasan_urgensi}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => props.onNavigate('admin-ai-priority-intro')}
            className="mt-4 w-full rounded-xl border border-[#EA580C] bg-white py-3 text-sm font-bold text-[#EA580C] hover:bg-orange-50"
          >
            Hitung Ulang
          </button>
        </div>
        {renderAdminBottomNav('prioritas')}
      </div>
    );
  }

  // SLIDE 29: TIDAK ADA TIKET AKTIF
  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {renderAppBar('Prioritas Penanganan')}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-8">
        <div className="flex min-h-full flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-400">
            <HelpCircle className="h-9 w-9" />
          </div>
          <h3 className="mt-5 text-base font-bold text-slate-900">
            Tidak Ada Tiket Aktif
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Semua laporan sudah selesai. Tidak ada yang perlu diprioritaskan.
          </p>
          <button
            type="button"
            onClick={() => props.onNavigate('admin-ai-priority-intro')}
            className="mt-6 w-full rounded-xl bg-[#EA580C] py-3 text-sm font-bold text-white hover:bg-orange-700"
          >
            Kembali
          </button>
        </div>
      </div>
      {renderAdminBottomNav('prioritas')}
    </div>
  );
};

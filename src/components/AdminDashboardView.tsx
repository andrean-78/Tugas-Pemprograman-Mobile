import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  ImageOff,
  Search,
  Sparkles,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import {
  ApiClientError,
  fetchAdminReports,
  generateAiExecutiveSummary,
  updateReportStatusByAdmin,
} from '../lib/api';
import type {
  AdminDashboardStats,
  ExecutiveSummaryResult,
  Laporan,
  TechnicalAction,
  TicketStatus,
  TindakanPenanganan,
} from '../types';

interface AdminDashboardViewProps {
  onNotificationTrigger: (msg: string) => void;
  onNavigatePrioritization: () => void;
}

function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getStatusTextColor(status: TicketStatus): string {
  switch (status) {
    case 'Selesai':
      return 'text-emerald-700';
    case 'Diproses':
      return 'text-amber-700';
    case 'Ditinjau Admin':
      return 'text-blue-700';
    case 'Ditolak':
      return 'text-red-700';
    default:
      return 'text-slate-700';
  }
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNotificationTrigger,
  onNavigatePrioritization,
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [reports, setReports] = useState<Laporan[]>([]);
  const [tindakanList, setTindakanList] = useState<TindakanPenanganan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | TicketStatus>('Semua');

  // Module 5: AI Executive Summary State
  const [periode, setPeriode] = useState('semua');
  const [filterGedung, setFilterGedung] = useState('Semua Gedung');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const [summary, setSummary] = useState<ExecutiveSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Module 4: Evaluation Modal State
  const [evaluatingReport, setEvaluatingReport] = useState<Laporan | null>(null);
  const [keputusan, setKeputusan] = useState<'Layak' | 'Ditolak'>('Layak');
  const [jenisTindakan, setJenisTindakan] = useState<TechnicalAction>('Perbaiki');
  const [estimasiSelesai, setEstimasiSelesai] = useState('');
  const [catatanPetugas, setCatatanPetugas] = useState('');
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  // Completion Modal State
  const [completingReport, setCompletingReport] = useState<Laporan | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionSubmitting, setCompletionSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminReports();
      setStats(res.stats);
      setReports(res.data);
      setTindakanList(res.tindakan);
      if (res.latest_summary && !summary) {
        setSummary(res.latest_summary);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await generateAiExecutiveSummary({
        periode,
        gedung: filterGedung,
        kategori: filterKategori,
      });
      setSummary(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSummaryError(err.message);
      } else {
        setSummaryError('Gagal menghasilkan rangkuman eksekutif AI.');
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const openEvaluationModal = (report: Laporan) => {
    setEvaluatingReport(report);
    setKeputusan('Layak');
    setJenisTindakan('Perbaiki');
    setEstimasiSelesai(
      new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10)
    );
    setCatatanPetugas('');
    setAlasanPenolakan('');
    setEvalError(null);
  };

  const handleMarkReviewed = async (report: Laporan) => {
    try {
      const res = await updateReportStatusByAdmin(report.id_laporan, {
        status_baru: 'Ditinjau Admin',
        catatan_petugas: 'Laporan sedang ditinjau oleh Admin Sarpras.',
      });
      onNotificationTrigger(`Notifikasi FCM terkirim: ${res.fcm_notification.judul}`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiClientError) {
        onNotificationTrigger(err.message);
      }
    }
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingReport) return;
    setEvalError(null);
    setEvalSubmitting(true);

    try {
      const res = await updateReportStatusByAdmin(evaluatingReport.id_laporan, {
        keputusan,
        jenis_tindakan: keputusan === 'Layak' ? jenisTindakan : undefined,
        alasan_penolakan: keputusan === 'Ditolak' ? alasanPenolakan : undefined,
        estimasi_selesai: keputusan === 'Layak' ? estimasiSelesai : undefined,
        catatan_petugas: catatanPetugas || undefined,
      });
      setEvaluatingReport(null);
      onNotificationTrigger(`FCM Terkirim ke Pelapor: ${res.fcm_notification.judul}`);
      await loadData();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setEvalError(err.message);
      } else {
        setEvalError('Gagal menyimpan evaluasi laporan.');
      }
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleCompleteTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingReport) return;
    setCompletionSubmitting(true);
    try {
      const res = await updateReportStatusByAdmin(completingReport.id_laporan, {
        status_baru: 'Selesai',
        catatan_petugas:
          completionNote.trim() ||
          'Perbaikan fasilitas telah selesai dikerjakan dan diverifikasi berfungsi normal.',
      });
      setCompletingReport(null);
      setCompletionNote('');
      onNotificationTrigger(`FCM Terkirim ke Pelapor: ${res.fcm_notification.judul}`);
      await loadData();
    } finally {
      setCompletionSubmitting(false);
    }
  };

  const uniqueBuildings = Array.from(new Set(reports.map((r) => r.lokasi_gedung)));
  const uniqueCategories = Array.from(new Set(reports.map((r) => r.kategori)));

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'Semua' || r.status_terkini === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      r.id_laporan.toLowerCase().includes(q) ||
      r.nama_fasilitas.toLowerCase().includes(q) ||
      r.lokasi_gedung.toLowerCase().includes(q) ||
      r.pelapor_nama.toLowerCase().includes(q) ||
      r.kode_qr.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const maxCategoryCount = Math.max(
    1,
    ...(stats?.by_category.map((c) => c.count) ?? [1])
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Admin Sarpras & Analitik AI
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Verifikasi kelayakan laporan fasilitas, kelola tindakan teknis, dan hasilkan
            rangkuman eksekutif berbasis Google Gemini AI.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigatePrioritization}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Buka Engine Prioritas AI</span>
        </button>
      </div>

      {/* Summary KPI Row + Category Breakdown (Module 4) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Total Laporan</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {loading ? '—' : stats?.total ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Seluruh tiket masuk</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Perlu Evaluasi</p>
            <p className="mt-2 font-mono text-2xl font-bold text-blue-700 tabular-nums">
              {loading ? '—' : (stats?.diajukan ?? 0) + (stats?.ditinjau ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Diajukan & Ditinjau</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Sedang Diproses</p>
            <p className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
              {loading ? '—' : stats?.diproses ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Dalam pengerjaan</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Selesai Ditangani</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {loading ? '—' : stats?.selesai ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Ditolak: {stats?.ditolak ?? 0}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900">
              Breakdown per Kategori Kerusakan
            </h2>
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3 space-y-2.5">
            {(stats?.by_category ?? []).slice(0, 4).map((cat) => {
              const pct = Math.round((cat.count / maxCategoryCount) * 100);
              return (
                <div key={cat.kategori}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-slate-700">{cat.kategori}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {cat.count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module 5: Executive Summary Card (Google Gemini AI) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-700" />
              <h2 className="text-base font-bold text-slate-900">
                Subsistem Rangkuman Eksekutif AI
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Ekstraksi pola kerusakan dominan, persentase tren gedung, dan rekomendasi
              strategis melalui Google Gemini API.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              aria-label="Filter Periode"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="semua">Semua Periode</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
            </select>

            <select
              value={filterGedung}
              onChange={(e) => setFilterGedung(e.target.value)}
              aria-label="Filter Gedung"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="Semua Gedung">Semua Gedung</option>
              {uniqueBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              aria-label="Filter Kategori"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="Semua Kategori">Semua Kategori</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={summaryLoading}
              onClick={handleGenerateSummary}
              className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {summaryLoading ? 'Menganalisis Dataset...' : 'Hasilkan Ringkasan AI'}
              </span>
            </button>
          </div>
        </div>

        {summaryError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{summaryError}</span>
          </div>
        )}

        {summaryLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-28 animate-pulse rounded-lg bg-slate-100 lg:col-span-3" />
            <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : summary ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Ringkasan Eksekutif ({summary.total_dianalisis} Laporan Dianalisis)
                </span>
                <span className="font-mono tabular-nums">
                  {summary.filter_gedung} · {summary.filter_kategori} ·{' '}
                  {formatDateShort(summary.generated_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">
                {summary.ringkasan_eksekutif}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pola Kerusakan Dominan
                </h3>
                <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-slate-700">
                  {summary.pola_dominan.map((pola, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono font-semibold text-blue-700 tabular-nums">
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span>{pola}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tren Laporan per Gedung
                </h3>
                <div className="mt-2.5 space-y-2.5">
                  {summary.peningkatan_gedung.map((g, i) => {
                    const isPositive = g.persentase_kenaikan > 0;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{g.gedung}</span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              isPositive ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {g.persentase_kenaikan}% ({g.jumlah_laporan} tiket)
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {g.ringkasan_tren}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rekomendasi Tindakan
                </h3>
                <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-slate-700">
                  {summary.rekomendasi_tindakan.map((rek, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{rek}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-600">
            Pilih filter periode, gedung, atau kategori di atas lalu klik{' '}
            <span className="font-semibold text-slate-900">"Hasilkan Ringkasan AI"</span>{' '}
            untuk memanggil pipeline analisis Google Gemini API.
          </div>
        )}
      </section>

      {/* Module 4: Ticket Management & Verification Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Daftar & Verifikasi Tiket Laporan
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Evaluasi kelayakan tiket untuk menentukan tindakan Perbaiki / Ganti Baru atau
              penolakan dengan catatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID, aset, pelapor..."
                className="w-48 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'Semua' | TicketStatus)
              }
              aria-label="Filter status tiket"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Ditinjau Admin">Ditinjau Admin</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="px-4 py-3">ID & Waktu</th>
                <th className="px-4 py-3">Fasilitas & Gedung</th>
                <th className="px-4 py-3">Pelapor</th>
                <th className="px-4 py-3">Keparahan</th>
                <th className="px-4 py-3">Status & Tindakan</th>
                <th className="px-4 py-3 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((item) => {
                const actionInfo = tindakanList.find(
                  (t) => t.id_laporan === item.id_laporan
                );
                return (
                  <tr key={item.id_laporan} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 align-top">
                      <span className="block font-mono font-semibold text-slate-900 tabular-nums">
                        {item.id_laporan}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-500 tabular-nums">
                        {formatDateShort(item.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block font-semibold text-slate-900">
                        {item.nama_fasilitas}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {item.lokasi_gedung} · {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="block font-medium text-slate-800">
                        {item.pelapor_nama}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {item.pelapor_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`font-semibold ${
                          item.keparahan === 'Berat'
                            ? 'text-red-700'
                            : item.keparahan === 'Sedang'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {item.keparahan}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`block font-semibold ${getStatusTextColor(
                          item.status_terkini
                        )}`}
                      >
                        {item.status_terkini}
                      </span>
                      {actionInfo && (
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {actionInfo.jenis_tindakan
                            ? `Tindakan: ${actionInfo.jenis_tindakan}`
                            : `Ditolak: ${actionInfo.alasan_penolakan}`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        {item.status_terkini === 'Diajukan' && (
                          <button
                            type="button"
                            onClick={() => handleMarkReviewed(item)}
                            className="whitespace-nowrap shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Tinjau
                          </button>
                        )}
                        {(item.status_terkini === 'Diajukan' ||
                          item.status_terkini === 'Ditinjau Admin') && (
                          <button
                            type="button"
                            onClick={() => openEvaluationModal(item)}
                            className="flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-800"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            <span>Evaluasi Laporan</span>
                          </button>
                        )}
                        {item.status_terkini === 'Diproses' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCompletingReport(item);
                              setCompletionNote('');
                            }}
                            className="flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Tandai Selesai</span>
                          </button>
                        )}
                        {(item.status_terkini === 'Selesai' ||
                          item.status_terkini === 'Ditolak') && (
                          <button
                            type="button"
                            onClick={() => openEvaluationModal(item)}
                            className="flex items-center gap-1 whitespace-nowrap shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <FileSearch className="h-3.5 w-3.5" />
                            <span>Ubah Evaluasi</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Evaluation Modal (Module 4) */}
      {evaluatingReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                  {evaluatingReport.id_laporan} · QR {evaluatingReport.kode_qr}
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Evaluasi Laporan: {evaluatingReport.nama_fasilitas}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingReport(null)}
                aria-label="Tutup modal evaluasi"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded bg-slate-200">
                <img
                  src={evaluatingReport.foto_url}
                  alt={evaluatingReport.nama_fasilitas}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-full w-full object-cover"
                />
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImageOff className="h-5 w-5" />
                </div>
              </div>
              <div className="text-xs text-slate-700">
                <p className="font-semibold text-slate-900">
                  {evaluatingReport.lokasi_gedung} · Keparahan {evaluatingReport.keparahan}
                </p>
                <p className="mt-1 leading-relaxed">{evaluatingReport.deskripsi}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="mt-5 space-y-4">
              {evalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {evalError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Keputusan Verifikasi Kelayakan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKeputusan('Layak')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      keputusan === 'Layak'
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-700" />
                    <span>Layak (Proses Tiket)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeputusan('Ditolak')}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      keputusan === 'Ditolak'
                        ? 'border-red-600 bg-red-50 text-red-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Tidak Layak (Tolak)</span>
                  </button>
                </div>
              </div>

              {keputusan === 'Layak' ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Pilih Tindakan Teknis
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Perbaiki', 'Ganti Baru'] as TechnicalAction[]).map((t) => (
                        <label
                          key={t}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-xs font-semibold ${
                            jenisTindakan === t
                              ? 'border-blue-600 bg-blue-50/70 text-blue-950'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{t}</span>
                          <input
                            type="radio"
                            name="jenis_tindakan"
                            checked={jenisTindakan === t}
                            onChange={() => setJenisTindakan(t)}
                            className="accent-blue-700"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Estimasi Selesai
                    </label>
                    <input
                      type="date"
                      value={estimasiSelesai}
                      onChange={(e) => setEstimasiSelesai(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Catatan untuk Teknisi & Pelapor
                    </label>
                    <textarea
                      rows={2}
                      value={catatanPetugas}
                      onChange={(e) => setCatatanPetugas(e.target.value)}
                      placeholder="Contoh: Tim teknisi HVAC dijadwalkan pemeriksaan komponen besok pukul 09.00."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-red-700">
                    Alasan Penolakan (Wajib Diisi)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={alasanPenolakan}
                    onChange={(e) => setAlasanPenolakan(e.target.value)}
                    placeholder="Jelaskan alasan penolakan (misal: duplikat tiket LPR-2026-001 atau aset dalam jadwal renovasi gedung)..."
                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-xs text-slate-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEvaluatingReport(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={evalSubmitting}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 ${
                    keputusan === 'Layak'
                      ? 'bg-blue-700 hover:bg-blue-800'
                      : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  {evalSubmitting
                    ? 'Menyimpan...'
                    : keputusan === 'Layak'
                    ? 'Setujui & Proses Tiket'
                    : 'Tolak & Kirim Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completingReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Selesaikan Tiket {completingReport.id_laporan}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {completingReport.nama_fasilitas} · {completingReport.lokasi_gedung}
            </p>
            <form onSubmit={handleCompleteTicket} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan Penyelesaian Teknisi
                </label>
                <textarea
                  rows={3}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Contoh: Unit telah diperbaiki, diuji coba selama 30 menit, dan berfungsi normal."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingReport(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={completionSubmitting}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {completionSubmitting ? 'Menyimpan...' : 'Tandai Selesai & Kirim FCM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

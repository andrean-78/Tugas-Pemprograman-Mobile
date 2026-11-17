import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  ImageOff,
  Plus,
  Wrench,
  XCircle,
} from 'lucide-react';
import { fetchReportHistory, fetchUserReports } from '../lib/api';
import type {
  AuthUser,
  Laporan,
  StatusTiket,
  TicketStatus,
  TindakanPenanganan,
} from '../types';

interface MyReportsViewProps {
  user: AuthUser;
  onCreateNew: () => void;
  refreshTrigger: number;
}

type FilterTab = 'Semua' | 'Diproses' | 'Selesai';

const TIMELINE_STEPS: TicketStatus[] = [
  'Diajukan',
  'Ditinjau Admin',
  'Diproses',
  'Selesai',
];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function getStatusColorClass(status: TicketStatus): string {
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

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  user,
  onCreateNew,
  refreshTrigger,
}) => {
  const [tab, setTab] = useState<FilterTab>('Semua');
  const [reports, setReports] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<{
    laporan: Laporan;
    history: StatusTiket[];
    tindakan: TindakanPenanganan | null;
  } | null>(null);
  const [imgErrorIds, setImgErrorIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchUserReports(user.id_user)
      .then((res) => {
        if (!active) return;
        setReports(res.data);
        if (res.data.length > 0 && !selectedId) {
          setSelectedId(res.data[0].id_laporan);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.id_user, refreshTrigger]);

  useEffect(() => {
    if (!selectedId) {
      setDetailData(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    fetchReportHistory(selectedId)
      .then((res) => {
        if (active) setDetailData(res);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId, refreshTrigger]);

  const filteredReports = reports.filter((r) => {
    if (tab === 'Semua') return true;
    if (tab === 'Diproses') {
      return (
        r.status_terkini === 'Diajukan' ||
        r.status_terkini === 'Ditinjau Admin' ||
        r.status_terkini === 'Diproses'
      );
    }
    return r.status_terkini === 'Selesai';
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporan Saya
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau progres verifikasi admin dan riwayat pengerjaan teknisi untuk setiap
            tiket Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            {(['Semua', 'Diproses', 'Selesai'] as FilterTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === item
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onCreateNew}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Laporan</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-7" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900">
            Belum Ada Laporan pada Kategori "{tab}"
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-600">
            Laporkan kerusakan fasilitas ruang kuliah, laboratorium, atau area umum kampus
            dengan memindai kode QR aset agar segera ditangani tim Sarpras.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-5 flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Laporan Pertama</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left: Ticket List */}
          <div className="space-y-3 lg:col-span-5">
            {filteredReports.map((item) => {
              const isSelected = selectedId === item.id_laporan;
              return (
                <button
                  key={item.id_laporan}
                  type="button"
                  onClick={() => setSelectedId(item.id_laporan)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {item.id_laporan}
                    </span>
                    <span className={`font-semibold ${getStatusColorClass(item.status_terkini)}`}>
                      {item.status_terkini}
                    </span>
                  </div>

                  <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                    {item.nama_fasilitas}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {item.deskripsi}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{item.lokasi_gedung}</span>
                    <span aria-hidden="true">·</span>
                    <span>Keparahan {item.keparahan}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatDateTime(item.created_at)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detail & Vertical Status Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
            {detailLoading || !detailData ? (
              <div className="space-y-4">
                <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-32 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <div>
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {detailData.laporan.id_laporan}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">QR: {detailData.laporan.kode_qr}</span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {detailData.laporan.nama_fasilitas}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>{detailData.laporan.lokasi_gedung}</span>
                      <span aria-hidden="true">·</span>
                      <span>{detailData.laporan.kategori}</span>
                      <span aria-hidden="true">·</span>
                      <span>Keparahan {detailData.laporan.keparahan}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span className="block text-[11px] text-slate-500">Status Terkini</span>
                    <span
                      className={`text-sm font-bold ${getStatusColorClass(
                        detailData.laporan.status_terkini
                      )}`}
                    >
                      {detailData.laporan.status_terkini}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:col-span-5">
                    {!imgErrorIds[detailData.laporan.id_laporan] ? (
                      <img
                        src={detailData.laporan.foto_url}
                        alt={detailData.laporan.nama_fasilitas}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgErrorIds((prev) => ({
                            ...prev,
                            [detailData.laporan.id_laporan]: true,
                          }))
                        }
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full flex-col items-center justify-center text-slate-400">
                        <ImageOff className="h-6 w-6" />
                        <span className="mt-1 text-xs">Foto tidak tersedia</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 sm:col-span-7">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Deskripsi Pelapor
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {detailData.laporan.deskripsi}
                      </p>
                    </div>

                    {detailData.tindakan && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                        <p className="font-semibold text-slate-900">
                          Keputusan Admin: {detailData.tindakan.keputusan}
                          {detailData.tindakan.jenis_tindakan
                            ? ` — Tindakan: ${detailData.tindakan.jenis_tindakan}`
                            : ''}
                        </p>
                        {detailData.tindakan.alasan_penolakan && (
                          <p className="mt-1 text-red-700">
                            Alasan Penolakan: {detailData.tindakan.alasan_penolakan}
                          </p>
                        )}
                        {detailData.tindakan.estimasi_selesai && (
                          <p className="mt-1 font-mono text-slate-600 tabular-nums">
                            Estimasi Selesai: {detailData.tindakan.estimasi_selesai}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Status Timeline Widget (Module 3 Requirement) */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Linimasa Status Penanganan Tiket
                  </h3>

                  {/* Progression summary indicator */}
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {TIMELINE_STEPS.map((step) => {
                      const isRejected = detailData.laporan.status_terkini === 'Ditolak';
                      const achieved = detailData.history.some((h) => h.status === step);
                      const isCurrent = detailData.laporan.status_terkini === step;
                      return (
                        <div
                          key={step}
                          className={`rounded-md border px-2.5 py-2 text-center text-[11px] font-semibold ${
                            isRejected && step === 'Diajukan'
                              ? 'border-slate-300 bg-slate-100 text-slate-700'
                              : isCurrent
                              ? 'border-blue-600 bg-blue-50 text-blue-800'
                              : achieved
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                        >
                          {step}
                        </div>
                      );
                    })}
                  </div>

                  {/* Chronological vertical timeline */}
                  <ol className="mt-5 space-y-0">
                    {detailData.history.map((entry, idx) => {
                      const isLast = idx === detailData.history.length - 1;
                      return (
                        <li key={entry.id_status} className="relative flex gap-4 pb-6 last:pb-0">
                          {!isLast && (
                            <span
                              aria-hidden="true"
                              className="absolute left-3.5 top-7 bottom-0 w-px bg-slate-200"
                            />
                          )}
                          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                            {entry.status === 'Selesai' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : entry.status === 'Ditolak' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : entry.status === 'Diproses' ? (
                              <Wrench className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                          </div>

                          <div className="flex-1 pt-0.5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span
                                className={`text-sm font-semibold ${getStatusColorClass(
                                  entry.status
                                )}`}
                              >
                                {entry.status}
                              </span>
                              <span className="font-mono text-xs text-slate-500 tabular-nums">
                                {formatDateTime(entry.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-700">
                              {entry.catatan_petugas}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Oleh: {entry.updated_by}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

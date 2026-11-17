import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Cpu,
  Flame,
  RefreshCw,
} from 'lucide-react';
import {
  ApiClientError,
  fetchAdminReports,
  runAiPrioritization,
} from '../lib/api';
import type { PrioritizedTicketResult, UrgencyCategory } from '../types';

interface AiPrioritizationViewProps {
  onBackToDashboard: () => void;
}

function getUrgencyBadgeStyle(category: UrgencyCategory): {
  bg: string;
  text: string;
  border: string;
  bar: string;
} {
  if (category === 'Tinggi') {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      bar: 'bg-red-600',
    };
  }
  if (category === 'Sedang') {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      bar: 'bg-amber-600',
    };
  }
  return {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    bar: 'bg-emerald-600',
  };
}

export const AiPrioritizationView: React.FC<AiPrioritizationViewProps> = ({
  onBackToDashboard,
}) => {
  const [items, setItems] = useState<PrioritizedTicketResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterUrgency, setFilterUrgency] = useState<'Semua' | UrgencyCategory>(
    'Semua'
  );

  useEffect(() => {
    fetchAdminReports()
      .then((res) => {
        setItems(res.cached_prioritizations || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRunPrioritization = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await runAiPrioritization();
      setItems(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Gagal menjalankan Engine Prioritasi Penanganan AI.');
      }
    } finally {
      setRunning(false);
    }
  };

  const filtered = items.filter(
    (item) => filterUrgency === 'Semua' || item.kategori_urgensi === filterUrgency
  );

  const countTinggi = items.filter((i) => i.kategori_urgensi === 'Tinggi').length;
  const countSedang = items.filter((i) => i.kategori_urgensi === 'Sedang').length;
  const countRendah = items.filter((i) => i.kategori_urgensi === 'Rendah').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Dashboard Admin</span>
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Engine Prioritasi Penanganan AI
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Urutan penanganan tiket aktif berdasarkan kalkulasi skor urgensi komposit
            (0–100) oleh Google Gemini API.
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={handleRunPrioritization}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Menghitung Skor AI...' : 'Hitung Prioritas Tiket AI'}</span>
        </button>
      </div>

      {/* Scoring Formula Rubric */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              1. Keparahan Laporan
            </span>
            <span className="font-mono text-xs font-bold text-blue-700 tabular-nums">
              Bobot 40%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            Berat = 100 · Sedang = 60 · Ringan = 30. Mengukur tingkat kerusakan fisik aset.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              2. Frekuensi Aset & Gedung
            </span>
            <span className="font-mono text-xs font-bold text-blue-700 tabular-nums">
              Bobot 30%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            Intensitas laporan pada kode QR aset atau lokasi gedung yang sama.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              3. Dampak Kegiatan Kampus
            </span>
            <span className="font-mono text-xs font-bold text-blue-700 tabular-nums">
              Bobot 30%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            Evaluasi kontekstual Google Gemini atas urgensi kuliah, lab, dan keselamatan.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Priority Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-slate-900">
              Klasifikasi Skor Urgensi:
            </span>
            <span className="font-semibold text-red-700 tabular-nums">
              Tinggi (&gt;80): {countTinggi}
            </span>
            <span className="font-semibold text-amber-700 tabular-nums">
              Sedang (50–80): {countSedang}
            </span>
            <span className="font-semibold text-emerald-700 tabular-nums">
              Rendah (&lt;50): {countRendah}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
            {(['Semua', 'Tinggi', 'Sedang', 'Rendah'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilterUrgency(level)}
                className={`whitespace-nowrap shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  filterUrgency === level
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {loading || running ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-16 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-bold text-slate-900">
              Belum Ada Hasil Prioritasi AI
            </h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
              Klik tombol <span className="font-semibold">"Hitung Prioritas Tiket AI"</span>{' '}
              untuk menjalankan evaluasi komposit Google Gemini terhadap seluruh tiket
              yang masih aktif.
            </p>
            <button
              type="button"
              onClick={handleRunPrioritization}
              className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Jalankan Evaluasi Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="px-4 py-3">Urutan</th>
                  <th className="px-4 py-3">Skor & Urgensi</th>
                  <th className="px-4 py-3">Fasilitas & Tiket</th>
                  <th className="px-4 py-3">Komponen Skor (40 / 30 / 30)</th>
                  <th className="px-4 py-3">Justifikasi AI & Rekomendasi Teknis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, idx) => {
                  const style = getUrgencyBadgeStyle(item.kategori_urgensi);
                  return (
                    <tr key={item.id_laporan} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 align-top font-mono text-sm font-bold text-slate-900 tabular-nums">
                        #{idx + 1}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div
                          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${style.bg} ${style.border} ${style.text}`}
                        >
                          {item.kategori_urgensi === 'Tinggi' && (
                            <Flame className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="font-mono text-sm font-bold tabular-nums">
                            {item.skor_prioritas}
                          </span>
                          <span className="text-[11px] font-bold uppercase">
                            {item.kategori_urgensi}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{ width: `${item.skor_prioritas}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <span className="block font-mono text-[11px] font-semibold text-slate-500 tabular-nums">
                          {item.id_laporan} · {item.kode_qr}
                        </span>
                        <span className="mt-0.5 block font-bold text-slate-900">
                          {item.nama_fasilitas}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {item.lokasi_gedung} · Status: {item.status_terkini}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top font-mono text-[11px] text-slate-700 tabular-nums">
                        <div>Keparahan (40%): {item.skor_keparahan}</div>
                        <div className="mt-0.5">Frekuensi (30%): {item.skor_frekuensi}</div>
                        <div className="mt-0.5">Dampak AI (30%): {item.skor_dampak}</div>
                      </td>
                      <td className="max-w-md px-4 py-3.5 align-top">
                        <p className="font-medium leading-relaxed text-slate-800">
                          {item.alasan_urgensi}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Saran Teknis: {item.rekomendasi_teknis}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

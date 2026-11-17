import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { fetchAllFacilities } from '../lib/api';
import type { Fasilitas } from '../types';

interface QrDirectoryViewProps {
  onSelectAssetForReport: (kodeQr: string) => void;
}

export const QrDirectoryView: React.FC<QrDirectoryViewProps> = ({
  onSelectAssetForReport,
}) => {
  const [facilities, setFacilities] = useState<Fasilitas[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllFacilities()
      .then((res) => setFacilities(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = facilities.filter((f) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      f.kode_qr.toLowerCase().includes(q) ||
      f.nama_fasilitas.toLowerCase().includes(q) ||
      f.lokasi_gedung.toLowerCase().includes(q) ||
      f.kategori.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Direktori QR Aset Kampus
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Daftar label QR resmi fasilitas kampus. Pindai dengan kamera ponsel atau pilih
            langsung untuk melapor.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode QR, gedung, atau aset..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((asset) => (
            <div
              key={asset.id_fasilitas}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {asset.kode_qr}
                  </span>
                  <span className="text-[11px] text-slate-500">{asset.id_fasilitas}</span>
                </div>

                <div className="my-4 flex justify-center">
                  <img
                    src={`/api/v1/fasilitas/qr/${encodeURIComponent(asset.kode_qr)}/svg`}
                    alt={`QR Code ${asset.kode_qr}`}
                    className="h-32 w-32 rounded-lg border border-slate-200 bg-white p-2"
                  />
                </div>

                <h2 className="text-sm font-bold leading-snug text-slate-900">
                  {asset.nama_fasilitas}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.lokasi_gedung} · {asset.kategori}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectAssetForReport(asset.kode_qr)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-blue-600 hover:bg-blue-50 hover:text-blue-800"
              >
                <span>Laporkan Aset Ini</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

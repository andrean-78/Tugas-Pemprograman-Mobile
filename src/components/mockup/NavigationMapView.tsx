import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ScreenId } from './screensMeta';

interface NavigationMapViewProps {
  onSelectFlow: (targetScreen: ScreenId, preferredRole?: 'Mahasiswa' | 'Admin') => void;
}

const DIAGRAM_CARDS: Array<{
  diagram: string;
  colorBar: string;
  textColor: string;
  title: string;
  actor: string;
  cta: string;
  target: ScreenId;
  role?: 'Mahasiswa' | 'Admin';
}> = [
  {
    diagram: 'DIAGRAM 1',
    colorBar: 'bg-blue-500',
    textColor: 'text-blue-400',
    title: 'Autentikasi Pengguna & Registrasi',
    actor: 'Pengguna (Mahasiswa / Dosen / Admin)',
    cta: 'Mulai: Login',
    target: 'login',
  },
  {
    diagram: 'DIAGRAM 2',
    colorBar: 'bg-purple-500',
    textColor: 'text-purple-400',
    title: 'Pelaporan Kerusakan Fasilitas',
    actor: 'Pelapor (Mahasiswa & Dosen) & Sistem',
    cta: 'Mulai: Buat Laporan – Ambil Foto',
    target: 'report-photo',
    role: 'Mahasiswa',
  },
  {
    diagram: 'DIAGRAM 3',
    colorBar: 'bg-teal-400',
    textColor: 'text-teal-400',
    title: 'Tracking & Monitoring Status Laporan',
    actor: 'Pelapor / Admin & Sistem',
    cta: 'Mulai: Laporan Saya',
    target: 'my-reports',
    role: 'Mahasiswa',
  },
  {
    diagram: 'DIAGRAM 4',
    colorBar: 'bg-amber-400',
    textColor: 'text-amber-400',
    title: 'Peninjauan, Verifikasi & Update Status',
    actor: 'Admin / Petugas Fasilitas',
    cta: 'Mulai: Dashboard Admin',
    target: 'admin-dashboard',
    role: 'Admin',
  },
  {
    diagram: 'DIAGRAM 5',
    colorBar: 'bg-fuchsia-400',
    textColor: 'text-fuchsia-400',
    title: 'Rangkuman Eksekutif & Analytics AI',
    actor: 'Admin & Subsistem AI',
    cta: 'Mulai: Rangkuman AI – Filter',
    target: 'admin-ai-summary-filter',
    role: 'Admin',
  },
  {
    diagram: 'DIAGRAM 6',
    colorBar: 'bg-orange-500',
    textColor: 'text-orange-400',
    title: 'Penjadwalan & Prioritasi Penanganan AI',
    actor: 'Admin & Subsistem AI',
    cta: 'Mulai: Prioritas Penanganan',
    target: 'admin-ai-priority-intro',
    role: 'Admin',
  },
];

export const NavigationMapView: React.FC<NavigationMapViewProps> = ({
  onSelectFlow,
}) => {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-blue-400">
          APLIKASI MOBILE & DASHBOARD
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Pelaporan Fasilitas Kampus
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          Pilih salah satu dari 6 alur aktivitas di bawah ini untuk langsung mencoba
          aplikasi secara penuh beserta backend API, pemindaian QR, dan analisis Google
          Gemini AI.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIAGRAM_CARDS.map((card) => (
          <button
            key={card.diagram}
            type="button"
            onClick={() => onSelectFlow(card.target, card.role)}
            className="group flex flex-col justify-between rounded-xl border border-slate-700/70 bg-[#10203A] p-5 text-left transition-all hover:border-blue-500/70 hover:bg-[#132645]"
          >
            <div>
              <div className={`h-1 w-9 rounded-full ${card.colorBar}`} />
              <p
                className={`mt-3 text-[11px] font-bold tracking-[0.16em] ${card.textColor}`}
              >
                {card.diagram}
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug text-white">
                {card.title}
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-xs text-slate-400">{card.actor}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>{card.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
        <span>Menu pendukung:</span>
        <button
          type="button"
          onClick={() => onSelectFlow('profile', 'Mahasiswa')}
          className="rounded-full border border-slate-600 bg-[#10203A] px-5 py-1.5 font-semibold text-blue-400 transition-colors hover:border-blue-500 hover:text-blue-300"
        >
          Profil Saya
        </button>
      </div>
    </div>
  );
};

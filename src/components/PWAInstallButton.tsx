import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const rawOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const shareableUrl = rawOrigin.includes('ais-dev-')
    ? rawOrigin.replace('ais-dev-', 'ais-pre-')
    : rawOrigin;

  const handleCopyUrl = async (targetUrl: string) => {
    if (!targetUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        throw new Error('Clipboard fallback');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = targetUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // User can still tap and copy directly from the readonly input
      }
    }
  };

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePrimaryClick}
        className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors ${
          compact
            ? 'border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/25'
            : 'border border-emerald-500/40 bg-emerald-600 px-4 py-2 text-xs text-white shadow-xs hover:bg-emerald-700'
        }`}
      >
        {isInstallable ? (
          <>
            <Download className="h-3.5 w-3.5" />
            <span>{compact ? 'Install App' : 'Install di Perangkat'}</span>
          </>
        ) : (
          <>
            <Smartphone className="h-3.5 w-3.5" />
            <span>{compact ? 'Buka di HP' : 'Akses & Install di Android / iPhone'}</span>
          </>
        )}
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Panduan Akses Android & iPhone"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0F1E36] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-700/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Akses & Pasang di Android / iPhone
                </h3>
                <p className="mt-0.5 text-xs text-slate-300">
                  Aplikasi sudah mendukung PWA (layar penuh tanpa address bar).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Tutup panduan"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {shareableUrl && (
                <div className="rounded-xl border border-slate-700 bg-[#0A1628] p-3">
                  <p className="text-[11px] font-semibold text-slate-400">
                    URL Aplikasi (klik untuk pilih & salin ke HP):
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      aria-label="URL Aplikasi untuk HP"
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-[11px] text-blue-300 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(shareableUrl)}
                      className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 rounded-md bg-[#1D5CE5] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-700/80 bg-[#10203A] p-3.5">
                <p className="font-bold text-emerald-300">
                  1. Android (Google Chrome)
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-slate-200 leading-relaxed">
                  <li>Buka URL aplikasi di Chrome pada HP Android.</li>
                  <li>
                    Ketuk menu <strong className="text-white">⋮</strong> (pojok kanan atas) lalu pilih{' '}
                    <strong className="text-white">Install app</strong> /{' '}
                    <strong className="text-white">Tambahkan ke layar utama</strong>.
                  </li>
                  <li>Ikon <strong className="text-white">SiFasKampus</strong> langsung muncul seperti APK biasa.</li>
                </ol>
              </div>

              <div
                className={`rounded-xl border p-3.5 ${
                  isIOS
                    ? 'border-blue-500 bg-blue-950/50'
                    : 'border-slate-700/80 bg-[#10203A]'
                }`}
              >
                <p className="font-bold text-blue-300">
                  2. iPhone / iPad (Safari iOS)
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-slate-200 leading-relaxed">
                  <li>Buka URL aplikasi menggunakan browser <strong className="text-white">Safari</strong>.</li>
                  <li>
                    Ketuk tombol <strong className="text-white">Share</strong> (ikon kotak dengan panah ke atas).
                  </li>
                  <li>
                    Pilih <strong className="text-white">Add to Home Screen</strong> (Tambahkan ke Layar Utama).
                  </li>
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-xl bg-[#1D5CE5] py-2.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

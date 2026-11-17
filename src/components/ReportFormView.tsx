import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileWarning,
  ImagePlus,
  Keyboard,
  QrCode,
  Search,
  Send,
  X,
} from 'lucide-react';
import {
  ApiClientError,
  fetchAllFacilities,
  lookupFacilityByQr,
  submitDamageReport,
} from '../lib/api';
import type { Fasilitas, Laporan, SeverityLevel } from '../types';

interface ReportFormViewProps {
  initialQrCode?: string | null;
  onReportSubmitted: (laporan: Laporan) => void;
}

const KATEGORI_OPTIONS = [
  'Elektronik & HVAC',
  'Multimedia & AV',
  'Kelistrikan & Pencahayaan',
  'Furnitur & Interior',
  'Sanitasi & Plumbing',
  'Jaringan & IT',
  'Struktur Bangunan',
];

const GEDUNG_OPTIONS = [
  'Gedung A (Teknik)',
  'Gedung B (Kuliah Umum)',
  'Gedung C (Lab Terpadu)',
  'Gedung D (Perpustakaan)',
  'Gedung E (Rektorat & Layanan)',
];

const SEVERITY_OPTIONS: Array<{
  value: SeverityLevel;
  label: string;
  desc: string;
  weightText: string;
}> = [
  {
    value: 'Ringan',
    label: 'Ringan',
    desc: 'Gangguan kecil, fasilitas masih dapat digunakan.',
    weightText: 'Bobot dasar 30',
  },
  {
    value: 'Sedang',
    label: 'Sedang',
    desc: 'Fungsi terganggu sebagian, perlu perbaikan segera.',
    weightText: 'Bobot dasar 60',
  },
  {
    value: 'Berat',
    label: 'Berat',
    desc: 'Fasilitas mati total atau berisiko keselamatan.',
    weightText: 'Bobot dasar 100',
  },
];

const SAMPLE_PHOTOS = [
  {
    label: 'Foto Kebocoran AC',
    url: '/src/assets/images/damage_ac_leak_1794892131712.jpg',
  },
  {
    label: 'Foto Braket Proyektor',
    url: '/src/assets/images/damage_projector_lab_1794892131899.jpg',
  },
  {
    label: 'Foto Lampu Koridor',
    url: '/src/assets/images/damage_electrical_corridor_1794892132270.jpg',
  },
];

export const ReportFormView: React.FC<ReportFormViewProps> = ({
  initialQrCode,
  onReportSubmitted,
}) => {
  const [inputMode, setInputMode] = useState<'qr' | 'manual'>('qr');
  const [facilities, setFacilities] = useState<Fasilitas[]>([]);
  const [qrInput, setQrInput] = useState(initialQrCode || '');
  const [scannedAsset, setScannedAsset] = useState<Fasilitas | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  // Form state
  const [namaFasilitas, setNamaFasilitas] = useState('');
  const [lokasiGedung, setLokasiGedung] = useState(GEDUNG_OPTIONS[0]);
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [keparahan, setKeparahan] = useState<SeverityLevel>('Sedang');
  const [deskripsi, setDeskripsi] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [samplePhotoUrl, setSamplePhotoUrl] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllFacilities()
      .then((res) => setFacilities(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQrCode) {
      setInputMode('qr');
      setQrInput(initialQrCode);
      void handleLookupQr(initialQrCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQrCode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookupQr = async (codeToCheck: string) => {
    const clean = codeToCheck.trim().toUpperCase();
    if (!clean) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await lookupFacilityByQr(clean);
      setScannedAsset(res.data);
      setQrInput(res.data.kode_qr);
      setNamaFasilitas(res.data.nama_fasilitas);
      setLokasiGedung(res.data.lokasi_gedung);
      setKategori(res.data.kategori);
      stopCamera();
    } catch (err) {
      setScannedAsset(null);
      if (err instanceof ApiClientError) {
        setQrError(err.message);
      } else {
        setQrError('Gagal memverifikasi kode QR aset.');
      }
    } finally {
      setQrLoading(false);
    }
  };

  const startCameraScanner = async () => {
    setCameraMessage(null);
    setQrError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraMessage(
        'Browser tidak mendukung akses kamera langsung. Silakan pilih QR aset atau gunakan input manual.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 60);

      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
          };
        }
      ).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              void handleLookupQr(codes[0].rawValue);
            }
          } catch {
            // Ignore frame errors
          }
        }, 700);
      } else {
        setCameraMessage(
          'Kamera aktif. Jika deteksi QR otomatis tidak tersedia di browser ini, klik kartu QR aset di samping untuk simulasi pindai.'
        );
      }
    } catch {
      setCameraMessage(
        'Izin kamera ditolak atau perangkat kamera tidak tersedia. Gunakan simulasi QR atau Input Manual.'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setSamplePhotoUrl('');
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
  };

  const handleSelectSamplePhoto = (url: string) => {
    setPhotoFile(null);
    setSamplePhotoUrl(url);
    setPhotoPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append(
        'kode_qr',
        inputMode === 'qr' && scannedAsset ? scannedAsset.kode_qr : qrInput || 'MANUAL-INPUT'
      );
      formData.append('nama_fasilitas', namaFasilitas);
      formData.append('lokasi_gedung', lokasiGedung);
      formData.append('kategori', kategori);
      formData.append('keparahan', keparahan);
      formData.append('deskripsi', deskripsi);

      if (photoFile) {
        formData.append('foto', photoFile);
      } else if (samplePhotoUrl) {
        formData.append('fallback_foto_url', samplePhotoUrl);
      }

      const res = await submitDamageReport(formData);
      onReportSubmitted(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const detailMsg = err.details.map((d) => d.message).join(' ');
        setSubmitError(detailMsg || err.message);
      } else {
        setSubmitError('Gagal mengirim laporan kerusakan.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Laporkan Kerusakan Fasilitas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pindai kode QR aset untuk mengisi data ruangan otomatis, atau gunakan mode
            input manual jika label QR rusak.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setInputMode('qr')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              inputMode === 'qr'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Pindai QR Aset</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setInputMode('manual');
              setQrError(null);
            }}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              inputMode === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Input Manual</span>
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: QR Scanner & Quick Asset Picker */}
        <div className="space-y-5 lg:col-span-5">
          {inputMode === 'qr' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Pemindai QR Aset Kampus
                </h2>
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Matikan Kamera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startCameraScanner}
                    className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Aktifkan Kamera</span>
                  </button>
                )}
              </div>

              {cameraActive && (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-300 bg-slate-950">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}

              {cameraMessage && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  {cameraMessage}
                </p>
              )}

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Masukkan Kode QR Aset (Contoh: KR-A002-07)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="KR-A002-07"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <button
                    type="button"
                    disabled={qrLoading}
                    onClick={() => handleLookupQr(qrInput)}
                    className="flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>{qrLoading ? 'Mencari...' : 'Cek QR'}</span>
                  </button>
                </div>
              </div>

              {qrError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3.5">
                  <div className="flex items-start gap-2.5 text-xs text-red-800">
                    <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <div className="space-y-2">
                      <p>{qrError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setInputMode('manual');
                          setQrError(null);
                        }}
                        className="font-semibold text-red-900 underline hover:text-red-700"
                      >
                        Beralih ke Input Manual
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {scannedAsset && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div className="text-xs text-emerald-950">
                      <p className="font-semibold">
                        Aset Terdeteksi ·{' '}
                        <span className="font-mono">{scannedAsset.kode_qr}</span>
                      </p>
                      <p className="mt-1 text-emerald-900">{scannedAsset.nama_fasilitas}</p>
                      <p className="mt-0.5 text-emerald-800">
                        {scannedAsset.lokasi_gedung} · {scannedAsset.kategori}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-700">
                  Simulasi Scan QR Cepat (Aset Terdaftar)
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {facilities.slice(0, 4).map((asset) => {
                    const active = scannedAsset?.kode_qr === asset.kode_qr;
                    return (
                      <button
                        key={asset.id_fasilitas}
                        type="button"
                        onClick={() => handleLookupQr(asset.kode_qr)}
                        className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-50/70'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <img
                          src={`/api/v1/fasilitas/qr/${encodeURIComponent(asset.kode_qr)}/svg`}
                          alt={`QR ${asset.kode_qr}`}
                          className="h-10 w-10 shrink-0 rounded border border-slate-200 bg-white p-0.5"
                        />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            {asset.kode_qr}
                          </p>
                          <p className="truncate text-[11px] text-slate-600">
                            {asset.nama_fasilitas}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">
                Mode Input Manual (Fallback)
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                Gunakan mode ini apabila stiker QR pada fasilitas rusak, pudar, atau
                fasilitas belum terdaftar dalam katalog aset. Silakan lengkapi nama
                fasilitas, gedung, dan kategori secara manual di formulir.
              </p>
              <button
                type="button"
                onClick={() => setInputMode('qr')}
                className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali ke Pemindai QR
              </button>
            </div>
          )}
        </div>

        {/* Right: Damage Report Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Formulir Laporan Kerusakan
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Data dikirim via Multipart Form Data ke server Sarpras.
              </p>
            </div>
            {scannedAsset && inputMode === 'qr' && (
              <span className="font-mono text-xs font-semibold text-blue-700">
                QR: {scannedAsset.kode_qr}
              </span>
            )}
          </div>

          {submitError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Nama Fasilitas / Ruangan
              </label>
              <input
                type="text"
                required
                value={namaFasilitas}
                onChange={(e) => setNamaFasilitas(e.target.value)}
                placeholder="Contoh: AC Split Ruang A202"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Lokasi Gedung
              </label>
              <select
                value={lokasiGedung}
                onChange={(e) => setLokasiGedung(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                {GEDUNG_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Kategori Kerusakan
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
              Tingkat Keparahan Kerusakan
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SEVERITY_OPTIONS.map((opt) => {
                const selected = keparahan === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        name="keparahan"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setKeparahan(opt.value)}
                        className="h-4 w-4 accent-blue-700"
                      />
                    </div>
                    <p className="mt-1 text-xs leading-snug text-slate-600">
                      {opt.desc}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Deskripsi Detail Kerusakan
            </label>
            <textarea
              required
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan kondisi kerusakan, posisi unit, dan dampaknya terhadap kegiatan belajar mengajar..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Foto Bukti Kerusakan
              </label>
              <span className="text-[11px] text-slate-500">
                JPG/PNG maksimal 8 MB
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/30">
                <ImagePlus className="h-6 w-6 text-slate-400" />
                <span className="mt-1.5 text-xs font-semibold text-slate-700">
                  {photoFile ? photoFile.name : 'Pilih File Foto Kerusakan'}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-500">
                  Klik untuk unggah dari perangkat
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {photoPreviewUrl && (
                <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  <img
                    src={photoPreviewUrl}
                    alt="Pratinjau foto kerusakan"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setSamplePhotoUrl('');
                      setPhotoPreviewUrl(null);
                    }}
                    aria-label="Hapus foto"
                    className="absolute right-1.5 top-1.5 rounded bg-slate-900/75 p-1 text-white hover:bg-slate-900"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500">Atau gunakan sampel foto:</span>
              {SAMPLE_PHOTOS.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => handleSelectSamplePhoto(s.url)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                    samplePhotoUrl === s.url
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Mengirim Laporan...' : 'Kirim Laporan Kerusakan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  BuildingTrendItem,
  ExecutiveSummaryResult,
  Laporan,
  PrioritizedTicketResult,
  SeverityLevel,
  UrgencyCategory,
} from '../src/types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY belum dikonfigurasi pada environment server. Silakan periksa panel Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getSeverityScore(keparahan: SeverityLevel): number {
  if (keparahan === 'Berat') return 100;
  if (keparahan === 'Sedang') return 60;
  return 30;
}

function classifyUrgency(score: number): UrgencyCategory {
  if (score > 80) return 'Tinggi';
  if (score >= 50) return 'Sedang';
  return 'Rendah';
}

export async function generateExecutiveSummary(
  filteredReports: Laporan[],
  allReports: Laporan[],
  filters: { periode: string; gedung: string; kategori: string }
): Promise<ExecutiveSummaryResult> {
  const ai = getGeminiClient();

  const byBuilding: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const item of filteredReports) {
    byBuilding[item.lokasi_gedung] = (byBuilding[item.lokasi_gedung] || 0) + 1;
    byCategory[item.kategori] = (byCategory[item.kategori] || 0) + 1;
    bySeverity[item.keparahan] = (bySeverity[item.keparahan] || 0) + 1;
    byStatus[item.status_terkini] = (byStatus[item.status_terkini] || 0) + 1;
  }

  const now = Date.now();
  const recentWindowMs = 3 * 24 * 3600 * 1000;
  const buildingMomentum: Record<string, { recent: number; previous: number }> = {};

  for (const item of allReports) {
    if (!buildingMomentum[item.lokasi_gedung]) {
      buildingMomentum[item.lokasi_gedung] = { recent: 0, previous: 0 };
    }
    const ageMs = now - new Date(item.created_at).getTime();
    if (ageMs <= recentWindowMs) {
      buildingMomentum[item.lokasi_gedung].recent += 1;
    } else {
      buildingMomentum[item.lokasi_gedung].previous += 1;
    }
  }

  const promptPayload = {
    filter_aktif: filters,
    total_laporan_terfilter: filteredReports.length,
    distribusi_gedung: byBuilding,
    distribusi_kategori: byCategory,
    distribusi_keparahan: bySeverity,
    distribusi_status: byStatus,
    perbandingan_periode_gedung: buildingMomentum,
    sampel_laporan: filteredReports.slice(0, 20).map((r) => ({
      id: r.id_laporan,
      gedung: r.lokasi_gedung,
      fasilitas: r.nama_fasilitas,
      kategori: r.kategori,
      keparahan: r.keparahan,
      status: r.status_terkini,
      deskripsi: r.deskripsi,
    })),
  };

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Analisis dataset laporan kerusakan fasilitas kampus berikut dan hasilkan rangkuman eksekutif untuk Direktorat Sarana & Prasarana:\n${JSON.stringify(promptPayload, null, 2)}`,
    config: {
      systemInstruction:
        'Anda adalah AI/ML Systems Engineer & Analis Fasilitas Kampus. Berikan analisis faktual berbasis data JSON yang diberikan dalam Bahasa Indonesia yang ringkas, profesional, dan siap ditindaklanjuti. Jangan mengarang gedung atau angka yang tidak ada di data.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ringkasan_eksekutif: {
            type: Type.STRING,
            description: 'Ringkasan eksekutif kondisi fasilitas kampus dalam 2-4 kalimat.',
          },
          pola_dominan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-4 temuan pola kerusakan dominan berdasarkan kategori, tingkat keparahan, dan lokasi.',
          },
          peningkatan_gedung: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                gedung: { type: Type.STRING },
                jumlah_laporan: { type: Type.INTEGER },
                persentase_kenaikan: {
                  type: Type.NUMBER,
                  description: 'Estimasi persentase kenaikan/perubahan laporan pada gedung ini (angka, misal 35 atau -10).',
                },
                ringkasan_tren: { type: Type.STRING },
              },
              required: ['gedung', 'jumlah_laporan', 'persentase_kenaikan', 'ringkasan_tren'],
            },
          },
          rekomendasi_tindakan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-4 rekomendasi tindakan pemeliharaan preventif dan perbaikan strategis.',
          },
        },
        required: [
          'ringkasan_eksekutif',
          'pola_dominan',
          'peningkatan_gedung',
          'rekomendasi_tindakan',
        ],
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as {
    ringkasan_eksekutif: string;
    pola_dominan: string[];
    peningkatan_gedung: BuildingTrendItem[];
    rekomendasi_tindakan: string[];
  };

  return {
    id_analisis: `ANL-SUM-${Date.now()}`,
    filter_periode: filters.periode,
    filter_gedung: filters.gedung,
    filter_kategori: filters.kategori,
    total_dianalisis: filteredReports.length,
    ringkasan_eksekutif: parsed.ringkasan_eksekutif,
    pola_dominan: parsed.pola_dominan ?? [],
    peningkatan_gedung: parsed.peningkatan_gedung ?? [],
    rekomendasi_tindakan: parsed.rekomendasi_tindakan ?? [],
    generated_at: new Date().toISOString(),
  };
}

export async function prioritizeTicketsWithAI(
  targetReports: Laporan[],
  allReports: Laporan[]
): Promise<PrioritizedTicketResult[]> {
  if (targetReports.length === 0) {
    return [];
  }

  const ai = getGeminiClient();

  const buildingCounts: Record<string, number> = {};
  const assetCounts: Record<string, number> = {};
  for (const r of allReports) {
    buildingCounts[r.lokasi_gedung] = (buildingCounts[r.lokasi_gedung] || 0) + 1;
    assetCounts[r.id_fasilitas] = (assetCounts[r.id_fasilitas] || 0) + 1;
  }

  const maxBuildingCount = Math.max(1, ...Object.values(buildingCounts));

  const enrichedInput = targetReports.map((r) => {
    const assetFreq = assetCounts[r.id_fasilitas] || 1;
    const buildingFreq = buildingCounts[r.lokasi_gedung] || 1;
    // Frequency score 0-100 combining same-asset recurrence & building report density
    const skor_frekuensi = Math.min(
      100,
      Math.round(
        (Math.min(assetFreq, 4) / 4) * 50 + (buildingFreq / maxBuildingCount) * 50
      )
    );
    return {
      id_laporan: r.id_laporan,
      kode_qr: r.kode_qr,
      nama_fasilitas: r.nama_fasilitas,
      lokasi_gedung: r.lokasi_gedung,
      kategori: r.kategori,
      keparahan: r.keparahan,
      deskripsi: r.deskripsi,
      skor_keparahan: getSeverityScore(r.keparahan),
      skor_frekuensi,
      frekuensi_aset: assetFreq,
      frekuensi_gedung: buildingFreq,
    };
  });

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Evaluasi dampak setiap fasilitas terhadap kegiatan perkuliahan, keselamatan mahasiswa/dosen, dan operasional laboratorium kampus untuk daftar tiket berikut:\n${JSON.stringify(enrichedInput, null, 2)}`,
    config: {
      systemInstruction:
        'Anda adalah Data Scientist & Engine Prioritasi Sarpras Kampus. Untuk setiap id_laporan, berikan skor_dampak (integer 0 sampai 100) yang mengukur seberapa besar dampak kerusakan tersebut terhadap kelangsungan perkuliahan, keselamatan pengguna, dan layanan akademik, disertai alasan_urgensi (1 kalimat) dan rekomendasi_teknis singkat dalam Bahasa Indonesia.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id_laporan: { type: Type.STRING },
            skor_dampak: {
              type: Type.INTEGER,
              description: 'Skor dampak fasilitas terhadap kegiatan kampus (0-100).',
            },
            alasan_urgensi: {
              type: Type.STRING,
              description: 'Penjelasan ringkas dampak dan urgensi penanganan.',
            },
            rekomendasi_teknis: {
              type: Type.STRING,
              description: 'Langkah penanganan teknis yang disarankan.',
            },
          },
          required: ['id_laporan', 'skor_dampak', 'alasan_urgensi', 'rekomendasi_teknis'],
        },
      },
    },
  });

  const rawText = (response.text ?? '[]').trim();
  const aiEvaluations = JSON.parse(rawText) as Array<{
    id_laporan: string;
    skor_dampak: number;
    alasan_urgensi: string;
    rekomendasi_teknis: string;
  }>;

  const evalMap = new Map(aiEvaluations.map((e) => [e.id_laporan, e]));
  const nowIso = new Date().toISOString();

  const results: PrioritizedTicketResult[] = targetReports.map((report) => {
    const base = enrichedInput.find((x) => x.id_laporan === report.id_laporan)!;
    const aiEval = evalMap.get(report.id_laporan);
    const clampedImpact = Math.max(
      0,
      Math.min(100, Math.round(aiEval?.skor_dampak ?? 60))
    );

    const skor_prioritas = Math.round(
      base.skor_keparahan * 0.4 +
        base.skor_frekuensi * 0.3 +
        clampedImpact * 0.3
    );

    return {
      id_analisis: `ANL-PRI-${report.id_laporan}-${Date.now()}`,
      id_laporan: report.id_laporan,
      kode_qr: report.kode_qr,
      nama_fasilitas: report.nama_fasilitas,
      lokasi_gedung: report.lokasi_gedung,
      kategori: report.kategori,
      keparahan: report.keparahan,
      status_terkini: report.status_terkini,
      skor_keparahan: base.skor_keparahan,
      skor_frekuensi: base.skor_frekuensi,
      skor_dampak: clampedImpact,
      skor_prioritas,
      kategori_urgensi: classifyUrgency(skor_prioritas),
      alasan_urgensi:
        aiEval?.alasan_urgensi ??
        'Evaluasi dampak operasional fasilitas terhadap aktivitas kampus.',
      rekomendasi_teknis:
        aiEval?.rekomendasi_teknis ??
        'Jadwalkan inspeksi lapangan dan tindakan pemeliharaan.',
      generated_at: nowIso,
    };
  });

  results.sort((a, b) => b.skor_prioritas - a.skor_prioritas);
  return results;
}

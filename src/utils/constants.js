// Status Paket Pengadaan
export const STATUS = {
  DRAFT: 'DRAFT',
  PERENCANAAN: 'PERENCANAAN',
  PERSIAPAN: 'PERSIAPAN',
  PEMILIHAN: 'PEMILIHAN',
  KONTRAK: 'KONTRAK',
  PELAKSANAAN: 'PELAKSANAAN',
  SERAH_TERIMA: 'SERAH_TERIMA',
  PEMBAYARAN: 'PEMBAYARAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL',
}

export const STATUS_LABELS = {
  [STATUS.DRAFT]: 'Draft',
  [STATUS.PERENCANAAN]: 'Perencanaan',
  [STATUS.PERSIAPAN]: 'Persiapan',
  [STATUS.PEMILIHAN]: 'Pemilihan',
  [STATUS.KONTRAK]: 'Kontrak',
  [STATUS.PELAKSANAAN]: 'Pelaksanaan',
  [STATUS.SERAH_TERIMA]: 'Serah Terima',
  [STATUS.PEMBAYARAN]: 'Pembayaran',
  [STATUS.SELESAI]: 'Selesai',
  [STATUS.BATAL]: 'Batal',
}

export const STATUS_COLORS = {
  [STATUS.DRAFT]: 'gray',
  [STATUS.PERENCANAAN]: 'primary',
  [STATUS.PERSIAPAN]: 'primary',
  [STATUS.PEMILIHAN]: 'warning',
  [STATUS.KONTRAK]: 'warning',
  [STATUS.PELAKSANAAN]: 'primary',
  [STATUS.SERAH_TERIMA]: 'success',
  [STATUS.PEMBAYARAN]: 'success',
  [STATUS.SELESAI]: 'success',
  [STATUS.BATAL]: 'error',
}

// Workflow stages in order
export const WORKFLOW_STAGES = [
  STATUS.DRAFT,
  STATUS.PERENCANAAN,
  STATUS.PERSIAPAN,
  STATUS.PEMILIHAN,
  STATUS.KONTRAK,
  STATUS.PELAKSANAAN,
  STATUS.SERAH_TERIMA,
  STATUS.PEMBAYARAN,
  STATUS.SELESAI,
]

// Jenis Pengadaan
export const JENIS_PENGADAAN = [
  { value: 'Barang', label: 'Barang' },
  { value: 'Jasa', label: 'Jasa' },
  { value: 'Konstruksi', label: 'Konstruksi' },
  { value: 'Konsultan', label: 'Konsultan' },
]

// Metode Pengadaan
export const METODE_PENGADAAN = [
  { value: 'Pengadaan Langsung', label: 'Pengadaan Langsung' },
  { value: 'Penunjukan Langsung', label: 'Penunjukan Langsung' },
  { value: 'Tender', label: 'Tender' },
  { value: 'Tender Cepat', label: 'Tender Cepat' },
  { value: 'Seleksi', label: 'Seleksi' },
  { value: 'E-Purchasing', label: 'E-Purchasing' },
]

// Sumber Dana
export const SUMBER_DANA = [
  { value: 'APBN', label: 'APBN' },
  { value: 'APBD', label: 'APBD' },
  { value: 'BLU', label: 'BLU' },
  { value: 'Hibah', label: 'Hibah' },
  { value: 'Pinjaman', label: 'Pinjaman' },
]

// Jenis Dokumen per Tahap
export const DOKUMEN_PER_TAHAP = {
  [STATUS.PERENCANAAN]: [
    'Identifikasi Kebutuhan',
    'KAK',
    'Perkiraan HPS',
    'Rancangan Kontrak',
  ],
  [STATUS.PERSIAPAN]: [
    'Nota Dinas',
    'HPS Final',
    'Dokumen Pemilihan',
  ],
  [STATUS.PEMILIHAN]: [
    'BA Negosiasi',
    'BAHP',
  ],
  [STATUS.KONTRAK]: [
    'SPPBJ',
    'SPK',
    'SPMK',
  ],
  [STATUS.SERAH_TERIMA]: [
    'BA Pemeriksaan',
    'BAPP',
    'BAST',
    'BA Stock Opname',
  ],
  [STATUS.PEMBAYARAN]: [
    'Kuitansi',
    'Faktur Pajak',
    'SSP',
    'SPP',
    'BA Pembayaran',
  ],
  [STATUS.SELESAI]: [
    'Laporan Akhir',
  ],
}

// Status Perjalanan Dinas
export const STATUS_PD = {
  DRAFT: 'DRAFT',
  SURAT_TUGAS: 'SURAT_TUGAS',
  SPPD: 'SPPD',
  PELAKSANAAN: 'PELAKSANAAN',
  SELESAI_PERJALANAN: 'SELESAI_PERJALANAN',
  PERTANGGUNGJAWABAN: 'PERTANGGUNGJAWABAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL',
}

export const STATUS_PD_LABELS = {
  [STATUS_PD.DRAFT]: 'Draft',
  [STATUS_PD.SURAT_TUGAS]: 'Surat Tugas',
  [STATUS_PD.SPPD]: 'SPPD',
  [STATUS_PD.PELAKSANAAN]: 'Pelaksanaan',
  [STATUS_PD.SELESAI_PERJALANAN]: 'Selesai Perjalanan',
  [STATUS_PD.PERTANGGUNGJAWABAN]: 'Pertanggungjawaban',
  [STATUS_PD.SELESAI]: 'Selesai',
  [STATUS_PD.BATAL]: 'Batal',
}

export const STATUS_PD_COLORS = {
  [STATUS_PD.DRAFT]: 'gray',
  [STATUS_PD.SURAT_TUGAS]: 'primary',
  [STATUS_PD.SPPD]: 'primary',
  [STATUS_PD.PELAKSANAAN]: 'warning',
  [STATUS_PD.SELESAI_PERJALANAN]: 'warning',
  [STATUS_PD.PERTANGGUNGJAWABAN]: 'primary',
  [STATUS_PD.SELESAI]: 'success',
  [STATUS_PD.BATAL]: 'error',
}

// Tingkat Biaya Perjalanan Dinas
export const TINGKAT_BIAYA = [
  { value: 'A', label: 'Tingkat A' },
  { value: 'B', label: 'Tingkat B' },
  { value: 'C', label: 'Tingkat C' },
  { value: 'D', label: 'Tingkat D' },
]

// Jenis Biaya Perjalanan Dinas
export const JENIS_BIAYA_PD = [
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'TRANSPORT_LOKAL', label: 'Transport Lokal' },
  { value: 'TRANSPORT_KEBERANGKATAN', label: 'Transport Keberangkatan' },
  { value: 'TRANSPORT_KEPULANGAN', label: 'Transport Kepulangan' },
  { value: 'UANG_HARIAN', label: 'Uang Harian' },
  { value: 'PENGINAPAN', label: 'Penginapan' },
  { value: 'UANG_REPRESENTASI', label: 'Uang Representasi' },
  { value: 'LAINNYA', label: 'Biaya Lainnya' },
]

// Satuan
export const SATUAN = [
  { value: 'unit', label: 'Unit' },
  { value: 'buah', label: 'Buah' },
  { value: 'set', label: 'Set' },
  { value: 'paket', label: 'Paket' },
  { value: 'lembar', label: 'Lembar' },
  { value: 'rim', label: 'Rim' },
  { value: 'box', label: 'Box' },
  { value: 'dus', label: 'Dus' },
  { value: 'roll', label: 'Roll' },
  { value: 'meter', label: 'Meter' },
  { value: 'm2', label: 'M²' },
  { value: 'm3', label: 'M³' },
  { value: 'kg', label: 'Kg' },
  { value: 'liter', label: 'Liter' },
  { value: 'hari', label: 'Hari' },
  { value: 'bulan', label: 'Bulan' },
  { value: 'tahun', label: 'Tahun' },
  { value: 'orang', label: 'Orang' },
  { value: 'OK', label: 'Orang/Kegiatan' },
  { value: 'OH', label: 'Orang/Hari' },
  { value: 'OB', label: 'Orang/Bulan' },
  { value: 'OT', label: 'Orang/Tahun' },
  { value: 'ls', label: 'Lumpsum' },
]

// Kategori Upload Lampiran
export const KATEGORI_LAMPIRAN = [
  { value: 'BUKTI_SURVEY', label: 'Bukti Survey Harga' },
  { value: 'DOKUMEN_PENYEDIA', label: 'Dokumen Penyedia' },
  { value: 'FOTO_BARANG', label: 'Foto Barang' },
  { value: 'BERITA_ACARA', label: 'Berita Acara' },
  { value: 'SURAT', label: 'Surat' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

// PPN Rate
export const PPN_RATE = 0.11 // 11%

// PPh Rates
export const PPH_RATES = {
  PPH_21: 0.025, // 2.5%
  PPH_22: 0.015, // 1.5%
  PPH_23: 0.02, // 2%
}

// Batas Nilai Pengadaan Langsung
export const BATAS_PENGADAAN_LANGSUNG = {
  Barang: 200000000, // 200 juta
  Jasa: 200000000, // 200 juta
  Konstruksi: 200000000, // 200 juta
  Konsultan: 100000000, // 100 juta
}

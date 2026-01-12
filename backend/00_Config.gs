/**
 * 00_Config.gs
 * Global Configuration and Constants
 */

// ========================================
// SPREADSHEET CONFIGURATION
// ========================================

const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '';

// ========================================
// JENIS PERJALANAN DINAS
// ========================================

const JENIS_PD = {
  DALAM_KOTA: 'DALAM_KOTA',
  LUAR_KOTA: 'LUAR_KOTA'
};

const JENIS_PD_LABELS = {
  DALAM_KOTA: 'Perjalanan Dinas Dalam Kota',
  LUAR_KOTA: 'Perjalanan Dinas Luar Kota'
};

// ========================================
// STATUS PERJALANAN DINAS
// ========================================

const PD_STATUS_DALAM_KOTA = {
  DRAFT: 'DRAFT',
  SURAT_TUGAS: 'SURAT_TUGAS',
  PELAKSANAAN: 'PELAKSANAAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL'
};

const PD_STATUS_LUAR_KOTA = {
  DRAFT: 'DRAFT',
  SURAT_TUGAS: 'SURAT_TUGAS',
  SPPD: 'SPPD',
  PELAKSANAAN: 'PELAKSANAAN',
  PELAPORAN: 'PELAPORAN',
  PERTANGGUNGJAWABAN: 'PERTANGGUNGJAWABAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL'
};

const PD_STATUS = PD_STATUS_LUAR_KOTA;

const PD_STATUS_LABELS = {
  DRAFT: 'Draft',
  SURAT_TUGAS: 'Surat Tugas',
  SPPD: 'SPPD Terbit',
  PELAKSANAAN: 'Dalam Pelaksanaan',
  PELAPORAN: 'Pelaporan',
  PERTANGGUNGJAWABAN: 'Pertanggungjawaban',
  SELESAI: 'Selesai',
  BATAL: 'Dibatalkan'
};

// ========================================
// STATUS PAKET
// ========================================

const PAKET_STATUS = {
  DRAFT: 'DRAFT',
  PERENCANAAN: 'PERENCANAAN',
  SURVEY_HARGA: 'SURVEY_HARGA',
  HPS: 'HPS',
  PENGADAAN: 'PENGADAAN',
  KONTRAK: 'KONTRAK',
  PELAKSANAAN: 'PELAKSANAAN',
  SERAH_TERIMA: 'SERAH_TERIMA',
  PEMBAYARAN: 'PEMBAYARAN',
  SELESAI: 'SELESAI',
  BATAL: 'BATAL'
};

const PAKET_STATUS_LABELS = {
  DRAFT: 'Draft',
  PERENCANAAN: 'Perencanaan',
  SURVEY_HARGA: 'Survey Harga',
  HPS: 'Penyusunan HPS',
  PENGADAAN: 'Proses Pengadaan',
  KONTRAK: 'Kontrak',
  PELAKSANAAN: 'Pelaksanaan',
  SERAH_TERIMA: 'Serah Terima',
  PEMBAYARAN: 'Pembayaran',
  SELESAI: 'Selesai',
  BATAL: 'Dibatalkan'
};

// ========================================
// METODE PENGADAAN
// ========================================

const METODE_PENGADAAN = {
  PENGADAAN_LANGSUNG: 'Pengadaan Langsung',
  PENUNJUKAN_LANGSUNG: 'Penunjukan Langsung',
  TENDER: 'Tender',
  SELEKSI: 'Seleksi',
  E_PURCHASING: 'E-Purchasing'
};

// ========================================
// JENIS PENGADAAN
// ========================================

const JENIS_PENGADAAN = {
  BARANG: 'Barang',
  PEKERJAAN_KONSTRUKSI: 'Pekerjaan Konstruksi',
  JASA_KONSULTANSI: 'Jasa Konsultansi',
  JASA_LAINNYA: 'Jasa Lainnya'
};

// ========================================
// TINGKAT BIAYA PD
// ========================================

const TINGKAT_BIAYA = {
  A: 'Tingkat A (Pejabat Eselon II ke atas)',
  B: 'Tingkat B (Pejabat Eselon III / Gol IV)',
  C: 'Tingkat C (Pejabat Eselon IV / Gol III)',
  D: 'Tingkat D (PNS Gol II ke bawah)'
};

// ========================================
// JENIS TRANSPORTASI
// ========================================

const JENIS_TRANSPORTASI = {
  PESAWAT: 'Pesawat',
  KERETA: 'Kereta Api',
  BUS: 'Bus',
  KAPAL: 'Kapal Laut',
  KENDARAAN_DINAS: 'Kendaraan Dinas',
  KENDARAAN_PRIBADI: 'Kendaraan Pribadi'
};

// ========================================
// JENIS BIAYA PD
// ========================================

const JENIS_BIAYA_PD = {
  UANG_HARIAN: 'Uang Harian',
  TRANSPORT_LOKAL: 'Transport Lokal',
  TIKET_PESAWAT: 'Tiket Pesawat',
  TIKET_KERETA: 'Tiket Kereta',
  TIKET_BUS: 'Tiket Bus/Travel',
  BBM: 'BBM Kendaraan',
  TOL: 'Tol',
  PARKIR: 'Parkir',
  PENGINAPAN: 'Penginapan/Hotel',
  REPRESENTASI: 'Uang Representasi',
  LAINNYA: 'Biaya Lainnya'
};

// ========================================
// KATEGORI LAMPIRAN
// ========================================

const KATEGORI_LAMPIRAN_PD = {
  SURAT_TUGAS: 'Surat Tugas (TTD)',
  SPPD: 'SPPD (TTD)',
  UNDANGAN: 'Undangan/Surat Panggilan',
  TIKET: 'Tiket Perjalanan',
  BOARDING_PASS: 'Boarding Pass',
  HOTEL: 'Bukti Hotel/Penginapan',
  KWITANSI: 'Kwitansi/Struk',
  FOTO_KEGIATAN: 'Foto Kegiatan',
  DAFTAR_HADIR: 'Daftar Hadir',
  LAPORAN: 'Laporan Perjalanan',
  SERTIFIKAT: 'Sertifikat',
  MATERI: 'Materi Kegiatan',
  LAINNYA: 'Lainnya'
};

const KATEGORI_LAMPIRAN_PAKET = {
  KAK: 'Kerangka Acuan Kerja (KAK)',
  SPESIFIKASI: 'Spesifikasi Teknis',
  RAB: 'Rencana Anggaran Biaya',
  HPS: 'HPS',
  SURVEY: 'Bukti Survey Harga',
  KONTRAK: 'Dokumen Kontrak',
  BAST: 'Berita Acara Serah Terima',
  INVOICE: 'Invoice/Tagihan',
  KWITANSI: 'Kwitansi',
  SPK: 'Surat Perintah Kerja',
  LAINNYA: 'Lainnya'
};

// ========================================
// CONFIG SERVICE
// ========================================

const ConfigService = {
  getConfig: function() {
    const sheet = getSpreadsheet().getSheetByName('Config');
    if (!sheet) {
      return this.getDefaultConfig();
    }

    const data = sheet.getDataRange().getValues();
    const config = {};

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        config[data[i][0]] = data[i][1];
      }
    }

    return { ...this.getDefaultConfig(), ...config };
  },

  getDefaultConfig: function() {
    return {
      namaSatker: 'Nama Satuan Kerja',
      kodeSatker: '',
      alamatSatker: 'Alamat Satuan Kerja',
      kotaSatker: 'Malang',
      teleponSatker: '',
      emailSatker: '',
      namaPPK: 'Nama PPK',
      nipPPK: '',
      jabatanPPK: 'Pejabat Pembuat Komitmen',
      namaBendahara: '',
      nipBendahara: '',
      namaKPA: '',
      nipKPA: '',
      jabatanKPA: 'Kuasa Pengguna Anggaran',
      tahunAnggaran: new Date().getFullYear().toString(),
      ppnRate: '11',
      pphRate: '2'
    };
  },

  updateConfig: function(data) {
    setupConfigSheet();
    const sheet = getSpreadsheet().getSheetByName('Config');

    Object.keys(data).forEach(key => {
      const rows = sheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(data[key]);
          found = true;
          break;
        }
      }

      if (!found) {
        sheet.appendRow([key, data[key]]);
      }
    });

    return this.getConfig();
  }
};

function setupConfigSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('Config');

  if (!sheet) {
    sheet = ss.insertSheet('Config');
    sheet.getRange(1, 1, 1, 3).setValues([['key', 'value', 'description']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setFrozenRows(1);

    // Add default config
    const defaults = ConfigService.getDefaultConfig();
    Object.keys(defaults).forEach(key => {
      sheet.appendRow([key, defaults[key], '']);
    });
  }

  return sheet;
}

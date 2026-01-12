/**
 * 16_DocumentTemplates.gs
 * Document Templates and Data Mapping
 */

// ========================================
// DOCUMENT TYPES REGISTRY
// ========================================

const DOCUMENT_TYPES = {
  // Paket Documents
  KAK: { name: 'Kerangka Acuan Kerja', category: 'PAKET', stage: 'PERENCANAAN' },
  RAB: { name: 'Rencana Anggaran Biaya', category: 'PAKET', stage: 'PERENCANAAN' },
  SPEK: { name: 'Spesifikasi Teknis', category: 'PAKET', stage: 'PERENCANAAN' },
  HPS: { name: 'Harga Perkiraan Sendiri', category: 'PAKET', stage: 'HPS' },
  SPP: { name: 'Surat Permintaan Penawaran', category: 'PAKET', stage: 'PENGADAAN' },
  BA_NEGO: { name: 'Berita Acara Negosiasi', category: 'PAKET', stage: 'PENGADAAN' },
  BAHP: { name: 'Berita Acara Hasil Pengadaan', category: 'PAKET', stage: 'PENGADAAN' },
  SPPY: { name: 'Surat Penunjukan Penyedia', category: 'PAKET', stage: 'PENGADAAN' },
  SPK: { name: 'Surat Perintah Kerja', category: 'PAKET', stage: 'KONTRAK' },
  KONTRAK: { name: 'Surat Perjanjian', category: 'PAKET', stage: 'KONTRAK' },
  SPMK: { name: 'Surat Perintah Mulai Kerja', category: 'PAKET', stage: 'PELAKSANAAN' },
  BAP: { name: 'Berita Acara Pemeriksaan', category: 'PAKET', stage: 'SERAH_TERIMA' },
  BAST: { name: 'Berita Acara Serah Terima', category: 'PAKET', stage: 'SERAH_TERIMA' },
  KUITANSI: { name: 'Kuitansi Pembayaran', category: 'PAKET', stage: 'PEMBAYARAN' },
  SPP_BAYAR: { name: 'Surat Permintaan Pembayaran', category: 'PAKET', stage: 'PEMBAYARAN' },

  // PD Documents
  ST: { name: 'Surat Tugas', category: 'PD', stage: 'SURAT_TUGAS' },
  SPPD: { name: 'Surat Perintah Perjalanan Dinas', category: 'PD', stage: 'SPPD' },
  RINCIAN_PD: { name: 'Rincian Biaya Perjalanan Dinas', category: 'PD', stage: 'PERTANGGUNGJAWABAN' },
  KUITANSI_RAMPUNG: { name: 'Kuitansi Rampung', category: 'PD', stage: 'PERTANGGUNGJAWABAN' },
  DPR: { name: 'Daftar Pengeluaran Riil', category: 'PD', stage: 'PERTANGGUNGJAWABAN' },
  LAPORAN_PD: { name: 'Laporan Perjalanan Dinas', category: 'PD', stage: 'PELAPORAN' }
};

// ========================================
// DATA MAPPING FOR PAKET DOCUMENTS
// ========================================

const PAKET_DOCUMENT_MAPPINGS = {

  // ==================== HPS ====================
  HPS: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'generated', format: 'HPS/{NO}/{UNIT}/{YEAR}' },
      { field: 'tanggalDokumen', source: 'generated', format: 'date' },
      { field: 'tahunAnggaran', source: 'config.tahunAnggaran' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'alamatSatker', source: 'config.alamatSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // Paket Info
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'jenisPengadaan', source: 'paket.jenisPengadaan', transform: 'JENIS_PENGADAAN' },
      { field: 'metodePengadaan', source: 'paket.metodePengadaan', transform: 'METODE_PENGADAAN' },
      { field: 'paguAnggaran', source: 'paket.paguAnggaran', format: 'currency' },
      { field: 'sumberDana', source: 'paket.sumberDana' },
      { field: 'mak', source: 'paket.mak' },

      // Items (array)
      { field: 'items', source: 'paket.items', type: 'array', mapping: {
        namaBarang: 'namaBarang',
        spesifikasi: 'spesifikasi',
        satuan: 'satuan',
        volume: 'volume',
        hargaSatuan: { source: 'hargaSatuan', format: 'currency' },
        totalHarga: { source: 'hargaTotal', format: 'currency' }
      }},

      // Totals
      { field: 'subtotal', source: 'calculated.subtotal', format: 'currency' },
      { field: 'ppnRate', source: 'config.ppnRate' },
      { field: 'ppn', source: 'calculated.ppn', format: 'currency' },
      { field: 'total', source: 'calculated.total', format: 'currency' },
      { field: 'terbilang', source: 'calculated.total', transform: 'terbilang' },

      // Signature
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'jabatanPPK', source: 'config.jabatanPPK' }
    ]
  },

  // ==================== SPK ====================
  SPK: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'kontrak.nomorKontrak', fallback: 'generated' },
      { field: 'tanggalDokumen', source: 'kontrak.tanggalKontrak', fallback: 'generated' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'alamatSatker', source: 'config.alamatSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // PPK Info (Pihak Pertama)
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'jabatanPPK', source: 'config.jabatanPPK' },

      // Penyedia Info (Pihak Kedua)
      { field: 'namaPenyedia', source: 'kontrak.namaPenyedia', fallback: 'paket.namaPenyedia' },
      { field: 'alamatPenyedia', source: 'kontrak.alamatPenyedia' },
      { field: 'npwpPenyedia', source: 'kontrak.npwpPenyedia' },
      { field: 'direkturPenyedia', source: 'kontrak.direkturPenyedia' },

      // Paket Info
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'nilaiKontrak', source: 'kontrak.nilaiKontrak', format: 'currency' },
      { field: 'nilaiKontrakTerbilang', source: 'kontrak.nilaiKontrak', transform: 'terbilang' },
      { field: 'jangkaWaktu', source: 'kontrak.jangkaWaktu' },
      { field: 'tanggalMulai', source: 'kontrak.tanggalMulai', format: 'date' },
      { field: 'tanggalSelesai', source: 'kontrak.tanggalSelesai', format: 'date' },
      { field: 'sumberDana', source: 'paket.sumberDana' },

      // Items
      { field: 'items', source: 'paket.items', type: 'array', mapping: {
        namaBarang: 'namaBarang',
        satuan: 'satuan',
        volume: 'volume',
        hargaSatuan: { source: 'hargaSatuan', format: 'currency' },
        totalHarga: { source: 'hargaTotal', format: 'currency' }
      }}
    ]
  },

  // ==================== BAST ====================
  BAST: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'serahTerima.nomorBA', fallback: 'generated' },
      { field: 'tanggalDokumen', source: 'serahTerima.tanggalBA', fallback: 'generated' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // PPK Info
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'jabatanPPK', source: 'config.jabatanPPK' },

      // Penyedia Info
      { field: 'namaPenyedia', source: 'kontrak.namaPenyedia' },
      { field: 'direkturPenyedia', source: 'kontrak.direkturPenyedia' },

      // Kontrak Reference
      { field: 'nomorKontrak', source: 'kontrak.nomorKontrak' },
      { field: 'tanggalKontrak', source: 'kontrak.tanggalKontrak', format: 'date' },
      { field: 'nilaiKontrak', source: 'kontrak.nilaiKontrak', format: 'currency' },

      // Paket Info
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'persentaseSelesai', source: 'serahTerima.persentase', default: 100 },
      { field: 'nilaiPekerjaan', source: 'serahTerima.nilaiPekerjaan', format: 'currency' },
      { field: 'keterangan', source: 'serahTerima.keterangan' }
    ]
  },

  // ==================== KUITANSI ====================
  KUITANSI: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'generated', format: 'KW/{NO}/{YEAR}' },
      { field: 'tanggalDokumen', source: 'pembayaran.tanggalBayar', fallback: 'generated' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // Paket Info
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'nomorKontrak', source: 'kontrak.nomorKontrak' },

      // Payment Info
      { field: 'termin', source: 'pembayaran.termin' },
      { field: 'nilaiTagihan', source: 'pembayaran.nilaiTagihan', format: 'currency' },
      { field: 'nilaiPPN', source: 'pembayaran.nilaiPPN', format: 'currency' },
      { field: 'nilaiPPH', source: 'pembayaran.nilaiPPH', format: 'currency' },
      { field: 'nilaiNetto', source: 'pembayaran.nilaiNetto', format: 'currency' },
      { field: 'nilaiNettoTerbilang', source: 'pembayaran.nilaiNetto', transform: 'terbilang' },

      // Penyedia Info
      { field: 'namaPenyedia', source: 'kontrak.namaPenyedia' },
      { field: 'direkturPenyedia', source: 'kontrak.direkturPenyedia' },

      // Signatures
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'namaBendahara', source: 'config.namaBendahara' },
      { field: 'nipBendahara', source: 'config.nipBendahara' }
    ]
  },

  // ==================== BA NEGOSIASI ====================
  BA_NEGO: {
    templateFields: [
      { field: 'nomorDokumen', source: 'generated' },
      { field: 'tanggalDokumen', source: 'generated', format: 'date' },
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'metodePengadaan', source: 'paket.metodePengadaan', transform: 'METODE_PENGADAAN' },
      { field: 'namaPenyedia', source: 'paket.namaPenyedia' },
      { field: 'nilaiHPS', source: 'paket.nilaiHPS', format: 'currency' },
      { field: 'nilaiNegosiasi', source: 'paket.nilaiKontrak', format: 'currency' },
      { field: 'selisih', source: 'calculated.selisih', format: 'currency' }
    ]
  },

  // ==================== SPMK ====================
  SPMK: {
    templateFields: [
      { field: 'nomorDokumen', source: 'generated', format: 'SPMK/{NO}/{UNIT}/{YEAR}' },
      { field: 'tanggalDokumen', source: 'kontrak.tanggalMulai', fallback: 'generated' },
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' },
      { field: 'jabatanPPK', source: 'config.jabatanPPK' },
      { field: 'namaPenyedia', source: 'kontrak.namaPenyedia' },
      { field: 'direkturPenyedia', source: 'kontrak.direkturPenyedia' },
      { field: 'namaPaket', source: 'paket.namaPaket' },
      { field: 'nomorKontrak', source: 'kontrak.nomorKontrak' },
      { field: 'tanggalKontrak', source: 'kontrak.tanggalKontrak', format: 'date' },
      { field: 'tanggalMulai', source: 'kontrak.tanggalMulai', format: 'date' },
      { field: 'tanggalSelesai', source: 'kontrak.tanggalSelesai', format: 'date' },
      { field: 'jangkaWaktu', source: 'kontrak.jangkaWaktu' }
    ]
  }
};

// ========================================
// DATA MAPPING FOR PD DOCUMENTS
// ========================================

const PD_DOCUMENT_MAPPINGS = {

  // ==================== SURAT TUGAS ====================
  ST: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'pd.nomorST', fallback: 'generated' },
      { field: 'tanggalDokumen', source: 'pd.tanggalST', fallback: 'generated' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'alamatSatker', source: 'config.alamatSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // Pemberi Perintah
      { field: 'pejabatPerintah', source: 'pd.pejabatPerintah', fallback: 'config.namaPPK' },
      { field: 'nipPejabatPerintah', source: 'pd.nipPejabatPerintah', fallback: 'config.nipPPK' },
      { field: 'jabatanPejabatPerintah', source: 'pd.jabatanPejabatPerintah', fallback: 'config.jabatanPPK' },

      // Pelaksana (first one for single, all for list)
      { field: 'pelaksana', source: 'pd.pelaksana', type: 'array', mapping: {
        nama: 'nama',
        nip: 'nip',
        pangkat: 'pangkat',
        golongan: 'golongan',
        jabatan: 'jabatan',
        instansi: 'instansi'
      }},

      // Trip Info
      { field: 'maksudTujuan', source: 'pd.maksudTujuan', fallback: 'pd.tujuan' },
      { field: 'tujuan', source: 'pd.tujuan' },
      { field: 'kotaTujuan', source: 'pd.kotaTujuan' },
      { field: 'tanggalBerangkat', source: 'pd.tanggalBerangkat', format: 'date' },
      { field: 'tanggalKembali', source: 'pd.tanggalKembali', format: 'date' },
      { field: 'lamaHari', source: 'pd.lamaHari' },
      { field: 'jenisTransportasi', source: 'pd.jenisTransportasi', transform: 'JENIS_TRANSPORTASI' }
    ]
  },

  // ==================== SPPD ====================
  SPPD: {
    templateFields: [
      // Header
      { field: 'nomorDokumen', source: 'pd.nomorSPPD', fallback: 'generated' },
      { field: 'tanggalDokumen', source: 'pd.tanggalSPPD', fallback: 'generated' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // Pemberi Perintah
      { field: 'pejabatPerintah', source: 'pd.pejabatPerintah', fallback: 'config.namaPPK' },
      { field: 'nipPejabatPerintah', source: 'pd.nipPejabatPerintah', fallback: 'config.nipPPK' },

      // Pelaksana Utama
      { field: 'namaPelaksana', source: 'pd.pelaksana[0].nama' },
      { field: 'nipPelaksana', source: 'pd.pelaksana[0].nip' },
      { field: 'pangkatPelaksana', source: 'pd.pelaksana[0].pangkat' },
      { field: 'golonganPelaksana', source: 'pd.pelaksana[0].golongan' },
      { field: 'jabatanPelaksana', source: 'pd.pelaksana[0].jabatan' },
      { field: 'tingkatBiaya', source: 'pd.tingkatBiaya' },

      // Pengikut (if any)
      { field: 'pengikut', source: 'pd.pelaksana', type: 'array', skip: 1, mapping: {
        nama: 'nama',
        nip: 'nip',
        keterangan: 'jabatan'
      }},

      // Trip Info
      { field: 'maksudTujuan', source: 'pd.maksudTujuan' },
      { field: 'tempatBerangkat', source: 'pd.tempatBerangkat', fallback: 'config.kotaSatker' },
      { field: 'tujuan', source: 'pd.tujuan' },
      { field: 'kotaTujuan', source: 'pd.kotaTujuan' },
      { field: 'tanggalBerangkat', source: 'pd.tanggalBerangkat', format: 'date' },
      { field: 'tanggalKembali', source: 'pd.tanggalKembali', format: 'date' },
      { field: 'lamaHari', source: 'pd.lamaHari' },
      { field: 'jenisTransportasi', source: 'pd.jenisTransportasi', transform: 'JENIS_TRANSPORTASI' },

      // Pembebanan
      { field: 'instansiPembebanan', source: 'pd.instansiPembebanan', fallback: 'config.namaSatker' },
      { field: 'akun', source: 'pd.akun' },
      { field: 'keterangan', source: 'pd.keterangan' }
    ]
  },

  // ==================== KUITANSI RAMPUNG ====================
  KUITANSI_RAMPUNG: {
    templateFields: [
      // Header
      { field: 'nomorSPPD', source: 'pd.nomorSPPD' },
      { field: 'tanggalSPPD', source: 'pd.tanggalSPPD', format: 'date' },

      // Satker Info
      { field: 'namaSatker', source: 'config.namaSatker' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },

      // Pelaksana
      { field: 'namaPelaksana', source: 'pd.pelaksana[0].nama' },
      { field: 'nipPelaksana', source: 'pd.pelaksana[0].nip' },

      // Biaya (array)
      { field: 'biaya', source: 'pd.biaya', type: 'array', mapping: {
        jenisBiaya: { source: 'jenisBiaya', transform: 'JENIS_BIAYA_PD' },
        keterangan: 'keterangan',
        jumlah: 'jumlah',
        satuan: 'satuan',
        hargaSatuan: { source: 'hargaSatuan', format: 'currency' },
        total: { source: 'total', format: 'currency' }
      }},

      // Totals
      { field: 'totalBiaya', source: 'pd.totalBiaya', format: 'currency' },
      { field: 'totalBiayaTerbilang', source: 'pd.totalBiaya', transform: 'terbilang' },

      // Signatures
      { field: 'namaBendahara', source: 'config.namaBendahara' },
      { field: 'nipBendahara', source: 'config.nipBendahara' }
    ]
  },

  // ==================== DAFTAR PENGELUARAN RIIL ====================
  DPR: {
    templateFields: [
      { field: 'nomorSPPD', source: 'pd.nomorSPPD' },
      { field: 'tanggalSPPD', source: 'pd.tanggalSPPD', format: 'date' },
      { field: 'kotaSatker', source: 'config.kotaSatker' },
      { field: 'namaPelaksana', source: 'pd.pelaksana[0].nama' },
      { field: 'nipPelaksana', source: 'pd.pelaksana[0].nip' },
      { field: 'jabatanPelaksana', source: 'pd.pelaksana[0].jabatan' },

      // Only riil expenses (transport lokal, BBM, tol, parkir, etc)
      { field: 'pengeluaranRiil', source: 'pd.biaya', type: 'array',
        filter: { field: 'jenisBiaya', in: ['TRANSPORT_LOKAL', 'BBM', 'TOL', 'PARKIR', 'LAINNYA'] },
        mapping: {
          uraian: { source: 'jenisBiaya', transform: 'JENIS_BIAYA_PD' },
          keterangan: 'keterangan',
          jumlah: { source: 'total', format: 'currency' }
        }
      },

      { field: 'totalPengeluaranRiil', source: 'calculated.totalRiil', format: 'currency' },
      { field: 'namaPPK', source: 'config.namaPPK' },
      { field: 'nipPPK', source: 'config.nipPPK' }
    ]
  }
};

// ========================================
// DOCUMENT MAPPING SERVICE
// ========================================

const DocumentMappingService = {

  // Get mapping for document type
  getMapping: function(docType) {
    if (PAKET_DOCUMENT_MAPPINGS[docType]) {
      return { category: 'PAKET', mapping: PAKET_DOCUMENT_MAPPINGS[docType] };
    }
    if (PD_DOCUMENT_MAPPINGS[docType]) {
      return { category: 'PD', mapping: PD_DOCUMENT_MAPPINGS[docType] };
    }
    return null;
  },

  // Resolve field value from source path
  resolveValue: function(source, data, config) {
    if (!source) return null;

    // Handle array index notation: pd.pelaksana[0].nama
    const arrayMatch = source.match(/^(.+)\[(\d+)\]\.(.+)$/);
    if (arrayMatch) {
      const [, arrayPath, index, field] = arrayMatch;
      const arr = this.getNestedValue(data, arrayPath);
      if (Array.isArray(arr) && arr[parseInt(index)]) {
        return arr[parseInt(index)][field];
      }
      return null;
    }

    // Handle nested paths
    if (source.startsWith('config.')) {
      return this.getNestedValue(config, source.replace('config.', ''));
    }

    if (source.startsWith('calculated.')) {
      return this.getNestedValue(data._calculated || {}, source.replace('calculated.', ''));
    }

    return this.getNestedValue(data, source);
  },

  // Get nested value from object using dot notation
  getNestedValue: function(obj, path) {
    if (!obj || !path) return null;
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  },

  // Transform value based on transform type
  transformValue: function(value, transform) {
    if (!transform || value === null || value === undefined) return value;

    switch (transform) {
      case 'terbilang':
        return terbilangClean(value) + ' rupiah';

      case 'JENIS_PENGADAAN':
        return JENIS_PENGADAAN[value] || value;

      case 'METODE_PENGADAAN':
        return METODE_PENGADAAN[value] || value;

      case 'JENIS_TRANSPORTASI':
        return JENIS_TRANSPORTASI[value] || value;

      case 'JENIS_BIAYA_PD':
        return JENIS_BIAYA_PD[value] || value;

      case 'PAKET_STATUS':
        return PAKET_STATUS_LABELS[value] || value;

      case 'PD_STATUS':
        return PD_STATUS_LABELS[value] || value;

      default:
        return value;
    }
  },

  // Format value based on format type
  formatValue: function(value, format) {
    if (!format || value === null || value === undefined) return value;

    switch (format) {
      case 'currency':
        return formatRupiahDoc(value);

      case 'date':
        return formatTanggalIndo(value);

      case 'number':
        return String(value);

      default:
        return value;
    }
  },

  // Build document data from mapping
  buildDocumentData: function(docType, entityData, config) {
    const mappingInfo = this.getMapping(docType);
    if (!mappingInfo) {
      return { success: false, error: 'Mapping tidak ditemukan untuk: ' + docType };
    }

    const mapping = mappingInfo.mapping;
    const result = {};

    mapping.templateFields.forEach(fieldDef => {
      let value = null;

      // Resolve source value
      if (fieldDef.source === 'generated') {
        if (fieldDef.format && fieldDef.format.includes('{NO}')) {
          const numResult = NumberingService.generateNumber(docType);
          value = numResult.success ? numResult.data.number : '';
        } else if (fieldDef.format === 'date') {
          value = formatTanggalIndo(getTimestamp());
        } else {
          value = getTimestamp();
        }
      } else {
        value = this.resolveValue(fieldDef.source, entityData, config);

        // Try fallback if value is null
        if ((value === null || value === undefined || value === '') && fieldDef.fallback) {
          if (fieldDef.fallback === 'generated') {
            const numResult = NumberingService.generateNumber(docType);
            value = numResult.success ? numResult.data.number : '';
          } else {
            value = this.resolveValue(fieldDef.fallback, entityData, config);
          }
        }

        // Use default if still null
        if ((value === null || value === undefined) && fieldDef.default !== undefined) {
          value = fieldDef.default;
        }
      }

      // Handle array type
      if (fieldDef.type === 'array' && Array.isArray(value)) {
        let items = value;

        // Apply skip (for pengikut - skip first pelaksana)
        if (fieldDef.skip) {
          items = items.slice(fieldDef.skip);
        }

        // Apply filter
        if (fieldDef.filter) {
          items = items.filter(item => {
            if (fieldDef.filter.in) {
              return fieldDef.filter.in.includes(item[fieldDef.filter.field]);
            }
            return true;
          });
        }

        // Map items
        if (fieldDef.mapping) {
          value = items.map(item => {
            const mappedItem = {};
            Object.entries(fieldDef.mapping).forEach(([key, src]) => {
              if (typeof src === 'object') {
                let itemValue = item[src.source];
                if (src.transform) {
                  itemValue = this.transformValue(itemValue, src.transform);
                }
                if (src.format) {
                  itemValue = this.formatValue(itemValue, src.format);
                }
                mappedItem[key] = itemValue;
              } else {
                mappedItem[key] = item[src];
              }
            });
            return mappedItem;
          });
        }
      } else {
        // Apply transform
        if (fieldDef.transform) {
          value = this.transformValue(value, fieldDef.transform);
        }

        // Apply format
        if (fieldDef.format && fieldDef.format !== 'date') {
          value = this.formatValue(value, fieldDef.format);
        }
      }

      result[fieldDef.field] = value;
    });

    return { success: true, data: result };
  }
};

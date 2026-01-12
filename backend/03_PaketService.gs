/**
 * 03_PaketService.gs
 * Paket Pengadaan Service
 */

// ========================================
// SHEET SETUP
// ========================================

function setupPaketSheets() {
  const ss = getSpreadsheet();

  // Main Paket sheet
  const paketHeaders = [
    'paketId', 'namaPaket', 'jenisPengadaan', 'metodePengadaan', 'paguAnggaran',
    'nilaiHPS', 'nilaiKontrak', 'sumberDana', 'mak', 'tahunAnggaran',
    'tanggalPengadaan', 'tanggalKontrak', 'tanggalSelesai',
    'penyediaId', 'namaPenyedia',
    'status', 'progress', 'keterangan',
    'createdAt', 'updatedAt', 'createdBy'
  ];
  ensureSheet('Paket', paketHeaders);

  // Items sheet
  const itemHeaders = [
    'itemId', 'paketId', 'namaBarang', 'spesifikasi', 'satuan',
    'volume', 'hargaSatuan', 'hargaTotal', 'kategori', 'urutan',
    'createdAt', 'updatedAt'
  ];
  ensureSheet('Items', itemHeaders);

  // Surveys sheet
  const surveyHeaders = [
    'surveyId', 'itemId', 'paketId', 'namaPenyedia', 'alamatPenyedia',
    'kontakPenyedia', 'hargaPenawaran', 'tanggalSurvey', 'keterangan',
    'isSelected', 'createdAt'
  ];
  ensureSheet('Surveys', surveyHeaders);

  // LampiranPaket sheet
  const lampiranHeaders = [
    'lampiranId', 'paketId', 'filename', 'mimeType', 'fileSize',
    'googleFileId', 'googleFileUrl', 'kategori', 'keterangan',
    'uploadedAt', 'uploadedBy'
  ];
  ensureSheet('LampiranPaket', lampiranHeaders);

  // DokumenPaket sheet
  const dokumenHeaders = [
    'docId', 'paketId', 'jenisDokumen', 'nomorDokumen', 'tanggalDokumen',
    'googleDocId', 'googleDocUrl', 'status', 'createdAt', 'createdBy'
  ];
  ensureSheet('DokumenPaket', dokumenHeaders);

  // Kontrak sheet
  const kontrakHeaders = [
    'kontrakId', 'paketId', 'nomorKontrak', 'tanggalKontrak', 'nilaiKontrak',
    'tanggalMulai', 'tanggalSelesai', 'jangkaWaktu', 'penyediaId', 'namaPenyedia',
    'alamatPenyedia', 'npwpPenyedia', 'direkturPenyedia',
    'status', 'createdAt', 'updatedAt'
  ];
  ensureSheet('Kontrak', kontrakHeaders);

  // Pembayaran sheet
  const pembayaranHeaders = [
    'pembayaranId', 'paketId', 'kontrakId', 'termin', 'nilaiTagihan',
    'nilaiPPN', 'nilaiPPH', 'nilaiNetto', 'tanggalTagihan', 'tanggalBayar',
    'nomorSPM', 'nomorSP2D', 'status', 'keterangan', 'createdAt', 'updatedAt'
  ];
  ensureSheet('Pembayaran', pembayaranHeaders);

  // SerahTerima sheet
  const serahTerimaHeaders = [
    'serahTerimaId', 'paketId', 'kontrakId', 'jenisBA', 'nomorBA',
    'tanggalBA', 'persentase', 'nilaiPekerjaan', 'keterangan',
    'googleDocId', 'googleDocUrl', 'status', 'createdAt'
  ];
  ensureSheet('SerahTerima', serahTerimaHeaders);

  return { success: true, message: 'Paket sheets created successfully' };
}

// ========================================
// PAKET SERVICE
// ========================================

const PaketService = {

  // ==================== LIST ====================
  list: function(filters = {}) {
    const rows = getAllRows('Paket');

    let results = rows.map(p => ({
      ...p,
      id: p.paketId,
      statusLabel: PAKET_STATUS_LABELS[p.status] || p.status,
      itemCount: ItemService.countByPaket(p.paketId)
    }));

    // Apply filters
    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }
    if (filters.tahunAnggaran) {
      results = results.filter(p => p.tahunAnggaran === filters.tahunAnggaran);
    }
    if (filters.jenisPengadaan) {
      results = results.filter(p => p.jenisPengadaan === filters.jenisPengadaan);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(p =>
        (p.namaPaket || '').toLowerCase().includes(search) ||
        (p.namaPenyedia || '').toLowerCase().includes(search)
      );
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ==================== GET BY ID ====================
  getById: function(paketId) {
    const paket = getRowById('Paket', paketId);
    if (!paket) return null;

    paket.id = paket.paketId;
    paket.statusLabel = PAKET_STATUS_LABELS[paket.status] || paket.status;
    paket.items = ItemService.getByPaket(paketId);
    paket.lampiran = this.getLampiran(paketId);
    paket.dokumen = this.getDokumen(paketId);
    paket.kontrak = this.getKontrak(paketId);
    paket.pembayaran = this.getPembayaran(paketId);
    paket.serahTerima = this.getSerahTerima(paketId);

    return paket;
  },

  // ==================== CREATE ====================
  create: function(data) {
    setupPaketSheets();

    const paketId = generateId('PKT');
    const now = getTimestamp();
    const config = ConfigService.getConfig();

    const row = [
      paketId,
      data.namaPaket || '',
      data.jenisPengadaan || 'BARANG',
      data.metodePengadaan || 'PENGADAAN_LANGSUNG',
      data.paguAnggaran || 0,
      data.nilaiHPS || 0,
      data.nilaiKontrak || 0,
      data.sumberDana || '',
      data.mak || '',
      data.tahunAnggaran || config.tahunAnggaran || new Date().getFullYear().toString(),
      data.tanggalPengadaan || '',
      data.tanggalKontrak || '',
      data.tanggalSelesai || '',
      data.penyediaId || '',
      data.namaPenyedia || '',
      PAKET_STATUS.DRAFT,
      0,
      data.keterangan || '',
      now,
      now,
      data.createdBy || ''
    ];

    getSpreadsheet().getSheetByName('Paket').appendRow(row);
    return this.getById(paketId);
  },

  // ==================== UPDATE ====================
  update: function(paketId, data) {
    const allowedFields = [
      'namaPaket', 'jenisPengadaan', 'metodePengadaan', 'paguAnggaran',
      'nilaiHPS', 'nilaiKontrak', 'sumberDana', 'mak', 'tahunAnggaran',
      'tanggalPengadaan', 'tanggalKontrak', 'tanggalSelesai',
      'penyediaId', 'namaPenyedia', 'status', 'progress', 'keterangan'
    ];

    const result = updateRow('Paket', paketId, data, allowedFields);
    if (result) {
      return this.getById(paketId);
    }
    return null;
  },

  // ==================== DELETE ====================
  delete: function(paketId) {
    // Delete related data first
    ItemService.deleteByPaket(paketId);
    deleteRowsByColumn('LampiranPaket', 'paketId', paketId);
    deleteRowsByColumn('DokumenPaket', 'paketId', paketId);
    deleteRowsByColumn('Kontrak', 'paketId', paketId);
    deleteRowsByColumn('Pembayaran', 'paketId', paketId);
    deleteRowsByColumn('SerahTerima', 'paketId', paketId);

    return deleteRow('Paket', paketId);
  },

  // ==================== OPTIONS ====================
  getOptions: function() {
    return {
      status: Object.entries(PAKET_STATUS_LABELS).map(([value, label]) => ({ value, label })),
      jenisPengadaan: Object.entries(JENIS_PENGADAAN).map(([value, label]) => ({ value, label })),
      metodePengadaan: Object.entries(METODE_PENGADAAN).map(([value, label]) => ({ value, label })),
      kategoriLampiran: Object.entries(KATEGORI_LAMPIRAN_PAKET).map(([value, label]) => ({ value, label }))
    };
  },

  // ==================== LAMPIRAN ====================

  getLampiran: function(paketId) {
    const rows = getRowsByColumn('LampiranPaket', 'paketId', paketId);
    return rows.map(r => ({ ...r, id: r.lampiranId }));
  },

  addLampiran: function(paketId, data) {
    setupPaketSheets();

    const lampiranId = generateId('LMP');
    const now = getTimestamp();

    let googleFileId = '';
    let googleFileUrl = '';

    const fileData = data.base64Data || data.fileContent;

    if (fileData && data.filename) {
      const uploadResult = uploadFileToDrive('Lampiran_Paket', data.filename, fileData, data.mimeType);
      if (uploadResult) {
        googleFileId = uploadResult.fileId;
        googleFileUrl = uploadResult.fileUrl;
      }
    }

    const row = [
      lampiranId,
      paketId,
      data.filename || '',
      data.mimeType || '',
      data.fileSize || 0,
      googleFileId,
      googleFileUrl,
      data.kategori || 'LAINNYA',
      data.keterangan || '',
      now,
      data.uploadedBy || ''
    ];

    getSpreadsheet().getSheetByName('LampiranPaket').appendRow(row);

    return {
      lampiranId,
      id: lampiranId,
      paketId,
      filename: data.filename,
      googleFileId,
      googleFileUrl,
      kategori: data.kategori,
      uploadedAt: now
    };
  },

  deleteLampiran: function(lampiranId) {
    const row = getRowById('LampiranPaket', lampiranId);
    if (row && row.googleFileId) {
      deleteFileFromDrive(row.googleFileId);
    }
    return deleteRow('LampiranPaket', lampiranId);
  },

  // ==================== DOKUMEN ====================

  getDokumen: function(paketId) {
    const rows = getRowsByColumn('DokumenPaket', 'paketId', paketId);
    return rows.map(r => ({ ...r, id: r.docId }));
  },

  // ==================== KONTRAK ====================

  getKontrak: function(paketId) {
    const rows = getRowsByColumn('Kontrak', 'paketId', paketId);
    return rows.length > 0 ? { ...rows[0], id: rows[0].kontrakId } : null;
  },

  updateKontrak: function(paketId, data) {
    const existing = this.getKontrak(paketId);

    if (existing) {
      // Update existing
      const allowedFields = [
        'nomorKontrak', 'tanggalKontrak', 'nilaiKontrak', 'tanggalMulai',
        'tanggalSelesai', 'jangkaWaktu', 'penyediaId', 'namaPenyedia',
        'alamatPenyedia', 'npwpPenyedia', 'direkturPenyedia', 'status'
      ];
      return updateRow('Kontrak', existing.kontrakId, data, allowedFields);
    } else {
      // Create new
      const kontrakId = generateId('KTR');
      const now = getTimestamp();

      const row = [
        kontrakId,
        paketId,
        data.nomorKontrak || '',
        data.tanggalKontrak || '',
        data.nilaiKontrak || 0,
        data.tanggalMulai || '',
        data.tanggalSelesai || '',
        data.jangkaWaktu || '',
        data.penyediaId || '',
        data.namaPenyedia || '',
        data.alamatPenyedia || '',
        data.npwpPenyedia || '',
        data.direkturPenyedia || '',
        'ACTIVE',
        now,
        now
      ];

      getSpreadsheet().getSheetByName('Kontrak').appendRow(row);
      return this.getKontrak(paketId);
    }
  },

  // ==================== PEMBAYARAN ====================

  getPembayaran: function(paketId) {
    const rows = getRowsByColumn('Pembayaran', 'paketId', paketId);
    return rows.map(r => ({ ...r, id: r.pembayaranId }));
  },

  addPembayaran: function(paketId, data) {
    const pembayaranId = generateId('PBY');
    const now = getTimestamp();

    const config = ConfigService.getConfig();
    const ppnRate = parseFloat(config.ppnRate || 11) / 100;
    const pphRate = parseFloat(config.pphRate || 2) / 100;

    const nilaiTagihan = data.nilaiTagihan || 0;
    const nilaiPPN = data.nilaiPPN !== undefined ? data.nilaiPPN : nilaiTagihan * ppnRate;
    const nilaiPPH = data.nilaiPPH !== undefined ? data.nilaiPPH : nilaiTagihan * pphRate;
    const nilaiNetto = nilaiTagihan + nilaiPPN - nilaiPPH;

    const kontrak = this.getKontrak(paketId);

    const row = [
      pembayaranId,
      paketId,
      kontrak?.kontrakId || '',
      data.termin || 1,
      nilaiTagihan,
      nilaiPPN,
      nilaiPPH,
      nilaiNetto,
      data.tanggalTagihan || '',
      data.tanggalBayar || '',
      data.nomorSPM || '',
      data.nomorSP2D || '',
      data.status || 'PENDING',
      data.keterangan || '',
      now,
      now
    ];

    getSpreadsheet().getSheetByName('Pembayaran').appendRow(row);

    return {
      pembayaranId,
      id: pembayaranId,
      paketId,
      termin: data.termin,
      nilaiTagihan,
      nilaiPPN,
      nilaiPPH,
      nilaiNetto,
      status: data.status || 'PENDING'
    };
  },

  updatePembayaran: function(pembayaranId, data) {
    const allowedFields = [
      'termin', 'nilaiTagihan', 'nilaiPPN', 'nilaiPPH', 'nilaiNetto',
      'tanggalTagihan', 'tanggalBayar', 'nomorSPM', 'nomorSP2D', 'status', 'keterangan'
    ];
    return updateRow('Pembayaran', pembayaranId, data, allowedFields);
  },

  deletePembayaran: function(pembayaranId) {
    return deleteRow('Pembayaran', pembayaranId);
  },

  // ==================== SERAH TERIMA ====================

  getSerahTerima: function(paketId) {
    const rows = getRowsByColumn('SerahTerima', 'paketId', paketId);
    return rows.map(r => ({ ...r, id: r.serahTerimaId }));
  },

  updateSerahTerima: function(paketId, data) {
    const existing = this.getSerahTerima(paketId);
    const matchingBA = existing.find(st => st.jenisBA === data.jenisBA);

    if (matchingBA) {
      // Update existing
      const allowedFields = [
        'nomorBA', 'tanggalBA', 'persentase', 'nilaiPekerjaan', 'keterangan', 'status'
      ];
      return updateRow('SerahTerima', matchingBA.serahTerimaId, data, allowedFields);
    } else {
      // Create new
      const serahTerimaId = generateId('ST');
      const now = getTimestamp();
      const kontrak = this.getKontrak(paketId);

      const row = [
        serahTerimaId,
        paketId,
        kontrak?.kontrakId || '',
        data.jenisBA || 'BAST',
        data.nomorBA || '',
        data.tanggalBA || '',
        data.persentase || 100,
        data.nilaiPekerjaan || 0,
        data.keterangan || '',
        '',
        '',
        'DRAFT',
        now
      ];

      getSpreadsheet().getSheetByName('SerahTerima').appendRow(row);
      return this.getSerahTerima(paketId).find(st => st.serahTerimaId === serahTerimaId);
    }
  }
};

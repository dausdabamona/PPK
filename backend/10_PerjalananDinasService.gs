/**
 * 10_PerjalananDinasService.gs
 * Perjalanan Dinas Service - Complete CRUD and Document Generation
 *
 * IMPORTANT FIX: allowedFields now includes nomorST, tanggalST, nomorSPPD, tanggalSPPD
 */

// ========================================
// SHEET SETUP
// ========================================

function setupPerjalananDinasSheets() {
  const ss = getSpreadsheet();

  // Main PerjalananDinas sheet
  const pdHeaders = [
    'pdId', 'jenisPD', 'nomorST', 'nomorSPPD', 'tanggalST', 'tanggalSPPD',
    'tempatBerangkat', 'tujuan', 'kotaTujuan', 'provinsiTujuan', 'maksudTujuan',
    'tanggalBerangkat', 'tanggalKembali', 'lamaHari',
    'tingkatBiaya', 'jenisTransportasi', 'totalBiaya',
    'instansiPembebanan', 'akun', 'pejabatPerintah', 'jabatanPejabatPerintah',
    'nipPejabatPerintah', 'instansiLokasi', 'kotaInstansiLokasi',
    'status', 'createdAt', 'updatedAt', 'createdBy', 'keterangan', 'terbilang'
  ];
  ensureSheet('PerjalananDinas', pdHeaders);

  // Pelaksana sheet
  const pelaksanaHeaders = [
    'pelaksanaId', 'pdId', 'nama', 'nip', 'pangkat', 'golongan',
    'jabatan', 'instansi', 'tingkatBiaya', 'uangHarian', 'isPenanggungJawab', 'createdAt'
  ];
  ensureSheet('Pelaksana', pelaksanaHeaders);

  // BiayaPerjalanan sheet
  const biayaHeaders = [
    'biayaId', 'pdId', 'jenisBiaya', 'keterangan', 'jumlah',
    'satuan', 'hargaSatuan', 'total', 'buktiUrl', 'createdAt'
  ];
  ensureSheet('BiayaPerjalanan', biayaHeaders);

  // LampiranPD sheet
  const lampiranHeaders = [
    'lampiranId', 'pdId', 'filename', 'mimeType', 'fileSize',
    'googleFileId', 'googleFileUrl', 'kategori', 'keterangan',
    'uploadedAt', 'uploadedBy', 'isVerified'
  ];
  ensureSheet('LampiranPD', lampiranHeaders);

  // DokumenPD sheet
  const dokumenHeaders = [
    'docId', 'pdId', 'jenisDokumen', 'nomorDokumen', 'tanggalDokumen',
    'googleDocId', 'googleDocUrl', 'status', 'createdAt', 'createdBy'
  ];
  ensureSheet('DokumenPD', dokumenHeaders);

  return { success: true, message: 'Perjalanan Dinas sheets created successfully' };
}

// ========================================
// PERJALANAN DINAS SERVICE
// ========================================

const PerjalananDinasService = {

  // ==================== LIST ====================
  list: function(jenisPD = null) {
    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    let results = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      obj.id = obj.pdId; // Normalize ID field
      obj.jumlahPelaksana = this.countPelaksana(obj.pdId);
      obj.statusLabel = PD_STATUS_LABELS[obj.status] || obj.status;
      obj.jenisPDLabel = JENIS_PD_LABELS[obj.jenisPD] || obj.jenisPD;
      return obj;
    }).filter(pd => pd.pdId);

    if (jenisPD) {
      results = results.filter(pd => pd.jenisPD === jenisPD);
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ==================== GET BY ID ====================
  getById: function(pdId) {
    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pdId) {
        const pd = {};
        headers.forEach((h, j) => pd[h] = data[i][j]);
        pd.id = pd.pdId; // Normalize ID field
        pd.statusLabel = PD_STATUS_LABELS[pd.status] || pd.status;
        pd.jenisPDLabel = JENIS_PD_LABELS[pd.jenisPD] || pd.jenisPD;
        pd.pelaksana = this.getPelaksana(pdId);
        pd.biaya = this.getBiaya(pdId);
        pd.lampiran = this.getLampiran(pdId);
        pd.dokumen = this.getDokumen(pdId);
        return pd;
      }
    }
    return null;
  },

  // ==================== CREATE ====================
  create: function(data) {
    setupPerjalananDinasSheets();

    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    const pdId = generateId('PD');
    const now = getTimestamp();

    // Calculate lama hari
    let lamaHari = 1;
    if (data.tanggalBerangkat && data.tanggalKembali) {
      const tglBerangkat = new Date(data.tanggalBerangkat);
      const tglKembali = new Date(data.tanggalKembali);
      lamaHari = Math.ceil((tglKembali - tglBerangkat) / (1000 * 60 * 60 * 24)) + 1;
    }

    const jenisPD = data.jenisPD || JENIS_PD.DALAM_KOTA;

    const row = [
      pdId,
      jenisPD,
      data.nomorST || data.nomorSuratTugas || '',
      data.nomorSPPD || '',
      data.tanggalST || data.tanggalSuratTugas || '',
      data.tanggalSPPD || '',
      data.tempatBerangkat || '',
      data.tujuan || data.tujuanDinas || '',
      data.kotaTujuan || '',
      data.provinsiTujuan || '',
      data.maksudTujuan || data.tujuanDinas || '',
      data.tanggalBerangkat || '',
      data.tanggalKembali || '',
      lamaHari,
      data.tingkatBiaya || 'C',
      data.jenisTransportasi || 'KENDARAAN_DINAS',
      0,
      data.instansiPembebanan || data.sumberDana || '',
      data.akun || data.mak || '',
      data.pejabatPerintah || '',
      data.jabatanPejabatPerintah || '',
      data.nipPejabatPerintah || '',
      data.instansiLokasi || '',
      data.kotaInstansiLokasi || '',
      PD_STATUS.DRAFT,
      now,
      now,
      data.createdBy || '',
      data.keterangan || '',
      ''
    ];

    sheet.appendRow(row);
    return this.getById(pdId);
  },

  // ==================== UPDATE ====================
  update: function(pdId, data) {
    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    if (!sheet) return null;

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === pdId) {

        // FIXED: Added nomorST, tanggalST, nomorSPPD, tanggalSPPD to allowedFields
        const allowedFields = [
          'nomorST', 'tanggalST', 'nomorSPPD', 'tanggalSPPD',  // <-- ADDED THESE
          'tempatBerangkat', 'tujuan', 'kotaTujuan', 'provinsiTujuan', 'maksudTujuan',
          'tanggalBerangkat', 'tanggalKembali', 'tingkatBiaya', 'jenisTransportasi',
          'instansiPembebanan', 'akun', 'pejabatPerintah', 'jabatanPejabatPerintah',
          'nipPejabatPerintah', 'instansiLokasi', 'kotaInstansiLokasi', 'keterangan',
          'jenisPD', 'status'  // Also allow jenisPD and status updates
        ];

        // Map frontend field names to backend field names
        const fieldMapping = {
          'nomorSuratTugas': 'nomorST',
          'tanggalSuratTugas': 'tanggalST',
          'tujuanDinas': 'maksudTujuan',
          'mak': 'akun',
          'sumberDana': 'instansiPembebanan'
        };

        // Apply field mapping
        Object.keys(fieldMapping).forEach(frontendField => {
          if (data[frontendField] !== undefined) {
            data[fieldMapping[frontendField]] = data[frontendField];
          }
        });

        // Also set tujuan when tujuanDinas is provided
        if (data.tujuanDinas !== undefined) {
          data.tujuan = data.tujuanDinas;
        }

        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            const colIndex = headers.indexOf(field);
            if (colIndex >= 0) {
              sheet.getRange(i + 1, colIndex + 1).setValue(data[field]);
            }
          }
        });

        // Recalculate lama hari if dates changed
        if (data.tanggalBerangkat || data.tanggalKembali) {
          const current = {};
          headers.forEach((h, j) => current[h] = allData[i][j]);

          const tglBerangkat = new Date(data.tanggalBerangkat || current.tanggalBerangkat);
          const tglKembali = new Date(data.tanggalKembali || current.tanggalKembali);

          if (!isNaN(tglBerangkat.getTime()) && !isNaN(tglKembali.getTime())) {
            const lamaHari = Math.ceil((tglKembali - tglBerangkat) / (1000 * 60 * 60 * 24)) + 1;
            const lamaHariCol = headers.indexOf('lamaHari');
            if (lamaHariCol >= 0) {
              sheet.getRange(i + 1, lamaHariCol + 1).setValue(lamaHari);
            }
          }
        }

        // Update timestamp
        const updatedAtCol = headers.indexOf('updatedAt');
        if (updatedAtCol >= 0) {
          sheet.getRange(i + 1, updatedAtCol + 1).setValue(getTimestamp());
        }

        return this.getById(pdId);
      }
    }
    return null;
  },

  // ==================== DELETE ====================
  delete: function(pdId) {
    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pdId) {
        sheet.deleteRow(i + 1);
        this.deletePelaksanaByPd(pdId);
        this.deleteBiayaByPd(pdId);
        this.deleteLampiranByPd(pdId);
        return true;
      }
    }
    return false;
  },

  // ==================== UPDATE STATUS ====================
  updateStatus: function(pdId, newStatus) {
    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const statusCol = headers.indexOf('status');

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pdId) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        const updatedAtCol = headers.indexOf('updatedAt');
        if (updatedAtCol >= 0) {
          sheet.getRange(i + 1, updatedAtCol + 1).setValue(getTimestamp());
        }
        return this.getById(pdId);
      }
    }
    return null;
  },

  // ==================== PELAKSANA ====================

  getPelaksana: function(pdId) {
    const rows = getRowsByColumn('Pelaksana', 'pdId', pdId);
    return rows.map(r => ({ ...r, id: r.pelaksanaId }));
  },

  countPelaksana: function(pdId) {
    return this.getPelaksana(pdId).length;
  },

  addPelaksana: function(pdId, data) {
    const sheet = getSpreadsheet().getSheetByName('Pelaksana');
    if (!sheet) {
      setupPerjalananDinasSheets();
    }

    const pelaksanaId = generateId('PLK');
    const row = [
      pelaksanaId,
      pdId,
      data.nama || '',
      data.nip || '',
      data.pangkat || '',
      data.golongan || '',
      data.jabatan || '',
      data.instansi || '',
      data.tingkatBiaya || 'C',
      data.uangHarian || 0,
      data.isPenanggungJawab || false,
      getTimestamp()
    ];

    getSpreadsheet().getSheetByName('Pelaksana').appendRow(row);
    return { pelaksanaId, id: pelaksanaId, ...data };
  },

  updatePelaksana: function(pelaksanaId, data) {
    const allowedFields = ['nama', 'nip', 'pangkat', 'golongan', 'jabatan', 'instansi', 'tingkatBiaya', 'uangHarian', 'isPenanggungJawab'];
    return updateRow('Pelaksana', pelaksanaId, data, allowedFields);
  },

  deletePelaksana: function(pelaksanaId) {
    return deleteRow('Pelaksana', pelaksanaId);
  },

  deletePelaksanaByPd: function(pdId) {
    return deleteRowsByColumn('Pelaksana', 'pdId', pdId);
  },

  // ==================== BIAYA ====================

  getBiaya: function(pdId) {
    const rows = getRowsByColumn('BiayaPerjalanan', 'pdId', pdId);
    return rows.map(r => ({ ...r, id: r.biayaId }));
  },

  addBiaya: function(pdId, data) {
    const sheet = getSpreadsheet().getSheetByName('BiayaPerjalanan');
    if (!sheet) {
      setupPerjalananDinasSheets();
    }

    const biayaId = generateId('BYA');
    const total = (data.jumlah || 1) * (data.hargaSatuan || 0);

    const row = [
      biayaId,
      pdId,
      data.jenisBiaya || '',
      data.keterangan || '',
      data.jumlah || 1,
      data.satuan || '',
      data.hargaSatuan || 0,
      total,
      data.buktiUrl || '',
      getTimestamp()
    ];

    getSpreadsheet().getSheetByName('BiayaPerjalanan').appendRow(row);
    this.recalculateTotalBiaya(pdId);
    return { biayaId, id: biayaId, ...data, total };
  },

  updateBiaya: function(biayaId, data) {
    const sheet = getSpreadsheet().getSheetByName('BiayaPerjalanan');
    if (!sheet) return null;

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    let pdId = null;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === biayaId) {
        pdId = allData[i][1];

        const allowedFields = ['jenisBiaya', 'keterangan', 'jumlah', 'satuan', 'hargaSatuan', 'buktiUrl'];
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            const colIndex = headers.indexOf(field);
            if (colIndex >= 0) {
              sheet.getRange(i + 1, colIndex + 1).setValue(data[field]);
            }
          }
        });

        // Recalculate total
        const jumlah = data.jumlah !== undefined ? data.jumlah : allData[i][headers.indexOf('jumlah')];
        const hargaSatuan = data.hargaSatuan !== undefined ? data.hargaSatuan : allData[i][headers.indexOf('hargaSatuan')];
        const totalCol = headers.indexOf('total');
        sheet.getRange(i + 1, totalCol + 1).setValue(jumlah * hargaSatuan);
        break;
      }
    }

    if (pdId) {
      this.recalculateTotalBiaya(pdId);
    }
    return { biayaId, id: biayaId, ...data };
  },

  deleteBiaya: function(biayaId) {
    const row = getRowById('BiayaPerjalanan', biayaId);
    if (row) {
      const pdId = row.pdId;
      deleteRow('BiayaPerjalanan', biayaId);
      this.recalculateTotalBiaya(pdId);
      return true;
    }
    return false;
  },

  deleteBiayaByPd: function(pdId) {
    return deleteRowsByColumn('BiayaPerjalanan', 'pdId', pdId);
  },

  recalculateTotalBiaya: function(pdId) {
    const biaya = this.getBiaya(pdId);
    const total = biaya.reduce((sum, b) => sum + (b.total || 0), 0);

    const sheet = getSpreadsheet().getSheetByName('PerjalananDinas');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const totalBiayaCol = headers.indexOf('totalBiaya');
    const terbilangCol = headers.indexOf('terbilang');

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === pdId) {
        sheet.getRange(i + 1, totalBiayaCol + 1).setValue(total);
        if (terbilangCol >= 0) {
          sheet.getRange(i + 1, terbilangCol + 1).setValue(terbilangClean(total) + ' rupiah');
        }
        break;
      }
    }

    return total;
  },

  // ==================== LAMPIRAN ====================

  getLampiran: function(pdId) {
    const rows = getRowsByColumn('LampiranPD', 'pdId', pdId);
    return rows.map(r => ({ ...r, id: r.lampiranId }));
  },

  addLampiran: function(pdId, data) {
    setupPerjalananDinasSheets();

    const lampiranId = generateId('LMP');
    const now = getTimestamp();

    let googleFileId = '';
    let googleFileUrl = '';

    const fileData = data.base64Data || data.fileContent;

    if (fileData && data.filename) {
      try {
        const uploadResult = uploadFileToDrive('Lampiran_Perjalanan_Dinas', data.filename, fileData, data.mimeType);
        if (uploadResult) {
          googleFileId = uploadResult.fileId;
          googleFileUrl = uploadResult.fileUrl;
        }
      } catch (e) {
        console.error('Error uploading file:', e);
        return { success: false, error: 'Gagal mengupload file: ' + e.message };
      }
    }

    const row = [
      lampiranId,
      pdId,
      data.filename || '',
      data.mimeType || '',
      data.fileSize || 0,
      googleFileId,
      googleFileUrl,
      data.kategori || 'LAINNYA',
      data.keterangan || '',
      now,
      data.uploadedBy || '',
      false
    ];

    getSpreadsheet().getSheetByName('LampiranPD').appendRow(row);

    return {
      lampiranId,
      id: lampiranId,
      pdId,
      filename: data.filename,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      googleFileId,
      googleFileUrl,
      kategori: data.kategori,
      keterangan: data.keterangan,
      uploadedAt: now
    };
  },

  updateLampiran: function(lampiranId, data) {
    const allowedFields = ['kategori', 'keterangan', 'isVerified'];
    return updateRow('LampiranPD', lampiranId, data, allowedFields);
  },

  deleteLampiran: function(lampiranId) {
    const row = getRowById('LampiranPD', lampiranId);
    if (row && row.googleFileId) {
      deleteFileFromDrive(row.googleFileId);
    }
    return deleteRow('LampiranPD', lampiranId);
  },

  deleteLampiranByPd: function(pdId) {
    const lampiran = this.getLampiran(pdId);
    lampiran.forEach(l => {
      if (l.googleFileId) {
        deleteFileFromDrive(l.googleFileId);
      }
    });
    return deleteRowsByColumn('LampiranPD', 'pdId', pdId);
  },

  // ==================== DOKUMEN ====================

  getDokumen: function(pdId) {
    const rows = getRowsByColumn('DokumenPD', 'pdId', pdId);
    return rows.map(r => ({ ...r, id: r.docId }));
  },

  saveDokumenRecord: function(pdId, jenisDokumen, googleDocId, googleDocUrl) {
    setupPerjalananDinasSheets();

    const docId = generateId('DOC');
    const now = getTimestamp();

    const row = [
      docId,
      pdId,
      jenisDokumen,
      '',
      now,
      googleDocId,
      googleDocUrl,
      'GENERATED',
      now,
      ''
    ];

    getSpreadsheet().getSheetByName('DokumenPD').appendRow(row);
    return docId;
  },

  // ==================== OPTIONS ====================

  getJenisPDOptions: function() {
    return Object.entries(JENIS_PD_LABELS).map(([value, label]) => ({ value, label }));
  },

  getStatusOptions: function(jenisPD = null) {
    if (jenisPD === JENIS_PD.DALAM_KOTA) {
      return [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'SURAT_TUGAS', label: 'Surat Tugas' },
        { value: 'PELAKSANAAN', label: 'Dalam Pelaksanaan' },
        { value: 'SELESAI', label: 'Selesai' },
        { value: 'BATAL', label: 'Dibatalkan' }
      ];
    }
    return Object.entries(PD_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  },

  getTingkatBiayaOptions: function() {
    return Object.entries(TINGKAT_BIAYA).map(([value, label]) => ({ value, label }));
  },

  getJenisTransportasiOptions: function() {
    return Object.entries(JENIS_TRANSPORTASI).map(([value, label]) => ({ value, label }));
  },

  getJenisBiayaOptions: function() {
    return Object.entries(JENIS_BIAYA_PD).map(([value, label]) => ({ value, label }));
  },

  getLampiranKategoriOptions: function() {
    return Object.entries(KATEGORI_LAMPIRAN_PD).map(([value, label]) => ({ value, label }));
  },

  // ==================== DOCUMENT GENERATION ====================

  generateSPPD: function(pdId) {
    const pd = this.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('SPPD - ' + (pd.tujuan || pd.maksudTujuan) + ' - ' + pd.tanggalBerangkat);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(40);
      body.setMarginBottom(40);
      body.setMarginLeft(50);
      body.setMarginRight(50);

      // Title
      const title = body.appendParagraph('SURAT PERINTAH PERJALANAN DINAS');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(12);

      body.appendParagraph('( S P P D )').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      const pelaksana = pd.pelaksana && pd.pelaksana.length > 0 ? pd.pelaksana[0] : {};
      const pengikut = pd.pelaksana && pd.pelaksana.length > 1 ? pd.pelaksana.slice(1) : [];

      // SPPD Table
      const sppdTable = body.appendTable();

      const addRow = (no, label, value) => {
        const row = sppdTable.appendTableRow();
        row.appendTableCell(no).setWidth(25);
        row.appendTableCell(label).setWidth(220);
        row.appendTableCell(value || '-').setWidth(220);
      };

      addRow('1.', 'Pejabat berwenang yang memberi perintah', config.namaPPK || pd.pejabatPerintah);

      // Row 2 - Nama & NIP
      const row2 = sppdTable.appendTableRow();
      row2.appendTableCell('2.');
      const cell2a = row2.appendTableCell();
      cell2a.appendParagraph('a.  Nama Pegawai yang diperintah');
      cell2a.appendParagraph('b.  N I P');
      const cell2b = row2.appendTableCell();
      cell2b.appendParagraph('a.  ' + (pelaksana.nama || '-'));
      cell2b.appendParagraph('b.  ' + (pelaksana.nip || '-'));

      // Row 3 - Pangkat, Jabatan, Tingkat
      const row3 = sppdTable.appendTableRow();
      row3.appendTableCell('3.');
      const cell3a = row3.appendTableCell();
      cell3a.appendParagraph('a.  Pangkat dan Golongan');
      cell3a.appendParagraph('b.  Jabatan');
      cell3a.appendParagraph('c.  Tingkat Biaya Perjalanan Dinas');
      const cell3b = row3.appendTableCell();
      cell3b.appendParagraph('a.  ' + (pelaksana.pangkat || '-') + ' / ' + (pelaksana.golongan || '-'));
      cell3b.appendParagraph('b.  ' + (pelaksana.jabatan || '-'));
      cell3b.appendParagraph('c.  ' + (pd.tingkatBiaya || 'C'));

      addRow('4.', 'Maksud Perjalanan Dinas', pd.maksudTujuan || pd.tujuan);
      addRow('5.', 'Alat angkut yang dipergunakan', JENIS_TRANSPORTASI[pd.jenisTransportasi] || pd.jenisTransportasi || '-');

      // Row 6 - Tempat
      const row6 = sppdTable.appendTableRow();
      row6.appendTableCell('6.');
      const cell6a = row6.appendTableCell();
      cell6a.appendParagraph('a.  Tempat berangkat');
      cell6a.appendParagraph('b.  Tempat Tujuan');
      const cell6b = row6.appendTableCell();
      cell6b.appendParagraph('a.  ' + (pd.tempatBerangkat || config.kotaSatker || '-'));
      cell6b.appendParagraph('b.  ' + (pd.tujuan || '-') + (pd.kotaTujuan ? ', ' + pd.kotaTujuan : ''));

      // Row 7 - Tanggal
      const row7 = sppdTable.appendTableRow();
      row7.appendTableCell('7.');
      const cell7a = row7.appendTableCell();
      cell7a.appendParagraph('a.  Lamanya Perjalanan Dinas');
      cell7a.appendParagraph('b.  Tanggal berangkat');
      cell7a.appendParagraph('c.  Tanggal harus kembali');
      const cell7b = row7.appendTableCell();
      cell7b.appendParagraph('a.  ' + pd.lamaHari + ' hari');
      cell7b.appendParagraph('b.  ' + formatTanggalIndo(pd.tanggalBerangkat));
      cell7b.appendParagraph('c.  ' + formatTanggalIndo(pd.tanggalKembali));

      // Row 8 - Pengikut
      const row8 = sppdTable.appendTableRow();
      row8.appendTableCell('8.');
      row8.appendTableCell('Pengikut :');
      const cell8b = row8.appendTableCell();
      if (pengikut.length > 0) {
        pengikut.forEach((p, idx) => {
          cell8b.appendParagraph((idx + 1) + '.  ' + (p.nama || '-'));
        });
      } else {
        cell8b.appendParagraph('-');
      }

      // Row 9 - Pembebanan
      const row9 = sppdTable.appendTableRow();
      row9.appendTableCell('9.');
      const cell9a = row9.appendTableCell();
      cell9a.appendParagraph('Pembebanan Anggaran');
      cell9a.appendParagraph('a.  Instansi');
      cell9a.appendParagraph('b.  Mata Anggaran');
      const cell9b = row9.appendTableCell();
      cell9b.appendParagraph('');
      cell9b.appendParagraph('a.  ' + (pd.instansiPembebanan || config.namaSatker || '-'));
      cell9b.appendParagraph('b.  ' + (pd.akun || '-'));

      addRow('10.', 'Keterangan lain-lain', pd.keterangan || '-');

      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const signRow1 = signTable.appendTableRow();
      signRow1.appendTableCell('').setWidth(300);
      signRow1.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(pd.tanggalST || new Date().toISOString()));

      const signRow2 = signTable.appendTableRow();
      signRow2.appendTableCell('');
      signRow2.appendTableCell('PEJABAT YANG BERWENANG,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const signRow3 = signTable.appendTableRow();
      signRow3.appendTableCell('');
      signRow3.appendTableCell('\n\n\n\n');

      const signRow4 = signTable.appendTableRow();
      signRow4.appendTableCell('');
      const nameCell = signRow4.appendTableCell();
      nameCell.appendParagraph(config.namaPPK || pd.pejabatPerintah || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      nameCell.appendParagraph('NIP. ' + (config.nipPPK || pd.nipPejabatPerintah || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      // Move to folder
      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Lampiran_Perjalanan_Dinas');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDokumenRecord(pdId, 'SPPD', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'SPPD'
        }
      };

    } catch (e) {
      console.error('Error generating SPPD:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  generateKuitansiRampung: function(pdId) {
    const pd = this.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('Kuitansi Rampung - ' + (pd.tujuan || pd.maksudTujuan));
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(40);
      body.setMarginBottom(30);
      body.setMarginLeft(40);
      body.setMarginRight(40);

      // Title
      const title = body.appendParagraph('KUITANSI / BUKTI PEMBAYARAN RAMPUNG');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(12);

      body.appendParagraph('');

      // SPPD Info
      const infoTable = body.appendTable();
      infoTable.setBorderWidth(0);

      const infoRow1 = infoTable.appendTableRow();
      infoRow1.appendTableCell('Nomor SPPD').setWidth(100);
      infoRow1.appendTableCell(': ' + (pd.nomorSPPD || pd.nomorST || '............/PL.05/................./................'));

      const infoRow2 = infoTable.appendTableRow();
      infoRow2.appendTableCell('Tanggal SPPD');
      infoRow2.appendTableCell(': ' + formatTanggalIndo(pd.tanggalSPPD || pd.tanggalST || pd.tanggalBerangkat));

      body.appendParagraph('');

      // Biaya table with proper columns
      const biayaTable = body.appendTable();

      // Header row
      const headerRow = biayaTable.appendTableRow();
      const hNo = headerRow.appendTableCell('No');
      hNo.setBold(true).setWidth(25);
      hNo.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const hPerincian = headerRow.appendTableCell('Perincian Biaya');
      hPerincian.setBold(true).setWidth(150);
      hPerincian.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const hJmlSatuan = headerRow.appendTableCell('Jumlah Satuan');
      hJmlSatuan.setBold(true).setWidth(80);
      hJmlSatuan.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const hTarif = headerRow.appendTableCell('Tarif (Rp)');
      hTarif.setBold(true).setWidth(70);
      hTarif.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const hJumlah = headerRow.appendTableCell('Jumlah (Rp)');
      hJumlah.setBold(true).setWidth(80);
      hJumlah.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const hKet = headerRow.appendTableCell('Ket.');
      hKet.setBold(true).setWidth(50);
      hKet.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      // Group biaya by category
      const biayaByCategory = {
        UANG_HARIAN: [],
        TRANSPORT: [],
        PENGINAPAN: [],
        REPRESENTASI: [],
        LAINNYA: []
      };

      let totalBiaya = 0;
      if (pd.biaya && pd.biaya.length > 0) {
        pd.biaya.forEach(b => {
          totalBiaya += (b.total || 0);
          if (b.jenisBiaya === 'UANG_HARIAN') {
            biayaByCategory.UANG_HARIAN.push(b);
          } else if (['TIKET_PP', 'TRANSPORT_LOKAL', 'BBM', 'TOL', 'PARKIR'].includes(b.jenisBiaya)) {
            biayaByCategory.TRANSPORT.push(b);
          } else if (b.jenisBiaya === 'PENGINAPAN') {
            biayaByCategory.PENGINAPAN.push(b);
          } else if (b.jenisBiaya === 'REPRESENTASI') {
            biayaByCategory.REPRESENTASI.push(b);
          } else {
            biayaByCategory.LAINNYA.push(b);
          }
        });
      }

      // Row 1: Uang Harian
      const row1 = biayaTable.appendTableRow();
      row1.appendTableCell('1').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      row1.appendTableCell('Uang Harian');
      if (biayaByCategory.UANG_HARIAN.length > 0) {
        const uh = biayaByCategory.UANG_HARIAN[0];
        row1.appendTableCell((uh.jumlah || pd.lamaHari || '-') + ' hari');
        row1.appendTableCell(formatRupiahDoc(uh.hargaSatuan || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        row1.appendTableCell(formatRupiahDoc(uh.total || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else {
        row1.appendTableCell(pd.lamaHari + ' hari');
        row1.appendTableCell('-');
        row1.appendTableCell('-');
      }
      row1.appendTableCell('');

      // Row 2: Biaya Transport
      const row2 = biayaTable.appendTableRow();
      row2.appendTableCell('2').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const transportCell = row2.appendTableCell();
      transportCell.appendParagraph('Biaya Transport');
      if (biayaByCategory.TRANSPORT.length > 0) {
        biayaByCategory.TRANSPORT.forEach((t, idx) => {
          const label = String.fromCharCode(97 + idx) + '. ' + (t.keterangan || JENIS_BIAYA_PD[t.jenisBiaya] || t.jenisBiaya);
          transportCell.appendParagraph(label);
        });
        const totalTransport = biayaByCategory.TRANSPORT.reduce((sum, t) => sum + (t.total || 0), 0);
        row2.appendTableCell('');
        row2.appendTableCell('');
        row2.appendTableCell(formatRupiahDoc(totalTransport)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else {
        transportCell.appendParagraph('a. .................................');
        transportCell.appendParagraph('b. .................................');
        row2.appendTableCell('');
        row2.appendTableCell('');
        row2.appendTableCell('-');
      }
      row2.appendTableCell('');

      // Row 3: Biaya Penginapan
      const row3 = biayaTable.appendTableRow();
      row3.appendTableCell('3').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      row3.appendTableCell('Biaya Penginapan');
      if (biayaByCategory.PENGINAPAN.length > 0) {
        const pn = biayaByCategory.PENGINAPAN[0];
        row3.appendTableCell((pn.jumlah || '-') + ' malam');
        row3.appendTableCell(formatRupiahDoc(pn.hargaSatuan || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        row3.appendTableCell(formatRupiahDoc(pn.total || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else {
        row3.appendTableCell('- malam');
        row3.appendTableCell('-');
        row3.appendTableCell('-');
      }
      row3.appendTableCell('');

      // Row 4: Uang Representasi
      const row4 = biayaTable.appendTableRow();
      row4.appendTableCell('4').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      row4.appendTableCell('Uang Representasi (Jika ada)');
      if (biayaByCategory.REPRESENTASI.length > 0) {
        const rp = biayaByCategory.REPRESENTASI[0];
        row4.appendTableCell((rp.jumlah || '-') + ' ' + (rp.satuan || ''));
        row4.appendTableCell(formatRupiahDoc(rp.hargaSatuan || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        row4.appendTableCell(formatRupiahDoc(rp.total || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else {
        row4.appendTableCell('-');
        row4.appendTableCell('-');
        row4.appendTableCell('-');
      }
      row4.appendTableCell('');

      // Row 5: Biaya Lain-lain
      const row5 = biayaTable.appendTableRow();
      row5.appendTableCell('5').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const lainCell = row5.appendTableCell();
      lainCell.appendParagraph('Biaya Lain-lain yang sah');
      if (biayaByCategory.LAINNYA.length > 0) {
        biayaByCategory.LAINNYA.forEach((l, idx) => {
          const label = String.fromCharCode(97 + idx) + '. ' + (l.keterangan || JENIS_BIAYA_PD[l.jenisBiaya] || l.jenisBiaya);
          lainCell.appendParagraph(label);
        });
        const totalLain = biayaByCategory.LAINNYA.reduce((sum, l) => sum + (l.total || 0), 0);
        row5.appendTableCell('');
        row5.appendTableCell('');
        row5.appendTableCell(formatRupiahDoc(totalLain)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else {
        lainCell.appendParagraph('a. .................................');
        lainCell.appendParagraph('b. .................................');
        row5.appendTableCell('');
        row5.appendTableCell('');
        row5.appendTableCell('-');
      }
      row5.appendTableCell('');

      // Total row
      const totalRow = biayaTable.appendTableRow();
      totalRow.appendTableCell('');
      const jmlCell = totalRow.appendTableCell('JUMLAH');
      jmlCell.setBold(true);
      totalRow.appendTableCell('');
      totalRow.appendTableCell('');
      const totalCell = totalRow.appendTableCell('Rp ' + formatRupiahDoc(totalBiaya));
      totalCell.setBold(true);
      totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      totalRow.appendTableCell('');

      // Terbilang
      body.appendParagraph('');
      const terbilangText = body.appendParagraph('Terbilang: ' + terbilangClean(totalBiaya) + ' rupiah');
      terbilangText.setItalic(true);

      body.appendParagraph('');

      // Signatures - 3 columns
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      // Row 1: Labels
      const labelRow = signTable.appendTableRow();

      const leftLabel = labelRow.appendTableCell();
      leftLabel.setWidth(170);
      leftLabel.appendParagraph('Telah dibayar sejumlah:');
      leftLabel.appendParagraph('Rp ' + formatRupiahDoc(totalBiaya)).setBold(true);
      leftLabel.appendParagraph('');
      leftLabel.appendParagraph('Bendahara Pengeluaran,').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const middleLabel = labelRow.appendTableCell();
      middleLabel.setWidth(170);
      const kotaTTD = config.kotaSatker || 'Sorong';
      middleLabel.appendParagraph(kotaTTD + ', ' + formatTanggalIndo(new Date().toISOString()));
      middleLabel.appendParagraph('');
      middleLabel.appendParagraph('Telah menerima jumlah uang sebesar:');
      middleLabel.appendParagraph('Rp ' + formatRupiahDoc(totalBiaya)).setBold(true);
      middleLabel.appendParagraph('Yang menerima,').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const rightLabel = labelRow.appendTableCell();
      rightLabel.setWidth(170);

      // Space for signatures
      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n');
      spaceRow.appendTableCell('\n\n\n');
      spaceRow.appendTableCell('');

      // Names row
      const pelaksana = pd.pelaksana && pd.pelaksana.length > 0 ? pd.pelaksana[0] : {};

      const nameRow = signTable.appendTableRow();

      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(config.namaBendahara || '............................................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('NIP. ' + (config.nipBendahara || '......................................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const middleName = nameRow.appendTableCell();
      middleName.appendParagraph(pelaksana.nama || '............................................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      middleName.appendParagraph('NIP. ' + (pelaksana.nip || '......................................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph('');

      // PPK approval section
      body.appendParagraph('');

      const ppkTable = body.appendTable();
      ppkTable.setBorderWidth(0);

      const ppkRow = ppkTable.appendTableRow();
      ppkRow.appendTableCell('').setWidth(340);

      const ppkCell = ppkRow.appendTableCell();
      ppkCell.setWidth(170);
      ppkCell.appendParagraph('Perhitungan rampung diperiksa dan disetujui');
      ppkCell.appendParagraph('untuk dibayar sebesar Rp ' + formatRupiahDoc(totalBiaya));
      ppkCell.appendParagraph('Pejabat Pembuat Komitmen,').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      ppkCell.appendParagraph('\n\n\n');
      ppkCell.appendParagraph(config.namaPPK || '............................................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      ppkCell.appendParagraph('NIP. ' + (config.nipPPK || '......................................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Lampiran_Perjalanan_Dinas');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDokumenRecord(pdId, 'KUITANSI_RAMPUNG', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'KUITANSI_RAMPUNG'
        }
      };

    } catch (e) {
      console.error('Error generating Kuitansi Rampung:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  generateDaftarPengeluaranRiil: function(pdId) {
    const pd = this.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('Daftar Pengeluaran Riil - ' + (pd.tujuan || pd.maksudTujuan));
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      const title = body.appendParagraph('DAFTAR PENGELUARAN RIIL');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('');

      const pelaksana = pd.pelaksana && pd.pelaksana.length > 0 ? pd.pelaksana[0] : {};

      body.appendParagraph('Yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      const infoTable = body.appendTable();
      infoTable.setBorderWidth(0);

      const addInfoRow = (label, value) => {
        const row = infoTable.appendTableRow();
        row.appendTableCell(label).setWidth(80);
        row.appendTableCell(': ' + value);
      };

      addInfoRow('Nama', pelaksana.nama || '-');
      addInfoRow('NIP', pelaksana.nip || '-');
      addInfoRow('Jabatan', pelaksana.jabatan || '-');

      body.appendParagraph('');
      body.appendParagraph('Berdasarkan SPPD tanggal ' + formatTanggalIndo(pd.tanggalBerangkat) + ' Nomor ' + (pd.nomorSPPD || pd.nomorST || '-') + ', dengan ini menyatakan:');
      body.appendParagraph('');
      body.appendParagraph('1. Biaya yang tidak dapat diperoleh bukti pengeluarannya:');

      // Expenses table
      const expTable = body.appendTable();

      const headerRow = expTable.appendTableRow();
      headerRow.appendTableCell('No.').setBold(true).setWidth(40);
      headerRow.appendTableCell('Uraian').setBold(true).setWidth(280);
      headerRow.appendTableCell('Jumlah').setBold(true).setWidth(100);

      const biayaRiil = pd.biaya ? pd.biaya.filter(b =>
        ['TRANSPORT_LOKAL', 'BBM', 'TOL', 'PARKIR', 'LAINNYA'].includes(b.jenisBiaya)
      ) : [];

      let totalPengeluaranRiil = 0;

      if (biayaRiil.length > 0) {
        biayaRiil.forEach((b, idx) => {
          const bRow = expTable.appendTableRow();
          bRow.appendTableCell(String(idx + 1));
          bRow.appendTableCell((JENIS_BIAYA_PD[b.jenisBiaya] || b.jenisBiaya) + (b.keterangan ? ' - ' + b.keterangan : ''));
          const jumlahCell = bRow.appendTableCell('Rp ' + formatRupiahDoc(b.total || 0));
          jumlahCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
          totalPengeluaranRiil += (b.total || 0);
        });
      } else {
        for (let i = 1; i <= 3; i++) {
          const emptyRow = expTable.appendTableRow();
          emptyRow.appendTableCell(String(i));
          emptyRow.appendTableCell('');
          emptyRow.appendTableCell('');
        }
      }

      const totalRow = expTable.appendTableRow();
      totalRow.appendTableCell('');
      totalRow.appendTableCell('Jumlah').setBold(true);
      const totalCell = totalRow.appendTableCell('Rp ' + formatRupiahDoc(totalPengeluaranRiil));
      totalCell.setBold(true);
      totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      body.appendParagraph('');
      body.appendParagraph('2. Jumlah uang tersebut benar-benar dikeluarkan untuk pelaksanaan perjalanan dinas.');
      body.appendParagraph('');
      body.appendParagraph('Demikian pernyataan ini dibuat dengan sebenarnya.');

      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(new Date().toISOString()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('Mengetahui/Menyetujui\nPejabat Pembuat Komitmen,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('Yang melakukan perjalanan dinas,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(config.namaPPK || '....................').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(pelaksana.nama || '....................').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph('NIP. ' + (pelaksana.nip || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Lampiran_Perjalanan_Dinas');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDokumenRecord(pdId, 'DAFTAR_PENGELUARAN', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'DAFTAR_PENGELUARAN'
        }
      };

    } catch (e) {
      console.error('Error generating Daftar Pengeluaran Riil:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  generateSuratPDDalamKota: function(pdId) {
    const pd = this.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('Surat Tugas - ' + (pd.tujuan || pd.maksudTujuan));
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Kop
      const kopInstansi = body.appendParagraph(config.namaSatker || 'NAMA INSTANSI');
      kopInstansi.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      kopInstansi.setBold(true);
      kopInstansi.setFontSize(14);

      body.appendParagraph(config.alamatSatker || 'Alamat').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendHorizontalRule();
      body.appendParagraph('');

      const title = body.appendParagraph('SURAT TUGAS');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(12);

      body.appendParagraph('Nomor: ' + (pd.nomorST || '-')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      body.appendParagraph('Yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      const pejabatTable = body.appendTable();
      pejabatTable.setBorderWidth(0);

      const addRow = (label, value) => {
        const row = pejabatTable.appendTableRow();
        row.appendTableCell(label).setWidth(100);
        row.appendTableCell(': ' + value);
      };

      addRow('Nama', pd.pejabatPerintah || config.namaPPK || '-');
      addRow('NIP', pd.nipPejabatPerintah || config.nipPPK || '-');
      addRow('Jabatan', pd.jabatanPejabatPerintah || config.jabatanPPK || '-');

      body.appendParagraph('');
      body.appendParagraph('Memerintahkan kepada:');
      body.appendParagraph('');

      const pelaksana = pd.pelaksana && pd.pelaksana.length > 0 ? pd.pelaksana[0] : {};

      const plkTable = body.appendTable();
      plkTable.setBorderWidth(0);

      const addPlkRow = (label, value) => {
        const row = plkTable.appendTableRow();
        row.appendTableCell(label).setWidth(100);
        row.appendTableCell(': ' + value);
      };

      addPlkRow('Nama', pelaksana.nama || '-');
      addPlkRow('NIP', pelaksana.nip || '-');
      addPlkRow('Pangkat/Gol', (pelaksana.pangkat || '-') + ' / ' + (pelaksana.golongan || '-'));
      addPlkRow('Jabatan', pelaksana.jabatan || '-');

      body.appendParagraph('');
      body.appendParagraph('Untuk:');

      const detailTable = body.appendTable();

      const addDetailRow = (no, label, value) => {
        const row = detailTable.appendTableRow();
        row.appendTableCell(no).setWidth(30);
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + value);
      };

      addDetailRow('1.', 'Maksud', pd.maksudTujuan || pd.tujuan || '-');
      addDetailRow('2.', 'Tempat Tujuan', (pd.tujuan || '-') + (pd.kotaTujuan ? ', ' + pd.kotaTujuan : ''));
      addDetailRow('3.', 'Tanggal', formatTanggalIndo(pd.tanggalBerangkat) + ' s/d ' + formatTanggalIndo(pd.tanggalKembali));
      addDetailRow('4.', 'Lama', pd.lamaHari + ' hari');
      addDetailRow('5.', 'Transportasi', JENIS_TRANSPORTASI[pd.jenisTransportasi] || pd.jenisTransportasi || '-');

      body.appendParagraph('');
      body.appendParagraph('Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.');

      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(300);
      dateRow.appendTableCell((config.kotaSatker || pd.tempatBerangkat || 'Malang') + ', ' + formatTanggalIndo(pd.tanggalST || new Date().toISOString()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('');
      labelRow.appendTableCell(pd.jabatanPejabatPerintah || config.jabatanPPK || 'Yang Memberi Perintah,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      nameRow.appendTableCell('');
      const nameCell = nameRow.appendTableCell();
      nameCell.appendParagraph(pd.pejabatPerintah || config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      nameCell.appendParagraph('NIP. ' + (pd.nipPejabatPerintah || config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Lampiran_Perjalanan_Dinas');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDokumenRecord(pdId, 'SURAT_TUGAS', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'SURAT_TUGAS'
        }
      };

    } catch (e) {
      console.error('Error generating Surat Tugas:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  }
};

// ========================================
// PD WORKFLOW SERVICE
// ========================================

const PDWorkflowService = {
  getWorkflowStagesLuarKota: function() {
    return [
      { stage: 'DRAFT', label: 'Draft', order: 1 },
      { stage: 'SURAT_TUGAS', label: 'Surat Tugas', order: 2 },
      { stage: 'SPPD', label: 'SPPD', order: 3 },
      { stage: 'PELAKSANAAN', label: 'Pelaksanaan', order: 4 },
      { stage: 'PELAPORAN', label: 'Pelaporan', order: 5 },
      { stage: 'PERTANGGUNGJAWABAN', label: 'SPJ', order: 6 },
      { stage: 'SELESAI', label: 'Selesai', order: 7 }
    ];
  },

  getWorkflowStagesDalamKota: function() {
    return [
      { stage: 'DRAFT', label: 'Draft', order: 1 },
      { stage: 'SURAT_TUGAS', label: 'Surat Tugas', order: 2 },
      { stage: 'PELAKSANAAN', label: 'Pelaksanaan', order: 3 },
      { stage: 'SELESAI', label: 'Selesai', order: 4 }
    ];
  },

  getWorkflowStages: function(jenisPD = null) {
    if (jenisPD === JENIS_PD.DALAM_KOTA) {
      return this.getWorkflowStagesDalamKota();
    }
    return this.getWorkflowStagesLuarKota();
  },

  getStatus: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) return null;

    const stages = this.getWorkflowStages(pd.jenisPD);
    const currentStage = stages.find(s => s.stage === pd.status);
    const currentIndex = stages.findIndex(s => s.stage === pd.status);
    const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
    const prevStage = currentIndex > 0 ? stages[currentIndex - 1] : null;

    return {
      jenisPD: pd.jenisPD,
      jenisPDLabel: JENIS_PD_LABELS[pd.jenisPD],
      currentStage: currentStage?.stage,
      currentStageLabel: currentStage?.label,
      nextStage: nextStage?.stage,
      nextStageLabel: nextStage?.label,
      prevStage: prevStage?.stage,
      prevStageLabel: prevStage?.label,
      progress: Math.round(((currentIndex + 1) / stages.length) * 100),
      stages: stages
    };
  },

  advanceStage: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) return { success: false, error: 'Perjalanan dinas tidak ditemukan' };

    const stages = this.getWorkflowStages(pd.jenisPD);
    const currentIndex = stages.findIndex(s => s.stage === pd.status);

    if (currentIndex >= stages.length - 1) {
      return { success: false, error: 'Sudah di tahap terakhir' };
    }

    const validation = this.validateAdvance(pd, stages[currentIndex + 1].stage);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const nextStage = stages[currentIndex + 1].stage;
    PerjalananDinasService.updateStatus(pdId, nextStage);

    return { success: true, data: this.getStatus(pdId) };
  },

  revertStage: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) return { success: false, error: 'Perjalanan dinas tidak ditemukan' };

    const stages = this.getWorkflowStages(pd.jenisPD);
    const currentIndex = stages.findIndex(s => s.stage === pd.status);

    if (currentIndex <= 0) {
      return { success: false, error: 'Sudah di tahap pertama' };
    }

    const prevStage = stages[currentIndex - 1].stage;
    PerjalananDinasService.updateStatus(pdId, prevStage);

    return { success: true, data: this.getStatus(pdId) };
  },

  validateAdvance: function(pd, targetStage) {
    switch (targetStage) {
      case 'SURAT_TUGAS':
        if (!pd.pelaksana || pd.pelaksana.length === 0) {
          return { valid: false, error: 'Tambahkan minimal 1 pelaksana' };
        }
        if (!pd.tujuan && !pd.maksudTujuan) {
          return { valid: false, error: 'Lengkapi tujuan perjalanan' };
        }
        break;
    }
    return { valid: true };
  }
};

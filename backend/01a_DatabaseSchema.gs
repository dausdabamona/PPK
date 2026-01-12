/**
 * 01a_DatabaseSchema.gs
 * Comprehensive Database Schema Definition
 * Sprint 1: Database & Backend Skeleton
 *
 * This file defines all sheets (tables) with their columns, types, and relationships.
 * Run setupAllDatabaseSheets() to initialize the database.
 */

// ========================================
// SCHEMA DEFINITIONS
// ========================================

const DATABASE_SCHEMA = {

  // ==================== CONFIG ====================
  Config: {
    headers: ['key', 'value', 'description'],
    description: 'Application configuration settings',
    primaryKey: 'key'
  },

  // ==================== PERJALANAN DINAS ====================
  PerjalananDinas: {
    headers: [
      'pdId',                    // PK - Primary Key
      'jenisPD',                 // ENUM: DALAM_KOTA, LUAR_KOTA
      'nomorST',                 // Nomor Surat Tugas
      'nomorSPPD',               // Nomor SPPD
      'tanggalST',               // Tanggal Surat Tugas
      'tanggalSPPD',             // Tanggal SPPD
      'tempatBerangkat',         // Kota asal
      'tujuan',                  // Tujuan/maksud singkat
      'kotaTujuan',              // Kota tujuan
      'provinsiTujuan',          // Provinsi tujuan
      'maksudTujuan',            // Maksud perjalanan detail
      'tanggalBerangkat',        // DATE
      'tanggalKembali',          // DATE
      'lamaHari',                // INTEGER - Calculated
      'tingkatBiaya',            // ENUM: A, B, C, D
      'jenisTransportasi',       // ENUM: PESAWAT, KERETA, BUS, etc.
      'totalBiaya',              // NUMBER - Calculated from BiayaPerjalanan
      'instansiPembebanan',      // Instansi yang membiayai
      'akun',                    // MAK (Mata Anggaran Kegiatan)
      'pejabatPerintah',         // Nama pejabat yang memberi perintah
      'jabatanPejabatPerintah',  // Jabatan pejabat
      'nipPejabatPerintah',      // NIP pejabat
      'instansiLokasi',          // Instansi di lokasi tujuan
      'kotaInstansiLokasi',      // Kota instansi tujuan
      'status',                  // ENUM: DRAFT, SURAT_TUGAS, SPPD, PELAKSANAAN, etc.
      'createdAt',               // TIMESTAMP
      'updatedAt',               // TIMESTAMP
      'createdBy',               // User ID/Name
      'keterangan',              // Catatan tambahan
      'terbilang'                // Total biaya dalam kata
    ],
    description: 'Master data Perjalanan Dinas',
    primaryKey: 'pdId',
    indexes: ['status', 'jenisPD', 'tanggalBerangkat']
  },

  Pelaksana: {
    headers: [
      'pelaksanaId',    // PK
      'pdId',           // FK -> PerjalananDinas.pdId
      'nama',           // Nama pelaksana
      'nip',            // NIP
      'pangkat',        // Pangkat
      'golongan',       // Golongan
      'jabatan',        // Jabatan
      'instansi',       // Unit kerja
      'tingkatBiaya',   // ENUM: A, B, C, D
      'uangHarian',     // NUMBER - Tarif uang harian
      'isPenanggungJawab', // BOOLEAN - Apakah penanggung jawab
      'createdAt'       // TIMESTAMP
    ],
    description: 'Pelaksana Perjalanan Dinas',
    primaryKey: 'pelaksanaId',
    foreignKeys: { pdId: 'PerjalananDinas.pdId' }
  },

  BiayaPerjalanan: {
    headers: [
      'biayaId',        // PK
      'pdId',           // FK -> PerjalananDinas.pdId
      'jenisBiaya',     // ENUM: UANG_HARIAN, TRANSPORT_LOKAL, etc.
      'keterangan',     // Deskripsi biaya
      'jumlah',         // Quantity
      'satuan',         // Unit (hari, orang, tiket, etc.)
      'hargaSatuan',    // NUMBER - Harga per satuan
      'total',          // NUMBER - Calculated (jumlah * hargaSatuan)
      'buktiUrl',       // URL ke bukti
      'createdAt'       // TIMESTAMP
    ],
    description: 'Rincian biaya Perjalanan Dinas',
    primaryKey: 'biayaId',
    foreignKeys: { pdId: 'PerjalananDinas.pdId' }
  },

  LampiranPD: {
    headers: [
      'lampiranId',     // PK
      'pdId',           // FK -> PerjalananDinas.pdId
      'filename',       // Original filename
      'mimeType',       // File MIME type
      'fileSize',       // File size in bytes
      'googleFileId',   // Google Drive file ID
      'googleFileUrl',  // Google Drive URL
      'kategori',       // ENUM: SURAT_TUGAS, SPPD, UNDANGAN, etc.
      'keterangan',     // Deskripsi
      'uploadedAt',     // TIMESTAMP
      'uploadedBy',     // User ID/Name
      'isVerified'      // BOOLEAN
    ],
    description: 'Lampiran dokumen Perjalanan Dinas',
    primaryKey: 'lampiranId',
    foreignKeys: { pdId: 'PerjalananDinas.pdId' }
  },

  DokumenPD: {
    headers: [
      'docId',          // PK
      'pdId',           // FK -> PerjalananDinas.pdId
      'jenisDokumen',   // ENUM: SPPD, SURAT_TUGAS, KUITANSI_RAMPUNG, etc.
      'nomorDokumen',   // Nomor dokumen
      'tanggalDokumen', // Tanggal dokumen
      'googleDocId',    // Google Doc ID
      'googleDocUrl',   // Google Doc URL
      'status',         // ENUM: GENERATED, SIGNED, ARCHIVED
      'createdAt',      // TIMESTAMP
      'createdBy'       // User ID/Name
    ],
    description: 'Dokumen generated untuk Perjalanan Dinas',
    primaryKey: 'docId',
    foreignKeys: { pdId: 'PerjalananDinas.pdId' }
  },

  // ==================== PAKET PENGADAAN ====================
  Paket: {
    headers: [
      'paketId',          // PK
      'namaPaket',        // Nama paket pengadaan
      'jenisPengadaan',   // ENUM: BARANG, PEKERJAAN_KONSTRUKSI, etc.
      'metodePengadaan',  // ENUM: PENGADAAN_LANGSUNG, TENDER, etc.
      'paguAnggaran',     // NUMBER - Pagu anggaran
      'nilaiHPS',         // NUMBER - Nilai HPS
      'nilaiKontrak',     // NUMBER - Nilai kontrak
      'sumberDana',       // Sumber pendanaan
      'mak',              // Mata Anggaran Kegiatan
      'tahunAnggaran',    // Year (YYYY)
      'tanggalPengadaan', // DATE - Tanggal mulai pengadaan
      'tanggalKontrak',   // DATE - Tanggal kontrak
      'tanggalSelesai',   // DATE - Tanggal selesai
      'penyediaId',       // FK -> Penyedia.penyediaId
      'namaPenyedia',     // Denormalized for display
      'status',           // ENUM: DRAFT, PERENCANAAN, SURVEY_HARGA, etc.
      'progress',         // NUMBER (0-100)
      'keterangan',       // Catatan
      'createdAt',        // TIMESTAMP
      'updatedAt',        // TIMESTAMP
      'createdBy'         // User ID/Name
    ],
    description: 'Master data Paket Pengadaan',
    primaryKey: 'paketId',
    indexes: ['status', 'tahunAnggaran', 'jenisPengadaan'],
    foreignKeys: { penyediaId: 'Penyedia.penyediaId' }
  },

  Items: {
    headers: [
      'itemId',       // PK
      'paketId',      // FK -> Paket.paketId
      'namaBarang',   // Nama item
      'spesifikasi',  // Spesifikasi teknis
      'satuan',       // Unit (unit, pcs, set, etc.)
      'volume',       // Quantity
      'hargaSatuan',  // NUMBER - Harga per unit
      'hargaTotal',   // NUMBER - Calculated (volume * hargaSatuan)
      'kategori',     // Kategori item
      'urutan',       // INTEGER - Sort order
      'createdAt',    // TIMESTAMP
      'updatedAt'     // TIMESTAMP
    ],
    description: 'Item dalam Paket Pengadaan',
    primaryKey: 'itemId',
    foreignKeys: { paketId: 'Paket.paketId' }
  },

  Surveys: {
    headers: [
      'surveyId',       // PK
      'itemId',         // FK -> Items.itemId
      'paketId',        // FK -> Paket.paketId (denormalized)
      'namaPenyedia',   // Nama penyedia survey
      'alamatPenyedia', // Alamat penyedia
      'kontakPenyedia', // Kontak (phone/email)
      'hargaPenawaran', // NUMBER - Harga yang ditawarkan
      'tanggalSurvey',  // DATE
      'keterangan',     // Catatan survey
      'isSelected',     // BOOLEAN - Dipilih sebagai HPS
      'createdAt'       // TIMESTAMP
    ],
    description: 'Data Survey Harga per Item',
    primaryKey: 'surveyId',
    foreignKeys: {
      itemId: 'Items.itemId',
      paketId: 'Paket.paketId'
    }
  },

  LampiranPaket: {
    headers: [
      'lampiranId',     // PK
      'paketId',        // FK -> Paket.paketId
      'filename',       // Original filename
      'mimeType',       // File MIME type
      'fileSize',       // File size in bytes
      'googleFileId',   // Google Drive file ID
      'googleFileUrl',  // Google Drive URL
      'kategori',       // ENUM: KAK, SPESIFIKASI, RAB, etc.
      'keterangan',     // Deskripsi
      'uploadedAt',     // TIMESTAMP
      'uploadedBy'      // User ID/Name
    ],
    description: 'Lampiran dokumen Paket Pengadaan',
    primaryKey: 'lampiranId',
    foreignKeys: { paketId: 'Paket.paketId' }
  },

  DokumenPaket: {
    headers: [
      'docId',          // PK
      'paketId',        // FK -> Paket.paketId
      'jenisDokumen',   // ENUM: HPS, SPK, KONTRAK, BAST, etc.
      'nomorDokumen',   // Nomor dokumen
      'tanggalDokumen', // Tanggal dokumen
      'googleDocId',    // Google Doc ID
      'googleDocUrl',   // Google Doc URL
      'status',         // ENUM: GENERATED, SIGNED, ARCHIVED
      'createdAt',      // TIMESTAMP
      'createdBy'       // User ID/Name
    ],
    description: 'Dokumen generated untuk Paket Pengadaan',
    primaryKey: 'docId',
    foreignKeys: { paketId: 'Paket.paketId' }
  },

  Kontrak: {
    headers: [
      'kontrakId',        // PK
      'paketId',          // FK -> Paket.paketId
      'nomorKontrak',     // Nomor kontrak
      'tanggalKontrak',   // DATE
      'nilaiKontrak',     // NUMBER
      'tanggalMulai',     // DATE - Mulai pelaksanaan
      'tanggalSelesai',   // DATE - Target selesai
      'jangkaWaktu',      // Duration description
      'penyediaId',       // FK -> Penyedia.penyediaId
      'namaPenyedia',     // Denormalized
      'alamatPenyedia',   // Denormalized
      'npwpPenyedia',     // Denormalized
      'direkturPenyedia', // Denormalized
      'status',           // ENUM: ACTIVE, COMPLETED, TERMINATED
      'createdAt',        // TIMESTAMP
      'updatedAt'         // TIMESTAMP
    ],
    description: 'Data Kontrak Pengadaan',
    primaryKey: 'kontrakId',
    foreignKeys: {
      paketId: 'Paket.paketId',
      penyediaId: 'Penyedia.penyediaId'
    }
  },

  Pembayaran: {
    headers: [
      'pembayaranId',   // PK
      'paketId',        // FK -> Paket.paketId
      'kontrakId',      // FK -> Kontrak.kontrakId
      'termin',         // INTEGER - Termin ke-
      'nilaiTagihan',   // NUMBER - Nilai DPP
      'nilaiPPN',       // NUMBER - PPN
      'nilaiPPH',       // NUMBER - PPh
      'nilaiNetto',     // NUMBER - Total yang dibayarkan
      'tanggalTagihan', // DATE - Tanggal tagihan masuk
      'tanggalBayar',   // DATE - Tanggal pembayaran
      'nomorSPM',       // Nomor SPM
      'nomorSP2D',      // Nomor SP2D
      'status',         // ENUM: PENDING, PROSES, DIBAYAR
      'keterangan',     // Catatan
      'createdAt',      // TIMESTAMP
      'updatedAt'       // TIMESTAMP
    ],
    description: 'Data Pembayaran/Tagihan',
    primaryKey: 'pembayaranId',
    foreignKeys: {
      paketId: 'Paket.paketId',
      kontrakId: 'Kontrak.kontrakId'
    }
  },

  SerahTerima: {
    headers: [
      'serahTerimaId',  // PK
      'paketId',        // FK -> Paket.paketId
      'kontrakId',      // FK -> Kontrak.kontrakId
      'jenisBA',        // ENUM: BAST, BAPHO, BASTPHO
      'nomorBA',        // Nomor Berita Acara
      'tanggalBA',      // DATE
      'persentase',     // NUMBER - Persentase pekerjaan (0-100)
      'nilaiPekerjaan', // NUMBER - Nilai pekerjaan
      'keterangan',     // Catatan
      'googleDocId',    // Google Doc ID
      'googleDocUrl',   // Google Doc URL
      'status',         // ENUM: DRAFT, FINAL
      'createdAt'       // TIMESTAMP
    ],
    description: 'Data Serah Terima Pekerjaan',
    primaryKey: 'serahTerimaId',
    foreignKeys: {
      paketId: 'Paket.paketId',
      kontrakId: 'Kontrak.kontrakId'
    }
  },

  // ==================== PENYEDIA ====================
  Penyedia: {
    headers: [
      'penyediaId',       // PK
      'namaPenyedia',     // Nama perusahaan
      'alamat',           // Alamat lengkap
      'kota',             // Kota
      'provinsi',         // Provinsi
      'telepon',          // Nomor telepon
      'email',            // Email
      'website',          // Website
      'npwp',             // NPWP
      'siup',             // Nomor SIUP
      'nib',              // Nomor NIB
      'direktur',         // Nama direktur
      'jabatanDirektur',  // Jabatan direktur
      'bank',             // Nama bank
      'noRekening',       // Nomor rekening
      'namaRekening',     // Nama pemilik rekening
      'kategori',         // Kategori penyedia
      'keterangan',       // Catatan
      'isActive',         // BOOLEAN
      'createdAt',        // TIMESTAMP
      'updatedAt'         // TIMESTAMP
    ],
    description: 'Master data Penyedia/Vendor',
    primaryKey: 'penyediaId',
    indexes: ['namaPenyedia', 'npwp', 'isActive']
  },

  // ==================== NUMBERING ====================
  Numbering: {
    headers: [
      'patternId',    // PK
      'docType',      // Document type (SPPD, SPK, etc.)
      'pattern',      // Pattern string
      'prefix',       // Prefix
      'suffix',       // Suffix
      'separator',    // Separator character
      'resetPeriod',  // ENUM: YEARLY, MONTHLY, NEVER
      'lastNumber',   // Last generated number
      'lastReset',    // Last reset timestamp
      'description',  // Description
      'isActive',     // BOOLEAN
      'createdAt',    // TIMESTAMP
      'updatedAt'     // TIMESTAMP
    ],
    description: 'Auto-numbering patterns',
    primaryKey: 'patternId',
    indexes: ['docType']
  },

  // ==================== DOCUMENT VERSIONS ====================
  DocumentVersions: {
    headers: [
      'versionId',    // PK
      'docId',        // Document ID (not FK, logical ID)
      'docType',      // Document type
      'entityId',     // Related entity ID (paketId, pdId)
      'entityType',   // Entity type (PAKET, PD)
      'version',      // INTEGER - Version number
      'revision',     // INTEGER - Revision number
      'status',       // ENUM: DRAFT, PENDING, APPROVED, SUPERSEDED, VOID
      'googleDocId',  // Google Doc ID
      'googleDocUrl', // Google Doc URL
      'changes',      // Change description
      'changedBy',    // User who made changes
      'changedAt',    // TIMESTAMP
      'approvedBy',   // Approver
      'approvedAt',   // Approval timestamp
      'isActive',     // BOOLEAN
      'createdAt'     // TIMESTAMP
    ],
    description: 'Document version history',
    primaryKey: 'versionId',
    indexes: ['docId', 'entityId', 'status']
  }
};

// ========================================
// SCHEMA SETUP FUNCTIONS
// ========================================

/**
 * Initialize all database sheets
 * @returns {Object} Setup result
 */
function setupAllDatabaseSheets() {
  const ss = getSpreadsheet();
  const results = [];

  console.log('🚀 Starting database schema setup...');

  Object.keys(DATABASE_SCHEMA).forEach(sheetName => {
    try {
      const schema = DATABASE_SCHEMA[sheetName];
      const sheet = ensureSheetWithSchema(sheetName, schema);
      results.push({ sheet: sheetName, status: 'success' });
      console.log(`✅ ${sheetName} - Ready`);
    } catch (e) {
      results.push({ sheet: sheetName, status: 'error', error: e.message });
      console.error(`❌ ${sheetName} - Error: ${e.message}`);
    }
  });

  console.log('✨ Database schema setup complete!');

  return {
    success: results.every(r => r.status === 'success'),
    results: results,
    totalSheets: Object.keys(DATABASE_SCHEMA).length,
    message: `Setup complete: ${results.filter(r => r.status === 'success').length}/${results.length} sheets created`
  };
}

/**
 * Create or verify sheet with schema
 * @param {string} sheetName - Sheet name
 * @param {Object} schema - Schema definition
 * @returns {Sheet} Google Sheet object
 */
function ensureSheetWithSchema(sheetName, schema) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Create new sheet
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
    sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, schema.headers.length).setBackground('#4a86e8');
    sheet.getRange(1, 1, 1, schema.headers.length).setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= schema.headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  } else {
    // Verify existing sheet has correct headers
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add missing headers
    schema.headers.forEach((header, index) => {
      if (!existingHeaders.includes(header)) {
        const newCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, newCol).setValue(header);
        sheet.getRange(1, newCol).setFontWeight('bold');
        sheet.getRange(1, newCol).setBackground('#4a86e8');
        sheet.getRange(1, newCol).setFontColor('#ffffff');
      }
    });
  }

  return sheet;
}

/**
 * Get schema for a specific sheet
 * @param {string} sheetName - Sheet name
 * @returns {Object|null} Schema definition
 */
function getSchemaForSheet(sheetName) {
  return DATABASE_SCHEMA[sheetName] || null;
}

/**
 * Validate data against schema
 * @param {string} sheetName - Sheet name
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateDataAgainstSchema(sheetName, data) {
  const schema = DATABASE_SCHEMA[sheetName];
  if (!schema) {
    return { valid: false, error: `Schema not found for: ${sheetName}` };
  }

  const errors = [];
  const pk = schema.primaryKey;

  // Check required fields (primary key must exist for updates)
  if (data[pk] === undefined && pk !== 'key') {
    // This is OK for creates, PK will be generated
  }

  // Check for unknown fields
  Object.keys(data).forEach(field => {
    if (!schema.headers.includes(field)) {
      errors.push(`Unknown field: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get database statistics
 * @returns {Object} Statistics
 */
function getDatabaseStats() {
  const stats = {};

  Object.keys(DATABASE_SCHEMA).forEach(sheetName => {
    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (sheet) {
      const rowCount = Math.max(0, sheet.getLastRow() - 1); // Exclude header
      stats[sheetName] = {
        rowCount: rowCount,
        columnCount: sheet.getLastColumn(),
        exists: true
      };
    } else {
      stats[sheetName] = {
        rowCount: 0,
        columnCount: 0,
        exists: false
      };
    }
  });

  return {
    totalSheets: Object.keys(DATABASE_SCHEMA).length,
    existingSheets: Object.values(stats).filter(s => s.exists).length,
    totalRows: Object.values(stats).reduce((sum, s) => sum + s.rowCount, 0),
    details: stats
  };
}

/**
 * Export schema documentation as JSON
 * @returns {Object} Schema documentation
 */
function exportSchemaDocumentation() {
  return {
    version: '1.0.0',
    generatedAt: getTimestamp(),
    schema: DATABASE_SCHEMA
  };
}

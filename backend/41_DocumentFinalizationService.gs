/**
 * 41_DocumentFinalizationService.gs
 * Sprint 5: Production & Audit Readiness
 *
 * Document Finalization & Versioning
 * - Document status: DRAFT, FINAL, REVISED, VOID
 * - Lock FINAL documents from edit
 * - Revision history with reason and date
 * - Legal numbering per jenis dokumen & tahun anggaran
 */

// ========================================
// DOCUMENT STATUS CONSTANTS
// ========================================

const DOC_STATUS = {
  DRAFT: 'DRAFT',
  FINAL: 'FINAL',
  REVISED: 'REVISED',
  VOID: 'VOID'
};

const DOC_STATUS_LABELS = {
  DRAFT: 'Draft',
  FINAL: 'Final',
  REVISED: 'Revisi',
  VOID: 'Batal/Void'
};

// Document types and their numbering format
const DOC_NUMBERING_FORMAT = {
  // Paket documents
  SURAT_PENETAPAN_PENYEDIA: { prefix: 'SPP', segment: 'PL.01' },
  KONTRAK: { prefix: 'SPK', segment: 'PL.02' },
  SPMK: { prefix: 'SPMK', segment: 'PL.03' },
  BAST: { prefix: 'BAST', segment: 'PL.04' },

  // Perjalanan Dinas documents
  SURAT_TUGAS: { prefix: 'ST', segment: 'PL.05' },
  SPPD: { prefix: 'SPPD', segment: 'PL.05' },
  KUITANSI_RAMPUNG: { prefix: 'KR', segment: 'PL.05' },
  DAFTAR_PENGELUARAN: { prefix: 'DPR', segment: 'PL.05' },

  // General documents
  NOTA_DINAS: { prefix: 'ND', segment: 'TU.01' },
  BERITA_ACARA: { prefix: 'BA', segment: 'TU.02' }
};

// ========================================
// DOCUMENT FINALIZATION SERVICE
// ========================================

const DocumentFinalizationService = {

  /**
   * Setup DocumentMaster sheet
   */
  setupDocumentMasterSheet: function() {
    const ss = getSpreadsheet();
    const headers = [
      'docMasterId', 'docType', 'refId', 'refType', 'nomorDokumen',
      'tanggalDokumen', 'perihal', 'status', 'googleDocId', 'googleDocUrl',
      'currentVersion', 'createdAt', 'createdBy', 'finalizedAt', 'finalizedBy',
      'voidedAt', 'voidedBy', 'voidReason', 'tahunAnggaran', 'isLocked'
    ];
    ensureSheet('DocumentMaster', headers);

    // Document revision history
    const revisionHeaders = [
      'revisionId', 'docMasterId', 'version', 'action', 'reason',
      'previousStatus', 'newStatus', 'timestamp', 'userId', 'changes'
    ];
    ensureSheet('DocumentRevisionHistory', revisionHeaders);

    // Numbering counter
    const counterHeaders = [
      'counterId', 'docType', 'tahunAnggaran', 'lastNumber', 'format', 'updatedAt'
    ];
    ensureSheet('DocumentNumberingCounter', counterHeaders);

    return { success: true, message: 'Document master sheets created' };
  },

  /**
   * Generate legal document number
   */
  generateDocumentNumber: function(docType, tahun = null) {
    this.setupDocumentMasterSheet();

    const year = tahun || new Date().getFullYear();
    const config = DOC_NUMBERING_FORMAT[docType];

    if (!config) {
      return { success: false, error: 'Unknown document type: ' + docType };
    }

    const ss = getSpreadsheet();
    const counterSheet = ss.getSheetByName('DocumentNumberingCounter');
    const data = counterSheet.getDataRange().getValues();
    const headers = data[0];

    // Find or create counter for this docType and year
    let rowIndex = -1;
    let lastNumber = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('docType')] === docType &&
          String(data[i][headers.indexOf('tahunAnggaran')]) === String(year)) {
        rowIndex = i;
        lastNumber = data[i][headers.indexOf('lastNumber')] || 0;
        break;
      }
    }

    // Increment number
    const newNumber = lastNumber + 1;
    const paddedNumber = String(newNumber).padStart(4, '0');

    // Generate formatted number: [PREFIX]/[NUMBER]/[SEGMENT]/[YEAR]
    // Example: SPP/0001/PL.01/2026
    const formattedNumber = `${config.prefix}/${paddedNumber}/${config.segment}/${year}`;

    // Update counter
    if (rowIndex > 0) {
      counterSheet.getRange(rowIndex + 1, headers.indexOf('lastNumber') + 1).setValue(newNumber);
      counterSheet.getRange(rowIndex + 1, headers.indexOf('updatedAt') + 1).setValue(getTimestamp());
    } else {
      const counterId = generateId('CNT');
      const row = [counterId, docType, year, newNumber, config.prefix + '/XXXX/' + config.segment + '/' + year, getTimestamp()];
      counterSheet.appendRow(row);
    }

    return {
      success: true,
      data: {
        nomorDokumen: formattedNumber,
        sequence: newNumber,
        docType: docType,
        tahunAnggaran: year
      }
    };
  },

  /**
   * Register new document in master
   */
  registerDocument: function(data) {
    this.setupDocumentMasterSheet();

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    const docMasterId = generateId('DM');
    const now = getTimestamp();

    // Generate number if not provided
    let nomorDokumen = data.nomorDokumen;
    if (!nomorDokumen && data.docType) {
      const numberResult = this.generateDocumentNumber(data.docType, data.tahunAnggaran);
      if (numberResult.success) {
        nomorDokumen = numberResult.data.nomorDokumen;
      }
    }

    const row = [
      docMasterId,
      data.docType || '',
      data.refId || '',
      data.refType || '',
      nomorDokumen || '',
      data.tanggalDokumen || now.split('T')[0],
      data.perihal || '',
      DOC_STATUS.DRAFT,
      data.googleDocId || '',
      data.googleDocUrl || '',
      1, // currentVersion
      now,
      data.createdBy || '',
      '', // finalizedAt
      '', // finalizedBy
      '', // voidedAt
      '', // voidedBy
      '', // voidReason
      data.tahunAnggaran || new Date().getFullYear(),
      false // isLocked
    ];

    sheet.appendRow(row);

    // Log creation
    this.logRevision(docMasterId, 1, 'CREATE', 'Document created', '', DOC_STATUS.DRAFT, data.createdBy);

    return {
      success: true,
      data: {
        docMasterId: docMasterId,
        nomorDokumen: nomorDokumen,
        status: DOC_STATUS.DRAFT
      }
    };
  },

  /**
   * Get document by ID
   */
  getDocument: function(docMasterId) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    if (!sheet) return null;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docMasterId) {
        const doc = {};
        headers.forEach((h, j) => doc[h] = data[i][j]);
        doc.revisions = this.getRevisionHistory(docMasterId);
        doc.statusLabel = DOC_STATUS_LABELS[doc.status] || doc.status;
        return doc;
      }
    }

    return null;
  },

  /**
   * Finalize document (DRAFT -> FINAL)
   */
  finalizeDocument: function(docMasterId, userId = '') {
    const doc = this.getDocument(docMasterId);
    if (!doc) {
      return { success: false, error: 'Document not found' };
    }

    if (doc.status !== DOC_STATUS.DRAFT) {
      return { success: false, error: 'Only DRAFT documents can be finalized' };
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docMasterId) {
        const now = getTimestamp();

        // Update status
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue(DOC_STATUS.FINAL);
        sheet.getRange(i + 1, headers.indexOf('isLocked') + 1).setValue(true);
        sheet.getRange(i + 1, headers.indexOf('finalizedAt') + 1).setValue(now);
        sheet.getRange(i + 1, headers.indexOf('finalizedBy') + 1).setValue(userId);

        // Log revision
        this.logRevision(docMasterId, doc.currentVersion, 'FINALIZE', 'Document finalized',
          DOC_STATUS.DRAFT, DOC_STATUS.FINAL, userId);

        return {
          success: true,
          data: {
            docMasterId: docMasterId,
            status: DOC_STATUS.FINAL,
            finalizedAt: now,
            isLocked: true
          }
        };
      }
    }

    return { success: false, error: 'Failed to update document' };
  },

  /**
   * Revise document (FINAL -> REVISED, creates new version)
   */
  reviseDocument: function(docMasterId, reason, userId = '') {
    const doc = this.getDocument(docMasterId);
    if (!doc) {
      return { success: false, error: 'Document not found' };
    }

    if (doc.status !== DOC_STATUS.FINAL) {
      return { success: false, error: 'Only FINAL documents can be revised' };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Revision reason is required' };
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docMasterId) {
        const now = getTimestamp();
        const newVersion = doc.currentVersion + 1;

        // Update status and version
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue(DOC_STATUS.REVISED);
        sheet.getRange(i + 1, headers.indexOf('currentVersion') + 1).setValue(newVersion);
        sheet.getRange(i + 1, headers.indexOf('isLocked') + 1).setValue(false);

        // Log revision
        this.logRevision(docMasterId, newVersion, 'REVISE', reason,
          DOC_STATUS.FINAL, DOC_STATUS.REVISED, userId);

        return {
          success: true,
          data: {
            docMasterId: docMasterId,
            status: DOC_STATUS.REVISED,
            currentVersion: newVersion,
            isLocked: false
          }
        };
      }
    }

    return { success: false, error: 'Failed to revise document' };
  },

  /**
   * Void document
   */
  voidDocument: function(docMasterId, reason, userId = '') {
    const doc = this.getDocument(docMasterId);
    if (!doc) {
      return { success: false, error: 'Document not found' };
    }

    if (doc.status === DOC_STATUS.VOID) {
      return { success: false, error: 'Document is already voided' };
    }

    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Void reason is required' };
    }

    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === docMasterId) {
        const now = getTimestamp();
        const previousStatus = doc.status;

        // Update status
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue(DOC_STATUS.VOID);
        sheet.getRange(i + 1, headers.indexOf('isLocked') + 1).setValue(true);
        sheet.getRange(i + 1, headers.indexOf('voidedAt') + 1).setValue(now);
        sheet.getRange(i + 1, headers.indexOf('voidedBy') + 1).setValue(userId);
        sheet.getRange(i + 1, headers.indexOf('voidReason') + 1).setValue(reason);

        // Log revision
        this.logRevision(docMasterId, doc.currentVersion, 'VOID', reason,
          previousStatus, DOC_STATUS.VOID, userId);

        return {
          success: true,
          data: {
            docMasterId: docMasterId,
            status: DOC_STATUS.VOID,
            voidedAt: now,
            voidReason: reason
          }
        };
      }
    }

    return { success: false, error: 'Failed to void document' };
  },

  /**
   * Log revision history
   */
  logRevision: function(docMasterId, version, action, reason, prevStatus, newStatus, userId) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentRevisionHistory');
    if (!sheet) return;

    const revisionId = generateId('REV');
    const row = [
      revisionId,
      docMasterId,
      version,
      action,
      reason,
      prevStatus,
      newStatus,
      getTimestamp(),
      userId,
      '' // changes (JSON if needed)
    ];

    sheet.appendRow(row);
    return revisionId;
  },

  /**
   * Get revision history
   */
  getRevisionHistory: function(docMasterId) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentRevisionHistory');
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];

    return data.slice(1)
      .filter(row => row[headers.indexOf('docMasterId')] === docMasterId)
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  /**
   * Check if document can be edited
   */
  canEdit: function(docMasterId) {
    const doc = this.getDocument(docMasterId);
    if (!doc) return { canEdit: false, reason: 'Document not found' };

    if (doc.isLocked) {
      return { canEdit: false, reason: 'Document is locked' };
    }

    if (doc.status === DOC_STATUS.FINAL) {
      return { canEdit: false, reason: 'FINAL document cannot be edited. Revise first.' };
    }

    if (doc.status === DOC_STATUS.VOID) {
      return { canEdit: false, reason: 'VOID document cannot be edited' };
    }

    return { canEdit: true, reason: null };
  },

  /**
   * Get documents by reference
   */
  getDocumentsByRef: function(refId, refType = null) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('DocumentMaster');
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];

    return data.slice(1)
      .filter(row => {
        const matchRef = row[headers.indexOf('refId')] === refId;
        const matchType = !refType || row[headers.indexOf('refType')] === refType;
        return matchRef && matchType;
      })
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        obj.statusLabel = DOC_STATUS_LABELS[obj.status] || obj.status;
        return obj;
      });
  },

  /**
   * Get numbering statistics
   */
  getNumberingStats: function(tahun = null) {
    const year = tahun || new Date().getFullYear();
    const ss = getSpreadsheet();
    const counterSheet = ss.getSheetByName('DocumentNumberingCounter');
    if (!counterSheet) return {};

    const data = counterSheet.getDataRange().getValues();
    if (data.length <= 1) return {};

    const headers = data[0];
    const stats = {};

    data.slice(1).forEach(row => {
      if (String(row[headers.indexOf('tahunAnggaran')]) === String(year)) {
        const docType = row[headers.indexOf('docType')];
        stats[docType] = {
          lastNumber: row[headers.indexOf('lastNumber')],
          format: row[headers.indexOf('format')],
          updatedAt: row[headers.indexOf('updatedAt')]
        };
      }
    });

    return stats;
  }
};

/**
 * 17_DocumentVersioning.gs
 * Auto-Numbering Format and Document Versioning
 */

// ========================================
// 3. AUTO-NUMBERING FORMAT
// ========================================

const AUTO_NUMBERING_FORMATS = {

  // ==================== PAKET DOCUMENTS ====================

  HPS: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'HPS',
    separator: '/',
    padding: 3,           // 001, 002, 003
    resetPeriod: 'YEARLY', // Reset setiap tahun
    example: 'HPS/001/SATKER/2024'
  },

  SPK: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'SPK',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'SPK/001/SATKER/2024'
  },

  KONTRAK: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'KTR',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'KTR/001/SATKER/2024'
  },

  BAST: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'BA',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'BA/001/SATKER/2024'
  },

  KUITANSI: {
    pattern: '{PREFIX}/{NO}/{YEAR}',
    prefix: 'KW',
    separator: '/',
    padding: 4,
    resetPeriod: 'YEARLY',
    example: 'KW/0001/2024'
  },

  BA_NEGO: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'BAN',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'BAN/001/SATKER/2024'
  },

  SPMK: {
    pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
    prefix: 'SPMK',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'SPMK/001/SATKER/2024'
  },

  // ==================== PD DOCUMENTS ====================

  SURAT_TUGAS: {
    pattern: '{PREFIX}/{NO}/{MONTH}/{YEAR}',
    prefix: 'ST',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'ST/001/01/2024'
  },

  SPPD: {
    pattern: '{PREFIX}/{NO}/{MONTH}/{YEAR}',
    prefix: 'SPPD',
    separator: '/',
    padding: 3,
    resetPeriod: 'YEARLY',
    example: 'SPPD/001/01/2024'
  },

  KUITANSI_RAMPUNG: {
    pattern: '{PREFIX}/{NO}/{YEAR}',
    prefix: 'KR',
    separator: '/',
    padding: 4,
    resetPeriod: 'YEARLY',
    example: 'KR/0001/2024'
  },

  DPR: {
    pattern: '{PREFIX}/{NO}/{YEAR}',
    prefix: 'DPR',
    separator: '/',
    padding: 4,
    resetPeriod: 'YEARLY',
    example: 'DPR/0001/2024'
  }
};

// ========================================
// NUMBERING VARIABLES
// ========================================

const NUMBERING_VARIABLES = {
  '{PREFIX}': 'Prefix dokumen (HPS, SPK, SPPD, dll)',
  '{NO}': 'Nomor urut dengan padding',
  '{YEAR}': 'Tahun 4 digit (2024)',
  '{YEAR2}': 'Tahun 2 digit (24)',
  '{MONTH}': 'Bulan 2 digit (01-12)',
  '{UNIT}': 'Kode satuan kerja',
  '{SEP}': 'Separator (/, -, .)',
  '{SUFFIX}': 'Suffix opsional'
};

// ========================================
// 4. VERSIONING AND REVISION HANDLING
// ========================================

function setupDocumentVersionSheet() {
  const headers = [
    'versionId', 'docId', 'docType', 'entityId', 'entityType',
    'version', 'revision', 'status',
    'googleDocId', 'googleDocUrl',
    'changes', 'changedBy', 'changedAt',
    'approvedBy', 'approvedAt',
    'isActive', 'createdAt'
  ];
  ensureSheet('DocumentVersions', headers);
}

const DocumentVersioningService = {

  // Version status
  VERSION_STATUS: {
    DRAFT: 'DRAFT',           // Initial draft
    PENDING: 'PENDING',       // Pending approval
    APPROVED: 'APPROVED',     // Approved
    SUPERSEDED: 'SUPERSEDED', // Replaced by newer version
    VOID: 'VOID'              // Cancelled/void
  },

  // ==================== CREATE NEW VERSION ====================
  createVersion: function(docId, docType, entityId, entityType, googleDocId, googleDocUrl, changedBy) {
    setupDocumentVersionSheet();

    // Get current latest version
    const latestVersion = this.getLatestVersion(docId);
    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // Mark previous version as superseded
    if (latestVersion) {
      this.updateVersionStatus(latestVersion.versionId, this.VERSION_STATUS.SUPERSEDED);
    }

    const versionId = generateId('VER');
    const now = getTimestamp();

    const row = [
      versionId,
      docId,
      docType,
      entityId,
      entityType,
      newVersionNumber,
      0, // revision starts at 0
      this.VERSION_STATUS.DRAFT,
      googleDocId,
      googleDocUrl,
      '', // changes description
      changedBy || '',
      now,
      '', // approvedBy
      '', // approvedAt
      true, // isActive
      now
    ];

    getSpreadsheet().getSheetByName('DocumentVersions').appendRow(row);

    return {
      versionId,
      docId,
      version: newVersionNumber,
      revision: 0,
      status: this.VERSION_STATUS.DRAFT,
      googleDocUrl
    };
  },

  // ==================== CREATE REVISION ====================
  createRevision: function(docId, changes, changedBy) {
    const latestVersion = this.getLatestVersion(docId);
    if (!latestVersion) {
      return { success: false, error: 'Dokumen tidak ditemukan' };
    }

    // Can only revise DRAFT or APPROVED documents
    if (![this.VERSION_STATUS.DRAFT, this.VERSION_STATUS.APPROVED].includes(latestVersion.status)) {
      return { success: false, error: 'Dokumen tidak dapat direvisi dengan status: ' + latestVersion.status };
    }

    const versionId = generateId('VER');
    const now = getTimestamp();

    const row = [
      versionId,
      docId,
      latestVersion.docType,
      latestVersion.entityId,
      latestVersion.entityType,
      latestVersion.version,
      latestVersion.revision + 1, // increment revision
      this.VERSION_STATUS.DRAFT,
      latestVersion.googleDocId,
      latestVersion.googleDocUrl,
      changes || '',
      changedBy || '',
      now,
      '',
      '',
      true,
      now
    ];

    // Mark previous as superseded
    this.updateVersionStatus(latestVersion.versionId, this.VERSION_STATUS.SUPERSEDED);

    getSpreadsheet().getSheetByName('DocumentVersions').appendRow(row);

    return {
      success: true,
      data: {
        versionId,
        docId,
        version: latestVersion.version,
        revision: latestVersion.revision + 1,
        status: this.VERSION_STATUS.DRAFT
      }
    };
  },

  // ==================== GET LATEST VERSION ====================
  getLatestVersion: function(docId) {
    const versions = getRowsByColumn('DocumentVersions', 'docId', docId);
    if (versions.length === 0) return null;

    // Sort by version desc, then revision desc
    versions.sort((a, b) => {
      if (b.version !== a.version) return b.version - a.version;
      return b.revision - a.revision;
    });

    const latest = versions[0];
    latest.id = latest.versionId;
    return latest;
  },

  // ==================== GET VERSION HISTORY ====================
  getVersionHistory: function(docId) {
    const versions = getRowsByColumn('DocumentVersions', 'docId', docId);

    return versions
      .map(v => ({
        ...v,
        id: v.versionId,
        versionLabel: `v${v.version}.${v.revision}`,
        statusLabel: this.getStatusLabel(v.status)
      }))
      .sort((a, b) => {
        if (b.version !== a.version) return b.version - a.version;
        return b.revision - a.revision;
      });
  },

  // ==================== UPDATE VERSION STATUS ====================
  updateVersionStatus: function(versionId, newStatus, approvedBy) {
    const sheet = getSpreadsheet().getSheetByName('DocumentVersions');
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const statusCol = headers.indexOf('status');
    const approvedByCol = headers.indexOf('approvedBy');
    const approvedAtCol = headers.indexOf('approvedAt');
    const isActiveCol = headers.indexOf('isActive');

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === versionId) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);

        if (newStatus === this.VERSION_STATUS.APPROVED && approvedBy) {
          sheet.getRange(i + 1, approvedByCol + 1).setValue(approvedBy);
          sheet.getRange(i + 1, approvedAtCol + 1).setValue(getTimestamp());
        }

        if (newStatus === this.VERSION_STATUS.SUPERSEDED || newStatus === this.VERSION_STATUS.VOID) {
          sheet.getRange(i + 1, isActiveCol + 1).setValue(false);
        }

        return true;
      }
    }
    return false;
  },

  // ==================== APPROVE VERSION ====================
  approveVersion: function(versionId, approvedBy) {
    const version = getRowById('DocumentVersions', versionId);
    if (!version) {
      return { success: false, error: 'Versi tidak ditemukan' };
    }

    if (version.status !== this.VERSION_STATUS.DRAFT && version.status !== this.VERSION_STATUS.PENDING) {
      return { success: false, error: 'Hanya dokumen DRAFT atau PENDING yang dapat disetujui' };
    }

    this.updateVersionStatus(versionId, this.VERSION_STATUS.APPROVED, approvedBy);

    return {
      success: true,
      data: {
        versionId,
        status: this.VERSION_STATUS.APPROVED,
        approvedBy,
        approvedAt: getTimestamp()
      }
    };
  },

  // ==================== VOID VERSION ====================
  voidVersion: function(versionId, reason, voidedBy) {
    const version = getRowById('DocumentVersions', versionId);
    if (!version) {
      return { success: false, error: 'Versi tidak ditemukan' };
    }

    this.updateVersionStatus(versionId, this.VERSION_STATUS.VOID);

    // Update changes field with void reason
    const sheet = getSpreadsheet().getSheetByName('DocumentVersions');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const changesCol = headers.indexOf('changes');

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === versionId) {
        const existingChanges = data[i][changesCol] || '';
        sheet.getRange(i + 1, changesCol + 1).setValue(
          existingChanges + '\n[VOID] ' + (reason || 'Dibatalkan') + ' oleh ' + (voidedBy || '-')
        );
        break;
      }
    }

    return { success: true, message: 'Dokumen berhasil dibatalkan' };
  },

  // ==================== GET ACTIVE VERSION ====================
  getActiveVersion: function(entityId, entityType, docType) {
    const versions = getAllRows('DocumentVersions')
      .filter(v =>
        v.entityId === entityId &&
        v.entityType === entityType &&
        v.docType === docType &&
        v.isActive &&
        v.status === this.VERSION_STATUS.APPROVED
      );

    if (versions.length === 0) return null;

    // Get the highest version
    versions.sort((a, b) => {
      if (b.version !== a.version) return b.version - a.version;
      return b.revision - a.revision;
    });

    return versions[0];
  },

  // ==================== GET STATUS LABEL ====================
  getStatusLabel: function(status) {
    const labels = {
      DRAFT: 'Draft',
      PENDING: 'Menunggu Persetujuan',
      APPROVED: 'Disetujui',
      SUPERSEDED: 'Digantikan',
      VOID: 'Dibatalkan'
    };
    return labels[status] || status;
  },

  // ==================== COMPARE VERSIONS ====================
  compareVersions: function(versionId1, versionId2) {
    const v1 = getRowById('DocumentVersions', versionId1);
    const v2 = getRowById('DocumentVersions', versionId2);

    if (!v1 || !v2) {
      return { success: false, error: 'Versi tidak ditemukan' };
    }

    return {
      success: true,
      data: {
        version1: {
          versionId: v1.versionId,
          versionLabel: `v${v1.version}.${v1.revision}`,
          status: v1.status,
          changedAt: v1.changedAt,
          changes: v1.changes
        },
        version2: {
          versionId: v2.versionId,
          versionLabel: `v${v2.version}.${v2.revision}`,
          status: v2.status,
          changedAt: v2.changedAt,
          changes: v2.changes
        }
      }
    };
  }
};

// ========================================
// DOCUMENT GENERATION WITH VERSIONING
// ========================================

const DocumentGeneratorWithVersioning = {

  // Generate document and create version
  generateWithVersion: function(docType, entityId, entityType, generatorFunction, changedBy) {
    // Call the actual generator
    const result = generatorFunction();

    if (!result.success) {
      return result;
    }

    // Create version record
    const docId = result.data.docId || generateId('DOC');
    const version = DocumentVersioningService.createVersion(
      docId,
      docType,
      entityId,
      entityType,
      result.data.docId,
      result.data.googleDocUrl,
      changedBy
    );

    return {
      success: true,
      data: {
        ...result.data,
        version: version
      }
    };
  },

  // Regenerate document (creates new revision)
  regenerateWithRevision: function(docId, changes, regeneratorFunction, changedBy) {
    // Call the regenerator
    const result = regeneratorFunction();

    if (!result.success) {
      return result;
    }

    // Create revision
    const revision = DocumentVersioningService.createRevision(docId, changes, changedBy);

    if (!revision.success) {
      return revision;
    }

    return {
      success: true,
      data: {
        ...result.data,
        revision: revision.data
      }
    };
  }
};

// ========================================
// ROUTE EXTENSIONS FOR VERSIONING
// ========================================

function routeVersioning(segments, method, params, body) {
  // GET /versioning/:docId - Get version history
  if (segments.length === 1 && method === 'GET') {
    const history = DocumentVersioningService.getVersionHistory(segments[0]);
    return { success: true, data: history };
  }

  // GET /versioning/:docId/latest - Get latest version
  if (segments.length === 2 && segments[1] === 'latest' && method === 'GET') {
    const latest = DocumentVersioningService.getLatestVersion(segments[0]);
    if (!latest) {
      return { success: false, error: 'Dokumen tidak ditemukan' };
    }
    return { success: true, data: latest };
  }

  // POST /versioning/:docId/revision - Create revision
  if (segments.length === 2 && segments[1] === 'revision' && method === 'POST') {
    return DocumentVersioningService.createRevision(segments[0], body.changes, body.changedBy);
  }

  // POST /versioning/:versionId/approve - Approve version
  if (segments.length === 2 && segments[1] === 'approve' && method === 'POST') {
    return DocumentVersioningService.approveVersion(segments[0], body.approvedBy);
  }

  // POST /versioning/:versionId/void - Void version
  if (segments.length === 2 && segments[1] === 'void' && method === 'POST') {
    return DocumentVersioningService.voidVersion(segments[0], body.reason, body.voidedBy);
  }

  // GET /versioning/compare?v1=xxx&v2=yyy - Compare versions
  if (segments[0] === 'compare' && method === 'GET') {
    return DocumentVersioningService.compareVersions(params.v1, params.v2);
  }

  return { success: false, error: 'Route not found' };
}

/**
 * 14_NumberingEngine.gs
 * Document Numbering Service
 */

function setupNumberingSheet() {
  const headers = [
    'patternId', 'docType', 'pattern', 'prefix', 'suffix',
    'separator', 'resetPeriod', 'lastNumber', 'lastReset',
    'description', 'isActive', 'createdAt', 'updatedAt'
  ];
  ensureSheet('Numbering', headers);
}

const NumberingService = {

  // Default patterns
  defaultPatterns: {
    'SPPD': {
      pattern: '{PREFIX}/{NO}/{MONTH}/{YEAR}',
      prefix: 'SPPD',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor SPPD'
    },
    'SURAT_TUGAS': {
      pattern: '{PREFIX}/{NO}/{MONTH}/{YEAR}',
      prefix: 'ST',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor Surat Tugas'
    },
    'SPK': {
      pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
      prefix: 'SPK',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor Surat Perintah Kerja'
    },
    'KONTRAK': {
      pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
      prefix: 'KTR',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor Kontrak'
    },
    'BAST': {
      pattern: '{PREFIX}/{NO}/{UNIT}/{YEAR}',
      prefix: 'BA',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor Berita Acara Serah Terima'
    },
    'KUITANSI': {
      pattern: '{PREFIX}/{NO}/{YEAR}',
      prefix: 'KW',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor Kuitansi'
    },
    'HPS': {
      pattern: '{PREFIX}/{NO}/{YEAR}',
      prefix: 'HPS',
      separator: '/',
      resetPeriod: 'YEARLY',
      description: 'Nomor HPS'
    }
  },

  // ==================== GET ALL PATTERNS ====================
  getAllPatterns: function() {
    setupNumberingSheet();
    const rows = getAllRows('Numbering');

    // Merge with defaults
    const patterns = {};

    // Add defaults first
    Object.keys(this.defaultPatterns).forEach(docType => {
      patterns[docType] = {
        ...this.defaultPatterns[docType],
        docType: docType,
        lastNumber: 0,
        isActive: true
      };
    });

    // Override with saved patterns
    rows.forEach(row => {
      if (row.docType) {
        patterns[row.docType] = {
          ...row,
          id: row.patternId
        };
      }
    });

    return Object.values(patterns);
  },

  // ==================== GET PATTERN ====================
  getPattern: function(docType) {
    setupNumberingSheet();
    const rows = getRowsByColumn('Numbering', 'docType', docType);

    if (rows.length > 0) {
      return { ...rows[0], id: rows[0].patternId };
    }

    // Return default if exists
    if (this.defaultPatterns[docType]) {
      return {
        ...this.defaultPatterns[docType],
        docType: docType,
        lastNumber: 0,
        isActive: true
      };
    }

    return null;
  },

  // ==================== SAVE PATTERN ====================
  savePattern: function(data) {
    setupNumberingSheet();

    const existing = getRowsByColumn('Numbering', 'docType', data.docType);
    const now = getTimestamp();

    if (existing.length > 0) {
      // Update existing
      const allowedFields = [
        'pattern', 'prefix', 'suffix', 'separator', 'resetPeriod',
        'description', 'isActive'
      ];
      return updateRow('Numbering', existing[0].patternId, data, allowedFields);
    } else {
      // Create new
      const patternId = generateId('NUM');

      const row = [
        patternId,
        data.docType,
        data.pattern || '{PREFIX}/{NO}/{YEAR}',
        data.prefix || '',
        data.suffix || '',
        data.separator || '/',
        data.resetPeriod || 'YEARLY',
        0,
        '',
        data.description || '',
        data.isActive !== false,
        now,
        now
      ];

      getSpreadsheet().getSheetByName('Numbering').appendRow(row);
      return this.getPattern(data.docType);
    }
  },

  // ==================== GENERATE NUMBER ====================
  generateNumber: function(docType, options = {}) {
    setupNumberingSheet();

    const pattern = this.getPattern(docType);
    if (!pattern) {
      return { success: false, error: 'Pattern tidak ditemukan untuk: ' + docType };
    }

    const config = ConfigService.getConfig();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Check if need to reset
    let lastNumber = pattern.lastNumber || 0;
    const lastReset = pattern.lastReset ? new Date(pattern.lastReset) : null;

    const shouldReset = this.shouldReset(pattern.resetPeriod, lastReset, now);
    if (shouldReset) {
      lastNumber = 0;
    }

    // Increment number
    const newNumber = lastNumber + 1;

    // Build number string
    let numberStr = pattern.pattern || '{PREFIX}/{NO}/{YEAR}';

    const replacements = {
      '{PREFIX}': pattern.prefix || '',
      '{SUFFIX}': pattern.suffix || '',
      '{NO}': String(newNumber).padStart(options.padding || 3, '0'),
      '{YEAR}': String(year),
      '{YEAR2}': String(year).slice(-2),
      '{MONTH}': month,
      '{UNIT}': config.kodeSatker || options.unit || '',
      '{SEP}': pattern.separator || '/'
    };

    Object.keys(replacements).forEach(key => {
      numberStr = numberStr.replace(new RegExp(key, 'g'), replacements[key]);
    });

    // Clean up double separators
    const sep = pattern.separator || '/';
    numberStr = numberStr.replace(new RegExp(sep + sep, 'g'), sep);
    numberStr = numberStr.replace(new RegExp('^' + sep + '|' + sep + '$', 'g'), '');

    // Update last number in sheet
    this.updateLastNumber(docType, newNumber);

    return {
      success: true,
      data: {
        number: numberStr,
        sequence: newNumber,
        docType: docType,
        generatedAt: getTimestamp()
      }
    };
  },

  // ==================== SHOULD RESET ====================
  shouldReset: function(resetPeriod, lastReset, now) {
    if (!lastReset) return false;

    switch (resetPeriod) {
      case 'YEARLY':
        return lastReset.getFullYear() !== now.getFullYear();
      case 'MONTHLY':
        return lastReset.getFullYear() !== now.getFullYear() ||
               lastReset.getMonth() !== now.getMonth();
      case 'DAILY':
        return lastReset.toDateString() !== now.toDateString();
      case 'NEVER':
      default:
        return false;
    }
  },

  // ==================== UPDATE LAST NUMBER ====================
  updateLastNumber: function(docType, newNumber) {
    const sheet = getSpreadsheet().getSheetByName('Numbering');
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const docTypeCol = headers.indexOf('docType');
    const lastNumberCol = headers.indexOf('lastNumber');
    const lastResetCol = headers.indexOf('lastReset');
    const updatedAtCol = headers.indexOf('updatedAt');

    for (let i = 1; i < data.length; i++) {
      if (data[i][docTypeCol] === docType) {
        sheet.getRange(i + 1, lastNumberCol + 1).setValue(newNumber);
        sheet.getRange(i + 1, lastResetCol + 1).setValue(getTimestamp());
        if (updatedAtCol >= 0) {
          sheet.getRange(i + 1, updatedAtCol + 1).setValue(getTimestamp());
        }
        return;
      }
    }

    // If not found, create new entry
    const patternId = generateId('NUM');
    const now = getTimestamp();
    const defaultPattern = this.defaultPatterns[docType] || {};

    const row = [
      patternId,
      docType,
      defaultPattern.pattern || '{PREFIX}/{NO}/{YEAR}',
      defaultPattern.prefix || '',
      defaultPattern.suffix || '',
      defaultPattern.separator || '/',
      defaultPattern.resetPeriod || 'YEARLY',
      newNumber,
      now,
      defaultPattern.description || '',
      true,
      now,
      now
    ];

    sheet.appendRow(row);
  },

  // ==================== RESET COUNTER ====================
  resetCounter: function(docType) {
    const sheet = getSpreadsheet().getSheetByName('Numbering');
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const docTypeCol = headers.indexOf('docType');
    const lastNumberCol = headers.indexOf('lastNumber');
    const lastResetCol = headers.indexOf('lastReset');

    for (let i = 1; i < data.length; i++) {
      if (data[i][docTypeCol] === docType) {
        sheet.getRange(i + 1, lastNumberCol + 1).setValue(0);
        sheet.getRange(i + 1, lastResetCol + 1).setValue(getTimestamp());
        return true;
      }
    }

    return false;
  },

  // ==================== PREVIEW NUMBER ====================
  previewNumber: function(docType, options = {}) {
    const pattern = this.getPattern(docType);
    if (!pattern) {
      return { success: false, error: 'Pattern tidak ditemukan' };
    }

    const config = ConfigService.getConfig();
    const now = new Date();

    let numberStr = pattern.pattern || '{PREFIX}/{NO}/{YEAR}';

    const replacements = {
      '{PREFIX}': pattern.prefix || '',
      '{SUFFIX}': pattern.suffix || '',
      '{NO}': 'XXX',
      '{YEAR}': String(now.getFullYear()),
      '{YEAR2}': String(now.getFullYear()).slice(-2),
      '{MONTH}': String(now.getMonth() + 1).padStart(2, '0'),
      '{UNIT}': config.kodeSatker || options.unit || 'UNIT',
      '{SEP}': pattern.separator || '/'
    };

    Object.keys(replacements).forEach(key => {
      numberStr = numberStr.replace(new RegExp(key, 'g'), replacements[key]);
    });

    return {
      success: true,
      data: {
        preview: numberStr,
        pattern: pattern.pattern,
        nextNumber: (pattern.lastNumber || 0) + 1
      }
    };
  }
};

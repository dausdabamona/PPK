/**
 * 40_BackupService.gs
 * Sprint 5: Production & Audit Readiness
 *
 * Backup & Recovery Service
 * - Automatic daily backup of all sheets to Drive
 * - Organized per tahun anggaran
 * - Restore function from backup
 */

// ========================================
// BACKUP SERVICE
// ========================================

const BackupService = {

  /**
   * Get backup folder for specific year
   */
  getBackupFolder: function(tahun = null) {
    const year = tahun || new Date().getFullYear();
    const ss = getSpreadsheet();
    const parentFolder = DriveApp.getFileById(ss.getId()).getParents().next();

    // Create or get Backup folder
    let backupRoot;
    const backupFolders = parentFolder.getFoldersByName('Backup_PPK');
    if (backupFolders.hasNext()) {
      backupRoot = backupFolders.next();
    } else {
      backupRoot = parentFolder.createFolder('Backup_PPK');
    }

    // Create or get year folder
    const yearFolderName = 'TA_' + year;
    const yearFolders = backupRoot.getFoldersByName(yearFolderName);
    if (yearFolders.hasNext()) {
      return yearFolders.next();
    }
    return backupRoot.createFolder(yearFolderName);
  },

  /**
   * Create full backup of all sheets
   */
  createBackup: function(description = '') {
    try {
      const ss = getSpreadsheet();
      const now = new Date();
      const tahun = now.getFullYear();
      const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd_HHmmss');

      // Create backup spreadsheet
      const backupName = 'PPK_Backup_' + timestamp + (description ? '_' + description : '');
      const backup = ss.copy(backupName);

      // Move to backup folder
      const folder = this.getBackupFolder(tahun);
      const file = DriveApp.getFileById(backup.getId());
      file.moveTo(folder);

      // Log backup
      this.logBackup({
        backupId: backup.getId(),
        backupName: backupName,
        backupUrl: backup.getUrl(),
        tahun: tahun,
        timestamp: now.toISOString(),
        description: description,
        type: 'FULL',
        status: 'SUCCESS',
        fileSize: file.getSize()
      });

      return {
        success: true,
        data: {
          backupId: backup.getId(),
          backupName: backupName,
          backupUrl: backup.getUrl(),
          timestamp: now.toISOString(),
          tahun: tahun
        }
      };

    } catch (e) {
      console.error('Backup error:', e);
      return { success: false, error: 'Gagal membuat backup: ' + e.message };
    }
  },

  /**
   * Create incremental backup (specific sheets only)
   */
  createIncrementalBackup: function(sheetNames = [], description = '') {
    try {
      const ss = getSpreadsheet();
      const now = new Date();
      const tahun = now.getFullYear();
      const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd_HHmmss');

      // Create new spreadsheet
      const backupName = 'PPK_Incremental_' + timestamp + (description ? '_' + description : '');
      const backup = SpreadsheetApp.create(backupName);

      // Copy specified sheets
      const sheetsToBackup = sheetNames.length > 0 ? sheetNames : this.getDataSheetNames();

      sheetsToBackup.forEach(sheetName => {
        const sourceSheet = ss.getSheetByName(sheetName);
        if (sourceSheet) {
          sourceSheet.copyTo(backup).setName(sheetName);
        }
      });

      // Remove default Sheet1
      const defaultSheet = backup.getSheetByName('Sheet1');
      if (defaultSheet && backup.getSheets().length > 1) {
        backup.deleteSheet(defaultSheet);
      }

      // Move to backup folder
      const folder = this.getBackupFolder(tahun);
      const file = DriveApp.getFileById(backup.getId());
      file.moveTo(folder);

      // Log backup
      this.logBackup({
        backupId: backup.getId(),
        backupName: backupName,
        backupUrl: backup.getUrl(),
        tahun: tahun,
        timestamp: now.toISOString(),
        description: description,
        type: 'INCREMENTAL',
        status: 'SUCCESS',
        sheets: sheetsToBackup.join(','),
        fileSize: file.getSize()
      });

      return {
        success: true,
        data: {
          backupId: backup.getId(),
          backupName: backupName,
          backupUrl: backup.getUrl(),
          timestamp: now.toISOString(),
          sheets: sheetsToBackup
        }
      };

    } catch (e) {
      console.error('Incremental backup error:', e);
      return { success: false, error: 'Gagal membuat backup incremental: ' + e.message };
    }
  },

  /**
   * Get list of data sheet names
   */
  getDataSheetNames: function() {
    return [
      'Paket', 'PaketWorkflow', 'Penyedia', 'Kontrak', 'Pembayaran',
      'SerahTerima', 'Dokumen', 'DokumenVersions',
      'PerjalananDinas', 'Pelaksana', 'BiayaPerjalanan', 'LampiranPD', 'DokumenPD',
      'Config', 'BackupLog'
    ];
  },

  /**
   * Log backup to BackupLog sheet
   */
  logBackup: function(data) {
    const ss = getSpreadsheet();
    let logSheet = ss.getSheetByName('BackupLog');

    if (!logSheet) {
      logSheet = ss.insertSheet('BackupLog');
      const headers = ['logId', 'backupId', 'backupName', 'backupUrl', 'tahun',
                       'timestamp', 'description', 'type', 'status', 'sheets', 'fileSize', 'restoredAt'];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    const logId = generateId('BKP');
    const row = [
      logId,
      data.backupId || '',
      data.backupName || '',
      data.backupUrl || '',
      data.tahun || '',
      data.timestamp || '',
      data.description || '',
      data.type || 'FULL',
      data.status || 'SUCCESS',
      data.sheets || '',
      data.fileSize || 0,
      ''
    ];

    logSheet.appendRow(row);
    return logId;
  },

  /**
   * Get backup history
   */
  getBackupHistory: function(tahun = null, limit = 50) {
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName('BackupLog');

    if (!logSheet) {
      return [];
    }

    const data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    let results = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    }).filter(item => item.backupId);

    // Filter by year if specified
    if (tahun) {
      results = results.filter(item => String(item.tahun) === String(tahun));
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    return results.slice(0, limit);
  },

  /**
   * Restore from backup
   */
  restoreFromBackup: function(backupId, sheetNames = []) {
    try {
      const backupFile = DriveApp.getFileById(backupId);
      const backupSs = SpreadsheetApp.openById(backupId);
      const targetSs = getSpreadsheet();

      // Get sheets to restore
      const sheetsToRestore = sheetNames.length > 0 ? sheetNames : this.getDataSheetNames();
      const restoredSheets = [];
      const errors = [];

      sheetsToRestore.forEach(sheetName => {
        try {
          const sourceSheet = backupSs.getSheetByName(sheetName);
          if (!sourceSheet) {
            errors.push(`Sheet "${sheetName}" tidak ditemukan di backup`);
            return;
          }

          // Get source data
          const data = sourceSheet.getDataRange().getValues();

          // Delete existing sheet if exists
          const existingSheet = targetSs.getSheetByName(sheetName);
          if (existingSheet) {
            targetSs.deleteSheet(existingSheet);
          }

          // Create new sheet with backup data
          const newSheet = targetSs.insertSheet(sheetName);
          if (data.length > 0 && data[0].length > 0) {
            newSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
            newSheet.getRange(1, 1, 1, data[0].length).setFontWeight('bold');
            newSheet.setFrozenRows(1);
          }

          restoredSheets.push(sheetName);

        } catch (sheetError) {
          errors.push(`Error restoring "${sheetName}": ${sheetError.message}`);
        }
      });

      // Update backup log
      this.updateRestoreLog(backupId);

      return {
        success: errors.length === 0,
        data: {
          restoredSheets: restoredSheets,
          errors: errors,
          backupName: backupFile.getName(),
          restoredAt: new Date().toISOString()
        }
      };

    } catch (e) {
      console.error('Restore error:', e);
      return { success: false, error: 'Gagal restore backup: ' + e.message };
    }
  },

  /**
   * Update restore log
   */
  updateRestoreLog: function(backupId) {
    const ss = getSpreadsheet();
    const logSheet = ss.getSheetByName('BackupLog');
    if (!logSheet) return;

    const data = logSheet.getDataRange().getValues();
    const headers = data[0];
    const backupIdCol = headers.indexOf('backupId');
    const restoredAtCol = headers.indexOf('restoredAt');

    for (let i = 1; i < data.length; i++) {
      if (data[i][backupIdCol] === backupId) {
        logSheet.getRange(i + 1, restoredAtCol + 1).setValue(new Date().toISOString());
        break;
      }
    }
  },

  /**
   * Delete old backups (keep last N)
   */
  cleanupOldBackups: function(tahun, keepCount = 10) {
    try {
      const folder = this.getBackupFolder(tahun);
      const files = folder.getFiles();
      const fileList = [];

      while (files.hasNext()) {
        const file = files.next();
        fileList.push({
          id: file.getId(),
          name: file.getName(),
          created: file.getDateCreated()
        });
      }

      // Sort by date descending
      fileList.sort((a, b) => b.created - a.created);

      // Delete files beyond keepCount
      const deleted = [];
      for (let i = keepCount; i < fileList.length; i++) {
        try {
          DriveApp.getFileById(fileList[i].id).setTrashed(true);
          deleted.push(fileList[i].name);
        } catch (e) {
          console.error('Error deleting backup:', e);
        }
      }

      return {
        success: true,
        data: {
          kept: Math.min(keepCount, fileList.length),
          deleted: deleted.length,
          deletedFiles: deleted
        }
      };

    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Get backup statistics
   */
  getBackupStats: function(tahun = null) {
    const year = tahun || new Date().getFullYear();
    const history = this.getBackupHistory(year, 1000);

    const fullBackups = history.filter(h => h.type === 'FULL');
    const incrementalBackups = history.filter(h => h.type === 'INCREMENTAL');
    const totalSize = history.reduce((sum, h) => sum + (h.fileSize || 0), 0);

    const lastBackup = history.length > 0 ? history[0] : null;
    const lastRestore = history.filter(h => h.restoredAt).sort((a, b) =>
      new Date(b.restoredAt) - new Date(a.restoredAt)
    )[0];

    return {
      tahun: year,
      totalBackups: history.length,
      fullBackups: fullBackups.length,
      incrementalBackups: incrementalBackups.length,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      lastBackup: lastBackup ? {
        timestamp: lastBackup.timestamp,
        type: lastBackup.type,
        name: lastBackup.backupName
      } : null,
      lastRestore: lastRestore ? {
        timestamp: lastRestore.restoredAt,
        backupName: lastRestore.backupName
      } : null
    };
  },

  /**
   * Verify backup integrity
   */
  verifyBackup: function(backupId) {
    try {
      const backupSs = SpreadsheetApp.openById(backupId);
      const sheets = backupSs.getSheets();

      const verification = {
        backupId: backupId,
        isValid: true,
        sheets: [],
        errors: []
      };

      sheets.forEach(sheet => {
        const sheetName = sheet.getName();
        const rowCount = sheet.getLastRow();
        const colCount = sheet.getLastColumn();

        verification.sheets.push({
          name: sheetName,
          rows: rowCount,
          columns: colCount,
          hasData: rowCount > 1
        });
      });

      // Check for required sheets
      const requiredSheets = ['Paket', 'PerjalananDinas', 'Config'];
      requiredSheets.forEach(required => {
        const found = verification.sheets.find(s => s.name === required);
        if (!found) {
          verification.errors.push(`Missing required sheet: ${required}`);
          verification.isValid = false;
        }
      });

      return {
        success: true,
        data: verification
      };

    } catch (e) {
      return {
        success: false,
        error: 'Gagal memverifikasi backup: ' + e.message
      };
    }
  }
};

// ========================================
// SCHEDULED BACKUP TRIGGER
// ========================================

/**
 * Setup daily backup trigger
 * Run this manually once to enable automatic backups
 */
function setupDailyBackupTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new daily trigger at 2 AM
  ScriptApp.newTrigger('runDailyBackup')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();

  return { success: true, message: 'Daily backup trigger created (2 AM)' };
}

/**
 * Daily backup function (called by trigger)
 */
function runDailyBackup() {
  const dayOfWeek = new Date().getDay();

  // Full backup on Sunday (0), incremental on other days
  if (dayOfWeek === 0) {
    BackupService.createBackup('Auto_Full_Sunday');
  } else {
    BackupService.createIncrementalBackup([], 'Auto_Daily');
  }

  // Cleanup old backups (keep last 30)
  const tahun = new Date().getFullYear();
  BackupService.cleanupOldBackups(tahun, 30);
}

/**
 * Manual backup function
 */
function createManualBackup() {
  return BackupService.createBackup('Manual');
}

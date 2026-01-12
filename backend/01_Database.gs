/**
 * 01_Database.gs
 * Database utilities and spreadsheet access
 */

// ========================================
// SPREADSHEET ACCESS
// ========================================

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ========================================
// GENERIC CRUD HELPERS
// ========================================

/**
 * Get all rows from a sheet as objects
 */
function getAllRows(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  }).filter(obj => obj[headers[0]]); // Filter out empty rows
}

/**
 * Get a single row by ID (first column)
 */
function getRowById(sheetName, id) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const obj = {};
      headers.forEach((h, j) => {
        obj[h] = data[i][j];
      });
      return obj;
    }
  }

  return null;
}

/**
 * Get rows filtered by a column value
 */
function getRowsByColumn(sheetName, columnName, value) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex < 0) return [];

  return data.slice(1)
    .filter(row => row[colIndex] === value)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
}

/**
 * Update specific fields in a row
 */
function updateRow(sheetName, id, data, allowedFields = null) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return null;

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === id) {
      Object.keys(data).forEach(field => {
        // Skip if allowedFields is specified and field is not in it
        if (allowedFields && !allowedFields.includes(field)) return;

        const colIndex = headers.indexOf(field);
        if (colIndex >= 0) {
          sheet.getRange(i + 1, colIndex + 1).setValue(data[field]);
        }
      });

      // Update updatedAt if exists
      const updatedAtCol = headers.indexOf('updatedAt');
      if (updatedAtCol >= 0) {
        sheet.getRange(i + 1, updatedAtCol + 1).setValue(new Date().toISOString());
      }

      return getRowById(sheetName, id);
    }
  }

  return null;
}

/**
 * Delete a row by ID
 */
function deleteRow(sheetName, id) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }

  return false;
}

/**
 * Delete rows by a column value
 */
function deleteRowsByColumn(sheetName, columnName, value) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return 0;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndex = headers.indexOf(columnName);
  if (colIndex < 0) return 0;

  let deleted = 0;
  // Delete from bottom to top to maintain row indices
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][colIndex] === value) {
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }

  return deleted;
}

/**
 * Generate unique ID with prefix
 */
function generateId(prefix = '') {
  return prefix + Utilities.getUuid().substring(0, 8).toUpperCase();
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
  return new Date().toISOString();
}

// ========================================
// SHEET CREATION HELPERS
// ========================================

/**
 * Create or get a sheet with specified headers
 */
function ensureSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// ========================================
// FORMATTING HELPERS
// ========================================

/**
 * Format date to Indonesian format (d MMMM yyyy)
 */
function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
 * Format number to rupiah (without Rp symbol)
 */
function formatRupiahDoc(num) {
  if (!num && num !== 0) return '-';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convert number to Indonesian words (terbilang)
 */
function terbilang(angka) {
  const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  angka = Math.floor(angka);
  if (angka < 0) return 'minus ' + terbilang(-angka);
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return terbilang(angka - 10) + ' belas';
  if (angka < 100) return terbilang(Math.floor(angka / 10)) + ' puluh ' + terbilang(angka % 10);
  if (angka < 200) return 'seratus ' + terbilang(angka - 100);
  if (angka < 1000) return terbilang(Math.floor(angka / 100)) + ' ratus ' + terbilang(angka % 100);
  if (angka < 2000) return 'seribu ' + terbilang(angka - 1000);
  if (angka < 1000000) return terbilang(Math.floor(angka / 1000)) + ' ribu ' + terbilang(angka % 1000);
  if (angka < 1000000000) return terbilang(Math.floor(angka / 1000000)) + ' juta ' + terbilang(angka % 1000000);
  if (angka < 1000000000000) return terbilang(Math.floor(angka / 1000000000)) + ' miliar ' + terbilang(angka % 1000000000);
  return terbilang(Math.floor(angka / 1000000000000)) + ' triliun ' + terbilang(angka % 1000000000000);
}

/**
 * Clean up terbilang result (remove extra spaces)
 */
function terbilangClean(angka) {
  return terbilang(angka).replace(/\s+/g, ' ').trim();
}

// ========================================
// DRIVE FOLDER HELPERS
// ========================================

/**
 * Get or create a folder for attachments
 */
function getOrCreateFolder(folderName) {
  const ss = getSpreadsheet();
  const parentFolder = DriveApp.getFileById(ss.getId()).getParents().next();

  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

/**
 * Upload file to folder
 */
function uploadFileToDrive(folderName, filename, base64Data, mimeType) {
  try {
    const folder = getOrCreateFolder(folderName);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType || 'application/octet-stream', filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: filename
    };
  } catch (e) {
    console.error('Error uploading file:', e);
    return null;
  }
}

/**
 * Delete file from Drive
 */
function deleteFileFromDrive(fileId) {
  if (!fileId) return false;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (e) {
    console.error('Error deleting file:', e);
    return false;
  }
}

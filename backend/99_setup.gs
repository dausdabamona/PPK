/**
 * 99_setup.gs
 * Initial Setup and Utility Functions
 * Sprint 1: Database & Backend Skeleton
 */

// ========================================
// SETUP ALL SHEETS
// ========================================

function setupAllSheets() {
  console.log('🚀 Setting up all sheets...');

  try {
    // Use comprehensive schema setup if available
    if (typeof setupAllDatabaseSheets === 'function') {
      const result = setupAllDatabaseSheets();
      console.log('✅ Database schema setup complete');
      return result;
    }

    // Fallback to individual setup functions
    // Config
    setupConfigSheet();
    console.log('✅ Config sheet created');

    // Perjalanan Dinas
    setupPerjalananDinasSheets();
    console.log('✅ Perjalanan Dinas sheets created');

    // Paket
    setupPaketSheets();
    console.log('✅ Paket sheets created');

    // Penyedia
    setupPenyediaSheet();
    console.log('✅ Penyedia sheet created');

    // Numbering
    setupNumberingSheet();
    console.log('✅ Numbering sheet created');

    // Document Versions (if function exists)
    if (typeof setupDocumentVersionSheet === 'function') {
      setupDocumentVersionSheet();
      console.log('✅ Document Versions sheet created');
    }

    console.log('✨ All sheets setup complete!');
    return { success: true, message: 'All sheets created successfully' };

  } catch (e) {
    console.error('❌ Error during setup:', e);
    return { success: false, error: e.message };
  }
}

// ========================================
// INITIAL SETUP - RUN THIS FIRST
// ========================================

function initialSetup() {
  // Setup all sheets
  setupAllSheets();

  // Set spreadsheet ID in script properties for deployed version
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
    console.log('Spreadsheet ID saved: ' + ss.getId());
  }

  // Add menu
  createMenu();

  return { success: true, message: 'Initial setup complete' };
}

// ========================================
// MENU
// ========================================

function onOpen() {
  createMenu();
}

function createMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PPK Tools')
    .addItem('Setup Sheets', 'setupAllSheets')
    .addItem('Reset Numbering', 'resetAllNumbering')
    .addSeparator()
    .addSubMenu(ui.createMenu('Perjalanan Dinas')
      .addItem('List PD', 'menuListPD')
      .addItem('Setup PD Sheets', 'setupPerjalananDinasSheets'))
    .addSubMenu(ui.createMenu('Paket')
      .addItem('List Paket', 'menuListPaket')
      .addItem('Setup Paket Sheets', 'setupPaketSheets'))
    .addSeparator()
    .addItem('Test API', 'testAPI')
    .addToUi();
}

// ========================================
// MENU FUNCTIONS
// ========================================

function menuListPD() {
  const list = PerjalananDinasService.list();
  console.log('Perjalanan Dinas: ' + list.length + ' records');
  list.forEach(pd => {
    console.log('- ' + pd.pdId + ': ' + (pd.tujuan || pd.maksudTujuan) + ' (' + pd.status + ')');
  });
}

function menuListPaket() {
  const list = PaketService.list();
  console.log('Paket: ' + list.length + ' records');
  list.forEach(p => {
    console.log('- ' + p.paketId + ': ' + p.namaPaket + ' (' + p.status + ')');
  });
}

function resetAllNumbering() {
  const docTypes = ['SPPD', 'SURAT_TUGAS', 'SPK', 'KONTRAK', 'BAST', 'KUITANSI', 'HPS'];
  docTypes.forEach(docType => {
    NumberingService.resetCounter(docType);
  });
  console.log('All numbering counters reset');
}

// ========================================
// TEST API
// ========================================

function testAPI() {
  console.log('🧪 Starting API Tests...');
  console.log('========================');

  const tests = [];

  // Test 1: Health check
  try {
    const result = routeRequest('health', 'GET', {}, {});
    tests.push({ name: 'Health Check', passed: result.success, result: result });
    console.log('✅ Health check:', result.success ? 'PASS' : 'FAIL');
  } catch (e) {
    tests.push({ name: 'Health Check', passed: false, error: e.message });
    console.log('❌ Health check: FAIL -', e.message);
  }

  // Test 2: Config
  try {
    const config = ConfigService.getConfig();
    tests.push({ name: 'Config Service', passed: !!config, result: config });
    console.log('✅ Config Service:', config ? 'PASS' : 'FAIL');
  } catch (e) {
    tests.push({ name: 'Config Service', passed: false, error: e.message });
    console.log('❌ Config Service: FAIL -', e.message);
  }

  // Test 3: PD Service
  try {
    const pdList = PerjalananDinasService.list();
    tests.push({ name: 'PD Service', passed: true, count: pdList.length });
    console.log('✅ PD Service: PASS (Count:', pdList.length, ')');
  } catch (e) {
    tests.push({ name: 'PD Service', passed: false, error: e.message });
    console.log('❌ PD Service: FAIL -', e.message);
  }

  // Test 4: Paket Service
  try {
    const paketList = PaketService.list();
    tests.push({ name: 'Paket Service', passed: true, count: paketList.length });
    console.log('✅ Paket Service: PASS (Count:', paketList.length, ')');
  } catch (e) {
    tests.push({ name: 'Paket Service', passed: false, error: e.message });
    console.log('❌ Paket Service: FAIL -', e.message);
  }

  // Test 5: Penyedia Service
  try {
    const penyediaList = PenyediaService.list();
    tests.push({ name: 'Penyedia Service', passed: true, count: penyediaList.length });
    console.log('✅ Penyedia Service: PASS (Count:', penyediaList.length, ')');
  } catch (e) {
    tests.push({ name: 'Penyedia Service', passed: false, error: e.message });
    console.log('❌ Penyedia Service: FAIL -', e.message);
  }

  // Test 6: Numbering Service
  try {
    const patterns = NumberingService.getAllPatterns();
    tests.push({ name: 'Numbering Service', passed: patterns.length > 0, count: patterns.length });
    console.log('✅ Numbering Service: PASS (Patterns:', patterns.length, ')');
  } catch (e) {
    tests.push({ name: 'Numbering Service', passed: false, error: e.message });
    console.log('❌ Numbering Service: FAIL -', e.message);
  }

  // Test 7: Database Stats (if available)
  try {
    if (typeof getDatabaseStats === 'function') {
      const stats = getDatabaseStats();
      tests.push({ name: 'Database Stats', passed: true, stats: stats });
      console.log('✅ Database Stats: PASS (Sheets:', stats.existingSheets, '/', stats.totalSheets, ')');
    }
  } catch (e) {
    tests.push({ name: 'Database Stats', passed: false, error: e.message });
    console.log('❌ Database Stats: FAIL -', e.message);
  }

  console.log('========================');

  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;

  console.log('📊 Test Results:', passed, '/', total, 'passed');
  console.log('API test complete!');

  return {
    success: passed === total,
    passed: passed,
    total: total,
    tests: tests
  };
}

// ========================================
// DEPLOYMENT HELPERS
// ========================================

/**
 * Get the web app URL after deployment
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Test web app endpoint
 */
function testWebApp() {
  const url = getWebAppUrl();
  if (url) {
    console.log('Web App URL: ' + url);
    console.log('Test endpoints:');
    console.log('- Health: ' + url + '?path=health');
    console.log('- Config: ' + url + '?path=config');
    console.log('- PD List: ' + url + '?path=perjalanan-dinas');
    console.log('- Paket List: ' + url + '?path=paket');
  } else {
    console.log('Web app not deployed yet. Deploy as Web App first.');
  }
}

// ========================================
// DATA MIGRATION HELPERS
// ========================================

/**
 * Migrate data from old sheet structure to new
 */
function migrateData() {
  console.log('Migration not implemented. Customize as needed.');
}

/**
 * Export all data to JSON
 */
function exportAllData() {
  const data = {
    config: ConfigService.getConfig(),
    perjalananDinas: PerjalananDinasService.list(),
    paket: PaketService.list(),
    penyedia: PenyediaService.list(),
    exportedAt: getTimestamp()
  };

  console.log('Exported data:');
  console.log(JSON.stringify(data, null, 2));

  return data;
}

/**
 * Clear all data (DANGEROUS - use with caution)
 */
function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'PERINGATAN',
    'Ini akan menghapus SEMUA data. Lanjutkan?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    console.log('Cancelled');
    return;
  }

  const sheets = [
    'PerjalananDinas', 'Pelaksana', 'BiayaPerjalanan', 'LampiranPD', 'DokumenPD',
    'Paket', 'Items', 'Surveys', 'LampiranPaket', 'DokumenPaket',
    'Kontrak', 'Pembayaran', 'SerahTerima', 'Penyedia'
  ];

  const ss = getSpreadsheet();
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });

  console.log('All data cleared');
}

// ========================================
// SAMPLE DATA (for testing)
// ========================================

function createSampleData() {
  console.log('Creating sample data...');

  // Sample Penyedia
  const penyedia = PenyediaService.create({
    namaPenyedia: 'CV. Maju Jaya',
    alamat: 'Jl. Contoh No. 123',
    kota: 'Malang',
    telepon: '0341-123456',
    npwp: '12.345.678.9-012.000',
    direktur: 'Budi Santoso'
  });
  console.log('- Created sample penyedia');

  // Sample Paket
  const paket = PaketService.create({
    namaPaket: 'Pengadaan ATK Tahun 2024',
    jenisPengadaan: 'BARANG',
    metodePengadaan: 'PENGADAAN_LANGSUNG',
    paguAnggaran: 50000000,
    tahunAnggaran: '2024'
  });

  // Add items to paket
  ItemService.create(paket.paketId, {
    namaBarang: 'Kertas HVS A4 70gsm',
    satuan: 'rim',
    volume: 100,
    hargaSatuan: 50000
  });

  ItemService.create(paket.paketId, {
    namaBarang: 'Pulpen Hitam',
    satuan: 'lusin',
    volume: 20,
    hargaSatuan: 25000
  });
  console.log('- Created sample paket with items');

  // Sample PD
  const pd = PerjalananDinasService.create({
    jenisPD: 'LUAR_KOTA',
    tujuan: 'Menghadiri Rapat Koordinasi',
    kotaTujuan: 'Jakarta',
    tanggalBerangkat: '2024-03-15',
    tanggalKembali: '2024-03-17',
    tingkatBiaya: 'C'
  });

  // Add pelaksana
  PerjalananDinasService.addPelaksana(pd.pdId, {
    nama: 'Ahmad Sudrajat',
    nip: '198501012010011001',
    pangkat: 'Penata',
    golongan: 'III/c',
    jabatan: 'Analis Kebijakan'
  });

  // Add biaya
  PerjalananDinasService.addBiaya(pd.pdId, {
    jenisBiaya: 'UANG_HARIAN',
    jumlah: 3,
    satuan: 'hari',
    hargaSatuan: 530000,
    keterangan: 'Uang harian 3 hari'
  });

  PerjalananDinasService.addBiaya(pd.pdId, {
    jenisBiaya: 'TIKET_PESAWAT',
    jumlah: 2,
    satuan: 'tiket',
    hargaSatuan: 1500000,
    keterangan: 'Tiket PP Malang-Jakarta'
  });
  console.log('- Created sample perjalanan dinas');

  console.log('Sample data created successfully!');
}

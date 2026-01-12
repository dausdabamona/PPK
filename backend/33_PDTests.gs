/**
 * 33_PDTests.gs
 * Unit Tests for Perjalanan Dinas Module
 * Tests: PD CRUD, Pelaksana CRUD, Biaya CRUD, Document Generation, Workflow
 *
 * Run via: Apps Script menu > PPK > Run PD Tests
 * Or via API: GET /api/tests/pd
 */

// ========================================
// TEST DATA & HELPERS
// ========================================

const PDTestData = {
  // Sample PD data
  samplePD: {
    jenisPD: 'LUAR_KOTA',
    tujuanDinas: 'Rapat Koordinasi di Jakarta',
    kotaTujuan: 'Jakarta',
    provinsiTujuan: 'DKI Jakarta',
    tanggalBerangkat: new Date().toISOString().split('T')[0],
    tanggalKembali: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tingkatBiaya: 'C',
    jenisTransportasi: 'PESAWAT',
    tempatBerangkat: 'Malang',
    pejabatPerintah: 'Test PPK',
    jabatanPejabatPerintah: 'Pejabat Pembuat Komitmen',
    akun: '524111',
    instansiPembebanan: 'Test Instansi'
  },

  // Sample Pelaksana data
  samplePelaksana1: {
    nama: 'Test Pelaksana 1',
    nip: '198001012000011001',
    pangkat: 'Penata Tk.I',
    golongan: 'III/d',
    jabatan: 'Analis Kebijakan',
    instansi: 'Test Instansi',
    tingkatBiaya: 'C',
    uangHarian: 530000,
    isPenanggungJawab: true
  },

  samplePelaksana2: {
    nama: 'Test Pelaksana 2',
    nip: '199002022000022002',
    pangkat: 'Penata Muda',
    golongan: 'III/a',
    jabatan: 'Pelaksana',
    instansi: 'Test Instansi',
    tingkatBiaya: 'C',
    uangHarian: 430000,
    isPenanggungJawab: false
  },

  // Sample Biaya data
  sampleBiaya1: {
    jenisBiaya: 'UANG_HARIAN',
    keterangan: 'Uang harian 3 hari',
    jumlah: 3,
    satuan: 'OH',
    hargaSatuan: 530000,
    total: 1590000
  },

  sampleBiaya2: {
    jenisBiaya: 'TRANSPORT_LOKAL',
    keterangan: 'Transport PP Bandara',
    jumlah: 2,
    satuan: 'KALI',
    hargaSatuan: 150000,
    total: 300000
  }
};

// Cleanup helper - removes test data
function cleanupPDTestData(pdId) {
  if (!pdId) return;
  try {
    PerjalananDinasService.delete(pdId);
  } catch (e) {
    console.log('Cleanup warning:', e.message);
  }
}

// ========================================
// PD CRUD TESTS
// ========================================

function testPDCRUD() {
  TestRunner.startSuite('PD CRUD Operations');
  let testPdId = null;

  // Test: Create PD
  TestRunner.test('Create PD successfully', function() {
    const pd = PerjalananDinasService.create(PDTestData.samplePD);
    testPdId = pd?.pdId;
    TestRunner.assert(pd !== null, 'PD should be created');
    TestRunner.assert(pd.pdId !== undefined, 'PD should have pdId');
    TestRunner.assertEqual(pd.status, 'DRAFT', 'Initial status should be DRAFT');
    return true;
  });

  // Test: Get PD by ID
  TestRunner.test('Get PD by ID', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId from previous test');
    const pd = PerjalananDinasService.getById(testPdId);
    TestRunner.assert(pd !== null, 'Should find PD');
    TestRunner.assertEqual(pd.kotaTujuan, 'Jakarta', 'kotaTujuan should match');
    return true;
  });

  // Test: Update PD
  TestRunner.test('Update PD fields', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const updated = PerjalananDinasService.update(testPdId, {
      kotaTujuan: 'Surabaya',
      keterangan: 'Test update'
    });
    TestRunner.assert(updated !== null, 'Update should succeed');
    TestRunner.assertEqual(updated.kotaTujuan, 'Surabaya', 'kotaTujuan should be updated');
    return true;
  });

  // Test: List PD
  TestRunner.test('List PD returns array', function() {
    const list = PerjalananDinasService.list();
    TestRunner.assert(Array.isArray(list), 'List should be array');
    TestRunner.assert(list.length > 0, 'List should not be empty');
    return true;
  });

  // Cleanup
  if (testPdId) cleanupPDTestData(testPdId);
}

// ========================================
// PELAKSANA CRUD TESTS
// ========================================

function testPelaksanaCRUD() {
  TestRunner.startSuite('Pelaksana CRUD Operations');
  let testPdId = null;
  let testPelaksanaId1 = null;
  let testPelaksanaId2 = null;

  // Setup: Create PD first
  TestRunner.test('Setup: Create PD for Pelaksana tests', function() {
    const pd = PerjalananDinasService.create(PDTestData.samplePD);
    testPdId = pd?.pdId;
    return TestRunner.assert(testPdId !== null, 'PD should be created');
  });

  // Test: Add Pelaksana 1
  TestRunner.test('Add Pelaksana 1', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const plk = PerjalananDinasService.addPelaksana(testPdId, PDTestData.samplePelaksana1);
    testPelaksanaId1 = plk?.pelaksanaId;
    TestRunner.assert(plk !== null, 'Pelaksana should be created');
    TestRunner.assert(testPelaksanaId1 !== undefined, 'Should have pelaksanaId');
    TestRunner.assertEqual(plk.nama, 'Test Pelaksana 1', 'Nama should match');
    return true;
  });

  // Test: Add Pelaksana 2
  TestRunner.test('Add Pelaksana 2', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const plk = PerjalananDinasService.addPelaksana(testPdId, PDTestData.samplePelaksana2);
    testPelaksanaId2 = plk?.pelaksanaId;
    TestRunner.assert(plk !== null, 'Pelaksana should be created');
    return true;
  });

  // Test: Get Pelaksana list
  TestRunner.test('Get Pelaksana list (should have 2)', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const list = PerjalananDinasService.getPelaksana(testPdId);
    TestRunner.assert(Array.isArray(list), 'Should be array');
    TestRunner.assertEqual(list.length, 2, 'Should have 2 pelaksana');
    return true;
  });

  // Test: Update Pelaksana
  TestRunner.test('Update Pelaksana', function() {
    TestRunner.assert(testPelaksanaId1 !== null, 'Need testPelaksanaId1');
    const updated = PerjalananDinasService.updatePelaksana(testPelaksanaId1, {
      jabatan: 'Updated Jabatan'
    });
    TestRunner.assert(updated !== null, 'Update should succeed');
    return true;
  });

  // Test: Delete Pelaksana
  TestRunner.test('Delete Pelaksana 2', function() {
    TestRunner.assert(testPelaksanaId2 !== null, 'Need testPelaksanaId2');
    const success = PerjalananDinasService.deletePelaksana(testPelaksanaId2);
    TestRunner.assert(success === true, 'Delete should succeed');
    // Verify deletion
    const list = PerjalananDinasService.getPelaksana(testPdId);
    TestRunner.assertEqual(list.length, 1, 'Should have 1 pelaksana after delete');
    return true;
  });

  // Cleanup
  if (testPdId) cleanupPDTestData(testPdId);
}

// ========================================
// BIAYA CRUD TESTS
// ========================================

function testBiayaCRUD() {
  TestRunner.startSuite('Biaya CRUD Operations');
  let testPdId = null;
  let testBiayaId1 = null;
  let testBiayaId2 = null;

  // Setup: Create PD first
  TestRunner.test('Setup: Create PD for Biaya tests', function() {
    const pd = PerjalananDinasService.create(PDTestData.samplePD);
    testPdId = pd?.pdId;
    return TestRunner.assert(testPdId !== null, 'PD should be created');
  });

  // Test: Add Biaya 1
  TestRunner.test('Add Biaya 1 (Uang Harian)', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const biaya = PerjalananDinasService.addBiaya(testPdId, PDTestData.sampleBiaya1);
    testBiayaId1 = biaya?.biayaId;
    TestRunner.assert(biaya !== null, 'Biaya should be created');
    TestRunner.assert(testBiayaId1 !== undefined, 'Should have biayaId');
    TestRunner.assertEqual(biaya.total, 1590000, 'Total should match');
    return true;
  });

  // Test: Add Biaya 2
  TestRunner.test('Add Biaya 2 (Transport)', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const biaya = PerjalananDinasService.addBiaya(testPdId, PDTestData.sampleBiaya2);
    testBiayaId2 = biaya?.biayaId;
    TestRunner.assert(biaya !== null, 'Biaya should be created');
    return true;
  });

  // Test: Get Biaya list
  TestRunner.test('Get Biaya list (should have 2)', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const list = PerjalananDinasService.getBiaya(testPdId);
    TestRunner.assert(Array.isArray(list), 'Should be array');
    TestRunner.assertEqual(list.length, 2, 'Should have 2 biaya items');
    return true;
  });

  // Test: Total biaya calculated
  TestRunner.test('Total biaya calculated on PD', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const pd = PerjalananDinasService.getById(testPdId);
    const expectedTotal = 1590000 + 300000;
    TestRunner.assertEqual(pd.totalBiaya, expectedTotal, 'Total biaya should be sum of all');
    return true;
  });

  // Test: Update Biaya
  TestRunner.test('Update Biaya', function() {
    TestRunner.assert(testBiayaId1 !== null, 'Need testBiayaId1');
    const updated = PerjalananDinasService.updateBiaya(testBiayaId1, {
      jumlah: 4,
      hargaSatuan: 530000
    });
    TestRunner.assert(updated !== null, 'Update should succeed');
    return true;
  });

  // Test: Delete Biaya
  TestRunner.test('Delete Biaya 2', function() {
    TestRunner.assert(testBiayaId2 !== null, 'Need testBiayaId2');
    const success = PerjalananDinasService.deleteBiaya(testBiayaId2);
    TestRunner.assert(success === true, 'Delete should succeed');
    // Verify deletion
    const list = PerjalananDinasService.getBiaya(testPdId);
    TestRunner.assertEqual(list.length, 1, 'Should have 1 biaya after delete');
    return true;
  });

  // Cleanup
  if (testPdId) cleanupPDTestData(testPdId);
}

// ========================================
// PD WORKFLOW TESTS
// ========================================

function testPDWorkflow() {
  TestRunner.startSuite('PD Workflow');
  let testPdId = null;

  // Setup: Create PD with Pelaksana
  TestRunner.test('Setup: Create PD with Pelaksana', function() {
    const pd = PerjalananDinasService.create(PDTestData.samplePD);
    testPdId = pd?.pdId;
    TestRunner.assert(testPdId !== null, 'PD should be created');
    // Add pelaksana
    PerjalananDinasService.addPelaksana(testPdId, PDTestData.samplePelaksana1);
    return true;
  });

  // Test: Initial status
  TestRunner.test('Initial status is DRAFT', function() {
    const status = PDWorkflowService.getStatus(testPdId);
    TestRunner.assertEqual(status.currentStage, 'DRAFT', 'Should start at DRAFT');
    return true;
  });

  // Test: Advance to SURAT_TUGAS
  TestRunner.test('Advance: DRAFT -> SURAT_TUGAS', function() {
    const result = PDWorkflowService.advanceStage(testPdId);
    TestRunner.assert(result.success === true, 'Advance should succeed');
    TestRunner.assertEqual(result.data.currentStage, 'SURAT_TUGAS', 'Should be at SURAT_TUGAS');
    return true;
  });

  // Test: Get workflow status
  TestRunner.test('Get workflow status shows progress', function() {
    const status = PDWorkflowService.getStatus(testPdId);
    TestRunner.assert(status.progress > 0, 'Progress should be > 0');
    TestRunner.assert(status.stages.length > 0, 'Should have stages');
    return true;
  });

  // Test: Revert stage
  TestRunner.test('Revert: SURAT_TUGAS -> DRAFT', function() {
    const result = PDWorkflowService.revertStage(testPdId);
    TestRunner.assert(result.success === true, 'Revert should succeed');
    TestRunner.assertEqual(result.data.currentStage, 'DRAFT', 'Should be back at DRAFT');
    return true;
  });

  // Cleanup
  if (testPdId) cleanupPDTestData(testPdId);
}

// ========================================
// DOCUMENT GENERATION TESTS
// ========================================

function testPDDocumentGeneration() {
  TestRunner.startSuite('PD Document Generation');
  let testPdId = null;

  // Setup: Create complete PD with pelaksana and biaya
  TestRunner.test('Setup: Create complete PD', function() {
    const pd = PerjalananDinasService.create(PDTestData.samplePD);
    testPdId = pd?.pdId;
    TestRunner.assert(testPdId !== null, 'PD should be created');
    // Add pelaksana
    PerjalananDinasService.addPelaksana(testPdId, PDTestData.samplePelaksana1);
    PerjalananDinasService.addPelaksana(testPdId, PDTestData.samplePelaksana2);
    // Add biaya
    PerjalananDinasService.addBiaya(testPdId, PDTestData.sampleBiaya1);
    PerjalananDinasService.addBiaya(testPdId, PDTestData.sampleBiaya2);
    return true;
  });

  // Test: Generate Surat Tugas
  TestRunner.test('Generate Surat Tugas', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const result = PerjalananDinasService.generateSuratPDDalamKota(testPdId);
    TestRunner.assert(result.success === true, 'Should succeed: ' + (result.error || ''));
    TestRunner.assert(result.data?.googleDocUrl !== undefined, 'Should have googleDocUrl');
    return true;
  });

  // Test: Generate SPPD
  TestRunner.test('Generate SPPD', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const result = PerjalananDinasService.generateSPPD(testPdId);
    TestRunner.assert(result.success === true, 'Should succeed: ' + (result.error || ''));
    TestRunner.assert(result.data?.googleDocUrl !== undefined, 'Should have googleDocUrl');
    return true;
  });

  // Test: Generate Kuitansi Rampung
  TestRunner.test('Generate Kuitansi Rampung', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const result = PerjalananDinasService.generateKuitansiRampung(testPdId);
    TestRunner.assert(result.success === true, 'Should succeed: ' + (result.error || ''));
    TestRunner.assert(result.data?.googleDocUrl !== undefined, 'Should have googleDocUrl');
    return true;
  });

  // Test: Generate Daftar Pengeluaran Riil
  TestRunner.test('Generate Daftar Pengeluaran Riil', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const result = PerjalananDinasService.generateDaftarPengeluaranRiil(testPdId);
    TestRunner.assert(result.success === true, 'Should succeed: ' + (result.error || ''));
    TestRunner.assert(result.data?.googleDocUrl !== undefined, 'Should have googleDocUrl');
    return true;
  });

  // Test: Documents saved in DokumenPD sheet
  TestRunner.test('Documents saved in DokumenPD sheet', function() {
    TestRunner.assert(testPdId !== null, 'Need testPdId');
    const dokumen = PerjalananDinasService.getDokumen(testPdId);
    TestRunner.assert(Array.isArray(dokumen), 'Should be array');
    TestRunner.assert(dokumen.length >= 4, 'Should have at least 4 documents');
    return true;
  });

  // Cleanup
  if (testPdId) cleanupPDTestData(testPdId);
}

// ========================================
// ROUTER TESTS - PATH & METHOD OVERRIDE
// ========================================

function testRouterPathParsing() {
  TestRunner.startSuite('Router Path Parsing');

  // Test: Simulate POST body with path
  TestRunner.test('POST body path extraction', function() {
    // This tests the logic, not actual HTTP call
    const mockPostData = JSON.stringify({
      path: '/api/perjalanan-dinas/PD-123/pelaksana',
      data: { nama: 'Test' }
    });

    const parsed = JSON.parse(mockPostData);
    TestRunner.assert(parsed.path === '/api/perjalanan-dinas/PD-123/pelaksana', 'Path should be extracted');
    TestRunner.assert(parsed.data.nama === 'Test', 'Data should be extracted');
    return true;
  });

  // Test: Method override in data
  TestRunner.test('DELETE method override in data', function() {
    const mockPostData = JSON.stringify({
      path: '/api/pelaksana/PLK-123',
      data: { _method: 'DELETE' }
    });

    const parsed = JSON.parse(mockPostData);
    const requestData = parsed.data || {};
    const method = requestData._method || 'POST';

    TestRunner.assertEqual(method, 'DELETE', 'Method should be DELETE');
    return true;
  });
}

// ========================================
// RUN ALL PD TESTS
// ========================================

function runAllPDTests() {
  console.log('\n============================================');
  console.log('      PERJALANAN DINAS MODULE TESTS        ');
  console.log('============================================\n');

  TestRunner.reset();

  // Run all test suites
  testPDCRUD();
  testPelaksanaCRUD();
  testBiayaCRUD();
  testPDWorkflow();
  testRouterPathParsing();

  // Document generation tests (optional - takes longer)
  // Uncomment to run full document generation tests
  // testPDDocumentGeneration();

  // Get summary
  const summary = TestRunner.getSummary();

  return {
    success: summary.success,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    message: summary.success
      ? 'All PD tests passed!'
      : `${summary.failed} of ${summary.total} tests failed`
  };
}

// ========================================
// RUN FULL TESTS (including doc generation)
// ========================================

function runFullPDTests() {
  console.log('\n============================================');
  console.log('   PERJALANAN DINAS FULL TESTS (w/ Docs)   ');
  console.log('============================================\n');

  TestRunner.reset();

  // Run all test suites including document generation
  testPDCRUD();
  testPelaksanaCRUD();
  testBiayaCRUD();
  testPDWorkflow();
  testRouterPathParsing();
  testPDDocumentGeneration();

  // Get summary
  const summary = TestRunner.getSummary();

  return {
    success: summary.success,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    message: summary.success
      ? 'All PD tests (including doc generation) passed!'
      : `${summary.failed} of ${summary.total} tests failed`
  };
}

// Add menu item for running tests
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('PPK Tests')
    .addItem('Run PD Tests', 'runAllPDTests')
    .addItem('Run Full PD Tests (with Docs)', 'runFullPDTests')
    .addToUi();
}

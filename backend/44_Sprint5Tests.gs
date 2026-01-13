/**
 * 44_Sprint5Tests.gs
 * Sprint 5: Production & Audit Readiness
 *
 * Unit Tests for:
 * - BackupService
 * - DocumentFinalizationService
 * - AuditSimulationService
 * - SOPGeneratorService
 */

// ========================================
// SPRINT 5 TESTS
// ========================================

function testBackupService() {
  TestRunner.startSuite('Backup Service');

  // Test: Get backup folder
  TestRunner.test('Get backup folder creates folder structure', function() {
    const folder = BackupService.getBackupFolder(2026);
    TestRunner.assert(folder !== null, 'Folder should be created');
    TestRunner.assert(folder.getName().includes('TA_2026'), 'Folder name should include year');
    return true;
  });

  // Test: Create backup
  TestRunner.test('Create full backup', function() {
    const result = BackupService.createBackup('Test');
    TestRunner.assert(result.success === true, 'Backup should succeed');
    TestRunner.assert(result.data.backupId !== undefined, 'Should have backupId');
    TestRunner.assert(result.data.backupUrl !== undefined, 'Should have backupUrl');
    return true;
  });

  // Test: Get backup history
  TestRunner.test('Get backup history returns array', function() {
    const history = BackupService.getBackupHistory();
    TestRunner.assert(Array.isArray(history), 'Should return array');
    return true;
  });

  // Test: Get backup stats
  TestRunner.test('Get backup stats', function() {
    const stats = BackupService.getBackupStats();
    TestRunner.assert(stats.tahun !== undefined, 'Should have tahun');
    TestRunner.assert(stats.totalBackups !== undefined, 'Should have totalBackups');
    return true;
  });

  // Test: Verify backup (if backup exists)
  TestRunner.test('Verify backup integrity', function() {
    const history = BackupService.getBackupHistory(null, 1);
    if (history.length > 0) {
      const result = BackupService.verifyBackup(history[0].backupId);
      TestRunner.assert(result.success === true, 'Verification should succeed');
      TestRunner.assert(result.data.sheets.length > 0, 'Should have sheets');
      return true;
    }
    return true; // Skip if no backup exists
  });
}

function testDocumentFinalizationService() {
  TestRunner.startSuite('Document Finalization Service');
  let testDocId = null;

  // Test: Setup sheets
  TestRunner.test('Setup document master sheets', function() {
    const result = DocumentFinalizationService.setupDocumentMasterSheet();
    TestRunner.assert(result.success === true, 'Setup should succeed');
    return true;
  });

  // Test: Generate document number
  TestRunner.test('Generate document number', function() {
    const result = DocumentFinalizationService.generateDocumentNumber('SURAT_TUGAS', 2026);
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assert(result.data.nomorDokumen.includes('ST/'), 'Should have ST prefix');
    TestRunner.assert(result.data.nomorDokumen.includes('/2026'), 'Should have year');
    return true;
  });

  // Test: Register document
  TestRunner.test('Register new document', function() {
    const result = DocumentFinalizationService.registerDocument({
      docType: 'SURAT_TUGAS',
      refId: 'TEST-001',
      refType: 'PD',
      perihal: 'Test Document',
      createdBy: 'Test User',
      tahunAnggaran: 2026
    });
    testDocId = result.data?.docMasterId;
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assert(result.data.status === 'DRAFT', 'Initial status should be DRAFT');
    return true;
  });

  // Test: Get document
  TestRunner.test('Get document by ID', function() {
    if (!testDocId) return true;
    const doc = DocumentFinalizationService.getDocument(testDocId);
    TestRunner.assert(doc !== null, 'Should find document');
    TestRunner.assertEqual(doc.status, 'DRAFT', 'Status should be DRAFT');
    return true;
  });

  // Test: Finalize document
  TestRunner.test('Finalize document (DRAFT -> FINAL)', function() {
    if (!testDocId) return true;
    const result = DocumentFinalizationService.finalizeDocument(testDocId, 'Test User');
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assertEqual(result.data.status, 'FINAL', 'Status should be FINAL');
    TestRunner.assert(result.data.isLocked === true, 'Should be locked');
    return true;
  });

  // Test: Can't edit finalized document
  TestRunner.test('Cannot edit FINAL document', function() {
    if (!testDocId) return true;
    const check = DocumentFinalizationService.canEdit(testDocId);
    TestRunner.assert(check.canEdit === false, 'Should not be editable');
    return true;
  });

  // Test: Revise document
  TestRunner.test('Revise document (FINAL -> REVISED)', function() {
    if (!testDocId) return true;
    const result = DocumentFinalizationService.reviseDocument(testDocId, 'Need correction', 'Test User');
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assertEqual(result.data.status, 'REVISED', 'Status should be REVISED');
    TestRunner.assert(result.data.currentVersion > 1, 'Version should increase');
    return true;
  });

  // Test: Get revision history
  TestRunner.test('Get revision history', function() {
    if (!testDocId) return true;
    const history = DocumentFinalizationService.getRevisionHistory(testDocId);
    TestRunner.assert(Array.isArray(history), 'Should be array');
    TestRunner.assert(history.length >= 2, 'Should have at least 2 revisions');
    return true;
  });

  // Test: Void document
  TestRunner.test('Void document', function() {
    if (!testDocId) return true;
    const result = DocumentFinalizationService.voidDocument(testDocId, 'Cancelled', 'Test User');
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assertEqual(result.data.status, 'VOID', 'Status should be VOID');
    return true;
  });
}

function testAuditSimulationService() {
  TestRunner.startSuite('Audit Simulation Service');

  // Test: Get required documents
  TestRunner.test('Get required documents for workflow stage', function() {
    const docs = AuditSimulationService.getRequiredDocuments('KONTRAK');
    TestRunner.assert(Array.isArray(docs), 'Should be array');
    TestRunner.assert(docs.length > 0, 'Should have required docs for KONTRAK');
    const spk = docs.find(d => d.code === 'SPK');
    TestRunner.assert(spk !== undefined, 'Should require SPK for KONTRAK stage');
    return true;
  });

  // Test: Generate recommendations
  TestRunner.test('Generate recommendations from findings', function() {
    const findings = [
      { category: 'Test', severity: 'CRITICAL', title: 'Test Critical', recommendation: 'Fix it' },
      { category: 'Test', severity: 'WARNING', title: 'Test Warning', recommendation: 'Check it' }
    ];
    const recs = AuditSimulationService.generateRecommendations(findings);
    TestRunner.assert(Array.isArray(recs), 'Should be array');
    TestRunner.assert(recs.length > 0, 'Should have recommendations');
    TestRunner.assertEqual(recs[0].priority, 'HIGH', 'First should be HIGH priority');
    return true;
  });

  // Test: Simulate audit for PD (create test PD first)
  TestRunner.test('Simulate audit for Perjalanan Dinas', function() {
    // Create test PD
    const pd = PerjalananDinasService.create({
      jenisPD: 'LUAR_KOTA',
      tujuanDinas: 'Audit Test',
      kotaTujuan: 'Jakarta',
      tanggalBerangkat: new Date().toISOString().split('T')[0],
      tanggalKembali: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0]
    });

    if (pd && pd.pdId) {
      const result = AuditSimulationService.simulateAuditPD(pd.pdId);
      TestRunner.assert(result.success === true, 'Should succeed');
      TestRunner.assert(result.data.score !== undefined, 'Should have score');
      TestRunner.assert(result.data.findings !== undefined, 'Should have findings');

      // Cleanup
      PerjalananDinasService.delete(pd.pdId);
    }
    return true;
  });
}

function testSOPGenerator() {
  TestRunner.startSuite('SOP Generator Service');

  // Test: Generate SOP Paket
  TestRunner.test('Generate SOP Paket', function() {
    const result = SOPGeneratorService.generateSOPPaket();
    TestRunner.assert(result.success === true, 'Should succeed');
    TestRunner.assert(result.data.docUrl !== undefined, 'Should have docUrl');
    return true;
  });

  // Test: Generate SOP Dokumen
  TestRunner.test('Generate SOP Dokumen', function() {
    const result = SOPGeneratorService.generateSOPDokumen();
    TestRunner.assert(result.success === true, 'Should succeed');
    return true;
  });

  // Test: Generate SOP Audit Bundle
  TestRunner.test('Generate SOP Audit Bundle', function() {
    const result = SOPGeneratorService.generateSOPAuditBundle();
    TestRunner.assert(result.success === true, 'Should succeed');
    return true;
  });

  // Test: Generate SOP Backup Restore
  TestRunner.test('Generate SOP Backup Restore', function() {
    const result = SOPGeneratorService.generateSOPBackupRestore();
    TestRunner.assert(result.success === true, 'Should succeed');
    return true;
  });
}

// ========================================
// RUN ALL SPRINT 5 TESTS
// ========================================

function runAllSprint5Tests() {
  console.log('\n============================================');
  console.log('      SPRINT 5 - AUDIT READINESS TESTS     ');
  console.log('============================================\n');

  TestRunner.reset();

  // Run all test suites
  testBackupService();
  testDocumentFinalizationService();
  testAuditSimulationService();
  // Skip SOP generation tests in quick run (takes time to create docs)
  // testSOPGenerator();

  // Get summary
  const summary = TestRunner.getSummary();

  return {
    success: summary.success,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    message: summary.success
      ? 'All Sprint 5 tests passed!'
      : `${summary.failed} of ${summary.total} tests failed`
  };
}

function runFullSprint5Tests() {
  console.log('\n============================================');
  console.log('   SPRINT 5 FULL TESTS (including SOP)    ');
  console.log('============================================\n');

  TestRunner.reset();

  testBackupService();
  testDocumentFinalizationService();
  testAuditSimulationService();
  testSOPGenerator();

  const summary = TestRunner.getSummary();

  return {
    success: summary.success,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    message: summary.success
      ? 'All Sprint 5 tests (including SOP) passed!'
      : `${summary.failed} of ${summary.total} tests failed`
  };
}

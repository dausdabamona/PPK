/**
 * 32_Sprint3Tests.gs
 * Unit Tests for Sprint 3: Document Templates & Reporting
 *
 * Test Coverage:
 * - Document template generation
 * - Dynamic merge functionality
 * - Auto-numbering integration
 * - Reporting service
 * - Audit bundle generation
 */

// ========================================
// SPRINT 3 TEST RUNNER
// ========================================

function runAllSprint3Tests() {
  const testRunner = new Sprint3TestRunner();
  return testRunner.runAll();
}

class Sprint3TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
      startTime: new Date().toISOString()
    };
  }

  runAll() {
    console.log('========================================');
    console.log('SPRINT 3 TEST SUITE');
    console.log('Document Templates & Reporting');
    console.log('========================================\n');

    // Document Template Tests
    this.runDocumentTemplateTests();

    // Reporting Tests
    this.runReportingTests();

    // Integration Tests
    this.runIntegrationTests();

    // Summary
    this.results.endTime = new Date().toISOString();
    this.results.duration = new Date(this.results.endTime) - new Date(this.results.startTime);

    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Duration: ${this.results.duration}ms`);

    return {
      success: this.results.failed === 0,
      data: this.results
    };
  }

  // ==================== DOCUMENT TEMPLATE TESTS ====================

  runDocumentTemplateTests() {
    console.log('\n--- Document Template Tests ---\n');

    // Test 1: Get available templates
    this.test('Should list all 8 available templates', () => {
      const templates = DocumentTemplateService.getAvailableTemplates();
      this.assertEqual(templates.length, 8, 'Should have 8 templates');

      const codes = templates.map(t => t.code);
      this.assertContains(codes, 'HPS', 'Should include HPS');
      this.assertContains(codes, 'SPK', 'Should include SPK');
      this.assertContains(codes, 'SPMK', 'Should include SPMK');
      this.assertContains(codes, 'BAHP', 'Should include BAHP');
      this.assertContains(codes, 'BAST', 'Should include BAST');
      this.assertContains(codes, 'KUITANSI', 'Should include KUITANSI');
      this.assertContains(codes, 'SPM', 'Should include SPM');
      this.assertContains(codes, 'JUSTIFIKASI', 'Should include JUSTIFIKASI');
    });

    // Test 2: Template configuration validation
    this.test('Template configurations should be valid', () => {
      const templates = DocumentTemplateService.getAvailableTemplates();

      templates.forEach(t => {
        this.assertTrue(t.code, `Template should have code`);
        this.assertTrue(t.name, `Template ${t.code} should have name`);
        this.assertTrue(t.prefix, `Template ${t.code} should have prefix`);
        this.assertTrue(typeof t.requiresPenyedia === 'boolean', `Template ${t.code} should have requiresPenyedia`);
        this.assertTrue(typeof t.requiresKontrak === 'boolean', `Template ${t.code} should have requiresKontrak`);
      });
    });

    // Test 3: Template requirements check
    this.test('Templates should have correct requirements', () => {
      const templates = DocumentTemplateService.getAvailableTemplates();
      const templateMap = {};
      templates.forEach(t => templateMap[t.code] = t);

      // HPS and JUSTIFIKASI don't require penyedia
      this.assertFalse(templateMap.HPS.requiresPenyedia, 'HPS should not require penyedia');
      this.assertFalse(templateMap.JUSTIFIKASI.requiresPenyedia, 'JUSTIFIKASI should not require penyedia');

      // SPK requires penyedia but not kontrak
      this.assertTrue(templateMap.SPK.requiresPenyedia, 'SPK should require penyedia');
      this.assertFalse(templateMap.SPK.requiresKontrak, 'SPK should not require kontrak');

      // SPMK, BAHP, BAST, KUITANSI, SPM require kontrak
      this.assertTrue(templateMap.SPMK.requiresKontrak, 'SPMK should require kontrak');
      this.assertTrue(templateMap.BAHP.requiresKontrak, 'BAHP should require kontrak');
      this.assertTrue(templateMap.BAST.requiresKontrak, 'BAST should require kontrak');
      this.assertTrue(templateMap.KUITANSI.requiresKontrak, 'KUITANSI should require kontrak');
      this.assertTrue(templateMap.SPM.requiresKontrak, 'SPM should require kontrak');
    });

    // Test 4: Generation fails without paket
    this.test('Document generation should fail for non-existent paket', () => {
      const result = DocumentTemplateService.generate('NONEXISTENT', 'HPS');
      this.assertFalse(result.success, 'Should fail for non-existent paket');
      this.assertTrue(result.error.includes('tidak ditemukan'), 'Error should mention not found');
    });

    // Test 5: Generation fails for unknown template type
    this.test('Document generation should fail for unknown template type', () => {
      const result = DocumentTemplateService.generate('PKT-001', 'UNKNOWN_TYPE');
      this.assertFalse(result.success, 'Should fail for unknown template type');
      this.assertTrue(result.error.includes('tidak ditemukan'), 'Error should mention not found');
    });
  }

  // ==================== REPORTING TESTS ====================

  runReportingTests() {
    console.log('\n--- Reporting Tests ---\n');

    // Test 1: Paket summary structure
    this.test('Paket summary should have correct structure', () => {
      const result = ReportingService.getPaketSummary(2025);

      this.assertTrue(result.success, 'Should succeed');
      this.assertTrue(result.data.hasOwnProperty('tahun'), 'Should have tahun');
      this.assertTrue(result.data.hasOwnProperty('totalPaket'), 'Should have totalPaket');
      this.assertTrue(result.data.hasOwnProperty('totalPagu'), 'Should have totalPagu');
      this.assertTrue(result.data.hasOwnProperty('totalHPS'), 'Should have totalHPS');
      this.assertTrue(result.data.hasOwnProperty('totalKontrak'), 'Should have totalKontrak');
      this.assertTrue(result.data.hasOwnProperty('totalTerbayar'), 'Should have totalTerbayar');
      this.assertTrue(result.data.hasOwnProperty('paketByStatus'), 'Should have paketByStatus');
      this.assertTrue(result.data.hasOwnProperty('paketByJenis'), 'Should have paketByJenis');
      this.assertTrue(result.data.hasOwnProperty('perBulan'), 'Should have perBulan');
      this.assertTrue(result.data.hasOwnProperty('detail'), 'Should have detail');
    });

    // Test 2: Monthly distribution array
    this.test('Paket summary perBulan should have 12 months', () => {
      const result = ReportingService.getPaketSummary(2025);

      this.assertTrue(result.success, 'Should succeed');
      this.assertEqual(result.data.perBulan.length, 12, 'Should have 12 months');

      result.data.perBulan.forEach((month, idx) => {
        this.assertTrue(month.hasOwnProperty('paket'), `Month ${idx} should have paket count`);
        this.assertTrue(month.hasOwnProperty('pagu'), `Month ${idx} should have pagu`);
        this.assertTrue(month.hasOwnProperty('kontrak'), `Month ${idx} should have kontrak`);
        this.assertTrue(month.hasOwnProperty('terbayar'), `Month ${idx} should have terbayar`);
      });
    });

    // Test 3: Contract vs Payment structure
    this.test('Contract vs Payment should have correct structure', () => {
      const result = ReportingService.getContractVsPayment({ tahun: 2025 });

      this.assertTrue(result.success, 'Should succeed');
      this.assertTrue(result.data.hasOwnProperty('totalKontrak'), 'Should have totalKontrak');
      this.assertTrue(result.data.hasOwnProperty('totalTerbayar'), 'Should have totalTerbayar');
      this.assertTrue(result.data.hasOwnProperty('totalOutstanding'), 'Should have totalOutstanding');
      this.assertTrue(result.data.hasOwnProperty('kontrakBelumBayar'), 'Should have kontrakBelumBayar');
      this.assertTrue(result.data.hasOwnProperty('kontrakLunas'), 'Should have kontrakLunas');
      this.assertTrue(result.data.hasOwnProperty('cashFlow'), 'Should have cashFlow');
      this.assertTrue(result.data.hasOwnProperty('summary'), 'Should have summary');
    });

    // Test 4: Cash flow monthly distribution
    this.test('Cash flow should have 12 months', () => {
      const result = ReportingService.getContractVsPayment({ tahun: 2025 });

      this.assertTrue(result.success, 'Should succeed');
      this.assertEqual(result.data.cashFlow.length, 12, 'Should have 12 months');

      result.data.cashFlow.forEach((month, idx) => {
        this.assertTrue(month.hasOwnProperty('kontrak'), `Month ${idx} should have kontrak`);
        this.assertTrue(month.hasOwnProperty('pembayaran'), `Month ${idx} should have pembayaran`);
      });
    });

    // Test 5: Compliance dashboard structure
    this.test('Compliance dashboard should have correct structure', () => {
      const result = ReportingService.getComplianceDashboard({ tahun: 2025 });

      this.assertTrue(result.success, 'Should succeed');
      this.assertTrue(result.data.hasOwnProperty('totalPaket'), 'Should have totalPaket');
      this.assertTrue(result.data.hasOwnProperty('compliant'), 'Should have compliant');
      this.assertTrue(result.data.hasOwnProperty('nonCompliant'), 'Should have nonCompliant');
      this.assertTrue(result.data.hasOwnProperty('avgScore'), 'Should have avgScore');
      this.assertTrue(result.data.hasOwnProperty('scoreDistribution'), 'Should have scoreDistribution');
      this.assertTrue(result.data.hasOwnProperty('requiresAttention'), 'Should have requiresAttention');
    });

    // Test 6: Score distribution categories
    this.test('Score distribution should have 4 categories', () => {
      const result = ReportingService.getComplianceDashboard({ tahun: 2025 });

      this.assertTrue(result.success, 'Should succeed');
      const dist = result.data.scoreDistribution;
      this.assertTrue(dist.hasOwnProperty('excellent'), 'Should have excellent (90-100)');
      this.assertTrue(dist.hasOwnProperty('good'), 'Should have good (70-89)');
      this.assertTrue(dist.hasOwnProperty('fair'), 'Should have fair (50-69)');
      this.assertTrue(dist.hasOwnProperty('poor'), 'Should have poor (0-49)');
    });

    // Test 7: PD Summary structure
    this.test('PD Summary should have correct structure', () => {
      const result = ReportingService.getPDSummary(2025);

      this.assertTrue(result.success, 'Should succeed');
      this.assertTrue(result.data.hasOwnProperty('totalPD'), 'Should have totalPD');
      this.assertTrue(result.data.hasOwnProperty('pdByJenis'), 'Should have pdByJenis');
      this.assertTrue(result.data.hasOwnProperty('totalAnggaran'), 'Should have totalAnggaran');
      this.assertTrue(result.data.hasOwnProperty('totalRealisasi'), 'Should have totalRealisasi');
      this.assertTrue(result.data.hasOwnProperty('byKomponen'), 'Should have byKomponen');
      this.assertTrue(result.data.hasOwnProperty('topDestinations'), 'Should have topDestinations');
    });
  }

  // ==================== INTEGRATION TESTS ====================

  runIntegrationTests() {
    console.log('\n--- Integration Tests ---\n');

    // Test 1: Audit bundle fails for non-existent paket
    this.test('Audit bundle should fail for non-existent paket', () => {
      const result = ReportingService.generateAuditBundle('NONEXISTENT');
      this.assertFalse(result.success, 'Should fail for non-existent paket');
      this.assertTrue(result.error.includes('tidak ditemukan'), 'Error should mention not found');
    });

    // Test 2: Utility functions - formatRupiahDoc
    this.test('formatRupiahDoc should format numbers correctly', () => {
      const result1 = formatRupiahDoc(1000000);
      this.assertTrue(result1.includes('1'), 'Should format 1000000');
      this.assertTrue(result1.includes('000'), 'Should have thousands separator');

      const result2 = formatRupiahDoc(0);
      this.assertEqual(result2, '0', 'Should handle zero');

      const result3 = formatRupiahDoc(null);
      this.assertEqual(result3, '-', 'Should handle null');
    });

    // Test 3: Utility functions - formatTanggalIndo
    this.test('formatTanggalIndo should format dates correctly', () => {
      const result1 = formatTanggalIndo('2025-01-15');
      this.assertTrue(result1.includes('Januari'), 'Should have Indonesian month');
      this.assertTrue(result1.includes('2025'), 'Should have year');

      const result2 = formatTanggalIndo(null);
      this.assertEqual(result2, '-', 'Should handle null');

      const result3 = formatTanggalIndo('invalid');
      this.assertEqual(result3, 'invalid', 'Should return original for invalid date');
    });

    // Test 4: Utility functions - terbilangClean
    this.test('terbilangClean should convert numbers to words', () => {
      const result1 = terbilangClean(5);
      this.assertEqual(result1, 'lima', 'Should convert 5 to lima');

      const result2 = terbilangClean(15);
      this.assertTrue(result2.includes('belas'), 'Should handle teens');

      const result3 = terbilangClean(1000);
      this.assertTrue(result3.includes('seribu'), 'Should handle thousands');

      const result4 = terbilangClean(1000000);
      this.assertTrue(result4.includes('juta'), 'Should handle millions');
    });

    // Test 5: Router document template route
    this.test('Router should have document template routes', () => {
      // Test GET /documents/templates
      const templatesResult = routeRequest('documents/templates', 'GET', {}, {});
      this.assertTrue(templatesResult.success, 'Should succeed for templates list');
      this.assertTrue(Array.isArray(templatesResult.data), 'Should return array');
    });

    // Test 6: Router reporting routes
    this.test('Router should have reporting routes', () => {
      // Test GET /reporting/paket-summary
      const summaryResult = routeRequest('reporting/paket-summary', 'GET', { tahun: '2025' }, {});
      this.assertTrue(summaryResult.success, 'Should succeed for paket summary');

      // Test GET /reporting/contract-payment
      const contractResult = routeRequest('reporting/contract-payment', 'GET', { tahun: '2025' }, {});
      this.assertTrue(contractResult.success, 'Should succeed for contract payment');

      // Test GET /reporting/compliance-dashboard
      const complianceResult = routeRequest('reporting/compliance-dashboard', 'GET', { tahun: '2025' }, {});
      this.assertTrue(complianceResult.success, 'Should succeed for compliance dashboard');
    });
  }

  // ==================== TEST HELPERS ====================

  test(name, fn) {
    try {
      fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✓ ${name}`);
    } catch (e) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: e.message });
      console.error(`✗ ${name}`);
      console.error(`  Error: ${e.message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: Expected ${expected}, got ${actual}`);
    }
  }

  assertTrue(value, message) {
    if (!value) {
      throw new Error(`${message}: Expected truthy value, got ${value}`);
    }
  }

  assertFalse(value, message) {
    if (value) {
      throw new Error(`${message}: Expected falsy value, got ${value}`);
    }
  }

  assertContains(array, value, message) {
    if (!array.includes(value)) {
      throw new Error(`${message}: Array does not contain ${value}`);
    }
  }
}

// ========================================
// DOCUMENT TEMPLATE EXAMPLES
// ========================================

/**
 * Example document template usage
 */
function getDocumentTemplateExamples() {
  return {
    title: 'Sprint 3: Document Template Examples',
    examples: [

      {
        name: 'Generate HPS Document',
        description: 'Generate Harga Perkiraan Sendiri document',
        endpoint: 'POST /documents/generate/{paketId}',
        request: {
          docType: 'HPS'
        },
        response: {
          success: true,
          data: {
            docId: 'DOC-202501-001',
            googleDocId: '1abc...',
            googleDocUrl: 'https://docs.google.com/...',
            jenisDokumen: 'HPS',
            nomorDokumen: 'HPS/001/I/2025',
            tanggalDokumen: '2025-01-15 10:30:00'
          }
        }
      },

      {
        name: 'Generate SPK Document',
        description: 'Generate Surat Perintah Kerja',
        endpoint: 'POST /documents/generate/{paketId}',
        request: {
          docType: 'SPK'
        },
        notes: 'Requires penyedia data to be set'
      },

      {
        name: 'Generate SPMK Document',
        description: 'Generate Surat Perintah Mulai Kerja',
        endpoint: 'POST /documents/generate/{paketId}',
        request: {
          docType: 'SPMK'
        },
        notes: 'Requires kontrak to be created first'
      },

      {
        name: 'Generate Full Document Set',
        description: 'Generate all required documents for a paket',
        workflow: [
          '1. POST /documents/generate/{paketId} with docType: HPS',
          '2. POST /documents/generate/{paketId} with docType: JUSTIFIKASI',
          '3. Set penyedia, then POST /documents/generate/{paketId} with docType: SPK',
          '4. Create kontrak, then POST /documents/generate/{paketId} with docType: SPMK',
          '5. After work completion, POST /documents/generate/{paketId} with docType: BAHP',
          '6. POST /documents/generate/{paketId} with docType: BAST',
          '7. POST /documents/generate/{paketId} with docType: KUITANSI',
          '8. POST /documents/generate/{paketId} with docType: SPM'
        ]
      }
    ]
  };
}

/**
 * Example reporting API usage
 */
function getReportingAPIExamples() {
  return {
    title: 'Sprint 3: Reporting API Examples',
    examples: [

      {
        name: 'Get Paket Summary',
        description: 'Get comprehensive paket summary for fiscal year',
        endpoint: 'GET /reporting/paket-summary?tahun=2025',
        responseStructure: {
          tahun: 2025,
          totalPaket: 50,
          totalPagu: 5000000000,
          totalHPS: 4800000000,
          totalKontrak: 4500000000,
          totalTerbayar: 3000000000,
          percentageRealized: 90,
          percentagePaid: 67,
          paketByStatus: { DRAFT: 5, KONTRAK: 10, SELESAI: 35 },
          paketByJenis: { BARANG: 20, JASA: 30 },
          perBulan: ['... 12 months data ...']
        }
      },

      {
        name: 'Get Contract vs Payment Analysis',
        description: 'Analyze contract values against actual payments',
        endpoint: 'GET /reporting/contract-payment?tahun=2025',
        responseStructure: {
          totalKontrak: 4500000000,
          totalTerbayar: 3000000000,
          totalOutstanding: 1500000000,
          kontrakBelumBayar: ['... list ...'],
          kontrakLunas: ['... list ...'],
          cashFlow: ['... 12 months ...'],
          summary: {
            totalKontrak: 50,
            lunas: 30,
            belumBayar: 10,
            sebagianBayar: 10
          }
        }
      },

      {
        name: 'Get Compliance Dashboard',
        description: 'Get compliance status overview',
        endpoint: 'GET /reporting/compliance-dashboard?tahun=2025',
        responseStructure: {
          totalPaket: 50,
          compliant: 40,
          nonCompliant: 10,
          avgScore: 85,
          scoreDistribution: {
            excellent: 20,
            good: 15,
            fair: 10,
            poor: 5
          },
          requiresAttention: ['... pakets with issues ...']
        }
      },

      {
        name: 'Generate Audit Bundle',
        description: 'Create ZIP bundle with all documents for audit',
        endpoint: 'GET /reporting/audit-bundle/{paketId}',
        responseStructure: {
          bundleId: 'BND-202501-001',
          paketId: 'PKT-001',
          bundleFolderUrl: 'https://drive.google.com/...',
          documentCount: 8,
          documents: ['... list of bundled docs ...'],
          manifestUrl: 'https://docs.google.com/...'
        }
      },

      {
        name: 'Export Report to Spreadsheet',
        description: 'Export report data to a new Google Spreadsheet',
        endpoint: 'POST /reporting/export',
        request: {
          reportType: 'PAKET_SUMMARY',
          tahun: 2025
        },
        supportedReportTypes: [
          'PAKET_SUMMARY',
          'CONTRACT_PAYMENT',
          'PD_SUMMARY',
          'COMPLIANCE'
        ]
      }
    ]
  };
}

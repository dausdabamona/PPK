/**
 * 22_WorkflowTests.gs
 * Unit Tests for State Machine and Compliance Validator
 * Sprint 2: Workflow Engine & Compliance Validation
 *
 * Run these tests via Apps Script menu: PPK > Run Tests
 */

// ========================================
// TEST FRAMEWORK
// ========================================

const TestRunner = {
  results: [],
  currentSuite: '',

  startSuite: function(name) {
    this.currentSuite = name;
    console.log(`\n========== ${name} ==========`);
  },

  test: function(name, testFn) {
    try {
      const result = testFn();
      if (result === true || result === undefined) {
        this.results.push({ suite: this.currentSuite, test: name, passed: true });
        console.log(`  ✓ ${name}`);
      } else {
        this.results.push({ suite: this.currentSuite, test: name, passed: false, error: 'Assertion failed' });
        console.log(`  ✗ ${name}: Assertion failed`);
      }
    } catch (e) {
      this.results.push({ suite: this.currentSuite, test: name, passed: false, error: e.message });
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  },

  assert: function(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
    return true;
  },

  assertEqual: function(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
    return true;
  },

  assertContains: function(array, item, message) {
    if (!array || !array.includes(item)) {
      throw new Error(message || `Array does not contain ${item}`);
    }
    return true;
  },

  getSummary: function() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`\n========== SUMMARY ==========`);
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
      console.log(`\nFailed tests:`);
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.suite}: ${r.test} - ${r.error}`);
      });
    }

    return { total, passed, failed, success: failed === 0 };
  },

  reset: function() {
    this.results = [];
    this.currentSuite = '';
  }
};

// ========================================
// PAKET STATE MACHINE TESTS
// ========================================

function testPaketStateMachine() {
  TestRunner.startSuite('Paket State Machine');

  // Test: Valid forward transition
  TestRunner.test('Valid forward: DRAFT -> PERENCANAAN', function() {
    const isValid = PaketStateMachine.isValidTransition('DRAFT', 'PERENCANAAN');
    return TestRunner.assert(isValid === true, 'DRAFT to PERENCANAAN should be valid');
  });

  // Test: Invalid forward transition (skipping)
  TestRunner.test('Invalid skip: DRAFT -> HPS blocked', function() {
    const isValid = PaketStateMachine.isValidTransition('DRAFT', 'HPS');
    return TestRunner.assert(isValid === false, 'DRAFT to HPS should be blocked');
  });

  // Test: Valid backward transition
  TestRunner.test('Valid backward: PERENCANAAN -> DRAFT', function() {
    const isValid = PaketStateMachine.isValidTransition('PERENCANAAN', 'DRAFT');
    return TestRunner.assert(isValid === true, 'PERENCANAAN to DRAFT should be valid');
  });

  // Test: Invalid backward transition (multiple steps)
  TestRunner.test('Invalid backward: HPS -> DRAFT blocked', function() {
    const isValid = PaketStateMachine.isValidTransition('HPS', 'DRAFT');
    return TestRunner.assert(isValid === false, 'HPS to DRAFT should be blocked');
  });

  // Test: Cancel allowed from early stages
  TestRunner.test('Cancel allowed: DRAFT -> BATAL', function() {
    const isValid = PaketStateMachine.isValidTransition('DRAFT', 'BATAL');
    return TestRunner.assert(isValid === true, 'DRAFT to BATAL should be valid');
  });

  // Test: Cancel blocked from late stages
  TestRunner.test('Cancel blocked: PELAKSANAAN -> BATAL', function() {
    const isValid = PaketStateMachine.isValidTransition('PELAKSANAAN', 'BATAL');
    return TestRunner.assert(isValid === false, 'PELAKSANAAN to BATAL should be blocked');
  });

  // Test: SELESAI is terminal
  TestRunner.test('Terminal: SELESAI has no transitions', function() {
    const isValid1 = PaketStateMachine.isValidTransition('SELESAI', 'PEMBAYARAN');
    const isValid2 = PaketStateMachine.isValidTransition('SELESAI', 'DRAFT');
    return TestRunner.assert(isValid1 === false && isValid2 === false, 'SELESAI should have no transitions');
  });

  // Test: Stage skipping detection
  TestRunner.test('Skip detection: DRAFT -> KONTRAK is skip', function() {
    const isSkip = PaketStateMachine.isSkippingStages('DRAFT', 'KONTRAK');
    return TestRunner.assert(isSkip === true, 'DRAFT to KONTRAK should be detected as skip');
  });

  // Test: Normal transition is not skip
  TestRunner.test('Skip detection: DRAFT -> PERENCANAAN is not skip', function() {
    const isSkip = PaketStateMachine.isSkippingStages('DRAFT', 'PERENCANAAN');
    return TestRunner.assert(isSkip === false, 'DRAFT to PERENCANAAN should not be skip');
  });

  // Test: Transition type detection
  TestRunner.test('Transition type: forward detected', function() {
    const type = PaketStateMachine.getTransitionType('DRAFT', 'PERENCANAAN');
    return TestRunner.assertEqual(type, 'FORWARD', 'Should be FORWARD');
  });

  TestRunner.test('Transition type: backward detected', function() {
    const type = PaketStateMachine.getTransitionType('PERENCANAAN', 'DRAFT');
    return TestRunner.assertEqual(type, 'BACKWARD', 'Should be BACKWARD');
  });

  TestRunner.test('Transition type: special detected', function() {
    const type = PaketStateMachine.getTransitionType('DRAFT', 'BATAL');
    return TestRunner.assertEqual(type, 'SPECIAL', 'Should be SPECIAL');
  });
}

// ========================================
// PD STATE MACHINE TESTS
// ========================================

function testPDStateMachine() {
  TestRunner.startSuite('PD State Machine');

  // Test: Luar Kota transitions include SPPD
  TestRunner.test('Luar Kota: SURAT_TUGAS -> SPPD valid', function() {
    const isValid = PDStateMachine.isValidTransition('SURAT_TUGAS', 'SPPD', JENIS_PD.LUAR_KOTA);
    return TestRunner.assert(isValid === true, 'SURAT_TUGAS to SPPD should be valid for Luar Kota');
  });

  // Test: Dalam Kota skips SPPD
  TestRunner.test('Dalam Kota: SURAT_TUGAS -> PELAKSANAAN valid (skip SPPD)', function() {
    const isValid = PDStateMachine.isValidTransition('SURAT_TUGAS', 'PELAKSANAAN', JENIS_PD.DALAM_KOTA);
    return TestRunner.assert(isValid === true, 'SURAT_TUGAS to PELAKSANAAN should be valid for Dalam Kota');
  });

  // Test: Dalam Kota cannot go to SPPD
  TestRunner.test('Dalam Kota: SURAT_TUGAS -> SPPD invalid', function() {
    const isValid = PDStateMachine.isValidTransition('SURAT_TUGAS', 'SPPD', JENIS_PD.DALAM_KOTA);
    return TestRunner.assert(isValid === false, 'SURAT_TUGAS to SPPD should be invalid for Dalam Kota');
  });

  // Test: State count differs by type
  TestRunner.test('State count: Luar Kota has more states', function() {
    const lkStates = PDStateMachine.getStates(JENIS_PD.LUAR_KOTA);
    const dkStates = PDStateMachine.getStates(JENIS_PD.DALAM_KOTA);
    return TestRunner.assert(lkStates.length > dkStates.length, 'Luar Kota should have more states');
  });
}

// ========================================
// COMPLIANCE VALIDATOR TESTS
// ========================================

function testComplianceValidator() {
  TestRunner.startSuite('Compliance Validator');

  // Test: Empty paket fails PERENCANAAN validation
  TestRunner.test('Validation: Empty paket fails PERENCANAAN', function() {
    const mockPaket = { paketId: 'TEST001', status: 'DRAFT' };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PERENCANAAN');
    return TestRunner.assert(result.hardStops.length > 0, 'Should have hard stops');
  });

  // Test: Paket with name passes basic validation
  TestRunner.test('Validation: Paket with name and jenis passes PERENCANAAN', function() {
    const mockPaket = {
      paketId: 'TEST002',
      status: 'DRAFT',
      namaPaket: 'Test Paket Pengadaan',
      jenisPengadaan: 'BARANG'
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PERENCANAAN');
    const namaError = result.hardStops.find(h => h.code === 'MISSING_NAMA_PAKET');
    return TestRunner.assert(namaError === undefined, 'Should not have nama paket error');
  });

  // Test: HPS exceeds Pagu is hard stop
  TestRunner.test('Budget: HPS > Pagu is hard stop', function() {
    const mockPaket = {
      paketId: 'TEST003',
      paguAnggaran: 100000000,
      nilaiHPS: 150000000,
      items: [{ itemId: 'I1', namaBarang: 'Test', volume: 1, satuan: 'unit' }]
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PENGADAAN');
    const budgetError = result.hardStops.find(h => h.code === 'HPS_EXCEEDS_PAGU');
    return TestRunner.assert(budgetError !== undefined, 'Should have HPS exceeds Pagu error');
  });

  // Test: Contract exceeds HPS is hard stop
  TestRunner.test('Budget: Contract > HPS is hard stop', function() {
    const mockPaket = {
      paketId: 'TEST004',
      nilaiHPS: 100000000,
      kontrak: { nilaiKontrak: 120000000, nomorKontrak: 'K001', tanggalKontrak: '2024-01-01' }
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PELAKSANAAN');
    const kontrakError = result.hardStops.find(h => h.code === 'KONTRAK_EXCEEDS_HPS');
    return TestRunner.assert(kontrakError !== undefined, 'Should have Contract exceeds HPS error');
  });

  // Test: Date logic - SPMK before kontrak is error
  TestRunner.test('Date: SPMK before kontrak is hard stop', function() {
    const mockPaket = {
      paketId: 'TEST005',
      kontrak: {
        nomorKontrak: 'K001',
        tanggalKontrak: '2024-06-01',
        tanggalMulai: '2024-05-01', // Before contract date
        nilaiKontrak: 50000000
      }
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PELAKSANAAN');
    const dateError = result.hardStops.find(h => h.code === 'INVALID_DATE_SPMK');
    return TestRunner.assert(dateError !== undefined, 'Should have invalid SPMK date error');
  });

  // Test: Missing BAST blocks payment
  TestRunner.test('Document: Missing BAST blocks PEMBAYARAN', function() {
    const mockPaket = {
      paketId: 'TEST006',
      serahTerima: [] // Empty
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PEMBAYARAN');
    const bastError = result.hardStops.find(h => h.code === 'NO_BAST');
    return TestRunner.assert(bastError !== undefined, 'Should have no BAST error');
  });
}

// ========================================
// PD COMPLIANCE TESTS
// ========================================

function testPDCompliance() {
  TestRunner.startSuite('PD Compliance');

  // Test: Missing pelaksana is hard stop
  TestRunner.test('PD: Missing pelaksana is hard stop', function() {
    const mockPD = { pdId: 'PD001', jenisPD: JENIS_PD.LUAR_KOTA, pelaksana: [] };
    const result = ComplianceValidator.validatePDForStage(mockPD, 'SURAT_TUGAS');
    const error = result.hardStops.find(h => h.code === 'NO_PELAKSANA');
    return TestRunner.assert(error !== undefined, 'Should have no pelaksana error');
  });

  // Test: Invalid date range is hard stop
  TestRunner.test('PD: tanggalKembali < tanggalBerangkat is hard stop', function() {
    const mockPD = {
      pdId: 'PD002',
      tanggalBerangkat: '2024-06-15',
      tanggalKembali: '2024-06-10', // Before berangkat
      pelaksana: [{ nama: 'Test', nip: '123' }],
      tujuan: 'Test'
    };
    const result = ComplianceValidator.validatePDForStage(mockPD, 'SURAT_TUGAS');
    const dateError = result.hardStops.find(h => h.code === 'INVALID_DATE_RANGE');
    return TestRunner.assert(dateError !== undefined, 'Should have invalid date range error');
  });

  // Test: Luar Kota requires SPPD for execution
  TestRunner.test('PD Luar Kota: Missing SPPD blocks PELAKSANAAN', function() {
    const mockPD = {
      pdId: 'PD003',
      jenisPD: JENIS_PD.LUAR_KOTA,
      nomorSPPD: '' // Empty
    };
    const result = ComplianceValidator.validatePDForStage(mockPD, 'PELAKSANAAN');
    const sppdError = result.hardStops.find(h => h.code === 'NO_NOMOR_SPPD');
    return TestRunner.assert(sppdError !== undefined, 'Should have no SPPD error for Luar Kota');
  });
}

// ========================================
// INTEGRATION TESTS
// ========================================

function testWorkflowIntegration() {
  TestRunner.startSuite('Workflow Integration');

  // Test: Full transition with validation
  TestRunner.test('Integration: Transition with incomplete paket blocked', function() {
    const mockPaket = { paketId: 'INT001', status: 'DRAFT' }; // Missing required fields
    const result = PaketStateMachine.transition(mockPaket, 'PERENCANAAN');
    return TestRunner.assert(result.allowed === false, 'Transition should be blocked');
  });

  // Test: Full transition with complete paket allowed
  TestRunner.test('Integration: Transition with complete paket allowed', function() {
    const mockPaket = {
      paketId: 'INT002',
      status: 'DRAFT',
      namaPaket: 'Complete Test Paket',
      jenisPengadaan: 'BARANG',
      metodePengadaan: 'PENGADAAN_LANGSUNG',
      paguAnggaran: 50000000
    };
    const result = PaketStateMachine.transition(mockPaket, 'PERENCANAAN');
    return TestRunner.assert(result.allowed === true, 'Transition should be allowed');
  });
}

// ========================================
// VIOLATION SCENARIOS
// ========================================

function testViolationScenarios() {
  TestRunner.startSuite('Violation Scenarios');

  // Scenario 1: Skip from DRAFT to KONTRAK
  TestRunner.test('Violation: Cannot skip DRAFT to KONTRAK', function() {
    const mockPaket = { paketId: 'V001', status: 'DRAFT' };
    const result = PaketStateMachine.transition(mockPaket, 'KONTRAK');
    const skipError = result.hardStops.find(h =>
      h.code === 'INVALID_TRANSITION' || h.code === 'STAGE_SKIP_BLOCKED'
    );
    return TestRunner.assert(skipError !== undefined, 'Should block stage skip');
  });

  // Scenario 2: Budget violation chain
  TestRunner.test('Violation: Budget chain - Pagu < HPS < Kontrak all fail', function() {
    const mockPaket = {
      paketId: 'V002',
      paguAnggaran: 100000000,
      nilaiHPS: 150000000, // Exceeds pagu
      kontrak: { nilaiKontrak: 180000000 } // Exceeds HPS
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'PENGADAAN');
    return TestRunner.assert(result.hardStops.length >= 1, 'Should have budget violations');
  });

  // Scenario 3: Payment before BAST
  TestRunner.test('Violation: Payment without BAST blocked', function() {
    const mockPaket = {
      paketId: 'V003',
      status: 'SERAH_TERIMA',
      serahTerima: [],
      kontrak: { nilaiKontrak: 50000000 }
    };
    const result = PaketStateMachine.transition(mockPaket, 'PEMBAYARAN');
    return TestRunner.assert(result.allowed === false, 'Should block payment without BAST');
  });

  // Scenario 4: Incomplete payment blocks completion
  TestRunner.test('Violation: Incomplete payment blocks SELESAI', function() {
    const mockPaket = {
      paketId: 'V004',
      status: 'PEMBAYARAN',
      nilaiKontrak: 100000000,
      kontrak: { nilaiKontrak: 100000000 },
      pembayaran: [{ status: 'PAID', nilaiNetto: 50000000 }], // Only 50%
      serahTerima: [{ nomorBA: 'BA001', tanggalBA: '2024-01-01' }]
    };
    const result = ComplianceValidator.validatePaketForStage(mockPaket, 'SELESAI');
    const paymentError = result.hardStops.find(h => h.code === 'PAYMENT_INCOMPLETE');
    return TestRunner.assert(paymentError !== undefined, 'Should have incomplete payment error');
  });

  // Scenario 5: Cancel blocked after execution started
  TestRunner.test('Violation: Cancel blocked after PELAKSANAAN', function() {
    const mockPaket = { paketId: 'V005', status: 'PELAKSANAAN' };
    const result = PaketStateMachine.transition(mockPaket, 'BATAL');
    return TestRunner.assert(result.allowed === false, 'Should block cancel after execution');
  });
}

// ========================================
// MAIN TEST RUNNER
// ========================================

function runAllWorkflowTests() {
  console.log('🧪 Running Workflow & Compliance Tests...');
  console.log('=========================================\n');

  TestRunner.reset();

  // Run all test suites
  testPaketStateMachine();
  testPDStateMachine();
  testComplianceValidator();
  testPDCompliance();
  testWorkflowIntegration();
  testViolationScenarios();

  // Get summary
  const summary = TestRunner.getSummary();

  console.log('\n=========================================');
  console.log(summary.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('=========================================');

  return summary;
}

// ========================================
// EXAMPLE VIOLATION SCENARIOS (Documentation)
// ========================================

/**
 * VIOLATION SCENARIOS DOCUMENTATION
 *
 * 1. STAGE SKIP VIOLATION
 *    - Attempt: DRAFT -> KONTRAK (skipping 5 stages)
 *    - Error Code: STAGE_SKIP_BLOCKED
 *    - Severity: HARD_STOP
 *    - Message: "Tidak dapat melompati tahapan workflow"
 *
 * 2. BUDGET VIOLATION: HPS > PAGU
 *    - Attempt: Move to PENGADAAN with HPS exceeding Pagu
 *    - Error Code: HPS_EXCEEDS_PAGU
 *    - Severity: HARD_STOP
 *    - Message: "Nilai HPS melebihi Pagu Anggaran"
 *
 * 3. BUDGET VIOLATION: KONTRAK > HPS
 *    - Attempt: Move to PELAKSANAAN with Contract exceeding HPS
 *    - Error Code: KONTRAK_EXCEEDS_HPS
 *    - Severity: HARD_STOP
 *    - Message: "Nilai kontrak melebihi HPS"
 *
 * 4. DATE VIOLATION: SPMK BEFORE CONTRACT
 *    - Attempt: Tanggal mulai before tanggal kontrak
 *    - Error Code: INVALID_DATE_SPMK
 *    - Severity: HARD_STOP
 *    - Message: "Tanggal mulai kerja tidak boleh sebelum tanggal kontrak"
 *
 * 5. DATE VIOLATION: BAST BEFORE EXECUTION
 *    - Attempt: BAST date before contract start date
 *    - Error Code: BAST_BEFORE_EXECUTION
 *    - Severity: HARD_STOP
 *    - Message: "Tanggal BAST tidak boleh sebelum tanggal mulai pelaksanaan"
 *
 * 6. DOCUMENT VIOLATION: MISSING BAST FOR PAYMENT
 *    - Attempt: Move to PEMBAYARAN without BAST
 *    - Error Code: NO_BAST
 *    - Severity: HARD_STOP
 *    - Message: "Berita Acara Serah Terima harus sudah dibuat sebelum pembayaran"
 *
 * 7. PAYMENT VIOLATION: INCOMPLETE PAYMENT
 *    - Attempt: Move to SELESAI with <95% payment
 *    - Error Code: PAYMENT_INCOMPLETE
 *    - Severity: HARD_STOP
 *    - Message: "Pembayaran belum lunas (X% dari nilai kontrak)"
 *
 * 8. CANCEL VIOLATION: LATE CANCELLATION
 *    - Attempt: Cancel after PELAKSANAAN started
 *    - Error Code: INVALID_TRANSITION
 *    - Severity: HARD_STOP
 *    - Message: "Tidak dapat berpindah dari PELAKSANAAN ke BATAL"
 *
 * 9. PD DATE VIOLATION: INVALID RANGE
 *    - Attempt: tanggalKembali < tanggalBerangkat
 *    - Error Code: INVALID_DATE_RANGE
 *    - Severity: HARD_STOP
 *    - Message: "Tanggal kembali tidak boleh sebelum tanggal berangkat"
 *
 * 10. PD SPPD VIOLATION: MISSING FOR LUAR KOTA
 *     - Attempt: Execute Luar Kota PD without SPPD
 *     - Error Code: NO_NOMOR_SPPD
 *     - Severity: HARD_STOP
 *     - Message: "Nomor SPPD wajib diisi untuk perjalanan luar kota"
 */

function getViolationDocumentation() {
  return {
    title: 'Workflow Violation Scenarios',
    scenarios: [
      {
        id: 1,
        name: 'Stage Skip Violation',
        example: 'DRAFT -> KONTRAK',
        errorCode: 'STAGE_SKIP_BLOCKED',
        severity: 'HARD_STOP',
        message: 'Tidak dapat melompati tahapan workflow'
      },
      {
        id: 2,
        name: 'HPS Exceeds Pagu',
        example: 'HPS: 150jt, Pagu: 100jt',
        errorCode: 'HPS_EXCEEDS_PAGU',
        severity: 'HARD_STOP',
        message: 'Nilai HPS melebihi Pagu Anggaran'
      },
      {
        id: 3,
        name: 'Contract Exceeds HPS',
        example: 'Kontrak: 120jt, HPS: 100jt',
        errorCode: 'KONTRAK_EXCEEDS_HPS',
        severity: 'HARD_STOP',
        message: 'Nilai kontrak melebihi HPS'
      },
      {
        id: 4,
        name: 'SPMK Before Contract',
        example: 'Mulai: 2024-05-01, Kontrak: 2024-06-01',
        errorCode: 'INVALID_DATE_SPMK',
        severity: 'HARD_STOP',
        message: 'Tanggal mulai kerja tidak boleh sebelum tanggal kontrak'
      },
      {
        id: 5,
        name: 'BAST Before Execution',
        example: 'BAST: 2024-05-01, Mulai: 2024-06-01',
        errorCode: 'BAST_BEFORE_EXECUTION',
        severity: 'HARD_STOP',
        message: 'Tanggal BAST tidak boleh sebelum tanggal mulai pelaksanaan'
      },
      {
        id: 6,
        name: 'Missing BAST for Payment',
        example: 'Move to PEMBAYARAN without BAST',
        errorCode: 'NO_BAST',
        severity: 'HARD_STOP',
        message: 'BAST harus sudah dibuat sebelum pembayaran'
      },
      {
        id: 7,
        name: 'Incomplete Payment',
        example: 'Only 50% paid, moving to SELESAI',
        errorCode: 'PAYMENT_INCOMPLETE',
        severity: 'HARD_STOP',
        message: 'Pembayaran belum lunas'
      },
      {
        id: 8,
        name: 'Late Cancellation',
        example: 'Cancel from PELAKSANAAN',
        errorCode: 'INVALID_TRANSITION',
        severity: 'HARD_STOP',
        message: 'Tidak dapat dibatalkan setelah pelaksanaan dimulai'
      },
      {
        id: 9,
        name: 'PD Invalid Date Range',
        example: 'Kembali: 10 Jun, Berangkat: 15 Jun',
        errorCode: 'INVALID_DATE_RANGE',
        severity: 'HARD_STOP',
        message: 'Tanggal kembali tidak boleh sebelum tanggal berangkat'
      },
      {
        id: 10,
        name: 'PD Missing SPPD',
        example: 'Luar Kota without SPPD',
        errorCode: 'NO_NOMOR_SPPD',
        severity: 'HARD_STOP',
        message: 'Nomor SPPD wajib diisi untuk perjalanan luar kota'
      }
    ]
  };
}

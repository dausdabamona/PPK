/**
 * 20_StateMachine.gs
 * Strict State Machine for Paket and Perjalanan Dinas
 * Sprint 2: Workflow Engine & Compliance Validation
 *
 * This module enforces STRICT state transitions with NO exceptions.
 * All transitions MUST go through this module.
 */

// ========================================
// VALIDATION SEVERITY LEVELS
// ========================================

const VALIDATION_SEVERITY = {
  HARD_STOP: 'HARD_STOP',     // Blocks transition completely
  WARNING: 'WARNING',          // Allows transition but flags issue
  INFO: 'INFO'                 // Informational only
};

// ========================================
// PAKET STATE MACHINE
// ========================================

const PaketStateMachine = {

  // Valid states in order
  STATES: [
    'DRAFT',
    'PERENCANAAN',
    'SURVEY_HARGA',
    'HPS',
    'PENGADAAN',
    'KONTRAK',
    'PELAKSANAAN',
    'SERAH_TERIMA',
    'PEMBAYARAN',
    'SELESAI',
    'BATAL'
  ],

  // State machine definition with strict transitions
  TRANSITIONS: {
    DRAFT: {
      forward: ['PERENCANAAN'],
      backward: [],
      special: ['BATAL']
    },
    PERENCANAAN: {
      forward: ['SURVEY_HARGA'],
      backward: ['DRAFT'],
      special: ['BATAL']
    },
    SURVEY_HARGA: {
      forward: ['HPS'],
      backward: ['PERENCANAAN'],
      special: ['BATAL']
    },
    HPS: {
      forward: ['PENGADAAN'],
      backward: ['SURVEY_HARGA'],
      special: ['BATAL']
    },
    PENGADAAN: {
      forward: ['KONTRAK'],
      backward: ['HPS'],
      special: ['BATAL']
    },
    KONTRAK: {
      forward: ['PELAKSANAAN'],
      backward: ['PENGADAAN'],
      special: ['BATAL']
    },
    PELAKSANAAN: {
      forward: ['SERAH_TERIMA'],
      backward: ['KONTRAK'],
      special: []  // Cannot cancel once execution started
    },
    SERAH_TERIMA: {
      forward: ['PEMBAYARAN'],
      backward: ['PELAKSANAAN'],
      special: []
    },
    PEMBAYARAN: {
      forward: ['SELESAI'],
      backward: ['SERAH_TERIMA'],
      special: []
    },
    SELESAI: {
      forward: [],
      backward: [],  // Cannot revert from completed
      special: []
    },
    BATAL: {
      forward: [],
      backward: [],
      special: []
    }
  },

  // Get current state index
  getStateIndex: function(state) {
    return this.STATES.indexOf(state);
  },

  // Check if transition is valid
  isValidTransition: function(currentState, targetState) {
    const transition = this.TRANSITIONS[currentState];
    if (!transition) return false;

    const allAllowed = [
      ...transition.forward,
      ...transition.backward,
      ...transition.special
    ];

    return allAllowed.includes(targetState);
  },

  // Check if trying to skip stages
  isSkippingStages: function(currentState, targetState) {
    const currentIndex = this.getStateIndex(currentState);
    const targetIndex = this.getStateIndex(targetState);

    // Ignore special states (BATAL)
    if (targetState === 'BATAL') return false;

    // Check if skipping more than 1 step forward
    if (targetIndex > currentIndex + 1) {
      return true;
    }

    return false;
  },

  // Get transition type
  getTransitionType: function(currentState, targetState) {
    const transition = this.TRANSITIONS[currentState];
    if (!transition) return null;

    if (transition.forward.includes(targetState)) return 'FORWARD';
    if (transition.backward.includes(targetState)) return 'BACKWARD';
    if (transition.special.includes(targetState)) return 'SPECIAL';

    return null;
  },

  // Attempt state transition with full validation
  transition: function(paket, targetState, options = {}) {
    const currentState = paket.status || 'DRAFT';
    const results = {
      allowed: false,
      transitionType: null,
      validations: [],
      hardStops: [],
      warnings: []
    };

    // Check 1: Is target state valid?
    if (!this.STATES.includes(targetState)) {
      results.hardStops.push({
        code: 'INVALID_STATE',
        message: `Status "${targetState}" tidak valid`,
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return results;
    }

    // Check 2: Is transition allowed?
    if (!this.isValidTransition(currentState, targetState)) {
      results.hardStops.push({
        code: 'INVALID_TRANSITION',
        message: `Tidak dapat berpindah dari ${currentState} ke ${targetState}`,
        severity: VALIDATION_SEVERITY.HARD_STOP,
        details: {
          currentState: currentState,
          targetState: targetState,
          allowedFrom: this.TRANSITIONS[currentState]
        }
      });
      return results;
    }

    // Check 3: Is trying to skip stages?
    if (this.isSkippingStages(currentState, targetState)) {
      results.hardStops.push({
        code: 'STAGE_SKIP_BLOCKED',
        message: 'Tidak dapat melompati tahapan workflow',
        severity: VALIDATION_SEVERITY.HARD_STOP,
        details: {
          currentState: currentState,
          targetState: targetState,
          message: 'Tahapan harus dijalankan secara berurutan'
        }
      });
      return results;
    }

    results.transitionType = this.getTransitionType(currentState, targetState);

    // Run compliance validations for forward transitions
    if (results.transitionType === 'FORWARD') {
      const complianceResults = ComplianceValidator.validatePaketForStage(paket, targetState);
      results.validations = complianceResults.validations;
      results.hardStops.push(...complianceResults.hardStops);
      results.warnings.push(...complianceResults.warnings);
    }

    // Run backward transition validations
    if (results.transitionType === 'BACKWARD' && !options.force) {
      results.warnings.push({
        code: 'BACKWARD_TRANSITION',
        message: `Kembali ke status ${targetState} akan menghapus progress`,
        severity: VALIDATION_SEVERITY.WARNING
      });
    }

    // Final decision
    results.allowed = results.hardStops.length === 0;

    return results;
  },

  // Execute transition (actually change state)
  executeTransition: function(paketId, targetState, options = {}) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return {
        success: false,
        error: 'Paket tidak ditemukan',
        errorType: 'NOT_FOUND'
      };
    }

    const validationResult = this.transition(paket, targetState, options);

    if (!validationResult.allowed) {
      return {
        success: false,
        error: 'Transisi ditolak',
        errorType: 'TRANSITION_BLOCKED',
        hardStops: validationResult.hardStops,
        warnings: validationResult.warnings
      };
    }

    // Execute the transition
    const currentIndex = this.getStateIndex(paket.status);
    const targetIndex = this.getStateIndex(targetState);
    const progress = targetState === 'BATAL' ? 0 :
      Math.round(((targetIndex + 1) / (this.STATES.length - 1)) * 100);

    PaketService.update(paketId, {
      status: targetState,
      progress: progress
    });

    // Log transition
    console.log(`[WORKFLOW] Paket ${paketId}: ${paket.status} -> ${targetState}`);

    return {
      success: true,
      data: {
        previousState: paket.status,
        currentState: targetState,
        transitionType: validationResult.transitionType,
        progress: progress,
        warnings: validationResult.warnings
      }
    };
  }
};

// ========================================
// PERJALANAN DINAS STATE MACHINE
// ========================================

const PDStateMachine = {

  // States for Luar Kota
  STATES_LUAR_KOTA: [
    'DRAFT',
    'SURAT_TUGAS',
    'SPPD',
    'PELAKSANAAN',
    'PELAPORAN',
    'PERTANGGUNGJAWABAN',
    'SELESAI',
    'BATAL'
  ],

  // States for Dalam Kota
  STATES_DALAM_KOTA: [
    'DRAFT',
    'SURAT_TUGAS',
    'PELAKSANAAN',
    'SELESAI',
    'BATAL'
  ],

  // Transitions for Luar Kota
  TRANSITIONS_LUAR_KOTA: {
    DRAFT: {
      forward: ['SURAT_TUGAS'],
      backward: [],
      special: ['BATAL']
    },
    SURAT_TUGAS: {
      forward: ['SPPD'],
      backward: ['DRAFT'],
      special: ['BATAL']
    },
    SPPD: {
      forward: ['PELAKSANAAN'],
      backward: ['SURAT_TUGAS'],
      special: ['BATAL']
    },
    PELAKSANAAN: {
      forward: ['PELAPORAN'],
      backward: ['SPPD'],
      special: []
    },
    PELAPORAN: {
      forward: ['PERTANGGUNGJAWABAN'],
      backward: ['PELAKSANAAN'],
      special: []
    },
    PERTANGGUNGJAWABAN: {
      forward: ['SELESAI'],
      backward: ['PELAPORAN'],
      special: []
    },
    SELESAI: {
      forward: [],
      backward: [],
      special: []
    },
    BATAL: {
      forward: [],
      backward: [],
      special: []
    }
  },

  // Transitions for Dalam Kota
  TRANSITIONS_DALAM_KOTA: {
    DRAFT: {
      forward: ['SURAT_TUGAS'],
      backward: [],
      special: ['BATAL']
    },
    SURAT_TUGAS: {
      forward: ['PELAKSANAAN'],
      backward: ['DRAFT'],
      special: ['BATAL']
    },
    PELAKSANAAN: {
      forward: ['SELESAI'],
      backward: ['SURAT_TUGAS'],
      special: []
    },
    SELESAI: {
      forward: [],
      backward: [],
      special: []
    },
    BATAL: {
      forward: [],
      backward: [],
      special: []
    }
  },

  // Get states based on PD type
  getStates: function(jenisPD) {
    return jenisPD === JENIS_PD.DALAM_KOTA
      ? this.STATES_DALAM_KOTA
      : this.STATES_LUAR_KOTA;
  },

  // Get transitions based on PD type
  getTransitions: function(jenisPD) {
    return jenisPD === JENIS_PD.DALAM_KOTA
      ? this.TRANSITIONS_DALAM_KOTA
      : this.TRANSITIONS_LUAR_KOTA;
  },

  // Get current state index
  getStateIndex: function(state, jenisPD) {
    const states = this.getStates(jenisPD);
    return states.indexOf(state);
  },

  // Check if transition is valid
  isValidTransition: function(currentState, targetState, jenisPD) {
    const transitions = this.getTransitions(jenisPD);
    const transition = transitions[currentState];
    if (!transition) return false;

    const allAllowed = [
      ...transition.forward,
      ...transition.backward,
      ...transition.special
    ];

    return allAllowed.includes(targetState);
  },

  // Check if trying to skip stages
  isSkippingStages: function(currentState, targetState, jenisPD) {
    const states = this.getStates(jenisPD);
    const currentIndex = states.indexOf(currentState);
    const targetIndex = states.indexOf(targetState);

    if (targetState === 'BATAL') return false;

    return targetIndex > currentIndex + 1;
  },

  // Get transition type
  getTransitionType: function(currentState, targetState, jenisPD) {
    const transitions = this.getTransitions(jenisPD);
    const transition = transitions[currentState];
    if (!transition) return null;

    if (transition.forward.includes(targetState)) return 'FORWARD';
    if (transition.backward.includes(targetState)) return 'BACKWARD';
    if (transition.special.includes(targetState)) return 'SPECIAL';

    return null;
  },

  // Attempt state transition with full validation
  transition: function(pd, targetState, options = {}) {
    const currentState = pd.status || 'DRAFT';
    const jenisPD = pd.jenisPD || JENIS_PD.LUAR_KOTA;
    const states = this.getStates(jenisPD);

    const results = {
      allowed: false,
      transitionType: null,
      validations: [],
      hardStops: [],
      warnings: []
    };

    // Check 1: Is target state valid?
    if (!states.includes(targetState)) {
      results.hardStops.push({
        code: 'INVALID_STATE',
        message: `Status "${targetState}" tidak valid untuk ${JENIS_PD_LABELS[jenisPD]}`,
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return results;
    }

    // Check 2: Is transition allowed?
    if (!this.isValidTransition(currentState, targetState, jenisPD)) {
      results.hardStops.push({
        code: 'INVALID_TRANSITION',
        message: `Tidak dapat berpindah dari ${currentState} ke ${targetState}`,
        severity: VALIDATION_SEVERITY.HARD_STOP,
        details: {
          currentState: currentState,
          targetState: targetState,
          jenisPD: jenisPD
        }
      });
      return results;
    }

    // Check 3: Is trying to skip stages?
    if (this.isSkippingStages(currentState, targetState, jenisPD)) {
      results.hardStops.push({
        code: 'STAGE_SKIP_BLOCKED',
        message: 'Tidak dapat melompati tahapan workflow',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return results;
    }

    results.transitionType = this.getTransitionType(currentState, targetState, jenisPD);

    // Run compliance validations for forward transitions
    if (results.transitionType === 'FORWARD') {
      const complianceResults = ComplianceValidator.validatePDForStage(pd, targetState);
      results.validations = complianceResults.validations;
      results.hardStops.push(...complianceResults.hardStops);
      results.warnings.push(...complianceResults.warnings);
    }

    // Final decision
    results.allowed = results.hardStops.length === 0;

    return results;
  },

  // Execute transition
  executeTransition: function(pdId, targetState, options = {}) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) {
      return {
        success: false,
        error: 'Perjalanan dinas tidak ditemukan',
        errorType: 'NOT_FOUND'
      };
    }

    const validationResult = this.transition(pd, targetState, options);

    if (!validationResult.allowed) {
      return {
        success: false,
        error: 'Transisi ditolak',
        errorType: 'TRANSITION_BLOCKED',
        hardStops: validationResult.hardStops,
        warnings: validationResult.warnings
      };
    }

    // Execute the transition
    const states = this.getStates(pd.jenisPD);
    const targetIndex = states.indexOf(targetState);
    const progress = targetState === 'BATAL' ? 0 :
      Math.round(((targetIndex + 1) / (states.length - 1)) * 100);

    PerjalananDinasService.updateStatus(pdId, targetState);

    console.log(`[WORKFLOW] PD ${pdId}: ${pd.status} -> ${targetState}`);

    return {
      success: true,
      data: {
        previousState: pd.status,
        currentState: targetState,
        transitionType: validationResult.transitionType,
        progress: progress,
        warnings: validationResult.warnings
      }
    };
  }
};

// ========================================
// ENHANCED WORKFLOW SERVICE (Replaces old)
// ========================================

const EnhancedWorkflowService = {

  // ==================== PAKET WORKFLOW ====================

  getPaketStatus: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) return null;

    const currentState = paket.status || 'DRAFT';
    const currentIndex = PaketStateMachine.getStateIndex(currentState);
    const transitions = PaketStateMachine.TRANSITIONS[currentState];

    return {
      paketId: paketId,
      currentState: currentState,
      currentStateLabel: PAKET_STATUS_LABELS[currentState],
      progress: paket.progress || Math.round(((currentIndex + 1) / PaketStateMachine.STATES.length) * 100),
      canAdvance: transitions?.forward?.length > 0,
      canRevert: transitions?.backward?.length > 0,
      canCancel: transitions?.special?.includes('BATAL'),
      nextState: transitions?.forward?.[0] || null,
      nextStateLabel: transitions?.forward?.[0] ? PAKET_STATUS_LABELS[transitions.forward[0]] : null,
      previousState: transitions?.backward?.[0] || null,
      previousStateLabel: transitions?.backward?.[0] ? PAKET_STATUS_LABELS[transitions.backward[0]] : null,
      allStates: PaketStateMachine.STATES.filter(s => s !== 'BATAL').map((state, idx) => ({
        state: state,
        label: PAKET_STATUS_LABELS[state],
        order: idx + 1,
        isCompleted: idx < currentIndex,
        isCurrent: state === currentState,
        isPending: idx > currentIndex
      }))
    };
  },

  advancePaket: function(paketId, options = {}) {
    const status = this.getPaketStatus(paketId);
    if (!status) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    if (!status.nextState) {
      return { success: false, error: 'Sudah di tahap terakhir' };
    }

    return PaketStateMachine.executeTransition(paketId, status.nextState, options);
  },

  revertPaket: function(paketId, options = {}) {
    const status = this.getPaketStatus(paketId);
    if (!status) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    if (!status.previousState) {
      return { success: false, error: 'Sudah di tahap pertama atau tidak dapat dikembalikan' };
    }

    return PaketStateMachine.executeTransition(paketId, status.previousState, { ...options, force: true });
  },

  cancelPaket: function(paketId, reason) {
    const status = this.getPaketStatus(paketId);
    if (!status) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    if (!status.canCancel) {
      return { success: false, error: 'Paket tidak dapat dibatalkan pada tahap ini' };
    }

    const result = PaketStateMachine.executeTransition(paketId, 'BATAL');

    if (result.success && reason) {
      PaketService.update(paketId, {
        keterangan: `Dibatalkan: ${reason} (${getTimestamp()})`
      });
    }

    return result;
  },

  // ==================== PD WORKFLOW ====================

  getPDStatus: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) return null;

    const jenisPD = pd.jenisPD || JENIS_PD.LUAR_KOTA;
    const states = PDStateMachine.getStates(jenisPD);
    const currentState = pd.status || 'DRAFT';
    const currentIndex = states.indexOf(currentState);
    const transitions = PDStateMachine.getTransitions(jenisPD)[currentState];

    return {
      pdId: pdId,
      jenisPD: jenisPD,
      jenisPDLabel: JENIS_PD_LABELS[jenisPD],
      currentState: currentState,
      currentStateLabel: PD_STATUS_LABELS[currentState],
      progress: Math.round(((currentIndex + 1) / states.length) * 100),
      canAdvance: transitions?.forward?.length > 0,
      canRevert: transitions?.backward?.length > 0,
      canCancel: transitions?.special?.includes('BATAL'),
      nextState: transitions?.forward?.[0] || null,
      nextStateLabel: transitions?.forward?.[0] ? PD_STATUS_LABELS[transitions.forward[0]] : null,
      previousState: transitions?.backward?.[0] || null,
      previousStateLabel: transitions?.backward?.[0] ? PD_STATUS_LABELS[transitions.backward[0]] : null,
      allStates: states.filter(s => s !== 'BATAL').map((state, idx) => ({
        state: state,
        label: PD_STATUS_LABELS[state],
        order: idx + 1,
        isCompleted: idx < currentIndex,
        isCurrent: state === currentState,
        isPending: idx > currentIndex
      }))
    };
  },

  advancePD: function(pdId, options = {}) {
    const status = this.getPDStatus(pdId);
    if (!status) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    if (!status.nextState) {
      return { success: false, error: 'Sudah di tahap terakhir' };
    }

    return PDStateMachine.executeTransition(pdId, status.nextState, options);
  },

  revertPD: function(pdId, options = {}) {
    const status = this.getPDStatus(pdId);
    if (!status) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    if (!status.previousState) {
      return { success: false, error: 'Sudah di tahap pertama' };
    }

    return PDStateMachine.executeTransition(pdId, status.previousState, { ...options, force: true });
  },

  cancelPD: function(pdId, reason) {
    const status = this.getPDStatus(pdId);
    if (!status) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    if (!status.canCancel) {
      return { success: false, error: 'Perjalanan dinas tidak dapat dibatalkan pada tahap ini' };
    }

    return PDStateMachine.executeTransition(pdId, 'BATAL');
  },

  // ==================== VALIDATION PREVIEW ====================

  previewPaketTransition: function(paketId, targetState) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    return {
      success: true,
      data: PaketStateMachine.transition(paket, targetState)
    };
  },

  previewPDTransition: function(pdId, targetState) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    return {
      success: true,
      data: PDStateMachine.transition(pd, targetState)
    };
  }
};

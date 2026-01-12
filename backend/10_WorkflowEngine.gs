/**
 * 10_WorkflowEngine.gs
 * Workflow Service for Paket Pengadaan
 */

const WorkflowService = {

  // ==================== PAKET WORKFLOW STAGES ====================
  getPaketStages: function() {
    return [
      { stage: 'DRAFT', label: 'Draft', order: 1 },
      { stage: 'PERENCANAAN', label: 'Perencanaan', order: 2 },
      { stage: 'SURVEY_HARGA', label: 'Survey Harga', order: 3 },
      { stage: 'HPS', label: 'Penyusunan HPS', order: 4 },
      { stage: 'PENGADAAN', label: 'Proses Pengadaan', order: 5 },
      { stage: 'KONTRAK', label: 'Kontrak', order: 6 },
      { stage: 'PELAKSANAAN', label: 'Pelaksanaan', order: 7 },
      { stage: 'SERAH_TERIMA', label: 'Serah Terima', order: 8 },
      { stage: 'PEMBAYARAN', label: 'Pembayaran', order: 9 },
      { stage: 'SELESAI', label: 'Selesai', order: 10 }
    ];
  },

  // ==================== GET PAKET STATUS ====================
  getPaketStatus: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) return null;

    const stages = this.getPaketStages();
    const currentStage = stages.find(s => s.stage === paket.status);
    const currentIndex = stages.findIndex(s => s.stage === paket.status);
    const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
    const prevStage = currentIndex > 0 ? stages[currentIndex - 1] : null;

    // Get requirements for next stage
    const requirements = this.getRequirements(paket, nextStage?.stage);

    return {
      paketId: paketId,
      currentStage: currentStage?.stage,
      currentStageLabel: currentStage?.label,
      nextStage: nextStage?.stage,
      nextStageLabel: nextStage?.label,
      prevStage: prevStage?.stage,
      prevStageLabel: prevStage?.label,
      progress: Math.round(((currentIndex + 1) / stages.length) * 100),
      stages: stages.map(s => ({
        ...s,
        isCompleted: s.order < (currentStage?.order || 1),
        isCurrent: s.stage === paket.status
      })),
      requirements: requirements,
      canAdvance: requirements.isValid
    };
  },

  // ==================== ADVANCE PAKET ====================
  advancePaket: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const stages = this.getPaketStages();
    const currentIndex = stages.findIndex(s => s.stage === paket.status);

    if (currentIndex >= stages.length - 1) {
      return { success: false, error: 'Sudah di tahap terakhir' };
    }

    const nextStage = stages[currentIndex + 1].stage;

    // Validate requirements
    const requirements = this.getRequirements(paket, nextStage);
    if (!requirements.isValid) {
      return {
        success: false,
        error: 'Persyaratan belum terpenuhi: ' + requirements.missing.join(', ')
      };
    }

    // Update status
    PaketService.update(paketId, {
      status: nextStage,
      progress: Math.round(((currentIndex + 2) / stages.length) * 100)
    });

    return { success: true, data: this.getPaketStatus(paketId) };
  },

  // ==================== REVERT PAKET ====================
  revertPaket: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const stages = this.getPaketStages();
    const currentIndex = stages.findIndex(s => s.stage === paket.status);

    if (currentIndex <= 0) {
      return { success: false, error: 'Sudah di tahap pertama' };
    }

    const prevStage = stages[currentIndex - 1].stage;

    PaketService.update(paketId, {
      status: prevStage,
      progress: Math.round((currentIndex / stages.length) * 100)
    });

    return { success: true, data: this.getPaketStatus(paketId) };
  },

  // ==================== GET REQUIREMENTS ====================
  getRequirements: function(paket, targetStage) {
    const missing = [];
    let isValid = true;

    switch (targetStage) {
      case 'PERENCANAAN':
        if (!paket.namaPaket) {
          missing.push('Nama Paket');
          isValid = false;
        }
        break;

      case 'SURVEY_HARGA':
        if (!paket.items || paket.items.length === 0) {
          missing.push('Minimal 1 item barang/jasa');
          isValid = false;
        }
        break;

      case 'HPS':
        const surveyStatus = SurveyService.getSummaryForPaket(paket.paketId);
        if (!surveyStatus.isComplete) {
          missing.push('Semua item harus memiliki survey harga yang dipilih');
          isValid = false;
        }
        break;

      case 'PENGADAAN':
        if (!paket.nilaiHPS || paket.nilaiHPS <= 0) {
          missing.push('HPS harus sudah dihitung');
          isValid = false;
        }
        break;

      case 'KONTRAK':
        if (!paket.penyediaId && !paket.namaPenyedia) {
          missing.push('Penyedia harus sudah dipilih');
          isValid = false;
        }
        break;

      case 'PELAKSANAAN':
        const kontrak = PaketService.getKontrak(paket.paketId);
        if (!kontrak || !kontrak.nomorKontrak) {
          missing.push('Kontrak harus sudah dibuat');
          isValid = false;
        }
        break;

      case 'SERAH_TERIMA':
        // Check if there's any work progress
        break;

      case 'PEMBAYARAN':
        const serahTerima = PaketService.getSerahTerima(paket.paketId);
        if (!serahTerima || serahTerima.length === 0) {
          missing.push('Berita Acara Serah Terima harus sudah dibuat');
          isValid = false;
        }
        break;

      case 'SELESAI':
        const pembayaran = PaketService.getPembayaran(paket.paketId);
        const paidAmount = pembayaran
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + (p.nilaiNetto || 0), 0);

        const kontrakValue = paket.nilaiKontrak || 0;
        if (kontrakValue > 0 && paidAmount < kontrakValue * 0.95) {
          missing.push('Pembayaran belum lunas');
          isValid = false;
        }
        break;
    }

    return { isValid, missing };
  },

  // ==================== GET AVAILABLE ACTIONS ====================
  getAvailableActions: function(paketId) {
    const status = this.getPaketStatus(paketId);
    if (!status) return [];

    const actions = [];

    // Common actions based on stage
    switch (status.currentStage) {
      case 'DRAFT':
        actions.push({ action: 'edit', label: 'Edit Paket' });
        actions.push({ action: 'add_items', label: 'Tambah Item' });
        break;

      case 'PERENCANAAN':
        actions.push({ action: 'edit', label: 'Edit Paket' });
        actions.push({ action: 'add_items', label: 'Kelola Item' });
        actions.push({ action: 'generate_kak', label: 'Buat KAK' });
        break;

      case 'SURVEY_HARGA':
        actions.push({ action: 'add_survey', label: 'Input Survey' });
        actions.push({ action: 'select_survey', label: 'Pilih Harga Survey' });
        break;

      case 'HPS':
        actions.push({ action: 'calculate_hps', label: 'Hitung HPS' });
        actions.push({ action: 'generate_hps', label: 'Buat Dokumen HPS' });
        break;

      case 'PENGADAAN':
        actions.push({ action: 'select_penyedia', label: 'Pilih Penyedia' });
        actions.push({ action: 'generate_ba', label: 'Buat BA Negosiasi' });
        break;

      case 'KONTRAK':
        actions.push({ action: 'input_kontrak', label: 'Input Kontrak' });
        actions.push({ action: 'generate_spk', label: 'Buat SPK/Kontrak' });
        break;

      case 'PELAKSANAAN':
        actions.push({ action: 'track_progress', label: 'Update Progress' });
        break;

      case 'SERAH_TERIMA':
        actions.push({ action: 'input_bast', label: 'Input BAST' });
        actions.push({ action: 'generate_bast', label: 'Buat BAST' });
        break;

      case 'PEMBAYARAN':
        actions.push({ action: 'input_payment', label: 'Input Pembayaran' });
        actions.push({ action: 'generate_kuitansi', label: 'Buat Kuitansi' });
        break;
    }

    // Workflow actions
    if (status.canAdvance && status.nextStage) {
      actions.push({
        action: 'advance',
        label: 'Lanjut ke ' + status.nextStageLabel,
        isPrimary: true
      });
    }

    if (status.prevStage) {
      actions.push({
        action: 'revert',
        label: 'Kembali ke ' + status.prevStageLabel,
        isDanger: true
      });
    }

    return actions;
  },

  // ==================== CANCEL PAKET ====================
  cancelPaket: function(paketId, reason) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    PaketService.update(paketId, {
      status: 'BATAL',
      keterangan: (paket.keterangan ? paket.keterangan + '\n' : '') + 'Dibatalkan: ' + (reason || '-')
    });

    return { success: true, message: 'Paket berhasil dibatalkan' };
  }
};

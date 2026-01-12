/**
 * 11_WorkflowRules.gs
 * Workflow Engine - Transition Rules and Validation
 */

// ========================================
// PAKET WORKFLOW TRANSITIONS
// ========================================

const PAKET_TRANSITIONS = {
  DRAFT: {
    allowed: ['PERENCANAAN', 'BATAL'],
    next: 'PERENCANAAN',
    prev: null
  },
  PERENCANAAN: {
    allowed: ['DRAFT', 'SURVEY_HARGA', 'BATAL'],
    next: 'SURVEY_HARGA',
    prev: 'DRAFT'
  },
  SURVEY_HARGA: {
    allowed: ['PERENCANAAN', 'HPS', 'BATAL'],
    next: 'HPS',
    prev: 'PERENCANAAN'
  },
  HPS: {
    allowed: ['SURVEY_HARGA', 'PENGADAAN', 'BATAL'],
    next: 'PENGADAAN',
    prev: 'SURVEY_HARGA'
  },
  PENGADAAN: {
    allowed: ['HPS', 'KONTRAK', 'BATAL'],
    next: 'KONTRAK',
    prev: 'HPS'
  },
  KONTRAK: {
    allowed: ['PENGADAAN', 'PELAKSANAAN', 'BATAL'],
    next: 'PELAKSANAAN',
    prev: 'PENGADAAN'
  },
  PELAKSANAAN: {
    allowed: ['KONTRAK', 'SERAH_TERIMA'],
    next: 'SERAH_TERIMA',
    prev: 'KONTRAK'
  },
  SERAH_TERIMA: {
    allowed: ['PELAKSANAAN', 'PEMBAYARAN'],
    next: 'PEMBAYARAN',
    prev: 'PELAKSANAAN'
  },
  PEMBAYARAN: {
    allowed: ['SERAH_TERIMA', 'SELESAI'],
    next: 'SELESAI',
    prev: 'SERAH_TERIMA'
  },
  SELESAI: {
    allowed: [],
    next: null,
    prev: 'PEMBAYARAN'
  },
  BATAL: {
    allowed: [],
    next: null,
    prev: null
  }
};

// ========================================
// PD WORKFLOW TRANSITIONS (LUAR KOTA)
// ========================================

const PD_TRANSITIONS_LUAR_KOTA = {
  DRAFT: {
    allowed: ['SURAT_TUGAS', 'BATAL'],
    next: 'SURAT_TUGAS',
    prev: null
  },
  SURAT_TUGAS: {
    allowed: ['DRAFT', 'SPPD', 'BATAL'],
    next: 'SPPD',
    prev: 'DRAFT'
  },
  SPPD: {
    allowed: ['SURAT_TUGAS', 'PELAKSANAAN', 'BATAL'],
    next: 'PELAKSANAAN',
    prev: 'SURAT_TUGAS'
  },
  PELAKSANAAN: {
    allowed: ['SPPD', 'PELAPORAN', 'BATAL'],
    next: 'PELAPORAN',
    prev: 'SPPD'
  },
  PELAPORAN: {
    allowed: ['PELAKSANAAN', 'PERTANGGUNGJAWABAN'],
    next: 'PERTANGGUNGJAWABAN',
    prev: 'PELAKSANAAN'
  },
  PERTANGGUNGJAWABAN: {
    allowed: ['PELAPORAN', 'SELESAI'],
    next: 'SELESAI',
    prev: 'PELAPORAN'
  },
  SELESAI: {
    allowed: [],
    next: null,
    prev: 'PERTANGGUNGJAWABAN'
  },
  BATAL: {
    allowed: [],
    next: null,
    prev: null
  }
};

// ========================================
// PD WORKFLOW TRANSITIONS (DALAM KOTA)
// ========================================

const PD_TRANSITIONS_DALAM_KOTA = {
  DRAFT: {
    allowed: ['SURAT_TUGAS', 'BATAL'],
    next: 'SURAT_TUGAS',
    prev: null
  },
  SURAT_TUGAS: {
    allowed: ['DRAFT', 'PELAKSANAAN', 'BATAL'],
    next: 'PELAKSANAAN',
    prev: 'DRAFT'
  },
  PELAKSANAAN: {
    allowed: ['SURAT_TUGAS', 'SELESAI'],
    next: 'SELESAI',
    prev: 'SURAT_TUGAS'
  },
  SELESAI: {
    allowed: [],
    next: null,
    prev: 'PELAKSANAAN'
  },
  BATAL: {
    allowed: [],
    next: null,
    prev: null
  }
};

// ========================================
// VALIDATION RULES FOR PAKET
// ========================================

const PAKET_VALIDATION_RULES = {
  PERENCANAAN: {
    required: ['namaPaket', 'jenisPengadaan', 'metodePengadaan'],
    validation: function(paket) {
      const errors = [];
      if (!paket.namaPaket || paket.namaPaket.trim() === '') {
        errors.push('Nama paket wajib diisi');
      }
      if (!paket.jenisPengadaan) {
        errors.push('Jenis pengadaan wajib dipilih');
      }
      return { valid: errors.length === 0, errors };
    }
  },

  SURVEY_HARGA: {
    required: ['items'],
    validation: function(paket) {
      const errors = [];
      if (!paket.items || paket.items.length === 0) {
        errors.push('Minimal 1 item barang/jasa harus ditambahkan');
      }
      if (paket.items) {
        paket.items.forEach((item, idx) => {
          if (!item.namaBarang) {
            errors.push(`Item ${idx + 1}: Nama barang wajib diisi`);
          }
          if (!item.volume || item.volume <= 0) {
            errors.push(`Item ${idx + 1}: Volume harus lebih dari 0`);
          }
        });
      }
      return { valid: errors.length === 0, errors };
    }
  },

  HPS: {
    required: ['surveys'],
    validation: function(paket) {
      const errors = [];
      const surveyStatus = SurveyService.getSummaryForPaket(paket.paketId);

      if (surveyStatus.totalItems === 0) {
        errors.push('Tidak ada item untuk disurvey');
      } else if (surveyStatus.itemsWithSurvey < surveyStatus.totalItems) {
        errors.push(`${surveyStatus.totalItems - surveyStatus.itemsWithSurvey} item belum memiliki survey harga`);
      }

      if (!surveyStatus.isComplete) {
        errors.push('Semua item harus memiliki survey harga yang dipilih');
      }

      return { valid: errors.length === 0, errors };
    }
  },

  PENGADAAN: {
    required: ['nilaiHPS'],
    validation: function(paket) {
      const errors = [];
      if (!paket.nilaiHPS || paket.nilaiHPS <= 0) {
        errors.push('HPS harus sudah dihitung dan disimpan');
      }
      if (paket.paguAnggaran && paket.nilaiHPS > paket.paguAnggaran) {
        errors.push('Nilai HPS melebihi Pagu Anggaran');
      }
      return { valid: errors.length === 0, errors };
    }
  },

  KONTRAK: {
    required: ['penyedia'],
    validation: function(paket) {
      const errors = [];
      if (!paket.penyediaId && !paket.namaPenyedia) {
        errors.push('Penyedia harus sudah dipilih');
      }
      return { valid: errors.length === 0, errors };
    }
  },

  PELAKSANAAN: {
    required: ['kontrak'],
    validation: function(paket) {
      const errors = [];
      const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);

      if (!kontrak) {
        errors.push('Data kontrak belum diinput');
      } else {
        if (!kontrak.nomorKontrak) {
          errors.push('Nomor kontrak wajib diisi');
        }
        if (!kontrak.tanggalKontrak) {
          errors.push('Tanggal kontrak wajib diisi');
        }
        if (!kontrak.nilaiKontrak || kontrak.nilaiKontrak <= 0) {
          errors.push('Nilai kontrak harus lebih dari 0');
        }
        if (!kontrak.tanggalMulai) {
          errors.push('Tanggal mulai kontrak wajib diisi');
        }
        if (!kontrak.tanggalSelesai) {
          errors.push('Tanggal selesai kontrak wajib diisi');
        }
      }
      return { valid: errors.length === 0, errors };
    }
  },

  SERAH_TERIMA: {
    required: [],
    validation: function(paket) {
      // No mandatory validation for SERAH_TERIMA entry
      // Work must be completed based on contract
      return { valid: true, errors: [] };
    }
  },

  PEMBAYARAN: {
    required: ['serahTerima'],
    validation: function(paket) {
      const errors = [];
      const serahTerima = paket.serahTerima || PaketService.getSerahTerima(paket.paketId);

      if (!serahTerima || serahTerima.length === 0) {
        errors.push('Berita Acara Serah Terima belum dibuat');
      } else {
        const hasValidBAST = serahTerima.some(st => st.nomorBA && st.tanggalBA);
        if (!hasValidBAST) {
          errors.push('BAST harus memiliki nomor dan tanggal');
        }
      }
      return { valid: errors.length === 0, errors };
    }
  },

  SELESAI: {
    required: ['pembayaran'],
    validation: function(paket) {
      const errors = [];
      const pembayaran = paket.pembayaran || PaketService.getPembayaran(paket.paketId);

      if (!pembayaran || pembayaran.length === 0) {
        errors.push('Belum ada data pembayaran');
      } else {
        const paidAmount = pembayaran
          .filter(p => p.status === 'PAID' || p.status === 'COMPLETED')
          .reduce((sum, p) => sum + (p.nilaiNetto || 0), 0);

        const kontrakValue = paket.nilaiKontrak || 0;

        // Allow 5% tolerance for rounding
        if (kontrakValue > 0 && paidAmount < kontrakValue * 0.95) {
          errors.push(`Pembayaran belum lunas (${Math.round(paidAmount / kontrakValue * 100)}%)`);
        }
      }
      return { valid: errors.length === 0, errors };
    }
  }
};

// ========================================
// VALIDATION RULES FOR PERJALANAN DINAS
// ========================================

const PD_VALIDATION_RULES = {
  SURAT_TUGAS: {
    required: ['pelaksana', 'tujuan', 'tanggal'],
    validation: function(pd) {
      const errors = [];

      if (!pd.pelaksana || pd.pelaksana.length === 0) {
        errors.push('Minimal 1 pelaksana harus ditambahkan');
      } else {
        pd.pelaksana.forEach((p, idx) => {
          if (!p.nama) errors.push(`Pelaksana ${idx + 1}: Nama wajib diisi`);
          if (!p.nip) errors.push(`Pelaksana ${idx + 1}: NIP wajib diisi`);
        });
      }

      if (!pd.tujuan && !pd.maksudTujuan) {
        errors.push('Maksud/tujuan perjalanan wajib diisi');
      }

      if (!pd.tanggalBerangkat) {
        errors.push('Tanggal berangkat wajib diisi');
      }

      if (!pd.tanggalKembali) {
        errors.push('Tanggal kembali wajib diisi');
      }

      if (pd.tanggalBerangkat && pd.tanggalKembali) {
        const tglBerangkat = new Date(pd.tanggalBerangkat);
        const tglKembali = new Date(pd.tanggalKembali);
        if (tglKembali < tglBerangkat) {
          errors.push('Tanggal kembali tidak boleh sebelum tanggal berangkat');
        }
      }

      return { valid: errors.length === 0, errors };
    }
  },

  SPPD: {
    required: ['nomorST'],
    validation: function(pd) {
      const errors = [];

      if (!pd.nomorST) {
        errors.push('Nomor Surat Tugas wajib diisi');
      }

      if (!pd.tanggalST) {
        errors.push('Tanggal Surat Tugas wajib diisi');
      }

      return { valid: errors.length === 0, errors };
    }
  },

  PELAKSANAAN: {
    required: [],
    validation: function(pd) {
      const errors = [];

      // For LUAR_KOTA, must have SPPD
      if (pd.jenisPD === JENIS_PD.LUAR_KOTA) {
        if (!pd.nomorSPPD) {
          errors.push('Nomor SPPD wajib diisi untuk perjalanan luar kota');
        }
      }

      return { valid: errors.length === 0, errors };
    }
  },

  PELAPORAN: {
    required: [],
    validation: function(pd) {
      // Travel should be completed (tanggalKembali passed)
      const errors = [];
      const today = new Date();
      const tglKembali = pd.tanggalKembali ? new Date(pd.tanggalKembali) : null;

      if (tglKembali && tglKembali > today) {
        errors.push('Perjalanan belum selesai (tanggal kembali belum tercapai)');
      }

      return { valid: errors.length === 0, errors };
    }
  },

  PERTANGGUNGJAWABAN: {
    required: ['biaya'],
    validation: function(pd) {
      const errors = [];

      if (!pd.biaya || pd.biaya.length === 0) {
        errors.push('Rincian biaya perjalanan harus diinput');
      }

      // Check for mandatory attachments
      const requiredKategori = ['TIKET', 'KWITANSI'];
      const attachedKategori = pd.lampiran ? pd.lampiran.map(l => l.kategori) : [];

      // Just warning, not blocking
      const missingDocs = requiredKategori.filter(k => !attachedKategori.includes(k));
      if (missingDocs.length > 0) {
        // Add as warning, not error
        console.log('Warning: Missing recommended attachments:', missingDocs);
      }

      return { valid: errors.length === 0, errors };
    }
  },

  SELESAI: {
    required: ['totalBiaya'],
    validation: function(pd) {
      const errors = [];

      if (pd.totalBiaya <= 0) {
        errors.push('Total biaya harus lebih dari 0');
      }

      return { valid: errors.length === 0, errors };
    }
  }
};

// ========================================
// CHECKLIST PER STATUS
// ========================================

const PAKET_CHECKLIST = {
  DRAFT: [
    { id: 'nama_paket', label: 'Nama paket sudah diisi', field: 'namaPaket' },
    { id: 'jenis_pengadaan', label: 'Jenis pengadaan sudah dipilih', field: 'jenisPengadaan' },
    { id: 'metode_pengadaan', label: 'Metode pengadaan sudah dipilih', field: 'metodePengadaan' },
    { id: 'pagu_anggaran', label: 'Pagu anggaran sudah diisi', field: 'paguAnggaran' }
  ],

  PERENCANAAN: [
    { id: 'items_added', label: 'Item barang/jasa sudah ditambahkan', check: (p) => p.items && p.items.length > 0 },
    { id: 'sumber_dana', label: 'Sumber dana sudah diisi', field: 'sumberDana' },
    { id: 'mak', label: 'MAK/Akun sudah diisi', field: 'mak' },
    { id: 'kak_uploaded', label: 'KAK sudah diupload', check: (p) => p.lampiran?.some(l => l.kategori === 'KAK') }
  ],

  SURVEY_HARGA: [
    { id: 'all_items_surveyed', label: 'Semua item sudah disurvey', check: (p) => {
      const status = SurveyService.getSummaryForPaket(p.paketId);
      return status.itemsWithSurvey === status.totalItems;
    }},
    { id: 'all_surveys_selected', label: 'Survey harga sudah dipilih untuk semua item', check: (p) => {
      const status = SurveyService.getSummaryForPaket(p.paketId);
      return status.isComplete;
    }},
    { id: 'bukti_survey', label: 'Bukti survey sudah diupload', check: (p) => p.lampiran?.some(l => l.kategori === 'SURVEY') }
  ],

  HPS: [
    { id: 'hps_calculated', label: 'HPS sudah dihitung', check: (p) => p.nilaiHPS && p.nilaiHPS > 0 },
    { id: 'hps_within_budget', label: 'HPS tidak melebihi pagu anggaran', check: (p) => !p.paguAnggaran || p.nilaiHPS <= p.paguAnggaran },
    { id: 'hps_document', label: 'Dokumen HPS sudah dibuat', check: (p) => p.dokumen?.some(d => d.jenisDokumen === 'HPS') }
  ],

  PENGADAAN: [
    { id: 'penyedia_selected', label: 'Penyedia sudah dipilih', check: (p) => p.penyediaId || p.namaPenyedia },
    { id: 'ba_negosiasi', label: 'BA Negosiasi sudah dibuat', check: (p) => p.dokumen?.some(d => d.jenisDokumen === 'BA_NEGOSIASI') }
  ],

  KONTRAK: [
    { id: 'kontrak_nomor', label: 'Nomor kontrak sudah diisi', check: (p) => p.kontrak?.nomorKontrak },
    { id: 'kontrak_tanggal', label: 'Tanggal kontrak sudah diisi', check: (p) => p.kontrak?.tanggalKontrak },
    { id: 'kontrak_nilai', label: 'Nilai kontrak sudah diisi', check: (p) => p.kontrak?.nilaiKontrak > 0 },
    { id: 'kontrak_jangka', label: 'Jangka waktu kontrak sudah diisi', check: (p) => p.kontrak?.tanggalMulai && p.kontrak?.tanggalSelesai },
    { id: 'spk_document', label: 'Dokumen SPK/Kontrak sudah dibuat', check: (p) => p.dokumen?.some(d => ['SPK', 'KONTRAK'].includes(d.jenisDokumen)) }
  ],

  PELAKSANAAN: [
    { id: 'progress_tracked', label: 'Progress pekerjaan sudah diupdate', check: (p) => p.progress > 0 }
  ],

  SERAH_TERIMA: [
    { id: 'bast_nomor', label: 'Nomor BAST sudah diisi', check: (p) => p.serahTerima?.some(st => st.nomorBA) },
    { id: 'bast_tanggal', label: 'Tanggal BAST sudah diisi', check: (p) => p.serahTerima?.some(st => st.tanggalBA) },
    { id: 'bast_document', label: 'Dokumen BAST sudah dibuat', check: (p) => p.dokumen?.some(d => d.jenisDokumen === 'BAST') }
  ],

  PEMBAYARAN: [
    { id: 'payment_created', label: 'Data pembayaran sudah diinput', check: (p) => p.pembayaran && p.pembayaran.length > 0 },
    { id: 'payment_completed', label: 'Pembayaran sudah selesai', check: (p) => {
      if (!p.pembayaran || p.pembayaran.length === 0) return false;
      const paid = p.pembayaran.filter(py => ['PAID', 'COMPLETED'].includes(py.status));
      return paid.length === p.pembayaran.length;
    }},
    { id: 'kuitansi_document', label: 'Kuitansi sudah dibuat', check: (p) => p.dokumen?.some(d => d.jenisDokumen === 'KUITANSI') }
  ],

  SELESAI: [
    { id: 'all_documents', label: 'Semua dokumen sudah lengkap', check: (p) => {
      const required = ['HPS', 'SPK', 'BAST', 'KUITANSI'];
      return required.every(doc => p.dokumen?.some(d => d.jenisDokumen === doc));
    }},
    { id: 'archived', label: 'Data sudah diarsipkan', check: (p) => p.isArchived }
  ]
};

const PD_CHECKLIST = {
  DRAFT: [
    { id: 'jenis_pd', label: 'Jenis perjalanan dinas sudah dipilih', field: 'jenisPD' },
    { id: 'tujuan', label: 'Maksud/tujuan sudah diisi', check: (pd) => pd.tujuan || pd.maksudTujuan },
    { id: 'tanggal', label: 'Tanggal perjalanan sudah diisi', check: (pd) => pd.tanggalBerangkat && pd.tanggalKembali },
    { id: 'pelaksana', label: 'Pelaksana sudah ditambahkan', check: (pd) => pd.pelaksana && pd.pelaksana.length > 0 }
  ],

  SURAT_TUGAS: [
    { id: 'nomor_st', label: 'Nomor Surat Tugas sudah diisi', field: 'nomorST' },
    { id: 'tanggal_st', label: 'Tanggal Surat Tugas sudah diisi', field: 'tanggalST' },
    { id: 'st_document', label: 'Dokumen Surat Tugas sudah dibuat', check: (pd) => pd.dokumen?.some(d => d.jenisDokumen === 'SURAT_TUGAS') }
  ],

  SPPD: [
    { id: 'nomor_sppd', label: 'Nomor SPPD sudah diisi', field: 'nomorSPPD' },
    { id: 'tanggal_sppd', label: 'Tanggal SPPD sudah diisi', field: 'tanggalSPPD' },
    { id: 'sppd_document', label: 'Dokumen SPPD sudah dibuat', check: (pd) => pd.dokumen?.some(d => d.jenisDokumen === 'SPPD') }
  ],

  PELAKSANAAN: [
    { id: 'tiket_uploaded', label: 'Tiket perjalanan sudah diupload', check: (pd) => pd.lampiran?.some(l => ['TIKET', 'BOARDING_PASS'].includes(l.kategori)) }
  ],

  PELAPORAN: [
    { id: 'laporan_uploaded', label: 'Laporan perjalanan sudah diupload', check: (pd) => pd.lampiran?.some(l => l.kategori === 'LAPORAN') },
    { id: 'foto_kegiatan', label: 'Foto kegiatan sudah diupload', check: (pd) => pd.lampiran?.some(l => l.kategori === 'FOTO_KEGIATAN') }
  ],

  PERTANGGUNGJAWABAN: [
    { id: 'biaya_diisi', label: 'Rincian biaya sudah diisi', check: (pd) => pd.biaya && pd.biaya.length > 0 },
    { id: 'total_biaya', label: 'Total biaya sudah dihitung', check: (pd) => pd.totalBiaya > 0 },
    { id: 'bukti_uploaded', label: 'Bukti pengeluaran sudah diupload', check: (pd) => pd.lampiran?.some(l => l.kategori === 'KWITANSI') },
    { id: 'kuitansi_rampung', label: 'Kuitansi Rampung sudah dibuat', check: (pd) => pd.dokumen?.some(d => d.jenisDokumen === 'KUITANSI_RAMPUNG') }
  ],

  SELESAI: [
    { id: 'all_verified', label: 'Semua lampiran sudah diverifikasi', check: (pd) => {
      if (!pd.lampiran || pd.lampiran.length === 0) return true;
      return pd.lampiran.every(l => l.isVerified);
    }}
  ]
};

// ========================================
// WORKFLOW VALIDATION SERVICE
// ========================================

const WorkflowValidationService = {

  // Validate Paket transition
  validatePaketTransition: function(paket, targetStatus) {
    const currentStatus = paket.status || 'DRAFT';
    const transition = PAKET_TRANSITIONS[currentStatus];

    // Check if transition is allowed
    if (!transition || !transition.allowed.includes(targetStatus)) {
      return {
        valid: false,
        errors: [`Tidak dapat berpindah dari ${currentStatus} ke ${targetStatus}`]
      };
    }

    // Get validation rules for target status
    const rules = PAKET_VALIDATION_RULES[targetStatus];
    if (rules && rules.validation) {
      return rules.validation(paket);
    }

    return { valid: true, errors: [] };
  },

  // Validate PD transition
  validatePDTransition: function(pd, targetStatus) {
    const currentStatus = pd.status || 'DRAFT';
    const transitions = pd.jenisPD === JENIS_PD.DALAM_KOTA
      ? PD_TRANSITIONS_DALAM_KOTA
      : PD_TRANSITIONS_LUAR_KOTA;

    const transition = transitions[currentStatus];

    // Check if transition is allowed
    if (!transition || !transition.allowed.includes(targetStatus)) {
      return {
        valid: false,
        errors: [`Tidak dapat berpindah dari ${currentStatus} ke ${targetStatus}`]
      };
    }

    // Get validation rules for target status
    const rules = PD_VALIDATION_RULES[targetStatus];
    if (rules && rules.validation) {
      return rules.validation(pd);
    }

    return { valid: true, errors: [] };
  },

  // Get Paket checklist
  getPaketChecklist: function(paket) {
    const status = paket.status || 'DRAFT';
    const checklistItems = PAKET_CHECKLIST[status] || [];

    return checklistItems.map(item => {
      let completed = false;

      if (item.field) {
        completed = !!paket[item.field];
      } else if (item.check) {
        try {
          completed = item.check(paket);
        } catch (e) {
          completed = false;
        }
      }

      return {
        id: item.id,
        label: item.label,
        completed: completed
      };
    });
  },

  // Get PD checklist
  getPDChecklist: function(pd) {
    const status = pd.status || 'DRAFT';
    const checklistItems = PD_CHECKLIST[status] || [];

    return checklistItems.map(item => {
      let completed = false;

      if (item.field) {
        completed = !!pd[item.field];
      } else if (item.check) {
        try {
          completed = item.check(pd);
        } catch (e) {
          completed = false;
        }
      }

      return {
        id: item.id,
        label: item.label,
        completed: completed
      };
    });
  },

  // Get all checklists across statuses
  getAllPaketChecklists: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) return null;

    const result = {};
    Object.keys(PAKET_CHECKLIST).forEach(status => {
      result[status] = PAKET_CHECKLIST[status].map(item => {
        let completed = false;
        if (item.field) {
          completed = !!paket[item.field];
        } else if (item.check) {
          try {
            completed = item.check(paket);
          } catch (e) {
            completed = false;
          }
        }
        return { ...item, completed };
      });
    });

    return result;
  },

  // Get available next statuses
  getAvailablePaketTransitions: function(paket) {
    const currentStatus = paket.status || 'DRAFT';
    const transition = PAKET_TRANSITIONS[currentStatus];

    if (!transition) return [];

    return transition.allowed.map(status => {
      const validation = this.validatePaketTransition(paket, status);
      return {
        status: status,
        label: PAKET_STATUS_LABELS[status] || status,
        canTransition: validation.valid,
        errors: validation.errors
      };
    });
  },

  // Get available next statuses for PD
  getAvailablePDTransitions: function(pd) {
    const currentStatus = pd.status || 'DRAFT';
    const transitions = pd.jenisPD === JENIS_PD.DALAM_KOTA
      ? PD_TRANSITIONS_DALAM_KOTA
      : PD_TRANSITIONS_LUAR_KOTA;

    const transition = transitions[currentStatus];
    if (!transition) return [];

    return transition.allowed.map(status => {
      const validation = this.validatePDTransition(pd, status);
      return {
        status: status,
        label: PD_STATUS_LABELS[status] || status,
        canTransition: validation.valid,
        errors: validation.errors
      };
    });
  }
};

// ========================================
// ROUTE EXTENSIONS FOR WORKFLOW
// ========================================

function routeWorkflowExtended(segments, method, params, body) {
  // GET /workflow/paket/:id/checklist
  if (segments[0] === 'paket' && segments[2] === 'checklist') {
    const paket = PaketService.getById(segments[1]);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    return {
      success: true,
      data: {
        current: WorkflowValidationService.getPaketChecklist(paket),
        all: WorkflowValidationService.getAllPaketChecklists(segments[1])
      }
    };
  }

  // GET /workflow/paket/:id/transitions
  if (segments[0] === 'paket' && segments[2] === 'transitions') {
    const paket = PaketService.getById(segments[1]);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    return {
      success: true,
      data: WorkflowValidationService.getAvailablePaketTransitions(paket)
    };
  }

  // POST /workflow/paket/:id/validate
  if (segments[0] === 'paket' && segments[2] === 'validate' && method === 'POST') {
    const paket = PaketService.getById(segments[1]);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    const targetStatus = body.targetStatus;
    return WorkflowValidationService.validatePaketTransition(paket, targetStatus);
  }

  // GET /workflow/pd/:id/checklist
  if (segments[0] === 'pd' && segments[2] === 'checklist') {
    const pd = PerjalananDinasService.getById(segments[1]);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }
    return {
      success: true,
      data: WorkflowValidationService.getPDChecklist(pd)
    };
  }

  // GET /workflow/pd/:id/transitions
  if (segments[0] === 'pd' && segments[2] === 'transitions') {
    const pd = PerjalananDinasService.getById(segments[1]);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }
    return {
      success: true,
      data: WorkflowValidationService.getAvailablePDTransitions(pd)
    };
  }

  return { success: false, error: 'Route not found' };
}

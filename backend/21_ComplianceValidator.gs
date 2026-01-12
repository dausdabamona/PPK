/**
 * 21_ComplianceValidator.gs
 * Compliance Validation Module
 * Sprint 2: Workflow Engine & Compliance Validation
 *
 * Validates:
 * - Budget vs HPS vs Contract value
 * - Mandatory documents per stage
 * - Date logic (SPMK after contract, BAST after execution, SPM after BAST)
 * - Stage requirements
 */

// ========================================
// COMPLIANCE RULES CONFIGURATION
// ========================================

const COMPLIANCE_RULES = {

  // Budget tolerance settings
  BUDGET: {
    HPS_PAGU_MAX_RATIO: 1.0,        // HPS cannot exceed pagu (100%)
    KONTRAK_HPS_MAX_RATIO: 1.0,     // Contract cannot exceed HPS
    KONTRAK_PAGU_MAX_RATIO: 1.0,    // Contract cannot exceed pagu
    PAYMENT_KONTRAK_MAX_RATIO: 1.0  // Payment cannot exceed contract
  },

  // Mandatory documents per stage for PAKET
  PAKET_MANDATORY_DOCS: {
    HPS: {
      documents: [],
      attachments: ['KAK']
    },
    PENGADAAN: {
      documents: ['HPS'],
      attachments: ['KAK', 'SURVEY']
    },
    KONTRAK: {
      documents: ['HPS'],
      attachments: ['KAK']
    },
    PELAKSANAAN: {
      documents: ['SPK'],
      attachments: []
    },
    SERAH_TERIMA: {
      documents: ['SPK'],
      attachments: []
    },
    PEMBAYARAN: {
      documents: ['SPK', 'BAST'],
      attachments: []
    },
    SELESAI: {
      documents: ['HPS', 'SPK', 'BAST', 'KUITANSI'],
      attachments: []
    }
  },

  // Mandatory documents for PD
  PD_MANDATORY_DOCS: {
    SPPD: {
      documents: ['SURAT_TUGAS'],
      fields: ['nomorST', 'tanggalST']
    },
    PELAKSANAAN: {
      documents: ['SPPD'],
      fields: ['nomorSPPD', 'tanggalSPPD']
    },
    PERTANGGUNGJAWABAN: {
      documents: [],
      fields: ['totalBiaya'],
      attachments: ['KWITANSI']
    },
    SELESAI: {
      documents: ['KUITANSI_RAMPUNG'],
      fields: []
    }
  }
};

// ========================================
// COMPLIANCE VALIDATOR
// ========================================

const ComplianceValidator = {

  // ==================== PAKET STAGE VALIDATION ====================

  validatePaketForStage: function(paket, targetStage) {
    const results = {
      validations: [],
      hardStops: [],
      warnings: []
    };

    // Run all validators based on target stage
    switch (targetStage) {
      case 'PERENCANAAN':
        this._validatePaketPerencanaan(paket, results);
        break;
      case 'SURVEY_HARGA':
        this._validatePaketSurveyHarga(paket, results);
        break;
      case 'HPS':
        this._validatePaketHPS(paket, results);
        break;
      case 'PENGADAAN':
        this._validatePaketPengadaan(paket, results);
        break;
      case 'KONTRAK':
        this._validatePaketKontrak(paket, results);
        break;
      case 'PELAKSANAAN':
        this._validatePaketPelaksanaan(paket, results);
        break;
      case 'SERAH_TERIMA':
        this._validatePaketSerahTerima(paket, results);
        break;
      case 'PEMBAYARAN':
        this._validatePaketPembayaran(paket, results);
        break;
      case 'SELESAI':
        this._validatePaketSelesai(paket, results);
        break;
    }

    // Run budget validations (applies to most stages)
    if (['PENGADAAN', 'KONTRAK', 'PELAKSANAAN', 'SERAH_TERIMA', 'PEMBAYARAN', 'SELESAI'].includes(targetStage)) {
      this._validateBudgetCompliance(paket, results);
    }

    // Run document validations
    this._validateMandatoryDocuments(paket, targetStage, results);

    return results;
  },

  // ==================== PAKET STAGE VALIDATORS ====================

  _validatePaketPerencanaan: function(paket, results) {
    // Required: namaPaket
    if (!paket.namaPaket || paket.namaPaket.trim() === '') {
      results.hardStops.push({
        code: 'MISSING_NAMA_PAKET',
        message: 'Nama paket wajib diisi',
        field: 'namaPaket',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Required: jenisPengadaan
    if (!paket.jenisPengadaan) {
      results.hardStops.push({
        code: 'MISSING_JENIS_PENGADAAN',
        message: 'Jenis pengadaan wajib dipilih',
        field: 'jenisPengadaan',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Warning: paguAnggaran
    if (!paket.paguAnggaran || paket.paguAnggaran <= 0) {
      results.warnings.push({
        code: 'MISSING_PAGU',
        message: 'Pagu anggaran belum diisi',
        field: 'paguAnggaran',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  },

  _validatePaketSurveyHarga: function(paket, results) {
    // Required: minimal 1 item
    if (!paket.items || paket.items.length === 0) {
      results.hardStops.push({
        code: 'NO_ITEMS',
        message: 'Minimal 1 item barang/jasa harus ditambahkan sebelum survey harga',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return;
    }

    // Check item completeness
    const incompleteItems = paket.items.filter(item =>
      !item.namaBarang || !item.satuan || !item.volume || item.volume <= 0
    );

    if (incompleteItems.length > 0) {
      results.hardStops.push({
        code: 'INCOMPLETE_ITEMS',
        message: `${incompleteItems.length} item belum lengkap (nama, satuan, volume)`,
        severity: VALIDATION_SEVERITY.HARD_STOP,
        details: incompleteItems.map(i => i.itemId)
      });
    }
  },

  _validatePaketHPS: function(paket, results) {
    // Required: all items have selected survey
    const surveyStatus = SurveyService.getSummaryForPaket(paket.paketId);

    if (surveyStatus.totalItems === 0) {
      results.hardStops.push({
        code: 'NO_ITEMS_FOR_HPS',
        message: 'Tidak ada item untuk dihitung HPS',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return;
    }

    if (surveyStatus.itemsWithSurvey < surveyStatus.totalItems) {
      results.hardStops.push({
        code: 'INCOMPLETE_SURVEY',
        message: `${surveyStatus.totalItems - surveyStatus.itemsWithSurvey} item belum memiliki data survey harga`,
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    if (!surveyStatus.isComplete) {
      results.hardStops.push({
        code: 'NO_SELECTED_SURVEY',
        message: 'Semua item harus memiliki survey harga yang dipilih',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Warning: minimal 2 survey per item for good practice
    if (surveyStatus.totalSurveys < surveyStatus.totalItems * 2) {
      results.warnings.push({
        code: 'LOW_SURVEY_COUNT',
        message: 'Disarankan minimal 2 survey per item untuk perbandingan harga',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  },

  _validatePaketPengadaan: function(paket, results) {
    // Required: HPS must be calculated
    if (!paket.nilaiHPS || paket.nilaiHPS <= 0) {
      results.hardStops.push({
        code: 'NO_HPS_VALUE',
        message: 'Nilai HPS harus sudah dihitung dan disimpan',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Budget check: HPS vs Pagu
    if (paket.nilaiHPS && paket.paguAnggaran) {
      if (paket.nilaiHPS > paket.paguAnggaran * COMPLIANCE_RULES.BUDGET.HPS_PAGU_MAX_RATIO) {
        results.hardStops.push({
          code: 'HPS_EXCEEDS_PAGU',
          message: `Nilai HPS (Rp ${formatRupiahDoc(paket.nilaiHPS)}) melebihi Pagu Anggaran (Rp ${formatRupiahDoc(paket.paguAnggaran)})`,
          severity: VALIDATION_SEVERITY.HARD_STOP,
          details: {
            nilaiHPS: paket.nilaiHPS,
            paguAnggaran: paket.paguAnggaran,
            selisih: paket.nilaiHPS - paket.paguAnggaran
          }
        });
      }
    }
  },

  _validatePaketKontrak: function(paket, results) {
    // Required: Penyedia selected
    if (!paket.penyediaId && !paket.namaPenyedia) {
      results.hardStops.push({
        code: 'NO_PENYEDIA',
        message: 'Penyedia harus sudah dipilih sebelum pembuatan kontrak',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }
  },

  _validatePaketPelaksanaan: function(paket, results) {
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);

    // Required: Kontrak data
    if (!kontrak) {
      results.hardStops.push({
        code: 'NO_KONTRAK',
        message: 'Data kontrak harus sudah diinput',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return;
    }

    // Required: Nomor kontrak
    if (!kontrak.nomorKontrak) {
      results.hardStops.push({
        code: 'NO_KONTRAK_NOMOR',
        message: 'Nomor kontrak wajib diisi',
        field: 'nomorKontrak',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Required: Tanggal kontrak
    if (!kontrak.tanggalKontrak) {
      results.hardStops.push({
        code: 'NO_KONTRAK_TANGGAL',
        message: 'Tanggal kontrak wajib diisi',
        field: 'tanggalKontrak',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Required: Nilai kontrak
    if (!kontrak.nilaiKontrak || kontrak.nilaiKontrak <= 0) {
      results.hardStops.push({
        code: 'NO_KONTRAK_NILAI',
        message: 'Nilai kontrak wajib diisi dan lebih dari 0',
        field: 'nilaiKontrak',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Budget check: Kontrak vs HPS
    if (kontrak.nilaiKontrak && paket.nilaiHPS) {
      if (kontrak.nilaiKontrak > paket.nilaiHPS * COMPLIANCE_RULES.BUDGET.KONTRAK_HPS_MAX_RATIO) {
        results.hardStops.push({
          code: 'KONTRAK_EXCEEDS_HPS',
          message: `Nilai kontrak (Rp ${formatRupiahDoc(kontrak.nilaiKontrak)}) melebihi HPS (Rp ${formatRupiahDoc(paket.nilaiHPS)})`,
          severity: VALIDATION_SEVERITY.HARD_STOP,
          details: {
            nilaiKontrak: kontrak.nilaiKontrak,
            nilaiHPS: paket.nilaiHPS
          }
        });
      }
    }

    // DATE LOGIC: Tanggal mulai must be after/equal tanggal kontrak
    if (kontrak.tanggalMulai && kontrak.tanggalKontrak) {
      const tglKontrak = new Date(kontrak.tanggalKontrak);
      const tglMulai = new Date(kontrak.tanggalMulai);
      if (tglMulai < tglKontrak) {
        results.hardStops.push({
          code: 'INVALID_DATE_SPMK',
          message: 'Tanggal mulai kerja tidak boleh sebelum tanggal kontrak',
          severity: VALIDATION_SEVERITY.HARD_STOP,
          details: {
            tanggalKontrak: kontrak.tanggalKontrak,
            tanggalMulai: kontrak.tanggalMulai
          }
        });
      }
    }

    // Required: Jangka waktu
    if (!kontrak.tanggalMulai || !kontrak.tanggalSelesai) {
      results.warnings.push({
        code: 'INCOMPLETE_JANGKA_WAKTU',
        message: 'Jangka waktu kontrak (tanggal mulai dan selesai) belum lengkap',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  },

  _validatePaketSerahTerima: function(paket, results) {
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);

    // DATE LOGIC: Cannot do serah terima before tanggal mulai
    if (kontrak && kontrak.tanggalMulai) {
      const today = new Date();
      const tglMulai = new Date(kontrak.tanggalMulai);
      if (today < tglMulai) {
        results.hardStops.push({
          code: 'PREMATURE_SERAH_TERIMA',
          message: `Tidak dapat melakukan serah terima sebelum tanggal mulai kerja (${formatTanggalIndo(kontrak.tanggalMulai)})`,
          severity: VALIDATION_SEVERITY.HARD_STOP
        });
      }
    }

    // Warning if before contract end date
    if (kontrak && kontrak.tanggalSelesai) {
      const today = new Date();
      const tglSelesai = new Date(kontrak.tanggalSelesai);
      if (today < tglSelesai) {
        results.warnings.push({
          code: 'EARLY_SERAH_TERIMA',
          message: `Serah terima dilakukan sebelum tanggal selesai kontrak (${formatTanggalIndo(kontrak.tanggalSelesai)})`,
          severity: VALIDATION_SEVERITY.WARNING
        });
      }
    }
  },

  _validatePaketPembayaran: function(paket, results) {
    const serahTerima = paket.serahTerima || PaketService.getSerahTerima(paket.paketId);

    // Required: BAST must exist
    if (!serahTerima || serahTerima.length === 0) {
      results.hardStops.push({
        code: 'NO_BAST',
        message: 'Berita Acara Serah Terima (BAST) harus sudah dibuat sebelum pembayaran',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return;
    }

    // Check BAST has required fields
    const validBAST = serahTerima.find(st => st.nomorBA && st.tanggalBA);
    if (!validBAST) {
      results.hardStops.push({
        code: 'INCOMPLETE_BAST',
        message: 'BAST harus memiliki nomor dan tanggal',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // DATE LOGIC: BAST date must be after contract start
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);
    if (validBAST && kontrak && kontrak.tanggalMulai) {
      const tglBAST = new Date(validBAST.tanggalBA);
      const tglMulai = new Date(kontrak.tanggalMulai);
      if (tglBAST < tglMulai) {
        results.hardStops.push({
          code: 'BAST_BEFORE_EXECUTION',
          message: 'Tanggal BAST tidak boleh sebelum tanggal mulai pelaksanaan',
          severity: VALIDATION_SEVERITY.HARD_STOP,
          details: {
            tanggalBAST: validBAST.tanggalBA,
            tanggalMulai: kontrak.tanggalMulai
          }
        });
      }
    }
  },

  _validatePaketSelesai: function(paket, results) {
    const pembayaran = paket.pembayaran || PaketService.getPembayaran(paket.paketId);
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);

    // Required: Payment data exists
    if (!pembayaran || pembayaran.length === 0) {
      results.hardStops.push({
        code: 'NO_PAYMENT',
        message: 'Data pembayaran harus sudah diinput',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
      return;
    }

    // Check payment completion
    const paidAmount = pembayaran
      .filter(p => ['PAID', 'COMPLETED', 'DIBAYAR'].includes(p.status))
      .reduce((sum, p) => sum + (p.nilaiNetto || 0), 0);

    const kontrakValue = kontrak?.nilaiKontrak || paket.nilaiKontrak || 0;

    if (kontrakValue > 0) {
      const paidPercent = (paidAmount / kontrakValue) * 100;

      // Allow 5% tolerance
      if (paidPercent < 95) {
        results.hardStops.push({
          code: 'PAYMENT_INCOMPLETE',
          message: `Pembayaran belum lunas (${paidPercent.toFixed(1)}% dari nilai kontrak)`,
          severity: VALIDATION_SEVERITY.HARD_STOP,
          details: {
            paidAmount: paidAmount,
            kontrakValue: kontrakValue,
            paidPercent: paidPercent
          }
        });
      }
    }
  },

  // ==================== BUDGET COMPLIANCE ====================

  _validateBudgetCompliance: function(paket, results) {
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);

    // Budget chain: Pagu >= HPS >= Kontrak
    if (paket.paguAnggaran && paket.nilaiHPS && kontrak?.nilaiKontrak) {
      // Already checked in individual validators, but add summary
      results.validations.push({
        code: 'BUDGET_CHAIN',
        category: 'BUDGET',
        status: 'INFO',
        message: `Pagu: ${formatRupiahDoc(paket.paguAnggaran)} | HPS: ${formatRupiahDoc(paket.nilaiHPS)} | Kontrak: ${formatRupiahDoc(kontrak.nilaiKontrak)}`,
        severity: VALIDATION_SEVERITY.INFO
      });
    }
  },

  // ==================== MANDATORY DOCUMENTS ====================

  _validateMandatoryDocuments: function(paket, targetStage, results) {
    const requirements = COMPLIANCE_RULES.PAKET_MANDATORY_DOCS[targetStage];
    if (!requirements) return;

    const dokumen = paket.dokumen || [];
    const lampiran = paket.lampiran || [];

    // Check required documents
    if (requirements.documents && requirements.documents.length > 0) {
      requirements.documents.forEach(docType => {
        const hasDoc = dokumen.some(d => d.jenisDokumen === docType);
        if (!hasDoc) {
          results.hardStops.push({
            code: `MISSING_DOC_${docType}`,
            message: `Dokumen ${docType} wajib ada sebelum melanjutkan ke tahap ${PAKET_STATUS_LABELS[targetStage]}`,
            severity: VALIDATION_SEVERITY.HARD_STOP,
            requiredDocument: docType
          });
        }
      });
    }

    // Check required attachments (warnings only)
    if (requirements.attachments && requirements.attachments.length > 0) {
      requirements.attachments.forEach(kategori => {
        const hasAttachment = lampiran.some(l => l.kategori === kategori);
        if (!hasAttachment) {
          results.warnings.push({
            code: `MISSING_ATTACHMENT_${kategori}`,
            message: `Lampiran ${kategori} belum diupload`,
            severity: VALIDATION_SEVERITY.WARNING,
            requiredAttachment: kategori
          });
        }
      });
    }
  },

  // ==================== PD STAGE VALIDATION ====================

  validatePDForStage: function(pd, targetStage) {
    const results = {
      validations: [],
      hardStops: [],
      warnings: []
    };

    switch (targetStage) {
      case 'SURAT_TUGAS':
        this._validatePDSuratTugas(pd, results);
        break;
      case 'SPPD':
        this._validatePDSPPD(pd, results);
        break;
      case 'PELAKSANAAN':
        this._validatePDPelaksanaan(pd, results);
        break;
      case 'PELAPORAN':
        this._validatePDPelaporan(pd, results);
        break;
      case 'PERTANGGUNGJAWABAN':
        this._validatePDPertanggungjawaban(pd, results);
        break;
      case 'SELESAI':
        this._validatePDSelesai(pd, results);
        break;
    }

    return results;
  },

  // ==================== PD STAGE VALIDATORS ====================

  _validatePDSuratTugas: function(pd, results) {
    // Required: Pelaksana
    if (!pd.pelaksana || pd.pelaksana.length === 0) {
      results.hardStops.push({
        code: 'NO_PELAKSANA',
        message: 'Minimal 1 pelaksana harus ditambahkan',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    } else {
      // Check pelaksana completeness
      const incomplete = pd.pelaksana.filter(p => !p.nama || !p.nip);
      if (incomplete.length > 0) {
        results.hardStops.push({
          code: 'INCOMPLETE_PELAKSANA',
          message: `${incomplete.length} pelaksana belum lengkap (nama dan NIP wajib)`,
          severity: VALIDATION_SEVERITY.HARD_STOP
        });
      }
    }

    // Required: Tujuan
    if (!pd.tujuan && !pd.maksudTujuan) {
      results.hardStops.push({
        code: 'NO_TUJUAN',
        message: 'Maksud/tujuan perjalanan wajib diisi',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Required: Tanggal
    if (!pd.tanggalBerangkat) {
      results.hardStops.push({
        code: 'NO_TANGGAL_BERANGKAT',
        message: 'Tanggal berangkat wajib diisi',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    if (!pd.tanggalKembali) {
      results.hardStops.push({
        code: 'NO_TANGGAL_KEMBALI',
        message: 'Tanggal kembali wajib diisi',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // DATE LOGIC: tanggalKembali >= tanggalBerangkat
    if (pd.tanggalBerangkat && pd.tanggalKembali) {
      const tglBerangkat = new Date(pd.tanggalBerangkat);
      const tglKembali = new Date(pd.tanggalKembali);
      if (tglKembali < tglBerangkat) {
        results.hardStops.push({
          code: 'INVALID_DATE_RANGE',
          message: 'Tanggal kembali tidak boleh sebelum tanggal berangkat',
          severity: VALIDATION_SEVERITY.HARD_STOP
        });
      }
    }
  },

  _validatePDSPPD: function(pd, results) {
    // Required: Nomor ST
    if (!pd.nomorST) {
      results.hardStops.push({
        code: 'NO_NOMOR_ST',
        message: 'Nomor Surat Tugas wajib diisi sebelum membuat SPPD',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Required: Tanggal ST
    if (!pd.tanggalST) {
      results.hardStops.push({
        code: 'NO_TANGGAL_ST',
        message: 'Tanggal Surat Tugas wajib diisi',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Check if ST document exists
    const hasST = pd.dokumen?.some(d => d.jenisDokumen === 'SURAT_TUGAS');
    if (!hasST) {
      results.warnings.push({
        code: 'NO_ST_DOCUMENT',
        message: 'Dokumen Surat Tugas belum dibuat',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  },

  _validatePDPelaksanaan: function(pd, results) {
    // For Luar Kota, SPPD is required
    if (pd.jenisPD === JENIS_PD.LUAR_KOTA || pd.jenisPD === 'LUAR_KOTA') {
      if (!pd.nomorSPPD) {
        results.hardStops.push({
          code: 'NO_NOMOR_SPPD',
          message: 'Nomor SPPD wajib diisi untuk perjalanan luar kota',
          severity: VALIDATION_SEVERITY.HARD_STOP
        });
      }
    }

    // DATE LOGIC: Cannot execute before tanggalBerangkat
    if (pd.tanggalBerangkat) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tglBerangkat = new Date(pd.tanggalBerangkat);
      tglBerangkat.setHours(0, 0, 0, 0);

      if (today < tglBerangkat) {
        results.warnings.push({
          code: 'EARLY_EXECUTION',
          message: `Perjalanan dijadwalkan mulai ${formatTanggalIndo(pd.tanggalBerangkat)}`,
          severity: VALIDATION_SEVERITY.WARNING
        });
      }
    }
  },

  _validatePDPelaporan: function(pd, results) {
    // DATE LOGIC: Travel should be completed
    if (pd.tanggalKembali) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tglKembali = new Date(pd.tanggalKembali);
      tglKembali.setHours(0, 0, 0, 0);

      if (today < tglKembali) {
        results.hardStops.push({
          code: 'TRAVEL_NOT_COMPLETED',
          message: `Perjalanan belum selesai (tanggal kembali: ${formatTanggalIndo(pd.tanggalKembali)})`,
          severity: VALIDATION_SEVERITY.HARD_STOP
        });
      }
    }
  },

  _validatePDPertanggungjawaban: function(pd, results) {
    // Required: Biaya detail
    if (!pd.biaya || pd.biaya.length === 0) {
      results.hardStops.push({
        code: 'NO_BIAYA_DETAIL',
        message: 'Rincian biaya perjalanan harus diinput',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Warning: Supporting documents
    const hasKwitansi = pd.lampiran?.some(l => l.kategori === 'KWITANSI');
    if (!hasKwitansi) {
      results.warnings.push({
        code: 'NO_KWITANSI',
        message: 'Bukti pengeluaran (kwitansi) belum diupload',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  },

  _validatePDSelesai: function(pd, results) {
    // Required: Total biaya calculated
    if (!pd.totalBiaya || pd.totalBiaya <= 0) {
      results.hardStops.push({
        code: 'NO_TOTAL_BIAYA',
        message: 'Total biaya perjalanan harus dihitung',
        severity: VALIDATION_SEVERITY.HARD_STOP
      });
    }

    // Check Kuitansi Rampung exists
    const hasKR = pd.dokumen?.some(d => d.jenisDokumen === 'KUITANSI_RAMPUNG');
    if (!hasKR) {
      results.warnings.push({
        code: 'NO_KUITANSI_RAMPUNG',
        message: 'Dokumen Kuitansi Rampung belum dibuat',
        severity: VALIDATION_SEVERITY.WARNING
      });
    }
  }
};

// ========================================
// AUDIT COMPLIANCE STATUS API
// ========================================

const AuditComplianceService = {

  // Get full compliance status for a Paket
  getPaketComplianceStatus: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const currentState = paket.status || 'DRAFT';
    const allStages = PaketStateMachine.STATES.filter(s => s !== 'BATAL');
    const currentIndex = allStages.indexOf(currentState);

    // Run compliance checks for all completed and current stages
    const stageCompliance = {};
    let overallIssues = { hardStops: 0, warnings: 0 };

    allStages.forEach((stage, idx) => {
      if (idx <= currentIndex) {
        const result = ComplianceValidator.validatePaketForStage(paket, stage);
        stageCompliance[stage] = {
          status: result.hardStops.length > 0 ? 'FAILED' : 'PASSED',
          hardStops: result.hardStops,
          warnings: result.warnings
        };
        overallIssues.hardStops += result.hardStops.length;
        overallIssues.warnings += result.warnings.length;
      } else {
        stageCompliance[stage] = { status: 'PENDING' };
      }
    });

    // Get existing compliance check
    const basicCompliance = ComplianceService.check(paketId);

    // Budget compliance summary
    const budgetCompliance = this._getBudgetComplianceSummary(paket);

    // Document compliance summary
    const documentCompliance = this._getDocumentComplianceSummary(paket);

    // Date compliance summary
    const dateCompliance = this._getDateComplianceSummary(paket);

    return {
      success: true,
      data: {
        paketId: paketId,
        namaPaket: paket.namaPaket,
        currentStatus: currentState,
        currentStatusLabel: PAKET_STATUS_LABELS[currentState],
        auditTimestamp: getTimestamp(),

        // Overall compliance
        overallCompliance: {
          isCompliant: overallIssues.hardStops === 0,
          score: basicCompliance.data?.complianceScore || 0,
          totalHardStops: overallIssues.hardStops,
          totalWarnings: overallIssues.warnings
        },

        // Stage-by-stage compliance
        stageCompliance: stageCompliance,

        // Category compliance
        budgetCompliance: budgetCompliance,
        documentCompliance: documentCompliance,
        dateCompliance: dateCompliance,

        // Detailed checks from basic compliance
        detailedChecks: basicCompliance.data?.checks || [],

        // Audit readiness
        auditReadiness: {
          isReady: overallIssues.hardStops === 0 && documentCompliance.isComplete,
          missingForAudit: this._getMissingForAudit(paket)
        }
      }
    };
  },

  // Get full compliance status for PD
  getPDComplianceStatus: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }

    const jenisPD = pd.jenisPD || JENIS_PD.LUAR_KOTA;
    const allStages = PDStateMachine.getStates(jenisPD).filter(s => s !== 'BATAL');
    const currentState = pd.status || 'DRAFT';
    const currentIndex = allStages.indexOf(currentState);

    const stageCompliance = {};
    let overallIssues = { hardStops: 0, warnings: 0 };

    allStages.forEach((stage, idx) => {
      if (idx <= currentIndex) {
        const result = ComplianceValidator.validatePDForStage(pd, stage);
        stageCompliance[stage] = {
          status: result.hardStops.length > 0 ? 'FAILED' : 'PASSED',
          hardStops: result.hardStops,
          warnings: result.warnings
        };
        overallIssues.hardStops += result.hardStops.length;
        overallIssues.warnings += result.warnings.length;
      } else {
        stageCompliance[stage] = { status: 'PENDING' };
      }
    });

    return {
      success: true,
      data: {
        pdId: pdId,
        jenisPD: jenisPD,
        jenisPDLabel: JENIS_PD_LABELS[jenisPD],
        currentStatus: currentState,
        currentStatusLabel: PD_STATUS_LABELS[currentState],
        auditTimestamp: getTimestamp(),

        overallCompliance: {
          isCompliant: overallIssues.hardStops === 0,
          totalHardStops: overallIssues.hardStops,
          totalWarnings: overallIssues.warnings
        },

        stageCompliance: stageCompliance,

        auditReadiness: {
          isReady: overallIssues.hardStops === 0,
          missingDocuments: this._getMissingPDDocuments(pd)
        }
      }
    };
  },

  // Helper: Get budget compliance summary
  _getBudgetComplianceSummary: function(paket) {
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);
    const issues = [];

    if (paket.paguAnggaran && paket.nilaiHPS) {
      if (paket.nilaiHPS > paket.paguAnggaran) {
        issues.push('HPS melebihi Pagu');
      }
    }

    if (paket.nilaiHPS && kontrak?.nilaiKontrak) {
      if (kontrak.nilaiKontrak > paket.nilaiHPS) {
        issues.push('Kontrak melebihi HPS');
      }
    }

    return {
      isCompliant: issues.length === 0,
      paguAnggaran: paket.paguAnggaran || 0,
      nilaiHPS: paket.nilaiHPS || 0,
      nilaiKontrak: kontrak?.nilaiKontrak || 0,
      issues: issues
    };
  },

  // Helper: Get document compliance summary
  _getDocumentComplianceSummary: function(paket) {
    const requiredDocs = ['HPS', 'SPK', 'BAST', 'KUITANSI'];
    const existingDocs = (paket.dokumen || []).map(d => d.jenisDokumen);

    const missing = requiredDocs.filter(doc => !existingDocs.includes(doc));

    return {
      isComplete: missing.length === 0,
      required: requiredDocs,
      existing: existingDocs,
      missing: missing
    };
  },

  // Helper: Get date compliance summary
  _getDateComplianceSummary: function(paket) {
    const kontrak = paket.kontrak || PaketService.getKontrak(paket.paketId);
    const serahTerima = paket.serahTerima || PaketService.getSerahTerima(paket.paketId);
    const issues = [];

    if (kontrak) {
      if (kontrak.tanggalMulai && kontrak.tanggalKontrak) {
        if (new Date(kontrak.tanggalMulai) < new Date(kontrak.tanggalKontrak)) {
          issues.push('Tanggal mulai sebelum tanggal kontrak');
        }
      }

      if (serahTerima && serahTerima.length > 0) {
        const bast = serahTerima[0];
        if (bast.tanggalBA && kontrak.tanggalMulai) {
          if (new Date(bast.tanggalBA) < new Date(kontrak.tanggalMulai)) {
            issues.push('Tanggal BAST sebelum tanggal mulai');
          }
        }
      }
    }

    return {
      isCompliant: issues.length === 0,
      issues: issues,
      timeline: {
        tanggalKontrak: kontrak?.tanggalKontrak,
        tanggalMulai: kontrak?.tanggalMulai,
        tanggalSelesai: kontrak?.tanggalSelesai,
        tanggalBAST: serahTerima?.[0]?.tanggalBA
      }
    };
  },

  // Helper: Get missing items for audit
  _getMissingForAudit: function(paket) {
    const missing = [];

    if (!paket.dokumen?.some(d => d.jenisDokumen === 'HPS')) {
      missing.push('Dokumen HPS');
    }
    if (!paket.dokumen?.some(d => d.jenisDokumen === 'SPK' || d.jenisDokumen === 'KONTRAK')) {
      missing.push('Dokumen SPK/Kontrak');
    }
    if (!paket.dokumen?.some(d => d.jenisDokumen === 'BAST')) {
      missing.push('Dokumen BAST');
    }
    if (!paket.dokumen?.some(d => d.jenisDokumen === 'KUITANSI')) {
      missing.push('Dokumen Kuitansi');
    }
    if (!paket.lampiran?.some(l => l.kategori === 'KAK')) {
      missing.push('KAK');
    }
    if (!paket.lampiran?.some(l => l.kategori === 'SURVEY')) {
      missing.push('Bukti Survey');
    }

    return missing;
  },

  // Helper: Get missing PD documents
  _getMissingPDDocuments: function(pd) {
    const missing = [];
    const isLuarKota = pd.jenisPD === JENIS_PD.LUAR_KOTA || pd.jenisPD === 'LUAR_KOTA';

    if (!pd.dokumen?.some(d => d.jenisDokumen === 'SURAT_TUGAS')) {
      missing.push('Surat Tugas');
    }
    if (isLuarKota && !pd.dokumen?.some(d => d.jenisDokumen === 'SPPD')) {
      missing.push('SPPD');
    }
    if (!pd.dokumen?.some(d => d.jenisDokumen === 'KUITANSI_RAMPUNG')) {
      missing.push('Kuitansi Rampung');
    }

    return missing;
  }
};

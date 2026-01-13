/**
 * 42_AuditSimulationService.gs
 * Sprint 5: Production & Audit Readiness
 *
 * Audit Simulation Mode
 * - BPK/APIP audit checklist simulation
 * - Kelengkapan dokumen
 * - Kesesuaian nilai (Pagu–HPS–Kontrak–SPM)
 * - Kesesuaian tanggal
 * - Alur workflow
 * - Audit Readiness Report generation
 */

// ========================================
// AUDIT CHECKLIST CATEGORIES
// ========================================

const AUDIT_CATEGORIES = {
  KELENGKAPAN_DOKUMEN: 'Kelengkapan Dokumen',
  KESESUAIAN_NILAI: 'Kesesuaian Nilai',
  KESESUAIAN_TANGGAL: 'Kesesuaian Tanggal',
  ALUR_WORKFLOW: 'Alur Workflow',
  ADMINISTRASI: 'Administrasi',
  KEPATUHAN: 'Kepatuhan Regulasi'
};

const AUDIT_SEVERITY = {
  CRITICAL: 'CRITICAL',   // Must fix - will cause audit finding
  WARNING: 'WARNING',     // Should fix - potential audit finding
  INFO: 'INFO'           // Informational - best practice
};

// ========================================
// AUDIT SIMULATION SERVICE
// ========================================

const AuditSimulationService = {

  /**
   * Run full audit simulation for a paket
   */
  simulateAuditPaket: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const findings = [];
    const checklist = [];
    let score = 100;

    // 1. Document completeness check
    const docCheck = this.checkDocumentCompleteness(paket);
    checklist.push(...docCheck.checklist);
    findings.push(...docCheck.findings);
    score -= docCheck.deductions;

    // 2. Value consistency check
    const valueCheck = this.checkValueConsistency(paket);
    checklist.push(...valueCheck.checklist);
    findings.push(...valueCheck.findings);
    score -= valueCheck.deductions;

    // 3. Date sequence check
    const dateCheck = this.checkDateSequence(paket);
    checklist.push(...dateCheck.checklist);
    findings.push(...dateCheck.findings);
    score -= dateCheck.deductions;

    // 4. Workflow compliance check
    const workflowCheck = this.checkWorkflowCompliance(paket);
    checklist.push(...workflowCheck.checklist);
    findings.push(...workflowCheck.findings);
    score -= workflowCheck.deductions;

    // 5. Administrative check
    const adminCheck = this.checkAdministrative(paket);
    checklist.push(...adminCheck.checklist);
    findings.push(...adminCheck.findings);
    score -= adminCheck.deductions;

    // Calculate final score
    score = Math.max(0, Math.min(100, score));

    const criticalCount = findings.filter(f => f.severity === AUDIT_SEVERITY.CRITICAL).length;
    const warningCount = findings.filter(f => f.severity === AUDIT_SEVERITY.WARNING).length;

    // Determine readiness status
    let readinessStatus = 'READY';
    if (criticalCount > 0) {
      readinessStatus = 'NOT_READY';
    } else if (warningCount > 3) {
      readinessStatus = 'NEEDS_ATTENTION';
    } else if (warningCount > 0) {
      readinessStatus = 'MOSTLY_READY';
    }

    return {
      success: true,
      data: {
        paketId: paketId,
        namaPaket: paket.namaPaket,
        status: paket.status,
        nilaiKontrak: paket.nilaiKontrak || paket.pagu,
        auditDate: new Date().toISOString(),
        readinessStatus: readinessStatus,
        score: score,
        summary: {
          totalChecks: checklist.length,
          passed: checklist.filter(c => c.passed).length,
          failed: checklist.filter(c => !c.passed).length,
          criticalFindings: criticalCount,
          warningFindings: warningCount,
          infoFindings: findings.filter(f => f.severity === AUDIT_SEVERITY.INFO).length
        },
        checklist: checklist,
        findings: findings.sort((a, b) => {
          const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
        recommendations: this.generateRecommendations(findings)
      }
    };
  },

  /**
   * Check document completeness
   */
  checkDocumentCompleteness: function(paket) {
    const checklist = [];
    const findings = [];
    let deductions = 0;

    // Required documents based on workflow stage
    const requiredDocs = this.getRequiredDocuments(paket.status);

    // Get existing documents
    const existingDocs = DocumentTemplateService ? DocumentTemplateService.getPaketDocuments(paket.paketId) : [];
    const existingDocTypes = existingDocs.map(d => d.jenisDokumen);

    requiredDocs.forEach(docType => {
      const exists = existingDocTypes.includes(docType.code);
      checklist.push({
        category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
        item: docType.name,
        description: docType.description,
        passed: exists,
        required: docType.required
      });

      if (!exists && docType.required) {
        findings.push({
          category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
          severity: AUDIT_SEVERITY.CRITICAL,
          title: `Dokumen ${docType.name} tidak ditemukan`,
          description: `Dokumen ${docType.name} wajib ada untuk tahap ${paket.status}`,
          recommendation: `Segera buat/upload dokumen ${docType.name}`
        });
        deductions += 10;
      } else if (!exists && !docType.required) {
        findings.push({
          category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
          severity: AUDIT_SEVERITY.INFO,
          title: `Dokumen ${docType.name} tidak ada`,
          description: `Dokumen ${docType.name} disarankan untuk kelengkapan`,
          recommendation: `Pertimbangkan untuk membuat dokumen ${docType.name}`
        });
      }
    });

    return { checklist, findings, deductions };
  },

  /**
   * Check value consistency (Pagu → HPS → Kontrak → SPM)
   */
  checkValueConsistency: function(paket) {
    const checklist = [];
    const findings = [];
    let deductions = 0;

    const pagu = parseFloat(paket.pagu) || 0;
    const hps = parseFloat(paket.nilaiHPS) || 0;
    const kontrak = parseFloat(paket.nilaiKontrak) || 0;

    // Get pembayaran total
    const pembayaran = PaketService.getPembayaran ? PaketService.getPembayaran(paket.paketId) : [];
    const totalPembayaran = pembayaran.reduce((sum, p) => sum + (parseFloat(p.nilaiSPM) || 0), 0);

    // Check 1: HPS <= Pagu
    checklist.push({
      category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
      item: 'HPS ≤ Pagu',
      description: 'Nilai HPS tidak boleh melebihi Pagu',
      passed: hps <= pagu || hps === 0,
      values: { pagu, hps }
    });

    if (hps > pagu && hps > 0) {
      findings.push({
        category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
        severity: AUDIT_SEVERITY.CRITICAL,
        title: 'HPS melebihi Pagu',
        description: `HPS (${formatRupiahDoc(hps)}) > Pagu (${formatRupiahDoc(pagu)})`,
        recommendation: 'Revisi nilai HPS atau ajukan tambahan Pagu'
      });
      deductions += 15;
    }

    // Check 2: Kontrak <= HPS (or <= Pagu if HPS not set)
    const kontrakLimit = hps > 0 ? hps : pagu;
    checklist.push({
      category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
      item: 'Kontrak ≤ HPS/Pagu',
      description: 'Nilai Kontrak tidak boleh melebihi HPS atau Pagu',
      passed: kontrak <= kontrakLimit || kontrak === 0,
      values: { kontrak, limit: kontrakLimit }
    });

    if (kontrak > kontrakLimit && kontrak > 0) {
      findings.push({
        category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
        severity: AUDIT_SEVERITY.CRITICAL,
        title: 'Kontrak melebihi HPS/Pagu',
        description: `Kontrak (${formatRupiahDoc(kontrak)}) > Limit (${formatRupiahDoc(kontrakLimit)})`,
        recommendation: 'Periksa kembali nilai kontrak dan negosiasi ulang jika perlu'
      });
      deductions += 15;
    }

    // Check 3: Total Pembayaran <= Kontrak
    checklist.push({
      category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
      item: 'Total SPM ≤ Kontrak',
      description: 'Total pembayaran tidak boleh melebihi nilai kontrak',
      passed: totalPembayaran <= kontrak || kontrak === 0,
      values: { totalPembayaran, kontrak }
    });

    if (totalPembayaran > kontrak && kontrak > 0) {
      findings.push({
        category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
        severity: AUDIT_SEVERITY.CRITICAL,
        title: 'Total Pembayaran melebihi Kontrak',
        description: `Total SPM (${formatRupiahDoc(totalPembayaran)}) > Kontrak (${formatRupiahDoc(kontrak)})`,
        recommendation: 'Periksa riwayat pembayaran dan ajukan addendum jika perlu'
      });
      deductions += 20;
    }

    // Check 4: Efficiency ratio
    if (kontrak > 0 && hps > 0) {
      const efficiency = ((hps - kontrak) / hps * 100).toFixed(2);
      checklist.push({
        category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
        item: 'Efisiensi Pengadaan',
        description: 'Rasio efisiensi dari HPS ke nilai kontrak',
        passed: true,
        values: { efficiency: efficiency + '%' }
      });

      if (parseFloat(efficiency) < 0) {
        findings.push({
          category: AUDIT_CATEGORIES.KESESUAIAN_NILAI,
          severity: AUDIT_SEVERITY.WARNING,
          title: 'Efisiensi Negatif',
          description: `Kontrak lebih tinggi dari HPS (efisiensi: ${efficiency}%)`,
          recommendation: 'Dokumentasikan justifikasi kenaikan nilai'
        });
        deductions += 5;
      }
    }

    return { checklist, findings, deductions };
  },

  /**
   * Check date sequence
   */
  checkDateSequence: function(paket) {
    const checklist = [];
    const findings = [];
    let deductions = 0;

    const dates = {
      perencanaan: paket.tanggalPerencanaan ? new Date(paket.tanggalPerencanaan) : null,
      hps: paket.tanggalHPS ? new Date(paket.tanggalHPS) : null,
      pengadaan: paket.tanggalPengadaan ? new Date(paket.tanggalPengadaan) : null,
      kontrak: paket.tanggalKontrak ? new Date(paket.tanggalKontrak) : null,
      serahTerima: paket.tanggalSerahTerima ? new Date(paket.tanggalSerahTerima) : null
    };

    // Sequence checks
    const sequences = [
      { from: 'perencanaan', to: 'hps', label: 'Perencanaan → HPS' },
      { from: 'hps', to: 'pengadaan', label: 'HPS → Pengadaan' },
      { from: 'pengadaan', to: 'kontrak', label: 'Pengadaan → Kontrak' },
      { from: 'kontrak', to: 'serahTerima', label: 'Kontrak → Serah Terima' }
    ];

    sequences.forEach(seq => {
      const fromDate = dates[seq.from];
      const toDate = dates[seq.to];

      if (fromDate && toDate) {
        const passed = fromDate <= toDate;
        checklist.push({
          category: AUDIT_CATEGORIES.KESESUAIAN_TANGGAL,
          item: seq.label,
          description: `Tanggal ${seq.from} harus sebelum ${seq.to}`,
          passed: passed,
          values: {
            [seq.from]: fromDate.toISOString().split('T')[0],
            [seq.to]: toDate.toISOString().split('T')[0]
          }
        });

        if (!passed) {
          findings.push({
            category: AUDIT_CATEGORIES.KESESUAIAN_TANGGAL,
            severity: AUDIT_SEVERITY.WARNING,
            title: `Urutan tanggal tidak valid: ${seq.label}`,
            description: `Tanggal ${seq.to} lebih awal dari ${seq.from}`,
            recommendation: 'Periksa dan perbaiki input tanggal'
          });
          deductions += 5;
        }
      }
    });

    // Check tahun anggaran
    const tahunAnggaran = paket.tahunAnggaran || new Date().getFullYear();
    const allDates = Object.values(dates).filter(d => d);

    allDates.forEach(date => {
      if (date.getFullYear() !== tahunAnggaran) {
        findings.push({
          category: AUDIT_CATEGORIES.KESESUAIAN_TANGGAL,
          severity: AUDIT_SEVERITY.INFO,
          title: 'Tanggal di luar tahun anggaran',
          description: `Ada tanggal di tahun ${date.getFullYear()}, bukan ${tahunAnggaran}`,
          recommendation: 'Pastikan ini sesuai dengan ketentuan lintas tahun anggaran'
        });
      }
    });

    return { checklist, findings, deductions };
  },

  /**
   * Check workflow compliance
   */
  checkWorkflowCompliance: function(paket) {
    const checklist = [];
    const findings = [];
    let deductions = 0;

    // Check if workflow stages are followed
    const workflowStatus = PaketStateMachine ? PaketStateMachine.getWorkflowStatus(paket.status) : null;

    if (workflowStatus) {
      checklist.push({
        category: AUDIT_CATEGORIES.ALUR_WORKFLOW,
        item: 'Status Workflow Valid',
        description: 'Paket berada di tahap workflow yang valid',
        passed: true,
        values: { status: paket.status, progress: workflowStatus.progress }
      });

      // Check for skipped stages
      if (workflowStatus.skippedStages && workflowStatus.skippedStages.length > 0) {
        findings.push({
          category: AUDIT_CATEGORIES.ALUR_WORKFLOW,
          severity: AUDIT_SEVERITY.WARNING,
          title: 'Ada tahap yang dilewati',
          description: `Tahap dilewati: ${workflowStatus.skippedStages.join(', ')}`,
          recommendation: 'Pastikan ada justifikasi untuk melewati tahap'
        });
        deductions += 5;
      }
    }

    // Check mandatory data per stage
    const stageRequirements = {
      'KONTRAK': ['namaPenyedia', 'nomorKontrak', 'nilaiKontrak', 'tanggalKontrak'],
      'PELAKSANAAN': ['nomorSPMK', 'tanggalSPMK'],
      'SERAH_TERIMA': ['tanggalSerahTerima'],
      'PEMBAYARAN': ['nomorSPM', 'nilaiSPM'],
      'SELESAI': ['tanggalSelesai']
    };

    const currentStageReqs = stageRequirements[paket.status] || [];
    currentStageReqs.forEach(field => {
      const hasValue = paket[field] && paket[field] !== '';
      checklist.push({
        category: AUDIT_CATEGORIES.ALUR_WORKFLOW,
        item: `Data ${field}`,
        description: `Field ${field} wajib diisi untuk tahap ${paket.status}`,
        passed: hasValue
      });

      if (!hasValue) {
        findings.push({
          category: AUDIT_CATEGORIES.ALUR_WORKFLOW,
          severity: AUDIT_SEVERITY.WARNING,
          title: `Data ${field} belum diisi`,
          description: `Field ${field} wajib untuk tahap ${paket.status}`,
          recommendation: `Lengkapi data ${field}`
        });
        deductions += 3;
      }
    });

    return { checklist, findings, deductions };
  },

  /**
   * Check administrative requirements
   */
  checkAdministrative: function(paket) {
    const checklist = [];
    const findings = [];
    let deductions = 0;

    // Check basic info
    const basicFields = ['namaPaket', 'pagu', 'tahunAnggaran', 'metodePengadaan'];
    basicFields.forEach(field => {
      const hasValue = paket[field] && paket[field] !== '';
      checklist.push({
        category: AUDIT_CATEGORIES.ADMINISTRASI,
        item: `Data ${field}`,
        description: `Field ${field} harus terisi`,
        passed: hasValue
      });

      if (!hasValue) {
        findings.push({
          category: AUDIT_CATEGORIES.ADMINISTRASI,
          severity: AUDIT_SEVERITY.WARNING,
          title: `Data ${field} kosong`,
          description: `Field ${field} tidak boleh kosong`,
          recommendation: `Isi data ${field}`
        });
        deductions += 2;
      }
    });

    // Check penyedia if kontrak stage or beyond
    const kontrakStages = ['KONTRAK', 'PELAKSANAAN', 'SERAH_TERIMA', 'PEMBAYARAN', 'SELESAI'];
    if (kontrakStages.includes(paket.status)) {
      const hasPenyedia = paket.penyediaId || paket.namaPenyedia;
      checklist.push({
        category: AUDIT_CATEGORIES.ADMINISTRASI,
        item: 'Data Penyedia',
        description: 'Penyedia harus sudah ditetapkan',
        passed: hasPenyedia
      });

      if (!hasPenyedia) {
        findings.push({
          category: AUDIT_CATEGORIES.ADMINISTRASI,
          severity: AUDIT_SEVERITY.CRITICAL,
          title: 'Penyedia belum ditetapkan',
          description: 'Paket sudah tahap kontrak tapi penyedia belum ada',
          recommendation: 'Tetapkan penyedia terlebih dahulu'
        });
        deductions += 10;
      }
    }

    return { checklist, findings, deductions };
  },

  /**
   * Get required documents for workflow stage
   */
  getRequiredDocuments: function(status) {
    const allDocs = {
      DRAFT: [],
      PERENCANAAN: [
        { code: 'KAK', name: 'Kerangka Acuan Kerja', required: true, description: 'Dokumen perencanaan kebutuhan' }
      ],
      HPS: [
        { code: 'KAK', name: 'Kerangka Acuan Kerja', required: true, description: 'Dokumen perencanaan kebutuhan' },
        { code: 'HPS', name: 'Harga Perkiraan Sendiri', required: true, description: 'Dokumen perhitungan HPS' }
      ],
      PENGADAAN: [
        { code: 'KAK', name: 'Kerangka Acuan Kerja', required: true, description: 'Dokumen perencanaan kebutuhan' },
        { code: 'HPS', name: 'Harga Perkiraan Sendiri', required: true, description: 'Dokumen perhitungan HPS' },
        { code: 'PENETAPAN_PENYEDIA', name: 'Penetapan Penyedia', required: false, description: 'Surat penetapan penyedia' }
      ],
      KONTRAK: [
        { code: 'KAK', name: 'Kerangka Acuan Kerja', required: true, description: 'Dokumen perencanaan kebutuhan' },
        { code: 'HPS', name: 'Harga Perkiraan Sendiri', required: true, description: 'Dokumen perhitungan HPS' },
        { code: 'PENETAPAN_PENYEDIA', name: 'Penetapan Penyedia', required: true, description: 'Surat penetapan penyedia' },
        { code: 'SPK', name: 'Surat Perjanjian Kerja', required: true, description: 'Dokumen kontrak' }
      ],
      PELAKSANAAN: [
        { code: 'SPK', name: 'Surat Perjanjian Kerja', required: true, description: 'Dokumen kontrak' },
        { code: 'SPMK', name: 'Surat Perintah Mulai Kerja', required: true, description: 'Perintah mulai kerja' }
      ],
      SERAH_TERIMA: [
        { code: 'BAST', name: 'Berita Acara Serah Terima', required: true, description: 'Dokumen serah terima' }
      ],
      PEMBAYARAN: [
        { code: 'BAST', name: 'Berita Acara Serah Terima', required: true, description: 'Dokumen serah terima' },
        { code: 'KUITANSI', name: 'Kuitansi/Invoice', required: true, description: 'Bukti tagihan' }
      ],
      SELESAI: [
        { code: 'BAST', name: 'Berita Acara Serah Terima', required: true, description: 'Dokumen serah terima' },
        { code: 'KUITANSI', name: 'Kuitansi/Invoice', required: true, description: 'Bukti tagihan' }
      ]
    };

    return allDocs[status] || [];
  },

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations: function(findings) {
    const recommendations = [];

    // Group by category
    const byCategory = {};
    findings.forEach(f => {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f);
    });

    // Generate priority recommendations
    Object.keys(byCategory).forEach(category => {
      const catFindings = byCategory[category];
      const critical = catFindings.filter(f => f.severity === AUDIT_SEVERITY.CRITICAL);
      const warnings = catFindings.filter(f => f.severity === AUDIT_SEVERITY.WARNING);

      if (critical.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          category: category,
          title: `Perbaiki ${critical.length} temuan kritikal di ${category}`,
          items: critical.map(c => c.recommendation)
        });
      }

      if (warnings.length > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          category: category,
          title: `Perhatikan ${warnings.length} peringatan di ${category}`,
          items: warnings.map(w => w.recommendation)
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  /**
   * Run audit simulation for Perjalanan Dinas
   */
  simulateAuditPD: function(pdId) {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan Dinas tidak ditemukan' };
    }

    const findings = [];
    const checklist = [];
    let score = 100;

    // Check pelaksana
    if (!pd.pelaksana || pd.pelaksana.length === 0) {
      findings.push({
        category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
        severity: AUDIT_SEVERITY.CRITICAL,
        title: 'Data Pelaksana tidak ada',
        description: 'Perjalanan dinas harus memiliki minimal 1 pelaksana',
        recommendation: 'Tambahkan data pelaksana'
      });
      score -= 20;
    }

    // Check biaya
    if (!pd.biaya || pd.biaya.length === 0) {
      findings.push({
        category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
        severity: AUDIT_SEVERITY.WARNING,
        title: 'Rincian biaya kosong',
        description: 'Sebaiknya isi rincian biaya perjalanan dinas',
        recommendation: 'Lengkapi rincian biaya'
      });
      score -= 10;
    }

    // Check documents
    const dokumen = pd.dokumen || [];
    const requiredPDDocs = ['SURAT_TUGAS', 'SPPD'];
    if (pd.status === 'SELESAI' || pd.status === 'PERTANGGUNGJAWABAN') {
      requiredPDDocs.push('KUITANSI_RAMPUNG');
    }

    requiredPDDocs.forEach(docType => {
      const exists = dokumen.some(d => d.jenisDokumen === docType);
      checklist.push({
        category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
        item: docType,
        passed: exists
      });

      if (!exists) {
        findings.push({
          category: AUDIT_CATEGORIES.KELENGKAPAN_DOKUMEN,
          severity: AUDIT_SEVERITY.WARNING,
          title: `Dokumen ${docType} belum dibuat`,
          recommendation: `Generate dokumen ${docType}`
        });
        score -= 5;
      }
    });

    // Check dates
    if (pd.tanggalBerangkat && pd.tanggalKembali) {
      const tglBerangkat = new Date(pd.tanggalBerangkat);
      const tglKembali = new Date(pd.tanggalKembali);

      if (tglKembali < tglBerangkat) {
        findings.push({
          category: AUDIT_CATEGORIES.KESESUAIAN_TANGGAL,
          severity: AUDIT_SEVERITY.CRITICAL,
          title: 'Tanggal kembali lebih awal dari tanggal berangkat',
          recommendation: 'Perbaiki input tanggal'
        });
        score -= 15;
      }
    }

    score = Math.max(0, score);

    return {
      success: true,
      data: {
        pdId: pdId,
        tujuan: pd.tujuan || pd.maksudTujuan,
        status: pd.status,
        auditDate: new Date().toISOString(),
        score: score,
        readinessStatus: score >= 80 ? 'READY' : score >= 60 ? 'NEEDS_ATTENTION' : 'NOT_READY',
        checklist: checklist,
        findings: findings
      }
    };
  },

  /**
   * Generate Audit Readiness Report (Google Doc)
   */
  generateAuditReadinessReport: function(paketId) {
    const auditResult = this.simulateAuditPaket(paketId);
    if (!auditResult.success) {
      return auditResult;
    }

    try {
      const config = ConfigService.getConfig();
      const data = auditResult.data;
      const doc = DocumentApp.create('Audit Readiness Report - ' + data.namaPaket);
      const body = doc.getBody();

      // Title
      const title = body.appendParagraph('LAPORAN KESIAPAN AUDIT');
      title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // Info
      body.appendParagraph('Nama Paket: ' + data.namaPaket);
      body.appendParagraph('Status: ' + data.status);
      body.appendParagraph('Nilai: Rp ' + formatRupiahDoc(data.nilaiKontrak));
      body.appendParagraph('Tanggal Simulasi: ' + formatTanggalIndo(data.auditDate));
      body.appendParagraph('');

      // Summary
      const summaryTitle = body.appendParagraph('RINGKASAN');
      summaryTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

      body.appendParagraph('Skor Kesiapan: ' + data.score + '%');
      body.appendParagraph('Status: ' + data.readinessStatus);
      body.appendParagraph('Total Pemeriksaan: ' + data.summary.totalChecks);
      body.appendParagraph('Lulus: ' + data.summary.passed);
      body.appendParagraph('Gagal: ' + data.summary.failed);
      body.appendParagraph('Temuan Kritikal: ' + data.summary.criticalFindings);
      body.appendParagraph('Peringatan: ' + data.summary.warningFindings);
      body.appendParagraph('');

      // Findings
      if (data.findings.length > 0) {
        const findingsTitle = body.appendParagraph('TEMUAN AUDIT');
        findingsTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        data.findings.forEach((f, idx) => {
          body.appendParagraph((idx + 1) + '. [' + f.severity + '] ' + f.title).setBold(true);
          body.appendParagraph('   Kategori: ' + f.category);
          body.appendParagraph('   ' + f.description);
          body.appendParagraph('   Rekomendasi: ' + f.recommendation);
          body.appendParagraph('');
        });
      }

      // Recommendations
      if (data.recommendations.length > 0) {
        const recTitle = body.appendParagraph('REKOMENDASI');
        recTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        data.recommendations.forEach(rec => {
          body.appendParagraph('[' + rec.priority + '] ' + rec.title).setBold(true);
          rec.items.forEach(item => {
            body.appendParagraph('   • ' + item);
          });
          body.appendParagraph('');
        });
      }

      doc.saveAndClose();

      // Move to folder
      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Audit_Reports');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return {
        success: true,
        data: {
          ...auditResult.data,
          reportDocId: doc.getId(),
          reportUrl: doc.getUrl()
        }
      };

    } catch (e) {
      console.error('Error generating audit report:', e);
      return { success: false, error: 'Gagal membuat laporan: ' + e.message };
    }
  }
};

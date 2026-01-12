/**
 * 31_ReportingService.gs
 * Advanced Reporting & Audit Bundle Service
 * Sprint 3: Legal-grade Document Templates & Advanced Reporting
 *
 * Features:
 * - Paket Summary Report (per tahun)
 * - Contract vs Payment Analysis
 * - Audit Bundle (ZIP all docs per Paket)
 * - Compliance Dashboard Data
 */

// ========================================
// REPORTING SERVICE
// ========================================

const ReportingService = {

  // ==================== PAKET SUMMARY REPORT ====================
  /**
   * Generate comprehensive Paket summary per tahun
   * @param {number} tahun - Fiscal year
   * @param {Object} options - Additional filters
   */
  getPaketSummary: function(tahun, options = {}) {
    try {
      tahun = tahun || new Date().getFullYear();

      // Get all paket for the year
      const allPaket = PaketService.getAll({
        tahunAnggaran: tahun,
        limit: 10000
      });

      if (!allPaket.success) {
        return allPaket;
      }

      const paketList = allPaket.data.items || [];

      // Summary statistics
      const summary = {
        tahun: tahun,
        generatedAt: getTimestamp(),

        // Overall counts
        totalPaket: paketList.length,
        paketByStatus: {},
        paketByJenis: {},
        paketByMetode: {},

        // Financial summary
        totalPagu: 0,
        totalHPS: 0,
        totalKontrak: 0,
        totalTerbayar: 0,
        totalSisaAnggaran: 0,

        // Progress tracking
        paketSelesai: 0,
        paketBerjalan: 0,
        paketDraft: 0,
        paketBatal: 0,

        // Compliance
        paketCompliant: 0,
        paketNonCompliant: 0,
        avgComplianceScore: 0,

        // Monthly distribution
        perBulan: Array(12).fill(null).map(() => ({
          paket: 0,
          pagu: 0,
          kontrak: 0,
          terbayar: 0
        })),

        // Detailed list
        detail: []
      };

      let totalComplianceScore = 0;
      let complianceCount = 0;

      paketList.forEach(paket => {
        // Status distribution
        summary.paketByStatus[paket.status] = (summary.paketByStatus[paket.status] || 0) + 1;

        // Jenis distribution
        const jenis = paket.jenisPengadaan || 'LAINNYA';
        summary.paketByJenis[jenis] = (summary.paketByJenis[jenis] || 0) + 1;

        // Metode distribution
        const metode = paket.metodePengadaan || 'LAINNYA';
        summary.paketByMetode[metode] = (summary.paketByMetode[metode] || 0) + 1;

        // Financial totals
        const pagu = parseFloat(paket.paguAnggaran) || 0;
        const hps = parseFloat(paket.nilaiHPS) || 0;
        const kontrak = parseFloat(paket.nilaiKontrak || paket.kontrak?.nilaiKontrak) || 0;
        const terbayar = this._getTotalPembayaran(paket);

        summary.totalPagu += pagu;
        summary.totalHPS += hps;
        summary.totalKontrak += kontrak;
        summary.totalTerbayar += terbayar;

        // Progress tracking
        if (['SELESAI', 'DIBAYAR'].includes(paket.status)) {
          summary.paketSelesai++;
        } else if (paket.status === 'BATAL') {
          summary.paketBatal++;
        } else if (paket.status === 'DRAFT') {
          summary.paketDraft++;
        } else {
          summary.paketBerjalan++;
        }

        // Compliance check
        const compliance = AuditComplianceService.getPaketComplianceStatus(paket.paketId);
        if (compliance.success) {
          if (compliance.data.isCompliant) {
            summary.paketCompliant++;
          } else {
            summary.paketNonCompliant++;
          }
          totalComplianceScore += compliance.data.complianceScore || 0;
          complianceCount++;
        }

        // Monthly distribution (based on kontrak date or created date)
        const paketDate = new Date(paket.tanggalKontrak || paket.createdAt);
        if (paketDate.getFullYear() === tahun) {
          const month = paketDate.getMonth();
          summary.perBulan[month].paket++;
          summary.perBulan[month].pagu += pagu;
          summary.perBulan[month].kontrak += kontrak;
          summary.perBulan[month].terbayar += terbayar;
        }

        // Detail
        summary.detail.push({
          paketId: paket.paketId,
          namaPaket: paket.namaPaket,
          jenisPengadaan: jenis,
          metodePengadaan: metode,
          status: paket.status,
          pagu: pagu,
          hps: hps,
          kontrak: kontrak,
          terbayar: terbayar,
          sisaKontrak: kontrak - terbayar,
          progress: kontrak > 0 ? Math.round((terbayar / kontrak) * 100) : 0
        });
      });

      // Calculate averages and remaining
      summary.totalSisaAnggaran = summary.totalPagu - summary.totalKontrak;
      summary.avgComplianceScore = complianceCount > 0
        ? Math.round(totalComplianceScore / complianceCount)
        : 0;

      // Calculate percentages
      summary.percentageRealized = summary.totalPagu > 0
        ? Math.round((summary.totalKontrak / summary.totalPagu) * 100)
        : 0;
      summary.percentagePaid = summary.totalKontrak > 0
        ? Math.round((summary.totalTerbayar / summary.totalKontrak) * 100)
        : 0;

      return {
        success: true,
        data: summary
      };

    } catch (e) {
      console.error('Error generating Paket summary:', e);
      return { success: false, error: 'Gagal membuat laporan: ' + e.message };
    }
  },

  // ==================== CONTRACT VS PAYMENT ANALYSIS ====================
  /**
   * Analyze contract values vs actual payments
   * @param {Object} options - Filter options
   */
  getContractVsPayment: function(options = {}) {
    try {
      const tahun = options.tahun || new Date().getFullYear();

      const allPaket = PaketService.getAll({
        tahunAnggaran: tahun,
        limit: 10000
      });

      if (!allPaket.success) {
        return allPaket;
      }

      const paketList = allPaket.data.items || [];

      const analysis = {
        tahun: tahun,
        generatedAt: getTimestamp(),

        // Summary
        totalKontrak: 0,
        totalTagihan: 0,
        totalTerbayar: 0,
        totalOutstanding: 0,

        // Contract status
        kontrakBelumBayar: [],
        kontrakSebagianBayar: [],
        kontrakLunas: [],
        kontrakOverpaid: [],

        // Payment timeline
        onTimePayments: 0,
        latePayments: 0,
        pendingPayments: 0,

        // By payment method
        byPaymentType: {
          TUNAI: { count: 0, total: 0 },
          TRANSFER: { count: 0, total: 0 },
          CEKGIRO: { count: 0, total: 0 }
        },

        // Monthly cash flow
        cashFlow: Array(12).fill(null).map(() => ({
          kontrak: 0,
          pembayaran: 0
        })),

        // Detailed records
        detail: []
      };

      paketList.forEach(paket => {
        const kontrak = paket.kontrak;
        if (!kontrak || !kontrak.nilaiKontrak) return;

        const nilaiKontrak = parseFloat(kontrak.nilaiKontrak) || 0;
        const pembayaranList = paket.pembayaran || [];

        let totalPaid = 0;
        let totalTagihan = 0;

        pembayaranList.forEach(p => {
          const netto = parseFloat(p.nilaiNetto) || 0;
          totalPaid += netto;
          totalTagihan += parseFloat(p.nilaiTagihan) || 0;

          // Payment type analysis
          const payType = p.caraPembayaran || 'TRANSFER';
          if (analysis.byPaymentType[payType]) {
            analysis.byPaymentType[payType].count++;
            analysis.byPaymentType[payType].total += netto;
          }

          // Payment timing
          if (p.status === 'LUNAS' || p.status === 'DIBAYAR') {
            const kontrakDate = new Date(kontrak.tanggalKontrak);
            const payDate = new Date(p.tanggalBayar || p.tanggalTagihan);
            const daysDiff = Math.ceil((payDate - kontrakDate) / (1000 * 60 * 60 * 24));

            if (daysDiff <= 30) {
              analysis.onTimePayments++;
            } else {
              analysis.latePayments++;
            }
          } else {
            analysis.pendingPayments++;
          }

          // Monthly cash flow
          if (p.tanggalBayar) {
            const bayarDate = new Date(p.tanggalBayar);
            if (bayarDate.getFullYear() === tahun) {
              analysis.cashFlow[bayarDate.getMonth()].pembayaran += netto;
            }
          }
        });

        // Contract monthly distribution
        const kontrakDate = new Date(kontrak.tanggalKontrak);
        if (kontrakDate.getFullYear() === tahun) {
          analysis.cashFlow[kontrakDate.getMonth()].kontrak += nilaiKontrak;
        }

        // Summary totals
        analysis.totalKontrak += nilaiKontrak;
        analysis.totalTagihan += totalTagihan;
        analysis.totalTerbayar += totalPaid;

        // Contract payment status
        const percentPaid = nilaiKontrak > 0 ? (totalPaid / nilaiKontrak) * 100 : 0;
        const outstanding = nilaiKontrak - totalPaid;

        const kontrakRecord = {
          paketId: paket.paketId,
          namaPaket: paket.namaPaket,
          nomorKontrak: kontrak.nomorKontrak,
          tanggalKontrak: kontrak.tanggalKontrak,
          nilaiKontrak: nilaiKontrak,
          totalTerbayar: totalPaid,
          outstanding: outstanding,
          percentPaid: Math.round(percentPaid * 10) / 10,
          jumlahPembayaran: pembayaranList.length,
          status: paket.status
        };

        if (percentPaid === 0) {
          analysis.kontrakBelumBayar.push(kontrakRecord);
        } else if (percentPaid > 100) {
          analysis.kontrakOverpaid.push(kontrakRecord);
        } else if (percentPaid >= 100) {
          analysis.kontrakLunas.push(kontrakRecord);
        } else {
          analysis.kontrakSebagianBayar.push(kontrakRecord);
        }

        analysis.detail.push(kontrakRecord);
      });

      analysis.totalOutstanding = analysis.totalKontrak - analysis.totalTerbayar;

      // Summary counts
      analysis.summary = {
        totalKontrak: analysis.detail.length,
        belumBayar: analysis.kontrakBelumBayar.length,
        sebagianBayar: analysis.kontrakSebagianBayar.length,
        lunas: analysis.kontrakLunas.length,
        overpaid: analysis.kontrakOverpaid.length,
        percentageRealized: analysis.totalKontrak > 0
          ? Math.round((analysis.totalTerbayar / analysis.totalKontrak) * 100)
          : 0
      };

      return {
        success: true,
        data: analysis
      };

    } catch (e) {
      console.error('Error generating Contract vs Payment analysis:', e);
      return { success: false, error: 'Gagal membuat analisis: ' + e.message };
    }
  },

  // ==================== AUDIT BUNDLE (ZIP) ====================
  /**
   * Generate ZIP bundle containing all documents for a Paket
   * @param {string} paketId - Paket ID
   * @param {Object} options - Bundle options
   */
  generateAuditBundle: function(paketId, options = {}) {
    try {
      const paket = PaketService.getById(paketId);
      if (!paket) {
        return { success: false, error: 'Paket tidak ditemukan' };
      }

      // Get all documents for this paket
      const docsSheet = getSpreadsheet().getSheetByName('DokumenPaket');
      const documents = [];

      if (docsSheet) {
        const data = docsSheet.getDataRange().getValues();
        const headers = data[0];

        for (let i = 1; i < data.length; i++) {
          const row = {};
          headers.forEach((h, idx) => row[h] = data[i][idx]);

          if (row.paketId === paketId && row.googleDocId) {
            documents.push(row);
          }
        }
      }

      // Create bundle folder
      const bundleFolderName = `AuditBundle_${paketId}_${getTimestamp().replace(/[:\s]/g, '-')}`;
      const parentFolder = getOrCreateFolder('Audit_Bundles');
      const bundleFolder = parentFolder.createFolder(bundleFolderName);

      // Copy all documents to bundle folder
      const bundledDocs = [];

      documents.forEach(doc => {
        try {
          const file = DriveApp.getFileById(doc.googleDocId);
          const copiedFile = file.makeCopy(
            `${doc.jenisDokumen}_${doc.nomorDokumen || doc.docId}`,
            bundleFolder
          );

          // Also create PDF version
          const pdfBlob = copiedFile.getAs('application/pdf');
          const pdfFile = bundleFolder.createFile(pdfBlob);
          pdfFile.setName(`${doc.jenisDokumen}_${doc.nomorDokumen || doc.docId}.pdf`);

          bundledDocs.push({
            docId: doc.docId,
            jenisDokumen: doc.jenisDokumen,
            nomorDokumen: doc.nomorDokumen,
            originalUrl: doc.googleDocUrl,
            bundleDocUrl: copiedFile.getUrl(),
            bundlePdfUrl: pdfFile.getUrl()
          });
        } catch (e) {
          console.error(`Error copying doc ${doc.docId}:`, e);
        }
      });

      // Create index/manifest file
      const manifest = this._createBundleManifest(paket, bundledDocs, bundleFolder);

      // Create compliance report
      const complianceReport = AuditComplianceService.getPaketComplianceStatus(paketId);
      if (complianceReport.success) {
        const complianceDoc = this._createComplianceReportDoc(paket, complianceReport.data, bundleFolder);
        bundledDocs.push({
          jenisDokumen: 'COMPLIANCE_REPORT',
          bundleDocUrl: complianceDoc.getUrl()
        });
      }

      // Bundle URL
      const bundleUrl = bundleFolder.getUrl();

      // Save bundle record
      ensureSheet('AuditBundles', [
        'bundleId', 'paketId', 'namaPaket', 'bundleFolderId', 'bundleFolderUrl',
        'documentCount', 'generatedAt', 'generatedBy'
      ]);

      const bundleId = generateId('BND');
      getSpreadsheet().getSheetByName('AuditBundles').appendRow([
        bundleId,
        paketId,
        paket.namaPaket,
        bundleFolder.getId(),
        bundleUrl,
        bundledDocs.length,
        getTimestamp(),
        ''
      ]);

      return {
        success: true,
        data: {
          bundleId: bundleId,
          paketId: paketId,
          namaPaket: paket.namaPaket,
          bundleFolderUrl: bundleUrl,
          documentCount: bundledDocs.length,
          documents: bundledDocs,
          manifestUrl: manifest.getUrl(),
          generatedAt: getTimestamp()
        }
      };

    } catch (e) {
      console.error('Error generating audit bundle:', e);
      return { success: false, error: 'Gagal membuat audit bundle: ' + e.message };
    }
  },

  // ==================== COMPLIANCE DASHBOARD ====================
  /**
   * Get compliance dashboard data
   * @param {Object} options - Filter options
   */
  getComplianceDashboard: function(options = {}) {
    try {
      const tahun = options.tahun || new Date().getFullYear();

      const allPaket = PaketService.getAll({
        tahunAnggaran: tahun,
        limit: 10000
      });

      if (!allPaket.success) {
        return allPaket;
      }

      const paketList = allPaket.data.items || [];

      const dashboard = {
        tahun: tahun,
        generatedAt: getTimestamp(),

        // Overall compliance
        totalPaket: paketList.length,
        compliant: 0,
        nonCompliant: 0,
        warnings: 0,
        avgScore: 0,

        // By violation type
        violationsByType: {},

        // Critical issues
        hardStops: [],

        // Top warnings
        topWarnings: [],

        // Paket requiring attention
        requiresAttention: [],

        // Score distribution
        scoreDistribution: {
          excellent: 0,  // 90-100
          good: 0,       // 70-89
          fair: 0,       // 50-69
          poor: 0        // 0-49
        }
      };

      let totalScore = 0;

      paketList.forEach(paket => {
        const compliance = AuditComplianceService.getPaketComplianceStatus(paket.paketId);

        if (!compliance.success) return;

        const data = compliance.data;
        const score = data.complianceScore || 0;

        totalScore += score;

        if (data.isCompliant) {
          dashboard.compliant++;
        } else {
          dashboard.nonCompliant++;
        }

        // Count warnings
        const warningCount = data.violations?.filter(v => v.severity === 'WARNING').length || 0;
        dashboard.warnings += warningCount;

        // Violations by type
        (data.violations || []).forEach(v => {
          dashboard.violationsByType[v.code] = (dashboard.violationsByType[v.code] || 0) + 1;

          if (v.severity === 'HARD_STOP') {
            dashboard.hardStops.push({
              paketId: paket.paketId,
              namaPaket: paket.namaPaket,
              violation: v
            });
          }
        });

        // Score distribution
        if (score >= 90) {
          dashboard.scoreDistribution.excellent++;
        } else if (score >= 70) {
          dashboard.scoreDistribution.good++;
        } else if (score >= 50) {
          dashboard.scoreDistribution.fair++;
        } else {
          dashboard.scoreDistribution.poor++;
        }

        // Paket requiring attention (score < 70 or has hard stops)
        if (score < 70 || data.violations?.some(v => v.severity === 'HARD_STOP')) {
          dashboard.requiresAttention.push({
            paketId: paket.paketId,
            namaPaket: paket.namaPaket,
            status: paket.status,
            score: score,
            hardStopCount: data.violations?.filter(v => v.severity === 'HARD_STOP').length || 0,
            warningCount: warningCount
          });
        }
      });

      dashboard.avgScore = paketList.length > 0
        ? Math.round(totalScore / paketList.length)
        : 0;

      // Sort violations by frequency
      dashboard.topWarnings = Object.entries(dashboard.violationsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, count]) => ({ code, count }));

      // Sort requires attention by score
      dashboard.requiresAttention.sort((a, b) => a.score - b.score);

      return {
        success: true,
        data: dashboard
      };

    } catch (e) {
      console.error('Error generating compliance dashboard:', e);
      return { success: false, error: 'Gagal membuat dashboard: ' + e.message };
    }
  },

  // ==================== PERJALANAN DINAS SUMMARY ====================
  /**
   * Generate summary report for Perjalanan Dinas
   * @param {number} tahun - Fiscal year
   */
  getPDSummary: function(tahun, options = {}) {
    try {
      tahun = tahun || new Date().getFullYear();

      const allPD = PerjalananDinasService.getAll({
        tahunAnggaran: tahun,
        limit: 10000
      });

      if (!allPD.success) {
        return allPD;
      }

      const pdList = allPD.data.items || [];

      const summary = {
        tahun: tahun,
        generatedAt: getTimestamp(),

        // Counts
        totalPD: pdList.length,
        pdByStatus: {},
        pdByJenis: {
          DALAM_KOTA: 0,
          LUAR_KOTA: 0
        },

        // Financial
        totalAnggaran: 0,
        totalRealisasi: 0,
        totalSisa: 0,

        // By component
        byKomponen: {
          transport: 0,
          uangHarian: 0,
          penginapan: 0,
          representasi: 0,
          lainnya: 0
        },

        // Monthly distribution
        perBulan: Array(12).fill(null).map(() => ({
          pd: 0,
          anggaran: 0,
          realisasi: 0
        })),

        // Top destinations
        topDestinations: {},

        // Detail
        detail: []
      };

      pdList.forEach(pd => {
        // Status distribution
        summary.pdByStatus[pd.status] = (summary.pdByStatus[pd.status] || 0) + 1;

        // Jenis distribution
        const jenis = pd.jenisPD || 'LUAR_KOTA';
        summary.pdByJenis[jenis] = (summary.pdByJenis[jenis] || 0) + 1;

        // Financial
        const anggaran = parseFloat(pd.totalAnggaran) || 0;
        const realisasi = parseFloat(pd.totalRealisasi || pd.totalBiaya) || 0;

        summary.totalAnggaran += anggaran;
        summary.totalRealisasi += realisasi;

        // By component
        const biaya = pd.biaya || {};
        summary.byKomponen.transport += parseFloat(biaya.transport) || 0;
        summary.byKomponen.uangHarian += parseFloat(biaya.uangHarian) || 0;
        summary.byKomponen.penginapan += parseFloat(biaya.penginapan) || 0;
        summary.byKomponen.representasi += parseFloat(biaya.representasi) || 0;
        summary.byKomponen.lainnya += parseFloat(biaya.lainnya) || 0;

        // Monthly distribution
        const pdDate = new Date(pd.tanggalMulai || pd.createdAt);
        if (pdDate.getFullYear() === tahun) {
          const month = pdDate.getMonth();
          summary.perBulan[month].pd++;
          summary.perBulan[month].anggaran += anggaran;
          summary.perBulan[month].realisasi += realisasi;
        }

        // Destinations
        const dest = pd.kotaTujuan || pd.tujuan || 'Tidak Diketahui';
        summary.topDestinations[dest] = (summary.topDestinations[dest] || 0) + 1;

        // Detail
        summary.detail.push({
          pdId: pd.pdId,
          nomorST: pd.nomorST,
          pelaksana: pd.namaPelaksana,
          tujuan: dest,
          jenis: jenis,
          tanggalMulai: pd.tanggalMulai,
          tanggalSelesai: pd.tanggalSelesai,
          anggaran: anggaran,
          realisasi: realisasi,
          status: pd.status
        });
      });

      summary.totalSisa = summary.totalAnggaran - summary.totalRealisasi;

      // Sort destinations
      summary.topDestinations = Object.entries(summary.topDestinations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([dest, count]) => ({ destination: dest, count }));

      return {
        success: true,
        data: summary
      };

    } catch (e) {
      console.error('Error generating PD summary:', e);
      return { success: false, error: 'Gagal membuat laporan PD: ' + e.message };
    }
  },

  // ==================== EXPORT TO SPREADSHEET ====================
  /**
   * Export report data to a new spreadsheet
   * @param {string} reportType - Type of report
   * @param {Object} data - Report data
   */
  exportToSpreadsheet: function(reportType, data) {
    try {
      const ss = SpreadsheetApp.create(`Laporan_${reportType}_${getTimestamp().split(' ')[0]}`);

      switch (reportType) {
        case 'PAKET_SUMMARY':
          this._exportPaketSummary(ss, data);
          break;
        case 'CONTRACT_PAYMENT':
          this._exportContractPayment(ss, data);
          break;
        case 'PD_SUMMARY':
          this._exportPDSummary(ss, data);
          break;
        case 'COMPLIANCE':
          this._exportCompliance(ss, data);
          break;
      }

      // Move to reports folder
      const file = DriveApp.getFileById(ss.getId());
      const folder = getOrCreateFolder('Laporan');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      return {
        success: true,
        data: {
          spreadsheetId: ss.getId(),
          url: ss.getUrl(),
          name: ss.getName()
        }
      };

    } catch (e) {
      console.error('Error exporting to spreadsheet:', e);
      return { success: false, error: 'Gagal export: ' + e.message };
    }
  },

  // ==================== PRIVATE HELPERS ====================

  _getTotalPembayaran: function(paket) {
    if (!paket.pembayaran || !Array.isArray(paket.pembayaran)) return 0;
    return paket.pembayaran.reduce((sum, p) => sum + (parseFloat(p.nilaiNetto) || 0), 0);
  },

  _createBundleManifest: function(paket, documents, folder) {
    const doc = DocumentApp.create(`MANIFEST_${paket.paketId}`);
    const body = doc.getBody();

    body.appendParagraph('AUDIT BUNDLE MANIFEST').setBold(true).setFontSize(16);
    body.appendParagraph('═'.repeat(50));
    body.appendParagraph('');

    body.appendParagraph(`Paket ID: ${paket.paketId}`);
    body.appendParagraph(`Nama Paket: ${paket.namaPaket}`);
    body.appendParagraph(`Generated: ${getTimestamp()}`);
    body.appendParagraph('');

    body.appendParagraph('DAFTAR DOKUMEN:').setBold(true);
    body.appendParagraph('');

    documents.forEach((doc, idx) => {
      body.appendParagraph(`${idx + 1}. ${doc.jenisDokumen}`);
      if (doc.nomorDokumen) {
        body.appendParagraph(`   Nomor: ${doc.nomorDokumen}`);
      }
    });

    body.appendParagraph('');
    body.appendParagraph('═'.repeat(50));
    body.appendParagraph('Dokumen ini di-generate secara otomatis oleh sistem PPK');

    doc.saveAndClose();

    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);

    return file;
  },

  _createComplianceReportDoc: function(paket, complianceData, folder) {
    const doc = DocumentApp.create(`COMPLIANCE_REPORT_${paket.paketId}`);
    const body = doc.getBody();

    body.appendParagraph('LAPORAN KEPATUHAN').setBold(true).setFontSize(16);
    body.appendParagraph('═'.repeat(50));
    body.appendParagraph('');

    body.appendParagraph(`Paket: ${paket.namaPaket}`);
    body.appendParagraph(`Status Kepatuhan: ${complianceData.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    body.appendParagraph(`Skor: ${complianceData.complianceScore}%`);
    body.appendParagraph('');

    if (complianceData.violations && complianceData.violations.length > 0) {
      body.appendParagraph('PELANGGARAN:').setBold(true);
      complianceData.violations.forEach(v => {
        body.appendParagraph(`• [${v.severity}] ${v.code}: ${v.message}`);
      });
    } else {
      body.appendParagraph('Tidak ada pelanggaran ditemukan.');
    }

    body.appendParagraph('');
    body.appendParagraph('Kelengkapan Dokumen:').setBold(true);
    if (complianceData.documentCompleteness) {
      Object.entries(complianceData.documentCompleteness).forEach(([key, val]) => {
        body.appendParagraph(`• ${key}: ${val ? '✓' : '✗'}`);
      });
    }

    doc.saveAndClose();

    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(folder);

    return file;
  },

  _exportPaketSummary: function(ss, data) {
    // Summary sheet
    const summarySheet = ss.getActiveSheet();
    summarySheet.setName('Ringkasan');

    summarySheet.getRange('A1').setValue('LAPORAN RINGKASAN PAKET').setFontWeight('bold').setFontSize(14);
    summarySheet.getRange('A2').setValue(`Tahun Anggaran: ${data.tahun}`);
    summarySheet.getRange('A3').setValue(`Generated: ${data.generatedAt}`);

    const summaryData = [
      ['Metrik', 'Nilai'],
      ['Total Paket', data.totalPaket],
      ['Total Pagu', data.totalPagu],
      ['Total HPS', data.totalHPS],
      ['Total Kontrak', data.totalKontrak],
      ['Total Terbayar', data.totalTerbayar],
      ['Sisa Anggaran', data.totalSisaAnggaran],
      ['% Realisasi', data.percentageRealized + '%'],
      ['% Pembayaran', data.percentagePaid + '%'],
      ['Paket Selesai', data.paketSelesai],
      ['Paket Berjalan', data.paketBerjalan],
      ['Paket Draft', data.paketDraft],
      ['Paket Batal', data.paketBatal],
      ['Avg Compliance Score', data.avgComplianceScore + '%']
    ];

    summarySheet.getRange(5, 1, summaryData.length, 2).setValues(summaryData);

    // Detail sheet
    const detailSheet = ss.insertSheet('Detail Paket');
    const headers = ['Paket ID', 'Nama Paket', 'Jenis', 'Metode', 'Status', 'Pagu', 'HPS', 'Kontrak', 'Terbayar', 'Sisa', 'Progress'];
    detailSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    if (data.detail && data.detail.length > 0) {
      const detailData = data.detail.map(d => [
        d.paketId, d.namaPaket, d.jenisPengadaan, d.metodePengadaan, d.status,
        d.pagu, d.hps, d.kontrak, d.terbayar, d.sisaKontrak, d.progress + '%'
      ]);
      detailSheet.getRange(2, 1, detailData.length, headers.length).setValues(detailData);
    }
  },

  _exportContractPayment: function(ss, data) {
    const summarySheet = ss.getActiveSheet();
    summarySheet.setName('Contract vs Payment');

    summarySheet.getRange('A1').setValue('ANALISIS KONTRAK VS PEMBAYARAN').setFontWeight('bold').setFontSize(14);
    summarySheet.getRange('A2').setValue(`Tahun: ${data.tahun}`);

    const summaryData = [
      ['Metrik', 'Nilai'],
      ['Total Nilai Kontrak', data.totalKontrak],
      ['Total Terbayar', data.totalTerbayar],
      ['Outstanding', data.totalOutstanding],
      ['% Realisasi', data.summary.percentageRealized + '%'],
      ['Kontrak Belum Bayar', data.summary.belumBayar],
      ['Kontrak Sebagian Bayar', data.summary.sebagianBayar],
      ['Kontrak Lunas', data.summary.lunas]
    ];

    summarySheet.getRange(4, 1, summaryData.length, 2).setValues(summaryData);

    // Detail sheet
    const detailSheet = ss.insertSheet('Detail');
    const headers = ['Paket ID', 'Nama Paket', 'No Kontrak', 'Nilai Kontrak', 'Terbayar', 'Outstanding', '% Bayar', 'Jml Pembayaran', 'Status'];
    detailSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    if (data.detail && data.detail.length > 0) {
      const detailData = data.detail.map(d => [
        d.paketId, d.namaPaket, d.nomorKontrak, d.nilaiKontrak, d.totalTerbayar,
        d.outstanding, d.percentPaid + '%', d.jumlahPembayaran, d.status
      ]);
      detailSheet.getRange(2, 1, detailData.length, headers.length).setValues(detailData);
    }
  },

  _exportPDSummary: function(ss, data) {
    const summarySheet = ss.getActiveSheet();
    summarySheet.setName('Ringkasan PD');

    summarySheet.getRange('A1').setValue('LAPORAN PERJALANAN DINAS').setFontWeight('bold').setFontSize(14);
    summarySheet.getRange('A2').setValue(`Tahun: ${data.tahun}`);

    const summaryData = [
      ['Metrik', 'Nilai'],
      ['Total PD', data.totalPD],
      ['Dalam Kota', data.pdByJenis.DALAM_KOTA],
      ['Luar Kota', data.pdByJenis.LUAR_KOTA],
      ['Total Anggaran', data.totalAnggaran],
      ['Total Realisasi', data.totalRealisasi],
      ['Sisa', data.totalSisa]
    ];

    summarySheet.getRange(4, 1, summaryData.length, 2).setValues(summaryData);

    // Detail
    const detailSheet = ss.insertSheet('Detail PD');
    const headers = ['PD ID', 'Nomor ST', 'Pelaksana', 'Tujuan', 'Jenis', 'Tgl Mulai', 'Tgl Selesai', 'Anggaran', 'Realisasi', 'Status'];
    detailSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    if (data.detail && data.detail.length > 0) {
      const detailData = data.detail.map(d => [
        d.pdId, d.nomorST, d.pelaksana, d.tujuan, d.jenis,
        d.tanggalMulai, d.tanggalSelesai, d.anggaran, d.realisasi, d.status
      ]);
      detailSheet.getRange(2, 1, detailData.length, headers.length).setValues(detailData);
    }
  },

  _exportCompliance: function(ss, data) {
    const summarySheet = ss.getActiveSheet();
    summarySheet.setName('Compliance Dashboard');

    summarySheet.getRange('A1').setValue('DASHBOARD KEPATUHAN').setFontWeight('bold').setFontSize(14);
    summarySheet.getRange('A2').setValue(`Tahun: ${data.tahun}`);

    const summaryData = [
      ['Metrik', 'Nilai'],
      ['Total Paket', data.totalPaket],
      ['Compliant', data.compliant],
      ['Non-Compliant', data.nonCompliant],
      ['Total Warnings', data.warnings],
      ['Avg Score', data.avgScore + '%'],
      ['Excellent (90-100)', data.scoreDistribution.excellent],
      ['Good (70-89)', data.scoreDistribution.good],
      ['Fair (50-69)', data.scoreDistribution.fair],
      ['Poor (0-49)', data.scoreDistribution.poor]
    ];

    summarySheet.getRange(4, 1, summaryData.length, 2).setValues(summaryData);

    // Requires attention sheet
    if (data.requiresAttention && data.requiresAttention.length > 0) {
      const attentionSheet = ss.insertSheet('Requires Attention');
      const headers = ['Paket ID', 'Nama Paket', 'Status', 'Score', 'Hard Stops', 'Warnings'];
      attentionSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

      const attentionData = data.requiresAttention.map(d => [
        d.paketId, d.namaPaket, d.status, d.score + '%', d.hardStopCount, d.warningCount
      ]);
      attentionSheet.getRange(2, 1, attentionData.length, headers.length).setValues(attentionData);
    }
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format rupiah for documents (without Rp prefix)
 */
function formatRupiahDoc(value) {
  if (!value && value !== 0) return '-';
  return parseInt(value).toLocaleString('id-ID');
}

/**
 * Format tanggal Indonesia
 */
function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const hari = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];

  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Convert number to words (Indonesian)
 */
function terbilangClean(angka) {
  const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

  angka = Math.abs(parseInt(angka));

  if (angka < 12) {
    return bilangan[angka];
  } else if (angka < 20) {
    return terbilangClean(angka - 10) + ' belas';
  } else if (angka < 100) {
    return terbilangClean(Math.floor(angka / 10)) + ' puluh ' + terbilangClean(angka % 10);
  } else if (angka < 200) {
    return 'seratus ' + terbilangClean(angka - 100);
  } else if (angka < 1000) {
    return terbilangClean(Math.floor(angka / 100)) + ' ratus ' + terbilangClean(angka % 100);
  } else if (angka < 2000) {
    return 'seribu ' + terbilangClean(angka - 1000);
  } else if (angka < 1000000) {
    return terbilangClean(Math.floor(angka / 1000)) + ' ribu ' + terbilangClean(angka % 1000);
  } else if (angka < 1000000000) {
    return terbilangClean(Math.floor(angka / 1000000)) + ' juta ' + terbilangClean(angka % 1000000);
  } else if (angka < 1000000000000) {
    return terbilangClean(Math.floor(angka / 1000000000)) + ' miliar ' + terbilangClean(angka % 1000000000);
  } else if (angka < 1000000000000000) {
    return terbilangClean(Math.floor(angka / 1000000000000)) + ' triliun ' + terbilangClean(angka % 1000000000000);
  }

  return angka.toString();
}

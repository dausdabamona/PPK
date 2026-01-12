/**
 * 12_ComplianceService.gs
 * Compliance Checking and Validation Service
 */

const ComplianceService = {

  // ==================== CHECK PAKET COMPLIANCE ====================
  check: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const checks = [];
    let overallScore = 0;
    let maxScore = 0;

    // ========== BASIC INFO CHECKS ==========
    const basicInfo = this.checkBasicInfo(paket);
    checks.push(...basicInfo.checks);
    overallScore += basicInfo.score;
    maxScore += basicInfo.maxScore;

    // ========== ITEMS CHECKS ==========
    const itemsCheck = this.checkItems(paket);
    checks.push(...itemsCheck.checks);
    overallScore += itemsCheck.score;
    maxScore += itemsCheck.maxScore;

    // ========== SURVEY CHECKS ==========
    const surveyCheck = this.checkSurvey(paket);
    checks.push(...surveyCheck.checks);
    overallScore += surveyCheck.score;
    maxScore += surveyCheck.maxScore;

    // ========== HPS CHECKS ==========
    const hpsCheck = this.checkHPS(paket);
    checks.push(...hpsCheck.checks);
    overallScore += hpsCheck.score;
    maxScore += hpsCheck.maxScore;

    // ========== DOCUMENT CHECKS ==========
    const docCheck = this.checkDocuments(paket);
    checks.push(...docCheck.checks);
    overallScore += docCheck.score;
    maxScore += docCheck.maxScore;

    // ========== CONTRACT CHECKS ==========
    if (['KONTRAK', 'PELAKSANAAN', 'SERAH_TERIMA', 'PEMBAYARAN', 'SELESAI'].includes(paket.status)) {
      const kontrakCheck = this.checkKontrak(paket);
      checks.push(...kontrakCheck.checks);
      overallScore += kontrakCheck.score;
      maxScore += kontrakCheck.maxScore;
    }

    // ========== PAYMENT CHECKS ==========
    if (['PEMBAYARAN', 'SELESAI'].includes(paket.status)) {
      const paymentCheck = this.checkPayment(paket);
      checks.push(...paymentCheck.checks);
      overallScore += paymentCheck.score;
      maxScore += paymentCheck.maxScore;
    }

    const compliancePercentage = maxScore > 0 ? Math.round((overallScore / maxScore) * 100) : 0;
    const warnings = checks.filter(c => c.status === 'WARNING');
    const errors = checks.filter(c => c.status === 'ERROR');
    const passed = checks.filter(c => c.status === 'PASS');

    return {
      success: true,
      data: {
        paketId: paketId,
        namaPaket: paket.namaPaket,
        status: paket.status,
        complianceScore: compliancePercentage,
        totalChecks: checks.length,
        passed: passed.length,
        warnings: warnings.length,
        errors: errors.length,
        isCompliant: errors.length === 0,
        checks: checks,
        summary: this.getSummary(compliancePercentage, errors.length, warnings.length)
      }
    };
  },

  // ========== CHECK BASIC INFO ==========
  checkBasicInfo: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 5;

    // Nama paket
    if (paket.namaPaket && paket.namaPaket.trim().length >= 10) {
      checks.push({ category: 'INFO_DASAR', item: 'Nama Paket', status: 'PASS', message: 'Nama paket sudah diisi dengan lengkap' });
      score += 1;
    } else if (paket.namaPaket) {
      checks.push({ category: 'INFO_DASAR', item: 'Nama Paket', status: 'WARNING', message: 'Nama paket terlalu pendek' });
      score += 0.5;
    } else {
      checks.push({ category: 'INFO_DASAR', item: 'Nama Paket', status: 'ERROR', message: 'Nama paket belum diisi' });
    }

    // Jenis pengadaan
    if (paket.jenisPengadaan && JENIS_PENGADAAN[paket.jenisPengadaan]) {
      checks.push({ category: 'INFO_DASAR', item: 'Jenis Pengadaan', status: 'PASS', message: 'Jenis pengadaan valid' });
      score += 1;
    } else {
      checks.push({ category: 'INFO_DASAR', item: 'Jenis Pengadaan', status: 'ERROR', message: 'Jenis pengadaan tidak valid' });
    }

    // Metode pengadaan
    if (paket.metodePengadaan && METODE_PENGADAAN[paket.metodePengadaan]) {
      checks.push({ category: 'INFO_DASAR', item: 'Metode Pengadaan', status: 'PASS', message: 'Metode pengadaan valid' });
      score += 1;
    } else {
      checks.push({ category: 'INFO_DASAR', item: 'Metode Pengadaan', status: 'ERROR', message: 'Metode pengadaan tidak valid' });
    }

    // Pagu anggaran
    if (paket.paguAnggaran && paket.paguAnggaran > 0) {
      checks.push({ category: 'INFO_DASAR', item: 'Pagu Anggaran', status: 'PASS', message: 'Pagu anggaran sudah diisi' });
      score += 1;
    } else {
      checks.push({ category: 'INFO_DASAR', item: 'Pagu Anggaran', status: 'WARNING', message: 'Pagu anggaran belum diisi' });
    }

    // Sumber dana
    if (paket.sumberDana || paket.mak) {
      checks.push({ category: 'INFO_DASAR', item: 'Sumber Dana', status: 'PASS', message: 'Sumber dana/MAK sudah diisi' });
      score += 1;
    } else {
      checks.push({ category: 'INFO_DASAR', item: 'Sumber Dana', status: 'WARNING', message: 'Sumber dana/MAK belum diisi' });
      score += 0.5;
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK ITEMS ==========
  checkItems: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 4;

    const items = paket.items || [];

    if (items.length === 0) {
      checks.push({ category: 'ITEMS', item: 'Daftar Item', status: 'WARNING', message: 'Belum ada item barang/jasa' });
      return { checks, score, maxScore };
    }

    // Check item count
    checks.push({ category: 'ITEMS', item: 'Jumlah Item', status: 'PASS', message: `${items.length} item terdaftar` });
    score += 1;

    // Check item completeness
    let incompleteItems = 0;
    items.forEach((item, idx) => {
      if (!item.namaBarang || !item.satuan || !item.volume) {
        incompleteItems++;
      }
    });

    if (incompleteItems === 0) {
      checks.push({ category: 'ITEMS', item: 'Kelengkapan Item', status: 'PASS', message: 'Semua item lengkap' });
      score += 1;
    } else {
      checks.push({ category: 'ITEMS', item: 'Kelengkapan Item', status: 'WARNING', message: `${incompleteItems} item tidak lengkap` });
      score += 0.5;
    }

    // Check item prices
    const itemsWithPrice = items.filter(i => i.hargaSatuan > 0).length;
    if (itemsWithPrice === items.length) {
      checks.push({ category: 'ITEMS', item: 'Harga Item', status: 'PASS', message: 'Semua item memiliki harga' });
      score += 1;
    } else {
      checks.push({ category: 'ITEMS', item: 'Harga Item', status: 'WARNING', message: `${items.length - itemsWithPrice} item belum ada harga` });
    }

    // Check total value
    const totalValue = items.reduce((sum, i) => sum + (i.hargaTotal || 0), 0);
    if (totalValue > 0) {
      checks.push({ category: 'ITEMS', item: 'Total Nilai', status: 'PASS', message: `Total: Rp ${formatRupiahDoc(totalValue)}` });
      score += 1;
    } else {
      checks.push({ category: 'ITEMS', item: 'Total Nilai', status: 'WARNING', message: 'Total nilai item 0' });
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK SURVEY ==========
  checkSurvey: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 3;

    const surveyStatus = SurveyService.getSummaryForPaket(paket.paketId);

    if (surveyStatus.totalItems === 0) {
      return { checks, score, maxScore };
    }

    // Check survey coverage
    const coveragePercent = Math.round((surveyStatus.itemsWithSurvey / surveyStatus.totalItems) * 100);
    if (coveragePercent === 100) {
      checks.push({ category: 'SURVEY', item: 'Cakupan Survey', status: 'PASS', message: 'Semua item sudah disurvey' });
      score += 1;
    } else if (coveragePercent >= 50) {
      checks.push({ category: 'SURVEY', item: 'Cakupan Survey', status: 'WARNING', message: `${coveragePercent}% item sudah disurvey` });
      score += 0.5;
    } else {
      checks.push({ category: 'SURVEY', item: 'Cakupan Survey', status: 'ERROR', message: `Hanya ${coveragePercent}% item sudah disurvey` });
    }

    // Check survey selection
    const selectionPercent = Math.round((surveyStatus.itemsWithSelected / surveyStatus.totalItems) * 100);
    if (selectionPercent === 100) {
      checks.push({ category: 'SURVEY', item: 'Pemilihan Survey', status: 'PASS', message: 'Semua item sudah dipilih surveynya' });
      score += 1;
    } else if (selectionPercent >= 50) {
      checks.push({ category: 'SURVEY', item: 'Pemilihan Survey', status: 'WARNING', message: `${selectionPercent}% item sudah dipilih` });
      score += 0.5;
    } else {
      checks.push({ category: 'SURVEY', item: 'Pemilihan Survey', status: 'ERROR', message: `Hanya ${selectionPercent}% item sudah dipilih` });
    }

    // Check minimum survey per item (should have at least 2-3 for comparison)
    if (surveyStatus.totalSurveys >= surveyStatus.totalItems * 2) {
      checks.push({ category: 'SURVEY', item: 'Jumlah Survey', status: 'PASS', message: 'Cukup data pembanding' });
      score += 1;
    } else if (surveyStatus.totalSurveys >= surveyStatus.totalItems) {
      checks.push({ category: 'SURVEY', item: 'Jumlah Survey', status: 'WARNING', message: 'Disarankan min. 2 survey per item' });
      score += 0.5;
    } else {
      checks.push({ category: 'SURVEY', item: 'Jumlah Survey', status: 'WARNING', message: 'Kurang data pembanding' });
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK HPS ==========
  checkHPS: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 3;

    // Check HPS value
    if (paket.nilaiHPS && paket.nilaiHPS > 0) {
      checks.push({ category: 'HPS', item: 'Nilai HPS', status: 'PASS', message: `HPS: Rp ${formatRupiahDoc(paket.nilaiHPS)}` });
      score += 1;
    } else {
      checks.push({ category: 'HPS', item: 'Nilai HPS', status: 'WARNING', message: 'HPS belum dihitung' });
    }

    // Check HPS vs Pagu
    if (paket.nilaiHPS && paket.paguAnggaran) {
      const ratio = (paket.nilaiHPS / paket.paguAnggaran) * 100;
      if (ratio <= 100) {
        checks.push({ category: 'HPS', item: 'HPS vs Pagu', status: 'PASS', message: `HPS ${ratio.toFixed(1)}% dari pagu` });
        score += 1;
      } else {
        checks.push({ category: 'HPS', item: 'HPS vs Pagu', status: 'ERROR', message: `HPS melebihi pagu (${ratio.toFixed(1)}%)` });
      }
    }

    // Check HPS document
    const hasHPSDoc = paket.dokumen?.some(d => d.jenisDokumen === 'HPS');
    if (hasHPSDoc) {
      checks.push({ category: 'HPS', item: 'Dokumen HPS', status: 'PASS', message: 'Dokumen HPS sudah dibuat' });
      score += 1;
    } else {
      checks.push({ category: 'HPS', item: 'Dokumen HPS', status: 'WARNING', message: 'Dokumen HPS belum dibuat' });
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK DOCUMENTS ==========
  checkDocuments: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 3;

    const lampiran = paket.lampiran || [];
    const dokumen = paket.dokumen || [];

    // Check KAK
    const hasKAK = lampiran.some(l => l.kategori === 'KAK');
    if (hasKAK) {
      checks.push({ category: 'DOKUMEN', item: 'KAK', status: 'PASS', message: 'KAK sudah diupload' });
      score += 1;
    } else {
      checks.push({ category: 'DOKUMEN', item: 'KAK', status: 'WARNING', message: 'KAK belum diupload' });
    }

    // Check bukti survey
    const hasSurveyDoc = lampiran.some(l => l.kategori === 'SURVEY');
    if (hasSurveyDoc) {
      checks.push({ category: 'DOKUMEN', item: 'Bukti Survey', status: 'PASS', message: 'Bukti survey sudah diupload' });
      score += 1;
    } else {
      checks.push({ category: 'DOKUMEN', item: 'Bukti Survey', status: 'WARNING', message: 'Bukti survey belum diupload' });
    }

    // Check total attachments
    if (lampiran.length >= 3) {
      checks.push({ category: 'DOKUMEN', item: 'Kelengkapan Lampiran', status: 'PASS', message: `${lampiran.length} lampiran terupload` });
      score += 1;
    } else if (lampiran.length >= 1) {
      checks.push({ category: 'DOKUMEN', item: 'Kelengkapan Lampiran', status: 'WARNING', message: `Hanya ${lampiran.length} lampiran` });
      score += 0.5;
    } else {
      checks.push({ category: 'DOKUMEN', item: 'Kelengkapan Lampiran', status: 'WARNING', message: 'Belum ada lampiran' });
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK KONTRAK ==========
  checkKontrak: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 5;

    const kontrak = paket.kontrak;

    if (!kontrak) {
      checks.push({ category: 'KONTRAK', item: 'Data Kontrak', status: 'ERROR', message: 'Data kontrak belum diinput' });
      return { checks, score, maxScore };
    }

    // Nomor kontrak
    if (kontrak.nomorKontrak) {
      checks.push({ category: 'KONTRAK', item: 'Nomor Kontrak', status: 'PASS', message: 'Nomor kontrak sudah diisi' });
      score += 1;
    } else {
      checks.push({ category: 'KONTRAK', item: 'Nomor Kontrak', status: 'ERROR', message: 'Nomor kontrak belum diisi' });
    }

    // Nilai kontrak
    if (kontrak.nilaiKontrak && kontrak.nilaiKontrak > 0) {
      checks.push({ category: 'KONTRAK', item: 'Nilai Kontrak', status: 'PASS', message: `Nilai: Rp ${formatRupiahDoc(kontrak.nilaiKontrak)}` });
      score += 1;

      // Check vs HPS
      if (paket.nilaiHPS && kontrak.nilaiKontrak <= paket.nilaiHPS) {
        checks.push({ category: 'KONTRAK', item: 'Kontrak vs HPS', status: 'PASS', message: 'Nilai kontrak tidak melebihi HPS' });
        score += 1;
      } else if (paket.nilaiHPS) {
        checks.push({ category: 'KONTRAK', item: 'Kontrak vs HPS', status: 'ERROR', message: 'Nilai kontrak melebihi HPS!' });
      }
    } else {
      checks.push({ category: 'KONTRAK', item: 'Nilai Kontrak', status: 'ERROR', message: 'Nilai kontrak belum diisi' });
    }

    // Jangka waktu
    if (kontrak.tanggalMulai && kontrak.tanggalSelesai) {
      checks.push({ category: 'KONTRAK', item: 'Jangka Waktu', status: 'PASS', message: 'Jangka waktu kontrak sudah diisi' });
      score += 1;
    } else {
      checks.push({ category: 'KONTRAK', item: 'Jangka Waktu', status: 'WARNING', message: 'Jangka waktu kontrak belum lengkap' });
    }

    // Penyedia
    if (kontrak.namaPenyedia || paket.namaPenyedia) {
      checks.push({ category: 'KONTRAK', item: 'Penyedia', status: 'PASS', message: 'Data penyedia sudah diisi' });
      score += 1;
    } else {
      checks.push({ category: 'KONTRAK', item: 'Penyedia', status: 'ERROR', message: 'Data penyedia belum diisi' });
    }

    return { checks, score, maxScore };
  },

  // ========== CHECK PAYMENT ==========
  checkPayment: function(paket) {
    const checks = [];
    let score = 0;
    const maxScore = 3;

    const pembayaran = paket.pembayaran || [];
    const serahTerima = paket.serahTerima || [];

    // Check BAST
    if (serahTerima.length > 0 && serahTerima.some(st => st.nomorBA)) {
      checks.push({ category: 'PEMBAYARAN', item: 'BAST', status: 'PASS', message: 'BAST sudah dibuat' });
      score += 1;
    } else {
      checks.push({ category: 'PEMBAYARAN', item: 'BAST', status: 'ERROR', message: 'BAST belum dibuat' });
    }

    // Check pembayaran
    if (pembayaran.length > 0) {
      checks.push({ category: 'PEMBAYARAN', item: 'Data Pembayaran', status: 'PASS', message: `${pembayaran.length} termin pembayaran` });
      score += 1;
    } else {
      checks.push({ category: 'PEMBAYARAN', item: 'Data Pembayaran', status: 'WARNING', message: 'Belum ada data pembayaran' });
    }

    // Check payment completion
    const paidAmount = pembayaran
      .filter(p => p.status === 'PAID' || p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.nilaiNetto || 0), 0);

    const kontrakValue = paket.nilaiKontrak || paket.kontrak?.nilaiKontrak || 0;

    if (kontrakValue > 0) {
      const paidPercent = (paidAmount / kontrakValue) * 100;
      if (paidPercent >= 100) {
        checks.push({ category: 'PEMBAYARAN', item: 'Status Pembayaran', status: 'PASS', message: 'Pembayaran lunas (100%)' });
        score += 1;
      } else if (paidPercent > 0) {
        checks.push({ category: 'PEMBAYARAN', item: 'Status Pembayaran', status: 'WARNING', message: `Pembayaran ${paidPercent.toFixed(0)}%` });
        score += 0.5;
      } else {
        checks.push({ category: 'PEMBAYARAN', item: 'Status Pembayaran', status: 'WARNING', message: 'Belum ada pembayaran lunas' });
      }
    }

    return { checks, score, maxScore };
  },

  // ========== GET SUMMARY ==========
  getSummary: function(score, errors, warnings) {
    if (errors > 0) {
      return {
        level: 'ERROR',
        message: `Ditemukan ${errors} masalah yang harus diperbaiki`,
        color: 'red'
      };
    }

    if (warnings > 3) {
      return {
        level: 'WARNING',
        message: `Ada ${warnings} hal yang perlu diperhatikan`,
        color: 'yellow'
      };
    }

    if (score >= 90) {
      return {
        level: 'EXCELLENT',
        message: 'Data sangat lengkap dan sesuai',
        color: 'green'
      };
    }

    if (score >= 70) {
      return {
        level: 'GOOD',
        message: 'Data cukup lengkap',
        color: 'blue'
      };
    }

    return {
      level: 'NEEDS_ATTENTION',
      message: 'Data perlu dilengkapi',
      color: 'orange'
    };
  }
};

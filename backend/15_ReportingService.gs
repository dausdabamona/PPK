/**
 * 15_ReportingService.gs
 * Reporting and Dashboard Service
 */

const ReportingService = {

  // ==================== DASHBOARD SUMMARY ====================
  getDashboard: function(tahunAnggaran = null) {
    const config = ConfigService.getConfig();
    tahunAnggaran = tahunAnggaran || config.tahunAnggaran || new Date().getFullYear().toString();

    return {
      success: true,
      data: {
        tahunAnggaran: tahunAnggaran,
        paket: this.getPaketSummary(tahunAnggaran),
        perjalananDinas: this.getPDSummary(tahunAnggaran),
        keuangan: this.getKeuanganSummary(tahunAnggaran),
        recentActivities: this.getRecentActivities(),
        charts: this.getChartData(tahunAnggaran)
      }
    };
  },

  // ==================== PAKET SUMMARY ====================
  getPaketSummary: function(tahunAnggaran) {
    const pakets = PaketService.list({ tahunAnggaran });

    const statusCounts = {};
    Object.keys(PAKET_STATUS).forEach(status => {
      statusCounts[status] = 0;
    });

    let totalPagu = 0;
    let totalHPS = 0;
    let totalKontrak = 0;

    pakets.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      totalPagu += p.paguAnggaran || 0;
      totalHPS += p.nilaiHPS || 0;
      totalKontrak += p.nilaiKontrak || 0;
    });

    return {
      total: pakets.length,
      byStatus: statusCounts,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        label: PAKET_STATUS_LABELS[status] || status,
        count,
        percentage: pakets.length > 0 ? Math.round((count / pakets.length) * 100) : 0
      })),
      financials: {
        totalPagu: totalPagu,
        totalHPS: totalHPS,
        totalKontrak: totalKontrak,
        sisaPagu: totalPagu - totalKontrak,
        realisasiPersen: totalPagu > 0 ? Math.round((totalKontrak / totalPagu) * 100) : 0
      },
      progress: {
        draft: statusCounts['DRAFT'] || 0,
        inProgress: (statusCounts['PERENCANAAN'] || 0) + (statusCounts['SURVEY_HARGA'] || 0) +
                    (statusCounts['HPS'] || 0) + (statusCounts['PENGADAAN'] || 0) +
                    (statusCounts['KONTRAK'] || 0) + (statusCounts['PELAKSANAAN'] || 0) +
                    (statusCounts['SERAH_TERIMA'] || 0) + (statusCounts['PEMBAYARAN'] || 0),
        completed: statusCounts['SELESAI'] || 0,
        cancelled: statusCounts['BATAL'] || 0
      }
    };
  },

  // ==================== PD SUMMARY ====================
  getPDSummary: function(tahunAnggaran) {
    const allPD = PerjalananDinasService.list();

    // Filter by year
    const pds = allPD.filter(pd => {
      if (!pd.tanggalBerangkat) return false;
      const year = new Date(pd.tanggalBerangkat).getFullYear().toString();
      return year === tahunAnggaran;
    });

    const statusCounts = {};
    Object.keys(PD_STATUS).forEach(status => {
      statusCounts[status] = 0;
    });

    let totalBiaya = 0;
    let luarKotaCount = 0;
    let dalamKotaCount = 0;

    pds.forEach(pd => {
      statusCounts[pd.status] = (statusCounts[pd.status] || 0) + 1;
      totalBiaya += pd.totalBiaya || 0;

      if (pd.jenisPD === JENIS_PD.LUAR_KOTA) {
        luarKotaCount++;
      } else {
        dalamKotaCount++;
      }
    });

    return {
      total: pds.length,
      byStatus: statusCounts,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        label: PD_STATUS_LABELS[status] || status,
        count,
        percentage: pds.length > 0 ? Math.round((count / pds.length) * 100) : 0
      })),
      byJenis: {
        luarKota: luarKotaCount,
        dalamKota: dalamKotaCount
      },
      financials: {
        totalBiaya: totalBiaya,
        avgBiaya: pds.length > 0 ? Math.round(totalBiaya / pds.length) : 0
      },
      progress: {
        draft: statusCounts['DRAFT'] || 0,
        inProgress: (statusCounts['SURAT_TUGAS'] || 0) + (statusCounts['SPPD'] || 0) +
                    (statusCounts['PELAKSANAAN'] || 0) + (statusCounts['PELAPORAN'] || 0) +
                    (statusCounts['PERTANGGUNGJAWABAN'] || 0),
        completed: statusCounts['SELESAI'] || 0,
        cancelled: statusCounts['BATAL'] || 0
      }
    };
  },

  // ==================== KEUANGAN SUMMARY ====================
  getKeuanganSummary: function(tahunAnggaran) {
    const pakets = PaketService.list({ tahunAnggaran });
    const allPD = PerjalananDinasService.list();

    const pds = allPD.filter(pd => {
      if (!pd.tanggalBerangkat) return false;
      const year = new Date(pd.tanggalBerangkat).getFullYear().toString();
      return year === tahunAnggaran;
    });

    // Paket financials
    let totalPaguPaket = 0;
    let totalKontrak = 0;
    let totalPembayaranPaket = 0;

    pakets.forEach(p => {
      totalPaguPaket += p.paguAnggaran || 0;
      totalKontrak += p.nilaiKontrak || 0;

      // Sum paid payments
      const pembayaran = PaketService.getPembayaran(p.paketId);
      pembayaran.forEach(py => {
        if (py.status === 'PAID' || py.status === 'COMPLETED') {
          totalPembayaranPaket += py.nilaiNetto || 0;
        }
      });
    });

    // PD financials
    let totalBiayaPD = pds.reduce((sum, pd) => sum + (pd.totalBiaya || 0), 0);

    return {
      paket: {
        totalPagu: totalPaguPaket,
        totalKontrak: totalKontrak,
        totalPembayaran: totalPembayaranPaket,
        sisaBelumKontrak: totalPaguPaket - totalKontrak,
        sisaBelumBayar: totalKontrak - totalPembayaranPaket,
        realisasiKontrakPersen: totalPaguPaket > 0 ? Math.round((totalKontrak / totalPaguPaket) * 100) : 0,
        realisasiBayarPersen: totalKontrak > 0 ? Math.round((totalPembayaranPaket / totalKontrak) * 100) : 0
      },
      perjalananDinas: {
        totalBiaya: totalBiayaPD,
        jumlahPD: pds.length,
        avgPerPD: pds.length > 0 ? Math.round(totalBiayaPD / pds.length) : 0
      },
      total: {
        totalAnggaran: totalPaguPaket + totalBiayaPD,
        totalRealisasi: totalPembayaranPaket + totalBiayaPD,
        realisasiPersen: (totalPaguPaket + totalBiayaPD) > 0
          ? Math.round(((totalPembayaranPaket + totalBiayaPD) / (totalPaguPaket + totalBiayaPD)) * 100)
          : 0
      }
    };
  },

  // ==================== RECENT ACTIVITIES ====================
  getRecentActivities: function(limit = 10) {
    const activities = [];

    // Recent pakets
    const pakets = PaketService.list().slice(0, 5);
    pakets.forEach(p => {
      activities.push({
        type: 'PAKET',
        id: p.paketId,
        title: p.namaPaket,
        status: p.status,
        statusLabel: p.statusLabel,
        timestamp: p.updatedAt || p.createdAt,
        nilai: p.nilaiKontrak || p.nilaiHPS || p.paguAnggaran || 0
      });
    });

    // Recent PD
    const pds = PerjalananDinasService.list().slice(0, 5);
    pds.forEach(pd => {
      activities.push({
        type: 'PERJALANAN_DINAS',
        id: pd.pdId,
        title: pd.tujuan || pd.maksudTujuan,
        status: pd.status,
        statusLabel: pd.statusLabel,
        timestamp: pd.updatedAt || pd.createdAt,
        nilai: pd.totalBiaya || 0
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return activities.slice(0, limit);
  },

  // ==================== CHART DATA ====================
  getChartData: function(tahunAnggaran) {
    const pakets = PaketService.list({ tahunAnggaran });
    const allPD = PerjalananDinasService.list();

    const pds = allPD.filter(pd => {
      if (!pd.tanggalBerangkat) return false;
      const year = new Date(pd.tanggalBerangkat).getFullYear().toString();
      return year === tahunAnggaran;
    });

    // Monthly paket creation
    const paketByMonth = {};
    for (let i = 1; i <= 12; i++) {
      paketByMonth[i] = 0;
    }

    pakets.forEach(p => {
      if (p.createdAt) {
        const month = new Date(p.createdAt).getMonth() + 1;
        paketByMonth[month]++;
      }
    });

    // Monthly PD
    const pdByMonth = {};
    for (let i = 1; i <= 12; i++) {
      pdByMonth[i] = 0;
    }

    pds.forEach(pd => {
      if (pd.tanggalBerangkat) {
        const month = new Date(pd.tanggalBerangkat).getMonth() + 1;
        pdByMonth[month]++;
      }
    });

    // Paket by jenis
    const paketByJenis = {};
    Object.keys(JENIS_PENGADAAN).forEach(j => {
      paketByJenis[j] = 0;
    });

    pakets.forEach(p => {
      if (p.jenisPengadaan) {
        paketByJenis[p.jenisPengadaan] = (paketByJenis[p.jenisPengadaan] || 0) + 1;
      }
    });

    // Paket by metode
    const paketByMetode = {};
    Object.keys(METODE_PENGADAAN).forEach(m => {
      paketByMetode[m] = 0;
    });

    pakets.forEach(p => {
      if (p.metodePengadaan) {
        paketByMetode[p.metodePengadaan] = (paketByMetode[p.metodePengadaan] || 0) + 1;
      }
    });

    return {
      paketByMonth: Object.entries(paketByMonth).map(([month, count]) => ({
        month: parseInt(month),
        monthName: this.getMonthName(parseInt(month)),
        count
      })),
      pdByMonth: Object.entries(pdByMonth).map(([month, count]) => ({
        month: parseInt(month),
        monthName: this.getMonthName(parseInt(month)),
        count
      })),
      paketByJenis: Object.entries(paketByJenis).map(([jenis, count]) => ({
        jenis,
        label: JENIS_PENGADAAN[jenis] || jenis,
        count
      })),
      paketByMetode: Object.entries(paketByMetode).map(([metode, count]) => ({
        metode,
        label: METODE_PENGADAAN[metode] || metode,
        count
      }))
    };
  },

  // ==================== HELPER: GET MONTH NAME ====================
  getMonthName: function(month) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month] || '';
  },

  // ==================== PAKET REPORT ====================
  getPaketReport: function(filters = {}) {
    let pakets = PaketService.list(filters);

    return {
      success: true,
      data: {
        filters: filters,
        total: pakets.length,
        items: pakets.map(p => ({
          paketId: p.paketId,
          namaPaket: p.namaPaket,
          jenisPengadaan: JENIS_PENGADAAN[p.jenisPengadaan] || p.jenisPengadaan,
          metodePengadaan: METODE_PENGADAAN[p.metodePengadaan] || p.metodePengadaan,
          paguAnggaran: p.paguAnggaran,
          nilaiHPS: p.nilaiHPS,
          nilaiKontrak: p.nilaiKontrak,
          namaPenyedia: p.namaPenyedia,
          status: p.status,
          statusLabel: p.statusLabel,
          tahunAnggaran: p.tahunAnggaran,
          createdAt: p.createdAt
        })),
        summary: {
          totalPagu: pakets.reduce((sum, p) => sum + (p.paguAnggaran || 0), 0),
          totalHPS: pakets.reduce((sum, p) => sum + (p.nilaiHPS || 0), 0),
          totalKontrak: pakets.reduce((sum, p) => sum + (p.nilaiKontrak || 0), 0)
        },
        generatedAt: getTimestamp()
      }
    };
  },

  // ==================== PD REPORT ====================
  getPDReport: function(filters = {}) {
    let pds = PerjalananDinasService.list(filters.jenisPD);

    // Apply date filter
    if (filters.tanggalMulai) {
      const startDate = new Date(filters.tanggalMulai);
      pds = pds.filter(pd => new Date(pd.tanggalBerangkat) >= startDate);
    }

    if (filters.tanggalSelesai) {
      const endDate = new Date(filters.tanggalSelesai);
      pds = pds.filter(pd => new Date(pd.tanggalBerangkat) <= endDate);
    }

    if (filters.status) {
      pds = pds.filter(pd => pd.status === filters.status);
    }

    return {
      success: true,
      data: {
        filters: filters,
        total: pds.length,
        items: pds.map(pd => ({
          pdId: pd.pdId,
          jenisPD: JENIS_PD_LABELS[pd.jenisPD] || pd.jenisPD,
          tujuan: pd.tujuan || pd.maksudTujuan,
          kotaTujuan: pd.kotaTujuan,
          tanggalBerangkat: pd.tanggalBerangkat,
          tanggalKembali: pd.tanggalKembali,
          lamaHari: pd.lamaHari,
          jumlahPelaksana: pd.jumlahPelaksana,
          totalBiaya: pd.totalBiaya,
          status: pd.status,
          statusLabel: pd.statusLabel
        })),
        summary: {
          totalPD: pds.length,
          totalBiaya: pds.reduce((sum, pd) => sum + (pd.totalBiaya || 0), 0),
          avgBiaya: pds.length > 0 ? Math.round(pds.reduce((sum, pd) => sum + (pd.totalBiaya || 0), 0) / pds.length) : 0,
          totalHari: pds.reduce((sum, pd) => sum + (pd.lamaHari || 0), 0)
        },
        generatedAt: getTimestamp()
      }
    };
  },

  // ==================== PENYEDIA REPORT ====================
  getPenyediaReport: function() {
    const penyedias = PenyediaService.list();
    const pakets = PaketService.list();

    // Count pakets per penyedia
    const paketCounts = {};
    const paketValues = {};

    pakets.forEach(p => {
      if (p.penyediaId) {
        paketCounts[p.penyediaId] = (paketCounts[p.penyediaId] || 0) + 1;
        paketValues[p.penyediaId] = (paketValues[p.penyediaId] || 0) + (p.nilaiKontrak || 0);
      }
    });

    return {
      success: true,
      data: {
        total: penyedias.length,
        items: penyedias.map(py => ({
          penyediaId: py.penyediaId,
          namaPenyedia: py.namaPenyedia,
          alamat: py.alamat,
          kota: py.kota,
          npwp: py.npwp,
          jumlahPaket: paketCounts[py.penyediaId] || 0,
          totalNilai: paketValues[py.penyediaId] || 0,
          isActive: py.isActive
        })),
        generatedAt: getTimestamp()
      }
    };
  }
};

// ========================================
// ROUTE EXTENSIONS FOR REPORTING
// ========================================

function routeReporting(segments, method, params, body) {
  // GET /reporting/dashboard
  if (segments[0] === 'dashboard' && method === 'GET') {
    return ReportingService.getDashboard(params.tahunAnggaran);
  }

  // GET /reporting/paket
  if (segments[0] === 'paket' && method === 'GET') {
    return ReportingService.getPaketReport(params);
  }

  // GET /reporting/pd
  if (segments[0] === 'pd' && method === 'GET') {
    return ReportingService.getPDReport(params);
  }

  // GET /reporting/penyedia
  if (segments[0] === 'penyedia' && method === 'GET') {
    return ReportingService.getPenyediaReport();
  }

  // GET /reporting/keuangan
  if (segments[0] === 'keuangan' && method === 'GET') {
    return {
      success: true,
      data: ReportingService.getKeuanganSummary(params.tahunAnggaran)
    };
  }

  return { success: false, error: 'Route not found' };
}

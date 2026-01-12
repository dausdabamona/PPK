/**
 * 30_DocumentTemplateService.gs
 * Legal-grade Document Templates Service
 * Sprint 3: Document Templates & Advanced Reporting
 *
 * Templates:
 * - HPS (Harga Perkiraan Sendiri)
 * - SPK (Surat Perintah Kerja)
 * - SPMK (Surat Perintah Mulai Kerja)
 * - BAHP (Berita Acara Hasil Pemeriksaan)
 * - BAST (Berita Acara Serah Terima)
 * - Kuitansi
 * - SPM (Surat Perintah Membayar)
 * - Justifikasi Teknis
 */

// ========================================
// DOCUMENT TEMPLATE CONFIGURATION
// ========================================

const DOCUMENT_TEMPLATES = {
  HPS: {
    name: 'Harga Perkiraan Sendiri',
    prefix: 'HPS',
    folder: 'Dokumen_HPS',
    requiresPenyedia: false,
    requiresKontrak: false
  },
  SPK: {
    name: 'Surat Perintah Kerja',
    prefix: 'SPK',
    folder: 'Dokumen_SPK',
    requiresPenyedia: true,
    requiresKontrak: false
  },
  SPMK: {
    name: 'Surat Perintah Mulai Kerja',
    prefix: 'SPMK',
    folder: 'Dokumen_SPMK',
    requiresPenyedia: true,
    requiresKontrak: true
  },
  BAHP: {
    name: 'Berita Acara Hasil Pemeriksaan',
    prefix: 'BAHP',
    folder: 'Dokumen_BAHP',
    requiresPenyedia: true,
    requiresKontrak: true
  },
  BAST: {
    name: 'Berita Acara Serah Terima',
    prefix: 'BA',
    folder: 'Dokumen_BAST',
    requiresPenyedia: true,
    requiresKontrak: true
  },
  KUITANSI: {
    name: 'Kuitansi Pembayaran',
    prefix: 'KW',
    folder: 'Dokumen_Kuitansi',
    requiresPenyedia: true,
    requiresKontrak: true
  },
  SPM: {
    name: 'Surat Perintah Membayar',
    prefix: 'SPM',
    folder: 'Dokumen_SPM',
    requiresPenyedia: true,
    requiresKontrak: true
  },
  JUSTIFIKASI: {
    name: 'Justifikasi Teknis',
    prefix: 'JT',
    folder: 'Dokumen_Justifikasi',
    requiresPenyedia: false,
    requiresKontrak: false
  }
};

// ========================================
// DOCUMENT TEMPLATE SERVICE
// ========================================

const DocumentTemplateService = {

  // ==================== GENERATE DOCUMENT ====================
  generate: function(paketId, docType, options = {}) {
    const templateConfig = DOCUMENT_TEMPLATES[docType];
    if (!templateConfig) {
      return { success: false, error: `Template tidak ditemukan: ${docType}` };
    }

    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    // Check requirements
    if (templateConfig.requiresPenyedia && !paket.penyediaId && !paket.namaPenyedia) {
      return { success: false, error: `${templateConfig.name} memerlukan data penyedia` };
    }

    if (templateConfig.requiresKontrak && !paket.kontrak) {
      return { success: false, error: `${templateConfig.name} memerlukan data kontrak` };
    }

    // Route to specific template generator
    switch (docType) {
      case 'HPS':
        return this.generateHPS(paket, options);
      case 'SPK':
        return this.generateSPK(paket, options);
      case 'SPMK':
        return this.generateSPMK(paket, options);
      case 'BAHP':
        return this.generateBAHP(paket, options);
      case 'BAST':
        return this.generateBAST(paket, options);
      case 'KUITANSI':
        return this.generateKuitansi(paket, options);
      case 'SPM':
        return this.generateSPM(paket, options);
      case 'JUSTIFIKASI':
        return this.generateJustifikasi(paket, options);
      default:
        return { success: false, error: `Generator tidak tersedia: ${docType}` };
    }
  },

  // ==================== GENERATE HPS ====================
  generateHPS: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const hpsData = HPSService.calculate(paket.paketId);

    if (!hpsData.success) {
      return hpsData;
    }

    const hps = hpsData.data;
    const nomorResult = NumberingService.generateNumber('HPS');
    const nomorHPS = nomorResult.success ? nomorResult.data.number : '';

    try {
      const doc = DocumentApp.create(`HPS - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      // KOP SURAT
      this._addKopSurat(body, config);

      // TITLE
      this._addCenteredTitle(body, 'HARGA PERKIRAAN SENDIRI (HPS)');
      this._addCenteredText(body, `Nomor: ${nomorHPS}`);
      body.appendParagraph('');

      // PAKET INFO TABLE
      const infoTable = body.appendTable();
      infoTable.setBorderWidth(0);
      this._addInfoRow(infoTable, 'Nama Paket', paket.namaPaket);
      this._addInfoRow(infoTable, 'Jenis Pengadaan', JENIS_PENGADAAN[paket.jenisPengadaan] || paket.jenisPengadaan);
      this._addInfoRow(infoTable, 'Metode Pengadaan', METODE_PENGADAAN[paket.metodePengadaan] || paket.metodePengadaan);
      this._addInfoRow(infoTable, 'Pagu Anggaran', `Rp ${formatRupiahDoc(paket.paguAnggaran)}`);
      this._addInfoRow(infoTable, 'Sumber Dana', paket.sumberDana || config.sumberDana || 'APBN');
      this._addInfoRow(infoTable, 'Tahun Anggaran', paket.tahunAnggaran || config.tahunAnggaran);

      body.appendParagraph('');

      // ITEMS TABLE
      body.appendParagraph('Rincian HPS:').setBold(true);
      body.appendParagraph('');

      const itemTable = body.appendTable();
      const headerRow = itemTable.appendTableRow();
      this._addTableHeader(headerRow, ['No.', 'Uraian Barang/Jasa', 'Satuan', 'Vol', 'Harga Satuan (Rp)', 'Jumlah (Rp)']);

      hps.items.forEach((item, idx) => {
        const row = itemTable.appendTableRow();
        row.appendTableCell(String(idx + 1)).setWidth(25);

        const uraianCell = row.appendTableCell();
        uraianCell.appendParagraph(item.namaBarang).setBold(false);
        if (item.spesifikasi) {
          uraianCell.appendParagraph(item.spesifikasi).setFontSize(9).setItalic(true);
        }

        row.appendTableCell(item.satuan || '-').setWidth(45);
        row.appendTableCell(String(item.volume)).setWidth(35);

        const hargaCell = row.appendTableCell(formatRupiahDoc(item.hargaSatuan));
        hargaCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        hargaCell.setWidth(90);

        const totalCell = row.appendTableCell(formatRupiahDoc(item.totalHarga));
        totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        totalCell.setWidth(100);
      });

      // SUBTOTAL ROW
      this._addTotalRow(itemTable, 'Subtotal', hps.subtotal);
      this._addTotalRow(itemTable, `PPN ${hps.ppnRate}%`, hps.ppn);
      this._addTotalRow(itemTable, 'TOTAL HPS', hps.total, true);

      body.appendParagraph('');
      body.appendParagraph(`Terbilang: ${hps.terbilang}`).setItalic(true);

      body.appendParagraph('');
      body.appendParagraph('Demikian Harga Perkiraan Sendiri (HPS) ini dibuat untuk dipergunakan sebagaimana mestinya.');

      // SIGNATURE
      body.appendParagraph('');
      this._addSignature(body, config, 'Pejabat Pembuat Komitmen');

      // QR CODE PLACEHOLDER
      this._addQRPlaceholder(body, paket.paketId, 'HPS', nomorHPS);

      doc.saveAndClose();

      // Save and share
      return this._finalizeDocument(doc, paket.paketId, 'HPS', nomorHPS, 'Dokumen_HPS');

    } catch (e) {
      console.error('Error generating HPS:', e);
      return { success: false, error: 'Gagal membuat HPS: ' + e.message };
    }
  },

  // ==================== GENERATE SPK ====================
  generateSPK: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const penyedia = this._getPenyediaData(paket);
    const nomorResult = NumberingService.generateNumber('SPK');
    const nomorSPK = nomorResult.success ? nomorResult.data.number : '';
    const nilaiKontrak = paket.nilaiKontrak || paket.nilaiHPS || 0;

    try {
      const doc = DocumentApp.create(`SPK - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'SURAT PERINTAH KERJA');
      this._addCenteredText(body, `Nomor: ${nomorSPK}`);
      body.appendParagraph('');

      // OPENING
      body.appendParagraph('Yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      // PIHAK PERTAMA (PPK)
      const ppkTable = body.appendTable();
      ppkTable.setBorderWidth(0);
      this._addInfoRow(ppkTable, 'Nama', config.namaPPK || '-');
      this._addInfoRow(ppkTable, 'NIP', config.nipPPK || '-');
      this._addInfoRow(ppkTable, 'Jabatan', config.jabatanPPK || 'Pejabat Pembuat Komitmen');
      this._addInfoRow(ppkTable, 'Alamat', config.alamatSatker || '-');

      body.appendParagraph('selanjutnya disebut sebagai PIHAK PERTAMA');
      body.appendParagraph('');

      body.appendParagraph('Memberikan perintah kerja kepada:');
      body.appendParagraph('');

      // PIHAK KEDUA (Penyedia)
      const penyediaTable = body.appendTable();
      penyediaTable.setBorderWidth(0);
      this._addInfoRow(penyediaTable, 'Nama Perusahaan', penyedia.nama);
      this._addInfoRow(penyediaTable, 'Alamat', penyedia.alamat);
      this._addInfoRow(penyediaTable, 'NPWP', penyedia.npwp);
      this._addInfoRow(penyediaTable, 'Nama Direktur', penyedia.direktur);

      body.appendParagraph('selanjutnya disebut sebagai PIHAK KEDUA');
      body.appendParagraph('');

      // PEKERJAAN
      body.appendParagraph('Untuk melaksanakan pekerjaan sebagai berikut:');
      body.appendParagraph('');

      const pekerjaanTable = body.appendTable();
      pekerjaanTable.setBorderWidth(0);
      this._addInfoRow(pekerjaanTable, 'Nama Pekerjaan', paket.namaPaket);
      this._addInfoRow(pekerjaanTable, 'Nilai Pekerjaan', `Rp ${formatRupiahDoc(nilaiKontrak)}`);
      this._addInfoRow(pekerjaanTable, 'Jangka Waktu', paket.kontrak?.jangkaWaktu || `${paket.lamaHari || 30} hari kalender`);
      this._addInfoRow(pekerjaanTable, 'Tanggal Mulai', formatTanggalIndo(paket.kontrak?.tanggalMulai || paket.tanggalKontrak));
      this._addInfoRow(pekerjaanTable, 'Tanggal Selesai', formatTanggalIndo(paket.kontrak?.tanggalSelesai || paket.tanggalSelesai));

      body.appendParagraph('');
      body.appendParagraph(`Terbilang: ${terbilangClean(nilaiKontrak)} rupiah`).setItalic(true);

      body.appendParagraph('');

      // KETENTUAN
      body.appendParagraph('Ketentuan pelaksanaan:').setBold(true);
      body.appendListItem('PIHAK KEDUA wajib melaksanakan pekerjaan sesuai spesifikasi yang ditentukan');
      body.appendListItem('PIHAK KEDUA wajib menyelesaikan pekerjaan dalam jangka waktu yang ditetapkan');
      body.appendListItem('Pembayaran dilakukan setelah pekerjaan selesai dan diterima dengan baik');
      body.appendListItem('SPK ini berlaku sebagai dasar pelaksanaan pekerjaan');

      body.appendParagraph('');
      body.appendParagraph('Demikian Surat Perintah Kerja ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.');

      // DUAL SIGNATURE
      body.appendParagraph('');
      this._addDualSignature(body, config, penyedia);

      // QR CODE
      this._addQRPlaceholder(body, paket.paketId, 'SPK', nomorSPK);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'SPK', nomorSPK, 'Dokumen_SPK');

    } catch (e) {
      console.error('Error generating SPK:', e);
      return { success: false, error: 'Gagal membuat SPK: ' + e.message };
    }
  },

  // ==================== GENERATE SPMK ====================
  generateSPMK: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = this._getPenyediaData(paket);
    const nomorResult = NumberingService.generateNumber('SPMK');
    const nomorSPMK = nomorResult.success ? nomorResult.data.number : '';

    if (!kontrak || !kontrak.nomorKontrak) {
      return { success: false, error: 'Data kontrak belum lengkap untuk membuat SPMK' };
    }

    try {
      const doc = DocumentApp.create(`SPMK - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'SURAT PERINTAH MULAI KERJA');
      this._addCenteredText(body, `Nomor: ${nomorSPMK}`);
      body.appendParagraph('');

      // DASAR HUKUM
      body.appendParagraph('Dasar:');
      body.appendListItem(`Surat Perjanjian/Kontrak Nomor: ${kontrak.nomorKontrak} tanggal ${formatTanggalIndo(kontrak.tanggalKontrak)}`);
      body.appendParagraph('');

      body.appendParagraph('Dengan ini memerintahkan kepada:');
      body.appendParagraph('');

      const penyediaTable = body.appendTable();
      penyediaTable.setBorderWidth(0);
      this._addInfoRow(penyediaTable, 'Nama Perusahaan', penyedia.nama);
      this._addInfoRow(penyediaTable, 'Alamat', penyedia.alamat);
      this._addInfoRow(penyediaTable, 'Direktur', penyedia.direktur);

      body.appendParagraph('');
      body.appendParagraph('Untuk segera memulai pelaksanaan pekerjaan:');
      body.appendParagraph('');

      const pekerjaanTable = body.appendTable();
      pekerjaanTable.setBorderWidth(0);
      this._addInfoRow(pekerjaanTable, 'Nama Pekerjaan', paket.namaPaket);
      this._addInfoRow(pekerjaanTable, 'Nilai Kontrak', `Rp ${formatRupiahDoc(kontrak.nilaiKontrak)}`);
      this._addInfoRow(pekerjaanTable, 'Tanggal Mulai', formatTanggalIndo(kontrak.tanggalMulai));
      this._addInfoRow(pekerjaanTable, 'Tanggal Selesai', formatTanggalIndo(kontrak.tanggalSelesai));
      this._addInfoRow(pekerjaanTable, 'Jangka Waktu', kontrak.jangkaWaktu || this._calculateDays(kontrak.tanggalMulai, kontrak.tanggalSelesai));

      body.appendParagraph('');
      body.appendParagraph('Pekerjaan harus dilaksanakan sesuai dengan ketentuan dalam kontrak dan spesifikasi teknis yang telah ditetapkan.');
      body.appendParagraph('');
      body.appendParagraph('Demikian Surat Perintah Mulai Kerja ini dibuat untuk dilaksanakan sebagaimana mestinya.');

      body.appendParagraph('');
      this._addSignature(body, config, 'Pejabat Pembuat Komitmen');
      this._addQRPlaceholder(body, paket.paketId, 'SPMK', nomorSPMK);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'SPMK', nomorSPMK, 'Dokumen_SPMK');

    } catch (e) {
      console.error('Error generating SPMK:', e);
      return { success: false, error: 'Gagal membuat SPMK: ' + e.message };
    }
  },

  // ==================== GENERATE BAHP ====================
  generateBAHP: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = this._getPenyediaData(paket);
    const nomorResult = NumberingService.generateNumber('BAHP');
    const nomorBAHP = nomorResult.success ? nomorResult.data.number : '';

    try {
      const doc = DocumentApp.create(`BAHP - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'BERITA ACARA HASIL PEMERIKSAAN');
      this._addCenteredText(body, `Nomor: ${nomorBAHP}`);
      body.appendParagraph('');

      const today = formatTanggalIndo(getTimestamp());
      body.appendParagraph(`Pada hari ini, ${today}, kami yang bertanda tangan di bawah ini:`);
      body.appendParagraph('');

      // TIM PEMERIKSA
      body.appendParagraph('TIM PEMERIKSA:').setBold(true);
      const timTable = body.appendTable();
      timTable.setBorderWidth(0);
      this._addInfoRow(timTable, '1. Nama', config.namaPPK || '-');
      this._addInfoRow(timTable, '   NIP', config.nipPPK || '-');
      this._addInfoRow(timTable, '   Jabatan', 'Pejabat Pembuat Komitmen');

      body.appendParagraph('');
      body.appendParagraph('Telah melakukan pemeriksaan terhadap hasil pekerjaan:');
      body.appendParagraph('');

      const pekerjaanTable = body.appendTable();
      pekerjaanTable.setBorderWidth(0);
      this._addInfoRow(pekerjaanTable, 'Nama Pekerjaan', paket.namaPaket);
      this._addInfoRow(pekerjaanTable, 'Nomor Kontrak', kontrak?.nomorKontrak || '-');
      this._addInfoRow(pekerjaanTable, 'Nilai Kontrak', `Rp ${formatRupiahDoc(kontrak?.nilaiKontrak || 0)}`);
      this._addInfoRow(pekerjaanTable, 'Penyedia', penyedia.nama);

      body.appendParagraph('');
      body.appendParagraph('Hasil Pemeriksaan:').setBold(true);
      body.appendParagraph('');

      body.appendListItem('Pekerjaan telah dilaksanakan sesuai dengan spesifikasi teknis yang ditentukan dalam kontrak');
      body.appendListItem('Volume pekerjaan telah sesuai dengan yang tercantum dalam kontrak');
      body.appendListItem('Kualitas hasil pekerjaan telah memenuhi standar yang ditetapkan');
      body.appendListItem('Pekerjaan telah selesai 100%');

      body.appendParagraph('');
      body.appendParagraph('Kesimpulan:').setBold(true);
      body.appendParagraph('Berdasarkan hasil pemeriksaan tersebut di atas, pekerjaan dinyatakan SESUAI/DAPAT DITERIMA.');
      body.appendParagraph('');
      body.appendParagraph('Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.');

      body.appendParagraph('');
      this._addSignature(body, config, 'Pejabat Pembuat Komitmen');
      this._addQRPlaceholder(body, paket.paketId, 'BAHP', nomorBAHP);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'BAHP', nomorBAHP, 'Dokumen_BAHP');

    } catch (e) {
      console.error('Error generating BAHP:', e);
      return { success: false, error: 'Gagal membuat BAHP: ' + e.message };
    }
  },

  // ==================== GENERATE BAST ====================
  generateBAST: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = this._getPenyediaData(paket);
    const serahTerima = paket.serahTerima?.[0] || {};
    const nomorResult = NumberingService.generateNumber('BAST');
    const nomorBAST = nomorResult.success ? nomorResult.data.number : '';

    try {
      const doc = DocumentApp.create(`BAST - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'BERITA ACARA SERAH TERIMA');
      this._addCenteredTitle(body, 'HASIL PEKERJAAN');
      this._addCenteredText(body, `Nomor: ${nomorBAST}`);
      body.appendParagraph('');

      const today = formatTanggalIndo(serahTerima.tanggalBA || getTimestamp());
      body.appendParagraph(`Pada hari ini, ${today}, kami yang bertanda tangan di bawah ini:`);
      body.appendParagraph('');

      // PIHAK PERTAMA
      body.appendParagraph('I. PIHAK PERTAMA').setBold(true);
      const ppkTable = body.appendTable();
      ppkTable.setBorderWidth(0);
      this._addInfoRow(ppkTable, 'Nama', config.namaPPK || '-');
      this._addInfoRow(ppkTable, 'NIP', config.nipPPK || '-');
      this._addInfoRow(ppkTable, 'Jabatan', config.jabatanPPK || 'Pejabat Pembuat Komitmen');
      body.appendParagraph('selanjutnya disebut sebagai PIHAK PERTAMA');
      body.appendParagraph('');

      // PIHAK KEDUA
      body.appendParagraph('II. PIHAK KEDUA').setBold(true);
      const penyediaTable = body.appendTable();
      penyediaTable.setBorderWidth(0);
      this._addInfoRow(penyediaTable, 'Nama Perusahaan', penyedia.nama);
      this._addInfoRow(penyediaTable, 'Alamat', penyedia.alamat);
      this._addInfoRow(penyediaTable, 'Direktur', penyedia.direktur);
      body.appendParagraph('selanjutnya disebut sebagai PIHAK KEDUA');
      body.appendParagraph('');

      // DASAR
      body.appendParagraph(`Berdasarkan Kontrak Nomor: ${kontrak?.nomorKontrak || '-'} tanggal ${formatTanggalIndo(kontrak?.tanggalKontrak)}, menyatakan bahwa:`);
      body.appendParagraph('');

      body.appendListItem('PIHAK KEDUA telah menyelesaikan pekerjaan:');

      const pekerjaanTable = body.appendTable();
      pekerjaanTable.setBorderWidth(0);
      this._addInfoRow(pekerjaanTable, 'Nama Pekerjaan', paket.namaPaket);
      this._addInfoRow(pekerjaanTable, 'Nilai Kontrak', `Rp ${formatRupiahDoc(kontrak?.nilaiKontrak || 0)}`);
      this._addInfoRow(pekerjaanTable, 'Persentase', `${serahTerima.persentase || 100}%`);

      body.appendParagraph('');
      body.appendListItem('PIHAK PERTAMA telah memeriksa dan menerima hasil pekerjaan tersebut dengan baik');
      body.appendListItem('Pekerjaan telah dilaksanakan sesuai dengan ketentuan kontrak');

      body.appendParagraph('');
      body.appendParagraph('Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.');

      body.appendParagraph('');
      this._addDualSignature(body, config, penyedia);
      this._addQRPlaceholder(body, paket.paketId, 'BAST', nomorBAST);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'BAST', nomorBAST, 'Dokumen_BAST');

    } catch (e) {
      console.error('Error generating BAST:', e);
      return { success: false, error: 'Gagal membuat BAST: ' + e.message };
    }
  },

  // ==================== GENERATE KUITANSI ====================
  generateKuitansi: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = this._getPenyediaData(paket);
    const pembayaran = options.pembayaran || paket.pembayaran?.[paket.pembayaran.length - 1] || {};
    const nomorResult = NumberingService.generateNumber('KUITANSI');
    const nomorKuitansi = nomorResult.success ? nomorResult.data.number : '';

    const nilaiPembayaran = pembayaran.nilaiNetto || kontrak?.nilaiKontrak || paket.nilaiKontrak || 0;

    try {
      const doc = DocumentApp.create(`Kuitansi - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'KUITANSI');
      this._addCenteredText(body, `Nomor: ${nomorKuitansi}`);
      body.appendParagraph('');

      // AMOUNT BOX
      const amountTable = body.appendTable();
      const amountRow = amountTable.appendTableRow();
      const amountCell = amountRow.appendTableCell(`Rp ${formatRupiahDoc(nilaiPembayaran)},-`);
      amountCell.setBold(true);
      amountCell.setFontSize(14);
      amountCell.setBackgroundColor('#f5f5f5');
      amountCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // CONTENT
      const contentTable = body.appendTable();
      contentTable.setBorderWidth(0);
      this._addInfoRow(contentTable, 'Terima dari', config.namaSatker || '-');
      this._addInfoRow(contentTable, 'Uang sebanyak', terbilangClean(nilaiPembayaran) + ' rupiah');
      this._addInfoRow(contentTable, 'Untuk pembayaran', paket.namaPaket);
      this._addInfoRow(contentTable, 'Nomor Kontrak', kontrak?.nomorKontrak || '-');
      this._addInfoRow(contentTable, 'Tanggal Kontrak', formatTanggalIndo(kontrak?.tanggalKontrak));

      body.appendParagraph('');

      // DETAIL PEMBAYARAN
      if (pembayaran.nilaiTagihan) {
        body.appendParagraph('Rincian Pembayaran:').setBold(true);
        const detailTable = body.appendTable();

        const headerRow = detailTable.appendTableRow();
        headerRow.appendTableCell('Uraian').setBold(true).setWidth(300);
        headerRow.appendTableCell('Jumlah (Rp)').setBold(true).setWidth(150);

        this._addPaymentRow(detailTable, 'Nilai DPP', pembayaran.nilaiTagihan || 0);
        this._addPaymentRow(detailTable, 'PPN', pembayaran.nilaiPPN || 0);
        this._addPaymentRow(detailTable, 'PPh (dipotong)', -(pembayaran.nilaiPPH || 0));
        this._addPaymentRow(detailTable, 'Jumlah Diterima', nilaiPembayaran, true);
      }

      body.appendParagraph('');

      // SIGNATURES
      this._addDualSignature(body, config, penyedia, 'Mengetahui,\nPejabat Pembuat Komitmen', 'Yang Menerima,');
      this._addQRPlaceholder(body, paket.paketId, 'KUITANSI', nomorKuitansi);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'KUITANSI', nomorKuitansi, 'Dokumen_Kuitansi');

    } catch (e) {
      console.error('Error generating Kuitansi:', e);
      return { success: false, error: 'Gagal membuat Kuitansi: ' + e.message };
    }
  },

  // ==================== GENERATE SPM ====================
  generateSPM: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = this._getPenyediaData(paket);
    const pembayaran = options.pembayaran || paket.pembayaran?.[paket.pembayaran.length - 1] || {};
    const nomorResult = NumberingService.generateNumber('SPM');
    const nomorSPM = nomorResult.success ? nomorResult.data.number : '';

    const nilaiPembayaran = pembayaran.nilaiNetto || kontrak?.nilaiKontrak || 0;

    try {
      const doc = DocumentApp.create(`SPM - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'SURAT PERINTAH MEMBAYAR');
      this._addCenteredText(body, `Nomor: ${nomorSPM}`);
      body.appendParagraph('');

      body.appendParagraph('Yang bertanda tangan di bawah ini memerintahkan kepada Bendahara Pengeluaran untuk membayar:');
      body.appendParagraph('');

      const contentTable = body.appendTable();
      contentTable.setBorderWidth(0);
      this._addInfoRow(contentTable, 'Kepada', penyedia.nama);
      this._addInfoRow(contentTable, 'Alamat', penyedia.alamat);
      this._addInfoRow(contentTable, 'Bank/No. Rekening', `${penyedia.bank || '-'} / ${penyedia.noRekening || '-'}`);
      this._addInfoRow(contentTable, 'Nama Rekening', penyedia.namaRekening || penyedia.nama);
      this._addInfoRow(contentTable, 'Jumlah', `Rp ${formatRupiahDoc(nilaiPembayaran)}`);
      this._addInfoRow(contentTable, 'Terbilang', terbilangClean(nilaiPembayaran) + ' rupiah');
      this._addInfoRow(contentTable, 'Untuk Pembayaran', paket.namaPaket);
      this._addInfoRow(contentTable, 'MAK', paket.mak || config.mak || '-');

      body.appendParagraph('');
      body.appendParagraph('Kelengkapan dokumen:').setBold(true);
      body.appendListItem('Surat Perjanjian/Kontrak');
      body.appendListItem('Berita Acara Serah Terima');
      body.appendListItem('Berita Acara Hasil Pemeriksaan');
      body.appendListItem('Kuitansi');
      body.appendListItem('Faktur Pajak');

      body.appendParagraph('');
      body.appendParagraph('Demikian Surat Perintah Membayar ini dibuat untuk dilaksanakan.');

      body.appendParagraph('');
      this._addSignature(body, config, 'Pejabat Pembuat Komitmen');
      this._addQRPlaceholder(body, paket.paketId, 'SPM', nomorSPM);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'SPM', nomorSPM, 'Dokumen_SPM');

    } catch (e) {
      console.error('Error generating SPM:', e);
      return { success: false, error: 'Gagal membuat SPM: ' + e.message };
    }
  },

  // ==================== GENERATE JUSTIFIKASI TEKNIS ====================
  generateJustifikasi: function(paket, options = {}) {
    const config = ConfigService.getConfig();
    const nomorResult = NumberingService.generateNumber('JUSTIFIKASI');
    const nomorJT = nomorResult.success ? nomorResult.data.number : '';

    try {
      const doc = DocumentApp.create(`Justifikasi Teknis - ${paket.namaPaket}`);
      const body = doc.getBody();
      this._setPageFormat(body);

      this._addKopSurat(body, config);
      this._addCenteredTitle(body, 'JUSTIFIKASI TEKNIS');
      this._addCenteredText(body, `Nomor: ${nomorJT}`);
      body.appendParagraph('');

      // I. LATAR BELAKANG
      body.appendParagraph('I. LATAR BELAKANG').setBold(true);
      body.appendParagraph(`Dalam rangka mendukung pelaksanaan tugas dan fungsi ${config.namaSatker || 'instansi'}, diperlukan pengadaan ${paket.namaPaket}.`);
      body.appendParagraph('');

      // II. MAKSUD DAN TUJUAN
      body.appendParagraph('II. MAKSUD DAN TUJUAN').setBold(true);
      body.appendParagraph('Maksud dari pengadaan ini adalah untuk memenuhi kebutuhan operasional dalam rangka peningkatan kinerja organisasi.');
      body.appendParagraph('');

      // III. SPESIFIKASI TEKNIS
      body.appendParagraph('III. SPESIFIKASI TEKNIS').setBold(true);
      body.appendParagraph('Spesifikasi teknis barang/jasa yang dibutuhkan:');

      if (paket.items && paket.items.length > 0) {
        const itemTable = body.appendTable();
        const headerRow = itemTable.appendTableRow();
        this._addTableHeader(headerRow, ['No', 'Uraian', 'Spesifikasi', 'Vol', 'Satuan']);

        paket.items.forEach((item, idx) => {
          const row = itemTable.appendTableRow();
          row.appendTableCell(String(idx + 1));
          row.appendTableCell(item.namaBarang || '-');
          row.appendTableCell(item.spesifikasi || '-');
          row.appendTableCell(String(item.volume || 1));
          row.appendTableCell(item.satuan || '-');
        });
      }

      body.appendParagraph('');

      // IV. DASAR PERTIMBANGAN
      body.appendParagraph('IV. DASAR PERTIMBANGAN').setBold(true);
      body.appendListItem('Kebutuhan operasional yang mendesak');
      body.appendListItem('Ketersediaan anggaran yang telah dialokasikan');
      body.appendListItem('Spesifikasi teknis yang telah disesuaikan dengan kebutuhan');
      body.appendParagraph('');

      // V. ESTIMASI BIAYA
      body.appendParagraph('V. ESTIMASI BIAYA').setBold(true);
      const biayaTable = body.appendTable();
      biayaTable.setBorderWidth(0);
      this._addInfoRow(biayaTable, 'Pagu Anggaran', `Rp ${formatRupiahDoc(paket.paguAnggaran || 0)}`);
      this._addInfoRow(biayaTable, 'Nilai HPS', `Rp ${formatRupiahDoc(paket.nilaiHPS || 0)}`);
      this._addInfoRow(biayaTable, 'Sumber Dana', paket.sumberDana || config.sumberDana || 'APBN');
      this._addInfoRow(biayaTable, 'MAK', paket.mak || config.mak || '-');

      body.appendParagraph('');

      // VI. KESIMPULAN
      body.appendParagraph('VI. KESIMPULAN DAN REKOMENDASI').setBold(true);
      body.appendParagraph(`Berdasarkan pertimbangan teknis di atas, pengadaan ${paket.namaPaket} dapat dilaksanakan dengan metode ${METODE_PENGADAAN[paket.metodePengadaan] || paket.metodePengadaan || 'Pengadaan Langsung'}.`);

      body.appendParagraph('');
      body.appendParagraph('Demikian Justifikasi Teknis ini dibuat untuk dipergunakan sebagaimana mestinya.');

      body.appendParagraph('');
      this._addSignature(body, config, 'Pejabat Pembuat Komitmen');
      this._addQRPlaceholder(body, paket.paketId, 'JUSTIFIKASI', nomorJT);

      doc.saveAndClose();
      return this._finalizeDocument(doc, paket.paketId, 'JUSTIFIKASI', nomorJT, 'Dokumen_Justifikasi');

    } catch (e) {
      console.error('Error generating Justifikasi:', e);
      return { success: false, error: 'Gagal membuat Justifikasi Teknis: ' + e.message };
    }
  },

  // ==================== HELPER FUNCTIONS ====================

  _setPageFormat: function(body) {
    body.setPageWidth(595.276); // A4
    body.setPageHeight(841.89);
    body.setMarginTop(50);
    body.setMarginBottom(40);
    body.setMarginLeft(60);
    body.setMarginRight(60);
  },

  _addKopSurat: function(body, config) {
    const kopTable = body.appendTable();
    kopTable.setBorderWidth(0);

    const row = kopTable.appendTableRow();
    row.appendTableCell('').setWidth(80); // Logo placeholder

    const textCell = row.appendTableCell();
    textCell.appendParagraph(config.namaKementerian || 'KEMENTERIAN/LEMBAGA').setBold(true).setFontSize(12).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    textCell.appendParagraph(config.namaSatker || 'SATUAN KERJA').setBold(true).setFontSize(14).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    textCell.appendParagraph(config.alamatSatker || 'Alamat Satuan Kerja').setFontSize(10).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    textCell.appendParagraph(`Telepon: ${config.teleponSatker || '-'} | Email: ${config.emailSatker || '-'}`).setFontSize(9).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    row.appendTableCell('').setWidth(80);

    // Separator line
    body.appendParagraph('═'.repeat(85)).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('');
  },

  _addCenteredTitle: function(body, text) {
    const p = body.appendParagraph(text);
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p.setBold(true);
    p.setFontSize(14);
  },

  _addCenteredText: function(body, text) {
    const p = body.appendParagraph(text);
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  },

  _addInfoRow: function(table, label, value) {
    const row = table.appendTableRow();
    row.appendTableCell(label).setWidth(140);
    row.appendTableCell(': ' + (value || '-'));
  },

  _addTableHeader: function(row, headers) {
    headers.forEach(header => {
      const cell = row.appendTableCell(header);
      cell.setBold(true);
      cell.setBackgroundColor('#4a86e8');
      cell.getChild(0).asParagraph().setForegroundColor('#ffffff');
    });
  },

  _addTotalRow: function(table, label, value, isFinal = false) {
    const row = table.appendTableRow();
    row.appendTableCell('');
    const labelCell = row.appendTableCell(label);
    labelCell.setBold(true);
    if (isFinal) labelCell.setBackgroundColor('#e8f0fe');
    row.appendTableCell('');
    row.appendTableCell('');
    row.appendTableCell('');
    const valueCell = row.appendTableCell(formatRupiahDoc(value));
    valueCell.setBold(true);
    if (isFinal) valueCell.setBackgroundColor('#e8f0fe');
    valueCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  },

  _addPaymentRow: function(table, label, value, isFinal = false) {
    const row = table.appendTableRow();
    const labelCell = row.appendTableCell(label);
    if (isFinal) labelCell.setBold(true);
    const valueCell = row.appendTableCell(value < 0 ? `(${formatRupiahDoc(Math.abs(value))})` : formatRupiahDoc(value));
    valueCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    if (isFinal) valueCell.setBold(true);
  },

  _addSignature: function(body, config, role) {
    const signTable = body.appendTable();
    signTable.setBorderWidth(0);

    const dateRow = signTable.appendTableRow();
    dateRow.appendTableCell('').setWidth(300);
    dateRow.appendTableCell(`${config.kotaSatker || 'Jakarta'}, ${formatTanggalIndo(getTimestamp())}`);

    const roleRow = signTable.appendTableRow();
    roleRow.appendTableCell('');
    roleRow.appendTableCell(role + ',').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // Digital signature placeholder
    const sigRow = signTable.appendTableRow();
    sigRow.appendTableCell('');
    const sigCell = sigRow.appendTableCell();
    sigCell.appendParagraph('');
    sigCell.appendParagraph('[Ditandatangani secara elektronik]').setFontSize(8).setItalic(true).setForegroundColor('#666666').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    sigCell.appendParagraph('');

    const nameRow = signTable.appendTableRow();
    nameRow.appendTableCell('');
    const nameCell = nameRow.appendTableCell();
    nameCell.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    nameCell.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  },

  _addDualSignature: function(body, config, penyedia, leftLabel = 'PIHAK KEDUA,', rightLabel = 'PIHAK PERTAMA,') {
    const signTable = body.appendTable();
    signTable.setBorderWidth(0);

    // Date
    const dateRow = signTable.appendTableRow();
    dateRow.appendTableCell('').setWidth(250);
    dateRow.appendTableCell(`${config.kotaSatker || 'Jakarta'}, ${formatTanggalIndo(getTimestamp())}`);

    // Labels
    const labelRow = signTable.appendTableRow();
    labelRow.appendTableCell(leftLabel).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    labelRow.appendTableCell(rightLabel).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // Signature placeholder
    const sigRow = signTable.appendTableRow();
    const leftSig = sigRow.appendTableCell();
    leftSig.appendParagraph('');
    leftSig.appendParagraph('[TTD]').setFontSize(8).setItalic(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    leftSig.appendParagraph('');
    const rightSig = sigRow.appendTableCell();
    rightSig.appendParagraph('');
    rightSig.appendParagraph('[TTD]').setFontSize(8).setItalic(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    rightSig.appendParagraph('');

    // Names
    const nameRow = signTable.appendTableRow();
    const leftName = nameRow.appendTableCell();
    leftName.appendParagraph(penyedia.direktur || penyedia.nama || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    leftName.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const rightName = nameRow.appendTableCell();
    rightName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    rightName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  },

  _addQRPlaceholder: function(body, entityId, docType, docNumber) {
    body.appendParagraph('');
    const qrTable = body.appendTable();
    qrTable.setBorderWidth(1);
    qrTable.setBorderColor('#cccccc');

    const row = qrTable.appendTableRow();
    const cell = row.appendTableCell();
    cell.setWidth(100);

    cell.appendParagraph('▢').setFontSize(40).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    cell.appendParagraph('QR Verifikasi').setFontSize(8).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    cell.appendParagraph(`${docType}/${docNumber}`).setFontSize(7).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    const infoCell = row.appendTableCell();
    infoCell.appendParagraph('Dokumen ini dapat diverifikasi melalui:').setFontSize(8);
    infoCell.appendParagraph('https://verify.example.go.id').setFontSize(8).setItalic(true);
    infoCell.appendParagraph(`ID: ${entityId}`).setFontSize(7);
    infoCell.appendParagraph(`Generated: ${getTimestamp()}`).setFontSize(7);
  },

  _getPenyediaData: function(paket) {
    if (paket.kontrak) {
      return {
        nama: paket.kontrak.namaPenyedia || paket.namaPenyedia,
        alamat: paket.kontrak.alamatPenyedia,
        npwp: paket.kontrak.npwpPenyedia,
        direktur: paket.kontrak.direkturPenyedia,
        bank: paket.kontrak.bank,
        noRekening: paket.kontrak.noRekening,
        namaRekening: paket.kontrak.namaRekening
      };
    }

    if (paket.penyediaId) {
      const penyedia = PenyediaService.getById(paket.penyediaId);
      if (penyedia) {
        return {
          nama: penyedia.namaPenyedia,
          alamat: penyedia.alamat,
          npwp: penyedia.npwp,
          direktur: penyedia.direktur,
          bank: penyedia.bank,
          noRekening: penyedia.noRekening,
          namaRekening: penyedia.namaRekening
        };
      }
    }

    return {
      nama: paket.namaPenyedia || '-',
      alamat: '-',
      npwp: '-',
      direktur: '-'
    };
  },

  _calculateDays: function(startDate, endDate) {
    if (!startDate || !endDate) return '-';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} hari kalender`;
  },

  _finalizeDocument: function(doc, paketId, docType, nomorDokumen, folderName) {
    const file = DriveApp.getFileById(doc.getId());
    const folder = getOrCreateFolder(folderName);
    file.moveTo(folder);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Save document record
    const docId = generateId('DOC');
    const now = getTimestamp();

    ensureSheet('DokumenPaket', [
      'docId', 'paketId', 'jenisDokumen', 'nomorDokumen', 'tanggalDokumen',
      'googleDocId', 'googleDocUrl', 'status', 'createdAt', 'createdBy'
    ]);

    getSpreadsheet().getSheetByName('DokumenPaket').appendRow([
      docId,
      paketId,
      docType,
      nomorDokumen,
      now,
      doc.getId(),
      doc.getUrl(),
      'GENERATED',
      now,
      ''
    ]);

    return {
      success: true,
      data: {
        docId: docId,
        googleDocId: doc.getId(),
        googleDocUrl: doc.getUrl(),
        jenisDokumen: docType,
        nomorDokumen: nomorDokumen,
        tanggalDokumen: now
      }
    };
  },

  // ==================== GET AVAILABLE TEMPLATES ====================
  getAvailableTemplates: function() {
    return Object.entries(DOCUMENT_TEMPLATES).map(([key, value]) => ({
      code: key,
      name: value.name,
      prefix: value.prefix,
      requiresPenyedia: value.requiresPenyedia,
      requiresKontrak: value.requiresKontrak
    }));
  }
};

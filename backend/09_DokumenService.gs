/**
 * 09_DokumenService.gs
 * Document Management Service for Paket Pengadaan
 * Sprint 1: Database & Backend Skeleton
 */

const DokumenService = {

  // Document types for Paket
  PAKET_DOC_TYPES: {
    KAK: 'Kerangka Acuan Kerja',
    HPS: 'Harga Perkiraan Sendiri',
    BA_NEGO: 'Berita Acara Negosiasi',
    SPK: 'Surat Perintah Kerja',
    KONTRAK: 'Dokumen Kontrak',
    SPMK: 'Surat Perintah Mulai Kerja',
    BAST: 'Berita Acara Serah Terima',
    BA_PHO: 'Berita Acara Pemeriksaan Hasil Pekerjaan',
    KUITANSI: 'Kuitansi Pembayaran'
  },

  // ==================== GET BY PAKET ====================
  getByPaket: function(paketId) {
    const rows = getRowsByColumn('DokumenPaket', 'paketId', paketId);
    return rows.map(r => ({
      ...r,
      id: r.docId,
      jenisDokumenLabel: this.PAKET_DOC_TYPES[r.jenisDokumen] || r.jenisDokumen
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ==================== GET BY ID ====================
  getById: function(docId) {
    const doc = getRowById('DokumenPaket', docId);
    if (!doc) return null;
    doc.id = doc.docId;
    doc.jenisDokumenLabel = this.PAKET_DOC_TYPES[doc.jenisDokumen] || doc.jenisDokumen;
    return doc;
  },

  // ==================== SAVE DOCUMENT RECORD ====================
  save: function(paketId, jenisDokumen, googleDocId, googleDocUrl, nomorDokumen = '') {
    setupPaketSheets();

    const docId = generateId('DOC');
    const now = getTimestamp();

    const row = [
      docId,
      paketId,
      jenisDokumen,
      nomorDokumen,
      now,
      googleDocId,
      googleDocUrl,
      'GENERATED',
      now,
      ''
    ];

    getSpreadsheet().getSheetByName('DokumenPaket').appendRow(row);
    return this.getById(docId);
  },

  // ==================== UPDATE STATUS ====================
  updateStatus: function(docId, status) {
    return updateRow('DokumenPaket', docId, { status: status }, ['status']);
  },

  // ==================== DELETE ====================
  delete: function(docId) {
    const doc = this.getById(docId);
    if (doc && doc.googleDocId) {
      try {
        DriveApp.getFileById(doc.googleDocId).setTrashed(true);
      } catch (e) {
        console.error('Error deleting file from Drive:', e);
      }
    }
    return deleteRow('DokumenPaket', docId);
  },

  // ==================== GENERATE DOCUMENT ====================
  generate: function(paketId, docType) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    switch (docType?.toUpperCase()) {
      case 'HPS':
        return HPSService.generateDocument(paketId);

      case 'SPK':
        return this.generateSPK(paket);

      case 'BAST':
        return this.generateBAST(paket);

      case 'KUITANSI':
        return this.generateKuitansi(paket);

      case 'BA_NEGO':
        return this.generateBANego(paket);

      default:
        return { success: false, error: 'Jenis dokumen tidak dikenal: ' + docType };
    }
  },

  // ==================== GENERATE SPK ====================
  generateSPK: function(paket) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const penyedia = kontrak ? {
      nama: kontrak.namaPenyedia,
      alamat: kontrak.alamatPenyedia,
      npwp: kontrak.npwpPenyedia,
      direktur: kontrak.direkturPenyedia
    } : (paket.penyediaId ? PenyediaService.getById(paket.penyediaId) : null);

    if (!penyedia || !penyedia.nama) {
      return { success: false, error: 'Data penyedia belum lengkap' };
    }

    try {
      // Generate document number
      const nomorResult = NumberingService.generateNumber('SPK');
      const nomorSPK = nomorResult.success ? nomorResult.data.number : '';

      const doc = DocumentApp.create('SPK - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Header
      const title = body.appendParagraph('SURAT PERINTAH KERJA');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('Nomor: ' + nomorSPK).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      // Opening
      body.appendParagraph('Yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      // PPK Info
      const ppkTable = body.appendTable();
      ppkTable.setBorderWidth(0);

      const addRow = (label, value) => {
        const row = ppkTable.appendTableRow();
        row.appendTableCell(label).setWidth(120);
        row.appendTableCell(': ' + value);
      };

      addRow('Nama', config.namaPPK || '-');
      addRow('NIP', config.nipPPK || '-');
      addRow('Jabatan', config.jabatanPPK || 'Pejabat Pembuat Komitmen');

      body.appendParagraph('');
      body.appendParagraph('Selanjutnya disebut sebagai PIHAK PERTAMA');
      body.appendParagraph('');

      body.appendParagraph('Memberikan perintah kerja kepada:');
      body.appendParagraph('');

      // Penyedia Info
      const penyediaTable = body.appendTable();
      penyediaTable.setBorderWidth(0);

      const addPenyediaRow = (label, value) => {
        const row = penyediaTable.appendTableRow();
        row.appendTableCell(label).setWidth(120);
        row.appendTableCell(': ' + (value || '-'));
      };

      addPenyediaRow('Nama', penyedia.nama || penyedia.namaPenyedia);
      addPenyediaRow('Alamat', penyedia.alamat);
      addPenyediaRow('NPWP', penyedia.npwp);
      addPenyediaRow('Direktur', penyedia.direktur);

      body.appendParagraph('');
      body.appendParagraph('Selanjutnya disebut sebagai PIHAK KEDUA');
      body.appendParagraph('');

      // Job details
      body.appendParagraph('Untuk melaksanakan pekerjaan:');
      body.appendParagraph('');

      const jobTable = body.appendTable();
      jobTable.setBorderWidth(0);

      const addJobRow = (label, value) => {
        const row = jobTable.appendTableRow();
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + (value || '-'));
      };

      addJobRow('Nama Pekerjaan', paket.namaPaket);
      addJobRow('Jenis Pengadaan', JENIS_PENGADAAN[paket.jenisPengadaan] || paket.jenisPengadaan);
      addJobRow('Nilai Kontrak', 'Rp ' + formatRupiahDoc(paket.nilaiKontrak || paket.nilaiHPS || 0));
      addJobRow('Jangka Waktu', kontrak?.jangkaWaktu || '-');
      addJobRow('Tanggal Mulai', formatTanggalIndo(kontrak?.tanggalMulai || paket.tanggalKontrak));
      addJobRow('Tanggal Selesai', formatTanggalIndo(kontrak?.tanggalSelesai || paket.tanggalSelesai));

      body.appendParagraph('');

      // Terbilang
      const nilaiKontrak = paket.nilaiKontrak || paket.nilaiHPS || 0;
      body.appendParagraph('Terbilang: ' + terbilangClean(nilaiKontrak) + ' rupiah').setItalic(true);

      body.appendParagraph('');
      body.appendParagraph('Demikian Surat Perintah Kerja ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.');

      body.appendParagraph('');

      // Signatures
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(getTimestamp()));

      const labelRow = signTable.appendTableRow();
      const leftLabel = labelRow.appendTableCell('PIHAK KEDUA,');
      leftLabel.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const rightLabel = labelRow.appendTableCell('PIHAK PERTAMA,');
      rightLabel.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(penyedia.direktur || penyedia.nama || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      // Move to folder
      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // Save record
      this.save(paket.paketId, 'SPK', doc.getId(), doc.getUrl(), nomorSPK);

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'SPK',
          nomorDokumen: nomorSPK
        }
      };

    } catch (e) {
      console.error('Error generating SPK:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE BAST ====================
  generateBAST: function(paket) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const serahTerima = paket.serahTerima && paket.serahTerima.length > 0 ? paket.serahTerima[0] : null;

    if (!kontrak) {
      return { success: false, error: 'Data kontrak belum ada' };
    }

    try {
      const nomorResult = NumberingService.generateNumber('BAST');
      const nomorBA = nomorResult.success ? nomorResult.data.number : '';

      const doc = DocumentApp.create('BAST - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('BERITA ACARA SERAH TERIMA');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      const subtitle = body.appendParagraph('HASIL PEKERJAAN');
      subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      subtitle.setBold(true);

      body.appendParagraph('Nomor: ' + nomorBA).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      // Opening text
      body.appendParagraph('Pada hari ini, ' + formatTanggalIndo(serahTerima?.tanggalBA || getTimestamp()) +
        ', kami yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      // Parties table
      const partiesTable = body.appendTable();

      // PPK
      const ppkRow = partiesTable.appendTableRow();
      ppkRow.appendTableCell('I.').setWidth(30);
      const ppkCell = ppkRow.appendTableCell();
      ppkCell.appendParagraph('Nama : ' + (config.namaPPK || '-'));
      ppkCell.appendParagraph('NIP : ' + (config.nipPPK || '-'));
      ppkCell.appendParagraph('Jabatan : ' + (config.jabatanPPK || 'Pejabat Pembuat Komitmen'));
      ppkCell.appendParagraph('Selanjutnya disebut sebagai PIHAK PERTAMA');

      // Penyedia
      const penyediaRow = partiesTable.appendTableRow();
      penyediaRow.appendTableCell('II.');
      const penyediaCell = penyediaRow.appendTableCell();
      penyediaCell.appendParagraph('Nama : ' + (kontrak.namaPenyedia || '-'));
      penyediaCell.appendParagraph('Alamat : ' + (kontrak.alamatPenyedia || '-'));
      penyediaCell.appendParagraph('Direktur : ' + (kontrak.direkturPenyedia || '-'));
      penyediaCell.appendParagraph('Selanjutnya disebut sebagai PIHAK KEDUA');

      body.appendParagraph('');
      body.appendParagraph('Berdasarkan Surat Perintah Kerja/Kontrak Nomor: ' + (kontrak.nomorKontrak || '-') +
        ' tanggal ' + formatTanggalIndo(kontrak.tanggalKontrak) + ', menyatakan bahwa:');
      body.appendParagraph('');

      // Content
      body.appendParagraph('1. PIHAK KEDUA telah melaksanakan dan menyelesaikan pekerjaan:');
      body.appendParagraph('   - Nama Pekerjaan: ' + paket.namaPaket);
      body.appendParagraph('   - Nilai Kontrak: Rp ' + formatRupiahDoc(kontrak.nilaiKontrak || paket.nilaiKontrak || 0));
      body.appendParagraph('   - Persentase Penyelesaian: ' + (serahTerima?.persentase || 100) + '%');

      body.appendParagraph('');
      body.appendParagraph('2. PIHAK PERTAMA telah memeriksa dan menerima hasil pekerjaan tersebut dengan baik.');
      body.appendParagraph('');
      body.appendParagraph('3. Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat digunakan sebagaimana mestinya.');

      body.appendParagraph('');

      // Signatures
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('PIHAK KEDUA,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('PIHAK PERTAMA,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(kontrak.direkturPenyedia || kontrak.namaPenyedia || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.save(paket.paketId, 'BAST', doc.getId(), doc.getUrl(), nomorBA);

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'BAST',
          nomorDokumen: nomorBA
        }
      };

    } catch (e) {
      console.error('Error generating BAST:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE KUITANSI ====================
  generateKuitansi: function(paket) {
    const config = ConfigService.getConfig();
    const kontrak = paket.kontrak;
    const pembayaran = paket.pembayaran && paket.pembayaran.length > 0 ?
      paket.pembayaran[paket.pembayaran.length - 1] : null;

    if (!kontrak) {
      return { success: false, error: 'Data kontrak belum ada' };
    }

    try {
      const nomorResult = NumberingService.generateNumber('KUITANSI');
      const nomorKuitansi = nomorResult.success ? nomorResult.data.number : '';

      const nilaiPembayaran = pembayaran?.nilaiNetto || kontrak.nilaiKontrak || paket.nilaiKontrak || 0;

      const doc = DocumentApp.create('Kuitansi - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('KUITANSI');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(16);

      body.appendParagraph('Nomor: ' + nomorKuitansi).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      // Amount box
      const amountTable = body.appendTable();
      const amountRow = amountTable.appendTableRow();
      const amountCell = amountRow.appendTableCell('Rp ' + formatRupiahDoc(nilaiPembayaran) + ',-');
      amountCell.setBold(true);
      amountCell.setFontSize(14);
      amountCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // Content
      body.appendParagraph('Terima dari : ' + (config.namaSatker || '-'));
      body.appendParagraph('Uang sebanyak : ' + terbilangClean(nilaiPembayaran) + ' rupiah');
      body.appendParagraph('Untuk pembayaran : ' + paket.namaPaket);
      body.appendParagraph('Nomor Kontrak : ' + (kontrak.nomorKontrak || '-'));
      body.appendParagraph('');

      // Detail table
      if (pembayaran) {
        const detailTable = body.appendTable();

        const headerRow = detailTable.appendTableRow();
        headerRow.appendTableCell('Uraian').setBold(true).setWidth(250);
        headerRow.appendTableCell('Jumlah (Rp)').setBold(true).setWidth(120);

        const dppRow = detailTable.appendTableRow();
        dppRow.appendTableCell('Nilai DPP');
        dppRow.appendTableCell(formatRupiahDoc(pembayaran.nilaiTagihan || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

        const ppnRow = detailTable.appendTableRow();
        ppnRow.appendTableCell('PPN');
        ppnRow.appendTableCell(formatRupiahDoc(pembayaran.nilaiPPN || 0)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

        const pphRow = detailTable.appendTableRow();
        pphRow.appendTableCell('PPh (dipotong)');
        pphRow.appendTableCell('(' + formatRupiahDoc(pembayaran.nilaiPPH || 0) + ')').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

        const totalRow = detailTable.appendTableRow();
        totalRow.appendTableCell('Jumlah Diterima').setBold(true);
        totalRow.appendTableCell(formatRupiahDoc(nilaiPembayaran)).setBold(true).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      }

      body.appendParagraph('');

      // Signatures
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('Mengetahui,\nPejabat Pembuat Komitmen').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('Yang Menerima,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(kontrak.direkturPenyedia || kontrak.namaPenyedia || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph(kontrak.namaPenyedia || '').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.save(paket.paketId, 'KUITANSI', doc.getId(), doc.getUrl(), nomorKuitansi);

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'KUITANSI',
          nomorDokumen: nomorKuitansi
        }
      };

    } catch (e) {
      console.error('Error generating Kuitansi:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE BA NEGO ====================
  generateBANego: function(paket) {
    const config = ConfigService.getConfig();
    const hps = HPSService.calculate(paket.paketId);

    if (!hps.success || !hps.data.items || hps.data.items.length === 0) {
      return { success: false, error: 'Data HPS belum lengkap' };
    }

    try {
      const nomorResult = NumberingService.generateNumber('BA_NEGO');
      const nomorBA = nomorResult.success ? nomorResult.data.number : '';

      const doc = DocumentApp.create('BA Negosiasi - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('BERITA ACARA HASIL NEGOSIASI');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('Nomor: ' + nomorBA).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      body.appendParagraph('Pada hari ini, ' + formatTanggalIndo(getTimestamp()) + ', telah dilaksanakan negosiasi harga ' +
        'untuk paket pengadaan:');
      body.appendParagraph('');

      // Paket info
      body.appendParagraph('Nama Paket : ' + paket.namaPaket);
      body.appendParagraph('Pagu : Rp ' + formatRupiahDoc(paket.paguAnggaran || 0));
      body.appendParagraph('Nilai HPS : Rp ' + formatRupiahDoc(hps.data.total));
      body.appendParagraph('');

      body.appendParagraph('Hasil negosiasi sebagai berikut:');
      body.appendParagraph('');

      // Results table
      const resultTable = body.appendTable();

      const headerRow = resultTable.appendTableRow();
      headerRow.appendTableCell('No').setBold(true).setWidth(30);
      headerRow.appendTableCell('Uraian').setBold(true).setWidth(200);
      headerRow.appendTableCell('Harga HPS').setBold(true).setWidth(100);
      headerRow.appendTableCell('Harga Nego').setBold(true).setWidth(100);

      hps.data.items.forEach((item, idx) => {
        const row = resultTable.appendTableRow();
        row.appendTableCell(String(idx + 1));
        row.appendTableCell(item.namaBarang);
        row.appendTableCell(formatRupiahDoc(item.totalHarga)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        row.appendTableCell(formatRupiahDoc(item.totalHarga)).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      });

      // Totals
      const totalRow = resultTable.appendTableRow();
      totalRow.appendTableCell('').setBackgroundColor('#eeeeee');
      totalRow.appendTableCell('TOTAL').setBold(true).setBackgroundColor('#eeeeee');
      totalRow.appendTableCell(formatRupiahDoc(hps.data.total)).setBold(true).setBackgroundColor('#eeeeee').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      totalRow.appendTableCell(formatRupiahDoc(hps.data.total)).setBold(true).setBackgroundColor('#eeeeee').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      body.appendParagraph('');
      body.appendParagraph('Demikian Berita Acara ini dibuat dengan sebenarnya.');
      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(300);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('');
      labelRow.appendTableCell('Pejabat Pembuat Komitmen,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      nameRow.appendTableCell('');
      const nameCell = nameRow.appendTableCell();
      nameCell.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      nameCell.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.save(paket.paketId, 'BA_NEGO', doc.getId(), doc.getUrl(), nomorBA);

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'BA_NEGO',
          nomorDokumen: nomorBA
        }
      };

    } catch (e) {
      console.error('Error generating BA Negosiasi:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GET DOCUMENT TYPES ====================
  getDocumentTypes: function() {
    return Object.entries(this.PAKET_DOC_TYPES).map(([value, label]) => ({
      value,
      label
    }));
  }
};

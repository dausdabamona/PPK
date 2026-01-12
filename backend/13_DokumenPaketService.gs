/**
 * 13_DokumenPaketService.gs
 * Document Generator Service for Paket Pengadaan
 */

const DokumenService = {

  // ==================== GET DOCUMENTS BY PAKET ====================
  getByPaket: function(paketId) {
    return getRowsByColumn('DokumenPaket', 'paketId', paketId)
      .map(d => ({ ...d, id: d.docId }));
  },

  // ==================== GENERATE DOCUMENT ====================
  generate: function(paketId, docType) {
    switch (docType?.toUpperCase()) {
      case 'HPS':
        return HPSService.generateDocument(paketId);
      case 'SPK':
        return this.generateSPK(paketId);
      case 'KONTRAK':
        return this.generateKontrak(paketId);
      case 'BAST':
        return this.generateBAST(paketId);
      case 'KUITANSI':
        return this.generateKuitansi(paketId);
      case 'BA_NEGOSIASI':
        return this.generateBANegosiasi(paketId);
      default:
        return { success: false, error: 'Jenis dokumen tidak dikenal: ' + docType };
    }
  },

  // ==================== GENERATE SPK ====================
  generateSPK: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const kontrak = paket.kontrak || {};
      const penyedia = kontrak.namaPenyedia || paket.namaPenyedia || '-';

      const doc = DocumentApp.create('SPK - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Header
      const header = body.appendParagraph(config.namaSatker || 'NAMA SATUAN KERJA');
      header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      header.setBold(true);
      header.setFontSize(14);

      body.appendParagraph(config.alamatSatker || 'Alamat').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendHorizontalRule();
      body.appendParagraph('');

      // Title
      const title = body.appendParagraph('SURAT PERINTAH KERJA (SPK)');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      const nomor = kontrak.nomorKontrak || NumberingService.generateNumber('SPK').data?.number || '-';
      body.appendParagraph('Nomor: ' + nomor).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      // Parties
      body.appendParagraph('Yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      // PPK info
      const ppkTable = body.appendTable();
      ppkTable.setBorderWidth(0);

      const addRow = (label, value) => {
        const row = ppkTable.appendTableRow();
        row.appendTableCell(label).setWidth(120);
        row.appendTableCell(': ' + value);
      };

      addRow('Nama', config.namaPPK || '-');
      addRow('Jabatan', config.jabatanPPK || 'Pejabat Pembuat Komitmen');
      addRow('NIP', config.nipPPK || '-');
      addRow('Alamat', config.alamatSatker || '-');

      body.appendParagraph('');
      body.appendParagraph('Selanjutnya disebut sebagai PIHAK PERTAMA');
      body.appendParagraph('');

      // Penyedia info
      const penyediaTable = body.appendTable();
      penyediaTable.setBorderWidth(0);

      const addRow2 = (label, value) => {
        const row = penyediaTable.appendTableRow();
        row.appendTableCell(label).setWidth(120);
        row.appendTableCell(': ' + value);
      };

      addRow2('Nama', kontrak.direkturPenyedia || '-');
      addRow2('Jabatan', 'Direktur');
      addRow2('Perusahaan', penyedia);
      addRow2('Alamat', kontrak.alamatPenyedia || '-');
      addRow2('NPWP', kontrak.npwpPenyedia || '-');

      body.appendParagraph('');
      body.appendParagraph('Selanjutnya disebut sebagai PIHAK KEDUA');
      body.appendParagraph('');

      // Content
      body.appendParagraph('PIHAK PERTAMA memerintahkan PIHAK KEDUA untuk melaksanakan pekerjaan:');
      body.appendParagraph('');

      const contentTable = body.appendTable();

      const addContentRow = (no, label, value) => {
        const row = contentTable.appendTableRow();
        row.appendTableCell(no).setWidth(30);
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + value);
      };

      addContentRow('1.', 'Nama Pekerjaan', paket.namaPaket);
      addContentRow('2.', 'Nilai Pekerjaan', 'Rp ' + formatRupiahDoc(kontrak.nilaiKontrak || paket.nilaiKontrak || paket.nilaiHPS || 0));
      addContentRow('3.', 'Waktu Pelaksanaan', (kontrak.jangkaWaktu || '-') + ' hari kalender');
      addContentRow('4.', 'Tanggal Mulai', formatTanggalIndo(kontrak.tanggalMulai || ''));
      addContentRow('5.', 'Tanggal Selesai', formatTanggalIndo(kontrak.tanggalSelesai || ''));
      addContentRow('6.', 'Sumber Dana', paket.sumberDana || config.namaSatker || '-');

      body.appendParagraph('');

      // Items
      if (paket.items && paket.items.length > 0) {
        body.appendParagraph('Rincian Pekerjaan:').setBold(true);

        const itemTable = body.appendTable();
        const headerRow = itemTable.appendTableRow();
        headerRow.appendTableCell('No.').setBold(true).setWidth(30);
        headerRow.appendTableCell('Uraian').setBold(true).setWidth(200);
        headerRow.appendTableCell('Vol').setBold(true).setWidth(40);
        headerRow.appendTableCell('Satuan').setBold(true).setWidth(50);
        headerRow.appendTableCell('Harga Satuan').setBold(true).setWidth(80);
        headerRow.appendTableCell('Jumlah').setBold(true).setWidth(80);

        paket.items.forEach((item, idx) => {
          const row = itemTable.appendTableRow();
          row.appendTableCell(String(idx + 1));
          row.appendTableCell(item.namaBarang || '-');
          row.appendTableCell(String(item.volume || 0));
          row.appendTableCell(item.satuan || '-');

          const hargaCell = row.appendTableCell(formatRupiahDoc(item.hargaSatuan || 0));
          hargaCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

          const totalCell = row.appendTableCell(formatRupiahDoc(item.hargaTotal || 0));
          totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        });
      }

      body.appendParagraph('');

      // Terbilang
      const nilai = kontrak.nilaiKontrak || paket.nilaiKontrak || paket.nilaiHPS || 0;
      body.appendParagraph('Terbilang: ' + terbilangClean(nilai) + ' rupiah').setItalic(true);

      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(kontrak.tanggalKontrak || getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('PIHAK KEDUA,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('PIHAK PERTAMA,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(kontrak.direkturPenyedia || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      // Save to Drive
      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      // Save record
      this.saveDocumentRecord(paketId, 'SPK', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'SPK'
        }
      };

    } catch (e) {
      console.error('Error generating SPK:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE KONTRAK ====================
  generateKontrak: function(paketId) {
    // Similar to SPK but more detailed
    // For now, redirect to SPK
    return this.generateSPK(paketId);
  },

  // ==================== GENERATE BAST ====================
  generateBAST: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const kontrak = paket.kontrak || {};
      const serahTerima = paket.serahTerima && paket.serahTerima.length > 0 ? paket.serahTerima[0] : {};

      const doc = DocumentApp.create('BAST - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('BERITA ACARA SERAH TERIMA PEKERJAAN');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      const nomor = serahTerima.nomorBA || NumberingService.generateNumber('BAST').data?.number || '-';
      body.appendParagraph('Nomor: ' + nomor).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      body.appendParagraph('');

      // Opening
      body.appendParagraph('Pada hari ini, ' + formatTanggalIndo(serahTerima.tanggalBA || getTimestamp()) + ', kami yang bertanda tangan di bawah ini:');
      body.appendParagraph('');

      // PPK
      body.appendParagraph('1. ' + (config.namaPPK || '-'));
      body.appendParagraph('   Jabatan: ' + (config.jabatanPPK || 'Pejabat Pembuat Komitmen'));
      body.appendParagraph('   Selanjutnya disebut PIHAK PERTAMA');
      body.appendParagraph('');

      // Penyedia
      body.appendParagraph('2. ' + (kontrak.direkturPenyedia || '-'));
      body.appendParagraph('   Jabatan: Direktur ' + (kontrak.namaPenyedia || paket.namaPenyedia || '-'));
      body.appendParagraph('   Selanjutnya disebut PIHAK KEDUA');
      body.appendParagraph('');

      body.appendParagraph('Menyatakan bahwa:');
      body.appendParagraph('');

      // Content table
      const contentTable = body.appendTable();

      const addContentRow = (no, content) => {
        const row = contentTable.appendTableRow();
        row.appendTableCell(no).setWidth(30);
        row.appendTableCell(content);
      };

      addContentRow('1.', 'PIHAK KEDUA telah menyelesaikan pekerjaan: ' + paket.namaPaket);
      addContentRow('2.', 'Berdasarkan SPK/Kontrak Nomor: ' + (kontrak.nomorKontrak || '-') + ' tanggal ' + formatTanggalIndo(kontrak.tanggalKontrak));
      addContentRow('3.', 'Dengan nilai pekerjaan: Rp ' + formatRupiahDoc(kontrak.nilaiKontrak || paket.nilaiKontrak || 0));
      addContentRow('4.', 'Pekerjaan telah dilaksanakan dengan baik sesuai spesifikasi');
      addContentRow('5.', 'PIHAK PERTAMA menerima hasil pekerjaan dari PIHAK KEDUA');

      body.appendParagraph('');
      body.appendParagraph('Demikian Berita Acara Serah Terima ini dibuat untuk dipergunakan sebagaimana mestinya.');
      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(serahTerima.tanggalBA || getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('PIHAK KEDUA,\nYang Menyerahkan').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('PIHAK PERTAMA,\nYang Menerima').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftName = nameRow.appendTableCell();
      leftName.appendParagraph(kontrak.direkturPenyedia || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      leftName.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const rightName = nameRow.appendTableCell();
      rightName.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightName.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDocumentRecord(paketId, 'BAST', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'BAST'
        }
      };

    } catch (e) {
      console.error('Error generating BAST:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE KUITANSI ====================
  generateKuitansi: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const kontrak = paket.kontrak || {};
      const pembayaran = paket.pembayaran && paket.pembayaran.length > 0 ? paket.pembayaran[0] : {};

      const doc = DocumentApp.create('Kuitansi - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('KUITANSI / BUKTI PEMBAYARAN');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('');

      const nilai = pembayaran.nilaiNetto || kontrak.nilaiKontrak || paket.nilaiKontrak || 0;

      // Amount box
      const amountBox = body.appendTable();
      const amountRow = amountBox.appendTableRow();
      const amountCell = amountRow.appendTableCell('Rp ' + formatRupiahDoc(nilai));
      amountCell.setBackgroundColor('#f0f0f0');
      amountCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER).setBold(true).setFontSize(16);

      body.appendParagraph('');

      // Details table
      const detailTable = body.appendTable();
      detailTable.setBorderWidth(0);

      const addRow = (label, value) => {
        const row = detailTable.appendTableRow();
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + value);
      };

      addRow('Sudah Terima dari', config.namaSatker || '-');
      addRow('Terbilang', terbilangClean(nilai) + ' rupiah');
      addRow('Untuk Pembayaran', paket.namaPaket);
      addRow('Nomor SPK/Kontrak', kontrak.nomorKontrak || '-');
      addRow('Tanggal', formatTanggalIndo(pembayaran.tanggalBayar || getTimestamp()));

      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(300);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(pembayaran.tanggalBayar || getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('');
      labelRow.appendTableCell('Yang Menerima,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      nameRow.appendTableCell('');
      const nameCell = nameRow.appendTableCell();
      nameCell.appendParagraph(kontrak.direkturPenyedia || kontrak.namaPenyedia || paket.namaPenyedia || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      nameCell.appendParagraph('Direktur').setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // Footer stamps
      body.appendParagraph('Mengetahui,').setBold(true);

      const footerTable = body.appendTable();
      footerTable.setBorderWidth(0);

      const footerLabelRow = footerTable.appendTableRow();
      footerLabelRow.appendTableCell('Bendahara Pengeluaran').setWidth(200).getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      footerLabelRow.appendTableCell('Pejabat Pembuat Komitmen').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const footerSpaceRow = footerTable.appendTableRow();
      footerSpaceRow.appendTableCell('\n\n\n');
      footerSpaceRow.appendTableCell('\n\n\n');

      const footerNameRow = footerTable.appendTableRow();
      const bendaharaCell = footerNameRow.appendTableCell();
      bendaharaCell.appendParagraph(config.namaBendahara || '....................').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      bendaharaCell.appendParagraph('NIP. ' + (config.nipBendahara || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const ppkCell = footerNameRow.appendTableCell();
      ppkCell.appendParagraph(config.namaPPK || '....................').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      ppkCell.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDocumentRecord(paketId, 'KUITANSI', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'KUITANSI'
        }
      };

    } catch (e) {
      console.error('Error generating Kuitansi:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== GENERATE BA NEGOSIASI ====================
  generateBANegosiasi: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    try {
      const config = ConfigService.getConfig();
      const penyedia = paket.namaPenyedia || '-';

      const doc = DocumentApp.create('BA Negosiasi - ' + paket.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('BERITA ACARA NEGOSIASI HARGA');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('');

      // Opening
      body.appendParagraph('Pada hari ini ' + formatTanggalIndo(getTimestamp()) + ', telah dilaksanakan negosiasi harga untuk pengadaan:');
      body.appendParagraph('');

      // Details
      const detailTable = body.appendTable();
      detailTable.setBorderWidth(0);

      const addRow = (label, value) => {
        const row = detailTable.appendTableRow();
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + value);
      };

      addRow('Nama Pekerjaan', paket.namaPaket);
      addRow('Metode Pengadaan', METODE_PENGADAAN[paket.metodePengadaan] || paket.metodePengadaan);
      addRow('Penyedia', penyedia);
      addRow('Nilai HPS', 'Rp ' + formatRupiahDoc(paket.nilaiHPS || 0));

      body.appendParagraph('');

      // Negotiation result
      body.appendParagraph('Hasil Negosiasi:').setBold(true);

      const resultTable = body.appendTable();
      resultTable.setBorderWidth(0);

      const nilaiKontrak = paket.nilaiKontrak || paket.nilaiHPS || 0;

      const addResultRow = (label, value) => {
        const row = resultTable.appendTableRow();
        row.appendTableCell(label).setWidth(180);
        row.appendTableCell(': ' + value);
      };

      addResultRow('Harga Penawaran Awal', 'Rp ' + formatRupiahDoc(paket.nilaiHPS || 0));
      addResultRow('Harga Hasil Negosiasi', 'Rp ' + formatRupiahDoc(nilaiKontrak));
      addResultRow('Selisih', 'Rp ' + formatRupiahDoc((paket.nilaiHPS || 0) - nilaiKontrak));

      body.appendParagraph('');
      body.appendParagraph('Demikian Berita Acara ini dibuat dengan sebenarnya.');
      body.appendParagraph('');

      // Signature
      const signTable = body.appendTable();
      signTable.setBorderWidth(0);

      const dateRow = signTable.appendTableRow();
      dateRow.appendTableCell('').setWidth(250);
      dateRow.appendTableCell((config.kotaSatker || 'Malang') + ', ' + formatTanggalIndo(getTimestamp()));

      const labelRow = signTable.appendTableRow();
      labelRow.appendTableCell('Penyedia,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      labelRow.appendTableCell('Pejabat Pembuat Komitmen,').getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const spaceRow = signTable.appendTableRow();
      spaceRow.appendTableCell('\n\n\n\n');
      spaceRow.appendTableCell('\n\n\n\n');

      const nameRow = signTable.appendTableRow();
      const leftCell = nameRow.appendTableCell();
      leftCell.appendParagraph(penyedia).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const rightCell = nameRow.appendTableCell();
      rightCell.appendParagraph(config.namaPPK || '....................').setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      rightCell.appendParagraph('NIP. ' + (config.nipPPK || '....................')).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      doc.saveAndClose();

      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
      file.moveTo(folder);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      this.saveDocumentRecord(paketId, 'BA_NEGOSIASI', doc.getId(), doc.getUrl());

      return {
        success: true,
        data: {
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'BA_NEGOSIASI'
        }
      };

    } catch (e) {
      console.error('Error generating BA Negosiasi:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== SAVE DOCUMENT RECORD ====================
  saveDocumentRecord: function(paketId, jenisDokumen, googleDocId, googleDocUrl) {
    ensureSheet('DokumenPaket', [
      'docId', 'paketId', 'jenisDokumen', 'nomorDokumen', 'tanggalDokumen',
      'googleDocId', 'googleDocUrl', 'status', 'createdAt', 'createdBy'
    ]);

    const docId = generateId('DOC');
    const now = getTimestamp();

    getSpreadsheet().getSheetByName('DokumenPaket').appendRow([
      docId,
      paketId,
      jenisDokumen,
      '',
      now,
      googleDocId,
      googleDocUrl,
      'GENERATED',
      now,
      ''
    ]);

    return docId;
  }
};

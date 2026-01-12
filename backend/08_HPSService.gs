/**
 * 08_HPSService.gs
 * HPS (Harga Perkiraan Sendiri) Calculation Service
 */

const HPSService = {

  // ==================== CALCULATE HPS ====================
  calculate: function(paketId) {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }

    const items = ItemService.getByPaket(paketId);
    if (items.length === 0) {
      return {
        success: true,
        data: {
          paketId,
          namaPaket: paket.namaPaket,
          items: [],
          subtotal: 0,
          ppn: 0,
          total: 0,
          terbilang: 'nol rupiah',
          isComplete: false
        }
      };
    }

    const config = ConfigService.getConfig();
    const ppnRate = parseFloat(config.ppnRate || 11) / 100;

    // Calculate each item
    const itemDetails = items.map(item => {
      const surveys = SurveyService.getByItem(item.itemId);
      const selectedSurvey = surveys.find(s => s.isSelected);

      // Use selected survey price, or average of surveys, or item's hargaSatuan
      let hargaHPS = item.hargaSatuan || 0;

      if (selectedSurvey) {
        hargaHPS = selectedSurvey.hargaPenawaran || hargaHPS;
      } else if (surveys.length > 0) {
        // If no selected, use the lowest price
        hargaHPS = Math.min(...surveys.map(s => s.hargaPenawaran || Infinity));
        if (hargaHPS === Infinity) hargaHPS = item.hargaSatuan || 0;
      }

      const volume = item.volume || 1;
      const totalHarga = hargaHPS * volume;

      return {
        itemId: item.itemId,
        namaBarang: item.namaBarang,
        spesifikasi: item.spesifikasi,
        satuan: item.satuan,
        volume: volume,
        hargaSatuan: hargaHPS,
        totalHarga: totalHarga,
        surveyCount: surveys.length,
        hasSelectedSurvey: !!selectedSurvey,
        selectedPenyedia: selectedSurvey?.namaPenyedia || null
      };
    });

    const subtotal = itemDetails.reduce((sum, item) => sum + item.totalHarga, 0);
    const ppn = Math.round(subtotal * ppnRate);
    const total = subtotal + ppn;

    // Check if all items have surveys with selection
    const surveyStatus = SurveyService.getSummaryForPaket(paketId);

    return {
      success: true,
      data: {
        paketId,
        namaPaket: paket.namaPaket,
        jenisPengadaan: paket.jenisPengadaan,
        metodePengadaan: paket.metodePengadaan,
        paguAnggaran: paket.paguAnggaran,
        items: itemDetails,
        subtotal: subtotal,
        ppnRate: ppnRate * 100,
        ppn: ppn,
        total: total,
        terbilang: terbilangClean(total) + ' rupiah',
        surveyStatus: surveyStatus,
        isComplete: surveyStatus.isComplete,
        isWithinBudget: total <= (paket.paguAnggaran || Infinity),
        savedAt: getTimestamp()
      }
    };
  },

  // ==================== SAVE HPS ====================
  saveHPS: function(paketId) {
    const hpsResult = this.calculate(paketId);
    if (!hpsResult.success) return hpsResult;

    // Update paket with HPS value
    PaketService.update(paketId, {
      nilaiHPS: hpsResult.data.total
    });

    return hpsResult;
  },

  // ==================== GENERATE HPS DOCUMENT ====================
  generateDocument: function(paketId) {
    const hpsResult = this.calculate(paketId);
    if (!hpsResult.success) return hpsResult;

    const hps = hpsResult.data;
    const config = ConfigService.getConfig();

    try {
      const doc = DocumentApp.create('HPS - ' + hps.namaPaket);
      const body = doc.getBody();

      body.setPageWidth(595.276);
      body.setPageHeight(841.89);
      body.setMarginTop(50);
      body.setMarginBottom(40);
      body.setMarginLeft(60);
      body.setMarginRight(60);

      // Title
      const title = body.appendParagraph('HARGA PERKIRAAN SENDIRI (HPS)');
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      title.setBold(true);
      title.setFontSize(14);

      body.appendParagraph('');

      // Info
      const infoTable = body.appendTable();
      infoTable.setBorderWidth(0);

      const addInfo = (label, value) => {
        const row = infoTable.appendTableRow();
        row.appendTableCell(label).setWidth(150);
        row.appendTableCell(': ' + value);
      };

      addInfo('Nama Paket', hps.namaPaket);
      addInfo('Jenis Pengadaan', JENIS_PENGADAAN[hps.jenisPengadaan] || hps.jenisPengadaan);
      addInfo('Metode Pengadaan', METODE_PENGADAAN[hps.metodePengadaan] || hps.metodePengadaan);
      addInfo('Pagu Anggaran', 'Rp ' + formatRupiahDoc(hps.paguAnggaran));
      addInfo('Tahun Anggaran', config.tahunAnggaran || new Date().getFullYear());

      body.appendParagraph('');

      // Items table
      const itemTable = body.appendTable();

      // Header
      const headerRow = itemTable.appendTableRow();
      headerRow.appendTableCell('No.').setBold(true).setWidth(30);
      headerRow.appendTableCell('Uraian Barang/Jasa').setBold(true).setWidth(200);
      headerRow.appendTableCell('Satuan').setBold(true).setWidth(50);
      headerRow.appendTableCell('Vol').setBold(true).setWidth(40);
      headerRow.appendTableCell('Harga Satuan').setBold(true).setWidth(80);
      headerRow.appendTableCell('Jumlah Harga').setBold(true).setWidth(90);

      // Items
      hps.items.forEach((item, idx) => {
        const row = itemTable.appendTableRow();
        row.appendTableCell(String(idx + 1));

        const uraianCell = row.appendTableCell();
        uraianCell.appendParagraph(item.namaBarang);
        if (item.spesifikasi) {
          uraianCell.appendParagraph(item.spesifikasi).setFontSize(9).setItalic(true);
        }

        row.appendTableCell(item.satuan || '-');
        row.appendTableCell(String(item.volume));

        const hargaCell = row.appendTableCell(formatRupiahDoc(item.hargaSatuan));
        hargaCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

        const totalCell = row.appendTableCell(formatRupiahDoc(item.totalHarga));
        totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      });

      // Subtotal
      const subtotalRow = itemTable.appendTableRow();
      subtotalRow.appendTableCell('');
      subtotalRow.appendTableCell('Subtotal').setBold(true);
      subtotalRow.appendTableCell('');
      subtotalRow.appendTableCell('');
      subtotalRow.appendTableCell('');
      const subtotalCell = subtotalRow.appendTableCell(formatRupiahDoc(hps.subtotal));
      subtotalCell.setBold(true);
      subtotalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      // PPN
      const ppnRow = itemTable.appendTableRow();
      ppnRow.appendTableCell('');
      ppnRow.appendTableCell('PPN ' + hps.ppnRate + '%').setBold(true);
      ppnRow.appendTableCell('');
      ppnRow.appendTableCell('');
      ppnRow.appendTableCell('');
      const ppnCell = ppnRow.appendTableCell(formatRupiahDoc(hps.ppn));
      ppnCell.setBold(true);
      ppnCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      // Total
      const totalRow = itemTable.appendTableRow();
      totalRow.appendTableCell('');
      totalRow.appendTableCell('TOTAL HPS').setBold(true);
      totalRow.appendTableCell('');
      totalRow.appendTableCell('');
      totalRow.appendTableCell('');
      const totalCell = totalRow.appendTableCell(formatRupiahDoc(hps.total));
      totalCell.setBold(true);
      totalCell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

      // Terbilang
      body.appendParagraph('');
      body.appendParagraph('Terbilang: ' + hps.terbilang).setItalic(true);

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

      // Move to folder
      const file = DriveApp.getFileById(doc.getId());
      const folder = getOrCreateFolder('Dokumen_Paket');
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
        'HPS',
        '',
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
          docId: doc.getId(),
          googleDocUrl: doc.getUrl(),
          jenisDokumen: 'HPS',
          hps: hps
        }
      };

    } catch (e) {
      console.error('Error generating HPS document:', e);
      return { success: false, error: 'Gagal membuat dokumen: ' + e.message };
    }
  },

  // ==================== COMPARE WITH BUDGET ====================
  compareWithBudget: function(paketId) {
    const hpsResult = this.calculate(paketId);
    if (!hpsResult.success) return hpsResult;

    const hps = hpsResult.data;
    const pagu = hps.paguAnggaran || 0;

    return {
      success: true,
      data: {
        nilaiHPS: hps.total,
        paguAnggaran: pagu,
        selisih: pagu - hps.total,
        persentase: pagu > 0 ? ((hps.total / pagu) * 100).toFixed(2) : 0,
        isWithinBudget: hps.total <= pagu,
        status: hps.total <= pagu ? 'OK' : 'MELEBIHI_PAGU'
      }
    };
  }
};

/**
 * 04_ItemService.gs
 * Item/Barang Service for Paket
 */

const ItemService = {

  // ==================== GET BY PAKET ====================
  getByPaket: function(paketId) {
    const rows = getRowsByColumn('Items', 'paketId', paketId);
    return rows.map(r => ({
      ...r,
      id: r.itemId,
      surveys: SurveyService.getByItem(r.itemId)
    })).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  },

  // ==================== COUNT BY PAKET ====================
  countByPaket: function(paketId) {
    return getRowsByColumn('Items', 'paketId', paketId).length;
  },

  // ==================== GET BY ID ====================
  getById: function(itemId) {
    const item = getRowById('Items', itemId);
    if (!item) return null;

    item.id = item.itemId;
    item.surveys = SurveyService.getByItem(itemId);
    return item;
  },

  // ==================== CREATE ====================
  create: function(paketId, data) {
    setupPaketSheets();

    const itemId = generateId('ITM');
    const now = getTimestamp();

    // Get next urutan
    const existingItems = this.getByPaket(paketId);
    const nextUrutan = existingItems.length > 0
      ? Math.max(...existingItems.map(i => i.urutan || 0)) + 1
      : 1;

    const hargaSatuan = data.hargaSatuan || 0;
    const volume = data.volume || 1;
    const hargaTotal = hargaSatuan * volume;

    const row = [
      itemId,
      paketId,
      data.namaBarang || '',
      data.spesifikasi || '',
      data.satuan || '',
      volume,
      hargaSatuan,
      hargaTotal,
      data.kategori || '',
      data.urutan || nextUrutan,
      now,
      now
    ];

    getSpreadsheet().getSheetByName('Items').appendRow(row);
    return this.getById(itemId);
  },

  // ==================== UPDATE ====================
  update: function(itemId, data) {
    const sheet = getSpreadsheet().getSheetByName('Items');
    if (!sheet) return null;

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === itemId) {
        const allowedFields = [
          'namaBarang', 'spesifikasi', 'satuan', 'volume', 'hargaSatuan', 'kategori', 'urutan'
        ];

        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            const colIndex = headers.indexOf(field);
            if (colIndex >= 0) {
              sheet.getRange(i + 1, colIndex + 1).setValue(data[field]);
            }
          }
        });

        // Recalculate hargaTotal
        const volume = data.volume !== undefined ? data.volume : allData[i][headers.indexOf('volume')];
        const hargaSatuan = data.hargaSatuan !== undefined ? data.hargaSatuan : allData[i][headers.indexOf('hargaSatuan')];
        const hargaTotalCol = headers.indexOf('hargaTotal');
        if (hargaTotalCol >= 0) {
          sheet.getRange(i + 1, hargaTotalCol + 1).setValue(volume * hargaSatuan);
        }

        // Update timestamp
        const updatedAtCol = headers.indexOf('updatedAt');
        if (updatedAtCol >= 0) {
          sheet.getRange(i + 1, updatedAtCol + 1).setValue(getTimestamp());
        }

        return this.getById(itemId);
      }
    }
    return null;
  },

  // ==================== DELETE ====================
  delete: function(itemId) {
    // Delete related surveys first
    SurveyService.deleteByItem(itemId);
    return deleteRow('Items', itemId);
  },

  // ==================== DELETE BY PAKET ====================
  deleteByPaket: function(paketId) {
    const items = this.getByPaket(paketId);
    items.forEach(item => {
      SurveyService.deleteByItem(item.itemId);
    });
    return deleteRowsByColumn('Items', 'paketId', paketId);
  },

  // ==================== REORDER ====================
  reorder: function(paketId, itemIds) {
    const sheet = getSpreadsheet().getSheetByName('Items');
    if (!sheet) return false;

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const urutanCol = headers.indexOf('urutan');

    if (urutanCol < 0) return false;

    itemIds.forEach((itemId, index) => {
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][0] === itemId) {
          sheet.getRange(i + 1, urutanCol + 1).setValue(index + 1);
          break;
        }
      }
    });

    return true;
  },

  // ==================== CALCULATE TOTAL ====================
  calculateTotal: function(paketId) {
    const items = this.getByPaket(paketId);
    return items.reduce((sum, item) => sum + (item.hargaTotal || 0), 0);
  },

  // ==================== GET SELECTED SURVEY PRICES ====================
  getSelectedSurveyPrices: function(paketId) {
    const items = this.getByPaket(paketId);
    return items.map(item => {
      const selectedSurvey = item.surveys?.find(s => s.isSelected);
      return {
        itemId: item.itemId,
        namaBarang: item.namaBarang,
        volume: item.volume,
        satuan: item.satuan,
        hargaSurvey: selectedSurvey?.hargaPenawaran || item.hargaSatuan || 0,
        penyediaSurvey: selectedSurvey?.namaPenyedia || null,
        total: (selectedSurvey?.hargaPenawaran || item.hargaSatuan || 0) * (item.volume || 1)
      };
    });
  }
};

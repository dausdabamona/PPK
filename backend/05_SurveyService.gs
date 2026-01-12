/**
 * 05_SurveyService.gs
 * Survey Harga Service
 */

const SurveyService = {

  // ==================== GET BY ITEM ====================
  getByItem: function(itemId) {
    const rows = getRowsByColumn('Surveys', 'itemId', itemId);
    return rows.map(r => ({
      ...r,
      id: r.surveyId
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ==================== GET BY PAKET ====================
  getByPaket: function(paketId) {
    const rows = getRowsByColumn('Surveys', 'paketId', paketId);
    return rows.map(r => ({
      ...r,
      id: r.surveyId
    }));
  },

  // ==================== GET BY ID ====================
  getById: function(surveyId) {
    const survey = getRowById('Surveys', surveyId);
    if (!survey) return null;
    survey.id = survey.surveyId;
    return survey;
  },

  // ==================== CREATE ====================
  create: function(itemId, data) {
    setupPaketSheets();

    const item = ItemService.getById(itemId);
    if (!item) {
      return { success: false, error: 'Item tidak ditemukan' };
    }

    const surveyId = generateId('SRV');
    const now = getTimestamp();

    const row = [
      surveyId,
      itemId,
      item.paketId,
      data.namaPenyedia || '',
      data.alamatPenyedia || '',
      data.kontakPenyedia || '',
      data.hargaPenawaran || 0,
      data.tanggalSurvey || now.split('T')[0],
      data.keterangan || '',
      data.isSelected || false,
      now
    ];

    getSpreadsheet().getSheetByName('Surveys').appendRow(row);
    return this.getById(surveyId);
  },

  // ==================== UPDATE ====================
  update: function(surveyId, data) {
    const allowedFields = [
      'namaPenyedia', 'alamatPenyedia', 'kontakPenyedia',
      'hargaPenawaran', 'tanggalSurvey', 'keterangan', 'isSelected'
    ];

    const result = updateRow('Surveys', surveyId, data, allowedFields);

    // If this survey is being selected, unselect others for the same item
    if (data.isSelected === true && result) {
      const survey = this.getById(surveyId);
      if (survey) {
        this.unselectOthers(survey.itemId, surveyId);
      }
    }

    return result;
  },

  // ==================== DELETE ====================
  delete: function(surveyId) {
    return deleteRow('Surveys', surveyId);
  },

  // ==================== DELETE BY ITEM ====================
  deleteByItem: function(itemId) {
    return deleteRowsByColumn('Surveys', 'itemId', itemId);
  },

  // ==================== DELETE BY PAKET ====================
  deleteByPaket: function(paketId) {
    return deleteRowsByColumn('Surveys', 'paketId', paketId);
  },

  // ==================== SELECT SURVEY ====================
  select: function(surveyId) {
    const survey = this.getById(surveyId);
    if (!survey) return null;

    // Unselect all surveys for this item
    this.unselectOthers(survey.itemId, surveyId);

    // Select this survey
    return this.update(surveyId, { isSelected: true });
  },

  // ==================== UNSELECT OTHERS ====================
  unselectOthers: function(itemId, exceptSurveyId) {
    const sheet = getSpreadsheet().getSheetByName('Surveys');
    if (!sheet) return;

    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    const itemIdCol = headers.indexOf('itemId');
    const isSelectedCol = headers.indexOf('isSelected');

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][itemIdCol] === itemId && allData[i][0] !== exceptSurveyId) {
        sheet.getRange(i + 1, isSelectedCol + 1).setValue(false);
      }
    }
  },

  // ==================== GET SELECTED FOR ITEM ====================
  getSelectedForItem: function(itemId) {
    const surveys = this.getByItem(itemId);
    return surveys.find(s => s.isSelected) || null;
  },

  // ==================== GET SURVEY SUMMARY ====================
  getSummaryForPaket: function(paketId) {
    const surveys = this.getByPaket(paketId);
    const items = ItemService.getByPaket(paketId);

    const itemsWithSurvey = new Set(surveys.map(s => s.itemId));
    const itemsWithSelected = new Set(
      surveys.filter(s => s.isSelected).map(s => s.itemId)
    );

    return {
      totalItems: items.length,
      itemsWithSurvey: itemsWithSurvey.size,
      itemsWithSelected: itemsWithSelected.size,
      totalSurveys: surveys.length,
      isComplete: items.length > 0 && itemsWithSelected.size === items.length
    };
  },

  // ==================== GET LOWEST PRICES ====================
  getLowestPrices: function(paketId) {
    const items = ItemService.getByPaket(paketId);

    return items.map(item => {
      const surveys = this.getByItem(item.itemId);
      if (surveys.length === 0) {
        return {
          itemId: item.itemId,
          namaBarang: item.namaBarang,
          lowestPrice: null,
          lowestPenyedia: null,
          surveyCount: 0
        };
      }

      const lowestSurvey = surveys.reduce((min, s) =>
        (s.hargaPenawaran < min.hargaPenawaran) ? s : min
      );

      return {
        itemId: item.itemId,
        namaBarang: item.namaBarang,
        lowestPrice: lowestSurvey.hargaPenawaran,
        lowestPenyedia: lowestSurvey.namaPenyedia,
        surveyCount: surveys.length,
        selected: surveys.find(s => s.isSelected)?.namaPenyedia || null
      };
    });
  },

  // ==================== AUTO SELECT LOWEST ====================
  autoSelectLowest: function(paketId) {
    const items = ItemService.getByPaket(paketId);
    let selectedCount = 0;

    items.forEach(item => {
      const surveys = this.getByItem(item.itemId);
      if (surveys.length > 0) {
        const lowestSurvey = surveys.reduce((min, s) =>
          (s.hargaPenawaran < min.hargaPenawaran) ? s : min
        );
        this.select(lowestSurvey.surveyId);
        selectedCount++;
      }
    });

    return { selectedCount, totalItems: items.length };
  }
};

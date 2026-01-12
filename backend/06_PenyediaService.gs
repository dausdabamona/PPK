/**
 * 06_PenyediaService.gs
 * Penyedia/Vendor Service
 */

function setupPenyediaSheet() {
  const headers = [
    'penyediaId', 'namaPenyedia', 'alamat', 'kota', 'provinsi',
    'telepon', 'email', 'website', 'npwp', 'siup', 'nib',
    'direktur', 'jabatanDirektur', 'bank', 'noRekening', 'namaRekening',
    'kategori', 'keterangan', 'isActive', 'createdAt', 'updatedAt'
  ];
  ensureSheet('Penyedia', headers);
}

const PenyediaService = {

  // ==================== LIST ====================
  list: function(filters = {}) {
    setupPenyediaSheet();
    const rows = getAllRows('Penyedia');

    let results = rows.map(p => ({
      ...p,
      id: p.penyediaId
    }));

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      results = results.filter(p =>
        (p.namaPenyedia || '').toLowerCase().includes(search) ||
        (p.alamat || '').toLowerCase().includes(search) ||
        (p.kota || '').toLowerCase().includes(search)
      );
    }

    if (filters.kategori) {
      results = results.filter(p => p.kategori === filters.kategori);
    }

    if (filters.isActive !== undefined) {
      results = results.filter(p => p.isActive === filters.isActive);
    }

    return results.sort((a, b) => (a.namaPenyedia || '').localeCompare(b.namaPenyedia || ''));
  },

  // ==================== GET BY ID ====================
  getById: function(penyediaId) {
    const penyedia = getRowById('Penyedia', penyediaId);
    if (!penyedia) return null;
    penyedia.id = penyedia.penyediaId;
    return penyedia;
  },

  // ==================== CREATE ====================
  create: function(data) {
    setupPenyediaSheet();

    const penyediaId = generateId('PYD');
    const now = getTimestamp();

    const row = [
      penyediaId,
      data.namaPenyedia || '',
      data.alamat || '',
      data.kota || '',
      data.provinsi || '',
      data.telepon || '',
      data.email || '',
      data.website || '',
      data.npwp || '',
      data.siup || '',
      data.nib || '',
      data.direktur || '',
      data.jabatanDirektur || 'Direktur',
      data.bank || '',
      data.noRekening || '',
      data.namaRekening || '',
      data.kategori || '',
      data.keterangan || '',
      data.isActive !== false,
      now,
      now
    ];

    getSpreadsheet().getSheetByName('Penyedia').appendRow(row);
    return this.getById(penyediaId);
  },

  // ==================== UPDATE ====================
  update: function(penyediaId, data) {
    const allowedFields = [
      'namaPenyedia', 'alamat', 'kota', 'provinsi', 'telepon', 'email',
      'website', 'npwp', 'siup', 'nib', 'direktur', 'jabatanDirektur',
      'bank', 'noRekening', 'namaRekening', 'kategori', 'keterangan', 'isActive'
    ];

    return updateRow('Penyedia', penyediaId, data, allowedFields);
  },

  // ==================== DELETE ====================
  delete: function(penyediaId) {
    return deleteRow('Penyedia', penyediaId);
  },

  // ==================== SEARCH ====================
  search: function(query) {
    if (!query || query.length < 2) return [];

    const rows = getAllRows('Penyedia');
    const search = query.toLowerCase();

    return rows
      .filter(p =>
        (p.namaPenyedia || '').toLowerCase().includes(search) ||
        (p.alamat || '').toLowerCase().includes(search) ||
        (p.kota || '').toLowerCase().includes(search) ||
        (p.npwp || '').includes(search)
      )
      .map(p => ({
        ...p,
        id: p.penyediaId
      }))
      .slice(0, 20); // Limit results
  },

  // ==================== GET BY NPWP ====================
  getByNPWP: function(npwp) {
    const rows = getAllRows('Penyedia');
    const found = rows.find(p => p.npwp === npwp);
    if (found) {
      found.id = found.penyediaId;
    }
    return found || null;
  },

  // ==================== GET OPTIONS ====================
  getOptions: function() {
    const rows = this.list({ isActive: true });
    return rows.map(p => ({
      value: p.penyediaId,
      label: p.namaPenyedia,
      alamat: p.alamat,
      kota: p.kota,
      npwp: p.npwp
    }));
  },

  // ==================== GET CATEGORIES ====================
  getCategories: function() {
    const rows = getAllRows('Penyedia');
    const categories = new Set(rows.map(p => p.kategori).filter(Boolean));
    return Array.from(categories).sort();
  },

  // ==================== IMPORT FROM SURVEY ====================
  importFromSurvey: function(surveyData) {
    // Check if penyedia already exists by name
    const existing = this.list().find(p =>
      (p.namaPenyedia || '').toLowerCase() === (surveyData.namaPenyedia || '').toLowerCase()
    );

    if (existing) {
      return existing;
    }

    // Create new penyedia from survey data
    return this.create({
      namaPenyedia: surveyData.namaPenyedia,
      alamat: surveyData.alamatPenyedia,
      telepon: surveyData.kontakPenyedia,
      kategori: 'SURVEY'
    });
  }
};

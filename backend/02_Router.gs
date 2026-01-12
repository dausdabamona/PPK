/**
 * 02_Router.gs
 * API Routing and Request Handling
 */

// ========================================
// WEB APP ENTRY POINTS
// ========================================

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function doDelete(e) {
  return handleRequest(e, 'DELETE');
}

function handleRequest(e, method) {
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return createCorsResponse();
  }

  const path = e.parameter.path || e.pathInfo || '';
  const params = e.parameter || {};

  // Check for method override (for DELETE via POST)
  if (params._method) {
    method = params._method.toUpperCase();
  }

  let body = {};
  if (e.postData) {
    try {
      body = JSON.parse(e.postData.contents);
      // Check for method override in body
      if (body._method) {
        method = body._method.toUpperCase();
      }
    } catch (err) {
      body = {};
    }
  }

  try {
    const result = routeRequest(path, method, params, body);
    return createJsonResponse(result);
  } catch (error) {
    console.error('Request error:', error);
    return createJsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500);
  }
}

function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function createCorsResponse() {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

// ========================================
// MAIN ROUTER
// ========================================

function routeRequest(path, method, params, body) {
  // Remove leading/trailing slashes and 'api' prefix
  path = path.replace(/^\/+|\/+$/g, '').replace(/^api\/?/, '');
  const segments = path.split('/').filter(s => s);

  console.log('Route:', method, path, segments);

  // ==================== PERJALANAN DINAS ====================
  if (segments[0] === 'perjalanan-dinas') {
    return routePerjalananDinas(segments.slice(1), method, params, body);
  }

  // ==================== PAKET ====================
  if (segments[0] === 'paket' || segments[0] === 'pakets') {
    return routePaket(segments.slice(1), method, params, body);
  }

  // ==================== ITEMS ====================
  if (segments[0] === 'items') {
    return routeItems(segments.slice(1), method, params, body);
  }

  // ==================== SURVEYS (Direct) ====================
  if (segments[0] === 'surveys') {
    return routeSurveys(segments.slice(1), method, params, body);
  }

  // ==================== PENYEDIA ====================
  if (segments[0] === 'penyedia') {
    return routePenyedia(segments.slice(1), method, params, body);
  }

  // ==================== PELAKSANA (Direct) ====================
  if (segments[0] === 'pelaksana') {
    const pelaksanaId = segments[1];
    if (method === 'POST') {
      return { success: true, data: PerjalananDinasService.updatePelaksana(pelaksanaId, body) };
    }
    if (method === 'DELETE') {
      return { success: PerjalananDinasService.deletePelaksana(pelaksanaId) };
    }
  }

  // ==================== BIAYA (Direct) ====================
  if (segments[0] === 'biaya') {
    const biayaId = segments[1];
    if (method === 'POST') {
      return { success: true, data: PerjalananDinasService.updateBiaya(biayaId, body) };
    }
    if (method === 'DELETE') {
      return { success: PerjalananDinasService.deleteBiaya(biayaId) };
    }
  }

  // ==================== LAMPIRAN PD (Direct) ====================
  if (segments[0] === 'lampiran-pd') {
    const lampiranId = segments[1];
    if (method === 'DELETE') {
      return { success: PerjalananDinasService.deleteLampiran(lampiranId) };
    }
  }

  // ==================== LAMPIRAN PAKET (Direct) ====================
  if (segments[0] === 'lampiran') {
    const lampiranId = segments[1];
    if (method === 'DELETE') {
      return { success: PaketService.deleteLampiran(lampiranId) };
    }
  }

  // ==================== PEMBAYARAN (Direct) ====================
  if (segments[0] === 'pembayaran') {
    const pembayaranId = segments[1];
    if (method === 'POST') {
      return { success: true, data: PaketService.updatePembayaran(pembayaranId, body) };
    }
    if (method === 'DELETE') {
      return { success: PaketService.deletePembayaran(pembayaranId) };
    }
  }

  // ==================== CONFIG ====================
  if (segments[0] === 'config') {
    if (method === 'GET') {
      return { success: true, data: ConfigService.getConfig() };
    }
    if (method === 'POST') {
      return { success: true, data: ConfigService.updateConfig(body) };
    }
  }

  // ==================== NUMBERING ====================
  if (segments[0] === 'numbering') {
    return routeNumbering(segments.slice(1), method, params, body);
  }

  // ==================== WORKFLOW EXTENDED ====================
  if (segments[0] === 'workflow') {
    return routeWorkflowExtended(segments.slice(1), method, params, body);
  }

  // ==================== COMPLIANCE ====================
  if (segments[0] === 'compliance') {
    const paketId = segments[1];
    if (method === 'GET' && paketId) {
      return ComplianceService.check(paketId);
    }
    return { success: false, error: 'Compliance route requires paket ID' };
  }

  // ==================== REPORTING ====================
  if (segments[0] === 'reporting') {
    return routeReporting(segments.slice(1), method, params, body);
  }

  // ==================== SETUP ====================
  if (segments[0] === 'setup') {
    setupAllSheets();
    return { success: true, message: 'All sheets created successfully' };
  }

  // ==================== HEALTH CHECK ====================
  if (segments[0] === 'health' || segments.length === 0) {
    return {
      success: true,
      message: 'PPK API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  return { success: false, error: 'Route not found: ' + path };
}

// ========================================
// PERJALANAN DINAS ROUTES
// ========================================

function routePerjalananDinas(segments, method, params, body) {
  // GET /perjalanan-dinas - List all
  if (segments.length === 0 && method === 'GET') {
    return { success: true, data: PerjalananDinasService.list(params.jenisPD) };
  }

  // POST /perjalanan-dinas - Create new
  if (segments.length === 0 && method === 'POST') {
    const result = PerjalananDinasService.create(body);
    return { success: true, data: result };
  }

  // GET /perjalanan-dinas/options
  if (segments[0] === 'options' && method === 'GET') {
    return {
      success: true,
      data: {
        jenisPD: PerjalananDinasService.getJenisPDOptions(),
        status: PerjalananDinasService.getStatusOptions(params.jenisPD),
        tingkatBiaya: PerjalananDinasService.getTingkatBiayaOptions(),
        jenisTransportasi: PerjalananDinasService.getJenisTransportasiOptions(),
        jenisBiaya: PerjalananDinasService.getJenisBiayaOptions(),
        kategoriLampiran: PerjalananDinasService.getLampiranKategoriOptions()
      }
    };
  }

  const pdId = segments[0];

  // GET /perjalanan-dinas/:id
  if (segments.length === 1 && method === 'GET') {
    const pd = PerjalananDinasService.getById(pdId);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }
    return { success: true, data: pd };
  }

  // POST /perjalanan-dinas/:id - Update
  if (segments.length === 1 && method === 'POST') {
    const result = PerjalananDinasService.update(pdId, body);
    if (!result) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }
    return { success: true, data: result };
  }

  // DELETE /perjalanan-dinas/:id
  if (segments.length === 1 && method === 'DELETE') {
    const success = PerjalananDinasService.delete(pdId);
    return { success };
  }

  // ========== PELAKSANA ==========
  if (segments[1] === 'pelaksana') {
    if (method === 'GET') {
      return { success: true, data: PerjalananDinasService.getPelaksana(pdId) };
    }
    if (method === 'POST') {
      const result = PerjalananDinasService.addPelaksana(pdId, body);
      return { success: true, data: result };
    }
  }

  // ========== BIAYA ==========
  if (segments[1] === 'biaya') {
    if (method === 'GET') {
      return { success: true, data: PerjalananDinasService.getBiaya(pdId) };
    }
    if (method === 'POST') {
      const result = PerjalananDinasService.addBiaya(pdId, body);
      return { success: true, data: result };
    }
  }

  // ========== LAMPIRAN ==========
  if (segments[1] === 'lampiran') {
    if (method === 'GET') {
      return { success: true, data: PerjalananDinasService.getLampiran(pdId) };
    }
    if (method === 'POST') {
      const result = PerjalananDinasService.addLampiran(pdId, body);
      if (result.success === false) return result;
      return { success: true, data: result };
    }
  }

  // ========== DOKUMEN ==========
  if (segments[1] === 'dokumen') {
    if (segments.length === 2 && method === 'GET') {
      return { success: true, data: PerjalananDinasService.getDokumen(pdId) };
    }
    if (segments[2] === 'generate' && method === 'POST') {
      const docType = body.docType || body.jenisDokumen;
      return generatePDDocument(pdId, docType);
    }
  }

  // ========== WORKFLOW ==========
  if (segments[1] === 'workflow') {
    if (segments.length === 2 && method === 'GET') {
      return { success: true, data: PDWorkflowService.getStatus(pdId) };
    }
    if (segments[2] === 'next' && method === 'POST') {
      return PDWorkflowService.advanceStage(pdId);
    }
    if (segments[2] === 'revert' && method === 'POST') {
      return PDWorkflowService.revertStage(pdId);
    }
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// PAKET ROUTES
// ========================================

function routePaket(segments, method, params, body) {
  // GET /paket - List all
  if (segments.length === 0 && method === 'GET') {
    return { success: true, data: PaketService.list(params) };
  }

  // POST /paket - Create new
  if (segments.length === 0 && method === 'POST') {
    const result = PaketService.create(body);
    return { success: true, data: result };
  }

  // GET /paket/options
  if (segments[0] === 'options' && method === 'GET') {
    return { success: true, data: PaketService.getOptions() };
  }

  const paketId = segments[0];

  // GET /paket/:id
  if (segments.length === 1 && method === 'GET') {
    const paket = PaketService.getById(paketId);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    return { success: true, data: paket };
  }

  // POST /paket/:id - Update
  if (segments.length === 1 && method === 'POST') {
    const result = PaketService.update(paketId, body);
    if (!result) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    return { success: true, data: result };
  }

  // DELETE /paket/:id
  if (segments.length === 1 && method === 'DELETE') {
    const success = PaketService.delete(paketId);
    return { success };
  }

  // ========== ITEMS ==========
  if (segments[1] === 'items') {
    if (method === 'GET') {
      return { success: true, data: ItemService.getByPaket(paketId) };
    }
    if (method === 'POST') {
      const result = ItemService.create(paketId, body);
      return { success: true, data: result };
    }
  }

  // ========== LAMPIRAN ==========
  if (segments[1] === 'lampiran') {
    if (method === 'GET') {
      return { success: true, data: PaketService.getLampiran(paketId) };
    }
    if (method === 'POST') {
      const result = PaketService.addLampiran(paketId, body);
      return { success: true, data: result };
    }
  }

  // ========== DOKUMEN ==========
  if (segments[1] === 'dokumen') {
    if (segments.length === 2 && method === 'GET') {
      return { success: true, data: DokumenService.getByPaket(paketId) };
    }
    if (segments[2] === 'generate' && method === 'POST') {
      return DokumenService.generate(paketId, body.docType);
    }
  }

  // ========== HPS ==========
  if (segments[1] === 'hps') {
    if (method === 'GET') {
      return { success: true, data: HPSService.calculate(paketId) };
    }
    if (method === 'POST') {
      return { success: true, data: HPSService.calculate(paketId) };
    }
  }

  // ========== KONTRAK ==========
  if (segments[1] === 'kontrak') {
    if (method === 'GET') {
      return { success: true, data: PaketService.getKontrak(paketId) };
    }
    if (method === 'POST') {
      const result = PaketService.updateKontrak(paketId, body);
      return { success: true, data: result };
    }
  }

  // ========== PEMBAYARAN ==========
  if (segments[1] === 'pembayaran') {
    if (method === 'GET') {
      return { success: true, data: PaketService.getPembayaran(paketId) };
    }
    if (method === 'POST') {
      const result = PaketService.addPembayaran(paketId, body);
      return { success: true, data: result };
    }
  }

  // ========== SERAH TERIMA ==========
  if (segments[1] === 'serah-terima') {
    if (method === 'GET') {
      return { success: true, data: PaketService.getSerahTerima(paketId) };
    }
    if (method === 'POST') {
      const result = PaketService.updateSerahTerima(paketId, body);
      return { success: true, data: result };
    }
  }

  // ========== WORKFLOW ==========
  if (segments[1] === 'workflow') {
    if (segments.length === 2 && method === 'GET') {
      return { success: true, data: WorkflowService.getPaketStatus(paketId) };
    }
    if (segments[2] === 'next' && method === 'POST') {
      return WorkflowService.advancePaket(paketId);
    }
    if (segments[2] === 'revert' && method === 'POST') {
      return WorkflowService.revertPaket(paketId);
    }
  }

  // ========== COMPLIANCE ==========
  if (segments[1] === 'compliance') {
    if (method === 'GET') {
      return { success: true, data: ComplianceService.check(paketId) };
    }
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// ITEMS ROUTES
// ========================================

function routeItems(segments, method, params, body) {
  const itemId = segments[0];

  // GET /items/:id
  if (segments.length === 1 && method === 'GET') {
    const item = ItemService.getById(itemId);
    if (!item) {
      return { success: false, error: 'Item tidak ditemukan' };
    }
    return { success: true, data: item };
  }

  // POST /items/:id - Update item
  if (segments.length === 1 && method === 'POST') {
    const result = ItemService.update(itemId, body);
    return { success: true, data: result };
  }

  // DELETE /items/:id - Delete item
  if (segments.length === 1 && method === 'DELETE') {
    const success = ItemService.delete(itemId);
    return { success };
  }

  // ========== SURVEYS ==========
  if (segments[1] === 'surveys') {
    const surveyId = segments[2];

    // GET /items/:id/surveys
    if (segments.length === 2 && method === 'GET') {
      return { success: true, data: SurveyService.getByItem(itemId) };
    }

    // POST /items/:id/surveys - Add survey
    if (segments.length === 2 && method === 'POST') {
      const result = SurveyService.create(itemId, body);
      return { success: true, data: result };
    }

    // POST /items/:id/surveys/:surveyId - Update survey
    if (segments.length === 3 && method === 'POST') {
      const result = SurveyService.update(surveyId, body);
      return { success: true, data: result };
    }

    // DELETE /items/:id/surveys/:surveyId - Delete survey
    if (segments.length === 3 && method === 'DELETE') {
      const success = SurveyService.delete(surveyId);
      return { success };
    }
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// SURVEYS ROUTES (Direct)
// ========================================

function routeSurveys(segments, method, params, body) {
  const surveyId = segments[0];

  // POST /surveys/:id - Update survey
  if (segments.length === 1 && method === 'POST') {
    const result = SurveyService.update(surveyId, body);
    return { success: true, data: result };
  }

  // DELETE /surveys/:id - Delete survey
  if (segments.length === 1 && method === 'DELETE') {
    const success = SurveyService.delete(surveyId);
    return { success };
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// PENYEDIA ROUTES
// ========================================

function routePenyedia(segments, method, params, body) {
  // GET /penyedia - List all
  if (segments.length === 0 && method === 'GET') {
    return { success: true, data: PenyediaService.list(params) };
  }

  // POST /penyedia - Create new
  if (segments.length === 0 && method === 'POST') {
    const result = PenyediaService.create(body);
    return { success: true, data: result };
  }

  const penyediaId = segments[0];

  // GET /penyedia/:id
  if (segments.length === 1 && method === 'GET') {
    const penyedia = PenyediaService.getById(penyediaId);
    if (!penyedia) {
      return { success: false, error: 'Penyedia tidak ditemukan' };
    }
    return { success: true, data: penyedia };
  }

  // POST /penyedia/:id - Update
  if (segments.length === 1 && method === 'POST') {
    const result = PenyediaService.update(penyediaId, body);
    return { success: true, data: result };
  }

  // DELETE /penyedia/:id
  if (segments.length === 1 && method === 'DELETE') {
    const success = PenyediaService.delete(penyediaId);
    return { success };
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// NUMBERING ROUTES
// ========================================

function routeNumbering(segments, method, params, body) {
  // GET /numbering - Get all patterns
  if (segments.length === 0 && method === 'GET') {
    return { success: true, data: NumberingService.getAllPatterns() };
  }

  // POST /numbering - Save pattern
  if (segments.length === 0 && method === 'POST') {
    const result = NumberingService.savePattern(body);
    return { success: true, data: result };
  }

  // GET /numbering/generate/:type
  if (segments[0] === 'generate' && method === 'GET') {
    const type = segments[1] || params.type;
    const result = NumberingService.generateNumber(type, params);
    return { success: true, data: result };
  }

  // POST /numbering/generate/:type
  if (segments[0] === 'generate' && method === 'POST') {
    const type = segments[1] || body.type;
    const result = NumberingService.generateNumber(type, body);
    return { success: true, data: result };
  }

  return { success: false, error: 'Route not found' };
}

// ========================================
// DOCUMENT GENERATION HELPER
// ========================================

function generatePDDocument(pdId, docType) {
  switch (docType?.toLowerCase()) {
    case 'sppd':
      return PerjalananDinasService.generateSPPD(pdId);
    case 'kuitansi_rampung':
      return PerjalananDinasService.generateKuitansiRampung(pdId);
    case 'daftar_pengeluaran':
      return PerjalananDinasService.generateDaftarPengeluaranRiil(pdId);
    case 'surat_tugas':
    case 'surat_pd_dalam_kota':
      return PerjalananDinasService.generateSuratPDDalamKota(pdId);
    default:
      return { success: false, error: 'Jenis dokumen tidak dikenal: ' + docType };
  }
}

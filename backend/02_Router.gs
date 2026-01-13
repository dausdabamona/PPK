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

  let path = e.parameter.path || e.pathInfo || '';
  const params = e.parameter || {};

  // Check for method override (for DELETE via POST)
  if (params._method) {
    method = params._method.toUpperCase();
  }

  let body = {};
  let requestData = {};

  if (e.postData) {
    try {
      const parsed = JSON.parse(e.postData.contents);

      // Handle client format: { path: "...", data: {...} }
      if (parsed.path && typeof parsed.path === 'string') {
        // Use body.path if path is empty (for POST requests)
        if (!path) {
          path = parsed.path;
        }
        // Extract the actual data
        requestData = parsed.data || {};
        body = requestData;
      } else {
        // Legacy format: body is the data directly
        body = parsed;
        requestData = parsed;
      }

      // Check for method override in body or data
      if (body._method) {
        method = body._method.toUpperCase();
      } else if (requestData._method) {
        method = requestData._method.toUpperCase();
      }
    } catch (err) {
      body = {};
      requestData = {};
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
    // Check for v2 routes (Sprint 2)
    if (segments[1] === 'v2') {
      return routeWorkflowV2(segments.slice(2), method, params, body);
    }
    return routeWorkflowExtended(segments.slice(1), method, params, body);
  }

  // ==================== COMPLIANCE ====================
  if (segments[0] === 'compliance') {
    return routeCompliance(segments.slice(1), method, params, body);
  }

  // ==================== AUDIT (Sprint 2) ====================
  if (segments[0] === 'audit') {
    return routeAudit(segments.slice(1), method, params, body);
  }

  // ==================== TESTS ====================
  if (segments[0] === 'tests') {
    if (segments[1] === 'workflow') {
      return runAllWorkflowTests();
    }
    if (segments[1] === 'pd') {
      return runAllPDTests();
    }
    if (segments[1] === 'pd-full') {
      return runFullPDTests();
    }
    if (segments[1] === 'sprint5') {
      return runAllSprint5Tests();
    }
    if (segments[1] === 'sprint5-full') {
      return runFullSprint5Tests();
    }
    return { success: false, error: 'Unknown test suite. Available: workflow, pd, pd-full, sprint5, sprint5-full' };
  }

  // ==================== BACKUP (Sprint 5) ====================
  if (segments[0] === 'backup') {
    return routeBackup(segments.slice(1), method, params, body);
  }

  // ==================== DOCUMENT FINALIZATION (Sprint 5) ====================
  if (segments[0] === 'document-master') {
    return routeDocumentMaster(segments.slice(1), method, params, body);
  }

  // ==================== AUDIT SIMULATION (Sprint 5) ====================
  if (segments[0] === 'audit-simulation') {
    return routeAuditSimulation(segments.slice(1), method, params, body);
  }

  // ==================== SOP (Sprint 5) ====================
  if (segments[0] === 'sop') {
    return routeSOP(segments.slice(1), method, params, body);
  }

  // ==================== REPORTING ====================
  if (segments[0] === 'reporting') {
    return routeReporting(segments.slice(1), method, params, body);
  }

  // ==================== DOCUMENTS (Sprint 3) ====================
  if (segments[0] === 'documents') {
    return routeDocumentTemplate(segments.slice(1), method, params, body);
  }

  // ==================== VERSIONING ====================
  if (segments[0] === 'versioning') {
    return routeVersioning(segments.slice(1), method, params, body);
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
    const pelaksanaId = segments[2];

    // GET /perjalanan-dinas/:id/pelaksana - List pelaksana
    if (!pelaksanaId && method === 'GET') {
      return { success: true, data: PerjalananDinasService.getPelaksana(pdId) };
    }

    // POST /perjalanan-dinas/:id/pelaksana - Add pelaksana
    if (!pelaksanaId && method === 'POST') {
      const result = PerjalananDinasService.addPelaksana(pdId, body);
      return { success: true, data: result };
    }

    // PUT/POST /perjalanan-dinas/:id/pelaksana/:pelaksanaId - Update pelaksana
    if (pelaksanaId && (method === 'POST' || method === 'PUT')) {
      const result = PerjalananDinasService.updatePelaksana(pelaksanaId, body);
      if (!result) {
        return { success: false, error: 'Pelaksana tidak ditemukan' };
      }
      return { success: true, data: result };
    }

    // DELETE /perjalanan-dinas/:id/pelaksana/:pelaksanaId - Delete pelaksana
    if (pelaksanaId && method === 'DELETE') {
      const success = PerjalananDinasService.deletePelaksana(pelaksanaId);
      return { success };
    }
  }

  // ========== BIAYA ==========
  if (segments[1] === 'biaya') {
    const biayaId = segments[2];

    // GET /perjalanan-dinas/:id/biaya - List biaya
    if (!biayaId && method === 'GET') {
      return { success: true, data: PerjalananDinasService.getBiaya(pdId) };
    }

    // POST /perjalanan-dinas/:id/biaya - Add biaya
    if (!biayaId && method === 'POST') {
      const result = PerjalananDinasService.addBiaya(pdId, body);
      return { success: true, data: result };
    }

    // PUT/POST /perjalanan-dinas/:id/biaya/:biayaId - Update biaya
    if (biayaId && (method === 'POST' || method === 'PUT')) {
      const result = PerjalananDinasService.updateBiaya(biayaId, body);
      if (!result) {
        return { success: false, error: 'Biaya tidak ditemukan' };
      }
      return { success: true, data: result };
    }

    // DELETE /perjalanan-dinas/:id/biaya/:biayaId - Delete biaya
    if (biayaId && method === 'DELETE') {
      const success = PerjalananDinasService.deleteBiaya(biayaId);
      return { success };
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

// ========================================
// COMPLIANCE ROUTES (Sprint 2)
// ========================================

function routeCompliance(segments, method, params, body) {
  // GET /compliance/paket/:id - Full compliance check
  if (segments[0] === 'paket' && segments[1] && method === 'GET') {
    return ComplianceService.check(segments[1]);
  }

  // GET /compliance/paket/:id/validate - Validate for target stage
  if (segments[0] === 'paket' && segments[2] === 'validate' && method === 'GET') {
    const paket = PaketService.getById(segments[1]);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    const targetStage = params.targetStage || params.stage;
    if (!targetStage) {
      return { success: false, error: 'Parameter targetStage required' };
    }
    return {
      success: true,
      data: ComplianceValidator.validatePaketForStage(paket, targetStage)
    };
  }

  // POST /compliance/paket/:id/validate - Validate with body
  if (segments[0] === 'paket' && segments[2] === 'validate' && method === 'POST') {
    const paket = PaketService.getById(segments[1]);
    if (!paket) {
      return { success: false, error: 'Paket tidak ditemukan' };
    }
    const targetStage = body.targetStage || body.stage;
    if (!targetStage) {
      return { success: false, error: 'Body parameter targetStage required' };
    }
    return {
      success: true,
      data: ComplianceValidator.validatePaketForStage(paket, targetStage)
    };
  }

  // GET /compliance/pd/:id - PD compliance (basic)
  if (segments[0] === 'pd' && segments[1] && method === 'GET') {
    const pd = PerjalananDinasService.getById(segments[1]);
    if (!pd) {
      return { success: false, error: 'Perjalanan dinas tidak ditemukan' };
    }
    const targetStage = params.targetStage || params.stage || pd.status;
    return {
      success: true,
      data: ComplianceValidator.validatePDForStage(pd, targetStage)
    };
  }

  // Legacy support: GET /compliance/:paketId
  if (segments.length === 1 && method === 'GET') {
    return ComplianceService.check(segments[0]);
  }

  return { success: false, error: 'Compliance route not found' };
}

// ========================================
// AUDIT ROUTES (Sprint 2)
// ========================================

function routeAudit(segments, method, params, body) {
  // GET /audit/paket/:id - Full audit compliance status
  if (segments[0] === 'paket' && segments[1] && method === 'GET') {
    return AuditComplianceService.getPaketComplianceStatus(segments[1]);
  }

  // GET /audit/pd/:id - Full PD audit compliance status
  if (segments[0] === 'pd' && segments[1] && method === 'GET') {
    return AuditComplianceService.getPDComplianceStatus(segments[1]);
  }

  // GET /audit/violations - Get violation documentation
  if (segments[0] === 'violations' && method === 'GET') {
    return {
      success: true,
      data: getViolationDocumentation()
    };
  }

  return { success: false, error: 'Audit route not found' };
}

// ========================================
// ENHANCED WORKFLOW ROUTES (Sprint 2)
// ========================================

function routeWorkflowV2(segments, method, params, body) {
  // ========== PAKET WORKFLOW ==========

  // GET /workflow/v2/paket/:id/status
  if (segments[0] === 'paket' && segments[2] === 'status' && method === 'GET') {
    return {
      success: true,
      data: EnhancedWorkflowService.getPaketStatus(segments[1])
    };
  }

  // POST /workflow/v2/paket/:id/advance
  if (segments[0] === 'paket' && segments[2] === 'advance' && method === 'POST') {
    return EnhancedWorkflowService.advancePaket(segments[1], body);
  }

  // POST /workflow/v2/paket/:id/revert
  if (segments[0] === 'paket' && segments[2] === 'revert' && method === 'POST') {
    return EnhancedWorkflowService.revertPaket(segments[1], body);
  }

  // POST /workflow/v2/paket/:id/cancel
  if (segments[0] === 'paket' && segments[2] === 'cancel' && method === 'POST') {
    return EnhancedWorkflowService.cancelPaket(segments[1], body.reason);
  }

  // GET /workflow/v2/paket/:id/preview/:targetState
  if (segments[0] === 'paket' && segments[2] === 'preview' && method === 'GET') {
    return EnhancedWorkflowService.previewPaketTransition(segments[1], segments[3] || params.targetState);
  }

  // ========== PD WORKFLOW ==========

  // GET /workflow/v2/pd/:id/status
  if (segments[0] === 'pd' && segments[2] === 'status' && method === 'GET') {
    return {
      success: true,
      data: EnhancedWorkflowService.getPDStatus(segments[1])
    };
  }

  // POST /workflow/v2/pd/:id/advance
  if (segments[0] === 'pd' && segments[2] === 'advance' && method === 'POST') {
    return EnhancedWorkflowService.advancePD(segments[1], body);
  }

  // POST /workflow/v2/pd/:id/revert
  if (segments[0] === 'pd' && segments[2] === 'revert' && method === 'POST') {
    return EnhancedWorkflowService.revertPD(segments[1], body);
  }

  // POST /workflow/v2/pd/:id/cancel
  if (segments[0] === 'pd' && segments[2] === 'cancel' && method === 'POST') {
    return EnhancedWorkflowService.cancelPD(segments[1], body.reason);
  }

  // GET /workflow/v2/pd/:id/preview/:targetState
  if (segments[0] === 'pd' && segments[2] === 'preview' && method === 'GET') {
    return EnhancedWorkflowService.previewPDTransition(segments[1], segments[3] || params.targetState);
  }

  return { success: false, error: 'Workflow v2 route not found' };
}

// ========================================
// EXTENDED WORKFLOW ROUTES (Legacy)
// ========================================

function routeWorkflowExtended(segments, method, params, body) {
  // GET /workflow/paket/:id
  if (segments[0] === 'paket' && method === 'GET') {
    return { success: true, data: WorkflowService.getPaketStatus(segments[1]) };
  }

  // POST /workflow/paket/:id/advance
  if (segments[0] === 'paket' && segments[2] === 'advance' && method === 'POST') {
    return WorkflowService.advancePaket(segments[1]);
  }

  // GET /workflow/pd/:id
  if (segments[0] === 'pd' && method === 'GET') {
    return { success: true, data: PDWorkflowService.getStatus(segments[1]) };
  }

  // POST /workflow/pd/:id/advance
  if (segments[0] === 'pd' && segments[2] === 'advance' && method === 'POST') {
    return PDWorkflowService.advanceStage(segments[1]);
  }

  return { success: false, error: 'Workflow route not found' };
}

// ========================================
// REPORTING ROUTES (Sprint 3)
// ========================================

function routeReporting(segments, method, params, body) {
  // GET /reporting/paket-summary - Paket summary per tahun
  if (segments[0] === 'paket-summary' && method === 'GET') {
    const tahun = parseInt(params.tahun) || new Date().getFullYear();
    return ReportingService.getPaketSummary(tahun, params);
  }

  // POST /reporting/paket-summary - With body options
  if (segments[0] === 'paket-summary' && method === 'POST') {
    const tahun = parseInt(body.tahun) || new Date().getFullYear();
    return ReportingService.getPaketSummary(tahun, body);
  }

  // GET /reporting/contract-payment - Contract vs Payment analysis
  if (segments[0] === 'contract-payment' && method === 'GET') {
    return ReportingService.getContractVsPayment({
      tahun: parseInt(params.tahun) || new Date().getFullYear()
    });
  }

  // POST /reporting/contract-payment
  if (segments[0] === 'contract-payment' && method === 'POST') {
    return ReportingService.getContractVsPayment(body);
  }

  // GET /reporting/pd-summary - Perjalanan Dinas summary
  if (segments[0] === 'pd-summary' && method === 'GET') {
    const tahun = parseInt(params.tahun) || new Date().getFullYear();
    return ReportingService.getPDSummary(tahun, params);
  }

  // GET /reporting/compliance-dashboard - Compliance dashboard
  if (segments[0] === 'compliance-dashboard' && method === 'GET') {
    return ReportingService.getComplianceDashboard({
      tahun: parseInt(params.tahun) || new Date().getFullYear()
    });
  }

  // GET /reporting/audit-bundle/:paketId - Generate audit bundle
  if (segments[0] === 'audit-bundle' && segments[1] && method === 'GET') {
    return ReportingService.generateAuditBundle(segments[1], params);
  }

  // POST /reporting/audit-bundle/:paketId - Generate audit bundle with options
  if (segments[0] === 'audit-bundle' && segments[1] && method === 'POST') {
    return ReportingService.generateAuditBundle(segments[1], body);
  }

  // POST /reporting/export - Export report to spreadsheet
  if (segments[0] === 'export' && method === 'POST') {
    const reportType = body.reportType;
    if (!reportType) {
      return { success: false, error: 'reportType required' };
    }

    let reportData;
    switch (reportType) {
      case 'PAKET_SUMMARY':
        const paketSummary = ReportingService.getPaketSummary(body.tahun || new Date().getFullYear());
        if (!paketSummary.success) return paketSummary;
        reportData = paketSummary.data;
        break;
      case 'CONTRACT_PAYMENT':
        const contractPayment = ReportingService.getContractVsPayment(body);
        if (!contractPayment.success) return contractPayment;
        reportData = contractPayment.data;
        break;
      case 'PD_SUMMARY':
        const pdSummary = ReportingService.getPDSummary(body.tahun || new Date().getFullYear());
        if (!pdSummary.success) return pdSummary;
        reportData = pdSummary.data;
        break;
      case 'COMPLIANCE':
        const compliance = ReportingService.getComplianceDashboard(body);
        if (!compliance.success) return compliance;
        reportData = compliance.data;
        break;
      default:
        return { success: false, error: 'Unknown reportType: ' + reportType };
    }

    return ReportingService.exportToSpreadsheet(reportType, reportData);
  }

  return { success: false, error: 'Reporting route not found' };
}

// ========================================
// DOCUMENT TEMPLATE ROUTES (Sprint 3)
// ========================================

function routeDocumentTemplate(segments, method, params, body) {
  // GET /documents/templates - List available templates
  if (segments[0] === 'templates' && method === 'GET') {
    return {
      success: true,
      data: DocumentTemplateService.getAvailableTemplates()
    };
  }

  // POST /documents/generate/:paketId - Generate document
  if (segments[0] === 'generate' && segments[1] && method === 'POST') {
    const paketId = segments[1];
    const docType = body.docType || body.type;

    if (!docType) {
      return { success: false, error: 'docType required in body' };
    }

    return DocumentTemplateService.generate(paketId, docType.toUpperCase(), body);
  }

  // GET /documents/paket/:paketId - List documents for a paket
  if (segments[0] === 'paket' && segments[1] && method === 'GET') {
    return {
      success: true,
      data: DokumenService.getByPaket(segments[1])
    };
  }

  return { success: false, error: 'Document route not found' };
}

// ========================================
// VERSIONING ROUTES
// ========================================

function routeVersioning(segments, method, params, body) {
  // GET /versioning/:docType/:docId - Get version history
  if (segments.length === 2 && method === 'GET') {
    const docType = segments[0];
    const docId = segments[1];
    return VersioningService.getHistory(docType, docId);
  }

  // POST /versioning/:docType/:docId - Create new version
  if (segments.length === 2 && method === 'POST') {
    const docType = segments[0];
    const docId = segments[1];
    return VersioningService.createVersion(docType, docId, body);
  }

  // GET /versioning/:docType/:docId/latest - Get latest version
  if (segments[2] === 'latest' && method === 'GET') {
    const docType = segments[0];
    const docId = segments[1];
    return VersioningService.getLatest(docType, docId);
  }

  // GET /versioning/:docType/:docId/:version - Get specific version
  if (segments.length === 3 && method === 'GET') {
    const docType = segments[0];
    const docId = segments[1];
    const version = parseInt(segments[2]);
    return VersioningService.getVersion(docType, docId, version);
  }

  return { success: false, error: 'Versioning route not found' };
}

// ========================================
// SPRINT 5: BACKUP ROUTES
// ========================================

function routeBackup(segments, method, params, body) {
  // GET /backup/stats - Get backup statistics
  if (segments[0] === 'stats' && method === 'GET') {
    const tahun = params.tahun || null;
    return { success: true, data: BackupService.getBackupStats(tahun) };
  }

  // GET /backup/history - Get backup history
  if (segments[0] === 'history' && method === 'GET') {
    const tahun = params.tahun || null;
    const limit = parseInt(params.limit) || 50;
    return { success: true, data: BackupService.getBackupHistory(tahun, limit) };
  }

  // POST /backup/create - Create backup
  if (segments[0] === 'create' && method === 'POST') {
    const description = body.description || 'Manual';
    return BackupService.createBackup(description);
  }

  // POST /backup/incremental - Create incremental backup
  if (segments[0] === 'incremental' && method === 'POST') {
    const sheets = body.sheets || [];
    const description = body.description || 'Incremental';
    return BackupService.createIncrementalBackup(sheets, description);
  }

  // POST /backup/restore/:backupId - Restore from backup
  if (segments[0] === 'restore' && segments.length === 2 && method === 'POST') {
    const backupId = segments[1];
    const sheets = body.sheets || [];
    return BackupService.restoreFromBackup(backupId, sheets);
  }

  // GET /backup/verify/:backupId - Verify backup integrity
  if (segments[0] === 'verify' && segments.length === 2 && method === 'GET') {
    const backupId = segments[1];
    return BackupService.verifyBackup(backupId);
  }

  // POST /backup/cleanup - Cleanup old backups
  if (segments[0] === 'cleanup' && method === 'POST') {
    const tahun = body.tahun || new Date().getFullYear();
    const keepCount = body.keepCount || 10;
    return BackupService.cleanupOldBackups(tahun, keepCount);
  }

  // POST /backup/setup-trigger - Setup daily backup trigger
  if (segments[0] === 'setup-trigger' && method === 'POST') {
    return setupDailyBackupTrigger();
  }

  return { success: false, error: 'Backup route not found' };
}

// ========================================
// SPRINT 5: DOCUMENT MASTER ROUTES
// ========================================

function routeDocumentMaster(segments, method, params, body) {
  // POST /document-master/setup - Setup document master sheet
  if (segments[0] === 'setup' && method === 'POST') {
    return DocumentFinalizationService.setupDocumentMasterSheet();
  }

  // GET /document-master/:docMasterId - Get document by ID
  if (segments.length === 1 && method === 'GET') {
    const doc = DocumentFinalizationService.getDocument(segments[0]);
    if (doc) {
      return { success: true, data: doc };
    }
    return { success: false, error: 'Document not found' };
  }

  // POST /document-master/register - Register new document
  if (segments[0] === 'register' && method === 'POST') {
    return DocumentFinalizationService.registerDocument(body);
  }

  // POST /document-master/number - Generate document number
  if (segments[0] === 'number' && method === 'POST') {
    const docType = body.docType;
    const tahun = body.tahun || new Date().getFullYear();
    return DocumentFinalizationService.generateDocumentNumber(docType, tahun);
  }

  // PUT /document-master/:docMasterId/finalize - Finalize document
  if (segments.length === 2 && segments[1] === 'finalize' && method === 'PUT') {
    const docMasterId = segments[0];
    const finalizedBy = body.finalizedBy || 'System';
    return DocumentFinalizationService.finalizeDocument(docMasterId, finalizedBy);
  }

  // PUT /document-master/:docMasterId/revise - Revise document
  if (segments.length === 2 && segments[1] === 'revise' && method === 'PUT') {
    const docMasterId = segments[0];
    const reason = body.reason || 'Revision needed';
    const revisedBy = body.revisedBy || 'System';
    return DocumentFinalizationService.reviseDocument(docMasterId, reason, revisedBy);
  }

  // PUT /document-master/:docMasterId/void - Void document
  if (segments.length === 2 && segments[1] === 'void' && method === 'PUT') {
    const docMasterId = segments[0];
    const reason = body.reason || 'Voided';
    const voidedBy = body.voidedBy || 'System';
    return DocumentFinalizationService.voidDocument(docMasterId, reason, voidedBy);
  }

  // GET /document-master/:docMasterId/can-edit - Check if document can be edited
  if (segments.length === 2 && segments[1] === 'can-edit' && method === 'GET') {
    const docMasterId = segments[0];
    return { success: true, data: DocumentFinalizationService.canEdit(docMasterId) };
  }

  // GET /document-master/:docMasterId/history - Get revision history
  if (segments.length === 2 && segments[1] === 'history' && method === 'GET') {
    const docMasterId = segments[0];
    return { success: true, data: DocumentFinalizationService.getRevisionHistory(docMasterId) };
  }

  // GET /document-master/list - List documents with filters
  if (segments[0] === 'list' && method === 'GET') {
    const filters = {
      docType: params.docType || null,
      status: params.status || null,
      tahun: params.tahun || null,
      refType: params.refType || null
    };
    return { success: true, data: DocumentFinalizationService.listDocuments(filters) };
  }

  return { success: false, error: 'Document Master route not found' };
}

// ========================================
// SPRINT 5: AUDIT SIMULATION ROUTES
// ========================================

function routeAuditSimulation(segments, method, params, body) {
  // GET /audit-simulation/paket/:paketId - Simulate audit for Paket
  if (segments[0] === 'paket' && segments.length === 2 && method === 'GET') {
    const paketId = segments[1];
    return AuditSimulationService.simulateAuditPaket(paketId);
  }

  // GET /audit-simulation/pd/:pdId - Simulate audit for Perjalanan Dinas
  if (segments[0] === 'pd' && segments.length === 2 && method === 'GET') {
    const pdId = segments[1];
    return AuditSimulationService.simulateAuditPD(pdId);
  }

  // GET /audit-simulation/required-docs/:stage - Get required documents for stage
  if (segments[0] === 'required-docs' && segments.length === 2 && method === 'GET') {
    const stage = segments[1];
    return { success: true, data: AuditSimulationService.getRequiredDocuments(stage) };
  }

  // POST /audit-simulation/recommendations - Generate recommendations
  if (segments[0] === 'recommendations' && method === 'POST') {
    const findings = body.findings || [];
    return { success: true, data: AuditSimulationService.generateRecommendations(findings) };
  }

  // POST /audit-simulation/report/paket/:paketId - Generate audit report for Paket
  if (segments[0] === 'report' && segments[1] === 'paket' && segments.length === 3 && method === 'POST') {
    const paketId = segments[2];
    return AuditSimulationService.generateAuditReadinessReport(paketId, 'PAKET');
  }

  // POST /audit-simulation/report/pd/:pdId - Generate audit report for PD
  if (segments[0] === 'report' && segments[1] === 'pd' && segments.length === 3 && method === 'POST') {
    const pdId = segments[2];
    return AuditSimulationService.generateAuditReadinessReport(pdId, 'PD');
  }

  return { success: false, error: 'Audit Simulation route not found' };
}

// ========================================
// SPRINT 5: SOP GENERATOR ROUTES
// ========================================

function routeSOP(segments, method, params, body) {
  // POST /sop/paket - Generate SOP Paket
  if (segments[0] === 'paket' && method === 'POST') {
    return SOPGeneratorService.generateSOPPaket();
  }

  // POST /sop/dokumen - Generate SOP Dokumen
  if (segments[0] === 'dokumen' && method === 'POST') {
    return SOPGeneratorService.generateSOPDokumen();
  }

  // POST /sop/audit-bundle - Generate SOP Audit Bundle
  if (segments[0] === 'audit-bundle' && method === 'POST') {
    return SOPGeneratorService.generateSOPAuditBundle();
  }

  // POST /sop/backup-restore - Generate SOP Backup & Restore
  if (segments[0] === 'backup-restore' && method === 'POST') {
    return SOPGeneratorService.generateSOPBackupRestore();
  }

  // POST /sop/all - Generate all SOPs
  if (segments[0] === 'all' && method === 'POST') {
    return SOPGeneratorService.generateAllSOPs();
  }

  return { success: false, error: 'SOP route not found' };
}

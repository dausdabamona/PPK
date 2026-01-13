import { get, post, del } from './client'

/**
 * Get list of all paket
 */
export async function getPaketList(filters = {}) {
  return get('/api/paket', filters)
}

/**
 * Get paket detail by ID
 */
export async function getPaketDetail(id) {
  return get(`/api/paket/${id}`)
}

/**
 * Create new paket
 */
export async function createPaket(data) {
  return post('/api/paket', data)
}

/**
 * Update paket
 */
export async function updatePaket(id, data) {
  return post(`/api/paket/${id}`, data)
}

/**
 * Delete paket
 */
export async function deletePaket(id) {
  return del(`/api/paket/${id}`)
}

/**
 * Update paket status
 */
export async function updatePaketStatus(id, status) {
  return post(`/api/paket/${id}/status`, { status })
}

/**
 * Get paket workflow status
 */
export async function getPaketWorkflow(id) {
  return get(`/api/paket/${id}/workflow`)
}

/**
 * Advance paket to next workflow stage
 */
export async function advanceWorkflow(id) {
  return post(`/api/paket/${id}/workflow/next`)
}

/**
 * Revert paket to previous workflow stage
 */
export async function revertWorkflow(id) {
  return post(`/api/paket/${id}/workflow/revert`)
}

/**
 * Get compliance validation for paket
 */
export async function getPaketCompliance(id) {
  return get(`/api/paket/${id}/compliance`)
}

/**
 * Get document checklist for paket
 */
export async function getPaketChecklist(id) {
  return get(`/api/paket/${id}/checklist`)
}

// ==================== ITEMS ====================

/**
 * Get items in a paket
 */
export async function getPaketItems(paketId) {
  return get(`/api/paket/${paketId}/items`)
}

/**
 * Add item to paket
 */
export async function addPaketItem(paketId, data) {
  return post(`/api/paket/${paketId}/items`, data)
}

/**
 * Update item
 */
export async function updateItem(itemId, data) {
  return post(`/api/items/${itemId}`, data)
}

/**
 * Delete item
 */
export async function deleteItem(itemId) {
  return del(`/api/items/${itemId}`)
}

// ==================== SURVEYS ====================

/**
 * Get surveys for an item
 */
export async function getItemSurveys(itemId) {
  return get(`/api/items/${itemId}/surveys`)
}

/**
 * Add survey to item
 */
export async function addItemSurvey(itemId, data) {
  return post(`/api/items/${itemId}/surveys`, data)
}

/**
 * Delete survey
 * @param {string} itemId - The item ID the survey belongs to
 * @param {string} surveyId - The survey ID to delete
 */
export async function deleteSurvey(itemId, surveyId) {
  return del(`/api/items/${itemId}/surveys/${surveyId}`)
}

// ==================== HPS ====================

/**
 * Get HPS calculation for paket
 */
export async function getPaketHPS(paketId) {
  return get(`/api/paket/${paketId}/hps`)
}

/**
 * Calculate and save HPS
 */
export async function calculateHPS(paketId) {
  return post(`/api/paket/${paketId}/hps/calculate`)
}

// ==================== LAMPIRAN ====================

/**
 * Upload attachment to paket
 */
export async function uploadLampiran(paketId, data) {
  // data should contain: filename, base64Content, mimeType, kategori
  return post(`/api/paket/${paketId}/upload`, data)
}

/**
 * Get attachments for paket
 */
export async function getPaketLampiran(paketId) {
  return get(`/api/paket/${paketId}/lampiran`)
}

/**
 * Delete attachment
 */
export async function deleteLampiran(lampiranId) {
  return del(`/api/lampiran/${lampiranId}`)
}

/**
 * Get upload categories
 */
export async function getKategoriUpload() {
  return get('/api/upload/kategori')
}

// ==================== KONTRAK ====================

/**
 * Get kontrak data for paket
 */
export async function getPaketKontrak(paketId) {
  return get(`/api/paket/${paketId}/kontrak`)
}

/**
 * Update kontrak data
 */
export async function updatePaketKontrak(paketId, data) {
  return post(`/api/paket/${paketId}/kontrak`, data)
}

// ==================== PEMBAYARAN ====================

/**
 * Get pembayaran list for paket
 */
export async function getPaketPembayaran(paketId) {
  return get(`/api/paket/${paketId}/pembayaran`)
}

/**
 * Add pembayaran to paket
 */
export async function addPaketPembayaran(paketId, data) {
  return post(`/api/paket/${paketId}/pembayaran`, data)
}

// ==================== SERAH TERIMA ====================

/**
 * Get serah terima data for paket
 */
export async function getPaketSerahTerima(paketId) {
  return get(`/api/paket/${paketId}/serah-terima`)
}

/**
 * Update serah terima data
 */
export async function updatePaketSerahTerima(paketId, data) {
  return post(`/api/paket/${paketId}/serah-terima`, data)
}

// ==================== WORKFLOW V2 ====================

/**
 * Get paket workflow status (v2 - with state machine)
 */
export async function getWorkflowStatusV2(paketId) {
  return get(`/api/workflow/v2/paket/${paketId}/status`)
}

/**
 * Advance paket workflow (v2)
 */
export async function advanceWorkflowV2(paketId, data = {}) {
  return post(`/api/workflow/v2/paket/${paketId}/advance`, data)
}

/**
 * Revert paket workflow (v2)
 */
export async function revertWorkflowV2(paketId, data = {}) {
  return post(`/api/workflow/v2/paket/${paketId}/revert`, data)
}

/**
 * Cancel paket (v2)
 */
export async function cancelPaketV2(paketId, reason) {
  return post(`/api/workflow/v2/paket/${paketId}/cancel`, { reason })
}

/**
 * Preview transition (v2)
 */
export async function previewTransition(paketId, targetState) {
  return get(`/api/workflow/v2/paket/${paketId}/preview/${targetState}`)
}

// ==================== COMPLIANCE V2 ====================

/**
 * Get full audit compliance status
 */
export async function getAuditCompliance(paketId) {
  return get(`/api/audit/paket/${paketId}`)
}

/**
 * Validate paket for target stage
 */
export async function validateForStage(paketId, targetStage) {
  return get(`/api/compliance/paket/${paketId}/validate`, { targetStage })
}

// ==================== DOCUMENTS ====================

/**
 * Get available document templates
 */
export async function getDocumentTemplates() {
  return get('/api/documents/templates')
}

/**
 * Generate document for paket
 */
export async function generateDocument(paketId, docType) {
  return post(`/api/documents/generate/${paketId}`, { docType })
}

/**
 * Get documents for paket
 */
export async function getPaketDocuments(paketId) {
  return get(`/api/documents/paket/${paketId}`)
}

export default {
  getPaketList,
  getPaketDetail,
  createPaket,
  updatePaket,
  deletePaket,
  updatePaketStatus,
  getPaketWorkflow,
  advanceWorkflow,
  revertWorkflow,
  getPaketCompliance,
  getPaketChecklist,
  getPaketItems,
  addPaketItem,
  updateItem,
  deleteItem,
  getItemSurveys,
  addItemSurvey,
  deleteSurvey,
  getPaketHPS,
  calculateHPS,
  uploadLampiran,
  getPaketLampiran,
  deleteLampiran,
  getKategoriUpload,
  // Kontrak
  getPaketKontrak,
  updatePaketKontrak,
  // Pembayaran
  getPaketPembayaran,
  addPaketPembayaran,
  // Serah Terima
  getPaketSerahTerima,
  updatePaketSerahTerima,
  // Workflow v2
  getWorkflowStatusV2,
  advanceWorkflowV2,
  revertWorkflowV2,
  cancelPaketV2,
  previewTransition,
  // Compliance v2
  getAuditCompliance,
  validateForStage,
  // Documents
  getDocumentTemplates,
  generateDocument,
  getPaketDocuments,
}

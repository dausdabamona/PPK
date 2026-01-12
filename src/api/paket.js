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
}

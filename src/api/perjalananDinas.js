import { get, post, del } from './client'

/**
 * Get list of perjalanan dinas
 */
export async function getPerjalananDinasList(filters = {}) {
  return get('/api/perjalanan-dinas', filters)
}

/**
 * Get perjalanan dinas detail
 */
export async function getPerjalananDinasDetail(id) {
  return get(`/api/perjalanan-dinas/${id}`)
}

/**
 * Create new perjalanan dinas
 */
export async function createPerjalananDinas(data) {
  return post('/api/perjalanan-dinas', data)
}

/**
 * Update perjalanan dinas
 */
export async function updatePerjalananDinas(id, data) {
  return post(`/api/perjalanan-dinas/${id}`, data)
}

/**
 * Delete perjalanan dinas
 */
export async function deletePerjalananDinas(id) {
  return del(`/api/perjalanan-dinas/${id}`)
}

/**
 * Get dropdown options (status, tingkat biaya, etc.)
 */
export async function getOptions() {
  return get('/api/perjalanan-dinas/options')
}

// ==================== PELAKSANA ====================

/**
 * Get pelaksana for perjalanan dinas
 */
export async function getPelaksana(pdId) {
  return get(`/api/perjalanan-dinas/${pdId}/pelaksana`)
}

/**
 * Add pelaksana to perjalanan dinas
 */
export async function addPelaksana(pdId, data) {
  return post(`/api/perjalanan-dinas/${pdId}/pelaksana`, data)
}

/**
 * Update pelaksana
 */
export async function updatePelaksana(pelaksanaId, data) {
  return post(`/api/pelaksana/${pelaksanaId}`, data)
}

/**
 * Delete pelaksana
 */
export async function deletePelaksana(pelaksanaId) {
  return del(`/api/pelaksana/${pelaksanaId}`)
}

// ==================== BIAYA ====================

/**
 * Get biaya for perjalanan dinas
 */
export async function getBiaya(pdId) {
  return get(`/api/perjalanan-dinas/${pdId}/biaya`)
}

/**
 * Add biaya to perjalanan dinas
 */
export async function addBiaya(pdId, data) {
  return post(`/api/perjalanan-dinas/${pdId}/biaya`, data)
}

/**
 * Update biaya
 */
export async function updateBiaya(biayaId, data) {
  return post(`/api/biaya/${biayaId}`, data)
}

/**
 * Delete biaya
 */
export async function deleteBiaya(biayaId) {
  return del(`/api/biaya/${biayaId}`)
}

// ==================== LAMPIRAN ====================

/**
 * Get lampiran for perjalanan dinas
 */
export async function getLampiran(pdId) {
  return get(`/api/perjalanan-dinas/${pdId}/lampiran`)
}

/**
 * Upload lampiran to perjalanan dinas
 */
export async function uploadLampiran(pdId, data) {
  return post(`/api/perjalanan-dinas/${pdId}/lampiran`, data)
}

/**
 * Delete lampiran
 */
export async function deleteLampiran(lampiranId) {
  return del(`/api/lampiran-pd/${lampiranId}`)
}

// ==================== DOKUMEN ====================

/**
 * Get dokumen for perjalanan dinas
 */
export async function getDokumen(pdId) {
  return get(`/api/perjalanan-dinas/${pdId}/dokumen`)
}

/**
 * Generate dokumen for perjalanan dinas
 */
export async function generateDokumen(pdId, docType) {
  return post(`/api/perjalanan-dinas/${pdId}/dokumen/generate`, { docType })
}

// ==================== WORKFLOW ====================

/**
 * Get workflow status for perjalanan dinas
 */
export async function getWorkflow(pdId) {
  return get(`/api/perjalanan-dinas/${pdId}/workflow`)
}

/**
 * Advance to next workflow stage
 */
export async function advanceWorkflow(pdId) {
  return post(`/api/perjalanan-dinas/${pdId}/workflow/next`)
}

/**
 * Revert to previous workflow stage
 */
export async function revertWorkflow(pdId) {
  return post(`/api/perjalanan-dinas/${pdId}/workflow/revert`)
}

export default {
  getPerjalananDinasList,
  getPerjalananDinasDetail,
  createPerjalananDinas,
  updatePerjalananDinas,
  deletePerjalananDinas,
  getOptions,
  getPelaksana,
  addPelaksana,
  updatePelaksana,
  deletePelaksana,
  getBiaya,
  addBiaya,
  updateBiaya,
  deleteBiaya,
  getLampiran,
  uploadLampiran,
  deleteLampiran,
  getDokumen,
  generateDokumen,
  getWorkflow,
  advanceWorkflow,
  revertWorkflow,
}

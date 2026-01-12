import { get, post } from './client'

/**
 * Get list of dokumen for a paket
 */
export async function getPaketDokumen(paketId) {
  return get(`/api/paket/${paketId}/dokumen`)
}

/**
 * Generate new dokumen for paket
 */
export async function generateDokumen(paketId, data) {
  // data should contain: jenisDokumen, tanggalDokumen
  return post(`/api/paket/${paketId}/dokumen/generate`, data)
}

/**
 * Regenerate existing dokumen
 */
export async function regenerateDokumen(dokumenId) {
  return post(`/api/dokumen/${dokumenId}/regenerate`)
}

/**
 * Get available documents per workflow stage
 */
export async function getWorkflowDocuments(paketId) {
  return get(`/api/paket/${paketId}/workflow/documents`)
}

/**
 * Get list of document templates
 */
export async function getTemplates() {
  return get('/api/templates')
}

// ==================== NUMBERING ====================

/**
 * Generate document number
 */
export async function generateNomor(jenisDokumen) {
  return post('/api/numbering/generate', { jenisDokumen })
}

/**
 * Preview next document number
 */
export async function previewNomor(jenisDokumen) {
  return post('/api/numbering/preview', { jenisDokumen })
}

/**
 * Get numbering counters
 */
export async function getCounters() {
  return get('/api/numbering/counters')
}

/**
 * Get document types for numbering
 */
export async function getNomorTypes() {
  return get('/api/numbering/types')
}

// ==================== COMPLIANCE ====================

/**
 * Get valid methods for procurement
 */
export async function getValidMethods(jenisPengadaan, nilai) {
  return post('/api/compliance/methods', { jenisPengadaan, nilai })
}

/**
 * Get method recommendation
 */
export async function getRecommendation(jenisPengadaan, nilai) {
  return post('/api/compliance/recommend', { jenisPengadaan, nilai })
}

/**
 * Calculate tax
 */
export async function calculateTax(data) {
  // data: nilaiKontrak, jenisPengadaan, isPKP, kualifikasi
  return post('/api/compliance/tax', data)
}

export default {
  getPaketDokumen,
  generateDokumen,
  regenerateDokumen,
  getWorkflowDocuments,
  getTemplates,
  generateNomor,
  previewNomor,
  getCounters,
  getNomorTypes,
  getValidMethods,
  getRecommendation,
  calculateTax,
}

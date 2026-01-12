import { get, post, del } from './client'

/**
 * Get list of all penyedia
 */
export async function getPenyediaList(filters = {}) {
  return get('/api/penyedia', filters)
}

/**
 * Get penyedia detail by ID
 */
export async function getPenyediaDetail(id) {
  return get(`/api/penyedia/${id}`)
}

/**
 * Create new penyedia
 */
export async function createPenyedia(data) {
  return post('/api/penyedia', data)
}

/**
 * Update penyedia
 */
export async function updatePenyedia(id, data) {
  return post(`/api/penyedia/${id}`, data)
}

/**
 * Delete penyedia
 */
export async function deletePenyedia(id) {
  return del(`/api/penyedia/${id}`)
}

/**
 * Search penyedia by name
 */
export async function searchPenyedia(query) {
  return get('/api/penyedia', { search: query })
}

export default {
  getPenyediaList,
  getPenyediaDetail,
  createPenyedia,
  updatePenyedia,
  deletePenyedia,
  searchPenyedia,
}

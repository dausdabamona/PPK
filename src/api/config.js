import { get, post } from './client'

/**
 * Get current configuration
 */
export async function getConfig() {
  return get('/api/config')
}

/**
 * Update configuration
 */
export async function updateConfig(data) {
  return post('/api/config', data)
}

export default {
  getConfig,
  updateConfig,
}

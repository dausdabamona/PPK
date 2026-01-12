import toast from 'react-hot-toast'

const DEFAULT_API_BASE = 'https://script.google.com/macros/s/AKfycbzamm-mkpQg8yV3tPlhpse4RU-l7VECNX04EJsA9mhlVbGLNI6RplVp13lSqpXiHPPl7A/exec'

// Get API URL from localStorage or use default
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ppk_api_url') || DEFAULT_API_BASE
  }
  return DEFAULT_API_BASE
}

// Set custom API URL
export const setApiUrl = (url) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ppk_api_url', url)
  }
}

// Get current API URL
export const getApiUrl = () => getApiBase()

// Reset to default API URL
export const resetApiUrl = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ppk_api_url')
  }
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  return { controller, timeoutId }
}

/**
 * Main API call function with retry logic
 */
async function apiCall(method, path, data = {}, options = {}) {
  const { retries = MAX_RETRIES, timeout = REQUEST_TIMEOUT, showError = true } = options

  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { controller, timeoutId } = createTimeoutController(timeout)

      let response

      if (method === 'GET') {
        const params = new URLSearchParams({
          path,
          data: JSON.stringify(data),
        })
        response = await fetch(`${getApiBase()}?${params}`, {
          method: 'GET',
          signal: controller.signal,
        })
      } else {
        response = await fetch(getApiBase(), {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain', // GAS requirement
          },
          body: JSON.stringify({ path, data }),
          signal: controller.signal,
        })
      }

      clearTimeout(timeoutId)

      // Handle non-OK responses
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      // Handle API-level errors
      if (!result.success) {
        const error = new Error(result.error || 'Terjadi kesalahan')
        error.isApiError = true
        throw error
      }

      return result

    } catch (error) {
      lastError = error

      // Don't retry on API-level errors (success: false)
      if (error.isApiError) {
        break
      }

      // Check if we should retry
      const isNetworkError = error.name === 'AbortError' ||
                            error.name === 'TypeError' ||
                            error.message.includes('network') ||
                            error.message.includes('fetch')

      if (isNetworkError && attempt < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attempt) // Exponential backoff
        console.warn(`API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
        await sleep(delay)
        continue
      }

      break
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Terjadi kesalahan koneksi'

  if (showError) {
    if (lastError?.name === 'AbortError') {
      toast.error('Koneksi timeout. Silakan coba lagi.')
    } else if (lastError?.isApiError) {
      toast.error(errorMessage)
    } else {
      toast.error('Gagal terhubung ke server. Periksa koneksi internet Anda.')
    }
  }

  return {
    success: false,
    error: errorMessage,
    data: null,
  }
}

/**
 * GET request wrapper
 */
export async function get(path, data = {}, options = {}) {
  return apiCall('GET', path, data, options)
}

/**
 * POST request wrapper
 */
export async function post(path, data = {}, options = {}) {
  return apiCall('POST', path, data, options)
}

/**
 * DELETE request wrapper (uses POST with delete action)
 */
export async function del(path, data = {}, options = {}) {
  return apiCall('POST', path, { ...data, _method: 'DELETE' }, options)
}

export default {
  get,
  post,
  del,
}

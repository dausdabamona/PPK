import { useState, useCallback } from 'react'

/**
 * Generic API hook with loading and error states
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiFunction(...args)

      if (result.success) {
        setData(result.data)
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err.message || 'Terjadi kesalahan'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  }
}

/**
 * Hook for API calls that return lists with pagination
 */
export function useApiList(apiFunction) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const fetch = useCallback(async (filters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiFunction(filters)

      if (result.success) {
        setItems(result.data?.items || result.data || [])
        if (result.data?.pagination) {
          setPagination(result.data.pagination)
        }
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err.message || 'Terjadi kesalahan'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setItems([])
    setError(null)
    setLoading(false)
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    })
  }, [])

  return {
    items,
    loading,
    error,
    pagination,
    fetch,
    reset,
    setItems,
  }
}

/**
 * Hook for mutation operations (create, update, delete)
 */
export function useMutation(apiFunction) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiFunction(...args)

      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMessage = err.message || 'Terjadi kesalahan'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    loading,
    error,
    mutate,
    reset,
  }
}

export default useApi

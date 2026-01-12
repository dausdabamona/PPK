import { useEffect, useCallback, useState } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Hook to detect and warn about unsaved changes
 * @param {boolean} hasChanges - Whether there are unsaved changes
 * @param {string} message - Custom message for the warning
 */
export function useUnsavedChanges(hasChanges, message = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?') {
  const [showPrompt, setShowPrompt] = useState(false)

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges &&
      currentLocation.pathname !== nextLocation.pathname
  )

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasChanges, message])

  // Update prompt state when blocker state changes
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [blocker.state])

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
    setShowPrompt(false)
  }, [blocker])

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
    setShowPrompt(false)
  }, [blocker])

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    message,
  }
}

export default useUnsavedChanges

import { useState, useEffect } from 'react'
import { getUserComprehensiveStatus } from '../services/botApi'

export function useUserStatus() {
  const [userStatus, setUserStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getUserComprehensiveStatus()
      setUserStatus(response)
      
    } catch (err) {
      console.error('Failed to fetch user status:', err)
      setError(err.message || 'Failed to fetch user status')
      setUserStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStatus()
  }, [])

  const refreshStatus = async () => {
    try {
      setError(null)
      const response = await getUserComprehensiveStatus()
      setUserStatus(response)
    } catch (err) {
      console.error('Failed to refresh user status:', err)
      // Don't set loading state during refresh to avoid UI flicker
      // Just log the error and keep existing status if available
      setError(err.message || 'Failed to refresh user status')
      
      // If error contains authentication issues, clear token and retry once
      if (err.message?.includes('token') || err.message?.includes('auth') || err.message?.includes('401')) {
        console.log('🔄 Authentication error detected, clearing token and retrying...')
        localStorage.removeItem('bundlealert_session_token')
        
        // Give a brief moment for cleanup, then retry once
        setTimeout(async () => {
          try {
            const retryResponse = await getUserComprehensiveStatus()
            setUserStatus(retryResponse)
            setError(null)
          } catch (retryErr) {
            console.error('Retry also failed:', retryErr)
            // Don't throw - just keep the error state
          }
        }, 1000)
      }
    }
  }

  return {
    userStatus,
    isLoading: loading,
    error,
    refreshStatus
  }
}

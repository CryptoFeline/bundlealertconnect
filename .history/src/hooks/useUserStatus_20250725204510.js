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
    }
  }

  return {
    userStatus,
    loading,
    error,
    refreshStatus
  }
}

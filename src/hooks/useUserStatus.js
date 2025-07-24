import { useState, useEffect } from 'react'
import { getUserComprehensiveStatus } from '../services/botApi'

export const useUserStatus = () => {
  const [userStatus, setUserStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUserStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const status = await getUserComprehensiveStatus()
      setUserStatus(status)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch user status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStatus()
  }, [])

  const refreshStatus = () => {
    fetchUserStatus()
  }

  return {
    userStatus,
    loading,
    error,
    refreshStatus
  }
}

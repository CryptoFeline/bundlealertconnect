import axios from 'axios'
import { API_CONFIG, ERROR_MESSAGES, STORAGE_KEYS } from '../utils/constants'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add timestamp to prevent caching
    config.headers['X-Request-Time'] = Date.now().toString()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // console.log('✅ API Response successful:', response.config.url, response.status)
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // console.log('❌ API Error:', {
    //   url: originalRequest?.url,
    //   status: error.response?.status,
    //   data: error.response?.data,
    //   isRetry: !!originalRequest._retry
    // })
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // console.log('🔄 Attempting token refresh for 401 error...')
      originalRequest._retry = true
      
      // Clear invalid token
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
      // console.log('🗑️ Cleared invalid token')
      
      // Try to refresh authentication if we have Telegram data
      try {
        if (window.Telegram?.WebApp?.initData) {
          // console.log('🔑 Refreshing authentication with Telegram data...')
          await authenticateTelegram(window.Telegram.WebApp.initData)
          
          // Retry original request
          const token = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
          if (token) {
            // console.log('🔄 Retrying original request with new token...')
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          } else {
           //  console.error('❌ No token after refresh attempt')
          }
        } else {
          // console.error('❌ No Telegram data available for refresh')
        }
      } catch (refreshError) {
        // console.error('❌ Failed to refresh authentication:', refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

/**
 * Authenticate with Telegram WebApp data
 */
export const authenticateTelegram = async (telegramData) => {
  try {
    // console.log('🔑 Starting Telegram authentication...')
    // console.log('📱 Telegram data length:', telegramData?.length || 0)
    
    // Skip ready waiting - just force call ready() and proceed
    if (window.Telegram?.WebApp?.ready && !window.Telegram.WebApp.isReady) {
      try {
        // console.log('🔄 Force calling Telegram WebApp ready()...')
        window.Telegram.WebApp.ready()
        // Give it a brief moment
        await new Promise(resolve => setTimeout(resolve, 200))
        // console.log('✅ Ready state after forced call:', window.Telegram.WebApp.isReady)
      } catch (e) {
        console.log('⚠️ Could not force call ready()') // , e.message)
      }
    }
    
    // Test connectivity first with a simpler request
    // console.log('🌐 Testing basic server connectivity...')
    try {
      // First try the new CORS debug endpoint
      // console.log('🔧 Testing CORS with debug endpoint...')
      const corsTest = await fetch(`${API_CONFIG.baseURL}/api/debug/cors-test`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
        },
        timeout: 5000
      })
      
      // console.log('✅ CORS test status:', corsTest.status)
      if (corsTest.ok) {
        const corsData = await corsTest.json()
        // console.log('🔧 CORS debug data:', corsData)
      }
      
      // Then try health check
      const healthCheck = await fetch(`${API_CONFIG.baseURL}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000
      })
      // console.log('✅ Health check status:', healthCheck.status)
      
      if (!healthCheck.ok) {
        throw new Error(`Health check failed: ${healthCheck.status}`)
      }
    } catch (connectError) {
      // console.error('❌ Connectivity test failed:', connectError)
      // console.error('🔍 Error details:', {
      //   name: connectError.name,
      //   message: connectError.message,
      //   stack: connectError.stack
      // })
      throw new Error(`Cannot reach server: ${connectError.message}`)
    }
    
    // console.log('Proceeding with authentication request...')
    
    const response = await apiClient.post('/api/auth/telegram', {
      telegram_data: telegramData
    })
    
    // console.log('🔐 Auth response status:', response.status)
    // console.log('🎫 Auth response data:', response.data)
    
    if (response.data.token) {
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, response.data.token)
      // console.log('✅ Token stored successfully')
      return response.data
    }
    
    // console.error('❌ No token in response:', response.data)
    throw new Error('No token received from server')
  } catch (error) {
    // console.error('❌ Telegram authentication failed:', error)
    
    if (error.response) {
      console.error('📄 Auth error response:', {
        status: error.response.status,
        data: error.response.data
      })
    }
    
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
  }
}

/**
 * Initiate wallet verification process
 */
export const initiateVerification = async (userId) => {
  try {
    const response = await apiClient.post('/api/wallet/initiate', {
      user_id: userId
    })
    
    return response.data
  } catch (error) {
    // console.error('Failed to initiate verification:', error)
    handleApiError(error)
  }
}

/**
 * Verify wallet signature and get tier assignment
 */
export const verifyWallet = async ({ walletAddress, signature, message }) => {
  try {
    // console.log('🔐 Starting wallet verification for:', walletAddress)
    
    // Import toast for debug messages
    const { toast } = await import('react-hot-toast')
    
    // Show debug start
    // toast.loading('🔍 DEBUG: Starting wallet verification...', { id: 'api-debug', duration: 2000 })
    
    // Check current token status
    const currentToken = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
    // console.log('🎫 Current token status:', currentToken ? 'Present' : 'Missing')
    
    // toast.loading(`🔍 DEBUG: Token ${currentToken ? 'EXISTS' : 'MISSING'}`, { id: 'api-debug', duration: 1500 })
    
    // First authenticate with Telegram if needed
    let authAttempted = false
    if (window.Telegram?.WebApp) {
      // toast.loading('🔍 DEBUG: Telegram WebApp detected', { id: 'api-debug', duration: 1000 })
      
      // Quick ready trigger without waiting
      if (window.Telegram.WebApp.ready && !window.Telegram.WebApp.isReady) {
        try {
          // console.log('🔄 Quick ready trigger...')
          // toast.loading('🔍 DEBUG: Triggering Telegram ready...', { id: 'api-debug', duration: 1000 })
          window.Telegram.WebApp.ready()
          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (e) {
          // console.log('⚠️ Ready trigger failed:', e.message)
          // toast.error(`❌ DEBUG: Ready trigger failed: ${e.message}`, { duration: 3000 })
        }
      }
      
      if (window.Telegram.WebApp.initData && !currentToken) {
        // console.log('🔑 No token found, attempting Telegram authentication...')
        // toast.loading('🔍 DEBUG: Authenticating with Telegram...', { id: 'api-debug', duration: 2000 })
        try {
          await authenticateTelegram(window.Telegram.WebApp.initData)
          authAttempted = true
          // console.log('✅ Telegram authentication successful')
          // toast.success('✅ DEBUG: Telegram auth successful!', { id: 'api-debug', duration: 1500 })
        } catch (authError) {
          // console.error('❌ Telegram authentication failed:', authError)
          // toast.error(`❌ DEBUG: Auth failed: ${authError.message}`, { duration: 5000 })
          throw new Error('Authentication required but failed')
        }
      } else if (currentToken) {
        // console.log('🎫 Using existing token for verification')
        // toast.loading('🔍 DEBUG: Using existing token', { id: 'api-debug', duration: 1000 })
      } else {
        // console.warn('⚠️ No Telegram initData available')
        // toast.error('❌ DEBUG: No Telegram initData available', { duration: 3000 })
      }
    } else {
      // console.warn('⚠️ No Telegram WebApp available')
      // toast.error('❌ DEBUG: No Telegram WebApp available', { duration: 3000 })
      if (!currentToken) {
        throw new Error('No authentication method available')
      }
    }

    // Double-check we have a token before proceeding
    const tokenForRequest = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN)
    // console.log('🔍 Token check before request:', tokenForRequest ? 'Ready' : 'Still missing!')
    
    if (!tokenForRequest) {
      // toast.error('❌ DEBUG: No token available for request!', { duration: 5000 })
      throw new Error('Authentication failed - no token available')
    }

    // console.log('📤 Sending verification request to:', `${API_CONFIG.baseURL}/api/wallet/verify`)
    // console.log('📋 Request data:', { 
    //   wallet_address: walletAddress, 
    //   signature: signature?.slice(0, 10) + '...', 
    //   message: message?.slice(0, 50) + '...',
    //   hasToken: !!tokenForRequest
    // })

    const response = await apiClient.post('/api/wallet/verify', {
      wallet_address: walletAddress,
      signature: signature,
      message: message
    })
    
    // console.log('✅ Verification response:', response.data)
    return response.data
  } catch (error) {
    // console.error('❌ Failed to verify wallet:', error)
    
    // Import toast for error display
    const { toast } = await import('react-hot-toast')
    
    // Enhanced error logging for debugging
    if (error.response) {
      // console.error('📄 Server response:', {
     //    status: error.response.status,
      //   data: error.response.data,
      //   headers: error.response.headers
      // })
      // toast.error(`❌ DEBUG: Server error ${error.response.status}`, { duration: 5000 })
      // toast.error(`❌ DEBUG: ${JSON.stringify(error.response.data)}`, { duration: 8000 })
    } else if (error.request) {
      // console.error('🌐 Network error:', error.request)
      // toast.error('❌ DEBUG: Network error - no response from server', { duration: 5000 })
    } else {
      // console.error('⚙️ Request setup error:', error.message)
      // toast.error(`❌ DEBUG: Request error: ${error.message}`, { duration: 5000 })
    }
    
    handleApiError(error)
  }
}

/**
 * Get user verification status
 */
export const getUserStatus = async (userId) => {
  try {
    const response = await apiClient.get(`/api/user/status/${userId}`)
    return response.data
  } catch (error) {
    // console.error('Failed to get user status:', error)
    handleApiError(error)
  }
}

/**
 * Disconnect wallet - updated for JWT auth
 */
export const disconnectWallet = async (walletAddress = null, disconnectAll = false) => {
  try {
    const response = await apiClient.post('/api/wallet/disconnect', {
      wallet_address: walletAddress,
      disconnect_all: disconnectAll
    })
    
    return response.data
  } catch (error) {
    console.error('[API] Failed to disconnect wallet:', error)
    throw new Error(error.response?.data?.error || 'Failed to disconnect wallet')
  }
}

/**
 * Check wallet balance
 */
export const checkWalletBalance = async (walletAddress, tokenContract = null) => {
  try {
    const response = await apiClient.post('/api/wallet/balance', {
      wallet_address: walletAddress,
      token_contract: tokenContract
    })
    
    return response.data
  } catch (error) {
    // console.error('Failed to check wallet balance:', error)
    handleApiError(error)
  }
}

/**
 * Get supported tokens for tier verification
 */
export const getSupportedTokens = async () => {
  try {
    const response = await apiClient.get('/api/tokens/supported')
    return response.data
  } catch (error) {
    // console.error('Failed to get supported tokens:', error)
    handleApiError(error)
  }
}

/**
 * Submit feedback or error report
 */
export const submitFeedback = async (userId, type, message, metadata = {}) => {
  try {
    const response = await apiClient.post('/api/feedback', {
      user_id: userId,
      type: type,
      message: message,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    })
    
    return response.data
  } catch (error) {
    // console.error('Failed to submit feedback:', error)
    // Don't throw for feedback submission failures
    return { success: false }
  }
}

/**
 * Handle API errors with appropriate user messages
 */
const handleApiError = (error) => {
  let message = ERROR_MESSAGES.SERVER_ERROR
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    
    // console.log('🔍 Handling API error:', { status, data })
    
    switch (status) {
      case 400:
        message = data?.error || ERROR_MESSAGES.INVALID_SIGNATURE
        break
      case 401:
        if (data?.error === 'No token provided') {
          message = 'Authentication required - please reconnect your wallet'
        } else if (data?.error === 'Bot token not configured') {
          message = 'Server configuration error - please contact support'
        } else {
          message = ERROR_MESSAGES.UNAUTHORIZED
        }
        break
      case 403:
        message = 'Access denied - session may have expired'
        break
      case 429:
        message = ERROR_MESSAGES.RATE_LIMITED
        break
      case 500:
        message = ERROR_MESSAGES.SERVER_ERROR
        break
      default:
        message = data?.error || ERROR_MESSAGES.SERVER_ERROR
    }
  } else if (error.request) {
    // Network error
    message = ERROR_MESSAGES.NETWORK_ERROR
  } else if (error.message) {
    // Other error
    message = error.message
  }
  
  // console.log('📢 Final error message:', message)
  throw new Error(message)
}

/**
 * Retry failed requests with exponential backoff
 */
/**
 * Get comprehensive user status including verification, wallets, and tier info
 */
export const getUserComprehensiveStatus = async () => {
  try {
    const response = await apiClient.get('/api/user/comprehensive-status')
    return response.data
  } catch (error) {
    console.error('[API] Failed to get user comprehensive status:', error)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it and suggest re-authentication
      localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN)
      throw new Error('Authentication expired. Please refresh and try again.')
    } else if (error.response?.status === 404) {
      throw new Error('User not found. Please re-authenticate.')
    } else if (error.response?.status >= 500) {
      throw new Error('Server temporarily unavailable. Please try again in a moment.')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network connection issue. Please check your connection and try again.')
    }
    
    throw new Error(error.response?.data?.error || 'Failed to fetch user status')
  }
}

export const retryRequest = async (requestFn, maxRetries = API_CONFIG.maxRetries) => {
  let lastError
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) break
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        break
      }
      
      // Exponential backoff with jitter
      const delay = API_CONFIG.retryDelay * Math.pow(2, i) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Health check endpoint
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health', { timeout: 5000 })
    return response.status === 200
  } catch (error) {
    return false
  }
}

// Export configured axios instance for custom requests
export { apiClient }

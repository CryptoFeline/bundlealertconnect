import { ethers } from 'ethers'
import { SIGNATURE_CONFIG } from './constants'

/**
 * Validate Ethereum address format
 */
export const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address)
  } catch {
    return false
  }
}

/**
 * Validate signature format
 */
export const isValidSignature = (signature) => {
  if (!signature || typeof signature !== 'string') return false
  
  // Check if it's a valid hex signature (with or without 0x prefix)
  const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature
  
  // Standard signature is 65 bytes (130 hex characters)
  return /^[0-9a-fA-F]{130}$/.test(cleanSignature)
}

/**
 * Validate wallet connection input
 */
export const validateWalletInput = (address, signature) => {
  const errors = []
  
  if (!address) {
    errors.push('Wallet address is required')
  } else if (!isValidAddress(address)) {
    errors.push('Invalid wallet address format')
  }
  
  if (!signature) {
    errors.push('Signature is required')
  } else if (!isValidSignature(signature)) {
    errors.push('Invalid signature format')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate user ID format (Telegram user ID)
 */
export const isValidUserId = (userId) => {
  return userId && /^\d+$/.test(userId.toString())
}

/**
 * Validate chain ID
 */
export const isValidChainId = (chainId) => {
  const supportedChains = [1] // Ethereum mainnet
  return supportedChains.includes(parseInt(chainId))
}

/**
 * Sanitize input strings
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return ''
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate signature message structure
 */
export const validateSignatureMessage = (message) => {
  const expectedStart = SIGNATURE_CONFIG.message
  return message && message.includes(expectedStart)
}

/**
 * Validate environment configuration
 */
export const validateEnvironment = () => {
  const required = [
    'VITE_BOT_API_URL',
    'VITE_WALLETCONNECT_PROJECT_ID'
  ]
  
  const missing = required.filter(key => !import.meta.env[key])
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

/**
 * Validate Telegram WebApp data
 */
export const validateTelegramData = (telegramData) => {
  if (!telegramData || typeof telegramData !== 'object') {
    return { isValid: false, error: 'Invalid Telegram data' }
  }
  
  const { user } = telegramData
  if (!user || !user.id) {
    return { isValid: false, error: 'User ID not found in Telegram data' }
  }
  
  return { isValid: true, userId: user.id.toString() }
}

/**
 * Validate API response structure
 */
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== 'object') {
    return { isValid: false, error: 'Invalid response format' }
  }
  
  const missing = expectedFields.filter(field => !(field in response))
  
  return {
    isValid: missing.length === 0,
    missing
  }
}

/**
 * Validate signature timestamp (prevent replay attacks)
 */
export const validateSignatureTimestamp = (timestamp, maxAge = SIGNATURE_CONFIG.timeout) => {
  const now = Date.now()
  const signatureTime = parseInt(timestamp) * 1000 // Convert to milliseconds
  
  return {
    isValid: (now - signatureTime) <= maxAge,
    age: now - signatureTime
  }
}

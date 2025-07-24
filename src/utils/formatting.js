/**
 * Format wallet address for display
 */
export const formatAddress = (address, startLength = 6, endLength = 4) => {
  if (!address) return ''
  if (address.length <= startLength + endLength) return address
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * Format number with appropriate units
 */
export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0'
  
  const number = parseFloat(num)
  if (isNaN(number)) return '0'
  
  if (number >= 1e9) {
    return `${(number / 1e9).toFixed(decimals)}B`
  }
  if (number >= 1e6) {
    return `${(number / 1e6).toFixed(decimals)}M`
  }
  if (number >= 1e3) {
    return `${(number / 1e3).toFixed(decimals)}K`
  }
  
  return number.toFixed(decimals)
}

/**
 * Format token balance
 */
export const formatTokenBalance = (balance, decimals = 18, symbol = '') => {
  if (!balance) return '0'
  
  try {
    const formatted = formatNumber(parseFloat(balance) / Math.pow(10, decimals))
    return symbol ? `${formatted} ${symbol}` : formatted
  } catch {
    return '0'
  }
}

/**
 * Format time duration
 */
export const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Format tier name for display
 */
export const formatTierName = (tier) => {
  const tierMap = {
    free: 'Free',
    tier1: 'Tier 1',
    tier2: 'Tier 2', 
    tier3: 'Tier 3'
  }
  
  return tierMap[tier] || 'Unknown'
}

/**
 * Format error message for display
 */
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error
  
  if (error?.message) {
    // Clean up common error messages
    let message = error.message
    
    // Remove technical stack traces
    if (message.includes('\n')) {
      message = message.split('\n')[0]
    }
    
    // Simplify common wallet errors
    if (message.includes('User rejected')) {
      return 'User rejected the request'
    }
    if (message.includes('Already processing')) {
      return 'Please check your wallet for pending requests'
    }
    
    return message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Format loading message with dots animation
 */
export const formatLoadingMessage = (baseMessage, dotCount = 3) => {
  const dots = '.'.repeat((Date.now() / 500) % (dotCount + 1))
  return `${baseMessage}${dots}`
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Format bytes to human readable size
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Format countdown timer
 */
export const formatCountdown = (targetTime) => {
  const now = Date.now()
  const remaining = targetTime - now
  
  if (remaining <= 0) return '00:00'
  
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format status badge text
 */
export const formatStatusBadge = (status) => {
  const statusMap = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    verifying: 'Verifying...',
    verified: 'Verified',
    failed: 'Failed',
    pending: 'Pending',
    success: 'Success',
    error: 'Error'
  }
  
  return statusMap[status] || capitalize(status)
}

// App Constants
export const APP_CONFIG = {
  name: 'BundleAlert Wallet Verification',
  version: '1.0.0',
  description: 'Connect your wallet to verify your BundleAlert subscription tier',
  domain: import.meta.env.VITE_APP_DOMAIN || 'bundlealert-wallet.netlify.app'
}

// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_BOT_API_URL || 'https://bundlealertstream.replit.app',
  timeout: parseInt(import.meta.env.VITE_BOT_API_TIMEOUT) || 10000,
  maxRetries: parseInt(import.meta.env.VITE_MAX_RETRY_ATTEMPTS) || 3,
  retryDelay: 1000
}

// WalletConnect Configuration
export const WALLET_CONFIG = {
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  supportedChains: [1], // Ethereum mainnet
  defaultChainId: parseInt(import.meta.env.VITE_DEFAULT_CHAIN_ID) || 1,
  rpcUrls: {
    1: 'https://eth.llamarpc.com'
  }
}

// Signature Configuration
export const SIGNATURE_CONFIG = {
  timeout: parseInt(import.meta.env.VITE_SIGNATURE_TIMEOUT) || 300000, // 5 minutes
  message: 'Sign this message to verify your wallet ownership for BundleAlert subscription verification.',
  domain: APP_CONFIG.domain,
  version: '1'
}

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    level: 0,
    description: 'Basic access',
    color: '#86868b',
    emoji: '🆓'
  },
  tier1: {
    name: 'Tier 1',
    level: 1,
    description: 'Wallet connected',
    color: '#30d158',
    emoji: '🔗'
  },
  tier2: {
    name: 'Tier 2',
    level: 2,
    description: 'Token holder',
    color: '#007aff',
    emoji: '💎'
  },
  tier3: {
    name: 'Tier 3',
    level: 3,
    description: 'Premium member',
    color: '#ff9500',
    emoji: '👑'
  }
}

// Supported Wallet Providers
export const WALLET_PROVIDERS = {
  metamask: {
    name: 'MetaMask',
    id: 'metamask',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/',
    deepLink: 'https://metamask.app.link/'
  },
  walletconnect: {
    name: 'WalletConnect',
    id: 'walletconnect',
    icon: '🔗',
    description: 'Connect with mobile wallets'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    id: 'coinbase',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet'
  }
}

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND: 'Wallet not found. Please install MetaMask or use WalletConnect.',
  CONNECTION_REJECTED: 'Connection rejected by user.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SIGNATURE_REJECTED: 'Signature rejected by user.',
  SIGNATURE_FAILED: 'Failed to verify signature.',
  INVALID_SIGNATURE: 'Invalid signature format.',
  SESSION_EXPIRED: 'Session expired. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  UNAUTHORIZED: 'Authentication failed. Please refresh and try again.',
  WALLET_ALREADY_CONNECTED: 'This wallet is already connected to another account.',
  INVALID_CHAIN: 'Please switch to Ethereum mainnet.',
  BALANCE_CHECK_FAILED: 'Failed to check wallet balance. Please try again.',
  TELEGRAM_INIT_FAILED: 'Failed to initialize Telegram WebApp. Please open from Telegram.',
  UNSUPPORTED_BROWSER: 'Unsupported browser. Please use a modern browser.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  VERIFICATION_COMPLETE: 'Verification complete! You can now return to the bot.',
  TIER_ASSIGNED: 'Your subscription tier has been assigned.',
  SIGNATURE_VERIFIED: 'Signature verified successfully.'
}

// Loading Messages
export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting to your wallet...',
  VERIFYING_SIGNATURE: 'Verifying signature...',
  CHECKING_BALANCE: 'Checking wallet balance...',
  INITIALIZING: 'Initializing application...',
  PROCESSING: 'Processing your request...'
}

// UI Constants
export const UI_CONFIG = {
  maxContainerWidth: '480px',
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px'
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px'
  }
}

// Debug Configuration
export const DEBUG_CONFIG = {
  enabled: import.meta.env.VITE_DEBUG_MODE === 'true',
  logLevel: import.meta.env.DEV ? 'debug' : 'error'
}

// FAQ Data
export const FAQ_DATA = [
  {
    id: 'security',
    question: 'Is this safe? What permissions am I giving?',
    answer: 'This is completely safe. We only request a read-only signature to verify wallet ownership. No spending permissions or access to your funds. You can disconnect immediately after verification.'
  },
  {
    id: 'data',
    question: 'What data do you collect?',
    answer: 'We only collect your wallet address and signature for verification purposes. No personal information, transaction history, or spending permissions are accessed.'
  },
  {
    id: 'disconnect',
    question: 'Can I disconnect after verification?',
    answer: 'Yes! We recommend disconnecting after successful verification. Your tier status is saved on our servers and doesn\'t require staying connected.'
  },
  {
    id: 'tiers',
    question: 'How do subscription tiers work?',
    answer: 'Tier 1: Wallet connection required. Tier 2: Token holdings. Tier 3: Premium token amounts. Each tier unlocks additional bot features.'
  },
  {
    id: 'support',
    question: 'What if verification fails?',
    answer: 'Try refreshing the page or using a different wallet. If issues persist, contact support through the main bot chat with /help command.'
  },
  {
    id: 'mobile',
    question: 'Does this work on mobile?',
    answer: 'Yes! Use WalletConnect to connect mobile wallets like MetaMask, Trust Wallet, or Rainbow. The interface is optimized for mobile use.'
  }
]

// Chain Information
export const CHAIN_INFO = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io'
  }
}

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_ADDRESS: 'bundlealert_wallet_address',
  USER_TIER: 'bundlealert_user_tier',
  LAST_VERIFICATION: 'bundlealert_last_verification',
  SESSION_TOKEN: 'bundlealert_session_token'
}

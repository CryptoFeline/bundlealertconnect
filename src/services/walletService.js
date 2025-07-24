import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'
import { 
  WALLET_CONFIG, 
  WALLET_PROVIDERS, 
  ERROR_MESSAGES, 
  SIGNATURE_CONFIG,
  STORAGE_KEYS 
} from '../utils/constants'
import { isValidAddress, isValidChainId } from '../utils/validation'

class WalletService {
  constructor() {
    this.provider = null
    this.signer = null
    this.address = null
    this.chainId = null
    this.isConnecting = false
  }

  /**
   * Check if MetaMask is available
   */
  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask
  }

  /**
   * Check if any wallet is available
   */
  isWalletAvailable() {
    return typeof window !== 'undefined' && window.ethereum
  }

  /**
   * Initialize WalletConnect provider
   */
  async initializeWalletConnect() {
    try {
      // Debug: Check if Project ID is available
      if (!WALLET_CONFIG.projectId) {
        console.error('WalletConnect Project ID not found in environment variables')
        console.log('Available env vars:', Object.keys(import.meta.env))
        throw new Error('WalletConnect Project ID is required. Please check your environment configuration.')
      }

      console.log('Initializing WalletConnect with Project ID:', WALLET_CONFIG.projectId.substring(0, 8) + '...')

      const provider = await EthereumProvider.init({
        projectId: WALLET_CONFIG.projectId,
        chains: WALLET_CONFIG.supportedChains,
        showQrModal: true,
        methods: ['eth_sendTransaction', 'personal_sign'],
        events: ['chainChanged', 'accountsChanged'],
        rpcMap: WALLET_CONFIG.rpcUrls
      })

      return provider
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error)
      throw new Error(`Failed to initialize WalletConnect: ${error.message}`)
    }
  }

  /**
   * Connect to MetaMask
   */
  async connectMetaMask() {
    if (!this.isMetaMaskAvailable()) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND)
    }

    try {
      this.isConnecting = true

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.CONNECTION_REJECTED)
      }

      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      this.address = accounts[0]

      // Get chain ID
      const network = await this.provider.getNetwork()
      this.chainId = Number(network.chainId)

      // Validate chain
      if (!isValidChainId(this.chainId)) {
        await this.switchToMainnet()
      }

      // Set up event listeners
      this.setupEventListeners()

      // Store connection info
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, this.address)

      return {
        address: this.address,
        chainId: this.chainId,
        provider: 'metamask'
      }
    } catch (error) {
      console.error('MetaMask connection failed:', error)
      this.handleConnectionError(error)
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Connect via WalletConnect
   */
  async connectWalletConnect() {
    try {
      this.isConnecting = true

      // Initialize WalletConnect provider
      const wcProvider = await this.initializeWalletConnect()

      // Connect
      await wcProvider.connect()

      if (!wcProvider.accounts || wcProvider.accounts.length === 0) {
        throw new Error(ERROR_MESSAGES.CONNECTION_REJECTED)
      }

      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(wcProvider)
      this.signer = await this.provider.getSigner()
      this.address = wcProvider.accounts[0]
      this.chainId = wcProvider.chainId

      // Validate chain
      if (!isValidChainId(this.chainId)) {
        await this.switchToMainnet()
      }

      // Set up event listeners for WalletConnect
      wcProvider.on('accountsChanged', this.handleAccountsChanged.bind(this))
      wcProvider.on('chainChanged', this.handleChainChanged.bind(this))
      wcProvider.on('disconnect', this.handleDisconnect.bind(this))

      // Store connection info
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, this.address)

      return {
        address: this.address,
        chainId: this.chainId,
        provider: 'walletconnect'
      }
    } catch (error) {
      console.error('WalletConnect connection failed:', error)
      this.handleConnectionError(error)
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Connect to wallet by provider type
   */
  async connect(providerType = 'metamask') {
    if (this.isConnecting) {
      throw new Error('Connection already in progress')
    }

    switch (providerType) {
      case 'metamask':
        return await this.connectMetaMask()
      case 'walletconnect':
        return await this.connectWalletConnect()
      default:
        throw new Error(`Unsupported provider: ${providerType}`)
    }
  }

  /**
   * Sign message for verification
   */
  async signMessage(message) {
    if (!this.signer || !this.address) {
      throw new Error('Wallet not connected')
    }

    try {
      // Double check wallet is still connected before signing
      if (!this.isConnected()) {
        throw new Error('Wallet connection lost')
      }

      const signature = await this.signer.signMessage(message)
      return signature
    } catch (error) {
      console.error('Signature failed:', error)
      
      if (error.code === 4001) {
        throw new Error(ERROR_MESSAGES.SIGNATURE_REJECTED)
      }
      
      if (error.message && error.message.includes('connection')) {
        throw new Error('Wallet connection lost. Please reconnect and try again.')
      }
      
      throw new Error(ERROR_MESSAGES.SIGNATURE_FAILED)
    }
  }

  /**
   * Generate verification message with timestamp
   */
  generateVerificationMessage() {
    const timestamp = Math.floor(Date.now() / 1000)
    const message = `${SIGNATURE_CONFIG.message}\n\nTimestamp: ${timestamp}\nDomain: ${SIGNATURE_CONFIG.domain}`
    
    return {
      message,
      timestamp
    }
  }

  /**
   * Complete verification flow
   */
  async verifyWallet() {
    if (!this.address) {
      throw new Error('Wallet not connected')
    }

    const { message, timestamp } = this.generateVerificationMessage()
    const signature = await this.signMessage(message)

    return {
      address: this.address,
      signature,
      message,
      timestamp,
      chainId: this.chainId
    }
  }

  /**
   * Switch to Ethereum mainnet
   */
  async switchToMainnet() {
    if (!this.provider) {
      throw new Error('No provider available')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }] // Ethereum mainnet
      })
      
      this.chainId = 1
    } catch (error) {
      console.error('Failed to switch network:', error)
      throw new Error('Please switch to Ethereum mainnet in your wallet')
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address = this.address) {
    if (!this.provider || !address) {
      throw new Error('Provider or address not available')
    }

    try {
      const balance = await this.provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw new Error('Failed to get wallet balance')
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress, walletAddress = this.address) {
    if (!this.provider || !walletAddress) {
      throw new Error('Provider or address not available')
    }

    try {
      const tokenABI = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)'
      ]

      const contract = new ethers.Contract(tokenAddress, tokenABI, this.provider)
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals()
      ])

      return {
        balance: balance.toString(),
        decimals: Number(decimals),
        formatted: ethers.formatUnits(balance, decimals)
      }
    } catch (error) {
      console.error('Failed to get token balance:', error)
      throw new Error('Failed to get token balance')
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    try {
      // Clear connection state
      this.provider = null
      this.signer = null
      this.address = null
      this.chainId = null

      // Clear stored data
      localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS)

      // If WalletConnect, disconnect session
      if (this.provider?.disconnect) {
        await this.provider.disconnect()
      }

      return true
    } catch (error) {
      console.error('Disconnect failed:', error)
      return false
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return !!(this.provider && this.address && this.signer)
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      address: this.address,
      chainId: this.chainId,
      hasProvider: this.isWalletAvailable()
    }
  }

  /**
   * Set up event listeners for wallet events
   */
  setupEventListeners() {
    if (!window.ethereum) return

    window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this))
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))
    window.ethereum.on('disconnect', this.handleDisconnect.bind(this))
  }

  /**
   * Handle accounts changed event
   */
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnect()
    } else if (accounts[0] !== this.address) {
      this.address = accounts[0]
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, this.address)
      
      // Emit custom event for UI to handle
      window.dispatchEvent(new CustomEvent('wallet:accountChanged', {
        detail: { address: this.address }
      }))
    }
  }

  /**
   * Handle chain changed event
   */
  handleChainChanged(chainId) {
    this.chainId = parseInt(chainId, 16)
    
    // Emit custom event for UI to handle
    window.dispatchEvent(new CustomEvent('wallet:chainChanged', {
      detail: { chainId: this.chainId }
    }))
  }

  /**
   * Handle disconnect event
   */
  handleDisconnect() {
    this.disconnect()
    
    // Emit custom event for UI to handle
    window.dispatchEvent(new CustomEvent('wallet:disconnected'))
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    if (error.code === 4001) {
      throw new Error(ERROR_MESSAGES.CONNECTION_REJECTED)
    }
    if (error.code === -32002) {
      throw new Error('Connection request already pending. Please check your wallet.')
    }
    
    throw new Error(error.message || ERROR_MESSAGES.NETWORK_ERROR)
  }
}

// Create singleton instance
const walletService = new WalletService()

export default walletService

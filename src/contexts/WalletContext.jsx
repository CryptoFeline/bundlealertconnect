import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'

export const WalletContext = createContext()

const initialState = {
  provider: null,
  account: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  balance: null,
  signature: null
}

function walletReducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload, error: null }
    case 'SET_CONNECTED':
      return {
        ...state,
        provider: action.payload.provider,
        account: action.payload.account,
        chainId: action.payload.chainId,
        isConnected: true,
        isConnecting: false,
        error: null
      }
    case 'SET_DISCONNECTED':
      return {
        ...initialState
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isConnecting: false }
    case 'SET_BALANCE':
      return { ...state, balance: action.payload }
    case 'SET_SIGNATURE':
      return { ...state, signature: action.payload }
    default:
      return state
  }
}

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState)

  // Force cleanup on mount to clear any stuck sessions
  useEffect(() => {
    const cleanupStuckSessions = async () => {
      try {
        // Check if we have a stuck session from previous load
        const wcProvider = window.__walletConnectProvider
        if (wcProvider) {
          // Test if the session is actually working
          try {
            if (!wcProvider.connected || !wcProvider.accounts?.length) {
              // console.log('Found stuck WalletConnect session, cleaning up...')
              await wcProvider.disconnect()
              delete window.__walletConnectProvider
            }
          } catch (e) {
            // console.log('Cleaning up broken WalletConnect session')
            delete window.__walletConnectProvider
          }
        }

        // Clear any orphaned localStorage/sessionStorage data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('WALLETCONNECT')) {
            try {
              const data = JSON.parse(localStorage.getItem(key))
              // If data looks stale or incomplete, remove it
              if (!data || !data.controller || !data.expiry || data.expiry < Date.now()) {
                localStorage.removeItem(key)
                // console.log(`Removed stale WalletConnect data: ${key}`)
              }
            } catch {
              // Invalid JSON, remove it
              localStorage.removeItem(key)
            }
          }
        })
      } catch (error) {
        // console.log('Error during session cleanup:', error)
      }
    }
    
    cleanupStuckSessions()

    // Cleanup on unmount
    return () => {
      const wcProvider = window.__walletConnectProvider
      if (wcProvider) {
        wcProvider.disconnect().catch(console.error)
        delete window.__walletConnectProvider
      }
    }
  }, [])

  const connectWallet = async (walletType = 'walletconnect') => {
    // Debug log collector for toast display (COMMENTED FOR PRODUCTION)
    // const debugLogs = []
    // const addDebugLog = (message) => {
    //   debugLogs.push(message)
    //   console.log(message)
    //   // Show cumulative debug log in toast positioned on the left
    //   toast.loading(`🔍 DEBUG TRACE:\n${debugLogs.join('\n')}`, { 
    //     id: 'debug-trace', 
    //     duration: 60000,
    //     position: 'top-left',
    //     style: {
    //       maxWidth: '300px',
    //       fontSize: '11px',
    //       lineHeight: '1.2',
    //       whiteSpace: 'pre-wrap',
    //       textAlign: 'left',
    //       overflow: 'auto' 
    //     }
    //   })
    // }

    // Simplified logging for production
    const addDebugLog = (message) => {
      console.log(message)
    }

    try {
      addDebugLog('🔍 [1] connectWallet called with walletType: ' + walletType)
      dispatch({ type: 'SET_CONNECTING', payload: true })

      let provider
      let accounts = []

      if (walletType === 'metamask' && window.ethereum) {
        addDebugLog('🔍 [2] Using MetaMask path')
        provider = new ethers.BrowserProvider(window.ethereum)
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
      } else {
        addDebugLog('🔍 [2] Using WalletConnect path')
        // WalletConnect - Clean up any existing sessions first
        try {
          const existingProvider = window.__walletConnectProvider
          if (existingProvider) {
            addDebugLog('🔍 [3] Cleaning up existing provider')
            try {
              await existingProvider.disconnect()
            } catch (e) {
              addDebugLog('🔍 [3] Error disconnecting existing provider: ' + e.message)
            }
            delete window.__walletConnectProvider
          } else {
            addDebugLog('🔍 [3] No existing provider to clean up')
          }
          
          // Also clean up any WalletConnect localStorage data to prevent conflicts
          addDebugLog('🔍 [3a] Cleaning up WalletConnect storage...')
          Object.keys(localStorage).forEach(key => {
            if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('WALLETCONNECT')) {
              localStorage.removeItem(key)
            }
          })
          
          // Also clear sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('WALLETCONNECT')) {
              sessionStorage.removeItem(key)
            }
          })
          
          addDebugLog('🔍 [3a] ✅ Storage cleanup completed')
          
        } catch (e) {
          addDebugLog('🔍 [3] Error cleaning up: ' + e.message)
        }

        // Check if Project ID is configured
        addDebugLog('🔍 [4] Checking Project ID...')
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
        addDebugLog('🔍 [4] Project ID value: ' + (projectId ? projectId.slice(0, 10) + '...' : 'MISSING'))
        if (!projectId || projectId === 'your_walletconnect_project_id' || projectId === 'your_walletconnect_project_id_here') {
          throw new Error('WalletConnect Project ID not configured. Please check your environment variables.')
        }

        addDebugLog('🔍 [5] Initializing WalletConnect with Project ID')
        addDebugLog('🔍 [6] About to call EthereumProvider.init()...')

        // Add timeout to WalletConnect initialization
        const initPromise = EthereumProvider.init({
          projectId: projectId,
          chains: [1], // Ethereum mainnet
          showQrModal: true,
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction', 
            'eth_sign',
            'personal_sign',
            'eth_signTypedData'
          ],
          events: [
            'chainChanged',
            'accountsChanged'
          ],
          qrModalOptions: {
            themeMode: 'light',
            themeVariables: {
              '--wcm-font-family': 'Inter, sans-serif',
              '--wcm-accent-color': '#007aff',
              '--wcm-accent-fill-color': '#ffffff',
              '--wcm-background-color': '#ffffff',
              '--wcm-background-border-radius': '16px'
            },
            // Keep modal open after initial connection to reduce back-and-forth
            mobileWalletSelection: false,
            // Improved mobile experience - less redirects
            enableNetworkView: false,
            enableAccountView: false,
            enableExplorer: false
          },
          metadata: {
            name: 'BundleAlert Wallet Verification',
            description: 'Verify your wallet for BundleAlert subscription',
            url: window.location.origin,
            icons: [window.location.origin + '/favicon.ico']
          }
        })

        addDebugLog('🔍 [6a] WalletConnect config: chains=[1], methods=[eth_sendTransaction,personal_sign,etc]')
        addDebugLog('🔍 [6b] Metadata: name=BundleAlert, url=' + window.location.origin)

        addDebugLog('🔍 [7] EthereumProvider.init() promise created, setting up 20s timeout...')

        let initTimeoutId
        const initTimeoutPromise = new Promise((_, reject) => {
          initTimeoutId = setTimeout(() => {
            addDebugLog('🔍 [8] ❌ Initialization timeout triggered after 20 seconds')
            reject(new Error('WalletConnect initialization timeout (20 seconds)'))
          }, 20000)
        })

        addDebugLog('🔍 [8] About to race initialization vs timeout...')
        const wcProvider = await Promise.race([initPromise, initTimeoutPromise])
        
        // Clear timeout if initialization succeeded
        if (initTimeoutId) {
          clearTimeout(initTimeoutId)
          addDebugLog('🔍 [9] ✅ Initialization timeout cleared (connection succeeded)')
        }

        addDebugLog('🔍 [9] ✅ EthereumProvider.init() completed successfully!')

        // Store reference for cleanup
        addDebugLog('🔍 [10] Storing provider reference and setting up event listeners...')
        window.__walletConnectProvider = wcProvider

        // Check for inconsistent provider state and reset if needed
        addDebugLog('🔍 [10a] Checking provider state consistency...')
        if (wcProvider.connected && (!wcProvider.accounts || wcProvider.accounts.length === 0) && !wcProvider.session) {
          addDebugLog('🔍 [10a] ⚠️ Detected inconsistent state: connected=true but no accounts/session')
          addDebugLog('🔍 [10a] 🔧 Resetting provider state...')
          try {
            await wcProvider.disconnect()
            addDebugLog('🔍 [10a] ✅ Provider disconnected and reset')
          } catch (resetError) {
            addDebugLog('🔍 [10a] ⚠️ Reset error (continuing anyway): ' + resetError.message)
          }
        } else {
          addDebugLog('🔍 [10a] ✅ Provider state is consistent')
        }

        // Add event listeners for better error handling
        wcProvider.on('connect', () => {
          addDebugLog('🔍 [11] WalletConnect: Connected event fired')
        })

        wcProvider.on('disconnect', () => {
          addDebugLog('🔍 [11] WalletConnect: Disconnected event fired')
          // Clean up immediately on disconnect
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
        })

        wcProvider.on('session_delete', () => {
          addDebugLog('🔍 [11] WalletConnect: Session deleted event fired')
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
        })

        wcProvider.on('session_expire', () => {
          addDebugLog('🔍 [11] WalletConnect: Session expired event fired')
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
        })

        wcProvider.on('session_reject', (error) => {
          addDebugLog('🔍 [11] WalletConnect: Session rejected: ' + JSON.stringify(error))
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
        })

        wcProvider.on('chainChanged', (chainId) => {
          addDebugLog('🔍 [11] WalletConnect: Chain changed to ' + chainId)
        })

        wcProvider.on('accountsChanged', (accounts) => {
          addDebugLog('🔍 [11] WalletConnect: Accounts changed ' + accounts.length + ' accounts')
          // Only disconnect if accounts length is actually 0, not just on any change
          if (accounts.length === 0) {
            addDebugLog('🔍 [11] WalletConnect: No accounts found, disconnecting...')
            // Wallet disconnected
            delete window.__walletConnectProvider
            dispatch({ type: 'SET_DISCONNECTED' })
          }
        })

        // Add error handler
        wcProvider.on('display_uri', (uri) => {
          addDebugLog('🔍 [11] WalletConnect: QR URI generated')
        })

        // Additional debug events
        wcProvider.on('modal_close', () => {
          addDebugLog('🔍 [11] WalletConnect: Modal closed by user')
        })

        wcProvider.on('session_proposal', (proposal) => {
          addDebugLog('🔍 [11] WalletConnect: Session proposal sent: ' + JSON.stringify({
            chains: proposal.params?.requiredNamespaces?.eip155?.chains,
            methods: proposal.params?.requiredNamespaces?.eip155?.methods
          }))
        })

        // Connect with timeout and better error handling
        addDebugLog('🔍 [12] Event listeners set up, attempting WalletConnect connection...')
        
        try {
          addDebugLog('🔍 [13] About to call wcProvider.enable()...')
          addDebugLog('🔍 [13a] WalletConnect provider state before enable:')
          addDebugLog('🔍 [13a] - connected: ' + wcProvider.connected)
          addDebugLog('🔍 [13a] - accounts: ' + (wcProvider.accounts ? wcProvider.accounts.length : 'undefined'))
          addDebugLog('🔍 [13a] - session: ' + (wcProvider.session ? 'exists' : 'none'))
          
          // Add a 30-second timeout specifically for the enable() call
          let enableTimeoutId
          const enablePromise = wcProvider.enable()
          const timeoutPromise = new Promise((_, reject) => {
            enableTimeoutId = setTimeout(() => {
              addDebugLog('🔍 [14] ❌ Enable timeout triggered after 30 seconds')
              reject(new Error('WalletConnect enable timeout (30 seconds)'))
            }, 30000)
          })
          
          addDebugLog('🔍 [14] Racing enable vs 30s timeout...')
          const enableResult = await Promise.race([enablePromise, timeoutPromise])
          addDebugLog('🔍 [14a] Enable result: ' + JSON.stringify(enableResult))
          
          // Clear timeout if enable succeeded
          if (enableTimeoutId) {
            clearTimeout(enableTimeoutId)
            addDebugLog('🔍 [15] ✅ Enable timeout cleared (connection succeeded)')
          }
          
          addDebugLog('🔍 [15] ✅ wcProvider.enable() completed successfully!')
          
          // Verify the connection worked
          if (!wcProvider.connected || !wcProvider.accounts?.length) {
            throw new Error('WalletConnect connection failed - no accounts found')
          }
          
          addDebugLog('🔍 [16] ✅ WalletConnect enabled, accounts: ' + wcProvider.accounts.length)
          
        } catch (enableError) {
          addDebugLog('🔍 [15] ❌ WalletConnect enable error: ' + enableError.message)
          addDebugLog('🔍 [15a] Full error details: ' + JSON.stringify({
            message: enableError.message,
            code: enableError.code,
            method: enableError.method,
            stack: enableError.stack?.split('\n')[0] // Just first line of stack
          }))
          addDebugLog('🔍 [15b] Provider state after error:')
          addDebugLog('🔍 [15b] - connected: ' + wcProvider.connected)
          addDebugLog('🔍 [15b] - accounts: ' + (wcProvider.accounts ? wcProvider.accounts.length : 'undefined'))
          
          // console.error('WalletConnect enable error:', enableError)
          
          // Clean up failed connection
          try {
            if (wcProvider.connected) {
              addDebugLog('🔍 [15c] Attempting to disconnect failed provider...')
              await wcProvider.disconnect()
              addDebugLog('🔍 [15c] ✅ Provider disconnected')
            }
          } catch (cleanupError) {
            addDebugLog('🔍 [15c] Error cleaning up failed connection: ' + cleanupError.message)
          }
          delete window.__walletConnectProvider
          
          // Re-throw with better error message
          if (enableError.message?.includes('User rejected')) {
            // If user rejected, suggest a fresh start by clearing everything
            addDebugLog('🔍 [15d] User rejection detected, performing full cleanup for next attempt...')
            Object.keys(localStorage).forEach(key => {
              if (key.includes('walletconnect') || key.includes('wc@2') || key.includes('WALLETCONNECT')) {
                localStorage.removeItem(key)
                addDebugLog('🔍 [15d] Cleared: ' + key)
              }
            })
            throw new Error('Connection was declined in your wallet app. Please try again and approve the connection request.')
          } else if (enableError.message?.includes('WalletConnect enable timeout')) {
            throw new Error('WalletConnect connection timed out - this may happen in Telegram miniapps. Please try again or use a different browser.')
          } else if (enableError.message?.includes('timeout')) {
            throw new Error('Connection timeout - please try again')
          } else {
            throw new Error('Failed to connect to wallet: ' + enableError.message + ' - please try again')
          }
        }

        addDebugLog('🔍 [17] Setting up ethers provider from wcProvider...')
        provider = new ethers.BrowserProvider(wcProvider)
        accounts = wcProvider.accounts
      }

      addDebugLog('🔍 [18] Checking accounts length: ' + accounts.length)
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      addDebugLog('🔍 [19] Getting signer and account info...')
      const signer = await provider.getSigner()
      const account = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      addDebugLog('🔍 [20] Getting balance...')
      // Get balance with timeout to prevent hanging
      let balanceInEth = '0.0'
      try {
        addDebugLog('🔍 [20a] Creating balance promise with 10s timeout...')
        const balancePromise = provider.getBalance(account)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Balance timeout')), 10000)
        )
        
        const balance = await Promise.race([balancePromise, timeoutPromise])
        balanceInEth = ethers.formatEther(balance)
        addDebugLog('🔍 [20b] ✅ Balance retrieved: ' + balanceInEth)
      } catch (balanceError) {
        addDebugLog('🔍 [20b] ⚠️ Balance retrieval failed: ' + balanceError.message + ' - continuing anyway')
        // Don't fail the whole connection for balance issues
        balanceInEth = '0.0'
      }

      addDebugLog('🔍 [21] Dispatching connected state...')
      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          provider,
          account,
          chainId
        }
      })

      dispatch({ type: 'SET_BALANCE', payload: balanceInEth })

      addDebugLog('🔍 [22] ✅ Connection completed successfully!')
      toast.success('Wallet connected successfully!')
      
      // Dismiss debug trace and show final success (COMMENTED FOR PRODUCTION)
      // toast.dismiss('debug-trace')
      // toast.success(`🔍 FINAL TRACE:\n${debugLogs.join('\n')}\n\n✅ CONNECTION SUCCESS!`, { 
      //   duration: 8000,
      //   position: 'top-left',
      //   style: {
      //     maxWidth: '300px',
      //     fontSize: '11px',
      //     lineHeight: '1.2',
      //     whiteSpace: 'pre-wrap',
      //     textAlign: 'left',
      //     overflow: 'auto' 
      //   }
      // })
      
      return { provider, account, chainId, balance: balanceInEth }

    } catch (error) {
      // Add error to debug log (COMMENTED FOR PRODUCTION)
      // debugLogs.push('🔍 [❌] ERROR: ' + error.message)
      
      // console.error('🔍 [WalletContext] Error in connectWallet:')
      // console.error('🔍 [WalletContext] Error message:', error.message)
      // console.error('🔍 [WalletContext] Error stack:', error.stack)
      // console.error('🔍 [WalletContext] Full error object:', error)
      
      // Show final debug trace with error (COMMENTED FOR PRODUCTION)
      // toast.dismiss('debug-trace')
      // toast.error(`🔍 ERROR TRACE:\n${debugLogs.join('\n')}\n\n❌ FAILED AT STEP: ${debugLogs.length}`, { 
      //   duration: 15000,
      //   position: 'top-left',
      //   style: {
      //     maxWidth: '300px',
      //     fontSize: '11px',
      //     lineHeight: '1.2',
      //     whiteSpace: 'pre-wrap',
      //     textAlign: 'left',
      //     overflow: 'auto'
      //   }
      // })
      
      // Clean up on error
      const wcProvider = window.__walletConnectProvider
      if (wcProvider && (error.message?.includes('timeout') || error.message?.includes('Connection'))) {
        try {
          await wcProvider.disconnect()
        } catch (e) {
          console.log('Error cleaning up failed connection:', e)
        }
        delete window.__walletConnectProvider
      }

      const errorMessage = getWalletErrorMessage(error)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  const signMessage = async (message, options = {}) => {
    try {
      // console.log('🔍 [SignMessage] Starting signature process...')
      
      // Use provided provider/account or fall back to state
      const provider = options.provider || state.provider
      const account = options.account || state.account

      // console.log('🔍 [SignMessage] provider source:', options.provider ? 'PROVIDED' : 'STATE')
      // console.log('🔍 [SignMessage] account source:', options.account ? 'PROVIDED' : 'STATE')
      // console.log('🔍 [SignMessage] provider exists:', !!provider)
      // console.log('🔍 [SignMessage] account value:', account)

      if (!provider || !account) {
        // console.error('❌ [SignMessage] Basic validation failed - provider or account missing')
        // console.error('❌ [SignMessage] provider:', !!provider, 'account:', account)
        // console.error('❌ [SignMessage] state.provider:', !!state.provider, 'state.account:', state.account)
        throw new Error('Wallet not connected')
      }

      // Check if WalletConnect session is still active
      const wcProvider = window.__walletConnectProvider
      // console.log('🔍 [SignMessage] wcProvider exists:', !!wcProvider)
      
      if (wcProvider) {
        // console.log('🔍 [SignMessage] wcProvider.connected:', wcProvider.connected)
        // console.log('🔍 [SignMessage] wcProvider.accounts:', wcProvider.accounts)
        
        // Verify the session is actually working
        if (!wcProvider.connected || !wcProvider.accounts?.length) {
          // console.log('❌ [SignMessage] WalletConnect session is not active, cleaning up...')
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
          throw new Error('Wallet connection lost - please reconnect')
        }
        
        // Double-check by trying to get accounts
        try {
          // console.log('🔍 [SignMessage] Testing account access with eth_accounts...')
          const currentAccounts = await wcProvider.request({ method: 'eth_accounts' })
          // console.log('🔍 [SignMessage] eth_accounts returned:', currentAccounts)
          if (!currentAccounts || currentAccounts.length === 0) {
            throw new Error('No accounts available')
          }
        } catch (accountError) {
          // console.log('❌ [SignMessage] Failed to get accounts, session may be invalid:', accountError)
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
          throw new Error('Wallet connection lost during process - please reconnect')
        }
      }

      // console.log('🔍 [SignMessage] Session validation passed, requesting signature...')
      // console.log('Requesting signature for message:', message)
      
      // Use WalletConnect provider directly to avoid ethers.js timeout issues
      // This addresses the known WalletConnect v2 timeout bug described in the issue analysis
      // console.log('🔍 [SignMessage] Using WalletConnect provider directly for signature...')
      
      let signature
      if (wcProvider) {
        // Prepare message as hex and use lowercased address (some wallets expect this format)
        const messageHex = ethers.hexlify(ethers.toUtf8Bytes(message))
        const fromAddr = account.toLowerCase()
        
        // console.log('🔍 [SignMessage] Prepared hex message:', messageHex)
        // console.log('🔍 [SignMessage] Using account:', fromAddr)
        
        // Send WalletConnect RPC request directly to avoid ethers.js integration issues
        signature = await wcProvider.request({
          method: 'personal_sign',
          params: [messageHex, fromAddr]  // [data, signerAddress]
        })
        
        // console.log('✅ [SignMessage] Direct WalletConnect signature obtained successfully')
      } else {
        // Fallback to ethers.js for non-WalletConnect providers (e.g., MetaMask browser extension)
        // console.log('🔍 [SignMessage] Fallback to ethers.js signer for non-WalletConnect provider...')
        const signer = await provider.getSigner()
        signature = await signer.signMessage(message)
        // console.log('✅ [SignMessage] Ethers.js signature obtained successfully')
      }
      
      // console.log('✅ [SignMessage] Signature obtained successfully')
      dispatch({ type: 'SET_SIGNATURE', payload: signature })
      return signature

    } catch (error) {
      // console.error('❌ [SignMessage] Sign message error:', error)
      
      // If connection was lost, try to clean up gracefully
      if (error.message?.includes('connection') || 
          error.message?.includes('disconnect') ||
          error.message?.includes('connect() before request') ||
          error.code === 4001) {
        
        const wcProvider = window.__walletConnectProvider
        if (wcProvider && !wcProvider.connected) {
          delete window.__walletConnectProvider
          dispatch({ type: 'SET_DISCONNECTED' })
        }
      }

      const errorMessage = getWalletErrorMessage(error)
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      toast.error(errorMessage)
      throw error
    }
  }

  const disconnect = async () => {
    try {
      // Clean up WalletConnect provider if it exists
      const wcProvider = window.__walletConnectProvider
      if (wcProvider) {
        await wcProvider.disconnect()
        delete window.__walletConnectProvider
      }

      // Clean up regular provider
      if (state.provider && state.provider.disconnect) {
        await state.provider.disconnect()
      }

      dispatch({ type: 'SET_DISCONNECTED' })
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      // Force cleanup even if disconnect fails
      delete window.__walletConnectProvider
      dispatch({ type: 'SET_DISCONNECTED' })
    }
  }

  const forceCleanup = async () => {
    try {
      // Force cleanup of any stuck WalletConnect sessions
      delete window.__walletConnectProvider
      
      // Reset state to initial
      dispatch({ type: 'SET_DISCONNECTED' })
      
      // Clear any WalletConnect localStorage data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('wc@2')) {
          localStorage.removeItem(key)
        }
      })

      // Also clear any sessionStorage data
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('walletconnect') || key.includes('wc@2')) {
          sessionStorage.removeItem(key)
        }
      })

      // console.log('Force cleanup completed - all WalletConnect data cleared')
      // Don't show toast here since user is already redirected back to welcome screen
      
      return true
    } catch (error) {
      console.error('Error during force cleanup:', error)
      return false
    }
  }

  const checkConnection = async () => {
    try {
      const wcProvider = window.__walletConnectProvider
      if (wcProvider && wcProvider.connected && wcProvider.accounts?.length > 0) {
        // Session exists and is connected, try to restore state
        const provider = new ethers.BrowserProvider(wcProvider)
        const signer = await provider.getSigner()
        const account = await signer.getAddress()
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            provider,
            account,
            chainId
          }
        })

        return { account, chainId, restored: true }
      }
      return null
    } catch (error) {
      // console.log('Could not restore WalletConnect session:', error)
      return null
    }
  }

  const getBalance = async (address) => {
    try {
      if (!state.provider) return null
      
      const balance = await state.provider.getBalance(address || state.account)
      const balanceInEth = ethers.formatEther(balance)
      
      dispatch({ type: 'SET_BALANCE', payload: balanceInEth })
      return balanceInEth
    } catch (error) {
      console.error('Error getting balance:', error)
      return null
    }
  }

  const value = {
    ...state,
    connectWallet,
    disconnect,
    signMessage,
    getBalance,
    forceCleanup,
    checkConnection
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

function getWalletErrorMessage(error) {
  if (error.code === 4001) {
    return 'Connection rejected by user'
  }
  if (error.code === -32002) {
    return 'Connection request pending. Please check your wallet.'
  }
  if (error.code === -32603) {
    return 'Internal wallet error. Please try again.'
  }
  if (error.message?.includes('User rejected')) {
    return 'Connection rejected by user'
  }
  if (error.message?.includes('Already processing')) {
    return 'Connection already in progress'
  }
  if (error.message?.includes('WalletConnect initialization timeout')) {
    return 'WalletConnect initialization timed out - this may happen in Telegram miniapps. Please try again or use a different browser.'
  }
  if (error.message?.includes('WalletConnect enable timeout')) {
    return 'WalletConnect connection timed out - this may happen in Telegram miniapps. Please try again or use a different browser.'
  }
  if (error.message?.includes('Signature request timed out')) {
    return 'Signature request timed out. This can happen in Telegram miniapps when switching between apps. Please try again.'
  }
  if (error.message?.includes('Request expired')) {
    return 'Signature request expired. Please try again - this can happen in Telegram miniapps when the wallet takes too long to respond.'
  }
  if (error.message?.includes('User rejected the request') || error.message?.includes('User denied')) {
    return 'Signature rejected by user'
  }
  if (error.message?.includes('timeout')) {
    return 'Connection timeout - please try again'
  }
  if (error.message?.includes('connect() before request')) {
    return 'Wallet session expired - please reconnect'
  }
  if (error.message?.includes('connection') || error.message?.includes('disconnect')) {
    return 'Wallet connection lost during process'
  }
  if (error.message?.includes('session')) {
    return 'Session expired - please reconnect'
  }
  if (error.message?.includes('Project ID not configured')) {
    return 'WalletConnect not properly configured - contact support'
  }
  return error.message || 'Failed to connect wallet'
}

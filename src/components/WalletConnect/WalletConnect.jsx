import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useWallet } from '../../hooks/useWallet'
import { useTelegram } from '../../hooks/useTelegram'
import { verifyWallet } from '../../services/botApi'

import Card from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'

const VERIFICATION_MESSAGE = 'Sign this message to verify your wallet ownership for BundleAlert Bot. This is a read-only verification and will not grant any spending permissions.'

export default function WalletConnect({ 
  onConnectionStart, 
  onVerificationStart, 
  onSuccess, 
  onError 
}) {
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isTelegramReady, setIsTelegramReady] = useState(false)
  const { connectWallet, signMessage, account, disconnect } = useWallet()
  const { hapticFeedback, tg, isReady } = useTelegram()

  // Check if we're in Telegram miniapp context
  const isTelegramMiniApp = tg && tg.platform

  // Wait for Telegram WebApp to be ready before allowing wallet operations
  React.useEffect(() => {
    if (isTelegramMiniApp) {
      // If we're in Telegram, wait for it to be ready
      const nativeReady = window.Telegram?.WebApp?.isReady || false
      // console.log('🔍 [WalletConnect] Telegram readiness check:', {
      //   contextReady: isReady,
      //   nativeReady: nativeReady,
      //   both: isReady && nativeReady
      // })

      if (isReady) {
        // console.log('✅ Telegram WebApp is ready!')
        // toast.success(`🔍 DEBUG: Telegram ready! (Context: ${isReady}, Native: ${nativeReady})`, { duration: 3000 })
        setIsTelegramReady(true)
      } else {
        // console.log('⏳ Waiting for Telegram WebApp to be ready...')
        // toast.loading('🔍 DEBUG: Waiting for Telegram WebApp...', { id: 'tg-wait', duration: 3000 })
        setIsTelegramReady(false)
      }
    } else {
      // If not in Telegram, proceed immediately
      setIsTelegramReady(true)
    }
  }, [isReady, isTelegramMiniApp])

  const walletOptions = [
    {
      id: 'walletconnect',
      name: 'Reown',
      description: 'Connect with wallets like MetaMask, Trust Wallet, Rainbow',
      icon: '/WalletConnect.svg',
      popular: true,
      available: true
    }
  ]

  // Only show MetaMask if we're not in Telegram miniapp (i.e., opened in browser)
  if (!isTelegramMiniApp && typeof window !== 'undefined' && window.ethereum) {
    walletOptions.push({
      id: 'metamask',
      name: 'MetaMask',
      description: 'Browser extension wallet only!',
      icon: '/MetaMask.svg',
      available: false,
      disabled: true,
      popular: false
    })
  }

  const handleConnectWallet = async (walletType) => {
    try {
      // First check if Telegram WebApp is ready (if we're in Telegram)
      if (isTelegramMiniApp && !isTelegramReady) {
        toast.error('❌ Telegram not ready yet - please try again!', { duration: 5000 })
        // console.error('❌ Telegram WebApp not ready, aborting wallet connection')
        return
      }

      // console.log('✅ Starting wallet connection - Telegram ready:', isTelegramReady)
      // toast.success('🔍 DEBUG: Starting wallet connection (Telegram ready)', { duration: 2000 })

      hapticFeedback('light')
      setIsConnecting(true)
      setSelectedWallet(walletType)
      onConnectionStart()

      // Show enhanced instruction for continuous flow
      if (isTelegramMiniApp) {
        toast.loading(
          'You\'ll be redirected to your wallet app to Approve and Sign verification!', 
          { 
            id: 'wallet-instructions',
            duration: 5000,
            position: 'top-center',
            style: {
              background: 'white',
              color: 'black',
              borderColor: '#0066cc',
              borderWidth: '1px',
              fontWeight: 'bold',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              fontSize: '14px',
              padding: '16px'
            }
          }
        )
      }

      // Connect wallet and wait for connection to complete with timeout
      // console.log('🔍 [Debug] About to call connectWallet...')
      // toast.loading('🔍 DEBUG: Calling connectWallet function...', { id: 'debug-connect', duration: 2000 })
      
      // Add timeout to prevent hanging indefinitely
      // console.log('🔍 [WalletConnect] Setting up 45s outer timeout...')
      
      let outerTimeoutId
      const connectionPromise = connectWallet(walletType)
      const timeoutPromise = new Promise((_, reject) => {
        outerTimeoutId = setTimeout(() => {
          // console.log('❌ [WalletConnect] 45s outer timeout triggered')
          reject(new Error('Wallet connection timeout (45 seconds)'))
        }, 45000)
      })
      
      // console.log('🔍 [WalletConnect] Waiting for connectWallet to complete...')
      const connectionResult = await Promise.race([connectionPromise, timeoutPromise])
      
      // Clear the outer timeout since connection completed
      if (outerTimeoutId) {
        clearTimeout(outerTimeoutId)
        // console.log('✅ [WalletConnect] Outer timeout cleared - connection completed')
      }
      
      // console.log('🔍 [Debug] connectWallet returned:', connectionResult)
      // toast.success(`✅ DEBUG: connectWallet returned: ${connectionResult ? 'SUCCESS' : 'NULL'}`, { id: 'debug-connect', duration: 2000 })
      
      if (!connectionResult?.account) {
        // console.error('❌ [Debug] connectionResult is missing account:', connectionResult)
        // toast.error('❌ DEBUG: connectionResult missing account', { duration: 5000 })
        throw new Error('Failed to connect wallet')
      }
      
      // Dismiss instructions and show connection success
      toast.dismiss('wallet-instructions')
      toast.success('✅ Connected! Requesting signature...', { duration: 3000 })
      
      // Start verification process immediately to maintain wallet session
      onVerificationStart()
      setIsVerifying(true)
      
      // Verify connection is still active before continuing
      const wcProvider = window.__walletConnectProvider
      if (wcProvider && (!wcProvider.connected || !wcProvider.accounts?.length)) {
        // console.error('❌ [Debug] WalletConnect session lost after connection')
        throw new Error('WalletConnect session expired immediately after connection')
      }
      
      // Double-check connection before signing
      if (!connectionResult?.account) {
        throw new Error('Wallet connection lost during process')  
      }
            
      // Use connectionResult data consistently since context state might not be updated yet
      const walletAddress = connectionResult.account
      const walletProvider = connectionResult.provider
      
      // console.log('Starting signature process for account:', walletAddress)
      // console.log('🔍 [Debug] About to request signature...')
      // console.log('🔍 [Debug] Message to sign:', VERIFICATION_MESSAGE)
      // console.log('🔍 [Debug] Using provider from connectionResult:', !!walletProvider)
      
      // Show debug info in toast
      // toast.loading('🔍 DEBUG: Starting signature process...', { id: 'debug-sig', duration: 2000 })
      
      // Dismiss auth toast and show signature request
      toast.dismiss('auth')
      
      // Enhanced signature instructions for continuous flow
      if (isTelegramMiniApp) {
        toast.loading(
          'Sign the read-only verification message in your wallet!', 
          { 
            id: 'signature-instructions',
            duration: 6000,
            position: 'top-center',
            style: {
              background: 'white',
              color: 'black',
              borderColor: '#ff6b35',
              borderWidth: '1px',
              fontWeight: 'bold',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              fontSize: '14px',
              padding: '16px'
            }
          }
        )
      } else {
        toast.loading('Please sign the message in your wallet...', { id: 'signature' })
      }
      
      // Show timeout warning for Telegram users - not needed
      // if (isTelegramMiniApp) {
      //  toast.loading('⏰ Signature expires in 45 seconds - switch to your wallet app quickly!', { 
      //    id: 'signature-timeout', 
      //    duration: 8000,
      //    position: 'top-center',
      //    style: {
      //      background: '#f59e0b',
      //      color: 'white',
      //      fontWeight: 'bold'
      //    }
      //  })
      // }
      
      // Sign verification message using the fresh connection data
      // console.log('🔍 [Debug] Calling signMessage function...')
      // toast.loading('🔍 DEBUG: Calling signMessage...', { id: 'debug-call', duration: 1500 })
      
      const signature = await signMessage(VERIFICATION_MESSAGE, {
        provider: walletProvider,
        account: walletAddress
      })
      // console.log('🔍 [Debug] signMessage returned:', signature ? 'SUCCESS' : 'FAILED')
      
      // Show signature result in toast
      // if (signature) {
        // toast.success(`✅ DEBUG: Signature obtained (${signature.length} chars)`, { id: 'debug-call', duration: 2000 })
      // } else {
        // toast.error('❌ DEBUG: signMessage returned null/undefined', { id: 'debug-call', duration: 3000 })
      // }
      
      if (!signature) {
        // console.error('❌ [Debug] signMessage returned null/undefined')
        throw new Error('Failed to get signature from wallet')
      }
      
      // console.log('✅ [Debug] Signature obtained, length:', signature.length)
      // console.log('Signature obtained, verifying with backend...')
      
      // Dismiss signature toast and show verification
      toast.dismiss('signature')
      toast.dismiss('signature-instructions')
      toast.loading('Verifying with server...') // , { id: 'verification' })
      
      // console.log('🔍 [Debug] About to call verifyWallet with:', {
      //   walletAddress: walletAddress,
      //   signature: signature ? signature.slice(0, 10) + '...' : 'NULL',
      //   message: VERIFICATION_MESSAGE.slice(0, 50) + '...'
      // })
      
      // Show debug info in toast
      // toast.loading('🔍 DEBUG: Calling server verification API...', { id: 'debug-verify', duration: 2000 })
      
      // Verify with backend
      const result = await verifyWallet({
        walletAddress: walletAddress,
        signature: signature,
        message: VERIFICATION_MESSAGE
      })

      // console.log('✅ [Debug] verifyWallet returned successfully:', result)
      // console.log('Verification successful:', result)
      
      // Show success in toast
      // toast.success('✅ DEBUG: Server verification successful!', { id: 'debug-verify', duration: 2000 })
      toast.success('🎉 Verification complete!') // You can now return to Telegram.', { id: 'verification', duration: 5000 })
      hapticFeedback('success')
      onSuccess(result)
      
    } catch (error) {
      // console.error('❌ [Debug] Caught error in handleConnectWallet:')
      // console.error('❌ [Debug] Error message:', error.message)
      // console.error('❌ [Debug] Error type:', error.constructor.name)
      // console.error('❌ [Debug] Full error object:', error)
      console.error('Wallet connection error!') // , error)
      
      // Show detailed error in toasts for debugging
      // toast.error(`❌ DEBUG ERROR: ${error.constructor.name}`, { duration: 5000 })
      // toast.error(`❌ DEBUG MSG: ${error.message}`, { duration: 8000 })
      
      // If it's a network error, show more details
      // if (error.response) {
        // toast.error(`❌ DEBUG: Server ${error.response.status} - ${error.response.data?.error || 'Unknown'}`, { duration: 8000 })
      // } else if (error.request) {
        // toast.error('❌ DEBUG: Network request failed - check connection', { duration: 8000 })
      // } else if (error.message?.includes('User rejected')) {
        // toast.error('❌ DEBUG: User rejected the wallet request', { duration: 5000 })
      // }
      
      // Dismiss all loading toasts
      toast.dismiss('auth')
      toast.dismiss('signature')
      toast.dismiss('verification')
      
      hapticFeedback('error')
      
      // Enhanced error handling for specific issues
      let errorMessage = error.message || 'Failed to connect or verify wallet'
      
      // API-specific errors
      if (error.message?.includes('No token provided')) {
        errorMessage = 'Authentication failed - please try again'
        toast.error('🔐 Authentication failed - server error', { duration: 4000 })
      } else if (error.message?.includes('Bot token not configured')) {
        errorMessage = 'Server configuration issue - please contact support'
        toast.error('⚠️ Server error', { duration: 5000 })
      } else if (error.message?.includes('Authentication required but failed')) {
        errorMessage = 'Authentication failed - please try again'
        toast.error('🔑 Telegram authentication failed', { duration: 4000 })
      } else if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        errorMessage = 'Network connection failed - please check your connection and try again'
        toast.error('🌐 Network connection failed', { duration: 4000 })
      } else if (error.message?.includes('Project ID not configured')) {
        errorMessage = 'WalletConnect configuration issue - please contact support'
        toast.error('⚙️ WalletConnect configuration error', { duration: 4000 })
      } else if (error.message?.includes('connect() before request')) {
        errorMessage = 'Session expired during verification - please try again'
        toast.error('⏰ Session expired during verification', { duration: 4000 })
      } else if (error.message?.includes('User rejected')) {
        errorMessage = 'Connection or signature was rejected'
        toast.error('❌ User rejected request', { duration: 3000 })
      } else {
        // Show the actual error message in a toast for debugging
        toast.error(`❌ Error!`, { duration: 5000 })
        // toast.error(`❌ Error: ${error.message?.slice(0, 50)}...`, { duration: 5000 })
      }
      
      onError(errorMessage)
    } finally {
      setIsConnecting(false)
      setIsVerifying(false)
      setSelectedWallet(null)
    }
  }

  if (account && (isConnecting || isVerifying)) {
    return (
      <Card className="p-6 text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isConnecting ? 'Connecting Wallet...' : 'Verifying Wallet...'}
        </h3>
        <p className="text-gray-600 text-sm">
          {isConnecting 
            ? 'Please check your wallet and approve the connection'
            : 'Please sign the verification message in your wallet'
          }
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose your wallet
        </h3>
        <p className="text-sm text-gray-600">
          Select a wallet to connect and verify your holdings
        </p>
      </div>

      <div className="space-y-3">
        {/* Show Telegram readiness warning if needed */}
        {isTelegramMiniApp && !isTelegramReady && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⏳ Initializing...
            </p>
          </div>
        )}
        
        {walletOptions.map((wallet) => {
          const isDisabled = isConnecting || wallet.disabled || (isTelegramMiniApp && !isTelegramReady)
          
          return (
            <motion.button
              key={wallet.id}
              onClick={() => !isDisabled && handleConnectWallet(wallet.id)}
              disabled={isDisabled}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isDisabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }`}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
            >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center ${
                wallet.id === 'walletconnect' ? 'bg-blue-500' : 'bg-white'
              }`}>
                <img 
                  src={wallet.icon} 
                  alt={`${wallet.name} logo`}
                  className="w-6 h-6"
                />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 flex items-center">
                  {wallet.name}
                  {wallet.popular && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      WalletConnect
                    </span>
                  )}
                  {wallet.disabled && (
                    <span className="text-xs text-gray-500 ml-2">(Not Available)</span>
                  )}
                  {/* {isTelegramMiniApp && !isTelegramReady && (
                    <span className="text-xs text-gray-500 ml-2">(Waiting for Telegram...)</span>
                  )} */}
                </div>
                <div className="text-sm text-gray-600">
                  {wallet.description}
                </div>
              </div>
              {isConnecting && selectedWallet === wallet.id && (
                <LoadingSpinner size="sm" />
              )}
            </div>
          </motion.button>
          )
        })}
      </div>

    </Card>
  )
}

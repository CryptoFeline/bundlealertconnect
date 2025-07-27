import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../../hooks/useWallet'
import { useTelegram } from '../../hooks/useTelegram'
import { STORAGE_KEYS } from '../../utils/constants'
import Button from '../ui/Button'
import Card from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function VerificationStatus({ step, onSuccess, onError, onRetry, onReturnToBot, errorMessage }) {
  const { account, balance, disconnect, forceCleanup, checkConnection } = useWallet()
  const [isClearing, setIsClearing] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const { hapticFeedback } = useTelegram()

  const handleDisconnect = async () => {
    try {
      hapticFeedback('light')
      await disconnect()
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  const handleClearSession = async () => {
    try {
      setIsClearing(true)
      hapticFeedback('light')
      
      // Immediately go back to welcome screen for instant feedback
      if (onRetry) {
        onRetry()
      }
      
      // Then clean up in the background
      await forceCleanup()
      
    } catch (error) {
      // console.error('Error clearing session:', error)
      // Still try to retry
      if (onRetry) {
        onRetry()
      }
    } finally {
      setIsClearing(false)
    }
  }

  const handleCheckConnection = async () => {
    try {
      setIsCheckingConnection(true)
      hapticFeedback('light')
      
      const restored = await checkConnection()
      if (restored) {
        // Connection restored, try to continue
        if (onRetry) {
          onRetry()
        }
      } else {
        // No connection found, need to reconnect
        await forceCleanup()
        if (onRetry) {
          onRetry()
        }
      }
    } catch (error) {
      // console.error('Error checking connection:', error)
      // Fallback to force cleanup and retry
      await forceCleanup()
      if (onRetry) {
        onRetry()
      }
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const handleReturnToBot = () => {
    hapticFeedback('success')
    if (onReturnToBot) {
      onReturnToBot()
    }
  }

  if (step === 'connecting') {
    return (
      <Card className="p-6 text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Connecting to Wallet
        </h3>
        <p className="text-gray-600 text-sm">
          Please check your wallet app and approve the connection request
        </p>
        
        <div className="mt-6 space-y-2 text-xs text-gray-500">
          <p>• Open your wallet app</p>
          <p>• Approve the connection request</p>
          <p>• Return to this page</p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">
            Stuck on this screen? Try clearing the session:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSession}
            disabled={isClearing}
            className="text-xs"
          >
            {isClearing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Clearing...
              </>
            ) : (
              'Clear Session & Start Over'
            )}
          </Button>
        </div>
      </Card>
    )
  }

  if (step === 'verifying') {
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verifying Your Wallet
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Please sign the verification message in your wallet
        </p>
        
        {account && (
          <div className="p-3 bg-gray-50 rounded-xl mb-4">
            <p className="text-xs text-gray-600 mb-1">Connected Wallet:</p>
            <p className="text-sm font-mono text-gray-900">
              {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        )}

        <div className="space-y-2 text-xs text-gray-500">
          <p>• Sign the message in your wallet</p>
          <p>• We're checking your token balance</p>
          <p>• Determining your tier level</p>
        </div>
      </Card>
    )
  }

  if (step === 'success') {
    return (
      <Card className="p-6 text-center border-green-200 bg-green-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Wallet Verified Successfully! 🎉
        </h3>
        
        <p className="text-green-800 text-sm mb-4">
          Your wallet has been successfully verified and your tier has been assigned. Choose what to do next:
        </p>

        {account && (
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-white border border-green-200 rounded-xl">
              <p className="text-xs text-green-600 mb-1">Verified Wallet:</p>
              <p className="text-sm font-mono text-green-900">
                {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>

            {balance && (
              <div className="p-3 bg-white border border-green-200 rounded-xl">
                <p className="text-xs text-green-600 mb-1">Balance:</p>
                <p className="text-sm font-semibold text-green-900">
                  {parseFloat(balance).toFixed(4)} ETH
                </p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleReturnToBot}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Return to Bot
          </Button>

          <Button
            onClick={handleDisconnect}
            variant="secondary"
            size="md"
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>

        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl">
          <p className="text-xs text-green-700">
            ✅ Verification complete! Your tier benefits are now active in the bot.
            You can safely disconnect your wallet or check your status below.
          </p>
        </div>
      </Card>
    )
  }

  if (step === 'error') {
    const isConnectionError = errorMessage?.includes('connection') || errorMessage?.includes('lost') || errorMessage?.includes('disconnect')
    
    return (
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-red-900 mb-2">
          {isConnectionError ? 'Connection Lost' : 'Verification Failed'}
        </h3>
        
        <p className="text-red-800 text-sm mb-6">
          {errorMessage || 'We couldn\'t verify your wallet. This might be due to a connection issue or cancelled transaction.'}
        </p>

        {/* Always show debug information for troubleshooting */}
        <div className="bg-gray-100 p-3 rounded text-xs text-left mb-4 border">
          <div className="font-mono text-gray-700">
            <div className="font-bold text-gray-900 mb-2">🔍 Diagnostic Info:</div>
            <div className="space-y-1">
              <div>API: {import.meta.env.VITE_BOT_API_URL}</div>
              <div>Telegram: {window.Telegram?.WebApp?.initData ? '✅ Connected' : '❌ Missing'}</div>
              <div>Token: {localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) ? '✅ Present' : '❌ Missing'}</div>
              <div className="text-red-700 font-medium">Error: {errorMessage}</div>
              
              {/* Enhanced Telegram Debug Info */}
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="font-bold text-blue-800 mb-1">🔧 Telegram WebApp Debug:</div>
                <div className="text-blue-700 space-y-1">
                  <div>Script: {typeof window.Telegram !== 'undefined' ? '✅ Loaded' : '❌ Not Loaded'}</div>
                  <div>WebApp: {window.Telegram?.WebApp ? '✅ Available' : '❌ Missing'}</div>
                  <div>Platform: {window.Telegram?.WebApp?.platform || 'N/A'}</div>
                  <div>Version: {window.Telegram?.WebApp?.version || 'N/A'}</div>
                  <div>Ready: {window.Telegram?.WebApp?.isReady ? '✅' : '❌'}</div>
                  <div>InitData: {window.Telegram?.WebApp?.initData ? `✅ (${window.Telegram.WebApp.initData.length} chars)` : '❌ Empty'}</div>
                  {window.Telegram?.WebApp?.initData && (
                    <div className="mt-1 break-all bg-white p-1 rounded border text-xs">
                      Sample: {window.Telegram.WebApp.initData.substring(0, 150)}...
                    </div>
                  )}
                  <div>ViewportHeight: {window.Telegram?.WebApp?.viewportHeight || 'N/A'}</div>
                  <div>MainButton: {window.Telegram?.WebApp?.MainButton ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <div className="font-bold">💡 Common Issue:</div>
              <div>Bot server missing BOT_TOKEN configuration</div>
            </div>
            <button
              onClick={async () => {
                try {
                  // Check Telegram context first
                  const hasTelegram = !!window.Telegram?.WebApp
                  const hasInitData = !!window.Telegram?.WebApp?.initData
                  const initData = window.Telegram?.WebApp?.initData || ''
                  
                  // Create detailed debug info
                  const debugInfo = {
                    has_telegram: hasTelegram,
                    has_init_data: hasInitData,
                    init_data_length: initData.length,
                    telegram_ready: window.Telegram?.WebApp?.isReady || false,
                    telegram_platform: window.Telegram?.WebApp?.platform || 'unknown',
                    window_origin: window.location.origin,
                    window_href: window.location.href,
                    user_agent: navigator.userAgent
                  }
                  
                  let corsTestResult = null
                  let authTestResult = null
                  
                  // First test CORS connectivity
                  try {
                    // console.log('🔧 Testing CORS connectivity...')
                    const corsResponse = await fetch(`${import.meta.env.VITE_BOT_API_URL}/api/debug/cors-test`, {
                      method: 'POST',
                      mode: 'cors',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Origin': window.location.origin
                      },
                      body: JSON.stringify(debugInfo)
                    })
                    corsTestResult = {
                      status: corsResponse.status,
                      ok: corsResponse.ok,
                      data: corsResponse.ok ? await corsResponse.json() : await corsResponse.text()
                    }
                  } catch (corsError) {
                    corsTestResult = {
                      error: true,
                      message: corsError.message,
                      name: corsError.name
                    }
                  }
                  
                  // Then test authentication if CORS works
                  if (corsTestResult && !corsTestResult.error) {
                    try {
                      // Use real Telegram data if available, otherwise test data
                      const telegramData = initData || 'test_fallback_no_telegram_context'
                      
                      const authResponse = await fetch(`${import.meta.env.VITE_BOT_API_URL}/api/auth/telegram`, {
                        method: 'POST',
                        mode: 'cors',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Origin': window.location.origin
                        },
                        body: JSON.stringify({ telegram_data: telegramData })
                      })
                      authTestResult = {
                        status: authResponse.status,
                        ok: authResponse.ok,
                        data: authResponse.ok ? await authResponse.json() : await authResponse.text()
                      }
                    } catch (authError) {
                      authTestResult = {
                        error: true,
                        message: authError.message,
                        name: authError.name
                      }
                    }
                  }
                  
                  // Show comprehensive result
                  const resultText = `WEBAPP CONTEXT:\n${JSON.stringify(debugInfo, null, 2)}\n\nCORS TEST:\n${JSON.stringify(corsTestResult, null, 2)}\n\nAUTH TEST:\n${JSON.stringify(authTestResult, null, 2)}`
                  
                  // Create enhanced alert
                  const alertDiv = document.createElement('div')
                  alertDiv.className = 'fixed top-4 left-4 right-4 bg-gray-800 text-white p-4 rounded z-50 text-xs font-mono max-h-96 overflow-auto'
                  alertDiv.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                      <strong>🔧 Complete Network & Server Test</strong>
                      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-300">&times;</button>
                    </div>
                    <pre class="whitespace-pre-wrap text-xs">${resultText}</pre>
                    <div class="mt-3 p-2 rounded text-gray-300 bg-gray-700">
                      ${!hasTelegram ? '⚠️ Not running in Telegram WebApp context' : 
                        !hasInitData ? '⚠️ Telegram WebApp has no initData' :
                        corsTestResult?.error ? '❌ CORS/Network connectivity issue' :
                        corsTestResult?.ok && authTestResult?.status === 200 ? '✅ All tests successful!' : 
                        corsTestResult?.ok && authTestResult?.status === 401 ? '🔐 Network OK, Auth validation issue (expected outside Telegram)' :
                        corsTestResult?.ok ? '⚠️ Network OK but server issue' :
                        '❌ Cannot reach server - check network/CORS'}
                    </div>
                  `
                  document.body.appendChild(alertDiv)
                  
                  // Auto-remove after 20 seconds
                  setTimeout(() => {
                    if (alertDiv.parentElement) {
                      alertDiv.remove()
                    }
                  }, 20000)
                  
                } catch (e) {
                  // Create error alert
                  const alertDiv = document.createElement('div')
                  alertDiv.className = 'fixed top-4 left-4 right-4 bg-red-800 text-white p-4 rounded z-50 text-xs'
                  alertDiv.innerHTML = `
                    <div class="flex justify-between items-start">
                      <div>
                        <strong>❌ Test Error</strong>
                        <div class="mt-1">${e.message}</div>
                        <div class="mt-2 text-red-300 text-xs">Error in test execution itself</div>
                      </div>
                      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-300">&times;</button>
                    </div>
                  `
                  document.body.appendChild(alertDiv)
                  setTimeout(() => alertDiv.remove(), 5000)
                }
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              🔧 Test Network & Server
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {isConnectionError ? (
            <>
              <Button
                onClick={handleCheckConnection}
                variant="primary"
                size="lg"
                disabled={isCheckingConnection}
                className="w-full"
              >
                {isCheckingConnection ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Checking Connection...
                  </>
                ) : (
                  'Try to Restore Connection'
                )}
              </Button>
              
              <Button
                onClick={handleClearSession}
                variant="outline"
                size="md"
                disabled={isClearing}
                className="w-full"
              >
                {isClearing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Clearing...
                  </>
                ) : (
                  'Start Fresh Connection'
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={onRetry}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Try Again
            </Button>
          )}

          {account && (
            <Button
              onClick={handleDisconnect}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          )}
        </div>

        <div className="p-3 bg-red-100 border border-red-200 rounded-xl">
          <p className="text-xs text-red-700">
            <strong>{isConnectionError ? 'Connection Issues:' : 'Common issues:'}</strong><br />
            {isConnectionError ? (
              <>
                • Wallet app closed during process<br />
                • Network connection interrupted<br />
                • QR code scanning timeout<br />
                • Session expired during signing
              </>
            ) : (
              <>
                • Connection request rejected<br />
                • Network timeout<br />
                • Signature cancelled<br />
                • Invalid wallet response
              </>
            )}
          </p>
        </div>
      </Card>
    )
  }

  return null
}

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { WalletProvider } from './contexts/WalletContext'
import { TelegramProvider } from './contexts/TelegramContext'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Layout/Header'
import WalletConnect from './components/WalletConnect/WalletConnect'
import VerificationStatus from './components/Verification/VerificationStatus'
import LoadingSpinner from './components/ui/LoadingSpinner'
import SecurityFAQ from './components/SecurityFAQ'
import { useTelegram } from './hooks/useTelegram'
import { useUserStatus } from './hooks/useUserStatus'
import { disconnectWallet } from './services/botApi'

// Helper function to get tier-specific colors
const getTierColors = (tier) => {
  switch (tier) {
    case 'free':
      return {
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        borderColor: 'border-gray-200',
        gradientFrom: 'from-gray-50',
        gradientTo: 'to-gray-100'
      }
    case 'tier1': // Bronze
      return {
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-700',
        borderColor: 'border-amber-300',
        gradientFrom: 'from-amber-50',
        gradientTo: 'to-orange-50'
      }
    case 'tier2': // Silver
      return {
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-600',
        borderColor: 'border-slate-300',
        gradientFrom: 'from-slate-50',
        gradientTo: 'to-gray-100'
      }
    case 'tier3': // Gold
      return {
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        gradientFrom: 'from-yellow-50',
        gradientTo: 'to-amber-50'
      }
    default:
      return {
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        borderColor: 'border-red-200',
        gradientFrom: 'from-red-50',
        gradientTo: 'to-red-100'
      }
  }
}

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState('welcome') // welcome, connecting, verifying, success, error
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { tg, user, initData } = useTelegram()
  const { userStatus, isLoading: statusLoading, error: statusError, refreshStatus } = useUserStatus()

  useEffect(() => {
    // Initialize Telegram WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      setIsInitialized(true)
      
      // Show main button for closing app
      tg.MainButton.setText('Close App')
      tg.MainButton.onClick(() => {
        tg.close()
      })
    }
  }, [tg])

  const handleConnectionStart = () => {
    setCurrentStep('connecting')
  }

  const handleVerificationStart = () => {
    setCurrentStep('verifying')
  }

  const handleSuccess = (navigationHint) => {
    setCurrentStep('success')
    if (tg) {
      tg.MainButton.show()
    }
    
    // After successful verification, refresh the status to update the display
    setTimeout(async () => {
      try {
        await refreshStatus()
      } catch (error) {
        console.error('Error refreshing status after success:', error)
        // Don't throw - just log it
      }
    }, 1000)
  }

  const handleError = (error) => {
    setCurrentStep('error')
    toast.error(error)
  }

  const handleRetry = () => {
    setCurrentStep('welcome')
  }

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true)
    
    try {
      await disconnectWallet(userStatus.wallets?.[0]?.address, false)
      toast.success('🔓 Wallet disconnected successfully!')
      
      // Refresh status to update the UI
      setTimeout(async () => {
        await refreshStatus()
      }, 1000)
      
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      toast.error('Failed to disconnect wallet: ' + error.message)
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto"
          >
            {currentStep === 'welcome' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {user?.first_name ? `Welcome, ${user.first_name}!` : 'Welcome!'}
                  </h1>
                  <p className="text-gray-600">
                    Connect your wallet to verify your BundleAlert subscription tier
                  </p>
                </div>

                {/* Current Status Display */}
                {statusLoading ? (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <LoadingSpinner size="sm" />
                      <p className="text-sm text-gray-600">Loading your current status...</p>
                    </div>
                  </div>
                ) : userStatus ? (
                  <div className={`mb-6 p-4 bg-gradient-to-r ${getTierColors(userStatus.current_state?.current_tier).gradientFrom} ${getTierColors(userStatus.current_state?.current_tier).gradientTo} border ${getTierColors(userStatus.current_state?.current_tier).borderColor} rounded-xl`}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full ${getTierColors(userStatus.current_state?.current_tier).iconBg} flex items-center justify-center`}>
                          <AutoAwesomeIcon 
                            className={`${getTierColors(userStatus.current_state?.current_tier).iconColor}`}
                            sx={{ fontSize: 24 }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Current Tier: {userStatus.current_state?.current_tier === 'free' ? 'Free' : 
                                        userStatus.current_state?.current_tier === 'tier1' ? 'Bronze' :
                                        userStatus.current_state?.current_tier === 'tier2' ? 'Silver' :
                                        userStatus.current_state?.current_tier === 'tier3' ? 'Gold' : 'Unknown'}
                        </p>
                        {userStatus.current_state?.has_verified_wallets ? (
                          <div className="space-y-2">
                            <p className="text-xs text-green-700">
                              ✅ {userStatus.wallets?.[0]?.address 
                                ? `${userStatus.wallets[0].address.slice(0, 6)}...${userStatus.wallets[0].address.slice(-4)} wallet verified`
                                : `Wallet verified`
                              }
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleDisconnectWallet}
                                disabled={isDisconnecting}
                                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isDisconnecting ? '⏳ Disconnecting...' : '🔓 Disconnect'}
                              </button>
                              <button
                                onClick={() => setCurrentStep('connecting')}
                                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                              >
                                🔄 Re-verify
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs txt-gray-700">
                            No wallets verified yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : statusError ? (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800 mb-1">
                          Status Unknown
                        </p>
                        <p className="text-xs text-yellow-700">
                          Unable to load your current tier. Connect your wallet to verify your status.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          💡 Get Started
                        </p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Connect your wallet to verify your token holdings and unlock premium features. 
                          The process is completely safe and only requires a read-only signature.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <WalletConnect 
                  onConnectionStart={handleConnectionStart}
                  onVerificationStart={handleVerificationStart}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
                
                <SecurityFAQ />
              </div>
            )}

            {(currentStep === 'connecting' || currentStep === 'verifying') && (
              <VerificationStatus 
                step={currentStep}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}

            {currentStep === 'success' && (
              <VerificationStatus 
                step={currentStep}
                onReturnToBot={() => tg?.close()}
                onSuccess={() => {
                  // After clicking "Return to welcome", go back and refresh
                  setCurrentStep('welcome')
                  refreshStatus()
                }}
              />
            )}

            {currentStep === 'error' && (
              <VerificationStatus 
                step={currentStep}
                onRetry={handleRetry}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <TelegramProvider>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </TelegramProvider>
    </ErrorBoundary>
  )
}

export default App

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { WalletProvider } from './contexts/WalletContext'
import { TelegramProvider } from './contexts/TelegramContext'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Layout/Header'
import WalletConnect from './components/WalletConnect/WalletConnect'
import VerificationStatus from './components/Verification/VerificationStatus'
import UserStatus from './components/UserStatus/UserStatus'
import LoadingSpinner from './components/ui/LoadingSpinner'
import Button from './components/ui/Button'
import SecurityFAQ from './components/SecurityFAQ'
import { useTelegram } from './hooks/useTelegram'
import { useUserStatus } from './hooks/useUserStatus'

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState('welcome') // welcome, connecting, verifying, success, error, status
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
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {userStatus.current_state?.current_tier === 'free' ? (
                          <span className="text-2xl">🆓</span>
                        ) : userStatus.current_state?.current_tier === 'tier1' ? (
                          <span className="text-2xl">🥉</span>
                        ) : userStatus.current_state?.current_tier === 'tier2' ? (
                          <span className="text-2xl">🥈</span>
                        ) : userStatus.current_state?.current_tier === 'tier3' ? (
                          <span className="text-2xl">🥇</span>
                        ) : (
                          <span className="text-2xl">❓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Current Tier: {userStatus.current_state?.current_tier === 'free' ? 'Free' : 
                                        userStatus.current_state?.current_tier === 'tier1' ? 'Bronze' :
                                        userStatus.current_state?.current_tier === 'tier2' ? 'Silver' :
                                        userStatus.current_state?.current_tier === 'tier3' ? 'Gold' : 'Unknown'}
                        </p>
                        {userStatus.current_state?.has_verified_wallets ? (
                          <p className="text-xs text-green-700">
                            ✅ {userStatus.current_state.wallet_count} wallet(s) verified
                          </p>
                        ) : (
                          <p className="text-xs text-blue-700">
                            � Connect your wallet below to verify your tier and unlock premium features
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

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

  // Auto-redirect to status if user has existing wallets
  useEffect(() => {
    if (userStatus && userStatus.wallets && userStatus.wallets.length > 0 && currentStep === 'welcome') {
      setCurrentStep('status')
    }
  }, [userStatus, currentStep])

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
    
    // If user manually requested status navigation, do it immediately
    if (navigationHint === 'manual_status_nav') {
      setCurrentStep('status')
      // Delayed refresh to give state time to settle
      setTimeout(async () => {
        try {
          await refreshStatus()
        } catch (error) {
          console.error('Error refreshing status:', error)
          toast.error('Status loaded with some issues. Try refreshing if needed.')
        }
      }, 1000)
      return
    }
    
    // Remove automatic navigation - let users choose what to do next
    // This prevents the race condition that causes "Something went wrong"
  }

  const handleError = (error) => {
    setCurrentStep('error')
    toast.error(error)
  }

  const handleRetry = () => {
    setCurrentStep('welcome')
  }

  const handleShowStatus = () => {
    setCurrentStep('status')
  }

  const handleWalletConnect = () => {
    setCurrentStep('welcome')
  }

  const handleDisconnect = () => {
    // After disconnect, refresh status and go to welcome
    refreshStatus()
    setCurrentStep('welcome')
    toast.success('Wallets disconnected successfully')
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

                {/* Show status button if user has existing wallets */}
                {userStatus && userStatus.wallets && userStatus.wallets.length > 0 && (
                  <div className="mb-6">
                    <Button onClick={handleShowStatus} className="w-full">
                      📊 View My Status
                    </Button>
                  </div>
                )}
                
                {/* Helpful tip section */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        💡 Quick Start
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Connect your wallet to verify your token holdings and unlock premium features. 
                        The process is completely safe and only requires a read-only signature.
                      </p>
                    </div>
                  </div>
                </div>
                
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
              />
            )}

            {currentStep === 'error' && (
              <VerificationStatus 
                step={currentStep}
                onRetry={handleRetry}
              />
            )}

            {currentStep === 'status' && (
              <UserStatus
                userStatus={userStatus}
                isLoading={statusLoading}
                error={statusError}
                onRefresh={refreshStatus}
                onWalletConnect={handleWalletConnect}
                onDisconnect={handleDisconnect}
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

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
import SecurityFAQ from './components/SecurityFAQ'
import { useTelegram } from './hooks/useTelegram'
import { useUserStatus } from './hooks/useUserStatus'

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentStep, setCurrentStep] = useState('loading') // loading, status, connecting, verifying, success, error
  const [verificationResult, setVerificationResult] = useState(null)
  const { tg, user, initData } = useTelegram()
  const { userStatus, loading: statusLoading, error: statusError, refreshStatus } = useUserStatus()

  // Determine initial view based on user status
  useEffect(() => {
    if (!isInitialized || statusLoading) {
      setCurrentStep('loading')
      return
    }

    if (statusError) {
      // If we can't get user status, fall back to connection flow
      console.log('User status error, falling back to connection flow:', statusError)
      setCurrentStep('connecting')
      return
    }

    if (userStatus) {
      // User exists and we have their status
      if (userStatus.current_state.has_verified_wallets) {
        setCurrentStep('status') // Show status management
      } else {
        setCurrentStep('connecting') // Show wallet connection
      }
    } else {
      setCurrentStep('connecting') // New user flow
    }
  }, [userStatus, statusLoading, statusError, isInitialized])

  useEffect(() => {
    // Initialize Telegram WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      setIsInitialized(true)
      
      // Configure main button
      tg.MainButton.setText('Close App')
      tg.MainButton.onClick(() => {
        tg.close()
      })
    }
  }, [tg])

  const handleConnectionStart = () => {
    setCurrentStep('verifying')
  }

  const handleVerificationStart = () => {
    setCurrentStep('verifying')
  }

  const handleSuccess = (result) => {
    setVerificationResult(result)
    setCurrentStep('success')
    
    // Refresh user status to show updated data
    setTimeout(() => {
      refreshStatus()
      setCurrentStep('status')
    }, 3000) // Show success for 3 seconds then go to status
    
    if (tg) {
      tg.MainButton.show()
    }
  }

  const handleError = (error) => {
    setCurrentStep('error')
    toast.error(error)
  }

  const handleRetry = () => {
    setCurrentStep('connecting')
  }

  const handleStartVerification = () => {
    setCurrentStep('connecting')
  }

  const handleClose = () => {
    if (tg?.close) {
      tg.close()
    }
  }

  if (!isInitialized || currentStep === 'loading') {
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

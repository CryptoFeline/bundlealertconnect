import React, { createContext, useContext, useEffect, useState } from 'react'

export const TelegramContext = createContext()

export function TelegramProvider({ children }) {
  const [tg, setTg] = useState(null)
  const [user, setUser] = useState(null)
  const [initData, setInitData] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if we're in Telegram WebApp environment
    if (window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp
      setTg(telegram)
      setUser(telegram.initDataUnsafe?.user)
      setInitData(telegram.initData)
      
      // console.log('🔍 [TelegramContext] Initializing Telegram WebApp...')
      // console.log('🔍 [TelegramContext] Initial isReady state:', telegram.isReady)
      
      // Configure WebApp
      telegram.ready()
      telegram.expand()
      
      // Set theme with version check to avoid warnings
      try {
        // Check if the WebApp version supports these methods
        const version = telegram.version
        const majorVersion = version ? parseInt(version.split('.')[0]) : 6
        
        // Only set colors if supported (version 6.1+)
        if (majorVersion > 6 || (majorVersion === 6 && version.includes('6.1'))) {
          telegram.setHeaderColor?.('#ffffff')
          telegram.setBackgroundColor?.('#f8f9fa')
        } else {
          console.log('ℹ️ [TelegramContext] Theme customization not supported in WebApp version', version)
        }
      } catch (error) {
        console.log('ℹ️ [TelegramContext] Theme customization not available:', error.message)
      }
      
      // Wait for Telegram to be actually ready by polling the native isReady state
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max (50 * 100ms)
      
      const checkReadiness = () => {
        attempts++
        // console.log(`🔍 [TelegramContext] Checking Telegram readiness (${attempts}/${maxAttempts})...`, telegram.isReady)
        
        if (telegram.isReady) {
          // console.log('✅ [TelegramContext] Telegram WebApp is now ready!')
          setIsReady(true)
        } else if (attempts >= maxAttempts) {
          // console.warn('⚠️ [TelegramContext] Timeout waiting for Telegram readiness, proceeding anyway')
          setIsReady(true) // Proceed anyway after timeout
        } else {
          // console.log('⏳ [TelegramContext] Still waiting for Telegram readiness...')
          // Check again in 100ms
          setTimeout(checkReadiness, 100)
        }
      }
      
      // Start checking readiness immediately and periodically
      checkReadiness()
      
    } else {
      // Development/testing environment
      // console.log('Not in Telegram WebApp environment')
      setIsReady(true)
    }
  }, [])

  const showMainButton = (text, onClick) => {
    if (tg) {
      tg.MainButton.setText(text)
      tg.MainButton.onClick(onClick)
      tg.MainButton.show()
    }
  }

  const hideMainButton = () => {
    if (tg) {
      tg.MainButton.hide()
    }
  }

  const closeApp = () => {
    if (tg) {
      tg.close()
    } else {
      // Fallback for non-Telegram environment
      window.close()
    }
  }

  const sendData = (data) => {
    if (tg) {
      tg.sendData(JSON.stringify(data))
    }
  }

  const showAlert = (message) => {
    if (tg) {
      tg.showAlert(message)
    } else {
      alert(message)
    }
  }

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      if (tg) {
        tg.showConfirm(message, resolve)
      } else {
        resolve(confirm(message))
      }
    })
  }

  const hapticFeedback = (type = 'light') => {
    if (tg?.HapticFeedback) {
      switch (type) {
        case 'light':
          tg.HapticFeedback.impactOccurred('light')
          break
        case 'medium':
          tg.HapticFeedback.impactOccurred('medium')
          break
        case 'heavy':
          tg.HapticFeedback.impactOccurred('heavy')
          break
        case 'success':
          tg.HapticFeedback.notificationOccurred('success')
          break
        case 'warning':
          tg.HapticFeedback.notificationOccurred('warning')
          break
        case 'error':
          tg.HapticFeedback.notificationOccurred('error')
          break
        default:
          tg.HapticFeedback.impactOccurred('light')
          break
      }
    }
  }

  const value = {
    tg,
    user,
    initData,
    isReady,
    showMainButton,
    hideMainButton,
    closeApp,
    sendData,
    showAlert,
    showConfirm,
    hapticFeedback
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider')
  }
  return context
}

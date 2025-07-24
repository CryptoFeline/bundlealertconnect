/**
 * Diagnostic utilities for debugging authentication issues
 */

export const runDiagnostics = async () => {
  console.group('🔍 BundleAlert Diagnostics')
  
  try {
    // Check Telegram WebApp availability
    console.log('📱 Telegram WebApp:', {
      available: !!window.Telegram?.WebApp,
      initData: window.Telegram?.WebApp?.initData ? 'Present' : 'Missing',
      version: window.Telegram?.WebApp?.version
    })
    
    // Check local storage
    console.log('💾 Local Storage:', {
      sessionToken: localStorage.getItem('bundlealert_session_token') ? 'Present' : 'Missing'
    })
    
    // Test server endpoints
    console.log('🌐 Testing server endpoints...')
    
    // Test auth endpoint
    try {
      const authResponse = await fetch('https://bundlealertstream.replit.app/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_data: 'test' })
      })
      
      const authData = await authResponse.json()
      console.log('🔑 Auth endpoint:', {
        status: authResponse.status,
        response: authData
      })
    } catch (error) {
      console.error('❌ Auth endpoint failed:', error.message)
    }
    
    // Test verification endpoint
    try {
      const verifyResponse = await fetch('https://bundlealertstream.replit.app/api/wallet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: '0x1234',
          signature: '0x5678',
          message: 'test'
        })
      })
      
      const verifyData = await verifyResponse.json()
      console.log('✅ Verify endpoint:', {
        status: verifyResponse.status,
        response: verifyData
      })
    } catch (error) {
      console.error('❌ Verify endpoint failed:', error.message)
    }
    
    // Provide diagnostic summary
    console.log('📋 Diagnostic Summary:')
    console.log('If you see "Bot token not configured" - the server needs BOT_TOKEN in settings.env')
    console.log('If you see "No token provided" - authentication must succeed first')
    console.log('Contact support with this diagnostic info if issues persist')
    
  } catch (error) {
    console.error('❌ Diagnostics failed:', error)
  }
  
  console.groupEnd()
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  console.log('🔧 Development mode detected - run runDiagnostics() in console for debugging')
  window.runDiagnostics = runDiagnostics
}

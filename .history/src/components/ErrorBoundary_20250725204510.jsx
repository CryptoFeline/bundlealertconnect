import React, { Component } from 'react'
import { toast } from 'react-hot-toast'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo)
    }
    
    // Show user-friendly error message based on error type
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
      toast.error('Network connection issue. Please check your internet and try again.')
    } else if (error.message?.includes('token') || error.message?.includes('auth')) {
      toast.error('Authentication issue. Please refresh and try again.')
    } else {
      toast.error('Something went wrong. Please refresh the page.')
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. This might be a temporary issue with the verification process.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-500 text-white rounded-xl py-3 px-6 font-medium hover:bg-blue-600 transition-colors duration-200"
                >
                  Refresh & Try Again
                </button>
                <button
                  onClick={() => {
                    // Clear potential problematic data
                    localStorage.removeItem('bundlealert_session_token')
                    localStorage.removeItem('bundlealert_wallet_address')
                    window.location.reload()
                  }}
                  className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 px-6 font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Reset & Start Fresh
                </button>
              </div>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Developer Info
                  </summary>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-xs font-mono text-gray-800 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

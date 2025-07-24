import React from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { disconnectWallet } from '../../services/botApi'
import { useTelegram } from '../../hooks/useTelegram'

export default function UserStatus({ userStatus, onRefresh, onStartVerification, onClose }) {
  const { tg } = useTelegram()
  const [disconnecting, setDisconnecting] = React.useState(false)

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      
      // Haptic feedback if available
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light')
      }
      
      await disconnectWallet(null, true) // Disconnect all wallets
      toast.success('Wallet disconnected successfully!')
      
      // Refresh status to show updated state
      onRefresh()
      
    } catch (error) {
      console.error('Disconnect failed:', error)
      toast.error('Failed to disconnect wallet')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleReVerify = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light')
    }
    onStartVerification()
  }

  const handleClose = () => {
    if (tg?.close) {
      tg.close()
    } else if (onClose) {
      onClose()
    }
  }

  const getTierEmoji = (tier) => {
    const emojis = {
      'tier3': '🥇',
      'tier2': '🥈', 
      'tier1': '🥉',
      'free': '🆓'
    }
    return emojis[tier] || '🆓'
  }

  const getTierColor = (tier) => {
    const colors = {
      'tier3': 'text-yellow-600',
      'tier2': 'text-gray-600',
      'tier1': 'text-orange-600',
      'free': 'text-blue-600'
    }
    return colors[tier] || 'text-blue-600'
  }

  const getRecommendationStyle = (type) => {
    const styles = {
      'info': 'bg-blue-50 border-blue-200 text-blue-800',
      'upgrade': 'bg-green-50 border-green-200 text-green-800',
      'warning': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'update': 'bg-purple-50 border-purple-200 text-purple-800',
      'success': 'bg-green-50 border-green-200 text-green-800'
    }
    return styles[type] || 'bg-gray-50 border-gray-200 text-gray-800'
  }

  if (!userStatus) return null

  const { current_state, wallets, recommendations, available_actions } = userStatus

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Current Status Card */}
      <Card className="p-6">
        <div className="text-center">
          <div className="mb-4">
            <span className="text-4xl">
              {getTierEmoji(current_state.current_tier)}
            </span>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Current Status
          </h2>
          
          <div className={`text-lg font-medium ${getTierColor(current_state.current_tier)} mb-4`}>
            {current_state.current_tier.toUpperCase()} TIER
          </div>

          {/* Wallet Status */}
          {current_state.has_verified_wallets ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 font-medium">
                  {current_state.wallet_count} Wallet{current_state.wallet_count !== 1 ? 's' : ''} Connected
                </span>
              </div>
              {wallets.length > 0 && (
                <div className="mt-2 text-sm text-green-700">
                  {wallets[0].address.slice(0, 6)}...{wallets[0].address.slice(-4)}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-gray-500">⭕</span>
                <span className="text-gray-700 font-medium">
                  No Wallets Connected
                </span>
              </div>
            </div>
          )}

          {/* Tier Mismatch Warning */}
          {current_state.tier_mismatch && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800 font-medium text-sm">
                  Tier Update Available: {current_state.tier_from_balance.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-3 ${getRecommendationStyle(rec.type)}`}
              >
                <p className="text-sm font-medium">{rec.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Actions */}
      <Card className="p-4">
        <h3 className="font-medium text-gray-900 mb-3">Available Actions</h3>
        <div className="space-y-3">
          
          {available_actions.includes('connect_wallet') && (
            <Button
              onClick={handleReVerify}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              🔗 Connect Wallet
            </Button>
          )}

          {available_actions.includes('re_verify') && (
            <Button
              onClick={handleReVerify}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              🔄 Re-verify Wallet
            </Button>
          )}

          {available_actions.includes('update_tier') && (
            <Button
              onClick={handleReVerify}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              ⬆️ Update Tier
            </Button>
          )}

          {available_actions.includes('disconnect_wallet') && (
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {disconnecting ? '🔄 Disconnecting...' : '🔓 Disconnect Wallet'}
            </Button>
          )}

          <Button
            onClick={handleClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          >
            ✖️ Close
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

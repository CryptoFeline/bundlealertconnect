import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { disconnectWallet } from '../../services/botApi';

const UserStatus = ({ 
  userStatus, 
  isLoading, 
  onRefresh, 
  onWalletConnect,
  onDisconnect 
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect all wallets? This will downgrade your tier to Free.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectWallet(null, true); // disconnect all
      if (onDisconnect) {
        onDisconnect();
      }
      onRefresh();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect wallets. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading user status...</p>
      </Card>
    );
  }

  if (!userStatus) {
    return (
      <Card className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Unable to Load Status
        </h3>
        <p className="text-gray-600 mb-4">
          We're having trouble loading your verification status. This might be temporary.
        </p>
        <div className="space-y-3">
          <Button onClick={onRefresh} className="w-full">
            Try Again
          </Button>
          <Button onClick={onWalletConnect} variant="outline" className="w-full">
            Connect New Wallet
          </Button>
        </div>
        
        {/* Show helpful message if this happens after verification */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 If you just completed verification, your status may take a moment to update. Try refreshing in a few seconds.
          </p>
        </div>
      </Card>
    );
  }

  const tierInfo = {
    free: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: '🆓',
      title: 'Free Tier'
    },
    tier1: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: '🥉',
      title: 'Bronze Tier'
    },
    tier2: {
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: '🥈',
      title: 'Silver Tier'
    },
    tier3: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: '🥇',
      title: 'Gold Tier'
    }
  };

  const currentTierInfo = tierInfo[userStatus.tier] || tierInfo.free;

  return (
    <div className="space-y-6">
      {/* User Tier Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full ${currentTierInfo.bgColor} flex items-center justify-center text-2xl`}>
              {currentTierInfo.icon}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${currentTierInfo.color}`}>
                {currentTierInfo.title}
              </h2>
              <p className="text-gray-600">
                Current subscription level
              </p>
            </div>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Tier Benefits */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Current Benefits:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {userStatus.tier === 'free' && (
              <>
                <li>• Basic bundle alerts</li>
                <li>• Limited notifications</li>
              </>
            )}
            {userStatus.tier === 'tier1' && (
              <>
                <li>• Enhanced bundle alerts</li>
                <li>• Real-time notifications</li>
                <li>• Basic analytics</li>
              </>
            )}
            {userStatus.tier === 'tier2' && (
              <>
                <li>• Premium bundle alerts</li>
                <li>• Advanced analytics</li>
                <li>• Priority notifications</li>
                <li>• Risk analysis</li>
              </>
            )}
            {userStatus.tier === 'tier3' && (
              <>
                <li>• VIP bundle alerts</li>
                <li>• Full analytics suite</li>
                <li>• Instant notifications</li>
                <li>• Advanced risk analysis</li>
                <li>• Custom alerts</li>
              </>
            )}
          </ul>
        </div>
      </Card>

      {/* Connected Wallets */}
      {userStatus.wallets && userStatus.wallets.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Connected Wallets ({userStatus.wallets.length})
          </h3>
          <div className="space-y-3">
            {userStatus.wallets.map((wallet, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono text-sm text-gray-800">
                    {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Verified: {new Date(wallet.verified_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {userStatus.recommendations && userStatus.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💡 Recommendations
          </h3>
          <div className="space-y-2">
            {userStatus.recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-sm text-blue-800">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Available Actions
        </h3>
        <div className="space-y-3">
          {userStatus.available_actions && userStatus.available_actions.includes('connect_wallet') && (
            <Button 
              onClick={onWalletConnect}
              className="w-full"
            >
              🔗 Connect New Wallet
            </Button>
          )}
          
          {userStatus.available_actions && userStatus.available_actions.includes('upgrade_tier') && (
            <Button 
              variant="outline"
              className="w-full"
            >
              ⬆️ Upgrade Tier
            </Button>
          )}
          
          {userStatus.wallets && userStatus.wallets.length > 0 && (
            <Button 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              {isDisconnecting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Disconnecting...
                </>
              ) : (
                '🔓 Disconnect All Wallets'
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔧 Debug Info
          </h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(userStatus, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default UserStatus;

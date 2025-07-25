import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import Card from './ui/Card'

const faqData = [
  {
    question: 'Is this safe? What permissions am I giving?',
    answer: 'This is completely safe. We only request a read-only signature from your wallet to verify ownership. We cannot access your funds, make transactions, or perform any actions on your behalf. The signature is only used to prove you own the wallet address.',
    importance: 'high'
  },
  {
    question: 'Step-by-step: How does verification work?',
    answer: '1. Click "Connect Wallet" below\n2. Choose your wallet from the list\n3. Your wallet app will open - approve the connection\n4. Sign the verification message (read-only, no permissions)\n5. We check your token balance and assign your tier\n6. Disconnect your wallet for security\n7. Return to the bot to enjoy your new features!',
    importance: 'high'
  },
  {
    question: 'Why do you need to verify my wallet?',
    answer: 'Wallet verification allows us to check your token holdings and assign you the appropriate tier level for premium features. Higher tiers get access to more advanced alerts, analytics, and exclusive features in our bot.'
  },
  {
    question: 'What happens to my wallet connection after verification?',
    answer: 'You can and should disconnect your wallet immediately after verification for security. We store your verification status on our servers, so you don\'t need to stay connected. Your tier benefits will remain active.'
  },
  {
    question: 'What if I don\'t have enough tokens for a higher tier?',
    answer: 'No problem! You can still use our basic features. If you acquire more tokens later, you can always return to verify again and upgrade your tier level.'
  },
  {
    question: 'Which wallets are supported?',
    answer: 'We support all major wallets including MetaMask, WalletConnect compatible wallets (Trust Wallet, Rainbow, Coinbase Wallet), and many others. Choose from the list when connecting.'
  }
]

export default function SecurityFAQ() {
  const [openItems, setOpenItems] = useState({})
  const [showFAQ, setShowFAQ] = useState(false)

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <Card className="p-4">
      <div className="mb-4">
        <button
          onClick={() => setShowFAQ(!showFAQ)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              Security & FAQ
            </h3>
            <p className="text-sm text-gray-600">
              Common questions about wallet verification
            </p>
          </div>
          <motion.div
            animate={{ rotate: showFAQ ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-3"
          >
            <ChevronDownIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
          </motion.div>
        </button>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          showFAQ 
            ? 'max-h-96 opacity-100 mb-4 overflow-y-auto' 
            : 'max-h-0 opacity-0 mb-0 overflow-hidden'
        }`}
      >
        <div className="space-y-2 pr-2">
          {faqData.map((item, index) => (
            <div key={index} className={`border rounded-xl overflow-hidden ${
              item.importance === 'high' 
                ? 'border-blue-200 bg-blue-50/30' 
                : 'border-gray-200'
            }`}>
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-2 pr-2">
                  {item.importance === 'high' && (
                    <span className="text-blue-500 text-xs">⭐</span>
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {item.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openItems[index] ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </motion.div>
              </button>
              
              <div
                className={`transition-all duration-200 ease-in-out ${
                  openItems[index] 
                    ? 'opacity-100' 
                    : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="px-4 pb-3">
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100 pt-3">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800">
              100% Safe & Secure
            </p>
            <p className="text-xs text-green-700 mt-1">
              Read-only verification with no spending or similar permissions!
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

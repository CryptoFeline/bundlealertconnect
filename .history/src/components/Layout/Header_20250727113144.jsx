import React from 'react'
import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            {/* If  */}
            <img src="/BundleAlertLogo.svg" alt="BundleAlert Logo" className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            BundleAlert Verification
          </h1>
        </div>
      </div>
    </motion.header>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

export default function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200/50 ${
        hoverable ? 'hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

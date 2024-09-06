'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StockInput from './StockInput'
import StockData from './StockData'
import { motion } from 'framer-motion'

export default function StockAnalysis() {
  const [ticker, setTicker] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (symbol: string) => {
    setError('')
    try {
      const response = await fetch(`/api/stock-data?ticker=${symbol}`)
      const data = await response.json()
      if (response.ok) {
        setTicker(symbol)
      } else {
        setError(data.error || 'Failed to fetch stock data')
      }
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError('Error fetching stock data. Please try again.')
    }
  }
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-end mb-4">
        <motion.button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Logout
        </motion.button>
      </div>
      <StockInput onSubmit={handleSubmit} />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {ticker && <StockData ticker={ticker} />}
    </motion.div>
  )
}
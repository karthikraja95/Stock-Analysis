'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getTickerFromCompany } from '@/lib/companyTickers'

interface StockInputProps {
  onSubmit: (symbol: string) => void
}

export default function StockInput({ onSubmit }: StockInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const ticker = await getTickerFromCompany(input)
      onSubmit(ticker)
    } catch (error) {
      console.error('Error getting ticker:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter company ticker (e.g. AAPL)"
        className="input-field mb-4"
        disabled={isLoading}
      />
      <motion.button
        type="submit"
        className="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isLoading}
      >
        {isLoading ? 'Searching...' : 'Analyze Stock'}
      </motion.button>
    </motion.form>
  )
}
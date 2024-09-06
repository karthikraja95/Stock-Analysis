'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
      } else {
        setError(data.message || 'Invalid username or password')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold mb-2 text-center text-gray-800">NeuroSage</h1>
        <h2 className="text-2xl font-semibold mb-8 text-center text-gray-600">Stock Analysis</h2>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-lg">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="input-field mb-4"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field mb-6"
          />
          <motion.button
            type="submit"
            className="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Log In
          </motion.button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </form>
      </motion.div>
    </div>
  )
}
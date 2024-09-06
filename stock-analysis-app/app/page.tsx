import { cookies } from 'next/headers'
import StockAnalysis from './components/StockAnalysis'

export default function Home() {
  const cookieStore = cookies()
  const username = cookieStore.get('auth')?.value || 'Guest'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-5xl font-bold mb-4 text-gray-800">Stock Analysis</h1>
      <p className="text-xl mb-8 text-gray-600">Welcome, {username}!</p>
      <StockAnalysis />
    </main>
  )
}
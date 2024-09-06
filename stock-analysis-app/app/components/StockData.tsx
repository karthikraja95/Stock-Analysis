'use client'

import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { motion } from 'framer-motion'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface StockDataProps {
  ticker: string
}

export default function StockData({ ticker }: StockDataProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/stock-data?ticker=${ticker}`)
        if (!response.ok) {
          throw new Error('Failed to fetch stock data')
        }
        const result = await response.json()
        if (result.error) {
          throw new Error(result.error)
        }
        setData(result)
      } catch (err) {
        console.error('Error fetching stock data:', err)
        setError('Error fetching stock data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [ticker])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!data) return null

  const hasStockData = data.stockData && !data.stockData.error
  const hasFinancialData = data.financialData && !data.financialData.error

  return (
    <motion.div
      className="bg-white p-8 rounded-3xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold mb-6 text-center">{ticker} Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasStockData ? (
          <>
            <StockQuote data={data.stockData} />
            <HistoricalPriceChart data={data.historicalData} />
          </>
        ) : (
          <ErrorCard message="Failed to fetch stock data" />
        )}
        {hasFinancialData ? (
          <>
            <FinancialOverview data={data.financialData} />
            <AnalysisResult analysis={data.analysis} />
            <FinancialRatios data={data.financialData} />
            <GrowthMetrics data={data.financialData} />
          </>
        ) : (
          <ErrorCard message="Failed to fetch financial data" />
        )}
        <NewsSection news={data.newsData} />
      </div>
    </motion.div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Error</h3>
      <p className="text-red-500">{message}</p>
    </motion.div>
  )
}

function HistoricalPriceChart({ data }: { data: any[] }) {
  const [timeRange, setTimeRange] = useState('1M');

  const timeRanges = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365
  };

  const filteredData = data.slice(-timeRanges[timeRange]);

  const chartData = {
    labels: filteredData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Close Price',
        data: filteredData.map(item => item.close),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Price Chart',
      },
    },
  };

  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <div className="mb-4">
        {Object.keys(timeRanges).map(range => (
          <button
            key={range}
            className={`mr-2 px-2 py-1 rounded ${timeRange === range ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTimeRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
      <Line options={options} data={chartData} />
    </motion.div>
  );
}

function PriceChart({ data }: { data: any }) {
  const chartData = {
    labels: ['Previous Close', 'Open', 'Low', 'High', 'Current'],
    datasets: [
      {
        label: 'Price',
        data: [
          parseFloat(data.previousClose),
          parseFloat(data.open),
          parseFloat(data.low),
          parseFloat(data.high),
          parseFloat(data.price)
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Price Overview',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Price ($)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data Points',
        }
      }
    },
  }

  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <Line data={chartData} options={options} />
    </motion.div>
  )
}

function StockQuote({ data }: { data: any }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Stock Quote</h3>
      <p className="text-2xl font-bold mb-2">${data.price}</p>
      <p className={`text-lg ${parseFloat(data.change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {`$${data.change}`} ({data.changePercent}%)
      </p>
      <p className="text-gray-600">Volume: {parseInt(data.volume).toLocaleString()}</p>
    </motion.div>
  )
}

function FinancialOverview({ data }: { data: any }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Financial Overview</h3>
      <div className="grid grid-cols-2 gap-2">
        <MetricItem label="Market Cap" value={data.MarketCapitalization} />
        <MetricItem label="P/E Ratio" value={data.PERatio} />
        <MetricItem label="EPS" value={`$${data.EPS}`} />
        <MetricItem label="Dividend Yield" value={data.DividendYield} />
        <MetricItem label="52 Week High" value={`$${data['52WeekHigh']}`} />
        <MetricItem label="52 Week Low" value={`$${data['52WeekLow']}`} />
        <MetricItem label="Beta" value={data.Beta} />
        <MetricItem label="Debt/Equity" value={data.DebtToEquityRatio} />
      </div>
    </motion.div>
  )
}

function FinancialRatios({ data }: { data: any }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Financial Ratios</h3>
      <div className="grid grid-cols-2 gap-2">
        <MetricItem label="P/B Ratio" value={data.PriceToBookRatio} />
        <MetricItem label="P/S Ratio" value={data.PriceToSalesRatioTTM} />
        <MetricItem label="Debt/Equity" value={data.DebtToEquityRatio} />
        <MetricItem label="PEG Ratio" value={data.PEGRatio} />
        <MetricItem label="ROE" value={`${(parseFloat(data.ReturnOnEquityTTM) * 100).toFixed(2)}%`} />
        <MetricItem label="Operating Margin" value={`${(parseFloat(data.OperatingMarginTTM) * 100).toFixed(2)}%`} />
      </div>
    </motion.div>
  )
}

function GrowthMetrics({ data }: { data: any }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Growth & Cash Flow</h3>
      <div className="grid grid-cols-2 gap-2">
        <MetricItem label="Earnings Growth" value={data.EarningsGrowth} />
        <MetricItem label="Revenue Growth" value={data.RevenueGrowth} />
        <MetricItem label="Free Cash Flow" value={data.FreeCashFlow} />
        <MetricItem label="Dividend Payout" value={data.DividendPayout} />
      </div>
    </motion.div>
  )
}


function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

function formatPercentage(value: string | number | undefined): string {
  if (value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatCurrency(value: string | number | undefined): string {
  if (value === undefined || isNaN(Number(value))) {
    return 'N/A';
  }
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function AnalysisResult({ analysis }: { analysis: any }) {
  return (
    <motion.div className="card" whileHover={{ scale: 1.05 }}>
      <h3 className="text-xl font-semibold mb-4">Analysis</h3>
      <div className="grid grid-cols-2 gap-2">
        <MetricItem label="Recommendation" value={analysis.recommendation} />
        <MetricItem label="Price Target" value={`$${analysis.priceTarget}`} />
        <MetricItem label="Potential Upside" value={analysis.upside} />
        <MetricItem label="Risk Level" value={analysis.riskLevel} />
      </div>
      <p className="mt-4 text-sm text-gray-600">{analysis.summary}</p>
    </motion.div>
  )
}

function NewsSection({ news }: { news: any[] }) {
  if (!news || news.length === 0) {
    return (
      <motion.div className="card col-span-full" whileHover={{ scale: 1.02 }}>
        <h3 className="text-xl font-semibold mb-4">Recent News</h3>
        <p>No recent news available.</p>
      </motion.div>
    )
  }

  return (
    <motion.div className="card col-span-full" whileHover={{ scale: 1.02 }}>
      <h3 className="text-xl font-semibold mb-4">Recent News</h3>
      <ul className="space-y-2">
        {news.map((article, index) => (
          <li key={index}>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
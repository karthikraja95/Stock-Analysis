'use client'
import ReactMarkdown from 'react-markdown';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import StockGraphs from './StockGraphs'
import PerformanceChart from './PerformanceChart'

interface StockDataProps {
  ticker: string
}

export default function StockData({ ticker }: StockDataProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('analysis')
  const [intradayData, setIntradayData] = useState<any[]>([])

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [stockDataResponse, intradayDataResponse] = await Promise.all([
          fetch(`/api/stock-data?ticker=${ticker}`),
          fetch(`/api/intraday-data?ticker=${ticker}`)
        ]);

        if (!stockDataResponse.ok || !intradayDataResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const stockDataResult = await stockDataResponse.json();
        const intradayDataResult = await intradayDataResponse.json();

        if (stockDataResult.error) {
          throw new Error(stockDataResult.error);
        }

        setData(stockDataResult);
        setIntradayData(intradayDataResult);
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error fetching data. Please try again.')
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
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'analysis' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-1 gap-6">
            {hasStockData ? (
              <Card title="Stock Quote">
                <StockQuote data={data.stockData} />
              </Card>
            ) : (
              <ErrorCard message="Failed to fetch stock data" />
            )}
            {hasFinancialData && (
              <>
                <Card title="Growth & Cash Flow">
                  <GrowthMetrics data={data.financialData} />
                </Card>
                <Card title="Analysis">
                  <AnalysisResult analysis={data.analysis} />
                </Card>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 gap-6">
            {hasFinancialData ? (
              <>
                <Card title="Financial Overview">
                  <FinancialOverview data={data.financialData} />
                </Card>
                <Card title="Financial Ratios">
                  <FinancialRatios data={data.financialData} />
                </Card>
                <Card title="Performance">
                  <PerformanceChart historicalData={data.historicalData} intradayData={intradayData} />
                </Card>
              </>
            ) : (
              <ErrorCard message="Failed to fetch financial data" />
            )}
          </div>
          {data.historicalData && data.historicalData.length > 0 ? (
            <div className="col-span-full">
              <Card title="Stock Price and Volume History">
                <StockGraphs historicalData={data.historicalData} />
              </Card>
            </div>
          ) : (
            <p className="col-span-full text-center text-gray-500">No historical data available for graph</p>
          )}
          <div className="col-span-full">
            <Card title="Recent News">
              <NewsSection news={data.newsData} />
            </Card>
          </div>
        </div>
      ) : (
        <Link href="/portfolio" className="text-blue-500 hover:underline">
          Go to Portfolio
        </Link>
      )}
    </motion.div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-gray-50 p-4 rounded-xl shadow-md h-full flex flex-col"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="flex-grow">{children}</div>
    </motion.div>
  )
}

function Tabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="flex mb-6">
      <button
        className={`mr-4 pb-2 ${activeTab === 'analysis' ? 'border-b-2 border-blue-500' : ''}`}
        onClick={() => setActiveTab('analysis')}
      >
        Analysis
      </button>
      <button
        className={`pb-2 ${activeTab === 'portfolio' ? 'border-b-2 border-blue-500' : ''}`}
        onClick={() => setActiveTab('portfolio')}
      >
        Portfolio
      </button>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">Error</h3>
      <p className="text-red-500">{message}</p>
    </div>
  )
}

function StockQuote({ data }: { data: any }) {
  return (
    <div>
      <p className="text-2xl font-bold mb-2">${data.price}</p>
      <p className={`text-lg ${parseFloat(data.change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {`$${data.change}`} ({data.changePercent}%)
      </p>
      <p className="text-gray-600">Volume: {parseInt(data.volume).toLocaleString()}</p>
    </div>
  )
}

function FinancialOverview({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricItem label="Market Cap" value={data.MarketCapitalization} />
      <MetricItem label="P/E Ratio" value={data.PERatio} />
      <MetricItem label="EPS" value={`$${data.EPS}`} />
      <MetricItem label="Dividend Yield" value={data.DividendYield} />
      <MetricItem label="52 Week High" value={`$${data['52WeekHigh']}`} />
      <MetricItem label="52 Week Low" value={`$${data['52WeekLow']}`} />
      <MetricItem label="Beta" value={data.Beta} />
      <MetricItem label="EBITDA" value={data.EBITDA} />
    </div>
  )
}

function FinancialRatios({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricItem label="P/B Ratio" value={data.PriceToBookRatio} />
      <MetricItem label="P/S Ratio" value={data.PriceToSalesRatioTTM} />
      <MetricItem label="Debt/Equity" value={data.DebtToEquityRatio} />
      <MetricItem label="PEG Ratio" value={data.PEGRatio} />
      <MetricItem label="ROE" value={`${(parseFloat(data.ReturnOnEquityTTM)).toFixed(2)}%`} />
      <MetricItem label="Operating Margin" value={`${(parseFloat(data.OperatingMarginTTM)).toFixed(2)}%`} />
    </div>
  )
}


function GrowthMetrics({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <MetricItem label="Earnings Growth" value={data.EarningsGrowth} />
      <MetricItem label="Revenue Growth" value={data.RevenueGrowth} />
      <MetricItem label="Free Cash Flow" value={data.FreeCashFlow} />
      <MetricItem label="Dividend Payout" value={data.DividendPayout} />
    </div>
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

function AnalysisResult({ analysis }: { analysis: any }) {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <MetricItem label="Recommendation" value={analysis.recommendation} />
        <MetricItem label="Price Target" value={`$${analysis.priceTarget}`} />
        <MetricItem label="Potential Upside" value={analysis.upside} />
        <MetricItem label="Risk Level" value={analysis.riskLevel} />
      </div>
      <div className="mt-auto">
        <h4 className="text-lg font-semibold mb-2">Summary</h4>
        <div className="text-sm text-gray-600 leading-relaxed">
          <ReactMarkdown
            components={{
              h3: ({ node, ...props }) => (
                <h3 className="text-base font-semibold mt-4 mb-2" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside ml-4" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="mb-1" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mt-2" {...props} />
              ),
            }}
          >
            {analysis.summary}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}


function NewsSection({ news }: { news: any[] }) {
  if (!news || news.length === 0) {
    return <p>No recent news available.</p>
  }

  return (
    <ul className="space-y-2">
      {news.map((article, index) => (
        <li key={index}>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {article.title}
          </a>
        </li>
      ))}
    </ul>
  )
}
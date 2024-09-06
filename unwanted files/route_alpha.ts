import { NextResponse } from 'next/server'
import axios from 'axios'
import NodeCache from 'node-cache'

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY
const NEWS_API_KEY = process.env.NEWS_API_KEY

const cache = new NodeCache({ stdTTL: 900 }) // 15 minutes TTL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get('ticker')

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
  }

  const cacheKey = `stock_data_${ticker}`
  const cachedData = cache.get(cacheKey)

  if (cachedData) {
    return NextResponse.json(cachedData)
  }

  try {
    const [stockData, financialData, newsData] = await Promise.all([
      fetchStockData(ticker),
      fetchFinancialData(ticker),
      fetchNewsData(ticker),
    ])

    const analysisResult = analyzeStockData(stockData, financialData)

    const result = {
      stockData,
      financialData,
      newsData,
      analysis: analysisResult,
    }

    cache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

async function fetchStockData(ticker: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    console.log('Fetching stock data from URL:', url);
    const response = await axios.get(url)
    console.log('Alpha Vantage API response:', JSON.stringify(response.data, null, 2))

    const data = response.data['Global Quote']
    if (!data || Object.keys(data).length === 0) {
      console.error('No stock data found in the API response')
      throw new Error('No stock data found')
    }

    return {
      symbol: data['01. symbol'] || ticker,
      open: data['02. open'] || 'N/A',
      high: data['03. high'] || 'N/A',
      low: data['04. low'] || 'N/A',
      price: data['05. price'] || 'N/A',
      volume: data['06. volume'] || 'N/A',
      previousClose: data['08. previous close'] || 'N/A',
      change: data['09. change'] || 'N/A',
      changePercent: data['10. change percent'] || 'N/A',
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data)
    }
    throw error; // Rethrow the error to be caught in the main GET function
  }
}

async function fetchFinancialData(ticker: string) {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('Error fetching financial data:', error)
    return {}
  }
}

async function fetchNewsData(ticker: string) {
  try {
    const url = `https://newsapi.org/v2/everything?q=${ticker}&apiKey=${NEWS_API_KEY}&pageSize=5`
    const response = await axios.get(url)
    
    if (response.data && Array.isArray(response.data.articles)) {
      return response.data.articles.map((article: any) => ({
        title: article.title || 'No title',
        url: article.url || '#',
      })).slice(0, 5)
    } else {
      console.error('Unexpected news data structure:', response.data)
      return []
    }
  } catch (error) {
    console.error('Error fetching news data:', error)
    return []
  }
}

function analyzeStockData(stockData: any, financialData: any) {
  const currentPrice = parseFloat(stockData.price) || 0;
  const peRatio = parseFloat(financialData.PERatio) || 0;
  const pbRatio = parseFloat(financialData.PriceToBookRatio) || 0;
  const peg = parseFloat(financialData.PEGRatio) || 0;
  const beta = parseFloat(financialData.Beta) || 1;
  const roe = parseFloat(financialData.ReturnOnEquityTTM) || 0;

  let recommendation = 'Hold';
  let priceTarget = currentPrice;
  let upside = '0%';
  let riskLevel = 'Moderate';
  let summary = '';

  if (peRatio > 0 && pbRatio > 0 && peg > 0) {
    if (peRatio < 15 && pbRatio < 1.5 && peg < 1) {
      recommendation = 'Strong Buy';
      priceTarget = currentPrice * 1.2;
      upside = '20%';
      riskLevel = 'Low';
      summary = 'The stock appears undervalued with strong growth prospects.';
    } else if (peRatio > 30 || pbRatio > 3 || peg > 2) {
      recommendation = 'Sell';
      priceTarget = currentPrice * 0.9;
      upside = '-10%';
      riskLevel = 'High';
      summary = 'The stock seems overvalued compared to its fundamentals.';
    }
  } else {
    summary = 'Insufficient data to make a comprehensive analysis.';
  }

  if (beta > 1.5) {
    riskLevel = 'High';
    summary += ' The stock shows high volatility compared to the market.';
  } else if (beta < 0.5) {
    riskLevel = 'Low';
    summary += ' The stock shows low volatility compared to the market.';
  }

  if (roe > 0.2) {
    summary += ' The company demonstrates strong profitability and efficient use of equity.';
  } else if (roe > 0 && roe < 0.1) {
    summary += ' The company\'s profitability and use of equity could be improved.';
  }

  return {
    recommendation,
    priceTarget: priceTarget.toFixed(2),
    upside,
    riskLevel,
    summary: summary.trim()
  };
}
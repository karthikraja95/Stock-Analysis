import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import NodeCache from 'node-cache'


const cache = new NodeCache({ stdTTL: 300 }) // 5 minutes TTL

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
    
    const [stockData, financialData, newsData, historicalData] = await Promise.all([
      fetchStockData(ticker),
      fetchFinancialData(ticker),
      fetchNewsData(ticker),
      fetchHistoricalData(ticker),
    ]);

    const analysisResult = analyzeStockData(stockData, financialData);

    const result = {
      stockData,
      financialData,
      newsData,
      analysis: analysisResult,
      historicalData,
    };

    cache.set(cacheKey, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

async function fetchStockData(ticker: string) {
  try {
    const quote = await yahooFinance.quote(ticker);
    if (!quote || !quote.symbol) {
      throw new Error(`No data found for ticker: ${ticker}`);
    }
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 'N/A',
      open: quote.regularMarketOpen || 'N/A',
      high: quote.regularMarketDayHigh || 'N/A',
      low: quote.regularMarketDayLow || 'N/A',
      volume: quote.regularMarketVolume || 'N/A',
      previousClose: quote.regularMarketPreviousClose || 'N/A',
      change: quote.regularMarketChange || 'N/A',
      changePercent: quote.regularMarketChangePercent || 'N/A',
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw new Error(`Failed to fetch data for ${ticker}`);
  }
}


async function fetchFinancialData(ticker: string) {
  try {
    const quoteSummary = await yahooFinance.quoteSummary(ticker, {
      modules: ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics', 'cashflowStatementHistory']
    });

    const { price, summaryDetail, financialData, defaultKeyStatistics , cashflowStatementHistory} = quoteSummary;

    // Helper function to format percentage
    const formatPercentage = (value: number | undefined) => 
      value !== undefined ? `${(value * 100).toFixed(2)}%` : 'N/A';

    // Helper function to format currency in millions
    const formatMillions = (value: number | undefined) =>
      value !== undefined ? `$${(value / 1e6).toFixed(2)}M` : 'N/A';

    // Calculate P/CF ratio if possible
    const priceToCashFlowRatio = financialData.operatingCashflow && price.regularMarketPrice
      ? (price.regularMarketPrice * (price.sharesOutstanding || 1)) / financialData.operatingCashflow
      : 'N/A';

    return {
      MarketCapitalization: price.marketCap 
        ? `$${(price.marketCap / 1e9).toFixed(2)}B` 
        : 'N/A',
      PERatio: defaultKeyStatistics.forwardPE || defaultKeyStatistics.trailingPE || 'N/A',
      EPS: defaultKeyStatistics.trailingEps || 'N/A',
      DividendYield: summaryDetail.dividendYield 
        ? `${(summaryDetail.dividendYield * 100).toFixed(2)}%`
        : 'N/A',
      '52WeekHigh': summaryDetail.fiftyTwoWeekHigh || 'N/A',
      '52WeekLow': summaryDetail.fiftyTwoWeekLow || 'N/A',
      Beta: summaryDetail.beta || 'N/A',
      DebtToEquityRatio: financialData.debtToEquity || 'N/A',
      PriceToBookRatio: defaultKeyStatistics.priceToBook || 'N/A',
      PriceToSalesRatioTTM: summaryDetail.priceToSalesTrailing12Months || 'N/A',
      ReturnOnEquityTTM: financialData.returnOnEquity 
        ? `${(financialData.returnOnEquity * 100).toFixed(2)}%`
        : 'N/A',
      OperatingMarginTTM: financialData.operatingMargins 
        ? `${(financialData.operatingMargins * 100).toFixed(2)}%`
        : 'N/A',
      RevenueGrowth: financialData.revenueGrowth
        ? `${(financialData.revenueGrowth * 100).toFixed(2)}%`
        : 'N/A',
      EarningsGrowth: financialData.earningsGrowth
        ? `${(financialData.earningsGrowth * 100).toFixed(2)}%`
        : 'N/A',
      FreeCashFlow: financialData.freeCashflow
        ? `$${(financialData.freeCashflow / 1e6).toFixed(2)}M`
        : 'N/A',
      PayoutRatio: summaryDetail.payoutRatio
        ? `${(summaryDetail.payoutRatio * 100).toFixed(2)}%`
        : 'N/A',
      CurrentPrice: financialData.currentPrice || 'N/A',
      TargetHighPrice: financialData.targetHighPrice || 'N/A',
      TargetLowPrice: financialData.targetLowPrice || 'N/A',
      TargetMeanPrice: financialData.targetMeanPrice || 'N/A',
      TargetMedianPrice: financialData.targetMedianPrice || 'N/A',
      RecommendationMean: financialData.recommendationMean || 'N/A',
      RecommendationKey: financialData.recommendationKey || 'N/A',
      NumberOfAnalystOpinions: financialData.numberOfAnalystOpinions || 'N/A',
      TotalCash: financialData.totalCash 
        ? `$${(financialData.totalCash / 1e9).toFixed(2)}B`
        : 'N/A',
      TotalCashPerShare: financialData.totalCashPerShare || 'N/A',
      EBITDA: financialData.ebitda
        ? `$${(financialData.ebitda / 1e9).toFixed(2)}B`
        : 'N/A',
      TotalDebt: financialData.totalDebt
        ? `$${(financialData.totalDebt / 1e9).toFixed(2)}B`
        : 'N/A',
      QuickRatio: financialData.quickRatio || 'N/A',
      CurrentRatio: financialData.currentRatio || 'N/A',
      TotalRevenue: financialData.totalRevenue
        ? `$${(financialData.totalRevenue / 1e9).toFixed(2)}B`
        : 'N/A',
      RevenuePerShare: financialData.revenuePerShare || 'N/A',
      ReturnOnAssets: financialData.returnOnAssets
        ? `${(financialData.returnOnAssets * 100).toFixed(2)}%`
        : 'N/A',
      GrossProfits: financialData.grossProfits
        ? `$${(financialData.grossProfits / 1e9).toFixed(2)}B`
        : 'N/A',
      OperatingCashflow: financialData.operatingCashflow
        ? `$${(financialData.operatingCashflow / 1e9).toFixed(2)}B`
        : 'N/A',
      GrossMargins: financialData.grossMargins
        ? `${(financialData.grossMargins * 100).toFixed(2)}%`
        : 'N/A',
      EBITDAMargins: financialData.ebitdaMargins
        ? `${(financialData.ebitdaMargins * 100).toFixed(2)}%`
        : 'N/A',
      ProfitMargins: financialData.profitMargins
        ? `${(financialData.profitMargins * 100).toFixed(2)}%`
        : 'N/A',
      FinancialCurrency: financialData.financialCurrency || 'N/A',

      PEGRatio: defaultKeyStatistics.pegRatio || 'N/A',
      PriceToCashFlowRatio: priceToCashFlowRatio !== 'N/A' ? priceToCashFlowRatio.toFixed(2) : 'N/A',

      // Growth & Cash Flow
      EarningsGrowth: formatPercentage(financialData.earningsGrowth),
      RevenueGrowth: formatPercentage(financialData.revenueGrowth),
      FreeCashFlow: formatMillions(financialData.freeCashflow),
      DividendPayout: formatPercentage(summaryDetail.payoutRatio),

      // Additional fields that might be useful
      PEGRatio: defaultKeyStatistics.pegRatio || 'N/A',
      ForwardPE: defaultKeyStatistics.forwardPE || 'N/A',
      PriceToCashflow: defaultKeyStatistics.priceToOperatingCashflows || 'N/A',
    
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
    throw error;
  }
}

async function fetchHistoricalData(ticker: string) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    const query = ticker;
    const queryOptions = {
      period1: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      period2: endDate.toISOString().split('T')[0],
      interval: '1d'
    };
    const moduleOptions = {
      return: 'array' // Ensure we get an array of results
    };

    const result = await yahooFinance.chart(query, queryOptions, moduleOptions);

    if (!result || !result.quotes || result.quotes.length === 0) {
      console.log('No historical data found for ticker:', ticker);
      return [];
    }

    const historicalData = result.quotes.map(item => ({
      date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      close: item.close,
      volume: item.volume
    }));

    console.log('Fetched historical data:', historicalData);

    return historicalData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}



async function fetchNewsData(ticker: string) {
  try {
    const news = await yahooFinance.search(ticker, { newsCount: 5 })
    return news.news.map((article: any) => ({
      title: article.title,
      url: article.link,
    }))
  } catch (error) {
    console.error('Error fetching news data:', error)
    return []
  }
}


function analyzeStockData(stockData: any, financialData: any) {
  let recommendation = "";
  let priceTarget = 0;
  let riskLevel = "";
  let analysis = "";

  const currentPrice = parseFloat(stockData.price) || 0;
  const pegRatio = parseFloat(financialData.PEGRatio) || 0;
  const roe = parseFloat(financialData.ReturnOnEquityTTM) || 0;
  const earningsGrowth = parseFloat(financialData.EarningsGrowth) || 0;
  const beta = parseFloat(financialData.Beta) || 1;
  const debtEquity = parseFloat(financialData.DebtToEquityRatio) || 0;
  const operatingMargin = parseFloat(financialData.OperatingMarginTTM) || 0;
  const revenueGrowth = parseFloat(financialData.RevenueGrowth) || 0;
  const peRatio = parseFloat(financialData.PERatio) || 0;
  const industryAvgPE = 20; // This should be dynamically fetched or calculated
  const dividendYield = parseFloat(financialData.DividendYield) || 0;
  const dividendPayout = parseFloat(financialData.PayoutRatio) || 0;

  // Determine recommendation
  if (pegRatio < 1 && roe > 15 && earningsGrowth > 10) {
    recommendation = "Strong Buy";
  } else if (pegRatio < 1.5 && roe > 10 && earningsGrowth > 5) {
    recommendation = "Buy";
  } else if (pegRatio < 2 && roe > 5) {
    recommendation = "Hold";
  } else {
    recommendation = "Sell";
  }

  // Calculate price target and potential upside
  priceTarget = currentPrice * (1 + (earningsGrowth / 100));
  let upside = ((priceTarget - currentPrice) / currentPrice * 100).toFixed(2) + '%';

  // Determine risk level
  if (beta < 0.8) {
    riskLevel = "Low";
  } else if (beta < 1.2) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  // Generate analysis text
  analysis += "Financial Strength: ";
  if (debtEquity < 50) {
    analysis += "The company has a strong balance sheet with low debt levels. ";
  } else {
    analysis += "The company's debt levels are relatively high, which may impact financial flexibility. ";
  }

  analysis += "Profitability: ";
  if (operatingMargin > 20) {
    analysis += "Impressive operating margins indicate efficient operations. ";
  } else {
    analysis += "Operating margins suggest room for improvement in operational efficiency. ";
  }

  analysis += "Growth Prospects: ";
  if (revenueGrowth > 10 && earningsGrowth > 10) {
    analysis += "The company demonstrates strong revenue and earnings growth, indicating positive future prospects. ";
  } else {
    analysis += "Growth metrics suggest challenges in maintaining consistent expansion. ";
  }

  analysis += "Valuation: ";
  if (peRatio < industryAvgPE) {
    analysis += "The stock appears undervalued compared to industry peers. ";
  } else {
    analysis += "The stock's valuation seems rich relative to its fundamentals. ";
  }

  analysis += "Dividend: ";
  if (dividendYield > 2 && dividendPayout < 60) {
    analysis += "The company offers an attractive and sustainable dividend, appealing to income-focused investors. ";
  } else if (dividendYield > 0) {
    analysis += "The dividend payout appears sustainable, but may not be a primary factor for investors. ";
  }

  return {
    recommendation,
    priceTarget: priceTarget.toFixed(2),
    upside,
    riskLevel,
    summary: analysis.trim()
  };
}


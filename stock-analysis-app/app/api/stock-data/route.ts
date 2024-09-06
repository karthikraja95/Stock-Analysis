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
    const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

    const historicalData = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    return historicalData;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return {
      error: `Failed to fetch financial data for ${ticker}`
    };
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
  const currentPrice = parseFloat(stockData.price) || 0;
  const peRatio = parseFloat(financialData.PERatio) || 0;
  const pbRatio = parseFloat(financialData.PriceToBookRatio) || 0;
  const beta = parseFloat(financialData.Beta) || 1;
  const roe = parseFloat(financialData.ReturnOnEquityTTM) || 0;
  const recommendationMean = parseFloat(financialData.RecommendationMean) || 3;

  let recommendation = financialData.RecommendationKey || 'Hold';
  let priceTarget = parseFloat(financialData.TargetMedianPrice) || currentPrice;
  let upside = ((priceTarget - currentPrice) / currentPrice * 100).toFixed(2) + '%';
  let riskLevel = 'Moderate';
  let summary = '';

  if (recommendationMean <= 2) {
    recommendation = 'Buy';
  } else if (recommendationMean >= 4) {
    recommendation = 'Sell';
  }

  if (beta > 1.5) {
    riskLevel = 'High';
    summary += 'The stock shows high volatility compared to the market. ';
  } else if (beta < 0.5) {
    riskLevel = 'Low';
    summary += 'The stock shows low volatility compared to the market. ';
  }

  if (roe > 20) {
    summary += 'The company demonstrates strong profitability and efficient use of equity. ';
  } else if (roe > 0 && roe < 10) {
    summary += 'The company\'s profitability and use of equity could be improved. ';
  }

  if (peRatio > 0 && pbRatio > 0) {
    if (peRatio < 15 && pbRatio < 1.5) {
      summary += 'The stock appears undervalued based on PE and PB ratios. ';
    } else if (peRatio > 30 || pbRatio > 3) {
      summary += 'The stock seems overvalued compared to its fundamentals. ';
    }
  } else {
    summary += 'Insufficient data to make a comprehensive valuation analysis. ';
  }

  return {
    recommendation,
    priceTarget: priceTarget.toFixed(2),
    upside,
    riskLevel,
    summary: summary.trim()
  };
}

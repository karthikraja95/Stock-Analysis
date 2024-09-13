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
      return [];
    }

    const historicalData = result.quotes.map(item => ({
      date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      close: item.close,
      volume: item.volume
    }));

    return historicalData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

async function fetchIntradayData(ticker: string) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const query = ticker;
    const queryOptions = {
      period1: Math.floor(startDate.getTime() / 1000), // UNIX timestamp in seconds
      period2: Math.floor(endDate.getTime() / 1000),
      interval: '5m' // 5-minute intervals (adjust as needed)
    };
    const moduleOptions = {
      return: 'array' // Ensure we get an array of results
    };

    const result = await yahooFinance.chart(query, queryOptions, moduleOptions);

    if (!result || !result.quotes || result.quotes.length === 0) {
      return [];
    }

    const intradayData = result.quotes.map(item => ({
      date: item.date.toISOString(), // Keep full ISO string for intraday data
      close: item.close,
      volume: item.volume
    }));

    return intradayData;
  } catch (error) {
    console.error('Error fetching intraday data:', error);
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

  // Parse numerical values from the financial data
  const currentPrice = parseFloat(financialData.CurrentPrice) || 0;
  const targetMeanPrice = parseFloat(financialData.TargetMeanPrice) || 0;
  const targetHighPrice = parseFloat(financialData.TargetHighPrice) || 0;
  const targetLowPrice = parseFloat(financialData.TargetLowPrice) || 0;

  const peRatio = parseFloat(financialData.PERatio) || 0;
  const forwardPE = parseFloat(financialData.ForwardPE) || 0;
  const pegRatio = parseFloat(financialData.PEGRatio) || 0;

  const roe = parseFloat(financialData.ReturnOnEquityTTM) || 0;
  const roa = parseFloat(financialData.ReturnOnAssets) || 0;
  const operatingMargin = parseFloat(financialData.OperatingMarginTTM) || 0;
  const profitMargin = parseFloat(financialData.ProfitMargins) || 0;
  const grossMargin = parseFloat(financialData.GrossMargins) || 0;

  const revenueGrowth = parseFloat(financialData.RevenueGrowth) || 0;
  const earningsGrowth = parseFloat(financialData.EarningsGrowth) || 0;

  const debtEquity = parseFloat(financialData.DebtToEquityRatio) || 0;
  const currentRatio = parseFloat(financialData.CurrentRatio) || 0;
  const quickRatio = parseFloat(financialData.QuickRatio) || 0;

  const freeCashFlow = parseFloat(financialData.FreeCashFlow) || 0;

  const dividendYield = parseFloat(financialData.DividendYield) || 0;
  const payoutRatio = parseFloat(financialData.PayoutRatio) || 0;

  const beta = parseFloat(financialData.Beta) || 1;

  // Initialize score
  let score = 0;
  const maxScore = 30; // Maximum possible score

  // Valuation Metrics
  if (peRatio > 0 && peRatio < 15) {
    score += 2; // Undervalued
  } else if (peRatio >= 15 && peRatio <= 25) {
    score += 1; // Fairly valued
  }

  if (pegRatio > 0 && pegRatio < 1) {
    score += 2; // Growth at reasonable price
  } else if (pegRatio >= 1 && pegRatio <= 2) {
    score += 1; // Reasonable PEG
  }

  // Profitability Metrics
  if (roe > 15) {
    score += 2; // High ROE
  } else if (roe >= 10 && roe <= 15) {
    score += 1; // Moderate ROE
  }

  if (roa > 10) {
    score += 2; // High ROA
  } else if (roa >= 5 && roa <= 10) {
    score += 1; // Moderate ROA
  }

  if (operatingMargin > 20) {
    score += 2; // High operating margin
  } else if (operatingMargin >= 10 && operatingMargin <= 20) {
    score += 1; // Moderate operating margin
  }

  if (profitMargin > 15) {
    score += 2; // High profit margin
  } else if (profitMargin >= 8 && profitMargin <= 15) {
    score += 1; // Moderate profit margin
  }

  if (grossMargin > 40) {
    score += 2; // High gross margin
  } else if (grossMargin >= 20 && grossMargin <= 40) {
    score += 1; // Moderate gross margin
  }

  // Growth Metrics
  if (earningsGrowth > 15) {
    score += 2; // Strong earnings growth
  } else if (earningsGrowth >= 5 && earningsGrowth <= 15) {
    score += 1; // Moderate earnings growth
  }

  if (revenueGrowth > 10) {
    score += 2; // Strong revenue growth
  } else if (revenueGrowth >= 5 && revenueGrowth <= 10) {
    score += 1; // Moderate revenue growth
  }

  // Financial Health Metrics
  if (debtEquity >= 0 && debtEquity < 0.5) {
    score += 2; // Low leverage
  } else if (debtEquity >= 0.5 && debtEquity <= 1) {
    score += 1; // Moderate leverage
  }

  if (currentRatio > 1.5) {
    score += 1; // Good liquidity
  }

  if (quickRatio > 1) {
    score += 1; // Good short-term liquidity
  }

  if (freeCashFlow > 0) {
    score += 2; // Positive free cash flow
  }

  // Dividend Metrics
  if (dividendYield > 2 && payoutRatio > 0 && payoutRatio < 60) {
    score += 2; // Attractive and sustainable dividend
  } else if (dividendYield > 0 && payoutRatio > 0) {
    score += 1; // Pays dividend
  }

  // Risk Metrics
  if (beta > 0 && beta < 1) {
    score += 2; // Low volatility
  } else if (beta >= 1 && beta <= 1.5) {
    score += 1; // Moderate volatility
  }

  // Price Target and Upside Potential
  if (targetMeanPrice > 0) {
    priceTarget = targetMeanPrice;
  } else {
    priceTarget = calculatePriceTarget(financialData);
  }

  let upsidePercentage = ((priceTarget - currentPrice) / currentPrice) * 100;
  let upside = upsidePercentage.toFixed(2) + '%';

  if (upsidePercentage >= 20) {
    score += 2; // High upside potential
  } else if (upsidePercentage >= 0 && upsidePercentage < 20) {
    score += 1; // Some upside potential
  }

  // Determine Recommendation based on Total Score
  if (score >= 22) {
    recommendation = "Strong Buy";
  } else if (score >= 16) {
    recommendation = "Buy";
  } else if (score >= 10) {
    recommendation = "Hold";
  } else {
    recommendation = "Sell";
  }

  // Determine Risk Level
  if (beta > 0 && beta < 1 && debtEquity >= 0 && debtEquity < 0.5) {
    riskLevel = "Low";
  } else if ((beta >= 1 && beta <= 1.5) || (debtEquity >= 0.5 && debtEquity <= 1)) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "High";
  }

  // Generate Concise Summary
  const strengths = [];
  const weaknesses = [];
  
  // Identify strengths
  if (roe >= 15) strengths.push("High return on equity");
  if (operatingMargin >= 20) strengths.push("Strong operating margin");
  if (earningsGrowth >= 15) strengths.push("Robust earnings growth");
  if (revenueGrowth >= 10) strengths.push("Solid revenue growth");
  if (freeCashFlow > 0) strengths.push("Positive free cash flow");
  if (debtEquity > 0 && debtEquity < 50) strengths.push("Low debt levels");
  if (dividendYield >= 2 && payoutRatio > 0 && payoutRatio < 60)
    strengths.push("Attractive and sustainable dividend");

  // Identify weaknesses
  if (peRatio >= 25) weaknesses.push("High P/E ratio indicating potential overvaluation");
  if (pegRatio >= 2) weaknesses.push("High PEG ratio suggesting price may not justify growth");
  if (roe < 10) weaknesses.push("Low return on equity");
  if (operatingMargin < 10) weaknesses.push("Low operating margin");
  if (earningsGrowth < 5) weaknesses.push("Weak earnings growth");
  if (revenueGrowth < 5) weaknesses.push("Weak revenue growth");
  if (debtEquity >= 100) weaknesses.push("High debt levels");
  if (dividendYield === 0) weaknesses.push("No dividend payments");
  
  // Construct summary paragraphs
  if (strengths.length > 0) {
    analysis += `**Strengths:** ${strengths.join(', ')}.\n\n`;
  }

  if (weaknesses.length > 0) {
    analysis += `**Weaknesses:** ${weaknesses.join(', ')}.\n\n`;
  }

  analysis += `Overall, the stock is rated as a **${recommendation}** with a **${riskLevel}** risk level. The price target is $${priceTarget.toFixed(2)}, suggesting an upside potential of ${upside}.`;

  return {
    recommendation,
    priceTarget: priceTarget.toFixed(2),
    upside,
    riskLevel,
    summary: analysis.trim(),
  };
}



function calculatePriceTarget(financialData: any) {
  // Parse required data
  let epsStr = financialData.EPS || '0';
  let peRatioStr = financialData.PERatio || '0';
  let forwardPEStr = financialData.ForwardPE || '0';
  let earningsGrowthStr = financialData.EarningsGrowth || '0';
  let targetMeanPriceStr = financialData.TargetMeanPrice || '0';
  let currentPriceStr = financialData.CurrentPrice || '0';
  let priceToSalesRatioStr = financialData.PriceToSalesRatioTTM || '0';
  let revenuePerShareStr = financialData.RevenuePerShare || '0';

  // Clean and parse the strings to numbers
  let eps = parseFloat(epsStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let peRatio = parseFloat(peRatioStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let forwardPE = parseFloat(forwardPEStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let earningsGrowth = parseFloat(earningsGrowthStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let targetMeanPrice = parseFloat(targetMeanPriceStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let currentPrice = parseFloat(currentPriceStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let priceToSalesRatio = parseFloat(priceToSalesRatioStr.toString().replace(/[^\d.-]/g, '')) || 0;
  let revenuePerShare = parseFloat(revenuePerShareStr.toString().replace(/[^\d.-]/g, '')) || 0;

  // Default P/E multiple if not available
  let peMultiple = 0;
  if (forwardPE > 0) {
    peMultiple = forwardPE;
  } else if (peRatio > 0) {
    peMultiple = peRatio;
  } else {
    peMultiple = 15; // Default P/E multiple
  }

  // Cap earnings growth to prevent unrealistic projections
  if (earningsGrowth <= -100) {
    earningsGrowth = -100;
  }

  // Projected EPS
  let projectedEPS = eps * (1 + earningsGrowth / 100);

  // If EPS or projected EPS is negative or zero, use alternative valuation methods
  if (projectedEPS <= 0) {
    // Try using Price-to-Sales ratio
    if (revenuePerShare > 0 && priceToSalesRatio > 0) {
      let priceTarget = revenuePerShare * priceToSalesRatio;
      return priceTarget;
    }
    // Use target mean price from analysts if available
    if (targetMeanPrice > 0) {
      return targetMeanPrice;
    }
    // Fallback to current price
    return currentPrice;
  }

  // Calculate price target using projected EPS and P/E multiple
  let priceTarget = projectedEPS * peMultiple;

  // Ensure price target is not negative or zero
  if (priceTarget <= 0) {
    // Try alternative methods
    if (targetMeanPrice > 0) {
      priceTarget = targetMeanPrice;
    } else {
      priceTarget = currentPrice;
    }
  }

  return priceTarget;
}



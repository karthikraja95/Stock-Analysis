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

  const cacheKey = `intraday_data_${ticker}`

  const cachedData = cache.get(cacheKey)

  if (cachedData) {
    return NextResponse.json(cachedData)
  }

  try {
    const intradayData = await fetchIntradayData(ticker)
    cache.set(cacheKey, intradayData)
    return NextResponse.json(intradayData)
  } catch (error) {
    console.error('Error fetching intraday data:', error)
    return NextResponse.json({ error: 'Failed to fetch intraday data' }, { status: 500 })
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
      interval: '5m' // 5-minute intervals
    };

    const result = await yahooFinance.chart(query, queryOptions);

    if (!result || !result.quotes || result.quotes.length === 0) {
      return [];
    }

    const intradayData = result.quotes.map(item => ({
      date: item.date.toISOString(),
      close: item.close,
      volume: item.volume
    }));

    return intradayData;
  } catch (error) {
    console.error('Error fetching intraday data:', error);
    return [];
  }
}
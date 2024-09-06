import yahooFinance from 'yahoo-finance2';

export async function getTickerFromCompany(input: string): Promise<string> {
  const normalizedInput = input.trim();
  
  try {
    // Search for the company using Yahoo Finance API
    const result = await yahooFinance.search(normalizedInput, { quotesCount: 1, newsCount: 0 });
    
    // Check if we got any quotes back
    if (result.quotes && result.quotes.length > 0) {
      const bestMatch = result.quotes[0];
      console.log(`Found match: ${bestMatch.shortname} (${bestMatch.symbol})`);
      return bestMatch.symbol;
    } else {
      console.log(`No match found for: ${normalizedInput}`);
      // If no match found, return the input as is (assuming it might be a valid ticker)
      return normalizedInput.toUpperCase();
    }
  } catch (error) {
    console.error('Error searching for company:', error);
    // In case of an error, return the input as is
    return normalizedInput.toUpperCase();
  }
}
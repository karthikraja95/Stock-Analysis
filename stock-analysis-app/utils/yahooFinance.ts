import yahooFinance from 'yahoo-finance2';

export async function getQuote(symbol: string) {
    try {
        const response = await yahooFinance.quote(symbol);
        return response;
    } catch (error) {
        console.error('Error fetching quote:', error);
        return null;
    }
}

export async function searchSymbols(query: string) {
    try {
        const result = await yahooFinance.search(query);
        return result.quotes;
    } catch (error) {
        console.error('Error searching symbols:', error);
        return [];
    }
}
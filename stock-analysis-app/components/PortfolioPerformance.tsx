import { useState, useEffect } from 'react';
import { Stock } from '@/types/Stock';
import { getQuote } from '@/utils/yahooFinance';

interface PortfolioPerformanceProps {
  portfolio: Stock[];
}

export default function PortfolioPerformance({ portfolio }: PortfolioPerformanceProps) {
  const [performance, setPerformance] = useState<{ totalValue: number; totalGainLoss: number; riskLevel: string }>({
    totalValue: 0,
    totalGainLoss: 0,
    riskLevel: 'Low',
  });

  useEffect(() => {
    const calculatePerformance = async () => {
      let totalValue = 0;
      let totalCost = 0;
      let volatility = 0;

      for (const stock of portfolio) {
        const quote = await getQuote(stock.symbol);
        if (quote && quote.regularMarketPrice !== undefined) {
          const currentValue = quote.regularMarketPrice * stock.quantity;
          totalValue += currentValue;
          totalCost += stock.purchasePrice * stock.quantity;
          volatility += quote.regularMarketChangePercent || 0;
        }
      }

      const totalGainLoss = totalValue - totalCost;
      const averageVolatility = portfolio.length > 0 ? volatility / portfolio.length : 0;
      let riskLevel = 'Low';
      if (averageVolatility > 2) riskLevel = 'High';
      else if (averageVolatility > 1) riskLevel = 'Medium';

      setPerformance({ totalValue, totalGainLoss, riskLevel });
    };

    if (portfolio.length > 0) {
      calculatePerformance();
    }
  }, [portfolio]);

  return (
    <div className="bg-gray-100 p-6 rounded">
      <h2 className="text-2xl font-bold mb-4">Portfolio Performance</h2>
      <div className="space-y-4">
        <p>Total Value: ${performance.totalValue.toFixed(2)}</p>
        <p>Total Gain/Loss: ${performance.totalGainLoss.toFixed(2)}</p>
        <p>Risk Level: {performance.riskLevel}</p>
      </div>
    </div>
  );
}
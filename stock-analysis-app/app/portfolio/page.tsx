'use client';

import { useState, useEffect } from 'react';
import PortfolioList from '@/components/PortfolioList';
import PortfolioPerformance from '@/components/PortfolioPerformance';
import AddStockForm from '@/components/AddStockForm';
import { Stock } from '@/types/Stock';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Stock[]>([]);

  useEffect(() => {
    // Load portfolio from localStorage on component mount
    const savedPortfolio = localStorage.getItem('portfolio');
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio));
    }
  }, []);

  useEffect(() => {
    // Save portfolio to localStorage whenever it changes
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const addStock = (newStock: Stock) => {
    setPortfolio([...portfolio, newStock]);
  };

  const removeStock = (symbol: string) => {
    setPortfolio(portfolio.filter(stock => stock.symbol !== symbol));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <AddStockForm addStock={addStock} />
          <PortfolioList portfolio={portfolio} removeStock={removeStock} />
        </div>
        <div>
          <PortfolioPerformance portfolio={portfolio} />
        </div>
      </div>
    </div>
  );
}
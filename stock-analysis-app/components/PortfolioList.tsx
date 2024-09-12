import { Stock } from '@/types/Stock';

interface PortfolioListProps {
  portfolio: Stock[];
  removeStock: (symbol: string) => void;
}

export default function PortfolioList({ portfolio, removeStock }: PortfolioListProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Stocks</h2>
      <ul className="space-y-4">
        {portfolio.map((stock) => (
          <li key={stock.symbol} className="flex justify-between items-center bg-gray-100 p-4 rounded">
            <div>
              <span className="font-bold">{stock.symbol}</span>
              <span className="ml-4">Qty: {stock.quantity}</span>
              <span className="ml-4">Price: ${stock.purchasePrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => removeStock(stock.symbol)}
              className="bg-red-500 text-white p-2 rounded"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
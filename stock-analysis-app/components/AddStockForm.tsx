import { useState } from 'react';
import { Stock } from '@/types/Stock';

interface AddStockFormProps {
  addStock: (stock: Stock) => void;
}

export default function AddStockForm({ addStock }: AddStockFormProps) {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol && quantity && purchasePrice) {
      addStock({
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        purchasePrice: parseFloat(purchasePrice),
      });
      setSymbol('');
      setQuantity('');
      setPurchasePrice('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Add Stock to Portfolio</h2>
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Stock Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Purchase Price"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Stock
        </button>
      </div>
    </form>
  );
}
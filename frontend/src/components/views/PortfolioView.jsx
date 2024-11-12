import { useState } from 'react';

const PortfolioView = () => {
  const [selectedStock, setSelectedStock] = useState(null);

  const portfolioStocks = [
    {
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 150,
      avgPrice: 145.23,
      currentPrice: 154.23,
      change: '+2.4%',
      value: 23134.50
    },
    {
      id: 2,
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 50,
      avgPrice: 2745.12,
      currentPrice: 2812.34,
      change: '+1.8%',
      value: 140617.00
    },
    {
      id: 3,
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 100,
      avgPrice: 234.56,
      currentPrice: 242.45,
      change: '+3.2%',
      value: 24245.00
    },
    {
      id: 4,
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      shares: 75,
      avgPrice: 856.22,
      currentPrice: 842.45,
      change: '-1.5%',
      value: 63183.75
    },
    {
      id: 5,
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      shares: 30,
      avgPrice: 3245.67,
      currentPrice: 3312.45,
      change: '+2.1%',
      value: 99373.50
    },
    {
      id: 6,
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      shares: 80,
      avgPrice: 324.56,
      currentPrice: 332.12,
      change: '+2.8%',
      value: 26569.60
    }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-800">Your Portfolio</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-lg font-bold text-gray-800">$377,123.35</p>
          </div>
          <button className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-sm">
            Add Stock
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioStocks.map((stock) => (
            <div 
              key={stock.id} 
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{stock.symbol}</h3>
                    <p className="text-xs text-gray-600">{stock.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    stock.change.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {stock.change}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares</span>
                    <span className="font-medium">{stock.shares}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Price</span>
                    <span className="font-medium">${stock.avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current</span>
                    <span className="font-medium">${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t">
                    <span className="text-gray-600">Value</span>
                    <span className="font-bold">${stock.value.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStock(stock)}
                  className="w-full bg-gray-50 text-gray-700 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span>View Analytics</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedStock && <StockAnalytics stock={selectedStock} onClose={() => setSelectedStock(null)} />}
    </div>
  );
};

export default PortfolioView;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { debounce } from 'lodash';

const market_data = {
  manufacturing_companies: {
    'Maruti Suzuki': 'MARUTI.NS',
    'Hero Motocorp': 'HEROMOTOCO.NS',
    'Bajaj Auto': 'BAJAJ-AUTO.NS',
  }
};

const PortfolioView = () => {
  const navigate = useNavigate();
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getSymbol = useCallback((name) => {
    return market_data.manufacturing_companies[name];
  }, []);

  const debouncedFetch = useCallback(
    debounce(async () => {
      try {
        setLoading(true);
        setError(null);

        const symbols = Object.values(market_data.manufacturing_companies);
        console.log('Fetching data for symbols:', symbols);

        if (symbols.length === 0) return;

        const queryString = symbols.map(s => `symbols=${encodeURIComponent(s)}`).join('&');
        const response = await fetch(
          `http://localhost:8000/api/stock-data/?${queryString}&type=individual&mode=daily`
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('API Response:', data);
        setStocksData(data);
      } catch (error) {
        console.error('Error fetching stocks data:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    }, 1000),
    [getSymbol]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const renderStockItem = (displayName) => {
    const symbol = getSymbol(displayName);
    const data = symbol ? stocksData[symbol] : null;
    
    console.log(`Rendering ${displayName}:`, { symbol, hasData: !!data, data });

    const formatNumber = (value) => {
      return value !== undefined && value !== null 
        ? Number(value).toFixed(2) 
        : '0.00';
    };

    return (
      <div 
        key={displayName} 
        className="bg-white p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
        onClick={() => navigate(`/stock/${displayName}`)}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">{displayName}</span>
          {data && (
            <span className={`text-xs font-medium ${
              data.day_change_percent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {data.day_change_percent >= 0 ? '+' : ''}
              {formatNumber(data.day_change_percent)}%
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
            </div>
          ) : data ? (
            <>
              <div className="flex justify-between items-center">
                <span>₹{formatNumber(data.current_price)}</span>
                <span className={`text-xs ${
                  data.day_change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {data.day_change >= 0 ? '▲' : '▼'} 
                  ₹{formatNumber(Math.abs(data.day_change))}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <span>H: ₹{formatNumber(data.high)}</span>
                <span className="mx-2">|</span>
                <span>L: ₹{formatNumber(data.low)}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-gray-400">
              {symbol || 'Symbol not found'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-800">Available Stocks</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Last market close</span>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(market_data.manufacturing_companies).map(stock => renderStockItem(stock))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioView;

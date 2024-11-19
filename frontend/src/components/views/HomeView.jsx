import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { debounce } from 'lodash';
import MarketAreaChart from '../charts/MarketAreaChart';
import NewsComponent from '../NewsComponent';

const market_data = {
  indices: {
    'SENSEX': '^BSESN',
    'NIFTY 50': '^NSEI',
    'NIFTY Bank': 'NSEBANK.NS',
    'NIFTY Auto': 'NIFTYAUTO.NS',
    'NIFTY IT': 'NIFTYIT.NS',
    'NIFTY Pharma': 'NIFTYPHARMA.NS',
    'NIFTY Metal': 'NIFTYMETAL.NS',
    'BSE SmallCap': '^BSESMC',
    'BSE MidCap': '^BSEMC',
  },
  manufacturing_companies: {
    'Maruti Suzuki': 'MARUTI.NS',
    'Hero Motocorp': 'HEROMOTOCO.NS',
    'Bajaj Auto': 'BAJAJ-AUTO.NS',
    'TVS Motor Co': 'TVSMOTOR.NS',
    'Accelya Solution': 'ACCELYA.NS',
    'Ashok Leyland': 'ASHOKLEY.NS',
    'Bombay Dyeing': 'BOMDYEING.NS',
    'Boss Packaging': 'BOSS-ST.NS', 
    'CG Power & Ind': 'CGPOWER.NS',
    'Danish Power': 'DANISH.NS',       
    'Delta Manufact': 'DELTAMAGNT.NS',
    'East India Drums': 'EASTINDIA.BO',
    'Gallops Enterp': 'GALLOPENT.BO',
    'Godawari Power': 'GPIL.BO',
    'Godrej Industrie': 'GODREJIND.NS',
    'GTL Infra': 'GTLINFRA.NS',
    'Indian Link Ch': 'INDIANLINK.BO',
    'Kamdhenu': 'KAMDHENU.NS',
    'Kronox Lab': 'KRONO.NS',
    'Omansh Enterpri': 'OMANSH.BO',
    'Petro Carbon': 'PETRO.BO',
    'Relicab Cable': 'RELCABLE.BO',
    'Shreyans Inds': 'SHREYANIND.NS',
    'SpiceJet': 'SPICEJET.NS',
    'Suzlon Energy': 'SUZLON.NS',
    'UPL': 'UPL.NS',
    'Vodafone Idea': 'IDEA.NS',
    'Wanbury': 'WANBURY.NS',
    'Yes Bank': 'YESBANK.NS',
  }
};

const CACHE_KEYS = {
  HISTORICAL_DATA: 'historicalMarketData',
  NEWS_DATA: 'newsData',
  WORLD_MARKETS: 'worldMarketsData',
  WATCHLIST: 'watchlistData'
};

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

const useWatchlistData = (watchlist) => {
  const [watchlistData, setWatchlistData] = useState({});
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState(null);

  const getSymbol = useCallback((name) => {
    const symbol = market_data.indices[name] || market_data.manufacturing_companies[name];
    console.log(`Symbol mapping for ${name}:`, symbol); // Debug log
    return symbol;
  }, []);

  const debouncedFetch = useCallback(
    debounce(async () => {
      try {
        setWatchlistLoading(true);
        setWatchlistError(null);

        const symbols = watchlist.map(item => getSymbol(item)).filter(Boolean);
        console.log('Fetching data for symbols:', symbols); // Debug log

        if (symbols.length === 0) return;

        const queryString = symbols.map(s => `symbols=${encodeURIComponent(s)}`).join('&');
        const response = await fetch(
          `http://localhost:8000/api/stock-data/?${queryString}&type=individual&mode=daily`
        );

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('API Response:', data);
        setWatchlistData(data);
      } catch (error) {
        console.error('Error fetching watchlist data:', error);
        setWatchlistError(error);
      } finally {
        setWatchlistLoading(false);
      }
    }, 1000),
    [watchlist, getSymbol]
  );

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  return { watchlistData, watchlistLoading, watchlistError };
};

const NEWS_API_KEY = 'a8702de48e714021a3f00bf5fd59b962';

const HomeView = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAnimation, setLoadingAnimation] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [worldMarketsData, setWorldMarketsData] = useState({});
  const [watchlist] = useState([
    'Maruti Suzuki',
    'Hero Motocorp',
    'Bajaj Auto'
  ]);

  const isReady = useMemo(() => {
    return !isLoading && historicalData.length > 0;
  }, [isLoading, historicalData]);

  useEffect(() => {
    console.log('Historical data updated:', historicalData);
    console.log('Loading state:', isLoading);
  }, [historicalData, isLoading]);

  useEffect(() => {
    if (historicalData.length > 0) {
      console.log('Data sample:', historicalData[0]);
      console.log('Data length:', historicalData.length);
    }
  }, [historicalData]);

  const fetchAndCacheData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEYS.HISTORICAL_DATA);
        if (cachedData) {
          const { data, timestamp, market_status } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setHistoricalData(data);
            setLoadingAnimation(false);
            setIsLoading(false);
            return;
          }
        }
      }

      setLoadingAnimation(true);
      setLoadError(false);
      
      const response = await fetch(
        'http://localhost:8000/api/stock-data/?symbols=^BSESN&symbols=^NSEI&type=historical'
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const { data, market_status } = await response.json();
      
      const processedData = data
        .map(item => ({
          date: new Date(item.date),
          primary: parseFloat(item['^BSESN']),
          secondary: parseFloat(item['^NSEI'])
        }))
        .filter(item => 
          item.date instanceof Date && 
          !isNaN(item.date) && 
          !isNaN(item.primary) && 
          !isNaN(item.secondary)
        )
        .sort((a, b) => a.date - b.date);

      localStorage.setItem(CACHE_KEYS.HISTORICAL_DATA, JSON.stringify({
        data: processedData,
        market_status,
        timestamp: Date.now()
      }));

      setHistoricalData(processedData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoadError(true);
    } finally {
      setLoadingAnimation(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Initializing data fetch...'); // Debug log
    fetchAndCacheData();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      console.log('Refreshing data...'); // Debug log
      fetchAndCacheData(true);
    }, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(intervalId);
  }, [fetchAndCacheData]);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    return 'Just now';
  };

  useEffect(() => {
    const fetchNews = async () => {
      const cachedNews = localStorage.getItem(CACHE_KEYS.NEWS_DATA);
      
      if (cachedNews) {
        const { data, timestamp } = JSON.parse(cachedNews);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setNews(data);
          setNewsLoading(false);
          return;
        }
      }

      try {
        setNewsLoading(true);
        const response = await fetch(
          `https://newsapi.org/v2/everything?` + 
          `q=indian%20stock%20market%20(sensex%20OR%20nifty)&` +
          `apiKey=${NEWS_API_KEY}&` +
          `language=en&` +
          `sortBy=publishedAt&` +
          `pageSize=10`  // Limit to 10 articles
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles) {
          const articles = data.articles.slice(0, 10);
          
          // Cache the news data
          localStorage.setItem(CACHE_KEYS.NEWS_DATA, JSON.stringify({
            data: articles,
            timestamp: Date.now()
          }));
          
          setNews(articles);
        } else {
          console.error('News API response format error:', data);
          setNews([]);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const fetchWorldMarkets = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'worldMarketsData';
    const cacheDuration = 2 * 60 * 60 * 1000;
    
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData && !forceRefresh) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < cacheDuration) {
        setWorldMarketsData(data);
        return;
      }
    }

    try {
      const symbols = [
        '^BSESN',    // BSE SENSEX
        '^NSEI',     // NIFTY 50
        '^GSPC',     // S&P 500 (US)
        '^IXIC',     // NASDAQ (US)
        '^N225',     // Nikkei 225 (Japan)
        '^HSI',      // Hang Seng (Hong Kong)
      ];
      const queryString = symbols.map(s => `symbols=${encodeURIComponent(s)}`).join('&');
      
      const response = await fetch(`http://localhost:8000/api/stock-data/?${queryString}&type=daily_change`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const rawData = await response.text();
      const data = JSON.parse(rawData.replace(/: *NaN/g, ': null'));
      
      // Process the data to match our expected format
      const processedData = {};
      for (const [symbol, info] of Object.entries(data)) {
        processedData[symbol] = {
          current_price: info.current_price || null,
          percent_change: info.percent_change || 0,
          prev_close: info.previous_price || null  // Note: API returns "previous_price" not "prev_close"
        };
      }

      localStorage.setItem(cacheKey, JSON.stringify({
        data: processedData,
        timestamp: Date.now()
      }));

      setWorldMarketsData(processedData);
    } catch (error) {
      console.error('Error fetching world markets data:', error);
      setWorldMarketsData({});
    }
  }, []);

  useEffect(() => {
    fetchWorldMarkets();
    const interval = setInterval(() => fetchWorldMarkets(true), 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWorldMarkets]);

  const marketConfig = {
    '^BSESN': { name: 'BSE SENSEX', currency: '₹', locale: 'en-IN' },
    '^NSEI': { name: 'NIFTY 50', currency: '₹', locale: 'en-IN' },
    '^GSPC': { name: 'S&P 500', currency: '$', locale: 'en-US' },
    '^IXIC': { name: 'NASDAQ', currency: '$', locale: 'en-US' },
    '^HSI': { name: 'Hang Seng', currency: 'HK$', locale: 'zh-HK' }
  };

  const getMarketStatus = (lastUpdate) => {
    const ist = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const currentTime = new Date(ist);
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Market hours: 9:15 AM to 3:30 PM IST
    const isMarketHours = (currentHour > 9 || (currentHour === 9 && currentMinute >= 15)) 
                         && (currentHour < 15 || (currentHour === 15 && currentMinute <= 30));
    const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;

    if (isWeekend) return 'Market Closed (Weekend)';
    if (!isMarketHours) return 'Market Closed';
    return 'Market Open';
  };

  const { watchlistData, watchlistLoading, watchlistError } = useWatchlistData(watchlist);

  const getSymbol = (name) => {
    return market_data.indices[name] || market_data.manufacturing_companies[name];
  };

  const renderWatchlistItem = (displayName) => {
    const symbol = getSymbol(displayName);
    const data = symbol ? watchlistData[symbol] : null;
    
    console.log(`Rendering ${displayName}:`, { 
      symbol, 
      hasData: !!data,
      data 
    }); // Enhanced debug log

    return (
      <div key={displayName} className="bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">{displayName}</span>
          {data && (
            <span className={`text-xs font-medium ${
              data.day_change_percent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {data.day_change_percent >= 0 ? '+' : ''}
              {data.day_change_percent.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {watchlistLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
            </div>
          ) : data ? (
            <>
              <div className="flex justify-between items-center">
                <span>₹{data.current_price.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2
                })}</span>
                <span className={`text-xs ${
                  data.day_change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {data.day_change >= 0 ? '▲' : '▼'} 
                  ₹{Math.abs(data.day_change).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <span>H: ₹{data.high.toLocaleString('en-IN', {
                  maximumFractionDigits: 2
                })}</span>
                <span className="mx-2">|</span>
                <span>L: ₹{data.low.toLocaleString('en-IN', {
                  maximumFractionDigits: 2
                })}</span>
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
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Market Overview</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {historicalData.length > 0 && `Last updated: ${new Date(historicalData[historicalData.length - 1].date).toLocaleDateString()}`}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              getMarketStatus() === 'Market Open' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {getMarketStatus()}
            </span>
          </div>
        </div>
        <div className="relative h-[200px]">
          {loadingAnimation ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-gray-400">Loading market data...</div>
              </div>
            </div>
          ) : loadError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500">
                Error loading market data. Please try again later.
              </div>
            </div>
          ) : !isReady ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400">
                {!historicalData.length ? 'No data available' : 'Preparing visualization...'}
              </div>
            </div>
          ) : (
            <MarketAreaChart 
              data={historicalData} 
              height={200}
              showNifty={true}
            />
          )}
        </div>
      </div>

      <div className="col-span-4">
        <NewsComponent 
          news={news} 
          loading={newsLoading}
          maxHeight="200px"
          title="Market News"
        />
      </div>

      <div className="col-span-4 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">World Markets</h2>
          <span className="text-xs text-gray-500">Last market close</span>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-auto">
          {Object.entries(worldMarketsData).map(([symbol, data]) => {
            const config = marketConfig[symbol];
            if (!config) return null;

            const formatPrice = (price) => {
              if (price === null) return 'N/A';
              return `${config.currency}${price.toLocaleString(config.locale)}`;
            };

            return (
              <div key={symbol} className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">{config.name}</span>
                  <span className="text-xs text-gray-400 block">
                    {data.as_of_date ? `As of ${data.as_of_date}` : 'Last close'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium block">
                    {formatPrice(data.current_price)}
                  </span>
                  <span className={`text-xs ${
                    data.percent_change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {data.percent_change >= 0 ? '+' : ''}{data.percent_change?.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="col-span-8 bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Available Stocks</h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Last market close</span>
            {watchlistLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-auto">
          {watchlist.map(item => renderWatchlistItem(item))}
        </div>
      </div>
    </div>
  );
};

export default HomeView;

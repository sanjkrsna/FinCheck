import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AreaClosed, Line, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { Group } from '@visx/group';
import { LinearGradient } from '@visx/gradient';
import { bisector } from 'd3-array';

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
    'Accelya Solution': 'ACCELYA.NS',
    'Ashok Leyland': 'ASHOKLEY.NS',
    'Bajaj Auto': 'BAJAJ-AUTO.NS',
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
    'Hero Motocorp': 'HEROMOTOCO.NS',
    'Indian Link Ch': 'INDIANLINK.BO',
    'Kamdhenu': 'KAMDHENU.NS',
    'Kronox Lab': 'KRONO.NS',
    'Maruti Suzuki': 'MARUTI.NS',
    'Omansh Enterpri': 'OMANSH.BO',
    'Petro Carbon': 'PETRO.BO',
    'Relicab Cable': 'RELCABLE.BO',
    'Shreyans Inds': 'SHREYANIND.NS',
    'SpiceJet': 'SPICEJET.NS',
    'Suzlon Energy': 'SUZLON.NS',
    'TVS Motor Co': 'TVSMOTOR.NS',
    'U. Y. Fincorp': 'UYFINCORP.BO',
    'UPL': 'UPL.NS',
    'Vodafone Idea': 'IDEA.NS',
    'Wanbury': 'WANBURY.NS',
    'Yes Bank': 'YESBANK.NS',
  }
};

const HomeView = () => {
  const [data, setData] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const height = 200;
  const margin = { top: 0, right: 0, bottom: 0, left: 0 };
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([
    'SENSEX',
    'NIFTY 50',
    'Maruti Suzuki',
    'Hero Motocorp',
    'Bajaj Auto',
    'TVS Motor Co'
  ]);
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [worldMarketsData, setWorldMarketsData] = useState({});
  const [loadingAnimation, setLoadingAnimation] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const xScale = useMemo(() => {
    if (!historicalData.length || !containerWidth) return null;
    return scaleTime({
      range: [0, containerWidth - margin.left - margin.right],
      domain: [
        Math.min(...historicalData.map(d => d.date)),
        Math.max(...historicalData.map(d => d.date))
      ],
    });
  }, [historicalData, containerWidth, margin]);

  const sensexScale = useMemo(() => {
    if (!historicalData.length) return null;
    const values = historicalData.map(d => d.sensex).filter(Boolean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return scaleLinear({
      range: [height, 0],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [historicalData, height]);

  const niftyScale = useMemo(() => {
    if (!historicalData.length) return null;
    const values = historicalData.map(d => d.nifty).filter(Boolean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return scaleLinear({
      range: [height, 0],
      domain: [min - padding, max + padding],
      nice: true,
    });
  }, [historicalData, height]);

  const isReady = useMemo(() => {
    const hasScales = xScale && sensexScale && niftyScale;
    const hasData = !isLoading && historicalData.length > 0;
    const hasContainer = containerWidth > 0;
    
    console.log('Ready check:', {
      hasScales,
      hasData,
      hasContainer,
      containerWidth,
      dataLength: historicalData.length
    });

    return hasScales && hasData && hasContainer;
  }, [isLoading, historicalData, containerWidth, xScale, sensexScale, niftyScale]);

  useEffect(() => {
    if (historicalData.length > 0) {
      console.log('Component state:', {
        dataLength: historicalData.length,
        containerWidth,
        hasXScale: !!xScale,
        hasSensexScale: !!sensexScale,
        hasNiftyScale: !!niftyScale,
        isReady
      });
    }
  }, [historicalData, containerWidth, xScale, sensexScale, niftyScale, isReady]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth !== containerWidth) {
          setContainerWidth(newWidth);
        }
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerWidth]);

  const fetchAndCacheData = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'marketData';
    const cacheDuration = 2 * 60 * 60 * 1000;
    
    try {
      setLoadingAnimation(true);
      setLoadError(false);
      
      // Simulate initial loading animation
      await new Promise(resolve => setTimeout(resolve, 5000));

      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData && !forceRefresh) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheDuration) {
          const processedData = data.map(item => ({
            ...item,
            date: new Date(item.date)
          }));
          setHistoricalData(processedData);
          setIsLoading(false);
          setLoadingAnimation(false);
          return;
        }
      }

      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/api/stock-data/?symbols=^BSESN&symbols=^NSEI&type=historical&t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (!Array.isArray(data)) {
        throw new Error('Expected array of data from API');
      }

      const processedData = data
        .map(item => {
          const date = new Date(item.date);
          const sensex = parseFloat(item['^BSESN']);
          const nifty = parseFloat(item['^NSEI']);
          
          if (!isNaN(sensex) && !isNaN(nifty) && date instanceof Date && !isNaN(date)) {
            return { date, sensex, nifty };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);

      console.log('Processed data:', processedData);

      if (processedData.length === 0) {
        throw new Error('No valid data points after processing');
      }

      localStorage.setItem(cacheKey, JSON.stringify({
        data: processedData,
        timestamp: Date.now()
      }));

      setHistoricalData(processedData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoadError(true);
      localStorage.removeItem(cacheKey);
    } finally {
      setIsLoading(false);
      setLoadingAnimation(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCacheData();
    const interval = setInterval(() => fetchAndCacheData(true), 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAndCacheData]);

  useEffect(() => {
    if (historicalData.length > 0) {
      console.log('First data point:', historicalData[0]);
      console.log('Last data point:', historicalData[historicalData.length - 1]);
      console.log('Total data points:', historicalData.length);
    }
  }, [historicalData]);

  const getDate = d => d.date;
  const getSensex = d => d.sensex;
  const getNifty = d => d.nifty;
  const bisectDate = bisector(getDate).left;

  const handleTooltip = (event) => {
    const svgElement = event.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const x0 = xScale.invert(x);
    const index = bisectDate(historicalData, x0, 1);
    const d0 = historicalData[index - 1];
    const d1 = historicalData[index];
    
    if (!d0 || !d1) return;

    let d = d0;
    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
    }

    if (d && !(d.date instanceof Date)) {
      d.date = new Date(d.date);
    }

    setTooltipData(d);
  };

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

  const fetchAndCacheNews = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'newsData';
    const cacheDuration = 2 * 60 * 60 * 1000;
    
    try {
      setNewsLoading(true);
      
      // Add initial loading delay to match chart animation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const cachedNews = localStorage.getItem(cacheKey);
      if (cachedNews && !forceRefresh) {
        const { data, timestamp } = JSON.parse(cachedNews);
        if (Date.now() - timestamp < cacheDuration) {
          setNews(data);
          setNewsLoading(false);
          return;
        }
      }

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);

      const domains = [
        'moneycontrol.com',
        'economictimes.indiatimes.com',
        'livemint.com',
        'business-standard.com',
        'financialexpress.com',
        'businesstoday.in',
        'cnbctv18.com'
      ].join(',');

      const query = encodeURIComponent(
        '(market OR stock OR sensex OR nifty OR bse OR nse OR shares OR trading)'
      );

      console.log('Fetching news...'); // Debug log

      const response = await fetch(
        `https://newsapi.org/v2/everything?` +
        `domains=${domains}&` +
        `q=${query}&` +
        `language=en&` +
        `from=${twoDaysAgo.toISOString()}&` +
        `sortBy=publishedAt&` +
        `pageSize=100`,
        {
          headers: {
            'X-Api-Key': 'hi'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('News API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('News API response:', data); // Debug log

      if (data.status === 'ok' && data.articles) {
        const sortedNews = data.articles
          .filter(article => article.title && article.description) // Filter out invalid articles
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        setNews(sortedNews);
      } else {
        console.error('Invalid news data format:', data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]); // Clear news on error
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndCacheNews();
    const interval = setInterval(() => fetchAndCacheNews(true), 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAndCacheNews]);

  const getSymbol = (name) => {
    return market_data.indices[name] || market_data.manufacturing_companies[name];
  };

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

  useEffect(() => {
    console.log('Historical data updated:', historicalData);
    console.log('Loading state:', isLoading);
  }, [historicalData, isLoading]);

  useEffect(() => {
    if (historicalData.length > 0) {
      console.log('Data sample:', historicalData[0]);
      console.log('Data length:', historicalData.length);
      console.log('Container width:', containerWidth);
      console.log('Scales:', {
        xDomain: xScale.domain(),
        sensexDomain: sensexScale.domain(),
        niftyDomain: niftyScale.domain()
      });
    }
  }, [historicalData, containerWidth, xScale, sensexScale, niftyScale]);

  const marketConfig = {
    '^BSESN': { name: 'BSE SENSEX', currency: '₹', locale: 'en-IN' },
    '^NSEI': { name: 'NIFTY 50', currency: '₹', locale: 'en-IN' },
    '^GSPC': { name: 'S&P 500', currency: '$', locale: 'en-US' },
    '^IXIC': { name: 'NASDAQ', currency: '$', locale: 'en-US' },
    '^HSI': { name: 'Hang Seng', currency: 'HK$', locale: 'zh-HK' }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Market Overview</h2>
        <div 
          ref={containerRef}
          className="relative h-[200px] w-full"
          onMouseMove={handleTooltip}
          onMouseLeave={() => setTooltipData(null)}
        >
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
                {!historicalData.length ? 'No data available' :
                 !containerWidth ? 'Initializing chart...' :
                 'Preparing visualization...'}
              </div>
            </div>
          ) : (
            <svg width={containerWidth} height={height}>
              <LinearGradient
                id="sensex-gradient"
                from="#ffa07a"
                to="#ffa07a"
                fromOpacity={0.2}
                toOpacity={0.05}
              />
              <LinearGradient
                id="nifty-gradient"
                from="#7cb5ec"
                to="#7cb5ec"
                fromOpacity={0.2}
                toOpacity={0.05}
              />
              
              <Group>
                {isReady && (
                  <>
                    <AreaClosed
                      data={historicalData}
                      x={d => xScale(d.date)}
                      y={d => sensexScale(d.sensex)}
                      yScale={sensexScale}
                      curve={curveMonotoneX}
                      fill="url(#sensex-gradient)"
                    />
                    <AreaClosed
                      data={historicalData}
                      x={d => xScale(d.date)}
                      y={d => niftyScale(d.nifty)}
                      yScale={niftyScale}
                      curve={curveMonotoneX}
                      fill="url(#nifty-gradient)"
                    />

                    <LinePath
                      data={historicalData}
                      x={d => xScale(d.date)}
                      y={d => sensexScale(d.sensex)}
                      stroke="#ffa07a"
                      strokeWidth={2}
                      curve={curveMonotoneX}
                    />
                    <LinePath
                      data={historicalData}
                      x={d => xScale(d.date)}
                      y={d => niftyScale(d.nifty)}
                      stroke="#7cb5ec"
                      strokeWidth={2}
                      curve={curveMonotoneX}
                    />
                    
                    {tooltipData && (
                      <>
                        <Line
                          from={{ x: xScale(getDate(tooltipData)), y: 0 }}
                          to={{ x: xScale(getDate(tooltipData)), y: height }}
                          stroke="#718096"
                          strokeWidth={1}
                          pointerEvents="none"
                          strokeDasharray="4,4"
                        />
                        <circle
                          cx={xScale(getDate(tooltipData))}
                          cy={sensexScale(tooltipData.sensex)}
                          r={4}
                          fill="#ffa07a"
                          stroke="white"
                          strokeWidth={2}
                        />
                        <circle
                          cx={xScale(getDate(tooltipData))}
                          cy={niftyScale(tooltipData.nifty)}
                          r={4}
                          fill="#7cb5ec"
                          stroke="white"
                          strokeWidth={2}
                        />
                      </>
                    )}
                  </>
                )}
              </Group>
            </svg>
          )}

          {tooltipData && (
            <div
              className="absolute backdrop-blur-none bg-white/60 shadow-lg rounded-lg p-3 text-sm"
              style={{
                left: xScale(getDate(tooltipData)),
                top: 0,
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              <div className="font-medium mb-1 text-gray-800">
                {getDate(tooltipData) instanceof Date 
                  ? getDate(tooltipData).toLocaleDateString()
                  : new Date(getDate(tooltipData)).toLocaleDateString()}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ffa07a]" />
                  <span className="text-gray-600">SENSEX:</span>
                  <span className="font-medium text-gray-800">
                    {tooltipData.sensex?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7cb5ec]" />
                  <span className="text-gray-600">NIFTY 50:</span>
                  <span className="font-medium text-gray-800">
                    {tooltipData.nifty?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-4 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Market News</h2>
        <div className="relative h-[200px] overflow-auto">
          {newsLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-gray-400">Loading news...</div>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500">
                No news
              </div>
            </div>
          ) : (
            news.map((item, index) => (
              <a 
                key={index} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block border-b pb-2 hover:bg-gray-50 transition-colors rounded-lg p-2"
              >
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.category === 'BSE' ? 'bg-blue-100 text-blue-800' :
                      item.category === 'NIFTY' ? 'bg-green-100 text-green-800' :
                      item.category === 'NSE' ? 'bg-purple-100 text-purple-800' :
                      item.category === 'Manufacturing' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(item.publishedAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1 line-clamp-2">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-blue-600">
                      {item.source.name}
                    </span>
                    <span className="text-xs text-gray-400 hover:text-blue-500">
                      Read more →
                    </span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      <div className="col-span-4 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">World Markets</h2>
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
                <span className="text-sm text-gray-600">{config.name}</span>
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
        <h2 className="text-lg font-semibold mb-2">Your Watchlist</h2>
        <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-auto">
          {watchlist.map((item) => (
            <div key={item} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{item}</span>
                <span className="text-green-500">+2.4%</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="block">{item}</span>
                <span className="text-xs text-gray-400">
                  {getSymbol(item)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeView;


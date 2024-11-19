import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import MarketAreaChart from '../charts/MarketAreaChart';

// Add your News API key here
const NEWS_API_KEY = 'a8702de48e714021a3f00bf5fd59b962';

const ForecastChart = ({ data }) => {
  const formattedData = data.map(item => ({
    date: new Date(item.Date),
    price: item[Object.keys(item)[1]]
  })).sort((a, b) => a.date - b.date);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => {
            return new Date(date).toLocaleDateString('en-US', { 
              month: 'numeric',
              day: 'numeric'
            });
          }}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          interval={4}  // Show fewer ticks
        />
        <YAxis 
          tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          width={60}
        />
        <CartesianGrid stroke="#f3f4f6" />
        <Tooltip 
          formatter={(value) => [`₹${value.toLocaleString()}`, 'Forecast']}
          labelFormatter={(date) => new Date(date).toLocaleDateString()}
          contentStyle={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const FinancialScoreChart = ({ data }) => {
  const formattedData = Object.entries(data).map(([year, score]) => ({
    year: parseInt(year),
    score
  })).sort((a, b) => a.year - b.year);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f3f4f6" />
        <XAxis 
          dataKey="year"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          domain={[0, 6]}
          ticks={[0, 2, 4, 6]}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          width={30}
        />
        <Tooltip
          formatter={(value) => [value.toFixed(2), 'Score']}
          labelFormatter={(year) => `Year ${year}`}
          contentStyle={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{
            stroke: '#4f46e5',
            strokeWidth: 2,
            r: 3,
            fill: 'white'
          }}
          activeDot={{
            stroke: '#4f46e5',
            strokeWidth: 2,
            r: 5,
            fill: '#4f46e5'
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const StockDashboard = () => {
  const { stockName } = useParams();
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Fetch stock details
  useEffect(() => {
    const fetchStockDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/stock-details/${encodeURIComponent(stockName)}/`);
        const data = await response.json();
        setStockData(data);
      } catch (error) {
        console.error('Error fetching stock details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [stockName]);

  // Fetch news using the NEWS_API_KEY constant
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        const response = await fetch(
          `https://newsapi.org/v2/everything?` + 
          `q=${encodeURIComponent(stockName)}%20stock&` +
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
          setNews(data.articles.slice(0, 10));  // Ensure we only take up to 10 articles
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

    if (stockName) {
      fetchNews();
    }
  }, [stockName]);

  const companyInfo = {
    'Maruti Suzuki': {
      description: "Maruti Suzuki India Limited is India's largest passenger car manufacturer, holding over 45% of the domestic market share. The company, established in 1981, is a subsidiary of Suzuki Motor Corporation, Japan, and has played a pivotal role in India's automotive revolution.",
      keyMetrics: {
        marketCap: "₹2.89 Trillion",
        peRatio: "28.45",
        bookValue: "₹2,012.34",
        dividendYield: "1.2%"
      },
      recentDevelopments: [
        "Launched new Grand Vitara with strong hybrid technology",
        "Expanded production capacity at Gujarat plant",
        "Increased focus on SUV segment",
        "Investment in EV infrastructure development"
      ],
      industryPosition: "Market leader in passenger vehicles with over 45% market share in India"
    },
    
    'Hero Motocorp': {
      description: "Hero MotoCorp Ltd. is the world's largest manufacturer of two-wheelers, based in New Delhi, India. The company has maintained its position as the world's largest two-wheeler manufacturer for over 20 years, with a strong presence in both domestic and international markets.",
      keyMetrics: {
        marketCap: "₹1.02 Trillion",
        peRatio: "24.18",
        bookValue: "₹786.45",
        dividendYield: "2.8%"
      },
      recentDevelopments: [
        "Launch of first electric scooter VIDA V1",
        "Strategic partnership with Zero Motorcycles for EV development",
        "Expansion of premium motorcycle segment",
        "Investment in Ather Energy strengthened"
      ],
      industryPosition: "India's largest two-wheeler manufacturer with approximately 37% market share"
    },

    'Bajaj Auto': {
      description: "Bajaj Auto Limited is one of India's leading manufacturers of two-wheelers and three-wheelers. The company has a strong presence in both domestic and export markets, known for its Pulsar series motorcycles and leadership in the three-wheeler segment.",
      keyMetrics: {
        marketCap: "₹1.35 Trillion",
        peRatio: "22.67",
        bookValue: "₹892.56",
        dividendYield: "3.1%"
      },
      recentDevelopments: [
        "Launch of electric Chetak in more cities",
        "Expansion of premium motorcycle portfolio with Triumph",
        "Strengthening export market presence",
        "New manufacturing facility in Maharashtra"
      ],
      industryPosition: "Leader in premium motorcycles and three-wheeler segments with significant export presence"
    }
  };

  const CompanyInfo = ({ stockName }) => {
    const info = companyInfo[stockName] || {
      description: "Company information is being updated.",
      keyMetrics: {
        marketCap: "N/A",
        peRatio: "N/A",
        bookValue: "N/A",
        dividendYield: "N/A"
      },
      recentDevelopments: ["Information will be available soon."],
      industryPosition: "Data being updated"
    };

    return (
      <div className="grid grid-cols-12 gap-6 mt-6">
        <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Company Overview</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-600 leading-relaxed mb-6">{info.description}</p>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {Object.entries(info.keyMetrics).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="font-semibold text-gray-800">{value}</div>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-800 font-medium mb-1">Industry Position</div>
              <div className="text-blue-600">{info.industryPosition}</div>
            </div>
          </div>
        </div>
        
        <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Developments</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-4">
              {info.recentDevelopments.map((development, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500 mr-3"></span>
                  <span className="text-gray-600 leading-relaxed">{development}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { market, forecast, sentiment, financial, recommendation } = stockData;

  const formattedMarketData = market.historical_data.map(item => ({
    date: new Date(item.date),
    primary: item.price
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white border-b shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">{stockName}</h2>
          <span className="text-2xl font-semibold text-gray-900">
            ₹{market.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm font-medium ${market.day_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {market.day_change >= 0 ? '+' : ''}{market.day_change_percent.toFixed(2)}%
          </span>
        </div>
        <div className="flex space-x-4">
          <div className="px-3 py-1 rounded bg-blue-50 text-blue-700">
            Financial: {financial.classification}
          </div>
          <div className="px-3 py-1 rounded bg-yellow-50 text-yellow-700">
            Sentiment: {sentiment.classification}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div className="grid grid-cols-12 gap-6">
          {/* Market Price Graph */}
          <div className="col-span-8 bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-semibold text-gray-800">Market Price</h3>
            </div>
            <div className="flex-1 min-h-0">
              <MarketAreaChart 
                data={formattedMarketData}
                height={300}
                showNifty={false}
                colors={{ primary: "#60a5fa" }}
              />
            </div>
          </div>

          {/* News Feed - Adjusted to match graph height */}
          <div className="col-span-4 bg-white rounded-lg shadow p-4 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-4 shrink-0">Latest News</h3>
            <div className="h-[300px] overflow-y-auto">
              {newsLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : news.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No news available
                </div>
              ) : (
                <div className="space-y-3">
                  {news.map((item, i) => (
                    <a 
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="block border-b last:border-b-0 pb-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
                          {item.source.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium line-clamp-2">{item.title}</h4>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price Forecast Card */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Price Forecast</h3>
                <span className={`text-sm font-medium ${forecast.forecast_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {forecast.forecast_change_percent >= 0 ? '+' : ''}{forecast.forecast_change_percent}%
                </span>
              </div>
            </div>
            <div className="p-4">
              <ForecastChart data={forecast.data || []} />
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1"></div>
                    Predicted trend
                  </span>
                  <span>|</span>
                  <span>
                    Timeline: {new Date(forecast.forecast_period.start).toLocaleDateString()} - {new Date(forecast.forecast_period.end).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Score Card */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Financial Coefficient Score</h3>
                <span className="text-sm font-medium text-gray-600">
                  Current: {financial.current_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="p-4">
              <FinancialScoreChart data={financial.yearly_scores || {}} />
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-3 text-xs text-center">
                  <div className="space-x-1 text-gray-500">
                    <span className="font-medium">Weak:</span>
                    <span>0-2</span>
                  </div>
                  <div className="text-indigo-600 font-medium flex items-center justify-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    {financial.classification}
                  </div>
                  <div className="space-x-1 text-gray-500">
                    <span className="font-medium">Strong:</span>
                    <span>4-6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations Card */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">AI Recommendations</h3>
            </div>
            <div className="p-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-2">
                  <span className="font-medium text-blue-700">{recommendation.action}</span>
                </div>
                <p className="text-sm text-blue-600 leading-relaxed">{recommendation.rationale}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Projected Price (2025)</span>
                  <span className="font-medium">₹{forecast.projected_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Score</span>
                  <span className="font-medium">{financial.current_score.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add CompanyInfo component */}
        <CompanyInfo stockName={stockName} />
      </div>
    </div>
  );
};

export default StockDashboard; 
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

const genAI = new GoogleGenerativeAI('AIzaSyDKC_6HUhebYB4evBJuikWQS2Rdkk-GChI');

// Update cache key to include user-specific identifier
const getUserSpecificCacheKey = () => {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  return `ai_chat_history_${userId}`;
};

const loadChatHistory = () => {
  try {
    const cacheKey = getUserSpecificCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      // Initial welcome message if no history exists
      const initialMessage = [{
        type: 'system',
        content: '# Welcome to AI Stock Assistant\n\nPlease select one or more stocks and click "Analyze" to begin. Then you can ask questions about the selected stocks.'
      }];
      localStorage.setItem(cacheKey, JSON.stringify(initialMessage));
      return initialMessage;
    }
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

const saveChatHistory = (messages) => {
  try {
    const cacheKey = getUserSpecificCacheKey();
    localStorage.setItem(cacheKey, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

export const clearAIChatHistory = () => {
  try {
    const cacheKey = getUserSpecificCacheKey();
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};

const AIAssistantView = () => {
  const stocks = [
    'Maruti Suzuki',
    'Hero Motocorp',
    'Bajaj Auto',
  ];

  const [selectedStocks, setSelectedStocks] = useState([]);
  const [messages, setMessages] = useState(() => loadChatHistory());
  const [loading, setLoading] = useState(false);
  const [stocksData, setStocksData] = useState({});
  const chatContainerRef = useRef(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Add fetchStockData function
  const fetchStockData = async (stockName) => {
    try {
      const response = await fetch(`http://localhost:8000/api/stock-details/${encodeURIComponent(stockName)}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Data fetched for ${stockName}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${stockName}:`, error);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `⚠️ Failed to fetch data for ${stockName}. Please try again.`
      }]);
      return null;
    }
  };

  // Update generateAnalysisPrompt function to remove recommendation section
  const generateAnalysisPrompt = (stocksData) => {
    return `Please analyze the following market data:

${Object.entries(stocksData).map(([stock, data]) => `
# ${stock}

## Market Data
- Current Price: ₹${data.market.current_price.toLocaleString('en-IN')}
- Day Change: ${data.market.day_change_percent}%
- Volume: ${data.market.volume.toLocaleString('en-IN')}
- Trading Range: ₹${data.market.low.toLocaleString('en-IN')} - ₹${data.market.high.toLocaleString('en-IN')}
- Market Status: ${data.market.market_status}

## Historical Price Trend (Last 30 Days)
${data.market.historical_data.map(day => 
  `- ${day.date}: ₹${day.price.toLocaleString('en-IN')} | Volume: ${day.volume.toLocaleString('en-IN')}`
).join('\n')}

## Financial Analysis
- Current Score (2024): ${data.financial.current_score.toFixed(2)}
- Classification: ${data.financial.classification}

### Financial Score History
${Object.entries(data.financial.yearly_scores)
  .map(([year, score]) => `- ${year}: ${score.toFixed(2)}`)
  .join('\n')}

## Market Sentiment Analysis
- Current Classification: ${data.sentiment.classification}

### Daily Sentiment Trends
${Object.entries(data.sentiment.daily_sentiments)
  .map(([date, score]) => `- ${date}: ${score.toFixed(2)}`)
  .join('\n')}

## Future Projections
- Forecast Period: ${data.forecast.forecast_period.start} to ${data.forecast.forecast_period.end}
- Projected Price: ₹${data.forecast.projected_price.toLocaleString('en-IN')}
- Expected Change: ${data.forecast.forecast_change_percent}%

### Detailed Price Projections
${data.forecast.data.map(forecast => 
  `- ${forecast.Date}: ₹${forecast[Object.keys(forecast).find(key => key !== 'Date')].toLocaleString('en-IN')}`
).join('\n')}
`).join('\n\n')}

Please provide a comprehensive analysis including:

1. Market Position Analysis
   - Current market position
   - Price trend analysis
   - Volume analysis
   - Support and resistance levels

2. Financial Health Assessment
   - Score trend analysis
   - Year-over-year comparison
   - Classification implications

3. Sentiment Analysis
   - Current market sentiment
   - Sentiment trend analysis
   - Correlation with price movements

4. Future Outlook
   - Short-term projections (next 30 days)
   - Long-term forecast analysis (3-6 months)
   - Growth potential assessment

5. Risk Assessment
   - Market risks
   - Technical risks
   - Fundamental risks

6. Trading Recommendations
   - Entry points with specific price levels
   - Exit points with target prices
   - Stop-loss levels based on support
   - Position sizing suggestions
   - Investment timeline recommendations

7. Action Items
   - Immediate steps to consider
   - Monitoring points
   - Risk mitigation strategies
   - Portfolio adjustment suggestions

Please provide specific data points and evidence for each conclusion. Compare current values with historical trends and future projections to support your analysis.

Format the response with clear headers and sections using markdown. Use bullet points and tables where appropriate to improve readability.`;
  };

  // Update handleSendMessage function to remove the stock selection check
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setMessages(prev => [...prev, { type: 'user', content: message }]);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Get recent chat history
      const recentHistory = messages.slice(-5).map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const prompt = `You are a financial advisor analyzing these stocks. 

Previous conversation:
${recentHistory}

Available stock data:
${Object.entries(stocksData).map(([stock, data]) => `
${stock}:
## Market Data
- Current Price: ₹${data.market.current_price.toLocaleString('en-IN')}
- Day Change: ${data.market.day_change_percent}%
- Volume: ${data.market.volume.toLocaleString('en-IN')}
- Market Status: ${data.market.market_status}

## Historical Price Trend (Last 30 Days)
${data.market.historical_data.map(day => 
  `- ${day.date}: ₹${day.price.toLocaleString('en-IN')} | Volume: ${day.volume.toLocaleString('en-IN')}`
).join('\n')}

## Financial Analysis
- Current Score (2024): ${data.financial.current_score.toFixed(2)}
- Classification: ${data.financial.classification}

### Financial Score History
${Object.entries(data.financial.yearly_scores)
  .map(([year, score]) => `- ${year}: ${score.toFixed(2)}`)
  .join('\n')}

## Market Sentiment Analysis
- Current Classification: ${data.sentiment.classification}

### Daily Sentiment Trends
${Object.entries(data.sentiment.daily_sentiments)
  .map(([date, score]) => `- ${date}: ${score.toFixed(2)}`)
  .join('\n')}

## Future Projections
- Forecast Period: ${data.forecast.forecast_period.start} to ${data.forecast.forecast_period.end}
- Projected Price: ₹${data.forecast.projected_price.toLocaleString('en-IN')}
- Expected Change: ${data.forecast.forecast_change_percent}%

### Detailed Price Projections
${data.forecast.data.map(forecast => 
  `- ${forecast.Date}: ₹${forecast[Object.keys(forecast).find(key => key !== 'Date')].toLocaleString('en-IN')}`
).join('\n')}
`).join('\n\n')}

User question: ${message}

Please provide a detailed response using markdown formatting. Reference specific data points from the available information to support your analysis. If discussing trends or making comparisons, explain your reasoning using the historical data, sentiment scores, and forecast values provided.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: text 
      }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: error.message || 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
    setLoading(false);
  };

  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Save stock data whenever it changes
  useEffect(() => {
    if (Object.keys(stocksData).length > 0) {
      localStorage.setItem(
        `${getUserSpecificCacheKey()}_stocks`, 
        JSON.stringify(stocksData)
      );
    }
  }, [stocksData]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Load selected stocks from cache
  useEffect(() => {
    const cached = localStorage.getItem(`${getUserSpecificCacheKey()}_selected`);
    if (cached) {
      setSelectedStocks(JSON.parse(cached));
    }
  }, []);

  // Save selected stocks to cache
  useEffect(() => {
    localStorage.setItem(
      `${getUserSpecificCacheKey()}_selected`, 
      JSON.stringify(selectedStocks)
    );
  }, [selectedStocks]);

  const handleStockToggle = (stock) => {
    setSelectedStocks(prev => {
      const newSelected = prev.includes(stock) 
        ? prev.filter(s => s !== stock)
        : [...prev, stock];
      return newSelected;
    });
  };

  const handleAnalyze = async () => {
    if (selectedStocks.length === 0) {
      setMessages(prev => [...prev, {
        type: 'system',
        content: '⚠️ Please select at least one stock to analyze.'
      }]);
      return;
    }

    setLoading(true);
    const newStocksData = {};
    let hasError = false;

    try {
      for (const stock of selectedStocks) {
        const data = await fetchStockData(stock);
        if (!data) {
          throw new Error(`Failed to fetch valid data for ${stock}`);
        }
        newStocksData[stock] = data;
      }

      setStocksData(newStocksData);

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = generateAnalysisPrompt(newStocksData);
      
      console.log('Analysis Prompt:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      setMessages(prev => [...prev, {
        type: 'system',
        content: text
      }]);
    } catch (error) {
      console.error('Analysis error:', error);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `⚠️ Error: ${error.message}. Please try again.`
      }]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-none p-4 bg-white border-b">
        <h2 className="text-xl font-bold text-gray-800">AI Stock Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select stocks to analyze or ask questions about market trends
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Stocks Selection Sidebar */}
        <div className="w-72 bg-white border-r overflow-y-auto p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select Stocks to Analyze</h3>
            <div className="space-y-2">
              {stocks.map((stock) => (
                <button
                  key={stock}
                  onClick={() => handleStockToggle(stock)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm ${
                    selectedStocks.includes(stock)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-4 h-4 mr-3 rounded border ${
                    selectedStocks.includes(stock)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedStocks.includes(stock) && (
                      <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {stock}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <div className="mt-4 border-t pt-4">
            <button
              onClick={handleAnalyze}
              disabled={selectedStocks.length === 0 || loading}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                selectedStocks.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : loading
                  ? 'bg-blue-100 text-blue-400 cursor-wait'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">Analyzing...</span>
                </div>
              ) : (
                <>
                  <span>Analyze {selectedStocks.length} Stock{selectedStocks.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>

          {/* Selected Stocks */}
          {selectedStocks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Selected Stocks</h3>
              <div className="space-y-2">
                {selectedStocks.map((stock) => (
                  <div key={stock} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{stock}</span>
                    <button
                      onClick={() => handleStockToggle(stock)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-4xl ${
                  message.type === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div
                  className={`rounded-lg p-4 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.type === 'system'
                      ? 'bg-white shadow-sm border border-gray-100'
                      : 'bg-white border text-gray-800'
                  }`}
                >
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-wrap font-sans">
                      {message.content}
                    </div>
                  ) : (
                    <ReactMarkdown
                      className="prose prose-sm max-w-none dark:prose-invert"
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-4 text-gray-900" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-6 mb-3 text-gray-800" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-md font-semibold mt-4 mb-2 text-gray-700" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 text-gray-600" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 text-gray-600" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 my-3" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                        th: ({node, ...props}) => (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
                        ),
                        td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-gray-200 pl-4 my-3 text-gray-600" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 bg-white border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.elements.message;
                handleSendMessage(input.value);
                input.value = '';
              }}
              className="space-y-2"
            >
              <div className="flex space-x-4">
                <input
                  type="text"
                  name="message"
                  placeholder="Ask questions about the stocks..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView; 
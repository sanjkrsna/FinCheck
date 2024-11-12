import React, { useEffect, useState } from 'react';
import { AgChartsReact } from 'ag-charts-react';

const HomeView = () => {
  const [chartData, setChartData] = useState([]);
  const [symbols, setSymbols] = useState(''); // Initially empty

  useEffect(() => {
    const getStockData = async () => {
      if (!symbols) return; // Don't fetch if no symbols are provided

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/stock-data/?symbols=${symbols}`); // Pass symbols as query parameter
        const data = await response.json();
        const formattedData = data.map(item => {
          const entry = { date: item.date };
          // Add each symbol's data to the entry
          for (const symbol of symbols.split(',')) {
            entry[symbol] = item[symbol];
          }
          return entry;
        });
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    };

    getStockData();
  }, [symbols]); // Fetch data whenever symbols change

  const options = {
    data: chartData,
    series: symbols.split(',').map(symbol => ({
      xKey: 'date',
      yKey: symbol,
      title: symbol,
      stroke: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color for each line
    })),
    axes: [
      {
        type: 'category',
        position: 'bottom',
        title: 'Date',
      },
      {
        type: 'number',
        position: 'left',
        title: 'Stock Price',
      },
    ],
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Market Overview */}
      <div className="col-span-8 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Market Overview</h2>
        <div className="h-[200px] bg-gray-50 rounded-lg mb-2">
          <AgChartsReact options={options} />
        </div>
      </div>
      {/* Input for symbols */}
      <div className="col-span-4">
        <input
          type="text"
          value={symbols}
          onChange={(e) => setSymbols(e.target.value)}
          placeholder="Enter stock symbols separated by commas"
          className="border rounded p-2 w-full"
        />
      </div>
    </div>
  );
};

export default HomeView;


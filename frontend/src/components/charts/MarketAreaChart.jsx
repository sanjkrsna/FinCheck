import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketAreaChart = ({ 
  data, 
  height = 200,
  showNifty = true,
  colors = {
    primary: "#7cb5ec",
    secondary: "#ffa07a"
  },
  stockName = null,
  error = false,
  onRefresh
}) => {
  console.log('Chart data:', { 
    dataLength: data?.length,
    firstItem: data?.[0],
    lastItem: data?.[data?.length - 1]
  });

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500">
          Error loading market data. Please try again later.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-2"
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart 
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0.2}/>
          </linearGradient>
          {showNifty && (
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.1}/>
            </linearGradient>
          )}
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        
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
        />

        <YAxis 
          yAxisId="primary"
          tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
          width={60}
          domain={['auto', 'auto']}
        />

        {showNifty && (
          <YAxis 
            yAxisId="secondary"
            orientation="right"
            tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            width={60}
            domain={['auto', 'auto']}
          />
        )}

        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          formatter={(value, name) => {
            if (stockName) {
              return [`₹${value.toLocaleString('en-IN')}`, stockName];
            }
            return [
              `₹${value.toLocaleString('en-IN')}`, 
              name === 'primary' ? 'SENSEX' : 'NIFTY'
            ];
          }}
          labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
        />

        <Area
          yAxisId="primary"
          type="monotone"
          dataKey="primary"
          stroke={colors.primary}
          fillOpacity={1}
          fill="url(#colorPrimary)"
          strokeWidth={2}
          name="primary"
          connectNulls
        />

        {showNifty && (
          <Area
            yAxisId="secondary"
            type="monotone"
            dataKey="secondary"
            stroke={colors.secondary}
            fillOpacity={1}
            fill="url(#colorSecondary)"
            strokeWidth={2}
            name="secondary"
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MarketAreaChart; 
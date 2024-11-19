import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketAreaChart = ({ 
  data, 
  height = 200,
  showNifty = true,
}) => {
  // Early return if no data
  if (!data || data.length === 0) return null;

  // Log the first data point to verify format
  console.log('Sample data point:', data[0]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart 
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorSensex" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7cb5ec" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#7cb5ec" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffa07a" stopOpacity={0.6}/>
            <stop offset="95%" stopColor="#ffa07a" stopOpacity={0.1}/>
          </linearGradient>
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
          formatter={(value, name) => [
            `₹${value.toLocaleString('en-IN')}`,
            name === 'primary' ? 'SENSEX' : 'NIFTY'
          ]}
          labelFormatter={(date) => new Date(date).toLocaleDateString('en-IN')}
        />

        <Area
          yAxisId="primary"
          type="monotone"
          dataKey="primary"
          stroke="#7cb5ec"
          fillOpacity={1}
          fill="url(#colorSensex)"
          strokeWidth={2}
          name="SENSEX"
          connectNulls
        />

        {showNifty && (
          <Area
            yAxisId="secondary"
            type="monotone"
            dataKey="secondary"
            stroke="#ffa07a"
            fillOpacity={1}
            fill="url(#colorNifty)"
            strokeWidth={2}
            name="NIFTY"
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MarketAreaChart; 
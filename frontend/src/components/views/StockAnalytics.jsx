const StockAnalytics = ({ stock, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{stock.symbol} Analytics</h2>
            <p className="text-sm text-gray-600">{stock.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-12 gap-4">
            {/* Price Chart */}
            <div className="col-span-12 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold mb-2">Price History</h3>
              <div className="h-[300px] bg-gray-50 rounded flex items-center justify-center text-gray-400">
                Chart Placeholder
              </div>
            </div>

            {/* News Feed */}
            <div className="col-span-8 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold mb-3">Latest News</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="border-b pb-3">
                    <p className="text-xs text-gray-500 mb-1">3 hours ago</p>
                    <h4 className="text-sm font-medium mb-1">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit
                    </h4>
                    <p className="text-sm text-gray-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Sheet Summary */}
            <div className="col-span-4 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold mb-3">Balance Sheet</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Assets</span>
                  <span className="font-medium">$351.0B</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Liabilities</span>
                  <span className="font-medium">$287.9B</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Total Equity</span>
                  <span className="font-medium">$63.1B</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Debt/Equity Ratio</span>
                  <span className="font-medium">1.23</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Ratio</span>
                  <span className="font-medium">0.88</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalytics;
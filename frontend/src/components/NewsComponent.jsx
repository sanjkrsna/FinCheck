import React from 'react';

const NewsComponent = ({ 
  news, 
  loading, 
  maxHeight = "200px",
  title = "Market News"
}) => {
  const getTimeAgo = (publishedAt) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffInDays = Math.floor((now - published) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className={`overflow-y-auto`} style={{ maxHeight }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            No news available
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, i) => (
              <a 
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer" 
                className="block border-b last:border-b-0 pb-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700">
                    {item.source.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(item.publishedAt)}
                  </span>
                </div>
                <h4 className="text-sm font-medium mb-1">{item.title}</h4>
                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsComponent; 
import React, { useState, useCallback, useMemo } from 'react';

const GradientBackground = ({ children, className = '', variant = 'default' }) => {
  const [mousePosition, setMousePosition] = useState({ x: '0%', y: '0%' });

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - 50;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - 50;
    setMousePosition({
      x: `${(x * 0.4).toFixed(3)}%`,
      y: `${(y * 0.4).toFixed(3)}%`,
    });
  }, []);

  const gradientStyle = useMemo(() => ({
    background: `
      radial-gradient(circle at calc(50% + ${mousePosition.x}) calc(100% + ${mousePosition.y}), rgba(37,99,235,1) 0%, rgba(37,99,235,0.3) 85%),
      radial-gradient(circle at calc(0% + ${mousePosition.x}) calc(0% + ${mousePosition.y}), rgba(29,78,216,1) 0%, rgba(29,78,216,0.3) 85%),
      radial-gradient(circle at calc(100% + ${mousePosition.x}) calc(0% + ${mousePosition.y}), rgba(30,64,175,1) 0%, rgba(30,64,175,0.3) 85%),
      #1e40af
    `,
    transition: 'background 0.3s ease',
  }), [mousePosition]);

  return (
    <div 
      className={`relative overflow-hidden ${className}`} 
      onMouseMove={handleMouseMove}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={gradientStyle} 
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

export default GradientBackground; 
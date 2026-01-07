// Recharts Fallback Implementation
// Provides basic chart functionality when Recharts CDN fails

(function() {
  'use strict';
  
  // Simple chart component fallback
  function ChartFallback(props) {
    const { data, width = 400, height = 300, type = 'line' } = props;
    
    const container = document.createElement('div');
    container.style.cssText = `
      width: ${width}px;
      height: ${height}px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: #6b7280;
    `;
    
    container.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
        ${type.charAt(0).toUpperCase() + type.slice(1)} Chart
      </div>
      <div style="font-size: 12px;">
        ${data ? `${data.length} data points` : 'No data available'}
      </div>
      <div style="font-size: 10px; color: #9ca3af; margin-top: 8px;">
        Chart library unavailable
      </div>
    `;
    
    return container;
  }
  
  // Create basic chart components
  const LineChart = (props) => ChartFallback({ ...props, type: 'line' });
  const BarChart = (props) => ChartFallback({ ...props, type: 'bar' });
  const AreaChart = (props) => ChartFallback({ ...props, type: 'area' });
  const PieChart = (props) => ChartFallback({ ...props, type: 'pie' });
  const RadarChart = (props) => ChartFallback({ ...props, type: 'radar' });
  
  // Basic components
  const XAxis = () => null;
  const YAxis = () => null;
  const CartesianGrid = () => null;
  const Tooltip = () => null;
  const Legend = () => null;
  const ResponsiveContainer = ({ children }) => {
    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 100%;';
    if (children) {
      const childElement = typeof children === 'function' ? children() : children;
      if (childElement && childElement.nodeType) {
        container.appendChild(childElement);
      }
    }
    return container;
  };
  
  // Create global Recharts object
  window.Recharts = {
    LineChart,
    BarChart,
    AreaChart,
    PieChart,
    RadarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  };
  
  console.info('Recharts fallback loaded - basic chart components available');
})();

/* Plotly.js Fallback - Minimal Implementation */
window.Plotly = {
  // Basic plotting function
  newPlot: function(div, data, layout, config) {
    const element = typeof div === 'string' ? document.getElementById(div) : div;
    if (!element) {
      console.error('Plotly fallback: Element not found');
      return Promise.resolve();
    }
    
    // Clear existing content
    element.innerHTML = '';
    
    // Create fallback visualization
    const width = layout && layout.width || element.clientWidth || 800;
    const height = layout && layout.height || element.clientHeight || 600;
    
    // Create canvas for simple drawing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.border = '1px solid #ddd';
    canvas.style.background = '#f9f9f9';
    element.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Draw fallback content
    ctx.fillStyle = '#666';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Plotly Chart (offline mode)', width / 2, height / 2 - 20);
    
    if (data && data.length > 0) {
      ctx.font = '14px sans-serif';
      ctx.fillText(`${data.length} trace(s)`, width / 2, height / 2);
      
      if (data[0].x && data[0].y) {
        ctx.fillText(`${data[0].x.length} data points`, width / 2, height / 2 + 20);
      }
    }
    
    // Store reference for updates
    element.plotlyData = data;
    element.plotlyLayout = layout;
    element.plotlyCanvas = canvas;
    
    return Promise.resolve();
  },
  
  // Update existing plot
  react: function(div, data, layout) {
    return this.newPlot(div, data, layout);
  },
  
  // Redraw plot
  redraw: function(div) {
    const element = typeof div === 'string' ? document.getElementById(div) : div;
    if (element && element.plotlyData) {
      return this.newPlot(element, element.plotlyData, element.plotlyLayout);
    }
    return Promise.resolve();
  },
  
  // Resize plot
  resize: function(div) {
    return this.redraw(div);
  },
  
  // Basic plot types
  plot: function(div, data, layout) {
    return this.newPlot(div, data, layout);
  },
  
  // Image export (fallback)
  toImage: function(div, options) {
    return Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  },
  
  // Download plot as image
  downloadImage: function(div, options) {
    console.log('Plotly fallback: Download not available in offline mode');
  },
  
  // Fullscreen
  fullScreen: function(div) {
    console.log('Plotly fallback: Fullscreen not available in offline mode');
  },
  
  // Configuration
  Config: {
    staticPlot: false,
    displayModeBar: true,
    displaylogo: true,
    modeBarButtonsToRemove: [],
    modeBarButtonsToAdd: [],
    responsive: true,
    doubleClick: 'reset',
    showAxisDragHandles: true,
    showAxisRangeEntryBoxes: true,
    showTips: true,
    showLink: false,
    sendData: false,
    showSources: false,
    displaylogo: true,
    doubleClickDelay: 300,
    watermark: false
  },
  
  // Mock version
  version: '1.0.0-fallback'
};

console.info('Plotly.js fallback loaded - offline mode active');

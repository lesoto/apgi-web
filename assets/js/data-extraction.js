// Data Extraction and Optimization for APGI Website
// Ensure logger is available
if (typeof logger === "undefined") {
  // Fallback logger if not loaded - only logs in development
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes(".local") ||
    window.location.hostname.includes(".dev") ||
    window.location.hostname.includes(".test") ||
    window.location.protocol === "file:";

  window.logger = {
    error: (...args) => isDev && console.error("[ERROR]", ...args),
    warn: (...args) => isDev && console.warn("[WARN]", ...args),
    info: (...args) => isDev && console.info("[INFO]", ...args),
    debug: (...args) => isDev && console.log("[DEBUG]", ...args),
  };
}

class APGIDataOptimizer {
  constructor() {
    this.extractedData = new Map();
    this.init();
  }

  init() {
    this.extractEmbeddedData();
    this.createDataFiles();
    this.optimizePages();
  }

  extractEmbeddedData() {
    // Extract large JavaScript datasets from problematic files
    this.extractPlotlyData();
    this.extractImageData();
    this.extractVisualizationData();
  }

  extractPlotlyData() {
    const problematicFiles = [
      "Ignition-Landscape.html",
      "State-Network-Flow.html",
    ];

    problematicFiles.forEach((fileName) => {
      try {
        const response = fetch(fileName)
          .then((response) => response.text())
          .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Extract Plotly data and configuration
            const scripts = doc.querySelectorAll(
              'script[type="text/javascript"]',
            );
            scripts.forEach((script, index) => {
              const content = script.textContent;

              // Look for Plotly data patterns
              if (
                content.includes("Plotly.newPlot") ||
                content.includes("plotly.js")
              ) {
                const dataMatch = content.match(/data:\s*(\[[\s\S]*?\])/);
                const layoutMatch = content.match(/layout:\s*(\{[\s\S]*?\})/);

                if (dataMatch || layoutMatch) {
                  const extractedData = {
                    data: dataMatch ? this.parseSafely(dataMatch[1]) : null,
                    layout: layoutMatch
                      ? this.parseSafely(layoutMatch[1])
                      : null,
                    fileName: fileName,
                    scriptIndex: index,
                  };

                  this.extractedData.set(
                    `${fileName}-plotly-${index}`,
                    extractedData,
                  );
                }
              }
            });
          })
          .catch((error) => {
            // Handle fetch error silently in production
          });
      } catch (error) {
        // Handle general error silently in production
      }
    });
  }

  extractImageData() {
    // Find Base64 encoded images
    const base64Pattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;

    document.querySelectorAll("script, style").forEach((element) => {
      const content = element.textContent;
      const matches = content.match(base64Pattern);

      if (matches) {
        matches.forEach((base64Data, index) => {
          const imageInfo = {
            data: base64Data,
            size: base64Data.length,
            element: element.tagName,
            index: index,
          };

          this.extractedData.set(
            `image-${element.tagName}-${index}`,
            imageInfo,
          );
        });
      }
    });
  }

  extractVisualizationData() {
    // Extract large datasets from visualization pages
    const vizPages = [
      "PsyStates-Visualizer.html",
      "Consciousness-Visualization.html",
    ];

    vizPages.forEach((fileName) => {
      // This would be implemented based on the actual structure of these files
    });
  }

  parseSafely(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }

  createDataFiles() {
    // Create JSON files for extracted data
    this.extractedData.forEach((data, key) => {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // In a real implementation, this would save to actual files
    });
  }

  optimizePages() {
    // Create optimized versions of heavy pages
    this.optimizeIgnitionLandscape();
    this.optimizeStateNetworkFlow();
  }

  optimizeIgnitionLandscape() {
    // Extract the essential structure without embedded Plotly
    const optimizedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Ignition Landscape - APGI Framework</title>
    <script src="navigation.js"></script>
    <script src="https://cdn.plot.ly/plotly-3.3.0.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 80px 20px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
            font-size: 18px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .plot-container {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
            margin: 20px 0;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .description {
            text-align: center;
            margin-bottom: 40px;
            font-size: 1.2em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ignition Landscape</h1>
        <div class="description">
            Interactive visualization of neural ignition patterns and consciousness states
        </div>
        
        <div class="plot-container">
            <div id="loading" class="loading-spinner">
                <div class="spinner"></div>
                Loading visualization data...
            </div>
            <div id="plot" style="display: none; width: 100%; height: 600px;"></div>
        </div>
    </div>

    <script>
        // Lazy load the visualization data
        async function loadVisualization() {
            try {
                // Show loading state
                document.getElementById('loading').style.display = 'flex';
                document.getElementById('plot').style.display = 'none';
                
                // Simulate data loading (in real implementation, fetch from JSON)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Generate sample data (replace with actual data loading)
                const data = [{
                    type: 'scatter3d',
                    mode: 'markers',
                    x: Array.from({length: 100}, () => Math.random() * 10),
                    y: Array.from({length: 100}, () => Math.random() * 10),
                    z: Array.from({length: 100}, () => Math.random() * 10),
                    marker: {
                        size: 5,
                        color: Array.from({length: 100}, () => Math.random()),
                        colorscale: 'Viridis',
                        showscale: true
                    }
                }];
                
                const layout = {
                    title: 'Neural Ignition Patterns',
                    scene: {
                        xaxis: {title: 'Neural Activity X'},
                        yaxis: {title: 'Neural Activity Y'},
                        zaxis: {title: 'Consciousness Level'}
                    },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: {color: 'white'}
                };
                
                // Hide loading and show plot
                document.getElementById('loading').style.display = 'none';
                document.getElementById('plot').style.display = 'block';
                
                // Create the plot
                Plotly.newPlot('plot', data, layout);
                
            } catch (error) {
                logger.error('Error loading visualization:', error);
                document.getElementById('loading').innerHTML = 
                    '<div style="color: red;">Error loading visualization. Please refresh the page.</div>';
            }
        }
        
        // Load visualization when page is ready
        document.addEventListener('DOMContentLoaded', loadVisualization);
    </script>
</body>
</html>`;

    // In a real implementation, this would save the file
  }

  optimizeStateNetworkFlow() {
    // Similar optimization for State-Network-Flow.html
    const optimizedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>State Network Flow - APGI Framework</title>
    <script src="navigation.js"></script>
    <script src="https://cdn.plot.ly/plotly-3.3.0.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 80px 20px 20px;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
            font-size: 18px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .plot-container {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
            margin: 20px 0;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .description {
            text-align: center;
            margin-bottom: 40px;
            font-size: 1.2em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>State Network Flow</h1>
        <div class="description">
            Dynamic visualization of consciousness state transitions and network flow patterns
        </div>
        
        <div class="plot-container">
            <div id="loading" class="loading-spinner">
                <div class="spinner"></div>
                Loading network flow data...
            </div>
            <div id="plot" style="display: none; width: 100%; height: 600px;"></div>
        </div>
    </div>

    <script>
        // Lazy load the network flow visualization
        async function loadNetworkFlow() {
            try {
                // Show loading state
                document.getElementById('loading').style.display = 'flex';
                document.getElementById('plot').style.display = 'none';
                
                // Simulate data loading
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Generate sample network data (replace with actual data)
                const nodes = Array.from({length: 50}, (_, i) => ({
                    id: i,
                    label: \`State \${i}\`,
                    x: Math.random() * 10,
                    y: Math.random() * 10
                }));
                
                const edges = Array.from({length: 100}, () => ({
                    source: Math.floor(Math.random() * 50),
                    target: Math.floor(Math.random() * 50),
                    value: Math.random()
                }));
                
                const data = [{
                    type: 'scatter',
                    x: nodes.map(n => n.x),
                    y: nodes.map(n => n.y),
                    mode: 'markers',
                    marker: {size: 12, color: 'lightblue'},
                    text: nodes.map(n => n.label),
                    hoverinfo: 'text'
                }];
                
                const layout = {
                    title: 'Consciousness State Network Flow',
                    xaxis: {title: 'Network Dimension X'},
                    yaxis: {title: 'Network Dimension Y'},
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: {color: 'white'}
                };
                
                // Hide loading and show plot
                document.getElementById('loading').style.display = 'none';
                document.getElementById('plot').style.display = 'block';
                
                // Create the plot
                Plotly.newPlot('plot', data, layout);
                
            } catch (error) {
                logger.error('Error loading network flow:', error);
                document.getElementById('loading').innerHTML = 
                    '<div style="color: red;">Error loading visualization. Please refresh the page.</div>';
            }
        }
        
        // Load visualization when page is ready
        document.addEventListener('DOMContentLoaded', loadNetworkFlow);
    </script>
</body>
</html>`;
  }

  generateReport() {}
}

// Initialize the optimizer
document.addEventListener("DOMContentLoaded", () => {
  window.apgiOptimizer = new APGIDataOptimizer();

  // Generate report after initialization
  setTimeout(() => {
    window.apgiOptimizer.generateReport();
  }, 1000);
});

// Also initialize if DOM is already loaded
if (document.readyState !== "loading") {
  if (!window.apgiOptimizer) {
    window.apgiOptimizer = new APGIDataOptimizer();
    setTimeout(() => {
      window.apgiOptimizer.generateReport();
    }, 1000);
  }
}

/* Chart.js Fallback - Minimal Implementation */
window.Chart = function (ctx, config) {
  this.ctx = ctx;
  this.config = config;
  this.data = config.data || {};
  this.options = config.options || {};

  // Simple fallback rendering
  this.render = function () {
    const canvas = this.ctx.canvas;
    const width = canvas.width || canvas.clientWidth || 400;
    const height = canvas.height || canvas.clientHeight || 300;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw fallback text
    this.ctx.fillStyle = "#666";
    this.ctx.font = "14px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Chart (offline mode)", width / 2, height / 2 - 10);

    if (this.data.labels && this.data.datasets) {
      this.ctx.fillText(
        `${this.data.labels.length} data points`,
        width / 2,
        height / 2 + 10,
      );
    }
  };

  // Update chart
  this.update = function () {
    this.render();
  };

  // Destroy chart
  this.destroy = function () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  };

  // Initial render
  setTimeout(() => this.render(), 0);
};

// Chart types
Chart.defaults = {
  global: {
    defaultFontColor: "#666",
    defaultFontFamily: "sans-serif",
  },
};

// Register chart types
Chart.Bar = Chart;
Chart.Line = Chart;
Chart.Pie = Chart;
Chart.Doughnut = Chart;
Chart.Radar = Chart;
Chart.PolarArea = Chart;
Chart.Bubble = Chart;
Chart.Scatter = Chart;

// Plugin system (minimal)
Chart.plugins = [];
Chart.register = function () {};
Chart.unregister = function () {};

// Auto-resize helper
if (typeof window !== "undefined") {
  window.addEventListener("resize", function () {
    const charts = document.querySelectorAll("canvas");
    charts.forEach((canvas) => {
      if (canvas.chart) {
        canvas.chart.render();
      }
    });
  });
}

console.info("Chart.js fallback loaded - offline mode active");

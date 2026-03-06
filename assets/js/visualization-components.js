// Visualization Components
// Provides reusable visualization components for the APGI Framework

(function () {
  "use strict";

  // Chart Component Factory
  function createChartComponent(type, config) {
    const container = document.createElement("div");
    container.className = `chart-container chart-${type}`;
    container.style.cssText = `
      width: ${config.width || 400}px;
      height: ${config.height || 300}px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      color: #6b7280;
    `;

    const icon = document.createElement("div");
    icon.style.cssText = "font-size: 48px; margin-bottom: 16px;";
    icon.textContent = getChartIcon(type);

    const title = document.createElement("div");
    title.style.cssText =
      "font-size: 18px; font-weight: 600; margin-bottom: 8px;";
    title.textContent = getChartTitle(type);

    const subtitle = document.createElement("div");
    subtitle.style.cssText = "font-size: 14px; text-align: center;";
    subtitle.textContent = config.data
      ? `${config.data.length} data points loaded`
      : "Visualization library not available";

    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(subtitle);

    return container;
  }

  function getChartIcon(type) {
    const icons = {
      line: "📈",
      bar: "📊",
      pie: "🥧",
      radar: "🎯",
      scatter: "📍",
      area: "📉",
    };
    return icons[type] || "📊";
  }

  function getChartTitle(type) {
    const titles = {
      line: "Line Chart",
      bar: "Bar Chart",
      pie: "Pie Chart",
      radar: "Radar Chart",
      scatter: "Scatter Plot",
      area: "Area Chart",
    };
    return titles[type] || "Chart";
  }

  // Profile Visualization Component
  function createProfileVisualization(data) {
    const container = document.createElement("div");
    container.className = "profile-visualization";
    container.style.cssText = `
      width: 100%;
      max-width: 800px;
      height: 600px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 32px;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    const title = document.createElement("h2");
    title.style.cssText =
      "font-size: 32px; font-weight: 700; margin-bottom: 16px;";
    title.textContent = "Consciousness Profile";

    const description = document.createElement("p");
    description.style.cssText =
      "font-size: 18px; margin-bottom: 32px; opacity: 0.9;";
    description.textContent = data
      ? "Your unique cognitive signature has been analyzed."
      : "Profile visualization unavailable";

    if (data && data.length > 0) {
      const stats = document.createElement("div");
      stats.style.cssText =
        "display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; width: 100%;";
      data.forEach((item) => {
        const stat = document.createElement("div");
        stat.style.cssText =
          "background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px;";
        stat.innerHTML = `<div style="font-size: 24px; font-weight: 700;">${item.value || 0}</div><div style="font-size: 14px; opacity: 0.8;">${item.label || "Metric"}</div>`;
        stats.appendChild(stat);
      });
      container.appendChild(stats);
    }

    container.insertBefore(title, container.firstChild);
    container.insertBefore(description, title.nextSibling);

    return container;
  }

  // Dashboard Component
  function createDashboard(data) {
    const container = document.createElement("div");
    container.className = "dashboard-container";
    container.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    `;

    if (data && data.length > 0) {
      data.forEach((item) => {
        const card = document.createElement("div");
        card.style.cssText = `
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        `;

        const title = document.createElement("h3");
        title.style.cssText =
          "font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #1f2937;";
        title.textContent = item.title || "Metric";

        const value = document.createElement("div");
        value.style.cssText =
          "font-size: 32px; font-weight: 700; color: #3b82f6;";
        value.textContent = item.value || 0;

        const description = document.createElement("p");
        description.style.cssText =
          "font-size: 14px; color: #6b7280; margin-top: 8px;";
        description.textContent = item.description || "";

        card.appendChild(title);
        card.appendChild(value);
        card.appendChild(description);
        container.appendChild(card);
      });
    } else {
      const placeholder = document.createElement("div");
      placeholder.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 64px;
        color: #6b7280;
        font-size: 18px;
      `;
      placeholder.textContent = "Dashboard data not available";
      container.appendChild(placeholder);
    }

    return container;
  }

  // Export components globally
  window.VisualizationComponents = {
    createChartComponent,
    createProfileVisualization,
    createDashboard,
  };

  console.info("Visualization components loaded successfully");
})();

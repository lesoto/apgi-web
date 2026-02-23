/**
 * APGI Framework UI Components Library
 * Reusable components built on the design system for consistency
 */

class UIComponents {
  constructor() {
    this.init();
  }

  init() {
    this.createGlobalStyles();
    this.setupAutoInit();
  }

  // Create global styles for components
  createGlobalStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* UI Components Base Styles */
      .apgi-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .apgi-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .apgi-btn-primary {
        background: var(--color-secondary);
        color: white;
      }

      .apgi-btn-primary:hover:not(:disabled) {
        background: var(--color-secondary-dark);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      .apgi-btn-secondary {
        background: var(--color-bg-secondary);
        color: var(--color-text-primary);
        border: 1px solid var(--color-bg-quaternary);
      }

      .apgi-btn-secondary:hover:not(:disabled) {
        background: var(--color-bg-tertiary);
        border-color: var(--color-secondary);
      }

      .apgi-btn-success {
        background: var(--color-success);
        color: white;
      }

      .apgi-btn-warning {
        background: var(--color-warning);
        color: white;
      }

      .apgi-btn-danger {
        background: var(--color-danger);
        color: white;
      }

      .apgi-card {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-bg-quaternary);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
      }

      .apgi-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .apgi-form-group {
        margin-bottom: 20px;
      }

      .apgi-label {
        display: block;
        margin-bottom: 8px;
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .apgi-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--color-bg-quaternary);
        border-radius: 8px;
        font-family: var(--font-body);
        font-size: 14px;
        color: var(--color-text-primary);
        background: var(--color-bg-primary);
        transition: all 0.2s ease;
      }

      .apgi-input:focus {
        outline: none;
        border-color: var(--color-secondary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .apgi-input:invalid {
        border-color: var(--color-danger);
      }

      .apgi-select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L2 5h8z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 16px center;
        padding-right: 40px;
      }

      .apgi-textarea {
        resize: vertical;
        min-height: 100px;
      }

      .apgi-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .apgi-modal.active {
        opacity: 1;
        visibility: visible;
      }

      .apgi-modal-content {
        background: var(--color-bg-primary);
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      .apgi-modal.active .apgi-modal-content {
        transform: scale(1);
      }

      .apgi-alert {
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid;
        font-family: var(--font-body);
        font-size: 14px;
      }

      .apgi-alert-success {
        background: rgba(16, 185, 129, 0.1);
        border-left-color: var(--color-success);
        color: var(--color-success-dark);
      }

      .apgi-alert-warning {
        background: rgba(245, 158, 11, 0.1);
        border-left-color: var(--color-warning);
        color: var(--color-warning-dark);
      }

      .apgi-alert-danger {
        background: rgba(239, 68, 68, 0.1);
        border-left-color: var(--color-danger);
        color: var(--color-danger-dark);
      }

      .apgi-alert-info {
        background: rgba(6, 182, 212, 0.1);
        border-left-color: var(--color-info);
        color: var(--color-info-dark);
      }

      .apgi-loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid var(--color-bg-quaternary);
        border-top: 2px solid var(--color-secondary);
        border-radius: 50%;
        animation: apgi-spin 1s linear infinite;
      }

      @keyframes apgi-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .apgi-progress {
        width: 100%;
        height: 8px;
        background: var(--color-bg-tertiary);
        border-radius: 4px;
        overflow: hidden;
      }

      .apgi-progress-bar {
        height: 100%;
        background: var(--color-secondary);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .apgi-tabs {
        display: flex;
        border-bottom: 1px solid var(--color-bg-quaternary);
        margin-bottom: 20px;
      }

      .apgi-tab {
        padding: 12px 20px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .apgi-tab:hover {
        color: var(--color-text-primary);
      }

      .apgi-tab.active {
        color: var(--color-secondary);
        border-bottom-color: var(--color-secondary);
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-initialize components from data attributes
  setupAutoInit() {
    document.addEventListener("DOMContentLoaded", () => {
      this.initButtons();
      this.initCards();
      this.initForms();
      this.initModals();
      this.initAlerts();
    });
  }

  // Button Component
  createButton(text, options = {}) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "apgi-btn";

    // Add variant classes
    if (options.variant) {
      button.classList.add(`apgi-btn-${options.variant}`);
    }

    // Add size classes
    if (options.size) {
      button.classList.add(`apgi-btn-${options.size}`);
    }

    // Add other attributes
    if (options.disabled) button.disabled = true;
    if (options.loading) button.appendChild(this.createLoadingSpinner());
    if (options.onClick) button.addEventListener("click", options.onClick);

    return button;
  }

  // Card Component
  createCard(content, options = {}) {
    const card = document.createElement("div");
    card.className = "apgi-card";

    if (options.title) {
      const title = document.createElement("h3");
      title.textContent = options.title;
      title.style.marginBottom = "16px";
      card.appendChild(title);
    }

    if (typeof content === "string") {
      card.innerHTML = content;
    } else {
      card.appendChild(content);
    }

    return card;
  }

  // Form Components
  createFormGroup(label, input, options = {}) {
    const group = document.createElement("div");
    group.className = "apgi-form-group";

    if (label) {
      const labelEl = document.createElement("label");
      labelEl.className = "apgi-label";
      labelEl.textContent = label;
      if (options.required) labelEl.textContent += " *";
      group.appendChild(labelEl);
    }

    input.className = "apgi-input";
    if (options.type === "select") input.classList.add("apgi-select");
    if (options.type === "textarea") input.classList.add("apgi-textarea");

    group.appendChild(input);
    return group;
  }

  createInput(options = {}) {
    const input = document.createElement("input");
    input.type = options.type || "text";
    input.placeholder = options.placeholder || "";
    input.value = options.value || "";
    input.required = options.required || false;
    return input;
  }

  createSelect(options = {}) {
    const select = document.createElement("select");

    if (options.placeholder) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = options.placeholder;
      placeholder.disabled = true;
      select.appendChild(placeholder);
    }

    if (options.options) {
      options.options.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value || option;
        opt.textContent = option.label || option;
        select.appendChild(opt);
      });
    }

    return select;
  }

  // Modal Component
  createModal(title, content, options = {}) {
    const modal = document.createElement("div");
    modal.className = "apgi-modal";
    modal.id = options.id || "apgi-modal-" + Date.now();

    const modalContent = document.createElement("div");
    modalContent.className = "apgi-modal-content";

    // Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.marginBottom = "20px";

    const titleEl = document.createElement("h2");
    titleEl.textContent = title;
    titleEl.style.margin = "0";
    header.appendChild(titleEl);

    const closeBtn = this.createButton("×", { variant: "secondary" });
    closeBtn.addEventListener("click", () => this.closeModal(modal));
    header.appendChild(closeBtn);

    modalContent.appendChild(header);

    // Content
    if (typeof content === "string") {
      modalContent.innerHTML += content;
    } else {
      modalContent.appendChild(content);
    }

    // Footer
    if (options.footer) {
      const footer = document.createElement("div");
      footer.style.marginTop = "20px";
      footer.style.display = "flex";
      footer.style.gap = "10px";
      footer.style.justifyContent = "flex-end";

      options.footer.forEach((btn) => {
        footer.appendChild(btn);
      });

      modalContent.appendChild(footer);
    }

    modal.appendChild(modalContent);

    // Close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    return modal;
  }

  openModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeModal(modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Alert Component
  createAlert(message, type = "info", options = {}) {
    const alert = document.createElement("div");
    alert.className = `apgi-alert apgi-alert-${type}`;
    alert.textContent = message;

    if (options.dismissible) {
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "×";
      closeBtn.style.float = "right";
      closeBtn.style.background = "none";
      closeBtn.style.border = "none";
      closeBtn.style.fontSize = "18px";
      closeBtn.style.cursor = "pointer";
      closeBtn.addEventListener("click", () => alert.remove());
      alert.appendChild(closeBtn);
    }

    if (options.autoClose) {
      setTimeout(() => alert.remove(), options.autoClose);
    }

    return alert;
  }

  // Loading Spinner
  createLoadingSpinner() {
    const spinner = document.createElement("div");
    spinner.className = "apgi-loading";
    return spinner;
  }

  // Progress Bar
  createProgressBar(value = 0, options = {}) {
    const container = document.createElement("div");
    container.className = "apgi-progress";

    const bar = document.createElement("div");
    bar.className = "apgi-progress-bar";
    bar.style.width = `${value}%`;

    container.appendChild(bar);

    // Method to update progress
    container.updateProgress = (newValue) => {
      bar.style.width = `${Math.min(100, Math.max(0, newValue))}%`;
    };

    return container;
  }

  // Tabs Component
  createTabs(tabs, options = {}) {
    const container = document.createElement("div");

    // Tab buttons
    const tabButtons = document.createElement("div");
    tabButtons.className = "apgi-tabs";

    // Tab content
    const tabContent = document.createElement("div");

    tabs.forEach((tab, index) => {
      // Tab button
      const button = document.createElement("button");
      button.className = "apgi-tab";
      button.textContent = tab.label;
      if (index === 0) button.classList.add("active");

      button.addEventListener("click", () => {
        // Update active states
        tabButtons.querySelectorAll(".apgi-tab").forEach((btn) => {
          btn.classList.remove("active");
        });
        button.classList.add("active");

        // Update content
        tabContent.querySelectorAll(".apgi-tab-pane").forEach((pane) => {
          pane.style.display = "none";
        });
        pane.style.display = "block";
      });

      tabButtons.appendChild(button);

      // Tab content pane
      const pane = document.createElement("div");
      pane.className = "apgi-tab-pane";
      pane.style.display = index === 0 ? "block" : "none";

      if (typeof tab.content === "string") {
        pane.innerHTML = tab.content;
      } else {
        pane.appendChild(tab.content);
      }

      tabContent.appendChild(pane);
    });

    container.appendChild(tabButtons);
    container.appendChild(tabContent);

    return container;
  }

  // Auto-initialization methods
  initButtons() {
    document.querySelectorAll("[data-apgi-btn]").forEach((el) => {
      const variant = el.dataset.apgiBtn || "primary";
      el.classList.add("apgi-btn", `apgi-btn-${variant}`);
    });
  }

  initCards() {
    document.querySelectorAll("[data-apgi-card]").forEach((el) => {
      el.classList.add("apgi-card");
    });
  }

  initForms() {
    document.querySelectorAll("[data-apgi-form]").forEach((el) => {
      el.classList.add("apgi-form");
    });
  }

  initModals() {
    document.querySelectorAll("[data-apgi-modal]").forEach((trigger) => {
      const modalId = trigger.dataset.apgiModal;
      const modal = document.getElementById(modalId);

      if (modal) {
        modal.classList.add("apgi-modal");
        trigger.addEventListener("click", () => this.openModal(modal));

        // Add close buttons
        modal.querySelectorAll("[data-apgi-close]").forEach((closeBtn) => {
          closeBtn.addEventListener("click", () => this.closeModal(modal));
        });
      }
    });
  }

  initAlerts() {
    document.querySelectorAll("[data-apgi-alert]").forEach((el) => {
      const type = el.dataset.apgiAlert || "info";
      el.classList.add("apgi-alert", `apgi-alert-${type}`);
    });
  }
}

// Initialize globally
window.UIComponents = new UIComponents();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = UIComponents;
}

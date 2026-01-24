/**
 * Export UI Component for APGI Framework
 * Provides user interface for data export functionality
 */

class ExportUI {
  constructor(dataExportService) {
    this.exportService = dataExportService;
    this.currentData = null;
    this.init();
  }

  init() {
    this.createExportModal();
    this.setupEventListeners();
  }

  /**
   * Create export modal HTML
   */
  createExportModal() {
    const modalHTML = `
      <div id="exportModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
          <button id="closeExportModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Export Assessment Results</h3>
          
          <div class="space-y-4">
            <!-- Export Format Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button class="export-format-btn px-3 py-2 border border-gray-300 rounded-md hover:bg-blue-50 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-format="json">
                  <div class="text-center">
                    <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">JSON</span>
                  </div>
                </button>
                
                <button class="export-format-btn px-3 py-2 border border-gray-300 rounded-md hover:bg-green-50 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" data-format="csv">
                  <div class="text-center">
                    <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v7m3-2h6"></path>
                    </svg>
                    <span class="text-xs">CSV</span>
                  </div>
                </button>
                
                <button class="export-format-btn px-3 py-2 border border-gray-300 rounded-md hover:bg-red-50 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500" data-format="pdf">
                  <div class="text-center">
                    <svg class="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">PDF</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Filename Input -->
            <div>
              <label for="exportFilename" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filename (optional)
              </label>
              <input type="text" id="exportFilename" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="apgi-results">
            </div>

            <!-- Email Export -->
            <div>
              <label for="exportEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email to (optional)
              </label>
              <input type="email" id="exportEmail" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="your@email.com">
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-3">
              <button id="downloadExport" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Download
              </button>
              <button id="printExport" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close modal
    document
      .getElementById("closeExportModal")
      .addEventListener("click", () => {
        this.hideModal();
      });

    // Close on background click
    document.getElementById("exportModal").addEventListener("click", (e) => {
      if (e.target.id === "exportModal") {
        this.hideModal();
      }
    });

    // Format selection
    document.querySelectorAll(".export-format-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectFormat(
          e.target.closest(".export-format-btn").dataset.format,
        );
      });
    });

    // Download button
    document.getElementById("downloadExport").addEventListener("click", () => {
      this.handleDownload();
    });

    // Print button
    document.getElementById("printExport").addEventListener("click", () => {
      this.handlePrint();
    });

    // Email input change
    document.getElementById("exportEmail").addEventListener("input", (e) => {
      const downloadBtn = document.getElementById("downloadExport");
      if (e.target.value) {
        downloadBtn.textContent = "Email";
        downloadBtn.classList.remove("bg-blue-600", "hover:bg-blue-700");
        downloadBtn.classList.add("bg-green-600", "hover:bg-green-700");
      } else {
        downloadBtn.textContent = "Download";
        downloadBtn.classList.remove("bg-green-600", "hover:bg-green-700");
        downloadBtn.classList.add("bg-blue-600", "hover:bg-blue-700");
      }
    });
  }

  /**
   * Show export modal with data
   */
  showModal(data) {
    this.currentData = data;
    document.getElementById("exportModal").classList.remove("hidden");

    // Reset selections
    this.selectFormat("json");
    document.getElementById("exportFilename").value = "";
    document.getElementById("exportEmail").value = "";
  }

  /**
   * Hide export modal
   */
  hideModal() {
    document.getElementById("exportModal").classList.add("hidden");
    this.currentData = null;
  }

  /**
   * Select export format
   */
  selectFormat(format) {
    document.querySelectorAll(".export-format-btn").forEach((btn) => {
      btn.classList.remove(
        "bg-blue-100",
        "border-blue-500",
        "dark:bg-blue-900",
      );
    });

    const selectedBtn = document.querySelector(`[data-format="${format}"]`);
    selectedBtn.classList.add(
      "bg-blue-100",
      "border-blue-500",
      "dark:bg-blue-900",
    );

    this.selectedFormat = format;
  }

  /**
   * Handle download/email action
   */
  async handleDownload() {
    if (!this.currentData) return;

    const email = document.getElementById("exportEmail").value;
    const filename = document.getElementById("exportFilename").value;

    try {
      if (email) {
        await this.exportService.emailExport(
          this.currentData,
          this.selectedFormat,
          email,
        );
        this.showSuccess("Export sent to email!");
      } else {
        await this.exportService.exportData(
          this.currentData,
          this.selectedFormat,
          filename,
        );
        this.showSuccess("Export downloaded successfully!");
      }

      setTimeout(() => this.hideModal(), 2000);
    } catch (error) {
      this.showError("Export failed: " + error.message);
    }
  }

  /**
   * Handle print action
   */
  handlePrint() {
    if (!this.currentData) return;

    try {
      this.exportService.createPrintView(this.currentData);
      this.showSuccess("Print view opened!");
    } catch (error) {
      this.showError("Print failed: " + error.message);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showToast(message, "success");
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, "error");
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    const bgColor =
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : "bg-blue-500";

    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-y-full`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("translate-y-full");
    }, 100);

    setTimeout(() => {
      toast.classList.add("translate-y-full");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Initialize and export
window.ExportUI = ExportUI;

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (window.dataExport) {
      window.exportUI = new ExportUI(window.dataExport);
    }
  });
} else {
  if (window.dataExport) {
    window.exportUI = new ExportUI(window.dataExport);
  }
}

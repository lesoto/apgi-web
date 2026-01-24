/**
 * Data Export Service for APGI Framework
 * Provides PDF, CSV, JSON export functionality for assessment results
 */

class DataExportService {
  constructor() {
    this.exportFormats = ["pdf", "csv", "json"];
    this.defaultFilename = "apgi-assessment-results";
  }

  /**
   * Export assessment data in specified format
   */
  async exportData(data, format = "json", filename = null) {
    if (!this.exportFormats.includes(format)) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    const exportFilename = filename || `${this.defaultFilename}.${format}`;

    switch (format) {
      case "pdf":
        return this.exportToPDF(data, exportFilename);
      case "csv":
        return this.exportToCSV(data, exportFilename);
      case "json":
        return this.exportToJSON(data, exportFilename);
      default:
        throw new Error(`Export format ${format} not implemented`);
    }
  }

  /**
   * Export to JSON format
   */
  exportToJSON(data, filename) {
    const jsonData = {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      data: data,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });

    this.downloadFile(blob, filename);
    return true;
  }

  /**
   * Export to CSV format
   */
  exportToCSV(data, filename) {
    let csvContent = "";

    if (Array.isArray(data)) {
      // Handle array of objects
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        csvContent += headers.join(",") + "\n";

        data.forEach((item) => {
          const row = headers.map((header) => {
            const value = item[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          });
          csvContent += row.join(",") + "\n";
        });
      }
    } else if (typeof data === "object") {
      // Handle single object
      const headers = Object.keys(data);
      csvContent += headers.join(",") + "\n";
      const row = headers.map((header) => {
        const value = data[header];
        return typeof value === "string" && value.includes(",")
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvContent += row.join(",") + "\n";
    }

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    this.downloadFile(blob, filename);
    return true;
  }

  /**
   * Export to PDF format using browser print functionality
   */
  async exportToPDF(data, filename) {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for PDF export.");
    }

    const htmlContent = this.generatePDFHTML(data, filename);

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };

    return true;
  }

  /**
   * Generate HTML content for PDF export
   */
  generatePDFHTML(data, filename) {
    const timestamp = new Date().toLocaleString();
    let contentHTML = "";

    if (Array.isArray(data)) {
      contentHTML = this.generateTableHTML(data);
    } else if (typeof data === "object") {
      contentHTML = this.generateObjectHTML(data);
    } else {
      contentHTML = `<p>${data}</p>`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { 
            font-family: 'IBM Plex Sans', Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
          }
          .header h1 { color: #007bff; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: 600;
          }
          .data-row { 
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          .data-label { 
            font-weight: 600; 
            color: #007bff;
            display: inline-block;
            min-width: 150px;
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 0.9em;
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>APGI Assessment Results</h1>
          <p>Generated on ${timestamp}</p>
        </div>
        
        <div class="content">
          ${contentHTML}
        </div>
        
        <div class="footer">
          <p>© 2024 APGI Framework - Allostatic Precision-Gated Ignition</p>
          <p>This report contains confidential assessment data.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML table from array data
   */
  generateTableHTML(data) {
    if (data.length === 0) return "<p>No data available</p>";

    const headers = Object.keys(data[0]);
    let tableHTML = "<table><thead><tr>";

    headers.forEach((header) => {
      tableHTML += `<th>${this.formatHeader(header)}</th>`;
    });

    tableHTML += "</tr></thead><tbody>";

    data.forEach((item) => {
      tableHTML += "<tr>";
      headers.forEach((header) => {
        tableHTML += `<td>${item[header] || ""}</td>`;
      });
      tableHTML += "</tr>";
    });

    tableHTML += "</tbody></table>";
    return tableHTML;
  }

  /**
   * Generate HTML from single object
   */
  generateObjectHTML(data) {
    let html = "";

    Object.keys(data).forEach((key) => {
      const value = data[key];
      html += `
        <div class="data-row">
          <span class="data-label">${this.formatHeader(key)}:</span>
          <span>${this.formatValue(value)}</span>
        </div>
      `;
    });

    return html;
  }

  /**
   * Format header names for display
   */
  formatHeader(header) {
    return header
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .trim();
  }

  /**
   * Format values for display
   */
  formatValue(value) {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value;
  }

  /**
   * Download file to user's device
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Email export functionality
   */
  async emailExport(data, format = "pdf", recipientEmail, subject = null) {
    try {
      // Generate the export file
      const filename = `${this.defaultFilename}.${format}`;
      await this.exportData(data, format, filename);

      // Create email content
      const emailSubject = subject || "APGI Assessment Results";
      const emailBody = `
        Dear User,
        
        Please find your APGI assessment results attached in ${format.toUpperCase()} format.
        
        Generated on: ${new Date().toLocaleString()}
        
        Best regards,
        APGI Framework Team
      `;

      // Create mailto link
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      // Open email client
      window.location.href = mailtoLink;

      return true;
    } catch (error) {
      console.error("Email export failed:", error);
      throw new Error("Failed to send email export");
    }
  }

  /**
   * Create print-optimized view
   */
  createPrintView(data) {
    const printHTML = this.generatePDFHTML(data, "print-view");
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups for print view.");
    }

    printWindow.document.write(printHTML);
    printWindow.document.close();

    return printWindow;
  }
}

// Initialize and export
window.DataExportService = DataExportService;

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.dataExport = new DataExportService();
  });
} else {
  window.dataExport = new DataExportService();
}

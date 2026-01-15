// Offline Quiz Manager for APGI Framework
// Handles quiz result storage and sync when offline

class OfflineQuizManager {
  constructor() {
    this.dbName = "APGIQuizResults";
    this.dbVersion = 1;
    this.storeName = "results";
    this.init();
  }

  async init() {
    // Initialize IndexedDB for offline storage
    this.db = await this.openDB();

    // Check if we're coming back online and need to sync
    this.setupSyncListener();
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("synced", "synced", { unique: false });
        }
      };
    });
  }

  async storeQuizResult(result) {
    if (!this.db) {
      console.warn("Offline storage not available");
      return null;
    }

    const resultWithId = {
      ...result,
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      synced: false,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const addRequest = store.add(resultWithId);

      addRequest.onsuccess = () => {
        resolve(resultWithId);
        this.showOfflineNotification(
          "Quiz result saved locally. Will sync when online.",
        );
      };

      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getStoredResults() {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }

  async syncResults() {
    if (!navigator.onLine) {
      return { success: false, message: "Still offline" };
    }

    const results = await this.getStoredResults();
    const unsyncedResults = results.filter((r) => !r.synced);

    if (unsyncedResults.length === 0) {
      return { success: true, message: "No results to sync" };
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const result of unsyncedResults) {
      try {
        // Try to sync with server (if API endpoint exists)
        const response = await fetch("/api/quiz-results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result),
        });

        if (response.ok) {
          // Mark as synced
          await this.markAsSynced(result.id);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        console.warn("Failed to sync quiz result:", error);
      }
    }

    const message = `Synced ${syncedCount} results${failedCount > 0 ? `, ${failedCount} failed` : ""}`;
    this.showSyncNotification(message);

    return { success: true, message, syncedCount, failedCount };
  }

  async markAsSynced(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          result.synced = true;
          result.syncedAt = new Date().toISOString();

          const updateRequest = store.put(result);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error("Result not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  setupSyncListener() {
    // Listen for online events to trigger sync
    window.addEventListener("online", () => {
      this.syncResults();
    });
  }

  showOfflineNotification(message) {
    // Show a subtle notification that result was saved offline
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(20px)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  showSyncNotification(message) {
    // Show sync notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Enhanced export function that works offline
  async exportResults(results) {
    const exportData = {
      timestamp: new Date().toISOString(),
      isOffline: !navigator.onLine,
      results: results,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        online: navigator.onLine,
        connection: navigator.connection
          ? navigator.connection.effectiveType
          : "unknown",
      },
    };

    // Store offline copy as well
    if (!navigator.onLine) {
      await this.storeQuizResult(exportData);
    }

    // Create download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `APGI_Assessment_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }
}

// Initialize offline quiz manager
window.offlineQuizManager = new OfflineQuizManager();

// Export for use in assessment pages
if (typeof module !== "undefined" && module.exports) {
  module.exports = OfflineQuizManager;
}

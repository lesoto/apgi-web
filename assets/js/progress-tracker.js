/**
 * Progress Tracker Service for APGI Framework
 * Tracks assessment progress with database storage
 */

// Import console utility
const { safeConsole } =
  typeof window.consoleUtils !== "undefined"
    ? window.consoleUtils
    : { safeConsole: console };

class ProgressTracker {
  constructor() {
    this.storageKey = "apgi-progress";
    this.currentAssessment = null;
    this.init();
  }

  init() {
    // Load saved progress from localStorage
    this.loadProgress();

    // Auto-save progress periodically
    setInterval(() => this.autoSave(), 30000); // Every 30 seconds

    // Save on page unload
    window.addEventListener("beforeunload", () => this.autoSave());
  }

  /**
   * Start tracking a new assessment
   */
  startAssessment(assessmentId, assessmentType, totalQuestions = 0) {
    this.currentAssessment = {
      id: assessmentId,
      type: assessmentType,
      totalQuestions: totalQuestions,
      currentQuestion: 0,
      answers: {},
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: "in_progress",
    };

    this.saveProgress();
    return this.currentAssessment;
  }

  /**
   * Record an answer to a question
   */
  recordAnswer(questionId, answer) {
    if (!this.currentAssessment) {
      safeConsole.warn("No active assessment to record answer");
      return null;
    }

    this.currentAssessment.answers[questionId] = {
      value: answer,
      timestamp: new Date().toISOString(),
    };

    this.currentAssessment.currentQuestion = Math.max(
      this.currentAssessment.currentQuestion,
      parseInt(questionId.replace(/\D/g, "")) || 0,
    );

    this.currentAssessment.lastUpdated = new Date().toISOString();
    this.saveProgress();

    return this.currentAssessment;
  }

  /**
   * Get current progress percentage
   */
  getProgressPercentage() {
    if (
      !this.currentAssessment ||
      this.currentAssessment.totalQuestions === 0
    ) {
      return 0;
    }

    const answeredCount = Object.keys(this.currentAssessment.answers).length;
    return Math.round(
      (answeredCount / this.currentAssessment.totalQuestions) * 100,
    );
  }

  /**
   * Get answered questions count
   */
  getAnsweredCount() {
    if (!this.currentAssessment) return 0;
    return Object.keys(this.currentAssessment.answers).length;
  }

  /**
   * Resume an existing assessment
   */
  resumeAssessment(assessmentId) {
    const savedProgress = this.loadProgress();

    if (savedProgress && savedProgress.id === assessmentId) {
      this.currentAssessment = savedProgress;
      return this.currentAssessment;
    }

    return null;
  }

  /**
   * Complete an assessment
   */
  completeAssessment(results = null) {
    if (!this.currentAssessment) {
      safeConsole.warn("No active assessment to complete");
      return null;
    }

    this.currentAssessment.status = "completed";
    this.currentAssessment.endTime = new Date().toISOString();
    this.currentAssessment.lastUpdated = new Date().toISOString();

    if (results) {
      this.currentAssessment.results = results;
    }

    this.saveProgress();

    // Send to server for database storage
    this.sendToServer(this.currentAssessment);

    return this.currentAssessment;
  }

  /**
   * Abandon an assessment
   */
  abandonAssessment() {
    if (!this.currentAssessment) return;

    this.currentAssessment.status = "abandoned";
    this.currentAssessment.endTime = new Date().toISOString();
    this.currentAssessment.lastUpdated = new Date().toISOString();

    this.saveProgress();
    this.currentAssessment = null;
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    if (!this.currentAssessment) return;

    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.currentAssessment),
      );
    } catch (error) {
      safeConsole.error("Failed to save progress:", error);
    }
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const progress = JSON.parse(saved);

        // Check if progress is recent (within 7 days)
        const savedDate = new Date(progress.lastUpdated);
        const now = new Date();
        const daysDiff = (now - savedDate) / (1000 * 60 * 60 * 24);

        if (daysDiff < 7) {
          this.currentAssessment = progress;
          return progress;
        }
      }
    } catch (error) {
      safeConsole.error("Failed to load progress:", error);
    }

    return null;
  }

  /**
   * Auto-save progress
   */
  autoSave() {
    if (this.currentAssessment) {
      this.saveProgress();
    }
  }

  /**
   * Send progress to server for database storage
   */
  async sendToServer(progressData) {
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error("Failed to save progress to server");
      }

      return await response.json();
    } catch (error) {
      safeConsole.error("Failed to send progress to server:", error);
      // Store in localStorage as fallback
      this.saveProgress();
    }
  }

  /**
   * Get all assessments for a user
   */
  async getUserAssessments(userId) {
    try {
      const response = await fetch(`/api/assessments?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch assessments");
      return await response.json();
    } catch (error) {
      safeConsole.error("Failed to fetch user assessments:", error);
      return [];
    }
  }

  /**
   * Clear all progress
   */
  clearProgress() {
    this.currentAssessment = null;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      safeConsole.error("Failed to clear progress:", error);
    }
  }

  /**
   * Get assessment statistics
   */
  getStatistics() {
    if (!this.currentAssessment) return null;

    const answeredCount = this.getAnsweredCount();
    const percentage = this.getProgressPercentage();

    return {
      answered: answeredCount,
      total: this.currentAssessment.totalQuestions,
      percentage: percentage,
      remaining: this.currentAssessment.totalQuestions - answeredCount,
      startTime: this.currentAssessment.startTime,
      lastUpdated: this.currentAssessment.lastUpdated,
      status: this.currentAssessment.status,
    };
  }
}

// Initialize and export
window.ProgressTracker = ProgressTracker;

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.progressTracker = new ProgressTracker();
  });
} else {
  window.progressTracker = new ProgressTracker();
}

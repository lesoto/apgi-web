/**
 * Lazy Quiz Loader
 * Loads quiz.js only when user scrolls near the quiz section
 * Uses IntersectionObserver for efficient scroll-based loading
 * @version 1.0.0
 */

(function () {
  "use strict";

  const LAZY_LOAD_CONFIG = {
    rootMargin: "100px 0px", // Load when within 100px of viewport
    threshold: 0.01, // Trigger when 1% visible
    retryAttempts: 3,
    retryDelay: 1000,
  };

  let loadAttempts = 0;
  let quizLoaded = false;

  /**
   * Check if quiz container exists in DOM
   */
  function hasQuizContainer() {
    return !!document.getElementById("quiz-container");
  }

  /**
   * Dynamically load quiz.js script
   */
  function loadQuizScript() {
    if (quizLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "assets/js/quiz.js";
      script.async = true;

      script.onload = () => {
        quizLoaded = true;
        console.log("[Lazy Loader] Quiz loaded successfully");
        resolve();
      };

      script.onerror = () => {
        loadAttempts++;
        if (loadAttempts < LAZY_LOAD_CONFIG.retryAttempts) {
          console.log(
            `[Lazy Loader] Retry ${loadAttempts}/${LAZY_LOAD_CONFIG.retryAttempts}`,
          );
          setTimeout(
            () => loadQuizScript().then(resolve).catch(reject),
            LAZY_LOAD_CONFIG.retryDelay,
          );
        } else {
          reject(new Error("Failed to load quiz after multiple attempts"));
        }
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize IntersectionObserver for quiz section
   */
  function initLazyLoader() {
    if (!hasQuizContainer()) {
      console.log("[Lazy Loader] No quiz container found");
      return;
    }

    // Check if IntersectionObserver is supported
    if (!("IntersectionObserver" in window)) {
      // Fallback: load immediately for older browsers
      console.log(
        "[Lazy Loader] IntersectionObserver not supported, loading immediately",
      );
      loadQuizScript();
      return;
    }

    const quizSection = document.getElementById("quiz");
    if (!quizSection) {
      console.log("[Lazy Loader] Quiz section not found");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !quizLoaded) {
            console.log("[Lazy Loader] Quiz section visible, loading quiz...");
            loadQuizScript()
              .then(() => {
                // Disconnect observer after successful load
                observer.disconnect();
              })
              .catch((error) => {
                console.error("[Lazy Loader] Failed to load quiz:", error);
              });
          }
        });
      },
      {
        rootMargin: LAZY_LOAD_CONFIG.rootMargin,
        threshold: LAZY_LOAD_CONFIG.threshold,
      },
    );

    observer.observe(quizSection);
    console.log("[Lazy Loader] Observer initialized for quiz section");
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLazyLoader);
  } else {
    // DOM already loaded
    initLazyLoader();
  }

  // Also provide manual trigger for testing/debugging
  window.loadQuizManually = loadQuizScript;
})();

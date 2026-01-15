// Assessment Quiz Functionality
// Extracted from Assessment.html for better performance and maintainability

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAssessment);
} else {
  initializeAssessment();
}

function initializeAssessment() {
  // Wait for quizData to be available
  if (typeof quizData === "undefined") {
    console.error(
      "quizData is not available. Make sure assessment-quiz.js is loaded first.",
    );
    return;
  }
  // ========== STATE MANAGEMENT ==========
  let currentSection = 0;
  let currentQuestion = 0;
  let answers = {};
  let scores = {
    epsilon: 0,
    precision: 0,
    threshold: 0,
    somatic: 0,
    interactions: 0,
    temporal: 0,
    environment: 0,
  };
  let chartInstances = {};
  let interactionEffects = [];

  // ========== DOM ELEMENTS ==========
  const introductionSection = document.getElementById("introduction-section");
  const quizSection = document.getElementById("quiz-section");
  const resultsContainer = document.getElementById("results-container");
  const startQuizBtn = document.getElementById("start-quiz-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const questionContainer = document.getElementById("question-container");
  const sectionTitle = document.getElementById("section-title");
  const sectionSubtitle = document.getElementById("section-subtitle");
  const sectionIcon = document.getElementById("section-icon");
  const currentQuestionEl = document.getElementById("current-question");
  const currentSectionEl = document.getElementById("current-section");
  const totalSectionsEl = document.getElementById("total-sections");
  const totalQuestionsEl = document.getElementById("total-questions");
  const progressFill = document.getElementById("progress-fill");
  const retakeBtn = document.getElementById("retake-btn");
  const downloadBtn = document.getElementById("download-btn");
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  // ========== INITIALIZATION ==========
  function initQuiz() {
    // Check if required elements exist
    if (!introductionSection || !quizSection || !resultsContainer) {
      console.error("Required quiz elements not found");
      return;
    }

    // Calculate total questions
    let totalQuestions = 0;
    quizData.sections.forEach((section) => {
      totalQuestions += section.questions.length;
    });
    totalQuestionsEl.textContent = totalQuestions;
    totalSectionsEl.textContent = quizData.sections.length;

    // Set up event listeners
    if (startQuizBtn) startQuizBtn.addEventListener("click", startQuiz);
    if (prevBtn) prevBtn.addEventListener("click", showPreviousQuestion);
    if (nextBtn) nextBtn.addEventListener("click", showNextQuestion);
    if (retakeBtn) retakeBtn.addEventListener("click", retakeQuiz);
    if (downloadBtn) downloadBtn.addEventListener("click", downloadReport);

    // Tab switching
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabId = tab.dataset.tab;
        switchTab(tabId);
      });
    });

    // Initialize answers object
    quizData.sections.forEach((section) => {
      section.questions.forEach((question) => {
        answers[question.id] = null;
      });
    });
  }

  // ========== LOADING STATES ==========
  function showLoading(message = "Processing...") {
    const overlay = document.getElementById("loadingOverlay");
    const loadingText = overlay.querySelector(".loading-text");
    loadingText.textContent = message;
    overlay.classList.add("active");
  }

  function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.remove("active");
  }

  function setButtonLoading(button, loading = true) {
    if (loading) {
      button.classList.add("button-loading");
      button.disabled = true;
    } else {
      button.classList.remove("button-loading");
      button.disabled = false;
    }
  }

  function showChartLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "chart-loading";
    loadingDiv.id = `${containerId}-loading`;
    loadingDiv.innerHTML = `
      <div class="spinner"></div>
      <div>Generating visualization...</div>
    `;
    container.appendChild(loadingDiv);
  }

  function hideChartLoading(containerId) {
    const loadingDiv = document.getElementById(`${containerId}-loading`);
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // ========== UTILITY FUNCTIONS ==========
  function getTotalQuestions() {
    let total = 0;
    quizData.sections.forEach((section) => {
      total += section.questions.length;
    });
    return total;
  }

  function getAnsweredCount() {
    let count = 0;
    for (let answer of Object.values(answers)) {
      if (answer !== null) count++;
    }
    return count;
  }

  function getParameterLevel(score, max) {
    const percentage = (score / max) * 100;
    if (percentage <= 25) return "Very Low";
    if (percentage <= 50) return "Low";
    if (percentage <= 75) return "Moderate";
    return "High";
  }

  function getTemporalStability(score) {
    const percentage = (score / 20) * 100;
    if (percentage <= 33) return "Transient (minutes-hours)";
    if (percentage <= 66) return "Enduring (days-weeks)";
    return "Entrenched (weeks-months)";
  }

  function switchTab(tabId) {
    tabs.forEach((tab) => tab.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");
  }

  // ========== QUIZ LOGIC ==========
  function startQuiz() {
    introductionSection.style.opacity = "0";
    introductionSection.style.transform = "translateY(20px)";

    setTimeout(() => {
      introductionSection.style.display = "none";
      quizSection.style.display = "block";
      quizSection.style.opacity = "0";
      quizSection.style.transform = "translateY(20px)";

      setTimeout(() => {
        showQuestion();
        quizSection.style.opacity = "1";
        quizSection.style.transform = "translateY(0)";
      }, 50);
    }, 300);
  }

  function showQuestion() {
    const section = quizData.sections[currentSection];
    const question = section.questions[currentQuestion];

    questionContainer.style.opacity = "0";
    questionContainer.style.transform = "translateY(20px)";

    setTimeout(() => {
      // Update section info
      sectionTitle.textContent = section.title;
      sectionSubtitle.textContent = section.subtitle;
      sectionIcon.innerHTML = `<i class="${section.icon}"></i>`;

      // Update progress
      const totalQuestions = getTotalQuestions();
      const answeredQuestions = getAnsweredCount();
      const currentQuestionNum = answeredQuestions + 1;
      currentQuestionEl.textContent = currentQuestionNum;
      currentSectionEl.textContent = currentSection + 1;
      progressFill.style.width = `${(answeredQuestions / totalQuestions) * 100}%`;

      // Update navigation buttons
      prevBtn.disabled = currentSection === 0 && currentQuestion === 0;

      // Update next button text
      if (
        currentSection === quizData.sections.length - 1 &&
        currentQuestion === section.questions.length - 1
      ) {
        nextBtn.innerHTML =
          'View Complete Results <i class="fas fa-chart-bar"></i>';
      } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
      }

      // Clear and create question
      questionContainer.innerHTML = "";

      const questionEl = document.createElement("div");
      questionEl.className = "question";

      const questionText = document.createElement("div");
      questionText.className = "question-text";
      questionText.textContent = `${question.id}. ${question.text}`;
      questionEl.appendChild(questionText);

      const optionsEl = document.createElement("div");
      optionsEl.className = "options";

      const optionLetters = ["A", "B", "C", "D"];
      question.options.forEach((option, index) => {
        const optionEl = document.createElement("div");
        optionEl.className = `option ${answers[question.id] === option.value ? "selected" : ""}`;
        optionEl.dataset.value = option.value;

        optionEl.addEventListener("click", () =>
          selectOption(question.id, option.value),
        );

        const optionLetter = document.createElement("div");
        optionLetter.className = "option-letter";
        optionLetter.textContent = optionLetters[index];

        const optionContent = document.createElement("div");
        optionContent.className = "option-content";

        const optionText = document.createElement("div");
        optionText.className = "option-text";
        optionText.textContent = option.text;

        const optionNote = document.createElement("div");
        optionNote.className = "option-note";
        optionNote.textContent = option.note;

        optionContent.appendChild(optionText);
        optionContent.appendChild(optionNote);

        optionEl.appendChild(optionLetter);
        optionEl.appendChild(optionContent);

        optionsEl.appendChild(optionEl);
      });

      questionEl.appendChild(optionsEl);
      questionContainer.appendChild(questionEl);
      nextBtn.disabled = answers[question.id] === null;

      setTimeout(() => {
        questionContainer.style.opacity = "1";
        questionContainer.style.transform = "translateY(0)";
      }, 50);
    }, 300);
  }

  function selectOption(questionId, value) {
    answers[questionId] = parseInt(value);

    document.querySelectorAll(".option").forEach((option) => {
      option.classList.remove("selected");
      if (parseInt(option.dataset.value) === parseInt(value)) {
        option.classList.add("selected");
      }
    });

    nextBtn.disabled = false;
  }

  function showPreviousQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
    } else if (currentSection > 0) {
      currentSection--;
      currentQuestion = quizData.sections[currentSection].questions.length - 1;
    }

    showQuestion();
  }

  function showNextQuestion() {
    const currentQuestionId =
      quizData.sections[currentSection].questions[currentQuestion].id;
    if (answers[currentQuestionId] === null) {
      alert("Please select an answer before proceeding.");
      return;
    }

    setButtonLoading(nextBtn, true);

    // Simulate processing delay for better UX
    setTimeout(() => {
      if (
        currentQuestion <
        quizData.sections[currentSection].questions.length - 1
      ) {
        currentQuestion++;
      } else if (currentSection < quizData.sections.length - 1) {
        currentSection++;
        currentQuestion = 0;
      } else {
        calculateResults();
        showResults();
        setButtonLoading(nextBtn, false);
        return;
      }

      showQuestion();
      setButtonLoading(nextBtn, false);
    }, 300);
  }

  // ========== RESULTS CALCULATION ==========
  function calculateResults() {
    showLoading("Calculating your results...");

    // Simulate processing time for better UX
    setTimeout(() => {
      // Reset scores
      scores = {
        epsilon: 0,
        precision: 0,
        threshold: 0,
        somatic: 0,
        interactions: 0,
        temporal: 0,
        environment: 0,
      };

      // Calculate section scores
      quizData.sections.forEach((section) => {
        section.questions.forEach((question) => {
          const answer = answers[question.id];
          if (answer !== null) {
            if (section.id === "epsilon") scores.epsilon += answer;
            else if (section.id === "precision") scores.precision += answer;
            else if (section.id === "threshold") scores.threshold += answer;
            else if (section.id === "somatic") scores.somatic += answer;
            else if (section.id === "interactions")
              scores.interactions += answer;
            else if (section.id === "temporal") scores.temporal += answer;
            else if (section.id === "environment") scores.environment += answer;
          }
        });
      });

      // Calculate interaction effects
      calculateInteractions();
      hideLoading();
    }, 1500);
  }

  function calculateInteractions() {
    interactionEffects = [];

    // ε × β interaction: Prediction errors triggering somatic responses
    const epsilonBetaInteraction =
      (scores.epsilon / 20) * (scores.somatic / 20);
    if (epsilonBetaInteraction > 0.6) {
      interactionEffects.push({
        name: "Somatic Amplification of Surprises",
        strength: "High",
        description: "Prediction errors strongly trigger bodily reactions",
        effect: "Surprises feel physically intense, can create anxiety loops",
      });
    }

    // Add default balanced interaction if few effects
    if (interactionEffects.length < 2) {
      interactionEffects.push({
        name: "Moderately Coupled Parameters",
        strength: "Moderate",
        description: "Parameters work somewhat independently",
        effect: "Less extreme interaction effects, more modular processing",
      });
    }
  }

  function determineProfile(scores) {
    for (const [key, profile] of Object.entries(quizData.profiles)) {
      const ranges = profile.ranges;
      if (
        scores.epsilon >= ranges.epsilon[0] &&
        scores.epsilon <= ranges.epsilon[1] &&
        scores.precision >= ranges.precision[0] &&
        scores.precision <= ranges.precision[1] &&
        scores.threshold >= ranges.threshold[0] &&
        scores.threshold <= ranges.threshold[1] &&
        scores.somatic >= ranges.somatic[0] &&
        scores.somatic <= ranges.somatic[1]
      ) {
        return profile;
      }
    }

    // Find closest profile by Euclidean distance
    let closestProfile = quizData.profiles.ADAPTIVE_BALANCER;
    let minDistance = Infinity;

    for (const [key, profile] of Object.entries(quizData.profiles)) {
      const ranges = profile.ranges;
      const epsilonMid = (ranges.epsilon[0] + ranges.epsilon[1]) / 2;
      const precisionMid = (ranges.precision[0] + ranges.precision[1]) / 2;
      const thresholdMid = (ranges.threshold[0] + ranges.threshold[1]) / 2;
      const somaticMid = (ranges.somatic[0] + ranges.somatic[1]) / 2;

      const distance = Math.sqrt(
        Math.pow(scores.epsilon - epsilonMid, 2) +
          Math.pow(scores.precision - precisionMid, 2) +
          Math.pow(scores.threshold - thresholdMid, 2) +
          Math.pow(scores.somatic - somaticMid, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestProfile = profile;
      }
    }

    return closestProfile;
  }

  // ========== RESULTS DISPLAY ==========
  function showResults() {
    quizSection.style.opacity = "0";
    quizSection.style.transform = "translateY(20px)";

    setTimeout(() => {
      quizSection.style.display = "none";
      resultsContainer.style.display = "block";
      resultsContainer.style.opacity = "0";
      resultsContainer.style.transform = "translateY(20px)";

      // Determine profile
      const profile = determineProfile(scores);

      // Update profile info
      document.getElementById("profile-name").textContent = profile.name;
      document.getElementById("mechanism-text").textContent = profile.mechanism;

      // Update parameter scores
      document.getElementById("epsilon-score").textContent = scores.epsilon;
      document.getElementById("precision-score").textContent = scores.precision;
      document.getElementById("threshold-score").textContent = scores.threshold;
      document.getElementById("somatic-score").textContent = scores.somatic;

      // Update parameter levels
      document.getElementById("epsilon-level").textContent = getParameterLevel(
        scores.epsilon,
        20,
      );
      document.getElementById("epsilon-level").className =
        `parameter-level level-badge level-${getParameterLevel(scores.epsilon, 20).toLowerCase()}`;
      document.getElementById("precision-level").textContent =
        getParameterLevel(scores.precision, 20);
      document.getElementById("precision-level").className =
        `parameter-level level-badge level-${getParameterLevel(scores.precision, 20).toLowerCase()}`;
      document.getElementById("threshold-level").textContent =
        getParameterLevel(scores.threshold, 20);
      document.getElementById("threshold-level").className =
        `parameter-level level-badge level-${getParameterLevel(scores.threshold, 20).toLowerCase()}`;
      document.getElementById("somatic-level").textContent = getParameterLevel(
        scores.somatic,
        20,
      );
      document.getElementById("somatic-level").className =
        `parameter-level level-badge level-${getParameterLevel(scores.somatic, 20).toLowerCase()}`;

      // Update temporal stability
      const temporalScore = scores.temporal;
      const temporalPercent = (temporalScore / 20) * 100;
      document.getElementById("temporal-marker").style.left =
        `${temporalPercent}%`;
      document.getElementById("temporal-text").textContent =
        getTemporalStability(temporalScore);
      document.getElementById("recovery-time").textContent =
        `Recovery: ${profile.recoveryTime}`;

      // Update interaction grid
      const interactionGrid = document.getElementById("interaction-grid");
      interactionGrid.innerHTML = "";
      interactionEffects.forEach((interaction) => {
        const item = document.createElement("div");
        item.className = "interaction-item";
        item.innerHTML = `
                    <div class="interaction-title">${interaction.name}</div>
                    <div><strong>Strength:</strong> ${interaction.strength}</div>
                    <div>${interaction.description}</div>
                    <div><em>Effect:</em> ${interaction.effect}</div>
                `;
        interactionGrid.appendChild(item);
      });

      // Update environmental contexts
      const optimalContexts = document.getElementById("optimal-contexts");
      optimalContexts.innerHTML = "";
      profile.optimalContexts.forEach((context) => {
        const factor = document.createElement("div");
        factor.className = "context-factor";
        factor.textContent = context;
        optimalContexts.appendChild(factor);
      });

      const challengingContexts = document.getElementById(
        "challenging-contexts",
      );
      challengingContexts.innerHTML = "";
      profile.challengingContexts.forEach((context) => {
        const factor = document.createElement("div");
        factor.className = "context-factor";
        factor.textContent = context;
        challengingContexts.appendChild(factor);
      });

      // Update strengths and vulnerabilities
      const strengthsList = document.getElementById("strengths-list");
      strengthsList.innerHTML = "";
      profile.strengths.forEach((strength) => {
        const li = document.createElement("li");
        li.textContent = strength;
        strengthsList.appendChild(li);
      });

      const vulnerabilitiesList = document.getElementById(
        "vulnerabilities-list",
      );
      vulnerabilitiesList.innerHTML = "";
      profile.vulnerabilities.forEach((vulnerability) => {
        const li = document.createElement("li");
        li.textContent = vulnerability;
        vulnerabilitiesList.appendChild(li);
      });

      // Update strategies
      document.getElementById("strategies-text").innerHTML = `
                <p>${profile.strategies}</p>
                ${profile.interactions ? `<p><strong>Key Interactions:</strong> ${profile.interactions.join("; ")}</p>` : ""}
            `;

      setTimeout(() => {
        resultsContainer.style.opacity = "1";
        resultsContainer.style.transform = "translateY(0)";

        // Initialize charts after showing results
        setTimeout(() => {
          initializeCharts();
        }, 100);
      }, 50);
    }, 300);
  }

  function retakeQuiz() {
    // Reset state
    currentSection = 0;
    currentQuestion = 0;
    answers = {};
    scores = {
      epsilon: 0,
      precision: 0,
      threshold: 0,
      somatic: 0,
      interactions: 0,
      temporal: 0,
      environment: 0,
    };
    interactionEffects = [];

    // Reset UI
    resultsContainer.style.display = "none";
    introductionSection.style.display = "block";
    introductionSection.style.opacity = "1";
    introductionSection.style.transform = "translateY(0)";

    // Reset answers
    quizData.sections.forEach((section) => {
      section.questions.forEach((question) => {
        answers[question.id] = null;
      });
    });
  }

  function downloadReport() {
    setButtonLoading(downloadBtn, true);
    showLoading("Generating your report...");

    setTimeout(() => {
      // Create report data
      const reportData = {
        date: new Date().toISOString(),
        profile: determineProfile(scores),
        scores: scores,
        answers: answers,
        interactionEffects: interactionEffects,
      };

      // Create and download file
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `apgi-assessment-${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      hideLoading();
      setButtonLoading(downloadBtn, false);
    }, 1000);
  }

  // ========== CHART INITIALIZATION ==========
  function initializeCharts() {
    showLoading("Initializing visualizations...");

    // Destroy existing charts if they exist
    Object.values(chartInstances).forEach((chart) => {
      if (chart) chart.destroy();
    });
    chartInstances = {};

    // Show loading states for chart containers
    showChartLoading("radarChart");
    showChartLoading("gaugeCharts");
    showChartLoading("interactionChart");
    showChartLoading("temporalChart");
    showChartLoading("environmentChart");

    setTimeout(() => {
      // Initialize Radar Chart
      initializeRadarChart();
      hideChartLoading("radarChart");

      // Initialize Gauge Charts
      initializeGaugeCharts();
      hideChartLoading("gaugeCharts");

      // Initialize Interaction Chart
      initializeInteractionChart();
      hideChartLoading("interactionChart");

      // Initialize Temporal Chart
      initializeTemporalChart();
      hideChartLoading("temporalChart");

      // Initialize Environment Chart
      initializeEnvironmentChart();
      hideChartLoading("environmentChart");

      hideLoading();
    }, 800);
  }

  function initializeRadarChart() {
    const ctx = document.getElementById("radarChart");
    if (!ctx) return;

    chartInstances.radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: [
          "Prediction Error (ε)",
          "Precision (π)",
          "Threshold (θₜ)",
          "Somatic Bias (β)",
        ],
        datasets: [
          {
            label: "Your Scores",
            data: [
              scores.epsilon,
              scores.precision,
              scores.threshold,
              scores.somatic,
            ],
            backgroundColor: "rgba(22, 88, 242, 0.2)",
            borderColor: "rgba(22, 88, 242, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(22, 88, 242, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(22, 88, 242, 1)",
          },
          {
            label: "Population Average",
            data: [10, 10, 10, 10],
            backgroundColor: "rgba(156, 163, 175, 0.2)",
            borderColor: "rgba(156, 163, 175, 1)",
            borderWidth: 2,
            pointBackgroundColor: "rgba(156, 163, 175, 1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(156, 163, 175, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        scales: {
          r: {
            beginAtZero: true,
            max: 20,
            ticks: {
              stepSize: 5,
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 40, 12);
                },
              },
            },
            pointLabels: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 30, 14);
                },
              },
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 35, 12);
                },
              },
              padding: function (context) {
                return Math.min(context.chart.width / 50, 10);
              },
            },
          },
          tooltip: {
            titleFont: {
              size: function (context) {
                return Math.min(context.chart.width / 35, 14);
              },
            },
            bodyFont: {
              size: function (context) {
                return Math.min(context.chart.width / 40, 12);
              },
            },
          },
        },
      },
    });
  }

  function initializeGaugeCharts() {
    // Initialize 4 gauge charts for each parameter
    const gaugeConfigs = [
      { id: "gauge1", score: scores.epsilon, label: "Prediction Error" },
      { id: "gauge2", score: scores.precision, label: "Precision" },
      { id: "gauge3", score: scores.threshold, label: "Threshold" },
      { id: "gauge4", score: scores.somatic, label: "Somatic Bias" },
    ];

    gaugeConfigs.forEach((config) => {
      const ctx = document.getElementById(config.id);
      if (!ctx) return;

      chartInstances[config.id] = new Chart(ctx, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [config.score, 20 - config.score],
              backgroundColor: [
                getScoreColor(config.score),
                "rgba(229, 231, 235, 0.3)",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          circumference: 180,
          rotation: 270,
          cutout: "75%",
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
        },
      });

      // Add score text in center
      const canvas = ctx;
      const ctx2d = canvas.getContext("2d");
      ctx2d.font = "bold 24px Inter";
      ctx2d.fillStyle = getScoreColor(config.score);
      ctx2d.textAlign = "center";
      ctx2d.textBaseline = "middle";
      ctx2d.fillText(
        config.score.toString(),
        canvas.width / 2,
        canvas.height / 2,
      );
    });
  }

  function initializeInteractionChart() {
    const ctx = document.getElementById("interactionChart");
    if (!ctx) return;

    // Create a simple network visualization
    const data = {
      labels: ["ε", "π", "θₜ", "β"],
      datasets: [
        {
          label: "Parameter Interactions",
          data: [
            { x: 0, y: scores.epsilon },
            { x: 1, y: scores.precision },
            { x: 2, y: scores.threshold },
            { x: 3, y: scores.somatic },
          ],
          backgroundColor: "rgba(22, 88, 242, 0.6)",
          borderColor: "rgba(22, 88, 242, 1)",
          borderWidth: 2,
        },
      ],
    };

    chartInstances.interactionChart = new Chart(ctx, {
      type: "scatter",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            min: -0.5,
            max: 3.5,
            ticks: {
              callback: function (value, index, values) {
                return ["ε", "π", "θₜ", "β"][value] || "";
              },
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 25, 14);
                },
              },
            },
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 40, 12);
                },
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: {
              size: function (context) {
                return Math.min(context.chart.width / 35, 14);
              },
            },
            bodyFont: {
              size: function (context) {
                return Math.min(context.chart.width / 40, 12);
              },
            },
          },
        },
      },
    });
  }

  function initializeTemporalChart() {
    const ctx = document.getElementById("temporalChart");
    if (!ctx) return;

    chartInstances.temporalChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Current", "1 Week", "1 Month", "3 Months", "6 Months"],
        datasets: [
          {
            label: "Temporal Stability",
            data: [
              scores.temporal || 10,
              (scores.temporal || 10) * 0.9,
              (scores.temporal || 10) * 0.8,
              (scores.temporal || 10) * 0.7,
              (scores.temporal || 10) * 0.6,
            ],
            borderColor: "rgba(22, 88, 242, 1)",
            backgroundColor: "rgba(22, 88, 242, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        scales: {
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 40, 12);
                },
              },
            },
          },
          x: {
            ticks: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 35, 11);
                },
              },
              maxRotation: 45,
              minRotation: 0,
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 35, 12);
                },
              },
              padding: function (context) {
                return Math.min(context.chart.width / 50, 10);
              },
            },
          },
          tooltip: {
            titleFont: {
              size: function (context) {
                return Math.min(context.chart.width / 35, 14);
              },
            },
            bodyFont: {
              size: function (context) {
                return Math.min(context.chart.width / 40, 12);
              },
            },
          },
        },
      },
    });
  }

  function initializeEnvironmentChart() {
    const ctx = document.getElementById("environmentChart");
    if (!ctx) return;

    chartInstances.environmentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Work", "Social", "Creative", "Analytical", "Physical"],
        datasets: [
          {
            label: "Environmental Fit",
            data: [
              Math.random() * 20,
              Math.random() * 20,
              Math.random() * 20,
              Math.random() * 20,
              Math.random() * 20,
            ],
            backgroundColor: [
              "rgba(22, 88, 242, 0.6)",
              "rgba(31, 199, 185, 0.6)",
              "rgba(247, 166, 0, 0.6)",
              "rgba(240, 84, 84, 0.6)",
              "rgba(156, 163, 175, 0.6)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        scales: {
          y: {
            beginAtZero: true,
            max: 20,
            ticks: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 40, 12);
                },
              },
            },
          },
          x: {
            ticks: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 35, 11);
                },
              },
              maxRotation: 45,
              minRotation: 0,
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: function (context) {
                  return Math.min(context.chart.width / 35, 12);
                },
              },
              padding: function (context) {
                return Math.min(context.chart.width / 50, 10);
              },
            },
          },
          tooltip: {
            titleFont: {
              size: function (context) {
                return Math.min(context.chart.width / 35, 14);
              },
            },
            bodyFont: {
              size: function (context) {
                return Math.min(context.chart.width / 40, 12);
              },
            },
          },
        },
      },
    });
  }

  function getScoreColor(score) {
    const percentage = (score / 20) * 100;
    if (percentage <= 25) return "rgba(63, 185, 80, 0.8)"; // Green
    if (percentage <= 50) return "rgba(244, 197, 66, 0.8)"; // Yellow
    if (percentage <= 75) return "rgba(247, 166, 0, 0.8)"; // Orange
    return "rgba(240, 84, 84, 0.8)"; // Red
  }

  // Initialize the quiz
  initQuiz();
}

// Export for potential module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { initializeAssessment };
}

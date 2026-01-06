// Assessment Quiz Functionality
// Extracted from Assessment.html for better performance and maintainability

// Import quiz data
// Note: In production, this would be handled by module bundling
let quizData;

// Load quiz data if not already loaded
if (typeof quizData === 'undefined') {
  // Fallback if assessment-quiz.js hasn't loaded yet
  fetch('/assets/js/assessment-quiz.js')
    .then(response => response.text())
    .then(scriptText => {
      eval(scriptText);
      initializeAssessment();
    })
    .catch(error => logger.error('Failed to load quiz data:', error));
} else {
  initializeAssessment();
}

function initializeAssessment() {
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
    environment: 0
  };
  let chartInstances = {};
  let interactionEffects = [];

  // ========== DOM ELEMENTS ==========
  const introductionSection = document.getElementById('introduction-section');
  const quizSection = document.getElementById('quiz-section');
  const resultsContainer = document.getElementById('results-container');
  const startQuizBtn = document.getElementById('start-quiz-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const questionContainer = document.getElementById('question-container');
  const sectionTitle = document.getElementById('section-title');
  const sectionSubtitle = document.getElementById('section-subtitle');
  const sectionIcon = document.getElementById('section-icon');
  const currentQuestionEl = document.getElementById('current-question');
  const currentSectionEl = document.getElementById('current-section');
  const totalSectionsEl = document.getElementById('total-sections');
  const totalQuestionsEl = document.getElementById('total-questions');
  const progressFill = document.getElementById('progress-fill');
  const retakeBtn = document.getElementById('retake-btn');
  const downloadBtn = document.getElementById('download-btn');
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // ========== INITIALIZATION ==========
  function initQuiz() {
    // Calculate total questions
    let totalQuestions = 0;
    quizData.sections.forEach(section => {
      totalQuestions += section.questions.length;
    });
    totalQuestionsEl.textContent = totalQuestions;
    totalSectionsEl.textContent = quizData.sections.length;

    // Set up event listeners
    startQuizBtn.addEventListener('click', startQuiz);
    prevBtn.addEventListener('click', showPreviousQuestion);
    nextBtn.addEventListener('click', showNextQuestion);
    retakeBtn.addEventListener('click', retakeQuiz);
    downloadBtn.addEventListener('click', downloadReport);

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        switchTab(tabId);
      });
    });

    // Initialize answers object
    quizData.sections.forEach(section => {
      section.questions.forEach(question => {
        answers[question.id] = null;
      });
    });
  }

  // ========== UTILITY FUNCTIONS ==========
  function getTotalQuestions() {
    let total = 0;
    quizData.sections.forEach(section => {
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
    if (percentage <= 25) return 'Very Low';
    if (percentage <= 50) return 'Low';
    if (percentage <= 75) return 'Moderate';
    return 'High';
  }

  function getTemporalStability(score) {
    const percentage = (score / 20) * 100;
    if (percentage <= 33) return 'Transient (minutes-hours)';
    if (percentage <= 66) return 'Enduring (days-weeks)';
    return 'Entrenched (weeks-months)';
  }

  function switchTab(tabId) {
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
  }

  // ========== QUIZ LOGIC ==========
  function startQuiz() {
    introductionSection.style.opacity = '0';
    introductionSection.style.transform = 'translateY(20px)';

    setTimeout(() => {
      introductionSection.style.display = 'none';
      quizSection.style.display = 'block';
      quizSection.style.opacity = '0';
      quizSection.style.transform = 'translateY(20px)';

      setTimeout(() => {
        showQuestion();
        quizSection.style.opacity = '1';
        quizSection.style.transform = 'translateY(0)';
      }, 50);
    }, 300);
  }

  function showQuestion() {
    const section = quizData.sections[currentSection];
    const question = section.questions[currentQuestion];

    questionContainer.style.opacity = '0';
    questionContainer.style.transform = 'translateY(20px)';

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
        nextBtn.innerHTML = 'View Complete Results <i class="fas fa-chart-bar"></i>';
      } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
      }

      // Clear and create question
      questionContainer.innerHTML = '';

      const questionEl = document.createElement('div');
      questionEl.className = 'question';

      const questionText = document.createElement('div');
      questionText.className = 'question-text';
      questionText.textContent = `${question.id}. ${question.text}`;
      questionEl.appendChild(questionText);

      const optionsEl = document.createElement('div');
      optionsEl.className = 'options';

      const optionLetters = ['A', 'B', 'C', 'D'];
      question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = `option ${answers[question.id] === option.value ? 'selected' : ''}`;
        optionEl.dataset.value = option.value;

        optionEl.addEventListener('click', () => selectOption(question.id, option.value));

        const optionLetter = document.createElement('div');
        optionLetter.className = 'option-letter';
        optionLetter.textContent = optionLetters[index];

        const optionContent = document.createElement('div');
        optionContent.className = 'option-content';

        const optionText = document.createElement('div');
        optionText.className = 'option-text';
        optionText.textContent = option.text;

        const optionNote = document.createElement('div');
        optionNote.className = 'option-note';
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
        questionContainer.style.opacity = '1';
        questionContainer.style.transform = 'translateY(0)';
      }, 50);
    }, 300);
  }

  function selectOption(questionId, value) {
    answers[questionId] = parseInt(value);

    document.querySelectorAll('.option').forEach(option => {
      option.classList.remove('selected');
      if (parseInt(option.dataset.value) === parseInt(value)) {
        option.classList.add('selected');
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
    const currentQuestionId = quizData.sections[currentSection].questions[currentQuestion].id;
    if (answers[currentQuestionId] === null) {
      alert('Please select an answer before proceeding.');
      return;
    }

    const section = quizData.sections[currentSection];
    if (currentQuestion < section.questions.length - 1) {
      currentQuestion++;
    } else if (currentSection < quizData.sections.length - 1) {
      currentSection++;
      currentQuestion = 0;
    } else {
      calculateResults();
      showResults();
      return;
    }

    showQuestion();
  }

  // ========== RESULTS CALCULATION ==========
  function calculateResults() {
    // Reset scores
    scores = {
      epsilon: 0,
      precision: 0,
      threshold: 0,
      somatic: 0,
      interactions: 0,
      temporal: 0,
      environment: 0
    };

    // Calculate section scores
    quizData.sections.forEach(section => {
      section.questions.forEach(question => {
        const answer = answers[question.id];
        if (answer !== null) {
          if (section.id === 'epsilon') scores.epsilon += answer;
          else if (section.id === 'precision') scores.precision += answer;
          else if (section.id === 'threshold') scores.threshold += answer;
          else if (section.id === 'somatic') scores.somatic += answer;
          else if (section.id === 'interactions') scores.interactions += answer;
          else if (section.id === 'temporal') scores.temporal += answer;
          else if (section.id === 'environment') scores.environment += answer;
        }
      });
    });

    // Calculate interaction effects
    calculateInteractions();
  }

  function calculateInteractions() {
    interactionEffects = [];

    // ε × β interaction: Prediction errors triggering somatic responses
    const epsilonBetaInteraction = (scores.epsilon / 20) * (scores.somatic / 20);
    if (epsilonBetaInteraction > 0.6) {
      interactionEffects.push({
        name: 'Somatic Amplification of Surprises',
        strength: 'High',
        description: 'Prediction errors strongly trigger bodily reactions',
        effect: 'Surprises feel physically intense, can create anxiety loops'
      });
    }

    // Add default balanced interaction if few effects
    if (interactionEffects.length < 2) {
      interactionEffects.push({
        name: 'Moderately Coupled Parameters',
        strength: 'Moderate',
        description: 'Parameters work somewhat independently',
        effect: 'Less extreme interaction effects, more modular processing'
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
          Math.pow(scores.somatic - somaticMid, 2)
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
    quizSection.style.opacity = '0';
    quizSection.style.transform = 'translateY(20px)';

    setTimeout(() => {
      quizSection.style.display = 'none';
      resultsContainer.style.display = 'block';
      resultsContainer.style.opacity = '0';
      resultsContainer.style.transform = 'translateY(20px)';

      // Determine profile
      const profile = determineProfile(scores);

      // Update profile info
      document.getElementById('profile-name').textContent = profile.name;
      document.getElementById('mechanism-text').textContent = profile.mechanism;

      // Update parameter scores
      document.getElementById('epsilon-score').textContent = scores.epsilon;
      document.getElementById('precision-score').textContent = scores.precision;
      document.getElementById('threshold-score').textContent = scores.threshold;
      document.getElementById('somatic-score').textContent = scores.somatic;

      // Update parameter levels
      document.getElementById('epsilon-level').textContent = getParameterLevel(scores.epsilon, 20);
      document.getElementById('epsilon-level').className =
        `parameter-level level-badge level-${getParameterLevel(scores.epsilon, 20).toLowerCase()}`;
      document.getElementById('precision-level').textContent = getParameterLevel(
        scores.precision,
        20
      );
      document.getElementById('precision-level').className =
        `parameter-level level-badge level-${getParameterLevel(scores.precision, 20).toLowerCase()}`;
      document.getElementById('threshold-level').textContent = getParameterLevel(
        scores.threshold,
        20
      );
      document.getElementById('threshold-level').className =
        `parameter-level level-badge level-${getParameterLevel(scores.threshold, 20).toLowerCase()}`;
      document.getElementById('somatic-level').textContent = getParameterLevel(scores.somatic, 20);
      document.getElementById('somatic-level').className =
        `parameter-level level-badge level-${getParameterLevel(scores.somatic, 20).toLowerCase()}`;

      // Update temporal stability
      const temporalScore = scores.temporal;
      const temporalPercent = (temporalScore / 20) * 100;
      document.getElementById('temporal-marker').style.left = `${temporalPercent}%`;
      document.getElementById('temporal-text').textContent = getTemporalStability(temporalScore);
      document.getElementById('recovery-time').textContent = `Recovery: ${profile.recoveryTime}`;

      // Update interaction grid
      const interactionGrid = document.getElementById('interaction-grid');
      interactionGrid.innerHTML = '';
      interactionEffects.forEach(interaction => {
        const item = document.createElement('div');
        item.className = 'interaction-item';
        item.innerHTML = `
                    <div class="interaction-title">${interaction.name}</div>
                    <div><strong>Strength:</strong> ${interaction.strength}</div>
                    <div>${interaction.description}</div>
                    <div><em>Effect:</em> ${interaction.effect}</div>
                `;
        interactionGrid.appendChild(item);
      });

      // Update environmental contexts
      const optimalContexts = document.getElementById('optimal-contexts');
      optimalContexts.innerHTML = '';
      profile.optimalContexts.forEach(context => {
        const factor = document.createElement('div');
        factor.className = 'context-factor';
        factor.textContent = context;
        optimalContexts.appendChild(factor);
      });

      const challengingContexts = document.getElementById('challenging-contexts');
      challengingContexts.innerHTML = '';
      profile.challengingContexts.forEach(context => {
        const factor = document.createElement('div');
        factor.className = 'context-factor';
        factor.textContent = context;
        challengingContexts.appendChild(factor);
      });

      // Update strengths and vulnerabilities
      const strengthsList = document.getElementById('strengths-list');
      strengthsList.innerHTML = '';
      profile.strengths.forEach(strength => {
        const li = document.createElement('li');
        li.textContent = strength;
        strengthsList.appendChild(li);
      });

      const vulnerabilitiesList = document.getElementById('vulnerabilities-list');
      vulnerabilitiesList.innerHTML = '';
      profile.vulnerabilities.forEach(vulnerability => {
        const li = document.createElement('li');
        li.textContent = vulnerability;
        vulnerabilitiesList.appendChild(li);
      });

      // Update strategies
      document.getElementById('strategies-text').innerHTML = `
                <p>${profile.strategies}</p>
                ${profile.interactions ? `<p><strong>Key Interactions:</strong> ${profile.interactions.join('; ')}</p>` : ''}
            `;

      setTimeout(() => {
        resultsContainer.style.opacity = '1';
        resultsContainer.style.transform = 'translateY(0)';
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
      environment: 0
    };
    interactionEffects = [];

    // Reset UI
    resultsContainer.style.display = 'none';
    introductionSection.style.display = 'block';
    introductionSection.style.opacity = '1';
    introductionSection.style.transform = 'translateY(0)';

    // Reset answers
    quizData.sections.forEach(section => {
      section.questions.forEach(question => {
        answers[question.id] = null;
      });
    });
  }

  function downloadReport() {
    // Create report data
    const reportData = {
      date: new Date().toISOString(),
      profile: determineProfile(scores),
      scores: scores,
      answers: answers,
      interactionEffects: interactionEffects
    };

    // Create and download file
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `apgi-assessment-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
  } else {
    initQuiz();
  }
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeAssessment };
}

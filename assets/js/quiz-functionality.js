/**
 * APGI Quiz Functionality
 * Handles quiz logic, scoring, and results display
 */

class APGIQuiz {
  constructor() {
    this.currentSection = 0;
    this.currentQuestion = 0;
    this.answers = {};
    this.quizData = this.getQuizData();
    this.init();
  }

  init() {
    this.loadNavigation();
    this.setupThemeToggle();
    this.renderQuiz();
    this.bindEvents();
  }

  // Navigation is now embedded directly in HTML
  loadNavigation() {
    // Navigation is already loaded in the HTML, no need to fetch
  }

  // Theme toggle functionality is now handled by theme-manager.js
    // This prevents conflicts with the centralized ThemeManager
  setupThemeToggle() {
    // No longer needed - handled by ThemeManager
  }

  // Theme button updates are now handled by theme-manager.js

  // Get quiz data - use the data from assessment-quiz.js
  getQuizData() {
    // Return the quizData from assessment-quiz.js if available
    if (typeof quizData !== 'undefined') {
      return quizData;
    }
    
    // Error if quizData is not available
    console.error('quizData not found. Please ensure assessment-quiz.js is loaded before quiz-functionality.js');
    return null;
  }

  // Render quiz
  renderQuiz() {
    const container = document.getElementById('question-container');
    if (!container) return;

    const section = this.quizData.sections[this.currentSection];
    const question = section.questions[this.currentQuestion];

    container.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.getProgress()}%"></div>
                </div>
                
                <div class="question-container">
                    <h3>Question ${this.currentQuestion + 1} of ${section.questions.length}</h3>
                    <p class="question-text">${question.text}</p>
                    
                    <div class="options-container">
                        ${question.options
                          .map(
                            (option, index) => {
                              // Handle object format from assessment-quiz.js
                              const optionText = option.text;
                              const optionValue = option.value;
                              const optionNote = option.note;
                              
                              const savedAnswer = this.answers[question.id];
                              const isChecked = savedAnswer === optionValue ? 'checked' : '';
                              
                              return `
                            <label class="option-label">
                                <input type="radio" name="quiz-question-${this.currentSection}-${this.currentQuestion}" value="${optionValue}" ${isChecked}>
                                <span class="option-text">${optionText}</span>
                                ${optionNote ? `<span class="option-note">${optionNote}</span>` : ''}
                            </label>
                        `;
                            }
                          )
                          .join('')}
                    </div>
                </div>
        `;

    this.bindQuestionEvents();
  }

  // Bind question events
  bindQuestionEvents() {
    const selector = `input[name="quiz-question-${this.currentSection}-${this.currentQuestion}"]`;
    const options = document.querySelectorAll(selector);
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

    // Check if there's already a selected answer for this question
    const section = this.quizData.sections[this.currentSection];
    const question = section.questions[this.currentQuestion];
    const hasSelectedAnswer = this.answers[question.id] !== undefined;
    
    // Enable next button if there's already an answer
    if (nextBtn && hasSelectedAnswer) {
      nextBtn.disabled = false;
    }

    options.forEach(option => {
      option.addEventListener('change', () => {
        if (nextBtn) nextBtn.disabled = false;
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousQuestion());
    }
  }

  // Get progress percentage
  getProgress() {
    const totalQuestions = this.quizData.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );
    const answeredQuestions = Object.keys(this.answers).length;
    return (answeredQuestions / totalQuestions) * 100;
  }

  // Next question
  nextQuestion() {
    const section = this.quizData.sections[this.currentSection];
    const question = section.questions[this.currentQuestion];
    const selector = `input[name="quiz-question-${this.currentSection}-${this.currentQuestion}"]:checked`;
    const selectedOption = document.querySelector(selector);

    if (!selectedOption) {
      this.showValidationError('Please select an answer before continuing.');
      return;
    }

    // Save answer
    this.answers[question.id] = parseInt(selectedOption.value);

    // Move to next question or section
    this.currentQuestion++;
    if (this.currentQuestion >= section.questions.length) {
      this.currentSection++;
      this.currentQuestion = 0;
    }

    if (this.currentSection >= this.quizData.sections.length) {
      this.showResults();
    } else {
      this.renderQuiz();
    }
  }

  // Show validation error
  showValidationError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      background-color: #fee;
      color: #c53030;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #e53e3e;
      margin-bottom: 16px;
      font-size: 14px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Insert error message before the question container
    const questionContainer = document.querySelector('.question-container');
    if (questionContainer) {
      questionContainer.parentNode.insertBefore(errorDiv, questionContainer);
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);

    // Focus on the first option
    const firstOption = document.querySelector(`input[name="quiz-question-${this.currentSection}-${this.currentQuestion}"]`);
    if (firstOption) {
      firstOption.focus();
    }
  }

  // Previous question
  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
    } else if (this.currentSection > 0) {
      this.currentSection--;
      this.currentQuestion = this.quizData.sections[this.currentSection].questions.length - 1;
    }
    this.renderQuiz();
  }

  // Show results
  showResults() {
    // Validate all questions are answered
    const unansweredQuestions = this.validateAllQuestionsAnswered();
    if (unansweredQuestions.length > 0) {
      this.showUnansweredQuestionsError(unansweredQuestions);
      return;
    }

    const scores = this.calculateScores();
    const profile = this.determineProfile(scores);

    // Hide question container and show results
    const questionContainer = document.getElementById('question-container');
    const resultsContainer = document.getElementById('results-container');
    
    if (questionContainer) {
      questionContainer.style.display = 'none';
    }
    
    if (resultsContainer) {
      resultsContainer.style.display = 'block';
      resultsContainer.innerHTML = `
            <div class="results-container">
                <h2>Your APGI Consciousness Signature</h2>
                <div class="profile-result">
                    <h3>${profile.name}</h3>
                    <p>${profile.description}</p>
                    <div class="scores-breakdown">
                        ${Object.entries(scores)
                          .map(
                            ([key, value]) => `
                            <div class="score-item">
                                <span class="score-label">${key}:</span>
                                <span class="score-value">${value}</span>
                            </div>
                        `
                          )
                          .join('')}
                    </div>
                </div>
                
                <div class="actions">
                    <button id="retake-btn">Retake Assessment</button>
                </div>
            </div>
        `;
    }

    this.bindResultsEvents();
  }

  // Validate all questions are answered
  validateAllQuestionsAnswered() {
    const unansweredQuestions = [];
    
    this.quizData.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        if (this.answers[question.id] === undefined) {
          unansweredQuestions.push({
            sectionTitle: section.title,
            questionNumber: questionIndex + 1,
            questionText: question.text.substring(0, 50) + (question.text.length > 50 ? '...' : ''),
            sectionIndex,
            questionIndex
          });
        }
      });
    });
    
    return unansweredQuestions;
  }

  // Show error for unanswered questions
  showUnansweredQuestionsError(unansweredQuestions) {
    // Remove any existing error messages
    const existingError = document.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Create detailed error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    
    const questionList = unansweredQuestions
      .map(q => `<li><strong>${q.sectionTitle}</strong> - Question ${q.questionNumber}: ${q.questionText}</li>`)
      .join('');
    
    errorDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Please answer all questions before viewing your results:</div>
      <ol style="margin: 0; padding-left: 20px;">
        ${questionList}
      </ol>
      <div style="margin-top: 12px; font-size: 13px;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #e53e3e;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">Dismiss</button>
      </div>
    `;
    
    errorDiv.style.cssText = `
      background-color: #fee;
      color: #c53030;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #e53e3e;
      margin-bottom: 16px;
      font-size: 14px;
      animation: slideInRight 0.3s ease-out;
      max-height: 300px;
      overflow-y: auto;
    `;

    // Insert error message at the top of the quiz section
    const quizSection = document.getElementById('quiz-section');
    if (quizSection) {
      quizSection.insertBefore(errorDiv, quizSection.firstChild);
    }

    // Navigate to first unanswered question
    const firstUnanswered = unansweredQuestions[0];
    if (firstUnanswered) {
      this.currentSection = firstUnanswered.sectionIndex;
      this.currentQuestion = firstUnanswered.questionIndex;
      this.renderQuiz();
    }
  }

  // Calculate scores
  calculateScores() {
    const scores = {
      prediction: 0,
      precision: 0,
      threshold: 0,
      somatic: 0
    };

    // Calculate average for each section
    this.quizData.sections.forEach(section => {
      const sectionAnswers = section.questions
        .map(q => this.answers[q.id])
        .filter(answer => answer !== undefined);

      if (sectionAnswers.length > 0) {
        const average =
          sectionAnswers.reduce((sum, answer) => sum + answer, 0) / sectionAnswers.length;
        scores[section.id] = Math.round(average);
      }
    });

    return scores;
  }

  // Determine profile based on scores
  determineProfile(scores) {
    // Simplified profile determination
    const { prediction, precision } = scores;

    if (prediction >= 3 && precision >= 3) {
      return {
        name: 'Sensitive Integrator',
        description:
          'High awareness of prediction errors and precise attention to detail. You process both external surprises and internal signals deeply.'
      };
    } else if (prediction <= 2 && precision >= 3) {
      return {
        name: 'Analytical Guard',
        description:
          'Strong mental models with precise vigilance. You excel at systematic analysis and maintaining cognitive control.'
      };
    } else if (prediction >= 3 && precision <= 2) {
      return {
        name: 'Open Explorer',
        description:
          'Thrives on novelty and new experiences. High curiosity with openness to unexpected information.'
      };
    } else {
      return {
        name: 'Adaptive Balancer',
        description:
          'Maintains equilibrium between exploration and stability. Flexible yet grounded in changing environments.'
      };
    }
  }

  // Bind results events
  bindResultsEvents() {
    const retakeBtn = document.getElementById('retake-btn');
    const shareBtn = document.getElementById('share-btn');
    const printBtn = document.getElementById('print-btn');

    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.currentSection = 0;
        this.currentQuestion = 0;
        this.answers = {};
        this.renderQuiz();
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const profile = this.determineProfile(this.calculateScores());
        const text = `My APGI Consciousness Signature: ${profile.name}`;

        if (navigator.share) {
          navigator.share({
            title: 'APGI Assessment Results',
            text: text
          });
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(text).then(() => {
            alert('Results copied to clipboard!');
          });
        }
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // Bind initial events
  bindEvents() {
    // Start quiz button
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startQuiz();
      });
    }

    // Add any additional event listeners
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        // Handle escape key if needed
      }
    });
  }

  // Start quiz
  startQuiz() {
    const introSection = document.getElementById('introduction-section');
    const quizSection = document.getElementById('quiz-section');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (loadingSpinner) {
      loadingSpinner.style.display = 'flex';
    }
    
    // Simulate loading time
    setTimeout(() => {
      if (introSection) {
        introSection.style.display = 'none';
      }
      if (quizSection) {
        quizSection.style.display = 'block';
      }
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
      }
      
      // Update section header
      this.updateSectionHeader();
      
      // Render first question
      this.renderQuiz();
    }, 500);
  }

  // Update section header
  updateSectionHeader() {
    const section = this.quizData.sections[this.currentSection];
    const sectionIcon = document.getElementById('section-icon');
    const sectionTitle = document.getElementById('section-title');
    const sectionSubtitle = document.getElementById('section-subtitle');
    
    if (sectionIcon) {
      sectionIcon.innerHTML = `<i class="${section.icon}"></i>`;
    }
    if (sectionTitle) {
      sectionTitle.textContent = section.title;
    }
    if (sectionSubtitle) {
      sectionSubtitle.textContent = section.subtitle;
    }
  }
}

// Initialize quiz when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new APGIQuiz();
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APGIQuiz;
}

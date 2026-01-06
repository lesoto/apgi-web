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

  // Load navigation component
  loadNavigation() {
    fetch('components/navigation.html')
      .then(response => response.text())
      .then(html => {
        const placeholder = document.getElementById('navigation-placeholder');
        if (placeholder) {
          placeholder.innerHTML = html;
        }
      })
      .catch(error => console.error('Failed to load navigation:', error));
  }

  // Setup theme toggle
  setupThemeToggle() {
    setTimeout(() => {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const themeText = document.getElementById('theme-text');
      const html = document.documentElement;
      const savedTheme = localStorage.getItem('theme') || 'light';

      html.setAttribute('data-theme', savedTheme);
      this.updateThemeButton(savedTheme);

      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          const current = html.getAttribute('data-theme');
          const next = current === 'light' ? 'dark' : 'light';
          html.setAttribute('data-theme', next);
          localStorage.setItem('theme', next);
          this.updateThemeButton(next);
        });
      }
    }, 100);
  }

  // Update theme button
  updateThemeButton(theme) {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');

    if (theme === 'dark') {
      if (themeIcon) themeIcon.textContent = '☀️';
      if (themeText) themeText.textContent = 'Light';
    } else {
      if (themeIcon) themeIcon.textContent = '🌙';
      if (themeText) themeText.textContent = 'Dark';
    }
  }

  // Get quiz data
  getQuizData() {
    return {
      sections: [
        {
          id: 'prediction',
          title: 'Prediction Error Sensitivity (ε)',
          subtitle: 'How intensely you register mismatches between expectation and reality',
          icon: 'fas fa-exclamation-triangle',
          questions: [
            {
              id: 1,
              text: 'When plans change unexpectedly, how do you typically respond?',
              options: [
                "Barely notice—I'm highly flexible and adapt instantly",
                'Slight annoyance, but I adjust within minutes',
                'Moderately disrupted—takes 15-30 minutes to recalibrate',
                'Significantly distressed—may ruminate for hours or days'
              ],
              values: [1, 2, 3, 4]
            },
            {
              id: 2,
              text: 'How much do small inconsistencies (in stories, data, arguments) bother you?',
              options: [
                'Almost never—I focus on big picture',
                'Only obvious contradictions catch my attention',
                'Frequently—I notice most discrepancies and feel compelled to resolve them',
                'Intensely—even minor mismatches feel urgent and demand correction'
              ],
              values: [1, 2, 3, 4]
            }
            // Add more questions as needed
          ]
        },
        {
          id: 'precision',
          title: 'Precision Allocation (π)',
          subtitle: 'How you prioritize different information sources',
          icon: 'fas fa-bullseye',
          questions: [
            {
              id: 1,
              text: 'When making important decisions, what do you trust most?',
              options: [
                'My gut feelings and bodily sensations',
                'Hard data and logical analysis',
                'Expert opinions and research',
                'Personal experience and past results'
              ],
              values: [1, 2, 3, 4]
            }
          ]
        }
        // Add more sections as needed
      ]
    };
  }

  // Render quiz
  renderQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const section = this.quizData.sections[this.currentSection];
    const question = section.questions[this.currentQuestion];

    container.innerHTML = `
            <div class="quiz-section">
                <div class="section-header">
                    <h2><i class="${section.icon}"></i> ${section.title}</h2>
                    <p>${section.subtitle}</p>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.getProgress()}%"></div>
                </div>
                
                <div class="question-container">
                    <h3>Question ${this.currentQuestion + 1} of ${section.questions.length}</h3>
                    <p class="question-text">${question.text}</p>
                    
                    <div class="options-container">
                        ${question.options
                          .map(
                            (option, index) => `
                            <label class="option-label">
                                <input type="radio" name="question-${question.id}" value="${question.values[index]}">
                                <span class="option-text">${option}</span>
                            </label>
                        `
                          )
                          .join('')}
                    </div>
                </div>
                
                <div class="navigation-buttons">
                    <button id="prev-btn" ${this.currentQuestion === 0 ? 'disabled' : ''}>Previous</button>
                    <button id="next-btn" disabled>Next</button>
                </div>
            </div>
        `;

    this.bindQuestionEvents();
  }

  // Bind question events
  bindQuestionEvents() {
    const options = document.querySelectorAll('input[name^="question-"]');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');

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
    const selectedOption = document.querySelector(`input[name="question-${question.id}"]:checked`);

    if (!selectedOption) {
      alert('Please select an answer before continuing.');
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
    const scores = this.calculateScores();
    const profile = this.determineProfile(scores);

    const container = document.getElementById('quiz-container');
    container.innerHTML = `
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
                    <button id="share-btn">Share Results</button>
                    <button id="print-btn">Print Report</button>
                </div>
            </div>
        `;

    this.bindResultsEvents();
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
    // Add any additional event listeners
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        // Handle escape key if needed
      }
    });
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

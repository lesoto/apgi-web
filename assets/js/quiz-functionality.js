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
    
    // Fallback data if assessment-quiz.js isn't loaded
    console.warn('quizData not found, using fallback data');
    return {
      sections: [
        {
          id: 'epsilon',
          title: 'Prediction Error Sensitivity (ε)',
          subtitle: 'How sensitive you are to surprises and mismatches between expectations and reality',
          icon: 'fas fa-bolt',
          description: 'High ε means you notice many mismatches (good for learning, can cause anxiety). Low ε means you filter out surprises (calm but may miss important changes).',
          questions: [
            {
              id: 1,
              text: 'When plans change unexpectedly, how do you react initially?',
              options: [
                'Hardly notice—just adapt smoothly',
                'Notice but adapt quickly',
                'Feel disrupted, need to recalibrate',
                'Strong reaction—feels like system failure'
              ],
              notes: ['Very Low ε', 'Low ε', 'Moderate ε', 'High ε'],
              values: [1, 2, 3, 4]
            },
            {
              id: 2,
              text: 'How often do you notice small inconsistencies in your environment?',
              options: [
                'Rarely—things seem consistent',
                'Sometimes notice obvious ones',
                'Frequently notice subtle mismatches',
                'Constantly—my brain flags inconsistencies'
              ],
              notes: ['Low ε', 'Moderate-Low ε', 'Moderate-High ε', 'Very High ε'],
              values: [1, 2, 3, 4]
            },
            {
              id: 3,
              text: 'When learning something new, how do you handle being wrong?',
              options: [
                'Hardly notice errors—keep going',
                'Notice but don\'t dwell on errors',
                'Errors feel significant—motivate correction',
                'Errors feel painful—strong urge to fix immediately'
              ],
              notes: ['Low ε', 'Moderate ε', 'High ε', 'Very High ε'],
              values: [1, 2, 3, 4]
            },
            {
              id: 4,
              text: "In social situations, how quickly do you notice when someone's words don't match their tone?",
              options: [
                'Often miss these mismatches',
                'Notice only large discrepancies',
                'Quickly detect subtle incongruences',
                'Immediately sense any mismatch'
              ],
              notes: ['Low ε', 'Moderate-Low ε', 'Moderate-High ε', 'Very High ε'],
              values: [1, 2, 3, 4]
            },
            {
              id: 5,
              text: 'How do you experience novelty and new experiences?',
              options: [
                'Mostly comforting routine preferred',
                'Enjoy some novelty in moderation',
                'Seek novelty—it\'s energizing',
                'Need constant novelty—routine feels stifling'
              ],
              notes: ['Low ε', 'Moderate ε', 'High ε', 'Very High ε'],
              values: [1, 2, 3, 4]
            }
          ]
        },
        {
          id: 'precision',
          title: 'Precision Allocation (π)',
          subtitle: 'How much confidence/weight you assign to different signals (body, threat, reward, social)',
          icon: 'fas fa-weight-hanging',
          description: 'High precision on threat = hypervigilance. High precision on interoception = intense bodily awareness. Balanced precision = flexible attention.',
          questions: [
            {
              id: 6,
              text: 'When you feel a physical sensation (like a twinge or ache), how do you interpret it?',
              options: [
                'Probably nothing—ignore it',
                'Note it but wait to see if continues',
                'Pay close attention—could be important',
                'Immediately concerned—might be serious'
              ],
              notes: ['Low body precision', 'Moderate body precision', 'High body precision', 'Very high body precision'],
              values: [1, 2, 3, 4]
            },
            {
              id: 7,
              text: 'In uncertain situations, where does your attention naturally go?',
              options: [
                'To potential opportunities',
                'To gathering more information',
                'To potential problems or threats',
                'To how my body feels about it'
              ],
              notes: ['High reward precision', 'Balanced precision', 'High threat precision', 'High interoceptive precision'],
              values: [1, 2, 3, 4]
            },
            {
              id: 8,
              text: "How much do social feedback and others' opinions influence your decisions?",
              options: [
                'Minimal—I trust my own judgment',
                'Consider but don\'t overvalue',
                'Strongly influence my choices',
                'Often override my own judgment'
              ],
              notes: ['Low social precision', 'Moderate social precision', 'High social precision', 'Very high social precision'],
              values: [1, 2, 3, 4]
            },
            {
              id: 9,
              text: 'When making decisions, how do you weigh logical analysis vs. intuitive feelings?',
              options: [
                'Almost entirely logical analysis',
                'Mostly logic with some intuition',
                'Equal weight to both',
                'Intuition guides, logic confirms'
              ],
              notes: ['High analytical precision', 'Moderate balance', 'Balanced precision', 'High intuitive precision'],
              values: [1, 2, 3, 4]
            },
            {
              id: 10,
              text: 'How quickly do you form strong opinions or judgments?',
              options: [
                'Slowly—prefer to stay uncertain',
                'Moderately—after some consideration',
                'Fairly quickly with moderate confidence',
                'Very quickly with high certainty'
              ],
              notes: ['Low confidence precision', 'Moderate confidence', 'High confidence', 'Very high confidence precision'],
              values: [1, 2, 3, 4]
            }
          ]
        },
        {
          id: 'threshold',
          title: 'Ignition Threshold (θₜ)',
          subtitle: 'How much precision-weighted prediction error is needed to trigger conscious awareness',
          icon: 'fas fa-bullseye',
          description: 'Low threshold = rich awareness but easily overwhelmed. High threshold = focused but may miss subtle signals.',
          questions: [
            {
              id: 11,
              text: 'When working deeply, how easily do background sounds interrupt your focus?',
              options: [
                'Almost never—deeply absorbed',
                'Only loud or salient sounds',
                'Moderate sounds break through',
                'Almost any sound distracts me'
              ],
              notes: ['Very High θₜ', 'High θₜ', 'Moderate θₜ', 'Low θₜ'],
              values: [4, 3, 2, 1],
              reverseScored: true
            },
            {
              id: 12,
              text: 'How many thoughts/feelings/sensations are typically in your conscious awareness at once?',
              options: [
                'Just one or two focused elements',
                'A few related elements',
                'Several different elements',
                'Many elements simultaneously'
              ],
              notes: ['High θₜ', 'Moderate-High θₜ', 'Moderate-Low θₜ', 'Low θₜ'],
              values: [4, 3, 2, 1],
              reverseScored: true
            },
            {
              id: 13,
              text: 'How quickly do you notice subtle changes in your emotional state?',
              options: [
                'Often miss until emotions are strong',
                'Notice moderate emotional shifts',
                'Notice subtle emotional fluctuations',
                'Immediately aware of slightest shifts'
              ],
              notes: ['High θₜ', 'Moderate-High θₜ', 'Moderate-Low θₜ', 'Low θₜ'],
              values: [1, 2, 3, 4]
            },
            {
              id: 14,
              text: 'In a busy environment, how much sensory information reaches conscious awareness?',
              options: [
                'Very little—I focus selectively',
                'Some relevant information',
                'Quite a lot of environment',
                'Almost everything registers'
              ],
              notes: ['High θₜ', 'Moderate-High θₜ', 'Moderate-Low θₜ', 'Low θₜ'],
              values: [4, 3, 2, 1],
              reverseScored: true
            },
            {
              id: 15,
              text: "How easily can you achieve 'flow state' where self-awareness disappears?",
              options: [
                'Very easily and frequently',
                'Fairly easily when conditions right',
                'Occasionally with effort',
                'Rarely—always self-aware'
              ],
              notes: ['High θₜ', 'Moderate-High θₜ', 'Moderate-Low θₜ', 'Low θₜ'],
              values: [4, 3, 2, 1],
              reverseScored: true
            }
          ]
        },
        {
          id: 'somatic',
          title: 'Somatic Bias (β)',
          subtitle: 'Whether your awareness anchors primarily in bodily sensations or external events',
          icon: 'fas fa-heartbeat',
          description: "High β = 'I feel my feelings' in body. Low β = 'I think about my feelings' cognitively.",
          questions: [
            {
              id: 16,
              text: 'When you experience an emotion, where do you primarily feel it?',
              options: [
                'Mostly as thoughts about emotion',
                'Some physical sensation but mostly thoughts',
                'Equal physical sensations and thoughts',
                'Overwhelmingly as physical sensations'
              ],
              notes: ['Very Low β', 'Low β', 'Moderate β', 'High β'],
              values: [1, 2, 3, 4]
            },
            {
              id: 17,
              text: "When making important decisions, what's your primary guide?",
              options: [
                'Logical analysis and pros/cons',
                'Mostly logic with some gut feeling',
                'Equal logic and bodily intuition',
                'Bodily feeling of rightness/wrongness'
              ],
              notes: ['Low β', 'Moderate-Low β', 'Moderate β', 'High β'],
              values: [1, 2, 3, 4]
            },
            {
              id: 18,
              text: 'How aware are you of internal bodily states (heartbeat, breathing, muscle tension) throughout day?',
              options: [
                'Rarely notice unless pointed out',
                'Occasionally notice when resting',
                'Frequently aware throughout day',
                'Constantly aware of multiple signals'
              ],
              notes: ['Low β', 'Moderate-Low β', 'Moderate β', 'High β'],
              values: [1, 2, 3, 4]
            },
            {
              id: 19,
              text: "When stressed, what dominates your experience?",
              options: [
                'Worried thoughts and mental analysis',
                'Mostly thoughts with some body tension',
                'Equal mental and physical symptoms',
                'Overwhelming physical sensations'
              ],
              notes: ['Low β', 'Moderate-Low β', 'Moderate β', 'High β'],
              values: [1, 2, 3, 4]
            },
            {
              id: 20,
              text: "How do you experience abstract concepts like 'freedom' or 'connection'?",
              options: [
                'As purely mental constructs',
                'Mostly mental with slight bodily sense',
                'With clear bodily correlates',
                'As distinct bodily experiences'
              ],
              notes: ['Low β', 'Moderate-Low β', 'Moderate-High β', 'High β'],
              values: [1, 2, 3, 4]
            }
          ]
        }
      ]
    };

    return quizData;
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
                              // Handle both data structures: assessment-quiz.js (objects) and fallback (arrays)
                              const optionText = typeof option === 'object' ? option.text : option;
                              const optionValue = typeof option === 'object' ? option.value : question.values[index];
                              const optionNote = typeof option === 'object' ? option.note : question.notes[index];
                              
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

/**
 * APGI Framework Quiz Module
 * Handles quiz rendering, scoring, and results display
 * @version 1.0.0
 */

(function () {
  "use strict";

  // Quiz data
  const questions = [
    {
      text: "When you're in a busy environment (café, party, office), how aware are you of individual conversations around you?",
      options: [
        "I barely notice them unless someone says my name",
        "I catch fragments but can tune them out if focused",
        "I'm constantly distracted by overlapping conversations",
        "I can hear everything clearly and switch attention easily",
      ],
    },
    {
      text: "How often do you notice subtle changes in your environment (lighting shifts, temperature changes, background sounds)?",
      options: [
        "Rarely, unless they're significant",
        "Occasionally, when I'm not focused on something",
        "Frequently, even when concentrating",
        "Constantly, it's hard to ignore small changes",
      ],
    },
    {
      text: "When reading or watching TV, how easily are you pulled out by external stimuli?",
      options: [
        "I get completely absorbed; barely notice interruptions",
        "Loud or sudden stimuli break my focus",
        "I'm easily distracted by movements or sounds",
        "Almost anything can pull my attention away",
      ],
    },
    {
      text: 'How quickly do you realize when something feels "off" in a situation, even if you can\'t explain why?',
      options: [
        "It takes me a while to realize something's wrong",
        "I usually notice within a few minutes",
        "I pick up on it almost immediately",
        "I sense it before it's consciously obvious",
      ],
    },
    {
      text: "Can you feel your heartbeat without taking your pulse?",
      options: [
        "No, I can't sense it at all",
        "Only when it's racing or after exercise",
        "Yes, when I focus on it",
        "Yes, I'm always aware of it",
      ],
    },
    {
      text: "How accurately can you tell when you're hungry vs. thirsty vs. tired?",
      options: [
        "I often confuse them or ignore signals until extreme",
        "I can usually tell, but sometimes mix them up",
        "I can differentiate them clearly most of the time",
        "I know exactly what my body needs at any moment",
      ],
    },
    {
      text: "When you experience an emotion, how aware are you of its physical sensations (chest tightness, stomach flutter, muscle tension)?",
      options: [
        "I rarely notice physical sensations with emotions",
        "I notice strong emotions physically (anger, fear)",
        "I can identify physical components of most emotions",
        "Every emotion has a distinct physical signature I recognize",
      ],
    },
    {
      text: "How often do you realize you're stressed only after someone points it out or you notice physical symptoms?",
      options: [
        "Very often—I'm the last to know",
        "Sometimes—I miss early signs",
        "Rarely—I usually catch it early",
        "Never—I'm always aware of my stress levels",
      ],
    },
    {
      text: "When making a decision, what influences you most?",
      options: [
        "Logical analysis and reasoning",
        "A mix of logic and intuition",
        '"Gut feelings" and bodily sensations',
        "Almost entirely physical reactions—if it doesn't feel right, I can't do it",
      ],
    },
    {
      text: "How much do physical discomforts (tight shoes, uncomfortable chair, room temperature) affect your mood and concentration?",
      options: [
        "I barely notice them unless extreme",
        "They're mildly annoying but I can work through them",
        "They significantly affect my focus and mood",
        "I can't function properly until they're resolved",
      ],
    },
    {
      text: "When anxious, how much do you focus on physical sensations (rapid heart, shallow breathing, tension)?",
      options: [
        "I experience anxiety mostly as worried thoughts",
        "I notice physical symptoms but they're secondary to thoughts",
        "Physical sensations are equally prominent as thoughts",
        "Anxiety is overwhelmingly a physical experience for me",
      ],
    },
    {
      text: 'How much do you "feel" abstract concepts in your body? (e.g., feeling "lightness" when happy, "heaviness" when sad)',
      options: [
        "Rarely or never—concepts are mental, not physical",
        "Occasionally for strong emotions",
        "Often—many concepts have physical correlates",
        "Always—every thought has a bodily signature",
      ],
    },
  ];

  // Archetype data
  const archetypes = {
    ANALYST: {
      name: "The Analyst",
      description:
        "You process the world through logic and focused attention. Your consciousness has a narrow aperture—you're excellent at deep work because external noise doesn't easily penetrate awareness. You're reasonably in tune with your body but don't let physical sensations dominate decision-making. This signature is common among researchers, programmers, and strategic thinkers.",
      strengths: [
        "Deep focus and sustained concentration",
        "Analytical decision-making",
        "Emotional regulation through reasoning",
        "Thrives in low-distraction environments",
      ],
      challenges: [
        "May miss subtle social cues",
        "Can override important bodily signals (fatigue, hunger)",
        "Risk of burnout from ignoring stress signals",
        'May appear detached or "in your head"',
      ],
      tips: [
        "Schedule regular body-scan breaks to compensate for low somatic awareness",
        "Use external reminders for self-care (hydration, movement)",
        "Practice mindfulness to increase sensory threshold temporarily when needed",
        "Leverage your strength: Excel in work requiring sustained analysis",
      ],
    },
    EMPATH: {
      name: "The Empath",
      description:
        "Your consciousness is wide open—absorbing every sensory detail, acutely aware of bodily states, and deeply connected to physical intuition. You're highly empathetic, sensing others' emotions through your own somatic responses. This signature is common among therapists, artists, and healers.",
      strengths: [
        "Rich sensory and emotional experiences",
        'Strong intuition and "gut feelings"',
        "Excellent at reading people and environments",
        "Creative and holistic thinking",
      ],
      challenges: [
        "Easily overwhelmed in stimulating environments",
        "Difficulty filtering irrelevant information",
        "Physical discomfort strongly affects mood",
        "Risk of taking on others' emotions",
      ],
      tips: [
        "Create low-stimulation environments for work/rest",
        'Practice "sensory gating" techniques to lower threshold when needed',
        "Use somatic awareness for early stress detection (your strength!)",
        "Schedule regular sensory resets (quiet, nature, solitude)",
      ],
    },
    PRAGMATIST: {
      name: "The Pragmatist",
      description:
        "You have a balanced consciousness signature—neither overwhelmed by stimuli nor oblivious to your environment. You're reasonably in tune with your body and use both logic and intuition flexibly. This adaptable signature works well across diverse contexts.",
      strengths: [
        "Flexible attention—can focus or scan as needed",
        "Balanced decision-making (head + heart)",
        "Adapts well to various environments",
        "Stable emotional baseline",
      ],
      challenges: [
        "May lack the intensity of specialists in any dimension",
        "Can be pulled in multiple directions",
        'Risk of being "good at everything, great at nothing"',
        "May struggle to develop unique processing style",
      ],
      tips: [
        "Experiment with temporarily increasing/decreasing each dimension",
        "Notice which contexts benefit from which settings",
        "Develop meta-awareness: Know when to shift modes",
        "Your superpower is adaptability—use it strategically",
      ],
    },
    SENSOR: {
      name: "The Sensor",
      description:
        "You're acutely aware of the external world but less connected to internal signals. Your consciousness is externally focused—noticing everything around you while being somewhat disconnected from bodily needs. This signature is common among journalists, detectives, and environmental scanners.",
      strengths: [
        "Exceptional situational awareness",
        "Quick to spot patterns and anomalies",
        "Excellent multitasking ability",
        "Thrives in dynamic, stimulating environments",
      ],
      challenges: [
        "May ignore hunger, fatigue, or stress until extreme",
        'Difficulty "turning off" awareness to rest',
        "Risk of neglecting self-care",
        "Can be scattered or overstimulated",
      ],
      tips: [
        "Set external reminders for bodily needs",
        "Practice interoceptive exercises (heartbeat detection, body scans)",
        'Create evening routines to "close the aperture" for sleep',
        "Use your external awareness strength in appropriate contexts",
      ],
    },
    INTUITIVE: {
      name: "The Intuitive",
      description:
        "You have a narrow but deep consciousness—highly focused internally. You're deeply connected to bodily wisdom and physical intuition, but less distracted by external noise. This signature is common among yogis, body workers, and contemplatives.",
      strengths: [
        "Strong mind-body connection",
        "Excellent self-regulation",
        "Deep introspection and self-knowledge",
        "Embodied decision-making",
      ],
      challenges: [
        "May miss important external information",
        'Risk of being too "in your body" to analyze abstractly',
        "Can appear withdrawn or self-absorbed",
        "May struggle in chaotic environments",
      ],
      tips: [
        "Practice expanding sensory threshold in safe contexts",
        "Balance internal focus with external awareness exercises",
        "Your strength is somatic intelligence—trust it",
        "Schedule focused internal time daily (meditation, yoga)",
      ],
    },
  };

  // DOM elements
  const questionsContainer = document.getElementById("questions-container");
  const quizForm = document.getElementById("quiz-form");
  const resultDiv = document.getElementById("result");
  const progressFill = document.getElementById("progress-fill");
  const emailForm = document.getElementById("email-form");

  // Render questions
  questions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `
      <h4>Question ${index + 1}: ${q.text}</h4>
      <div class="options">
        ${q.options
          .map(
            (opt, i) => `
          <label>
            <input type="radio" name="q${index}" value="${i + 1}" required aria-label="${opt}">
            ${opt}
          </label>
        `,
          )
          .join("")}
      </div>
    `;
    questionsContainer.appendChild(questionDiv);
  });

  // Update progress bar with enhanced animation
  function updateProgress() {
    const total = questions.length;
    const answered = Array.from(
      questionsContainer.querySelectorAll('input[type="radio"]:checked'),
    ).length;
    const percentage = (answered / total) * 100;

    progressFill.style.width = `${percentage}%`;

    // Add visual feedback for answered questions
    document.querySelectorAll(".question").forEach((question) => {
      const isAnswered = question.querySelector('input[type="radio"]:checked');
      if (isAnswered) {
        question.classList.add("answered");
      } else {
        question.classList.remove("answered");
      }
    });

    // Enable/disable submit button based on completion
    const submitBtn = document.getElementById("submit-quiz");
    if (answered === total) {
      submitBtn.style.background = "var(--success)";
      submitBtn.textContent = "View My Results";
      submitBtn.classList.add("pulse-animation");
    } else {
      submitBtn.style.background = "";
      submitBtn.textContent = `Answer ${total - answered} more question${total - answered === 1 ? "" : "s"}`;
      submitBtn.classList.remove("pulse-animation");
    }
  }

  questionsContainer.addEventListener("change", updateProgress);

  // Handle quiz submission with enhanced animations
  quizForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Check if all questions are answered
    const total = questions.length;
    const answered = Array.from(
      questionsContainer.querySelectorAll('input[type="radio"]:checked'),
    ).length;

    if (answered < total) {
      // Shake animation for incomplete quiz
      quizForm.style.animation = "shake 0.5s";
      setTimeout(() => {
        quizForm.style.animation = "";
      }, 500);

      // Highlight unanswered questions
      document.querySelectorAll(".question").forEach((question) => {
        const isAnswered = question.querySelector(
          'input[type="radio"]:checked',
        );
        if (!isAnswered) {
          question.style.animation = "pulse 1s 2";
          setTimeout(() => {
            question.style.animation = "";
          }, 2000);
        }
      });

      return;
    }

    // Show loading state
    const submitBtn = document.getElementById("submit-quiz");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Calculating your signature...";
    submitBtn.disabled = true;

    // Simulate processing time for better UX
    setTimeout(() => {
      const data = new FormData(quizForm);
      const answers = [];
      for (let i = 0; i < questions.length; i++) {
        answers.push(parseInt(data.get(`q${i}`)));
      }

      // Calculate scores
      const threshold = answers.slice(0, 4).reduce((a, b) => a + b, 0);
      const interoception = answers.slice(4, 8).reduce((a, b) => a + b, 0);
      const somatic = answers.slice(8, 12).reduce((a, b) => a + b, 0);

      // Determine archetype
      let archetypeKey = "PRAGMATIST";
      if (threshold <= 8 && interoception >= 12 && somatic >= 12)
        archetypeKey = "INTUITIVE";
      else if (threshold >= 12 && interoception <= 8 && somatic <= 8)
        archetypeKey = "SENSOR";
      else if (threshold >= 12 && interoception >= 12 && somatic >= 12)
        archetypeKey = "EMPATH";
      else if (threshold <= 8 && interoception >= 8 && somatic <= 8)
        archetypeKey = "ANALYST";

      const archetype = archetypes[archetypeKey];

      // Display results with enhanced styling
      document.getElementById("result-scores").innerHTML = `
        <div class="score-grid">
          <div class="score-item">
            <span class="score-label">Threshold Sensitivity</span>
            <span class="score-value">${threshold}/16</span>
            <span class="score-level ${getScoreLevel(threshold)}">${getScoreText(threshold)}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Interoceptive Accuracy</span>
            <span class="score-value">${interoception}/16</span>
            <span class="score-level ${getScoreLevel(interoception)}">${getScoreText(interoception)}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Somatic Bias</span>
            <span class="score-value">${somatic}/16</span>
            <span class="score-level ${getScoreLevel(somatic)}">${getScoreText(somatic)}</span>
          </div>
        </div>
      `;

      // Update visualization
      updateRadarChart(threshold, interoception, somatic);

      // Announce results to screen readers
      const liveRegion = document.getElementById("accessibility-live-region");
      if (liveRegion) {
        liveRegion.textContent = `Quiz complete! Your archetype is ${archetype.name}. Threshold: ${getScoreText(threshold)}, Interoception: ${getScoreText(interoception)}, Somatic: ${getScoreText(somatic)}`;
      }

      document.getElementById("result-archetype").innerHTML = `
        <div class="archetype-header">
          <h3>Your Primary Archetype: ${archetype.name}</h3>
        </div>
        <div class="archetype-description">
          <p>${archetype.description}</p>
        </div>
        <div class="archetype-details">
          <div class="strengths-section">
            <h4>Strengths</h4>
            <ul>${archetype.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
          </div>
          <div class="challenges-section">
            <h4>Growth Areas</h4>
            <ul>${archetype.challenges.map((c) => `<li>${c}</li>`).join("")}</ul>
          </div>
        </div>
      `;

      document.getElementById("result-tips").innerHTML = `
        <div class="tips-section">
          <h4>APGI Optimization Tips</h4>
          <ul>${archetype.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
        </div>
      `;

      quizForm.style.display = "none";
      resultDiv.style.display = "block";
      resultDiv.setAttribute("role", "region");
      resultDiv.setAttribute("aria-live", "polite");
      resultDiv.setAttribute("aria-label", "Quiz results");
      resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });

      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 1500);
  });

  // Helper functions for score display
  function getScoreLevel(score) {
    if (score <= 7) return "low";
    if (score <= 11) return "moderate";
    if (score <= 14) return "high";
    return "very-high";
  }

  function getScoreText(score) {
    if (score <= 7) return "LOW";
    if (score <= 11) return "MODERATE";
    if (score <= 14) return "HIGH";
    return "VERY HIGH";
  }

  // Update radar chart
  function updateRadarChart(threshold, interoception, somatic) {
    // Convert scores to percentages (0-100)
    const thresholdPercent = (threshold / 16) * 100;
    const interoceptionPercent = (interoception / 16) * 100;
    const somaticPercent = (somatic / 16) * 100;

    // Calculate positions (120 degrees apart)
    // Threshold at top (90 degrees = π/2 radians)
    const thresholdX =
      150 + (thresholdPercent / 100) * 120 * Math.cos(Math.PI / 2);
    const thresholdY =
      150 - (thresholdPercent / 100) * 120 * Math.sin(Math.PI / 2);

    // Interoception at bottom right (210 degrees = 7π/6 radians)
    const interoceptionX =
      150 + (interoceptionPercent / 100) * 120 * Math.cos((7 * Math.PI) / 6);
    const interoceptionY =
      150 - (interoceptionPercent / 100) * 120 * Math.sin((7 * Math.PI) / 6);

    // Somatic at bottom left (330 degrees = 11π/6 radians)
    const somaticX =
      150 + (somaticPercent / 100) * 120 * Math.cos((11 * Math.PI) / 6);
    const somaticY =
      150 - (somaticPercent / 100) * 120 * Math.sin((11 * Math.PI) / 6);

    // Update polygon with error handling
    const polygon = document.getElementById("data-polygon");
    if (polygon) {
      polygon.setAttribute(
        "points",
        `${thresholdX},${thresholdY} ${interoceptionX},${interoceptionY} ${somaticX},${somaticY}`,
      );
    }

    // Update points with error handling
    const updatePoint = (id, x, y) => {
      const point = document.getElementById(id);
      if (point) {
        point.setAttribute("cx", x);
        point.setAttribute("cy", y);
      }
    };

    updatePoint("point-threshold", thresholdX, thresholdY);
    updatePoint("point-interoception", interoceptionX, interoceptionY);
    updatePoint("point-somatic", somaticX, somaticY);

    // Update labels with error handling
    const updateLabel = (id, value) => {
      const label = document.getElementById(id);
      if (label) {
        label.textContent = `${value.toFixed(0)}%`;
      }
    };

    updateLabel("threshold-value", thresholdPercent);
    updateLabel("interoception-value", interoceptionPercent);
    updateLabel("somatic-value", somaticPercent);
  }

  // Handle email form submission
  if (emailForm) {
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(emailForm);
      const email = formData.get("email");
      const name = formData.get("fname") || "Friend";

      // Store submission data (in a real app, this would go to a backend)
      const submission = {
        name: name,
        email: email,
        timestamp: new Date().toISOString(),
        quizResults: {
          threshold:
            document.querySelector("#threshold-value")?.textContent || "-",
          interoception:
            document.querySelector("#interoception-value")?.textContent || "-",
          somatic: document.querySelector("#somatic-value")?.textContent || "-",
        },
      };

      // Save to localStorage for demo purposes
      let submissions = JSON.parse(
        localStorage.getItem("apgi_submissions") || "[]",
      );
      submissions.push(submission);
      localStorage.setItem("apgi_submissions", JSON.stringify(submissions));

      // Show success message
      const originalButton = emailForm.querySelector('button[type="submit"]');
      const originalText = originalButton.textContent;
      originalButton.textContent = "Sent! Check your email";
      originalButton.style.background = "var(--success)";
      originalButton.disabled = true;

      // Announce success to screen readers
      const liveRegion = document.getElementById("accessibility-live-region");
      if (liveRegion) {
        liveRegion.textContent = `Thank you ${name}! Chapter 11 has been sent to ${email}.`;
      }

      // Reset form
      emailForm.reset();

      // Show confirmation message
      const confirmationDiv = document.createElement("div");
      confirmationDiv.className = "form-confirmation";
      confirmationDiv.innerHTML = `
        <div style="margin-top: 1rem; padding: 1rem; background: var(--success); color: white; border-radius: var(--radius-md); text-align: center;">
          <strong>Thank you, ${name}!</strong><br>
          Chapter 11 has been sent to ${email}.<br>
          <small>(Demo: In production, this would be a real email delivery)</small>
        </div>
      `;
      emailForm.parentNode.appendChild(confirmationDiv);

      // Reset button after 3 seconds
      setTimeout(() => {
        originalButton.textContent = originalText;
        originalButton.style.background = "";
        originalButton.disabled = false;
        confirmationDiv.remove();
      }, 5000);
    });
  }
})();

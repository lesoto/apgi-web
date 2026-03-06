// Assessment Questions Database
// Contains all questions for the APGI Consciousness Signature Assessment

window.APGI_QUESTIONS = [
  {
    id: "prediction_error_1",
    category: "Prediction Error Sensitivity",
    question:
      "When you encounter unexpected changes in your environment, how do you typically respond?",
    options: [
      "I quickly adapt and find new solutions",
      "I feel anxious and need time to process",
      "I analyze the situation systematically",
      "I rely on my intuition to guide me",
    ],
    dimension: "prediction_error",
  },
  {
    id: "precision_1",
    category: "Precision Allocation",
    question: "How do you approach decision-making in uncertain situations?",
    options: [
      "I gather as much information as possible before deciding",
      "I make decisions based on patterns I've observed",
      "I trust my initial instincts",
      "I seek advice from others",
    ],
    dimension: "precision",
  },
  {
    id: "threshold_1",
    category: "Ignition Threshold",
    question: "At what point do you typically take action on a new idea?",
    options: [
      "As soon as I think of it",
      "After careful consideration and planning",
      "When I feel emotionally ready",
      "When external circumstances force me",
    ],
    dimension: "threshold",
  },
  {
    id: "somatic_1",
    category: "Somatic Bias",
    question: "How much do physical sensations influence your decision-making?",
    options: [
      "They play a major role in my choices",
      "They influence me somewhat",
      "They have minimal impact",
      "I try to ignore physical feelings",
    ],
    dimension: "somatic",
  },
  {
    id: "prediction_error_2",
    category: "Prediction Error Sensitivity",
    question: "When your expectations are violated, what happens?",
    options: [
      "I get excited about the new possibilities",
      "I feel disoriented and need to regroup",
      "I immediately start problem-solving",
      "I become more observant of my surroundings",
    ],
    dimension: "prediction_error",
  },
  {
    id: "precision_2",
    category: "Precision Allocation",
    question: "How do you handle conflicting information?",
    options: [
      "I weigh all evidence carefully",
      "I focus on the most reliable sources",
      "I go with what feels right",
      "I avoid making decisions until I have clarity",
    ],
    dimension: "precision",
  },
  {
    id: "threshold_2",
    category: "Ignition Threshold",
    question: "What motivates you to start new projects?",
    options: [
      "The excitement of new beginnings",
      "Clear goals and plans",
      "Emotional connection to the project",
      "External deadlines or requirements",
    ],
    dimension: "threshold",
  },
  {
    id: "somatic_2",
    category: "Somatic Bias",
    question: "How aware are you of your body's signals?",
    options: [
      "Very aware - I notice subtle changes",
      "Moderately aware",
      "Not very aware",
      "I consciously ignore body signals",
    ],
    dimension: "somatic",
  },
  {
    id: "prediction_error_3",
    category: "Prediction Error Sensitivity",
    question: "When routines change unexpectedly, how do you react?",
    options: [
      "I embrace the change enthusiastically",
      "I feel stressed and try to restore order",
      "I adapt pragmatically",
      "I observe how others are coping",
    ],
    dimension: "prediction_error",
  },
  {
    id: "precision_3",
    category: "Precision Allocation",
    question: "How do you evaluate the credibility of information?",
    options: [
      "Through systematic analysis",
      "Based on consistency with my experience",
      "Through emotional resonance",
      "By checking with trusted sources",
    ],
    dimension: "precision",
  },
  {
    id: "threshold_3",
    category: "Ignition Threshold",
    question: "When do you know you're ready to commit to a decision?",
    options: [
      "When the timing feels right",
      "When all criteria are met",
      "When I feel passionate about it",
      "When I have no other options",
    ],
    dimension: "threshold",
  },
  {
    id: "somatic_3",
    category: "Somatic Bias",
    question: "How do physical states affect your mood?",
    options: [
      "My mood is strongly influenced by how I feel physically",
      "There's some connection but not strong",
      "Little to no connection",
      "I maintain emotional stability regardless",
    ],
    dimension: "somatic",
  },
  {
    id: "prediction_error_4",
    category: "Prediction Error Sensitivity",
    question: "How do you respond to surprises?",
    options: [
      "I love surprises and find them energizing",
      "Surprises make me uncomfortable",
      "I handle them matter-of-factly",
      "I try to predict and prevent surprises",
    ],
    dimension: "prediction_error",
  },
  {
    id: "precision_4",
    category: "Precision Allocation",
    question: "How detailed are your mental models of situations?",
    options: [
      "Very detailed and comprehensive",
      "Moderately detailed",
      "I focus on key elements only",
      "I prefer simple, intuitive understanding",
    ],
    dimension: "precision",
  },
  {
    id: "threshold_4",
    category: "Ignition Threshold",
    question: "What triggers you to take action?",
    options: [
      "Spontaneous inspiration",
      "Logical analysis completion",
      "Emotional readiness",
      "External pressure",
    ],
    dimension: "threshold",
  },
  {
    id: "somatic_4",
    category: "Somatic Bias",
    question: "How much do you rely on 'gut feelings'?",
    options: [
      "A great deal - they're usually right",
      "Sometimes, when logic doesn't help",
      "Rarely - I prefer rational thinking",
      "Never - I don't trust intuition",
    ],
    dimension: "somatic",
  },
];

// Question categories for scoring
window.QUESTION_CATEGORIES = {
  prediction_error: "Prediction Error Sensitivity",
  precision: "Precision Allocation",
  threshold: "Ignition Threshold",
  somatic: "Somatic Bias",
};

// Scoring ranges for each dimension
window.SCORING_RANGES = {
  prediction_error: { min: 4, max: 16 },
  precision: { min: 4, max: 16 },
  threshold: { min: 4, max: 16 },
  somatic: { min: 4, max: 16 },
};

console.info(
  "Assessment questions loaded successfully -",
  window.APGI_QUESTIONS.length,
  "questions available",
);

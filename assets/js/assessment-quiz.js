// Assessment Quiz Data and Functionality
// Extracted from Assessment.html for better performance and maintainability

// ========== COMPLETE APGI QUIZ DATA ==========
const quizData = {
  sections: [
    {
      id: 'epsilon',
      title: 'Prediction Error Sensitivity (ε)',
      subtitle:
        'How sensitive you are to surprises and mismatches between expectations and reality',
      icon: 'fas fa-bolt',
      description:
        'High ε means you notice many mismatches (good for learning, can cause anxiety). Low ε means you filter out surprises (calm but may miss important changes).',
      questions: [
        {
          id: 1,
          text: 'When plans change unexpectedly, how do you react initially?',
          options: [
            { text: 'Hardly notice—just adapt smoothly', note: 'Very Low ε', value: 1 },
            { text: 'Notice but adapt quickly', note: 'Low ε', value: 2 },
            { text: 'Feel disrupted, need to recalibrate', note: 'Moderate ε', value: 3 },
            { text: 'Strong reaction—feels like system failure', note: 'High ε', value: 4 }
          ]
        },
        {
          id: 2,
          text: 'How often do you notice small inconsistencies in your environment?',
          options: [
            { text: 'Rarely—things seem consistent', note: 'Low ε', value: 1 },
            { text: 'Sometimes notice obvious ones', note: 'Moderate-Low ε', value: 2 },
            { text: 'Frequently notice subtle mismatches', note: 'Moderate-High ε', value: 3 },
            { text: 'Constantly—my brain flags inconsistencies', note: 'Very High ε', value: 4 }
          ]
        },
        {
          id: 3,
          text: 'When learning something new, how do you handle being wrong?',
          options: [
            { text: 'Hardly notice errors—keep going', note: 'Low ε', value: 1 },
            { text: "Notice but don't dwell on errors", note: 'Moderate ε', value: 2 },
            { text: 'Errors feel significant—motivate correction', note: 'High ε', value: 3 },
            {
              text: 'Errors feel painful—strong urge to fix immediately',
              note: 'Very High ε',
              value: 4
            }
          ]
        },
        {
          id: 4,
          text: "In social situations, how quickly do you notice when someone's words don't match their tone?",
          options: [
            { text: 'Often miss these mismatches', note: 'Low ε', value: 1 },
            { text: 'Notice only large discrepancies', note: 'Moderate-Low ε', value: 2 },
            { text: 'Quickly detect subtle incongruences', note: 'Moderate-High ε', value: 3 },
            { text: 'Immediately sense any mismatch', note: 'Very High ε', value: 4 }
          ]
        },
        {
          id: 5,
          text: 'How do you experience novelty and new experiences?',
          options: [
            { text: 'Mostly comforting routine preferred', note: 'Low ε', value: 1 },
            { text: 'Enjoy some novelty in moderation', note: 'Moderate ε', value: 2 },
            { text: "Seek novelty—it's energizing", note: 'High ε', value: 3 },
            { text: 'Need constant novelty—routine feels stifling', note: 'Very High ε', value: 4 }
          ]
        }
      ]
    },
    {
      id: 'precision',
      title: 'Precision Allocation (π)',
      subtitle:
        'How much confidence/weight you assign to different signals (body, threat, reward, social)',
      icon: 'fas fa-weight-hanging',
      description:
        'High precision on threat = hypervigilance. High precision on interoception = intense bodily awareness. Balanced precision = flexible attention.',
      questions: [
        {
          id: 6,
          text: 'When you feel a physical sensation (like a twinge or ache), how do you interpret it?',
          options: [
            { text: 'Probably nothing—ignore it', note: 'Low body precision', value: 1 },
            {
              text: 'Note it but wait to see if continues',
              note: 'Moderate body precision',
              value: 2
            },
            {
              text: 'Pay close attention—could be important',
              note: 'High body precision',
              value: 3
            },
            {
              text: 'Immediately concerned—might be serious',
              note: 'Very high body precision',
              value: 4
            }
          ]
        },
        {
          id: 7,
          text: 'In uncertain situations, where does your attention naturally go?',
          options: [
            { text: 'To potential opportunities', note: 'High reward precision', value: 1 },
            { text: 'To gathering more information', note: 'Balanced precision', value: 2 },
            { text: 'To potential problems or threats', note: 'High threat precision', value: 3 },
            {
              text: 'To how my body feels about it',
              note: 'High interoceptive precision',
              value: 4
            }
          ]
        },
        {
          id: 8,
          text: "How much do social feedback and others' opinions influence your decisions?",
          options: [
            { text: 'Minimal—I trust my own judgment', note: 'Low social precision', value: 1 },
            { text: "Consider but don't overvalue", note: 'Moderate social precision', value: 2 },
            { text: 'Strongly influence my choices', note: 'High social precision', value: 3 },
            { text: 'Often override my own judgment', note: 'Very high social precision', value: 4 }
          ]
        },
        {
          id: 9,
          text: 'When making decisions, how do you weigh logical analysis vs. intuitive feelings?',
          options: [
            {
              text: 'Almost entirely logical analysis',
              note: 'High analytical precision',
              value: 1
            },
            { text: 'Mostly logic with some intuition', note: 'Moderate balance', value: 2 },
            { text: 'Equal weight to both', note: 'Balanced precision', value: 3 },
            { text: 'Intuition guides, logic confirms', note: 'High intuitive precision', value: 4 }
          ]
        },
        {
          id: 10,
          text: 'How quickly do you form strong opinions or judgments?',
          options: [
            { text: 'Slowly—prefer to stay uncertain', note: 'Low confidence precision', value: 1 },
            { text: 'Moderately—after some consideration', note: 'Moderate confidence', value: 2 },
            { text: 'Fairly quickly with moderate confidence', note: 'High confidence', value: 3 },
            {
              text: 'Very quickly with high certainty',
              note: 'Very high confidence precision',
              value: 4
            }
          ]
        }
      ]
    },
    {
      id: 'threshold',
      title: 'Ignition Threshold (θₜ)',
      subtitle:
        'How much precision-weighted prediction error is needed to trigger conscious awareness',
      icon: 'fas fa-bullseye',
      description:
        'Low threshold = rich awareness but easily overwhelmed. High threshold = focused but may miss subtle signals.',
      questions: [
        {
          id: 11,
          text: 'When working deeply, how easily do background sounds interrupt your focus?',
          options: [
            { text: 'Almost never—deeply absorbed', note: 'Very High θₜ', value: 4 },
            { text: 'Only loud or salient sounds', note: 'High θₜ', value: 3 },
            { text: 'Moderate sounds break through', note: 'Moderate θₜ', value: 2 },
            { text: 'Almost any sound distracts me', note: 'Low θₜ', value: 1 }
          ],
          reverseScored: true
        },
        {
          id: 12,
          text: 'How many thoughts/feelings/sensations are typically in your conscious awareness at once?',
          options: [
            { text: 'Just one or two focused elements', note: 'High θₜ', value: 4 },
            { text: 'A few related elements', note: 'Moderate-High θₜ', value: 3 },
            { text: 'Several different elements', note: 'Moderate-Low θₜ', value: 2 },
            { text: 'Many elements simultaneously', note: 'Low θₜ', value: 1 }
          ],
          reverseScored: true
        },
        {
          id: 13,
          text: 'How quickly do you notice subtle changes in your emotional state?',
          options: [
            { text: 'Often miss until emotions are strong', note: 'High θₜ', value: 1 },
            { text: 'Notice moderate emotional shifts', note: 'Moderate-High θₜ', value: 2 },
            { text: 'Notice subtle emotional fluctuations', note: 'Moderate-Low θₜ', value: 3 },
            { text: 'Immediately aware of slightest shifts', note: 'Low θₜ', value: 4 }
          ]
        },
        {
          id: 14,
          text: 'In a busy environment, how much sensory information reaches conscious awareness?',
          options: [
            { text: 'Very little—I focus selectively', note: 'High θₜ', value: 4 },
            { text: 'Some relevant information', note: 'Moderate-High θₜ', value: 3 },
            { text: 'Quite a lot of environment', note: 'Moderate-Low θₜ', value: 2 },
            { text: 'Almost everything registers', note: 'Low θₜ', value: 1 }
          ],
          reverseScored: true
        },
        {
          id: 15,
          text: "How easily can you achieve 'flow state' where self-awareness disappears?",
          options: [
            { text: 'Very easily and frequently', note: 'High θₜ', value: 4 },
            { text: 'Fairly easily when conditions right', note: 'Moderate-High θₜ', value: 3 },
            { text: 'Occasionally with effort', note: 'Moderate-Low θₜ', value: 2 },
            { text: 'Rarely—always self-aware', note: 'Low θₜ', value: 1 }
          ],
          reverseScored: true
        }
      ]
    },
    {
      id: 'somatic',
      title: 'Somatic Bias (β)',
      subtitle: 'Whether your awareness anchors primarily in bodily sensations or external events',
      icon: 'fas fa-heartbeat',
      description:
        "High β = 'I feel my feelings' in body. Low β = 'I think about my feelings' cognitively.",
      questions: [
        {
          id: 16,
          text: 'When you experience an emotion, where do you primarily feel it?',
          options: [
            { text: 'Mostly as thoughts about emotion', note: 'Very Low β', value: 1 },
            { text: 'Some physical sensation but mostly thoughts', note: 'Low β', value: 2 },
            { text: 'Equal physical sensations and thoughts', note: 'Moderate β', value: 3 },
            { text: 'Overwhelmingly as physical sensations', note: 'High β', value: 4 }
          ]
        },
        {
          id: 17,
          text: "When making important decisions, what's your primary guide?",
          options: [
            { text: 'Logical analysis and pros/cons', note: 'Low β', value: 1 },
            { text: 'Mostly logic with some gut feeling', note: 'Moderate-Low β', value: 2 },
            { text: 'Equal logic and bodily intuition', note: 'Moderate-High β', value: 3 },
            { text: 'Bodily feeling of rightness/wrongness', note: 'High β', value: 4 }
          ]
        },
        {
          id: 18,
          text: 'How aware are you of internal bodily states (heartbeat, breathing, muscle tension) throughout day?',
          options: [
            { text: 'Rarely notice unless pointed out', note: 'Low β', value: 1 },
            { text: 'Occasionally notice when resting', note: 'Moderate-Low β', value: 2 },
            { text: 'Frequently aware throughout day', note: 'Moderate-High β', value: 3 },
            { text: 'Constantly aware of multiple signals', note: 'High β', value: 4 }
          ]
        },
        {
          id: 19,
          text: 'When stressed, what dominates your experience?',
          options: [
            { text: 'Worried thoughts and mental analysis', note: 'Low β', value: 1 },
            { text: 'Mostly thoughts with some body tension', note: 'Moderate-Low β', value: 2 },
            { text: 'Equal mental and physical symptoms', note: 'Moderate β', value: 3 },
            { text: 'Overwhelming physical sensations', note: 'High β', value: 4 }
          ]
        },
        {
          id: 20,
          text: "How do you experience abstract concepts like 'freedom' or 'connection'?",
          options: [
            { text: 'As purely mental constructs', note: 'Low β', value: 1 },
            { text: 'Mostly mental with slight bodily sense', note: 'Moderate-Low β', value: 2 },
            { text: 'With clear bodily correlates', note: 'Moderate-High β', value: 3 },
            { text: 'As distinct bodily experiences', note: 'High β', value: 4 }
          ]
        }
      ]
    }
  ],

  // Complete profile system including parameter interactions
  profiles: {
    // Low ε, High π (threat), High θₜ, Low β
    ANALYTICAL_GUARD: {
      name: 'THE ANALYTICAL GUARD',
      ranges: { epsilon: [5, 9], precision: [13, 16], threshold: [13, 16], somatic: [4, 8] },
      mechanism:
        'Low prediction error sensitivity combined with high threat precision and high ignition threshold creates a vigilant but focused analyzer. You filter out noise but amplify potential threats, creating efficient but sometimes anxious processing.',
      temporalStability: 0.7,
      recoveryTime: 'Days',
      optimalContexts: ['Analytical work', 'Stable environments', 'Clear threat detection'],
      challengingContexts: ['Rapid change', 'Social ambiguity', 'Embodied tasks'],
      strengths: [
        'Excellent threat detection',
        'Sustained analytical focus',
        'Efficient information filtering',
        'Logical decision-making'
      ],
      vulnerabilities: [
        'May miss subtle changes',
        'Anxiety from threat amplification',
        'Disconnected from bodily wisdom',
        'Rigid in changing environments'
      ],
      strategies:
        'Practice interoceptive awareness to balance threat precision. Introduce controlled novelty to increase ε flexibility. Use your analytical strength to metacognitively monitor precision allocation.',
      interactions: [
        'High π(threat) + Low ε: Misses subtle threats but overweights detected ones',
        'High θₜ + Low β: Disembodied analytical processing',
        'Low ε + High π: Creates certainty but may be wrong with high confidence'
      ]
    },

    // High ε, Moderate π, Low θₜ, High β
    SENSITIVE_INTEGRATOR: {
      name: 'THE SENSITIVE INTEGRATOR',
      ranges: { epsilon: [16, 20], precision: [8, 12], threshold: [4, 8], somatic: [13, 16] },
      mechanism:
        'High prediction error sensitivity with low ignition threshold and high somatic bias creates rich, embodied awareness. You notice everything with bodily resonance, creating holistic understanding but risk of overwhelm.',
      temporalStability: 0.4,
      recoveryTime: 'Hours',
      optimalContexts: ['Creative work', 'Social dynamics', 'Embodied learning'],
      challengingContexts: [
        'High-stimulation environments',
        'Analytical tasks',
        'Crisis management'
      ],
      strengths: [
        'Rich awareness of subtleties',
        'Strong intuition and empathy',
        'Holistic pattern recognition',
        'Emotional and social intelligence'
      ],
      vulnerabilities: [
        'Easily overwhelmed',
        'Difficulty focusing',
        'Physical symptoms from stress',
        'Decision paralysis from too much input'
      ],
      strategies:
        'Practice selective attention to increase θₜ when needed. Create low-stimulation sanctuary spaces. Use somatic awareness as information source but learn to decouple from it for analytical tasks.',
      interactions: [
        'High ε + Low θₜ: Rich awareness but easily overwhelmed',
        'High β + Low θₜ: Bodily amplification of all signals',
        'Moderate π + High ε: Flexible weighting of diverse inputs'
      ]
    },

    // Moderate ε, Balanced π, Moderate θₜ, Moderate β
    ADAPTIVE_BALANCER: {
      name: 'THE ADAPTIVE BALANCER',
      ranges: { epsilon: [10, 15], precision: [8, 12], threshold: [8, 12], somatic: [8, 12] },
      mechanism:
        'Balanced parameters across all dimensions creates flexible, context-appropriate processing. You adapt your consciousness architecture to environmental demands, though may lack specialized strengths.',
      temporalStability: 0.5,
      recoveryTime: 'Hours to days',
      optimalContexts: ['Varied environments', 'General problem-solving', 'Team coordination'],
      challengingContexts: ['Specialized domains', 'Extreme conditions', 'Where extremes excel'],
      strengths: [
        'Adaptability across contexts',
        'Balanced decision-making',
        'Good stress resilience',
        'Effective in varied roles'
      ],
      vulnerabilities: [
        'Jack-of-all-trades effect',
        "No standout 'superpower'",
        'May be average in specialized domains',
        'Can be pulled in different directions'
      ],
      strategies:
        'Develop meta-awareness of your parameter shifts. Intentionally cultivate parameter extremes for specific contexts. Leverage adaptability as your core strength in dynamic environments.',
      interactions: [
        'Balanced parameters: Flexible but not optimized',
        'Moderate everything: Good generalist, less specialized',
        'Context-dependent shifts: Adaptive but requires awareness'
      ]
    }
  }
};

// Export for use in Assessment.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { quizData };
}

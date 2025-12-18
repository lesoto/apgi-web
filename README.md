# APGI Framework Website

**Allostatic Precision-Gated Ignition (APGI) Framework** - A comprehensive web platform for understanding and exploring consciousness architecture through an interactive, research-backed framework.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Main Pages](#main-pages)
- [Technical Components](#technical-components)
- [Python Implementations](#python-implementations)
- [Assets](#assets)
- [Getting Started](#getting-started)
- [Technologies Used](#technologies-used)

---

## Overview

The APGI Framework website presents a novel theoretical framework for understanding consciousness as a metabolically expensive, allostatically gated control mechanism activated when precision-weighted prediction errors exceed dynamic thresholds. This interactive platform combines academic rigor with user-friendly interfaces to help people understand their unique consciousness signature.

**Key Features:**
- Interactive consciousness assessment quiz
- Real-time data visualization with radar charts, gauges, and graphs
- Academic paper presentation with modern UI
- Python implementation of APGI networks using Liquid Time-Constant Networks
- Dashboard system for personalized consciousness profiles
- Book promotion and educational content

---

## Project Structure

```
apgi-web/
├── *.html                          # Main HTML pages (root level)
├── images/                         # Visual assets and diagrams
├── liquid-networks/                # Python implementations and visualizations
│   ├── APGI-Implementation.py
│   ├── APGI_Liquid_Network.py
│   └── *.html                      # Network visualizations
├── .gitignore                      # Git ignore configuration
└── README.md                       # This file
```

---

## Main Pages

### Landing & Marketing Pages

#### **Home.html**
The primary landing page for the APGI Framework.

**Purpose:** Convert visitors into engaged users by explaining the framework and offering immediate value through an interactive quiz.

**Key Features:**
- Hero section with animated gradient background
- Embedded consciousness assessment quiz (12 questions)
- Real-time radar chart visualization of results
- Consciousness "archetypes" (The Analyst, The Empath, The Pragmatist, The Sensor, The Intuitive)
- Email capture for detailed results
- Responsive design with dark/light theme support
- Three core dimensions measured:
  - **Threshold Sensitivity** - How easily information breaks into awareness
  - **Interoceptive Accuracy** - How precisely you perceive internal bodily states
  - **Somatic Bias** - How much bodily sensations dominate conscious experience

**Technologies:** Vanilla JavaScript, CSS animations, SVG for visualizations

---

#### **Book-Available-Now.html**
Book promotion landing page.

**Purpose:** Drive book sales and engagement with the APGI framework through a compelling book landing page.

**Key Features:**
- Book cover display with hover effects
- Purchase buttons for different platforms
- Book description and key highlights
- Gradient-based modern design
- Call-to-action buttons

---

#### **Book-Outline.html**
Detailed table of contents and chapter breakdown for the APGI book.

**Purpose:** Preview book content for potential readers.

**Key Features:**
- Comprehensive chapter listing
- Topic breakdown
- Visual hierarchy of content
- Book promotion elements

---

### Academic & Research Pages

#### **APGI-Paper.html**
Academic presentation of the APGI framework principles.

**Purpose:** Present the theoretical framework in a scholarly, visually appealing format suitable for researchers and academics.

**Key Features:**
- Modern academic paper UI with dark/light theme
- Animated neural network background (particle system)
- Sticky navigation with smooth scrolling
- Six core framework components:
  1. **Allostatic Regulation** - Predictive homeostatic balance
  2. **Precision Weighting** - Confidence-based signal gating
  3. **Global Ignition** - Phase transition dynamics for conscious access
  4. **Interoceptive Inference** - Hierarchical prediction of body states
  5. **Thermodynamic Constraints** - Metabolic expenditure limits
- Major theoretical contributions section
- System architecture diagram (SVG-based processing pipeline)
- Clinical translation pathways for psychiatric conditions:
  - Anxiety Disorders (hypersensitive precision)
  - Major Depression (blunted precision)
  - Psychotic Disorders (aberrant precision)
  - Substance Addiction (hijacked allostatic set-points)
- Testable predictions for neuroscience and AI research
- Citation management with BibTeX export
- Download buttons for full paper and supplementary materials
- Accessibility features (skip links, ARIA labels, keyboard navigation)

**Technologies:** TailwindCSS CDN, Lucide icons, Canvas API for animations

---

#### **Dashboard-Acad.html**
Academic dashboard concept documentation.

**Purpose:** Design specification document outlining the mental model dashboard for presenting APGI assessment results.

**Key Features:**
- Six dashboard sections (numbered 0-6):
  - **Section 0:** Dashboard Summary
  - **Section 1:** Core Profile View (Radar Chart with ε, π, θₜ, β parameters)
  - **Section 2:** Numeric Reality Check (Bar charts)
  - **Section 3:** Awareness & Overload Indicator (Ignition Gauge)
  - **Section 4:** Body vs World Focus (Somatic Balance slider)
  - **Section 5:** State Comparison (Line charts across mental states)
  - **Section 6:** Plain-Language Summary Panel
- Design principles and rationale
- Element-by-element specifications
- Plain language interpretation guidelines
- Dark/light theme toggle
- Responsive grid layouts
- Scroll-triggered animations

**Note:** This is a specification document, not a functional dashboard.

---

### Assessment & Quiz Pages

#### **Assessment.html**
Full consciousness assessment with enhanced UI.

**Purpose:** Comprehensive version of the consciousness quiz with additional features.

**Key Features:**
- Multi-page quiz flow
- Progress tracking
- Enhanced result visualization
- Detailed scoring system
- User profile integration

---

#### **Assessment-OnePage.html**
Single-page version of the consciousness assessment.

**Purpose:** Streamlined quiz experience without page navigation.

**Key Features:**
- All questions on one scrollable page
- Instant scoring
- Simplified result display
- Mobile-optimized layout

---

#### **Quiz.html**
Standalone quiz page with full functionality.

**Purpose:** Isolated quiz component for embedding or standalone use.

**Key Features:**
- 12-question assessment
- Real-time validation
- Chart.js and Gauge visualizations
- Score calculation algorithms
- Result archetype matching
- Dark/light theme support
- Font Awesome icons

---

### Dashboard & Profile Pages

#### **Dashboard.html**
Interactive user dashboard for consciousness profiles.

**Purpose:** Present personalized APGI assessment results through an interactive, visually rich dashboard.

**Key Features:**
- Six-section layout matching Dashboard-Acad.html specification
- Radar chart with four parameters (ε, π, θₜ, β)
- Population average overlay for comparison
- Normalized bar charts (0-100 scale)
- Ignition gauge showing mental load vs. awareness threshold
- Somatic balance slider (body-focused ↔ world-focused)
- State comparison across: Resting, Focused, Stressed, Creative
- Auto-generated plain-language interpretations:
  - "You notice small problems quickly."
  - "Your system trusts threat signals more than reward."
  - "Awareness fills easily under stress."
  - "Experience is strongly body-centered right now."
- Animated transitions and scroll effects
- Dark/light theme toggle
- Responsive design

**Technologies:** Vanilla JavaScript, CSS Grid, Intersection Observer API, Font Awesome

---

#### **Profile.html**
User profile management page.

**Purpose:** Allow users to view and manage their consciousness profile data.

**Key Features:**
- Profile information display
- Assessment history
- Result comparisons over time
- Settings and preferences

---

### Visualization Pages

#### **Consciousness-Visualization.html**
Interactive visualization of consciousness processes.

**Purpose:** Provide dynamic, educational visualizations of how the APGI framework models consciousness.

**Key Features:**
- Animated diagrams
- Real-time parameter adjustments
- Visual representation of:
  - Precision weighting
  - Ignition thresholds
  - Prediction errors
  - Phase transitions

---

#### **Neuromoduratory-Cascade.html**
Visualization of neuromodulatory influences on consciousness.

**Purpose:** Illustrate how neuromodulators (NE, ACh) affect precision and ignition.

**Key Features:**
- Cascade diagram
- Interaction visualizations
- Neurotransmitter effects display
- Educational annotations

---

### Design System Pages

#### **UI-Library.html**
Component library and design system showcase.

**Purpose:** Document reusable UI components used throughout the site.

**Key Features:**
- Button styles and states
- Card components
- Form elements
- Typography system
- Color palette
- Icon set

---

#### **UI-Library-Short.html**
Condensed version of the UI library.

**Purpose:** Quick reference guide for essential components.

**Key Features:**
- Core components only
- Simplified documentation
- Fast loading

---

#### **UI-Library-Complete.html**
Comprehensive UI component library.

**Purpose:** Complete design system documentation with all variations.

**Key Features:**
- All component variations
- Usage guidelines
- Code examples
- Accessibility notes

---

#### **Styleguide.html**
Brand and visual style guidelines.

**Purpose:** Define visual identity and styling standards for the APGI website.

**Key Features:**
- Color palette definitions
- Typography hierarchy
- Spacing system
- Grid system
- Animation guidelines
- Brand voice and tone

---

### Utility Pages

#### **Leftovers.html**
Archive of deprecated or experimental features.

**Purpose:** Storage for code snippets and features not currently in use but potentially valuable for future reference.

**Key Features:**
- Experimental UI components
- Alternative design approaches
- Code snippets
- Deprecated features

---

## Technical Components

### Liquid Networks Directory

The `liquid-networks/` directory contains Python implementations and visualization tools for the APGI framework using Liquid Time-Constant Networks.

#### **APGI-Implementation.py** (1,620 lines)
Research-grade PyTorch implementation of the APGI Framework.

**Purpose:** Provide a mathematically rigorous, biologically plausible neural network implementation of consciousness based on APGI theory.

**Key Components:**

1. **Core Neural Components:**
   - `LTCNeuron` - Liquid Time-Constant neurons with adaptive time constants
   - `HierarchicalPredictiveLayer` - Bidirectional predictive coding (3 levels)
   - `PrecisionEstimator` - Context-dependent precision Π^i(M,c,a) and Π^e
   - `PredictionErrorModule` - Computes S = Π^e·|ε^e| + Π^i·|ε^i|
   - `MetabolicCostModule` - Free energy minimization and thermodynamic constraints
   - `AdaptiveThreshold` - Dynamic threshold θ with allostatic regulation
   - `GlobalWorkspace` - Phase transition dynamics with hysteresis
   - `NeuromodulationModule` - NE and ACh influences
   - `RefractoryPeriodModule` - Post-ignition suppression
   - `TemporalIntegrationModule` - 0-500ms integration windows
   - `PrecisionLearningModule` - Meta-learning from prediction accuracy

2. **Main Network:**
   - `APGILiquidNetwork` - Complete integrated system
   - Hierarchical predictive coding (3 levels)
   - Context-dependent precision weighting
   - Phase transition dynamics
   - Metabolic cost modeling

3. **Data Structures:**
   - `IgnitionState` - Conscious/Unconscious/Transitioning
   - `PrecisionOutput` - Precision estimates and time constants
   - `PredictionOutput` - Prediction errors across hierarchy
   - `MetabolicOutput` - Costs, benefits, and free energy
   - `APGIState` - Complete network state representation

4. **Validation Tools:**
   - `APGIValidator` - Comprehensive testing suite
   - ODE integration correctness
   - Precision-surprise relationship validation
   - Phase transition behavior testing
   - Metabolic cost scaling verification

**Mathematical Foundation:**
- Implements dx/dt = (1/τ) * (-x + σ(W·input + b))
- Free energy: F = Cost - Benefit
- Ignition: P(ignition) = σ(β * (S - θ))
- Threshold dynamics: dθ/dt = γ(θ₀ - θ) - δB_{t-1} - λ(dS/dt)

**Technologies:** PyTorch, NumPy, LSTM, ODE solvers

**Based on:**
- Hasani et al. (2021) - Liquid Time-Constant Networks
- APGI Framework - Allostatic Precision-Gated Ignition theory
- Friston (2010) - Free Energy Principle
- Dehaene & Changeux (2011) - Global Workspace Theory

---

#### **APGI_Liquid_Network.py**
Extended implementation with additional experimental features.

**Purpose:** Larger, more feature-rich version of the APGI network implementation.

**Key Features:**
- Extended network architectures
- Additional experimental modules
- Alternative formulations
- Research variants

**Note:** File exceeds 25,000 tokens; contains comprehensive implementation details.

---

### Liquid Networks HTML Visualizations

#### **Liquid-Paper.html**
Academic paper about Liquid Time-Constant Networks.

**Purpose:** Present the mathematical foundations of LTC networks used in APGI implementation.

**Key Features:**
- Mathematical formulations
- Network architecture diagrams
- Performance comparisons
- Implementation details

---

#### **Liquid-Presentation.html**
Slide-based presentation on Liquid Networks.

**Purpose:** Educational presentation format for explaining LTC networks.

**Key Features:**
- Slide navigation
- Animated diagrams
- Code examples
- Visual explanations

---

#### **Liquid-Presentation-2.html**
Updated version of the Liquid Networks presentation.

**Purpose:** Revised presentation with enhanced visuals and updated content.

---

#### **Liquid-Networks-Visualization.html**
Interactive visualization of Liquid Time-Constant Network dynamics.

**Purpose:** Demonstrate how LTC networks process temporal information.

**Key Features:**
- Real-time network animation
- Parameter adjustment controls
- Temporal dynamics visualization
- Adaptive time constant display

---

#### **apgi_visualization.html**
Interactive APGI network visualization.

**Purpose:** Visual exploration tool for APGI network behavior.

**Key Features:**
- Network state visualization
- Ignition process animation
- Precision weighting display
- Threshold dynamics

---

## Assets

### Images Directory

#### **APGI-Framework-Diagram.png**
Core framework architecture diagram.

**Purpose:** Visual representation of the APGI system components and their relationships.

**Content:**
- Hierarchical processing layers
- Precision weighting mechanisms
- Global ignition dynamics
- Feedback loops

---

#### **Evolutionary-Mismatch.jpg**
Diagram illustrating evolutionary context.

**Purpose:** Show why consciousness evolved and where modern mismatches occur.

---

#### **Fundamental-values-logo.svg**
Logo/icon for the framework.

**Purpose:** Brand identity element.

---

#### **cover-tns-small.png**
Book cover thumbnail.

**Purpose:** Display on book promotion pages.

---

#### **200x300.png**
Placeholder image for development.

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- For Python implementations: Python 3.8+, PyTorch, NumPy
- Local web server (optional, for development)

### Running the Website Locally

#### Option 1: Direct File Opening
Simply open any `.html` file in your browser:
```bash
# On macOS
open Home.html

# On Linux
xdg-open Home.html

# On Windows
start Home.html
```

#### Option 2: Local Web Server (Recommended)
Using Python's built-in HTTP server:
```bash
# Python 3
python -m http.server 8000

# Then navigate to:
# http://localhost:8000/Home.html
```

Using Node.js http-server:
```bash
npx http-server -p 8000
```

### Running Python Implementations

#### Setup
```bash
cd liquid-networks/

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install torch numpy
```

#### Run APGI Implementation
```bash
python APGI-Implementation.py
```

**Expected Output:**
- Network initialization confirmation
- 10-step simulation with diagnostics:
  - Ignition state and probability
  - Surprise levels and threshold
  - Precision estimates
  - Metabolic costs
  - Neuromodulator levels
- Validation test results:
  - ODE integration stability
  - Precision-surprise formula correctness
  - Phase transition smoothness
  - Metabolic cost scaling

---

## Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid, Flexbox, animations
- **JavaScript (ES6+)** - Interactive functionality
- **SVG** - Vector graphics and visualizations
- **Canvas API** - Particle animations and dynamic graphics

### Libraries & Frameworks
- **Chart.js** - Data visualization (radar charts, line charts, bar charts)
- **Gauge Chart** - Gauge visualizations for ignition indicators
- **TailwindCSS** - Utility-first CSS framework (APGI-Paper.html)
- **Lucide Icons** - Icon system
- **Font Awesome** - Additional icon set

### Python Stack
- **PyTorch** - Deep learning framework for neural networks
- **NumPy** - Numerical computing
- **Python 3.8+** - Core language

### Design Patterns
- **Responsive Design** - Mobile-first approach
- **Progressive Enhancement** - Graceful degradation
- **Component-Based Architecture** - Reusable UI components
- **Dark/Light Theme Support** - User preference adaptation
- **Accessibility (a11y)** - ARIA labels, keyboard navigation, skip links

### Mathematical Foundations
- **Ordinary Differential Equations (ODEs)** - Neural dynamics modeling
- **Bayesian Inference** - Predictive processing
- **Free Energy Principle** - Thermodynamic constraints
- **Phase Transition Dynamics** - Ignition mechanisms
- **Hierarchical Predictive Coding** - Multi-level inference

---

## File Summary Table

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| **Home.html** | HTML/JS | 995 | Landing page with quiz |
| **APGI-Paper.html** | HTML/JS | 1,280 | Academic framework presentation |
| **Dashboard.html** | HTML/JS | 1,045 | Interactive user dashboard |
| **Dashboard-Acad.html** | HTML | 1,045 | Dashboard design specification |
| **Assessment.html** | HTML | ~800 | Full consciousness assessment |
| **Assessment-OnePage.html** | HTML | ~600 | Single-page quiz version |
| **Quiz.html** | HTML/JS | 100+ | Standalone quiz component |
| **Book-Outline.html** | HTML | 100+ | Book table of contents |
| **Book-Available-Now.html** | HTML | 100+ | Book landing page |
| **Profile.html** | HTML | ~400 | User profile management |
| **Consciousness-Visualization.html** | HTML/JS | ~600 | Interactive consciousness viz |
| **Neuromoduratory-Cascade.html** | HTML/JS | ~500 | Neuromodulator visualization |
| **UI-Library.html** | HTML | ~800 | Component library |
| **UI-Library-Short.html** | HTML | ~400 | Condensed component library |
| **UI-Library-Complete.html** | HTML | ~1,200 | Full component documentation |
| **Styleguide.html** | HTML | ~500 | Design system guide |
| **Leftovers.html** | HTML | ~300 | Deprecated features archive |
| **APGI-Implementation.py** | Python | 1,620 | PyTorch APGI network |
| **APGI_Liquid_Network.py** | Python | 25,000+ | Extended implementation |
| **Liquid-Paper.html** | HTML | ~1,500 | LTC network paper |
| **Liquid-Presentation.html** | HTML | ~800 | LTC presentation v1 |
| **Liquid-Presentation-2.html** | HTML | ~900 | LTC presentation v2 |
| **Liquid-Networks-Visualization.html** | HTML/JS | ~700 | Interactive LTC viz |
| **apgi_visualization.html** | HTML/JS | ~800 | APGI network visualization |

**Total:** 24 HTML files, 2 Python files, 5 images, 1 README

---

## Key Concepts & Terminology

### APGI Framework Parameters

- **ε (Epsilon)** - Sensitivity to environmental signals
- **π (Pi)** - Processing intensity / Precision weighting
- **θₜ (Theta)** - Awareness threshold for conscious access
- **β (Beta)** - Somatic bias (body vs. world focus balance)
- **S (Surprise)** - Total precision-weighted prediction error
- **Π^i(M,c,a)** - Context-dependent interoceptive precision
- **Π^e** - Exteroceptive precision
- **ε^i** - Interoceptive prediction error
- **ε^e** - Exteroceptive prediction error

### Core Theoretical Concepts

- **Allostatic Regulation** - Predictive adjustment of internal states to maintain homeostatic balance
- **Precision Weighting** - Confidence-based gating of signals that determines when prediction failures warrant conscious intervention
- **Global Ignition** - Phase transition enabling sudden, system-wide information broadcast when errors exceed threshold
- **Interoceptive Inference** - Hierarchical prediction of body states that gates conscious access
- **Thermodynamic Constraints** - Metabolic expenditure limits making consciousness expensive and selective
- **Predictive Processing** - Brain generates predictions and updates only when mismatches occur
- **Free Energy Minimization** - Organisms minimize surprise to maintain homeostatic integrity
- **Global Workspace Theory** - Conscious access through global broadcast to distributed networks

### Consciousness Archetypes

Based on quiz results, users are classified into five archetypes:

1. **The Analyst** - Low threshold, moderate interoception, low somatic bias (focused, logical)
2. **The Empath** - High threshold, high interoception, high somatic bias (empathetic, sensitive)
3. **The Pragmatist** - Balanced across all dimensions (adaptable, flexible)
4. **The Sensor** - High threshold, low interoception, low somatic bias (externally focused)
5. **The Intuitive** - Low threshold, high interoception, high somatic bias (body-aware, introspective)

---

## Development Notes

### Code Organization
- Self-contained HTML files with embedded CSS and JavaScript
- Minimal external dependencies
- Progressive enhancement approach
- Mobile-first responsive design

### Browser Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- CSS Grid and Flexbox support required
- JavaScript ES6+ features used
- SVG and Canvas API support needed

### Performance Considerations
- Particle animations optimized with requestAnimationFrame
- Lazy loading for images
- Debounced scroll listeners
- Optimized Chart.js rendering

### Future Enhancements
- Backend API integration for data persistence
- User authentication and profiles
- Real-time collaborative features
- Mobile app versions
- Advanced analytics and tracking
- A/B testing framework
- Internationalization (i18n)

---

## Research Context

The APGI Framework integrates multiple streams of neuroscience research:

- **Predictive Processing** (Friston, Clark, Hohwy)
- **Global Workspace Theory** (Dehaene, Changeux, Baars)
- **Interoceptive Inference** (Seth, Barrett, Craig)
- **Free Energy Principle** (Friston)
- **Thermodynamic Brain Theory** (Sengupta, Stemmler, Friston)
- **Liquid Time-Constant Networks** (Hasani et al., 2021)

### Key Publications Referenced
- Hasani, R., et al. (2021). Liquid Time-Constant Networks. AAAI.
- Friston, K. (2010). The free-energy principle: a unified brain theory? Nature Reviews Neuroscience.
- Dehaene, S., & Changeux, J. P. (2011). Experimental and theoretical approaches to conscious processing. Neuron.

---

## License

All content © 2025 APGI Framework Research Consortium.

Academic use permitted under CC BY-NC-SA 4.0 license.

---

## Contact & Collaboration

For research collaboration inquiries:
- Email: apgi.framework@institution.edu
- GitHub: (Repository link)
- Website: (Main site URL)

---

## Acknowledgments

This project integrates theoretical work from multiple research domains including computational neuroscience, predictive processing, thermodynamics, and machine learning. We acknowledge the foundational contributions of Karl Friston, Stanislas Dehaene, Anil Seth, and numerous other researchers in consciousness science.

---

**Last Updated:** 2025-12-18
**Version:** 1.0.0
**Status:** Active Development

# CLAUDE.md - AI Assistant Guide for APGI Theory Repository

## Repository Overview

**Project Name:** APGI (Active Precision-Gated Ignition Model)
**Type:** Scientific computational model / Python library
**Domain:** Computational neuroscience, consciousness science
**Primary Language:** Python 3.7+
**License:** MIT

### Purpose

This repository implements a biophysically-grounded computational model of conscious access based on thalamocortical microcircuit dynamics. The APGI model formalizes the transition to conscious awareness through a precision-gated threshold mechanism, mapping abstract cognitive concepts to specific neural substrates.

**Key Scientific Contribution:** Unlike purely phenomenological models, APGI explicitly maps state variables to physiological processes (L2/3 firing rates, L5 pyramidal NMDA thresholds, frontoparietal metastable states).

---

## Repository Structure

```
apgi-theory/
├── apgi/                          # Main package
│   ├── __init__.py               # Package exports and high-level API
│   ├── core/                     # Core mathematical model
│   │   ├── __init__.py
│   │   ├── model.py              # APGIModel class - implements differential equations
│   │   ├── parameters.py         # Parameter definitions, empirical constraints
│   │   └── neuromodulators.py    # Neuromodulator dynamics (NE, ACh, 5-HT, DA)
│   ├── simulation/               # High-level simulation runners
│   │   ├── __init__.py
│   │   ├── runner.py             # APGISimulation class - trial management
│   │   └── stimuli.py            # Stimulus generator functions
│   ├── visualization/            # Plotting and visualization
│   │   ├── __init__.py
│   │   └── plotting.py           # Figure generation for model outputs
│   └── examples/                 # Demonstration scripts
│       ├── __init__.py
│       ├── basic_ignition.py     # Basic ignition demonstrations
│       └── neuromodulator_effects.py  # Neuromodulatory manipulations
├── run_apgi.py                   # CLI for running examples
├── setup.py                      # Package installation configuration
├── requirements.txt              # Python dependencies
├── test_install.py               # Installation verification script
├── delete_pycache.py             # Utility to clean __pycache__ directories
├── README.md                     # Comprehensive project documentation
└── .github/workflows/
    └── pylint.yml                # CI/CD: Python linting

```

---

## Core Architecture

### Mathematical Foundation

The model implements three coupled differential equations:

1. **Surprise Accumulation:**
   ```
   dS_t/dt = -S_t/τ + f(Π_e·ε_e, Π_i·ε_i) + σ·η(t)
   ```
   - Evidence accumulates from precision-weighted prediction errors
   - Divisive normalization prevents double-counting

2. **Threshold Dynamics:**
   ```
   dθ_t/dt = γ(θ_0 - θ_t) + δ·B_{t-1} - λ·|dS_t/dt|
   ```
   - Homeostatic recovery, post-ignition refractoriness, urgency

3. **Ignition Probability:**
   ```
   B_t = σ(α(S_t - θ_t))
   ```
   - Sigmoid transition, near-binary response

### Module Breakdown

#### `apgi/core/model.py` (292 lines)
**Primary Class:** `APGIModel`

**Responsibilities:**
- Implements the three state equations
- Numerical integration (Euler method, dt=1ms)
- Neuromodulator-based threshold modulation
- State tracking and history management

**Key Methods:**
- `step()`: Single integration step, returns (S_t, θ_t, B_t)
- `set_neuromodulators()`: Update tonic neuromodulator levels
- `reset()`: Initialize state for new simulation
- `get_history()`: Retrieve simulation history as numpy arrays

**Important Details:**
- Uses divisive normalization for extero/interoceptive integration
- Implements empirically-constrained parameter values (see parameters.py)
- Tracks ignition events stochastically (sampling from B_t)

#### `apgi/core/parameters.py` (183 lines)
**Primary Class:** `APGIParameters` (dataclass)

**Responsibilities:**
- Defines all model parameters with empirical justification
- Provides preset configurations (STANDARD, HIGH_VIGILANCE, LOW_AROUSAL, THREAT_DETECTION)
- Documents neural correlates and timescale architecture

**Critical Parameters:**
- `tau = 0.2s`: Surprise decay (Palmer et al. 2005)
- `alpha = 7.5`: Sigmoid steepness (creates 10%→90% transition over ΔS ≈ 0.4-0.8)
- `gamma = 2.0 s⁻¹`: Homeostatic recovery (~350ms half-life)
- `delta = 0.4`: Post-ignition elevation (creates ~250-400ms refractory period)
- `lambda_urgency = 0.075`: Urgency coefficient
- `beta = 1.35`: Somatic bias (interoceptive weighting)
- `kappa = 0.2`: Divisive normalization constant

**Neuromodulator Coefficients:**
- `kappa_NE = 0.30`: Norepinephrine (threshold-lowering)
- `kappa_ACh = 0.15`: Acetylcholine (threshold-lowering)
- `kappa_5HT = 0.425`: Serotonin (threshold-raising)
- `kappa_DA = 0.20`: Dopamine (threshold-raising)

**All parameter values are empirically justified in comments - preserve these citations!**

#### `apgi/core/neuromodulators.py`
**Primary Classes:** `NeuromodulatorProfile`, `NeuromodulatorState` (enum)

**Responsibilities:**
- Manages neuromodulator levels (NE, ACh, 5-HT, DA)
- Provides preset states (BASELINE, HIGH_VIGILANCE, LOW_AROUSAL, THREAT, etc.)
- Handles phasic bursts and temporal dynamics

#### `apgi/simulation/runner.py` (283 lines)
**Primary Class:** `APGISimulation`

**Responsibilities:**
- High-level simulation interface
- Trial management (pre-stimulus, stimulus, post-stimulus phases)
- Stimulus function handling
- Psychometric curve estimation

**Key Methods:**
- `run()`: General-purpose simulation with custom stimulus function
- `run_trial()`: Single discrete stimulus presentation
- `run_dual_task()`: Demonstrates attentional blink / PRP
- `run_threshold_staircase()`: Psychophysical detection threshold estimation
- `set_neuromodulator_state()`: Apply preset neuromodulator configurations

#### `apgi/simulation/stimuli.py`
**Functions:** Stimulus generators returning `(Pi_e, epsilon_e, Pi_i, epsilon_i)` tuples

**Common Generators:**
- `pulse_stimulus()`: Brief, discrete stimulus
- `ramp_stimulus()`: Gradually increasing evidence
- `threat_stimulus()`: Combined extero/interoceptive with urgency
- `dual_task_stimulus()`: Two sequential stimuli
- `interoceptive_stimulus()`: Primarily bodily signals

#### `apgi/visualization/plotting.py`
**Functions:** Matplotlib-based visualization

**Key Functions:**
- `plot_simulation()`: Time series of S, θ, B
- `plot_threshold_dynamics()`: Threshold components over time
- `plot_psychometric_curve()`: Detection probability vs. stimulus intensity
- `plot_dual_task()`: Dual-task results with ignition markers
- `plot_neuromodulator_effects()`: Comparative neuromodulator manipulations

---

## Development Workflows

### Installation and Setup

```bash
# Clone repository
git clone https://github.com/lesoto/apgi-theory.git
cd apgi-theory

# Install in development mode
pip install -e .

# Or install with optional dependencies
pip install -e ".[dev]"

# Verify installation
python test_install.py
```

### Running Examples

```bash
# List all available examples
python run_apgi.py --list

# Run all basic examples
python run_apgi.py --group basic

# Run all neuromodulator examples
python run_apgi.py --group neuromod

# Run all examples
python run_apgi.py --group all

# Run specific examples
python run_apgi.py --examples "basic:example_basic_ignition,neuromod:example_threat_response"

# Save figures without displaying
python run_apgi.py --group all --save-figs --no-show --outdir figures --format png --dpi 300

# Run directly as module
python -m apgi.examples.basic_ignition
python -m apgi.examples.neuromodulator_effects
```

### Basic Usage Pattern

```python
from apgi import APGISimulation
from apgi.visualization import plot_simulation

# Create simulation
sim = APGISimulation()

# Run a trial
history = sim.run_trial(
    pre_stimulus=0.5,      # 500ms baseline
    stimulus_duration=0.3,  # 300ms stimulus
    post_stimulus=1.0,      # 1s post-stimulus
    Pi_e=1.0,              # Exteroceptive precision
    epsilon_e=2.0          # Exteroceptive prediction error
)

# Visualize
fig = plot_simulation(history, show_inputs=True)
fig.show()
```

### Testing

**Comprehensive Test Suite:**
- `tinker_app.py`: Comprehensive test execution suite that runs ALL examples
- Executes all 9 examples (4 basic + 5 neuromodulator)
- Provides detailed reporting, timing metrics, and figure generation
- Supports headless execution, HTML/JSON reports, and error handling

**Usage:**
```bash
# Run all tests with default settings
python tinker_app.py

# Run all tests and save figures with HTML report
python tinker_app.py --save-figs --report

# Headless execution with verbose output
python tinker_app.py --no-show --save-figs --report --verbose

# Custom configuration
python tinker_app.py --save-figs --outdir results --format pdf --dpi 300 --continue-on-error
```

**Output Structure:**
- `tinker_output/figures/`: All generated figures
- `tinker_output/reports/`: JSON and HTML test reports
- Provides pass/fail statistics, timing breakdown, and error details

**Basic Verification:**
- `test_install.py`: Basic import verification

**CI/CD:**
- GitHub Actions runs Pylint on all Python files
- Workflow: `.github/workflows/pylint.yml`
- Tests Python 3.8, 3.9, 3.10

---

## Key Conventions and Coding Standards

### Code Style

1. **Follow PEP 8** - enforced via Pylint in CI/CD
2. **Docstrings:** Use Google-style docstrings for all public functions/classes
3. **Type hints:** Use typing annotations where appropriate (especially public API)
4. **Line length:** Approximately 100 characters (not strictly enforced)

### Naming Conventions

**Mathematical Variables:**
- Use standard scientific notation in comments and docstrings
- In code, translate Greek letters:
  - `theta_t` → θ_t
  - `epsilon_e` → ε_e
  - `Pi_e` → Π_e
  - `lambda_` → λ (note underscore to avoid Python keyword)

**Function Names:**
- Lowercase with underscores: `compute_surprise_input()`
- Prefix with underscore for internal methods: `_divisive_normalization()`

**Class Names:**
- PascalCase: `APGIModel`, `NeuromodulatorProfile`

### Parameter Handling

**CRITICAL:** All parameters have empirical justification
- When modifying parameters, update comments with citations
- Default values are empirically grounded (see README.md references)
- Acceptable ranges documented in `APGIParameters` class

### Scientific Accuracy

1. **Preserve biological plausibility:** Changes should not violate known neuroscience
2. **Document assumptions:** Clearly state simplifications or approximations
3. **Citation trail:** Maintain references to empirical studies
4. **Units:** Time in seconds, rates in Hz, dimensionless for normalized quantities

### Import Organization

Standard order in Python files:
```python
# 1. Standard library
import numpy as np
from typing import Tuple, Optional

# 2. Third-party
import matplotlib.pyplot as plt

# 3. Local imports
from ..core.model import APGIModel
from ..core.parameters import APGIParameters
```

---

## Common Development Tasks

### Adding a New Example

1. Create function in `apgi/examples/basic_ignition.py` or `neuromodulator_effects.py`
2. Follow pattern:
   ```python
   def example_new_feature():
       """Brief description."""
       sim = APGISimulation()
       # ... simulation code ...
       fig = plot_simulation(history)
       return fig
   ```
3. Add to registry in `run_apgi.py`
4. Test with: `python run_apgi.py --examples "basic:example_new_feature"`

### Adding a New Parameter

1. Add to `APGIParameters` dataclass in `apgi/core/parameters.py`
2. Include empirical justification in comment
3. Update `APGIModel.__init__()` signature in `apgi/core/model.py`
4. Implement in relevant equations in `APGIModel.step()`
5. Update README.md parameter reference table
6. Add tests or examples demonstrating effect

### Adding a New Stimulus Type

1. Create generator function in `apgi/simulation/stimuli.py`
2. Return signature: `Callable[[float], Tuple[float, float, float, float]]`
   - Input: time (float)
   - Output: (Pi_e, epsilon_e, Pi_i, epsilon_i)
3. Export in `apgi/simulation/__init__.py`
4. Create example demonstrating usage

### Modifying Core Equations

**HIGH CAUTION - Changes affect scientific validity**

1. Review relevant neuroscience literature first
2. Document biological justification in code comments
3. Update README.md mathematical framework section
4. Validate against known phenomena (attentional blink, PRP, psychometric curves)
5. Consider parameter identifiability (see README.md section)
6. Update examples to demonstrate effect

---

## Important Files - Quick Reference

### Must-Read Before Modifying

| File | Lines | Critical For |
|------|-------|--------------|
| `apgi/core/model.py` | 292 | Understanding core dynamics |
| `apgi/core/parameters.py` | 183 | Parameter constraints and empirical basis |
| `README.md` | 650 | Full scientific context and theory |

### High-Impact Files

| File | Purpose | Modify If... |
|------|---------|--------------|
| `apgi/__init__.py` | Public API | Adding new exports |
| `apgi/simulation/runner.py` | High-level interface | Adding simulation methods |
| `apgi/visualization/plotting.py` | Figures | Adding visualization types |
| `setup.py` | Installation | Adding dependencies |
| `requirements.txt` | Dependencies | Adding packages |

### Utility Files

- `run_apgi.py`: CLI for examples (modify when adding new examples)
- `tinker_app.py`: Comprehensive test suite that executes ALL examples with reporting
- `delete_pycache.py`: Cleanup script (no modification needed)
- `test_install.py`: Installation verification (modify if adding import tests)

---

## Scientific Context for AI Assistants

### Key Phenomena the Model Explains

1. **Attentional Blink / Psychological Refractory Period**
   - Post-ignition threshold elevation (δ term) creates ~250-400ms refractory period
   - Implemented in `run_dual_task()` method

2. **Threat Detection with Urgency**
   - Rapidly accumulating surprise lowers threshold (λ term)
   - Demonstrated in `threat_stimulus()` and related examples

3. **Neuromodulatory State Effects**
   - Vigilance (high NE/ACh) lowers threshold → better detection
   - Relaxation (high 5-HT/DA) raises threshold → fewer false alarms

4. **Psychometric Curves**
   - Detection probability as function of stimulus intensity
   - Generated via `run_threshold_staircase()` method

### Parameter Identifiability - IMPORTANT

The README documents that **not all 14 parameters are independently recoverable** from behavioral data:

**High Recovery (r > 0.80):**
- theta_base, alpha, tau, sigma

**Moderate Recovery (0.50 < r < 0.80):**
- gamma, delta, beta·Pi_i (as product only!)

**Poor Recovery (r < 0.50):**
- Individual kappa_mod coefficients
- Separate beta and Pi_i
- lambda

**Implication:** Proposed changes should focus on identifiable parameters. The reduced 8-parameter model is recommended for empirical work.

### Biological Mapping (Critical for Scientific Validity)

| Variable | Neural Substrate | Location |
|----------|-----------------|----------|
| S_t | Population firing rate | L2/3 PPC/IPS |
| θ_t | NMDA spike threshold | L5 pyramidal apical dendrites |
| B_t | Metastable attractor | Frontoparietal network |

**Always preserve this mapping when making changes!**

### Neuromodulator Specificity

- **NE (Norepinephrine):** Unexpected uncertainty, interoceptive precision, threshold lowering
- **ACh (Acetylcholine):** Expected uncertainty, exteroceptive precision, threshold lowering
- **5-HT (Serotonin):** Environmental stability, threshold raising, reduces false alarms
- **DA (Dopamine):** Reward prediction, context-dependent threshold modulation

See README.md "Neuromodulatory Implementation" section (lines 151-401) for receptor-specific mechanisms.

---

## Git Workflow

### Branch Strategy

**Current branch:** `claude/claude-md-mi590alxerg9b9x1-01FraKjVuaEsuxujNWoex612`

**Convention:**
- Feature branches: `claude/description-sessionid`
- All development on feature branches
- Merge to main via pull requests

### Commit Messages

Follow existing pattern from git history:
```
Add comprehensive parameter identifiability and neuromodulatory implementation sections
Implement APGI: Active Precision-Gated Ignition Model
Create pylint.yml
```

**Style:**
- Imperative mood ("Add", "Implement", "Fix", not "Added", "Implemented")
- Descriptive and specific
- Single line if possible, multi-line for complex changes

### Git Operations

```bash
# Check status
git status

# Stage changes
git add <files>

# Commit with descriptive message
git commit -m "Add new visualization for threshold dynamics"

# Push to feature branch
git push -u origin claude/claude-md-mi590alxerg9b9x1-01FraKjVuaEsuxujNWoex612

# Create pull request (use gh CLI or GitHub web interface)
gh pr create --title "Add threshold dynamics visualization" --body "..."
```

---

## Dependencies

### Required
- Python >= 3.7
- NumPy >= 1.20.0 (numerical computation)
- SciPy >= 1.7.0 (scientific computing, optimization)
- Matplotlib >= 3.3.0 (visualization)

### Optional (dev)
- Jupyter >= 1.0.0 (interactive notebooks)
- IPython >= 7.0.0 (enhanced REPL)
- Seaborn >= 0.11.0 (enhanced plotting)

### CI/CD
- Pylint (code quality)

**When adding dependencies:**
1. Add to `requirements.txt` (or `setup.py` extras_require for optional)
2. Test installation in clean environment
3. Update README.md if user-facing
4. Consider version constraints (avoid breaking changes)

---

## Common Pitfalls and Gotchas

### 1. Time Step Selection
- Default `dt = 0.001s` (1ms) is empirically validated
- Larger dt → numerical instability
- Smaller dt → unnecessary computation
- **Don't change without rigorous validation**

### 2. Parameter Ranges
- Parameters have biological constraints (see `APGIParameters` comments)
- Violating ranges → unrealistic behavior
- Example: `alpha < 5` → gradual transition (not observed empirically)

### 3. Neuromodulator Normalization
- Levels are normalized 0-1, not absolute concentrations
- 0.5 = baseline, 0 = depleted, 1 = maximally elevated
- **Don't use values outside [0, 1]** (enforced by `np.clip`)

### 4. Ignition Stochasticity
- `B_t` is probability, actual ignition is sampled stochastically
- Single trial may not ignite even if B_t high
- **Use multiple trials** for psychometric curves

### 5. History Management
- `model.reset()` clears history
- `model.get_history()` returns **copies** (numpy arrays)
- Repeated calls to `step()` without reset → accumulating history

### 6. Division by Zero
- Threshold constrained: `theta_t = max(0.01, theta_t)` (line 237 of model.py)
- **Never allow theta_t = 0** in modifications

---

## Testing and Validation Checklist

When making changes, verify:

- [ ] Code passes Pylint (run: `pylint apgi/`)
- [ ] All examples run without errors
- [ ] Parameter values within documented ranges
- [ ] Biological plausibility maintained
- [ ] Docstrings updated
- [ ] README.md updated if user-facing changes
- [ ] No division by zero or numerical instabilities
- [ ] Imports resolve correctly
- [ ] Git commit message is descriptive

**Run full validation:**
```bash
# Lint
pylint $(git ls-files '*.py')

# Test examples
python run_apgi.py --group all --no-show

# Verify installation
python test_install.py
```

---

## Future Extensions (from README.md)

Planned but not yet implemented:
- [ ] Regional heterogeneity (different parameters per cortical area)
- [ ] Oscillatory dynamics (gamma-band synchronization)
- [ ] Working memory maintenance (sustained ignition)
- [ ] Multi-level hierarchy (nested ignition cascades)
- [ ] Learning and plasticity (threshold adaptation)

**Good opportunities for contributions!**

---

## Quick Reference: Key Functions

### Simulation
```python
from apgi import APGISimulation

sim = APGISimulation()
history = sim.run_trial(epsilon_e=2.0)
history = sim.run_dual_task(t1_onset=0.5, t2_onset=0.7)
results = sim.run_threshold_staircase()
```

### Neuromodulation
```python
from apgi import NeuromodulatorState

sim.set_neuromodulator_state(NeuromodulatorState.HIGH_VIGILANCE)
sim.inject_neuromodulator_event({'NE': 0.3})  # Phasic burst
```

### Visualization
```python
from apgi.visualization import plot_simulation, plot_psychometric_curve

fig = plot_simulation(history, show_inputs=True)
fig = plot_psychometric_curve(levels, rates, fit_sigmoid=True)
```

### Custom Stimuli
```python
def custom_stimulus(t):
    """Return (Pi_e, epsilon_e, Pi_i, epsilon_i)"""
    if 0.5 <= t < 1.0:
        return 1.0, 2.0, 0.5, 0.3
    return 0.0, 0.0, 0.0, 0.0

history = sim.run(duration=2.0, stimulus_fn=custom_stimulus)
```

---

## Questions? Debugging Strategies

### "Model doesn't ignite"
- Check: `epsilon_e` sufficient? (try > 1.5)
- Check: `theta_t` not elevated? (inspect `history['theta']`)
- Check: `alpha` value (should be 5-10 for sharp transition)

### "Ignites too easily / false alarms"
- Check: `theta_base` too low? (default 1.0)
- Check: Neuromodulator state (high NE/ACh lower threshold)
- Check: Noise level (`sigma_noise`, default 0.15)

### "Numerical instability"
- Check: `dt` value (must be <= 0.001s)
- Check: Parameter values within documented ranges
- Check: No negative thresholds (min 0.01 enforced)

### "Import errors"
- Run: `python test_install.py`
- Verify: `pip install -e .` completed successfully
- Check: All `__init__.py` files have correct imports

### "Figure doesn't show"
- Call `fig.show()` or `plt.show()` after plotting
- Check matplotlib backend (use `--no-show` for headless)

---

## Contact and Contribution

**Repository:** https://github.com/lesoto/apgi-theory
**Issues:** Use GitHub Issues for bugs, questions, or feature requests
**Pull Requests:** Welcome! Follow conventions in this guide

**When opening PRs:**
1. Describe scientific motivation
2. Reference relevant neuroscience literature if applicable
3. Include example demonstrating changes
4. Ensure Pylint passes
5. Update documentation (README.md, docstrings)

---

## Version History

- **v0.1.0** (Current): Initial implementation
  - Core APGI model with three state equations
  - Neuromodulator dynamics (NE, ACh, 5-HT, DA)
  - Example suite (basic ignition, neuromodulatory effects)
  - Visualization tools
  - Parameter identifiability analysis
  - CLI interface (`run_apgi.py`)

---

**Last Updated:** 2025-11-19
**CLAUDE.md Version:** 1.0
**For:** AI assistants working with the APGI Theory codebase

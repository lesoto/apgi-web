# VALIDATION.md - Multi-Modal Computational Modeling and Validation Guide

**Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** High-Priority Research Direction

---

## Executive Summary

This document provides a comprehensive guide for implementing multi-modal computational modeling and validation of the APGI (Active Precision-Gated Ignition) model. The validation framework ensures that:

1. **Ignition dynamics and conscious-like behaviors emerge** from the hierarchical active inference architecture
2. **Simulated data aligns with real neural and behavioral data** from empirical studies
3. **Parameter recovery analysis achieves high-fidelity recovery** of core parameters before clinical implementation

---

## Table of Contents

1. [Multi-Modal Architecture Overview](#1-multi-modal-architecture-overview)
2. [Hierarchical Active Inference Implementation](#2-hierarchical-active-inference-implementation)
3. [Dual-Channel Processing: Exteroceptive and Interoceptive](#3-dual-channel-processing-exteroceptive-and-interoceptive)
4. [Emergent Ignition Dynamics](#4-emergent-ignition-dynamics)
5. [Neural Data Comparison Framework](#5-neural-data-comparison-framework)
6. [Behavioral Data Validation](#6-behavioral-data-validation)
7. [Parameter Recovery Analysis](#7-parameter-recovery-analysis)
8. [Clinical Implementation Prerequisites](#8-clinical-implementation-prerequisites)
9. [Validation Protocols and Benchmarks](#9-validation-protocols-and-benchmarks)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Multi-Modal Architecture Overview

### 1.1 Design Principles

The APGI model implements a multi-modal computational architecture that integrates evidence from multiple sensory and internal channels. The core principle is that **conscious access emerges when precision-weighted surprise exceeds a dynamic ignition threshold**.

#### Current Implementation

```python
# Core state equations (from apgi/core/model.py)
dS_t/dt = -S_t/τ + f(Π_e·ε_e, Π_i·ε_i) + σ·η(t)  # Surprise accumulation
dθ_t/dt = γ(θ_0 - θ_t) + δ·B_{t-1} - λ·|dS_t/dt|   # Threshold dynamics
B_t = σ(α(S_t - θ_t))                                # Ignition probability
```

### 1.2 Multi-Modal Integration Function

The model employs **divisive normalization** for multi-modal integration:

```python
f(x, y) = (x + y) / (1 + κ·(x + y))
```

Where:
- `x = Π_e · |ε_e|` (precision-weighted exteroceptive prediction error)
- `y = β · Π_i · |ε_i|` (somatic-biased interoceptive prediction error)
- `κ = 0.2` (normalization constant)

This prevents double-counting of overlapping information while allowing both channels to contribute to ignition.

### 1.3 Extension Requirements for Full Multi-Modal Implementation

To achieve a complete hierarchical active inference architecture, the following extensions are required:

| Component | Current Status | Target Implementation |
|-----------|---------------|----------------------|
| Exteroceptive channel | Implemented | Hierarchical with multiple sensory modalities |
| Interoceptive channel | Implemented | Hierarchical with organ-specific pathways |
| Cross-modal integration | Basic (divisive normalization) | Precision-weighted Bayesian integration |
| Hierarchical prediction | Not implemented | Multi-level generative model |
| Active inference loop | Partial | Full perception-action cycle |

---

## 2. Hierarchical Active Inference Implementation

### 2.1 Theoretical Framework

Active inference formalizes perception and action as processes that minimize variational free energy. The APGI model extends this by implementing:

1. **Prediction Error Computation**: Mismatch between expected and observed states
2. **Precision Weighting**: Attention-modulated reliability estimation
3. **Threshold-Gated Access**: Ignition as entry into global workspace
4. **Neuromodulatory Control**: State-dependent precision and threshold adjustment

### 2.2 Hierarchical Structure

```
Level 4: Abstract Priors (Self-Model, Narrative)
    ↓ Top-down predictions
Level 3: Conceptual/Categorical (Object recognition, Emotion categories)
    ↓ Top-down predictions
Level 2: Feature Integration (Multi-sensory binding)
    ↓ Top-down predictions
Level 1: Sensory Features (Edges, Textures, Basic interoception)
    ↓ Top-down predictions
Level 0: Sensory Input (Raw signals)
```

### 2.3 Implementation Specification

#### 2.3.1 Hierarchical Agent Structure

```python
class HierarchicalAPGIAgent:
    """
    Multi-level active inference agent with separate
    exteroceptive and interoceptive processing streams.

    Architecture:
    - Multiple hierarchical levels (configurable depth)
    - Separate precision estimates per level per modality
    - Cross-modal integration at designated fusion levels
    - Top-down predictions and bottom-up prediction errors
    """

    def __init__(self,
                 n_extero_levels: int = 4,
                 n_intero_levels: int = 3,
                 fusion_level: int = 2):
        """
        Initialize hierarchical agent.

        Args:
            n_extero_levels: Depth of exteroceptive hierarchy
            n_intero_levels: Depth of interoceptive hierarchy
            fusion_level: Level at which cross-modal integration occurs
        """
        self.extero_hierarchy = [APGILevel(f"extero_L{i}") for i in range(n_extero_levels)]
        self.intero_hierarchy = [APGILevel(f"intero_L{i}") for i in range(n_intero_levels)]
        self.fusion_level = fusion_level

    def process_input(self, extero_input, intero_input):
        """
        Process multi-modal input through hierarchies.

        Returns:
            Integrated precision-weighted prediction error for ignition
        """
        # Bottom-up sweep: compute prediction errors at each level
        extero_errors = self._bottom_up_extero(extero_input)
        intero_errors = self._bottom_up_intero(intero_input)

        # Cross-modal integration at fusion level
        integrated_error = self._integrate_modalities(extero_errors, intero_errors)

        # Top-down sweep: update predictions
        self._top_down_update(integrated_error)

        return integrated_error
```

#### 2.3.2 Level-Specific Processing

Each hierarchical level implements:

```python
class APGILevel:
    """
    Single level in the hierarchical inference architecture.

    Implements:
    - Generative model: p(x_below | x_current)
    - Recognition model: q(x_current | x_below)
    - Precision estimation: π_current = precision(confidence, context)
    """

    def __init__(self, name: str, state_dim: int = 32):
        self.name = name
        self.state_dim = state_dim

        # State variables
        self.mu = np.zeros(state_dim)      # Expected state (mean)
        self.Sigma = np.eye(state_dim)     # State uncertainty (covariance)
        self.Pi = np.eye(state_dim)        # Precision (inverse covariance)

        # Generative model parameters
        self.A = np.eye(state_dim)         # Observation mapping
        self.B = np.eye(state_dim)         # Transition dynamics

    def compute_prediction_error(self, observation):
        """
        Compute precision-weighted prediction error.

        ε = Π · (observation - A·μ)
        """
        prediction = self.A @ self.mu
        error = observation - prediction
        weighted_error = self.Pi @ error
        return weighted_error, np.linalg.norm(weighted_error)

    def update_beliefs(self, bottom_up_error, top_down_prediction):
        """
        Update state beliefs via gradient descent on free energy.

        dμ/dt = -∂F/∂μ = Π_below · ε_below - Π_above · (μ - μ_above)
        """
        learning_rate = 0.1
        self.mu += learning_rate * (bottom_up_error - self.Pi @ (self.mu - top_down_prediction))
```

### 2.4 Precision Estimation Mechanisms

Precision (inverse variance) determines the weight given to prediction errors:

| Modality | Precision Modulators | Neural Substrate |
|----------|---------------------|------------------|
| Exteroceptive | Attention, ACh, sensory SNR | V1-V4, A1, S1 gain |
| Interoceptive | NE, arousal, visceral afference | Insula, ACC, amygdala |
| Cross-modal | Context, task demands | PPC, DLPFC |

#### 2.4.1 Dynamic Precision Computation

```python
def compute_precision(self,
                      signal_variance: float,
                      attention: float,
                      neuromod_state: dict) -> float:
    """
    Compute context-dependent precision.

    Π = Π_base · exp(attention_gain) · neuromod_factor / signal_variance

    Args:
        signal_variance: Estimated noise in signal
        attention: Attention weight (0-1)
        neuromod_state: Dict with NE, ACh, 5-HT, DA levels

    Returns:
        Precision estimate
    """
    Pi_base = 1.0 / (signal_variance + 1e-6)

    # Attention multiplicatively enhances precision
    attention_gain = 1 + 2 * attention  # Range: 1-3x

    # Neuromodulatory effects
    ACh_effect = 1 + 0.5 * neuromod_state['ACh']  # ACh enhances extero precision
    NE_effect = 1 + 0.3 * neuromod_state['NE']    # NE enhances intero precision

    return Pi_base * attention_gain * ACh_effect * NE_effect
```

---

## 3. Dual-Channel Processing: Exteroceptive and Interoceptive

### 3.1 Channel Architecture

The APGI model fundamentally distinguishes between two processing streams that converge at the ignition stage:

#### 3.1.1 Exteroceptive Channel (World-Directed)

**Function**: Process signals from the external environment

| Component | Description | Neural Correlate |
|-----------|-------------|------------------|
| Input | Visual, auditory, tactile, olfactory, gustatory | Primary sensory cortices |
| Features | Edges, frequencies, textures, spatial patterns | V1/V2, A1, S1 |
| Objects | Bound multi-feature representations | IT, STS, TPJ |
| Categories | Abstract classifications | PFC, temporal pole |

**Precision Modulation**:
- Acetylcholine (ACh): Primary modulator of exteroceptive precision
- Attention: Top-down gain control via fronto-parietal networks
- Context: Prior expectations from generative model

```python
# Exteroceptive precision computation
def compute_extero_precision(self,
                             sensory_snr: float,
                             attention: float,
                             ACh_level: float,
                             prior_confidence: float) -> float:
    """
    Π_e = (1/σ²_sensory) · (1 + α_att·attention) · exp(κ_ACh·ACh) · prior_confidence
    """
    base_precision = 1.0 / (sensory_snr + 0.01)
    attention_boost = 1 + 2.0 * attention
    ach_modulation = np.exp(0.15 * ACh_level)

    return base_precision * attention_boost * ach_modulation * prior_confidence
```

#### 3.1.2 Interoceptive Channel (Body-Directed)

**Function**: Process signals from the body's internal state

| Component | Description | Neural Correlate |
|-----------|-------------|------------------|
| Input | Cardiac, respiratory, gastric, thermal, nociceptive | Lamina I, NTS, vagal afferents |
| Integration | Multi-organ state estimation | Posterior insula |
| Evaluation | Homeostatic relevance, affective significance | Mid-insula, ACC |
| Awareness | Conscious body representation | Anterior insula |

**Precision Modulation**:
- Norepinephrine (NE): Primary modulator of interoceptive precision
- Arousal: State-dependent amplification
- Homeostatic deviation: Allostatic load increases precision

```python
# Interoceptive precision computation
def compute_intero_precision(self,
                             visceral_snr: float,
                             arousal: float,
                             NE_level: float,
                             homeostatic_error: float) -> float:
    """
    Π_i = (1/σ²_visceral) · (1 + α_arousal·arousal) · exp(κ_NE·NE) · (1 + homeo_error)
    """
    base_precision = 1.0 / (visceral_snr + 0.01)
    arousal_boost = 1 + 1.5 * arousal
    ne_modulation = np.exp(0.30 * NE_level)
    homeostatic_boost = 1 + 0.5 * homeostatic_error

    return base_precision * arousal_boost * ne_modulation * homeostatic_boost
```

### 3.2 Channel Separation Rationale

#### Biological Basis

1. **Anatomical Segregation**: Distinct thalamic nuclei (VPL/VPM for extero, VMb for intero)
2. **Neurotransmitter Specificity**: ACh for expected uncertainty (extero), NE for unexpected uncertainty (intero)
3. **Temporal Dynamics**: Exteroceptive signals are typically faster (50-200ms) than interoceptive (200-1000ms)
4. **Functional Role**: Exteroception for action guidance, interoception for allostatic regulation

#### Computational Necessity

Separating channels enables:
- **Independent precision estimation**: Each modality has its own reliability
- **Differential weighting**: Somatic bias (β) preferentially amplifies interoception
- **Flexible integration**: Context-dependent fusion strategies
- **Clinical dissociation**: Conditions like alexithymia affect interoception selectively

### 3.3 Integration Mechanisms

#### 3.3.1 Current Implementation (Divisive Normalization)

```python
def _divisive_normalization(self, Pi_e_eps_e: float, Pi_i_eps_i: float) -> float:
    """
    f(Π_e·ε_e, β·Π_i·ε_i) = (x + y) / (1 + κ·(x + y))

    Properties:
    - Subadditive: Combined < sum (prevents double-counting)
    - Bounded: Output saturates as inputs increase
    - Balanced: Neither channel can dominate completely
    """
    x = Pi_e_eps_e
    y = self.beta * Pi_i_eps_i  # Somatic bias
    total = x + y
    return total / (1 + self.kappa * total)
```

#### 3.3.2 Extended Integration (Proposed)

For full multi-modal validation, implement precision-weighted Bayesian integration:

```python
def bayesian_integration(self,
                         extero_errors: List[float],
                         intero_errors: List[float],
                         extero_precisions: List[float],
                         intero_precisions: List[float]) -> Tuple[float, float]:
    """
    Optimal multi-modal integration via precision weighting.

    μ_combined = Σ(Π_i · μ_i) / Σ(Π_i)
    Π_combined = Σ(Π_i)

    Returns:
        (integrated_error, integrated_precision)
    """
    # Stack all errors and precisions
    all_errors = np.concatenate([extero_errors, intero_errors])
    all_precisions = np.concatenate([extero_precisions, intero_precisions])

    # Apply somatic bias to interoceptive precisions
    all_precisions[len(extero_errors):] *= self.beta

    # Precision-weighted mean
    total_precision = np.sum(all_precisions)
    integrated_error = np.sum(all_precisions * all_errors) / total_precision

    return integrated_error, total_precision
```

### 3.4 Channel-Specific Validation Targets

| Metric | Exteroceptive Target | Interoceptive Target | Source |
|--------|---------------------|---------------------|--------|
| Detection threshold | 1.0-2.0 ε units | 0.5-1.5 ε units | Garfinkel et al. (2015) |
| Latency to ignition | 150-400 ms | 300-800 ms | Craig (2009) |
| Precision range | 0.3-3.0 | 0.2-2.0 | Ainley et al. (2016) |
| Cross-modal interference | 10-30% reduction | 20-40% reduction | Sel et al. (2017) |

---

## 4. Emergent Ignition Dynamics

### 4.1 Defining Ignition

**Ignition** in the APGI framework refers to the transition from local processing to global broadcast—when information becomes consciously accessible. This is modeled as:

```
B_t = σ(α(S_t - θ_t))
```

Where:
- `B_t`: Probability of ignition (conscious access)
- `S_t`: Accumulated precision-weighted surprise
- `θ_t`: Dynamic ignition threshold
- `α = 7.5`: Sigmoid steepness (creates near-binary transition)

### 4.2 Emergent Properties to Validate

The model must demonstrate the following emergent behaviors without explicit programming:

#### 4.2.1 Non-Linear Threshold Dynamics

**Target Behavior**: Sharp transition from unconscious to conscious processing

**Validation Metric**:
- 10% → 90% ignition probability over ΔS ≈ 0.4-0.8 units
- Sigmoidal psychometric function shape

```python
def validate_threshold_sharpness(model, epsilon_range=(0.5, 3.0), n_trials=100):
    """
    Verify that ignition exhibits sharp threshold transition.

    Expected: Psychometric curve with slope > 2.0 at midpoint
    """
    epsilons = np.linspace(epsilon_range[0], epsilon_range[1], 20)
    detection_rates = []

    for eps in epsilons:
        ignitions = sum(
            model.run_trial(epsilon_e=eps)['ignitions'].any()
            for _ in range(n_trials)
        ) / n_trials
        detection_rates.append(ignitions)

    # Fit sigmoid and compute slope at midpoint
    from scipy.optimize import curve_fit
    popt, _ = curve_fit(sigmoid, epsilons, detection_rates)
    slope_at_midpoint = popt[0] / 4  # d/dx sigmoid = α/4 at x=0

    assert slope_at_midpoint > 2.0, f"Transition too gradual: slope = {slope_at_midpoint}"
    return {'epsilons': epsilons, 'rates': detection_rates, 'slope': slope_at_midpoint}
```

#### 4.2.2 Attentional Blink / Psychological Refractory Period

**Target Behavior**: Reduced detection of second stimulus within 250-400ms of first ignition

**Mechanism**: Post-ignition threshold elevation (δ term)

```python
def validate_attentional_blink(model, soa_range=(0.1, 1.0)):
    """
    Verify post-ignition refractoriness.

    Expected: T2 detection drops to ~50% at SOA=200-300ms, recovers by 500ms
    """
    soas = np.linspace(soa_range[0], soa_range[1], 10)
    t2_detection = []

    for soa in soas:
        results = []
        for _ in range(50):
            history = model.run_dual_task(t1_onset=0.5, t2_onset=0.5+soa)
            # Check if T2 ignited (after T1)
            t1_ignited = history['ignitions'][:int(0.5/model.dt + 100)].any()
            t2_ignited = history['ignitions'][int((0.5+soa)/model.dt):].any()
            results.append(t2_ignited if t1_ignited else np.nan)
        t2_detection.append(np.nanmean(results))

    # Verify U-shaped curve
    min_idx = np.argmin(t2_detection)
    assert 0.15 < soas[min_idx] < 0.45, f"Blink timing incorrect: {soas[min_idx]}"
    assert t2_detection[min_idx] < 0.7, f"Blink too shallow: {t2_detection[min_idx]}"

    return {'soas': soas, 't2_detection': t2_detection}
```

#### 4.2.3 Urgency-Mediated Threshold Lowering

**Target Behavior**: Rapidly accumulating evidence lowers threshold, accelerating ignition

**Mechanism**: Urgency term (λ·|dS/dt|)

```python
def validate_urgency_effect(model):
    """
    Verify that rapid evidence accumulation facilitates ignition.

    Expected: Ramp stimuli ignite faster than step stimuli of equal final magnitude
    """
    # Step stimulus
    step_latencies = []
    for _ in range(50):
        history = model.run_trial(epsilon_e=1.5, stimulus_duration=0.5)
        if history['ignitions'].any():
            first_ignition = np.argmax(history['ignitions']) * model.dt
            step_latencies.append(first_ignition)

    # Ramp stimulus (same final magnitude)
    ramp_latencies = []
    for _ in range(50):
        history = model.run_ramp_stimulus(max_epsilon_e=1.5, ramp_duration=0.5)
        if history['ignitions'].any():
            first_ignition = np.argmax(history['ignitions']) * model.dt
            ramp_latencies.append(first_ignition)

    # Urgency effect: ramp should NOT be faster (urgency reduces threshold during rapid change)
    # Note: The urgency term lowers threshold during rapid ACCUMULATION
    mean_step = np.mean(step_latencies) if step_latencies else np.inf
    mean_ramp = np.mean(ramp_latencies) if ramp_latencies else np.inf

    return {'step_latency': mean_step, 'ramp_latency': mean_ramp}
```

#### 4.2.4 Neuromodulator-State Dependent Detection

**Target Behavior**: Detection thresholds vary systematically with neuromodulatory state

| State | NE | ACh | 5-HT | DA | Expected Threshold Change |
|-------|----|----|------|----|-----------------------|
| Vigilance | ↑ | ↑ | ↓ | = | -30 to -40% |
| Relaxed | ↓ | ↓ | ↑ | ↑ | +20 to +35% |
| Threat | ↑↑ | ↑ | ↓ | ↓ | -40 to -50% |
| Reward | = | = | = | ↑↑ | +10 to +20% |

```python
def validate_neuromodulator_effects(sim):
    """
    Verify state-dependent threshold modulation.
    """
    from apgi import NeuromodulatorState

    states = [
        NeuromodulatorState.BASELINE,
        NeuromodulatorState.HIGH_VIGILANCE,
        NeuromodulatorState.RELAXED,
        NeuromodulatorState.THREAT
    ]

    thresholds = {}
    for state in states:
        sim.set_neuromodulator_state(state)
        results = sim.run_threshold_staircase(epsilon_range=(0.5, 2.5), n_levels=15)

        # Find 50% detection threshold
        rates = np.array(results['detection_rates'])
        levels = np.array(results['epsilon_levels'])
        threshold_50 = levels[np.argmin(np.abs(rates - 0.5))]
        thresholds[state.value] = threshold_50

    # Validate relative ordering
    assert thresholds['threat'] < thresholds['high_vigilance'] < thresholds['baseline']
    assert thresholds['baseline'] < thresholds['relaxed']

    return thresholds
```

### 4.3 Conscious-Like Behaviors Checklist

The model must exhibit these behaviors to claim functional equivalence with conscious processing:

| Behavior | Description | Validation Test | Status |
|----------|-------------|-----------------|--------|
| All-or-none response | Near-binary ignition | Psychometric curve slope | Required |
| Global workspace | Ignition triggers widespread access | Simulated EEG/fMRI | Required |
| Serial bottleneck | Dual-task interference | Attentional blink | Required |
| Report reliability | High confidence after ignition | Metacognitive accuracy | Required |
| Capacity limitation | ~4 items sustained | Working memory extension | Optional |
| Temporal binding | ~300ms integration window | Temporal order judgments | Optional |

---

## 5. Neural Data Comparison Framework

### 5.1 Target Neural Signatures

The APGI model makes specific predictions about neural activity patterns that must be validated against empirical data.

#### 5.1.1 EEG/MEG Signatures

| Component | Predicted Source | Predicted Timing | Empirical Target |
|-----------|-----------------|------------------|------------------|
| P3b | L5 pyramidal burst (ignition) | 300-600ms post-stimulus | 300-500ms, parietal |
| Late positivity | Sustained frontoparietal | 400-800ms | Global workspace activation |
| Gamma synchrony | Cross-cortical binding | During ignition | 30-100Hz increase |
| Alpha suppression | Threshold lowering | Pre-ignition | 8-12Hz power decrease |

**Validation Protocol**:

```python
def generate_simulated_eeg(history: dict,
                           sampling_rate: int = 1000,
                           noise_level: float = 0.1) -> dict:
    """
    Generate simulated EEG signatures from APGI model output.

    Maps model variables to neural signals:
    - S_t → P3a-like component (surprise accumulation)
    - B_t → P3b component (ignition)
    - θ_t → Alpha power (inverse relationship)
    """
    n_samples = len(history['time'])

    # P3b: Convolve ignition events with HRF-like kernel
    ignition_events = history['ignitions'].astype(float)
    p3b_kernel = np.exp(-np.arange(500) / 100) * np.sin(np.arange(500) * 0.02)
    simulated_p3b = np.convolve(ignition_events, p3b_kernel, mode='same')

    # Alpha power: Inverse of threshold lowering
    alpha_power = 1.0 / (1 + history['theta'])

    # Add noise
    simulated_p3b += np.random.randn(n_samples) * noise_level

    return {
        'time': history['time'],
        'p3b': simulated_p3b,
        'alpha_power': alpha_power,
        'ignition_probability': history['B']
    }
```

#### 5.1.2 fMRI Signatures

| Region | Predicted Signal | Validation Approach |
|--------|-----------------|---------------------|
| Posterior parietal (PPC) | S_t accumulation | Parametric modulation by evidence |
| Dorsolateral PFC | B_t (ignition state) | Binary contrast seen vs. unseen |
| Anterior insula | Interoceptive precision | Correlation with Π_i |
| Thalamus (pulvinar) | Threshold dynamics | Pre-stimulus predictive of ignition |
| ACC | Conflict/urgency | Correlation with |dS/dt| |

**Comparison Metrics**:

```python
def compare_to_fmri_data(simulated_bold: np.ndarray,
                         empirical_bold: np.ndarray,
                         roi_mask: np.ndarray) -> dict:
    """
    Compare simulated and empirical BOLD signals.

    Metrics:
    - Pearson correlation within ROIs
    - Temporal alignment (cross-correlation lag)
    - Pattern similarity (RSA)
    """
    from scipy.stats import pearsonr
    from scipy.signal import correlate

    # Extract ROI time series
    sim_roi = simulated_bold[roi_mask].mean(axis=0)
    emp_roi = empirical_bold[roi_mask].mean(axis=0)

    # Correlation
    r, p = pearsonr(sim_roi, emp_roi)

    # Cross-correlation for temporal alignment
    xcorr = correlate(sim_roi, emp_roi, mode='full')
    lag = np.argmax(xcorr) - len(sim_roi) + 1

    return {'correlation': r, 'p_value': p, 'optimal_lag': lag}
```

### 5.2 Empirical Dataset Requirements

For valid comparison, the model must be tested against datasets containing:

#### 5.2.1 Minimum Requirements

| Data Type | Specifications | Example Datasets |
|-----------|---------------|------------------|
| Behavioral | Detection rates, RTs, confidence | Visual masking paradigms |
| EEG | 64+ channels, 500Hz+, seen/unseen | Melloni et al. (2007) |
| fMRI | Whole-brain, 2s TR, event-related | Dehaene et al. (2001) |
| Interoception | Heartbeat detection, respiratory | Garfinkel et al. (2015) |

#### 5.2.2 Ideal Experimental Paradigms

1. **Backward Masking with Variable SOA**
   - Tests threshold dynamics and temporal integration
   - Allows comparison of ignition latency distributions

2. **Attentional Blink with Neural Recording**
   - Validates post-ignition refractoriness
   - Tests T1-T2 interaction predictions

3. **Neuromodulatory Manipulation**
   - Pharmacological (propranolol, physostigmine)
   - Validates κ coefficients

4. **Interoceptive-Exteroceptive Competition**
   - Heartbeat detection during visual task
   - Tests dual-channel integration

### 5.3 Quantitative Comparison Standards

| Metric | Acceptable | Good | Excellent |
|--------|-----------|------|-----------|
| Behavioral fit (R²) | > 0.45 | > 0.65 | > 0.80 |
| Neural correlation (r) | > 0.30 | > 0.50 | > 0.70 |
| Timing accuracy (ms) | < 100 | < 50 | < 25 |
| Effect direction | Correct | Correct | Correct |
| Effect magnitude | Within 2x | Within 1.5x | Within 1.2x |

---

## 6. Behavioral Data Validation

### 6.1 Core Behavioral Phenomena

The APGI model must quantitatively reproduce the following behavioral phenomena:

#### 6.1.1 Psychometric Functions

**Phenomenon**: Sigmoidal relationship between stimulus intensity and detection probability

**Model Prediction**:
```
P(detection) = σ(α(f(Π·ε) - θ_0))
```

**Validation Data**:
- Visual contrast detection (Palmer et al., 2005)
- Auditory intensity detection (Green & Swets, 1966)
- Somatosensory threshold (Gescheider, 1997)

```python
def fit_psychometric_function(epsilons: np.ndarray,
                               detection_rates: np.ndarray) -> dict:
    """
    Fit psychometric function and extract parameters.

    Model: P(detect) = γ + (1-γ-λ) · σ(β(ε - θ))

    Where:
    - γ: guess rate (false alarm floor)
    - λ: lapse rate (miss ceiling)
    - β: slope (sensitivity)
    - θ: threshold (50% point)
    """
    from scipy.optimize import curve_fit

    def psychometric(x, gamma, lapse, beta, theta):
        return gamma + (1 - gamma - lapse) / (1 + np.exp(-beta * (x - theta)))

    # Initial guesses
    p0 = [0.0, 0.0, 5.0, np.median(epsilons)]
    bounds = ([0, 0, 0.1, 0], [0.2, 0.2, 20, np.max(epsilons)])

    popt, pcov = curve_fit(psychometric, epsilons, detection_rates, p0=p0, bounds=bounds)

    return {
        'guess_rate': popt[0],
        'lapse_rate': popt[1],
        'slope': popt[2],
        'threshold': popt[3],
        'covariance': pcov
    }
```

#### 6.1.2 Reaction Time Distributions

**Phenomenon**: RT distributions are right-skewed with systematic dependency on stimulus strength

**Model Prediction**: First passage time of S_t crossing θ_t follows inverse Gaussian

```python
def predict_rt_distribution(model, epsilon_e: float, n_trials: int = 1000) -> dict:
    """
    Generate predicted RT distribution from APGI model.

    RT = first time t such that S_t > θ_t with B_t > 0.5
    """
    rts = []

    for _ in range(n_trials):
        history = model.run_trial(epsilon_e=epsilon_e, pre_stimulus=0.3,
                                   stimulus_duration=2.0, post_stimulus=0.1)

        ignitions = history['ignitions']
        times = history['time']

        if ignitions.any():
            first_ignition_idx = np.argmax(ignitions)
            rt = times[first_ignition_idx] - 0.3  # Subtract pre-stimulus
            if rt > 0:
                rts.append(rt)

    return {
        'rts': np.array(rts),
        'mean': np.mean(rts) if rts else np.nan,
        'std': np.std(rts) if rts else np.nan,
        'median': np.median(rts) if rts else np.nan,
        'skewness': scipy.stats.skew(rts) if len(rts) > 2 else np.nan
    }
```

**Validation Targets**:

| Stimulus Strength | Mean RT (ms) | CV | Skewness |
|------------------|--------------|-----|----------|
| Low (near threshold) | 500-800 | 0.3-0.5 | 1.5-2.5 |
| Medium | 350-500 | 0.2-0.3 | 1.0-1.5 |
| High | 250-400 | 0.15-0.25 | 0.5-1.0 |

#### 6.1.3 Confidence Ratings

**Phenomenon**: Metacognitive accuracy tracks ignition probability

**Model Prediction**: Confidence ≈ B_t at time of response

```python
def predict_confidence(model, epsilon_e: float, n_trials: int = 100) -> dict:
    """
    Predict confidence ratings from ignition probability.

    Confidence operationalized as B_t at response time
    """
    confidences = []
    accuracies = []

    for _ in range(n_trials):
        history = model.run_trial(epsilon_e=epsilon_e)

        # Response time (first ignition or end of trial)
        if history['ignitions'].any():
            response_idx = np.argmax(history['ignitions'])
            confidence = history['B'][response_idx]
            accuracy = 1
        else:
            confidence = history['B'][-1]
            accuracy = 0

        confidences.append(confidence)
        accuracies.append(accuracy)

    return {
        'mean_confidence': np.mean(confidences),
        'accuracy': np.mean(accuracies),
        'calibration': np.corrcoef(confidences, accuracies)[0, 1]
    }
```

### 6.2 Clinical Population Predictions

The model should predict differences in specific clinical populations:

| Population | Parameter Affected | Predicted Behavior |
|------------|-------------------|-------------------|
| Anxiety | ↑NE, ↑β | Lower threshold, ↑false alarms |
| Depression | ↓NE, ↓DA | Higher threshold, ↓detection |
| ADHD | ↑σ, ↓α | Variable threshold, inconsistent detection |
| Autism | ↓κ (reduced normalization) | Atypical multi-modal integration |
| Alexithymia | ↓Π_i | Reduced interoceptive detection |

---

## 7. Parameter Recovery Analysis

### 7.1 Importance for Clinical Implementation

**Critical Requirement**: Before clinical application, the model must demonstrate that its parameters can be reliably estimated from behavioral and neural data.

Poor parameter recovery implies:
1. Model is overparameterized
2. Parameters are structurally non-identifiable
3. Empirical estimates will be unreliable
4. Clinical predictions will be unstable

### 7.2 Parameter Tiers (from README.md)

Based on simulated recovery experiments (N=1000, σ_noise=0.15):

| Tier | Parameters | Recovery (r) | Clinical Utility |
|------|-----------|--------------|------------------|
| **High** | θ_base, α, τ, σ | > 0.80 | Primary diagnostic targets |
| **Moderate** | γ, δ, β·Π_i | 0.50-0.80 | Secondary targets with caution |
| **Poor** | κ_mod, λ, separate β/Π_i | < 0.50 | Not individually estimable |

### 7.3 Recovery Protocol

#### 7.3.1 Simulation Setup

```python
def parameter_recovery_simulation(n_subjects: int = 1000,
                                   n_trials_per_subject: int = 200,
                                   noise_behavioral: float = 0.15,
                                   noise_neural: float = 0.20) -> dict:
    """
    Comprehensive parameter recovery analysis.

    Protocol:
    1. Generate ground-truth parameters from prior distributions
    2. Simulate behavioral + neural data with noise
    3. Recover parameters via maximum likelihood
    4. Compute correlation between true and recovered
    """

    # Prior distributions for parameters
    priors = {
        'theta_base': ('normal', 1.0, 0.2),
        'alpha': ('normal', 7.5, 1.5),
        'tau': ('normal', 0.2, 0.03),
        'sigma': ('normal', 0.15, 0.03),
        'gamma': ('normal', 2.0, 0.3),
        'delta': ('normal', 0.4, 0.08),
        'beta_Pi_i': ('normal', 0.675, 0.15),  # Product term
    }

    true_params = {k: [] for k in priors.keys()}
    recovered_params = {k: [] for k in priors.keys()}

    for subj in range(n_subjects):
        # Sample true parameters
        true = {}
        for param, (dist, mu, sigma) in priors.items():
            if dist == 'normal':
                true[param] = np.random.normal(mu, sigma)

        # Create model with true parameters
        model = APGIModel(
            theta_base=true['theta_base'],
            alpha=true['alpha'],
            tau=true['tau'],
            sigma_noise=true['sigma']
        )

        # Generate simulated data
        data = generate_behavioral_data(model, n_trials_per_subject, noise_behavioral)

        # Recover parameters
        recovered = fit_model_to_data(data)

        # Store results
        for param in priors.keys():
            true_params[param].append(true[param])
            recovered_params[param].append(recovered.get(param, np.nan))

    # Compute recovery correlations
    recovery_correlations = {}
    for param in priors.keys():
        r, p = pearsonr(true_params[param], recovered_params[param])
        recovery_correlations[param] = {'r': r, 'p': p}

    return {
        'true_params': true_params,
        'recovered_params': recovered_params,
        'correlations': recovery_correlations
    }
```

#### 7.3.2 Fitting Procedure

```python
def fit_model_to_data(behavioral_data: dict,
                       method: str = 'differential_evolution') -> dict:
    """
    Recover APGI parameters from behavioral data.

    Uses:
    - Detection rates at multiple stimulus levels
    - RT distributions
    - Optional: neural signatures
    """
    from scipy.optimize import differential_evolution, minimize

    def negative_log_likelihood(params):
        theta_base, alpha, tau, sigma = params

        model = APGIModel(theta_base=theta_base, alpha=alpha,
                          tau=tau, sigma_noise=sigma)

        nll = 0
        for level, data in behavioral_data.items():
            predicted_rate = simulate_detection_rate(model, level)
            observed_rate = data['detection_rate']
            n_trials = data['n_trials']

            # Binomial likelihood
            nll -= binom_logpmf(int(observed_rate * n_trials),
                                n_trials, predicted_rate)

        return nll

    # Parameter bounds
    bounds = [
        (0.5, 2.0),   # theta_base
        (3.0, 15.0),  # alpha
        (0.1, 0.4),   # tau
        (0.05, 0.3)   # sigma
    ]

    if method == 'differential_evolution':
        result = differential_evolution(negative_log_likelihood, bounds,
                                         maxiter=500, seed=42)
    else:
        x0 = [1.0, 7.5, 0.2, 0.15]
        result = minimize(negative_log_likelihood, x0, bounds=bounds)

    return {
        'theta_base': result.x[0],
        'alpha': result.x[1],
        'tau': result.x[2],
        'sigma': result.x[3],
        'nll': result.fun,
        'success': result.success
    }
```

### 7.4 Recovery Benchmarks

**Minimum requirements for clinical implementation**:

| Parameter | Required r | Required ICC | Required CV |
|-----------|-----------|--------------|-------------|
| θ_base | > 0.85 | > 0.80 | < 15% |
| α | > 0.80 | > 0.75 | < 20% |
| τ | > 0.75 | > 0.70 | < 20% |
| σ | > 0.75 | > 0.70 | < 25% |
| γ | > 0.60 | > 0.55 | < 30% |
| δ | > 0.55 | > 0.50 | < 35% |

**Note**: Individual neuromodulator coefficients (κ_NE, κ_ACh, κ_5HT, κ_DA) cannot be individually recovered from behavioral data. Use composite index κ_composite with multimodal proxies.

### 7.5 Structural Identifiability Analysis

#### 7.5.1 Known Confounds

1. **β vs. Π_i Confound**
   - Only product β·Π_i is observable
   - Resolution: Orthogonal manipulations (interoceptive pathway blockade)

2. **Neuromodulator Summation**
   - Threshold modulation is a weighted sum
   - Resolution: Pharmacological challenge or direct neurochemical assay

3. **Threshold vs. Precision Trade-off**
   - Low θ and high Π produce similar effects
   - Resolution: Pre-stimulus neural markers (alpha power)

#### 7.5.2 Identifiability Tests

```python
def test_structural_identifiability(model_class, n_simulations: int = 100):
    """
    Test structural identifiability via sensitivity analysis.

    Method: Profile likelihood / Fisher information matrix
    """
    # Compute Fisher Information Matrix at nominal parameters
    nominal_params = [1.0, 7.5, 0.2, 0.15]  # θ, α, τ, σ

    def model_likelihood(params, data):
        # Compute likelihood of data given parameters
        pass

    fim = compute_fisher_information(model_likelihood, nominal_params)

    # Check for rank deficiency (indicates non-identifiability)
    eigenvalues = np.linalg.eigvalsh(fim)
    condition_number = eigenvalues.max() / eigenvalues.min()

    # Warn if poorly conditioned
    identifiable = condition_number < 1000

    return {
        'fisher_information_matrix': fim,
        'eigenvalues': eigenvalues,
        'condition_number': condition_number,
        'identifiable': identifiable
    }
```

---

## 8. Clinical Implementation Prerequisites

### 8.1 Safety Requirements

Before clinical deployment, the model must pass:

| Requirement | Criterion | Test Protocol |
|-------------|----------|---------------|
| Parameter stability | ICC > 0.65 over 1 week | Test-retest reliability study |
| Prediction accuracy | R² > 0.45 for detection | Cross-validation on held-out data |
| Robustness | < 20% change under perturbation | Sensitivity analysis |
| Calibration | Expected = Observed rates | Calibration curve analysis |
| Fairness | No systematic bias by demographics | Subgroup analysis |

### 8.2 Reduced Model for Clinical Use

Given identifiability constraints, the clinical implementation should use the **8-parameter reduced model**:

```python
class ClinicalAPGIModel:
    """
    Reduced APGI model for clinical parameter estimation.

    Only estimates parameters with high recovery fidelity.
    """

    ESTIMABLE_PARAMS = [
        'S_t',           # Current surprise state
        'theta_t',       # Current threshold state
        'Pi_e_base',     # Baseline exteroceptive precision
        'beta_Pi_i',     # Somatic-weighted interoceptive precision (product)
        'alpha',         # Sigmoid steepness
        'tau',           # Decay constant (can be fixed at 200ms)
        'gamma',         # Recovery rate
        'delta',         # Refractoriness
        'sigma',         # Noise level
        'kappa_composite' # Composite neuromodulator index
    ]

    FIXED_PARAMS = {
        'tau': 0.2,      # Fixed based on literature
        'kappa': 0.2     # Normalization constant
    }

    def __init__(self):
        # Initialize only estimable parameters
        self.params = {p: None for p in self.ESTIMABLE_PARAMS}
```

### 8.3 Multimodal Proxy Requirements

For estimating composite neuromodulator index:

| Proxy | Neuromodulator | Measurement |
|-------|---------------|-------------|
| Pupil diameter | NE (LC activity) | Pupillometry (> 60Hz) |
| Task volatility | ACh | Task structure analysis |
| Reward history | DA | Behavioral modeling |
| Anxiety questionnaire | 5-HT | Self-report (e.g., STAI) |

```python
def estimate_kappa_composite(pupil_diameter: float,
                              task_volatility: float,
                              reward_history: float,
                              anxiety_score: float) -> float:
    """
    Estimate composite neuromodulator index from proxies.

    κ_composite = Σᵢ κᵢ · proxy_i
    """
    # Normalize proxies to 0-1
    ne_proxy = normalize(pupil_diameter, method='zscore')
    ach_proxy = normalize(task_volatility, method='minmax')
    da_proxy = normalize(reward_history, method='minmax')
    sht_proxy = normalize(anxiety_score, method='minmax')

    # Compute composite
    kappa_composite = (
        0.30 * ne_proxy +   # NE lowers threshold
        0.15 * ach_proxy +  # ACh lowers threshold
        -0.425 * sht_proxy + # 5-HT raises threshold
        -0.20 * da_proxy    # DA raises threshold
    )

    return kappa_composite
```

### 8.4 Validation for Specific Applications

#### 8.4.1 Consciousness Assessment (DoC Patients)

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Sensitivity | > 85% for MCS detection | Avoid misdiagnosis of VS/UWS |
| Specificity | > 75% | Reduce false positives |
| Test-retest | ICC > 0.70 | Account for state fluctuations |
| Behavioral correlation | r > 0.50 with CRS-R | External validity |

#### 8.4.2 Interoceptive Awareness Assessment

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Heartbeat detection correlation | r > 0.40 | Validate interoceptive channel |
| Π_i recovery | r > 0.50 | Estimability of interoceptive precision |
| Alexithymia prediction | AUC > 0.65 | Clinical utility |

#### 8.4.3 Anxiety/Depression Screening

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Threshold elevation (depression) | Cohen's d > 0.5 | Detectable group difference |
| False alarm increase (anxiety) | Cohen's d > 0.5 | Detectable group difference |
| Treatment response tracking | ICC > 0.60 | Sensitive to change |

---

## 9. Validation Protocols and Benchmarks

### 9.1 Comprehensive Validation Pipeline

```python
def run_full_validation_pipeline(model, empirical_data: dict) -> dict:
    """
    Execute complete validation protocol.

    Returns comprehensive validation report.
    """
    results = {}

    # Stage 1: Emergent behavior tests
    results['emergent'] = {
        'threshold_sharpness': validate_threshold_sharpness(model),
        'attentional_blink': validate_attentional_blink(model),
        'urgency_effect': validate_urgency_effect(model),
        'neuromodulator_effects': validate_neuromodulator_effects(model)
    }

    # Stage 2: Behavioral fit
    results['behavioral'] = {
        'psychometric_fit': fit_psychometric_function(
            empirical_data['epsilons'],
            model_predictions['detection_rates']
        ),
        'rt_distribution': compare_rt_distributions(
            empirical_data['rts'],
            model_predictions['rts']
        ),
        'confidence_calibration': validate_confidence(
            empirical_data['confidence'],
            model_predictions['confidence']
        )
    }

    # Stage 3: Neural comparison
    results['neural'] = {
        'eeg_correlation': compare_to_eeg(
            simulated_eeg=generate_simulated_eeg(model.history),
            empirical_eeg=empirical_data['eeg']
        ),
        'fmri_correlation': compare_to_fmri(
            simulated_bold=generate_simulated_bold(model.history),
            empirical_bold=empirical_data['fmri']
        )
    }

    # Stage 4: Parameter recovery
    results['recovery'] = parameter_recovery_simulation(n_subjects=500)

    # Stage 5: Clinical readiness
    results['clinical'] = {
        'test_retest_reliability': compute_test_retest(model, empirical_data),
        'cross_validation_accuracy': cross_validate_predictions(model, empirical_data),
        'calibration_curve': compute_calibration(model, empirical_data)
    }

    return results
```

### 9.2 Benchmark Targets

#### 9.2.1 Pass/Fail Criteria

| Stage | Metric | Pass Threshold | Fail Threshold |
|-------|--------|---------------|----------------|
| Emergent | All 4 behaviors present | 4/4 | < 3/4 |
| Behavioral | Psychometric R² | > 0.45 | < 0.30 |
| Behavioral | RT correlation | > 0.50 | < 0.30 |
| Neural | EEG correlation | > 0.30 | < 0.15 |
| Recovery | Mean r (Tier 1 params) | > 0.80 | < 0.60 |
| Clinical | ICC (test-retest) | > 0.65 | < 0.50 |

#### 9.2.2 Falsification Criteria

The model should be **rejected** if:

1. Parameter recovery correlations fall below r = 0.60 for ANY core parameter
2. Test-retest reliability falls below ICC = 0.65 over one-week interval
3. Cross-validated prediction accuracy for detection probability falls below R² = 0.45
4. Ignition dynamics fail to show characteristic properties:
   - No attentional blink (refractory period < 100ms or > 800ms)
   - No threshold modulation by neuromodulators
   - Gradual (not sharp) transition (slope < 2.0)

### 9.3 Reporting Standards

All validation studies must report:

```markdown
## Validation Report Template

### 1. Dataset Description
- Sample size (subjects, trials)
- Demographics
- Task paradigm
- Neural recording specifications

### 2. Model Configuration
- Parameter values (or priors for Bayesian)
- Fixed vs. estimated parameters
- Fitting procedure

### 3. Results Summary

| Metric | Value | 95% CI | Benchmark | Pass/Fail |
|--------|-------|--------|-----------|-----------|
| ... | ... | ... | ... | ... |

### 4. Limitations
- Generalizability concerns
- Missing data handling
- Potential confounds

### 5. Reproducibility
- Code repository
- Data availability
- Random seeds
```

---

## 10. Implementation Roadmap

### 10.1 Phase 1: Core Validation (Months 1-3)

**Objective**: Validate basic model against canonical paradigms

| Task | Status | Priority |
|------|--------|----------|
| Implement hierarchical agent architecture | Not started | High |
| Validate threshold sharpness | Not started | High |
| Validate attentional blink | Not started | High |
| Compare to masking paradigm data | Not started | High |
| Parameter recovery (Tier 1) | Not started | High |

**Deliverables**:
- Hierarchical agent module (`apgi/agents/hierarchical.py`)
- Validation test suite (`apgi/validation/`)
- Technical report on Phase 1 results

### 10.2 Phase 2: Multi-Modal Extension (Months 4-6)

**Objective**: Implement and validate dual-channel processing

| Task | Status | Priority |
|------|--------|----------|
| Separate extero/intero hierarchies | Not started | High |
| Implement precision estimation | Not started | High |
| Cross-modal integration mechanisms | Not started | Medium |
| Validate against interoception data | Not started | High |
| Somatic bias (β) recovery | Not started | Medium |

**Deliverables**:
- Dual-channel module (`apgi/channels/`)
- Interoceptive validation dataset
- Technical report on Phase 2 results

### 10.3 Phase 3: Neural Validation (Months 7-9)

**Objective**: Compare model outputs to neural recordings

| Task | Status | Priority |
|------|--------|----------|
| EEG signature generation | Not started | High |
| fMRI BOLD prediction | Not started | Medium |
| Comparison to published datasets | Not started | High |
| Temporal dynamics validation | Not started | High |

**Deliverables**:
- Neural output module (`apgi/neural/`)
- Comparison scripts for standard datasets
- Technical report on Phase 3 results

### 10.4 Phase 4: Clinical Preparation (Months 10-12)

**Objective**: Achieve clinical implementation readiness

| Task | Status | Priority |
|------|--------|----------|
| Reduced model implementation | Not started | High |
| Test-retest reliability study | Not started | Critical |
| Cross-validation on clinical samples | Not started | High |
| Multimodal proxy integration | Not started | Medium |
| Safety and fairness audit | Not started | Critical |

**Deliverables**:
- Clinical model module (`apgi/clinical/`)
- Validation report meeting regulatory standards
- User documentation for clinical deployment

---

## Appendix A: Code Templates

### A.1 Hierarchical Agent Template

```python
# apgi/agents/hierarchical.py

from typing import List, Tuple, Dict
import numpy as np
from ..core.model import APGIModel

class APGILevel:
    """Single level in hierarchical inference."""

    def __init__(self, level_id: str, state_dim: int = 32):
        self.level_id = level_id
        self.state_dim = state_dim
        self.mu = np.zeros(state_dim)
        self.precision = np.ones(state_dim)

    def compute_prediction_error(self, observation: np.ndarray) -> Tuple[np.ndarray, float]:
        prediction = self.mu
        error = observation - prediction
        weighted_error = self.precision * error
        magnitude = np.sqrt(np.sum(weighted_error ** 2))
        return weighted_error, magnitude

    def update(self, bottom_up_error: np.ndarray, top_down_prediction: np.ndarray, lr: float = 0.1):
        self.mu += lr * (bottom_up_error - self.precision * (self.mu - top_down_prediction))


class HierarchicalAPGIAgent:
    """Multi-level active inference agent."""

    def __init__(self,
                 n_extero_levels: int = 4,
                 n_intero_levels: int = 3,
                 state_dim: int = 32,
                 fusion_level: int = 2):

        self.extero_levels = [APGILevel(f"extero_L{i}", state_dim) for i in range(n_extero_levels)]
        self.intero_levels = [APGILevel(f"intero_L{i}", state_dim) for i in range(n_intero_levels)]
        self.fusion_level = fusion_level

        # Core APGI model for ignition
        self.ignition_model = APGIModel()

    def process(self, extero_input: np.ndarray, intero_input: np.ndarray) -> Dict:
        """
        Process multi-modal input through hierarchies.
        """
        # Bottom-up: compute prediction errors at each level
        extero_errors = self._propagate_bottom_up(self.extero_levels, extero_input)
        intero_errors = self._propagate_bottom_up(self.intero_levels, intero_input)

        # Integrate at fusion level
        if self.fusion_level < len(extero_errors):
            Pi_e = np.mean(self.extero_levels[self.fusion_level].precision)
            epsilon_e = extero_errors[self.fusion_level]
        else:
            Pi_e, epsilon_e = 1.0, extero_errors[-1]

        if self.fusion_level < len(intero_errors):
            Pi_i = np.mean(self.intero_levels[self.fusion_level].precision)
            epsilon_i = intero_errors[self.fusion_level]
        else:
            Pi_i, epsilon_i = 0.5, intero_errors[-1]

        # Step ignition model
        S, theta, B = self.ignition_model.step(Pi_e, epsilon_e, Pi_i, epsilon_i)

        return {
            'S': S,
            'theta': theta,
            'B': B,
            'extero_errors': extero_errors,
            'intero_errors': intero_errors
        }

    def _propagate_bottom_up(self, levels: List[APGILevel], input_signal: np.ndarray) -> List[float]:
        errors = []
        current_signal = input_signal

        for level in levels:
            error, magnitude = level.compute_prediction_error(current_signal)
            errors.append(magnitude)
            current_signal = level.mu  # Use level state as input to next

        return errors
```

### A.2 Validation Test Template

```python
# apgi/validation/test_emergent.py

import numpy as np
from scipy.stats import pearsonr
from ..simulation.runner import APGISimulation

def test_threshold_sharpness(n_trials: int = 100) -> dict:
    """Test that ignition shows sharp threshold transition."""
    sim = APGISimulation()
    epsilons = np.linspace(0.5, 3.0, 20)
    detection_rates = []

    for eps in epsilons:
        detections = 0
        for _ in range(n_trials):
            history = sim.run_trial(epsilon_e=eps)
            if np.any(history['ignitions']):
                detections += 1
        detection_rates.append(detections / n_trials)

    # Fit sigmoid
    from scipy.optimize import curve_fit
    sigmoid = lambda x, a, b, c, d: c + (d - c) / (1 + np.exp(-a * (x - b)))
    popt, _ = curve_fit(sigmoid, epsilons, detection_rates, p0=[5, 1.5, 0, 1], maxfev=5000)

    slope_at_midpoint = popt[0] * (popt[3] - popt[2]) / 4

    return {
        'epsilons': epsilons,
        'detection_rates': detection_rates,
        'sigmoid_params': popt,
        'slope_at_midpoint': slope_at_midpoint,
        'passed': slope_at_midpoint > 2.0
    }


def test_attentional_blink(n_trials: int = 50) -> dict:
    """Test post-ignition refractoriness."""
    sim = APGISimulation()
    soas = np.linspace(0.1, 1.0, 10)
    t2_detection = []

    for soa in soas:
        detections = []
        for _ in range(n_trials):
            history = sim.run_dual_task(t1_onset=0.5, t2_onset=0.5 + soa, epsilon_e=2.0)

            # Check T1 ignition (before T2 onset)
            t1_window = int((0.5 + 0.1) / sim.model.dt)
            t1_ignited = np.any(history['ignitions'][:t1_window])

            # Check T2 ignition (after T2 onset)
            t2_start = int((0.5 + soa) / sim.model.dt)
            t2_ignited = np.any(history['ignitions'][t2_start:])

            if t1_ignited:
                detections.append(float(t2_ignited))

        t2_detection.append(np.mean(detections) if detections else np.nan)

    # Find minimum (blink)
    valid_idx = ~np.isnan(t2_detection)
    if np.any(valid_idx):
        min_idx = np.nanargmin(t2_detection)
        blink_soa = soas[min_idx]
        blink_depth = 1 - t2_detection[min_idx]
    else:
        blink_soa, blink_depth = np.nan, np.nan

    return {
        'soas': soas,
        't2_detection': t2_detection,
        'blink_soa': blink_soa,
        'blink_depth': blink_depth,
        'passed': 0.15 < blink_soa < 0.45 and blink_depth > 0.2
    }
```

---

## Appendix B: Empirical Data Sources

### B.1 Recommended Datasets

| Dataset | Type | Paradigm | Access |
|---------|------|----------|--------|
| OpenNeuro ds000117 | fMRI | Visual awareness | Open |
| BNCI Horizon 2020 | EEG | P300 BCI | Open |
| HCP | fMRI + behavior | Multiple | Restricted |
| MOUS | MEG + EEG | Language | Open |
| Interoception Database | Behavior | Heartbeat detection | Request |

### B.2 Minimum Data Requirements

For validation:
- **Behavioral**: N ≥ 30 subjects, ≥ 100 trials/subject
- **EEG**: 64+ channels, 500Hz+, artifact-cleaned
- **fMRI**: Whole-brain, TR ≤ 2s, ≥ 200 volumes/run
- **Interoception**: Heartbeat detection + confidence ratings

---

## Appendix C: Statistical Methods

### C.1 Model Comparison

Use information criteria for model selection:

```python
def compute_model_comparison_metrics(model_fits: List[dict]) -> dict:
    """
    Compare models using information criteria.
    """
    results = []

    for fit in model_fits:
        n = fit['n_observations']
        k = fit['n_parameters']
        ll = fit['log_likelihood']

        aic = 2 * k - 2 * ll
        bic = k * np.log(n) - 2 * ll

        results.append({
            'model': fit['name'],
            'AIC': aic,
            'BIC': bic,
            'log_likelihood': ll
        })

    # Compute weights
    aics = np.array([r['AIC'] for r in results])
    delta_aic = aics - aics.min()
    aic_weights = np.exp(-0.5 * delta_aic) / np.sum(np.exp(-0.5 * delta_aic))

    for i, w in enumerate(aic_weights):
        results[i]['AIC_weight'] = w

    return results
```

### C.2 Reliability Metrics

```python
def compute_icc(measurements: np.ndarray) -> float:
    """
    Compute Intraclass Correlation Coefficient (ICC 2,1).

    measurements: array of shape (n_subjects, n_sessions)
    """
    n_subjects, n_sessions = measurements.shape

    # Between-subjects variance
    subject_means = measurements.mean(axis=1)
    grand_mean = measurements.mean()
    msb = n_sessions * np.var(subject_means, ddof=1)

    # Within-subjects variance
    msw = np.mean([np.var(measurements[i, :], ddof=1) for i in range(n_subjects)])

    # ICC(2,1)
    icc = (msb - msw) / (msb + (n_sessions - 1) * msw)

    return icc
```

---

## References

1. Dehaene, S., & Changeux, J. P. (2011). Experimental and theoretical approaches to conscious processing. *Neuron*, 70(2), 200-227.

2. Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127-138.

3. Garfinkel, S. N., Seth, A. K., Barrett, A. B., Suzuki, K., & Critchley, H. D. (2015). Knowing your own heart: Distinguishing interoceptive accuracy from interoceptive awareness. *Biological Psychology*, 104, 65-74.

4. Palmer, J., Huk, A. C., & Shadlen, M. N. (2005). The effect of stimulus strength on the speed and accuracy of a perceptual decision. *Journal of Vision*, 5(5), 376-404.

5. Pashler, H. (1994). Dual-task interference in simple tasks: Data and theory. *Psychological Bulletin*, 116(2), 220-244.

6. Seth, A. K., & Friston, K. J. (2016). Active interoceptive inference and the emotional brain. *Philosophical Transactions of the Royal Society B*, 371(1708), 20160007.

7. Carhart-Harris, R. L., & Friston, K. J. (2019). REBUS and the anarchic brain: Toward a unified model of the brain action of psychedelics. *Pharmacological Reviews*, 71(3), 316-344.

---

**Document Status**: Initial Version
**Review Required**: Scientific Advisory Board
**Next Update**: After Phase 1 completion

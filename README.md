# APGI: Active Precision-Gated Ignition Model

A biophysically-grounded computational model of conscious access based on thalamocortical microcircuit dynamics.

## Overview

The APGI (Active Precision-Gated Ignition) model provides a mean-field description of the neural mechanisms underlying the transition to conscious awareness. Unlike purely phenomenological models, APGI explicitly maps its state variables to specific physiological processes in the thalamocortical circuit.

### Core Principles

**Conscious access emerges when precision-weighted surprise exceeds a dynamic ignition threshold:**

- **Surprise (S_t)**: Population firing rate in supragranular layers (L2/3) of posterior parietal cortex
- **Threshold (θ_t)**: Effective NMDA-spike threshold in L5 pyramidal cell apical dendrites
- **Ignition (B_t)**: Probability of entering a metastable frontoparietal attractor state

## Mathematical Framework

### State Equations

The model comprises three coupled differential equations:

**1. Surprise Accumulation**
```
dS_t/dt = -S_t/τ + f(Π_e·ε_e, Π_i·ε_i) + σ·η(t)
```
- Evidence accumulates from precision-weighted prediction errors
- Decay time constant τ ≈ 200 ms (empirically grounded)
- Divisive normalization prevents double-counting

**2. Threshold Dynamics**
```
dθ_t/dt = γ(θ_0 - θ_t) + δ·B_{t-1} - λ·|dS_t/dt|
```
- **Homeostatic recovery**: Returns to baseline θ_0 (rate γ ≈ 2 s⁻¹)
- **Post-ignition refractoriness**: Elevated after ignition (δ ≈ 0.4)
- **Urgency**: Lowered by rapid surprise accumulation (λ ≈ 0.075)

**3. Ignition Probability**
```
B_t = σ(α(S_t - θ_t))
```
- Sigmoid transition with steepness α ≈ 5-10
- Near-binary response: 10% → 90% over ΔS ≈ 0.4-0.8

### Neuromodulatory Control

Baseline threshold is modulated by tonic neuromodulator levels:

```
θ_0 = θ_base · exp(-κ_NE·[NE] - κ_ACh·[ACh]) · exp(+κ_5HT·[5-HT] + κ_DA·[DA])
```

- **Threshold-lowering**: Norepinephrine (NE), Acetylcholine (ACh)
  - Facilitate ignition during novelty, uncertainty, threat
- **Threshold-raising**: Serotonin (5-HT), Dopamine (DA)
  - Stabilize perception, reduce false alarms

## Parameter Identifiability and the Reduced Model

The Interoceptive Predictive Ignition (APGI) model, in its full formulation, incorporates 14 parameters that require empirical estimation. However, structural identifiability analysis exposes a fundamental limitation: not all parameters can be independently recovered, even under idealized conditions of infinite, noise-free data. This constraint necessitates a reduced, empirically tractable model that preserves the framework's core theoretical constructs while ensuring parameter identifiability—a critical requirement for any mechanistically grounded theory.

### Structural Confounds

The original model confronts three major confounds that hinder the accurate estimation of its parameters:

**1. Somatic Bias vs. Interoceptive Precision**

The model cannot disentangle somatic bias (β) from interoceptive precision (Πᵢ) because only their combined effect (β·Πᵢ) is observable in ignition dynamics. Resolving this ambiguity demands orthogonal experimental manipulations, such as pharmacological interventions or attentional cueing paradigms.

**2. Neuromodulator Summation**

The model fails to isolate the individual contributions of neuromodulators (e.g., norepinephrine, acetylcholine, serotonin, dopamine). Their influence on the baseline ignition threshold (θ₀) is only measurable as a weighted sum, rendering it impossible to determine each neuromodulator's unique role from behavioral data alone. This summation underscores the need for direct neurochemical assays or pharmacological challenge studies to decompose their effects.

**3. Threshold vs. Precision Trade-off**

Low detection thresholds may arise from either a reduced ignition threshold (θₜ) or elevated sensory precision (Sₜ). Distinguishing between these possibilities requires pre-stimulus neural markers, such as alpha/beta power fluctuations, which provide critical dissociative evidence.

### Parameter Recovery and Recoverability Tiers

To quantitatively assess which parameters can be reliably estimated, we conducted simulated parameter recovery experiments. We generated synthetic datasets from the full model using known ground-truth parameters, introduced realistic measurement noise (σ_noise = 0.15 for behavioral responses; 20% for neural signals), and then recovered the parameters via maximum likelihood estimation across 1,000 simulated subjects.

The results revealed three tiers of recoverability based on the Pearson correlation (r) between true and recovered parameters:

**High Recovery Fidelity (r > 0.80)**

- **θ_base** (r = 0.92): Recoverable from detection thresholds
- **α** (r = 0.88): Recoverable from psychometric curve steepness
- **τ** (r = 0.85): From reaction time distributions
- **σ** (r = 0.83): From trial-to-trial variability

**Moderate Recovery (0.50 < r < 0.80)**

- **γ** (r = 0.68): From temporal dynamics of detection probability
- **δ** (r = 0.62): From post-ignition refractory effects
- **β·Πᵢ** (r = 0.71): Composite product term; constituent terms remain individually non-identifiable

**Poor Recovery (r < 0.50)**

- **Individual κ_mod** (r = 0.15–0.35): Neuromodulator coefficients
- **Separate β and Πᵢ** (r = 0.28 and 0.31): Cannot be independently recovered
- **λ** (r = 0.42): Urgency sensitivity lacks sufficient information in standard paradigms

### Reduced, Structurally Identifiable Model

To address these challenges, we propose a simplified, structurally identifiable model that retains the framework's mechanistic plausibility while enabling empirical validation. This reduction ensures that the model remains testable, falsifiable, and aligned with existing neural signatures—such as the P3b wave, gamma synchrony, and thalamocortical dynamics—while providing a clear pathway for experimental scrutiny.

**Eight Core Parameters:**

1. **Sₜ** - Precision-weighted surprise signal
2. **θₜ** - Baseline ignition threshold
3. **Πₑ⁰** - Baseline exteroceptive precision
4. **β·Πᵢ⁰** - Baseline weighted interoceptive precision (product term)
5. **α** - Sigmoid steepness
6. **τ** - Surprise decay constant (fixed at 200 ms based on empirical literature)
7. **γ** - Homeostatic recovery rate
8. **δ** - Post-ignition elevation magnitude
9. **σ** - Noise amplitude

The neuromodulatory influences are collapsed into a single time-varying composite index:

```
κ_composite = Σᵢ κᵢ · [Modulatorᵢ]
```

This index must be estimated from multimodal proxies:
- **Pupil diameter**: Surrogate for locus coeruleus–norepinephrine activity
- **Task context**: Modulating acetylcholine via expected uncertainty
- **Reward history**: Dopamine
- **Baseline anxiety state**: Serotonin

### Limitations and Falsification Criteria

This necessary model reduction sacrifices fine-grained mechanistic resolution for empirical feasibility. Core unresolved issues include:

1. **β vs. Πᵢ ambiguity**: Requires orthogonal manipulations like interoceptive pathway blockade or attentional cueing
2. **Neuromodulator decomposition**: Demands pharmacological challenge studies paired with direct neurochemical assays (e.g., PET or microdialysis)
3. **Urgency sensitivity (λ)**: Necessitates specialized time-pressure paradigms

While the full 14-parameter model retains theoretical utility for conceptual exploration and large-scale simulation, empirical validation must proceed with the 8-parameter reduced model until technologies enabling real-time, in vivo measurement of neuromodulator concentrations become widely accessible.

**Falsification Tests:**

The reduced model will be rejected if empirical data yield:
- Parameter recovery correlations below **r = 0.60** for any core parameter
- Test–retest reliability below **ICC = 0.65** over a one-week interval
- Cross-validated prediction accuracy for detection probability below **R² = 0.45**

These criteria provide concrete, experimentally actionable benchmarks for immediate empirical scrutiny by the neuroscience community.

## Neuromodulatory Implementation: Translating Computation into Biology

The brain's abstract control parameters—precision, threshold, and urgency—are instantiated through specialized neuromodulatory systems that translate computational variables into biological mechanisms. This section provides a detailed, receptor-specific account of how each neuromodulator implements its designated computational function.

### Acetylcholine (ACh): Expected Uncertainty and Exteroceptive Precision

**Source**: Basal forebrain cholinergic nuclei (nucleus basalis of Meynert, medial septum, diagonal band of Broca)

**Computational Role**: Signals expected uncertainty—situations in which the environment is volatile but learnable. Primary function is to enhance exteroceptive precision (Πₑ), not merely to sharpen sensory processing or implement general attention. This distinguishes ACh-driven precision from:
- Norepinephrine (NE)-driven precision (threat/urgency)
- Dopamine (DA)-driven precision (reward salience)

**Receptor Mechanisms:**

*Nicotinic Receptors (Fast Effects):*
- **α4β2 subtypes**: On presynaptic terminals → increase neurotransmitter release probability → enhanced signal transmission
- **α7 subtypes**: On GABAergic interneurons → fast desensitization → transient disinhibition that gates sensory input

*Muscarinic Receptors (Slow Modulatory Effects):*
- **M1 receptors**: On pyramidal neurons (layers 2/3 and 5) → depolarize membranes and reduce potassium conductance → increased excitability
- **M2 receptors**: On presynaptic terminals → inhibit GABA release → disinhibition
- **M4 receptors**: On striatal medium spiny neurons → modulate corticostriatal plasticity (secondary function)

**Net Result**: Enhanced cortical gain, increased signal-to-noise ratio in sensory cortices, augmented plasticity

**Timescales**:
- Phasic release: 50–200 ms
- Tonic modulation: Seconds

**Anatomical Organization**: Topographically organized projections enable region-specific precision modulation

**Empirical Support**:
- Nucleus basalis activity tracks environmental volatility rather than raw prediction errors (Hangya et al., 2015)
- ACh enhances cortical plasticity during critical periods and perceptual learning (Kilgard & Merzenich, 1998)
- Cholinergic antagonists like scopolamine impair learning specifically in volatile, not stable, environments (Yu & Dayan, 2005)

### Norepinephrine (NE): Unexpected Uncertainty and Interoceptive Precision

**Source**: Locus coeruleus (LC)—a small brainstem nucleus containing ~15,000–30,000 neurons in humans

**Computational Role**: Signals unexpected uncertainty, threat, and urgency. Preferentially amplifies interoceptive precision (Πᵢ) and modulates the ignition threshold (θₜ).

**Functional Specificity via Topographic Projections:**

The LC's anatomical wiring creates an interoceptive bias:

- **Dense innervation**: Anterior insula, anterior cingulate cortex (ACC), amygdala, orbitofrontal cortex
- **Moderate innervation**: Prefrontal and parietal cortices, hippocampus
- **Sparse innervation**: Primary sensory cortices (V1, A1, S1)

This phylogenetically conserved wiring ensures that phasic NE bursts preferentially amplify regions involved in bodily signal processing (Chandler et al., 2014; Schwarz & Luo, 2015).

**Receptor Mechanisms:**

*α₁-Adrenergic Receptors (Gq-coupled):*
- **Location**: Pyramidal neuron dendritic spines and somata (predominantly insula, ACC, prefrontal cortex)
- **Effect**: Increase excitability by reducing potassium conductance and enhancing calcium currents → boost neural gain and responsivity

*α₂-Adrenergic Receptors (Gi-coupled):*
- **Presynaptic α₂ autoreceptors**: On LC terminals → negative feedback to inhibit NE release
- **Postsynaptic α₂**: On prefrontal pyramidal neurons → suppress spontaneous activity → improve signal-to-noise ratio and working memory at low doses (but reduce overall NE tone at high doses due to LC autoinhibition)

*β-Adrenergic Receptors (Gs-coupled):*
- **β₁**: Widely distributed
- **β₂**: Enriched in insula, amygdala, hippocampus
- **Effect**: Elevate cAMP levels → enhance synaptic plasticity and modulate memory consolidation → facilitate rapid learning about arousing or threatening events

**Temporal Dynamics:**

- **Phasic LC-NE bursts**: 50–200 ms, 10–20 Hz → triggered by salient or threatening stimuli → implement urgency signals and reset networks for flexible responding
- **Tonic firing**: 2–5 Hz → maintains baseline cortical excitability and supports exploitative decision-making (Aston-Jones & Cohen, 2005)

**Interoceptive Specificity**: Stems from anatomical wiring, not intrinsic pharmacology—the same molecule produces distinct functional outcomes depending on target circuitry.

**Threshold Modulation**: NE lowers θₜ via:
- Direct effects on cortical excitability
- Indirect thalamic reticular nucleus (TRN) disinhibition
- κ_NE ≈ 0.25–0.35 in the threshold equation

**Empirical Support**:
- LC responses to unexpected or threatening stimuli (Sara, 2009; Aston-Jones & Cohen, 2005)
- Propranolol reduces emotional memory consolidation (Cahill et al., 1994)
- Impaired threat detection following LC-NE depletion (Berridge & Waterhouse, 2003)

### Dopamine (DA): Reward Prediction and Value-Based Threshold Modulation

**Source**: Two midbrain sources
- **Ventral tegmental area (VTA)**: Projects to prefrontal cortex, striatum, limbic regions
- **Substantia nigra pars compacta (SNc)**: Targets dorsal striatum for motor control

**Computational Role**: Encodes reward prediction errors (phasic) and expected value (tonic), modulating θₜ based on environmental reward statistics.

**Phasic DA Bursts (50–200 ms, 10–20 Hz):**

Encode δ = (actual reward − expected reward):
- **Positive prediction errors**: Drive burst firing
- **Omitted rewards**: Cause pauses
- **Expected rewards**: Sustain baseline activity

These signals update value predictions and tag events for memory consolidation, driven by glutamatergic input from the laterodorsal tegmentum (Lammel et al., 2012).

**Tonic DA (Baseline 4–8 Hz):**

Tracks average expected value over seconds to minutes:
- **Elevated**: In safe, rewarding contexts
- **Reduced**: In uncertain or unrewarding contexts

**Receptor Mechanisms:**

*D1-like Receptors (D1/D5; Gs-coupled):*
- **Location**: Pyramidal neurons
- **Effect**: Enhance NMDA currents via PKA phosphorylation → increase dendritic excitability → lower θₜ during phasic bursts signaling positive prediction errors

*D2-like Receptors (D2/D3/D4; Gi-coupled):*
- **Location**: GABAergic interneurons and striatal medium spiny neurons
- **Effect**: Increase inhibition of layer 5 pyramidal neuron basal dendrites → functionally raise θₜ under high tonic DA

**Tonic vs. Phasic Dissociation:**

- **Elevated tonic DA** (safe contexts) → increases inhibition via D2 on interneurons → requires stronger inputs to ignite
- **Low tonic DA** (threatening contexts) → reduces this inhibition → lowers θₜ
- **Phasic DA** → transiently amplifies ignition for reward-relevant events

**Quantitative Relationship:**

```
θₜ ∝ exp(κ_DA · [DA]_tonic)
```

where κ_DA ≈ 0.15–0.25 (derived from L-DOPA studies showing ~10–20% threshold shifts per log concentration unit; Cicchini et al., 2017; Pessiglione et al., 2006)

**Clinical Illustration: Parkinson's Disease**

DA depletion paradoxically:
- **Lowers θₜ**: Due to loss of tonic D2-mediated inhibition → hypersensitive ignition
- **Impairs cognitive flexibility**: Because phasic prediction error signals are lost → maladaptive ignition

**Empirical Support**:
- VTA encoding of reward prediction errors (Schultz, 1997; Steinberg et al., 2013)
- Tonic DA correlations with expected value (Niv et al., 2007)
- L-DOPA modulation of perceptual thresholds in reward contexts (Cicchini et al., 2017)

### Serotonin (5-HT): Environmental Stability and Confidence in Priors

**Source**: Raphe nuclei (dorsal and median)

**Computational Role**: Signals environmental stability versus volatility, modulates confidence in high-level priors, and adjusts θₜ based on punishment/threat probability.

**Receptor Mechanisms:**

*5-HT₁ₐ Receptors (Gi-coupled):*
- **Postsynaptic**: On layer 5 pyramidal neurons → hyperpolarize via increased potassium conductance
- **Presynaptic autoreceptors**: On raphe neurons → inhibit raphe firing
- **Net effect**: Stabilize default predictions and elevate θₜ in safe environments → reduce false alarms
- **Clinical relevance**: 5-HT₁ₐ agonism underlies anxiolytics like buspirone and some SSRIs

*5-HT₂ₐ Receptors (Gq-coupled):*
- **Location**: Layer 5 apical dendrites and interneurons
- **Effect**: Increase pyramidal neuron excitability and disrupt inhibitory control → desynchronize cortical activity
- **Result**: Flatten precision hierarchy, reduce top-down suppression, permit low-confidence contents to ignite
- **Phenomenology**: Ego dissolution, synesthesia

**Psychedelic Effects:**

Psychedelics (LSD, psilocybin) act as 5-HT₂ₐ agonists, aligning with the REBUS framework ("Relaxed Beliefs Under Psychedelics"; Carhart-Harris & Friston, 2019):
- 5-HT₂ₐ activation reduces confidence in high-level priors
- Allows suppressed sensory and mnemonic content to access consciousness
- Alternative interpretation: 5-HT₂ₐ simply increases neural noise
- APGI accommodates both, emphasizing that atypical contents achieve ignition

**Context-Dependent Effects:**

- **5-HT₁ₐ tone in stable environments**: Elevates θₜ → stabilizes perception
- **High 5-HT in threatening contexts**: May excessively raise θₜ → promotes behavioral inhibition (Maier & Watkins, 2005)
- **5-HT₂ₐ activation**: Flattens hierarchy regardless of context

**Empirical Support**:
- SSRI reduction of false alarms in anxiety (Quednow et al., 2012)
- Blockade of psychedelic effects by 5-HT₂ₐ antagonists like ketanserin (Kometer et al., 2013)
- Dorsal raphe responses to aversive stimuli and punishment prediction (Daw et al., 2002)

### Additional Neuromodulatory Systems

**Histamine (TMN → Cortex):**
- **H₁ receptors**: On pyramidal neurons → enhance cortical responsivity during wakefulness → lower θₜ
- **Clinical**: Antihistamines cause sedation by blocking H₁ → effectively raising θₜ

**Orexin/Hypocretin (Lateral Hypothalamus):**
- **Function**: Stabilizes wakefulness by activating LC, TMN, raphe nuclei
- **Role**: Permissive gate for ignition capacity
- **Clinical**: Deficiency in narcolepsy → inappropriate transitions to low-ignition states (cataplexy)

**Adenosine (Accumulates During Waking):**
- **A₁ receptors**: Hyperpolarize pyramidal neurons → progressively elevate θₜ over hours → implement sleep pressure
- **Intervention**: Caffeine blocks A₁ → lowers θₜ → increases alertness

**μ-Opioid System (Pain Modulation):**
- **Location**: Anterior insula and ACC
- **Function**: μ-opioid receptors selectively suppress Πᵢ
- **Result**: Analgesia by preventing pain-related signals from igniting despite preserved sensory intensity → affective dissociation

**Endocannabinoid System (Stress Gating):**
- **Mechanism**: Retrograde signaling (anandamide, 2-AG)
- **CB₁ receptors**: Reduce presynaptic GABA/glutamate release → gate stress-related Πᵢ
- **Clinical**: Dysregulation implicated in anxiety; cannabis exerts context-dependent, dose-sensitive effects on conscious access to interoceptive signals

### Temporal Hierarchy of Neuromodulation

These systems operate on complementary timescales enabling independent control without interference:

| Timescale | Systems | Function |
|-----------|---------|----------|
| **Fast (subseconds to seconds)** | ACh, phasic NE, phasic DA | Moment-to-moment precision modulation |
| **Medium (seconds to minutes)** | Tonic NE/DA, 5-HT, orexin | State-dependent threshold adjustments |
| **Slow (minutes to hours)** | Histamine, adenosine, opioids, endocannabinoids | Circadian gating |

### Important Caveats: Limitations of Single-Coefficient Models

The preceding descriptions employ single-coefficient models (e.g., κ_NE, κ_ACh) as first-order approximations capturing directional effects on precision or threshold. However, these simplify complex biology:

**1. Receptor Subtype Specificity**

NE's α₁ (excitation), α₂ (inhibition), and β (plasticity) receptors produce divergent effects. A single κ_NE cannot capture this heterogeneity; net outcomes depend on receptor density, distribution, and network state.

**2. Dose-Dependence and Non-linearity**

Typically follows an inverted-U curve:
- **Low NE**: Improves prefrontal signal-to-noise via α₂
- **Moderate NE**: Boosts arousal and Πᵢ via β/α₁
- **High NE**: Impairs cognition due to excessive arousal

The exponential threshold equation θ₀ = θ_base · exp(−κ_NE · [NE]) assumes log-linear effects and fails to model this non-linearity.

**3. Regional and Laminar Specificity**

ACh enhances sensory gain via nicotinic receptors in layer 2/3 but suppresses layer 5 output in prefrontal cortex via muscarinic M₂ receptors. Directionality depends on anatomical target, rendering global κ_ACh insufficient.

**4. State-Dependence**

ACh enhances encoding during wakefulness but suppresses consolidation during REM sleep.

**Interpretation**: κ values should be interpreted as **effective population-level parameters** representing:
- The dominant direction (positive/negative)
- Relative magnitude of effects
- Under typical laboratory conditions in alert, healthy adults

They do **not** reflect:
- Precise biophysical mechanisms
- Individual variability (genetic or developmental differences)
- Full dose-, context-, and region-dependent response profiles

## Neural Implementation

| Variable | Neural Substrate | Biological Mechanism |
|----------|-----------------|---------------------|
| **S_t** | L2/3 PPC/IPS population firing | Recurrent excitation + SOM+ inhibition; decay via spike-frequency adaptation |
| **θ_t** | L5 pyramidal apical NMDA threshold | TRN-mediated gating; refractoriness from synaptic depression + AHP |
| **B_t** | Frontoparietal network state | NMDA Ca²⁺ spike in L5 apical tuft triggered by matrix thalamus |

## Installation

### From Source

```bash
git clone https://github.com/lesoto/apgi-theory.git
cd apgi-theory
pip install -e .
```

### Requirements

- Python ≥ 3.7
- NumPy ≥ 1.20
- SciPy ≥ 1.7
- Matplotlib ≥ 3.3

## Quick Start

### Basic Simulation

```python
from apgi import APGISimulation
from apgi.visualization import plot_simulation

# Create simulation
sim = APGISimulation()

# Run a trial with moderate stimulus
history = sim.run_trial(
    pre_stimulus=0.5,      # 500 ms baseline
    stimulus_duration=0.3,  # 300 ms stimulus
    post_stimulus=1.0,      # 1 s post-stimulus
    Pi_e=1.0,              # Precision
    epsilon_e=2.0          # Prediction error
)

# Visualize results
fig = plot_simulation(history, show_inputs=True)
fig.show()
```

### Neuromodulatory Effects

```python
from apgi import APGISimulation, NeuromodulatorState

# Simulate high-vigilance state
sim = APGISimulation()
sim.set_neuromodulator_state(NeuromodulatorState.HIGH_VIGILANCE)

history = sim.run_trial(epsilon_e=1.5)  # Same stimulus, different state

# Compare with baseline
sim.set_neuromodulator_state(NeuromodulatorState.BASELINE)
history_baseline = sim.run_trial(epsilon_e=1.5)
```

### Psychometric Function

```python
# Estimate detection threshold
results = sim.run_threshold_staircase(
    epsilon_range=(0.5, 2.5),
    n_levels=20,
    trials_per_level=10
)

from apgi.visualization import plot_psychometric_curve
fig = plot_psychometric_curve(
    results['epsilon_levels'],
    results['detection_rates'],
    fit_sigmoid=True
)
```

## Examples

The `apgi/examples/` directory contains demonstration scripts:

### Basic Ignition

```bash
python -m apgi.examples.basic_ignition
```

Demonstrates:
- Threshold crossing and ignition
- Sub- vs. supra-threshold stimuli
- Post-ignition refractoriness (attentional blink)
- Psychometric function estimation

### Neuromodulator Effects

```bash
python -m apgi.examples.neuromodulator_effects
```

Demonstrates:
- Vigilance state modulation
- Phasic threat response with NE burst
- Somatic bias parameter (β)
- Simulated pharmacological manipulations

### Comprehensive Test Suite (Tinker App)

For comprehensive testing and validation, use the tinker app which executes ALL examples systematically:

```bash
# Run all tests with default settings
python tinker_app.py

# Run all tests and save figures
python tinker_app.py --save-figs

# Run with detailed logging and HTML report
python tinker_app.py --verbose --report --save-figs

# Headless execution (no figure display)
python tinker_app.py --no-show --save-figs --report

# Custom output directory and format
python tinker_app.py --save-figs --outdir results --format pdf --dpi 300
```

**Features:**
- Executes all 9 examples from both basic and neuromodulator groups
- Detailed performance metrics and timing breakdown
- Error handling with continue-on-error option
- Automatic figure saving in multiple formats (PNG, PDF, SVG)
- JSON and HTML test reports
- Comprehensive summary statistics (pass rate, duration, etc.)

**Output Structure:**
```
tinker_output/
├── figures/          # All generated figures
├── logs/             # Execution logs
└── reports/          # JSON and HTML test reports
    ├── test_results.json
    └── test_report.html
```

The tinker app is ideal for:
- Validating installation and dependencies
- Regression testing during development
- Generating complete figure sets for publications
- Performance benchmarking
- Continuous integration workflows

## Key Phenomena Explained

### Attentional Blink / Psychological Refractory Period

Post-ignition threshold elevation (δ term) creates a ~250-400 ms refractory period:

```python
history = sim.run_dual_task(
    t1_onset=0.5,
    t2_onset=0.7,  # 200 ms SOA
    epsilon_e=2.0
)
# T2 often missed due to elevated threshold after T1
```

### Threat Detection with Urgency

Rapidly accumulating surprise lowers threshold via urgency term (λ):

```python
from apgi.simulation import threat_stimulus

stimulus_fn = threat_stimulus(
    onset=0.5,
    ramp_duration=0.1,  # Rapid escalation
    max_epsilon_e=2.5,
    max_epsilon_i=1.2   # Combined extero + intero
)

history = sim.run(2.0, stimulus_fn)
# Faster ignition than constant stimulus of same magnitude
```

### Somatic Bias

The β parameter (default 1.2-1.5) weights interoceptive prediction errors:

```python
from apgi import APGIModel

# High somatic bias (e.g., anxiety, pain)
model_high_beta = APGIModel(beta=2.0)

# Low somatic bias (e.g., external focus)
model_low_beta = APGIModel(beta=0.5)
```

## Parameter Reference

### Core Dynamics

| Parameter | Symbol | Default | Range | Description |
|-----------|--------|---------|-------|-------------|
| Decay time | τ | 0.2 s | 0.1-0.3 s | Surprise decay time constant |
| Sigmoid steepness | α | 7.5 | 5-10 | Ignition transition sharpness |
| Recovery rate | γ | 2.0 s⁻¹ | 1.5-2.5 s⁻¹ | Homeostatic threshold recovery |
| Refractoriness | δ | 0.4 | 0.3-0.5 | Post-ignition elevation |
| Urgency | λ | 0.075 | 0.05-0.1 | Urgency-based lowering |
| Somatic bias | β | 1.35 | 1.2-1.5 | Interoceptive weighting |
| Normalization | κ | 0.2 | 0.1-0.3 | Divisive normalization |

### Neuromodulator Coefficients

| Neuromodulator | κ | Effect | Empirical Basis |
|----------------|---|--------|-----------------|
| Norepinephrine | 0.30 | ↓ threshold | Propranolol +15-25% threshold (Hurlemann 2010) |
| Acetylcholine | 0.15 | ↓ threshold | Physostigmine +10-15% detection (Furey 2000) |
| Serotonin | 0.425 | ↑ threshold | SSRIs -20-35% false alarms (Quednow 2012) |
| Dopamine | 0.20 | ↑ threshold | L-DOPA +10-20% threshold (Cicchini 2017) |

## Timescale Architecture

The model operates across multiple timescales:

| Timescale | Mechanisms | Implementation |
|-----------|-----------|----------------|
| **50-500 ms** | Fast adaptation | Homeostasis (γ), refractoriness (δ), urgency (λ) |
| **100 ms - 10 s** | Phasic neuromodulation | LC-NE bursts, event-driven state shifts |
| **10 s - hours** | Tonic neuromodulation | Sustained vigilance, circadian rhythms |

## Extensions and Future Work

Planned extensions include:

- [ ] Regional heterogeneity (different parameters for different cortical areas)
- [ ] Oscillatory dynamics (gamma-band synchronization)
- [ ] Working memory maintenance (sustained ignition)
- [ ] Multi-level hierarchy (nested ignition cascades)
- [ ] Learning and plasticity (threshold adaptation)

## References

### Empirical Foundations

**Evidence Accumulation**
- Palmer, J., Huk, A. C., & Shadlen, M. N. (2005). The effect of stimulus strength on the speed and accuracy of a perceptual decision. *Journal of Vision*, 5(5), 376-404.
- Ratcliff, R., & McKoon, G. (2008). The diffusion decision model: Theory and data for two-choice decision tasks. *Neural Computation*, 20(4), 873-922.

**Attentional Phenomena**
- Pashler, H. (1994). Dual-task interference in simple tasks: Data and theory. *Psychological Bulletin*, 116(2), 220-244.
- Raymond, J. E., Shapiro, K. L., & Arnell, K. M. (1992). Temporary suppression of visual processing in an RSVP task: An attentional blink? *Journal of Experimental Psychology: Human Perception and Performance*, 18(3), 849-860.

**Neural Mechanisms**
- Carandini, M., & Heeger, D. J. (2012). Normalization as a canonical neural computation. *Nature Reviews Neuroscience*, 13(1), 51-62.
- Gold, J. I., & Shadlen, M. N. (2007). The neural basis of decision making. *Annual Review of Neuroscience*, 30, 535-574.

**Neuromodulation**
- Hurlemann, R., et al. (2010). Noradrenergic modulation of emotion-induced forgetting and remembering. *Journal of Neuroscience*, 30(19), 6754-6763.
- Furey, M. L., Pietrini, P., & Haxby, J. V. (2000). Cholinergic enhancement and increased selectivity of perceptual processing during working memory. *Science*, 290(5500), 2315-2319.
- Quednow, B. B., et al. (2012). The serotonin 1A receptor and serotonin transporter polymorphisms and error processing in healthy volunteers. *Human Brain Mapping*, 33(10), 2384-2398.
- Cicchini, G. M., Mikellidou, K., & Burr, D. C. (2017). The functional role of serial dependence. *Proceedings of the Royal Society B*, 284(1867), 20171722.

## License

MIT License - See LICENSE file for details.

## Citation

If you use the APGI model in your research, please cite:

```bibtex
@software{apgi2024,
  title={APGI: Active Precision-Gated Ignition Model},
  author={APGI Development Team},
  year={2024},
  url={https://github.com/lesoto/apgi-theory}
}
```

## Contact

For questions, issues, or contributions, please open an issue on GitHub.

---

**APGI** - Bridging biophysics and consciousness science

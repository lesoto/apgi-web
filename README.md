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

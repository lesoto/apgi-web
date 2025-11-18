"""
APGI: Active Precision-Gated Ignition Model

A biophysically-grounded computational model of conscious access based on
thalamocortical microcircuit dynamics.

The APGI model formalizes the transition to conscious awareness through a
precision-gated threshold mechanism, where:

- Surprise (S_t): Population firing rate in L2/3 PPC/IPS evidence accumulators
- Threshold (θ_t): Effective NMDA-spike threshold in L5 pyramidal apical dendrites
- Ignition (B_t): Probability of metastable frontoparietal attractor state

Core Equations:
    dS/dt = -S/τ + f(Πₑ·εₑ, Πᵢ·εᵢ) + σ·η
    dθ/dt = γ(θ₀ - θ) + δ·B_{t-1} - λ·|dS/dt|
    B = σ(α(S - θ))

Modules:
    core: Mathematical model, parameters, and neuromodulator dynamics
    simulation: High-level simulation runners and stimulus generators
    visualization: Plotting and visualization tools
    examples: Demonstration scripts

Basic Usage:
    >>> from apgi import APGIModel, APGISimulation
    >>> sim = APGISimulation()
    >>> history = sim.run_trial(epsilon_e=2.0)
    >>> from apgi.visualization import plot_simulation
    >>> fig = plot_simulation(history)

References:
    Palmer et al. (2005) - Evidence accumulation
    Pashler (1994) - Psychological refractory period
    Raymond et al. (1992) - Attentional blink
    Carandini & Heeger (2012) - Divisive normalization
    Gold & Shadlen (2007) - Decision making dynamics
"""

__version__ = '0.1.0'
__author__ = 'APGI Development Team'

# Core imports
from .core import (
    APGIModel,
    APGIParameters,
    NeuromodulatorProfile,
    NeuromodulatorState,
    STANDARD_PARAMS,
    HIGH_VIGILANCE_PARAMS,
    LOW_AROUSAL_PARAMS,
    THREAT_DETECTION_PARAMS,
)

# Simulation imports
from .simulation import (
    APGISimulation,
    pulse_stimulus,
    ramp_stimulus,
    threat_stimulus,
    dual_task_stimulus,
    interoceptive_stimulus,
)

# Visualization imports
from .visualization import (
    plot_simulation,
    plot_threshold_dynamics,
    plot_psychometric_curve,
    plot_dual_task,
    plot_neuromodulator_effects,
)

__all__ = [
    # Core
    'APGIModel',
    'APGIParameters',
    'NeuromodulatorProfile',
    'NeuromodulatorState',
    'STANDARD_PARAMS',
    'HIGH_VIGILANCE_PARAMS',
    'LOW_AROUSAL_PARAMS',
    'THREAT_DETECTION_PARAMS',
    # Simulation
    'APGISimulation',
    'pulse_stimulus',
    'ramp_stimulus',
    'threat_stimulus',
    'dual_task_stimulus',
    'interoceptive_stimulus',
    # Visualization
    'plot_simulation',
    'plot_threshold_dynamics',
    'plot_psychometric_curve',
    'plot_dual_task',
    'plot_neuromodulator_effects',
]

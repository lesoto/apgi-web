"""
APGI Model Parameters and Constants

Biophysically-constrained parameter values derived from empirical studies.
"""

from dataclasses import dataclass
from typing import Dict


@dataclass
class APGIParameters:
    """Standard parameter set for APGI model"""

    # === Temporal Dynamics ===
    tau: float = 0.2  # Surprise decay time constant (200 ms)
    # Empirical basis: Palmer et al. (2005), Ratcliff & McKoon (2008)
    # Evidence accumulation time constants: 100-300 ms

    dt: float = 0.001  # Integration time step (1 ms)

    # === Ignition Transition ===
    alpha: float = 7.5  # Sigmoid steepness (5-10 range)
    # Empirical basis: Gold & Shadlen (2007), psychophysical studies
    # Creates near-binary transition: 10% → 90% over ΔS ≈ 0.4-0.8

    # === Threshold Dynamics ===
    gamma: float = 2.0  # Homeostatic recovery rate (2 s⁻¹, ~350 ms half-life)
    # Biological basis: Spike-frequency adaptation, homeostatic synaptic scaling

    delta: float = 0.4  # Post-ignition threshold elevation (0.3-0.5 × θ₀)
    # Creates ~250-400 ms refractory period
    # Accounts for: Psychological refractory period (Pashler, 1994)
    #               Attentional blink (Raymond et al., 1992)

    lambda_urgency: float = 0.075  # Urgency coefficient (50-100 ms scaled)
    # Biological basis: Phasic LC-NE bursts within 100-200 ms of threat

    theta_base: float = 1.0  # Base threshold (normalized units)

    # === Integration Parameters ===
    beta: float = 1.35  # Somatic bias factor (1.2-1.5 baseline)
    # Context-modulated via differential NE release (insula/ACC vs. sensory)

    kappa: float = 0.2  # Divisive normalization constant (0.1-0.3)
    # Empirical basis: Carandini & Heeger (2012)

    sigma_noise: float = 0.15  # Noise amplitude (0.1-0.2 normalized)
    # Accounts for trial-to-trial variability in ignition latency

    # === Neuromodulator Coefficients ===
    # Population-level approximations from pharmacological challenge studies

    kappa_NE: float = 0.30  # Norepinephrine (0.25-0.35)
    # Propranolol increases detection thresholds ~15-25% (Hurlemann et al., 2010)

    kappa_ACh: float = 0.15  # Acetylcholine (0.10-0.20)
    # Physostigmine improves detection ~10-15% (Furey et al., 2000)

    kappa_5HT: float = 0.425  # Serotonin (0.35-0.50)
    # SSRIs reduce false alarms ~20-35% (Quednow et al., 2012)

    kappa_DA: float = 0.20  # Dopamine (0.15-0.25)
    # L-DOPA increases thresholds ~10-20% in reward contexts (Cicchini et al., 2017)

    def to_dict(self) -> Dict[str, float]:
        """Convert parameters to dictionary"""
        return {
            'tau': self.tau,
            'dt': self.dt,
            'alpha': self.alpha,
            'gamma': self.gamma,
            'delta': self.delta,
            'lambda_urgency': self.lambda_urgency,
            'theta_base': self.theta_base,
            'beta': self.beta,
            'kappa': self.kappa,
            'sigma_noise': self.sigma_noise,
            'kappa_NE': self.kappa_NE,
            'kappa_ACh': self.kappa_ACh,
            'kappa_5HT': self.kappa_5HT,
            'kappa_DA': self.kappa_DA
        }


# === Preset Parameter Configurations ===

STANDARD_PARAMS = APGIParameters()

HIGH_VIGILANCE_PARAMS = APGIParameters(
    alpha=9.0,          # Steeper transition
    gamma=2.5,          # Faster recovery
    lambda_urgency=0.1,  # Stronger urgency response
    sigma_noise=0.1     # Lower noise
)

LOW_AROUSAL_PARAMS = APGIParameters(
    alpha=6.0,          # Gentler transition
    gamma=1.5,          # Slower recovery
    delta=0.5,          # Longer refractory period
    sigma_noise=0.2     # Higher noise
)

THREAT_DETECTION_PARAMS = APGIParameters(
    beta=1.5,           # Increased somatic bias
    lambda_urgency=0.1,  # Strong urgency
    delta=0.3           # Reduced refractoriness for rapid re-detection
)


# === Neural Correlate Mapping ===

NEURAL_CORRELATES = {
    'S_t': {
        'variable': 'Surprise (accumulated evidence)',
        'location': 'Supragranular layers (L2/3) of Posterior Parietal Cortex (PPC) and '
                   'Intraparietal Sulcus (IPS)',
        'mechanism': 'Population firing rate of evidence accumulator neurons. '
                    'Ramping from recurrent excitation in L2/3 pyramidal circuits, '
                    'balanced by SOM+ interneuron feedback inhibition.',
        'decay': 'Spike-frequency adaptation (slow K⁺ currents) and synaptic depression',
        'input': 'Precision-weighted prediction error via (1) thalamocortical input '
                'to L4/L5 and (2) corticocortical projections from sensory/insular regions'
    },

    'theta_t': {
        'variable': 'Ignition threshold',
        'location': 'Apical dendrites of Layer 5 pyramidal cells',
        'mechanism': 'Effective membrane potential threshold for NMDA-spike generation '
                    'in L5 pyramidal cell apical tufts',
        'homeostasis': 'Tonic firing of Thalamic Reticular Nucleus (TRN) providing '
                      'baseline GABAergic inhibition to matrix thalamus',
        'refractoriness': '(1) Short-term synaptic depression in thalamocortical synapses; '
                         '(2) After-hyperpolarization in L5 cells; '
                         '(3) Delayed SOM+ interneuron feedback',
        'urgency': 'Phasic LC-NE bursts potentiating NMDA currents via β-adrenergic '
                  'receptors and hyperpolarizing TRN'
    },

    'B_t': {
        'variable': 'Ignition probability',
        'location': 'Frontoparietal network',
        'mechanism': 'Probability of metastable attractor state. Switch implemented by '
                    'NMDA-receptor-mediated Ca²⁺ spike in L5 apical tuft.',
        'trigger': 'When S > θ, disinhibited matrix thalamus (pulvinar/MD) delivers '
                  'coordinated drive to L1, triggering regenerative dendritic Ca²⁺ spike',
        'output': 'Spike propagates to soma; if coincident with basal input, '
                 'triggers burst implementing coincidence detection',
        'steepness': 'Determined by apical NMDA receptor density and thalamic '
                    'input synchrony'
    }
}


# === Timescale Architecture ===

TIMESCALES = {
    'fast_adaptation': {
        'range': '50-500 ms',
        'mechanisms': [
            'Homeostatic recovery (γ term): ~350 ms half-life',
            'Post-ignition refractoriness (δ term): ~250-400 ms',
            'Urgency signaling (λ term): ~50-200 ms'
        ]
    },
    'phasic_neuromodulation': {
        'range': '100 ms - 10 s',
        'mechanisms': [
            'Phasic LC-NE bursts: 100-200 ms response to threat',
            'Rapid attentional shifts: 200-500 ms',
            'Event-driven state changes: 1-10 s'
        ]
    },
    'tonic_neuromodulation': {
        'range': '10 s - hours',
        'mechanisms': [
            'Sustained stress/vigilance states: minutes',
            'Circadian neuromodulator fluctuations: hours',
            'Long-term adaptation: hours to days'
        ]
    }
}

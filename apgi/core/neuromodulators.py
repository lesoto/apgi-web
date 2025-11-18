"""
Neuromodulator Dynamics and Effects

Models tonic neuromodulator levels and their effects on the ignition threshold.
"""

import numpy as np
from typing import Dict, Optional
from enum import Enum


class NeuromodulatorState(Enum):
    """Predefined neuromodulatory states"""
    BASELINE = "baseline"
    HIGH_VIGILANCE = "high_vigilance"
    RELAXED = "relaxed"
    THREAT = "threat"
    REWARD = "reward"
    DEPRESSED = "depressed"
    ANXIOUS = "anxious"


class NeuromodulatorProfile:
    """
    Manages neuromodulator levels and their temporal dynamics.

    Implements realistic neuromodulator dynamics including:
    - Tonic baseline levels
    - Phasic bursts/dips
    - Slow drift over time
    """

    def __init__(self,
                 NE: float = 0.5,
                 ACh: float = 0.5,
                 serotonin: float = 0.5,
                 DA: float = 0.5):
        """
        Initialize neuromodulator profile.

        Args:
            NE: Norepinephrine level (0-1)
            ACh: Acetylcholine level (0-1)
            serotonin: Serotonin level (0-1)
            DA: Dopamine level (0-1)
        """
        self.NE = np.clip(NE, 0, 1)
        self.ACh = np.clip(ACh, 0, 1)
        self.serotonin = np.clip(serotonin, 0, 1)
        self.DA = np.clip(DA, 0, 1)

        # Dynamics parameters
        self.tonic_tau = 60.0  # Time constant for tonic drift (60 s)
        self.phasic_tau = 0.5  # Time constant for phasic response (500 ms)

        # Target levels (for slow drift)
        self.NE_target = self.NE
        self.ACh_target = self.ACh
        self.serotonin_target = self.serotonin
        self.DA_target = self.DA

    @classmethod
    def from_state(cls, state: NeuromodulatorState) -> 'NeuromodulatorProfile':
        """
        Create profile from predefined state.

        Args:
            state: NeuromodulatorState enum value

        Returns:
            NeuromodulatorProfile configured for the specified state
        """
        profiles = {
            NeuromodulatorState.BASELINE: cls(0.5, 0.5, 0.5, 0.5),
            NeuromodulatorState.HIGH_VIGILANCE: cls(0.8, 0.7, 0.3, 0.5),
            NeuromodulatorState.RELAXED: cls(0.3, 0.4, 0.7, 0.6),
            NeuromodulatorState.THREAT: cls(0.9, 0.6, 0.2, 0.3),
            NeuromodulatorState.REWARD: cls(0.4, 0.5, 0.5, 0.8),
            NeuromodulatorState.DEPRESSED: cls(0.3, 0.3, 0.3, 0.2),
            NeuromodulatorState.ANXIOUS: cls(0.7, 0.5, 0.4, 0.4),
        }
        return profiles[state]

    def set_target_state(self, state: NeuromodulatorState):
        """
        Set target neuromodulator levels for slow drift.

        Args:
            state: Target neuromodulatorState
        """
        target_profile = self.from_state(state)
        self.NE_target = target_profile.NE
        self.ACh_target = target_profile.ACh
        self.serotonin_target = target_profile.serotonin
        self.DA_target = target_profile.DA

    def phasic_burst(self,
                     NE_delta: float = 0.0,
                     ACh_delta: float = 0.0,
                     serotonin_delta: float = 0.0,
                     DA_delta: float = 0.0):
        """
        Apply phasic burst (fast, transient change).

        Args:
            NE_delta: Change in NE (can be negative for dip)
            ACh_delta: Change in ACh
            serotonin_delta: Change in serotonin
            DA_delta: Change in DA
        """
        self.NE = np.clip(self.NE + NE_delta, 0, 1)
        self.ACh = np.clip(self.ACh + ACh_delta, 0, 1)
        self.serotonin = np.clip(self.serotonin + serotonin_delta, 0, 1)
        self.DA = np.clip(self.DA + DA_delta, 0, 1)

    def update(self, dt: float):
        """
        Update neuromodulator levels with slow drift toward targets.

        Args:
            dt: Time step (seconds)
        """
        # Tonic drift toward target levels
        self.NE += (self.NE_target - self.NE) * dt / self.tonic_tau
        self.ACh += (self.ACh_target - self.ACh) * dt / self.tonic_tau
        self.serotonin += (self.serotonin_target - self.serotonin) * dt / self.tonic_tau
        self.DA += (self.DA_target - self.DA) * dt / self.tonic_tau

        # Ensure bounds
        self.NE = np.clip(self.NE, 0, 1)
        self.ACh = np.clip(self.ACh, 0, 1)
        self.serotonin = np.clip(self.serotonin, 0, 1)
        self.DA = np.clip(self.DA, 0, 1)

    def get_levels(self) -> Dict[str, float]:
        """Get current neuromodulator levels"""
        return {
            'NE': self.NE,
            'ACh': self.ACh,
            'serotonin': self.serotonin,
            'DA': self.DA
        }

    def set_levels(self,
                   NE: Optional[float] = None,
                   ACh: Optional[float] = None,
                   serotonin: Optional[float] = None,
                   DA: Optional[float] = None):
        """
        Directly set neuromodulator levels.

        Args:
            NE: Norepinephrine level (0-1)
            ACh: Acetylcholine level (0-1)
            serotonin: Serotonin level (0-1)
            DA: Dopamine level (0-1)
        """
        if NE is not None:
            self.NE = np.clip(NE, 0, 1)
            self.NE_target = self.NE
        if ACh is not None:
            self.ACh = np.clip(ACh, 0, 1)
            self.ACh_target = self.ACh
        if serotonin is not None:
            self.serotonin = np.clip(serotonin, 0, 1)
            self.serotonin_target = self.serotonin
        if DA is not None:
            self.DA = np.clip(DA, 0, 1)
            self.DA_target = self.DA


def compute_threshold_modulation(
    theta_base: float,
    NE: float,
    ACh: float,
    serotonin: float,
    DA: float,
    kappa_NE: float = 0.30,
    kappa_ACh: float = 0.15,
    kappa_5HT: float = 0.425,
    kappa_DA: float = 0.20
) -> float:
    """
    Compute modulated baseline threshold from neuromodulator levels.

    θ₀ = θ_base · exp(-κ_NE·[NE] - κ_ACh·[ACh]) · exp(+κ_5HT·[5-HT] + κ_DA·[DA])

    Args:
        theta_base: Baseline threshold (no neuromodulation)
        NE: Norepinephrine level (0-1)
        ACh: Acetylcholine level (0-1)
        serotonin: Serotonin level (0-1)
        DA: Dopamine level (0-1)
        kappa_NE: NE coefficient (threshold-lowering)
        kappa_ACh: ACh coefficient (threshold-lowering)
        kappa_5HT: Serotonin coefficient (threshold-raising)
        kappa_DA: Dopamine coefficient (threshold-raising)

    Returns:
        Modulated baseline threshold
    """
    lowering = -kappa_NE * NE - kappa_ACh * ACh
    raising = kappa_5HT * serotonin + kappa_DA * DA
    return theta_base * np.exp(lowering + raising)


# === Event-Triggered Neuromodulator Responses ===

def threat_response() -> Dict[str, float]:
    """Phasic response to threat detection"""
    return {
        'NE_delta': +0.3,      # LC-NE burst
        'ACh_delta': +0.1,     # Increased attention
        'serotonin_delta': -0.2,  # Reduced 5-HT (disinhibition)
        'DA_delta': -0.1       # Reduced DA (interrupt reward)
    }


def reward_response() -> Dict[str, float]:
    """Phasic response to reward"""
    return {
        'NE_delta': +0.1,      # Mild arousal
        'ACh_delta': 0.0,
        'serotonin_delta': +0.1,  # Satisfaction
        'DA_delta': +0.3       # VTA-DA burst
    }


def novelty_response() -> Dict[str, float]:
    """Phasic response to novelty"""
    return {
        'NE_delta': +0.2,      # LC-NE activation
        'ACh_delta': +0.2,     # Enhanced encoding
        'serotonin_delta': -0.1,
        'DA_delta': +0.1
    }


def error_response() -> Dict[str, float]:
    """Phasic response to prediction error"""
    return {
        'NE_delta': +0.15,
        'ACh_delta': +0.15,
        'serotonin_delta': 0.0,
        'DA_delta': -0.15      # DA dip for negative prediction error
    }

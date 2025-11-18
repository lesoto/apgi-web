"""
Core APGI (Active Precision-Gated Ignition) Model Implementation

This module implements the biophysical mean-field model of conscious access
based on thalamocortical microcircuit dynamics.
"""

import numpy as np
from typing import Tuple, Optional, Callable


class APGIModel:
    """
    Active Precision-Gated Ignition (APGI) Model

    A biophysically-grounded model of conscious access implementing:
    - Surprise accumulation in L2/3 PPC/IPS populations
    - Dynamic ignition threshold based on L5 pyramidal NMDA spikes
    - Multi-timescale threshold adaptation
    - Neuromodulator effects on baseline threshold

    State Variables:
        S_t: Precision-weighted surprise (population firing rate)
        θ_t: Dynamic ignition threshold (effective NMDA spike threshold)
        B_t: Ignition probability (metastable attractor state probability)
    """

    def __init__(self,
                 tau: float = 0.2,           # Surprise decay time constant (200 ms)
                 alpha: float = 7.5,         # Sigmoid steepness (5-10 range)
                 gamma: float = 2.0,         # Homeostatic recovery rate (2 s⁻¹)
                 delta: float = 0.4,         # Post-ignition elevation (0.3-0.5·θ₀)
                 lambda_: float = 0.075,     # Urgency coefficient (50-100 ms scaled)
                 theta_base: float = 1.0,    # Baseline threshold
                 beta: float = 1.35,         # Somatic bias factor (1.2-1.5)
                 kappa: float = 0.2,         # Divisive normalization constant (0.1-0.3)
                 sigma_noise: float = 0.15,  # Noise amplitude (0.1-0.2)
                 dt: float = 0.001):         # Integration time step (1 ms)
        """
        Initialize APGI model with biophysically-constrained parameters.

        Args:
            tau: Time constant for surprise decay (seconds)
            alpha: Steepness of ignition probability sigmoid
            gamma: Rate of homeostatic threshold recovery (Hz)
            delta: Magnitude of post-ignition threshold elevation
            lambda_: Urgency-based threshold lowering coefficient
            theta_base: Baseline ignition threshold
            beta: Somatic bias factor for interoceptive weighting
            kappa: Divisive normalization constant
            sigma_noise: Standard deviation of noise term
            dt: Time step for numerical integration (seconds)
        """
        # Core dynamics parameters
        self.tau = tau
        self.alpha = alpha
        self.gamma = gamma
        self.delta = delta
        self.lambda_ = lambda_
        self.theta_base = theta_base
        self.beta = beta
        self.kappa = kappa
        self.sigma_noise = sigma_noise
        self.dt = dt

        # State variables
        self.S_t = 0.0      # Current surprise level
        self.theta_t = theta_base  # Current threshold
        self.B_t = 0.0      # Current ignition probability
        self.B_prev = 0      # Previous ignition state (0 or 1)

        # Neuromodulator coefficients (see set_neuromodulators)
        self.kappa_NE = 0.30    # Norepinephrine (threshold-lowering)
        self.kappa_ACh = 0.15   # Acetylcholine (threshold-lowering)
        self.kappa_5HT = 0.425  # Serotonin (threshold-raising)
        self.kappa_DA = 0.20    # Dopamine (threshold-raising)

        # Current neuromodulator levels (normalized, 0-1)
        self.NE = 0.5
        self.ACh = 0.5
        self.serotonin = 0.5
        self.DA = 0.5

        # Update theta_0 based on neuromodulators
        self.theta_0 = self._compute_modulated_baseline()

        # History tracking
        self.history = {
            'time': [],
            'S': [],
            'theta': [],
            'B': [],
            'ignitions': [],
            'Pi_e': [],
            'Pi_i': [],
            'epsilon_e': [],
            'epsilon_i': []
        }

    def _compute_modulated_baseline(self) -> float:
        """
        Compute neuromodulator-modulated baseline threshold θ₀.

        θ₀ = θ_base · exp(-κ_NE·[NE] - κ_ACh·[ACh]) · exp(+κ_5HT·[5-HT] + κ_DA·[DA])

        Returns:
            Modulated baseline threshold
        """
        lowering = -self.kappa_NE * self.NE - self.kappa_ACh * self.ACh
        raising = self.kappa_5HT * self.serotonin + self.kappa_DA * self.DA
        return self.theta_base * np.exp(lowering + raising)

    def set_neuromodulators(self,
                           NE: Optional[float] = None,
                           ACh: Optional[float] = None,
                           serotonin: Optional[float] = None,
                           DA: Optional[float] = None):
        """
        Set tonic neuromodulator levels (normalized 0-1).

        Args:
            NE: Norepinephrine level (lowers threshold, facilitates ignition)
            ACh: Acetylcholine level (lowers threshold, enhances detection)
            serotonin: Serotonin level (raises threshold, reduces false alarms)
            DA: Dopamine level (raises threshold in reward contexts)
        """
        if NE is not None:
            self.NE = np.clip(NE, 0, 1)
        if ACh is not None:
            self.ACh = np.clip(ACh, 0, 1)
        if serotonin is not None:
            self.serotonin = np.clip(serotonin, 0, 1)
        if DA is not None:
            self.DA = np.clip(DA, 0, 1)

        # Update baseline threshold
        self.theta_0 = self._compute_modulated_baseline()

    def _divisive_normalization(self, x: float, y: float) -> float:
        """
        Divisive normalization integration function.

        f(x, y) = (x + y) / (1 + κ·(x + y))

        Implements subadditive integration preventing double-counting
        of overlapping exteroceptive and interoceptive information.

        Args:
            x: Weighted exteroceptive contribution
            y: Weighted interoceptive contribution

        Returns:
            Normalized integrated surprise input
        """
        total = x + y
        return total / (1.0 + self.kappa * total)

    def _sigmoid(self, x: float) -> float:
        """
        Sigmoid function for ignition probability.

        σ(x) = 1 / (1 + e^(-x))

        Args:
            x: Input value

        Returns:
            Sigmoid output in [0, 1]
        """
        return 1.0 / (1.0 + np.exp(-x))

    def compute_surprise_input(self,
                              Pi_e: float,
                              epsilon_e: float,
                              Pi_i: float,
                              epsilon_i: float) -> float:
        """
        Compute integrated surprise input from prediction errors.

        f(Πₑ·|εₑ|, β·Πᵢ·|εᵢ|) using divisive normalization

        Args:
            Pi_e: Exteroceptive precision
            epsilon_e: Exteroceptive prediction error
            Pi_i: Interoceptive precision
            epsilon_i: Interoceptive prediction error

        Returns:
            Integrated surprise input
        """
        x = Pi_e * np.abs(epsilon_e)
        y = self.beta * Pi_i * np.abs(epsilon_i)
        return self._divisive_normalization(x, y)

    def step(self,
             Pi_e: float,
             epsilon_e: float,
             Pi_i: float = 0.0,
             epsilon_i: float = 0.0,
             t: float = 0.0) -> Tuple[float, float, float]:
        """
        Perform one integration step of the APGI model.

        Updates state variables according to:
        1. dS/dt = -S/τ + f(Πₑ·εₑ, Πᵢ·εᵢ) + σ·η
        2. dθ/dt = γ(θ₀ - θ) + δ·B_{t-1} - λ·|dS/dt|
        3. B = σ(α(S - θ))

        Args:
            Pi_e: Exteroceptive precision
            epsilon_e: Exteroceptive prediction error
            Pi_i: Interoceptive precision
            epsilon_i: Interoceptive prediction error
            t: Current simulation time

        Returns:
            Tuple of (S_t, theta_t, B_t)
        """
        # Compute surprise input
        f_input = self.compute_surprise_input(Pi_e, epsilon_e, Pi_i, epsilon_i)

        # Add Gaussian noise
        noise = self.sigma_noise * np.random.randn()

        # Compute dS/dt BEFORE updating S (needed for urgency term)
        dS_dt = -self.S_t / self.tau + f_input + noise

        # Update surprise: S_{t+1} = S_t + dS/dt · dt
        self.S_t += dS_dt * self.dt
        self.S_t = max(0, self.S_t)  # Non-negative constraint

        # Update threshold: dθ/dt = γ(θ₀ - θ) + δ·B_{t-1} - λ·|dS/dt|
        dtheta_dt = (self.gamma * (self.theta_0 - self.theta_t) +
                     self.delta * self.B_prev -
                     self.lambda_ * np.abs(dS_dt))
        self.theta_t += dtheta_dt * self.dt
        self.theta_t = max(0.01, self.theta_t)  # Prevent negative threshold

        # Compute ignition probability: B = σ(α(S - θ))
        self.B_t = self._sigmoid(self.alpha * (self.S_t - self.theta_t))

        # Sample ignition event (stochastic)
        ignited = 1 if np.random.rand() < self.B_t else 0
        self.B_prev = ignited

        # Record history
        self.history['time'].append(t)
        self.history['S'].append(self.S_t)
        self.history['theta'].append(self.theta_t)
        self.history['B'].append(self.B_t)
        self.history['ignitions'].append(ignited)
        self.history['Pi_e'].append(Pi_e)
        self.history['Pi_i'].append(Pi_i)
        self.history['epsilon_e'].append(epsilon_e)
        self.history['epsilon_i'].append(epsilon_i)

        return self.S_t, self.theta_t, self.B_t

    def reset(self, S_init: float = 0.0, theta_init: Optional[float] = None):
        """
        Reset model state to initial conditions.

        Args:
            S_init: Initial surprise level
            theta_init: Initial threshold (if None, uses theta_0)
        """
        self.S_t = S_init
        self.theta_t = theta_init if theta_init is not None else self.theta_0
        self.B_t = 0.0
        self.B_prev = 0

        self.history = {
            'time': [],
            'S': [],
            'theta': [],
            'B': [],
            'ignitions': [],
            'Pi_e': [],
            'Pi_i': [],
            'epsilon_e': [],
            'epsilon_i': []
        }

    def get_history(self) -> dict:
        """
        Get simulation history as numpy arrays.

        Returns:
            Dictionary with time series of all state variables
        """
        return {k: np.array(v) for k, v in self.history.items()}

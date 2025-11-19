"""
Stimulus Generation Functions

Provides common stimulus patterns for APGI simulations.
"""

import numpy as np
from typing import Callable, Tuple, Optional


def constant_stimulus(Pi_e: float = 1.0,
                     epsilon_e: float = 1.5,
                     Pi_i: float = 0.5,
                     epsilon_i: float = 0.3) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create constant stimulus function.

    Args:
        Pi_e: Exteroceptive precision
        epsilon_e: Exteroceptive prediction error
        Pi_i: Interoceptive precision
        epsilon_i: Interoceptive prediction error

    Returns:
        Stimulus function mapping time → (Pi_e, epsilon_e, Pi_i, epsilon_i)
    """
    def stimulus_fn(t):
        return Pi_e, epsilon_e, Pi_i, epsilon_i
    return stimulus_fn


def pulse_stimulus(onset: float = 0.5,
                  duration: float = 0.2,
                  Pi_e: float = 1.0,
                  epsilon_e: float = 2.0,
                  Pi_i: float = 0.0,
                  epsilon_i: float = 0.0) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create pulsed stimulus (on for fixed duration, off otherwise).

    Args:
        onset: Stimulus onset time (seconds)
        duration: Stimulus duration (seconds)
        Pi_e: Exteroceptive precision during pulse
        epsilon_e: Exteroceptive prediction error during pulse
        Pi_i: Interoceptive precision during pulse
        epsilon_i: Interoceptive prediction error during pulse

    Returns:
        Stimulus function
    """
    offset = onset + duration

    def stimulus_fn(t):
        if onset <= t < offset:
            return Pi_e, epsilon_e, Pi_i, epsilon_i
        else:
            return 0.0, 0.0, 0.0, 0.0

    return stimulus_fn


def ramp_stimulus(ramp_duration: float = 1.0,
                 max_Pi_e: float = 1.0,
                 max_epsilon_e: float = 2.5,
                 baseline_Pi_i: float = 0.5,
                 baseline_epsilon_i: float = 0.2) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create ramping stimulus (linearly increasing evidence).

    Args:
        ramp_duration: Duration over which stimulus ramps up
        max_Pi_e: Maximum exteroceptive precision
        max_epsilon_e: Maximum exteroceptive prediction error
        baseline_Pi_i: Constant interoceptive precision
        baseline_epsilon_i: Constant interoceptive prediction error

    Returns:
        Stimulus function
    """
    def stimulus_fn(t):
        if t < ramp_duration:
            ramp_factor = t / ramp_duration
            return (max_Pi_e * ramp_factor,
                   max_epsilon_e * ramp_factor,
                   baseline_Pi_i,
                   baseline_epsilon_i)
        else:
            return (max_Pi_e, max_epsilon_e,
                   baseline_Pi_i, baseline_epsilon_i)

    return stimulus_fn


def noisy_stimulus(mean_Pi_e: float = 1.0,
                  mean_epsilon_e: float = 1.5,
                  noise_std: float = 0.3,
                  temporal_correlation: float = 0.05,
                  seed: Optional[int] = None) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create temporally-correlated noisy stimulus.

    Args:
        mean_Pi_e: Mean exteroceptive precision
        mean_epsilon_e: Mean exteroceptive prediction error
        noise_std: Standard deviation of noise
        temporal_correlation: Time constant for temporal correlation (seconds)
        seed: Random seed for reproducibility

    Returns:
        Stimulus function
    """
    if seed is not None:
        rng = np.random.RandomState(seed)
    else:
        rng = np.random

    # State for Ornstein-Uhlenbeck process
    state = {'current_epsilon': mean_epsilon_e,
            'last_t': 0.0}

    def stimulus_fn(t):
        dt = t - state['last_t']
        state['last_t'] = t

        # Ornstein-Uhlenbeck process for correlated noise
        decay = np.exp(-dt / temporal_correlation) if temporal_correlation > 0 else 0
        state['current_epsilon'] = (decay * state['current_epsilon'] +
                                   (1 - decay) * mean_epsilon_e +
                                   noise_std * np.sqrt(1 - decay**2) * rng.randn())

        # Ensure non-negative
        epsilon_e = max(0, state['current_epsilon'])

        return mean_Pi_e, epsilon_e, 0.0, 0.0

    return stimulus_fn


def threat_stimulus(onset: float = 0.5,
                   ramp_duration: float = 0.1,
                   sustain_duration: float = 0.3,
                   max_epsilon_e: float = 3.0,
                   max_epsilon_i: float = 1.5,
                   Pi_e: float = 1.0,
                   Pi_i: float = 1.2) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create threat stimulus (rapid ramp, simultaneous extero- and interoceptive).

    Simulates looming threat with both external and bodily responses.

    Args:
        onset: Threat onset time
        ramp_duration: Duration of rapid escalation
        sustain_duration: Duration of sustained threat
        max_epsilon_e: Peak exteroceptive prediction error
        max_epsilon_i: Peak interoceptive prediction error (heart rate, etc.)
        Pi_e: Exteroceptive precision
        Pi_i: Interoceptive precision

    Returns:
        Stimulus function
    """
    ramp_end = onset + ramp_duration
    offset = ramp_end + sustain_duration

    def stimulus_fn(t):
        if t < onset:
            return 0.0, 0.0, 0.0, 0.0
        elif onset <= t < ramp_end:
            ramp_factor = (t - onset) / ramp_duration
            return (Pi_e, max_epsilon_e * ramp_factor,
                   Pi_i, max_epsilon_i * ramp_factor)
        elif ramp_end <= t < offset:
            return Pi_e, max_epsilon_e, Pi_i, max_epsilon_i
        else:
            # Exponential decay after offset
            decay_time = t - offset
            decay_factor = np.exp(-decay_time / 0.2)  # 200 ms decay
            return (Pi_e, max_epsilon_e * decay_factor,
                   Pi_i, max_epsilon_i * decay_factor)

    return stimulus_fn


def dual_task_stimulus(t1_onset: float = 0.5,
                       t1_duration: float = 0.1,
                       t2_onset: float = 0.7,
                       t2_duration: float = 0.1,
                       Pi_e: float = 1.0,
                       epsilon_e: float = 2.0) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create dual-task stimulus for testing attentional blink / PRP.

    Args:
        t1_onset: First target onset time
        t1_duration: First target duration
        t2_onset: Second target onset time
        t2_duration: Second target duration
        Pi_e: Precision for both targets
        epsilon_e: Prediction error for both targets

    Returns:
        Stimulus function
    """
    t1_offset = t1_onset + t1_duration
    t2_offset = t2_onset + t2_duration

    def stimulus_fn(t):
        if t1_onset <= t < t1_offset:
            return Pi_e, epsilon_e, 0.0, 0.0
        elif t2_onset <= t < t2_offset:
            return Pi_e, epsilon_e, 0.0, 0.0
        else:
            return 0.0, 0.0, 0.0, 0.0

    return stimulus_fn


def interoceptive_stimulus(onset: float = 0.5,
                          duration: float = 1.0,
                          Pi_i: float = 1.0,
                          epsilon_i: float = 1.5,
                          baseline_Pi_e: float = 0.3,
                          baseline_epsilon_e: float = 0.2) -> Callable[[float], Tuple[float, float, float, float]]:
    """
    Create predominantly interoceptive stimulus (e.g., pain, hunger, emotion).

    Args:
        onset: Stimulus onset
        duration: Stimulus duration
        Pi_i: Interoceptive precision
        epsilon_i: Interoceptive prediction error
        baseline_Pi_e: Low background exteroceptive precision
        baseline_epsilon_e: Low background exteroceptive error

    Returns:
        Stimulus function
    """
    offset = onset + duration

    def stimulus_fn(t):
        if onset <= t < offset:
            return baseline_Pi_e, baseline_epsilon_e, Pi_i, epsilon_i
        else:
            return baseline_Pi_e, baseline_epsilon_e, 0.0, 0.0

    return stimulus_fn

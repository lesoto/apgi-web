"""
APGI Simulation Runner

Provides high-level interface for running APGI simulations with various stimuli
and neuromodulatory contexts.
"""

import numpy as np
from typing import Callable, Optional, Dict, List, Tuple
from ..core.model import APGIModel
from ..core.parameters import APGIParameters
from ..core.neuromodulators import NeuromodulatorProfile


class APGISimulation:
    """
    High-level simulation runner for APGI model.

    Manages stimulus presentation, neuromodulator dynamics, and data collection.
    """

    def __init__(self,
                 model: Optional[APGIModel] = None,
                 params: Optional[APGIParameters] = None):
        """
        Initialize simulation.

        Args:
            model: APGI model instance (creates default if None)
            params: Parameter set (uses standard if None)
        """
        if params is None:
            params = APGIParameters()

        if model is None:
            self.model = APGIModel(
                tau=params.tau,
                alpha=params.alpha,
                gamma=params.gamma,
                delta=params.delta,
                lambda_=params.lambda_urgency,
                theta_base=params.theta_base,
                beta=params.beta,
                kappa=params.kappa,
                sigma_noise=params.sigma_noise,
                dt=params.dt
            )
        else:
            self.model = model

        self.params = params
        self.neuromod_profile = NeuromodulatorProfile()

        # Simulation state
        self.time = 0.0
        self.running = False

    def run(self,
            duration: float,
            stimulus_fn: Callable[[float], Tuple[float, float, float, float]],
            neuromod_fn: Optional[Callable[[float, 'APGISimulation'], None]] = None,
            reset: bool = True) -> Dict[str, np.ndarray]:
        """
        Run simulation for specified duration.

        Args:
            duration: Simulation duration (seconds)
            stimulus_fn: Function mapping time → (Pi_e, epsilon_e, Pi_i, epsilon_i)
            neuromod_fn: Optional function for dynamic neuromodulator control
            reset: Whether to reset model state before running

        Returns:
            Dictionary with simulation history
        """
        if reset:
            self.model.reset()
            self.time = 0.0

        n_steps = int(duration / self.model.dt)
        self.running = True

        for step in range(n_steps):
            # Get current stimulus
            Pi_e, epsilon_e, Pi_i, epsilon_i = stimulus_fn(self.time)

            # Update neuromodulators if function provided
            if neuromod_fn is not None:
                neuromod_fn(self.time, self)

            # Update model neuromodulator levels
            levels = self.neuromod_profile.get_levels()
            self.model.set_neuromodulators(**levels)

            # Step model
            self.model.step(Pi_e, epsilon_e, Pi_i, epsilon_i, self.time)

            # Advance time
            self.time += self.model.dt

        self.running = False
        return self.model.get_history()

    def run_trial(self,
                  pre_stimulus: float = 0.5,
                  stimulus_duration: float = 1.0,
                  post_stimulus: float = 1.0,
                  Pi_e: float = 1.0,
                  epsilon_e: float = 1.5,
                  Pi_i: float = 0.5,
                  epsilon_i: float = 0.3,
                  stimulus_onset: Optional[float] = None) -> Dict[str, np.ndarray]:
        """
        Run a single trial with a discrete stimulus presentation.

        Args:
            pre_stimulus: Duration before stimulus onset (seconds)
            stimulus_duration: Duration of stimulus presentation (seconds)
            post_stimulus: Duration after stimulus offset (seconds)
            Pi_e: Exteroceptive precision during stimulus
            epsilon_e: Exteroceptive prediction error during stimulus
            Pi_i: Interoceptive precision during stimulus
            epsilon_i: Interoceptive prediction error during stimulus
            stimulus_onset: Custom onset time (if None, uses pre_stimulus)

        Returns:
            Dictionary with trial history
        """
        total_duration = pre_stimulus + stimulus_duration + post_stimulus
        onset = stimulus_onset if stimulus_onset is not None else pre_stimulus
        offset = onset + stimulus_duration

        def stimulus_fn(t):
            if onset <= t < offset:
                return Pi_e, epsilon_e, Pi_i, epsilon_i
            else:
                return 0.0, 0.0, 0.0, 0.0

        return self.run(total_duration, stimulus_fn, reset=True)

    def run_ramp_stimulus(self,
                         duration: float = 2.0,
                         ramp_duration: float = 1.0,
                         max_Pi_e: float = 1.0,
                         max_epsilon_e: float = 2.0,
                         baseline_Pi_i: float = 0.5,
                         baseline_epsilon_i: float = 0.2) -> Dict[str, np.ndarray]:
        """
        Run trial with ramping stimulus (simulates evidence accumulation).

        Args:
            duration: Total simulation duration (seconds)
            ramp_duration: Duration of ramping phase (seconds)
            max_Pi_e: Maximum exteroceptive precision
            max_epsilon_e: Maximum exteroceptive prediction error
            baseline_Pi_i: Baseline interoceptive precision
            baseline_epsilon_i: Baseline interoceptive prediction error

        Returns:
            Dictionary with simulation history
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

        return self.run(duration, stimulus_fn, reset=True)

    def run_dual_task(self,
                     duration: float = 3.0,
                     t1_onset: float = 0.5,
                     t1_duration: float = 0.1,
                     t2_onset: float = 0.7,
                     t2_duration: float = 0.1,
                     Pi_e: float = 1.0,
                     epsilon_e: float = 1.8) -> Dict[str, np.ndarray]:
        """
        Run dual-task trial (demonstrates attentional blink / PRP).

        Args:
            duration: Total simulation duration (seconds)
            t1_onset: First stimulus onset time
            t1_duration: First stimulus duration
            t2_onset: Second stimulus onset time
            t2_duration: Second stimulus duration
            Pi_e: Precision for both stimuli
            epsilon_e: Prediction error for both stimuli

        Returns:
            Dictionary with simulation history
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

        return self.run(duration, stimulus_fn, reset=True)

    def run_threshold_staircase(self,
                                epsilon_range: Tuple[float, float] = (0.5, 2.5),
                                n_levels: int = 20,
                                trials_per_level: int = 10,
                                trial_duration: float = 1.5,
                                Pi_e: float = 1.0) -> Dict[str, List]:
        """
        Run psychophysical staircase to estimate detection threshold.

        Args:
            epsilon_range: Range of prediction error magnitudes to test
            n_levels: Number of intensity levels
            trials_per_level: Number of trials per level
            trial_duration: Duration of each trial
            Pi_e: Exteroceptive precision (constant)

        Returns:
            Dictionary with epsilon levels and detection rates
        """
        epsilon_levels = np.linspace(epsilon_range[0], epsilon_range[1], n_levels)
        detection_rates = []

        for epsilon_e in epsilon_levels:
            detections = 0
            for trial in range(trials_per_level):
                history = self.run_trial(
                    pre_stimulus=0.5,
                    stimulus_duration=0.2,
                    post_stimulus=0.8,
                    Pi_e=Pi_e,
                    epsilon_e=epsilon_e,
                    Pi_i=0.0,
                    epsilon_i=0.0
                )

                # Check if ignition occurred during stimulus
                ignitions = history['ignitions']
                if np.any(ignitions):
                    detections += 1

            detection_rates.append(detections / trials_per_level)

        return {
            'epsilon_levels': epsilon_levels,
            'detection_rates': detection_rates
        }

    def set_neuromodulator_state(self, state):
        """
        Set neuromodulatory state.

        Args:
            state: NeuromodulatorState enum or string
        """
        from ..core.neuromodulators import NeuromodulatorState

        if isinstance(state, str):
            state = NeuromodulatorState(state)

        self.neuromod_profile = NeuromodulatorProfile.from_state(state)
        levels = self.neuromod_profile.get_levels()
        self.model.set_neuromodulators(**levels)

    def inject_neuromodulator_event(self, event_response: Dict[str, float]):
        """
        Inject phasic neuromodulator response.

        Args:
            event_response: Dictionary with delta values for each neuromodulator
        """
        self.neuromod_profile.phasic_burst(**event_response)
        levels = self.neuromod_profile.get_levels()
        self.model.set_neuromodulators(**levels)

"""
APGI Core Module

Contains the core mathematical model, parameters, and neuromodulator dynamics.
"""

from .model import APGIModel
from .parameters import (
    APGIParameters,
    STANDARD_PARAMS,
    HIGH_VIGILANCE_PARAMS,
    LOW_AROUSAL_PARAMS,
    THREAT_DETECTION_PARAMS,
    NEURAL_CORRELATES,
    TIMESCALES
)
from .neuromodulators import (
    NeuromodulatorProfile,
    NeuromodulatorState,
    compute_threshold_modulation,
    threat_response,
    reward_response,
    novelty_response,
    error_response
)

__all__ = [
    'APGIModel',
    'APGIParameters',
    'STANDARD_PARAMS',
    'HIGH_VIGILANCE_PARAMS',
    'LOW_AROUSAL_PARAMS',
    'THREAT_DETECTION_PARAMS',
    'NEURAL_CORRELATES',
    'TIMESCALES',
    'NeuromodulatorProfile',
    'NeuromodulatorState',
    'compute_threshold_modulation',
    'threat_response',
    'reward_response',
    'novelty_response',
    'error_response',
]

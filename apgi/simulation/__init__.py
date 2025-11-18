"""
APGI Simulation Module

Tools for running APGI simulations with various stimulus patterns.
"""

from .runner import APGISimulation
from .stimuli import (
    constant_stimulus,
    pulse_stimulus,
    ramp_stimulus,
    noisy_stimulus,
    threat_stimulus,
    dual_task_stimulus,
    interoceptive_stimulus
)

__all__ = [
    'APGISimulation',
    'constant_stimulus',
    'pulse_stimulus',
    'ramp_stimulus',
    'noisy_stimulus',
    'threat_stimulus',
    'dual_task_stimulus',
    'interoceptive_stimulus',
]

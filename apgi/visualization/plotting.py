"""
APGI Visualization Tools

Plotting functions for visualizing APGI simulation results.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.axes import Axes
from typing import Dict, Optional, Tuple, List


def plot_simulation(history: Dict[str, np.ndarray],
                   figsize: Tuple[int, int] = (12, 8),
                   show_inputs: bool = True,
                   show_neuromod: bool = False) -> Figure:
    """
    Create comprehensive visualization of APGI simulation.

    Args:
        history: Simulation history from APGIModel.get_history()
        figsize: Figure size (width, height)
        show_inputs: Whether to show input signals
        show_neuromod: Whether to show neuromodulator panel (future)

    Returns:
        Matplotlib Figure
    """
    n_panels = 3 if show_inputs else 2
    fig, axes = plt.subplots(n_panels, 1, figsize=figsize, sharex=True)

    time = history['time']
    S = history['S']
    theta = history['theta']
    B = history['B']
    ignitions = history['ignitions']

    # Panel 1: Surprise and Threshold
    ax1 = axes[0]
    ax1.plot(time, S, 'b-', linewidth=2, label='Surprise $S_t$')
    ax1.plot(time, theta, 'r--', linewidth=2, label='Threshold $\\theta_t$')

    # Mark ignition events
    ignition_times = time[np.array(ignitions, dtype=bool)]
    ignition_S = S[np.array(ignitions, dtype=bool)]
    if len(ignition_times) > 0:
        ax1.scatter(ignition_times, ignition_S, c='orange', s=100,
                   marker='*', zorder=5, label='Ignition', edgecolors='black')

    ax1.set_ylabel('Activation', fontsize=12)
    ax1.legend(loc='upper right', fontsize=10)
    ax1.grid(True, alpha=0.3)
    ax1.set_title('APGI Model Dynamics', fontsize=14, fontweight='bold')

    # Panel 2: Ignition Probability
    ax2 = axes[1]
    ax2.plot(time, B, 'g-', linewidth=2, label='$B_t = \\sigma(\\alpha(S_t - \\theta_t))$')
    ax2.axhline(y=0.5, color='gray', linestyle=':', linewidth=1, alpha=0.7)
    ax2.fill_between(time, 0, B, alpha=0.3, color='green')

    # Mark ignition events
    if len(ignition_times) > 0:
        ignition_B = B[np.array(ignitions, dtype=bool)]
        ax2.scatter(ignition_times, ignition_B, c='orange', s=100,
                   marker='*', zorder=5, edgecolors='black')

    ax2.set_ylabel('Probability', fontsize=12)
    ax2.set_ylim(-0.05, 1.05)
    ax2.legend(loc='upper right', fontsize=10)
    ax2.grid(True, alpha=0.3)
    ax2.set_title('Ignition Probability', fontsize=12)

    # Panel 3: Input signals (if requested)
    if show_inputs:
        ax3 = axes[2]
        Pi_e = history['Pi_e']
        epsilon_e = history['epsilon_e']
        Pi_i = history['Pi_i']
        epsilon_i = history['epsilon_i']

        # Compute weighted inputs
        extero_input = Pi_e * np.abs(epsilon_e)
        intero_input = Pi_i * np.abs(epsilon_i)

        ax3.plot(time, extero_input, 'b-', linewidth=1.5,
                label='Exteroceptive: $\\Pi_e \\cdot |\\epsilon_e|$', alpha=0.7)
        ax3.plot(time, intero_input, 'r-', linewidth=1.5,
                label='Interoceptive: $\\Pi_i \\cdot |\\epsilon_i|$', alpha=0.7)
        ax3.fill_between(time, 0, extero_input, alpha=0.2, color='blue')
        ax3.fill_between(time, 0, intero_input, alpha=0.2, color='red')

        ax3.set_ylabel('Weighted Input', fontsize=12)
        ax3.legend(loc='upper right', fontsize=10)
        ax3.grid(True, alpha=0.3)
        ax3.set_title('Precision-Weighted Prediction Errors', fontsize=12)

    axes[-1].set_xlabel('Time (s)', fontsize=12)
    plt.tight_layout()

    return fig


def plot_threshold_dynamics(history: Dict[str, np.ndarray],
                           figsize: Tuple[int, int] = (10, 6)) -> Figure:
    """
    Detailed visualization of threshold dynamics.

    Args:
        history: Simulation history
        figsize: Figure size

    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(1, 1, figsize=figsize)

    time = history['time']
    theta = history['theta']
    S = history['S']
    ignitions = history['ignitions']

    # Plot threshold and surprise
    ax.plot(time, theta, 'r-', linewidth=2, label='Threshold $\\theta_t$')
    ax.plot(time, S, 'b-', linewidth=2, alpha=0.7, label='Surprise $S_t$')

    # Fill region where S > theta
    ax.fill_between(time, theta, S, where=(S > theta),
                   alpha=0.3, color='green', label='$S_t > \\theta_t$')

    # Mark ignitions
    ignition_times = time[np.array(ignitions, dtype=bool)]
    if len(ignition_times) > 0:
        ignition_theta = theta[np.array(ignitions, dtype=bool)]
        ax.scatter(ignition_times, ignition_theta, c='orange', s=100,
                  marker='*', zorder=5, label='Ignition', edgecolors='black')

    ax.set_xlabel('Time (s)', fontsize=12)
    ax.set_ylabel('Activation', fontsize=12)
    ax.legend(loc='best', fontsize=10)
    ax.grid(True, alpha=0.3)
    ax.set_title('Threshold Dynamics: Homeostasis, Refractoriness & Urgency',
                fontsize=14, fontweight='bold')

    plt.tight_layout()
    return fig


def plot_psychometric_curve(epsilon_levels: np.ndarray,
                           detection_rates: np.ndarray,
                           figsize: Tuple[int, int] = (8, 6),
                           fit_sigmoid: bool = True) -> Figure:
    """
    Plot psychometric function from threshold staircase.

    Args:
        epsilon_levels: Array of stimulus intensities
        detection_rates: Array of detection rates
        figsize: Figure size
        fit_sigmoid: Whether to fit and plot sigmoid

    Returns:
        Matplotlib Figure
    """
    fig, ax = plt.subplots(1, 1, figsize=figsize)

    # Plot data
    ax.plot(epsilon_levels, detection_rates, 'o-', markersize=8,
           linewidth=2, label='Detection Rate', color='blue')

    # Fit sigmoid if requested
    if fit_sigmoid:
        from scipy.optimize import curve_fit

        def sigmoid(x, x0, k):
            return 1 / (1 + np.exp(-k * (x - x0)))

        try:
            # Initial guess
            x0_init = epsilon_levels[np.argmin(np.abs(detection_rates - 0.5))]
            popt, _ = curve_fit(sigmoid, epsilon_levels, detection_rates,
                              p0=[x0_init, 5.0], maxfev=10000)

            x_fit = np.linspace(epsilon_levels.min(), epsilon_levels.max(), 100)
            y_fit = sigmoid(x_fit, *popt)
            ax.plot(x_fit, y_fit, 'r--', linewidth=2,
                   label=f'Sigmoid fit (threshold={popt[0]:.3f})')

            # Mark 50% point
            ax.axhline(y=0.5, color='gray', linestyle=':', alpha=0.5)
            ax.axvline(x=popt[0], color='gray', linestyle=':', alpha=0.5)

        except Exception as e:
            print(f"Could not fit sigmoid: {e}")

    ax.set_xlabel('Prediction Error Magnitude $|\\epsilon_e|$', fontsize=12)
    ax.set_ylabel('Detection Rate', fontsize=12)
    ax.set_ylim(-0.05, 1.05)
    ax.grid(True, alpha=0.3)
    ax.legend(loc='best', fontsize=10)
    ax.set_title('Psychometric Function', fontsize=14, fontweight='bold')

    plt.tight_layout()
    return fig


def plot_dual_task(history: Dict[str, np.ndarray],
                  t1_onset: float,
                  t2_onset: float,
                  figsize: Tuple[int, int] = (12, 6)) -> Figure:
    """
    Specialized plot for dual-task / attentional blink simulations.

    Args:
        history: Simulation history
        t1_onset: First target onset time
        t2_onset: Second target onset time
        figsize: Figure size

    Returns:
        Matplotlib Figure
    """
    fig, axes = plt.subplots(2, 1, figsize=figsize, sharex=True)

    time = history['time']
    S = history['S']
    theta = history['theta']
    B = history['B']
    ignitions = history['ignitions']

    # Panel 1: Surprise and Threshold
    ax1 = axes[0]
    ax1.plot(time, S, 'b-', linewidth=2, label='Surprise $S_t$')
    ax1.plot(time, theta, 'r--', linewidth=2, label='Threshold $\\theta_t$')

    # Mark target onsets
    ax1.axvline(x=t1_onset, color='green', linestyle='--', alpha=0.5, label='T1')
    ax1.axvline(x=t2_onset, color='purple', linestyle='--', alpha=0.5, label='T2')

    # Mark ignitions
    ignition_times = time[np.array(ignitions, dtype=bool)]
    if len(ignition_times) > 0:
        ignition_S = S[np.array(ignitions, dtype=bool)]
        ax1.scatter(ignition_times, ignition_S, c='orange', s=100,
                   marker='*', zorder=5, label='Ignition', edgecolors='black')

    ax1.set_ylabel('Activation', fontsize=12)
    ax1.legend(loc='upper right', fontsize=10)
    ax1.grid(True, alpha=0.3)
    ax1.set_title('Dual-Task Trial: Attentional Blink / PRP',
                 fontsize=14, fontweight='bold')

    # Panel 2: Ignition Probability
    ax2 = axes[1]
    ax2.plot(time, B, 'g-', linewidth=2)
    ax2.fill_between(time, 0, B, alpha=0.3, color='green')
    ax2.axvline(x=t1_onset, color='green', linestyle='--', alpha=0.5)
    ax2.axvline(x=t2_onset, color='purple', linestyle='--', alpha=0.5)

    # Mark ignitions
    if len(ignition_times) > 0:
        ignition_B = B[np.array(ignitions, dtype=bool)]
        ax2.scatter(ignition_times, ignition_B, c='orange', s=100,
                   marker='*', zorder=5, edgecolors='black')

    ax2.set_xlabel('Time (s)', fontsize=12)
    ax2.set_ylabel('$B_t$', fontsize=12)
    ax2.set_ylim(-0.05, 1.05)
    ax2.grid(True, alpha=0.3)
    ax2.set_title('Ignition Probability', fontsize=12)

    plt.tight_layout()
    return fig


def plot_neuromodulator_effects(theta_base: float = 1.0,
                                kappa_NE: float = 0.30,
                                kappa_ACh: float = 0.15,
                                kappa_5HT: float = 0.425,
                                kappa_DA: float = 0.20,
                                figsize: Tuple[int, int] = (10, 6)) -> Figure:
    """
    Visualize effects of neuromodulators on baseline threshold.

    Args:
        theta_base: Baseline threshold
        kappa_NE: NE coefficient
        kappa_ACh: ACh coefficient
        kappa_5HT: 5-HT coefficient
        kappa_DA: DA coefficient
        figsize: Figure size

    Returns:
        Matplotlib Figure
    """
    fig, axes = plt.subplots(2, 2, figsize=figsize)

    levels = np.linspace(0, 1, 100)

    # NE effect
    ax = axes[0, 0]
    theta_NE = theta_base * np.exp(-kappa_NE * levels)
    ax.plot(levels, theta_NE, 'b-', linewidth=2)
    ax.axhline(y=theta_base, color='gray', linestyle='--', alpha=0.5)
    ax.set_xlabel('[NE]', fontsize=11)
    ax.set_ylabel('$\\theta_0$', fontsize=11)
    ax.set_title('Norepinephrine\n(threshold-lowering)', fontsize=11)
    ax.grid(True, alpha=0.3)

    # ACh effect
    ax = axes[0, 1]
    theta_ACh = theta_base * np.exp(-kappa_ACh * levels)
    ax.plot(levels, theta_ACh, 'g-', linewidth=2)
    ax.axhline(y=theta_base, color='gray', linestyle='--', alpha=0.5)
    ax.set_xlabel('[ACh]', fontsize=11)
    ax.set_ylabel('$\\theta_0$', fontsize=11)
    ax.set_title('Acetylcholine\n(threshold-lowering)', fontsize=11)
    ax.grid(True, alpha=0.3)

    # 5-HT effect
    ax = axes[1, 0]
    theta_5HT = theta_base * np.exp(kappa_5HT * levels)
    ax.plot(levels, theta_5HT, 'r-', linewidth=2)
    ax.axhline(y=theta_base, color='gray', linestyle='--', alpha=0.5)
    ax.set_xlabel('[5-HT]', fontsize=11)
    ax.set_ylabel('$\\theta_0$', fontsize=11)
    ax.set_title('Serotonin\n(threshold-raising)', fontsize=11)
    ax.grid(True, alpha=0.3)

    # DA effect
    ax = axes[1, 1]
    theta_DA = theta_base * np.exp(kappa_DA * levels)
    ax.plot(levels, theta_DA, 'm-', linewidth=2)
    ax.axhline(y=theta_base, color='gray', linestyle='--', alpha=0.5)
    ax.set_xlabel('[DA]', fontsize=11)
    ax.set_ylabel('$\\theta_0$', fontsize=11)
    ax.set_title('Dopamine\n(threshold-raising)', fontsize=11)
    ax.grid(True, alpha=0.3)

    plt.suptitle('Neuromodulator Effects on Baseline Threshold',
                fontsize=14, fontweight='bold')
    plt.tight_layout()

    return fig


def save_figure(fig: Figure, filename: str, dpi: int = 300):
    """
    Save figure to file.

    Args:
        fig: Matplotlib Figure
        filename: Output filename
        dpi: Resolution (dots per inch)
    """
    fig.savefig(filename, dpi=dpi, bbox_inches='tight')
    print(f"Saved figure to {filename}")

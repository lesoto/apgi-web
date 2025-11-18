"""
Basic APGI Ignition Examples

Demonstrates core phenomena:
1. Basic stimulus detection and ignition
2. Threshold crossing dynamics
3. Post-ignition refractoriness
"""

import numpy as np
import matplotlib.pyplot as plt
from apgi.core import APGIModel, STANDARD_PARAMS
from apgi.simulation import APGISimulation, pulse_stimulus
from apgi.visualization import plot_simulation, save_figure


def example_basic_ignition():
    """
    Example 1: Basic stimulus detection and ignition.

    Demonstrates:
    - Surprise accumulation
    - Threshold crossing
    - Ignition event
    """
    print("=" * 60)
    print("Example 1: Basic Ignition")
    print("=" * 60)

    # Create simulation
    sim = APGISimulation()

    # Run trial with moderate stimulus
    history = sim.run_trial(
        pre_stimulus=0.5,
        stimulus_duration=0.3,
        post_stimulus=1.0,
        Pi_e=1.0,
        epsilon_e=1.8,  # Moderate prediction error
        Pi_i=0.0,
        epsilon_i=0.0
    )

    # Visualize
    fig = plot_simulation(history, show_inputs=True)
    fig.suptitle('Example 1: Basic Ignition', fontsize=16, fontweight='bold', y=1.00)

    # Print statistics
    ignitions = history['ignitions']
    n_ignitions = np.sum(ignitions)
    if n_ignitions > 0:
        first_ignition_idx = np.where(ignitions)[0][0]
        first_ignition_time = history['time'][first_ignition_idx]
        print(f"  Ignition occurred at t = {first_ignition_time:.3f} s")
        print(f"  Number of ignition events: {n_ignitions}")
    else:
        print("  No ignition occurred")

    return fig


def example_threshold_comparison():
    """
    Example 2: Comparison of sub-threshold vs. supra-threshold stimuli.

    Demonstrates sigmoid transition from non-detection to detection.
    """
    print("\n" + "=" * 60)
    print("Example 2: Threshold Comparison")
    print("=" * 60)

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    epsilon_levels = [1.0, 1.5, 2.0, 2.5]  # Increasing stimulus intensities

    for idx, epsilon_e in enumerate(epsilon_levels):
        ax = axes[idx // 2, idx % 2]

        # Create simulation
        sim = APGISimulation()

        # Run trial
        history = sim.run_trial(
            pre_stimulus=0.5,
            stimulus_duration=0.2,
            post_stimulus=0.8,
            Pi_e=1.0,
            epsilon_e=epsilon_e,
            Pi_i=0.0,
            epsilon_i=0.0
        )

        # Plot
        time = history['time']
        S = history['S']
        theta = history['theta']
        B = history['B']
        ignitions = history['ignitions']

        ax.plot(time, S, 'b-', linewidth=2, label='$S_t$')
        ax.plot(time, theta, 'r--', linewidth=2, label='$\\theta_t$')

        # Mark ignitions
        ignition_times = time[np.array(ignitions, dtype=bool)]
        if len(ignition_times) > 0:
            ignition_S = S[np.array(ignitions, dtype=bool)]
            ax.scatter(ignition_times, ignition_S, c='orange', s=100,
                      marker='*', zorder=5, edgecolors='black')

        ax.set_xlabel('Time (s)', fontsize=10)
        ax.set_ylabel('Activation', fontsize=10)
        ax.set_title(f'$|\\epsilon_e|$ = {epsilon_e}', fontsize=11, fontweight='bold')
        ax.legend(loc='upper right', fontsize=9)
        ax.grid(True, alpha=0.3)

        # Print result
        if np.any(ignitions):
            print(f"  ε = {epsilon_e}: DETECTED (B_max = {np.max(B):.3f})")
        else:
            print(f"  ε = {epsilon_e}: not detected (B_max = {np.max(B):.3f})")

    fig.suptitle('Threshold Comparison: Sub- vs. Supra-threshold Stimuli',
                fontsize=14, fontweight='bold')
    plt.tight_layout()

    return fig


def example_refractoriness():
    """
    Example 3: Post-ignition refractoriness (Attentional Blink / PRP).

    Demonstrates:
    - Threshold elevation after ignition
    - Reduced detection of T2 when presented shortly after T1
    """
    print("\n" + "=" * 60)
    print("Example 3: Post-Ignition Refractoriness")
    print("=" * 60)

    fig, axes = plt.subplots(3, 1, figsize=(12, 10), sharex=True)

    # Test different SOAs (stimulus onset asynchronies)
    SOAs = [0.2, 0.4, 0.8]  # Short, medium, long

    for idx, SOA in enumerate(SOAs):
        ax = axes[idx]

        # Create simulation
        sim = APGISimulation()

        # Run dual-task trial
        t1_onset = 0.5
        t2_onset = t1_onset + SOA

        history = sim.run_dual_task(
            duration=3.0,
            t1_onset=t1_onset,
            t1_duration=0.1,
            t2_onset=t2_onset,
            t2_duration=0.1,
            Pi_e=1.0,
            epsilon_e=2.0
        )

        # Plot
        time = history['time']
        S = history['S']
        theta = history['theta']
        ignitions = history['ignitions']

        ax.plot(time, S, 'b-', linewidth=2, label='$S_t$')
        ax.plot(time, theta, 'r--', linewidth=2, label='$\\theta_t$')

        # Mark target onsets
        ax.axvline(x=t1_onset, color='green', linestyle='--', alpha=0.5, label='T1')
        ax.axvline(x=t2_onset, color='purple', linestyle='--', alpha=0.5, label='T2')

        # Mark ignitions
        ignition_times = time[np.array(ignitions, dtype=bool)]
        if len(ignition_times) > 0:
            ignition_S = S[np.array(ignitions, dtype=bool)]
            ax.scatter(ignition_times, ignition_S, c='orange', s=100,
                      marker='*', zorder=5, edgecolors='black', label='Ignition')

        ax.set_ylabel('Activation', fontsize=10)
        ax.set_title(f'SOA = {SOA * 1000:.0f} ms', fontsize=11, fontweight='bold')
        ax.legend(loc='upper right', fontsize=9)
        ax.grid(True, alpha=0.3)

        # Analyze T2 detection
        t2_window = (time >= t2_onset) & (time < t2_onset + 0.5)
        t2_ignited = np.any(ignitions[t2_window])

        print(f"  SOA = {SOA * 1000:.0f} ms: T2 {'DETECTED' if t2_ignited else 'MISSED'}")

    axes[-1].set_xlabel('Time (s)', fontsize=11)
    fig.suptitle('Post-Ignition Refractoriness: Attentional Blink',
                fontsize=14, fontweight='bold')
    plt.tight_layout()

    return fig


def example_psychometric_function():
    """
    Example 4: Psychometric function (detection threshold).

    Demonstrates sigmoid relationship between stimulus intensity and detection.
    """
    print("\n" + "=" * 60)
    print("Example 4: Psychometric Function")
    print("=" * 60)
    print("  Running staircase procedure (this may take a moment)...")

    # Create simulation
    sim = APGISimulation()

    # Run threshold staircase
    results = sim.run_threshold_staircase(
        epsilon_range=(0.5, 2.5),
        n_levels=15,
        trials_per_level=20,
        trial_duration=1.5,
        Pi_e=1.0
    )

    # Import plotting
    from apgi.visualization import plot_psychometric_curve

    fig = plot_psychometric_curve(
        np.array(results['epsilon_levels']),
        np.array(results['detection_rates']),
        fit_sigmoid=True
    )

    # Find approximate threshold (50% detection)
    detection_rates = np.array(results['detection_rates'])
    epsilon_levels = np.array(results['epsilon_levels'])
    threshold_idx = np.argmin(np.abs(detection_rates - 0.5))
    threshold = epsilon_levels[threshold_idx]

    print(f"  Approximate threshold (50% detection): ε ≈ {threshold:.3f}")

    return fig


def run_all_examples(save_figs: bool = False):
    """
    Run all basic examples.

    Args:
        save_figs: Whether to save figures to disk
    """
    print("\n" + "=" * 60)
    print("APGI BASIC IGNITION EXAMPLES")
    print("=" * 60)

    figures = []

    # Example 1
    fig1 = example_basic_ignition()
    figures.append(('basic_ignition.png', fig1))

    # Example 2
    fig2 = example_threshold_comparison()
    figures.append(('threshold_comparison.png', fig2))

    # Example 3
    fig3 = example_refractoriness()
    figures.append(('refractoriness.png', fig3))

    # Example 4
    fig4 = example_psychometric_function()
    figures.append(('psychometric_function.png', fig4))

    # Save if requested
    if save_figs:
        print("\n" + "=" * 60)
        print("Saving figures...")
        for filename, fig in figures:
            save_figure(fig, filename)

    print("\n" + "=" * 60)
    print("All examples completed!")
    print("=" * 60)

    plt.show()


if __name__ == '__main__':
    run_all_examples(save_figs=False)

"""
Neuromodulator Effects Examples

Demonstrates how neuromodulators modulate the ignition threshold and affect
conscious access.
"""

import numpy as np
import matplotlib.pyplot as plt
from apgi.core import APGIModel, NeuromodulatorState
from apgi.simulation import APGISimulation
from apgi.visualization import plot_simulation, plot_neuromodulator_effects


def example_neuromodulator_curves():
    """
    Example 1: Visualize neuromodulator effect curves.

    Shows how each neuromodulator affects the baseline threshold.
    """
    print("=" * 60)
    print("Example 1: Neuromodulator Effect Curves")
    print("=" * 60)

    fig = plot_neuromodulator_effects()

    print("  Threshold-lowering: NE, ACh (facilitate ignition)")
    print("  Threshold-raising: 5-HT, DA (stabilize, reduce false alarms)")

    return fig


def example_vigilance_states():
    """
    Example 2: Compare detection in different vigilance states.

    Demonstrates how neuromodulatory state affects detection of identical stimulus.
    """
    print("\n" + "=" * 60)
    print("Example 2: Vigilance State Effects")
    print("=" * 60)

    states = [
        NeuromodulatorState.RELAXED,
        NeuromodulatorState.BASELINE,
        NeuromodulatorState.HIGH_VIGILANCE,
        NeuromodulatorState.THREAT
    ]

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Fixed stimulus parameters
    Pi_e = 1.0
    epsilon_e = 1.5  # Moderate stimulus

    for idx, state in enumerate(states):
        ax = axes[idx // 2, idx % 2]

        # Create simulation with neuromodulator state
        sim = APGISimulation()
        sim.set_neuromodulator_state(state)

        # Run trial
        history = sim.run_trial(
            pre_stimulus=0.5,
            stimulus_duration=0.3,
            post_stimulus=1.0,
            Pi_e=Pi_e,
            epsilon_e=epsilon_e,
            Pi_i=0.0,
            epsilon_i=0.0
        )

        # Plot
        time = history['time']
        S = history['S']
        theta = history['theta']
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
        ax.set_title(state.value.replace('_', ' ').title(),
                    fontsize=11, fontweight='bold')
        ax.legend(loc='upper right', fontsize=9)
        ax.grid(True, alpha=0.3)

        # Print result
        detected = np.any(ignitions)
        theta_0 = theta[0]  # Initial threshold
        print(f"  {state.value:20s}: θ₀ = {theta_0:.3f}, {'DETECTED' if detected else 'not detected'}")

    fig.suptitle('Neuromodulatory State Effects on Detection (ε = 1.5)',
                fontsize=14, fontweight='bold')
    plt.tight_layout()

    return fig


def example_threat_response():
    """
    Example 3: Phasic neuromodulator response to threat.

    Demonstrates:
    - Urgency-based threshold lowering
    - Combined extero- and interoceptive input
    - NE burst facilitating rapid ignition
    """
    print("\n" + "=" * 60)
    print("Example 3: Threat Response with NE Burst")
    print("=" * 60)

    from apgi.simulation import threat_stimulus
    from apgi.core.neuromodulators import threat_response

    # Create simulation in baseline state
    sim = APGISimulation()

    # Create threat stimulus
    stimulus_fn = threat_stimulus(
        onset=0.5,
        ramp_duration=0.1,
        sustain_duration=0.3,
        max_epsilon_e=2.5,
        max_epsilon_i=1.2,
        Pi_e=1.0,
        Pi_i=1.2
    )

    # Neuromodulator function: inject NE burst at threat onset
    def neuromod_fn(t, simulation):
        if 0.5 <= t < 0.51:  # At threat onset
            simulation.inject_neuromodulator_event(threat_response())

    # Run simulation
    history = sim.run(
        duration=2.0,
        stimulus_fn=stimulus_fn,
        neuromod_fn=neuromod_fn,
        reset=True
    )

    # Visualize
    fig = plot_simulation(history, show_inputs=True)
    fig.suptitle('Example 3: Threat Response with LC-NE Burst',
                fontsize=16, fontweight='bold', y=1.00)

    # Print statistics
    ignitions = history['ignitions']
    if np.any(ignitions):
        first_ignition_idx = np.where(ignitions)[0][0]
        first_ignition_time = history['time'][first_ignition_idx]
        latency = first_ignition_time - 0.5  # Relative to threat onset
        print(f"  Threat detected at t = {first_ignition_time:.3f} s")
        print(f"  Detection latency: {latency * 1000:.1f} ms")
    else:
        print("  Threat not detected")

    return fig


def example_somatic_bias():
    """
    Example 4: Somatic bias parameter β.

    Demonstrates how β weights interoceptive vs. exteroceptive information.
    """
    print("\n" + "=" * 60)
    print("Example 4: Somatic Bias Effects")
    print("=" * 60)

    beta_values = [0.5, 1.0, 1.5, 2.0]  # Different somatic biases

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Mixed stimulus: moderate extero + intero
    Pi_e = 0.8
    epsilon_e = 1.0
    Pi_i = 0.8
    epsilon_i = 1.0

    for idx, beta in enumerate(beta_values):
        ax = axes[idx // 2, idx % 2]

        # Create model with specific beta
        model = APGIModel(beta=beta)
        sim = APGISimulation(model=model)

        # Run trial
        history = sim.run_trial(
            pre_stimulus=0.5,
            stimulus_duration=0.4,
            post_stimulus=1.0,
            Pi_e=Pi_e,
            epsilon_e=epsilon_e,
            Pi_i=Pi_i,
            epsilon_i=epsilon_i
        )

        # Plot
        time = history['time']
        S = history['S']
        theta = history['theta']
        ignitions = history['ignitions']

        # Compute weighted inputs
        extero_input = history['Pi_e'] * np.abs(history['epsilon_e'])
        intero_input = beta * history['Pi_i'] * np.abs(history['epsilon_i'])

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
        ax.set_title(f'β = {beta}', fontsize=11, fontweight='bold')
        ax.legend(loc='upper right', fontsize=9)
        ax.grid(True, alpha=0.3)

        # Print result
        detected = np.any(ignitions)
        max_S = np.max(S)
        print(f"  β = {beta:.1f}: max(S) = {max_S:.3f}, {'DETECTED' if detected else 'not detected'}")

    fig.suptitle('Somatic Bias: Interoceptive vs. Exteroceptive Weighting',
                fontsize=14, fontweight='bold')
    plt.tight_layout()

    print("\n  Higher β → Greater sensitivity to bodily signals")
    print("  Context-modulated by differential NE in insula/ACC vs. sensory cortices")

    return fig


def example_pharmacological_manipulation():
    """
    Example 5: Simulated pharmacological manipulations.

    Models effects of:
    - Propranolol (β-blocker, reduces NE effect)
    - SSRI (increases 5-HT)
    - L-DOPA (increases DA)
    """
    print("\n" + "=" * 60)
    print("Example 5: Pharmacological Manipulations")
    print("=" * 60)

    conditions = [
        ('Baseline', {'NE': 0.5, 'serotonin': 0.5, 'DA': 0.5}),
        ('Propranolol (↓NE effect)', {'NE': 0.2, 'serotonin': 0.5, 'DA': 0.5}),
        ('SSRI (↑5-HT)', {'NE': 0.5, 'serotonin': 0.8, 'DA': 0.5}),
        ('L-DOPA (↑DA)', {'NE': 0.5, 'serotonin': 0.5, 'DA': 0.8}),
    ]

    # Test across stimulus intensities
    epsilon_levels = np.linspace(0.8, 2.2, 10)

    fig, ax = plt.subplots(1, 1, figsize=(10, 7))

    for condition_name, neuromod_levels in conditions:
        detection_rates = []

        for epsilon_e in epsilon_levels:
            sim = APGISimulation()
            sim.model.set_neuromodulators(**neuromod_levels)

            # Run 20 trials per level
            detections = 0
            for _ in range(20):
                history = sim.run_trial(
                    pre_stimulus=0.5,
                    stimulus_duration=0.2,
                    post_stimulus=0.8,
                    Pi_e=1.0,
                    epsilon_e=epsilon_e,
                    Pi_i=0.0,
                    epsilon_i=0.0
                )
                if np.any(history['ignitions']):
                    detections += 1

            detection_rates.append(detections / 20)

        ax.plot(epsilon_levels, detection_rates, 'o-', linewidth=2,
               markersize=6, label=condition_name)

    ax.set_xlabel('Prediction Error $|\\epsilon_e|$', fontsize=12)
    ax.set_ylabel('Detection Rate', fontsize=12)
    ax.set_ylim(-0.05, 1.05)
    ax.grid(True, alpha=0.3)
    ax.legend(loc='lower right', fontsize=10)
    ax.set_title('Pharmacological Effects on Detection Threshold',
                fontsize=14, fontweight='bold')

    plt.tight_layout()

    print("  Propranolol (↓NE): Threshold increased (rightward shift)")
    print("  SSRI (↑5-HT): Threshold increased, reduced false alarms")
    print("  L-DOPA (↑DA): Threshold increased in reward/stable contexts")

    return fig


def run_all_examples(save_figs: bool = False):
    """
    Run all neuromodulator examples.

    Args:
        save_figs: Whether to save figures to disk
    """
    print("\n" + "=" * 60)
    print("APGI NEUROMODULATOR EFFECTS EXAMPLES")
    print("=" * 60)

    figures = []

    # Example 1
    fig1 = example_neuromodulator_curves()
    figures.append(('neuromod_curves.png', fig1))

    # Example 2
    fig2 = example_vigilance_states()
    figures.append(('vigilance_states.png', fig2))

    # Example 3
    fig3 = example_threat_response()
    figures.append(('threat_response.png', fig3))

    # Example 4
    fig4 = example_somatic_bias()
    figures.append(('somatic_bias.png', fig4))

    # Example 5
    fig5 = example_pharmacological_manipulation()
    figures.append(('pharmacological.png', fig5))

    # Save if requested
    if save_figs:
        print("\n" + "=" * 60)
        print("Saving figures...")
        from apgi.visualization import save_figure
        for filename, fig in figures:
            save_figure(fig, filename)

    print("\n" + "=" * 60)
    print("All examples completed!")
    print("=" * 60)

    plt.show()


if __name__ == '__main__':
    run_all_examples(save_figs=False)

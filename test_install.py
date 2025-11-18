#!/usr/bin/env python3
"""
Quick test to verify APGI installation and basic functionality.
"""

def test_imports():
    """Test that all modules can be imported"""
    print("Testing imports...")
    try:
        from apgi import APGIModel, APGISimulation, NeuromodulatorState
        from apgi.visualization import plot_simulation
        print("  ✓ All imports successful")
        return True
    except ImportError as e:
        print(f"  ✗ Import failed: {e}")
        return False


def test_basic_simulation():
    """Test that a basic simulation runs"""
    print("\nTesting basic simulation...")
    try:
        from apgi import APGISimulation

        sim = APGISimulation()
        history = sim.run_trial(
            pre_stimulus=0.1,
            stimulus_duration=0.1,
            post_stimulus=0.1,
            Pi_e=1.0,
            epsilon_e=2.0
        )

        # Check that history has expected keys
        expected_keys = ['time', 'S', 'theta', 'B', 'ignitions']
        for key in expected_keys:
            assert key in history, f"Missing key: {key}"

        print("  ✓ Basic simulation successful")
        return True
    except Exception as e:
        print(f"  ✗ Simulation failed: {e}")
        return False


def test_neuromodulation():
    """Test neuromodulator functionality"""
    print("\nTesting neuromodulator effects...")
    try:
        from apgi import APGISimulation, NeuromodulatorState

        sim = APGISimulation()
        sim.set_neuromodulator_state(NeuromodulatorState.HIGH_VIGILANCE)

        history = sim.run_trial(epsilon_e=1.5)

        print("  ✓ Neuromodulator effects work")
        return True
    except Exception as e:
        print(f"  ✗ Neuromodulation failed: {e}")
        return False


def main():
    print("=" * 60)
    print("APGI Installation Test")
    print("=" * 60)

    tests = [
        test_imports,
        test_basic_simulation,
        test_neuromodulation,
    ]

    results = [test() for test in tests]

    print("\n" + "=" * 60)
    if all(results):
        print("✓ All tests passed! APGI is ready to use.")
        print("=" * 60)
        return 0
    else:
        print("✗ Some tests failed. Please check the errors above.")
        print("=" * 60)
        return 1


if __name__ == '__main__':
    exit(main())

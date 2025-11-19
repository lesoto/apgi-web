#!/usr/bin/env python3
"""
APGI Tinker App - Comprehensive Test Execution Suite

This application executes ALL examples from the APGI theory repository,
providing detailed reporting, error handling, and performance metrics.

Usage:
    python tinker_app.py [options]

Options:
    --save-figs          Save all generated figures
    --outdir DIR         Output directory for figures (default: tinker_output)
    --format FMT         Figure format: png, pdf, svg (default: png)
    --dpi DPI            DPI for raster formats (default: 150)
    --continue-on-error  Continue execution even if tests fail
    --verbose            Verbose output with detailed logging
    --no-show            Don't display figures (headless mode)
    --report             Generate HTML test report
"""

import argparse
import sys
import time
import traceback
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Callable
import json


class TestResult:
    """Container for individual test results."""

    def __init__(self, name: str, group: str):
        self.name = name
        self.group = group
        self.status = "pending"  # pending, running, passed, failed, skipped
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.duration: Optional[float] = None
        self.error: Optional[str] = None
        self.error_traceback: Optional[str] = None
        self.figure_saved: bool = False
        self.figure_path: Optional[str] = None

    def start(self):
        """Mark test as started."""
        self.status = "running"
        self.start_time = time.time()

    def finish(self, success: bool, error: Optional[Exception] = None):
        """Mark test as finished."""
        self.end_time = time.time()
        self.duration = self.end_time - self.start_time
        self.status = "passed" if success else "failed"
        if error:
            self.error = str(error)
            self.error_traceback = traceback.format_exc()

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'name': self.name,
            'group': self.group,
            'status': self.status,
            'duration': self.duration,
            'error': self.error,
            'figure_saved': self.figure_saved,
            'figure_path': self.figure_path
        }


class TinkerApp:
    """Main tinker application for comprehensive APGI testing."""

    def __init__(self, args):
        self.args = args
        self.results: List[TestResult] = []
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.outdir = Path(args.outdir)

        # Set matplotlib backend if headless
        if args.no_show:
            import matplotlib
            matplotlib.use("Agg", force=True)

    def setup_output_directory(self):
        """Create output directory structure."""
        self.outdir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        (self.outdir / "figures").mkdir(exist_ok=True)
        (self.outdir / "logs").mkdir(exist_ok=True)
        (self.outdir / "reports").mkdir(exist_ok=True)

        if self.args.verbose:
            print(f"[INFO] Output directory: {self.outdir.absolute()}")

    def get_test_registry(self) -> Dict[str, Dict[str, Callable]]:
        """Get all available tests from the example modules."""
        from apgi.examples import basic_ignition as basic
        from apgi.examples import neuromodulator_effects as neuromod

        return {
            "basic": {
                "example_basic_ignition": basic.example_basic_ignition,
                "example_threshold_comparison": basic.example_threshold_comparison,
                "example_refractoriness": basic.example_refractoriness,
                "example_psychometric_function": basic.example_psychometric_function,
            },
            "neuromod": {
                "example_neuromodulator_curves": neuromod.example_neuromodulator_curves,
                "example_vigilance_states": neuromod.example_vigilance_states,
                "example_threat_response": neuromod.example_threat_response,
                "example_somatic_bias": neuromod.example_somatic_bias,
                "example_pharmacological_manipulation": neuromod.example_pharmacological_manipulation,
            },
        }

    def run_single_test(self, test_name: str, test_fn: Callable,
                       group: str) -> TestResult:
        """Execute a single test and capture results."""
        result = TestResult(test_name, group)
        result.start()

        if self.args.verbose:
            print(f"\n{'='*70}")
            print(f"[RUNNING] {group}:{test_name}")
            print(f"{'='*70}")
        else:
            print(f"[RUNNING] {group}:{test_name:40s} ... ", end='', flush=True)

        try:
            # Execute the test
            fig = test_fn()

            # Save figure if requested
            if self.args.save_figs and fig is not None:
                figure_name = f"{group}_{test_name}"
                figure_path = self.outdir / "figures" / f"{figure_name}.{self.args.format}"

                try:
                    fig.savefig(
                        str(figure_path),
                        dpi=self.args.dpi,
                        format=self.args.format,
                        bbox_inches="tight"
                    )
                    result.figure_saved = True
                    result.figure_path = str(figure_path)

                    if self.args.verbose:
                        print(f"[INFO] Figure saved: {figure_path}")
                except Exception as e:
                    if self.args.verbose:
                        print(f"[WARNING] Failed to save figure: {e}")

            # Close figure to free memory
            if fig is not None:
                import matplotlib.pyplot as plt
                plt.close(fig)

            result.finish(success=True)

            if self.args.verbose:
                print(f"[PASSED] Duration: {result.duration:.2f}s")
            else:
                print(f"PASSED ({result.duration:.2f}s)")

        except Exception as e:
            result.finish(success=False, error=e)

            if self.args.verbose:
                print(f"[FAILED] {e}")
                print(f"\nTraceback:")
                print(result.error_traceback)
            else:
                print(f"FAILED")
                print(f"  Error: {e}")

            if not self.args.continue_on_error:
                raise

        return result

    def run_all_tests(self):
        """Execute all available tests."""
        self.start_time = time.time()

        print("\n" + "="*70)
        print("APGI COMPREHENSIVE TINKER APP")
        print("Executing ALL Tests")
        print("="*70)
        print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Output directory: {self.outdir.absolute()}")
        print(f"Save figures: {self.args.save_figs}")
        print(f"Continue on error: {self.args.continue_on_error}")
        print("="*70)

        # Get all tests
        registry = self.get_test_registry()

        # Count total tests
        total_tests = sum(len(tests) for tests in registry.values())
        print(f"\nTotal tests to run: {total_tests}")

        # Run all tests
        test_count = 0
        for group_name, tests in registry.items():
            print(f"\n{'#'*70}")
            print(f"# GROUP: {group_name.upper()}")
            print(f"# Tests: {len(tests)}")
            print(f"{'#'*70}")

            for test_name, test_fn in tests.items():
                test_count += 1
                print(f"\n[{test_count}/{total_tests}] ", end='')

                result = self.run_single_test(test_name, test_fn, group_name)
                self.results.append(result)

        self.end_time = time.time()

    def generate_summary(self) -> Dict:
        """Generate summary statistics."""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == "passed")
        failed = sum(1 for r in self.results if r.status == "failed")
        skipped = sum(1 for r in self.results if r.status == "skipped")

        total_duration = self.end_time - self.start_time if self.end_time else 0

        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'skipped': skipped,
            'pass_rate': (passed / total * 100) if total > 0 else 0,
            'total_duration': total_duration,
            'timestamp': datetime.now().isoformat(),
            'results': [r.to_dict() for r in self.results]
        }

    def print_summary(self):
        """Print summary to console."""
        summary = self.generate_summary()

        print("\n" + "="*70)
        print("TEST EXECUTION SUMMARY")
        print("="*70)
        print(f"Total tests:     {summary['total']}")
        print(f"Passed:          {summary['passed']} ({summary['pass_rate']:.1f}%)")
        print(f"Failed:          {summary['failed']}")
        print(f"Skipped:         {summary['skipped']}")
        print(f"Total duration:  {summary['total_duration']:.2f}s")
        print("="*70)

        # Show failed tests
        if summary['failed'] > 0:
            print("\nFAILED TESTS:")
            for result in self.results:
                if result.status == "failed":
                    print(f"  ✗ {result.group}:{result.name}")
                    print(f"    Error: {result.error}")

        # Show timing breakdown
        print("\nTIMING BREAKDOWN:")
        for result in self.results:
            status_icon = "✓" if result.status == "passed" else "✗"
            duration = result.duration if result.duration else 0
            print(f"  {status_icon} {result.group}:{result.name:40s} {duration:6.2f}s")

        print("\n" + "="*70)
        print(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)

    def save_json_report(self):
        """Save JSON report to disk."""
        summary = self.generate_summary()

        report_path = self.outdir / "reports" / "test_results.json"

        with open(report_path, 'w') as f:
            json.dump(summary, f, indent=2)

        print(f"\n[INFO] JSON report saved: {report_path}")

    def save_html_report(self):
        """Generate HTML test report."""
        summary = self.generate_summary()

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APGI Tinker App Test Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-card.passed {{
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        }}
        .stat-card.failed {{
            background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
        }}
        .stat-card h3 {{
            margin: 0;
            font-size: 2em;
        }}
        .stat-card p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #667eea;
            color: white;
            font-weight: bold;
        }}
        tr:hover {{
            background-color: #f5f5f5;
        }}
        .status-passed {{
            color: #4CAF50;
            font-weight: bold;
        }}
        .status-failed {{
            color: #f44336;
            font-weight: bold;
        }}
        .error-detail {{
            background-color: #fff3cd;
            border-left: 4px solid #ff9800;
            padding: 10px;
            margin: 5px 0;
            font-family: monospace;
            font-size: 0.9em;
        }}
        .timestamp {{
            color: #666;
            font-size: 0.9em;
            text-align: right;
        }}
        .progress-bar {{
            width: 100%;
            height: 30px;
            background-color: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 APGI Tinker App - Test Report</h1>
        <p class="timestamp">Generated: {summary['timestamp']}</p>

        <div class="progress-bar">
            <div class="progress-fill" style="width: {summary['pass_rate']:.1f}%">
                {summary['pass_rate']:.1f}% Pass Rate
            </div>
        </div>

        <div class="summary">
            <div class="stat-card">
                <h3>{summary['total']}</h3>
                <p>Total Tests</p>
            </div>
            <div class="stat-card passed">
                <h3>{summary['passed']}</h3>
                <p>Passed</p>
            </div>
            <div class="stat-card failed">
                <h3>{summary['failed']}</h3>
                <p>Failed</p>
            </div>
            <div class="stat-card">
                <h3>{summary['total_duration']:.2f}s</h3>
                <p>Total Duration</p>
            </div>
        </div>

        <h2>Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Group</th>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration (s)</th>
                    <th>Figure Saved</th>
                </tr>
            </thead>
            <tbody>
"""

        for result in self.results:
            status_class = f"status-{result.status}"
            status_text = result.status.upper()
            duration = f"{result.duration:.2f}" if result.duration else "N/A"
            figure_icon = "✓" if result.figure_saved else "✗"

            html += f"""
                <tr>
                    <td>{result.group}</td>
                    <td>{result.name}</td>
                    <td class="{status_class}">{status_text}</td>
                    <td>{duration}</td>
                    <td>{figure_icon}</td>
                </tr>
"""

            if result.error:
                html += f"""
                <tr>
                    <td colspan="5">
                        <div class="error-detail">
                            <strong>Error:</strong> {result.error}
                        </div>
                    </td>
                </tr>
"""

        html += """
            </tbody>
        </table>

        <h2>System Information</h2>
        <ul>
            <li><strong>Python Version:</strong> """ + sys.version.split()[0] + """</li>
            <li><strong>Output Directory:</strong> """ + str(self.outdir.absolute()) + """</li>
            <li><strong>Figure Format:</strong> """ + self.args.format + """</li>
            <li><strong>DPI:</strong> """ + str(self.args.dpi) + """</li>
        </ul>
    </div>
</body>
</html>
"""

        report_path = self.outdir / "reports" / "test_report.html"

        with open(report_path, 'w') as f:
            f.write(html)

        print(f"[INFO] HTML report saved: {report_path}")

    def run(self):
        """Main execution method."""
        try:
            self.setup_output_directory()
            self.run_all_tests()
            self.print_summary()
            self.save_json_report()

            if self.args.report:
                self.save_html_report()

            # Show final status
            summary = self.generate_summary()

            if summary['failed'] == 0:
                print("\n✓ All tests passed!")
                return 0
            else:
                print(f"\n✗ {summary['failed']} test(s) failed")
                return 1

        except KeyboardInterrupt:
            print("\n\n[INTERRUPTED] Test execution interrupted by user")
            return 130
        except Exception as e:
            print(f"\n\n[ERROR] Fatal error: {e}")
            traceback.print_exc()
            return 1


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="APGI Tinker App - Comprehensive Test Execution Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all tests with default settings
  python tinker_app.py

  # Run all tests and save figures
  python tinker_app.py --save-figs

  # Run with detailed logging and HTML report
  python tinker_app.py --verbose --report --save-figs

  # Headless execution (no figure display)
  python tinker_app.py --no-show --save-figs --report

  # Custom output directory and format
  python tinker_app.py --save-figs --outdir results --format pdf --dpi 300
        """
    )

    parser.add_argument(
        '--save-figs',
        action='store_true',
        help='Save all generated figures to disk'
    )
    parser.add_argument(
        '--outdir',
        type=str,
        default='tinker_output',
        help='Output directory for all results (default: tinker_output)'
    )
    parser.add_argument(
        '--format',
        choices=['png', 'pdf', 'svg'],
        default='png',
        help='Figure format when saving (default: png)'
    )
    parser.add_argument(
        '--dpi',
        type=int,
        default=150,
        help='DPI for raster figure formats (default: 150)'
    )
    parser.add_argument(
        '--continue-on-error',
        action='store_true',
        help='Continue execution even if individual tests fail'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output with detailed logging'
    )
    parser.add_argument(
        '--no-show',
        action='store_true',
        help='Do not display figures (headless mode)'
    )
    parser.add_argument(
        '--report',
        action='store_true',
        help='Generate HTML test report'
    )

    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    app = TinkerApp(args)
    return app.run()


if __name__ == '__main__':
    sys.exit(main())

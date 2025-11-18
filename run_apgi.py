import argparse
import sys
from pathlib import Path


def registry():
    # Import example modules lazily so we can set matplotlib backend first
    from apgi.examples import basic_ignition as basic
    from apgi.examples import neuromodulator_effects as neuromod

    return {
        "basic": {
            "example_basic_ignition": basic.example_basic_ignition,
            "example_threshold_comparison": basic.example_threshold_comparison,
            "example_refractoriness": basic.example_refractoriness,
            "example_psychometric_function": basic.example_psychometric_function,
            "run_all": lambda save_figs: basic.run_all_examples(save_figs=save_figs),
        },
        "neuromod": {
            "example_neuromodulator_curves": neuromod.example_neuromodulator_curves,
            "example_vigilance_states": neuromod.example_vigilance_states,
            "example_threat_response": neuromod.example_threat_response,
            "example_somatic_bias": neuromod.example_somatic_bias,
            "example_pharmacological_manipulation": neuromod.example_pharmacological_manipulation,
            "run_all": lambda save_figs: neuromod.run_all_examples(save_figs=save_figs),
        },
    }


def list_examples():
    reg = registry()
    lines = []
    for group, items in reg.items():
        names = [k for k in items.keys() if k != "run_all"]
        for name in sorted(names):
            lines.append(f"{group}:{name}")
    return "\n".join(sorted(lines))


def parse_args(argv):
    p = argparse.ArgumentParser(prog="run_apgi", description="Run APGI demos and options showcase")
    gx = p.add_mutually_exclusive_group()
    gx.add_argument("--group", choices=["basic", "neuromod", "all"], help="Run a group of demos")
    gx.add_argument("--examples", help="Comma-separated list of examples to run. Use 'group:name' from --list")
    p.add_argument("--list", action="store_true", help="List all available examples and exit")
    p.add_argument("--save-figs", action="store_true", help="Save figures to disk")
    p.add_argument("--outdir", type=Path, default=Path("figures"), help="Output directory for saved figures")
    p.add_argument("--format", choices=["png", "pdf", "svg"], default="png", help="Figure format when saving")
    p.add_argument("--dpi", type=int, default=150, help="DPI for saved figures (raster formats)")
    p.add_argument("--no-show", action="store_true", help="Do not display figures (headless run)")
    return p.parse_args(argv)


def ensure_outdir(path: Path):
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)


def save_if_requested(fig, name: str, outdir: Path, fmt: str, dpi: int):
    filename = f"{name}.{fmt}"
    dest = outdir / filename
    # Use matplotlib's native savefig to avoid extra dependencies
    try:
        fig.savefig(str(dest), dpi=dpi, format=fmt, bbox_inches="tight")
    except Exception as e:
        print(f"Failed to save {dest}: {e}")


def run_selected_examples(example_names, save_figs: bool, outdir: Path, fmt: str, dpi: int):
    reg = registry()
    for full in example_names:
        if ":" not in full:
            print(f"Skipping '{full}' (expected 'group:name'). Use --list to see options.")
            continue
        group, name = full.split(":", 1)
        if group not in reg or name not in reg[group]:
            print(f"Unknown example '{full}'. Use --list to see options.")
            continue
        fn = reg[group][name]
        fig = fn()
        if save_figs:
            ensure_outdir(outdir)
            save_if_requested(fig, f"{group}_{name}", outdir, fmt, dpi)


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    args = parse_args(argv)

    if args.list:
        print(list_examples())
        return 0

    # If headless requested, force non-interactive backend before importing any pyplot
    if args.no_show:
        import matplotlib
        matplotlib.use("Agg", force=True)

    reg = registry()

    if args.group:
        if args.group == "all":
            ran_any = False
            for group in ("basic", "neuromod"):
                if "run_all" in reg[group]:
                    reg[group]["run_all"](save_figs=args.save_figs)
                    ran_any = True
            if not ran_any:
                print("No groups found to run.")
            return 0
        else:
            reg[args.group]["run_all"](save_figs=args.save_figs)
            return 0

    if args.examples:
        names = [s.strip() for s in args.examples.split(",") if s.strip()]
        run_selected_examples(names, args.save_figs, args.outdir, args.format, args.dpi)
        if not args.no_show:
            import matplotlib.pyplot as plt
            plt.show()
        return 0

    print("No action specified. Use --group, --examples, or --list. Try: --group all")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

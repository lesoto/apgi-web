#!/usr/bin/env python3
import sys
import threading
import traceback
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Callable, List, Optional
from datetime import datetime
import contextlib
import io

import tkinter as tk
from tkinter import ttk, filedialog, messagebox

# Lazy imports inside runners for matplotlib-dependent code


@dataclass
class GUIOptions:
    save_figs: bool = False
    outdir: Path = Path("tinker_output")
    fmt: str = "png"
    dpi: int = 150
    continue_on_error: bool = False
    verbose: bool = False
    no_show: bool = False
    report: bool = False


class APGIGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("APGI Theory - Tinker GUI")
        self.geometry("1000x700")
        self.minsize(900, 600)

        self.options = GUIOptions()
        self._build_menu()
        self._build_layout()
        self._load_registry()

        # worker thread handle
        self.worker: Optional[threading.Thread] = None
        self.running = False
        self.current_log_file: Optional[io.TextIOBase] = None

    # UI construction
    def _build_menu(self):
        menubar = tk.Menu(self)

        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Run All (Comprehensive)", command=self.run_all_tinker)
        file_menu.add_separator()
        file_menu.add_command(label="Run Selected Examples", command=self.run_selected_examples)
        file_menu.add_command(label="Run Group: basic", command=lambda: self.run_group("basic"))
        file_menu.add_command(label="Run Group: neuromod", command=lambda: self.run_group("neuromod"))
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.destroy)
        menubar.add_cascade(label="File", menu=file_menu)

        opts_menu = tk.Menu(menubar, tearoff=0)
        self.var_save = tk.BooleanVar(value=self.options.save_figs)
        self.var_verbose = tk.BooleanVar(value=self.options.verbose)
        self.var_continue = tk.BooleanVar(value=self.options.continue_on_error)
        self.var_no_show = tk.BooleanVar(value=self.options.no_show)
        self.var_report = tk.BooleanVar(value=self.options.report)

        opts_menu.add_checkbutton(label="Save Figures", variable=self.var_save, command=self._sync_options)
        opts_menu.add_checkbutton(label="Verbose", variable=self.var_verbose, command=self._sync_options)
        opts_menu.add_checkbutton(label="Continue on Error", variable=self.var_continue, command=self._sync_options)
        opts_menu.add_checkbutton(label="Headless (no show)", variable=self.var_no_show, command=self._sync_options)
        opts_menu.add_checkbutton(label="Generate HTML Report (Tinker)", variable=self.var_report, command=self._sync_options)
        opts_menu.add_separator()
        opts_menu.add_command(label="Choose Output Folder...", command=self.choose_outdir)

        fmt_menu = tk.Menu(opts_menu, tearoff=0)
        for fmt in ("png", "pdf", "svg"):
            fmt_menu.add_command(label=fmt, command=lambda f=fmt: self._set_format(f))
        opts_menu.add_cascade(label=f"Format: {self.options.fmt}", menu=fmt_menu)
        self._opts_menu_fmt = opts_menu  # keep ref to update label

        dpi_menu = tk.Menu(opts_menu, tearoff=0)
        for dpi in (100, 150, 200, 300):
            dpi_menu.add_command(label=str(dpi), command=lambda d=dpi: self._set_dpi(d))
        opts_menu.add_cascade(label=f"DPI: {self.options.dpi}", menu=dpi_menu)
        self._opts_menu_dpi = opts_menu

        menubar.add_cascade(label="Options", menu=opts_menu)

        view_menu = tk.Menu(menubar, tearoff=0)
        view_menu.add_command(label="List Examples", command=self.show_examples_dialog)
        view_menu.add_separator()
        view_menu.add_command(label="Open Output Folder", command=self.open_outdir)
        view_menu.add_command(label="Open HTML Report", command=self.open_html_report)
        menubar.add_cascade(label="View", menu=view_menu)

        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="About", command=lambda: messagebox.showinfo(
            "About", "APGI Theory - Tinker GUI\nRun demos, save figures, and generate reports."))
        menubar.add_cascade(label="Help", menu=help_menu)

        self.config(menu=menubar)

    def _build_layout(self):
        root = ttk.Frame(self)
        root.pack(fill=tk.BOTH, expand=True)

        # Top controls
        top = ttk.Frame(root)
        top.pack(fill=tk.X, padx=10, pady=10)

        ttk.Label(top, text="Output:").pack(side=tk.LEFT)
        self.outdir_var = tk.StringVar(value=str(self.options.outdir))
        self.entry_outdir = ttk.Entry(top, textvariable=self.outdir_var, width=50)
        self.entry_outdir.pack(side=tk.LEFT, padx=5)
        ttk.Button(top, text="Browse...", command=self.choose_outdir).pack(side=tk.LEFT)
        ttk.Separator(root, orient=tk.HORIZONTAL).pack(fill=tk.X)

        # Middle split: left examples, right log
        mid = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
        mid.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Left: example tree with checkboxes (simulate via selected listbox)
        left = ttk.Frame(mid)
        ttk.Label(left, text="Examples").pack(anchor=tk.W)
        self.examples_tree = ttk.Treeview(left, columns=("type",), show="tree")
        self.examples_tree.pack(fill=tk.BOTH, expand=True)
        self.examples_tree.bind("<Double-1>", self._toggle_example_selected)
        mid.add(left, weight=1)

        # Right: log and result
        right = ttk.Frame(mid)
        ttk.Label(right, text="Logs").pack(anchor=tk.W)
        self.log_text = tk.Text(right, height=15, wrap="word")
        self.log_text.pack(fill=tk.BOTH, expand=True)

        # Progress
        bottom = ttk.Frame(root)
        bottom.pack(fill=tk.X, padx=10, pady=5)
        self.progress = ttk.Progressbar(bottom, mode="determinate")
        self.progress.pack(fill=tk.X, expand=True)

        # Buttons
        btns = ttk.Frame(root)
        btns.pack(fill=tk.X, padx=10, pady=10)
        ttk.Button(btns, text="Run All (Comprehensive)", command=self.run_all_tinker).pack(side=tk.LEFT)
        ttk.Button(btns, text="Run Group: basic", command=lambda: self.run_group("basic")).pack(side=tk.LEFT, padx=5)
        ttk.Button(btns, text="Run Group: neuromod", command=lambda: self.run_group("neuromod")).pack(side=tk.LEFT, padx=5)
        ttk.Button(btns, text="Run Selected", command=self.run_selected_examples).pack(side=tk.LEFT, padx=5)

    # Registry and examples
    def _load_registry(self):
        try:
            from run_apgi import registry  # local module in project root
            self.registry: Dict[str, Dict[str, Callable]] = registry()
        except Exception as e:
            self._log(f"Failed to load registry: {e}\n{traceback.format_exc()}")
            self.registry = {"basic": {}, "neuromod": {}}
        self._populate_examples()

    def _populate_examples(self):
        self.examples_tree.delete(*self.examples_tree.get_children())
        for group, items in self.registry.items():
            group_id = self.examples_tree.insert("", tk.END, text=group, open=True)
            for name, fn in items.items():
                if name == "run_all":
                    continue
                self.examples_tree.insert(group_id, tk.END, text=name, values=("example",))

    def _toggle_example_selected(self, event=None):
        # On double-click, toggle a tag to show selection
        sel = self.examples_tree.selection()
        for iid in sel:
            tags = set(self.examples_tree.item(iid, "tags"))
            if "selected" in tags:
                tags.discard("selected")
                self.examples_tree.tag_configure("selected", background="")
            else:
                tags.add("selected")
                self.examples_tree.tag_configure("selected", background="#d7ebff")
            self.examples_tree.item(iid, tags=list(tags))

    # Options sync
    def _sync_options(self):
        self.options.save_figs = bool(self.var_save.get())
        self.options.verbose = bool(self.var_verbose.get())
        self.options.continue_on_error = bool(self.var_continue.get())
        self.options.no_show = bool(self.var_no_show.get())
        self.options.report = bool(self.var_report.get())

    def _set_format(self, fmt: str):
        self.options.fmt = fmt
        # Rebuild the Options menu labels
        self._build_menu()

    def _set_dpi(self, dpi: int):
        self.options.dpi = int(dpi)
        self._build_menu()

    def choose_outdir(self):
        path = filedialog.askdirectory(initialdir=str(self.options.outdir))
        if path:
            self.options.outdir = Path(path)
            self.outdir_var.set(str(self.options.outdir))

    # Handy actions
    def show_examples_dialog(self):
        try:
            from run_apgi import list_examples
            text = list_examples()
        except Exception as e:
            text = f"Failed to list examples: {e}"
        messagebox.showinfo("Available Examples", text)

    def open_outdir(self):
        path = Path(self.outdir_var.get()).resolve()
        path.mkdir(parents=True, exist_ok=True)
        try:
            if sys.platform.startswith("win"):
                import os
                os.startfile(str(path))  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                import subprocess
                subprocess.run(["open", str(path)])
            else:
                import subprocess
                subprocess.run(["xdg-open", str(path)])
        except Exception as e:
            messagebox.showerror("Error", f"Could not open folder: {e}")

    def open_html_report(self):
        report = Path(self.outdir_var.get()) / "reports" / "test_report.html"
        if not report.exists():
            messagebox.showwarning("Missing", f"Report not found:\n{report}")
            return
        try:
            if sys.platform.startswith("win"):
                import os
                os.startfile(str(report))  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                import subprocess
                subprocess.run(["open", str(report)])
            else:
                import subprocess
                subprocess.run(["xdg-open", str(report)])
        except Exception as e:
            messagebox.showerror("Error", f"Could not open report: {e}")

    # Logging helpers
    def _log(self, msg: str):
        self.log_text.insert(tk.END, msg + "\n")
        self.log_text.see(tk.END)
        self.update_idletasks()

    def _ensure_outdirs(self) -> Path:
        base = Path(self.outdir_var.get()).resolve()
        (base).mkdir(parents=True, exist_ok=True)
        (base / "figures").mkdir(parents=True, exist_ok=True)
        (base / "logs").mkdir(parents=True, exist_ok=True)
        (base / "reports").mkdir(parents=True, exist_ok=True)
        return base

    def _open_log(self) -> io.TextIOBase:
        outdir = self._ensure_outdirs()
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = outdir / "logs" / f"run_{ts}.log"
        f = open(log_path, "a", encoding="utf-8")
        self._log(f"Logging to: {log_path}")
        return f

    def _set_running(self, value: bool):
        self.running = value
        state = tk.DISABLED if value else tk.NORMAL
        for child in self.winfo_children():
            # keep log usable
            pass
        # Disable menu items/buttons selectively could be added here if needed

    # Runners
    def run_all_tinker(self):
        if self.running:
            return
        self._sync_options()
        self._set_running(True)
        self.progress.configure(mode="indeterminate")
        self.progress.start(10)

        def worker():
            try:
                log_file = self._open_log()
                class Tee(io.TextIOBase):
                    def __init__(self, gui, f):
                        self.gui = gui
                        self.f = f
                    def write(self, s):
                        if s:
                            self.f.write(s)
                            for line in s.splitlines():
                                if line.strip():
                                    self.gui._log(line)
                        return len(s)
                    def flush(self):
                        try:
                            self.f.flush()
                        except Exception:
                            pass
                # Prepare args-like for TinkerApp
                class A:
                    save_figs = self.options.save_figs
                    outdir = str(self.options.outdir)
                    format = self.options.fmt
                    dpi = self.options.dpi
                    continue_on_error = self.options.continue_on_error
                    verbose = self.options.verbose
                    no_show = self.options.no_show
                    report = self.options.report

                from tinker_app import TinkerApp
                app = TinkerApp(A)
                tee = Tee(self, log_file)
                with contextlib.redirect_stdout(tee), contextlib.redirect_stderr(tee):
                    code = app.run()
                self._log(f"Tinker run completed with exit code {code}")
            except Exception as e:
                self._log(f"[ERROR] {e}\n{traceback.format_exc()}")
            finally:
                try:
                    if log_file:
                        log_file.close()
                except Exception:
                    pass
                self.after(0, self._finish_worker)

        self.worker = threading.Thread(target=worker, daemon=True)
        self.worker.start()

    def run_group(self, group: str):
        if self.running:
            return
        self._sync_options()
        self._set_running(True)
        self.progress.configure(mode="indeterminate")
        self.progress.start(10)

        def worker():
            try:
                log_file = self._open_log()
                class Tee(io.TextIOBase):
                    def __init__(self, gui, f):
                        self.gui = gui
                        self.f = f
                    def write(self, s):
                        if s:
                            self.f.write(s)
                            for line in s.splitlines():
                                if line.strip():
                                    self.gui._log(line)
                        return len(s)
                    def flush(self):
                        try:
                            self.f.flush()
                        except Exception:
                            pass
                tee = Tee(self, log_file)
                if self.options.no_show:
                    import matplotlib
                    matplotlib.use("Agg", force=True)
                from run_apgi import registry
                reg = registry()
                if group not in reg:
                    self._log(f"Group '{group}' not available")
                else:
                    with contextlib.redirect_stdout(tee), contextlib.redirect_stderr(tee):
                        self._log(f"Running group: {group}")
                        items = [(k, v) for k, v in reg[group].items() if k != "run_all"]
                        base = self._ensure_outdirs()
                        for name, fn in items:
                            self._log(f"Running {group}:{name} ...")
                            fig = fn()
                            if self.options.save_figs and fig is not None:
                                figdir = base / "figures"
                                try:
                                    fig.savefig(str(figdir / f"{group}_{name}.{self.options.fmt}"),
                                                dpi=self.options.dpi,
                                                format=self.options.fmt,
                                                bbox_inches="tight")
                                except Exception as e:
                                    self._log(f"Failed to save figure: {e}")
                            if fig is not None:
                                import matplotlib.pyplot as plt
                                plt.close(fig)
                        self._log("Done.")
            except Exception as e:
                self._log(f"[ERROR] {e}\n{traceback.format_exc()}")
            finally:
                try:
                    if log_file:
                        log_file.close()
                except Exception:
                    pass
                self.after(0, self._finish_worker)

        self.worker = threading.Thread(target=worker, daemon=True)
        self.worker.start()

    def run_selected_examples(self):
        if self.running:
            return
        self._sync_options()
        # Collect selected example ids
        selected: List[str] = []
        for group_iid in self.examples_tree.get_children(""):
            group = self.examples_tree.item(group_iid, "text")
            for iid in self.examples_tree.get_children(group_iid):
                tags = set(self.examples_tree.item(iid, "tags"))
                if "selected" in tags:
                    name = self.examples_tree.item(iid, "text")
                    selected.append(f"{group}:{name}")
        if not selected:
            messagebox.showinfo("Run Selected", "Double-click examples to select them, then try again.")
            return

        self._set_running(True)
        self.progress.configure(maximum=len(selected), mode="determinate", value=0)

        def worker():
            try:
                if self.options.no_show:
                    import matplotlib
                    matplotlib.use("Agg", force=True)
                from run_apgi import registry
                log_file = self._open_log()
                class Tee(io.TextIOBase):
                    def __init__(self, gui, f):
                        self.gui = gui
                        self.f = f
                    def write(self, s):
                        if s:
                            self.f.write(s)
                            for line in s.splitlines():
                                if line.strip():
                                    self.gui._log(line)
                        return len(s)
                    def flush(self):
                        try:
                            self.f.flush()
                        except Exception:
                            pass
                tee = Tee(self, log_file)
                reg = registry()
                count = 0
                base = self._ensure_outdirs()
                with contextlib.redirect_stdout(tee), contextlib.redirect_stderr(tee):
                    for full in selected:
                        try:
                            group, name = full.split(":", 1)
                            fn = reg[group][name]
                            self._log(f"Running {full} ...")
                            fig = fn()
                            if self.options.save_figs and fig is not None:
                                figdir = base / "figures"
                                try:
                                    fig.savefig(str(figdir / f"{group}_{name}.{self.options.fmt}"),
                                                dpi=self.options.dpi,
                                                format=self.options.fmt,
                                                bbox_inches="tight")
                                except Exception as e:
                                    self._log(f"Failed to save figure: {e}")
                            if fig is not None:
                                import matplotlib.pyplot as plt
                                plt.close(fig)
                        except Exception as ie:
                            self._log(f"[FAILED] {full}: {ie}")
                            if not self.options.continue_on_error:
                                break
                        finally:
                            count += 1
                            self.after(0, lambda c=count: self.progress.configure(value=c))
                # Show figures if not headless
                if not self.options.no_show:
                    try:
                        import matplotlib.pyplot as plt
                        plt.show()
                    except Exception:
                        pass
                self._log("Selected runs complete.")
            except Exception as e:
                self._log(f"[ERROR] {e}\n{traceback.format_exc()}")
            finally:
                try:
                    if log_file:
                        log_file.close()
                except Exception:
                    pass
                self.after(0, self._finish_worker)

        self.worker = threading.Thread(target=worker, daemon=True)
        self.worker.start()

    def _finish_worker(self):
        self.progress.stop()
        self.progress.configure(value=0, mode="determinate")
        self._set_running(False)


def main():
    app = APGIGUI()
    app.mainloop()


if __name__ == "__main__":
    main()

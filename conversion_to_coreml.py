"""
Core ML Conversion for APGI v2.0.1 - FIXED
===========================================
"""

import torch
import torch.nn as nn
import coremltools as ct
from typing import Tuple
import traceback
import os
import numpy as np


class StaticAPGIForMobile(nn.Module):
    """
    Simplified APGI network with NO dynamic control flow.
    Designed specifically for Core ML export.
    """
    
    def __init__(self, input_size: int = 64, hidden_size: int = 128, num_levels: int = 3):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_levels = num_levels
        
        # Precision estimation
        self.precision_net = nn.Sequential(
            nn.Linear(input_size * 2 + hidden_size + 5, 128),
            nn.ReLU(),
            nn.Linear(128, 2),
            nn.Softplus()
        )
        
        # Prediction networks
        self.intero_predictor = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),
            nn.ReLU(),
            nn.Linear(64, input_size)
        )
        
        self.extero_predictor = nn.Sequential(
            nn.Linear(hidden_size * 2, 64),
            nn.ReLU(),
            nn.Linear(64, input_size)
        )
        
        # Hierarchical state update
        self.state_updater = nn.Sequential(
            nn.Linear(input_size + hidden_size, 64),
            nn.ReLU(),
            nn.Linear(64, hidden_size),
            nn.Tanh()
        )
        
        # Workspace integration
        self.workspace_net = nn.Sequential(
            nn.Linear(hidden_size * 2, 128),
            nn.ReLU(),
            nn.Linear(128, hidden_size),
            nn.Tanh()
        )
        
        # Threshold dynamics
        self.threshold_net = nn.Sequential(
            nn.Linear(3, 16),
            nn.Tanh(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        
        # Constants
        self.register_buffer('theta0', torch.tensor(1.0))
        self.register_buffer('beta_transition', torch.tensor(10.0))
        self.register_buffer('alpha_broadcast', torch.tensor(1.0))
        self.register_buffer('beta_maintenance', torch.tensor(0.5))
        
    def forward(self,
                intero_input: torch.Tensor,
                extero_input: torch.Tensor,
                intero_states_flat: torch.Tensor,
                extero_states_flat: torch.Tensor,
                workspace_state: torch.Tensor,
                q_mean: torch.Tensor,
                q_var: torch.Tensor,
                p_mean: torch.Tensor,
                p_var: torch.Tensor,
                Pi_intero: torch.Tensor,
                Pi_extero: torch.Tensor,
                theta: torch.Tensor,
                prev_S: torch.Tensor,
                ignition_history: torch.Tensor,
                refractory_timer: torch.Tensor,
                energy_reserves: torch.Tensor,
                allostatic_load: torch.Tensor,
                metabolic: torch.Tensor,
                cognitive: torch.Tensor,
                affective: torch.Tensor,
                arousal: torch.Tensor,
                attention: torch.Tensor
                ) -> Tuple[torch.Tensor, ...]:
        """Fully static forward pass."""
        
        # Extract hierarchical states
        intero_state_top = intero_states_flat[:, -self.hidden_size:]
        extero_state_top = extero_states_flat[:, -self.hidden_size:]
        
        # Flatten context (all [batch, 1])
        context_flat = torch.cat([
            metabolic, cognitive, affective, arousal, attention
        ], dim=-1)  # [batch, 5]
        
        # Estimate precision
        precision_input = torch.cat([
            intero_input, extero_input, workspace_state, context_flat
        ], dim=-1)
        
        precision_out = self.precision_net(precision_input)
        Pi_intero_new = precision_out[:, 0:1].clamp(min=0.01, max=10.0)
        Pi_extero_new = precision_out[:, 1:2].clamp(min=0.01, max=10.0)
        
        # Generate predictions
        combined_state = torch.cat([intero_state_top, extero_state_top], dim=-1)
        pred_intero = self.intero_predictor(combined_state)
        pred_extero = self.extero_predictor(combined_state)
        
        # Compute precision-weighted errors
        epsilon_intero = intero_input - pred_intero
        epsilon_extero = extero_input - pred_extero
        
        S_intero = Pi_intero_new * torch.abs(epsilon_intero).sum(dim=-1, keepdim=True)
        S_extero = Pi_extero_new * torch.abs(epsilon_extero).sum(dim=-1, keepdim=True)
        S_total = S_intero + S_extero
        
        # Update threshold
        threshold_input = torch.cat([theta, S_total, energy_reserves], dim=-1)
        theta_normalized = self.threshold_net(threshold_input)
        theta_new = 0.1 + theta_normalized * 4.9
        
        # Ignition decision
        ignition_logit = self.beta_transition * (S_total - theta_new)
        ignition_prob = torch.sigmoid(ignition_logit)
        ignition_active = (ignition_prob > 0.5).float()
        
        # Update states
        intero_update = self.state_updater(torch.cat([intero_input, intero_state_top], dim=-1))
        extero_update = self.state_updater(torch.cat([extero_input, extero_state_top], dim=-1))
        
        # Rebuild flattened states
        intero_states_new = torch.cat([intero_update] * 3, dim=-1)
        extero_states_new = torch.cat([extero_update] * 3, dim=-1)
        
        # Update workspace
        workspace_new = self.workspace_net(torch.cat([intero_update, extero_update], dim=-1))
        workspace_new = ignition_active * workspace_new + (1 - ignition_active) * workspace_state * 0.9
        
        # Metabolic costs
        broadcast_cost = self.alpha_broadcast * (workspace_new ** 2).sum(dim=-1, keepdim=True)
        maintenance_cost = self.beta_maintenance * (workspace_state ** 2).sum(dim=-1, keepdim=True)
        total_cost = ignition_active * broadcast_cost + maintenance_cost
        benefit = S_total * 0.5
        free_energy = total_cost - benefit
        
        # Update metabolic state
        energy_new = torch.clamp(energy_reserves - total_cost * 0.001, min=0.0, max=1.0)
        allostatic_new = torch.clamp(
            allostatic_load + S_total * 0.01 - ignition_active * 0.5,
            min=0.0, max=2.0
        )
        
        # Update refractory
        refractory_new = torch.where(
            ignition_active > 0.5,
            torch.ones_like(refractory_timer) * 0.2,
            torch.clamp(refractory_timer - 0.01, min=0.0)
        )
        
        # Probabilistic states
        q_mean_new = q_mean * 0.9 + workspace_new * 0.1
        q_var_new = q_var * 0.95 + torch.ones_like(q_var) * 0.05
        
        # Return all outputs (20 tensors)
        return (
            workspace_new,        # 0: broadcast
            intero_states_new,    # 1: intero_states_new
            extero_states_new,    # 2: extero_states_new
            workspace_new,        # 3: workspace_new
            q_mean_new,           # 4: q_mean_new
            q_var_new,            # 5: q_var_new
            p_mean,               # 6: p_mean_new
            p_var,                # 7: p_var_new
            Pi_intero_new,        # 8: Pi_intero_new
            Pi_extero_new,        # 9: Pi_extero_new
            theta_new,            # 10: theta_new
            S_total,              # 11: prev_S_new
            ignition_active,      # 12: ignition_new
            refractory_new,       # 13: refractory_new
            energy_new,           # 14: energy_new
            allostatic_new,       # 15: allostatic_new
            S_total,              # 16: S_total
            ignition_prob,        # 17: ignition_prob
            broadcast_cost,       # 18: broadcast_cost
            free_energy           # 19: free_energy
        )


def get_file_size(filepath: str) -> str:
    """Get human-readable file size."""
    if os.path.isfile(filepath):
        size = os.path.getsize(filepath)
    else:
        size = sum(
            os.path.getsize(os.path.join(dirpath, filename))
            for dirpath, dirnames, filenames in os.walk(filepath)
            for filename in filenames
        )
    
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"


def export_to_coreml_static() -> ct.models.MLModel:
    """Convert static APGI network to Core ML."""
    
    print("=" * 80)
    print("APGI v2.0.1 → Core ML Converter (FIXED API)")
    print("=" * 80)
    
    # Configuration
    input_size = 64
    hidden_size = 128
    num_levels = 3
    
    print(f"\n📋 Configuration:")
    print(f"   Input size: {input_size}")
    print(f"   Hidden size: {hidden_size}")
    print(f"   Hierarchy levels: {num_levels}")
    
    # Create model
    torch.manual_seed(42)
    torch.set_grad_enabled(False)
    
    model = StaticAPGIForMobile(input_size, hidden_size, num_levels)
    model.eval()
    
    total_params = sum(p.numel() for p in model.parameters())
    print(f"\n🔧 Total parameters: {total_params:,}")
    
    # Create example inputs
    batch_size = 1
    
    example_inputs = (
        torch.randn(batch_size, input_size),
        torch.randn(batch_size, input_size),
        torch.zeros(batch_size, hidden_size * num_levels),
        torch.zeros(batch_size, hidden_size * num_levels),
        torch.zeros(batch_size, hidden_size),
        torch.zeros(batch_size, hidden_size),
        torch.ones(batch_size, hidden_size),
        torch.zeros(batch_size, hidden_size),
        torch.ones(batch_size, hidden_size),
        torch.ones(batch_size, 1),
        torch.ones(batch_size, 1),
        torch.ones(batch_size, 1),
        torch.zeros(batch_size, 1),
        torch.zeros(batch_size, 1),
        torch.zeros(batch_size, 1),
        torch.ones(batch_size, 1) * 0.8,
        torch.zeros(batch_size, 1),
        torch.ones(batch_size, 1) * 0.5,
        torch.ones(batch_size, 1) * 0.5,
        torch.zeros(batch_size, 1),
        torch.ones(batch_size, 1) * 0.5,
        torch.ones(batch_size, 1) * 0.5,
    )
    
    input_names = [
        "intero_input", "extero_input",
        "intero_states", "extero_states", "workspace_state",
        "q_mean", "q_var", "p_mean", "p_var",
        "Pi_intero", "Pi_extero", "theta", "prev_S",
        "ignition_history", "refractory_timer",
        "energy_reserves", "allostatic_load",
        "metabolic", "cognitive", "affective", "arousal", "attention"
    ]
    
    # Output names (will match what Swift code expects)
    output_names = [
        "broadcast",
        "intero_states_new",
        "extero_states_new",
        "workspace_new",
        "q_mean_new",
        "q_var_new",
        "p_mean_new",
        "p_var_new",
        "Pi_intero_new",
        "Pi_extero_new",
        "theta_new",
        "prev_S_new",
        "ignition_new",
        "refractory_new",
        "energy_new",
        "allostatic_new",
        "S_total",
        "ignition_prob",
        "broadcast_cost",
        "free_energy"
    ]
    
    print(f"\n📊 Inputs: {len(example_inputs)}, Outputs: {len(output_names)}")
    
    # Test forward pass
    print(f"\n🧪 Testing forward pass...")
    try:
        with torch.no_grad():
            outputs = model(*example_inputs)
        print(f"   ✅ Forward pass successful: {len(outputs)} outputs")
    except Exception as e:
        print(f"   ❌ Forward pass failed: {e}")
        traceback.print_exc()
        raise
    
    # Trace model
    print(f"\n🔄 Tracing PyTorch model...")
    try:
        traced_model = torch.jit.trace(
            model,
            example_inputs,
            strict=False,
            check_trace=True
        )
        print(f"   ✅ Tracing successful")
        
        # Verify
        with torch.no_grad():
            traced_outputs = traced_model(*example_inputs)
        max_diff = max(torch.abs(o1 - o2).max().item() for o1, o2 in zip(outputs, traced_outputs))
        print(f"   ✅ Validation: max diff = {max_diff:.2e}")
            
    except Exception as e:
        print(f"   ❌ Tracing failed: {e}")
        traceback.print_exc()
        raise
    
    # Convert to Core ML - CORRECT API
    print(f"\n🍎 Converting to Core ML...")
    try:
        mlmodel = ct.convert(
            traced_model,
            inputs=[
                ct.TensorType(name=name, shape=example_inputs[i].shape)
                for i, name in enumerate(input_names)
            ],
            outputs=[
                ct.TensorType(name=out_name)
                for out_name in output_names
            ],
            minimum_deployment_target=ct.target.macOS13,
            compute_units=ct.ComputeUnit.ALL,
            convert_to="mlprogram"
        )
        print(f"   ✅ Core ML conversion successful")
        
    except Exception as e:
        print(f"   ❌ Core ML conversion failed: {e}")
        traceback.print_exc()
        raise
    
    # Add metadata
    mlmodel.author = 'APGI Research Project'
    mlmodel.license = 'Research Use'
    mlmodel.short_description = 'APGI Liquid Network v2.0 - Mobile Optimized'
    mlmodel.version = '2.0.1'
    
    # Save
    output_path = 'APGINetwork.mlpackage'
    mlmodel.save(output_path)
    
    file_size = get_file_size(output_path)
    
    print(f"\n💾 Model saved: {output_path}")
    print(f"   File size: {file_size}")
    print(f"\n📋 Summary:")
    print(f"   Inputs: {len(mlmodel.get_spec().description.input)}")
    print(f"   Outputs: {len(mlmodel.get_spec().description.output)}")
    print(f"   Parameters: {total_params:,}")
    
    # Print actual output names
    print(f"\n📝 Actual output names in CoreML model:")
    for i, output in enumerate(mlmodel.get_spec().description.output):
        print(f"   [{i}] {output.name}")
    
    return mlmodel


if __name__ == "__main__":
    try:
        print("\n⚠️  FIXED VERSION - Correct coremltools API")
        print("   ✅ No dtype specification (handled automatically)")
        print("   ✅ ML Program format")
        print("   ✅ Simple output names\n")
        
        mlmodel = export_to_coreml_static()
        
        print("\n" + "=" * 80)
        print("✅ CONVERSION SUCCESSFUL")
        print("=" * 80)
        
        print("\n📱 Next Steps:")
        print("1. Copy APGINetwork.mlpackage to your Xcode project")
        print("2. Update Swift code to use the actual output names printed above")
        print("3. Clean Build Folder (Cmd+Shift+K) in Xcode")
        print("4. Rebuild")
        
    except Exception as e:
        print("\n" + "=" * 80)
        print("❌ CONVERSION FAILED")
        print("=" * 80)
        print(f"\nError: {e}")
        traceback.print_exc()
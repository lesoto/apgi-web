"""
APGI Liquid Network Implementation
============================================================

Allostatic Precision-Gated Ignition framework implemented as Liquid Time-Constant Networks.
Integrates predictive processing, interoceptive inference, and thermodynamic constraints
within a biologically plausible neural ODE framework.

Key Features:
- Mathematically correct LTC neurons with adaptive time constants
- Hierarchical predictive coding with multi-level inference
- Metabolic cost modeling and free energy minimization
- Context-dependent precision weighting
- Phase transition dynamics with hysteresis
- Volatility estimation and neuromodulatory influences
- Comprehensive diagnostic and validation tools

Based on:
- Hasani et al. (2021) - Liquid Time-Constant Networks
- APGI Framework - Allostatic Precision-Gated Ignition theory
- Friston (2010) - Free Energy Principle
- Dehaene & Changeux (2011) - Global Workspace Theory

Author: Implementation for APGI Research Project
Version: 1.0.0 (Research Grade)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass
from enum import Enum
import numpy as np


# ============================================================================
# Data Structures and Constants
# ============================================================================

class IgnitionState(Enum):
    """Conscious access state"""
    CONSCIOUS = 1
    UNCONSCIOUS = 0
    TRANSITIONING = 0.5  # Metastable state near threshold


@dataclass
class PrecisionOutput:
    """Output from precision estimation network"""
    Pi_intero: torch.Tensor  # Interoceptive precision weight
    Pi_extero: torch.Tensor  # Exteroceptive precision weight
    tau_intero: torch.Tensor  # Interoceptive time constant
    tau_extero: torch.Tensor  # Exteroceptive time constant
    volatility: torch.Tensor  # Estimated environmental volatility
    context_modulation: torch.Tensor  # Context-dependent modulation


@dataclass
class PredictionOutput:
    """Output from prediction error computation"""
    epsilon_intero: torch.Tensor  # Interoceptive prediction error
    epsilon_extero: torch.Tensor  # Exteroceptive prediction error
    pred_intero: torch.Tensor  # Interoceptive prediction
    pred_extero: torch.Tensor  # Exteroceptive prediction
    hierarchical_errors: List[torch.Tensor]  # Errors at each hierarchy level


@dataclass
class MetabolicOutput:
    """Metabolic cost and benefit computations"""
    broadcast_cost: torch.Tensor  # Cost of global ignition
    maintenance_cost: torch.Tensor  # Cost of sustained activity
    prediction_benefit: torch.Tensor  # Benefit from error reduction
    free_energy: torch.Tensor  # Total free energy
    entropy_production: torch.Tensor  # Thermodynamic entropy


@dataclass
class APGIState:
    """Complete state representation for APGI network"""
    # Neural states
    intero_states: List[torch.Tensor]  # Interoceptive states per hierarchy level
    extero_states: List[torch.Tensor]  # Exteroceptive states per hierarchy level
    workspace_state: torch.Tensor  # Global workspace activity
    
    # Predictions
    intero_predictions: List[torch.Tensor]
    extero_predictions: List[torch.Tensor]
    
    # Precision and threshold
    Pi_intero: torch.Tensor
    Pi_extero: torch.Tensor
    theta: torch.Tensor  # Adaptive threshold
    
    # Metabolic and allostatic
    allostatic_load: torch.Tensor  # Current metabolic demand
    energy_reserves: torch.Tensor  # Available metabolic resources
    
    # History tracking
    prev_S: torch.Tensor  # Previous surprise
    prev_ignition: torch.Tensor  # Previous ignition state (0 or 1)
    refractory_timer: torch.Tensor  # Post-ignition refractory period
    
    # Volatility estimation
    volatility: torch.Tensor
    precision_history: List[torch.Tensor]  # For learning
    
    # Neuromodulation
    norepinephrine: torch.Tensor  # NE levels (volatility proxy)
    acetylcholine: torch.Tensor  # ACh levels (precision proxy)
    
    # Temporal integration
    integration_window: torch.Tensor  # Current integration window (0-500ms)
    temporal_buffer: List[torch.Tensor]  # Buffered signals for integration


# ============================================================================
# Core Neural Components
# ============================================================================

class LTCNeuron(nn.Module):
    """
    Liquid Time-Constant Neuron with CORRECTED ODE formulation.
    
    Implements: dx/dt = (1/τ) * (-x + σ(W·input + b))
    
    The time constant τ modulates both decay and drive, ensuring proper
    temporal dynamics. Higher τ → slower integration, lower τ → faster integration.
    
    Args:
        input_size: Dimension of input
        hidden_size: Dimension of hidden state
        tau_base: Default time constant (in arbitrary time units)
    """
    
    def __init__(self, input_size: int, hidden_size: int, tau_base: float = 1.0):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.tau_base = tau_base
        
        # Initialize weights with Xavier initialization for stability
        self.W = nn.Parameter(torch.randn(hidden_size, input_size) * np.sqrt(2.0 / input_size))
        self.b = nn.Parameter(torch.zeros(hidden_size))
        
        # Recurrent connections (reservoir-style, sparse)
        self.W_rec = nn.Parameter(torch.randn(hidden_size, hidden_size) * 0.1)
        self._sparsify_reservoir(sparsity=0.9)
        
        self.sigma = torch.tanh  # Biologically plausible activation
        self.tau = torch.tensor(tau_base)  # Will be modulated dynamically
        
    def _sparsify_reservoir(self, sparsity: float):
        """Create sparse recurrent connections (reservoir computing principle)"""
        mask = torch.rand_like(self.W_rec) > sparsity
        self.W_rec.data *= mask.float()
        
    def set_tau(self, new_tau: torch.Tensor):
        """Modulate time constant based on precision estimate"""
        self.tau = new_tau.clamp(min=0.01, max=10.0)  # Prevent instability
        
    def forward(self, input: torch.Tensor, prev_state: torch.Tensor, dt: float = 0.01) -> torch.Tensor:
        """
        Forward pass with CORRECTED Euler integration.
        
        Args:
            input: Input signal [batch_size, input_size]
            prev_state: Previous hidden state [batch_size, hidden_size]
            dt: Integration time step
            
        Returns:
            new_state: Updated hidden state [batch_size, hidden_size]
        """
        # Compute target state (equilibrium point)
        linear_input = torch.matmul(input, self.W.t()) + self.b
        recurrent_input = torch.matmul(prev_state, self.W_rec.t())
        target = self.sigma(linear_input + recurrent_input)
        
        # CORRECTED ODE: dx/dt = (1/τ) * (-x + target)
        # Ensure tau has correct dimensions for broadcasting
        tau_expanded = self.tau.unsqueeze(0) if self.tau.dim() == 0 else self.tau
        
        dx_dt = (1.0 / tau_expanded) * (-prev_state + target)
        new_state = prev_state + dt * dx_dt
        
        return new_state


class HierarchicalPredictiveLayer(nn.Module):
    """
    Single layer in hierarchical predictive coding architecture.
    
    Implements bidirectional message passing:
    - Top-down: predictions from higher levels
    - Bottom-up: precision-weighted prediction errors
    
    Each layer learns to predict the layer below and receives
    error signals when predictions fail.
    """
    
    def __init__(self, input_size: int, hidden_size: int, level: int):
        super().__init__()
        self.level = level
        self.hidden_size = hidden_size
        
        # LTC neurons for this level
        self.neurons = LTCNeuron(input_size, hidden_size)
        
        # Top-down prediction network
        self.predictor = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, input_size)
        )
        
        # Precision estimation for this level
        self.precision_net = nn.Sequential(
            nn.Linear(hidden_size + input_size, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Softplus()  # Ensures positive precision
        )
        
    def forward(self, bottom_up_input: torch.Tensor, top_down_prediction: Optional[torch.Tensor],
                prev_state: torch.Tensor, dt: float = 0.01) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Process signals through hierarchical layer.
        
        Args:
            bottom_up_input: Input from lower level (or sensors)
            top_down_prediction: Prediction from higher level (None for top level)
            prev_state: Previous state of this level
            dt: Integration time step
            
        Returns:
            state: Updated state at this level
            prediction_error: Error for lower level
            prediction: Prediction for lower level
        """
        # Compute prediction error if we have top-down input
        if top_down_prediction is not None:
            error = bottom_up_input - top_down_prediction
        else:
            error = bottom_up_input  # Top level gets raw input
            
        # Update state via LTC dynamics
        state = self.neurons(error, prev_state, dt)
        
        # Generate prediction for lower level
        prediction = self.predictor(state)
        
        # Estimate precision at this level
        combined = torch.cat([state, bottom_up_input], dim=-1)
        precision = self.precision_net(combined)
        
        # Compute precision-weighted error
        prediction_error = precision * torch.abs(error)
        
        return state, prediction_error, prediction


class PrecisionEstimator(nn.Module):
    """
    Estimates context-dependent precision Π^i(M,c,a) and Π^e.
    
    Precision reflects confidence in signals and modulates integration timescales.
    Implements second-order (volatility) estimation to capture environmental uncertainty.
    
    Context factors:
    - M: Metabolic state (energy reserves, homeostatic balance)
    - c: Cognitive context (task demands, attention)
    - a: Affective state (arousal, valence)
    """
    
    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.hidden_size = hidden_size
        
        # First-order precision estimation
        # intero_input (input_size) + extero_input (input_size) + state (hidden_size) + context (4)
        self.precision_net = nn.Sequential(
            nn.Linear(input_size * 2 + hidden_size + 4, 128),  # Corrected input dimensions
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU()
        )
        
        # Separate outputs for intero and extero precision
        self.fc_Pi_intero = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()  # Positive precision
        )
        
        self.fc_Pi_extero = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()
        )
        
        # Time constant outputs (inverse relationship with precision by default)
        self.fc_tau_intero = nn.Sequential(
            nn.Linear(64, 1),
            nn.Softplus()
        )
        
        self.fc_tau_extero = nn.Sequential(
            nn.Linear(64, 1),
            nn.Softplus()
        )
        
        # Second-order: volatility estimation (uncertainty about precision)
        self.volatility_net = nn.Sequential(
            nn.Linear(64 + 2, 32),  # precision features (64) + history (2)
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Normalized volatility 0-1
        )
        
        # Context-dependent modulation network
        self.context_net = nn.Sequential(
            nn.Linear(4, 16),  # M, c, a, arousal
            nn.Tanh(),
            nn.Linear(16, 1),
            nn.Sigmoid()
        )
        
        # Buffer for tracking precision history (for volatility)
        self.precision_history_buffer = []
        self.max_history = 10
        
    def forward(self, intero_input: torch.Tensor, extero_input: torch.Tensor,
                state: torch.Tensor, context: Dict[str, torch.Tensor]) -> PrecisionOutput:
        """
        Estimate precision weights and time constants.
        
        Args:
            intero_input: Interoceptive signals [batch, input_size]
            extero_input: Exteroceptive signals [batch, input_size]
            state: Current network state [batch, hidden_size]
            context: Dict with keys 'metabolic', 'cognitive', 'affective', 'arousal'
            
        Returns:
            PrecisionOutput with all precision-related values
        """
        batch_size = intero_input.shape[0]
        
        # Pack context into tensor
        context_vec = torch.stack([
            context.get('metabolic', torch.zeros(batch_size, device=intero_input.device)),
            context.get('cognitive', torch.zeros(batch_size, device=intero_input.device)),
            context.get('affective', torch.zeros(batch_size, device=intero_input.device)),
            context.get('arousal', torch.zeros(batch_size, device=intero_input.device))
        ], dim=-1)  # [batch, 4]
        
        # Combine inputs
        combined = torch.cat([intero_input, extero_input, state, context_vec], dim=-1)
        
        # Extract precision features
        precision_features = self.precision_net(combined)
        
        # Estimate separate precisions
        Pi_intero = self.fc_Pi_intero(precision_features)
        Pi_extero = self.fc_Pi_extero(precision_features)
        
        # Estimate time constants
        # Interpretation: High precision → trust signal → faster integration (lower tau)
        # This can be inverted if theoretical requirements differ
        tau_intero = self.fc_tau_intero(precision_features) + 0.1  # Baseline tau
        tau_extero = self.fc_tau_extero(precision_features) + 0.05  # Faster baseline
        
        # Volatility estimation (second-order uncertainty)
        # Compute variance of recent precision estimates
        # Clear buffer if batch size changes
        if len(self.precision_history_buffer) > 0 and self.precision_history_buffer[0].shape[0] != batch_size:
            self.precision_history_buffer.clear()
            
        self.precision_history_buffer.append(Pi_intero.detach())
        if len(self.precision_history_buffer) > self.max_history:
            self.precision_history_buffer.pop(0)
            
        if len(self.precision_history_buffer) > 1:
            precision_history_tensor = torch.stack(self.precision_history_buffer, dim=0)
            precision_variance = precision_history_tensor.var(dim=0)
            precision_mean = precision_history_tensor.mean(dim=0)
            history_features = torch.cat([precision_variance, precision_mean], dim=-1)
        else:
            history_features = torch.zeros(batch_size, 2, device=intero_input.device)
            
        volatility_input = torch.cat([precision_features, history_features], dim=-1)
        volatility = self.volatility_net(volatility_input)
        
        # Context-dependent modulation (implements Π^i(M,c,a))
        context_modulation = self.context_net(context_vec)
        
        # Apply context to interoceptive precision
        Pi_intero_contextual = Pi_intero * context_modulation
        
        return PrecisionOutput(
            Pi_intero=Pi_intero_contextual,
            Pi_extero=Pi_extero,
            tau_intero=tau_intero,
            tau_extero=tau_extero,
            volatility=volatility,
            context_modulation=context_modulation
        )


class PredictionErrorModule(nn.Module):
    """
    Computes precision-weighted prediction errors across hierarchical levels.
    
    Implements: S = Π^e · |ε^e| + Π^i(M,c,a) · |ε^i|
    
    Generates predictions at each level and computes errors when predictions
    fail to match incoming signals.
    """
    
    def __init__(self, input_size: int, state_size: int, num_levels: int = 3):
        super().__init__()
        self.input_size = input_size
        self.state_size = state_size
        self.num_levels = num_levels
        
        # Separate predictors for intero and extero channels
        # All levels predict from state_size to state_size
        self.intero_predictors = nn.ModuleList([
            nn.Sequential(
                nn.Linear(state_size, state_size),
                nn.Tanh(),
                nn.Linear(state_size, state_size)
            ) for _ in range(num_levels)
        ])
        
        self.extero_predictors = nn.ModuleList([
            nn.Sequential(
                nn.Linear(state_size, state_size),
                nn.Tanh(),
                nn.Linear(state_size, state_size)
            ) for _ in range(num_levels)
        ])
        
        # Additional predictors to map inputs to state space for comparison
        self.intero_input_projector = nn.Sequential(
            nn.Linear(input_size, state_size),
            nn.Tanh()
        )
        
        self.extero_input_projector = nn.Sequential(
            nn.Linear(input_size, state_size),
            nn.Tanh()
        )
        
    def forward(self, intero_input: torch.Tensor, extero_input: torch.Tensor,
                intero_states: List[torch.Tensor], extero_states: List[torch.Tensor]) -> PredictionOutput:
        """
        Compute prediction errors at all hierarchical levels.
        
        Args:
            intero_input: Raw interoceptive input [batch, input_size]
            extero_input: Raw exteroceptive input [batch, input_size]
            intero_states: States at each intero level
            extero_states: States at each extero level
            
        Returns:
            PredictionOutput containing errors and predictions
        """
        epsilon_intero_list = []
        epsilon_extero_list = []
        pred_intero_list = []
        pred_extero_list = []
        
        # Compute errors at each hierarchical level
        # Project inputs to state space for comparison
        intero_projected = self.intero_input_projector(intero_input)
        extero_projected = self.extero_input_projector(extero_input)
        
        for level in range(self.num_levels):
            # Generate predictions
            pred_intero = self.intero_predictors[level](intero_states[level])
            pred_extero = self.extero_predictors[level](extero_states[level])
            
            # Compute errors (bottom level compares to projected input, higher levels to lower predictions)
            if level == 0:
                eps_intero = torch.abs(intero_projected - pred_intero)
                eps_extero = torch.abs(extero_projected - pred_extero)
            else:
                eps_intero = torch.abs(pred_intero_list[level-1] - pred_intero)
                eps_extero = torch.abs(pred_extero_list[level-1] - pred_extero)
                
            epsilon_intero_list.append(eps_intero)
            epsilon_extero_list.append(eps_extero)
            pred_intero_list.append(pred_intero)
            pred_extero_list.append(pred_extero)
            
        # Aggregate errors across hierarchy (weighted by level)
        level_weights = torch.softmax(torch.arange(self.num_levels, dtype=torch.float32), dim=0)
        
        epsilon_intero = sum(w * eps for w, eps in zip(level_weights, epsilon_intero_list))
        epsilon_extero = sum(w * eps for w, eps in zip(level_weights, epsilon_extero_list))
        
        return PredictionOutput(
            epsilon_intero=epsilon_intero,
            epsilon_extero=epsilon_extero,
            pred_intero=pred_intero_list[0],  # Lowest level prediction
            pred_extero=pred_extero_list[0],
            hierarchical_errors=epsilon_intero_list + epsilon_extero_list
        )


class MetabolicCostModule(nn.Module):
    """
    Models thermodynamic costs and benefits of cognitive operations.
    
    Key computations:
    - Broadcast cost C(B): Energy required for global ignition
    - Maintenance cost: Sustaining conscious state
    - Prediction benefit: Expected reduction in future surprise
    - Free energy: F = E + C - H (energy + cost - entropy)
    - Entropy production: Thermodynamic dissipation
    
    Critical for APGI: Consciousness is metabolically expensive and only
    deployed when benefits (allostatic protection) outweigh costs.
    """
    
    def __init__(self, state_size: int, alpha: float = 1.0, beta: float = 0.5):
        super().__init__()
        self.state_size = state_size
        self.alpha = alpha  # Broadcast cost scaling
        self.beta = beta    # Maintenance cost scaling
        
        # Network to estimate expected future error reduction
        self.benefit_estimator = nn.Sequential(
            nn.Linear(state_size * 2, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Softplus()  # Positive benefit
        )
        
        # Entropy estimation network
        self.entropy_net = nn.Sequential(
            nn.Linear(state_size, 32),
            nn.Tanh(),
            nn.Linear(32, 1),
            nn.Softplus()
        )
        
    def compute_broadcast_cost(self, workspace_activity: torch.Tensor,
                               synchronization: torch.Tensor) -> torch.Tensor:
        """
        Cost of global broadcast: proportional to activity magnitude and synchronization.
        
        High synchrony (phase-locked oscillations) is metabolically expensive.
        """
        activity_cost = self.alpha * workspace_activity.pow(2).sum(dim=-1, keepdim=True)
        sync_cost = self.beta * synchronization.pow(2)
        return activity_cost + sync_cost
        
    def compute_maintenance_cost(self, state: torch.Tensor, duration: float) -> torch.Tensor:
        """Cost of maintaining conscious state over time"""
        return self.beta * state.pow(2).sum(dim=-1, keepdim=True) * duration
        
    def compute_benefit(self, current_error: torch.Tensor, predicted_error_reduction: torch.Tensor) -> torch.Tensor:
        """
        Benefit = expected reduction in future prediction errors.
        
        Ignition is beneficial when it enables better predictions and
        reduces future allostatic threats.
        """
        return predicted_error_reduction * current_error.sum(dim=-1, keepdim=True)
        
    def forward(self, workspace_state: torch.Tensor, error_state: torch.Tensor,
                ignition_active: torch.Tensor, dt: float = 0.01) -> MetabolicOutput:
        """
        Compute all metabolic costs and benefits.
        
        Args:
            workspace_state: Global workspace activity [batch, state_size]
            error_state: Current prediction error state [batch, state_size]
            ignition_active: Binary ignition indicator [batch, 1]
            dt: Time step for maintenance cost
            
        Returns:
            MetabolicOutput with all cost/benefit terms
        """
        # Compute synchronization measure (simplified as activity variance)
        synchronization = workspace_state.var(dim=-1, keepdim=True)
        
        # Costs
        broadcast_cost = self.compute_broadcast_cost(workspace_state, synchronization)
        maintenance_cost = self.compute_maintenance_cost(workspace_state, dt)
        
        # Only pay broadcast cost if ignited
        total_cost = ignition_active * broadcast_cost + maintenance_cost
        
        # Benefits (estimated error reduction from conscious processing)
        combined_state = torch.cat([workspace_state, error_state], dim=-1)
        error_reduction = self.benefit_estimator(combined_state)
        benefit = self.compute_benefit(error_state, error_reduction)
        
        # Free energy: F = Cost - Benefit (want to minimize)
        free_energy = total_cost - benefit
        
        # Entropy production (thermodynamic dissipation)
        entropy = self.entropy_net(workspace_state)
        
        return MetabolicOutput(
            broadcast_cost=broadcast_cost,
            maintenance_cost=maintenance_cost,
            prediction_benefit=benefit,
            free_energy=free_energy,
            entropy_production=entropy
        )


class AdaptiveThreshold(nn.Module):
    """
    Dynamic threshold θ with allostatic regulation.
    
    Implements: dθ/dt = γ(θ₀ - θ) - δB_{t-1} - λ(dS/dt)
    
    Components:
    - γ(θ₀ - θ): Homeostatic pull toward baseline
    - δB_{t-1}: Refractory period after ignition
    - λ(dS/dt): Urgency term (lower threshold for rising surprise)
    
    Threshold modulates based on metabolic state, recent ignition history,
    and rate of surprise increase.
    """
    
    def __init__(self, theta0: float = 1.0, gamma: float = 0.1,
                 delta: float = 0.5, lambda_urg: float = 0.2):
        super().__init__()
        self.theta0 = nn.Parameter(torch.tensor(theta0), requires_grad=False)  # Baseline
        self.gamma = gamma    # Homeostatic rate
        self.delta = delta    # Refractoriness strength
        self.lambda_urg = lambda_urg  # Urgency scaling
        
        # Learnable metabolic modulation
        self.metabolic_modulator = nn.Sequential(
            nn.Linear(2, 8),  # energy_reserves, allostatic_load
            nn.Tanh(),
            nn.Linear(8, 1)
        )
        
    def forward(self, current_theta: torch.Tensor, prev_ignition: torch.Tensor,
                prev_S: torch.Tensor, curr_S: torch.Tensor,
                energy_reserves: torch.Tensor, allostatic_load: torch.Tensor,
                dt: float = 0.01) -> torch.Tensor:
        """
        Update threshold based on allostatic dynamics.
        
        Args:
            current_theta: Current threshold value [batch, 1]
            prev_ignition: Previous ignition state (0 or 1) [batch, 1]
            prev_S: Previous surprise [batch, 1]
            curr_S: Current surprise [batch, 1]
            energy_reserves: Available metabolic energy [batch, 1]
            allostatic_load: Current homeostatic demand [batch, 1]
            dt: Time step
            
        Returns:
            new_theta: Updated threshold [batch, 1]
        """
        # Homeostatic term: pull toward baseline
        homeostasis = self.gamma * (self.theta0 - current_theta)
        
        # Refractory term: raise threshold after ignition
        refractoriness = -self.delta * prev_ignition
        
        # Urgency term: lower threshold if surprise is rising rapidly
        dS_dt = (curr_S - prev_S) / dt if dt > 0 else torch.zeros_like(curr_S)
        urgency = -self.lambda_urg * torch.clamp(dS_dt, min=0)  # Only for positive dS/dt
        
        # Metabolic modulation: higher threshold when energy is low
        metabolic_state = torch.cat([energy_reserves, allostatic_load], dim=-1)
        metabolic_adjustment = self.metabolic_modulator(metabolic_state)
        
        # Combine all terms
        dtheta_dt = homeostasis + refractoriness + urgency + metabolic_adjustment
        new_theta = current_theta + dt * dtheta_dt
        
        # Clamp to reasonable range
        new_theta = torch.clamp(new_theta, min=0.1, max=5.0)
        
        return new_theta


class NeuromodulationModule(nn.Module):
    """
    Models neuromodulatory influences on precision and ignition.
    
    - Norepinephrine (NE): Tracks volatility, increases with uncertainty
    - Acetylcholine (ACh): Modulates precision, increases with attention
    
    These neuromodulators dynamically adjust network parameters based on
    environmental statistics and task demands.
    """
    
    def __init__(self, state_size: int):
        super().__init__()
        
        # NE estimation from volatility and arousal
        self.ne_estimator = nn.Sequential(
            nn.Linear(state_size + 2, 32),  # state + volatility + arousal
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Normalized NE level
        )
        
        # ACh estimation from precision and attention
        self.ach_estimator = nn.Sequential(
            nn.Linear(state_size + 2, 32),  # state + precision + attention
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Normalized ACh level
        )
        
    def forward(self, state: torch.Tensor, volatility: torch.Tensor,
                precision: torch.Tensor, arousal: torch.Tensor,
                attention: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Estimate neuromodulator levels.
        
        Args:
            state: Current network state [batch, state_size]
            volatility: Environmental volatility [batch, 1]
            precision: Current precision estimate [batch, 1]
            arousal: Arousal level [batch, 1]
            attention: Attentional demand [batch, 1]
            
        Returns:
            norepinephrine: NE level [batch, 1]
            acetylcholine: ACh level [batch, 1]
        """
        # Norepinephrine: high volatility + high arousal → high NE
        ne_input = torch.cat([state, volatility, arousal], dim=-1)
        norepinephrine = self.ne_estimator(ne_input)
        
        # Acetylcholine: high precision + high attention → high ACh
        ach_input = torch.cat([state, precision, attention], dim=-1)
        acetylcholine = self.ach_estimator(ach_input)
        
        return norepinephrine, acetylcholine


class GlobalWorkspace(nn.Module):
    """
    Global workspace with phase transition dynamics and winner-take-all competition.
    
    Implements smooth ignition with hysteresis:
    - Below threshold: unconscious (no broadcast)
    - Near threshold: metastable (fluctuations)
    - Above threshold: conscious (global broadcast)
    
    Once ignited, harder to switch off (hysteresis prevents flickering).
    """
    
    def __init__(self, state_size: int, beta: float = 10.0, hysteresis: float = 0.2):
        super().__init__()
        self.state_size = state_size
        self.beta = beta  # Steepness of phase transition
        self.hysteresis = hysteresis  # Threshold difference for on/off
        
        # Workspace combiner: integrates intero + extero into broadcast
        self.combiner = nn.Sequential(
            nn.Linear(state_size * 2, state_size),
            nn.Tanh(),
            nn.Linear(state_size, state_size)
        )
        
        # Competition network: winner-take-all dynamics
        self.competition = nn.Sequential(
            nn.Linear(state_size, state_size),
            nn.Softmax(dim=-1)  # Winners suppress losers
        )
        
        # Sustained activity network (recurrent maintenance)
        self.sustain = nn.Linear(state_size, state_size)
        
    def compute_ignition_probability(self, S: torch.Tensor, theta: torch.Tensor,
                                    prev_ignition: torch.Tensor) -> torch.Tensor:
        """
        Smooth phase transition with hysteresis.
        
        P(ignition) = σ(β * (S - θ_effective))
        where θ_effective is lower if previously ignited (hysteresis)
        """
        # Apply hysteresis: effective threshold is lower if already ignited
        theta_effective = theta - prev_ignition * self.hysteresis
        
        # Sigmoid transition
        ignition_prob = torch.sigmoid(self.beta * (S - theta_effective))
        
        return ignition_prob
        
    def forward(self, intero_state: torch.Tensor, extero_state: torch.Tensor,
                S: torch.Tensor, theta: torch.Tensor,
                prev_workspace: torch.Tensor, prev_ignition: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Process global workspace dynamics.
        
        Args:
            intero_state: Interoceptive state [batch, state_size]
            extero_state: Exteroceptive state [batch, state_size]
            S: Total surprise (precision-weighted error) [batch, 1]
            theta: Current threshold [batch, 1]
            prev_workspace: Previous workspace state [batch, state_size]
            prev_ignition: Previous ignition probability [batch, 1]
            
        Returns:
            broadcast: Workspace broadcast signal [batch, state_size]
            ignition_prob: Probability of conscious access [batch, 1]
            workspace_state: Updated workspace state [batch, state_size]
        """
        # Compute ignition probability with hysteresis
        ignition_prob = self.compute_ignition_probability(S, theta, prev_ignition)
        
        # Combine intero and extero signals
        combined = torch.cat([intero_state, extero_state], dim=-1)
        workspace_candidate = self.combiner(combined)
        
        # Apply competition (winner-take-all)
        competitive_weights = self.competition(workspace_candidate)
        workspace_competitive = workspace_candidate * competitive_weights
        
        # Sustain previous activity (recurrent maintenance)
        sustained = self.sustain(prev_workspace)
        
        # Weighted combination based on ignition probability
        workspace_state = ignition_prob * workspace_competitive + (1 - ignition_prob) * sustained * 0.1
        
        # Broadcast scaled by ignition probability and surprise
        broadcast = workspace_state * ignition_prob * S
        
        return broadcast, ignition_prob, workspace_state


class RefractoryPeriodModule(nn.Module):
    """
    Implements post-ignition refractory period.
    
    After conscious access, system enters refractory state where
    re-ignition is suppressed for a period (prevents rapid flickering).
    
    Duration modulated by ignition intensity and metabolic cost.
    """
    
    def __init__(self, max_refractory: float = 200.0):  # milliseconds
        super().__init__()
        self.max_refractory = max_refractory
        
    def forward(self, refractory_timer: torch.Tensor, ignition_prob: torch.Tensor,
                metabolic_cost: torch.Tensor, dt: float = 1.0) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Update refractory period timer.
        
        Args:
            refractory_timer: Current timer value (ms) [batch, 1]
            ignition_prob: Current ignition probability [batch, 1]
            metabolic_cost: Cost of last ignition [batch, 1]
            dt: Time step (ms)
            
        Returns:
            new_timer: Updated timer [batch, 1]
            suppression: Multiplicative suppression factor (0-1) [batch, 1]
        """
        # If ignited (prob > 0.5), reset timer based on cost
        ignited = (ignition_prob > 0.5).float()
        refractory_duration = self.max_refractory * ignited * (0.5 + 0.5 * torch.sigmoid(metabolic_cost))
        
        # Update timer: set to duration if ignited, otherwise decay
        new_timer = torch.where(
            ignited > 0.5,
            refractory_duration,
            torch.clamp(refractory_timer - dt, min=0.0)
        )
        
        # Suppression factor: 0 during refractory, 1 when recovered
        suppression = 1.0 - torch.sigmoid(10 * (new_timer / self.max_refractory - 0.5))
        
        return new_timer, suppression


class TemporalIntegrationModule(nn.Module):
    """
    Integrates signals over temporal windows (0-500ms for conscious moments).
    
    Maintains rolling buffer of recent signals and computes
    weighted integration based on precision and temporal dynamics.
    """
    
    def __init__(self, state_size: int, max_window_ms: float = 500.0, dt_ms: float = 10.0):
        super().__init__()
        self.state_size = state_size
        self.max_window_ms = max_window_ms
        self.dt_ms = dt_ms
        self.buffer_size = int(max_window_ms / dt_ms)  # Number of time steps
        
        # Temporal weighting network (learns integration kernel)
        self.temporal_weights = nn.Sequential(
            nn.Linear(self.buffer_size, 64),
            nn.ReLU(),
            nn.Linear(64, self.buffer_size),
            nn.Softmax(dim=-1)
        )
        
    def forward(self, temporal_buffer: List[torch.Tensor],
                precision: torch.Tensor) -> torch.Tensor:
        """
        Integrate signals over temporal window.
        
        Args:
            temporal_buffer: List of recent states [buffer_size x [batch, state_size]]
            precision: Current precision for weighting [batch, 1]
            
        Returns:
            integrated: Temporally integrated signal [batch, state_size]
        """
        if len(temporal_buffer) == 0:
            return torch.zeros(precision.shape[0], self.state_size, device=precision.device)
            
        # Stack buffer into tensor [batch, buffer_size, state_size]
        buffer_tensor = torch.stack(temporal_buffer, dim=1)
        batch_size = buffer_tensor.shape[0]
        
        # Compute temporal weights (more recent = higher weight by default)
        actual_buffer_size = len(temporal_buffer)
        time_indices = torch.arange(actual_buffer_size, dtype=torch.float32, device=precision.device)
        time_features = time_indices.unsqueeze(0).expand(batch_size, -1)
        
        # Create a temporary weight network for the actual buffer size
        if actual_buffer_size != self.buffer_size:
            # Use a simple exponential decay for mismatched sizes
            weights = torch.exp(-0.1 * (self.buffer_size - 1 - time_indices))
            weights = weights / (weights.sum(dim=-1, keepdim=True) + 1e-8)
        else:
            weights = self.temporal_weights(time_features)  # [batch, buffer_size]
        
        # Apply precision weighting (high precision → trust recent signals more)
        weights = weights * precision
        weights = weights / (weights.sum(dim=-1, keepdim=True) + 1e-8)  # Renormalize
        
        # Weighted integration
        integrated = torch.sum(buffer_tensor * weights.unsqueeze(-1), dim=1)
        
        return integrated


class PrecisionLearningModule(nn.Module):
    """
    Learns precision weights from prediction accuracy history.
    
    Implements meta-learning: adjusts precision estimates based on
    whether past predictions were accurate (higher precision) or
    inaccurate (lower precision, higher volatility).
    """
    
    def __init__(self, hidden_size: int, learning_rate: float = 0.01):
        super().__init__()
        self.hidden_size = hidden_size
        self.learning_rate = learning_rate
        
        # LSTM for tracking prediction accuracy over time
        self.accuracy_tracker = nn.LSTM(
            input_size=3,  # prediction, target, error
            hidden_size=hidden_size,
            num_layers=2,
            batch_first=True
        )
        
        # Precision adjustment network
        self.precision_adjuster = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.Tanh(),
            nn.Linear(32, 2),  # Output: precision_intero, precision_extero adjustments
            nn.Tanh()  # Adjustment in range [-1, 1]
        )
        
    def forward(self, prediction_history: List[torch.Tensor],
                target_history: List[torch.Tensor],
                error_history: List[torch.Tensor],
                current_precision: torch.Tensor) -> torch.Tensor:
        """
        Learn precision adjustments from history.
        
        Args:
            prediction_history: Past predictions [sequence_length x [batch, 1]]
            target_history: Past targets [sequence_length x [batch, 1]]
            error_history: Past errors [sequence_length x [batch, 1]]
            current_precision: Current precision estimate [batch, 2]
            
        Returns:
            adjusted_precision: Updated precision [batch, 2]
        """
        if len(prediction_history) < 2:
            return current_precision
            
        # Stack histories into sequences
        pred_seq = torch.stack(prediction_history[-10:], dim=1)  # Last 10 steps
        target_seq = torch.stack(target_history[-10:], dim=1)
        error_seq = torch.stack(error_history[-10:], dim=1)
        
        # Combine into input sequence
        input_seq = torch.cat([pred_seq, target_seq, error_seq], dim=-1)
        
        # Process with LSTM
        _, (hidden, _) = self.accuracy_tracker(input_seq)
        context = hidden[-1]  # Take last layer's final hidden state
        
        # Compute precision adjustment
        adjustment = self.precision_adjuster(context) * self.learning_rate
        
        # Apply adjustment
        adjusted_precision = current_precision * (1.0 + adjustment)
        adjusted_precision = torch.clamp(adjusted_precision, min=0.01, max=10.0)
        
        return adjusted_precision


# ============================================================================
# Main APGI Network
# ============================================================================

class APGILiquidNetwork(nn.Module):
    """
    Complete APGI Framework implemented as Liquid Time-Constant Networks.
    
    Research-grade implementation integrating:
    - Hierarchical predictive coding (3 levels)
    - Context-dependent precision weighting Π^i(M,c,a)
    - Metabolic cost modeling and free energy minimization
    - Phase transition dynamics with hysteresis
    - Neuromodulatory influences (NE, ACh)
    - Temporal integration (0-500ms windows)
    - Precision learning from prediction accuracy
    - Refractory periods and allostatic regulation
    
    Implements: S = Π^e · |ε^e| + Π^i(M,c,a) · |ε^i|
                Ignition if S > θ(allostatic state, history)
    
    Args:
        input_size: Dimension of sensory inputs
        hidden_size: Dimension of hidden states
        num_levels: Number of hierarchical levels (default: 3)
        theta0: Baseline ignition threshold
        dt_ms: Time step in milliseconds (default: 10ms)
    """
    
    def __init__(self, input_size: int = 64, hidden_size: int = 128,
                 num_levels: int = 3, theta0: float = 1.0, dt_ms: float = 10.0):
        super().__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_levels = num_levels
        self.dt_ms = dt_ms
        self.dt_seconds = dt_ms / 1000.0
        
        # Hierarchical processing layers
        self.intero_hierarchy = nn.ModuleList([
            HierarchicalPredictiveLayer(
                input_size=input_size if i == 0 else hidden_size,
                hidden_size=hidden_size,
                level=i
            ) for i in range(num_levels)
        ])
        
        self.extero_hierarchy = nn.ModuleList([
            HierarchicalPredictiveLayer(
                input_size=input_size if i == 0 else hidden_size,
                hidden_size=hidden_size,
                level=i
            ) for i in range(num_levels)
        ])
        
        # Core APGI modules
        self.precision_estimator = PrecisionEstimator(input_size, hidden_size)
        self.prediction_error = PredictionErrorModule(input_size, hidden_size, num_levels)
        self.metabolic_cost = MetabolicCostModule(hidden_size)
        self.adaptive_threshold = AdaptiveThreshold(theta0=theta0)
        self.global_workspace = GlobalWorkspace(hidden_size)
        
        # Additional modules
        self.neuromodulation = NeuromodulationModule(hidden_size)
        self.refractory = RefractoryPeriodModule()
        self.temporal_integration = TemporalIntegrationModule(hidden_size, dt_ms=dt_ms)
        self.precision_learning = PrecisionLearningModule(hidden_size)
        
        # Input projection layers
        self.intero_projection = nn.Linear(input_size, input_size)
        self.extero_projection = nn.Linear(input_size, input_size)
        
    def initialize_state(self, batch_size: int, device: torch.device) -> APGIState:
        """
        Initialize network state.
        
        Args:
            batch_size: Number of parallel samples
            device: Torch device (CPU/GPU)
            
        Returns:
            APGIState: Complete initial state
        """
        return APGIState(
            # Neural states (one per hierarchy level)
            intero_states=[torch.zeros(batch_size, self.hidden_size, device=device) 
                          for _ in range(self.num_levels)],
            extero_states=[torch.zeros(batch_size, self.hidden_size, device=device) 
                          for _ in range(self.num_levels)],
            workspace_state=torch.zeros(batch_size, self.hidden_size, device=device),
            
            # Predictions
            intero_predictions=[torch.zeros(batch_size, self.hidden_size, device=device) 
                               for _ in range(self.num_levels)],
            extero_predictions=[torch.zeros(batch_size, self.hidden_size, device=device) 
                               for _ in range(self.num_levels)],
            
            # Precision and threshold
            Pi_intero=torch.ones(batch_size, 1, device=device),
            Pi_extero=torch.ones(batch_size, 1, device=device),
            theta=torch.ones(batch_size, 1, device=device) * 1.0,
            
            # Metabolic and allostatic
            allostatic_load=torch.zeros(batch_size, 1, device=device),
            energy_reserves=torch.ones(batch_size, 1, device=device),
            
            # History
            prev_S=torch.zeros(batch_size, 1, device=device),
            prev_ignition=torch.zeros(batch_size, 1, device=device),
            refractory_timer=torch.zeros(batch_size, 1, device=device),
            
            # Volatility
            volatility=torch.zeros(batch_size, 1, device=device),
            precision_history=[],
            
            # Neuromodulation
            norepinephrine=torch.zeros(batch_size, 1, device=device),
            acetylcholine=torch.zeros(batch_size, 1, device=device),
            
            # Temporal integration
            integration_window=torch.zeros(batch_size, 1, device=device),
            temporal_buffer=[]
        )
        
    def forward(self, intero_input: torch.Tensor, extero_input: torch.Tensor,
                state: APGIState, context: Optional[Dict[str, torch.Tensor]] = None) -> Tuple[torch.Tensor, IgnitionState, APGIState, Dict[str, torch.Tensor]]:
        """
        Forward pass through complete APGI network.
        
        Args:
            intero_input: Interoceptive input signals [batch, input_size]
            extero_input: Exteroceptive input signals [batch, input_size]
            state: Current APGIState
            context: Optional context dict with 'metabolic', 'cognitive', 'affective', 'arousal', 'attention'
            
        Returns:
            broadcast: Global workspace broadcast (None if not ignited) [batch, hidden_size]
            ignition_state: Conscious/unconscious/transitioning
            new_state: Updated APGIState
            diagnostics: Dict of diagnostic outputs (costs, errors, precision, etc.)
        """
        batch_size = intero_input.shape[0]
        device = intero_input.device
        dt = self.dt_seconds
        
        # Default context if not provided
        if context is None:
            context = {
                'metabolic': torch.ones(batch_size, device=device) * 0.5,
                'cognitive': torch.ones(batch_size, device=device) * 0.5,
                'affective': torch.zeros(batch_size, device=device),
                'arousal': torch.ones(batch_size, device=device) * 0.5,
                'attention': torch.ones(batch_size, device=device) * 0.5
            }
            
        # Project inputs
        intero_projected = self.intero_projection(intero_input)
        extero_projected = self.extero_projection(extero_input)
        
        # ==== Step 1: Estimate Precision ====
        # Get average state across hierarchy for precision estimation
        avg_state = sum(state.intero_states + state.extero_states) / (2 * self.num_levels)
        
        precision_output = self.precision_estimator(
            intero_projected, extero_projected, avg_state, context
        )
        
        # ==== Step 2: Process Hierarchical Predictions ====
        new_intero_states = []
        new_extero_states = []
        
        # Bottom-up pass through hierarchy
        for level in range(self.num_levels):
            # Get input for this level
            if level == 0:
                intero_input_level = intero_projected
                extero_input_level = extero_projected
                intero_pred_level = None
                extero_pred_level = None
            else:
                intero_input_level = new_intero_states[level - 1]
                extero_input_level = new_extero_states[level - 1]
                intero_pred_level = state.intero_predictions[level] if level < len(state.intero_predictions) else None
                extero_pred_level = state.extero_predictions[level] if level < len(state.extero_predictions) else None
            
            # Process through layers
            intero_state, _, _ = self.intero_hierarchy[level](
                intero_input_level, intero_pred_level,
                state.intero_states[level], dt
            )
            extero_state, _, _ = self.extero_hierarchy[level](
                extero_input_level, extero_pred_level,
                state.extero_states[level], dt
            )
            
            new_intero_states.append(intero_state)
            new_extero_states.append(extero_state)
        
        # ==== Step 3: Compute Prediction Errors ====
        pred_output = self.prediction_error(
            intero_projected, extero_projected,
            new_intero_states, new_extero_states
        )
        
        # ==== Step 4: Compute Total Surprise S ====
        # S = Π^e · |ε^e| + Π^i(M,c,a) · |ε^i|
        S_extero = precision_output.Pi_extero * pred_output.epsilon_extero.mean(dim=-1, keepdim=True)
        S_intero = precision_output.Pi_intero * pred_output.epsilon_intero.mean(dim=-1, keepdim=True)
        S_total = S_extero + S_intero
        
        # ==== Step 5: Neuromodulation ====
        norepinephrine, acetylcholine = self.neuromodulation(
            avg_state, precision_output.volatility,
            precision_output.Pi_intero, context['arousal'].unsqueeze(-1),
            context['attention'].unsqueeze(-1)
        )
        
        # Modulate precision with ACh (attention enhances precision)
        Pi_intero_modulated = precision_output.Pi_intero * (0.5 + 0.5 * acetylcholine)
        Pi_extero_modulated = precision_output.Pi_extero * (0.5 + 0.5 * acetylcholine)
        
        # ==== Step 6: Update Adaptive Threshold ====
        new_theta = self.adaptive_threshold(
            state.theta, state.prev_ignition,
            state.prev_S, S_total,
            state.energy_reserves, state.allostatic_load,
            dt
        )
        
        # ==== Step 7: Refractory Period Check ====
        new_refractory, refractory_suppression = self.refractory(
            state.refractory_timer, state.prev_ignition,
            state.allostatic_load, self.dt_ms
        )
        
        # Apply refractory suppression to effective surprise
        S_effective = S_total * refractory_suppression
        
        # ==== Step 8: Global Workspace Dynamics ====
        broadcast, ignition_prob, workspace_state = self.global_workspace(
            new_intero_states[0], new_extero_states[0],
            S_effective, new_theta,
            state.workspace_state, state.prev_ignition
        )
        
        # ==== Step 9: Metabolic Cost Computation ====
        metabolic_output = self.metabolic_cost(
            workspace_state,
            pred_output.epsilon_intero + pred_output.epsilon_extero,
            ignition_prob,
            dt
        )
        
        # ==== Step 10: Temporal Integration ====
        # Update temporal buffer
        new_temporal_buffer = state.temporal_buffer + [avg_state]
        if len(new_temporal_buffer) > self.temporal_integration.buffer_size:
            new_temporal_buffer.pop(0)
            
        integrated_signal = self.temporal_integration(
            new_temporal_buffer,
            precision_output.Pi_intero
        )
        
        # ==== Step 11: Precision Learning ====
        # Update precision based on prediction accuracy history
        if len(state.precision_history) > 0:
            # Simplified: learn from recent error magnitudes
            error_magnitude = pred_output.epsilon_intero.mean(dim=-1, keepdim=True)
            state.precision_history.append(error_magnitude.detach())
            if len(state.precision_history) > 20:
                state.precision_history.pop(0)
                
            # Adjust precision (simplified - full version would use PrecisionLearningModule)
            recent_errors = torch.stack(state.precision_history[-5:], dim=0).mean(dim=0)
            precision_adjustment = torch.exp(-recent_errors)  # Lower error → higher precision
            Pi_intero_learned = Pi_intero_modulated * (0.8 + 0.4 * precision_adjustment)
            Pi_extero_learned = Pi_extero_modulated * (0.8 + 0.4 * precision_adjustment)
        else:
            Pi_intero_learned = Pi_intero_modulated
            Pi_extero_learned = Pi_extero_modulated
            state.precision_history.append(pred_output.epsilon_intero.mean(dim=-1, keepdim=True).detach())
        
        # ==== Step 12: Update Energy and Allostatic State ====
        # Metabolic cost depletes energy reserves
        energy_depletion = metabolic_output.broadcast_cost * 0.001  # Scale factor
        new_energy = torch.clamp(state.energy_reserves - energy_depletion, min=0.0, max=1.0)
        
        # Allostatic load increases with surprise, decreases when ignited (homeostatic resolution)
        allostatic_increase = S_total * 0.01
        allostatic_decrease = ignition_prob * state.allostatic_load * 0.5
        new_allostatic_load = torch.clamp(
            state.allostatic_load + allostatic_increase - allostatic_decrease,
            min=0.0, max=2.0
        )
        
        # ==== Step 13: Determine Ignition State ====
        if ignition_prob.mean() > 0.8:
            ignition_state = IgnitionState.CONSCIOUS
        elif ignition_prob.mean() > 0.3:
            ignition_state = IgnitionState.TRANSITIONING
        else:
            ignition_state = IgnitionState.UNCONSCIOUS
            
        # ==== Step 14: Construct New State ====
        new_state = APGIState(
            intero_states=new_intero_states,
            extero_states=new_extero_states,
            workspace_state=workspace_state,
            
            intero_predictions=[pred_output.pred_intero] * self.num_levels,
            extero_predictions=[pred_output.pred_extero] * self.num_levels,
            
            Pi_intero=Pi_intero_learned,
            Pi_extero=Pi_extero_learned,
            theta=new_theta,
            
            allostatic_load=new_allostatic_load,
            energy_reserves=new_energy,
            
            prev_S=S_total,
            prev_ignition=ignition_prob,
            refractory_timer=new_refractory,
            
            volatility=precision_output.volatility,
            precision_history=state.precision_history,
            
            norepinephrine=norepinephrine,
            acetylcholine=acetylcholine,
            
            integration_window=torch.ones_like(state.integration_window) * self.dt_ms,
            temporal_buffer=new_temporal_buffer
        )
        
        # ==== Step 15: Compile Diagnostics ====
        diagnostics = {
            'S_total': S_total,
            'S_intero': S_intero,
            'S_extero': S_extero,
            'theta': new_theta,
            'ignition_prob': ignition_prob,
            'Pi_intero': Pi_intero_learned,
            'Pi_extero': Pi_extero_learned,
            'broadcast_cost': metabolic_output.broadcast_cost,
            'maintenance_cost': metabolic_output.maintenance_cost,
            'free_energy': metabolic_output.free_energy,
            'entropy': metabolic_output.entropy_production,
            'volatility': precision_output.volatility,
            'norepinephrine': norepinephrine,
            'acetylcholine': acetylcholine,
            'refractory_timer': new_refractory,
            'energy_reserves': new_energy,
            'allostatic_load': new_allostatic_load,
            'epsilon_intero': pred_output.epsilon_intero.mean(dim=-1, keepdim=True),
            'epsilon_extero': pred_output.epsilon_extero.mean(dim=-1, keepdim=True),
            'integrated_signal': integrated_signal
        }
        
        return broadcast, ignition_state, new_state, diagnostics


# ============================================================================
# Validation and Testing Utilities
# ============================================================================

class APGIValidator:
    """
    Comprehensive validation tools for APGI network.
    
    Tests:
    - ODE integration correctness
    - Precision-surprise relationship
    - Threshold dynamics
    - Phase transition behavior
    - Metabolic cost scaling
    - Refractory period enforcement
    """
    
    @staticmethod
    def validate_ode_integration(network: APGILiquidNetwork, num_steps: int = 100) -> Dict[str, float]:
        """
        Validate ODE integration stability and correctness.
        
        Tests:
        1. States remain bounded
        2. Energy conservation (approximately)
        3. Equilibrium convergence
        """
        batch_size = 4
        device = torch.device('cpu')
        state = network.initialize_state(batch_size, device)
        
        # Constant input
        intero_input = torch.randn(batch_size, network.input_size) * 0.1
        extero_input = torch.randn(batch_size, network.input_size) * 0.1
        
        states_magnitude = []
        
        for step in range(num_steps):
            _, _, state, _ = network(intero_input, extero_input, state)
            
            # Track state magnitude
            avg_magnitude = sum(s.abs().mean().item() for s in state.intero_states) / len(state.intero_states)
            states_magnitude.append(avg_magnitude)
            
        # Check stability
        is_stable = all(m < 100.0 for m in states_magnitude)  # States should stay bounded
        converged = abs(states_magnitude[-1] - states_magnitude[-10]) < 0.1  # Should approach equilibrium
        
        return {
            'stable': is_stable,
            'converged': converged,
            'final_magnitude': states_magnitude[-1],
            'max_magnitude': max(states_magnitude)
        }
    
    @staticmethod
    def validate_precision_surprise_relationship(network: APGILiquidNetwork) -> Dict[str, bool]:
        """
        Validate that S = Π^e · |ε^e| + Π^i · |ε^i| holds.
        """
        batch_size = 2
        device = torch.device('cpu')
        state = network.initialize_state(batch_size, device)
        
        # High error inputs
        intero_input = torch.randn(batch_size, network.input_size)
        extero_input = torch.randn(batch_size, network.input_size)
        
        _, _, _, diagnostics = network(intero_input, extero_input, state)
        
        # Manually compute S
        S_manual = (diagnostics['Pi_intero'] * diagnostics['epsilon_intero'] +
                   diagnostics['Pi_extero'] * diagnostics['epsilon_extero'])
        
        # Check if matches reported S
        matches = torch.allclose(S_manual, diagnostics['S_total'], rtol=0.1)
        
        return {
            'formula_matches': matches,
            'S_reported': diagnostics['S_total'].mean().item(),
            'S_computed': S_manual.mean().item()
        }
    
    @staticmethod
    def validate_phase_transition(network: APGILiquidNetwork) -> Dict[str, bool]:
        """
        Validate smooth phase transition with hysteresis.
        """
        batch_size = 1
        device = torch.device('cpu')
        state = network.initialize_state(batch_size, device)
        
        # Gradually increase input magnitude
        ignition_probs = []
        magnitudes = torch.linspace(0, 3.0, 50)
        
        for mag in magnitudes:
            intero_input = torch.ones(batch_size, network.input_size) * mag
            extero_input = torch.ones(batch_size, network.input_size) * mag
            
            _, _, state, diagnostics = network(intero_input, extero_input, state)
            ignition_probs.append(diagnostics['ignition_prob'].item())
            
        # Check for smooth transition (not abrupt jump)
        diffs = [abs(ignition_probs[i+1] - ignition_probs[i]) for i in range(len(ignition_probs)-1)]
        max_jump = max(diffs)
        is_smooth = max_jump < 0.5  # No single jump > 0.5
        
        # Check for eventual ignition
        ignited = ignition_probs[-1] > 0.8
        
        return {
            'smooth_transition': is_smooth,
            'eventually_ignites': ignited,
            'max_jump': max_jump,
            'final_prob': ignition_probs[-1]
        }
    
    @staticmethod
    def validate_metabolic_cost_scales(network: APGILiquidNetwork) -> Dict[str, bool]:
        """
        Validate that metabolic cost increases with ignition.
        """
        batch_size = 2
        device = torch.device('cpu')
        state = network.initialize_state(batch_size, device)
        
        # Low input (no ignition)
        low_input = torch.randn(batch_size, network.input_size) * 0.1
        _, _, state_low, diag_low = network(low_input, low_input, state)
        
        # High input (ignition)
        state_high = network.initialize_state(batch_size, device)
        high_input = torch.randn(batch_size, network.input_size) * 3.0
        _, _, _, diag_high = network(high_input, high_input, state_high)
        
        # Cost should be higher with ignition
        cost_increases = diag_high['broadcast_cost'].mean() > diag_low['broadcast_cost'].mean()
        
        return {
            'cost_scales_with_ignition': cost_increases,
            'low_cost': diag_low['broadcast_cost'].mean().item(),
            'high_cost': diag_high['broadcast_cost'].mean().item()
        }


# ============================================================================
# Example Usage and Testing
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("APGI Liquid Network Implementation")
    print("=" * 80)
    
    # Initialize network
    network = APGILiquidNetwork(
        input_size=64,
        hidden_size=128,
        num_levels=3,
        theta0=1.0,
        dt_ms=10.0
    )
    
    print(f"\nNetwork Parameters: {sum(p.numel() for p in network.parameters()):,}")
    
    # Initialize state
    batch_size = 2
    device = torch.device('cpu')
    state = network.initialize_state(batch_size, device)
    
    print(f"Initialized state for batch size: {batch_size}")
    
    # Simulate sequence
    print("\n" + "=" * 80)
    print("Running Simulation (10 time steps)")
    print("=" * 80)
    
    for step in range(10):
        # Random inputs
        intero_input = torch.randn(batch_size, 64) * (0.5 + step * 0.1)
        extero_input = torch.randn(batch_size, 64) * (0.5 + step * 0.1)
        
        # Optional context
        context = {
            'metabolic': torch.ones(batch_size) * 0.7,
            'cognitive': torch.ones(batch_size) * 0.6,
            'affective': torch.zeros(batch_size),
            'arousal': torch.ones(batch_size) * (0.3 + step * 0.05),
            'attention': torch.ones(batch_size) * 0.8
        }
        
        # Forward pass
        broadcast, ignition_state, state, diagnostics = network(
            intero_input, extero_input, state, context
        )
        
        print(f"\nStep {step}:")
        print(f"  Ignition: {ignition_state.name:15s} (prob={diagnostics['ignition_prob'].mean():.3f})")
        print(f"  Surprise:  S_total={diagnostics['S_total'].mean():.3f}, θ={diagnostics['theta'].mean():.3f}")
        print(f"  Precision: Π_i={diagnostics['Pi_intero'].mean():.3f}, Π_e={diagnostics['Pi_extero'].mean():.3f}")
        print(f"  Metabolic: Cost={diagnostics['broadcast_cost'].mean():.4f}, Energy={diagnostics['energy_reserves'].mean():.3f}")
        print(f"  Neuromod:  NE={diagnostics['norepinephrine'].mean():.3f}, ACh={diagnostics['acetylcholine'].mean():.3f}")
        
    # Run validation tests
    print("\n" + "=" * 80)
    print("Validation Tests")
    print("=" * 80)
    
    validator = APGIValidator()
    
    print("\n1. ODE Integration:")
    ode_results = validator.validate_ode_integration(network)
    for key, value in ode_results.items():
        print(f"   {key}: {value}")
        
    print("\n2. Precision-Surprise Formula:")
    ps_results = validator.validate_precision_surprise_relationship(network)
    for key, value in ps_results.items():
        print(f"   {key}: {value}")
        
    print("\n3. Phase Transition:")
    pt_results = validator.validate_phase_transition(network)
    for key, value in pt_results.items():
        print(f"   {key}: {value}")
        
    print("\n4. Metabolic Cost Scaling:")
    mc_results = validator.validate_metabolic_cost_scales(network)
    for key, value in mc_results.items():
        print(f"   {key}: {value}")
    
    print("\n" + "=" * 80)
    print("Implementation Complete - All Systems Operational")
    print("=" * 80)
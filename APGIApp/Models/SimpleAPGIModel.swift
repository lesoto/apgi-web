//
//  SimpleAPGIModel.swift
//  APGIApp
//
//  Pure Swift implementation of APGI framework
//  Implements core APGI mathematics without CoreML dependency
//

import Foundation
import Accelerate

// MARK: - SimpleAPGIModel: Pure Swift Implementation

/// Core APGI mathematical operations
/// Implements the fundamental equations:
/// - Sₜ = Πᵉ·|εᵉ| + Πⁱ(M,c,a)·|εⁱ|
/// - Bₜ = σ(α·(Sₜ - θₜ))
struct APGICore {
    let config: APGIConfiguration
    
    // MARK: - Core APGI Equations
    
    /// Compute precision-weighted surprise: S = Π·|ε|
    /// - Parameters:
    ///   - predictionError: Prediction error vector
    ///   - precision: Precision weight (inverse variance)
    /// - Returns: Precision-weighted surprise magnitude
    func computeSurprise(
        predictionError: [Float],
        precision: Float
    ) -> Float {
        guard !predictionError.isEmpty else { return 0.0 }
        
        // Compute mean absolute error
        let absoluteError = predictionError.map { abs($0) }
        let meanError = absoluteError.reduce(0, +) / Float(absoluteError.count)
        
        // S = Π · |ε|
        return precision * meanError
    }
    
    /// Compute total accumulated signal: Sₜ = Πᵉ·|εᵉ| + Πⁱ(M,c,a)·|εⁱ|
    /// This is the core APGI equation
    func computeTotalSurprise(
        exteroError: [Float],
        interoError: [Float],
        piExtero: Float,
        piIntero: Float,
        somaticMarker: Float
    ) -> Float {
        // Exteroceptive surprise: Πᵉ·|εᵉ|
        let sExtero = computeSurprise(
            predictionError: exteroError,
            precision: piExtero
        )
        
        // Interoceptive surprise with somatic modulation: Πⁱ(M,c,a)·|εⁱ|
        let modulatedPiIntero = piIntero * somaticMarker
        let sIntero = computeSurprise(
            predictionError: interoError,
            precision: modulatedPiIntero
        )
        
        // Total surprise
        return sExtero + sIntero
    }
    
    /// Compute ignition probability: Bₜ = σ(α·(Sₜ - θₜ))
    /// - Parameters:
    ///   - surprise: Total surprise Sₜ
    ///   - threshold: Dynamic threshold θₜ
    ///   - alpha: Sigmoid steepness parameter
    /// - Returns: Probability of global ignition [0, 1]
    func computeIgnitionProbability(
        surprise: Float,
        threshold: Float,
        alpha: Float
    ) -> Float {
        let x = alpha * (surprise - threshold)
        return sigmoid(x)
    }
    
    /// Logistic sigmoid function: σ(x) = 1/(1 + exp(-x))
    func sigmoid(_ x: Float) -> Float {
        return 1.0 / (1.0 + exp(-x))
    }
    
    // MARK: - Somatic Marker Computation
    
    /// Compute somatic marker M(c,a) from context
    /// Represents learned allostatic value encoded in vmPFC/insula/amygdala
    func computeSomaticMarker(
        metabolic: Float,
        cognitive: Float,
        affective: Float
    ) -> Float {
        // Weighted combination of context factors
        // Metabolic state has highest weight (40%) as it's most critical for allostasis
        let marker = (metabolic * 0.4 + cognitive * 0.3 + affective * 0.3)
        
        // Map to typical range [0.5, 2.0]
        // Values > 1.0 amplify interoceptive precision
        // Values < 1.0 attenuate it
        let scaled = marker * 2.0
        return clamp(scaled, min: 0.5, max: 2.0)
    }
    
    // MARK: - Prediction Error Computation
    
    /// Compute prediction error: ε = observation - prediction
    func computePredictionError(
        observation: [Float],
        prediction: [Float]
    ) -> [Float] {
        let minCount = min(observation.count, prediction.count)
        return (0..<minCount).map { observation[$0] - prediction[$0] }
    }
    
    /// Update predictor using exponential moving average
    /// Implements simple online learning
    func updatePredictor(
        current: inout [Float],
        observation: [Float],
        learningRate: Float = 0.1
    ) {
        let minCount = min(current.count, observation.count)
        for i in 0..<minCount {
            // EMA: new = old * (1 - α) + obs * α
            current[i] = current[i] * (1.0 - learningRate) + observation[i] * learningRate
        }
    }
    
    // MARK: - Precision Estimation
    
    /// Estimate precision from error history (inverse variance)
    /// Π = 1/σ² where σ² is variance of recent errors
    func estimatePrecision(
        errorHistory: [[Float]],
        baseline: Float = 1.0
    ) -> Float {
        guard errorHistory.count > 1 else { return baseline }
        
        // Flatten all errors into single array
        var allErrors: [Float] = []
        errorHistory.forEach { allErrors.append(contentsOf: $0) }
        
        guard !allErrors.isEmpty else { return baseline }
        
        // Compute mean
        let mean = allErrors.reduce(0, +) / Float(allErrors.count)
        
        // Compute variance: σ² = E[(x - μ)²]
        let variance = allErrors.map { pow($0 - mean, 2) }.reduce(0, +) / Float(allErrors.count)
        
        // Precision = 1/variance (with safety bounds)
        let precision = 1.0 / max(variance, config.eps)
        return clamp(precision, min: config.precisionMin, max: config.precisionMax)
    }
    
    // MARK: - Adaptive Threshold Dynamics
    
    /// Update threshold: dθ/dt = γ(θ₀ - θ) - δBₜ₋₁ - λ(dS/dt)
    /// Implements homeostatic regulation, refractoriness, and urgency
    func updateThreshold(
        current: Float,
        prevIgnition: Float,
        prevSurprise: Float,
        currentSurprise: Float,
        energyReserves: Float,
        allostaticLoad: Float,
        dt: Float
    ) -> Float {
        let theta0 = config.theta0
        let gamma = config.gamma
        let delta = config.delta
        let lambdaUrg = config.lambdaUrg
        
        // 1. Homeostatic term: γ(θ₀ - θ)
        // Pulls threshold toward baseline
        let homeostasis = gamma * (theta0 - current)
        
        // 2. Refractory term: -δBₜ₋₁
        // Increases threshold after ignition (prevents rapid re-ignition)
        let refractoriness = -delta * prevIgnition
        
        // 3. Urgency term: -λ(dS/dt)⁺
        // Decreases threshold when surprise is rising rapidly
        let dSdt = (currentSurprise - prevSurprise) / max(dt, 0.001)
        let urgency = -lambdaUrg * max(dSdt, 0.0)
        
        // 4. Metabolic modulation
        // Higher threshold when energy is low or allostatic load is high
        let metabolicPenalty = (1.0 - energyReserves) * 0.2 + allostaticLoad * 0.1
        
        // Integrate all terms
        let dTheta = homeostasis + refractoriness + urgency + metabolicPenalty
        let newTheta = current + dt * dTheta
        
        // Clamp to valid range
        return clamp(newTheta, min: config.thetaMin, max: config.thetaMax)
    }
    
    // MARK: - Metabolic Cost Computation
    
    /// Compute broadcast cost: quadratic in ignition probability
    /// C(B) = α·Bₜ²
    func computeBroadcastCost(ignitionProb: Float) -> Float {
        return config.alphaBroadcast * pow(ignitionProb, 2)
    }
    
    /// Compute maintenance cost: sustained activity
    func computeMaintenanceCost(state: Float) -> Float {
        return config.betaMaintenance * abs(state)
    }
    
    /// Estimate benefit from error reduction
    /// Simplified: benefit proportional to surprise magnitude
    func computeBenefit(surprise: Float, prevSurprise: Float) -> Float {
        // Benefit when surprise is decreasing
        let reduction = max(prevSurprise - surprise, 0.0)
        return reduction * 0.5
    }
    
    // MARK: - Utility Functions
    
    /// Clamp value to range [min, max]
    func clamp(_ value: Float, min minValue: Float, max maxValue: Float) -> Float {
        return Swift.max(minValue, Swift.min(maxValue, value))
    }
}

// MARK: - SimpleAPGIModel

/// Simple APGI model using pure Swift computation
/// Implements Phase 0: Core APGI mathematics without CoreML
class SimpleAPGIModel {
    let core: APGICore
    let config: APGIConfiguration
    
    // Predictors (exponential moving averages)
    var interoPredictor: [Float]
    var exteroPredictor: [Float]
    
    // Error history for precision estimation
    var interoErrorHistory: [[Float]] = []
    var exteroErrorHistory: [[Float]] = []
    let maxHistoryLength: Int
    
    // Previous state for derivatives
    var previousSurprise: Float = 0.0
    
    init(configuration: APGIConfiguration) {
        self.config = configuration
        self.core = APGICore(config: configuration)
        
        // Initialize predictors with zeros
        self.interoPredictor = Array(repeating: 0.0, count: configuration.inputSize)
        self.exteroPredictor = Array(repeating: 0.0, count: configuration.inputSize)
        
        // History length from config
        self.maxHistoryLength = configuration.precisionHistoryMax
    }
    
    /// Forward pass through APGI model
    /// - Parameters:
    ///   - interoInput: Interoceptive input signals [inputSize]
    ///   - exteroInput: Exteroceptive input signals [inputSize]
    ///   - state: Current APGI state
    ///   - context: Context parameters (metabolic, cognitive, affective, arousal, attention)
    /// - Returns: Tuple of (new state, diagnostics)
    func forward(
        interoInput: [Float],
        exteroInput: [Float],
        state: APGIState,
        context: APGIContext
    ) -> (newState: APGIState, diagnostics: APGIDiagnostics) {
        
        let dt = config.dtMs / 1000.0  // Convert to seconds
        
        // ====================================================================
        // STEP 1: Compute Prediction Errors
        // ε = observation - prediction
        // ====================================================================
        
        let epsilonIntero = core.computePredictionError(
            observation: interoInput,
            prediction: interoPredictor
        )
        let epsilonExtero = core.computePredictionError(
            observation: exteroInput,
            prediction: exteroPredictor
        )
        
        // ====================================================================
        // STEP 2: Update Error History
        // Maintain sliding window of recent errors for precision estimation
        // ====================================================================
        
        interoErrorHistory.append(epsilonIntero)
        exteroErrorHistory.append(epsilonExtero)
        
        // Trim history to max length
        if interoErrorHistory.count > maxHistoryLength {
            interoErrorHistory.removeFirst()
        }
        if exteroErrorHistory.count > maxHistoryLength {
            exteroErrorHistory.removeFirst()
        }
        
        // ====================================================================
        // STEP 3: Estimate Precision (Π = 1/σ²)
        // Precision is inverse variance of recent prediction errors
        // ====================================================================
        
        let piIntero = core.estimatePrecision(
            errorHistory: interoErrorHistory,
            baseline: Float(state.piIntero)
        )
        let piExtero = core.estimatePrecision(
            errorHistory: exteroErrorHistory,
            baseline: Float(state.piExtero)
        )
        
        // ====================================================================
        // STEP 4: Compute Somatic Marker M(c,a)
        // Learned allostatic value modulating interoceptive precision
        // ====================================================================
        
        let somaticMarker = core.computeSomaticMarker(
            metabolic: Float(context.metabolic),
            cognitive: Float(context.cognitive),
            affective: Float(context.affective)
        )
        
        // ====================================================================
        // STEP 5: Compute Total Surprise
        // Sₜ = Πᵉ·|εᵉ| + Πⁱ(M,c,a)·|εⁱ|
        // This is the CORE APGI EQUATION
        // ====================================================================
        
        let sTotal = core.computeTotalSurprise(
            exteroError: epsilonExtero,
            interoError: epsilonIntero,
            piExtero: piExtero,
            piIntero: piIntero,
            somaticMarker: somaticMarker
        )
        
        // Compute individual components for diagnostics
        let sExtero = core.computeSurprise(
            predictionError: epsilonExtero,
            precision: piExtero
        )
        let sIntero = core.computeSurprise(
            predictionError: epsilonIntero,
            precision: piIntero * somaticMarker
        )
        
        // ====================================================================
        // STEP 6: Update Adaptive Threshold
        // dθ/dt = γ(θ₀ - θ) - δBₜ₋₁ - λ(dS/dt)
        // ====================================================================
        
        let newTheta = core.updateThreshold(
            current: Float(state.theta),
            prevIgnition: Float(state.prevIgnition),
            prevSurprise: Float(state.prevS),
            currentSurprise: sTotal,
            energyReserves: Float(state.energyReserves),
            allostaticLoad: Float(state.allostaticLoad),
            dt: dt
        )
        
        // ====================================================================
        // STEP 7: Compute Ignition Probability
        // Bₜ = σ(α·(Sₜ - θₜ))
        // ====================================================================
        
        let ignitionProb = core.computeIgnitionProbability(
            surprise: sTotal,
            threshold: newTheta,
            alpha: config.betaTransition
        )
        
        // ====================================================================
        // STEP 8: Compute Metabolic Costs
        // - Broadcast cost: C(B) = α·Bₜ²
        // - Maintenance cost: proportional to sustained activity
        // ====================================================================
        
        let broadcastCost = core.computeBroadcastCost(ignitionProb: ignitionProb)
        let maintenanceCost = core.computeMaintenanceCost(state: Float(state.energyReserves))
        let totalCost = broadcastCost + maintenanceCost
        
        // Compute benefit (error reduction)
        let benefit = core.computeBenefit(surprise: sTotal, prevSurprise: previousSurprise)
        
        // Free energy: Cost - Benefit
        let freeEnergy = totalCost - benefit
        
        // ====================================================================
        // STEP 9: Update Energy Reserves
        // Energy depletes based on metabolic cost
        // ====================================================================
        
        let energyDelta = -totalCost * config.energyDepletionRate * dt
        let newEnergy = core.clamp(
            Float(state.energyReserves) + Float(energyDelta),
            min: config.energyMin,
            max: config.energyMax
        )
        
        // ====================================================================
        // STEP 10: Update Allostatic Load
        // Increases with surprise, decreases with successful ignition
        // ====================================================================
        
        let allostaticIncrease = sTotal * config.allostaticIncreaseRate * dt
        let allostaticDecrease = ignitionProb * Float(state.allostaticLoad) * config.allostaticDecreaseRate * dt
        let newAllostatic = core.clamp(
            Float(state.allostaticLoad) + Float(allostaticIncrease) - allostaticDecrease,
            min: config.allostaticMin,
            max: config.allostaticMax
        )
        
        // ====================================================================
        // STEP 11: Update Predictors (Online Learning)
        // Learn from observations to improve future predictions
        // ====================================================================
        
        core.updatePredictor(
            current: &interoPredictor,
            observation: interoInput,
            learningRate: 0.1
        )
        core.updatePredictor(
            current: &exteroPredictor,
            observation: exteroInput,
            learningRate: 0.1
        )
        
        // ====================================================================
        // STEP 12: Estimate Volatility (Second-Order Uncertainty)
        // Track variability in precision estimates
        // ====================================================================
        
        let volatility = estimateVolatility(currentPrecision: piIntero)
        
        // ====================================================================
        // STEP 13: Neuromodulation (Simplified)
        // - Norepinephrine: tracks volatility + arousal
        // - Acetylcholine: tracks precision + attention
        // ====================================================================
        
        let norepinephrine = core.sigmoid(volatility * 2.0 + Float(context.arousal) - 0.5)
        let acetylcholine = core.sigmoid(piIntero * 0.5 + Float(context.attention) - 0.5)
        
        // ====================================================================
        // STEP 14: Create New State
        // Package all updated variables into APGIState
        // ====================================================================
        
        var newState = state
        
        // Update precision
        newState.piIntero = Double(piIntero)
        newState.piExtero = Double(piExtero)
        
        // Update threshold
        newState.theta = Double(newTheta)
        
        // Update temporal tracking
        newState.prevS = Double(sTotal)
        newState.prevIgnition = Double(ignitionProb)
        
        // Update metabolic state
        newState.energyReserves = Double(newEnergy)
        newState.allostaticLoad = Double(newAllostatic)
        
        // Store for next iteration
        previousSurprise = sTotal
        
        // ====================================================================
        // STEP 15: Create Diagnostics
        // All observable metrics for visualization
        // ====================================================================
        
        let diagnostics = APGIDiagnostics(
            sTotal: Double(sTotal),
            sIntero: Double(sIntero),
            sExtero: Double(sExtero),
            theta: Double(newTheta),
            ignitionProb: Double(ignitionProb),
            piIntero: Double(piIntero),
            piExtero: Double(piExtero),
            broadcastCost: Double(broadcastCost),
            freeEnergy: Double(freeEnergy),
            energyReserves: Double(newEnergy),
            allostaticLoad: Double(newAllostatic),
            volatility: Double(volatility),
            norepinephrine: Double(norepinephrine),
            acetylcholine: Double(acetylcholine),
            refractoryTimer: 0.0  // TODO: Phase 2 implementation
        )
        
        return (newState, diagnostics)
    }
    
    // MARK: - Volatility Estimation
    
    private var precisionHistory: [Float] = []
    
    private func estimateVolatility(currentPrecision: Float) -> Float {
        precisionHistory.append(currentPrecision)
        
        // Keep history bounded
        if precisionHistory.count > 20 {
            precisionHistory.removeFirst()
        }
        
        guard precisionHistory.count > 2 else { return 0.0 }
        
        // Volatility = standard deviation of precision
        let mean = precisionHistory.reduce(0, +) / Float(precisionHistory.count)
        let variance = precisionHistory.map { pow($0 - mean, 2) }.reduce(0, +) / Float(precisionHistory.count)
        
        return sqrt(variance)
    }
}

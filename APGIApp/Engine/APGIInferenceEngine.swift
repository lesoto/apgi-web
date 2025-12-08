//
//  APGIInferenceEngine.swift
//  APGIApp
//
//  Main inference engine for APGI model
//  Updated to use SimpleAPGIModel with real mathematics
//

import Foundation
import Combine

// MARK: - State Manager

/// Thread-safe state management
actor StateManager {
    private var currentState: APGIState
    
    init(initialState: APGIState) {
        self.currentState = initialState
    }
    
    func updateState(_ newState: APGIState) {
        self.currentState = newState
    }
    
    func getSnapshot() -> APGIState {
        return currentState
    }
    
    func reset(configuration: APGIConfiguration) {
        self.currentState = APGIState.initial(configuration: configuration)
    }
}

// MARK: - APGI Inference Engine

/// Main inference engine for APGI model
/// Manages model lifecycle, inference execution, and state updates
@MainActor
class APGIInferenceEngine: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var isModelLoaded = false
    @Published private(set) var isInferring = false
    @Published private(set) var currentFPS: Double = 0.0
    @Published private(set) var averageInferenceTime: TimeInterval = 0.0
    
    @Published var currentState: APGIState
    @Published var diagnostics: APGIDiagnostics
    
    // MARK: - Private Properties
    
    private let config: APGIConfiguration
    private var simpleModel: SimpleAPGIModel?
    private let stateManager: StateManager
    private let performanceMonitor = PerformanceMonitor()
    
    private var fpsUpdateTimer: Timer?
    private var lastInferenceTime: TimeInterval = 0.0
    
    // Make config accessible
    var configuration: APGIConfiguration { return config }
    
    // MARK: - Initialization
    
    init(configuration: APGIConfiguration) {
        self.config = configuration
        
        // Initialize state
        let initialState = APGIState.initial(configuration: configuration)
        self.currentState = initialState
        self.stateManager = StateManager(initialState: initialState)
        
        // Initialize diagnostics
        self.diagnostics = APGIDiagnostics(
            sTotal: 0.0,
            sIntero: 0.0,
            sExtero: 0.0,
            theta: Double(configuration.theta0),
            ignitionProb: 0.0,
            piIntero: 1.0,
            piExtero: 1.0,
            broadcastCost: 0.0,
            freeEnergy: 0.0,
            energyReserves: 1.0,
            allostaticLoad: 0.0,
            volatility: 0.0,
            norepinephrine: 0.0,
            acetylcholine: 0.0,
            refractoryTimer: 0.0
        )
        
        print("APGIInferenceEngine initialized with configuration:")
        print("  - Input size: \(configuration.inputSize)")
        print("  - Hidden size: \(configuration.hiddenSize)")
        print("  - Num levels: \(configuration.numLevels)")
        print("  - θ₀: \(configuration.theta0)")
    }
    
    deinit {
        fpsUpdateTimer?.invalidate()
    }
    
    // MARK: - Model Lifecycle
    
    /// Load APGI model
    /// Initializes SimpleAPGIModel with real APGI mathematics
    func loadModel() async throws {
        print("Loading APGI model...")
        
        do {
            // Create simple APGI model (pure Swift implementation)
            self.simpleModel = SimpleAPGIModel(configuration: config)
            
            // Small delay to simulate loading (can be removed)
            try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds
            
            isModelLoaded = true
            print("✅ APGI model loaded successfully")
            print("   Using SimpleAPGIModel (Phase 0: Core Mathematics)")
            
        } catch {
            isModelLoaded = false
            throw APGIError.modelLoadFailed(error.localizedDescription)
        }
    }
    
    /// Unload model and free resources
    func unloadModel() {
        simpleModel = nil
        isModelLoaded = false
        print("APGI model unloaded")
    }
    
    // MARK: - Inference
    
    /// Run inference with current inputs
    /// - Parameters:
    ///   - interoInput: Interoceptive input signals [inputSize]
    ///   - exteroInput: Exteroceptive input signals [inputSize]
    ///   - context: Context parameters (metabolic, cognitive, etc.)
    func runInference(
        interoInput: [Float],
        exteroInput: [Float],
        context: APGIContext
    ) async throws {
        
        // Check model is loaded
        guard let model = simpleModel else {
            throw APGIError.modelNotLoaded
        }
        
        // Validate inputs
        try validateInputs(interoInput: interoInput, exteroInput: exteroInput)
        
        // Mark as inferring
        isInferring = true
        defer { isInferring = false }
        
        let startTime = Date()
        
        do {
            // Get current state snapshot
            let stateSnapshot = await stateManager.getSnapshot()
            
            // Run inference on background thread
            let result = await Task.detached(priority: .userInitiated) {
                return model.forward(
                    interoInput: interoInput,
                    exteroInput: exteroInput,
                    state: stateSnapshot,
                    context: context
                )
            }.value
            
            // Calculate inference time
            let inferenceTime = Date().timeIntervalSince(startTime)
            lastInferenceTime = inferenceTime
            
            // Update performance metrics
            await performanceMonitor.recordInference(duration: inferenceTime)
            
            // Update FPS
            updateFPS(inferenceTime: inferenceTime)
            
            // Update state (thread-safe)
            await stateManager.updateState(result.newState)
            
            // Update published properties on main actor
            currentState = result.newState
            diagnostics = result.diagnostics
            
            // Update average inference time periodically
            if let timer = fpsUpdateTimer, timer.isValid {
                // Timer will update it
            } else {
                averageInferenceTime = performanceMonitor.averageInferenceTime
            }
            
        } catch {
            throw APGIError.inferenceError(error.localizedDescription)
        }
    }
    
    // MARK: - Input Validation
    
    private func validateInputs(
        interoInput: [Float],
        exteroInput: [Float]
    ) throws {
        // Check sizes
        if interoInput.count != config.inputSize {
            throw APGIError.invalidInput(
                "Interoceptive input size (\(interoInput.count)) doesn't match config (\(config.inputSize))"
            )
        }
        
        if exteroInput.count != config.inputSize {
            throw APGIError.invalidInput(
                "Exteroceptive input size (\(exteroInput.count)) doesn't match config (\(config.inputSize))"
            )
        }
        
        // Check for NaN or Inf
        if interoInput.contains(where: { $0.isNaN || $0.isInfinite }) {
            throw APGIError.invalidInput("Interoceptive input contains NaN or Inf")
        }
        
        if exteroInput.contains(where: { $0.isNaN || $0.isInfinite }) {
            throw APGIError.invalidInput("Exteroceptive input contains NaN or Inf")
        }
    }
    
    // MARK: - FPS Tracking
    
    private func updateFPS(inferenceTime: TimeInterval) {
        if inferenceTime > 0 {
            currentFPS = 1.0 / inferenceTime
        }
    }
    
    /// Start FPS monitoring timer
    func startFPSMonitoring() {
        fpsUpdateTimer?.invalidate()
        
        fpsUpdateTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                self.averageInferenceTime = self.performanceMonitor.averageInferenceTime
            }
        }
    }
    
    /// Stop FPS monitoring timer
    func stopFPSMonitoring() {
        fpsUpdateTimer?.invalidate()
        fpsUpdateTimer = nil
    }
    
    // MARK: - State Management
    
    /// Reset state to initial values
    func resetState() async {
        await stateManager.reset(configuration: config)
        let newState = await stateManager.getSnapshot()
        currentState = newState
        
        // Reset diagnostics
        diagnostics = APGIDiagnostics(
            sTotal: 0.0,
            sIntero: 0.0,
            sExtero: 0.0,
            theta: Double(config.theta0),
            ignitionProb: 0.0,
            piIntero: 1.0,
            piExtero: 1.0,
            broadcastCost: 0.0,
            freeEnergy: 0.0,
            energyReserves: 1.0,
            allostaticLoad: 0.0,
            volatility: 0.0,
            norepinephrine: 0.0,
            acetylcholine: 0.0,
            refractoryTimer: 0.0
        )
        
        // Reset performance metrics
        await performanceMonitor.reset()
        currentFPS = 0.0
        averageInferenceTime = 0.0
        
        print("State reset to initial values")
    }
    
    /// Get current ignition state classification
    func getIgnitionState() -> IgnitionState {
        let prob = diagnostics.ignitionProb
        
        if prob > 0.8 {
            return .high
        } else if prob > 0.5 {
            return .moderate
        } else if prob > 0.2 {
            return .low
        } else {
            return .refractory
        }
    }
    
    // MARK: - Performance Metrics
    
    /// Get detailed performance metrics
    func getPerformanceMetrics() async -> PerformanceMetrics {
        let stats = performanceMonitor.getStatistics()
        
        return PerformanceMetrics(
            averageInferenceTime: stats.meanLatency / 1000.0, // Convert ms to seconds
            medianInferenceTime: stats.p50Latency / 1000.0, // Convert ms to seconds
            currentFPS: currentFPS,
            lastInferenceTime: lastInferenceTime
        )
    }
}

// MARK: - Supporting Types

/// Performance metrics container
struct PerformanceMetrics {
    let averageInferenceTime: TimeInterval
    let medianInferenceTime: TimeInterval
    let currentFPS: Double
    let lastInferenceTime: TimeInterval
    
    var formattedAverageTime: String {
        String(format: "%.2f ms", averageInferenceTime * 1000)
    }
    
    var formattedMedianTime: String {
        String(format: "%.2f ms", medianInferenceTime * 1000)
    }
    
    var formattedFPS: String {
        String(format: "%.1f FPS", currentFPS)
    }
}

// MARK: - Extensions

extension APGIState {
    /// Create initial state from configuration
    static func initial(configuration: APGIConfiguration) -> APGIState {
        return APGIState.initialize(hiddenSize: configuration.hiddenSize, numLevels: configuration.numLevels)
    }
}

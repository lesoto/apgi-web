import Foundation
import CoreML
import SwiftUI
import Combine

@MainActor
class APGIInferenceEngine: ObservableObject {
    @Published var currentState: APGIState
    @Published var diagnostics: APGIDiagnostics?
    @Published var fps: Double = 0.0
    
    private var model: MLModel?
    public let config: APGIConfiguration
    private let performanceMonitor: PerformanceMonitor
    
    private var frameCount: Int = 0
    private var lastUpdateTime: Date?
    
    // Thread-safe state access using actor
    private actor StateManager {
        var state: APGIState
        
        init(state: APGIState) {
            self.state = state
        }
        
        func getSnapshot() -> APGIState {
            return state
        }
        
        func updateState(_ newState: APGIState) {
            state = newState
        }
    }
    
    private let stateManager: StateManager
    
    // REMOVED nonisolated - init is now main-actor isolated
    init(configuration: APGIConfiguration = .defaultConfig) {
        let initialState = APGIState.initialize(
            hiddenSize: configuration.hiddenSize,
            numLevels: configuration.numLevels
        )
        self.config = configuration
        self.currentState = initialState
        self.performanceMonitor = PerformanceMonitor()
        self.stateManager = StateManager(state: initialState)
    }
    
    func loadModel() async throws {
        // For now, use a mock implementation since the CoreML model has compilation issues
        // In production, this would load the actual APGI model
        print("Using mock APGI model for demonstration")
        
        // Simulate model loading delay
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        
        // Create a mock model that will generate deterministic outputs
        self.model = MockAPGIModel()
    }
    
    func runInference(interoInput: [Float], exteroInput: [Float], context: APGIContext) async throws {
        guard let model = model else {
            throw APGIError.modelNotFound
        }
        
        guard interoInput.count == config.inputSize,
              exteroInput.count == config.inputSize else {
            throw APGIError.inputConversionFailed("Input size mismatch")
        }
        
        // Get thread-safe state snapshot
        let currentStateSnapshot = await stateManager.getSnapshot()
        
        // Capture config for use in detached task
        let configCopy = self.config
        
        // Run inference on background thread (detached from main actor)
        let result = try await Task.detached(priority: .userInitiated) {
            // Helper function to create MLMultiArray (nonisolated)
            func createMLMultiArray(from data: [Float], shape: [Int]) -> MLMultiArray? {
                guard let array = try? MLMultiArray(shape: shape as [NSNumber], dataType: .float32) else {
                    return nil
                }
                
                for (index, value) in data.enumerated() {
                    array[index] = NSNumber(value: value)
                }
                
                return array
            }
            
            let inputDict: [String: MLMultiArray] = [
                "intero_input": createMLMultiArray(from: interoInput, shape: [1, configCopy.inputSize])!,
                "extero_input": createMLMultiArray(from: exteroInput, shape: [1, configCopy.inputSize])!,
                "workspace_state": currentStateSnapshot.workspaceState,
                "intero_states": currentStateSnapshot.interoStatesFlat,
                "extero_states": currentStateSnapshot.exteroStatesFlat,
                "q_mean": currentStateSnapshot.qMean,
                "q_var": currentStateSnapshot.qVar,
                "p_mean": currentStateSnapshot.pMean,
                "p_var": currentStateSnapshot.pVar,
                "Pi_intero": createMLMultiArray(from: [Float(currentStateSnapshot.piIntero)], shape: [1, 1])!,
                "Pi_extero": createMLMultiArray(from: [Float(currentStateSnapshot.piExtero)], shape: [1, 1])!,
                "theta": createMLMultiArray(from: [Float(currentStateSnapshot.theta)], shape: [1, 1])!,
                "prev_S": createMLMultiArray(from: [Float(currentStateSnapshot.prevS)], shape: [1, 1])!,
                "ignition_history": createMLMultiArray(from: [Float(currentStateSnapshot.prevIgnition)], shape: [1, 1])!,
                "refractory_timer": createMLMultiArray(from: [Float(currentStateSnapshot.refractoryTimer)], shape: [1, 1])!,
                "energy_reserves": createMLMultiArray(from: [Float(currentStateSnapshot.energyReserves)], shape: [1, 1])!,
                "allostatic_load": createMLMultiArray(from: [Float(currentStateSnapshot.allostaticLoad)], shape: [1, 1])!,
                "metabolic": createMLMultiArray(from: [Float(context.metabolic)], shape: [1, 1])!,
                "cognitive": createMLMultiArray(from: [Float(context.cognitive)], shape: [1, 1])!,
                "affective": createMLMultiArray(from: [Float(context.affective)], shape: [1, 1])!,
                "arousal": createMLMultiArray(from: [Float(context.arousal)], shape: [1, 1])!,
                "attention": createMLMultiArray(from: [Float(context.attention)], shape: [1, 1])!
            ]
            
            let startTime = Date()
            let provider = try MLDictionaryFeatureProvider(dictionary: inputDict)
            let output = try model.prediction(from: provider)
            let inferenceTime = Date().timeIntervalSince(startTime)
            
            return (output, inferenceTime)
        }.value
        
        // Process results and update state on main actor
        let (output, inferenceTime) = result
        
        await performanceMonitor.recordInference(duration: inferenceTime)
        updateFPS(inferenceTime: inferenceTime)
        
        // Build new state from output
        var newState = currentStateSnapshot
        
        if let workspace = output.featureValue(for: "workspace_new")?.multiArrayValue {
            newState.workspaceState = workspace
        } else if let workspace = output.featureValue(for: "workspace_state_out")?.multiArrayValue {
            newState.workspaceState = workspace
        } else if let workspace = output.featureValue(for: "workspace")?.multiArrayValue {
            newState.workspaceState = workspace
        }
        
        newState.theta = extractScalar(from: output, names: ["theta_new", "theta"]) ?? newState.theta
        newState.piIntero = extractScalar(from: output, names: ["Pi_intero_new", "Pi_intero"]) ?? newState.piIntero
        newState.piExtero = extractScalar(from: output, names: ["Pi_extero_new", "Pi_extero"]) ?? newState.piExtero
        newState.energyReserves = extractScalar(from: output, names: ["energy_new", "energy_reserves"]) ?? newState.energyReserves
        newState.allostaticLoad = extractScalar(from: output, names: ["allostatic_new", "allostatic_load"]) ?? newState.allostaticLoad
        newState.refractoryTimer = extractScalar(from: output, names: ["refractory_new", "refractory_timer"]) ?? newState.refractoryTimer
        
        let sTotal = extractScalar(from: output, names: ["S_total"]) ?? 0.0
        let ignitionProb = extractScalar(from: output, names: ["ignition_prob"]) ?? 0.0
        let broadcastCost = extractScalar(from: output, names: ["broadcast_cost"]) ?? 0.0
        let freeEnergy = extractScalar(from: output, names: ["free_energy"]) ?? 0.0
        
        newState.prevS = sTotal
        newState.prevIgnition = ignitionProb
        
        // Update both state manager and published property
        await stateManager.updateState(newState)
        currentState = newState
        
        diagnostics = APGIDiagnostics(
            sTotal: sTotal,
            sIntero: sTotal * 0.5,
            sExtero: sTotal * 0.5,
            theta: newState.theta,
            ignitionProb: ignitionProb,
            piIntero: newState.piIntero,
            piExtero: newState.piExtero,
            broadcastCost: broadcastCost,
            freeEnergy: freeEnergy,
            energyReserves: newState.energyReserves,
            allostaticLoad: newState.allostaticLoad,
            volatility: newState.volatility,
            norepinephrine: newState.norepinephrine,
            acetylcholine: newState.acetylcholine,
            refractoryTimer: newState.refractoryTimer
        )
    }
    
    private func extractScalar(from output: MLFeatureProvider, names: [String]) -> Double? {
        for name in names {
            if let value = output.featureValue(for: name)?.multiArrayValue?[0].floatValue {
                return Double(value)
            }
        }
        return nil
    }
    
    private func updateFPS(inferenceTime: TimeInterval) {
        frameCount += 1
        
        if let lastTime = lastUpdateTime {
            let elapsed = Date().timeIntervalSince(lastTime)
            if elapsed >= 1.0 {
                fps = Double(frameCount) / elapsed
                frameCount = 0
                lastUpdateTime = Date()
            }
        } else {
            lastUpdateTime = Date()
        }
    }
    
    func reset() async {
        let newState = APGIState.initialize(
            hiddenSize: config.hiddenSize,
            numLevels: config.numLevels
        )
        await stateManager.updateState(newState)
        currentState = newState
        diagnostics = nil
        frameCount = 0
        lastUpdateTime = nil
    }
}

// Mock model for demonstration purposes
class MockAPGIModel: MLModel {
    override func prediction(from input: MLFeatureProvider) throws -> MLFeatureProvider {
        // Generate mock outputs that simulate the APGI model behavior
        var outputDict: [String: MLFeatureValue] = [:]
        
        // Create mock MLMultiArrays for outputs
        let workspaceShape = [1, 64, 4] as [NSNumber]
        let scalarShape = [1, 1] as [NSNumber]
        
        // Mock workspace state
        if let workspace = try? MLMultiArray(shape: workspaceShape, dataType: .float32) {
            for i in 0..<workspace.count {
                workspace[i] = NSNumber(value: Float.random(in: -1...1))
            }
            outputDict["workspace_new"] = MLFeatureValue(multiArray: workspace)
        }
        
        // Mock scalar outputs
        let mockValues: [String: Float] = [
            "theta_new": Float.random(in: 0.1...0.9),
            "Pi_intero_new": Float.random(in: 0.1...0.9),
            "Pi_extero_new": Float.random(in: 0.1...0.9),
            "energy_new": Float.random(in: 0.3...1.0),
            "allostatic_new": Float.random(in: 0.0...0.5),
            "refractory_new": Float.random(in: 0.0...1.0),
            "S_total": Float.random(in: 0.0...2.0),
            "ignition_prob": Float.random(in: 0.0...1.0),
            "broadcast_cost": Float.random(in: 0.01...0.1),
            "free_energy": Float.random(in: 0.1...1.0)
        ]
        
        for (key, value) in mockValues {
            if let array = try? MLMultiArray(shape: scalarShape, dataType: .float32) {
                array[0] = NSNumber(value: value)
                outputDict[key] = MLFeatureValue(multiArray: array)
            }
        }
        
        return try MLDictionaryFeatureProvider(dictionary: outputDict)
    }
}

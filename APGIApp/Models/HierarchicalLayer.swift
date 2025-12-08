import Foundation
import CoreML

struct APGIState {
    // Neural states (MLMultiArray for CoreML)
    var interoStatesFlat: MLMultiArray
    var exteroStatesFlat: MLMultiArray
    var workspaceState: MLMultiArray
    
    // Probabilistic representations
    var qMean: MLMultiArray
    var qVar: MLMultiArray
    var pMean: MLMultiArray
    var pVar: MLMultiArray
    
    // Precision and threshold
    var piIntero: Double
    var piExtero: Double
    var theta: Double
    
    // Temporal tracking
    var prevS: Double
    var prevIgnition: Double
    
    // Metabolic state
    var energyReserves: Double
    var allostaticLoad: Double
    
    // Refractory period
    var refractoryTimer: Double
    
    // Additional state
    var volatility: Double
    var norepinephrine: Double
    var acetylcholine: Double
    
    // Remove @MainActor from static method
    static func initialize(hiddenSize: Int = 128, numLevels: Int = 3) -> APGIState {
        let interoStates = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize * numLevels)], dataType: .float32)
        let exteroStates = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize * numLevels)], dataType: .float32)
        let workspace = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize)], dataType: .float32)
        let qMean = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize)], dataType: .float32)
        let qVar = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize)], dataType: .float32)
        let pMean = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize)], dataType: .float32)
        let pVar = try! MLMultiArray(shape: [1, NSNumber(value: hiddenSize)], dataType: .float32)
        
        // Initialize with default values
        for i in 0..<(hiddenSize * numLevels) {
            interoStates[i] = 0.0
            exteroStates[i] = 0.0
        }
        
        for i in 0..<hiddenSize {
            workspace[i] = 0.0
            qMean[i] = 0.0
            qVar[i] = 1.0
            pMean[i] = 0.0
            pVar[i] = 1.0
        }
        
        return APGIState(
            interoStatesFlat: interoStates,
            exteroStatesFlat: exteroStates,
            workspaceState: workspace,
            qMean: qMean,
            qVar: qVar,
            pMean: pMean,
            pVar: pVar,
            piIntero: 1.0,
            piExtero: 1.0,
            theta: 1.0,
            prevS: 0.0,
            prevIgnition: 0.0,
            energyReserves: 0.8,
            allostaticLoad: 0.0,
            refractoryTimer: 0.0,
            volatility: 0.0,
            norepinephrine: 0.0,
            acetylcholine: 0.0
        )
    }
}

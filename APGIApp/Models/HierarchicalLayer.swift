import Foundation
import Darwin

struct HierarchicalLayer {
    let level: Int
    let inputSize: Int
    let hiddenSize: Int
    let config: APGIConfiguration
    
    // Simple linear transformation (can be upgraded to LTC later)
    var weights: [[Float]]  // [hiddenSize x inputSize]
    var bias: [Float]       // [hiddenSize]
    
    init(level: Int, inputSize: Int, hiddenSize: Int, config: APGIConfiguration) {
        self.level = level
        self.inputSize = inputSize
        self.hiddenSize = hiddenSize
        self.config = config
        
        // Xavier initialization
        // Xavier initialization
        let scale = sqrt(2.0 / Float(inputSize))
        self.weights = (0..<hiddenSize).map { _ in
            (0..<inputSize).map { _ in Float.random(in: -scale...scale) }
        }
        self.bias = Array(repeating: 0.0, count: hiddenSize)
    }
    
    func forward(input: [Float], prevState: [Float]) -> (state: [Float], prediction: [Float]) {
        // Compute new state: tanh(W·input + b)
        var newState: [Float] = []
        for i in 0..<hiddenSize {
            var sum = bias[i]
            for j in 0..<min(input.count, inputSize) {
                sum += weights[i][j] * input[j]
            }
            newState.append(tanh(sum))
        }
        
        // Generate prediction for lower level (simple linear)
        let prediction = newState  // Simplified
        
        return (newState, prediction)
    }
}

/// Container for hierarchical processing
struct HierarchicalProcessor {
    var layers: [HierarchicalLayer]
    let config: APGIConfiguration
    
    init(numLevels: Int, inputSize: Int, hiddenSize: Int, config: APGIConfiguration) {
        self.config = config
        self.layers = (0..<numLevels).map { level in
            HierarchicalLayer(
                level: level,
                inputSize: level == 0 ? inputSize : hiddenSize,
                hiddenSize: hiddenSize,
                config: config
            )
        }
    }
    
    func processHierarchy(
        input: [Float],
        states: [[Float]]
    ) -> (newStates: [[Float]], errors: [[Float]]) {
        var newStates: [[Float]] = []
        var errors: [[Float]] = []
        var currentInput = input
        
        for (index, layer) in layers.enumerated() {
            let prevState = states[index]
            let (state, prediction) = layer.forward(input: currentInput, prevState: prevState)
            
            // Compute prediction error
            let error = zip(currentInput, prediction).map { $0 - $1 }
            
            newStates.append(state)
            errors.append(error)
            currentInput = state  // Feed forward to next level
        }
        
        return (newStates, errors)
    }
}

import Foundation
import Darwin

struct LTCNeuron {
    let inputSize: Int
    let hiddenSize: Int
    let config: APGIConfiguration
    
    var wIn: [[Float]]   // Input weights
    var wRec: [[Float]]  // Recurrent weights (sparse)
    var bias: [Float]
    
    init(inputSize: Int, hiddenSize: Int, config: APGIConfiguration) {
        self.inputSize = inputSize
        self.hiddenSize = hiddenSize
        self.config = config
        
        // Initialize weights
        let scaleIn = sqrt(2.0 / Float(inputSize))
        let scaleRec = config.reservoirScaling
        
        self.wIn = (0..<hiddenSize).map { _ in
            (0..<inputSize).map { _ in Float.random(in: -scaleIn...scaleIn) }
        }
        
        // Sparse recurrent weights
        self.wRec = (0..<hiddenSize).map { _ in
            (0..<hiddenSize).map { _ in
                Float.random(in: 0...1) > config.reservoirSparsity ?
                    Float.random(in: -scaleRec...Float(scaleRec)) : 0.0
            }
        }
        
        self.bias = Array(repeating: 0.0, count: hiddenSize)
    }
    
    /// Forward pass with ODE integration: dx/dt = (1/τ)·(-x + σ(W·input + b))
    func forward(input: [Float], state: [Float], tau: Float, dt: Float) -> [Float] {
        var newState: [Float] = []
        
        for i in 0..<hiddenSize {
            // Compute target: σ(W_in·input + W_rec·state + b)
            var sum = bias[i]
            
            // Input contribution
            for j in 0..<min(input.count, inputSize) {
                sum += wIn[i][j] * input[j]
            }
            
            // Recurrent contribution
            for j in 0..<hiddenSize {
                sum += wRec[i][j] * state[j]
            }
            
            let target = tanh(sum)
            
            // ODE integration: dx/dt = (1/τ)·(-x + target)
            let dxdt = (1.0 / tau) * (-state[i] + target)
            let x_new = state[i] + dt * dxdt
            
            newState.append(x_new)
        }
        
        return newState
    }
}

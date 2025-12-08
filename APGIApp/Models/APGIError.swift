import Foundation

enum APGIError: Error, LocalizedError {
    case modelNotLoaded
    case modelLoadFailed(String)
    case inferenceError(String)
    case invalidInput(String)
    case stateUpdateFailed(String)
    case modelNotFound
    case inputConversionFailed(String)
    case inferenceFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .modelNotLoaded:
            return "APGI model not loaded. Call loadModel() first."
        case .modelLoadFailed(let message):
            return "Failed to load APGI model: \(message)"
        case .inferenceError(let message):
            return "Inference error: \(message)"
        case .invalidInput(let message):
            return "Invalid input: \(message)"
        case .stateUpdateFailed(let message):
            return "State update failed: \(message)"
        case .modelNotFound:
            return "The APGI CoreML model file was not found in the application bundle."
        case .inputConversionFailed(let field):
            return "Failed to convert input data for MLMultiArray: \(field)."
        case .inferenceFailed(let error):
            return "CoreML inference failed: \(error.localizedDescription)"
        }
    }
}

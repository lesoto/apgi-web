import Foundation

enum APGIError: Error {
    case modelNotFound
    case inputConversionFailed(String)
    case inferenceFailed(Error)
    
    var localizedDescription: String {
        switch self {
        case .modelNotFound:
            return "The APGI CoreML model file was not found in the application bundle."
        case .inputConversionFailed(let field):
            return "Failed to convert input data for MLMultiArray: \(field)."
        case .inferenceFailed(let error):
            return "CoreML inference failed: \(error.localizedDescription)"
        }
    }
}

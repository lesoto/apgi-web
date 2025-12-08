import Foundation
import SwiftUI // Required for the Color type

enum IgnitionState: String, Codable {
    case high = "CONSCIOUS"
    case moderate = "PRE-IGNITION"
    case low = "SUBLIMINAL"
    case refractory = "REFRACTORY"
    
    var color: Color {
        switch self {
        case .high: return .green
        case .moderate: return .orange
        case .low: return .red
        case .refractory: return .blue
        }
    }
    
    static func from(probability: Double) -> IgnitionState {
        // Simple logic for state classification
        if probability >= 0.8 {
            return .high
        } else if probability >= 0.5 {
            return .moderate
        } else if probability >= 0.2 {
            return .low
        } else {
            return .refractory
        }
    }
}

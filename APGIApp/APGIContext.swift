//  APGIState.swift

import Foundation

struct APGIContext {
    // Note: These are defined as Double to easily interact with SwiftUI Sliders
    var metabolic: Double = 0.5 // E.g., energy demand/supply
    var cognitive: Double = 0.5 // E.g., complexity of task/demand
    var affective: Double = 0.5 // E.g., emotional valence/salience
    var arousal: Double = 0.5 // E.g., non-specific wakefulness level
    var attention: Double = 0.5 // E.g., focused attention modulation
}

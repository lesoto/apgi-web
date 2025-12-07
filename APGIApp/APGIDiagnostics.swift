import Foundation
import SwiftUI

struct APGIDiagnostics: Identifiable, Codable, Equatable {
    var id = UUID()
    var timestamp = Date()
    
    let sTotal: Double
    let sIntero: Double
    let sExtero: Double
    let theta: Double
    let ignitionProb: Double
    
    let piIntero: Double
    let piExtero: Double
    let broadcastCost: Double
    let freeEnergy: Double
    let energyReserves: Double
    let allostaticLoad: Double
    
    let volatility: Double
    let norepinephrine: Double
    let acetylcholine: Double
    let refractoryTimer: Double
    
    var ignitionState: IgnitionState {
        IgnitionState.from(probability: ignitionProb)
    }
    
    var isIgnited: Bool {
        ignitionProb > 0.5
    }
    
    var surpriseAboveThreshold: Bool {
        sTotal > theta
    }
    
    var metabolicEfficiency: Double {
        guard broadcastCost > 0 else { return 1.0 }
        return (1.0 - freeEnergy) / broadcastCost
    }
    
    static func == (lhs: APGIDiagnostics, rhs: APGIDiagnostics) -> Bool {
        lhs.id == rhs.id
    }
}

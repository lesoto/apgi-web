import Foundation
import CoreML
import SwiftUI

struct APGIConfiguration: Equatable {
    let inputSize: Int
    let hiddenSize: Int
    let numLevels: Int
    
    let dtMs: Float
    let maxWindowMs: Float
    
    let theta0: Float
    let gamma: Float
    let delta: Float
    let lambdaUrg: Float
    let thetaMin: Float
    let thetaMax: Float
    
    let betaTransition: Float
    let hysteresis: Float
    
    let tauMin: Float
    let tauMax: Float
    let tauInteroBaseline: Float
    let tauExteroBaseline: Float
    let precisionMin: Float
    let precisionMax: Float
    
    let alphaBroadcast: Float
    let betaMaintenance: Float
    let energyDepletionRate: Float
    let energyMin: Float
    let energyMax: Float
    
    let allostaticIncreaseRate: Float
    let allostaticDecreaseRate: Float
    let allostaticMin: Float
    let allostaticMax: Float
    
    let maxRefractoryMs: Float
    let historyLength: Int
    let eps: Float
    
    init(
        inputSize: Int = 64,
        hiddenSize: Int = 128,
        numLevels: Int = 3,
        dtMs: Float = 10.0,
        maxWindowMs: Float = 500.0,
        theta0: Float = 1.0,
        gamma: Float = 0.1,
        delta: Float = 0.5,
        lambdaUrg: Float = 0.2,
        thetaMin: Float = 0.1,
        thetaMax: Float = 5.0,
        betaTransition: Float = 10.0,
        hysteresis: Float = 0.2,
        tauMin: Float = 0.01,
        tauMax: Float = 10.0,
        tauInteroBaseline: Float = 0.1,
        tauExteroBaseline: Float = 0.05,
        precisionMin: Float = 0.01,
        precisionMax: Float = 10.0,
        alphaBroadcast: Float = 1.0,
        betaMaintenance: Float = 0.5,
        energyDepletionRate: Float = 0.001,
        energyMin: Float = 0.0,
        energyMax: Float = 1.0,
        allostaticIncreaseRate: Float = 0.01,
        allostaticDecreaseRate: Float = 0.5,
        allostaticMin: Float = 0.0,
        allostaticMax: Float = 2.0,
        maxRefractoryMs: Float = 200.0,
        historyLength: Int = 100,
        eps: Float = 1e-8
    ) {
        self.inputSize = inputSize
        self.hiddenSize = hiddenSize
        self.numLevels = numLevels
        self.dtMs = dtMs
        self.maxWindowMs = maxWindowMs
        self.theta0 = theta0
        self.gamma = gamma
        self.delta = delta
        self.lambdaUrg = lambdaUrg
        self.thetaMin = thetaMin
        self.thetaMax = thetaMax
        self.betaTransition = betaTransition
        self.hysteresis = hysteresis
        self.tauMin = tauMin
        self.tauMax = tauMax
        self.tauInteroBaseline = tauInteroBaseline
        self.tauExteroBaseline = tauExteroBaseline
        self.precisionMin = precisionMin
        self.precisionMax = precisionMax
        self.alphaBroadcast = alphaBroadcast
        self.betaMaintenance = betaMaintenance
        self.energyDepletionRate = energyDepletionRate
        self.energyMin = energyMin
        self.energyMax = energyMax
        self.allostaticIncreaseRate = allostaticIncreaseRate
        self.allostaticDecreaseRate = allostaticDecreaseRate
        self.allostaticMin = allostaticMin
        self.allostaticMax = allostaticMax
        self.maxRefractoryMs = maxRefractoryMs
        self.historyLength = historyLength
        self.eps = eps
    }
    
    @MainActor
    static let `default` = APGIConfiguration(
        inputSize: 64,
        hiddenSize: 128,
        numLevels: 3,
        dtMs: 10.0,
        theta0: 1.0,
        thetaMin: 0.1,
        thetaMax: 5.0,
        precisionMin: 0.01,
        precisionMax: 10.0,
        energyMin: 0.0,
        energyMax: 1.0,
        historyLength: 100
    )
    
    nonisolated static let defaultConfig = APGIConfiguration(
        inputSize: 64,
        hiddenSize: 128,
        numLevels: 3,
        dtMs: 10.0,
        theta0: 1.0,
        thetaMin: 0.1,
        thetaMax: 5.0,
        precisionMin: 0.01,
        precisionMax: 10.0,
        energyMin: 0.0,
        energyMax: 1.0,
        historyLength: 100
    )
}

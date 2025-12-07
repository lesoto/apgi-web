import Foundation
import SwiftUI
import Combine

@MainActor
class PerformanceMonitor: ObservableObject {
    @Published var averageInferenceTime: Double = 0.0
    @Published var peakMemoryUsage: Double = 0.0
    @Published var currentFPS: Double = 0.0
    
    private var inferenceTimes: [Double] = []
    private let maxSamples = 100
    
    func recordInference(duration: TimeInterval) {
        inferenceTimes.append(duration)
        if inferenceTimes.count > maxSamples {
            inferenceTimes.removeFirst()
        }
        averageInferenceTime = inferenceTimes.reduce(0, +) / Double(inferenceTimes.count)
        
        if averageInferenceTime > 0 {
            currentFPS = 1.0 / averageInferenceTime
        }
    }
    
    func getStatistics() -> PerformanceStats {
        guard !inferenceTimes.isEmpty else {
            return PerformanceStats(
                meanLatency: 0.0,
                p50Latency: 0.0,
                p95Latency: 0.0,
                throughput: 0.0
            )
        }
        
        let mean = inferenceTimes.reduce(0, +) / Double(inferenceTimes.count)
        let sorted = inferenceTimes.sorted()
        let p50 = sorted[sorted.count / 2]
        let p95Index = min(Int(Double(sorted.count) * 0.95), sorted.count - 1)
        let p95 = sorted[p95Index]
        let throughput = mean > 0 ? 1.0 / mean : 0.0
        
        return PerformanceStats(
            meanLatency: mean * 1000,
            p50Latency: p50 * 1000,
            p95Latency: p95 * 1000,
            throughput: throughput
        )
    }
    
    func reset() {
        inferenceTimes.removeAll()
        averageInferenceTime = 0.0
        peakMemoryUsage = 0.0
        currentFPS = 0.0
    }
}

struct PerformanceStats: Sendable {
    let meanLatency: Double
    let p50Latency: Double
    let p95Latency: Double
    let throughput: Double
}

import SwiftUI
import Charts

struct TimeSeriesView: View {
    @EnvironmentObject var engine: APGIInferenceEngine
    @State private var history: [APGIDiagnostics] = []
    
    var body: some View {
        if #available(iOS 16, macOS 13, *) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Temporal Dynamics: Surprise, Threshold, & Ignition")
                    .font(.headline)
                
                if history.isEmpty {
                    Text("Awaiting diagnostic data...")
                        .foregroundColor(.secondary)
                        .frame(height: 200)
                } else {
                    Chart(history) { snapshot in
                        LineMark(
                            x: .value("Time", snapshot.timestamp),
                            y: .value("Surprise", snapshot.sTotal)
                        )
                        .foregroundStyle(.blue)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                        
                        LineMark(
                            x: .value("Time", snapshot.timestamp),
                            y: .value("Threshold", snapshot.theta)
                        )
                        .foregroundStyle(.orange)
                        .interpolationMethod(.catmullRom)
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))
                        
                        LineMark(
                            x: .value("Time", snapshot.timestamp),
                            y: .value("P(I=1)", snapshot.ignitionProb)
                        )
                        .foregroundStyle(.green.opacity(0.7))
                        .interpolationMethod(.monotone)
                        .lineStyle(StrokeStyle(lineWidth: 2.5))
                    }
                    .frame(height: 200)
                    .chartYAxis {
                        AxisMarks(position: .leading)
                    }
                    .chartXAxis(.hidden)
                    .chartLegend(position: .bottom, alignment: .center)
                }
            }
            .padding()
            .onChange(of: engine.diagnostics) { _, newDiag in
                if let diag = newDiag {
                    history.append(diag)
                    if history.count > engine.config.historyLength {
                        history.removeFirst()
                    }
                }
            }
        } else {
            Text("Charts visualization requires iOS 16.0 / macOS 13.0 or later.")
                .foregroundColor(.red)
                .padding()
        }
    }
}

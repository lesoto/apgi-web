import SwiftUI
import Charts

struct ContentView: View {
    @StateObject private var engine = APGIInferenceEngine(configuration: .default)
    @State private var isLoading = true
    @State private var loadError: String?
    @State private var context = APGIContext()
    @State private var isSimulating = false
    @State private var simulationTimer: Timer?
    
    var body: some View {
        VStack(spacing: 0) {
            headerView
            Divider()
            
            ScrollView {
                VStack(spacing: 20) {
                    if isLoading {
                        loadingView
                    } else if let error = loadError {
                        errorView(error)
                    } else {
                        statusSection
                        dynamicsChartSection
                        controlsSection
                        diagnosticsSection
                    }
                }
                .padding()
            }
        }
        .task {
            await loadModel()
        }
        .environmentObject(engine)
    }
    
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("APGI Consciousness Model")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Allostatic Precision-Gated Ignition")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text(String(format: "%.1f FPS", engine.currentFPS))
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
                
                Text(isSimulating ? "Running" : "Stopped")
                    .font(.caption)
                    .foregroundColor(isSimulating ? .green : .orange)
            }
        }
        .padding()
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading APGI Model...")
                .font(.headline)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(100)
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            
            Text("Error Loading Model")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(error)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding()
            
            Button("Retry") {
                Task {
                    await loadModel()
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(100)
    }
    
    private var statusSection: some View {
        GroupBox {
            VStack(spacing: 15) {
                HStack {
                    Text("Ignition State")
                        .font(.headline)
                    Spacer()
                    ignitionBadge
                }
                
                let diag = engine.diagnostics
                HStack {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Surprise (S)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(String(format: "%.3f", diag.sTotal))
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Threshold (θ)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(String(format: "%.3f", diag.theta))
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        
                        Spacer()
                        
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Ignition Prob")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(String(format: "%.1f%%", diag.ignitionProb * 100))
                                .font(.title3)
                                .fontWeight(.semibold)
                                .foregroundColor(ignitionColor(diag.ignitionProb))
                        }
                    }
            }
            .padding()
        } label: {
            Label("Status", systemImage: "brain.head.profile")
        }
    }
    
    private var ignitionBadge: some View {
        let diag = engine.diagnostics
        let state = IgnitionState.from(probability: diag.ignitionProb)
        return Text(state.rawValue)
            .font(.headline)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(state.color.opacity(0.2))
            .foregroundColor(state.color)
            .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    private var dynamicsChartSection: some View {
        GroupBox {
            TimeSeriesView()
                .frame(height: 250)
        } label: {
            Label("Temporal Dynamics", systemImage: "waveform.path.ecg")
        }
    }
    
    private var controlsSection: some View {
        GroupBox {
            VStack(spacing: 20) {
                Button(action: toggleSimulation) {
                    Label(isSimulating ? "Stop Simulation" : "Start Simulation",
                          systemImage: isSimulating ? "stop.fill" : "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(isSimulating ? .red : .green)
                
                Divider()
                
                VStack(spacing: 15) {
                    sliderControl("Metabolic", value: $context.metabolic, color: .red)
                    sliderControl("Cognitive", value: $context.cognitive, color: .blue)
                    sliderControl("Affective", value: $context.affective, color: .purple)
                    sliderControl("Arousal", value: $context.arousal, color: .orange)
                    sliderControl("Attention", value: $context.attention, color: .green)
                }
            }
            .padding()
        } label: {
            Label("Control Panel", systemImage: "slider.horizontal.3")
        }
    }
    
    private func sliderControl(_ label: String, value: Binding<Double>, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%.2f", value.wrappedValue))
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(color)
            }
            
            Slider(value: value, in: 0...1)
                .tint(color)
        }
    }
    
    private var diagnosticsSection: some View {
        GroupBox {
            let diag = engine.diagnostics
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                    diagnosticCell("Π Intero", value: diag.piIntero, format: "%.3f")
                    diagnosticCell("Π Extero", value: diag.piExtero, format: "%.3f")
                    diagnosticCell("Cost", value: diag.broadcastCost, format: "%.4f")
                    diagnosticCell("Free Energy", value: diag.freeEnergy, format: "%.4f")
                    diagnosticCell("Energy", value: diag.energyReserves, format: "%.2f")
                    diagnosticCell("Load", value: diag.allostaticLoad, format: "%.3f")
                }
                .padding()
        } label: {
            Label("Diagnostics", systemImage: "chart.bar.doc.horizontal")
        }
    }
    
    private func diagnosticCell(_ label: String, value: Double, format: String) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(String(format: format, value))
                .font(.headline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
    
    private func loadModel() async {
        isLoading = true
        loadError = nil
        
        do {
            try await engine.loadModel()
            isLoading = false
        } catch {
            isLoading = false
            loadError = error.localizedDescription
        }
    }
    
    private func toggleSimulation() {
        isSimulating.toggle()
        
        if isSimulating {
            startSimulation()
        } else {
            stopSimulation()
        }
    }
    
    private func startSimulation() {
        simulationTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            Task { @MainActor in
                await runSimulationStep()
            }
        }
    }
    
    private func stopSimulation() {
        simulationTimer?.invalidate()
        simulationTimer = nil
    }
    
    private func runSimulationStep() async {
        let interoInput = (0..<64).map { _ in Float.random(in: -1...1) }
        let exteroInput = (0..<64).map { _ in Float.random(in: -1...1) }
        
        do {
            try await engine.runInference(interoInput: interoInput,
                                         exteroInput: exteroInput,
                                         context: context)
        } catch {
            print("Inference error: \(error.localizedDescription)")
            await MainActor.run {
                stopSimulation()
            }
        }
    }
    
    private func ignitionColor(_ prob: Double) -> Color {
        if prob > 0.8 {
            return .green
        } else if prob > 0.3 {
            return .orange
        } else {
            return .red
        }
    }
}

#Preview {
    ContentView()
        .frame(width: 800, height: 1000)
}

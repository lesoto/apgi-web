import XCTest

@MainActor
final class APGITests: XCTestCase {
    var engine: APGIInferenceEngine!
    
    override func setUp() async throws {
        engine = APGIInferenceEngine(configuration: .default)
        try await engine.loadModel()
    }
    
    func testModelLoading() async throws {
        XCTAssertNotNil(engine)
    }
    
    func testInferenceBasic() async throws {
        let interoInput = Array(repeating: Float(0.5), count: 64)
        let exteroInput = Array(repeating: Float(0.5), count: 64)
        let context = APGIContext(
            metabolic: 0.7,
            cognitive: 0.6,
            affective: 0.0,
            arousal: 0.5,
            attention: 0.8
        )
        
        try await engine.runInference(
            interoInput: interoInput,
            exteroInput: exteroInput,
            context: context
        )
        
        XCTAssertNotNil(engine.diagnostics)
        XCTAssertGreaterThan(engine.currentState.theta, 0.0)
    }
    
    func testIgnitionThreshold() async throws {
        let highInput = Array(repeating: Float(2.0), count: 64)
        let context = APGIContext(
            metabolic: 0.7,
            cognitive: 0.8,
            affective: 0.5,
            arousal: 0.9,
            attention: 1.0
        )
        
        try await engine.runInference(
            interoInput: highInput,
            exteroInput: highInput,
            context: context
        )
        
        XCTAssertNotNil(engine.diagnostics)
        if let diag = engine.diagnostics {
            XCTAssertGreaterThan(diag.sTotal, 0.0)
        }
    }
    
    func testMultipleSteps() async throws {
        let context = APGIContext(
            metabolic: 0.7,
            cognitive: 0.6,
            affective: 0.0,
            arousal: 0.5,
            attention: 0.8
        )
        
        for i in 0..<10 {
            let magnitude = Float(0.5 + Double(i) * 0.1)
            let interoInput = Array(repeating: magnitude, count: 64)
            let exteroInput = Array(repeating: magnitude, count: 64)
            
            try await engine.runInference(
                interoInput: interoInput,
                exteroInput: exteroInput,
                context: context
            )
        }
        
        XCTAssertNotNil(engine.diagnostics)
    }
}

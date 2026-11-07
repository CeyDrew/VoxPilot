// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "voxpilot",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "voxpilot", targets: ["VoxPilot"]),
    ],
    dependencies: [
        .package(url: "https://github.com/migueldeicaza/SwiftTerm", from: "1.20.0"),
    ],
    targets: [
        .executableTarget(
            name: "VoxPilot",
            dependencies: [.product(name: "SwiftTerm", package: "SwiftTerm")],
            path: "Sources/VoxPilot"
        ),
    ]
)

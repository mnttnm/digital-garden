// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CaptureApp",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "CaptureApp", targets: ["CaptureApp"])
    ],
    targets: [
        .executableTarget(
            name: "CaptureApp",
            path: "CaptureApp",
            exclude: ["Info.plist", "CaptureApp.entitlements"],
            resources: [
                .process("Assets.xcassets")
            ]
        )
    ]
)

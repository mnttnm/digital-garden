import SwiftUI
import AppKit

extension Notification.Name {
    static let captureAppWillShowWindow = Notification.Name("captureAppWillShowWindow")
}

@MainActor
final class AppWindowController: NSObject, NSWindowDelegate {
    static let shared = AppWindowController()

    private var captureWindow: NSWindow?

    func showCaptureWindow() {
        if captureWindow == nil {
            captureWindow = makeCaptureWindow()
        }

        NotificationCenter.default.post(name: .captureAppWillShowWindow, object: nil)

        NSApp.activate(ignoringOtherApps: true)
        captureWindow?.makeKeyAndOrderFront(nil)
    }

    func hideCaptureWindow() {
        captureWindow?.orderOut(nil)
    }

    // MARK: - NSWindowDelegate

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        // Hide instead of destroying the window so we can instantly bring it back.
        sender.orderOut(nil)
        return false
    }

    // MARK: - Private

    private func makeCaptureWindow() -> NSWindow {
        let rootView = ContentView()
            .environmentObject(SettingsManager.shared)
            .environmentObject(AppNavigationState.shared)

        let hosting = NSHostingController(rootView: rootView)

        let window = NSWindow(contentViewController: hosting)
        window.setContentSize(NSSize(width: 520, height: 740))
        window.center()

        window.title = "Capture"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true

        window.isReleasedWhenClosed = false
        window.delegate = self

        // Remember size/position across launches.
        window.setFrameAutosaveName("CaptureApp.MainWindow")

        return window
    }
}

import SwiftUI
import AppKit

@main
struct CaptureApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var settingsManager = SettingsManager.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(settingsManager)
                .frame(minWidth: 500, minHeight: 600)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }

        Settings {
            SettingsView()
                .environmentObject(settingsManager)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var hotKeyMonitor: Any?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Register global keyboard shortcut (Cmd+Shift+C)
        registerGlobalHotKey()

        // Make the app appear in front
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    func registerGlobalHotKey() {
        // Using NSEvent for global monitoring
        // Cmd+Shift+C to open capture window
        hotKeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            // Check for Cmd+Shift+C
            if event.modifierFlags.contains([.command, .shift]) && event.keyCode == 8 { // 'c' key
                DispatchQueue.main.async {
                    self?.bringAppToFront()
                }
            }
        }
    }

    func bringAppToFront() {
        NSApp.activate(ignoringOtherApps: true)
        if let window = NSApp.windows.first {
            window.makeKeyAndOrderFront(nil)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let monitor = hotKeyMonitor {
            NSEvent.removeMonitor(monitor)
        }
    }
}

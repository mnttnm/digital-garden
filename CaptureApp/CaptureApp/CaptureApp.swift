import SwiftUI
import AppKit

@main
struct CaptureApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var settingsManager = SettingsManager.shared
    @StateObject private var navigation = AppNavigationState.shared

    var body: some Scene {
        // We manage the main capture window manually (NSWindow) so we can reliably
        // show/hide it from a global hotkey and keep the app running in the menu bar.
        MenuBarExtra("Capture", systemImage: "tray.and.arrow.down") {
            CaptureMenu()
                .environmentObject(settingsManager)
                .environmentObject(navigation)
        }
        .menuBarExtraStyle(.window)
        .commands {
            // Keep Cmd+, working without spawning a separate Settings window.
            CommandGroup(replacing: .appSettings) {
                Button("Configuration…") {
                    navigation.selectedTab = .configuration
                    AppWindowController.shared.showCaptureWindow()
                }
                .keyboardShortcut(",", modifiers: [.command])
            }
        }

        // Keep the app running even if windows are closed.
        // The main capture window is handled by AppWindowController.
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var hotKeyMonitor: Any?

    func applicationDidFinishLaunching(_ notification: Notification) {
        registerGlobalHotKeys()
        AppWindowController.shared.showCaptureWindow()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Menu bar app: stay alive when windows close.
        return false
    }

    private func registerGlobalHotKeys() {
        // Cmd+Shift+C: open capture window
        hotKeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { event in
            if event.modifierFlags.contains([.command, .shift]) && event.keyCode == 8 {
                DispatchQueue.main.async {
                    AppWindowController.shared.showCaptureWindow()
                }
                return
            }

            // Cmd+Ctrl+C: quick capture clipboard (optional)
            if event.modifierFlags.contains([.command, .control]) && event.keyCode == 8 {
                DispatchQueue.main.async {
                    guard SettingsManager.shared.enableQuickCaptureHotkey else { return }
                    Task { await QuickCaptureService.shared.quickCaptureFromClipboard() }
                }
            }
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let monitor = hotKeyMonitor {
            NSEvent.removeMonitor(monitor)
        }
    }
}

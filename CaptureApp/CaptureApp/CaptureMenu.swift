import SwiftUI
import AppKit

struct CaptureMenu: View {
    @EnvironmentObject private var settings: SettingsManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button("New Capture") {
                AppWindowController.shared.showCaptureWindow()
            }
            .keyboardShortcut("c", modifiers: [.command, .shift])

            Button("Quick Capture from Clipboard") {
                Task { await QuickCaptureService.shared.quickCaptureFromClipboard() }
            }
            .keyboardShortcut("c", modifiers: [.command, .control])

            Divider()

            Button(settings.isConfigured ? "Configuration…" : "Configure…") {
                AppNavigationState.shared.selectedTab = .configuration
                AppWindowController.shared.showCaptureWindow()
            }
            .keyboardShortcut(",", modifiers: [.command])

            Divider()

            Button("Quit") {
                NSApp.terminate(nil)
            }
            .keyboardShortcut("q", modifiers: [.command])

            HStack(spacing: 6) {
                Circle()
                    .fill(settings.isConfigured ? Color.green : Color.orange)
                    .frame(width: 7, height: 7)

                Text(settings.isConfigured ? "Ready" : "Not configured")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 4)
        }
        .padding(10)
        .frame(width: 240)
    }
}

#Preview {
    CaptureMenu()
        .environmentObject(SettingsManager.shared)
}

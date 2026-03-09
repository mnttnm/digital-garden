import SwiftUI
import AppKit

@MainActor
final class HUDToastController {
    static let shared = HUDToastController()

    private var window: NSPanel?
    private var hideTask: Task<Void, Never>?

    func show(message: String, kind: Kind = .success, duration: TimeInterval = 1.6) {
        hideTask?.cancel()

        if window == nil {
            window = makePanel()
        }

        let rootView = HUDToastView(message: message, kind: kind)
        window?.contentViewController = NSHostingController(rootView: rootView)

        positionPanel()

        window?.orderFrontRegardless()

        hideTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            self.window?.orderOut(nil)
        }
    }

    enum Kind {
        case success
        case failure
        case info

        var systemImage: String {
            switch self {
            case .success: return "checkmark.circle.fill"
            case .failure: return "xmark.octagon.fill"
            case .info: return "info.circle.fill"
            }
        }

        var tint: Color {
            switch self {
            case .success: return .green
            case .failure: return .red
            case .info: return .blue
            }
        }
    }

    private func makePanel() -> NSPanel {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 64),
            styleMask: [.nonactivatingPanel, .borderless],
            backing: .buffered,
            defer: false
        )

        panel.isFloatingPanel = true
        panel.level = .floating
        panel.hasShadow = true
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.ignoresMouseEvents = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        return panel
    }

    private func positionPanel() {
        guard let screen = NSScreen.main ?? NSScreen.screens.first,
              let panel = window else { return }

        let visible = screen.visibleFrame
        let size = panel.frame.size

        // Top-center with a bit of padding.
        let x = visible.midX - size.width / 2
        let y = visible.maxY - size.height - 28
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }
}

private struct HUDToastView: View {
    let message: String
    let kind: HUDToastController.Kind

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: kind.systemImage)
                .foregroundColor(kind.tint)
                .font(.system(size: 18, weight: .semibold))

            Text(message)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.primary)
                .lineLimit(2)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.black.opacity(0.08), lineWidth: 1)
        )
        .frame(maxWidth: 420)
    }
}

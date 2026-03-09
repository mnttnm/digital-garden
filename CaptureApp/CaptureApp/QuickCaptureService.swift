import Foundation

@MainActor
final class QuickCaptureService {
    static let shared = QuickCaptureService()

    private let clipboard = ClipboardManager.shared
    private let api = CaptureAPI(settings: .shared)

    private init() {}

    func quickCaptureFromClipboard() async {
        guard SettingsManager.shared.isConfigured else {
            HUDToastController.shared.show(message: "Configure API URL and key first", kind: .failure)
            AppWindowController.shared.showCaptureWindow()
            return
        }

        var payload = CapturePayload()
        payload.source = "api"

        switch clipboard.detectContent() {
        case .url(let url):
            payload.url = url

        case .text(let text):
            payload.note = text

        case .image(let item):
            payload.images = [MediaPayload(data: item.base64String)]

        case .empty:
            HUDToastController.shared.show(message: "Nothing to capture (clipboard empty)", kind: .info)
            return
        }

        do {
            _ = try await api.submitCapture(payload: payload)
            HUDToastController.shared.show(message: "Captured! Review at /admin/review", kind: .success)
        } catch {
            HUDToastController.shared.show(message: error.localizedDescription, kind: .failure, duration: 2.4)
        }
    }
}

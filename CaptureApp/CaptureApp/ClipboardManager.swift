import AppKit
import UniformTypeIdentifiers

class ClipboardManager {
    static let shared = ClipboardManager()

    private init() {}

    // MARK: - Read Text

    func readText() -> String? {
        let pasteboard = NSPasteboard.general

        // Try to get string first
        if let string = pasteboard.string(forType: .string) {
            return string
        }

        // Try URL
        if let url = pasteboard.string(forType: .URL) {
            return url
        }

        return nil
    }

    // MARK: - Read Image

    func readImage() -> MediaItem? {
        let pasteboard = NSPasteboard.general

        // Check for image data directly
        if let imageData = readImageData(from: pasteboard) {
            return MediaItem(
                data: imageData,
                name: "Clipboard image",
                type: .image,
                thumbnail: NSImage(data: imageData)
            )
        }

        // Check for file URL that's an image
        if let fileURL = readFileURL(from: pasteboard),
           isImageFile(fileURL),
           let data = try? Data(contentsOf: fileURL) {
            return MediaItem(
                data: data,
                name: fileURL.lastPathComponent,
                type: .image,
                thumbnail: NSImage(data: data)
            )
        }

        return nil
    }

    // MARK: - Private Helpers

    private func readImageData(from pasteboard: NSPasteboard) -> Data? {
        // Try PNG first
        if let data = pasteboard.data(forType: .png) {
            return data
        }

        // Try TIFF
        if let data = pasteboard.data(forType: .tiff),
           let image = NSImage(data: data),
           let pngData = image.pngData() {
            return pngData
        }

        // Try to create image from any available type
        if let image = NSImage(pasteboard: pasteboard),
           let pngData = image.pngData() {
            return pngData
        }

        return nil
    }

    private func readFileURL(from pasteboard: NSPasteboard) -> URL? {
        guard let urls = pasteboard.readObjects(forClasses: [NSURL.self], options: nil) as? [URL],
              let url = urls.first,
              url.isFileURL else {
            return nil
        }
        return url
    }

    private func isImageFile(_ url: URL) -> Bool {
        let imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "heic", "heif", "tiff", "bmp"]
        return imageExtensions.contains(url.pathExtension.lowercased())
    }

    // MARK: - Detect Content Type

    enum ClipboardContentType {
        case text(String)
        case url(String)
        case image(MediaItem)
        case empty
    }

    func detectContent() -> ClipboardContentType {
        // Check for image first (since it's more specific)
        if let imageItem = readImage() {
            return .image(imageItem)
        }

        // Check for text/URL
        if let text = readText() {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

            // Check if it's a URL
            if let url = URL(string: trimmed),
               url.scheme == "http" || url.scheme == "https" {
                return .url(trimmed)
            }

            return .text(trimmed)
        }

        return .empty
    }
}

// MARK: - NSImage Extension

extension NSImage {
    func pngData() -> Data? {
        guard let tiffRepresentation = self.tiffRepresentation,
              let bitmapImage = NSBitmapImageRep(data: tiffRepresentation) else {
            return nil
        }
        return bitmapImage.representation(using: .png, properties: [:])
    }
}

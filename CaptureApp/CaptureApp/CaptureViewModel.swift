import Foundation
import AppKit
import Combine

@MainActor
class CaptureViewModel: ObservableObject {
    // Form fields
    @Published var content: String = ""
    @Published var note: String = ""
    @Published var tags: String = ""
    @Published var selectedProject: String = ""
    @Published var customProjectSlug: String = ""
    @Published var selectedActivityType: ActivityType = .none
    @Published var codeSnippet: String = ""
    @Published var selectedCodeLanguage: CodeLanguage = .none

    // Media
    @Published var mediaItems: [MediaItem] = []

    // State
    @Published var isLoading: Bool = false
    @Published var projects: [ProjectItem] = fallbackProjects
    @Published var errorMessage: String?
    @Published var successMessage: String?

    // Dependencies
    private let api: CaptureAPI
    private let clipboard: ClipboardManager
    private let settings: SettingsManager

    static let customProjectValue = "__custom__"

    var isProjectSelected: Bool {
        !selectedProject.isEmpty
    }

    var isCustomProject: Bool {
        selectedProject == Self.customProjectValue
    }

    var hasContent: Bool {
        !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
        !note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
        !mediaItems.isEmpty
    }

    init(api: CaptureAPI = CaptureAPI(), clipboard: ClipboardManager = .shared, settings: SettingsManager = .shared) {
        self.api = api
        self.clipboard = clipboard
        self.settings = settings
    }

    // MARK: - Actions

    func loadInitialData() async {
        isLoading = true
        defer { isLoading = false }

        // Load clipboard content
        loadFromClipboard()

        // Fetch projects
        do {
            projects = try await api.fetchProjects()
        } catch {
            print("Failed to fetch projects: \(error)")
        }
    }

    func loadFromClipboard() {
        let content = clipboard.detectContent()

        switch content {
        case .text(let text):
            self.content = text
        case .url(let url):
            self.content = url
        case .image(let mediaItem):
            self.mediaItems = [mediaItem]
            self.content = ""
        case .empty:
            break
        }
    }

    func addMediaFromFiles(_ urls: [URL]) {
        for url in urls {
            guard url.startAccessingSecurityScopedResource() else { continue }
            defer { url.stopAccessingSecurityScopedResource() }

            let ext = url.pathExtension.lowercased()
            let imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "heic", "heif", "tiff", "bmp"]
            let videoExtensions = ["mp4", "mov", "webm", "m4v"]

            do {
                let data = try Data(contentsOf: url)

                if imageExtensions.contains(ext) {
                    // Convert to PNG for consistency
                    if let image = NSImage(data: data), let pngData = image.pngData() {
                        let item = MediaItem(
                            data: pngData,
                            name: url.lastPathComponent,
                            type: .image,
                            thumbnail: image
                        )
                        mediaItems.append(item)
                    }
                } else if videoExtensions.contains(ext) {
                    let item = MediaItem(
                        data: data,
                        name: url.lastPathComponent,
                        type: .video,
                        thumbnail: nil
                    )
                    mediaItems.append(item)
                }
            } catch {
                print("Failed to load file: \(error)")
            }
        }
    }

    func removeMedia(at index: Int) {
        guard index < mediaItems.count else { return }
        mediaItems.remove(at: index)
    }

    func clearAllMedia() {
        mediaItems.removeAll()
    }

    func submit() async {
        guard settings.isConfigured else {
            errorMessage = "Please configure API URL and key in Settings (Cmd+,)"
            return
        }

        guard hasContent else {
            errorMessage = "Please add some content, a note, or media"
            return
        }

        if isCustomProject && customProjectSlug.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            errorMessage = "Please enter a project slug"
            return
        }

        isLoading = true
        errorMessage = nil
        successMessage = nil

        defer { isLoading = false }

        do {
            let payload = buildPayload()
            let response = try await api.submitCapture(payload: payload)

            if response.error != nil {
                errorMessage = response.error
            } else {
                successMessage = mediaItems.isEmpty
                    ? "Captured! Review at /admin/review"
                    : "\(mediaItems.count) media file(s) captured"

                // Reset form
                resetForm()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resetForm() {
        content = ""
        note = ""
        tags = ""
        selectedProject = ""
        customProjectSlug = ""
        selectedActivityType = .none
        codeSnippet = ""
        selectedCodeLanguage = .none
        mediaItems = []
    }

    // MARK: - Private

    private func buildPayload() -> CapturePayload {
        var payload = CapturePayload()

        let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)

        // Detect if content is a URL
        if !trimmedContent.isEmpty {
            if let url = URL(string: trimmedContent),
               url.scheme == "http" || url.scheme == "https" {
                payload.url = trimmedContent
            } else {
                // Treat as note content
                let noteContent = note.trimmingCharacters(in: .whitespacesAndNewlines)
                payload.note = [trimmedContent, noteContent]
                    .filter { !$0.isEmpty }
                    .joined(separator: "\n\n")
            }
        } else {
            let noteContent = note.trimmingCharacters(in: .whitespacesAndNewlines)
            if !noteContent.isEmpty {
                payload.note = noteContent
            }
        }

        // If we have a URL and also note content, combine
        if payload.url != nil {
            let noteContent = note.trimmingCharacters(in: .whitespacesAndNewlines)
            if !noteContent.isEmpty {
                payload.note = noteContent
            }
        }

        // Tags
        let tagsList = tags
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespaces).lowercased() }
            .filter { !$0.isEmpty }

        if !tagsList.isEmpty {
            payload.tags = tagsList
        }

        // Project
        if isCustomProject {
            let slug = customProjectSlug.trimmingCharacters(in: .whitespacesAndNewlines)
            if !slug.isEmpty {
                payload.project = slug
            }
        } else if !selectedProject.isEmpty {
            payload.project = selectedProject
        }

        // Activity type (only if project selected)
        if isProjectSelected && selectedActivityType != .none {
            payload.activityType = selectedActivityType.rawValue
        }

        // Code
        let code = codeSnippet.trimmingCharacters(in: .whitespacesAndNewlines)
        if !code.isEmpty {
            payload.code = code
            if selectedCodeLanguage != .none {
                payload.codeLanguage = selectedCodeLanguage.rawValue
            }
        }

        // Media
        let images = mediaItems.filter { $0.type == .image }
        let videos = mediaItems.filter { $0.type == .video }

        if !images.isEmpty {
            payload.images = images.map { MediaPayload(data: $0.base64String) }
        }

        if !videos.isEmpty {
            payload.videos = videos.map { MediaPayload(data: $0.base64String) }
        }

        return payload
    }
}

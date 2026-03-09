import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @StateObject private var viewModel = CaptureViewModel()
    @EnvironmentObject private var settings: SettingsManager
    @State private var showingFilePicker = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            Divider()

            // Main content
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Media preview
                    if !viewModel.mediaItems.isEmpty {
                        mediaSection
                    }

                    // Content field
                    contentSection

                    // File picker button
                    filePickerButton

                    // Note field
                    noteSection

                    Divider()
                        .padding(.vertical, 8)

                    // Project section
                    projectSection

                    // Tags
                    tagsSection

                    Divider()
                        .padding(.vertical, 8)

                    // Code section
                    codeSection
                }
                .padding(20)
            }

            Divider()

            // Footer with submit button
            footer
        }
        .frame(width: 500, height: 700)
        .background(Color(NSColor.windowBackgroundColor))
        .onAppear {
            Task {
                await viewModel.loadInitialData()
            }
        }
        .fileImporter(
            isPresented: $showingFilePicker,
            allowedContentTypes: [.image, .movie, .video, .mpeg4Movie, .quickTimeMovie],
            allowsMultipleSelection: true
        ) { result in
            switch result {
            case .success(let urls):
                viewModel.addMediaFromFiles(urls)
            case .failure(let error):
                print("File picker error: \(error)")
            }
        }
        .alert("Error", isPresented: .init(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .alert("Success", isPresented: .init(
            get: { viewModel.successMessage != nil },
            set: { if !$0 { viewModel.successMessage = nil } }
        )) {
            Button("OK") {
                viewModel.successMessage = nil
                NSApp.terminate(nil)
            }
        } message: {
            Text(viewModel.successMessage ?? "")
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Capture")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Digital Garden")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if !settings.isConfigured {
                Button("Configure") {
                    NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(16)
    }

    // MARK: - Media Section

    private var mediaSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Media")
                    .font(.headline)

                Spacer()

                Button("Clear All") {
                    viewModel.clearAllMedia()
                }
                .buttonStyle(.plain)
                .foregroundColor(.red)
                .font(.caption)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(viewModel.mediaItems.enumerated()), id: \.element.id) { index, item in
                        mediaItemView(item, index: index)
                    }
                }
            }
        }
    }

    private func mediaItemView(_ item: MediaItem, index: Int) -> some View {
        VStack(spacing: 4) {
            ZStack(alignment: .topTrailing) {
                Group {
                    if let thumbnail = item.thumbnail {
                        Image(nsImage: thumbnail)
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } else {
                        // Video placeholder
                        ZStack {
                            Color.gray.opacity(0.3)
                            Image(systemName: "video.fill")
                                .font(.title)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 8))

                Button(action: {
                    viewModel.removeMedia(at: index)
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.white)
                        .background(Circle().fill(Color.black.opacity(0.6)))
                }
                .buttonStyle(.plain)
                .offset(x: 4, y: -4)
            }

            Text(item.name)
                .font(.caption2)
                .lineLimit(1)
                .frame(width: 80)
        }
    }

    // MARK: - Content Section

    private var contentSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Content")
                .font(.headline)

            TextEditor(text: $viewModel.content)
                .font(.body)
                .frame(height: 80)
                .padding(8)
                .background(Color(NSColor.textBackgroundColor))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            Text("Paste a URL or enter text. URLs are auto-detected.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - File Picker Button

    private var filePickerButton: some View {
        Button(action: {
            showingFilePicker = true
        }) {
            HStack {
                Image(systemName: "plus.circle")
                Text("Add Images or Videos")
            }
        }
        .buttonStyle(.bordered)
    }

    // MARK: - Note Section

    private var noteSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Note")
                .font(.headline)

            TextEditor(text: $viewModel.note)
                .font(.body)
                .frame(height: 60)
                .padding(8)
                .background(Color(NSColor.textBackgroundColor))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            Text("Your thoughts about this...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Project Section

    private var projectSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Project")
                    .font(.headline)

                Picker("", selection: $viewModel.selectedProject) {
                    Text("None (not a project update)").tag("")
                    ForEach(viewModel.projects) { project in
                        Text(project.title).tag(project.slug)
                    }
                    Divider()
                    Text("Custom (enter slug)...").tag(CaptureViewModel.customProjectValue)
                }
                .labelsHidden()
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Custom project slug
            if viewModel.isCustomProject {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Project Slug")
                        .font(.subheadline)

                    TextField("my-project-slug", text: $viewModel.customProjectSlug)
                        .textFieldStyle(.roundedBorder)

                    Text("Folder name in src/content/projects/")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Activity type (only when project selected)
            if viewModel.isProjectSelected {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Activity Type")
                        .font(.subheadline)

                    Picker("", selection: $viewModel.selectedActivityType) {
                        ForEach(ActivityType.allCases) { type in
                            Text(type.displayName).tag(type)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    // MARK: - Tags Section

    private var tagsSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Tags")
                .font(.headline)

            TextField("ai, productivity, web-dev", text: $viewModel.tags)
                .textFieldStyle(.roundedBorder)

            Text("Comma-separated tags")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Code Section

    private var codeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Code Snippet")
                    .font(.headline)

                TextEditor(text: $viewModel.codeSnippet)
                    .font(.system(.body, design: .monospaced))
                    .frame(height: 80)
                    .padding(8)
                    .background(Color(NSColor.textBackgroundColor))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )

                Text("Optional code to include")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Code Language")
                    .font(.subheadline)

                Picker("", selection: $viewModel.selectedCodeLanguage) {
                    ForEach(CodeLanguage.allCases) { lang in
                        Text(lang.displayName).tag(lang)
                    }
                }
                .labelsHidden()
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    // MARK: - Footer

    private var footer: some View {
        HStack {
            Button("Cancel") {
                NSApp.terminate(nil)
            }
            .keyboardShortcut(.escape, modifiers: [])

            Spacer()

            Button(action: {
                Task {
                    await viewModel.submit()
                }
            }) {
                HStack {
                    if viewModel.isLoading {
                        ProgressView()
                            .scaleEffect(0.7)
                    }
                    Text("Capture")
                }
            }
            .buttonStyle(.borderedProminent)
            .keyboardShortcut(.return, modifiers: .command)
            .disabled(viewModel.isLoading || !viewModel.hasContent)
        }
        .padding(16)
    }
}

#Preview {
    ContentView()
        .environmentObject(SettingsManager.shared)
}

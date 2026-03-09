import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var settings: SettingsManager
    @State private var apiUrl: String = ""
    @State private var apiKey: String = ""
    @State private var showingApiKey = false

    var body: some View {
        Form {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    // API URL
                    VStack(alignment: .leading, spacing: 6) {
                        Text("API URL")
                            .font(.headline)

                        TextField("https://yoursite.vercel.app", text: $apiUrl)
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: apiUrl) { _, newValue in
                                settings.apiUrl = newValue
                            }

                        Text("Your digital garden URL (e.g., https://yoursite.vercel.app)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    // API Key
                    VStack(alignment: .leading, spacing: 6) {
                        Text("API Key")
                            .font(.headline)

                        HStack {
                            if showingApiKey {
                                TextField("Enter API key", text: $apiKey)
                                    .textFieldStyle(.roundedBorder)
                                    .onChange(of: apiKey) { _, newValue in
                                        settings.apiKey = newValue
                                    }
                            } else {
                                SecureField("Enter API key", text: $apiKey)
                                    .textFieldStyle(.roundedBorder)
                                    .onChange(of: apiKey) { _, newValue in
                                        settings.apiKey = newValue
                                    }
                            }

                            Button(action: {
                                showingApiKey.toggle()
                            }) {
                                Image(systemName: showingApiKey ? "eye.slash" : "eye")
                            }
                            .buttonStyle(.borderless)
                        }

                        Text("Your CAPTURE_API_KEY from environment variables")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    // Status
                    HStack {
                        Image(systemName: settings.isConfigured ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                            .foregroundColor(settings.isConfigured ? .green : .orange)

                        Text(settings.isConfigured ? "Configured and ready" : "Please enter API URL and key")
                            .font(.subheadline)
                            .foregroundColor(settings.isConfigured ? .secondary : .orange)
                    }
                    .padding(.top, 8)
                }
                .padding()
            } header: {
                Text("Capture API Settings")
            }

            Section {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Keyboard Shortcut")
                        .font(.headline)

                    HStack {
                        Text("Global Hotkey:")
                        Spacer()
                        Text("Cmd + Shift + C")
                            .font(.system(.body, design: .monospaced))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.gray.opacity(0.2))
                            .cornerRadius(4)
                    }

                    Text("Press this keyboard shortcut from any application to open Capture")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Divider()

                    Text("Note: For the global keyboard shortcut to work, you need to grant Accessibility permissions to this app in System Settings > Privacy & Security > Accessibility")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
            } header: {
                Text("Shortcuts")
            }
        }
        .formStyle(.grouped)
        .frame(width: 450, height: 400)
        .onAppear {
            apiUrl = settings.apiUrl
            apiKey = settings.apiKey
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(SettingsManager.shared)
}

import SwiftUI

struct InlineConfigurationView: View {
    @EnvironmentObject private var settings: SettingsManager

    @State private var apiUrl: String = ""
    @State private var apiKey: String = ""
    @State private var showingApiKey = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Configuration")
                    .font(.headline)

                Text("Set your API URL + key. This is stored locally (API key in Keychain).")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            GroupBox {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("API URL")
                            .font(.subheadline)

                        TextField("https://yoursite.vercel.app", text: $apiUrl)
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: apiUrl) { newValue in
                                settings.apiUrl = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
                            }

                        Text("Your digital garden URL (no trailing spaces)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    VStack(alignment: .leading, spacing: 6) {
                        Text("API Key")
                            .font(.subheadline)

                        HStack(spacing: 8) {
                            Group {
                                if showingApiKey {
                                    TextField("Enter API key", text: $apiKey)
                                } else {
                                    SecureField("Enter API key", text: $apiKey)
                                }
                            }
                            .textFieldStyle(.roundedBorder)
                            .onChange(of: apiKey) { newValue in
                                settings.apiKey = newValue.trimmingCharacters(in: .whitespacesAndNewlines)
                            }

                            Button {
                                showingApiKey.toggle()
                            } label: {
                                Image(systemName: showingApiKey ? "eye.slash" : "eye")
                            }
                            .buttonStyle(.borderless)
                            .help(showingApiKey ? "Hide API key" : "Show API key")
                        }

                        Text("Use your CAPTURE_API_KEY value.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    HStack(spacing: 8) {
                        Image(systemName: settings.isConfigured ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                            .foregroundColor(settings.isConfigured ? .green : .orange)

                        Text(settings.isConfigured ? "Configured and ready" : "Please enter API URL and key")
                            .font(.subheadline)
                            .foregroundColor(settings.isConfigured ? .secondary : .orange)

                        Spacer()

                        if settings.isConfigured {
                            Text("You can switch back to the Capture tab.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(12)
            }

            GroupBox {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Troubleshooting")
                        .font(.subheadline)

                    Text("If you see “The data couldn’t be read…”, it usually means the server returned HTML (or another non‑JSON response). Double‑check your API URL and that the endpoint exists at /api/capture/ingest.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(12)
            }

            Spacer(minLength: 0)
        }
        .onAppear {
            apiUrl = settings.apiUrl
            apiKey = settings.apiKey
        }
    }
}

#Preview {
    InlineConfigurationView()
        .environmentObject(SettingsManager.shared)
}

import Foundation

class CaptureAPI {
    private let settings: SettingsManager

    init(settings: SettingsManager = .shared) {
        self.settings = settings
    }

    private func responseSnippet(from body: String) -> String {
        let trimmed = body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "" }

        if trimmed.range(of: "<html", options: [.caseInsensitive, .diacriticInsensitive]) != nil {
            return "Server returned HTML (check API URL and that /api/capture/* endpoints exist)."
        }

        return String(trimmed.prefix(400))
    }

    // MARK: - Fetch Projects

    func fetchProjects() async throws -> [ProjectItem] {
        guard !settings.apiUrl.isEmpty else {
            return fallbackProjects
        }

        let url = URL(string: "\(settings.apiUrl)/api/capture/projects")!

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 10

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                return fallbackProjects
            }

            let decoder = JSONDecoder()
            if let projectsResponse = try? decoder.decode(ProjectsResponse.self, from: data) {
                return projectsResponse.projects.isEmpty ? fallbackProjects : projectsResponse.projects
            }

            let body = String(data: data, encoding: .utf8) ?? ""
            print("Projects endpoint returned non-JSON: \(responseSnippet(from: body))")
            return fallbackProjects
        } catch {
            print("Failed to fetch projects: \(error)")
            return fallbackProjects
        }
    }

    // MARK: - Submit Capture

    func submitCapture(payload: CapturePayload) async throws -> CaptureResponse {
        guard !settings.apiUrl.isEmpty else {
            throw CaptureError.notConfigured
        }

        guard !settings.apiKey.isEmpty else {
            throw CaptureError.noApiKey
        }

        let url = URL(string: "\(settings.apiUrl)/api/capture/ingest")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(settings.apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw CaptureError.invalidResponse
        }

        let decoder = JSONDecoder()
        let decoded = try? decoder.decode(CaptureResponse.self, from: data)
        let body = String(data: data, encoding: .utf8) ?? ""
        let snippet = responseSnippet(from: body)

        switch httpResponse.statusCode {
        case 200, 201:
            // Some deployments might return an empty body or non-JSON on success.
            return decoded ?? CaptureResponse(id: nil, status: "ok", error: nil)

        case 401:
            throw CaptureError.unauthorized

        case 400:
            throw CaptureError.badRequest(decoded?.error ?? (!snippet.isEmpty ? snippet : "Invalid request"))

        default:
            throw CaptureError.serverError(decoded?.error ?? (!snippet.isEmpty ? snippet : "Server error"))
        }
    }
}

enum CaptureError: LocalizedError {
    case notConfigured
    case noApiKey
    case unauthorized
    case badRequest(String)
    case serverError(String)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "API URL not configured. Please set it in Settings."
        case .noApiKey:
            return "API key not configured. Please set it in Settings."
        case .unauthorized:
            return "Invalid API key. Please check your credentials."
        case .badRequest(let message):
            return message
        case .serverError(let message):
            return message
        case .invalidResponse:
            return "Invalid response from server"
        }
    }
}

import Foundation

class CaptureAPI {
    private let settings: SettingsManager

    init(settings: SettingsManager = .shared) {
        self.settings = settings
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

            let projectsResponse = try JSONDecoder().decode(ProjectsResponse.self, from: data)
            return projectsResponse.projects.isEmpty ? fallbackProjects : projectsResponse.projects
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

        let captureResponse = try JSONDecoder().decode(CaptureResponse.self, from: data)

        switch httpResponse.statusCode {
        case 200, 201:
            return captureResponse
        case 401:
            throw CaptureError.unauthorized
        case 400:
            throw CaptureError.badRequest(captureResponse.error ?? "Invalid request")
        default:
            throw CaptureError.serverError(captureResponse.error ?? "Server error")
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

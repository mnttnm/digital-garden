import Foundation
import AppKit

// MARK: - API Models

struct CapturePayload: Codable {
    // Must match backend CaptureSource (src/lib/capture/types.ts)
    // Allowed: raycast | shortcut | slack | api
    var source: String = "api"
    var url: String?
    var note: String?
    var tags: [String]?
    var project: String?
    var activityType: String?
    var code: String?
    var codeLanguage: String?
    var images: [MediaPayload]?
    var videos: [MediaPayload]?
}

struct MediaPayload: Codable {
    var data: String // base64 encoded
    var alt: String?
    var caption: String?
    var poster: String?
}

struct CaptureResponse: Codable {
    var id: String?
    var status: String?
    var error: String?
}

struct ProjectItem: Codable, Identifiable, Hashable {
    var slug: String
    var title: String

    var id: String { slug }
}

struct ProjectsResponse: Codable {
    var projects: [ProjectItem]
}

// MARK: - Local Models

struct MediaItem: Identifiable {
    let id = UUID()
    var data: Data
    var name: String
    var type: MediaType
    var thumbnail: NSImage?

    var base64String: String {
        let mimeType: String
        switch type {
        case .image:
            mimeType = "image/png"
        case .video:
            mimeType = "video/mp4"
        }
        return "data:\(mimeType);base64,\(data.base64EncodedString())"
    }
}

enum MediaType: String {
    case image
    case video
}

// MARK: - Activity Types

enum ActivityType: String, CaseIterable, Identifiable {
    case none = ""
    case update = "update"
    case milestone = "milestone"
    case fix = "fix"
    case learning = "learning"
    case discovery = "discovery"
    case experiment = "experiment"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .none: return "Default (update)"
        case .update: return "Update"
        case .milestone: return "Milestone"
        case .fix: return "Fix"
        case .learning: return "Learning"
        case .discovery: return "Discovery"
        case .experiment: return "Experiment"
        }
    }
}

// MARK: - Code Languages

enum CodeLanguage: String, CaseIterable, Identifiable {
    case none = ""
    case typescript = "typescript"
    case javascript = "javascript"
    case python = "python"
    case ruby = "ruby"
    case go = "go"
    case rust = "rust"
    case bash = "bash"
    case css = "css"
    case html = "html"
    case json = "json"
    case yaml = "yaml"
    case markdown = "markdown"
    case sql = "sql"
    case swift = "swift"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .none: return "None"
        case .typescript: return "TypeScript"
        case .javascript: return "JavaScript"
        case .python: return "Python"
        case .ruby: return "Ruby"
        case .go: return "Go"
        case .rust: return "Rust"
        case .bash: return "Bash"
        case .css: return "CSS"
        case .html: return "HTML"
        case .json: return "JSON"
        case .yaml: return "YAML"
        case .markdown: return "Markdown"
        case .sql: return "SQL"
        case .swift: return "Swift"
        }
    }
}

// MARK: - Fallback Projects

let fallbackProjects: [ProjectItem] = [
    ProjectItem(slug: "digital-garden", title: "learning.log"),
    ProjectItem(slug: "business-co-pilot-system", title: "Business Co-Pilot System"),
    ProjectItem(slug: "shopify-furniture-store", title: "Shopify Furniture Store"),
]

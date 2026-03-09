import Foundation

@MainActor
final class AppNavigationState: ObservableObject {
    enum Tab: Hashable {
        case capture
        case configuration
    }

    static let shared = AppNavigationState()

    @Published var selectedTab: Tab = .capture

    private init() {}
}

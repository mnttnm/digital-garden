import Foundation
import Security

class SettingsManager: ObservableObject {
    static let shared = SettingsManager()

    private let apiUrlKey = "CaptureAPIURL"
    private let apiKeyService = "com.digitalgarden.capture"
    private let apiKeyAccount = "apiKey"

    @Published var apiUrl: String {
        didSet {
            UserDefaults.standard.set(apiUrl, forKey: apiUrlKey)
        }
    }

    @Published var apiKey: String {
        didSet {
            saveApiKeyToKeychain(apiKey)
        }
    }

    var isConfigured: Bool {
        !apiUrl.isEmpty && !apiKey.isEmpty
    }

    private init() {
        self.apiUrl = UserDefaults.standard.string(forKey: apiUrlKey) ?? ""
        self.apiKey = ""

        // Load API key from keychain
        if let key = loadApiKeyFromKeychain() {
            self.apiKey = key
        }
    }

    // MARK: - Keychain Operations

    private func saveApiKeyToKeychain(_ key: String) {
        let data = key.data(using: .utf8)!

        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: apiKeyService,
            kSecAttrAccount as String: apiKeyAccount,
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new item
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: apiKeyService,
            kSecAttrAccount as String: apiKeyAccount,
            kSecValueData as String: data,
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }

    private func loadApiKeyFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: apiKeyService,
            kSecAttrAccount as String: apiKeyAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let data = result as? Data {
            return String(data: data, encoding: .utf8)
        }
        return nil
    }
}

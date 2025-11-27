import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // Handle messages from content scripts if needed
        page.getPropertiesWithCompletionHandler { properties in
            print("Message received from \(String(describing: properties?.url)): \(messageName)")
        }
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        // Handle toolbar item clicks
        window.getActiveTab { tab in
            tab?.getActivePage { page in
                page?.dispatchMessageToScript(withName: "toggleExtension", userInfo: nil)
            }
        }
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // Enable the toolbar item
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }
}
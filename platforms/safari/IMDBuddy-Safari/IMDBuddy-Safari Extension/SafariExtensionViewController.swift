import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        return shared
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set preferred content size for the popover
        self.preferredContentSize = NSSize(width: 350, height: 400)
        
        // Load the HTML content from popup.html
        if let htmlPath = Bundle.main.path(forResource: "popup", ofType: "html") {
            let htmlURL = URL(fileURLWithPath: htmlPath)
            if let webView = self.view as? WKWebView {
                webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
            }
        }
    }
}
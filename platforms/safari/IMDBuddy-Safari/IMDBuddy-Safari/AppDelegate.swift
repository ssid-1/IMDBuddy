import Cocoa
import SafariServices

class AppDelegate: NSObject, NSApplicationDelegate {
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Check if Safari extension is enabled
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: "com.imdbbuddy.safari") { (state, error) in
            guard let state = state, error == nil else {
                print("Failed to get extension state: \(String(describing: error))")
                return
            }
            
            DispatchQueue.main.async {
                if !state.isEnabled {
                    // Show instructions to enable extension
                    let alert = NSAlert()
                    alert.messageText = "IMDBuddy Safari Extension"
                    alert.informativeText = "Please enable the IMDBuddy extension in Safari Preferences > Extensions"
                    alert.addButton(withTitle: "Open Safari Preferences")
                    alert.addButton(withTitle: "OK")
                    
                    let response = alert.runModal()
                    if response == .alertFirstButtonReturn {
                        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.imdbbuddy.safari") { error in
                            if let error = error {
                                print("Failed to show preferences: \(error)")
                            }
                        }
                    }
                }
            }
        }
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }
    
    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
}
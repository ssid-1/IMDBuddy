# IMDBuddy Safari Extension Setup

This directory contains the Safari Web Extension version of IMDBuddy. Safari extensions require a native macOS app wrapper and must be built using Xcode.

## 🏗️ Modern Modular Build Integration

**Important**: This Safari project now uses **modular JavaScript architecture** with generated files from the build system. The extension files are **automatically synced** with the main build output.

### Build First
Before opening the Xcode project, always run:
```bash
./scripts/build.sh
```

This generates the latest modular extension files in `dist/safari-extension/` which are automatically linked to the Xcode project.

## Directory Structure

```
platforms/safari/
└── IMDBuddy-Safari/
    ├── IMDBuddy-Safari/                    # Native macOS app
    │   ├── AppDelegate.swift               # App delegate
    │   └── Info.plist                      # App configuration
    └── IMDBuddy-Safari Extension/          # Safari extension bundle
        ├── SafariExtensionHandler.swift    # Extension handler
        ├── SafariExtensionViewController.swift # Popup controller
        ├── Info.plist                     # Extension configuration
        ├── safari-compatibility.js        # Safari compatibility layer
        ├── core/               → symlink to dist/safari-extension/core/
        │   ├── config.js                   # Configuration and logging
        │   ├── platforms.js                # Platform-specific configurations
        │   ├── platform-detector.js       # Platform detection
        │   ├── storage.js                  # Extension storage
        │   ├── title-extractor.js         # Title extraction
        │   ├── fuzzy-matcher.js           # String matching
        │   ├── api-service.js             # IMDB API service
        │   ├── overlay.js                 # Rating overlays
        │   ├── main-extension.js          # Main extension logic
        │   └── init.js                    # Initialization entry point
        ├── styles.css          → symlink to dist/safari-extension/styles.css
        ├── popup.html          → symlink to dist/safari-extension/popup.html
        └── images/             → symlink to dist/safari-extension/images/
```

### 🔗 Symlink Integration
The Xcode project now uses symbolic links to stay automatically synchronized with the build output:
- **No manual file copying** needed
- **Always up-to-date** with latest changes
- **Single source of truth** from the modular build system
        └── images/                        # Extension icons
```

## Building the Safari Extension

### Prerequisites

- macOS 10.14 or later
- Xcode 11 or later
- Apple Developer Account (for distribution)

### Steps

1. **Open Xcode and create a new project:**
   ```
   File > New > Project > macOS > App
   ```

2. **Configure the project:**
   - Product Name: `IMDBuddy-Safari`
   - Bundle Identifier: `com.imdbbuddy.safari`
   - Language: Swift
   - Interface: Storyboard

3. **Add Safari Web Extension target:**
   ```
   File > New > Target > macOS > Safari Extension
   ```
   - Name: `IMDBuddy-Safari Extension`
   - Bundle Identifier: `com.imdbbuddy.safari.extension`

4. **Replace generated files:**
   - Copy all files from this directory to your Xcode project
   - Update bundle identifiers in Info.plist files if needed

5. **Configure signing:**
   - Select your development team in project settings
   - Enable automatic signing for both targets

6. **Build and run:**
   ```
   Product > Run
   ```

## Development Workflow

### Local Testing

1. Build and run the app from Xcode
2. The app will prompt to enable the extension in Safari
3. Go to Safari > Preferences > Extensions
4. Enable "IMDBuddy Extension"
5. Test on supported streaming sites

### Debugging

- Use Safari's Web Inspector for content script debugging
- Console logs from the extension appear in Safari's console
- Native Swift code can be debugged in Xcode

## Distribution

### Mac App Store

1. Archive the app in Xcode
2. Submit to App Store Connect
3. Safari extensions must be distributed through the Mac App Store

### Direct Distribution

1. Export app with Developer ID signing
2. Notarize the app with Apple
3. Distribute the signed .app bundle

## Key Differences from Chrome Extension

1. **Manifest Format:** Uses Info.plist instead of manifest.json
2. **Native Wrapper:** Requires macOS app wrapper
3. **Permissions:** Declared in Info.plist under SFSafariWebsiteAccess
4. **APIs:** Some Chrome extension APIs may not be available
5. **Storage:** Uses Safari's extension storage API

## Compatibility Notes

- Safari Web Extensions support most Chrome extension APIs
- The compatibility layer (`safari-compatibility.js`) handles API differences
- Storage and messaging APIs have been tested for cross-browser compatibility

## Troubleshooting

### Extension Not Loading
- Check bundle identifiers match between app and extension
- Verify all files are included in the extension bundle
- Check Safari console for JavaScript errors

### Permission Issues
- Ensure website domains are listed in SFSafariWebsiteAccess
- Use wildcards (*) for subdomain access
- HTTPS is required for most domains

### Content Script Issues
- Verify scripts are listed in SFSafariContentScript array
- Check injection timing (document-end vs document-start)
- Safari has stricter content security policies

## Support

For Safari-specific issues:
- Check Safari Developer Documentation
- Use Safari Web Inspector for debugging
- Test on multiple Safari versions

The core functionality remains the same as the Chrome extension - adding IMDb ratings to streaming platforms like Netflix, Hotstar, Prime Video, and Disney+.
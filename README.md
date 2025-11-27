# IMDBuddy 🎥

A smart, modular browser extension that displays **instant IMDB ratings** while browsing Netflix, Hotstar, Prime Video, and other streaming platforms. Never wonder "Is this worth watching?" again!

![Demo Image of IMDBuddy](./src/assets/images/demo.png)

**Supported Platforms**: Hotstar • Netflix • Prime Video • Disney+ ✨

**Available For**: Chrome • Safari (Web Extension) 🌐

## ✨ Features

- **� Smart Matching**: Advanced fuzzy matching finds ratings even with title variations
- **⚡ Instant Results**: Cached results for lightning-fast performance
- **🎨 Beautiful Overlays**: Non-intrusive rating displays that blend seamlessly
- **🌐 Multi-Platform**: Works across Netflix, Hotstar, Disney+, Prime Video
- **🔄 Auto-Updates**: Dynamically loads ratings as you browse
- **🏗️ Modular Architecture**: 99% code sharing between Chrome and Safari

## 🚀 Quick Installation

### Chrome Extension
1. **Build from source**: Run `./scripts/build.sh`
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. **Click "Load unpacked"** and select the `dist/chrome-extension/` directory
5. **Visit any supported streaming platform** and see IMDB ratings appear!

### Safari Extension
1. **Build for Safari**: Run `./scripts/build.sh`
2. **Follow the detailed setup guide** in `platforms/safari/README.md`
3. **Open Safari** and enable the extension in preferences

## 🏗️ New Modular Architecture

IMDBuddy has been completely refactored with a **modular, shared-code architecture**:

**✅ Eliminated Code Duplication**: 99% code sharing between Chrome and Safari
**✅ Simplified Maintenance**: Single source of truth for all logic
**✅ Accelerated Development**: Add new platforms in 5 minutes
**✅ Improved Code Quality**: Comprehensive documentation and error handling

### Core Components
- **Configuration System**: Centralized settings and platform configs
- **Platform Detection**: Auto-detects current streaming platform
- **Title Extraction**: Advanced DOM parsing with debugging
- **Fuzzy Matching**: Multi-algorithm similarity scoring
- **API Service**: Rate-limited IMDB API with intelligent caching
- **Overlay System**: Accessible, responsive rating displays

## 🔧 Adding New Platforms (5-Minute Process!)

Thanks to our modular architecture, adding support for a new streaming service is incredibly simple:

```javascript
// Add to shared/platform-configs/platforms.js
newplatform: {
    name: 'New Platform',
    hostnames: ['newplatform.com'],
    cardSelectors: ['.movie-card'],
    titleSelectors: ['.title'],
    imageContainerSelectors: ['.poster'],
    extractTitle: (element, selectors) => {
        const titleEl = element.querySelector('.title');
        return titleEl ? { title: titleEl.textContent.trim(), type: null } : null;
    }
}
```

**Complete step-by-step guide**: [HOW-TO-ADD-STREAMING-SERVICE.md](HOW-TO-ADD-STREAMING-SERVICE.md)

## 📁 Project Structure

```
IMDBuddy/
├── shared/                          # 🆕 Shared source code (single source of truth)
│   ├── core/                        # Core extension modules
│   │   ├── config.js               # Base configuration
│   │   ├── platform-detector.js    # Platform detection
│   │   ├── storage.js              # Cross-browser storage
│   │   ├── title-extractor.js      # Title extraction + debugging
│   │   ├── fuzzy-matcher.js        # Advanced fuzzy matching
│   │   ├── api-service.js          # API communication & caching
│   │   ├── overlay.js              # Overlay creation & positioning
│   │   └── main-extension.js       # Main application logic
│   ├── platform-configs/           # Platform-specific configurations
│   │   └── platforms.js            # All streaming platform configs
│   ├── ui/                         # Shared UI components
│   │   ├── styles.css              # Extension styles
│   │   └── popup.html              # Extension popup
│   ├── assets/                     # Shared assets
│   │   └── images/                 # Icons and images
│   └── content.js                  # 🆕 Unified modular content script
├── dist/                           # 🆕 Built extensions (auto-generated)
│   ├── chrome-extension/           # Chrome extension (built from shared/)
│   └── safari-extension/           # Safari extension (built from shared/)
├── Safari-App/                     # Safari Xcode project
├── build-universal.sh              # 🆕 Universal build script
├── shared-config.json              # Shared manifest configuration
└── Documentation/
    ├── ARCHITECTURE.md              # 🆕 Detailed architecture guide
    └── HOW-TO-ADD-STREAMING-SERVICE.md # 🆕 5-minute platform guide
```

## 🛠️ Development Workflow

### Universal Build (Recommended)
```bash
./build-universal.sh    # Builds both Chrome and Safari from shared source
```

### Browser-Specific Testing
```bash
# Chrome: Load dist/chrome-extension/ as unpacked extension
# Safari: Follow Safari-App/README.md with dist/safari-extension/ files
```

### Adding Features
1. **Edit shared source** in `shared/` directory
2. **Run build script** to generate extensions
3. **Test on target platforms**
4. **Single codebase** means changes work everywhere!

## 🦆 Safari Extension

A Safari Web Extension version is available in the `Safari-App/` directory. This provides the same functionality as the Chrome extension but packaged as a native macOS app with Safari extension.

### Quick Setup for Safari:
1. Run `./build-safari.sh` to generate Safari-compatible files
2. Use the generated files in an Xcode Safari Web Extension project
3. See `Safari-App/README.md` for detailed build instructions

The Safari extension maintains full compatibility with the Chrome version while providing native macOS integration.

### Manifest Management:
- Chrome uses Manifest V3 (`chrome-extension/manifest.json`)
- Safari uses Manifest V2 (`safari-manifest.json`)
- Both manifests can be generated from `shared-config.json` using `./generate-manifests.sh`
- This approach maintains the necessary differences while sharing common configuration

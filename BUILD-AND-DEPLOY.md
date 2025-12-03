# IMDBuddy: Building and Deploying

This guide provides comprehensive instructions for building, installing, and extending the IMDBuddy browser extension.

## Quick Installation

### Chrome Extension
1. **Build from source**: Run `./scripts/build.sh`
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. **Click "Load unpacked"** and select the `dist/chrome-extension/` directory
5. **Visit any supported streaming platform** and see IMDB ratings appear!

### Safari Extension

Safari extensions require a native macOS app wrapper and must be built using Xcode. This project is set up to automatically link the built extension files to the Xcode project.

**Prerequisites:**
- macOS 10.14 or later
- Xcode 11 or later
- An Apple Developer Account may be required for certain features.

**Setup Steps:**

1.  **Run the build script first:** Before opening Xcode, always run the main build script to generate the latest extension files.
    ```bash
    ./scripts/build.sh
    ```
    This creates the necessary files in `dist/safari-extension/`, which are symlinked within the Xcode project.

2.  **Open the Xcode project:**
    Navigate to `platforms/safari/` and open the `IMDBuddy-Safari.xcodeproj` project in Xcode.

3.  **Configure Signing:**
    In the project settings for both the `IMDBuddy-Safari` app and the `IMDBuddy-Safari Extension` target, select your development team to enable automatic signing.

4.  **Build and Run from Xcode:**
    Use the `Product > Run` command in Xcode (or the play button) to build and run the app.

5.  **Enable the Extension in Safari:**
    - When the app runs, it may prompt you to enable the extension.
    - Open Safari and go to `Safari > Preferences > Extensions`.
    - Check the box to enable the "IMDBuddy-Safari Extension".

6.  **Test and Debug:**
    - Visit a supported streaming site to see the extension in action.
    - You can use Safari's Web Inspector to debug the content scripts and view console logs.

## Development Workflow

### Universal Build (Recommended)
```bash
./scripts/build.sh    # Builds both Chrome and Safari from shared source
```

### Browser-Specific Testing
- **Chrome**: Load `dist/chrome-extension/` as an unpacked extension.
- **Safari**: Follow `platforms/safari/README.md` with `dist/safari-extension/` files.

### Adding Features
1. **Edit shared source** in `src/` directory.
2. **Run build script** to generate extensions.
3. **Test on target platforms**.
4. A **single codebase** means changes work everywhere!

## Adding a New Streaming Service (5-Minute Process!)

Thanks to our modular architecture, adding support for a new streaming service is incredibly simple.

### Step 1: Add Platform Configuration
Add a new configuration object to `src/platform-configs/platforms.js`. This object defines the selectors and title extraction logic for the new platform.

```javascript
// Add to src/platform-configs/platforms.js
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

### Step 2: Update Permissions
Add the new platform's hostname to `shared-config.json` to grant the extension permission to run on the site.

### Step 3: Build and Test
1. Run `./scripts/build.sh` to build the extension with the new platform support.
2. Load the unpacked extension in your browser and navigate to the new platform to test.

## Advanced Configuration

### Custom Title Extraction
For complex platforms, you may need custom extraction logic:

```javascript
extractTitle: (element, selectors) => {
    // Example: Platform with complex title format
    const titleElement = element.querySelector('.complex-title');
    if (titleElement) {
        const fullText = titleElement.textContent;

        // Parse "Title (Year) - Type" format
        const match = fullText.match(/^(.+?)\s*\((\d{4})\)\s*-\s*(.+)$/);
        if (match) {
            return {
                title: match[1].trim(),
                year: match[2],
                type: match[3].toLowerCase().includes('movie') ? 'movie' : 'series'
            };
        }
    }

    // Fallback to standard extraction
    // ... rest of extraction logic
}
```

### Debugging Your Configuration
Add debugging to your extraction function:

```javascript
extractTitle: (element, selectors) => {
    console.log('YourPlatform: Extracting title from element:', element);

    // Log available elements for debugging
    console.log('Available title elements:', element.querySelectorAll('[aria-label], .title, h3'));

    // Your extraction logic here...

    const result = { title: 'Found Title', type: null };
    console.log('YourPlatform: Extracted title:', result);
    return result;
}
```

### Handling Dynamic Content
For platforms with lazy-loaded content:

```javascript
// In your platform configuration
cardSelectors: [
    '.movie-card',
    '.movie-card[data-loaded="true"]', // Only loaded cards
    '.lazy-card.loaded'                // Lazy-loaded cards
]
```

## Troubleshooting

### Common Issues and Solutions

#### 1. No Overlays Appearing
```javascript
// Check if cards are being found
console.log('Cards found:', document.querySelectorAll('.your-card-selector'));

// Check if titles are being extracted
const testCard = document.querySelector('.your-card-selector');
const titleData = TitleExtractor.extract(testCard, platformConfig);
console.log('Title data:', titleData);
```

#### 2. Wrong Elements Selected
```javascript
// Test your selectors in browser console
document.querySelectorAll('.your-selector'); // Should return card elements
```

#### 3. Title Extraction Failing
```javascript
// Add detailed logging to your extractTitle function
extractTitle: (element, selectors) => {
    console.log('=== DEBUGGING TITLE EXTRACTION ===');
    console.log('Element:', element);
    console.log('Available text content:', element.textContent);
    console.log('Available attributes:', Array.from(element.attributes));

    // Continue with your extraction logic...
}
```

#### 4. Overlays in Wrong Position
```javascript
// Test different image container selectors
imageContainerSelectors: [
    '.poster',           // Try different selectors
    '.image-container',  // until overlays position correctly
    '.thumbnail-wrapper'
]
```

### Performance Considerations
1. **Use specific selectors** to avoid matching unnecessary elements.
2. **Test with large pages** to ensure good performance.
3. **Avoid overly broad selectors** like `div` or `*`.

### Chrome Extension Issues
- Ensure developer mode is enabled.
- Check the console for JavaScript errors.
- Verify permissions for streaming sites.

### Safari Extension Issues
- Check that the extension is enabled in Safari Preferences.
- Verify website permissions are granted.
- Use Safari Web Inspector for debugging.

### General Issues
- Clear the browser cache and reload streaming pages.
- Check that you're on a supported streaming platform.
- Ensure JavaScript is enabled.

#!/bin/bash

# IMDBuddy - Universal Build Script
# This script builds both Chrome and Safari extensions from shared source code

set -e  # Exit on any error

echo "🚀 IMDBuddy Universal Build Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build directories
CHROME_DIR="dist/chrome-extension"
SAFARI_DIR="dist/safari-extension"
SHARED_DIR="src"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf "$CHROME_DIR" "$SAFARI_DIR"

# Create build directories
print_status "Creating build directories..."
mkdir -p "$CHROME_DIR"
mkdir -p "$SAFARI_DIR"

# Generate manifests if they don't exist or if shared config is newer
print_status "Generating manifests from shared configuration..."
if ! ./scripts/generate-manifests.sh; then
    print_error "Failed to generate manifests"
    exit 1
fi
print_success "Manifests generated successfully"

# Build Chrome Extension
print_status "Building Chrome extension..."

# Copy modular content scripts
print_status "Copying modular content scripts..."
mkdir -p "$CHROME_DIR/core"
cp "$SHARED_DIR/core/"*.js "$CHROME_DIR/core/"

# Copy shared UI files
cp "$SHARED_DIR/ui/styles.css" "$CHROME_DIR/"
cp "$SHARED_DIR/ui/popup.html" "$CHROME_DIR/"
cp "$SHARED_DIR/ui/popup.js" "$CHROME_DIR/"

# Copy shared assets
cp -r "$SHARED_DIR/assets/images" "$CHROME_DIR/"

# Verify Chrome manifest was generated
if [ -f "$CHROME_DIR/manifest.json" ]; then
    print_success "Chrome manifest is ready"
else
    print_error "No Chrome manifest found! Generate-manifests.sh may have failed"
    exit 1
fi

print_success "Chrome extension built in $CHROME_DIR/"

# Build Safari Extension
print_status "Building Safari extension..."

# Copy modular content scripts
print_status "Copying modular content scripts..."
mkdir -p "$SAFARI_DIR/core"
cp "$SHARED_DIR/core/"*.js "$SAFARI_DIR/core/"

# Copy shared UI files
cp "$SHARED_DIR/ui/styles.css" "$SAFARI_DIR/"
cp "$SHARED_DIR/ui/popup.html" "$SAFARI_DIR/"
cp "$SHARED_DIR/ui/popup.js" "$SAFARI_DIR/"

# Copy shared assets
cp -r "$SHARED_DIR/assets/images" "$SAFARI_DIR/"

# Copy Safari-specific files
cp "scripts/safari-compatibility.js" "$SAFARI_DIR/"

# Verify Safari manifest was generated
if [ -f "$SAFARI_DIR/manifest.json" ]; then
    print_success "Safari manifest is ready"
else
    print_error "No Safari manifest found! Generate-manifests.sh may have failed"
    exit 1
fi
print_success "Safari extension built in $SAFARI_DIR/"

# Update Safari Xcode project symlinks automatically
print_status "Updating Safari Xcode project symlinks..."
SAFARI_XCODE_DIR="platforms/safari/IMDBuddy-Safari/IMDBuddy-Safari Extension"

if [ -d "$SAFARI_XCODE_DIR" ]; then
    cd "$SAFARI_XCODE_DIR"

    # Remove old symlinks (but preserve native files)
    rm -f *.html *.css 2>/dev/null || true
    rm -rf core images 2>/dev/null || true

    # Create new symlinks that automatically include any new JS files in core
    ln -sf ../../../../dist/safari-extension/core core
    ln -sf ../../../../dist/safari-extension/popup.html popup.html
    ln -sf ../../../../dist/safari-extension/popup.js popup.js
    ln -sf ../../../../dist/safari-extension/styles.css styles.css
    ln -sf ../../../../dist/safari-extension/images images

    cd - > /dev/null
    print_success "Safari Xcode project symlinks updated - any new core/*.js files will be automatically included"
else
    print_warning "Safari Xcode project directory not found - skipping symlink update"
fi

# Verification
print_status "Verifying builds..."

# Check Chrome extension
if [ -f "$CHROME_DIR/manifest.json" ] && [ -f "$CHROME_DIR/core/init.js" ] && [ -f "$CHROME_DIR/styles.css" ] && [ -d "$CHROME_DIR/core" ]; then
    print_success "Chrome extension verification passed"
else
    print_error "Chrome extension verification failed"
    exit 1
fi

# Check Safari extension
if [ -f "$SAFARI_DIR/manifest.json" ] && [ -f "$SAFARI_DIR/core/init.js" ] && [ -f "$SAFARI_DIR/styles.css" ] && [ -d "$SAFARI_DIR/core" ]; then
    print_success "Safari extension verification passed"
else
    print_error "Safari extension verification failed"
    exit 1
fi

echo ""
print_success "🎉 Build completed successfully!"
echo ""
echo "📦 Build Output:"
echo "   Chrome Extension: $CHROME_DIR/"
echo "   Safari Extension: $SAFARI_DIR/"
echo ""
echo "🔧 Next Steps:"
echo "   Chrome: Load unpacked extension from $CHROME_DIR/ in Chrome"
echo "   Safari: Use $SAFARI_DIR/ files in your Xcode Safari Web Extension project"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - README.md (Chrome setup)"
echo "   - platforms/safari/README.md (Safari setup)"
echo "   - HOW-TO-ADD-STREAMING-SERVICE.md (Adding new platforms)"

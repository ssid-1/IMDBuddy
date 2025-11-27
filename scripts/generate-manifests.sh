#!/bin/bash

# Generate manifests from shared configur}' "$SHARED_CONFIG" > safari-manifest.json

echo "✅ Manifests generated successfully!"
echo "   - Chrome: chrome-extension/manifest.json"
echo "   - Safari: build-tools/safari-manifest.json"
echo "🔧 Generating manifests from shared configuration..."

# Check if jq is available for JSON processing
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed. Install with: apt-get install jq"
    exit 1
fi

# Read shared configuration
# Shared configuration file
SHARED_CONFIG="shared-config.json"
if [ ! -f "$SHARED_CONFIG" ]; then
    echo "❌ $SHARED_CONFIG not found"
    exit 1
fi

# Generate Chrome manifest (Manifest V3)
echo "📝 Generating Chrome manifest (Manifest V3)..."
# Ensure dist directory exists
mkdir -p dist/chrome-extension
jq '{
    manifest_version: 3,
    name: .name,
    short_name: .short_name,
    version: .version,
    author: .author,
    description: .description,
    permissions: (.permissions | to_entries | map(select(.value == true) | .key)),
    host_permissions: .permissions.host_permissions,
    content_scripts: .content_scripts,
    action: .action,
    icons: .icons
}' "$SHARED_CONFIG" > dist/chrome-extension/manifest.json

# Generate Safari manifest (Manifest V2)
echo "📝 Generating Safari manifest (Manifest V2)..."
jq '{
    manifest_version: 2,
    name: .name,
    short_name: .short_name,
    version: .version,
    author: .author,
    description: .description,
    permissions: ((.permissions | to_entries | map(select(.value == true) | .key)) + .permissions.host_permissions),
    content_scripts: [
        .content_scripts[0] | .js = ["safari-compatibility.js"] + .js
    ],
    browser_action: .action,
    icons: .icons,
    browser_specific_settings: {
        safari: {
            strict_min_version: "14.0"
        }
    }
}' "$SHARED_CONFIG" > dist/safari-extension/manifest.json

echo "✅ Manifests generated successfully!"
echo "   - Chrome: dist/chrome-extension/manifest.json"
echo "   - Safari: dist/safari-extension/manifest.json"
echo ""
echo "🔍 Differences between generated manifests:"
echo "   - Chrome uses Manifest V3, Safari uses V2"
echo "   - Chrome separates storage/host permissions, Safari combines them"
echo "   - Chrome uses 'action', Safari uses 'browser_action'"
echo "   - Safari includes safari-compatibility.js in content scripts"
echo "   - Safari includes browser_specific_settings"
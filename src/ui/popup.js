/**
 * IMDBuddy - Popup Script
 * 
 * Handles popup functionality including debug tools
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Check platform support and update UI
    await checkPlatformSupport();
    
    // Check if we should show debug section
    await checkDebugMode();
    
    // Set up event listeners
    setupEventListeners();
});

/**
 * Check if the current tab is on a supported platform and update UI
 */
async function checkPlatformSupport() {
    try {
        // Try to get current tab URL (works only on supported sites due to host_permissions)
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const hostname = new URL(tab.url).hostname;
        
        // Inject script to use actual PlatformDetector from extension
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Check if PlatformDetector is available and get platform info
                if (window.PlatformDetector && typeof window.PlatformDetector.getCurrentPlatform === 'function') {
                    const platformData = window.PlatformDetector.getCurrentPlatform();
                    return {
                        supported: !!platformData,
                        name: platformData ? platformData.config.name : null,
                        hostname: window.location.hostname
                    };
                }
                // Fallback if PlatformDetector not available yet
                return {
                    supported: false,
                    name: null,
                    hostname: window.location.hostname
                };
            }
        });
        
        const platformInfo = result[0]?.result;
        
        if (platformInfo) {
            // Use detected platform info
            updateStatusUI({
                supported: platformInfo.supported,
                name: platformInfo.name || platformInfo.hostname.replace('www.', ''),
                hostname: platformInfo.hostname
            });
        } else {
            updateUnsupportedPlatformStatusUI();
        }
        console.log('[IMDBuddy Popup] Platform detection:', platformInfo || { hostname });
    } catch (error) {
        // If we can't access tabs (no permission) or script injection fails,
        // show unsupported status
        console.log('[IMDBuddy Popup] Cannot detect platform (likely no permission or unsupported site)');
        updateUnsupportedPlatformStatusUI();
    }
}

function updateUnsupportedPlatformStatusUI() {
    updateStatusUI({ 
        supported: false, 
        name: 'Unsupported Site', 
        hostname: '' 
    });
}

/**
 * Update the status UI based on platform detection
 */
function updateStatusUI(platformInfo) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const platformName = document.getElementById('platformName');
    
    if (platformInfo.supported) {
        // Supported platform
        statusIndicator.className = 'status-indicator supported';
        statusText.textContent = 'Supported Platform';
        platformName.textContent = platformInfo.name;
        platformName.className = 'platform-name';
    } else {
        // Unsupported platform
        statusIndicator.className = 'status-indicator unsupported';
        statusText.textContent = 'Unsupported Platform';
        platformName.textContent = platformInfo.name || 'N/A';
        platformName.className = 'platform-name unsupported';
    }
}

/**
 * Check if debug mode is enabled and show/hide debug section accordingly
 */
async function checkDebugMode() {
    try {
        // Get active tab to check the extension context
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Execute script to check BASE_CONFIG.DEBUG value
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Check if BASE_CONFIG exists and DEBUG is enabled
                return window.BASE_CONFIG && window.BASE_CONFIG.DEBUG;
            }
        });
        
        const debugMode = result[0]?.result || false;
        
        // Show/hide debug section based on debug mode
        const debugSection = document.getElementById('debugSection');
        if (debugMode) {
            debugSection.classList.add('visible');
            console.log('[IMDBuddy Popup] Debug mode enabled - showing debug tools');
        } else {
            debugSection.classList.remove('visible');
            console.log('[IMDBuddy Popup] Debug mode disabled - hiding debug tools');
        }
    } catch (error) {
        console.log('[IMDBuddy Popup] Cannot check debug mode (likely unsupported site)');
        // Hide debug section on error
        const debugSection = document.getElementById('debugSection');
        debugSection.classList.remove('visible');
    }
}

/**
 * Set up event listeners for popup elements
 */
function setupEventListeners() {
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', handleClearCache);
    }
}

/**
 * Handle cache clearing functionality
 */
async function handleClearCache() {
    const button = document.getElementById('clearCacheBtn');
    const originalText = button.textContent;
    
    try {
        // Update button state
        button.textContent = 'Clearing...';
        button.disabled = true;
        button.classList.remove('success', 'error');
        
        // Clear the cache using storage API
        await chrome.storage.local.remove(['imdb_cache']);
        
        // Also try to call extension's clearCache if available
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Try to call the extension's clearCache method
                    if (window.streamingRatings && typeof window.streamingRatings.clearCache === 'function') {
                        window.streamingRatings.clearCache();
                        console.log('[IMDBuddy] Cache cleared via extension method');
                    }
                    if (window.ApiService && typeof window.ApiService.clearCache === 'function') {
                        window.ApiService.clearCache();
                        console.log('[IMDBuddy] Cache cleared via ApiService method');
                    }
                }
            });
        } catch (scriptError) {
            console.warn('[IMDBuddy Popup] Could not call extension clearCache method:', scriptError);
        }
        
        // Success state
        button.textContent = '✓ Cleared!';
        button.classList.add('success');
        
        console.log('[IMDBuddy Popup] Cache cleared successfully');
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('success');
        }, 2000);
        
    } catch (error) {
        console.error('[IMDBuddy Popup] Error clearing cache:', error);
        
        // Error state
        button.textContent = '✗ Error';
        button.classList.add('error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('error');
        }, 3000);
    }
}

/**
 * Handle any additional popup functionality
 */
function handlePopupActions() {
    // Future: Add more popup actions like showing stats, etc.
}

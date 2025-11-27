/**
 * IMDBuddy - Main Entry Point
 * 
 * This file initializes the extension after all modules are loaded.
 * It depends on all the other scripts being loaded first.
 */

// Wait for DOM and all modules to be ready
function initializeIMDBuddy() {
    'use strict';
    // Use console.log here since LOGGER might not be available yet
    console.group('IMDBuddy: initializeIMDBuddy');
    try {
        // Check if already loaded to avoid duplicates
        if (window.IMDBuddyLoaded) {
            console.log('IMDBuddy: initializeIMDBuddy: Already loaded, skipping initialization');
            return;
        }

        // Verify all required modules are loaded
        const requiredModules = [
            'BASE_CONFIG', 
            'LOGGER', 
            'PLATFORM_CONFIGS', 
            'PlatformDetector', 
            'Storage', 
            'TitleExtractor', 
            'FuzzyMatcher', 
            'ApiService', 
            'Overlay', 
            'StreamingRatings'];
        const missingModules = requiredModules.filter(module => typeof window[module] === 'undefined');
        
        if (missingModules.length > 0) {
            console.error('IMDBuddy: initializeIMDBuddy: Missing required modules:', missingModules);
            return;
        }
        
        // Now LOGGER should be available
        LOGGER.info('IMDBuddy: initializeIMDBuddy: All modules loaded, starting initialization...');
        
        // Check if platform is supported
        if (!PlatformDetector.isSupportedPlatform()) {
            LOGGER.warn('IMDBuddy: initializeIMDBuddy: Platform not supported');
            return;
        }
        
        // Initialize the extension
        LOGGER.debug('IMDBuddy: initializeIMDBuddy: Starting StreamingRatings initialization...');
        StreamingRatings.init();
        
        // Expose for popup communication
        window.streamingRatings = StreamingRatings;
        
        LOGGER.info('IMDBuddy: initializeIMDBuddy: Extension loaded successfully');
        
        // Mark as loaded
        window.IMDBuddyLoaded = true;
    } finally {
        console.groupEnd(); // Use console.groupEnd since we started with console.group
    }
}

// Message listener for popup communication
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        LOGGER.debug('IMDBuddy: init: Received message:', message);
        if (message.type === 'CLEAR_CACHE' && window.streamingRatings) {
            LOGGER.debug('IMDBuddy: init: Clearing cache...');
            window.streamingRatings.clearCache();
            sendResponse({ success: true });
        }
    });
}

// Initialize when DOM is ready
LOGGER.debug('IMDBuddy: init: Document ready state:', document.readyState);
if (document.readyState === 'loading') {
    LOGGER.debug('IMDBuddy: init: Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeIMDBuddy);
} else {
    LOGGER.debug('IMDBuddy: init: DOM already loaded, initializing immediately...');
    initializeIMDBuddy();
}

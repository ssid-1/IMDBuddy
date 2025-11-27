// Safari Web Extension compatibility layer
// This ensures the extension works properly in Safari

(function() {
    'use strict';
    
    // Safari-specific compatibility fixes
    if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
        // Polyfill browser API for Safari if needed
        window.browser = chrome;
    }
    
    // Safari storage API compatibility
    const originalStorage = window.chrome?.storage || window.browser?.storage;
    if (originalStorage) {
        // Ensure storage works consistently across browsers
        const storageProxy = {
            local: {
                get: function(keys) {
                    return new Promise((resolve) => {
                        originalStorage.local.get(keys, resolve);
                    });
                },
                set: function(items) {
                    return new Promise((resolve) => {
                        originalStorage.local.set(items, resolve);
                    });
                }
            }
        };
        
        // Only override if we need to
        if (!originalStorage.local.get.toString().includes('Promise')) {
            window.chrome = window.chrome || {};
            window.chrome.storage = storageProxy;
        }
    }
    
    console.log('Safari Web Extension compatibility layer loaded');
})();
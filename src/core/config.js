/**
 * IMDBuddy - Base Configuration
 * 
 * This file contains all the core configuration settings used across
 * both Chrome and Safari extensions.
 * 
 */

// Base Configuration - Core settings for the extension
const BASE_CONFIG = {
    // Debug settings
    VERBOSE: true, // Set to false for production
    DEBUG: true, // Set to false for production
    
    // API settings
    API_URL: 'https://api.imdbapi.dev/search/titles',
    REQUEST_DELAY: 110, // Slightly over 100ms to stay safely under 10 req/sec
    MAX_CONCURRENT_REQUESTS: 5, // Allow multiple requests in parallel
    
    // Storage settings
    STORAGE_KEY: 'imdb_cache',
    SCHEMA_VERSION_KEY: "imdb_cache_schema_version",
    SCHEMA_VERSION: 2, // Increment this when changing cache structure
    CACHE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    
    // Matching settings
    MIN_MATCH_SCORE: 0.7,
    
    // UI settings
    OBSERVER_DELAY: 3000,
    
    // Extension metadata
    VERSION: '3.0.0',
    NAME: 'IMDBuddy'
};

// Debug utility functions
const LOGGER = {
    verbose: (...args) => {
        if (BASE_CONFIG.VERBOSE) {
            console.log(`[${BASE_CONFIG.NAME}]`, ...args);
        }
    },
    debug: (...args) => {
        if (BASE_CONFIG.DEBUG) {
            console.log(`[${BASE_CONFIG.NAME}]`, ...args);
        }
    },
    info: (...args) => {
        console.info(`[${BASE_CONFIG.NAME}]`, ...args);
    },
    warn: (...args) => {
        console.warn(`[${BASE_CONFIG.NAME}]`, ...args);
    },
    error: (...args) => {
        console.error(`[${BASE_CONFIG.NAME}]`, ...args);
    },
    group: (label) => {
        if (BASE_CONFIG.DEBUG) {
            console.group(`[${BASE_CONFIG.NAME}] ${label}`);
        }
    },
    groupEnd: () => {
        if (BASE_CONFIG.DEBUG) {
            console.groupEnd();
        }
    }
};

// Make available globally for other scripts
window.BASE_CONFIG = BASE_CONFIG;
window.LOGGER = LOGGER;

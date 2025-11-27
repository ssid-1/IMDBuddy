/**
 * IMDBuddy - Platform Detection Module
 * 
 * Detects the current streaming platform based on the hostname
 * and returns the appropriate configuration.
 * 
 */

const PlatformDetector = {
    /**
     * Detect the current streaming platform
     * @returns {Object|null} Platform configuration object or null if unsupported
     */
    getCurrentPlatform() {
        const hostname = window.location.hostname;
        LOGGER.debug(`IMDBuddy: PlatformDetector#getCurrentPlatform: Checking hostname: ${hostname}`);
        
        for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
            if (config.hostnames.some(host => hostname.includes(host))) {
                LOGGER.info(`IMDBuddy: PlatformDetector#getCurrentPlatform: Detected platform: ${config.name} (${key})`);
                return { key, config };
            }
        }
        
        LOGGER.warn(`IMDBuddy: PlatformDetector#getCurrentPlatform: Unsupported platform: ${hostname}`);
        return null;
    },

    /**
     * Check if current platform is supported
     * @returns {boolean} True if platform is supported
     */
    isSupportedPlatform() {
        const isSupported = this.getCurrentPlatform() !== null;
        LOGGER.debug(`IMDBuddy: PlatformDetector#isSupportedPlatform: Platform supported: ${isSupported}`);
        return isSupported;
    },

    /**
     * Get supported platform names
     * @returns {Array<string>} Array of supported platform names
     */
    getSupportedPlatforms() {
        return Object.values(PLATFORM_CONFIGS).map(config => config.name);
    }
};

// Make available globally for other scripts
window.PlatformDetector = PlatformDetector;

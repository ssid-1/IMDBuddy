/**
 * IMDBuddy - Main Extension Module
 *
 * The main application logic that orchestrates all the modules
 * to provide IMDB ratings on streaming platforms.
 */

const StreamingRatings = {
    // Extension state
    processedElements: new WeakSet(),
    debounceTimer: null,
    platform: null,

    /**
     * Initialize the extension
     * Sets up platform detection, API service, and DOM observation
     */
    async init() {
        try {
            // Check if platform is supported
            const platformData = PlatformDetector.getCurrentPlatform();
            if (!platformData) {
                return;
            }

            this.platform = platformData;
            LOGGER.info('Platform detected:', this.platform.config.name);

            // Initialize API service
            try {
                await ApiService.init();
            } catch (error) {
                LOGGER.error('Failed to initialize API service:', error);
                return;
            }

            // Start observing for cards
            this.startObserver();
        } catch (e) {
            LOGGER.error('Initialization error:', e);
        }
    },

    /**
     * Start DOM observation and initial card processing
     */
    startObserver() {
        // Process existing cards immediately
        this.processExistingCards();

        // Set up observer for new content
        this.setupObserver();

        // Set up periodic processing (for dynamic content)
        setTimeout(() => {
            this.processExistingCards();
        }, BASE_CONFIG.OBSERVER_DELAY);
    },

    /**
     * Set up MutationObserver to watch for new content
     * Uses debouncing to avoid excessive processing
     */
    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.processExistingCards();
            }, 1000);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * Process all existing cards on the page
     * Finds cards and processes them in batches
     */
    async processExistingCards() {
        const cards = this.findCards();

        if (cards.length === 0) {
            return;
        }

        // Process cards in batches to avoid overwhelming the API
        const batchSize = 10;
        for (let i = 0; i < cards.length; i += batchSize) {
            const batch = cards.slice(i, i + batchSize);
            await this.processBatch(batch);

            // Small delay between batches
            if (i + batchSize < cards.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    },

    /**
     * Process a batch of cards
     * @param {Array<HTMLElement>} cardBatch - Array of card elements to process
     */
    async processBatch(cardBatch) {
        const promises = cardBatch.map(async (card) => {
            if (this.processedElements.has(card)) return;

            this.processedElements.add(card);

            const titleData = TitleExtractor.extract(card, this.platform.config);
            if (titleData) {
                await this.processCard(card, titleData);
            }
        });

        await Promise.all(promises);
    },

    /**
     * Find all streaming platform cards on the page
     * @returns {Array<HTMLElement>} Array of card elements
     */
    findCards() {
        const cards = [];
        const hostname = window.location.hostname;

        // Use platform-specific selectors to find cards
        for (const selector of this.platform.config.cardSelectors) {
            const foundCards = document.querySelectorAll(selector);
            cards.push(...foundCards);
        }

        // Filter out cards that already have overlays
        const filteredCards = cards.filter(card => !Overlay.hasOverlay(card));

        return filteredCards;
    },

    /**
     * Process a single card - extract title and add rating overlay
     * @param {HTMLElement} element - The card element
     * @param {Object} titleData - Extracted title data
     */
    async processCard(element, titleData) {
        try {
            LOGGER.info(`Processing title: "${titleData.title}" (found in .${element.className.split(' ').join('.')})`);
            const rating = await ApiService.getRating(titleData);
            if (rating) {
                const overlay = Overlay.create(rating);
                Overlay.addTo(element, overlay, this.platform.config);
                LOGGER.info(`Overlay attached for: "${titleData.title}" (${rating.score}/10)`);
            } else {
                LOGGER.info(`No rating found for: "${titleData.title}"`);
            }
        } catch (error) {
            LOGGER.error(`Error processing "${titleData.title}":`, error);
        }
    },

    /**
     * Clear cache - exposed for popup interface
     * @returns {Promise<void>}
     */
    async clearCache() {
        try {
            await ApiService.clearCache();
            LOGGER.info('Cache cleared');
        } catch (e) {
            LOGGER.error('Error clearing cache:', e);
        }
    },

    /**
     * Get extension statistics
     * @returns {Object} Extension statistics
     */
    getStats() {
        return {
            platform: this.platform?.config?.name || 'Unknown',
            cacheSize: Object.keys(ApiService.cache || {}).length,
            processedElements: this.processedElements ? 'Available' : 'Not Available'
        };
    },

    /**
     * Public API for adding new platform configurations
     * @param {string} key - Platform key
     * @param {Object} config - Platform configuration
     */
    addPlatform(key, config) {
        PLATFORM_CONFIGS[key] = config;
        LOGGER.info(`IMDBuddy: StreamingRatings#addPlatformConfig: Added platform configuration for ${config.name}`);
    }
};

/**
 * Initialize the extension when DOM is ready
 */
function initializeExtension() {
    // Check if platform is supported
    if (!PlatformDetector.isSupportedPlatform()) {
        return;
    }

    // Initialize the main extension
    StreamingRatings.init();

    // Expose extension instance globally for debugging and popup communication
    window.streamingRatings = StreamingRatings;
}

window.StreamingRatings = StreamingRatings;

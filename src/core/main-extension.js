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
        LOGGER.group('IMDBuddy: StreamingRatings#init');
        try {
            LOGGER.debug('IMDBuddy: StreamingRatings#init: Starting initialization...');
            
            // Check if platform is supported
            const platformData = PlatformDetector.getCurrentPlatform();
            if (!platformData) {
                LOGGER.warn('IMDBuddy: StreamingRatings#init: Unsupported platform, exiting');
                return;
            }
            
            this.platform = platformData;
            LOGGER.info('IMDBuddy: StreamingRatings#init: Platform detected:', this.platform.config.name);
            
            // Initialize API service
            try {
                await ApiService.init();
                LOGGER.info('IMDBuddy: StreamingRatings#init: API service initialized');
            } catch (error) {
                LOGGER.error('IMDBuddy: StreamingRatings#init: Failed to initialize API service:', error);
                return;
            }
            
            // Start observing for cards
            this.startObserver();
            LOGGER.info('IMDBuddy: StreamingRatings#init: Initialization complete');
        } finally {
            LOGGER.groupEnd();
        }
    },

    /**
     * Start DOM observation and initial card processing
     */
    startObserver() {
        LOGGER.group('IMDBuddy: StreamingRatings#startObserver');
        try {
            LOGGER.debug('IMDBuddy: StreamingRatings#startObserver: Starting DOM observation...');
            
            // Process existing cards immediately
            this.processExistingCards();
            
            // Set up observer for new content
            this.setupObserver();
            
            // Set up periodic processing (for dynamic content)
            setTimeout(() => {
                this.processExistingCards();
            }, BASE_CONFIG.OBSERVER_DELAY);
        } finally {
            LOGGER.groupEnd();
        }
    },

    /**
     * Set up MutationObserver to watch for new content
     * Uses debouncing to avoid excessive processing
     */
    setupObserver() {
        LOGGER.verbose('IMDBuddy: StreamingRatings#setupObserver: Setting up MutationObserver');
        
        const observer = new MutationObserver((mutations) => {
            LOGGER.debug(`IMDBuddy: StreamingRatings#setupObserver: DOM mutations detected: ${mutations.length}`);
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                LOGGER.debug('IMDBuddy: StreamingRatings#setupObserver: Processing cards after DOM change');
                this.processExistingCards();
            }, 1000);
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
        
        LOGGER.verbose('IMDBuddy: StreamingRatings#setupObserver: MutationObserver active');
    },

    /**
     * Process all existing cards on the page
     * Finds cards and processes them in batches
     */
    async processExistingCards() {
        LOGGER.group('IMDBuddy: StreamingRatings#processExistingCards');
        try {
            LOGGER.verbose('IMDBuddy: StreamingRatings#processExistingCards: Processing existing cards...');
            const cards = this.findCards();
            LOGGER.debug(`IMDBuddy: StreamingRatings#processExistingCards: Found ${cards.length} cards to process`);
            
            if (cards.length === 0) {
                LOGGER.verbose('IMDBuddy: StreamingRatings#processExistingCards: No cards found');
                return;
            }
            
            // Process cards in batches to avoid overwhelming the API
            const batchSize = 10;
            for (let i = 0; i < cards.length; i += batchSize) {
                const batch = cards.slice(i, i + batchSize);
                LOGGER.verbose(`IMDBuddy: StreamingRatings#processExistingCards: Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cards.length/batchSize)} (${batch.length} cards)`);
                await this.processBatch(batch);
                
                // Small delay between batches
                if (i + batchSize < cards.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            LOGGER.info('IMDBuddy: StreamingRatings#processExistingCards: Finished processing all cards');
        } finally {
            LOGGER.groupEnd();
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
            
            // Debug logging
            if (foundCards.length > 0) {
                LOGGER.verbose(`IMDBuddy: StreamingRatings#findCards: Found ${foundCards.length} cards with selector: ${selector}`);
            }
        }
        
        // Filter out cards that already have overlays
        const filteredCards = cards.filter(card => !Overlay.hasOverlay(card));
        
        LOGGER.debug(`IMDBuddy: StreamingRatings#findCards: Total cards found: ${cards.length}, New cards: ${filteredCards.length}`);
        
        return filteredCards;
    },

    /**
     * Process a single card - extract title and add rating overlay
     * @param {HTMLElement} element - The card element
     * @param {Object} titleData - Extracted title data
     */
    async processCard(element, titleData) {
        LOGGER.group(`IMDBuddy: StreamingRatings#processCard: ${titleData.title}`);
        try {
            LOGGER.verbose('IMDBuddy: StreamingRatings#processCard: Processing card with title:', titleData.title);
            
            const rating = await ApiService.getRating(titleData);
            LOGGER.verbose('IMDBuddy: StreamingRatings#processCard: Received rating:', rating);

            if (rating) {
                const overlay = Overlay.create(rating);
                Overlay.addTo(element, overlay, this.platform.config);
                LOGGER.verbose('IMDBuddy: StreamingRatings#processCard: Added rating overlay for:', titleData.title);
            } else {
                LOGGER.debug('IMDBuddy: StreamingRatings#processCard: No rating found for:', titleData.title);
            }
        } catch (error) {
            LOGGER.error('IMDBuddy: StreamingRatings#processCard: Error processing card:', error, titleData);
        } finally {
            LOGGER.groupEnd();
        }
    },

    /**
     * Clear cache - exposed for popup interface
     * @returns {Promise<void>}
     */
    async clearCache() {
        LOGGER.group('IMDBuddy: StreamingRatings#clearCache');
        try {
            await ApiService.clearCache();
            LOGGER.info('IMDBuddy: StreamingRatings#clearCache: Cache cleared');
        } finally {
            LOGGER.groupEnd();
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
        LOGGER.warn('IMDBuddy: StreamingRatings#init: Platform not supported');
        return;
    }

    // Initialize the main extension
    StreamingRatings.init();
    
    // Expose extension instance globally for debugging and popup communication
    window.streamingRatings = StreamingRatings;
    
    LOGGER.info('IMDBuddy: StreamingRatings: Extension loaded successfully');
}

window.StreamingRatings = StreamingRatings;

/**
 * IMDBuddy - API Service Module
 *
 * Handles all communication with the IMDB API, including caching,
 * rate limiting, and request queue management.
 */

const ApiService = {
    cache: {},
    requestQueue: [],
    activeRequests: 0,
    lastRequestTime: 0,
    requestTimes: [], // Track recent request times for better rate limiting

    /**
     * Initialize the API service
     * Loads cache from storage and cleans expired entries
     */
    async init() {
        try {
            this.cache = await Storage.get(BASE_CONFIG.STORAGE_KEY);
            await this.cleanExpiredEntries();
        } catch (error) {
            LOGGER.error('ApiService initialization failed:', error);
            throw error;
        }
    },

    /**
     * Clean expired cache entries
     * Removes entries older than CACHE_MAX_AGE
     */
    async cleanExpiredEntries() {
        try {
            let hasExpiredEntries = false;
            if (BASE_CONFIG.SCHEMA_VERSION != this.cache[BASE_CONFIG.SCHEMA_VERSION_KEY]) {
                this.clearCache();
                this.cache[BASE_CONFIG.SCHEMA_VERSION_KEY] = {
                    value: BASE_CONFIG.SCHEMA_VERSION
                };
            } else {
                const now = Date.now();
                for (const [key, entry] of Object.entries(this.cache)) {
                    if (!entry.timestamp || (now - entry.timestamp) > BASE_CONFIG.CACHE_MAX_AGE) {
                        delete this.cache[key];
                        hasExpiredEntries = true;
                    }
                }
            }

            if (hasExpiredEntries) {
                await this.saveCache();
            }
        } catch (e) {
            LOGGER.error('Error cleaning expired entries:', e);
        }
    },

    /**
     * Check if cache entry is valid
     * @param {Object} entry - Cache entry to validate
     * @returns {boolean} True if entry is valid
     */
    isCacheEntryValid(entry) {
        if (!entry || !entry.timestamp) return false;
        return (Date.now() - entry.timestamp) <= BASE_CONFIG.CACHE_MAX_AGE;
    },

    /**
     * Clear all cache data
     */
    async clearCache() {
        try {
            this.cache = {};
            await Storage.set(BASE_CONFIG.STORAGE_KEY, {});
            LOGGER.info('Cache cleared');
        } catch (e) {
            LOGGER.error('Error clearing cache:', e);
        }
    },

    /**
     * Get rating for a title with caching and fuzzy matching
     * @param {Object} titleData - Object containing title and type
     * @returns {Promise<Object|null>} Rating data or null
     */
    async getRating(titleData) {
        if (!titleData || !titleData.title) {
            return null;
        }

        const { title, type } = titleData;
        const cacheKey = `${title.toLowerCase()}_${type || 'unknown'}`;

        // Check cache first
        const cachedResult = this.cache[cacheKey];
        if (cachedResult && this.isCacheEntryValid(cachedResult)) {
            LOGGER.info(`Cache hit for: "${title}"`);
            return cachedResult.data;
        }

        // Add to request queue
        return new Promise((resolve) => {
            LOGGER.info(`Queueing fetch for: "${title}"`);
            this.requestQueue.push({ title, type, cacheKey, resolve });
            this.processQueue();
        });
    },

    /**
     * Process the request queue with rate limiting
     */
    async processQueue() {
        if (this.activeRequests >= BASE_CONFIG.MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
            return;
        }

        const request = this.requestQueue.shift();
        this.activeRequests++;

        try {
            await this.processRequest(request);
        } finally {
            this.activeRequests--;
            // Process next request in queue
            setTimeout(() => this.processQueue(), BASE_CONFIG.REQUEST_DELAY);
        }
    },

    /**
     * Process a single API request
     * @param {Object} request - Request object containing title, type, cacheKey, resolve
     */
    async processRequest({ title, type, cacheKey, resolve }) {
        try {
            await this.waitForRateLimit();

            LOGGER.info(`Fetching from API: "${title}"`);
            const result = await this.fetchFromApi(title, type, cacheKey);

            // Cache the result
            this.cache[cacheKey] = {
                data: result,
                timestamp: Date.now()
            };
            await this.saveCache();

            resolve(result);
        } catch (error) {
            LOGGER.error(`API request failed for "${title}":`, error);
            resolve(null);
        }
    },

    /**
     * Wait for rate limit compliance
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < BASE_CONFIG.REQUEST_DELAY) {
            const waitTime = BASE_CONFIG.REQUEST_DELAY - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequestTime = Date.now();

        // Track request times for advanced rate limiting
        this.requestTimes.push(this.lastRequestTime);
        this.requestTimes = this.requestTimes.filter(time =>
            this.lastRequestTime - time < 1000 // Keep only requests from last second
        );
    },

    /**
     * Fetch data from IMDB API with fuzzy matching
     * @param {string} title - Movie/show title
     * @param {string|null} expectedType - Expected content type
     * @param {string} cacheKey - Cache key for the request
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object|null>} Rating data or null
     */
    async fetchFromApi(title, expectedType, cacheKey, retryCount = 0) {
        LOGGER.group(`IMDBuddy: ApiService#fetchFromApi: ${title} (attempt ${retryCount + 1})`);
        try {
            const url = `${BASE_CONFIG.API_URL}?query=${encodeURIComponent(title)}`;
            LOGGER.verbose('IMDBuddy: ApiService#fetchFromApi: API URL:', url);

            const response = await fetch(url);
            LOGGER.verbose('IMDBuddy: ApiService#fetchFromApi: API response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            LOGGER.verbose('IMDBuddy: ApiService#fetchFromApi: API response data:', data);

            if (!data || !data.titles || data.titles.length === 0) {
                LOGGER.warn('IMDBuddy: ApiService#fetchFromApi: No results found for:', title);
                return null;
            }

            // Use fuzzy matching to find the best result
            const bestMatch = FuzzyMatcher.findBestMatch(title, data.titles, expectedType);
            LOGGER.verbose('IMDBuddy: ApiService#fetchFromApi: Best match found:', bestMatch);

            if (!bestMatch) {
                LOGGER.warn('IMDBuddy: ApiService#fetchFromApi: No suitable match found for:', title);
                return null;
            }

            const result = {
                score: bestMatch.result.rating?.aggregateRating ?? 'N/A',
                votes: this.formatVotes(bestMatch.result.rating?.voteCount) ?? '0',
                title: bestMatch.result.primaryTitle || bestMatch.result.originalTitle,
                type: bestMatch.result.type,
                year: bestMatch.result.startYear,
                url: `https://www.imdb.com/title/${bestMatch.result.id}/`
            };
            LOGGER.verbose('IMDBuddy: ApiService#fetchFromApi: Formatted result:', result);

            return result;

        } catch (error) {
            LOGGER.error(`IMDBuddy: ApiService#fetchFromApi: API Error (attempt ${retryCount + 1}):`, error);

            // Retry logic for temporary failures
            if (retryCount < 2 && (error.message.includes('429') || error.message.includes('500'))) {
                const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                LOGGER.debug(`IMDBuddy: ApiService#fetchFromApi: Retrying in ${backoffDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                return this.fetchFromApi(title, expectedType, cacheKey, retryCount + 1);
            }

            return null;
        } finally {
            LOGGER.groupEnd();
        }
    },

    /**
     * Format vote counts for display (e.g., 1500000 -> 1.5M)
     * @param {number} votes - Raw vote count
     * @returns {string} Formatted vote count
     */
    formatVotes(votes) {
        if (votes >= 1000000) return (votes / 1000000).toFixed(1) + 'M';
        if (votes >= 1000) return (votes / 1000).toFixed(1) + 'K';
        return votes.toString();
    },

    /**
     * Save cache to storage
     */
    async saveCache() {
        await Storage.set(BASE_CONFIG.STORAGE_KEY, this.cache);
    }
};

window.ApiService = ApiService;

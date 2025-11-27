/**
 * IMDBuddy - Overlay Module
 *
 * Creates and manages IMDB rating overlays on streaming platform cards.
 * Platform-agnostic overlay creation and positioning.
 */

const Overlay = {
    /**
     * Create an IMDB rating overlay element
     * @param {Object} rating - Rating data containing score, votes, etc.
     * @returns {HTMLElement} The created overlay element
     */
    create(rating) {
        const overlay = document.createElement('div');
        overlay.className = 'imdb-rating-overlay';
        overlay.setAttribute('role', 'button');
        overlay.setAttribute('aria-label', `IMDb rating: ${rating.score} out of 10, ${rating.votes} votes. Click to view on IMDb.`);
        overlay.setAttribute('tabindex', '0');
        overlay.style.cursor = 'pointer';

        overlay.innerHTML = `
            <div class="imdb-rating-content">
                <div class="imdb-logo">IMDb</div>
                <div class="imdb-rating-score">${rating.score}</div>
                <div class="imdb-votes">${rating.votes}</div>
            </div>
        `;

        // Add click handler to open IMDB page
        const handleClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (rating.url) {
                window.open(rating.url, '_blank', 'noopener,noreferrer');
            } else {
                LOGGER.warn('No IMDB URL available for rating:', rating);
            }
        };

        // Add both click and keyboard event handlers
        overlay.addEventListener('click', handleClick);
        overlay.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClick(event);
            }
        });

        // Add visual feedback on hover
        overlay.addEventListener('mouseenter', (event) => {
            overlay.style.opacity = '0.9';
            overlay.style.transform = 'scale(1.02)';
        });

        overlay.addEventListener('mouseleave', (event) => {
            overlay.style.opacity = '1';
            overlay.style.transform = 'scale(1)';
        });

        return overlay;
    },

    /**
     * Add overlay to a streaming platform card
     * @param {HTMLElement} element - The card element
     * @param {HTMLElement} overlay - The overlay element to add
     * @param {Object} platformConfig - Platform-specific configuration
     */
    addTo(element, overlay, platformConfig) {
        const container = this.findContainer(element, platformConfig);

        if (container) {
            // Ensure container has relative positioning for overlay
            container.style.position = 'relative';
            container.appendChild(overlay);
        } else {
            LOGGER.warn('No suitable container found for overlay:', element);
        }
    },

    /**
     * Find the appropriate container for the overlay
     * @param {HTMLElement} element - The card element
     * @param {Object} platformConfig - Platform-specific configuration
     * @returns {HTMLElement|null} The container element or null
     */
    findContainer(element, platformConfig) {
        // Try platform-specific image container selectors first
        for (const selector of platformConfig.imageContainerSelectors) {
            const container = element.querySelector(selector);
            if (container) return container;
        }

        // Fallback to generic image container
        const imageParent = element.querySelector('img')?.parentElement;
        if (imageParent) return imageParent;

        // Last resort: use the element itself
        return element;
    },

    /**
     * Check if element already has an overlay
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} True if overlay exists
     */
    hasOverlay(element) {
        return element.querySelector('.imdb-rating-overlay') !== null;
    },

    /**
     * Remove overlay from element
     * @param {HTMLElement} element - The element to remove overlay from
     */
    removeOverlay(element) {
        const overlay = element.querySelector('.imdb-rating-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

window.Overlay = Overlay;

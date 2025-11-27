/**
 * IMDBuddy - Platform Configurations
 *
 * This file contains platform-specific configurations for different
 * streaming services. Each platform has its own set of selectors
 * and extraction logic.
 *
 * To add support for a new streaming service:
 * 1. Add a new configuration object with the platform key
 * 2. Specify hostnames, selectors, and extraction logic
 * 3. Test the selectors on the target streaming platform
 * 4. Update the host_permissions in shared-config.json
 *
 */

// Platform-Specific Configurations
const PLATFORM_CONFIGS = {
    /**
     * Disney+ Hotstar Configuration
     * Supports both hotstar.com and disneyplus.com domains
     */
    hotstar: {
        name: 'Hotstar',
        hostnames: ['hotstar.com', 'disneyplus.com'],
        cardSelectors: [
            '.swiper-slide',
            '.tray-vertical-card',
            '[data-horizontal-card-container-width]',
            '[data-testid="card-hover-container"]',
            '[data-testid="autoplay-trailer-image-container"]'
        ],
        titleSelectors: [
            '[aria-label]',
            'img[alt]',
            '[title]',
            'a[aria-label]'
        ],
        imageContainerSelectors: [
            '[data-testid="hs-image"]',
            '.rQ_gfJEdoJGvLVb_rKLtL',
            'img',
            '.image-container'
        ],
        extractTitle: (element, selectors) => {
            // Try all possible selectors for title extraction
            const allPossibleSelectors = [
                '[aria-label]',
                'img[alt]'
            ];

            const foundTitles = new Set(); // Track found titles to avoid duplicates

            for (const selector of allPossibleSelectors) {
                const elements = element.querySelectorAll(selector);

                for (const el of elements) {
                    let title = '';

                    // Try different ways to get the title
                    if (el.hasAttribute('aria-label')) {
                        title = el.getAttribute('aria-label');
                    } else if (el.hasAttribute('alt')) {
                        title = el.getAttribute('alt');
                    } else if (el.hasAttribute('title')) {
                        title = el.getAttribute('title');
                    } else {
                        title = el.textContent?.trim();
                    }

                    if (!title) continue;

                    // Skip generic/non-title content
                    if (title.length < 2 ||
                        title.toLowerCase().includes('image') ||
                        title.toLowerCase().includes('logo') ||
                        title.toLowerCase().includes('icon')) {
                        continue;
                    }

                    // Normalize title for duplicate checking
                    const normalizedTitle = title.toLowerCase().trim();
                    if (foundTitles.has(normalizedTitle)) {
                        continue; // Skip if we've already found this title
                    }

                    foundTitles.add(normalizedTitle);

                    // Parse Hotstar format: "Title, Type" or just "Title"
                    const parts = title.split(',').map(s => s.trim());
                    const mainTitle = parts[0];
                    const typeHint = parts[1];

                    if (mainTitle.length > 0) {
                        return {
                            title: mainTitle,
                            type: typeHint?.toLowerCase() === 'movie' ? 'movie' :
                                  typeHint?.toLowerCase() === 'series' ? 'series' : null
                        };
                    }
                }
            }
            return null;
        }
    },

    /**
     * Netflix Configuration
     * Supports netflix.com domain
     */
    netflix: {
        name: 'Netflix',
        hostnames: ['netflix.com'],
        cardSelectors: [
            '.slider-item',
            '.title-card',
            '.gallery-item',
            '.title-card-container'
        ],
        titleSelectors: [
            'a[aria-label]',
            '.fallback-text',
            '[aria-label]'
        ],
        imageContainerSelectors: [
            '.boxart-container',
            '.title-card-container',
            '.previewModal--boxart',
            '.videoMerchPlayer--boxart-wrapper'
        ],
        extractTitle: (element, selectors) => {
            // First try aria-label on links (most reliable for Netflix)
            const linkWithAriaLabel = element.querySelector('a[aria-label]');
            if (linkWithAriaLabel) {
                const ariaLabel = linkWithAriaLabel.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.trim().length > 0) {
                    return {
                        title: ariaLabel.trim(),
                        type: null // Netflix doesn't clearly distinguish in DOM
                    };
                }
            }

            // Fallback to other selectors
            for (const selector of selectors) {
                const el = element.querySelector(selector);
                if (!el) continue;

                let title = el.textContent?.trim();
                if (!title && el.hasAttribute('aria-label')) {
                    title = el.getAttribute('aria-label')?.trim();
                }

                if (!title) continue;

                return {
                    title: title.split('•')[0].trim(), // Netflix format: "Title • Year"
                    type: null // Netflix doesn't clearly distinguish in DOM
                };
            }
            return null;
        }
    },

    /**
     * Amazon Prime Video Configuration
     * Supports primevideo.com and amazon.com domains
     */
    prime: {
        name: 'Prime Video',
        hostnames: ['primevideo.com', 'amazon.com'],
        cardSelectors: [
            '[data-testid="card-container-list"]',
            '.tst-hover-container',
            '.av-card-container'
        ],
        titleSelectors: [
            '[data-automation-id="title"]',
            '[data-testid="packshot"]',
            '.av-card-title',
            '.data-card-title'

        ],
        imageContainerSelectors: [
            '.av-card-image',
            '.tst-packshot-image'
        ],
        extractTitle: (element, selectors) => {
            // Prime Video-specific title extraction logic
            for (const selector of selectors) {
                const el = element.querySelector(selector);
                if (!el) continue;

                const title = el.textContent?.trim() || el.getAttribute('title')?.trim();
                if (!title) continue;

                return { title, type: null };
            }
            return null;
        }
    }
};

// Make available globally for other scripts
window.PLATFORM_CONFIGS = PLATFORM_CONFIGS;

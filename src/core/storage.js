/**
 * IMDBuddy - Storage Module
 * 
 * Cross-browser compatible storage module that works with both
 * Chrome and Safari extension APIs.
 * 
 */

const Storage = {
    /**
     * Get data from extension storage
     * @param {string} key - The storage key to retrieve
     * @returns {Promise<Object>} The stored data or empty object
     */
    async get(key) {
        LOGGER.group(`Storage Get: ${key}`);
        try {
            const result = await chrome.storage.local.get([key]);
            const data = result[key] ? JSON.parse(result[key]) : {};
            LOGGER.verbose(`Storage: Retrieved data for ${key}:`, Object.keys(data).length, 'entries');
            return data;
        } catch (error) {
            LOGGER.error('Storage get error:', error);
            return {};
        } finally {
            LOGGER.groupEnd();
        }
    },

    /**
     * Set data in extension storage
     * @param {string} key - The storage key
     * @param {Object} data - The data to store
     * @returns {Promise<void>}
     */
    async set(key, data) {
        LOGGER.group(`Storage Set: ${key}`, Object.keys(data).length, 'entries');
        try {
            await chrome.storage.local.set({ [key]: JSON.stringify(data) });
            LOGGER.verbose(`Storage: Stored data for ${key}`);
        } catch (error) {
            LOGGER.error('Storage set error:', error);
        } finally {
            LOGGER.groupEnd();
        }
    }
};

window.Storage = Storage;

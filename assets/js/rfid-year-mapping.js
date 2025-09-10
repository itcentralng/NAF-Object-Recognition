/**
 * RFID Year Range Mapping for NAF Object Recognition System
 * 
 * This module handles the mapping of RFID UIDs to year ranges.
 * Previously, this mapping was done on the Arduino, but now it's handled 
 * in JavaScript for better flexibility and maintainability.
 */

// RFID to year range mapping
const RFID_YEAR_MAPPINGS = {
    "D3 2F 29 14": "1962-1972",
    "33 18 E3 13": "1973-1983",
    "D3 AB 07 2D": "1984-1994",
    "CA D3 42 00": "1995-2005",
    "D3 4F E6 0C": "2006-2016",
    "53 AA DB 13": "2017-2027",
    "D3 21 39 DD": "2028-2038"
};

/**
 * Get year range from RFID UID
 * @param {string} uid - The RFID UID in format "XX XX XX XX"
 * @returns {string|null} - The year range or null if not found
 */
function getYearRangeFromUID(uid) {
    if (!uid || typeof uid !== 'string') {
        return null;
    }
    
    // Normalize the UID (ensure proper format)
    const normalizedUID = uid.toUpperCase().trim();
    
    return RFID_YEAR_MAPPINGS[normalizedUID] || null;
}

/**
 * Get all available year ranges
 * @returns {string[]} - Array of all year ranges
 */
function getAvailableYearRanges() {
    return Object.values(RFID_YEAR_MAPPINGS);
}

/**
 * Get all RFID UIDs
 * @returns {string[]} - Array of all RFID UIDs
 */
function getAvailableRFIDUIDs() {
    return Object.keys(RFID_YEAR_MAPPINGS);
}

/**
 * Validate if a UID is known
 * @param {string} uid - The RFID UID to validate
 * @returns {boolean} - True if UID is known, false otherwise
 */
function isValidRFIDUID(uid) {
    if (!uid || typeof uid !== 'string') {
        return false;
    }
    
    const normalizedUID = uid.toUpperCase().trim();
    return RFID_YEAR_MAPPINGS.hasOwnProperty(normalizedUID);
}

/**
 * Get mapping information for debugging
 * @returns {Object} - Complete mapping object
 */
function getRFIDMappingInfo() {
    return {
        mappings: RFID_YEAR_MAPPINGS,
        count: Object.keys(RFID_YEAR_MAPPINGS).length,
        yearRanges: getAvailableYearRanges(),
        uids: getAvailableRFIDUIDs()
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        getYearRangeFromUID,
        getAvailableYearRanges,
        getAvailableRFIDUIDs,
        isValidRFIDUID,
        getRFIDMappingInfo,
        RFID_YEAR_MAPPINGS
    };
} else {
    // Browser environment - attach to window
    window.RFIDYearMapping = {
        getYearRangeFromUID,
        getAvailableYearRanges,
        getAvailableRFIDUIDs,
        isValidRFIDUID,
        getRFIDMappingInfo,
        RFID_YEAR_MAPPINGS
    };
}

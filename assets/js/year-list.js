// Socket.IO Connection
const socket = io('http://127.0.0.1:5550');

let currentSectionData = null;
let currentYearRange = null;
let currentObject = null;
let isYearRangeDetected = false;

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const sectionId = urlParams.get('section');
const yearRange = urlParams.get('year');
const objectParam = urlParams.get('object');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupSocketListeners();
    loadInitialData();
});

// Socket.IO Event Listeners
function setupSocketListeners() {
    // Listen for year_dropped events - this enables the interface
    socket.on('year_dropped', function(data) {
        console.log('Year range detected via socket:', data.year);
        
        if (data.object && data.year) {
            currentObject = data.object;
            currentYearRange = data.year;
            isYearRangeDetected = true;
            
            // Update display
            document.getElementById('current-object-display').textContent = data.object.toUpperCase();
            
            // Hide the overlay and enable interaction
            hideNoInteractionOverlay();
            
            // Load and display years for this range
            loadYearsForRange(data.year, data.object);
        }
    });
    
    // Listen for object_dropped events - return to main page
    socket.on('object_dropped', function(data) {
        console.log('Object dropped via socket, returning to main page:', data.message);
        
        // Navigate back to main page immediately
        window.location.href = 'index.html';
    });
    
    // Listen for return_to_section event - when year range not detected
    socket.on('return_to_section', function(data) {
        console.log('Year range not detected, returning to section:', data.message);
        
        // Navigate back to section immediately
        window.location.href = `section.html?section=${getSectionIdFromObject(data.object)}`;
    });
    
    // Handle socket connection events
    socket.on('connect', function() {
        console.log('Connected to Socket.IO server');
        
        // Request current status to sync state
        socket.emit('get_status');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
    });
    
    // Handle simulation status response
    socket.on('simulation_status', function(data) {
        console.log('Current simulation status:', data);
        
        if (data.picked_object && data.dropped_year && data.current_state === 'year-list') {
            currentObject = data.picked_object;
            currentYearRange = data.dropped_year;
            isYearRangeDetected = true;
            
            // Update display
            document.getElementById('current-object-display').textContent = data.picked_object.toUpperCase();
            
            // Hide the overlay and enable interaction
            hideNoInteractionOverlay();
            
            // Load and display years for this range
            loadYearsForRange(data.dropped_year, data.picked_object);
        }
    });
    
    // Handle any socket errors
    socket.on('error', function(error) {
        console.error('Socket.IO error:', error);
    });
}

function loadInitialData() {
    // If we have URL parameters, try to use them
    if (sectionId && yearRange && objectParam) {
        currentObject = objectParam;
        currentYearRange = yearRange;
        isYearRangeDetected = true;
        
        document.getElementById('current-object-display').textContent = objectParam.toUpperCase();
        hideNoInteractionOverlay();
        loadYearsForRange(yearRange, objectParam);
    } else {
        // Show waiting overlay
        showNoInteractionOverlay();
    }
}

function loadYearsForRange(yearRange, object) {
    console.log(`Loading years for range: ${yearRange}, object: ${object}`);
    
    // Load section data
    loadSectionData(object).then(() => {
        if (currentSectionData) {
            updatePageHeader(yearRange, object);
            renderYearsFromRange(yearRange);
        }
    });
}

async function loadSectionData(object) {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // Map object to section - support all available sections
        const sectionMap = {
            'naf': 'naf-history',
            'nafsfa': 'nafsfa-history',
            'evol': 'finance-evolution'
        };
        
        const targetSectionId = sectionMap[object] || 'naf-history'; // Default to naf-history
        currentSectionData = data.sections.find(section => section.id === targetSectionId);
        
        if (!currentSectionData) {
            throw new Error(`Section not found for object: ${object}`);
        }
        
        // Update the page logo if available
        updatePageLogo();
        
    } catch (error) {
        console.error('Error loading section data:', error);
        showErrorMessage('Failed to load section data');
    }
}

function updatePageHeader(yearRange, object) {
    const sectionNames = {
        'naf': 'NAF History',
        'nafsfa': 'NAF School of Finance and Account',
        'evol': 'Evolution of NAF Finance Specialty'
    };
    
    const sectionName = sectionNames[object] || 'NAF History';
    
    document.getElementById('page-title').textContent = `Years ${yearRange} - ${sectionName} - Nigerian Air Force Museum`;
    document.getElementById('year-range-title').textContent = `Years ${yearRange}`;
}

function renderYearsFromRange(yearRange) {
    const yearsGrid = document.getElementById('years-grid');
    
    let yearsHTML = '';
    let yearsWithData = [];
    
    // Parse the year range to get start and end years
    const [startYear, endYear] = yearRange.split('-').map(y => parseInt(y));
    
    // First, collect all years that have data within the specific range
    for (let year = startYear; year <= endYear; year++) {
        // Check if we have specific data for this year in the current year range
        if (hasDataForYearInRange(year, yearRange)) {
            yearsWithData.push(year);
        }
    }
    
    // Generate year cards only for years that have data in this specific range
    yearsWithData.forEach(year => {
        yearsHTML += createYearCard(year.toString(), null, null, true);
    });
    
    if (yearsHTML === '') {
        yearsHTML = `
            <div class="error-message" style="grid-column: 1 / -1; text-align: center; color: #f39c12; padding: 40px;">
                <h3>No Data Available</h3>
                <p>No historical information is available for the year range ${yearRange} in this section.</p>
                <p style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">Try dropping a different year range object to explore other time periods.</p>
            </div>
        `;
    }
    
    yearsGrid.innerHTML = yearsHTML;
}

function hasDataForYear(targetYear) {
    if (!currentSectionData || !currentSectionData["year-ranges"]) return false;
    
    // Check if we have data for this specific year in any year range
    return currentSectionData["year-ranges"].some(rangeObj => {
        // Each range object has keys like "1962-1972", "1973-1982", etc.
        return Object.keys(rangeObj).some(rangeKey => {
            const yearArray = rangeObj[rangeKey];
            // Check if any year in this range matches our target year AND has highlights
            return yearArray.some(yearData => {
                return parseInt(yearData.year) === targetYear && 
                       yearData.highlights && 
                       yearData.highlights.length > 0;
            });
        });
    });
}

function hasDataForYearInRange(targetYear, yearRange) {
    if (!currentSectionData || !currentSectionData["year-ranges"]) return false;
    
    // Check if we have data for this specific year within the specific year range
    return currentSectionData["year-ranges"].some(rangeObj => {
        // Only look in the specific range object that matches our current year range
        if (rangeObj[yearRange]) {
            const yearArray = rangeObj[yearRange];
            // Check if any year in this specific range matches our target year AND has highlights
            return yearArray.some(yearData => {
                return parseInt(yearData.year) === targetYear && 
                       yearData.highlights && 
                       yearData.highlights.length > 0;
            });
        }
        return false;
    });
}

function createYearCard(year, title, description, hasData, yearData = null) {
    const dataIndicator = '📋';
    const dataText = 'Historical Data Available';
    
    return `
        <div class="year-card has-data" onclick="navigateToYear('${year}', true)" data-year="${year}">
            <div style="text-align: center;">
                <div class="year-number">${year}</div>
                <div class="year-status">
                    <span class="data-indicator">${dataIndicator}</span>
                    <span class="data-text">${dataText}</span>
                </div>
            </div>
        </div>
    `;
}

function navigateToYear(year, hasData) {
    if (!isYearRangeDetected) {
        showWaitingMessage();
        return;
    }
    
    // Navigate to year detail page - only years with data are shown now
    const sectionMap = {
        'naf': 'naf-history',
        'nafsfa': 'nafsfa-history',
        'evol': 'finance-evolution'
    };
    
    const sectionId = sectionMap[currentObject] || 'naf-history';
    window.location.href = `year-detail.html?section=${sectionId}&year=${encodeURIComponent(year)}&range=${currentYearRange}`;
}

// Remove backToSection function as it's no longer needed per requirements
// Users can only change year range by dropping a new year range object

function getSectionIdFromObject(object) {
    const sectionMap = {
        'naf': 'naf-history',
        'nafsfa': 'nafsfa-history',
        'evol': 'finance-evolution'
    };
    return sectionMap[object] || 'naf-history';
}

function hideNoInteractionOverlay() {
    const overlay = document.getElementById('no-interaction-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showNoInteractionOverlay() {
    const overlay = document.getElementById('no-interaction-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function showWaitingMessage() {
    const overlay = document.getElementById('no-interaction-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.querySelector('h3').textContent = 'Interaction Not Available';
        overlay.querySelector('p').textContent = 'Please wait for year range detection to enable interaction';
    }
}

function showErrorMessage(message) {
    const yearsGrid = document.getElementById('years-grid');
    yearsGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; color: #c41e3a; padding: 40px;">
            <h3>Error Loading Data</h3>
            <p>${message}</p>
            <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #c41e3a; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
        </div>
    `;
}

function updatePageLogo() {
    // Update any logo elements on the page with section-specific logo
    const logoElements = document.querySelectorAll('img[alt="NAF Logo"], .nav-logo');
    logoElements.forEach(logo => {
        if (currentSectionData && currentSectionData.logo) {
            logo.src = currentSectionData.logo;
        }
    });
    
    // Update the header section logo
    const headerSectionLogo = document.getElementById('header-section-logo');
    if (headerSectionLogo && currentSectionData && currentSectionData.logo) {
        headerSectionLogo.src = currentSectionData.logo;
    }
}

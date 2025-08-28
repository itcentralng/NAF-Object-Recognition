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
        
        // Show removal notification
        showObjectRemovalNotification();
        
        // Navigate back to main page after notification
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
    
    // Listen for return_to_section event - when year range not detected
    socket.on('return_to_section', function(data) {
        console.log('Year range not detected, returning to section:', data.message);
        
        // Show notification
        showYearRangeNotDetectedNotification();
        
        // Navigate back to section after notification
        setTimeout(() => {
            window.location.href = `section.html?section=${getSectionIdFromObject(data.object)}`;
        }, 1500);
    });
    
    // Handle socket connection events
    socket.on('connect', function() {
        console.log('Connected to Socket.IO server');
        showConnectionStatus('Connected', 'success');
        
        // Request current status to sync state
        socket.emit('get_status');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
        showConnectionStatus('Disconnected', 'error');
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
        showConnectionStatus('Connection Error', 'error');
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
        
        // Map object to section
        const sectionMap = {
            'naf': 'naf-history',
            'nafsfa': 'nafsfa-history',
            'evol': 'finance-evolution'
        };
        
        const targetSectionId = sectionMap[object];
        currentSectionData = data.sections.find(section => section.id === targetSectionId);
        
        if (!currentSectionData) {
            throw new Error(`Section not found for object: ${object}`);
        }
        
    } catch (error) {
        console.error('Error loading section data:', error);
        showErrorMessage('Failed to load section data');
    }
}

function updatePageHeader(yearRange, object) {
    const sectionNames = {
        'naf': 'NAF History',
        'nafsfa': 'NAFSFA History',
        'evol': 'Evolution of NAF Finance'
    };
    
    document.getElementById('page-title').textContent = `Years ${yearRange} - ${sectionNames[object]} - Nigerian Air Force Museum`;
    document.getElementById('year-range-title').textContent = `Years ${yearRange}`;
    document.getElementById('section-info').textContent = `${sectionNames[object]} - Select a specific year to explore`;
}

function renderYearsFromRange(yearRange) {
    const yearsGrid = document.getElementById('years-grid');
    const [startYear, endYear] = yearRange.split('-').map(y => parseInt(y));
    
    let yearsHTML = '';
    
    // Generate individual years within the range
    for (let year = startYear; year <= endYear; year++) {
        // Check if we have data for this specific year
        const yearData = currentSectionData.years.find(y => parseInt(y.year) === year);
        
        if (yearData) {
            // We have specific data for this year
            yearsHTML += createYearCard(year, yearData.title, yearData.summary, true);
        } else {
            // Generate a generic card for years without specific data
            yearsHTML += createYearCard(year, `Year ${year}`, `Historical period within the ${yearRange} era`, false);
        }
    }
    
    yearsGrid.innerHTML = yearsHTML;
}

function createYearCard(year, title, description, hasData) {
    return `
        <div class="year-card" onclick="navigateToYear(${year}, ${hasData})" data-year="${year}">
            <span class="year-number">${year}</span>
            <h3 class="year-description">${title}</h3>
            <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 15px; font-size: 0.9rem;">
                ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}
            </p>
            <span class="year-indicator">${hasData ? 'Detailed Records' : 'General Period'}</span>
        </div>
    `;
}

function navigateToYear(year, hasData) {
    if (!isYearRangeDetected) {
        showWaitingMessage();
        return;
    }
    
    // Navigate to year detail page
    const sectionMap = {
        'naf': 'naf-history',
        'nafsfa': 'nafsfa-history', 
        'evol': 'finance-evolution'
    };
    
    const sectionId = sectionMap[currentObject];
    window.location.href = `year-detail.html?section=${sectionId}&year=${year}&range=${currentYearRange}`;
}

// Remove backToSection function as it's no longer needed per requirements
// Users can only change year range by dropping a new year range object

function getSectionIdFromObject(object) {
    const sectionMap = {
        'naf': 'naf-history',
        'nafsfa': 'nafsfa-history',
        'evol': 'finance-evolution'
    };
    return sectionMap[object];
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

function showConnectionStatus(message, type) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `connection-status ${type}`;
        
        // Hide status after 3 seconds if successful
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.opacity = '0.5';
            }, 3000);
        }
    }
}

function showObjectRemovalNotification() {
    const notification = document.createElement('div');
    notification.className = 'object-removal-notification';
    notification.innerHTML = `
        <div class="removal-indicator">
            <div class="pulse-animation removed"></div>
            <p>Object Removed</p>
            <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.7;">Returning to main page...</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

function showYearRangeNotDetectedNotification() {
    const notification = document.createElement('div');
    notification.className = 'object-removal-notification';
    notification.innerHTML = `
        <div class="removal-indicator" style="background: rgba(255, 193, 7, 0.95);">
            <div class="pulse-animation" style="background: #fff; animation: pulseWarning 1s ease-in-out infinite;"></div>
            <p>Year Range Not Detected</p>
            <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.7;">Returning to section page...</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
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

// Add CSS styles for animations
const additionalStyles = `
.object-removal-notification {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    animation: fadeInNotification 0.3s ease-in;
}

.removal-indicator {
    background: rgba(220, 53, 69, 0.95);
    color: white;
    padding: 30px 40px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideInRemoval 0.5s ease-out;
}

.removal-indicator p {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
}

.pulse-animation.removed {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #fff;
    margin: 0 auto 15px;
    animation: pulseRemoved 1s ease-in-out infinite;
}

.pulse-animation {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin: 0 auto 15px;
}

@keyframes pulseRemoved {
    0%, 100% { 
        transform: scale(1);
        opacity: 0.8;
    }
    50% { 
        transform: scale(1.2);
        opacity: 1;
    }
}

@keyframes pulseWarning {
    0%, 100% { 
        transform: scale(1);
        opacity: 0.8;
        background: #fff;
    }
    50% { 
        transform: scale(1.2);
        opacity: 1;
        background: #ffc107;
    }
}

@keyframes fadeInNotification {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInRemoval {
    from { 
        transform: translateY(-50px);
        opacity: 0;
    }
    to { 
        transform: translateY(0);
        opacity: 1;
    }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

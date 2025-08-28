// Socket.IO Connection
const socket = io('http://127.0.0.1:5550');

let currentSectionData = null;

// Get section ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const sectionId = urlParams.get('section');

if (!sectionId) {
  window.location.href = 'index.html';
}

// Socket.IO Event Listeners
function setupSocketListeners() {
    // Listen for year_dropped events from Python backend
    socket.on('year_dropped', function(data) {
        console.log('Year dropped via socket:', data.year);
        
        // Find the corresponding year in current section
        if (currentSectionData) {
            const yearData = currentSectionData.years.find(y => {
                // Match various year formats: '1972', '1967-1977', etc.
                return y.year === data.year || 
                       (data.year.includes('-') && isYearInRange(y.year, data.year));
            });
            
            if (yearData) {
                // Highlight the selected year
                highlightSelectedYear(yearData.year);
                
                // Navigate to year detail after animation
                setTimeout(() => {
                    navigateToYearDetail(yearData.year);
                }, 1000);
            }
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
    
    // Handle socket connection events
    socket.on('connect', function() {
        console.log('Connected to Socket.IO server');
        showConnectionStatus('Connected', 'success');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
        showConnectionStatus('Disconnected', 'error');
    });
    
    // Handle any socket errors
    socket.on('error', function(error) {
        console.error('Socket.IO error:', error);
        showConnectionStatus('Connection Error', 'error');
    });
}

function isYearInRange(singleYear, yearRange) {
    if (!yearRange.includes('-')) return false;
    
    const [startYear, endYear] = yearRange.split('-').map(y => parseInt(y));
    const year = parseInt(singleYear);
    
    return year >= startYear && year <= endYear;
}

function showConnectionStatus(message, type) {
    const statusEl = document.getElementById('connection-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `connection-status ${type}`;
        
        // Hide status after 3 seconds if successful
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.opacity = '0';
            }, 3000);
        }
    }
}

function showObjectRemovalNotification() {
    // Create a notification overlay for object removal
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
    
    // Remove notification after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
}

function highlightSelectedYear(year) {
    // Find and highlight the selected year item
    const yearElement = document.querySelector(`[data-year="${year}"]`);
    if (yearElement) {
        yearElement.classList.add('selected-via-socket');
        
        // Create selection animation
        createYearSelectionEffect(yearElement);
        
        // Scroll to the selected year
        yearElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

function createYearSelectionEffect(element) {
    // Create a pulsing effect around the selected year
    const pulseEffect = document.createElement('div');
    pulseEffect.className = 'year-selection-pulse';
    pulseEffect.style.position = 'absolute';
    pulseEffect.style.top = '0';
    pulseEffect.style.left = '0';
    pulseEffect.style.right = '0';
    pulseEffect.style.bottom = '0';
    pulseEffect.style.border = '3px solid #c41e3a';
    pulseEffect.style.borderRadius = '8px';
    pulseEffect.style.animation = 'yearPulse 2s ease-in-out';
    pulseEffect.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(pulseEffect);
    
    setTimeout(() => {
        if (pulseEffect.parentNode) {
            pulseEffect.parentNode.removeChild(pulseEffect);
        }
    }, 2000);
}

// Load section data from JSON
async function loadSectionData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    
    currentSectionData = data.sections.find(section => section.id === sectionId);
    
    if (!currentSectionData) {
      throw new Error('Section not found');
    }

    renderSectionOverview();
    renderYearsTimeline();
    
  } catch (error) {
    console.error('Error loading section data:', error);
    document.getElementById('main-container').innerHTML = 
      '<div class="error-message"><p>Error loading section content. Please try again.</p></div>';
  }
}

function renderSectionOverview() {
  // Update page title and navigation
  document.getElementById('page-title').textContent = `${currentSectionData.title} - Nigerian Air Force Museum`;
  document.getElementById('nav-section-title').textContent = currentSectionData.title;
  
  // Update overview panel
  document.getElementById('section-icon').textContent = currentSectionData.icon;
  document.getElementById('section-title').textContent = currentSectionData.title;
  document.getElementById('section-description').textContent = currentSectionData.description;
  document.getElementById('section-summary-text').textContent = currentSectionData.summary;
  
  // Update stats
  document.getElementById('total-years').textContent = currentSectionData.years.length;
  
  let totalEvents = 0;
  currentSectionData.years.forEach(year => {
    totalEvents += (year.highlights?.length || 0) + (year.activities?.length || 0);
  });
  document.getElementById('total-events').textContent = totalEvents;
}

function renderYearsTimeline() {
  const container = document.getElementById('years-container');
  let timelineHTML = '';

  currentSectionData.years.forEach((yearData, index) => {
    timelineHTML += `
      <div class="year-item" onclick="navigateToYearDetail('${yearData.year}')" data-year="${yearData.year}">
        <div class="year-marker">
          <span class="year-number">${yearData.year}</span>
        </div>
        <div class="year-info">
          <h4 class="year-title">${yearData.title}</h4>
          <p class="year-summary">${yearData.summary}</p>
          <div class="year-meta">
            <span class="highlight-count">${yearData.highlights?.length || 0} highlights</span>
            <span class="activity-count">${yearData.activities?.length || 0} activities</span>
          </div>
        </div>
        <div class="year-arrow">→</div>
      </div>
    `;
  });

  container.innerHTML = timelineHTML;
}

function navigateToYearDetail(year) {
  // Navigate to the year detail page with section and year parameters
  window.location.href = `year-detail.html?section=${sectionId}&year=${year}`;
}

// Initialize the section viewer
document.addEventListener('DOMContentLoaded', function() {
  loadSectionData();
  setupSocketListeners();
});

// Add necessary CSS animations
const additionalSectionStyles = `
.selected-via-socket {
    background: rgba(196, 30, 58, 0.1);
    transform: scale(1.02);
    transition: all 0.3s ease;
}

@keyframes yearPulse {
    0%, 100% { 
        border-color: #c41e3a;
        transform: scale(1);
    }
    50% { 
        border-color: #ff4444;
        transform: scale(1.05);
    }
}

.connection-status {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border-radius: 5px;
    font-weight: bold;
    z-index: 10000;
    transition: opacity 0.3s ease;
    font-size: 0.9em;
}

.connection-status.success {
    background: rgba(40, 167, 69, 0.9);
    color: white;
}

.connection-status.error {
    background: rgba(220, 53, 69, 0.9);
    color: white;
}

.year-item {
    position: relative;
    transition: all 0.3s ease;
}

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
`;

// Inject additional styles
const sectionStyleSheet = document.createElement('style');
sectionStyleSheet.textContent = additionalSectionStyles;
document.head.appendChild(sectionStyleSheet);

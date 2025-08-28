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
`;

// Inject additional styles
const sectionStyleSheet = document.createElement('style');
sectionStyleSheet.textContent = additionalSectionStyles;
document.head.appendChild(sectionStyleSheet);

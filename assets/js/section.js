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
    // Listen for RFID detection from Arduino (new system)
    socket.on('rfid_detected', function(data) {
        console.log('RFID detected on section page:', data.uid, 'for object:', data.object);
        
        // Use JavaScript mapping to resolve year range
        if (window.RFIDYearMapping) {
            const yearRange = window.RFIDYearMapping.getYearRangeFromUID(data.uid);
            
            if (yearRange) {
                console.log('Year range resolved:', yearRange);
                
                // Send resolved year back to server for state management
                socket.emit('resolve_year_from_rfid', {
                    uid: data.uid,
                    year_range: yearRange,
                    object: data.object
                });
            } else {
                console.warn('Unknown RFID UID on section page:', data.uid);
            }
        } else {
            console.error('RFIDYearMapping not loaded on section page! Cannot resolve year range.');
        }
    });
    
    // Listen for year_dropped events from Python backend
    socket.on('year_dropped', function(data) {
        console.log('Year range dropped via socket:', data.year);
        
        // Navigate to year list page with the detected year range
        if (data.year && data.object) {
            // Navigate directly without any visual feedback or delay
            navigateToYearList(data.year, data.object);
        }
    });
    
    // Listen for return_to_section events - when year range not detected
    socket.on('return_to_section', function(data) {
        console.log('Returning to section due to year range not detected');
        // No notification needed - user stays on current page
    });
    
    // Listen for object_dropped events - return to main page
    socket.on('object_dropped', function(data) {
        console.log('Object dropped via socket, returning to main page:', data.message);
        
        // Navigate back to main page immediately
        window.location.href = 'index.html';
    });
    
    // Handle socket connection events
    socket.on('connect', function() {
        console.log('Connected to Socket.IO server');
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
    });
    
    // Handle any socket errors
    socket.on('error', function(error) {
        console.error('Socket.IO error:', error);
    });
}

function navigateToYearList(yearRange, object) {
    // Navigate to the year list page with year range and object parameters
    const sectionMap = {
        'naf': 'naf-history',
        'nafsfa': 'nafsfa-history',
        'evol': 'finance-evolution'
    };
    
    const sectionId = sectionMap[object] || sectionId;
    window.location.href = `year-list.html?section=${sectionId}&year=${yearRange}&object=${object}`;
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
  
  // Set default values for missing properties
  const sectionIcon = getSectionIcon(currentSectionData.id);
  const sectionDescription = getSectionDescription(currentSectionData.id);
  
  // Update navigation logo with section-specific logo
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo && currentSectionData.logo) {
    navLogo.src = currentSectionData.logo;
  }
  
  // Update section logo in the header
  const sectionLogo = document.getElementById('section-logo');
  if (sectionLogo && currentSectionData.logo) {
    sectionLogo.src = currentSectionData.logo;
  }
  
  // Update overview panel
  document.getElementById('section-icon').textContent = sectionIcon;
  document.getElementById('section-title').textContent = currentSectionData.title;
  document.getElementById('section-description').textContent = sectionDescription;
  
  // Update drop zone instruction with dynamic year range example
  updateDropZoneInstruction();
  
  // Calculate stats from year-ranges data
  const yearRanges = currentSectionData['year-ranges'] || [];
  let totalYears = 0;
  let totalEvents = 0;
  
  // Count years and events from year-ranges
  yearRanges.forEach(rangeObj => {
    Object.keys(rangeObj).forEach(rangeKey => {
      const years = rangeObj[rangeKey];
      if (Array.isArray(years)) {
        totalYears += years.length;
        years.forEach(year => {
          totalEvents += (year.highlights?.length || 0) + (year.activities?.length || 0);
        });
      }
    });
  });
  
  // Update stats (but keep them hidden initially)
  document.getElementById('total-years').textContent = totalYears;
  document.getElementById('total-events').textContent = totalEvents;
  
  // Initialize floating particles
  createFloatingParticles();
}

function updateDropZoneInstruction() {
  const dropZoneInstruction = document.getElementById('drop-zone-instruction');
  const yearRanges = currentSectionData['year-ranges'] || [];
  
  if (yearRanges.length === 0) {
    // No year ranges available for this section
    dropZoneInstruction.textContent = `No year ranges are currently available for ${currentSectionData.title}. Please check back later or explore other sections.`;
    return;
  }
  
  // Get the first available year range as an example
  let exampleYearRange = null;
  for (const rangeObj of yearRanges) {
    const rangeKey = Object.keys(rangeObj)[0];
    if (rangeKey) {
      exampleYearRange = rangeKey;
      break;
    }
  }
  
  if (exampleYearRange) {
    dropZoneInstruction.textContent = `Please drop a year range object (e.g., ${exampleYearRange}) in the year area to explore the historical timeline of ${currentSectionData.title}`;
  } else {
    dropZoneInstruction.textContent = `No year ranges are currently available for ${currentSectionData.title}. Please check back later or explore other sections.`;
  }
}

function getSectionIcon(sectionId) {
  const iconMap = {
    'naf-history': '✈️',
    'nafsfa-history': '🎖️', 
    'finance-evolution': '💰'
  };
  return iconMap[sectionId] || '🛩️';
}

function getSectionDescription(sectionId) {
  const descriptionMap = {
    'naf-history': 'Explore the rich history and heritage of the Nigerian Air Force from its inception to the present day.',
    'nafsfa-history': 'Discover the evolution and achievements of the NAF School of Finance and Accounts through the years.',
    'finance-evolution': 'Learn about the development and modernization of NAF finance specialty and its impact on operations.'
  };
  return descriptionMap[sectionId] || 'Explore the history and heritage of this section.';
}

function createFloatingParticles() {
    // Floating particles disabled to prevent scroll effects on Windows
    // Keeping the function but making it do nothing
    console.log('Floating particles disabled to prevent scroll effects on Windows');
    return;
    
    /* Original particle creation code commented out
    const particlesContainer = document.getElementById('particles-container');
    if (!particlesContainer) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            createParticle(particlesContainer);
        }, i * 200);
    }
    
    // Create new particles periodically
    setInterval(() => {
        createParticle(particlesContainer);
    }, 3000);
    */
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random horizontal position
    const startX = Math.random() * container.offsetWidth;
    particle.style.left = `${startX}px`;
    
    // Random animation delay
    particle.style.animationDelay = `${Math.random() * 2}s`;
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 25000);
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
`;

// Inject additional styles
const sectionStyleSheet = document.createElement('style');
sectionStyleSheet.textContent = additionalSectionStyles;
document.head.appendChild(sectionStyleSheet);

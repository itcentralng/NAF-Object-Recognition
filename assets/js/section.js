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
        console.log('Year range dropped via socket:', data.year);
        
        // Navigate to year list page with the detected year range
        if (data.year && data.object) {
            // Highlight effect for visual feedback
            showYearRangeDetected(data.year);
            
            // Navigate to year list after animation
            setTimeout(() => {
                navigateToYearList(data.year, data.object);
            }, 1000);
        }
    });
    
    // Listen for return_to_section events - when year range not detected
    socket.on('return_to_section', function(data) {
        console.log('Returning to section due to year range not detected');
        
        // Show notification that we're back
        showReturnToSectionNotification();
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
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
    });
    
    // Handle any socket errors
    socket.on('error', function(error) {
        console.error('Socket.IO error:', error);
    });
}

function showYearRangeDetected(yearRange) {
    // Update the detection status to show detected year range
    const detectionStatus = document.getElementById('detection-status');
    if (detectionStatus) {
        detectionStatus.innerHTML = `
            <div class="detection-indicator">
                <div class="pulse-animation detected" style="background: linear-gradient(135deg, #c41e3a, #8b0000); animation: pulseDetected 1s ease-in-out infinite;"></div>
                <p>Year Range Detected: ${yearRange}</p>
                <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.7;">Loading year list...</p>
            </div>
        `;
    }
    
    // Show full screen notification as well
    const notification = document.createElement('div');
    notification.className = 'year-range-notification';
    notification.innerHTML = `
        <div class="range-indicator">
            <div class="pulse-animation detected" style="background: #c41e3a; animation: pulseDetected 1s ease-in-out infinite;"></div>
            <h3>Year Range Detected!</h3>
            <p>${yearRange}</p>
            <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.7;">Loading year list...</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 1500);
}

function showReturnToSectionNotification() {
    // Reset detection status
    const detectionStatus = document.getElementById('detection-status');
    if (detectionStatus) {
        detectionStatus.innerHTML = `
            <div class="detection-indicator">
                <div class="pulse-animation"></div>
                <p>Waiting for year range detection...</p>
            </div>
        `;
    }
    
    const notification = document.createElement('div');
    notification.className = 'year-range-notification';
    notification.innerHTML = `
        <div class="range-indicator" style="background: rgba(255, 193, 7, 0.95);">
            <div class="pulse-animation" style="background: #fff; animation: pulseWarning 1s ease-in-out infinite;"></div>
            <h3>Year Range Not Detected</h3>
            <p>Returned to Section</p>
            <p style="font-size: 1rem; margin-top: 1rem; opacity: 0.7;">Drop a year range to continue</p>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);
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
  
  // Update overview panel
  document.getElementById('section-icon').textContent = currentSectionData.icon;
  document.getElementById('section-title').textContent = currentSectionData.title;
  document.getElementById('section-description').textContent = currentSectionData.description;
  
  // Update stats (but keep them hidden initially)
  document.getElementById('total-years').textContent = currentSectionData.years.length;
  
  let totalEvents = 0;
  currentSectionData.years.forEach(year => {
    totalEvents += (year.highlights?.length || 0) + (year.activities?.length || 0);
  });
  document.getElementById('total-events').textContent = totalEvents;
  
  // Initialize floating particles
  createFloatingParticles();
}

function createFloatingParticles() {
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

.year-range-notification {
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

.range-indicator {
    background: rgba(40, 167, 69, 0.95);
    color: white;
    padding: 30px 40px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideInRemoval 0.5s ease-out;
}

.range-indicator h3 {
    margin: 0 0 10px 0;
    font-size: 1.5rem;
    font-weight: bold;
}

.range-indicator p {
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
}

.pulse-animation.detected {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin: 0 auto 15px;
    border: none !important;
}

@keyframes pulseDetected {
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

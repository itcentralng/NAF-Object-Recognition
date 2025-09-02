let currentSectionData = null;
let currentYearData = null;
let currentYearIndex = -1;
let currentYearRange = null; // Track the year range for navigation

// Socket.IO Connection
const socket = io('http://127.0.0.1:5550');

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const sectionId = urlParams.get('section');
const yearParam = urlParams.get('year');
const rangeParam = urlParams.get('range'); // New parameter for year range

if (!sectionId || !yearParam) {
  window.location.href = 'index.html';
}

// Variables for infinite scroll
let autoScrollInterval = null;
let isAutoScrollPaused = false;
let isClickPaused = false; // Track click-based pause state
let isAutoScrollEnabled = false; // Track if auto scroll is enabled by user
let scrollSpeed = 1; // pixels per interval
let scrollInterval = 16; // milliseconds (approximately 60fps)

// Load section and year data
async function loadYearData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    
    currentSectionData = data.sections.find(section => section.id === sectionId);
    
    if (!currentSectionData) {
      throw new Error('Section not found');
    }

    // Update sidebar logo with section-specific logo
    updateSidebarLogo();

    // Find the year data that contains this specific year
    const targetYear = parseInt(yearParam);
    currentYearData = findYearDataForSpecificYear(targetYear);
    
    // Store the year range for navigation
    currentYearRange = rangeParam;
    
    if (!currentYearData) {
      // If no specific data exists, create generic year data
      currentYearData = {
        year: yearParam,
        title: `Year ${yearParam}`,
        summary: `Historical period from ${yearParam} within the Nigerian Air Force timeline.`,
        content: `This year (${yearParam}) represents a part of the Nigerian Air Force's ongoing history. While specific detailed records for this individual year may not be available, it falls within the documented timeline of the force's development and operations.`,
        highlights: [],
        activities: [
          `Continued Nigerian Air Force operations during ${yearParam}`,
          "Maintained organizational structure and training programs",
          "Ongoing service to defend Nigeria's airspace"
        ],
        images: [],
        keyPersonnel: "Various NAF personnel",
        isGeneric: true
      };
    } else {
      // Adapt the data for this specific year
      currentYearData = adaptDataForSpecificYear(currentYearData, targetYear);
    }

    renderYearDetail();
    
  } catch (error) {
    console.error('Error loading year data:', error);
    showError();
  }
}

function renderYearListSidebar() {
  // Year list has been removed from the sidebar
  // Only the back button remains
  return;
}

function findYearDataForSpecificYear(targetYear) {
  if (!currentSectionData || !currentSectionData["year-ranges"]) return null;
  
  // Find the year data entry that contains this specific year
  for (const rangeObj of currentSectionData["year-ranges"]) {
    // Each range object has keys like "1962-1972", "1973-1982", etc.
    for (const rangeKey of Object.keys(rangeObj)) {
      const yearArray = rangeObj[rangeKey];
      // Look for a year object that matches our target year
      const yearData = yearArray.find(yearEntry => {
        return parseInt(yearEntry.year) === targetYear;
      });
      if (yearData) {
        return yearData;
      }
    }
  }
  
  return null;
}

function adaptDataForSpecificYear(yearData, targetYear) {
  // Create a version of the data adapted for the specific year
  const adaptedData = {
    ...yearData,
    year: targetYear.toString(),
    title: yearData.title, // Keep original title
    summary: `Events and developments from ${targetYear} within the period: ${currentYearRange}`,
    isGeneric: false,
    originalYearRange: yearData.year
  };
  
  // If this is a year range, try to filter events/highlights that might be specific to this year
  if (yearData.year.includes('-')) {
    // For now, we'll show all highlights from the range period
    // In the future, you could add year-specific data to highlights
    adaptedData.content = `During ${targetYear}, the Nigerian Air Force continued the activities documented for the ${yearData.year} period. ${yearData.content}`;
  }
  
  return adaptedData;
}

function renderYearDetail() {
  // Hide loading message and show content
  document.getElementById('loading-message').style.display = 'none';
  document.getElementById('year-detail-content').style.display = 'block';
  
  // Update page title and navigation
  const pageTitle = currentYearData.isGeneric ? 
    `${currentYearData.year} - Nigerian Air Force - Historical Period` :
    `${currentYearData.year} - ${currentSectionData.title}`;
    
  document.getElementById('page-title').textContent = `${pageTitle} - Nigerian Air Force Museum`;
  
  // Update sidebar title
  const sidebarTitle = document.getElementById('sidebar-title');
  if (sidebarTitle) {
    // Use the actual section title from the data instead of hardcoded values
    sidebarTitle.textContent = currentSectionData.title || 'History';
  }

  // Update back button text based on navigation context
  const backBtnText = document.getElementById('back-btn-text');
  if (currentYearRange) {
    backBtnText.textContent = `Back`;
  } else {
    backBtnText.textContent = 'Back';
  }
  
  // Update year header with new structure
  document.getElementById('year-number').textContent = currentYearData.year;
  document.getElementById('year-display').textContent = currentYearData.year;
  
  // Set the year range display
  const yearRangeDisplay = document.getElementById('year-range-display');
  if (currentYearRange) {
    yearRangeDisplay.textContent = currentYearRange;
  } else if (currentYearData.originalYearRange) {
    yearRangeDisplay.textContent = currentYearData.originalYearRange;
  } else {
    yearRangeDisplay.textContent = 'Nigerian Air Force Timeline';
  }
  
  // Render events timeline
  renderEventsTimeline();
}

function renderEventsTimeline() {
  const timelineContainer = document.getElementById('events-timeline');
  let timelineHTML = '';
  let eventCount = 0;
  
  if (currentYearData.highlights && currentYearData.highlights.length > 0) {
    eventCount = currentYearData.highlights.length;
    // Create events from highlights
    currentYearData.highlights.forEach((highlight, index) => {
      timelineHTML += `
        <div class="event-card" data-event-index="${index}">
          <div class="event-number">
            <span>${index + 1}</span>
          </div>
          <div class="event-content">
            <div class="event-header">
              <h3 class="event-title">${highlight.title}</h3>
              <div class="event-date">${currentYearData.year}</div>
            </div>
            <p class="event-description">${highlight.description}</p>
            
            ${highlight.image ? `
              <div class="event-images-grid">
                <div class="event-image-container" onclick="openImageModal('${highlight.image}', 0, ${index})">
                  <img src="${highlight.image}" alt="${highlight.title}" class="event-image" loading="lazy" />
                  <div class="image-overlay">
                    <span class="zoom-icon">🔍</span>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  } else {
    // Create a general event from available data, then add some sample events for demonstration
    const baseEvents = [
      {
        title: currentYearData.title || `Nigerian Air Force Operations - ${currentYearData.year}`,
        description: currentYearData.content || currentYearData.summary || `Overview of Nigerian Air Force activities and developments during ${currentYearData.year}.`,
        activities: currentYearData.activities || []
      }
    ];
    
    // Add some additional contextual events to create a richer timeline
    const additionalEvents = [
      {
        title: "Personnel Development and Training",
        description: `Continued focus on personnel development and specialized training programs throughout ${currentYearData.year}.`,
        activities: [
          "Ongoing pilot training programs",
          "Technical skills enhancement",
          "Leadership development initiatives"
        ]
      },
      {
        title: "Operational Readiness",
        description: `Maintained high levels of operational readiness and defense capabilities during ${currentYearData.year}.`,
        activities: [
          "Aircraft maintenance and servicing",
          "Mission readiness exercises",
          "Strategic defense planning"
        ]
      },
      {
        title: "Infrastructure and Technology",
        description: `Infrastructure development and technological advancement initiatives in ${currentYearData.year}.`,
        activities: [
          "Base facilities improvement",
          "Communications systems upgrade",
          "Equipment modernization"
        ]
      },
      {
        title: "Community Engagement",
        description: `Nigerian Air Force community outreach and public engagement activities in ${currentYearData.year}.`,
        activities: [
          "Public awareness programs",
          "Educational partnerships",
          "Community service initiatives"
        ]
      }
    ];
    
    const allEvents = [...baseEvents, ...additionalEvents];
    eventCount = allEvents.length;
    
    allEvents.forEach((event, index) => {
      timelineHTML += `
        <div class="event-card" data-event-index="${index}">
          <div class="event-number">
            <span>${index + 1}</span>
          </div>
          <div class="event-content">
            <div class="event-header">
              <h3 class="event-title">${event.title}</h3>
              <div class="event-date">${currentYearData.year}</div>
            </div>
            <p class="event-description">${event.description}</p>
            
            ${event.activities && event.activities.length > 0 ? `
              <div class="event-activities">
                <h4>Key Activities:</h4>
                <ul class="event-activities-list">
                  ${event.activities.map(activity => `
                    <li>${activity}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }
  
  timelineContainer.innerHTML = timelineHTML;
  
  // Show/hide auto scroll button based on event count
  const autoScrollControls = document.querySelector('.events-controls');
  if (autoScrollControls) {
    if (eventCount >= 2) {
      autoScrollControls.style.display = 'block';
    } else {
      autoScrollControls.style.display = 'none';
      // If auto scroll is currently enabled but we don't have enough events, disable it
      if (isAutoScrollEnabled) {
        isAutoScrollEnabled = false;
        stopAutoScroll();
      }
    }
  }
  
  // Reset click pause state on new content
  isClickPaused = false;
  isAutoScrollPaused = false;
  
  // Initialize auto scroll functionality 
  initializeAutoScroll();
}

function initializeAutoScroll() {
  const timeline = document.getElementById('events-timeline');
  
  if (!timeline) return;

  // Don't start auto-scroll automatically - wait for user to enable it
  // startSmoothAutoScroll(timeline);
  
  // Initialize visual feedback
  updateScrollVisualFeedback();
  updateAutoScrollButton();
  
  // Add interaction event listeners for pause on hover (only when auto scroll is enabled)
  timeline.addEventListener('mouseenter', () => {
    if (isAutoScrollEnabled) pauseAutoScroll();
  });
  timeline.addEventListener('mouseleave', () => {
    if (isAutoScrollEnabled) resumeAutoScroll();
  });
  
  // Add click/touch event listeners for toggle pause/resume (only when auto scroll is enabled)
  timeline.addEventListener('click', (e) => {
    if (isAutoScrollEnabled) toggleAutoScrollOnClick(e);
  });
  timeline.addEventListener('touchstart', () => {
    if (isAutoScrollEnabled) pauseAutoScroll();
  }, { passive: true });
  timeline.addEventListener('touchend', () => {
    if (isAutoScrollEnabled) resumeAutoScroll();
  }, { passive: true });
}

function startSmoothAutoScroll(timeline) {
  if (autoScrollInterval) clearInterval(autoScrollInterval);
  
  const allEvents = timeline.querySelectorAll('.event-card');
  if (allEvents.length === 0) return;
  
  // Calculate scroll distance for 6 seconds per event (reduced speed by half)
  const eventHeight = allEvents[0].offsetHeight + 20; // Include margin
  const pixelsPerSecond = eventHeight / 6; // Complete one event in 6 seconds (was 3 seconds)
  scrollSpeed = pixelsPerSecond / (1000 / scrollInterval); // Convert to pixels per interval
  
  autoScrollInterval = setInterval(() => {
    if (isAutoScrollPaused || !isAutoScrollEnabled) return;
    
    const currentScrollTop = timeline.scrollTop;
    const newScrollTop = currentScrollTop + scrollSpeed;
    const maxScrollTop = timeline.scrollHeight - timeline.clientHeight;
    
    // Stop auto-scroll when reaching the end instead of looping
    if (newScrollTop >= maxScrollTop) {
      timeline.scrollTop = maxScrollTop;
      // Stop auto-scroll when we reach the end
      stopAutoScroll();
      isAutoScrollEnabled = false;
      updateAutoScrollButton();
      updateScrollVisualFeedback();
    } else {
      timeline.scrollTop = newScrollTop;
    }
  }, scrollInterval);
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

function updateScrollVisualFeedback() {
  const timeline = document.getElementById('events-timeline');
  if (!timeline) return;
  
  // Add visual indicator for paused state (only when auto scroll is enabled)
  if (isClickPaused && isAutoScrollEnabled) {
    timeline.style.cursor = 'pointer';
    timeline.title = 'Click to resume auto-scroll';
    
    // Add a subtle visual indicator
    if (!timeline.querySelector('.scroll-pause-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'scroll-pause-indicator';
      indicator.innerHTML = '⏸️';
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 100;
        pointer-events: none;
        opacity: 0.8;
      `;
      
      const container = timeline.closest('.events-scroll-container');
      if (container && container.style.position !== 'relative') {
        container.style.position = 'relative';
      }
      (container || timeline.parentNode).appendChild(indicator);
    }
  } else {
    if (isAutoScrollEnabled) {
      timeline.style.cursor = 'pointer';
      timeline.title = 'Click to pause auto-scroll';
    } else {
      timeline.style.cursor = 'default';
      timeline.title = '';
    }
    
    // Remove visual indicator
    const indicator = timeline.parentNode.querySelector('.scroll-pause-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Function to toggle auto scroll on/off
function toggleAutoScroll() {
  isAutoScrollEnabled = !isAutoScrollEnabled;
  
  const timeline = document.getElementById('events-timeline');
  if (!timeline) return;
  
  if (isAutoScrollEnabled) {
    // Enable auto scroll
    isClickPaused = false;
    isAutoScrollPaused = false;
    startSmoothAutoScroll(timeline);
  } else {
    // Disable auto scroll
    stopAutoScroll();
    isClickPaused = false;
    isAutoScrollPaused = false;
  }
  
  updateAutoScrollButton();
  updateScrollVisualFeedback();
}

// Function to update the auto scroll button appearance
function updateAutoScrollButton() {
  const button = document.getElementById('auto-scroll-toggle');
  const icon = document.getElementById('auto-scroll-icon');
  const text = document.getElementById('auto-scroll-text');
  
  if (!button || !icon || !text) return;
  
  if (isAutoScrollEnabled) {
    button.classList.add('active');
    icon.textContent = '⏸️';
    text.textContent = 'Disable Auto Scroll';
  } else {
    button.classList.remove('active');
    icon.textContent = '▶️';
    text.textContent = 'Enable Auto Scroll';
  }
}

function pauseAutoScroll() {
  // Only pause if auto scroll is enabled
  if (isAutoScrollEnabled) {
    isAutoScrollPaused = true;
  }
}

function resumeAutoScroll() {
  // Only resume if not click-paused and auto scroll is enabled
  if (!isClickPaused && isAutoScrollEnabled) {
    isAutoScrollPaused = false;
  }
}

function toggleAutoScrollOnClick(event) {
  // Only work when auto scroll is enabled
  if (!isAutoScrollEnabled) return;
  
  // Prevent triggering on child elements like images or buttons
  if (event.target.closest('.event-image-container') || 
      event.target.closest('button') || 
      event.target.closest('a')) {
    return;
  }
  
  isClickPaused = !isClickPaused;
  
  if (isClickPaused) {
    isAutoScrollPaused = true;
  } else {
    isAutoScrollPaused = false;
  }
  
  // Add visual feedback for click pause state
  updateScrollVisualFeedback();
}

function navigateToYearInSection(year) {
  const queryParams = new URLSearchParams();
  queryParams.set('section', sectionId);
  queryParams.set('year', year);
  if (currentYearRange) {
    queryParams.set('range', currentYearRange);
  }
  window.location.href = `year-detail.html?${queryParams.toString()}`;
}

function navigateToYearWithinRange(year) {
  const queryParams = new URLSearchParams();
  queryParams.set('section', sectionId);
  queryParams.set('year', year.toString());
  if (currentYearRange) {
    queryParams.set('range', currentYearRange);
  }
  window.location.href = `year-detail.html?${queryParams.toString()}`;
}

function goBackToSection() {
  // If we came from a year range, go back to the year list instead of section
  if (currentYearRange) {
    // Complete mapping from sectionId to object parameter
    const sectionToObjectMap = {
      'naf-history': 'naf',
      'nafsfa-history': 'nafsfa', 
      'finance-evolution': 'evol'
    };
    const objectParam = sectionToObjectMap[sectionId] || 'naf';
    window.location.href = `year-list.html?section=${sectionId}&year=${currentYearRange}&object=${objectParam}`;
  } else {
    window.location.href = `section.html?section=${sectionId}`;
  }
}

function openImageModal(imageSrc, imageIndex, eventIndex) {
  // Create and show image modal
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  modal.innerHTML = `
    <div class="image-modal-content">
      <button class="image-modal-close" onclick="closeImageModal()">&times;</button>
      <div class="modal-image-container">
        <img src="${imageSrc}" alt="Historical Image" class="modal-image" />
      </div>
      <div class="image-modal-info">
        <p>Historical Image - ${currentYearData.year}</p>
        <p class="image-event-title">${currentYearData.highlights && currentYearData.highlights[eventIndex] ? currentYearData.highlights[eventIndex].title : currentYearData.title}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeImageModal();
    }
  });
}

function navigateModalImage(direction) {
  // Simplified version - no navigation for now
  // This function can be expanded later if multi-image support is needed
}

function closeImageModal() {
  const modal = document.querySelector('.image-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

function showError() {
  document.getElementById('loading-message').style.display = 'none';
  document.getElementById('error-message').style.display = 'block';
}

function updateSidebarLogo() {
  // Update the sidebar logo with section-specific logo
  const sidebarLogo = document.querySelector('.nav-logo');
  if (sidebarLogo && currentSectionData && currentSectionData.logo) {
    sidebarLogo.src = currentSectionData.logo;
    sidebarLogo.alt = `${currentSectionData.title} Logo`;
  }
}

// Socket.IO Event Listeners
function setupSocketListeners() {
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

// Handle escape key for image modal and arrow keys for navigation
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeImageModal();
  } else if (document.querySelector('.image-modal')) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateModalImage(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateModalImage(1);
    }
  }
});

// Initialize the year detail viewer
document.addEventListener('DOMContentLoaded', function() {
  loadYearData();
  setupSocketListeners();
});

// Cleanup when page is unloaded
window.addEventListener('beforeunload', function() {
  stopAutoScroll();
});

// Pause auto-scroll when page loses focus
document.addEventListener('visibilitychange', function() {
  if (!isAutoScrollEnabled) return;
  
  if (document.hidden) {
    pauseAutoScroll();
  } else {
    resumeAutoScroll();
  }
});

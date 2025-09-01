let currentSectionData = null;
let currentYearData = null;
let currentYearIndex = -1;
let currentYearRange = null; // Track the year range for navigation

// Auto-scroll variables
let autoScrollInterval = null;
let isAutoScrollPaused = false;
let scrollDirection = 1; // 1 for down, -1 for up
let currentScrollPosition = 0;

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

// Load section and year data
async function loadYearData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    
    currentSectionData = data.sections.find(section => section.id === sectionId);
    
    if (!currentSectionData) {
      throw new Error('Section not found');
    }

    // Find the year data that contains this specific year
    const targetYear = parseInt(yearParam);
    currentYearData = findYearDataForSpecificYear(targetYear);
    
    // Find the index for navigation - we need to build a flat list of all years
    const allYears = [];
    if (currentSectionData["year-ranges"]) {
      currentSectionData["year-ranges"].forEach(rangeObj => {
        Object.keys(rangeObj).forEach(rangeKey => {
          const yearArray = rangeObj[rangeKey];
          allYears.push(...yearArray);
        });
      });
      // Sort by year for proper navigation
      allYears.sort((a, b) => parseInt(a.year) - parseInt(b.year));
      currentYearIndex = allYears.findIndex(year => parseInt(year.year) === targetYear);
    }
    
    // Store all years for navigation
    currentSectionData.allYears = allYears;
    
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
    setupNavigation();
    
  } catch (error) {
    console.error('Error loading year data:', error);
    showError();
  }
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
    title: `${targetYear} - ${yearData.title}`,
    summary: `Events and developments from ${targetYear} within the period: ${yearData.summary}`,
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
  document.getElementById('nav-year-title').textContent = `${currentSectionData.title} - ${currentYearData.year}`;
  
  // Update back button text based on navigation context
  const backBtnText = document.getElementById('back-btn-text');
  if (currentYearRange) {
    backBtnText.textContent = `Back to ${currentYearRange} Years`;
  } else {
    backBtnText.textContent = 'Back to Section';
  }
  
  // Update year header
  document.getElementById('year-number').textContent = currentYearData.year;
  document.getElementById('year-title').textContent = currentYearData.title;
  document.getElementById('year-summary').textContent = currentYearData.summary;
  
  // Render events timeline
  renderEventsTimeline();
}

function renderEventsTimeline() {
  const timelineContainer = document.getElementById('events-timeline');
  let timelineHTML = '';
  
  if (currentYearData.highlights && currentYearData.highlights.length > 0) {
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
                  <img src="${highlight.image}" alt="${highlight.title}" class="event-image" />
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
    // Create a general event from available data
    timelineHTML = `
      <div class="event-card">
        <div class="event-number">
          <span>1</span>
        </div>
        <div class="event-content">
          <div class="event-header">
            <h3 class="event-title">${currentYearData.title}</h3>
            <div class="event-date">${currentYearData.year}</div>
          </div>
          <p class="event-description">${currentYearData.content || currentYearData.summary}</p>
          
          ${currentYearData.activities && currentYearData.activities.length > 0 ? `
            <div class="event-activities">
              <h4>Key Activities:</h4>
              <ul class="event-activities-list">
                ${currentYearData.activities.map(activity => `
                  <li>${activity}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  timelineContainer.innerHTML = timelineHTML;
  
  // Add animation to event cards
  setTimeout(() => {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-in');
      }, index * 200);
    });
  }, 100);

  // Initialize auto-scroll functionality
  initializeAutoScroll();
}

function initializeAutoScroll() {
  const timeline = document.getElementById('events-timeline');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const scrollStatus = document.getElementById('scroll-status');
  
  if (!timeline) return;

  // Check if content is scrollable
  const isScrollable = timeline.scrollHeight > timeline.clientHeight;
  
  if (!isScrollable) {
    // Hide scroll indicator if content doesn't scroll
    if (scrollIndicator) {
      scrollIndicator.style.display = 'none';
    }
    return;
  }

  // Start auto-scroll
  startAutoScroll();

  // Add event listeners for pause/resume functionality
  timeline.addEventListener('mousedown', pauseAutoScroll);
  timeline.addEventListener('touchstart', pauseAutoScroll, { passive: true });
  
  timeline.addEventListener('mouseup', resumeAutoScroll);
  timeline.addEventListener('touchend', resumeAutoScroll, { passive: true });
  
  // Also pause on mouse enter and resume on mouse leave for better UX
  timeline.addEventListener('mouseenter', pauseAutoScroll);
  timeline.addEventListener('mouseleave', resumeAutoScroll);

  // Click handler for the scroll indicator
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', toggleAutoScroll);
  }

  // Update scroll status text
  updateScrollStatus();
}

function startAutoScroll() {
  const timeline = document.getElementById('events-timeline');
  if (!timeline) return;

  stopAutoScroll(); // Clear any existing interval

  autoScrollInterval = setInterval(() => {
    if (isAutoScrollPaused) return;

    const maxScroll = timeline.scrollHeight - timeline.clientHeight;
    const scrollStep = 1;
    
    currentScrollPosition += scrollDirection * scrollStep;
    
    // Check bounds and reverse direction
    if (currentScrollPosition >= maxScroll) {
      scrollDirection = -1;
      currentScrollPosition = maxScroll;
    } else if (currentScrollPosition <= 0) {
      scrollDirection = 1;
      currentScrollPosition = 0;
    }
    
    timeline.scrollTop = currentScrollPosition;
  }, 50); // Smooth scrolling - adjust speed as needed
}

function stopAutoScroll() {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }
}

function pauseAutoScroll() {
  isAutoScrollPaused = true;
  updateScrollStatus();
}

function resumeAutoScroll() {
  isAutoScrollPaused = false;
  updateScrollStatus();
}

function toggleAutoScroll() {
  if (isAutoScrollPaused) {
    resumeAutoScroll();
  } else {
    pauseAutoScroll();
  }
}

function updateScrollStatus() {
  const scrollStatus = document.getElementById('scroll-status');
  const scrollIndicator = document.querySelector('.scroll-indicator');
  
  if (!scrollStatus || !scrollIndicator) return;

  if (isAutoScrollPaused) {
    scrollStatus.textContent = 'Auto-scroll paused • Click to resume';
    scrollIndicator.classList.add('paused');
  } else {
    scrollStatus.textContent = 'Auto-scrolling • Click to pause';
    scrollIndicator.classList.remove('paused');
  }
}

function setupNavigation() {
  const prevBtn = document.getElementById('prev-year-btn');
  const nextBtn = document.getElementById('next-year-btn');
  const prevText = document.getElementById('prev-year-text');
  const nextText = document.getElementById('next-year-text');
  
  // If we have a year range, set up navigation within that range
  if (currentYearRange) {
    const [startYear, endYear] = currentYearRange.split('-').map(y => parseInt(y));
    const currentYear = parseInt(yearParam);
    
    // Check if there's a previous year within the range
    if (currentYear > startYear) {
      const prevYear = currentYear - 1;
      prevBtn.style.display = 'flex';
      prevText.textContent = `${prevYear}`;
      prevBtn.onclick = () => navigateToYearInSection(prevYear.toString());
    }
    
    // Check if there's a next year within the range
    if (currentYear < endYear) {
      const nextYear = currentYear + 1;
      nextBtn.style.display = 'flex';
      nextText.textContent = `${nextYear}`;
      nextBtn.onclick = () => navigateToYearInSection(nextYear.toString());
    }
  } else {
    // Fallback: navigate through all available documented years
    if (currentSectionData && currentSectionData.allYears && currentYearIndex >= 0) {
      if (currentYearIndex > 0) {
        const prevYear = currentSectionData.allYears[currentYearIndex - 1];
        prevBtn.style.display = 'flex';
        prevText.textContent = `${prevYear.year}`;
        prevBtn.onclick = () => navigateToYearInSection(prevYear.year);
      }
      
      if (currentYearIndex < currentSectionData.allYears.length - 1) {
        const nextYear = currentSectionData.allYears[currentYearIndex + 1];
        nextBtn.style.display = 'flex';
        nextText.textContent = `${nextYear.year}`;
        nextBtn.onclick = () => navigateToYearInSection(nextYear.year);
      }
    }
  }
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

function navigateToPreviousYear() {
  if (currentSectionData.allYears && currentYearIndex > 0) {
    const prevYear = currentSectionData.allYears[currentYearIndex - 1];
    window.location.href = `year-detail.html?section=${sectionId}&year=${prevYear.year}`;
  }
}

function navigateToNextYear() {
  if (currentSectionData.allYears && currentYearIndex < currentSectionData.allYears.length - 1) {
    const nextYear = currentSectionData.allYears[currentYearIndex + 1];
    window.location.href = `year-detail.html?section=${sectionId}&year=${nextYear.year}`;
  }
}

function goBackToSection() {
  // If we came from a year range, go back to the year list instead of section
  if (currentYearRange) {
    const objectMap = {
      'naf-history': 'naf'
    };
    const objectParam = objectMap[sectionId] || 'naf';
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
  if (document.hidden) {
    pauseAutoScroll();
  } else {
    resumeAutoScroll();
  }
});

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

    // Try to find exact year data first
    currentYearData = currentSectionData.years.find(year => year.year === yearParam);
    currentYearIndex = currentSectionData.years.findIndex(year => year.year === yearParam);
    
    // Store the year range for navigation
    currentYearRange = rangeParam;
    
    if (!currentYearData) {
      // If no specific data exists, create generic year data
      currentYearData = {
        year: yearParam,
        title: `Year ${yearParam}`,
        summary: `Historical period from ${yearParam} within the ${currentSectionData.title} timeline.`,
        content: `This year falls within the documented history of the ${currentSectionData.title}. While specific detailed records for ${yearParam} may not be available, this period represents an important part of the overall historical timeline.`,
        highlights: [],
        activities: [`General operations continued during ${yearParam}`, "Maintained organizational structure", "Continued service to the Nigerian Air Force"],
        images: []
      };
    }

    renderYearDetail();
    setupNavigation();
    
  } catch (error) {
    console.error('Error loading year data:', error);
    showError();
  }
}

function renderYearDetail() {
  // Hide loading message and show content
  document.getElementById('loading-message').style.display = 'none';
  document.getElementById('year-detail-content').style.display = 'block';
  
  // Update page title and navigation
  document.getElementById('page-title').textContent = `${currentYearData.year} - ${currentSectionData.title} - Nigerian Air Force Museum`;
  document.getElementById('nav-year-title').textContent = `${currentSectionData.title} - ${currentYearData.year}`;
  
  // Update back button text based on navigation context
  const backBtnText = document.getElementById('back-btn-text');
  if (currentYearRange) {
    backBtnText.textContent = `Back to ${currentYearRange} List`;
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
      const eventImages = [highlight.image];
      // Add related images from the year's image collection if available
      if (currentYearData.images && currentYearData.images.length > 0) {
        const additionalImages = currentYearData.images
          .filter(img => img !== highlight.image)
          .slice(0, 3); // Limit to 3 additional images per event
        eventImages.push(...additionalImages);
      }
      
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
            
            <div class="event-images-grid">
              ${eventImages.map((img, imgIndex) => `
                <div class="event-image-container" onclick="openImageModal('${img}', ${imgIndex}, ${index})">
                  <img src="${img}" alt="${highlight.title} - Image ${imgIndex + 1}" class="event-image" />
                  <div class="image-overlay">
                    <span class="zoom-icon">🔍</span>
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${currentYearData.activities && currentYearData.activities.length > 0 ? `
              <div class="event-activities">
                <h4>Related Activities:</h4>
                <ul class="event-activities-list">
                  ${currentYearData.activities.slice(0, 3).map(activity => `
                    <li>${activity}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  } else {
    // Create a general event from available data
    const eventImages = currentYearData.images || [];
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
          
          ${eventImages.length > 0 ? `
            <div class="event-images-grid">
              ${eventImages.map((img, imgIndex) => `
                <div class="event-image-container" onclick="openImageModal('${img}', ${imgIndex}, 0)">
                  <img src="${img}" alt="${currentYearData.title} - Image ${imgIndex + 1}" class="event-image" />
                  <div class="image-overlay">
                    <span class="zoom-icon">🔍</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
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
      prevBtn.onclick = () => navigateToYearWithinRange(prevYear);
    }
    
    // Check if there's a next year within the range
    if (currentYear < endYear) {
      const nextYear = currentYear + 1;
      nextBtn.style.display = 'flex';
      nextText.textContent = `${nextYear}`;
      nextBtn.onclick = () => navigateToYearWithinRange(nextYear);
    }
  } else {
    // Fallback to original navigation (within documented years only)
    if (currentYearIndex > 0) {
      const prevYear = currentSectionData.years[currentYearIndex - 1];
      prevBtn.style.display = 'flex';
      prevText.textContent = `${prevYear.year}`;
      prevBtn.onclick = () => navigateToPreviousYear();
    }
    
    if (currentYearIndex < currentSectionData.years.length - 1) {
      const nextYear = currentSectionData.years[currentYearIndex + 1];
      nextBtn.style.display = 'flex';
      nextText.textContent = `${nextYear.year}`;
      nextBtn.onclick = () => navigateToNextYear();
    }
  }
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
  if (currentYearIndex > 0) {
    const prevYear = currentSectionData.years[currentYearIndex - 1];
    window.location.href = `year-detail.html?section=${sectionId}&year=${prevYear.year}`;
  }
}

function navigateToNextYear() {
  if (currentYearIndex < currentSectionData.years.length - 1) {
    const nextYear = currentSectionData.years[currentYearIndex + 1];
    window.location.href = `year-detail.html?section=${sectionId}&year=${nextYear.year}`;
  }
}

function goBackToSection() {
  // If we came from a year range, go back to the year list instead of section
  if (currentYearRange) {
    const objectMap = {
      'naf-history': 'naf',
      'nafsfa-history': 'nafsfa', 
      'finance-evolution': 'evol'
    };
    const objectParam = objectMap[sectionId];
    window.location.href = `year-list.html?section=${sectionId}&year=${currentYearRange}&object=${objectParam}`;
  } else {
    window.location.href = `section.html?section=${sectionId}`;
  }
}

function openImageModal(imageSrc, imageIndex, eventIndex) {
  // Create and show image modal
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  
  // Get all images from the event for navigation
  let allImages = [];
  if (currentYearData.highlights && currentYearData.highlights[eventIndex]) {
    allImages.push(currentYearData.highlights[eventIndex].image);
    if (currentYearData.images) {
      const additionalImages = currentYearData.images
        .filter(img => img !== currentYearData.highlights[eventIndex].image)
        .slice(0, 3);
      allImages.push(...additionalImages);
    }
  } else {
    allImages = currentYearData.images || [imageSrc];
  }
  
  modal.innerHTML = `
    <div class="image-modal-content">
      <button class="image-modal-close" onclick="closeImageModal()">&times;</button>
      <div class="modal-image-container">
        <img src="${imageSrc}" alt="Historical Image" class="modal-image" />
        ${allImages.length > 1 ? `
          <button class="modal-nav-btn prev-btn" onclick="navigateModalImage(-1)" ${imageIndex === 0 ? 'disabled' : ''}>‹</button>
          <button class="modal-nav-btn next-btn" onclick="navigateModalImage(1)" ${imageIndex === allImages.length - 1 ? 'disabled' : ''}>›</button>
        ` : ''}
      </div>
      <div class="image-modal-info">
        <p>Image ${imageIndex + 1} of ${allImages.length} - ${currentYearData.year}</p>
        <p class="image-event-title">Event ${eventIndex + 1}: ${currentYearData.highlights && currentYearData.highlights[eventIndex] ? currentYearData.highlights[eventIndex].title : currentYearData.title}</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Store modal data for navigation
  modal.dataset.currentIndex = imageIndex;
  modal.dataset.eventIndex = eventIndex;
  modal.dataset.allImages = JSON.stringify(allImages);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeImageModal();
    }
  });
}

function navigateModalImage(direction) {
  const modal = document.querySelector('.image-modal');
  if (!modal) return;
  
  const currentIndex = parseInt(modal.dataset.currentIndex);
  const eventIndex = parseInt(modal.dataset.eventIndex);
  const allImages = JSON.parse(modal.dataset.allImages);
  
  const newIndex = currentIndex + direction;
  if (newIndex < 0 || newIndex >= allImages.length) return;
  
  const newImageSrc = allImages[newIndex];
  const modalImage = modal.querySelector('.modal-image');
  modalImage.src = newImageSrc;
  
  // Update modal data
  modal.dataset.currentIndex = newIndex;
  
  // Update navigation buttons
  const prevBtn = modal.querySelector('.prev-btn');
  const nextBtn = modal.querySelector('.next-btn');
  
  if (prevBtn) prevBtn.disabled = newIndex === 0;
  if (nextBtn) nextBtn.disabled = newIndex === allImages.length - 1;
  
  // Update info
  const info = modal.querySelector('.image-modal-info p');
  if (info) info.textContent = `Image ${newIndex + 1} of ${allImages.length} - ${currentYearData.year}`;
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

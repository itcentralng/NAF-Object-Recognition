let currentSectionData = null;
let currentYearData = null;
let currentYearIndex = -1;

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const sectionId = urlParams.get('section');
const yearParam = urlParams.get('year');

if (!sectionId || !yearParam) {
  window.location.href = 'index.html';
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

    currentYearData = currentSectionData.years.find(year => year.year === yearParam);
    currentYearIndex = currentSectionData.years.findIndex(year => year.year === yearParam);
    
    if (!currentYearData) {
      throw new Error('Year not found');
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
  
  // Update year header
  document.getElementById('year-number').textContent = currentYearData.year;
  document.getElementById('year-title').textContent = currentYearData.title;
  document.getElementById('year-summary').textContent = currentYearData.summary;
  
  // Update overview content
  document.getElementById('year-content').textContent = currentYearData.content;
  
  // Render highlights
  renderHighlights();
  
  // Render activities
  renderActivities();
  
  // Render images
  renderImages();
}

function renderHighlights() {
  const highlightsContainer = document.getElementById('highlights-grid');
  let highlightsHTML = '';
  
  if (currentYearData.highlights && currentYearData.highlights.length > 0) {
    currentYearData.highlights.forEach(highlight => {
      highlightsHTML += `
        <div class="highlight-card">
          <div class="highlight-image-container">
            <img src="${highlight.image}" alt="${highlight.title}" class="highlight-image" />
          </div>
          <div class="highlight-content">
            <h3 class="highlight-title">${highlight.title}</h3>
            <p class="highlight-description">${highlight.description}</p>
          </div>
        </div>
      `;
    });
  } else {
    highlightsHTML = '<div class="no-content"><p>No highlights available for this year.</p></div>';
  }
  
  highlightsContainer.innerHTML = highlightsHTML;
}

function renderActivities() {
  const activitiesContainer = document.getElementById('activities-list');
  let activitiesHTML = '';
  
  if (currentYearData.activities && currentYearData.activities.length > 0) {
    currentYearData.activities.forEach(activity => {
      activitiesHTML += `<li class="activity-item">${activity}</li>`;
    });
  } else {
    activitiesHTML = '<li class="no-content">No specific activities recorded for this year.</li>';
  }
  
  activitiesContainer.innerHTML = activitiesHTML;
}

function renderImages() {
  const imagesContainer = document.getElementById('images-gallery');
  let imagesHTML = '';
  
  if (currentYearData.images && currentYearData.images.length > 0) {
    currentYearData.images.forEach((image, index) => {
      imagesHTML += `
        <div class="gallery-item" onclick="openImageModal('${image}', ${index})">
          <img src="${image}" alt="Historical Image from ${currentYearData.year}" class="gallery-image" />
          <div class="gallery-overlay">
            <span class="gallery-icon">🔍</span>
          </div>
        </div>
      `;
    });
  } else {
    imagesHTML = '<div class="no-content"><p>No images available for this year.</p></div>';
  }
  
  imagesContainer.innerHTML = imagesHTML;
}

function setupNavigation() {
  const prevBtn = document.getElementById('prev-year-btn');
  const nextBtn = document.getElementById('next-year-btn');
  const prevText = document.getElementById('prev-year-text');
  const nextText = document.getElementById('next-year-text');
  
  // Check if there's a previous year
  if (currentYearIndex > 0) {
    const prevYear = currentSectionData.years[currentYearIndex - 1];
    prevBtn.style.display = 'flex';
    prevText.textContent = `${prevYear.year}`;
  }
  
  // Check if there's a next year
  if (currentYearIndex < currentSectionData.years.length - 1) {
    const nextYear = currentSectionData.years[currentYearIndex + 1];
    nextBtn.style.display = 'flex';
    nextText.textContent = `${nextYear.year}`;
  }
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
  window.location.href = `section.html?section=${sectionId}`;
}

function openImageModal(imageSrc, index) {
  // Create and show image modal
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="image-modal-content">
      <button class="image-modal-close" onclick="closeImageModal()">&times;</button>
      <img src="${imageSrc}" alt="Historical Image" class="modal-image" />
      <div class="image-modal-info">
        <p>Image ${index + 1} of ${currentYearData.images.length} - ${currentYearData.year}</p>
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

// Handle escape key for image modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeImageModal();
  }
});

// Initialize the year detail viewer
document.addEventListener('DOMContentLoaded', function() {
  loadYearData();
});

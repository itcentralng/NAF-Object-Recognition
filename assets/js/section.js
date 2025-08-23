let currentSectionData = null;

// Get section ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const sectionId = urlParams.get('section');

if (!sectionId) {
  window.location.href = 'index.html';
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
});

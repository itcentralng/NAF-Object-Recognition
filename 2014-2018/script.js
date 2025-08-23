"use strict";

// Global variables
let currentSection = 1;
const totalSections = 2;

// DOM Elements
const sections = document.querySelectorAll('.section');
const indicators = document.querySelectorAll('.indicator');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const scrollers = document.querySelectorAll(".scroller");

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializeScrollers();
    setupNavigationControls();
});

function initializePage() {
    // Show first section
    showSection(1);
    updateNavigationButtons();
    
    // Add indicator click listeners
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSection(index + 1);
        });
    });
}

function showSection(sectionNumber) {
    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('inactive');
    });
    
    // Show target section
    const targetSection = document.getElementById(`section${sectionNumber}`);
    if (targetSection) {
        targetSection.classList.remove('inactive');
        targetSection.classList.add('active');
        currentSection = sectionNumber;
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === sectionNumber - 1);
        });
        
        updateNavigationButtons();
        
        // Add entrance animation
        setTimeout(() => {
            targetSection.style.transform = 'translateX(0)';
            targetSection.style.opacity = '1';
        }, 100);
    }
}

function nextSection() {
    if (currentSection < totalSections) {
        showSection(currentSection + 1);
    }
}

function previousSection() {
    if (currentSection > 1) {
        showSection(currentSection - 1);
    }
}

function updateNavigationButtons() {
    if (prevBtn) prevBtn.disabled = currentSection === 1;
    if (nextBtn) nextBtn.disabled = currentSection === totalSections;
}

function setupNavigationControls() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                previousSection();
                break;
            case 'ArrowRight':
                nextSection();
                break;
            case 'Escape':
                window.history.back();
                break;
        }
    });
    
    // Touch/swipe gestures for mobile
    let startX = 0;
    let endX = 0;
    
    document.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextSection(); // Swipe left - next section
            } else {
                previousSection(); // Swipe right - previous section
            }
        }
    }
}

// Initialize scrollers with enhanced animation
function initializeScrollers() {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        addScrollAnimation();
    }
}

function addScrollAnimation() {
    scrollers.forEach((scroller) => {
        scroller.setAttribute("data-animated", true);
        const innerScroller = scroller.querySelector(".inner-scroller");
        if (innerScroller) {
            const scrollerContent = Array.from(innerScroller.children);

            // Clone items for seamless scrolling
            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute("aria-hidden", true);
                innerScroller.appendChild(duplicatedItem);
            });
            
            // Pause animation on hover
            scroller.addEventListener('mouseenter', () => {
                innerScroller.style.animationPlayState = 'paused';
            });
            
            scroller.addEventListener('mouseleave', () => {
                innerScroller.style.animationPlayState = 'running';
            });
        }
    });
}

// Auto-advance sections (optional)
let autoAdvanceInterval;

function startAutoAdvance() {
    autoAdvanceInterval = setInterval(() => {
        if (currentSection < totalSections) {
            nextSection();
        } else {
            showSection(1); // Loop back to first section
        }
    }, 10000); // 10 seconds
}

function stopAutoAdvance() {
    clearInterval(autoAdvanceInterval);
}

// Stop auto-advance on user interaction
document.addEventListener('click', stopAutoAdvance);
document.addEventListener('keydown', stopAutoAdvance);
document.addEventListener('touchstart', stopAutoAdvance);

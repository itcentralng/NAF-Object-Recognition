"use strict";

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const mainScreen = document.getElementById('main-screen');
const enterBtn = document.getElementById('enter-museum');
const sectionCards = document.querySelectorAll('.section-card');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add enter button event listener
    if (enterBtn) {
        enterBtn.addEventListener('click', handleEnterMuseum);
    }

    // Add section card event listeners
    sectionCards.forEach(card => {
        card.addEventListener('click', handleSectionClick);
    });
}

function handleEnterMuseum() {
    // Create broken glass effect
    createBrokenGlassEffect();
    
    // Transition to main screen after glass effect
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        mainScreen.classList.add('active');
    }, 1000);
}

function createBrokenGlassEffect() {
    const glassShatter = document.createElement('div');
    glassShatter.className = 'glass-shatter';
    document.body.appendChild(glassShatter);

    // Create multiple glass fragments
    const fragmentCount = 20;
    
    for (let i = 0; i < fragmentCount; i++) {
        createGlassFragment(glassShatter, i);
    }

    // Remove glass shatter element after animation
    setTimeout(() => {
        if (glassShatter.parentNode) {
            glassShatter.parentNode.removeChild(glassShatter);
        }
    }, 1500);
}

function createGlassFragment(container, index) {
    const fragment = document.createElement('div');
    fragment.className = 'glass-fragment';
    
    // Random positioning and size
    const size = Math.random() * 100 + 50;
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    // Random movement direction
    const moveX = (Math.random() - 0.5) * 1000;
    const moveY = (Math.random() - 0.5) * 1000;
    
    fragment.style.width = `${size}px`;
    fragment.style.height = `${size}px`;
    fragment.style.left = `${startX}px`;
    fragment.style.top = `${startY}px`;
    fragment.style.setProperty('--tx', `${moveX}px`);
    fragment.style.setProperty('--ty', `${moveY}px`);
    fragment.style.animationDelay = `${index * 0.05}s`;
    
    container.appendChild(fragment);
}

function handleSectionClick(event) {
    const sectionType = event.currentTarget.getAttribute('data-section');
    
    // Add loading state
    event.currentTarget.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        navigateToSection(sectionType);
    }, 200);
}

function navigateToSection(sectionType) {
    let targetUrl = '';
    
    switch (sectionType) {
        case 'naf-history':
            targetUrl = './1972-1990/index.html';
            break;
        case 'nafsfa-history':
            targetUrl = './2003-2010/index.html';
            break;
        case 'finance-evolution':
            targetUrl = './2014-2018/index.html';
            break;
        default:
            console.error('Unknown section type:', sectionType);
            return;
    }
    
    // Navigate to the target page
    window.location.href = targetUrl;
}

// Add some interactive effects
function addInteractiveEffects() {
    // Add mouse move effect to welcome screen
    if (welcomeScreen) {
        welcomeScreen.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const x = (clientX / innerWidth - 0.5) * 20;
            const y = (clientY / innerHeight - 0.5) * 20;
            
            const welcomeContent = document.querySelector('.welcome-content');
            if (welcomeContent) {
                welcomeContent.style.transform = `translate(${x}px, ${y}px)`;
            }
        });
    }

    // Add hover sound effect simulation (visual feedback)
    sectionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 25px 60px rgba(196, 30, 58, 0.4)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        });
    });
}

// Initialize interactive effects
addInteractiveEffects();

// Handle browser back button
window.addEventListener('popstate', () => {
    // If user navigates back, show welcome screen
    if (mainScreen.classList.contains('active')) {
        mainScreen.classList.remove('active');
        welcomeScreen.classList.remove('hidden');
    }
});

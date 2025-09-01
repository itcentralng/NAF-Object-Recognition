"use strict";

// Socket.IO Connection
const socket = io('http://127.0.0.1:5550');

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const mainScreen = document.getElementById('main-screen');
let objectItems = [];
let interactionEnabled = false; // Disable interactions by default
let sectionData = null; // Store loaded section data

// Object categories mapped to socket events
const objectCategories = [
    {
        id: 'aircraft',
        title: 'Aircraft Models', 
        description: 'Explore various military aircraft used by the Nigerian Air Force',
        category: 'Military Equipment',
        image: 'images/Rectangle 23-aircraft.png',
        socketValue: 'naf',
        targetSection: 'naf-history'
    },
    {
        id: 'documents',
        title: 'Historical Documents',
        description: 'Official records and important documents from NAF history',
        category: 'Archives',
        image: 'images/Rectangle 5.png',
        socketValue: 'naf',
        targetSection: 'naf-history'
    },
    {
        id: 'uniforms',
        title: 'Military Uniforms',
        description: 'Evolution of NAF uniforms through different eras',
        category: 'Artifacts',
        image: 'images/Rectangle 1.png',
        socketValue: 'naf',
        targetSection: 'naf-history'
    },
    {
        id: 'badges',
        title: 'Insignia & Badges',
        description: 'Military ranks, badges, and ceremonial insignia',
        category: 'Regalia',
        image: 'images/Rectangle 14.png',
        socketValue: 'nafsfa',
        targetSection: 'nafsfa-history'
    },
    {
        id: 'equipment',
        title: 'Training Equipment',
        description: 'Educational and training tools used at NAFSFA',
        category: 'Education',
        image: 'images/Rectangle 32.png',
        socketValue: 'nafsfa',
        targetSection: 'nafsfa-history'
    },
    {
        id: 'technology',
        title: 'Modern Technology',
        description: 'Advanced systems and digital innovations in NAF operations',
        category: 'Innovation',
        image: 'images/2024.png',
        socketValue: 'evol',
        targetSection: 'finance-evolution'
    }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupSocketListeners();
});

// Socket.IO Event Listeners
function setupSocketListeners() {
    // Listen for object_picked events from Python backend
    socket.on('object_picked', function(data) {
        console.log('Object picked via socket:', data.object);
        interactionEnabled = false; // Disable interactions on main page until object is handled
        
        // Find the corresponding object category
        const selectedObject = objectCategories.find(obj => obj.socketValue === data.object);
        
        if (selectedObject) {
            // Navigate to section immediately
            navigateToSection(selectedObject.targetSection, selectedObject.id);
        }
    });
    
    // Listen for object_dropped events - return to main page
    socket.on('object_dropped', function(data) {
        console.log('Object dropped via socket:', data.message);
        interactionEnabled = true; // Re-enable interactions when back to main
        
        // If we're not already on the main page, navigate back immediately
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    });
    
    // Handle no object detected - gentle feedback without navigation
    socket.on('no_object_detected', function(data) {
        console.log('No object detected:', data.message);
        // No visual feedback needed - system continues waiting
    });

    // Handle socket connection events
    socket.on('connect', function() {
        console.log('Connected to Socket.IO server');
        interactionEnabled = true; // Enable interactions when connected
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from Socket.IO server');
        interactionEnabled = false; // Disable interactions when disconnected
    });
    
    // Handle any socket errors
    socket.on('error', function(error) {
        console.error('Socket.IO error:', error);
    });
}

async function initializeApp() {
    // Load section data for logo management
    await loadSectionData();
    
    // Create floating particles
    createFloatingParticles();
    
    // Auto-transition to main screen after 3 seconds
    setTimeout(() => {
        handleEnterMuseum();
    }, 3000);
}

// Load section data from JSON file
async function loadSectionData() {
    try {
        const response = await fetch('data.json');
        sectionData = await response.json();
        console.log('Section data loaded successfully');
    } catch (error) {
        console.error('Error loading section data:', error);
        // Fallback to default behavior if data can't be loaded
    }
}

// Utility function for smooth transition indicators
function createSmoothIndicator(message, type = 'info', duration = 3000) {
    const indicator = document.createElement('div');
    indicator.className = `smooth-indicator ${type}`;
    indicator.textContent = message;
    
    document.body.appendChild(indicator);
    
    // Slide in
    setTimeout(() => {
        indicator.classList.add('visible');
    }, 100);
    
    // Slide out and remove
    setTimeout(() => {
        indicator.classList.remove('visible');
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }, duration);
    
    return indicator;
}

// Object loading functionality removed - interaction is socket-only
/*
async function loadObjects() {
    try {
        const objectsContainer = document.getElementById('objects-grid');
        let objectsHTML = '';
        
        objectCategories.forEach((object, index) => {
            objectsHTML += `
                <div class="object-item" data-object="${object.id}" data-section="${object.targetSection}" data-socket-value="${object.socketValue}">
                    <div class="object-image-container">
                        <img src="${object.image}" alt="${object.title}" class="object-image">
                    </div>
                    <div class="object-content">
                        <h3>${object.title}</h3>
                        <p>${object.description}</p>
                        <span class="object-category">${object.category}</span>
                    </div>
                    <div class="socket-indicator">
                        <span class="socket-label">Socket: ${object.socketValue}</span>
                    </div>
                </div>
            `;
        });
        
        objectsContainer.innerHTML = objectsHTML;
        
        // Re-query object items after dynamic loading
        objectItems = document.querySelectorAll('.object-item');
        
        // Add object item event listeners (for manual testing)
        objectItems.forEach(item => {
            item.addEventListener('click', handleObjectClick);
            
            // Add mouse enter/leave effects
            item.addEventListener('mouseenter', (e) => {
                createRippleEffect(e.currentTarget);
            });
        });
        
        // Add interactive effects
        addInteractiveEffects();
        
    } catch (error) {
        console.error('Error loading objects:', error);
        document.getElementById('objects-grid').innerHTML = 
            '<div class="error-message"><p>Error loading objects. Please refresh the page.</p></div>';
    }
}
*/

function createFloatingParticles() {
    const particlesContainer = document.getElementById('particles-container');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            createParticle(particlesContainer);
        }, i * 200);
    }
    
    // Create new particles periodically
    setInterval(() => {
        if (mainScreen.classList.contains('active')) {
            createParticle(particlesContainer);
        }
    }, 3000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random horizontal position
    const startX = Math.random() * window.innerWidth;
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

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(196, 30, 58, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'rippleEffect 0.6s linear';
    ripple.style.pointerEvents = 'none';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.marginLeft = -size / 2 + 'px';
    ripple.style.marginTop = -size / 2 + 'px';
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
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
    const fragmentCount = 25;
    
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
    const size = Math.random() * 120 + 60;
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    // Random movement direction
    const moveX = (Math.random() - 0.5) * 1200;
    const moveY = (Math.random() - 0.5) * 1200;
    
    fragment.style.width = `${size}px`;
    fragment.style.height = `${size}px`;
    fragment.style.left = `${startX}px`;
    fragment.style.top = `${startY}px`;
    fragment.style.setProperty('--tx', `${moveX}px`);
    fragment.style.setProperty('--ty', `${moveY}px`);
    fragment.style.animationDelay = `${index * 0.03}s`;
    
    container.appendChild(fragment);
}

// Manual object clicking disabled - socket-only interaction
/*
function handleObjectClick(event) {
    const objectId = event.currentTarget.getAttribute('data-object');
    const sectionType = event.currentTarget.getAttribute('data-section');
    const socketValue = event.currentTarget.getAttribute('data-socket-value');
    
    console.log('Manual object click:', objectId, 'Socket value:', socketValue);
    
    // Add selection animation
    event.currentTarget.style.transform = 'scale(0.9)';
    event.currentTarget.style.filter = 'brightness(1.3)';
    
    // Create selection burst effect
    createSelectionBurst(event.currentTarget);
    
    setTimeout(() => {
        navigateToSection(sectionType, objectId);
    }, 800);
}
*/

function createSelectionBurst(element) {
    const burstCount = 8;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < burstCount; i++) {
        const burst = document.createElement('div');
        burst.style.position = 'fixed';
        burst.style.width = '8px';
        burst.style.height = '8px';
        burst.style.background = '#c41e3a';
        burst.style.borderRadius = '50%';
        burst.style.left = centerX + 'px';
        burst.style.top = centerY + 'px';
        burst.style.pointerEvents = 'none';
        burst.style.zIndex = '9999';
        
        const angle = (i / burstCount) * 2 * Math.PI;
        const distance = 150;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        burst.style.animation = `burstOut 0.8s ease-out forwards`;
        burst.style.setProperty('--endX', endX + 'px');
        burst.style.setProperty('--endY', endY + 'px');
        
        document.body.appendChild(burst);
        
        setTimeout(() => {
            if (burst.parentNode) {
                burst.parentNode.removeChild(burst);
            }
        }, 800);
    }
}

function navigateToSection(sectionType, objectId) {
    // Update header logo based on the selected section before navigation
    updateHeaderLogoForSection(sectionType);
    
    // Navigate to the section viewer with both section and object parameters
    window.location.href = `section.html?section=${sectionType}&object=${objectId}`;
}

function updateHeaderLogoForSection(sectionType) {
    if (!sectionData) return;
    
    // Find the section data that matches the target section
    const section = sectionData.sections.find(s => s.id === sectionType);
    if (section && section.logo) {
        // Update the header logo
        const headerLogo = document.querySelector('.header-logo');
        if (headerLogo) {
            headerLogo.src = section.logo;
        }
        
        // Update the welcome screen logo as well
        const welcomeLogo = document.querySelector('.logo-container img');
        if (welcomeLogo) {
            welcomeLogo.src = section.logo;
        }
    }
}

// Add some interactive effects
function addInteractiveEffects() {
    // Add mouse move effect to welcome screen
    if (welcomeScreen) {
        welcomeScreen.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const x = (clientX / innerWidth - 0.5) * 30;
            const y = (clientY / innerHeight - 0.5) * 30;
            
            const welcomeContent = document.querySelector('.welcome-content');
            if (welcomeContent) {
                welcomeContent.style.transform = `translate(${x}px, ${y}px)`;
            }
        });
    }

    // Object item interactions removed - socket-only interface
}

// Add necessary CSS animations
const additionalStyles = `
@keyframes rippleEffect {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

@keyframes burstOut {
    0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(var(--endX), var(--endY)) scale(0);
        opacity: 0;
    }
}

.selected-via-socket {
    outline: 3px solid #c41e3a;
    outline-offset: 5px;
    animation: socketSelection 2s ease-in-out;
}

@keyframes socketSelection {
    0%, 100% { outline-color: #c41e3a; }
    50% { outline-color: #ff4444; }
}

.socket-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(196, 30, 58, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7em;
    font-weight: bold;
}

.object-item {
    position: relative;
    transition: opacity 0.3s ease;
}

.object-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.interaction-disabled-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
}

.disabled-message {
    background: rgba(196, 30, 58, 0.95);
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: bold;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Handle browser back button
window.addEventListener('popstate', () => {
    // If user navigates back, show welcome screen
    if (mainScreen.classList.contains('active')) {
        mainScreen.classList.remove('active');
        welcomeScreen.classList.remove('hidden');
    }
});

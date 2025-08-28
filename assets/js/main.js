"use strict";

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const mainScreen = document.getElementById('main-screen');
let objectItems = [];

// Object categories with representative images from the sections
const objectCategories = [
    {
        id: 'aircraft',
        title: 'Aircraft Models',
        description: 'Explore various military aircraft used by the Nigerian Air Force',
        category: 'Military Equipment',
        image: 'images/Rectangle 23-aircraft.png',
        targetSection: 'naf-history'
    },
    {
        id: 'documents',
        title: 'Historical Documents',
        description: 'Official records and important documents from NAF history',
        category: 'Archives',
        image: 'images/Rectangle 5.png',
        targetSection: 'naf-history'
    },
    {
        id: 'uniforms',
        title: 'Military Uniforms',
        description: 'Evolution of NAF uniforms through different eras',
        category: 'Artifacts',
        image: 'images/Rectangle 1.png',
        targetSection: 'naf-history'
    },
    {
        id: 'badges',
        title: 'Insignia & Badges',
        description: 'Military ranks, badges, and ceremonial insignia',
        category: 'Regalia',
        image: 'images/Rectangle 14.png',
        targetSection: 'nafsfa-history'
    },
    {
        id: 'equipment',
        title: 'Training Equipment',
        description: 'Educational and training tools used at NAFSFA',
        category: 'Education',
        image: 'images/Rectangle 32.png',
        targetSection: 'nafsfa-history'
    },
    {
        id: 'technology',
        title: 'Modern Technology',
        description: 'Advanced systems and digital innovations in NAF operations',
        category: 'Innovation',
        image: 'images/2024.png',
        targetSection: 'finance-evolution'
    }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Load objects for selection
    await loadObjects();
    
    // Create floating particles
    createFloatingParticles();
    
    // Auto-transition to main screen after 3 seconds
    setTimeout(() => {
        handleEnterMuseum();
    }, 3000);
}

async function loadObjects() {
    try {
        const objectsContainer = document.getElementById('objects-grid');
        let objectsHTML = '';
        
        objectCategories.forEach((object, index) => {
            objectsHTML += `
                <div class="object-item" data-object="${object.id}" data-section="${object.targetSection}">
                    <div class="object-image-container">
                        <img src="${object.image}" alt="${object.title}" class="object-image">
                    </div>
                    <div class="object-content">
                        <h3>${object.title}</h3>
                        <p>${object.description}</p>
                        <span class="object-category">${object.category}</span>
                    </div>
                </div>
            `;
        });
        
        objectsContainer.innerHTML = objectsHTML;
        
        // Re-query object items after dynamic loading
        objectItems = document.querySelectorAll('.object-item');
        
        // Add object item event listeners
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

function handleObjectClick(event) {
    const objectId = event.currentTarget.getAttribute('data-object');
    const sectionType = event.currentTarget.getAttribute('data-section');
    
    // Add selection animation
    event.currentTarget.style.transform = 'scale(0.9)';
    event.currentTarget.style.filter = 'brightness(1.3)';
    
    // Create selection burst effect
    createSelectionBurst(event.currentTarget);
    
    setTimeout(() => {
        navigateToSection(sectionType, objectId);
    }, 800);
}

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
    // Navigate to the section viewer with both section and object parameters
    window.location.href = `section.html?section=${sectionType}&object=${objectId}`;
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

    // Add parallax effect to object items
    objectItems.forEach((item, index) => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px) scale(1.05)`;
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
        });
    });
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

/**
 * Morph UI - User Interface Logic for Image Morphing
 * Handles image uploads, validation, and morph button events
 */
import { ParticleEngine } from './src/ParticleEngine.js';

// State management
let image1 = null;
let image2 = null;
let engine = null;
let currentImageIndex = 0; // 0 = image1, 1 = image2

// DOM elements
const image1Input = document.getElementById('image1Input');
const image2Input = document.getElementById('image2Input');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const morphButton = document.getElementById('morphButton');
const statusMessage = document.getElementById('statusMessage');
const canvas = document.getElementById('canvas');

/**
 * Display status message
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

/**
 * Validate and enable/disable morph button
 */
function validateInputs() {
    const bothImagesLoaded = image1 !== null && image2 !== null;
    morphButton.disabled = !bothImagesLoaded;
    
    if (bothImagesLoaded && !engine) {
        showStatus('Both images loaded! Click "Morph" to start the transition.', 'success');
    }
}

/**
 * Handle image file selection
 */
function handleImageUpload(event, previewContainer, imageIndex) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showStatus('Please select a valid image file.', 'error');
        return;
    }

    // Create image element
    const img = new Image();
    
    img.onload = function() {
        // Store the loaded image
        if (imageIndex === 1) {
            image1 = img;
            console.log('[MorphUI] Image 1 loaded:', img.width, 'x', img.height);
        } else {
            image2 = img;
            console.log('[MorphUI] Image 2 loaded:', img.width, 'x', img.height);
        }
        
        // Update preview
        previewContainer.innerHTML = '';
        const previewImg = document.createElement('img');
        previewImg.src = img.src;
        previewContainer.appendChild(previewImg);
        
        // Validate inputs
        validateInputs();
    };
    
    img.onerror = function() {
        showStatus('Failed to load image. Please try another file.', 'error');
    };
    
    // Read and load the image
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Initialize WebGL particle engine
 */
function initializeEngine() {
    try {
        console.log('[MorphUI] Initializing particle engine...');
        
        engine = new ParticleEngine(canvas, {
            particleCount: 2000,
            speed: 1.0,
            autoResize: false
        });
        
        console.log('[MorphUI] Engine initialized successfully');
        return true;
    } catch (error) {
        console.error('[MorphUI] Failed to initialize engine:', error);
        showStatus('Failed to initialize WebGL. Please check browser support.', 'error');
        return false;
    }
}

/**
 * Handle morph button click
 */
function handleMorphClick() {
    console.log('[MorphUI] Morph button clicked');
    
    if (!image1 || !image2) {
        showStatus('Please upload both images first.', 'error');
        return;
    }
    
    // Initialize engine on first click
    if (!engine) {
        if (!initializeEngine()) {
            return;
        }
        
        // Initialize particles from first image
        console.log('[MorphUI] Initializing particles from Image 1...');
        engine.initializeFromImage(image1);
        engine.start();
        currentImageIndex = 0;
        
        showStatus('Particles initialized from Image 1. Click "Morph" again to transition!', 'success');
        return;
    }
    
    // Toggle between images
    if (currentImageIndex === 0) {
        console.log('[MorphUI] Transitioning to Image 2...');
        showStatus('Morphing to Image 2...', 'info');
        engine.transitionToImage(image2, 2000);
        currentImageIndex = 1;
        
        setTimeout(() => {
            showStatus('Transition to Image 2 complete! Click "Morph" to go back.', 'success');
        }, 2100);
    } else {
        console.log('[MorphUI] Transitioning back to Image 1...');
        showStatus('Morphing back to Image 1...', 'info');
        engine.transitionToImage(image1, 2000);
        currentImageIndex = 0;
        
        setTimeout(() => {
            showStatus('Transition to Image 1 complete! Click "Morph" to switch again.', 'success');
        }, 2100);
    }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Image upload handlers
    image1Input.addEventListener('change', (e) => handleImageUpload(e, preview1, 1));
    image2Input.addEventListener('change', (e) => handleImageUpload(e, preview2, 2));
    
    // Morph button handler
    morphButton.addEventListener('click', handleMorphClick);
    
    console.log('[MorphUI] Event listeners initialized');
}

/**
 * Initialize the application
 */
function init() {
    console.log('[MorphUI] Initializing Morph UI...');
    
    // Set canvas size
    canvas.width = 1000;
    canvas.height = 600;
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Show initial message
    showStatus('Upload two images to begin the morphing experience.', 'info');
    
    console.log('[MorphUI] Initialization complete');
}

// Start the application
init();

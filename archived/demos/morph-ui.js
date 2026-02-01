/**
 * Morph UI - Dedicated Image Morphing Interface
 * 
 * This module provides a streamlined, image-focused interface for creating
 * seamless particle-based transitions between two images. It is specifically
 * designed to handle only image-to-image morphing, without extending to
 * other website elements like pages, menus, or sections.
 * 
 * Key Features:
 * - Image upload and validation
 * - WebGL particle initialization from images
 * - Smooth bidirectional transitions between two images
 * - Real-time status feedback
 * 
 * Workflow:
 * 1. User uploads two images
 * 2. First click initializes particles from Image 1
 * 3. Subsequent clicks toggle smooth transitions between the images
 */
import { ParticleEngine } from './webgl-engine.js';

// ============================================================================
// Configuration Constants
// ============================================================================
const PARTICLE_COUNT = 2000;           // Optimized for detailed image representation
const TRANSITION_DURATION = 2000;      // Milliseconds for smooth image morphing
const STATUS_UPDATE_DELAY = 2100;      // Delay for status message after transition

// ============================================================================
// State Management - Image Morphing Only
// ============================================================================
// This application maintains state for exactly two images and tracks which
// image is currently displayed. No pattern-based states are maintained.
let image1 = null;                  // First uploaded image
let image2 = null;                  // Second uploaded image
let engine = null;                  // WebGL particle engine instance
let currentImageIndex = 0;          // Current display: 0 = image1, 1 = image2

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
        // Store the loaded image based on imageIndex (1 or 2)
        if (imageIndex === 1) {
            image1 = img;
            console.log('[MorphUI] Image 1 loaded:', img.width, 'x', img.height);
        } else if (imageIndex === 2) {
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
 * Initialize WebGL particle engine optimized for image morphing
 * 
 * Configuration uses constants defined at module level for consistency:
 * - PARTICLE_COUNT (2000) for detailed image representation
 * - Speed 1.0 for smooth, natural transitions
 * - autoResize disabled to maintain consistent image aspect ratios
 */
function initializeEngine() {
    try {
        console.log('[MorphUI] Initializing particle engine for image morphing...');
        
        engine = new ParticleEngine(canvas, {
            particleCount: PARTICLE_COUNT,  // Use constant for consistency
            speed: 1.0,                     // Balanced speed for smooth transitions
            autoResize: false               // Fixed size to preserve image aspect ratios
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
 * Handle morph button click - Core image transition logic
 * 
 * This function orchestrates the image morphing workflow:
 * 1. First click: Initialize particles from Image 1
 * 2. Subsequent clicks: Toggle between Image 1 and Image 2
 * 
 * All transitions use a 2000ms duration for smooth, visually appealing morphs.
 * The function only handles image-to-image transitions, never patterns.
 */
function handleMorphClick() {
    console.log('[MorphUI] Morph button clicked');
    
    // Safety check: ensure both images are loaded
    if (!image1 || !image2) {
        showStatus('Please upload both images first.', 'error');
        return;
    }
    
    // First-time initialization: Create engine and load Image 1
    if (!engine) {
        if (!initializeEngine()) {
            return;
        }
        
        console.log('[MorphUI] Initializing particles from Image 1...');
        engine.initializeFromImage(image1);
        engine.start();
        currentImageIndex = 0;
        
        showStatus('Particles initialized from Image 1. Click "Morph" again to transition!', 'success');
        return;
    }
    
    // Toggle between the two images with smooth transitions
    if (currentImageIndex === 0) {
        // Transition from Image 1 to Image 2
        console.log('[MorphUI] Transitioning to Image 2...');
        showStatus('Morphing to Image 2...', 'info');
        engine.transitionToImage(image2, TRANSITION_DURATION);
        currentImageIndex = 1;
        
        setTimeout(() => {
            showStatus('Transition to Image 2 complete! Click "Morph" to go back.', 'success');
        }, STATUS_UPDATE_DELAY);
    } else {
        // Transition from Image 2 back to Image 1
        console.log('[MorphUI] Transitioning back to Image 1...');
        showStatus('Morphing back to Image 1...', 'info');
        engine.transitionToImage(image1, TRANSITION_DURATION);
        currentImageIndex = 0;
        
        setTimeout(() => {
            showStatus('Transition to Image 1 complete! Click "Morph" to switch again.', 'success');
        }, STATUS_UPDATE_DELAY);
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

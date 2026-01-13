/**
 * Triangulation Demo UI
 * Interactive demo showcasing hybrid particle + triangulation morphing
 */
import { HybridEngine } from './src/HybridEngine.js';

// State
let engine = null;
let image1 = null;
let image2 = null;
let currentImageIndex = 0;

// DOM Elements
const canvas = document.getElementById('canvas');
const image1Input = document.getElementById('image1Input');
const image2Input = document.getElementById('image2Input');
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const morphButton = document.getElementById('morphButton');
const statusMessage = document.getElementById('statusMessage');

// Mode buttons
const modeParticles = document.getElementById('modeParticles');
const modeTriangulation = document.getElementById('modeTriangulation');
const modeHybrid = document.getElementById('modeHybrid');

// Settings
const gridSizeInput = document.getElementById('gridSize');
const gridSizeValue = document.getElementById('gridSizeValue');
const keyPointMethodSelect = document.getElementById('keyPointMethod');
const particleOpacityInput = document.getElementById('particleOpacity');
const particleOpacityValue = document.getElementById('particleOpacityValue');

// Info display
const fpsValue = document.getElementById('fpsValue');
const particleCount = document.getElementById('particleCount');
const triangleCount = document.getElementById('triangleCount');
const currentMode = document.getElementById('currentMode');

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
}

/**
 * Update info display
 */
function updateInfo() {
    if (!engine) return;
    
    fpsValue.textContent = engine.getFPS();
    particleCount.textContent = engine.getParticleCount();
    
    const config = engine.getTriangulationConfig();
    const morphData = engine.triangulationMorph ? 
        engine.triangulationMorph.getTriangulationData() : null;
    triangleCount.textContent = morphData ? morphData.triangles.length : 0;
    
    currentMode.textContent = config.mode.charAt(0).toUpperCase() + config.mode.slice(1);
    
    requestAnimationFrame(updateInfo);
}

/**
 * Handle image upload
 */
function handleImageUpload(event, previewContainer, imageIndex) {
    const file = event.target.files[0];
    
    if (!file || !file.type.startsWith('image/')) {
        showStatus('Please select a valid image file', 'error');
        return;
    }
    
    const img = new Image();
    
    img.onload = function() {
        if (imageIndex === 1) {
            image1 = img;
            console.log('[Demo] Image 1 loaded:', img.width, 'x', img.height);
        } else {
            image2 = img;
            console.log('[Demo] Image 2 loaded:', img.width, 'x', img.height);
        }
        
        // Update preview
        previewContainer.innerHTML = '';
        const previewImg = document.createElement('img');
        previewImg.src = img.src;
        previewContainer.appendChild(previewImg);
        
        // Enable morph button if both images loaded
        if (image1 && image2) {
            morphButton.disabled = false;
            showStatus('Both images loaded! Click "Start Morph" to begin', 'success');
        }
    };
    
    img.onerror = function() {
        showStatus('Failed to load image', 'error');
    };
    
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Initialize engine with current settings
 */
function initializeEngine() {
    if (engine) {
        engine.destroy();
    }
    
    const gridSize = parseInt(gridSizeInput.value);
    const keyPointMethod = keyPointMethodSelect.value;
    const particleOpacity = parseInt(particleOpacityInput.value) / 100;
    
    try {
        engine = new HybridEngine(canvas, {
            particleCount: 2000,
            speed: 1.0,
            autoResize: false,
            enableTriangulation: true,
            triangulationMode: 'hybrid',
            keyPointMethod: keyPointMethod,
            gridSize: gridSize,
            particleOpacity: particleOpacity
        });
        
        console.log('[Demo] Engine initialized');
        return true;
    } catch (error) {
        console.error('[Demo] Failed to initialize engine:', error);
        showStatus('Failed to initialize engine: ' + error.message, 'error');
        return false;
    }
}

/**
 * Handle morph button click
 */
function handleMorphClick() {
    if (!image1 || !image2) {
        showStatus('Please upload both images first', 'error');
        return;
    }
    
    // First click: initialize
    if (!engine) {
        if (!initializeEngine()) {
            return;
        }
        
        engine.initializeFromImage(image1);
        engine.start();
        currentImageIndex = 0;
        
        morphButton.textContent = 'Morph to Image 2';
        showStatus('Initialized from Image 1. Click to morph!', 'success');
        
        // Start info updates
        updateInfo();
        return;
    }
    
    // Toggle between images
    if (currentImageIndex === 0) {
        engine.transitionToImage(image2, 2000);
        currentImageIndex = 1;
        morphButton.textContent = 'Morph to Image 1';
        showStatus('Morphing to Image 2...', 'info');
        
        setTimeout(() => {
            showStatus('Transition complete!', 'success');
        }, 2100);
    } else {
        engine.transitionToImage(image1, 2000);
        currentImageIndex = 0;
        morphButton.textContent = 'Morph to Image 2';
        showStatus('Morphing to Image 1...', 'info');
        
        setTimeout(() => {
            showStatus('Transition complete!', 'success');
        }, 2100);
    }
}

/**
 * Handle mode button clicks
 */
function setRenderMode(mode) {
    if (!engine) {
        showStatus('Initialize engine first by uploading images and clicking Start Morph', 'info');
        return;
    }
    
    engine.setRenderMode(mode);
    
    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'particles') modeParticles.classList.add('active');
    if (mode === 'triangulation') modeTriangulation.classList.add('active');
    if (mode === 'hybrid') modeHybrid.classList.add('active');
    
    showStatus(`Render mode: ${mode}`, 'info');
}

/**
 * Handle grid size change
 */
function handleGridSizeChange() {
    const value = parseInt(gridSizeInput.value);
    gridSizeValue.textContent = value;
    
    if (engine) {
        engine.updateTriangulationConfig({ gridSize: value });
        showStatus('Grid size updated. Re-morph to see changes.', 'info');
    }
}

/**
 * Handle key point method change
 */
function handleMethodChange() {
    const method = keyPointMethodSelect.value;
    const methodValue = document.getElementById('methodValue');
    
    // Update displayed value
    if (methodValue) {
        methodValue.textContent = method.charAt(0).toUpperCase() + method.slice(1);
    }
    
    if (engine) {
        engine.updateTriangulationConfig({ keyPointMethod: method });
        showStatus(`Key point method: ${method}. Re-morph to see changes.`, 'info');
    }
}

/**
 * Handle particle opacity change
 */
function handleParticleOpacityChange() {
    const value = parseInt(particleOpacityInput.value);
    particleOpacityValue.textContent = value + '%';
    
    if (engine) {
        engine.updateTriangulationConfig({ particleOpacity: value / 100 });
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Image uploads
    image1Input.addEventListener('change', (e) => handleImageUpload(e, preview1, 1));
    image2Input.addEventListener('change', (e) => handleImageUpload(e, preview2, 2));
    
    // Morph button
    morphButton.addEventListener('click', handleMorphClick);
    
    // Mode buttons
    modeParticles.addEventListener('click', () => setRenderMode('particles'));
    modeTriangulation.addEventListener('click', () => setRenderMode('triangulation'));
    modeHybrid.addEventListener('click', () => setRenderMode('hybrid'));
    
    // Settings
    gridSizeInput.addEventListener('input', handleGridSizeChange);
    keyPointMethodSelect.addEventListener('change', handleMethodChange);
    particleOpacityInput.addEventListener('input', handleParticleOpacityChange);
    
    console.log('[Demo] Event listeners initialized');
}

/**
 * Initialize demo
 */
function init() {
    console.log('[Demo] Initializing Triangulation Demo...');
    
    canvas.width = 1000;
    canvas.height = 600;
    
    initEventListeners();
    
    console.log('[Demo] Demo ready');
}

// Start the demo
init();

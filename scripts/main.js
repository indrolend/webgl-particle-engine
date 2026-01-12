/**
 * Main Script for Debug Interface
 * Connects debug panel controls to the Particle Engine
 */
import { ParticleEngine } from '../src/ParticleEngine.js';

// Engine instance
let engine = null;

// Uploaded images storage
const uploadedImages = {
  1: null,
  2: null
};

// Debug log configuration
const maxLogEntries = 50;

/**
 * Initialize the debug interface
 */
export function initializeDebugInterface(canvas) {
  const logElement = document.getElementById('log');
  
  // Intercept console.log for debug display
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
    addLogEntry(args.join(' '));
  };

  const originalError = console.error;
  console.error = function(...args) {
    originalError.apply(console, args);
    addLogEntry('[ERROR] ' + args.join(' '), 'error');
  };

  const originalWarn = console.warn;
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    addLogEntry('[WARN] ' + args.join(' '), 'warn');
  };

  function addLogEntry(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    let color = '#0f0';
    if (type === 'error') color = '#f55';
    if (type === 'warn') color = '#fa0';
    
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-message" style="color: ${color}">${message}</span>`;
    
    logElement.insertBefore(entry, logElement.firstChild);
    
    // Keep only last N entries
    while (logElement.children.length > maxLogEntries) {
      logElement.removeChild(logElement.lastChild);
    }
  }

  // Update status display
  function updateStatus(status) {
    document.getElementById('status').textContent = status;
  }

  // Update info panel
  function updateInfo() {
    if (engine) {
      document.getElementById('particleCountDisplay').textContent = engine.getParticleCount();
      document.getElementById('fps').textContent = engine.getFPS();
    }
  }

  // Update info every 100ms
  setInterval(updateInfo, 100);

  // Range input handlers
  document.getElementById('particleCount').addEventListener('input', (e) => {
    document.getElementById('particleCountValue').textContent = e.target.value;
  });

  document.getElementById('speed').addEventListener('input', (e) => {
    document.getElementById('speedValue').textContent = parseFloat(e.target.value).toFixed(1);
  });

  // Export functions to global scope for button handlers
  window.initializeEngine = function() {
    try {
      if (engine) {
        console.log('Destroying existing engine...');
        engine.destroy();
      }

      const particleCount = parseInt(document.getElementById('particleCount').value);
      const speed = parseFloat(document.getElementById('speed').value);

      console.log(`Creating new engine with ${particleCount} particles, speed ${speed}...`);
      
      engine = new ParticleEngine(canvas, {
        particleCount: particleCount,
        speed: speed,
        autoResize: false
      });

      engine.initializeParticles('random');
      engine.start();
      
      updateStatus('Running');
      console.log('Engine initialized and started!');
    } catch (error) {
      console.error('Failed to initialize engine:', error.message);
      updateStatus('Error');
    }
  };

  window.initPattern = function(pattern) {
    try {
      if (!engine) {
        console.warn('Engine not initialized. Call Initialize Engine first.');
        return;
      }

      engine.initializeParticles(pattern);
      console.log(`Initialized with ${pattern} pattern`);
    } catch (error) {
      console.error('Failed to initialize pattern:', error.message);
    }
  };

  window.transition = function(pattern) {
    try {
      if (!engine) {
        console.warn('Engine not initialized. Call Initialize Engine first.');
        return;
      }

      engine.transition(pattern, 2000);
      console.log(`Transitioning to ${pattern}...`);
    } catch (error) {
      console.error('Failed to transition:', error.message);
    }
  };

  window.startEngine = function() {
    try {
      if (!engine) {
        console.warn('Engine not initialized. Call Initialize Engine first.');
        return;
      }

      engine.start();
      updateStatus('Running');
      console.log('Engine started');
    } catch (error) {
      console.error('Failed to start engine:', error.message);
    }
  };

  window.stopEngine = function() {
    try {
      if (!engine) {
        console.warn('Engine not initialized.');
        return;
      }

      engine.stop();
      updateStatus('Stopped');
      console.log('Engine stopped');
    } catch (error) {
      console.error('Failed to stop engine:', error.message);
    }
  };

  window.updateConfig = function() {
    try {
      if (!engine) {
        console.warn('Engine not initialized.');
        return;
      }

      const particleCount = parseInt(document.getElementById('particleCount').value);
      const speed = parseFloat(document.getElementById('speed').value);

      engine.updateConfig({
        particleCount: particleCount,
        speed: speed
      });

      console.log('Configuration updated');
    } catch (error) {
      console.error('Failed to update config:', error.message);
    }
  };

  window.clearLog = function() {
    logElement.innerHTML = '';
    console.log('Log cleared');
  };

  // Image upload handlers
  window.handleImageUpload = function(imageNum, event) {
    const file = event.target.files[0];
    
    if (!file) {
      console.warn(`No file selected for Image ${imageNum}`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error(`Invalid file type: ${file.type}. Please upload an image file.`);
      addLogEntry(`[ERROR] Invalid file type: ${file.type}. Please upload an image file.`, 'error');
      return;
    }

    console.log(`Loading Image ${imageNum}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        // Store the image
        uploadedImages[imageNum] = img;
        
        // Update preview
        const previewDiv = document.getElementById(`image${imageNum}Preview`);
        previewDiv.innerHTML = `
          <img src="${e.target.result}" alt="Image ${imageNum}">
          <div class="image-info">${img.width}x${img.height}px</div>
        `;
        previewDiv.classList.add('active');
        
        // Enable appropriate button
        if (imageNum === 1) {
          document.getElementById('initImage1Btn').disabled = false;
        } else {
          document.getElementById('transitionImage2Btn').disabled = false;
        }
        
        console.log(`Image ${imageNum} loaded successfully: ${img.width}x${img.height}px`);
      };
      
      img.onerror = function() {
        console.error(`Failed to load Image ${imageNum}`);
        addLogEntry(`[ERROR] Failed to load Image ${imageNum}. Please try a different file.`, 'error');
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      console.error(`Failed to read file for Image ${imageNum}`);
      addLogEntry(`[ERROR] Failed to read file for Image ${imageNum}. Please try again.`, 'error');
    };
    
    reader.readAsDataURL(file);
  };

  window.initFromImage = function(imageNum) {
    try {
      const image = uploadedImages[imageNum];
      
      if (!image) {
        console.warn(`Image ${imageNum} not loaded`);
        return;
      }

      if (!engine) {
        console.log('Engine not initialized, creating new engine...');
        initializeEngine();
      }

      console.log(`Initializing particles from Image ${imageNum}...`);
      engine.initializeFromImage(image);
      console.log('Particles initialized from image');
    } catch (error) {
      console.error('Failed to initialize from image:', error.message);
    }
  };

  window.transitionToImage = function(imageNum) {
    try {
      if (!engine) {
        console.warn('Engine not initialized. Call Initialize Engine first.');
        return;
      }

      const image = uploadedImages[imageNum];
      
      if (!image) {
        console.warn(`Image ${imageNum} not loaded`);
        return;
      }

      console.log(`Transitioning to Image ${imageNum}...`);
      engine.transitionToImage(image, 2000);
    } catch (error) {
      console.error('Failed to transition to image:', error.message);
    }
  };

  // Initial log message
  addLogEntry('Debug panel loaded. Click "Initialize Engine" to start.');
  
  return engine;
}

// Export for use in module scripts
export { uploadedImages };

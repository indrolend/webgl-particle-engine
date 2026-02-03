/**
 * HybridDebugPanel - Debug UI for jelly mesh transitions
 * 
 * Features:
 * - Real-time control of mesh detail, explosion intensity, break chance
 * - FPS and mesh complexity display
 * - Manual trigger controls
 * - Preset management
 */

export class HybridDebugPanel {
  constructor(container = null) {
    this.container = container || document.body;
    this.panel = null;
    this.controls = {};
    this.callbacks = {};
    this.statsUpdateInterval = null;
    
    this.createPanel();
    
    console.log('[HybridDebugPanel] Initialized');
  }
  
  /**
   * Create debug panel UI
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'hybrid-debug-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.92);
      color: #fff;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(102, 126, 234, 0.3);
    `;
    
    this.panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
        <h3 style="margin: 0; font-size: 16px; color: #667eea;">Jelly Mesh Debug</h3>
        <button id="debug-panel-toggle" style="background: #667eea; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Hide</button>
      </div>
      
      <!-- Stats Section -->
      <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 8px; color: #8B9DC3;">Statistics</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
          <div>FPS: <span id="debug-fps" style="color: #667eea; font-weight: bold;">0</span></div>
          <div>Vertices: <span id="debug-vertices" style="color: #667eea; font-weight: bold;">0</span></div>
          <div>Triangles: <span id="debug-triangles" style="color: #667eea; font-weight: bold;">0</span></div>
          <div>Broken Edges: <span id="debug-broken-edges" style="color: #667eea; font-weight: bold;">0</span></div>
          <div>Pieces: <span id="debug-pieces" style="color: #667eea; font-weight: bold;">0</span></div>
          <div>Detail: <span id="debug-detail-level" style="color: #667eea; font-weight: bold;">100%</span></div>
        </div>
      </div>
      
      <!-- Mesh Detail Controls -->
      <div class="debug-control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Mesh Detail: <span id="debug-mesh-detail-value" style="color: #667eea;">50</span>%
        </label>
        <input type="range" id="debug-mesh-detail" min="0" max="100" value="50" style="width: 100%;">
      </div>
      
      <!-- Explosion Intensity -->
      <div class="debug-control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Explosion Intensity: <span id="debug-explosion-value" style="color: #667eea;">100</span>
        </label>
        <input type="range" id="debug-explosion" min="20" max="300" value="100" style="width: 100%;">
      </div>
      
      <!-- Edge Break Chance -->
      <div class="debug-control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Edge Break Chance: <span id="debug-break-chance-value" style="color: #667eea;">30</span>%
        </label>
        <input type="range" id="debug-break-chance" min="0" max="100" value="30" style="width: 100%;">
      </div>
      
      <!-- Spring Stiffness -->
      <div class="debug-control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Spring Stiffness: <span id="debug-spring-value" style="color: #667eea;">50</span>%
        </label>
        <input type="range" id="debug-spring" min="0" max="100" value="50" style="width: 100%;">
      </div>
      
      <!-- Vertex Count Range -->
      <div class="debug-control-group" style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Min Vertices: <span id="debug-min-vertices-value" style="color: #667eea;">20</span>
        </label>
        <input type="range" id="debug-min-vertices" min="10" max="100" value="20" style="width: 100%;">
      </div>
      
      <div class="debug-control-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 4px; color: #8B9DC3; font-weight: bold;">
          Max Vertices: <span id="debug-max-vertices-value" style="color: #667eea;">200</span>
        </label>
        <input type="range" id="debug-max-vertices" min="50" max="500" value="200" style="width: 100%;">
      </div>
      
      <!-- Action Buttons -->
      <div style="display: flex; gap: 8px; margin-bottom: 10px;">
        <button id="debug-trigger-transition" style="flex: 1; background: #667eea; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
          Trigger Transition
        </button>
        <button id="debug-reset" style="flex: 1; background: #764ba2; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">
          Reset
        </button>
      </div>
      
      <!-- Presets -->
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
        <label style="display: block; margin-bottom: 6px; color: #8B9DC3; font-weight: bold;">Presets</label>
        <select id="debug-presets" style="width: 100%; padding: 6px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; font-size: 11px;">
          <option value="default">Default</option>
          <option value="soft">Soft Body</option>
          <option value="stiff">Stiff Body</option>
          <option value="explosive">Explosive</option>
          <option value="gentle">Gentle</option>
        </select>
      </div>
      
      <!-- Status -->
      <div id="debug-status" style="margin-top: 12px; padding: 8px; background: rgba(102, 126, 234, 0.2); border-radius: 4px; font-size: 11px; text-align: center; color: #8B9DC3;">
        Ready
      </div>
    `;
    
    this.container.appendChild(this.panel);
    this.attachEventListeners();
    
    // Start stats update
    this.startStatsUpdate();
  }
  
  /**
   * Attach event listeners to controls
   */
  attachEventListeners() {
    // Toggle panel
    const toggleBtn = document.getElementById('debug-panel-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.togglePanel());
    }
    
    // Mesh detail slider
    const meshDetailSlider = document.getElementById('debug-mesh-detail');
    const meshDetailValue = document.getElementById('debug-mesh-detail-value');
    if (meshDetailSlider && meshDetailValue) {
      meshDetailSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        meshDetailValue.textContent = value;
        this.triggerCallback('meshDetail', value / 100);
      });
    }
    
    // Explosion intensity slider
    const explosionSlider = document.getElementById('debug-explosion');
    const explosionValue = document.getElementById('debug-explosion-value');
    if (explosionSlider && explosionValue) {
      explosionSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        explosionValue.textContent = value;
        this.triggerCallback('explosionIntensity', value);
      });
    }
    
    // Break chance slider
    const breakChanceSlider = document.getElementById('debug-break-chance');
    const breakChanceValue = document.getElementById('debug-break-chance-value');
    if (breakChanceSlider && breakChanceValue) {
      breakChanceSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        breakChanceValue.textContent = value;
        this.triggerCallback('edgeBreakChance', value / 100);
      });
    }
    
    // Spring stiffness slider
    const springSlider = document.getElementById('debug-spring');
    const springValue = document.getElementById('debug-spring-value');
    if (springSlider && springValue) {
      springSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        springValue.textContent = value;
        this.triggerCallback('springStiffness', value / 100);
      });
    }
    
    // Min vertices slider
    const minVerticesSlider = document.getElementById('debug-min-vertices');
    const minVerticesValue = document.getElementById('debug-min-vertices-value');
    if (minVerticesSlider && minVerticesValue) {
      minVerticesSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        minVerticesValue.textContent = value;
        this.triggerCallback('minVertexCount', value);
      });
    }
    
    // Max vertices slider
    const maxVerticesSlider = document.getElementById('debug-max-vertices');
    const maxVerticesValue = document.getElementById('debug-max-vertices-value');
    if (maxVerticesSlider && maxVerticesValue) {
      maxVerticesSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        maxVerticesValue.textContent = value;
        this.triggerCallback('maxVertexCount', value);
      });
    }
    
    // Trigger transition button
    const triggerBtn = document.getElementById('debug-trigger-transition');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.triggerCallback('triggerTransition');
      });
    }
    
    // Reset button
    const resetBtn = document.getElementById('debug-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.triggerCallback('reset');
      });
    }
    
    // Presets dropdown
    const presetsSelect = document.getElementById('debug-presets');
    if (presetsSelect) {
      presetsSelect.addEventListener('change', (e) => {
        this.applyPreset(e.target.value);
      });
    }
  }
  
  /**
   * Register callback for control changes
   */
  on(event, callback) {
    this.callbacks[event] = callback;
  }
  
  /**
   * Trigger callback
   */
  triggerCallback(event, value = null) {
    if (this.callbacks[event]) {
      this.callbacks[event](value);
    }
  }
  
  /**
   * Update statistics display
   */
  updateStats(stats) {
    const fpsEl = document.getElementById('debug-fps');
    const verticesEl = document.getElementById('debug-vertices');
    const trianglesEl = document.getElementById('debug-triangles');
    const brokenEdgesEl = document.getElementById('debug-broken-edges');
    const piecesEl = document.getElementById('debug-pieces');
    const detailLevelEl = document.getElementById('debug-detail-level');
    
    if (fpsEl && stats.fps !== undefined) {
      fpsEl.textContent = Math.round(stats.fps);
    }
    
    if (verticesEl && stats.vertices !== undefined) {
      verticesEl.textContent = stats.vertices;
    }
    
    if (trianglesEl && stats.triangles !== undefined) {
      trianglesEl.textContent = stats.triangles;
    }
    
    if (brokenEdgesEl && stats.brokenEdges !== undefined) {
      brokenEdgesEl.textContent = stats.brokenEdges;
    }
    
    if (piecesEl && stats.pieces !== undefined) {
      piecesEl.textContent = stats.pieces;
    }
    
    if (detailLevelEl && stats.detailLevel !== undefined) {
      detailLevelEl.textContent = Math.round(stats.detailLevel * 100) + '%';
    }
  }
  
  /**
   * Update status message
   */
  updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('debug-status');
    if (statusEl) {
      statusEl.textContent = message;
      
      // Change background color based on type
      const colors = {
        info: 'rgba(102, 126, 234, 0.2)',
        success: 'rgba(102, 234, 126, 0.2)',
        warning: 'rgba(234, 200, 102, 0.2)',
        error: 'rgba(234, 102, 102, 0.2)'
      };
      
      statusEl.style.background = colors[type] || colors.info;
    }
  }
  
  /**
   * Apply preset configuration
   */
  applyPreset(preset) {
    const presets = {
      default: {
        meshDetail: 50,
        explosionIntensity: 100,
        edgeBreakChance: 30,
        springStiffness: 50,
        minVertices: 20,
        maxVertices: 200
      },
      soft: {
        meshDetail: 60,
        explosionIntensity: 80,
        edgeBreakChance: 40,
        springStiffness: 30,
        minVertices: 20,
        maxVertices: 150
      },
      stiff: {
        meshDetail: 70,
        explosionIntensity: 120,
        edgeBreakChance: 20,
        springStiffness: 80,
        minVertices: 30,
        maxVertices: 250
      },
      explosive: {
        meshDetail: 40,
        explosionIntensity: 250,
        edgeBreakChance: 60,
        springStiffness: 40,
        minVertices: 15,
        maxVertices: 120
      },
      gentle: {
        meshDetail: 80,
        explosionIntensity: 50,
        edgeBreakChance: 10,
        springStiffness: 60,
        minVertices: 30,
        maxVertices: 300
      }
    };
    
    const config = presets[preset];
    if (!config) return;
    
    // Update UI controls
    this.setControlValue('debug-mesh-detail', config.meshDetail);
    this.setControlValue('debug-explosion', config.explosionIntensity);
    this.setControlValue('debug-break-chance', config.edgeBreakChance);
    this.setControlValue('debug-spring', config.springStiffness);
    this.setControlValue('debug-min-vertices', config.minVertices);
    this.setControlValue('debug-max-vertices', config.maxVertices);
    
    // Trigger callbacks
    this.triggerCallback('meshDetail', config.meshDetail / 100);
    this.triggerCallback('explosionIntensity', config.explosionIntensity);
    this.triggerCallback('edgeBreakChance', config.edgeBreakChance / 100);
    this.triggerCallback('springStiffness', config.springStiffness / 100);
    this.triggerCallback('minVertexCount', config.minVertices);
    this.triggerCallback('maxVertexCount', config.maxVertices);
    
    this.updateStatus(`Applied preset: ${preset}`, 'success');
  }
  
  /**
   * Set control value and update display
   */
  setControlValue(controlId, value) {
    const control = document.getElementById(controlId);
    const valueDisplay = document.getElementById(`${controlId}-value`);
    
    if (control) {
      control.value = value;
      if (valueDisplay) {
        valueDisplay.textContent = value;
      }
    }
  }
  
  /**
   * Toggle panel visibility
   */
  togglePanel() {
    const content = this.panel.querySelector('div');
    const toggleBtn = document.getElementById('debug-panel-toggle');
    
    if (this.panel.style.height === '40px') {
      this.panel.style.height = 'auto';
      if (toggleBtn) toggleBtn.textContent = 'Hide';
    } else {
      this.panel.style.height = '40px';
      this.panel.style.overflow = 'hidden';
      if (toggleBtn) toggleBtn.textContent = 'Show';
    }
  }
  
  /**
   * Start periodic stats update
   */
  startStatsUpdate() {
    this.statsUpdateInterval = setInterval(() => {
      this.triggerCallback('updateStats');
    }, 100);
  }
  
  /**
   * Stop stats update
   */
  stopStatsUpdate() {
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
      this.statsUpdateInterval = null;
    }
  }
  
  /**
   * Show panel
   */
  show() {
    if (this.panel) {
      this.panel.style.display = 'block';
    }
  }
  
  /**
   * Hide panel
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }
  
  /**
   * Destroy panel
   */
  destroy() {
    this.stopStatsUpdate();
    
    if (this.panel && this.panel.parentElement) {
      this.panel.parentElement.removeChild(this.panel);
    }
    
    this.callbacks = {};
    console.log('[HybridDebugPanel] Destroyed');
  }
}

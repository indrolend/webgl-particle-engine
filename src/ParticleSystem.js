/**
 * Particle System with Transition Support
 * Manages particles and their transitions between states
 */
export class ParticleSystem {
  constructor(config = {}) {
    this.particles = [];
    this.config = {
      particleCount: config.particleCount || 1000,
      speed: config.speed || 1.0,
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 8
    };
    
    this.width = 800;
    this.height = 600;
    this.isTransitioning = false;
    this.transitionProgress = 0;
    
    console.log('[ParticleSystem] Initialized with config:', this.config);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    console.log(`[ParticleSystem] Dimensions set to ${width}x${height}`);
  }

  createParticle(x, y, vx, vy, options = {}) {
    return {
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy || 0,
      r: options.r !== undefined ? options.r : Math.random(),
      g: options.g !== undefined ? options.g : Math.random(),
      b: options.b !== undefined ? options.b : Math.random(),
      alpha: options.alpha !== undefined ? options.alpha : 1.0,
      size: options.size || (this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize)),
      life: options.life !== undefined ? options.life : 1.0,
      targetX: x,
      targetY: y,
      targetR: options.r !== undefined ? options.r : Math.random(),
      targetG: options.g !== undefined ? options.g : Math.random(),
      targetB: options.b !== undefined ? options.b : Math.random()
    };
  }

  initializeRandom() {
    console.log(`[ParticleSystem] Initializing ${this.config.particleCount} random particles...`);
    
    this.particles = [];
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() - 0.5) * 2 * this.config.speed;
      
      this.particles.push(this.createParticle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        {
          r: Math.random() * 0.5 + 0.5,
          g: Math.random() * 0.5 + 0.3,
          b: Math.random() * 0.8 + 0.2
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles`);
  }

  initializeGrid() {
    console.log(`[ParticleSystem] Initializing particles in grid formation...`);
    
    this.particles = [];
    const cols = Math.ceil(Math.sqrt(this.config.particleCount));
    const rows = Math.ceil(this.config.particleCount / cols);
    const spacingX = this.width / (cols + 1);
    const spacingY = this.height / (rows + 1);
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = spacingX * (col + 1);
      const y = spacingY * (row + 1);
      
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: 0.3 + (col / cols) * 0.7,
          g: 0.5,
          b: 0.8 - (row / rows) * 0.5
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in ${cols}x${rows} grid`);
  }

  initializeCircle() {
    console.log(`[ParticleSystem] Initializing particles in circle formation...`);
    
    this.particles = [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const angle = (i / this.config.particleCount) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const hue = i / this.config.particleCount;
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: Math.abs(Math.cos(hue * Math.PI * 2)),
          g: Math.abs(Math.sin(hue * Math.PI * 2)),
          b: Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2))
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in circle formation`);
  }

  initializeSpiral() {
    console.log(`[ParticleSystem] Initializing particles in spiral formation...`);
    
    this.particles = [];
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    for (let i = 0; i < this.config.particleCount; i++) {
      const t = i / this.config.particleCount;
      const angle = t * Math.PI * 8; // 4 full rotations
      const radius = t * maxRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      this.particles.push(this.createParticle(
        x, y, 0, 0,
        {
          r: 0.8 - t * 0.4,
          g: 0.4 + t * 0.4,
          b: 0.9
        }
      ));
    }
    
    console.log(`[ParticleSystem] Created ${this.particles.length} particles in spiral formation`);
  }

  transitionToGrid(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to grid (${duration}ms)...`);
    
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionStartTime = Date.now();
    
    const cols = Math.ceil(Math.sqrt(this.particles.length));
    const rows = Math.ceil(this.particles.length / cols);
    const spacingX = this.width / (cols + 1);
    const spacingY = this.height / (rows + 1);
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      particle.targetX = spacingX * (col + 1);
      particle.targetY = spacingY * (row + 1);
      particle.targetR = 0.3 + (col / cols) * 0.7;
      particle.targetG = 0.5;
      particle.targetB = 0.8 - (row / rows) * 0.5;
    }
  }

  transitionToCircle(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to circle (${duration}ms)...`);
    
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionStartTime = Date.now();
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const angle = (i / this.particles.length) * Math.PI * 2;
      
      particle.targetX = centerX + Math.cos(angle) * radius;
      particle.targetY = centerY + Math.sin(angle) * radius;
      
      const hue = i / this.particles.length;
      particle.targetR = Math.abs(Math.cos(hue * Math.PI * 2));
      particle.targetG = Math.abs(Math.sin(hue * Math.PI * 2));
      particle.targetB = Math.abs(Math.cos(hue * Math.PI * 2 + Math.PI / 2));
    }
  }

  transitionToSpiral(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to spiral (${duration}ms)...`);
    
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionStartTime = Date.now();
    
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      const t = i / this.particles.length;
      const angle = t * Math.PI * 8;
      const radius = t * maxRadius;
      
      particle.targetX = centerX + Math.cos(angle) * radius;
      particle.targetY = centerY + Math.sin(angle) * radius;
      particle.targetR = 0.8 - t * 0.4;
      particle.targetG = 0.4 + t * 0.4;
      particle.targetB = 0.9;
    }
  }

  transitionToRandom(duration = 2000) {
    console.log(`[ParticleSystem] Starting transition to random (${duration}ms)...`);
    
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionDuration = duration;
    this.transitionStartTime = Date.now();
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      particle.targetX = Math.random() * this.width;
      particle.targetY = Math.random() * this.height;
      particle.targetR = Math.random() * 0.5 + 0.5;
      particle.targetG = Math.random() * 0.5 + 0.3;
      particle.targetB = Math.random() * 0.8 + 0.2;
    }
  }

  update(deltaTime) {
    // Update transition progress
    if (this.isTransitioning) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1);
      
      if (this.transitionProgress >= 1) {
        this.isTransitioning = false;
        console.log('[ParticleSystem] Transition complete');
      }
    }
    
    // Update particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (this.isTransitioning) {
        // Smooth easing function (ease-in-out)
        const t = this.easeInOutCubic(this.transitionProgress);
        
        // Interpolate position
        particle.x = particle.x + (particle.targetX - particle.x) * t * 0.1;
        particle.y = particle.y + (particle.targetY - particle.y) * t * 0.1;
        
        // Interpolate color
        particle.r = particle.r + (particle.targetR - particle.r) * t * 0.1;
        particle.g = particle.g + (particle.targetG - particle.g) * t * 0.1;
        particle.b = particle.b + (particle.targetB - particle.b) * t * 0.1;
      } else {
        // Free movement
        particle.x += particle.vx * deltaTime * this.config.speed;
        particle.y += particle.vy * deltaTime * this.config.speed;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > this.width) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(this.width, particle.x));
        }
        if (particle.y < 0 || particle.y > this.height) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(this.height, particle.y));
        }
      }
    }
  }

  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getParticles() {
    return this.particles;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[ParticleSystem] Config updated:', this.config);
  }
}

/**
 * AlienTransitionController - Unified state machine for liquid jelly transitions
 * 
 * Phases:
 * 1. staticDisplay - Show source image
 * 2. explosion - Mesh explodes from center of mass, springs can break
 * 3. snapBack - Mesh contracts to target layout, springs reconnect, colors morph
 * 4. complete - Show target image
 */

export class AlienTransitionController {
  constructor(config = {}) {
    this.config = {
      staticDisplayDuration: config.staticDisplayDuration || 500,
      explosionDuration: config.explosionDuration || 800,
      snapBackDuration: config.snapBackDuration || 2500,
      explosionIntensity: config.explosionIntensity || 150,
      ...config
    };
    
    this.state = 'idle';
    this.phase = null;
    this.phaseStartTime = 0;
    this.onComplete = null;
  }
  
  start(sourceImage, targetImage) {
    this.sourceImage = sourceImage;
    this.targetImage = targetImage;
    this.state = 'active';
    this.phase = 'staticDisplay';
    this.phaseStartTime = performance.now();
  }
  
  update(currentTime, deltaTime, engine) {
    if (this.state !== 'active') return;
    
    const elapsed = currentTime - this.phaseStartTime;
    
    switch (this.phase) {
      case 'staticDisplay':
        if (elapsed >= this.config.staticDisplayDuration) {
          this.enterExplosionPhase(currentTime, engine);
        }
        break;
        
      case 'explosion':
        if (elapsed >= this.config.explosionDuration) {
          this.enterSnapBackPhase(currentTime, engine);
        }
        break;
        
      case 'snapBack':
        // Update color morph progress during snap-back
        const morphProgress = Math.min(elapsed / this.config.snapBackDuration, 1.0);
        this.updateColorMorph(morphProgress, engine);
        
        if (elapsed >= this.config.snapBackDuration) {
          this.complete();
        }
        break;
    }
  }
  
  enterExplosionPhase(currentTime, engine) {
    this.phase = 'explosion';
    this.phaseStartTime = currentTime;
    
    // Calculate center of mass
    const centerOfMass = this.calculateCenterOfMass(engine.elasticMesh);
    
    // Apply explosion to mesh
    engine.meshPhysics.applyExplosion(this.config.explosionIntensity, centerOfMass);
  }
  
  enterSnapBackPhase(currentTime, engine) {
    this.phase = 'snapBack';
    this.phaseStartTime = currentTime;
    
    // Store source colors for morphing
    engine.elasticMesh.vertices.forEach(vertex => {
      vertex.sourceColor = { ...vertex.color };
    });
    
    // Start morphing to target
    engine.meshPhysics.startMorphing(this.config.snapBackDuration);
  }
  
  updateColorMorph(progress, engine) {
    // Blend vertex colors from source → target
    engine.elasticMesh.vertices.forEach(vertex => {
      if (!vertex.sourceColor || !vertex.targetColor) return;
      
      vertex.color = {
        r: vertex.sourceColor.r * (1 - progress) + vertex.targetColor.r * progress,
        g: vertex.sourceColor.g * (1 - progress) + vertex.targetColor.g * progress,
        b: vertex.sourceColor.b * (1 - progress) + vertex.targetColor.b * progress,
        a: vertex.sourceColor.a * (1 - progress) + vertex.targetColor.a * progress
      };
    });
  }
  
  calculateCenterOfMass(mesh) {
    let totalMass = 0;
    let centerX = 0;
    let centerY = 0;
    
    mesh.vertices.forEach(vertex => {
      const mass = vertex.mass || 1.0;
      totalMass += mass;
      centerX += vertex.x * mass;
      centerY += vertex.y * mass;
    });
    
    return {
      x: centerX / totalMass,
      y: centerY / totalMass
    };
  }
  
  complete() {
    this.state = 'complete';
    this.phase = null;
    if (this.onComplete) this.onComplete();
  }
  
  isActive() {
    return this.state === 'active';
  }
  
  getCurrentPhase() {
    return this.phase;
  }
}

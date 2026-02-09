# ZGameEditor Visualizer Shader Collection

Audio-reactive GLSL shaders for FL Studio's ZGameEditor Visualizer plugin, converted from the WebGL Particle Engine.

## Overview

This collection provides five main audio-reactive shaders and one bonus visualizer, all optimized for real-time music visualization in FL Studio. Each shader responds dynamically to different frequency bands, beats, and amplitude, creating immersive visual experiences synchronized with your music.

## Quick Start

1. **Install FL Studio** (version 20.8 or later recommended)
2. **Load ZGameEditor Visualizer** plugin on a mixer track
3. **Import shader** from `/shaders/` directory
4. **Load preset** from `/presets/` directory
5. **Map audio inputs** to shader parameters
6. **Enjoy** real-time audio-reactive visuals!

For detailed instructions, see [LOADING_GUIDE.md](LOADING_GUIDE.md)

## Shader Descriptions

### 1. Particle Explosion (`particle-explosion.frag`)

**Description:** Explosive particle system with circular soft-edged particles that radiate from the center.

**Audio Reactivity:**
- **Bass**: Controls particle size and intensity
- **Beat**: Triggers explosion pulses and intensity bursts
- **Mid**: Adjusts particle density dynamically
- **High**: Modulates particle brightness and shimmer
- **Amplitude**: Overall visibility and intensity

**Best For:** EDM, Bass Music, Trap, Dubstep

**Parameters:**
- `u_particleDensity` (20-100): Number of particles
- `u_explosionRadius` (0.3-0.8): Spread radius
- `u_particleSize` (1.0-8.0): Individual particle size
- `u_colorR/G/B` (0.0-1.0): Color channel intensities

---

### 2. Blob/Metaballs (`blob-metaballs.frag`)

**Description:** Organic blob shapes with smooth metaball blending and surface tension effects.

**Audio Reactivity:**
- **Bass**: Controls blob size and influence radius
- **Beat**: Modulates metaball threshold for pulsing effects
- **Mid**: Affects number of active blob sources
- **High**: Controls edge softness and glow
- **Spectrum**: Each blob responds to different frequency positions

**Best For:** Ambient, Chillout, Downtempo, Experimental

**Parameters:**
- `u_blobCount` (2-10): Number of blob sources
- `u_threshold` (0.5-2.0): Metaball surface threshold
- `u_influenceRadius` (0.1-0.4): Blob influence radius
- `u_surfaceTension` (0.0-1.0): Surface smoothness
- `u_edgeSoftness` (0.05-0.3): Edge fade amount

---

### 3. Mesh Morph (`mesh-morph.frag`)

**Description:** Elastic mesh with grid-based deformation, texture warping, and wave propagation.

**Audio Reactivity:**
- **Bass**: Controls texture warping intensity
- **Beat**: Triggers vertex displacement pulses
- **Mid**: Adjusts grid density and color shifts
- **High**: Adds shimmer and brightness to deformations
- **Spectrum**: Grid cells respond to frequency spectrum

**Best For:** House, Techno, Trance, Progressive

**Parameters:**
- `u_gridDensity` (5-30): Mesh grid density
- `u_deformStrength` (0.0-0.5): Deformation intensity
- `u_warpIntensity` (0.0-0.3): Texture warp amount
- `u_elasticity` (0.5-1.0): Springiness
- `u_colorShift` (0.0-1.0): Color modulation

---

### 4. Triangulation (`triangulation.frag`)

**Description:** Low-poly triangulated rendering with dynamic triangle sizing and edge highlighting.

**Audio Reactivity:**
- **Bass**: Controls triangle size
- **Beat**: Triggers vertex displacement
- **Mid**: Affects color intensity per triangle
- **High**: Modulates edge brightness and glow
- **Spectrum**: Each triangle responds to a frequency slice

**Best For:** Synthwave, Retrowave, Glitch, IDM

**Parameters:**
- `u_triangleSize` (0.02-0.2): Triangle dimensions
- `u_edgeThickness` (0.001-0.01): Edge line width
- `u_edgeBrightness` (0.0-2.0): Edge glow intensity
- `u_colorVariation` (0.0-1.0): Per-triangle color variation
- `u_displacement` (0.0-0.3): Vertex displacement amount

---

### 5. Hybrid Transition (`hybrid-transition.frag`)

**Description:** Multi-phase particle-to-image transition with disintegration and recombination effects.

**Audio Reactivity:**
- **Bass**: Controls recombination speed
- **Beat**: Triggers disintegration pulses
- **Mid**: Phase progression and color saturation
- **High**: Adds particle shimmer
- **Amplitude**: Overall visibility

**Best For:** Cinematic builds, transitions, live performances

**Parameters:**
- `u_transitionPhase` (0.0-4.0): Transition stage (0=solid, 4=solid)
- `u_particleCount` (50-200): Number of particles
- `u_explosionRadius` (0.2-0.8): Explosion spread
- `u_colorBlend` (0.0-1.0): Color mixing amount
- `u_turbulence` (0.0-0.5): Flow turbulence

**Phases:**
- **0-1**: Solid to disintegration
- **1-2**: Floating particles
- **2-3**: Particle swirl
- **3-4**: Recombination to solid

---

### 6. Audio Spectrum Visualizer (Bonus) (`audio-spectrum-visualizer.frag`)

**Description:** Classic audio spectrum analyzer with multiple visualization modes.

**Audio Reactivity:**
- **Spectrum**: Direct frequency-to-height mapping
- **Beat**: Flash effects on beats
- **Bass**: Warmth in lower frequencies
- **High**: Brightness in upper frequencies
- **Amplitude**: Overall brightness

**Visualization Modes:**
- **0**: Bar spectrum (classic analyzer)
- **1**: Waveform (oscilloscope-style)
- **2**: Circular spectrum (radial analyzer)

**Best For:** All music genres, stream overlays, classic visualizations

**Parameters:**
- `u_barCount` (16-128): Number of frequency bars
- `u_barSpacing` (0.0-0.3): Gap between bars
- `u_heightScale` (0.5-2.0): Height multiplier
- `u_smoothing` (0.0-0.95): Temporal smoothing
- `u_visualMode` (0-2): Visualization mode

---

## Requirements

- **FL Studio** 20.8 or later (20.9+ recommended)
- **ZGameEditor Visualizer** plugin (included with FL Studio)
- **Graphics Card**: Any GPU with OpenGL ES 2.0 support
- **Recommended**: Mid-range GPU for 60 FPS at 1080p

## File Structure

```
zgameeditor-exports/
├── shaders/
│   ├── particle-explosion.frag          # Particle system
│   ├── blob-metaballs.frag              # Organic blobs
│   ├── mesh-morph.frag                  # Elastic mesh
│   ├── triangulation.frag               # Low-poly triangles
│   ├── hybrid-transition.frag           # Multi-phase transition
│   └── audio-spectrum-visualizer.frag   # Spectrum analyzer
├── presets/
│   ├── bass-reactive-particles.json     # Particle preset
│   ├── frequency-blobs.json             # Blob preset
│   └── beat-mesh.json                   # Mesh preset
├── README.md                             # This file
└── LOADING_GUIDE.md                      # Step-by-step tutorial
```

## Audio Mapping Reference

All shaders use standardized audio inputs:

### Uniforms

- `iResolution` - Canvas resolution (vec2)
- `iTime` - Time in seconds (float)
- `iBeat` - Beat detection 0-1 (float)
- `iBass` - Bass frequency 20-250 Hz (float)
- `iMid` - Mid frequency 250-4000 Hz (float)
- `iHigh` - High frequency 4000-20000 Hz (float)
- `iAmplitude` - Overall RMS amplitude (float)
- `iChannel0` - Audio spectrum texture (sampler2D)

### Helper Functions

All shaders include:
- `beatPulse()` - Smooth beat detection with attack/decay
- `freqMap()` - Map frequency to parameter range
- `getSpectrum()` - Sample frequency spectrum texture
- `smoothAudio()` - Smooth audio transitions

## Performance Tips

1. **Resolution**: Start at 720p, scale up as needed
2. **Particle Count**: Lower values for older hardware
3. **Smoothing**: Higher smoothing = less CPU usage
4. **Multiple Shaders**: Run one shader at a time for best performance
5. **Recording**: Use offline rendering for high-quality exports

## Customization

All shaders are designed to be easily customizable:

1. **Adjust Parameters**: Modify uniform values in real-time
2. **Change Colors**: Edit RGB values and hue functions
3. **Modify Timing**: Adjust attack/decay in `beatPulse()`
4. **Add Effects**: Shaders are modular and extensible

## Troubleshooting

### Shader won't load
- Ensure you're using FL Studio 20.8+
- Check that the .frag file is valid GLSL ES 1.0
- Try restarting ZGameEditor Visualizer

### No audio response
- Verify audio input is routed to the visualizer
- Check that audio mapping is configured
- Increase parameter sensitivity

### Low frame rate
- Reduce canvas resolution
- Lower particle/element count
- Close other applications
- Update graphics drivers

### Colors look wrong
- Check color parameter ranges
- Verify gamma settings in FL Studio
- Try different presets

## Technical Notes

- **GLSL Version**: ES 1.0 (OpenGL ES 2.0)
- **Precision**: mediump float for compatibility
- **Format**: ShaderToy-compatible structure
- **Optimization**: Real-time 60 FPS target
- **Safety**: Division by zero and NaN checks included

## Links

- [FL Studio Website](https://www.image-line.com/fl-studio/)
- [ZGameEditor Documentation](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/ZGameEditor%20Visualizer.htm)
- [ShaderToy](https://www.shadertoy.com/) - Shader inspiration
- [GLSL Reference](https://www.khronos.org/files/opengles_shading_language.pdf)

## License

MIT License - See source files for details

## Credits

**Author**: indrolend  
**Project**: WebGL Particle Engine  
**Conversion**: ZGameEditor Visualizer GLSL Export

---

**Enjoy creating stunning audio-reactive visuals in FL Studio!** 🎵✨

For detailed setup instructions, see [LOADING_GUIDE.md](LOADING_GUIDE.md)

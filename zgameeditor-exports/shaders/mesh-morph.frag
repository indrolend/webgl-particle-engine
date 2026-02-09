// Mesh Morph Shader
// Elastic mesh deformation with texture warping and audio-reactive displacement
// Audio Reactivity: Vertex displacement (beat), texture warping (frequencies), crossfade (mid)
// Author: indrolend
// License: MIT

precision mediump float;

// === INPUTS ===
uniform vec2 iResolution;      // Canvas resolution
uniform float iTime;           // Time in seconds
uniform float iBeat;           // Beat detection (0-1)
uniform float iBass;           // Bass frequency (0-1)
uniform float iMid;            // Mid frequency (0-1)
uniform float iHigh;           // High frequency (0-1)
uniform float iAmplitude;      // Overall amplitude (0-1)
uniform sampler2D iChannel0;   // Audio spectrum texture

// === USER PARAMETERS ===
uniform float u_gridDensity;       // Mesh grid density, range: [5, 30]
uniform float u_deformStrength;    // Deformation strength, range: [0.0, 0.5]
uniform float u_warpIntensity;     // Texture warp intensity, range: [0.0, 0.3]
uniform float u_elasticity;        // Mesh elasticity, range: [0.5, 1.0]
uniform float u_colorShift;        // Color shift amount, range: [0.0, 1.0]

// === HELPER FUNCTIONS ===

// Smooth beat detection with attack/decay
float beatPulse(float beat, float attack, float decay) {
    float t = fract(iTime * 2.0);
    float envelope = t < attack ? t / attack : 1.0 - ((t - attack) / decay);
    return beat * smoothstep(0.0, 1.0, envelope);
}

// Map frequency band to visual parameter
float freqMap(float freq, float minVal, float maxVal) {
    return minVal + freq * (maxVal - minVal);
}

// Get spectrum value at specific frequency
float getSpectrum(sampler2D spectrum, float freq) {
    return texture2D(spectrum, vec2(freq, 0.5)).r;
}

// Smooth audio transitions
float smoothAudio(float current, float target, float smoothness) {
    return mix(current, target, smoothness);
}

// Noise function for organic deformation
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion for complex deformation
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

// Grid-based displacement
vec2 gridDisplacement(vec2 uv, float time, float strength) {
    vec2 displacement = vec2(0.0);
    
    // Create grid effect
    vec2 grid = floor(uv * u_gridDensity) / u_gridDensity;
    
    // Get spectrum for this grid cell
    float spectrum = getSpectrum(iChannel0, grid.x);
    
    // Displacement based on grid position and audio
    displacement.x = sin(grid.y * 10.0 + time * 2.0) * strength * spectrum;
    displacement.y = cos(grid.x * 10.0 + time * 2.0) * strength * spectrum;
    
    return displacement;
}

// Wave deformation
vec2 waveDeform(vec2 uv, float time, float intensity) {
    float wave1 = sin(uv.x * 10.0 + time * 2.0) * intensity;
    float wave2 = cos(uv.y * 10.0 + time * 1.5) * intensity;
    return vec2(wave1, wave2);
}

// === MAIN EFFECT ===
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    
    // Beat-reactive parameters
    float beatIntensity = beatPulse(iBeat, 0.1, 0.9);
    
    // Bass affects overall deformation
    float deformMod = u_deformStrength * (1.0 + iBass * 0.5);
    
    // Calculate vertex displacement
    vec2 displacement = vec2(0.0);
    
    // Grid-based displacement (beat-reactive)
    displacement += gridDisplacement(uv, iTime, deformMod * beatIntensity);
    
    // Wave deformation (mid-frequency controlled)
    displacement += waveDeform(uv, iTime, u_warpIntensity * iMid);
    
    // FBM noise for organic feel (high-frequency controlled)
    vec2 noiseOffset = vec2(
        fbm(uv * 3.0 + iTime * 0.5),
        fbm(uv * 3.0 + iTime * 0.5 + vec2(5.3, 2.7))
    ) - 0.5;
    displacement += noiseOffset * deformMod * iHigh;
    
    // Apply elasticity
    displacement *= u_elasticity;
    
    // Warped UV coordinates
    vec2 warpedUV = uv + displacement;
    
    // Clamp to prevent extreme warping
    warpedUV = clamp(warpedUV, 0.0, 1.0);
    
    // Create a procedural mesh texture (since we don't have actual textures in ShaderToy)
    // Generate a grid pattern
    vec2 grid = fract(warpedUV * u_gridDensity);
    float gridLine = step(0.95, max(grid.x, grid.y));
    
    // Base color gradient
    vec3 color = vec3(warpedUV.x, warpedUV.y, 0.5);
    
    // Color shift based on audio
    float hueShift = u_colorShift * iMid;
    color = vec3(
        color.r + sin(hueShift * 6.28318530718) * 0.3,
        color.g + sin(hueShift * 6.28318530718 + 2.094) * 0.3,
        color.b + sin(hueShift * 6.28318530718 + 4.189) * 0.3
    );
    
    // Add grid visualization
    color = mix(color, vec3(1.0), gridLine * 0.3);
    
    // Bass adds warmth
    color.r += iBass * 0.2;
    
    // High frequencies add brightness
    color += vec3(iHigh * 0.15);
    
    // Beat creates flash effect
    color += vec3(beatIntensity * 0.2);
    
    // Amplitude affects overall brightness
    color *= (0.7 + iAmplitude * 0.3);
    
    // Add some depth based on displacement magnitude
    float depth = length(displacement) * 5.0;
    color *= (1.0 - depth * 0.3);
    
    // Vignette effect
    vec2 vignetteUV = uv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.3;
    color *= vignette;
    
    // Clamp color
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
}

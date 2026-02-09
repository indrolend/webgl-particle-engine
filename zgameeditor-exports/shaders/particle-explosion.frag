// Particle Explosion Shader
// Audio-reactive particle explosion effect with circular soft-edged particles
// Audio Reactivity: Particle size (bass), explosion intensity (beat), density (mid), colors (frequency bands)
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
uniform float u_particleDensity;   // Number of particles, range: [20, 100]
uniform float u_explosionRadius;   // Explosion radius, range: [0.3, 0.8]
uniform float u_particleSize;      // Particle size, range: [1.0, 8.0]
uniform float u_colorR;            // Red channel intensity, range: [0.0, 1.0]
uniform float u_colorG;            // Green channel intensity, range: [0.0, 1.0]
uniform float u_colorB;            // Blue channel intensity, range: [0.0, 1.0]

// === HELPER FUNCTIONS ===

// Smooth beat detection with attack/decay
float beatPulse(float beat, float attack, float decay) {
    float t = fract(iTime * 2.0); // Pulse timing
    float envelope = t < attack ? t / attack : 1.0 - ((t - attack) / decay);
    return beat * smoothstep(0.0, 1.0, envelope);
}

// Map frequency band to visual parameter
float freqMap(float freq, float minVal, float maxVal) {
    return minVal + freq * (maxVal - minVal);
}

// Get spectrum value at specific frequency (0-1 range)
float getSpectrum(sampler2D spectrum, float freq) {
    return texture2D(spectrum, vec2(freq, 0.5)).r;
}

// Smooth audio transitions
float smoothAudio(float current, float target, float smoothness) {
    return mix(current, target, smoothness);
}

// Hash function for pseudo-random values
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D rotation matrix
mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

// === MAIN EFFECT ===
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 center = vec2(0.5, 0.5);
    
    // Normalize coordinates to maintain aspect ratio
    vec2 aspectUV = uv - center;
    aspectUV.x *= iResolution.x / iResolution.y;
    
    vec3 color = vec3(0.0);
    float totalAlpha = 0.0;
    
    // Beat-reactive explosion intensity
    float beatIntensity = beatPulse(iBeat, 0.1, 0.9);
    float explosionScale = u_explosionRadius * (1.0 + beatIntensity * 0.5);
    
    // Bass-reactive particle size
    float particleSizeMod = u_particleSize * (1.0 + iBass * 0.5);
    float particleRadius = particleSizeMod / iResolution.y;
    
    // Mid-frequency controlled particle density
    float densityMod = u_particleDensity * (1.0 + iMid * 0.3);
    int particleCount = int(densityMod);
    
    // Render particles
    for (int i = 0; i < 100; i++) {
        if (i >= particleCount) break;
        
        float iFloat = float(i);
        float t = iFloat / float(particleCount);
        
        // Pseudo-random angle for each particle
        float angle = t * 6.28318530718 * 5.0 + hash(vec2(iFloat, 0.0)) * 6.28318530718;
        
        // Time-based rotation
        float rotationSpeed = 0.5 + hash(vec2(iFloat, 1.0)) * 0.5;
        angle += iTime * rotationSpeed;
        
        // Spiral explosion pattern
        float radius = explosionScale * (0.5 + 0.5 * sin(iTime * 0.5 + t * 3.14159));
        radius *= (1.0 + beatIntensity * 0.3);
        
        // Particle position
        vec2 particlePos = vec2(cos(angle), sin(angle)) * radius;
        
        // Oscillation for organic movement
        particlePos += vec2(
            sin(iTime * 2.0 + t * 6.28318530718) * 0.05,
            cos(iTime * 2.0 + t * 6.28318530718) * 0.05
        );
        
        // Distance to particle
        float dist = length(aspectUV - particlePos);
        
        // Circular particle with soft edges
        float particle = 1.0 - smoothstep(particleRadius * 0.3, particleRadius, dist);
        
        if (particle > 0.001) {
            // Frequency-based color modulation
            float hue = t + iTime * 0.1;
            vec3 particleColor = vec3(
                u_colorR * (0.5 + 0.5 * sin(hue * 6.28318530718)),
                u_colorG * (0.5 + 0.5 * sin(hue * 6.28318530718 + 2.094)),
                u_colorB * (0.5 + 0.5 * sin(hue * 6.28318530718 + 4.189))
            );
            
            // High frequency affects brightness
            particleColor *= (0.7 + iHigh * 0.3);
            
            // Amplitude affects overall intensity
            float intensity = (0.5 + iAmplitude * 0.5);
            
            color += particleColor * particle * intensity;
            totalAlpha += particle;
        }
    }
    
    // Normalize and clamp
    if (totalAlpha > 0.0) {
        color /= (totalAlpha * 0.5 + 0.5); // Soft normalization
    }
    color = clamp(color, 0.0, 1.0);
    
    // Output with alpha based on particle density
    float alpha = min(totalAlpha, 1.0);
    gl_FragColor = vec4(color, alpha);
}

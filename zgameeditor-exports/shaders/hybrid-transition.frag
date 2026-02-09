// Hybrid Transition Shader
// Multi-phase particle-to-image transition effect with disintegration and recombination
// Audio Reactivity: Disintegration (beat), recombination (bass), phase timing (mid), colors (spectrum)
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
uniform float u_transitionPhase;   // Transition phase, range: [0.0, 4.0] (0=solid, 1=disintegrate, 2=float, 3=recombine, 4=solid)
uniform float u_particleCount;     // Number of particles, range: [50, 200]
uniform float u_explosionRadius;   // Explosion spread, range: [0.2, 0.8]
uniform float u_colorBlend;        // Color blend amount, range: [0.0, 1.0]
uniform float u_turbulence;        // Turbulence intensity, range: [0.0, 0.5]

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

// Hash function
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    )) * 43758.5453);
}

// Noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Turbulent flow field
vec2 flowField(vec2 p, float time) {
    float n1 = noise(p * 2.0 + time);
    float n2 = noise(p * 2.0 + time + vec2(5.2, 1.3));
    return vec2(n1, n2) * 2.0 - 1.0;
}

// === MAIN EFFECT ===
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 center = vec2(0.5, 0.5);
    
    // Maintain aspect ratio
    vec2 aspectUV = uv - center;
    aspectUV.x *= iResolution.x / iResolution.y;
    
    // Beat-reactive parameters
    float beatIntensity = beatPulse(iBeat, 0.1, 0.9);
    
    // Calculate transition stage
    float phase = u_transitionPhase;
    
    // Phase 0: Solid image (alpha = 1)
    // Phase 1: Disintegration (particles explode outward)
    // Phase 2: Floating particles (particles float and swirl)
    // Phase 3: Recombination (particles return to form)
    // Phase 4: Solid image again (alpha = 1)
    
    vec3 color = vec3(0.0);
    float totalAlpha = 0.0;
    
    // Determine phase weights
    float solidWeight = 0.0;
    float particleWeight = 0.0;
    
    if (phase < 1.0) {
        // Transitioning from solid to particles
        solidWeight = 1.0 - phase;
        particleWeight = phase;
    } else if (phase < 3.0) {
        // Fully particles
        particleWeight = 1.0;
    } else if (phase < 4.0) {
        // Transitioning from particles to solid
        particleWeight = 4.0 - phase;
        solidWeight = phase - 3.0;
    } else {
        // Fully solid
        solidWeight = 1.0;
    }
    
    // Solid image rendering
    if (solidWeight > 0.0) {
        // Generate procedural image pattern
        vec3 imageColor = vec3(
            0.5 + 0.5 * sin(uv.x * 10.0 + iTime),
            0.5 + 0.5 * sin(uv.y * 10.0 + iTime * 0.8),
            0.5 + 0.5 * sin((uv.x + uv.y) * 7.0 + iTime * 1.2)
        );
        
        color += imageColor * solidWeight;
        totalAlpha += solidWeight;
    }
    
    // Particle rendering
    if (particleWeight > 0.0) {
        int particleCount = int(u_particleCount);
        float particleRadius = 0.015;
        
        for (int i = 0; i < 200; i++) {
            if (i >= particleCount) break;
            
            float iFloat = float(i);
            float t = iFloat / float(particleCount);
            
            // Original grid position
            vec2 gridPos = vec2(
                mod(iFloat, 10.0) / 10.0 - 0.5,
                floor(iFloat / 10.0) / 20.0 - 0.5
            );
            gridPos *= iResolution.x / iResolution.y;
            
            // Particle animation based on phase
            vec2 particlePos = gridPos;
            
            if (phase >= 1.0 && phase < 2.0) {
                // Disintegration phase - explode outward
                float explodeFactor = phase - 1.0;
                explodeFactor *= (1.0 + beatIntensity * 0.5); // Beat controls explosion speed
                
                float angle = hash(vec2(iFloat, 0.0)) * 6.28318530718;
                float radius = u_explosionRadius * explodeFactor;
                
                particlePos += vec2(cos(angle), sin(angle)) * radius;
            } else if (phase >= 2.0 && phase < 3.0) {
                // Floating phase - particles swirl
                float floatFactor = phase - 2.0;
                
                float angle = hash(vec2(iFloat, 0.0)) * 6.28318530718;
                float radius = u_explosionRadius;
                
                particlePos += vec2(cos(angle), sin(angle)) * radius;
                
                // Add swirl motion controlled by bass
                float swirl = iTime * (1.0 + iBass);
                particlePos += vec2(
                    cos(angle + swirl) * 0.2,
                    sin(angle + swirl) * 0.2
                );
                
                // Turbulence
                particlePos += flowField(particlePos * 3.0, iTime) * u_turbulence;
            } else if (phase >= 3.0) {
                // Recombination phase - return to grid
                float returnFactor = 1.0 - (phase - 3.0);
                returnFactor *= (1.0 + iBass * 0.5); // Bass controls return speed
                
                float angle = hash(vec2(iFloat, 0.0)) * 6.28318530718;
                float radius = u_explosionRadius * returnFactor;
                
                particlePos += vec2(cos(angle), sin(angle)) * radius;
            }
            
            // Distance to particle
            float dist = length(aspectUV - particlePos);
            
            // Circular particle with soft edges
            float particle = 1.0 - smoothstep(particleRadius * 0.3, particleRadius, dist);
            
            if (particle > 0.001) {
                // Get spectrum for this particle
                float spectrum = getSpectrum(iChannel0, t);
                
                // Color based on position and spectrum
                vec3 particleColor = vec3(
                    0.5 + 0.5 * sin(t * 6.28318530718 + iTime),
                    0.5 + 0.5 * sin(t * 6.28318530718 + 2.094 + iTime * 0.8),
                    0.5 + 0.5 * sin(t * 6.28318530718 + 4.189 + iTime * 1.2)
                );
                
                // Blend with original image color
                vec3 originalColor = vec3(
                    0.5 + 0.5 * sin(gridPos.x * 10.0 + iTime),
                    0.5 + 0.5 * sin(gridPos.y * 10.0 + iTime * 0.8),
                    0.5
                );
                
                particleColor = mix(originalColor, particleColor, u_colorBlend);
                
                // Modulate with spectrum
                particleColor *= (0.7 + spectrum * 0.3);
                
                // High frequencies add shimmer
                particleColor += vec3(iHigh * 0.2 * particle);
                
                color += particleColor * particle * particleWeight;
                totalAlpha += particle * particleWeight;
            }
        }
        
        // Normalize particle contribution
        if (totalAlpha > particleWeight) {
            color *= particleWeight / totalAlpha;
            totalAlpha = particleWeight;
        }
    }
    
    // Apply overall audio modulation
    color *= (0.8 + iAmplitude * 0.2);
    
    // Mid frequency affects color saturation
    float saturation = 1.0 + iMid * 0.3;
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, saturation);
    
    // Clamp color
    color = clamp(color, 0.0, 1.0);
    
    // Final alpha
    float finalAlpha = min(totalAlpha + solidWeight, 1.0);
    
    gl_FragColor = vec4(color, finalAlpha);
}

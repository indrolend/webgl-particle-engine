// Blob/Metaballs Shader
// Organic blob shapes with smooth surface tension and metaball blending
// Audio Reactivity: Edge softness (high freq), blob intensity (bass), color shifts (spectrum)
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
uniform float u_blobCount;         // Number of blob sources, range: [2, 10]
uniform float u_threshold;         // Metaball threshold, range: [0.5, 2.0]
uniform float u_influenceRadius;   // Blob influence radius, range: [0.1, 0.4]
uniform float u_surfaceTension;    // Surface smoothness, range: [0.0, 1.0]
uniform float u_edgeSoftness;      // Edge fade amount, range: [0.05, 0.3]

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

// Hash function for pseudo-random
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2(vec2 p) {
    return fract(sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    )) * 43758.5453);
}

// Metaball field function
float metaball(vec2 p, vec2 center, float radius, float strength) {
    float d = length(p - center);
    if (d < 0.0001) return strength * 1000.0; // Avoid division by zero
    return strength * (radius * radius) / (d * d);
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
    
    // Bass controls blob intensity/size
    float blobScale = 1.0 + iBass * 0.5;
    float influenceRadius = u_influenceRadius * blobScale;
    
    // High frequencies control edge softness
    float edgeSoftness = u_edgeSoftness * (1.0 + iHigh * 0.5);
    
    // Mid frequencies affect blob count
    int blobCount = int(u_blobCount * (0.8 + iMid * 0.4));
    if (blobCount < 2) blobCount = 2;
    if (blobCount > 10) blobCount = 10;
    
    // Calculate metaball field
    float field = 0.0;
    vec3 colorAccum = vec3(0.0);
    float weightSum = 0.0;
    
    for (int i = 0; i < 10; i++) {
        if (i >= blobCount) break;
        
        float iFloat = float(i);
        float t = iFloat / float(blobCount);
        
        // Get spectrum value for this blob
        float spectrum = getSpectrum(iChannel0, t);
        
        // Blob position - circular arrangement with audio-reactive movement
        float angle = t * 6.28318530718 + iTime * 0.5;
        float orbitRadius = 0.3 + spectrum * 0.2;
        
        vec2 blobPos = vec2(
            cos(angle) * orbitRadius,
            sin(angle) * orbitRadius
        );
        
        // Add oscillation based on audio
        blobPos += vec2(
            sin(iTime * 3.0 + t * 6.28318530718) * 0.1 * spectrum,
            cos(iTime * 2.5 + t * 6.28318530718) * 0.1 * spectrum
        );
        
        // Blob strength affected by beat
        float strength = 1.0 + beatIntensity * 0.5 + spectrum * 0.3;
        
        // Add to metaball field
        float contribution = metaball(aspectUV, blobPos, influenceRadius, strength);
        field += contribution;
        
        // Color based on frequency position
        vec3 blobColor = vec3(
            0.5 + 0.5 * sin(t * 6.28318530718),
            0.5 + 0.5 * sin(t * 6.28318530718 + 2.094),
            0.5 + 0.5 * sin(t * 6.28318530718 + 4.189)
        );
        
        // Weight color by contribution
        float weight = contribution / (contribution + 0.1);
        colorAccum += blobColor * weight * spectrum;
        weightSum += weight;
    }
    
    // Normalize field value
    field = field / float(blobCount);
    
    // Apply threshold with smooth surface tension
    float surface = smoothstep(u_threshold - edgeSoftness, u_threshold + edgeSoftness, field);
    
    // Color modulation
    vec3 color = vec3(0.0);
    if (weightSum > 0.0) {
        color = colorAccum / weightSum;
    }
    
    // Add some brightness variation based on field intensity
    float brightness = 0.6 + 0.4 * smoothstep(u_threshold, u_threshold * 2.0, field);
    color *= brightness;
    
    // Bass adds warmth
    color += vec3(iBass * 0.2, iBass * 0.1, 0.0);
    
    // High frequencies add brightness
    color += vec3(iHigh * 0.15);
    
    // Amplitude affects overall visibility
    float finalAlpha = surface * (0.7 + iAmplitude * 0.3);
    
    // Clamp color
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, finalAlpha);
}

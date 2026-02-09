// Triangulation Shader
// Low-poly triangulated rendering with dynamic triangle sizing and edge detection
// Audio Reactivity: Triangle size (bass), edge highlighting (high freq), alpha blending (amplitude)
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
uniform float u_triangleSize;      // Triangle size, range: [0.02, 0.2]
uniform float u_edgeThickness;     // Edge line thickness, range: [0.001, 0.01]
uniform float u_edgeBrightness;    // Edge brightness, range: [0.0, 2.0]
uniform float u_colorVariation;    // Color variation per triangle, range: [0.0, 1.0]
uniform float u_displacement;      // Vertex displacement, range: [0.0, 0.3]

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

// Noise for vertex displacement
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

// Distance to line segment
float distanceToSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

// Calculate barycentric coordinates
vec3 barycentric(vec2 p, vec2 a, vec2 b, vec2 c) {
    vec2 v0 = b - a;
    vec2 v1 = c - a;
    vec2 v2 = p - a;
    
    float d00 = dot(v0, v0);
    float d01 = dot(v0, v1);
    float d11 = dot(v1, v1);
    float d20 = dot(v2, v0);
    float d21 = dot(v2, v1);
    
    float denom = d00 * d11 - d01 * d01;
    if (abs(denom) < 0.0001) {
        // Degenerate triangle
        return vec3(-1.0);
    }
    
    float v = (d11 * d20 - d01 * d21) / denom;
    float w = (d00 * d21 - d01 * d20) / denom;
    float u = 1.0 - v - w;
    
    return vec3(u, v, w);
}

// Check if point is inside triangle
bool isInsideTriangle(vec3 bary) {
    return bary.x >= 0.0 && bary.y >= 0.0 && bary.z >= 0.0;
}

// === MAIN EFFECT ===
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    
    // Beat-reactive parameters
    float beatIntensity = beatPulse(iBeat, 0.1, 0.9);
    
    // Bass affects triangle size
    float triangleScale = u_triangleSize * (1.0 + iBass * 0.5);
    
    // High frequencies affect edge brightness
    float edgeMod = u_edgeBrightness * (1.0 + iHigh * 0.5);
    
    // Calculate which triangle this pixel belongs to
    vec2 gridUV = uv / triangleScale;
    vec2 gridCell = floor(gridUV);
    vec2 localUV = fract(gridUV);
    
    // Generate triangle vertices with displacement
    float displacement = u_displacement * (0.5 + 0.5 * sin(iTime * 2.0)) * beatIntensity;
    
    // Triangle vertices (two triangles per grid cell)
    vec2 v0 = vec2(0.0, 0.0);
    vec2 v1 = vec2(1.0, 0.0);
    vec2 v2 = vec2(0.0, 1.0);
    vec2 v3 = vec2(1.0, 1.0);
    
    // Apply vertex displacement
    float n0 = noise(gridCell + v0 + iTime * 0.5);
    float n1 = noise(gridCell + v1 + iTime * 0.5);
    float n2 = noise(gridCell + v2 + iTime * 0.5);
    float n3 = noise(gridCell + v3 + iTime * 0.5);
    
    v0 += (hash2(gridCell + v0) - 0.5) * displacement;
    v1 += (hash2(gridCell + v1) - 0.5) * displacement;
    v2 += (hash2(gridCell + v2) - 0.5) * displacement;
    v3 += (hash2(gridCell + v3) - 0.5) * displacement;
    
    // Determine which triangle we're in
    bool inTopLeft = localUV.x + localUV.y < 1.0;
    
    vec2 a, b, c;
    float triHash;
    
    if (inTopLeft) {
        a = v0; b = v1; c = v2;
        triHash = hash(gridCell);
    } else {
        a = v3; b = v2; c = v1;
        triHash = hash(gridCell + vec2(0.5));
    }
    
    // Calculate barycentric coordinates
    vec3 bary = barycentric(localUV, a, b, c);
    
    // Default color (fallback for invalid coordinates)
    vec3 color = vec3(0.5);
    float alpha = 0.3;
    
    if (isInsideTriangle(bary)) {
        // Get spectrum value for this triangle
        float spectrumPos = fract(triHash + iTime * 0.1);
        float spectrum = getSpectrum(iChannel0, spectrumPos);
        
        // Base color from UV position
        vec3 baseColor = vec3(
            uv.x,
            uv.y,
            0.5 + 0.5 * sin(iTime * 0.5)
        );
        
        // Add color variation per triangle
        vec3 triColor = vec3(
            0.5 + 0.5 * sin(triHash * 6.28318530718),
            0.5 + 0.5 * sin(triHash * 6.28318530718 + 2.094),
            0.5 + 0.5 * sin(triHash * 6.28318530718 + 4.189)
        );
        
        color = mix(baseColor, triColor, u_colorVariation);
        
        // Modulate with spectrum
        color *= (0.7 + spectrum * 0.3);
        
        // Mid frequencies affect color intensity
        color *= (0.8 + iMid * 0.2);
        
        // Edge detection
        float edgeDist = min(
            min(distanceToSegment(localUV, a, b),
                distanceToSegment(localUV, b, c)),
            distanceToSegment(localUV, c, a)
        );
        
        float edge = smoothstep(u_edgeThickness * 2.0, u_edgeThickness, edgeDist);
        
        // Apply edge highlighting
        color += vec3(edge * edgeMod);
        
        // Beat creates flash on edges
        color += vec3(edge * beatIntensity * 0.5);
        
        // Amplitude controls overall alpha
        alpha = (0.85 + iAmplitude * 0.15);
    }
    
    // Bass adds warmth
    color.r += iBass * 0.1;
    
    // Clamp color
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, alpha);
}

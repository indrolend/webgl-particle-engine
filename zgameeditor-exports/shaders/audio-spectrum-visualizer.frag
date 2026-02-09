// Audio Spectrum Visualizer
// Classic audio spectrum analyzer with bars and waveform visualization
// Audio Reactivity: Bar heights (spectrum), colors (frequency position), smoothing (amplitude)
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
uniform float u_barCount;          // Number of spectrum bars, range: [16, 128]
uniform float u_barSpacing;        // Spacing between bars, range: [0.0, 0.3]
uniform float u_heightScale;       // Height multiplier, range: [0.5, 2.0]
uniform float u_smoothing;         // Temporal smoothing, range: [0.0, 0.95]
uniform float u_visualMode;        // 0=bars, 1=waveform, 2=circular, range: [0, 2]

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

// HSV to RGB color conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// === VISUALIZATION MODES ===

// Bar spectrum visualization
vec3 renderBars(vec2 uv, int barCount, float spacing, float heightScale) {
    vec3 color = vec3(0.0);
    
    float barWidth = (1.0 - spacing) / float(barCount);
    float totalWidth = barWidth + spacing / float(barCount);
    
    int barIndex = int(uv.x / totalWidth);
    if (barIndex >= 0 && barIndex < barCount) {
        float barX = float(barIndex) * totalWidth;
        float localX = (uv.x - barX) / barWidth;
        
        if (localX >= 0.0 && localX <= 1.0) {
            // Get spectrum value for this bar
            float freq = float(barIndex) / float(barCount);
            float spectrum = getSpectrum(iChannel0, freq);
            
            // Apply height scale and smoothing
            float barHeight = spectrum * heightScale;
            barHeight = smoothAudio(barHeight, spectrum * heightScale, 1.0 - u_smoothing);
            
            // Check if pixel is within bar
            if (uv.y <= barHeight) {
                // Color gradient based on height and frequency
                float hue = freq + iTime * 0.1;
                float brightness = uv.y / barHeight;
                
                color = hsv2rgb(vec3(hue, 0.8, brightness * 0.9 + 0.1));
                
                // Add glow at top
                float glowDist = abs(uv.y - barHeight) / barHeight;
                color += vec3(1.0) * (1.0 - smoothstep(0.0, 0.05, glowDist)) * 0.5;
            }
            
            // Bar outline
            float outlineThickness = 0.003;
            if ((localX < outlineThickness || localX > 1.0 - outlineThickness) && uv.y <= barHeight) {
                color += vec3(0.3);
            }
        }
    }
    
    return color;
}

// Waveform visualization
vec3 renderWaveform(vec2 uv, float heightScale) {
    vec3 color = vec3(0.0);
    
    // Sample spectrum at this x position
    float spectrum = getSpectrum(iChannel0, uv.x);
    
    // Apply smoothing
    spectrum = smoothAudio(spectrum, spectrum, 1.0 - u_smoothing);
    
    // Waveform position (centered)
    float waveY = 0.5 + (spectrum - 0.5) * heightScale;
    
    // Distance to waveform
    float dist = abs(uv.y - waveY);
    float lineThickness = 0.005;
    
    if (dist < lineThickness * 2.0) {
        // Waveform line
        float lineStrength = 1.0 - smoothstep(0.0, lineThickness * 2.0, dist);
        
        // Color based on frequency position
        float hue = uv.x + iTime * 0.1;
        color = hsv2rgb(vec3(hue, 0.7, 0.9)) * lineStrength;
        
        // Add glow
        color += vec3(0.5, 0.7, 1.0) * lineStrength * 0.3;
    }
    
    // Add filled area under waveform
    if (uv.y < waveY && uv.y > 0.5) {
        float alpha = 0.2 * ((uv.y - 0.5) / (waveY - 0.5));
        float hue = uv.x + iTime * 0.1;
        color += hsv2rgb(vec3(hue, 0.5, 0.6)) * alpha;
    }
    
    return color;
}

// Circular spectrum visualization
vec3 renderCircular(vec2 uv, int barCount, float heightScale) {
    vec3 color = vec3(0.0);
    
    // Convert to polar coordinates
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = uv - center;
    delta.x *= iResolution.x / iResolution.y; // Maintain aspect ratio
    
    float radius = length(delta);
    float angle = atan(delta.y, delta.x) / 6.28318530718 + 0.5; // Normalize to 0-1
    
    // Get spectrum for this angle
    float spectrum = getSpectrum(iChannel0, angle);
    spectrum = smoothAudio(spectrum, spectrum, 1.0 - u_smoothing);
    
    // Inner and outer radius
    float innerRadius = 0.2;
    float barHeight = spectrum * heightScale * 0.3;
    float outerRadius = innerRadius + barHeight;
    
    if (radius >= innerRadius && radius <= outerRadius) {
        // Inside spectrum bar
        float t = (radius - innerRadius) / barHeight;
        
        // Color based on angle
        float hue = angle + iTime * 0.1;
        color = hsv2rgb(vec3(hue, 0.8, t * 0.7 + 0.3));
        
        // Add radial gradient
        color *= (1.0 - t * 0.5);
    }
    
    // Add glow at outer edge
    float glowDist = abs(radius - outerRadius);
    if (glowDist < 0.02) {
        float glowStrength = 1.0 - smoothstep(0.0, 0.02, glowDist);
        float hue = angle + iTime * 0.1;
        color += hsv2rgb(vec3(hue, 0.9, 1.0)) * glowStrength * 0.5;
    }
    
    return color;
}

// === MAIN EFFECT ===
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    
    vec3 color = vec3(0.0);
    
    // Determine visualization mode
    int mode = int(u_visualMode);
    int barCount = int(u_barCount);
    
    if (mode == 0) {
        // Bar visualization
        color = renderBars(uv, barCount, u_barSpacing, u_heightScale);
    } else if (mode == 1) {
        // Waveform visualization
        color = renderWaveform(uv, u_heightScale);
    } else {
        // Circular visualization
        color = renderCircular(uv, barCount, u_heightScale);
    }
    
    // Beat flash effect
    float beatIntensity = beatPulse(iBeat, 0.1, 0.9);
    color += vec3(beatIntensity * 0.1);
    
    // Bass adds warmth to lower frequencies
    if (uv.x < 0.3) {
        color.r += iBass * 0.15;
    }
    
    // High frequencies add brightness to upper frequencies
    if (uv.x > 0.7) {
        color += vec3(iHigh * 0.1);
    }
    
    // Overall amplitude affects brightness
    color *= (0.7 + iAmplitude * 0.3);
    
    // Add subtle background grid
    float gridLine = 0.0;
    gridLine += step(0.995, fract(uv.x * float(barCount)));
    gridLine += step(0.99, fract(uv.y * 10.0));
    color += vec3(gridLine * 0.05);
    
    // Vignette
    vec2 vignetteUV = uv * 2.0 - 1.0;
    float vignette = 1.0 - dot(vignetteUV, vignetteUV) * 0.2;
    color *= vignette;
    
    // Clamp color
    color = clamp(color, 0.0, 1.0);
    
    gl_FragColor = vec4(color, 1.0);
}

# Video Export Feature for Hybrid Transitions

This document explains how to export videos of hybrid transitions from the WebGL Particle Engine.

## Overview

The `export-hybrid-video.html` file demonstrates how to create and export a video of a hybrid particle transition between two images. The exported video showcases the full transition effect from one image to another with particle disintegration, explosion, recombination, and blending phases.

## Example Output

The included `hybrid-transition-9x16.webm` video demonstrates a transition from `indrolend.png` to `cover art.jpeg` in a 9:16 (portrait) aspect ratio with a white background.

## Features

- **Video Recording**: Uses the Canvas API's `captureStream()` method with `MediaRecorder` to record the canvas animation
- **9:16 Aspect Ratio**: Portrait video format (720x1280 pixels)
- **White Background**: Clean white canvas background
- **High Quality**: 60 FPS recording at 8 Mbps bitrate
- **Hybrid Transition**: Full multi-phase transition including:
  - Static display of source image
  - Disintegration effect
  - Particle explosion
  - Recombination to target shape
  - Blend to final triangulation
  - Final static display

## Usage

### Running the Export Tool

1. **Start a local web server** (required for loading local images):
   ```bash
   python3 -m http.server 8000
   # or
   npm run serve
   ```

2. **Open the export page**:
   Navigate to `http://localhost:8000/export-hybrid-video.html`

3. **Start recording**:
   Click the "Start Recording & Transition" button

4. **Wait for completion**:
   The transition takes approximately 9 seconds to complete

5. **Download the video**:
   Click the "Download Video" button to save the `.webm` file

### Customizing the Export

You can modify the `export-hybrid-video.html` file to customize:

#### Canvas Dimensions
```html
<canvas id="canvas" width="720" height="1280"></canvas>
```

#### Transition Images
```javascript
image1.src = 'your-image-1.png';
image2.src = 'your-image-2.jpg';
```

**Note**: The example uses `'cover art.jpeg'` which contains a space. While this works in modern browsers when loading from the same directory, consider using URL encoding or renaming files without spaces for better compatibility across different environments.

#### Particle Engine Settings
```javascript
engine = new HybridEngine(canvas, {
    particleCount: 3000,      // Number of particles
    speed: 1.0,               // Animation speed
    enableTriangulation: true,
    triangulationMode: 'hybrid',
    gridSize: 8               // Triangulation grid density
});
```

#### Transition Configuration
```javascript
const config = {
    explosionIntensity: 150,          // Explosion force (50-300)
    explosionTime: 1000,              // Explosion duration (ms)
    recombinationDuration: 2500,      // Recombination duration (ms)
    blendDuration: 2000,              // Blend duration (ms)
    recombinationChaos: 0.3,          // Recombination randomness (0-1)
    vacuumStrength: 0.15,             // Pull strength (0-1)
    particleFadeRate: 0.7,            // Fade rate (0-1)
    staticDisplayDuration: 1000,      // Source display time (ms)
    disintegrationDuration: 1200      // Disintegration time (ms)
};
```

#### Video Recording Settings
```javascript
const stream = canvas.captureStream(60); // Frame rate (FPS)
const options = {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8000000  // Bitrate (8 Mbps)
};
```

## Video Format

The exported video is in WebM format with VP9 codec (or VP8 as fallback). This format is:
- Widely supported by modern browsers
- High quality with good compression
- Open and royalty-free
- Compatible with most video players and editing software

### Converting to Other Formats

If you need a different format (e.g., MP4), you can convert using FFmpeg:

```bash
# Convert to MP4 (H.264)
ffmpeg -i hybrid-transition-9x16.webm -c:v libx264 -preset slow -crf 18 output.mp4

# Convert to MP4 (H.265/HEVC) for better compression
ffmpeg -i hybrid-transition-9x16.webm -c:v libx265 -preset slow -crf 20 output.mp4

# Convert to animated GIF
ffmpeg -i hybrid-transition-9x16.webm -vf "fps=30,scale=360:-1:flags=lanczos" output.gif
```

## Browser Compatibility

The video export feature requires:
- Modern browser with WebGL support
- Canvas API `captureStream()` method
- MediaRecorder API
- WebM video codec support

Supported browsers:
- Chrome/Edge 47+
- Firefox 43+
- Opera 36+
- Safari 14.1+ (with some limitations)

## Troubleshooting

### Video file is empty or corrupt
- Ensure the transition completes fully before stopping
- Try increasing the wait time before stopping the recorder
- Check browser console for errors

### Recording is choppy or low FPS
- Reduce the particle count
- Lower the canvas resolution
- Close other applications to free up resources
- Try recording in a different browser

### Images don't load
- Make sure you're running a local web server (not opening the file directly)
- Check that image paths are correct
- Verify images are in the same directory as the HTML file

### MediaRecorder not supported
- Update your browser to the latest version
- Try a different browser (Chrome recommended)
- Check if WebM codec is available in your browser

## Technical Details

### Recording Process

1. **Canvas Stream Creation**: The canvas is captured as a MediaStream at 60 FPS
2. **MediaRecorder Setup**: A MediaRecorder is initialized with WebM/VP9 settings
3. **Recording Start**: Recording begins before the transition starts
4. **Transition Execution**: The hybrid transition runs through all phases
5. **Recording Stop**: After the transition completes, recording is stopped
6. **Blob Creation**: Video chunks are combined into a Blob
7. **Download**: The Blob is converted to a downloadable file

### Performance Considerations

- Recording is CPU-intensive and may affect animation smoothness
- Higher particle counts increase memory usage and processing time
- Canvas size affects video file size and rendering performance
- Bitrate affects both quality and file size

## Examples

### Different Aspect Ratios

#### 16:9 Landscape
```html
<canvas id="canvas" width="1920" height="1080"></canvas>
```

#### 1:1 Square
```html
<canvas id="canvas" width="1080" height="1080"></canvas>
```

#### 21:9 Ultrawide
```html
<canvas id="canvas" width="2560" height="1080"></canvas>
```

### Different Backgrounds

#### Black Background
```css
#canvas {
    background: black;
}
```

#### Gradient Background
```css
#canvas {
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}
```

## See Also

- [HYBRID_PAGE_TRANSITION_API.md](./HYBRID_PAGE_TRANSITION_API.md) - Full API documentation
- [test-hybrid.html](./test-hybrid.html) - Interactive testing interface
- [README.md](./README.md) - Main project documentation

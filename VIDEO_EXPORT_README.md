# Video Export Feature for Hybrid Transitions

This document explains how to export videos of hybrid transitions from the WebGL Particle Engine.

## Overview

The `export-hybrid-video.html` file demonstrates how to create and export a video of a hybrid particle transition between two images. The exported video showcases the full transition effect from one image to another with particle disintegration, explosion, recombination, and blending phases.

## Important Note for Cloudflare Deployment

**The video export feature is designed for local development use.** Due to Cloudflare Workers' asset size limits, the example files (`hybrid-transition-9x16.webm`, `cover art.jpeg`) are excluded from cloud deployments. 

- **Local Use**: Full functionality with example images and videos
- **Cloud Deployment**: Feature available but requires users to provide their own images

## Example Output

The included `hybrid-transition-9x16.webm` video demonstrates a transition from `indrolend.png` to `cover art.jpeg` in a 9:16 (portrait) aspect ratio with a white background. This file is available for local development only.

## Features

- **Image Upload**: User-friendly interface to upload custom images for transitions
- **Image Previews**: See thumbnails of uploaded images before recording
- **MP4 Video Export**: Automatically converts recorded videos to MP4 format with H.264 codec
- **WebM Fallback**: Gracefully falls back to WebM if conversion is unavailable
- **Video Recording**: Uses the Canvas API's `captureStream()` method with `MediaRecorder` to record the canvas animation
- **9:16 Aspect Ratio**: Portrait video format (720x1280 pixels)
- **White Background**: Clean white canvas background
- **High Quality**: 60 FPS recording at 8 Mbps bitrate
- **Error Handling**: Graceful handling of invalid or corrupted image files
- **Hybrid Transition**: Full multi-phase transition including:
  - Static display of source image
  - Disintegration effect
  - Particle explosion
  - Recombination to target shape
  - Blend to final triangulation
  - Final static display

## Usage

### Running the Export Tool

1. **Start a local web server** (required for ES6 modules):
   ```bash
   python3 -m http.server 8000
   # or
   npm run serve
   ```

2. **Open the export page**:
   Navigate to `http://localhost:8000/export-hybrid-video.html`

3. **Upload your images**:
   - Click "Choose File" for Source Image (Image 1)
   - Click "Choose File" for Target Image (Image 2)
   - Preview thumbnails will appear after each upload
   - The "Start Recording" button will enable once both images are uploaded

4. **Start recording**:
   Click the "Start Recording & Transition" button
   - The page will load the video converter (FFmpeg.wasm)
   - Recording will begin automatically

5. **Wait for completion**:
   The transition takes approximately 9 seconds to complete
   - The video is recorded in WebM format first
   - Automatic conversion to MP4 happens after recording

6. **Download the video**:
   Click the "Download Video" button to save the `.mp4` file (or `.webm` if conversion failed)

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

### MP4 Output (Default)

The exported video is automatically converted to **MP4 format with H.264 codec** for maximum compatibility:
- **Codec**: H.264 (libx264) - universally supported across all devices
- **Container**: MP4 - compatible with all video players and editing software
- **Quality**: CRF 22 (high quality with reasonable file size)
- **Optimization**: Fast-start flag enabled for instant web playback
- **Conversion**: Performed client-side using FFmpeg.wasm (no server upload required)

### WebM Fallback

If the MP4 conversion fails (due to network issues or browser restrictions), the video is saved as WebM:
- **Codec**: VP9 (or VP8 as fallback)
- **Container**: WebM - widely supported by modern browsers
- **Quality**: High quality with good compression
- **Open Source**: Royalty-free format

The page will indicate which format is available in the status message.

### Manual Conversion (if needed)

If you have a WebM file and need to convert it manually, you can use FFmpeg:

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
- WebM video codec support (for recording)
- WebAssembly support (for MP4 conversion)

**MP4 Conversion Support:**
- Chrome/Edge 57+ (WebAssembly support)
- Firefox 52+ (WebAssembly support)
- Safari 11+ (WebAssembly support)
- Opera 44+ (WebAssembly support)

**Recording Support:**
- Chrome/Edge 47+
- Firefox 43+
- Opera 36+
- Safari 14.1+ (with some limitations)

**Note**: If MP4 conversion fails, videos are saved as WebM which works in all supported browsers.

## Troubleshooting

### MP4 conversion fails or videos save as WebM
- **Cross-Origin Isolation**: MP4 conversion requires Cross-Origin Isolation headers. The `_headers` file in the deployment directory configures these for Cloudflare Pages:
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- Check browser console for FFmpeg loading errors
- Ensure internet connection is stable (FFmpeg.wasm loads from CDN)
- Try a different browser (Chrome/Edge recommended)
- If conversion consistently fails, use the WebM file and convert manually using FFmpeg
- **For other hosting providers**: Ensure these headers are set for the export page (see DEPLOYMENT.md for details)

### Video file is empty or corrupt
- Ensure the transition completes fully before stopping
- Try increasing the wait time before stopping the recorder
- Check browser console for errors

### Recording is choppy or low FPS
- Reduce the particle count
- Lower the canvas resolution
- Close other applications to free up resources
- Try recording in a different browser

### Images don't load or show error
- Make sure you're uploading valid image files (JPEG, PNG, GIF, WebP, etc.)
- Check that the file is not corrupted
- Ensure the image file size is reasonable (very large images may cause performance issues)
- Make sure you're running a local web server (required for ES6 modules)

### MediaRecorder not supported
- Update your browser to the latest version
- Try a different browser (Chrome recommended)
- Check if WebM codec is available in your browser

## Technical Details

### Recording and Conversion Process

1. **FFmpeg Initialization**: FFmpeg.wasm is loaded dynamically from CDN on first use
2. **Canvas Stream Creation**: The canvas is captured as a MediaStream at 60 FPS
3. **MediaRecorder Setup**: A MediaRecorder is initialized with WebM/VP9 settings
4. **Recording Start**: Recording begins before the transition starts
5. **Transition Execution**: The hybrid transition runs through all phases
6. **Recording Stop**: After the transition completes, recording is stopped
7. **WebM Blob Creation**: Video chunks are combined into a WebM Blob
8. **MP4 Conversion**: FFmpeg.wasm converts WebM to MP4 with H.264 codec
9. **Download**: The MP4 Blob is converted to a downloadable file

### MP4 Conversion Technology

The page uses **FFmpeg.wasm** for client-side video conversion:
- **Library**: FFmpeg.wasm v0.12.10 (WebAssembly port of FFmpeg)
- **Loading**: Dynamically imported from esm.sh CDN
- **Processing**: All conversion happens in your browser (no server upload)
- **Privacy**: Your videos never leave your computer
- **Settings**:
  - Video codec: libx264 (H.264)
  - Preset: fast (balanced speed/quality)
  - CRF: 22 (constant quality mode)
  - Movflags: +faststart (optimized for web streaming)

### Performance Considerations

- **Recording**: CPU-intensive and may affect animation smoothness
- **Conversion**: Takes a few seconds depending on video length and device
- **Memory**: Requires sufficient RAM for video processing
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

# ZGameEditor Visualizer Installation Guide

This guide will help you install and use the pre-made `.zgeproj` files in FL Studio's ZGameEditor Visualizer plugin.

## Prerequisites

- **FL Studio** version 20.8 or later (20.9+ recommended)
- **ZGameEditor Visualizer** plugin (included with FL Studio)
- Windows, macOS, or Linux

## Installation Steps

### Step 1: Locate Your FL Studio Effects Folder

The ZGameEditor Visualizer plugin looks for project files in specific directories:

#### Windows
```
C:\Program Files\Image-Line\FL Studio\Plugins\Fruity\Effects\ZGameEditor Visualizer\
```
or
```
C:\Users\[YourUsername]\Documents\Image-Line\FL Studio\Plugins\Fruity\Effects\ZGameEditor Visualizer\
```

#### macOS
```
/Applications/FL Studio.app/Contents/Resources/FL/Plugins/Fruity/Effects/ZGameEditor Visualizer/
```
or
```
~/Library/Application Support/Image-Line/FL Studio/Plugins/Fruity/Effects/ZGameEditor Visualizer/
```

#### Linux (via Wine)
```
~/.wine/drive_c/Program Files/Image-Line/FL Studio/Plugins/Fruity/Effects/ZGameEditor Visualizer/
```

### Step 2: Copy .zgeproj Files

1. Download all `.zgeproj` files from the `zgameeditor-exports/` directory:
   - `particle-explosion.zgeproj`
   - `blob-metaballs.zgeproj`
   - `mesh-morph.zgeproj`
   - `triangulation.zgeproj`
   - `hybrid-transition.zgeproj`
   - `audio-spectrum-visualizer.zgeproj`

2. Copy these files to your ZGameEditor Visualizer effects folder (see Step 1)

3. Optionally, create a subfolder for better organization:
   ```
   ZGameEditor Visualizer/WebGL-Particle-Effects/
   ```

### Step 3: Load ZGameEditor Visualizer in FL Studio

1. **Open FL Studio** and create a new project or open an existing one

2. **Open the Mixer** (F9 or View > Mixer)

3. **Select a mixer track** that has audio you want to visualize

4. **Add ZGameEditor Visualizer**:
   - Click on an empty **FX slot** in the mixer
   - Navigate to: `Fruity` > `ZGameEditor Visualizer`
   - The plugin window will open

### Step 4: Load a .zgeproj File

1. In the ZGameEditor Visualizer window, click the **folder icon** or **"Load"** button

2. Browse to the location where you copied the `.zgeproj` files

3. Select one of the visualizer files (e.g., `particle-explosion.zgeproj`)

4. Click **Open**

5. The visualizer should immediately start rendering with audio reactivity!

### Step 5: Adjust Parameters

Each visualizer has 5-6 controllable parameters exposed to FL Studio:

1. **In the ZGameEditor Visualizer window**, you'll see parameter sliders on the right side

2. **Adjust parameters** in real-time:
   - Move sliders to change visual properties
   - All parameters are mapped from 0-1 range to their actual value ranges
   - Changes are reflected immediately

3. **Automate parameters** (optional):
   - Right-click any parameter in FL Studio
   - Select **"Create automation clip"**
   - Draw automation curves in the playlist

### Step 6: Configure Audio Source

1. Make sure the mixer track with ZGameEditor Visualizer **receives audio**

2. **Route audio to the track**:
   - Send audio from instruments or mixer tracks to this track
   - Or use the **Master** output for overall mix visualization

3. **Verify audio analysis**:
   - Play your music
   - The visualizer should respond to audio in real-time
   - If not responding, check mixer routing

## Usage Tips

### For Best Results

1. **Start with default parameters** (sliders at 50% position)
2. **Play music with strong beats** for optimal audio reactivity
3. **Adjust resolution** in ZGameEditor settings for performance:
   - 1280x720 for real-time editing
   - 1920x1080 for recording/streaming
   - 3840x2160 for high-quality exports

### Performance Optimization

If you experience lag or low frame rate:

1. **Lower the resolution** in ZGameEditor Visualizer settings
2. **Reduce particle counts** using the first parameter slider
3. **Close other applications** to free up GPU resources
4. **Update graphics drivers** to the latest version

### Rendering to Video

To export your visualization as a video:

1. In FL Studio, go to **File** > **Export** > **Video**
2. Configure export settings:
   - Resolution: 1920x1080 or 3840x2160
   - Frame rate: 30 or 60 FPS
   - Quality: High or Best
3. Click **Start** to begin rendering

## Troubleshooting

### Visualizer Won't Load

**Problem**: .zgeproj file won't open or shows errors

**Solutions**:
- Ensure the file is in the correct ZGameEditor Visualizer directory
- Check that the file wasn't corrupted during download
- Try copying the file again
- Restart FL Studio

### No Audio Response

**Problem**: Visualizer runs but doesn't react to audio

**Solutions**:
- Verify audio is routed to the mixer track with the visualizer
- Check that the mixer track is not muted
- Increase the volume/level of audio sources
- Try using the Master output as audio source
- Ensure "Audio Analysis" is enabled in ZGameEditor settings

### Black Screen or Visual Artifacts

**Problem**: Screen is black or shows strange glitches

**Solutions**:
- Update your graphics drivers
- Try a different visualizer file to isolate the issue
- Lower the resolution in ZGameEditor settings
- Restart FL Studio
- Check GPU compatibility (OpenGL ES 2.0 required)

### Low Frame Rate / Choppy Playback

**Problem**: Visualizer is slow or laggy

**Solutions**:
- Reduce resolution to 1280x720 or lower
- Lower particle/element counts using parameters
- Close other GPU-intensive applications
- Disable other visual effects running simultaneously
- Use a simpler visualizer (e.g., audio-spectrum-visualizer)

### Parameters Not Responding

**Problem**: Moving sliders has no effect on visuals

**Solutions**:
- Reload the .zgeproj file
- Restart ZGameEditor Visualizer
- Check that parameters are properly exposed (they should appear as sliders)
- Verify the parameter values are being updated (watch the slider values)

## Available Visualizers

### 1. particle-explosion.zgeproj
Explosive particle system radiating from center
- **Best for**: EDM, Bass Music, Trap, Dubstep
- **Parameters**: Density, Radius, Size, RGB Colors

### 2. blob-metaballs.zgeproj
Organic blob shapes with smooth blending
- **Best for**: Ambient, Chillout, Downtempo, Experimental
- **Parameters**: Blob Count, Threshold, Radius, Tension, Softness

### 3. mesh-morph.zgeproj
Elastic mesh with texture warping
- **Best for**: House, Techno, Trance, Progressive
- **Parameters**: Grid Density, Deform, Warp, Elasticity, Color Shift

### 4. triangulation.zgeproj
Low-poly triangulated rendering
- **Best for**: Synthwave, Retrowave, Glitch, IDM
- **Parameters**: Triangle Size, Edge Thickness, Edge Brightness, Color Variation, Displacement

### 5. hybrid-transition.zgeproj
Multi-phase particle-to-image transition
- **Best for**: Cinematic, Film Scores, Dramatic Builds
- **Parameters**: Transition Phase, Particle Count, Explosion Radius, Color Blend, Turbulence

### 6. audio-spectrum-visualizer.zgeproj
Classic spectrum analyzer
- **Best for**: All music genres, Live performances
- **Parameters**: Bar Count, Spacing, Height Scale, Smoothing, Visual Mode

## Further Reading

- [LOADING_GUIDE.md](LOADING_GUIDE.md) - Detailed guide for advanced customization
- [README.md](README.md) - Overview of all shaders and their features
- [FL Studio Manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/) - Official FL Studio documentation

## Support

For issues or questions:
1. Check this troubleshooting section first
2. Review the [LOADING_GUIDE.md](LOADING_GUIDE.md) for detailed instructions
3. Consult FL Studio forums and community
4. Check the repository issues page

---

**Enjoy creating stunning audio-reactive visuals!** 🎨🎵

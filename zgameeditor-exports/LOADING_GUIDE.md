# ZGameEditor Visualizer - Loading Guide

Step-by-step instructions for loading and using the WebGL Particle Engine shaders in FL Studio.

## Quick Start

**New!** Pre-made `.zgeproj` files are now available for immediate use in FL Studio. See the [Installation Guide](INSTALLATION.md) for the fastest way to get started!

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing ZGameEditor Visualizer](#installing-zgameeditor-visualizer)
3. [Using Pre-Made .zgeproj Files](#using-pre-made-zgeproj-files) ⭐ **NEW & RECOMMENDED**
4. [Loading Shader Files (Advanced)](#loading-shader-files-advanced)
5. [Mapping Audio Inputs](#mapping-audio-inputs)
6. [Using Presets](#using-presets)
7. [Customizing Parameters](#customizing-parameters)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Tips](#advanced-tips)

---

## Prerequisites

### Required Software
- **FL Studio** version 20.8 or later (20.9+ recommended)
- **ZGameEditor Visualizer** plugin (included with FL Studio)

### Recommended Hardware
- **GPU**: Any graphics card with OpenGL ES 2.0 support
- **RAM**: 4GB minimum, 8GB+ recommended
- **Display**: 1920x1080 or higher resolution

### Preparation
1. Download all shader files from `/zgameeditor-exports/shaders/`
2. Download preset files from `/zgameeditor-exports/presets/`
3. Create a working folder: `Documents/FL Studio/ZGameEditor Shaders/`

---

## Installing ZGameEditor Visualizer

ZGameEditor Visualizer comes bundled with FL Studio, but here's how to access it:

### Step 1: Open FL Studio
Launch FL Studio and create a new project or open an existing one.

### Step 2: Add the Plugin
1. Open the **Mixer** (F9 or View > Mixer)
2. Select an empty mixer track
3. Click on an empty **FX slot**
4. Navigate to: `Generators > ZGameEditor Visualizer`
5. The plugin window will open

### Alternative Method
1. Click **Add** in the top menu
2. Select **More plugins...**
3. Find **ZGameEditor Visualizer** in the list
4. Double-click to load

---

## Using Pre-Made .zgeproj Files

⭐ **RECOMMENDED METHOD** - The easiest way to use these visualizers!

Complete `.zgeproj` files are now available with all audio processing, parameters, and shaders pre-configured. This is the recommended method for most users.

### Quick Start

1. **Copy .zgeproj Files**
   - Download all 6 `.zgeproj` files from the `zgameeditor-exports/` directory
   - Copy them to your ZGameEditor Visualizer effects folder
   - See [INSTALLATION.md](INSTALLATION.md) for detailed folder locations

2. **Load in FL Studio**
   - Open ZGameEditor Visualizer plugin
   - Click the **folder icon** or **Load** button
   - Browse to your `.zgeproj` files
   - Select one and click **Open**

3. **Start Visualizing**
   - The visualizer immediately starts with audio reactivity
   - All parameters are pre-configured and exposed to FL Studio
   - Adjust sliders on the right side to customize
   - No manual setup required!

### Available .zgeproj Files

All files include:
- ✅ Complete audio processing (bass, mid, high, beat detection)
- ✅ Pre-configured parameters exposed to FL Studio
- ✅ Optimized shaders adapted for ZGameEditor
- ✅ Ready-to-use with any audio source

Files:
1. `particle-explosion.zgeproj` - Explosive particle effects
2. `blob-metaballs.zgeproj` - Organic blob shapes
3. `mesh-morph.zgeproj` - Elastic mesh deformation
4. `triangulation.zgeproj` - Low-poly triangulated rendering
5. `hybrid-transition.zgeproj` - Multi-phase particle transitions
6. `audio-spectrum-visualizer.zgeproj` - Classic spectrum analyzer

### Parameter Controls

Each `.zgeproj` file exposes 5-6 parameters that can be controlled directly from FL Studio:
- Parameters appear as sliders in the ZGameEditor Visualizer window
- All values are automatically mapped to appropriate ranges
- Changes are reflected in real-time
- Can be automated using FL Studio automation clips

---

## Loading Shader Files (Advanced)

**Note:** This method is for advanced users who want to manually set up shaders. For most users, we recommend using the pre-made `.zgeproj` files above.

### Method 1: Using .zgeproj Files (Easiest)

See the section above "Using Pre-Made .zgeproj Files" for the recommended approach.

### Method 2: Manual GLSL Import (Advanced)

⚠️ **Warning:** This method requires manual configuration of audio arrays, parameters, and shader uniforms. It's significantly more complex than using the pre-made `.zgeproj` files.

**Important Limitations:**
- Raw `.frag` files cannot be directly loaded into ZGameEditor Visualizer
- They must be embedded in a complete `.zgeproj` XML structure
- Audio processing logic must be manually implemented
- Parameter bindings must be configured
- This approach is only recommended for developers or advanced users

If you still want to proceed with manual import:

1. **Open ZGameEditor Visualizer**
   - The plugin window should be open

2. **Access the Code Editor**
   - Click the **Edit** button (or press F9 in the plugin window)
   - This opens the ZGameEditor IDE

3. **Create Complete Project Structure**
   - You need to manually create:
     - `SpecBandArray` and `AudioArray` for audio data
     - ZExpression components for audio processing
     - Parameter arrays and help constants
     - Material and Shader components
     - OnUpdate and OnRender logic

4. **Import Fragment Shader**
   - In the shader properties, find **FragmentShaderSource**
   - Copy the entire contents of your `.frag` file
   - **Modify the shader** to remove `iChannel0` references (not supported)
   - Paste into the shader source editor

5. **Configure Audio Processing**
   - Add ZExpression to extract bass, mid, high frequencies
   - Implement beat detection logic
   - Map parameter arrays to shader uniforms

6. **Save and Test**
   - Click **Compile** to check for errors
   - Save your project as `.zgeproj`
   - Test with audio to verify reactivity

**Recommendation:** Instead of following these complex steps, use the pre-made `.zgeproj` files which have all of this done for you!

---

## Mapping Audio Inputs

Audio reactivity requires proper mapping of audio signals to shader uniforms.

### Step 1: Understanding Audio Sources

FL Studio can provide audio from:
- **Mixer Track**: Audio routed to the track
- **Master Output**: Overall mix
- **Sidechain Input**: External audio source

### Step 2: Enable Audio Analysis

1. **In ZGameEditor Visualizer**
   - Click **Settings** or **Options**
   - Enable **Audio Analysis**
   - Select **Audio Source**: Choose "Track" or "Master"

2. **Configure Frequency Bands**
   - Set **Bass Range**: 20-250 Hz
   - Set **Mid Range**: 250-4000 Hz
   - Set **High Range**: 4000-20000 Hz

### Step 3: Map Uniforms to Audio

#### Using Built-in Variables

ZGameEditor provides these automatic variables:
- `Time` → maps to `iTime`
- `ScreenWidth`, `ScreenHeight` → maps to `iResolution`

#### Creating Audio Variables

1. **Add Audio Variables**
   - In ZGameEditor, add **Variable** components
   - Name them: `AudioBass`, `AudioMid`, `AudioHigh`, `AudioBeat`

2. **Link to Audio Analysis**
   - For each variable, set **Expression** or **Value Source**
   - Link to FL Studio's audio analysis outputs

3. **Map to Shader Uniforms**
   ```glsl
   // In your shader, these uniforms expect values from FL Studio:
   uniform float iBeat;     // 0-1, spikes on beats
   uniform float iBass;     // 0-1, bass energy
   uniform float iMid;      // 0-1, mid energy
   uniform float iHigh;     // 0-1, high energy
   uniform float iAmplitude; // 0-1, overall volume
   ```

4. **Bind Variables to Uniforms**
   - In shader properties, find **SetShaderVariables**
   - Add bindings:
     - `iBeat` ← `AudioBeat`
     - `iBass` ← `AudioBass`
     - `iMid` ← `AudioMid`
     - `iHigh` ← `AudioHigh`

### Step 4: Audio Spectrum Data

**Important:** The pre-made `.zgeproj` files handle audio data through arrays (`SpecBandArray`, `AudioArray`) instead of textures. This section is only relevant for advanced manual implementations.

For manual implementations, the original `.frag` shaders use `iChannel0` (spectrum texture), but ZGameEditor uses arrays instead:

**In .zgeproj files (recommended):**
- Audio data comes from `SpecBandArray[32]` - frequency spectrum
- Waveform data comes from `AudioArray[32]` - raw audio samples
- These are automatically provided by FL Studio
- No texture sampling needed

**For reference only - spectrum texture approach:**
If you were manually implementing texture-based spectrum (not recommended):

1. **Create Audio Texture**
   - Add a **Bitmap** resource
   - Set **Width**: 512, **Height**: 2
   - Enable **AudioSpectrum** mode

2. **Bind to Shader**
   - In shader, add:
     ```glsl
     uniform sampler2D iChannel0;
     ```
   - In ZGameEditor, bind the audio bitmap to texture unit 0

**Note:** Our pre-made `.zgeproj` files use array-based audio processing which is more efficient and reliable in ZGameEditor.

### Example Audio Mapping Code

```xml
<!-- ZGameEditor XML snippet for audio mapping -->
<Variables>
  <Variable Name="AudioBeat" Source="BeatDetection"/>
  <Variable Name="AudioBass" Source="FrequencyBand" Range="0,250"/>
  <Variable Name="AudioMid" Source="FrequencyBand" Range="250,4000"/>
  <Variable Name="AudioHigh" Source="FrequencyBand" Range="4000,20000"/>
  <Variable Name="AudioAmp" Source="RMSLevel"/>
</Variables>

<ShaderVariables>
  <SetShaderVariable VariableName="iBeat" Value="AudioBeat"/>
  <SetShaderVariable VariableName="iBass" Value="AudioBass"/>
  <SetShaderVariable VariableName="iMid" Value="AudioMid"/>
  <SetShaderVariable VariableName="iHigh" Value="AudioHigh"/>
  <SetShaderVariable VariableName="iAmplitude" Value="AudioAmp"/>
</ShaderVariables>
```

---

## Using Presets

Presets provide quick-start configurations for each shader.

### Loading a Preset

1. **Open the Preset File**
   - Open the `.json` file in a text editor
   - Review the parameter values and audio mappings

2. **Apply Parameter Values**
   - In ZGameEditor, create variables for each user parameter
   - Set initial values from the preset
   - Example for `bass-reactive-particles.json`:
     ```
     u_particleDensity = 50
     u_explosionRadius = 0.5
     u_particleSize = 3.0
     u_colorR = 1.0
     u_colorG = 0.5
     u_colorB = 0.2
     ```

3. **Apply Audio Mappings**
   - Follow the `audioMapping` section in the preset
   - Set smoothing values for each audio input
   - Configure attack/decay for beat detection

4. **Test and Adjust**
   - Play music and observe the visualization
   - Fine-tune parameters to your preference

### Available Presets

#### `bass-reactive-particles.json`
- **Shader**: particle-explosion.frag
- **Style**: Explosive, energetic
- **Best For**: EDM, Bass Music, Trap
- **Key Features**: Strong bass response, beat pulses

#### `frequency-blobs.json`
- **Shader**: blob-metaballs.frag
- **Style**: Organic, flowing
- **Best For**: Ambient, Chillout, Experimental
- **Key Features**: Smooth morphing, multi-frequency blobs

#### `beat-mesh.json`
- **Shader**: mesh-morph.frag
- **Style**: Geometric, rhythmic
- **Best For**: House, Techno, Trance
- **Key Features**: Grid deformation, beat sync

---

## Customizing Parameters

### Real-Time Parameter Control

#### Using FL Studio Automation

1. **Expose Parameters**
   - In ZGameEditor, make variables **Published**
   - They will appear in FL Studio's parameter list

2. **Create Automation Clips**
   - Right-click a parameter in FL Studio
   - Select **Create Automation Clip**
   - Draw automation curves in the playlist

3. **Link to MIDI Controllers**
   - Right-click parameter > **Link to Controller**
   - Move a MIDI knob/slider to assign

#### Using Peak Controllers

1. **Add Peak Controller**
   - Add a **Peak Controller** plugin
   - Set it to analyze audio

2. **Link to Shader Parameters**
   - Route Peak Controller output to shader variables
   - Adjust **Base**, **Vol**, **Tension** for response curve

### Parameter Recommendations

#### For High-Energy Tracks
- Increase `particleDensity` to 80-100
- Boost `explosionRadius` to 0.7-0.8
- Raise `edgeBrightness` to 1.5-2.0

#### For Ambient/Chill
- Lower `particleDensity` to 20-40
- Reduce `deformStrength` to 0.1-0.2
- Increase `smoothing` to 0.9+

#### For Live Performances
- Set moderate particle counts (50-60)
- Enable beat flash effects
- Use high contrast colors

---

## Performance Optimization

### Resolution Settings

1. **Start Low**
   - Begin with 1280x720 (720p)
   - Monitor frame rate (aim for 60 FPS)

2. **Scale Up**
   - If performance is good, increase to 1920x1080
   - For recording, try 2560x1440 or 3840x2160

3. **Configure in FL Studio**
   - ZGameEditor Visualizer > Settings
   - Set **Width** and **Height**
   - Enable **Maintain Aspect Ratio**

### Shader Optimization

#### Reduce Particle Counts
- Lower `u_particleCount` to 50 or less
- Reduce `u_blobCount` to 3-5
- Decrease `u_barCount` to 32 or less

#### Adjust Quality Settings
- Lower `u_gridDensity` to 10 or less
- Reduce `u_triangleSize` for fewer triangles
- Simplify color calculations

#### Use Single Shader
- Run one shader at a time
- Avoid layering multiple visualizers
- Disable unused effects

### System Optimization

1. **Update Drivers**
   - Ensure graphics drivers are current
   - Update FL Studio to latest version

2. **Close Background Apps**
   - Close unnecessary applications
   - Disable overlays (Discord, Steam, etc.)

3. **FL Studio Settings**
   - Set **Buffer Length** appropriately
   - Disable **Smart Disable** for visualizer
   - Use **High Performance** power mode

### Recording/Rendering

For high-quality exports:

1. **Use Offline Rendering**
   - FL Studio > File > Export > Video
   - Set quality to **High** or **Best**
   - Enable **Render to Video File**

2. **Render Settings**
   - Resolution: 1080p or 4K
   - Frame Rate: 60 FPS
   - Codec: H.264 or ProRes

---

## Troubleshooting

### Shader Compilation Errors

**Problem**: Shader won't compile or shows errors

**Solutions**:
1. Check GLSL syntax (ensure ES 1.0 compatibility)
2. Verify all uniforms are declared
3. Check for missing semicolons or brackets
4. Ensure `precision mediump float;` is present
5. Remove any unsupported GLSL functions

### No Audio Response

**Problem**: Visuals don't react to music

**Solutions**:
1. Verify audio is routed to the mixer track
2. Check audio source in ZGameEditor settings
3. Ensure audio analysis is enabled
4. Verify variable bindings are correct
5. Test with high-amplitude audio

### Low Frame Rate

**Problem**: Visualization is choppy or slow

**Solutions**:
1. Reduce canvas resolution to 720p
2. Lower particle/element counts
3. Simplify shader calculations
4. Close other applications
5. Update graphics drivers
6. Try different shader (simpler ones first)

### Visual Artifacts

**Problem**: Glitches, black screens, or strange colors

**Solutions**:
1. Check for division by zero in shader
2. Verify texture coordinates are clamped
3. Ensure color values are in 0-1 range
4. Check for NaN values (use checks)
5. Verify alpha blending is enabled

### Parameters Not Working

**Problem**: Changing parameters has no effect

**Solutions**:
1. Verify uniforms are correctly bound
2. Check variable names match exactly
3. Ensure parameters are published
4. Restart ZGameEditor Visualizer
5. Reload the shader

### Audio Texture Not Working

**Problem**: `iChannel0` shows no spectrum data

**Solutions**:
1. Verify audio bitmap is created
2. Check texture binding to unit 0
3. Ensure spectrum mode is enabled
4. Verify texture dimensions (512x2 recommended)
5. Check sampler2D uniform is declared

---

## Advanced Tips

### Layering Multiple Effects

1. **Use Multiple Instances**
   - Add ZGameEditor Visualizer to multiple tracks
   - Load different shaders on each
   - Blend using mixer effects

2. **Alpha Blending**
   - Set shader output alpha < 1.0
   - Layer transparent effects
   - Use additive or multiply blending

### Creating Custom Presets

1. **Document Your Settings**
   - Save parameter values
   - Note audio mapping configurations
   - Record performance notes

2. **Export as JSON**
   - Follow the preset template structure
   - Include all parameters and ranges
   - Add usage recommendations

### Syncing to Project Tempo

1. **Use FL Studio's Tempo**
   - Access via `PPQ` (pulses per quarter note)
   - Calculate beat timing in shader
   - Sync animations to BPM

2. **Beat Patterns**
   - Create arrays of beat timings
   - Use for complex animation sequences
   - Sync particle spawning to measures

### Live Performance Tips

1. **MIDI Mapping**
   - Map critical parameters to MIDI controllers
   - Create performance presets
   - Use scenes for quick switching

2. **Backup Plans**
   - Have simpler shaders ready
   - Test on performance hardware
   - Prepare static visuals as fallback

3. **Audio Routing**
   - Route specific instruments to visualizer
   - Use sidechain for kick-driven effects
   - Create separate visualizer mixes

### Shader Modifications

To customize shaders:

1. **Edit .frag files** in a text editor
2. **Adjust constants** at the top of shader
3. **Modify color functions** for different palettes
4. **Add custom parameters** as needed
5. **Test incrementally** after changes

### Export for Other Platforms

While designed for ZGameEditor, these shaders can be adapted:

- **ShaderToy**: Already compatible!
- **TouchDesigner**: Minimal modifications needed
- **Resolume**: Convert to FFGL format
- **Unity/Unreal**: Adapt to HLSL

---

## Example Workflow

### Complete Setup for a Track

1. **Prepare Audio**
   - Load your track in FL Studio
   - Set mixer routing

2. **Add Visualizer**
   - Add ZGameEditor Visualizer to a track
   - Set audio source to your music track

3. **Load Shader**
   - Choose a shader (e.g., particle-explosion.frag)
   - Import the code
   - Configure uniforms

4. **Apply Preset**
   - Load matching preset (bass-reactive-particles.json)
   - Set initial parameters

5. **Map Audio**
   - Configure beat detection
   - Set up frequency band analysis
   - Test audio response

6. **Customize**
   - Adjust colors to match your style
   - Fine-tune particle counts
   - Set explosion parameters

7. **Test**
   - Play the track
   - Observe visual response
   - Adjust parameters in real-time

8. **Record**
   - Set resolution (1080p recommended)
   - Export to video
   - Share your visualization!

---

## Additional Resources

### Documentation
- [FL Studio Manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/)
- [ZGameEditor Reference](http://www.zgameeditor.org/)
- [GLSL ES Specification](https://www.khronos.org/files/opengles_shading_language.pdf)

### Community
- [FL Studio Forum](https://forum.image-line.com/)
- [r/FL_Studio](https://www.reddit.com/r/FL_Studio/)
- [ShaderToy](https://www.shadertoy.com/)

### Tutorials
- Search YouTube for "ZGameEditor Visualizer tutorial"
- Check FL Studio's official tutorials
- Explore shader programming resources

---

## Support

For issues specific to these shaders:
- Check the main [README.md](README.md)
- Review shader comments for parameter details
- Test with simpler shaders first

For FL Studio/ZGameEditor issues:
- Consult FL Studio documentation
- Visit Image-Line support
- Check community forums

---

**Happy visualizing!** 🎨🎵

Create stunning audio-reactive visuals and share your creations with the community!

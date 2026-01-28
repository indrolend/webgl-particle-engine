# Testing Guide for MP4 Export Fix

## Overview
This fix enables MP4 video export for the "Export 9:16 Hybrid Transition Video" feature by adding Cross-Origin Isolation headers required by FFmpeg.wasm.

## What Was Fixed
- **Problem**: Videos were exporting as WebM instead of MP4
- **Root Cause**: FFmpeg.wasm requires SharedArrayBuffer, which needs Cross-Origin Isolation headers
- **Solution**: Added `_headers` file with required COOP and COEP headers

## How to Test

### Prerequisites
1. Deploy the changes to Cloudflare Pages
2. Ensure the `_headers` file is in the deployment directory

### Testing Steps

1. **Navigate to the export page**:
   - Go to `https://your-cloudflare-pages-url.pages.dev/export-hybrid-video.html`

2. **Open Browser Developer Tools** (F12):
   - Open the Console tab to monitor FFmpeg loading

3. **Upload two test images**:
   - Click "Choose File" for Image 1 (Source Image)
   - Click "Choose File" for Image 2 (Target Image)
   - Verify preview thumbnails appear

4. **Check headers are applied**:
   - Open Network tab in Developer Tools
   - Reload the page
   - Find the request for `export-hybrid-video.html`
   - Check Response Headers should include:
     - `Cross-Origin-Embedder-Policy: require-corp`
     - `Cross-Origin-Opener-Policy: same-origin`

5. **Start recording**:
   - Click "Start Recording & Transition"
   - Watch the console for messages:
     - ✅ "Using codec: WebM (VP9)" or "Using codec: MP4 (H.264)" depending on browser
     - ✅ Status shows "Recorder ready (WebM (VP9))" or "Recorder ready (MP4 (H.264))"
     - ✅ "Recording started..."
     - ✅ (Chrome/Firefox) "Recording complete, converting to MP4..."
     - ✅ (Safari) "Video ready (MP4)!" (no conversion needed)

6. **Download the video**:
   - Click "Download Video" button
   - Verify filename ends with `.mp4`
   - Verify the status shows "Video ready (MP4)!"

7. **Verify the downloaded file**:
   - Check the file is named `hybrid-transition-9x16.mp4`
   - Open it in a video player
   - Verify it plays correctly and shows the transition

### Expected Results

#### Success Indicators (Chrome/Firefox with WebM)
- ✅ Console shows: "Using codec: WebM (VP9)" or "WebM (VP8)"
- ✅ Console shows: "FFmpeg loaded successfully - MP4 export available"
- ✅ Status message: "Recording complete, converting to MP4..."
- ✅ Status message: "Video ready (MP4)! Click download to save."
- ✅ Downloaded file has `.mp4` extension
- ✅ File type is `video/mp4`
- ✅ Video plays in all major browsers and video players

#### Success Indicators (Safari/Mac with MP4)
- ✅ Console shows: "Using codec: MP4 (H.264)" or "MP4"
- ✅ Status message: "Recorder ready (MP4 (H.264))"
- ✅ Status message: "Video ready (MP4)! Click download to save." (no conversion message)
- ✅ Downloaded file has `.mp4` extension
- ✅ File type is `video/mp4`
- ✅ Video plays in all major browsers and video players

#### Failure Indicators (old version or missing codecs)
- ❌ Error: "mimeType is not supported" → Update to latest version
- ❌ Error: "No supported video codec found" → Browser is too old
- ❌ Console shows: "Failed to load FFmpeg" (not critical on Safari)
- ❌ Status message: "Video ready (WebM)!" → Headers missing or FFmpeg failed

## Browser Compatibility

### Supported Browsers
- Chrome/Edge 47+ ✅ (Records WebM, converts to MP4)
- Firefox 43+ ✅ (Records WebM, converts to MP4)
- Safari 14.1+ ✅ (Records MP4 natively, no conversion needed)
- Opera 36+ ✅ (Records WebM, converts to MP4)

### Notes
- Safari may have stricter requirements for Cross-Origin Isolation
- Test in multiple browsers to ensure compatibility
- Some corporate networks may block CDN access to FFmpeg.wasm

## Troubleshooting

### Headers Not Applied
**Problem**: Headers don't appear in Network tab
**Solution**: 
1. Verify `_headers` file is in the deployment directory
2. Re-deploy to Cloudflare Pages
3. Clear browser cache and hard refresh (Ctrl+Shift+R)

### FFmpeg Still Fails to Load
**Problem**: FFmpeg loading errors even with headers
**Solutions**:
1. Check internet connection (FFmpeg loads from esm.sh CDN)
2. Verify CDN is accessible (some networks block CDN access)
3. Check browser console for detailed error messages
4. Try a different browser

### Video Download Works but Shows WebM
**Problem**: Download works but file is WebM format
**Solution**: This means FFmpeg didn't load. Check:
1. Browser console for FFmpeg errors
2. Network tab for failed CDN requests
3. Headers are correctly set

### Testing Locally
**Note**: Local development servers (python http.server, etc.) don't support `_headers` file.
To test locally with proper headers:
1. Use Cloudflare Wrangler: `npx wrangler pages dev ./public`
2. Or deploy to Cloudflare Pages staging environment

## Files Changed
- `_headers` (new) - Cross-Origin Isolation headers configuration
- `public/_headers` (new) - Deployed copy of headers configuration
- `build.sh` - Updated to copy _headers file
- `DEPLOYMENT.md` - Added documentation about headers requirement
- `VIDEO_EXPORT_README.md` - Added troubleshooting information
- `README.md` - Added video export feature to features list

## Rollback Plan
If issues occur after deployment:
1. Remove the `_headers` file from the deployment
2. Re-deploy without headers
3. Videos will export as WebM (original behavior)
4. Users can manually convert WebM to MP4 using FFmpeg command line

## Additional Notes
- Headers only affect `export-hybrid-video.html`, not other pages
- WebM fallback still works if MP4 conversion fails
- No changes to actual application code, only configuration
- This fix is specific to Cloudflare Pages; other hosts need equivalent configuration

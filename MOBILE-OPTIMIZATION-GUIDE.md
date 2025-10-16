# Mobile Safari Optimization Guide

## 🚨 Safari Crash Prevention

Your Three.js space scene has several potential crash points on Safari, especially mobile Safari. Here's how to fix them:

## Quick Integration (5 minutes)

Add these scripts to your `index.html` **before** your Three.js initialization:

```html
<!-- Add these before your Three.js script -->
<script src="mobile-optimizations.js"></script>
<script src="webgl-fallback.js"></script>
```

Then modify your Three.js initialization:

```javascript
// Replace your init() function with this optimized version
function init() {
  console.log('🚀 Starting optimized Three.js initialization...');
  
  // Initialize mobile optimizer
  const mobileOptimizer = new MobileOptimizer();
  
  // Initialize WebGL fallback
  const webglFallback = new WebGLFallback();
  
  // Check if we should use fallback mode
  if (webglFallback.isFallbackMode()) {
    console.log('🎮 Using fallback mode for better compatibility');
    return; // Fallback mode handles everything
  }
  
  // Get optimized settings for this device
  const performanceSettings = mobileOptimizer.getPerformanceSettings();
  const rendererOptions = mobileOptimizer.getOptimizedRendererOptions();
  
  // Use optimized camera settings
  const cameraSettings = mobileOptimizer.getOptimizedCameraSettings();
  camera = new THREE.PerspectiveCamera(
    cameraSettings.fov, 
    window.innerWidth / window.innerHeight, 
    cameraSettings.near, 
    cameraSettings.far
  );
  camera.position.set(cameraSettings.position.x, cameraSettings.position.y, cameraSettings.position.z);
  
  // Use optimized renderer
  renderer = new THREE.WebGLRenderer(rendererOptions);
  renderer.setPixelRatio(performanceSettings.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  // Setup WebGL protection
  mobileOptimizer.setupWebGLProtection(renderer);
  
  // Use optimized lighting
  const lighting = mobileOptimizer.getOptimizedLighting();
  // ... rest of your Three.js setup using optimized values
  
  // Use optimized star count
  const starCount = mobileOptimizer.getOptimizedStarCount();
  // ... create stars with optimized count
  
  // Enable touch optimizations
  mobileOptimizer.optimizeTouchGestures();
  
  console.log('✅ Optimized Three.js initialization complete');
}
```

## Key Optimizations Applied

### 1. **WebGL Context Loss Prevention**
- Monitors WebGL context loss events
- Gracefully handles crashes with fallback mode
- Prevents infinite crash loops

### 2. **Memory Management**
- Tracks memory usage in real-time
- Triggers cleanup when memory usage > 80%
- Emergency cleanup when memory usage > 95%
- Removes non-essential objects during memory pressure

### 3. **Mobile-Specific Optimizations**
- Reduces texture sizes on mobile devices
- Disables antialiasing on mobile for performance
- Uses lower precision shaders on mobile
- Reduces star count from 400 to 150-200 on mobile
- Clamps pixel ratio to 1 on mobile devices

### 4. **Safari-Specific Fixes**
- Detects problematic WebGL drivers
- Uses WebGL 1.0 compatibility mode when needed
- Implements fallback for unsupported features
- Handles Safari's aggressive memory management

### 5. **Touch Gesture Optimization**
- Prevents pinch-zoom interference
- Optimizes pan gestures for mobile
- Handles touch event conflicts

## Testing Your Optimizations

### 1. **Run Automated Tests**
```bash
# Make sure your local server is running
python -m http.server 3000

# Run the comprehensive test suite
node test-mobile-devices.mjs
```

### 2. **Test on Real Devices**
```bash
# Use ngrok for external testing
npx ngrok http 3000

# Test the ngrok URL on real mobile devices
```

### 3. **Manual Testing Checklist**
- [ ] Load on iPhone Safari (iOS 16+)
- [ ] Load on iPad Safari
- [ ] Test with slow 3G connection
- [ ] Test with device in low power mode
- [ ] Test with multiple tabs open
- [ ] Test after device has been running for hours

## Performance Targets

| Device Type | Target FPS | Max Memory | Load Time |
|-------------|------------|------------|-----------|
| iPhone 15 Pro | 60 FPS | 400MB | < 3s |
| iPhone 12 | 45 FPS | 200MB | < 4s |
| iPad Pro | 60 FPS | 600MB | < 3s |
| Older iOS | 30 FPS | 150MB | < 5s |

## Common Safari Issues & Solutions

### Issue: "WebGL context lost"
**Solution**: The fallback system automatically handles this

### Issue: "Out of memory" crashes
**Solution**: Memory monitoring triggers cleanup automatically

### Issue: Slow performance on mobile
**Solution**: Mobile optimizations reduce quality automatically

### Issue: Touch gestures not working
**Solution**: Touch optimization handles gesture conflicts

## Advanced Configuration

### Customize Performance Settings
```javascript
// Override default settings for your specific needs
const customSettings = {
  pixelRatio: 1, // Force 1x pixel ratio for performance
  maxStars: 100, // Further reduce stars if needed
  enableShadows: false, // Disable shadows on mobile
  textureQuality: 'low' // Use low quality textures
};
```

### Add Custom Fallback Content
```javascript
// Customize the fallback experience
webglFallback.customEarthImage = 'your-earth-image.png';
webglFallback.customText = 'Your custom message';
```

## Monitoring & Analytics

The system automatically logs performance metrics. Check browser console for:
- Memory usage warnings
- Frame rate drops
- WebGL context issues
- Fallback mode activations

## Troubleshooting

### If tests fail:
1. Check that local server is running on port 3000
2. Ensure all dependencies are installed: `npm install`
3. Check browser console for error messages
4. Try running individual test files separately

### If site still crashes on Safari:
1. Enable fallback mode by default
2. Further reduce quality settings
3. Consider removing complex orbital objects
4. Implement progressive loading

## Next Steps

1. **Run the tests** to identify specific issues
2. **Integrate the optimizations** into your main site
3. **Test on real devices** using the provided URLs
4. **Monitor performance** in production
5. **Iterate based on real-world feedback**

The optimizations are designed to be non-breaking - your site will work exactly the same on desktop while being much more stable on mobile Safari.

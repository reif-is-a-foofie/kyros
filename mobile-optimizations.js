// Mobile Safari optimizations and crash prevention
class MobileOptimizer {
  constructor() {
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.memoryLimit = this.estimateMemoryLimit();
    this.currentMemoryUsage = 0;
    
    console.log('📱 Mobile Optimizer initialized:', {
      isMobile: this.isMobile,
      isSafari: this.isSafari,
      isIOS: this.isIOS,
      devicePixelRatio: this.devicePixelRatio,
      estimatedMemoryLimit: this.memoryLimit + 'MB'
    });
  }

  estimateMemoryLimit() {
    // Rough memory limit estimation based on device
    if (this.isIOS) {
      // iOS devices typically have less available memory
      if (this.devicePixelRatio >= 3) return 512; // iPhone Pro models
      if (this.devicePixelRatio >= 2) return 256; // Standard iPhones
      return 128; // Older devices
    }
    return 1024; // Desktop/Android
  }

  // WebGL context loss prevention
  setupWebGLProtection(renderer) {
    if (!renderer || !this.isSafari) return;

    console.log('🛡️ Setting up WebGL protection for Safari...');

    // Monitor WebGL context
    const canvas = renderer.domElement;
    
    canvas.addEventListener('webglcontextlost', (event) => {
      console.warn('🚨 WebGL context lost - preventing default');
      event.preventDefault();
      this.handleWebGLContextLoss(renderer);
    });

    canvas.addEventListener('webglcontextrestored', () => {
      console.log('✅ WebGL context restored');
      this.handleWebGLContextRestore(renderer);
    });

    // Add memory pressure monitoring
    if (window.performance && window.performance.memory) {
      this.startMemoryMonitoring();
    }
  }

  handleWebGLContextLoss(renderer) {
    // Disable animation loop
    if (renderer.setAnimationLoop) {
      renderer.setAnimationLoop(null);
    }
    
    // Show fallback message
    this.showFallbackMessage('WebGL context lost - reloading...');
    
    // Attempt recovery after delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  handleWebGLContextRestore(renderer) {
    // Re-enable animation loop
    if (window.animate && renderer.setAnimationLoop) {
      renderer.setAnimationLoop(window.animate);
    }
  }

  // Memory monitoring and management
  startMemoryMonitoring() {
    setInterval(() => {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        const usagePercent = (usedMB / limitMB) * 100;
        
        this.currentMemoryUsage = usedMB;
        
        if (usagePercent > 80) {
          console.warn(`⚠️ High memory usage: ${usedMB.toFixed(1)}MB (${usagePercent.toFixed(1)}%)`);
          this.triggerMemoryCleanup();
        }
        
        if (usagePercent > 95) {
          console.error('🚨 Critical memory usage - forcing cleanup');
          this.emergencyMemoryCleanup();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  triggerMemoryCleanup() {
    console.log('🧹 Triggering memory cleanup...');
    
    // Clear unused textures
    if (window.scene) {
      this.clearUnusedTextures();
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  emergencyMemoryCleanup() {
    console.log('🚨 Emergency memory cleanup...');
    
    // Remove non-essential objects
    if (window.orbitalObjects) {
      window.orbitalObjects.slice(2).forEach(obj => {
        if (obj.parent) {
          obj.parent.remove(obj);
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      window.orbitalObjects = window.orbitalObjects.slice(0, 2);
    }
    
    this.triggerMemoryCleanup();
  }

  clearUnusedTextures() {
    // Clear texture cache
    if (THREE && THREE.Cache) {
      THREE.Cache.clear();
    }
  }

  // Mobile-specific Three.js optimizations
  getOptimizedRendererOptions() {
    const baseOptions = {
      antialias: !this.isMobile, // Disable antialiasing on mobile for performance
      alpha: false,
      powerPreference: "high-performance"
    };

    if (this.isMobile) {
      // Mobile-specific optimizations
      return {
        ...baseOptions,
        precision: "mediump", // Lower precision for mobile
        logarithmicDepthBuffer: false, // Disable for performance
        stencil: false, // Disable stencil buffer
        depth: true
      };
    }

    return baseOptions;
  }

  // Optimize textures for mobile
  optimizeTextureForMobile(texture, maxSize = 1024) {
    if (!this.isMobile) return texture;

    // Reduce texture size on mobile
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const size = Math.min(maxSize, 512); // Cap at 512px for mobile
    canvas.width = size;
    canvas.height = size;
    
    // Create downscaled version
    ctx.drawImage(texture.image, 0, 0, size, size);
    
    const optimizedTexture = new THREE.CanvasTexture(canvas);
    optimizedTexture.colorSpace = THREE.SRGBColorSpace;
    optimizedTexture.generateMipmaps = true;
    optimizedTexture.minFilter = THREE.LinearMipmapLinearFilter;
    optimizedTexture.magFilter = THREE.LinearFilter;
    
    return optimizedTexture;
  }

  // Mobile-friendly camera settings
  getOptimizedCameraSettings() {
    if (this.isMobile) {
      return {
        fov: 45, // Smaller FOV for mobile
        near: 0.1,
        far: 1000, // Reduced far plane
        position: { x: 0, y: 0, z: 22 } // Closer camera for mobile
      };
    }
    
    return {
      fov: 60,
      near: 1,
      far: 2000,
      position: { x: 0, y: 0, z: 28 }
    };
  }

  // Reduce star count on mobile
  getOptimizedStarCount() {
    if (this.isMobile) {
      return this.isIOS ? 150 : 200; // Even fewer stars on iOS
    }
    return 400;
  }

  // Mobile-friendly lighting setup
  getOptimizedLighting() {
    if (this.isMobile) {
      return {
        sunLight: { color: 0xffffff, intensity: 4 }, // Reduced intensity
        ambientLight: { color: 0xffffff, intensity: 0.3 },
        rimLight: { color: 0xd4e5ff, intensity: 3 },
        textLight: { color: 0xfff8e7, intensity: 3, distance: 25 }
      };
    }
    
    return {
      sunLight: { color: 0xffffff, intensity: 8 },
      ambientLight: { color: 0xffffff, intensity: 0.4 },
      rimLight: { color: 0xd4e5ff, intensity: 6 },
      textLight: { color: 0xfff8e7, intensity: 5, distance: 30 }
    };
  }

  // Fallback rendering for unsupported devices
  showFallbackMessage(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at top, rgba(10, 15, 25, 0.95), rgba(2, 4, 8, 0.98));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 9999;
      color: #ffd700;
      font-family: 'Share Tech Mono', monospace;
      text-align: center;
      padding: 20px;
    `;
    
    overlay.innerHTML = `
      <div style="font-size: clamp(24px, 6vw, 48px); margin-bottom: 20px; text-transform: uppercase;">
        KYROS
      </div>
      <div style="font-size: clamp(16px, 4vw, 24px); opacity: 0.8;">
        ${message}
      </div>
      <div style="font-size: clamp(14px, 3vw, 18px); margin-top: 20px; opacity: 0.6;">
        Your device may not support the full experience
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 5000);
  }

  // Progressive loading for mobile
  enableProgressiveLoading() {
    if (!this.isMobile) return;

    console.log('📱 Enabling progressive loading for mobile...');
    
    // Load essential elements first
    this.loadPriority = {
      earth: 1,
      text: 2,
      stars: 3,
      orbitalObjects: 4
    };
  }

  // Touch gesture optimization
  optimizeTouchGestures() {
    if (!this.isMobile) return;

    console.log('👆 Optimizing touch gestures...');
    
    // Prevent default touch behaviors that can interfere
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    }, { passive: false });

    // Add momentum scrolling for smoother panning
    let lastTouchTime = 0;
    document.addEventListener('touchend', (e) => {
      const currentTime = Date.now();
      if (currentTime - lastTouchTime < 300) {
        // Quick tap - could be double tap
        e.preventDefault();
      }
      lastTouchTime = currentTime;
    }, { passive: false });
  }

  // Get device-specific performance settings
  getPerformanceSettings() {
    const settings = {
      pixelRatio: Math.min(this.devicePixelRatio, this.isMobile ? 1 : 2),
      shadowMapSize: this.isMobile ? 512 : 2048,
      maxLights: this.isMobile ? 3 : 8,
      enableShadows: !this.isMobile,
      enablePostProcessing: false, // Disable on mobile
      textureQuality: this.isMobile ? 'medium' : 'high'
    };

    console.log('⚙️ Performance settings:', settings);
    return settings;
  }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileOptimizer;
} else {
  window.MobileOptimizer = MobileOptimizer;
}


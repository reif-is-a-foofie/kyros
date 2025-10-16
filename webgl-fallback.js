// WebGL fallback system for unsupported devices
class WebGLFallback {
  constructor() {
    this.fallbackMode = false;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.earthImage = null;
    this.stars = [];
    this.orbitalObjects = [];
    this.animationTime = 0;
    
    this.detectWebGLSupport();
  }

  detectWebGLSupport() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.log('🎮 WebGL not supported - enabling fallback mode');
      this.enableFallbackMode();
      return false;
    }

    // Check for common WebGL issues
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      
      // Check for problematic drivers
      const problematicDrivers = [
        'Software Renderer',
        'Mesa',
        'Intel HD Graphics 3000',
        'Intel HD Graphics 4000'
      ];
      
      const hasProblematicDriver = problematicDrivers.some(driver => 
        renderer.includes(driver) || vendor.includes(driver)
      );
      
      if (hasProblematicDriver) {
        console.log('⚠️ Problematic WebGL driver detected - enabling fallback mode');
        this.enableFallbackMode();
        return false;
      }
    }

    // Test WebGL capabilities
    try {
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      
      if (maxTextureSize < 1024 || maxVertexAttribs < 8) {
        console.log('⚠️ Limited WebGL capabilities - enabling fallback mode');
        this.enableFallbackMode();
        return false;
      }
    } catch (error) {
      console.log('⚠️ WebGL capability test failed - enabling fallback mode');
      this.enableFallbackMode();
      return false;
    }

    return true;
  }

  enableFallbackMode() {
    this.fallbackMode = true;
    this.initializeFallbackCanvas();
    this.createFallbackScene();
    this.startFallbackAnimation();
    
    // Show fallback notification
    this.showFallbackNotification();
  }

  initializeFallbackCanvas() {
    // Remove existing canvas
    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    // Create new canvas for fallback rendering
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      display: block;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at top, #0a0f19, #020408);
    `;
    
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  }

  createFallbackScene() {
    // Create starfield
    this.createStarfield();
    
    // Create Earth (simple circle with gradient)
    this.createEarth();
    
    // Create orbital objects (simple shapes)
    this.createOrbitalObjects();
    
    // Create text
    this.createText();
  }

  createStarfield() {
    this.stars = [];
    const starCount = Math.min(200, window.innerWidth * window.innerHeight / 1000);
    
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  createEarth() {
    // Create Earth as a gradient circle
    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 200;
    earthCanvas.height = 200;
    const earthCtx = earthCanvas.getContext('2d');
    
    // Create radial gradient for Earth
    const gradient = earthCtx.createRadialGradient(100, 100, 0, 100, 100, 100);
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(0.3, '#2e5c8a');
    gradient.addColorStop(0.7, '#1e3a5f');
    gradient.addColorStop(1, '#0f1a2e');
    
    earthCtx.fillStyle = gradient;
    earthCtx.beginPath();
    earthCtx.arc(100, 100, 100, 0, Math.PI * 2);
    earthCtx.fill();
    
    // Add some continents (simple shapes)
    earthCtx.fillStyle = '#2d5a2d';
    earthCtx.beginPath();
    earthCtx.arc(80, 90, 25, 0, Math.PI * 2);
    earthCtx.fill();
    
    earthCtx.beginPath();
    earthCtx.arc(120, 110, 20, 0, Math.PI * 2);
    earthCtx.fill();
    
    this.earthImage = earthCanvas;
  }

  createOrbitalObjects() {
    this.orbitalObjects = [
      { name: 'Pizza', color: '#ff6b6b', radius: 80, speed: 0.02, angle: 0, size: 8 },
      { name: 'Donut', color: '#4ecdc4', radius: 100, speed: 0.015, angle: Math.PI / 3, size: 6 },
      { name: 'Crystal', color: '#45b7d1', radius: 120, speed: 0.012, angle: Math.PI * 2 / 3, size: 5 },
      { name: 'GameBoy', color: '#96ceb4', radius: 140, speed: 0.01, angle: Math.PI, size: 7 },
      { name: 'K', color: '#feca57', radius: 160, speed: 0.008, angle: Math.PI * 4 / 3, size: 6 },
      { name: 'Tether', color: '#ff9ff3', radius: 180, speed: 0.006, angle: Math.PI * 5 / 3, size: 5 }
    ];
  }

  createText() {
    // Text will be rendered in the animation loop
  }

  startFallbackAnimation() {
    const animate = () => {
      this.animationTime += 0.016; // ~60fps
      this.renderFallbackScene();
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  renderFallbackScene() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#020408';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render stars
    this.renderStars();
    
    // Render Earth
    this.renderEarth();
    
    // Render orbital objects
    this.renderOrbitalObjects();
    
    // Render text
    this.renderText();
  }

  renderStars() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.stars.forEach(star => {
      const twinkle = Math.sin(this.animationTime * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      const brightness = star.brightness * twinkle;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderEarth() {
    if (!this.earthImage) return;
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const earthSize = Math.min(this.canvas.width, this.canvas.height) * 0.15;
    
    // Draw Earth
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.animationTime * 0.001); // Slow rotation
    this.ctx.drawImage(this.earthImage, -earthSize / 2, -earthSize / 2, earthSize, earthSize);
    this.ctx.restore();
  }

  renderOrbitalObjects() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.orbitalObjects.forEach((obj, index) => {
      obj.angle += obj.speed;
      
      const x = centerX + Math.cos(obj.angle) * obj.radius;
      const y = centerY + Math.sin(obj.angle) * obj.radius;
      
      // Draw orbital object
      this.ctx.fillStyle = obj.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, obj.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow effect
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, obj.size * 2);
      gradient.addColorStop(0, obj.color + '80');
      gradient.addColorStop(1, obj.color + '00');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, obj.size * 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderText() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(this.canvas.width, this.canvas.height) * 0.25;
    
    // Create curved text effect
    const text = "build the change you wish to see in the world";
    const words = text.split(' ');
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.animationTime * 0.005); // Slow rotation
    
    words.forEach((word, index) => {
      const angle = (index / words.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle + Math.PI / 2);
      
      // Gold gradient text
      const gradient = this.ctx.createLinearGradient(-20, 0, 20, 0);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(0.5, '#ffed4e');
      gradient.addColorStop(1, '#ffd700');
      
      this.ctx.fillStyle = gradient;
      this.ctx.font = 'bold 16px Orbitron, Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(word, 0, 0);
      
      // Add glow effect
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(word, 0, 0);
      
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  showFallbackNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 215, 0, 0.9);
      color: #000;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">🎮 Fallback Mode Active</div>
      <div>Your device is using a simplified version for better compatibility.</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Method to check if fallback is active
  isFallbackMode() {
    return this.fallbackMode;
  }

  // Method to stop fallback animation
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Method to handle WebGL context loss
  handleWebGLContextLoss() {
    if (!this.fallbackMode) {
      console.log('🚨 WebGL context lost - switching to fallback mode');
      this.enableFallbackMode();
    }
  }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebGLFallback;
} else {
  window.WebGLFallback = WebGLFallback;
}


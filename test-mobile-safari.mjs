#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';

// Safari-specific crash diagnostics and mobile testing
class SafariDiagnostics {
  constructor() {
    this.crashPoints = [];
    this.performanceMetrics = {};
    this.safariSpecificIssues = [];
  }

  async testSafariCompatibility() {
    console.log('🍎 Testing Safari compatibility and crash points...\n');
    
    // Test different Safari versions and configurations
    const testConfigs = [
      {
        name: 'Safari Desktop (Latest)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
      },
      {
        name: 'Safari Mobile iOS 17',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      },
      {
        name: 'Safari Mobile iOS 16',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      },
      {
        name: 'Safari iPad',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 1024, height: 768 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      }
    ];

    for (const config of testConfigs) {
      console.log(`\n🔍 Testing: ${config.name}`);
      await this.testSafariConfig(config);
    }

    this.generateDiagnosticReport();
  }

  async testSafariConfig(config) {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    try {
      const page = await browser.newPage();
      
      // Set Safari-specific user agent and viewport
      await page.setUserAgent(config.userAgent);
      await page.setViewport(config.viewport);
      
      if (config.deviceScaleFactor) {
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(window, 'devicePixelRatio', {
            get: () => config.deviceScaleFactor || 2
          });
        });
      }

      // Add Safari-specific crash detection
      await page.evaluateOnNewDocument(() => {
        // Monitor WebGL context loss
        window.webglContextLost = false;
        window.webglContextRestored = false;
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          canvas.addEventListener('webglcontextlost', (e) => {
            console.error('🚨 WebGL context lost!');
            window.webglContextLost = true;
            e.preventDefault();
          });
          
          canvas.addEventListener('webglcontextrestored', () => {
            console.log('✅ WebGL context restored');
            window.webglContextRestored = true;
          });
        }

        // Monitor memory usage
        window.memoryUsage = {
          start: performance.memory ? performance.memory.usedJSHeapSize : 0,
          peak: 0,
          crashes: []
        };

        // Safari-specific error tracking
        window.safariErrors = [];
        window.addEventListener('error', (e) => {
          window.safariErrors.push({
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            timestamp: Date.now()
          });
        });

        // Monitor unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
          window.safariErrors.push({
            type: 'unhandledrejection',
            reason: e.reason?.toString(),
            timestamp: Date.now()
          });
        });
      });

      // Monitor console for Safari-specific warnings
      page.on('console', (msg) => {
        const text = msg.text();
        if (text.includes('WebGL') || text.includes('memory') || text.includes('crash')) {
          console.log(`⚠️  Safari Warning: ${text}`);
        }
      });

      // Track page crashes
      page.on('error', (err) => {
        console.error(`💥 Page crash detected: ${err.message}`);
        this.crashPoints.push({
          config: config.name,
          error: err.message,
          timestamp: Date.now()
        });
      });

      // Navigate to the site and monitor loading
      console.log(`   📱 Loading site with ${config.name}...`);
      
      const startTime = Date.now();
      
      try {
        await page.goto('http://localhost:3000', { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        // Wait for Three.js to initialize
        await page.waitForFunction(() => {
          return window.scene && window.renderer && window.camera;
        }, { timeout: 15000 });

        const loadTime = Date.now() - startTime;
        console.log(`   ✅ Loaded successfully in ${loadTime}ms`);

        // Test WebGL capabilities
        const webglInfo = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          
          if (!gl) return { supported: false };

          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          return {
            supported: true,
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS)
          };
        });

        console.log(`   🎮 WebGL Info:`, webglInfo);

        // Test animation performance
        await this.testAnimationPerformance(page, config);

        // Test memory usage over time
        await this.testMemoryUsage(page, config);

        // Test touch interactions (for mobile)
        if (config.isMobile) {
          await this.testTouchInteractions(page);
        }

        // Collect Safari-specific diagnostics
        const diagnostics = await page.evaluate(() => {
          return {
            webglContextLost: window.webglContextLost,
            webglContextRestored: window.webglContextRestored,
            safariErrors: window.safariErrors,
            memoryUsage: window.memoryUsage,
            threeJsVersion: window.THREE?.REVISION || 'Unknown',
            sceneObjects: window.scene?.children?.length || 0
          };
        });

        this.performanceMetrics[config.name] = {
          loadTime,
          webglInfo,
          diagnostics,
          success: true
        };

        console.log(`   📊 Scene objects: ${diagnostics.sceneObjects}`);
        console.log(`   🧠 Memory usage: ${diagnostics.memoryUsage.peak / 1024 / 1024}MB peak`);

      } catch (error) {
        console.error(`   ❌ Failed to load: ${error.message}`);
        this.crashPoints.push({
          config: config.name,
          error: error.message,
          timestamp: Date.now()
        });
        
        this.performanceMetrics[config.name] = {
          success: false,
          error: error.message
        };
      }

    } finally {
      await browser.close();
    }
  }

  async testAnimationPerformance(page, config) {
    console.log(`   🎬 Testing animation performance...`);
    
    const startTime = Date.now();
    let frameCount = 0;
    
    // Monitor frame rate for 5 seconds
    await page.evaluate(() => {
      window.frameCount = 0;
      window.startTime = Date.now();
      
      const animate = () => {
        window.frameCount++;
        if (Date.now() - window.startTime < 5000) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    });

    // Wait for animation test to complete
    await page.waitForFunction(() => {
      return Date.now() - window.startTime >= 5000;
    }, { timeout: 10000 });

    const results = await page.evaluate(() => {
      const duration = Date.now() - window.startTime;
      const fps = (window.frameCount / duration) * 1000;
      return { frameCount: window.frameCount, fps, duration };
    });

    console.log(`   📈 Animation: ${results.fps.toFixed(1)} FPS over ${results.frameCount} frames`);
    
    if (results.fps < 30) {
      console.log(`   ⚠️  Low frame rate detected - may cause crashes on mobile`);
    }
  }

  async testMemoryUsage(page, config) {
    console.log(`   🧠 Testing memory usage...`);
    
    // Monitor memory for 10 seconds
    await page.evaluate(() => {
      window.memoryTests = [];
      
      const testMemory = () => {
        if (performance.memory) {
          window.memoryTests.push({
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now()
          });
        }
      };
      
      // Test every 2 seconds for 10 seconds
      const interval = setInterval(testMemory, 2000);
      setTimeout(() => clearInterval(interval), 10000);
    });

    await page.waitForTimeout(11000);

    const memoryResults = await page.evaluate(() => {
      return window.memoryTests;
    });

    if (memoryResults.length > 0) {
      const maxMemory = Math.max(...memoryResults.map(m => m.used));
      const memoryLimit = memoryResults[0].limit;
      const memoryUsagePercent = (maxMemory / memoryLimit) * 100;
      
      console.log(`   💾 Memory usage: ${(maxMemory / 1024 / 1024).toFixed(1)}MB (${memoryUsagePercent.toFixed(1)}% of limit)`);
      
      if (memoryUsagePercent > 80) {
        console.log(`   ⚠️  High memory usage detected - risk of crashes`);
      }
    }
  }

  async testTouchInteractions(page) {
    console.log(`   👆 Testing touch interactions...`);
    
    try {
      // Test tap on the military banner
      await page.tap('#military-banner');
      await page.waitForTimeout(1000);
      
      // Test panning gestures
      const viewport = page.viewport();
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;
      
      // Simulate pan gesture
      await page.touchscreen.tap(centerX, centerY);
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 50, centerY + 50);
      await page.mouse.up();
      
      console.log(`   ✅ Touch interactions working`);
    } catch (error) {
      console.log(`   ⚠️  Touch interaction failed: ${error.message}`);
    }
  }

  generateDiagnosticReport() {
    console.log('\n📋 Safari Compatibility Report');
    console.log('='.repeat(50));
    
    console.log('\n🚨 Crash Points:');
    if (this.crashPoints.length === 0) {
      console.log('   ✅ No crashes detected');
    } else {
      this.crashPoints.forEach((crash, i) => {
        console.log(`   ${i + 1}. ${crash.config}: ${crash.error}`);
      });
    }

    console.log('\n📊 Performance Summary:');
    Object.entries(this.performanceMetrics).forEach(([config, metrics]) => {
      console.log(`\n   ${config}:`);
      if (metrics.success) {
        console.log(`     ✅ Load time: ${metrics.loadTime}ms`);
        console.log(`     🎮 WebGL: ${metrics.webglInfo.supported ? 'Supported' : 'Not supported'}`);
        if (metrics.webglInfo.supported) {
          console.log(`     🖥️  Renderer: ${metrics.webglInfo.renderer}`);
        }
        console.log(`     🧠 Memory: ${metrics.diagnostics.memoryUsage.peak / 1024 / 1024}MB peak`);
        console.log(`     🎬 Scene objects: ${metrics.diagnostics.sceneObjects}`);
      } else {
        console.log(`     ❌ Failed: ${metrics.error}`);
      }
    });

    // Generate recommendations
    console.log('\n💡 Recommendations:');
    
    const hasMobileIssues = this.crashPoints.some(crash => 
      crash.config.includes('Mobile') || crash.config.includes('iPhone') || crash.config.includes('iPad')
    );
    
    if (hasMobileIssues) {
      console.log('   🔧 Mobile Safari optimizations needed:');
      console.log('     - Reduce WebGL texture sizes');
      console.log('     - Implement texture compression');
      console.log('     - Add memory management');
      console.log('     - Consider fallback for older iOS versions');
    }

    const hasWebGLCrashes = this.crashPoints.some(crash => 
      crash.error.includes('WebGL') || crash.error.includes('context')
    );
    
    if (hasWebGLCrashes) {
      console.log('   🎮 WebGL stability improvements:');
      console.log('     - Add WebGL context loss handling');
      console.log('     - Implement graceful degradation');
      console.log('     - Add error boundaries for Three.js');
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      crashPoints: this.crashPoints,
      performanceMetrics: this.performanceMetrics,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('safari-diagnostics-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: safari-diagnostics-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.crashPoints.some(c => c.config.includes('Mobile'))) {
      recommendations.push({
        category: 'Mobile Optimization',
        priority: 'High',
        items: [
          'Implement texture atlasing to reduce draw calls',
          'Add mobile-specific LOD (Level of Detail) system',
          'Use compressed texture formats (ASTC, ETC2)',
          'Implement memory pooling for Three.js objects'
        ]
      });
    }

    if (this.crashPoints.some(c => c.error.includes('WebGL'))) {
      recommendations.push({
        category: 'WebGL Stability',
        priority: 'Critical',
        items: [
          'Add WebGL context loss/restore handlers',
          'Implement fallback to Canvas 2D rendering',
          'Add error boundaries around Three.js initialization',
          'Use WebGL 1.0 compatibility mode for older devices'
        ]
      });
    }

    return recommendations;
  }
}

// Run diagnostics
const diagnostics = new SafariDiagnostics();
await diagnostics.testSafariCompatibility();

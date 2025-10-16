#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

// Cross-browser testing with real device simulation
class CrossBrowserTester {
  constructor() {
    this.testResults = {};
    this.deviceProfiles = this.getDeviceProfiles();
    this.browserConfigs = this.getBrowserConfigs();
  }

  getDeviceProfiles() {
    return {
      'iPhone 15 Pro': {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        memoryLimit: 512
      },
      'iPhone 12': {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        memoryLimit: 256
      },
      'iPad Pro': {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 1024, height: 1366 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        memoryLimit: 1024
      },
      'Samsung Galaxy S23': {
        userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        viewport: { width: 360, height: 780 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        memoryLimit: 1024
      },
      'Desktop Chrome': {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        memoryLimit: 4096
      },
      'Desktop Safari': {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: false,
        memoryLimit: 4096
      }
    };
  }

  getBrowserConfigs() {
    return [
      {
        name: 'Chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--enable-gpu-rasterization',
          '--enable-zero-copy'
        ]
      },
      {
        name: 'Chrome Mobile',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--enable-gpu-rasterization',
          '--enable-zero-copy',
          '--force-device-scale-factor=3',
          '--touch-events=enabled'
        ]
      }
    ];
  }

  async runCrossBrowserTests() {
    console.log('🌐 Starting cross-browser compatibility tests...\n');
    
    // Test each device profile
    for (const [deviceName, profile] of Object.entries(this.deviceProfiles)) {
      console.log(`\n📱 Testing ${deviceName}...`);
      await this.testDeviceProfile(deviceName, profile);
    }

    // Test WebGL capabilities across browsers
    await this.testWebGLCapabilities();

    // Generate comprehensive report
    this.generateCrossBrowserReport();
  }

  async testDeviceProfile(deviceName, profile) {
    const browser = await puppeteer.launch({
      headless: false,
      args: this.browserConfigs[0].args
    });

    try {
      const page = await browser.newPage();
      
      // Set device profile
      await page.setUserAgent(profile.userAgent);
      await page.setViewport(profile.viewport);
      
      // Set device pixel ratio
      await page.evaluateOnNewDocument((dpr) => {
        Object.defineProperty(window, 'devicePixelRatio', {
          get: () => dpr
        });
      }, profile.deviceScaleFactor);

      // Add performance monitoring
      await this.setupPerformanceMonitoring(page, deviceName);

      // Navigate and test
      console.log(`   🌐 Loading site...`);
      const startTime = Date.now();
      
      try {
        await page.goto('http://localhost:3000', { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });

        // Wait for Three.js initialization
        await page.waitForFunction(() => {
          return window.scene && window.renderer && window.camera;
        }, { timeout: 15000 });

        const loadTime = Date.now() - startTime;
        console.log(`   ✅ Loaded in ${loadTime}ms`);

        // Test WebGL performance
        const webglPerformance = await this.testWebGLPerformance(page, deviceName);

        // Test memory usage
        const memoryUsage = await this.testMemoryUsage(page, deviceName, profile.memoryLimit);

        // Test interaction responsiveness
        const interactionTest = await this.testInteractionResponsiveness(page, profile);

        // Test animation smoothness
        const animationTest = await this.testAnimationSmoothness(page, deviceName);

        this.testResults[deviceName] = {
          success: true,
          loadTime,
          webglPerformance,
          memoryUsage,
          interactionTest,
          animationTest,
          profile
        };

        console.log(`   📊 Results: ${webglPerformance.fps.toFixed(1)} FPS, ${memoryUsage.peak.toFixed(1)}MB peak memory`);

      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        this.testResults[deviceName] = {
          success: false,
          error: error.message,
          profile
        };
      }

    } finally {
      await browser.close();
    }
  }

  async setupPerformanceMonitoring(page, deviceName) {
    await page.evaluateOnNewDocument(() => {
      // Performance metrics collection
      window.performanceMetrics = {
        frameRates: [],
        memoryUsage: [],
        loadTimes: {},
        errors: []
      };

      // Frame rate monitoring
      let lastTime = performance.now();
      let frameCount = 0;
      
      const monitorFrameRate = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
          const fps = (frameCount * 1000) / (currentTime - lastTime);
          window.performanceMetrics.frameRates.push(fps);
          frameCount = 0;
          lastTime = currentTime;
        }
        requestAnimationFrame(monitorFrameRate);
      };
      
      requestAnimationFrame(monitorFrameRate);

      // Memory monitoring
      const monitorMemory = () => {
        if (performance.memory) {
          window.performanceMetrics.memoryUsage.push({
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now()
          });
        }
      };
      
      setInterval(monitorMemory, 2000);

      // Error tracking
      window.addEventListener('error', (e) => {
        window.performanceMetrics.errors.push({
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          timestamp: Date.now()
        });
      });

      window.addEventListener('unhandledrejection', (e) => {
        window.performanceMetrics.errors.push({
          type: 'unhandledrejection',
          reason: e.reason?.toString(),
          timestamp: Date.now()
        });
      });
    });
  }

  async testWebGLPerformance(page, deviceName) {
    console.log(`   🎮 Testing WebGL performance...`);
    
    // Wait for animation to stabilize
    await page.waitForTimeout(3000);
    
    // Collect frame rate data for 10 seconds
    await page.waitForTimeout(10000);
    
    const metrics = await page.evaluate(() => {
      const frameRates = window.performanceMetrics.frameRates;
      return {
        fps: frameRates.length > 0 ? frameRates.reduce((a, b) => a + b, 0) / frameRates.length : 0,
        minFps: Math.min(...frameRates),
        maxFps: Math.max(...frameRates),
        frameDrops: frameRates.filter(fps => fps < 30).length,
        totalFrames: frameRates.length
      };
    });

    return metrics;
  }

  async testMemoryUsage(page, deviceName, memoryLimit) {
    console.log(`   🧠 Testing memory usage...`);
    
    const metrics = await page.evaluate(() => {
      const memoryData = window.performanceMetrics.memoryUsage;
      if (memoryData.length === 0) {
        return { peak: 0, average: 0, limit: 0, usagePercent: 0 };
      }
      
      const usedValues = memoryData.map(m => m.used);
      const peak = Math.max(...usedValues);
      const average = usedValues.reduce((a, b) => a + b, 0) / usedValues.length;
      const limit = memoryData[0].limit;
      const usagePercent = (peak / limit) * 100;
      
      return { peak: peak / 1024 / 1024, average: average / 1024 / 1024, limit: limit / 1024 / 1024, usagePercent };
    });

    return metrics;
  }

  async testInteractionResponsiveness(page, profile) {
    console.log(`   👆 Testing interaction responsiveness...`);
    
    const startTime = Date.now();
    
    try {
      if (profile.hasTouch) {
        // Test touch interactions
        const viewport = page.viewport();
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        
        // Tap test
        await page.tap('#military-banner');
        await page.waitForTimeout(100);
        
        // Pan gesture test
        await page.touchscreen.tap(centerX, centerY);
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 50, centerY + 50);
        await page.mouse.up();
        
      } else {
        // Test mouse interactions
        await page.click('#military-banner');
        await page.waitForTimeout(100);
        
        // Mouse drag test
        await page.mouse.move(400, 300);
        await page.mouse.down();
        await page.mouse.move(450, 350);
        await page.mouse.up();
      }
      
      const responseTime = Date.now() - startTime;
      return { success: true, responseTime };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testAnimationSmoothness(page, deviceName) {
    console.log(`   🎬 Testing animation smoothness...`);
    
    // Wait for animations to start
    await page.waitForTimeout(2000);
    
    // Monitor frame consistency for 5 seconds
    await page.waitForTimeout(5000);
    
    const smoothness = await page.evaluate(() => {
      const frameRates = window.performanceMetrics.frameRates;
      if (frameRates.length === 0) return { smooth: false, reason: 'No frame data' };
      
      // Calculate frame rate consistency
      const averageFps = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      const variance = frameRates.reduce((sum, fps) => sum + Math.pow(fps - averageFps, 2), 0) / frameRates.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Smooth animation criteria
      const isSmooth = averageFps >= 30 && standardDeviation < 10 && frameRates.filter(fps => fps < 20).length === 0;
      
      return {
        smooth: isSmooth,
        averageFps,
        standardDeviation,
        consistencyScore: Math.max(0, 100 - standardDeviation),
        droppedFrames: frameRates.filter(fps => fps < 30).length
      };
    });
    
    return smoothness;
  }

  async testWebGLCapabilities() {
    console.log('\n🎮 Testing WebGL capabilities across browsers...');
    
    const browser = await puppeteer.launch({
      headless: false,
      args: this.browserConfigs[0].args
    });

    try {
      const page = await browser.newPage();
      
      const webglInfo = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          return { supported: false, reason: 'WebGL not supported' };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const extensions = gl.getSupportedExtensions();
        
        return {
          supported: true,
          version: gl.getParameter(gl.VERSION),
          vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
          renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
          maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
          extensions: extensions,
          maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
          maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
        };
      });

      this.testResults.webglCapabilities = webglInfo;
      console.log(`   ✅ WebGL ${webglInfo.supported ? 'Supported' : 'Not Supported'}`);
      if (webglInfo.supported) {
        console.log(`   🖥️  Renderer: ${webglInfo.renderer}`);
        console.log(`   📏 Max texture size: ${webglInfo.maxTextureSize}x${webglInfo.maxTextureSize}`);
      }

    } finally {
      await browser.close();
    }
  }

  generateCrossBrowserReport() {
    console.log('\n📊 Cross-Browser Compatibility Report');
    console.log('='.repeat(60));
    
    // Summary statistics
    const totalTests = Object.keys(this.testResults).length;
    const successfulTests = Object.values(this.testResults).filter(r => r.success).length;
    const successRate = (successfulTests / totalTests) * 100;
    
    console.log(`\n📈 Overall Results: ${successfulTests}/${totalTests} tests passed (${successRate.toFixed(1)}%)`);
    
    // Device-specific results
    console.log('\n📱 Device Performance:');
    Object.entries(this.testResults).forEach(([device, results]) => {
      if (device === 'webglCapabilities') return;
      
      console.log(`\n   ${device}:`);
      if (results.success) {
        console.log(`     ✅ Load time: ${results.loadTime}ms`);
        console.log(`     🎮 FPS: ${results.webglPerformance.fps.toFixed(1)} (${results.webglPerformance.frameDrops} drops)`);
        console.log(`     🧠 Memory: ${results.memoryUsage.peak.toFixed(1)}MB / ${results.memoryUsage.limit.toFixed(1)}MB (${results.memoryUsage.usagePercent.toFixed(1)}%)`);
        console.log(`     🎬 Smooth: ${results.animationTest.smooth ? 'Yes' : 'No'} (${results.animationTest.consistencyScore.toFixed(1)}% consistency)`);
        console.log(`     👆 Interaction: ${results.interactionTest.success ? 'Responsive' : 'Issues detected'}`);
      } else {
        console.log(`     ❌ Failed: ${results.error}`);
      }
    });

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    const mobileResults = Object.entries(this.testResults).filter(([device, results]) => 
      results.profile?.isMobile && results.success
    );
    
    const avgMobileFPS = mobileResults.reduce((sum, [, results]) => 
      sum + results.webglPerformance.fps, 0) / mobileResults.length;
    
    if (avgMobileFPS < 30) {
      console.log('   🔧 Mobile performance needs optimization:');
      console.log('     - Reduce texture sizes');
      console.log('     - Implement LOD system');
      console.log('     - Add mobile-specific quality settings');
    }

    const highMemoryDevices = Object.entries(this.testResults).filter(([, results]) => 
      results.success && results.memoryUsage.usagePercent > 80
    );
    
    if (highMemoryDevices.length > 0) {
      console.log('   🧠 Memory optimization needed:');
      console.log('     - Implement texture compression');
      console.log('     - Add memory pooling');
      console.log('     - Implement progressive loading');
    }

    // Browser compatibility
    console.log('\n🌐 Browser Compatibility:');
    if (this.testResults.webglCapabilities?.supported) {
      console.log('   ✅ WebGL is supported');
      console.log(`   🖥️  Renderer: ${this.testResults.webglCapabilities.renderer}`);
    } else {
      console.log('   ❌ WebGL not supported - fallback needed');
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successfulTests,
        successRate
      },
      deviceResults: this.testResults,
      recommendations: this.generateRecommendations()
    };

    const fs = require('fs');
    fs.writeFileSync('cross-browser-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: cross-browser-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and generate specific recommendations
    const mobileDevices = Object.entries(this.testResults).filter(([device, results]) => 
      results.profile?.isMobile && results.success
    );
    
    if (mobileDevices.length > 0) {
      const avgMobileFPS = mobileDevices.reduce((sum, [, results]) => 
        sum + results.webglPerformance.fps, 0) / mobileDevices.length;
      
      if (avgMobileFPS < 30) {
        recommendations.push({
          category: 'Mobile Performance',
          priority: 'High',
          issue: 'Low frame rates on mobile devices',
          solutions: [
            'Reduce star count from 400 to 150-200 on mobile',
            'Implement texture atlasing',
            'Add mobile-specific LOD system',
            'Use compressed texture formats (ASTC, ETC2)'
          ]
        });
      }
    }

    return recommendations;
  }
}

// Run cross-browser tests
const tester = new CrossBrowserTester();
await tester.runCrossBrowserTests();

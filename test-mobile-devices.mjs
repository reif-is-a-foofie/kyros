#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// Simple test runner for mobile device compatibility
class MobileDeviceTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive mobile device testing...\n');
    
    try {
      // Check if local server is running
      await this.checkServerRunning();
      
      // Run Safari diagnostics
      console.log('🍎 Running Safari diagnostics...');
      await this.runCommand('node test-mobile-safari.mjs');
      
      // Run cross-browser tests
      console.log('\n🌐 Running cross-browser tests...');
      await this.runCommand('node test-cross-browser.mjs');
      
      // Generate summary report
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async checkServerRunning() {
    console.log('🔍 Checking if local server is running...');
    
    try {
      const response = await fetch('http://localhost:3000');
      if (!response.ok) {
        throw new Error('Server not responding');
      }
      console.log('✅ Local server is running');
    } catch (error) {
      console.log('❌ Local server not running. Please start it with:');
      console.log('   python -m http.server 3000');
      console.log('   or');
      console.log('   npx serve . -p 3000');
      throw new Error('Server not available');
    }
  }

  async runCommand(command) {
    try {
      console.log(`   Running: ${command}`);
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      return output;
    } catch (error) {
      console.error(`   ❌ Command failed: ${command}`);
      throw error;
    }
  }

  generateSummaryReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MOBILE DEVICE TESTING SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`\n⏱️  Total test time: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Check if reports were generated
    const reports = [
      'safari-diagnostics-report.json',
      'cross-browser-report.json'
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    reports.forEach(reportFile => {
      if (fs.existsSync(reportFile)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
          console.log(`\n📄 ${reportFile}:`);
          
          if (report.summary) {
            totalTests += report.summary.totalTests;
            passedTests += report.summary.successfulTests;
            console.log(`   Tests: ${report.summary.successfulTests}/${report.summary.totalTests} passed`);
            console.log(`   Success rate: ${report.summary.successRate.toFixed(1)}%`);
          }
          
          if (report.recommendations) {
            console.log(`   Recommendations: ${report.recommendations.length} items`);
          }
          
        } catch (error) {
          console.log(`   ⚠️  Could not parse report: ${error.message}`);
        }
      } else {
        console.log(`\n📄 ${reportFile}: Not generated`);
      }
    });
    
    if (totalTests > 0) {
      const overallSuccessRate = (passedTests / totalTests) * 100;
      console.log(`\n🎯 Overall Results: ${passedTests}/${totalTests} tests passed (${overallSuccessRate.toFixed(1)}%)`);
      
      if (overallSuccessRate < 80) {
        console.log('\n⚠️  Mobile compatibility issues detected!');
        console.log('   Consider implementing the optimizations in mobile-optimizations.js');
      } else {
        console.log('\n✅ Good mobile compatibility!');
      }
    }
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Review the generated JSON reports for detailed findings');
    console.log('   2. Implement recommendations from the reports');
    console.log('   3. Test on real devices using the provided test URLs');
    console.log('   4. Consider integrating mobile-optimizations.js into your main site');
    
    console.log('\n🔗 Test URLs for real devices:');
    console.log('   http://your-ip:3000 (replace with your actual IP)');
    console.log('   Use ngrok or similar for external testing: npx ngrok http 3000');
  }
}

// Run the test suite
const tester = new MobileDeviceTester();
await tester.runAllTests();

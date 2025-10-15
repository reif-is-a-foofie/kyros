import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

await page.goto('https://kyros.cc', { waitUntil: 'networkidle0', timeout: 20000 });

console.log('Waiting for initial load...');
await new Promise(r => setTimeout(r, 5000));

console.log('Taking screenshot of initial state (should be lace)...');
await page.screenshot({ path: '/tmp/kyros-lace-actual.png' });

console.log('Waiting 8 seconds for material change...');
await new Promise(r => setTimeout(r, 8000));

console.log('Taking screenshot after first change...');
await page.screenshot({ path: '/tmp/kyros-after-change.png' });

console.log('Screenshots saved to /tmp/');
await browser.close();


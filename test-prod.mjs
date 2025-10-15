import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const errors = [];

page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', error => errors.push(error.message));

await page.goto('http://localhost:8000', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 10000));

console.log('=== Errors ===');
errors.forEach(err => console.log('ERROR:', err));

if (errors.length === 0) {
  console.log('No errors');
}

console.log('=== Logs ===');
logs.forEach(log => console.log(log));

// Take screenshot to see what's rendering
await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
console.log('Screenshot saved as test-screenshot.png');

await browser.close();


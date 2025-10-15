import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const errors = [];

page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', error => errors.push(error.message));

await page.goto('https://kyros.cc', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 5000));

console.log('=== Console Logs ===');
logs.forEach(log => console.log(log));

console.log('\n=== Errors ===');
if (errors.length > 0) {
  errors.forEach(err => console.log('ERROR:', err));
} else {
  console.log('No errors');
}

const canvas = await page.$('canvas');
console.log('\nCanvas exists:', !!canvas);

await browser.close();


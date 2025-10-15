import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const errors = [];
const failed = [];

page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', error => errors.push(error.stack || error.message));
page.on('requestfailed', request => {
  failed.push(`${request.url()} - ${request.failure().errorText}`);
});
page.on('response', response => {
  if (response.status() >= 400) {
    failed.push(`${response.status()} ${response.url()}`);
  }
});

await page.goto('https://kyros.cc', { waitUntil: 'networkidle0', timeout: 15000 });
await new Promise(r => setTimeout(r, 5000));

console.log('=== Console Logs ===');
logs.forEach(log => console.log(log));

console.log('\n=== Errors ===');
errors.forEach(err => console.log('ERROR:', err));

console.log('\n=== Failed Requests ===');
failed.forEach(f => console.log(f));

const canvas = await page.$('canvas');
console.log('\nCanvas exists:', !!canvas);

await browser.close();


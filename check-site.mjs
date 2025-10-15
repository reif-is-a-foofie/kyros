import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
const errors = [];
const networkRequests = [];

page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const url = response.url();
  if (url.includes('Fabric_Lace')) {
    networkRequests.push(`${response.status()} ${url}`);
  }
});

console.log('Loading https://kyros.cc...');
await page.goto('https://kyros.cc', { waitUntil: 'networkidle0', timeout: 20000 });

console.log('Waiting 10 seconds for textures and fonts to load...');
await new Promise(r => setTimeout(r, 10000));

console.log('\n=== Lace Texture Loading ===');
if (networkRequests.length > 0) {
  networkRequests.forEach(req => console.log(req));
} else {
  console.log('No lace texture requests detected');
}

console.log('\n=== JavaScript Errors ===');
if (errors.length > 0) {
  errors.forEach(err => console.log('ERROR:', err));
} else {
  console.log('No errors');
}

console.log('\n=== Relevant Console Logs ===');
logs.filter(log => log.includes('font') || log.includes('texture') || log.includes('load')).forEach(log => console.log(log));

const canvas = await page.$('canvas');
console.log('\n=== Canvas ===');
console.log('Exists:', !!canvas);

await browser.close();


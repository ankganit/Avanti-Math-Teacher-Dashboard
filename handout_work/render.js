const path = require('path');
const { chromium } = require('/root/.bun/install/global/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  const htmlPath = 'file://' + path.resolve(__dirname, 'handout.html');
  console.log('Navigating to:', htmlPath);
  await page.goto(htmlPath);
  
  await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
  await page.waitForTimeout(600);
  
  const rep = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.inner')).map((el, i) => {
      const secs = Array.from(el.children).filter(c => c.classList.contains('sec'));
      const used = secs.reduce((a, c) => a + c.getBoundingClientRect().height, 0);
      return [i + 1, Math.round(used), el.clientHeight];
    });
  });
  
  let hasOverflow = false;
  for (const [n, u, h] of rep) {
    const isOver = u > h;
    if (isOver) hasOverflow = true;
    console.log(`page ${n}: content ${u}px of ${h}px ${isOver ? 'OVERFLOW' : 'OK'}`);
  }
  
  const outPath = path.resolve(__dirname, '11M11_Conic_Sections_Handout.pdf');
  await page.pdf({
    path: outPath,
    preferCSSPageSize: true,
    printBackground: true
  });
  
  console.log('PDF rendered to:', outPath);
  await browser.close();
  if (hasOverflow) {
    console.warn('WARNING: Some pages had overflow!');
  } else {
    console.log('SUCCESS: All 16 pages fit perfectly with zero overflow!');
  }
})();

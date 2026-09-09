const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('dialog', async (d) => { await d.dismiss(); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(300);
  await page.click('.nav-link[data-view="floodmap"]');
  await page.waitForTimeout(200);
  await page.click('#mapFullscreenBtn');
  await page.waitForTimeout(200);

  const info = await page.evaluate(() => {
    var btn = document.getElementById('mapFullscreenBtn');
    var rect = btn.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var elAtPoint = document.elementFromPoint(cx, cy);
    var frame = document.getElementById('mapFrameFull');
    var frameRect = frame.getBoundingClientRect();
    var toolbar = document.querySelector('.map-toolbar');
    var toolbarRect = toolbar.getBoundingClientRect();
    var computedFrame = getComputedStyle(frame);
    var computedToolbar = getComputedStyle(toolbar);
    var computedBtn = getComputedStyle(btn);
    return {
      btnRect: rect,
      cx: cx, cy: cy,
      elAtPointTag: elAtPoint ? (elAtPoint.tagName + '#' + elAtPoint.id + '.' + elAtPoint.className) : null,
      frameRect: frameRect,
      frameClass: frame.className,
      framePosition: computedFrame.position,
      frameZ: computedFrame.zIndex,
      toolbarRect: toolbarRect,
      toolbarPosition: computedToolbar.position,
      toolbarZ: computedToolbar.zIndex,
      toolbarDisplay: computedToolbar.display,
      toolbarVisibility: computedToolbar.visibility,
      btnPosition: computedBtn.position,
      btnDisplay: computedBtn.display,
      btnVisible: rect.width > 0 && rect.height > 0
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: '/home/claude/hydroguard/_diag_fullscreen.png' });
  await browser.close();
})();

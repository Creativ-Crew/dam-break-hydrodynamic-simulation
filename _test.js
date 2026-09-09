const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const errors = [];
  const consoleErrors = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('dialog', async (dialog) => { await dialog.dismiss(); });

  const filePath = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(filePath);
  await page.waitForTimeout(400);

  const log = (label, ok, extra) => console.log((ok ? 'PASS' : 'FAIL') + ' — ' + label + (extra ? ' :: ' + extra : ''));

  // 1. Initial load
  log('Initial load, no console errors', consoleErrors.length === 0 && errors.length === 0, JSON.stringify(consoleErrors.concat(errors)));
  const dashActive = await page.$eval('#view-dashboard', el => el.classList.contains('active'));
  log('Dashboard view active on load', dashActive);

  const iconsInjected = await page.$eval('.nav-link svg', el => !!el);
  log('Icons injected into nav links', iconsInjected);

  // 2. Navigate through every sidebar item
  const views = ['scenario', 'simulation', 'floodmap', 'results', 'risk', 'benchmark', 'report', 'about', 'dashboard'];
  for (const v of views) {
    await page.click('.nav-link[data-view="' + v + '"]');
    await page.waitForTimeout(120);
    const active = await page.$eval('#view-' + v, el => el.classList.contains('active'));
    log('Nav → ' + v, active);
  }

  // 3. Scenario builder sliders update live values
  await page.click('.nav-link[data-view="scenario"]');
  await page.waitForTimeout(100);
  await page.$eval('#inDamHeight', el => { el.value = 65; el.dispatchEvent(new Event('input', { bubbles: true })); });
  const damVal = await page.$eval('#valDamHeight', el => el.textContent);
  log('Dam height slider updates readout', damVal.trim() === '65 m', damVal);

  await page.click('#modeSegmented button[data-mode="high"]');
  await page.waitForTimeout(80);
  const modeActive = await page.$eval('#modeSegmented button[data-mode="high"]', el => el.classList.contains('active'));
  const modeCells = await page.$eval('#modeCells', el => el.textContent);
  log('Mode segmented switches + readouts update', modeActive, 'cells=' + modeCells);

  // custom DEM upload row reveal
  await page.selectOption('#inDem', 'custom');
  await page.waitForTimeout(80);
  const demRowVisible = await page.$eval('#demFileRow', el => getComputedStyle(el).display !== 'none');
  log('Custom DEM select reveals file row', demRowVisible);
  await page.selectOption('#inDem', { index: 0 });

  // 4. Risk view reflects scenario live (no run needed)
  await page.click('.nav-link[data-view="risk"]');
  await page.waitForTimeout(100);
  const riskRows = await page.$$eval('#riskTableBody tr', rows => rows.length);
  log('Risk table populated without running a simulation', riskRows === 9, 'rows=' + riskRows);

  // 5. Benchmark segmented + bars
  await page.click('.nav-link[data-view="benchmark"]');
  await page.waitForTimeout(100);
  await page.click('#benchModeSegmented button[data-mode="rapid"]');
  await page.waitForTimeout(80);
  const benchBarCount = await page.$$eval('#benchRuntime .bench-bar-row', rows => rows.length);
  log('Benchmark runtime bars render', benchBarCount === 2);
  const benchFillWidths = await page.$$eval('#benchCells .bench-bar-fill', els => els.map(e => e.style.width));
  const widthsValid = benchFillWidths.every(w => /^[0-9.]+%$/.test(w));
  log('Benchmark cell bar widths are valid percentages (no NaN)', widthsValid, benchFillWidths.join(','));

  // 6. Run a full simulation end to end
  await page.click('.nav-link[data-view="scenario"]');
  await page.waitForTimeout(100);
  await page.click('#runSimBtn');
  await page.waitForTimeout(150);
  const onSimView = await page.$eval('#view-simulation', el => el.classList.contains('active'));
  const onLiveTab = await page.$eval('#tab-live', el => el.classList.contains('active'));
  log('Run Simulation navigates to Simulation → Live monitor', onSimView && onLiveTab);

  const runBtnDisabledDuring = await page.$eval('#runSimBtn', el => el.disabled);
  log('Run button disabled while running', runBtnDisabledDuring);

  // wait for completion (max 15s)
  let completed = false;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(250);
    const status = await page.$eval('#liveStatusBadge', el => el.textContent.trim());
    if (status === 'Complete') { completed = true; break; }
  }
  log('Simulation completes within timeout', completed);

  const runBtnEnabledAfter = await page.$eval('#runSimBtn', el => !el.disabled);
  log('Run button re-enabled after completion', runBtnEnabledAfter);
  const rerunEnabled = await page.$eval('#rerunBtn', el => !el.disabled);
  log('Re-run button enabled after first completed run', rerunEnabled);

  // 7. Results view populated
  await page.click('.nav-link[data-view="results"]');
  await page.waitForTimeout(150);
  const resultsVisible = await page.$eval('#resultsContent', el => getComputedStyle(el).display !== 'none');
  log('Results content visible after run', resultsVisible);
  const depthChartSvg = await page.$('#chartDepth svg');
  log('Depth chart rendered (svg present)', !!depthChartSvg);
  const timelineSvg = await page.$('#chartTimeline svg');
  log('Computation timeline chart rendered', !!timelineSvg);

  // 8. Dashboard KPIs populated
  await page.click('.nav-link[data-view="dashboard"]');
  await page.waitForTimeout(100);
  const kpiDepthVal = await page.$eval('#kpiDepthVal', el => el.textContent);
  log('Dashboard KPI depth populated', kpiDepthVal.trim() !== '—m', kpiDepthVal);
  const recentRunsVisible = await page.$eval('#recentRunsList', el => getComputedStyle(el).display !== 'none');
  log('Recent runs list visible after a run', recentRunsVisible);

  // click the recent run row
  const runRow = await page.$('.run-row');
  if (runRow) { await runRow.click(); await page.waitForTimeout(150); }
  const onResultsAfterRowClick = await page.$eval('#view-results', el => el.classList.contains('active'));
  log('Clicking a recent run row loads Results view', onResultsAfterRowClick);

  // 9. Flood map controls
  await page.click('.nav-link[data-view="floodmap"]');
  await page.waitForTimeout(100);
  const mapSvgPresent = await page.$('#fullMapSvg svg');
  log('Flood map SVG rendered', !!mapSvgPresent);

  await page.click('#mapZoomIn');
  await page.waitForTimeout(80);
  const zoomTransform = await page.$eval('#fullMapSvg', el => el.style.transform);
  log('Zoom in applies transform', zoomTransform.includes('scale'), zoomTransform);

  await page.click('#mapLayersBtn');
  await page.waitForTimeout(80);
  const layersOpen = await page.$eval('#mapLayersPanel', el => el.classList.contains('open'));
  log('Layers panel opens', layersOpen);

  await page.click('#layerVelocity');
  await page.waitForTimeout(80);
  const velocityChecked = await page.$eval('#layerVelocity', el => el.checked);
  log('Velocity layer checkbox toggles', velocityChecked);

  await page.click('#mapFullscreenBtn');
  await page.waitForTimeout(80);
  const isFullscreen = await page.$eval('#mapFrameFull', el => el.classList.contains('fullscreen'));
  log('Fullscreen toggle works', isFullscreen);
  await page.click('#mapFullscreenBtn');
  await page.waitForTimeout(80);

  await page.click('#mapResetBtn');
  await page.waitForTimeout(80);
  const zoomReset = await page.$eval('#fullMapSvg', el => el.style.transform);
  log('Reset view resets zoom', zoomReset.includes('scale(1)'), zoomReset);

  // 10. Report view + download
  await page.click('.nav-link[data-view="report"]');
  await page.waitForTimeout(100);
  const reportVisible = await page.$eval('#reportContent', el => getComputedStyle(el).display !== 'none');
  log('Report content visible after a run', reportVisible);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
    page.click('#downloadReportBtn')
  ]);
  log('Download Report triggers a file download', !!download, download ? download.suggestedFilename() : 'no download event');

  // 11. Settings dropdown + reset demo data
  await page.click('#settingsBtn');
  await page.waitForTimeout(80);
  const dropdownOpen = await page.$eval('#settingsDropdown', el => el.classList.contains('open'));
  log('Settings dropdown opens', dropdownOpen);

  await page.click('#resetDemoBtn');
  await page.waitForTimeout(150);
  await page.click('.nav-link[data-view="dashboard"]');
  await page.waitForTimeout(100);
  const kpiAfterReset = await page.$eval('#kpiDepthVal', el => el.textContent);
  log('Reset demo data clears KPI back to placeholder', kpiAfterReset.includes('—'), kpiAfterReset);
  const rerunDisabledAfterReset = await page.$eval('#rerunBtn', el => el.disabled);
  log('Re-run button disabled again after reset', rerunDisabledAfterReset);

  // 12. Mobile responsive check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const navToggleVisible = await page.$eval('#navToggle', el => getComputedStyle(el).display !== 'none');
  log('Mobile: hamburger nav toggle visible', navToggleVisible);
  await page.click('#navToggle');
  await page.waitForTimeout(150);
  const sidebarOpen = await page.$eval('#sidebar', el => el.classList.contains('open'));
  log('Mobile: sidebar opens on hamburger click', sidebarOpen);
  await page.screenshot({ path: '/home/claude/hydroguard/_test_mobile.png', fullPage: false });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: '/home/claude/hydroguard/_test_desktop.png', fullPage: false });

  console.log('\n--- Console errors captured during run ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
  console.log('\n--- Uncaught page errors captured during run ---');
  console.log(errors.length ? errors.join('\n') : '(none)');

  await browser.close();
})();

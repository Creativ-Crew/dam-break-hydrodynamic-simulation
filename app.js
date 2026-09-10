/* ==========================================================================
   HydroGuard — app.js
   Navigation, Scenario Builder wiring, the adaptive-simulation runner, and
   all view rendering (Dashboard, Simulation, Flood Map, Results, Risk,
   Benchmark, Reports, Methodology). No backend — everything is computed
   client-side from demo/illustrative formulas.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Derived-metric formulas (DEMO / ILLUSTRATIVE — see Methodology)        */
/* ---------------------------------------------------------------------- */
function computeDerivedMetrics(s){
  var maxDepth = clamp(1.5 + s.damHeight * 0.055 + s.breachWidth * 0.004 + s.waterLevel * 0.012 + s.duration * 0.02, 1, 22);
  var maxVelocity = clamp(1.5 + s.breachWidth * 0.018 + s.damHeight * 0.035 + s.waterLevel * 0.01, 1, 12);
  var earliestArrival = clamp(150 - s.breachWidth * 0.45 - s.damHeight * 0.9 - s.waterLevel * 0.3, 4, 240);
  var affectedArea = clamp(0.8 + s.damHeight * 0.035 + s.breachWidth * 0.01 + s.duration * 0.15, 0.5, 60);
  return { maxDepth: maxDepth, maxVelocity: maxVelocity, earliestArrival: earliestArrival, affectedArea: affectedArea };
}

function computeRiskLevels(scenario){
  var m = computeDerivedMetrics(scenario);
  var out = {};
  ASSETS.forEach(function(a){
    var score = m.maxDepth * a.exposure;
    var level;
    if (score >= 5.5) level = 'critical';
    else if (score >= 3) level = 'high';
    else if (score >= 1.3) level = 'medium';
    else level = 'low';
    out[a.id] = level;
  });
  return out;
}

function riskCounts(riskLevels){
  var c = { low: 0, medium: 0, high: 0, critical: 0 };
  Object.keys(riskLevels).forEach(function(id){ c[riskLevels[id]]++; });
  return c;
}

function generateSeries(peakVal, durationHr, n){
  n = n || 12;
  var pts = [], peakPos = 0.28;
  for (var i = 0; i < n; i++){
    var t = (i / (n - 1)) * durationHr;
    var tn = i / (n - 1);
    var shape;
    if (tn <= peakPos) shape = Math.pow(tn / peakPos, 1.4);
    else shape = Math.max(0, Math.pow(1 - ((tn - peakPos) / (1 - peakPos)), 0.85));
    var jitter = 0.96 + Math.random() * 0.06;
    pts.push({ x: t, y: Math.max(0, peakVal * shape * jitter) });
  }
  return pts;
}

function computeArrivalByAsset(earliestArrival){
  return ASSETS.map(function(a){
    var val = Math.round(clamp(earliestArrival * (1.15 - a.exposure * 0.55), earliestArrival * 0.55, 240));
    return { label: a.short, value: val, color: 'var(--blue)', assetId: a.id };
  }).sort(function(a, b){ return a.value - b.value; });
}

var TIMELINE_PALETTE = ['#3e7bfa', '#2dd4ee', '#34d399', '#fbbf24', '#fb923c', '#f65b6b', '#a9bcd6'];
function computeTimelineSegments(modeKey){
  var mode = MODE_PRESETS[modeKey];
  return PIPELINE_STAGES.map(function(st, i){
    return { label: st.title, value: +(st.weight * mode.runtimeSec).toFixed(1), color: TIMELINE_PALETTE[i % TIMELINE_PALETTE.length] };
  });
}

function riskBadgeClass(level){ return 'badge-' + level; }
function riskLabel(level){ return level.charAt(0).toUpperCase() + level.slice(1); }

/* ---------------------------------------------------------------------- */
/* Toast                                                                   */
/* ---------------------------------------------------------------------- */
function toast(msg, warn){
  var wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  var el = document.createElement('div');
  el.className = 'toast' + (warn ? ' warn' : '');
  el.innerHTML = '<span class="dot"></span><span>' + msg + '</span>';
  wrap.appendChild(el);
  setTimeout(function(){
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(function(){ el.remove(); }, 260);
  }, 3200);
}

/* ---------------------------------------------------------------------- */
/* Navigation                                                              */
/* ---------------------------------------------------------------------- */
function navigateTo(viewName, tabName){
  var target = document.getElementById('view-' + viewName);
  if (!target) return;
  document.querySelectorAll('.view.active').forEach(function(v){ v.classList.remove('active'); });
  target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(function(link){
    link.classList.toggle('active', link.getAttribute('data-view') === viewName);
  });

  if (viewName === 'simulation' && tabName){ switchTab(tabName); }

  closeMobileSidebar();
  closeDropdowns();
  var main = document.getElementById('main');
  if (main) main.scrollTop = 0;
}

function switchTab(tabName){
  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(function(panel){
    panel.classList.toggle('active', panel.id === 'tab-' + tabName);
  });
}

function openMobileSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.add('open');
}
function closeMobileSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
}

function closeDropdowns(){
  document.querySelectorAll('.dropdown.open').forEach(function(d){ d.classList.remove('open'); });
}

function setIcon(el, name){
  if (!el || !ICONS[name]) return;
  el.setAttribute('data-icon', name);
  el.innerHTML = ICONS[name];
}

/* ---------------------------------------------------------------------- */
/* Scenario Builder — field wiring                                        */
/* ---------------------------------------------------------------------- */
function bindRange(inputId, valEl, scenarioKey, formatFn){
  var el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', function(){
    var v = Number(el.value);
    HG.scenario[scenarioKey] = v;
    document.getElementById(valEl).textContent = formatFn(v);
    onScenarioChanged();
  });
}

function onScenarioChanged(){
  renderScenarioSummary();
  renderRisk();
  if (HG.sim.status !== 'running') renderAllMaps();
}

function setupScenarioBuilder(){
  bindRange('inDamHeight', 'valDamHeight', 'damHeight', function(v){ return v + ' m'; });
  bindRange('inBreachWidth', 'valBreachWidth', 'breachWidth', function(v){ return v + ' m'; });
  bindRange('inBreachTime', 'valBreachTime', 'breachTime', function(v){ return v + ' min'; });
  bindRange('inWaterLevel', 'valWaterLevel', 'waterLevel', function(v){ return v + ' m'; });
  bindRange('inDuration', 'valDuration', 'duration', function(v){ return v + ' hr'; });

  setupDatasetSelect('inDem', 'demFileRow', 'demFileInput', 'demFileName', 'dem');
  setupDatasetSelect('inRiver', 'riverFileRow', 'riverFileInput', 'riverFileName', 'river');

  var seg = document.getElementById('modeSegmented');
  seg.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      setSegmentedActive(seg, btn.getAttribute('data-mode'));
      HG.scenario.mode = btn.getAttribute('data-mode');
      updateModeReadouts();
      renderScenarioSummary();
    });
  });

  document.getElementById('runSimBtn').addEventListener('click', function(){ startSimulation(); });
}

function setupDatasetSelect(selectId, rowId, fileInputId, fileNameId, scenarioKey){
  var sel = document.getElementById(selectId);
  var row = document.getElementById(rowId);
  var fileInput = document.getElementById(fileInputId);
  var fileNameEl = document.getElementById(fileNameId);
  var browseBtn = document.getElementById(fileInputId.replace('FileInput', 'BrowseBtn'));

  sel.addEventListener('change', function(){
    if (sel.value === 'custom'){
      row.style.display = 'flex';
      HG.scenario[scenarioKey] = fileNameEl.value ? fileNameEl.value : 'Custom upload — no file chosen';
    } else {
      row.style.display = 'none';
      HG.scenario[scenarioKey] = sel.value;
    }
    onScenarioChanged();
  });

  if (browseBtn){
    browseBtn.addEventListener('click', function(){ fileInput.click(); });
  }
  fileInput.addEventListener('change', function(){
    if (fileInput.files && fileInput.files[0]){
      var name = fileInput.files[0].name + ' (Custom)';
      fileNameEl.value = name;
      HG.scenario[scenarioKey] = name;
      onScenarioChanged();
      toast('Loaded ' + fileInput.files[0].name + ' as ' + (scenarioKey === 'dem' ? 'DEM dataset' : 'river/terrain network') + ' (demo — not parsed).');
    }
  });
}

function setSegmentedActive(container, value){
  container.querySelectorAll('button').forEach(function(btn){
    btn.classList.toggle('active', btn.getAttribute('data-mode') === value);
  });
}

function updateModeReadouts(){
  var mode = MODE_PRESETS[HG.scenario.mode];
  document.getElementById('modeDesc').textContent = mode.desc;
  document.getElementById('modeCells').textContent = fmtInt(mode.cells);
  document.getElementById('modeRuntime').textContent = '~' + mode.runtimeSec + ' s';
  document.getElementById('modeCoverage').textContent = mode.coverage + '%';
}

/* ---------------------------------------------------------------------- */
/* Sync Scenario Builder form fields FROM state (used by reset / re-run)  */
/* ---------------------------------------------------------------------- */
function syncScenarioForm(){
  var s = HG.scenario;
  document.getElementById('inDamHeight').value = s.damHeight;
  document.getElementById('valDamHeight').textContent = s.damHeight + ' m';
  document.getElementById('inBreachWidth').value = s.breachWidth;
  document.getElementById('valBreachWidth').textContent = s.breachWidth + ' m';
  document.getElementById('inBreachTime').value = s.breachTime;
  document.getElementById('valBreachTime').textContent = s.breachTime + ' min';
  document.getElementById('inWaterLevel').value = s.waterLevel;
  document.getElementById('valWaterLevel').textContent = s.waterLevel + ' m';
  document.getElementById('inDuration').value = s.duration;
  document.getElementById('valDuration').textContent = s.duration + ' hr';

  var demSel = document.getElementById('inDem');
  var demKnown = Array.from(demSel.options).some(function(o){ return o.value === s.dem; });
  demSel.value = demKnown ? s.dem : 'custom';
  document.getElementById('demFileRow').style.display = demKnown ? 'none' : 'flex';
  if (!demKnown) document.getElementById('demFileName').value = s.dem;

  var riverSel = document.getElementById('inRiver');
  var riverKnown = Array.from(riverSel.options).some(function(o){ return o.value === s.river; });
  riverSel.value = riverKnown ? s.river : 'custom';
  document.getElementById('riverFileRow').style.display = riverKnown ? 'none' : 'flex';
  if (!riverKnown) document.getElementById('riverFileName').value = s.river;

  setSegmentedActive(document.getElementById('modeSegmented'), s.mode);
  updateModeReadouts();
  renderScenarioSummary();
}

/* ---------------------------------------------------------------------- */
/* Scenario summary (Mission Control)                                     */
/* ---------------------------------------------------------------------- */
function renderScenarioSummary(){
  var s = HG.scenario;
  var mode = MODE_PRESETS[s.mode];
  var rows = [
    ['Dam height', s.damHeight + ' m'],
    ['Breach width', s.breachWidth + ' m'],
    ['Breach formation time', s.breachTime + ' min'],
    ['Initial water level', s.waterLevel + ' m'],
    ['Simulation duration', s.duration + ' hr'],
    ['Simulation mode', mode.label],
    ['DEM dataset', s.dem],
    ['River / terrain data', s.river]
  ];
  var html = rows.map(function(r){
    return '<div class="kv-row"><span class="k">' + r[0] + '</span><span class="v" style="' + (r[0].indexOf('dataset') > -1 || r[0].indexOf('data') > -1 ? 'font-family:var(--f-body); font-weight:500; max-width:60%; text-align:right;' : '') + '">' + r[1] + '</span></div>';
  }).join('');
  document.getElementById('scenarioSummary').innerHTML = html;
}

/* ---------------------------------------------------------------------- */
/* Pipeline (Simulation → Engine pipeline tab)                            */
/* ---------------------------------------------------------------------- */
function buildPipelineDOM(){
  var el = document.getElementById('pipeline');
  el.innerHTML = PIPELINE_STAGES.map(function(st, i){
    return '<div class="pstage" id="pstage-' + i + '">' +
      '<div class="pnum">' + String(i + 1).padStart(2, '0') + '</div>' +
      '<div class="ptitle">' + st.title + '</div>' +
      '<div class="pdesc">' + st.desc + '</div>' +
      '<div class="pdot"></div>' +
    '</div>';
  }).join('');
}

function updatePipelineStages(){
  PIPELINE_STAGES.forEach(function(st, i){
    var el = document.getElementById('pstage-' + i);
    if (!el) return;
    el.classList.remove('active', 'done');
    if (HG.sim.status === 'complete'){
      el.classList.add('done');
    } else if (HG.sim.status === 'running'){
      if (i < HG.sim.stageIndex) el.classList.add('done');
      else if (i === HG.sim.stageIndex) el.classList.add('active');
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Status sync (top bar, KPI card, simulation badge, sidebar LIVE badge)  */
/* ---------------------------------------------------------------------- */
function syncStatusUI(){
  var dot = document.getElementById('topStatusDot');
  var text = document.getElementById('topStatusText');
  var kpiBadge = document.getElementById('kpiStatusBadge');
  var kpiSub = document.getElementById('kpiStatusSub');
  var simBadge = document.getElementById('simViewStatusBadge');
  var navBadge = document.getElementById('navSimBadge');

  dot.className = 'status-dot';
  kpiBadge.className = 'badge';
  simBadge.className = 'badge';

  if (HG.sim.status === 'idle'){
    text.innerHTML = '<span class="full">Idle — no active run</span>';
    kpiBadge.classList.add('badge-idle'); kpiBadge.textContent = 'Idle';
    document.getElementById('kpiStatusSub').textContent = 'No run started yet';
    simBadge.classList.add('badge-idle'); simBadge.textContent = 'Idle';
    navBadge.style.display = 'none';
  } else if (HG.sim.status === 'running'){
    var modeLabel = MODE_PRESETS[HG.runningScenario.mode].label;
    var pct = Math.round(HG.sim.progress);
    dot.classList.add('live');
    text.innerHTML = '<span class="full">Running — ' + modeLabel + ' mode · ' + pct + '%</span>';
    kpiBadge.classList.add('badge-live'); kpiBadge.textContent = 'Running';
    kpiSub.textContent = modeLabel + ' mode · ' + pct + '% complete';
    simBadge.classList.add('badge-live'); simBadge.textContent = 'Running · ' + pct + '%';
    navBadge.style.display = 'inline-flex';
  } else if (HG.sim.status === 'complete'){
    var r = HG.results;
    var ml = MODE_PRESETS[r.scenario.mode].label;
    dot.classList.add('ok');
    text.innerHTML = '<span class="full">Complete — ' + ml + ' mode · ' + r.timestamp + '</span>';
    kpiBadge.classList.add('badge-complete'); kpiBadge.textContent = 'Complete';
    kpiSub.textContent = ml + ' mode · finished ' + r.timestamp;
    simBadge.classList.add('badge-complete'); simBadge.textContent = 'Complete';
    navBadge.style.display = 'none';
  }
}

/* ---------------------------------------------------------------------- */
/* Map rendering (mini dashboard preview, live monitor, full GIS map)     */
/* ---------------------------------------------------------------------- */
function currentMapState(){
  if (HG.sim.status === 'running') return { progress: HG.sim.progress / 100, showFront: true };
  return { progress: 1, showFront: false };
}

function renderAllMaps(){
  var st = currentMapState();
  var riskLevels = computeRiskLevels(HG.scenario);
  var miniLayers = { depth: true, velocity: false, arrival: false, roads: true, buildings: true, assets: true, risk: false };

  var miniEl = document.getElementById('miniMapPreview');
  if (miniEl) renderFloodMap(miniEl, { mini: true, progress: st.progress, showFront: st.showFront, layers: miniLayers, riskLevels: riskLevels });

  var liveEl = document.getElementById('liveMapPreview');
  if (liveEl) renderFloodMap(liveEl, { mini: true, progress: st.progress, showFront: st.showFront, layers: miniLayers, riskLevels: riskLevels });

  var fullEl = document.getElementById('fullMapSvg');
  if (fullEl) renderFloodMap(fullEl, { mini: false, progress: st.progress, showFront: st.showFront, layers: HG.map.layers, riskLevels: riskLevels });

  document.getElementById('mapModeTag').textContent = MODE_PRESETS[HG.scenario.mode].label + ' mode';
}

function applyZoom(){
  var fullEl = document.getElementById('fullMapSvg');
  if (fullEl){
    fullEl.style.transition = 'transform .2s ease';
    fullEl.style.transform = 'scale(' + HG.map.zoom + ')';
  }
}

function setupMapControls(){
  document.getElementById('mapZoomIn').addEventListener('click', function(){
    HG.map.zoom = clamp(HG.map.zoom + 0.2, 0.6, 2.4);
    applyZoom();
  });
  document.getElementById('mapZoomOut').addEventListener('click', function(){
    HG.map.zoom = clamp(HG.map.zoom - 0.2, 0.6, 2.4);
    applyZoom();
  });
  document.getElementById('mapLayersBtn').addEventListener('click', function(e){
    e.stopPropagation();
    document.getElementById('mapLayersPanel').classList.toggle('open');
  });
  document.getElementById('mapFullscreenBtn').addEventListener('click', function(){
    var frame = document.getElementById('mapFrameFull');
    var isFull = frame.classList.toggle('fullscreen');
    setIcon(this.querySelector('[data-icon]'), isFull ? 'x' : 'maximize');
  });
  document.getElementById('mapResetBtn').addEventListener('click', function(){
    HG.map.zoom = 1;
    HG.map.layers = { depth: true, velocity: false, arrival: false, roads: true, buildings: true, assets: true, risk: false };
    applyZoom();
    syncLayerCheckboxes();
    renderAllMaps();
    toast('Map view reset.');
  });

  var layerMap = { layerDepth: 'depth', layerVelocity: 'velocity', layerArrival: 'arrival', layerRoads: 'roads', layerBuildings: 'buildings', layerAssets: 'assets', layerRisk: 'risk' };
  Object.keys(layerMap).forEach(function(id){
    document.getElementById(id).addEventListener('change', function(){
      HG.map.layers[layerMap[id]] = this.checked;
      renderAllMaps();
    });
  });
}

function syncLayerCheckboxes(){
  var layerMap = { layerDepth: 'depth', layerVelocity: 'velocity', layerArrival: 'arrival', layerRoads: 'roads', layerBuildings: 'buildings', layerAssets: 'assets', layerRisk: 'risk' };
  Object.keys(layerMap).forEach(function(id){
    document.getElementById(id).checked = !!HG.map.layers[layerMap[id]];
  });
}

/* ---------------------------------------------------------------------- */
/* Simulation runner                                                       */
/* ---------------------------------------------------------------------- */
var REGION_SEQUENCE = ['Reservoir & breach zone', 'Upstream channel', 'Floodplain — sector B', 'Downstream confluence'];
var SOLVER_BY_STAGE = ['Preprocessing', 'Preprocessing', 'Preprocessing', 'Fast Diffusive-Wave Solver', 'Fast Diffusive-Wave Solver (checking)', 'Full 2D SWE Solver', 'Post-processing'];

function startSimulation(){
  if (HG.sim.status === 'running'){ toast('A simulation is already running.', true); return; }

  HG.runningScenario = Object.assign({}, HG.scenario);
  HG.sim.status = 'running';
  HG.sim.progress = 0;
  HG.sim.stageIndex = 0;

  document.getElementById('runSimBtn').disabled = true;
  document.getElementById('liveEmpty').style.display = 'none';
  document.getElementById('liveContent').style.display = 'block';
  document.getElementById('liveCompleteNotice').style.display = 'none';

  navigateTo('simulation', 'live');
  syncStatusUI();
  updatePipelineStages();
  renderAllMaps();
  toast('Simulation started — ' + MODE_PRESETS[HG.runningScenario.mode].label + ' mode.');

  var mode = MODE_PRESETS[HG.runningScenario.mode];
  var totalMs = { rapid: 4200, balanced: 6200, high: 9200 }[HG.runningScenario.mode];
  var tickMs = 160;
  var baseIncrement = (100 / (totalMs / tickMs));

  var cum = [];
  var acc = 0;
  PIPELINE_STAGES.forEach(function(st){ acc += st.weight * 100; cum.push(acc); });

  HG.sim.timer = setInterval(function(){
    HG.sim.progress = clamp(HG.sim.progress + baseIncrement * (0.75 + Math.random() * 0.5), 0, 100);

    var stageIdx = 0;
    for (var i = 0; i < cum.length; i++){ if (HG.sim.progress <= cum[i]){ stageIdx = i; break; } stageIdx = cum.length - 1; }
    HG.sim.stageIndex = stageIdx;

    updateLiveReadouts(mode, stageIdx);
    updatePipelineStages();
    renderAllMaps();
    syncStatusUI();

    if (HG.sim.progress >= 100){
      clearInterval(HG.sim.timer);
      finalizeSimulation();
    }
  }, tickMs);
}

function updateLiveReadouts(mode, stageIdx){
  var pct = Math.round(HG.sim.progress);
  document.getElementById('liveProgressFill').style.width = pct + '%';
  document.getElementById('liveProgressPct').textContent = pct + '%';
  document.getElementById('liveStatusBadge').className = 'badge badge-live';
  document.getElementById('liveStatusBadge').textContent = 'Running';

  var simHrs = (HG.sim.progress / 100) * HG.runningScenario.duration;
  document.getElementById('liveSimTime').textContent = fmt1(simHrs) + ' / ' + fmt1(HG.runningScenario.duration) + ' hr';
  document.getElementById('liveStage').textContent = PIPELINE_STAGES[stageIdx].title;
  document.getElementById('liveGrid').textContent = stageIdx >= 2 ? mode.gridLabel : 'Pending — preprocessing';
  document.getElementById('liveSolver').textContent = SOLVER_BY_STAGE[stageIdx];
  document.getElementById('liveCells').textContent = stageIdx >= 3 ? fmtInt(mode.cells * (HG.sim.progress / 100)) : 'Pending';
  var regionIdx = clamp(Math.floor((HG.sim.progress / 100) * REGION_SEQUENCE.length), 0, REGION_SEQUENCE.length - 1);
  document.getElementById('liveRegion').textContent = REGION_SEQUENCE[regionIdx];
}

function finalizeSimulation(){
  var s = HG.runningScenario;
  var metrics = computeDerivedMetrics(s);
  var riskLevels = computeRiskLevels(s);

  var record = {
    id: randId('HG'),
    timestamp: nowFriendly(),
    scenario: s,
    metrics: metrics,
    riskLevels: riskLevels,
    depthSeries: generateSeries(metrics.maxDepth, s.duration, 12),
    velocitySeries: generateSeries(metrics.maxVelocity, s.duration, 12),
    arrivalByAsset: computeArrivalByAsset(metrics.earliestArrival),
    timelineSegments: computeTimelineSegments(s.mode)
  };

  HG.results = record;
  HG.runHistory.unshift(record);
  if (HG.runHistory.length > 6) HG.runHistory.pop();

  HG.sim.status = 'complete';
  document.getElementById('runSimBtn').disabled = false;
  document.getElementById('rerunBtn').disabled = false;
  document.getElementById('liveStatusBadge').className = 'badge badge-complete';
  document.getElementById('liveStatusBadge').textContent = 'Complete';
  document.getElementById('liveCompleteNotice').style.display = 'flex';

  syncStatusUI();
  updatePipelineStages();
  renderAllMaps();
  renderDashboardKPIs();
  renderRecentRuns();
  renderResults();
  renderReport();
  updateModeReadouts();

  toast('Simulation complete — ' + MODE_PRESETS[s.mode].label + ' mode run finished.');
}

/* ---------------------------------------------------------------------- */
/* Dashboard KPIs + recent runs                                           */
/* ---------------------------------------------------------------------- */
function renderDashboardKPIs(){
  if (!HG.results) return;
  var m = HG.results.metrics;
  document.getElementById('kpiDepthVal').innerHTML = fmt1(m.maxDepth) + '<span class="unit">m</span>';
  document.getElementById('kpiDepthSub').textContent = 'Peak near main channel bend';
  document.getElementById('kpiVelocityVal').innerHTML = fmt1(m.maxVelocity) + '<span class="unit">m/s</span>';
  document.getElementById('kpiVelocitySub').textContent = 'Peak near breach outlet';
  document.getElementById('kpiArrivalVal').innerHTML = Math.round(m.earliestArrival) + '<span class="unit">min</span>';
  document.getElementById('kpiArrivalSub').textContent = 'At nearest critical asset (demo)';
}

function renderRecentRuns(){
  var listEl = document.getElementById('recentRunsList');
  var emptyEl = document.getElementById('recentRunsEmpty');
  if (!HG.runHistory.length){
    emptyEl.style.display = 'block';
    listEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';
  var dotColor = { rapid: 'var(--cyan)', balanced: 'var(--blue)', high: 'var(--safe)' };

  listEl.innerHTML = HG.runHistory.map(function(r){
    var mode = MODE_PRESETS[r.scenario.mode];
    return '<div class="run-row" data-run-id="' + r.id + '">' +
      '<span class="run-dot" style="background:' + dotColor[r.scenario.mode] + ';"></span>' +
      '<div><div class="run-title">' + mode.label + ' mode run</div><div class="run-sub">' + r.timestamp + ' · ' + r.id + '</div></div>' +
      '<div class="run-metric">' + fmt1(r.metrics.maxDepth) + ' m<span class="l">Depth</span></div>' +
      '<div class="run-metric">' + fmt1(r.metrics.maxVelocity) + ' m/s<span class="l">Velocity</span></div>' +
      '<div class="run-metric">' + Math.round(r.metrics.earliestArrival) + ' min<span class="l">Arrival</span></div>' +
    '</div>';
  }).join('');

  listEl.querySelectorAll('.run-row').forEach(function(row){
    row.addEventListener('click', function(){
      var rec = HG.runHistory.find(function(r){ return r.id === row.getAttribute('data-run-id'); });
      if (!rec) return;
      HG.results = rec;
      renderDashboardKPIs();
      renderResults();
      renderReport();
      syncStatusUI();
      navigateTo('results');
      toast('Loaded ' + MODE_PRESETS[rec.scenario.mode].label + ' mode run from ' + rec.timestamp + '.');
    });
  });
}

/* ---------------------------------------------------------------------- */
/* Results view                                                           */
/* ---------------------------------------------------------------------- */
function renderResults(){
  var hasResults = !!HG.results;
  document.getElementById('resultsEmpty').style.display = hasResults ? 'none' : 'block';
  document.getElementById('resultsContent').style.display = hasResults ? 'block' : 'none';
  if (!hasResults) return;

  var r = HG.results, m = r.metrics, mode = MODE_PRESETS[r.scenario.mode];
  document.getElementById('resultsRunTag').textContent = mode.label + ' mode · ' + r.timestamp;

  document.getElementById('resDepth').innerHTML = fmt1(m.maxDepth) + '<span class="unit">m</span>';
  document.getElementById('resDepthSub').textContent = 'Peak near main channel bend';
  document.getElementById('resVelocity').innerHTML = fmt1(m.maxVelocity) + '<span class="unit">m/s</span>';
  document.getElementById('resVelocitySub').textContent = 'Peak near breach outlet';
  document.getElementById('resArrival').innerHTML = Math.round(m.earliestArrival) + '<span class="unit">min</span>';
  document.getElementById('resArrivalSub').textContent = 'At nearest critical asset (demo)';
  document.getElementById('resArea').innerHTML = fmt1(m.affectedArea) + '<span class="unit">km²</span>';
  document.getElementById('resAreaSub').textContent = mode.label + ' mode · ' + r.scenario.duration + ' hr window';

  renderLineChart(document.getElementById('chartDepth'), r.depthSeries, { color: 'var(--cyan)', unit: ' m' });
  renderLineChart(document.getElementById('chartVelocity'), r.velocitySeries, { color: 'var(--blue)', unit: ' m/s' });
  renderBarChart(document.getElementById('chartArrival'), r.arrivalByAsset, {});
  renderStackedTimeline(document.getElementById('chartTimeline'), r.timelineSegments, {});
}

/* ---------------------------------------------------------------------- */
/* Risk & critical asset view (always live from current scenario)         */
/* ---------------------------------------------------------------------- */
function renderRisk(){
  var riskLevels = computeRiskLevels(HG.scenario);
  var counts = riskCounts(riskLevels);

  document.getElementById('riskCountLow').textContent = counts.low;
  document.getElementById('riskCountMedium').textContent = counts.medium;
  document.getElementById('riskCountHigh').textContent = counts.high;
  document.getElementById('riskCountCritical').textContent = counts.critical;
  document.getElementById('riskAssetCount').textContent = ASSETS.length + ' assets';

  var m = computeDerivedMetrics(HG.scenario);
  var rows = ASSETS.slice().sort(function(a, b){ return a.distanceKm - b.distanceKm; }).map(function(a){
    var level = riskLevels[a.id];
    var depthAtSite = fmt1(m.maxDepth * a.exposure);
    return '<tr class="hover-row">' +
      '<td class="primary-cell">' + a.name + '</td>' +
      '<td>' + a.type + '</td>' +
      '<td class="mono-cell">' + fmt1(a.distanceKm) + ' km</td>' +
      '<td class="mono-cell">' + depthAtSite + ' m</td>' +
      '<td><span class="badge ' + riskBadgeClass(level) + '">' + riskLabel(level) + '</span></td>' +
    '</tr>';
  }).join('');
  document.getElementById('riskTableBody').innerHTML = rows;
}

/* ---------------------------------------------------------------------- */
/* Benchmark view                                                          */
/* ---------------------------------------------------------------------- */
function setupBenchmark(){
  var seg = document.getElementById('benchModeSegmented');
  setSegmentedActive(seg, HG.benchMode);
  seg.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      HG.benchMode = btn.getAttribute('data-mode');
      setSegmentedActive(seg, HG.benchMode);
      renderBenchmark();
    });
  });
}

function benchBar(name, rawValue, maxValue, color, displayText){
  var pct = clamp((rawValue / maxValue) * 100, 2, 100);
  return '<div class="bench-bar-row"><span class="name">' + name + '</span>' +
    '<div class="bench-bar-track"><div class="bench-bar-fill" style="width:' + pct.toFixed(1) + '%; background:' + color + ';"></div></div>' +
    '<span class="bench-bar-val">' + displayText + '</span></div>';
}

function renderBenchmark(){
  var mode = MODE_PRESETS[HG.benchMode];
  var ref = CONVENTIONAL_REF;
  var gradient = 'linear-gradient(90deg, var(--blue), var(--cyan))';

  var maxRuntime = Math.max(mode.runtimeSec, ref.runtimeSec);
  document.getElementById('benchRuntime').innerHTML =
    benchBar('HydroGuard (' + mode.label + ')', mode.runtimeSec, maxRuntime, gradient, '~' + mode.runtimeSec + ' s') +
    benchBar('Conventional', ref.runtimeSec, maxRuntime, 'var(--ink-4)', '~' + ref.runtimeSec + ' s');

  var maxCells = Math.max(mode.cells, ref.cells);
  document.getElementById('benchCells').innerHTML =
    benchBar('HydroGuard (' + mode.label + ')', mode.cells, maxCells, gradient, fmtInt(mode.cells)) +
    benchBar('Conventional', ref.cells, maxCells, 'var(--ink-4)', fmtInt(ref.cells));

  document.getElementById('benchTableBody').innerHTML =
    '<tr><td class="primary-cell">Runtime (demo)</td><td class="mono-cell">~' + mode.runtimeSec + ' s</td><td class="mono-cell">~' + ref.runtimeSec + ' s</td><td><span class="badge badge-demo">DEMO</span></td></tr>' +
    '<tr><td class="primary-cell">Grid cells</td><td class="mono-cell">' + fmtInt(mode.cells) + '</td><td class="mono-cell">' + fmtInt(ref.cells) + '</td><td><span class="badge badge-demo">DEMO</span></td></tr>' +
    '<tr><td class="primary-cell">Full 2D SWE coverage</td><td class="mono-cell">' + mode.coverage + '%</td><td class="mono-cell">' + ref.coverage + '%</td><td><span class="badge badge-demo">ILLUSTRATIVE</span></td></tr>' +
    '<tr><td class="primary-cell">Active solver</td><td>' + mode.solver + '</td><td>Full 2D SWE (uniform grid)</td><td><span class="badge badge-neutral">Reference</span></td></tr>';
}

/* ---------------------------------------------------------------------- */
/* Report view                                                             */
/* ---------------------------------------------------------------------- */
function renderReport(){
  var hasResults = !!HG.results;
  document.getElementById('reportEmpty').style.display = hasResults ? 'none' : 'block';
  document.getElementById('reportContent').style.display = hasResults ? 'block' : 'none';
  if (!hasResults) return;

  var r = HG.results, s = r.scenario, m = r.metrics, mode = MODE_PRESETS[s.mode];
  document.getElementById('repGenerated').textContent = nowFriendly();
  document.getElementById('repRunId').textContent = r.id;
  document.getElementById('repMode').textContent = mode.label;

  document.getElementById('repScenarioTable').innerHTML = [
    ['Dam height', s.damHeight + ' m'], ['Breach width', s.breachWidth + ' m'],
    ['Breach formation time', s.breachTime + ' min'], ['Initial water level', s.waterLevel + ' m'],
    ['Simulation duration', s.duration + ' hr'], ['Simulation mode', mode.label],
    ['DEM dataset', s.dem], ['River / terrain data', s.river]
  ].map(function(row){ return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>'; }).join('');

  document.getElementById('repStatsGrid').innerHTML =
    statBox('Max depth', fmt1(m.maxDepth) + ' m') +
    statBox('Max velocity', fmt1(m.maxVelocity) + ' m/s') +
    statBox('Earliest arrival', Math.round(m.earliestArrival) + ' min') +
    statBox('Affected area', fmt1(m.affectedArea) + ' km²');

  var counts = riskCounts(r.riskLevels);
  document.getElementById('repRiskGrid').innerHTML =
    statBox('Low', counts.low) + statBox('Medium', counts.medium) + statBox('High', counts.high) + statBox('Critical', counts.critical);

  var topAssets = ASSETS.map(function(a){ return { a: a, level: r.riskLevels[a.id] }; })
    .filter(function(x){ return x.level === 'critical' || x.level === 'high'; })
    .slice(0, 5);
  document.getElementById('repTopAssets').innerHTML = topAssets.length
    ? topAssets.map(function(x){ return '<tr><td>' + x.a.name + ' (' + x.a.type + ')</td><td>' + riskLabel(x.level) + '</td></tr>'; }).join('')
    : '<tr><td colspan="2">No high or critical assets under this scenario.</td></tr>';

  renderFloodMap(document.getElementById('reportMapSnapshot'), { mini: true, progress: 1, showFront: false, layers: { depth: true, roads: true, buildings: true, assets: true }, riskLevels: r.riskLevels });

  document.getElementById('repPerfTable').innerHTML =
    '<tr><td>Grid cells (demo)</td><td>' + fmtInt(mode.cells) + '</td></tr>' +
    '<tr><td>Runtime (demo)</td><td>~' + mode.runtimeSec + ' s</td></tr>' +
    '<tr><td>Full 2D SWE coverage (illustrative)</td><td>' + mode.coverage + '%</td></tr>' +
    '<tr><td>Conventional reference runtime (demo)</td><td>~' + CONVENTIONAL_REF.runtimeSec + ' s</td></tr>';
}

function statBox(label, val){
  return '<div class="report-stat"><div class="n">' + val + '</div><div class="l">' + label + '</div></div>';
}

function generateReportHTML(){
  var r = HG.results, s = r.scenario, m = r.metrics, mode = MODE_PRESETS[s.mode];
  var counts = riskCounts(r.riskLevels);
  var topAssets = ASSETS.map(function(a){ return { a: a, level: r.riskLevels[a.id] }; })
    .filter(function(x){ return x.level === 'critical' || x.level === 'high'; });

  var rowsHTML = function(rows){ return rows.map(function(row){ return '<tr><td>' + row[0] + '</td><td style="text-align:right; font-family:monospace;">' + row[1] + '</td></tr>'; }).join(''); };

  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>HydroGuard Report ' + r.id + '</title>' +
  '<style>body{font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:40px auto;color:#12202f;padding:0 20px;}' +
  'h1{font-size:20px;margin-bottom:2px;} h4{font-size:12px;letter-spacing:.05em;color:#1a7ea6;text-transform:uppercase;margin:26px 0 8px;}' +
  'table{width:100%;border-collapse:collapse;font-size:13px;} td{padding:6px 0;border-bottom:1px dashed #ccc;}' +
  '.meta{color:#5b6b82;font-size:12px;} .grid{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;}' +
  '.stat{border:1px solid #d7dee6;border-radius:8px;padding:8px 12px;min-width:110px;} .stat b{display:block;font-size:17px;}' +
  '.note{font-size:11px;color:#7a8aa0;border-top:1px solid #ddd;padding-top:10px;margin-top:26px;}' +
  '.tag{display:inline-block;font-size:10px;background:#fff3cd;color:#8a6d00;border-radius:10px;padding:2px 8px;margin-left:6px;}</style></head><body>' +
  '<h1>Dam Break Inundation Simulation Report</h1>' +
  '<div class="meta">HydroGuard · SIH26161 · Team Creative Crew · Software prototype<br>Generated: ' + nowFriendly() + ' &nbsp;·&nbsp; Run ID: ' + r.id + ' &nbsp;·&nbsp; Mode: ' + mode.label + '</div>' +
  '<h4>Scenario parameters</h4><table>' + rowsHTML([
    ['Dam height', s.damHeight + ' m'], ['Breach width', s.breachWidth + ' m'], ['Breach formation time', s.breachTime + ' min'],
    ['Initial water level', s.waterLevel + ' m'], ['Simulation duration', s.duration + ' hr'], ['Simulation mode', mode.label],
    ['DEM dataset', s.dem], ['River / terrain data', s.river]
  ]) + '</table>' +
  '<h4>Flood statistics</h4><div class="grid">' +
    '<div class="stat"><b>' + fmt1(m.maxDepth) + ' m</b>Max depth</div>' +
    '<div class="stat"><b>' + fmt1(m.maxVelocity) + ' m/s</b>Max velocity</div>' +
    '<div class="stat"><b>' + Math.round(m.earliestArrival) + ' min</b>Earliest arrival</div>' +
    '<div class="stat"><b>' + fmt1(m.affectedArea) + ' km²</b>Affected area</div>' +
  '</div>' +
  '<h4>Risk summary</h4><div class="grid">' +
    '<div class="stat"><b>' + counts.low + '</b>Low</div><div class="stat"><b>' + counts.medium + '</b>Medium</div>' +
    '<div class="stat"><b>' + counts.high + '</b>High</div><div class="stat"><b>' + counts.critical + '</b>Critical</div>' +
  '</div>' +
  '<table>' + (topAssets.length ? rowsHTML(topAssets.map(function(x){ return [x.a.name + ' (' + x.a.type + ')', riskLabel(x.level)]; })) : '<tr><td>No high or critical assets under this scenario.</td></tr>') + '</table>' +
  '<h4>Performance summary <span class="tag">DEMO / ILLUSTRATIVE</span></h4><table>' + rowsHTML([
    ['Grid cells (demo)', fmtInt(mode.cells)], ['Runtime (demo)', '~' + mode.runtimeSec + ' s'],
    ['Full 2D SWE coverage (illustrative)', mode.coverage + '%'], ['Conventional reference runtime (demo)', '~' + CONVENTIONAL_REF.runtimeSec + ' s']
  ]) + '</table>' +
  '<p class="note">Generated by the HydroGuard prototype — Team Creative Crew — SIH26161. All figures illustrative for demonstration purposes unless otherwise validated. Terrain and asset data are demo datasets, not sourced from a field GIS survey.</p>' +
  '</body></html>';
}

function setupReportActions(){
  document.getElementById('printReportBtn').addEventListener('click', function(){ window.print(); });
  document.getElementById('downloadReportBtn').addEventListener('click', function(){
    if (!HG.results){ toast('Run a simulation first to generate a report.', true); return; }
    var html = generateReportHTML();
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'HydroGuard_Report_' + HG.results.id + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    toast('Report downloaded.');
  });
}

/* ---------------------------------------------------------------------- */
/* Reset demo data                                                        */
/* ---------------------------------------------------------------------- */
function resetDemoData(){
  if (HG.sim.timer) clearInterval(HG.sim.timer);
  HG.scenario = Object.assign({}, SCENARIO_DEFAULTS);
  HG.sim = { status: 'idle', progress: 0, stageIndex: -1, timer: null };
  HG.results = null;
  HG.runHistory = [];
  HG.benchMode = 'balanced';
  HG.map = { zoom: 1, layers: { depth: true, velocity: false, arrival: false, roads: true, buildings: true, assets: true, risk: false } };

  syncScenarioForm();
  setSegmentedActive(document.getElementById('benchModeSegmented'), HG.benchMode);

  document.getElementById('kpiDepthVal').innerHTML = '—<span class="unit">m</span>';
  document.getElementById('kpiDepthSub').textContent = 'Run a simulation to populate';
  document.getElementById('kpiVelocityVal').innerHTML = '—<span class="unit">m/s</span>';
  document.getElementById('kpiVelocitySub').textContent = 'Run a simulation to populate';
  document.getElementById('kpiArrivalVal').innerHTML = '—<span class="unit">min</span>';
  document.getElementById('kpiArrivalSub').textContent = 'Run a simulation to populate';

  document.getElementById('runSimBtn').disabled = false;
  document.getElementById('rerunBtn').disabled = true;
  document.getElementById('liveEmpty').style.display = 'block';
  document.getElementById('liveContent').style.display = 'none';

  syncStatusUI();
  updatePipelineStages();
  renderAllMaps();
  renderRisk();
  renderBenchmark();
  renderRecentRuns();
  renderResults();
  renderReport();
  syncLayerCheckboxes();
  applyZoom();

  toast('Demo data reset to defaults.');
}

/* ---------------------------------------------------------------------- */
/* Global click delegation (nav + dropdowns + tabs)                       */
/* ---------------------------------------------------------------------- */
function setupGlobalEvents(){
  document.addEventListener('click', function(e){
    var navEl = e.target.closest('[data-nav], [data-view]');
    if (navEl){
      var view = navEl.getAttribute('data-nav') || navEl.getAttribute('data-view');
      if (view){ e.preventDefault(); navigateTo(view); return; }
    }

    var tabBtn = e.target.closest('.tab-btn');
    if (tabBtn){ switchTab(tabBtn.getAttribute('data-tab')); return; }

    if (e.target.closest('#settingsBtn')){
      e.stopPropagation();
      var d = document.getElementById('settingsDropdown');
      document.getElementById('avatarDropdown').classList.remove('open');
      d.classList.toggle('open');
      return;
    }
    if (e.target.closest('#avatarBtn')){
      e.stopPropagation();
      var d2 = document.getElementById('avatarDropdown');
      document.getElementById('settingsDropdown').classList.remove('open');
      d2.classList.toggle('open');
      return;
    }
    if (e.target.closest('.dropdown')) return;
    if (e.target.closest('#mapLayersPanel') || e.target.closest('#mapLayersBtn')) return;

    closeDropdowns();
    document.getElementById('mapLayersPanel').classList.remove('open');
  });

  document.getElementById('navToggle').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebarBackdrop').addEventListener('click', closeMobileSidebar);

  document.getElementById('resetDemoBtn').addEventListener('click', function(){ resetDemoData(); closeDropdowns(); });

  document.getElementById('rerunBtn').addEventListener('click', function(){
    if (!HG.runHistory.length){ toast('No previous scenario to re-run yet.', true); return; }
    HG.scenario = Object.assign({}, HG.runHistory[0].scenario);
    syncScenarioForm();
    startSimulation();
  });

  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      var frame = document.getElementById('mapFrameFull');
      if (frame.classList.contains('fullscreen')){
        frame.classList.remove('fullscreen');
        setIcon(document.querySelector('#mapFullscreenBtn [data-icon]'), 'maximize');
      }
      closeMobileSidebar();
      closeDropdowns();
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Init                                                                    */
/* ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function(){
  applyIcons();
  buildPipelineDOM();
  applyIcons();

  setupScenarioBuilder();
  setupMapControls();
  setupBenchmark();
  setupReportActions();
  setupGlobalEvents();

  setSegmentedActive(document.getElementById('modeSegmented'), HG.scenario.mode);
  updateModeReadouts();
  renderScenarioSummary();
  syncStatusUI();
  updatePipelineStages();
  renderRisk();
  renderBenchmark();
  renderAllMaps();
  renderRecentRuns();
  renderResults();
  renderReport();
  syncLayerCheckboxes();

  document.getElementById('rerunBtn').disabled = true;
});

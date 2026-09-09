/* ==========================================================================
   HydroGuard — render.js
   SVG chart + GIS flood-map renderers. Pure functions: build markup, write
   it into a container element. No external chart/map libraries — keeps the
   prototype dependency-free and offline-friendly.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Shared helpers                                                         */
/* ---------------------------------------------------------------------- */
function smoothPath(pts){
  if (pts.length < 2) return '';
  var d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
  for (var i = 0; i < pts.length - 1; i++){
    var p0 = pts[i - 1] || pts[i];
    var p1 = pts[i];
    var p2 = pts[i + 1];
    var p3 = pts[i + 2] || p2;
    var c1x = p1.x + (p2.x - p0.x) / 6;
    var c1y = p1.y + (p2.y - p0.y) / 6;
    var c2x = p2.x - (p3.x - p1.x) / 6;
    var c2y = p2.y - (p3.y - p1.y) / 6;
    d += ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
  }
  return d;
}

function legendHTML(items){
  return '<div class="chart-legend">' + items.map(function(it){
    return '<div class="li"><span class="sw" style="background:' + it.color + ';"></span>' + it.label + '</div>';
  }).join('') + '</div>';
}

/* ---------------------------------------------------------------------- */
/* Line chart — e.g. depth / velocity over time                          */
/* ---------------------------------------------------------------------- */
function renderLineChart(container, points, opts){
  opts = opts || {};
  var W = 560, H = 210;
  var pad = { l: 40, r: 16, t: 16, b: 28 };
  var plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  var color = opts.color || 'var(--cyan)';
  var unit = opts.unit || '';
  var xMax = opts.xMax || Math.max.apply(null, points.map(function(p){ return p.x; }));
  var yMax = opts.yMax || Math.max.apply(null, points.map(function(p){ return p.y; })) * 1.2 || 1;

  var px = points.map(function(p){
    return { x: pad.l + (p.x / xMax) * plotW, y: pad.t + plotH - (p.y / yMax) * plotH, raw: p };
  });

  var gridLines = '', gridLabels = '';
  for (var g = 0; g <= 4; g++){
    var gy = pad.t + plotH - (g / 4) * plotH;
    var val = (g / 4) * yMax;
    gridLines += '<line x1="' + pad.l + '" y1="' + gy.toFixed(1) + '" x2="' + (W - pad.r) + '" y2="' + gy.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>';
    gridLabels += '<text x="' + (pad.l - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" font-size="9.5" fill="var(--ink-4)" text-anchor="end">' + fmt1(val) + '</text>';
  }

  var xTickCount = Math.min(6, points.length);
  var xLabels = '';
  for (var i = 0; i < xTickCount; i++){
    var idx = Math.round((i / (xTickCount - 1)) * (points.length - 1));
    var pt = px[idx];
    xLabels += '<text x="' + pt.x.toFixed(1) + '" y="' + (H - 8) + '" font-size="9.5" fill="var(--ink-4)" text-anchor="middle">' + fmt1(pt.raw.x) + 'h</text>';
  }

  var linePath = smoothPath(px);
  var areaPath = linePath + ' L ' + px[px.length - 1].x.toFixed(1) + ' ' + (pad.t + plotH) + ' L ' + px[0].x.toFixed(1) + ' ' + (pad.t + plotH) + ' Z';

  var gid = (container.id || 'chart') + '-area';
  var peak = px.reduce(function(a, b){ return b.raw.y > a.raw.y ? b : a; });

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + color + '" stop-opacity="0.32"/>' +
      '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    gridLines + gridLabels +
    '<path d="' + areaPath + '" fill="url(#' + gid + ')" stroke="none"/>' +
    '<path d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="' + peak.x.toFixed(1) + '" cy="' + peak.y.toFixed(1) + '" r="3.6" fill="' + color + '" stroke="#04101c" stroke-width="1.5"/>' +
    '<text x="' + peak.x.toFixed(1) + '" y="' + (peak.y - 10).toFixed(1) + '" font-size="10" fill="var(--ink-1)" text-anchor="middle" font-family="var(--f-mono)">' + fmt1(peak.raw.y) + unit + '</text>' +
    '<line x1="' + pad.l + '" y1="' + (pad.t + plotH) + '" x2="' + (W - pad.r) + '" y2="' + (pad.t + plotH) + '" stroke="var(--line-strong)" stroke-width="1"/>' +
    xLabels +
    '</svg>';

  container.innerHTML = svg;
}

/* ---------------------------------------------------------------------- */
/* Bar chart — e.g. arrival time by location                             */
/* ---------------------------------------------------------------------- */
function renderBarChart(container, data, opts){
  opts = opts || {};
  var W = 560, H = 210;
  var pad = { l: 40, r: 16, t: 20, b: 34 };
  var plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  var maxVal = Math.max.apply(null, data.map(function(d){ return d.value; })) * 1.25 || 1;
  var n = data.length;
  var slot = plotW / n;
  var barW = Math.min(38, slot * 0.55);

  var gridLines = '', gridLabels = '';
  for (var g = 0; g <= 4; g++){
    var gy = pad.t + plotH - (g / 4) * plotH;
    var val = (g / 4) * maxVal;
    gridLines += '<line x1="' + pad.l + '" y1="' + gy.toFixed(1) + '" x2="' + (W - pad.r) + '" y2="' + gy.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>';
    gridLabels += '<text x="' + (pad.l - 8) + '" y="' + (gy + 3.5).toFixed(1) + '" font-size="9.5" fill="var(--ink-4)" text-anchor="end">' + Math.round(val) + '</text>';
  }

  var bars = '', labels = '';
  data.forEach(function(d, i){
    var cx = pad.l + slot * i + slot / 2;
    var bh = (d.value / maxVal) * plotH;
    var by = pad.t + plotH - bh;
    var color = d.color || 'var(--blue)';
    bars += '<rect x="' + (cx - barW / 2).toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" fill="' + color + '" opacity="0.88"/>';
    bars += '<text x="' + cx.toFixed(1) + '" y="' + (by - 6).toFixed(1) + '" font-size="9.5" fill="var(--ink-2)" text-anchor="middle" font-family="var(--f-mono)">' + Math.round(d.value) + '</text>';
    labels += '<text x="' + cx.toFixed(1) + '" y="' + (H - 12) + '" font-size="9.5" fill="var(--ink-4)" text-anchor="middle">' + d.label + '</text>';
  });

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
    gridLines + gridLabels + bars +
    '<line x1="' + pad.l + '" y1="' + (pad.t + plotH) + '" x2="' + (W - pad.r) + '" y2="' + (pad.t + plotH) + '" stroke="var(--line-strong)" stroke-width="1"/>' +
    labels +
    '</svg>';

  container.innerHTML = svg;
}

/* ---------------------------------------------------------------------- */
/* Stacked horizontal timeline — pipeline stage durations                */
/* ---------------------------------------------------------------------- */
function renderStackedTimeline(container, segments, opts){
  opts = opts || {};
  var W = 560, H = 60;
  var barY = 10, barH = 26;
  var total = segments.reduce(function(s, d){ return s + d.value; }, 0) || 1;
  var x = 0;
  var rects = '';
  segments.forEach(function(seg){
    var w = (seg.value / total) * W;
    rects += '<rect x="' + x.toFixed(1) + '" y="' + barY + '" width="' + Math.max(w, 0.5).toFixed(1) + '" height="' + barH + '" fill="' + seg.color + '"/>';
    x += w;
  });

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="height:' + H + 'px;">' +
    '<defs><clipPath id="' + (container.id || 'tl') + '-clip"><rect x="0" y="' + barY + '" width="' + W + '" height="' + barH + '" rx="6"/></clipPath></defs>' +
    '<g clip-path="url(#' + (container.id || 'tl') + '-clip)">' + rects + '</g>' +
    '<rect x="0" y="' + barY + '" width="' + W + '" height="' + barH + '" rx="6" fill="none" stroke="var(--line-strong)" stroke-width="1"/>' +
    '</svg>';

  var legend = '<div class="chart-legend">' + segments.map(function(seg){
    return '<div class="li"><span class="sw" style="background:' + seg.color + ';"></span>' + seg.label + ' <span style="color:var(--ink-4);">(' + fmt1(seg.value) + 's)</span></div>';
  }).join('') + '</div>';

  container.innerHTML = svg + legend;
}

/* ---------------------------------------------------------------------- */
/* GIS Flood Map                                                          */
/* ---------------------------------------------------------------------- */
var RIVER_D = 'M400,65 C388,130 432,175 408,245 C384,315 422,365 398,430 C378,485 402,530 390,580';
var RIVER_LEN = 680;
var RIVER_KEYPTS = [ { y: 65, x: 400 }, { y: 245, x: 408 }, { y: 430, x: 398 }, { y: 585, x: 390 } ];

function riverXAt(y){
  var pts = RIVER_KEYPTS;
  if (y <= pts[0].y) return pts[0].x;
  for (var i = 0; i < pts.length - 1; i++){
    if (y >= pts[i].y && y <= pts[i + 1].y){
      var t = (y - pts[i].y) / (pts[i + 1].y - pts[i].y);
      return pts[i].x + t * (pts[i + 1].x - pts[i].x);
    }
  }
  return pts[pts.length - 1].x;
}

var RISK_COLOR = {
  low: 'var(--safe)', medium: 'var(--medium)', high: 'var(--high)', critical: 'var(--critical)'
};

function assetMapPos(asset, index){
  var y = clamp(70 + (asset.distanceKm / 3.4) * 500, 70, 578);
  var cx = riverXAt(y);
  var side = index % 2 === 0 ? -1 : 1;
  var offset = side * (34 + (1 - asset.exposure) * 95);
  var jitter = ((index * 17) % 24) - 12;
  return { x: cx + offset, y: y + jitter };
}

function renderFloodMap(container, opts){
  opts = opts || {};
  var mini = !!opts.mini;
  var progress = clamp(opts.progress || 0, 0, 1);
  var layers = opts.layers || { depth:true, velocity:false, arrival:false, roads:true, buildings:true, assets:true, risk:false };
  var riskLevels = opts.riskLevels || {};
  var ns = (container.id || 'map') + '-';
  var showFront = !!opts.showFront && progress > 0 && progress < 1;

  var visibleLen = (progress * RIVER_LEN).toFixed(0);
  var bigGap = (RIVER_LEN * 2 + 100).toFixed(0);

  /* ---- terrain background ---- */
  var terrain =
    '<path d="M0,0 L290,0 C245,120 268,260 205,385 C160,470 185,545 118,600 L0,600 Z" fill="rgba(20,40,66,0.42)"/>' +
    '<path d="M800,0 L515,0 C558,115 535,255 598,362 C650,452 618,540 700,600 L800,600 Z" fill="rgba(9,18,32,0.48)"/>' +
    '<path d="M20,40 C120,20 200,60 260,10" fill="none" stroke="rgba(148,178,214,0.10)" stroke-width="1.5"/>' +
    '<path d="M10,470 C90,440 150,480 210,430" fill="none" stroke="rgba(148,178,214,0.10)" stroke-width="1.5"/>' +
    '<path d="M780,60 C700,90 650,50 600,90" fill="none" stroke="rgba(148,178,214,0.10)" stroke-width="1.5"/>' +
    '<path d="M790,480 C720,450 680,500 630,460" fill="none" stroke="rgba(148,178,214,0.10)" stroke-width="1.5"/>';

  /* ---- roads ---- */
  var roads = '';
  if (layers.roads){
    roads +=
      '<path d="M110,150 C300,128 500,160 690,118" fill="none" stroke="#0a1626" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M110,150 C300,128 500,160 690,118" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-dasharray="7 6"/>' +
      '<path d="M598,40 C636,200 606,382 646,580" fill="none" stroke="#0a1626" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M598,40 C636,200 606,382 646,580" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-linecap="round" stroke-dasharray="7 6"/>' +
      '<rect x="384" y="112" width="34" height="9" rx="2" fill="var(--ink-2)" transform="rotate(-7 401 116)"/>';
    if (!mini) roads += '<text x="424" y="110" font-size="10.5" fill="var(--ink-3)">Bridge</text>';
  }

  /* ---- dam / breach marker ---- */
  var dam = '<g>' +
    '<circle cx="400" cy="62" r="14" fill="var(--critical)" opacity="0.16"/>' +
    '<circle cx="400" cy="62" r="7" fill="var(--critical)" stroke="#0a0f1c" stroke-width="2"/>' +
    (mini ? '' : '<text x="400" y="40" font-size="11" fill="var(--ink-1)" text-anchor="middle" font-weight="600">Dam / Breach</text>') +
    '</g>';

  /* ---- flood depth layers (progressive reveal along river) ---- */
  var flood = '';
  if (layers.depth){
    var bands = [
      { w: 74, color: '#cdf4f2', op: 0.24 },
      { w: 56, color: '#7fe0e6', op: 0.34 },
      { w: 40, color: '#2dd4ee', op: 0.5 },
      { w: 24, color: '#1c7fc4', op: 0.68 },
      { w: 11, color: '#16205a', op: 0.85 }
    ];
    bands.forEach(function(b){
      flood += '<path d="' + RIVER_D + '" fill="none" stroke="' + b.color + '" stroke-width="' + b.w + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + b.op + '" stroke-dasharray="' + visibleLen + ' ' + bigGap + '"/>';
    });
  } else {
    flood += '<path d="' + RIVER_D + '" fill="none" stroke="var(--ink-4)" stroke-width="3" stroke-linecap="round" opacity="0.55"/>';
  }

  /* ---- arrival time bands ---- */
  var arrival = '';
  if (layers.arrival){
    var arrivalColors = ['var(--critical)', 'var(--high)', 'var(--medium)', 'var(--safe)'];
    var qLen = RIVER_LEN / 4;
    arrivalColors.forEach(function(c, i){
      arrival += '<path d="' + RIVER_D + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="butt" opacity="0.75" stroke-dasharray="' + (i * qLen).toFixed(0) + ' ' + qLen.toFixed(0) + ' ' + bigGap + '" transform="translate(16,0)"/>';
    });
  }

  /* ---- velocity arrows ---- */
  var velocity = '';
  if (layers.velocity){
    var vPts = [ { t: 0.1, len: 30, rot: 8 }, { t: 0.28, len: 24, rot: -6 }, { t: 0.48, len: 19, rot: 10 }, { t: 0.68, len: 14, rot: -4 }, { t: 0.86, len: 10, rot: 6 } ];
    vPts.forEach(function(v){
      var y = 70 + v.t * 505;
      var x = riverXAt(y);
      velocity += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + v.rot + ')">' +
        '<line x1="0" y1="' + (-v.len/2) + '" x2="0" y2="' + (v.len/2) + '" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round"/>' +
        '<polyline points="-4,' + (v.len/2 - 5) + ' 0,' + (v.len/2) + ' 4,' + (v.len/2 - 5) + '" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</g>';
    });
  }

  /* ---- buildings / residential + generic settlement texture ---- */
  var buildings = '';
  if (layers.buildings){
    var genericDots = [ [230,200],[255,215],[520,240],[545,260],[270,470],[300,485],[520,500] ];
    genericDots.forEach(function(p){
      buildings += '<rect x="' + (p[0]-3) + '" y="' + (p[1]-3) + '" width="6" height="6" rx="1" fill="var(--ink-4)" opacity="0.5"/>';
    });
  }

  /* ---- asset markers (residential -> buildings layer, others -> assets layer) ---- */
  var assetMarkers = '';
  ASSETS.forEach(function(asset, i){
    var isResidential = asset.type === 'Residential';
    var layerOn = isResidential ? layers.buildings : layers.assets;
    if (!layerOn) return;
    var pos = assetMapPos(asset, i);
    var color = (layers.risk && riskLevels[asset.id]) ? RISK_COLOR[riskLevels[asset.id]] : (asset.type === 'Bridge' ? 'var(--ink-1)' : 'var(--blue)');
    var r = mini ? 4 : (asset.type === 'Hospital' || asset.type === 'Bridge' ? 6.5 : 5);
    assetMarkers += '<circle cx="' + pos.x.toFixed(1) + '" cy="' + pos.y.toFixed(1) + '" r="' + r + '" fill="' + color + '" stroke="#04101c" stroke-width="1.6"/>';
    if (!mini){
      assetMarkers += '<text x="' + pos.x.toFixed(1) + '" y="' + (pos.y - r - 5).toFixed(1) + '" font-size="9.5" fill="var(--ink-2)" text-anchor="middle">' + asset.short + '</text>';
    }
  });

  /* ---- live "computation front" marker ---- */
  var front = '';
  if (showFront){
    var fy = 70 + progress * 505;
    var fx = riverXAt(fy);
    front = '<g>' +
      '<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="9" fill="none" stroke="var(--cyan)" stroke-width="2" opacity="0.85"><animate attributeName="r" values="7;15;7" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.05;0.9" dur="1.6s" repeatCount="indefinite"/></circle>' +
      '<circle cx="' + fx.toFixed(1) + '" cy="' + fy.toFixed(1) + '" r="4" fill="var(--cyan)"/>' +
      '</g>';
  }

  var svg = '<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Simulated flood extent map (demo data)">' +
    '<g>' + terrain + '</g>' +
    '<g>' + roads + '</g>' +
    '<g>' + arrival + '</g>' +
    '<g>' + flood + '</g>' +
    '<g>' + velocity + '</g>' +
    '<g>' + buildings + '</g>' +
    '<g>' + assetMarkers + '</g>' +
    dam +
    front +
    '</svg>';

  container.innerHTML = svg;
}

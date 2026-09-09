/* ==========================================================================
   HydroGuard — data.js
   Icon set, mock/demo data, scenario presets, and shared state.
   No backend — everything here is illustrative demo data for the SIH26161
   software-only prototype.
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Icon set (hand-built, stroke-based, 24x24 viewBox)                     */
/* ---------------------------------------------------------------------- */
var ICON_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

var ICONS = {
  menu: `<svg ${ICON_ATTR}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  x: `<svg ${ICON_ATTR}><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`,
  settings: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="3.2"/><line x1="12" y1="2.5" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="21.5" y2="12"/><line x1="5.1" y1="5.1" x2="7.2" y2="7.2"/><line x1="16.8" y1="16.8" x2="18.9" y2="18.9"/><line x1="5.1" y1="18.9" x2="7.2" y2="16.8"/><line x1="16.8" y1="7.2" x2="18.9" y2="5.1"/></svg>`,
  grid: `<svg ${ICON_ATTR}><rect x="3" y="3" width="8" height="8" rx="1.6"/><rect x="13" y="3" width="8" height="8" rx="1.6"/><rect x="3" y="13" width="8" height="8" rx="1.6"/><rect x="13" y="13" width="8" height="8" rx="1.6"/></svg>`,
  sliders: `<svg ${ICON_ATTR}><line x1="5" y1="4" x2="5" y2="20"/><circle cx="5" cy="9" r="2.1" fill="currentColor" stroke="none"/><line x1="12" y1="4" x2="12" y2="20"/><circle cx="12" cy="15" r="2.1" fill="currentColor" stroke="none"/><line x1="19" y1="4" x2="19" y2="20"/><circle cx="19" cy="7" r="2.1" fill="currentColor" stroke="none"/></svg>`,
  cpu: `<svg ${ICON_ATTR}><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/></svg>`,
  map: `<svg ${ICON_ATTR}><path d="M3 6.5 L9 4.5 L15 6.5 L21 4.5 V17.5 L15 19.5 L9 17.5 L3 19.5 Z"/><line x1="9" y1="4.5" x2="9" y2="17.5"/><line x1="15" y1="6.5" x2="15" y2="19.5"/></svg>`,
  barchart: `<svg ${ICON_ATTR}><line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="13" width="3.2" height="7" rx="0.6"/><rect x="10.4" y="9" width="3.2" height="11" rx="0.6"/><rect x="14.8" y="5" width="3.2" height="15" rx="0.6"/></svg>`,
  shield: `<svg ${ICON_ATTR}><path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z"/></svg>`,
  zap: `<svg ${ICON_ATTR}><path d="M13 2 L5 13 H11 L10 22 L19 10 H13 Z"/></svg>`,
  filetext: `<svg ${ICON_ATTR}><path d="M7 2.5 H14 L18 6.5 V21.5 H7 Z"/><path d="M14 2.5 V6.5 H18"/><line x1="9.5" y1="11" x2="15.5" y2="11"/><line x1="9.5" y1="14.5" x2="15.5" y2="14.5"/><line x1="9.5" y1="18" x2="13" y2="18"/></svg>`,
  book: `<svg ${ICON_ATTR}><path d="M12 6 C10 4.5 6.5 4 3.5 4.5 V18 C6.5 17.5 10 18 12 19.5 C14 18 17.5 17.5 20.5 18 V4.5 C17.5 4 14 4.5 12 6 Z"/><line x1="12" y1="6" x2="12" y2="19.5"/></svg>`,
  droplet: `<svg ${ICON_ATTR}><path d="M12 2.5 C12 2.5 5.5 10.5 5.5 15 C5.5 18.6 8.4 21.5 12 21.5 C15.6 21.5 18.5 18.6 18.5 15 C18.5 10.5 12 2.5 12 2.5 Z"/></svg>`,
  gauge: `<svg ${ICON_ATTR}><path d="M4 16 A8 8 0 0 1 20 16"/><line x1="12" y1="16" x2="15.2" y2="10.8"/><circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg>`,
  clock: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="12" x2="12" y2="7"/><line x1="12" y1="12" x2="15.5" y2="14"/></svg>`,
  maximize: `<svg ${ICON_ATTR}><path d="M4 9 V4 H9"/><path d="M15 4 H20 V9"/><path d="M20 15 V20 H15"/><path d="M9 20 H4 V15"/></svg>`,
  plus: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  minus: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="8.5"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  layers: `<svg ${ICON_ATTR}><path d="M12 3 L21 8 L12 13 L3 8 Z"/><path d="M3 12.5 L12 17.5 L21 12.5"/><path d="M3 16.5 L12 21.5 L21 16.5"/></svg>`,
  refresh: `<svg ${ICON_ATTR}><path d="M20 12a8 8 0 1 1 -2.6 -5.9"/><polyline points="20 3 20 7.5 15.5 7.5"/></svg>`,
  download: `<svg ${ICON_ATTR}><path d="M12 3 V15"/><polyline points="7 10 12 15 17 10"/><path d="M4 19 H20"/></svg>`,
  printer: `<svg ${ICON_ATTR}><rect x="5" y="8" width="14" height="7" rx="1.4"/><path d="M7 8 V4 H17 V8"/><path d="M7 15 V20 H17 V15"/><line x1="9" y1="11" x2="12" y2="11"/></svg>`,
  plussquare: `<svg ${ICON_ATTR}><rect x="3.5" y="3.5" width="17" height="17" rx="2.4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  home: `<svg ${ICON_ATTR}><path d="M4 11.5 L12 4.5 L20 11.5"/><path d="M6 10 V20 H18 V10"/><rect x="10" y="14" width="4" height="6"/></svg>`,
  route: `<svg ${ICON_ATTR}><circle cx="6" cy="18" r="2.1"/><circle cx="18" cy="6" r="2.1"/><path d="M8 17 C13 15 11 9 16 7" stroke-dasharray="2.4 2.6"/></svg>`,
  bridge: `<svg ${ICON_ATTR}><path d="M3 15 C3 9 21 9 21 15"/><line x1="3" y1="15" x2="3" y2="19"/><line x1="21" y1="15" x2="21" y2="19"/><line x1="7" y1="12.3" x2="7" y2="19"/><line x1="17" y1="12.3" x2="17" y2="19"/><line x1="12" y1="9.3" x2="12" y2="19"/><line x1="2" y1="19" x2="22" y2="19"/></svg>`,
  cap: `<svg ${ICON_ATTR}><path d="M2 9 L12 5 L22 9 L12 13 Z"/><path d="M6 11 V16 C6 17.5 8.7 19 12 19 C15.3 19 18 17.5 18 16 V11"/><line x1="22" y1="9" x2="22" y2="15"/></svg>`,
  database: `<svg ${ICON_ATTR}><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6 V18 C4 19.7 7.6 21 12 21 C16.4 21 20 19.7 20 18 V6"/><path d="M4 12 C4 13.7 7.6 15 12 15 C16.4 15 20 13.7 20 12"/></svg>`,
  play: `<svg ${ICON_ATTR}><path d="M7 4.5 L19 12 L7 19.5 Z" fill="currentColor" stroke="none"/></svg>`,
  upload: `<svg ${ICON_ATTR}><path d="M12 15 V3"/><polyline points="7 8 12 3 17 8"/><path d="M4 15 V19 H20 V15"/></svg>`,
  chevronright: `<svg ${ICON_ATTR}><polyline points="9 5 16 12 9 19"/></svg>`,
  chevrondown: `<svg ${ICON_ATTR}><polyline points="5 9 12 16 19 9"/></svg>`,
  alerttriangle: `<svg ${ICON_ATTR}><path d="M12 3.5 L22 20.5 H2 Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none"/></svg>`,
  checkcircle: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="8.5"/><polyline points="7.5 12.5 10.5 15.5 16.5 8.5"/></svg>`,
  info: `<svg ${ICON_ATTR}><circle cx="12" cy="12" r="8.5"/><line x1="12" y1="11" x2="12" y2="16.5"/><circle cx="12" cy="7.6" r="1" fill="currentColor" stroke="none"/></svg>`,
  building: `<svg ${ICON_ATTR}><rect x="5" y="3.5" width="14" height="17" rx="1"/><rect x="7.3" y="6.5" width="2.2" height="2.2"/><rect x="14.5" y="6.5" width="2.2" height="2.2"/><rect x="7.3" y="11" width="2.2" height="2.2"/><rect x="14.5" y="11" width="2.2" height="2.2"/><rect x="9.9" y="15.5" width="4.2" height="5"/></svg>`,
  pulse: `<svg ${ICON_ATTR}><polyline points="2 12 7 12 9.5 5 14.5 19 17 12 22 12"/></svg>`,
  mountain: `<svg ${ICON_ATTR}><path d="M3 19 L9 8 L13 14 L16 9.5 L21 19 Z"/></svg>`,
  waves: `<svg ${ICON_ATTR}><path d="M2 8 C4.5 6 6.5 6 9 8 C11.5 10 13.5 10 16 8 C18.5 6 20.5 6 22 8"/><path d="M2 13.5 C4.5 11.5 6.5 11.5 9 13.5 C11.5 15.5 13.5 15.5 16 13.5 C18.5 11.5 20.5 11.5 22 13.5"/><path d="M2 19 C4.5 17 6.5 17 9 19 C11.5 21 13.5 21 16 19 C18.5 17 20.5 17 22 19"/></svg>`
};

function applyIcons(root){
  var scope = root || document;
  scope.querySelectorAll('[data-icon]').forEach(function(el){
    var name = el.getAttribute('data-icon');
    if (ICONS[name]) el.innerHTML = ICONS[name];
  });
}

/* ---------------------------------------------------------------------- */
/* Small helpers                                                          */
/* ---------------------------------------------------------------------- */
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function fmt1(n){ return (Math.round(n * 10) / 10).toFixed(1); }
function fmtInt(n){ return Math.round(n).toLocaleString('en-IN'); }
function fmtMin(mins){
  mins = Math.round(mins);
  if (mins < 60) return mins + ' min';
  var h = Math.floor(mins / 60), m = mins % 60;
  return h + 'h ' + (m ? m + 'm' : '');
}
function randId(prefix){
  return prefix + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
function nowFriendly(){
  var d = new Date();
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

/* ---------------------------------------------------------------------- */
/* Scenario defaults & simulation mode presets (DEMO / ILLUSTRATIVE)      */
/* ---------------------------------------------------------------------- */
var SCENARIO_DEFAULTS = {
  damHeight: 42,        // m
  breachWidth: 120,      // m
  breachTime: 15,        // min
  waterLevel: 38,        // m
  duration: 6,           // hr
  dem: 'Bhagirathi_Basin_DEM_30m.tif (Demo)',
  river: 'Bhagirathi_River_Centerline (Demo)',
  mode: 'balanced'        // rapid | balanced | high
};

var MODE_PRESETS = {
  rapid: {
    label: 'Rapid',
    cells: 42000,
    runtimeSec: 7,
    coverage: 12,
    gridLabel: '85 m → 30 m adaptive',
    solver: 'Fast Diffusive-Wave Solver',
    desc: 'Fastest turnaround. Full-physics solving is limited to the immediate breach zone. Best for early screening of many scenarios.'
  },
  balanced: {
    label: 'Balanced',
    cells: 168000,
    runtimeSec: 16,
    coverage: 38,
    gridLabel: '60 m → 12 m adaptive',
    solver: 'Fast Solver + Full 2D SWE (hybrid)',
    desc: 'Recommended default. Full 2D shallow water equations run across breach, channel, steep terrain and populated zones.'
  },
  high: {
    label: 'High Accuracy',
    cells: 512000,
    runtimeSec: 30,
    coverage: 72,
    gridLabel: '40 m → 5 m adaptive',
    solver: 'Full 2D SWE (extended domain)',
    desc: 'Most of the domain is escalated to the full 2D SWE solver with fine adaptive refinement. Slower, for final assessment runs.'
  }
};

var CONVENTIONAL_REF = {
  label: 'Conventional (uniform full 2D SWE)',
  cells: 640000,
  runtimeSec: 96,
  coverage: 100
};

/* ---------------------------------------------------------------------- */
/* Adaptive engine pipeline stages                                        */
/* ---------------------------------------------------------------------- */
var PIPELINE_STAGES = [
  { title: 'Input Data', desc: 'Dam geometry, breach parameters and reservoir level from Scenario Builder.', weight: 0.05 },
  { title: 'Terrain Processing', desc: 'DEM and river network conditioned, filled and projected for modelling.', weight: 0.12 },
  { title: 'Adaptive Grid', desc: 'Mesh generated with finer resolution in high-gradient, high-consequence zones.', weight: 0.15 },
  { title: 'Fast Solver', desc: 'A lightweight solver covers the full domain for rapid initial coverage.', weight: 0.28 },
  { title: 'Accuracy / Physics Check', desc: 'Fast-solver output checked against plausibility thresholds to flag escalation zones.', weight: 0.10 },
  { title: 'Full 2D Shallow Water Equation Solver', desc: 'Flagged zones — breach, channel, steep terrain, populated areas — re-solved at full fidelity.', weight: 0.25 },
  { title: 'Flood Results', desc: 'Depth, velocity and arrival-time fields merged into the final flood map and statistics.', weight: 0.05 }
];

/* ---------------------------------------------------------------------- */
/* Critical asset register (DEMO)                                        */
/* ---------------------------------------------------------------------- */
var ASSETS = [
  { id: 'a1', name: 'NH-94 Bridge',                type: 'Bridge',       icon: 'bridge',    distanceKm: 0.2, exposure: 1.00 },
  { id: 'a2', name: 'Riverside Colony',            type: 'Residential',  icon: 'home',      distanceKm: 0.4, exposure: 0.95 },
  { id: 'a3', name: 'Hydro Colony Substation',      type: 'Infrastructure', icon: 'building', distanceKm: 0.5, exposure: 0.85 },
  { id: 'a4', name: 'Old Town Market Road',         type: 'Road',         icon: 'route',     distanceKm: 0.6, exposure: 0.80 },
  { id: 'a5', name: 'Govt. Senior Secondary School', type: 'School',      icon: 'cap',       distanceKm: 0.8, exposure: 0.68 },
  { id: 'a6', name: 'District Hospital',            type: 'Hospital',     icon: 'plussquare', distanceKm: 1.1, exposure: 0.55 },
  { id: 'a7', name: 'Sector B Residential Block',   type: 'Residential',  icon: 'home',      distanceKm: 1.6, exposure: 0.40 },
  { id: 'a8', name: 'Downstream Farming Settlement', type: 'Residential', icon: 'home',      distanceKm: 2.4, exposure: 0.28 },
  { id: 'a9', name: 'Confluence Check Post',        type: 'Infrastructure', icon: 'building', distanceKm: 3.1, exposure: 0.18 }
];

/* ---------------------------------------------------------------------- */
/* Global app state                                                       */
/* ---------------------------------------------------------------------- */
var HG = {
  scenario: Object.assign({}, SCENARIO_DEFAULTS),
  sim: {
    status: 'idle',      // idle | running | complete
    progress: 0,
    stageIndex: -1,
    timer: null
  },
  results: null,          // populated on run completion
  runHistory: [],          // most recent first
  benchMode: 'balanced',
  map: {
    zoom: 1,
    layers: { depth:true, velocity:false, arrival:false, roads:true, buildings:true, assets:true, risk:false }
  }
};

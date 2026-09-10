const pages=['dashboard','scenario','simulation','risk','benchmark','report'];
let mode='Rapid', simTimer=null;

function go(page){
  pages.forEach(p=>document.getElementById(p).classList.toggle('active',p===page));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
  const titles={dashboard:'Mission Control',scenario:'Scenario Builder',simulation:'Live Simulation',risk:'Risk Analysis',benchmark:'Performance & Accuracy',report:'Simulation Report'};
  document.getElementById('pageTitle').textContent=titles[page];
  window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav').forEach(n=>n.addEventListener('click',()=>go(n.dataset.page)));

function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200);
}
function selectMode(el,m){
  document.querySelectorAll('.mode').forEach(x=>x.classList.remove('selected'));
  el.classList.add('selected'); mode=m;
  document.getElementById('reportMode').textContent=m;
}
function createScenario(){
  const name=document.getElementById('damName').value||'Untitled Scenario';
  document.getElementById('statScenario').textContent=name;
  document.getElementById('reportScenario').textContent=name;
  document.getElementById('reportMode').textContent=mode;
  document.getElementById('simStatus').textContent='Scenario loaded • grid ready';
  showToast('Scenario saved — adaptive grid preview ready');
  go('simulation');
}
function startSimulation(){
  if(simTimer) return;
  let p=0;
  const bar=document.getElementById('progress');
  simTimer=setInterval(()=>{
    p+=2;
    bar.style.width=Math.min(p,100)+'%';
    const cells=Math.round(p*1420), refined=Math.round(p*4.7);
    document.getElementById('cells').textContent=cells.toLocaleString();
    document.getElementById('refined').textContent=refined.toLocaleString();
    document.getElementById('maxDepth').textContent=(p*.078).toFixed(1)+' m';
    document.getElementById('velocity').textContent=(p*.056).toFixed(1)+' m/s';
    document.getElementById('solver').textContent=p<45?'Fast solver':p<75?'Full SWE solver':'Adaptive validation';
    document.getElementById('solverWhy').textContent=p<45?'Low-complexity region':p<75?'Rapid-flow / critical region':'Accuracy guard active';
    document.getElementById('simStatus').textContent=p<100?'Simulation running…':'Simulation complete • validation passed';
    document.getElementById('time').value=Math.min(p,60);
    updateTime(Math.min(p,60));
    if(p>=100){clearInterval(simTimer);simTimer=null;showToast('Simulation complete — outputs ready');}
  },90);
}
function playSim(){
  if(simTimer) return;
  let t=Number(document.getElementById('time').value);
  simTimer=setInterval(()=>{
    t++; document.getElementById('time').value=t; updateTime(t);
    if(t>=60){clearInterval(simTimer);simTimer=null;}
  },100);
}
function updateTime(v){
  const sec=Math.round(v*60);
  document.getElementById('timeLabel').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
}
function toggleLayer(layer){showToast(layer==='depth'?'Flood-depth layer selected':'Velocity layer selected')}

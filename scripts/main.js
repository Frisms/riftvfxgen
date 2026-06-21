let lastJson = '';
//can someone hug me, what is this regex bro
function hexToRgb(h){const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);return r?{r:parseInt(r[1],16)/255,g:parseInt(r[2],16)/255,b:parseInt(r[3],16)/255}:{r:1,g:1,b:1}}

function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}

function r3(v){return Math.round(v*1000)/1000}

function colorField(def={r:1,g:1,b:1,a:1}, hideAlpha=false){

  const wrap=document.createElement('div');wrap.className='color-group';
  const pick=document.createElement('input');pick.type='color';pick.value=rgbToHex(def.r,def.g,def.b);
  const aLbl=document.createElement('span');aLbl.className='alpha-label';aLbl.textContent='α';
  const aSlider=document.createElement('input');aSlider.type='range';aSlider.min=0;aSlider.max=1;aSlider.step=0.01;aSlider.value=def.a!=null?def.a:1;
  const aVal=document.createElement('span');aVal.className='alpha-val';aVal.textContent=parseFloat(aSlider.value).toFixed(2);
  aSlider.oninput=()=>{aVal.textContent=parseFloat(aSlider.value).toFixed(2);generate()};
  pick.oninput=generate;
  wrap.append(pick,aLbl,aSlider,aVal);
  wrap.getColor=()=>{const c=hexToRgb(pick.value);return{r:r3(c.r),g:r3(c.g),b:r3(c.b),a:+parseFloat(aSlider.value).toFixed(2)}};
  return wrap;
}

//ive always wanted this sob, behold gradient
function gradientEditor(containerId, initialStops=[]){
  
  const container = document.getElementById(containerId);

  const previewWrap = document.createElement('div'); previewWrap.className='grad-preview';

  const previewInner = document.createElement('div'); previewInner.className='grad-preview-inner';
  previewWrap.appendChild(previewInner);
  container.appendChild(previewWrap);

  const track = document.createElement('div'); track.className='t-track';
  
  const trackWrap = document.createElement('div'); trackWrap.className='t-track-wrap';
  trackWrap.appendChild(track);
  container.appendChild(trackWrap);

  const stops = [];

  function updatePreview(){
    const s = stops.map(e=>e.getColor()).sort((a,b)=>a.t-b.t);
    if(!s.length){ previewInner.style.background='transparent'; return; }
    if(s.length===1){
      const c=s[0]; previewInner.style.background=`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${c.a})`; return;
    }
    const parts=s.map(c=>`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${c.a}) ${(c.t*100).toFixed(1)}%`);
    previewInner.style.background=`linear-gradient(to right, ${parts.join(', ')})`;
  }
  
  function rebuildTrack(){
  track.querySelectorAll('.t-marker').forEach(m=>m.remove());
  trackWrap.style.display = stops.length === 0 ? 'none' : '';
  stops.forEach(entry=>{
      
      const c = entry.getColor();
      const marker = document.createElement('div'); marker.className='t-marker';
      marker.style.left = (c.t*100)+'%';
      marker.style.borderBottomColor = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},1)`;

      const lbl = document.createElement('div'); lbl.className='t-marker-label';
      lbl.textContent = c.t.toFixed(2);

      marker.appendChild(lbl);

      marker.addEventListener('mousedown', e=>{
        e.preventDefault();

        const onMove = ev=>{
          const rect = track.getBoundingClientRect();
          let t = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
          t = Math.round(t*100)/100;
          entry.setT(t);
          marker.style.left = (t*100)+'%';
          marker.style.borderBottomColor = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},1)`;
          lbl.textContent = t.toFixed(2);
          updatePreview(); generate();
        };
        
        const onUp = ()=>{ document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });

      entry._marker = marker;
      track.appendChild(marker);
    });
  }

  function addStop(def={}){
  const r = def.r ?? 1;
  const g = def.g ?? 1;
  const b = def.b ?? 1;
  const a = def.a ?? 1;
  const t = def.t ?? 0;

  const row = document.createElement('div'); row.className='grad-stop';
  const cf = colorField({r,g,b,a}); cf.style.cssText='flex:1;margin:0;border:none;padding:0;background:transparent';

  const tLbl = document.createElement('span'); tLbl.className='t-label'; tLbl.textContent='t';
  const tIn = document.createElement('input'); tIn.type='number'; tIn.min=0; tIn.max=1; tIn.step=0.05;
  tIn.value = t; tIn.style.width='50px'; tIn.className='t-input';

  const rem = document.createElement('button'); rem.className='rem-btn'; rem.textContent='Remove';
  rem.onclick=()=>{ stops.splice(stops.indexOf(entry),1); row.remove(); rebuildTrack(); updatePreview(); generate(); };

  tIn.oninput=()=>{ 
  const val = parseFloat(tIn.value);
  if(!isNaN(val)) entry._t = +Math.max(0, Math.min(1, val)).toFixed(3);
  rebuildTrack(); updatePreview(); generate(); 
};

  cf.querySelectorAll('input').forEach(inp=>{
    const prev=inp.oninput;
    inp.oninput=()=>{ if(prev)prev.call(inp); rebuildTrack(); updatePreview(); };
  });

  row.append(cf, tLbl, tIn, rem);
  container.insertBefore(row, btn);

  const entry = {
    row,
    _t: +parseFloat(t).toFixed(3),
    _tIn: tIn,
    setT(v){ this._t=v; tIn.value=v.toFixed(2); },
    getColor(){ const c=cf.getColor(); return {...c, t: this._t}; }
  };
  stops.push(entry);
}

  const btn = document.createElement('button'); btn.className='add-btn'; btn.textContent='add colorstop';
  btn.onclick=()=>{ addStop(); rebuildTrack(); updatePreview(); generate(); };

  const btnIcon = document.createElement('img');
  btnIcon.src = 'styles/images/cadence.webp'; //artistcadence my beloved
  btnIcon.style.cssText = 'width:30px; height:30px; object-fit:contain; vertical-align:middle; margin-right:6px;';
  btn.prepend(btnIcon);

container.appendChild(btn);

  initialStops.forEach(s=>addStop(s));
  rebuildTrack();
  updatePreview();
  //sorts out the t values so it doesnt end up with a 2nd t value that is lower than the 1st
  return {
    getStops: ()=>stops.map(s=>s.getColor()).sort((a,b)=>a.t-b.t),
    isEmpty: ()=>stops.length===0,
    updatePreview
  };  
}

function simpleColorEditor(containerId, def=null, hideAlpha=false){
  let _empty = def===null;
  let _ready = false;
  const container=document.getElementById(containerId);
  const previewWrap=document.createElement('div'); previewWrap.className='color-preview';
  const previewInner=document.createElement('div'); previewInner.className='color-preview-inner';
  previewWrap.appendChild(previewInner); container.appendChild(previewWrap);
  function updatePreview(c){ previewInner.style.background=`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${c.a})`; }
  const actualDef = def || {r:0,g:0,b:0,a:0};
  const cf=colorField(actualDef, hideAlpha);
  cf.querySelectorAll('input').forEach(inp=>{
    const prev=inp.oninput;
    inp.oninput=()=>{ if(prev)prev.call(inp); if(_ready) _empty=false; updatePreview(cf.getColor()); };
  });
  container.appendChild(cf); updatePreview(actualDef);
  _ready = true;
  return{ getColor: cf.getColor, isEmpty: ()=>_empty };
}
//RAAAH HAVING THIS START AT NO VALUES WAS HARDER THAN IT NEEDED TO
//initial config for  the editor
let bg2       = simpleColorEditor('bg2wrap',  null);
let bg1       = simpleColorEditor('bg1wrap',  null);
let rift      = simpleColorEditor('riftWrap', null, true);
let core1     = gradientEditor('core1wrap',     []);
let core2     = gradientEditor('core2wrap',     []);
let coreLife  = gradientEditor('coreLifeWrap',  []);
let speedStart= gradientEditor('speedStartWrap',[]);
let speedLife = gradientEditor('speedLifeWrap', []);
let pc1       = gradientEditor('pc1wrap',       []);
let pc2       = gradientEditor('pc2wrap',       []);
let pcLife    = gradientEditor('pcLifeWrap',    []);

document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',generate));
//wip highlight at json output
function syntaxHighlight(json){
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,match=>{
    let cls='num';
    if(/^"/.test(match)){cls=/:$/.test(match)?'key':'str';}
    return`<span class="${cls}">${match}</span>`;
  });
}

//import json hell yea
function openImport(){ document.getElementById('importOverlay').classList.add('open'); document.getElementById('importError').style.display='none'; document.getElementById('importTextarea').value=''; }
function closeImport(){ document.getElementById('importOverlay').classList.remove('open'); }
function closeImportIfOutside(e){ if(e.target===document.getElementById('importOverlay')) closeImport(); }
function loadFile(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=ev=>{ document.getElementById('importTextarea').value=ev.target.result; };
  reader.readAsText(file); e.target.value='';
}

function reloadSimple(id,data){ document.getElementById(id).innerHTML=''; return simpleColorEditor(id,data); }
function reloadGradient(id,data){ document.getElementById(id).innerHTML=''; return gradientEditor(id,Array.isArray(data)?data:[{r:1,g:1,b:1,a:1,t:0}]); }

function doImport(){
  const raw=document.getElementById('importTextarea').value.trim();
  const errEl=document.getElementById('importError'); errEl.style.display='none';
  let obj;
  try{ obj=JSON.parse(raw); }
  catch(e){ errEl.textContent='Invalid JSON: '+e.message; errEl.style.display='block'; return; }

//how the import knows what values to copy
  if(obj.CharacterId){const sel=document.getElementById('charId');sel.value=obj.CharacterId;if(!sel.value)sel.value='';}
  if(obj.BackgroundColor2) bg2 = reloadSimple('bg2wrap',obj.BackgroundColor2);
  if(obj.BackgroundColor1) bg1 = reloadSimple('bg1wrap',obj.BackgroundColor1);
  if(obj.BackgroundAdditiveIntensity!=null) document.getElementById('bgAdd').value=obj.BackgroundAdditiveIntensity;
  if(obj.BackgroundGradientIntensity!=null) document.getElementById('bgGrad').value=obj.BackgroundGradientIntensity;
  if(obj.RiftGlowColor) rift = reloadSimple('riftWrap',obj.RiftGlowColor);
  if(obj.CoreStartColor1) core1 = reloadGradient('core1wrap',obj.CoreStartColor1);
  if(obj.CoreStartColor2) core2 = reloadGradient('core2wrap',obj.CoreStartColor2);
  if(obj.CoreColorOverLifetime) coreLife   = reloadGradient('coreLifeWrap',obj.CoreColorOverLifetime);
  if(obj.SpeedlinesStartColor) speedStart = reloadGradient('speedStartWrap',obj.SpeedlinesStartColor);
  if(obj.SpeedlinesColorOverLifetime) speedLife  = reloadGradient('speedLifeWrap',obj.SpeedlinesColorOverLifetime);
  if(obj.CustomParticleImagePath) document.getElementById('particlePath').value=obj.CustomParticleImagePath;
  if(obj.CustomParticleSheetWidth) document.getElementById('particleW').value=obj.CustomParticleSheetWidth;
  if(obj.CustomParticleSheetHeight) document.getElementById('particleH').value=obj.CustomParticleSheetHeight;
  if(obj.CustomParticleColor1) pc1 = reloadGradient('pc1wrap',obj.CustomParticleColor1);
  if(obj.CustomParticleColor2) pc2 = reloadGradient('pc2wrap',obj.CustomParticleColor2);
  if(obj.CustomParticleColorOverLifetime) pcLife = reloadGradient('pcLifeWrap',obj.CustomParticleColorOverLifetime);

  closeImport(); generate();
}

//remove everything from a section 
function resetSection(id){
  const wrapIds = { bg2:'bg2wrap', bg1:'bg1wrap', rift:'riftWrap', core1:'core1wrap', core2:'core2wrap', coreLife:'coreLifeWrap', speedStart:'speedStartWrap', speedLife:'speedLifeWrap', pc1:'pc1wrap', pc2:'pc2wrap', pcLife:'pcLifeWrap' };
  const el = document.getElementById(wrapIds[id]);
  if(!el) return;
  el.innerHTML='';
  const simples = { bg2: false, bg1: false, rift: true };
  if(id in simples){
    const editor = simpleColorEditor(wrapIds[id], null, simples[id]);
    if(id==='bg2') bg2=editor; else if(id==='bg1') bg1=editor; else if(id==='rift') rift=editor;
  } else {
    const editor = gradientEditor(wrapIds[id], []);
    if(id==='core1') core1=editor; else if(id==='core2') core2=editor;
    else if(id==='coreLife') coreLife=editor; else if(id==='speedStart') speedStart=editor;
    else if(id==='speedLife') speedLife=editor; else if(id==='pc1') pc1=editor;
    else if(id==='pc2') pc2=editor; else if(id==='pcLife') pcLife=editor;
  }
  generate();
}

//output generation
function generate(){
  const obj={};
  const charId=document.getElementById('charId').value;
  if(charId) obj.CharacterId=charId;

  if(!bg2.isEmpty()) obj.BackgroundColor2 = bg2.getColor();
  if(!bg1.isEmpty()) obj.BackgroundColor1 = bg1.getColor();
  if(!rift.isEmpty()) obj.RiftGlowColor = rift.getColor();
  
  const bgAdd=document.getElementById('bgAdd').value; if(bgAdd!=='') obj.BackgroundAdditiveIntensity=parseFloat(bgAdd);
  const bgG=document.getElementById('bgGrad').value;  if(bgG!=='')   obj.BackgroundGradientIntensity=parseFloat(bgG);
  
  if(!core1.isEmpty()) obj.CoreStartColor1=core1.getStops();
  if(!core2.isEmpty()) obj.CoreStartColor2=core2.getStops();
  if(!coreLife.isEmpty()) obj.CoreColorOverLifetime=coreLife.getStops();
  if(!speedStart.isEmpty()) obj.SpeedlinesStartColor=speedStart.getStops();
  if(!speedLife.isEmpty()) obj.SpeedlinesColorOverLifetime=speedLife.getStops();
  
  const pp=document.getElementById('particlePath').value; if(pp) obj.CustomParticleImagePath=pp;
  const pw=document.getElementById('particleW').value;    if(pw) obj.CustomParticleSheetWidth=parseInt(pw);
  const ph=document.getElementById('particleH').value;    if(ph) obj.CustomParticleSheetHeight=parseInt(ph);
  
  if(!pc1.isEmpty()) obj.CustomParticleColor1=pc1.getStops();
  if(!pc2.isEmpty()) obj.CustomParticleColor2=pc2.getStops();
  if(!pcLife.isEmpty()) obj.CustomParticleColorOverLifetime=pcLife.getStops();

  lastJson = JSON.stringify(obj, null, 2);
  document.getElementById('out').innerHTML = syntaxHighlight(lastJson);
}

function copyJson(){
  navigator.clipboard.writeText(lastJson || '').then(()=>{
    const btn = document.getElementById('copyBtn');
    btn.textContent='Copied!'; btn.classList.add('copied');
    setTimeout(()=>{ btn.textContent='Copy'; btn.classList.remove('copied'); },800);
  });
}
generate();
//this entire thing was made with spite, claude helped me debug some nasty stuff cuz im stupid
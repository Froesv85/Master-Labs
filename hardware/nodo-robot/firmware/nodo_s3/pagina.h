// Página de controle do Nodo (servida pelo próprio ESP32-S3, funciona sem internet)
#pragma once
const char PAGE_HTML[] PROGMEM = R"HTML(<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#0f172a"><title>Nodo · controle</title>
<style>
:root{--bg:#0f172a;--card:#16223a;--line:#2b3b57;--txt:#f1f5f9;--mut:#94a3b8;--or:#FFA500;--te:#00C4B4;--red:#f87171}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none}
body{margin:0;background:var(--bg);color:var(--txt);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;min-height:100vh}
header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--line)}
h1{font-size:20px;margin:0}h1 b{color:var(--or)}
#st{font-size:13px;padding:4px 10px;border-radius:99px;background:#7f1d1d;color:#fecaca}
#st.on{background:#064e3b;color:#a7f3d0}
main{display:grid;gap:14px;padding:14px 16px;max-width:720px;margin:auto}
.tel{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.k{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.k small{display:block;color:var(--mut);font-size:12px}.k span{font-size:22px;font-weight:700}
#pad{position:relative;width:min(78vw,320px);aspect-ratio:1;margin:6px auto;border-radius:50%;
 background:radial-gradient(circle,#1d2d4a 0,#13203a 70%);border:2px solid var(--line);touch-action:none}
#pad:before,#pad:after{content:"";position:absolute;background:var(--line)}
#pad:before{left:50%;top:8%;bottom:8%;width:1px}#pad:after{top:50%;left:8%;right:8%;height:1px}
#knob{position:absolute;width:30%;aspect-ratio:1;left:35%;top:35%;border-radius:50%;background:var(--or);
 box-shadow:0 4px 16px #0008;z-index:2}
.row{display:flex;gap:10px;flex-wrap:wrap}
button{flex:1 1 30%;min-height:48px;border:1px solid var(--line);background:var(--card);color:var(--txt);
 border-radius:12px;font-size:15px;font-weight:600;cursor:pointer}
button:active{transform:scale(.97);background:#22324f}
button.sel{border-color:var(--te);color:var(--te)}
button.big{background:var(--or);color:#111;border:0}
button[disabled]{opacity:.45}
h2{font-size:14px;color:var(--mut);margin:6px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
label{display:flex;align-items:center;gap:12px;color:var(--mut);font-size:14px}
input[type=range]{flex:1;accent-color:var(--or);height:32px}
#warn{color:var(--red);font-size:13px;min-height:18px;text-align:center}
</style></head><body>
<header><h1>Nodo · <b>controle</b></h1><span id="st">desconectado</span></header>
<main>
 <div class="tel">
  <div class="k"><small>bateria</small><span id="bat">–</span></div>
  <div class="k"><small>obstáculo</small><span id="dist">–</span></div>
  <div class="k"><small>modo</small><span id="mode">–</span></div>
 </div>
 <div class="row">
  <button id="bMan" class="sel" onclick="setMode(0)">Manual</button>
  <button id="bAuto" onclick="setMode(1)">Autônomo</button>
 </div>
 <div id="pad"><div id="knob"></div></div>
 <div id="warn"></div>
 <label>Velocidade <input id="spd" type="range" min="20" max="100" value="60"><b id="spdv">60%</b></label>
 <h2>Gestos</h2>
 <div class="row">
  <button class="big" onclick="send('W')">Acenar</button>
  <button onclick="send('C')">Comemorar</button>
  <button onclick="send('X')">Parar tudo</button>
 </div>
 <h2>Rosto</h2>
 <div class="row">
  <button onclick="send('F,0')">Feliz</button><button onclick="send('F,1')">Ideia</button>
  <button onclick="send('F,2')">Festa</button><button onclick="send('F,3')">Atento</button>
  <button onclick="send('F,4')">Dormindo</button><button onclick="send('F,5')">Falando</button>
 </div>
 <h2>Falas e conversa</h2>
 <div class="row">
  <button disabled>Olá!</button><button disabled>Sobre a MakerConnect</button>
  <button disabled>Segurar p/ falar</button>
 </div>
 <small style="color:var(--mut);text-align:center">Falas chegam na etapa 2 (alto-falante) · conversa na etapa 4 (servidor no notebook)</small>
</main>
<script>
let ws, jx=0, jy=0, manual=true, last=0;
const $=id=>document.getElementById(id);
function connect(){
  ws=new WebSocket('ws://'+location.hostname+':81/');
  ws.onopen=()=>{$('st').textContent='conectado';$('st').className='on';send('V,'+$('spd').value)};
  ws.onclose=()=>{$('st').textContent='desconectado';$('st').className='';setTimeout(connect,1000)};
  ws.onmessage=e=>{try{const t=JSON.parse(e.data);
    $('bat').textContent=t.v>3?t.v.toFixed(1)+' V':'USB';
    $('dist').textContent=t.d>=399?'livre':Math.round(t.d)+' cm';
    $('mode').textContent=t.m?'auto':'manual';
    manual=!t.m;$('bMan').className=manual?'sel':'';$('bAuto').className=manual?'':'sel';
    $('warn').textContent=t.b?'Caminho bloqueado à frente':'';
  }catch(_){}}
}
function send(s){if(ws&&ws.readyState===1)ws.send(s)}
function setMode(a){send('M,'+a)}
$('spd').oninput=e=>{$('spdv').textContent=e.target.value+'%';send('V,'+e.target.value)};
// joystick
const pad=$('pad'),knob=$('knob');let act=false;
function move(ev){
  const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2*0.7;
  let dx=ev.clientX-cx,dy=ev.clientY-cy;const m=Math.hypot(dx,dy);if(m>R){dx*=R/m;dy*=R/m}
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  jx=Math.round(dx/R*100);jy=Math.round(-dy/R*100);
}
pad.addEventListener('pointerdown',e=>{act=true;pad.setPointerCapture(e.pointerId);move(e)});
pad.addEventListener('pointermove',e=>{if(act)move(e)});
const end=()=>{act=false;jx=jy=0;knob.style.transform='';send('J,0,0')};
pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
// envia o joystick 10x/s no modo manual (o robô para sozinho se ficar 0,5 s sem receber)
setInterval(()=>{if(manual)send('J,'+jx+','+jy)},100);
document.addEventListener('visibilitychange',()=>{if(document.hidden)send('X')});
connect();
</script></body></html>)HTML";

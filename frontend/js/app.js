/* ========= Capa de datos =========
   Usa la API del backend (js/config.js -> window.TIB_API). Sin API guarda localmente. */
const B=window.TIB_API||'';
const F=async(u,o)=>{let r,d=null;try{r=await fetch(u,o)}catch{throw new Error('Sin conexión con el servidor')}try{d=await r.json()}catch{}if(!r.ok)throw new Error(d?.error||'Error del servidor ('+r.status+')');return d};
const DB={async list(t){if(B){const d=await F(B+'/'+t);return Array.isArray(d)?d:[]}try{return JSON.parse(localStorage.getItem('tib_'+t)||'[]')}catch{return[]}},
async put(t,row){if(B){const d=await F(B+'/'+t,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)});if(d?.warning)toast(d.warning,'err');return}
const a=await this.list(t),i=a.findIndex(x=>x.id===row.id);i<0?a.unshift(row):a[i]=row;try{localStorage.setItem('tib_'+t,JSON.stringify(a))}catch{throw new Error('Almacenamiento lleno')}},
async del(t,ids){if(B){await F(B+'/'+t+'?ids='+ids.join(','),{method:'DELETE'});return}localStorage.setItem('tib_'+t,JSON.stringify((await this.list(t)).filter(x=>!ids.includes(x.id))))}};

/* ========= Movimientos (ingresos / salidas / anulaciones) =========
   Con API: el backend + función SQL actualizan stock y registro en una sola operación.
   Sin API: se hace localmente. */
const MV={async move(it,type,qty,reason=''){if(B)return await F(B+'/movements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item_id:it.id,type,qty,reason})});
const a=await DB.list('inventory'),x=a.find(r=>r.id===it.id);if(!x)throw new Error('El artículo ya no existe');if(type=='out'&&x.qty<qty)throw new Error('Stock insuficiente: solo hay '+x.qty);
const before=x.qty;x.qty+=type=='in'?qty:-qty;const m={id:uid(),item_id:x.id,ref:x.ref,size:x.size||'',type,qty,stock_before:before,stock_after:x.qty,reason,voided:false,voided_at:null,created_at:new Date().toISOString()},l=await DB.list('movements');l.unshift(m);
try{localStorage.setItem('tib_inventory',JSON.stringify(a));localStorage.setItem('tib_movements',JSON.stringify(l))}catch{throw new Error('Almacenamiento lleno')}return m},
async void(id){if(B)return await F(B+'/movements/'+encodeURIComponent(id)+'/void',{method:'POST'});
const l=await DB.list('movements'),m=l.find(r=>r.id===id);if(!m)throw new Error('Movimiento no encontrado');if(m.voided)throw new Error('Este movimiento ya fue anulado');
const a=await DB.list('inventory'),x=a.find(r=>r.id===m.item_id);if(!x)throw new Error('El artículo de este movimiento ya no existe');
if(m.type=='in'){if(x.qty<m.qty)throw new Error('No se puede anular: ya salieron unidades de este ingreso');x.qty-=m.qty}else x.qty+=m.qty;
m.voided=true;m.voided_at=new Date().toISOString();localStorage.setItem('tib_inventory',JSON.stringify(a));localStorage.setItem('tib_movements',JSON.stringify(l));return m}};
/* ========= Iconos SVG ========= */
const P={g2:'<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>',g3:'<rect x="3" y="3" width="4.5" height="4.5" rx="1.2"/><rect x="9.75" y="3" width="4.5" height="4.5" rx="1.2"/><rect x="16.5" y="3" width="4.5" height="4.5" rx="1.2"/><rect x="3" y="9.75" width="4.5" height="4.5" rx="1.2"/><rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1.2"/><rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1.2"/><rect x="3" y="16.5" width="4.5" height="4.5" rx="1.2"/><rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1.2"/><rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1.2"/>',lst:'<rect x="3" y="3.5" width="5" height="5" rx="1.4"/><path d="M12 6h9"/><rect x="3" y="9.5" width="5" height="5" rx="1.4"/><path d="M12 12h9"/><rect x="3" y="15.5" width="5" height="5" rx="1.4"/><path d="M12 18h9"/>',chr:'<path d="M9 6l6 6-6 6"/>',chev:'<path d="M6 9l6 6 6-6"/>',cat:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',tag:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/>',trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',down:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',up:'<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',file:'<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M9 14h6M9 17h6"/>',x:'<path d="M18 6L6 18M6 6l12 12"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.8"/><path d="M21 16l-5-5-9 9"/>',cam:'<path d="M3 8a2 2 0 012-2h2l2-2h6l2 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.5"/>',aup:'<path d="M12 19V5M5 12l7-7 7 7"/>',adn:'<path d="M12 5v14M19 12l-7 7-7-7"/>',hist:'<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',alert:'<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24">${P[n]}</svg>`;
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={tab:'inv',inv:[],refs:[],cats:[],mov:[],movErr:'',mmode:false,msel:new Set(),mf:'all',q:{inv:'',refs:'',log:''},sort:{inv:'new',refs:'new'},fc:{inv:'',refs:''},fs:[],sel:new Set(),cur:null,load:true,vl:'big',vg:true,zd:'asc',gm:null};
try{const v=JSON.parse(localStorage.getItem('tib_view')||'{}');if(['big','small','list'].includes(v.vl))S.vl=v.vl;if(typeof v.vg=='boolean')S.vg=v.vg;if(['asc','desc'].includes(v.zd))S.zd=v.zd}catch{}
const saveV=()=>{try{localStorage.setItem('tib_view',JSON.stringify({vl:S.vl,vg:S.vg,zd:S.zd}))}catch{}};
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const thumb=(u,c='')=>u?`<img src="${esc(u)}" alt="" loading="lazy">`:ic('img');
/* ========= Categorías, orden y filtros ========= */
const byN=(a,b)=>a.name.localeCompare(b.name,'es'),SZ=['XXS','XS','S','M','L','XL','XXL','3XL','ÚNICA'],zi=z=>{const i=SZ.indexOf(z);return i<0?99:i};
const subsOf=n=>{const p=S.cats.find(c=>!c.parent&&c.name==n);return p?S.cats.filter(c=>c.parent==p.id).sort(byN):[]};
const chips=x=>`<div class="chips">${x.category?`<span class="chip c">${esc(x.category)}</span>`:''}${x.subcategory?`<span class="chip s">${esc(x.subcategory)}</span>`:''}${x.size?`<span class="chip z">${esc(x.size)}</span>`:''}</div>`;
const SORTS={new:'Más recientes',az:'Nombre A–Z',za:'Nombre Z–A',cat:'Categoría A–Z',hi:'Cantidad: mayor a menor',lo:'Cantidad: menor a mayor',sz:'Talla'};
const CMP={az:(a,b)=>a.ref.localeCompare(b.ref,'es',{numeric:true}),za:(a,b)=>b.ref.localeCompare(a.ref,'es',{numeric:true}),
cat:(a,b)=>(!a.category-!b.category)||(a.category||'').localeCompare(b.category||'','es')||(a.subcategory||'').localeCompare(b.subcategory||'','es')||a.ref.localeCompare(b.ref,'es'),
hi:(a,b)=>b.qty-a.qty,lo:(a,b)=>a.qty-b.qty,sz:(a,b)=>zi(a.size)-zi(b.size)||(a.size||'').localeCompare(b.size||'','es',{numeric:true})||a.ref.localeCompare(b.ref,'es')};
/* ========= Agrupación por referencia =========
   Cada fila del inventario es una talla (referencia + talla). Una "referencia" real es el conjunto de
   todas las filas con el mismo nombre (sin importar mayúsculas ni espacios de más). */
const gk=r=>String(r||'').trim().replace(/\s+/g,' ').toLowerCase();
const szCmp=(a,b)=>{const x=a.size||'',y=b.size||'';if(!x!=!y)return x?-1:1;return zi(x)-zi(y)||x.localeCompare(y,'es',{numeric:true})};
function groupOf(k){const all=S.inv.filter(x=>gk(x.ref)==k);if(!all.length)return null;const cnt={};all.forEach(x=>{const r=x.ref.trim();cnt[r]=(cnt[r]||0)+1});const name=Object.keys(cnt).sort((x,y)=>cnt[y]-cnt[x])[0],items=all.sort(szCmp),f=items[0],c=items.find(x=>x.category)||f;
return{key:k,ref:name,items,img:(items.find(x=>x.img)||{}).img||'',category:c.category||'',subcategory:c.subcategory||'',total:items.reduce((a,x)=>a+x.qty,0),out:items.filter(x=>!x.qty).length}}
function groupsOf(flat){const seen=new Set(),gs=[];flat.forEach(x=>{const k=gk(x.ref);if(!seen.has(k)){seen.add(k);gs.push(groupOf(k))}});if(S.sort.inv=='hi')gs.sort((a,b)=>b.total-a.total);else if(S.sort.inv=='lo')gs.sort((a,b)=>a.total-b.total);return gs}
const nRefs=()=>new Set(S.inv.map(x=>gk(x.ref))).size;
const szLabel=()=>!S.fs.length?'Todas las tallas':(S.fs.length==1?'Talla: ':'Tallas: ')+S.fs.join(' · ');
const szBtn=zs=>{DD.fsz=zs.slice(1);S.fs=S.fs.filter(z=>DD.fsz.some(o=>o.v==z));return`<button type="button" class="dd${S.fs.length?' on':''}" id="fsz" data-multi="1" aria-haspopup="listbox"><span>${esc(szLabel())}</span>${ic('chev')}</button>`};
function fbar(){const t=S.tab,inv=t=='inv',so=Object.entries(SORTS).filter(([k])=>inv||!['hi','lo','sz'].includes(k)).map(([k,v])=>({v:k,t:v})),fc=[{v:'',t:'Todas las categorías'}];
S.cats.filter(c=>!c.parent).sort(byN).forEach(c=>{fc.push({v:c.name,t:c.name});subsOf(c.name).forEach(x=>fc.push({v:c.name+'|'+x.name,t:x.name,l:1}))});
const zs=[{v:'',t:'Todas las tallas'},...[...new Set(S.inv.map(x=>x.size).filter(Boolean))].sort((a,b)=>zi(a)-zi(b)||a.localeCompare(b,'es',{numeric:true})).map(z=>({v:z,t:z}))];
return`<div class="bar fb">${dd('so',so,S.sort[t])}${dd('fcat',fc,S.fc[t])}${inv?szBtn(zs):''}<button class="btn" data-act="cats" data-tip="Gestionar categorías">${ic('cat')}<span class="l">Categorías</span></button></div>`}
/* ===== Listas desplegables liquid glass ===== */
const DD={};let MN=null;
function dd(id,opts,val){DD[id]=opts;const o=opts.find(x=>x.v==val)||opts[0];return`<button type="button" class="dd" id="${id}" value="${esc(o.v)}" aria-haspopup="listbox"><span>${esc(o.t)}</span>${ic('chev')}</button>`}
function ddSet(id,opts,val){DD[id]=opts;const b=$('#'+id),o=opts.find(x=>x.v==val)||opts[0];b.value=o.v;b.querySelector('span').textContent=o.t}
function closeMenu(f){if(!MN)return;const m=MN;MN=null;m.a.classList.remove('open');if(f)m.el.remove();else{m.el.classList.add('out');setTimeout(()=>m.el.remove(),160)}}
function menu(a,items,sel,pick,multi){const same=MN&&MN.a==a;closeMenu(true);if(!items.length)return;const el=document.createElement('div');el.className='ddm glass'+(multi?' multi':'')+(same?' still':'');el.setAttribute('role','listbox');if(multi)el.setAttribute('aria-multiselectable','true');
const isOn=x=>multi?sel.includes(x.v):x.v==sel;
el.innerHTML=(multi?`<div class="ddh"><span>${esc(multi.hint)}</span><button type="button" data-clear>Limpiar</button></div>`:'')+items.map((x,i)=>`<div class="ddi${isOn(x)?' sel':''}${multi&&!isOn(x)&&sel.length>=multi.max?' dis':''}${x.l?' sub':''}" role="option" aria-selected="${isOn(x)}" data-i="${i}">${x.img!==undefined?`<span class="dth">${x.img?`<img src="${esc(x.img)}" alt="">`:ic('img')}</span>`:''}<span class="ddt">${esc(x.t)}</span>${multi?`<span class="ddc">${ic('check')}</span>`:isOn(x)?ic('check'):''}</div>`).join('');
document.body.append(el);const place=()=>{const vv=window.visualViewport,vb=vv?vv.offsetTop+vv.height:innerHeight,r=a.getBoundingClientRect(),h=el.scrollHeight,w=Math.max(r.width,190),up=vb-r.bottom<Math.min(h,260)+12&&r.top>vb-r.bottom;
el.style.minWidth=w+'px';el.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+'px';el.style.top=up?'auto':(r.bottom+6)+'px';el.style.bottom=up?(innerHeight-r.top+6)+'px':'auto';el.style.maxHeight=Math.max(140,(up?r.top:vb-r.bottom)-20)+'px';el.classList.toggle('up',up);el.classList.toggle('dn',!up)};place();
el.onpointerdown=e=>e.preventDefault();el.onclick=e=>{const i=e.target.closest('.ddi');
if(multi){const c=e.target.closest('[data-clear]');if(!c&&!i)return;const r=c?multi.clear():multi.toggle(items[i.dataset.i]);el.querySelectorAll('.ddi').forEach((d,k)=>{const o=r.includes(items[k].v);d.classList.toggle('sel',o);d.classList.toggle('dis',!o&&r.length>=multi.max);d.setAttribute('aria-selected',o)});return}
if(!i)return;const x=items[i.dataset.i];closeMenu();pick(x)};
a.classList.add('open');MN={el,a,place};const sl=el.querySelector('.sel');sl?.scrollIntoView?.({block:"nearest"})}
document.addEventListener('pointerdown',e=>{if(MN&&!MN.el.contains(e.target)&&!MN.a.contains(e.target))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeMenu()});const keepOpen=()=>MN&&MN.a.tagName=='INPUT';addEventListener('resize',()=>keepOpen()?MN.place():closeMenu());window.visualViewport&&visualViewport.addEventListener('resize',()=>keepOpen()&&MN.place());addEventListener('scroll',e=>{if(MN&&!MN.el.contains(e.target))keepOpen()?MN.place():closeMenu()},true);
document.addEventListener('click',e=>{const b=e.target.closest('button.dd');if(!b)return;if(MN&&MN.a==b)return closeMenu();if(b.dataset.multi)return multiSz(b);menu(b,DD[b.id],b.value,x=>{b.value=x.v;b.querySelector('span').textContent=x.t;b.dispatchEvent(new Event('change'))})});
/* Filtro de tallas: se pueden marcar hasta 3 a la vez */
const szUpd=()=>{const b=$('#fsz');if(b){b.classList.toggle('on',S.fs.length>0);b.querySelector('span').textContent=szLabel()}list()};
function multiSz(b){const MAX=3,byZ=(x,y)=>szCmp({size:x},{size:y});menu(b,DD.fsz,S.fs,null,{max:MAX,hint:'Elige hasta '+MAX+' tallas',
toggle:x=>{const i=S.fs.indexOf(x.v);if(i>=0)S.fs.splice(i,1);else if(S.fs.length>=MAX){toast('Máximo '+MAX+' tallas a la vez','err');return S.fs}else{S.fs.push(x.v);S.fs.sort(byZ)}szUpd();return S.fs},
clear:()=>{S.fs=[];szUpd();return S.fs}})}
function catModal(){modal(`<h2>Categorías<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2><p class="sub" style="margin:-6px 0 12px">Categorías en lila, subcategorías en rosa.</p><div class="addr"><input class="in" id="nc" maxlength="40" placeholder="Nueva categoría" autocomplete="off"><button class="btn p" id="ac" aria-label="Crear categoría">${ic('plus')}</button></div><div id="cl"></div>`,m=>{
const clean=v=>v.replace(/\|/g,'').trim(),
draw=()=>{const cs=S.cats.filter(c=>!c.parent).sort(byN);$('#cl').innerHTML=cs.length?cs.map(c=>`<div class="cr"><div class="row" style="margin:0"><span class="chip c">${esc(c.name)}</span><button class="ib" data-d="${c.id}" data-tip="Eliminar" aria-label="Eliminar">${ic('trash')}</button></div><div class="chips">${S.cats.filter(s=>s.parent==c.id).sort(byN).map(s=>`<span class="chip s">${esc(s.name)}<button data-d="${s.id}" aria-label="Quitar">${ic('x')}</button></span>`).join('')}</div><div class="addr"><input class="in" data-sub="${c.id}" maxlength="40" placeholder="Añadir subcategoría" autocomplete="off"><button class="ib" data-as="${c.id}" aria-label="Añadir">${ic('plus')}</button></div></div>`).join(''):`<div class="empty">${ic('cat')}<div>Aún no hay categorías</div></div>`},
add=async(name,parent)=>{name=clean(name);if(!name)return;if(S.cats.some(c=>(c.parent||'')==parent&&c.name.toLowerCase()==name.toLowerCase()))return toast('Ya existe','err');
try{await DB.put('categories',{id:uid(),name,parent});S.cats=await DB.list('categories');draw();render();toast(parent?'Subcategoría creada':'Categoría creada')}catch(x){toast(x.message,'err')}};
$('#ac').onclick=async()=>{await add($('#nc').value,'');$('#nc').value=''};
m.onkeydown=e=>{if(e.key!='Enter')return;const s=e.target.dataset.sub;(s?m.querySelector(`[data-as="${s}"]`):$('#ac')).click()};
m.onclick=async e=>{const d=e.target.closest('[data-d]'),a=e.target.closest('[data-as]');
if(d){await DB.del('categories',[d.dataset.d,...S.cats.filter(c=>c.parent==d.dataset.d).map(c=>c.id)]);S.cats=await DB.list('categories');S.fc={inv:'',refs:''};draw();render();toast('Eliminada')}
if(a)await add(m.querySelector(`[data-sub="${a.dataset.as}"]`).value,a.dataset.as)};
draw()})}
/* ========= Toasts ========= */
function toast(m,k='ok'){const t=document.createElement('div');t.className='toast glass '+k;t.innerHTML=ic(k=='err'?'alert':'check')+esc(m);$('#toasts').append(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300)},2600)}
/* ========= Modales ========= */
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim(),SP=()=>css('--sp')||'cubic-bezier(.32,.72,0,1)',SPD=()=>(parseFloat(css('--spd'))||.45)*1000,RM=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
/* Rubber-band: resistencia progresiva más allá del borde */
const rubber=(x,d,c=.55)=>(x*d*c)/(d+c*Math.abs(x));
function modal(html,onMount){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="mod glass" role="dialog" aria-modal="true">${html}</div>`;document.body.append(o);const m=o.firstChild,rm=RM(),sheet=()=>innerWidth<=760;
const dur=rm?160:SPD(),ease=rm?'ease-out':SP(),from=rm?'none':sheet()?'translateY(100%)':'translateY(16px) scale(.94)';
/* El material "aparece": desenfoque del fondo + escala/posición a la vez */
o.animate({opacity:[0,1],backdropFilter:['blur(0px)','blur(14px)'],webkitBackdropFilter:['blur(0px)','blur(14px)']},{duration:Math.min(dur,320),easing:'ease-out',fill:'backwards'});
m.animate({opacity:[0,1],transform:[from,'none']},{duration:dur,easing:ease,fill:'backwards'});
const close=(vy=0)=>{if(o._c)return;o._c=1;document.removeEventListener('keydown',esc_);const cur=getComputedStyle(m).transform,to=rm?'none':sheet()?'translateY(100%)':'translateY(10px) scale(.96)',d=rm?140:sheet()?Math.max(200,Math.min(340,SPD()*.7)):220;
m.animate({opacity:[1,0],transform:[cur==='none'?'none':cur,to]},{duration:d,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});o.animate({opacity:[1,0]},{duration:d,easing:'ease-in',fill:'forwards'}).onfinish=()=>o.remove()};
const esc_=e=>e.key=='Escape'&&close();document.addEventListener('keydown',esc_);
o.addEventListener('pointerdown',e=>{if(e.target===o)close()});m.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>close());
/* Hoja inferior (móvil): arrastre 1:1 desde el asa, proyección de inercia y regreso con resorte */
const grab=y=>sheet()&&y-m.getBoundingClientRect().top<38;
m.addEventListener('touchstart',e=>{if(grab(e.touches[0].clientY))e.preventDefault()},{passive:false});
m.addEventListener('pointerdown',e=>{if(o._c||!grab(e.clientY))return;m.setPointerCapture(e.pointerId);const y0=e.clientY,H=m.offsetHeight;let h=[{y:y0,t:performance.now()}],dy=0;
const mv=ev=>{dy=ev.clientY-y0;m.style.transform=`translateY(${dy>=0?dy:-rubber(-dy,H)}px)`;h.push({y:ev.clientY,t:performance.now()});if(h.length>6)h.shift()};
const up=()=>{m.removeEventListener('pointermove',mv);m.removeEventListener('pointerup',up);m.removeEventListener('pointercancel',up);const a=h[0],b=h[h.length-1],v=b.t>a.t?(b.y-a.y)/(b.t-a.t)*1000:0,proj=dy+(v/1000)*.998/(1-.998);
if(dy>0&&(proj>H*.4||v>900)){close(v);return}
const cur=Math.max(0,dy);m.style.transform='';m.animate({transform:[`translateY(${cur}px)`,'translateY(0)']},{duration:SPD(),easing:SP()})};
m.addEventListener('pointermove',mv);m.addEventListener('pointerup',up);m.addEventListener('pointercancel',up)});
onMount&&onMount(m,close);return close}
const shrink=f=>new Promise((r,j)=>{const i=new Image,u=URL.createObjectURL(f);i.onload=()=>{const k=Math.min(1,480/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);r(c.toDataURL('image/jpeg',.72))};i.onerror=j;i.src=u});
function form(kind,item,pre){const inv=kind=='inv',e=!!item;let img=item?.img||pre?.img||'';
modal(`<h2>${inv?(e?'Editar artículo':pre?'Añadir talla':'Nuevo artículo'):(e?'Editar referencia':'Nueva referencia')}<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2>
<label class="drop" id="dr">${img?thumb(img):`${ic('cam')}<b>Añadir foto</b><small>Toca para elegir o tomar una foto</small>`}<input type="file" accept="image/*" hidden id="fi"></label>
<label class="f" id="fr">Nombre de referencia<input id="rf" value="${esc(item?.ref??pre?.ref)}" placeholder="Ej. Camisa lino azul" autocomplete="off"></label>
<div class="two"><div class="f">Categoría${dd('ct',[{v:'',t:'Sin categoría'},...S.cats.filter(c=>!c.parent).sort(byN).map(c=>({v:c.name,t:c.name}))],item?.category||pre?.category||'')}</div><div class="f">Subcategoría${dd('sc',[{v:'',t:'Sin subcategoría'}],'')}</div></div>${inv?`<div class="two"><label class="f">Cantidad<input id="qt" type="number" min="0" inputmode="numeric" value="${item?.qty??1}"></label><label class="f">Talla<input id="sz" maxlength="12" placeholder="M, 38…" value="${esc(item?.size)}" autocomplete="off"></label></div><div class="pills" id="pz">${SZ.map(z=>`<button type="button" class="pill" data-z="${z}">${z}</button>`).join('')}</div>`:`<label class="f">Nota (opcional)<textarea id="nt" rows="2">${esc(item?.note)}</textarea></label>`}
<div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn p save" id="sv"><span class="svg">${ic('check')}</span>Guardar</button></div>`,(m,close)=>{
const fillSub=v=>ddSet('sc',[{v:'',t:'Sin subcategoría'},...subsOf($('#ct').value).map(c=>({v:c.name,t:c.name}))],v);const pz=m.querySelector('#pz');if(pz)pz.onclick=e=>{const b=e.target.closest('[data-z]');if(b){$('#sz').value=b.dataset.z;pz.querySelectorAll('.pill').forEach(q=>q.classList.toggle('on',q==b))}};$('#ct').onchange=()=>fillSub('');fillSub(item?.subcategory||pre?.subcategory||'');
const set=u=>{img=u;$('#dr').innerHTML=thumb(u)+'<input type="file" accept="image/*" hidden id="fi">';bind()};const bind=()=>$('#fi').onchange=async ev=>{const f=ev.target.files[0];if(f)try{set(await shrink(f))}catch{toast('Imagen no válida','err')}};bind();
/* Sugerencias en vivo: en Inventario usa las Referencias; en Referencias usa los nombres ya añadidos al Inventario */
const pool=()=>inv?S.refs:S.inv.filter((r,k,a)=>a.findIndex(q=>q.ref.toLowerCase()==r.ref.toLowerCase())==k),hasRef=n=>S.refs.some(r=>r.id!=item?.id&&r.ref.toLowerCase()==n.toLowerCase());
const pick=name=>{const src=(inv?S.refs:S.inv).find(x=>x.ref.toLowerCase()==name.trim().toLowerCase());if(!src)return;let did=false;
if(src.img&&!img){set(src.img);did=true}
if(!inv&&src.category&&!$('#ct').value){ddSet('ct',DD.ct,src.category);fillSub(src.subcategory||'');did=true}
if(did)toast(inv?'Foto tomada de la referencia':'Datos tomados del inventario')};
$('#rf').onchange=()=>pick($('#rf').value);
const sug=()=>{const v=$('#rf').value.trim().toLowerCase(),a=pool().filter(r=>(!v||r.ref.toLowerCase().includes(v))&&r.ref.toLowerCase()!=v).sort((x,y)=>(y.ref.toLowerCase().startsWith(v)-x.ref.toLowerCase().startsWith(v))||x.ref.localeCompare(y.ref,'es')).slice(0,6);
a.length?menu($('#rf'),a.map(r=>({v:r.ref,t:r.ref+(!inv&&hasRef(r.ref)?' · ya es referencia':''),img:r.img||''})),'',x=>{$('#rf').value=x.v;pick(x.v)}):closeMenu()};
$('#rf').oninput=sug;$('#rf').onfocus=sug;$('#rf').onblur=()=>setTimeout(()=>{if(MN&&MN.a===$('#rf')&&document.activeElement!==$('#rf'))closeMenu()},150);
$('#rf').setAttribute('autocomplete','off');
$('#sv').onclick=async()=>{const ref=$('#rf').value.trim();if(!ref){$('#fr').classList.add('bad');$('#rf').focus();return}
const cs={category:$('#ct').value,subcategory:$('#sc').value},row=inv?{id:item?.id||uid(),ref,qty:Math.max(0,parseInt($('#qt').value)||0),size:$('#sz').value.trim().toUpperCase().slice(0,12),img,...cs}:{id:item?.id||uid(),ref,note:$('#nt').value.trim(),img,...cs};
if(inv&&S.inv.some(x=>x.id!=row.id&&gk(x.ref)==gk(ref)&&(x.size||'')==row.size)){toast('Ya existe la talla '+(row.size||'sin talla')+' en esta referencia. Usa + para sumar unidades.','err');return}
let nsib=0;try{if(inv){const want=row.qty,old=item?item.qty:0;row.qty=old;await DB.put('inventory',row);const d=want-old;if(d)await MV.move(row,d>0?'in':'out',Math.abs(d),e?'Ajuste por edición':'Stock inicial');
/* los datos compartidos de la referencia (nombre, categoría, foto) se aplican a todas sus tallas */
if(e){const sib=S.inv.filter(x=>x.id!=item.id&&gk(x.ref)==gk(item.ref));if(sib.length&&(row.ref!=item.ref||row.category!=(item.category||'')||row.subcategory!=(item.subcategory||'')||row.img!=(item.img||''))){for(const x of sib)await DB.put('inventory',{...x,ref:row.ref,category:row.category,subcategory:row.subcategory,img:row.img});nsib=sib.length}}}else await DB.put('references',row);await refresh();close();toast((e?'Cambios guardados':'Añadido correctamente')+(nsib?' · también actualicé '+plural(nsib,'talla','tallas')+' de esta referencia':''))}catch(x){await refresh().catch(()=>{});toast(x.message,'err')}}})}
function confirmDel(kind,ids){modal(`<h2>¿Eliminar ${ids.length>1?ids.length+' elementos':'este elemento'}?</h2><p style="color:var(--t2);margin:0 0 16px">Esta acción no se puede deshacer.</p><div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn p" id="ok" style="background:var(--red)">${ic('trash')}Eliminar</button></div>`,(m,close)=>{$('#ok').onclick=async()=>{try{await DB.del(kind=='inv'?'inventory':'references',ids);ids.forEach(i=>S.sel.delete(i));await refresh();document.querySelectorAll('.ov:not([data-keep])').forEach(o=>o.querySelector('[data-close]')?.click());toast('Eliminado')}catch(x){toast(x.message,'err')}}})}
function detail(kind,id){const it=(kind=='inv'?S.inv:S.refs).find(x=>x.id==id);if(!it)return;modal(`<h2>${esc(it.ref)}<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2><div class="ph" style="border-radius:16px;aspect-ratio:1;cursor:default">${thumb(it.img)}</div><div style="margin-top:12px">${chips(it)}</div><div class="row" style="margin:12px 0"><div>${kind=='inv'?`<span class="sub" style="margin:0">Cantidad en stock</span><div style="font-size:1.8rem;font-weight:700">${it.qty}</div>`:`<span class="sub" style="margin:0">${esc(it.note)||'Sin notas'}</span>`}</div></div><div class="acts"><button class="btn d" data-act="d">${ic('trash')}Eliminar</button><button class="btn p" data-act="e">${ic('edit')}Editar</button></div>`,(m,close)=>{m.querySelector('[data-act=d]').onclick=()=>confirmDel(kind,[id]);m.querySelector('[data-act=e]').onclick=()=>{close();form(kind,it)}})}
/* ========= Vistas ========= */
function head(t,s,extra){return`<h1>${t}</h1><p class="sub">${s}</p>${extra||''}`}
function render(){if(S.tab=='log')return renderLog();const v=$('#view'),inv=S.tab=='inv';
v.innerHTML=inv?head('Inventario de ropa','Controla existencias, fotos y exporta a Excel.',`<div class="stats"><div class="stat glass"><i class="blob"></i><span>Referencias</span><strong>${nRefs()}</strong></div><div class="stat glass"><i class="blob"></i><span>Unidades</span><strong>${S.inv.reduce((a,b)=>a+b.qty,0)}</strong></div><div class="stat glass"><i class="blob"></i><span title="Tallas sin stock">Agotadas</span><strong>${S.inv.filter(x=>!x.qty).length}</strong></div></div>
<div class="bar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar referencia" value="${esc(S.q.inv)}"></div>
<button class="btn" data-act="tpl" data-tip="Descargar plantilla">${ic('file')}<span class="l">Plantilla</span></button><button class="btn" data-act="imp" data-tip="Importar Excel">${ic('up')}<span class="l">Importar</span></button><button class="btn fly" data-act="exp" data-tip="Exportar a Excel">${ic('down')}<span class="l">Exportar</span></button><button class="btn p" data-act="add">${ic('plus')}<span class="l">Añadir</span></button></div>${fbar()}${vbar()}<div id="ls"></div>`)
:head('Referencias','Busca una referencia, previsualiza su foto y abre el detalle.',`<div class="bar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar referencia" value="${esc(S.q.refs)}"></div><button class="btn p" data-act="add">${ic('plus')}<span class="l">Nueva</span></button></div>${fbar()}<div id="ls"></div>`);
$('#q').oninput=e=>{S.q[S.tab]=e.target.value;list()};document.querySelectorAll('.fb .dd').forEach(s=>s.onchange=()=>{const t=S.tab;S.sort[t]=$('#so').value;S.fc[t]=$('#fcat').value;list()});list()}
const fl=()=>{const t=S.tab,[c,s]=S.fc[t].split('|'),q=S.q[t].toLowerCase().trim(),a=(t=='inv'?S.inv:S.refs).filter(x=>[x.ref,x.category,x.subcategory,x.size].join(' ').toLowerCase().includes(q)&&(!c||x.category==c)&&(!s||x.subcategory==s)&&(t!='inv'||!S.fs.length||S.fs.includes(x.size)));return CMP[S.sort[t]]?a.sort(CMP[S.sort[t]]):a};
function list(){const L=$('#ls'),a=fl(),inv=S.tab=='inv';L.classList.toggle('enter',!!S.enter&&!S.load);if(!S.load)S.enter=false;
if(S.load){L.innerHTML=[1,2,3].map(()=>`<div class="sk glass" style="margin-bottom:10px"><i style="width:52px;height:52px"></i><div style="flex:1"><i style="height:16px;width:60%;margin-bottom:8px"></i><i style="height:14px;width:90%"></i></div></div>`).join('');return}
if(!a.length){L.innerHTML=`<div class="empty glass">${ic(inv?'box':'tag')}<div><b>${S[S.tab].length?'Sin resultados':'Aún no hay '+(inv?'artículos':'referencias')}</b></div><div>${S[S.tab].length?'Prueba con otra búsqueda.':'Pulsa “'+(inv?'Añadir':'Nueva')+'” para empezar.'}</div></div>`;sel();return}
if(inv){L.innerHTML=renderInv(a)}
else{if(!a.find(x=>x.id==S.cur))S.cur=a[0].id;const c=a.find(x=>x.id==S.cur);L.innerHTML=`<div class="split"><div class="list">${a.map(x=>`<div class="li ${x.id==S.cur?'on':''}" data-id="${x.id}" data-act="pick"><div class="th">${thumb(x.img)}</div><div style="min-width:0"><div class="nm">${esc(x.ref)}</div>${chips(x)}</div></div>`).join('')}</div><div class="prev glass" data-id="${c.id}" key="${c.id}"><div class="ph" data-act="det">${thumb(c.img)}</div><div class="ci"><div class="nm" style="font-size:1.15rem">${esc(c.ref)}</div>${chips(c)}<p class="sub" style="margin:4px 0 12px">${esc(c.note)||'Sin notas'}</p><div class="acts" style="margin:0"><button class="btn" data-act="ed">${ic('edit')}Editar</button><button class="btn d" data-act="del">${ic('trash')}</button><button class="btn p" data-act="det">Ver detalle</button></div></div></div></div>`}
sel()}
/* ========= Vistas del inventario: agrupada / individual × cuadrícula grande / pequeña / lista ========= */
const ck=(attr,on)=>`<label class="ck"><input type="checkbox" ${attr} ${on?'checked':''}><i><b></b><u>${ic('check')}</u></i></label>`;
const qtyBox=x=>`<div class="qty"><button class="ib" data-act="m" aria-label="Restar" ${x.qty?'':'disabled'}>${ic('minus')}</button>${x.qty}<button class="ib" data-act="p" aria-label="Sumar">${ic('plus')}</button></div>`;
const edel=()=>`<button class="ib" data-act="ed" data-tip="Editar" aria-label="Editar">${ic('edit')}</button><button class="ib" data-act="del" data-tip="Eliminar" aria-label="Eliminar">${ic('trash')}</button>`;
const plural=(n,a,b)=>n+' '+(n==1?a:b);
const gchips=g=>`<div class="chips">${g.category?`<span class="chip c">${esc(g.category)}</span>`:''}${g.subcategory?`<span class="chip s">${esc(g.subcategory)}</span>`:''}<span class="chip z">${plural(g.items.length,'talla','tallas')}</span>${g.out&&g.total?`<span class="chip w">${g.out} agotada${g.out>1?'s':''}</span>`:''}</div>`;
const gstrip=(g,max)=>`<div class="gsz">${g.items.slice(0,max).map(x=>`<span class="${x.qty?'':'z0'}${S.fs.includes(x.size)?' hit':''}">${esc(x.size||'—')}<b>${x.qty}</b></span>`).join('')}${g.items.length>max?`<span>+${g.items.length-max}</span>`:''}</div>`;
const gck=g=>ck(`data-selg="${esc(g.key)}"`,g.items.every(x=>S.sel.has(x.id)));
const cardG=(g,i,sm)=>`<div class="card glass g${sm?' sm':''}${g.total?'':' off'}" style="animation-delay:${Math.min(i,12)*40}ms" data-key="${esc(g.key)}">${gck(g)}<div class="ph" data-act="grp">${thumb(g.img)}${g.total?'':'<span class="soldout">Agotado</span>'}</div><div class="ci" data-act="grp"><div class="nm" title="${esc(g.ref)}">${esc(g.ref)}</div>${sm?'':gchips(g)+gstrip(g,5)}<div class="gtot"><span>${sm?plural(g.items.length,'talla','tallas'):'Total en stock'}</span><strong>${g.total}</strong>${sm?'':ic('chr')}</div></div></div>`;
const rowG=g=>`<div class="li g${g.total?'':' off'}" data-key="${esc(g.key)}">${gck(g)}<div class="th" data-act="grp">${thumb(g.img)}</div><div class="mid" data-act="grp"><div class="nm">${esc(g.ref)}</div><div class="md">${plural(g.items.length,'talla','tallas')}${g.items.some(x=>x.size)?': '+g.items.map(x=>esc(x.size||'—')).join(' · '):''}${g.category?' · '+esc(g.category):''}</div></div><div class="gend" data-act="grp"><div class="gq">${g.total}<small>uds</small></div>${ic('chr')}</div></div>`;
const cardI=(x,i,sm)=>`<div class="card glass${sm?' sm':''}${x.qty?'':' off'}" style="animation-delay:${Math.min(i,12)*40}ms" data-id="${x.id}">${ck(`data-sel="${x.id}"`,S.sel.has(x.id))}<div class="ph" data-act="det">${thumb(x.img)}${x.qty?'':'<span class="soldout">Agotado</span>'}</div><div class="ci"><div class="nm" title="${esc(x.ref)}">${esc(x.ref)}</div>${chips(x)}<div class="row">${qtyBox(x)}${sm?'':`<div style="display:flex;gap:4px">${edel()}</div>`}</div></div></div>`;
const rowI=x=>`<div class="li f${x.qty?'':' off'}" data-id="${x.id}">${ck(`data-sel="${x.id}"`,S.sel.has(x.id))}<div class="th" data-act="det">${thumb(x.img)}</div><div class="mid" data-act="det"><div class="nm">${esc(x.ref)}</div>${chips(x)}</div>${qtyBox(x)}<div class="acts2">${edel()}</div></div>`;
function renderInv(a){const l=S.vl,sm=l=='small',g=S.vg?groupsOf(a):null;
if(l=='list')return`<div class="rows">${(g?g.map(rowG):a.map(rowI)).join('')}</div>`;
return`<div class="grid${sm?' s':''}">${(g?g.map((x,i)=>cardG(x,i,sm)):a.map((x,i)=>cardI(x,i,sm))).join('')}</div>`}
const vbar=()=>`<div class="vbar"><div class="vseg" role="group" aria-label="Tamaño de vista">${[['big','g2','Cuadrícula grande'],['small','g3','Cuadrícula pequeña'],['list','lst','Lista con vista previa']].map(([k,i,t])=>`<button type="button" class="${S.vl==k?'on':''}" data-act="vw" data-v="${k}" data-tip="${t}" aria-label="${t}" aria-pressed="${S.vl==k}">${ic(i)}</button>`).join('')}</div><button type="button" class="sw${S.vg?' on':''}" data-act="vg" role="switch" aria-checked="${S.vg}"><span>Agrupar<span class="lg"> por referencia</span></span><i></i></button></div>`;
/* ========= Desglose por talla de una referencia ========= */
function groupModal(key){modal('',(m,close)=>{m.parentNode.dataset.keep=1;m.classList.add('wide');let first=true;
const draw=()=>{const g=groupOf(key);if(!g){close();S.gm=null;return}const st=m.scrollTop,n=g.items.length,blank=g.items.filter(x=>!x.size),sized=g.items.filter(x=>x.size);if(S.zd=='desc')sized.reverse();
m.classList.toggle('fresh',first);
m.innerHTML=`<h2>${esc(g.ref)}<button class="ib" data-g="x" aria-label="Cerrar">${ic('x')}</button></h2>
<div class="mvit"><div class="th">${thumb(g.img)}</div><div style="min-width:0">${g.category||g.subcategory?`<div class="chips" style="margin:0 0 6px">${g.category?`<span class="chip c">${esc(g.category)}</span>`:''}${g.subcategory?`<span class="chip s">${esc(g.subcategory)}</span>`:''}</div>`:''}<div class="md"><b style="color:var(--t);font-size:1.15rem">${g.total}</b> unidades en total</div><div class="md">${plural(n,'talla','tallas')}${g.out?' · '+g.out+' agotada'+(g.out>1?'s':''):''}</div></div></div>
<div class="gmbar"><span class="md">Desglose por talla</span><div class="seg mini"><button type="button" class="pill${S.zd=='asc'?' on':''}" data-g="asc">${ic('aup')}Menor a mayor</button><button type="button" class="pill${S.zd=='desc'?' on':''}" data-g="desc">${ic('adn')}Mayor a menor</button></div></div>
<div class="zrows">${[...sized,...blank].map((x,i)=>`<div class="zr${x.qty?'':' off'}" data-id="${x.id}" style="animation-delay:${i*45}ms"><span class="chip z big">${esc(x.size||'Sin talla')}</span>${x.qty?'':'<span class="chip x">Agotada</span>'}<div class="qty"><button class="ib" data-g="m" aria-label="Restar" ${x.qty?'':'disabled'}>${ic('minus')}</button>${x.qty}<button class="ib" data-g="p" aria-label="Sumar">${ic('plus')}</button></div><button class="ib" data-g="ed" aria-label="Editar" data-tip="Editar">${ic('edit')}</button><button class="ib" data-g="del" aria-label="Eliminar" data-tip="Eliminar">${ic('trash')}</button></div>`).join('')}</div>
<div class="acts"><button class="btn d" data-g="delall">${ic('trash')}Eliminar todas</button><button class="btn p" data-g="add">${ic('plus')}Añadir talla</button></div>`;
m.scrollTop=st;first=false};
m.onclick=e=>{const b=e.target.closest('[data-g]');if(!b)return;const a=b.dataset.g,id=b.closest('[data-id]')?.dataset.id,it=id&&S.inv.find(x=>x.id==id);
if(a=='x')close();else if(a=='asc'||a=='desc'){S.zd=a;saveV();draw()}
else if(a=='m'&&it)qtyModal(it,'out');else if(a=='p'&&it)qtyModal(it,'in');else if(a=='ed'&&it)form('inv',it);else if(a=='del'&&it)confirmDel('inv',[id]);
else if(a=='delall'){const g=groupOf(key);g&&confirmDel('inv',g.items.map(x=>x.id))}
else if(a=='add'){const g=groupOf(key);g&&form('inv',null,{ref:g.ref,category:g.category,subcategory:g.subcategory,img:g.img})}};
S.gm={el:m,draw};draw()})}
function sel(){const n=S.sel.size,ks=new Set(S.inv.filter(x=>S.sel.has(x.id)).map(x=>gk(x.ref))).size;$('#selbar').classList.toggle('on',n>0&&S.tab=='inv');$('#selc').textContent=S.vg?plural(ks,'referencia','referencias')+' · '+plural(n,'talla','tallas'):n+(n==1?' seleccionado':' seleccionados')}
async function refresh(){const first=S.load;[S.inv,S.refs,S.cats,S.mov]=await Promise.all([DB.list('inventory'),DB.list('references'),DB.list('categories').catch(()=>[]),DB.list('movements').then(x=>{S.movErr='';return x}).catch(x=>{S.movErr=x.message;return[]})]);S.load=false;if(first)S.enter=true;render();if(S.gm){S.gm.el.isConnected?S.gm.draw():S.gm=null}}
/* ========= Sumar / restar con confirmación ========= */
function qtyModal(it,type){const add=type=='in',w=add?'añadir':'restar';
modal(`<h2>${add?'Añadir':'Restar'} unidades<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2>
<div class="mvit"><div class="th">${thumb(it.img)}</div><div style="min-width:0"><div class="nm">${esc(it.ref)}</div>${chips(it)}<div class="md">Stock actual: <b>${it.qty}</b></div></div></div>
<label class="f" id="mqf">¿Cuántas unidades vas a ${w}?<input id="mq" type="number" min="1" step="1" inputmode="numeric" value="1" autocomplete="off"></label>
<label class="f">Motivo (opcional)<input id="mr" maxlength="120" placeholder="${add?'Ej. Pedido del proveedor':'Ej. Venta, daño, cambio…'}" autocomplete="off"></label>
<div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn p" id="go">Continuar</button></div>`,(m,close)=>{
m.classList.add('mini');const inp=$('#mq');setTimeout(()=>{inp.focus();inp.select()},60);
const step2=()=>{const n=parseInt(inp.value),reason=$('#mr').value.trim();
if(!(n>=1)||String(n)!==String(inp.value).trim()){$('#mqf').classList.add('bad');return toast('Escribe una cantidad entera mayor a 0','err')}
if(!add&&n>it.qty){$('#mqf').classList.add('bad');return toast('Solo hay '+it.qty+' unidad'+(it.qty==1?'':'es')+' en stock','err')}
const after=it.qty+(add?n:-n);
m.innerHTML=`<h2>Confirmar ${add?'ingreso':'salida'}<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2>
<div class="mvbig ${type}"><div class="mi">${ic(add?'aup':'adn')}</div><div style="min-width:0"><div class="nm">${esc(it.ref)}${it.size?' · '+esc(it.size):''}</div><div class="md">${add?'Vas a añadir':'Vas a restar'} <b>${n}</b> unidad${n==1?'':'es'}</div></div></div>
<p style="margin:0 0 10px">El stock pasará de <b>${it.qty}</b> a <b>${after}</b>${reason?`<br><span class="md">Motivo: ${esc(reason)}</span>`:''}</p>
<div class="mvnote">${ic('info')}<span>Este movimiento quedará guardado en el <b>Registro</b> como ${add?'ingreso':'salida'}${after==0?'. La referencia quedará agotada.':'.'}</span></div>
<div class="acts"><button class="btn" id="bk">Volver</button><button class="btn p" id="ok"${add?'':' style="background:var(--red)"'}>${ic('check')}Confirmar</button></div>`;
m.onkeydown=null;m.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
$('#bk').onclick=()=>{close();qtyModal(it,type)};
$('#ok').onclick=async()=>{const b=$('#ok');b.disabled=true;try{await MV.move(it,type,n,reason);await refresh();close();toast((add?'Ingreso':'Salida')+' guardado: ya se ve en el Registro')}catch(x){b.disabled=false;await refresh().catch(()=>{});toast(x.message,'err')}}};
$('#go').onclick=step2;m.onkeydown=e=>{if(e.key=='Enter'&&e.target.id!='go'){e.preventDefault();step2()}};inp.oninput=()=>$('#mqf').classList.remove('bad')})}
/* ========= Registro ========= */
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1),TZ='America/Bogota';
const fdt=iso=>{const d=new Date(iso);if(isNaN(d))return{day:'',h:''};const clean=s=>s.replace(/[\u202f\u00a0]/g,' ');
return{day:cap(clean(new Intl.DateTimeFormat('es-CO',{timeZone:TZ,weekday:'long',day:'numeric',month:'short',year:'numeric'}).format(d))),h:clean(new Intl.DateTimeFormat('es-CO',{timeZone:TZ,hour:'numeric',minute:'2-digit',hour12:true}).format(d))}};
const MF={all:'Todos',in:'Ingresos',out:'Salidas',void:'Anulados'};
function renderLog(){const ok=S.mov.filter(m=>!m.voided),ui=ok.filter(m=>m.type=='in').reduce((a,m)=>a+m.qty,0),uo=ok.filter(m=>m.type=='out').reduce((a,m)=>a+m.qty,0);
$('#view').innerHTML=head('Registro de movimientos','Historial de ingresos y salidas · hora de Colombia (GMT-5).',`<div class="stats"><div class="stat glass sm-in"><i class="blob"></i><span>Unidades ingresadas</span><strong>+${ui}</strong></div><div class="stat glass sm-out"><i class="blob"></i><span>Unidades salidas</span><strong>−${uo}</strong></div><div class="stat glass"><i class="blob"></i><span>Movimientos</span><strong>${S.mov.length}</strong></div></div>
<div class="bar"><div class="search">${ic('search')}<input id="q" placeholder="Buscar referencia, talla o motivo" value="${esc(S.q.log)}"></div>${S.mmode?`<button class="btn" data-act="ancancel">${ic('x')}<span class="l">Cancelar</span></button><button class="btn p" id="anb" data-act="anrun" style="background:var(--red)" disabled>${ic('ban')}<span class="l">Anular&nbsp;</span>(<span id="anc">0</span>)</button>`:`<button class="btn" data-act="anmode" data-tip="Elegir movimientos a anular">${ic('ban')}<span class="l">Anular</span></button>`}</div>
<div class="seg">${Object.entries(MF).map(([k,t])=>`<button class="pill${S.mf==k?' on':''}" data-act="mf" data-v="${k}">${t}</button>`).join('')}</div>
${S.mmode?`<div class="mvnote">${ic('info')}<span>Toca los movimientos que quieras anular. Las salidas devuelven unidades al stock y los ingresos las descuentan.</span></div>`:''}
${S.movErr?`<div class="empty glass">${ic('alert')}<div>${esc(S.movErr)}</div></div>`:''}<div id="ml"></div>`);
$('#q').oninput=e=>{S.q.log=e.target.value;logList()};logList();sel()}
function logList(){const L=$('#ml');if(!L)return;L.classList.toggle('enter',!!S.enter&&!S.load);if(!S.load)S.enter=false;
if(S.load){L.innerHTML=[1,2,3].map(()=>`<div class="sk glass" style="margin-bottom:10px"><i style="width:42px;height:42px"></i><div style="flex:1"><i style="height:16px;width:60%;margin-bottom:8px"></i><i style="height:14px;width:90%"></i></div></div>`).join('');return}
const q=S.q.log.toLowerCase().trim(),a=S.mov.filter(m=>(S.mf=='all'||(S.mf=='void'?m.voided:(m.type==S.mf&&!m.voided)))&&[m.ref,m.size,m.reason,m.type=='in'?'ingreso':'salida',m.voided?'anulado':''].join(' ').toLowerCase().includes(q));
const c=$('#anc');if(c){c.textContent=S.msel.size;$('#anb').disabled=!S.msel.size}
if(!a.length){L.innerHTML=S.movErr?'':`<div class="empty glass">${ic('hist')}<div><b>${S.mov.length?'Sin resultados':'Aún no hay movimientos'}</b></div><div>${S.mov.length?'Prueba con otro filtro o búsqueda.':'Al sumar o restar unidades aparecerán aquí.'}</div></div>`;return}
L.innerHTML=`<div class="mlist">${a.map((m,i)=>{const inn=m.type=='in',v=!!m.voided,on=S.msel.has(m.id),d=fdt(m.created_at),vd=v&&m.voided_at?fdt(m.voided_at):null,pick=S.mmode&&!v;
return`<div class="mv ${inn?'in':'out'}${v?' void':''}${on?' on':''}${pick?' sl':''}" style="animation-delay:${Math.min(i,10)*30}ms" data-id="${esc(m.id)}"${pick?' data-act="mtog"':''}>${S.mmode?`<span class="mck${on?' on':''}${v?' dis':''}">${on?ic('check'):''}</span>`:''}<div class="mi" aria-hidden="true">${ic(inn?'aup':'adn')}</div><div class="mb"><div class="mt"><span class="nm">${esc(m.ref)}</span>${m.size?`<span class="chip z">${esc(m.size)}</span>`:''}<span class="mtag">${inn?'Ingreso':'Salida'}</span>${v?'<span class="chip x">Anulado</span>':''}</div><div class="md">${esc(d.day)} · ${esc(d.h)}</div><div class="md">Stock ${m.stock_before} → ${m.stock_after}${m.reason?' · '+esc(m.reason):''}</div>${vd?`<div class="md">Anulado el ${esc(vd.day)} · ${esc(vd.h)}</div>`:''}</div><div class="mq">${inn?'+':'−'}${m.qty}</div></div>`}).join('')}</div>`}
function confirmVoid(ids){const ms=ids.map(i=>S.mov.find(m=>m.id==i)).filter(Boolean),n=ms.length;if(!n)return;
modal(`<h2>¿Anular ${n>1?n+' movimientos':'este movimiento'}?<button class="ib" data-close aria-label="Cerrar">${ic('x')}</button></h2><p style="color:var(--t2);margin:0 0 10px">Las salidas anuladas <b>devuelven</b> las unidades al stock y los ingresos anulados las <b>descuentan</b>. Quedarán marcados como “Anulado” en el Registro.</p><div style="margin-bottom:14px">${ms.slice(0,4).map(m=>`<div class="md">• ${m.type=='in'?'Ingreso':'Salida'} · ${esc(m.ref)}${m.size?' ('+esc(m.size)+')':''} · ${m.qty} u.</div>`).join('')}${n>4?`<div class="md">… y ${n-4} más</div>`:''}</div><div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn p" id="ok" style="background:var(--red)">${ic('ban')}Anular</button></div>`,(m,close)=>{
m.classList.add('mini');$('#ok').onclick=async()=>{$('#ok').disabled=true;let done=0,err='';
for(const x of [...ms].sort((p,q)=>(p.type=='out'?0:1)-(q.type=='out'?0:1))){try{await MV.void(x.id);done++}catch(e){err=e.message}}
S.msel.clear();S.mmode=false;await refresh().catch(()=>{});close();if(done)toast(done==1?'Movimiento anulado y stock actualizado':done+' movimientos anulados y stock actualizado');if(err)toast(err,'err')}})}
/* ========= Excel ========= */
async function ensureCat(c,s){if(!c)return['',''];let p=S.cats.find(x=>!x.parent&&x.name.toLowerCase()==c.toLowerCase());if(!p){p={id:uid(),name:c,parent:''};await DB.put('categories',p);S.cats.push(p)}
let q=s&&S.cats.find(x=>x.parent==p.id&&x.name.toLowerCase()==s.toLowerCase());if(s&&!q){q={id:uid(),name:s,parent:p.id};await DB.put('categories',q);S.cats.push(q)}return[p.name,q?q.name:'']}
const fotoCell=u=>u?(/^https?:/.test(u)?u:'(foto guardada en la app)'):'';
function xl(rows,name){const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows,{header:['Referencia','Categoría','Subcategoría','Talla','Cantidad','Foto']});ws['!cols']=[{wch:34},{wch:18},{wch:18},{wch:9},{wch:11},{wch:48}];XLSX.utils.book_append_sheet(wb,ws,'Inventario');return wb}
function tpl(){const wb=xl([{Referencia:'Camisa lino azul',Categoría:'Camisas',Subcategoría:'Lino',Talla:'M',Cantidad:5,Foto:'https://ejemplo.com/foto.jpg'}]);XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Instrucciones'],['Referencia: nombre único del artículo (obligatorio)'],['Categoría / Subcategoría / Talla: opcionales (las categorías nuevas se crean solas)'],['Cantidad: número entero'],['Foto: enlace https a la imagen (opcional)'],['Borra la fila de ejemplo antes de importar.']]),'Instrucciones');XLSX.writeFile(wb,'plantilla-inventario.xlsx');toast('Plantilla descargada')}
function exp(){if(!S.inv.length)return toast('No hay datos para exportar','err');XLSX.writeFile(xl(S.inv.map(x=>({Referencia:x.ref,Categoría:x.category||'',Subcategoría:x.subcategory||'',Talla:x.size||'',Cantidad:x.qty,Foto:fotoCell(x.img)}))),'inventario-'+new Date().toISOString().slice(0,10)+'.xlsx');toast('Excel exportado')}
$('#xin').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const wb=XLSX.read(await f.arrayBuffer()),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);let n=0;
for(const r of rows){const ref=String(r.Referencia??'').trim();if(!ref)continue;const sz=String(r.Talla??'').trim().toUpperCase().slice(0,12),ex=S.inv.find(x=>gk(x.ref)==gk(ref)&&(x.size||'')==sz),foto=String(r.Foto??'');const[category,subcategory]=await ensureCat(String(r['Categoría']??'').trim(),String(r['Subcategoría']??'').trim());const want=Math.max(0,parseInt(r.Cantidad)||0),old=ex?ex.qty:0,row={id:ex?.id||uid(),ref,category,subcategory,size:sz,qty:old,img:/^https?:/.test(foto)?foto:ex?.img||''};await DB.put('inventory',row);if(want!==old)await MV.move(row,want>old?'in':'out',Math.abs(want-old),'Importación Excel');if(ex)ex.qty=want;else S.inv.push({...row,qty:want});n++}
await refresh();toast(n?n+' filas importadas':'No se encontraron filas válidas',n?'ok':'err')}catch{toast('No se pudo leer el archivo','err')}};
/* ========= Eventos ========= */
document.addEventListener('click',async e=>{const t=e.target.closest('[data-act],[data-tab]');if(!t)return;
if(t.dataset.tab){S.tab=t.dataset.tab;S.enter=true;S.mmode=false;S.msel.clear();document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b==t));moveInd();render();enterView();return}
const a=t.dataset.act,card=t.closest('[data-id]'),id=card?.dataset.id,kind=S.tab;
if(t.closest('.ov'))return;
if(a=='add')form(kind);else if(a=='tpl')tpl();else if(a=='exp')exp();else if(a=='imp')$('#xin').click();else if(a=='cats')catModal();
else if(a=='grp'){const k=t.closest('[data-key]')?.dataset.key;k&&groupModal(k)}
else if(a=='vw'){S.vl=t.dataset.v;saveV();document.querySelectorAll('.vseg button').forEach(b=>{const on=b.dataset.v==S.vl;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});S.enter=true;list()}
else if(a=='vg'){S.vg=!S.vg;saveV();t.classList.toggle('on',S.vg);t.setAttribute('aria-checked',S.vg);S.enter=true;list()}
else if(a=='pick'){S.cur=id;list()}else if(a=='det')detail(kind,id);else if(a=='ed')form(kind,(kind=='inv'?S.inv:S.refs).find(x=>x.id==id));else if(a=='del')confirmDel(kind,[id]);
else if(a=='bulk')confirmDel('inv',[...S.sel]);
else if(a=='m'||a=='p'){const it=S.inv.find(x=>x.id==id);if(!it)return;if(a=='m'&&!it.qty)return toast('No hay unidades para restar','err');qtyModal(it,a=='p'?'in':'out')}
else if(a=='mf'){S.mf=t.dataset.v;renderLog()}else if(a=='anmode'){S.mmode=true;S.msel.clear();renderLog()}else if(a=='ancancel'){S.mmode=false;S.msel.clear();renderLog()}
else if(a=='mtog'){S.msel.has(id)?S.msel.delete(id):S.msel.add(id);logList()}else if(a=='anrun'){if(S.msel.size)confirmVoid([...S.msel])}});
document.addEventListener('change',e=>{const s=e.target.dataset.sel,k=e.target.dataset.selg;if(s){e.target.checked?S.sel.add(s):S.sel.delete(s);sel()}else if(k){const g=groupOf(k);if(g){g.items.forEach(x=>e.target.checked?S.sel.add(x.id):S.sel.delete(x.id));sel()}}});
/* ========= Movimiento: indicador de pestañas, entrada de vista, contadores ========= */
function moveInd(){const n=$('.side'),t=n&&n.querySelector('.tab.on'),i=n&&n.querySelector('.ind');if(!t||!i)return;i.style.width=t.offsetWidth+'px';i.style.height=t.offsetHeight+'px';i.style.transform=`translate(${t.offsetLeft}px,${t.offsetTop}px)`;if(!i.classList.contains('ready'))requestAnimationFrame(()=>requestAnimationFrame(()=>i.classList.add('ready')))}
function enterView(){if(RM())return;const v=$('#view');v.animate({opacity:[0,1],transform:['translateY(12px)','none']},{duration:SPD(),easing:SP()})}
const PV={};
function stats(){document.querySelectorAll('.stat strong').forEach((el,i)=>{if(el.dataset.c)return;el.dataset.c=1;const mm=el.textContent.trim().match(/^([+−-]?)(\d+)$/);if(!mm)return;const key=S.tab+i,to=+mm[2],from=PV[key]??0;PV[key]=to;if(RM()||from===to)return;const t0=performance.now(),D=750,f=t=>{const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,4);el.textContent=mm[1]+Math.round(from+(to-from)*e);if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
{const r0=render,l0=renderLog;render=function(){r0();stats()};renderLog=function(){l0();stats()}}
addEventListener('resize',moveInd);document.fonts&&document.fonts.ready.then(moveInd);
/* ========= Inicio ========= */
$('#lg').innerHTML=ic('box');document.querySelector('[data-tab=inv]').innerHTML=ic('box')+'<span>Inventario</span>';document.querySelector('[data-tab=refs]').innerHTML=ic('tag')+'<span>Referencias</span>';document.querySelector('[data-tab=log]').innerHTML=ic('hist')+'<span>Registro</span>';
$('#selbar .btn').innerHTML=ic('trash')+'Eliminar';
moveInd();render();refresh().catch(()=>{S.load=false;render();toast('No se pudo conectar con el servidor','err')});
setTimeout(()=>{$('#sp').classList.add('out');setTimeout(()=>$('#sp').remove(),600)},1100);

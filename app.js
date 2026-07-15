const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const KEYS={history:'ravitoai-history-v2',profile:'ravitoai-profile-v1',products:'ravitoai-products-v1'};
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let products=load(KEYS.products,[]),profile=load(KEYS.profile,null);

const tabs=$$('.tab'),panels=$$('.tab-panel');
tabs.forEach(t=>t.onclick=()=>{tabs.forEach(x=>x.classList.remove('active'));panels.forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#'+t.dataset.tab)?.classList.add('active');if(t.dataset.tab==='products')renderProducts();if(t.dataset.tab==='history')renderHistory()});
$('#theme-toggle').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('ravitoai-theme',document.body.classList.contains('dark')?'dark':'light')};
if(localStorage.getItem('ravitoai-theme')==='dark')document.body.classList.add('dark');
$('#distance').onchange=()=>$('#custom-distance-wrap').classList.toggle('hidden',$('#distance').value!=='custom');

function fillProfile(){if(!profile)return;$('#profile-name').value=profile.name||'';$('#profile-weight').value=profile.weight||'';$('#profile-birth-year').value=profile.birthYear||'';$('#profile-level').value=profile.level||'regular';$('#profile-sweat').value=profile.sweat||'low';$('#profile-digestion').value=profile.digestion||'normal';$('#profile-carb-max').value=profile.carbMax||60;$('#profile-notes').value=profile.notes||''}
function updateProfileStatus(){$('#profile-status').textContent=profile?`Profil ${profile.name||'enregistré'}`:'Profil à compléter'}
$('#profile-form').onsubmit=e=>{e.preventDefault();const previous=load(KEYS.profile,{});profile={...previous,name:$('#profile-name').value.trim(),weight:Number($('#profile-weight').value),birthYear:Number($('#profile-birth-year').value)||null,level:$('#profile-level').value,sweat:$('#profile-sweat').value,digestion:$('#profile-digestion').value,carbMax:Number($('#profile-carb-max').value),notes:$('#profile-notes').value.trim()};save(KEYS.profile,profile);updateProfileStatus();$('#profile-saved').classList.remove('hidden')};

function renderProducts(){products=load(KEYS.products,[]);const q=($('#product-search')?.value||'').toLowerCase(),type=$('#product-filter')?.value||'all';const list=products.filter(p=>(type==='all'||p.type===type)&&`${p.brand} ${p.name} ${p.flavor||''}`.toLowerCase().includes(q));if($('#product-count'))$('#product-count').textContent=`${products.filter(p=>p.status==='stock').length} en stock · ${products.filter(p=>p.status==='planned').length} prévus`;if($('#product-list'))$('#product-list').innerHTML=list.length?list.map(p=>`<article class="product-item"><div><strong>${p.brand} · ${p.name}</strong><div class="product-meta">${p.carbs||0} g glucides · ${p.sodium||0} mg sodium${p.caffeine?` · ${p.caffeine} mg caféine`:''}</div></div><div class="product-actions"><button class="favorite" data-fav="${p.id}" type="button">${p.favorite?'★':'☆'}</button></div></article>`).join(''):'<p class="empty">Aucun produit trouvé.</p>';$$('[data-fav]').forEach(b=>b.onclick=()=>{products=products.map(p=>p.id===b.dataset.fav?{...p,favorite:!p.favorite}:p);save(KEYS.products,products);renderProducts()})}
$('#product-search')?.addEventListener('input',renderProducts);$('#product-filter')?.addEventListener('change',renderProducts);
$('#product-form').onsubmit=e=>{e.preventDefault();products=load(KEYS.products,[]);products.push({id:'custom-'+Date.now(),brand:$('#new-brand').value.trim(),name:$('#new-name').value.trim(),type:$('#new-type').value,carbs:Number($('#new-carbs').value),sodium:Number($('#new-sodium').value)||0,caffeine:Number($('#new-caffeine').value)||0,status:$('#new-status').value,quantity:0,favorite:false});save(KEYS.products,products);e.target.reset();$('#new-carbs').value=25;renderProducts()};

const getHistory=()=>load(KEYS.history,[]);
function renderHistory(){const list=getHistory();$('#history-list').innerHTML=list.length?list.map(i=>`<article class="history-item"><strong>${i.name}</strong><span>${i.distance} km · ${i.duration} min · ${i.product||'plan automatique'} · ${i.carbs} g/h</span></article>`).join(''):'<p class="empty">Aucune stratégie enregistrée.</p>'}
$('#clear-history').onclick=()=>{localStorage.removeItem(KEYS.history);renderHistory()};
const fmt=m=>!m?'Départ':m>=60?`${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`:`${m} min`;
const label=p=>`${p.brand} ${p.name}${p.flavor?` · ${p.flavor}`:''}`;
const usableType=p=>['gel','compote','solid','drink'].includes(p.type);

function chooseProducts(status,digestion){
  const pool=load(KEYS.products,[]).filter(p=>p.status===status&&usableType(p)&&(!p.quantity||p.quantity>0||status==='planned'));
  const avoided=(profile?.avoided||profile?.notes||'').toLowerCase();
  const preferred=(profile?.preferred||'').toLowerCase();
  return pool.filter(p=>!avoided||!`${p.brand} ${p.name}`.toLowerCase().split(' ').some(w=>w.length>4&&avoided.includes(w))).sort((a,b)=>Number(b.favorite)-Number(a.favorite)+(preferred.includes(b.brand.toLowerCase())?1:0)-(preferred.includes(a.brand.toLowerCase())?1:0)||Math.abs((digestion==='sensitive'?22:27)-(a.carbs||25))-Math.abs((digestion==='sensitive'?22:27)-(b.carbs||25)));
}
function makeSuggestion(pool,totalCarbs,duration,water,sodium){
  if(!pool.length)return null;
  const drink=pool.find(p=>p.type==='drink'&&(p.carbs||0)>0);
  const fuel=pool.find(p=>['gel','compote','solid'].includes(p.type))||pool[0];
  const drinkCarbs=drink&&duration>=90?Math.min(totalCarbs,drink.carbs||0):0;
  const remaining=Math.max(0,totalCarbs-drinkCarbs);
  const portions=fuel&&remaining?Math.max(1,Math.ceil(remaining/Math.max(1,fuel.carbs||25))):0;
  return{drink,fuel,drinkCarbs,portions,totalCarbs,water,sodium};
}
function proposalHtml(title,s,kind){
  if(!s)return`<div class="notice"><strong>${title}</strong><br>Aucun produit correspondant. Ajoute des références dans ${kind==='stock'?'Mon stock':'Ma liste d’achats'}.</div>`;
  const items=[];if(s.drink)items.push(`${label(s.drink)} : 1 portion dans une flasque${s.drinkCarbs?` (${s.drinkCarbs} g de glucides)`:''}`);if(s.fuel&&s.portions)items.push(`${s.portions} × ${label(s.fuel)} (${s.fuel.carbs||0} g par portion)`);if(!items.length)items.push('Eau seule, sans produit énergétique pendant la course.');
  return`<section class="suggestion-box"><strong>${title}</strong><span>${items.join('<br>')}</span></section>`;
}
function preRaceHtml(duration,totalCarbs){
  const breakfast=load(KEYS.products,[]).filter(p=>p.status==='stock'&&p.type==='breakfast');
  const chosen=breakfast[0];
  const meal=duration>=150?'3 h avant : petit-déjeuner riche en glucides, pauvre en fibres et déjà testé.':duration>=90?'2 h 30 à 3 h avant : petit-déjeuner digeste et habituel.':'2 à 3 h avant : repas léger, sans surcharge.';
  const product=chosen?`Produit en stock suggéré : ${label(chosen)} selon la portion indiquée sur l’emballage.`:'Aucun produit pré-course en stock : utilise ton petit-déjeuner habituel ou ajoute un Sportdej/gâteau énergétique au catalogue.';
  const close=duration>=60?'10 à 15 min avant : option de 20 à 25 g de glucides seulement si déjà testé.':'Pas de gel obligatoire juste avant pour ce format court.';
  return`<h3>Stratégie pré-course</h3><div class="timeline"><div class="timeline-item"><strong>J-1</strong><p>Repas habituels, hydratation régulière, sans charge excessive.</p></div><div class="timeline-item"><strong>-3 h</strong><p>${meal} ${product}</p></div><div class="timeline-item"><strong>-15 min</strong><p>${close}</p></div></div>`;
}

$('#strategy-form').onsubmit=e=>{
  e.preventDefault();profile=load(KEYS.profile,profile||{});products=load(KEYS.products,[]);
  const distance=$('#distance').value==='custom'?Number($('#custom-distance').value):Number($('#distance').value),duration=Number($('#hours').value)*60+Number($('#minutes').value),temp=Number($('#temperature').value),sweat=$('#sweat-rate').value==='profile'?(profile?.sweat||'normal'):$('#sweat-rate').value,digestion=$('#digestion').value==='profile'?(profile?.digestion||'normal'):$('#digestion').value,name=$('#race-name').value.trim()||`${distance} km`;
  if(!distance||duration<=0)return;
  let carbRate=duration<55?0:duration<80?25:duration<120?40:duration<180?55:65;if(digestion==='sensitive')carbRate=Math.max(carbRate?20:0,carbRate-10);if(digestion==='trained'&&duration>=100)carbRate+=10;if(profile?.carbMax)carbRate=Math.min(carbRate,profile.carbMax);
  let water=sweat==='low'?300:sweat==='high'?650:475;if(temp>=25)water+=150;if(temp>=30)water+=100;if(temp<=8)water-=75;water=Math.max(250,Math.round(water/25)*25);
  let sodium=duration<75?0:sweat==='low'?300:sweat==='high'?700:500;if(temp>=25)sodium+=150;
  const totalCarbs=Math.round(carbRate*duration/60),totalWater=Math.round(water*duration/60/50)*50,stock=makeSuggestion(chooseProducts('stock',digestion),totalCarbs,duration,water,sodium),planned=makeSuggestion(chooseProducts('planned',digestion),totalCarbs,duration,water,sodium),chosen=stock||planned;
  const timeline=[];if(chosen?.fuel&&chosen.portions){const start=duration<90?30:25;const gap=Math.max(20,Math.round((duration-start)/Math.max(1,chosen.portions-1)/5)*5);for(let i=0;i<chosen.portions;i++)timeline.push({t:Math.min(duration-5,start+i*gap),text:`${label(chosen.fuel)} · ${chosen.fuel.carbs||0} g de glucides${chosen.fuel.waterNeed?` · eau : ${chosen.fuel.waterNeed}`:''}.`})}else timeline.push({t:Math.round(duration/2),text:'Eau selon la soif ; aucun apport glucidique obligatoire pendant ce format.'});
  timeline.push({t:10,text:`Boire par petites gorgées toutes les 10 à 15 min pour viser ${water} ml/h${sodium?` et environ ${sodium} mg de sodium/h`:''}.`});
  window.RAVITO_LAST_PLAN={carbRate,water,sodium,totalCarbs,totalWater,stock,planned,duration};
  $('#result').innerHTML=`<p class="eyebrow">PLAN AUTOMATIQUE</p><h2>${name}</h2><p class="summary">${distance} km · ${duration} min · choix calculé à partir du profil et de l’inventaire</p><div class="metrics"><div class="metric"><span>Glucides</span><strong>${carbRate} g/h</strong><small>${totalCarbs} g au total</small></div><div class="metric"><span>Hydratation</span><strong>${water} ml/h</strong><small>${totalWater} ml au total</small></div><div class="metric"><span>Sodium</span><strong>${sodium||'—'}${sodium?' mg/h':''}</strong><small>${sodium?'cible estimée':'optionnel'}</small></div></div>${preRaceHtml(duration,totalCarbs)}<h3>Produits suggérés</h3>${proposalHtml('Option avec mes produits en stock',stock,'stock')}${proposalHtml('Alternative avec les produits prévus d’acheter',planned,'planned')}<h3>Pendant la course</h3><div class="timeline">${timeline.sort((a,b)=>a.t-b.t).map(x=>`<div class="timeline-item"><strong>${fmt(x.t)}</strong><p>${x.text}</p></div>`).join('')}</div><div class="notice"><strong>Périodicité :</strong> glucides selon les horaires affichés ; eau par petites gorgées toutes les 10 à 15 minutes. Teste toujours la stratégie à l’entraînement.</div>`;
  $('#result').classList.remove('hidden');$('#coach-message').textContent=`${profile?.name?profile.name+', ':''}le plan privilégie d’abord les produits en stock, puis affiche séparément une alternative issue de ta liste d’achats.`;
  const h=getHistory();h.unshift({name,distance,duration,product:stock?.fuel?label(stock.fuel):planned?.fuel?label(planned.fuel):'eau seule',carbs:carbRate,date:new Date().toISOString()});save(KEYS.history,h.slice(0,30));$('#result').scrollIntoView({behavior:'smooth'});
};

fillProfile();updateProfileStatus();renderProducts();renderHistory();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
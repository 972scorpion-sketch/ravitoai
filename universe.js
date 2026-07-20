(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const KEYS={profile:'ravitoai-profile-v1',projects:'ravitoai-projects-v1',equipment:'ravitoai-equipment-v1',hydration:'ravitoai-hydration-v1',strava:'ravitoai-strava-v1',stravaActivities:'ravitoai-strava-activities-v1'};
  const STRAVA_HUB='https://divine-grass-d74fravitoai-hub.972-scorpion.workers.dev';

  function resetFormListeners(selector){const old=$(selector);if(!old)return null;const fresh=old.cloneNode(true);old.replaceWith(fresh);return fresh}
  const projectForm=resetFormListeners('#project-form');
  const equipmentForm=resetFormListeners('#equipment-form');
  const hydrationForm=resetFormListeners('#hydration-form');

  function go(tab){document.querySelector(`.tab[data-tab="${tab}"]`)?.click()}
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

  function updateGoalVisibility(){const goal=$('#profile-goal')?.value;$('#target-weight-wrap')?.classList.toggle('hidden',!['loss','gain'].includes(goal))}
  $('#profile-goal')?.addEventListener('change',updateGoalVisibility);

  function hydrateProfile(){
    const p=load(KEYS.profile,{});
    if($('#profile-sex'))$('#profile-sex').value=p.sex||'';
    if($('#profile-height'))$('#profile-height').value=p.height||182;
    if($('#profile-goal'))$('#profile-goal').value=p.goal||'competition';
    if($('#profile-target-weight'))$('#profile-target-weight').value=p.targetWeight||'';
    if($('#profile-vo2')&&p.vo2)$('#profile-vo2').value=p.vo2;
    if($('#profile-vma')&&p.vma)$('#profile-vma').value=p.vma;
    updateGoalVisibility();updateHome();
  }

  $('#profile-form')?.addEventListener('submit',()=>setTimeout(()=>{
    const p=load(KEYS.profile,{});p.sex=$('#profile-sex')?.value||'';p.height=Number($('#profile-height')?.value)||null;p.goal=$('#profile-goal')?.value||'competition';p.targetWeight=['loss','gain'].includes(p.goal)?Number($('#profile-target-weight')?.value)||null:null;save(KEYS.profile,p);updateHome();
  },0));

  const disciplineLabel={route:'Route',trail:'Trail',hyrox:'Hyrox'};
  const disciplineIcon={route:'🛣️',trail:'⛰️',hyrox:'🏋️'};
  function daysUntil(date){const today=new Date();today.setHours(0,0,0,0);const target=new Date(`${date}T00:00:00`);return Math.ceil((target-today)/86400000)}
  function renderProjects(){
    const projects=load(KEYS.projects,[]).filter(p=>p&&p.name).sort((a,b)=>(a.date||'').localeCompare(b.date||''));save(KEYS.projects,projects);
    if($('#project-count'))$('#project-count').textContent=`${projects.length} projet${projects.length>1?'s':''}`;
    if($('#project-list'))$('#project-list').innerHTML=projects.length?projects.map(p=>{const d=daysUntil(p.date),count=d>=0?`J-${d}`:'Terminé';return `<article class="project-item"><div><strong>${disciplineIcon[p.discipline]||'🏁'} ${p.name}</strong><span>${new Date(`${p.date}T00:00:00`).toLocaleDateString('fr-FR')} · ${p.discipline==='hyrox'?'Format Hyrox':`${p.distance||0} km${p.elevation?` · ${p.elevation} m D+`:''}`}</span><div class="project-badges"><span class="mini-tag">${disciplineLabel[p.discipline]}</span><span class="mini-tag">Priorité ${p.priority}</span><span class="mini-tag">${count}</span>${p.time?`<span class="mini-tag">Objectif ${p.time}</span>`:''}</div></div><button class="icon-button" aria-label="Supprimer le projet" data-delete-project="${p.id}" type="button">🗑️</button></article>`}).join(''):'<p class="empty">Aucun projet. Ajoute un semi, un trail ou un Hyrox.</p>';
    $$('[data-delete-project]').forEach(b=>b.onclick=()=>{save(KEYS.projects,projects.filter(p=>p.id!==b.dataset.deleteProject));renderProjects();updateHome()});updateHome();
  }
  projectForm?.addEventListener('submit',e=>{e.preventDefault();const name=$('#project-name').value.trim();if(!name)return;const projects=load(KEYS.projects,[]);projects.push({id:String(Date.now()),name,discipline:$('#project-discipline').value,date:$('#project-date').value,distance:Number($('#project-distance').value)||0,elevation:Number($('#project-elevation').value)||0,time:$('#project-time').value.trim(),priority:$('#project-priority').value});save(KEYS.projects,projects);e.target.reset();$('#project-distance').value=20;$('#project-elevation').value=0;renderProjects()});

  function inferEquipment(type,brand,model){
    const text=`${brand} ${model}`.toLowerCase();
    if(type==='shoe'){
      if(/vaporfly|alphafly|metaspeed sky|endorphin pro|adios pro/.test(text))return{sports:['route'],uses:['Compétition'],icon:'👟',confidence:'Catégorisation automatique'};
      if(/speedcross|genesis|ultra glide|trabuco|mafate|speedgoat|peregrine/.test(text))return{sports:['trail'],uses:['Trail'],icon:'👟',confidence:'Catégorisation automatique'};
      if(/metcon|free metcon|hyrox|deviate nitro elite hyrox/.test(text))return{sports:['hyrox'],uses:['Hyrox'],icon:'👟',confidence:'Catégorisation automatique'};
      return{sports:['route'],uses:['Entraînement quotidien'],icon:'👟',confidence:'À confirmer'};
    }
    if(type==='vest')return{sports:['trail','route'],uses:['Sortie longue'],icon:'🎒',confidence:'Catégorisation automatique'};
    if(type==='belt')return{sports:['route','trail'],uses:['Courte autonomie'],icon:'🎽',confidence:'Catégorisation automatique'};
    return{sports:['route','trail','hyrox'],uses:['Polyvalent'],icon:'🧰',confidence:'À confirmer'};
  }
  function equipmentCard(i){const km=Number(i.km)||0;return `<article class="equipment-item"><div class="equipment-main"><span class="equipment-icon">${i.icon||'🧰'}</span><div><strong>${i.brand} ${i.model}</strong><span class="compatibility">${i.type==='shoe'?`🏃 ${i.sports?.map(s=>disciplineLabel[s]).join(', ')||'Route'} · 📏 ${km} km`:`Compatible : ${i.sports?.map(s=>disciplineLabel[s]).join(', ')||'À définir'}`}</span><div class="equipment-tags">${(i.uses||[]).map(x=>`<span class="mini-tag">${x}</span>`).join('')}</div></div></div><button class="icon-button" aria-label="Supprimer ${i.brand} ${i.model}" data-delete-equipment="${i.id}" type="button">🗑️</button></article>`}
  function renderEquipment(){
    const raw=load(KEYS.equipment,[]),seen=new Set(),items=raw.filter(i=>{if(!i?.brand&&!i?.model)return false;const k=`${i.type}|${i.brand}|${i.model}`.toLowerCase();if(seen.has(k))return false;seen.add(k);return true});save(KEYS.equipment,items);
    const shoes=items.filter(i=>i.type==='shoe'),other=items.filter(i=>i.type!=='shoe');
    if($('#equipment-count'))$('#equipment-count').textContent=`${shoes.length} chaussure${shoes.length>1?'s':''} · ${other.length} autre${other.length>1?'s':''}`;
    if($('#equipment-list'))$('#equipment-list').innerHTML=`<div class="equipment-section"><p class="eyebrow">CHAUSSURES</p>${shoes.length?shoes.map(equipmentCard).join(''):'<p class="empty">Aucune chaussure enregistrée.</p>'}</div><div class="equipment-section"><p class="eyebrow">AUTRES MATÉRIELS</p>${other.length?other.map(equipmentCard).join(''):'<p class="empty">Aucun autre matériel enregistré.</p>'}</div>`;
    $$('[data-delete-equipment]').forEach(b=>b.onclick=()=>{save(KEYS.equipment,items.filter(i=>i.id!==b.dataset.deleteEquipment));renderEquipment()});
  }
  equipmentForm?.addEventListener('submit',e=>{e.preventDefault();const items=load(KEYS.equipment,[]),type=$('#equipment-type').value,brand=$('#equipment-brand').value.trim(),model=$('#equipment-model').value.trim();if(!brand||!model)return;const exists=items.some(i=>i.type===type&&i.brand?.toLowerCase()===brand.toLowerCase()&&i.model?.toLowerCase()===model.toLowerCase());if(exists){alert('Cet équipement est déjà enregistré.');return}items.push({id:String(Date.now()),type,brand,model,km:0,...inferEquipment(type,brand,model)});save(KEYS.equipment,items);e.target.reset();renderEquipment()});

  const hydrationNames={flask:'Flasque',bladder:'Poche d’hydratation',bottle:'Gourde'};
  function migrateHydrationDuplicateBug(){const marker='ravitoai-hydration-double-fixed-v22';if(localStorage.getItem(marker))return;const items=load(KEYS.hydration,[]);if(items.length&&items.every(i=>Number(i.quantity)%2===0)){items.forEach(i=>i.quantity=Math.max(1,Number(i.quantity)/2));save(KEYS.hydration,items)}localStorage.setItem(marker,'1')}
  function renderHydration(){
    const raw=load(KEYS.hydration,[]),map=new Map();raw.forEach(i=>{const k=`${i.type}|${i.capacity}`;if(map.has(k))map.get(k).quantity+=Number(i.quantity)||0;else map.set(k,{...i,quantity:Number(i.quantity)||1})});const items=[...map.values()];save(KEYS.hydration,items);const total=items.reduce((s,i)=>s+i.capacity*i.quantity,0);
    if($('#hydration-total'))$('#hydration-total').textContent=`${total} ml disponibles`;
    if($('#hydration-list'))$('#hydration-list').innerHTML=items.length?items.map(i=>`<article class="equipment-item"><div><strong>💧 ${hydrationNames[i.type]} ${i.capacity} ml</strong><span>Quantité : ${i.quantity} · capacité totale ${i.capacity*i.quantity} ml</span></div><button class="icon-button" aria-label="Supprimer ce contenant" data-delete-hydration="${i.id}" type="button">🗑️</button></article>`).join(''):'<p class="empty">Aucun contenant enregistré.</p>';
    $$('[data-delete-hydration]').forEach(b=>b.onclick=()=>{save(KEYS.hydration,items.filter(i=>i.id!==b.dataset.deleteHydration));renderHydration()});
  }
  hydrationForm?.addEventListener('submit',e=>{e.preventDefault();const items=load(KEYS.hydration,[]),type=$('#hydration-type').value,capacity=Number($('#hydration-capacity').value),quantity=Number($('#hydration-quantity').value);const existing=items.find(i=>i.type===type&&Number(i.capacity)===capacity);if(existing)existing.quantity=Number(existing.quantity)+quantity;else items.push({id:String(Date.now()),type,capacity,quantity});save(KEYS.hydration,items);renderHydration()});

  function normalizeName(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
  function splitShoeName(name){const words=String(name||'').trim().split(/\s+/);return{brand:words.shift()||'Strava',model:words.join(' ')||'Chaussure'}}
  function mergeStravaShoes(stravaShoes){
    const equipment=load(KEYS.equipment,[]);
    stravaShoes.forEach(shoe=>{
      const target=normalizeName(shoe.name);
      let existing=equipment.find(item=>item.type==='shoe'&&(normalizeName(`${item.brand} ${item.model}`)===target||target.includes(normalizeName(`${item.brand} ${item.model}`))||normalizeName(`${item.brand} ${item.model}`).includes(target)));
      if(existing){existing.km=Number(shoe.distanceKm)||0;existing.stravaGearId=shoe.id;existing.stravaSynced=true}
      else{const parts=splitShoeName(shoe.name);equipment.push({id:`strava-${shoe.id}`,type:'shoe',brand:parts.brand,model:parts.model,km:Number(shoe.distanceKm)||0,stravaGearId:shoe.id,stravaSynced:true,...inferEquipment('shoe',parts.brand,parts.model)})}
    });
    save(KEYS.equipment,equipment);renderEquipment();
  }
  function showStravaMessage(html,type='notice'){
    const help=$('#strava-help');if(!help)return;help.classList.remove('hidden');help.className=type;help.innerHTML=html;
  }
  function renderStravaState(state=load(KEYS.strava,{})){
    const status=$('#strava-status'),button=$('#strava-connect');if(!status||!button)return;
    if(state.connected){status.textContent='Connecté';button.textContent='🔄 Synchroniser maintenant';button.dataset.mode='sync';showStravaMessage(`<strong>${state.athleteName||'Compte Strava connecté'}</strong><br>${state.activityCount||0} activités importées · ${state.shoeCount||0} chaussures synchronisées${state.syncedAt?` · dernière synchro ${new Date(state.syncedAt).toLocaleString('fr-FR')}`:''}`,'notice')}
    else{status.textContent='Non connecté';button.textContent='🔗 Connecter Strava';button.dataset.mode='login';showStravaMessage('Connecte ton compte Strava pour synchroniser automatiquement tes activités et le kilométrage de tes chaussures.','notice')}
  }
  async function syncStrava(){
    const button=$('#strava-connect');if(button){button.disabled=true;button.textContent='Synchronisation…'}
    try{
      const response=await fetch(`${STRAVA_HUB}/strava/sync`,{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await response.json();
      if(response.status===401||!data.connected){save(KEYS.strava,{connected:false});renderStravaState();window.location.href=data.loginUrl||`${STRAVA_HUB}/strava/login`;return}
      if(!response.ok||!data.ok)throw new Error(data.error||'Synchronisation Strava impossible.');
      mergeStravaShoes(data.shoes||[]);save(KEYS.stravaActivities,data.activities||[]);
      const athleteName=[data.athlete?.firstname,data.athlete?.lastname].filter(Boolean).join(' ');
      const state={connected:true,athleteName,athleteId:data.athlete?.id||null,activityCount:(data.activities||[]).length,shoeCount:(data.shoes||[]).length,syncedAt:data.syncedAt||new Date().toISOString()};save(KEYS.strava,state);renderStravaState(state);
      const cleanUrl=new URL(window.location.href);cleanUrl.searchParams.delete('strava');history.replaceState({},'',cleanUrl.toString());
    }catch(error){showStravaMessage(`<strong>Erreur Strava.</strong> ${error.message||'Réessaie dans quelques instants.'}`,'notice');renderStravaState(load(KEYS.strava,{}))}
    finally{if(button)button.disabled=false}
  }
  function addStravaCard(){
    const equipmentCardSection=$('#equipment-list')?.closest('.card');if(!equipmentCardSection||$('#strava-connect'))return;
    equipmentCardSection.insertAdjacentHTML('beforebegin',`<section class="card"><div class="section-heading"><div><p class="eyebrow">SYNCHRONISATION</p><h2>Strava</h2><p class="summary">Synchronise automatiquement tes activités, tes chaussures et leurs kilomètres.</p></div><span id="strava-status" class="status-dot">Non connecté</span></div><button id="strava-connect" class="primary" type="button">🔗 Connecter Strava</button><p id="strava-help" class="notice"></p></section>`);
    $('#strava-connect').onclick=()=>{const state=load(KEYS.strava,{});if(state.connected||$('#strava-connect').dataset.mode==='sync')syncStrava();else window.location.href=`${STRAVA_HUB}/strava/login`};
    renderStravaState();
    const callback=new URLSearchParams(window.location.search).get('strava');if(callback==='connected')syncStrava();else if(callback==='refused')showStravaMessage('<strong>Connexion refusée.</strong> Aucune donnée Strava n’a été importée.','notice');
  }

  function updateHome(){const p=load(KEYS.profile,{}),projects=load(KEYS.projects,[]).filter(x=>daysUntil(x.date)>=0).sort((a,b)=>a.date.localeCompare(b.date)),main=projects.find(x=>x.priority==='A')||projects[0];if($('#home-greeting'))$('#home-greeting').textContent=`Bonjour${p.name?` ${p.name}`:''} 👋`;if($('#home-project'))$('#home-project').innerHTML=main?`<strong>${disciplineIcon[main.discipline]} ${main.name} · J-${daysUntil(main.date)}</strong><span>${main.discipline==='hyrox'?'Format Hyrox':`${main.distance} km${main.elevation?` · ${main.elevation} m D+`:''}`} · priorité ${main.priority}</span>`:'<strong>Aucun projet principal</strong><span>Ajoute ta prochaine compétition pour activer le suivi.</span>'}

  $('#strategy-form')?.addEventListener('submit',()=>setTimeout(()=>{const discipline=$('#plan-discipline')?.value||'route',elevation=Number($('#plan-elevation')?.value)||0,hydration=load(KEYS.hydration,[]),equipment=load(KEYS.equipment,[]),compatible=equipment.filter(i=>i.sports?.includes(discipline));const elevationMsg=elevation>=1000?`Effort très vallonné (${elevation} m D+) : la durée réelle et l’autonomie priment sur la distance.`:elevation>=300?`Le dénivelé de ${elevation} m D+ augmente la durée d’effort et les besoins.`:'Parcours peu vallonné.';if($('#discipline-advice'))$('#discipline-advice').innerHTML=`<strong>${disciplineLabel[discipline]} :</strong> ${elevationMsg} ${compatible.length?`${compatible.length} équipement(s) compatible(s) détecté(s).`:'Aucun équipement compatible enregistré.'}`;const totalCapacity=hydration.reduce((s,i)=>s+i.capacity*i.quantity,0),need=window.RAVITO_LAST_PLAN?.totalWater||0;if($('#ravicheck-context'))$('#ravicheck-context').innerHTML=`<strong>Contexte :</strong> ${disciplineLabel[discipline]} · ${elevation} m D+ · besoin estimé ${need} ml. Capacité possédée : ${totalCapacity} ml.`},120));

  migrateHydrationDuplicateBug();hydrateProfile();renderProjects();renderEquipment();renderHydration();addStravaCard();
})();
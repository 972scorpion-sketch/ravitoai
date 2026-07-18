(()=>{
  const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
  const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const KEYS={profile:'ravitoai-profile-v1',projects:'ravitoai-projects-v1',equipment:'ravitoai-equipment-v1',hydration:'ravitoai-hydration-v1'};

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
    updateGoalVisibility();
    updateHome();
  }

  $('#profile-form')?.addEventListener('submit',()=>{
    setTimeout(()=>{
      const p=load(KEYS.profile,{});
      p.sex=$('#profile-sex')?.value||'';
      p.height=Number($('#profile-height')?.value)||null;
      p.goal=$('#profile-goal')?.value||'competition';
      p.targetWeight=['loss','gain'].includes(p.goal)?Number($('#profile-target-weight')?.value)||null:null;
      save(KEYS.profile,p);updateHome();
    },0);
  });

  const disciplineLabel={route:'Route',trail:'Trail',hyrox:'Hyrox'};
  const disciplineIcon={route:'🛣️',trail:'⛰️',hyrox:'🏋️'};
  function daysUntil(date){const today=new Date();today.setHours(0,0,0,0);const target=new Date(`${date}T00:00:00`);return Math.ceil((target-today)/86400000)}
  function renderProjects(){
    const projects=load(KEYS.projects,[]).sort((a,b)=>a.date.localeCompare(b.date));
    if($('#project-count'))$('#project-count').textContent=`${projects.length} projet${projects.length>1?'s':''}`;
    if($('#project-list'))$('#project-list').innerHTML=projects.length?projects.map(p=>{
      const d=daysUntil(p.date),count=d>=0?`J-${d}`:'Terminé';
      return `<article class="project-item"><div><strong>${disciplineIcon[p.discipline]||'🏁'} ${p.name}</strong><span>${new Date(`${p.date}T00:00:00`).toLocaleDateString('fr-FR')} · ${p.distance||0} km${p.elevation?` · ${p.elevation} m D+`:''}</span><div class="project-badges"><span class="mini-tag">${disciplineLabel[p.discipline]}</span><span class="mini-tag">Priorité ${p.priority}</span><span class="mini-tag">${count}</span>${p.time?`<span class="mini-tag">Objectif ${p.time}</span>`:''}</div></div><button data-delete-project="${p.id}" type="button">Supprimer</button></article>`}).join(''):'<p class="empty">Aucun projet. Ajoute un semi, un trail ou un Hyrox.</p>';
    $$('[data-delete-project]').forEach(b=>b.onclick=()=>{save(KEYS.projects,projects.filter(p=>p.id!==b.dataset.deleteProject));renderProjects();updateHome()});
    updateHome();
  }
  $('#project-form')?.addEventListener('submit',e=>{
    e.preventDefault();const projects=load(KEYS.projects,[]);
    projects.push({id:String(Date.now()),name:$('#project-name').value.trim(),discipline:$('#project-discipline').value,date:$('#project-date').value,distance:Number($('#project-distance').value)||0,elevation:Number($('#project-elevation').value)||0,time:$('#project-time').value.trim(),priority:$('#project-priority').value});
    save(KEYS.projects,projects);e.target.reset();$('#project-distance').value=20;$('#project-elevation').value=0;renderProjects();
  });

  function inferEquipment(type,brand,model){
    const text=`${brand} ${model}`.toLowerCase();
    if(type==='shoe'){
      if(/vaporfly|alphafly|metaspeed sky|endorphin pro|adios pro/.test(text))return{sports:['route'],uses:['Compétition','10 km à marathon'],icon:'👟',confidence:'Catégorisation automatique'};
      if(/speedcross|genesis|ultra glide|trabuco|mafate|speedgoat|peregrine/.test(text))return{sports:['trail'],uses:['Sentier','Trail'],icon:'👟',confidence:'Catégorisation automatique'};
      if(/metcon|free metcon|hyrox|deviate nitro elite hyrox/.test(text))return{sports:['hyrox'],uses:['Indoor','Ateliers'],icon:'👟',confidence:'Catégorisation automatique'};
      return{sports:['route'],uses:['Entraînement'],icon:'👟',confidence:'À confirmer'};
    }
    if(type==='vest')return{sports:['trail','route'],uses:['Trail','Sortie longue','Marathon autonome'],icon:'🎒',confidence:'Catégorisation automatique'};
    if(type==='belt')return{sports:['route','trail'],uses:['Courte autonomie'],icon:'🎽',confidence:'Catégorisation automatique'};
    return{sports:['route','trail','hyrox'],uses:['Polyvalent'],icon:'🧰',confidence:'À confirmer'};
  }
  function renderEquipment(){
    const items=load(KEYS.equipment,[]);
    if($('#equipment-count'))$('#equipment-count').textContent=`${items.length} équipement${items.length>1?'s':''}`;
    if($('#equipment-list'))$('#equipment-list').innerHTML=items.length?items.map(i=>`<article class="equipment-item"><div class="equipment-main"><span class="equipment-icon">${i.icon}</span><div><strong>${i.brand} · ${i.model}</strong><span class="compatibility">Compatible : ${i.sports.map(s=>disciplineLabel[s]).join(', ')}</span><div class="equipment-tags">${i.uses.map(x=>`<span class="mini-tag">${x}</span>`).join('')}<span class="mini-tag">${i.confidence}</span></div></div></div><button data-delete-equipment="${i.id}" type="button">Supprimer</button></article>`).join(''):'<p class="empty">Ajoute une chaussure, un gilet ou une ceinture.</p>';
    $$('[data-delete-equipment]').forEach(b=>b.onclick=()=>{save(KEYS.equipment,items.filter(i=>i.id!==b.dataset.deleteEquipment));renderEquipment()});
  }
  $('#equipment-form')?.addEventListener('submit',e=>{
    e.preventDefault();const items=load(KEYS.equipment,[]),type=$('#equipment-type').value,brand=$('#equipment-brand').value.trim(),model=$('#equipment-model').value.trim();
    items.push({id:String(Date.now()),type,brand,model,...inferEquipment(type,brand,model)});save(KEYS.equipment,items);e.target.reset();renderEquipment();
  });

  const hydrationNames={flask:'Flasque',bladder:'Poche d’hydratation',bottle:'Gourde'};
  function renderHydration(){
    const items=load(KEYS.hydration,[]),total=items.reduce((s,i)=>s+i.capacity*i.quantity,0);
    if($('#hydration-total'))$('#hydration-total').textContent=`${total} ml disponibles`;
    if($('#hydration-list'))$('#hydration-list').innerHTML=items.length?items.map(i=>`<article class="equipment-item"><div><strong>💧 ${hydrationNames[i.type]} ${i.capacity} ml</strong><span>Quantité : ${i.quantity} · capacité totale ${i.capacity*i.quantity} ml</span></div><button data-delete-hydration="${i.id}" type="button">Supprimer</button></article>`).join(''):'<p class="empty">Aucun contenant enregistré.</p>';
    $$('[data-delete-hydration]').forEach(b=>b.onclick=()=>{save(KEYS.hydration,items.filter(i=>i.id!==b.dataset.deleteHydration));renderHydration()});
  }
  $('#hydration-form')?.addEventListener('submit',e=>{
    e.preventDefault();const items=load(KEYS.hydration,[]);items.push({id:String(Date.now()),type:$('#hydration-type').value,capacity:Number($('#hydration-capacity').value),quantity:Number($('#hydration-quantity').value)});save(KEYS.hydration,items);renderHydration();
  });

  function updateHome(){
    const p=load(KEYS.profile,{}),projects=load(KEYS.projects,[]).filter(x=>daysUntil(x.date)>=0).sort((a,b)=>a.date.localeCompare(b.date)),main=projects.find(x=>x.priority==='A')||projects[0];
    if($('#home-greeting'))$('#home-greeting').textContent=`Bonjour${p.name?` ${p.name}`:''} 👋`;
    if($('#home-project'))$('#home-project').innerHTML=main?`<strong>${disciplineIcon[main.discipline]} ${main.name} · J-${daysUntil(main.date)}</strong><span>${main.distance} km${main.elevation?` · ${main.elevation} m D+`:''} · priorité ${main.priority}</span>`:'<strong>Aucun projet principal</strong><span>Ajoute ta prochaine compétition pour activer le suivi.</span>';
  }

  $('#strategy-form')?.addEventListener('submit',()=>setTimeout(()=>{
    const discipline=$('#plan-discipline')?.value||'route',elevation=Number($('#plan-elevation')?.value)||0,hydration=load(KEYS.hydration,[]),equipment=load(KEYS.equipment,[]),compatible=equipment.filter(i=>i.sports?.includes(discipline));
    const elevationMsg=elevation>=1000?`Effort très vallonné (${elevation} m D+) : la durée réelle et l’autonomie priment sur la distance.`:elevation>=300?`Le dénivelé de ${elevation} m D+ augmente la durée d’effort et les besoins.`:'Parcours peu vallonné.';
    if($('#discipline-advice'))$('#discipline-advice').innerHTML=`<strong>${disciplineLabel[discipline]} :</strong> ${elevationMsg} ${compatible.length?`${compatible.length} équipement(s) compatible(s) détecté(s).`:'Aucun équipement compatible enregistré.'}`;
    const totalCapacity=hydration.reduce((s,i)=>s+i.capacity*i.quantity,0),need=window.RAVITO_LAST_PLAN?.totalWater||0;
    if($('#ravicheck-context'))$('#ravicheck-context').innerHTML=`<strong>Contexte :</strong> ${disciplineLabel[discipline]} · ${elevation} m D+ · besoin estimé ${need} ml. Capacité possédée : ${totalCapacity} ml.`;
    if(window.RAVITO_LAST_PLAN&&$('#ravicheck-content')){
      setTimeout(()=>{
        const extra=`<div class="check-row"><div><strong>Matériel compatible</strong><span>${disciplineLabel[discipline]}</span></div><div><strong>${compatible.length?'Validé':'À compléter'}</strong><span>${compatible.length?compatible.map(i=>i.model).slice(0,2).join(', '):'Ajoute un équipement adapté'}</span></div></div><div class="check-row"><div><strong>Capacité d’hydratation</strong><span>Besoin ${need} ml</span></div><div><strong>${totalCapacity>=need?'Suffisante':'Insuffisante'}</strong><span>${totalCapacity} ml possédés</span></div></div>`;
        $('#ravicheck-content').insertAdjacentHTML('beforeend',extra);
      },220);
    }
  },120));

  hydrateProfile();renderProjects();renderEquipment();renderHydration();
})();
(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const form=$('#strategy-form');
  if(!form||$('#activity-kind'))return;
  const grid=form.querySelector('.grid');

  grid.insertAdjacentHTML('afterbegin',`
    <label>Type de plan
      <select id="activity-kind">
        <option value="race" selected>Course / compétition</option>
        <option value="training">Entraînement</option>
      </select>
    </label>
    <div id="training-import-action" class="training-import-action hidden">
      <span>Importer une séance existante</span>
      <button id="import-runna" class="secondary" type="button">Importer depuis Runna</button>
    </div>
    <label id="training-type-wrap" class="hidden">Type de séance
      <select id="training-type">
        <option value="easy">Course facile</option>
        <option value="long-easy">Sortie longue facile</option>
        <option value="progressive">Sortie longue progressive</option>
        <option value="tempo">Tempo / seuil</option>
        <option value="interval">Fractionné / VMA</option>
        <option value="racepace">Allure course</option>
        <option value="free">Séance libre</option>
      </select>
    </label>`);

  const importPanel=document.createElement('section');
  importPanel.id='runna-import-panel';
  importPanel.className='suggestion-box hidden';
  importPanel.innerHTML=`
    <strong>Coller le partage Runna</strong>
    <span>Dans Runna, touche Partager puis copie le texte de la séance.</span>
    <textarea id="runna-text" rows="7" placeholder="Colle ici le contenu partagé depuis Runna…"></textarea>
    <div class="product-actions">
      <button id="paste-runna" class="secondary" type="button">Coller</button>
      <button id="parse-runna" class="secondary" type="button">Importer la séance</button>
      <button id="cancel-runna" class="secondary" type="button">Fermer</button>
    </div>
    <span id="runna-status"></span>`;
  grid.insertAdjacentElement('afterend',importPanel);

  const importedCard=document.createElement('section');
  importedCard.id='runna-session-card';
  importedCard.className='suggestion-box hidden';
  importedCard.innerHTML=`
    <div class="section-heading">
      <div><p class="eyebrow">SÉANCE RUNNA IMPORTÉE</p><h3 id="runna-card-name">Séance importée</h3></div>
      <button id="edit-imported-session" class="secondary" type="button">Modifier la séance</button>
    </div>
    <div class="metrics">
      <div class="metric"><span>Distance</span><strong id="runna-card-distance">—</strong></div>
      <div class="metric"><span>Durée estimée</span><strong id="runna-card-duration">—</strong></div>
      <div class="metric"><span>Type</span><strong id="runna-card-type">—</strong></div>
    </div>
    <span id="runna-card-program"></span>`;
  importPanel.insertAdjacentElement('afterend',importedCard);

  const builder=document.createElement('section');
  builder.id='training-builder';
  builder.className='training-builder hidden';
  builder.innerHTML=`
    <div class="section-heading training-heading">
      <div><p class="eyebrow">STRUCTURE DE LA SÉANCE</p><h3>Blocs prévus</h3><p class="summary">La structure importée reste entièrement modifiable.</p></div>
      <button id="add-training-block" class="secondary" type="button">+ Ajouter un bloc</button>
    </div>
    <div id="training-blocks"></div>
    <div id="training-summary" class="suggestion-box"></div>`;
  importedCard.insertAdjacentElement('afterend',builder);

  const kind=$('#activity-kind'),type=$('#training-type'),blocks=$('#training-blocks'),summary=$('#training-summary');
  const labels={easy:'Course facile','long-easy':'Sortie longue facile',progressive:'Sortie longue progressive',tempo:'Tempo / seuil',interval:'Fractionné / VMA',racepace:'Allure course',free:'Séance libre'};
  const presets={
    easy:[['distance',9,'conversationnelle']],
    'long-easy':[['distance',13,'conversationnelle']],
    progressive:[['distance',3,'conversationnelle'],['distance',4,'4:35'],['distance',4,'4:15'],['distance',2,'conversationnelle']],
    tempo:[['time',15,'conversationnelle'],['time',30,'4:20'],['time',10,'conversationnelle']],
    interval:[['time',15,'conversationnelle'],['time',20,'rapide'],['time',15,'conversationnelle']],
    racepace:[['distance',3,'conversationnelle'],['distance',6,'4:25'],['distance',2,'conversationnelle']],
    free:[['distance',5,'conversationnelle']]
  };
  let imported=false;

  const nameLabel=$('#race-name')?.closest('label');
  const distanceLabel=$('#distance')?.closest('label');
  const customDistanceWrap=$('#custom-distance-wrap');
  const timeLabel=$('#hours')?.closest('label');
  const manualSessionFields=[nameLabel,distanceLabel,customDistanceWrap,timeLabel].filter(Boolean);

  function row(mode='distance',amount=1,pace='conversationnelle'){
    const el=document.createElement('div');
    el.className='training-block';
    el.innerHTML=`<select class="block-mode"><option value="distance" ${mode==='distance'?'selected':''}>Distance</option><option value="time" ${mode==='time'?'selected':''}>Durée</option></select><input class="block-amount" type="number" min="0.1" step="0.1" value="${amount}"><span class="block-unit">${mode==='distance'?'km':'min'}</span><input class="block-pace" value="${pace}" placeholder="5:40 ou conversationnelle"><button class="secondary remove-block" type="button">Supprimer</button>`;
    blocks.appendChild(el);
    bindRow(el);
    updateSummary();
  }
  function bindRow(el){
    el.querySelector('.block-mode').onchange=e=>{el.querySelector('.block-unit').textContent=e.target.value==='distance'?'km':'min';updateSummary()};
    el.querySelectorAll('input').forEach(i=>i.oninput=()=>{updateSummary();if(imported)refreshImportedCard()});
    el.querySelector('.remove-block').onclick=()=>{el.remove();updateSummary();if(imported)refreshImportedCard()};
  }
  function loadPreset(){if(imported)return;blocks.innerHTML='';(presets[type.value]||presets.free).forEach(x=>row(...x))}
  function parsePace(v){const m=String(v).match(/(\d+)[\s:'’′h]+(\d{1,2})/);return m?Number(m[1])+Number(m[2])/60:null}
  function readBlocks(){return $$('.training-block').map((el,i)=>({index:i+1,mode:el.querySelector('.block-mode').value,amount:Number(el.querySelector('.block-amount').value)||0,pace:el.querySelector('.block-pace').value.trim()||'libre'})).filter(x=>x.amount>0)}
  function totals(){
    let km=0,min=0,fast=0;
    readBlocks().forEach(b=>{
      let pace=parsePace(b.pace);
      if(!pace&&/conversation|facile/i.test(b.pace))pace=5;
      if(b.mode==='distance'){km+=b.amount;if(pace)min+=b.amount*pace}else{min+=b.amount;if(pace)km+=b.amount/pace}
      if(pace&&pace<5)fast+=b.mode==='time'?b.amount:b.amount*pace;
    });
    return{km,min,fast};
  }
  function updateSummary(){
    const t=totals();
    summary.innerHTML=`<strong>Séance estimée</strong><span>${t.km?t.km.toFixed(1)+' km':''}${t.km&&t.min?' · ':''}${t.min?Math.round(t.min)+' min':''}${t.fast?' · environ '+Math.round(t.fast)+' min soutenues':''}</span>`;
  }
  function detectType(text){
    const s=text.toLowerCase();
    if(/progress|de plus en plus vite/.test(s))return'progressive';
    if(/sortie longue|long run/.test(s))return/ facile|conversation/.test(s)?'long-easy':'progressive';
    if(/fraction|interval|vma|répét/.test(s))return'interval';
    if(/tempo|seuil/.test(s))return'tempo';
    if(/allure (10|semi|marathon|course)/.test(s))return'racepace';
    if(/facile|easy|conversation/.test(s))return'easy';
    return'free';
  }
  function parseRunnaText(text){
    const lines=text.split(/\n+/).map(x=>x.replace(/\u00a0/g,' ').trim()).filter(Boolean);
    const titleIndex=lines.findIndex(line=>/avec Runna/i.test(line));
    const title=titleIndex>=0?lines[titleIndex]:lines[0]||'';
    const program=lines.find(line=>/programme .*(semaine|week)/i.test(line))||'';
    const detailLines=lines.filter((line,index)=>index!==titleIndex&&!/programme .*(semaine|week)/i.test(line));
    const found=[];
    detailLines.forEach(line=>{
      let m=line.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*km\b/i),mode='distance',amount=m?Number(m[1].replace(',','.')):0;
      if(!m){m=line.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:min|minutes?)\b/i);mode='time';amount=m?Number(m[1].replace(',','.')):0}
      if(!amount)return;
      const limitMatch=line.match(/pas plus vite que\s*(\d{1,2})\s*[:'’′]\s*(\d{2})\s*\/\s*km/i);
      const paceMatch=line.match(/(\d{1,2})\s*[:'’′]\s*(\d{2})\s*(?:\/\s*km|par km|km)?/i);
      let pace='';
      if(/conversation|facile|easy|échauff|retour au calme/i.test(line))pace=limitMatch?`conversationnelle · limite ${limitMatch[1]}:${limitMatch[2]}/km`:'conversationnelle';
      else if(paceMatch)pace=`${paceMatch[1]}:${paceMatch[2]}`;
      else if(/rapide|vite|vma|sprint/i.test(line))pace='rapide';
      else pace='libre';
      found.push([mode,amount,pace]);
    });
    if(!found.length&&title){const m=title.match(/(\d+(?:[.,]\d+)?)\s*km\b/i);if(m)found.push(['distance',Number(m[1].replace(',','.')),/facile|easy|conversation/i.test(title)?'conversationnelle':'libre'])}
    return{title:title.replace(/\s*✅.*$/,'').trim(),program,blocks:found};
  }
  function syncGeneralFields(){
    const t=totals();
    if(t.km){
      const distance=$('#distance');
      let option=[...distance.options].find(o=>Math.abs(Number(o.value)-t.km)<0.01);
      if(!option){option=document.createElement('option');option.value=String(t.km);option.textContent=`${t.km.toFixed(t.km%1?1:0)} km`;distance.appendChild(option)}
      distance.value=option.value;
      if(customDistanceWrap)customDistanceWrap.classList.add('hidden');
      if($('#custom-distance'))$('#custom-distance').value=t.km.toFixed(1);
    }
    const duration=Math.max(1,Math.round(t.min));
    $('#hours').value=Math.floor(duration/60);
    $('#minutes').value=duration%60;
  }
  function refreshImportedCard(program=''){
    const t=totals();
    $('#runna-card-name').textContent=$('#race-name').value.trim()||labels[type.value];
    $('#runna-card-distance').textContent=`${t.km.toFixed(1)} km`;
    $('#runna-card-duration').textContent=`${Math.round(t.min)} min`;
    $('#runna-card-type').textContent=labels[type.value];
    if(program)$('#runna-card-program').textContent=program;
    syncGeneralFields();
  }
  function setImportedView(active){
    imported=active;
    importedCard.classList.toggle('hidden',!active);
    manualSessionFields.forEach(el=>el.classList.toggle('hidden',active));
    $('#training-type-wrap').classList.toggle('hidden',active||kind.value!=='training');
  }
  function importSharedContent(){
    const text=$('#runna-text').value.trim(),status=$('#runna-status');
    if(!text){status.textContent='Colle d’abord le contenu partagé depuis Runna.';return}
    const parsed=parseRunnaText(text);
    if(!parsed.blocks.length){status.textContent='Aucun bloc reconnu. Vérifie que le partage contient une distance ou une durée.';return}
    type.value=detectType(text);
    blocks.innerHTML='';
    parsed.blocks.forEach(x=>row(...x));
    if(parsed.title)$('#race-name').value=parsed.title.slice(0,70);
    syncGeneralFields();
    refreshImportedCard(parsed.program);
    setImportedView(true);
    importPanel.classList.add('hidden');
    status.textContent=`${parsed.blocks.length} bloc(s) importé(s).`;
    updateSummary();
  }

  $('#import-runna').onclick=()=>{importPanel.classList.remove('hidden');$('#runna-text').focus()};
  $('#cancel-runna').onclick=()=>importPanel.classList.add('hidden');
  $('#parse-runna').onclick=importSharedContent;
  $('#paste-runna').onclick=async()=>{const status=$('#runna-status');try{$('#runna-text').value=await navigator.clipboard.readText();status.textContent='Contenu collé. Appuie sur Importer la séance.'}catch{status.textContent='Le collage automatique est bloqué : maintiens le doigt dans la zone puis choisis Coller.'}};
  $('#edit-imported-session').onclick=()=>setImportedView(false);

  function toggle(){
    const training=kind.value==='training';
    $('#training-import-action').classList.toggle('hidden',!training);
    builder.classList.toggle('hidden',!training);
    if(!training){importPanel.classList.add('hidden');importedCard.classList.add('hidden')}
    if(!imported)$('#training-type-wrap').classList.toggle('hidden',!training);
    if(nameLabel){nameLabel.childNodes[0].nodeValue=training?'Nom de la séance':'Nom de la course';$('#race-name').placeholder=training?'Course facile de 9 km':'20 km de Paris'}
    const title=$('#calculator .intro-card h2');if(title)title.textContent=training?'Prépare ta prochaine séance':'Prépare ta prochaine course';
    if(training&&!blocks.children.length)loadPreset();
  }
  kind.onchange=toggle;
  type.onchange=()=>{loadPreset();updateSummary()};
  $('#add-training-block').onclick=()=>row();
  toggle();

  form.addEventListener('submit',e=>{
    if(kind.value!=='training')return;
    e.preventDefault();e.stopImmediatePropagation();
    const b=readBlocks(),t=totals(),duration=Math.max(1,Math.round(t.min||Number($('#hours').value)*60+Number($('#minutes').value))),temp=Number($('#temperature').value)||18;
    const profile=JSON.parse(localStorage.getItem('ravitoai-profile-v1')||'{}'),products=JSON.parse(localStorage.getItem('ravitoai-products-v1')||'[]');
    const stock=products.filter(p=>p.status==='stock'&&(p.quantity==null||p.quantity>0)),planned=products.filter(p=>p.status==='planned');
    let carb=0;
    if(type.value==='long-easy')carb=duration>=90?30:duration>=70?20:0;
    if(type.value==='progressive')carb=duration>=70?35:20;
    if(['tempo','racepace'].includes(type.value))carb=duration>=60?30:15;
    if(type.value==='interval')carb=duration>=75?25:0;
    if(type.value==='easy')carb=duration>=90?20:0;
    if(profile.carbMax)carb=Math.min(carb,Number(profile.carbMax));
    let water=(profile.sweat==='low'?300:profile.sweat==='high'?650:475)+(temp>=25?150:0);water=Math.max(250,Math.round(water/25)*25);
    const need=Math.round(carb*duration/60),pick=list=>list.filter(p=>p.type!=='breakfast').sort((a,b)=>Number(b.favorite)-Number(a.favorite))[0],stockPick=pick(stock),planPick=pick(planned),portions=p=>p&&need?Math.max(1,Math.ceil(need/(Number(p.carbs)||25))):0;
    const blockHtml=b.map(x=>`<div class="timeline-item"><strong>Bloc ${x.index}</strong><p>${x.amount} ${x.mode==='distance'?'km':'min'} · ${x.pace}</p></div>`).join('');
    const suggest=(title,p)=>p?`<div class="suggestion-box"><strong>${title}</strong><span>${p.brand} ${p.name} · ${portions(p)||'aucune'} portion(s) nécessaire(s) selon l’objectif de ${need} g.</span></div>`:`<div class="suggestion-box"><strong>${title}</strong><span>Aucun produit correspondant renseigné.</span></div>`;
    let pre='Repas habituel 2 à 3 h avant.';if(['progressive','tempo','interval','racepace'].includes(type.value))pre='Collation glucidique digeste 60 à 120 min avant si le dernier repas est éloigné.';if(type.value==='long-easy')pre='Petit-déjeuner habituel 2 à 3 h avant ; cette séance peut servir à tester la stratégie de course.';
    const during=carb?`Viser environ ${carb} g/h. Première prise vers 30 à 40 min, puis toutes les 30 à 35 min. Boire par petites gorgées toutes les 10 à 15 min.`:'Aucun apport glucidique obligatoire. Eau selon la soif et la météo.';
    $('#result').innerHTML=`<p class="eyebrow">PLAN ENTRAÎNEMENT</p><h2>${$('#race-name').value.trim()||labels[type.value]}</h2><p class="summary">${labels[type.value]} · ${t.km.toFixed(1)} km · ${duration} min</p><div class="metrics"><div class="metric"><span>Glucides</span><strong>${carb?carb+' g/h':'optionnels'}</strong><small>${need} g au total</small></div><div class="metric"><span>Hydratation</span><strong>${water} ml/h</strong><small>${Math.round(water*duration/60/50)*50} ml environ</small></div><div class="metric"><span>Temps soutenu</span><strong>${Math.round(t.fast)} min</strong><small>estimé via les allures</small></div></div><h3>Structure analysée</h3><div class="timeline">${blockHtml}</div><h3>Stratégie</h3><div class="timeline"><div class="timeline-item"><strong>Avant</strong><p>${pre}</p></div><div class="timeline-item"><strong>Pendant</strong><p>${during}</p></div><div class="timeline-item"><strong>Après</strong><p>Dans l’heure : eau, glucides et protéines.</p></div></div>${suggest('Suggestion avec mon stock',stockPick)}${suggest('Suggestion avec mes achats prévus',planPick)}`;
    $('#result').classList.remove('hidden');$('#result').scrollIntoView({behavior:'smooth'});
    window.ravitoAutoPlan={carbRate:carb,waterRate:water,sodiumRate:0,caffeineTotal:0,totalPortions:portions(stockPick),duration};
  },true);
})();
(()=>{
  const $=s=>document.querySelector(s);
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
    <label id="training-type-wrap" class="hidden">Type d’entraînement
      <select id="training-type">
        <option value="easy">Endurance fondamentale / allure confortable</option>
        <option value="long">Sortie longue en endurance</option>
        <option value="tempo">Tempo / seuil / allure soutenue</option>
        <option value="interval">Fractionné / VMA / allure très rapide</option>
        <option value="racepace">Blocs à allure course</option>
      </select>
    </label>
    <label id="intensity-wrap" class="hidden">Intensité globale
      <select id="training-intensity">
        <option value="low">Facile</option>
        <option value="moderate" selected>Modérée</option>
        <option value="high">Élevée</option>
      </select>
    </label>
    <label id="work-duration-wrap" class="hidden">Temps réellement soutenu (min)
      <input id="work-duration" type="number" min="0" max="300" step="5" value="30">
      <small>Exemple : 6 × 5 min = 30 min rapides, même si la séance dure 1 h 15.</small>
    </label>`);

  const kind=$('#activity-kind'), trainingWrap=$('#training-type-wrap'), intensityWrap=$('#intensity-wrap'), workWrap=$('#work-duration-wrap');
  function toggle(){
    const training=kind.value==='training';
    trainingWrap.classList.toggle('hidden',!training);
    intensityWrap.classList.toggle('hidden',!training);
    workWrap.classList.toggle('hidden',!training);
    const nameLabel=$('#race-name')?.closest('label');
    if(nameLabel){nameLabel.firstChild.textContent=training?'Nom de la séance':'Nom de la course';$('#race-name').placeholder=training?'Sortie longue avec 3 × 15 min':'20 km de Paris';}
    const title=document.querySelector('#calculator .intro-card h2');
    if(title)title.textContent=training?'Prépare ta prochaine séance':'Prépare ta prochaine course';
  }
  kind.addEventListener('change',toggle);toggle();

  form.addEventListener('submit',()=>setTimeout(()=>{
    if(kind.value!=='training')return;
    const result=$('#result');if(!result||result.classList.contains('hidden'))return;
    const type=$('#training-type').value,intensity=$('#training-intensity').value,work=Number($('#work-duration').value)||0;
    const duration=Number($('#hours').value)*60+Number($('#minutes').value);
    const labels={easy:'Endurance fondamentale',long:'Sortie longue',tempo:'Tempo / seuil',interval:'Fractionné / VMA',racepace:'Blocs à allure course'};
    let carbTarget=0,pre='Repas habituel 2 à 3 h avant. Aucune surcharge glucidique nécessaire.',during='Eau selon la soif.';
    if(type==='easy'){
      carbTarget=duration<90?0:25;
      during=duration<75?'Eau facultative selon météo et soif.':'Petites gorgées régulières ; glucides optionnels si la séance dépasse 1 h 30.';
    }else if(type==='long'){
      carbTarget=duration<75?20:duration<120?35:50;
      pre='Petit-déjeuner ou collation digeste 2 à 3 h avant. Cette séance peut servir à tester la stratégie de course.';
      during='Commencer les glucides après 25 à 35 min, puis toutes les 25 à 35 min selon le produit.';
    }else if(type==='tempo'||type==='racepace'){
      carbTarget=duration<60?20:duration<100?35:45;
      pre='Collation glucidique légère 60 à 120 min avant si le dernier repas est éloigné.';
      during=duration<60?'Pas de prise obligatoire pendant ; eau en petites gorgées.':'Première prise vers 25 à 30 min, puis toutes les 30 à 35 min.';
    }else{
      carbTarget=duration<75?0:25;
      pre='Collation digeste 60 à 90 min avant. Évite un gel juste avant si les répétitions sont très courtes et la séance dure moins d’une heure.';
      during=duration<75?'Eau entre les répétitions ; pas de gel obligatoire.':'Un apport de 20 à 25 g peut être utile après l’échauffement ou à mi-séance.';
    }
    if(intensity==='high'&&duration>=75)carbTarget+=10;
    const effortNote=type==='interval'&&work?`La séance comporte environ ${work} min réellement rapides : la stratégie dépend surtout de la durée totale, mais la digestion peut être plus difficile pendant les fractions.`:'';
    const block=document.createElement('section');block.className='training-advice';block.innerHTML=`
      <p class="eyebrow">MODE ENTRAÎNEMENT</p>
      <h3>${labels[type]} · intensité ${intensity==='low'?'facile':intensity==='high'?'élevée':'modérée'}</h3>
      <div class="check-row"><div><strong>Objectif glucidique indicatif</strong><span>Adapté à la séance, pas à une compétition</span></div><div><strong>${carbTarget?carbTarget+' g/h':'aucun apport obligatoire'}</strong><span>${duration} min au total</span></div></div>
      <div class="timeline"><div class="timeline-item"><strong>Avant</strong><p>${pre}</p></div><div class="timeline-item"><strong>Pendant</strong><p>${during}</p></div><div class="timeline-item"><strong>Après</strong><p>Dans l’heure suivante : eau, repas ou collation contenant glucides et protéines, surtout après tempo, fractionné ou sortie longue.</p></div></div>
      ${effortNote?`<div class="notice">${effortNote}</div>`:''}`;
    result.prepend(block);
    const heading=result.querySelector('h2');if(heading&&!heading.textContent.includes('Entraînement'))heading.insertAdjacentText('beforebegin','');
  },180));
})();
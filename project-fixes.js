(()=>{
  const KEY='ravitoai-projects-v1';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return[]}};
  const write=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const form=$('#project-form');
  if(!form)return;

  // Nettoie automatiquement les anciennes courses fantômes incomplètes.
  const cleaned=read().filter(p=>p&&String(p.name||'').trim()&&p.date&&Number(p.distance)>0);
  if(cleaned.length!==read().length)write(cleaned);

  // Remplace le formulaire afin de supprimer les anciens gestionnaires submit en double.
  const clone=form.cloneNode(true);
  form.replaceWith(clone);
  const projectForm=$('#project-form');
  const discipline=$('#project-discipline');
  const distance=$('#project-distance');
  const elevation=$('#project-elevation');
  const time=$('#project-time');
  const distanceLabel=distance?.closest('label');
  const elevationLabel=elevation?.closest('label');

  const defaults={route:10,trail:20,hyrox:8};
  function updateDisciplineFields(resetDistance=true){
    const value=discipline.value;
    if(resetDistance||!Number(distance.value))distance.value=defaults[value];
    const hyrox=value==='hyrox';
    distanceLabel?.classList.toggle('hidden',hyrox);
    elevationLabel?.classList.toggle('hidden',hyrox);
    if(hyrox){distance.value=8;elevation.value=0;time.placeholder='Ex. 1 h 20';}
    else time.placeholder=value==='trail'?'Ex. 2 h 30':'Ex. 40 min ou 1 h 25';
  }
  discipline.addEventListener('change',()=>updateDisciplineFields(true));
  updateDisciplineFields(false);

  // Aide contextuelle sur les priorités.
  const priority=$('#project-priority');
  const priorityLabel=priority?.closest('label');
  if(priorityLabel&&!$('#priority-info')){
    const info=document.createElement('button');
    info.type='button';info.id='priority-info';info.className='priority-info';info.setAttribute('aria-label','Explication des priorités');info.textContent='ⓘ';
    const help=document.createElement('div');
    help.id='priority-help';help.className='priority-help hidden';
    help.innerHTML='<strong>Priorités des compétitions</strong><span><b>A — objectif principal :</b> course sur laquelle la préparation et la stratégie sont optimisées.</span><span><b>B — importante :</b> course courue sérieusement, sans compromettre l’objectif A.</span><span><b>C — préparation :</b> course-test ou entraînement en conditions réelles.</span>';
    priorityLabel.insertBefore(info,priority);
    priorityLabel.appendChild(help);
    info.addEventListener('click',()=>help.classList.toggle('hidden'));
  }

  projectForm.addEventListener('submit',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=$('#project-name').value.trim();
    const date=$('#project-date').value;
    const type=discipline.value;
    const dist=type==='hyrox'?8:Number(distance.value);
    if(!name||!date||!dist){projectForm.reportValidity();return;}
    const projects=read();
    projects.push({id:`project-${Date.now()}`,name,discipline:type,date,distance:dist,elevation:type==='hyrox'?0:(Number(elevation.value)||0),time:time.value.trim(),priority:priority.value});
    write(projects);
    projectForm.reset();
    discipline.value='route';distance.value=defaults.route;elevation.value=0;updateDisciplineFields(false);
    location.reload();
  },true);

  const style=document.createElement('style');
  style.textContent='.priority-info{display:inline-grid;place-items:center;width:28px;height:28px;margin:0 0 2px 8px;border:0;border-radius:50%;background:rgba(148,163,184,.18);color:var(--text);font-weight:900;cursor:pointer}.priority-help{gap:8px;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:var(--soft);color:var(--muted);font-size:.84rem;line-height:1.4}.priority-help strong{color:var(--accent-dark)}.priority-help span{display:block}.priority-help b{color:var(--text)}';
  document.head.appendChild(style);
})();
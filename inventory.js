(() => {
  const key='ravitoai-products-v1', profileKey='ravitoai-profile-v1';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const labels={drink:'Boisson',gel:'Gel',compote:'Compote',solid:'Barres et gommes',breakfast:'Avant-course'};
  const icons={drink:'🥤',gel:'⚡',compote:'🍎',solid:'🍫',breakfast:'🥣'};
  let products=read(key,[]).map(p=>({...p,status:p.status||'none',quantity:Number(p.quantity)||0}));

  function save(){write(key,products)}
  function selected(){return products.filter(p=>p.status==='stock'||p.status==='planned')}
  function syncSelect(){
    const usable=products.filter(p=>p.status==='stock');
    const fallback=products.filter(p=>p.status==='planned');
    const source=usable.length?usable:fallback;
    const select=$('#product'); if(!select)return;
    const previous=select.value;
    select.innerHTML=source.sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.brand.localeCompare(b.brand)).map(p=>`<option value="${p.id}">${p.brand} ${p.name} · ${p.carbs||0} g · ${p.status==='stock'?'en stock':'à acheter'}</option>`).join('');
    if(source.some(p=>p.id===previous))select.value=previous;
  }
  function productVisual(p){return `<div class="ravito-product-visual"><span>${icons[p.type]||'📦'}</span><small>${(p.brand||'').slice(0,12)}</small></div>`}
  function card(p){
    const stock=p.status==='stock', qty=p.quantity||0;
    return `<article class="ravito-tile ${stock&&qty<=1?'low-stock':''}">
      <button class="ravito-remove" data-remove="${p.id}" type="button" aria-label="Retirer">×</button>
      ${productVisual(p)}
      <strong>${p.name}</strong><span>${p.brand}</span>
      <div class="ravito-state">${stock?`<b>${qty}</b><small>${qty<=1?'Stock bas':'En stock'}</small>`:'<b>🛒</b><small>À acheter</small>'}</div>
      ${stock?`<div class="ravito-qty"><button data-minus="${p.id}" type="button">−</button><button data-plus="${p.id}" type="button">+</button></div>`:''}
    </article>`;
  }
  function addTile(type){return `<button class="ravito-add-tile" data-open-catalog="${type}" type="button"><span>+</span><strong>Ajouter</strong></button>`}
  function renderPersonal(){
    products=read(key,[]).map(p=>({...p,status:p.status||'none',quantity:Number(p.quantity)||0}));
    const root=$('#product-list'); if(!root)return;
    const mine=selected();
    const types=['drink','gel','compote','solid','breakfast'].filter(t=>mine.some(p=>p.type===t)||['drink','gel','compote'].includes(t));
    root.className='ravito-shelves';
    root.innerHTML=types.map(type=>{
      const items=mine.filter(p=>p.type===type);
      return `<section class="ravito-shelf"><div class="ravito-shelf-title"><span>${labels[type]}</span><small>${items.filter(p=>p.status==='stock').length} en stock · ${items.filter(p=>p.status==='planned').length} à acheter</small></div><div class="ravito-grid">${items.map(card).join('')}${addTile(type)}</div></section>`;
    }).join('');
    const count=$('#product-count'); if(count)count.textContent=`${products.filter(p=>p.status==='stock').length} en stock · ${products.filter(p=>p.status==='planned').length} à acheter`;
    bindPersonal(); syncSelect(); suggestion();
  }
  function bindPersonal(){
    $$('[data-plus]').forEach(b=>b.onclick=()=>changeQty(b.dataset.plus,1));
    $$('[data-minus]').forEach(b=>b.onclick=()=>changeQty(b.dataset.minus,-1));
    $$('[data-remove]').forEach(b=>b.onclick=()=>{products=products.map(p=>p.id===b.dataset.remove?{...p,status:'none',quantity:0}:p);save();renderPersonal()});
    $$('[data-open-catalog]').forEach(b=>b.onclick=()=>openCatalog(b.dataset.openCatalog));
  }
  function changeQty(id,delta){products=products.map(p=>p.id===id?{...p,quantity:Math.max(0,(Number(p.quantity)||0)+delta)}:p);save();renderPersonal()}
  function suggestion(){
    const box=$('#inventory-suggestion'); if(!box)return;
    const profile=read(profileKey,null), stock=products.filter(p=>p.status==='stock'&&(p.quantity||0)>0);
    if(!stock.length){box.innerHTML='<strong>Mon ravito</strong><span>Ajoute tes produits puis indique les quantités disponibles. Le plan utilisera d’abord le stock, puis les produits à acheter.</span>';return}
    const p=stock.find(x=>profile?.digestion==='sensitive'?['gel','compote','drink'].includes(x.type):true)||stock[0];
    box.innerHTML=`<strong>Prêt pour le calcul</strong><span>${stock.length} produit(s) disponibles. RavitoAI peut notamment utiliser ${p.brand} ${p.name}.</span>`;
  }
  function ensureModal(){
    if($('#ravito-catalog-modal'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="ravito-catalog-modal" class="ravito-modal hidden"><div class="ravito-modal-card"><div class="ravito-modal-head"><div><p class="eyebrow">CATALOGUE FRANCE</p><h2>Ajouter un produit</h2></div><button id="close-ravito-catalog" type="button">×</button></div><input id="ravito-catalog-search" type="search" placeholder="Rechercher une marque ou un produit…"><div id="ravito-catalog-types" class="ravito-type-chips"></div><div id="ravito-catalog-list" class="ravito-catalog-list"></div></div></div>`);
    $('#close-ravito-catalog').onclick=closeCatalog;
    $('#ravito-catalog-modal').onclick=e=>{if(e.target.id==='ravito-catalog-modal')closeCatalog()};
    $('#ravito-catalog-search').oninput=renderCatalog;
  }
  let catalogType='all';
  function openCatalog(type='all'){ensureModal();catalogType=type;$('#ravito-catalog-search').value='';$('#ravito-catalog-modal').classList.remove('hidden');renderCatalog()}
  function closeCatalog(){$('#ravito-catalog-modal')?.classList.add('hidden')}
  function renderCatalog(){
    ensureModal(); const q=($('#ravito-catalog-search').value||'').toLowerCase();
    $('#ravito-catalog-types').innerHTML=['all','drink','gel','compote','solid','breakfast'].map(t=>`<button class="${catalogType===t?'active':''}" data-cat-type="${t}" type="button">${t==='all'?'Tous':labels[t]}</button>`).join('');
    $$('[data-cat-type]').forEach(b=>b.onclick=()=>{catalogType=b.dataset.catType;renderCatalog()});
    const list=products.filter(p=>(catalogType==='all'||p.type===catalogType)&&`${p.brand} ${p.name}`.toLowerCase().includes(q));
    $('#ravito-catalog-list').innerHTML=list.map(p=>`<article class="catalog-row">${productVisual(p)}<div><strong>${p.name}</strong><span>${p.brand} · ${p.carbs||0} g glucides</span></div><div class="catalog-actions"><button data-add-stock="${p.id}" type="button">En stock</button><button data-add-planned="${p.id}" type="button">À acheter</button></div></article>`).join('')||'<p class="empty">Aucun produit trouvé.</p>';
    $$('[data-add-stock]').forEach(b=>b.onclick=()=>setStatus(b.dataset.addStock,'stock'));
    $$('[data-add-planned]').forEach(b=>b.onclick=()=>setStatus(b.dataset.addPlanned,'planned'));
  }
  function setStatus(id,status){products=products.map(p=>p.id===id?{...p,status,quantity:status==='stock'?Math.max(1,Number(p.quantity)||0):0}:p);save();renderCatalog();renderPersonal()}
  function installLayout(){
    const filters=$('.inventory-filters'); if(filters)filters.classList.add('hidden');
    const form=$('#product-form'); if(form){form.closest('section')?.classList.add('ravito-inventory-card');form.classList.add('hidden')}
    const separator=form?.previousElementSibling;if(separator?.classList.contains('separator'))separator.classList.add('hidden');
    const missingTitle=form?.previousElementSibling;if(missingTitle?.classList.contains('eyebrow'))missingTitle.classList.add('hidden');
    const heading=$('#product-list')?.closest('.card')?.querySelector('.section-heading');
    if(heading&&!$('#open-france-catalog'))heading.insertAdjacentHTML('beforeend','<button id="open-france-catalog" class="primary compact-primary" type="button">+ Ajouter</button>');
    $('#open-france-catalog')?.addEventListener('click',()=>openCatalog('all'));
  }
  function installStyles(){
    if($('#ravito-inventory-styles'))return;
    const style=document.createElement('style');style.id='ravito-inventory-styles';style.textContent=`
      .ravito-shelves{display:grid;gap:22px;margin-top:18px}.ravito-shelf{padding:18px;border:1px solid var(--line);border-radius:22px;background:rgba(255,255,255,.42)}body.dark .ravito-shelf{background:rgba(15,23,42,.42)}.ravito-shelf-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px}.ravito-shelf-title>span{padding:9px 13px;border-radius:11px;background:var(--accent);color:#fff;font-weight:900}.ravito-shelf-title small{color:var(--muted);font-weight:800}.ravito-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.ravito-tile,.ravito-add-tile{position:relative;min-height:220px;padding:15px;border:1px solid var(--line);border-radius:28px;background:var(--card);text-align:left;box-shadow:0 10px 25px rgba(15,23,42,.07)}.ravito-tile{display:flex;flex-direction:column}.ravito-tile>strong{margin-top:10px;font-size:.95rem}.ravito-tile>span{color:var(--muted);font-size:.83rem}.ravito-product-visual{height:80px;display:grid;place-items:center;border-radius:18px;background:var(--soft)}.ravito-product-visual>span{font-size:2rem}.ravito-product-visual>small{color:var(--muted);font-weight:800}.ravito-remove{position:absolute;right:8px;top:8px;width:31px;height:31px;border:0;border-radius:50%;background:#ef4444;color:#fff;font-size:1.35rem;z-index:2}.ravito-state{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px}.ravito-state b{font-size:1.15rem;color:var(--accent)}.ravito-state small{color:var(--muted);font-weight:800}.low-stock{border-color:#f59e0b}.low-stock .ravito-state small{color:#d97706}.ravito-qty{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.ravito-qty button{height:38px;border:0;border-radius:50px;font-size:1.35rem;font-weight:900}.ravito-qty button:first-child{background:#d1d5db;color:#fff}.ravito-qty button:last-child{background:var(--accent);color:#fff}.ravito-add-tile{display:grid;place-items:center;align-content:center;gap:8px;border:2px dashed var(--line);color:var(--accent);text-align:center}.ravito-add-tile span{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--accent);color:white;font-size:2rem}.ravito-modal{position:fixed;inset:0;z-index:9999;padding:20px;background:rgba(2,6,23,.55);display:grid;place-items:center}.ravito-modal-card{width:min(760px,100%);max-height:88vh;overflow:auto;padding:20px;border-radius:24px;background:var(--card);border:1px solid var(--line)}.ravito-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.ravito-modal-head h2{margin:0}.ravito-modal-head>button{width:42px;height:42px;border:0;border-radius:14px;background:rgba(148,163,184,.18);color:var(--text);font-size:1.5rem}.ravito-type-chips{display:flex;gap:8px;overflow:auto;margin:12px 0}.ravito-type-chips button{border:0;border-radius:999px;padding:9px 12px;background:rgba(148,163,184,.16);color:var(--text);white-space:nowrap;font-weight:800}.ravito-type-chips button.active{background:var(--accent);color:#fff}.ravito-catalog-list{display:grid;gap:10px}.catalog-row{display:grid;grid-template-columns:80px 1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:18px}.catalog-row .ravito-product-visual{height:70px}.catalog-row strong,.catalog-row span{display:block}.catalog-row span{color:var(--muted);font-size:.85rem}.catalog-actions{display:grid;gap:7px}.catalog-actions button{border:0;border-radius:11px;padding:9px 10px;background:var(--soft);color:var(--accent-dark);font-weight:900}.catalog-actions button:last-child{background:rgba(245,158,11,.14);color:#b45309}@media(max-width:720px){.ravito-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ravito-tile,.ravito-add-tile{min-height:205px}.ravito-shelf-title{align-items:flex-start;flex-direction:column}.catalog-row{grid-template-columns:62px 1fr}.catalog-actions{grid-column:1/-1;grid-template-columns:1fr 1fr}.ravito-modal{padding:8px}.ravito-modal-card{padding:15px;max-height:95vh}}`;
    document.head.appendChild(style);
  }
  installStyles();installLayout();ensureModal();renderPersonal();
})();
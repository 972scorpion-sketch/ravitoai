(() => {
  const key='ravitoai-products-v1';
  const catalogue=[
    ['ta-gel','Tä Energy','Energy Gel','gel',25,100,0],['ta-gel-caf','Tä Energy','Energy Gel Caféiné','gel',25,100,50],['ta-gummies','Tä Energy','Energy Gummies','solid',30,50,0],['ta-gummies-caf','Tä Energy','Energy Gummies Caféinées','solid',30,50,50],['ta-drink','Tä Energy','Energy Drink Mix','drink',30,250,0],['ta-hydration','Tä Energy','Hydration Drink Mix','drink',15,350,0],['ta-bar','Tä Energy','Energy Bar','solid',30,100,0],
    ['maurten-g100','Maurten','Gel 100','gel',25,34,0],['maurten-caf100','Maurten','Gel 100 CAF 100','gel',25,34,100],['maurten-solid160','Maurten','Solid 160','solid',40,400,0],['maurten-drink160','Maurten','Drink Mix 160','drink',40,400,0],['maurten-drink320','Maurten','Drink Mix 320','drink',80,500,0],
    ['over-energix','Overstim’s','Gel Énergix','gel',24,50,0],['over-hydrixir','Overstim’s','Hydrixir','drink',30,250,0],['over-ultra','Overstim’s','Hydrixir Ultra Longue Distance','drink',40,350,0],['over-fruit','Overstim’s','Pâte de fruits énergétique','solid',22,40,0],
    ['naak-gel','Näak','Ultra Energy Gel','gel',23,200,0],['naak-waffle','Näak','Ultra Energy Waffle','solid',21,150,0],['naak-drink','Näak','Ultra Energy Drink Mix','drink',50,400,0],
    ['baouw-puree','Baouw','Purée énergétique','compote',20,50,0],['baouw-gel','Baouw','Gel énergétique','gel',20,100,0],['baouw-bar','Baouw','Barre énergétique bio','solid',20,100,0],
    ['aptonia-gel','Aptonia','Gel Energy','gel',22,50,0],['aptonia-drink','Aptonia','Boisson isotonique','drink',30,300,0],['aptonia-chews','Aptonia','Gommes énergétiques','solid',30,50,0],
    ['powerbar-gel','PowerBar','PowerGel Original','gel',27,200,0],['powerbar-chews','PowerBar','PowerGel Shots','solid',45,200,0],['powerbar-drink','PowerBar','Isoactive','drink',29,250,0],
    ['sis-gel','Science in Sport','GO Isotonic Energy Gel','gel',22,10,0],['sis-caf','Science in Sport','GO Energy + Caffeine Gel','gel',22,10,75],['sis-drink','Science in Sport','GO Electrolyte Powder','drink',36,300,0],
    ['gu-gel','GU','Energy Gel','gel',23,55,0],['gu-roctane','GU','Roctane Energy Gel','gel',21,125,35],['clif-bloks','Clif','Bloks Energy Chews','solid',48,140,0],
    ['pompot-sport','Pom’Potes Sport','Compote Endurance','compote',20,0,0],['meltonic-gel','Meltonic','Gel énergétique au miel','gel',23,50,0],['meltonic-bar','Meltonic','Barre énergétique','solid',25,80,0],
    ['precision-gel30','Precision Fuel & Hydration','PF 30 Gel','gel',30,0,0],['precision-gel90','Precision Fuel & Hydration','PF 90 Flow Gel','gel',90,0,0],['precision-drink','Precision Fuel & Hydration','PH 1000 Electrolyte Drink','drink',0,1000,0]
  ].map(([id,brand,name,type,carbs,sodium,caffeine])=>({id,brand,name,type,carbs,sodium,caffeine,favorite:false,status:'none'}));
  let current=[];try{current=JSON.parse(localStorage.getItem(key))||[]}catch{}
  const byId=new Map(current.map(p=>[p.id,p]));
  catalogue.forEach(p=>{if(!byId.has(p.id))current.push(p)});
  current=current.map(p=>({...p,status:p.status||'none'}));
  localStorage.setItem(key,JSON.stringify(current));
})();
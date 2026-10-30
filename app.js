'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const aliases = window.INGREDIENT_ALIASES || {};
  const key = value => aliases[normalize(value)] || normalize(value);
  const gearAliases = {
    'bol':'bowl','bol grande':'bowl','tazon':'bowl','tazon grande':'bowl','bowl grande':'bowl','recipiente':'bowl',
    'olla grande':'caldero','olla':'caldero','cacerola':'caldero','cacerola grande':'caldero','caldero con tapa':'caldero','olla grande con tapa':'caldero',
    'sarten profunda':'sartén','sarten antiadherente':'sartén','sarten grande':'sartén','sarten':'sartén',
    'procesador de alimentos':'procesador','batidora de vaso':'licuadora','batidora de mano':'batidora eléctrica',
    'balanza':'báscula','balanza de cocina':'báscula','bascula':'báscula',
    'tazas medidoras':'medidores','cucharas medidoras':'medidores','tazas y cucharas medidoras':'medidores',
    'tabla':'tabla de cortar','tabla de corte':'tabla de cortar','cuchara de madera':'cuchara',
    'wog':'wok','vaporera':'vaporera','freidora de aire':'freidora de aire','colador fino':'colador',
    'bandeja para horno':'bandeja de horno','bandeja para hornear':'bandeja de horno',
    'espatula de silicona':'espátula','batidor de mano':'batidor manual','batidor de varillas':'batidor manual',
    'nevera':'refrigerador','refrigeradora':'refrigerador','refrigerador':'refrigerador'
  };
  const gearName = value => gearAliases[normalize(value)] || value.toLocaleLowerCase('es');
  const gearKey = value => normalize(gearName(value));
  const recipes = window.RECIPES || [];
  const pinterestBoard = window.PINTEREST_BOARD || {pins:[]};
  const byId = new Map(recipes.map(r => [r.id, r]));
  const yieldText = r => r.yieldLabel || `${r.servings} raciones`;
  const categories = ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Postre'];
  const icons = {'Todas':'✦','Desayuno':'☀','Almuerzo':'◒','Cena':'☾','Snack':'◈','Postre':'♡'};
  const initialGear = ['estufa','horno','microondas','licuadora','procesador','freidora de aire','olla de presión','báscula','vaporera','caldero','sartén','wok','grill','medidores'];
  const ingredientIndex = new Map();
  const equipmentIndex = new Map();
  recipes.forEach(r => {
    r.ingredients.forEach(i => {
      const k = key(i.name);
      if (!ingredientIndex.has(k)) ingredientIndex.set(k, {name: i.name, ids: new Set(), extra: false});
      ingredientIndex.get(k).ids.add(r.id);
    });
    r.equipment.forEach(e => equipmentIndex.set(gearKey(e), gearName(e)));
  });
  initialGear.forEach(e => equipmentIndex.set(gearKey(e), gearName(e)));
  (window.PANTRY_ADDITIONS || []).forEach(entry => {
    const name = typeof entry === 'string' ? entry : entry.name;
    const k = key(name);
    if (!ingredientIndex.has(k)) ingredientIndex.set(k, {name, ids: new Set(), extra:true});
  });
  const STORAGE = 'verde-a-mano-v1';
  const suggestedSpecial = ['levadura nutricional','tahini','sal negra kala namak','tofu firme','tofu extrafirme','queso parmesano vegano','salchicha vegana','crema batida vegana','dátil Medjool sin semilla','arándano azul congelado','arándano azul fresco','sirope de maple','pasta de curry verde vegana','humo líquido','extracto de limón','nuez de macadamia','mantequilla de almendra'];
  const defaultHard = () => Object.fromEntries(suggestedSpecial.map(n=>[key(n),true]));
  const emptyState = () => ({version:1,pantry:{},hard:defaultHard(),equipment:Object.fromEntries(initialGear.map(e=>[gearKey(e),true])),favorites:[],shopping:[],completed:{}});
  let state = emptyState();
  let storageAvailable = true;
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) state = validateBackup(JSON.parse(saved));
  } catch (error) {
    storageAvailable = false;
  }
  (window.PANTRY_ADDITIONS || []).forEach(entry => {
    if (typeof entry === 'object' && typeof entry.available === 'boolean' && !(key(entry.name) in state.pantry)) state.pantry[key(entry.name)] = entry.available;
  });
  let view = 'recetario';
  let activeRecipe = null;
  let cooking = false;
  let cookStep = 0;
  let toastTimer;
  let inventoryFilter = 'all';
  let inventoryQuery = '';
  let equipmentQuery = '';
  let includeOptional = false;
  let boardQuery = '';
  let boardKind = 'all';
  const filters = {query:'',category:'Todas',collection:'all',favorites:false,time:'all',availability:'all',freezer:false,equipment:false,sort:'default',missing:0};
  const main = $('#main');
  const recipeDialog = $('#recipe-dialog');
  const displayName = k => ingredientIndex.get(k)?.name || k;
  const owned = name => state.pantry[key(name)] === true;
  const required = r => [...new Map(r.ingredients.filter(i=>!i.optional).map(i=>[key(i.name),i])).values()];
  const missing = r => required(r).filter(i=>!owned(i.name));
  const hardIngredients = r => required(r).filter(i=>state.hard[key(i.name)]);
  const gearMissing = r => [...new Set(r.equipment.map(gearKey))].filter(k=>!state.equipment[k]);
  const favorite = id => state.favorites.includes(id);
  const inShopping = id => state.shopping.includes(id);
  const sortedIngredients = () => [...ingredientIndex.entries()].sort((a,b)=>a[1].name.localeCompare(b[1].name,'es'));

  function validateBackup(raw) {
    if (!raw || raw.version !== 1 || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Formato de copia no reconocido.');
    const booleanMap = value => {
      if (!value || Array.isArray(value) || typeof value!=='object' || Object.keys(value).length>3000) throw new Error('La copia contiene una lista inválida.');
      return Object.fromEntries(Object.entries(value).filter(([k,v])=>k.length<150 && typeof v==='boolean'));
    };
    const ids = value => {
      if (!Array.isArray(value) || value.length>3000 || value.some(id=>typeof id!=='string')) throw new Error('La copia contiene recetas inválidas.');
      return [...new Set(value)].filter(id=>byId.has(id));
    };
    const completed = {};
    if (raw.completed && typeof raw.completed==='object' && !Array.isArray(raw.completed)) {
      Object.entries(raw.completed).forEach(([id,list]) => {
        if (byId.has(id) && Array.isArray(list)) completed[id] = [...new Set(list)].filter(n=>Number.isInteger(n)&&n>=0&&n<byId.get(id).steps.length);
      });
    }
    return {version:1,pantry:booleanMap(raw.pantry),hard:raw.hard?booleanMap(raw.hard):defaultHard(),equipment:booleanMap(raw.equipment),favorites:ids(raw.favorites),shopping:ids(raw.shopping),completed};
  }
  function save() {
    try {localStorage.setItem(STORAGE,JSON.stringify(state));storageAvailable=true;}
    catch {storageAvailable=false;toast('No se pudo guardar en el navegador. Descarga una copia de seguridad.');}
    updateCounts();
  }
  function toast(message) {
    clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');
    toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);
  }
  function updateCounts() {
    $('#catalog-count').textContent=recipes.length;
    $('#board-count').textContent=pinterestBoard.pins.length || '';
    $('#pantry-count').textContent=[...ingredientIndex.keys()].filter(k=>state.pantry[k]).length;
    $('#shopping-count').textContent=state.shopping.length || '';
    if ($('#stat-ready')) $('#stat-ready').textContent=recipes.filter(r=>missing(r).length===0).length;
    if ($('#stat-favorites')) $('#stat-favorites').textContent=state.favorites.length;
  }
  function intro(eyebrow,title,description) {
    return `<div class="page-intro"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>`;
  }
  function go() {
    const next=location.hash.slice(1);
    view=['recetario','pinterest','cocinar','despensa','utensilios','compras'].includes(next)?next:'recetario';
    const names={recetario:'Recetario',pinterest:'Mi tablero',cocinar:'Qué puedo cocinar',despensa:'Mi despensa',utensilios:'Mis utensilios',compras:'Lista de compras'};
    $$('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===view);if(a.dataset.nav===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('#breadcrumb').textContent=`Mi cocina / ${names[view]}`;
    document.title=`${names[view]} · Verde a mano`;
    if (view==='recetario'||view==='cocinar') renderCatalog();
    else if (view==='pinterest') renderBoard();
    else if (view==='despensa') renderPantry();
    else if (view==='utensilios') renderEquipment();
    else renderShopping();
    updateCounts();
    window.scrollTo(0,0);
  }
  function renderCatalog() {
    const canCook=view==='cocinar';
    const ready=recipes.filter(r=>missing(r).length===0).length;
    main.innerHTML=(canCook ? intro('DE TU DESPENSA A TU PLATO','¿Qué cocinamos hoy?','Elige cuántos ingredientes pueden faltarte. Aquí aparecen las recetas que encajan con tu despensa; el recetario completo sigue disponible en su propia pestaña.')+
      `<div class="notice"><span>Tu despensa tiene <strong>${[...ingredientIndex.keys()].filter(k=>state.pantry[k]).length} ingredientes</strong> marcados. Se cuentan los ingredientes necesarios; los opcionales no excluyen recetas.</span><a href="#despensa">Actualizar despensa ↗</a></div>` :
      `<section class="hero"><div><span class="eyebrow">TU RECETARIO PERSONAL · 100% VEGANO</span><h1>Algo rico.<br>Algo <em>hecho por ti.</em></h1><p>Recetas para todos tus días, con pasos claros y los ingredientes a mano. Tu próxima comida empieza aquí.</p><a href="#cocinar" class="button primary">Ver qué puedo cocinar <span aria-hidden="true">→</span></a></div><div class="hero-photos" aria-hidden="true"><img src="assets/ds-vegan-apple-crisp.jpg" alt=""><img src="assets/ds-vegan-rice-pudding.jpg" alt=""><span class="hero-note">Vegetal, sencillo y rico.</span></div></section>
       <section class="stats" aria-label="Tu cocina en números"><div class="stat"><span class="stat-icon" aria-hidden="true">▦</span><div><strong>${recipes.length}</strong> recetas para explorar<small>Ideas para cada momento del día</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">♧</span><div><strong id="stat-ready">${ready}</strong> puedes cocinar hoy<small>Con todos los ingredientes necesarios</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">♡</span><div><strong id="stat-favorites">${state.favorites.length}</strong> favoritas<small>Esas que quieres repetir</small></div></div></section>
       <div class="section-title"><h2>Encuentra tu próxima receta</h2><span>Sin prisa. A tu gusto.</span></div>`)+
      `<div class="catalog-search-row"><div class="search-wrap"><span aria-hidden="true">⌕</span><input class="search" id="recipe-search" type="search" placeholder="Busca una receta o un ingrediente…" aria-label="Buscar recetas e ingredientes" value="${escape(filters.query)}"></div><button class="favorite-filter" id="filter-favorites" aria-pressed="${filters.favorites}">♡ Mis favoritas</button></div>
       <div class="category-tabs" aria-label="Categorías">${['Todas',...categories].map(c=>`<button class="chip ${filters.category===c?'selected':''}" data-category="${c}" aria-pressed="${filters.category===c}"><span aria-hidden="true">${icons[c]}</span>${c}<small>${c==='Todas'?recipes.length:recipes.filter(r=>r.category===c).length}</small></button>`).join('')}</div>
       <div class="toolbar"><div class="filter-controls">${canCook?`<label class="select-label">Me pueden faltar <select id="filter-missing" aria-label="Máximo de ingredientes faltantes">${[0,1,2,3,4,5,10,1000].map(n=>`<option value="${n}" ${filters.missing===n?'selected':''}>${n===1000?'Sin límite':n+(n===1?' ingrediente':' ingredientes')}</option>`).join('')}</select></label>`:''}
       <label class="select-label">Procedencia <select id="filter-collection"><option value="all">Todo el recetario</option><option value="pinterest" ${filters.collection==='pinterest'?'selected':''}>Mi tablero de Pinterest</option></select></label><label class="select-label">Tiempo activo <select id="filter-time"><option value="all">Cualquiera</option>${[15,30,60].map(n=>`<option value="${n}" ${filters.time===String(n)?'selected':''}>Hasta ${n} min</option>`).join('')}</select></label>
       <label class="select-label">Disponibilidad <select id="filter-availability"><option value="all">Todos</option><option value="Habituales" ${filters.availability==='Habituales'?'selected':''}>Sin mis difíciles</option><option value="Algunos especiales" ${filters.availability==='Algunos especiales'?'selected':''}>Con alguno difícil</option></select></label>
       <label class="check-label"><input type="checkbox" id="filter-freezer" ${filters.freezer?'checked':''}> Para congelar</label><label class="check-label"><input type="checkbox" id="filter-equipment" ${filters.equipment?'checked':''}> Con mis utensilios</label></div>
       <label class="select-label sort-wrap"><select id="filter-sort" aria-label="Ordenar recetas"><option value="default">Orden sugerido</option><option value="time" ${filters.sort==='time'?'selected':''}>Menor tiempo</option><option value="missing" ${filters.sort==='missing'?'selected':''}>Menos faltantes</option><option value="name" ${filters.sort==='name'?'selected':''}>Nombre A–Z</option></select></label></div>
       <div class="section-title" style="margin:0 0 15px"><span class="result-count" id="result-count"></span><button class="text-button" id="reset-filters">Restablecer filtros</button></div><div class="recipe-grid" id="recipe-grid"></div><p class="muted small" style="margin:23px 0 0">Puedes cambiar qué ingredientes te cuesta conseguir en Mi despensa. El tiempo activo es orientativo; las esperas y los reposos se explican en cada ficha.</p>`;
    renderResults();
  }
  function filteredRecipes() {
    const q=normalize(filters.query);
    let result=recipes.filter(r=>
      (filters.category==='Todas'||r.category===filters.category)&&
      (!q||normalize(r.title+' '+r.description+' '+r.ingredients.map(i=>i.name).join(' ')).includes(q))&&
      (!filters.favorites||favorite(r.id))&&
      (filters.collection==='all'||!!r.pinterestUrl)&&
      (filters.time==='all'||r.activeMinutes<=Number(filters.time))&&
      (filters.availability==='all'||filters.availability==='Habituales'&&hardIngredients(r).length===0||filters.availability==='Algunos especiales'&&hardIngredients(r).length>0)&&
      (!filters.freezer||r.freezer)&&(!filters.equipment||gearMissing(r).length===0)&&
      (view!=='cocinar'||missing(r).length<=filters.missing));
    if(filters.sort==='time')result.sort((a,b)=>a.minutes-b.minutes);
    if(filters.sort==='missing')result.sort((a,b)=>missing(a).length-missing(b).length);
    if(filters.sort==='name')result.sort((a,b)=>a.title.localeCompare(b.title,'es'));
    return result;
  }
  function renderResults() {
    const result=filteredRecipes();
    $('#result-count').textContent=`${result.length} ${result.length===1?'receta encontrada':'recetas encontradas'}`;
    $('#recipe-grid').innerHTML=result.length?result.map(card).join(''):
      `<div class="empty"><h3>${view==='cocinar'?'Tu próxima receta está cerca':'Probemos otra combinación'}</h3><p>${view==='cocinar'?'Marca lo que tienes en la despensa o aumenta el número de faltantes. Siempre puedes explorar todas las recetas en el recetario.':'No hay recetas con estos filtros. Puedes cambiar la categoría, la búsqueda o los ingredientes.'}</p><a class="button primary" href="#${view==='cocinar'?'despensa':'recetario'}">${view==='cocinar'?'Revisar mi despensa':'Ver recetario'}</a></div>`;
  }
  function card(r) {
    const m=missing(r).length,total=required(r).length;
    return `<article class="recipe-card"><div class="card-image"><button class="card-open" data-open="${r.id}" aria-label="Ver receta: ${escape(r.title)}"><img src="${escape(r.image)}" alt="${escape(r.title)}" loading="lazy" width="500" height="360"></button><div class="card-badges">${r.video?'<span class="tag video">▶ Video guardado</span>':'<span class="tag">Con foto</span>'}${r.freezer?'<span class="tag">❄ Congelable</span>':''}</div><button class="favorite" data-favorite="${r.id}" aria-label="${favorite(r.id)?'Quitar de':'Agregar a'} favoritas: ${escape(r.title)}" aria-pressed="${favorite(r.id)}">${favorite(r.id)?'♥':'♡'}</button></div><div class="card-body"><div class="card-category"><span>${r.category}</span><span>${r.adaptationKind==='proposed'?'Medidas propuestas':r.pinterestUrl?'De tu tablero':r.difficulty}</span></div><button class="title-button" data-open="${r.id}"><h3>${escape(r.title)}</h3></button><p class="card-desc">${escape(r.description)}</p><div class="card-meta"><span>◷ ${r.minutes} min${r.waitNote?' + reposo':''}</span><span>◌ ${escape(yieldText(r))}</span></div><div class="card-footer"><span class="match ${m===0?'complete':''}">${m===0?'✓ Tienes los ingredientes':`${total-m}/${total} ingredientes · faltan ${m}`}</span><button class="add-shopping" data-shopping="${r.id}" aria-pressed="${inShopping(r.id)}" aria-label="${inShopping(r.id)?'Quitar de':'Agregar a'} compras: ${escape(r.title)}">${inShopping(r.id)?'✓ En lista':'+ Lista'}</button></div></div></article>`;
  }
  function renderBoard() {
    const boardRecipes=pinterestBoard.pins.map(p=>byId.get(p.recipeId)).filter(Boolean);
    const proposed=boardRecipes.filter(r=>r.adaptationKind==='proposed').length;
    main.innerHTML=intro('DE PINTEREST A TU COCINA','Tu tablero, a mano.','Los pines de tu tablero «vegan», con nombres claros, videos guardados y pasos en español. Las adaptaciones llevan sus medidas propuestas visibles y no se presentan como recetas probadas.')+
      `<section class="stats" aria-label="Importación del tablero"><div class="stat"><span class="stat-icon" aria-hidden="true">Ⓟ</span><div><strong>${boardRecipes.length}</strong> recetas de tu tablero<small>${boardRecipes.filter(r=>r.video).length} videos guardados en la laptop</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">✓</span><div><strong>${boardRecipes.length-proposed}</strong> con medidas publicadas<small>De la ficha o descripción del autor</small></div></div><div class="stat"><span class="stat-icon" aria-hidden="true">✎</span><div><strong>${proposed}</strong> adaptaciones solicitadas<small>Con medidas propuestas · sin probar</small></div></div></section>
      <div class="notice"><span>En las adaptaciones, el video es una referencia: las cantidades y algunos pasos de la ficha pueden diferir. Todas las versiones guardadas usan ingredientes veganos.</span><a href="${safeUrl(pinterestBoard.url)}" target="_blank" rel="noopener noreferrer">Abrir tablero original ↗</a></div>
      <div class="inventory-summary"><div class="search-wrap"><span aria-hidden="true">⌕</span><input class="search" id="board-search" type="search" placeholder="Busca entre las recetas de tu tablero…" aria-label="Buscar en mi tablero" value="${escape(boardQuery)}"></div><div class="segmented" aria-label="Tipo de ficha del tablero">${[['all','Todas'],['source','Medidas publicadas'],['proposed','Adaptaciones']].map(([k,t])=>`<button data-board-kind="${k}" aria-pressed="${boardKind===k}">${t}</button>`).join('')}</div></div><p class="muted small" id="board-result-count"></p><div class="recipe-grid" id="board-grid"></div>`;
    renderBoardResults();
  }
  function renderBoardResults() {
    const q=normalize(boardQuery);
    const selected=pinterestBoard.pins.map(p=>byId.get(p.recipeId)).filter(Boolean).filter(r=>(boardKind==='all'||(r.adaptationKind||'source')===boardKind)&&(!q||normalize(r.title+' '+r.ingredients.map(i=>i.name).join(' ')).includes(q)));
    $('#board-result-count').textContent=`${selected.length} de ${pinterestBoard.pins.length} recetas de tu tablero`;
    $('#board-grid').innerHTML=selected.length?selected.map(card).join(''):'<div class="empty"><h3>No hay recetas con esta combinación</h3><p>Cambia la búsqueda o el tipo de ficha.</p></div>';
  }
  function renderPantry() {
    main.innerHTML=intro('SABER LO QUE TIENES ES EL PRIMER PASO','Tu despensa, al día.','Marca los ingredientes que tienes, incluidos aceites y especias. Usa ☆ para señalar los que te cuesta conseguir: así podrás evitar recetas que los necesiten. Las etiquetas iniciales son sugerencias que puedes cambiar.')+
      `<div class="inventory-summary"><strong id="inventory-count"></strong><div class="segmented" aria-label="Filtrar ingredientes">${[['all','Todos'],['have','Tengo'],['missing','No tengo'],['extra','Sin receta']].map(([k,t])=>`<button data-inventory-filter="${k}" aria-pressed="${inventoryFilter===k}">${t}</button>`).join('')}</div></div><div class="search-wrap view-search"><span aria-hidden="true">⌕</span><input class="search" id="pantry-search" type="search" placeholder="Buscar un ingrediente…" aria-label="Buscar ingredientes" value="${escape(inventoryQuery)}"></div><div class="inventory-grid" id="inventory-grid"></div><div class="notice" style="margin-top:25px">¿Tienes un ingrediente que todavía no aparece? Dímelo en nuestro chat para incorporarlo, aunque no esté en ninguna receta.</div>`;
    renderInventory();
  }
  function renderInventory() {
    const entries=sortedIngredients();
    const have=entries.filter(([k])=>state.pantry[k]).length;
    $('#inventory-count').textContent=`${have} de ${entries.length} ingredientes disponibles`;
    const visible=entries.filter(([k,i])=>(!inventoryQuery||normalize(i.name).includes(normalize(inventoryQuery)))&&(inventoryFilter==='all'||inventoryFilter==='have'&&state.pantry[k]||inventoryFilter==='missing'&&!state.pantry[k]||inventoryFilter==='extra'&&i.ids.size===0));
    $('#inventory-grid').innerHTML=visible.length?visible.map(([k,i])=>`<div class="inventory-item"><label class="inventory-main"><input type="checkbox" data-pantry="${escape(k)}" ${state.pantry[k]?'checked':''}><span><strong>${escape(i.name)}</strong><small>${i.ids.size?`En ${i.ids.size} ${i.ids.size===1?'receta':'recetas'}`:'Ingrediente incorporado desde el chat'}</small></span><span class="item-state">${state.pantry[k]?'Tengo':'No tengo'}</span></label><button class="hard-toggle" data-hard="${escape(k)}" aria-pressed="${!!state.hard[k]}" aria-label="${state.hard[k]?'Desmarcar':'Marcar'} ${escape(i.name)} como difícil de conseguir" title="${state.hard[k]?'Difícil de conseguir':'Marcar como difícil de conseguir'}">${state.hard[k]?'★':'☆'}</button></div>`).join(''):'<div class="empty"><h3>No hay ingredientes en esta vista</h3><p>Prueba otra búsqueda o cambia el filtro.</p></div>';
  }
  function renderEquipment() {
    main.innerHTML=intro('UNA COCINA CON POSIBILIDADES','Tus utensilios.','Ya marqué los equipos que me dijiste que tienes. Revisa los accesorios adicionales y marca los que también estén en tu cocina. Las fichas incluyen alternativas cuando es posible.')+
      `<div class="inventory-summary"><strong id="equipment-count"></strong></div><div class="search-wrap view-search"><span aria-hidden="true">⌕</span><input class="search" id="equipment-search" type="search" placeholder="Buscar un utensilio…" aria-label="Buscar utensilios" value="${escape(equipmentQuery)}"></div><div class="inventory-grid equipment-grid" id="equipment-grid"></div>`;
    renderEquipmentList();
  }
  function renderEquipmentList() {
    const items=[...equipmentIndex.entries()].sort((a,b)=>a[1].localeCompare(b[1],'es'));
    $('#equipment-count').textContent=`${items.filter(([k])=>state.equipment[k]).length} utensilios disponibles`;
    const visible=items.filter(([,name])=>normalize(name).includes(normalize(equipmentQuery)));
    $('#equipment-grid').innerHTML=visible.length?visible.map(([k,name])=>`<label class="inventory-item"><input type="checkbox" data-equipment="${escape(k)}" ${state.equipment[k]?'checked':''}><span><strong>${escape(name)}</strong></span><span class="item-state">${state.equipment[k]?'Tengo':'No tengo'}</span></label>`).join(''):'<div class="empty"><h3>No aparece ese utensilio</h3><p>Prueba un nombre más corto.</p></div>';
  }
  function shoppingItems() {
    const grouped=new Map();
    state.shopping.map(id=>byId.get(id)).filter(Boolean).forEach(r=>r.ingredients.filter(i=>includeOptional||!i.optional).forEach(i=>{
      const k=key(i.name);
      if(!grouped.has(k))grouped.set(k,{name:displayName(k),items:[]});
      grouped.get(k).items.push({recipe:r.title,amount:i.amount,optional:i.optional});
    }));
    return [...grouped.entries()].sort((a,b)=>Number(!!state.pantry[a[0]])-Number(!!state.pantry[b[0]])||a[1].name.localeCompare(b[1].name,'es'));
  }
  function renderShopping() {
    const selected=state.shopping.map(id=>byId.get(id)).filter(Boolean);
    const items=shoppingItems();const need=items.filter(([k])=>!state.pantry[k]).length;
    main.innerHTML=intro('MENOS VUELTAS. MÁS COMIDAS RESUELTAS.','Tu próxima compra.','Elige recetas desde el recetario y reúne sus ingredientes en una sola lista. Cada ingrediente aparece una vez, con las cantidades que necesita cada receta.')+
      (selected.length?`<div class="shopping-layout"><section class="panel"><h2>Voy a preparar</h2>${selected.map(r=>`<div class="chosen-recipe"><img src="${escape(r.image)}" alt=""><button data-open="${r.id}">${escape(r.title)}<small class="muted" style="display:block">${escape(yieldText(r))}</small></button><button class="remove-recipe" data-shopping="${r.id}" aria-label="Quitar ${escape(r.title)} de compras">×</button></div>`).join('')}<a class="text-button" style="display:inline-block;margin-top:18px" href="#recetario">Agregar otra receta ↗</a><p class="shopping-legend">Las cantidades corresponden al rendimiento original de cada receta. Revisa que lo que tienes te alcance para todas.</p></section><section class="panel"><div class="shopping-heading"><h2>Ingredientes juntos</h2><span class="count-pill">${need} faltantes</span></div><div class="shopping-tools"><label class="check-label"><input type="checkbox" id="shopping-optional" ${includeOptional?'checked':''}> Incluir opcionales</label><button class="button secondary" id="download-shopping">↓ Descargar lista</button></div><div>${items.map(([k,i])=>`<div class="shopping-item ${state.pantry[k]?'owned':''}"><label><input type="checkbox" data-pantry="${escape(k)}" ${state.pantry[k]?'checked':''}><span><strong>${escape(i.name)}</strong>${i.items.map(it=>`<small>${escape(it.amount)}${it.optional?' (opcional)':''} · ${escape(it.recipe)}</small>`).join('')}</span></label><span class="muted small">${state.pantry[k]?'Tengo':'Falta'}</span></div>`).join('')}</div><p class="shopping-legend">Marcar un ingrediente lo registra como disponible en tu despensa.</p></section></div>`:
      `<div class="empty"><h3>Algo rico empieza con una idea</h3><p>Usa “+ Lista” en las recetas que quieras preparar. Aquí reuniré todos sus ingredientes y señalaré cuáles te faltan.</p><a class="button primary" href="#recetario">Explorar recetas →</a></div>`);
  }
  function openRecipe(id) {
    activeRecipe=byId.get(id);if(!activeRecipe)return;
    cooking=false;cookStep=0;renderRecipe();
    if(!recipeDialog.open)recipeDialog.showModal();
    recipeDialog.scrollTop=0;
  }
  function renderRecipe() {
    const r=activeRecipe;if(!r)return;
    recipeDialog.innerHTML=`<button class="close-dialog" data-close="recipe-dialog" aria-label="Cerrar receta">×</button><div class="detail-hero"><img class="detail-image" src="${escape(r.image)}" alt="${escape(r.title)}"><div class="detail-title"><span class="eyebrow">${r.category} · 100% VEGANO</span><h2>${escape(r.title)}</h2><p>${escape(r.description)}</p><div class="detail-tags"><span class="tag">◷ ${r.minutes} min${r.waitNote?' + reposo':''}</span><span class="tag">${escape(yieldText(r))}</span><span class="tag">${r.difficulty}</span>${r.adaptationKind==='proposed'?'<span class="tag proposed-tag">Medidas propuestas · Sin probar</span>':''}${r.freezer?'<span class="tag">❄ Congelable</span>':''}</div><div class="detail-actions"><button class="button primary" id="toggle-cooking">${cooking?'Ver todos los pasos':'Empezar a cocinar →'}</button><button class="button secondary" data-shopping="${r.id}" aria-pressed="${inShopping(r.id)}">${inShopping(r.id)?'✓ En compras':'+ Compras'}</button><button class="button secondary" data-favorite="${r.id}" aria-label="Guardar en favoritas" aria-pressed="${favorite(r.id)}">${favorite(r.id)?'♥':'♡'}</button><button class="button secondary" id="print-recipe">Imprimir</button></div></div></div><div class="detail-body"><div class="detail-source"><span>Fuente: ${escape(r.source.name)} · ${escape(r.source.author)}<br>Guía en español con explicaciones para principiantes.</span><span><a href="${safeUrl(r.source.url)}" target="_blank" rel="noopener noreferrer">Ver fuente original ↗</a>${r.pinterestUrl?`<br><a href="${safeUrl(r.pinterestUrl)}" target="_blank" rel="noopener noreferrer">Ver el pin de tu tablero ↗</a>`:''}${(r.additionalSources||[]).map(s=>`<br><a href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a>`).join('')}</span></div>${r.waitNote?`<div class="detail-note"><strong>Antes de empezar</strong>${escape(r.waitNote)}</div>`:''}${r.adaptationNote?`<div class="detail-note"><strong>${r.adaptationKind==='proposed'?'Adaptación con medidas propuestas · Sin probar':'Adaptación de esta ficha'}</strong>${escape(r.adaptationNote)}</div>`:''}${hardIngredients(r).length?`<p class="small muted">Marcados como difíciles de conseguir: ${escape(hardIngredients(r).map(i=>i.name).join(', '))}. Puedes cambiar estas etiquetas en Mi despensa. Consulta las sustituciones al final.</p>`:''}<div class="recipe-columns"><aside><h3>Ingredientes</h3><p class="small muted" id="detail-missing">${missing(r).length?`Te faltan ${missing(r).length} ingredientes necesarios.`:'Tienes todos los ingredientes necesarios.'}</p><ul class="ingredient-list">${r.ingredients.map(i=>`<li><label><input type="checkbox" data-pantry="${escape(key(i.name))}" ${owned(i.name)?'checked':''}><span><strong>${escape(i.name)} ${i.optional?'<span class="optional-label">Opcional</span>':''}</strong><small>${escape(i.amount)}</small></span></label></li>`).join('')}</ul><p class="small muted">Medidas rasas, salvo que se indique otra cosa. Las cantidades corresponden a ${escape(yieldText(r))}.</p><h3>Utensilios</h3><div class="equipment-pills">${[...new Set(r.equipment.map(gearName))].map(e=>`<span class="equipment-pill ${state.equipment[gearKey(e)]?'':'missing'}">${state.equipment[gearKey(e)]?'✓ ':'○ '}${escape(e)}</span>`).join('')}</div><p class="small muted" style="margin-top:10px">○ Sin marcar en tu cocina. <a href="#utensilios" data-close="recipe-dialog">Revisar</a></p>${r.alternatives?.length?`<ul class="alternatives">${r.alternatives.map(a=>`<li><strong>${escape(a.equipment)}:</strong> ${escape(a.alternative)}</li>`).join('')}</ul>`:''}</aside><section><h3>Paso a paso</h3>${cooking?cookPanel(r):`<ol class="steps">${r.steps.map((s,index)=>`<li class="${state.completed[r.id]?.includes(index)?'done':''}"><span class="step-num">${index+1}</span><div><p>${escape(s)}</p><label class="step-check"><input type="checkbox" data-step="${index}" ${state.completed[r.id]?.includes(index)?'checked':''}> Paso completado</label></div></li>`).join('')}</ol>`}<div class="detail-note"><strong>Para guardar y repetir</strong>${escape(r.storage)}</div>${r.substitutions?.length?`<h3>Sustituciones y consejos</h3><ul class="alternatives">${r.substitutions.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>`:''}</section></div><section class="media-block"><h3>${r.adaptationKind==='proposed'?'Video de referencia':r.video?'Mira cómo se prepara':'Foto de referencia'}</h3><p>${escape(r.mediaNote|| (r.video?'Video guardado en esta laptop. Enlace original al inicio de la ficha.':'Esta receta incluye foto; no hay video guardado. El enlace original está al inicio de la ficha.'))}</p>${r.video?`<video class="recipe-video" controls playsinline preload="none" poster="${escape(r.image)}"><source src="${escape(r.video)}" type="video/mp4">Tu navegador no puede reproducir este video. <a href="${escape(r.video)}">Abrir archivo</a></video>`:`<img src="${escape(r.image)}" alt="${escape(r.title)}" style="width:100%;max-height:420px;object-fit:contain;border-radius:12px">`}</section></div>`;
  }
  function cookPanel(r) {
    return `<div class="cook-panel"><div class="cook-progress">Paso ${cookStep+1} de ${r.steps.length}</div><p>${escape(r.steps[cookStep])}</p><div class="cook-nav"><button class="button secondary" data-cook-move="-1" ${cookStep===0?'disabled':''}>← Anterior</button><button class="button primary" data-cook-move="1">${cookStep===r.steps.length-1?'Terminar ✓':'Siguiente →'}</button></div><p class="small muted" style="font-size:11px;margin:15px 0 0">Ten los ingredientes medidos antes de comenzar. Puedes volver a cualquier paso.</p></div>`;
  }
  function safeUrl(value) {try {const u=new URL(value);return ['https:','http:'].includes(u.protocol)?escape(u.href):'#';}catch{return '#';}}
  function download(name,text,type='application/json') {
    const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function setPantry(k,checked) {
    state.pantry[k]=checked;save();
    $$('[data-pantry]').filter(el=>el.dataset.pantry===k).forEach(el=>{el.checked=checked;const label=el.closest('.inventory-item');if(label)label.querySelector('.item-state').textContent=checked?'Tengo':'No tengo';});
    if(view==='recetario'||view==='cocinar')renderResults();
    if(view==='pinterest')renderBoardResults();
    if(view==='despensa')renderInventory();
    if(view==='compras')renderShopping();
    if(activeRecipe&&recipeDialog.open)$('#detail-missing').textContent=missing(activeRecipe).length?`Te faltan ${missing(activeRecipe).length} ingredientes necesarios.`:'Tienes todos los ingredientes necesarios.';
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a');if(!target)return;
    if(target.classList.contains('skip')){event.preventDefault();main.focus();return;}
    if(target.dataset.close){const dialog=$('#'+target.dataset.close);$$('video',dialog).forEach(v=>v.pause());dialog.close();}
    if(target.dataset.open)openRecipe(target.dataset.open);
    if(target.dataset.favorite){
      const id=target.dataset.favorite;state.favorites=favorite(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();
      $$('[data-favorite]').filter(e=>e.dataset.favorite===id).forEach(e=>{e.setAttribute('aria-pressed',String(favorite(id)));e.textContent=favorite(id)?'♥':'♡';e.setAttribute('aria-label',`${favorite(id)?'Quitar de':'Agregar a'} favoritas: ${byId.get(id).title}`);});
      if(view==='recetario'||view==='cocinar')renderResults();
    if(view==='pinterest')renderBoardResults();
    }
    if(target.dataset.shopping){
      const id=target.dataset.shopping;const added=!inShopping(id);state.shopping=added?[...state.shopping,id]:state.shopping.filter(x=>x!==id);save();
      if(view==='compras')renderShopping();else if(view==='recetario'||view==='cocinar')renderResults();
    if(view==='pinterest')renderBoardResults();
      if(recipeDialog.open)$$('[data-shopping]',recipeDialog).filter(e=>e.dataset.shopping===id).forEach(e=>{e.textContent=added?'✓ En compras':'+ Compras';e.setAttribute('aria-pressed',String(added));});
      toast(added?'Receta agregada a tu lista de compras.':'Receta retirada de tu lista de compras.');
    }
    if(target.dataset.category){filters.category=target.dataset.category;$$('[data-category]').forEach(e=>{e.classList.toggle('selected',e.dataset.category===filters.category);e.setAttribute('aria-pressed',String(e.dataset.category===filters.category));});renderResults();}
    if(target.dataset.boardKind){boardKind=target.dataset.boardKind;$$('[data-board-kind]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.boardKind===boardKind)));renderBoardResults();}
    if(target.dataset.inventoryFilter){inventoryFilter=target.dataset.inventoryFilter;$$('[data-inventory-filter]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.inventoryFilter===inventoryFilter)));renderInventory();}
    if(target.dataset.hard){state.hard[target.dataset.hard]=!state.hard[target.dataset.hard];save();renderInventory();}
    if(target.id==='filter-favorites'){filters.favorites=!filters.favorites;target.setAttribute('aria-pressed',String(filters.favorites));renderResults();}
    if(target.id==='reset-filters'){Object.assign(filters,{query:'',category:'Todas',collection:'all',favorites:false,time:'all',availability:'all',freezer:false,equipment:false,sort:'default',missing:0});renderCatalog();}
    if(target.id==='toggle-cooking'){cooking=!cooking;renderRecipe();if(cooking)$('.cook-panel').scrollIntoView({block:'center',behavior:'smooth'});}
    if(target.dataset.cookMove){
      const move=Number(target.dataset.cookMove);
      if(move===1){state.completed[activeRecipe.id]=[...new Set([...(state.completed[activeRecipe.id]||[]),cookStep])];save();}
      if(cookStep===activeRecipe.steps.length-1&&move===1){cooking=false;toast('¡Receta terminada! Que la disfrutes.');}else cookStep=Math.max(0,Math.min(activeRecipe.steps.length-1,cookStep+move));
      const scroll=recipeDialog.scrollTop;renderRecipe();recipeDialog.scrollTop=scroll;
    }
    if(target.id==='print-recipe')window.print();
    if(target.id==='backup-open'||target.id==='backup-open-mobile'){$('#backup-message').textContent='';$('#backup-dialog').showModal();}
    if(target.id==='export-backup'){download('verde-a-mano-'+new Date().toLocaleDateString('en-CA')+'.json',JSON.stringify(state,null,2));$('#backup-message').textContent='Copia descargada. Guarda también la carpeta de la aplicación para conservar las recetas y los medios.';}
    if(target.id==='download-shopping'){
      const lines=['VERDE A MANO · LISTA DE COMPRAS','',...shoppingItems().map(([k,i])=>`${state.pantry[k]?'[Tengo]':'[Falta]'} ${i.name}\n${i.items.map(it=>'  '+it.amount+' · '+it.recipe).join('\n')}`)];
      download('lista-de-compras.txt',lines.join('\n\n'),'text/plain;charset=utf-8');
    }
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.id==='recipe-search'){filters.query=el.value;renderResults();}
    if(el.id==='board-search'){boardQuery=el.value;renderBoardResults();}
    if(el.id==='pantry-search'){inventoryQuery=el.value;renderInventory();}
    if(el.id==='equipment-search'){equipmentQuery=el.value;renderEquipmentList();}
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.pantry)setPantry(el.dataset.pantry,el.checked);
    if(el.dataset.equipment){state.equipment[el.dataset.equipment]=el.checked;save();renderEquipmentList();}
    if(el.dataset.step){const index=Number(el.dataset.step);state.completed[activeRecipe.id]=el.checked?[...new Set([...(state.completed[activeRecipe.id]||[]),index])]:(state.completed[activeRecipe.id]||[]).filter(n=>n!==index);el.closest('li').classList.toggle('done',el.checked);save();}
    const filterMap={'filter-collection':'collection','filter-time':'time','filter-availability':'availability','filter-sort':'sort','filter-missing':'missing','filter-freezer':'freezer','filter-equipment':'equipment'};
    if(filterMap[el.id]){filters[filterMap[el.id]]=el.type==='checkbox'?el.checked:el.id==='filter-missing'?Number(el.value):el.value;renderResults();}
    if(el.id==='shopping-optional'){includeOptional=el.checked;renderShopping();}
  });
  $('#import-backup').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try {
      if(file.size>2_000_000)throw new Error('El archivo es demasiado grande para una copia de selecciones.');
      const restored=validateBackup(JSON.parse(await file.text()));
      // Keep an automatic recovery copy before a valid restore replaces selections.
      download('verde-a-mano-antes-de-restaurar.json',JSON.stringify(state,null,2));
      state=restored;save();go();if(recipeDialog.open)renderRecipe();
      $('#backup-message').textContent='Copia restaurada. También descargué tus selecciones anteriores por si quieres recuperarlas.';
    } catch(error){$('#backup-message').textContent='No se restauró la copia: '+error.message;}
    event.target.value='';
  });
  recipeDialog.addEventListener('close',()=>{$$('video',recipeDialog).forEach(v=>v.pause());});
  window.addEventListener('hashchange',go);
  if(!recipes.length){main.innerHTML='<div class="empty"><h1>No se pudo cargar el recetario</h1><p>Abre index.html dentro de la carpeta completa de la aplicación; necesita sus archivos de datos y medios.</p></div>';return;}
  go();
  if(!storageAvailable)toast('No se pudieron leer tus selecciones. Puedes restaurar una copia de seguridad.');
})();

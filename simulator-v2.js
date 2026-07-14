(() => {
  const $ = (selector) => document.querySelector(selector);
  const form = $('#strategy-form');
  if (!form) return;

  const PRODUCT_KEY = 'ravitoai-products-v1';
  const PROFILE_KEY = 'ravitoai-profile-v1';
  const HISTORY_KEY = 'ravitoai-history-v2';

  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const label = (p) => `${p.brand} ${p.name}`;
  const fmt = (minutes) => minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
    : `${minutes} min`;

  function getProducts() {
    return load(PRODUCT_KEY, []).map(p => ({ status: 'none', ...p }));
  }

  function usableProducts(type) {
    const products = getProducts().filter(p => type === 'energy' ? p.type !== 'drink' : p.type === 'drink');
    const stocked = products.filter(p => p.status === 'stock');
    const planned = products.filter(p => p.status === 'planned');
    return stocked.length ? stocked : planned.length ? planned : products;
  }

  function refreshHydrationSelect() {
    const select = $('#hydration-product');
    if (!select) return;
    const current = select.value;
    const drinks = usableProducts('drink');
    select.innerHTML = '<option value="auto">Automatique selon mon stock</option><option value="water">Eau uniquement</option>' +
      drinks.map(p => `<option value="${p.id}">${label(p)} · ${p.carbs || 0} g</option>`).join('');
    if ([...select.options].some(o => o.value === current)) select.value = current;
  }

  function chooseEnergy(products, digestion, duration) {
    const nonCaf = products.filter(p => !p.caffeine);
    const caffeinated = products.filter(p => p.caffeine);
    const gentleTypes = digestion === 'sensitive' ? ['gel', 'compote'] : ['gel', 'solid', 'compote'];
    const preferred = products.filter(p => gentleTypes.includes(p.type));
    const basePool = preferred.length ? preferred : products;
    const primary = (basePool.filter(p => !p.caffeine && p.carbs >= 20)[0] || nonCaf[0] || basePool[0]);
    const lateCaf = duration >= 150 ? (caffeinated.find(p => p.caffeine <= 100) || null) : null;
    return { primary, lateCaf };
  }

  function targetCarbs(duration, digestion, profile) {
    let rate = duration < 55 ? 0 : duration < 75 ? 25 : duration < 110 ? 40 : duration < 150 ? 50 : duration < 210 ? 60 : 70;
    if (digestion === 'sensitive' && rate) rate = Math.max(25, rate - 10);
    if (digestion === 'trained' && duration >= 120) rate += 5;
    if (profile?.carbMax) rate = Math.min(rate, Number(profile.carbMax));
    return rate;
  }

  function hydrationTarget(sweat, temperature, duration) {
    let rate = sweat === 'low' ? 300 : sweat === 'high' ? 650 : 475;
    if (temperature >= 22) rate += 75;
    if (temperature >= 27) rate += 125;
    if (temperature >= 32) rate += 100;
    if (temperature <= 8) rate -= 75;
    if (duration < 60) rate = Math.min(rate, 400);
    return Math.max(250, Math.round(rate / 25) * 25);
  }

  refreshHydrationSelect();
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-tab="calculator"]')) setTimeout(refreshHydrationSelect, 0);
  });

  $('#fuel-mode')?.addEventListener('change', () => {
    const manual = $('#fuel-mode').value === 'manual';
    $('#product').disabled = !manual;
  });
  $('#product').disabled = true;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const profile = load(PROFILE_KEY, null);
    const distance = $('#distance').value === 'custom' ? Number($('#custom-distance').value) : Number($('#distance').value);
    const duration = Number($('#hours').value) * 60 + Number($('#minutes').value);
    const temperature = Number($('#temperature').value);
    const sweat = $('#sweat-rate').value === 'profile' ? (profile?.sweat || 'normal') : $('#sweat-rate').value;
    const digestion = $('#digestion').value === 'profile' ? (profile?.digestion || 'normal') : $('#digestion').value;
    const raceName = $('#race-name').value.trim() || `${distance} km`;
    if (!distance || duration <= 0) return;

    const allProducts = getProducts();
    const energyPool = usableProducts('energy');
    const selectedManual = allProducts.find(p => p.id === $('#product').value);
    const choice = chooseEnergy(energyPool, digestion, duration);
    const primary = $('#fuel-mode').value === 'manual' && selectedManual ? selectedManual : choice.primary;
    const caffeineProduct = choice.lateCaf && choice.lateCaf.id !== primary?.id ? choice.lateCaf : null;

    const carbRate = targetCarbs(duration, digestion, profile);
    const waterRate = hydrationTarget(sweat, temperature, duration);
    const totalWater = Math.round((waterRate * duration / 60) / 50) * 50;

    const drinkProducts = usableProducts('drink');
    const requestedDrink = $('#hydration-product').value;
    let drink = requestedDrink === 'water' ? null : allProducts.find(p => p.id === requestedDrink);
    if (requestedDrink === 'auto') {
      drink = duration >= 75 ? (drinkProducts.find(p => p.carbs >= 20) || drinkProducts[0] || null) : null;
    }

    const bottleCount = drink ? Math.max(1, Math.ceil(totalWater / 500)) : 0;
    const drinkCarbs = drink ? Math.min(Math.round(carbRate * duration / 60 * 0.45), (drink.carbs || 0) * bottleCount) : 0;
    const targetTotalCarbs = Math.round(carbRate * duration / 60);
    const remainingCarbs = Math.max(0, targetTotalCarbs - drinkCarbs);
    const duringFuelNeeded = duration >= 70;
    const preStartFuel = duration >= 70 && primary ? 1 : 0;
    const duringPortions = duringFuelNeeded && primary?.carbs ? Math.ceil(remainingCarbs / primary.carbs) : 0;
    const totalPortions = preStartFuel + duringPortions;

    const timeline = [];
    if (preStartFuel) timeline.push({ time: -10, text: `${label(primary)} · 1 portion (${primary.carbs} g) avant le départ.` });
    if (!duringFuelNeeded) {
      timeline.push({ time: 0, text: duration < 45 ? 'Aucun gel nécessaire pendant la course.' : 'Gel pendant la course non indispensable ; garde-le en secours si déjà testé.' });
    } else {
      const first = duration <= 100 ? 35 : 30;
      const spacing = duringPortions <= 1 ? duration : Math.max(25, Math.round(((duration - first - 10) / Math.max(1, duringPortions - 1)) / 5) * 5);
      for (let i = 0; i < duringPortions; i++) {
        const time = Math.min(duration - 8, first + i * spacing);
        const useCaffeine = caffeineProduct && i === duringPortions - 1 && time >= duration * 0.55;
        const product = useCaffeine ? caffeineProduct : primary;
        timeline.push({ time, text: `${label(product)} · 1 portion (${product.carbs} g)${product.caffeine ? ` · ${product.caffeine} mg caféine` : ''}.` });
      }
    }

    const sipInterval = duration < 60 ? 25 : 20;
    timeline.push({ time: 15, text: `Commencer à boire tôt, puis environ ${Math.round(waterRate * sipInterval / 60 / 10) * 10} ml toutes les ${sipInterval} min.` });
    if (drink) timeline.push({ time: 20, text: `${label(drink)} : préparer ${bottleCount} dose(s) pour environ ${totalWater} ml au total.` });

    const stockNote = primary?.status === 'stock' ? 'Disponible dans ton stock' : primary?.status === 'planned' ? 'Produit prévu d’achat' : 'Suggestion du catalogue';
    const hydrationName = drink ? label(drink) : 'Eau';
    const result = $('#result');
    result.innerHTML = `
      <p class="eyebrow">PLAN AUTOMATIQUE</p>
      <h2>${raceName}</h2>
      <p class="summary">${distance} km · ${fmt(duration)} · ${temperature} °C</p>
      <div class="metrics">
        <div class="metric"><span>Gels / portions</span><strong>${totalPortions}</strong><small>${preStartFuel} avant · ${duringPortions} pendant</small></div>
        <div class="metric"><span>Hydratation</span><strong>${totalWater} ml</strong><small>${waterRate} ml/h · ${hydrationName}</small></div>
        <div class="metric"><span>Glucides visés</span><strong>${carbRate} g/h</strong><small>${targetTotalCarbs} g au total</small></div>
      </div>
      <h3>À préparer</h3>
      <div class="timeline">
        <div class="timeline-item"><strong>${totalPortions}×</strong><p>${primary ? label(primary) : 'Aucun produit énergétique requis'} · ${stockNote}</p></div>
        <div class="timeline-item"><strong>${totalWater} ml</strong><p>${hydrationName}${drink ? ` · ${bottleCount} dose(s)` : ''}</p></div>
      </div>
      <h3>Quand les prendre</h3>
      <div class="timeline">${timeline.sort((a, b) => a.time - b.time).map(item => `<div class="timeline-item"><strong>${item.time < 0 ? `${Math.abs(item.time)} min avant` : item.time === 0 ? 'Course' : fmt(item.time)}</strong><p>${item.text}</p></div>`).join('')}</div>
      <div class="notice">Plan personnalisé à tester à l’entraînement. L’hydratation doit rester guidée par la soif, la météo et ta tolérance ; évite de forcer de gros volumes.</div>`;
    result.classList.remove('hidden');

    const coach = $('#coach-message');
    if (coach) coach.textContent = `${profile?.name ? `${profile.name}, ` : ''}pour ${distance} km, RavitoAI prévoit ${totalPortions} portion(s) et ${totalWater} ml. ${primary ? `${label(primary)} est retenu selon ton inventaire.` : ''}`;

    const history = load(HISTORY_KEY, []);
    history.unshift({ name: raceName, distance, duration, product: primary ? label(primary) : 'Aucun', carbs: carbRate, water: totalWater, date: new Date().toISOString() });
    save(HISTORY_KEY, history.slice(0, 30));
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
})();
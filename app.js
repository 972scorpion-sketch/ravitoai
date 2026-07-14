const form = document.querySelector('#strategy-form');
const distanceSelect = document.querySelector('#distance');
const customWrap = document.querySelector('#custom-distance-wrap');
const result = document.querySelector('#result');

distanceSelect.addEventListener('change', () => {
  customWrap.classList.toggle('hidden', distanceSelect.value !== 'custom');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const distance = distanceSelect.value === 'custom'
    ? Number(document.querySelector('#custom-distance').value)
    : Number(distanceSelect.value);
  const hours = Number(document.querySelector('#hours').value);
  const minutes = Number(document.querySelector('#minutes').value);
  const temperature = Number(document.querySelector('#temperature').value);
  const sweatRate = document.querySelector('#sweat-rate').value;
  const digestion = document.querySelector('#digestion').value;
  const durationMinutes = hours * 60 + minutes;
  const durationHours = durationMinutes / 60;

  if (!distance || durationMinutes <= 0) {
    result.innerHTML = '<p>Renseigne une distance et un temps estimé valides.</p>';
    result.classList.remove('hidden');
    return;
  }

  let carbRate = durationMinutes < 60 ? 0 : durationMinutes < 90 ? 30 : durationMinutes < 150 ? 45 : 60;
  if (digestion === 'sensitive') carbRate = Math.max(20, carbRate - 15);
  if (digestion === 'trained' && durationMinutes >= 120) carbRate = Math.min(75, carbRate + 15);

  let waterRate = sweatRate === 'low' ? 350 : sweatRate === 'high' ? 650 : 500;
  if (temperature >= 25) waterRate += 150;
  if (temperature <= 8) waterRate -= 100;
  waterRate = Math.max(250, waterRate);

  const totalCarbs = Math.round(carbRate * durationHours);
  const totalWater = Math.round((waterRate * durationHours) / 50) * 50;
  const gelCount = carbRate === 0 ? 0 : Math.max(1, Math.ceil(totalCarbs / 25));
  const gelInterval = gelCount > 0 ? Math.max(20, Math.round(durationMinutes / gelCount / 5) * 5) : 0;
  const pace = durationMinutes / distance;
  const paceMinutes = Math.floor(pace);
  const paceSeconds = Math.round((pace - paceMinutes) * 60).toString().padStart(2, '0');

  const planItems = [];
  if (durationMinutes < 60) {
    planItems.push('Pas de glucides obligatoires pendant la course si le repas d’avant-course est bien géré.');
    planItems.push('Option : un gel 10 à 15 minutes avant le départ si tu le tolères bien.');
  } else {
    planItems.push(`Commence les glucides après 20 à 30 minutes, puis environ toutes les ${gelInterval} minutes.`);
    planItems.push(`Prévois environ ${gelCount} prise${gelCount > 1 ? 's' : ''} de 20 à 25 g de glucides.`);
  }
  planItems.push(`Bois par petites gorgées pour viser environ ${waterRate} ml par heure.`);
  if (durationMinutes >= 90 || temperature >= 25) {
    planItems.push('Ajoute des électrolytes, surtout s’il fait chaud ou si tu transpires beaucoup.');
  }
  planItems.push('Teste cette stratégie à l’entraînement avant de l’utiliser en compétition.');

  result.innerHTML = `
    <h2>Ta stratégie estimée</h2>
    <p>${distance.toFixed(distance % 1 ? 1 : 0)} km en ${hours ? `${hours} h ` : ''}${minutes} min · allure moyenne ${paceMinutes}:${paceSeconds}/km</p>
    <div class="metrics">
      <div class="metric"><span>Glucides</span><strong>${carbRate} g/h</strong><small>${totalCarbs || 0} g au total</small></div>
      <div class="metric"><span>Hydratation</span><strong>${waterRate} ml/h</strong><small>${totalWater} ml au total</small></div>
      <div class="metric"><span>Prises</span><strong>${gelCount}</strong><small>${gelCount ? `toutes les ~${gelInterval} min` : 'pendant la course'}</small></div>
    </div>
    <ol class="plan">${planItems.map(item => `<li>${item}</li>`).join('')}</ol>
    <div class="notice">Estimation générale : adapte-la selon tes produits, ta tolérance digestive et les conditions réelles.</div>
  `;
  result.classList.remove('hidden');
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

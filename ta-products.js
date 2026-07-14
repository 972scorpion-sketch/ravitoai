(() => {
  const key = 'ravitoai-products-v1';
  const taProducts = [
    { id: 'ta-energy-gel', brand: 'Tä Energy', name: 'Energy Gel', type: 'gel', carbs: 25, sodium: 100, caffeine: 0, favorite: false },
    { id: 'ta-energy-gel-caffeine', brand: 'Tä Energy', name: 'Energy Gel Caféiné', type: 'gel', carbs: 25, sodium: 100, caffeine: 50, favorite: false },
    { id: 'ta-energy-gummies', brand: 'Tä Energy', name: 'Energy Gummies', type: 'solid', carbs: 30, sodium: 50, caffeine: 0, favorite: true },
    { id: 'ta-energy-gummies-caffeine', brand: 'Tä Energy', name: 'Energy Gummies Caféinées', type: 'solid', carbs: 30, sodium: 50, caffeine: 50, favorite: false },
    { id: 'ta-energy-drink', brand: 'Tä Energy', name: 'Energy Drink Mix', type: 'drink', carbs: 30, sodium: 250, caffeine: 0, favorite: false },
    { id: 'ta-hydration-drink', brand: 'Tä Energy', name: 'Hydration Drink Mix', type: 'drink', carbs: 15, sodium: 350, caffeine: 0, favorite: false },
    { id: 'ta-energy-bar', brand: 'Tä Energy', name: 'Energy Bar', type: 'solid', carbs: 30, sodium: 100, caffeine: 0, favorite: false }
  ];

  let current = [];
  try {
    current = JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    current = [];
  }

  const ids = new Set(current.map(product => product.id));
  const missing = taProducts.filter(product => !ids.has(product.id));
  if (missing.length) {
    localStorage.setItem(key, JSON.stringify([...current, ...missing]));
  }
})();

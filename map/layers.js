export function initLayerToggles(map) {
  const layerItems = document.querySelectorAll('.layer-item');

  layerItems.forEach(item => {
    item.addEventListener('click', () => {
      const layer = item.dataset.layer;
      const toggle = item.querySelector('.layer-toggle');
      const isOn = toggle.classList.contains('on');

      if (isOn) {
        toggle.classList.remove('on');
        item.classList.remove('active');
        hideLayer(map, layer);
      } else {
        toggle.classList.add('on');
        item.classList.add('active');
        showLayer(map, layer);
      }
    });
  });
}

function showLayer(map, layer) {
  if (layer === 'livability') {
    if (map.getLayer('neighborhood-fill')) map.setLayoutProperty('neighborhood-fill', 'visibility', 'visible');
    if (map.getLayer('neighborhood-outline')) map.setLayoutProperty('neighborhood-outline', 'visibility', 'visible');
  }
  if (layer === 'airquality') {
    if (map.getLayer('air-quality-layer')) map.setLayoutProperty('air-quality-layer', 'visibility', 'visible');
  }
  if (layer === 'noise') {
    if (map.getLayer('noise-layer')) map.setLayoutProperty('noise-layer', 'visibility', 'visible');
  }
  if (layer === 'greenspace') {
    if (map.getLayer('green-space-layer')) map.setLayoutProperty('green-space-layer', 'visibility', 'visible');
  }
}

function hideLayer(map, layer) {
  if (layer === 'livability') {
    if (map.getLayer('neighborhood-fill')) map.setLayoutProperty('neighborhood-fill', 'visibility', 'none');
    if (map.getLayer('neighborhood-outline')) map.setLayoutProperty('neighborhood-outline', 'visibility', 'none');
  }
  if (layer === 'airquality') {
    if (map.getLayer('air-quality-layer')) map.setLayoutProperty('air-quality-layer', 'visibility', 'none');
  }
  if (layer === 'noise') {
    if (map.getLayer('noise-layer')) map.setLayoutProperty('noise-layer', 'visibility', 'none');
  }
  if (layer === 'greenspace') {
    if (map.getLayer('green-space-layer')) map.setLayoutProperty('green-space-layer', 'visibility', 'none');
  }
}
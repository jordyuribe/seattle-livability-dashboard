import { updateLegend, initLegend } from '../components/legend.js';

export function initLayerToggles(map) {
  initLegend();

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
        updateLegend(layer, false);
      } else {
        toggle.classList.add('on');
        item.classList.add('active');
        showLayer(map, layer);
        updateLegend(layer, true);
      }
    });
  });
}

function showLayer(map, layer) {
  if (layer === 'livability') {
    if (map.getLayer('neighborhood-fill')) map.setLayoutProperty('neighborhood-fill', 'visibility', 'visible');
    if (map.getLayer('neighborhood-outline')) map.setLayoutProperty('neighborhood-outline', 'visibility', 'visible');
    updateLegend('livability');
  }
  if (layer === 'airquality') {
    if (map.getLayer('air-quality-layer')) map.setLayoutProperty('air-quality-layer', 'visibility', 'visible');
    updateLegend('airquality');
  }
  if (layer === 'noise') {
    if (map.getLayer('noise-buffer-layer')) map.setLayoutProperty('noise-buffer-layer', 'visibility', 'visible');
    if (map.getLayer('noise-layer')) map.setLayoutProperty('noise-layer', 'visibility', 'visible');
    updateLegend('noise');
  }
  if (layer === 'greenspace') {
    if (map.getLayer('park-boundary-fill')) map.setLayoutProperty('park-boundary-fill', 'visibility', 'visible');
    if (map.getLayer('park-boundary-outline')) map.setLayoutProperty('park-boundary-outline', 'visibility', 'visible');
    updateLegend('greenspace');
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
    if (map.getLayer('noise-buffer-layer')) map.setLayoutProperty('noise-buffer-layer', 'visibility', 'none');
    if (map.getLayer('noise-layer')) map.setLayoutProperty('noise-layer', 'visibility', 'none');
  }
  if (layer === 'greenspace') {
    if (map.getLayer('park-boundary-fill')) map.setLayoutProperty('park-boundary-fill', 'visibility', 'none');
    if (map.getLayer('park-boundary-outline')) map.setLayoutProperty('park-boundary-outline', 'visibility', 'none');
  }
}
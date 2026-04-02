// Manages map layer visibility based on sidebar toggle interactions
export function initLayerToggles(map) {

  // Get all layer toggle elements from the sidebar
  const layerItems = document.querySelectorAll('.layer-item');

  layerItems.forEach(item => {
    item.addEventListener('click', () => {
      const layer = item.dataset.layer;
      const toggle = item.querySelector('.layer-toggle');
      const isOn = toggle.classList.contains('on');

      // Flip the toggle state
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
}

function hideLayer(map, layer) {
  if (layer === 'livability') {
    if (map.getLayer('neighborhood-fill')) map.setLayoutProperty('neighborhood-fill', 'visibility', 'none');
    if (map.getLayer('neighborhood-outline')) map.setLayoutProperty('neighborhood-outline', 'visibility', 'none');
  }
}
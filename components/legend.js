// Track which layers are currently active
const activeLayers = {
  livability: true,
  airquality: false,
  noise: false,
  greenspace: false
};

// All legend configurations
const legends = {
    livability: {
    title: 'Livability Score',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #dc2626, #f97316, #fbbf24, #4ade80, #15803d)',
    labels: ['0', '25', '50', '75', '100'],
    noData: true  // show no data indicator
    },
    airquality: {
        title: 'Air Quality (AQI)',
        type: 'dots',
        items: [
        { color: '#7c3aed', label: 'Good (0-50)' },
        { color: '#a855f7', label: 'Moderate (51-100)' },
        { color: '#f97316', label: 'Unhealthy (101-150)' },
        { color: '#dc2626', label: 'Hazardous (150+)' }
        ]
    },
    noise: {
        title: 'Noise Level (dB)',
        type: 'dots',
        items: [
        { color: '#15803d', label: 'Safe (≤53 dB)' },
        { color: '#fbbf24', label: 'Moderate (54-65 dB)' },
        { color: '#f97316', label: 'High (66-75 dB)' },
        { color: '#dc2626', label: 'Severe (75+ dB)' }
        ]
    },
    greenspace: {
        title: 'Green Spaces',
        type: 'dots',
        items: [
        { color: '#15803d', label: 'Seattle Parks' }
        ]
    }
};

// Updates which layer is active and re-renders the legend
export function updateLegend(layer, isActive) {
  activeLayers[layer] = isActive;
  renderLegend();
}

// Renders all four legend sections — grays out inactive ones
function renderLegend() {
  const container = document.getElementById('legendScale');
  if (!container) return;

  container.innerHTML = Object.entries(legends).map(([key, legend]) => {
    const active = activeLayers[key];

    // Active layers show full legend
    // Inactive layers collapse to just the title with a dot indicator
    if (!active) {
      return `
        <div class="legend-section inactive">
          <div style="display:flex;align-items:center;gap:6px;opacity:0.35;">
            <div style="width:8px;height:8px;border-radius:2px;background:#ccc;flex-shrink:0;"></div>
            <div class="legend-title" style="margin:0;">${legend.title}</div>
          </div>
        </div>
      `;
    }

    let scaleHtml = '';

    if (legend.type === 'gradient') {
      scaleHtml = `
        <div class="legend-gradient" style="background:${legend.gradient};"></div>
        <div class="legend-labels">
          ${legend.labels.map(l => `<span>${l}</span>`).join('')}
        </div>
      `;
    } else if (legend.type === 'dots') {
      scaleHtml = `
        <div class="legend-dots">
          ${legend.items.map(item => `
            <div class="legend-dot-row">
              <div class="legend-dot" style="background:${item.color};"></div>
              <span>${item.label}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    if (legend.noData) {
        scaleHtml += `
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <div style="width:12px;height:12px;border-radius:2px;background:#e8f4f1;
                border:1px solid #b2d8d0;flex-shrink:0;"></div>
            <span style="font-size:9px;color:#a0a09a;">No data</span>
        </div>
        `;
    }

    return `
      <div class="legend-section">
        <div class="legend-title" style="margin-bottom:5px;">${legend.title}</div>
        ${scaleHtml}
      </div>
    `;
  }).join('');
}

// Initialize legend on load
export function initLegend() {
  renderLegend();
}
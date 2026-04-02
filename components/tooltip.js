// Creates the tooltip DOM element and appends it to the map container
export function initTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'map-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    background: white;
    border: 0.5px solid #e8e6e0;
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
    min-width: 180px;
    font-family: 'DM Sans', sans-serif;
  `;
  document.querySelector('.map-wrap').appendChild(tooltip);
  return tooltip;
}

// Shows tooltip at cursor position with neighborhood data
export function showTooltip(tooltip, point, props) {
  const scoreColor = getScoreColor(props.livability_score);

  tooltip.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:#1a1a18;margin-bottom:8px;">
      ${props.S_HOOD}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
      <span style="color:#6b6b65;">Air Quality (AQI)</span>
      <span style="font-weight:500;color:${getAQIColor(props.aqi)};">${props.aqi ?? '--'}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
      <span style="color:#6b6b65;">Noise Level</span>
      <span style="font-weight:500;color:#1a1a18;">60 dB</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:10px;">
      <span style="color:#6b6b65;">Green Coverage</span>
      <span style="font-weight:500;color:#1a1a18;">30%</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;
      border-top:0.5px solid #e8e6e0;padding-top:8px;">
      <span style="font-size:11px;font-weight:600;color:#1a1a18;">Livability Score</span>
      <span style="font-size:20px;font-weight:600;color:${scoreColor};">
        ${props.livability_score ?? '--'}
      </span>
    </div>
  `;

  // Position tooltip near cursor but keep it on screen
  const mapWrap = document.querySelector('.map-wrap');
  const rect = mapWrap.getBoundingClientRect();
  const x = point.x + 14;
  const y = point.y - 20;

  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
  tooltip.style.opacity = '1';
}

export function hideTooltip(tooltip) {
  tooltip.style.opacity = '0';
}

// Returns color matching the choropleth scale
function getScoreColor(score) {
  if (!score) return '#888';
  if (score >= 70) return '#15803d';
  if (score >= 55) return '#d97706';
  if (score >= 40) return '#f97316';
  return '#dc2626';
}

function getAQILabel(aqi) {
  if (!aqi && aqi !== 0) return 'No data';
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  return 'Hazardous';
}

function getAQIColor(aqi) {
  if (!aqi && aqi !== 0) return '#888';
  if (aqi <= 50)  return '#15803d';
  if (aqi <= 100) return '#d97706';
  if (aqi <= 150) return '#f97316';
  return '#dc2626';
}
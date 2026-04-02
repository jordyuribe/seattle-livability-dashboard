// Determines bar color based on how good or bad a value is
function getBarColor(type, value) {
  if (type === 'aqi') {
    if (value <= 50)  return '#15803d';
    if (value <= 100) return '#d97706';
    if (value <= 150) return '#f97316';
    return '#dc2626';
  }
  if (type === 'noise') {
    if (value <= 53) return '#15803d';
    if (value <= 65) return '#d97706';
    return '#dc2626';
  }
  if (type === 'green') return '#15803d';
  if (type === 'temp')  return '#1d6fa4';
  return '#888';
}

// Updates all sidebar elements with fresh data
export function updateSidebar(scores) {

  // Filter out null scores to compute averages
  const valid = Object.values(scores).filter(s => s !== null);
  if (valid.length === 0) return;

  // Compute Seattle-wide averages
  const avgAQI   = Math.round(valid.reduce((sum, s) => sum + s.aqi, 0) / valid.length);
  const avgScore = Math.round(valid.reduce((sum, s) => sum + s.score, 0) / valid.length);
  const avgGreen = Math.round(valid.reduce((sum, s) => sum + (s.greenPct || 0), 0) / valid.length);
  const avgNoise = Math.round(valid.reduce((sum, s) => sum + (s.noiseDb || 55), 0) / valid.length);


  // Update overall score card
  document.getElementById('overallScore').textContent = avgScore;
  document.getElementById('aqiAvg').textContent = avgAQI;

  // Update AQI metric card
  const aqiPct = Math.min(100, (avgAQI / 300) * 100);
  document.getElementById('aqiValue').textContent = avgAQI;
  document.getElementById('aqiBar').style.width = aqiPct + '%';
  document.getElementById('aqiBar').style.background = getBarColor('aqi', avgAQI);

  // Update green space card with real average
  document.getElementById('greenValue').textContent = avgGreen;
  document.getElementById('greenBar').style.width = avgGreen + '%';
  document.getElementById('greenBar').style.background = getBarColor('green', avgGreen);

  // update noise card with real average — assumes 40-90 dB range for scaling the bar
  document.getElementById('noiseValue').textContent = avgNoise;
  document.getElementById('noiseBar').style.width = Math.min(100, ((avgNoise - 40) / 50) * 100) + '%';
  document.getElementById('noiseBar').style.background = getBarColor('noise', avgNoise);
  document.getElementById('noiseAvg').textContent = avgNoise;

    document.getElementById('tempValue').textContent = 52;
    document.getElementById('tempBar').style.width = '35%';
    document.getElementById('tempBar').style.background = getBarColor('temp', 52);


  // Update alerts
  updateAlerts(scores);
}

// Checks for neighborhoods breaching thresholds and renders alerts
function updateAlerts(scores) {
  const alertsList = document.getElementById('alertsList');
  const alerts = [];

  Object.entries(scores).forEach(([name, data]) => {
    if (!data) return;

    // EPA threshold — Unhealthy for sensitive groups
    if (data.aqi > 100) {
      alerts.push(`<div class="alert-item">
        <strong>Poor Air Quality</strong> · ${name} — AQI ${data.aqi}
      </div>`);
    }
  });

  if (alerts.length === 0) {
    alertsList.innerHTML = '<div class="no-alerts">No active alerts</div>';
  } else {
    alertsList.innerHTML = alerts.join('');
  }
}
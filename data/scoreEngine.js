// ── NORMALIZATION HELPERS ──

// Clamp a value between a min and max
// allows a value to stay within range if a sensor starts reading numbers that
// don't make sense
// this will help normalize the scoring
function clamp (value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// 1. Environmental Burden (40%)
// inpired by the EPA Environmental Justice Index
// Uses EPA AQI breakpoints and WHO noises thresholds

// air quality index (AQI) scoring
function scoreAQI(aqi) {
    const clamped = clamp(aqi, 0, 300);
    if (clamped <= 50) return 100; // good
    if (clamped <= 100) return 80; // moderate
    if (clamped <= 150) return 60; // unhealhty for sensitive groups
    if (clamped <= 200) return 40; // unhealthy
    if (clamped <= 300) return 20; // very unhealthy
    return 0; // hazardous
}

// Convert raw PM2.5 reading to AQI using EPA breakpoints
export function pm25ToAQI(pm25) {
  const val = parseFloat(pm25);
  if (isNaN(val)) return 0;

  if (val <= 12.0)  return linear(50,  0,   12.0,  0.0,  val);
  if (val <= 35.4)  return linear(100, 51,  35.4,  12.1, val);
  if (val <= 55.4)  return linear(150, 101, 55.4,  35.5, val);
  if (val <= 150.4) return linear(200, 151, 150.4, 55.5, val);
  if (val <= 250.4) return linear(300, 201, 250.4, 150.5, val);
  if (val <= 350.4) return linear(400, 301, 350.4, 250.5, val);
  return linear(500, 401, 500.4, 350.5, val);
}

// EPA linear interpolation formula
function linear(aqiHigh, aqiLow, concHigh, concLow, concentration) {
  return Math.round(
    ((aqiHigh - aqiLow) / (concHigh - concLow)) *
    (concentration - concLow) +
    aqiLow
  );
}

// noise scoring
function scoreNoise(noise) {
    const clamped = clamp(noise, 40, 90);
    if (clamped <= 53) return 100; // WHO safe threshold
    if (clamped <= 58) return 80; // Moderate
    if (clamped <= 65) return 60; // WHO cardiovascular threshold
    if (clamped <= 75) return 35; // High
    return 10; // Severe
}

// scores combined environmental burden score
function scoreEnvionmental(aqi, noiseDB) {
    const aqiScore = scoreAQI(aqi);
    const noiseScore = scoreNoise(noiseDB);
    return Math.round((aqiScore * 0.60) + (noiseScore * 0.40));
}

// 2. Green Spaces Access (35%)
function scoreGreenAccess(greenPCT) {
    const clamped = clamp(greenPCT, 0, 100);
    return Math.round(clamped); // direct percentage score
}

// 3. Comfort (25%)
function scoreComfort(tempF) {
    const ideal = 62;
    const diff = Math.abs(tempF - ideal);
    return Math.round(Math.max(0, 100 - (diff * 3)));
}

// Main scoring
export function computeLivabilityScore({ aqi, noiseDb, greenPct, tempF}) {
    const enviroScore = scoreEnvionmental(aqi, noiseDb);
    const green = scoreGreenAccess(greenPct);
    const comfort = scoreComfort(tempF);

    return Math.round((enviroScore * 0.40) + (green * 0.35) + (comfort * 0.25));
}

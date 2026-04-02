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
export function computeLivabilityScore({ aqi, noiseDB, greenPCT, tempF}) {
    const enviroScore = scoreEnvionmental(aqi, noiseDB);
    const green = scoreGreenAccess(greenPCT);
    const comfort = scoreComfort(tempF);

    return Math.round((enviroScore * 0.40) + (green * 0.35) + (comfort * 0.25));
}

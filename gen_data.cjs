const fs = require("fs");

function utmToLatLng(easting, northing, zone) {
  const a = 6378137; const f = 1/298.257223563;
  const e = Math.sqrt(2*f - f*f); const e2 = e*e/(1-e*e);
  const k0 = 0.9996; const x = easting - 500000; const y = northing;
  const M = y / k0; const mu = M / (a*(1 - e*e/4 - 3*e*e*e*e/64 - 5*e*e*e*e*e*e/256));
  const e1 = (1 - Math.sqrt(1-e*e)) / (1 + Math.sqrt(1-e*e));
  const phi1 = mu + (3*e1/2 - 27*e1*e1*e1/32)*Math.sin(2*mu) + (21*e1*e1/16 - 55*e1*e1*e1*e1/32)*Math.sin(4*mu) + (151*e1*e1*e1/96)*Math.sin(6*mu) + (1097*e1*e1*e1*e1/512)*Math.sin(8*mu);
  const N1 = a / Math.sqrt(1 - e*e*Math.sin(phi1)*Math.sin(phi1));
  const T1 = Math.tan(phi1)*Math.tan(phi1);
  const C1 = e2*Math.cos(phi1)*Math.cos(phi1);
  const R1 = a*(1-e*e)/Math.pow(1-e*e*Math.sin(phi1)*Math.sin(phi1),1.5);
  const D = x/(N1*k0);
  const lat = phi1 - (N1*Math.tan(phi1)/R1)*(D*D/2 - (5+3*T1+10*C1-4*C1*C1-9*e2)*D*D*D*D/24 + (61+90*T1+298*C1+45*T1*T1-252*e2-3*C1*C1)*D*D*D*D*D*D/720);
  const lng = ((zone-1)*6 - 180 + 3) * Math.PI/180 + (D - (1+2*T1+C1)*D*D*D/6 + (5-2*C1+28*T1-3*C1*C1+8*e2+24*T1*T1)*D*D*D*D*D/120) / Math.cos(phi1);
  return [lng*180/Math.PI, lat*180/Math.PI]; // Note: GeoJSON is [lng, lat]
}

function reprojectGeoJSON(geojson) {
  if (!geojson) return null;
  const newGeo = JSON.parse(JSON.stringify(geojson));
  newGeo.crs = { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::4326" } };
  
  newGeo.features.forEach(feature => {
    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(ring => {
        return ring.map(coord => utmToLatLng(coord[0], coord[1], 37));
      });
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates = feature.geometry.coordinates.map(poly => {
        return poly.map(ring => {
          return ring.map(coord => utmToLatLng(coord[0], coord[1], 37));
        });
      });
    }
  });
  return newGeo;
}

const data = JSON.parse(fs.readFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\geocontrol-pro\\_parsed_data.json","utf8"));

let geojson_1 = null;
let geojson_2 = null;
let geojson_3A = null;
let geojson_3B = null;

try {
  geojson_1 = reprojectGeoJSON(JSON.parse(fs.readFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\section_1.geojson","utf8")));
} catch(e) {}
try {
  geojson_2 = reprojectGeoJSON(JSON.parse(fs.readFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\section_2.geojson","utf8")));
} catch(e) {}
try {
  geojson_3A = reprojectGeoJSON(JSON.parse(fs.readFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\section_3A.geojson","utf8")));
} catch(e) {}
try {
  geojson_3B = reprojectGeoJSON(JSON.parse(fs.readFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\section_3B.geojson","utf8")));
} catch(e) {}

const bhLines = data.boreholes.map(b => {
  return `  { id: '${b.id}', lat: ${b.lat}, lng: ${b.lng}, easting: ${b.easting}, northing: ${b.northing}, type: 'BH', status: 'planned', targetDepth: ${b.targetDepth}, section: '${b.section}', tests: ${JSON.stringify(b.tests)} },`
});

const cptLines = data.cpts.map(c => {
  return `  { id: '${c.id}', lat: ${c.lat}, lng: ${c.lng}, easting: ${c.easting}, northing: ${c.northing}, type: 'CPT', status: 'planned', targetDepth: 25, section: '${c.section}', tests: [{name: 'CPT', count: 1}] },`
});

const pltLines = data.plts.map(p => {
  return `  { id: '${p.id}', lat: ${p.lat}, lng: ${p.lng}, easting: ${p.easting}, northing: ${p.northing}, type: 'PLT', status: 'planned', targetDepth: 1.5, section: '${p.section}', tests: [{name: 'PLT', count: 1}] },`
});

const ts = `// Real project data from QIDDIYA COASTAL.xlsx
// Coordinates converted from UTM Zone 37N to WGS84

export interface SitePoint {
  id: string
  lat: number
  lng: number
  easting: number
  northing: number
  type: 'BH' | 'CPT' | 'PLT'
  status: 'completed' | 'in-progress' | 'on-hold' | 'planned'
  targetDepth: number
  section: string
  tests: {name: string, count: number}[]
}

export const mapCenter: [number, number] = [${data.center.lat.toFixed(6)}, ${data.center.lng.toFixed(6)}]

// ═══ BOREHOLES (${data.boreholes.length}) ═══
export const boreholePoints: SitePoint[] = [
${bhLines.join('\n')}
]

// ═══ CPT LOCATIONS (${data.cpts.length}) ═══
export const cptPoints: SitePoint[] = [
${cptLines.join('\n')}
]

// ═══ PLT LOCATIONS (${data.plts.length}) ═══
export const pltPoints: SitePoint[] = [
${pltLines.join('\n')}
]

export const allSitePoints: SitePoint[] = [...boreholePoints, ...cptPoints, ...pltPoints]

export const sections = ${JSON.stringify(data.sections)}

// ═══ GEOJSON POLYGONS (WGS84) ═══
export const sectionPolygons: Record<string, any> = {
  '1': ${geojson_1 ? JSON.stringify(geojson_1) : 'null'},
  '2': ${geojson_2 ? JSON.stringify(geojson_2) : 'null'},
  '3A': ${geojson_3A ? JSON.stringify(geojson_3A) : 'null'},
  '3B': ${geojson_3B ? JSON.stringify(geojson_3B) : 'null'}
}

// ═══ KPI DATA ═══
export const kpiData = {
  totalBoreholes: ${data.boreholes.length},
  totalCPT: ${data.cpts.length},
  totalPLT: ${data.plts.length},
  totalPoints: ${data.boreholes.length + data.cpts.length + data.plts.length},
  totalMetersDrilled: ${data.boreholes.reduce((s,b) => s + b.targetDepth, 0)},
  sections: ${JSON.stringify(data.sections)},
  budgetEfficiency: 92,
  daysToCompletion: 18,
  estimatedEnd: 'Nov 24',
}

// ═══ SOIL STRATA (Sample for sidebar) ═══
export const soilStrata = [
  { depthFrom: 0, depthTo: 5, type: 'Loose Sand (SP)', description: 'Yellowish-brown, fine to medium', color: '#d4a574' },
  { depthFrom: 5, depthTo: 12, type: 'Sandy Silt (SM)', description: 'Fine-grained, medium dense', color: '#92400e' },
  { depthFrom: 12, depthTo: 25, type: 'Firm Gray Clay (CH)', description: 'High plasticity, slickensides', color: '#475569' },
  { depthFrom: 25, depthTo: 40, type: 'Weathered Limestone', description: 'Fractured, moderately hard', color: '#57534e' },
  { depthFrom: 40, depthTo: 50, type: 'Competent Limestone', description: 'Hard, intact rock', color: '#374151' },
]

export const cptData = [
  { depth: 0.05, qc: 1.24, fs: 12.5, u2: 0.012, inclination: 0.1, soilClass: 'Sands' },
  { depth: 0.10, qc: 1.45, fs: 14.2, u2: 0.015, inclination: 0.1, soilClass: 'Sands' },
  { depth: 0.15, qc: 0.85, fs: 18.1, u2: 0.024, inclination: 0.2, soilClass: 'Clayey Silts' },
  { depth: 0.20, qc: 0.62, fs: 22.4, u2: 0.045, inclination: 0.2, soilClass: 'Clayey Silts' },
{ depth: 0.50, qc: 2.10, fs: 10.5, u2: 0.018, inclination: 0.3, soilClass: 'Sands' },
{ depth: 1.00, qc: 3.20, fs: 8.2, u2: 0.012, inclination: 0.2, soilClass: 'Gravelly Sands' },
{ depth: 1.50, qc: 1.80, fs: 15.7, u2: 0.035, inclination: 0.4, soilClass: 'Sandy Silts' },
{ depth: 2.00, qc: 0.45, fs: 28.3, u2: 0.082, inclination: 0.3, soilClass: 'Clays' },
{ depth: 2.50, qc: 0.38, fs: 32.1, u2: 0.095, inclination: 0.3, soilClass: 'Clays' },
{ depth: 3.00, qc: 0.92, fs: 19.6, u2: 0.042, inclination: 0.5, soilClass: 'Clayey Silts' },
{ depth: 3.50, qc: 1.55, fs: 14.8, u2: 0.028, inclination: 0.4, soilClass: 'Sandy Silts' },
{ depth: 4.00, qc: 2.85, fs: 9.3, u2: 0.015, inclination: 0.3, soilClass: 'Sands' },
{ depth: 5.00, qc: 4.20, fs: 6.1, u2: 0.008, inclination: 0.2, soilClass: 'Dense Sands' },
{ depth: 6.00, qc: 3.50, fs: 11.4, u2: 0.022, inclination: 0.3, soilClass: 'Silty Sands' },
{ depth: 7.00, qc: 1.10, fs: 24.5, u2: 0.065, inclination: 0.4, soilClass: 'Clays' },
{ depth: 8.00, qc: 0.72, fs: 30.2, u2: 0.088, inclination: 0.3, soilClass: 'Soft Clays' },
{ depth: 9.00, qc: 1.95, fs: 16.3, u2: 0.032, inclination: 0.5, soilClass: 'Sandy Silts' },
{ depth: 10.00, qc: 5.80, fs: 4.2, u2: 0.005, inclination: 0.2, soilClass: 'Dense Gravel' },
{ depth: 12.00, qc: 8.50, fs: 2.8, u2: 0.003, inclination: 0.1, soilClass: 'Limestone' },
{ depth: 15.00, qc: 12.00, fs: 1.5, u2: 0.001, inclination: 0.1, soilClass: 'Hard Limestone' },
]

export const pltData = [
  { settlement: 0, load: 0 },
  { settlement: 0.5, load: 50 },
  { settlement: 1.2, load: 100 },
  { settlement: 2.0, load: 150 },
  { settlement: 3.5, load: 200 },
  { settlement: 5.0, load: 250 },
  { settlement: 7.2, load: 280 },
  { settlement: 10.5, load: 310 },
  { settlement: 14.0, load: 320 },
  { settlement: 18.42, load: 320 },
  { settlement: 22.0, load: 325 },
]

export const rigs = [
  { id: 'GTX-400-01', model: 'Atlas Copco T3W', currentSite: 'Sector 7-G', status: 'drilling', nextMaint: '24 OCT 23' },
  { id: 'GTX-400-05', model: 'Schramm T450', currentSite: 'North Ridge', status: 'mobilizing', nextMaint: '12 NOV 23' },
  { id: 'GTX-250-09', model: 'Sandvik DE710', currentSite: 'BH-104', status: 'standby', nextMaint: 'IMMEDIATE' },
  { id: 'CPT-002', model: 'Pagani TG63-150', currentSite: 'CPT Cluster A', status: 'drilling', nextMaint: '15 DEC 23' },
  { id: 'RIG-008', model: 'Comacchio MC12', currentSite: 'BH-104', status: 'drilling', nextMaint: '02 JAN 24' },
]

export const personnel = [
  { name: 'Marcus Thorne', role: 'Lead Driller', shift: 'Night Shift', progress: 85 },
  { name: 'Sarah Chen', role: 'Geo-Tech', shift: 'Day Shift', progress: 40 },
  { name: 'David Miller', role: 'Rig Operator', shift: 'Rotation', progress: 65 },
]

export const consumables = [
  { name: 'Drilling Bits', current: 4, max: 20, unit: 'pcs', isLow: true },
  { name: 'Bentonite', current: 1200, max: 1600, unit: 'KG', isLow: false },
  { name: 'Fuel (Diesel)', current: 15, max: 100, unit: '%', isLow: true },
]

export const budgetData = [
  { category: 'Fuel', percentage: 75 },
  { category: 'Labor', percentage: 42 },
  { category: 'Consum.', percentage: 92 },
]

export const varianceData = [
  { site: 'Section 1', planned: 80, actual: 95 },
  { site: 'Section 2', planned: 60, actual: 55 },
  { site: 'Section 3A', planned: 90, actual: 40 },
  { site: 'Section 3B', planned: 50, actual: 70 },
]

export const lithologyLayers = [
  { percentage: 10, color: '#ffddb8', label: 'LOOSE SAND (SP)' },
  { percentage: 15, color: '#d4a574', label: 'SANDY SILT (SM)' },
  { percentage: 30, color: '#798098', label: 'FIRM CLAY (CH)' },
  { percentage: 25, color: '#57534e', label: 'WEATHERED LIMESTONE' },
  { percentage: 20, color: '#374151', label: 'COMPETENT LIMESTONE' },
]
`;

fs.writeFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\geocontrol-pro\\src\\data\\sampleData.ts", ts);
console.log("Generated sampleData.ts with reprojected WGS84 Polygons");

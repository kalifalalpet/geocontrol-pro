const XLSX = require("./node_modules/xlsx");
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
  return { lat: lat*180/Math.PI, lng: lng*180/Math.PI };
}

const wb = XLSX.readFile("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\QIDDIYA COASTAL.xlsx");

const bhWs = wb.Sheets[wb.SheetNames[0]];
const bhData = XLSX.utils.sheet_to_json(bhWs, {header:1, defval:""});
const boreholes = [];
for (let i = 1; i < bhData.length; i++) {
  const row = bhData[i];
  if (!row[0] || !row[1] || !row[2]) continue;
  const id = String(row[0]).trim();
  const easting = parseFloat(row[1]);
  const northing = parseFloat(row[2]);
  if (isNaN(easting) || isNaN(northing)) continue;
  const coords = utmToLatLng(easting, northing, 37);
  const depth = parseFloat(row[6]) || 0;
  const section = String(row[7] || "");
  const tests = [];
  if (row[13]) tests.push({ name: "PMT", count: parseInt(row[13]) || 1 });
  if (row[14]) tests.push({ name: "FHT", count: parseInt(row[14]) || 1 });
  if (row[15]) tests.push({ name: "PPT", count: parseInt(row[15]) || 1 });
  if (row[16]) tests.push({ name: "DST", count: parseInt(row[16]) || 1 });
  if (row[17]) tests.push({ name: "PZT", count: parseInt(row[17]) || 1 });
  
  let targetDepth = 0;
  if (row[11]) targetDepth = 50; else if (row[10]) targetDepth = 40; else if (row[9]) targetDepth = 30; else if (row[8]) targetDepth = 20; else targetDepth = depth;

  boreholes.push({
    id, easting, northing, lat: Math.round(coords.lat*1e6)/1e6, lng: Math.round(coords.lng*1e6)/1e6,
    targetDepth: targetDepth || depth, section,
    tests: tests.length ? tests : [{ name: "Core Recovery", count: 1 }],
    testString: String(row[12] || "")
  });
}

const cptWs = wb.Sheets["CPT"];
const cptRaw = XLSX.utils.sheet_to_json(cptWs, {header:1, defval:""});
const cpts = [];
for (let i = 1; i < cptRaw.length; i++) {
  const row = cptRaw[i];
  if (!row[0] || !row[1] || !row[2]) continue;
  const id = String(row[0]).trim();
  const easting = parseFloat(row[1]);
  const northing = parseFloat(row[2]);
  if (isNaN(easting) || isNaN(northing)) continue;
  const coords = utmToLatLng(easting, northing, 37);
  const section = String(row[3] || "");
  cpts.push({ id, easting, northing, lat: Math.round(coords.lat*1e6)/1e6, lng: Math.round(coords.lng*1e6)/1e6, section });
}

const pltWs = wb.Sheets["PLT"];
const pltRaw = XLSX.utils.sheet_to_json(pltWs, {header:1, defval:""});
const plts = [];
for (let i = 1; i < pltRaw.length; i++) {
  const row = pltRaw[i];
  if (!row[0] || !row[1] || !row[2]) continue;
  const id = String(row[0]).trim();
  const easting = parseFloat(row[1]);
  const northing = parseFloat(row[2]);
  if (isNaN(easting) || isNaN(northing)) continue;
  const coords = utmToLatLng(easting, northing, 37);
  const section = String(row[3] || "");
  plts.push({ id, easting, northing, lat: Math.round(coords.lat*1e6)/1e6, lng: Math.round(coords.lng*1e6)/1e6, section });
}

const allLats = [...boreholes.map(b=>b.lat), ...cpts.map(c=>c.lat), ...plts.map(p=>p.lat)];
const allLngs = [...boreholes.map(b=>b.lng), ...cpts.map(c=>c.lng), ...plts.map(p=>p.lng)];
const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;

const sections = [...new Set([...boreholes.map(b=>b.section), ...cpts.map(c=>c.section), ...plts.map(p=>p.section)])].filter(Boolean);

fs.writeFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\geocontrol-pro\\_parsed_data.json", JSON.stringify({boreholes, cpts, plts, center: {lat: centerLat, lng: centerLng}, sections}, null, 2));
console.log("Updated _parsed_data.json with easting/northing");

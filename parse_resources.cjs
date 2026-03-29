const XLSX = require("./node_modules/xlsx");
const fs = require("fs");

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

const wb = XLSX.readFile("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\resources.xlsx");

// Parse Personnels
const perWs = wb.Sheets["Personels"];
const perData = XLSX.utils.sheet_to_json(perWs, {header:1, defval:""});
const personnels = [];
// Skip header (row 0)
for (let i = 1; i < perData.length; i++) {
  const row = perData[i];
  if (!row[0] || !row[3]) continue;
  personnels.push({
    slNo: row[0],
    designation: String(row[1] || '').trim(),
    responsibility: String(row[2] || '').trim(),
    name: String(row[3] || '').trim(),
    id: String(row[4] || '').trim(),
    location: String(row[5] || '').trim(),
    shift: String(row[6] || '').trim(),
    joinedYear: row[7] || ''
  });
}

// Parse Assets
const assetWs = wb.Sheets["Assets"];
const assetData = XLSX.utils.sheet_to_json(assetWs, {header:1, defval:""});
const assets = [];
// Skip header (row 0)
for (let i = 1; i < assetData.length; i++) {
  const row = assetData[i];
  if (!row[0] || !row[1] || !row[2]) continue;
  
  let calibDate = typeof row[6] === 'number' ? excelDateToJSDate(row[6]) : String(row[6] || '').trim();
  let dueDate = typeof row[8] === 'number' ? excelDateToJSDate(row[8]) : String(row[8] || '').trim();
  if (calibDate === 'N/A') calibDate = null;
  if (dueDate === 'N/A' || !dueDate) dueDate = null;

  assets.push({
    slNo: row[0],
    assetType: String(row[1] || '').trim(),
    assetId: String(row[2] || '').trim(),
    modelNumber: String(row[3] || '').trim(),
    manufacturedYear: row[4] || '',
    calibrationStatus: String(row[5] || '').trim(),
    calibratedDate: calibDate,
    calibrationPeriodDays: row[7] || null,
    calibrationDueDate: dueDate,
    conditionRemark: String(row[9] || '').trim()
  });
}

// Write to resourceData.ts
const output = `// Auto-generated from resources.xlsx
export interface Personnel {
  slNo: number | string;
  designation: string;
  responsibility: string;
  name: string;
  id: string;
  location: string;
  shift: string;
  joinedYear: number | string;
}

export interface Asset {
  slNo: number | string;
  assetType: string;
  assetId: string;
  modelNumber: string;
  manufacturedYear: string | number;
  calibrationStatus: string;
  calibratedDate: string | null;
  calibrationPeriodDays: number | string | null;
  calibrationDueDate: string | null;
  conditionRemark: string;
}

export const initialPersonnels: Personnel[] = ${JSON.stringify(personnels, null, 2)};

export const initialAssets: Asset[] = ${JSON.stringify(assets, null, 2)};
`;

fs.writeFileSync("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\geocontrol-pro\\src\\data\\resourceData.ts", output);
console.log("Generated src/data/resourceData.ts successfully.");

const XLSX = require("./node_modules/xlsx");

const wb = XLSX.readFile("c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\resources.xlsx");

for (const sheetName of wb.SheetNames) {
  console.log("=== SHEET:", sheetName, "===");
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header: 1});
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(data[i]);
  }
}

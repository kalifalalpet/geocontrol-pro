const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('c:\\Users\\mabdulla\\Documents\\Antigravity\\GEO MANAGE\\data\\BH-003.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("NUM PAGES", data.numpages);
    console.log("TEXT SAMPLE:");
    console.log(data.text.substring(0, 1500));
}).catch(e => {
    console.error(e);
});

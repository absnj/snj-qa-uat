
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const XLSX_PATH = path.join(__dirname, '../tests/data/uat-matrix.xlsx');
const CSV_PATH = path.join(__dirname, '../tests/data/uat-matrix.csv');

const workbook = XLSX.readFile(XLSX_PATH);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const csv = XLSX.utils.sheet_to_csv(worksheet);

fs.writeFileSync(CSV_PATH, csv, 'utf8');
console.log('✓ Converted uat-matrix.xlsx → uat-matrix.csv');
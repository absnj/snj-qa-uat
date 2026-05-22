const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, '.env');
const CSV_PATH = path.join(ROOT, '../tests/data/uat-matrix.csv');
const OUT_DIR = path.join(ROOT, '../tests/generated');

// FILTER: Modules to generate from command-line arguments
// Usage:
//   node generator.js                                    # All modules
//   node generator.js --modules "User Management"        # Single module
//   node generator.js --modules "User Management,Support" # Multiple modules
//   node generator.js --help                             # Show help

const args = process.argv.slice(2);
let MODULES_TO_GENERATE = [];

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Test Generator - Module Filtering

USAGE:
  node generator.js [OPTIONS]

OPTIONS:
  --modules <list>    Comma-separated module names to generate
  --help, -h         Show this help message

EXAMPLES:
  # Generate all modules
  node generator.js

  # Generate User Management only
  node generator.js --modules "User Management"

  # Generate User Management and Support
  node generator.js --modules "User Management,Support"

AVAILABLE MODULES:
  (Run without --modules to see available modules)
`);
  process.exit(0);
}

const modulesArg = args.find((arg, i) => {
  return arg === '--modules' && args[i + 1];
});

if (modulesArg) {
  const modulesIndex = args.indexOf('--modules');
  const modulesValue = args[modulesIndex + 1];
  MODULES_TO_GENERATE = modulesValue
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
}

dotenv.config({ path: ENV_PATH });

const FLOW_SIGNATURES = require('../flow-signatures.js');

function readFileRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8').trim();
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift()).map(h => h.trim());

  return lines.map(line => {
    const columns = splitCsvLine(line).map(cell =>
      cell.trim().replace(/^"|"$/g, '')
    );

    return headers.reduce((row, header, index) => {
      row[header] = columns[index] || '';
      return row;
    }, {});
  });
}

function splitCsvLine(line) {
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
}

function slug(value) {
  return normalizeRole(value).toLowerCase().replace(/[/_]+/g, '-');
}

function normalizeRole(role) {
  return String(role || 'UNKNOWN')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeSingleQuotes(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getScenarioText(row) {
  return [
    row['Test Scenario'],
    row['Operation'],
    row['Feature/Module'],
    row['Expected Behavior'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isLoginScenario(row) {
  return /login|sign in|sign-in|authenticate|credentials/.test(
    getScenarioText(row)
  );
}

function hasFlow(row) {
  return Boolean(row['Flow'] && row['Flow'].trim());
}

function getFlowFunctionName(row) {
  return row['Flow'].trim().split('(')[0].trim();
}

function buildFlowCall(flowName, normalizedRole) {
  const params = FLOW_SIGNATURES[flowName];

  if (!params) {
    throw new Error(
      `Unknown flow "${flowName}". Add it to FLOW_SIGNATURES before generating tests.`
    );
  }

  const args = params.map(param => {
    if (param === 'normalizedRole') return `'${normalizedRole}'`;
    return param;
  });

  return `await flows.${flowName}(${args.join(', ')});`;
}

function buildTestTitle(row) {
  const scenario = row['Test Scenario'] || 'Untitled scenario';
  const feature = row['Feature/Module'] || 'Unknown module';
  const operation = row['Operation'] || 'Unknown operation';

  return escapeSingleQuotes(`${scenario} [${feature} | ${operation}]`);
}

function renderMetadata(row, indent = '    ') {
  return [
    `${indent}// Role: ${row['Role'] || ''}`,
    `${indent}// Feature/Module: ${row['Feature/Module'] || ''}`,
    `${indent}// Operation: ${row['Operation'] || ''}`,
    `${indent}// Expected Behavior: ${row['Expected Behavior'] || ''}`,
  ];
}

function renderTestBody(row, normalizedRole, indent = '    ') {
  const lines = renderMetadata(row, indent);

  lines.push('');

  if (!hasFlow(row)) {
    lines.push(`${indent}// TODO: Add a Flows value in the UAT matrix.`);
    lines.push(`${indent}// Example: loginAs, createTicketSuccess, navigateToSupport`);
    return { implemented: false, lines };
  }

  const flowName = getFlowFunctionName(row);
  lines.push(`${indent}${buildFlowCall(flowName, normalizedRole)}`);

  return { implemented: true, lines };
}

function renderTest(row, normalizedRole, indent = '  ') {
  const testTitle = buildTestTitle(row);
  const { implemented, lines } = renderTestBody(row, normalizedRole, indent + '  ');
  const marker = implemented ? 'test' : 'test.skip';

  return [
    `${indent}${marker}('${testTitle}', async ({ page, context }) => {`,
    ...lines,
    `${indent}});`,
    '',
  ].join('\n');
}

function generateFile(role, roleRows) {
  const normalizedRole = normalizeRole(role);
  const title = escapeSingleQuotes(`UAT matrix role: ${role}`);

  const loginRows = roleRows.filter(isLoginScenario);
  const featureRows = roleRows.filter(row => !isLoginScenario(row));

  const output = [];

  output.push(`import { test } from '@playwright/test';`);
  output.push(`import * as flows from '../flows';`);
  output.push('');
  output.push(`test.describe('${title}', () => {`);
  output.push('');

  for (const row of loginRows) {
    output.push(renderTest(row, normalizedRole, '  '));
  }

  if (featureRows.length > 0) {
    output.push(`  test.describe('Feature tests', () => {`);
    output.push(`    test.beforeEach(async ({ page }) => {`);
    output.push(`      await flows.loginAs(page, '${normalizedRole}');`);
    output.push(`    });`);
    output.push('');

    for (const row of featureRows) {
      output.push(renderTest(row, normalizedRole, '    '));
    }

    output.push(`  });`);
    output.push('');
  }

  output.push(`});`);
  output.push('');

  return output.join('\n');
}

function groupRowsByRole(rows) {
  return rows.reduce((acc, row) => {
    const role = row['Role'] || 'Unknown';

    if (/^all roles$/i.test(role)) return acc;

    acc[role] = acc[role] || [];
    acc[role].push(row);

    return acc;
  }, {});
}

function validateRows(rows) {
  const unknownFlows = new Set();

  for (const row of rows) {
    if (!hasFlow(row)) continue;

    const flowName = getFlowFunctionName(row);

    if (!FLOW_SIGNATURES[flowName]) {
      unknownFlows.add(flowName);
    }
  }

  if (unknownFlows.size > 0) {
    throw new Error(
      `Unknown flow(s): ${Array.from(unknownFlows).join(', ')}\n` +
        `Add them to FLOW_SIGNATURES.`
    );
  }
}

function shouldGenerateModule(moduleName) {
  // If MODULES_TO_GENERATE is empty, generate all modules
  if (MODULES_TO_GENERATE.length === 0) {
    return true;
  }

  // Otherwise, only generate modules in the list (case-insensitive)
  return MODULES_TO_GENERATE.some(
    m => m.toLowerCase() === moduleName.toLowerCase()
  );
}

function main() {
  const csvContent = readFileRequired(CSV_PATH);
  const rows = parseCsv(csvContent);

  validateRows(rows);

  // Get unique modules from CSV
  const allModules = new Set(rows.map(row => row['Feature/Module']).filter(Boolean));

  // Log what we're generating
  console.log('\n=== Test Generation ===');
  console.log(`Command: node generator.js ${args.length > 0 ? args.join(' ') : '(all modules)'}`);
  console.log('');
  if (MODULES_TO_GENERATE.length === 0) {
    console.log('Mode: Generating ALL modules');
    console.log(`Modules found: ${Array.from(allModules).join(', ')}`);
  } else {
    console.log(`Mode: Filtering by module`);
    console.log(`Modules to generate: ${MODULES_TO_GENERATE.join(', ')}`);
    console.log(`Available modules: ${Array.from(allModules).join(', ')}`);
  }
  console.log('');

  // Filter rows by module
  const filteredRows = rows.filter(row => 
    shouldGenerateModule(row['Feature/Module'])
  );

  if (filteredRows.length === 0) {
    console.warn('⚠️  No rows matched the module filter. Nothing to generate.');
    return;
  }

  const grouped = groupRowsByRole(filteredRows);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [role, roleRows] of Object.entries(grouped)) {
    const fileName = `uat-${slug(role)}.spec.ts`;
    const filePath = path.join(OUT_DIR, fileName);

    fs.writeFileSync(filePath, generateFile(role, roleRows), 'utf8');

    console.log(`✓ Generated ${path.relative(process.cwd(), filePath)}`);
  }

  console.log('\n✓ Done');
}

main();
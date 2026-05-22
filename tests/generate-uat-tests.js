const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, '.env');
const CSV_PATH = path.join(ROOT, 'data/uat-matrix.csv');
const OUT_DIR = path.join(ROOT, 'generated');

dotenv.config({ path: ENV_PATH });

const FLOW_SIGNATURES = {
  loginAs: ['page', 'normalizedRole'],
  loginWithInvalidCredentials: ['page', 'context', 'normalizedRole'],

  navigateToSupport: ['page'],
  createTicketSuccess: ['page'],
  createTicketEmptySubject: ['page'],
  createTicketEmptyDescription: ['page'],
  createTicketLongSubject: ['page'],
  createLengthyTicketDescription: ['page'],
};

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
  return normalizeRole(value).toLowerCase().replace(/_/g, '-');
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
    lines.push(`${indent}// TODO: Add a Flow value in the UAT matrix.`);
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
  output.push(`import * as flows from '../helpers';`);
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

function main() {
  const csvContent = readFileRequired(CSV_PATH);
  const rows = parseCsv(csvContent);

  validateRows(rows);

  const grouped = groupRowsByRole(rows);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [role, roleRows] of Object.entries(grouped)) {
    const fileName = `uat-${slug(role)}.spec.ts`;
    const filePath = path.join(OUT_DIR, fileName);

    fs.writeFileSync(filePath, generateFile(role, roleRows), 'utf8');

    console.log(`Generated ${path.relative(process.cwd(), filePath)}`);
  }
}

main();
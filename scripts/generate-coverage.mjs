#!/usr/bin/env node
/**
 * Regenerates docs/COVERAGE.md from the real test inventory.
 *
 * Reads `playwright test --list --reporter=json`, which parses every spec and
 * resolves every role-describe loop without contacting UAT, so the output is
 * what the runner would actually execute rather than a hand-maintained list.
 *
 * Deliberately emits no timestamp: regenerating when nothing changed must
 * produce a byte-identical file, so a diff always means coverage moved.
 *
 * Usage: npm run docs:coverage
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const OUTPUT = 'docs/COVERAGE.md';

/** Column order and short labels for the project columns. */
const PROJECTS = [
  ['merchant-admin', 'MA'],
  ['merchant-staff', 'MS'],
  ['branch-admin', 'BA'],
  ['branch-staff', 'BS'],
  ['sales-agent', 'SA'],
  ['merchant-success-staff', 'MSS'],
  ['api', 'API'],
];

function listTests() {
  const raw = execFileSync(
    'npx',
    ['playwright', 'test', '--list', '--reporter=json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  // The json reporter prints only the JSON document on stdout, but be tolerant
  // of a leading dotenv/config banner.
  return JSON.parse(raw.slice(raw.indexOf('{')));
}

function collectSpecs(report) {
  const specs = [];
  (function walk(node) {
    for (const suite of node.suites ?? []) walk(suite);
    for (const spec of node.specs ?? []) specs.push(spec);
  })(report);
  return specs;
}

/** skip/fixme are annotations; anything else is a test that really runs. */
function statusOf(test) {
  const types = new Set(test.annotations.map((a) => a.type));
  if (types.has('fixme')) return 'fixme';
  if (types.has('skip')) return 'skip';
  return 'active';
}

function tally(entries) {
  const counts = { active: 0, skip: 0, fixme: 0 };
  for (const entry of entries) counts[entry.status] += 1;
  return counts;
}

/** "53", "32 · 4 fixme", "26 skip" — omit the parts that are zero. */
function countCell({ active, skip, fixme }) {
  const parts = [];
  if (active) parts.push(String(active));
  if (skip) parts.push(`${skip} skip`);
  if (fixme) parts.push(`${fixme} fixme`);
  return parts.length ? parts.join(' · ') : '·';
}

function build() {
  const specs = collectSpecs(listTests());

  /** One row per (file, title, project) — the runner's actual unit of work. */
  const rows = [];
  for (const spec of specs) {
    for (const test of spec.tests) {
      rows.push({
        file: spec.file,
        title: spec.title,
        project: test.projectName,
        status: statusOf(test),
      });
    }
  }

  const files = [...new Set(rows.map((r) => r.file))].sort();
  const out = [];

  out.push('# Test Coverage');
  out.push('');
  out.push(
    'Generated from `npx playwright test --list` by `npm run docs:coverage`. ' +
      '**Do not edit by hand** — regenerate it after adding, removing or retagging a test.',
  );
  out.push('');
  out.push(
    'This is the inventory only: it says what the suite *would run*, not what last passed. ' +
      'For why a scenario is skipped or fixme\'d, see [README\'s Known Gaps](../README.md#known-gaps-and-in-progress-work).',
  );
  out.push('');

  // ---- totals -------------------------------------------------------------
  const totals = tally(rows);
  out.push(
    `**${totals.active} active** test runs across ${files.length} spec files and ` +
      `${new Set(rows.map((r) => r.project)).size} projects` +
      `, plus ${totals.skip} skipped and ${totals.fixme} fixme.`,
  );
  out.push('');
  out.push(
    'A "test run" is one test case in one project — a case covering three roles counts three times, ' +
      'because that is three executions against three different permission sets.',
  );
  out.push('');

  // ---- by project ---------------------------------------------------------
  out.push('## By role project');
  out.push('');
  out.push('| Project | Active | Skipped | Fixme |');
  out.push('|---|---:|---:|---:|');
  for (const [project] of PROJECTS) {
    const counts = tally(rows.filter((r) => r.project === project));
    const total = counts.active + counts.skip + counts.fixme;
    out.push(
      `| \`${project}\` | ${counts.active || '—'} | ${counts.skip || '—'} | ${counts.fixme || '—'} |` +
        (total === 0 ? ' ' : ''),
    );
  }
  out.push('');

  // ---- matrix -------------------------------------------------------------
  out.push('## Matrix — spec file × project');
  out.push('');
  out.push(`Counts are active test runs; \`·\` means the file contributes nothing to that project.`);
  out.push('');
  out.push(`| Spec | ${PROJECTS.map(([, s]) => s).join(' | ')} | Total |`);
  out.push(`|---|${PROJECTS.map(() => '---:').join('|')}|---:|`);
  for (const file of files) {
    const cells = PROJECTS.map(([project]) => {
      const counts = tally(rows.filter((r) => r.file === file && r.project === project));
      return counts.active || (counts.skip + counts.fixme ? `(${counts.skip + counts.fixme})` : '·');
    });
    const counts = tally(rows.filter((r) => r.file === file));
    out.push(`| \`${file}\` | ${cells.join(' | ')} | ${countCell(counts)} |`);
  }
  out.push('');
  out.push(
    `Legend: ${PROJECTS.map(([p, s]) => `**${s}** ${p}`).join(' · ')}. ` +
      'A number in parentheses is skipped/fixme only.',
  );
  out.push('');

  // ---- per-file detail ----------------------------------------------------
  out.push('## Cases by spec file');
  out.push('');
  for (const file of files) {
    const fileRows = rows.filter((r) => r.file === file);
    const counts = tally(fileRows);
    out.push(`### \`${file}\``);
    out.push('');
    out.push(
      `${countCell(counts)} test runs across ${new Set(fileRows.map((r) => r.title)).size} cases.`,
    );
    out.push('');
    out.push('| Case | Projects | Status |');
    out.push('|---|---|---|');

    const titles = [...new Set(fileRows.map((r) => r.title))];
    for (const title of titles) {
      const matching = fileRows.filter((r) => r.title === title);
      const shortNames = PROJECTS.filter(([project]) =>
        matching.some((r) => r.project === project),
      ).map(([, short]) => short);
      const statuses = [...new Set(matching.map((r) => r.status))];
      const status =
        statuses.length === 1
          ? { active: 'active', skip: '**skip**', fixme: '**fixme**' }[statuses[0]]
          : `mixed (${statuses.join(', ')})`;
      out.push(`| ${title.replace(/\|/g, '\\|')} | ${shortNames.join(', ')} | ${status} |`);
    }
    out.push('');
  }

  return `${out.join('\n').trimEnd()}\n`;
}

writeFileSync(OUTPUT, build());
console.log(`Wrote ${OUTPUT}`);

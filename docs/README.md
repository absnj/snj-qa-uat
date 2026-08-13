# Docs index

Four docs, each with a distinct job. Start with the one matching what you're doing.

| Doc | Read it when |
|---|---|
| [`../README.md`](../README.md) | Onboarding. What exists today, how to run it, where the known gaps are. |
| [`../AGENTS.md`](../AGENTS.md) | Writing or changing a test. The enforced style guide — locator hierarchy, fixture rules, forbidden patterns. (`CLAUDE.md` is a one-line import of it.) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Extending the framework itself — a new page object, fixture, or API client. How the pieces are built and why. |
| [`MAINTAINERS.md`](./MAINTAINERS.md) | Reacting to a change. Playbooks (new role, new spec module, new API endpoint, UI selector changed) plus a shared-UAT troubleshooting guide. |
| [`COVERAGE.md`](./COVERAGE.md) | Asking "is X tested, and by which roles?" Every case, the projects that run it, and its skip/fixme status. Generated — run `npm run docs:coverage`, never hand-edit. |
| [`AGENT-TRIAGE.md`](./AGENT-TRIAGE.md) | Understanding or changing the CI failure-triage agent that opens fix PRs. |
| [`njoybook-test-plan.md`](./njoybook-test-plan.md) | Picking the next NJoyBook scenario to write. A backlog of originally scoped coverage — **not** current-state documentation. |

Two more references that aren't prose docs:

- `tests/pages/sales-crm/README.md` — why the CRM page objects look the way they do (Vue + radix-vue markup with no accessible-name contract), and the app behaviour that constrains CRM specs.
- `schema.json` — captured API request/response examples, the source of truth for field names when adding API coverage.

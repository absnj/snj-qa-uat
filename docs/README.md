# Docs index

Start with the one matching what you're doing.

| Doc | Read it when |
|---|---|
| [`../HANDOVER.md`](../HANDOVER.md) | Setting this up for the first time. Getting it running locally and in GitHub Actions. |
| [`../README.md`](../README.md) | What the suite covers today, how to run it, what's still missing. |
| [`../AGENTS.md`](../AGENTS.md) | Writing or changing a test. The rules — locators, fixtures, what's banned. (`CLAUDE.md` just imports this.) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Adding a new page object, fixture, or API client. How the pieces fit and why. |
| [`MAINTAINERS.md`](./MAINTAINERS.md) | Something changed and a test broke. Step-by-step guides plus common UAT gotchas. |
| [`COVERAGE.md`](./COVERAGE.md) | "Is X tested, and by which roles?" Generated — run `npm run docs:coverage`, never edit by hand. |
| [`AGENT-TRIAGE.md`](./AGENT-TRIAGE.md) | Understanding or changing the agent that triages CI failures. |
| [`njoybook-test-plan.md`](./njoybook-test-plan.md) | Picking the next NJoyBook scenario to write. A backlog — **not** a description of what exists. |

Two more references that aren't prose:

- `tests/pages/sales-crm/README.md` — why the CRM page objects look the way they do, and the app behaviour that limits CRM tests.
- `schema.json` — recorded API requests and responses. The source of truth for field names.

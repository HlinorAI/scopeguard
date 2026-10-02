# PROJECT_PLAN — ScopeGuard

Client-side scope-drift analyzer for agencies: upload a SOW/scope document and
a communication export, run deterministic YAML rules, review findings, mark
in-scope versus change request. All parsing happens in the browser
(localStorage persistence); no server-side analysis.

Current state (2026-10-02): public, active, version 0.2.0, hosted pilot at
scopeguard.hlinor.com; React 19 + Vite 8 + TypeScript, Vitest 4 test suite
(20 tests), single-file Cloudflare-Workers-style bundle built by
`scripts/prepare-site-worker.mjs`.

Governance: the portfolio agent contract and coordination workflow live
outside this repository (shared workspace, not published here). Product
changes go through bounded implementation tasks, independent review, explicit
Owner acceptance, and a Git-only remote stage.

Security maintenance (SCOPEGUARD-NPM-002): the three confirmed npm advisories
are closed by targeted updates (nanoid 3.3.19, yaml 2.8.3, vitest 4.1.11 with
its @vitest/* packages), with dependency floors raised in package.json so the
safe minimums are protected. No behavioral or runtime-rule changes.

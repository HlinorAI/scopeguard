# ScopeGuard — Product Status and Development Plan

Status date: August 2, 2026

## 1. What ScopeGuard is

ScopeGuard is a scope-drift control tool for agencies, studios and client-service teams.

It compares:

- what was agreed in an SOW, contract, proposal or brief;
- what the client later writes in working channels;
- what additional work the team may start doing for free.

The product asks one practical question:

> Is this request already covered by the agreement, or does it need a separate change request?

ScopeGuard does not replace an account manager, project manager or legal review. It helps the team spot potential scope drift early and collect the evidence needed for a decision.

## Distribution model

The product has two distinct surfaces:

1. **Hosted user-facing app** — for finance, sales, account and delivery teams. It must work in a browser with a shared link, sign-in and no terminal usage.
2. **Open-source repository** — for developers, contributors and technical operators who inspect, extend or self-host the core.

Finance and sales users are not expected to use GitHub, Node.js or npm. The hosted browser pilot is now available at https://scopeguard.atvbox.chatgpt.site. The current release is private, local-first and intentionally limited: it does not yet persist projects, decisions or team history.

## 2. How the current MVP works

```text
SOW / contract + client communication
                ↓
          Local file upload
                ↓
        Source normalization
                ↓
          YAML rule analysis
                ↓
       Evidence-backed findings
                ↓
            Human review
                ↓
       In scope or change request
```

The current workflow is:

1. Upload a scope document.
2. Upload a communication export.
3. Run the analysis.
4. Review potential scope-drift findings.
5. Check the original quote and the closest scope clause.
6. Add an optional note.
7. Mark the finding as `in scope` or `change request`.

## 3. What is already implemented

### Application

- Working React/Vite interface.
- Project review workspace.
- Project list and active project.
- Source panel.
- File upload through browse and drag-and-drop.
- Responsive desktop and mobile layout.
- Local browser-side file processing.

### Supported sources

| Source | Current method | Status |
| --- | --- | --- |
| SOW / contract / brief | TXT, MD | Working |
| Gmail and other email services | EML or text export | Working through export |
| Slack | JSON or text export | Working through export |
| Telegram | JSON export | Working through export |
| WhatsApp | TXT chat export | Working through export |
| Facebook Messenger | JSON export | Supported through export |
| PDF | PDF file | Adapter planned |
| DOCX | Word file | Adapter planned |
| CRM / ERP | CSV, XLSX, API and structured records | Not part of the open-source MVP |

Email is treated as a provider-neutral channel rather than a Gmail-only feature. Future private integrations may include Outlook, Apple/iCloud, Proton, Yandex, Mail.ru and custom-domain mailboxes.

### Analysis

The current `src/rules.yaml` contains four rule types:

- `NEW DELIVERABLE` — a new deliverable or feature;
- `ACCEPTANCE CRITERIA` — changed expectations or requirements;
- `EXTRA REVISION` — an additional revision round;
- `UNPRICED COMMITMENT` — a promise to deliver work without an obvious price.

Each finding contains:

- risk type;
- generated title;
- original message excerpt;
- source;
- closest scope clause;
- severity;
- confidence;
- estimated hours at risk.

### Human-in-the-loop review

Each finding supports:

- `Mark in scope` — the request is genuinely covered;
- `Create change request` — the request needs approval, pricing or a new estimate;
- `Reopen` — return the decision to the review queue;
- an optional reviewer note.

Available filters:

- all findings;
- high risk;
- unreviewed only.

## 4. Pilot focus

The first commercial pilot should focus on three channels:

1. Slack.
2. Gmail.
3. WhatsApp.

The pilot should start with exports to validate the workflow itself:

- whether the product finds real scope-drift events;
- whether account and delivery teams understand the findings;
- whether findings lead to change requests;
- whether the team can protect measurable hours and revenue.

Slack, Gmail and WhatsApp connectors are part of the open-source pilot scope. The pilot can start with exports and then add approved APIs, OAuth and secure import methods. WhatsApp needs a separate distinction between personal chats and WhatsApp Business flows.

## 5. Open-source and paid-product boundary

### The open-source repository includes

- local TXT, MD, EML and JSON ingestion;
- local parser and analyzer;
- transparent YAML rules;
- evidence-backed findings;
- manual review workflow;
- demo fixtures;
- responsive UI;
- Slack/Gmail/WhatsApp pilot connector adapters;
- documentation;
- a way to inspect how a decision is produced.

### The closed, paid layer includes

- CRM/ERP adapters;
- additional mailbox, project-management and messaging integrations;
- hosted storage;
- workspaces and teams;
- roles and permissions;
- audit history;
- notifications;
- production exports;
- change-request document generation;
- automation;
- billing;
- enterprise controls.

The packaging principle is:

> Open source makes the product core inspectable and verifiable. The paid layer saves time through integrations, storage, collaboration and automation.

## 6. CRM and ERP

CRM and ERP are part of the planned architecture, but are not shipped as ready-to-use functionality in the open-source MVP.

The future private layer may connect to:

- HubSpot;
- Salesforce;
- Pipedrive;
- amoCRM;
- Bitrix24;
- Zoho;
- SAP;
- Oracle;
- Odoo;
- NetSuite;
- Microsoft Dynamics;
- 1C;
- Jira, Asana, Monday, ClickUp and similar delivery systems.

CRM/ERP integrations matter because they show what happened after the client request:

- whether it became a task;
- whether a ticket was created;
- whether a deal or budget changed;
- whether a change order appeared;
- whether hours were logged;
- whether an invoice was issued.

This is the next commercial layer after the Slack/Gmail/WhatsApp pilot.

## 7. Not implemented yet

- Direct Slack, Gmail and WhatsApp integrations are planned as the next open-source pilot slice; export adapters are already available.
- Multi-user invites, persistent workspaces and team access controls.
- Persistent project, source and review storage.
- Backend and authentication.
- Persistent storage after a page reload.
- Team collaboration.
- Production report export.
- Automatic change-request generation.
- PDF extraction.
- DOCX extraction.
- CSV/XLSX adapters.
- CRM/ERP functionality in the open-source repository.
- Billing and enterprise controls.

The current `Saved locally` label is part of the product surface; a complete persistence layer is not connected yet.

## 8. Technical status

- React 19.
- TypeScript.
- Vite.
- YAML-based rules engine.
- Local browser File API.
- No external UI library.
- Sources are processed locally.
- The current MVP does not send client data to an external API.

Key files:

| File | Purpose |
| --- | --- |
| `src/main.tsx` | Interface, source upload and review workflow |
| `src/analysis.ts` | Source parsing and analysis |
| `src/connectors.ts` | Slack, Gmail and WhatsApp export adapters |
| `src/rules.yaml` | Rule configuration |
| `src/styles.css` | Visual system and responsive layout |
| `README.md` | Project documentation |
| `docs/implementation-notes.md` | Technical decisions and next slices |
| `reports/browser-qa.md` | Browser QA report |

## 9. Quality checks

The following have been checked:

- desktop viewport 1280 × 720;
- mobile viewport 375 × 812;
- TXT and JSON source upload;
- Telegram JSON;
- WhatsApp TXT;
- Facebook Messenger JSON;
- analysis execution;
- finding filters;
- review workflow;
- `Create change request`;
- `Mark in scope`;
- `Reopen`;
- no horizontal overflow;
- no console errors.

The build passes with:

```bash
npm run build
```

## 10. Next work sequence

1. Freeze the open-source core.
2. Commit and push the current documentation to GitHub.
3. Add rule-level tests with anonymized fixtures.
4. Add a local or server-side persistence layer for projects and decisions.
5. Run a pilot with Slack, Gmail and WhatsApp exports.
6. Measure finding accuracy and the number of resulting change requests.
7. Add optional live OAuth/API connectors for Slack, Gmail and WhatsApp after the export-based pilot.
8. Add CRM/ERP as separate paid add-ons after the core value is validated.

## 11. Repository status

- Repository: `HlinorAI/scopeguard`.
- License: Apache License 2.0.
- Main branch: `main`.
- The current open-source pilot is merged into `main`.
- Release `v0.2.0` is public.
- The repository contains the product foundation, ingestion, review workflow, pilot adapters, onboarding tour, CI and tests.

## 12. Run locally

```bash
git clone https://github.com/HlinorAI/scopeguard.git
cd scopeguard
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

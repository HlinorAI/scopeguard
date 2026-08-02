# ScopeGuard

> Detect unbilled work before your team starts doing it.

ScopeGuard is a local-first scope-drift review workspace for agencies, studios and client-service teams. It compares what was agreed in a scope document with what is later requested or promised in project communication, then turns suspicious moments into reviewable findings.

The product is built around a simple question:

> “Is this request already included in the agreement, or are we about to do extra work for free?”

ScopeGuard should eventually combine three kinds of evidence:

1. **Agreement** — SOWs, contracts, proposals and briefs.
2. **Communication** — Telegram, WhatsApp, Facebook Messenger, email and Slack.
3. **Work records** — CRM and ERP deals, tickets, tasks, change orders, budgets, approvals, timesheets and invoices.

## Why it exists

Scope usually does not break in one dramatic moment. It expands through small messages:

- “Can we also add a lightweight dashboard?”
- “The status should update instantly.”
- “One last pass on the hero direction.”
- “We will make sure the new funnel is tracked end to end.”

Each message can sound harmless. Together, they create delivery work, approval risk and margin exposure. ScopeGuard gives the team a shared evidence trail before somebody starts building.

## What the current MVP does

The current prototype runs entirely in the browser and supports this flow:

1. Load a scope document and communication or work-record exports.
2. Normalize the local files into scope items and evidence records.
3. Run deterministic, configurable rules against the messages.
4. Show each potential scope-drift finding with its evidence, source and scope basis.
5. Estimate the possible delivery exposure in hours.
6. Let a human reviewer mark the finding as either:
   - `Marked in scope` — the team confirms it is covered;
   - `Change request` — the team should clarify, price or formally approve it;
   - `Reopen` — send a previous decision back to the review queue.

The analyzer uses “potential” language deliberately. A rule is a signal, not a legal or commercial decision. The final decision belongs to the project owner, account lead or delivery team.

## Who uses ScopeGuard

ScopeGuard has two separate surfaces:

1. **The user-facing product** — a hosted browser app for finance, sales, account and delivery teams. These users should open a link, sign in and work with projects without installing software or using a terminal.
2. **The open-source repository** — the inspectable product core for developers, contributors and technical operators.

The GitHub repository is not the intended daily interface for finance or sales. The hosted pilot is available at [scopeguard.atvbox.chatgpt.site](https://scopeguard.atvbox.chatgpt.site); the local Vite app below remains the developer and self-hosting surface.

## How to use the app

### Hosted pilot flow

The target end-user experience is:

1. Open the ScopeGuard web app from a shared link.
2. Sign in or accept a workspace invite.
3. Create or select a client project.
4. Upload the SOW and Slack/Gmail/WhatsApp exports, or use an approved connector when available.
5. Review findings and decide whether each item is in scope or needs a change request.
6. Export or share the review with sales, finance and delivery.

The hosted pilot is live as a private early browser release. It is local-first: uploaded content is processed in the browser and the current pilot saves the active workspace on this device only. It does not provide shared team storage or sign-in yet. Contributors can run the local development surface below.

### 1. Clone and start the local app

If you have not cloned the repository yet:

```bash
git clone https://github.com/HlinorAI/scopeguard.git
cd scopeguard
```

If the repository is already on your machine, skip the clone step and change into its directory.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally:

```text
http://127.0.0.1:5173/
```

### 2. Choose a project

The current UI uses one local project at a time. **New local project** clears the current device-local workspace and lets you name the next pilot project; shared multi-project workspaces are not enabled yet.

### 3. Add the source of truth

Use **Add a source** to upload a scope document and communication export. You can remove a source or correct its classification before running the analysis. The current supported formats are:

| Format | Typical use | Current support |
| --- | --- | --- |
| `.txt` | SOW, agreement, proposal or brief | Supported |
| `.md` | Markdown scope or delivery notes | Supported |
| `.eml` | One email message from Gmail, Outlook, Apple/iCloud, Proton, Yandex, Mail.ru or a custom domain | Supported |
| `.json` | Telegram, Facebook Messenger, Slack-style or other message export | Supported |
| `.csv` / `.xlsx` | CRM or ERP table export | Planned adapter |
| `.pdf` | PDF agreement or export | Planned adapter |
| `.docx` | Word agreement or export | Planned adapter |

File type is inferred from the filename and content. Names containing terms such as `sow`, `scope`, `contract`, `agreement`, `brief` or `proposal` are treated as scope documents. Names containing `slack`, `email`, `telegram`, `whatsapp`, `messenger`, `facebook`, `message`, `thread`, `chat`, `linear` or `jira` are treated as communication sources.

For the most reliable result, name files clearly. For example:

```text
Acme_SOW_v3.txt
acme-telegram-export.json
```

### Real communication channels

The first practical version should work with exports, not with a fragile always-on connection to a client account:

| Channel | Useful export | How to use it today |
| --- | --- | --- |
| Telegram | JSON export from Telegram Desktop | Upload the JSON file; message text can be a string or Telegram's array of text fragments |
| WhatsApp | Plain-text chat export (`.txt`) | Upload the exported chat text; name it with `WhatsApp` or `chat` so it is classified as communication |
| Facebook Messenger | JSON export from Meta/Facebook | Upload the JSON file; common `content`, `message` and `body` fields are supported |
| Email | EML or text export from Gmail, Outlook, Apple/iCloud, Proton, Yandex, Mail.ru or a custom-domain mailbox | Upload the local export as before |
| Slack | JSON or text export | Upload the local export as before |
| CRM / ERP | HubSpot, Salesforce, Pipedrive, amoCRM, Bitrix24, Zoho, SAP, Oracle, Odoo, NetSuite, Microsoft Dynamics, 1C and similar systems | Planned private add-on; not part of the open-source MVP |

This keeps the first pilot easy to understand: the client conversation is exported by the team, reviewed locally and never sent to a third-party parsing service. The product should treat email as a provider-neutral channel rather than a Gmail-only feature. Direct Telegram, WhatsApp Business, Meta, IMAP/OAuth, CRM and ERP integrations can come later, after the workflow and privacy model are validated.

CRM and ERP data matters because it can show whether a request became a task, a ticket, a deal update, a change order, a timesheet entry or an invoice. That lets the paid add-on connect “the client asked for it” with “the team accepted or delivered it” and eventually quantify unbilled work more reliably than chat scanning alone.

## Pilot and product boundary

The first commercial pilot should focus on the channels where client communication most often happens:

- Slack;
- Gmail;
- WhatsApp.

The pilot can start with local exports to validate the evidence and review workflow. Slack, Gmail and WhatsApp connectors are part of the open-source pilot scope. A compliant WhatsApp Business or export-based flow should be used where direct access to a personal chat is not available.

The open-source repository contains the inspectable core:

- local TXT, MD, EML and JSON ingestion;
- deterministic YAML rules;
- evidence-backed findings;
- human review decisions;
- responsive review UI;
- Slack/Gmail/WhatsApp pilot connector adapters;
- anonymized fixtures and documentation.

The paid, closed-source layer is reserved for:

- CRM/ERP adapters;
- additional mailbox, project-management and messaging integrations;
- secure hosted storage and workspaces;
- team roles, audit history and notifications;
- production exports and integrations;
- automation, billing and enterprise controls.

This keeps the open-source project useful and auditable while protecting the integration and operational layer that creates recurring commercial value.

### 4. Run the analysis

Click **Run analysis** after both source types are loaded. ScopeGuard then:

- extracts bullet points from the scope source;
- extracts messages from the communication source;
- applies the configured rules;
- calculates the current finding list, the share of messages with a scope basis, message count and preliminary exposure hours.

The analysis is deterministic: the same source text and the same rules produce the same findings.

### 5. Review the evidence

Every finding contains:

- a finding type, such as `NEW DELIVERABLE` or `EXTRA REVISION`;
- the original message excerpt;
- the communication source;
- the closest matching scope clause, when one exists;
- severity and confidence;
- an estimated hour range.

Use the filters to focus on **All findings**, **High risk** or **Unreviewed**. Open **Review finding** to add an optional note and make a decision.

### 6. Decide what happens next

Use **Mark in scope** when the request is genuinely covered by the agreement. Use **Create change request** when it needs clarification, a price, a new estimate or formal approval. Decisions and notes are saved in this browser only; shared project storage is part of the next technical slice.

## The demo scenario

The bundled demo compares:

- `Acme_SOW_v3.txt`, containing a marketing site, daily status sync, two revision rounds and explicit exclusions;
- `acme-slack-export.json`, containing four example messages.

The rules surface signals such as:

| Message signal | Why it matters |
| --- | --- |
| A partner dashboard request | A new deliverable may be outside the agreed site scope |
| An instant or real-time requirement | The delivery expectation may have changed |
| “One last pass” | It may be an additional revision round |
| A promise to implement tracking | It may be an unpriced delivery commitment |

This is intentionally a small, understandable dataset. It makes the workflow easy to inspect before connecting real project exports.

## How the rules work

Rules live in [`src/rules.yaml`](src/rules.yaml). Each rule defines:

- `pattern` — a case-insensitive regular expression matched against messages;
- `type` — the label shown in the UI;
- `titleStyle` — how the finding title is generated;
- `severity` — `high`, `medium` or `low`;
- `confidence` — the signal confidence shown to the reviewer;
- `minHours` and `maxHours` — the initial exposure range;
- `scopeTerms` — terms used to find a related scope clause.

To add a new deterministic signal, add a new rule to the YAML file and rerun the dev server or build. The analyzer parses the YAML at build time; there is no rules database or remote rules service yet.

Example:

```yaml
- id: new_deliverable
  type: NEW DELIVERABLE
  pattern: "dashboard|partner portal|mobile app"
  titleStyle: subject_not_in_scope
  severity: high
  confidence: 94 # rule signal, not a measured probability
  minHours: 32
  maxHours: 40
  scopeTerms:
    - dashboard
    - partner
```

## Mental model

ScopeGuard is not an automatic approval system and it is not a contract interpreter. It is a margin-protection layer between project communication and delivery work:

```text
Agreed scope + project messages
                ↓
        local normalization
                ↓
          YAML rule signals
                ↓
      evidence-backed findings
                ↓
       human review and decision
                ↓
    in-scope work or change request
```

The intended operating habit is simple: review the queue before accepting new work, not after the team has already spent the hours.

## Privacy and current limitations

- Source files are parsed locally in the browser in this prototype.
- No client content is sent to an external API by the current implementation.
- The app saves the current project, uploaded files, review notes and decisions in versioned browser storage on this device. It is not a shared backend and should not be treated as team history or backup.
- PDF and DOCX files are recognized but intentionally rejected until extraction adapters are added.
- Direct Slack, Gmail and WhatsApp integrations are not implemented yet; export adapters are available and live pilot connectors are the next open-source slice. Facebook Messenger, additional mailbox providers, CRM and ERP integrations are not part of the open-source pilot.
- The JSON parser supports common Telegram, Facebook Messenger and Slack-style arrays and objects with a `messages` array. It looks for fields such as `text`, `message`, `body` or `content`, including Telegram's array-of-text-fragments format.
- WhatsApp text exports are treated as message sources when their filename includes `WhatsApp`, `chat` or a similar channel hint.
- Scope extraction currently focuses on Markdown-style headings and bullet or numbered list items.
- Rule matching is lexical and deterministic. The pilot now handles basic negation, sender role hints, included/excluded clauses, stable finding IDs and multiple rule matches, but it does not understand full contractual context or conversation history.
- “With scope basis” is the share of parsed messages for which at least one configured rule found a related scope clause. It is not a percentage of contractual compliance.
- Direct API integrations, shared workspaces and project switching remain outside this pilot slice.

## Technical shape

- React 19 + TypeScript
- Vite
- YAML-configured analyzer
- Custom CSS design system with responsive desktop and mobile layouts
- No external UI library
- Local source ingestion through the browser `File` API

Important files:

| File | Purpose |
| --- | --- |
| [`src/main.tsx`](src/main.tsx) | Product surface, source upload, analysis and review workflow |
| [`src/analysis.ts`](src/analysis.ts) | Source parsing, normalization and deterministic analysis |
| [`src/connectors.ts`](src/connectors.ts) | Slack, Gmail and WhatsApp export adapters for the open-source pilot |
| [`src/rules.yaml`](src/rules.yaml) | Configurable scope-drift rules |
| [`src/styles.css`](src/styles.css) | Visual system and responsive layout |
| [`docs/implementation-notes.md`](docs/implementation-notes.md) | Current implementation decisions and next slices |

## Development commands

```bash
# install dependencies
npm install

# start the local development server
npm run dev

# type-check and create a production build
npm run build

# run unit tests
npm test

# run typecheck only
npm run typecheck

# serve the production build locally
npm run preview
```

## Roadmap

The next useful steps are:

1. Add PDF and DOCX extraction adapters.
2. Add rule-level tests with labelled scope-drift fixtures.
3. Add shared authenticated workspaces and audit history; device-local persistence is already available for the pilot.
4. Turn a `Change request` decision into an editable, exportable draft.
5. Improve clause matching and conversation context.
6. Add optional live OAuth/API connectors for Slack, Gmail and WhatsApp after the export-based pilot.
7. Add private CRM/ERP, mailbox and project-management add-ons via approved APIs.
8. Add optional model-assisted extraction behind an explicit privacy boundary; deterministic evidence and human review should remain the source of truth.

## Project status

ScopeGuard is an early product prototype. The foundation is intentionally local-first and inspectable so the team can validate the workflow with a small pilot before adding cloud storage, integrations, billing or automation.

For the current product boundary, pilot plan and open-source/private add-on split, see [`docs/product-status.md`](docs/product-status.md).

The repository is public under the [Apache License 2.0](LICENSE). Release `v0.2.0` contains the open-source export-based pilot foundation, hosted deployment adapter and first-run onboarding tour.

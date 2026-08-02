# Implementation notes

## Current slice

The current slice is a responsive React/Vite local-first review workspace, a deterministic ingestion/analyzer core and a configurable decision workflow. The workspace ships with demo sources, but the same path now accepts local TXT, MD, EML and JSON files from scope documents and communication channels and produces findings from their contents.

## Decisions

- No external UI library yet; the surface is small and the visual language is custom.
- Sources are normalized into `SourceDocument` records with a scope/messages/unknown kind and an explicit format.
- TXT/MD, EML and common Telegram, WhatsApp, Facebook Messenger and Slack JSON exports are parsed locally in `src/analysis.ts`.
- The analyzer runs deterministic rules for new deliverables, acceptance criteria, extra revisions and unpriced commitments.
- Rule patterns, confidence, severity and hour ranges are configured in `src/rules.yaml` and parsed at build time.
- “Run analysis” now recomputes findings, coverage, message count and hours at risk from the current sources.
- PDF/DOCX are rejected with an explicit next-adapter message instead of pretending they were parsed. CSV/XLSX and CRM/ERP records are deferred to private add-ons; Slack/Gmail/WhatsApp connectors are the next open-source pilot slice.
- Findings are explicitly evidence-backed and use “potential” language.
- A reviewer can add a note, mark a finding in scope, create a change request decision, reopen it, and use the unreviewed filter as a queue.

## Next technical slice

1. Add PDF/DOCX extraction adapters.
2. Add rule-level tests against a labelled fixture set.
3. Persist projects, sources, review decisions and findings in local SQLite.
4. Turn the change-request decision into an editable/exportable draft.
5. Build and test the open-source Slack, Gmail and WhatsApp pilot connectors.

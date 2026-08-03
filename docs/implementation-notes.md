# Implementation notes

## Current slice

The current slice is a responsive React/Vite local-first review workspace, a deterministic ingestion/analyzer core and a configurable decision workflow. The workspace ships with demo sources, but the same path now accepts local TXT, MD, EML and JSON files from scope documents and communication channels and produces findings from their contents.

## Decisions

- No external UI library yet; the surface is small and the visual language is custom.
- Sources are normalized into `SourceDocument` records with a scope/messages/unknown kind and an explicit format.
- TXT/MD, EML and common Telegram, WhatsApp, Facebook Messenger and Slack JSON exports are parsed locally in `src/analysis.ts`.
- The analyzer runs deterministic rules for new deliverables, acceptance criteria, extra revisions and unpriced commitments.
- Rule patterns, rule signal strength, severity and hour ranges are configured in `src/rules.yaml` and validated at build time.
- “Run analysis” now recomputes findings, the percentage of messages with a scope basis, message count and preliminary exposure from the current sources.
- PDF/DOCX are rejected with an explicit next-adapter message instead of pretending they were parsed. CSV/XLSX and CRM/ERP records are deferred to private add-ons; Slack/Gmail/WhatsApp connectors are the next open-source pilot slice.
- Findings are explicitly evidence-backed and use “potential” language.
- A reviewer can add a note, mark a finding in scope, create a change request decision, reopen it, and use the unreviewed filter as a queue.
- A first-run onboarding tour explains the scope, source upload, analysis, evidence review, decisions and local-first privacy model. The tour can be skipped, replayed from the help button and navigated with the keyboard.
- The current local workspace is persisted in browser storage under a versioned key, including sources, findings, analysis metrics, review notes and decisions. This is intentionally device-local and does not replace a shared backend.
- Review reports and approved change requests can be exported as Markdown files without sending project data to an external service.
- Pilot safeguards include a 10 MB source limit, required scope/message source validation, source reclassification and removal, stable finding IDs, basic negation and sender-role handling, included/excluded scope matching, and multipart email/plain-text Slack fallbacks.
- The pilot visual system remains the original warm paper/ink/orange workspace design; the page header and demo banner have explicit layout styles so pilot-state additions do not fall back to browser defaults.

## Next technical slice

1. Add PDF/DOCX extraction adapters.
2. Add rule-level tests against a labelled fixture set.
3. Add a shared server-side workspace and explicit authentication for team use.
4. Turn the change-request export into an editable, provider-specific draft.
5. Build and test live Slack, Gmail and WhatsApp connectors behind the approved privacy boundary.

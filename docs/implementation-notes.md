# Implementation notes

## Current slice

The first two slices are a responsive React/Vite local-first review workspace and a deterministic ingestion/analyzer core. The workspace ships with demo sources, but the same path now accepts local TXT, MD, EML and JSON files and produces findings from their contents.

## Decisions

- No external UI library yet; the surface is small and the visual language is custom.
- Sources are normalized into `SourceDocument` records with a scope/messages/unknown kind and an explicit format.
- TXT/MD, EML and common Slack-style JSON message exports are parsed locally in `src/analysis.ts`.
- The analyzer runs deterministic rules for new deliverables, acceptance criteria, extra revisions and unpriced commitments.
- “Run analysis” now recomputes findings, coverage, message count and hours at risk from the current sources.
- PDF/DOCX are rejected with an explicit next-adapter message instead of pretending they were parsed.
- Findings are explicitly evidence-backed and use “potential” language.

## Next technical slice

1. Add PDF/DOCX extraction adapters.
2. Move rules into YAML and add rule-level tests against a labelled fixture set.
3. Persist projects, sources and findings in local SQLite.
4. Add evidence spans and a change-request draft from a reviewed finding.

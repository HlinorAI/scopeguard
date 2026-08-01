# Implementation notes

## Current slice

The first slice is a responsive React/Vite prototype of the local-first review workspace. It uses local demo data so the product shape can be tested before adding parsing and model calls.

## Decisions

- No external UI library yet; the surface is small and the visual language is custom.
- The upload interaction is real at the browser level and stores selected filenames in local React state.
- “Run analysis” is a simulated state transition for now. The next implementation step is to replace it with an ingestion pipeline.
- Findings are explicitly evidence-backed and use “potential” language.

## Next technical slice

1. Add source parser interfaces for SOW, PDF/DOCX and EML/JSON exports.
2. Normalize extracted sections and messages into a shared schema.
3. Add YAML-driven rule evaluation.
4. Persist projects and findings in local SQLite.
5. Generate the same report from real data.

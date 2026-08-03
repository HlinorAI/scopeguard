# ScopeGuard browser QA

Date: 2026-08-02

## Routes

- `/` — primary project review workspace

## Viewports

- Desktop: 1280 × 720
- Mobile: 375 × 812

## Checks passed

- Workspace renders with sidebar, project context, findings and sources.
- Desktop layout has no horizontal overflow.
- Mobile layout collapses the sidebar and stacks the evidence/source workspace without horizontal overflow.
- Project navigation changes the active project and breadcrumb.
- Finding filters switch between all, high-risk and unreviewed findings.
- Review action changes a finding to `Reviewed` and updates the unreviewed metric.
- Run analysis moves through `Analysing…` and returns to `Analysis complete`.
- Visible `browse` upload control accepts a non-sensitive QA fixture and adds its filename to the source list.
- Two local fixtures (scope TXT + message JSON) are classified, imported and used to recompute findings and metrics after `Run analysis`.
- Telegram JSON, WhatsApp TXT and Facebook Messenger JSON fixtures are classified, imported and used to recompute findings and findings from their message formats.
- Telegram text arrays and Messenger `content` fields produce usable message text for rule matching.
- Slack JSON, Gmail EML and WhatsApp TXT pilot fixtures are classified by channel, imported and produce their expected findings.
- The Slack/Gmail/WhatsApp pilot workflow fits at 375px mobile width without horizontal overflow.
- Unsupported PDF input is rejected with a visible, actionable error and does not enter the source list.
- Review flow accepts a decision note, supports `Create change request`, `Mark in scope` and `Reopen`, and updates the unreviewed metric.
- Review controls fit at 375px mobile width without horizontal overflow.
- Console error and warning logs were empty during the tested flows.
- No external images or broken media are used.

## Fixed during QA

- Added the missing React mount call in `src/main.tsx`; the initial build succeeded but the browser was blank because `App` was not rendered into `#root`.
- Added React type declarations and the Vite client declaration so typecheck is meaningful.
- Fixed source classification so message exports whose filenames contain the product name `scopeguard` are not mistaken for scope documents.

## Remaining prototype limitations

- Shared workspace switching, account menus and team collaboration are intentionally outside the local pilot; export report, help and new local project are functional.
- Uploaded source content and review decisions remain in React state and are not persisted across a page reload.
- Direct Telegram, WhatsApp Business and Facebook Messenger integrations are not implemented; the current workflow uses exported files.
- PDF/DOCX extraction adapters are still pending.
# ScopeGuard browser QA

Date: 2026-08-02

## Scope

- Route: `/`
- Local URL: `http://127.0.0.1:4173/`
- Desktop viewport: 1280 × 720
- Mobile viewport: iPhone 13 emulation

## Checks completed

- Production build starts and serves the application.
- Desktop render shows the workspace, evidence cards, source panel and onboarding tour.
- Mobile render shows the responsive brand bar, breadcrumbs, action buttons and onboarding card without a blank page.
- Initial demo workspace shows four findings.
- Two source classification controls are present.
- The onboarding tour can be skipped.
- `Run analysis` completes and returns `Analysis complete`.
- Console errors: none during the smoke test.
- Source validation and source management are covered by unit tests; browser automation used the demo workspace for the smoke test.

## Result

PASS for the local pilot slice. The application is ready for a controlled export-based pilot, with the documented limitations that analysis remains deterministic and local, shared workspaces are not available, and PDF/DOCX extraction is not enabled.

## Frontend pilot flow

- Demo mode is visibly labelled and offers a direct path to an empty project.
- A named local project can be created from the sidebar.
- Two in-memory test files (scope TXT + Slack JSON) were uploaded through the real file input.
- The source list showed both files, the status changed to `Ready to analyse`, and the analysis completed with one finding.
- No console errors occurred during the full flow.
- The onboarding dialog receives focus when opened and remains dismissible with `Escape`.

## 2026-08-03 visual regression pass

- Restored the missing desktop page layout rules for `.content-wrap`, `.page-intro`, headings, intro copy and action buttons.
- Added the visual treatment for the `Demo data` status banner.
- Verified the local desktop render at 1280 × 720 against the intended paper/ink/orange design system.
- Console errors and warnings were empty after the fix.

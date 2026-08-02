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

- Export report, help, workspace switcher, account menu and new project are visual placeholders.
- Uploaded source content and review decisions remain in React state and are not persisted across a page reload.
- Direct Telegram, WhatsApp Business and Facebook Messenger integrations are not implemented; the current workflow uses exported files.
- PDF/DOCX extraction adapters are still pending.

# ScopeGuard design audit

Date: 2026-08-03

## Finding

The pilot hardening change introduced new page markup but dropped the existing CSS block for the editorial page header. The sidebar and lower workspace styles remained active, while the intro layout, heading scale, action buttons and demo banner fell back to browser defaults. This was a high-severity visual regression because the primary workspace lost its visual hierarchy.

## Before / after

- Before: the main content started at the page edge, the headline and buttons were unstyled, and the demo notice read as plain text.
- After: the original centered content rail, large editorial headline, paper/ink/orange controls and bordered demo banner are restored.

## Checked aspects

1. Page background and warm paper palette — pass.
2. Sidebar width and rail separation — pass.
3. Content max width and horizontal padding — restored and pass.
4. Editorial headline scale and tracking — restored and pass.
5. Intro copy width and line height — restored and pass.
6. Primary and quiet action button states — restored and pass.
7. Demo banner hierarchy and contrast — added and pass.
8. Analysis status strip placement — pass.
9. Evidence/source two-column grid — pass.
10. Finding card borders, radius and spacing — pass.
11. Accent orange reserved for risk and actions — pass.
12. Responsive rules remain present for mobile layout — pass by source inspection; mobile browser emulation remains a follow-up check.
13. Focus-visible treatment remains present — pass.
14. Reduced-motion rule remains present — pass.

## Files changed

- `src/styles.css`
- `reports/browser-qa.md`

## Validation

- `npm run typecheck` — passed.
- `npm run build` — passed.
- Local browser render at 1280 × 720 — restored visual hierarchy.
- Browser console errors and warnings — none observed.

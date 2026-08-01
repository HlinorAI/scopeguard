# ScopeGuard — Margin Ledger

## Design read

Local-first B2B SaaS workspace for agency owners and delivery leads. The product should feel like a sharp project ledger: calm enough for contract review, tactile enough to make risk visible.

## Visual system

- Background: warm paper (`#F4F1EB`) with a slightly deeper sidebar (`#F0EDE6`).
- Text: near-black ink (`#252521`).
- Accent: one restrained signal orange (`#E7643F`) for risk and action.
- Secondary semantic colour: muted sage for saved/private/reviewed states.
- Type: system sans stack with tight display tracking and small mono-like uppercase labels.
- Shape: 8px controls, 12px content panels, no mixed radius language.
- Depth: borders and tonal shifts first; shadows are intentionally absent.

## Layout

- Persistent project rail on desktop.
- Editorial project header with left-aligned statement and right-side actions.
- A compact analysis status strip.
- Two-column evidence workspace: findings first, sources second.
- On mobile, the rail collapses into a compact brand bar and the source panel follows findings.

## Motion principles

- Use short tactile transitions for button press and drag/drop.
- Analysis uses a text state transition, not a spinner-only state.
- Respect `prefers-reduced-motion`.

## Anti-patterns

- No AI-purple gradient or decorative mesh.
- No generic three-card marketing section.
- No fake legal certainty; every finding remains a human decision.
- No card shadow pile-up.
- No hidden upload state: supported interaction is visible.
- No emoji as product iconography.

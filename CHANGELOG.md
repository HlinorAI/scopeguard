# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security

- Updated `nanoid` 3.3.16 → 3.3.19 and `yaml` 2.8.1 → 2.8.3 (advisory fixes),
  `vitest` 4.1.10 → 4.1.11 with its `@vitest/*` packages, `chai` 6.2.2 →
  6.3.0, `tinyrainbow` 3.1.1 → 3.2.0, `@jridgewell/sourcemap-codec` 1.5.5 →
  1.6.0. `package.json` raises the `yaml` floor to `^2.8.3` and the `vitest`
  floor to `^4.1.11` so the safe minimums are protected.
- Verified on the CI toolchain (Node 22, npm 10): fresh `npm ci`,
  `npm audit` full and `--omit=dev` both report 0 vulnerabilities,
  typecheck/test/build pass, and the built worker answers synthetic
  GET/HEAD with 200, unknown paths with 404, disallowed methods with 405.
- No behavioral, runtime-rule, or version changes in this update.

## 2026-10-04

### Added

- Mail Hub reference documents distinguish private Operator intake from the public browser analyzer. The synthetic scope-drift regression uses existing JSON parsing, analysis rules and review reports; no live connector or production API was added.
- Short README reference link with sanitized source evidence notes.

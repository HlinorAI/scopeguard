# Sanitized evidence notes

Reviewed 2026-10-04. Provider-neutral intake is implemented in private Operator, while this public example runs the separate public analyzer.

Private Mail Hub source revision: `fbabd069358ba79bf1eb9e2cad59e76f83e980e4`.
Private implementation/raw reports are not copied into this repository. Digests
identify the reviewed artifacts for an authorized operator; they do not make
private evidence publicly reproducible or independently attest its content.
Historical records are not a new live check.

| Reviewed source (private unless noted) | SHA-256 | Evidence / limit |
| --- | --- | --- |
| `consumers/scopeguard/source/src/adapters/mail-hub.ts` | `a5f4d92bc8462e90afa34d31b0547d1ad85c4da68329ff57d622f635a8c10027` | Bounded authenticated read, event validation, selection-scoped checkpoints, normalization and review-only persistence. |
| `consumers/scopeguard/source/tests/mail-hub.test.ts` | `f47b9eb27635c7a825d1c05dbc1ee27bbb7bf7f63958d01ee20056c4f2633e89` | Import/review replay, conflict/cursor/mailbox rejection and untrusted message behavior. |
| `docs/stage4-integration-report.md` | `9e02cf36cdeafebe47383e37436abcd0b8bffe169071bdb3492fe484997082b3` | Real local pilot: six messages/two selected chains, no agreement, zero findings; synthetic positive review flow. |
| `evidence/stage4-production/scopeguard-first-run.json` | `84f785bc8ecf8a2c8e1099e5e19eb6d7ed12a0bc44542c4bf9ca06c061d1895e` | Production manual intake imported six, reviewOnly true, externalWrites zero. |
| `evidence/stage4-production/scopeguard-review.json` | `e2a19980d596c16d0edbc2d4e25a91dd6c2a74815f865b3219383f9f169e7610` | Repeat production intake imported zero; external writeback false. |
| `evidence/stage5-production/linux-tests.json` | `5d791212b08dbe3c595e724e5d0dea11b78b4b815c40361768c281bec5bfa6b2` | Saved Linux test report: private Operator 49 tests; not the public-core test count. |

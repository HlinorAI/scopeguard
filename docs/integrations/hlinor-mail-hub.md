# Reference Integration: Email via Hlinor Mail Hub

## Why a provider-neutral source

Email-provider authentication and scope analysis are separate responsibilities.
Hlinor Mail Hub normalizes selected mail into communication events; ScopeGuard
compares communication evidence with agreed scope. ScopeGuard remains useful
with ordinary local exports and does not require Mail Hub.

**Implementation boundary:** the deployed Mail Hub consumer is the separate,
private ScopeGuard Operator service. This public repository is the browser
review workspace and deterministic analyzer; it does not contain Operator's
HTTP adapter, durable cursor store or server worker. The example below exercises
this repository's actual analyzer through its existing JSON export parser. It
is not a claim that the browser app has a live Mail Hub connector.

## Architecture and event flow

```text
Mail providers → Mail Hub → normalized communication events
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
          ScopeGuard Operator                 selected local JSON export
          private intake/store/worker                   │
                    │                                   ▼
                    ▼                          public ScopeGuard analyzer
          pending review evidence                      │
                                                        ▼
                                           evidence-backed human review
```

Mail Hub's `list_communication_events` read operation returns schema version,
immutable `event_id`, mailbox/thread/message identity, sequence/timestamp,
direction, sender/recipients, subject/text, deduplication key, attachment
metadata and source freshness. Events label mail as `untrusted_external_content`.
Operator validates the page and selected mailbox/threads before normalization.
Incoming mail is evidence, never an instruction or approval.

Operator calls `/v1/tools/list_communication_events` with an operator-configured
origin and dedicated read identity. It maps `event_id` to the stored event ID,
retains message/thread/mailbox provenance, uses `team` for outbound and `unknown`
for inbound role, and omits volatile freshness from stored content identity.
It needs no provider IMAP/Gmail/SMTP credentials and does not download attachments.
Existing provider adapters remain separate options.

## Integration proof: replay and idempotency

Saved 2026-10-04 acceptance records show six real messages from two selected
chains imported into Operator, then zero new imports on repeat, with zero real
findings and no external writeback. That proves bounded intake/replay, not
successful detection of a real out-of-scope request: no agreement was supplied.

The reviewed private adapter checkpoints project + mailbox + sorted exact thread
selection. A cursor advances after event/worker/review persistence. Stable event
replay deduplicates; conflicting replay content fails without advancing the
checkpoint. Changing selected threads changes checkpoint identity. Its tests
cover scope/cursor rejection, conflict handling, freshness exclusion and review
queue persistence. These are private Operator guarantees, not browser guarantees.

[Sanitized evidence notes](hlinor-mail-hub-evidence.md) record source provenance
and the limits of those historical acceptance observations.

## Product proof: executable scope drift

The [synthetic agreement](../../examples/mail-hub/agreement.md) includes a public
marketing site and explicitly excludes a partner dashboard. The
[synthetic event](../../examples/mail-hub/communication-events.json) requests
that dashboard. No customer text or operational IDs are used.

The [regression test](../../tests/mail-hub-reference.test.ts) projects event
identity/text/sender/time into the existing generic JSON message parser, then
calls `validateSources`, `analyzeSources` and `buildReviewReport`. The parser's
`slack` channel selects generic JSON parsing; exported message provenance is
`mail_hub`. No new channel or production adapter is introduced.

```text
agreed exclusion + incoming dashboard request
                  ↓
          existing ScopeGuard rules
                  ↓
     1 NEW DELIVERABLE scope_drift finding
     scopeMatch=excluded; decision=pending
                  ↓
       human review / evidence report
```

The result contains the communication excerpt, source, matched excluded clause,
stable finding ID, severity/confidence, estimated hours and pending decision.
Confidence and hours are rule heuristics, not measured accuracy or delivery cost.
Repeated export gives the same finding ID/result; an agreement including the
dashboard suppresses the finding. This stateless replay demonstration does not
prove durable HTTP import deduplication in the public browser.

```bash
npm ci
npm test -- tests/mail-hub-reference.test.ts
npm test
npm run typecheck
npm run build
```

## Security, privacy and the shared pattern

Operator performs local persistence and review only; neither a finding nor email
content authorizes external writeback. The public example stays local and has no
network/provider calls. Real exports may contain sensitive communication: obtain
operator authorization and minimize selected data before importing; do not copy
raw private events into public fixtures.

Within the same Mail Hub workflow,
[Registry](https://github.com/HlinorAI/hlinor-agent-registry) supplies policy
enforcement for internal operations, ScopeGuard reviews scope evidence, and
SheetSentry validates selected XLSX attachments in an isolated processor.
Each component has an independent purpose. Spreadsheet findings, scope findings,
and operation authorization are distinct outputs; none implies permission to
send a message. Live positive scope-drift detection and public-browser live
connector acceptance are not claimed by this reference.

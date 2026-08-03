# ScopeGuard


> Detect unbilled work before your team starts doing it.


ScopeGuard is a local-first scope-drift review workspace for agencies, studios and client-service teams. It compares what was agreed in a scope document with what is later requested or promised in project communication, then turns suspicious moments into reviewable findings.


The product is built around a simple question:


> “Is this request already included in the agreement, or are we about to do extra work for free?”


ScopeGuard should eventually combine three kinds of evidence:


1. **Agreement** — SOWs, contracts, proposals and briefs.
2. **Communication** — Telegram, WhatsApp, Facebook Messenger, email and Slack.
3. **Work records** — CRM and ERP deals, tickets, tasks, change orders, budgets, approvals, timesheets and invoices.


## Why it exists


Scope usually does not break in one dramatic moment. It expands through small messages:


- “Can we also add a lightweight dashboard?”
- “The status should update instantly.”
- “One last pass on the hero direction.”
- “We will make sure the new funnel is tracked end to end.”


Each message can sound harmless. Together, they create delivery work, approval risk and margin exposure. ScopeGuard gives the team a shared evidence trail before somebody starts building.


## What the current MVP does


The current prototype runs entirely in the browser and supports this flow:


1. Load a scope document or initial order email and communication or work-record exports.
2. Normalize the local files into scope items and evidence records.
3. Run deterministic, configurable rules against the messages.
4. Show each potential scope-drift finding with its evidence, source and scope basis.
5. Estimate the possible delivery exposure in hours.
6. Let a human reviewer mark the finding as either:
   - `Marked in scope` — the team confirms it is covered;
   - `Change request` — the team should clarify, price or formally approve it;
   - `Reopen` — send a previous decision back to the review queue.


The analyzer uses “potential” language deliberately. A rule is a signal, not a legal or commercial decision. The final decision belongs to the project owner, account lead or delivery team.


## Who uses ScopeGuard


ScopeGuard has two separate surfaces:


1. **The user-facing product** — a hosted browser app for finance, sales, account and delivery teams. These users should open a link, sign in and work with projects without installing software or using a terminal.
2. **The open-source repository** — the inspectable product core for developers, contributors and technical operators.


The GitHub repository is not the intended daily interface for finance or sales. The hosted pilot is available at [scopeguard.hlinor.com](https://scopeguard.hlinor.com); the local Vite app below remains the developer and self-hosting surface.

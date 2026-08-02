# Contributing to ScopeGuard

Thank you for helping improve ScopeGuard.

## Before opening an issue or pull request

- Check existing issues and pull requests first.
- Do not include real client conversations, contracts, credentials or other private data.
- Use anonymized fixtures when a change needs sample input.
- Keep repository content, code comments and documentation in English.

## Local development

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
git diff --check
```

## Pull request expectations

- Explain the user-facing or developer-facing change.
- Keep changes focused and small where possible.
- Update documentation when behavior or product boundaries change.
- Add or update tests when changing analysis behavior.
- Include browser QA notes for changes to the interface or upload workflow.
- Do not add provider credentials, secrets or customer data.

## ScopeGuard product boundary

The open-source repository focuses on the local-first analyzer, transparent rules, human review workflow and the Slack/Gmail/WhatsApp pilot connectors. Hosted storage, team workspaces, CRM/ERP adapters and enterprise functionality may live in separate private packages.

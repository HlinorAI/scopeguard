# Security Policy

## Supported versions

ScopeGuard is an early prototype. Security fixes are applied to the latest state of the `main` branch while the project is in active development.

## Reporting a vulnerability

Please do not open a public issue for a suspected security vulnerability.

Use GitHub's private security advisory workflow for the repository, or contact the repository maintainers privately through the GitHub organization. Include:

- a short description of the issue;
- affected files or behavior;
- reproduction steps using synthetic data;
- possible impact;
- a suggested mitigation, if known.

Never include real client conversations, credentials, access tokens or other sensitive data in a report.

## Security scope

The current open-source MVP processes uploaded files locally in the browser and does not provide hosted storage or direct provider integrations yet. The planned Slack/Gmail/WhatsApp pilot connectors require security review before release. Hosted storage, CRM/ERP adapters and enterprise capabilities will require an additional private-product review.

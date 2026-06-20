# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
privately. **Do not open a public issue for security reports.**

- **Preferred:** [Open a private security advisory](https://github.com/Aswincloud/portfolio/security/advisories/new)
  via GitHub's "Report a vulnerability" flow.
- **Email:** [contact@aswincloud.com](mailto:contact@aswincloud.com)

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (or a proof of concept)
- The affected URL, file, or component
- Any suggested remediation, if you have one

## Response

This is a personal portfolio project maintained by a single author. I aim to:

- **Acknowledge** your report within **5 business days**
- **Provide an assessment and remediation plan** within **14 days**
- **Credit** reporters in the fix (unless you prefer to remain anonymous)

## Scope

In scope:

- This repository's source code
- The deployed site at [www.aswincloud.com](https://www.aswincloud.com) and its
  Cloudflare Worker (`/api/*` endpoints)

Out of scope:

- Third-party services and dependencies (report those to their respective
  maintainers)
- Findings that require physical access, social engineering, or a compromised
  end-user device
- Volumetric denial-of-service testing

## Supported Versions

Only the latest deployed version (`main`) is supported. There are no long-lived
release branches.

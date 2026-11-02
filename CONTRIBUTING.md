# Contributing

Thanks for your interest in contributing to the ARICT Past Paper Portal.

## How to Contribute

- Report bugs, request features, describe accessibility barriers, or suggest paper corrections using the [issue chooser](https://github.com/Association-of-Rajarata-ICT/arict-paper-portal/issues/new/choose). Blank issues remain available if none of the forms fits.
- Improve documentation, UI, or code by submitting a pull request.
- Keep changes focused and aligned with the project goals.

For sensitive content or conduct concerns, follow [Content Reporting](./CONTENT_REPORTING.md). Report vulnerabilities privately using [Security](./SECURITY.md). Missing examination papers can be requested through the portal's Request a paper form.

## Development Setup

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Run linting: `npm run lint`

## Branching

- Create a feature branch from `master`, the repository's default branch.
- Use descriptive branch names, for example: `feature/department-cards` or `fix/footer-links`.

## Commit Messages

Use clear, short messages. Example:

- `feat: add faculty page`
- `fix: align department card stats`

## Pull Requests

Please include:

- A summary of the change and why it is needed.
- Screenshots for UI changes.
- Notes on testing (what you ran).

The [pull request template](./.github/pull_request_template.md) prompts for these details. For UI changes, follow [Accessibility](./ACCESSIBILITY.md) and describe the checks you actually completed, along with any limitations.

## Code Style

- Follow the existing patterns in the codebase.
- Keep components small and readable.
- Avoid large refactors unless discussed in an issue first.

## Questions

If you are unsure about a change, open an issue first so we can discuss it.

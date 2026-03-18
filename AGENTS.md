# Repository Instructions

- When creating or updating a pull request / merge request, always fill in the description field.
- Do not leave the PR / MR description empty.
- Before every push, update `docs/` and `specs/` to match the code changes in the branch.
- Treat `specs/` as product requirements and expected behavior: what the feature should do.
- Treat `docs/` as technical documentation: how the feature works and is implemented.
- Follow the existing design system and component patterns already used in the repository; do not introduce a parallel visual language for new UI work.
- Prefer extending or composing the current shared UI primitives and established styling patterns instead of inventing one-off controls.
- Mobile support is required: new UI and changed UI flows must work on phones as well as desktop.
- When changing interactive flows, check both desktop and mobile behavior, including spacing, touch targets, wrapping, and perceived responsiveness.
- For each new feature branch, start from a fresh `main`.
- If the task asks to match external product behavior (for example Anki), verify it from primary sources before implementing.
- If behavior changes touch shared review flows, keep the mechanics aligned across regular review, manual filtered review, and extra study unless the task explicitly says otherwise.
- When adding or fixing non-trivial logic, add automated tests for the new behavior or the regression being fixed.
- When UI behavior changes in a reusable or user-visible way, reflect it in Storybook when practical.
- Before finalizing a branch, run the relevant verification commands for the touched area: targeted `eslint`, tests, `tsc`, and Storybook build when stories were changed.

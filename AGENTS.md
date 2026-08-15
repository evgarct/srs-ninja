# Repository Instructions

- When creating or updating a pull request / merge request, always fill in the description field.
- Do not leave the PR / MR description empty.
- Before every push, update `docs/` and `specs/` to match the code changes in the branch.
- Treat `specs/` as product requirements and expected behavior: what the feature should do.
- Treat `docs/` as technical documentation: how the feature works and is implemented.
- Follow the existing design system and component patterns already used in the repository; do not introduce a parallel visual language for new UI work.
- Prefer extending or composing the current shared UI primitives and established styling patterns instead of inventing one-off controls.
- When designing new interactive UI, prefer using or adapting components and interaction patterns from Magic UI, Animate UI, or React Bits to create a more alive, expressive visual language, while still matching the repository's existing design system and product tone.
- If the user says not to change a specific area, treat it as a hard constraint. Do not alter that area indirectly through content, hierarchy, visibility, or progressive disclosure unless the user explicitly reopens that scope.
- If the user explicitly asks to use a component from Magic UI, Animate UI, or React Bits, use the actual component implementation or a clearly vendored local copy. Do not approximate it with a custom recreation unless the user agrees.
- For product UI, optimize for focus first and delight second; improve clarity, hierarchy, and motivation without adding decorative noise.
- Prefer improving spacing, emphasis, feedback, and perceived responsiveness before adding new visual treatment.
- Use motion only when it improves comprehension or feedback, such as hover and tap states, layout transitions, progress updates, answer reveal, and card transitions.
- Keep motion subtle, fast, and low-amplitude; avoid slow transitions, looping decorative animation, excessive glow, and landing-page-style effects.
- Make primary actions visually obvious and avoid giving equal visual weight to every element on the screen.
- Keep review surfaces minimal, readable, and distraction-free; never trade readability for visual flair.
- Mobile support is required: new UI and changed UI flows must work on phones as well as desktop.
- When changing interactive flows, check both desktop and mobile behavior, including spacing, touch targets, wrapping, and perceived responsiveness.
- If the user rejects two consecutive UI passes on the same screen, stop iterative tweaking. Summarize the target layout, the non-goals, and why the current direction is failing before making more code changes.
- For user-visible UI changes, perform a visual self-review against the running app or screenshots before presenting the pass as complete. If the result still shows layout artifacts, conflicting visual language, duplicated information, or broken motion, keep iterating before asking the user to review.
- After deciding that user-visible UI development is ready for review, start the local app and local Storybook natively on Windows so the user can verify the real screen and component states before final handoff.
- For each new feature branch, start from a fresh `main`.
- If the task asks to match external product behavior (for example Anki), verify it from primary sources before implementing.
- If behavior changes touch shared review flows, keep the mechanics aligned across regular review, manual filtered review, and extra study unless the task explicitly says otherwise.
- When adding or fixing non-trivial logic, add automated tests for the new behavior or the regression being fixed.
- When UI behavior changes in a reusable or user-visible way, reflect it in Storybook when practical.
- For schema-alignment or contract-cleanup work, preserve the current canonical stored schema on `main`. If backward compatibility is needed, add the smallest read/import normalization layer that solves the real problem instead of reintroducing the legacy schema wholesale.
- Before finalizing a branch, run the relevant verification commands for the touched area: targeted `eslint`, tests, `tsc`, and Storybook build when stories were changed.
- At the end of each implementation task that results in a PR or status-bearing delivery, call the `$product-manager` skill to capture the shipped scope, current status, and any follow-up context in Linear.
- After creating a PR, call the `$product-manager` skill to update the related Linear issue(s), sync the current implementation status, and add the PR link/reference in Linear.
- For this repository, always use native Windows PowerShell, Windows Git/GitHub CLI, and Windows Node tooling for git, gh, npm, Node, lint, test, build, and dev-server commands. Never invoke WSL or use Linux helper scripts as a fallback.
- Use `npm.cmd` and `npx.cmd` from PowerShell. If a required Windows tool is unavailable, report or fix the Windows environment instead of switching execution environments.
- For PR descriptions and other multi-line GitHub payloads, write a temporary UTF-8 file without BOM and use `gh pr create --body-file` or the corresponding file-input API.
- Do not run `git commit` and `git push` in parallel. Commit first, then push, then verify the remote branch head before creating or updating a PR.
- When running `git commit` from PowerShell, avoid nested quote patterns that can truncate the subject. Prefer a simple single-line message or a temporary UTF-8 commit message file.
- Before sharing local app or Storybook URLs, verify them from Windows with `curl.exe -I`. If a process is listening but the page returns `5xx`, report that runtime failure.
- In a fresh Windows worktree, install dependencies locally before running Vitest, ESLint, TypeScript, Storybook, or build commands.
- In this repo, Vitest uses explicitly scoped unit and Storybook projects. Before adding a test outside an existing include glob, update the unit project's include list and verify the full `npm test -- --run` output reports the new file.
- If `git merge --autostash` or `git pull --autostash` leaves conflicts behind, do not consider the sync finished until the conflict set is resolved or explicitly handed back to the user with the affected files listed.

## Default UI Libraries

| Library | Relationship to shadcn | Default use in this repo |
| --- | --- | --- |
| Magic UI | shadcn/Tailwind-compatible, but not just a thin shadcn layer | Use for expressive UI patterns when they still fit the existing product language |
| Animate UI | shadcn registry-based and the most natural external fit for this codebase | Prefer first for motion-aware components that should stay close to existing shadcn/shared primitives |
| React Bits | separate React pattern library, not a shadcn layer | Use selectively for isolated interactions or effects, not as a new base visual system |

- When choosing among external UI libraries by default, check Animate UI first, then Magic UI, then React Bits.
- Keep shadcn/shared repository primitives as the base layer; external libraries should extend that layer, not replace it.

## UI / Storybook Execution Order

- For user-visible UI work, first update the real app flow, then update Storybook, then manually sanity-check both before considering the task complete.
- For every user-visible page or screen, create and maintain a page-level Storybook story so the full surface can be visually reviewed in isolation without depending on auth, live backend state, or business-logic entry conditions.
- Prefer visual verification in isolated Storybook page stories before relying on the running app, especially when auth, routing, or server data would otherwise block fast iteration.
- When a component uses `next/navigation`, App Router hooks, app-level fonts, or global Tailwind/shadcn styling, make Storybook mirror the app shell before debugging the component itself.
- Storybook setup must include the app global CSS, Next App Router mode, and the same font setup used by the app whenever visual parity matters.
- If a Storybook-rendered component throws a context error, first check missing providers, missing App Router setup, and missing environment assumptions before changing product code.
- After changing shared or reusable UI, verify Storybook for the exact states touched by the task, not just a successful build.
- When using dropdown/menu primitives, follow the component contract exactly; do not use label/group-specific subcomponents outside their required parent wrappers.
- When the same action row appears in multiple states, keep button hierarchy, sizing, alignment, and secondary-action styling consistent unless the product requirement explicitly calls for a difference.

## PR / Delivery Order

- Before creating a PR, make sure `docs/` and `specs/` already describe the shipped behavior in the branch.
- If a branch accumulates local changes after syncing with a newer `main`, refresh `docs/` and `specs/` for the final merged behavior in the branch, not just the original pre-merge intent.
- Create the branch PR only after verification passes locally for the touched area.
- Do not wait for separate user approval to open the branch PR once the implementation is ready locally; create it proactively and continue iterating on the same PR as follow-up changes land.
- PRs must start with the final title and a complete description; immediately verify the created PR title/body instead of assuming the CLI request succeeded.
- Create PRs with multi-line descriptions through a temporary UTF-8 file and `gh pr create --body-file`; do not pass generated Markdown inline through PowerShell.
- Before sharing a PR link, verify that the PR is open and that it corresponds to the current branch head. If the previous PR for the branch is merged or closed, create a new PR instead of reusing the old link.
- After every follow-up push to an open PR, re-check the live PR `headRefOid` against the local branch head before reporting the PR as updated.
- When automated code review is configured, do not merge on green CI alone. Wait until the reviewer has reported on the current head SHA, then inspect and resolve every materially actionable thread before merging.
- If GitHub CLI PR editing fails, patch the PR via `gh api` and then re-check the live PR fields.
- If a GitHub write command partially succeeds before failing because of shell quoting or command chaining, verify the live GitHub state first and only then retry.
- After the PR is created, move related Linear issues to the correct review state, add the PR link/reference, and leave a short implementation status comment.
- If the PR includes repo instruction changes, treat those instructions as part of the delivered scope: mention them in the PR description and include them in the related Linear update/status comment.
- If a review comment is fixed in a follow-up PR after the original PR is merged, add a backlink comment on the original PR and resolve the original review thread when repository permissions allow.
- Do not leave temporary PR notes or helper files untracked in the branch after the PR is created.

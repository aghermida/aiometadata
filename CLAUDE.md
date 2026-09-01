# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AIOMetadata is a personal fork of [`cedya77/aiometadata`](https://github.com/cedya77/aiometadata), a Stremio metadata addon (TMDB/TVDB-backed catalogs, search, AI-assisted search). This fork adds its own features on top (e.g. an admin auth gate, a landing page) while staying in sync with upstream.

## Fork sync conventions (read before touching `.github/workflows/` or deleting/renaming any file)

`.github/workflows/docker.yml` merges `upstream/dev` (`cedya77/aiometadata`) into `dev` every night (cron), on every push, and on manual dispatch, then pushes the result and builds/publishes the Docker image. For this automation to keep working with **zero manual intervention**, the merge must apply cleanly every single time — it only fails when a fork-only change touches something upstream is still actively evolving on its own.

This exact thing already happened once: this fork deleted `.github/workflows/docker-release.yml` and `.github/workflows/release-please.yml` (consolidated into this fork's own `docker.yml`), but upstream kept modifying both files, so every nightly sync hit a `modify/delete` conflict and failed (2026-08-19 to 2026-08-21, fixed in PR #12). Follow these rules so it doesn't happen again, for any file:

1. **Never delete, rename, or replace a file that still exists upstream** without registering it. If upstream's version of a file genuinely needs to be swapped out for this fork (as with the two workflow files above), add its path to the `FORK_DELETED_UPSTREAM_FILES` array at the top of the "Sync fork with upstream" step in `docker.yml`, with a one-line comment explaining why. That list — not manual conflict resolution after the fact — is what makes the deletion survive every future upstream edit to that file.
2. **Prefer new, uniquely-named files/directories for fork-only functionality** (e.g. `addon/lib/landingPage.ts`). Upstream will never create a file with that name, so there is no collision surface, ever — this is always safer than rule 1.
3. **When a fork-only feature must live inside a file upstream also owns** (e.g. `addon/lib/getSearch.ts`, `configure/src/contexts/config.ts`), change it additively: new branches/cases, new optional fields, new exports — don't delete or restructure the surrounding code upstream still maintains. Git's line-based merge only conflicts where both sides touch the *same* lines, so additive edits keep merging cleanly even as upstream keeps changing the file around them.
4. Treat everything under `.github/workflows/` as upstream-owned by default — assume upstream will keep editing any workflow file it ships, and apply rule 1 there specifically.
5. When merging a PR that contains a `Merge upstream/dev into dev` commit (or otherwise carries upstream's history), always use a real merge commit — **never squash**. Squashing breaks the shared history with upstream and causes the *next* nightly sync to fail for an unrelated reason (a fresh merge-base mismatch). PRs #10 and #12 were merged this way; keep doing it.
6. **Mark any fork-only code that must stay inside a shared file with a `// [FORK-9xxxx]` comment**, using the next free ID from this list (sequential, starting at 90000): `90001` landing page route body (`addon/index.ts`, logic lives in `addon/lib/landingPage.ts`), `90002` force-refresh-external-cache route + its UI handler (`addon/index.ts`, `configure/src/components/sections/CatalogsSettings.tsx`), `90003` landing/admin-gate wiring (`configure/src/App.tsx`, logic lives in `configure/src/components/ForkGate.tsx`), `90005` defensive fallback for a removed AI-provider option (`addon/lib/getSearch.ts`, `configure/src/components/sections/SearchSettings.tsx`). Next free ID: `90006`. This makes every fork-owned line inside a shared file `grep`-able (`grep -rn "FORK-9" .`) regardless of how the surrounding upstream code changes.

## Required checklist when removing or restructuring fork-only code

This is not optional guidance — follow every step before calling a fork-cleanup PR (like the Ollama removal, PR #16) done:

1. **Check for legacy compatibility before deleting an option/enum value.** If a config field (e.g. `ai_provider`) can hold a value tied to the feature being removed, decide explicitly what a config saved with the old value should do — normalize it to a safe default with one visible line, never let it fall through an `else`/`|| default` by accident.
2. **Verify a suspicious line's origin with `git log -S'<snippet>' -- <file>` before removing it** — especially anything that looks like a workaround (`|| true`, a widened type, a disabled check). Confirm it was introduced by the same commit that added the feature being removed, not for an unrelated reason that happens to share the line.
3. **Split the work into separate, self-contained commits** — one per logical concern (e.g. "remove the feature" / "isolate what's left" / "update docs") — so a review comment or CI failure on one doesn't block the rest, and each commit is independently revertable.
4. **Before calling it done, trial-merge against the live `upstream/dev`**: `git fetch upstream dev && git merge-tree --write-tree HEAD upstream/dev`. A clean diff against a stale local snapshot is not the same as a clean merge — always re-fetch first.
5. **After deploying, verify live**, at minimum unauthenticated: hit `/` and `/configure` and confirm the landing page renders and the admin gate still blocks access. Don't rely on `npm run build`/lint alone to catch a runtime regression.
6. **Commit as the GitHub noreply email**, not a real address: `<github-user-id>+<username>@users.noreply.github.com` (look up the id with `gh api user --jq .id` if unknown). This repo's owner has GitHub's email-privacy push protection enabled, so a commit authored with a real email gets rejected on push (`GH007`). Set `GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_EMAIL` for the commit itself — never change the global/local git config to do this.

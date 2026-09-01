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

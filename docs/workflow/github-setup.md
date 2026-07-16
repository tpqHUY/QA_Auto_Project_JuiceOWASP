# GitHub setup (one-time)

Wire up the GitHub side of the workflow: labels, a Kanban board, the backlog, and
branch protection. Do it in this order — later steps depend on earlier ones.

> All steps are done on GitHub.com (no `gh` CLI required). Repo:
> `tpqHUY/QA_Auto_Project_JuiceOWASP`.

## Prerequisite

The process files must already be on the default branch (`.github/ISSUE_TEMPLATE/*`,
`.github/labels.yml`, `.github/workflows/labels.yml`). Pushing them also triggers the
`labels`, `checks`, and `smoke` workflows — the last one makes the status-check names
appear in step 4.

## 1. Verify labels & templates

1. **Actions** tab → confirm the **labels** run is green (re-run it if the first run failed).
2. **Issues → Labels** → you should see `type/*`, `priority/*`, `status/*`, `area/*`.
3. **Issues → New issue** → you should see 4 templates (Bug / Feature test / Flaky / Tech debt).

## 2. Create the Project board (Kanban)

1. **Projects** tab → **New project** → template **Board** → name it `Juice Shop QA` → **Create**.
2. Rename/add columns (the **Status** field) to: **Backlog · Ready · In progress · In review · Done**.
3. (Recommended) Project **···** → **Workflows** → enable **Auto-add to project** (filtered to
   this repo) so new issues land in Backlog automatically.

## 3. File the backlog as issues

For each row in [backlog.md](backlog.md):

1. **Issues → New issue** → pick the matching template.
2. Fill in title + body (copy from the backlog Notes).
3. Right sidebar → **Labels**: add `priority/Px` + `area/*` (`type/*` is preset by the template).
4. Right sidebar → **Projects**: add `Juice Shop QA`.
5. **Submit**. Repeat.

Create the [sprint-01](../sprints/sprint-01.md) items first (M2, M1, feature #1/#2, bug A).

> Tedious for ~20 issues — a `gh` CLI script can bulk-create them (`gh auth login` first).

## 4. Enable branch protection on `main`

> Do this **after** `smoke` has run at least once (Actions tab), so the check names are selectable.

1. **Settings → Branches** → under **Branch protection rules** click **Add rule**.
2. **Branch name pattern:** `main`.
3. Enable:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging** → search + select **`checks`** and **`smoke`**
   - ✅ **Require branches to be up to date before merging**
   - ✅ (recommended) **Do not allow bypassing the above settings** — so even the owner must use PRs
4. **Create**.

Direct `git push origin main` is now blocked — everything goes through a PR.

> **If GitHub only shows "Rulesets":** Settings → **Rules → Rulesets** → **New branch ruleset**
> → Target = `Default branch` → enable **Require a pull request** + **Require status checks**
> (add `checks`, `smoke`) → **Create**. Equivalent effect.

## 5. Per-ticket loop (from sprint 02 onward)

Example — ticket "Contact form" (issue #5):

```bash
git switch main && git pull                  # start from up-to-date main
git switch -c feat/contact-form              # one branch per ticket

# ...write test/code, run locally until green...
npm run typecheck && npm run lint && npm run test:unit
npx playwright test tests/ui/contact --project=chromium

git add -A
git commit -m "test: cover contact/complaint form"
git push -u origin feat/contact-form         # push the BRANCH, not main
```

On GitHub:

1. Click **Compare & pull request** → fill the PR template → write **`Closes #5`** in the body.
2. Wait for **CI green** (checks + smoke run on the PR).
3. **Self-review** the diff (Files changed tab).
4. **Squash and merge** → **Delete branch**.
5. Clean up locally:
   ```bash
   git switch main && git pull
   git branch -d feat/contact-form
   ```

End of sprint: update [metrics.md](metrics.md) and write a retro from the
[template](../sprints/retro-template.md).

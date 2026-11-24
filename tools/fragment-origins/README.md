# Fragment origin migration script

Replaces old SharePoint fragment origins (`main--dme-partners--adobecom.aem.live`) with `main--da-dme-partners--adobecom.aem.live` in DA pages,
then bulk previews and publishes the changed pages.

## 1. Setup

1. Run `npm ci` in the repository root.
2. Get your token: open da.live → DevTools → **Network** → click any `admin.da.live`
   request → copy the `Authorization` header value **without** `Bearer `.
3. Run the script once (for example the dry run below). It creates
   `tools/fragment-origins/.env` and stops with "No token found".
4. Paste the token after `DA_TOKEN=` in `tools/fragment-origins/.env` and save.
   `.env` is git-ignored, so the token is never committed. The token expires after
   about 24 hours; paste a new one in the same place.

## 2. Dry run (changes nothing)

```sh
node tools/fragment-origins/run.js --root /channelpartners > dry-run.jsonl
tail -1 dry-run.jsonl
```

Leave out `--root` to scan the whole site. Check the results before going further:

```sh
jq -r 'select(.event=="page-excluded") | "\(.reason)\t\(.page)"' dry-run.jsonl
jq -r 'select(.event=="fragment-skipped") | "\(.reason)\t\(.page)"' dry-run.jsonl
```

## 3. Real run

Start with one small folder, check it, then run the rest:

```sh
node tools/fragment-origins/run.js --root /channelpartners/some-folder --apply --authoring-paused > trial.jsonl
node tools/fragment-origins/run.js --apply --authoring-paused > apply.jsonl
```

After the trial, check that fragments open in DA (not SharePoint) and that
view-source shows the new origin.

## What to expect

- Fragments missing from DA or not published are **skipped**.
- Pages with unpublished author changes get the corrected links in DA but are
  **not previewed or published**.
- Folders named `drafts` are skipped (use `--include-drafts` to scan them).
- The last log lines are `recovery` (pages saved but not published, to follow up
  on) and `summary` (counts).
- The original HTML of every changed page is saved in `tools/fragment-origins/backups/`.
  To undo: `node tools/fragment-origins/run.js --restore <backup dir> --apply --authoring-paused`
  (only reverts pages nobody edited since; it does not publish).

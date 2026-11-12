/* eslint-env node */
/* eslint no-console: "off" */
import { writeFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createClient, migrate, restore } from './migrate.js';

const FOLDER_PATH = /^\/(?:[a-zA-Z0-9_-]+\/?)*$/;
const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.join(TOOL_DIR, 'backups');
const ENV_FILE = path.join(TOOL_DIR, '.env');
const ENV_TEMPLATE = `# Paste your da.live token right after the = sign, on one line, then save.
# No quotes and no "Bearer " prefix. This file is git-ignored: never commit or share it.
DA_TOKEN=
`;

// Tokens come from the environment or from the git-ignored .env next to this script,
// which is created empty on first run.
// AEM_TOKEN defaults to DA_TOKEN: the da.live login token also works for the AEM Admin API.
function readTokens() {
  try {
    writeFileSync(ENV_FILE, ENV_TEMPLATE, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw new Error(`Cannot create ${ENV_FILE}: ${error.message}`);
  }
  process.loadEnvFile(ENV_FILE);
  const clean = (value) => (value || '').trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  const daToken = clean(process.env.DA_TOKEN);
  const aemToken = clean(process.env.AEM_TOKEN) || daToken;
  if (!daToken) {
    throw new Error(`No token found. Paste your da.live token after DA_TOKEN= in ${ENV_FILE} and save the file.`);
  }
  return { daToken, aemToken };
}

// Keeps the original and the saved HTML of every page, so --restore can verify before reverting.
function backupWriter(dir) {
  return async ({ path: page, original, updated }) => {
    for (const [kind, html] of [['original', original], ['migrated', updated]]) {
      const file = path.join(dir, kind, ...page.split('/'));
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, html);
    }
  };
}

async function readBackups(dir) {
  const originals = path.join(dir, 'original');
  const files = (await readdir(originals, { recursive: true })).filter((file) => file.endsWith('.html'));
  return Promise.all(files.map(async (file) => ({
    path: `/${file.split(path.sep).join('/')}`,
    original: await readFile(path.join(originals, file), 'utf8'),
    migrated: await readFile(path.join(dir, 'migrated', file), 'utf8'),
  })));
}

function folderPath(value, option) {
  const folder = value.replace(/\/+$/, '') || '/';
  if (!FOLDER_PATH.test(folder)) {
    throw new Error(`${option} must be an absolute DA folder path with no traversal, query or extension`);
  }
  return folder;
}

async function main() {
  const { values } = parseArgs({
    options: {
      apply: { type: 'boolean', default: false },
      'authoring-paused': { type: 'boolean', default: false },
      root: { type: 'string', default: '/' },
      exclude: { type: 'string', multiple: true, default: [] },
      'include-drafts': { type: 'boolean', default: false },
      'backup-dir': { type: 'string' },
      restore: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) {
    console.log(`Usage: node tools/fragment-origins/run.js [--root /folder] [--exclude /folder ...]
         [--include-drafts] [--backup-dir dir] [--apply --authoring-paused]
       node tools/fragment-origins/run.js --restore <backup dir> [--apply --authoring-paused]`);
    return;
  }
  const root = folderPath(values.root, '--root');
  const exclude = values.exclude.map((folder) => folderPath(folder, '--exclude'));
  const tokens = readTokens();
  if (values.apply && !values['authoring-paused']) {
    throw new Error('Pause authoring/preview/publish and pass --authoring-paused before applying');
  }
  const client = createClient(tokens);

  if (values.restore) {
    const documents = await readBackups(path.resolve(values.restore));
    const summary = await restore({ client, documents, apply: values.apply });
    if (summary.failed) process.exitCode = 1;
    return;
  }

  const backupDir = path.resolve(values['backup-dir'] || path.join(BACKUP_ROOT, new Date().toISOString().replace(/[:.]/g, '-')));
  if (values.apply) console.log(JSON.stringify({ event: 'backup-dir', dir: backupDir }));
  const summary = await migrate({
    client,
    root,
    exclude,
    includeDrafts: values['include-drafts'],
    apply: values.apply,
    backup: backupWriter(backupDir),
  });
  if (summary.pagesFailed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

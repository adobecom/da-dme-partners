/* eslint-env node */
/* eslint no-console: "off", no-continue: "off" */
import { parse } from 'parse5';

export const NEW_HOST = 'main--da-dme-partners--adobecom.aem.live';
export const LEGACY_HOSTS = [
  'main--dme-partners--adobecom.aem.live',
  'stage--dme-partners--adobecom.aem.live',
  'main--dme-partners--adobecom.aem.page',
  'stage--dme-partners--adobecom.aem.page',
  'main--dme-partners--adobecom.hlx.live',
  'stage--dme-partners--adobecom.hlx.live',
];
// Other dme-partners hosts (e.g. *.hlx.page) are reported as skipped, never rewritten.
const DME_PARTNERS_HOST = /^[a-z0-9-]+--dme-partners--adobecom\.(?:aem|hlx)\.(?:page|live)$/;

const DA = 'https://admin.da.live';
const ADMIN = 'https://admin.hlx.page';
const SITE = '/adobecom/da-dme-partners';
const REF = `${SITE}/main`;
const BULK_BATCH_SIZE = 200;
const JOB_POLLS = 600;
const JOB_POLL_MS = 2000;

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Authentication failures abort the run; any other error only fails the page it occurred on.
export function isFatal(error) {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

function logJSON(entry) {
  console.log(JSON.stringify(entry));
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function visit(node, callback) {
  callback(node);
  (node.childNodes || []).forEach((child) => visit(child, callback));
}

function legacyURL(value) {
  if (!/^https?:\/\//i.test(value.trim())) return null;
  if (!URL.canParse(value.trim())) return null;
  const url = new URL(value.trim());
  const legacy = LEGACY_HOSTS.includes(url.hostname) || DME_PARTNERS_HOST.test(url.hostname);
  return legacy && !url.port && !url.username && !url.password ? url : null;
}

function isFragment(node, pathname) {
  if (pathname.includes('/fragments/')) return true;
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    const classes = parent.attrs?.find((attr) => attr.name === 'class')?.value.split(/\s+/);
    if (classes?.includes('fragment')) return true;
  }
  return false;
}

// Use parser offsets so only the hostname changes, not HTML formatting or escaping.
export function findFragments(html) {
  const references = [];
  visit(parse(html, { sourceCodeLocationInfo: true }), (node) => {
    if (node.tagName !== 'a') return;
    const href = node.attrs.find((attr) => attr.name === 'href');
    const parts = [];
    const hrefURL = href && legacyURL(href.value);
    if (hrefURL) {
      parts.push({ url: hrefURL, location: node.sourceCodeLocation?.attrs?.href });
    }
    visit(node, (child) => {
      if (child.nodeName !== '#text') return;
      const url = legacyURL(child.value);
      if (url) parts.push({ url, location: child.sourceCodeLocation });
    });
    if (!parts.length || !isFragment(node, parts[0].url.pathname)) return;
    const { pathname } = parts[0].url;
    const hrefPath = href && URL.canParse(href.value, `https://${NEW_HOST}`)
      ? new URL(href.value, `https://${NEW_HOST}`).pathname : null;
    const ambiguous = parts.some(({ url }) => url.pathname !== pathname)
      || (href && (!hrefPath || hrefPath !== pathname));
    const edits = parts.flatMap(({ url, location }) => {
      if (!location) return [];
      const raw = html.slice(location.startOffset, location.endOffset);
      const offset = raw.toLowerCase().indexOf(url.hostname);
      if (offset < 0) return [];
      return [{
        start: location.startOffset + offset,
        end: location.startOffset + offset + url.hostname.length,
      }];
    });
    const unlisted = parts.find(({ url }) => !LEGACY_HOSTS.includes(url.hostname));
    let reason = null;
    if (unlisted) reason = `unlisted legacy host ${unlisted.url.hostname}`;
    else if (ambiguous || edits.length !== parts.length) reason = 'ambiguous fragment markup';
    references.push({ path: pathname, edits, reason });
  });
  return references;
}

function webPath(path) {
  return path.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
}

function sourcePath(path) {
  if (path.endsWith('/')) return `${path}index.html`;
  return path.endsWith('.html') ? path : `${path}.html`;
}

function stamp(value) {
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : null;
}

// AEM status has no edit date for DA sources, so the DA last-modified time is passed in.
// Previewing from the DA editor saves the document again a few seconds later, hence the tolerance.
const AUTHORED_TOLERANCE_MS = 30000;

export function publicationReason(status, authored) {
  const { edit, preview, live } = status;
  if (edit?.status !== 200 || preview?.status !== 200 || live?.status !== 200) {
    return 'page is not authored, previewed and published';
  }
  const times = [
    preview.sourceLastModified, live.sourceLastModified, preview.lastModified, live.lastModified,
  ].map(stamp);
  if (times.includes(null) || !Number.isFinite(authored)) return 'publication timestamps are incomplete';
  const [previewSource, liveSource, previewed, published] = times;
  if (previewSource !== liveSource || previewed > published) {
    return 'page has unpublished preview changes';
  }
  if (authored > previewSource + AUTHORED_TOLERANCE_MS) return 'page has unpublished authored changes';
  return null;
}

function liveVersion(status) {
  return JSON.stringify([status.live?.status, status.live?.lastModified,
    status.live?.sourceLastModified]);
}

function previewVersion(status) {
  return JSON.stringify([status.preview?.status, status.preview?.lastModified,
    status.preview?.sourceLastModified]);
}

export function createClient({ daToken, aemToken, fetchImpl = fetch, wait = delay, retries = 4 }) {
  // Retries network errors, 429 and 5xx with backoff (honouring Retry-After); other errors throw.
  async function request(url, options = {}, allowMissing = false) {
    const method = options.method || 'GET';
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(url, {
          ...options,
          redirect: 'error',
          signal: AbortSignal.timeout(60000),
          headers: {
            Authorization: `Bearer ${url.startsWith(DA) ? daToken : aemToken}`,
            ...options.headers,
          },
        });
      } catch (error) {
        if (attempt === retries) throw new Error(`${method} ${url}: ${error.message}`);
        await wait(1000 * 2 ** attempt);
        continue;
      }
      if (allowMissing && response.status === 404) return null;
      if (response.ok) return response;
      if ((response.status !== 429 && response.status < 500) || attempt === retries) {
        throw new HttpError(`${method} ${url}: HTTP ${response.status}`, response.status);
      }
      const retryAfter = Number(response.headers.get('retry-after'));
      await wait(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
    }
    throw new Error(`${method} ${url}: retries exhausted`);
  }

  // AEM admin jobs go created -> running -> stopped; "stopped" is the normal end state.
  async function waitForJob(jobURL, topic) {
    for (let poll = 0; poll < JOB_POLLS; poll += 1) {
      const job = await (await request(jobURL)).json();
      if (job.state === 'stopped') {
        if (job.cancelled) throw new Error(`${topic} job ${jobURL} was cancelled`);
        return;
      }
      await wait(JOB_POLL_MS);
    }
    throw new Error(`${topic} job timed out; inspect ${jobURL} before retrying`);
  }

  const client = {
    async list(path, token) {
      const response = await request(`${DA}/list${SITE}${path}`, { headers: token ? { 'da-continuation-token': token } : {} });
      const entries = await response.json();
      if (!Array.isArray(entries)) throw new Error(`Invalid DA listing for ${path}`);
      return { entries, token: response.headers.get('da-continuation-token') };
    },
    async source(path) {
      const response = await request(`${DA}/source${SITE}${path}`, {}, true);
      return response ? response.text() : null;
    },
    // DA last-modified time of a document (ms), or null if it does not exist.
    async modified(path) {
      const response = await request(`${DA}/source${SITE}${path}`, { method: 'HEAD' }, true);
      return response ? stamp(response.headers.get('last-modified')) : null;
    },
    async status(path) {
      const response = await request(`${ADMIN}/status${REF}${webPath(path)}?editUrl=auto`);
      return response.json();
    },
    async save(path, html) {
      const body = new FormData();
      body.append('data', new Blob([html], { type: 'text/html' }), path.split('/').pop());
      await request(`${DA}/source${SITE}${path}`, { method: 'POST', body });
    },
    // Returns the web paths that succeeded and the per-path failures reported by the jobs.
    // A failed batch fails only its own paths, so results of completed batches are never lost.
    async bulk(topic, paths, log) {
      const endpoint = topic === 'publish' ? 'live' : 'preview';
      const ok = [];
      const failed = [];
      for (let i = 0; i < paths.length; i += BULK_BATCH_SIZE) {
        const batch = paths.slice(i, i + BULK_BATCH_SIZE);
        let jobURL;
        let resources;
        try {
          const response = await request(`${ADMIN}/${endpoint}${REF}/*`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paths: batch, forceUpdate: true, forceAsync: true }),
          });
          const { job } = await response.json();
          if (!job?.name || !job?.topic) throw new Error(`Invalid ${topic} job response`);
          jobURL = `${ADMIN}/job${REF}/${encodeURIComponent(job.topic)}/${encodeURIComponent(job.name)}`;
          log({ event: 'bulk-started', topic, jobURL, paths: batch });
          await waitForJob(jobURL, topic);
          const details = await (await request(`${jobURL}/details`)).json();
          resources = new Map((details.data?.resources || []).map((r) => [r.path, r]));
        } catch (error) {
          if (isFatal(error)) throw error;
          // The job may still have processed some paths; jobURL lets an operator check.
          log({ event: 'bulk-failed', topic, jobURL, paths: batch, message: error.message });
          batch.forEach((path) => failed.push({ path, reason: `bulk job failed: ${error.message}` }));
          continue;
        }
        let batchFailed = 0;
        batch.forEach((path) => {
          const resource = resources.get(path);
          if (resource?.status === 200 || resource?.status === 304) {
            ok.push(path);
            return;
          }
          batchFailed += 1;
          failed.push({
            path,
            reason: resource ? `HTTP ${resource.status}${resource.error ? ` ${resource.error}` : ''}` : 'missing from job details',
          });
        });
        log({ event: 'bulk-complete', topic, jobURL, succeeded: batch.length - batchFailed, failed: batchFailed });
      }
      return { ok, failed };
    },
  };
  return client;
}

function isExcluded(path, exclude) {
  return exclude.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

async function* pages(client, root, exclude, includeDrafts, log) {
  const folders = [root];
  const seen = new Set();
  while (folders.length) {
    const folder = folders.pop();
    if (seen.has(folder)) throw new Error(`Repeated DA folder: ${folder}`);
    seen.add(folder);
    let token;
    const tokens = new Set();
    do {
      const result = await client.list(folder, token);
      for (const entry of result.entries) {
        if (typeof entry.path !== 'string' || !entry.path.startsWith(`${SITE}/`)) {
          throw new Error(`Invalid DA entry: ${JSON.stringify(entry)}`);
        }
        const path = entry.path.slice(SITE.length);
        const prefix = folder.endsWith('/') ? folder : `${folder}/`;
        if (!path.startsWith(prefix) || path.slice(prefix.length).includes('/')) {
          throw new Error(`DA entry outside listed folder: ${entry.path}`);
        }
        // Dot folders (.da, .trash, ...) are never content; drafts folders are personal test pages.
        const name = path.slice(prefix.length);
        if (name.startsWith('.') || (!entry.ext && name === 'drafts' && !includeDrafts)
          || isExcluded(path, exclude)) {
          log({ event: 'path-excluded', path });
          continue;
        }
        if (!entry.ext) folders.push(path);
        else if (entry.ext === 'html') yield path;
      }
      token = result.token;
      if (token && tokens.has(token)) throw new Error(`Repeated DA continuation token: ${folder}`);
      tokens.add(token);
    } while (token);
  }
}

async function exclusion(client, page, phase) {
  if (await client.source(page.path) !== page.html) return `source changed before ${phase}`;
  const status = await client.status(page.path);
  if (liveVersion(status) !== liveVersion(page.baseline)) return `live changed before ${phase}`;
  if (phase === 'preview') {
    if (previewVersion(status) !== previewVersion(page.baseline)) return 'preview changed after scan';
  } else if (previewVersion(status) !== previewVersion(page.previewed)) {
    return 'preview changed after migration preview';
  }
  return null;
}

async function fragmentSkipReason(client, path) {
  try {
    if (await client.source(sourcePath(path)) === null) return 'fragment missing from DA';
    const status = await client.status(path);
    if (status.live?.status === 404) return 'fragment is not published';
    if (status.live?.status !== 200 || stamp(status.live.lastModified) === null) {
      return 'fragment publication could not be verified';
    }
    return null;
  } catch (error) {
    if (isFatal(error)) throw error;
    return `fragment check failed: ${error.message}`;
  }
}

export async function migrate({
  client, root = '/', apply = false, exclude = [], includeDrafts = false,
  backup = async () => {}, log = logJSON,
}) {
  const summary = {
    dryRun: !apply,
    pagesChecked: 0,
    fragmentsChecked: 0,
    fragmentsUnique: 0,
    fragmentsPlanned: 0,
    fragmentsUpdated: 0,
    fragmentsSkipped: 0,
    pagesUpdated: 0,
    pagesExcluded: 0,
    pagesFailed: 0,
    pagesPreviewed: 0,
    pagesPublished: 0,
  };
  const fragmentChecks = new Map();
  const checkFragment = (path) => {
    if (!fragmentChecks.has(path)) fragmentChecks.set(path, fragmentSkipReason(client, path));
    return fragmentChecks.get(path);
  };
  const saved = [];
  const previewedPaths = new Set();
  const published = new Set();
  const updated = [];

  const failPage = (page, error) => {
    if (isFatal(error)) throw error;
    summary.pagesFailed += 1;
    log({ event: 'page-failed', page, message: error.message });
  };
  const excludePage = (page, reason) => {
    summary.pagesExcluded += 1;
    log({ event: 'page-excluded', page, reason });
  };

  async function processPage(path) {
    const original = await client.source(path);
    if (original === null) throw new Error(`Page disappeared during scan: ${path}`);
    const refs = findFragments(original);
    if (!refs.length) return;
    const edits = [];
    let accepted = 0;
    for (const ref of refs) {
      summary.fragmentsChecked += 1;
      const skip = ref.reason || await checkFragment(ref.path);
      if (skip) {
        summary.fragmentsSkipped += 1;
        log({ event: 'fragment-skipped', page: path, fragment: ref.path, reason: skip });
      } else {
        edits.push(...ref.edits);
        accepted += 1;
        log({ event: 'fragment-eligible', page: path, fragment: ref.path });
      }
    }
    if (!accepted) return;
    summary.fragmentsPlanned += accepted;
    const baseline = await client.status(path);
    const reason = publicationReason(baseline, await client.modified(path));
    if (reason) excludePage(path, reason);
    if (!apply) return;
    let html = original;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      html = html.slice(0, edit.start) + NEW_HOST + html.slice(edit.end);
    }
    if (await client.source(path) !== original) throw new Error(`Source changed before write: ${path}`);
    const beforeWrite = await client.status(path);
    if (JSON.stringify(beforeWrite.edit) !== JSON.stringify(baseline.edit)
      || liveVersion(beforeWrite) !== liveVersion(baseline)
      || previewVersion(beforeWrite) !== previewVersion(baseline)) {
      throw new Error(`Page status changed before write: ${path}`);
    }
    await backup({ path, original, updated: html });
    await client.save(path, html);
    saved.push(path);
    summary.fragmentsUpdated += accepted;
    summary.pagesUpdated += 1;
    log({ event: 'page-updated', page: path, fragments: accepted });
    if (!reason) updated.push({ path, html, baseline, savedAt: await client.modified(path) });
  }

  try {
    // List everything first, so a listing failure aborts before any page is written.
    const paths = [];
    for await (const path of pages(client, root, exclude, includeDrafts, log)) paths.push(path);
    for (const path of paths) {
      summary.pagesChecked += 1;
      try {
        await processPage(path);
      } catch (error) {
        failPage(path, error);
      }
    }
    if (apply) {
      const eligible = [];
      for (const page of updated) {
        try {
          const reason = await exclusion(client, page, 'preview');
          if (reason) excludePage(page.path, reason);
          else eligible.push(page);
        } catch (error) {
          failPage(page.path, error);
        }
      }
      if (eligible.length) {
        const preview = await client.bulk('preview', eligible.map((page) => webPath(page.path)), log);
        const previewed = [];
        eligible.forEach((page) => {
          const failure = preview.failed.find(({ path }) => path === webPath(page.path));
          if (failure) failPage(page.path, new Error(`preview failed: ${failure.reason}`));
          else if (preview.ok.includes(webPath(page.path))) {
            previewed.push(page);
            previewedPaths.add(page.path);
          }
        });
        summary.pagesPreviewed = previewed.length;
        const publishable = [];
        for (const page of previewed) {
          try {
            page.previewed = await client.status(page.path);
            const { preview: state } = page.previewed;
            const previewSource = stamp(state?.sourceLastModified);
            // The preview must have been built from the source this run saved, or something later.
            if (state?.status !== 200 || previewSource === null
              || !Number.isFinite(page.savedAt) || previewSource < page.savedAt) {
              excludePage(page.path, 'preview does not match authored source');
              continue;
            }
            const reason = await exclusion(client, page, 'publish');
            if (reason) excludePage(page.path, reason);
            else publishable.push(page.path);
          } catch (error) {
            failPage(page.path, error);
          }
        }
        if (publishable.length) {
          const result = await client.bulk('publish', publishable.map(webPath), log);
          for (const path of publishable) {
            const failure = result.failed.find((f) => f.path === webPath(path));
            try {
              if (failure) throw new Error(`publish failed: ${failure.reason}`);
              if (!result.ok.includes(webPath(path))) continue;
              const reason = publicationReason(
                await client.status(path),
                await client.modified(path),
              );
              if (reason) throw new Error(`post-publish verification failed: ${reason}`);
              published.add(path);
              summary.pagesPublished += 1;
            } catch (error) {
              failPage(path, error);
            }
          }
        }
      }
    }
    return summary;
  } catch (error) {
    log({ event: 'error', message: error.message });
    throw error;
  } finally {
    summary.fragmentsUnique = fragmentChecks.size;
    if (apply) {
      // Saved in DA but not published by this run; review before any manual preview/publish.
      log({
        event: 'recovery',
        // Preview is now ahead of live for these pages.
        previewedNotPublished: saved.filter((path) => previewedPaths.has(path)
          && !published.has(path)),
        savedNotPreviewed: saved.filter((path) => !previewedPaths.has(path)),
      });
    }
    log({ event: 'summary', ...summary });
  }
}

// Puts back the original HTML of migrated documents, but only where the current DA source is
// still exactly what the migration saved, so later author edits are never overwritten.
export async function restore({ client, documents, apply = false, log = logJSON }) {
  const summary = {
    dryRun: !apply,
    documents: documents.length,
    restored: 0,
    skipped: 0,
    failed: 0,
  };
  try {
    for (const { path, original, migrated } of documents) {
      try {
        const current = await client.source(path);
        if (current !== migrated) {
          summary.skipped += 1;
          log({ event: 'restore-skipped', page: path, reason: current === null ? 'page no longer exists' : 'page changed since migration' });
          continue;
        }
        if (apply) await client.save(path, original);
        summary.restored += 1;
        log({ event: apply ? 'page-restored' : 'page-restorable', page: path });
      } catch (error) {
        if (isFatal(error)) throw error;
        summary.failed += 1;
        log({ event: 'restore-failed', page: path, message: error.message });
      }
    }
    return summary;
  } finally {
    log({ event: 'restore-summary', ...summary, note: 'restored sources are not previewed or published' });
  }
}

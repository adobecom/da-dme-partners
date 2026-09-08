/**
 * importImagesAfterContentMigration
 *
 * Walks the da.live content tree for a given org/repo, finds pages under
 * `/channelpartners` and `/{lang}/channelpartners`, downloads any images they
 * reference from the old dme-partners domain, re-uploads those images into a
 * `.da` folder alongside each page, rewrites the page HTML to point at the
 * new location, and uploads the updated page back to da.live.
 *
 * Usage (once implemented):
 *   DA_ADMIN_TOKEN=xxxxx node tools/importImagesAfterContentMigration/index.js
 */

import { load } from 'cheerio';
import {
  ORG,
  REPO,
  ROOT_PATH,
  WILDCARD_SUBPATH,
  DA_ADMIN_BASE_URL,
  CONTENT_DA_BASE_URL,
  OLD_IMAGE_DOMAIN,
  AUTH_TOKEN,
  OLD_SITE_AUTH_TOKEN,
} from './config.js';

/**
 * Step 1: List all page paths under /channelpartners and /{lang}/channelpartners
 * Uses GET https://admin.da.live/list/{org}/{repo}/{path}
 * @returns {Promise<string[]>} list of page paths to process
 */
async function getAllPagePaths() {
  const pagePaths = [];
  // TODO: also traverse `/{lang}/${WILDCARD_SUBPATH}` for every top-level lang folder

  async function traverse(path) {
    const items = await listPath(path);
    // da.live returns absolute paths prefixed with /{org}/{repo} - strip that
    // so we're left with paths relative to the repo root.
    const relativeItems = items.map((item) => ({
      ...item,
      path: item.path.replace(`/${ORG}/${REPO}`, ''),
    }));
    // eslint-disable-next-line no-restricted-syntax
    for (const item of relativeItems) {
      if (isFile(item)) {
        pagePaths.push(`/${ORG}/${REPO}${item.path}`);
      } else {
        // Folder -> recurse into it
        // eslint-disable-next-line no-await-in-loop
        await traverse(item.path);
      }
    }
  }

  await traverse(ROOT_PATH);
  return pagePaths;
}

/**
 * da.live list entries only have an `ext` for files/pages; folders don't.
 * @param {{path: string, ext?: string}} item
 */
function isFile(item) {
  return typeof item.ext === 'string' && item.ext.length > 0;
}

/**
 * Calls the da.live list API for a single path.
 * GET https://admin.da.live/list/{org}/{repo}/{path}
 * @param {string} path
 * @returns {Promise<{path: string, name: string, ext?: string}[]>}
 */
async function listPath(path) {
  const resp = await fetch(`${DA_ADMIN_BASE_URL}/list/${ORG}/${REPO}${path}`, { headers: authHeaders() });
  if (!resp.ok) {
    throw new Error(`Failed to list ${path}: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Step 2: Fetch the HTML source for a single page.
 * GET https://admin.da.live/source/{org}/{repo}/{path}
 * @param {string} path full path including the /{org}/{repo} prefix
 * @returns {Promise<string>} the page HTML
 */
async function fetchPageSource(path) {
  const resp = await fetch(`${DA_ADMIN_BASE_URL}/source${path}`, { headers: authHeaders() });
  if (!resp.ok) {
    throw new Error(`Failed to fetch page source ${path}: ${resp.status} ${resp.statusText}`);
  }
  return resp.text();
}

/**
 * Step 3: Find <img>/<source> elements in the page HTML whose attribute
 * values point at the old dme-partners domain.
 * @param {string} html
 * @returns {{attribute: string, value: string, src: string}[]} matches found in the page
 */
function findDmePartnersImageSrcs(html) {
  const $ = load(html);
  const matches = [];

  $('img, source').each((_, el) => {
    Object.entries(el.attribs).forEach(([attribute, value]) => {
      if (!value.includes(OLD_IMAGE_DOMAIN)) return;
      // srcset can contain multiple comma-separated "url descriptor" entries
      const urls = value.split(',').map((entry) => entry.trim().split(/\s+/)[0]);
      urls.forEach((src) => {
        if (src.includes(OLD_IMAGE_DOMAIN)) {
          matches.push({ attribute, value, src });
        }
      });
    });
  });

  return matches;
}

/**
 * Step 4: Download an image from its old dme-partners URL.
 * @param {string} srcUrl
 * @returns buffer, contantType
 */
async function downloadImage(srcUrl) {
  const headers = OLD_SITE_AUTH_TOKEN ? { 'authorization': OLD_SITE_AUTH_TOKEN } : {};
  const resp = await fetch(srcUrl, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to download image ${srcUrl}: ${resp.status} ${resp.statusText}`);
  }
  const contentType = resp.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await resp.arrayBuffer());
  return { buffer, contentType };
}

/**
 * Builds the `.{pageName}` assets folder path that sits next to a page,
 * e.g. pagePath '/org/repo/channelpartners/foo/bar' -> '/org/repo/channelpartners/foo/.bar'.
 * @param {string} pagePath
 */
function getPageAssetsFolder(pagePath) {
  const lastSlash = pagePath.lastIndexOf('/');
  const dir = pagePath.slice(0, lastSlash);
  const pageName = pagePath.slice(lastSlash + 1);
  return `${dir}/.${pageName}`;
}

/**
 * Extracts a decoded file name (with extension) from an image URL.
 * Underscores are replaced with hyphens before uploading.
 * @param {string} srcUrl
 */
function getFileNameFromUrl(srcUrl) {
  const { pathname } = new URL(srcUrl);
  const fileName = decodeURIComponent(pathname.split('/').pop());
  return fileName.replace(/_/g, '-');
}

/**
 * Ensures fileName is unique within a page's assets folder, avoiding
 * duplicate/overwritten images when two different source URLs happen to
 * share the same file name. Appends `-2`, `-3`, etc. before the extension.
 * @param {Set<string>} usedFileNames
 * @param {string} fileName
 */
function getUniqueFileName(usedFileNames, fileName) {
  if (!usedFileNames.has(fileName)) return fileName;

  const dot = fileName.lastIndexOf('.');
  const base = dot === -1 ? fileName : fileName.slice(0, dot);
  const ext = dot === -1 ? '' : fileName.slice(dot);

  let counter = 2;
  let candidate = `${base}-${counter}${ext}`;
  while (usedFileNames.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}${ext}`;
  }
  return candidate;
}

/**
 * Step 5: Upload the downloaded image into the page's `.{pageName}` folder.
 * PUT https://admin.da.live/source/{org}/{repo}/{path}/.{pageName}/{fileName}
 * @param {string} pagePath page path the image belongs to (used to derive folder)
 * @param {string} fileName
 * @param {Buffer} content
 * @param {string} contentType
 * @returns {Promise<string>} the new path the image was uploaded to
 */
async function uploadImage(pagePath, fileName, content, contentType) {
  const imagePath = `${getPageAssetsFolder(pagePath)}/${fileName}`;

  const form = new FormData();
  form.append('data', new Blob([content], { type: contentType }), fileName);

  const resp = await fetch(`${DA_ADMIN_BASE_URL}/source${imagePath}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: form,
  });
  const responseBody = await resp.text();

  console.log('resp URL:', responseBody);
  if (!resp.ok) {
    throw new Error(`Failed to upload image ${imagePath}: ${resp.status} ${resp.statusText}`);
  }
  return imagePath;
}

/**
 * Step 6: Replace a single old dme-partners image src with its new da.live
 * path within the raw page HTML (covers both `src` and `srcset` entries,
 * since it operates on the whole HTML string rather than a specific attribute).
 * @param {string} html
 * @param {string} oldSrc
 * @param {string} newSrc
 * @returns {string} updated html
 */
function replaceImageSrc(html, oldSrc, newSrc) {
  return html.split(oldSrc).join(newSrc);
}

/**
 * Step 7: Upload the rewritten page HTML back to da.live.
 * PUT https://admin.da.live/source/{org}/{repo}/{path}
 * @param {string} path full page path including the /{org}/{repo} prefix and .html extension
 * @param {string} html
 */
async function uploadPage(path, html) {
  const form = new FormData();
  form.append('data', new Blob([html], { type: 'text/html' }), 'page.html');

  const resp = await fetch(`${DA_ADMIN_BASE_URL}/source${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: form,
  });
  if (!resp.ok) {
    throw new Error(`Failed to upload page ${path}: ${resp.status} ${resp.statusText}`);
  }
}

function authHeaders() {
  if (!AUTH_TOKEN) {
    throw new Error('Missing DA_ADMIN_TOKEN environment variable.');
  }
  return { Authorization: `Bearer ${AUTH_TOKEN}` };
}

async function main() {
  const pagePaths =  await getAllPagePaths();
  console.log('pagePaths', pagePaths);

  let processedPages = 0;
  let skippedPages = 0;
  let failedPages = 0;
  const failedPageLinks = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const pagePath of pagePaths) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const html = await fetchPageSource(pagePath);
      const matches = findDmePartnersImageSrcs(html);
      if (matches.length === 0) {
        skippedPages += 1;
        console.log(`Skipped page (no matching images) ${pagePath}`);
        // eslint-disable-next-line no-continue
        continue;
      }

      // Dedupe within this page: reuse the upload for repeated src URLs
      // (e.g. same image in both `src` and a `srcset` entry), and avoid
      // filename collisions between different images.
      const uploadedBySrc = new Map();
      const usedFileNames = new Set();
      // Assets folder is named after the page without its .html extension,
      // e.g. '/org/repo/channelpartners/foo.html' -> '/org/repo/channelpartners/.foo'
      const pageFolderPath = pagePath.replace(/\.html$/, '');
      let updatedHtml = html;

      // eslint-disable-next-line no-restricted-syntax
      for (const { src } of matches) {
        if (uploadedBySrc.has(src)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const fileName = getUniqueFileName(usedFileNames, getFileNameFromUrl(src));
        usedFileNames.add(fileName);

        // eslint-disable-next-line no-await-in-loop
        const { buffer, contentType } = await downloadImage(src);
        // eslint-disable-next-line no-await-in-loop
        const newPath = await uploadImage(pageFolderPath, fileName, buffer, contentType);
        uploadedBySrc.set(src, newPath);
        console.log(`Uploaded ${src} -> ${newPath}`);

        updatedHtml = replaceImageSrc(updatedHtml, src, `${CONTENT_DA_BASE_URL}${newPath}`);
      }

      // Upload the rewritten HTML back to the original page (with .html extension)
      // eslint-disable-next-line no-await-in-loop
      await uploadPage(pagePath, updatedHtml);
      processedPages += 1;
      console.log(`Updated page ${pagePath}`);
    } catch (error) {
      failedPages += 1;
      failedPageLinks.push(`${CONTENT_DA_BASE_URL}${pagePath}`);
      console.error(`Failed to process page ${pagePath}:`, error);
    }
  }

  console.log('Migration summary:', {
    totalPages: pagePaths.length,
    processedPages,
    skippedPages,
    failedPages,
    failedPageLinks,
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

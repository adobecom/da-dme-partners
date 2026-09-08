// Configuration for the importImagesAfterContentMigration script.
// Auth token must be provided via env var (never hardcode it here).

export const ORG = 'adobecom';
export const REPO = 'da-dme-partners';

// Root paths to scan. '/channelpartners' plus every '/{lang}/channelpartners'
// (the '*' segment is resolved at runtime by listing the repo root).
export const ROOT_PATH = '/channelpartners';
export const WILDCARD_SUBPATH = 'channelpartners';

// Old host that image `src`/`srcset` values may still point to after migration.
export const OLD_IMAGE_DOMAIN = 'main--dme-partners--adobecom.aem.live';

// Folder (relative to the page's own folder) where migrated images are stored.
export const DA_ASSETS_FOLDER = '.da';

export const DA_ADMIN_BASE_URL = 'https://admin.da.live';

// Public content delivery domain images are served from once uploaded,
// used when rewriting page HTML to point at the new image location.
export const CONTENT_DA_BASE_URL = 'https://content.da.live';

// Provided at runtime, e.g.: DA_ADMIN_TOKEN=xxx OLD_SITE_AUTH_TOKEN=xxx npm run import-images
export const AUTH_TOKEN = ''; // token from https://da.live/edit#/adobecom/da-dme-partners in console check adobeIMS.getAccessToken().token (need to be logged in with skyline org)

// Token required to fetch images from the old dme-partners domain.
export const OLD_SITE_AUTH_TOKEN = 'token hlxtst_...'; // token from eg: https://main--dme-partners--adobecom.aem.page/channelpartners/drafts/tijana/prp/media_1d11215b21b90c357777d6fc89f63038a2c205fe0.png?width=2000&format=webply&optimize=medium login to sidekick in network tab for that request there is authorization token

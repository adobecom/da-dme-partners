import { applyPagePersonalization } from './personalization.js';
import { prependContent } from './portalMessaging.js';
import {
  setLibs,
  redirectLoggedinPartner,
  updateIMSConfig,
  preloadResources,
  getRenewBanner,
  getSanctionedBanner,
  updateNavigation,
  updateFooter,
  enableGeoPopup,
  PARTNER_LOGIN_QUERY,
  prodHosts,
  previewHosts,
  setFeedback,
  loadPageToAnchor,
} from './utils.js';
import { rewriteLinks } from './rewriteLinks.js';
import { sidekickListener } from '../blocks/utils/utils.js';
// Add project-wide style path here.
const STYLES = '/edsdme/styles/styles.css';

// Use 'https://milo.adobe.com/libs' if you cannot map '/libs' to milo's origin.
const LIBS = '/libs';

const imsClientId = prodHosts.includes(window.location.host) ? 'MILO_PARTNERS_PROD' : 'MILO_PARTNERS_STAGE';

const localesDefault = {
  '': { ietf: 'en-US', tk: 'hah7vzn.css' },
  na: { ietf: 'en', tk: 'hah7vzn.css' },
  emea: { ietf: 'en-GB', tk: 'hah7vzn.css' },
  apac: { ietf: 'en', tk: 'hah7vzn.css' },
  de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
  kr: { ietf: 'ko-KR', tk: 'zfo3ouc' },
  zh: { ietf: 'zh-TW', tk: 'jay0ecd' },
  cn: { ietf: 'zh-CN', tk: 'puu3xkp' },
  it: { ietf: 'it-IT', tk: 'bbf5pok.css' },
  es: { ietf: 'es-ES', tk: 'oln4yqj.css' },
  fr: { ietf: 'fr-FR', tk: 'vrk5vyv.css' },
  uk: { ietf: 'en-GB', tk: 'pps7abe.css' },
  br: { ietf: 'pt-BR', tk: 'inq1xob.css' },
  pt: { ietf: 'pt-PT', tk: 'inq1xob.css' },
  latam: { ietf: 'en', tk: 'oln4yqj.css' },
  jp: { ietf: 'ja-JP', tk: 'dvg6awq' },
};

const localesSafari = {
  ...localesDefault,
  '': { ietf: 'en-US', tk: 'vti0xwb.css' },
  na: { ietf: 'en', tk: 'vti0xwb.css' },
  emea: { ietf: 'en-GB', tk: 'vti0xwb.css' },
  apac: { ietf: 'en', tk: 'vti0xwb.css' },
  de: { ietf: 'de-DE', tk: 'vti0xwb.css' },
  kr: { ietf: 'ko-KR', tk: 'qjs5sfm' },
};

const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');

// Add any config options.
const CONFIG = {
  codeRoot: '/edsdme',
  contentRoot: '/edsdme/partners-shared',
  imsClientId,
  imsScope: 'AdobeID,openid,gnav,pps.read,firefly_api,additional_info.roles,read_organizations,account_cluster.read',
  clientEnv: prodHosts.includes(window.location.host) ? 'prod' : null,
  geoRouting: enableGeoPopup(),
  // fallbackRouting: 'off',
  locales: isSafari ? localesSafari : localesDefault,
  local: { edgeConfigId: '72b074a6-76d2-43de-a210-124acc734f1c' },
  stage: { edgeConfigId: '72b074a6-76d2-43de-a210-124acc734f1c' },
  prod: { edgeConfigId: '913eac4d-900b-45e8-9ee7-306216765cd2' },
};

(function removeAccessToken() {
  window.location.hash = decodeURIComponent(window.location.hash);
  if (window.location.hash.startsWith('#access_token')) {
    window.location.hash = '';
  }
}());

(function removePartnerLoginQuery() {
  const url = new URL(window.location.href);
  const { searchParams } = url;
  if (searchParams.has(PARTNER_LOGIN_QUERY)) {
    searchParams.delete(PARTNER_LOGIN_QUERY);
    window.history.replaceState({}, '', url.toString());
  }
}());

// Load LCP image immediately
(function loadLCPImage() {
  const lcpImg = document.querySelector('img');
  lcpImg?.removeAttribute('loading');
}());

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

const miloLibs = setLibs(LIBS);

(function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

function setUpPage() {
  updateNavigation(CONFIG.locales);
  updateFooter(CONFIG.locales);
}

(async function loadPage() {
  await prependContent();
  applyPagePersonalization();
  setUpPage();
  redirectLoggedinPartner();
  updateIMSConfig();
  await preloadResources(CONFIG.locales, miloLibs);
  const { loadArea, setConfig, getConfig } = await import(`${miloLibs}/utils/utils.js`);

  setConfig({ ...CONFIG, miloLibs });
  await setFeedback(getConfig);
  await getRenewBanner(getConfig);
  await getSanctionedBanner(getConfig);
  await loadArea();
  applyPagePersonalization();
  rewriteLinks(document);
  if (previewHosts.includes(window.location.host)) {
    sidekickListener(CONFIG.locales);
  }

  // Run when navigating back/forward
  window.addEventListener('pageshow', () => {
    loadPageToAnchor();
  });
}());

(async function loadDa() {
  if (!new URL(window.location.href).searchParams.get('dapreview')) return;
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
}());

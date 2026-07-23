/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * The decision engine for where to get Milo's libs from.
 */
export const PARTNER_LOGIN_QUERY = 'partnerLogin';
export const LEVELS = {
  REGISTERED: 'registered',
  CERTIFIED: 'certified',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DISTRIBBUTOR: 'distributor',
};

export const RESSELER_LEVELS = [LEVELS.REGISTERED, LEVELS.CERTIFIED, LEVELS.GOLD, LEVELS.PLATINUM];

const MAX_PARTNER_ERROR_REDIRECTS_COUNT = 3;
const PARTNER_ERROR_REDIRECTS_COUNT_COOKIE = 'partner_redirects_count';

const SANCTIONED_COUNTRIES = ['ru', 'by'];

export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs, location) => {
      libs = (() => {
        const { hostname, search, origin } = location || window.location;
        if (origin.endsWith('adobe.com')) {
          return origin + prodLibs;
        }
        const partnerBranch = hostname.startsWith('main') ? 'main' : 'stage';
        const branch = new URLSearchParams(search).get('milolibs') || partnerBranch;
        if (!/^[a-zA-Z0-9_-]+$/.test(branch)) throw new Error('Invalid branch name.');
        if (branch === 'local') {
          return 'http://localhost:6456/libs';
        }
        return branch.includes('--') ? `https://${branch}.aem.live/libs` : `https://${branch}--milo--adobecom.aem.live/libs`;
      })();
      return libs;
    }, () => libs,
  ];
})();

export const prodHosts = [
  'main--dme-partners--adobecom.hlx.page',
  'main--dme-partners--adobecom.hlx.live',
  'main--dme-partners--adobecom.aem.page',
  'main--dme-partners--adobecom.aem.live',
  'partners.adobe.com',
  'partnerspreview.adobe.com',
];
export const previewHosts = ['partnerspreview.adobe.com', 'stage--dme-partners--adobecom.aem.live'];

/*
 * ------------------------------------------------------------
 * Edit above at your own risk.
 *
 * Note: This file should have no self-invoking functions.
 * ------------------------------------------------------------
 */

export function formatDate(cardDate, locale = 'en-US') {
  if (!cardDate) return;

  const dateObject = new Date(cardDate);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const formattedDate = dateObject.toLocaleString(locale, options);
  // eslint-disable-next-line consistent-return
  return formattedDate;
}

export function getProgramType(path) {
  switch (true) {
    case /solutionpartners/.test(path):
      return 'spp';
    case /technologypartners/.test(path):
      return 'tpp';
    case /channelpartners/.test(path):
      return 'cpp';
    case /channelpartnerassets/.test(path):
      return 'cpp';
    default:
      return '';
  }
}

export function getProgramHomePage(path) {
  switch (true) {
    case /solutionpartners/.test(path):
      return '/solutionpartners/';
    case /technologypartners/.test(path):
      return '/technologypartners/';
    case /channelpartners/.test(path):
      return '/channelpartners/';
    case /channelpartnerassets/.test(path):
      return '/channelpartners/';
    default:
      return '';
  }
}

export function getCurrentProgramType() {
  return getProgramType(window.location.pathname);
}

export function getCookieValue(key) {
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  const cookie = cookies.find((el) => el.startsWith(`${key}=`));
  return cookie?.substring((`${key}=`).length);
}

export function deleteCookieValue(key) {
  document.cookie = `${key}=; Path=/; Max-Age=0;`;
}

export function getPartnerCookieObject(programType) {
  const partnerDataCookie = getCookieValue('partner_data');
  const partnerInfoCookie = getCookieValue('partner_info');

  const partnerDataObj = partnerDataCookie ? JSON.parse(decodeURIComponent(partnerDataCookie)) : {};
  const partnerInfoObj = partnerInfoCookie ? JSON.parse(decodeURIComponent(partnerInfoCookie)) : {};

  const portalData = {
    ...(partnerDataObj?.[programType.toUpperCase()] ?? {}),
    ...partnerInfoObj,
  };
  return portalData;
}

export function getPartnerCookieValue(programType, key) {
  try {
    const portalData = getPartnerCookieObject(programType);
    const lowercasedPortalData = JSON.parse(
      JSON.stringify(portalData).toLowerCase(),
    );
    return lowercasedPortalData?.[key] || '';
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing partner data object:', error);
    // eslint-disable-next-line consistent-return
    return '';
  }
}

export function isMember() {
  const { status } = getPartnerCookieObject(getCurrentProgramType());
  return status === 'MEMBER';
}

export function partnerIsSignedIn() {
  return getCookieValue('partner_data');
}

export function signedInNonMember() {
  return partnerIsSignedIn() && !isMember();
}

export function isReseller(level) {
  return RESSELER_LEVELS.includes(level?.toLowerCase());
}

export function hasSalesCenterAccess() {
  const { salesCenterAccess } = getPartnerCookieObject(getCurrentProgramType());
  return !!salesCenterAccess;
}

export function getMetadataContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content;
}

export function getMetadata(name) {
  return document.querySelector(`meta[name="${name}"]`);
}

export function redirectLoggedinPartner(win = window) {
  if (!isMember()) return;
  const partnerErrorRedirectsCount = getCookieValue(PARTNER_ERROR_REDIRECTS_COUNT_COOKIE);
  if (partnerErrorRedirectsCount) {
    const count = Number(partnerErrorRedirectsCount);
    if (count && Number.isInteger(count) && count >= MAX_PARTNER_ERROR_REDIRECTS_COUNT) {
      deleteCookieValue(PARTNER_ERROR_REDIRECTS_COUNT_COOKIE);
      return;
    }
  }
  const target = getMetadataContent('adobe-target-after-login');
  if (!target || target === 'NONE') return;
  document.body.style.display = 'none';
  win.location.assign(target);
}

export function isRenew() {
  const programType = getCurrentProgramType();

  const countryCode = getPartnerCookieValue(programType, 'countrycode');
  if (SANCTIONED_COUNTRIES.includes(countryCode)) return;

  const primaryContact = getPartnerCookieValue(programType, 'primarycontact');
  if (!primaryContact) return;

  const partnerLevel = getPartnerCookieValue(programType, 'level');
  if (partnerLevel !== 'gold' && partnerLevel !== 'registered' && partnerLevel !== 'certified') return;

  const accountExpiration = getPartnerCookieValue(programType, 'accountanniversary');
  if (!accountExpiration) return;

  const expirationDate = new Date(accountExpiration);
  expirationDate.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let accountStatus;
  let daysNum;

  const differenceInMilliseconds = expirationDate - now;
  const differenceInDays = Math.abs(differenceInMilliseconds) / (1000 * 60 * 60 * 24);

  if (differenceInMilliseconds > 0 && differenceInDays < 31) {
    accountStatus = 'expired';
    daysNum = differenceInDays - 1;
  } else if (differenceInMilliseconds < 0 && differenceInDays <= 90) {
    accountStatus = 'suspended';
    daysNum = Math.floor(90 - differenceInDays);
  } else {
    return;
  }
  // eslint-disable-next-line consistent-return
  return { accountStatus, daysNum };
}

export async function getRenewBanner(getConfig) {
  const programType = getCurrentProgramType();

  const countryCode = getPartnerCookieValue(programType, 'countrycode');
  if (SANCTIONED_COUNTRIES.includes(countryCode)) return;

  const renew = isRenew();
  if (!renew) return;
  const { accountStatus, daysNum } = renew;
  const bannerFragments = {
    expired: 'banner-account-expires',
    suspended: 'banner-account-suspended',
  };
  const metadataKey = bannerFragments[accountStatus];

  const config = getConfig();
  const { prefix } = config.locale;
  const defaultPath = `${prefix}/edsdme/partners-shared/fragments/${metadataKey}`;
  const path = getMetadataContent(metadataKey) ?? defaultPath;
  const url = new URL(path, window.location.origin);

  try {
    const response = await fetch(`${url}.plain.html`);
    if (!response.ok) throw new Error(`Network response was not ok ${response.statusText}`);

    const data = await response.text();
    const componentData = data.replace('$daysNum', daysNum);
    const parser = new DOMParser();
    const doc = parser.parseFromString(componentData, 'text/html');
    const block = doc.querySelector('.notification');

    const div = document.createElement('div');
    div.appendChild(block);

    const main = document.querySelector('main');
    if (main) main.insertBefore(div, main.firstChild);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There has been a problem with your fetch operation:', error);
    // eslint-disable-next-line consistent-return
    return null;
  }
}

export async function getSanctionedBanner(getConfig) {
  const programType = getCurrentProgramType();

  const countryCode = getPartnerCookieValue(programType, 'countrycode');
  if (!SANCTIONED_COUNTRIES.includes(countryCode)) return;

  const metadataKey = 'banner-account-sanctioned';

  const config = getConfig();
  const { prefix } = config.locale;
  const defaultPath = `${prefix}/edsdme/partners-shared/fragments/${metadataKey}`;
  const path = getMetadataContent(metadataKey) ?? defaultPath;
  const url = new URL(path, window.location.origin);

  try {
    const response = await fetch(`${url}.plain.html`);
    if (!response.ok) throw new Error(`Network response was not ok ${response.statusText}`);

    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const block = doc.querySelector('.notification');

    const div = document.createElement('div');
    div.appendChild(block);

    const main = document.querySelector('main');
    if (main) main.insertBefore(div, main.firstChild);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There has been a problem with your fetch operation:', error);
    // eslint-disable-next-line consistent-return
    return null;
  }
}

export function updateIMSConfig() {
  const isSignedIn = partnerIsSignedIn();
  const imsReady = setInterval(() => {
    if (!window.adobeIMS) return;
    if (isSignedIn && !window.adobeIMS.isSignedInUser()) return;
    clearInterval(imsReady);
    let target;
    const partnerLogin = !window.adobeIMS.isSignedInUser();
    if (partnerLogin) {
      target = getMetadataContent('adobe-target-after-login');
    } else {
      target = getMetadataContent('adobe-target-after-logout') ?? getProgramHomePage(window.location.pathname);
    }

    const targetUrl = new URL(window.location.href);
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    partnerLogin && targetUrl.searchParams.set(PARTNER_LOGIN_QUERY, true);
    if (target && target !== 'NONE') {
      targetUrl.pathname = target;

      if (!partnerLogin) {
        targetUrl.search = '';
      }
    }

    window.adobeIMS.adobeIdData.redirect_uri = targetUrl.toString();
  }, 500);
}

export function getLocale(locales, pathname = window.location.pathname) {
  if (!locales) {
    return { ietf: 'en-US', tk: 'hah7vzn.css', prefix: '' };
  }
  const LANGSTORE = 'langstore';
  const split = pathname.split('/');
  const localeString = split[1];
  const locale = locales[localeString] || locales[''];
  if (localeString === LANGSTORE) {
    locale.prefix = `/${localeString}/${split[2]}`;
    if (
      Object.values(locales)
        .find((loc) => loc.ietf?.startsWith(split[2]))?.dir === 'rtl'
    ) locale.dir = 'rtl';
    return locale;
  }
  const isUS = locale.ietf === 'en-US';
  locale.prefix = isUS ? '' : `/${localeString}`;
  locale.region = isUS ? 'us' : localeString.split('_')[0];
  return locale;
}

function preload(url) {
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'fetch';
  preloadLink.crossOrigin = true;
  preloadLink.href = url;
  document.head.appendChild(preloadLink);
}

function preloadPlaceholders(locale) {
  const placeholderUrl = `${locale.prefix}/edsdme/partners-shared/placeholders.json`;
  preload(placeholderUrl);
}

function preloadLit(miloLibs) {
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'modulepreload';
  preloadLink.crossOrigin = true;
  preloadLink.href = `${miloLibs}/deps/lit-all.min.js`;
  document.head.appendChild(preloadLink);
}

export function getPermissionSpecializations() {
  const permissionSpecializations = getPartnerCookieValue(getCurrentProgramType(), 'permissionspecializations');
  if (!permissionSpecializations) return [];
  return permissionSpecializations
    .split(',')
    .map((spec) => spec.trim().replace(/\s+/g, '-').toLowerCase())
    .filter(Boolean);
}

function getPartnerLevelParams(portal) {
  const partnerLevel = getPartnerCookieValue(portal, 'level');
  const partnerTagBase = `"caas:adobe-partners/${portal}/partner-level/`;
  return partnerLevel ? `(${partnerTagBase}${partnerLevel}"+OR+${partnerTagBase}public")` : `(${partnerTagBase}public")`;
}

function extractTableCollectionTags(el) {
  let tableCollectionTags = [];
  Array.from(el.children).forEach((row) => {
    const cols = Array.from(row.children);
    const rowTitle = cols[0].textContent.trim().toLowerCase().replace(/ /g, '-');
    const colsContent = cols.slice(1);
    if (rowTitle === 'collection-tags') {
      const [collectionTagsEl] = colsContent;
      const collectionTags = Array.from(collectionTagsEl.querySelectorAll('li'), (li) => `"${li.textContent.trim().toLowerCase()}"`);
      tableCollectionTags = [...tableCollectionTags, ...collectionTags];
    }
  });

  return tableCollectionTags;
}

function checkForQaContent(el) {
  if (!el.children) return false;

  // Iterating backward because we expect 'qa-content' to be in the last rows.
  // eslint-disable-next-line no-plusplus
  for (let i = el.children.length - 1; i >= 0; i--) {
    const row = el.children[i];

    const rowTitle = row.children[0]?.innerText?.trim().toLowerCase().replace(/ /g, '-');
    if (rowTitle?.includes('qa-content')) {
      return true;
    }
  }

  return false;
}

function getComplexQueryParams(el, collectionTag) {
  const portal = getCurrentProgramType();
  if (!portal) return;

  const portalCollectionTag = `"caas:adobe-partners/${portal}"`;
  const tableTags = extractTableCollectionTags(el);
  const collectionTags = [collectionTag, portalCollectionTag, ...tableTags];

  const partnerLevelParams = getPartnerLevelParams(portal);

  const collectionTagsStr = collectionTags.filter((e) => e.length).join('+AND+');
  let resulStr = `(${collectionTagsStr})`;

  const qaContentTag = '"caas:adobe-partners/qa-content"';
  if (!checkForQaContent(el)) {
    resulStr += `+NOT+${qaContentTag}`;
  }

  if (partnerLevelParams) resulStr += `+AND+${partnerLevelParams}`;
  // eslint-disable-next-line consistent-return
  return resulStr;
}

function setApiParams(api, block, includeLanguage = true) {
  const { el, collectionTag, ietf } = block;
  const complexQueryParams = getComplexQueryParams(el, collectionTag);
  if (complexQueryParams) api.searchParams.set('complexQuery', complexQueryParams);
  if (includeLanguage) {
    const langCode = ietf === 'en-GB' ? 'en-US' : ietf;
    const [language, country] = langCode.split('-');
    if (language && country) {
      api.searchParams.set('language', language);
      api.searchParams.set('country', country);
    }
  }
  return api.toString();
}

export function getCaasUrl(block) {
  let domain = 'https://www.adobe.com/chimera-api';
  const isProd = prodHosts.includes(window.location.host);

  const isPrpCollection = block.collectionTag.includes('caas:adobe-partners/collections/prp-collection');
  const isMarketingResources = block.collectionTag.includes('caas:adobe-partners/collections/marketing-resources');
  if ((isPrpCollection || isMarketingResources) && !isProd) {
    domain = 'https://14257-chimera-stage.adobeioruntime.net/api/v1/web/chimera-0.0.1';
  }

  const api = new URL(`${domain}/collection?originSelection=dme-partners&draft=false&debug=true&flatFile=false&expanded=true`);
  return setApiParams(api, block, !isPrpCollection);
}

export async function preloadResources(locales, miloLibs) {
  const locale = getLocale(locales);
  const cardBlocks = {
    announcements: '"caas:adobe-partners/collections/announcements"',
    'announcements-preview': '"caas:adobe-partners/collections/announcements"',
    'prp-collection': '"caas:adobe-partners/collections/prp-collection"',
    'marketing-resources': '"caas:adobe-partners/collections/marketing-resources"',
  };
  const blockWithPlaceholders = ['announcements', 'search-full', 'logos', 'pricelist', 'prp-collection', 'marketing-resources'];
  let isPreloadCalled = false;
  blockWithPlaceholders.forEach(async (item) => {
    const el = document.querySelector(`.${item}`);
    if (!el) return;
    if (!isPreloadCalled) {
      preloadPlaceholders(locale);
      isPreloadCalled = true;
    }
  });
  Object.entries(cardBlocks).forEach(async ([key, value]) => {
    const el = document.querySelector(`.${key}`);
    if (!el) return;

    if (key !== 'announcements-preview') {
      preloadLit(miloLibs);
    }

    const block = {
      el,
      collectionTag: value,
      ietf: locale.ietf,
    };
    const caasUrl = getCaasUrl(block);
    preload(caasUrl);
  });
}

export function updateNavigation(locales) {
  const gnavMeta = getMetadata('gnav-source');
  if (!gnavMeta) return;
  const { prefix } = getLocale(locales);
  let { content } = gnavMeta;
  if (isMember()) {
    content = getMetadataContent('gnav-loggedin-source') ?? `${prefix}/edsdme/partners-shared/loggedin-gnav`;
  }
  gnavMeta.content = content.startsWith('/edsdme') ? prefix + content : content;
}

export function updateFooter(locales) {
  const footerMeta = getMetadata('footer-source');
  if (!footerMeta) return;
  const { prefix } = getLocale(locales);
  let { content } = footerMeta;
  if (isMember()) {
    content = getMetadataContent('footer-loggedin-source') ?? `${prefix}/edsdme/partners-shared/loggedin-footer`;
  }
  footerMeta.content = content.startsWith('/edsdme') ? prefix + content : content;
}

export function getNodesByXPath(query, context = document) {
  const nodes = [];
  const xpathResult = document.evaluate(query, context, null, XPathResult.ANY_TYPE);
  let current = xpathResult?.iterateNext();
  while (current) {
    nodes.push(current);
    current = xpathResult.iterateNext();
  }
  return nodes;
}

export function enableGeoPopup(win = window) {
  const { hostname, search } = win.location;
  const enableWithParam = new URLSearchParams(search).get('georouting') === 'on';
  if (hostname === 'partnerspreview.adobe.com') {
    return 'off';
  }
  if ((hostname.endsWith('.adobe.com') && !partnerIsSignedIn()) || enableWithParam) {
    return 'on';
  }
  return 'off';
}

export async function setFeedback(getConfig) {
  const feedback = getMetadataContent('feedback');
  if (!feedback || feedback === 'false') return;
  const config = getConfig();

  const { prefix } = config.locale;
  const fragmentPath = `${prefix}/edsdme/partners-shared/fragments/feedback`;
  const url = new URL(fragmentPath, window.location.origin);

  try {
    const response = await fetch(`${url}.plain.html`);
    if (!response.ok) throw new Error(`Response was not ok ${response.statusText}`);

    const data = await response.text();
    const parser = new DOMParser();
    const page = parser.parseFromString(data, 'text/html');
    const main = document.querySelector('main');
    const block = page.querySelector('.feedback');
    const div = document.createElement('div');
    div.appendChild(block);
    if (main) main.insertBefore(div, main.firstChild);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching plain html of feedback fragment:', error);
    // eslint-disable-next-line consistent-return
    return null;
  }
}

export function loadPageToAnchor() {
  const urlHash = window.location.hash;

  if (urlHash) {
    const anchorElement = document.querySelector(urlHash);

    if (anchorElement) {
      window.scrollTo({ top: anchorElement.offsetTop, behavior: 'smooth' });
    }
  }
}

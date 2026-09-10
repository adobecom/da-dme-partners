import {
  getMetadataContent,
  getCurrentProgramType,
  getPartnerCookieValue,
  SANCTIONED_COUNTRIES,
  isRenew,
  getLocale,
} from './utils.js';

async function loadPopupFragment(fragmentPath) {
  const response = await fetch(fragmentPath);
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(`Fetching fragment failed, status ${response.status}`);
    return null;
  }
  const text = await response.text();
  const { body } = new DOMParser().parseFromString(text, 'text/html');
  if (!body) return null;

  const main = body.querySelector('main');
  return main.firstElementChild;
}

async function loadBannerContent(bannerType, defaultPath) {
  const bannerFragmentPath = getMetadataContent(bannerType) ?? defaultPath;
  if (!bannerFragmentPath) {
    // eslint-disable-next-line no-console
    console.warn(`${bannerType} should be displayed but banner fragment path is not found`);
    return;
  }

  if (bannerType === 'global-banner' && bannerFragmentPath.trim().toUpperCase() === 'NONE') {
    return;
  }

  if (!bannerFragmentPath.startsWith('/')) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid ${bannerType} path: ${bannerFragmentPath}`);
    return;
  }

  const bannerContent = await loadPopupFragment(bannerFragmentPath);
  if (!bannerContent) {
    // eslint-disable-next-line no-console
    console.warn(`Banner fragment for ${bannerFragmentPath} not found`);
    return;
  }
  // eslint-disable-next-line consistent-return
  return bannerContent;
}

export async function getGlobalBanner() {
  return loadBannerContent('global-banner');
}

export async function getSanctionedBanner(locales) {
  const programType = getCurrentProgramType();

  const countryCode = getPartnerCookieValue(programType, 'countrycode');
  if (!SANCTIONED_COUNTRIES.includes(countryCode)) return null;

  const metadataKey = 'banner-account-sanctioned';
  const { prefix } = getLocale(locales);
  const defaultPath = `${prefix}/edsdme/partners-shared/fragments/${metadataKey}`;

  const bannerContent = await loadBannerContent(metadataKey, defaultPath);
  if (!bannerContent) {
    return null;
  }

  return bannerContent;
}

export async function getRenewBanner(locales) {
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

  const { prefix } = getLocale(locales);
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
    // eslint-disable-next-line consistent-return
    return div;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('There has been a problem with your fetch operation:', error);
    // eslint-disable-next-line consistent-return
    return null;
  }
}

export async function prependContent(locales) {
  const documentMain = document.querySelector('main');
  if (!documentMain) return;

  const [globalBannerContent, sanctionedBannerContent, renewBannerContent] = await Promise.all([
    getGlobalBanner(),
    getSanctionedBanner(locales),
    getRenewBanner(locales),
  ]);

  if (globalBannerContent) documentMain.prepend(globalBannerContent);
  if (sanctionedBannerContent) documentMain.prepend(sanctionedBannerContent);
  if (renewBannerContent) documentMain.prepend(renewBannerContent);
}

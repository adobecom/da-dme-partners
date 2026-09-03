import { getMetadataContent } from './utils.js';

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

async function loadBannerContent(bannerType) {
  const bannerFragmentPath = getMetadataContent(bannerType);
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

export async function prependContent() {
  const documentMain = document.querySelector('main');
  if (!documentMain) return;

  const [globalBannerContent] = await Promise.all([
    getGlobalBanner(),
  ]);

  if (globalBannerContent) documentMain.prepend(globalBannerContent);
}

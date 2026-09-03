import { partnerIsSignedIn, prodHosts } from './utils.js';
import { getConfig } from '../blocks/utils/utils.js';

/**
 * Default rewriters for handling URL locale modifications.
 */
const defaultLocaleRewriters = {
  /**
   * Rewrites the URL to include the locale in the path prefix.
   *
   * @param {URL} url - The URL object to modify.
   * @param {string} locale - The locale to add to the path as prefix.
   * @param {Object} domainConfig - The domain configuration object.
   * @param {string} [domainConfig.expectedLocale] - The locale expected in the current path.
   */
  pathPrefix: (url, locale, domainConfig) => {
    if (!url || !locale) return;
    let { pathname } = url;
    if (domainConfig?.expectedLocale) {
      if (!url.pathname.startsWith(domainConfig.expectedLocale)) {
        return;
      }
      pathname = url.pathname.replace(domainConfig.expectedLocale, '');
    }
    url.pathname = locale + pathname;
  },

  /**
   * Rewrites the URL to include the locale as a query parameter.
   *
   * @param {URL} url - The URL object to modify.
   * @param {string} locale - The locale to add as a query parameter.
   * @param {Object} domainConfig - The domain configuration object.
   * @param {string} [domainConfig.queryParamKey] - The query parameter key to use for the locale.
   */
  queryParam: (url, locale, domainConfig) => {
    if (!url || !locale || !domainConfig?.queryParamKey) return;
    const params = new URLSearchParams(url.search);
    params.set(domainConfig.queryParamKey, locale);
    url.search = `?${params.toString()}`;
  },
};

const acomDomainConfig = {
  localeMap: {
    emea: 'uk',
    fr: 'fr',
    de: 'de',
    it: 'it',
    es: 'es',
    kr: 'kr',
    cn: 'cn',
    jp: 'jp',
  },
  localeRewriter: defaultLocaleRewriters.pathPrefix,
};

/**
 * Domain configs where the key is the production domain,
 * and the value is config object for it.
 */
const domainConfigs = {
  'cbconnection.adobe.com': {
    stage: { domain: 'cbconnection-stage.adobe.com' },
    localeMap: {
      de: '/de/',
      cn: '/zh_cn/',
      fr: '/fr/',
      it: '/it/',
      jp: '/jp/',
      kr: '/ko/',
      es: '/es/',
    },
    expectedLocale: '/en/',
    localeRewriter: defaultLocaleRewriters.pathPrefix,
    loginPath: '/bin/fusion/modalImsLogin',
  },
  'partners.adobe.com': { stage: { domain: 'partners.stage.adobe.com' } },
  'adobe.force.com': {
    stage: {
      domain: 'channelpartners.stage2.adobe.com',
      pathMappings: { '/app/services/auth/sso/apc': '/s/salescenter/dashboard' },
    },
  },
  'channelpartners.adobe.com': { stage: { domain: 'channelpartners.stage2.adobe.com' } },
  'www.adobe.com': acomDomainConfig,
  'adobe.com': acomDomainConfig,
  'helpx.adobe.com': acomDomainConfig,
  'business.adobe.com': acomDomainConfig,
  'adobe.my.salesforce-sites.com': {
    stage: {
      domain: 'partners.stage.adobe.com',
      pathMappings: { '/PartnerSearch': '/s/directory/channel' },
      localeMap: {
        apac: 'en',
        cn: 'cn',
        de: 'de',
        emea: 'en',
        es: 'es',
        fr: 'fr',
        it: 'it',
        jp: 'jp',
        kr: 'kr',
        latam: 'en',
        na: 'en',
      },
      localeRewriter: defaultLocaleRewriters.queryParam,
      queryParamKey: 'lang',
    },
    localeMap: {
      apac: 'en',
      cn: 'zh_CN',
      de: 'de',
      emea: 'en',
      es: 'es',
      fr: 'fr',
      it: 'it',
      jp: 'ja',
      kr: 'ko',
      latam: 'en',
      na: 'en',
    },
    localeRewriter: defaultLocaleRewriters.queryParam,
    queryParamKey: 'lang',
  },
};

if (!prodHosts.includes(window.location.host)) {
  Object.keys(domainConfigs).forEach((key) => {
    if (domainConfigs[key].stage) {
      domainConfigs[key] = {
        ...domainConfigs[key],
        ...domainConfigs[key].stage,
      };
    }
  });
}

/**
 * Modifies the given URL object by updating its search params
 * (aimed to handle cbcconnection links and attach login path to them)
 * @param {URL} url - The URL object to be modified.
 */
// eslint-disable-next-line consistent-return
function setLoginPathIfSignedIn(url) {
  const loginPath = domainConfigs[url.hostname]?.loginPath;
  if (loginPath) {
    const isUserSignedIn = partnerIsSignedIn();
    if (isUserSignedIn && !url.pathname.includes(loginPath)) {
      const resource = url.pathname;
      url.searchParams.append('resource', resource);
      url.pathname = loginPath;
    }
  }
}

/**
 * Modifies the given URL object with the correct locale,
 * based on the current page locale and locale maps that are defined for specific domains.
 * A locale rewritter must be defined in the domain configuration.
 *
 * for cbcconnection it is expected that url already includes /en in path,
 * so it will be updated to correct locale
 * for other domains it is not expected to have locale in path,
 * so correct locale will be appended to  url.pathname
 * @param {URL} url - The URL object to be modified.
 */
function setLocale(url) {
  if (window.location.pathname === '/' || window.location.pathname === '') return;
  const currentPageLocale = window.location.pathname.split('/')?.[1];
  const domainConfig = domainConfigs[url.hostname];
  if (!domainConfig?.localeMap) return;
  const localeFromMap = domainConfig.localeMap[currentPageLocale];
  if (!localeFromMap) return;
  const { localeRewriter } = domainConfig;
  if (localeRewriter && typeof localeRewriter === 'function') {
    localeRewriter(url, localeFromMap, domainConfig);
  }
}

// if there are new query params, remove old ones
function applyQueryParamOverrides(url) {
  if (!domainConfigs[url.hostname]?.queryParam) return;
  url.search = '';
  Object.entries(domainConfigs[url.hostname].queryParam).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
}

/**
 * Rewrite a link href domain based on production to stage domain mappings.
 * As well as the pathname if pathname mappings are defined and there's a match.
 * @param {URL} url - The URL object to be modified.
 * Modifies URL href, or the original if the environment is prod
 */
export function rewriteUrlOnNonProd(url) {
  const { env, codeRoot } = getConfig();
  const codeRootUrl = new URL(codeRoot);

  if (env.name === 'prod' || prodHosts.includes(codeRootUrl.host)) return;

  const stagePathMappings = domainConfigs[url.hostname]?.pathMappings;

  if (stagePathMappings && Object.keys(stagePathMappings).length) {
    Object.entries(stagePathMappings).forEach(([key, value]) => {
      if (url.pathname === key) {
        url.pathname = value;
      }
    });
  }

  const stageDomain = domainConfigs[url.hostname]?.domain;

  if (stageDomain) {
    url.hostname = stageDomain;
  }
}

/**
 * Takes string that represent url href,
 * updates locale, login path and domain
 * @param href
 * @returns {*|string} modified href
 */
export function getUpdatedHref(href) {
  let url;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  applyQueryParamOverrides(url);
  setLocale(url);
  setLoginPathIfSignedIn(url);
  // always as last step since we need original domains for mappings
  rewriteUrlOnNonProd(url);
  return url.toString();
}

/**
 * Iterates through all links on the page and updates their hrefs if conditions are fulfilled
 * (conditions: appropriate domain, appropriate current page locale,
 * environment and is user logged in)
 */
export function rewriteLinks(element) {
  const links = element.querySelectorAll('a[href]');
  links.forEach((link) => {
    link.href = getUpdatedHref(link.href);
  });
  return element;
}

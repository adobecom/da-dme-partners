/**
 * @jest-environment jsdom
 */
import { getUpdatedHref, rewriteLinks } from '../../edsdme/scripts/rewriteLinks.js';
import { getConfig } from '../../edsdme/blocks/utils/utils.js';
import { partnerIsSignedIn } from '../../edsdme/scripts/utils.js';

jest.mock('../../edsdme/blocks/utils/utils.js', () => ({ getConfig: jest.fn() }));
jest.mock('../../edsdme/scripts/utils.js', () => ({
  partnerIsSignedIn: jest.fn(() => ({ 'partner name': { company: 'test' } })),
  prodHosts: [
    'main--dme-partners--adobecom.hlx.page',
    'main--dme-partners--adobecom.hlx.live',
    'main--dme-partners--adobecom.aem.page',
    'main--dme-partners--adobecom.aem.live',
    'partners.adobe.com',
  ],
}));

// Mock DOM
document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/home/search">cbc prod Link</a>
  <a href="https://partners.adobe.com">Partner prod Link</a>
  <a href="https://cbconnection.adobe.com/bin/fusion/modalImsLogin?resource=/home/search">cbc  Login Link</a>
  <a href = 'https://cbconnection.adobe.com/en/news/enablement-news-partner-lock/'></a>
`;

describe('Test rewrite links', () => {
  beforeEach(() => {
    getConfig.mockReturnValue({ env: { name: 'stage' }, codeRoot: 'https://stage--dme-partners--adobecom.aem.page/edsdme' });
    partnerIsSignedIn.mockReturnValue({ 'partner name': { company: 'test' } });
    window.history.pushState({}, '', '/cn/test-path');
  });
  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
    document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/home/search">cbc prod Link</a>
  <a href="https://partners.adobe.com">Partner prod Link</a>
  <a href="https://cbconnection.adobe.com/bin/fusion/modalImsLogin?resource=/home/search">cbc  Login Link</a>
  <a href = 'https://cbconnection.adobe.com/en/news/enablement-news-partner-lock'></a>
`;
  });

  test('should update  prod links to cbc  stage in non-prod, with resource query param and login path,'
    + 'it should update locale if exist for cbc connection', () => {
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/bin/fusion/modalImsLogin?resource=%2Fhome%2Fsearch');
    expect(links[3].href).toBe('https://cbconnection-stage.adobe.com/bin/fusion/modalImsLogin?resource=%2Fzh_cn%2Fnews%2Fenablement-news-partner-lock%2F');
  });

  test('should update only domain when login path is already there', () => {
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[2].href).toBe('https://cbconnection-stage.adobe.com/bin/fusion/modalImsLogin?resource=/home/search');
  });

  test('should  update partners prod link when on non prod', () => {
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[1].href).toBe('https://partners.stage.adobe.com/');
  });

  test('should  not update partners prod domain and cbc prod domain when on  prod.'
    + ' Should update locale if exist for cbcconnection', () => {
    getConfig.mockReturnValue({ env: { name: 'prod' }, codeRoot: 'https://stage--dme-partners--adobecom.aem.page/edsdme' });
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[1].href).toBe('https://partners.adobe.com/');
    expect(links[3].href).toBe('https://cbconnection.adobe.com/bin/fusion/modalImsLogin?resource=%2Fzh_cn%2Fnews%2Fenablement-news-partner-lock');
  });
  test('should update partners prod domain and cbc prod domain but not login path when not logged in when on stage,'
    + 'it should update locale, if exist, for cbconnection', () => {
    partnerIsSignedIn.mockReturnValue(null);

    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/home/search');
    expect(links[1].href).toBe('https://partners.stage.adobe.com/');
    expect(links[3].href).toBe('https://cbconnection-stage.adobe.com/zh_cn/news/enablement-news-partner-lock');
  });

  test('should update locales only for domains that are in the map', () => {
    partnerIsSignedIn.mockReturnValue(null);
    document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/en/home/search/">cbc prod Link</a>
  <a href="https://partners.adobe.com/">Partner prod Link</a>
  <a href="https://www.adobe.com/">adobe</a>
  <a href="https://helpx.adobe.com/">helpx</a>
  <a href="https://business.adobe.com/">business</a>
  <a href="https://business.adobe.com/">not in list of locales</a>
  <a href="https://business.adobe.com/home/">not in list of locales</a>
  <a href="https://adobe.com/">adobe</a>


`;
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/zh_cn/home/search/');
    expect(links[1].href).toBe('https://partners.stage.adobe.com/');
    expect(links[2].href).toBe('https://www.adobe.com/cn/');
    expect(links[3].href).toBe('https://helpx.adobe.com/cn/');
    expect(links[4].href).toBe('https://business.adobe.com/cn/');
    expect(links[5].href).toBe('https://business.adobe.com/cn/');
    expect(links[6].href).toBe('https://business.adobe.com/cn/home/');
    expect(links[7].href).toBe('https://adobe.com/cn/');
  });
  test('should not update cbc link locale when locale mapping dont exist for current locale ', () => {
    document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/en/home/search/">cbc prod Link</a>
  <a href="https://business.adobe.com/">cbc prod Link</a>
`;
    window.history.pushState({}, '', '/pr/test-path');
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/en/home/search/');
    expect(links[1].href).toBe('https://business.adobe.com/');
  });
  test('should not update  link locale when current locale is na or international sites ', () => {
    document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/en/home/search/">cbc prod Link</a>
  <a href="https://business.adobe.com/emea">cbc prod Link</a>
`;
    window.history.pushState({}, '', '/latam/test-path');
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/en/home/search/');
    expect(links[1].href).toBe('https://business.adobe.com/emea');
  });

  test('should not update cbc link locale when it have different locale than en ', () => {
    document.body.innerHTML = `
  <a href="https://cbconnection.adobe.com/fr/home/search/">cbc prod Link</a>
`;
    window.history.pushState({}, '', '/emea/test-path');
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://cbconnection-stage.adobe.com/fr/home/search/');
  });
  test('should  update adobe,helpx and business.adobe link locale when current page locale is emea, and for cbc '
    + 'it shouldnt be transformed ', () => {
    document.body.innerHTML = `
  <a href="https://business.adobe.com">cbc prod Link</a>
  <a href="https://helpx.adobe.com">cbc prod Link</a>
  <a href="https://www.adobe.com">cbc prod Link</a>
  <a href="https://cbconnection.adobe.com/en/home/search">cbc prod Link</a>
`;
    window.history.pushState({}, '', '/emea/test-path');
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://business.adobe.com/uk/');
    expect(links[1].href).toBe('https://helpx.adobe.com/uk/');
    expect(links[2].href).toBe('https://www.adobe.com/uk/');
    expect(links[3].href).toBe('https://cbconnection-stage.adobe.com/en/home/search');
  });

  test('should  update channel partner domain on stage, no metter if user is signed in', () => {
    document.body.innerHTML = `
  <a href="https://channelpartners.adobe.com/s/registration/">update</a>
  <a href="https://channelpartners.adobe.com/s/uplevel/">update</a>
  <a href="https://channelpartners.adobe.com/s/contactreg/">updatek</a>
  <a href="https://channelpartners.adobe.com/s/manageprofile/?appid=mp">update/a>
  <a href="https://channelpartners.adobe.com/s/manageprofile/?appid=donotupdate">shoudln't update</a>
  <a href="https://channelpartners.adobe.com/s/">shouldn't update</a>
`;
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://channelpartners.stage2.adobe.com/s/registration/');
    expect(links[1].href).toBe('https://channelpartners.stage2.adobe.com/s/uplevel/');
    expect(links[2].href).toBe('https://channelpartners.stage2.adobe.com/s/contactreg/');
    expect(links[3].href).toBe('https://channelpartners.stage2.adobe.com/s/manageprofile/?appid=mp');
    expect(links[4].href).toBe('https://channelpartners.stage2.adobe.com/s/manageprofile/?appid=donotupdate');
    expect(links[5].href).toBe('https://channelpartners.stage2.adobe.com/s/');
  });
  test('should  not update locale for other adobe domains that are not adobe,helpx and business.adobe link locale  '
    + 'it shouldnt be transformed ', () => {
    document.body.innerHTML = `
  <a href="https://partners.adobe.com/"> prod Link</a>
`;
    window.history.pushState({}, '', '/emea/test-path');
    partnerIsSignedIn.mockReturnValue(null);
    rewriteLinks(document);
    const links = document.querySelectorAll('a');
    expect(links[0].href).toBe('https://partners.stage.adobe.com/');
  });
  test('should return link href unchanged in production environment', () => {
    getConfig.mockReturnValue({ env: { name: 'prod' }, codeRoot: 'https://main--dme-partners--adobecom.aem.page/edsdme' });

    const href = 'https://adobe.force.com/path';
    const result = getUpdatedHref(href);

    expect(result).toBe(href);
  });

  test('should rewrite sales for link hrefs', () => {
    const href = 'https://adobe.force.com/path';
    const result = getUpdatedHref(href);

    expect(result).toBe('https://channelpartners.stage2.adobe.com/path');
  });

  test('should return unchanged link hrefs if invalid', () => {
    const href = 'invalid-url';
    const result = getUpdatedHref(href);

    expect(result).toBe(href);
  });

  test('should return unchanged link hrefs if domain is not mapped', () => {
    const href = 'https://unmapped-domain.com/path';
    const result = getUpdatedHref(href);

    expect(result).toBe(href);
  });

  function createGnav() {
    const gnav = document.createElement('div');
    const gnavHTML = `
        <a href="https://adobe.force.com/app/services/auth/sso/apc"></a>
        <a href="https://channelpartners.adobe.com/path"></a>
        <a href="https://unmapped-domain.com/path"></a>
      `;
    gnav.innerHTML = gnavHTML;

    return { gnav, gnavHTML };
  }

  test('should not rewrite links in the production environment', () => {
    window.history.pushState({}, '', '/');

    jest.resetModules();

    jest.unmock('../../edsdme/scripts/utils.js');
    jest.doMock('../../edsdme/scripts/utils.js', () => ({
      partnerIsSignedIn: jest.fn(() => ({ 'partner name': { company: 'test' } })),
      prodHosts: [
        'main--dme-partners--adobecom.hlx.page',
        'main--dme-partners--adobecom.hlx.live',
        'main--dme-partners--adobecom.aem.page',
        'main--dme-partners--adobecom.aem.live',
        'partners.adobe.com',
        window.location.host,
      ],
    }));

    // eslint-disable-next-line no-shadow,global-require
    const { rewriteLinks } = require('../../edsdme/scripts/rewriteLinks.js');
    // eslint-disable-next-line no-shadow,global-require
    const { getConfig } = require('../../edsdme/blocks/utils/utils.js');

    getConfig.mockReturnValue({ env: { name: 'prod' }, codeRoot: 'https://stage--dme-partners--adobecom.aem.page/edsdme' });

    const { gnav, gnavHTML } = createGnav();
    const result = rewriteLinks(gnav);
    expect(result.innerHTML).toBe(gnavHTML);
    jest.resetModules();
  });

  test('should rewrite links in the stage environment', () => {
    const { gnav } = createGnav();
    const result = rewriteLinks(gnav);

    expect(result.innerHTML).toBe(`
        <a href="https://channelpartners.stage2.adobe.com/s/salescenter/dashboard"></a>
        <a href="https://channelpartners.stage2.adobe.com/path"></a>
        <a href="https://unmapped-domain.com/path"></a>
      `);
  });

  test('should return prod link href unchanged in on aem.page', () => {
    getConfig.mockReturnValue({ env: { name: 'stage' }, codeRoot: 'https://main--dme-partners--adobecom.aem.page/edsdme' });

    const href = 'https://partners.adobe.com/';
    const result = getUpdatedHref(href);

    expect(result).toBe(href);
  });
});

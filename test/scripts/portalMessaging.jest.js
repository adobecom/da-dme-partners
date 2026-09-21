/**
 * @jest-environment jsdom
 */
import {
  getGlobalBanner,
  getSanctionedBanner,
  getRenewBanner,
  prependContent,
} from '../../edsdme/scripts/portalMessaging.js';
import {
  getMetadataContent,
  getCurrentProgramType,
  getPartnerCookieValue,
  getLocale,
  isRenew,
} from '../../edsdme/scripts/utils.js';

jest.mock('../../edsdme/scripts/utils.js', () => ({
  getMetadataContent: jest.fn(),
  getCurrentProgramType: jest.fn(),
  getPartnerCookieValue: jest.fn(),
  SANCTIONED_COUNTRIES: ['ru', 'by'],
  getLocale: jest.fn(() => ({ prefix: '' })),
  isRenew: jest.fn(() => null),
}));

global.fetch = jest.fn();

describe('Test portalMessaging.js', () => {
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
    document.head.innerHTML = '';
    document.body.innerHTML = '';

    getCurrentProgramType.mockReturnValue('vip');
    getPartnerCookieValue.mockReturnValue('us');
    getMetadataContent.mockReturnValue(null);
    getLocale.mockReturnValue({ prefix: '' });
    isRenew.mockReturnValue(null);

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('getGlobalBanner', () => {
    it('returns undefined when metadata content is missing', async () => {
      getMetadataContent.mockReturnValue(null);

      const result = await getGlobalBanner();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        'global-banner should be displayed but banner fragment path is not found',
      );
    });

    it('returns undefined when metadata content is NONE', async () => {
      getMetadataContent.mockReturnValue('NONE');

      const result = await getGlobalBanner();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('warns and returns undefined when path does not start with /', async () => {
      getMetadataContent.mockReturnValue('relative/path');

      const result = await getGlobalBanner();

      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Invalid global-banner path: relative/path');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('logs error and warns when fragment fetch fails', async () => {
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      global.fetch.mockResolvedValue({ ok: false, status: 404 });

      const result = await getGlobalBanner();

      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('Fetching fragment failed, status 404');
      expect(warnSpy).toHaveBeenCalledWith('Banner fragment for /fragments/global-banner not found');
    });

    it('returns banner element on success', async () => {
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body><main><div id="banner">Banner</div></main></body></html>'),
      });

      const result = await getGlobalBanner();

      expect(result).toBeTruthy();
      expect(result.id).toBe('banner');
    });
  });

  describe('getSanctionedBanner', () => {
    it('returns null if partner country is not sanctioned', async () => {
      getPartnerCookieValue.mockReturnValue('us');

      const result = await getSanctionedBanner();

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns sanctioned banner for RU with default path', async () => {
      getPartnerCookieValue.mockReturnValue('ru');
      getMetadataContent.mockReturnValue(null);
      getLocale.mockReturnValue({ prefix: '' });
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(
          '<html><body><main><div class="notification">Sanctioned RU</div></main></body></html>',
        ),
      });

      const result = await getSanctionedBanner();

      expect(result).toBeTruthy();
      expect(result.classList.contains('notification')).toBe(true);
      expect(result.textContent).toBe('Sanctioned RU');
      expect(global.fetch).toHaveBeenCalledWith('/edsdme/partners-shared/fragments/banner-account-sanctioned');
    });

    it('returns sanctioned banner for BY with locale prefix', async () => {
      getPartnerCookieValue.mockReturnValue('by');
      getMetadataContent.mockReturnValue(null);
      getLocale.mockReturnValue({ prefix: '/de' });
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(
          '<html><body><main><div class="notification">Sanctioned BY</div></main></body></html>',
        ),
      });

      const result = await getSanctionedBanner();

      expect(result).toBeTruthy();
      expect(result.classList.contains('notification')).toBe(true);
      expect(result.textContent).toBe('Sanctioned BY');
      expect(global.fetch).toHaveBeenCalledWith('/de/edsdme/partners-shared/fragments/banner-account-sanctioned');
    });

    it('uses custom metadata path if present', async () => {
      getPartnerCookieValue.mockReturnValue('ru');
      getMetadataContent.mockReturnValue('/custom/path/sanctioned-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(
          '<html><body><main><div id="sanctioned-banner">Custom Sanctioned</div></main></body></html>',
        ),
      });

      const result = await getSanctionedBanner();

      expect(result).toBeTruthy();
      expect(result.id).toBe('sanctioned-banner');
      expect(result.textContent).toBe('Custom Sanctioned');
      expect(global.fetch).toHaveBeenCalledWith('/custom/path/sanctioned-banner');
    });

    it('returns null on fragment fetch error', async () => {
      getPartnerCookieValue.mockReturnValue('ru');
      getMetadataContent.mockReturnValue(null);
      global.fetch.mockResolvedValue({ ok: false, status: 404 });

      const result = await getSanctionedBanner();

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Fetching fragment failed, status 404');
      expect(warnSpy).toHaveBeenCalledWith(
        'Banner fragment for /edsdme/partners-shared/fragments/banner-account-sanctioned not found',
      );
    });
  });

  describe('getRenewBanner', () => {
    it('returns undefined for sanctioned country', async () => {
      getPartnerCookieValue.mockReturnValue('ru');
      isRenew.mockReturnValue({ accountStatus: 'expired', daysNum: 7 });

      const result = await getRenewBanner();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns undefined when isRenew returns null', async () => {
      getPartnerCookieValue.mockReturnValue('us');
      isRenew.mockReturnValue(null);

      const result = await getRenewBanner();

      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns expired renew banner and replaces $daysNum', async () => {
      getPartnerCookieValue.mockReturnValue('us');
      getLocale.mockReturnValue({ prefix: '' });
      getMetadataContent.mockImplementation((key) => (key === 'banner-account-expires' ? null : null));
      isRenew.mockReturnValue({ accountStatus: 'expired', daysNum: 7 });

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div class="notification">Expires in $daysNum days</div>'),
      });

      const result = await getRenewBanner();

      expect(result).toBeTruthy();
      expect(result.querySelector('.notification')).toBeTruthy();
      expect(result.textContent).toContain('Expires in 7 days');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost/edsdme/partners-shared/fragments/banner-account-expires.plain.html',
      );
    });

    it('uses metadata path for suspended banner when present', async () => {
      getPartnerCookieValue.mockReturnValue('us');
      isRenew.mockReturnValue({ accountStatus: 'suspended', daysNum: 3 });
      getMetadataContent.mockImplementation((key) => {
        if (key === 'banner-account-suspended') return '/custom/suspended-banner';
        return null;
      });

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<div class="notification">Suspended for $daysNum days</div>'),
      });

      const result = await getRenewBanner();

      expect(result).toBeTruthy();
      expect(result.textContent).toContain('Suspended for 3 days');
      expect(global.fetch).toHaveBeenCalledWith('http://localhost/custom/suspended-banner.plain.html');
    });

    it('returns null and logs error when renew fetch fails', async () => {
      getPartnerCookieValue.mockReturnValue('us');
      isRenew.mockReturnValue({ accountStatus: 'expired', daysNum: 10 });
      getMetadataContent.mockReturnValue(null);
      global.fetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });

      const result = await getRenewBanner();

      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith(
        'There has been a problem with your fetch operation:',
        expect.any(Error),
      );
    });
  });

  describe('prependContent', () => {
    it('returns early when no main element exists', async () => {
      await prependContent({ locales: {} });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('prepends global + renew banners for non-sanctioned partner', async () => {
      document.body.innerHTML = '<main><div id="existing">Existing</div></main>';
      getPartnerCookieValue.mockReturnValue('us');
      isRenew.mockReturnValue({ accountStatus: 'expired', daysNum: 5 });
      getMetadataContent.mockImplementation((key) => {
        if (key === 'global-banner') return '/fragments/global-banner';
        return null;
      });

      global.fetch.mockImplementation((url) => {
        if (url === '/fragments/global-banner') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><body><main><div id="global-banner">Global</div></main></body></html>'),
          });
        }
        if (url === 'http://localhost/edsdme/partners-shared/fragments/banner-account-expires.plain.html') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<div class="notification">Expires in $daysNum days</div>'),
          });
        }
        return Promise.reject(new Error(`Unknown url: ${url}`));
      });

      await prependContent({ locales: {} });

      const main = document.querySelector('main');
      expect(main.children[0].querySelector('.notification')).toBeTruthy();
      expect(main.children[1].id).toBe('global-banner');
      expect(main.children[2].id).toBe('existing');
    });

    it('prepends sanctioned before global for sanctioned partner', async () => {
      document.body.innerHTML = '<main><div id="existing">Existing</div></main>';
      getPartnerCookieValue.mockReturnValue('ru');
      isRenew.mockReturnValue({ accountStatus: 'expired', daysNum: 5 }); // ignored due sanctioned
      getMetadataContent.mockImplementation((key) => {
        if (key === 'global-banner') return '/fragments/global-banner';
        return null;
      });

      global.fetch.mockImplementation((url) => {
        if (url === '/fragments/global-banner') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><body><main><div id="global-banner">Global</div></main></body></html>'),
          });
        }
        if (url === '/edsdme/partners-shared/fragments/banner-account-sanctioned') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<html><body><main><div id="sanctioned-banner">Sanctioned</div></main></body></html>'),
          });
        }
        return Promise.reject(new Error(`Unknown url: ${url}`));
      });

      await prependContent({ locales: {} });

      const main = document.querySelector('main');
      expect(main.children[0].id).toBe('sanctioned-banner');
      expect(main.children[1].id).toBe('global-banner');
      expect(main.children[2].id).toBe('existing');
    });
  });
});

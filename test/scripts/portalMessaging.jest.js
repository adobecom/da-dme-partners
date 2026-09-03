/**
 * @jest-environment jsdom
 */
import { getGlobalBanner, prependContent } from '../../edsdme/scripts/portalMessaging.js';
import { getMetadataContent } from '../../edsdme/scripts/utils.js';

jest.mock('../../edsdme/scripts/utils.js', () => ({ getMetadataContent: jest.fn() }));

global.fetch = jest.fn();

describe('Test portalMessaging.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockReset();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('getGlobalBanner', () => {
    it('returns undefined when metadata content is missing', async () => {
      getMetadataContent.mockReturnValue(null);
      const result = await getGlobalBanner();
      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns undefined when metadata content is NONE', async () => {
      getMetadataContent.mockReturnValue('NONE');
      const result = await getGlobalBanner();
      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns undefined when metadata content is none (case-insensitive)', async () => {
      getMetadataContent.mockReturnValue('  none  ');
      const result = await getGlobalBanner();
      expect(result).toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('warns and returns undefined when path does not start with /', async () => {
      getMetadataContent.mockReturnValue('relative/path');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await getGlobalBanner();
      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith('Invalid global-banner path: relative/path');
      expect(global.fetch).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('logs error and warns when fragment fetch fails', async () => {
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      global.fetch.mockResolvedValue({ ok: false, status: 404 });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await getGlobalBanner();
      expect(result).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('Fetching fragment failed, status 404');
      expect(warnSpy).toHaveBeenCalledWith('Banner fragment for /fragments/global-banner not found');
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('returns banner content element on success', async () => {
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body><main><div id="banner">Banner</div></main></body></html>'),
      });
      const result = await getGlobalBanner();
      expect(result).not.toBeNull();
      expect(result.id).toBe('banner');
    });
  });

  describe('prependContent', () => {
    it('returns early when no main element exists', async () => {
      document.body.innerHTML = '';
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      await prependContent();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('prepends global banner to main when available', async () => {
      document.body.innerHTML = '<main><div id="existing">Content</div></main>';
      getMetadataContent.mockReturnValue('/fragments/global-banner');
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body><main><div id="banner">Banner</div></main></body></html>'),
      });
      await prependContent();
      expect(document.querySelector('main').firstElementChild.id).toBe('banner');
    });

    it('does not modify main when global banner is unavailable', async () => {
      document.body.innerHTML = '<main><div id="existing">Content</div></main>';
      getMetadataContent.mockReturnValue(null);
      await prependContent();
      expect(document.querySelector('main').firstElementChild.id).toBe('existing');
    });
  });
});

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { getConfig, sidekickListener } from '../../../edsdme/blocks/utils/utils.js';

const locales = { '': {}, apac: {}, na: {}, latam: {} };

describe('Sidekick CaaS unpublishing', () => {
  let fetchStub;
  let handlers;
  let originalIMS;
  let originalPath;
  let originalEnv;

  beforeEach(async () => {
    originalIMS = window.adobeIMS;
    originalPath = window.location.pathname;
    originalEnv = getConfig().env;
    window.adobeIMS = {
      isSignedInUser: () => true,
      getAccessToken: () => ({ token: 'test-token' }),
    };
    document.body.innerHTML = '<header></header><aem-sidekick></aem-sidekick>';
    handlers = {};
    sinon.stub(document.querySelector('aem-sidekick'), 'addEventListener').callsFake((name, handler) => {
      handlers[name] = handler;
    });
    getConfig().env = { name: 'stage' };
    fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      json: async () => ({ successfulIds: ['card-url: card-id'], errors: [] }),
    });
    await sidekickListener(locales);
  });

  afterEach(() => {
    sinon.restore();
    window.adobeIMS = originalIMS;
    getConfig().env = originalEnv;
    window.history.replaceState({}, '', originalPath);
    document.body.innerHTML = '';
  });

  const runAction = async (event) => {
    const pending = handlers[`custom:${event}`]();
    await new Promise((resolve) => { window.setTimeout(resolve, 0); });
    const toasts = document.querySelectorAll('sp-toast');
    const result = toasts[toasts.length - 1];
    const outcome = { text: result.textContent, variant: result.variant };
    result.dispatchEvent(new Event('close'));
    await pending;
    return outcome;
  };

  [
    { event: 'unpublishfromallsites', path: '/channelpartners/card', allSites: true },
    ...['', '/apac', '/na', '/latam', '/de'].map((prefix) => ({ event: 'unpublishfromcurrentsite', path: `${prefix}/channelpartners/card`, allSites: false })),
  ].forEach(({ event, path, allSites }) => {
    it(`sends the correct payload for ${event} on ${path}`, async () => {
      window.history.replaceState({}, '', path);
      const result = await runAction(event);
      expect(fetchStub.callCount).to.equal(1);
      const [url, options] = fetchStub.firstCall.args;
      expect(url.href).to.equal('https://io-partners-tooling.stage.adobe.com/api/v1/web/dx-partners-runtime-tooling/unpublish-cards-from-caas');
      expect(options.method).to.equal('POST');
      expect(options.headers.get('Authorization')).to.equal('test-token');
      expect(JSON.parse(options.body)).to.deep.equal({ cardPath: path, allSites });
      expect(result.variant).to.equal('positive');
      expect(result.text).to.include('card-url: card-id');
    });
  });

  it('uses the production tooling domain in production', async () => {
    getConfig().env.name = 'prod';
    await runAction('unpublishfromallsites');
    expect(fetchStub.firstCall.args[0].origin).to.equal('https://io-partners-tooling.adobe.com');
  });

  it('surfaces HTTP failures without reporting success', async () => {
    sinon.stub(console, 'error');
    fetchStub.resolves({ ok: false, status: 403, text: async () => 'Forbidden' });
    const result = await runAction('unpublishfromcurrentsite');
    expect(result.variant).to.equal('negative');
    expect(result.text).to.include('CaaS unpublishing failed: Forbidden');
  });

  [
    { successfulIds: [], variant: 'negative' },
    { successfulIds: ['card-id'], variant: 'info' },
  ].forEach(({ successfulIds, variant }) => {
    it(`reports runtime errors as ${variant}`, async () => {
      fetchStub.resolves({
        ok: true,
        json: async () => ({ successfulIds, errors: ['Unable to remove card'] }),
      });
      const result = await runAction('unpublishfromcurrentsite');
      expect(result.variant).to.equal(variant);
      expect(result.text).to.include('Unable to remove card');
    });
  });

  it('surfaces network failures', async () => {
    sinon.stub(console, 'error');
    fetchStub.rejects(new Error('Network unavailable'));
    const result = await runAction('unpublishfromcurrentsite');
    expect(result.variant).to.equal('negative');
    expect(result.text).to.include('Network unavailable');
  });

  it('does not call the runtime when signed out', async () => {
    window.adobeIMS.isSignedInUser = () => false;
    const clock = sinon.useFakeTimers();
    await handlers['custom:unpublishfromcurrentsite']();
    expect(fetchStub.called).to.equal(false);
    expect(document.querySelector('sp-toast').textContent).to.include('not logged in');
    clock.restore();
  });
});

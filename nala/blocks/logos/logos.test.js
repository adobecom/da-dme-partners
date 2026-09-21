import { test, expect } from '@playwright/test';
import LogosPage from './logos.page.js';
import SignInPage from '../signin/signin.page.js';
import Logos from './logos.spec.js';

let logosPage;
let signInPage;

const { features } = Logos;

test.describe('Validate logos page', () => {
  test.beforeEach(async ({ page, baseURL, browserName, context }) => {
    logosPage = new LogosPage(page);
    signInPage = new SignInPage(page);
    if (!baseURL.includes('partners.stage.adobe.com')) {
      await context.setExtraHTTPHeaders({ authorization: `token ${process.env.MILO_AEM_API_KEY}` });
    }
    if (browserName === 'chromium' && !baseURL.includes('partners.stage.adobe.com')) {
      await page.route('https://www.adobe.com/chimera-api/**', async (route, request) => {
        const newUrl = request.url().replace(
          'https://www.adobe.com/chimera-api',
          'https://14257-chimera.adobeioruntime.net/api/v1/web/chimera-0.0.1',
        );
        route.continue({ url: newUrl });
      });
    }
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page }) => {
    const { data, path } = features[0];
    await test.step('Go to public page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Verify Logos block', async () => {
      await logosPage.logosBlock.waitFor({ state: 'visible', timeout: 30000 });
      await logosPage.firstLogo.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Verify Logos details', async () => {
      await logosPage.firstLogo.click();
      await logosPage.cardIcon.waitFor({ state: 'visible', timeout: 5000 });
      await logosPage.cardTitle.waitFor({ state: 'visible', timeout: 5000 });
      await logosPage.cardSize.waitFor({ state: 'visible', timeout: 5000 });
      await logosPage.cardDate.waitFor({ state: 'visible', timeout: 5000 });
      await logosPage.cardDescription.waitFor({ state: 'visible', timeout: 5000 });
      await logosPage.cardTagLogo.waitFor({ state: 'visible', timeout: 5000 });
      await expect(logosPage.downloadLogo).toHaveAttribute('download');
      const downloadButtonHref = await logosPage.downloadLogo.getAttribute('href');
      expect(downloadButtonHref).toBeTruthy();
    });
  });
});

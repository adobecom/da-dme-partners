import { test } from '@playwright/test';
import analyticsAttributesSpec from './analytics-attributes.spec.js';
import AnalyticsAttributesPage from './analytics-attributes.page.js';
import SignInPage from '../signin/signin.page.js';

const { features } = analyticsAttributesSpec;
let signInPage;
let analyticsAttributesPage;

const analyticsAttributesPages = features.slice(1, 4);
const analyticsAttributesYukonAndFeedback = features.slice(4, 6);

test.describe('Analytics Attributes', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    signInPage = new SignInPage(page);
    analyticsAttributesPage = new AnalyticsAttributesPage(page);

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
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to  page', async () => {
      await page.goto(`${baseURL}${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    });
    await test.step('Verify announcement preview page', async () => {
      await analyticsAttributesPage.byDaaLh(features[0].data.daaLh).waitFor({ state: 'visible', timeout: 20000 });
      await analyticsAttributesPage.search(features[0].data.searchKeyWord);
      await analyticsAttributesPage.byDaaLh(features[0].data.daaLhAfterSearch).waitFor({ state: 'visible', timeout: 20000 });
    });
  });
  analyticsAttributesPages.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
      await test.step('Go to  page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      });
      await test.step('Verify search page', async () => {
        await analyticsAttributesPage.byDaaLh(feature.data.daaLh).waitFor({ state: 'visible', timeout: 20000 });
        await analyticsAttributesPage.search(feature.data.searchKeyWord);
        await analyticsAttributesPage.getFilter(feature.data.filter);
        await analyticsAttributesPage.getCheckBox(feature.data.checkBoxName).click();
        await analyticsAttributesPage.byDaaLh(feature.data.daaLhAfterSearch).waitFor({ state: 'visible', timeout: 20000 });
      });
    });
  });
  analyticsAttributesYukonAndFeedback.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
      await test.step('Go to  page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      });
      await test.step('Verify attributes', async () => {
        await analyticsAttributesPage.feedbackButton.waitFor({ state: 'visible', timeout: 20000 });
        await analyticsAttributesPage.byDaaLh(feature.data.daaLh).waitFor({ state: 'visible', timeout: 20000 });
      });
    });
  });
});

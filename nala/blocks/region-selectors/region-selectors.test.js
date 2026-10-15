import { test, expect } from '@playwright/test';
import RegionSelectorsPage from './region-selectors.page.js';
import RegionSelectors from './region-selectors.spec.js';
import SignInPage from '../signin/signin.page.js';

let regionSelectorsPage;
let signInPage;

const { features } = RegionSelectors;
const locales = features.slice(0, 11);

test.describe('Validate region selector', () => {
  test.beforeEach(async ({ page, baseURL, browserName, context }) => {
    regionSelectorsPage = new RegionSelectorsPage(page);
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

  locales.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
      await test.step('Go to public page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
        await page.waitForLoadState('load');
      });

      await test.step('Verify change region option is present in the footer', async () => {
        const changeRegionButton = await regionSelectorsPage.getButtonElement(feature.data.changeRegionEng);
        await changeRegionButton.waitFor({ state: 'visible' });
        await changeRegionButton.click();
        const regionSelectorPopUp = await regionSelectorsPage.regionSelectorPopUp;
        await expect(regionSelectorPopUp).toBeVisible();
      });

      await test.step('Verify region links', async () => {
        await regionSelectorsPage.clickLinkWithText(feature.data.linkText);
        const urlRegex = new RegExp(`.*${feature.data.localeSwitchUrl}.*`);
        await page.waitForURL(urlRegex, { timeout: 5000 });
        const pages = await page.context().pages();
        await expect(pages[0].url())
          .toContain(feature.data.localeSwitchUrl);
      });
    });
  });

  test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
    test.slow();
    const { data, path } = features[11];
    await test.step('Go to public page', async () => {
      await page.goto(`${baseURL}${path}`);
      await page.waitForLoadState('load');
    });

    await test.step('Verify change region option is present in the footer', async () => {
      const changeRegionButton = await regionSelectorsPage.getButtonElement(data.changeRegionEng);
      await changeRegionButton.waitFor({ state: 'visible' });
      await changeRegionButton.click();
      const regionSelectorPopUp = await regionSelectorsPage.regionSelectorPopUp;
      await expect(regionSelectorPopUp).toBeVisible();
    });

    try {
      const oneTrustBanner = await regionSelectorsPage.oneTrustBanner;
      await oneTrustBanner.waitFor({ state: 'visible', timeout: 5000 });
      const closeButton = await regionSelectorsPage.oneTrustBannerDoNotEnableButton;
      await closeButton.click();
    } catch (error) {
      console.log('One trust pop-up did not appear');
    }

    await test.step('Switch to spanish locale', async () => {
      await regionSelectorsPage.clickLinkWithText(data.linkText);
      const urlRegex = new RegExp(`.*${data.localeSwitchUrl}.*`);
      await page.waitForURL(urlRegex, { timeout: 5000 });
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(data.localeSwitchUrl);
    });

    await test.step('Verify redirection and translated change region pop-up', async () => {
      const changeRegionButton = await regionSelectorsPage.getButtonElement(data.changeRegionEsp);
      await changeRegionButton.waitFor({ state: 'visible' });
      await changeRegionButton.click();
      const regionSelectorPopUp = await regionSelectorsPage.regionSelectorPopUp;
      await expect(regionSelectorPopUp).toBeVisible();
      const titleText = await regionSelectorsPage.getPopUpParagraphByText(data.titleText);
      await expect(titleText).toBeVisible();
      const titleDesc = await regionSelectorsPage.getPopUpOnlyParagraphByText(data.titleDesc);
      await expect(titleDesc).toBeVisible();
      const closePopUpButton = await regionSelectorsPage.getButtonElement(data.closePopUpButton);
      await closePopUpButton.click();
    });

    await test.step('Sign in', async () => {
      const signInButton = await regionSelectorsPage.getButtonElement(data.signInButton);
      await signInButton.click();
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify change region option is not present in the footer for the logged in user', async () => {
      await regionSelectorsPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const changeRegionButton = await regionSelectorsPage.getButtonElement(data.changeRegionEng);
      await expect(changeRegionButton).toBeHidden();
    });
  });
});

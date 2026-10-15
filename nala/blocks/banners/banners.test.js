import { test, expect } from '@playwright/test';
import BannersPage from './banners.page.js';
import SignInPage from '../signin/signin.page.js';
import Banners from './banners.spec.js';

let bannersPage;
let signInPage;

const { features } = Banners;
const anniversaryDateOutOfRangeCases = features.slice(1, 6);
const anniversaryNonPrimaryContacts = features.slice(6, 10);
const anniversaryPrimaryContacts = features.slice(10, 16);

test.describe('Validate banners', () => {
  test.beforeEach(async ({ page, baseURL, browserName, context }) => {
    bannersPage = new BannersPage(page);
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

  function generateDateWithDaysOffset(daysOffset) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL, context }) => {
    const { data, path } = features[0];
    await test.step('Go to public page', async () => {
      await page.goto(`${baseURL}${features[0].path}`);
    });

    await test.step('Set partner_data cookie', async () => {
      await signInPage.addCookie(
        data.partnerData,
        `${baseURL}${path}`,
        context,
      );
      await page.reload();
    });

    await test.step('Verify renew banner', async () => {
      const renewBanner = await bannersPage.renewBanner;
      await expect(renewBanner).toBeHidden();
    });
  });

  anniversaryDateOutOfRangeCases.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL, context }) => {
      await test.step('Go to public page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
      });

      await test.step('Set partner_data cookie', async () => {
        const anniversaryDate = generateDateWithDaysOffset(feature.data.partnerData.daysToAnniversary);
        const cookieData = {
          ...feature.data.partnerData,
          anniversaryDate,
        };
        await signInPage.addCookie(
          cookieData,
          `${baseURL}${feature.path}`,
          context,
        );
        await page.reload();
      });

      await test.step('Verify renew banner', async () => {
        const renewBanner = await bannersPage.renewBanner;
        await expect(renewBanner).toBeHidden();
      });
    });
  });

  anniversaryNonPrimaryContacts.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL, context }) => {
      await test.step('Go to public page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
      });

      await test.step('Set partner_data cookie', async () => {
        const anniversaryDate = generateDateWithDaysOffset(feature.data.partnerData.daysToAnniversary);
        const cookieData = {
          ...feature.data.partnerData,
          anniversaryDate,
        };
        await signInPage.addCookie(
          cookieData,
          `${baseURL}${feature.path}`,
          context,
        );
        await page.reload();
      });

      await test.step('Verify renew banner', async () => {
        const renewBanner = await bannersPage.renewBanner;
        await expect(renewBanner).toBeHidden();
      });
    });
  });

  anniversaryPrimaryContacts.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL, context }) => {
      await test.step('Go to public page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
      });

      await test.step('Set partner_data cookie', async () => {
        const anniversaryDate = generateDateWithDaysOffset(feature.data.partnerData.daysToAnniversary);
        const cookieData = {
          ...feature.data.partnerData,
          anniversaryDate,
        };
        await signInPage.addCookie(
          cookieData,
          `${baseURL}${feature.path}`,
          context,
        );
        await page.reload();
      });

      await test.step('Verify renew banner', async () => {
        const renewBanner = await bannersPage.renewBanner;
        await expect(renewBanner).toBeVisible();
        const firstParagraph = bannersPage.getBannerParagraphByIndex(feature.data.paragraphIndex);
        await expect(firstParagraph).toHaveText(feature.data.bannerText);
        const renewLink = await bannersPage.bannerLink;
        await expect(renewLink).toHaveText(feature.data.renewButtonText);
        await expect(renewLink).toHaveAttribute('href', new RegExp(feature.data.renewLinkPath));
      });
    });
  });

  test(`${features[16].name},${features[16].tags}`, async ({ page }) => {
    const { data, path } = features[16];
    await test.step('Go to public page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);
      await signInButtonInt.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    await test.step('Verify renew banner', async () => {
      await page.waitForTimeout(5000);
      await bannersPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      const renewBanner = await bannersPage.renewBannerCertifiedUS;
      await expect(renewBanner).toBeVisible();
      const firstParagraph = bannersPage.getBannerParagraphCertifiedUS(data.paragraphIndex);
      await expect(firstParagraph).toContainText(data.bannerText);
      const renewLink = await bannersPage.bannerLink;
      await expect(renewLink).toHaveText(data.renewButtonText);
      await expect(renewLink).toHaveAttribute('href', new RegExp(data.renewLinkPath));
    });
  });

  test(`${features[17].name},${features[17].tags}`, async ({ page }) => {
    const { data, path } = features[17];
    await test.step('Go to public page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);
      await signInButtonInt.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    await test.step('Verify renew banner', async () => {
      await bannersPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const renewBanner = await bannersPage.renewBannerCertifiedUS;
      await expect(renewBanner).toBeVisible();
      const firstParagraph = bannersPage.getBannerParagraphCertifiedUS(data.paragraphIndex);
      await expect(firstParagraph).toContainText(data.bannerText);
      const renewLink = await bannersPage.bannerLink;
      await expect(renewLink).toHaveText(data.renewButtonText);
      await expect(renewLink).toHaveAttribute('href', new RegExp(data.renewLinkPath));
    });
  });

  test(`${features[18].name},${features[18].tags}`, async ({ page }) => {
    const { data, path } = features[18];
    await test.step('Go to public page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);
      await signInButtonInt.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify renew banner', async () => {
      await bannersPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      const renewBanner = await bannersPage.renewBanner;
      await expect(renewBanner).toBeHidden();
    });

    await test.step('Verify if account has info abandoned', async () => {
      await expect(bannersPage.abandonedAccountLabel).toBeVisible();
      await expect(bannersPage.reEnrollLink).toBeVisible();
      bannersPage.reEnrollLink.click();

      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
      ]);

      await newTab.waitForLoadState();
      expect(newTab.url()).toContain(`${data.enrollmentURL}`);
    });
  });

  test(`${features[19].name},${features[19].tags}`, async ({ page }) => {
    const { data, path } = features[19];
    await test.step('Go to public page with global banner', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Verify global banner with image', async () => {
      await expect(bannersPage.globalBanner).toBeVisible();
      await expect(bannersPage.bannerTitle).toHaveText(data.bannerTitle);
    });
  });
  test(`${features[20].name},${features[20].tags}`, async ({ page }) => {
    const { data, path } = features[20];
    await test.step('Go to public page with global banner', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await page.waitForLoadState('domcontentloaded');
      await bannersPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify global banner with image', async () => {
      await expect(bannersPage.globalBanner).toBeVisible();
      await expect(bannersPage.bannerTitleWithImage).toHaveText(data.bannerTitle);
    });
  });
});

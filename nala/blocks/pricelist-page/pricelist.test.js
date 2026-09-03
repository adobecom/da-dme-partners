import { test, expect } from '@playwright/test';
import SignInPage from '../signin/signin.page.js';
import PricelistPage from './pricelist.page.js';
import PricelistSpec from './pricelist.spec.js';

let pricelistPage;
let pricelistSignIn;
const { features } = PricelistSpec;
const goldAndCertifiedUsers = features.slice(5, 7);
const regionalAccounts = features.slice(8, 12);

test.describe('Pricelist Page Validation', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    pricelistPage = new PricelistPage(page);
    pricelistSignIn = new SignInPage(page);

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
  // @pricelist-validation-filter-combination-one
  test(`${features[0].name}, ${features[0].tags}`, async ({ page }) => {
    const { data, path } = features[0];

    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Filter Price Lists by Currency filter', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await pricelistPage.filterPricelists(pricelistPage.currencyFilter, data.usdCheckBox, true);
      const usdNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      await pricelistPage.filterMonth(pricelistPage.monthFilter);
      const date = await pricelistPage.monthCheckBoxGet(0);
      await pricelistPage.clickMonthCheckboxByDate(date);
      const monthFirstCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(usdNumberOFPriceLists).toBeGreaterThan(monthFirstCheckBoxNumberOFPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.buyingProgramTypesFilter, data.vipCommercialCheckBox, true);
      const vipCommercialCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(monthFirstCheckBoxNumberOFPriceLists).toBeGreaterThan(vipCommercialCheckBoxNumberOFPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.asiaPacificCheckBox, true);
      const asiaPacificCheckBoxNumberOfPriceLists = await pricelistPage.priceListsCount(page);
      expect(vipCommercialCheckBoxNumberOFPriceLists).toBeGreaterThan(asiaPacificCheckBoxNumberOfPriceLists);
    });

    await test.step('Sign out and check url', async () => {
      await pricelistPage.profile.click();
      await pricelistPage.signOut.click();
      const currentUrl = await page.url();
      expect(currentUrl).toContain(data.expectedURL);
    });
  });
  // @pricelist-validation-filter-combination-two
  test(`${features[1].name}, ${features[1].tags}`, async ({ page }) => {
    const { data, path } = features[1];

    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Filter Price Lists by Currency filter', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await pricelistPage.filterPricelists(pricelistPage.currencyFilter, data.jpyCheckBox, true);
      const jpyNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      await pricelistPage.filterMonth(pricelistPage.monthFilter);
      const date = await pricelistPage.monthCheckBoxGet(0);
      await pricelistPage.clickMonthCheckboxByDate(date);
      const monthSecondCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(jpyNumberOFPriceLists).toBeGreaterThanOrEqual(monthSecondCheckBoxNumberOFPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.buyingProgramTypesFilter, data.ycVipCommercialCheckBox, true);
      const ycVipCommercialCheckBoxNumberofPriceLists = await pricelistPage.priceListsCount(page);
      expect(monthSecondCheckBoxNumberOFPriceLists).toBeGreaterThan(ycVipCommercialCheckBoxNumberofPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.japanCheckBox, true);
      const japanCheckBoxNumberOfPriceLists = await pricelistPage.priceListsCount(page);
      expect(ycVipCommercialCheckBoxNumberofPriceLists).toBeGreaterThanOrEqual(japanCheckBoxNumberOfPriceLists);
    });

    await test.step('Sign out and check url', async () => {
      await pricelistPage.profile.click();
      await pricelistPage.signOut.click();
      const currentUrl = await page.url();
      expect(currentUrl).toContain(data.expectedURL);
    });
  });
  // @pricelist-validation-filter-combination-three
  test(`${features[2].name}, ${features[2].tags}`, async ({ page }) => {
    const { data, path } = features[2];

    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Filter Price Lists by Currency filter', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await pricelistPage.searchPriceList(data.keyword);
      await expect(pricelistPage.firstRegionCell).toHaveText(data.asiaPacificKorea);
      const koreaNumberofPriceLists = await pricelistPage.priceListsCount(page);

      await pricelistPage.filterPricelists(pricelistPage.buyingProgramTypesFilter, data.tlp5CommercialCheckBox, true);
      const tlp5CommercialCheckBoxCheckBoxNumberofPriceLists = await pricelistPage.priceListsCount(page);
      expect(koreaNumberofPriceLists).toBeGreaterThan(tlp5CommercialCheckBoxCheckBoxNumberofPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.europeEastCheckBox, true);
      await expect(pricelistPage.firstRegionCell).not.toBeVisible();

      await pricelistPage.xButton.click();
      await pricelistPage.clearAllFilters.click();
      await expect(pricelistPage.firstRegionCell).toHaveText(data.asiaChina);
    });
  });
  // @pricelist-validation-filter-combination-four
  test(`${features[3].name}, ${features[3].tags}`, async ({ page }) => {
    const { data, path } = features[3];

    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Filter Price Lists filter', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.pacificCheckBox, true);
      const pacificCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      await pricelistPage.filterPricelists(pricelistPage.currencyFilter, data.audCheckBox, true);
      const audCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(pacificCheckBoxNumberOFPriceLists).toEqual(audCheckBoxNumberOFPriceLists);

      await pricelistPage.filterPricelists(pricelistPage.buyingProgramTypesFilter, data.vipCommercialCheckBox, true);
      const vipCommercialCheckBoxNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(audCheckBoxNumberOFPriceLists).toBeGreaterThan(vipCommercialCheckBoxNumberOFPriceLists);

      await pricelistPage.includeEndUserPricelists();
      const includeEndUserPricelistsNumberOFPriceLists = await pricelistPage.priceListsCount(page);
      expect(includeEndUserPricelistsNumberOFPriceLists).toBeGreaterThanOrEqual(vipCommercialCheckBoxNumberOFPriceLists);
    });
  });
  // @pricelist-validation-platinum-user
  test(`${features[4].name}, ${features[4].tags}`, async ({ page }) => {
    const { data, path } = features[4];

    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Check pricelist region', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.europeEast, true);
      await expect(pricelistPage.firstRegionCell).toHaveText(data.europeEast);
      await pricelistPage.clearAllFilters.click();

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.europeWest, true);
      await expect(pricelistPage.firstRegionCell).toHaveText(data.europeWest);
      await pricelistPage.clearAllFilters.click();

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.worldwide, true);
      await expect(pricelistPage.firstRegionCell).toHaveText(data.worldwide);
      await pricelistPage.clearAllFilters.click();

      await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.northAmerica, true);
      await expect(pricelistPage.firstRegionCell).toHaveText(data.northAmerica);
      await pricelistPage.clearAllFilters.click();
    });
  });
  // @pricelist-validation-gold-user @pricelist-validation-certified-user
  goldAndCertifiedUsers.forEach((feature) => {
    test(`${feature.name}, ${feature.tags}`, async ({ page }) => {
      const { data, path } = feature;

      await test.step('Sign In with user', async () => {
        await page.goto(`${path}`);
        const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
        await signInButtonInt.click();
        await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
        await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
      });

      await test.step('Check pricelist region', async () => {
        await pricelistPage.priceListGNav.click();
        await page.waitForLoadState('networkidle');
        await expect(pricelistPage.firstRegionCell).not.toBeVisible();
        await pricelistPage.includeEndUserPricelists();
        await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.europeEast, true);
        expect(pricelistPage.firstRegionCell).toHaveText(data.europeEast, { normalizeWhitespace: true });
        await pricelistPage.clearAllFilters.click();
        await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.europeWest, true);
        expect(pricelistPage.firstRegionCell).toHaveText(data.europeWest, { normalizeWhitespace: true });
        await pricelistPage.clearAllFilters.click();
        await pricelistPage.filterPricelists(pricelistPage.regionFilter, data.northAmerica, true);
        expect(pricelistPage.firstRegionCell).toHaveText(data.northAmerica, { normalizeWhitespace: true });
        await pricelistPage.clearAllFilters.click();
      });
    });
  });
  // @pricelist-validation-registered-user
  test(`${features[7].name}, ${features[7].tags}`, async ({ page }) => {
    const { data, path } = features[7];
    await test.step('Sign In with user', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();

      await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
      await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Check pricelist region', async () => {
      await pricelistPage.priceListGNav.click();
      await page.waitForLoadState('networkidle');
      await expect(pricelistPage.firstRegionCell).not.toBeVisible();
      await pricelistPage.includeEndUserPricelists();
      await expect(pricelistPage.firstRegionCell).not.toBeVisible();
    });
  });
  // @pricelist-validation-distributor-india-user @pricelist-validation-kr-distributor-user @pricelist-validation-cpp-distr-latin-america-na-user @pricelist-validation-cpp-distributor-us-user
  regionalAccounts.forEach((feature) => {
    test(`${feature.name}, ${feature.tags}`, async ({ page }) => {
      const { data, path } = feature;

      await test.step('Sign In with user', async () => {
        await page.goto(`${path}`);
        await page.waitForLoadState('domcontentloaded');
        const signInButtonInt = await pricelistSignIn.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
        await signInButtonInt.click();
        await pricelistSignIn.signIn(page, `${data.partnerLevel}`);
        await pricelistPage.priceListGNav.waitFor({ state: 'visible', timeout: 30000 });
      });

      await test.step('Check pricelist region', async () => {
        await pricelistPage.priceListGNav.click();
        await page.waitForLoadState('networkidle');
        await expect(pricelistPage.firstRegionCell).toBeVisible({ timeout: 30000 });
        await expect(pricelistPage.firstRegionCell).not.toHaveText('', { timeout: 30000 });
        await pricelistPage.filterPricelists(
          pricelistPage.filterHeaderByAriaLabel(data.regionFilter),
          data.checkBox,
          true,
        );
        await expect(pricelistPage.firstRegionCell).toContainText(data.text);
      });
    });
  });
});

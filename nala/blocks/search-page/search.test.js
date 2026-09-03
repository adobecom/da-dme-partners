import { test, expect } from '@playwright/test';
import SignInPage from '../signin/signin.page.js';
import SearchSpec from './search.spec.js';
import SearchPage from './search.page.js';

let searchTest;
let signInSearchTest;

const { features } = SearchSpec;
const localesAssetValidation = features.slice(3, 6);
const localesAssetValidationPart2 = features.slice(6, 9);

test.describe('Search Page validation', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    searchTest = new SearchPage(page);
    signInSearchTest = new SignInPage(page);

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
  // @na-validate-assets-present-for-user
  test(`${features[0].name}, ${features[0].tags}`, async ({ page }) => {
    const { data } = features[0];

    await test.step('Sign In with user', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[0].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
    });

    await test.step('Check MAPC public stage asset', async () => {
      // check asset title
      await searchTest.checkCardTitle(`${data.asset1}`);
      // check pdf icon is displayed
      await searchTest.checkFileIcon(`${data.iconPdf}`);
      // check the present tags
      await searchTest.hasCardTag(data.asset1, data.asset1Tag1);
      await searchTest.hasCardTag(data.asset1, data.asset1Tag2);
      await searchTest.hasCardTag(data.asset1, data.asset1Tag3);
      await searchTest.hasCardTag(data.asset1, data.asset1Tag4);
    });

    await test.step('Check MAPC stage education', async () => {
      await searchTest.checkCardDescription(data.asset2, data.descriptionText);
      await searchTest.checkFileIcon(`${data.iconXLS}`);
    });

    await test.step('Check MAPC stage worldwide', async () => {
      await searchTest.checkFileIcon(data.iconDef);
    });

    await test.step('Check MAPC stage combined', async () => {
      await searchTest.checkFileIcon(data.iconDoc);
    });

    await test.step('Check if new tab is opened for preview', async () => {
      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        searchTest.openPreview.click(),
      ]);

      const pages = page.context().pages();
      expect(pages.length).toBe(2);
      await newTab.close();
    });

    const promise = new Promise((resolve) => {
      page.on('response', (response) => {
        if (response.url().includes(`${data.assetURL}`) && response.status() === data.httpStatusCode) {
          resolve(true);
        }
      });
    });

    await test.step('Open pdf preview', async () => {
      const hrefLink = await searchTest.openPreview.getAttribute('href');

      await page.evaluate((navigationUrl) => {
        window.location.href = navigationUrl;
      }, hrefLink);
      await page.waitForLoadState('load');
    });
    const resourceSuccessfullyLoaded = await promise;

    expect(resourceSuccessfullyLoaded).toBe(true);
  });
  // @na-validate-search-page-filters-part-one
  test(`${features[1].name}, ${features[1].tags}`, async ({ page }) => {
    const { data } = features[1];

    await test.step('Sign In with user', async () => {
      await page.goto(`${features[1].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[1].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Filter Assets by Type filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterType, data.checkBoxLicensing, true);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.clearAllFilters.click();
    });

    await test.step('Filter Assets by Language filter', async () => {
      await searchTest.languageFilter(searchTest.filterLanguage, data.checkBoxArabic);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Filter Assets by Product filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterProduct, data.checkBoxAdobeSign);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Filter Assets by Topic filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterTopic, data.checkBoxDealRegistration);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.clearAll();
    });

    await test.step('Search Page pagination test', async () => {
      await searchTest.clearAll();
      await page.waitForLoadState('domcontentloaded');
      const number = await searchTest.checkNumberOfAssets();
      expect(number).toBeGreaterThan(4);

      await searchTest.nextPageCLick();
      await searchTest.checkCardTitle(data.nextPageAsset);
      await searchTest.prevPageClick();
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.page3Click();
      await searchTest.checkCardTitle(data.page3Asset);
    });
  });
  // @na-validate-search-page-filters-part-two
  test(`${features[2].name}, ${features[2].tags}`, async ({ page }) => {
    const { data } = features[2];

    await test.step('Sign In with user', async () => {
      await page.goto(`${features[2].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[2].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Filter Assets by Language filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterLanguage, data.checkBoxSpanish);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.filterSearchAssets(searchTest.filterLanguage, data.checkBoxArabic);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Filter Assets by Product filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterProduct, data.checkBoxAdobeDreamweaver);
      await searchTest.checkCardTitle(data.asset1);
    });

    await test.step('Filter Assets by Topic filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterTopic, data.checkBoxProgramGuid);
      await searchTest.checkCardTitle(data.asset1);
    });

    await test.step('Filter Assets Uncheck Language filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterLanguage, data.checkBoxSpanish);
      await searchTest.filterSearchAssets(searchTest.filterLanguage, data.checkBoxArabic);
      await searchTest.checkCardTitle(data.asset1);
    });

    await test.step('Filter Assets Uncheck Topic and Product filter', async () => {
      await searchTest.filterSearchAssets(searchTest.filterTopic, data.checkBoxProgramGuid);
      await searchTest.filterSearchAssets(searchTest.filterProduct, data.checkBoxAdobeDreamweaver);
      await searchTest.checkCardTitle(data.asset3);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.checkCardTitle(data.asset4);
    });

    await test.step('Clear seach keyword test', async () => {
      await searchTest.clearAll();
      await page.waitForLoadState('domcontentloaded');
      await page.locator('.search-card:visible').first().waitFor({ state: 'visible' });
      const number = await searchTest.checkNumberOfAssets();
      expect(number).toBeGreaterThan(4);
    });
  });

  localesAssetValidation.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      const { data, path } = feature;
      await test.step('Sign In with user', async () => {
        await page.goto(`${path}`);
        await page.waitForLoadState('domcontentloaded');
        await signInSearchTest.signIn(page, `${data.partnerLevel}`);
        await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
      });
      await test.step('Search for assets ', async () => {
        await searchTest.searchAsset(`${data.searchKeyWord}`);
        await searchTest.checkCardTitle(data.asset1);
        await searchTest.checkCardTitle(data.asset4);
        await searchTest.checkCardTitle(data.asset2);
        await searchTest.checkCardTitle(data.asset3);
      });
    });
  });

  localesAssetValidationPart2.forEach((feature) => {
    test(`${feature.name}, ${feature.tags}`, async ({ page }) => {
      const { data, path } = feature;
      await test.step('Sign In with China user', async () => {
        await page.goto(`${path}`);
        await page.waitForLoadState('domcontentloaded');
        await signInSearchTest.signIn(page, `${data.partnerLevel}`);
        await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
      });
      await test.step('Search for assets ', async () => {
        await searchTest.searchAsset(`${data.searchKeyWord}`);
        await searchTest.checkCardTitle(data.asset1);
        await searchTest.checkCardTitle(data.asset4);
        await searchTest.checkCardTitle(data.asset2);
        await searchTest.checkCardTitle(data.asset3);
        await searchTest.checkCardTitle(data.asset5);
      });
    });
  });
  // @pacific-user-asset-validation-search-page
  test(`${features[9].name}, ${features[9].tags}`, async ({ page }) => {
    const { data } = features[9];

    await test.step('Sign In with China user', async () => {
      await page.goto(`${features[9].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[9].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.checkCardTitle(data.asset3);
    });
  });
  // @uk-user-asset-validation-search-page
  test(`${features[10].name}, ${features[10].tags}`, async ({ page }) => {
    const { data } = features[10];

    await test.step('Sign In with China user', async () => {
      await page.goto(`${features[10].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[10].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.checkCardTitle(data.asset3);
      await searchTest.checkCardTitle(data.asset5);
      await searchTest.checkCardTitle(data.asset6);
    });
  });
  // @korea-user-asset-validation-search-pag
  test(`${features[11].name}, ${features[11].tags}`, async ({ page }) => {
    const { data } = features[11];

    await test.step('Sign In with China user', async () => {
      await page.goto(`${features[11].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[11].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset1);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.checkCardTitle(data.asset2);
      await searchTest.checkCardTitle(data.asset3);
    });
  });
  // @search-page-validation-search-page-test
  test(`${features[12].name}, ${features[12].tags}`, async ({ page }) => {
    const { data } = features[12];

    await test.step('Sign In with  user', async () => {
      await page.goto(`${features[12].path}`);
      await page.waitForLoadState('domcontentloaded');

      const signInButtonInt = await signInSearchTest.getSignInButton(
        `${features[12].data.signInButtonInternationalText}`,
      );

      await signInButtonInt.click();

      await signInSearchTest.signIn(page, `${features[12].data.partnerLevel}`);
      await signInSearchTest.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchForAsset(data.searchText);
      await page.waitForLoadState('networkidle');
      await searchTest.checkNumberOfAssets();
      const numberOfAssets = await searchTest.checkNumberOfAssets();
      await searchTest.clearAll();
      await searchTest.searchAsset(data.searchText);
      await page.waitForLoadState('load');
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
      const numberOfAssetsAfterSearch = await searchTest.checkNumberOfAssets();
      expect(numberOfAssets).toBe(numberOfAssetsAfterSearch);
    });

    await test.step('Check assets and pages tabs ', async () => {
      await searchTest.assetTabs.click();
      await page.waitForLoadState('networkidle');
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 30000 });
      await searchTest.checkCardTitle(`${data.asset2}`);

      await searchTest.pagesTab.click();
      await page.waitForLoadState('networkidle');
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 30000 });
      await searchTest.checkCardTitle(`${data.asset3}`);
      await searchTest.openPreviewPages.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('Open preview for page', async () => {
      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        searchTest.openPreviewPages.click(),
      ]);

      // Wait for the popup to navigate; toHaveURL() only accepts string/RegExp, not a predicate.
      await newTab.waitForURL(
        (url) => url.href.includes(data.expectedUrl),
        { timeout: 30000 },
      );
      expect(newTab.url()).toContain(data.expectedUrl);

      await newTab.close();
    });

    await test.step('Search for Mapc assests', async () => {
      await searchTest.clearAll();
      await searchTest.searchAsset(`${data.searchKeyWord}`);
      await searchTest.checkCardTitle(data.asset4);
      await searchTest.checkCardTitle(data.asset5);
      await searchTest.checkCardTitle(data.asset6);
      await searchTest.checkCardTitle(data.asset7);
      await searchTest.checkCardTitle(data.asset8);
    });
  });

  // @na-validate-announcement-assets-present-for-user
  test(`${features[13].name}, ${features[13].tags}`, async ({ page }) => {
    const { data } = features[13];

    await test.step('Sign In with user', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, `${features[0].data.partnerLevel}`);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord}`);
    });

    await test.step('Check asset icons', async () => {
      // check if asset announcement icon is displayed
      await searchTest.checkFileIcon(`${data.iconAnnouncement}`);

      // check if the download icon is disabled
      await expect(searchTest.downloadDisabled).toHaveAttribute('aria-disabled', 'true');

      // check if the preview icon is enabled
      await expect(searchTest.openPreview).toBeEnabled();
    });

    await test.step('Check if new tab is opened for preview', async () => {
      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        searchTest.openPreview.click(),
      ]);

      const pages = page.context().pages();
      await expect(pages[1].url())
        .toContain(`${data.assetURL}`);

      await newTab.close();
    });
  });
  test(`${features[14].name}, ${features[14].tags}`, async ({ page }) => {
    const { data, path } = features[14];

    await test.step('Sign In with user', async () => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, data.partnerLevel);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
    });

    await test.step('Search for assets with fragments ', async () => {
      await searchTest.searchAsset(`${data.searchKeyWord1}`);
      await searchTest.checkCardTitle(`${data.asset1}`);

      await searchTest.clearAllFilters.click();
      await searchTest.searchAsset(`${data.searchKeyWord2}`);
      await searchTest.checkCardTitle(`${data.asset2}`);

      await searchTest.clearAllFilters.click();
      await searchTest.searchAsset(`${data.searchKeyWord3}`);
      await searchTest.checkCardTitle(`${data.asset3}`);

      await searchTest.clearAllFilters.click();
      await searchTest.searchAsset(`${data.searchKeyWord4}`);
      await page.waitForLoadState('networkidle');
      await expect(searchTest.noResultsTitle).toBeVisible();

      await searchTest.clearAllFilters.click();
      await searchTest.searchAsset(`${data.searchKeyWord5}`);
      await page.waitForLoadState('networkidle');
      await expect(searchTest.noResultsTitle).toBeVisible();

      await searchTest.clearAllFilters.click();
      await searchTest.searchAsset(`${data.searchKeyWord6}`);
      await page.waitForLoadState('networkidle');
      await expect(searchTest.noResultsTitle).toBeVisible();
    });
  });
  test(`${features[15].name}, ${features[15].tags}`, async ({ page }) => {
    const { data, path } = features[15];

    await test.step('Sign In with user', async () => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      await signInSearchTest.signIn(page, data.partnerLevel);
      await searchTest.searchCard.first().waitFor({ state: 'visible', timeout: 40000 });
      await page.pause();
      await searchTest.appleydFilter.waitFor({ state: 'visible', timeout: 10000 });
      await searchTest.checkCardTitle(`${data.assetTitle}`);
    });
  });
});

import { test, expect } from '@playwright/test';
import smokeSpec from './smoke.spec.js';
import SmokeTest from './smoke.page.js';
import SignInPage from '../signin/signin.page.js';
import ProfileDropdownPage from '../profile-dropdown/profile-dropdown.page.js';

let smokeTest;
let signInSmokeTest;
let profileDropdownPage;

const { features } = smokeSpec;
const regionBasedFooterAndGnav = features.slice(21, 23);

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    smokeTest = new SmokeTest(page);
    signInSmokeTest = new SignInPage(page);
    profileDropdownPage = new ProfileDropdownPage(page);

    const { path } = features[0];
    await test.step('Go to Landing page', async () => {
      await page.goto(new URL(path, baseURL).href);
    });
  });

  async function verifyGeoModalAndPartnerLinks(page, linkText, pageURL, findPartnerLinkText) {
    await page.goto(pageURL);

    await expect(smokeTest.geoModal).toBeVisible();

    await expect(smokeTest.getGeoModalLink(linkText)).toHaveAttribute('href', `${pageURL}#`);
    await smokeTest.getGeoModalLink(linkText).click();

    const findPartnerLink = await smokeTest.getFindPartnerByRegion(findPartnerLinkText);
    await expect(findPartnerLink).toBeVisible();
    await expect(findPartnerLink.getAttribute('target')).resolves.toBe('_blank');
  }

  // @lending-page-validation-smoke-test
  test(`${features[0].name}, ${features[0].tags}`, async () => {
    await test.step('Validate Join Now and Sign In Buttons', async () => {
      // checking if there are buttons on the page
      await smokeTest.verifyButtonExist();
    });
  });
  // @home-page-validation-smoke-test
  test(`${features[1].name}, ${features[1].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[1].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, enter user email and password', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[1].data.partnerLevel}`);
    });
    await test.step('Verify protected Gnav exists', async () => {
      await smokeTest.verifyProtectedGnav();
    });
    await test.step('Verify Profile Icon exists', async () => {
      await smokeTest.verifyProfileIcon();
    });
  });
  // @price-list-validation-smoke-test
  test(`${features[2].name}, ${features[2].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[2].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, enter user email and password', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[2].data.partnerLevel}`);
    });
    await test.step('Go to Price List from GNav and verify redirection', async () => {
      // cliking on price list from gnav
      await smokeTest.priceList.click();
      await page.waitForTimeout(3000);
      // checking url
      const currentURL = await page.evaluate(() => window.location.href);
      await expect(currentURL).toContain(
        features[2].data.expectedPublicPageURL,
      );
    });
    await test.step('Find a row in price list and click on download', async () => {
      await smokeTest.clickDownloadButtonInFirstRow();
    });
  });
  // @search-page-validation-smoke-test
  test(`${features[3].name}, ${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[3].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, enter user email and password', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[2].data.partnerLevel}`);
    });
    await test.step('Click rearch from GNav', async () => {
      // cliking on search from gnav
      await smokeTest.searchGnav.click();
    });
    // search pdf and click enter
    await test.step('Verify a search field and type text', async () => {
      //   await smokeTest.search();
      await smokeTest.searchGnavField.fill(data.searchText);
      await smokeTest.searchGnavField.press('Enter');
    });

    await test.step('Verify search page conntent', async () => {
      const searchFieldValue = await smokeTest.searchFieldPage.getAttribute(
        'value',
      );
      expect(searchFieldValue).toContain(data.searchText);
    });

    await test.step('Find a row in assets list and click on download', async () => {
      await smokeTest.assetTabs.click();
      await smokeTest.searchPageDownloadButton();
    });
  });

  // @user-redirection-apac-smoke-test
  test(`${features[4].name}, ${features[4].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[4].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, verify user redirection', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[4].data.partnerLevel}`);
      await page.waitForLoadState('networkidle');

      const currentURL = await page.evaluate(() => window.location.href);
      await expect(currentURL).toContain(
        features[4].data.expectedPublicPageURL,
      );
    });
  });
  // @user-redirection-emea-smoke-test
  test(`${features[5].name}, ${features[5].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[5].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, verify user redirection', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[5].data.partnerLevel}`);
      await page.waitForLoadState('networkidle');

      const currentURL = await page.evaluate(() => window.location.href);
      await expect(currentURL).toContain(
        features[5].data.expectedPublicPageURL,
      );
    });
  });
  // @user-redirection-jp-smoke-test
  test(`${features[6].name}, ${features[6].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[6].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, verify user redirection', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[6].data.partnerLevel}`);
      await page.waitForLoadState('networkidle');
      const currentURL = await page.evaluate(() => window.location.href);
      await expect(currentURL).toContain(
        features[6].data.expectedPublicPageURL,
      );
    });
  });
  // @search-page-validation-smoke-test
  test(`${features[7].name}, ${features[7].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[7].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In, verify user redirection', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[7].data.partnerLevel}`);
      await page.waitForLoadState('networkidle');
      const currentURL = await page.evaluate(() => window.location.href);
      await expect(currentURL).toContain(
        features[7].data.expectedPublicPageURL,
      );
    });
  });
  // @announcement-page-validation-smoke-test
  test(`${features[8].name}, ${features[8].tags}`, async ({ page, baseURL }) => {
    await test.step('Click Sign In button', async () => {
      // finding sign in button
      const signInButtonInt = await signInSmokeTest.getSignInButton(
        `${features[7].data.signInButtonInternationalText}`,
      );
      // click on sign in button
      await signInButtonInt.click();
    });
    await test.step('Sing In', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[8].data.partnerLevel}`);

      await test.step('Click on Announcments from GNav and verify one Announcment card is displayed and page is loaded correctly', async () => {
        await smokeTest.announcemnts.click();
        await smokeTest.announcmentCardVerification({ expect });
      });
    });
  });
  // @search-page-query-param-validation-smoke-test
  test(`${features[9].name}, ${features[9].tags}`, async ({ page, baseURL }) => {
    const { data } = features[9];

    await test.step('Go to prefiltered Search page', async () => {
      await page.goto(`${baseURL}${features[9].path}`);
    });

    await test.step('Sing In, enter user email and password', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${data.partnerLevel}`);
    });

    /**
     * Verify is search field and URL do not contain partnerLogin=true as query parameter
     * Verify if search field and URL contain term=Logo as query parameter
    */
    await test.step('Verify if search field contains term query parameter', async () => {
      const searchFieldValue = await smokeTest.searchFieldPage.getAttribute(
        'value',
      );
      expect(searchFieldValue).toContain(data.searchText);
      expect(page.url()).toContain(data.searchText);

      expect(searchFieldValue).not.toContain('partnerLogin');
      expect(page.url()).not.toContain('partnerLogin');
    });

    await test.step('Verify if the URL search query parameter does not exist after the logout', async () => {
      await smokeTest.profileIcon.click();
      await profileDropdownPage.getLogoutByText('Sign Out').click();
      expect(page.url()).not.toContain(data.searchText);
    });
  });

  // @retail-program-validation-smoke-test
  test(`${features[10].name}, ${features[10].tags}`, async ({ page }) => {
    await test.step('Veryfy the Select you region is visible', async () => {
      // select you region visible on public page
      const selectYourRegionPublicSection = page.locator('#select-your-region');
      await selectYourRegionPublicSection.isVisible();
    });

    await test.step('Open North America public page and verify select you region does not exist', async () => {
      const [newPage] = await Promise.all([
        page.waitForEvent('popup'),
        // clicking on nort america program from public page
        page.locator('//a[contains(@href, "na/channelpartners/")]').click(),
      ]);
      await newPage.waitForLoadState();
      // check if section select you region is not vsible on na public page
      await expect(newPage.locator('#select-your-region')).not.toBeVisible();
    });
    await test.step('Verify NA Partnership Opportunities is visible', async () => {
      await smokeTest.verifyNorthAmericaPublicPage();
    });
    await test.step('Verify Partnership Opportunities on APAC Page', async () => {
      // opening the APAC public page and checking partnership opportunities
      await smokeTest.verifyApacPage();
    });
  });
  // @apac-specialization-validation-smoke-test
  test(`${features[11].name}, ${features[11].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[11].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
    // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[11].data.partnerLevel}`);
    });

    await test.step('Verify VIP Marketplace specialization', async () => {
      await smokeTest.apacSpecializationVerify();
    });
  });
  // @latam-specialization-validation-smoke-test
  test(`${features[12].name}, ${features[11].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[12].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
      // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[12].data.partnerLevel}`);
    });

    await test.step('Verify VIP Marketplace specialization', async () => {
      await smokeTest.latamSpecializationVerify();
    });
  });
  // @emea-specialization-validation-smoke-test
  test(`${features[13].name}, ${features[13].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[13].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
    // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[13].data.partnerLevel}`);
    });

    await test.step('Verify VIP Marketplace specialization', async () => {
      await smokeTest.emeaSpecializationVerify();
    });
  });
  // @korea-specialization-validation-smoke-test
  test(`${features[14].name}, ${features[14].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[14].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
    // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[14].data.partnerLevel}`);
    });

    await test.step('Verify VIP Marketplace specialization', async () => {
      await smokeTest.krSpecializationVerify();
    });
  });
  // @uplevel-info-validation-smoke-test
  test(`${features[15].name}, ${features[15].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[15].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
    // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[15].data.partnerLevel}`);
    });

    await test.step('Reseller program uplevel verification', async () => {
      await smokeTest.checkUplevelProgram();

      const resellerProgramLink = page.locator('p.body-m a[href*="/p/Reseller_Program_Guide_EMEA.pdf"]').nth(0);
      await resellerProgramLink.isVisible();
      const resellerProgramhref = await resellerProgramLink.getAttribute('href');
      expect(resellerProgramhref).toContain(
        features[15].data.expectedResellerProgramURL,
      );
    });

    await test.step('Retail program uplevel verification', async () => {
      const retailProgramLink = page.locator('p.body-m a[href*="/p/EMEA_Retail_Program_Guide.pdf"]').nth(0);
      await retailProgramLink.isVisible();
      const retailProgramhHref = await retailProgramLink.getAttribute('href');
      expect(retailProgramhHref).toContain(
        features[15].data.expectedRetailProgramURL,
      );
    });

    await test.step('Membership page info verification', async () => {
      await smokeTest.membershipPageInfoVerification();
    });
  });
  // @cal-links-apac-validation-smoke-test
  test(`${features[16].name}, ${features[16].tags}`, async ({ page, baseURL }) => {
    const signInButtonInt = await signInSmokeTest.getSignInButton(
      `${features[16].data.signInButtonInternationalText}`,
    );
    // click on sign in button
    await signInButtonInt.click();

    await test.step('Sing In, enter user email and password', async () => {
    // entering user email and password
      await smokeTest.smokeSignIn(page, baseURL, `${features[16].data.partnerLevel}`);
    });
    await test.step('Cal page verification', async () => {
      // verify APC program guids
      await smokeTest.apcProgramGuidsVerify();
      // open cal from gnav
      await smokeTest.requestCalverify();
      // verify request and submit for INDIA cal
      await smokeTest.indiaCalVerify();
      // verify request and submit for SEA/BD cal
      await smokeTest.seabdCalVerify();
      // verify request and submit for HKT cal
      await smokeTest.hktCalVerify();
      // verify request and submit for China cal
      await smokeTest.chinaCalVerify();
      // verify request and submit for ANZ cal
      await smokeTest.anzCalVerify();
      // verify request and submit for Kora cal
      await smokeTest.koreaCalVerify();

      await test.step('Submit email verification', async () => {
        await smokeTest.submitEmailVerify();
      });

      await test.step('Mebership page verififcation', async () => {
        await smokeTest.apacMembershipVerify();

        const distributorGuid = page.locator('p.body-m.action-area a:has-text("Distributor Guide")');
        const distributorGuidlink = await distributorGuid.getAttribute('href');
        expect(distributorGuidlink.includes('Asia') && distributorGuidlink.includes('Distributor')).toBeTruthy();
      });
    });
  });

  // @join-now-button-validation-smoke-test
  test(`${features[17].name}, ${features[17].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[17];
    const joinNowButton = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonText);

    await test.step('Verify if Join Now button is not visible on international pages', async () => {
      await page.goto(`${baseURL}${path}`);
      await expect(joinNowButton).toBeHidden();
    });

    await test.step('Verify if Join Now button is visible on North America pages', async () => {
      await page.goto(data.naLocaleSwitchUrl);
      await expect(joinNowButton).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Latin America pages', async () => {
      await page.goto(data.latamLocaleSwitchUrl);
      await expect(joinNowButton).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Europe, Middle East, and Africa (English) pages', async () => {
      await page.goto(data.emeaLocaleSwitchUrl);
      await expect(joinNowButton).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Franch pages', async () => {
      const joinNowButtonFr = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonFrenchText);

      await page.goto(data.frLocaleSwitchUrl);
      await expect(joinNowButtonFr).toBeVisible();
    });

    await test.step('Verify if Join button is visible on German pages', async () => {
      const joinNowButtonDe = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonGermanText);

      await page.goto(data.deLocaleSwitchUrl);
      await expect(joinNowButtonDe).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Italian pages', async () => {
      const joinNowButtonIt = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonItalianText);

      await page.goto(data.itLocaleSwitchUrl);
      await expect(joinNowButtonIt).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Spanish pages', async () => {
      const joinNowButtonEs = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonSpanishText);

      await page.goto(data.esLocaleSwitchUrl);
      await expect(joinNowButtonEs).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Asia Pacific pages', async () => {
      await page.goto(data.apacLocaleSwitchUrl);
      await expect(joinNowButton).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Korian pages', async () => {
      const joinNowButtonKr = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonKorianText);

      await page.goto(data.krLocaleSwitchUrl);
      await expect(joinNowButtonKr).toBeVisible();
    });

    await test.step('Verify if Join button is visible on China pages', async () => {
      const joinNowButtonCn = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonChinaText);

      await page.goto(data.cnLocaleSwitchUrl);
      await expect(joinNowButtonCn).toBeVisible();
    });

    await test.step('Verify if Join button is visible on Japan pages', async () => {
      const joinNowButtonJp = await smokeTest.getJoinNowButtonByRegion(data.joinNowButtonJapanText);

      await page.goto(data.jpLocaleSwitchUrl);
      await expect(joinNowButtonJp).toBeVisible();
    });
  });

  // @find-partner-validation-smoke-test
  test(`${features[18].name}, ${features[18].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[18];

    await test.step('Verify if geo modal and Find a Partner link are visible on North America pages', async () => {
      await verifyGeoModalAndPartnerLinks(page, data.geoModalLinkNA, `${baseURL}${path}`, data.findPartnerLinkText);
    });

    await test.step('Verify if geo modal and Find a Partner link are visible on German pages', async () => {
      await verifyGeoModalAndPartnerLinks(page, data.geoModalLinkGerman, `${baseURL}${data.deLocalePartnerUrl}`, data.findPartnerGermanLinkText);
    });

    await test.step('Verify if geo modal and Find a Partner link are visible on Japan pages', async () => {
      await verifyGeoModalAndPartnerLinks(page, data.geoModalLinkJapan, `${baseURL}${data.jpLocalePartnerUrl}`, data.findPartnerJapanLinkText);
    });
  });

  // @sso-integration-between-apc-and-cbc
  test(`${features[19].name}, ${features[19].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[19];

    await test.step('Go to home page and sign in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.smokeSignIn(page, baseURL, `${data.partnerLevel}`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify CBC Learn More link', async () => {
      await expect(smokeTest.cbcLearnMore).toBeVisible();

      const href = await smokeTest.cbcLearnMore.getAttribute('href');
      await expect(href).toContain(data.expectedURL);
      await expect(href).toContain(data.cbcConnectionDomain);

      await expect(smokeTest.cbcLearnMore.getAttribute('target')).resolves.toBe('_blank');
    });
  });

  // @sso-integration-between-apc-and-finder
  test(`${features[20].name}, ${features[20].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[20];

    await test.step('Go to home page and sign in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.smokeSignIn(page, baseURL, `${data.partnerLevel}`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify Find Distributor button and the URL opened in a new tab', async () => {
      await expect(smokeTest.findDistributorBtn).toBeVisible();

      const href = await smokeTest.findDistributorBtn.getAttribute('href');
      await expect(href).toContain(data.expectedFindURL);
      await expect(smokeTest.findDistributorBtn.getAttribute('target')).resolves.toBe('_blank');

      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
        smokeTest.findDistributorBtn.click(),
      ]);

      await newTab.waitForLoadState();
      expect(newTab.url()).toContain(`${data.expectedSalesForceURL}`);
      newTab.close();
    });
  });

  // @na-footer-and-gnav-validation
  // @kr-footer-and-gnav-validation
  regionBasedFooterAndGnav.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
      const { data } = feature;

      await test.step('Go to home page', async () => {
        await page.waitForLoadState('networkidle');
      });

      await test.step('Click on Change Region and verify the URL', async () => {
        await smokeTest.regionPicker.waitFor({ state: 'visible' });
        await smokeTest.regionPicker.click();

        const regionOption = await smokeTest.getRegionOption(data.defaultURL);
        await regionOption.waitFor({ state: 'visible' });
        await regionOption.click();

        const urlRegex = new RegExp(`.*${data.defaultURL}.*`);
        await page.waitForURL(urlRegex, { timeout: 5000 });

        const pages = await page.context().pages();
        expect(pages[0].url()).toContain(data.defaultURL);
      });

      await test.step('Click on the Program and verify the URL', async () => {
        await smokeTest.programGnavOption.waitFor({ state: 'visible' });
        await smokeTest.programGnavOption.click();

        await page.waitForLoadState();
        expect(page.url()).toContain(`${baseURL}${data.programURL}`);
      });

      await test.step('Click on the Support and verify the URL', async () => {
        await smokeTest.supportGnavOption.waitFor({ state: 'visible' });
        await smokeTest.supportGnavOption.click();
        await smokeTest.supportResources.click();

        await page.waitForLoadState();
        expect(page.url()).toContain(`${baseURL}${data.supportURL}`);
      });
    });
  });

  // @logo-redirection-validation-smoke-test
  test(`${features[23].name}, ${features[23].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[23];

    await test.step('Verify logo redirection for public page', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.supportGnavOption.click();
      await smokeTest.supportResources.click();
      await page.waitForLoadState('networkidle');
      await smokeTest.apcLogo.click();
      await page.waitForURL('**', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain(data.logoRedirectionURLPublic);
    });

    await test.step('Verify logo redirection for protected page', async () => {
      const signInButtonInt = await signInSmokeTest.getSignInButton(`${features[23].data.signInButtonInternationalText}`);
      await signInButtonInt.click();
      await smokeTest.smokeSignIn(page, baseURL, `${data.partnerLevel}`);
      await page.waitForLoadState('networkidle');
      await smokeTest.profileIcon.waitFor({ state: 'visible', timeout: 10000 });

      await smokeTest.announcemnts.click();
      await page.waitForLoadState('networkidle');
      await smokeTest.apcLogo.click();
      await page.waitForURL('**', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain(data.logoRedirectionURLProtected);
    });
  });
  // @prp-collection-smoke-test
  test(`${features[24].name}, ${features[24].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[24];

    await test.step('Verify PRP collection page', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.smokeSignIn(page, baseURL, `${data.partnerLevel}`);
    });
    await test.step('Verify number of collections', async () => {
      const numberOfCollections = await smokeTest.getNumberOfCollectionsCount();
      expect(numberOfCollections).toBeGreaterThan(0);

      const cardTitleBeforeSorting = await smokeTest.getCardTitle();
      await smokeTest.selectDateSort(data.sortOldest);
      const cardTitleAfterSorting = await smokeTest.getCardTitle();
      expect(cardTitleAfterSorting).not.toBe(cardTitleBeforeSorting);
    });
    await test.step('Verify filter checkbox', async () => {
      await smokeTest.fisrtFilter.click();
      const filterCheckbox = smokeTest.filterFirstCheckbox(data.firstFilterSection);
      await filterCheckbox.click();
      // check number after filter
      const numberOfCollectionsAfterFilter = await smokeTest.getNumberOfCollectionsCount();
      expect(numberOfCollectionsAfterFilter).toBeGreaterThan(0);

      await smokeTest.clearAll.click();
      await smokeTest.secondFilter.click();
      const filterCheckboxOffers = smokeTest.filterFirstCheckbox(data.secondFilterSection);
      await filterCheckboxOffers.click();
      // check number after filter
      const numberOfCollectionsAfterFilterOffers = await smokeTest.getNumberOfCollectionsCount();
      expect(numberOfCollectionsAfterFilterOffers).toBeGreaterThan(0);

      // get href link
      const hrefLink = await smokeTest.getCollectionLink(page);
      await smokeTest.cards.nth(0).click();
      await page.waitForURL('**', { timeout: 30000 });
      await expect(page.url()).toContain(hrefLink);
    });
  });
  // @smoke-test-feedback-mechanism-restricted-page-validation
  test(`${features[25].name},${features[25].tags}`, async ({ page, baseURL }) => {
    const { data, path } = features[25];

    await test.step('Log in', async () => {
      await page.goto(`${baseURL}${path}`);
      await smokeTest.signInButton.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.signInButton.click();
      await smokeTest.smokeSignIn(page, baseURL, data.partnerLevel);
      await smokeTest.profileIcon.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Check Feedback Dialog', async () => {
      await smokeTest.feedbackButton.waitFor({ state: 'visible', timeout: 30000 });
      expect(smokeTest.feedbackButton).toBeVisible();
      expect(smokeTest.feedbackButton).toBeEnabled();
      await smokeTest.feedbackButton.click();

      await smokeTest.feedbackTitle.waitFor({ state: 'visible', timeout: 30000 });
      await expect(smokeTest.feedbackTitle).toBeVisible();
      await expect(smokeTest.feedbackTitle).toHaveText(data.feedbackTitle);

      await smokeTest.feedbackTextArea.waitFor({ state: 'visible', timeout: 30000 });

      await smokeTest.feedbackTextArea.fill(data.feedbackTextArea);
      await smokeTest.feedbackTextArea.press('Enter');

      await expect(smokeTest.feedbackSendButton).toBeVisible();
      await expect(smokeTest.feedbackSendButton).toBeDisabled();

      await smokeTest.feedBackStars3.waitFor({ state: 'visible', timeout: 30000 });
      await smokeTest.feedBackStars3.click();
      await expect(smokeTest.feedbackSendButton).toBeEnabled();
    });
  });
});

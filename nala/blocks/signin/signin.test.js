import { test, expect } from '@playwright/test';
import SignInPage from './signin.page.js';
import signin from './signin.spec.js';

let signInPage;

const { features } = signin;
const redirectionFeatures = features.slice(1, 3);
const nonMemberRedirects = features.slice(3, 5);
const nonMemberLoggedInToAdobe = features.slice(5, 7);
const resellerMembersLogin = features.slice(9, 13);
const errorPages = features.slice(14, 17);
const redirectionByRegionFeatures = features.slice(18, 29);

test.describe('MAPC sign in flow', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    signInPage = new SignInPage(page);
    page.on('console', (msg) => {
      console.log(`${msg.type()}: ${msg.text()}`, msg.type() === 'error' ? msg.location().url : null);
    });
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
    await test.step('Go to the home page', async () => {
      await page.goto(`${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await signInPage.getSignInButton(`${features[0].data.signInButtonInternationalText}`);
      await signInButtonInt.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${features[0].data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify redirection to restricted home after successful login', async () => {
      await expect(page.url()).toContain(`${features[0].data.expectedProtectedHomeURL}`);
    });

    await test.step('Logout', async () => {
      await signInPage.profileIconButton.click();
      const logoutButton = await signInPage.getButtonElement(`${features[0].data.logoutButtonText}`);
      await logoutButton.click();
    });

    await test.step('Verify redirection to public page after logout', async () => {
      const signInButton = await signInPage.getSignInButton(`${features[0].data.signInButtonEsGeoText}`);
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(page.url())
        .toContain(`${features[0].data.expectedPublicPageURL}`);
    });
  });

  redirectionFeatures.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, browserName }) => {
      await signInPage.verifyRedirectAfterLogin({
        page,
        expect,
        path: feature.baseURL,
        partnerLevel: feature.data.partnerLevel,
        newTabPath: feature.newTabUrl,
        expectedLandingPageURL: feature.data.expectedToSeeInURL,
        buttonText: feature.data.signInButtonInternationalText,
        browserName,
      });
    });
  });

  nonMemberRedirects.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, browserName }) => {
      if (browserName === 'firefox') {
        test.slow();
      }
      await test.step('Go to the home page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        const signInButtonInt = await signInPage.getSignInButton(`${feature.data.signInButtonInternationalText}`);
        await signInButtonInt.click();
      });

      await test.step('Sign in', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      });

      await test.step('After login user is redirected to contact-not-found page', async () => {
        await expect(page.url()).toContain(`${feature.data.expectedRedirectedURL}`);
      });

      await test.step('Logout', async () => {
        const currentUrl = page.url();
        const newUrl = `${currentUrl.replace('#', '')}?akamaiLocale=na&martech=off`;
        await page.goto(newUrl);
        await signInPage.profileIconButton.click();
        const logoutButton = await signInPage.getButtonElement(`${feature.data.logoutButtonText}`);
        await logoutButton.click();
      });

      await test.step('Verify redirection to public page after logout', async () => {
        const signInButton = await signInPage.getSignInButton(`${feature.data.signInButtonText}`);
        await signInButton.waitFor({ state: 'visible', timeout: 10000 });
        await expect(page.url()).toContain(`${feature.data.expectedPublicPageURL}`);
      });
    });
  });

  nonMemberLoggedInToAdobe.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, context, browserName }) => {
      if (browserName === 'firefox') {
        test.slow();
      }
      const signInButtonInt = await signInPage.getSignInButton(`${feature.data.signInButtonText}`);
      await test.step('Go to the home page', async () => {
        const url = `${feature.baseURL}`;
        await page.evaluate((navigationUrl) => {
          window.location.href = navigationUrl;
        }, url);

        await signInButtonInt.click();
        await page.waitForLoadState('domcontentloaded');
      });

      await test.step('Sign in with tpp platinum user', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await page.waitForEvent('load');
        await page.waitForTimeout(5000);
      });

      await test.step(`Open ${feature.data.page} in a new tab`, async () => {
        const newTab = await context.newPage();
        await newTab.goto(`${feature.path}`, { waitUntil: 'networkidle' });
        const newTabPage = new SignInPage(newTab);
        await newTabPage.regionPicker.waitFor({ state: 'visible', timeout: 30000 });
        await newTabPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
        await expect(newTab.url())
          .toContain(`${feature.data.expectedRedirectedURL}`);
        await expect(signInButtonInt).toBeHidden();
        const joinNowButton = await newTabPage.joinNowButton;
        if (feature === features[5]) {
          // Test 6 - Join In button visible in gnav
          await expect(joinNowButton).toBeVisible();
        } else if (feature === features[6]) {
          // Test 7 - Join In button is not visible in gnav
          await expect(joinNowButton).toBeHidden();
        }
      });
    });
  });

  test(`${features[7].name},${features[7].tags}`, async ({ page, context, browserName }) => {
    if (browserName === 'firefox') {
      test.slow();
    }
    const { data, path, baseURL } = features[7];
    const signInButton = await signInPage.getSignInButton(`${data.signInButtonText}`);
    await test.step('Go to the home page', async () => {
      const url = `${baseURL}`;
      await page.evaluate((navigationUrl) => {
        window.location.href = navigationUrl;
      }, url);

      await signInButton.click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Sign in with tpp platinum user', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await page.waitForEvent('load');
      await page.waitForTimeout(5000);
    });

    await test.step('Open public page in a new tab', async () => {
      const newTab = await context.newPage();
      await newTab.goto(`${path}`);
      const newTabPage = new SignInPage(newTab);
      await newTabPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      await expect(newTab.url())
        .toContain(`${data.expectedPublicURL}`);
      await expect(signInButton).toBeHidden();
    });

    await test.step('Open restricted page in a new tab', async () => {
      const newTab = await context.newPage();
      await newTab.goto(`${data.restrictedHomePath}`);
      const newTabPage = new SignInPage(newTab);
      await newTabPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      await expect(newTab.url())
        .toContain(`${data.expectedToSeeInURL}`);
    });
  });

  test(`${features[8].name},${features[8].tags}`, async ({ page }) => {
    const { path, expectedToSeeInURL } = features[8];
    await test.step('Go to protected home page', async () => {
      await page.goto(`${path}`);
      await expect(page.url())
        .toContain(`${expectedToSeeInURL}`);
    });
  });

  resellerMembersLogin.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      await test.step('Go to the public page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        const signInButton = await signInPage.getSignInButton(`${feature.data.signInButtonText}`);
        await signInButton.click();
      });

      await test.step('Sign in', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
      });

      await test.step('Verify successful login', async () => {
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      });
    });
  });

  test(`${features[13].name},${features[13].tags}`, async ({ page }) => {
    const { data, path } = features[13];
    await test.step('Go to public program page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const joinNowButton = await signInPage.joinNowButton;
      await expect(joinNowButton).toBeVisible();
      const signInButtonInt = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);
      await expect(signInButtonInt).toBeVisible();
      await signInButtonInt.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    const signInButton = await signInPage.getSignInButton(`${data.signInButtonText}`);
    await test.step('After login user is redirected to protected program page', async () => {
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      await expect(page.url()).toContain(`${data.landingPageAfterLoginURL}`);
      const joinNowButton = await signInPage.joinNowButton;
      await expect(joinNowButton).toBeHidden();
      await expect(signInButton).toBeHidden();
    });

    await test.step('Logout', async () => {
      const currentUrl = page.url();
      const newUrl = `${currentUrl.replace('#', '')}?akamaiLocale=na&martech=off`;
      await page.goto(newUrl);
      await signInPage.profileIconButton.click();
      const logoutButton = await signInPage.getButtonElement(`${data.logoutButtonText}`);
      await logoutButton.click();
    });

    await test.step('Verify redirection to public program page after logout', async () => {
      await signInButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(page.url())
        .toContain(`${data.landingPageAfterLogoutURL}`);
      const joinNowButton = await signInPage.joinNowButton;
      await expect(joinNowButton).toBeVisible();
      await expect(signInButton).toBeVisible();
    });
  });

  errorPages.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      await test.step('Go to the home page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        const signInButtonInt = await signInPage.getSignInButton(`${feature.data.signInButtonInternationalText}`);
        await signInButtonInt.click();
      });

      await test.step('Sign in', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
      });

      await test.step('Verify redirection to the corresponding error page', async () => {
        await expect(page.url()).toContain(`${feature.data.expectedToSeeInURL}`);
      });
    });
  });

  // @login-accessing-view-account-abandoned-user
  test(`${features[17].name},${features[17].tags}`, async ({ page }) => {
    const { data, path } = features[17];
    const signInButton = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);

    await test.step('Go to home page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');

      await signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });

    await test.step('After login user is redirected to error page', async () => {
      await expect(page.url()).toContain(`${data.expectedToSeeInURL}`);
    });

    await test.step('Click on the View account', async () => {
      await signInPage.profileIconButton.click();
      const viewAccount = await signInPage.getButtonElement(`${data.viewAccountButton}`);
      await viewAccount.click();
    });

    await test.step('Verify redirection to Adobe account management page', async () => {
      const [newTab] = await Promise.all([
        page.waitForEvent('popup'),
      ]);
      await newTab.waitForLoadState();
      expect(newTab.url()).toContain(`${data.newTabUrl}`);
    });
  });

  redirectionByRegionFeatures.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      const { path, data } = feature;

      const signInButton = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);

      await test.step('Go to home page', async () => {
        await page.goto(`${path}`);
        await page.waitForLoadState('domcontentloaded');

        await signInButton.click();
      });

      await test.step('Sign in', async () => {
        await signInPage.signIn(page, `${data.partnerLevel}`);
      });

      await test.step('Verify redirection to correct region home page after the login', async () => {
        await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
        expect(page.url()).toContain(`${data.expectedToSeeInURL}`);
      });
    });
  });
  test(`${features[29].name},${features[29].tags}`, async ({ page }) => {
    const { data, path } = features[29];
    await test.step('Go to the home page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      const signInButtonInt = await signInPage.getSignInButton(`${data.signInButtonInternationalText}`);
      await signInButtonInt.click();
    });
    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
      await signInPage.profileIconButton.waitFor({ state: 'visible', timeout: 30000 });
    });
    await test.step('Verify redirection to the contact-not-found page', async () => {
      await expect(page.url()).toContain(`${data.expectedRedirectedURL}`);
    });
  });
});

import { test, expect } from '@playwright/test';
import ProfileDropdownPage from './profile-dropdown.page.js';
import SignInPage from '../signin/signin.page.js';
import profiles from './profile-dropdown.spec.js';

let profileDropdownPage;
let signInPage;

const { features } = profiles;
const anniversaryDateCases = features.slice(1, 3);

test.describe('Validate profile dropdown', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    profileDropdownPage = new ProfileDropdownPage(page);
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
    test.slow();
    const { data, path } = features[0];
    await test.step('Go to the home page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      await profileDropdownPage.signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    await test.step('Verify profile dropdown after successful login', async () => {
      await profileDropdownPage.verifyProfileDropdownAfterLogin(data);
    });

    await test.step('Verify edit profile link', async () => {
      const [editProfileTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.editProfileButton.click(),
      ]);
      await editProfileTab.waitForLoadState();
      await expect(editProfileTab.url()).toContain(`${data.editProfileURL}`);
    });

    await test.step('Verify account management link', async () => {
      const [accountManagementTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.getAccountManagementByText('Open account management').click(),
      ]);
      await accountManagementTab.waitForLoadState();
      await expect(accountManagementTab.url()).toContain(`${data.accountManagementURL}`);
    });

    await test.step('Verify sales center link', async () => {
      const [salesCenterTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.salesCenterButton.click(),
      ]);
      await salesCenterTab.waitForLoadState();
      const urlRegex = new RegExp(`.*${data.salesCenterURL}.*`);
      await salesCenterTab.waitForURL(urlRegex, { timeout: 20000 });
      await expect(salesCenterTab.url()).toContain(`${data.salesCenterURL}`);
    });

    await test.step('Logout', async () => {
      await profileDropdownPage.getLogoutByText('Sign Out').click();
      const pages = await page.context().pages();
      await page.waitForLoadState();
      await expect(pages[0].url())
        .toContain(data.targetAfterLogout);
    });
  });

  anniversaryDateCases.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page }) => {
      test.slow();
      await test.step('Go to the home page', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        await profileDropdownPage.signInButton.click();
      });

      await test.step('Sign in', async () => {
        await signInPage.signIn(page, `${feature.data.partnerLevel}`);
      });

      await test.step('Verify profile dropdown after successful login', async () => {
        await profileDropdownPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
        await profileDropdownPage.toggleProfileDropdown();
        const profileImage = await profileDropdownPage.profileImage;
        await expect(profileImage).toBeVisible();
        const profileName = await profileDropdownPage.profileName.textContent();
        await expect(profileName).toBe(feature.data.profileName);
        const profileEmail = await profileDropdownPage.profileEmail.textContent();
        await expect(profileEmail).toBe(feature.data.profileEmail);
        const primaryContact = await profileDropdownPage.primaryContact;
        await expect(primaryContact).toBeVisible();
        const profilePartnerLevel = await profileDropdownPage.profilePartnerLevel.textContent();
        await expect(profilePartnerLevel).toBe(feature.data.profilePartnerLevel);
        const renewText = profileDropdownPage.getRenewNotification(feature.data.type);
        await expect(renewText).toContainText(feature.data.profileRenewText);
      });

      await test.step('Verify edit profile link', async () => {
        const [editProfileTab] = await Promise.all([
          page.context().waitForEvent('page'),
          await profileDropdownPage.editProfileButton.click(),
        ]);
        await editProfileTab.waitForLoadState();
        await expect(editProfileTab.url()).toContain(`${feature.data.editProfileURL}`);
      });

      await test.step('Verify account management link', async () => {
        const [accountManagementTab] = await Promise.all([
          page.context().waitForEvent('page'),
          await profileDropdownPage.getAccountManagementByText('Open account management').click(),
        ]);
        await accountManagementTab.waitForLoadState();
        await expect(accountManagementTab.url()).toContain(`${feature.data.accountManagementURL}`);
      });

      await test.step('Verify renewal link', async () => {
        const [renewalTab] = await Promise.all([
          page.context().waitForEvent('page'),
          await profileDropdownPage.clickRenewNowButton(feature.data.type),
        ]);
        await renewalTab.waitForLoadState();
        await expect(renewalTab.url()).toContain(`${feature.data.renewNowURL}`);
      });

      await test.step('Logout', async () => {
        await profileDropdownPage.getLogoutByText('Sign Out').click();
        const pages = await page.context().pages();
        await page.waitForLoadState();
        await expect(pages[0].url())
          .toContain(feature.data.targetAfterLogout);
      });
    });
  });

  test(`${features[3].name},${features[3].tags}`, async ({ page }) => {
    test.slow();
    const { data, path } = features[3];
    await test.step('Go to the home page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      await profileDropdownPage.signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    await test.step('Verify profile dropdown after successful login', async () => {
      await profileDropdownPage.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
      await profileDropdownPage.profileIconButton.click();

      await profileDropdownPage.clickOnBodyOutside();
      await expect(profileDropdownPage.profileMenu).toBeHidden();

      await profileDropdownPage.profileIconButton.click();
      const profileImage = await profileDropdownPage.profileImage;
      await expect(profileImage).toBeVisible();
      const profileName = await profileDropdownPage.profileName.textContent();
      await expect(profileName).toBe(data.profileName);
      const profileEmail = await profileDropdownPage.profileEmail.textContent();
      await expect(profileEmail).toBe(data.profileEmail);
      const primaryContact = await profileDropdownPage.primaryContact;
      await expect(primaryContact).toBeVisible();
      const profilePartnerLevel = await profileDropdownPage.profilePartnerLevel.textContent();
      await expect(profilePartnerLevel).toBe(data.profilePartnerLevel);
    });

    await test.step('Verify edit profile link', async () => {
      const [editProfileTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.editProfileButton.click(),
      ]);
      await editProfileTab.waitForLoadState();
      await expect(editProfileTab.url()).toContain(`${data.editProfileURL}`);
      await editProfileTab.close();
    });

    await test.step('Verify account management link', async () => {
      const [accountManagementTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.getAccountManagementByText('打开账户管理').click(),
      ]);
      await accountManagementTab.waitForLoadState();
      await expect(accountManagementTab.url()).toContain(`${data.accountManagementURL}`);
      await accountManagementTab.close();
    });

    await test.step('Logout', async () => {
      await profileDropdownPage.getLogoutByText('注销').click();
      const pages = await page.context().pages();
      await page.waitForLoadState();
      await expect(pages[0].url())
        .toContain(data.targetAfterLogout);
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page }) => {
    test.slow();
    const { data, path } = features[4];
    await test.step('Go to the home page', async () => {
      await page.goto(`${path}`);
      await page.waitForLoadState('domcontentloaded');
      await profileDropdownPage.signInButton.click();
    });

    await test.step('Sign in', async () => {
      await signInPage.signIn(page, `${data.partnerLevel}`);
    });

    await test.step('Verify profile dropdown after successful login', async () => {
      await profileDropdownPage.verifyProfileDropdownAfterLogin(data);
    });

    await test.step('Verify edit profile link', async () => {
      const [editProfileTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.editProfileButton.click(),
      ]);
      await editProfileTab.waitForLoadState();
      await expect(editProfileTab.url()).toContain(`${data.editProfileURL}`);
    });

    await test.step('Verify account management link', async () => {
      const [accountManagementTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.getAccountManagementByText('Open account management').click(),
      ]);
      await accountManagementTab.waitForLoadState();
      await expect(accountManagementTab.url()).toContain(`${data.accountManagementURL}`);
    });

    await test.step('Verify sales center link', async () => {
      const [salesCenterTab] = await Promise.all([
        page.context().waitForEvent('page'),
        await profileDropdownPage.salesCenterButton.click(),
      ]);
      await salesCenterTab.waitForLoadState();
      const urlRegex = new RegExp(`.*${data.salesCenterURL}.*`);
      await salesCenterTab.waitForURL(urlRegex, { timeout: 20000 });
      await expect(salesCenterTab.url()).toContain(`${data.salesCenterURL}`);
    });

    await test.step('Logout', async () => {
      await profileDropdownPage.getLogoutByText('Sign Out').click();
      const pages = await page.context().pages();
      await page.waitForLoadState();
      await expect(pages[0].url())
        .toContain(data.targetAfterLogout);
    });
  });
});

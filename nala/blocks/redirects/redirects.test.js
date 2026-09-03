import { expect, test } from '@playwright/test';
import RedirectsPage from './redirects.page.js';
import Redirects from './redirects.spec.js';
import SignInPage from '../signin/signin.page.js';

let redirectsPage;
let signInPage;

const { features } = Redirects;
const redirects = features.slice(0, 3);

test.describe('Validate redirects flow', () => {
  test.beforeEach(async ({ page, baseURL, browserName, context }) => {
    redirectsPage = new RedirectsPage(page);
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

  redirects.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, baseURL, context }) => {
      const { data, path } = feature;
      await test.step('Go to the redirects page', async () => {
        await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      });

      await test.step('Verify CBC Enablement Link', async () => {
        const cbcEnablementLink = await redirectsPage.getLinkByText(data.cbcEnablementLabel).first();
        const href = await cbcEnablementLink.getAttribute('href');

        expect(href).toContain(data.cbcEnablementLink);
        await expect(cbcEnablementLink).toHaveAttribute('target', '_blank');
      });

      await test.step('Set partner_data cookie', async () => {
        await signInPage.addCookie(
          data.partnerData,
          `${baseURL}${path}`,
          context,
        );
        await page.reload({ waitUntil: 'networkidle' });
      });

      await test.step('Verify CBC Enablment Link with signed in user', async () => {
        const cbcEnablementLink = await redirectsPage.getLinkByText(data.cbcEnablementLabel).first();
        const href = await cbcEnablementLink.getAttribute('href');

        expect(href).toContain(data.cbcEnablementLinkSignInUser);
        await expect(cbcEnablementLink).toHaveAttribute('target', '_blank');
      });

      await test.step('Verify helpx.adobe.com link', async () => {
        const helpXAdobeLink = redirectsPage.getLinkByText('helpx.adobe.com').first();
        const href = await helpXAdobeLink.getAttribute('href');

        expect(href).toContain(data.helpXAdobeLink);
        await expect(helpXAdobeLink).toHaveAttribute('target', '_blank');
      });

      await test.step('Verify Access Sales Center link from the GNav', async () => {
        const salesGnavLink = await redirectsPage.getButtonElement('Sales');
        await salesGnavLink.click();

        const salesCenterLinkEl = await redirectsPage.getLinkByText('Access Sales Center');
        const href = await salesCenterLinkEl.getAttribute('href');

        expect(href).toContain(data.salesCenterLink);
        await expect(salesCenterLinkEl).toHaveAttribute('target', '_blank');
      });

      await test.step('Verify adobe.com link from the GNav', async () => {
        const adobeGnavLinkEl = await redirectsPage.getButtonElement('Adobe link');
        await adobeGnavLinkEl.click();

        const adobeLinkEl = await redirectsPage.adobeGnavLink;
        const href = await adobeLinkEl.getAttribute('href');

        expect(href).toContain(data.adobeLink);
        await expect(adobeLinkEl).toHaveAttribute('target', '_blank');
      });

      await test.step('Verify business.adobe.com link from the GNav', async () => {
        const businessAdobeGnavLink = await redirectsPage.getButtonElement('Business link');
        await businessAdobeGnavLink.click();

        const businessAdobeLinkEl = await redirectsPage.getLinkByText('business.adobe.com').first();
        const href = await businessAdobeLinkEl.getAttribute('href');

        expect(href).toContain(data.businessAdobeLink);
        await expect(businessAdobeLinkEl).toHaveAttribute('target', '_blank');
      });
    });
  });
});

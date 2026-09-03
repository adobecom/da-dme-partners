import { test, expect } from '@playwright/test';
import AnnouncementsPreviewPage from './announcements-preview.page.js';
import AnnouncementsPreview from './announcements-preview.spec.js';
import SignInPage from '../signin/signin.page.js';

let announcementsPreviewPage;
let signInPage;

const { features } = AnnouncementsPreview;
const partnerLevelBasedPreviews = features.slice(0, 5);

test.describe('Validate announcements preview block', () => {
  test.beforeEach(async ({ page, baseURL, browserName, context }) => {
    announcementsPreviewPage = new AnnouncementsPreviewPage(page);
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

  async function handleEvent(page) {
    if (!page.url().includes('partners.stage.adobe.com')) {
      await page.evaluate(() => {
        if (document.querySelector('.card-title')) {
          window.cardsLoaded = true;
        } else {
          document.addEventListener('partner-cards-loaded', () => {
            window.cardsLoaded = true;
          });
        }
      });
      try {
        await page.waitForFunction(() => window.cardsLoaded);
      } catch {
        console.log('catch block');
      }
    }
  }

  partnerLevelBasedPreviews.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, context, baseURL }) => {
      test.slow();
      await test.step('Go to public page', async () => {
        await page.goto(`${baseURL}${feature.path}`);
        await page.waitForLoadState('load');
      });

      await test.step('Set partner_data cookie', async () => {
        await signInPage.addCookie(
          feature.data.partnerData,
          `${baseURL}${feature.path}`,
          context,
        );
        await page.reload();
        await handleEvent(page);
      });

      const announcements = await announcementsPreviewPage.announcements;
      const announcementsCount = await announcements.count();

      if (announcementsCount > 0) {
        await test.step('Verify preview announcements are loaded', async () => {
          const announcementsPreview = await announcementsPreviewPage.announcementsPreview;
          await expect(announcementsPreview).toBeVisible();
          await expect(announcementsCount).toBeLessThanOrEqual(3);
        });

        await test.step('Verify order of the latest announcements in the preview', async () => {
          const previewAnnouncementLinks = await announcements.evaluateAll((anchorTags, rootPath) => anchorTags
            .map(({ href }) => href.substring(href.indexOf(rootPath))), feature.data.rootPath);

          const viewAllAnnouncementsButton = await announcementsPreviewPage.viewAllAnnouncementsButton;
          await viewAllAnnouncementsButton.click();
          await announcementsPreviewPage.cards.nth(0).waitFor({ state: 'visible', timeout: 5000 });

          const selectedSortText = await announcementsPreviewPage.selectedSortText;
          const selectedOption = await selectedSortText.textContent();
          if (selectedOption !== feature.data.selectedSortNewest) {
            await announcementsPreviewPage.sortBtn.click();
            await announcementsPreviewPage.newestOption.click();
          }
          await announcementsPreviewPage.loadMore.click();

          const latestCards = await announcementsPreviewPage.cards.evaluateAll((cards, count) => cards.slice(0, count)
            .map(
              (card) => {
                const { href } = card.querySelector('.card-footer .card-btn');
                return href.substring(href.indexOf('/channelpartners/'));
              },
            ), announcementsCount);

          previewAnnouncementLinks.forEach((link, index) => {
            expect(link).toBe(latestCards[index]);
          });
        });
      }
    });
  });
});

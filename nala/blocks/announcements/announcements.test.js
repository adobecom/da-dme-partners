import { test, expect } from '@playwright/test';
import AnnouncementsPage from './announcements.page.js';
import SignInPage from '../signin/signin.page.js';
import Announcements from './announcements.spec.js';

let announcementsPage;
let singInPage;

const { features } = Announcements;
const partnerLevelCases = features.slice(6, 10);

test.describe('Validate announcements block', () => {
  test.beforeEach(async ({ page, browserName, baseURL, context }) => {
    announcementsPage = new AnnouncementsPage(page);
    singInPage = new SignInPage(page);
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
    const { data } = features[0];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[0].path}`, { waitUntil: 'domcontentloaded' });
      console.log(baseURL, features[0].path);
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Enter Automation regression announcements card worldwide no1 in search field', async () => {
      await announcementsPage.searchField.fill(data.firstCardTitle);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingTitleCards}\\s`));
    });

    await test.step('Clear search field on X', async () => {
      await announcementsPage.clearSearchSelector.click();
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Enter Automation regression announcements card worldwide no2 in search field', async () => {
      await announcementsPage.searchField.fill(data.secondCardTitle);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingTitleCards}\\s`));
    });

    await test.step('Clear all', async () => {
      await announcementsPage.clearAllSelector.click();
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Enter Automation regression in search field', async () => {
      await announcementsPage.searchField.fill(data.searchCards);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingDescCards}\\s`));
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[1].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Select Oldest sort option', async () => {
      await announcementsPage.searchField.fill(data.searchCards);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingDescCards}\\s`));
      await announcementsPage.sortBtn.click();
      await announcementsPage.oldestOption.click();
      const paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.firstLoadResult);
    });

    await test.step('Load more cards', async () => {
      await announcementsPage.loadMore.click();
      let paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.secondLoadResult);
      await announcementsPage.loadMore.click();
      paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.thirdLoadResult);
      await expect(await announcementsPage.loadMore).not.toBeVisible();
      const firstCardDate = new Date(await announcementsPage.firstCardDate.textContent()).getTime();
      const lastCardDate = new Date(await announcementsPage.lastCardDate.textContent()).getTime();
      await expect(firstCardDate).toBeLessThan(lastCardDate);
      await expect(announcementsPage.cardCount).toHaveCount(data.numberOfMatchingDescCards);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[2].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
      await announcementsPage.searchField.fill(data.searchCards);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingDescCards}\\s`));
    });

    await test.step('Verify pagination buttons', async () => {
      let paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.firstPageResult);
      const paginationPrevButton = await announcementsPage.paginationPrevButton;
      await expect(paginationPrevButton).toHaveClass(/disabled/);
      const paginationNextButton = await announcementsPage.paginationNextButton;
      await expect(paginationNextButton).not.toHaveClass(/disabled/);
      await expect(announcementsPage.pageCount).toHaveCount(data.totalPageCount);
      await announcementsPage.clickPageNumButton(data.pageButtonNumber);
      paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.secondPageResult);
      await expect(paginationPrevButton).not.toHaveClass(/disabled/);
      await expect(paginationNextButton).not.toHaveClass(/disabled/);
      await paginationNextButton.click();
      paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.thirdPageResult);
      await expect(paginationPrevButton).not.toHaveClass(/disabled/);
      await expect(paginationNextButton).toHaveClass(/disabled/);
    });
  });

  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[3].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Test audience filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterAudience);
      await announcementsPage.clickFilterOptions(data.filterSales);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithSales}\\s`));
      await announcementsPage.clickFilterOptions(data.filterPracticeLead);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithSalesAndPracticeLead}\\s`));
      await announcementsPage.clearFilter(data.filterAudience, data.numberOfAudienceFiltersSelected);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Test marketing filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterMarketing);
      await announcementsPage.clickFilterOptions(data.filterAdvertising);
      await announcementsPage.clickFilterOptions(data.filterSolutions);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithAdvertisingAndSolutions}\\s`));
      await announcementsPage.clickFilterOptions(data.filterSolutions);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithAdvertising}\\s`));
      await announcementsPage.clearSideBarFilterButton(data.filterAdvertising);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Test different filter combinations', async () => {
      await announcementsPage.clickFilterOptions(data.filterProduct);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithProduct}\\s`));
      await announcementsPage.clickFilterOptions(data.filterSales);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithSales}\\s`));
      await announcementsPage.clearAllSelector.click();
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Test date filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterDate);
      await announcementsPage.clickDateFilterOptions(data.filterLastNinetyDays);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithLastNinetyDays}\\s`));
      const firstCardTitle = await announcementsPage.firstCardTitle.textContent();
      await expect(firstCardTitle).toBe(data.titleOfDateFilteredCard);
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[4].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await announcementsPage.searchField.fill(data.searchCardTitle);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfMatchingTitleCards}\\s`));
    });

    await test.step('Read now', async () => {
      await announcementsPage.readCard.click();
      const pages = await page.context().pages();
      await expect(pages[0].url())
        .toContain(data.expectedToSeeInURL);
    });
  });

  test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[5].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.numberOfPublicCards}\\s`));
    });

    await test.step('Edge cases search bar', async () => {
      await announcementsPage.searchField.fill(data.specialCharsTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithSpecialChars}\\s`));
      await announcementsPage.searchField.fill(data.dateInPastTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithDateInPast}\\s`));
      await announcementsPage.searchField.fill(data.eventEndedTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithEventEnded}\\s`));
      await announcementsPage.searchField.fill(data.tooLongTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithTooLongTitle}\\s`));
      await announcementsPage.searchField.fill(data.noCollectionTagTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithoutCollectionTag}\\s`));
      await announcementsPage.clearAllSelector.click();
      const firstCardTitle = await announcementsPage.firstCardTitle;
      await expect(firstCardTitle).toContainText(data.defaultCardTitle);
      await announcementsPage.searchField.fill(data.noTitleSearch);
      await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${data.cardsWithoutTitle}\\s`));
    });
  });

  partnerLevelCases.forEach((feature) => {
    test(`${feature.name},${feature.tags}`, async ({ page, context, baseURL }) => {
      await test.step('Go to Announcements page', async () => {
        await page.goto(`${baseURL}${feature.path}`, { waitUntil: 'domcontentloaded' });
      });

      await test.step('Set partner_data cookie', async () => {
        await singInPage.addCookie(
          feature.data.partnerData,
          `${baseURL}${feature.path}`,
          context,
        );
        await page.reload({ waitUntil: 'domcontentloaded' });
        await announcementsPage.announcemntCollection.waitFor({ state: 'visible' });
      });

      await test.step(`Verify card titled ${feature.data.partnerLevelCardTitle} is present on page`, async () => {
        await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${feature.data.totalNumberOfCards}\\s`));
        await announcementsPage.searchField.fill(`${feature.data.partnerLevelCardTitle}`);
        await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${feature.data.numberOfPartnerLevelCards}\\s`));
      });

      await test.step(`Verify card titled ${feature.data.higherPartnerLevelCardTitle} is not present on page`, async () => {
        await announcementsPage.searchField.fill(`${feature.data.higherPartnerLevelCardTitle}`);
        await expect(announcementsPage.resultNumber).toHaveText(new RegExp(`^${feature.data.numberOfHigherPartnerLevelCards}\\s`));
      });
    });
  });
});

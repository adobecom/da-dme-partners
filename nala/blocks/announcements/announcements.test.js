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
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Enter Automation regression announcements card worldwide no1 in search field', async () => {
      await announcementsPage.searchField.fill(data.firstCardTitle);
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingTitleCards);
    });

    await test.step('Clear search field on X', async () => {
      await announcementsPage.clearSearchSelector.click();
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Enter Automation regression announcements card worldwide no2 in search field', async () => {
      await announcementsPage.searchField.fill(data.secondCardTitle);
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingTitleCards);
    });

    await test.step('Clear all', async () => {
      await announcementsPage.clearAllSelector.click();
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Enter Automation regression in search field', async () => {
      await announcementsPage.searchField.fill(data.searchCards);
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingDescCards);
    });
  });

  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[1].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Select Oldest sort option', async () => {
      await announcementsPage.searchField.fill(data.searchCards);
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfMatchingDescCards);
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
      await expect(await announcementsPage.cardCount.count()).toBe(data.numberOfMatchingDescCards);
    });
  });

  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[2].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
      await announcementsPage.searchField.fill(data.searchCards);
      const filteredCards = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(filteredCards.split(' ')[0], 10)).toBe(data.numberOfMatchingDescCards);
    });

    await test.step('Verify pagination buttons', async () => {
      let paginationText = await announcementsPage.paginationText.textContent();
      await expect(paginationText.toLowerCase()).toBe(data.firstPageResult);
      const paginationPrevButton = await announcementsPage.paginationPrevButton;
      await expect(paginationPrevButton).toHaveClass(/disabled/);
      const paginationNextButton = await announcementsPage.paginationNextButton;
      await expect(paginationNextButton).not.toHaveClass(/disabled/);
      await expect(await announcementsPage.pageCount.count()).toBe(data.totalPageCount);
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
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Test audience filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterAudience);
      await announcementsPage.clickFilterOptions(data.filterSales);
      const resultAfterSalesFilterApplied = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterSalesFilterApplied.split(' ')[0], 10)).toBe(data.cardsWithSales);
      await announcementsPage.clickFilterOptions(data.filterPracticeLead);
      const resultAfterPracticeLeadFilterApplied = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterPracticeLeadFilterApplied.split(' ')[0], 10)).toBe(data.cardsWithSalesAndPracticeLead);
      await announcementsPage.clearFilter(data.filterAudience, data.numberOfAudienceFiltersSelected);
      const resultAfterClearingAudienceFilter = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterClearingAudienceFilter.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Test marketing filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterMarketing);
      await announcementsPage.clickFilterOptions(data.filterAdvertising);
      await announcementsPage.clickFilterOptions(data.filterSolutions);
      const resultAfterMarketingFilter = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterMarketingFilter.split(' ')[0], 10)).toBe(data.cardsWithAdvertisingAndSolutions);
      await announcementsPage.clickFilterOptions(data.filterSolutions);
      const resultAfterClearingFilter = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterClearingFilter.split(' ')[0], 10)).toBe(data.cardsWithAdvertising);
      await announcementsPage.clearSideBarFilterButton(data.filterAdvertising);
      const resultAfterClearingAllFilters = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterClearingAllFilters.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Test different filter combinations', async () => {
      await announcementsPage.clickFilterOptions(data.filterProduct);
      const resultAfterProductFilter = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterProductFilter.split(' ')[0], 10)).toBe(data.cardsWithProduct);
      await announcementsPage.clickFilterOptions(data.filterSales);
      const resultAfterSalesFilters = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterSalesFilters.split(' ')[0], 10)).toBe(data.cardsWithSales);
      await announcementsPage.clearAllSelector.click();
      const resultAfterClearingAllFilters = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterClearingAllFilters.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Test date filter', async () => {
      await announcementsPage.expandFilterOptions(data.filterDate);
      await announcementsPage.clickDateFilterOptions(data.filterLastNinetyDays);
      const resultAfterDateFilter = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterDateFilter.split(' ')[0], 10)).toBe(data.cardsWithLastNinetyDays);
      const firstCardTitle = await announcementsPage.firstCardTitle.textContent();
      await expect(firstCardTitle).toBe(data.titleOfDateFilteredCard);
    });
  });

  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    await test.step('Go to Announcements page', async () => {
      await page.goto(`${baseURL}${features[4].path}`, { waitUntil: 'domcontentloaded' });
      await announcementsPage.learnMoreButton.waitFor({ state: 'visible' });
      await announcementsPage.searchField.fill(data.searchCardTitle);
      const resultAfterSearch = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultAfterSearch.split(' ')[0], 10)).toBe(data.numberOfMatchingTitleCards);
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
      const result = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(result.split(' ')[0], 10)).toBe(data.numberOfPublicCards);
    });

    await test.step('Edge cases search bar', async () => {
      await announcementsPage.searchField.fill(data.specialCharsTitleSearch);
      const resultSpecialCharsCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultSpecialCharsCard.split(' ')[0], 10)).toBe(data.cardsWithSpecialChars);
      await announcementsPage.searchField.fill(data.dateInPastTitleSearch);
      const resultDateInPastCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultDateInPastCard.split(' ')[0], 10)).toBe(data.cardsWithDateInPast);
      await announcementsPage.searchField.fill(data.eventEndedTitleSearch);
      const resultEventEndedCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultEventEndedCard.split(' ')[0], 10)).toBe(data.cardsWithEventEnded);
      await announcementsPage.searchField.fill(data.tooLongTitleSearch);
      const resultWorldwideLongTitleCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultWorldwideLongTitleCard.split(' ')[0], 10)).toBe(data.cardsWithTooLongTitle);
      await announcementsPage.searchField.fill(data.noCollectionTagTitleSearch);
      const resultWithoutCollectionTagCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultWithoutCollectionTagCard.split(' ')[0], 10)).toBe(data.cardsWithoutCollectionTag);
      await announcementsPage.clearAllSelector.click();
      const firstCardTitle = await announcementsPage.firstCardTitle;
      await expect(firstCardTitle).toContainText(data.defaultCardTitle);
      await announcementsPage.searchField.fill(data.noTitleSearch);
      const resultWithoutTitleCard = await announcementsPage.resultNumber.textContent();
      await expect(parseInt(resultWithoutTitleCard.split(' ')[0], 10)).toBe(data.cardsWithoutTitle);
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
      });

      await test.step(`Verify card titled ${feature.data.partnerLevelCardTitle} is present on page`, async () => {
        const resultTotal = await announcementsPage.resultNumber.textContent();
        await expect(parseInt(resultTotal.split(' ')[0], 10)).toBe(feature.data.totalNumberOfCards);
        await announcementsPage.searchField.fill(`${feature.data.partnerLevelCardTitle}`);
        const resultSearch = await announcementsPage.resultNumber.textContent();
        await expect(parseInt(resultSearch.split(' ')[0], 10)).toBe(feature.data.numberOfPartnerLevelCards);
      });

      await test.step(`Verify card titled ${feature.data.higherPartnerLevelCardTitle} is not present on page`, async () => {
        await announcementsPage.searchField.fill(`${feature.data.higherPartnerLevelCardTitle}`);
        const resultSearch = await announcementsPage.resultNumber.textContent();
        await expect(parseInt(resultSearch.split(' ')[0], 10)).toBe(feature.data.numberOfHigherPartnerLevelCards);
      });
    });
  });
});

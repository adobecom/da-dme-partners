import { test, expect } from '@playwright/test';
import PrpCollectionPage from './card-collections.page.js';
import SignInPage from '../signin/signin.page.js';
import prpCollection from './card-collections.spec.js';

let prpCollectionPage;
let signInPrpCollectionPage;

const { features } = prpCollection;
const specilizations = features.slice(0, 4);

test.describe('PRP Collection validation', () => {
  test.beforeEach(async ({ page }) => {
    prpCollectionPage = new PrpCollectionPage(page);
    signInPrpCollectionPage = new SignInPage(page);
  });

  specilizations.forEach((feature) => {
    test(`${feature.name}, ${feature.tags}`, async ({ page }) => {
      const { data } = feature;

      await test.step('Go to page and sign in with user', async () => {
        await page.goto(`${feature.path}`);
        await page.waitForLoadState('domcontentloaded');
        await prpCollectionPage.signInButton.click();
        await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
        await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
        await prpCollectionPage.cardWrapper.waitFor({ state: 'visible', timeout: 20000 });
      });

      await test.step(`Verify "${data.title}" card is present on the page`, async () => {
        await expect(prpCollectionPage.card(data.title)).toBeVisible();
      });

      await test.step('Go to search page', async () => {
        await page.goto(`${data.goTo}`);
        await page.waitForLoadState('domcontentloaded');
        await prpCollectionPage.cardWrapper.waitFor({ state: 'visible', timeout: 20000 });
      });

      await test.step(`Verify "${data.title}" card is present on the search page`, async () => {
        await expect(prpCollectionPage.card(data.title)).toBeVisible();
      });
    });
  });
  test(`${features[4].name}, ${features[4].tags}`, async ({ page }) => {
    const { data } = features[4];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[4].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify all cards are present on the page', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
      await expect(prpCollectionPage.prpCollectionTitle).toHaveText(data.collectionTitle);
    });
    await test.step('Verify all texts are present on the page', async () => {
      await expect(prpCollectionPage.textOnPage(data.text1)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text2)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text3)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text4)).toBeVisible();
    });
    await test.step('Click on Back to collections button', async () => {
      await prpCollectionPage.backToCollectionBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.url()).toContain(data.expectedURL);
    });
  });
  test(`${features[5].name}, ${features[5].tags}`, async ({ page }) => {
    const { data } = features[5];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[5].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify card present on the page', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.title1)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.date)).toBeVisible();
      await expect(prpCollectionPage.cardFormat(data.format)).toBeVisible();
      await expect(prpCollectionPage.cardTag(data.tag)).toBeVisible();
      await expect(prpCollectionPage.cardDownloadBtn(data.downloadBtn)).toBeVisible();
    });
  });
  test(`${features[6].name}, ${features[6].tags}`, async ({ page }) => {
    const { data } = features[6];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[6].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });
    await test.step('Verify filtering and sorting is working on page', async () => {
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
      await expect(prpCollectionPage.card(data.card3)).toBeVisible();
      await expect(prpCollectionPage.card(data.card4)).toBeVisible();
    });
    await test.step('Verify filtering and sorting is working on page', async () => {
      const numberOfCards1 = await prpCollectionPage.numberOfCards();
      await prpCollectionPage.getFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.getFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      const numberOfCards2 = await prpCollectionPage.numberOfCards();
      expect(numberOfCards2).toBeLessThan(numberOfCards1);
    });
    await test.step('Verify sorting is working on page', async () => {
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      const titleOfFirstCardBeforeSorting = await prpCollectionPage.firstCardTitle();
      await prpCollectionPage.sortingOption(data.sortOldest);
      const titleOfFirstCardAfterSorting = await prpCollectionPage.firstCardTitle();
      expect(titleOfFirstCardAfterSorting).not.toEqual(titleOfFirstCardBeforeSorting);
    });
    await test.step('Verify clear all', async () => {
      const numberOfCards = await prpCollectionPage.numberOfCards();
      await prpCollectionPage.clearAll.click();
      await page.waitForLoadState('domcontentloaded');
      const numberOfCardsAfterClearing = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsAfterClearing).toBeGreaterThan(numberOfCards);
    });
  });
  test(`${features[7].name}, ${features[7].tags}`, async ({ page }) => {
    const { data } = features[7];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[7].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify card present on the page', async () => {
      await prpCollectionPage.getFilter(data.filter1).click();
      const selectedFilters = await prpCollectionPage.getSelectedFilterLabels();
      const cardTags = await prpCollectionPage.getCardTags(0);
      selectedFilters.forEach((filter) => {
        expect(cardTags).toContain(filter);
      });
    });
  });
  test(`${features[8].name}, ${features[8].tags}`, async ({ page }) => {
    const { data } = features[8];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[8].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify card present on the page', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });
    await test.step('Check cards on search page', async () => {
      await page.goto(`${data.searchPageUrl}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });
    await test.step('Check card details on search page', async () => {
      const cardDate = await prpCollectionPage.getSearchCardDate(data.title1);
      expect(cardDate).toEqual(data.searchCardDate);
      const cardSize = await prpCollectionPage.getSearchCardSize(data.title1);
      expect(cardSize).toEqual(data.searchCardSize);
    });
  });
  test(`${features[9].name}, ${features[9].tags}`, async ({ page }) => {
    const { data } = features[9];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[9].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Check card', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      const cardTags = await prpCollectionPage.getCardTags(0);
      expect(cardTags).not.toContain(data.tag);
    });
  });
  test(`${features[10].name}, ${features[10].tags}`, async ({ page }) => {
    const { data } = features[10];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[10].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Check card', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      const cardTags = await prpCollectionPage.getCardTags(0);
      data.tag.forEach((tag) => {
        expect(cardTags).toContain(tag);
      });
      await expect(prpCollectionPage.downloadBtnJp).toBeVisible();
    });
  });
  test(`${features[11].name}, ${features[11].tags}`, async ({ page }) => {
    const { data } = features[11];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[11].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Check card', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();

      await page.reload();
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
    });
  });
  test(`${features[12].name}, ${features[12].tags}`, async ({ page }) => {
    const { data } = features[12];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[12].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search card collections', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const cardNumber = await prpCollectionPage.numberOfCards();
      expect(cardNumber).toBe(4);
      await prpCollectionPage.loadMoreBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });

      await page.reload();
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      await expect(prpCollectionPage.loadMoreBtn).toBeVisible();
    });
    await test.step('Sort card collections', async () => {
      const titleOfFirstCardBeforeSorting = await prpCollectionPage.firstCardTitle();
      await prpCollectionPage.sortingOption(data.sortOption);
      const titleOfFirstCardAfterSorting = await prpCollectionPage.firstCardTitle();
      expect(titleOfFirstCardAfterSorting).not.toEqual(titleOfFirstCardBeforeSorting);
    });
    await test.step('Open Collection', async () => {
      await prpCollectionPage.getCardTitle(data.title1).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.url()).toContain(data.expectedURL);
    });
  });
  test(`${features[13].name}, ${features[13].tags}`, async ({ page }) => {
    const { data } = features[13];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[13].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });
    await test.step('Search card collections', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
    });
    await test.step('Filter page', async () => {
      await prpCollectionPage.getFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      const numberOfCardsAcrobat = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsAcrobat).toBe(2);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();

      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      const numberOfCardsConnect = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsConnect).toBe(3);

      await prpCollectionPage.getFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      const numberOfCardsOnboarding = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsOnboarding).toBe(1);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();

      await prpCollectionPage.getCheckBox(data.checkbox4).click();
      const numberOfCardsProgrammeGuide = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsProgrammeGuide).toBe(2);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
    });
  });
  test(`${features[14].name}, ${features[14].tags}`, async ({ page }) => {
    const { data } = features[14];

    await test.step('Go to page and sign in with user', async () => {
      await page.goto(`${features[14].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search and verify 3 cards are present', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
    });

    await test.step('Filter by Produkt - Adobe Substance 3D', async () => {
      await prpCollectionPage.getFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.filterSelectedCount(data.filter1)).toHaveText('1');
    });

    await test.step('Additionally filter by Produkt - Adobe Captivate', async () => {
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
      await expect(prpCollectionPage.filterSelectedCount(data.filter1)).toHaveText('2');
    });

    await test.step('Filter by Thema - Partnerverzeichnis/Distributorverzeichnis (no results)', async () => {
      await prpCollectionPage.getFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      await expect(prpCollectionPage.noResultsTitle).toBeVisible();
      await expect(prpCollectionPage.noResultsTitle).toHaveText(data.noResultsTitle);
      await expect(prpCollectionPage.filterSelectedCount(data.filter2)).toHaveText('1');
    });

    await test.step('Switch Thema filter to Angebote', async () => {
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      await prpCollectionPage.getCheckBox(data.checkBox4).click();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.filterSelectedCount(data.filter2)).toHaveText('1');
    });

    await test.step('Additionally filter by Thema - Erwerb', async () => {
      await prpCollectionPage.getCheckBox(data.checkBox5).click();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
      await expect(prpCollectionPage.filterSelectedCount(data.filter2)).toHaveText('2');
    });

    await test.step('Click Alles löschen and verify all filters are cleared', async () => {
      await prpCollectionPage.clearAllDe.click();
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCardsAfterClearing = await prpCollectionPage.numberOfCards();
      expect(numberOfCardsAfterClearing).toBeGreaterThan(3);
      await expect(prpCollectionPage.searchField).toHaveValue('');
      const url = page.url();
      expect(url).not.toContain('filters=yes');
      expect(url).not.toContain('term=');
    });
  });
  test(`${features[15].name}, ${features[15].tags}`, async ({ page }) => {
    const { data } = features[15];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[15].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify all cards and collection title are present', async () => {
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
      await expect(prpCollectionPage.prpCollectionTitle).toHaveText(data.collectionTitle);
    });

    await test.step('Verify all texts are present on the page', async () => {
      await expect(prpCollectionPage.textOnPage(data.text1)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text2)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text3)).toBeVisible();
      await expect(prpCollectionPage.textOnPage(data.text4)).toBeVisible();
    });

    await test.step('Click on Volver a colecciones button', async () => {
      await prpCollectionPage.backToCollectionBtnEs.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.url()).toContain(data.expectedURL);
    });
  });
  test(`${features[16].name}, ${features[16].tags}`, async ({ page }) => {
    const { data } = features[16];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[16].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify initial 2 cards are present', async () => {
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });

    await test.step('Filter by Language - Spanish (Latin America) and Type', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });

    await test.step('Additionally filter by Language - English Universal (EU)', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox4).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
      await expect(prpCollectionPage.card(data.card1)).not.toBeVisible();
    });

    await test.step('Uncheck Type filters and verify 2 cards are present', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });

    await test.step('Verify Open button on PRP Latam MP4 opens in a new tab', async () => {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        prpCollectionPage.cardOpenBtn(data.card2).click(),
      ]);
      await newPage.waitForLoadState();
      await expect(newPage.url()).toContain(data.openBtnUrl);
    });
  });
  test(`${features[17].name}, ${features[17].tags}`, async ({ page }) => {
    const { data } = features[17];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[17].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify 2 cards are present', async () => {
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });

    await test.step('Verify Open button on PRP Latam NA PNG opens in a new tab', async () => {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        prpCollectionPage.cardOpenBtn(data.card2).click(),
      ]);
      await newPage.waitForLoadState();
      await expect(newPage.url()).toContain(data.openBtnUrl);
      await newPage.close();
    });

    await test.step('Sort by Oldest and verify order changes', async () => {
      const titleOfFirstCardBeforeSorting = await prpCollectionPage.firstCardTitle();
      await prpCollectionPage.sortingOption(data.sortOldest);
      const titleOfFirstCardAfterSorting = await prpCollectionPage.firstCardTitle();
      expect(titleOfFirstCardAfterSorting).not.toEqual(titleOfFirstCardBeforeSorting);
    });

    await test.step('Sort by Newest and verify previous order is restored', async () => {
      const titleOfFirstCardBeforeSorting = await prpCollectionPage.firstCardTitle();
      await prpCollectionPage.sortingOption(data.sortNewest);
      const titleOfFirstCardAfterSorting = await prpCollectionPage.firstCardTitle();
      expect(titleOfFirstCardAfterSorting).not.toEqual(titleOfFirstCardBeforeSorting);
    });

    await test.step('Filter by Language - Spanish (Latin America) and Type - Sales Guide (no results)', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.noResultsTitle).toBeVisible();
      await expect(prpCollectionPage.noResultsTitle).toHaveText(data.noResultsTitle);
    });

    await test.step('Clear Type filter and apply', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.clearMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
    });

    await test.step('Close Spanish (Latin America) filter and verify 2 cards are present', async () => {
      await prpCollectionPage.closeFilterChipMobile(data.checkBox1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });
  });
  test(`${features[18].name}, ${features[18].tags}`, async ({ page }) => {
    const { data } = features[18];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[18].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify 2 cards are present', async () => {
      await expect(prpCollectionPage.card(data.card1)).toBeVisible();
      await expect(prpCollectionPage.card(data.card2)).toBeVisible();
    });

    await test.step('Verify both cards have thumbnails, dates and tags', async () => {
      await expect(prpCollectionPage.cardThumbnail(data.card1)).toBeVisible();
      await expect(prpCollectionPage.cardThumbnail(data.card2)).toBeVisible();
      await expect(prpCollectionPage.cardDate(data.card1)).toBeVisible();
      await expect(prpCollectionPage.cardDate(data.card2)).toBeVisible();
      await expect(prpCollectionPage.cardDescription(data.card1)).toBeVisible();
      await expect(prpCollectionPage.cardDescription(data.card2)).toBeVisible();
    });

    await test.step('Verify card formats', async () => {
      await expect(prpCollectionPage.cardFormat(data.format1)).toBeVisible();
      await expect(prpCollectionPage.cardFormat(data.format2)).toBeVisible();
    });

    await test.step('Verify Open button on PRP NA PDF opens in a new tab', async () => {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        prpCollectionPage.cardOpenBtn(data.card2).click(),
      ]);
      await newPage.waitForLoadState();
      await expect(newPage.url()).toContain(data.openBtnUrl);
      await newPage.close();
    });
  });
  test(`${features[19].name}, ${features[19].tags}`, async ({ page }) => {
    const { data } = features[19];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[19].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Verify heading is present at the top', async () => {
      await expect(prpCollectionPage.resourcesHeading).toBeVisible();
    });

    await test.step('Search and verify 4 collections found, 2 cards shown', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(4);
      const visibleCards = await prpCollectionPage.visibleCardCount();
      expect(visibleCards).toBe(2);
    });

    await test.step('Click Load more and verify 4 cards are shown', async () => {
      await prpCollectionPage.loadMoreBtn.click();
      await page.waitForLoadState('domcontentloaded');
      const visibleCards = await prpCollectionPage.visibleCardCount();
      expect(visibleCards).toBe(4);
    });

    await test.step('Reload the page and verify 2 cards are shown', async () => {
      await page.reload();
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const visibleCards = await prpCollectionPage.visibleCardCount();
      expect(visibleCards).toBe(2);
    });
  });
  test(`${features[20].name}, ${features[20].tags}`, async ({ page }) => {
    const { data } = features[20];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[20].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search and verify 3 collections found', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
    });

    await test.step('Sort by Oldest and verify expected cards are present', async () => {
      await prpCollectionPage.sortingOption(data.sortOldest);
      await expect(prpCollectionPage.card(data.oldestTitle1)).toBeVisible();
      await expect(prpCollectionPage.card(data.oldestTitle2)).toBeVisible();
    });

    await test.step('Sort by Newest and verify expected cards are present', async () => {
      await prpCollectionPage.sortingOption(data.sortNewest);
      await expect(prpCollectionPage.card(data.newestTitle1)).toBeVisible();
      await expect(prpCollectionPage.card(data.newestTitle2)).toBeVisible();
    });

    await test.step('Click on PRP Collection Automation All Levels and verify it opens in the same tab', async () => {
      await prpCollectionPage.getCardTitle(data.newestTitle1).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.url()).toContain(data.expectedURL);
    });
  });
  test(`${features[21].name}, ${features[21].tags}`, async ({ page }) => {
    const { data } = features[21];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[21].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search and verify 3 cards, thumbnail, language and title', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
      await expect(prpCollectionPage.cardThumbnail(data.title1)).toBeVisible();
      await expect(prpCollectionPage.cardLanguage(data.title1)).toHaveText(data.language);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
    });

    await test.step('Filter by Product - Adobe Captivate', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(1);
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
    });

    await test.step('Additionally filter by Product - Adobe Creative Cloud', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(2);
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });

    await test.step('Additionally filter by Topic - Promotions', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(2);
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });

    await test.step('Uncheck Product - Adobe Captivate', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(1);
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });

    await test.step('Uncheck Product - Adobe Creative Cloud', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(2);
    });

    await test.step('Uncheck Topic - Promotions', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
    });
  });
  test(`${features[22].name}, ${features[22].tags}`, async ({ page }) => {
    const { data } = features[22];

    await test.step('Go to page and sign in with user on mobile', async () => {
      await page.goto(`${features[22].path}`);
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.signInButton.click();
      await signInPrpCollectionPage.signIn(page, `${data.partnerLevel}`);
      await prpCollectionPage.profile.waitFor({ state: 'visible', timeout: 20000 });
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
    });

    await test.step('Search and verify 3 cards are present', async () => {
      await prpCollectionPage.searchField.fill(data.searchKeyword);
      await prpCollectionPage.searchField.press('Enter');
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
      await expect(prpCollectionPage.card(data.title1)).toBeVisible();
      await expect(prpCollectionPage.card(data.title2)).toBeVisible();
    });

    await test.step('Filter by Product - Adobe Express', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox1).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(2);
    });

    await test.step('Additionally filter by Product - Photoshop Elements bundle', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter1).click();
      await prpCollectionPage.getCheckBox(data.checkBox2).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter1).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(3);
    });

    await test.step('Filter by Topic - Incentive (no results)', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox3).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      await expect(prpCollectionPage.noResultsTitle).toBeVisible();
      await expect(prpCollectionPage.noResultsTitle).toHaveText(data.noResultsTitle);
    });

    await test.step('Additionally filter by Topic - Partner Finder/Distributor Finder', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.getMobileFilter(data.filter2).click();
      await prpCollectionPage.getCheckBox(data.checkBox4).click();
      await prpCollectionPage.applyMobileFilterAccordion(data.filter2).click();
      await prpCollectionPage.applyFiltersMobile.click();
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBe(1);
      await expect(prpCollectionPage.card(data.title3)).toBeVisible();
    });

    await test.step('Click Clear All and verify more than 3 cards are present', async () => {
      await prpCollectionPage.filterByBtn.click();
      await prpCollectionPage.clearAllFiltersMobile.click();
      await prpCollectionPage.applyFiltersMobile.click();
      await page.waitForLoadState('domcontentloaded');
      await prpCollectionPage.cardWrapper.nth(0).waitFor({ state: 'visible', timeout: 20000 });
      const numberOfCards = await prpCollectionPage.numberOfCards();
      expect(numberOfCards).toBeGreaterThan(3);
    });
  });
});

import { expect } from '@playwright/test';

export default class SearchTest {
  constructor(page) {
    this.page = page;
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.openPreview = page.getByLabel('Open in', { exact: true });
    this.download = page.getByLabel('Download', { exact: true }).locator('#button');
    this.downloadDisabled = page.locator('.card-btn[aria-label="Download"]');
    this.cardDescription = page.locator('.card-description', { hasText: 'Asset Type: Advertising, Channel Copy, Language: English International (EI), Spanish, Product: Adobe Acrobat, Adobe Connect, Topic: Channel Authorization Letter, Onboarding' });
    this.filterType = page.getByLabel('Type');
    this.filterLanguage = page.getByLabel('Asset language');
    this.filterProduct = page.getByLabel('Product');
    this.filterTopic = page.getByLabel('Topic');
    this.clearAllFilters = page.getByLabel('Clear all');
    this.tabAll = page.getByLabel('All', { exact: true });
    this.nextPage = page.getByLabel('Next Page');
    this.prevPage = page.getByLabel('Previous Page');
    this.page3 = page.getByLabel('Page 3');
    this.searchSpotlight = page.getByLabel('Search', { exact: true });
    this.searchSpotlightFiled = page.getByPlaceholder('Search for topics, resources');
    this.assetTabs = page.getByLabel('Assets');
    this.pagesTab = page.getByLabel('Pages');
    this.openPreviewPages = page.locator('search-card').filter({ hasText: 'Adobe Partner Connection Programme' }).locator('.card-btn').nth(1);
    this.searchCard = page.locator('.search-card');
    this.showMoreLanguage = page.getByRole('link', { name: 'Show more' });
    this.noResultsTitle = page.locator('.no-results-title');
    this.appleydFilter = page.getByLabel('plans & pricing');
  }

  async cardTitle(text) {
    return this.page.getByText(text).nth(0);
  }

  async fileIcon(fileType) {
    return this.page.locator(`div.file-icon[style*="icons/${fileType}.svg"]`);
  }

  async checkBox(checkBox, exact) {
    return this.page.getByRole('checkbox', { name: `${checkBox}`, exact });
  }

  async checkFileIcon(icon) {
    const fileIcon = await this.fileIcon(icon);
    await this.page.waitForLoadState('networkidle');
    await expect(fileIcon.first()).toBeVisible();
  }

  async getSignInButton(text) {
    return this.page.getByRole('button', { name: `${text}` });
  }

  async searchAsset(searchKeyWord) {
    const { searchField } = this;
    await this.searchCard.first().waitFor({ state: 'visible', timeout: 30000 });
    await searchField.fill(searchKeyWord);
    await searchField.press('Enter');
  }

  async checkCardTitle(asset) {
    const card = await this.cardTitle(asset);
    await card.isVisible();
  }

  async hasCardTag(asset, tagText) {
    const card = await this.cardTitle(asset);
    return card.locator('.card-tags-wrapper .card-tag', { hasText: tagText }).isVisible();
  }

  async checkCardDescription(asset, descriptionText) {
    const card = await this.cardTitle(asset);
    const descriptionLocator = card.locator('.card-description', { hasText: descriptionText });
    return descriptionLocator.isVisible();
  }

  // eslint-disable-next-line class-methods-use-this
  async filterSearchAssets(filter, checkBoxName, exactMatch = false) {
    await filter.click();
    const checkBox = await this.checkBox(checkBoxName, exactMatch);
    await checkBox.click();
    await filter.click();
  }

  async languageFilter(filter, checkBoxName, exactMatch = false) {
    const { showMoreLanguage } = this;
    await filter.click();
    await showMoreLanguage.click();
    const checkBox = await this.checkBox(checkBoxName, exactMatch);
    await checkBox.click();
    await filter.click();
  }

  async clearAll() {
    const { clearAllFilters } = this;
    await clearAllFilters.click();
  }

  async checkNumberOfAssets() {
    const { tabAll } = this;
    await this.page.waitForLoadState('networkidle');
    const buttonText = await tabAll.innerText();
    const numberMatch = buttonText.match(/\d+/);
    const number = parseInt(numberMatch[0], 10);

    return number;
  }

  async nextPageCLick() {
    const { nextPage } = this;
    await nextPage.click();
  }

  async prevPageClick() {
    const { prevPage } = this;
    await prevPage.click();
  }

  async page3Click() {
    const { page3 } = this;
    await page3.click();
  }

  async searchForAsset(text) {
    const { searchSpotlight } = this;
    const { searchSpotlightFiled } = this;

    await searchSpotlight.click();
    await searchSpotlightFiled.fill(text);
    await searchSpotlightFiled.press('Enter');
  }
}

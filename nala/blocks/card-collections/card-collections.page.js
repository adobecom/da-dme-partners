export default class PrpCollectionPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator('.feds-profile');
    this.profileIconButton = page.locator('.feds-profile-button');
    this.profile = page.locator('.feds-profile');
    this.cardWrapper = page.locator('.card-wrapper');
    this.prpCollectionTitle = page.locator('#prp-collection-automation-all-levels');
    this.backToCollectionBtn = page.getByRole('link', { name: 'Back to collections' });
    this.backToCollectionBtnEs = page.getByRole('link', { name: 'Volver a colecciones' });
    this.clearAll = page.getByLabel('Clear all');
    this.clearAllDe = page.getByLabel('Alles löschen');
    this.noResultsTitle = page.locator('.no-results-title');
    this.downloadBtnJp = page.locator('single-prp-collection-card').filter({ hasText: 'pptx 2026年6月8日 PRP Worldwide' }).getByRole('link');
    this.searchField = page.getByRole('searchbox', { name: 'Search' });
    this.loadMoreBtn = page.locator('.load-more-btn');
    this.filterByBtn = page.locator('.filters-btn-mobile');
    this.applyFiltersMobile = page.locator('.all-filters-footer-buttons-mobile sp-button');
    this.resourcesHeading = page.locator('.partner-cards-title-wrapper');
    this.clearAllFiltersMobile = page.locator('.all-filters-footer-clear-btn-mobile');
  }

  card(title) {
    return this.page.locator('.card-title').getByText(title, { exact: true });
  }

  textOnPage(text) {
    return this.page.getByText(text);
  }

  cardTag(tag) {
    return this.page.locator('p').filter({ hasText: tag });
  }

  cardDownloadBtn(downloadBtn) {
    return this.page.getByRole('link', { name: downloadBtn });
  }

  cardFormat(format) {
    return this.page.getByText(format, { exact: true });
  }

  async numberOfCards() {
    const results = this.page.locator('.partner-cards-cards-results');
    const buttonText = await results.innerText();
    const numberMatch = buttonText.match(/\d+/);
    const number = parseInt(numberMatch[0], 10);
    return number;
  }

  getFilter(filter) {
    return this.page.getByLabel(filter);
  }

  getCheckBox(checkBoxName) {
    return this.page.getByRole('checkbox', { name: checkBoxName, exact: true });
  }

  async sortingOption(option) {
    const buttonSort = this.page.locator('.sort-btn');
    await buttonSort.click();
    const sortOption = this.page.getByRole('button', { name: option });
    await sortOption.click();
  }

  getCardTitle(title) {
    const cardTitle = this.page.locator('.card-title').getByText(title, { exact: true });
    return cardTitle;
  }

  async firstCardTitle() {
    return this.page.locator('.card-title').first().innerText();
  }

  async getCardTags(index = 0) {
    const description = this.page.locator('.card-description').nth(index);
    const text = (await description.innerText()).trim();
    return text.split(',').map((tag) => tag.trim());
  }

  async getSelectedFilterLabels() {
    const checkboxes = this.page.locator('.filter-list li sp-checkbox');
    const count = await checkboxes.count();
    const labels = [];
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const label = (await checkboxes.nth(i).innerText()).trim();
      labels.push(label);
    }
    return labels;
  }

  async getSearchCardDate(title) {
    const card = this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(title, { exact: true }) });
    const dateText = await card.locator('.card-date').innerText();
    const sizeText = await card.locator('.card-size').innerText();
    return dateText.replace(sizeText, '').split(':').pop().trim();
  }

  async getSearchCardSize(title) {
    const card = this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(title, { exact: true }) });
    return (await card.locator('.card-size').innerText()).trim();
  }

  filterSelectedCount(filterLabel) {
    return this.page.locator('.filter').filter({ has: this.page.locator(`button.filter-header[aria-label="${filterLabel}"]`) }).locator('.filter-selected-tags-total-num');
  }

  getMobileFilter(filterLabel) {
    return this.page.locator(`button.filter-header-mobile[aria-label="${filterLabel}"]`);
  }

  applyMobileFilterAccordion(filterLabel) {
    return this.page.locator('.filter-wrapper-mobile').filter({ has: this.page.locator(`button.filter-header-mobile[aria-label="${filterLabel}"]`) }).locator('sp-button');
  }

  cardOpenBtn(cardTitle) {
    return this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(cardTitle, { exact: true }) }).getByRole('link', { name: 'Open' });
  }

  clearMobileFilterAccordion(filterLabel) {
    return this.page.locator('.filter-wrapper-mobile').filter({ has: this.page.locator(`button.filter-header-mobile[aria-label="${filterLabel}"]`) }).locator('.filter-footer-clear-btn-mobile');
  }

  closeFilterChipMobile(tagLabel) {
    return this.page.locator(`button.chosen-filter-btn-mobile[aria-label="${tagLabel}"]`);
  }

  cardThumbnail(cardTitle) {
    return this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(cardTitle, { exact: true }) }).locator('.card-header');
  }

  cardDate(cardTitle) {
    return this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(cardTitle, { exact: true }) }).locator('.card-date');
  }

  cardDescription(cardTitle) {
    return this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(cardTitle, { exact: true }) }).locator('.card-description');
  }

  cardLanguage(cardTitle) {
    return this.page.locator('.card-wrapper').filter({ has: this.page.locator('.card-title').getByText(cardTitle, { exact: true }) }).locator('.card-details');
  }

  async visibleCardCount() {
    return this.cardWrapper.count();
  }
}

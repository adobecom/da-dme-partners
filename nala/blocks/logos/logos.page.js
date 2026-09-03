export default class LogosPage {
  constructor(page) {
    this.page = page;
    this.logosBlock = page.locator('logos-cards');
    this.firstLogo = page.locator('search-card').first();
    this.cardTitle = page.locator('.card-title').first();
    this.cardDate = page.locator('.card-date').first();
    this.cardSize = page.locator('.card-size').first();
    this.cardIcon = page.locator('.file-icon').first();
    this.cardDescription = page.locator('.card-description').first();
    this.cardTag = page.locator('.card-tag');
    this.cardTagLogo = page.locator('.card-tag').filter({ hasText: /^Logo$/ }).first();
    this.downloadLogo = page.locator('a.card-btn[download]').first();
  }
}

export default class RegionSelectorsPage {
  constructor(page) {
    this.page = page;
    this.regionSelectorPopUp = page.locator('div.region-nav');

    this.profileIconButton = page.locator('.feds-profile-button');

    this.oneTrustBanner = page.getByLabel('Cookie banner');
    this.oneTrustBannerDoNotEnableButton = page.getByRole('button', { name: 'Don\'t enable' });
  }

  async clickLinkWithText(text) {
    await this.page.locator(`div.region-nav a:has-text("${text}")`).click();
  }

  async getButtonElement(text) {
    return this.page.getByRole('button', { name: `${text}` });
  }

  async getPopUpParagraphByText(text) {
    return this.page.locator(`div[data-valign="middle"] :is(h2, p):has-text("${text}")`);
  }
}

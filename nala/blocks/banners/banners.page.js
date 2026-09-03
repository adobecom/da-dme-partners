export default class BannersPage {
  constructor(page) {
    this.page = page;
    this.renewBanner = page.locator('.con-button.outline');
    this.renewBannerCertifiedUS = page.locator('div.notification.ribbon');
    this.bannerLink = page.locator('.notification p.body-m.action-area > a.con-button.outline');
    this.profileIconButton = page.locator('.feds-profile-button');
    this.reEnrollLink = page.locator('.body-m a[href*="/enrollment/"]:has-text("re-enroll")');
    this.abandonedAccountLabel = page.locator('.tracking-header:has-text("Abandoned account")');
    this.globalBanner = page.getByRole('main').locator('img').first();
    this.bannerTitle = page.locator('#notification-without-image');
    this.bannerTitleWithImage = page.locator('#notification-with-an-image');
  }

  getBannerParagraphByIndex() {
    return this.page.locator('.foreground.container.no-image .text .body-m:not(.action-area)');
  }

  getBannerParagraphCertifiedUS() {
    return this.page.locator('.text .copy-wrap > p.body-m');
  }
}

import { expect } from '@playwright/test';

export default class ProfileDropdownPage {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator('.feds-signIn');
    this.profileIconButton = page.locator('.feds-profile-button');
    this.profileImage = page.locator('div#feds-profile-menu img[alt="profile avatar"]');
    this.profileName = page.locator('.feds-profile-name');
    this.profileEmail = page.locator('.feds-profile-email');
    this.primaryContact = page.locator('.primary-contact-wrapper');
    this.profilePartnerLevel = page.locator('.level-placeholder');
    this.editProfileButton = page.locator('.feds-profile-account');
    this.salesCenterButton = page.locator('a:has-text("Go to Sales Center")');
    this.renewNowButton = page.locator('.intro.partner-expired.partner-renew.text a[target="_blank"]');
    this.profileMenu = page.locator('#feds-profile-menu');
  }

  async toggleProfileDropdown() {
    await this.profileIconButton.click();
  }

  getRenewNotification(type) {
    return this.page.locator(`.intro.partner-${type}.partner-renew.text > div > div > p:nth-of-type(1)`);
  }

  async clickRenewNowButton(type) {
    await this.page.locator(`.intro.partner-${type}.partner-renew.text a[target="_blank"]`).click();
  }

  getAccountManagementByText(text) {
    return this.page.locator(`a:has-text("${text}")`);
  }

  getLogoutByText(text) {
    return this.page.locator(`a:has-text("${text}")`);
  }

  async clickOnBodyOutside() {
    const vp = this.page.viewportSize();
    const width = vp?.width ?? (await this.page.evaluate(() => window.innerWidth));
    const height = vp?.height ?? (await this.page.evaluate(() => window.innerHeight));
    await this.page.mouse.click(width / 2, height * 0.8);
  }

  async verifyProfileDropdownAfterLogin(data) {
    await this.profileIconButton.waitFor({ state: 'visible', timeout: 20000 });
    await this.toggleProfileDropdown();
    const profileImage = await this.profileImage;
    await expect(profileImage).toBeVisible();
    const profileName = await this.profileName.textContent();
    await expect(profileName).toBe(data.profileName);
    const profileEmail = await this.profileEmail.textContent();
    await expect(profileEmail).toBe(data.profileEmail);
    const primaryContact = await this.primaryContact;
    await expect(primaryContact).toBeVisible();
    const profilePartnerLevel = await this.profilePartnerLevel.textContent();
    await expect(profilePartnerLevel).toBe(data.profilePartnerLevel);
  }
}

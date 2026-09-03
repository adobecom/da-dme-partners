export default class AccessingAssetsPage {
  constructor(page) {
    this.page = page;
    this.notFound404 = page.locator('#not-found');
    this.navBar = page.locator('[data-test-id="top-app-bar-content"]');
    this.errorMessage = page.getByRole('heading', { name: 'Not Found' });
  }
}

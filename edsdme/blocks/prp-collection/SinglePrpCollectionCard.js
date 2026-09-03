import { formatDate, getLibs } from '../../scripts/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);

class SinglePrpCollectionCard extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    localizedText: { type: Object },
    data: { type: Object },
    ietf: { type: String },
  };

  get imageUrl() {
    return `${new URL(this.data.styles?.backgroundImage)}?width=400&format=webp&optimize=small`;
  }

  // eslint-disable-next-line class-methods-use-this
  getFileExtensionFromUrl(url) {
    if (!url || typeof url !== 'string') return '';

    try {
      const { pathname } = new URL(url, window.location.origin);
      const fileName = pathname.split('/').pop();

      if (!fileName || !fileName.includes('.')) return '';

      return fileName.split('.').pop().toLowerCase();
    } catch {
      return '';
    }
  }

  getAssetDetails(arbitrary) {
    const result = [];

    arbitrary.forEach((item) => {
      if (item['asset-type']) {
        result.push(this.localizedText[`{{${item['asset-type']}}}`] ?? item['asset-type']);
      }

      if (item.language) {
        result.push(this.localizedText[`{{${item.language}}}`] ?? item.language);
      }
    });

    return [...new Set(result)].join(', ');
  }

  hasPreviewOption(url) {
    const allowedPreviewExtensions = ['gif', 'jpeg', 'jpg', 'mp4', 'pdf', 'png', 'svg'];
    const currentExtension = this.getFileExtensionFromUrl(url);

    if (!currentExtension) return false;
    return allowedPreviewExtensions.includes(currentExtension.toLowerCase());
  }

  render() {
    return html`
      <div class="single-prp-collection-card">
        <div class="card-header" style="background-image: url(${this.imageUrl})" alt="${this.data.styles?.backgroundAltText}"></div>
        <span class="card-file-type">${this.getFileExtensionFromUrl(this.data.contentArea?.url)}</span>
        <div class="card-content">
          <span class="card-date">${formatDate(this.data.cardDate, this.ietf)}</span>
          <div class="card-text">
            <p class="card-title">${this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''}</p>
            <p class="card-description">${this.getAssetDetails(this.data.arbitrary)}</p>
          </div>
          <div class="card-footer">
            ${this.hasPreviewOption(this.data.contentArea?.url) ? html`<a class="card-open-link" daa-ll="${this.localizedText['{{open}}']}" href="${this.data.contentArea?.url}" target="_blank">${this.localizedText['{{open}}']}</a>` : ''}
            <a class="card-btn" daa-ll="${this.localizedText['{{download}}']}" @click=${(e) => e.stopPropagation()} download="${this.data.contentArea?.title}" href="${this.data.contentArea?.url}">${this.localizedText['{{download}}']}</a>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('single-prp-collection-card', SinglePrpCollectionCard);

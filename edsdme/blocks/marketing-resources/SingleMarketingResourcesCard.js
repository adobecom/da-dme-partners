import { getLibs } from '../../scripts/utils.js';
import { transformCardUrl, getConfig } from '../utils/utils.js';

const miloLibs = getLibs();
const { html, LitElement } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

class SingleMarketingResourcesCard extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    localizedText: { type: Object },
    data: { type: Object },
    ietf: { type: String },
  };

  get imageUrl() {
    return `${new URL(this.data.styles?.backgroundImage)}?width=400&format=webp&optimize=small`;
  }

  render() {
    return html`
    <a class="link-wrapper" href="${transformCardUrl(this.data.contentArea?.url)}" daa-ll="Marketing Resources Card ${this.data.id} | ${processTrackingLabels(this.data.contentArea?.title, getConfig(), 30)}">
      <div class="single-marketing-resources-card">
        <div class="card-header" style="background-image: url(${this.imageUrl})" alt="${this.data.styles?.backgroundAltText}"></div>
        <div class="card-content">
          <span class="card-details">${this.data.contentArea.detailText}</span>
          <div class="card-text">
            <p class="card-title">${this.data.contentArea?.title !== 'card-metadata' ? this.data.contentArea?.title : ''}</p>
            <p class="card-description">${this.data.contentArea.description}</p>
          </div>
        </div>
      </div>
    </a>
    `;
  }
}
customElements.define('single-marketing-resources-card', SingleMarketingResourcesCard);

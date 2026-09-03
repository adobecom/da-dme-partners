import { getLibs } from '../../scripts/utils.js';
import PartnerCards from '../../components/PartnerCards.js';
import '../../components/SearchCard.js';
import { generateRequestForSearchAPI } from '../utils/utils.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);

export default class Logos extends PartnerCards {
  constructor() {
    super();
    this.contentType = 'all';
    this.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
    this.hasResponseData = false;
  }

  async fetchData() {
    const assetType = { filters: { assetType: ['logoLogotype'] } };
    let apiData;
    try {
      const response = await generateRequestForSearchAPI(
        {
          sort: 'recent',
          type: 'asset',
        },
        assetType,
      );

      if (!response.ok) {
        throw new Error(`Error message: ${response.statusText}`);
      }

      apiData = await response.json();

      this.allCards = apiData.cards;
      this.cards = apiData.cards;
      this.hasResponseData = !!apiData.cards;
    } catch (error) {
      this.hasResponseData = true;
      // eslint-disable-next-line no-console
      console.error('There was a problem with your fetch operation:', error);
    }
  }

  get partnerCards() {
    if (this.paginatedCards.length) {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card) => html`<search-card class="card-wrapper" .data=${card} .localizedText=${this.blockData.localizedText} .ietf=${this.blockData.ietf}></search-card>`,
      )}`;
    }
    return html`<div class="no-results">
        <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
      </div>`;
  }

  /* eslint-disable indent */
  render() {
    return html`
      <div class="partner-cards-content">
        <div class="partner-cards-collection">
          ${this.hasResponseData
            ? this.partnerCards
            : html`
              <div class="progress-circle-wrapper">
                <sp-theme theme="spectrum" color="light" scale="medium">
                  <sp-progress-circle label="Cards loading" indeterminate="" size="l" role="progressbar"></sp-progress-circle>
                </sp-theme>
              </div>
            `
          }
        </div>
      </div>
    `;
  }
  /* eslint-disable indent */
}

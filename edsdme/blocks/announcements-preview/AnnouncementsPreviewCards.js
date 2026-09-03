import { getLibs } from '../../scripts/utils.js';
import PartnerCards, { filterRestrictedCardsByCurrentSite } from '../../components/PartnerCards.js';
import { filterExpiredAnnouncements } from '../announcements/AnnouncementsCards.js';
import { getConfig, transformCardUrl } from '../utils/utils.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

export default class AnnouncementsPreview extends PartnerCards {
  static properties = { ...PartnerCards.properties };

  // eslint-disable-next-line class-methods-use-this
  handleSortAction(cards) {
    const sortFunctions = { newest: (a, b) => new Date(b.cardDate) - new Date(a.cardDate) };

    const sortKey = 'newest';
    cards.sort(sortFunctions[sortKey]);
  }

  // eslint-disable-next-line class-methods-use-this
  onDataFetched(apiData) {
    // Filter announcements by current site
    apiData.cards = filterRestrictedCardsByCurrentSite(apiData.cards);
    this.handleSortAction(apiData.cards);
    apiData.cards = filterExpiredAnnouncements(apiData.cards, this.blockData);
    apiData.cards = apiData.cards.slice(0, 3);
  }

  // eslint-disable-next-line class-methods-use-this
  shouldDisplayPagination() {}

  getPartnerCardsHeader() {
    return html`
            <h3 class="text announcements-preview-cards-title ${this.blockData.heading}">
              <strong>${this.blockData.title}</strong>
            </h3>
      `;
  }

  getViewAllButton() {
    if (this.blockData.link && this.blockData.buttonText) {
      return html`
            <div class="${this.blockData.buttonSize}" daa-ll="${this.blockData.buttonText}">
              <a class="con-button blue" href="${this.blockData.link}">${this.blockData.buttonText}</a>
            </div>
        `;
    }
    return '';
  }

  get partnerCards() {
    if (this.cards.length) {
      return html`${repeat(
        this.cards,
        (card) => card.id,
        (card, index) => {
          const imageUrl = card.styles?.backgroundImage
            ? `${new URL(card.styles.backgroundImage).pathname}?width=240&format=webp&optimize=small`
            : '';

          return html`
            <a class="link-wrapper" href="${transformCardUrl(card.contentArea.url)}" target="_blank" daa-ll="Announcement Preview Horizontal Card ${index + 1} | ${processTrackingLabels(card.contentArea.title, getConfig(), 30)}">
              <div class="announcements-preview-card">
                <div class="card-image">
                  <picture>
                    <source srcset="${imageUrl}" type="image/webp" />
                    <img src="${imageUrl}" alt="${card.styles?.backgroundAltText || ''}" loading="lazy" />
                  </picture>
                </div>
                <div class="card-content">
                  <h3 class="card-title">${card.contentArea.title}</h3>
                  <p class="card-description">${card.contentArea.description}</p>
                </div>
              </div>
            </a>
          `;
        },
      )}`;
    }

    return html`<p class="empty-message">${this.blockData.localizedText['{{no-partner-announcement}}']}</p>`;
  }

  render() {
    return html`
        ${this.fetchedData
    ? html`
            ${this.getPartnerCardsHeader()}
                ${this.hasResponseData
    ? this.partnerCards
    : ''}
         ` : ''}
      ${this.getViewAllButton()}
    `;
  }
}

import PartnerCards from '../../components/PartnerCards.js';
import { getLibs } from '../../scripts/utils.js';
import { getConfig } from '../utils/utils.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

export const priceListKeyWords = {
  CURRENCY: 'currency',
  MONTH: 'month',
  REGION: 'region',
  BUYING_PROGRAM_TYPE: 'buying_program_type',
  BUYING_PROGRAM_TYPE_COLUMN_NAME: 'type',
  INCLUDE_EU_PRICELIST: 'include_end_user_pricelist',
  PAGINATION: {
    LOAD_MORE: 'load-more',
    DEFAULT: 'default',
  },
};

export default class Pricelist extends PartnerCards {
  static properties = { ...PartnerCards.properties, filtersData: { type: Array } };

  constructor() {
    super();
    this.includeEndUser = false;
    this.searchInputPlaceholder = '{{search-here}}';
    this.searchInputLabel = '{{search}}';
    this.filtersData = [];
  }

  createFilterObject(filterData) {
    return {
      key: filterData.name,
      value: this.blockData.localizedText[`{{${filterData.name}}}`],
      tags: filterData.tags.map((tagKey) => (
        {
          key: tagKey,
          parentKey: filterData.name,
          value: tagKey,
          checked: false,
        })),
    };
  }

  additionalFirstUpdated() {
    this.getAllCardFilters();
    if (this.mobileView) {
      this.blockData.pagination = priceListKeyWords.PAGINATION.LOAD_MORE;
      this.cardsPerPage = this.blockData.cardsPerPage;
    } else {
      this.blockData.pagination = priceListKeyWords.PAGINATION.DEFAULT;
      this.cardsPerPage = this.allCards.length;
    }
  }

  onViewUpdate(viewUpdated) {
    if (viewUpdated) {
      this.paginationCounter = 1;
      if (this.mobileView) {
        this.blockData.pagination = priceListKeyWords.PAGINATION.LOAD_MORE;
        this.cardsPerPage = this.blockData.cardsPerPage;
      } else {
        this.blockData.pagination = priceListKeyWords.PAGINATION.DEFAULT;
        this.cardsPerPage = this.allCards.length;
      }
      this.handleActions();
    }
  }

  onDataFetched(apiData) {
    this.filtersData = apiData.filters;
  }

  getAllCardFilters() {
    const filtersObjects = {};
    this.filtersData?.forEach(
      (filter) => {
        filtersObjects[filter.name] = this.createFilterObject(filter);
      },
    );
    const requiredFilters = [
      priceListKeyWords.CURRENCY,
      priceListKeyWords.MONTH,
      priceListKeyWords.BUYING_PROGRAM_TYPE,
      priceListKeyWords.REGION,
    ];
    this.blockData.filters.push(
      ...requiredFilters
        .map((key) => filtersObjects[key] || null)
        .filter((filter) => filter !== null),
    );
  }

  getSlider() {
    return html`
        <sp-theme class="search-wrapper" theme="spectrum" color="light" scale="medium">
            <div class="sidebar-slider">
                <sp-switch size="m"
                           ?checked=${this.includeEndUser}
                           @change=${this.handleSlider}>
                    ${this.blockData.localizedText[`{{${priceListKeyWords.INCLUDE_EU_PRICELIST}}}`]}
                </sp-switch>
            </div>
        </sp-theme>
    `;
  }

  handleSlider(event) {
    this.includeEndUser = event.target.checked;
    this.handleActions();
  }

  // eslint-disable-next-line class-methods-use-this
  getArbitraryValue(arbitrary, key) {
    const filters = arbitrary.filter((a) => a[key]);
    return filters.map((f) => f[key]).join();
  }

  getTableRow(rowData) {
    return html`
        <tr>
            <td headers="${priceListKeyWords.BUYING_PROGRAM_TYPE_COLUMN_NAME}">
                ${this.getArbitraryValue(rowData.arbitrary, priceListKeyWords.BUYING_PROGRAM_TYPE)}
            </td>
            <td headers="${priceListKeyWords.REGION}">
                ${this.getArbitraryValue(rowData.arbitrary, priceListKeyWords.REGION)}
            </td>
            <td headers="${priceListKeyWords.CURRENCY}">
                ${this.getArbitraryValue(rowData.arbitrary, priceListKeyWords.CURRENCY)}
            </td>
            <td headers="${priceListKeyWords.MONTH}">
                ${this.getArbitraryValue(rowData.arbitrary, priceListKeyWords.MONTH)}
            </td>
            <td headers="download">
              <div class="download-btn-wrapper">
                <a class="download-btn"
                   href="${rowData.contentArea?.url}"
                   download="${rowData.contentArea?.filename}"
                   aria-label="${this.blockData.localizedText['{{download}}']}"
                   daa-ll="${processTrackingLabels(this.blockData.localizedText['{{download}}'], getConfig(), 30)}"
                >
                  <sp-icon-download slot="icon"></sp-icon-download>
                  ${this.blockData.localizedText['{{download}}']}
                </a>
              </div>
            </td>
        </tr>`;
  }

  getTableRows() {
    return html`${repeat(
      this.paginatedCards,
      (pricelist) => pricelist.id,
      (pricelist) => this.getTableRow(pricelist),
    )
    }`;
  }

  additionalActions() {
    this.cards = this.cards.filter((card) => {
      if (!card.arbitrary.length) return false;
      const isEndUser = card.arbitrary.some(
        (o) => Object.prototype.hasOwnProperty.call(o, priceListKeyWords.INCLUDE_EU_PRICELIST),
      );
      return this.includeEndUser || !isEndUser;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getArbitraryTagValue(arbitraryTag, key) {
    const filtersFromPricelistData = [
      priceListKeyWords.BUYING_PROGRAM_TYPE,
      priceListKeyWords.REGION,
      priceListKeyWords.CURRENCY,
      priceListKeyWords.MONTH,
    ];
    return filtersFromPricelistData.includes(key) ? arbitraryTag[key] : arbitraryTag[key].replaceAll(' ', '-');
  }

  // eslint-disable-next-line class-methods-use-this
  getFetchOptions() {
    return { credentials: 'include' };
  }

  get partnerCards() {
    if (this.paginatedCards.length) {
      return html`
            <div class="table-container" tabindex="0" role="region" aria-label="Scrollable table with data"">
            <table>
                <thead>
                <tr>
                    <th id="type">
                        ${this.blockData.localizedText[`{{${priceListKeyWords.BUYING_PROGRAM_TYPE_COLUMN_NAME}}}`]?.toLocaleUpperCase()}
                    </th>
                    <th id="region">
                        ${this.blockData.localizedText[`{{${priceListKeyWords.REGION}}}`]?.toLocaleUpperCase()}
                    </th>
                    <th id="currency">
                        ${this.blockData.localizedText[`{{${priceListKeyWords.CURRENCY}}}`]?.toLocaleUpperCase()}
                    </th>
                    <th id="month">
                        ${this.blockData.localizedText[`{{${priceListKeyWords.MONTH}}}`]?.toLocaleUpperCase()}
                    </th>
                    <th id="download">${this.blockData.localizedText['{{action}}']?.toLocaleUpperCase()}</th>
                </tr>
                </thead>
                <tbody>
                ${this.getTableRows()}
                </tbody>
            </table>
            </div>
        `;
    }

    return html`
        <div class="no-results">
            <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
            <p class="no-results-description">${this.blockData.localizedText['{{no-results-description}}']}</p>
        </div>`;
  }

  // eslint-disable-next-line class-methods-use-this
  getCardArbitraryValues(card) {
    // eslint-disable-next-line no-unused-vars
    return card.arbitrary?.map((object) => Object.entries(object).map(([key, value]) => value.toLocaleLowerCase())).join(' ');
  }

  handleSearchAction() {
    // eslint-disable-next-line max-len
    this.cards = this.allCards.filter((card) => this.getCardArbitraryValues(card).includes(this.searchTerm.toLocaleLowerCase()));
  }

  shouldDisplayPagination() {
    return this.cards.length && this.mobileView;
  }

  getPartnerCardsHeader() {
    return html`
        <div class="partner-cards-header">
            <div class="partner-cards-sort-wrapper">
                ${this.mobileView
    ? html`
    <button class="filters-btn-mobile" @click="${this.openFiltersMobile}"
                                    aria-label="${this.blockData.localizedText['{{filters}}']}">
                                <span class="filters-btn-mobile-icon"></span>
                                <span class="filters-btn-mobile-title">${this.blockData.localizedText['{{filters}}']}</span>
                                ${this.chosenFilters?.tagsCount
    ? html`<span
                                                class="filters-btn-mobile-total">${this.chosenFilters.tagsCount}</span>`
    : ''
}
                            </button>
                            ${this.getSlider()}
`
    : ''
}
            </div>
        </div>
    `;
  }
}

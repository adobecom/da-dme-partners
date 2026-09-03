import { getLibs } from '../../scripts/utils.js';
import PartnerCards, { filterRestrictedCardsByCurrentSite } from '../../components/PartnerCards.js';
import './SingleMarketingResourcesCard.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);

export default class MarketingResourcesCards extends PartnerCards {
  // add third column to block since partnerCards is expecting third collumn for filter tags
  setBlockData() {
    const tableData = this.blockData?.tableData;
    if (tableData) {
      Array.from(tableData).forEach((row) => {
        const cols = Array.from(row.children);
        const rowTitle = cols[0]?.innerText?.trim().toLowerCase().replace(/ /g, '-');
        if (rowTitle === 'filter' && cols.length < 3) {
          const tagColumn = document.createElement('div');
          tagColumn.innerHTML = '<ul></ul>';
          row.appendChild(tagColumn);
        } else if (rowTitle === 'filter' && cols.length >= 3) {
          const filterTagsKeysEl = cols[2];
          const firstUl = filterTagsKeysEl?.querySelectorAll?.('ul')?.[0];
          if (!firstUl) {
            const ul = document.createElement('ul');
            filterTagsKeysEl.appendChild(ul);
          }
        }
      });
    }
    super.setBlockData();
  }

  // eslint-disable-next-line class-methods-use-this
  onDataFetched(apiData) {
    // Filter prp-collections by current site
    apiData.cards = filterRestrictedCardsByCurrentSite(apiData.cards);
  }

  get resultsText() {
    return this.blockData.localizedText['{{collections}}'];
  }

  // override - result is changed to collections
  getPartnerCardsHeader() {
    return html`
      <div class="partner-cards-header">
        <div class="partner-cards-title-wrapper">
          <h3 class="partner-cards-title">${this.blockData.title}</h3>
          <span class="partner-cards-cards-results">
            <strong>${this.cards?.length}</strong>
            ${this.resultsText}
          </span>
        </div>
        <div class="partner-cards-sort-wrapper">
          ${this.mobileView
    ? html`
                <button class="filters-btn-mobile"
                  @click="${this.openFiltersMobile}"
                  aria-label="${this.blockData.localizedText['{{filters}}']}">
                  <span class="filters-btn-mobile-icon"></span>
                  <span class="filters-btn-mobile-title">
                    ${this.blockData.localizedText['{{filters}}']}
                  </span>
                  ${this.chosenFilters?.tagsCount
    ? html`<span class="filters-btn-mobile-total">
                        ${this.chosenFilters.tagsCount}
                      </span>`
    : ''}
                </button>
              `
    : ''}
          ${this.blockData.sort.items.length
    ? html`
                <div class="sort-wrapper">
                  <button class="sort-btn" @click="${this.toggleSort}">
                    <span class="sort-btn-text">${this.selectedSortOrder.value}</span>
                    <span class="filter-chevron-icon"></span>
                  </button>
                  <div class="sort-list">
                    ${this.sortItems}
                  </div>
                </div>
              `
    : ''}
        </div>
      </div>
    `;
  }

  get partnerCards() {
    if (this.paginatedCards.length) {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card) => html`<single-marketing-resources-card class="card-wrapper" .data=${card} .ietf=${this.blockData.ietf} .localizedText=${this.blockData.localizedText}></single-marketing-resources-card>`,
      )}`;
    }

    return html`<div class="no-results">
        <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
        <p class="no-results-description">${this.blockData.localizedText['{{no-results-description}}']}</p>
      </div>`;
  }

  // override - result is changed to collections
  /* eslint-disable indent */
    render() {
      return html`
        ${this.fetchedData
          ? html`
            <div
              class="partner-cards"
              daa-lh="Card Collection | Filters: ${processTrackingLabels(Object.keys(this.selectedFilters).length > 0 ? Object.values(this.selectedFilters).flat().map((item) => item.value).join(', ') : 'No Filters')} | Search Query: ${processTrackingLabels(this.searchTerm.trim() ? this.searchTerm : 'None')}"
            >
              <div class="partner-cards-sidebar-wrapper">
                <div class="partner-cards-sidebar">
                  <sp-theme class="search-wrapper" theme="spectrum" color="light" scale="medium">
                    ${this.searchInputLabel && !this.mobileView ? html`<sp-field-label for="search" size="m">${this.blockData.localizedText[this.searchInputLabel]}</sp-field-label>` : ''}
                    <sp-search id="search" size="m" value="${this.searchTerm}" @input="${this.handleSearch}"
                               @submit="${(event) => event.preventDefault()}"
                               placeholder="${this.blockData.localizedText[this.searchInputPlaceholder]}"></sp-search>
                  </sp-theme>

                  ${!this.mobileView
                    ? html`
                      ${this.getSlider()}
                      <div class="sidebar-header">
                        <h3 class="sidebar-title">${this.blockData.localizedText['{{filter}}']}</h3>
                        <button class="sidebar-clear-btn" @click="${this.handleResetActions}"
                                aria-label="${this.blockData.localizedText['{{clear-all}}']}">
                          ${this.blockData.localizedText['{{clear-all}}']}
                        </button>
                      </div>
                      <div class="sidebar-chosen-filters-wrapper">
                        ${this.chosenFilters && this.chosenFilters.htmlContent}
                      </div>
                      <div class="sidebar-filters-wrapper">
                        ${this.filters}
                      </div>
                      ${this.blockData.filterInfoBox.title ? html`
                        <div class="sidebar-info-box">
                        <div class="title">${this.blockData.filterInfoBox.title}</div>
                        ${this.renderInfoBoxDescription()}
                      </div>` : ''
                  }
                    `
                    : ''
                  }
                </div>
              </div>
              <div class="partner-cards-content">
              ${this.getPartnerCardsHeader()}
                <div class="partner-cards-collection">
                  ${this.hasResponseData
                    ? this.partnerCards
                    : html`
                      <div class="progress-circle-wrapper">
                        <sp-theme theme="spectrum" color="light" scale="medium">
                          <sp-progress-circle label="Cards loading" indeterminate="" size="l"
                                              role="progressbar"></sp-progress-circle>
                        </sp-theme>
                      </div>
                    `
                  }
                </div>
                ${this.shouldDisplayPagination()
                  ? html`
                    <div
                      class="pagination-wrapper ${this.blockData?.pagination === 'load-more' ? 'pagination-wrapper-load-more' : 'pagination-wrapper-default'}">
                      ${this.pagination}
                      <span
                        class="pagination-total-results">${this.cardsCounter} ${this.blockData.localizedText['{{of}}']} ${this.cards.length} ${this.resultsText}</span>
                    </div>
                  `
                  : ''
                }
              </div>
            </div>` : ''}
        ${this.getFilterFullScreenView(this.mobileView && this.fetchData)}
      `;
    }
}

import { getLibs, prodHosts, loadPageToAnchor } from '../scripts/utils.js';
import './SinglePartnerCard.js';

const miloLibs = getLibs();
const { html, LitElement, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);
const { processTrackingLabels } = await import(`${miloLibs}/martech/attributes.js`);
const { replaceText, fetchPlaceholders } = await import(`${miloLibs}/features/placeholders.js`);

export function filterRestrictedCardsByCurrentSite(cards) {
  const currentSite = window.location.pathname.split('/')[1];
  return cards.filter((card) => {
    const cardUrl = card?.contentArea?.url;
    if (!cardUrl) return false;
    try {
      const cardSite = new URL(cardUrl).pathname.split('/')[1];
      return currentSite === cardSite;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Invalid URL: ${cardUrl}`, error);
      return false;
    }
  });
}

const EN_PLACEHOLDERS_PATH = '/edsdme/partners-shared/placeholders.json';

export async function getEnglishLabels(config) {
  const placeholders = await fetchPlaceholders({
    config,
    placeholderPath: EN_PLACEHOLDERS_PATH,
  }).catch(() => ({}));

  return new Map(
    Object.entries(placeholders ?? {}).map(([key, value]) => [key.trim().toLowerCase(), value]),
  );
}

export function sortTagsAlphabetically(tags, englishLabels = new Map()) {
  const sortValue = (tag) => englishLabels.get(tag.key.trim().toLowerCase()) ?? tag.key;
  return [...tags].sort((a, b) => {
    if (!!a.initialHidden !== !!b.initialHidden) return a.initialHidden ? 1 : -1;
    return sortValue(a).localeCompare(sortValue(b), 'en', { numeric: true, sensitivity: 'base' });
  });
}

export default class PartnerCards extends LitElement {
  createRenderRoot() { return this; }

  static properties = {
    blockData: { type: Object },
    cards: { type: Array },
    paginatedCards: { type: Array },
    searchTerm: { type: String },
    paginationCounter: { type: Number },
    totalPages: { type: Number },
    selectedSortOrder: { type: Object },
    selectedFilters: { type: Object },
    urlSearchParams: { type: Object },
    mobileView: { type: Boolean },
    fetchedData: { type: Boolean },
    searchInputPlaceholder: { type: String },
    searchInputLabel: { type: String },
  };

  constructor() {
    super();
    this.allCards = [];
    this.cards = [];
    this.paginatedCards = [];
    this.searchTerm = '';
    this.paginationCounter = 1;
    this.totalPages = 0;
    this.cardsPerPage = 12;
    this.selectedSortOrder = {};
    this.selectedFilters = {};
    this.urlSearchParams = {};
    this.hasResponseData = true;
    this.fetchedData = false;
    this.mobileView = window.innerWidth <= 1200;
    this.searchInputPlaceholder = '{{search}}';
    this.searchInputLabel = '';
    this.cardFiltersMap = new Map();
    this.updateView = this.updateView.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.setBlockData();
    window.addEventListener('resize', this.updateView);
  }

  setBlockData() {
    this.blockData = {
      ...this.blockData,
      title: '',
      filters: [],
      filtersInfos: [],
      sort: {
        default: {},
        items: [],
      },
      filterInfoBox: {
        title: '',
        description: '',
      },
    };

    const blockDataActions = {
      title: (cols) => {
        const [titleEl] = cols;
        this.blockData.title = titleEl.innerText.trim();
      },
      filter: (cols) => {
        const [filterKeyEl, filterTagsKeysEl] = cols;
        const filterKey = filterKeyEl.innerText.trim().toLowerCase().replace(/ /g, '-');

        if (!filterKey) return;

        function createTag(tagKey, initialHidden, blockData) {
          return {
            key: tagKey,
            parentKey: filterKey,
            value: blockData.localizedText[`{{${tagKey}}}`],
            checked: false,
            paramValue: tagKey.includes('-&-') ? tagKey.replace('-&-', '-and-') : null,
            initialHidden,
          };
        }
        const filterTagsKeys = [];

        // Only process tags if filterTagsKeysEl exists and has <ul> with <li> elements
        // (3rd block column is authored with subcategory keys)
        if (filterTagsKeysEl) {
          const firstUl = filterTagsKeysEl.querySelectorAll('ul')[0];
          if (firstUl) {
            firstUl.querySelectorAll('li').forEach((li) => {
              const key = li.innerText.trim().toLowerCase().replace(/ /g, '-');
              if (key !== '') filterTagsKeys.push(createTag(key, false, this.blockData));
            });
          }

          const secondUl = filterTagsKeysEl.querySelectorAll('ul')[1];
          if (secondUl) {
            secondUl.querySelectorAll('li').forEach((li) => {
              const key = li.innerText.trim().toLowerCase().replace(/ /g, '-');
              if (key !== '') filterTagsKeys.push(createTag(key, true, this.blockData));
            });
          }
        }

        const filterObj = {
          key: filterKey,
          value: this.blockData.localizedText[`{{${filterKey}}}`],
          tags: filterTagsKeys,
          hideTags: true,
          hasHiddenTags: filterTagsKeys.some((tag) => tag.initialHidden),
        };
        this.blockData.filters.push(filterObj);
      },
      sort: (cols) => {
        const [sortKeysEl] = cols;

        const sortKeys = [];
        sortKeysEl.querySelectorAll('li').forEach((li) => {
          const key = li.innerText.trim().toLowerCase().replace(/ /g, '-');
          if (key !== '') sortKeys.push(key);
        });

        if (!sortKeys.length) return;

        const sortItems = sortKeys.map((sortKey) => {
          const key = sortKey.endsWith('_default') ? sortKey.slice(0, -8) : sortKey;
          const value = this.blockData.localizedText[`{{${key}}}`];
          return { key, value };
        });

        const defaultKey = sortKeys.find((key) => key.endsWith('_default'));
        const finalDefaultKey = defaultKey ? defaultKey.slice(0, -8) : sortKeys[0];
        const defaultValue = sortItems.find((e) => e.key === finalDefaultKey).value;
        // eslint-disable-next-line max-len
        this.blockData.sort = { items: sortItems, default: { key: finalDefaultKey, value: defaultValue } };
      },
      'cards-per-page': (cols) => {
        const [cardsPerPageEl] = cols;
        const cardsPerPageStr = cardsPerPageEl.innerText.trim();
        const cardsPerPageNum = parseInt(cardsPerPageStr, 10);
        if (cardsPerPageNum) this.blockData.cardsPerPage = cardsPerPageNum;
      },
      pagination: (cols) => {
        const [paginationEl] = cols;
        const paginationType = paginationEl.innerText.trim();
        if (paginationType) this.blockData.pagination = paginationType.toLowerCase().replace(/ /g, '-');
      },
      'background-color': (cols) => {
        const [backgroundColorEl] = cols;
        const backgroundColor = backgroundColorEl.innerText.trim();
        if (backgroundColor) this.blockData.backgroundColor = backgroundColor;
      },
      'filter-info': (cols) => {
        const filterName = cols[0].innerText.trim();
        this.blockData.filtersInfos[filterName] = cols[1].innerText.trim();
      },
      'filter-info-box': (cols) => {
        this.blockData.filterInfoBox.title = cols[0].innerText.trim();
        this.blockData.filterInfoBox.description = this.getTextWithStrong(cols[1]);
      },
    };

    const rows = Array.from(this.blockData.tableData);
    rows.forEach((row) => {
      const cols = Array.from(row.children);
      const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');
      const colsContent = cols.slice(1);
      if (blockDataActions[rowTitle]) blockDataActions[rowTitle](colsContent);
    });
  }

  updateView() {
    const oldValue = this.mobileView;
    this.mobileView = window.innerWidth <= 1200;
    this.onViewUpdate(oldValue !== this.mobileView);
  }

  // eslint-disable-next-line class-methods-use-this
  onViewUpdate() {}

  async firstUpdated() {
    await super.firstUpdated();
    await this.fetchData();
    if (this.blockData.sort.items.length) this.selectedSortOrder = this.blockData.sort.default;
    if (this.blockData.cardsPerPage) this.cardsPerPage = this.blockData.cardsPerPage;
    this.additionalFirstUpdated();
    this.initUrlSearchParams();
    this.handleActions();

    if (window.location.hash) {
      await this.updateComplete;

      const childCards = [...this.querySelectorAll('single-partner-card, single-partner-card-half-height')];
      await Promise.all(childCards.map((card) => card.updateComplete));

      if (document.readyState !== 'complete') {
        await new Promise((resolve) => { window.addEventListener('load', resolve, { once: true }); });
      }

      if (document.fonts) await document.fonts.ready;
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
      loadPageToAnchor();
    }
  }

  // gets text content from node,
  // and keeps <strong> elements if any, while putting it at the beginning of new row
  getTextWithStrong(node) {
    if (!node) return '';
    return Array.from(node.childNodes).map((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return child.textContent.trim();
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === 'STRONG') {
          return `<br/><strong>${this.getTextWithStrong(child)}</strong>`;
        }
        return this.getTextWithStrong(child);
      }
      return '';
    }).join('');
  }

  // eslint-disable-next-line class-methods-use-this
  additionalFirstUpdated() {}

  async createFilters() {
    const filtersArray = Array.from(this.cardFiltersMap.entries());

    const allPromises = filtersArray.flatMap(([filterCategoryKey, filterSubcategoryKeys]) => {
      const filterObj = this.blockData.filters.find((f) => f.key === filterCategoryKey);
      if (!filterObj) {
        return [];
      }

      return filterSubcategoryKeys.map(async (filterSubcategoryKey) => {
        const filterSubcategoryLabel = await replaceText(
          `{{${filterSubcategoryKey.toLowerCase()}}}`,
          this.blockData.config,
        );

        return {
          filterObj,
          tag: {
            key: filterSubcategoryKey,
            parentKey: filterCategoryKey,
            value: filterSubcategoryLabel,
            checked: false,
            initialHidden: false,
          },
        };
      });
    });

    const tagsData = await Promise.all(allPromises);

    tagsData
      .filter(Boolean)
      .forEach(({ filterObj, tag }) => {
        const tagExists = filterObj.tags.some((t) => t.key === tag.key);
        if (!tagExists) {
          filterObj.tags.push(tag);
          filterObj.hasHiddenTags = filterObj.tags.some((t) => t.initialHidden);
        }

        const localizedKey = `{{${tag.key}}}`;
        this.blockData.localizedText[localizedKey] = tag.value;
      });

    const englishLabels = await getEnglishLabels(this.blockData.config);
    this.blockData.filters.forEach((filterObj) => {
      filterObj.tags = sortTagsAlphabetically(filterObj.tags, englishLabels);
    });

    this.blockData.filters = this.blockData.filters.filter(
      (filterObj) => filterObj.tags.length > 0,
    );
  }

  async fetchData() {
    try {
      let apiData;

      setTimeout(() => {
        this.hasResponseData = !!apiData?.cards;
        this.fetchedData = true;
      }, 5);

      const response = await fetch(
        this.blockData.caasUrl,
        this.getFetchOptions(),
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      apiData = await response.json();
      const cardsEvent = new Event('partner-cards-loaded');
      document.dispatchEvent(cardsEvent);
      if (apiData?.cards) {
        if (prodHosts.includes(window.location.host)) {
          apiData.cards = apiData.cards.filter((card) => !card.contentArea.url?.includes('/drafts/'));
        }
        this.onDataFetched(apiData);
        // eslint-disable-next-line no-return-assign
        apiData.cards.forEach((card, index) => {
          card.orderNum = index + 1;
          card.arbitrary?.forEach((filter) => {
            if (Object.keys(filter).length === 0) {
              return;
            }
            const [key, value] = Object.entries(filter)[0]; // Extract key-value pair
            if (!this.cardFiltersMap.has(key)) {
              this.cardFiltersMap.set(key, []);
            }
            const subcategories = this.cardFiltersMap.get(key);
            if (!subcategories.includes(value)) {
              subcategories.push(value);
            }
          });
        });
        this.allCards = apiData.cards;
        if (this.blockData.dynamicFilters) {
          await this.createFilters();
        }
        this.cards = apiData.cards;
        this.paginatedCards = this.cards.slice(0, this.cardsPerPage);
        this.hasResponseData = !!apiData.cards;
      }
    } catch (error) {
      this.hasResponseData = true;
      // eslint-disable-next-line no-console
      console.error('Error fetching data:', error);
    }
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onDataFetched(apiData) {}

  // eslint-disable-next-line class-methods-use-this
  getFetchOptions() { return {}; }

  initUrlSearchParams() {
    // eslint-disable-next-line no-restricted-globals
    const { search } = location || window.location;
    this.urlSearchParams = new URLSearchParams(search);

    const term = this.urlSearchParams.get('term');
    if (term) {
      this.searchTerm = term;
    }

    if (this.blockData.filters.length && this.urlSearchParams.has('filters', 'yes')) {
      this.blockData.filters = this.blockData.filters.map((filter) => {
        if (this.urlSearchParams.has(filter.key)) {
          const filtersSearchTags = this.urlSearchParams.get(filter.key).split(',');

          filtersSearchTags.forEach((searchTag) => {
            // eslint-disable-next-line max-len
            const filterTag = filter.tags.find((tag) => tag.paramValue === searchTag || tag.key === searchTag);
            if (filterTag) {
              filterTag.checked = true;
              this.selectedFilters = {
                ...this.selectedFilters,
                [filter.key]: [...(this.selectedFilters[filter.key] || []), filterTag],
              };
            }
          });
        }
        return filter;
      });
    }
  }

  get partnerCards() {
    if (this.paginatedCards.length) {
      return html`${repeat(
        this.paginatedCards,
        (card) => card.id,
        (card, index) => html`<single-partner-card  class="card-wrapper" daa-lh="Card ${index + 1} | ${processTrackingLabels(card.contentArea?.title)}"  .data=${card} .ietf=${this.blockData.ietf}></single-partner-card>`,
      )}`;
    }

    return html`<div class="no-results">
        <strong class="no-results-title">${this.blockData.localizedText['{{no-results-title}}']}</strong>
        <p class="no-results-description">${this.blockData.localizedText['{{no-results-description}}']}</p>
      </div>`;
  }

  get sortItems() {
    if (!this.blockData.sort.items.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.sort.items,
      (item) => item.key,
      (item) => html`<button
        class="sort-item ${this.selectedSortOrder.key === item.key ? 'selected' : ''}"
        value="${item.key}"
        @click="${() => this.handleSort(item)}">
        ${item.value}
      </button>`,
    )}`;
  }

  // eslint-disable-next-line class-methods-use-this,no-empty-function,getter-return
  get pagination() {
    if (this.blockData.pagination === 'load-more') return this.loadMorePagination;
    return this.defaultPagination;
  }

  shouldDisplayLoadMore() {
    return this.cards.length !== this.paginatedCards.length;
  }

  get loadMorePagination() {
    if (this.shouldDisplayLoadMore()) {
      return html`<button class="load-more-btn" @click="${this.handleLoadMore}" aria-label="${this.blockData.localizedText['{{load-more}}']}">${this.blockData.localizedText['{{load-more}}']}</button>`;
    }
    return '';
  }

  get defaultPagination() {
    return html`
      <div class="pagination-pages-list">
        <button class="pagination-prev-btn ${this.paginationCounter === 1 || !this.paginatedCards?.length ? 'disabled' : ''}" @click="${this.handlePrevPage}" aria-label="${this.blockData.localizedText['{{previous-page}}']}">
          ${this.blockData.localizedText['{{prev}}']}</button>
        ${this.paginationList}
        <button class="pagination-next-btn ${this.paginationCounter === this.totalPages || !this.paginatedCards?.length ? 'disabled' : ''}" @click="${this.handleNextPage}" aria-label="${this.blockData.localizedText['{{next-page}}']}">
          ${this.blockData.localizedText['{{next}}']}</button>
      </div>
    `;
  }

  get paginationList() {
    if (!this.cards.length) return;
    const pagesNumArray = this.getPageNumArray();
    // eslint-disable-next-line consistent-return
    return html`${repeat(
      pagesNumArray,
      (pageNum) => pageNum,
      (pageNum) => html`<button
        class="page-btn ${this.paginationCounter === pageNum ? 'selected' : ''}"
        @click="${() => this.handlePageNum(pageNum)}"
        aria-label="${this.blockData.localizedText['{{page}}']} ${pageNum}">
        ${pageNum}
      </button>`,
    )}`;
  }

  getPageNumArray() {
    const min = 1;
    this.totalPages = Math.ceil(this.cards.length / this.cardsPerPage);
    // eslint-disable-next-line consistent-return
    return Array.from({ length: this.totalPages }, (_, i) => i + min);
  }

  get cardsCounter() {
    const { length } = this.paginatedCards;
    if (!length) return 0;

    const { orderNum: lastElOrderNum } = this.paginatedCards[length - 1];

    if (this.blockData.pagination === 'load-more') return lastElOrderNum;

    const { orderNum: firstElOrderNum } = this.paginatedCards[0];
    return `${firstElOrderNum} - ${lastElOrderNum}`;
  }

  toggleHideTags(filter) {
    this.blockData = {
      ...this.blockData,
      filters: this.blockData.filters.map((filterItem) => {
        if (filterItem.key === filter.key) {
          filterItem.hideTags = !filterItem.hideTags;
        }
        return filterItem;
      }),
    };
  }

  get filters() {
    if (!this.blockData.filters.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.filters,
      (filter) => filter.key,
      (filter) => {
        const selectedTagsData = this.countSelectedTags(filter.key);
        const { tagsCount } = selectedTagsData;

        return html`
          <div class="filter">
            <button class="filter-header" @click=${(e) => this.toggleFilter(e.currentTarget.parentNode)} aria-label="${filter.value}">
              <span class="filter-label">${filter.value}</span>
              <span class="filter-chevron-icon"></span>
            </button>
            <button class="filter-selected-tags-count-btn ${tagsCount ? '' : 'hidden'}" @click="${() => this.handleResetTags(filter.key)}" aria-label="${tagsCount}">
              <span class="filter-selected-tags-total-num">${tagsCount}</span>
            </button>
            <ul class="filter-list">
              ${this.blockData.filtersInfos[filter.key] ? html`<div class="filter-info">
                  <div class="info-icon" style="background-image: url('/edsdme/img/icons/info.svg')"></div>
                 <span class="filter-info-text"> ${this.blockData.filtersInfos[filter.key]}</span> </div>`
    : ''}
              <sp-theme theme="spectrum" color="light" scale="medium">
                ${this.getTagsByFilter(filter)}
                <a class="hide-filter-option"
                   href="#"
                   @click=${(event) => { event.preventDefault(); this.toggleHideTags(filter); }}
                   ?hidden=${!filter.hasHiddenTags}>
                  ${filter.hideTags ? this.blockData.localizedText['{{show-more}}']
    : this.blockData.localizedText['{{show-less}}']}</a>
              </sp-theme>
            </ul>
          </div>`;
      },
    )}`;
  }

  getTotalResults() {
    return this.cards?.length;
  }

  // eslint-disable-next-line class-methods-use-this
  handleMobileFilterBackdropClick(e) {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('expanded');
    }
  }

  get filtersMobile() {
    if (!this.blockData.filters.length) return;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      this.blockData.filters,
      (filter) => filter.key,
      (filter) => {
        const selectedTagsData = this.countSelectedTags(filter.key);
        const { tagsCount } = selectedTagsData;

        /* eslint-disable indent */
        return html`
          <div class="filter-wrapper-mobile" @click=${this.handleMobileFilterBackdropClick}>
            <div class="filter-mobile">
              <button class="filter-header-mobile" @click=${(e) => this.toggleFilter(e.target.closest('.filter-wrapper-mobile'))} aria-label="${filter.value}">
                <div class="filter-header-content-mobile">
                  <h3 class="filter-header-name-mobile">${filter.value}</h3>
                  ${tagsCount
            ? html`<div class="filter-header-selected-tags-count-mobile">${tagsCount}</div>`
            : ''
          }
                </div>
                <span class="filter-header-chevron-icon"></span>
              </button>
              ${this.blockData.filtersInfos[filter.key] ? html`<div class="filter-info">
                  <div class="info-icon" style="background-image: url('/edsdme/img/icons/info.svg')"></div>
                 <span class="filter-info-text"> ${this.blockData.filtersInfos[filter.key]}</span> </div>`
                : ''}
              <ul class="filter-tags-mobile">
                <sp-theme theme="spectrum" color="light" scale="medium">
                  ${this.getTagsByFilter(filter)}
                </sp-theme>
              </ul>
              <div class="filter-footer-mobile-wrapper">
                <div class="filter-footer-mobile">
                  <span class="filter-footer-results-mobile">${this.getTotalResults()} ${this.blockData.localizedText['{{results}}']}</span>
                  <div class="filter-footer-buttons-mobile">
                    <button class="filter-footer-clear-btn-mobile" @click="${() => this.handleResetTags(filter.key)}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
                    <sp-theme theme="spectrum" color="light" scale="medium">
                      <sp-button @click=${(e) => this.toggleFilter(e.target.closest('.filter-wrapper-mobile'))} aria-label="${this.blockData.localizedText['{{apply}}']}">${this.blockData.localizedText['{{apply}}']}</sp-button>
                    </sp-theme>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        /* eslint-enable indent */
      },
    )}`;
  }

  get chosenFilters() {
    const extractedTags = Object.values(this.selectedFilters).flatMap((tagsArray) => tagsArray);
    if (!extractedTags.length) return;

    const htmlContent = html`${repeat(
      extractedTags.sort((a, b) => a.value.localeCompare(b.value)),
      (tag) => tag.key,
      (tag) => html`
        <button class="${this.mobileView ? 'chosen-filter-btn-mobile' : 'sidebar-chosen-filter-btn'}" @click="${() => this.handleRemoveTag(tag)}" aria-label="${tag.value}">
          ${tag.value}
        </button>`,
    )}`;

    // eslint-disable-next-line consistent-return
    return { htmlContent, tagsCount: extractedTags.length };
  }

  getTagsByFilter(filter) {
    const { tags } = filter;

    return html`${repeat(
      tags.filter(
        (tag) => (this.mobileView || (tag.initialHidden && !filter.hideTags) || !tag.initialHidden),
      ),
      (tag) => tag.key,
      (tag) => html`<li><sp-checkbox
        size="m" emphasized
        ?checked=${tag.checked}
        @change=${(event) => this.handleTag(event, tag, filter.key)}
      >
        ${tag.value}
      </sp-checkbox></li>`,
    )}`;
  }

  toggleSort() {
    const element = this.querySelector('.sort-list');
    element.classList.toggle('expanded');
  }

  // eslint-disable-next-line class-methods-use-this
  toggleFilter(clickedFilter) {
    clickedFilter.classList.toggle('expanded');
  }

  openFiltersMobile() {
    const element = this.querySelector('.all-filters-wrapper-mobile');
    element.classList.add('open');
  }

  closeFiltersMobile() {
    const element = this.querySelector('.all-filters-wrapper-mobile');
    element.classList.remove('open');
  }

  handleActions() {
    this.handleSearchAction();
    if (this.blockData.sort.items.length) this.handleSortAction();
    if (this.blockData.filters.length) this.handleFilterAction();
    this.additionalActions();
    // eslint-disable-next-line no-return-assign
    this.cards.forEach((card, index) => card.orderNum = index + 1);
    this.updatePaginatedCards();
  }

  // eslint-disable-next-line class-methods-use-this
  additionalActions() {}

  handleResetActions() {
    this.searchTerm = '';
    this.urlSearchParams.delete('term');
    this.selectedFilters = {};
    this.blockData.filters.forEach((filter) => {
      // eslint-disable-next-line no-return-assign
      filter.tags.forEach((tag) => tag.checked = false);
      this.urlSearchParams.delete(filter.key);
    });
    this.additionalResetActions();
    this.paginationCounter = 1;
    this.handleActions();
    this.handleFilterAction();
    this.handleUrlSearchParams();
  }

  // eslint-disable-next-line class-methods-use-this
  additionalResetActions() {}

  handleSearchAction() {
    // eslint-disable-next-line max-len
    this.cards = this.allCards.filter((card) => card.contentArea?.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      || card.contentArea?.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }

  handleSearch(event) {
    this.searchTerm = event.target.value;
    if (this.searchTerm) {
      this.urlSearchParams.set('term', this.searchTerm);
    } else {
      this.urlSearchParams.delete('term');
    }
    this.handleUrlSearchParams();
    this.paginationCounter = 1;
    this.handleActions();
  }

  handleSortAction() {
    const sortFunctions = {
      newest: (a, b) => new Date(b.cardDate) - new Date(a.cardDate),
      oldest: (a, b) => new Date(a.cardDate) - new Date(b.cardDate),
    };

    const sortKey = this.selectedSortOrder.key === 'most-recent' ? 'newest' : this.selectedSortOrder.key;
    this.cards.sort(sortFunctions[sortKey]);
  }

  handleSort(selectedItem) {
    this.toggleSort();

    if (selectedItem.key !== this.selectedSortOrder.key) {
      this.selectedSortOrder = selectedItem;

      this.paginationCounter = 1;
      this.handleActions();
    }
  }

  handleFilterAction() {
    const selectedFiltersKeys = Object.keys(this.selectedFilters);
    if (selectedFiltersKeys.length) {
      this.cards = this.cards.filter((card) => {
        if (!card.arbitrary.length) return;

        let cardArbitraryArr = [...card.arbitrary];
        const firstObj = card.arbitrary[0];
        if ('id' in firstObj && 'version' in firstObj) {
          cardArbitraryArr = cardArbitraryArr.slice(1);
        }
        // eslint-disable-next-line consistent-return
        return selectedFiltersKeys.every((key) => cardArbitraryArr.some((arbitraryTag) => {
          const arbitraryTagKey = Object.keys(arbitraryTag)[0]?.replaceAll(' ', '-');
          if (arbitraryTagKey !== key) return false;

          const arbitraryTagValue = this.getArbitraryTagValue(arbitraryTag, key);
          if (arbitraryTagValue) {
            // eslint-disable-next-line max-len
            return this.selectedFilters[key].some((selectedTag) => selectedTag.key === arbitraryTagValue);
          }
          return false;
        }));
      });
    } else {
      this.urlSearchParams.delete('filters');
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getArbitraryTagValue(arbitraryTag, key) {
    return arbitraryTag[key].replaceAll(' ', '-');
  }

  handleUrlSearchParams() {
    const url = new URL(window.location.href);

    const searchParamsString = this.urlSearchParams.toString();
    if (searchParamsString.length) {
      url.search = decodeURIComponent(searchParamsString);
    } else {
      url.search = '';
    }

    window.history.replaceState({}, '', url);
  }

  handleTag(event, tag, filterKey) {
    if (!event.target.checked) {
      this.handleRemoveTag(tag);
      if (!Object.keys(this.selectedFilters).length) {
        this.handleFilterAction();
        this.handleUrlSearchParams();
      }
      return;
    }

    tag.checked = true;

    if (this.selectedFilters[filterKey]) {
      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: [...this.selectedFilters[filterKey], tag],
      };

      let filterSearchValue = this.urlSearchParams.get(filterKey);
      filterSearchValue += tag.paramValue ? `,${tag.paramValue}` : `,${tag.key}`;
      this.urlSearchParams.set(filterKey, filterSearchValue);
    } else {
      if (!Object.keys(this.selectedFilters).length) {
        this.urlSearchParams.append('filters', 'yes');
      }

      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: [tag],
      };

      const tagParamValue = tag.paramValue ? tag.paramValue : tag.key;
      this.urlSearchParams.append(filterKey, tagParamValue);
    }

    this.paginationCounter = 1;
    this.handleActions();
    this.handleUrlSearchParams();
  }

  handleRemoveTag(tag) {
    tag.checked = false;
    const { key: tagKey, parentKey: filterKey, paramValue } = tag;

    // eslint-disable-next-line max-len
    const updatedFilterTags = [...this.selectedFilters[filterKey]].filter((filterTag) => filterTag.key !== tagKey);

    if (updatedFilterTags.length) {
      this.selectedFilters = {
        ...this.selectedFilters,
        [filterKey]: updatedFilterTags,
      };

      const filterSearchParams = this.urlSearchParams.get(filterKey).split(',');
      // eslint-disable-next-line max-len
      const updatedSearchFilterTags = filterSearchParams.filter((param) => param !== paramValue && param !== tagKey);
      this.urlSearchParams.set(filterKey, updatedSearchFilterTags.toString());
    } else {
      const { [filterKey]: _removedKeyFilters, ...updatedSelectedFilters } = this.selectedFilters;
      this.selectedFilters = updatedSelectedFilters;
      this.urlSearchParams.delete(filterKey);
    }

    this.paginationCounter = 1;
    this.handleFilterAction();
    this.handleActions();
    this.handleUrlSearchParams();
  }

  handleResetTags(filterKey) {
    const { [filterKey]: _removedKeyFilters, ...updatedSelectedFilters } = this.selectedFilters;
    this.selectedFilters = { ...updatedSelectedFilters };
    this.urlSearchParams.delete(filterKey);

    this.blockData.filters.forEach((filter) => {
      if (filter.key === filterKey) {
        // eslint-disable-next-line no-return-assign
        filter.tags.forEach((tag) => tag.checked = false);
      }
    });

    this.paginationCounter = 1;
    this.handleFilterAction();
    this.handleActions();
    this.handleUrlSearchParams();
  }

  countSelectedTags(filterKey) {
    if (!this.selectedFilters[filterKey]) {
      return {
        tagsString: '',
        tagsCount: 0,
      };
    }

    const tags = [...this.selectedFilters[filterKey]].map((tag) => tag.value);
    return {
      tagsString: tags.join(', '),
      tagsCount: tags.length,
    };
  }

  updatePaginatedCards() {
    const endIndex = this.paginationCounter * this.cardsPerPage;
    const startIndex = this.blockData.pagination === 'load-more' ? 0 : (this.paginationCounter - 1) * this.cardsPerPage;
    this.paginatedCards = this.cards.slice(startIndex, endIndex);
  }

  handleLoadMore() {
    this.paginationCounter += 1;
    this.handleActions();
  }

  handlePageNum(pageNum) {
    if (this.paginationCounter !== pageNum) {
      this.paginationCounter = pageNum;
      this.handleActions();
    }
  }

  handlePrevPage() {
    if (this.paginationCounter > 1) {
      this.paginationCounter -= 1;
      this.handleActions();
    }
  }

  handleNextPage() {
    if (this.paginationCounter < this.totalPages) {
      this.paginationCounter += 1;
      this.handleActions();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.updateView);
  }

  renderInfoBoxDescription() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.blockData.filterInfoBox.description;
    return html`${tempDiv}`;
  }

  // eslint-disable-next-line class-methods-use-this
  getSlider() {}

  get filtersLabel() {
    return Object.keys(this.selectedFilters).length > 0
      ? Object.values(this.selectedFilters).flat().map((item) => item.value).join(', ')
      : 'No Filters';
  }

  /* eslint-disable indent */
  render() {
    return html`
      ${this.fetchedData
        ? html`
          <div
            class="partner-cards"
            daa-lh="Card Collection | Filters: ${processTrackingLabels(this.filtersLabel)} | Search Query: ${processTrackingLabels(this.searchTerm.trim() ? this.searchTerm : 'None')}"
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
                      class="pagination-total-results">${this.cardsCounter} ${this.blockData.localizedText['{{of}}']} ${this.cards.length} ${this.blockData.localizedText['{{results}}']}</span>
                  </div>
                `
                : ''
              }
            </div>
          </div>` : ''}
      ${this.getFilterFullScreenView(this.mobileView && this.fetchData)}
    `;
  }

  shouldDisplayPagination() {
    return this.cards.length;
  }

  getFilterFullScreenView(condition) {
    return condition ? html`
          <div class="all-filters-wrapper-mobile">
            <div class="all-filters-header-mobile">
              <button class="all-filters-header-back-btn-mobile" @click="${this.closeFiltersMobile}" aria-label="${this.blockData.localizedText['{{back}}']}"></button>
              <span class="all-filters-header-title-mobile">${this.blockData.localizedText['{{filter-by}}']}</span>
            </div>
            ${this.chosenFilters
        ? html`<div class="all-filter-chosen-filters-wrapper-mobile">
              ${this.chosenFilters.htmlContent}
            </div>` : ''}
            <div class="all-filters-list-mobile">
              ${this.filtersMobile}
            </div>
            <div class="all-filters-footer-mobile">
              <span class="all-filters-footer-results-mobile">${this.getTotalResults()} ${this.blockData.localizedText['{{results}}']}</span>
              <div class="all-filters-footer-buttons-mobile">
                <button class="all-filters-footer-clear-btn-mobile" @click="${this.handleResetActions}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
                <sp-theme theme="spectrum" color="light" scale="medium">
                  <sp-button @click="${this.closeFiltersMobile}" aria-label="${this.blockData.localizedText['{{apply}}']}">${this.blockData.localizedText['{{apply}}']}</sp-button>
                </sp-theme>
              </div>
            </div>
          </div>
        `
        : '';
  }

  getPartnerCardsHeader() {
    return html`
      <div class="partner-cards-header">
        <div class="partner-cards-title-wrapper">
          <h3 class="partner-cards-title">${this.blockData.title}</h3>
          <span
            class="partner-cards-cards-results"><strong>${this.cards?.length}</strong> ${this.blockData.localizedText['{{results}}']}</span>
        </div>
        <div class="partner-cards-sort-wrapper">
          ${this.mobileView
            ? html`
              <button class="filters-btn-mobile" @click="${this.openFiltersMobile}"
                      aria-label="${this.blockData.localizedText['{{filters}}']}">
                <span class="filters-btn-mobile-icon"></span>
                <span class="filters-btn-mobile-title">${this.blockData.localizedText['{{filters}}']}</span>
                ${this.chosenFilters?.tagsCount
                  ? html`<span class="filters-btn-mobile-total">${this.chosenFilters.tagsCount}</span>`
                  : ''
                }
              </button>
            `
            : ''
          }
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
              </div>`
            : ''
          }
        </div>
      </div>
    `;
  }

  /* eslint-enable indent */
}

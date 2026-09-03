import { getLibs } from '../../scripts/utils.js';
import PartnerCards, { filterRestrictedCardsByCurrentSite } from '../../components/PartnerCards.js';

const miloLibs = getLibs();
const { html, repeat } = await import(`${miloLibs}/deps/lit-all.min.js`);

export function filterExpiredAnnouncements(cards, blockData) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 180);
  return cards.filter((card) => {
    const isNeverExpires = card.tags.some((tag) => tag.id === 'caas:adobe-partners/collections/announcements/never-expires');
    if (isNeverExpires) return !blockData.isArchive;
    const cardDate = new Date(card.cardDate);
    const cardEndDate = card.endDate ? new Date(card.endDate) : null;
    console.log('End data for card:', cardEndDate, card.contentArea.title, cardDate.toString(), card.id, 'API URL:', window.location);
    const now = Date.now();
    if (blockData.isArchive) {
      return cardEndDate ? cardEndDate < now : cardDate <= startDate;
    }
    return cardEndDate ? cardEndDate >= now : cardDate > startDate;
  });
}

export default class Announcements extends PartnerCards {
  static properties = {
    ...PartnerCards.properties,
    selectedDateFilter: { type: Object },
  };

  constructor() {
    super();
    this.selectedDateFilter = {};
  }

  additionalFirstUpdated() {
    this.allCards = filterExpiredAnnouncements(this.allCards, this.blockData);

    if (this.blockData.dateFilter) {
      const [firstDateFilter] = this.blockData.dateFilter.tags;
      this.selectedDateFilter = firstDateFilter;
    }
  }

  get dateFilter() {
    const { dateFilter: filter } = this.blockData;

    return html`
      <div class="filter">
        <button class="filter-header" @click=${(e) => this.toggleFilter(e.currentTarget.parentNode)} aria-label="${filter.value}">
          <span class="filter-label">${filter.value}</span>
          <sp-icon-chevron-down class="filter-chevron-icon" />
        </button>
        <button class="filter-selected-tags-count-btn ${this.selectedDateFilter.default || !Object.keys(this.selectedDateFilter).length ? 'hidden' : ''}" @click="${() => this.handleResetDateTags(filter.tags)}" aria-label="${this.selectedDateFilter.default ? 0 : 1}">
          <span class="filter-selected-tags-total-num">1</span>
        </button>
        <ul class="filter-list">
          <sp-theme theme="spectrum" color="light" scale="medium">
            ${this.getDateFilterTags(filter)}
          </sp-theme>
        </ul>
      </div>
    `;
  }

  get filters() {
    return html`
      ${this.dateFilter}
      ${super.filters}
    `;
  }

  get dateFilterMobile() {
    const { dateFilter: filter } = this.blockData;

    /* eslint-disable indent */
    return html`
      <div class="filter-wrapper-mobile">
        <div class="filter-mobile">
          <button class="filter-header-mobile" @click=${(e) => this.toggleFilter(e.target.closest('.filter-wrapper-mobile'))} aria-label="${filter.value}">
            <div class="filter-header-content-mobile">
              <h3 class="filter-header-name-mobile">${filter.value}</h3>
                ${this.selectedDateFilter.default
        ? ''
        : html`<span class="filter-header-selected-tags-count-mobile">1</span>`
      }
            </div>
            <sp-icon-chevron-down class="filter-header-chevron-icon" />
          </button>
          <ul class="filter-tags-mobile">
            <sp-theme theme="spectrum" color="light" scale="medium">
              ${this.getDateFilterTags(filter)}
            </sp-theme>
          </ul>
          <div class="filter-footer-mobile-wrapper">
            <div class="filter-footer-mobile">
              <span class="filter-footer-results-mobile">${this.cards?.length} ${this.blockData.localizedText['{{results}}']}</span>
              <div class="filter-footer-buttons-mobile">
                <button class="filter-footer-clear-btn-mobile" @click="${() => this.handleResetDateTags(filter.tags)}" aria-label="${this.blockData.localizedText['{{clear-all}}']}">${this.blockData.localizedText['{{clear-all}}']}</button>
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
  }

  get filtersMobile() {
    return html`
      ${this.dateFilterMobile}
      ${super.filtersMobile}
    `;
  }

  get chosenFilters() {
    const parentChosenFilters = super.chosenFilters;
    if (!parentChosenFilters && this.selectedDateFilter.default) return;

    let htmlContent = parentChosenFilters ? parentChosenFilters.htmlContent : '';
    let tagsCount = parentChosenFilters ? parentChosenFilters.tagsCount : 0;

    if (!this.selectedDateFilter.default && Object.keys(this.selectedDateFilter).length) {
      htmlContent = html`
        <button class="${this.mobileView ? 'chosen-filter-btn-mobile' : 'sidebar-chosen-filter-btn'}" @click="${() => this.handleResetDateTags(this.blockData.dateFilter.tags)}" aria-label="${this.selectedDateFilter.value}">
          ${this.selectedDateFilter.value}
        </button>
        ${htmlContent}
      `;
      tagsCount += 1;
    }

    // eslint-disable-next-line consistent-return
    return { htmlContent, tagsCount };
  }

  get filtersLabel() {
    const parentLabel = super.filtersLabel;
    // eslint-disable-next-line max-len
    const isDateActive = !this.selectedDateFilter.default && Object.keys(this.selectedDateFilter).length;
    if (!isDateActive) return parentLabel;
    return parentLabel === 'No Filters'
      ? this.selectedDateFilter.value
      : `${this.selectedDateFilter.value}, ${parentLabel}`;
  }

  getDateFilterTags(filter) {
    if (filter.key !== 'date') return;

    const { tags } = filter;

    // eslint-disable-next-line consistent-return
    return html`${repeat(
      tags,
      (tag) => tag.key,
      (tag) => html`<li>
        <button class="date-filter-tag" @click="${() => this.handleDateTag(tags, tag)}" aria-label="${tag.value}">
          <span class="date-filter-tag-label">${tag.value}</span>
          ${tag.checked ? html`<sp-icon-checkmark300 class="date-filter-tag-checkmark" />` : ''}
        </button>
      </li>`,
    )}`;
  }

  handleFilterAction() {
    super.handleFilterAction();
    // eslint-disable-next-line max-len
    const isDateActive = !this.selectedDateFilter.default && Object.keys(this.selectedDateFilter).length;
    if (isDateActive && !this.urlSearchParams.has('filters')) {
      this.urlSearchParams.append('filters', 'yes');
    }
  }

  additionalActions() {
    this.handleDateFilterAction();
  }

  additionalResetActions() {
    this.initDateTags(this.blockData.dateFilter.tags);
    this.urlSearchParams.delete('date');
  }

  initUrlSearchParams() {
    super.initUrlSearchParams();

    if (!this.blockData.dateFilter || !this.urlSearchParams.has('date')) return;
    const dateKey = this.urlSearchParams.get('date');
    const dateTag = this.blockData.dateFilter.tags.find((t) => t.key === dateKey);
    if (dateTag) {
      this.initDateTags(this.blockData.dateFilter.tags);
      dateTag.checked = true;
      this.selectedDateFilter = dateTag;
    }
  }

  handleDateTag(tags, tag) {
    if (tag.checked) {
      this.initDateTags(tags);
      this.urlSearchParams.delete('date');
      if (!Object.keys(this.selectedFilters).length && !this.urlSearchParams.has('term')) {
        this.urlSearchParams.delete('filters');
      }
    } else {
      this.selectedDateFilter = tag;
      // eslint-disable-next-line no-return-assign
      tags.forEach((filterTag) => filterTag.checked = filterTag.key === tag.key);
      if (tag.default) {
        this.urlSearchParams.delete('date');
        if (!Object.keys(this.selectedFilters).length && !this.urlSearchParams.has('term')) {
          this.urlSearchParams.delete('filters');
        }
      } else {
        if (!this.urlSearchParams.has('filters')) this.urlSearchParams.append('filters', 'yes');
        this.urlSearchParams.set('date', tag.key);
      }
    }

    this.paginationCounter = 1;
    this.handleUrlSearchParams();
    this.handleActions();
  }

  initDateTags(tags) {
    tags.forEach((filterTag, index) => {
      if (index === 0) {
        filterTag.checked = true;
        this.selectedDateFilter = filterTag;
      } else {
        filterTag.checked = false;
      }
    });
  }

  handleResetDateTags(tags) {
    this.initDateTags(tags);
    this.urlSearchParams.delete('date');
    if (!Object.keys(this.selectedFilters).length && !this.urlSearchParams.has('term')) {
      this.urlSearchParams.delete('filters');
    }
    this.handleUrlSearchParams();
    this.handleActions();
  }

  handleDateFilterAction() {
    const { key } = this.selectedDateFilter;
    const currentDate = new Date();

    if (key === 'current-month' || key === 'previous-month') {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      let targetMonth = currentMonth;
      let targetYear = currentYear;

      if (key === 'previous-month') {
        targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      }

      this.cards = this.cards.filter((card) => {
        const cardDate = new Date(card.cardDate);
        const cardMonth = cardDate.getMonth();
        const cardYear = cardDate.getFullYear();
        return cardMonth === targetMonth && cardYear === targetYear;
      });
    }

    if (key === 'last-90-days') {
      currentDate.setHours(0, 0, 0, 0);
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - 90);

      this.cards = this.cards.filter((card) => {
        const cardDate = new Date(card.cardDate);
        return cardDate >= startDate && cardDate <= currentDate;
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  onDataFetched(apiData) {
    // Filter announcements by current site
    apiData.cards = filterRestrictedCardsByCurrentSite(apiData.cards);
  }
}

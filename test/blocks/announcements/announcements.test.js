import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../edsdme/blocks/announcements/announcements.js';
import PartnerCards from '../../../edsdme/components/PartnerCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const cards = JSON.parse(cardsString);

describe('announcements block', () => {
  beforeEach(async () => {
    sinon.stub(PartnerCards.prototype, 'fetchData').resolves({ cards });

    // eslint-disable-next-line no-underscore-dangle
    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 1);
      this.hasResponseData = true;
      this.fetchedData = true;
    });

    await import('../../../edsdme/scripts/scripts.js');
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    PartnerCards.prototype.fetchData.restore();
    PartnerCards.prototype.firstUpdated.restore();
  });

  const setupAndCommonTest = async (windowWidth) => {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth });

    const block = document.querySelector('.announcements');
    expect(block).to.exist;

    const component = await init(block);
    expect(component).to.exist;

    const announcementsWrapper = document.querySelector('.announcements-wrapper');
    expect(announcementsWrapper).to.exist;
    const partnerCardsCollection = announcementsWrapper.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    expect(partnerCardsCollection.innerHTML).to.include('single-partner-card');
    const firstCard = partnerCardsCollection.querySelector('.card-wrapper');
    expect(firstCard).to.exist;
    const searchBarWrapper = announcementsWrapper.querySelector('.partner-cards-sidebar .search-wrapper');
    expect(searchBarWrapper).to.exist;
    const spectrumSearch = searchBarWrapper.querySelector('#search');
    expect(spectrumSearch).to.exist;
    const paginationWrapper = announcementsWrapper.querySelector('.partner-cards-content .pagination-wrapper');
    expect(paginationWrapper).to.exist;
    const loadMoreBtn = announcementsWrapper.querySelector('.partner-cards-content .pagination-wrapper .load-more-btn');
    expect(loadMoreBtn).to.exist;
    const sortWrapper = announcementsWrapper.querySelector('.partner-cards-content .sort-wrapper');
    expect(sortWrapper).to.exist;
    const firstSortItem = sortWrapper.querySelector('.sort-list .sort-item');
    expect(firstSortItem).to.exist;

    return { announcementsWrapper };
  };

  it('should render partner cards for mobile', async () => {
    const { announcementsWrapper } = await setupAndCommonTest(500);

    const filtersBtn = announcementsWrapper.querySelector('.filters-btn-mobile');
    expect(filtersBtn).to.exist;
    const filtersWrapper = announcementsWrapper.querySelector('.all-filters-wrapper-mobile');
    expect(filtersWrapper).to.exist;
    const firstFilter = filtersWrapper.querySelector('.filter-wrapper-mobile');
    expect(firstFilter).to.exist;
  });

  it('should remove expanded class when clicking mobile filter backdrop', async () => {
    const { announcementsWrapper } = await setupAndCommonTest(500);
    const filtersWrapper = announcementsWrapper.querySelector('.all-filters-wrapper-mobile');
    const filterWrapperMobile = filtersWrapper.querySelector('.filter-wrapper-mobile');
    expect(filterWrapperMobile).to.exist;

    filterWrapperMobile.classList.add('expanded');
    expect(filterWrapperMobile.classList.contains('expanded')).to.be.true;

    const backdropClickEvent = {
      target: filterWrapperMobile,
      currentTarget: filterWrapperMobile,
    };
    announcementsWrapper.handleMobileFilterBackdropClick(backdropClickEvent);
    expect(filterWrapperMobile.classList.contains('expanded')).to.be.false;
  });
  it('should render partner cards for desktop', async () => {
    const { announcementsWrapper } = await setupAndCommonTest(1500);

    const sidebarFiltersWrapper = announcementsWrapper.querySelector('.sidebar-filters-wrapper');
    expect(sidebarFiltersWrapper).to.exist;
    const firstFilter = sidebarFiltersWrapper.querySelector('.filter');
    expect(firstFilter).to.exist;
  });

  it('should contain announcements cards analytics attributes', async () => {
    const block = document.querySelector('.announcements');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const partnerNewsWrapper = document.querySelector('.announcements-wrapper');
    expect(partnerNewsWrapper).to.exist;

    expect(partnerNewsWrapper.getAttribute('daa-lh')).to.equal('Partner Announcements Cards');

    const partnerCards = partnerNewsWrapper.querySelector('.partner-cards');
    expect(partnerCards.getAttribute('daa-lh')).to.equal('Card Collection | Filters: No Filters | Search Query: None');

    const firstCard = partnerCards.querySelector('.card-wrapper');
    expect(firstCard.getAttribute('daa-lh')).to.equal(`Card 1 | ${cards[0].contentArea.title.trim()}`);

    const singlePartnerCardBtn = firstCard.querySelector('.card-btn');
    expect(singlePartnerCardBtn.getAttribute('daa-ll')).to.equal(singlePartnerCardBtn.textContent);
  });

  it('should contain announcements cards analytics attributes with filtering and search', async () => {
    const block = document.querySelector('.announcements');
    expect(block).to.exist;
    PartnerCards.prototype.firstUpdated.restore();

    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 1);
      this.hasResponseData = true;
      this.fetchedData = true;
      this.searchTerm = 'Adobe';
      this.selectedFilters = { 'content-type': { checked: true, hash: '37mr/hvv', key: 'event-session', parentKey: 'content-type', value: 'Event Session' } };
    });

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const partnerNewsWrapper = document.querySelector('.announcements-wrapper');
    expect(partnerNewsWrapper).to.exist;

    const partnerCards = partnerNewsWrapper.querySelector('.partner-cards');
    expect(partnerCards).to.exist;
    expect(partnerCards.getAttribute('daa-lh')).to.equal('Card Collection | Filters: Event Session | Search Query: Adobe');
  });

  it('should call window.history.replaceState when updating URL search params', async () => {
    const replaceStateStub = sinon.stub(window.history, 'replaceState');

    const block = document.querySelector('.announcements');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const announcementsWrapper = document.querySelector('.announcements-wrapper');
    expect(announcementsWrapper).to.exist;

    // Initialize urlSearchParams if not already done (since firstUpdated is stubbed)
    if (!announcementsWrapper.urlSearchParams || typeof announcementsWrapper.urlSearchParams.set !== 'function') {
      announcementsWrapper.urlSearchParams = new URLSearchParams();
    }

    // Call handleSearch directly to test handleUrlSearchParams
    const searchEvent = { target: { value: 'test search' } };

    announcementsWrapper.handleSearch(searchEvent);
    await component.updateComplete;

    // Verify that replaceState was called
    expect(replaceStateStub.called).to.be.true;

    // Verify the URL includes the search term
    const calls = replaceStateStub.getCalls();
    const lastCall = calls[calls.length - 1];
    if (lastCall) {
      const [state, title, url] = lastCall.args;
      expect(state).to.deep.equal({});
      expect(title).to.equal('');
      expect(url.toString()).to.include('term=test');
    }

    replaceStateStub.restore();
  });

  describe('date filter URL sync', () => {
    let component;
    let announcementsWrapper;
    let replaceStateStub;

    beforeEach(async () => {
      replaceStateStub = sinon.stub(window.history, 'replaceState');
      const block = document.querySelector('.announcements');
      component = await init(block);
      await component.updateComplete;
      announcementsWrapper = document.querySelector('.announcements-wrapper');
      announcementsWrapper.urlSearchParams = new URLSearchParams();
      const [firstTag] = announcementsWrapper.blockData.dateFilter.tags;
      announcementsWrapper.selectedDateFilter = firstTag;
    });

    afterEach(() => {
      replaceStateStub.restore();
    });

    it('should add date and filters params to URL when a date filter is selected', async () => {
      const { tags } = announcementsWrapper.blockData.dateFilter;
      const currentMonthTag = tags.find((t) => t.key === 'current-month');

      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;

      expect(announcementsWrapper.urlSearchParams.get('date')).to.equal('current-month');
      expect(announcementsWrapper.urlSearchParams.get('filters')).to.equal('yes');
      expect(replaceStateStub.called).to.be.true;
    });

    it('should remove date and filters params from URL when the active date filter is toggled off', async () => {
      const { tags } = announcementsWrapper.blockData.dateFilter;
      const currentMonthTag = tags.find((t) => t.key === 'current-month');

      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;
      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;

      expect(announcementsWrapper.urlSearchParams.has('date')).to.be.false;
      expect(announcementsWrapper.urlSearchParams.has('filters')).to.be.false;
    });

    it('should keep filters=yes in URL when deselecting date but other regular filters remain active', async () => {
      const { tags } = announcementsWrapper.blockData.dateFilter;
      const currentMonthTag = tags.find((t) => t.key === 'current-month');

      announcementsWrapper.selectedFilters = { applications: [{ key: 'sign', value: 'Sign' }] };
      announcementsWrapper.urlSearchParams.append('filters', 'yes');
      announcementsWrapper.urlSearchParams.set('applications', 'sign');

      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;
      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;

      expect(announcementsWrapper.urlSearchParams.has('date')).to.be.false;
      expect(announcementsWrapper.urlSearchParams.get('filters')).to.equal('yes');
    });

    it('should clear date param from URL and call replaceState when resetting date filter', async () => {
      const { tags } = announcementsWrapper.blockData.dateFilter;
      const currentMonthTag = tags.find((t) => t.key === 'current-month');

      announcementsWrapper.handleDateTag(tags, currentMonthTag);
      await component.updateComplete;
      replaceStateStub.resetHistory();

      announcementsWrapper.handleResetDateTags(tags);
      await component.updateComplete;

      expect(announcementsWrapper.urlSearchParams.has('date')).to.be.false;
      expect(replaceStateStub.called).to.be.true;
    });

    it('should restore date filter selection from URL on initUrlSearchParams', () => {
      window.history.pushState({}, '', '?filters=yes&date=last-90-days');
      announcementsWrapper.initUrlSearchParams();

      const { tags } = announcementsWrapper.blockData.dateFilter;
      const last90Tag = tags.find((t) => t.key === 'last-90-days');

      expect(last90Tag.checked).to.be.true;
      expect(announcementsWrapper.selectedDateFilter.key).to.equal('last-90-days');

      window.history.pushState({}, '', window.location.pathname);
    });

    it('should clear date param in additionalResetActions', () => {
      announcementsWrapper.urlSearchParams.set('date', 'previous-month');
      announcementsWrapper.additionalResetActions();

      expect(announcementsWrapper.urlSearchParams.has('date')).to.be.false;
    });
  });
});

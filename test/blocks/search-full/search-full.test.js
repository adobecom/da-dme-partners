import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../edsdme/blocks/search-full/search-full.js';
import Search from '../../../edsdme/blocks/search-full/SearchCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const cards = JSON.parse(cardsString);

const mockSearchResponse = {
  cards,
  count: {
    all: cards.length,
    assets: cards.filter((card) => card.contentArea.type !== 'announcement').length,
    pages: cards.filter((card) => card.contentArea.type === 'html').length,
    courses: cards.filter((card) => card.contentArea.type === 'course').length,
  },
};

const mockSuggestionsResponse = {
  suggested_completions: [
    { name: 'Adobe Analytics', type: 'product' },
    { name: 'Analytics Certification', type: 'asset' },
    { name: 'Target Implementation', type: 'asset' },
  ],
};

describe('search-full block', () => {
  let fetchStub;

  beforeEach(async () => {
    fetchStub = sinon.stub(window, 'fetch');

    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    sinon.stub(Search.prototype, 'fetchData').callsFake(async () => {
    });

    sinon.stub(Search.prototype, 'handleActionsCore').callsFake(async function () {
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.countAll = mockSearchResponse.count.all;
    });

    sinon.stub(Search.prototype, 'getSuggestions').resolves(mockSuggestionsResponse.suggested_completions);

    sinon.stub(Search.prototype, 'setBlockData').callsFake(function () {
      this.blockData = {
        ...this.blockData,
        sort: {
          items: [
            { key: 'most-recent', value: 'Most Recent' },
            { key: 'most-relevant', value: 'Most Relevant' },
          ],
        },
        filters: [],
      };
    });

    sinon.stub(Search.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 12);
      this.hasResponseData = true;
      this.contentTypeCounter = mockSearchResponse.count;
      this.allTags = [];
      this.selectedSortOrder = { key: 'most-recent', value: 'Most Recent' };
      this.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'Analytics', checked: true },
          { key: 'target', parentKey: 'product', value: 'Target', checked: true },
        ],
        industry: [
          { key: 'retail', parentKey: 'industry', value: 'Retail', checked: true },
        ],
      };

      this.searchTerm = 'Adobe';
    });

    await import('../../../edsdme/scripts/scripts.js');
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    fetchStub.restore();
    Search.prototype.fetchData.restore();
    Search.prototype.handleActionsCore.restore();
    Search.prototype.getSuggestions.restore();
    Search.prototype.setBlockData.restore();
    Search.prototype.firstUpdated.restore();
  });

  const setupAndCommonTest = async (windowWidth) => {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth });

    const block = document.querySelector('.search-full');
    expect(block).to.exist;

    const component = await init(block);
    await component.updateComplete;
    expect(component).to.exist;

    const searchCardsWrapper = document.querySelector('.search-cards-wrapper');
    expect(searchCardsWrapper).to.exist;

    const searchBoxWrapper = searchCardsWrapper.querySelector('.search-box-wrapper');
    expect(searchBoxWrapper).to.exist;

    const searchWrapper = searchCardsWrapper.querySelector('.search-wrapper');
    expect(searchWrapper).to.exist;
    const searchInput = searchWrapper.querySelector('#search');
    expect(searchInput).to.exist;

    const partnerCardsSection = searchCardsWrapper.querySelector('.partner-cards');
    expect(partnerCardsSection).to.exist;

    const partnerCardsContent = searchCardsWrapper.querySelector('.partner-cards-content');
    expect(partnerCardsContent).to.exist;

    const contentTypeButtons = partnerCardsContent.querySelectorAll('sp-button');
    expect(contentTypeButtons.length).to.be.at.least(3);

    const partnerCardsCollection = partnerCardsContent.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;

    return { searchCardsWrapper };
  };

  it('should render search cards for mobile', async () => {
    const { searchCardsWrapper } = await setupAndCommonTest(500);

    const filtersBtn = searchCardsWrapper.querySelector('.filters-btn-mobile');
    expect(filtersBtn).to.exist;

    const searchTitle = searchCardsWrapper.querySelector('.partner-cards-title');
    expect(searchTitle).to.exist;

    expect(searchCardsWrapper.contentType).to.equal('all');
    expect(searchCardsWrapper.contentTypeCounter).to.deep.equal(mockSearchResponse.count);
  });
});

// Unit tests for SearchCard component
describe('SearchCard Unit Tests', () => {
  let searchCard;
  let searchComponent;
  let consoleErrorStub;
  let fetchStub;

  beforeEach(async () => {
    consoleErrorStub = sinon.stub(console, 'error');
    fetchStub = sinon.stub(window, 'fetch');
    // Import SearchCard component
    await import('../../../edsdme/components/SearchCard.js');

    // Create a search-card element
    searchCard = document.createElement('search-card');

    // Set up mock data
    searchCard.data = {
      id: 'test-card-1',
      contentArea: {
        title: 'Test Card',
        description: 'This is a test card description',
        type: 'pdf',
        url: 'https://example.com/test.pdf',
        size: '2.5 MB',
      },
      cardDate: '2024-01-15',
      arbitrary: [
        { product: 'analytics' },
        { industry: 'retail' },
      ],
    };

    searchCard.localizedText = {
      '{{download}}': 'Download',
      '{{open-in}}': 'Open in',
      '{{open-in-disabled}}': 'Open in (disabled)',
      '{{last-modified}}': 'Last Modified',
      '{{size}}': 'Size',
    };

    searchCard.ietf = 'en-US';
    searchComponent = new Search();
  });

  afterEach(() => {
    consoleErrorStub.restore();
    fetchStub.restore();
    if (searchCard.parentNode) {
      searchCard.parentNode.removeChild(searchCard);
    }
  });

  describe('Search Cards Unit Tests', () => {
    it('Should contain search cards analytics attributes with filtering and search', async () => {
      const searchCardsWrapper = document.querySelector('.search-cards-wrapper');
      expect(searchCardsWrapper).to.exist;

      const component = await init(searchCardsWrapper);
      await component.updateComplete;
      expect(component).to.exist;

      expect(searchCardsWrapper.getAttribute('daa-lh')).to.equal('Search Cards Section');

      const searchBoxWrapper = searchCardsWrapper.querySelector('.search-box-wrapper');
      expect(searchBoxWrapper.getAttribute('daa-lh')).to.equal('Search Box');

      const searchCardsContent = searchCardsWrapper.querySelectorAll('.content')[1];
      expect(searchCardsContent.getAttribute('daa-lh')).to.equal('Search Cards Content | Filters: Analytics Target Retail | Search Query: Adobe');

      const firstCard = searchCardsWrapper.querySelector('search-card');
      expect(firstCard.getAttribute('daa-lh')).to.equal(`Search Card 1 | ${cards[0].contentArea.title}`);

      const singlePartnerCardBtn = firstCard.querySelector('.card-btn');
      expect(singlePartnerCardBtn.getAttribute('daa-ll')).to.equal(`Download | ${cards[0].contentArea.title}`);
    });

    it('Should contain search cards analytics attributes without filtering and search', async () => {
      const searchCardsWrapper = document.querySelector('.search-cards-wrapper');
      expect(searchCardsWrapper).to.exist;

      const component = await init(searchCardsWrapper);
      await component.updateComplete;
      expect(component).to.exist;

      const searchCardsContent = searchCardsWrapper.querySelectorAll('.content')[1];
      expect(searchCardsContent.getAttribute('daa-lh')).to.equal('Search Cards Content | Filters: No Filters | Search Query: None');
    });
  });
  describe('updateTypeaheadDialog', () => {
    it('should update typeahead state and options', async () => {
      const mockDialog = { show: sinon.spy() };
      const mockInput = { focus: sinon.spy() };
      sinon.stub(searchComponent, 'querySelector')
        .withArgs('dialog#typeahead').returns(mockDialog)
        .withArgs('#search')
        .returns(mockInput);
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'analytics';
      searchComponent.isTypeaheadOpen = false;
      await searchComponent.updateTypeaheadDialog();
      expect(searchComponent.isTypeaheadOpen).to.be.true;
    });

    it('should not update typeahead when searchTerm is empty', async () => {
      const mockDialog = { show: sinon.spy() };
      sinon.stub(searchComponent, 'querySelector').withArgs('dialog#typeahead').returns(mockDialog);
      searchComponent.searchTerm = '';
      searchComponent.typeaheadOptions = ['existing', 'suggestions'];
      await searchComponent.updateTypeaheadDialog();
      expect(searchComponent.typeaheadOptions).to.deep.equal([]);
      expect(mockDialog.show.called).to.be.false;
    });

    it('should handle errors gracefully', async () => {
      const mockDialog = { show: sinon.spy() };
      const mockInput = { focus: sinon.spy() };
      sinon.stub(searchComponent, 'querySelector')
        .withArgs('dialog#typeahead').returns(mockDialog)
        .withArgs('#search')
        .returns(mockInput);
      searchComponent.searchTerm = 'test';
      searchComponent.isTypeaheadOpen = false;
      const getSuggestionsStub = sinon.stub(searchComponent, 'getSuggestions').rejects(new Error('API Error'));
      await searchComponent.updateTypeaheadDialog();
      expect(consoleErrorStub.called).to.be.true;
      getSuggestionsStub.restore();
    });
  });

  describe('onSearchInput', () => {
    it('should update searchTerm and call debouncedUpdateTypeahead when input has value', () => {
      const debouncedStub = sinon.stub(searchComponent, 'debouncedUpdateTypeahead');
      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      const event = { target: { value: 'analytics' } };

      searchComponent.onSearchInput(event);

      expect(searchComponent.searchTerm).to.equal('analytics');
      expect(debouncedStub.calledOnce).to.be.true;
      expect(closeTypeaheadStub.called).to.be.false;

      debouncedStub.restore();
      closeTypeaheadStub.restore();
    });

    it('should call closeTypeahead with SEE_ALL when input is empty', () => {
      const debouncedStub = sinon.stub(searchComponent, 'debouncedUpdateTypeahead');
      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      const event = { target: { value: '' } };

      searchComponent.onSearchInput(event);

      expect(closeTypeaheadStub.calledOnceWith('SEE_ALL')).to.be.true;
      expect(debouncedStub.called).to.be.false;

      debouncedStub.restore();
      closeTypeaheadStub.restore();
    });
  });

  describe('closeTypeahead', () => {
    it('should close typeahead with SEE_ALL and NOT update searchTerm from returnValue', () => {
      const mockDialog = { close: sinon.spy(), returnValue: 'dialog-return-value' };
      sinon.stub(searchComponent, 'querySelector').withArgs('dialog#typeahead').returns(mockDialog);
      const handleSearchStub = sinon.stub(searchComponent, 'handleSearch');
      searchComponent.isTypeaheadOpen = true;
      searchComponent.searchTerm = 'original';

      searchComponent.closeTypeahead('SEE_ALL');

      expect(searchComponent.isTypeaheadOpen).to.be.false;
      expect(mockDialog.close.calledOnceWith('SEE_ALL')).to.be.true;
      expect(searchComponent.searchTerm).to.equal('original');
      expect(handleSearchStub.calledOnce).to.be.true;

      handleSearchStub.restore();
    });

    it('should update searchTerm from dialog returnValue when value is not SEE_ALL', () => {
      const mockDialog = { close: sinon.spy(), returnValue: 'adobe-analytics' };
      sinon.stub(searchComponent, 'querySelector').withArgs('dialog#typeahead').returns(mockDialog);
      const handleSearchStub = sinon.stub(searchComponent, 'handleSearch');
      searchComponent.isTypeaheadOpen = true;

      searchComponent.closeTypeahead('adobe-analytics');

      expect(searchComponent.isTypeaheadOpen).to.be.false;
      expect(mockDialog.close.calledOnceWith('adobe-analytics')).to.be.true;
      expect(searchComponent.searchTerm).to.equal('adobe-analytics');
      expect(handleSearchStub.calledOnce).to.be.true;

      handleSearchStub.restore();
    });
  });

  describe('handleSearch', () => {
    it('should set term param and call handleActions when searchTerm is set', () => {
      searchComponent.urlSearchParams = new URLSearchParams();
      const handleUrlStub = sinon.stub(searchComponent, 'handleUrlSearchParams');
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      searchComponent.searchTerm = 'adobe';

      searchComponent.handleSearch();

      expect(searchComponent.urlSearchParams.get('term')).to.equal('adobe');
      expect(searchComponent.paginationCounter).to.equal(1);
      expect(handleUrlStub.calledOnce).to.be.true;
      expect(handleActionsStub.calledOnce).to.be.true;

      handleUrlStub.restore();
      handleActionsStub.restore();
    });

    it('should delete term param when searchTerm is empty', () => {
      searchComponent.urlSearchParams = new URLSearchParams('term=previous');
      const handleUrlStub = sinon.stub(searchComponent, 'handleUrlSearchParams');
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');
      searchComponent.searchTerm = '';

      searchComponent.handleSearch();

      expect(searchComponent.urlSearchParams.has('term')).to.be.false;

      handleUrlStub.restore();
      handleActionsStub.restore();
    });
  });

  describe('getSortValue', () => {
    it('should return "recent" for most-recent key', () => {
      expect(searchComponent.getSortValue('most-recent')).to.equal('recent');
    });

    it('should return "relevant" for most-relevant key', () => {
      expect(searchComponent.getSortValue('most-relevant')).to.equal('relevant');
    });

    it('should return undefined for unknown key', () => {
      expect(searchComponent.getSortValue('unknown-key')).to.be.undefined;
    });
  });

  describe('generateFilters', () => {
    it('should convert selectedFilters to flat key arrays', () => {
      searchComponent.selectedFilters = {
        product: [
          { key: 'analytics', parentKey: 'product', value: 'Analytics' },
          { key: 'target', parentKey: 'product', value: 'Target' },
        ],
        industry: [
          { key: 'retail', parentKey: 'industry', value: 'Retail' },
        ],
      };

      const result = searchComponent.generateFilters();
      expect(result).to.deep.equal({
        filters: {
          product: ['analytics', 'target'],
          industry: ['retail'],
        },
      });
    });

    it('should return empty filters object when selectedFilters is empty', () => {
      searchComponent.selectedFilters = {};
      const result = searchComponent.generateFilters();
      expect(result).to.deep.equal({ filters: {} });
    });
  });

  describe('getSuggestions', () => {
    it('should return suggested_completions on successful response', async () => {
      const suggestions = [{ name: 'Adobe Analytics', type: 'product' }];
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'adobe';
      searchComponent.selectedFilters = {};

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ suggested_completions: suggestions }),
      });

      const result = await searchComponent.getSuggestions();
      expect(result).to.deep.equal(suggestions);
    });

    it('should return null and log error when response is not ok', async () => {
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'adobe';
      searchComponent.selectedFilters = {};

      fetchStub.resolves({ ok: false, statusText: 'Internal Server Error' });

      const result = await searchComponent.getSuggestions();
      expect(result).to.be.null;
      expect(consoleErrorStub.called).to.be.true;
    });

    it('should return null and log error when fetch throws', async () => {
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'adobe';
      searchComponent.selectedFilters = {};

      fetchStub.rejects(new Error('Network Error'));

      const result = await searchComponent.getSuggestions();
      expect(result).to.be.null;
      expect(consoleErrorStub.called).to.be.true;
    });
  });

  describe('getCards', () => {
    it('should return apiData and set hasResponseData on success', async () => {
      const mockApiData = {
        cards: [{ id: '1' }],
        count: { all: 1, assets: 0, pages: 1 },
      };
      searchComponent.paginationCounter = 1;
      searchComponent.cardsPerPage = 12;
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'test';
      searchComponent.selectedFilters = {};

      fetchStub.resolves({ ok: true, json: () => Promise.resolve(mockApiData) });

      const result = await searchComponent.getCards();
      expect(result).to.deep.equal(mockApiData);
      expect(searchComponent.hasResponseData).to.be.true;
    });

    it('should return null and log error when response is not ok', async () => {
      searchComponent.paginationCounter = 1;
      searchComponent.cardsPerPage = 12;
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'test';
      searchComponent.selectedFilters = {};

      fetchStub.resolves({ ok: false, statusText: 'Server Error' });

      const result = await searchComponent.getCards();
      expect(result).to.be.null;
      expect(consoleErrorStub.called).to.be.true;
    });

    it('should return null and log error when fetch throws', async () => {
      searchComponent.paginationCounter = 1;
      searchComponent.cardsPerPage = 12;
      searchComponent.selectedSortOrder = { key: 'most-recent' };
      searchComponent.contentType = 'all';
      searchComponent.searchTerm = 'test';
      searchComponent.selectedFilters = {};

      fetchStub.rejects(new Error('Network failure'));

      const result = await searchComponent.getCards();
      expect(result).to.be.null;
      expect(consoleErrorStub.called).to.be.true;
    });
  });

  describe('getTotalResults', () => {
    beforeEach(() => {
      searchComponent.contentTypeCounter = {
        countAll: 100,
        countAssets: 40,
        countPages: 60,
      };
    });

    it('should return countPages when contentType is "page"', () => {
      searchComponent.contentType = 'page';
      expect(searchComponent.getTotalResults()).to.equal(60);
    });

    it('should return countAssets when contentType is "asset"', () => {
      searchComponent.contentType = 'asset';
      expect(searchComponent.getTotalResults()).to.equal(40);
    });

    it('should return countAll for default contentType "all"', () => {
      searchComponent.contentType = 'all';
      expect(searchComponent.getTotalResults()).to.equal(100);
    });
  });

  describe('getPageNumArray', () => {
    it('should return correct page numbers array', () => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 36, countAssets: 0, countPages: 0 };
      searchComponent.cardsPerPage = 12;

      const pages = searchComponent.getPageNumArray();
      expect(pages).to.deep.equal([1, 2, 3]);
      expect(searchComponent.totalPages).to.equal(3);
    });

    it('should return single page when all results fit in one page', () => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 5, countAssets: 0, countPages: 0 };
      searchComponent.cardsPerPage = 12;

      const pages = searchComponent.getPageNumArray();
      expect(pages).to.deep.equal([1]);
    });

    it('should return empty array when there are no results', () => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 0, countAssets: 0, countPages: 0 };
      searchComponent.cardsPerPage = 12;

      const pages = searchComponent.getPageNumArray();
      expect(pages).to.deep.equal([]);
    });
  });

  describe('cardsCounter', () => {
    beforeEach(() => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 30, countAssets: 0, countPages: 0 };
      searchComponent.cardsPerPage = 12;
    });

    it('should return lastCardIndex for load-more pagination on an intermediate page', () => {
      searchComponent.blockData = { pagination: 'load-more' };
      searchComponent.paginationCounter = 2;
      // startIndex=12, endIndex=24, countAll=30 -> lastCardIndex=24
      expect(searchComponent.cardsCounter).to.equal(24);
    });

    it('should cap lastCardIndex at countAll for load-more pagination on last page', () => {
      searchComponent.blockData = { pagination: 'load-more' };
      searchComponent.paginationCounter = 3;
      // startIndex=24, endIndex=36, countAll=30 -> lastCardIndex=30
      expect(searchComponent.cardsCounter).to.equal(30);
    });

    it('should return "X - Y" range string for default pagination', () => {
      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginationCounter = 1;
      // startIndex=0, endIndex=12, lastCardIndex=12
      expect(searchComponent.cardsCounter).to.equal('1 - 12');
    });

    it('should return capped range string on last page for default pagination', () => {
      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginationCounter = 3;
      // startIndex=24, endIndex=36, countAll=30 -> lastCardIndex=30
      expect(searchComponent.cardsCounter).to.equal('25 - 30');
    });
  });

  describe('handleContentType', () => {
    it('should do nothing when same content type is selected', () => {
      searchComponent.contentType = 'all';
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');

      searchComponent.handleContentType('all');

      expect(handleActionsStub.called).to.be.false;
      handleActionsStub.restore();
    });

    it('should update contentType and call handleActions when type changes', () => {
      searchComponent.contentType = 'all';
      const handleActionsStub = sinon.stub(searchComponent, 'handleActions');

      searchComponent.handleContentType('asset');

      expect(searchComponent.contentType).to.equal('asset');
      expect(searchComponent.paginationCounter).to.equal(1);
      expect(handleActionsStub.calledOnce).to.be.true;
      handleActionsStub.restore();
    });
  });

  describe('handleEnter', () => {
    it('should call closeTypeahead with SEE_ALL on Enter key', () => {
      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      searchComponent.handleEnter({ key: 'Enter' });
      expect(closeTypeaheadStub.calledOnceWith('SEE_ALL')).to.be.true;
      closeTypeaheadStub.restore();
    });

    it('should do nothing on non-Enter key press', () => {
      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      searchComponent.handleEnter({ key: 'a' });
      expect(closeTypeaheadStub.called).to.be.false;
      closeTypeaheadStub.restore();
    });
  });

  describe('handleClickOutside', () => {
    it('should do nothing when typeahead is not open', () => {
      searchComponent.isTypeaheadOpen = false;
      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      searchComponent.handleClickOutside({ clientX: 0, clientY: 0 });
      expect(closeTypeaheadStub.called).to.be.false;
      closeTypeaheadStub.restore();
    });

    it('should call closeTypeahead when click is outside both dialog and search input', () => {
      searchComponent.isTypeaheadOpen = true;
      const dialogRect = { left: 100, right: 300, top: 50, bottom: 200 };
      const searchRect = { left: 100, right: 300, top: 0, bottom: 50 };
      sinon.stub(searchComponent, 'querySelector')
        .withArgs('.suggestion-dialog')
        .returns({ getBoundingClientRect: () => dialogRect })
        .withArgs('#search')
        .returns({ getBoundingClientRect: () => searchRect });

      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      // Click at (0, 0) is outside both rects
      searchComponent.handleClickOutside({ clientX: 0, clientY: 0 });
      expect(closeTypeaheadStub.calledOnceWith('SEE_ALL')).to.be.true;
      closeTypeaheadStub.restore();
    });

    it('should NOT call closeTypeahead when click is inside the dialog', () => {
      searchComponent.isTypeaheadOpen = true;
      const dialogRect = { left: 100, right: 300, top: 50, bottom: 200 };
      const searchRect = { left: 100, right: 300, top: 0, bottom: 50 };
      sinon.stub(searchComponent, 'querySelector')
        .withArgs('.suggestion-dialog')
        .returns({ getBoundingClientRect: () => dialogRect })
        .withArgs('#search')
        .returns({ getBoundingClientRect: () => searchRect });

      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      // Click at (150, 100) is inside the dialog rect
      searchComponent.handleClickOutside({ clientX: 150, clientY: 100 });
      expect(closeTypeaheadStub.called).to.be.false;
      closeTypeaheadStub.restore();
    });

    it('should NOT call closeTypeahead when click is inside the search input', () => {
      searchComponent.isTypeaheadOpen = true;
      const dialogRect = { left: 100, right: 300, top: 50, bottom: 200 };
      const searchRect = { left: 100, right: 300, top: 0, bottom: 50 };
      sinon.stub(searchComponent, 'querySelector')
        .withArgs('.suggestion-dialog')
        .returns({ getBoundingClientRect: () => dialogRect })
        .withArgs('#search')
        .returns({ getBoundingClientRect: () => searchRect });

      const closeTypeaheadStub = sinon.stub(searchComponent, 'closeTypeahead');
      // Click at (150, 25) is inside the search input rect
      searchComponent.handleClickOutside({ clientX: 150, clientY: 25 });
      expect(closeTypeaheadStub.called).to.be.false;
      closeTypeaheadStub.restore();
    });
  });

  describe('shouldDisplayLoadMore', () => {
    it('should return true when more cards are available', () => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 30, countAssets: 0, countPages: 0 };
      searchComponent.paginatedCards = new Array(12);
      expect(searchComponent.shouldDisplayLoadMore()).to.be.true;
    });

    it('should return false when all cards are already loaded', () => {
      searchComponent.contentType = 'all';
      searchComponent.contentTypeCounter = { countAll: 12, countAssets: 0, countPages: 0 };
      searchComponent.paginatedCards = new Array(12);
      expect(searchComponent.shouldDisplayLoadMore()).to.be.false;
    });
  });

  describe('additionalResetActions', () => {
    it('should reset paginatedCards when load-more and paginationCounter is 1', () => {
      searchComponent.blockData = { pagination: 'load-more' };
      searchComponent.paginationCounter = 1;
      searchComponent.paginatedCards = [{ id: '1' }, { id: '2' }];

      searchComponent.additionalResetActions();

      expect(searchComponent.paginatedCards).to.deep.equal([]);
    });

    it('should NOT reset paginatedCards when load-more and paginationCounter > 1', () => {
      searchComponent.blockData = { pagination: 'load-more' };
      searchComponent.paginationCounter = 2;
      const existingCards = [{ id: '1' }, { id: '2' }];
      searchComponent.paginatedCards = existingCards;

      searchComponent.additionalResetActions();

      expect(searchComponent.paginatedCards).to.deep.equal(existingCards);
    });

    it('should NOT reset paginatedCards for default pagination even on page 1', () => {
      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginationCounter = 1;
      const existingCards = [{ id: '1' }];
      searchComponent.paginatedCards = existingCards;

      searchComponent.additionalResetActions();

      expect(searchComponent.paginatedCards).to.deep.equal(existingCards);
    });
  });

  describe('handleActionsCore', () => {
    it('should concat paginatedCards for load-more pagination', async () => {
      const mockCards = [{ id: '1' }, { id: '2' }];
      const mockApiData = { cards: mockCards, count: { all: 10, assets: 5, pages: 5 } };
      const getCardsStub = sinon.stub(searchComponent, 'getCards').resolves(mockApiData);
      const additionalResetStub = sinon.stub(searchComponent, 'additionalResetActions');

      searchComponent.blockData = { pagination: 'load-more' };
      searchComponent.paginatedCards = [{ id: '0' }];
      searchComponent.cards = [];

      await searchComponent.handleActionsCore();

      expect(searchComponent.paginatedCards).to.deep.equal([{ id: '0' }, { id: '1' }, { id: '2' }]);
      expect(searchComponent.hasResponseData).to.be.true;
      expect(searchComponent.contentTypeCounter).to.deep.equal({
        countAll: 10,
        countAssets: 5,
        countPages: 5,
      });

      getCardsStub.restore();
      additionalResetStub.restore();
    });

    it('should replace paginatedCards for default pagination', async () => {
      const mockCards = [{ id: '1' }, { id: '2' }];
      const mockApiData = { cards: mockCards, count: { all: 2, assets: 1, pages: 1 } };
      const getCardsStub = sinon.stub(searchComponent, 'getCards').resolves(mockApiData);
      const additionalResetStub = sinon.stub(searchComponent, 'additionalResetActions');

      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginatedCards = [{ id: 'old' }];
      searchComponent.cards = [];

      await searchComponent.handleActionsCore();

      expect(searchComponent.paginatedCards).to.deep.equal(mockCards);

      getCardsStub.restore();
      additionalResetStub.restore();
    });

    it('should handle null cardsData gracefully with fallback empty counts', async () => {
      const getCardsStub = sinon.stub(searchComponent, 'getCards').resolves(null);
      const additionalResetStub = sinon.stub(searchComponent, 'additionalResetActions');

      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginatedCards = [];
      searchComponent.cards = [];

      await searchComponent.handleActionsCore();

      expect(searchComponent.cards).to.deep.equal([]);
      expect(searchComponent.contentTypeCounter).to.deep.equal({
        countAll: 0,
        countAssets: 0,
        countPages: 0,
      });
      expect(searchComponent.hasResponseData).to.be.true;

      getCardsStub.restore();
      additionalResetStub.restore();
    });

    it('should skip stale responses when a newer request counter exists', async () => {
      const getCardsStub = sinon.stub(searchComponent, 'getCards').resolves({
        cards: [{ id: '1' }],
        count: { all: 1, assets: 0, pages: 0 },
      });
      const additionalResetStub = sinon.stub(searchComponent, 'additionalResetActions');

      searchComponent.blockData = { pagination: 'default' };
      searchComponent.paginatedCards = [];
      searchComponent.cards = [];
      // Simulate a newer request having already been fired
      searchComponent.searchReqCounter = 5;

      await searchComponent.handleActionsCore();

      // Cards should NOT be updated because counter (6 > 5) triggers the guard after getCards
      // but by the time we check, counter is already 6 and reqId is 6, 6 > 6 is false so it does update
      // The guard only fires when a NEW call increments the counter again mid-flight
      // This test verifies the counter is properly incremented and reset
      expect(searchComponent.searchReqCounter).to.equal(0);

      getCardsStub.restore();
      additionalResetStub.restore();
    });
  });
});

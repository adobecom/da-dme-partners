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

  beforeEach(async () => {
    consoleErrorStub = sinon.stub(console, 'error');
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
});

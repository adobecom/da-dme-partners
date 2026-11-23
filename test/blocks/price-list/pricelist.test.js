import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../edsdme/blocks/pricelist/pricelist.js';
import Pricelist, { priceListKeyWords } from '../../../edsdme/blocks/pricelist/PricelistBlock.js';
import PartnerCards from '../../../edsdme/components/PartnerCards.js';
import { getLibs } from '../../../edsdme/scripts/utils.js';

const { render } = await import(`${getLibs()}/deps/lit-all.min.js`);

const pricelistsData = JSON.parse(await readFile({ path: './mocks/pricelists.json' }));

const koreanPlaceholders = {
  data: [
    { key: 'results', value: '결과' },
    { key: 'total', value: '전체' },
    { key: 'direct', value: '직접' },
    { key: 'end-user', value: '최종 사용자' },
    { key: 'include_end_user_pricelist', value: '최종 사용자 가격표 포함' },
  ],
};

const normalize = (text) => text.replace(/\s+/g, ' ').trim();

async function waitFor(condition, timeout = 3000) {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) throw new Error('Timed out waiting for condition');
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
}

function setWindowWidth(width) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

describe('Pricelist block', () => {
  describe('init (pricelist.js)', () => {
    beforeEach(async () => {
      const fetchStub = sinon.stub(window, 'fetch').callThrough();
      fetchStub.withArgs(sinon.match((url) => String(url).includes('/placeholders.json')))
        .callsFake(async () => new Response(JSON.stringify(koreanPlaceholders)));
      sinon.stub(PartnerCards.prototype, 'fetchData').callsFake(async function fetchData() {
        const apiData = structuredClone(pricelistsData);
        this.onDataFetched(apiData);
        apiData.cards.forEach((card, index) => { card.orderNum = index + 1; });
        this.allCards = apiData.cards;
        this.cards = apiData.cards;
        this.paginatedCards = this.cards.slice(0, this.cardsPerPage);
        this.hasResponseData = true;
        this.fetchedData = true;
      });

      await import('../../../edsdme/scripts/scripts.js');
      document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    });

    afterEach(() => {
      sinon.restore();
      document.body.innerHTML = '';
    });

    async function setupAndRunInit(windowWidth = 1500) {
      setWindowWidth(windowWidth);
      const app = await init(document.querySelector('.pricelist'));
      await waitFor(() => app.querySelector('.pricelist-table-toolbar'));
      await app.updateComplete;
      return app;
    }

    it('replaces the authored block with the pricelist-block element', async () => {
      const app = await setupAndRunInit();

      expect(document.querySelector('.pricelist')).to.not.exist;
      expect(app.tagName.toLowerCase()).to.equal('pricelist-block');
      expect(app.className).to.equal('content pricelist-block-wrapper');
      expect(app.getAttribute('daa-lh')).to.equal('Pricelist');
      expect(app.getAttribute('data-idx')).to.equal('0');
    });

    it('translates the results summary and the toggle label from the placeholders sheet', async () => {
      const app = await setupAndRunInit();

      const summary = app.querySelector('.pricelist-results-summary');
      expect(normalize(summary.textContent)).to.equal('결과: 2 전체 | 2 직접 | 0 최종 사용자');
      expect(summary.querySelector('strong').textContent).to.equal('결과:');
      expect(normalize(app.querySelector('.pricelist-table-toolbar sp-switch').textContent))
        .to.equal('최종 사용자 가격표 포함');
    });

    it('renders the toggle and summary above the table instead of in the sidebar', async () => {
      const app = await setupAndRunInit();

      const toolbar = app.querySelector('.pricelist-table-toolbar');
      const toggle = toolbar.querySelector('sp-switch');
      const summary = toolbar.querySelector('.pricelist-results-summary');
      const table = app.querySelector('.table-container');

      expect(toggle.compareDocumentPosition(summary)).to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(toolbar.compareDocumentPosition(table)).to.equal(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(app.querySelector('.partner-cards-sidebar sp-switch')).to.not.exist;
      expect(app.querySelectorAll('tbody tr')).to.have.length(2);
    });

    it('includes end user pricelists in the table and counts when the toggle is turned on', async () => {
      const app = await setupAndRunInit();

      const toggle = app.querySelector('.pricelist-table-toolbar sp-switch');
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change'));
      await app.updateComplete;

      expect(app.includeEndUser).to.be.true;
      expect(app.querySelectorAll('tbody tr')).to.have.length(3);
      expect(normalize(app.querySelector('.pricelist-results-summary').textContent))
        .to.equal('결과: 3 전체 | 2 직접 | 1 최종 사용자');
    });

    it('uses default pagination with all pricelists on one page on desktop', async () => {
      const app = await setupAndRunInit(1500);

      expect(app.blockData.pagination).to.equal(priceListKeyWords.PAGINATION.DEFAULT);
      expect(app.cardsPerPage).to.equal(pricelistsData.cards.length);
      expect(app.querySelector('.pagination-wrapper')).to.not.exist;
    });

    it('uses load-more pagination on mobile and keeps the toggle out of the header', async () => {
      const app = await setupAndRunInit(500);

      expect(app.blockData.pagination).to.equal(priceListKeyWords.PAGINATION.LOAD_MORE);
      expect(app.cardsPerPage).to.equal(2);
      expect(app.querySelector('.partner-cards-header .filters-btn-mobile')).to.exist;
      expect(app.querySelector('.partner-cards-header sp-switch')).to.not.exist;
      expect(app.querySelector('.pricelist-table-toolbar sp-switch')).to.exist;
    });

    it('builds only the supported filters from the API data, in a fixed order', async () => {
      const app = await setupAndRunInit();

      expect(app.blockData.filters.map((filter) => filter.key)).to.deep.equal([
        priceListKeyWords.CURRENCY,
        priceListKeyWords.MONTH,
        priceListKeyWords.BUYING_PROGRAM_TYPE,
        priceListKeyWords.REGION,
      ]);
    });
  });

  describe('Pricelist component (PricelistBlock.js)', () => {
    const localizedText = {
      '{{results}}': 'Results',
      '{{total}}': 'Total',
      '{{direct}}': 'Direct',
      '{{end-user}}': 'End user',
      '{{include_end_user_pricelist}}': 'Include end user price lists',
      '{{no-results-title}}': 'No Results Found',
      '{{no-results-description}}': 'Try again',
      '{{currency}}': 'Currency',
    };
    const directCard = (id, region = 'Asia Pacific') => ({ id, arbitrary: [{ region }, { currency: 'USD' }] });
    const endUserCard = (id) => ({ id, arbitrary: [{ region: 'Japan' }, { include_end_user_pricelist: 'true' }] });

    function createPricelist(cards = []) {
      const instance = new Pricelist();
      instance.blockData = { localizedText, filters: [] };
      instance.allCards = cards;
      instance.cards = [...cards];
      instance.paginatedCards = [];
      return instance;
    }

    function renderToContainer(template) {
      const container = document.createElement('div');
      render(template, container);
      return container;
    }

    it('detects end user pricelists by the include_end_user_pricelist entry', () => {
      const instance = createPricelist();

      expect(instance.isEndUserPricelist(endUserCard('1'))).to.be.true;
      expect(instance.isEndUserPricelist(directCard('2'))).to.be.false;
      expect(instance.isEndUserPricelist({ id: '3' })).to.be.false;
    });

    it('counts total, direct and end user pricelists from the current results', () => {
      const instance = createPricelist([directCard('1'), directCard('2'), endUserCard('3')]);

      const summary = renderToContainer(instance.getResultsSummary());

      expect(normalize(summary.textContent)).to.equal('Results: 3 Total | 2 Direct | 1 End user');
    });

    it('shows zero counts when there are no results', () => {
      const instance = createPricelist([]);

      const summary = renderToContainer(instance.getResultsSummary());

      expect(normalize(summary.textContent)).to.equal('Results: 0 Total | 0 Direct | 0 End user');
    });

    it('hides end user pricelists and pricelists without data unless the toggle is on', () => {
      const cards = [directCard('1'), endUserCard('2'), { id: '3', arbitrary: [] }];
      const instance = createPricelist(cards);

      instance.additionalActions();
      expect(instance.cards.map((card) => card.id)).to.deep.equal(['1']);

      instance.cards = [...cards];
      instance.includeEndUser = true;
      instance.additionalActions();
      expect(instance.cards.map((card) => card.id)).to.deep.equal(['1', '2']);
    });

    it('searches all pricelist values case-insensitively', () => {
      const instance = createPricelist([directCard('1', 'Asia Pacific'), directCard('2', 'Japan')]);

      instance.searchTerm = 'JAPAN';
      instance.handleSearchAction();

      expect(instance.cards.map((card) => card.id)).to.deep.equal(['2']);
    });

    it('keeps spaces in pricelist filter values but hyphenates other filter values', () => {
      const instance = createPricelist();

      expect(instance.getArbitraryTagValue({ region: 'Asia Pacific' }, 'region')).to.equal('Asia Pacific');
      expect(instance.getArbitraryTagValue({ other: 'Some Value' }, 'other')).to.equal('Some-Value');
    });

    it('creates a filter object with localized name and unchecked tags', () => {
      const instance = createPricelist();

      expect(instance.createFilterObject({ name: 'currency', tags: ['USD'] })).to.deep.equal({
        key: 'currency',
        value: 'Currency',
        tags: [{ key: 'USD', parentKey: 'currency', value: 'USD', checked: false }],
      });
    });

    it('shows the toolbar with the no-results message so the toggle stays usable', () => {
      const instance = createPricelist([]);

      const container = renderToContainer(instance.partnerCards);

      expect(container.querySelector('.pricelist-table-toolbar sp-switch')).to.exist;
      expect(container.querySelector('.no-results')).to.exist;
      expect(container.querySelector('table')).to.not.exist;
    });

    it('re-applies pagination when switching between desktop and mobile', () => {
      const instance = createPricelist([directCard('1'), directCard('2'), directCard('3')]);
      instance.blockData = { ...instance.blockData, cardsPerPage: 1, sort: { items: [] } };
      instance.paginationCounter = 2;

      instance.mobileView = true;
      instance.onViewUpdate(true);
      expect(instance.paginationCounter).to.equal(1);
      expect(instance.blockData.pagination).to.equal(priceListKeyWords.PAGINATION.LOAD_MORE);
      expect(instance.paginatedCards).to.have.length(1);

      instance.mobileView = false;
      instance.onViewUpdate(true);
      expect(instance.blockData.pagination).to.equal(priceListKeyWords.PAGINATION.DEFAULT);
      expect(instance.paginatedCards).to.have.length(3);
    });
  });
});

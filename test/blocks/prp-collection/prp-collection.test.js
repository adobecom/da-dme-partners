import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../edsdme/blocks/prp-collection/prp-collection.js';
import { filterCardsByUserRegions } from '../../../edsdme/blocks/prp-collection/prp-collection-cards.js';
import PartnerCards from '../../../edsdme/components/PartnerCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const cards = JSON.parse(cardsString);

const setPartnerRegionCookie = (permissionRegion) => {
  document.cookie = `partner_data=${JSON.stringify({ CPP: { permissionregion: permissionRegion } })}`;
  document.cookie = 'partner_info={}';
};

const getCardIds = (filteredCards) => filteredCards.map((card) => card.id);

describe('PRP Collection block', () => {
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

    const block = document.querySelector('.prp-collection');
    expect(block).to.exist;

    const component = await init(block);
    expect(component).to.exist;

    const prpCollectionWrapper = document.querySelector('.prp-collection-wrapper');
    expect(prpCollectionWrapper).to.exist;
    const partnerCardsCollection = prpCollectionWrapper.querySelector('.partner-cards-collection');
    expect(partnerCardsCollection).to.exist;
    expect(partnerCardsCollection.innerHTML).to.include('single-prp-collection-card');
    const firstCard = partnerCardsCollection.querySelector('.card-wrapper');
    expect(firstCard).to.exist;
    const searchBarWrapper = prpCollectionWrapper.querySelector('.partner-cards-sidebar .search-wrapper');
    expect(searchBarWrapper).to.exist;
    const spectrumSearch = searchBarWrapper.querySelector('#search');
    expect(spectrumSearch).to.exist;
    const paginationWrapper = prpCollectionWrapper.querySelector('.partner-cards-content .pagination-wrapper');
    expect(paginationWrapper).to.exist;
    const loadMoreBtn = prpCollectionWrapper.querySelector('.partner-cards-content .pagination-wrapper .load-more-btn');
    expect(loadMoreBtn).to.exist;
    const sortWrapper = prpCollectionWrapper.querySelector('.partner-cards-content .sort-wrapper');
    expect(sortWrapper).to.exist;
    const firstSortItem = sortWrapper.querySelector('.sort-list .sort-item');
    expect(firstSortItem).to.exist;

    return { prpCollectionWrapper };
  };

  it('should render partner cards for mobile', async () => {
    const { prpCollectionWrapper } = await setupAndCommonTest(500);

    const filtersBtn = prpCollectionWrapper.querySelector('.filters-btn-mobile');
    expect(filtersBtn).to.exist;
    const filtersWrapper = prpCollectionWrapper.querySelector('.all-filters-wrapper-mobile');
    expect(filtersWrapper).to.exist;
    const firstFilter = filtersWrapper.querySelector('.filter-wrapper-mobile');
    expect(firstFilter).to.exist;
  });

  it('should render partner cards for desktop', async () => {
    const { prpCollectionWrapper } = await setupAndCommonTest(1500);

    const sidebarFiltersWrapper = prpCollectionWrapper.querySelector('.sidebar-filters-wrapper');
    expect(sidebarFiltersWrapper).to.exist;
    const firstFilter = sidebarFiltersWrapper.querySelector('.filter');
    expect(firstFilter).to.exist;
  });

  describe('filterCardsByUserRegions', () => {
    const noRegionCardId = '7d1e9529-6702-351e-a7e8-0442100860ec';
    const northAmericaCardId = '1d2855ff-d481-3d8a-8851-d3ea88668f39';
    const worldwideCardId = 'b4e5c3d2-0f9e-5a8b-c7d6-e5f4a3b2c1d0';
    const japanCardId = 'a3f4b2c1-9e8d-4f7a-b6c5-d4e3f2a1b0c9';
    const europeWestCardId = 'c5d6e4f3-1a0b-6c9d-e8f7-a6b5c4d3e2f1';
    const unitedKingdomCardId = 'd6e7f5a4-2b1c-7d0e-f9a8-b7c6d5e4f3a2';

    beforeEach(() => {
      window.history.pushState({}, '', '/channelpartners/');
      setPartnerRegionCookie('North America');
    });

    afterEach(() => {
      document.cookie = 'partner_data=; max-age=0';
      document.cookie = 'partner_info=; max-age=0';
    });

    it('includes cards without region tags', () => {
      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(noRegionCardId);
    });

    it('includes cards tagged with worldwide region', () => {
      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(worldwideCardId);
    });

    it('includes cards that match a user region', () => {
      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(northAmericaCardId);
    });

    it('excludes cards with region tags that do not match user regions', () => {
      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.not.include(japanCardId);
    });

    it('normalizes user region values from the partner cookie', () => {
      setPartnerRegionCookie('North America,West Europe');

      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(northAmericaCardId);
      expect(getCardIds(result)).to.not.include(japanCardId);
    });

    it('includes cards matching Europe West and United Kingdom cookie values', () => {
      setPartnerRegionCookie('Europe West,United Kingdom');

      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(europeWestCardId);
      expect(getCardIds(result)).to.include(unitedKingdomCardId);
      expect(getCardIds(result)).to.include(noRegionCardId);
      expect(getCardIds(result)).to.include(worldwideCardId);
      expect(getCardIds(result)).to.not.include(japanCardId);
      expect(getCardIds(result)).to.not.include(northAmericaCardId);
    });

    it('includes cards matching Japan cookie value', () => {
      setPartnerRegionCookie('Japan');

      const result = filterCardsByUserRegions(cards);

      expect(getCardIds(result)).to.include(japanCardId);
      expect(getCardIds(result)).to.include(noRegionCardId);
      expect(getCardIds(result)).to.include(worldwideCardId);
      expect(getCardIds(result)).to.not.include(northAmericaCardId);
      expect(getCardIds(result)).to.not.include(europeWestCardId);
      expect(getCardIds(result)).to.not.include(unitedKingdomCardId);
    });
  });
});

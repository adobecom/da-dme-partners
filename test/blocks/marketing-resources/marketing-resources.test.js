import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import init from '../../../edsdme/blocks/marketing-resources/marketing-resources.js';
import PartnerCards from '../../../edsdme/components/PartnerCards.js';

const cardsString = await readFile({ path: './mocks/cards.json' });
const cardsData = JSON.parse(cardsString);
const cards = Array.isArray(cardsData) ? cardsData : (cardsData.cards || []);

describe('Marketing Resources block', () => {
  beforeEach(async () => {
    sinon.stub(PartnerCards.prototype, 'fetchData').resolves({ cards });
    // eslint-disable-next-line no-underscore-dangle
    sinon.stub(PartnerCards.prototype, 'firstUpdated').callsFake(async function () {
      this.allCards = cards;
      this.cards = cards;
      this.paginatedCards = this.cards.slice(0, 1);
      this.hasResponseData = true;
      this.fetchedData = true;
      if (this.getAllCardFilters) this.getAllCardFilters();
    });

    await import('../../../edsdme/scripts/scripts.js');
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
  });

  afterEach(() => {
    PartnerCards.prototype.fetchData.restore();
    PartnerCards.prototype.firstUpdated.restore();
  });

  async function setupAndRunInit(windowWidth = 1500) {
    Object.defineProperty(window, 'innerWidth', { value: windowWidth });
    const block = document.querySelector('.marketing-resources');
    expect(block).to.exist;
    const app = await init(block);
    expect(app).to.exist;
    expect(app.tagName.toLowerCase()).to.equal('marketing-resources-cards');
    expect(app.getAttribute('daa-lh')).to.equal('Marketing Resources Cards');
    return app;
  }

  it('replaces block with marketing-resources-cards and renders cards, search, and pagination', async () => {
    const app = await setupAndRunInit();
    expect(app).to.exist;
    const collection = app.querySelector('.partner-cards-collection');
    expect(collection).to.exist;
    expect(collection.innerHTML).to.include('single-marketing-resources-card');
    expect(app.querySelector('.card-wrapper')).to.exist;
    expect(app.querySelector('.search-wrapper sp-search')).to.exist;
    expect(app.querySelector('.pagination-wrapper')).to.exist;
    expect(app.querySelector('.load-more-btn')).to.exist;
  });

  it('renders mobile filters when viewport is narrow', async () => {
    const app = await setupAndRunInit(500);
    expect(app.querySelector('.filters-btn-mobile')).to.exist;
    expect(app.querySelector('.all-filters-wrapper-mobile')).to.exist;
  });

  it('renders desktop sidebar filters when viewport is wide', async () => {
    const app = await setupAndRunInit(1500);
    expect(app.querySelector('.sidebar-filters-wrapper')).to.exist;
  });

  describe('createFilters method', () => {
    it('creates filters from cardFiltersMap when dynamicFilters is enabled', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Verify dynamicFilters is enabled
      expect(app.blockData.dynamicFilters).to.be.true;
      expect(app.blockData.config).to.exist;

      // Ensure localizedText has the filter category keys
      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{topic}}': 'Topic',
      };

      // Create filter objects as filter method would (with empty tags arrays)
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
        {
          key: 'topic',
          value: 'Topic',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      // Set up cardFiltersMap with test data
      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign']],
        ['topic', ['onboarding', 'getting-started']],
      ]);

      // Call createFilters to populate tags
      await app.createFilters();

      // Verify filters were created
      expect(app.blockData.filters).to.be.an('array');
      expect(app.blockData.filters.length).to.be.greaterThan(0);

      // Verify filters are grouped by category
      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const topicFilter = app.blockData.filters.find((f) => f.key === 'topic');

      expect(productFilter).to.exist;
      expect(topicFilter).to.exist;

      // Verify product filter structure
      expect(productFilter.value).to.equal('Product');
      expect(productFilter.tags).to.be.an('array');
      expect(productFilter.tags.length).to.equal(2);
      expect(productFilter.hideTags).to.be.true;
      expect(productFilter.hasHiddenTags).to.be.false;

      // Verify product filter tags
      const productTags = productFilter.tags.map((t) => t.key);
      expect(productTags).to.include('adobe-acrobat');
      expect(productTags).to.include('adobe-sign');

      // Verify topic filter structure
      expect(topicFilter.value).to.equal('Topic');
      expect(topicFilter.tags).to.be.an('array');
      expect(topicFilter.tags.length).to.equal(2);

      // Verify topic filter tags
      const topicTags = topicFilter.tags.map((t) => t.key);
      expect(topicTags).to.include('onboarding');
      expect(topicTags).to.include('getting-started');
    });

    it('creates filters with correct tag structure', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter object as filter method would
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      app.cardFiltersMap = new Map([['product', ['adobe-acrobat']]]);
      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
      };

      await app.createFilters();

      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      expect(productFilter).to.exist;

      const tag = productFilter.tags[0];
      expect(tag).to.have.property('key', 'adobe-acrobat');
      expect(tag).to.have.property('parentKey', 'product');
      expect(tag).to.have.property('value');
      expect(tag).to.have.property('checked', false);
      expect(tag).to.have.property('initialHidden', false);
    });

    it('filters out categories without existing filter objects', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter object only for 'product', not for 'unknown-category'
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat']],
        ['unknown-category', ['some-value']],
      ]);

      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{unknown-category}}': 'Unknown Category',
      };

      await app.createFilters();

      // Should only have product filter with tags populated
      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const unknownFilter = app.blockData.filters.find((f) => f.key === 'unknown-category');

      expect(productFilter).to.exist;
      expect(productFilter.tags.length).to.equal(1);
      // unknown-category should not exist (no filter object was created for it)
      expect(unknownFilter).to.be.undefined;
    });

    it('handles empty cardFiltersMap gracefully', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      app.cardFiltersMap = new Map();

      await app.createFilters();

      expect(app.blockData.filters).to.be.an('array');
      // If filter objects exist from setBlockData, they should remain but with no new tags
      // If no filter objects exist, filters array should be empty
      expect(app.blockData.filters.length).to.be.at.least(0);
    });

    it('uses replaceText to get localized values for filter subcategories', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter objects as filter method would
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
        {
          key: 'topic',
          value: 'Topic',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign']],
        ['topic', ['onboarding']],
      ]);

      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{topic}}': 'Topic',
      };

      await app.createFilters();

      // Verify that filters were created with values (replaceText is called internally)
      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const topicFilter = app.blockData.filters.find((f) => f.key === 'topic');

      expect(productFilter).to.exist;
      expect(topicFilter).to.exist;

      // Verify tags have values (from replaceText processing)
      expect(productFilter.tags[0].value).to.be.a('string');
      expect(productFilter.tags[0].value.length).to.be.greaterThan(0);
      expect(topicFilter.tags[0].value).to.be.a('string');
      expect(topicFilter.tags[0].value.length).to.be.greaterThan(0);

      // Verify config is available (required for replaceText)
      expect(app.blockData.config).to.exist;
    });

    it('groups multiple tags under the same category', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter object as filter method would
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign', 'adobe-photoshop']],
      ]);

      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
      };

      await app.createFilters();

      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      expect(productFilter).to.exist;
      expect(productFilter.tags.length).to.equal(3);

      const tagKeys = productFilter.tags.map((t) => t.key);
      expect(tagKeys).to.include('adobe-acrobat');
      expect(tagKeys).to.include('adobe-sign');
      expect(tagKeys).to.include('adobe-photoshop');
    });

    it('creates filters from actual card arbitrary data', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Use the second card from mock data which has arbitrary data
      const cardWithArbitrary = cards.find((card) => card.arbitrary && card.arbitrary.length > 0);
      expect(cardWithArbitrary).to.exist;

      // Manually populate cardFiltersMap as fetchData would
      app.cardFiltersMap = new Map();
      cardWithArbitrary.arbitrary.forEach((filter) => {
        if (Object.keys(filter).length > 0) {
          const [key, value] = Object.entries(filter)[0];
          if (!app.cardFiltersMap.has(key)) {
            app.cardFiltersMap.set(key, []);
          }
          const subcategories = app.cardFiltersMap.get(key);
          if (!subcategories.includes(value)) {
            subcategories.push(value);
          }
        }
      });

      // Ensure localizedText has the necessary keys
      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{topic}}': 'Topic',
      };

      // Create filter objects as filter method would (based on arbitrary data categories)
      const categories = Array.from(new Set(
        cardWithArbitrary.arbitrary.map((filter) => Object.keys(filter)[0]),
      ));
      app.blockData.filters = categories.map((category) => ({
        key: category,
        value: app.blockData.localizedText[`{{${category}}}`] || category,
        tags: [],
        hideTags: true,
        hasHiddenTags: false,
      }));

      await app.createFilters();

      expect(app.blockData.filters).to.be.an('array');
      expect(app.blockData.filters.length).to.be.greaterThan(0);

      // Verify filters match the arbitrary data
      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const topicFilter = app.blockData.filters.find((f) => f.key === 'topic');

      if (productFilter) {
        expect(productFilter.tags.length).to.be.greaterThan(0);
      }
      if (topicFilter) {
        expect(topicFilter.tags.length).to.be.greaterThan(0);
      }
    });

    it('does not create duplicate tags when createFilters is called multiple times', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter object as filter method would
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign']],
      ]);

      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
      };

      // Call createFilters twice
      await app.createFilters();
      await app.createFilters();

      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      expect(productFilter).to.exist;
      // Should still have only 2 tags, not 4
      expect(productFilter.tags.length).to.equal(2);
    });

    it('populates tags for existing filter objects created by filter method', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Simulate filter objects created by filter method in setBlockData
      // (with empty tags arrays, as they would be when cols.length === 1 or empty <ul>)
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
        {
          key: 'topic',
          value: 'Topic',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      // Set up cardFiltersMap with test data
      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign']],
        ['topic', ['onboarding']],
      ]);

      // Ensure localizedText has the filter category keys
      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{topic}}': 'Topic',
      };

      // Call createFilters - should populate existing filter objects
      await app.createFilters();

      // Verify filters still exist (not recreated)
      expect(app.blockData.filters.length).to.equal(2);

      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const topicFilter = app.blockData.filters.find((f) => f.key === 'topic');

      expect(productFilter).to.exist;
      expect(topicFilter).to.exist;

      // Verify tags were populated (not created new)
      expect(productFilter.tags.length).to.equal(2);
      expect(topicFilter.tags.length).to.equal(1);

      // Verify tag structure
      expect(productFilter.tags[0]).to.have.property('key', 'adobe-acrobat');
      expect(productFilter.tags[0]).to.have.property('parentKey', 'product');
      expect(topicFilter.tags[0]).to.have.property('key', 'onboarding');
      expect(topicFilter.tags[0]).to.have.property('parentKey', 'topic');
    });

    it('adds filter subcategory entries to localizedText when creating filters', async () => {
      const app = await setupAndRunInit();
      await app.updateComplete;

      // Create filter objects as filter method would
      app.blockData.filters = [
        {
          key: 'product',
          value: 'Product',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
        {
          key: 'topic',
          value: 'Topic',
          tags: [],
          hideTags: true,
          hasHiddenTags: false,
        },
      ];

      // Set up cardFiltersMap with test data
      app.cardFiltersMap = new Map([
        ['product', ['adobe-acrobat', 'adobe-sign']],
        ['topic', ['onboarding']],
      ]);

      // Ensure localizedText has the filter category keys
      app.blockData.localizedText = {
        ...app.blockData.localizedText,
        '{{product}}': 'Product',
        '{{topic}}': 'Topic',
      };

      // Store initial localizedText keys to verify new ones are added
      const initialKeys = Object.keys(app.blockData.localizedText);

      // Call createFilters
      await app.createFilters();

      // Verify filters were created
      expect(app.blockData.filters).to.be.an('array');
      expect(app.blockData.filters.length).to.be.greaterThan(0);

      // Verify that localizedText now contains entries for filter subcategories
      expect(app.blockData.localizedText).to.have.property('{{adobe-acrobat}}');
      expect(app.blockData.localizedText).to.have.property('{{adobe-sign}}');
      expect(app.blockData.localizedText).to.have.property('{{onboarding}}');

      // Verify the values are strings (from replaceText processing)
      expect(app.blockData.localizedText['{{adobe-acrobat}}']).to.be.a('string');
      expect(app.blockData.localizedText['{{adobe-sign}}']).to.be.a('string');
      expect(app.blockData.localizedText['{{onboarding}}']).to.be.a('string');

      // Verify the values are not empty
      expect(app.blockData.localizedText['{{adobe-acrobat}}'].length).to.be.greaterThan(0);
      expect(app.blockData.localizedText['{{adobe-sign}}'].length).to.be.greaterThan(0);
      expect(app.blockData.localizedText['{{onboarding}}'].length).to.be.greaterThan(0);

      // Verify that the new keys were added (not present initially)
      expect(initialKeys).to.not.include('{{adobe-acrobat}}');
      expect(initialKeys).to.not.include('{{adobe-sign}}');
      expect(initialKeys).to.not.include('{{onboarding}}');

      // Verify the values match the tag values in the filters
      const productFilter = app.blockData.filters.find((f) => f.key === 'product');
      const topicFilter = app.blockData.filters.find((f) => f.key === 'topic');

      const adobeAcrobatTag = productFilter.tags.find((t) => t.key === 'adobe-acrobat');
      const adobeSignTag = productFilter.tags.find((t) => t.key === 'adobe-sign');
      const onboardingTag = topicFilter.tags.find((t) => t.key === 'onboarding');

      expect(app.blockData.localizedText['{{adobe-acrobat}}']).to.equal(adobeAcrobatTag.value);
      expect(app.blockData.localizedText['{{adobe-sign}}']).to.equal(adobeSignTag.value);
      expect(app.blockData.localizedText['{{onboarding}}']).to.equal(onboardingTag.value);
    });
  });
});

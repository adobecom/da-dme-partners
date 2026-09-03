import { getLibs, getCaasUrl } from '../../scripts/utils.js';
import { getConfig, populateLocalizedTextFromListItems, localizationPromises } from '../utils/utils.js';
import MarketingResourcesCards from './marketing-resources-cards.js';

function declareCollection() {
  if (customElements.get('marketing-resources-cards')) return;
  customElements.define('marketing-resources-cards', MarketingResourcesCards);
}

export default async function init(el) {
  performance.mark('marketing-resources-cards:start');

  const miloLibs = getLibs();
  const config = getConfig();

  const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  loadStyle('/edsdme/components/PartnerCards.css');

  const isArchive = el.classList.contains('archive');
  const sectionIndex = el.parentNode.getAttribute('data-idx');

  const localizedText = {
    '{{apply}}': 'Apply',
    '{{back}}': 'Back',
    '{{clear-all}}': 'Clear all',
    '{{filter}}': 'Filter',
    '{{filter-by}}': 'Filter by',
    '{{filters}}': 'Filters',
    '{{next}}': 'Next',
    '{{next-page}}': 'Next Page',
    '{{load-more}}': 'Load more',
    '{{no-results-description}}': 'Try checking your spelling or broadening your search.',
    '{{no-results-title}}': 'No Results Found',
    '{{of}}': 'Of',
    '{{page}}': 'Page',
    '{{prev}}': 'Prev',
    '{{previous-page}}': 'Previous Page',
    '{{results}}': 'Results',
    '{{collections}}': 'Collections',
    '{{search}}': 'Search',
    '{{type}}': 'Type',
  };

  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/search.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/checkbox.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`),
  ]);

  declareCollection();

  const block = {
    el,
    collectionTag: '"caas:adobe-partners/collections/marketing-resources"',
    ietf: config.locale.ietf,
  };

  const blockData = {
    localizedText,
    tableData: el.children,
    cardsPerPage: 8,
    pagination: 'load-more',
    isArchive,
    caasUrl: getCaasUrl(block),
    ietf: config.locale.ietf,
    collectionName: '',
    dynamicFilters: true,
    config,
  };

  const app = document.createElement('marketing-resources-cards');
  app.className = 'content marketing-resources-wrapper';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  app.setAttribute('daa-lh', 'Marketing Resources Cards');
  el.replaceWith(app);

  await deps;
  performance.mark('marketing-resources-cards:end');
  performance.measure('marketing-resources-cards block', 'marketing-resources-cards:start', 'marketing-resources-cards:end');
  return app;
}

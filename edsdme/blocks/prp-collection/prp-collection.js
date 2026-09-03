import { getLibs, getCaasUrl } from '../../scripts/utils.js';
import { getConfig, populateLocalizedTextFromListItems, localizationPromises } from '../utils/utils.js';
import PRPCollectionCards from './prp-collection-cards.js';

function declareCollection() {
  if (customElements.get('prp-collection-cards')) return;
  customElements.define('prp-collection-cards', PRPCollectionCards);
}

export default async function init(el) {
  performance.mark('prp-collection-cards:start');

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
    '{{download}}': 'Download',
    '{{filter}}': 'Filter',
    '{{filter-by}}': 'Filter by',
    '{{filters}}': 'Filters',
    '{{next}}': 'Next',
    '{{next-page}}': 'Next Page',
    '{{load-more}}': 'Load more',
    '{{no-results-description}}': 'Try checking your spelling or broadening your search.',
    '{{no-results-title}}': 'No Results Found',
    '{{of}}': 'Of',
    '{{open}}': 'Open',
    '{{page}}': 'Page',
    '{{prev}}': 'Prev',
    '{{previous-page}}': 'Previous Page',
    '{{results}}': 'Results',
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
    collectionTag: '"caas:adobe-partners/collections/prp-collection"',
    ietf: config.locale.ietf,
  };

  const blockData = {
    localizedText,
    tableData: el.children,
    cardsPerPage: 9,
    pagination: 'load-more',
    isArchive,
    caasUrl: getCaasUrl(block),
    ietf: config.locale.ietf,
    collectionName: '',
    dynamicFilters: true,
    config,
  };

  Array.from(el.children).forEach((row) => {
    const cols = Array.from(row.children);

    if (cols.length === 0) return;
    const rowTitle = cols[0].innerText.trim().toLowerCase().replace(/ /g, '-');

    if (rowTitle && rowTitle === 'collection-name') {
      blockData.collectionName = cols[1].innerText;
    }
  });

  const app = document.createElement('prp-collection-cards');
  app.className = 'content prp-collection-wrapper';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  app.setAttribute('daa-lh', 'PRP Collection Cards');
  el.replaceWith(app);

  await deps;
  performance.mark('prp-collection-cards:end');
  performance.measure('prp-collection-cards block', 'prp-collection-cards:start', 'prp-collection-cards:end');
  return app;
}

import PricelistBlock from './PricelistBlock.js';
import {
  getConfig,
  getRuntimeActionUrl,
  localizationPromises,
  populateLocalizedTextFromListItems,
} from '../utils/utils.js';
import { getLibs } from '../../scripts/utils.js';

function declarePricelist() {
  if (customElements.get('pricelist-block')) return;
  customElements.define('pricelist-block', PricelistBlock);
}
export default async function init(el) {
  const miloLibs = getLibs();
  const config = getConfig();

  const { loadStyle } = await import(`${miloLibs}/utils/utils.js`);
  loadStyle('/edsdme/components/PartnerCards.css');

  const sectionIndex = el.parentNode.getAttribute('data-idx');
  const localizedText = {
    '{{filter}}': 'Filter',
    '{{filter-by}}': 'Filter by',
    '{{filters}}': 'Filters',
    '{{open-in}}': 'Open in',
    '{{month}}': 'Month',
    '{{region}}': 'Region',
    '{{currency}}': 'Currency',
    '{{buying_program_type}}': 'Buying program',
    '{{include_end_user_pricelist}}': 'Include end user pricelist',
    '{{all}}': 'All',
    '{{apply}}': 'Apply',
    '{{assets}}': 'Assets',
    '{{back}}': 'Back',
    '{{clear-all}}': 'Clear all',
    '{{download}}': 'Download',
    '{{open-in-disabled}}': 'Open in disabled',
    '{{load-more}}': 'Load more',
    '{{next}}': 'Next',
    '{{next-page}}': 'Next Page',
    '{{no-results-description}}': 'Try checking your spelling or broadening your search.',
    '{{no-results-title}}': 'No Results Found',
    '{{of}}': 'Of',
    '{{page}}': 'Page',
    '{{pages}}': 'Pages',
    '{{prev}}': 'Prev',
    '{{previous-page}}': 'Previous Page',
    '{{results}}': 'Results',
    '{{search-topics-resources-files}}': 'Search for topics, resources or files',
    '{{show}}': 'Show',
    '{{showing-results-for}}': 'Showing results for:',
    '{{size}}': 'Size',
    '{{view-all-results}}': 'View all results',
    '{{search-here}}': 'Search here',
    '{{search}}': 'Search here',
    '{{type}}': 'Type',
    '{{action}}': 'Action',
  };
  populateLocalizedTextFromListItems(el, localizedText);

  const deps = await Promise.all([
    localizationPromises(localizedText, config),
    import(`${miloLibs}/features/spectrum-web-components/dist/theme.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/search.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/checkbox.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/switch.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/button.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/field-label.js`),
    import(`${miloLibs}/features/spectrum-web-components/dist/progress-circle.js`),
  ]);

  declarePricelist();

  const blockData = {
    localizedText,
    tableData: el.children,
    ietf: config.locale.ietf,
    pagination: 'load-more',
    caasUrl: getRuntimeActionUrl('/api/v1/web/dx-partners-runtime/pricelists-apc'),
  };

  const app = document.createElement('pricelist-block');
  app.className = 'content pricelist-block-wrapper';
  app.blockData = blockData;
  app.setAttribute('data-idx', sectionIndex);
  app.setAttribute('daa-lh', 'Pricelist');
  el.replaceWith(app);
  await deps;
  return app;
}
